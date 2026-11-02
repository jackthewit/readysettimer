/* ===== 동작 모음 2: 귀여운 동작·몸매 뽐내기·K팝 댄스·요가·유산소·일상 + 기존 분류 보강 =====
   규칙은 presets.js 와 같음. cam: 어울리는 카메라 워킹 이름 */
(function(){
'use strict';
const SP = window.StudioPresets, LIST = SP.list, REST = SP.REST;
const J = (...xs) => Object.assign({}, ...xs);
const R = (...xs) => J(REST, ...xs);
const FIST = {fingersL:[-85,0,0],fingersR:[-85,0,0],pointL:[-85,0,0],pointR:[-85,0,0],thumbL:[-50,0,0],thumbR:[-50,0,0]};
const OPEN = {fingersL:[0,0,0],fingersR:[0,0,0],pointL:[0,0,0],pointR:[0,0,0],thumbL:[0,0,0],thumbR:[0,0,0]};
const VSIGN = s => ({['fingers'+s]:[-95,0,0], ['point'+s]:[0,0,0], ['thumb'+s]:[-60,0,0]});
const POINT = s => ({['fingers'+s]:[-95,0,0], ['point'+s]:[0,0,0], ['thumb'+s]:[10,0,0]});
const GUN = s => ({['fingers'+s]:[-95,0,0], ['point'+s]:[0,0,0], ['thumb'+s]:[30,0,0]});
const THUMB = s => ({['fingers'+s]:[-95,0,0], ['point'+s]:[-95,0,0], ['thumb'+s]:[30,0,0]});
// 왼쪽 ↔ 오른쪽 거울
function M(spec){
  const o = {};
  for (const k in spec){ const v = spec[k]; let n = k;
    if (/L$/.test(k)) n = k.slice(0,-1)+'R'; else if (/R$/.test(k)) n = k.slice(0,-1)+'L';
    o[n] = Array.isArray(v) && v.length === 3 ? [v[0], -v[1], -v[2]] : v; }
  return o;
}
const B = l => J(l, M(l));                   // 왼쪽 자세를 양쪽에
/* ---- 팔 자세 (왼쪽 기준) ---- */
const A = {
  down:{upperArmL:[0,0,9], forearmL:[-12,0,0]},
  up:{upperArmL:[0,0,168], forearmL:[0,0,4]},
  upFwd:{upperArmL:[-165,0,12], forearmL:[0,0,0]},
  V:{upperArmL:[0,0,135], forearmL:[0,0,0]},
  T:{upperArmL:[0,0,90], forearmL:[0,0,0]},
  fwd:{upperArmL:[-90,0,6], forearmL:[0,0,0]},
  fwdLow:{upperArmL:[-45,0,6], forearmL:[0,0,0]},
  back:{upperArmL:[35,0,10], forearmL:[-5,0,0]},
  hip:{upperArmL:[-8,0,38], forearmL:[-20,0,-105], handL:[0,0,-20]},
  flex:{upperArmL:[0,0,88], forearmL:[0,0,115]},
  flexLow:{upperArmL:[0,-25,62], forearmL:[0,0,118]},
  head:{upperArmL:[0,0,140], forearmL:[0,0,118]},
  behindHead:{upperArmL:[0,45,128], forearmL:[0,0,138]},
  heartTop:{upperArmL:[0,0,150], forearmL:[0,0,74]},
  cheek:{upperArmL:[-22,0,-8], forearmL:[-150,0,0], handL:[0,0,-20]},
  chin:{upperArmL:[-35,0,-16], forearmL:[-132,0,0], handL:[-25,0,0]},
  chest:{upperArmL:[-38,0,-20], forearmL:[-112,0,0], handL:[0,0,-25]},
  pray:{upperArmL:[-20,0,-22], forearmL:[-105,0,0], handL:[0,0,-38]},
  fistUp:{upperArmL:[-172,0,22], forearmL:[0,0,0]},
  fistPump:{upperArmL:[-30,0,20], forearmL:[-120,0,0]},
  point:{upperArmL:[-95,0,-8], forearmL:[-4,0,0]},
  pointUp:{upperArmL:[-25,0,158], forearmL:[0,0,-6]},     // 머리 옆으로 곧게 (큰 머리 앞을 가로지르지 않게)
  cross:{upperArmL:[-15,-50,-6], forearmL:[-100,0,0], handL:[0,0,-10]},
  wave:{upperArmL:[-10,0,148], forearmL:[0,0,-14]},
  salute:{upperArmL:[-20,0,70], forearmL:[0,0,128], handL:[0,0,-20]},
  ear:{upperArmL:[0,10,150], forearmL:[0,0,40]},
  swingF:{upperArmL:[-30,0,8], forearmL:[-30,0,0]},
  swingB:{upperArmL:[25,0,8], forearmL:[-20,0,0]},
  guard:{upperArmL:[-50,0,8], forearmL:[-130,0,0]},
  jab:{upperArmL:[-88,0,-6], forearmL:[-6,0,0]},
};
const AL = k => A[k], AR = k => M(A[k]);
const arms = (l, r) => J(AL(l), AR(r || l));
/* ---- 다리·몸 (왼쪽 기준) ---- */
const K = {
  kneeUpL:{thighL:[-80,0,0], shinL:[90,0,0], footL:[20,0,0]},
  kneeHighL:{thighL:[-100,0,0], shinL:[100,0,0], footL:[25,0,0]},
  kickL:{thighL:[-80,0,0], shinL:[6,0,0], footL:[35,0,0]},
  buttKickL:{thighL:[12,0,0], shinL:[125,0,0], footL:[40,0,0]},
  sideLegL:{thighL:[0,0,42], footL:[15,0,0]},
  backLegL:{thighL:[35,0,0], shinL:[10,0,0], footL:[30,0,0]},
  toeTapL:{thighL:[-25,0,8], shinL:[20,0,0], footL:[30,0,0]},
  heelTapL:{thighL:[-30,0,6], shinL:[5,0,0], footL:[-30,0,0]},
  crossL:{thighL:[-10,0,-14], shinL:[18,0,0]},
};
const SQ = (d=1) => ({hips:[24*d,0,0], spine:[6*d,0,0], neck:[-12*d,0,0], head:[-8*d,0,0], thighL:[-95*d,6,6], thighR:[-95*d,-6,-6], shinL:[100*d,0,0], shinR:[100*d,0,0]});
const SQR = (d=1) => [0, -0.42*d, -0.12*d];
const JUMP = {footL:[35,0,0], footR:[35,0,0], thighL:[-12,0,4], thighR:[-12,0,-4], shinL:[24,0,0], shinR:[24,0,0]};
const P_ = (pl) => ({pl});
const fl = {pl:[0,0]};
/* ---- 키 만들기 도우미 ---- */
// frames: [spec, opts?, 길이(박자)?]  — 박자마다 이어 붙이고 처음 자세로 돌아옴
function seq(beat, frames, close = true){
  const keys = []; let t = 0;
  for (const f of frames){ keys.push([t, f[0], f[1] || {}]); t += (f[2] || 1) * beat; }
  if (close) keys.push([t, frames[0][0], frames[0][1] || {}]);
  return {keys, dur:+t.toFixed(3)};
}
function add(id, cat, name, note, s, extra){
  if (LIST.some(p => p.id === id)) id = id + '2';
  const {dur, keys, ...rest} = s;
  LIST.push(J({id, cat, name, note, dur, keys}, rest, extra || {}));
}
const mirrorFrames = frames => frames.map(f => [M(f[0]), f[1] && f[1].pl ? J(f[1], {pl:[f[1].pl[1], f[1].pl[0]]}, f[1].st ? {st:[[-f[1].st[1][0], f[1].st[1][1]], [-f[1].st[0][0], f[1].st[0][1]]]} : {}) : f[1], f[2]]);

/* ======================= 귀여운 동작 (게임 캐릭터 느낌) ======================= */
const C = 'cute';
add('hop', C, '깡총깡총', '두 발 모아 콩콩 뛰기', seq(0.32, [
  [R(arms('fwdLow'), SQ(0.25)), {r:SQR(0.25)}], [R(arms('V'), JUMP, OPEN), {pl:[0,0], r:[0,0.2,0]}], [R(arms('fwdLow'), SQ(0.3)), {r:SQR(0.3)}], [R(arms('V'), JUMP, OPEN), {pl:[0,0], r:[0,0.2,0]}]]), {cam:'zoomPunch'});
add('bunnyHop', C, '토끼 점프', '두 손을 귀처럼 세우고 깡총', seq(0.3, [
  [R(arms('ear'), SQ(0.3), OPEN), {r:SQR(0.3)}], [R(arms('ear'), JUMP, OPEN), {pl:[0,0], r:[0,0.22,0]}]]), {cam:'zoomPunch'});
add('spinHop', C, '빙글빙글', '깡총 뛰며 한 바퀴', {dur:1.6, keys:[
  [0, R(arms('T')), {pl:[0,0]}], [0.4, R(arms('T'), {hips:[0,90,0]}, JUMP), {pl:[0,0], r:[0,0.12,0]}], [0.8, R(arms('T'), {hips:[0,180,0]}), {pl:[0,0]}],
  [1.2, R(arms('T'), {hips:[0,270,0]}, JUMP), {pl:[0,0], r:[0,0.12,0]}], [1.6, R(arms('T'), {hips:[0,360,0]}), {pl:[0,0]}]]}, {cam:'orbitFast'});
add('happyJump', C, '신나는 점프', '두 팔 번쩍 들고 점프', seq(0.35, [
  [R(arms('down'), SQ(0.4)), {r:SQR(0.4)}], [R(arms('up'), JUMP, OPEN, {jaw:[22,0,0], head:[-10,0,0]}), {pl:[0,0], r:[0,0.28,0]}, 1.2], [R(arms('V'), SQ(0.2), OPEN), {r:SQR(0.2)}]]), {cam:'zoomPunch'});
add('victoryJump', C, '승리 점프', '한 주먹 하늘로, 무릎 들고', seq(0.4, [
  [R(arms('fistPump','down'), SQ(0.35), FIST), {r:SQR(0.35)}], [R(AL('fistUp'), AR('back'), K.kneeHighL, FIST, {chest:[-8,0,0], head:[-12,0,0], jaw:[20,0,0]}), {pl:[0,0], r:[0,0.32,0]}, 1.3], [R(AL('fistUp'), AR('down'), FIST), {}, 1.2]]), {cam:'heroLow'});
add('vSign', C, '브이', '눈 옆에 브이 찡긋', {dur:2.4, keys:[
  [0, R()], [0.5, R(AL('cheek'), VSIGN('L'), {head:[0,0,-12], neck:[0,0,-4], hips:[0,0,3]}), {r:[0.03,0,0]}], [1.9, R(AL('cheek'), VSIGN('L'), {head:[0,0,-12], neck:[0,0,-4], hips:[0,0,3]}), {r:[0.03,0,0]}], [2.4, R()]]}, {cam:'faceClose'});
add('doubleV', C, '양손 브이', '양손 브이로 깡총', seq(0.4, [
  [R(arms('cheek'), VSIGN('L'), VSIGN('R'), {head:[0,0,8]}), {}], [R(arms('cheek'), VSIGN('L'), VSIGN('R'), {head:[0,0,-8]}, SQ(0.15)), {r:SQR(0.15)}]]), {cam:'faceClose'});
add('heartTop', C, '머리 위 하트', '두 팔로 크게 하트', {dur:2.4, keys:[
  [0, R()], [0.6, R(arms('heartTop'), OPEN, {head:[-6,0,0]})], [1.2, R(arms('heartTop'), OPEN, {head:[-6,0,8], hips:[0,0,-3]})], [1.8, R(arms('heartTop'), OPEN, {head:[-6,0,-8], hips:[0,0,3]})], [2.4, R()]]}, {cam:'zoomPunch'});
add('flowerCheek', C, '꽃받침', '양손으로 얼굴 받치기', seq(0.5, [
  [R(arms('chin'), OPEN, {head:[-6,0,10]}), {}], [R(arms('chin'), OPEN, {head:[-6,0,-10]}), {}]]), {cam:'faceClose'});
add('headTilt', C, '갸웃갸웃', '궁금해서 고개 기울이기', seq(0.6, [
  [R({head:[0,0,0]}), {}], [R({head:[0,0,20], neck:[0,0,6], hips:[0,0,-3]}, AL('chin')), {}], [R({head:[0,0,-20], neck:[0,0,-6], hips:[0,0,3]}, AL('chin')), {}]]), {cam:'faceClose'});
add('bow', C, '꾸벅 인사', '배꼽 손 하고 90도 인사', {dur:2.2, keys:[
  [0, R(arms('chest'))], [0.7, R(arms('chest'), {hips:[55,0,0], spine:[15,0,0], chest:[10,0,0], neck:[10,0,0]}), {r:[0,-0.02,-0.14]}], [1.3, R(arms('chest'), {hips:[55,0,0], spine:[15,0,0], chest:[10,0,0], neck:[10,0,0]}), {r:[0,-0.02,-0.14]}], [2.2, R(arms('chest'))]]}, {cam:'q34'});
add('waveBoth', C, '양손 흔들기', '반가워! 두 손 흔들기', seq(0.3, [
  [R(arms('wave'), OPEN, {jaw:[16,0,0]}), {}], [R(J(AL('wave'), {forearmL:[0,0,40]}), J(AR('wave'), {forearmR:[0,0,-40]}), OPEN, {jaw:[6,0,0], hips:[0,0,3]}), {r:[0.02,0,0]}]]), {cam:'zoomPunch'});
add('shy', C, '부끄부끄', '볼 감싸고 몸 배배 꼬기', seq(0.5, [
  [R(arms('cheek'), OPEN, {head:[8,0,12], hips:[0,10,0], chest:[0,-8,0]}, K.toeTapL), {pl:[0,1]}], [R(arms('cheek'), OPEN, {head:[8,0,-12], hips:[0,-10,0], chest:[0,8,0]}, M(K.toeTapL)), {pl:[1,0]}]]), {cam:'faceClose'});
add('buttWiggle', C, '엉덩이 흔들기', '씰룩씰룩 엉덩이 댄스', seq(0.25, [
  [R(arms('hip'), {hips:[18,0,10], spine:[-6,0,-8], chest:[0,0,-4], head:[-8,0,0]}), {r:[0.05,-0.06,-0.05]}], [R(arms('hip'), {hips:[18,0,-10], spine:[-6,0,8], chest:[0,0,4], head:[-8,0,0]}), {r:[-0.05,-0.06,-0.05]}]]), {cam:'orbitHalf'});
add('waddle', C, '뒤뚱뒤뚱', '펭귄처럼 뒤뚱 걷기', seq(0.35, [
  [R(arms('T'), {upperArmL:[0,0,40], upperArmR:[0,0,-40], hips:[0,0,8], spine:[0,0,-4]}, K.toeTapL), {pl:[0.3,1], r:[0.05,0,0]}], [R({upperArmL:[0,0,40], upperArmR:[0,0,-40], hips:[0,0,-8], spine:[0,0,4]}, M(K.toeTapL)), {pl:[1,0.3], r:[-0.05,0,0]}]]), {cam:'dolly'});
add('stomp', C, '발 동동', '신나서 발 동동 구르기', seq(0.18, [
  [R(arms('fistPump'), FIST, K.kneeUpL), {pl:[0,1]}], [R(arms('fistPump'), FIST), {}], [R(arms('fistPump'), FIST, M(K.kneeUpL)), {pl:[1,0]}], [R(arms('fistPump'), FIST), {}]]), {cam:'shake'});
add('surprise', C, '깜짝 놀람', '헉! 뒤로 펄쩍', {dur:2.0, keys:[
  [0, R()], [0.25, R(arms('up'), OPEN, JUMP, {jaw:[28,0,0], head:[-14,0,0], chest:[-10,0,0]}), {pl:[0,0], r:[0,0.22,-0.1]}], [0.6, R(J(AL('cheek'), AR('cheek')), OPEN, {jaw:[26,0,0], head:[-6,0,0]}), {r:[0,0,-0.12]}], [1.5, R(J(AL('cheek'), AR('cheek')), OPEN, {jaw:[20,0,0]}), {r:[0,0,-0.12]}], [2.0, R()]]}, {cam:'snapZoom'});
add('sleepy', C, '꾸벅꾸벅', '졸다가 화들짝', {dur:3.2, keys:[
  [0, R({head:[10,0,0]}), {ey:0.45}], [1.0, R({head:[40,0,8], neck:[15,0,0], chest:[8,0,0]}), {r:[0,-0.03,0], ey:0.9}], [1.5, R({head:[46,0,10], neck:[18,0,0], chest:[10,0,0]}), {r:[0,-0.04,0], ey:1}], [1.7, R({head:[-10,0,0], jaw:[16,0,0]}, arms('fwdLow'), OPEN), {r:[0,0.03,0]}], [2.6, R({head:[0,0,0]}), {ey:0.1}], [3.2, R({head:[10,0,0]}), {ey:0.45}]]}, {cam:'faceClose'});
add('yawn', C, '하품 기지개', '으아암~ 쭉', {dur:3.0, keys:[
  [0, R()], [0.8, R(arms('up'), OPEN, {chest:[-12,0,0], head:[-18,0,0], jaw:[30,0,0]}), {hr:[25,25], r:[0,0.06,0], ey:1}], [1.8, R(arms('up'), OPEN, {chest:[-14,0,10], spine:[0,0,8], head:[-18,0,6], jaw:[34,0,0]}), {hr:[25,25], r:[0,0.06,0], ey:1}], [3.0, R()]]}, {cam:'pull'});
add('pleaseHands', C, '부탁해요', '두 손 모아 애교', seq(0.4, [
  [R(arms('pray'), OPEN, {head:[0,0,10], hips:[0,0,-3]}), {}], [R(arms('pray'), OPEN, {head:[0,0,-10], hips:[0,0,3]}, SQ(0.12)), {r:SQR(0.12)}]]), {cam:'faceClose'});
add('cheer', C, '응원하기', '주먹 쥐고 힘내라!', seq(0.3, [
  [R(arms('fistPump'), FIST, {jaw:[10,0,0]}), {}], [R(arms('fistUp'), FIST, {jaw:[24,0,0], head:[-10,0,0]}), {hr:[15,15], r:[0,0.04,0]}]]), {cam:'bounce'});
add('levelUp', C, '레벨 업!', '웅크렸다가 팡 펼치기', {dur:2.2, keys:[
  [0, R()], [0.5, R(arms('chest'), FIST, SQ(0.7), {spine:[18,0,0], head:[16,0,0]}), {r:SQR(0.7)}], [0.8, R(arms('V'), OPEN, JUMP, {chest:[-12,0,0], head:[-14,0,0], jaw:[24,0,0]}), {pl:[0,0], r:[0,0.3,0]}], [1.2, R(arms('V'), OPEN, {chest:[-10,0,0], jaw:[20,0,0]}), {st:[[0.18,0],[-0.18,0]]}], [1.8, R(arms('V'), OPEN, {chest:[-10,0,0]}), {st:[[0.18,0],[-0.18,0]]}], [2.2, R()]]}, {cam:'heroLow'});
add('throwBall', C, '몬스터볼 던지기', '힘껏 던지는 포즈', {dur:2.0, keys:[
  [0, R()], [0.5, R(J(AL('back'), {upperArmL:[60,0,30], forearmL:[-90,0,0]}), AR('fwd'), FIST, {chest:[0,30,0], spine:[0,15,0], head:[0,-20,0]}, K.toeTapL), {pl:[0.4,1], st:[[0,0.25],[0,0]]}],
  [0.85, R(J(AL('fwd'), {upperArmL:[-120,0,0]}), AR('back'), OPEN, {chest:[10,-30,0], spine:[10,-15,0]}), {st:[[0,0.35],[0,0]], r:[0,-0.08,0.15]}], [1.4, R(AL('point'), AR('hip'), POINT('L'), {head:[-6,0,0]}), {st:[[0,0.35],[0,0]], r:[0,-0.06,0.15]}], [2.0, R()]]}, {cam:'heroLow'});
add('champion', C, '우승 세리머니', '허리에 손, 가슴 쭉', seq(0.5, [
  [R(arms('hip'), {chest:[-12,0,0], head:[-14,0,0]}), {st:[[0.12,0],[-0.12,0]]}], [R(arms('hip'), {chest:[-12,0,0], head:[-14,8,0], jaw:[20,0,0]}), {st:[[0.12,0],[-0.12,0]], r:[0,0.02,0]}]]), {cam:'heroLow'});
add('dizzy', C, '어질어질', '빙글빙글 비틀비틀', seq(0.45, [
  [R(arms('T'), OPEN, {head:[10,0,18], neck:[0,0,8], hips:[0,0,6], chest:[0,0,-10]}), {r:[0.06,0,0]}], [R(arms('T'), OPEN, {head:[-10,20,0], chest:[-6,0,0]}), {r:[0,0,0.05]}], [R(arms('T'), OPEN, {head:[10,0,-18], neck:[0,0,-8], hips:[0,0,-6], chest:[0,0,10]}), {r:[-0.06,0,0]}], [R(arms('T'), OPEN, {head:[16,-20,0]}), {r:[0,0,-0.05]}]]), {cam:'dutch'});
add('hugMe', C, '안아줘', '두 팔 벌려 안아달라기', seq(0.6, [
  [R(J(AL('fwd'), {upperArmL:[-80,0,40]}), J(AR('fwd'), {upperArmR:[-80,0,-40]}), OPEN, {head:[-6,0,10]}), {hr:[10,10]}], [R(J(AL('fwd'), {upperArmL:[-82,0,26], forearmL:[-20,0,0]}), J(AR('fwd'), {upperArmR:[-82,0,-26], forearmR:[-20,0,0]}), OPEN, {head:[-6,0,-10]}), {hr:[20,20], r:[0,0.02,0]}]]), {cam:'push'});
add('blowKiss', C, '손키스', '쪽! 하고 날리기', {dur:2.0, keys:[
  [0, R()], [0.5, R(AL('chin'), OPEN, {head:[4,0,-6], jaw:[0,0,0]})], [0.9, R(J(AL('fwd'), {upperArmL:[-110,0,20]}), OPEN, {head:[-6,0,-8], hips:[0,0,4]}, K.backLegL), {pl:[0,1]}], [1.5, R(J(AL('fwd'), {upperArmL:[-110,0,20]}), OPEN, {head:[-6,0,-8]}, K.backLegL), {pl:[0,1]}], [2.0, R()]]}, {cam:'faceClose'});
add('tantrum', C, '투정 부리기', '싫어싫어 발 구르기', seq(0.2, [
  [R(arms('fwdLow'), FIST, {head:[0,15,0], jaw:[14,0,0]}, K.kneeUpL), {pl:[0,1]}], [R(J(AL('down'), {upperArmL:[0,0,25]}), J(AR('down'), {upperArmR:[0,0,-25]}), FIST, {head:[0,-15,0]}), {}], [R(arms('fwdLow'), FIST, {head:[0,15,0], jaw:[14,0,0]}, M(K.kneeUpL)), {pl:[1,0]}], [R(J(AL('down'), {upperArmL:[0,0,25]}), J(AR('down'), {upperArmR:[0,0,-25]}), FIST, {head:[0,-15,0]}), {}]]), {cam:'shake'});
add('peek', C, '빼꼼', '손으로 햇빛 가리고 두리번', seq(0.7, [
  [R(J(AL('salute'), {upperArmL:[-40,0,60]}), {hips:[0,0,6], spine:[0,0,-10], chest:[0,0,-8], head:[0,20,0]}), {r:[0.06,0,0]}], [R(J(AL('salute'), {upperArmL:[-40,0,60]}), {hips:[0,0,-6], spine:[0,0,10], chest:[0,0,8], head:[0,-20,0]}), {r:[-0.06,0,0]}]]), {cam:'q34'});
add('cuteFists', C, '귀요미 주먹', '볼 옆 주먹 쥐고 흔들흔들', seq(0.3, [
  [R(arms('cheek'), FIST, {head:[0,0,12], hips:[0,0,-4]}), {}], [R(arms('cheek'), FIST, {head:[0,0,-12], hips:[0,0,4]}, SQ(0.1)), {r:SQR(0.1)}]]), {cam:'bounce'});
add('laugh', C, '깔깔 웃기', '배 잡고 웃기', seq(0.25, [
  [R(arms('chest'), OPEN, {hips:[14,0,0], spine:[10,0,0], head:[-12,0,0], jaw:[26,0,0]}), {r:[0,-0.03,0], ey:0.85}], [R(arms('chest'), OPEN, {hips:[6,0,0], spine:[4,0,0], head:[-20,0,0], jaw:[10,0,0]}), {ey:0.85}]]), {cam:'faceClose'});
add('pout', C, '시무룩', '어깨 축 늘어뜨리고 한숨', {dur:3, keys:[
  [0, R()], [1, R({head:[30,0,8], neck:[10,0,0], chest:[14,0,0], shoulderL:[0,0,-8], shoulderR:[0,0,8], upperArmL:[0,0,4], upperArmR:[0,0,-4]}, K.toeTapL), {pl:[0.4,1]}], [2.2, R({head:[30,0,-8], neck:[10,0,0], chest:[14,0,0], shoulderL:[0,0,-8], shoulderR:[0,0,8]}), {}], [3, R()]]}, {cam:'pull'});
add('thinking', C, '음… 생각중', '턱 괴고 갸웃', seq(0.8, [
  [R(AL('chin'), AR('cross'), {head:[0,0,12], hips:[0,0,-3]}, POINT('L')), {}], [R(AL('chin'), AR('cross'), {head:[-8,10,-6], hips:[0,0,3]}, POINT('L')), {}]]), {cam:'faceClose'});
add('angry', C, '흥! 화남', '팔짱 끼고 고개 홱', {dur:2.2, keys:[
  [0, R()], [0.4, R(arms('cross'), {head:[-10,40,0], chest:[-6,0,0]}, M(K.heelTapL)), {pl:[1,0.5]}], [1.6, R(arms('cross'), {head:[-10,42,0], chest:[-6,0,0]}, M(K.heelTapL)), {pl:[1,0.5]}], [2.2, R()]]}, {cam:'snapZoom'});
add('excited', C, '두근두근', '주먹 쥐고 제자리 콩콩', seq(0.22, [
  [R(arms('chest'), FIST, {jaw:[16,0,0]}), {hr:[30,30], r:[0,0.06,0]}], [R(arms('chest'), FIST, {jaw:[6,0,0]}), {}]]), {cam:'bounce'});
add('catPaw', C, '고양이 손', '냥냥 손짓', seq(0.35, [
  [R(J(AL('cheek'), {forearmL:[-130,0,0], handL:[-50,0,0]}), J(AR('cheek'), {forearmR:[-130,0,0], handR:[-50,0,0]}), FIST, {head:[0,0,10]}), {}], [R(J(AL('cheek'), {forearmL:[-110,0,0], handL:[-70,0,0]}), J(AR('cheek'), {forearmR:[-150,0,0], handR:[-30,0,0]}), FIST, {head:[0,0,-10]}), {}]]), {cam:'faceClose'});
add('fly', C, '파닥파닥 날기', '새처럼 날개 파닥', seq(0.22, [
  [R(arms('T'), OPEN, {upperArmL:[0,0,120], upperArmR:[0,0,-120]}), {hr:[25,25], r:[0,0.05,0]}], [R(arms('T'), OPEN, {upperArmL:[0,0,55], upperArmR:[0,0,-55]}), {}]]), {cam:'heroLow'});
add('ding', C, '띵! 아이디어', '손가락 번쩍', {dur:2, keys:[
  [0, R()], [0.3, R(AL('pointUp'), POINT('L'), {head:[-10,0,0], jaw:[20,0,0]}, JUMP), {pl:[0,0], r:[0,0.12,0]}], [0.6, R(AL('pointUp'), POINT('L'), {head:[-10,0,0], jaw:[20,0,0]})], [1.5, R(AL('pointUp'), POINT('L'), {head:[-8,0,6]})], [2, R()]]}, {cam:'zoomPunch'});
add('salute2', C, '충성!', '씩씩하게 경례', {dur:2, keys:[
  [0, R()], [0.4, R(M(A.salute), {chest:[-8,0,0], head:[-6,0,0]}), {hr:[10,10]}], [1.5, R(M(A.salute), {chest:[-8,0,0], head:[-6,0,0]})], [2, R()]]}, {cam:'heroLow'});

/* ======================= 몸매 뽐내기 ======================= */
const BD = 'body';
const poseHold = (spec, opts, dur = 3) => ({dur, keys:[[0, R()], [0.6, spec, opts || {}], [dur - 0.6, spec, opts || {}], [dur, R()]]});
add('frontDouble', BD, '프론트 더블 바이셉스', '정면 두 팔 알통', poseHold(R(arms('flex'), FIST, {chest:[-10,0,0], head:[-4,0,0]}), {st:[[0.16,0],[-0.16,0]]}), {cam:'heroLow'});
add('backDouble', BD, '백 더블 바이셉스', '뒤돌아 두 팔 알통', poseHold(R(arms('flex'), FIST, {chest:[-6,0,0], head:[0,25,0]}), {st:[[0.14,0],[-0.14,0]]}), {yaw:180, cam:'orbitHalf'});
add('sideChest', BD, '사이드 체스트', '옆으로 서서 가슴 펴기', poseHold(R({upperArmL:[-30,0,-20], forearmL:[-100,0,0], upperArmR:[-40,0,10], forearmR:[-80,0,0], chest:[-10,30,0], spine:[0,15,0], head:[0,-30,0]}, FIST, K.toeTapL), {pl:[0.5,1]}), {yaw:-60, cam:'q34'});
add('sideTriceps', BD, '사이드 트라이셉스', '팔 뒤로 펴서 삼두', poseHold(R({upperArmL:[20,0,8], forearmL:[0,0,0], upperArmR:[-10,0,-30], forearmR:[-100,0,0], chest:[-8,25,0], head:[0,-30,0]}, FIST, K.toeTapL), {pl:[0.5,1]}), {yaw:-60, cam:'q34'});
add('latSpread', BD, '랫 스프레드', '허리 짚고 등 넓게', poseHold(R(arms('hip'), FIST, {upperArmL:[-20,0,50], upperArmR:[-20,0,-50], chest:[-10,0,0]}), {st:[[0.16,0],[-0.16,0]]}), {cam:'heroLow'});
add('absThigh', BD, '앱도미널 앤 사이', '머리 뒤 손, 한 발 앞으로', poseHold(R(arms('behindHead'), {spine:[10,0,0], chest:[6,0,0]}, K.heelTapL), {st:[[0,0.3],[0,0]], pl:[0.6,1]}), {cam:'push'});
add('mostMuscular', BD, '모스트 머스큘러', '구부정하게 힘 꽉', poseHold(R({upperArmL:[-50,0,25], forearmL:[-95,0,0], upperArmR:[-50,0,-25], forearmR:[-95,0,0], hips:[10,0,0], spine:[12,0,0], chest:[8,0,0], head:[-14,0,0], jaw:[14,0,0]}, FIST, SQ(0.2)), {r:SQR(0.2), st:[[0.16,0],[-0.16,0]]}), {cam:'snapZoom'});
add('oneArmFlex', BD, '한 팔 알통', '알통 자랑하며 쳐다보기', poseHold(R(AL('flex'), AR('hip'), FIST, {head:[6,30,0], chest:[0,10,0]}), {}), {cam:'faceClose'});
add('bicepKiss', BD, '알통 뽀뽀', '알통에 쪽!', {dur:3, keys:[[0, R()], [0.6, R(AL('flex'), AR('hip'), FIST, {head:[10,40,10]})], [1.3, R(AL('flex'), AR('hip'), FIST, {head:[20,55,18], neck:[0,10,0]})], [2.2, R(AL('flex'), AR('hip'), FIST, {head:[0,30,0], jaw:[16,0,0]})], [3, R()]]}, {cam:'faceClose'});
add('mirrorSelfie', BD, '거울 셀카', '휴대폰 들고 엉덩이 쭉', poseHold(R(J(AL('cheek'), {upperArmL:[-60,0,20], forearmL:[-80,0,0]}), AR('hip'), {hips:[0,0,-8], spine:[0,0,6], head:[0,0,-10]}, M(K.toeTapL)), {pl:[1,0.5], r:[-0.06,0,0]}), {cam:'faceClose'});
add('modelWalk', BD, '모델 워킹', '골반 흔들며 제자리 워킹', seq(0.45, [
  [R(AL('swingB'), AR('swingF'), {hips:[0,-6,6], chest:[0,6,0], head:[-4,0,0]}, K.crossL), {pl:[0.4,1], r:[0.04,0,0]}], [R(AL('swingF'), AR('swingB'), {hips:[0,6,-6], chest:[0,-6,0], head:[-4,0,0]}, M(K.crossL)), {pl:[1,0.4], r:[-0.04,0,0]}]]), {cam:'push'});
add('handsHips', BD, '허리에 손', '자신감 뿜뿜 서기', poseHold(R(arms('hip'), {chest:[-10,0,0], head:[-8,0,0]}), {st:[[0.15,0],[-0.15,0]]}), {cam:'heroLow'});
add('sLine', BD, 'S라인 포즈', '골반 빼고 머리에 손', poseHold(R(AL('behindHead'), AR('hip'), {hips:[0,0,-10], spine:[0,0,8], chest:[0,0,6], head:[0,0,-8]}, M(K.toeTapL)), {pl:[1,0.5], r:[-0.08,0,0]}), {cam:'orbitHalf'});
add('absShow', BD, '복근 자랑', '두 손 머리 뒤, 배에 힘', poseHold(R(arms('behindHead'), {spine:[8,0,0], chest:[4,0,0], head:[-4,0,0]}), {st:[[0.1,0],[-0.1,0]]}), {cam:'push'});
add('backView', BD, '뒤태 뽐내기', '뒤돌아 어깨 너머로', poseHold(R(arms('hip'), {hips:[0,0,6], head:[0,-60,0], neck:[0,-20,0], chest:[0,-15,0]}, M(K.toeTapL)), {pl:[1,0.5]}), {yaw:180, cam:'orbitHalf'});
add('legLine', BD, '다리 라인', '한 다리 앞으로 쭉 뻗기', poseHold(R(arms('hip'), {hips:[0,0,4]}, {thighL:[-25,0,6], shinL:[0,0,0], footL:[45,0,0]}), {pl:[0,1]}), {cam:'feetToHead'});
add('flexTurn', BD, '돌면서 근육 자랑', '정면·옆·뒤 포즈 이어서', {dur:6, keys:[
  [0, R()], [0.6, R(arms('flex'), FIST, {chest:[-10,0,0]})], [1.6, R(arms('flex'), FIST, {chest:[-10,0,0]})],
  [2.2, R({upperArmL:[-30,0,-20], forearmL:[-100,0,0], upperArmR:[-40,0,10], forearmR:[-80,0,0], hips:[0,-90,0], chest:[-10,30,0], head:[0,60,0]}, FIST), {pl:[0,0]}], [3.2, R({upperArmL:[-30,0,-20], forearmL:[-100,0,0], upperArmR:[-40,0,10], forearmR:[-80,0,0], hips:[0,-90,0], chest:[-10,30,0], head:[0,60,0]}, FIST), {pl:[0,0]}],
  [3.8, R(arms('flex'), FIST, {hips:[0,-180,0], head:[0,25,0]}), {pl:[0,0]}], [4.8, R(arms('flex'), FIST, {hips:[0,-180,0], head:[0,25,0]}), {pl:[0,0]}], [5.4, R({hips:[0,-270,0]}), {pl:[0,0]}], [6, R({hips:[0,-360,0]}), {pl:[0,0]}]]}, {cam:'orbit'});
add('vacuum', BD, '배 집어넣기', '숨 들이마시며 배 쏙', poseHold(R(arms('behindHead'), {chest:[-14,0,0], spine:[-4,0,0], head:[-6,0,0]}), {st:[[0.1,0],[-0.1,0]]}, 4), {cam:'push'});
add('victoryFlex', BD, '우승 포즈', '두 주먹 번쩍 가슴 쫙', poseHold(R(arms('fistUp'), FIST, {chest:[-14,0,0], head:[-16,0,0], jaw:[24,0,0]}), {st:[[0.18,0],[-0.18,0]]}), {cam:'heroLow'});
add('flexPulse', BD, '알통 펌핑', '알통에 힘 줬다 풀었다', seq(0.5, [
  [R(arms('flex'), FIST, {chest:[-10,0,0]}), {}], [R(arms('flexLow'), FIST, {chest:[-6,0,0], hips:[0,10,0]}), {}], [R(arms('flex'), FIST, {chest:[-10,0,0]}), {}], [R(arms('flexLow'), FIST, {chest:[-6,0,0], hips:[0,-10,0]}), {}]]), {cam:'bounce'});
add('chestPop', BD, '가슴 근육 튕기기', '가슴 펌핑 좌우', seq(0.3, [
  [R(arms('hip'), {chest:[-10,8,0], shoulderL:[0,-8,4]}), {}], [R(arms('hip'), {chest:[-10,-8,0], shoulderR:[0,8,-4]}), {}]]), {cam:'faceClose'});

/* ======================= K팝 댄스 ======================= */
const KP = 'kpop', BT = 0.42;    // 약 143 BPM
const dn = (d=0.06) => ({r:[0,-d,0]});
add('kBounce', KP, '바운스', '무릎 리듬 + 어깨', seq(BT, [
  [R(arms('fistPump'), FIST, {chest:[0,8,0]}, SQ(0.12)), {r:SQR(0.12)}], [R(arms('fistPump'), FIST, {chest:[0,-8,0]}), {}]]), {cam:'bounce'});
add('kTwoStep', KP, '투스텝', '좌우로 한 발씩 모으기', seq(BT, [
  [R(arms('swingF'), {hips:[0,0,6]}), {st:[[0.3,0],[0,0]], r:[0.12,-0.04,0]}], [R(arms('down'), {}), {st:[[0.3,0],[0.3,0]], r:[0.25,0,0]}], [R(arms('swingF'), {hips:[0,0,-6]}), {st:[[0,0],[0.3,0]], r:[0.12,-0.04,0]}], [R(arms('down')), {}]]), {cam:'dolly'});
add('kSideClap', KP, '사이드 스텝 박수', '옆으로 딛고 짝', seq(BT, [
  [R(J(AL('fwd'), {upperArmL:[-70,0,-20], forearmL:[-60,0,0]}), J(AR('fwd'), {upperArmR:[-70,0,20], forearmR:[-60,0,0]}), OPEN), {st:[[0.28,0],[0,0]], r:[0.1,-0.05,0]}],
  [R(J(AL('T'), {upperArmL:[0,0,60]}), J(AR('T'), {upperArmR:[0,0,-60]}), OPEN), {st:[[0.28,0],[0.12,0]], r:[0.18,0,0]}],
  [R(J(AL('fwd'), {upperArmL:[-70,0,-20], forearmL:[-60,0,0]}), J(AR('fwd'), {upperArmR:[-70,0,20], forearmR:[-60,0,0]}), OPEN), {st:[[0,0],[-0.28,0]], r:[-0.1,-0.05,0]}],
  [R(J(AL('T'), {upperArmL:[0,0,60]}), J(AR('T'), {upperArmR:[0,0,-60]}), OPEN), {st:[[-0.12,0],[-0.28,0]], r:[-0.18,0,0]}]]), {cam:'bounce'});
add('kBodyWave', KP, '바디 웨이브', '가슴→배→골반으로 물결', seq(BT, [
  [R(arms('down'), {chest:[-14,0,0], head:[-10,0,0]}), {r:[0,0,0.03]}], [R(arms('down'), {chest:[10,0,0], spine:[-12,0,0], head:[8,0,0]}), {r:[0,-0.04,0.06]}], [R(arms('down'), {spine:[10,0,0], hips:[-10,0,0]}, SQ(0.15)), {r:[0,-0.1,-0.02]}], [R(arms('down'), {hips:[6,0,0]}), {r:[0,-0.02,-0.04]}]]), {cam:'push'});
add('kArmWave', KP, '팔 웨이브', '어깨에서 손끝으로 물결', seq(BT*0.75, [
  [R(arms('T'), OPEN, {shoulderL:[0,0,10]}), {}], [R(arms('T'), OPEN, {upperArmL:[0,0,100], forearmL:[0,0,-20], handL:[0,0,-30]}), {}], [R(arms('T'), OPEN, {upperArmR:[0,0,-100], forearmR:[0,0,20], handR:[0,0,30], shoulderR:[0,0,-10]}), {}], [R(arms('T'), OPEN, {forearmR:[0,0,-20], handR:[0,0,-30], upperArmR:[0,0,-80]}), {}]]), {cam:'orbitHalf'});
add('kPopping', KP, '팝핑', '탁탁 끊어지는 힘주기', seq(BT/2, [
  [R(arms('flex'), FIST, {chest:[-6,0,0]}), {}], [R(arms('flex'), FIST, {chest:[-12,0,0], shoulderL:[0,0,8], shoulderR:[0,0,-8]}), {}, 0.5], [R(J(AL('T'), {forearmL:[0,0,60]}), J(AR('T'), {forearmR:[0,0,-60]}), FIST, SQ(0.1)), {r:SQR(0.1)}], [R(J(AL('T'), {forearmL:[0,0,60]}), J(AR('T'), {forearmR:[0,0,-60]}), FIST, SQ(0.1), {chest:[-6,0,0]}), {r:SQR(0.1)}, 0.5]]), {cam:'bounce'});
add('kHits', KP, '히트 포인트', '박자마다 팍! 각 잡기', seq(BT, [
  [R(AL('pointUp'), AR('hip'), POINT('L'), {head:[-6,20,0]}), {st:[[0.15,0],[-0.15,0]]}], [R(AL('hip'), AR('pointUp'), POINT('R'), {head:[-6,-20,0]}), {st:[[0.15,0],[-0.15,0]]}], [R(arms('cross'), FIST, SQ(0.2)), {r:SQR(0.2), st:[[0.15,0],[-0.15,0]]}], [R(arms('V'), OPEN, {chest:[-10,0,0]}), {st:[[0.15,0],[-0.15,0]]}]]), {cam:'snapZoom'});
add('kShoulder', KP, '어깨 춤', '어깨 들썩들썩', seq(BT/2, [
  [R(arms('fistPump'), FIST, {shoulderL:[0,0,16], shoulderR:[0,0,-4]}), {}], [R(arms('fistPump'), FIST, {shoulderL:[0,0,-4], shoulderR:[0,0,-16]}), dn(0.03)]]), {cam:'bounce'});
add('kHipRoll', KP, '힙 롤링', '골반으로 원 그리기', seq(BT, [
  [R(arms('hip'), {hips:[8,0,8]}), {r:[0.06,-0.04,0]}], [R(arms('hip'), {hips:[-8,0,0]}), {r:[0,-0.05,0.05]}], [R(arms('hip'), {hips:[8,0,-8]}), {r:[-0.06,-0.04,0]}], [R(arms('hip'), {hips:[14,0,0]}), {r:[0,-0.06,-0.06]}]]), {cam:'orbitHalf'});
add('kHeartDance', KP, '하트 춤', '양쪽으로 하트 쏘기', seq(BT, [
  [R(arms('heartTop'), OPEN, {hips:[0,0,6], head:[0,0,-8]}), {r:[0.06,0,0]}], [R(arms('heartTop'), OPEN, {hips:[0,0,-6], head:[0,0,8]}, SQ(0.12)), {r:SQR(0.12)}], [R(arms('chin'), OPEN, {hips:[0,0,-6], head:[0,0,8]}), {r:[-0.06,0,0]}], [R(arms('chin'), OPEN, SQ(0.12)), {r:SQR(0.12)}]]), {cam:'zoomPunch'});
add('kFingerGun', KP, '손가락 총', '빵! 포인트 안무', seq(BT, [
  [R(AL('point'), AR('hip'), GUN('L'), {chest:[0,20,0], head:[0,25,0]}), {st:[[0.15,0.1],[-0.12,0]]}], [R(J(AL('point'), {forearmL:[-30,0,0]}), AR('hip'), GUN('L'), {chest:[0,20,0], head:[0,25,0]}), {st:[[0.15,0.1],[-0.12,0]], r:[0,-0.04,0]}], [R(AR('point').upperArmR ? J(AL('hip'), AR('point')) : {}, GUN('R'), {chest:[0,-20,0], head:[0,-25,0]}), {st:[[0.12,0],[-0.15,0.1]]}], [R(J(AL('hip'), AR('point'), {forearmR:[-30,0,0]}), GUN('R'), {chest:[0,-20,0], head:[0,-25,0]}), {st:[[0.12,0],[-0.15,0.1]], r:[0,-0.04,0]}]]), {cam:'snapZoom'});
add('kWristFlick', KP, '손목 털기', '손목 탈탈 + 바운스', seq(BT/2, [
  [R(J(AL('fwdLow'), {forearmL:[-60,0,0], handL:[-40,0,0]}), J(AR('fwdLow'), {forearmR:[-60,0,0], handR:[-40,0,0]}), OPEN), {}], [R(J(AL('fwdLow'), {forearmL:[-60,0,0], handL:[30,0,0]}), J(AR('fwdLow'), {forearmR:[-60,0,0], handR:[30,0,0]}), OPEN, SQ(0.08)), {r:SQR(0.08)}]]), {cam:'bounce'});
add('kJumpPoint', KP, '점프 포인트', '점프하며 하늘 찌르기', seq(BT, [
  [R(arms('cross'), FIST, SQ(0.35)), {r:SQR(0.35)}], [R(AL('pointUp'), AR('back'), POINT('L'), JUMP, {head:[-12,0,0]}), {pl:[0,0], r:[0,0.25,0]}], [R(AL('pointUp'), AR('down'), POINT('L')), {}], [R(arms('down')), {}]]), {cam:'heroLow'});
add('kCrossStep', KP, '크로스 스텝', '발 엇갈려 딛기', seq(BT, [
  [R(arms('swingF'), K.crossL, {hips:[0,10,0]}), {st:[[-0.12,0.08],[0,0]], r:[0,-0.04,0]}], [R(arms('swingB')), {}], [R(arms('swingF'), M(K.crossL), {hips:[0,-10,0]}), {st:[[0,0],[0.12,0.08]], r:[0,-0.04,0]}], [R(arms('swingB')), {}]]), {cam:'q34'});
add('kKneeTap', KP, '무릎 터치', '무릎 올려 반대손 터치', seq(BT, [
  [R(J(AL('down')), J(AR('fwdLow'), {upperArmR:[-40,0,30], forearmR:[-60,0,0]}), {chest:[0,-15,0], spine:[10,0,0]}, K.kneeUpL), {pl:[0,1]}], [R(), {}], [R(J(AR('down')), J(AL('fwdLow'), {upperArmL:[-40,0,-30], forearmL:[-60,0,0]}), {chest:[0,15,0], spine:[10,0,0]}, M(K.kneeUpL)), {pl:[1,0]}], [R(), {}]]), {cam:'bounce'});
add('kShuffle', KP, '셔플', '뒤꿈치·발끝 번갈아 미끄러지기', seq(BT/2, [
  [R(arms('fistPump'), FIST, K.heelTapL), {pl:[0.3,1], hr:[0,20]}], [R(arms('fistPump'), FIST, M(K.toeTapL)), {pl:[1,0.3]}], [R(arms('fistPump'), FIST, M(K.heelTapL)), {pl:[1,0.3], hr:[20,0]}], [R(arms('fistPump'), FIST, K.toeTapL), {pl:[0.3,1]}]]), {cam:'feetToHead'});
add('kRunningMan', KP, '러닝맨', '제자리 달리듯 끌기', seq(BT/2, [
  [R(AL('swingF'), AR('swingB'), FIST, K.kneeUpL, SQ(0.1)), {pl:[0,1], r:SQR(0.1)}], [R(AL('swingB'), AR('swingF'), FIST, {thighL:[10,0,0]}), {pl:[1,1], st:[[0,-0.25],[0,0]]}], [R(AL('swingB'), AR('swingF'), FIST, M(K.kneeUpL), SQ(0.1)), {pl:[1,0], r:SQR(0.1)}], [R(AL('swingF'), AR('swingB'), FIST, {thighR:[10,0,0]}), {pl:[1,1], st:[[0,0],[0,-0.25]]}]]), {cam:'q34'});
add('kGroove', KP, '그루브', '몸 전체 리듬 타기', seq(BT, [
  [R(arms('swingF'), {chest:[6,10,0], head:[8,0,0]}, SQ(0.14)), {r:SQR(0.14)}], [R(arms('swingB'), {chest:[-6,0,0], head:[-6,0,0]}), {}], [R(arms('swingF'), {chest:[6,-10,0], head:[8,0,0]}, SQ(0.14)), {r:SQR(0.14)}], [R(arms('swingB'), {chest:[-6,0,0]}), {}]]), {cam:'bounce'});
add('kClapJump', KP, '박수 점프', '짝 치고 점프', seq(BT, [
  [R(J(AL('fwd'), {upperArmL:[-80,0,-14], forearmL:[-40,0,0]}), J(AR('fwd'), {upperArmR:[-80,0,14], forearmR:[-40,0,0]}), OPEN, SQ(0.3)), {r:SQR(0.3)}], [R(arms('up'), OPEN, JUMP), {pl:[0,0], r:[0,0.22,0]}]]), {cam:'zoomPunch'});
add('kDiscoPoint', KP, '디스코 포인트', '하늘 찌르고 땅 찌르기', seq(BT, [
  [R(AL('pointUp'), AR('hip'), POINT('L'), {hips:[0,0,-6], head:[-10,20,0]}), {r:[-0.05,0,0]}], [R(J(AL('pointUp'), {upperArmL:[-30,0,-40]}), AR('hip'), POINT('L'), {hips:[0,0,6], head:[10,-10,0]}, SQ(0.12)), {r:[0.05,-0.05,0]}]]), {cam:'dutch'});
add('kChestPump', KP, '가슴 튕기기', '가슴 앞뒤로 펌핑', seq(BT/2, [
  [R(arms('fistPump'), FIST, {chest:[-16,0,0], head:[-8,0,0]}), {}], [R(arms('fistPump'), FIST, {chest:[8,0,0], head:[6,0,0]}, SQ(0.08)), {r:SQR(0.08)}]]), {cam:'bounce'});
add('kHeadNod', KP, '고개 리듬', '고개로 박자 타기', seq(BT/2, [
  [R(arms('fistPump'), FIST, {head:[16,0,0], neck:[8,0,0]}, SQ(0.08)), {r:SQR(0.08)}], [R(arms('fistPump'), FIST, {head:[-8,0,0]}), {}]]), {cam:'faceClose'});
add('kCuteHands', KP, '귀요미 손', '볼 옆 손으로 리듬', seq(BT, [
  [R(arms('cheek'), OPEN, {head:[0,0,10], hips:[0,0,-5]}), {r:[0.05,0,0]}], [R(arms('cheek'), FIST, {head:[0,0,-10], hips:[0,0,5]}, SQ(0.1)), {r:[-0.05,-0.04,0]}]]), {cam:'faceClose'});
add('kLasso', KP, '올가미 돌리기', '머리 위로 손 돌리기', seq(BT/2, [
  [R(J(AL('up'), {upperArmL:[-150,0,40], forearmL:[-40,0,0]}), AR('hip'), POINT('L'), {hips:[0,0,4]}), {}], [R(J(AL('up'), {upperArmL:[-160,0,10], forearmL:[0,0,40]}), AR('hip'), POINT('L')), dn(0.03)], [R(J(AL('up'), {upperArmL:[-170,0,40], forearmL:[30,0,0]}), AR('hip'), POINT('L'), {hips:[0,0,-4]}), {}], [R(J(AL('up'), {upperArmL:[-160,0,70], forearmL:[0,0,-30]}), AR('hip'), POINT('L')), dn(0.03)]]), {cam:'orbitHalf'});
add('kSpinPose', KP, '턴 마무리', '돌고 나서 포즈!', {dur:2.4, keys:[
  [0, R(arms('T')), {pl:[0,0]}], [0.3, R(arms('cross'), {hips:[0,90,0]}), {pl:[0,0]}], [0.6, R(arms('cross'), {hips:[0,180,0]}), {pl:[0,0]}], [0.9, R(arms('cross'), {hips:[0,270,0]}), {pl:[0,0]}], [1.2, R(AL('pointUp'), AR('hip'), POINT('L'), {hips:[0,360,0], head:[-10,0,0]}), {pl:[0,0]}], [2.0, R(AL('pointUp'), AR('hip'), POINT('L'), {hips:[0,360,0], head:[-10,0,0]}), {pl:[1,1]}], [2.4, R(arms('T'), {hips:[0,360,0]}), {pl:[0,0]}]]}, {cam:'orbitFast'});
add('kWaveArms', KP, '파도타기 팔', '양팔로 파도', seq(BT, [
  [R(J(AL('T'), {upperArmL:[0,0,110], forearmL:[0,0,-30]}), J(AR('T'), {upperArmR:[0,0,-70], forearmR:[0,0,30]}), OPEN, {hips:[0,0,-6]}), {r:[-0.04,0,0]}], [R(J(AL('T'), {upperArmL:[0,0,70], forearmL:[0,0,30]}), J(AR('T'), {upperArmR:[0,0,-110], forearmR:[0,0,-30]}), OPEN, {hips:[0,0,6]}), {r:[0.04,0,0]}]]), {cam:'dolly'});
add('kStompClap', KP, '발 구르고 박수', '쿵쿵 짝', seq(BT, [
  [R(arms('fistPump'), FIST, K.kneeUpL), {pl:[0,1]}], [R(arms('fistPump'), FIST, SQ(0.1)), {r:SQR(0.1)}], [R(arms('fistPump'), FIST, M(K.kneeUpL)), {pl:[1,0]}], [R(J(AL('fwd'), {upperArmL:[-80,0,-14], forearmL:[-40,0,0]}), J(AR('fwd'), {upperArmR:[-80,0,14], forearmR:[-40,0,0]}), OPEN), {}]]), {cam:'bounce'});
add('kSlide', KP, '옆으로 미끄러지기', '스르륵 슬라이드', seq(BT, [
  [R(J(AL('T'), {upperArmL:[0,0,60]}), J(AR('T'), {upperArmR:[0,0,-110]}), OPEN, {hips:[0,0,8], chest:[0,0,-10]}), {st:[[0.35,0],[0,0]], r:[0.15,-0.08,0]}], [R(arms('down'), OPEN), {st:[[0.35,0],[0.3,0]], r:[0.3,0,0]}], [R(J(AL('T'), {upperArmL:[0,0,110]}), J(AR('T'), {upperArmR:[0,0,-60]}), OPEN, {hips:[0,0,-8], chest:[0,0,10]}), {st:[[0.05,0],[0.3,0]], r:[0.15,-0.08,0]}], [R(arms('down'), OPEN), {st:[[0,0],[0,0]]}]]), {cam:'dolly'});
add('kRoutineA', KP, '8카운트 루틴 A', '스텝→웨이브→하트→포인트', seq(BT, [
  [R(arms('swingF'), {hips:[0,0,6]}), {st:[[0.28,0],[0,0]], r:[0.12,-0.04,0]}], [R(arms('down')), {st:[[0.28,0],[0.28,0]], r:[0.25,0,0]}], [R(arms('swingF'), {hips:[0,0,-6]}), {st:[[0,0],[0.28,0]], r:[0.12,-0.04,0]}], [R(arms('down')), {}],
  [R(arms('down'), {chest:[-14,0,0], head:[-10,0,0]}), {r:[0,0,0.03]}], [R(arms('down'), {chest:[10,0,0], spine:[-12,0,0]}), {r:[0,-0.04,0.06]}], [R(arms('down'), {spine:[10,0,0], hips:[-10,0,0]}, SQ(0.15)), {r:[0,-0.1,-0.02]}], [R(arms('down')), {}],
  [R(arms('heartTop'), OPEN, {hips:[0,0,6]}), {r:[0.06,0,0]}], [R(arms('heartTop'), OPEN, {hips:[0,0,-6]}, SQ(0.12)), {r:SQR(0.12)}], [R(arms('chin'), OPEN), {}], [R(arms('chin'), OPEN, SQ(0.12)), {r:SQR(0.12)}],
  [R(AL('pointUp'), AR('hip'), POINT('L'), {head:[-6,20,0]}), {st:[[0.15,0],[-0.15,0]]}], [R(AL('hip'), AR('pointUp'), POINT('R'), {head:[-6,-20,0]}), {st:[[0.15,0],[-0.15,0]]}], [R(arms('cross'), FIST, SQ(0.2)), {r:SQR(0.2), st:[[0.15,0],[-0.15,0]]}], [R(arms('V'), OPEN, {chest:[-10,0,0]}), {st:[[0.15,0],[-0.15,0]]}]]), {cam:'bounce'});
add('kRoutineB', KP, '8카운트 루틴 B', '파워풀: 팝핑→히트→점프', seq(BT, [
  [R(arms('flex'), FIST, {chest:[-6,0,0]}), {}], [R(J(AL('T'), {forearmL:[0,0,60]}), J(AR('T'), {forearmR:[0,0,-60]}), FIST, SQ(0.1)), {r:SQR(0.1)}], [R(arms('flex'), FIST, {chest:[-12,0,0]}), {}], [R(arms('cross'), FIST, SQ(0.25)), {r:SQR(0.25)}],
  [R(AL('pointUp'), AR('back'), POINT('L'), JUMP), {pl:[0,0], r:[0,0.22,0]}], [R(AL('pointUp'), AR('down'), POINT('L')), {}], [R(AR('pointUp'), AL('back'), POINT('R'), JUMP), {pl:[0,0], r:[0,0.22,0]}], [R(AR('pointUp'), AL('down'), POINT('R')), {}],
  [R(arms('fistPump'), FIST, K.kneeUpL), {pl:[0,1]}], [R(arms('fistPump'), FIST, SQ(0.1)), {r:SQR(0.1)}], [R(arms('fistPump'), FIST, M(K.kneeUpL)), {pl:[1,0]}], [R(arms('fistPump'), FIST, SQ(0.1)), {r:SQR(0.1)}],
  [R(arms('V'), OPEN, {chest:[-12,0,0], head:[-10,0,0]}), {st:[[0.18,0],[-0.18,0]]}], [R(arms('V'), OPEN, {chest:[-12,0,0]}), {st:[[0.18,0],[-0.18,0]]}], [R(arms('hip'), {chest:[-8,0,0]}), {st:[[0.15,0],[-0.15,0]]}], [R(arms('hip'), {chest:[-8,0,0]}), {st:[[0.15,0],[-0.15,0]]}]]), {cam:'snapZoom'});
add('kRoutineC', KP, '8카운트 루틴 C', '귀엽게: 볼 손→엉덩이→하트', seq(BT, [
  [R(arms('cheek'), OPEN, {head:[0,0,10], hips:[0,0,-5]}), {r:[0.05,0,0]}], [R(arms('cheek'), FIST, {head:[0,0,-10], hips:[0,0,5]}, SQ(0.1)), {r:[-0.05,-0.04,0]}], [R(arms('cheek'), OPEN, {head:[0,0,10], hips:[0,0,-5]}), {r:[0.05,0,0]}], [R(arms('cheek'), FIST, {head:[0,0,-10], hips:[0,0,5]}, SQ(0.1)), {r:[-0.05,-0.04,0]}],
  [R(arms('hip'), {hips:[18,0,10], spine:[-6,0,-8]}), {r:[0.05,-0.06,-0.05]}], [R(arms('hip'), {hips:[18,0,-10], spine:[-6,0,8]}), {r:[-0.05,-0.06,-0.05]}], [R(arms('hip'), {hips:[18,0,10], spine:[-6,0,-8]}), {r:[0.05,-0.06,-0.05]}], [R(arms('hip'), {hips:[18,0,-10], spine:[-6,0,8]}), {r:[-0.05,-0.06,-0.05]}],
  [R(arms('heartTop'), OPEN), {}], [R(arms('heartTop'), OPEN, {head:[0,0,10]}), {hr:[15,15]}], [R(arms('heartTop'), OPEN, {head:[0,0,-10]}), {}], [R(arms('chin'), OPEN), {hr:[15,15]}]]), {cam:'zoomPunch'});
add('kRoutineD', KP, '8카운트 루틴 D', '그루브: 셔플→슬라이드→턴', seq(BT, [
  [R(arms('fistPump'), FIST, K.heelTapL), {pl:[0.3,1], hr:[0,20]}], [R(arms('fistPump'), FIST, M(K.toeTapL)), {pl:[1,0.3]}], [R(arms('fistPump'), FIST, M(K.heelTapL)), {pl:[1,0.3], hr:[20,0]}], [R(arms('fistPump'), FIST, K.toeTapL), {pl:[0.3,1]}],
  [R(J(AL('T'), {upperArmL:[0,0,60]}), J(AR('T'), {upperArmR:[0,0,-110]}), OPEN, {hips:[0,0,8]}), {st:[[0.3,0],[0,0]], r:[0.12,-0.06,0]}], [R(arms('down'), OPEN), {st:[[0.3,0],[0.26,0]], r:[0.26,0,0]}], [R(J(AL('T'), {upperArmL:[0,0,110]}), J(AR('T'), {upperArmR:[0,0,-60]}), OPEN, {hips:[0,0,-8]}), {st:[[0.04,0],[0.26,0]], r:[0.12,-0.06,0]}], [R(arms('down'), OPEN), {}],
  [R(arms('T'), {hips:[0,90,0]}), {pl:[0,0]}], [R(arms('cross'), {hips:[0,180,0]}), {pl:[0,0]}], [R(arms('cross'), {hips:[0,270,0]}), {pl:[0,0]}], [R(AL('pointUp'), AR('hip'), POINT('L'), {hips:[0,360,0]}), {pl:[0,0]}]]), {cam:'orbit'});
add('kEnding', KP, '엔딩 포즈', '마지막 포즈로 정지', {dur:3, keys:[
  [0, R(arms('down'))], [0.4, R(arms('cross'), FIST, SQ(0.3)), {r:SQR(0.3)}], [0.8, R(AL('cheek'), AR('hip'), VSIGN('L'), {head:[0,0,-12], hips:[0,0,4]}), {r:[0.04,0,0], st:[[0.12,0],[-0.12,0]]}], [2.6, R(AL('cheek'), AR('hip'), VSIGN('L'), {head:[0,0,-12], hips:[0,0,4]}), {r:[0.04,0,0], st:[[0.12,0],[-0.12,0]]}], [3, R(arms('down'))]]}, {cam:'snapZoom'});
add('kTwerk', KP, '골반 튕기기', '앉은 자세로 골반 바운스', seq(BT/2, [
  [R(arms('hip'), SQ(0.35), {hips:[38,0,0]}), {r:SQR(0.35), st:[[0.18,0],[-0.18,0]]}], [R(arms('hip'), SQ(0.35), {hips:[22,0,0]}), {r:[0,-0.38,-0.1], st:[[0.18,0],[-0.18,0]]}]]), {cam:'orbitHalf'});
add('kRobot', KP, '로봇 춤', '각지게 끊어서', seq(BT, [
  [R({upperArmL:[0,0,90], forearmL:[0,0,90], upperArmR:[0,0,-90], forearmR:[0,0,-90]}, OPEN, {head:[0,25,0]}), {}], [R({upperArmL:[0,0,90], forearmL:[0,0,-90], upperArmR:[0,0,-90], forearmR:[0,0,90]}, OPEN, {head:[0,-25,0]}), {}], [R({upperArmL:[-90,0,0], forearmL:[-90,0,0], upperArmR:[0,0,-10], forearmR:[0,0,0]}, OPEN, {chest:[0,20,0]}), {}], [R({upperArmR:[-90,0,0], forearmR:[-90,0,0], upperArmL:[0,0,10], forearmL:[0,0,0]}, OPEN, {chest:[0,-20,0]}), {}]]), {cam:'snapZoom'});

/* ======================= 요가 ======================= */
const YG = 'yoga';
const hold = (spec, opts, dur = 6) => ({dur, keys:[[0, R(), {}], [1.2, spec, opts || {}], [dur - 1.2, spec, opts || {}], [dur, R(), {}]]});
const holdFrom = (base, bopts, spec, opts, dur = 6) => ({dur, keys:[[0, base, bopts || {}], [1.4, spec, opts || {}], [dur - 1.4, spec, opts || {}], [dur, base, bopts || {}]]});
add('mountain', YG, '산 자세', '바르게 서서 손 모으기', hold(R(arms('pray'), OPEN, {chest:[-4,0,0]}), {}, 5), {cam:'push'});
add('tree', YG, '나무 자세', '한 발로 서서 손 위로', hold(R(arms('up'), OPEN, {thighL:[-30,40,60], shinL:[130,0,0], footL:[30,0,0]}), {pl:[0,1]}), {cam:'feetToHead'});
add('warrior1', YG, '전사 자세 1', '런지에서 두 팔 위로', hold(R(arms('up'), OPEN, {thighL:[-80,0,0], shinL:[80,0,0], thighR:[25,0,0], shinR:[10,0,0], chest:[-8,0,0]}), {st:[[0,0.7],[0,-0.8]], r:[0,-0.32,0.05], hr:[0,10]}), {cam:'q34'});
add('warrior2', YG, '전사 자세 2', '옆으로 벌리고 팔 쭉', hold(R(arms('T'), OPEN, {head:[0,70,0], thighL:[-60,60,40], shinL:[80,0,0], thighR:[0,0,-30]}), {st:[[0.75,0],[-0.6,0]], r:[0.1,-0.3,0]}), {cam:'front'});
add('warrior3', YG, '전사 자세 3', '한 발로 몸을 일자로', hold(R(arms('upFwd'), OPEN, {hips:[80,0,0], spine:[0,0,0], neck:[-8,0,0], thighR:[2,0,0], thighL:[-82,0,0], footR:[40,0,0]}), {pl:[1,0], r:[0,-0.05,-0.25]}), {cam:'side'});
add('triangle', YG, '삼각 자세', '옆으로 기울여 손 내리기', hold(R(arms('T'), OPEN, {hips:[0,0,12], spine:[0,0,24], chest:[0,0,22], neck:[0,0,6], head:[0,-35,0], footR:[0,-60,0]}), {st:[[0.55,0],[-0.55,0]], r:[0,-0.1,0]}), {cam:'front'});
add('chair', YG, '의자 자세', '앉듯이 내려가 팔 위로', hold(R(arms('upFwd'), OPEN, SQ(0.75), {hips:[34,0,0], spine:[0,0,0], neck:[0,0,0], head:[0,0,0]}), {r:SQR(0.75)}), {cam:'q34'});
add('downDog', YG, '다운독', '엉덩이 높이 ㅅ자', holdFrom(R(), {},
  {hips:[115,0,0], spine:[6,0,0], neck:[16,0,0], head:[14,0,0], thighL:[-118,0,3], thighR:[-118,0,-3], shinL:[6,0,0], shinR:[6,0,0], upperArmL:[-172,0,6], upperArmR:[-172,0,-6], forearmL:[0,0,0], forearmR:[0,0,0], handL:[-60,0,0], handR:[-60,0,0], fingersL:[0,0,0], fingersR:[0,0,0], pointL:[0,0,0], pointR:[0,0,0]},
  {st:[[0.12,-0.25],[-0.12,-0.25]], hr:[12,12]}), {yaw:90, need:'mat', cam:'side'});
add('upDog', YG, '업독', '팔로 밀어 가슴 들기', holdFrom({hips:[90,0,0], footL:[70,0,0], footR:[70,0,0], upperArmL:[-150,0,22], upperArmR:[-150,0,-22], forearmL:[-140,0,0], forearmR:[-140,0,0]}, {g:'low2', pl:[0,0]},
  {hips:[80,0,0], spine:[-30,0,0], chest:[-26,0,0], neck:[-14,0,0], head:[-14,0,0], footL:[75,0,0], footR:[75,0,0], thighL:[-8,0,0], thighR:[-8,0,0], upperArmL:[-26,0,8], upperArmR:[-26,0,-8], forearmL:[0,0,0], forearmR:[0,0,0], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}), {yaw:90, need:'mat', g:'low2', cam:'side'});
add('boat', YG, '보트 자세', 'V자로 앉아 버티기', holdFrom({thighL:[-90,0,0], thighR:[-90,0,0], upperArmL:[-10,0,10], upperArmR:[-10,0,-10]}, {g:'low', pl:[0,0]},
  {hips:[-40,0,0], spine:[6,0,0], thighL:[-90,0,0], thighR:[-90,0,0], shinL:[40,0,0], shinR:[40,0,0], footL:[30,0,0], footR:[30,0,0], upperArmL:[-50,0,6], upperArmR:[-50,0,-6], forearmL:[0,0,0], forearmR:[0,0,0]}, {g:'low', pl:[0,0]}), {yaw:90, need:'mat', g:'low', cam:'side'});
add('pigeon', YG, '비둘기 자세', '앞다리 접고 뒷다리 쭉', holdFrom({thighL:[-90,0,0], thighR:[-90,0,0]}, {g:'low', pl:[0,0]},
  {hips:[10,0,0], chest:[-10,0,0], head:[-8,0,0], thighL:[-90,40,30], shinL:[110,0,0], thighR:[80,0,-4], shinR:[0,0,0], footR:[60,0,0], upperArmL:[-20,0,12], upperArmR:[-20,0,-12], forearmL:[0,0,0], forearmR:[0,0,0]}, {g:'low', pl:[0,0]}), {yaw:90, need:'mat', g:'low', cam:'q34'});
add('camel', YG, '낙타 자세', '무릎 서서 뒤로 젖히기', holdFrom({thighL:[0,0,4], thighR:[0,0,-4], shinL:[90,0,0], shinR:[90,0,0], footL:[60,0,0], footR:[60,0,0]}, {g:'low', pl:[0,0]},
  {hips:[-12,0,0], spine:[-24,0,0], chest:[-26,0,0], neck:[-20,0,0], head:[-20,0,0], thighL:[12,0,4], thighR:[12,0,-4], shinL:[90,0,0], shinR:[90,0,0], footL:[60,0,0], footR:[60,0,0], upperArmL:[60,0,14], upperArmR:[60,0,-14], forearmL:[0,0,0], forearmR:[0,0,0]}, {g:'low', pl:[0,0]}), {yaw:90, need:'mat', g:'low', cam:'side'});
add('halfMoon', YG, '반달 자세', '두 손 모아 옆으로 휘기', {dur:6, keys:[[0, R(arms('up'), OPEN)], [1.3, R(arms('up'), OPEN, {upperArmL:[0,0,175], upperArmR:[0,0,-175], spine:[0,0,14], chest:[0,0,16]}), {r:[-0.06,0,0]}], [2.7, R(arms('up'), OPEN, {upperArmL:[0,0,175], upperArmR:[0,0,-175], spine:[0,0,14], chest:[0,0,16]}), {r:[-0.06,0,0]}], [3.4, R(arms('up'), OPEN)], [4.7, R(arms('up'), OPEN, {upperArmL:[0,0,175], upperArmR:[0,0,-175], spine:[0,0,-14], chest:[0,0,-16]}), {r:[0.06,0,0]}], [6, R(arms('up'), OPEN)]]}, {cam:'front'});
add('crescent', YG, '초승달 런지', '뒷무릎 들고 팔 위로', hold(R(arms('up'), OPEN, {thighL:[-80,0,0], shinL:[80,0,0], thighR:[25,0,0], shinR:[15,0,0], chest:[-8,0,0]}), {st:[[0,0.7],[0,-0.75]], r:[0,-0.32,0], hr:[0,55]}), {cam:'q34'});
add('goddess', YG, '여신 자세', '넓게 앉아 팔 선인장', hold(R({upperArmL:[0,0,90], forearmL:[0,0,95], upperArmR:[0,0,-90], forearmR:[0,0,-95]}, OPEN, {thighL:[-60,40,40], thighR:[-60,-40,-40], shinL:[80,0,0], shinR:[80,0,0], footL:[0,40,0], footR:[0,-40,0]}), {st:[[0.42,0],[-0.42,0]], r:[0,-0.38,0]}), {cam:'front'});
add('corpse', YG, '사바사나', '누워서 쉬기', holdFrom({thighL:[-90,0,0], thighR:[-90,0,0]}, {g:'low', pl:[0,0]}, {hips:[-90,0,0], thighL:[0,0,6], thighR:[0,0,-6], footL:[30,0,0], footR:[30,0,0], upperArmL:[0,0,22], upperArmR:[0,0,-22], forearmL:[0,0,0], forearmR:[0,0,0]}, {g:'low', pl:[0,0], ey:1}, 7), {yaw:90, need:'mat', g:'low', cam:'top'});
add('happyBaby', YG, '해피 베이비', '누워서 발 잡고 흔들', seq(0.8, [
  [{hips:[-90,0,0], thighL:[-120,0,40], thighR:[-120,0,-40], shinL:[100,0,0], shinR:[100,0,0], footL:[-20,0,0], footR:[-20,0,0], upperArmL:[-70,0,6], upperArmR:[-70,0,-6], forearmL:[-10,0,0], forearmR:[-10,0,0]}, {g:'low', pl:[0,0]}],
  [{hips:[-90,0,10], thighL:[-120,0,40], thighR:[-120,0,-40], shinL:[100,0,0], shinR:[100,0,0], footL:[-20,0,0], footR:[-20,0,0], upperArmL:[-70,0,6], upperArmR:[-70,0,-6], forearmL:[-10,0,0], forearmR:[-10,0,0]}, {g:'low', pl:[0,0]}],
  [{hips:[-90,0,-10], thighL:[-120,0,40], thighR:[-120,0,-40], shinL:[100,0,0], shinR:[100,0,0], footL:[-20,0,0], footR:[-20,0,0], upperArmL:[-70,0,6], upperArmR:[-70,0,-6], forearmL:[-10,0,0], forearmR:[-10,0,0]}, {g:'low', pl:[0,0]}]]), {yaw:90, need:'mat', g:'low', cam:'q34'});
add('sunSalute', YG, '태양 경배', '선 자세→숙이기→플랭크→업독→다운독', {dur:12, yaw:90, need:'mat', keys:[
  [0, R(arms('pray'), OPEN), {g:'feet'}], [1.2, R(arms('up'), OPEN, {chest:[-10,0,0]}), {g:'feet'}], [2.6, R({hips:[85,0,0], spine:[14,0,0], upperArmL:[-100,0,8], upperArmR:[-100,0,-8]}, OPEN), {g:'feet', r:[0,-0.02,-0.22]}],
  [4.2, {hips:[76,0,0], footL:[-15,0,0], footR:[-15,0,0], toeL:[-50,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0], ...OPEN}, {g:'low2', pl:[0,0]}],
  [5.8, {hips:[80,0,0], spine:[-30,0,0], chest:[-26,0,0], neck:[-14,0,0], head:[-14,0,0], footL:[75,0,0], footR:[75,0,0], upperArmL:[-26,0,8], upperArmR:[-26,0,-8], handL:[-70,0,0], handR:[-70,0,0], ...OPEN}, {g:'low2', pl:[0,0]}],
  [7.6, {hips:[130,0,0], neck:[20,0,0], head:[20,0,0], thighL:[-130,0,0], thighR:[-130,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-170,0,4], upperArmR:[-170,0,-4], handL:[-70,0,0], handR:[-70,0,0], ...OPEN}, {g:'low2', pl:[0,0]}],
  [9.4, R({hips:[85,0,0], spine:[14,0,0], upperArmL:[-100,0,8], upperArmR:[-100,0,-8]}, OPEN), {g:'feet', r:[0,-0.02,-0.22]}], [10.8, R(arms('up'), OPEN, {chest:[-10,0,0]}), {g:'feet'}], [12, R(arms('pray'), OPEN), {g:'feet'}]]}, {cam:'side'});

/* ======================= 유산소·홈트 ======================= */
const CD = 'cardio';
add('burpee', CD, '버피', '앉고→플랭크→점프', {dur:2.8, yaw:90, need:'mat', keys:[
  [0, R(), {}], [0.5, R(SQ(1.1), {hips:[40,0,0], upperArmL:[-90,0,6], upperArmR:[-90,0,-6], forearmL:[0,0,0], forearmR:[0,0,0]}), {r:SQR(1.1)}],
  [0.75, R(SQ(1.2), {hips:[70,0,0], upperArmL:[-70,0,6], upperArmR:[-70,0,-6], forearmL:[0,0,0], forearmR:[0,0,0], handL:[-70,0,0], handR:[-70,0,0]}), {g:'low2', pl:[0,0]}],
  [1.0, {hips:[76,0,0], footL:[-15,0,0], footR:[-15,0,0], toeL:[-50,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}],
  [1.25, R(SQ(1.2), {hips:[70,0,0], upperArmL:[-70,0,6], upperArmR:[-70,0,-6], forearmL:[0,0,0], forearmR:[0,0,0], handL:[-70,0,0], handR:[-70,0,0]}), {g:'low2', pl:[0,0]}],
  [1.5, R(SQ(1.1), {hips:[40,0,0], upperArmL:[-90,0,6], upperArmR:[-90,0,-6], forearmL:[0,0,0], forearmR:[0,0,0]}), {r:SQR(1.1)}], [2.0, R(arms('up'), JUMP, OPEN), {pl:[0,0], r:[0,0.3,0]}], [2.8, R(), {}]]}, {cam:'q34'});
add('climber', CD, '마운틴 클라이머', '플랭크에서 무릎 당기기', seq(0.3, [
  [{hips:[76,0,0], thighL:[-75,0,0], shinL:[90,0,0], footR:[-15,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}],
  [{hips:[76,0,0], thighR:[-75,0,0], shinR:[90,0,0], footL:[-15,0,0], toeL:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}]]), {yaw:90, need:'mat', g:'low2', cam:'side'});
add('highKnees', CD, '하이니즈', '무릎 높이 들며 뛰기', seq(0.22, [
  [R(AL('swingB'), AR('swingF'), FIST, K.kneeHighL), {pl:[0,1], hr:[0,25], r:[0,0.05,0]}], [R(AL('swingF'), AR('swingB'), FIST, M(K.kneeHighL)), {pl:[1,0], hr:[25,0], r:[0,0.05,0]}]]), {cam:'bounce'});
add('buttKicks', CD, '엉덩이 차기', '뒤꿈치로 엉덩이 톡톡', seq(0.22, [
  [R(arms('fistPump'), FIST, K.buttKickL), {pl:[0,1], hr:[0,25], r:[0,0.04,0]}], [R(arms('fistPump'), FIST, M(K.buttKickL)), {pl:[1,0], hr:[25,0], r:[0,0.04,0]}]]), {cam:'side'});
add('jumpSquat', CD, '점프 스쿼트', '앉았다가 폭발 점프', seq(0.45, [
  [R(SQ(0.9), arms('fwd')), {r:SQR(0.9)}], [R(JUMP, arms('back'), OPEN), {pl:[0,0], r:[0,0.3,0]}], [R(SQ(0.5), arms('fwdLow')), {r:SQR(0.5)}]]), {cam:'heroLow'});
add('skater', CD, '스케이터 점프', '옆으로 스케이트 타듯', seq(0.5, [
  [R(J(AL('swingB'), {upperArmL:[30,0,30]}), J(AR('swingF'), {upperArmR:[-50,0,30]}), {hips:[30,0,0], spine:[10,0,0], chest:[0,-20,0]}, M(K.buttKickL)), {st:[[0.5,0],[0,0]], pl:[1,0], r:[0.4,-0.25,-0.05]}],
  [R(J(AR('swingB'), {upperArmR:[30,0,-30]}), J(AL('swingF'), {upperArmL:[-50,0,-30]}), {hips:[30,0,0], spine:[10,0,0], chest:[0,20,0]}, K.buttKickL), {st:[[0,0],[-0.5,0]], pl:[0,1], r:[-0.4,-0.25,-0.05]}]]), {cam:'dolly'});
add('jumpRope', CD, '줄넘기', '손목 돌리며 콩콩', seq(0.25, [
  [R({upperArmL:[0,0,22], upperArmR:[0,0,-22], forearmL:[-60,0,0], forearmR:[-60,0,0]}, FIST, JUMP), {pl:[0,0], r:[0,0.08,0]}], [R({upperArmL:[0,0,22], upperArmR:[0,0,-22], forearmL:[-60,0,0], forearmR:[-60,0,0], handL:[30,0,0], handR:[30,0,0]}, FIST), {hr:[25,25]}]]), {cam:'bounce'});
add('boxing', CD, '잽 원투', '가드 올리고 원투', seq(0.25, [
  [R(arms('guard'), FIST, {chest:[0,10,0]}), {st:[[0.12,0.15],[-0.12,-0.15]], r:[0,-0.08,0]}], [R(AL('jab'), AR('guard'), FIST, {chest:[0,-20,0], head:[0,10,0]}), {st:[[0.12,0.15],[-0.12,-0.15]], r:[0,-0.08,0.04]}], [R(arms('guard'), FIST, {chest:[0,10,0]}), {st:[[0.12,0.15],[-0.12,-0.15]], r:[0,-0.08,0]}], [R(AL('guard'), AR('jab'), FIST, {chest:[0,30,0], hips:[0,15,0], head:[0,-10,0]}), {st:[[0.12,0.15],[-0.12,-0.15]], r:[0,-0.08,0.06], hr:[0,25]}]]), {cam:'q34'});
add('uppercut', CD, '어퍼컷', '아래에서 위로 쭉', seq(0.35, [
  [R(arms('guard'), FIST), {st:[[0.12,0.12],[-0.12,-0.12]], r:[0,-0.08,0]}], [R(AL('guard'), J(AR('guard'), {upperArmR:[-60,0,-10], forearmR:[-100,0,0]}), FIST, {chest:[0,25,0], hips:[0,15,0]}, SQ(0.2)), {st:[[0.12,0.12],[-0.12,-0.12]], r:[0,-0.2,0]}], [R(AL('guard'), J(AR('guard'), {upperArmR:[-120,0,-10], forearmR:[-80,0,0]}), FIST, {chest:[-10,30,0], hips:[0,20,0]}), {st:[[0.12,0.12],[-0.12,-0.12]], r:[0,0,0], hr:[0,30]}]]), {cam:'heroLow'});
add('frontKick', CD, '앞차기', '무릎 접었다 차기', seq(0.4, [
  [R(arms('guard'), FIST), {}], [R(arms('guard'), FIST, K.kneeHighL), {pl:[0,1]}], [R(arms('guard'), FIST, K.kickL, {hips:[-8,0,0]}), {pl:[0,1]}], [R(arms('guard'), FIST, K.kneeUpL), {pl:[0,1]}]]), {cam:'side'});
add('starJump', CD, '스타 점프', '공중에서 별 모양', seq(0.4, [
  [R(SQ(0.5), arms('fwdLow')), {r:SQR(0.5)}], [R(arms('V'), OPEN, {thighL:[0,0,30], thighR:[0,0,-30], footL:[30,0,0], footR:[30,0,0]}), {pl:[0,0], r:[0,0.3,0]}], [R(SQ(0.3)), {r:SQR(0.3)}]]), {cam:'heroLow'});
add('tuckJump', CD, '터크 점프', '무릎 가슴까지 당기기', seq(0.45, [
  [R(SQ(0.6), arms('back')), {r:SQR(0.6)}], [R(arms('fwd'), FIST, {thighL:[-110,0,6], thighR:[-110,0,-6], shinL:[120,0,0], shinR:[120,0,0], footL:[30,0,0], footR:[30,0,0]}), {pl:[0,0], r:[0,0.35,0]}], [R(SQ(0.4)), {r:SQR(0.4)}]]), {cam:'heroLow'});
add('standCrunch', CD, '서서 무릎-팔꿈치', '반대쪽 팔꿈치로 무릎 터치', seq(0.4, [
  [R(arms('behindHead'), {chest:[10,-25,0], spine:[10,-10,0]}, K.kneeHighL), {pl:[0,1]}], [R(arms('behindHead')), {}], [R(arms('behindHead'), {chest:[10,25,0], spine:[10,10,0]}, M(K.kneeHighL)), {pl:[1,0]}], [R(arms('behindHead')), {}]]), {cam:'q34'});
add('sideLegRaise', CD, '옆으로 다리 들기', '서서 다리 옆으로', seq(0.5, [
  [R(arms('hip'), K.sideLegL, {hips:[0,0,-8]}), {pl:[0,1]}], [R(arms('hip')), {}], [R(arms('hip'), M(K.sideLegL), {hips:[0,0,8]}), {pl:[1,0]}], [R(arms('hip')), {}]]), {cam:'front'});
add('squatPulse', CD, '스쿼트 펄스', '앉은 채로 작게 들썩', seq(0.3, [
  [R(SQ(0.8), arms('fwd'), OPEN), {r:SQR(0.8)}], [R(SQ(0.65), arms('fwd'), OPEN), {r:SQR(0.65)}]]), {cam:'side'});
add('plankJack', CD, '플랭크 잭', '플랭크에서 발 벌렸다 모으기', seq(0.4, [
  [{hips:[76,0,0], footL:[-15,0,0], footR:[-15,0,0], toeL:[-50,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}],
  [{hips:[76,0,0], thighL:[0,0,18], thighR:[0,0,-18], footL:[-15,0,0], footR:[-15,0,0], toeL:[-50,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}]]), {yaw:90, need:'mat', g:'low2', cam:'top'});
add('marchFast', CD, '빠른 행진', '팔 크게 흔들며 걷기', seq(0.3, [
  [R(AL('swingB'), AR('swingF'), {upperArmR:[-60,0,-8], forearmR:[-70,0,0]}, FIST, K.kneeUpL), {pl:[0,1]}], [R(AL('swingF'), AR('swingB'), {upperArmL:[-60,0,8], forearmL:[-70,0,0]}, FIST, M(K.kneeUpL)), {pl:[1,0]}]]), {cam:'dolly'});
add('shadowBox', CD, '쉐도우 복싱', '스텝 밟으며 잽잽', seq(0.2, [
  [R(arms('guard'), FIST), {hr:[20,20], r:[0,-0.02,0]}], [R(AL('jab'), AR('guard'), FIST, {chest:[0,-15,0]}), {}], [R(arms('guard'), FIST), {hr:[20,20], r:[0,-0.02,0]}], [R(AL('jab'), AR('guard'), FIST, {chest:[0,-15,0]}), {}], [R(AL('guard'), AR('jab'), FIST, {chest:[0,25,0]}), {hr:[0,25]}], [R(arms('guard'), FIST), {}]]), {cam:'shake'});

/* ======================= 기본·일상 ======================= */
const DY = 'basic';
add('walk', DY, '걷기', '제자리에서 자연스럽게 걷기', seq(0.5, [
  [R(AL('swingB'), AR('swingF'), {hips:[0,-5,0], chest:[0,6,0]}, {thighL:[-25,0,0], shinL:[10,0,0], thighR:[15,0,0], shinR:[25,0,0], footR:[10,0,0]}), {pl:[1,0.4], st:[[0,0.18],[0,-0.18]], r:[0,-0.03,0]}],
  [R(AL('swingF'), AR('swingB'), {hips:[0,5,0], chest:[0,-6,0]}, {thighR:[-25,0,0], shinR:[10,0,0], thighL:[15,0,0], shinL:[25,0,0], footL:[10,0,0]}), {pl:[0.4,1], st:[[0,-0.18],[0,0.18]], r:[0,-0.03,0]}]]), {cam:'dolly'});
add('run', DY, '달리기', '제자리 뛰기', seq(0.3, [
  [R(J(AL('swingB'), {forearmL:[-90,0,0]}), J(AR('swingF'), {upperArmR:[-50,0,-8], forearmR:[-90,0,0]}), FIST, {spine:[10,0,0]}, K.kneeUpL, {thighR:[20,0,0], shinR:[40,0,0]}), {pl:[0,0.5], r:[0,0.05,0]}],
  [R(J(AR('swingB'), {forearmR:[-90,0,0]}), J(AL('swingF'), {upperArmL:[-50,0,8], forearmL:[-90,0,0]}), FIST, {spine:[10,0,0]}, M(K.kneeUpL), {thighL:[20,0,0], shinL:[40,0,0]}), {pl:[0.5,0], r:[0,0.05,0]}]]), {cam:'dolly'});
add('sitChair', DY, '의자에 앉기', '앉았다 일어나기', (() => {
  const FS = [[0.06,0.52],[-0.06,0.52]];
  const st = R(), sit = R({hips:[6,0,0], thighL:[-88,0,5], thighR:[-88,0,-5], shinL:[88,0,0], shinR:[88,0,0], upperArmL:[-26,0,8], upperArmR:[-26,0,-8], forearmL:[-50,0,0], forearmR:[-50,0,0]});
  const lean = J(sit, {hips:[34,0,0], neck:[-14,0,0]});
  return {dur:5, need:'chair', keys:[[0, st, {st:FS, r:[0,0,0.5]}], [0.9, lean, {st:FS, r:[0,-0.25,0.28]}], [1.5, sit, {g:'seat', st:FS}], [3.2, sit, {g:'seat', st:FS}], [3.8, lean, {st:FS, r:[0,-0.25,0.28]}], [4.6, st, {st:FS, r:[0,0,0.5]}], [5, st, {st:FS, r:[0,0,0.5]}]]};
})(), {cam:'q34'});
add('sitTalk', DY, '앉아서 수다', '의자에 앉아 손짓', seq(0.4, [
  [R({thighL:[-90,0,4], thighR:[-90,0,-4], shinL:[90,0,0], shinR:[90,0,0], upperArmL:[-30,0,22], forearmL:[-70,0,-20], jaw:[20,0,0], head:[-4,0,0]}, OPEN), {g:'seat', st:[[0.06,0.52],[-0.06,0.52]]}],
  [R({thighL:[-90,0,4], thighR:[-90,0,-4], shinL:[90,0,0], shinR:[90,0,0], upperArmL:[-40,0,30], forearmL:[-90,0,-20], jaw:[4,0,0], head:[2,0,4]}, OPEN), {g:'seat', st:[[0.06,0.52],[-0.06,0.52]]}]]), {need:'chair', cam:'faceClose'});
add('nod', DY, '끄덕끄덕', '응응 맞아', seq(0.3, [[R({head:[18,0,0], neck:[6,0,0]}), {}], [R({head:[-4,0,0]}), {}]]), {cam:'faceClose'});
add('shakeHead', DY, '도리도리', '아니야 아니야', seq(0.25, [[R({head:[0,28,0]}), {}], [R({head:[0,-28,0]}), {}]]), {cam:'faceClose'});
add('pointAt', DY, '저기 봐!', '손가락으로 가리키기', hold(R(AL('point'), POINT('L'), {head:[0,15,0], chest:[0,10,0], jaw:[14,0,0]}), {}, 3), {cam:'q34'});
add('phone', DY, '전화 받기', '여보세요~', seq(0.6, [[R(AL('cheek'), {head:[0,0,10], jaw:[14,0,0]}), {}], [R(AL('cheek'), {head:[4,0,6], jaw:[2,0,0], hips:[0,0,3]}), {}]]), {cam:'faceClose'});
add('drink', DY, '물 마시기', '꿀꺽꿀꺽', {dur:3, keys:[[0, R()], [0.8, R(J(AL('cheek'), {upperArmL:[-50,0,-10], forearmL:[-130,0,0]}), {head:[-30,0,0], neck:[-10,0,0]})], [2.2, R(J(AL('cheek'), {upperArmL:[-60,0,-10], forearmL:[-135,0,0]}), {head:[-34,0,0], neck:[-12,0,0]})], [3, R()]]}, {cam:'faceClose'});
add('lookAround', DY, '두리번두리번', '여기저기 살피기', seq(0.7, [[R({head:[0,40,0], neck:[0,15,0], chest:[0,10,0]}), {}], [R({head:[-6,0,0]}), {}], [R({head:[0,-40,0], neck:[0,-15,0], chest:[0,-10,0]}), {}], [R({head:[10,0,0]}), {}]]), {cam:'orbitHalf'});
add('shrug', DY, '몰라~ 으쓱', '어깨 으쓱 손바닥 위로', hold(R({shoulderL:[0,0,16], shoulderR:[0,0,-16], upperArmL:[0,0,30], upperArmR:[0,0,-30], forearmL:[-80,0,30], forearmR:[-80,0,-30], head:[0,0,12]}, OPEN), {}, 2.4), {cam:'faceClose'});
add('facepalm', DY, '이마 짚기', '아이고…', hold(R(J(AL('cheek'), {upperArmL:[-50,0,-6], forearmL:[-140,0,0], handL:[-30,0,0]}), {head:[22,0,0], neck:[10,0,0], chest:[8,0,0]}, OPEN), {}, 3), {cam:'faceClose'});
add('armsCross', DY, '팔짱 끼기', '팔짱 끼고 기다리기', seq(0.6, [[R(arms('cross'), {head:[0,0,6]}, K.heelTapL), {pl:[0.6,1]}], [R(arms('cross'), {head:[0,0,-6]}), {}]]), {cam:'q34'});
add('highFive', DY, '하이파이브', '손바닥 짝!', {dur:2, keys:[[0, R()], [0.5, R(J(AL('wave'), {upperArmL:[-60,0,100], forearmL:[0,0,-10]}), OPEN, {chest:[0,20,0]}), {hr:[10,10]}], [0.75, R(J(AL('wave'), {upperArmL:[-80,0,100], forearmL:[0,0,-10]}), OPEN, {chest:[0,25,0], jaw:[20,0,0]}), {r:[0,0,0.05]}], [1.3, R(J(AL('wave'), {upperArmL:[-60,0,100], forearmL:[0,0,-10]}), OPEN, {chest:[0,20,0]})], [2, R()]]}, {cam:'zoomPunch'});
add('byeBye', DY, '안녕 바이바이', '손 흔들며 뒷걸음', seq(0.35, [[R(AL('wave'), OPEN, {head:[0,0,-8]}), {}], [R(J(AL('wave'), {forearmL:[0,0,40]}), OPEN, {head:[0,0,8]}), {}]]), {cam:'pull'});
add('scratchHead', DY, '머리 긁적', '헤헤 쑥스러워', seq(0.3, [[R(AL('head'), {head:[6,0,10]}, OPEN), {}], [R(J(AL('head'), {forearmL:[0,0,128]}), {head:[6,0,14], jaw:[12,0,0]}, OPEN), {}]]), {cam:'faceClose'});
add('checkWatch', DY, '시계 보기', '늦었다!', {dur:2.4, keys:[[0, R()], [0.6, R(J(AL('chest'), {upperArmL:[-50,0,-10], forearmL:[-100,0,0]}), {head:[25,15,0]})], [1.6, R(J(AL('chest'), {upperArmL:[-50,0,-10], forearmL:[-100,0,0]}), {head:[-6,0,0], jaw:[24,0,0]}, JUMP), {pl:[0,0], r:[0,0.1,0]}], [2.4, R()]]}, {cam:'snapZoom'});
add('clapCheer', DY, '박수갈채', '크게 박수 치기', seq(0.22, [[R(J(AL('fwd'), {upperArmL:[-100,0,-20], forearmL:[-40,0,0]}), J(AR('fwd'), {upperArmR:[-100,0,20], forearmR:[-40,0,0]}), OPEN, {jaw:[16,0,0]}), {}], [R(J(AL('fwd'), {upperArmL:[-100,0,10], forearmL:[-50,0,0]}), J(AR('fwd'), {upperArmR:[-100,0,-10], forearmR:[-50,0,0]}), OPEN, {jaw:[6,0,0]}), {}]]), {cam:'bounce'});
add('stretchUp', DY, '기지개', '두 팔 위로 쭉', {dur:3, keys:[[0, R()], [1, R(arms('up'), OPEN, {chest:[-10,0,0], head:[-10,0,0]}), {hr:[20,20], r:[0,0.05,0], ey:0.9}], [2, R(arms('up'), OPEN, {chest:[-12,0,0], head:[-10,0,0]}), {hr:[20,20], r:[0,0.05,0], ey:0.9}], [3, R()]]}, {cam:'heroLow'});
add('idleSway', DY, '살랑살랑 대기', '가볍게 흔들며 기다리기', seq(1.0, [[R({hips:[0,0,3], head:[0,0,-4]}, M(K.heelTapL)), {pl:[1,0.6], r:[0.03,0,0]}], [R({hips:[0,0,-3], head:[0,0,4]}, K.heelTapL), {pl:[0.6,1], r:[-0.03,0,0]}]]), {cam:'orbitHalf'});

/* ======================= 스트레칭 보강 ======================= */
const ST = 'stretch';
add('chestOpen', ST, '가슴 열기', '뒤로 깍지 끼고 가슴 펴기', hold(R({upperArmL:[40,0,-10], upperArmR:[40,0,10], forearmL:[0,0,0], forearmR:[0,0,0], chest:[-14,0,0], head:[-14,0,0]}, OPEN), {}, 5), {cam:'side'});
add('wristStretch', ST, '손목 늘리기', '손바닥 당기기', seq(1.2, [[R(J(AL('fwd'), {handL:[60,0,0]}), J(AR('chest'), {upperArmR:[-70,0,30], forearmR:[-60,0,0]}), OPEN), {}], [R(J(AL('fwd'), {handL:[-60,0,0]}), J(AR('chest'), {upperArmR:[-70,0,30], forearmR:[-60,0,0]}), OPEN), {}]]), {cam:'faceClose'});
add('hamStand', ST, '한 다리 앞 숙이기', '앞꿈치 들고 상체 숙이기', holdFrom(R(), {st:[[0,0.35],[0,0]]}, R({hips:[60,0,0], spine:[10,0,0], upperArmL:[-90,0,6], upperArmR:[-90,0,-6], thighR:[-60,0,0], shinR:[60,0,0], footL:[-30,0,0]}), {st:[[0,0.35],[0,0]], r:[0,-0.15,-0.2]}, 5), {cam:'side'});
add('sideLungeStretch', ST, '옆 런지 스트레칭', '옆으로 앉아 다리 안쪽 늘리기', {dur:6, keys:[[0, R(), {st:[[0.5,0],[-0.5,0]]}], [1.3, R(arms('chest'), {hips:[20,0,0], thighL:[-80,30,40], shinL:[90,0,0], thighR:[0,0,-30]}), {st:[[0.5,0],[-0.5,0]], r:[0.3,-0.35,-0.05]}], [2.6, R(arms('chest'), {hips:[20,0,0], thighL:[-80,30,40], shinL:[90,0,0], thighR:[0,0,-30]}), {st:[[0.5,0],[-0.5,0]], r:[0.3,-0.35,-0.05]}], [3.2, R(), {st:[[0.5,0],[-0.5,0]]}], [4.5, R(arms('chest'), {hips:[20,0,0], thighR:[-80,-30,-40], shinR:[90,0,0], thighL:[0,0,30]}), {st:[[0.5,0],[-0.5,0]], r:[-0.3,-0.35,-0.05]}], [6, R(), {st:[[0.5,0],[-0.5,0]]}]]}, {cam:'front'});
add('hipCircle', ST, '골반 돌리기', '허리에 손 얹고 원 그리기', seq(0.6, [[R(arms('hip'), {hips:[0,0,10]}), {r:[0.07,0,0]}], [R(arms('hip'), {hips:[-10,0,0]}), {r:[0,0,0.07]}], [R(arms('hip'), {hips:[0,0,-10]}), {r:[-0.07,0,0]}], [R(arms('hip'), {hips:[10,0,0]}), {r:[0,0,-0.07]}]]), {cam:'orbitHalf'});
add('armCircle', ST, '팔 돌리기', '두 팔 크게 원', seq(0.4, [[R(arms('T'), OPEN), {}], [R(arms('up'), OPEN), {}], [R({upperArmL:[-90,0,120], upperArmR:[-90,0,-120]}, OPEN), {}], [R(arms('fwdLow'), OPEN), {}]]), {cam:'front'});
add('toeTouch', ST, '발끝 터치', '숙여서 발끝 콕', seq(0.8, [[R(arms('up'), OPEN), {}], [R({hips:[85,0,0], spine:[14,0,0], upperArmL:[-104,0,6], upperArmR:[-104,0,-6]}, OPEN), {r:[0,-0.02,-0.22]}]]), {cam:'side'});
add('kneeHug', ST, '무릎 끌어안기', '한 무릎 가슴으로', {dur:6, keys:[[0, R(), {}], [1.2, R(arms('chest'), {thighL:[-120,0,0], shinL:[130,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-80,0,0], forearmR:[-80,0,0]}), {pl:[0,1]}], [2.6, R(arms('chest'), {thighL:[-120,0,0], shinL:[130,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-80,0,0], forearmR:[-80,0,0]}), {pl:[0,1]}], [3.2, R(), {}], [4.4, R(arms('chest'), {thighR:[-120,0,0], shinR:[130,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-80,0,0], forearmR:[-80,0,0]}), {pl:[1,0]}], [5.6, R(arms('chest'), {thighR:[-120,0,0], shinR:[130,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-80,0,0], forearmR:[-80,0,0]}), {pl:[1,0]}], [6, R(), {}]]}, {cam:'q34'});
add('neckRoll', ST, '목 돌리기', '천천히 크게 원', seq(0.8, [[R({head:[20,0,0]}), {}], [R({head:[0,0,25], neck:[0,0,8]}), {}], [R({head:[-20,0,0]}), {}], [R({head:[0,0,-25], neck:[0,0,-8]}), {}]]), {cam:'faceClose'});
add('ankleRoll', ST, '발목 돌리기', '발끝으로 원 그리기', seq(0.4, [[R(arms('hip'), {thighL:[-15,0,0], footL:[30,0,0]}), {pl:[0,1]}], [R(arms('hip'), {thighL:[-15,0,0], footL:[0,0,30]}), {pl:[0,1]}], [R(arms('hip'), {thighL:[-15,0,0], footL:[-30,0,0]}), {pl:[0,1]}], [R(arms('hip'), {thighL:[-15,0,0], footL:[0,0,-30]}), {pl:[0,1]}]]), {cam:'feetToHead'});
add('reachUp', ST, '위로 쭉 뻗기', '번갈아 하늘 잡기', seq(0.6, [[R(AL('up'), AR('down'), OPEN, {spine:[0,0,-6]}), {hr:[0,20]}], [R(AR('up'), AL('down'), OPEN, {spine:[0,0,6]}), {hr:[20,0]}]]), {cam:'heroLow'});

/* ======================= 필라테스 보강 ======================= */
const PL = 'pilates', SUP = {hips:[-90,0,0]}, LW = {g:'low', pl:[0,0]};
add('scissors', PL, '시저스', '누워서 다리 가위질', seq(0.5, [
  [J(SUP, {spine:[16,0,0], chest:[16,0,0], neck:[14,0,0], thighL:[-95,0,0], thighR:[-30,0,0], footL:[30,0,0], footR:[30,0,0], upperArmL:[-80,0,-6], upperArmR:[-80,0,6], forearmL:[-40,0,0], forearmR:[-40,0,0]}), LW],
  [J(SUP, {spine:[16,0,0], chest:[16,0,0], neck:[14,0,0], thighR:[-95,0,0], thighL:[-30,0,0], footL:[30,0,0], footR:[30,0,0], upperArmL:[-80,0,-6], upperArmR:[-80,0,6], forearmL:[-40,0,0], forearmR:[-40,0,0]}), LW]]), {yaw:90, need:'mat', g:'low', cam:'side'});
add('doubleLeg', PL, '더블 레그 스트레치', '웅크렸다 쫙 펴기', seq(0.8, [
  [J(SUP, {spine:[18,0,0], chest:[18,0,0], neck:[14,0,0], thighL:[-110,0,0], thighR:[-110,0,0], shinL:[110,0,0], shinR:[110,0,0], upperArmL:[-60,0,-6], upperArmR:[-60,0,6], forearmL:[-60,0,0], forearmR:[-60,0,0]}), LW],
  [J(SUP, {spine:[16,0,0], chest:[16,0,0], neck:[14,0,0], thighL:[-40,0,0], thighR:[-40,0,0], footL:[30,0,0], footR:[30,0,0], upperArmL:[-170,0,6], upperArmR:[-170,0,-6]}), LW]]), {yaw:90, need:'mat', g:'low', cam:'side'});
add('crissCross', PL, '크리스크로스', '누워서 비틀며 팔꿈치-무릎', seq(0.6, [
  [J(SUP, {spine:[18,0,0], chest:[18,-25,0], neck:[10,0,0], thighL:[-105,0,0], shinL:[110,0,0], thighR:[-40,0,0], upperArmL:[0,40,125], forearmL:[0,0,138], upperArmR:[0,-40,-125], forearmR:[0,0,-138]}), LW],
  [J(SUP, {spine:[18,0,0], chest:[18,25,0], neck:[10,0,0], thighR:[-105,0,0], shinR:[110,0,0], thighL:[-40,0,0], upperArmL:[0,40,125], forearmL:[0,0,138], upperArmR:[0,-40,-125], forearmR:[0,0,-138]}), LW]]), {yaw:90, need:'mat', g:'low', cam:'q34'});
add('swimming', PL, '스위밍', '엎드려 팔다리 파닥', seq(0.3, [
  [{hips:[90,0,0], spine:[-14,0,0], chest:[-10,0,0], head:[-10,0,0], thighL:[12,0,0], thighR:[-4,0,0], footL:[60,0,0], footR:[60,0,0], upperArmL:[-165,0,10], upperArmR:[-185,0,-10]}, {g:'low2', pl:[0,0]}],
  [{hips:[90,0,0], spine:[-14,0,0], chest:[-10,0,0], head:[-10,0,0], thighR:[12,0,0], thighL:[-4,0,0], footL:[60,0,0], footR:[60,0,0], upperArmR:[-165,0,-10], upperArmL:[-185,0,10]}, {g:'low2', pl:[0,0]}]]), {yaw:90, need:'mat', g:'low2', cam:'side'});
add('sidePlank', PL, '사이드 플랭크', '옆으로 한 팔 버티기', hold({hips:[0,0,-70], spine:[0,0,-4], upperArmR:[0,0,-70], forearmR:[0,0,0], upperArmL:[0,0,170], forearmL:[0,0,0], thighL:[0,0,0], footL:[0,0,0], ...OPEN}, {g:'low', pl:[0,0]}, 5), {yaw:0, need:'mat', g:'low', cam:'front'});
add('clam', PL, '클램쉘', '옆으로 누워 무릎 열기', seq(0.8, [
  [{hips:[-90,90,0], thighL:[-45,0,0], thighR:[-45,0,0], shinL:[90,0,0], shinR:[90,0,0], upperArmL:[-170,0,0], forearmL:[-120,0,0], upperArmR:[-30,0,0], head:[0,0,10]}, LW],
  [{hips:[-90,90,0], thighL:[-45,0,0], thighR:[-45,40,0], shinL:[90,0,0], shinR:[90,0,0], upperArmL:[-170,0,0], forearmL:[-120,0,0], upperArmR:[-30,0,0], head:[0,0,10]}, LW]]), {yaw:-90, need:'mat', g:'low', cam:'q34'});
add('rollingBall', PL, '롤링 라이크 어 볼', '공처럼 굴렀다 돌아오기', {dur:2.4, yaw:90, need:'mat', g:'low', keys:[
  [0, {hips:[-30,0,0], spine:[20,0,0], chest:[20,0,0], neck:[20,0,0], thighL:[-130,0,0], thighR:[-130,0,0], shinL:[140,0,0], shinR:[140,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-90,0,0], forearmR:[-90,0,0]}, LW],
  [1.0, {hips:[-110,0,0], spine:[24,0,0], chest:[24,0,0], neck:[24,0,0], thighL:[-130,0,0], thighR:[-130,0,0], shinL:[140,0,0], shinR:[140,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-90,0,0], forearmR:[-90,0,0]}, LW],
  [2.4, {hips:[-30,0,0], spine:[20,0,0], chest:[20,0,0], neck:[20,0,0], thighL:[-130,0,0], thighR:[-130,0,0], shinL:[140,0,0], shinR:[140,0,0], upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-90,0,0], forearmR:[-90,0,0]}, LW]]}, {cam:'side'});
add('mermaid', PL, '머메이드', '앉아서 옆으로 길게', {dur:6, yaw:0, need:'mat', g:'low', keys:[
  [0, {thighL:[0,-45,76], thighR:[0,45,-76], shinL:[-140,0,0], shinR:[-140,0,0], footL:[0,0,-30], footR:[0,0,30], upperArmL:[0,0,20], upperArmR:[0,0,-20]}, LW],
  [1.5, {spine:[0,0,16], chest:[0,0,18], thighL:[0,-45,76], thighR:[0,45,-76], shinL:[-140,0,0], shinR:[-140,0,0], footL:[0,0,-30], footR:[0,0,30], upperArmL:[0,0,170], upperArmR:[0,0,-30], head:[0,0,10]}, LW],
  [3, {thighL:[0,-45,76], thighR:[0,45,-76], shinL:[-140,0,0], shinR:[-140,0,0], footL:[0,0,-30], footR:[0,0,30], upperArmL:[0,0,20], upperArmR:[0,0,-20]}, LW],
  [4.5, {spine:[0,0,-16], chest:[0,0,-18], thighL:[0,-45,76], thighR:[0,45,-76], shinL:[-140,0,0], shinR:[-140,0,0], footL:[0,0,-30], footR:[0,0,30], upperArmR:[0,0,-170], upperArmL:[0,0,30], head:[0,0,-10]}, LW],
  [6, {thighL:[0,-45,76], thighR:[0,45,-76], shinL:[-140,0,0], shinR:[-140,0,0], footL:[0,0,-30], footR:[0,0,30], upperArmL:[0,0,20], upperArmR:[0,0,-20]}, LW]]}, {cam:'front'});
add('legPull', PL, '레그 풀 프론트', '플랭크에서 다리 들기', seq(0.7, [
  [{hips:[76,0,0], footL:[-15,0,0], footR:[-15,0,0], toeL:[-50,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}],
  [{hips:[76,0,0], thighL:[25,0,0], footL:[40,0,0], footR:[-15,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}],
  [{hips:[76,0,0], footL:[-15,0,0], footR:[-15,0,0], toeL:[-50,0,0], toeR:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}],
  [{hips:[76,0,0], thighR:[25,0,0], footR:[40,0,0], footL:[-15,0,0], toeL:[-50,0,0], upperArmL:[-76,0,4], upperArmR:[-76,0,-4], handL:[-70,0,0], handR:[-70,0,0]}, {g:'low2', pl:[0,0]}]]), {yaw:90, need:'mat', g:'low2', cam:'side'});
add('shoulderBridgeKick', PL, '브릿지 킥', '브릿지에서 한 다리 차올리기', {dur:4, yaw:90, need:'mat', g:'back', anchor:true, keys:[
  [0, J(SUP, {thighL:[-50,0,0], thighR:[-50,0,0], shinL:[100,0,0], shinR:[100,0,0], footL:[-35,0,0], footR:[-35,0,0], upperArmL:[0,0,14], upperArmR:[0,0,-14]}), {g:'back', pl:[1,1]}],
  [1, J(SUP, {hips:[-122,0,0], neck:[30,0,0], head:[16,0,0], thighL:[-6,0,0], thighR:[-6,0,0], shinL:[120,0,0], shinR:[120,0,0], footL:[-60,0,0], footR:[-60,0,0], upperArmL:[22,0,14], upperArmR:[22,0,-14]}), {g:'back', pl:[1,1]}],
  [2, J(SUP, {hips:[-122,0,0], neck:[30,0,0], head:[16,0,0], thighL:[-90,0,0], shinL:[0,0,0], footL:[30,0,0], thighR:[-6,0,0], shinR:[120,0,0], footR:[-60,0,0], upperArmL:[22,0,14], upperArmR:[22,0,-14]}), {g:'back', pl:[0,1]}],
  [3, J(SUP, {hips:[-122,0,0], neck:[30,0,0], head:[16,0,0], thighL:[-6,0,0], thighR:[-6,0,0], shinL:[120,0,0], shinR:[120,0,0], footL:[-60,0,0], footR:[-60,0,0], upperArmL:[22,0,14], upperArmR:[22,0,-14]}), {g:'back', pl:[1,1]}],
  [4, J(SUP, {thighL:[-50,0,0], thighR:[-50,0,0], shinL:[100,0,0], shinR:[100,0,0], footL:[-35,0,0], footR:[-35,0,0], upperArmL:[0,0,14], upperArmR:[0,0,-14]}), {g:'back', pl:[1,1]}]]}, {cam:'side'});

/* ======================= 웨이트 보강 ======================= */
/* ---- 리포머 (기구 필라테스): 캐리지 위에 누워서. rf=발바에 발 대기, cx=캐리지가 머리 쪽으로 밀린 정도 ---- */
const RF = {g:'back', pl:[0,0]};
const rfArmsSide = {upperArmL:[0,0,12], upperArmR:[0,0,-12], forearmL:[0,0,0], forearmR:[0,0,0]};
const rfLegs = (th, sh, ft) => ({thighL:[th,0,5], thighR:[th,0,-5], shinL:[sh,0,0], shinR:[sh,0,0], footL:[ft,0,0], footR:[ft,0,0]});
{
  const bent = J(SUP, OPEN, rfArmsSide, rfLegs(-64, 98, 38)), str = J(SUP, OPEN, rfArmsSide, rfLegs(-20, 22, 42));
  add('rfFootwork', PL, '리포머 풋워크', '발끝으로 발바 밀기', {dur:4, yaw:90, need:'reformer', g:'back', keys:[
    [0, bent, J(RF, {rf:1})], [1.5, str, J(RF, {rf:1})], [2.0, str, J(RF, {rf:1})], [3.5, bent, J(RF, {rf:1})], [4, bent, J(RF, {rf:1})]]}, {cam:'side'});
  const bentH = J(SUP, OPEN, rfArmsSide, rfLegs(-64, 98, -18)), strH = J(SUP, OPEN, rfArmsSide, rfLegs(-20, 22, -12));
  add('rfHeels', PL, '리포머 힐 프레스', '뒤꿈치로 발바 밀기', {dur:4, yaw:90, need:'reformer', g:'back', rfFoot:'heel', keys:[
    [0, bentH, J(RF, {rf:1})], [1.5, strH, J(RF, {rf:1})], [2.0, strH, J(RF, {rf:1})], [3.5, bentH, J(RF, {rf:1})], [4, bentH, J(RF, {rf:1})]]}, {cam:'side'});
  const tt = rfLegs(-90, 90, 25);
  const up = J(SUP, OPEN, tt, {upperArmL:[-88,0,6], upperArmR:[-88,0,-6], forearmL:[0,0,0], forearmR:[0,0,0]});
  const dn = J(SUP, OPEN, tt, {upperArmL:[-10,0,10], upperArmR:[-10,0,-10], forearmL:[0,0,0], forearmR:[0,0,0]});
  add('rfArmPull', PL, '리포머 암 풀', '줄 잡고 팔 내리기', {dur:4, yaw:90, need:'reformer', g:'back', strap:true, keys:[
    [0, up, J(RF, {cx:0})], [1.5, dn, J(RF, {cx:0.3})], [2.0, dn, J(RF, {cx:0.3})], [3.5, up, J(RF, {cx:0})], [4, up, J(RF, {cx:0})]]}, {cam:'q34'});
  const hu = a => J(SUP, OPEN, {spine:[14,0,0], chest:[14,0,0], neck:[12,0,0], head:[8,0,0]}, rfLegs(-50, 8, 35), {upperArmL:[-a,0,8], upperArmR:[-a,0,-8], forearmL:[0,0,0], forearmR:[0,0,0]});
  const hk = []; for (let i = 0; i <= 8; i++) hk.push([0.3 * i, hu(i % 2 ? 30 : 16), J(RF, {cx:0.3})]);
  add('rfHundred', PL, '리포머 헌드레드', '줄 잡고 팔 펌핑', {dur:2.4, yaw:90, need:'reformer', g:'back', strap:true, keys:hk}, {cam:'q34'});
  const lo = J(SUP, OPEN, rfArmsSide, {thighL:[-64,0,5], shinL:[98,0,0], footL:[38,0,0], thighR:[-90,0,-5], shinR:[90,0,0], footR:[25,0,0]});
  const lo2 = J(SUP, OPEN, rfArmsSide, {thighL:[-20,0,5], shinL:[22,0,0], footL:[42,0,0], thighR:[-90,0,-5], shinR:[90,0,0], footR:[25,0,0]});
  add('rfSingleLeg', PL, '리포머 한 다리 풋워크', '한 발로 발바 밀기', {dur:4, yaw:90, need:'reformer', g:'back', rfLeg:'L', keys:[
    [0, lo, J(RF, {rf:1})], [1.5, lo2, J(RF, {rf:1})], [2.0, lo2, J(RF, {rf:1})], [3.5, lo, J(RF, {rf:1})], [4, lo, J(RF, {rf:1})]]}, {cam:'side'});
}
const WT = 'weights';
const GH = J(REST, FIST);
add('kickback', WT, '트라이셉스 킥백', '숙여서 팔 뒤로 펴기', seq(0.9, [
  [J(GH, {hips:[50,0,0], neck:[-20,0,0], thighL:[-60,0,7], thighR:[-60,0,-7], shinL:[30,0,0], shinR:[30,0,0], upperArmL:[-20,0,8], upperArmR:[-20,0,-8], forearmL:[-90,0,0], forearmR:[-90,0,0]}), {r:[0,-0.14,-0.15]}],
  [J(GH, {hips:[50,0,0], neck:[-20,0,0], thighL:[-60,0,7], thighR:[-60,0,-7], shinL:[30,0,0], shinR:[30,0,0], upperArmL:[-20,0,8], upperArmR:[-20,0,-8], forearmL:[0,0,0], forearmR:[0,0,0]}), {r:[0,-0.14,-0.15]}]]), {equip:'db2', cam:'side'});
add('overheadExt', WT, '오버헤드 익스텐션', '머리 뒤로 덤벨 내렸다 올리기', seq(1.0, [
  [J(GH, {upperArmL:[-170,0,-8], upperArmR:[-170,0,8], forearmL:[0,0,0], forearmR:[0,0,0]}), {}],
  [J(GH, {upperArmL:[-165,0,-8], upperArmR:[-165,0,8], forearmL:[-130,0,0], forearmR:[-130,0,0]}), {}]]), {equip:'kb', cam:'side'});
add('frontRaise', WT, '프론트 레이즈', '덤벨 앞으로 들기', seq(1.0, [[J(GH, {upperArmL:[-6,0,8], upperArmR:[-6,0,-8], forearmL:[-8,0,0], forearmR:[-8,0,0]}), {}], [J(GH, {upperArmL:[-88,0,8], upperArmR:[-88,0,-8], forearmL:[-6,0,0], forearmR:[-6,0,0]}), {}]]), {equip:'db2', cam:'side'});
add('uprightRow', WT, '업라이트 로우', '바벨 턱까지 당기기', seq(1.0, [[J(GH, {upperArmL:[-10,0,10], upperArmR:[-10,0,-10], forearmL:[0,0,0], forearmR:[0,0,0]}), {}], [J(GH, {upperArmL:[0,0,85], upperArmR:[0,0,-85], forearmL:[0,0,-110], forearmR:[0,0,110]}), {}]]), {equip:'bb', cam:'front'});
add('shrugDb', WT, '덤벨 슈러그', '어깨 으쓱 들어 올리기', seq(0.7, [[J(GH, {upperArmL:[0,0,8], upperArmR:[0,0,-8], forearmL:[0,0,0], forearmR:[0,0,0]}), {}], [J(GH, {shoulderL:[0,0,18], shoulderR:[0,0,-18], upperArmL:[0,0,-6], upperArmR:[0,0,6], forearmL:[0,0,0], forearmR:[0,0,0]}), {}]]), {equip:'db2', cam:'front'});
add('arnoldPress', WT, '아놀드 프레스', '돌리면서 위로 밀기', seq(1.0, [[J(GH, {upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-140,0,0], forearmR:[-140,0,0]}), {}], [J(GH, {upperArmL:[-8,0,82], upperArmR:[-8,0,-82], forearmL:[0,0,96], forearmR:[0,0,-96]}), {}], [J(GH, {upperArmL:[-4,0,166], upperArmR:[-4,0,-166], forearmL:[0,0,8], forearmR:[0,0,-8]}), {}], [J(GH, {upperArmL:[-8,0,82], upperArmR:[-8,0,-82], forearmL:[0,0,96], forearmR:[0,0,-96]}), {}]]), {equip:'db2', cam:'front'});
add('reverseFly', WT, '리버스 플라이', '숙여서 팔 옆으로 벌리기', seq(1.0, [
  [J(GH, {hips:[62,0,0], neck:[-22,0,0], thighL:[-70,0,8], thighR:[-70,0,-8], shinL:[30,0,0], shinR:[30,0,0], upperArmL:[-62,0,6], upperArmR:[-62,0,-6], forearmL:[-10,0,0], forearmR:[-10,0,0]}), {r:[0,-0.15,-0.18]}],
  [J(GH, {hips:[62,0,0], neck:[-22,0,0], thighL:[-70,0,8], thighR:[-70,0,-8], shinL:[30,0,0], shinR:[30,0,0], upperArmL:[-62,0,80], upperArmR:[-62,0,-80], forearmL:[-10,0,0], forearmR:[-10,0,0]}), {r:[0,-0.15,-0.18]}]]), {equip:'db2', cam:'top'});
add('sumoDeadlift', WT, '스모 데드리프트', '다리 넓게 바벨 들기', seq(1.3, [
  [J(GH, {hips:[45,0,0], neck:[-24,0,0], thighL:[-70,30,30], thighR:[-70,-30,-30], shinL:[70,0,0], shinR:[70,0,0], upperArmL:[-45,0,4], upperArmR:[-45,0,-4], forearmL:[0,0,0], forearmR:[0,0,0]}), {st:[[0.38,0],[-0.38,0]], r:[0,-0.38,-0.1]}],
  [J(GH, {upperArmL:[0,0,4], upperArmR:[0,0,-4], forearmL:[0,0,0], forearmR:[0,0,0], thighL:[0,30,10], thighR:[0,-30,-10]}), {st:[[0.38,0],[-0.38,0]]}]]), {equip:'bb', cam:'q34'});
add('goodMorning', WT, '굿모닝', '바벨 메고 엉덩이 접기', seq(1.3, [
  [J(GH, {upperArmL:[0,55,46], upperArmR:[0,-55,-46], forearmL:[0,0,128], forearmR:[0,0,-128]}), {}],
  [J(GH, {hips:[80,0,0], neck:[-25,0,0], thighL:[-80,0,0], thighR:[-80,0,0], shinL:[14,0,0], shinR:[14,0,0], upperArmL:[0,55,46], upperArmR:[0,-55,-46], forearmL:[0,0,128], forearmR:[0,0,-128]}), {r:[0,-0.08,-0.26]}]]), {equip:'bb', cam:'side'});
add('dbFly', WT, '덤벨 플라이', '벤치에 누워 팔 벌리기', {dur:2.6, yaw:90, need:'bench', g:'back', anchor:true, equip:'db2', keys:[
  [0, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-88,0,10], upperArmR:[-88,0,-10], forearmL:[-15,0,0], forearmR:[-15,0,0]}), {g:'back', pl:[1,1]}],
  [1.1, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-10,0,80], upperArmR:[-10,0,-80], forearmL:[-15,0,0], forearmR:[-15,0,0]}), {g:'back', pl:[1,1]}],
  [1.4, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-10,0,80], upperArmR:[-10,0,-80], forearmL:[-15,0,0], forearmR:[-15,0,0]}), {g:'back', pl:[1,1]}],
  [2.6, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-88,0,10], upperArmR:[-88,0,-10], forearmL:[-15,0,0], forearmR:[-15,0,0]}), {g:'back', pl:[1,1]}]]}, {cam:'top'});
