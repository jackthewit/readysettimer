// ONLINE GYM — claude.ai 공유 페이지 버전
// 3D 엔진·캐릭터·기구·동작: 「짹짹이 모션 스튜디오」 (window.GymEngine)
// 규칙: 기구는 한 명씩(쓰는 중이면 줄 서기) / 누를 때마다 동작 1회 / 세트를 끝내면 휴식, 그때만 채팅 / PT를 부르면 사람마다 선생님이 한 명씩 옆으로 온다.
// 접속자·기구 점유·줄·위치·몸짓은 room presence, 채팅은 room 이벤트, 부리부리 쌤은 pt-knowledge.part.js의 지식으로 답한다(AI 안 씀).
const $ = (s, el = document) => el.querySelector(s);
const G = window.GymEngine;
const T = G.THREE;

// ------------------------------------------------------------------ 규칙 숫자 (여기만 바꾸면 됨)
const RULES = {
  setsPerStation: 3,
  restMinSec: 20,
  restMaxSec: 20,
  jjakScale: 1.4,    // 짹짹이 크기 (기구에 맞춤)
  repSpeed: 1.4,     // 동작 재생 속도
  walkAnim: 4.2,     // 걷기 동작 재생 속도
  moveSpeed: 2.1,    // 걷는 속도 (m/초) — 방이 넓어져서 빨라짐
  classEveryMin: 30, // 함께 스트레칭: 몇 분마다
  classSec: 120,     // 함께 스트레칭 길이
  nearAvatars: 14,   // 화면에 그리는 다른 사람 수 (가까운 순). 휴대폰은 절반
  queueStep: 0.7,    // 줄 간격 (m)
  idleHoldSec: 90,   // 줄이 있는데 이만큼 멈춰 있으면 다음 사람에게 넘김
  coachWalkSec: 30,  // 부리부리 쌤이 자리를 옮기는 간격
  gestureGapMs: 900, // 몸짓 연타 막기
  durationRestSec: 20, // 시간 운동을 이만큼 넘게 하고 반납하면 쉬는 시간이 된다
  durationShareSec: 300, // 줄이 있으면 시간 운동은 이만큼 하고 넘긴다
};

// 처음 온 사람에게 붙여 주는 닉네임 (메뉴에서 바꿀 수 있음)
// 잔잔한 이름 (예: 느린 스쿼트, 작은 덤벨)
const NICK_A = ['느린', '작은', '꾸준한', '고요한', '다정한', '가벼운', '조용한', '천천한', '단단한', '성실한', '포근한', '오늘의'];
const NICK_B = ['스쿼트', '덤벨', '플랭크', '런지', '매트', '케틀벨', '짐볼', '폼롤러', '스트레칭', '호흡', '어깨', '허벅지', '등근육', '발걸음'];
const randomNick = () => `${NICK_A[Math.floor(Math.random() * NICK_A.length)]} ${NICK_B[Math.floor(Math.random() * NICK_B.length)]}`;

// ------------------------------------------------------------------ 샵 · 기구
// at: 기구 종류와 자리 / stand: 서서 하는 운동 위치(기구 기준) / lift: 기구 위로 올라서는 높이
const SHOPS = {
  pilates: {
    id: 'pilates', set: 'pilatesWide', name: '필라테스샵', tagline: '', reps: 10,
    // 쌤의 첫 자리는 안내 데스크 뒤
    coachSpots: [{ x: 4.3, z: -7.7 }, { x: -2.75, z: -3.6 }, { x: -7.05, z: -2.6 }, { x: 2.24, z: 3.2 }, { x: 6.19, z: -1.6 }], spawn: { x: 6.02, z: -3.4 },
    stations: [
      { id: 'rf1', at: { prop: 'reformer', x: -7.57, z: -6.4 }, name: '리포머 1', ex: '풋워크', preset: 'rfFootwork' },
      { id: 'rf2', at: { prop: 'reformer', x: -4.64, z: -6.4 }, name: '리포머 2', ex: '암 풀', preset: 'rfArmPull' },
      { id: 'rf3', at: { prop: 'reformer', x: -1.72, z: -6.4 }, name: '리포머 3', ex: '힐 프레스', preset: 'rfHeels' },
      { id: 'rf4', hold: true, at: { prop: 'reformer', x: 1.2, z: -6.4 }, name: '리포머 4', ex: '헌드레드', preset: 'rfHundred' },
      { id: 'm1', at: { prop: 'yogaMat', x: -7.22, z: -1.0 }, name: '매트 1', ex: '브릿지', preset: 'bridge' },
      { id: 'm2', hold: true, at: { prop: 'yogaMat', x: -4.3, z: -1.0 }, name: '매트 2', ex: '헌드레드', preset: 'hundred' },
      { id: 'm3', hold: true, at: { prop: 'yogaMat', x: -1.38, z: -1.0 }, name: '매트 3', ex: '캣 / 카우', preset: 'catCow' },
      { id: 'm4', at: { prop: 'yogaMat', x: -7.22, z: 1.6 }, name: '매트 4', ex: '데드버그', preset: 'deadBug' },
      { id: 'm5', at: { prop: 'yogaMat', x: -4.3, z: 1.6 }, name: '매트 5', ex: '롤업', preset: 'rollUp' },
      { id: 'm6', hold: true, at: { prop: 'yogaMat', x: -1.38, z: 1.6 }, name: '매트 6', ex: '스파인 트위스트', preset: 'spineTwist' },
      { id: 'ring', at: { prop: 'pilatesRing', x: 2.24, z: 0.4 }, stand: { dx: 0, dz: 0 }, name: '필라테스 링', ex: '링 조이기', preset: 'ringSqueeze' },
      { id: 'rf5', at: { prop: 'reformer', x: 4.13, z: -2.6 }, name: '리포머 5', ex: '한 다리 풋워크', preset: 'rfSingleLeg' },
      { id: 'm7', at: { prop: 'yogaMat', x: -7.22, z: -3.6 }, name: '매트 7', ex: '티저', preset: 'teaser' },
      { id: 'm8', at: { prop: 'yogaMat', x: -4.3, z: -3.6 }, name: '매트 8', ex: '사이드 킥', preset: 'sideKick' },
      { id: 'm9', at: { prop: 'yogaMat', x: -1.38, z: -3.6 }, name: '매트 9', ex: '스완', preset: 'swan' },
      { id: 'm10', at: { prop: 'yogaMat', x: 1.38, z: -3.6 }, name: '매트 10', ex: '버드독', preset: 'birdDog' },
      { id: 'step', at: { prop: 'stepBox', x: 7.22, z: -1.2 }, stand: { dx: 0, dz: 0 }, lift: 0.2, name: '스텝박스', ex: '카프 레이즈', preset: 'calfRaise' },
      { id: 'cad', at: { prop: 'cadillac', x: -8.08, z: 4, ry: 0 }, name: '캐딜락', ex: '레그 스프링', preset: 'cadLegSpring' },
      { id: 'wunda', at: { prop: 'wundaChair', x: -5.42, z: 4 }, stand: { dx: 0, dz: 0.16 }, seat: 0.64, pedal: true, name: '운다 체어', ex: '시티드 풋워크', preset: 'wundaFootwork' },
      { id: 'barrel', at: { prop: 'ladderBarrel', x: -3.27, z: 4 }, stand: { dx: 0.25, dz: 0 }, seat: 0.94, face: -90, name: '래더 바렐', ex: '숏 박스 라운드 백', preset: 'barrelRoundBack' },
      { id: 'ball1', at: { prop: 'gymBall', x: 4.82, z: 1.6 }, stand: { dx: 0, dz: 0 }, seat: 0.6, name: '짐볼 1', ex: '시티드 마치', preset: 'ballMarch' },
      { id: 'ball2', at: { prop: 'gymBall', x: 6.36, z: 1.6 }, stand: { dx: 0, dz: 0 }, seat: 0.6, name: '짐볼 2', ex: '시티드 트위스트', preset: 'ballTwist' },
      { id: 'ball3', hold: true, at: { prop: 'gymBall', x: 7.91, z: 1.6 }, stand: { dx: 0, dz: 0 }, seat: 0.6, name: '짐볼 3', ex: '사이드 벤드', preset: 'ballSideBend' },
      { id: 'roll1', hold: true, at: { prop: 'foamRoller', x: 2.58, z: 4 }, name: '폼롤러 1', ex: '가슴 열기', preset: 'rollerChestOpen' },
      { id: 'roll2', at: { prop: 'foamRoller', x: 4.99, z: 4 }, name: '폼롤러 2', ex: '데드버그', preset: 'rollerDeadBug' },
      { id: 'mroll1', hold: true, at: { prop: 'yogaMatRolled', x: 7.05, z: 3.8, ry: 90 }, stand: { dx: 0, dz: 0.95 }, name: '말린 매트 1', ex: '앞으로 숙이기', preset: 'seatedFold' },
      { id: 'mroll2', hold: true, at: { prop: 'yogaMatRolled', x: 8.26, z: 3.8, ry: 90 }, stand: { dx: 0, dz: 0.95 }, name: '말린 매트 2', ex: '나비 자세', preset: 'butterfly' },
    ],
  },
  weight: {
    id: 'weight', set: 'gymWide', name: '웨이트샵', tagline: '', reps: 12,
    coachSpots: [{ x: 4.3, z: -7.7 }, { x: -2.75, z: -2.2 }, { x: -5.5, z: -1.2 }, { x: 2.24, z: 3.4 }, { x: 6.19, z: -1.8 }], spawn: { x: 6.02, z: -3.4 },
    stations: [
      { id: 'rack', at: { prop: 'squatRack', x: -7.4, z: -6.6 }, stand: { dx: 0, dz: 0 }, name: '스쿼트 랙 1', ex: '백 스쿼트', preset: 'backSquat' },
      { id: 'rack2', at: { prop: 'squatRack', x: -4.47, z: -6.6 }, stand: { dx: 0, dz: 0 }, name: '스쿼트 랙 2', ex: '백 스쿼트', preset: 'backSquat' },
      { id: 'lift', at: { prop: 'liftPlatform', x: -1.03, z: -6.5 }, stand: { dx: 0, dz: 0 }, name: '플랫폼', ex: '데드리프트', preset: 'deadlift' },
      { id: 'bench', at: { prop: 'flatBench', x: -7.05, z: -2.6, ry: 90 }, name: '벤치 1', ex: '벤치프레스', preset: 'bench' },
      { id: 'bench2', at: { prop: 'flatBench', x: -4.13, z: -2.6, ry: 90 }, name: '벤치 2', ex: '벤치프레스', preset: 'bench' },
      { id: 'db', at: { prop: 'dumbbellRack', x: -1.03, z: -3.2 }, stand: { dx: 0, dz: 0.85 }, name: '덤벨 랙 1', ex: '덤벨 컬', preset: 'curl' },
      { id: 'db2', at: { prop: 'dumbbellRack', x: 1.55, z: -3.2 }, stand: { dx: 0, dz: 0.85 }, name: '덤벨 랙 2', ex: '숄더 프레스', preset: 'press' },
      { id: 'db3', at: { prop: 'dumbbellRack', x: 4.13, z: -3.2 }, stand: { dx: 0, dz: 0.85 }, name: '덤벨 랙 3', ex: '사이드 레터럴', preset: 'lateral' },
      { id: 'kb', at: { prop: 'kettlebell', x: -7.05, z: 1.4 }, stand: { dx: 0.1, dz: 0.75 }, name: '케틀벨 1', ex: '케틀벨 스윙', preset: 'kbSwing' },
      { id: 'kb2', at: { prop: 'kettlebell', x: -4.47, z: 1.4 }, stand: { dx: 0.1, dz: 0.75 }, name: '케틀벨 2', ex: '고블릿 스쿼트', preset: 'gobletSquat' },
      { id: 'mat', at: { prop: 'yogaMat', x: -1.55, z: 1.4 }, name: '매트 1', ex: '푸시업', preset: 'pushup' },
      { id: 'mat2', at: { prop: 'yogaMat', x: 1.2, z: 1.4 }, name: '매트 2', ex: '힙 브릿지', preset: 'hipBridge' },
      { id: 'run', at: { prop: 'treadmill', x: 3.44, z: 1.2 }, stand: { dx: 0, dz: 0 }, lift: 0.09, cardio: 'run', name: '러닝머신 1', ex: '달리기', preset: 'run' },
      { id: 'lat', at: { prop: 'latMachine', x: 2.06, z: -6.8 }, stand: { dx: 0, dz: 0 }, seat: 0.5, bar: { w: 1, from: [0, 2.3, 0.2] }, name: '랫풀다운', ex: '랫풀다운', preset: 'latPulldown' },
      { id: 'rower', cardio: 'row', at: { prop: 'rowingMachine', x: -1.2, z: 4.4 }, stand: { dx: -0.1, dz: 0 }, seat: 0.3, face: 90, slide: -0.35, bar: { w: 0.36, from: [1.05, 0.52, 0] }, name: '로잉 머신', ex: '로잉', preset: 'rowerRow' },
      { id: 'bike', at: { prop: 'spinBike', x: 1.38, z: 4.4 }, stand: { dx: 0, dz: 0 }, seat: 0.88, cardio: 'bike', name: '실내 자전거', ex: '자전거 타기', preset: 'bikePedal' },
      { id: 'legext', at: { prop: 'legExtension', x: 3.78, z: 4.4 }, stand: { dx: 0, dz: 0 }, seat: 0.56, pedal: -1.1, name: '레그 익스텐션', ex: '레그 익스텐션', preset: 'legExtensionMove' },
      { id: 'db4', at: { prop: 'dumbbellRack', x: 7.22, z: -1.8 }, stand: { dx: 0, dz: 0.85 }, name: '덤벨 랙 4', ex: '벤트오버 로우', preset: 'row' },
      { id: 'db5', at: { prop: 'dumbbellRack', x: -3.96, z: 3.8 }, stand: { dx: 0, dz: 0.95 }, name: '덤벨 랙 5', ex: '리버스 런지', preset: 'reverseLunge' },
      { id: 'step', at: { prop: 'stepBox', x: -6.02, z: 4.4 }, stand: { dx: 0, dz: 0 }, lift: 0.2, name: '스텝박스', ex: '카프 레이즈', preset: 'calfRaise' },
      { id: 'pull', at: { prop: 'pullupBar', x: -8.26, z: 4.2 }, stand: { dx: 0, dz: 0 }, lift: 0.86, name: '철봉', ex: '풀업', preset: 'pullUp' },
      { id: 'incline', at: { prop: 'inclineBench', x: 6.88, z: 4 }, stand: { dx: 0.18, dz: 0 }, seat: 0.48, face: 90, name: '인클라인 벤치', ex: '덤벨 프레스', preset: 'inclinePress' },
      { id: 'plate1', at: { prop: 'platesTree', x: -8.77, z: -4.8 }, stand: { dx: 0, dz: 1 }, plate: true, name: '원판 거치대 1', ex: '프런트 레이즈', preset: 'plateRaise' },
      { id: 'plate2', at: { prop: 'platesTree', x: -2.49, z: -8.1, s: 0.9 }, stand: { dx: 0, dz: 1 }, plate: true, name: '원판 거치대 2', ex: '원판 스쿼트', preset: 'plateSquat' },
      { id: 'run2', at: { prop: 'treadmill', x: 5.07, z: 1.2 }, stand: { dx: 0, dz: 0 }, lift: 0.09, cardio: 'run', name: '러닝머신 2', ex: '달리기', preset: 'run' },
      { id: 'stair', at: { prop: 'stairMill', x: 6.71, z: 1.2 }, stand: { dx: 0, dz: 0 }, lift: 0.6, cardio: 'stair', name: '천국의 계단', ex: '계단 오르기', preset: 'stairClimb' },
      { id: 'stair2', at: { prop: 'stairMill', x: 8.34, z: 1.2 }, stand: { dx: 0, dz: 0 }, lift: 0.6, cardio: 'stair', name: '천국의 계단 2', ex: '계단 오르기', preset: 'stairClimb' },
    ],
  },
};
const stationOf = (shopId, id) => SHOPS[shopId]?.stations.find((s) => s.id === id) || null;
const BOUNDS = WORLD.bounds;

