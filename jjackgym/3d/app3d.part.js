// 짹짹이짐 ONLINE 3D — claude.ai 공유 페이지 버전
// 3D 엔진·캐릭터·기구·동작: 「짹짹이 모션 스튜디오」 (window.GymEngine)
// 규칙: 기구는 한 명씩(쓰는 중이면 줄 서기) / 누를 때마다 동작 1회 / 세트를 끝내면 1~3분 랜덤 휴식, 그때만 채팅 / PT는 체험 1회 후 이용권.
// 접속자·기구 점유·줄·위치·몸짓은 room presence, 채팅은 room 이벤트, 부리부리 쌤은 sample(보는 사람의 Claude).
const $ = (s, el = document) => el.querySelector(s);
const G = window.GymEngine;
const T = G.THREE;

// ------------------------------------------------------------------ 규칙 숫자 (여기만 바꾸면 됨)
const RULES = {
  setsPerStation: 3,
  restMinSec: 60,
  restMaxSec: 180,
  trialQuestions: 3, // 체험 PT 1회 = 질문 3개
  jjakScale: 1.4,    // 짹짹이 크기 (기구에 맞춤)
  repSpeed: 1.4,     // 동작 재생 속도
  walkAnim: 3.0,     // 걷기 동작 재생 속도
  moveSpeed: 1.25,   // 걷는 속도 (m/초)
  queueStep: 0.7,    // 줄 간격 (m)
  idleHoldSec: 90,   // 줄이 있는데 이만큼 멈춰 있으면 다음 사람에게 넘김
  coachWalkSec: 30,  // 부리부리 쌤이 자리를 옮기는 간격
  gestureGapMs: 900, // 몸짓 연타 막기
};

// ------------------------------------------------------------------ 샵 · 기구
// prop/idx: 세트 안의 기구 / add: 따로 깔아 주는 기구 / stand: 서서 하는 운동 위치(기구 기준)
const SHOPS = {
  pilates: {
    id: 'pilates', set: 'pilates', name: '필라테스샵', tagline: '리포머 2대 · 매트 4장', reps: 10,
    coachSpots: [{ x: 3.1, z: -1.5 }, { x: 0, z: -2.6 }, { x: -3.1, z: -1.2 }, { x: 3.1, z: 1.2 }], spawn: { x: 0, z: 2.2 },
    stations: [
      { id: 'rf1', prop: 'reformer', idx: 0, name: '리포머 1', ex: '풋워크', preset: 'rfFootwork', cue: '발바닥 전체로 밀고, 골반은 중립! 허리 들리지 않게~' },
      { id: 'rf2', prop: 'reformer', idx: 1, name: '리포머 2', ex: '암 풀', preset: 'rfArmPull', cue: '어깨 으쓱 말고 날개뼈부터! 팔로만 당기지 마~' },
      { id: 'm1', add: { prop: 'yogaMat', x: -1.35, z: -0.8 }, name: '매트 1', ex: '브릿지', preset: 'bridge', cue: '허리로 들어 올리지 마! 엉덩이로 밀어 올려~' },
      { id: 'm2', add: { prop: 'yogaMat', x: 1.35, z: -0.8 }, name: '매트 2', ex: '헌드레드', preset: 'hundred', cue: '목에 힘 빼고 배로 버텨! 숨은 짧게 끊어서~' },
      { id: 'm3', add: { prop: 'yogaMat', x: -1.35, z: 0.7 }, name: '매트 3', ex: '캣 / 카우', preset: 'catCow', cue: '목만 까딱하면 안 돼! 척추 전체를 움직여봐' },
      { id: 'm4', add: { prop: 'yogaMat', x: 1.35, z: 0.7 }, name: '매트 4', ex: '데드버그', preset: 'deadBug', cue: '허리가 바닥에서 뜨지 않게! 배에 힘 꽉!' },
    ],
  },
  weight: {
    id: 'weight', set: 'gym', name: '웨이트샵', tagline: '스쿼트 랙 · 벤치 · 덤벨 · 케틀벨 · 매트', reps: 12,
    coachSpots: [{ x: 3.2, z: 0.4 }, { x: 2.0, z: -2.6 }, { x: -3.4, z: 1.0 }, { x: 2.6, z: -1.6 }], spawn: { x: 0, z: 2.0 },
    stations: [
      { id: 'rack', prop: 'squatRack', idx: 0, stand: { dx: 0, dz: 0 }, name: '스쿼트 랙', ex: '백 스쿼트', preset: 'backSquat', cue: '엉덩이를 뒤로 빼면서 앉아! 무릎은 발끝 방향~' },
      { id: 'bench', prop: 'flatBench', idx: 0, name: '벤치', ex: '벤치프레스', preset: 'bench', cue: '어깨 말리지 않게 가슴 활짝! 날개뼈는 벤치에 붙여~' },
      { id: 'db', prop: 'dumbbellRack', idx: 0, stand: { dx: 0, dz: 0.75 }, name: '덤벨 랙', ex: '덤벨 컬', preset: 'curl', cue: '팔꿈치는 옆구리에 고정! 반동 쓰지 말고 천천히~' },
      { id: 'kb', prop: 'kettlebell', idx: 0, stand: { dx: 0.1, dz: 0.75 }, name: '케틀벨', ex: '케틀벨 스윙', preset: 'kbSwing', cue: '팔로 들지 말고 엉덩이로 튕겨! 허리는 길게~' },
      { id: 'mat', prop: 'yogaMat', idx: 0, name: '매트', ex: '푸시업', preset: 'pushup', cue: '엉덩이 처지지 않게 몸통 일자로! 무릎 대도 OK~' },
      { id: 'mat2', add: { prop: 'yogaMat', x: 1.0, z: 0.4 }, name: '매트 2', ex: '힙 브릿지', preset: 'hipBridge', cue: '허리 꺾지 말고 엉덩이 꽉! 갈비뼈는 닫고~' },
    ],
  },
};
const stationOf = (shopId, id) => SHOPS[shopId]?.stations.find((s) => s.id === id) || null;
const BOUNDS = { x0: -4.9, x1: 4.9, z0: -3.6, z1: 2.8 };

// ------------------------------------------------------------------ helpers
const COLOR_DEFS = {
  orange: { label: '주황', h: null, hex: 0xF07D28 },
  pink: { label: '핑크', h: 330, s: 0.55, v: 1.05, hex: 0xF29BC0 },
  sky: { label: '하늘', h: 200, s: 0.75, v: 1.0, hex: 0x5DB7E3 },
  mint: { label: '민트', h: 162, s: 0.6, v: 0.95, hex: 0x5CCDAE },
  purple: { label: '보라', h: 268, s: 0.6, v: 0.95, hex: 0xA486E0 },
  red: { label: '빨강', h: 356, s: 1.0, v: 0.88, hex: 0xE04848 },
};
const GESTURES = {
  wave: { label: '인사', preset: 'wave', emoji: '👋' },
  clap: { label: '박수', preset: 'clap', emoji: '👏' },
  thumbs: { label: '엄지척', preset: 'thumbs', emoji: '👍' },
  hooray: { label: '만세', preset: 'hooray', emoji: '🙌' },
};
const COACH_MURMURS = ['숨 참지 말고 천천히~', '어깨 힘 빼고!', '허리 말고 엉덩이로!', '쉬는 것도 운동이야.', '오늘 자세 좋은데?'];
const LIMIT = { nick: 12, chat: 140, ask: 300 };
const BAD_CHARS = new RegExp('[' + [[0, 31], [127, 127], [0x200b, 0x200f], [0x2028, 0x202e], [0x2066, 0x2069]]
  .map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']', 'g');
function cleanText(input, max) {
  const s = String(input ?? '').replace(BAD_CHARS, ' ').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, max).join('');
}
const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
};
const FAST = store.get('jg.fast', '') === '1'; // 개발용: 쉬는 시간 3~6초, 세트당 3회
if (FAST) for (const sh of Object.values(SHOPS)) sh.reps = 3;
const randomRestMs = () => FAST ? 3000 + Math.random() * 3000
  : (RULES.restMinSec + Math.random() * (RULES.restMaxSec - RULES.restMinSec)) * 1000;