add('dbBench', WT, '덤벨 벤치 프레스', '벤치에 누워 덤벨 밀기', {dur:2.6, yaw:90, need:'bench', g:'back', anchor:true, equip:'db2', keys:[
  [0, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-88,0,8], upperArmR:[-88,0,-8], forearmL:[0,0,0], forearmR:[0,0,0]}), {g:'back', pl:[1,1]}],
  [1.1, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[20,0,72], upperArmR:[20,0,-72], forearmL:[0,0,102], forearmR:[0,0,-102]}), {g:'back', pl:[1,1]}],
  [1.4, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[20,0,72], upperArmR:[20,0,-72], forearmL:[0,0,102], forearmR:[0,0,-102]}), {g:'back', pl:[1,1]}],
  [2.6, J(GH, SUP, {thighL:[18,0,16], thighR:[18,0,-16], shinL:[88,0,0], shinR:[88,0,0], footL:[-30,0,0], footR:[-30,0,0], upperArmL:[-88,0,8], upperArmR:[-88,0,-8], forearmL:[0,0,0], forearmR:[0,0,0]}), {g:'back', pl:[1,1]}]]}, {cam:'q34'});
add('farmerWalk', WT, '파머스 워크', '덤벨 들고 제자리 걷기', seq(0.5, [
  [J(GH, {upperArmL:[0,0,10], upperArmR:[0,0,-10], forearmL:[0,0,0], forearmR:[0,0,0], chest:[-6,0,0]}, K.kneeUpL), {pl:[0,1]}],
  [J(GH, {upperArmL:[0,0,10], upperArmR:[0,0,-10], forearmL:[0,0,0], forearmR:[0,0,0], chest:[-6,0,0]}, M(K.kneeUpL)), {pl:[1,0]}]]), {equip:'db2', cam:'dolly'});