// ------------------------------------------------------------------ helpers
const COLOR_DEFS = {
  orange: { label: '주황', hex: 0xF07D28 },
  pink: { label: '핑크', hex: 0xF29BC0 },
  sky: { label: '하늘', hex: 0x5DB7E3 },
  mint: { label: '민트', hex: 0x5CCDAE },
  purple: { label: '보라', hex: 0xA486E0 },
  red: { label: '빨강', hex: 0xE04848 },
  yellow: { label: '노랑', hex: 0xF2D531 },
  lime: { label: '연두', hex: 0x9BD83F },
  green: { label: '초록', hex: 0x2F9E5B },
  navy: { label: '남색', hex: 0x2A3F86 },
  white: { label: '흰색', hex: 0xF7F5F0 },
  black: { label: '검정', hex: 0x2B2B2F },
};
// 나시 색: 기본색 이름 또는 #rrggbb. 다른 사람이 보낸 값은 믿지 않고 여기서 거른다
const isPreset = (c) => typeof c === 'string' && Object.prototype.hasOwnProperty.call(COLOR_DEFS, c);
const validColor = (c, fallback = 'orange') => (isPreset(c) || (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) ? c : fallback);
const BAND_DEFAULT = 'sky', PANTS_DEFAULT = '#7cc243';
const colorHex = (c) => (isPreset(c) ? COLOR_DEFS[c].hex : parseInt(validColor(c).slice(1), 16));
const GESTURES = {
  // say: 머리 위에 뜨는 말. 여럿이면 번갈아 나온다 (몸짓 번호로 골라서 모두에게 같은 말로 보임)
  wave: { say: ['안녕하세요', '운동 좋아하시나봐요', '반가워요', '오늘도 오셨네요', '같이 힘내요', '자세 좋은데요'], preset: 'wave' },
  clap: { say: ['짝짝짝'], preset: 'clap' },
  thumbs: { say: ['최고예요', '멋져요', '잘하시네요'], preset: 'thumbs' },
  hooray: { say: ['해냈다', '오늘도 끝까지', '가볍다'], preset: 'hooray' },
  stretch: { say: ['쭉쭉', '아, 시원하다', '몸 좀 풀게요'], presets: ['sideBend', 'crossArm', 'neck', 'twist', 'shrug', 'forwardFold'], preset: 'sideBend' },
  rest: { say: ['잠깐 쉴게요', '숨 좀 고를게요'], preset: 'butterfly', stay: true },
  stand: { say: [], preset: 'idle' },
  drink: { say: ['꿀꺽'], preset: 'drinkWater' },
};
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

// ------------------------------------------------------------------ sound
const sound = {
  ctx: null,
  on: store.get('jg.sound', '1') === '1',
  unlock() {
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); this.out = this.ctx.createGain(); this.out.gain.value = this.volume; this.out.connect(this.ctx.destination); } catch { /* 소리 없음 */ }
    }
    this.ctx?.resume?.();
  },
  volume: Math.min(1, Math.max(0, parseFloat(store.get('jg.volume', '0.8')))) || 0.8,
  setVolume(v) { this.volume = v; store.set('jg.volume', String(v)); if (this.out) this.out.gain.value = v; },
  beep(freq = 880, dur = 0.12, when = 0, vol = 0.16) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + dur + 0.02);
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
    this.master.connect(sound.out);
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

// 배경음악: 파일 없이 합성 (저작권 걱정 없음). 샵마다 분위기가 다름
// 웨이트: 92 BPM, 단조, 묵직한 박자 / 필라테스: 60 BPM, 부드러운 화음과 맑은 음
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const TRACKS = {
  weight: {
    bpm: 92, steps: 16, level: 0.5,
    chords: [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]], // Am F C G
    play(c, dest, t, step, bar, sec) {
      const ch = this.chords[bar % 4];
      if (step % 8 === 0 || step === 10) kick(c, dest, t, 0.42);
      if (step % 2 === 0) hat(c, dest, t, step % 4 === 2 ? 0.05 : 0.025);
      if (step === 4 || step === 12) snap(c, dest, t, 0.09);
      if ([0, 3, 6, 10, 14].includes(step)) tone(c, dest, 'sawtooth', midi(ch[0] - 12), t, sec * 1.6, 0.13, 320);
      if (step === 0) for (const n of ch.slice(1)) tone(c, dest, 'triangle', midi(n), t, sec * 14, 0.035, 1100, 0.06);
      if (step === 6 || step === 14) tone(c, dest, 'square', midi(ch[1 + (bar % 3)] + 12), t, sec * 1.2, 0.018, 1600);
    },
  },
  pilates: {
    bpm: 60, steps: 16, level: 0.55,
    chords: [[48, 60, 64, 67, 71], [45, 57, 60, 64, 67], [41, 57, 60, 65, 69], [43, 55, 59, 62, 67]], // Cmaj7 Am7 Fmaj7 G
    bell: [72, 74, 76, 79, 81, 84],
    play(c, dest, t, step, bar, sec) {
      const ch = this.chords[bar % 4];
      if (step === 0) {
        tone(c, dest, 'sine', midi(ch[0]), t, sec * 16, 0.11, 500, 1.2);
        for (const n of ch.slice(1)) tone(c, dest, 'triangle', midi(n), t, sec * 16, 0.028, 900, 1.5);
      }
      // 같은 자리에 같은 음이 나오도록 간단한 규칙으로 고른다
      if (step % 4 === 2 || step === 0) {
        const h = (bar * 7 + step * 3) % 11;
        if (h < 7) {
          const n = this.bell[h % this.bell.length];
          tone(c, dest, 'sine', midi(n), t, 1.8, 0.05, 4000, 0.008);
          tone(c, dest, 'sine', midi(n + 12), t, 0.7, 0.012, 6000, 0.005);
        }
      }
    },
  },
};
function tone(c, dest, type, freq, t, dur, vol, cutoff = 4000, attack = 0.008) {
  const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = type; o.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.value = cutoff;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.02, dur));
  o.connect(f).connect(g).connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}
function kick(c, dest, t, vol) {
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + 0.22);
}
const _noise = new WeakMap();
function noiseOf(c) {
  if (_noise.has(c)) return _noise.get(c);
  const b = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  _noise.set(c, b);
  return b;
}
function burst(c, dest, t, vol, dur, type, freq) {
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = noiseOf(c);
  f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(dest);
  s.start(t); s.stop(t + dur + 0.02);
}
const hat = (c, dest, t, vol) => burst(c, dest, t, vol, 0.05, 'highpass', 7000);
const snap = (c, dest, t, vol) => burst(c, dest, t, vol, 0.14, 'bandpass', 1700);
/** 음악 소리 길: 필라테스는 잔향을 조금 더해 공간감을 준다 */
function musicBus(c, kind, out) {
  const bus = c.createGain(), comp = c.createDynamicsCompressor();
  bus.gain.value = TRACKS[kind].level;
  bus.connect(comp).connect(out);
  if (kind === 'pilates') {
    const d = c.createDelay(1), fb = c.createGain(), wet = c.createGain();
    d.delayTime.value = 0.5; fb.gain.value = 0.36; wet.gain.value = 0.3;
    bus.connect(d); d.connect(fb).connect(d); d.connect(wet).connect(comp);
  }
  return bus;
}
const music = {
  on: store.get('jg.music', '1') === '1',
  kind: null, bus: null, master: null, timer: null, nextT: 0, step: 0, bar: 0,
  start(kind) { this.kind = kind; this.apply(); },
  stop() { this.kind = null; this.apply(); },
  apply() {
    const want = this.kind && this.on && sound.on && sound.ctx;
    if (!want) { this.teardown(); return; }
    if (this.master) return;
    const ctx = sound.ctx;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
    this.master.connect(sound.out);
    this.bus = musicBus(ctx, this.kind, this.master);
    this.nextT = ctx.currentTime + 0.15; this.step = 0; this.bar = 0;
    this.pump();
    this.timer = setInterval(() => this.pump(), 250);
  },
  // 탭이 내려가도 끊기지 않게 2초 앞까지 미리 넣어 둔다
  pump() {
    const ctx = sound.ctx, tr = TRACKS[this.kind];
    if (!ctx || !tr || !this.bus) return;
    const sec = 60 / tr.bpm / 4;
    if (this.nextT < ctx.currentTime) this.nextT = ctx.currentTime + 0.05;
    while (this.nextT < ctx.currentTime + 2) {
      tr.play(ctx, this.bus, this.nextT, this.step, this.bar, sec);
      this.nextT += sec;
      this.step = (this.step + 1) % tr.steps;
      if (!this.step) this.bar++;
    }
  },
  teardown() {
    clearInterval(this.timer); this.timer = null;
    if (!this.master) return;
    const m = this.master, ctx = sound.ctx;
    this.master = null; this.bus = null;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    setTimeout(() => m.disconnect(), 700);
  },
  /** 시험용: 소리를 내지 않고 몇 초 만들어 크기를 잰다 */
  async measure(kind, seconds) {
    const c = new OfflineAudioContext(2, 44100 * seconds, 44100), tr = TRACKS[kind], sec = 60 / tr.bpm / 4;
    const bus = musicBus(c, kind, c.destination);
    let t = 0.05, step = 0, bar = 0;
    while (t < seconds) { tr.play(c, bus, t, step, bar, sec); t += sec; step = (step + 1) % tr.steps; if (!step) bar++; }
    const d = (await c.startRendering()).getChannelData(0);
    let peak = 0, sum = 0;
    for (const v of d) { peak = Math.max(peak, Math.abs(v)); sum += v * v; }
    return { peak, rms: Math.sqrt(sum / d.length) };
  },
};

