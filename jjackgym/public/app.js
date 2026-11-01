// 짹짹이짐 클라이언트 — 로비, 공용 세트 타이머, 아바타, 채팅(쉬는 시간 전용), PT 쌤 질문
const $ = (s, el = document) => el.querySelector(s);

const COLOR_DEFS = {
  orange: { label: '주황', h: null },
  pink: { label: '핑크', h: 330, s: 0.55, v: 1.05 },
  sky: { label: '하늘', h: 200, s: 0.75, v: 1.0 },
  mint: { label: '민트', h: 162, s: 0.6, v: 0.95 },
  purple: { label: '보라', h: 268, s: 0.6, v: 0.95 },
  red: { label: '빨강', h: 356, s: 1.0, v: 0.88 },
};
const ANIMS = new Set(['breathe', 'nod', 'wave', 'twist', 'stretch', 'lift', 'hinge', 'squat', 'row', 'press', 'bob']);
const GEAR_ANIMS = new Set(['lift', 'row', 'press', 'squat']);
const PHASE_TEXT = { work: '세트 중', rest: '쉬는 시간', break: '라운드 휴식' };

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

// ------------------------------------------------------------------ sprite recolor
// 짹짹이 원본 나시(주황, hue 5~27°) 픽셀만 골라 색을 바꾼다. 몸(노랑)·부리·반바지는 그대로.
const sprites = {};
function rgb2hsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max / 255];
}
function hsv2rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
async function buildSprites() {
  const img = new Image();
  img.src = 'assets/jjack.png';
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  for (const [key, def] of Object.entries(COLOR_DEFS)) {
    if (def.h == null) { sprites[key] = img.src; continue; }
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, cv.width, cv.height);
    const p = data.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const [h, s, v] = rgb2hsv(p[i], p[i + 1], p[i + 2]);
      if (h >= 5 && h <= 27 && s > 0.35 && v > 0.3) {
        const [r, g, b] = hsv2rgb(def.h, Math.min(1, s * def.s), Math.min(1, v * def.v));
        p[i] = r; p[i + 1] = g; p[i + 2] = b;
      }
    }
    ctx.putImageData(data, 0, 0);
    sprites[key] = cv.toDataURL('image/png');
  }
}
const spriteFor = (color) => sprites[color] || sprites.orange || 'assets/jjack.png';

// ------------------------------------------------------------------ sound
const sound = {
  ctx: null,
  on: store.get('jg.sound', '1') === '1',
  unlock() {
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); } catch { /* no audio */ }
    }
    this.ctx?.resume?.();
  },
  beep(freq = 880, dur = 0.12, when = 0, vol = 0.18) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  tick() { this.beep(660, 0.09); },
  start() { this.beep(784, 0.14); this.beep(1047, 0.22, 0.15); },
  rest() { this.beep(523, 0.16); this.beep(392, 0.26, 0.18); },
};

// ------------------------------------------------------------------ state
const S = {
  ws: null,
  room: null,
  nick: '',
  color: 'orange',
  me: null,
  members: new Map(),
  els: new Map(),
  phase: null,
  offset: 0,
  lastBeepSec: null,
  wantOpen: false,
  retry: 0,
  tab: 'chat',
  unread: 0,
  pt: new Map(),
  coachMsgs: new Map(),
  coachTimer: null,
};

// ------------------------------------------------------------------ lobby
function renderColorPicker() {
  const box = $('#colorPicker');
  box.textContent = '';
  for (const [key, def] of Object.entries(COLOR_DEFS)) {
    const label = document.createElement('label');
    label.title = def.label;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'color';
    input.value = key;
    input.checked = key === S.color;
    input.setAttribute('aria-label', `${def.label} 나시`);
    input.addEventListener('change', () => { S.color = key; store.set('jg.color', key); });
    const img = document.createElement('img');
    img.src = spriteFor(key);
    img.alt = '';
    label.append(input, img);
    box.append(label);
  }
}