function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ 로비 미리보기 (2D 일러스트 나시 색)
const sprites = {};
function rgb2hsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, max ? d / max : 0, max / 255];
}
function hsv2rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
async function buildSprites() {
  const img = new Image();
  img.src = 'jjack.png';
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  for (const [key, def] of Object.entries(COLOR_DEFS)) {
    if (def.h == null) { sprites[key] = img.src; continue; }
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, cv.width, cv.height), p = data.data;
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
const spriteFor = (color) => sprites[color] || 'jjack.png';

// ------------------------------------------------------------------ sound
const sound = {
  ctx: null,
  on: store.get('jg.sound', '1') === '1',
  unlock() { if (!this.ctx) { try { this.ctx = new AudioContext(); } catch { /* 소리 없음 */ } } this.ctx?.resume?.(); },
  beep(freq = 880, dur = 0.12, when = 0, vol = 0.16) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  rep() { this.repPlayed = (this.repPlayed || 0) + 1; this.beep(620, 0.07, 0, 0.12); }, // 운동 효과음은 누른 사람에게만 난다
  setDone() { this.beep(784, 0.14); this.beep(988, 0.14, 0.13); this.beep(1319, 0.24, 0.26); },
  restOver() { this.beep(523, 0.14); this.beep(784, 0.22, 0.15); },
  tick() { this.beep(660, 0.09); },
  gesture() { this.beep(740, 0.06, 0, 0.06); },
  turn() { this.beep(659, 0.14); this.beep(880, 0.2, 0.14); },
};

// 은은한 짐 소리: 파일 없이 합성 (공기 소리 + 가끔 먼 곳의 쇠 부딪는 소리 / 매트 소리)
const ambient = {
  on: store.get('jg.ambient', '1') === '1',
  kind: null, master: null, src: null, timer: null,
  level() { return this.on && sound.on ? 1 : 0; },
  start(kind) {
    this.kind = kind;
    this.apply();
  },
  stop() { this.kind = null; this.apply(); },
  apply() {
    const want = this.kind && this.level() && sound.ctx;
    if (!want) { this.teardown(); return; }
    if (this.master) return;
    const ctx = sound.ctx;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5);
    this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    this.src = ctx.createBufferSource();
    this.src.buffer = buf; this.src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = this.kind === 'weight' ? 420 : 300;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    this.src.connect(lp).connect(g).connect(this.master);
    this.src.start();
    this.schedule();
  },
  teardown() {
    clearTimeout(this.timer); this.timer = null;
    if (!this.master) return;
    const m = this.master, s = this.src, ctx = sound.ctx;
    this.master = null; this.src = null;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { try { s.stop(); } catch { /* 이미 멈춤 */ } m.disconnect(); }, 500);
  },
  schedule() {
    this.timer = setTimeout(() => {
      if (!this.master) return;
      if (this.kind === 'weight') this.clink(); else this.mat();
      this.schedule();
    }, 7000 + Math.random() * 16000);
  },
  voice(type, freq, dur, vol, when, pan) {
    const ctx = sound.ctx, t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    o.type = type; o.frequency.value = freq; p.pan.value = pan;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(p).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  clink() {
    const pan = Math.random() * 1.4 - 0.7, n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const w = i * (0.16 + Math.random() * 0.1), f = 0.9 + Math.random() * 0.25;
      this.voice('triangle', 1760 * f, 0.32, 0.016, w, pan);
      this.voice('triangle', 2790 * f, 0.2, 0.009, w, pan);
    }
    if (Math.random() < 0.4) this.voice('sine', 92, 0.2, 0.04, 0, pan);
  },
  mat() {
    const pan = Math.random() * 1.2 - 0.6;
    this.voice('sine', 118, 0.26, 0.035, 0, pan);
    if (Math.random() < 0.5) this.voice('sine', 330, 0.5, 0.006, 0.05, pan);
  },
};

// ------------------------------------------------------------------ state
const S = {
  shop: null,
  tab: 'chat',
  unread: 0,
  lastChatAt: 0,
  lastGestureAt: 0,
  panelAuto: false,
  coachSlot: null,
  coachBusyUntil: 0,
  lastBeep: null,
  lastPresenceAt: 0,
  ptTurns: [],
  ptBusy: false,
  announce: false,
  me: {
    nick: '', color: 'orange',
    station: null, claimedAt: 0, on: false, // on: 기구에 올라가 있음
    queue: null, queuedAt: 0,               // 줄 서 있는 기구
    gest: null, gestN: 0,                   // 몸짓: 숫자가 올라가면 한 번 재생
    state: 'idle', reps: 0, set: 1, restUntil: 0, lastActAt: 0,
  },
  meA: null,          // 내 3D 짹짹이
  coach: null,        // 부리부리 쌤 3D
  stationObj: {},     // 기구 id → 3D 물체
  remotes: new Map(), // peer → {A, nick, color, mounted, reps, tag, target}
  tags: new Map(),    // key → tag element
  walk: new Map(),    // actor → {x, z, then}
  modelsReady: false,
};
let room = null;
let sample = null;
const capability = (name) => (window.claude?.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null));

function syncPresence(force = false) {
  if (!room || !S.shop) return;
  const now = Date.now();
  if (!force && now - S.lastPresenceAt < 180) return;
  S.lastPresenceAt = now;
  const m = S.me, A = S.meA;
  room.presence({
    nick: m.nick, color: m.color, shop: S.shop,
    station: m.station, claimedAt: m.claimedAt, on: m.on,
    queue: m.queue, queuedAt: m.queuedAt, gest: m.gest, gestN: m.gestN,
    state: m.state, reps: m.reps, set: m.set, restUntil: m.restUntil,
    x: A ? Math.round(A.place.x * 100) / 100 : null,
    z: A ? Math.round(A.place.z * 100) / 100 : null,
  }).catch(() => {});
}

// ------------------------------------------------------------------ 3D: 배우 · 걷기 · 기구
const presetClip = (id) => G.presetClip(G.presetById(id));

function makeJjak(x, z, color) {
  const A = G.addActor('jjak', { x, z });
  if (!A) return null;
  A.place.s = RULES.jjakScale;
  G.applyPlace(A);
  paint(A, color);
  return A;
}
function paint(A, color) {
  const def = COLOR_DEFS[color] || COLOR_DEFS.orange;
  if (A._color === color) return;
  A._color = color;
  for (const m of A.inst.meshes) if (m.userData.matName === 'shirt_orange') {
    if (!m.userData._own) { m.material = m.material.clone(); m.userData._own = true; }
    m.material.color.setHex(def.hex);
  }
}
function setIdle(A) { A.speed = 1; G.setClip(A, presetClip('idle'), { blend: 0.25 }); }
function setWalkClip(A) { A.speed = RULES.walkAnim; G.setClip(A, presetClip('walk'), { blend: 0.2 }); }

function walkTo(A, x, z, then) {
  x = clamp(x, BOUNDS.x0, BOUNDS.x1); z = clamp(z, BOUNDS.z0, BOUNDS.z1);
  const was = S.walk.get(A);
  S.walk.set(A, { x, z, then });
  if (!was) setWalkClip(A);
}
function stepWalkers(dt) {
  for (const [A, w] of S.walk) {
    if (!A.root.parent) { S.walk.delete(A); continue; }
    const dx = w.x - A.place.x, dz = w.z - A.place.z, d = Math.hypot(dx, dz);
    const v = RULES.moveSpeed;
    if (d < 0.03) {
      S.walk.delete(A);
      if (w.then) w.then(); else setIdle(A);
      if (A === S.meA) syncPresence(true);
      continue;
    }
    const k = Math.min(1, (v * dt) / d);
    A.place.ry = Math.atan2(dx, dz) * 180 / Math.PI;
    A.place.x += dx * k; A.place.z += dz * k;
    G.applyPlace(A);
    if (A === S.meA) syncPresence();
  }
}

/** 기구 위치(서서 하는 운동은 기구 앞, 누워서 하는 운동은 엔진이 맞춰 줌) */
function approachPoint(st) {
  const o = S.stationObj[st.id];
  const p = o.getWorldPosition(new T.Vector3());
  if (st.stand) return { x: p.x + st.stand.dx, z: p.z + st.stand.dz };
  return { x: p.x, z: p.z + 0.9 };
}
function mountActor(A, st) {
  S.walk.delete(A);
  A.speed = RULES.repSpeed;
  const obj = S.stationObj[st.id];
  if (st.stand) {
    const ap = approachPoint(st);
    G.setClip(A, presetClip(st.preset), {
      loop: false, blend: 0.2,
      beforeMeasure: (B) => {
        B.seatH = 0; B.reformer = null;
        B.place.x = ap.x; B.place.z = ap.z; B.place.ry = 0; B.place.elev = G.floorAt(ap.x, ap.z);
        G.applyPlace(B);
      },
    });
  } else {
    G.mountStation(A, obj, st.preset);
    A.loop = false;
  }
  holdRep(A);
}
/** 동작 끝 자세로 멈춰 두기 (대부분 처음 자세와 같음) */
function holdRep(A) { A.start = G.clock.t - G.clipDur(A.clip) / A.speed - 0.01; }
function playRep(A) { A.start = G.clock.t; }
function repBusy(A) { return (G.clock.t - A.start) * A.speed < G.clipDur(A.clip) - 0.05; }
function unmountActor(A, st) {
  const ap = st ? approachPoint(st) : { x: A.place.x, z: A.place.z + 0.6 };
  G.leaveStation(A, ap.x, ap.z + (st && !st.stand ? 0 : 1.0)); // 다음 사람과 겹치지 않게 비켜 섬
  A.speed = 1;
}

