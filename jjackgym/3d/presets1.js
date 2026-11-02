/* ===== 동작 모음 =====
   각 관절 회전은 부모 기준 오일러 XYZ(도).
   규칙: X- = 앞으로 굽힘(엉덩이·어깨 굽힘, 팔꿈치 굽힘), 정강이 X+ = 무릎 굽힘, 발 X+ = 발끝 내림, 발가락 X- = 발가락 들기
         왼쪽 Z+ = 바깥으로 벌림(오른쪽은 Z-), 허리·가슴 X+ = 앞으로 숙임, Z+ = 오른쪽으로 기울임, Y+ = 왼쪽으로 비틀기
   키 옵션: r 골반 이동(골반 높이 배율), pl [왼,오] 발 고정, st [[dx,dz],[dx,dz]] 발 위치, hr [왼,오] 뒤꿈치 들기(도), g 접지
   g: feet(발로 섬) · low(가장 낮은 곳이 바닥) · back(등이 받침면) · seat(엉덩이가 받침면) */
(function(){
'use strict';
const REST = {upperArmL:[0,0,9],upperArmR:[0,0,-9],forearmL:[-12,0,0],forearmR:[-12,0,0],fingersL:[-15,0,0],fingersR:[-15,0,0],pointL:[-12,0,0],pointR:[-12,0,0]};
const R = o => Object.assign({}, REST, o || {});
const GRIP = {fingersL:[-80,0,0],fingersR:[-80,0,0],pointL:[-80,0,0],pointR:[-80,0,0],thumbL:[-50,0,0],thumbR:[-50,0,0]};
const G = o => Object.assign({}, REST, GRIP, o || {});
// 왼쪽 ↔ 오른쪽 거울
function M(spec){
  const o = {};
  for (const k in spec){
    const v = spec[k]; let n = k;
    if (/L$/.test(k)) n = k.slice(0,-1)+'R'; else if (/R$/.test(k)) n = k.slice(0,-1)+'L';
    o[n] = Array.isArray(v) && v.length === 3 && typeof v[0] === 'number' ? [v[0], -v[1], -v[2]] : v;
  }
  return o;
}
const mo = (o) => o;   // 키 옵션
const L_ = (a,b) => Object.assign({}, a, b);
const P = [];
function add(p){ P.push(p); }

/* ===================== 기본 ===================== */
add({id:'idle', cat:'basic', name:'숨쉬기', note:'기본 대기', dur:2.4, keys:[
  [0, R()], [1.2, R({chest:[-4,0,0],neck:[4,0,0],shoulderL:[0,0,4],shoulderR:[0,0,-4]}), {r:[0,0.01,0]}], [2.4, R()]]});
add({id:'wave', cat:'basic', name:'인사', note:'오른손 흔들기', dur:1.8, keys:(() => {
  const a = fz => R({upperArmR:[-10,0,-148],forearmR:[0,0,fz],handR:[0,0,fz*0.4],head:[0,0,-7],neck:[0,0,-3],chest:[0,-6,0],jaw:[14,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,a(-12)],[0.45,a(-58)],[0.9,a(-12)],[1.35,a(-58)],[1.8,a(-12)]]; })()});
add({id:'clap', cat:'basic', name:'박수', note:'가슴 앞에서 짝짝', dur:1.2, keys:(() => {
  const a = (z,j) => R({upperArmL:[-62,0,-z],upperArmR:[-62,0,z],forearmL:[-62,-30,0],forearmR:[-62,30,0],handL:[0,0,-20],handR:[0,0,20],jaw:[j,0,0],head:[-4,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,a(4,4)],[0.3,a(24,18)],[0.6,a(4,4)],[0.9,a(24,18)],[1.2,a(4,4)]]; })()});
add({id:'march', cat:'basic', name:'제자리 걷기', note:'무릎 번갈아 들기', dur:1.2, keys:(() => {
  const up = k => R({thighL:[-55,0,0],shinL:[75,0,0],footL:[15,0,0],upperArmL:[22,0,8],upperArmR:[-32,0,-8],forearmL:[-25,0,0],forearmR:[-45,0,0],chest:[0,-6,0]});
  const base = R({forearmL:[-25,0,0],forearmR:[-25,0,0]});
  return [[0,base,{pl:[1,1]}],[0.3,up(),{pl:[0,1]}],[0.6,base,{pl:[1,1]}],[0.9,M(up()),{pl:[1,0]}],[1.2,base,{pl:[1,1]}]]; })()});
add({id:'jack', cat:'basic', name:'팔벌려뛰기', note:'점프하며 팔다리 벌리기', dur:1.0, keys:(() => {
  const down = R({upperArmL:[0,0,12],upperArmR:[0,0,-12]});
  const mid = R({upperArmL:[0,0,95],upperArmR:[0,0,-95],forearmL:[0,0,10],forearmR:[0,0,-10],thighL:[0,0,10],thighR:[0,0,-10],footL:[25,0,0],footR:[25,0,0]});
  const wide = R({upperArmL:[0,0,168],upperArmR:[0,0,-168],forearmL:[0,0,8],forearmR:[0,0,-8],thighL:[0,0,14],thighR:[0,0,-14]});
  return [[0,down,{pl:[1,1]}],[0.18,mid,{pl:[0,0],r:[0,0.12,0]}],[0.36,wide,{pl:[1,1],st:[[0.32,0],[-0.32,0]],r:[0,-0.04,0]}],[0.5,wide,{pl:[1,1],st:[[0.32,0],[-0.32,0]],r:[0,-0.02,0]}],[0.68,mid,{pl:[0,0],r:[0,0.12,0],st:[[0.16,0],[-0.16,0]]}],[0.86,down,{pl:[1,1],r:[0,-0.03,0]}],[1.0,down,{pl:[1,1]}]]; })()});
add({id:'hooray', cat:'basic', name:'만세', note:'두 팔 번쩍', dur:1.6, keys:(() => {
  const up = R({upperArmL:[0,0,165],upperArmR:[0,0,-165],forearmL:[0,0,6],forearmR:[0,0,-6],chest:[-8,0,0],head:[-12,0,0],jaw:[22,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,R()],[0.4,up,{r:[0,0.04,0],hr:[15,15]}],[0.8,up,{r:[0,0.02,0]}],[1.2,up,{r:[0,0.04,0],hr:[15,15]}],[1.6,R()]]; })()});
add({id:'talk', cat:'basic', name:'수다', note:'입 움직이며 손짓', dur:1.6, keys:(() => {
  const m = (j,h,f) => R({jaw:[j,0,0],head:[h,0,0],forearmL:[f,0,-20],forearmR:[-12,0,0],upperArmL:[-30,0,22],fingersL:[0,0,0],pointL:[0,0,0]});
  return [[0,m(0,0,-60)],[0.18,m(24,-4,-75)],[0.36,m(4,2,-60)],[0.56,m(26,-6,-90)],[0.76,m(2,3,-55)],[0.96,m(22,-3,-80)],[1.18,m(3,4,-62)],[1.38,m(18,-2,-70)],[1.6,m(0,0,-60)]]; })()});
add({id:'thumbs', cat:'basic', name:'엄지척', note:'오른손 엄지 들기', dur:1.6, keys:(() => {
  const a = R({upperArmR:[-35,0,-20],forearmR:[-95,-60,0],handR:[0,0,-10],fingersR:[-95,0,0],pointR:[-95,0,0],thumbR:[30,0,0],head:[0,0,-8],jaw:[10,0,0]});
  return [[0,R()],[0.5,a],[1.1,a],[1.6,R()]]; })()});

/* ===================== 스트레칭 ===================== */
add({id:'neck', cat:'stretch', name:'목 옆 늘리기', note:'고개 좌우로 천천히', dur:5, keys:(() => {
  const s = k => R({neck:[0,0,14*k],head:[0,0,24*k]});
  return [[0,R()],[1.2,s(1)],[2.2,s(1)],[3.2,s(-1)],[4.2,s(-1)],[5,R()]]; })()});
add({id:'shrug', cat:'stretch', name:'어깨 돌리기', note:'으쓱 → 뒤로 → 아래로', dur:2.4, keys:(() => {
  const s = (z,y) => R({shoulderL:[0,y,z],shoulderR:[0,-y,-z]});
  return [[0,s(0,0)],[0.6,s(16,-6)],[1.2,s(8,14)],[1.8,s(-4,4)],[2.4,s(0,0)]]; })()});
add({id:'crossArm', cat:'stretch', name:'팔 가로 당기기', note:'어깨 뒤쪽 늘리기', dur:6, keys:(() => {
  const r = R({upperArmR:[0,-24,88],forearmR:[0,0,4],upperArmL:[-58,0,-28],forearmL:[-95,0,0],handL:[0,0,-20],chest:[0,8,0],head:[0,-10,0],fingersL:[-40,0,0]});
  const hR = {ht:['elbowR',null], hw:[1,0]}, hL = {ht:[null,'elbowL'], hw:[0,1]};
  return [[0,R()],[1,r,hR],[2.6,r,hR],[3.2,R()],[4.2,M(r),hL],[5.4,M(r),hL],[6,R()]]; })()});
add({id:'triceps', cat:'stretch', name:'삼두 늘리기', note:'팔을 머리 뒤로 접기', dur:6, keys:(() => {
  const r = R({upperArmR:[-168,0,-8],forearmR:[-145,0,0],handR:[20,0,0],upperArmL:[-150,0,35],forearmL:[-80,0,0],chest:[0,0,6],head:[10,0,-6]});
  const oR = {ht:['elbowR','nape'], hw:[1,1]}, oL = {ht:['nape','elbowL'], hw:[1,1]};
  return [[0,R()],[1,r,oR],[2.6,r,oR],[3.2,R()],[4.2,M(r),oL],[5.4,M(r),oL],[6,R()]]; })()});
add({id:'sideBend', cat:'stretch', name:'옆구리 늘리기', note:'만세 후 옆으로', dur:4.4, keys:(() => {
  const up = R({upperArmL:[0,0,170],upperArmR:[0,0,-170],forearmL:[0,0,4],forearmR:[0,0,-4],chest:[-6,0,0],head:[-8,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,R()],[1.1,up],[1.6,up],[2.4,L_(up,{spine:[0,0,12],chest:[0,0,16],upperArmR:[0,0,-150],head:[0,0,8]})],[3.0,up],[3.7,L_(up,{spine:[0,0,-12],chest:[0,0,-16],upperArmL:[0,0,150],head:[0,0,-8]})],[4.4,R()]]; })()});
add({id:'twist', cat:'stretch', name:'허리 돌리기', note:'팔 들고 좌우 비틀기', dur:3.2, keys:(() => {
  const s = k => R({spine:[0,18*k,0],chest:[0,22*k,0],head:[0,10*k,0],upperArmL:[-80,0,-10],upperArmR:[-80,0,10],forearmL:[-80,-40,0],forearmR:[-80,40,0]});
  return [[0,s(0)],[0.8,s(1)],[1.6,s(0)],[2.4,s(-1)],[3.2,s(0)]]; })()});
add({id:'forwardFold', cat:'stretch', name:'앞으로 숙이기', note:'서서 다리 뒤 늘리기', dur:5, keys:(() => {
  const f = R({hips:[78,0,0],spine:[16,0,0],chest:[10,0,0],neck:[8,0,0],head:[6,0,0],upperArmL:[-104,0,6],upperArmR:[-104,0,-6],forearmL:[-4,0,0],forearmR:[-4,0,0]});
  return [[0,R()],[1.6,f,{r:[0,-0.02,-0.22]}],[3.4,f,{r:[0,-0.02,-0.22]}],[5,R()]]; })()});
add({id:'quad', cat:'stretch', name:'허벅지 앞 늘리기', note:'한 발로 서서 발 잡기', dur:6, keys:(() => {
  const r = R({thighR:[8,0,0],shinR:[150,0,0],footR:[45,0,0],upperArmR:[38,0,-14],forearmR:[-22,0,0],handR:[20,0,0],upperArmL:[0,0,58],forearmL:[0,0,12],fingersR:[-70,0,0],fingersL:[0,0,0],pointL:[0,0,0]});
  const qR = {pl:[1,0], ht:[null,'ankleR'], hw:[0,1]}, qL = {pl:[0,1], ht:['ankleL',null], hw:[1,0]};
  return [[0,R(),{pl:[1,1]}],[1,r,qR],[2.6,r,qR],[3.1,R(),{pl:[1,1]}],[4.1,M(r),qL],[5.6,M(r),qL],[6,R(),{pl:[1,1]}]]; })()});
add({id:'lungeStretch', cat:'stretch', name:'런지 스트레칭', note:'엉덩이 앞쪽 늘리기', dur:6, keys:(() => {
  const r = R({thighL:[-70,0,0],shinL:[70,0,0],thighR:[25,0,0],shinR:[85,0,0],upperArmL:[0,0,168],upperArmR:[0,0,-168],chest:[-10,0,0],head:[-6,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  const o = {st:[[0,0.62],[0,-0.62]],hr:[0,60],r:[0,-0.48,0.02]};
  return [[0,R(),{st:[[0,0.62],[0,-0.62]],r:[0,-0.1,0]}],[1.4,r,o],[3.6,L_(r,{chest:[-16,0,0]}),o],[4.8,r,o],[6,R(),{st:[[0,0.62],[0,-0.62]],r:[0,-0.1,0]}]]; })()});
add({id:'calfStretch', cat:'stretch', name:'종아리 늘리기', note:'한 발 뒤로 뻗기', dur:5, keys:(() => {
  const r = R({hips:[10,0,0],thighL:[-30,0,0],shinL:[30,0,0],upperArmL:[-75,0,-4],upperArmR:[-75,0,4],forearmL:[-10,0,0],forearmR:[-10,0,0]});
  const o = {st:[[0,0.38],[0,-0.48]],r:[0,-0.12,0.05]};
  return [[0,R(),o],[1.2,r,o],[3.8,r,o],[5,R(),o]]; })()});
add({id:'catCow', cat:'stretch', name:'고양이-소', note:'네발 자세 등 말기·펴기', dur:4, yaw:90, need:'mat', g:'low2', keys:(() => {
  const base = {hips:[90,0,0],thighL:[-90,0,0],thighR:[-90,0,0],shinL:[90,0,0],shinR:[90,0,0],footL:[70,0,0],footR:[70,0,0],
    upperArmL:[-90,0,4],upperArmR:[-90,0,-4],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const cat = L_(base,{spine:[14,0,0],chest:[16,0,0],neck:[10,0,0],head:[22,0,0],upperArmL:[-120,0,4],upperArmR:[-120,0,-4]});
  const cow = L_(base,{spine:[-14,0,0],chest:[-12,0,0],neck:[-18,0,0],head:[-20,0,0],upperArmL:[-64,0,4],upperArmR:[-64,0,-4]});
  return [[0,base,{g:'low2',pl:[0,0]}],[1,cat,{g:'low2',pl:[0,0]}],[2,base,{g:'low2',pl:[0,0]}],[3,cow,{g:'low2',pl:[0,0]}],[4,base,{g:'low2',pl:[0,0]}]]; })()});
add({id:'childPose', cat:'stretch', name:'아기 자세', note:'무릎 꿇고 엎드려 쉬기', dur:5, yaw:90, need:'mat', g:'low2', keys:(() => {
  // 무릎을 끝까지 접으면 짧은 다리 살이 찌그러져서 135~140도만 접음 (엉덩이는 발뒤꿈치 살짝 위)
  const kneel = {hips:[8,0,0],thighL:[-58,0,4],thighR:[-58,0,-4],shinL:[140,0,0],shinR:[140,0,0],footL:[100,0,0],footR:[100,0,0],upperArmL:[-10,0,6],upperArmR:[-10,0,-6]};
  const child = {hips:[112,0,0],spine:[8,0,0],chest:[6,0,0],neck:[10,0,0],head:[10,0,0],thighL:[-160,0,6],thighR:[-160,0,-6],shinL:[135,0,0],shinR:[135,0,0],footL:[100,0,0],footR:[100,0,0],
    // 팔은 몸 옆으로 내려 발 쪽으로 (쉬는 아기 자세) — 큰 머리 때문에 팔을 앞으로 뻗으면 머리 위로 지나가고 터무니없이 길어져야 해서
    upperArmL:[-48,0,10],upperArmR:[-48,0,-10],forearmL:[0,-70,0],forearmR:[0,70,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  return [[0,kneel,{g:'low2',pl:[0,0]}],[1.6,child,{g:'low2',pl:[0,0]}],[3.6,L_(child,{spine:[12,0,0]}),{g:'low2',pl:[0,0]}],[5,kneel,{g:'low2',pl:[0,0]}]]; })()});
add({id:'cobra', cat:'stretch', name:'코브라', note:'엎드려 상체 들기', dur:5, yaw:90, need:'mat', g:'low2', keys:(() => {
  const flat = {hips:[90,0,0],footL:[70,0,0],footR:[70,0,0],head:[10,0,0],upperArmL:[-150,0,22],upperArmR:[-150,0,-22],forearmL:[-140,0,0],forearmR:[-140,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const up = {hips:[90,0,0],spine:[-32,0,0],chest:[-26,0,0],neck:[-12,0,0],head:[-10,0,0],footL:[70,0,0],footR:[70,0,0],thighL:[2,0,0],thighR:[2,0,0],
    upperArmL:[-34,0,10],upperArmR:[-34,0,-10],forearmL:[-6,0,0],forearmR:[-6,0,0],handL:[-60,0,0],handR:[-60,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  return [[0,flat,{g:'low2',pl:[0,0]}],[1.6,up,{g:'low2',pl:[0,0]}],[3.4,up,{g:'low2',pl:[0,0]}],[5,flat,{g:'low2',pl:[0,0]}]]; })()});
add({id:'butterfly', cat:'stretch', name:'나비 자세', note:'앉아서 발바닥 붙이기', dur:3, yaw:0, need:'mat', g:'low', keys:(() => {
  const b = k => ({spine:[6,0,0],chest:[4,0,0],thighL:[0,-45,90-k],thighR:[0,45,-90+k],shinL:[-140,0,0],shinR:[-140,0,0],footL:[0,0,-30],footR:[0,0,30],
    upperArmL:[-40,0,-14],upperArmR:[-40,0,14],forearmL:[-30,0,0],forearmR:[-30,0,0],fingersL:[-50,0,0],fingersR:[-50,0,0]});
  return [[0,b(0),{g:'low',pl:[0,0]}],[0.75,b(14),{g:'low',pl:[0,0]}],[1.5,b(0),{g:'low',pl:[0,0]}],[2.25,b(14),{g:'low',pl:[0,0]}],[3,b(0),{g:'low',pl:[0,0]}]]; })()});
add({id:'seatedFold', cat:'stretch', name:'앉아서 앞으로 숙이기', note:'다리 뒤쪽 늘리기', dur:5, yaw:90, need:'mat', g:'low', keys:(() => {
  const sit = {thighL:[-90,0,3],thighR:[-90,0,-3],footL:[-10,0,0],footR:[-10,0,0],upperArmL:[-10,0,10],upperArmR:[-10,0,-10]};
  const fold = {hips:[48,0,0],spine:[18,0,0],chest:[12,0,0],neck:[8,0,0],thighL:[-138,0,3],thighR:[-138,0,-3],footL:[-15,0,0],footR:[-15,0,0],
    upperArmL:[-150,0,4],upperArmR:[-150,0,-4],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  return [[0,sit,{g:'low',pl:[0,0]}],[1.8,fold,{g:'low',pl:[0,0]}],[3.4,fold,{g:'low',pl:[0,0]}],[5,sit,{g:'low',pl:[0,0]}]]; })()});

/* ===================== 필라테스 (매트) ===================== */
const SUP = {hips:[-90,0,0]};                         // 바로 누움 (머리 -z, 얼굴 위)
const supArms = {upperArmL:[-8,0,8],upperArmR:[-8,0,-8],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
const LOW = {g:'low', pl:[0,0]};
const LOW2 = {g:'low2', pl:[0,0]};
add({id:'hundred', cat:'pilates', name:'헌드레드', note:'누워서 팔 펌핑', dur:1.2, yaw:90, need:'mat', g:'low', keys:(() => {
  const h = a => L_(L_(SUP,supArms),{spine:[16,0,0],chest:[16,0,0],neck:[14,0,0],head:[10,0,0],thighL:[-48,0,0],thighR:[-48,0,0],footL:[35,0,0],footR:[35,0,0],
    upperArmL:[-a,0,6],upperArmR:[-a,0,-6]});
  return [[0,h(18),LOW],[0.15,h(32),LOW],[0.3,h(18),LOW],[0.45,h(32),LOW],[0.6,h(18),LOW],[0.75,h(32),LOW],[0.9,h(18),LOW],[1.05,h(32),LOW],[1.2,h(18),LOW]]; })()});
add({id:'rollUp', cat:'pilates', name:'롤업', note:'누웠다가 둥글게 일어나기', dur:5, yaw:90, need:'mat', g:'low', keys:(() => {
  const s = (hx, sp, arm) => ({hips:[hx,0,0],spine:[sp,0,0],chest:[sp,0,0],neck:[sp*0.7,0,0],head:[sp*0.4,0,0],thighL:[-90-hx,0,0],thighR:[-90-hx,0,0],footL:[-20,0,0],footR:[-20,0,0],
    upperArmL:[arm,0,6],upperArmR:[arm,0,-6],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,s(-90,0,-170),LOW],[1.0,s(-70,22,-120),LOW],[1.8,s(-30,26,-100),LOW],[2.6,s(30,20,-150),LOW],[3.2,s(30,20,-150),LOW],[4.1,s(-60,22,-130),LOW],[5,s(-90,0,-170),LOW]]; })()});
add({id:'legCircle', cat:'pilates', name:'한 다리 원 그리기', note:'누워서 다리로 원', dur:3.2, yaw:90, need:'mat', g:'low', keys:(() => {
  const c = (x,z) => L_(L_(SUP,supArms),{thighR:[-88+x,0,z],footR:[30,0,0],footL:[20,0,0],upperArmL:[0,0,18],upperArmR:[0,0,-18]});
  return [[0,c(0,0),LOW],[0.8,c(-14,14),LOW],[1.6,c(10,0),LOW],[2.4,c(-14,-14),LOW],[3.2,c(0,0),LOW]]; })()});
add({id:'bridge', cat:'pilates', name:'브릿지', note:'누워서 엉덩이 들기', dur:4, yaw:90, need:'mat', g:'back', anchor:true, keys:(() => {
  const down = L_(L_(SUP,supArms),{thighL:[-50,0,0],thighR:[-50,0,0],shinL:[100,0,0],shinR:[100,0,0],footL:[-35,0,0],footR:[-35,0,0],upperArmL:[0,0,14],upperArmR:[0,0,-14]});
  const up = L_(down,{hips:[-122,0,0],spine:[2,0,0],chest:[8,0,0],neck:[30,0,0],head:[16,0,0],thighL:[-6,0,0],thighR:[-6,0,0],shinL:[120,0,0],shinR:[120,0,0],footL:[-60,0,0],footR:[-60,0,0],upperArmL:[22,0,14],upperArmR:[22,0,-14]});
  const o = {g:'back', pl:[1,1]};
  return [[0,down,o],[1.4,up,o],[2.6,up,o],[4,down,o]]; })()});
add({id:'swan', cat:'pilates', name:'스완', note:'엎드려 가슴 들기', dur:4, yaw:90, need:'mat', g:'low2', keys:(() => {
  const flat = {hips:[90,0,0],footL:[70,0,0],footR:[70,0,0],thighL:[0,0,6],thighR:[0,0,-6],upperArmL:[-120,0,40],upperArmR:[-120,0,-40],forearmL:[-110,0,0],forearmR:[-110,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const up = L_(flat,{spine:[-26,0,0],chest:[-24,0,0],neck:[-10,0,0],head:[-8,0,0],upperArmL:[-50,0,24],upperArmR:[-50,0,-24],forearmL:[-40,0,0],forearmR:[-40,0,0],thighL:[10,0,6],thighR:[10,0,-6]});
  return [[0,flat,LOW2],[1.5,up,LOW2],[2.5,up,LOW2],[4,flat,LOW2]]; })()});
add({id:'saw', cat:'pilates', name:'쏘우', note:'앉아서 비틀며 반대발 뻗기', dur:5, yaw:0, need:'mat', g:'low', keys:(() => {
  const sit = {thighL:[-90,0,32],thighR:[-90,0,-32],footL:[-20,0,0],footR:[-20,0,0],upperArmL:[0,0,90],upperArmR:[0,0,-90],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const tw = k => L_(sit,{spine:[0,22*k,0],chest:[0,26*k,0],head:[0,12*k,0]});
  const reach = k => L_(sit,{hips:[28,0,0],thighL:[-118,0,32],thighR:[-118,0,-32],spine:[16,22*k,0],chest:[14,28*k,0],neck:[10,0,0],head:[6,12*k,0],
    upperArmL:[k>0?-10:-90,0,k>0?80:60],upperArmR:[k>0?-90:-10,0,k>0?-60:-80]});
  return [[0,sit,LOW],[0.8,tw(1),LOW],[1.6,reach(1),LOW],[2.4,sit,LOW],[3.2,tw(-1),LOW],[4.0,reach(-1),LOW],[5,sit,LOW]]; })()});
add({id:'teaser', cat:'pilates', name:'티저', note:'V자로 균형 잡기', dur:5, yaw:90, need:'mat', g:'low', keys:(() => {
  const lie = L_(SUP,{upperArmL:[-170,0,6],upperArmR:[-170,0,-6],footL:[30,0,0],footR:[30,0,0],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  const v = {hips:[-48,0,0],spine:[8,0,0],chest:[6,0,0],neck:[4,0,0],thighL:[-88,0,0],thighR:[-88,0,0],footL:[30,0,0],footR:[30,0,0],
    upperArmL:[-82,0,4],upperArmR:[-82,0,-4],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  return [[0,lie,LOW],[1.6,v,LOW],[3.2,v,LOW],[5,lie,LOW]]; })()});
add({id:'sideKick', cat:'pilates', name:'사이드 킥', note:'옆으로 누워 다리 차기', dur:2.4, yaw:-90, need:'mat', g:'low', keys:(() => {
  const s = k => ({hips:[-90,90,0],thighL:[-22,0,0],thighR:[-22+k,0,8],footL:[25,0,0],footR:[k<0?-20:30,0,0],
    upperArmL:[-170,0,0],forearmL:[-120,0,0],upperArmR:[-70,0,-10],forearmR:[-40,0,0],fingersR:[0,0,0],pointR:[0,0,0],head:[0,0,10]});
  return [[0,s(0),LOW],[0.6,s(-55),LOW],[1.2,s(0),LOW],[1.8,s(28),LOW],[2.4,s(0),LOW]]; })()});
add({id:'spineTwist', cat:'pilates', name:'스파인 트위스트', note:'앉아서 팔 벌리고 비틀기', dur:4, yaw:90, need:'mat', g:'low', keys:(() => {
  const sit = {thighL:[-90,0,2],thighR:[-90,0,-2],footL:[-30,0,0],footR:[-30,0,0],upperArmL:[0,0,90],upperArmR:[0,0,-90],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const t = k => L_(sit,{spine:[0,22*k,0],chest:[0,30*k,0],head:[0,10*k,0]});
  return [[0,sit,LOW],[1,t(1),LOW],[2,sit,LOW],[3,t(-1),LOW],[4,sit,LOW]]; })()});
add({id:'plank', cat:'pilates', name:'플랭크', note:'손으로 버티기', dur:3, yaw:90, need:'mat', g:'low2', keys:(() => {
  const p = b => ({hips:[76+b,0,0],spine:[-b,0,0],neck:[-6,0,0],head:[-8,0,0],footL:[-15,0,0],footR:[-15,0,0],toeL:[-50,0,0],toeR:[-50,0,0],
    upperArmL:[-76,0,4],upperArmR:[-76,0,-4],forearmL:[0,0,0],forearmR:[0,0,0],handL:[-70,0,0],handR:[-70,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,p(0),LOW2],[1.5,p(3),LOW2],[3,p(0),LOW2]]; })()});
add({id:'singleLeg', cat:'pilates', name:'싱글 레그 스트레치', note:'누워서 무릎 번갈아 당기기', dur:2, yaw:90, need:'mat', g:'low', keys:(() => {
  const s = k => L_(SUP,{spine:[16,0,0],chest:[16,0,0],neck:[14,0,0],head:[10,0,0],
    thighL:[k>0?-105:-38,0,0],shinL:[k>0?115:0,0,0],thighR:[k>0?-38:-105,0,0],shinR:[k>0?0:115,0,0],footL:[30,0,0],footR:[30,0,0],
    upperArmL:[-58,0,-6],upperArmR:[-58,0,6],forearmL:[-60,0,0],forearmR:[-60,0,0],fingersL:[-30,0,0],fingersR:[-30,0,0]});
  return [[0,s(1),LOW],[0.5,s(1),LOW],[1,s(-1),LOW],[1.5,s(-1),LOW],[2,s(1),LOW]]; })()});
add({id:'deadBug', cat:'pilates', name:'데드버그', note:'누워서 팔다리 엇갈려 뻗기', dur:3.2, yaw:90, need:'mat', g:'low', keys:(() => {
  const base = L_(SUP,{upperArmL:[-90,0,4],upperArmR:[-90,0,-4],forearmL:[0,0,0],forearmR:[0,0,0],thighL:[-90,0,0],thighR:[-90,0,0],shinL:[90,0,0],shinR:[90,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  const ext = L_(base,{upperArmL:[-170,0,4],thighR:[-20,0,0],shinR:[0,0,0],footR:[25,0,0]});
  return [[0,base,LOW],[0.8,ext,LOW],[1.6,base,LOW],[2.4,M(ext),LOW],[3.2,base,LOW]]; })()});
add({id:'birdDog', cat:'pilates', name:'버드독', note:'네발로 팔다리 엇갈려 뻗기', dur:3.2, yaw:90, need:'mat', g:'low2', keys:(() => {
  const base = {hips:[90,0,0],thighL:[-90,0,0],thighR:[-90,0,0],shinL:[90,0,0],shinR:[90,0,0],footL:[70,0,0],footR:[70,0,0],head:[-6,0,0],
    upperArmL:[-90,0,4],upperArmR:[-90,0,-4],forearmL:[0,0,0],forearmR:[0,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const ext = L_(base,{upperArmR:[-178,0,-4],thighL:[0,0,0],shinL:[0,0,0],footL:[40,0,0]});
  return [[0,base,LOW2],[0.8,ext,LOW2],[1.6,base,LOW2],[2.4,M(ext),LOW2],[3.2,base,LOW2]]; })()});
add({id:'crunch', cat:'pilates', name:'크런치', note:'누워서 상체 말아 올리기', dur:2.4, yaw:90, need:'mat', g:'back', anchor:true, keys:(() => {
  const d = L_(SUP,{thighL:[-50,0,0],thighR:[-50,0,0],shinL:[100,0,0],shinR:[100,0,0],footL:[-35,0,0],footR:[-35,0,0],
    upperArmL:[-150,0,40],upperArmR:[-150,0,-40],forearmL:[-150,0,0],forearmR:[-150,0,0]});
  const u = L_(d,{spine:[22,0,0],chest:[20,0,0],neck:[12,0,0],head:[6,0,0]});
  const o = {g:'back', pl:[1,1]};
  return [[0,d,o],[0.8,u,o],[1.4,u,o],[2.4,d,o]]; })()});

/* ===================== 웨이트 ===================== */
add({id:'squat', cat:'weights', name:'스쿼트', note:'맨몸, 발바닥 고정', dur:3.2, keys:(() => {
  const down = R({hips:[30,0,0],spine:[8,0,0],chest:[4,0,0],neck:[-18,0,0],head:[-14,0,0],thighL:[-100,8,6],thighR:[-100,-8,-6],shinL:[105,0,0],shinR:[105,0,0],
    upperArmL:[-128,0,8],upperArmR:[-128,0,-8],forearmL:[-4,0,0],forearmR:[-4,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]});
  return [[0,R()],[1.2,down,{r:[0,-0.44,-0.14]}],[1.8,down,{r:[0,-0.44,-0.14]}],[3.2,R()]]; })()});
add({id:'sumo', cat:'weights', name:'와이드 스쿼트', note:'다리 넓게, 발끝 바깥', dur:3.2, keys:(() => {
  const st = {st:[[0.34,0],[-0.34,0]]};
  const top = R({thighL:[0,30,10],thighR:[0,-30,-10],footL:[0,30,0],footR:[0,-30,0],upperArmL:[-40,0,-22],upperArmR:[-40,0,22],forearmL:[-115,0,0],forearmR:[-115,0,0]});
  const dn = L_(top,{hips:[12,0,0],thighL:[-80,30,30],thighR:[-80,-30,-30],shinL:[90,0,0],shinR:[90,0,0],neck:[-6,0,0]});
  return [[0,top,st],[1.2,dn,L_(st,{r:[0,-0.36,-0.02]})],[1.8,dn,L_(st,{r:[0,-0.36,-0.02]})],[3.2,top,st]]; })()});
add({id:'gobletSquat', cat:'weights', name:'고블릿 스쿼트', note:'케틀벨 가슴에 안고', dur:3.2, equip:'kb', keys:(() => {
  const hold = {upperArmL:[-22,0,-12],upperArmR:[-22,0,12],forearmL:[-138,-20,0],forearmR:[-138,20,0],handL:[0,0,-30],handR:[0,0,30]};
  const top = G(hold);
  const dn = G(L_(hold,{hips:[22,0,0],spine:[6,0,0],neck:[-14,0,0],head:[-8,0,0],thighL:[-100,12,10],thighR:[-100,-12,-10],shinL:[108,0,0],shinR:[108,0,0],upperArmL:[-40,0,-12],upperArmR:[-40,0,12]}));
  return [[0,top],[1.2,dn,{r:[0,-0.46,-0.1]}],[1.8,dn,{r:[0,-0.46,-0.1]}],[3.2,top]]; })()});
add({id:'backSquat', cat:'weights', name:'바벨 스쿼트', note:'바벨을 등에 메고', dur:3.4, equip:'bb', keys:(() => {
  const bar = {upperArmL:[0,55,46],upperArmR:[0,-55,-46],forearmL:[0,0,128],forearmR:[0,0,-128],handL:[0,0,-20],handR:[0,0,20]};
  const top = G(L_(bar,{head:[-4,0,0]}));
  const dn = G(L_(bar,{hips:[34,0,0],spine:[8,0,0],chest:[2,0,0],neck:[-20,0,0],head:[-12,0,0],thighL:[-100,8,6],thighR:[-100,-8,-6],shinL:[100,0,0],shinR:[100,0,0]}));
  return [[0,top],[1.3,dn,{r:[0,-0.42,-0.16]}],[1.9,dn,{r:[0,-0.42,-0.16]}],[3.4,top]]; })()});
add({id:'deadlift', cat:'weights', name:'데드리프트', note:'바벨 들어 올리기', dur:3.2, equip:'bb', keys:(() => {
  const dn = G({hips:[62,0,0],spine:[6,0,0],chest:[2,0,0],neck:[-30,0,0],head:[-14,0,0],thighL:[-60,0,4],thighR:[-60,0,-4],shinL:[55,0,0],shinR:[55,0,0],
    upperArmL:[-70,0,10],upperArmR:[-70,0,-10],forearmL:[0,0,0],forearmR:[0,0,0]});
  const up = G({upperArmL:[2,0,10],upperArmR:[2,0,-10],forearmL:[0,0,0],forearmR:[0,0,0],chest:[-4,0,0]});
  return [[0,dn,{r:[0,-0.34,-0.2]}],[1.2,up],[1.8,up],[3.2,dn,{r:[0,-0.34,-0.2]}]]; })()});
add({id:'rdl', cat:'weights', name:'루마니안 데드리프트', note:'덤벨로 엉덩이 접기', dur:3.2, equip:'db2', keys:(() => {
  const up = G({upperArmL:[0,0,6],upperArmR:[0,0,-6],forearmL:[0,0,0],forearmR:[0,0,0]});
  const dn = G({hips:[76,0,0],spine:[4,0,0],neck:[-28,0,0],head:[-16,0,0],thighL:[-80,0,0],thighR:[-80,0,0],shinL:[16,0,0],shinR:[16,0,0],
    upperArmL:[-80,0,6],upperArmR:[-80,0,-6],forearmL:[0,0,0],forearmR:[0,0,0]});
  return [[0,up],[1.3,dn,{r:[0,-0.1,-0.26]}],[1.8,dn,{r:[0,-0.1,-0.26]}],[3.2,up]]; })()});
add({id:'lunge', cat:'weights', name:'런지', note:'앞으로 한 걸음 내딛고 앉기', dur:3.2, keys:(() => {
  const step = R({thighL:[-45,0,0],shinL:[50,0,0],footL:[10,0,0],upperArmL:[0,0,14],upperArmR:[0,0,-14]});
  const dn = R({thighL:[-90,0,0],shinL:[92,0,0],thighR:[20,0,0],shinR:[100,0,0],upperArmL:[0,0,14],upperArmR:[0,0,-14],chest:[-4,0,0]});
  const S0 = [[0,0],[0,0]], S1 = [[0,0.4],[0,0]], S2 = [[0,0.86],[0,0]];
  return [[0,R(),{st:S0,pl:[1,1]}],[0.45,step,{st:S1,pl:[0,1],r:[0,0,0.12]}],[0.8,dn,{st:S2,pl:[1,1],r:[0,-0.1,0.4],hr:[0,30]}],[1.4,dn,{st:S2,pl:[1,1],r:[0,-0.46,0.42],hr:[0,55]}],
    [1.9,dn,{st:S2,pl:[1,1],r:[0,-0.08,0.4],hr:[0,30]}],[2.4,step,{st:S1,pl:[0,1],r:[0,0,0.14]}],[2.8,R(),{st:S0,pl:[1,1]}],[3.2,R(),{st:S0,pl:[1,1]}]]; })()});
add({id:'reverseLunge', cat:'weights', name:'리버스 런지', note:'뒤로 한 걸음 빼고 앉기', dur:3.2, equip:'db2', keys:(() => {
  const hang = {upperArmL:[0,0,8],upperArmR:[0,0,-8],forearmL:[0,0,0],forearmR:[0,0,0]};
  const step = G(L_(hang,{thighR:[20,0,0],shinR:[60,0,0],footR:[30,0,0]}));
  const dn = G(L_(hang,{thighL:[-88,0,0],shinL:[90,0,0],thighR:[18,0,0],shinR:[100,0,0]}));
  const S0 = [[0,0],[0,0]], S1 = [[0,0],[0,-0.45]], S2 = [[0,0],[0,-0.9]];
  return [[0,G(hang),{st:S0}],[0.45,step,{st:S1,pl:[1,0],r:[0,0,-0.1]}],[0.8,dn,{st:S2,r:[0,-0.1,-0.42],hr:[0,40]}],[1.4,dn,{st:S2,r:[0,-0.47,-0.44],hr:[0,58]}],
    [1.9,dn,{st:S2,r:[0,-0.08,-0.42],hr:[0,40]}],[2.4,step,{st:S1,pl:[1,0],r:[0,0,-0.12]}],[2.8,G(hang),{st:S0}],[3.2,G(hang),{st:S0}]]; })()});
add({id:'curl', cat:'weights', name:'덤벨 컬', note:'팔꿈치 접어 들어 올리기', dur:2.4, equip:'db2', keys:(() => {
  const a = f => G({upperArmL:[-6,0,8],upperArmR:[-6,0,-8],forearmL:[-f,0,0],forearmR:[-f,0,0]});
  return [[0,a(4)],[1.0,a(135)],[1.3,a(135)],[2.4,a(4)]]; })()});
add({id:'press', cat:'weights', name:'숄더 프레스', note:'덤벨 머리 위로 밀기', dur:2.4, equip:'db2', keys:(() => {
  const dn = G({upperArmL:[-8,0,82],upperArmR:[-8,0,-82],forearmL:[0,0,96],forearmR:[0,0,-96],handL:[0,0,-10],handR:[0,0,10]});
  const up = G({upperArmL:[-4,0,166],upperArmR:[-4,0,-166],forearmL:[0,0,8],forearmR:[0,0,-8],chest:[-3,0,0]});
  return [[0,dn],[1.0,up],[1.3,up],[2.4,dn]]; })()});
add({id:'lateral', cat:'weights', name:'사이드 레터럴 레이즈', note:'덤벨 옆으로 들기', dur:2.4, equip:'db2', keys:(() => {
  const a = z => G({upperArmL:[-8,0,z],upperArmR:[-8,0,-z],forearmL:[-12,0,0],forearmR:[-12,0,0]});
  return [[0,a(10)],[1.0,a(86)],[1.3,a(86)],[2.4,a(10)]]; })()});
add({id:'row', cat:'weights', name:'벤트오버 로우', note:'숙여서 덤벨 당기기', dur:2.4, equip:'db2', keys:(() => {
  const b = {hips:[58,0,0],spine:[4,0,0],neck:[-22,0,0],head:[-12,0,0],thighL:[-70,0,8],thighR:[-70,0,-8],shinL:[30,0,0],shinR:[30,0,0]};
  const dn = G(L_(b,{upperArmL:[-62,0,8],upperArmR:[-62,0,-8],forearmL:[0,0,0],forearmR:[0,0,0]}));
  const up = G(L_(b,{upperArmL:[-10,0,14],upperArmR:[-10,0,-14],forearmL:[-96,0,0],forearmR:[-96,0,0]}));
  const o = {r:[0,-0.16,-0.18]};
  return [[0,dn,o],[1.0,up,o],[1.3,up,o],[2.4,dn,o]]; })()});
add({id:'bench', cat:'weights', name:'벤치 프레스', note:'벤치에 누워 바벨 밀기', dur:2.6, yaw:90, need:'bench', g:'back', anchor:true, equip:'bb', keys:(() => {
  const legs = {thighL:[18,0,16],thighR:[18,0,-16],shinL:[88,0,0],shinR:[88,0,0],footL:[-30,0,0],footR:[-30,0,0]};
  const dn = G(L_(L_(SUP,legs),{upperArmL:[22,0,72],upperArmR:[22,0,-72],forearmL:[0,0,102],forearmR:[0,0,-102]}));
  const up = G(L_(L_(SUP,legs),{upperArmL:[-88,0,14],upperArmR:[-88,0,-14],forearmL:[0,0,0],forearmR:[0,0,0]}));
  const o = {g:'back', pl:[1,1]};
  return [[0,up,o],[1.1,dn,o],[1.4,dn,o],[2.6,up,o]]; })()});
add({id:'calfRaise', cat:'weights', name:'카프 레이즈', note:'뒤꿈치 들어 올리기', dur:2.0, keys:(() => {
  const a = R({upperArmL:[0,0,14],upperArmR:[0,0,-14]});
  return [[0,a,{hr:[0,0]}],[0.8,a,{hr:[38,38],r:[0,0.1,0.02]}],[1.2,a,{hr:[38,38],r:[0,0.1,0.02]}],[2.0,a,{hr:[0,0]}]]; })()});
add({id:'hipBridge', cat:'weights', name:'힙 브릿지', note:'누워서 엉덩이 조이기', dur:2.4, yaw:90, need:'mat', g:'back', anchor:true, keys:(() => {
  const down = L_(L_(SUP,supArms),{thighL:[-55,0,6],thighR:[-55,0,-6],shinL:[105,0,0],shinR:[105,0,0],footL:[-30,0,0],footR:[-30,0,0],upperArmL:[0,0,20],upperArmR:[0,0,-20]});
  const up = L_(down,{hips:[-125,0,0],neck:[30,0,0],head:[16,0,0],thighL:[-6,0,6],thighR:[-6,0,-6],shinL:[122,0,0],shinR:[122,0,0],upperArmL:[24,0,20],upperArmR:[24,0,-20]});
  const o = {g:'back', pl:[1,1]};
  return [[0,down,o],[0.9,up,o],[1.4,up,o],[2.4,down,o]]; })()});
add({id:'kbSwing', cat:'weights', name:'케틀벨 스윙', note:'엉덩이 힘으로 앞으로', dur:1.6, equip:'kb', keys:(() => {
  const dn = G({hips:[58,0,0],spine:[4,0,0],neck:[-24,0,0],head:[-10,0,0],thighL:[-66,10,8],thighR:[-66,-10,-8],shinL:[36,0,0],shinR:[36,0,0],
    upperArmL:[-36,0,-8],upperArmR:[-36,0,8],forearmL:[0,0,0],forearmR:[0,0,0]});
  const up = G({chest:[-4,0,0],upperArmL:[-92,0,-8],upperArmR:[-92,0,8],forearmL:[0,0,0],forearmR:[0,0,0],head:[-4,0,0]});
  return [[0,dn,{r:[0,-0.16,-0.2],st:[[0.12,0],[-0.12,0]]}],[0.7,up,{st:[[0.12,0],[-0.12,0]]}],[0.9,up,{st:[[0.12,0],[-0.12,0]]}],[1.6,dn,{r:[0,-0.16,-0.2],st:[[0.12,0],[-0.12,0]]}]]; })()});
add({id:'pushup', cat:'weights', name:'푸시업', note:'팔 굽혀 펴기', dur:2.2, yaw:90, need:'mat', g:'low2', keys:(() => {
  const up = {hips:[76,0,0],neck:[-6,0,0],head:[-8,0,0],footL:[-15,0,0],footR:[-15,0,0],toeL:[-50,0,0],toeR:[-50,0,0],
    upperArmL:[-76,0,8],upperArmR:[-76,0,-8],forearmL:[0,0,0],forearmR:[0,0,0],handL:[-70,0,0],handR:[-70,0,0],fingersL:[0,0,0],pointL:[0,0,0],fingersR:[0,0,0],pointR:[0,0,0]};
  const dn = L_(up,{hips:[86,0,0],upperArmL:[-28,0,30],upperArmR:[-28,0,-30],forearmL:[-62,0,0],forearmR:[-62,0,0],handL:[-24,0,0],handR:[-24,0,0],footL:[-5,0,0],footR:[-5,0,0]});
  return [[0,up,LOW2],[0.9,dn,LOW2],[1.2,dn,LOW2],[2.2,up,LOW2]]; })()});
add({id:'ringSqueeze', cat:'pilates', name:'링 조이기', note:'필라테스 링 가슴 앞에서', dur:2, equip:'ring', keys:(() => {
  const a = z => R({upperArmL:[-80,0,-z],upperArmR:[-80,0,z],forearmL:[-20,-80,0],forearmR:[-20,80,0],handL:[0,0,-40],handR:[0,0,40],fingersL:[-30,0,0],fingersR:[-30,0,0]});
  return [[0,a(4)],[0.8,a(14)],[1.2,a(14)],[2,a(4)]]; })()});

window.StudioPresets = {list:P, cats:{basic:'기본', stretch:'스트레칭', pilates:'필라테스', weights:'웨이트'}, REST};
})();