// ------------------------------------------------------------------ state
const S = {
  shop: null,
  unread: 0,
  lastChatAt: 0,
  lastGestureAt: 0,
  coachSlot: null,
  coachBusyUntil: 0,
  coachHome: true,
  stationBox: {},
  lastBeep: null,
  lastPresenceAt: 0,
  ptTeacher: null,    // 내 PT 선생님 3D
  ptTimer: null,
  announce: false,
  me: {
    nick: '', color: 'orange', band: BAND_DEFAULT, pants: PANTS_DEFAULT,
    station: null, claimedAt: 0, on: false, // on: 기구에 올라가 있음
    queue: null, queuedAt: 0,               // 줄 서 있는 기구
    gest: null, gestN: 0,                   // 몸짓: 숫자가 올라가면 한 번 재생
    pt: 0,                                  // PT 중: 선생님 옷 색을 정하는 수 (모두에게 같은 색으로 보임)
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
const capability = (name) => (window.claude?.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null));

function syncPresence(force = false) {
  if (!room || !S.shop) return;
  const now = Date.now();
  if (!force && now - S.lastPresenceAt < 180) return;
  S.lastPresenceAt = now;
  const m = S.me, A = S.meA;
  room.presence({
    nick: m.nick, color: m.color, band: m.band, pants: m.pants, shop: S.shop,
    station: m.station, claimedAt: m.claimedAt, on: m.on,
    queue: m.queue, queuedAt: m.queuedAt, gest: m.gest, gestN: m.gestN, pt: m.pt, lv: A?._cardio ? Math.round(A._cardio.lv * 10) / 10 : 0, cls: !!m.classOn,
    state: m.state, reps: m.reps, set: m.set, restUntil: m.restUntil,
    x: A ? Math.round(A.place.x * 100) / 100 : null,
    z: A ? Math.round(A.place.z * 100) / 100 : null,
  }).catch(() => {});
}

// ------------------------------------------------------------------ 3D: 배우 · 걷기 · 기구
const presetClip = (id) => G.presetClip(G.presetById(id));

function makeJjak(x, z, color, band, pants) {
  const A = G.addActor('jjak', { x, z });
  if (!A) return null;
  A.place.s = RULES.jjakScale;
  G.applyPlace(A);
  paint(A, color, band, pants);
  return A;
}
function paintPart(A, matName, hex) {
  for (const m of A.inst.meshes) if (m.userData.matName === matName) {
    if (!m.userData._own) { m.material = m.material.clone(); m.userData._own = true; }
    m.material.color.setHex(hex);
  }
}
function paint(A, shirt, band, pants) {
  shirt = validColor(shirt);
  band = validColor(band, BAND_DEFAULT);
  pants = validColor(pants, PANTS_DEFAULT);
  if (A._pants !== pants) { A._pants = pants; paintPart(A, 'shorts_green', colorHex(pants)); }
  if (A._shirt !== shirt) { A._shirt = shirt; paintPart(A, 'shirt_orange', colorHex(shirt)); }
  if (A._band !== band) { A._band = band; paintPart(A, 'band_sky', colorHex(band)); }
}
function setIdle(A) { A.speed = 1; G.setClip(A, presetClip('idle'), { blend: 0.25 }); }
function setWalkClip(A) { A.speed = RULES.walkAnim; G.setClip(A, presetClip('walk'), { blend: 0.2 }); }

function walkTo(A, x, z, then, within = 0) {
  x = clamp(x, BOUNDS.x0, BOUNDS.x1); z = clamp(z, BOUNDS.z0, BOUNDS.z1);
  const was = S.walk.get(A);
  const d = Math.hypot(x - A.place.x, z - A.place.z);
  S.walk.set(A, { x, z, then, v: within ? Math.max(RULES.moveSpeed, d / within) : 0 });
  if (!was) setWalkClip(A);
}
function stepWalkers(dt) {
  for (const [A, w] of S.walk) {
    if (!A.root.parent) { S.walk.delete(A); continue; }
    const dx = w.x - A.place.x, dz = w.z - A.place.z, d = Math.hypot(dx, dz);
    const v = w.v || RULES.moveSpeed;
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
        B.seatH = st.seat || 0; B.reformer = null;
        B.place.x = ap.x; B.place.z = ap.z; B.place.ry = st.face || 0; B.place.elev = G.floorAt(ap.x, ap.z) + (st.lift || 0);
        G.applyPlace(B);
      },
    });
  } else {
    G.mountStation(A, obj, st.preset);
    A.loop = false;
  }
  holdRep(A);
  A._cardio = st.cardio || st.hold ? newCardio(st, obj) : null;
  A._pedal = st.pedal ? obj.userData.moving.pedal : null;
  A._pedalAmp = st.pedal === true ? 0.32 : st.pedal || 0;
  if (st.bar && !A._barObj) {
    const from = obj.localToWorld(new T.Vector3(...st.bar.from));
    A._barObj = WORLD.makeBar(st.bar.w, from);
    G.actorLayer.add(A._barObj.group, A._barObj.cable);
  }
  if (st.slide) {
    const seatMesh = obj.userData.moving.seat;
    A._slide = { x0: approachPoint(st).x, amp: st.slide, seat: seatMesh, base: seatMesh.position.x };
  }
  if (st.plate && !A._plateObj) { A._plateObj = WORLD.makePlate(); G.actorLayer.add(A._plateObj); }
}
// 시간 운동. 유산소 기구는 연타할수록 빨라지고 안 누르면 천천히 느려진다. 스트레칭·헌드레드(hold)는 시작하면 멈출 때까지 이어진다
const CARDIO_LABEL = {
  run: (lv) => `시속 ${(lv ? 5 + lv * 1.3 : 0).toFixed(1)}km`,
  stair: (lv) => `${lv ? Math.round(lv + 1) : 0}단계`,
  bike: (lv) => `${lv ? Math.round(40 + lv * 8) : 0}rpm`,
  row: (lv) => `분당 ${lv ? Math.round(18 + lv * 2) : 0}회`,
};
function newCardio(st, obj) {
  const mv = obj.userData.moving || {};
  return { lv: 0, phase: 0, sec: 0, moving: true, st, hold: !!st.hold, keepPose: !!st.seat || !!st.hold, belt: mv.belt, steps: mv.steps, stepAt: 0, label: CARDIO_LABEL[st.cardio] || (() => '') };
}
function cardioPress(A) {
  const c = A._cardio;
  if (c.hold) c.lv = c.lv ? 0 : 1;
  else c.lv = Math.min(10, c.lv + 0.6);
}
function stepCardio(A) {
  const c = A._cardio, nowMs = performance.now(), dt = Math.min(1, (nowMs - (c.at || nowMs)) / 1000); // 화면이 느려도 시간은 실제대로
  c.at = nowMs;
  // 조금씩 계속 느려지므로 누르는 빠르기가 곧 속도가 된다 (1초에 1번 ≈ 2.4단계, 4번 ≈ 9.6단계)
  if (!c.hold) { c.lv *= Math.exp(-dt * 0.25); if (c.lv < 0.15) c.lv = 0; }
  if (c.lv > 0) {
    c.sec += dt;
    if (!c.moving) { c.moving = true; if (!c.keepPose) G.setClip(A, presetClip(c.st.preset), { blend: 0.15 }); }
    const speed = 0.6 + c.lv * 0.24;
    c.phase += dt * speed;
    A.speed = 1;
    A.loop = true;
    A.start = G.clock.t - c.phase;
    if (c.belt) c.belt.material.map.offset.y -= dt * (0.3 + c.lv * 0.4);
    if (c.steps) {
      c.stepAt = (c.stepAt + dt * (0.1 + c.lv * 0.05)) % 1;
      c.steps.forEach((s, i) => WORLD.placeStep(s, ((i / c.steps.length) - c.stepAt + 1) % 1));
    }
  } else if (c.moving) {
    c.moving = false;
    if (!c.keepPose) { A.speed = 1; G.setClip(A, presetClip('idle'), { blend: 0.3 }); }
  } else if (c.keepPose) { // 멈춘 자세 그대로
    A.speed = 1;
    A.start = G.clock.t - c.phase;
  }
}
function dropPlate(A) {
  A._cardio = null;
  if (A._plateObj) { A._plateObj.parent?.remove(A._plateObj); A._plateObj = null; }
  if (A._pedal) { A._pedal.rotation.x = 0; A._pedal = null; }
  if (A._barObj) { A._barObj.group.parent?.remove(A._barObj.group); A._barObj.cable.parent?.remove(A._barObj.cable); A._barObj = null; }
  if (A._slide) { A._slide.seat.position.x = A._slide.base; A._slide = null; }
}
// 손 사이의 원판과 페달이 동작을 따라가게
G.hooks.push((dt) => {
  if (S.repQueued && S.meA && S.me.on && S.me.state === 'set' && !S.meA._cardio && !repBusy(S.meA)) doRep();
  for (const A of G.actors) {
    if (A._cardio) stepCardio(A);
    if (A._plateObj) {
      const l = G.wp(A, A.hands.L.wrist), r = G.wp(A, A.hands.R.wrist);
      A._plateObj.position.copy(l).add(r).multiplyScalar(0.5);
      A._plateObj.rotation.y = A.place.ry * Math.PI / 180;
    }
    let u = A.clip ? (G.clock.t - A.start) * A.speed / G.clipDur(A.clip) : 2;
    if (A._cardio) u %= 1; // 되풀이
    const wave = u >= 0 && u <= 1 ? Math.sin(Math.PI * u) : 0;
    if (A._pedal) A._pedal.rotation.x = wave * A._pedalAmp;
    if (A._slide) {
      A.place.x = A._slide.x0 + wave * A._slide.amp;
      G.applyPlace(A);
      A._slide.seat.position.x = A._slide.base + wave * A._slide.amp;
    }
    if (A._barObj) {
      const l = G.wp(A, A.hands.L.wrist), r = G.wp(A, A.hands.R.wrist);
      WORLD.placeBar(A._barObj, l.add(r).multiplyScalar(0.5), A.place.ry);
    }
  }
});
/** 동작 끝 자세로 멈춰 두기 (대부분 처음 자세와 같음) */
function holdRep(A) { A.start = G.clock.t - G.clipDur(A.clip) / A.speed - 0.01; }
function playRep(A) { A.start = G.clock.t; }
function repBusy(A) { return (G.clock.t - A.start) * A.speed < G.clipDur(A.clip) - 0.05; }
function unmountActor(A, st) {
  dropPlate(A);
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
}
// 쌤 자리: 시각으로 정해져서 접속한 사람 모두에게 같은 곳으로 보임
const coachSlotAt = (ms) => Math.floor(ms / (RULES.coachWalkSec * 1000));
// 쌤은 절반은 안내 데스크에, 나머지는 짐 안을 둘러본다
const coachSpotAt = (slot, spots) => (slot % 2 === 0 ? spots[0] : spots[1 + slotPick(slot, spots.length - 1)]);
const slotPick = (slot, n) => ((Math.imul(slot, 2654435761) >>> 0) >>> 13) % n;
// 선생님 옷 색: 같은 수면 누구 화면에서나 같은 색
function dressTeacher(B, seed) {
  const hue = (seed * 137.508) % 360;
  paintPart(B, 'tank_sky', parseInt(hslToHex(hue, 0.72, 0.5).slice(1), 16));
  paintPart(B, 'pants_gray', parseInt(hslToHex((seed * 53.1) % 360, 0.3, 0.24).slice(1), 16));
}
/** PT 선생님: 입구로 들어와 그 사람 옆에 선다 */
function teacherCome(A, seed, then) {
  const d = WORLD.doorSpot, B = G.addActor('buri', { x: d.x, z: d.z });
  if (!B) return null;
  B.place.s = 0.8; G.applyPlace(B);
  dressTeacher(B, seed);
  WORLD.openDoor();
  const side = A.place.x > 0 ? -1 : 1;
  walkTo(B, A.place.x + side * 1.5, A.place.z + 0.75, () => {
    B.speed = 1;
    faceTo(B, A.place.x, A.place.z);
    G.setClip(B, presetClip('armsCross'), { blend: 0.25 });
    if (then) then();
  }, 2.5);
  return B;
}
/** 일이 끝난 선생님은 입구로 나가서 사라진다 */
function teacherGo(B) {
  const d = WORLD.doorSpot;
  walkTo(B, d.x, d.z, () => G.removeActor(B), 2);
}
function stepCoach(now) {
  const B = S.coach, shop = SHOPS[S.shop];
  if (!B || !B.root.parent) return;
  if (S.coachClass) return;
  const slot = coachSlotAt(now);
  if (slot === S.coachSlot || now < S.coachBusyUntil) return;
  S.coachSlot = slot;
  const p = coachSpotAt(slot, shop.coachSpots);
  if (Math.hypot(p.x - B.place.x, p.z - B.place.z) < 0.1) return;
  walkTo(B, p.x, p.z, () => {
    B.speed = 1;
    B.place.ry = 0; G.applyPlace(B);
    G.setClip(B, presetClip('armsCross'), { blend: 0.25 });
  });
}