function faceTo(A, x, z) {
  A.place.ry = Math.atan2(x - A.place.x, z - A.place.z) * 180 / Math.PI;
  G.applyPlace(A);
}
function playCoach(id) {
  const B = S.coach;
  if (!B) return;
  S.walk.delete(B);
  B.speed = 1;
  S.coachBusyUntil = Date.now() + 4000;
  G.playOnce(B, id, 'armsCross', { blend: 0.25 });
}
/** 새로 온 사람을 쳐다보고 손 흔들며 인사 (각자 화면에서 똑같이 일어남) */
function coachGreet(nick, A) {
  const B = S.coach;
  if (!B) return;
  if (A) faceTo(B, A.place.x, A.place.z);
  S.lastGreet = nick;
  playCoach('wave');
  coachSay(`어서 와 ${nick}! 빈 기구 하나 골라봐~`, 6000);
}
// 쌤 자리: 시각으로 정해져서 접속한 사람 모두에게 같은 곳으로 보임
const coachSlotAt = (ms) => Math.floor(ms / (RULES.coachWalkSec * 1000));
const slotPick = (slot, n) => ((Math.imul(slot, 2654435761) >>> 0) >>> 13) % n;
function stepCoach(now) {
  const B = S.coach, shop = SHOPS[S.shop];
  if (!B || !B.root.parent) return;
  const slot = coachSlotAt(now);
  if (slot === S.coachSlot || now < S.coachBusyUntil) return;
  S.coachSlot = slot;
  const p = shop.coachSpots[slotPick(slot, shop.coachSpots.length)];
  if (Math.hypot(p.x - B.place.x, p.z - B.place.z) < 0.1) return;
  walkTo(B, p.x, p.z, () => {
    B.speed = 1;
    B.place.ry = 0; G.applyPlace(B);
    G.setClip(B, presetClip('armsCross'), { blend: 0.25 });
    if (slot % 3 === 0) coachSay(COACH_MURMURS[slotPick(slot, COACH_MURMURS.length)], 3500);
  });
}

// ------------------------------------------------------------------ 3D 장면 만들기
function buildShop(shopId) {
  const shop = SHOPS[shopId];
  for (const A of G.actors.slice()) G.removeActor(A);
  S.walk.clear();
  S.remotes.clear();
  const set = G.setSet(shop.set);
  const byProp = {};
  for (const o of set.children) {
    const id = o.userData && o.userData.id;
    if (id && G.AS.props[id]) (byProp[id] ||= []).push(o);
  }
  S.stationObj = {};
  for (const st of shop.stations) {
    if (st.add) {
      const o = G.AS.props[st.add.prop].build();
      o.position.set(st.add.x, 0, st.add.z);
      set.add(o);
      S.stationObj[st.id] = o;
    } else {
      S.stationObj[st.id] = (byProp[st.prop] || [])[st.idx || 0];
    }
  }
  set.updateMatrixWorld(true);
  // 부리부리 쌤
  S.coachSlot = coachSlotAt(Date.now());
  S.coachBusyUntil = 0;
  const cs = shop.coachSpots[slotPick(S.coachSlot, shop.coachSpots.length)];
  const B = G.addActor('buri', { x: cs.x, z: cs.z });
  B.place.s = 0.8; G.applyPlace(B);
  G.setClip(B, presetClip('armsCross'), { blend: 0 });
  S.coach = B;
  // 나
  const sx = shop.spawn.x + (Math.random() - 0.5) * 2.4, sz = shop.spawn.z + Math.random() * 0.4;
  S.meA = makeJjak(sx, sz, S.me.color);
  S.meA.place.ry = 180; G.applyPlace(S.meA);
  // 카메라
  const narrow = matchMedia('(max-width: 860px)').matches;
  if (narrow) G.sun.shadow.mapSize.set(1024, 1024); // 휴대폰은 그림자를 가볍게
  S.followX = narrow ? 1 : 0.5; // 휴대폰은 화면이 좁아 내 짹짹이를 가운데에 둔다
  G.cam.position.set(sx * S.followX, narrow ? 8.8 : 6.0, sz + (narrow ? 11 : 8.4));
  G.orbit.target.set(sx * S.followX, 0.6, sz - 2.2);
  G.orbit.enablePan = false; G.orbit.minDistance = 3; G.orbit.maxDistance = narrow ? 24 : 16; G.orbit.maxPolarAngle = Math.PI * 0.45;
  G.orbit.update();
  buildTags();
}

// 카메라·그림자가 내 짹짹이를 따라감
const _tgt = new T.Vector3();
function followCam(dt) {
  const A = S.meA;
  if (!A || !A.root.parent) return;
  _tgt.set(A.place.x * S.followX, 0.6, A.place.z - 1.6);
  const k = 1 - Math.exp(-dt * 2.5);
  const dx = (_tgt.x - G.orbit.target.x) * k, dz = (_tgt.z - G.orbit.target.z) * k;
  G.orbit.target.x += dx; G.orbit.target.z += dz;
  G.cam.position.x += dx; G.cam.position.z += dz;
  G.sun.position.set(A.place.x + 2.5, 5, A.place.z + 4);
  G.sun.target.position.set(A.place.x, 0, A.place.z);
}

// ------------------------------------------------------------------ 이름표 · 기구 표시 (HTML)
function buildTags() {
  const box = $('#tags');
  box.textContent = '';
  S.tags.clear();
  const bar = $('#stnbar');
  bar.textContent = '';
  for (const st of SHOPS[S.shop].stations) {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'pick';
    c.id = `pick-${st.id}`;
    const nm = document.createElement('b');
    nm.textContent = st.name;
    const sub = document.createElement('small');
    c.append(nm, sub);
    c.addEventListener('click', () => claimStation(st.id));
    bar.append(c);
  }
  tagFor('me', true);
  const ct = tagFor('coach');
  ct.classList.add('coach');
  ct.querySelector('.nm').textContent = '부리부리 쌤 · AI';
}
function tagFor(key, me = false) {
  let el = S.tags.get(key);
  if (el) return el;
  el = document.createElement('div');
  el.className = 'tag3' + (me ? ' me' : '');
  const nm = document.createElement('span');
  nm.className = 'nm';
  const st = document.createElement('span');
  st.className = 'st';
  el.append(st, nm);
  $('#tags').append(el);
  S.tags.set(key, el);
  return el;
}
function dropTag(key) { S.tags.get(key)?.remove(); S.tags.delete(key); }

const _v = new T.Vector3();
function project(x, y, z) {
  _v.set(x, y, z).project(G.cam);
  const view = $('#view');
  return { x: (_v.x + 1) / 2 * view.clientWidth, y: (1 - _v.y) / 2 * view.clientHeight, vis: _v.z < 1 && _v.z > -1 };
}
function placeTag(el, A, yOff) {
  const head = G.wp(A, A.headBone);
  const p = project(head.x, head.y + yOff, head.z);
  el.classList.toggle('hidden', !p.vis);
  el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
}
function updateTags() {
  if (!S.shop || !S.meA) return;
  const now = Date.now();
  const me = S.me;
  const meTag = S.tags.get('me');
  if (meTag) {
    meTag.querySelector('.nm').textContent = `나 · ${me.nick}`;
    meTag.querySelector('.st').textContent = statusText(me, now);
    meTag.classList.toggle('resting', me.state === 'rest');
    placeTag(meTag, S.meA, 0.42);
  }
  if (S.coach) placeTag(S.tags.get('coach'), S.coach, 0.3);
  for (const [peer, R] of S.remotes) {
    const el = tagFor(peer);
    el.querySelector('.nm').textContent = R.nick;
    el.querySelector('.st').textContent = statusText(R, now);
    el.classList.toggle('resting', R.state === 'rest');
    placeTag(el, R.A, 0.42);
  }
}
function statusText(m, now) {
  if (m.state === 'rest') return `휴식 ${fmt(m.restUntil - now)}`;
  if (m.state === 'set' && m.on) return `${m.reps}/${SHOPS[S.shop].reps}`;
  return '';
}