add('gobletLunge', WT, '고블릿 런지', '케틀벨 안고 런지', {dur:3.2, equip:'kb', keys:(() => {
  const hold_ = {upperArmL:[-22,0,-12], upperArmR:[-22,0,12], forearmL:[-138,0,0], forearmR:[-138,0,0]};
  const dnS = J(GH, hold_, {thighL:[-90,0,0], shinL:[92,0,0], thighR:[20,0,0], shinR:[100,0,0]});
  return [[0, J(GH, hold_), {st:[[0,0.8],[0,0]]}], [1.2, dnS, {st:[[0,0.8],[0,0]], r:[0,-0.44,0.38], hr:[0,55]}], [1.8, dnS, {st:[[0,0.8],[0,0]], r:[0,-0.44,0.38], hr:[0,55]}], [3.2, J(GH, hold_), {st:[[0,0.8],[0,0]], r:[0,-0.05,0.36], hr:[0,25]}]]; })()}, {cam:'q34'});
add('kbHalo', WT, '케틀벨 헤일로', '머리 주위로 돌리기', seq(0.6, [
  [J(GH, {upperArmL:[-60,0,-10], upperArmR:[-60,0,10], forearmL:[-130,0,0], forearmR:[-130,0,0]}), {}],
  [J(GH, {upperArmL:[0,0,120], upperArmR:[-40,0,-30], forearmL:[0,0,110], forearmR:[-140,0,0]}), {}],
  [J(GH, {upperArmL:[0,40,130], upperArmR:[0,-40,-130], forearmL:[0,0,130], forearmR:[0,0,-130]}), {}],
  [J(GH, {upperArmR:[0,0,-120], upperArmL:[-40,0,30], forearmR:[0,0,-110], forearmL:[-140,0,0]}), {}]]), {equip:'kb', cam:'orbitHalf'});