// ------------------------------------------------------------------ 3D 장면 만들기
function buildShop(shopId) {
  const shop = SHOPS[shopId];
  for (const A of G.actors.slice()) { dropCup(A); G.removeActor(A); }
  S.walk.clear();
  S.remotes.clear();
  const set = G.setSet(shop.set);
  S.stationObj = {};
  for (const st of shop.stations) {
    const o = G.AS.props[st.at.prop].build();
    o.position.set(st.at.x, 0, st.at.z);
    if (st.at.ry) o.rotation.y = st.at.ry * Math.PI / 180;
    if (st.at.s) o.scale.setScalar(st.at.s);
    set.add(o);
    S.stationObj[st.id] = o;
  }
  set.updateMatrixWorld(true);
  // 마우스·터치 판정용 바닥 자리
  S.stationBox = {};
  for (const st of shop.stations) {
    const box = new T.Box3().setFromObject(S.stationObj[st.id]);
    box.expandByVector(new T.Vector3(0.12, 0, 0.12));
    // 작은 기구(케틀벨·링)도 누르기 쉽게 바닥 자리를 넉넉히
    for (const k of ['x', 'z']) { const c = (box.min[k] + box.max[k]) / 2; box.min[k] = Math.min(box.min[k], c - 0.5); box.max[k] = Math.max(box.max[k], c + 0.5); }
    S.stationBox[st.id] = box;
  }
  buildHoverMark(set);
  // 부리부리 쌤
  S.coachSlot = coachSlotAt(Date.now());
  S.coachBusyUntil = 0;
  const cs = coachSpotAt(S.coachSlot, shop.coachSpots);
  const B = G.addActor('buri', { x: cs.x, z: cs.z });
  B.place.s = 0.8; G.applyPlace(B);
  dressTeacher(B, Math.floor(Date.now() / 864e5) * (shopId === 'weight' ? 7 : 13) + 1); // 상주 쌤 옷은 날마다 바뀜
  G.setClip(B, presetClip('armsCross'), { blend: 0 });
  S.coach = B;
  S.ptTeacher = null;
  clearTimeout(S.ptTimer);
  S.me.pt = 0;
  // 나
  // 입구로 들어와서 안으로 걸어 들어온다
  const sx = shop.spawn.x + (Math.random() - 0.5) * 2.4, sz = shop.spawn.z + Math.random() * 0.8;
  S.meA = makeJjak(WORLD.doorSpot.x, WORLD.doorSpot.z, S.me.color, S.me.band, S.me.pants);
  WORLD.openDoor();
  walkTo(S.meA, sx, sz);
  // 카메라
  const narrow = matchMedia('(max-width: 860px)').matches;
  if (narrow) G.sun.shadow.mapSize.set(1024, 1024); // 휴대폰은 그림자를 가볍게
  S.followX = narrow ? 1 : 0.8; // 내 짹짹이를 따라 방 안을 보여 준다
  G.cam.position.set(sx * S.followX, narrow ? 9.4 : 7.2, sz + (narrow ? 12.5 : 11));
  G.orbit.target.set(sx * S.followX, 0.6, sz - 2.2);
  G.orbit.enablePan = false; G.orbit.minDistance = 3; G.orbit.maxDistance = narrow ? 30 : 26;
  // 방이 넓어져서 그림자 범위도 넓힌다
  Object.assign(G.sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, far: 32 });
  G.sun.shadow.camera.updateProjectionMatrix(); G.orbit.maxPolarAngle = Math.PI * 0.45;
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
  G.sun.position.set(A.place.x + 3.5, 9, A.place.z + 6);
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
    c.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') setHover(st.id); });
    c.addEventListener('pointerleave', () => setHover(null));
    c.addEventListener('focus', () => setHover(st.id));
    c.addEventListener('blur', () => setHover(null));
    bar.append(c);
  }
  tagFor('me', true);
  const ct = tagFor('coach');
  ct.classList.add('coach');
  ct.querySelector('.nm').textContent = '부리부리 쌤';
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
  // 말풍선이 있으면 화면 밖으로 잘리지 않게 안쪽으로 민다
  const half = el.querySelector('.bubble') ? el.offsetWidth / 2 + 4 : 0, w = $('#view').clientWidth;
  const x = half ? Math.max(half, Math.min(w - half, p.x)) : p.x;
  el.style.transform = `translate(${x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
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
  if (S.ptTeacher && S.tags.get('pt')) placeTag(S.tags.get('pt'), S.ptTeacher, 0.3);
  for (const [peer, R] of S.remotes) {
    const el = tagFor(peer);
    el.querySelector('.nm').textContent = R.nick;
    el.querySelector('.st').textContent = statusText(R, now);
    el.classList.toggle('resting', R.state === 'rest');
    el.classList.toggle('hidden', !!R.hiddenFar);
    if (!R.hiddenFar) placeTag(el, R.A, 0.42);
  }
}
function statusText(m, now) {
  if (m.state === 'rest') return `휴식 ${fmt(m.restUntil - now)}`;
  const c = (m === S.me ? S.meA : m.A)?._cardio;
  if (c) return m.on ? c.label(c.lv) : '';
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
      color: validColor(pr.color),
      band: validColor(pr.band, BAND_DEFAULT),
      pants: validColor(pr.pants, PANTS_DEFAULT),
      station: stationOf(S.shop, pr.station) ? pr.station : null,
      claimedAt: num(pr.claimedAt, Infinity),
      queue: stationOf(S.shop, pr.queue) ? pr.queue : null,
      queuedAt: num(pr.queuedAt, Infinity),
      gest: GESTURES[pr.gest] ? pr.gest : null,
      gestN: Math.max(0, Math.floor(num(pr.gestN))),
      cls: pr.cls === true,
      pt: Math.max(0, Math.min(1e6, Math.floor(num(pr.pt)))),
      lv: Math.max(0, Math.min(10, num(pr.lv))),
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
      toast(`${o.nick} 님이 먼저 잡으셔서 줄을 서 둘게요.`, 2800);
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
      toast(`${stationOf(S.shop, id).name} 차례가 됐어요.`, 2800);
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
      const x = m.x ?? WORLD.doorSpot.x, z = m.z ?? WORLD.doorSpot.z;
      const A = makeJjak(x, z, m.color, m.band, m.pants);
      if (!A) continue;
      R = { A, mounted: null, lastReps: m.reps, lastGestN: m.gestN };
      S.remotes.set(m.peer, R);
      if (S.announce) { sysLine(`${m.nick} 님이 들어왔어요`, ''); coachGreet(m.nick, A); WORLD.openDoor(); }
    }
    Object.assign(R, { nick: m.nick, color: m.color, band: m.band, pants: m.pants, state: m.state, reps: m.reps, set: m.set, restUntil: m.restUntil, on: m.on });
    paint(R.A, m.color, m.band, m.pants);
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
    // 그 사람의 PT 선생님 (멀어서 안 그리는 사람은 뺀다)
    if (m.pt && R.mounted && !R.hiddenFar) { if (!R.teacher) R.teacher = teacherCome(R.A, m.pt); }
    else if (R.teacher) { teacherGo(R.teacher); R.teacher = null; }
    // 함께 스트레칭: 같은 시각 같은 동작
    const cl = classNow(Date.now());
    if (m.cls && cl.on && !R.mounted) classClip(R.A, cl.idx);
    else if (R.A._classIdx != null) classEnd(R.A);
    // 정수기까지 걸어간 뒤에 마신다
    const drinkWait = m.gest === 'drink' && m.x != null && Math.hypot(m.x - R.A.place.x, m.z - R.A.place.z) > 0.15;
    if (m.gestN !== R.lastGestN && !drinkWait) {
      R.lastGestN = m.gestN;
      if (m.gest) {
        playGesture(R.A, m.peer, m.gest, !!R.mounted, m.gestN);
        if (['wave', 'clap', 'thumbs', 'hooray'].includes(m.gest)) noteGreeting(m.nick, m.gest);
      }
    }
    if (R.mounted) {
      if (R.A._cardio) R.A._cardio.lv = m.lv;
      else if (m.reps > R.lastReps && m.state !== 'idle') playRep(R.A);
      R.lastReps = m.reps;
    } else if (m.x != null && m.z != null && !gesturing(R.A)) {
      const w = S.walk.get(R.A);
      const tx = w ? w.x : R.A.place.x, tz = w ? w.z : R.A.place.z;
      if (Math.hypot(m.x - tx, m.z - tz) > 0.05) {
        if (Math.hypot(m.x - R.A.place.x, m.z - R.A.place.z) > 12) { R.A.place.x = m.x; R.A.place.z = m.z; G.applyPlace(R.A); }
        else walkTo(R.A, m.x, m.z);
      }
    }
  }
  for (const [peer, R] of S.remotes) {
    if (seen.has(peer)) continue;
    if (R.teacher) teacherGo(R.teacher);
    dropCup(R.A);
    if (R.mounted) unmountActor(R.A, stationOf(S.shop, R.mounted));
    S.walk.delete(R.A);
    G.removeActor(R.A);
    S.remotes.delete(peer);
    dropTag(peer);
    if (S.announce && R.nick) sysLine(`${R.nick} 님이 나갔어요`, '');
  }
  // 가까운 사람만 그린다
  if (S.remotes.size > 6 && S.meA) {
    const cap = matchMedia('(max-width: 860px)').matches ? RULES.nearAvatars >> 1 : RULES.nearAvatars;
    const near = [...S.remotes.values()].sort((p, q) => Math.hypot(p.A.place.x - S.meA.place.x, p.A.place.z - S.meA.place.z) - Math.hypot(q.A.place.x - S.meA.place.x, q.A.place.z - S.meA.place.z));
    near.forEach((Rm, i) => { const show = i < cap || !!Rm.mounted; Rm.A.visible = show; Rm.A.root.visible = show; Rm.hiddenFar = !show; });
  } else for (const Rm of S.remotes.values()) if (Rm.hiddenFar) { Rm.A.visible = true; Rm.A.root.visible = true; Rm.hiddenFar = false; }
  // 기구 목록
  for (const st of SHOPS[S.shop].stations) {
    const c = $(`#pick-${st.id}`);
    if (!c) continue;
    const o = own.get(st.id), line = queue.get(st.id) || [], myIdx = line.findIndex((m) => m.me);
    c.classList.toggle('busy', !!o && !o.me);
    c.classList.toggle('mine', !!o && o.me);
    c.classList.toggle('lined', myIdx >= 0);
    const wait = line.length ? ` · 대기 ${line.length}` : '';
    c.querySelector('small').textContent = myIdx >= 0 ? `내 앞에 ${myIdx + (o ? 1 : 0)}명` : !o ? (line.length ? `대기 ${line.length}` : st.ex) : o.me ? '내가 쓰는 중' : `사용 중${wait}`;
    c.setAttribute('aria-label', `${st.name} ${st.ex}, ${!o ? '비어 있어요. 눌러서 시작' : o.me ? '내가 쓰는 중' : `${o.nick} 님이 쓰는 중, 대기 ${line.length}명. 눌러서 줄 서기`}`);
  }
  renderCount(list.length);
  S.lineAhead = S.me.queue ? (queue.get(S.me.queue) || []).findIndex((m) => m.me) + (own.get(S.me.queue) ? 1 : 0) : 0;
  S.lineBehind = S.me.station ? (queue.get(S.me.station) || []).length : 0;
}
function renderCount(n) {
  $('#memberCount').textContent = n > 1 ? `지금 ${n}명이 함께 운동 중` : '지금은 혼자예요. 부리부리 쌤이 함께 있어요.';
}