// ------------------------------------------------------------------ 사람들 · 기구 주인
function members() {
  const self = room?.peers().find((p) => p.sameTab);
  const list = [{ ...S.me, peer: 'me', me: true, pid: self ? self.peer : '' }];
  if (!room) return list;
  for (const p of room.peers()) {
    if (p.kind !== 'viewer' || p.sameTab) continue;
    const pr = p.presence || {};
    if (pr.shop !== S.shop) continue;
    list.push({
      peer: p.peer, pid: p.peer, me: false,
      nick: cleanText(pr.nick, LIMIT.nick) || '익명 짹짹이',
      color: COLOR_DEFS[pr.color] ? pr.color : 'orange',
      station: stationOf(S.shop, pr.station) ? pr.station : null,
      claimedAt: num(pr.claimedAt, Infinity),
      queue: stationOf(S.shop, pr.queue) ? pr.queue : null,
      queuedAt: num(pr.queuedAt, Infinity),
      gest: GESTURES[pr.gest] ? pr.gest : null,
      gestN: Math.max(0, Math.floor(num(pr.gestN))),
      on: pr.on === true,
      state: ['idle', 'set', 'rest'].includes(pr.state) ? pr.state : 'idle',
      reps: Math.max(0, Math.min(99, Math.floor(num(pr.reps)))),
      set: Math.max(1, Math.min(9, Math.floor(num(pr.set, 1)))),
      restUntil: num(pr.restUntil),
      x: typeof pr.x === 'number' ? clamp(pr.x, BOUNDS.x0, BOUNDS.x1) : null,
      z: typeof pr.z === 'number' ? clamp(pr.z, BOUNDS.z0, BOUNDS.z1) : null,
    });
  }
  return list;
}
function owners(list) {
  const map = new Map();
  for (const m of list) {
    if (!m.station) continue;
    const cur = map.get(m.station);
    if (!cur || m.claimedAt < cur.claimedAt || (m.claimedAt === cur.claimedAt && String(m.pid) < String(cur.pid))) map.set(m.station, m);
  }
  return map;
}
/** 기구별 줄: 먼저 선 사람부터 */
function lines(list) {
  const map = new Map();
  for (const m of list) {
    if (!m.queue || m.station === m.queue) continue;
    if (!map.has(m.queue)) map.set(m.queue, []);
    map.get(m.queue).push(m);
  }
  for (const line of map.values()) line.sort((p, q) => p.queuedAt - q.queuedAt || (String(p.pid) < String(q.pid) ? -1 : 1));
  return map;
}

/** room 상태를 3D 장면에 반영 */
function syncScene() {
  if (!S.shop || !S.modelsReady) return;
  const list = members();
  const own = owners(list), queue = lines(list);
  // 내가 늦게 잡았으면 양보하고 줄을 선다
  if (S.me.station) {
    const o = own.get(S.me.station);
    if (o && !o.me) {
      const id = S.me.station;
      toast(`${o.nick} 님이 ${stationOf(S.shop, id)?.name || '기구'}를 먼저 잡았어요. 줄을 섰어요.`, 2800);
      releaseStation(true);
      joinQueue(id, true);
      return;
    }
  }
  // 내 차례가 오면 바로 기구로 (자리를 비운 탭은 차례를 넘긴다)
  if (S.me.queue) {
    const line = queue.get(S.me.queue) || [], idx = line.findIndex((m) => m.me), id = S.me.queue;
    if (!own.get(id) && idx === 0) {
      if (document.hidden) { leaveQueue(); return; }
      sound.turn();
      toast(`차례가 왔어요! ${stationOf(S.shop, id).name}로 가요.`, 2800);
      claimStation(id);
      return;
    }
    standInLine(stationOf(S.shop, id), Math.max(0, idx));
  }
  const seen = new Set();
  for (const m of list) {
    if (m.me) continue;
    seen.add(m.peer);
    let R = S.remotes.get(m.peer);
    if (!R) {
      const sp = SHOPS[S.shop].spawn;
      const x = m.x ?? sp.x, z = m.z ?? sp.z;
      const A = makeJjak(x, z, m.color);
      if (!A) continue;
      R = { A, mounted: null, lastReps: m.reps, lastGestN: m.gestN };
      S.remotes.set(m.peer, R);
      if (S.announce) { sysLine(`${m.nick} 님이 들어왔어요`, ''); coachGreet(m.nick, A); }
    }
    Object.assign(R, { nick: m.nick, color: m.color, state: m.state, reps: m.reps, set: m.set, restUntil: m.restUntil, on: m.on });
    paint(R.A, m.color);
    const st = m.station && m.on && own.get(m.station)?.peer === m.peer ? stationOf(S.shop, m.station) : null;
    if (st && R.mounted !== st.id) {
      if (R.mounted) unmountActor(R.A, stationOf(S.shop, R.mounted));
      mountActor(R.A, st);
      R.mounted = st.id;
      R.lastReps = m.reps;
    } else if (!st && R.mounted) {
      unmountActor(R.A, stationOf(S.shop, R.mounted));
      R.mounted = null;
    }
    if (m.gestN !== R.lastGestN) {
      R.lastGestN = m.gestN;
      if (m.gest) playGesture(R.A, m.peer, m.gest, !!R.mounted);
    }
    if (R.mounted) {
      if (m.reps > R.lastReps && m.state !== 'idle') playRep(R.A);
      R.lastReps = m.reps;
    } else if (m.x != null && m.z != null && !gesturing(R.A)) {
      const w = S.walk.get(R.A);
      const tx = w ? w.x : R.A.place.x, tz = w ? w.z : R.A.place.z;
      if (Math.hypot(m.x - tx, m.z - tz) > 0.05) {
        if (Math.hypot(m.x - R.A.place.x, m.z - R.A.place.z) > 6) { R.A.place.x = m.x; R.A.place.z = m.z; G.applyPlace(R.A); }
        else walkTo(R.A, m.x, m.z);
      }
    }
  }
  for (const [peer, R] of S.remotes) {
    if (seen.has(peer)) continue;
    if (R.mounted) unmountActor(R.A, stationOf(S.shop, R.mounted));
    S.walk.delete(R.A);
    G.removeActor(R.A);
    S.remotes.delete(peer);
    dropTag(peer);
    if (S.announce && R.nick) sysLine(`${R.nick} 님이 나갔어요`, '');
  }
  // 기구 목록
  for (const st of SHOPS[S.shop].stations) {
    const c = $(`#pick-${st.id}`);
    if (!c) continue;
    const o = own.get(st.id), line = queue.get(st.id) || [], myIdx = line.findIndex((m) => m.me);
    c.classList.toggle('busy', !!o && !o.me);
    c.classList.toggle('mine', !!o && o.me);
    c.classList.toggle('lined', myIdx >= 0);
    const wait = line.length ? ` · 대기 ${line.length}` : '';
    c.querySelector('small').textContent = myIdx >= 0 ? `내 앞에 ${myIdx + (o ? 1 : 0)}명` : !o ? (line.length ? `대기 ${line.length}` : st.ex) : o.me ? '사용 중 (나)' : `사용 중${wait}`;
    c.setAttribute('aria-label', `${st.name} ${st.ex}, ${!o ? '비어 있음 — 눌러서 사용' : o.me ? '내가 사용 중' : `${o.nick} 님 사용 중, 대기 ${line.length}명 — 눌러서 줄 서기`}`);
  }
  renderCount(list.length);
  S.lineAhead = S.me.queue ? (queue.get(S.me.queue) || []).findIndex((m) => m.me) + (own.get(S.me.queue) ? 1 : 0) : 0;
  S.lineBehind = S.me.station ? (queue.get(S.me.station) || []).length : 0;
}
function renderCount(n) {
  $('#memberCount').textContent = room ? `지금 ${n}명이 함께 운동 중` : '지금은 혼자 운동 중';
}