let lobbyTimer = null;
async function refreshLobby() {
  try {
    const res = await fetch('api/rooms', { cache: 'no-store' });
    const data = await res.json();
    for (const r of data.rooms) {
      const el = document.querySelector(`[data-live="${r.id}"]`);
      if (el) el.textContent = `🐥 ${r.count}명 · 지금 ${PHASE_TEXT[r.phase]} · ${r.exercise}`;
    }
  } catch {
    for (const el of document.querySelectorAll('[data-live]')) el.textContent = '서버 연결 확인 중…';
  }
}
function showLobby() {
  $('#gym').hidden = true;
  $('#lobby').hidden = false;
  document.title = '짹짹이짐 — 온라인 바른자세 스튜디오';
  refreshLobby();
  clearInterval(lobbyTimer);
  lobbyTimer = setInterval(refreshLobby, 5000);
}

$('#joinForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const room = e.submitter?.value;
  const nick = $('#nick').value.trim();
  if (!nick) { $('#nick').focus(); return; }
  if (!room) return;
  sound.unlock();
  S.nick = nick;
  S.room = room;
  store.set('jg.nick', nick);
  $('#joinError').hidden = true;
  enterGym();
});

// ------------------------------------------------------------------ connection
function wsURL() {
  const u = new URL('ws', location.href);
  u.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return u.href;
}
function send(msg) {
  if (S.ws?.readyState === WebSocket.OPEN) { S.ws.send(JSON.stringify(msg)); return true; }
  return false;
}

function enterGym() {
  clearInterval(lobbyTimer);
  S.wantOpen = true;
  S.retry = 0;
  resetGym();
  $('#lobby').hidden = true;
  $('#gym').hidden = false;
  connect();
}

function connect() {
  const ws = new WebSocket(wsURL());
  S.ws = ws;
  ws.addEventListener('open', () => send({ t: 'join', room: S.room, nick: S.nick, color: S.color }));
  ws.addEventListener('message', (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    onMessage(msg);
  });
  ws.addEventListener('close', () => {
    if (S.ws !== ws || !S.wantOpen) return;
    const wait = Math.min(15000, 1000 * 2 ** S.retry++);
    toast(`연결이 끊겼어요. ${Math.round(wait / 1000)}초 뒤 다시 연결할게요…`);
    setTimeout(() => { if (S.wantOpen && S.ws === ws) connect(); }, wait);
  });
}

function leave() {
  S.wantOpen = false;
  S.ws?.close();
  S.ws = null;
  showLobby();
}
$('#leaveBtn').addEventListener('click', leave);

// ------------------------------------------------------------------ messages
function onMessage(m) {
  switch (m.t) {
    case 'welcome': {
      S.retry = 0;
      hideToast();
      S.me = m.you;
      $('#shopName').textContent = m.shop.name;
      $('#shopTag').textContent = m.shop.tagline;
      $('#stage').dataset.shop = m.shop.id;
      $('#ptMode').textContent = m.coach === 'ai' ? '' : '(지금은 오프라인 모드 — 기본 답변만 해줘요)';
      S.members.clear();
      for (const el of S.els.values()) el.remove();
      S.els.clear();
      for (const mem of m.members) addMember(mem);
      $('#chatLog').textContent = '';
      for (const h of m.history) (h.t === 'chat' ? renderChat(h, false) : renderCoachLog(h));
      sysLine(`🐥 ${m.shop.name}에 입장! 세트는 다 같이, 채팅은 쉬는 시간에만.`, '');
      applyPhase(m, true);
      break;
    }
    case 'phase': applyPhase(m, false); break;
    case 'member_join':
      addMember(m.member);
      sysLine(`${m.member.nick} 님이 들어왔어요`, '');
      break;
    case 'member_leave': {
      const mem = S.members.get(m.id);
      removeMember(m.id);
      if (mem) sysLine(`${mem.nick} 님이 나갔어요`, '');
      break;
    }
    case 'chat':
      renderChat(m, true);
      showBubble(m.from.id, m.text);
      break;
    case 'cheer': floatEmoji(m.from, m.emoji); break;
    case 'coach': onCoach(m); break;
    case 'coach_delta': onCoachDelta(m); break;
    case 'pt_delta': onPtDelta(m); break;
    case 'pt_done': onPtDone(m); break;
    case 'error':
      if (m.code === 'full' || m.code === 'no_room') {
        S.wantOpen = false;
        showLobby();
        $('#joinError').textContent = m.message;
        $('#joinError').hidden = false;
      } else {
        toast(m.message, 2200);
      }
      break;
  }
}