// ------------------------------------------------------------------ 내 행동
function claimStation(id) {
  if (!S.shop || !S.meA) return;
  const st = stationOf(S.shop, id);
  if (!st || S.me.station === id) return;
  const list = members(), own = owners(list).get(id), line = lines(list).get(id) || [];
  if ((own && !own.me) || (line.length && !line[0].me)) { joinQueue(id); return; }
  if (S.me.on && S.me.state === 'set' && S.me.reps > 0) { toast('세트 중이에요. 기구를 반납하면 옮길 수 있어요.', 2200); return; }
  sound.unlock();
  if (S.me.on) dismount(true);
  standUp();
  const resting = S.me.state === 'rest';
  VISIT.st.add(id);
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
    renderHud();
  }, 2.5); // 아무리 멀어도 2.5초 안에 도착
  renderHud();
  syncScene();
}
function dismount(silent) {
  const st = stationOf(S.shop, S.me.station);
  const c = S.me.on && S.meA?._cardio;
  if (c) noteTime(st, c.sec);
  if (S.me.on) unmountActor(S.meA, st);
  S.me.on = false;
  ptDismiss();
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
$('#releaseBtn').addEventListener('click', () => {
  const sec = S.meA?._cardio?.sec || 0;
  releaseStation();
  if (sec >= RULES.durationRestSec && S.me.state !== 'rest') startRest('수고했어요.');
});

// ------------------------------------------------------------------ 줄 서기
function joinQueue(id, quiet = false) {
  const st = stationOf(S.shop, id);
  if (!st || S.me.queue === id) return;
  if (S.me.station) { toast('지금 쓰는 기구를 반납하면 줄을 설 수 있어요.', 2400); return; }
  S.me.queue = id;
  S.me.queuedAt = Date.now();
  if (!quiet) toast(`${st.name} 줄에 섰어요. 차례가 되면 바로 시작해요.`, 2400);
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
/** 일어나서 움직이기 전에: 앉아 있었거나 함께 스트레칭 중이었으면 풀어 준다 */
function standUp() {
  const m = S.me, A = S.meA;
  if (m.classOn) leaveClass();
  if (m.gest === 'rest') { m.gest = 'stand'; m.gestN += 1; $('#gest-rest').setAttribute('aria-pressed', false); }
  if (A) A._gestUntil = 0;
}
// 누가 몸짓을 하면 조용히 알려 준다 (너무 잦으면 묶어서)
let lastGreetAt = 0;
function noteGreeting(nick, id) {
  const now = Date.now();
  if (now - lastGreetAt < 2500) return;
  lastGreetAt = now;
  const word = { wave: '인사했어요', clap: '박수를 보냈어요', thumbs: '엄지를 들었어요', hooray: '만세를 했어요' }[id];
  sysLine(`${nick} 님이 ${word}`, '');
}
/** 기구 위에서는 몸이 묶여 있으니 머리 위 그림만 띄운다 */
function playGesture(A, tagKey, id, busy, n = 0) {
  const g = GESTURES[id];
  if (!g || !A) return;
  if (id === 'drink') { faceTo(A, WORLD.cooler.x, WORLD.cooler.z); holdCup(A); }
  if (g.say.length) floatWord(tagKey, g.say[n % g.say.length]);
  A._gest = id;
  if (busy) return;
  S.walk.delete(A);
  A.speed = 1;
  if (id === 'stand') { A._gestUntil = 0; setIdle(A); return; }
  if (g.stay) { G.setClip(A, presetClip(g.preset), { blend: 0.3 }); A._gestUntil = Infinity; return; }
  G.playOnce(A, g.presets ? g.presets[n % g.presets.length] : g.preset, 'idle', { blend: 0.2 }); // 스트레칭은 누를 때마다 다른 동작
  A._gestUntil = G.clock.t + G.clipDur(A.clip) + 0.1;
}
// 정수기: 걸어가서 컵으로 물을 마신다 (모두에게 보임)
function holdCup(A) {
  if (A._cup) return;
  const cup = new T.Group();
  cup.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.038, 0.11, 14), new T.MeshLambertMaterial({ color: 0xF6F0E4 })));
  const water = new T.Mesh(new T.CylinderGeometry(0.044, 0.04, 0.07, 14), new T.MeshLambertMaterial({ color: 0x8CCDEB }));
  water.position.y = 0.022;
  cup.add(water);
  cup.userData.until = G.clock.t + 4.2;
  A._cup = cup;
  G.actorLayer.add(cup);
}
function dropCup(A) {
  if (A._cup) { A._cup.parent?.remove(A._cup); A._cup = null; }
}
G.hooks.push(() => {
  for (const A of G.actors) {
    if (!A._cup) continue;
    if (G.clock.t > A._cup.userData.until || !gesturing(A)) { dropCup(A); continue; }
    A._cup.position.copy(G.wp(A, A.hands.R.wrist));
    A._cup.position.y += 0.03;
    A._cup.rotation.y = A.place.ry * Math.PI / 180;
  }
});
function drinkWater() {
  const m = S.me, A = S.meA;
  if (!A) return;
  if (m.on) { toast('기구를 반납하면 물을 마실 수 있어요.', 2200); return; }
  sound.unlock();
  if (m.station) { m.station = null; m.claimedAt = 0; if (m.state === 'set') m.state = 'idle'; }
  leaveQueue();
  standUp();
  const sp = WORLD.coolerSpot;
  walkTo(A, sp.x, sp.z, () => {
    m.gest = 'drink';
    m.gestN += 1;
    sound.gesture();
    playGesture(A, 'me', 'drink', false, m.gestN);
    syncPresence(true);
  }, 2.5);
  syncPresence(true);
  renderHud();
}
for (const btn of document.querySelectorAll('[data-gesture]')) {
  btn.addEventListener('click', () => {
    btn.blur();
    let id = btn.dataset.gesture;
    const now = Date.now(), m = S.me;
    if (!S.shop || !S.meA || now - S.lastGestureAt < RULES.gestureGapMs) return;
    if (id === 'rest' && m.gest === 'rest') id = 'stand'; // 한 번 더 누르면 일어남
    btn.setAttribute('aria-pressed', id === 'rest');
    S.lastGestureAt = now;
    sound.unlock();
    sound.gesture();
    m.gest = id;
    m.gestN += 1;
    VISIT.gest++;
    playGesture(S.meA, 'me', id, !!m.station, m.gestN);
    syncPresence(true);
  });
}

// 함께 스트레칭: 매시 정각과 30분에 2분. 쌤이 앞에서 하고, 같이 하기를 누른 사람은 같은 동작을 한다
const CLASS_MOVES = [['neck', '목 옆 늘리기'], ['shrug', '어깨 돌리기'], ['crossArm', '팔 가로 당기기'], ['sideBend', '옆구리 늘리기'], ['twist', '허리 돌리기'], ['forwardFold', '앞으로 숙이기']];
let classShift = 0; // 시험용
function classNow(nowMs) {
  const every = RULES.classEveryMin * 60, t = (nowMs + classShift) / 1000, into = t % every;
  if (into < RULES.classSec) {
    const idx = Math.min(CLASS_MOVES.length - 1, Math.floor(into / (RULES.classSec / CLASS_MOVES.length)));
    return { on: true, idx, left: RULES.classSec - into };
  }
  return { on: false, wait: every - into };
}
function classClip(A, idx) {
  if (A._classIdx === idx) return;
  A._classIdx = idx;
  S.walk.delete(A);
  A.speed = 1;
  A._gestUntil = Infinity;
  G.setClip(A, presetClip(CLASS_MOVES[idx][0]), { blend: 0.4 });
}
function classEnd(A) {
  if (A._classIdx == null) return;
  A._classIdx = null;
  A._gestUntil = 0;
  setIdle(A);
}
function joinClass() {
  const m = S.me;
  if (m.station) releaseStation(true);
  leaveQueue();
  m.classOn = true;
  syncPresence(true);
  sysLine('함께 스트레칭을 시작했어요.', 'rest');
  stepClass(Date.now());
}
function leaveClass() {
  S.me.classOn = false;
  if (S.meA) classEnd(S.meA);
  syncPresence(true);
  stepClass(Date.now());
}
$('#classBtn').addEventListener('click', () => { sound.unlock(); if (S.me.classOn) leaveClass(); else joinClass(); });
function stepClass(nowMs) {
  const c = classNow(nowMs), bar = $('#classBar'), m = S.me;
  if (c.on) {
    bar.hidden = false;
    $('#classText').textContent = `함께 스트레칭 · ${CLASS_MOVES[c.idx][1]} · ${fmt(c.left * 1000)}`;
    $('#classBtn').hidden = false;
    $('#classBtn').textContent = m.classOn ? '그만하기' : '같이 하기';
    if (m.classOn && S.meA) classClip(S.meA, c.idx);
    if (S.coach) {
      const spot = SHOPS[S.shop].coachSpots[1];
      if (!S.coachClass) { S.coachClass = true; walkTo(S.coach, spot.x, spot.z, () => { S.coach.place.ry = 0; G.applyPlace(S.coach); S.coach._classIdx = null; }); }
      if (!S.walk.has(S.coach)) classClip(S.coach, c.idx);
    }
  } else {
    if (S.coachClass) { S.coachClass = false; if (S.coach) { S.coach._classIdx = null; S.coach._gestUntil = 0; G.setClip(S.coach, presetClip('armsCross'), { blend: 0.3 }); S.coachSlot = null; } }
    if (m.classOn) { m.classOn = false; if (S.meA) classEnd(S.meA); syncPresence(true); sysLine('수고했어요. 함께 스트레칭이 끝났어요.', 'rest'); noteSet({ preset: 'seatedFold' }); }
    const soon = c.wait <= 180;
    bar.hidden = !soon;
    if (soon) { $('#classText').textContent = `${Math.max(1, Math.ceil(c.wait / 60))}분 뒤 함께 스트레칭`; $('#classBtn').hidden = true; }
  }
}