// ------------------------------------------------------------------ 내 행동
function claimStation(id) {
  if (!S.shop || !S.meA) return;
  const st = stationOf(S.shop, id);
  if (!st || S.me.station === id) return;
  const list = members(), own = owners(list).get(id), line = lines(list).get(id) || [];
  if ((own && !own.me) || (line.length && !line[0].me)) { joinQueue(id); return; }
  if (S.me.on && S.me.state === 'set' && S.me.reps > 0) { toast('지금 세트 중이에요. 기구 반납 후 옮겨 주세요.', 2200); return; }
  sound.unlock();
  if (S.me.on) dismount(true);
  const resting = S.me.state === 'rest';
  Object.assign(S.me, { station: id, claimedAt: Date.now(), on: false, reps: 0, set: resting ? 0 : 1, queue: null, queuedAt: 0, lastActAt: Date.now() });
  if (!resting) S.me.state = 'set';
  syncPresence(true);
  const ap = approachPoint(st);
  walkTo(S.meA, ap.x, ap.z, () => {
    if (S.me.station !== id) { setIdle(S.meA); return; }
    mountActor(S.meA, st);
    S.me.on = true;
    S.me.lastActAt = Date.now();
    syncPresence(true);
    coachSay(`${st.name}! ${st.cue}`, 8000);
    sysLine(`🏋️ ${st.name} 사용 시작 — ${st.ex} ${SHOPS[S.shop].reps}회 × ${RULES.setsPerStation}세트`, 'work');
    renderHud();
  });
  renderHud();
  syncScene();
}
function dismount(silent) {
  const st = stationOf(S.shop, S.me.station);
  if (S.me.on) unmountActor(S.meA, st);
  S.me.on = false;
  if (!silent && st) sysLine(`${st.name} 반납`, '');
}
function releaseStation(silent = false) {
  if (!S.me.station) return;
  dismount(silent);
  S.walk.delete(S.meA);
  S.me.station = null;
  S.me.claimedAt = 0;
  if (S.me.state === 'set') { S.me.state = 'idle'; S.me.reps = 0; }
  syncPresence(true);
  renderHud();
  syncScene();
}
$('#releaseBtn').addEventListener('click', () => releaseStation());

// ------------------------------------------------------------------ 줄 서기
function joinQueue(id, quiet = false) {
  const st = stationOf(S.shop, id);
  if (!st || S.me.queue === id) return;
  if (S.me.station) { toast('지금 쓰는 기구를 반납하면 줄을 설 수 있어요.', 2400); return; }
  S.me.queue = id;
  S.me.queuedAt = Date.now();
  if (!quiet) toast(`${st.name} 줄에 섰어요. 차례가 오면 바로 시작해요.`, 2400);
  sound.unlock();
  syncPresence(true);
  syncScene();
  renderHud();
}
function leaveQueue() {
  if (!S.me.queue) return;
  S.me.queue = null;
  S.me.queuedAt = 0;
  syncPresence(true);
  syncScene();
  renderHud();
}
$('#leaveQueueBtn').addEventListener('click', leaveQueue);
/** 기구 앞에 차례대로 선다. 앞사람이 빠지면 한 칸씩 당겨짐 */
function standInLine(st, idx) {
  const A = S.meA;
  if (!A || gesturing(A)) return;
  const ap = approachPoint(st);
  let x = ap.x, z = ap.z + 1.25 + RULES.queueStep * idx;
  if (z > BOUNDS.z1) { x += (z - BOUNDS.z1) * (x > 0 ? -1 : 1); z = BOUNDS.z1; }
  const w = S.walk.get(A), tx = w ? w.x : A.place.x, tz = w ? w.z : A.place.z;
  if (Math.hypot(x - tx, z - tz) < 0.06) return;
  walkTo(A, x, z, () => {
    faceTo(A, ap.x, ap.z);
    setIdle(A);
  });
  syncPresence(true);
}

// ------------------------------------------------------------------ 몸짓: 말 없이 소통 (내 짹짹이가 직접, 모두에게 보임)
function gesturing(A) { return G.clock.t < (A._gestUntil || 0); }
/** 기구 위에서는 몸이 묶여 있으니 머리 위 그림만 띄운다 */
function playGesture(A, tagKey, id, busy) {
  const g = GESTURES[id];
  if (!g || !A) return;
  floatEmoji(tagKey, g.emoji);
  A._gest = id;
  if (busy) return;
  S.walk.delete(A);
  A.speed = 1;
  G.playOnce(A, g.preset, 'idle', { blend: 0.2 });
  A._gestUntil = G.clock.t + G.clipDur(A.clip) + 0.1;
}
for (const btn of document.querySelectorAll('[data-gesture]')) {
  btn.addEventListener('click', () => {
    btn.blur();
    const id = btn.dataset.gesture, now = Date.now(), m = S.me;
    if (!S.shop || !S.meA || now - S.lastGestureAt < RULES.gestureGapMs) return;
    S.lastGestureAt = now;
    sound.unlock();
    sound.gesture();
    m.gest = id;
    m.gestN += 1;
    playGesture(S.meA, 'me', id, !!m.station);
    syncPresence(true);
  });
}

function doRep() {
  const m = S.me, A = S.meA;
  if (!S.shop || m.state !== 'set' || !m.on || !A) return;
  if (repBusy(A)) return;
  const target = SHOPS[S.shop].reps;
  m.reps = Math.min(target, m.reps + 1);
  m.lastActAt = Date.now();
  playRep(A);
  sound.rep();
  if (m.reps >= target) finishSet();
  syncPresence(true);
  renderHud();
}
function finishSet() {
  const m = S.me;
  const st = stationOf(S.shop, m.station);
  const restMs = randomRestMs();
  const doneAll = m.set >= RULES.setsPerStation;
  m.state = 'rest';
  m.restUntil = Date.now() + restMs;
  sound.setDone();
  playCoach(doneAll ? 'clapCheer' : 'thumbs');
  const secs = Math.round(restMs / 1000);
  if (doneAll) {
    sysLine(`🎉 ${st?.name || '기구'} ${RULES.setsPerStation}세트 완료! 쉬는 시간 ${secs}초 — 수다 OK`, 'rest');
    coachSay('완벽해! 기구는 다음 짹짹이에게 넘겨주고 쉬면서 수다 떨어~', 7000);
    setTimeout(() => { if (S.me.station === st?.id && S.me.state === 'rest') { dismount(true); S.me.station = null; S.me.claimedAt = 0; syncPresence(true); syncScene(); renderHud(); } }, 1600);
  } else {
    sysLine(`☕ ${m.set}세트 끝! 쉬는 시간 ${secs}초 — 수다 OK`, 'rest');
    coachSay(`좋아~ ${m.set}세트 끝! 쉬면서 수다 떨어도 돼. 자세 궁금하면 나한테 물어봐~`, 7000);
  }
  // 넓은 화면은 수다창을 알아서 열어 준다
  if (panelIsHidden() && !matchMedia('(max-width: 860px)').matches) { openPanel('chat'); S.panelAuto = true; }
  else if (panelIsHidden()) toast('쉬는 시간! 💬 를 누르면 수다를 떨 수 있어요.', 3000);
}
function endRest() {
  const m = S.me;
  sound.restOver();
  if (S.panelAuto && S.tab === 'chat') closePanel();
  S.panelAuto = false;
  m.lastActAt = Date.now();
  if (m.station) {
    m.set += 1; m.reps = 0; m.state = 'set';
    const st = stationOf(S.shop, m.station);
    sysLine(`🏋️ ${m.set}세트 시작! 채팅은 세트 끝나면 다시 열려요`, 'work');
    coachSay(st ? st.cue : '다음 세트 가자!', 6000);
  } else {
    m.state = 'idle'; m.reps = 0;
    sysLine('쉬는 시간 끝! 다음 기구를 골라 볼까요?', '');
  }
  syncPresence(true);
  renderHud();
}

$('#repBtn').addEventListener('click', doRep);
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !S.shop || e.repeat) return;
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLButtonElement) return;
  e.preventDefault();
  $('#repBtn').classList.add('pressed');
  setTimeout(() => $('#repBtn').classList.remove('pressed'), 120);
  doRep();
});

// 3D 화면 누르기: 기구 → 사용, 부리부리 → PT, 바닥 → 이동 (드래그는 시점 돌리기)
const ray = new T.Raycaster();
let downAt = null;
$('#view').addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
$('#view').addEventListener('pointerup', (e) => {
  if (!downAt || !S.meA) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y), dt = performance.now() - downAt.t;
  downAt = null;
  if (moved > 6 || dt > 600) return;
  sound.unlock();
  const r = $('#view').getBoundingClientRect();
  const ndc = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, G.cam);
  // 부리부리 쌤
  if (S.coach) {
    const hit = ray.intersectObject(S.coach.root, true)[0];
    if (hit) { openPanel('pt'); playCoach('wave'); return; }
  }
  // 기구
  let best = null;
  for (const st of SHOPS[S.shop].stations) {
    const o = S.stationObj[st.id];
    if (!o) continue;
    const hit = ray.intersectObject(o, true)[0];
    if (hit && (!best || hit.distance < best.d)) best = { d: hit.distance, id: st.id };
  }
  if (best) { claimStation(best.id); return; }
  // 바닥
  if (S.me.on) { toast('기구 위에서는 「기구 반납」을 눌러 내려와요.', 2000); return; }
  const o = ray.ray.origin, d = ray.ray.direction;
  if (d.y >= -1e-4) return;
  const t = -o.y / d.y;
  const x = o.x + d.x * t, z = o.z + d.z * t;
  if (S.me.station && !S.me.on) { S.me.station = null; S.me.claimedAt = 0; if (S.me.state === 'set') S.me.state = 'idle'; renderHud(); syncScene(); }
  if (S.me.queue) { leaveQueue(); toast('줄에서 나왔어요.', 1600); }
  S.meA._gestUntil = 0;
  walkTo(S.meA, x, z);
  syncPresence(true);
});