// ------------------------------------------------------------------ phase / clock
const now = () => Date.now() + S.offset;

function applyPhase(p, initial) {
  S.offset = p.serverNow - Date.now();
  const prev = S.phase;
  S.phase = p;
  const stage = $('#stage');
  stage.dataset.phase = p.phase;
  const anim = ANIMS.has(p.exercise.anim) ? p.exercise.anim : 'bob';
  stage.style.setProperty('--anim', anim);
  stage.dataset.gear = GEAR_ANIMS.has(anim) ? '1' : '0';

  $('#phasePill').textContent = `${PHASE_TEXT[p.phase]} · ${p.round}라운드`;
  if (p.phase === 'work') {
    $('#exName').textContent = p.exercise.name;
    $('#exMeta').textContent = `${p.idx + 1}/${p.total} · 다음: ${p.next.name}`;
  } else {
    $('#exName').textContent = p.phase === 'break' ? '라운드 끝! 물 한 모금~' : `다음: ${p.next.name}`;
    $('#exMeta').textContent = p.phase === 'break' ? `다음 라운드 첫 동작: ${p.next.name}` : `방금 끝: ${p.exercise.name}`;
  }
  const dots = $('#dots');
  dots.textContent = '';
  for (let i = 0; i < p.total; i++) {
    const li = document.createElement('li');
    if (i < p.idx || (i === p.idx && p.phase !== 'work')) li.className = 'done';
    if (i === p.idx && p.phase === 'work') li.className = 'now';
    dots.append(li);
  }

  updateChatLock();

  if (!initial && prev && prev.phase !== p.phase) {
    if (p.phase === 'work') {
      sound.start();
      sysLine(`🏋️ 세트 시작! ${p.exercise.name} — 채팅은 잠시 잠겨요`, 'work');
      coachSay(p.exercise.cue, 8000);
    } else {
      sound.rest();
      const secs = Math.round((p.endsAt - p.startedAt) / 1000);
      sysLine(p.phase === 'break' ? `🎉 라운드 끝! ${secs}초 휴식 — 채팅 열림` : `☕ 쉬는 시간 ${secs}초! 수다 OK — 다음은 ${p.next.name}`, p.phase);
      coachSay(p.phase === 'break' ? '수고했어 짹짹이들! 물 한 모금 마시고 와~ 궁금한 건 @쌤 으로 물어봐!' : `좋아~ 잘했어! 다음은 ${p.next.name}. 쉬면서 수다 떨어도 돼!`, 6000);
    }
  } else if (initial) {
    coachSay(p.phase === 'work' ? p.exercise.cue : `어서 와 ${S.nick}! 지금은 ${PHASE_TEXT[p.phase]}이야~`, 6000);
  }
}