// 오늘 기록과 루틴 (이 브라우저에만 저장)
const todayKey = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
function loadLog() {
  let l = {};
  try { l = JSON.parse(store.get('jg.log', '{}')) || {}; } catch { /* 처음부터 */ }
  const today = todayKey();
  if (l.date !== today) {
    const y = new Date(Date.now() + 9 * 3600e3 - 86400e3).toISOString().slice(0, 10);
    l = { date: today, reps: 0, sets: 0, routine: {}, routines: 0, total: l.total || 0, streak: l.date === y ? (l.streak || 1) + 1 : 1 };
  }
  return l;
}
let LOG = loadLog();
// 이번 방문에서 한 것 (Vercel판 접속 통계로 보냄. 이름이나 대화는 담지 않는다)
const VISIT = { reps: 0, sets: 0, sec: 0, pt: 0, gest: 0, st: new Set() };
window.__gymVisit = () => ({ shop: S.shop, reps: VISIT.reps, sets: VISIT.sets, work: Math.round(VISIT.sec), pt: VISIT.pt, gest: VISIT.gest, stations: [...VISIT.st] });
function saveLog() { store.set('jg.log', JSON.stringify(LOG)); renderLog(); }
const routineOf = (st) => { const tags = PT_KNOW[st.preset]?.tags || []; return tags[0] === '유산소' || st.cardio ? 'cardio' : tags[0] === '스트레칭' ? 'stretch' : 'strength'; };
function noteRep() {
  if (LOG.date !== todayKey()) LOG = loadLog();
  LOG.reps++; LOG.total = (LOG.total || 0) + 1; VISIT.reps++;
  saveLog();
}
function noteTime(st, sec) {
  LOG.sec = (LOG.sec || 0) + sec; VISIT.sec += sec;
  if (sec >= RULES.durationRestSec) noteSet(st, false); else saveLog();
  renderLog();
}
function noteSet(st, isSet = true) {
  if (isSet) { LOG.sets++; VISIT.sets++; }
  if (st) LOG.routine[routineOf(st)] = true;
  if (LOG.routine.cardio && LOG.routine.strength && LOG.routine.stretch) {
    LOG.routine = {};
    LOG.routines++;
    sysLine(`오늘의 루틴을 ${LOG.routines}번 마쳤어요.`, 'rest');
    toast('오늘의 루틴을 마쳤어요. 잘했어요.', 3000);
    playCoach('clapCheer');
  }
  saveLog();
}
function renderLog() {
  const r = LOG.routine, el = $('#routine');
  if (!el) return;
  for (const k of ['cardio', 'strength', 'stretch']) el.querySelector(`[data-r="${k}"]`).classList.toggle('done', !!r[k]);
  const min = Math.floor((LOG.sec || 0) / 60), mins = min ? ` · ${min}분` : '';
  $('#todayReps').textContent = `오늘 ${LOG.reps}회${mins}`;
  $('#logLine').textContent = `오늘 ${LOG.reps}회${mins} · ${LOG.sets}세트 · 루틴 ${LOG.routines}번 · ${LOG.streak}일째`;
}

const COUNT_WORDS = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열하나', '열둘', '열셋', '열넷', '열다섯'];
function doRep() {
  const m = S.me, A = S.meA;
  if (!S.shop || m.state !== 'set' || !m.on || !A) return;
  if (A._cardio) { // 시간 운동: 횟수와 세트가 없다
    cardioPress(A);
    m.lastActAt = Date.now();
    sound.rep();
    syncPresence();
    renderHud();
    return;
  }
  // 동작이 끝나기 전에 누르면 버리지 않고 끝나자마자 이어서 한다
  if (repBusy(A)) { S.repQueued = true; return; }
  S.repQueued = false;
  const target = SHOPS[S.shop].reps;
  m.reps = Math.min(target, m.reps + 1);
  m.lastActAt = Date.now();
  playRep(A);
  sound.rep();
  noteRep();
  if (m.reps >= target) finishSet();
  syncPresence(true);
  renderHud();
}
function finishSet() {
  const m = S.me;
  const st = stationOf(S.shop, m.station);
  noteSet(st);
  const restMs = randomRestMs();
  const doneAll = m.set >= RULES.setsPerStation;
  m.state = 'rest';
  m.restUntil = Date.now() + restMs;
  sound.setDone();
  playCoach(doneAll ? 'clapCheer' : 'thumbs');
  const secs = Math.round(restMs / 1000);
  if (doneAll) {
    sysLine(`${st?.name || '기구'} ${RULES.setsPerStation}세트 완료. ${secs}초 쉬어요`, 'rest');

    setTimeout(() => { if (S.me.station === st?.id && S.me.state === 'rest') { dismount(true); S.me.station = null; S.me.claimedAt = 0; syncPresence(true); syncScene(); renderHud(); } }, 1600);
  } else {
    sysLine(`${m.set}세트 끝. ${secs}초 쉬어요`, 'rest');

  }
  // 넓은 화면은 수다창을 알아서 열어 준다
  if (matchMedia('(max-width: 860px)').matches) toast('쉬는 시간이에요. 채팅을 할 수 있어요.', 3000);
}
/** 시간 운동을 마치고 반납했을 때의 쉬는 시간 */
function startRest(word) {
  const m = S.me, ms = randomRestMs();
  m.state = 'rest';
  m.restUntil = Date.now() + ms;
  sound.setDone();
  playCoach('thumbs');
  sysLine(`${word} ${Math.round(ms / 1000)}초 쉬어요`, 'rest');
  if (matchMedia('(max-width: 860px)').matches) toast('쉬는 시간이에요. 채팅을 할 수 있어요.', 3000);
  syncPresence(true);
  renderHud();
}
function endRest() {
  const m = S.me;
  sound.restOver();
  S.repQueued = false;
  m.lastActAt = Date.now();
  if (m.station) {
    m.set += 1; m.reps = 0; m.state = 'set';
  } else {
    m.state = 'idle'; m.reps = 0;
    sysLine('쉬는 시간이 끝났어요. 다음 기구를 골라 보세요.', '');
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

const heldKeys = new Set();
document.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { heldKeys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); }
  const n = { Digit1: 'wave', Digit2: 'clap', Digit3: 'thumbs', Digit4: 'hooray', Digit5: 'rest', Digit6: 'stretch' }[e.code];
  if (n && !e.repeat) document.querySelector(`[data-gesture="${n}"]`)?.click();
});
document.addEventListener('keyup', (e) => heldKeys.delete(e.code));
addEventListener('blur', () => heldKeys.clear());
function stepKeys() {
  const A = S.meA;
  if (!A || !heldKeys.size || S.me.on) return;
  const f = (heldKeys.has('KeyW') || heldKeys.has('ArrowUp') ? 1 : 0) - (heldKeys.has('KeyS') || heldKeys.has('ArrowDown') ? 1 : 0);
  const s = (heldKeys.has('KeyD') || heldKeys.has('ArrowRight') ? 1 : 0) - (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft') ? 1 : 0);
  if (!f && !s) return;
  const dir = new T.Vector3();
  G.cam.getWorldDirection(dir);
  dir.y = 0; dir.normalize();
  const x = dir.x * f - dir.z * s, z = dir.z * f + dir.x * s, len = Math.hypot(x, z) || 1;
  if (S.me.queue) leaveQueue();
  if (S.me.station) { S.me.station = null; S.me.claimedAt = 0; if (S.me.state === 'set') S.me.state = 'idle'; renderHud(); }
  standUp();
  walkTo(A, A.place.x + x / len * 0.7, A.place.z + z / len * 0.7);
}

// 3D 화면 누르기: 기구 → 사용, 쌤 → PT 부르기, 바닥 → 이동 (드래그는 시점 돌리기)
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
    if (hit) { playCoach('wave'); if (S.me.on) callPt(); else say('coach', '기구에 올라가서 PT 부르기를 눌러 봐. 옆에서 자세를 봐 줄게.', 5000); return; }
  }
  // 안내 데스크 · 기구
  if (ray.ray.intersectsBox(WORLD.doorBox)) { moveShop(otherShop()); return; }
  if (ray.ray.intersectsBox(WORLD.coolerBox)) { drinkWater(); return; }
  if (ray.ray.intersectsBox(WORLD.deskBox)) { openPay(); return; }
  const best = stationUnderRay();
  if (best) { claimStation(best.id); return; }
  // 바닥
  if (S.me.on) { toast('내려오려면 기구 반납을 눌러 주세요.', 2000); return; }
  const o = ray.ray.origin, d = ray.ray.direction;
  if (d.y >= -1e-4) return;
  const t = -o.y / d.y;
  const x = o.x + d.x * t, z = o.z + d.z * t;
  if (S.me.station && !S.me.on) { S.me.station = null; S.me.claimedAt = 0; if (S.me.state === 'set') S.me.state = 'idle'; renderHud(); syncScene(); }
  if (S.me.queue) { leaveQueue(); toast('줄에서 나왔어요.', 1600); }
  standUp();
  walkTo(S.meA, x, z);
  syncPresence(true);
});

/** 기구 모양을 직접 맞혔거나, 기구가 놓인 바닥 자리를 가리킬 때만 그 기구. 기구 뒤쪽 바닥을 눌러도 잡히지 않게 한다 */
const otherShop = () => (S.shop === 'weight' ? 'pilates' : 'weight');
function stationUnderRay() {
  let best = null;
  const o = ray.ray.origin, d = ray.ray.direction, hit = new T.Vector3();
  const t0 = d.y < -1e-4 ? -o.y / d.y : Infinity;
  const fx = o.x + d.x * t0, fz = o.z + d.z * t0;
  for (const st of SHOPS[S.shop].stations) {
    const box = S.stationBox[st.id];
    if (!box) continue;
    let dist = Infinity;
    if (fx >= box.min.x && fx <= box.max.x && fz >= box.min.z && fz <= box.max.z) dist = t0;
    if (ray.ray.intersectBox(box, hit)) {
      const m = ray.intersectObject(S.stationObj[st.id], true)[0];
      if (m) dist = Math.min(dist, m.distance);
    }
    if (dist < Infinity && (!best || dist < best.d)) best = { d: dist, id: st.id };
  }
  return best;
}