// ------------------------------------------------------------------ HUD
function renderHud() {
  if (!S.shop) return;
  const now = Date.now(), m = S.me, shop = SHOPS[S.shop];
  const st = stationOf(S.shop, m.station), qst = stationOf(S.shop, m.queue);
  const stage = $('#stage'), repBtn = $('#repBtn');
  $('#clock').hidden = false;
  if (m.state === 'set' && st) {
    stage.dataset.phase = 'work';
    $('#exName').textContent = m.on ? `${st.ex} · ${m.set}/${RULES.setsPerStation}세트` : `${st.name}로 가는 중`;
    $('#clock').textContent = `${m.reps}/${shop.reps}`;
    repBtn.hidden = false;
    repBtn.disabled = !m.on;
  } else if (m.state === 'rest') {
    stage.dataset.phase = 'rest';
    $('#exName').textContent = st ? `쉬는 시간 · 다음 ${st.name} ${m.set + 1}세트` : qst ? `쉬는 시간 · ${qst.name} 줄 ${S.lineAhead || 0}명 앞` : '쉬는 시간 · 수다 OK';
    $('#clock').textContent = fmt(m.restUntil - now);
    repBtn.hidden = true;
  } else {
    stage.dataset.phase = 'idle';
    $('#exName').textContent = qst ? `${qst.name} 줄 서는 중 · 내 앞에 ${S.lineAhead || 0}명` : '빈 기구를 골라 시작해요';
    $('#clock').hidden = true;
    $('#clock').textContent = '—';
    repBtn.hidden = true;
  }
  $('#releaseBtn').hidden = !m.station;
  $('#leaveQueueBtn').hidden = !m.queue;
  $('#stnbar').hidden = !!m.station;
  updateChatLock();
}

// 화면 그리기 (탭이 내려가 있으면 멈춘다)
let lastHook = performance.now();
G.hooks.push((dt) => {
  const nowMs = performance.now(), realDt = Math.min(0.5, (nowMs - lastHook) / 1000);
  lastHook = nowMs;
  if (!S.shop || !S.meA) return;
  stepWalkers(realDt); // 화면이 느려도 걷는 속도는 그대로
  followCam(dt);
  updateTags();
});
// 1초마다 규칙 돌리기 (탭이 내려가 있어도 휴식·줄이 멈추지 않게 그리기와 분리)
setInterval(() => {
  if (!S.shop || !S.meA) return;
  const now = Date.now(), m = S.me;
  if (m.state === 'rest') {
    const left = m.restUntil - now, sec = Math.ceil(left / 1000);
    if (sec <= 3 && sec > 0 && S.lastBeep !== `${m.restUntil}:${sec}`) { S.lastBeep = `${m.restUntil}:${sec}`; sound.tick(); }
    if (left <= 0) endRest();
  }
  syncScene();
  // 줄이 있는데 오래 멈춰 있으면 다음 사람에게
  if (m.station && m.state !== 'rest' && S.lineBehind > 0 && now - m.lastActAt > RULES.idleHoldSec * 1000) {
    const st = stationOf(S.shop, m.station);
    toast(`오래 멈춰 있어서 ${st?.name || '기구'}를 다음 분께 넘겼어요.`, 3500);
    releaseStation();
  }
  stepCoach(now);
  renderHud();
  document.title = m.state === 'rest' ? `☕ ${fmt(m.restUntil - now)} · 짹짹이짐` : m.state === 'set' ? `💪 ${m.reps}/${SHOPS[S.shop].reps} · 짹짹이짐` : '짹짹이짐 ONLINE 3D';
}, 1000);

// ------------------------------------------------------------------ 로비
function renderColorPicker() {
  const box = $('#colorPicker');
  box.textContent = '';
  for (const [key, def] of Object.entries(COLOR_DEFS)) {
    const label = document.createElement('label');
    label.title = def.label;
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'color'; input.value = key; input.id = `color-${key}`;
    input.checked = key === S.me.color;
    input.setAttribute('aria-label', `${def.label} 나시`);
    input.addEventListener('change', () => { S.me.color = key; store.set('jg.color', key); });
    const img = document.createElement('img');
    img.src = spriteFor(key); img.alt = '';
    label.append(input, img);
    box.append(label);
  }
}
function lobbyCounts() {
  const counts = { pilates: 0, weight: 0 }, busy = { pilates: new Set(), weight: new Set() };
  if (room) {
    for (const p of room.peers()) {
      const pr = p.presence || {};
      if (p.kind !== 'viewer' || !Object.prototype.hasOwnProperty.call(counts, pr.shop)) continue;
      counts[pr.shop]++;
      if (stationOf(pr.shop, pr.station)) busy[pr.shop].add(pr.station);
    }
  }
  for (const id of Object.keys(SHOPS)) {
    const el = document.querySelector(`[data-live="${id}"]`);
    if (!el) continue;
    const total = SHOPS[id].stations.length;
    el.textContent = room ? `🐥 ${counts[id]}명 · 빈 기구 ${total - busy[id].size}/${total}` : `기구 ${total}개 · 세트당 ${SHOPS[id].reps}회`;
  }
  const all = counts.pilates + counts.weight;
  $('#lobbyCount').hidden = !room;
  $('#lobbyCount').textContent = all ? `지금 ${all}명이 함께 운동 중` : '지금은 조용해요. 첫 번째로 들어가 볼까요?';
}
function showLobby() {
  if (S.shop) { releaseStation(true); }
  S.me.queue = null; S.me.queuedAt = 0;
  ambient.stop();
  closePanel();
  S.shop = null;
  S.meA = null; S.coach = null;
  for (const A of G.actors.slice()) G.removeActor(A);
  S.remotes.clear(); S.walk.clear();
  document.body.classList.remove('in-gym');
  $('#gym').hidden = true;
  $('#lobby').hidden = false;
  document.title = '짹짹이짐 ONLINE 3D';
  room?.presence({ shop: null, station: null, queue: null, state: 'idle', on: false }).catch(() => {});
  lobbyCounts();
}
$('#joinForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const shop = e.submitter?.value;
  const nick = cleanText($('#nick').value, LIMIT.nick);
  if (!nick) { $('#nick').focus(); return; }
  if (!SHOPS[shop] || !S.modelsReady) return;
  sound.unlock();
  S.me.nick = nick;
  store.set('jg.nick', nick);
  enterGym(shop);
});
function enterGym(shopId) {
  S.shop = shopId;
  Object.assign(S.me, { station: null, claimedAt: 0, on: false, queue: null, queuedAt: 0, state: 'idle', reps: 0, set: 1, restUntil: 0 });
  S.ptTurns = [];
  S.announce = false;
  setTimeout(() => { S.announce = true; }, 2500);
  $('#chatLog').textContent = '';
  $('#ptLog').textContent = '';
  setTab('chat');
  const shop = SHOPS[shopId];
  $('#shopName').textContent = shop.name;
  $('#lobby').hidden = true;
  $('#gym').hidden = false;
  document.body.classList.add('in-gym');
  buildShop(shopId);
  syncPresence(true);
  ambient.start(shopId);
  sysLine(`🐥 ${shop.name}에 입장! 바닥을 누르면 걸어가고, 빈 기구를 누르면 운동을 시작해요.`, '');
  if (!room) sysLine('지금은 혼자 운동 모드예요. claude.ai에 로그인한 상태로 열면 다른 짹짹이들과 함께해요.', '');
  setTimeout(() => { if (S.shop === shopId) coachGreet(S.me.nick, S.meA); }, 700);
  renderHud();
  syncScene();
  updatePtUI();
}
$('#leaveBtn').addEventListener('click', showLobby);

// ------------------------------------------------------------------ 말풍선 · 응원
function showBubble(tagKey, text) {
  const el = S.tags.get(tagKey);
  if (!el) return;
  el.querySelector('.bubble')?.remove();
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  el.prepend(b);
  setTimeout(() => b.remove(), 6000);
}
let coachTimer = null;
function coachSay(text, ms = 7000) {
  const el = S.tags.get('coach');
  if (!el) return;
  el.querySelector('.bubble')?.remove();
  if (!text) return;
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  el.prepend(b);
  clearTimeout(coachTimer);
  coachTimer = setTimeout(() => b.remove(), ms);
}
function floatEmoji(tagKey, emoji) {
  const el = S.tags.get(tagKey);
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float-emoji';
  f.textContent = emoji;
  f.style.marginLeft = `${(Math.random() * 40 - 20).toFixed(0)}px`;
  el.append(f);
  setTimeout(() => f.remove(), 1500);
}