function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function frame() {
  const p = S.phase;
  if (p && !$('#gym').hidden) {
    const left = p.endsAt - now();
    const text = fmt(left);
    const clock = $('#clock');
    if (clock.textContent !== text) clock.textContent = text;
    const sec = Math.ceil(left / 1000);
    clock.classList.toggle('hurry', sec <= 3 && sec > 0);
    if (sec <= 3 && sec > 0 && S.lastBeepSec !== `${p.endsAt}:${sec}`) {
      S.lastBeepSec = `${p.endsAt}:${sec}`;
      sound.tick();
    }
    if (!p.chatOpen) $('#chatLockTime').textContent = text;
    document.title = `${text} ${PHASE_TEXT[p.phase]} · 짹짹이짐`;
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ avatars
// 무대 위 자리: 앞줄부터, 가운데에서 바깥으로. (x, y는 무대 % / s는 크기)
// 좁은 화면에선 오른쪽 응원 버튼과 겹치지 않게 x 범위를 줄인다.
const narrowMQ = matchMedia('(max-width: 860px)');
let SLOTS = buildSlots();
function buildSlots() {
  const narrow = narrowMQ.matches;
  const right = narrow ? 84 : 90;
  const n = narrow ? 4 : 6;
  const rows = [
    { y: 95, n, s: 1.0, x0: narrow ? 36 : 32, x1: right },
    { y: 80, n, s: 0.84, x0: narrow ? 32 : 29, x1: right + 2 },
    { y: 66, n, s: 0.7, x0: narrow ? 30 : 26, x1: right + 1 },
  ];
  const out = [];
  for (const r of rows) {
    const xs = Array.from({ length: r.n }, (_, i) => r.x0 + ((r.x1 - r.x0) * i) / (r.n - 1));
    const order = [];
    let lo = Math.floor((r.n - 1) / 2), hi = lo + 1;
    while (order.length < r.n) {
      if (lo >= 0) order.push(lo--);
      if (hi < r.n) order.push(hi++);
    }
    for (const i of order) out.push({ x: xs[i], y: r.y, s: r.s });
  }
  return out;
}
function placeAvatar(el, pos) {
  el.style.left = `${pos.x}%`;
  el.style.top = `${pos.y}%`;
  el.style.setProperty('--s', pos.s);
  el.style.setProperty('--z', Math.round(pos.y));
}
narrowMQ.addEventListener('change', () => {
  SLOTS = buildSlots();
  const all = [...S.members.values()];
  for (const el of S.els.values()) el.remove();
  S.els.clear();
  S.members.clear();
  for (const m of all) addMember(m);
});

function addMember(mem) {
  S.members.set(mem.id, mem);
  updateCount();
  const pos = SLOTS[mem.slot];
  if (!pos) { updateOverflow(); return; }
  const isMe = S.me && mem.id === S.me.id;
  const el = document.createElement('div');
  el.className = 'av' + (isMe ? ' me' : '');
  placeAvatar(el, pos);
  el.style.setProperty('--delay', `${-(Math.random() * 1.5).toFixed(2)}s`);
  el.style.setProperty('--dur', `${(1.4 + Math.random() * 0.5).toFixed(2)}s`);
  const img = document.createElement('img');
  img.className = 'sprite';
  img.src = spriteFor(mem.color);
  img.alt = '';
  const gear = document.createElement('img');
  gear.className = 'gear';
  gear.src = 'assets/dumbbell.svg';
  gear.alt = '';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = isMe ? `나 · ${mem.nick}` : mem.nick;
  el.append(img, gear, tag);
  $('#floor').append(el);
  S.els.set(mem.id, el);
  updateOverflow();
}

function removeMember(id) {
  S.members.delete(id);
  S.els.get(id)?.remove();
  S.els.delete(id);
  updateCount();
  updateOverflow();
}

function updateCount() { $('#memberCount').textContent = S.members.size; }
function updateOverflow() {
  const hidden = [...S.members.values()].filter((m) => !SLOTS[m.slot]).length;
  const el = $('#overflow');
  el.hidden = hidden === 0;
  el.textContent = `+${hidden}명 더 운동 중`;
}

function showBubble(id, text) {
  const el = S.els.get(id);
  if (!el) return;
  el.querySelector('.bubble')?.remove();
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  el.append(b);
  setTimeout(() => b.remove(), 6000);
}

function floatEmoji(id, emoji) {
  const el = S.els.get(id);
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float-emoji';
  f.textContent = emoji;
  f.style.marginLeft = `${(Math.random() * 40 - 20).toFixed(0)}px`;
  el.append(f);
  setTimeout(() => f.remove(), 1500);
}

function coachSay(text, ms = 7000) {
  const b = $('#coachBubble');
  b.textContent = text;
  b.hidden = !text;
  b.style.animation = 'none';
  void b.offsetWidth;
  b.style.animation = '';
  clearTimeout(S.coachTimer);
  if (ms) S.coachTimer = setTimeout(() => (b.hidden = true), ms);
}

for (const btn of document.querySelectorAll('[data-cheer]')) {
  btn.addEventListener('click', () => {
    send({ t: 'cheer', emoji: btn.dataset.cheer });
  });
}

// ------------------------------------------------------------------ chat
function scrollLog(log) {
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  return () => { if (nearBottom) log.scrollTop = log.scrollHeight; };
}

function sysLine(text, kind) {
  const log = $('#chatLog');
  const done = scrollLog(log);
  const li = document.createElement('li');
  li.className = `sys ${kind || ''}`;
  li.textContent = text;
  log.append(li);
  trimLog(log);
  done();
}

function trimLog(log) {
  while (log.children.length > 200) log.firstElementChild.remove();
}

function renderChat(m, live) {
  const log = $('#chatLog');
  const done = scrollLog(log);
  const mine = S.me && m.from.id === S.me.id;
  const li = document.createElement('li');
  li.className = 'msg' + (mine ? ' mine' : '');
  const who = document.createElement('span');
  who.className = 'who';
  who.textContent = m.from.nick;
  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = m.text;
  li.append(who, text);
  log.append(li);
  trimLog(log);
  if (mine) log.scrollTop = log.scrollHeight; else done();
  if (live && S.tab !== 'chat') bumpUnread();
}

function coachItem(id, to) {
  const log = $('#chatLog');
  const li = document.createElement('li');
  li.className = 'msg coach';
  const who = document.createElement('span');
  who.className = 'who';
  who.textContent = to ? `부리부리 쌤 → ${to}` : '부리부리 쌤';
  const text = document.createElement('span');
  text.className = 'text';
  li.append(who, text);
  log.append(li);
  S.coachMsgs.set(id, text);
  return text;
}

function renderCoachLog(m) {
  const text = coachItem(m.id, m.to);
  text.textContent = m.text;
}

function onCoach(m) {
  const log = $('#chatLog');
  const done = scrollLog(log);
  let text = S.coachMsgs.get(m.id) || coachItem(m.id, m.to);
  if (m.done) {
    text.textContent = m.text;
    text.classList.remove('typing');
    S.coachMsgs.delete(m.id);
    coachSay(m.text, 12000);
  } else {
    text.classList.add('typing');
  }
  done();
  if (S.tab !== 'chat') bumpUnread();
}

function onCoachDelta(m) {
  const text = S.coachMsgs.get(m.id);
  if (!text) return;
  const done = scrollLog($('#chatLog'));
  text.textContent += m.text;
  done();
}

function updateChatLock() {
  const open = !!S.phase?.chatOpen;
  $('#chatLock').hidden = open;
  $('#chatInput').disabled = !open;
  $('#chatSend').disabled = !open;
}

$('#chatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text || !S.phase?.chatOpen) return;
  if (send({ t: 'chat', text })) input.value = '';
});

// ------------------------------------------------------------------ PT (1:1)
let qseq = 0;
function ptAsk(text) {
  text = text.trim();
  if (!text) return;
  const qid = `q${Date.now()}-${qseq++}`;
  if (!send({ t: 'ask', qid, text })) { toast('연결 중이에요. 잠시 후 다시 물어봐 주세요.'); return; }
  const log = $('#ptLog');
  const q = document.createElement('li');
  q.className = 'msg mine';
  const qt = document.createElement('span');
  qt.className = 'text';
  qt.textContent = text;
  q.append(qt);
  const a = document.createElement('li');
  a.className = 'msg coach';
  const who = document.createElement('span');
  who.className = 'who';
  who.textContent = '부리부리 쌤';
  const at = document.createElement('span');
  at.className = 'text typing';
  a.append(who, at);
  log.append(q, a);
  log.scrollTop = log.scrollHeight;
  S.pt.set(qid, at);
  $('#ptSend').disabled = true;
}

function onPtDelta(m) {
  const at = S.pt.get(m.qid);
  if (!at) return;
  const done = scrollLog($('#ptLog'));
  at.textContent += m.text;
  done();
}

function onPtDone(m) {
  let at = S.pt.get(m.qid);
  if (!at) return;
  if (m.error || !at.textContent) at.textContent = m.text;
  at.classList.remove('typing');
  S.pt.delete(m.qid);
  $('#ptSend').disabled = false;
  $('#ptLog').scrollTop = $('#ptLog').scrollHeight;
}

$('#ptForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#ptInput');
  if ($('#ptSend').disabled) return;
  ptAsk(input.value);
  input.value = '';
});
for (const chip of $('#ptChips').children) {
  chip.addEventListener('click', () => { if (!$('#ptSend').disabled) ptAsk(chip.textContent); });
}