/* ---- 손이 몸에 닿는 자세 자동 표시: 팔 모양이 '허리에 손·볼·턱·머리 뒤·귀·머리 위' 등과 같으면
   그 키에 손 닿기 목표(ht)와 세기(hw)를 붙임 → 캐릭터 몸집이 달라도 손이 실제로 닿음 ---- */
const TOUCH = {hip:['hipL','hipR'], cheek:['cheekL','cheekR'], chin:['chin','chin'], head:['headSideL','headSideR'], behindHead:['nape','nape'],
  ear:['earL','earR'], heartTop:['headTop','headTop'], chest:['chestL','chestR']};
const near = (a, b) => a && b && Math.abs(a[0]-b[0]) <= 14 && Math.abs(a[1]-b[1]) <= 14 && Math.abs(a[2]-b[2]) <= 14;
function touchOf(spec, side){
  for (const k in TOUCH){
    const t = side === 'L' ? A[k] : M(A[k]);
    if (near(spec['upperArm'+side], t['upperArm'+side]) && near(spec['forearm'+side], t['forearm'+side])) return TOUCH[k][side === 'L' ? 0 : 1];
  }
  return null;
}
for (const pr of LIST){
  if (pr.noTouch || pr.equip) continue;
  for (const k of pr.keys){
    const spec = k[1]; if (!spec) continue;
    const o = k[2] = k[2] || {};
    if (o.ht) continue;
    const tl = touchOf(spec, 'L'), tr = touchOf(spec, 'R');
    if (tl || tr){ o.ht = [tl, tr]; o.hw = [tl ? 1 : 0, tr ? 1 : 0]; }
  }
}
// 서서 숙이는 동작: 손끝이 발끝에 닿게
for (const id of ['forwardFold','toeTouch']){ const pr = LIST.find(p => p.id === id); if (!pr) continue;
  for (const k of pr.keys){ const sp = k[1]; if (sp && sp.hips && sp.hips[0] >= 70){ const o = k[2] = k[2] || {}; o.ht = ['toeL','toeR']; o.hw = [1,1]; } } }
SP.cats = {basic:'기본·일상', cute:'귀여운', body:'몸매 뽐내기', kpop:'K팝 댄스', stretch:'스트레칭', yoga:'요가', pilates:'필라테스', weights:'웨이트', cardio:'유산소·홈트'};
})();