// ------------------------------------------------------------------ chat (쉬는 시간에만)
function scrollKeeper(log) {
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  return () => { if (nearBottom) log.scrollTop = log.scrollHeight; };
}
function trimLog(log) { while (log.children.length > 200) log.firstElementChild.remove(); }
function sysLine(text, kind) {
  const log = $('#chatLog'), done = scrollKeeper(log);
  const li = document.createElement('li');
  li.className = `sys ${kind || ''}`;
  li.textContent = text;
  log.append(li);
  trimLog(log);
  done();
}
function chatLine(who, text, mine) {
  const log = $('#chatLog'), done = scrollKeeper(log);
  const li = document.createElement('li');
  li.className = 'msg' + (mine ? ' mine' : '');
  const w = document.createElement('span'); w.className = 'who'; w.textContent = who;
  const t = document.createElement('span'); t.className = 'text'; t.textContent = text;
  li.append(w, t);
  log.append(li);
  trimLog(log);
  if (mine) log.scrollTop = log.scrollHeight; else done();
  if (S.tab !== 'chat' || panelIsHidden()) bumpUnread();
}
function updateChatLock() {
  const m = S.me, open = m.state === 'rest';
  $('#chatLock').hidden = open;
  $('#chatInput').disabled = !open;
  $('#chatSend').disabled = !open;
  if (!open) {
    if (m.state === 'set' && m.on) {
      $('#chatLockTitle').textContent = '🔒 세트 중엔 운동에 집중!';
      $('#chatLockSub').textContent = `${SHOPS[S.shop].reps - m.reps}회만 더 하면 채팅이 열려요`;
    } else {
      $('#chatLockTitle').textContent = '🔒 세트를 끝내야 수다를 떨 수 있어요';
      $('#chatLockSub').textContent = '빈 기구를 골라 세트를 시작해 보세요';
    }
  }
}
function onChat(msg) {
  const d = msg.data || {};
  if (!S.shop || d.shop !== S.shop) return;
  const text = cleanText(d.text, LIMIT.chat);
  if (!text) return;
  if (!msg.sameTab) {
    // 받는 쪽 규칙: 보낸 사람이 쉬는 중일 때 보낸 것만 보여준다
    const p = room?.peers().find((x) => x.peer === msg.peer);
    if (!p || p.presence?.state !== 'rest') return;
  }
  const R = S.remotes.get(msg.peer);
  chatLine(msg.sameTab ? S.me.nick : R?.nick || '짹짹이', text, msg.sameTab);
  showBubble(msg.sameTab ? 'me' : msg.peer, text);
}
async function sendChat(text) {
  if (S.me.state !== 'rest') return;
  const now = Date.now();
  if (now - S.lastChatAt < 800) { toast('조금 천천히 보내 주세요.', 1500); return; }
  S.lastChatAt = now;
  if (room && room.connected()) {
    try { await room.emit('chat', { shop: S.shop, text }); }
    catch (e) {
      if (e?.code === 'not_permitted') toast('이 링크 권한으로는 채팅을 보낼 수 없어요. 공유한 분께 참여 권한을 요청해 주세요.', 4000);
      else toast('메시지를 보내지 못했어요. 잠시 후 다시 보내 주세요.', 2500);
    }
  } else {
    chatLine(S.me.nick, text, true);
    showBubble('me', text);
  }
}
$('#chatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chatInput'), text = cleanText(input.value, LIMIT.chat);
  if (!text) return;
  input.value = '';
  sendChat(text);
});
// ------------------------------------------------------------------ 부리부리 쌤 PT (체험 1회, 이후 이용권)
// 결제 시스템이 생기면 hasPtPass()가 실제 이용권을 확인하게 바꾸면 된다.
function hasPtPass() { return false; }
function trialUsed() { return Math.max(0, parseInt(store.get('jg.ptTrialUsed', '0'), 10) || 0); }
function trialLeft() { return Math.max(0, RULES.trialQuestions - trialUsed()); }
function canAskPt() { return hasPtPass() || trialLeft() > 0; }
function updatePtUI() {
  const pass = hasPtPass(), left = trialLeft();
  $('#ptQuota').textContent = pass ? 'PT 이용권 사용 중' : left > 0 ? `체험 PT · 남은 질문 ${left}/${RULES.trialQuestions}` : '체험 PT 끝';
  $('#ptMode').textContent = sample ? '' : '(지금은 오프라인 모드 — 기본 답변만 해줘요)';
  const can = canAskPt();
  $('#ptPaywall').hidden = can;
  $('#ptChips').hidden = !can;
  $('#ptInput').disabled = !can || S.ptBusy;
  $('#ptSend').disabled = !can || S.ptBusy;
}
$('#buyBtn').addEventListener('click', () => { $('#buyNote').hidden = false; });
function coachRules() {
  const shop = SHOPS[S.shop];
  const list = shop.stations.map((s) => `- ${s.name}: ${s.ex} — "${s.cue}"`).join('\n');
  return `너는 온라인 헬스장 '짹짹이 바른자세 스튜디오'의 PT 쌤 '부리부리'야.
흰 새 캐릭터에 뾰족한 검은 머리, 늘 팔짱을 끼고 있지만 회원들을 진심으로 아끼는 트레이너야.
회원들은 '짹짹이'라고 불러. 지금 너는 ${shop.name}에서 1:1 PT 중이야.

이 샵의 기구와 운동 (세트당 ${shop.reps}회 × ${RULES.setsPerStation}세트, 세트 사이 1~3분 휴식):
${list}

스튜디오 철학:
- 아픈 곳만 주무르지 말고 직접 움직이게 한다. ("목이 뻣뻣하다고 목만 주무르지 마!")
- 허리가 할 일을 대신하지 않게 고관절·엉덩이를 쓰고, 목 대신 등(흉추)을 움직인다.
- 무리해서 억지로 하지 않는다. 가동 범위 안에서 천천히, 호흡은 참지 않는다.

답하는 방식:
- 반말로 친근하고 짧게. 2~4문장, 길어도 250자 안쪽. 채팅 말풍선에 그대로 뜨니까 마크다운·목록 기호·이모지 남발 금지.
- 동작 질문엔 핵심 자세 포인트 1~2개와 흔한 실수 1개를 짚어 줘. 쉬운 대체 동작이 있으면 알려 줘.
- 질문 앞의 [지금 상황]은 스튜디오가 붙여 주는 정보야. 지금 쓰는 기구와 연결해서 답하면 좋아.
- 날카로운 통증, 저림, 부상, 수술 이력, 임신, 질환 같은 얘기가 나오면 진단하지 말고 그 동작은 멈추라고 한 뒤 병원·전문가 상담을 권해.
- 운동·자세·건강 습관과 상관없는 질문은 가볍게 한마디 받아 주고 운동 얘기로 데려와.
- 너는 AI 트레이너라는 걸 숨기지 않아. 물어보면 솔직하게 말해.
이 규칙을 지키면서 아래 짹짹이의 메시지에 부리부리 쌤으로서 답만 써.`;
}
function contextNote(question) {
  const m = S.me, st = stationOf(S.shop, m.station);
  const where = st ? `${st.name}에서 ${st.ex}` : '기구 고르는 중';
  const state = m.state === 'set' ? `${m.set}세트 ${m.reps}/${SHOPS[S.shop].reps}회` : m.state === 'rest' ? '세트 사이 휴식 중' : '대기 중';
  return `[지금 상황] ${SHOPS[S.shop].name} · ${where} · ${state} · 질문한 짹짹이: ${m.nick}\n\n${question}`;
}
const OFFLINE_RULES = [
  [/통증|아파|아프|저려|저림|찌릿|부상|다쳤/, '아픈 데가 있으면 그 동작은 바로 멈추자! 날카롭게 아프거나 저리면 참지 말고 병원에서 꼭 확인받아. 오늘은 통증 없는 범위에서만 천천히~'],
  [/허리/, '허리가 할 일을 대신하지 않게 하는 게 핵심이야! 허리를 숙이는 게 아니라 고관절을 접는 느낌, 엉덩이로 움직여봐.'],
  [/목|뒷목|거북/, '목이 뻣뻣하다고 목만 주무르지 마! 목부터 등까지 같이 움직여야 해. 캣/카우 같이 해보자~'],
  [/무릎/, '무릎은 발끝 방향이랑 같이 가야 해. 안으로 모이면 안 돼! 엉덩이를 뒤로 빼면서 앉으면 무릎 부담이 줄어~'],
  [/어깨|승모|날개/, '어깨가 귀 쪽으로 으쓱 올라가면 안 돼! 날개뼈를 살짝 아래 뒤로 모은 상태로 움직여봐.'],
  [/호흡|숨/, '숨은 절대 참지 마! 힘 쓸 때 내쉬고 돌아올 때 들이마셔. 갈비뼈를 옆으로 넓히는 느낌~'],
  [/몇\s*(번|개|회|세트)|횟수|반복/, '횟수보다 자세가 먼저야! 마지막 2~3회가 살짝 힘든 정도면 딱 좋아. 자세 무너지면 바로 쉬어.'],
  [/쉬운|대체|못\s*하/, '힘들면 범위를 반으로 줄이거나 무게를 내려! 자세가 지켜지는 만큼만 하는 게 진짜 운동이야~'],
  [/안녕|하이|반가/, '어서 와 짹짹이! 오늘도 바른 자세로 같이 움직여보자~ 궁금한 거 있으면 언제든 물어봐!'],
  [/누구|ai|AI|사람|로봇/, '나는 짹짹이 스튜디오의 AI PT 부리부리야! 팔짱은 끼고 있지만 질문은 다 받아줄게~'],
];
function offlineAnswer(question) {
  for (const [re, ans] of OFFLINE_RULES) if (re.test(question)) return ans;
  const st = stationOf(S.shop, S.me.station);
  if (st) return `지금 ${st.name}에서 ${st.ex} 하고 있지? 포인트는 이거! "${st.cue}" 더 궁금한 건 구체적으로 물어봐~`;
  return '먼저 빈 기구 하나 골라봐! 기구를 잡으면 그 운동 기준으로 자세 포인트 알려줄게~';
}
const SAMPLE_COPY = {
  rate_limited: '쌤한테 질문이 몰려서 잠깐 숨 고르는 중! 조금 있다가 다시 물어봐~',
  refused: '음… 그건 내가 답하기 어려운 질문이야. 우리 자세 얘기로 돌아가 볼까?',
  session_expired: 'claude.ai에 다시 로그인하면 이어서 답해줄게!',
};
async function askBuri(turns, question, onText) {
  if (!sample) { const t = offlineAnswer(question); onText(t); return t; }
  try {
    const { text } = await sample(turns, { modelTier: 'quick', cache: false, onText: ({ text }) => onText(text) });
    return text.trim();
  } catch (e) {
    const code = e?.code;
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) {
      sample = null; updatePtUI();
      const t = offlineAnswer(question); onText(t); return t;
    }
    if (e?.text && code === 'upstream_error') return e.text + ' …앗, 쌤 말이 끊겼네! 다시 물어봐 줄래?';
    return SAMPLE_COPY[code] || offlineAnswer(question);
  }
}
async function ptAsk(raw) {
  const question = cleanText(raw, LIMIT.ask);
  if (!question || S.ptBusy || !S.shop) return;
  if (!canAskPt()) { updatePtUI(); return; }
  if (!hasPtPass()) store.set('jg.ptTrialUsed', String(trialUsed() + 1));
  S.ptBusy = true;
  updatePtUI();
  playCoach('talk');
  const log = $('#ptLog');
  const q = document.createElement('li'); q.className = 'msg mine';
  const qt = document.createElement('span'); qt.className = 'text'; qt.textContent = question;
  q.append(qt);
  const a = document.createElement('li'); a.className = 'msg coach';
  const who = document.createElement('span'); who.className = 'who'; who.textContent = '부리부리 쌤';
  const at = document.createElement('span'); at.className = 'text typing'; at.textContent = '생각 중…';
  a.append(who, at);
  log.append(q, a);
  log.scrollTop = log.scrollHeight;
  const userTurn = { role: 'user', content: contextNote(question) };
  const turns = [{ role: 'user', content: coachRules() }, ...S.ptTurns.slice(-12), userTurn];
  const text = await askBuri(turns, question, (txt) => { const keep = scrollKeeper(log); at.textContent = txt; keep(); });
  at.classList.remove('typing');
  at.textContent = text;
  S.ptTurns.push(userTurn, { role: 'assistant', content: text || '…' });
  S.ptBusy = false;
  updatePtUI();
  if (!canAskPt()) log.scrollTop = log.scrollHeight;
}
$('#ptForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#ptInput'), v = input.value;
  input.value = '';
  ptAsk(v);
});
for (const chip of $('#ptChips').children) chip.addEventListener('click', () => ptAsk(chip.textContent));