// ------------------------------------------------------------------ tabs / misc
function setTab(tab) {
  S.tab = tab;
  $('#tabChat').setAttribute('aria-selected', tab === 'chat');
  $('#tabPt').setAttribute('aria-selected', tab === 'pt');
  $('#chatPane').hidden = tab !== 'chat';
  $('#ptPane').hidden = tab !== 'pt';
  if (tab === 'chat') {
    S.unread = 0;
    $('#chatBadge').hidden = true;
    const log = $('#chatLog');
    log.scrollTop = log.scrollHeight;
  } else {
    $('#ptInput').focus();
  }
}
function bumpUnread() {
  S.unread++;
  const b = $('#chatBadge');
  b.textContent = S.unread > 99 ? '99+' : S.unread;
  b.hidden = false;
}
$('#tabChat').addEventListener('click', () => setTab('chat'));
$('#tabPt').addEventListener('click', () => setTab('pt'));

function renderSoundBtn() {
  const b = $('#soundBtn');
  b.textContent = sound.on ? '🔊' : '🔇';
  b.setAttribute('aria-pressed', sound.on);
}
$('#soundBtn').addEventListener('click', () => {
  sound.on = !sound.on;
  store.set('jg.sound', sound.on ? '1' : '0');
  sound.unlock();
  renderSoundBtn();
});

let toastTimer = null;
function toast(text, ms = 0) {
  const t = $('#toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(hideToast, ms);
}
function hideToast() { $('#toast').hidden = true; }

function resetGym() {
  S.phase = null;
  S.me = null;
  S.members.clear();
  for (const el of S.els.values()) el.remove();
  S.els.clear();
  S.pt.clear();
  S.coachMsgs.clear();
  $('#chatLog').textContent = '';
  $('#ptLog').textContent = '';
  $('#ptSend').disabled = false;
  $('#coachBubble').hidden = true;
  setTab('chat');
  updateCount();
  updateOverflow();
}

// ------------------------------------------------------------------ boot
(async function boot() {
  S.nick = store.get('jg.nick', '');
  S.color = COLOR_DEFS[store.get('jg.color', 'orange')] ? store.get('jg.color', 'orange') : 'orange';
  $('#nick').value = S.nick;
  renderSoundBtn();
  try { await buildSprites(); } catch { /* fall back to original */ }
  renderColorPicker();
  showLobby();
  requestAnimationFrame(frame);
})();
