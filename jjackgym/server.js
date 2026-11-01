import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { SHOPS, SHOP_IDS } from './lib/routines.js';
import { Room, CHEERS, COLORS, extractCoachMention, cleanText, LIMITS } from './lib/room.js';
import { chatOpen } from './lib/schedule.js';
import { askCoach, aiStatus } from './lib/coach.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, 'public');
const PORT = Number(process.env.PORT || 8787);
const MAX_PER_ROOM = Number(process.env.MAX_PER_ROOM || 50);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const PT_HISTORY_TURNS = 8;

// 개발·데모용: TIME_SCALE=0.2 이면 세트/휴식 시간이 1/5로 줄어든다.
const TIME_SCALE = Math.max(0.05, Number(process.env.TIME_SCALE || 1));
const scaled = (shop) => TIME_SCALE === 1 ? shop : {
  ...shop,
  work: Math.max(3, Math.round(shop.work * TIME_SCALE)),
  rest: Math.max(3, Math.round(shop.rest * TIME_SCALE)),
  roundBreak: Math.max(3, Math.round(shop.roundBreak * TIME_SCALE)),
};

const epoch = Date.now();
const rooms = Object.fromEntries(SHOP_IDS.map((id) => [id, new Room(scaled(SHOPS[id]), { epoch, maxMembers: MAX_PER_ROOM })]));

// ------------------------------------------------------------------ HTTP

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function sendJSON(res, code, body) {
  res.writeHead(code, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/healthz') return sendJSON(res, 200, { ok: true });
  if (url.pathname === '/api/rooms') {
    const now = Date.now();
    return sendJSON(res, 200, {
      coach: aiStatus().ai ? 'ai' : 'offline',
      rooms: SHOP_IDS.map((id) => {
        const r = rooms[id];
        const p = r.phase(now);
        return { id, name: r.shop.name, tagline: r.shop.tagline, count: r.members.size, phase: p.phase, exercise: p.exercise.name };
      }),
    });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }
  let rel;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file);
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
});

// ------------------------------------------------------------------ WebSocket

const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 4 * 1024,
  verifyClient: ({ origin }) => !ALLOWED_ORIGINS.length || ALLOWED_ORIGINS.includes(origin),
});

/** ws → { room, member, aborts:Set<AbortController> } */
const sessions = new Map();

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg, except) {
  const data = JSON.stringify(msg);
  for (const [ws, s] of sessions) {
    if (s.room === room && ws !== except && ws.readyState === ws.OPEN) ws.send(data);
  }
}

function phasePayload(room, now = Date.now()) {
  const p = room.phase(now);
  return {
    phase: p.phase,
    idx: p.idx,
    total: p.total,
    round: p.round,
    startedAt: p.startedAt,
    endsAt: p.endsAt,
    exercise: p.exercise,
    next: p.next,
    chatOpen: chatOpen(p),
    serverNow: now,
  };
}

async function coachPublic(room, member, question) {
  if (room.coachBusy) {
    broadcast(room, { t: 'coach', id: `c-${Date.now()}`, to: member.nick, text: '잠깐! 다른 짹짹이 질문 먼저 답하고 있어~', done: true });
    return;
  }
  room.coachBusy = true;
  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  broadcast(room, { t: 'coach', id, to: member.nick, text: '', done: false });
  try {
    const { text } = await askCoach({
      shop: room.shop,
      phase: room.phase(),
      nick: member.nick,
      question,
      onDelta: (d) => broadcast(room, { t: 'coach_delta', id, text: d }),
    });
    const msg = { t: 'coach', id, to: member.nick, text, done: true, at: Date.now() };
    room.pushHistory(msg);
    broadcast(room, msg);
  } catch (e) {
    broadcast(room, { t: 'coach', id, to: member.nick, text: '앗, 쌤이 잠깐 자리를 비웠어. 다시 불러줘!', done: true });
  } finally {
    room.coachBusy = false;
  }
}