// ------------------------------------------------------------------ tabs / misc
const panelIsHidden = () => $('#panel').hidden;
function openPanel(tab) {
  S.panelAuto = false;
  $('#panel').hidden = false;
  setTab(tab);
  syncPanelBtns();
}
function closePanel() {
  $('#panel').hidden = true;
  S.panelAuto = false;
  syncPanelBtns();
}
function syncPanelBtns() {
  const open = !panelIsHidden();
  $('#openChat').setAttribute('aria-pressed', open && S.tab === 'chat');
  $('#openPt').setAttribute('aria-pressed', open && S.tab === 'pt');
}
function togglePanel(tab) { if (!panelIsHidden() && S.tab === tab) closePanel(); else openPanel(tab); }
$('#openChat').addEventListener('click', () => togglePanel('chat'));
$('#openPt').addEventListener('click', () => togglePanel('pt'));
$('#closePanel').addEventListener('click', closePanel);
function setTab(tab) {
  S.tab = tab;
  $('#tabChat').setAttribute('aria-selected', tab === 'chat');
  $('#tabPt').setAttribute('aria-selected', tab === 'pt');
  $('#chatPane').hidden = tab !== 'chat';
  $('#ptPane').hidden = tab !== 'pt';
  if (tab === 'chat' && !panelIsHidden()) { S.unread = 0; $('#chatBadge').hidden = true; const log = $('#chatLog'); log.scrollTop = log.scrollHeight; }
  if (tab === 'pt') updatePtUI();
  syncPanelBtns();
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
  const b = $('#soundBtn'), a = $('#ambientBtn');
  b.textContent = sound.on ? '🔊' : '🔇';
  b.setAttribute('aria-pressed', sound.on);
  b.setAttribute('aria-label', sound.on ? '모든 소리 끄기' : '소리 켜기');
  a.setAttribute('aria-pressed', ambient.on && sound.on);
  a.setAttribute('aria-label', ambient.on ? '은은한 짐 소리 끄기' : '은은한 짐 소리 켜기');
  a.title = ambient.on ? '짐 소리 끄기' : '짐 소리 켜기';
  a.disabled = !sound.on;
}
$('#soundBtn').addEventListener('click', () => { sound.on = !sound.on; store.set('jg.sound', sound.on ? '1' : '0'); sound.unlock(); ambient.apply(); renderSoundBtn(); });
$('#ambientBtn').addEventListener('click', () => {
  ambient.on = !ambient.on;
  store.set('jg.ambient', ambient.on ? '1' : '0');
  sound.unlock();
  ambient.apply();
  renderSoundBtn();
  toast(ambient.on ? '은은한 짐 소리를 켰어요.' : '은은한 짐 소리를 껐어요.', 1500);
});
let toastTimer = null;
function toast(text, ms = 0) {
  const t = $('#toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => (t.hidden = true), ms);
}

// ------------------------------------------------------------------ boot
(async function boot() {
  S.me.nick = store.get('jg.nick', '');
  const c = store.get('jg.color', 'orange');
  S.me.color = COLOR_DEFS[c] ? c : 'orange';
  $('#nick').value = S.me.nick;
  renderSoundBtn();
  for (const b of document.querySelectorAll('.shop')) b.disabled = true;
  try { await buildSprites(); } catch { /* 원본 그림 사용 */ }
  renderColorPicker();
  showLobby();

  capability('sample').then((s) => { sample = s; updatePtUI(); });
  capability('room').then((r) => {
    if (!r) return;
    room = r;
    const dead = () => { room = null; lobbyCounts(); syncScene(); };
    r.onPeers(() => { lobbyCounts(); syncScene(); }, dead);
    r.on('chat', onChat, dead);
    if (S.shop) syncPresence(true);
    lobbyCounts();
  });
  setInterval(() => { if (!S.shop) lobbyCounts(); }, 2000);
  if (FAST) window.__jg = { S, G, RULES, sound, ambient }; // 시험용

  try {
    await Promise.all(['jjak', 'buri'].map((id) => G.loadTemplate(id)));
    S.modelsReady = true;
    $('#loadNote').hidden = true;
    for (const b of document.querySelectorAll('.shop')) b.disabled = false;
  } catch (e) {
    console.error(e);
    $('#loadNote').textContent = '3D 캐릭터를 불러오지 못했어요. 새로고침해 주세요.';
    $('#loadNote').classList.add('err');
  }
})();