// 기구에 마우스를 올리면: 바닥에 표시 + 이름과 지금 상태 (아래 목록에 올려도 똑같이)
let hoverMark = null, hoverAt = 0;
function buildHoverMark(set) {
  hoverMark = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0x4CD08A, transparent: true, opacity: 0.4, depthWrite: false }));
  hoverMark.rotation.x = -Math.PI / 2;
  hoverMark.visible = false;
  set.add(hoverMark);
  S.hover = null;
  S.hoverDesk = false;
}
function hoverInfo(id) {
  const list = members(), st = stationOf(S.shop, id), o = owners(list).get(id), line = lines(list).get(id) || [];
  if (o && o.me) return { st, cls: 'mine', state: '내가 쓰는 중' };
  if (line.some((m) => m.me)) return { st, cls: 'busy', state: `줄 서는 중 · 대기 ${line.length}명` };
  if (o) return { st, cls: 'busy', state: `${o.nick} 님이 쓰는 중${line.length ? `, 대기 ${line.length}명` : ''}. 눌러서 줄 서기` };
  if (line.length) return { st, cls: 'busy', state: `대기 ${line.length}명. 눌러서 줄 서기` };
  return { st, cls: 'free', state: `${st.ex} · 비어 있어요. 눌러서 시작` };
}
function setHover(id, desk = false) {
  S.hover = id;
  S.hoverDesk = desk;
  const canvas = $('#view canvas');
  if (canvas) canvas.style.cursor = id || desk ? 'pointer' : 'grab';
}
function paintHover() {
  const el = $('#hoverTag');
  if (!S.shop || !hoverMark) { if (el) el.hidden = true; return; }
  const box = S.hoverDesk === 'door' ? WORLD.doorBox : S.hoverDesk === 'cooler' ? WORLD.coolerBox : S.hoverDesk ? WORLD.deskBox : S.hover && S.stationBox[S.hover];
  if (!box) { el.hidden = true; hoverMark.visible = false; return; }
  let title = S.hoverDesk === 'door' ? '입구' : S.hoverDesk === 'cooler' ? '정수기' : '안내 데스크', state = S.hoverDesk === 'door' ? `${SHOPS[otherShop()].name}으로 가기` : S.hoverDesk === 'cooler' ? '눌러서 물 마시기' : '온라인짐 후원', cls = 'free';
  if (!S.hoverDesk) { const i = hoverInfo(S.hover); title = i.st.name; state = i.state; cls = i.cls; }
  hoverMark.position.set((box.min.x + box.max.x) / 2, 0.02, (box.min.z + box.max.z) / 2);
  hoverMark.scale.set(box.max.x - box.min.x + 0.2, box.max.z - box.min.z + 0.2, 1);
  hoverMark.material.color.setHex(cls === 'busy' ? 0xFF8A3D : cls === 'mine' ? 0xF5D33F : 0x4CD08A);
  hoverMark.material.opacity = 0.34 + Math.sin(performance.now() / 260) * 0.1;
  hoverMark.visible = !S.hoverDesk;
  const q = project((box.min.x + box.max.x) / 2, Math.min(box.max.y, 2.4) + 0.2, (box.min.z + box.max.z) / 2);
  el.hidden = !q.vis;
  el.dataset.state = cls;
  el.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) translate(-50%, -100%)`;
  el.querySelector('b').textContent = title;
  el.querySelector('small').textContent = state;
}
$('#view').addEventListener('pointermove', (e) => {
  if (!S.shop || e.pointerType === 'touch' || e.buttons) return;
  const now = performance.now();
  if (now - hoverAt < 50) return;
  hoverAt = now;
  const r = $('#view').getBoundingClientRect();
  ray.setFromCamera(new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), G.cam);
  const best = stationUnderRay();
  setHover(best ? best.id : null, best ? false : ray.ray.intersectsBox(WORLD.doorBox) ? 'door' : ray.ray.intersectsBox(WORLD.coolerBox) ? 'cooler' : ray.ray.intersectsBox(WORLD.deskBox));
});
$('#view').addEventListener('pointerleave', () => setHover(null));

// ------------------------------------------------------------------ HUD
function renderHud() {
  if (!S.shop) return;
  const now = Date.now(), m = S.me, shop = SHOPS[S.shop];
  const st = stationOf(S.shop, m.station), qst = stationOf(S.shop, m.queue);
  const stage = $('#stage'), repBtn = $('#repBtn');
  $('#clock').hidden = false;
  if (m.state === 'set' && st) {
    stage.dataset.phase = 'work';
    const c = m.on ? S.meA?._cardio : null;
    $('#exName').textContent = !m.on ? `${st.name} 앞으로 가는 중` : !c ? `${st.ex} · ${m.set}/${RULES.setsPerStation}세트` : c.hold ? st.ex : `${st.ex} · ${c.label(c.lv)}`;
    $('#clock').textContent = c ? fmt(c.sec * 1000) : st.cardio || st.hold ? fmt(0) : `${m.reps}/${shop.reps}`;
    repBtn.hidden = false;
    repBtn.disabled = !m.on;
    repBtn.textContent = !m.on ? '가는 중' : !c ? COUNT_WORDS[m.reps] || String(m.reps + 1) : !c.hold ? '빠르게' : c.lv ? '멈추기' : '시작';
  } else if (m.state === 'rest') {
    stage.dataset.phase = 'rest';
    $('#exName').textContent = st ? `쉬는 시간 · 다음 ${st.name}${st.cardio || st.hold ? '' : ` ${m.set + 1}세트`}` : qst ? `쉬는 시간 · ${qst.name} 줄, 내 앞에 ${S.lineAhead || 0}명` : '쉬는 시간이에요';
    $('#clock').textContent = fmt(m.restUntil - now);
    repBtn.hidden = !st;
    repBtn.disabled = true;
    repBtn.textContent = st && !m.on ? '가는 중' : '쉬는 중';
  } else {
    stage.dataset.phase = 'idle';
    $('#exName').textContent = qst ? `${qst.name} 줄 서는 중 · 내 앞에 ${S.lineAhead || 0}명` : '비어 있는 기구를 눌러 보세요';
    $('#clock').hidden = true;
    $('#clock').textContent = '—';
    repBtn.hidden = true;
  }
  $('#releaseBtn').hidden = !m.station;
  const chance = $('#ptChanceBtn');
  chance.hidden = !m.on; // 운동할 때만
  chance.textContent = S.ptTeacher ? '자세 다시 듣기' : 'PT 부르기';
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
  stepKeys();
  stepWalkers(realDt); // 화면이 느려도 걷는 속도는 그대로
  followCam(dt);
  updateTags();
  paintHover();
  watchFrameRate(realDt);
});
// 느린 기기는 거울 반사를 꺼서 화면을 지킨다 (평범한 거울 색으로 바뀜)
let slowSec = 0, fpsT = 0, fpsN = 0;
function watchFrameRate(dt) {
  fpsT += dt; fpsN++;
  if (fpsT < 2) return;
  const fps = fpsN / fpsT;
  fpsT = 0; fpsN = 0;
  slowSec = fps < 22 && !document.hidden ? slowSec + 2 : 0;
  if (slowSec >= 6 && !FAST && WORLD.mirrorOn()) WORLD.mirrorOff();
}
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
    toast('한동안 움직임이 없어서 다음 분께 자리를 넘겼어요.', 3500);
    releaseStation();
  }
  // 시간 운동은 줄이 있으면 정해진 시간까지만
  const cardio = m.on ? S.meA._cardio : null;
  if (cardio) {
    syncPresence();
    if (S.lineBehind > 0 && cardio.sec > RULES.durationShareSec) { toast('기다리는 분이 있어서 자리를 넘겼어요. 수고했어요.', 3500); releaseStation(); }
  }
  stepClass(now);
  stepCoach(now);
  renderHud();
  document.title = m.state === 'rest' ? `휴식 ${fmt(m.restUntil - now)} · ONLINE GYM` : m.state === 'set' ? `${cardio ? fmt(cardio.sec * 1000) : `${m.reps}/${SHOPS[S.shop].reps}`} · ONLINE GYM` : 'ONLINE GYM';
}, 1000);

// ------------------------------------------------------------------ 로비
// 나시 색 고르기: 기본색 + 무지개 막대 + 밝기 막대 + 랜덤. 로비와 짐 안에 하나씩
const hslToHex = (h, s, l) => {
  const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
};
function hexToHl(hex) {
  const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) { h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
  return [h, (max + min) / 2];
}
const randomColor = () => hslToHex(Math.random() * 360, 0.6 + Math.random() * 0.35, 0.32 + Math.random() * 0.42);
const studios = [];
const PARTS = { shirt: { label: '나시', key: 'color', store: 'jg.color' }, band: { label: '머리띠', key: 'band', store: 'jg.band' }, pants: { label: '바지', key: 'pants', store: 'jg.pants' } };
let shirtPart = 'shirt';
function buildStudio(host, prefix) {
  host.textContent = '';
  const tabs = document.createElement('div');
  tabs.className = 'part-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '바꿀 부분');
  const partBtns = {};
  for (const [key, def] of Object.entries(PARTS)) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = `${prefix}part-${key}`; b.textContent = def.label;
    b.addEventListener('click', () => { shirtPart = key; paintStudios(false); });
    tabs.append(b);
    partBtns[key] = b;
  }
  const swatches = document.createElement('div');
  swatches.className = 'swatches';
  swatches.setAttribute('role', 'radiogroup');
  swatches.setAttribute('aria-label', '기본 색');
  const radios = {};
  for (const [key, def] of Object.entries(COLOR_DEFS)) {
    const label = document.createElement('label');
    label.title = def.label;
    label.style.setProperty('--c', `#${def.hex.toString(16).padStart(6, '0')}`);
    const input = document.createElement('input');
    input.type = 'radio'; input.name = `${prefix}color`; input.value = key; input.id = `${prefix}color-${key}`;
    input.setAttribute('aria-label', `${def.label}`);
    input.addEventListener('change', () => setShirt(key, true));
    label.append(input);
    swatches.append(label);
    radios[key] = input;
  }
  host.append(tabs, swatches);
  const slider = (cls, text, id, min, max) => {
    const label = document.createElement('label');
    label.className = `shirt-slider ${cls}`;
    const span = document.createElement('span');
    span.textContent = text;
    const input = document.createElement('input');
    input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = 1;
    label.append(span, input);
    host.append(label);
    return input;
  };
  const hue = slider('hue', '색', `${prefix}hue`, 0, 360);
  const tone = slider('tone', '밝기', `${prefix}tone`, 8, 94);
  const fromSliders = (done) => setShirt(hslToHex(+hue.value, 0.82, +tone.value / 100), done);
  for (const s of [hue, tone]) {
    s.addEventListener('input', () => fromSliders(false));
    s.addEventListener('change', () => fromSliders(true));
  }
  const dice = document.createElement('button');
  dice.type = 'button'; dice.className = 'shirt-dice'; dice.id = `${prefix}dice`;
  dice.textContent = '아무 색이나';
  dice.addEventListener('click', () => setShirt(randomColor(), true));
  host.append(dice);
  studios.push({ radios, hue, tone, partBtns });
}
function paintStudios(fromSlider) {
  const c = S.me[PARTS[shirtPart].key], [h, l] = hexToHl(colorHex(c));
  for (const st of studios) {
    for (const [k, b] of Object.entries(st.partBtns)) b.setAttribute('aria-pressed', k === shirtPart);
    for (const [k, r] of Object.entries(st.radios)) r.checked = k === c;
    if (!fromSlider) { st.hue.value = Math.round(h); st.tone.value = Math.round(l * 100); }
    st.tone.style.setProperty('--hue', st.hue.value);
  }
}
function setShirt(color, done) {
  const part = PARTS[shirtPart];
  S.me[part.key] = validColor(color);
  if (done) store.set(part.store, S.me[part.key]);
  if (S.meA) paint(S.meA, S.me.color, S.me.band, S.me.pants);
  syncPresence(done);
  paintStudios(!done);
}
// 메뉴: 닉네임 · 옷 색 · 샵 이동 · 후원 · 소리
function toggleMenu(open) {
  const m = $('#menu'), show = open ?? m.hidden;
  m.hidden = !show;
  $('#menuBtn').setAttribute('aria-pressed', show);
  if (show) { $('#nickInput').value = S.me.nick; lobbyCounts(); }
}
$('#menuBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
document.addEventListener('pointerdown', (e) => {
  const m = $('#menu');
  if (!m.hidden && !m.contains(e.target) && e.target !== $('#menuBtn')) { toggleMenu(false); downAt = null; } // 바깥을 누르면 메뉴만 닫힘
});
$('#nickForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const nick = cleanText($('#nickInput').value, LIMIT.nick);
  if (!nick) { $('#nickInput').value = S.me.nick; return; }
  S.me.nick = nick;
  store.set('jg.nick', nick);
  syncPresence(true);
  toast(`닉네임을 ${nick}(으)로 바꿨어요.`, 2000);
});
/** 다른 샵으로: 문까지 걸어가서 넘어간다 (바닥을 누르면 취소) */
function moveShop(id) {
  if (!SHOPS[id] || id === S.shop || !S.meA) return;
  toggleMenu(false);
  sound.unlock();
  if (S.me.station) releaseStation(true);
  leaveQueue();
  standUp();
  toast(`${SHOPS[id].name}으로 가요.`, 2200);
  const d = WORLD.doorSpot;
  walkTo(S.meA, d.x, d.z + 0.5, () => {
    WORLD.openDoor();
    setTimeout(() => enterGym(id), 350);
  });
  syncPresence(true);
}
for (const b of document.querySelectorAll('[data-go]')) b.addEventListener('click', () => moveShop(b.dataset.go));
$('#menuPt').addEventListener('click', () => { toggleMenu(false); openPay(); });
const isWeb = !!window.ONLINE_GYM_SUPABASE || !window.claude;
$('#shareSec').hidden = !isWeb;
$('#photoBtn').addEventListener('click', () => {
  toggleMenu(false);
  G.renderer.clear();
  G.renderer.render(G.scene, G.cam);
  const src = G.renderer.domElement, c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const u = c.height / 600;
  x.fillStyle = 'rgba(23,23,21,.85)'; x.fillRect(0, c.height - 44 * u, c.width, 44 * u);
  x.fillStyle = '#f2cf1d'; x.font = `${22 * u}px 'Black Han Sans', sans-serif`; x.textBaseline = 'middle';
  x.fillText('ONLINE GYM', 16 * u, c.height - 22 * u);
  x.fillStyle = '#f4f2ec'; x.font = `${15 * u}px 'IBM Plex Sans KR', sans-serif`; x.textAlign = 'right';
  x.fillText(`${S.me.nick} · 오늘 ${LOG.reps}회`, c.width - 16 * u, c.height - 22 * u);
  const a = document.createElement('a');
  a.download = `online-gym-${todayKey()}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
  toast('사진을 저장했어요.', 1800);
});
$('#linkBtn').addEventListener('click', async () => {
  toggleMenu(false);
  try { await navigator.clipboard.writeText('https://onlinegym.vercel.app'); toast('링크를 복사했어요.', 1800); }
  catch { toast('onlinegym.vercel.app', 4000); }
});
$('#joinBtn').addEventListener('click', openPay);

// 후원 창과 도움말 창
function openPay() { $('#payModal').hidden = false; }
function closePay() { $('#payModal').hidden = true; }
$('#payClose').addEventListener('click', closePay);
$('#payModal').addEventListener('pointerdown', (e) => { if (e.target === $('#payModal')) closePay(); });
function closeHelp() { $('#helpModal').hidden = true; }
$('#helpBtn').addEventListener('click', () => { toggleMenu(false); $('#helpModal').hidden = false; });
$('#helpClose').addEventListener('click', closeHelp);
$('#helpModal').addEventListener('pointerdown', (e) => { if (e.target === $('#helpModal')) closeHelp(); });
document.addEventListener('keydown', (e) => { if (e.code === 'Escape') { closePay(); closeHelp(); } });

function renderChannel() {
  const info = room?.channelInfo?.(), el = $('#channelSec');
  el.hidden = !info;
  if (info) $('#channelText').textContent = `${info.no}번 방 · ${info.count}명`;
}
$('#channelNext').addEventListener('click', () => {
  const info = room?.channelInfo?.();
  if (!info) return;
  room.setChannel(info.no >= info.max ? 1 : info.no + 1);
  sysLine('다른 방으로 옮겼어요.', '');
  renderChannel();
});
function lobbyCounts() {
  renderChannel();
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
    el.textContent = id === S.shop ? '지금 여기 있어요' : room ? `${counts[id]}명 · 빈 기구 ${total - busy[id].size}개` : `기구 ${total}개`;
    document.querySelector(`[data-go="${id}"]`).disabled = id === S.shop;
  }
}
function enterGym(shopId) {
  const resting = S.me.state === 'rest' && S.me.restUntil > Date.now();
  S.shop = shopId;
  store.set('jg.shop', shopId);
  Object.assign(S.me, { station: null, claimedAt: 0, on: false, queue: null, queuedAt: 0, reps: 0, set: 1 });
  if (!resting) { S.me.state = 'idle'; S.me.restUntil = 0; }
  S.announce = false;
  setTimeout(() => { S.announce = true; }, 2500);
  const shop = SHOPS[shopId];
  $('#shopName').textContent = shop.name;
  $('#loading').hidden = true;
  buildShop(shopId);
  syncPresence(true);
  ambient.start(shopId);
  music.start(shopId);
  sysLine(`${shop.name}에 들어왔어요. 바닥을 누르면 걷고, 비어 있는 기구를 누르면 운동을 시작해요.`, '');
  if (!room) sysLine('지금은 혼자 운동하고 있어요.', '');
  setTimeout(() => { if (S.shop === shopId && S.coach) coachGreet(S.me.nick, S.meA); }, 1500);
  renderHud();
  syncScene();
  lobbyCounts();
}

// ------------------------------------------------------------------ 말풍선 · 응원
function say(tagKey, text, ms) {
  const el = S.tags.get(tagKey);
  if (!el) return;
  el.querySelector('.bubble')?.remove();
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  el.prepend(b);
  clearTimeout(el._sayTimer);
  el._sayTimer = setTimeout(() => b.remove(), ms);
}
function floatWord(tagKey, word) {
  const el = S.tags.get(tagKey);
  if (!el) return;
  el.querySelector('.float-word')?.remove();
  const f = document.createElement('span');
  f.className = 'float-word';
  f.textContent = word;
  el.append(f);
  setTimeout(() => f.remove(), 2600);
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
  if (matchMedia('(max-width: 860px)').matches && !$('#chatFloat').classList.contains('open') && !mine) bumpUnread();
}
function updateChatLock() {
  const m = S.me, open = m.state === 'rest';
  $('#chatLock').hidden = open;
  $('#chatInput').disabled = !open;
  $('#chatSend').disabled = !open;
  if (!open) {
    if (m.state === 'set' && m.on) {
      $('#chatLockTitle').textContent = '운동 중에는 채팅할 수 없어요';
      $('#chatLockSub').textContent = S.meA?._cardio ? '기구를 반납하면 쉬는 시간이에요' : `${SHOPS[S.shop].reps - m.reps}회 더 하면 쉬는 시간이에요`;
    } else {
      $('#chatLockTitle').textContent = '쉬는 시간에만 채팅할 수 있어요';
      $('#chatLockSub').textContent = '세트를 끝내면 열려요';
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
}
async function sendChat(text) {
  if (S.me.state !== 'rest') return;
  const now = Date.now();
  if (now - S.lastChatAt < 800) { toast('조금 천천히 보내 주세요.', 1500); return; }
  S.lastChatAt = now;
  if (room && room.connected()) {
    try { await room.emit('chat', { shop: S.shop, text }); }
    catch (e) {
      if (e?.code === 'not_permitted') toast('이 링크로는 채팅을 보낼 수 없어요. 공유한 분께 참여 권한을 부탁해 주세요.', 4000);
      else toast('메시지를 보내지 못했어요. 잠시 후 다시 보내 주세요.', 2500);
    }
  } else {
    chatLine(S.me.nick, text, true);
  }
}
$('#chatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chatInput'), text = cleanText(input.value, LIMIT.chat);
  if (!text) return;
  input.value = '';
  sendChat(text);
});
// ------------------------------------------------------------------ PT: 부르면 내 선생님이 옆에 와서 자세를 말해 주고, 기구를 반납하면 돌아간다
function ptTalk() {
  clearTimeout(S.ptTimer);
  const st = stationOf(S.shop, S.me.station);
  if (!st) return;
  const speak = (lines, i) => {
    if (i >= lines.length || !S.ptTeacher) return;
    const ms = Math.max(4500, lines[i].length * 120);
    say('pt', lines[i], ms);
    S.ptTimer = setTimeout(() => speak(lines, i + 1), ms + 300);
  };
  speak(ptLines(st), 0);
}
function callPt() {
  const m = S.me;
  if (!m.on || !S.meA) return;
  sound.unlock();
  if (S.ptTeacher) { if (!S.walk.has(S.ptTeacher)) ptTalk(); return; }
  m.pt = 1 + Math.floor(Math.random() * 1e6);
  VISIT.pt++;
  S.ptTeacher = teacherCome(S.meA, m.pt, ptTalk);
  const tag = tagFor('pt');
  tag.classList.add('coach');
  tag.querySelector('.nm').textContent = 'PT 쌤';
  syncPresence(true);
  renderHud();
}
function ptDismiss() {
  if (!S.ptTeacher) return;
  clearTimeout(S.ptTimer);
  dropTag('pt');
  teacherGo(S.ptTeacher);
  S.ptTeacher = null;
  S.me.pt = 0;
  syncPresence(true);
}
$('#ptChanceBtn').addEventListener('click', callPt);

// ------------------------------------------------------------------ tabs / misc
// 넓은 화면은 채팅이 늘 보이고, 휴대폰에서만 눌러서 크게 연다
$('#openChat').addEventListener('click', () => {
  const open = $('#chatFloat').classList.toggle('open');
  $('#openChat').setAttribute('aria-pressed', open);
  S.unread = 0;
  $('#chatBadge').hidden = true;
  const log = $('#chatLog');
  log.scrollTop = log.scrollHeight;
});
function bumpUnread() {
  S.unread++;
  const b = $('#chatBadge');
  b.textContent = S.unread > 99 ? '99+' : S.unread;
  b.hidden = false;
}
function renderSoundBtn() {
  const b = $('#soundBtn'), a = $('#ambientBtn');
  b.setAttribute('aria-pressed', sound.on);
  b.setAttribute('aria-label', sound.on ? '모든 소리 끄기' : '소리 켜기');
  a.setAttribute('aria-pressed', ambient.on && sound.on);
  a.setAttribute('aria-label', ambient.on ? '은은한 짐 소리 끄기' : '은은한 짐 소리 켜기');
  a.title = ambient.on ? '짐 소리 끄기' : '짐 소리 켜기';
  a.disabled = !sound.on;
  const mu = $('#musicBtn');
  mu.setAttribute('aria-pressed', music.on && sound.on);
  mu.setAttribute('aria-label', music.on ? '배경음악 끄기' : '배경음악 켜기');
  mu.title = music.on ? '배경음악 끄기' : '배경음악 켜기';
  mu.disabled = !sound.on;
}
$('#soundBtn').addEventListener('click', () => { sound.on = !sound.on; store.set('jg.sound', sound.on ? '1' : '0'); sound.unlock(); ambient.apply(); music.apply(); renderSoundBtn(); });
$('#volume').value = Math.round(sound.volume * 100);
$('#volume').addEventListener('input', (e) => { sound.unlock(); sound.setVolume(+e.target.value / 100); });
$('#musicBtn').addEventListener('click', () => {
  music.on = !music.on;
  store.set('jg.music', music.on ? '1' : '0');
  sound.unlock();
  music.apply();
  renderSoundBtn();
  toast(music.on ? '배경음악을 켰어요.' : '배경음악을 껐어요.', 1500);
});
$('#ambientBtn').addEventListener('click', () => {
  ambient.on = !ambient.on;
  store.set('jg.ambient', ambient.on ? '1' : '0');
  sound.unlock();
  ambient.apply();
  renderSoundBtn();
  toast(ambient.on ? '짐 소리를 켰어요.' : '짐 소리를 껐어요.', 1500);
});
let toastTimer = null;
function toast(text, ms = 0) {
  const t = $('#toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => (t.hidden = true), ms);
}

// 브라우저는 사용자가 한 번 누른 뒤에야 소리를 허락한다
function wakeSound() {
  sound.unlock();
  ambient.apply();
  music.apply();
}
document.addEventListener('pointerdown', wakeSound, { once: true });
document.addEventListener('keydown', wakeSound, { once: true });

// ------------------------------------------------------------------ boot
(async function boot() {
  S.me.nick = store.get('jg.nick', '') || randomNick();
  store.set('jg.nick', S.me.nick);
  // 옷 색은 들어올 때마다 랜덤. 직접 고른 색만 기억한다
  for (const part of Object.values(PARTS)) S.me[part.key] = validColor(store.get(part.store, '') || randomColor());
  renderSoundBtn();
  buildStudio($('#colorPickerGym'), 'g');
  paintStudios(false);
  renderLog();

  capability('room').then((r) => {
    if (!r) return;
    room = r;
    const dead = () => { room = null; lobbyCounts(); syncScene(); };
    let peersQueued = false;
    r.onPeers(() => {
      if (peersQueued) return;
      peersQueued = true;
      setTimeout(() => { peersQueued = false; lobbyCounts(); syncScene(); }, 120);
    }, dead);
    r.on('chat', onChat, dead);
    if (S.shop) syncPresence(true);
    lobbyCounts();
  });
  setInterval(lobbyCounts, 3000);
  if (FAST) window.__jg = { S, G, RULES, sound, ambient, music, WORLD, SHOPS, setHover, PT_KNOW, ptLines, drinkWater, shiftClass: (s) => { classShift = s; }, classNow }; // 시험용

  try {
    await Promise.all(['jjak', 'buri'].map((id) => G.loadTemplate(id)));
    S.modelsReady = true;
    const last = store.get('jg.shop', 'weight');
    enterGym(SHOPS[last] ? last : 'weight');
  } catch (e) {
    console.error(e);
    $('#loadNote').textContent = '캐릭터를 불러오지 못했어요. 새로고침해 주세요.';
  }
})();