async function coachPrivate(ws, s, qid, question) {
  const { room, member } = s;
  const ctrl = new AbortController();
  s.aborts.add(ctrl);
  member.askBusy = true;
  try {
    const { text, userContent } = await askCoach({
      shop: room.shop,
      phase: room.phase(),
      nick: member.nick,
      question,
      history: member.ptHistory,
      signal: ctrl.signal,
      onDelta: (d) => send(ws, { t: 'pt_delta', qid, text: d }),
    });
    // 텍스트만 저장한다(thinking 블록 제외). 오래된 턴을 앞에서 잘라내는 슬라이딩 윈도우라서,
    // thinking 블록을 남겨 두면 preserved thinking의 prefix 검사에 걸린다. 전부 빼면 검사 대상이 없다.
    member.ptHistory.push({ role: 'user', content: userContent }, { role: 'assistant', content: text || '…' });
    if (member.ptHistory.length > PT_HISTORY_TURNS * 2) member.ptHistory.splice(0, member.ptHistory.length - PT_HISTORY_TURNS * 2);
    send(ws, { t: 'pt_done', qid, text });
  } catch (e) {
    if (!ctrl.signal.aborted) send(ws, { t: 'pt_done', qid, text: '앗, 쌤 연결이 끊겼어. 다시 물어봐 줄래?', error: true });
  } finally {
    member.askBusy = false;
    s.aborts.delete(ctrl);
  }
}

function handle(ws, msg) {
  const s = sessions.get(ws);

  if (msg.t === 'join') {
    if (s) return send(ws, { t: 'error', code: 'already_joined', message: '이미 입장했어요.' });
    const room = rooms[msg.room];
    if (!room) return send(ws, { t: 'error', code: 'no_room', message: '없는 샵이에요.' });
    let member;
    try {
      member = room.join({ nick: msg.nick, color: msg.color });
    } catch (e) {
      send(ws, { t: 'error', code: e.code || 'join_failed', message: e.message });
      return ws.close(4000, 'join failed');
    }
    sessions.set(ws, { room, member, aborts: new Set() });
    send(ws, {
      t: 'welcome',
      you: room.publicMember(member),
      shop: { id: room.shop.id, name: room.shop.name, tagline: room.shop.tagline, routine: room.shop.routine },
      members: room.roster(),
      history: room.history,
      coach: aiStatus().ai ? 'ai' : 'offline',
      limits: { chat: LIMITS.chat, ask: LIMITS.ask },
      ...phasePayload(room),
    });
    broadcast(room, { t: 'member_join', member: room.publicMember(member) }, ws);
    return;
  }

  if (!s) return send(ws, { t: 'error', code: 'not_joined', message: '먼저 입장해 주세요.' });
  const { room, member } = s;

  switch (msg.t) {
    case 'chat': {
      const r = room.checkChat(member, msg.text);
      if (!r.ok) return send(ws, { t: 'error', code: r.code, message: r.message, opensAt: r.opensAt });
      const out = { t: 'chat', id: `m-${Date.now()}-${member.slot}`, from: room.publicMember(member), text: r.text, at: Date.now() };
      room.pushHistory(out);
      broadcast(room, out);
      const q = extractCoachMention(r.text);
      if (q) coachPublic(room, member, q);
      return;
    }
    case 'cheer': {
      if (room.checkCheer(member, msg.emoji)) broadcast(room, { t: 'cheer', from: member.id, emoji: msg.emoji });
      return;
    }
    case 'ask': {
      const qid = cleanText(msg.qid, 40) || `q-${Date.now()}`;
      const r = room.checkAsk(member, msg.text);
      if (!r.ok) return send(ws, { t: 'pt_done', qid, text: r.message, error: true });
      coachPrivate(ws, s, qid, r.text);
      return;
    }
    case 'ping':
      return send(ws, { t: 'pong', serverNow: Date.now() });
    default:
      return send(ws, { t: 'error', code: 'unknown', message: '알 수 없는 요청' });
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg && typeof msg.t === 'string') handle(ws, msg);
  });
  ws.on('close', () => {
    const s = sessions.get(ws);
    if (!s) return;
    sessions.delete(ws);
    for (const c of s.aborts) c.abort();
    s.room.leave(s.member.id);
    broadcast(s.room, { t: 'member_leave', id: s.member.id });
  });
});

// 세트/휴식 전환 방송
const lastKey = {};
setInterval(() => {
  const now = Date.now();
  for (const id of SHOP_IDS) {
    const room = rooms[id];
    const p = room.phase(now);
    if (lastKey[id] !== p.key) {
      lastKey[id] = p.key;
      broadcast(room, { t: 'phase', ...phasePayload(room, now) });
    }
  }
}, 200);

// 죽은 연결 정리
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

server.listen(PORT, () => {
  const st = aiStatus();
  console.log(`🐥 짹짹이짐 http://localhost:${PORT}  (PT 쌤: ${st.ai ? `AI ${st.model}` : `오프라인 — ${st.reason}`})`);
  console.log(`   shops: ${SHOP_IDS.join(', ')} · colors: ${COLORS.join(', ')} · cheers: ${CHEERS.join(' ')}`);
});
