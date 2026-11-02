/* ===== 소품·배경 라이브러리 (three r128 전역 THREE) =====
   단위 m, 위 +Y, 바닥 y=0, 정면 +Z. 모든 소품은 바닥 가운데가 원점.
   userData: {id, footprint:[w,d], top, grips:[{name,pos}], moving:{이름:Object3D}} */
(function(){
'use strict';
const T = THREE, INK = 0x1d1a17, D = Math.PI/180;

/* ---------- 재질 ---------- */
let _grad = null;
function gradMap(){
  if (!_grad){ const d = new Uint8Array([150,150,150,255, 196,196,196,255, 232,232,232,255, 255,255,255,255]);
    _grad = new T.DataTexture(d, 4, 1, T.RGBAFormat); _grad.minFilter = _grad.magFilter = T.NearestFilter; _grad.generateMipmaps = false; _grad.needsUpdate = true; }
  return _grad;
}
const _mats = {};
function mat(c, o){
  const k = c + (o ? JSON.stringify(o) : '');
  if (_mats[k]) return _mats[k];
  const m = new T.MeshToonMaterial(Object.assign({color:c, gradientMap:gradMap()}, o||{}));
  return (_mats[k] = m);
}
const _flat = {};
function flat(c, o){ const k = c + (o ? JSON.stringify(o) : ''); return _flat[k] || (_flat[k] = new T.MeshBasicMaterial(Object.assign({color:c}, o||{}))); }

/* ---------- 외곽선 (뒤집힌 껍질) ---------- */
const OL_VS = 'uniform float uW; void main(){ vec3 p = position + normal * uW; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }';
const OL_FS = 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC,1.0); }';
const _olm = {};
function olMat(w){ const k = w.toFixed(4); return _olm[k] || (_olm[k] = new T.ShaderMaterial({vertexShader:OL_VS, fragmentShader:OL_FS, side:T.BackSide, uniforms:{uW:{value:w}, uC:{value:new T.Color(INK)}}})); }
const _olg = new WeakMap();
function olGeo(g){
  if (_olg.has(g)) return _olg.get(g);
  let c = g.clone(); for (const k of Object.keys(c.attributes)) if (k !== 'position') c.deleteAttribute(k);
  c = T.BufferGeometryUtils.mergeVertices(c, 1e-4); c.computeVertexNormals();
  _olg.set(g, c); return c;
}
function addOutline(mesh, w){
  const o = new T.Mesh(olGeo(mesh.geometry), olMat(w == null ? 0.01 : w));
  o.renderOrder = -1; o.userData.outline = true; o.raycast = () => {};
  mesh.add(o); return o;
}

/* ---------- 도형 ---------- */
const _gc = {};
function cached(key, f){ return _gc[key] || (_gc[key] = f()); }
// 모서리 둥근 상자
function rbox(w, h, d, r){
  r = Math.min(r == null ? 0.02 : r, w/2-1e-4, h/2-1e-4, d/2-1e-4);
  return cached(['rb',w,h,d,r].join(), () => {
    const g = new T.BoxGeometry(w, h, d, 6, 6, 6), a = g.attributes.position, v = new T.Vector3(), c = new T.Vector3();
    const hx = w/2-r, hy = h/2-r, hz = d/2-r;
    for (let i = 0; i < a.count; i++){
      v.fromBufferAttribute(a, i);
      c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
      v.sub(c); if (v.lengthSq() > 1e-12) v.normalize().multiplyScalar(r); v.add(c);
      a.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  });
}
const cyl = (rt, rb, h, s=20) => cached(['cy',rt,rb,h,s].join(), () => new T.CylinderGeometry(rt, rb, h, s, 1));
const sph = (r, s=20) => cached(['sp',r,s].join(), () => new T.SphereGeometry(r, s, Math.round(s*0.7)));
const tor = (R, r, s=36, arc=Math.PI*2) => cached(['to',R,r,s,arc].join(), () => new T.TorusGeometry(R, r, 10, s, arc));
const cone = (r, h, s=16) => cached(['co',r,h,s].join(), () => new T.ConeGeometry(r, h, s));
const plane = (w, h) => cached(['pl',w,h].join(), () => new T.PlaneGeometry(w, h));
// 둥근 막대(캡슐) – 축 Y
function caps(r, len, s=14){ return cached(['ca',r,len,s].join(), () => {
  const pts = []; const n = 6;
  for (let i = 0; i <= n; i++){ const a = -Math.PI/2 + i/n*Math.PI/2; pts.push(new T.Vector2(Math.cos(a)*r, -len/2 + Math.sin(a)*r)); }
  for (let i = 0; i <= n; i++){ const a = i/n*Math.PI/2; pts.push(new T.Vector2(Math.cos(a)*r, len/2 + Math.sin(a)*r)); }
  pts[0].x = 0.0001; pts[pts.length-1].x = 0.0001;
  return new T.LatheGeometry(pts, s);
}); }

/* 부품 붙이기: o = {p:[x,y,z], r:[x,y,z](deg), s:[x,y,z]|n, ol:외곽선두께|false, flat:true, sh:false} */
function put(parent, geo, color, o={}){
  const m = new T.Mesh(geo, o.flat ? flat(color, o.mo) : mat(color, o.mo));
  if (o.p) m.position.set(o.p[0], o.p[1], o.p[2]);
  if (o.r) m.rotation.set(o.r[0]*D, o.r[1]*D, o.r[2]*D);
  if (o.s != null){ if (Array.isArray(o.s)) m.scale.set(o.s[0], o.s[1], o.s[2]); else m.scale.setScalar(o.s); }
  if (o.ol !== false) addOutline(m, o.ol == null ? 0.008 : o.ol);
  if (!o.flat){ m.castShadow = o.sh !== false && geo.type !== 'PlaneGeometry'; m.receiveShadow = true; }
  parent.add(m); return m;
}
// a에서 b로 잇는 막대
function rod(parent, a, b, r, color, o={}){
  const A = new T.Vector3(...a), B = new T.Vector3(...b), len = A.distanceTo(B);
  const m = put(parent, o.cap ? caps(r, len) : cyl(r, r, len, o.seg || 12), color, Object.assign({}, o, {p:null, r:null}));
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), B.clone().sub(A).normalize());
  return m;
}
function grp(id, ud){ const g = new T.Group(); g.name = id; g.userData = Object.assign({id, footprint:[1,1], top:0, grips:[], moving:{}}, ud||{}); return g; }

/* ---------- 색 ---------- */
const C = {
  ink:INK, white:0xFFFFFF, cream:0xF6F0E4, wood:0xD9A66B, woodD:0xB07A45, woodL:0xEBC795, alu:0xC9CDD2, steel:0x8E959D, dark:0x3A3C40, black:0x26272B,
  pad:0x6E7F8D, padCream:0xEDE3D1, sage:0x9CC3A8, lilac:0xB9A6DD, coral:0xF08A6E, sky:0xA8D8E8, yellow:0xF5D33F, orange:0xF07D28, green:0x7CC243,
  red:0xD8503F, blue:0x4F7FC4, rubber:0x45484E, plateB:0x2F3136, plateR:0xD8503F, plateBl:0x3E78C9, plateY:0xF2C230, plateG:0x5DAA5A,
};

/* =====================================================================
   소품
   ===================================================================== */
const P = {};
function prop(id, label, category, build){ P[id] = {label, category, build}; }

/* --- 필라테스·스트레칭 --- */
prop('yogaMat', '요가매트', 'pilates', () => {
  const g = grp('yogaMat', {footprint:[1.83,0.61], top:0.006});
  put(g, rbox(1.83, 0.008, 0.61, 0.003), C.lilac, {p:[0,0.004,0], ol:0.004});
  put(g, rbox(1.79, 0.002, 0.57, 0.001), 0xC8B8E8, {p:[0,0.0085,0], ol:false});
  return g;
});
prop('yogaMatGreen', '요가매트 (초록)', 'pilates', () => {
  const g = grp('yogaMatGreen', {footprint:[1.83,0.61], top:0.006});
  put(g, rbox(1.83, 0.008, 0.61, 0.003), C.sage, {p:[0,0.004,0], ol:0.004});
  put(g, rbox(1.79, 0.002, 0.57, 0.001), 0xB5D6BF, {p:[0,0.0085,0], ol:false});
  return g;
});
prop('yogaMatRolled', '말린 요가매트', 'pilates', () => {
  const g = grp('yogaMatRolled', {footprint:[0.62,0.14], top:0.14});
  put(g, cyl(0.065, 0.065, 0.61, 24), C.lilac, {p:[0,0.065,0], r:[0,0,90]});
  put(g, cyl(0.03, 0.03, 0.615, 16), 0x8F7BC0, {p:[0,0.065,0], r:[0,0,90], ol:false});
  put(g, tor(0.067, 0.006), C.dark, {p:[0.2,0.065,0], r:[0,90,0], ol:false});
  put(g, tor(0.067, 0.006), C.dark, {p:[-0.2,0.065,0], r:[0,90,0], ol:false});
  return g;
});
prop('reformer', '리포머', 'pilates', () => {
  const L = 2.4, W = 0.68, H = 0.3;
  const g = grp('reformer', {footprint:[L+0.1, W+0.1], top:0.39});
  // 나무 틀
  for (const s of [-1,1]) put(g, rbox(L, 0.12, 0.08, 0.02), C.wood, {p:[0, H-0.06, s*(W/2-0.04)]});
  for (const x of [-L/2+0.05, L/2-0.05]) put(g, rbox(0.1, 0.12, W, 0.02), C.wood, {p:[x, H-0.06, 0]});
  for (const x of [-L/2+0.1, L/2-0.1]) for (const s of [-1,1]) put(g, rbox(0.08, H-0.12, 0.08, 0.015), C.woodD, {p:[x, (H-0.12)/2, s*(W/2-0.04)]});
  // 레일
  for (const s of [-1,1]) put(g, rbox(L-0.25, 0.02, 0.03, 0.006), C.alu, {p:[0, H+0.005, s*0.22], ol:0.004});
  // 캐리지 (움직이는 판)
  const car = new T.Group(); car.name = 'carriage'; car.position.set(-0.45, H+0.02, 0); g.add(car);
  put(car, rbox(0.9, 0.06, 0.6, 0.025), C.pad, {p:[0, 0.04, 0]});
  put(car, rbox(0.92, 0.02, 0.62, 0.008), C.steel, {p:[0, 0.0, 0], ol:0.004});
  put(car, rbox(0.2, 0.05, 0.3, 0.02), C.pad, {p:[-0.4, 0.09, 0], r:[0,0,-12]});          // 머리받침
  for (const s of [-1,1]) put(car, caps(0.04, 0.08), C.pad, {p:[-0.25, 0.14, s*0.13]});     // 어깨받침
  g.userData.moving.carriage = car;
  // 발바
  const fb = new T.Group(); fb.name = 'footbar'; fb.position.set(L/2-0.28, H, 0); g.add(fb);
  for (const s of [-1,1]) rod(fb, [0,0,s*0.3], [0.08,0.3,s*0.3], 0.016, C.steel, {ol:0.004});
  rod(fb, [0.08,0.3,-0.3], [0.08,0.3,0.3], 0.022, C.padCream, {cap:true, ol:0.005});
  g.userData.moving.footbar = fb;
  // 스프링
  for (const z of [-0.18,-0.09,0,0.09,0.18]) rod(g, [0.0, H+0.03, z], [L/2-0.4, H+0.03, z], 0.012, [C.red,C.yellow,C.blue,C.green,C.red][Math.round(z/0.09)+2], {ol:0.003});
  // 뒤 기둥과 줄 (줄은 손에 걸면 손을 따라가게 따로 묶음)
  const straps = new T.Group(); straps.name = 'straps'; g.add(straps);
  for (const s of [-1,1]){
    rod(g, [-L/2+0.06, H, s*(W/2-0.04)], [-L/2+0.06, H+0.42, s*(W/2-0.04)], 0.02, C.steel, {ol:0.004});
    put(g, sph(0.028, 12), C.dark, {p:[-L/2+0.06, H+0.42, s*(W/2-0.04)], ol:false});
    rod(straps, [-L/2+0.06, H+0.4, s*(W/2-0.04)], [-0.35, H+0.12, s*0.25], 0.006, C.dark, {ol:false});
    put(straps, tor(0.06, 0.012, 20), C.dark, {p:[-0.3, H+0.1, s*0.27], r:[90,0,0], ol:0.003});
  }
  g.userData.moving.straps = straps;
  g.userData.rf = {L, H, post:[-L/2+0.06, H+0.4, W/2-0.04], bar:[L/2-0.28+0.08, H+0.3, 0], barR:0.022, car0:-0.45, carMin:-0.62, carMax:0.3};
  g.userData.grips = [{name:'strapL', pos:[-0.3, H+0.1, 0.27]}, {name:'strapR', pos:[-0.3, H+0.1, -0.27]}, {name:'footbar', pos:[L/2-0.2, H+0.3, 0]}];
  g.userData.surfaces = {carriage:H+0.08};
  return g;
});
prop('cadillac', '캐딜락', 'pilates', () => {
  const L = 2.0, W = 0.7, H = 0.62, TOP = 2.0;
  const g = grp('cadillac', {footprint:[L+0.1, W+0.1], top:H+0.06});
  put(g, rbox(L, 0.1, W, 0.04), C.padCream, {p:[0, H, 0]});
  put(g, rbox(L+0.04, 0.06, W+0.04, 0.015), C.wood, {p:[0, H-0.07, 0]});
  for (const x of [-L/2+0.04, L/2-0.04]) for (const s of [-1,1]){
    rod(g, [x, 0, s*(W/2)], [x, TOP, s*(W/2)], 0.025, C.steel, {ol:0.005});
  }
  for (const s of [-1,1]) rod(g, [-L/2+0.04, TOP, s*W/2], [L/2-0.04, TOP, s*W/2], 0.025, C.steel, {ol:0.005});
  for (const x of [-L/2+0.04, -0.3, 0.3, L/2-0.04]) rod(g, [x, TOP, -W/2], [x, TOP, W/2], 0.022, C.steel, {ol:0.005});
  // 푸시스루 바
  rod(g, [-L/2+0.1, 1.05, -W/2], [-L/2+0.1, 1.05, W/2], 0.02, C.padCream, {cap:true, ol:0.005});
  for (const s of [-1,1]) rod(g, [-L/2+0.04, 1.05, s*W/2], [-L/2+0.04, TOP-0.05, s*W/2*0.9], 0.008, C.red, {ol:0.003});
  // 매달린 스프링·고리
  for (const s of [-1,1]){ rod(g, [0.3, TOP, s*0.2], [0.3, 1.35, s*0.2], 0.01, C.yellow, {ol:0.003}); put(g, tor(0.05, 0.012), C.dark, {p:[0.3, 1.3, s*0.2], r:[90,0,0], ol:0.003}); }
  return g;
});
prop('wundaChair', '운다 체어', 'pilates', () => {
  const g = grp('wundaChair', {footprint:[0.7,0.62], top:0.62});
  put(g, rbox(0.66, 0.5, 0.58, 0.03), C.woodL, {p:[0, 0.3, 0]});
  put(g, rbox(0.7, 0.08, 0.62, 0.035), C.padCream, {p:[0, 0.6, 0]});
  const ped = new T.Group(); ped.name = 'pedal'; ped.position.set(0, 0.06, 0.29); g.add(ped);
  put(ped, rbox(0.62, 0.04, 0.3, 0.015), C.steel, {p:[0, 0.12, 0.13], r:[22,0,0], ol:0.005});
  put(ped, rbox(0.6, 0.03, 0.12, 0.01), C.padCream, {p:[0, 0.2, 0.26], r:[22,0,0], ol:0.004});
  for (const s of [-1,1]) rod(g, [s*0.2, 0.08, 0.3], [s*0.2, 0.35, 0.29], 0.01, C.red, {ol:0.003});
  g.userData.moving.pedal = ped;
  g.userData.surfaces = {seat:0.64};
  return g;
});
prop('ladderBarrel', '래더 바렐', 'pilates', () => {
  const g = grp('ladderBarrel', {footprint:[1.3,0.7], top:0.95});
  const bar = put(g, cached('barrel', () => new T.CylinderGeometry(0.36, 0.36, 0.62, 28, 1, false, 0, Math.PI)), C.padCream, {p:[0.25, 0.58, 0], r:[90,0,90]});
  put(g, rbox(0.72, 0.58, 0.6, 0.03), C.woodL, {p:[0.25, 0.29, 0]});
  for (const s of [-1,1]) rod(g, [-0.5, 0, s*0.3], [-0.5, 1.15, s*0.3], 0.025, C.wood, {ol:0.005});
  for (let i = 0; i < 6; i++) rod(g, [-0.5, 0.2+i*0.17, -0.3], [-0.5, 0.2+i*0.17, 0.3], 0.018, C.woodD, {ol:0.004});
  put(g, rbox(0.6, 0.06, 0.66, 0.02), C.wood, {p:[-0.18, 0.03, 0]});
  return g;
});
prop('pilatesRing', '필라테스 링', 'pilates', () => {
  const g = grp('pilatesRing', {footprint:[0.38,0.06], top:0.38});
  put(g, tor(0.17, 0.012, 40), C.steel, {p:[0, 0.19, 0], ol:0.004});
  for (const s of [-1,1]) put(g, rbox(0.04, 0.09, 0.05, 0.015), C.coral, {p:[s*0.18, 0.19, 0], ol:0.004});
  g.userData.grips = [{name:'left', pos:[0.18,0.19,0]}, {name:'right', pos:[-0.18,0.19,0]}];
  return g;
});
prop('gymBall', '짐볼', 'pilates', () => {
  const g = grp('gymBall', {footprint:[0.65,0.65], top:0.65});
  put(g, sph(0.325, 36), C.sky, {p:[0, 0.325, 0], ol:0.01});
  put(g, tor(0.326, 0.004, 48), 0x7FB9CE, {p:[0,0.325,0], r:[0,0,90], ol:false});
  g.userData.surfaces = {seat:0.6};
  return g;
});
prop('foamRoller', '폼롤러', 'pilates', () => {
  const g = grp('foamRoller', {footprint:[0.9,0.15], top:0.15});
  put(g, cyl(0.075, 0.075, 0.9, 28), C.coral, {p:[0,0.075,0], r:[0,0,90]});
  for (const x of [-0.3,-0.1,0.1,0.3]) put(g, tor(0.076, 0.004, 28), 0xD9705A, {p:[x,0.075,0], r:[0,90,0], ol:false});
  return g;
});
prop('stepBox', '스텝박스', 'pilates', () => {
  const g = grp('stepBox', {footprint:[1.0,0.4], top:0.2});
  put(g, rbox(1.0, 0.04, 0.4, 0.015), C.dark, {p:[0, 0.18, 0]});
  put(g, rbox(0.96, 0.012, 0.36, 0.005), C.steel, {p:[0, 0.205, 0], ol:false});
  for (const x of [-0.38, 0.38]) put(g, rbox(0.18, 0.16, 0.42, 0.02), C.sky, {p:[x, 0.08, 0]});
  return g;
});

/* --- 웨이트 --- */
function dumbbellGeo(g, kg, scale){
  const s = scale || 1, col = kg >= 10 ? C.plateB : kg >= 5 ? C.blue : C.coral;
  rod(g, [-0.07*s,0,0], [0.07*s,0,0], 0.016*s, C.steel, {ol:0.003});
  for (const x of [-1,1]){
    put(g, cyl(0.055*s, 0.055*s, 0.06*s, 8), col, {p:[x*0.1*s,0,0], r:[0,0,90], ol:0.004});
    put(g, cyl(0.03*s, 0.03*s, 0.065*s, 8), C.steel, {p:[x*0.1*s,0,0], r:[0,0,90], ol:false});
  }
}
prop('dumbbell', '덤벨', 'weights', () => {
  const g = grp('dumbbell', {footprint:[0.3,0.12], top:0.11});
  const inner = new T.Group(); inner.position.y = 0.055; g.add(inner); dumbbellGeo(inner, 8);
  g.userData.grips = [{name:'center', pos:[0,0.055,0]}]; g.userData.axis = 'x';
  return g;
});
prop('dumbbellPair', '덤벨 두 개', 'weights', () => {
  const g = grp('dumbbellPair', {footprint:[0.35,0.4], top:0.11});
  for (const z of [-0.12, 0.12]){ const i = new T.Group(); i.position.set(0,0.055,z); g.add(i); dumbbellGeo(i, 8); }
  return g;
});
prop('dumbbellRack', '덤벨 랙', 'weights', () => {
  const g = grp('dumbbellRack', {footprint:[1.6,0.6], top:0.85});
  for (const x of [-0.75, 0.75]){ rod(g, [x,0,0.15], [x,0.85,-0.05], 0.025, C.dark, {ol:0.005}); rod(g, [x,0,-0.2], [x,0.85,-0.05], 0.025, C.dark, {ol:0.005}); }
  for (const [y,z] of [[0.45,0.12],[0.75,-0.02]]){
    put(g, rbox(1.56, 0.03, 0.2, 0.01), C.dark, {p:[0,y,z], r:[-15,0,0], ol:0.004});
    for (let i = 0; i < 6; i++){ const d = new T.Group(); d.position.set(-0.62+i*0.25, y+0.06, z); d.rotation.y = Math.PI/2; g.add(d); dumbbellGeo(d, [2,4,6,10,12,15][i], 0.85+i*0.05); }
  }
  return g;
});
function plate(parent, r, w, col, x){ put(parent, cyl(r, r, w, 28), col, {p:[x,0,0], r:[0,0,90], ol:0.006}); put(parent, cyl(r*0.25, r*0.25, w+0.004, 16), C.steel, {p:[x,0,0], r:[0,0,90], ol:false}); }
function barbellGeo(g, withPlates){
  rod(g, [-1.1,0,0], [1.1,0,0], 0.014, C.alu, {ol:0.003});
  for (const s of [-1,1]){
    put(g, cyl(0.025, 0.025, 0.04, 12), C.steel, {p:[s*0.75,0,0], r:[0,0,90], ol:0.003});
    if (withPlates){ plate(g, 0.225, 0.05, C.plateR, s*0.8); plate(g, 0.17, 0.035, C.plateBl, s*0.85); }
  }
}
prop('barbell', '바벨', 'weights', () => {
  const g = grp('barbell', {footprint:[2.2,0.45], top:0.45});
  const i = new T.Group(); i.position.y = 0.225; g.add(i); barbellGeo(i, true);
  g.userData.grips = [{name:'left', pos:[0.3,0.225,0]}, {name:'right', pos:[-0.3,0.225,0]}]; g.userData.axis = 'x';
  return g;
});
prop('squatRack', '스쿼트 랙', 'weights', () => {
  const g = grp('squatRack', {footprint:[1.3,1.3], top:2.2});
  const W = 1.2, Dp = 1.1, H = 2.2;
  for (const x of [-W/2, W/2]) for (const z of [-Dp/2, Dp/2]){
    put(g, rbox(0.07, H, 0.07, 0.01), C.black, {p:[x, H/2, z], ol:0.005});
    for (let k = 0; k < 18; k++) put(g, cyl(0.008,0.008,0.075,8), C.steel, {p:[x, 0.3+k*0.1, z], r:[0,0,90], ol:false});
  }
  for (const z of [-Dp/2, Dp/2]) put(g, rbox(W, 0.07, 0.07, 0.01), C.black, {p:[0, H, z], ol:0.005});
  for (const x of [-W/2, W/2]) put(g, rbox(0.07, 0.07, Dp, 0.01), C.black, {p:[x, H, 0], ol:0.005});
  for (const x of [-W/2, W/2]) put(g, rbox(0.08, 0.05, Dp+0.1, 0.01), C.black, {p:[x, 0.025, 0], ol:0.005});
  rod(g, [-W/2, H-0.1, Dp/2], [W/2, H-0.1, Dp/2], 0.018, C.steel, {ol:0.004});    // 철봉
  for (const x of [-W/2, W/2]) put(g, rbox(0.06, 0.08, 0.1, 0.01), C.red, {p:[x, 1.32, Dp/2+0.06], ol:0.004});   // J훅
  const b = new T.Group(); b.position.set(0, 1.38, Dp/2+0.06); g.add(b); barbellGeo(b, true);
  put(g, rbox(W+0.3, 0.02, Dp+0.2, 0.01), C.rubber, {p:[0, 0.01, 0], ol:0.004});
  return g;
});
prop('flatBench', '플랫 벤치', 'weights', () => {
  const g = grp('flatBench', {footprint:[1.2,0.32], top:0.45});
  put(g, rbox(1.2, 0.09, 0.3, 0.035), C.black, {p:[0, 0.41, 0]});
  put(g, rbox(1.1, 0.04, 0.12, 0.01), C.steel, {p:[0, 0.345, 0], ol:0.004});
  for (const x of [-0.5, 0.5]){ put(g, rbox(0.06, 0.33, 0.06, 0.01), C.steel, {p:[x, 0.17, 0], ol:0.004}); put(g, rbox(0.08, 0.04, 0.5, 0.015), C.steel, {p:[x, 0.02, 0], ol:0.004}); }
  g.userData.surfaces = {seat:0.455};
  return g;
});
prop('inclineBench', '인클라인 벤치', 'weights', () => {
  const g = grp('inclineBench', {footprint:[1.3,0.34], top:0.46});
  put(g, rbox(0.42, 0.09, 0.3, 0.035), C.black, {p:[0.35, 0.42, 0]});
  put(g, rbox(0.8, 0.09, 0.3, 0.035), C.black, {p:[-0.15, 0.67, 0], r:[0,0,-35]});
  rod(g, [-0.45, 0, 0], [-0.25, 0.5, 0], 0.03, C.steel, {ol:0.004});
  put(g, rbox(1.2, 0.05, 0.08, 0.01), C.steel, {p:[0, 0.03, 0], ol:0.004});
  for (const x of [-0.55, 0.55]) put(g, rbox(0.08, 0.04, 0.5, 0.015), C.steel, {p:[x, 0.02, 0], ol:0.004});
  rod(g, [0.35, 0.03, 0], [0.35, 0.38, 0], 0.03, C.steel, {ol:0.004});
  return g;
});
prop('kettlebell', '케틀벨', 'weights', () => {
  const g = grp('kettlebell', {footprint:[0.22,0.22], top:0.3});
  put(g, cached('kb', () => { const s = new T.SphereGeometry(0.11, 24, 18); s.scale(1, 0.95, 1); return s; }), C.black, {p:[0, 0.11, 0], ol:0.006});
  put(g, cyl(0.09, 0.09, 0.02, 20), C.black, {p:[0, 0.01, 0], ol:false});
  put(g, tor(0.07, 0.015, 24, Math.PI), C.black, {p:[0, 0.2, 0], ol:0.004});
  for (const s of [-1,1]) put(g, cyl(0.015,0.015,0.05,10), C.black, {p:[s*0.07, 0.185, 0], ol:false});
  g.userData.grips = [{name:'handle', pos:[0,0.27,0]}];
  return g;
});
prop('platesTree', '원판 거치대', 'weights', () => {
  const g = grp('platesTree', {footprint:[0.6,0.6], top:1.1});
  put(g, rbox(0.6, 0.05, 0.6, 0.02), C.black, {p:[0, 0.025, 0]});
  rod(g, [0,0,0], [0,1.1,0], 0.035, C.black, {ol:0.005});
  const cols = [C.plateR, C.plateBl, C.plateY, C.plateG];
  [[0.3,0.225],[0.55,0.2],[0.8,0.17],[0.95,0.13]].forEach(([y,r],i) => {
    for (const s of [-1,1]){ rod(g, [0,y,0], [s*0.22,y+0.02,0], 0.015, C.steel, {ol:false}); const w = new T.Group(); w.position.set(s*0.12, y+0.01, 0); g.add(w); plate(w, r, 0.045, cols[i], 0); w.rotation.y = 0; }
  });
  return g;
});
prop('pullupBar', '철봉', 'weights', () => {
  const g = grp('pullupBar', {footprint:[1.3,1.0], top:2.3});
  for (const s of [-1,1]){ rod(g, [s*0.6,0,0], [s*0.6,2.3,0], 0.035, C.dark, {ol:0.005}); put(g, rbox(0.08, 0.05, 1.0, 0.015), C.dark, {p:[s*0.6, 0.025, 0], ol:0.004}); rod(g, [s*0.6,0.05,0.4], [s*0.6,1.0,0], 0.02, C.dark, {ol:0.004}); rod(g, [s*0.6,0.05,-0.4], [s*0.6,1.0,0], 0.02, C.dark, {ol:0.004}); }
  rod(g, [-0.62,2.25,0], [0.62,2.25,0], 0.018, C.steel, {ol:0.004});
  g.userData.grips = [{name:'left', pos:[0.3,2.25,0]}, {name:'right', pos:[-0.3,2.25,0]}];
  return g;
});

/* --- 가구 --- */
prop('chair', '의자', 'furniture', () => {
  const g = grp('chair', {footprint:[0.46,0.48], top:0.45});
  put(g, rbox(0.46, 0.05, 0.44, 0.02), C.woodL, {p:[0, 0.43, 0]});
  for (const x of [-0.19, 0.19]) for (const z of [-0.18, 0.18]) put(g, rbox(0.04, 0.42, 0.04, 0.01), C.wood, {p:[x, 0.21, z], ol:0.004});
  for (const x of [-0.19, 0.19]) put(g, rbox(0.04, 0.45, 0.04, 0.01), C.wood, {p:[x, 0.68, -0.19], r:[-6,0,0], ol:0.004});
  put(g, rbox(0.44, 0.16, 0.035, 0.015), C.woodL, {p:[0, 0.83, -0.21], r:[-6,0,0]});
  g.userData.surfaces = {seat:0.455};
  return g;
});
prop('stool', '스툴', 'furniture', () => {
  const g = grp('stool', {footprint:[0.36,0.36], top:0.46});
  put(g, cyl(0.17, 0.17, 0.05, 28), C.coral, {p:[0, 0.44, 0]});
  for (let i = 0; i < 3; i++){ const a = i/3*Math.PI*2; rod(g, [Math.cos(a)*0.08, 0.42, Math.sin(a)*0.08], [Math.cos(a)*0.16, 0, Math.sin(a)*0.16], 0.015, C.woodD, {ol:0.004}); }
  put(g, tor(0.11, 0.008, 24), C.woodD, {p:[0, 0.18, 0], r:[90,0,0], ol:0.003});
  g.userData.surfaces = {seat:0.465};
  return g;
});
prop('footrest', '발받침', 'furniture', () => {
  const g = grp('footrest', {footprint:[0.42,0.32], top:0.26});
  put(g, rbox(0.42, 0.18, 0.32, 0.06), C.sky, {p:[0, 0.16, 0]});
  for (const x of [-0.16, 0.16]) for (const z of [-0.11, 0.11]) put(g, cyl(0.018, 0.012, 0.07, 10), C.woodD, {p:[x, 0.035, z], ol:0.003});
  g.userData.surfaces = {seat:0.25};
  return g;
});
prop('sofa', '소파', 'furniture', () => {
  const g = grp('sofa', {footprint:[2.0,0.9], top:0.45});
  const col = 0x8FB4A0;
  put(g, rbox(2.0, 0.22, 0.85, 0.06), col, {p:[0, 0.2, 0]});
  for (const x of [-0.48, 0.48]) put(g, rbox(0.94, 0.14, 0.7, 0.06), 0xA4C6B3, {p:[x, 0.38, 0.06]});
  put(g, rbox(2.0, 0.5, 0.22, 0.08), col, {p:[0, 0.55, -0.32]});
  for (const s of [-1,1]) put(g, rbox(0.2, 0.36, 0.85, 0.07), col, {p:[s*0.92, 0.42, 0]});
  for (const x of [-0.9, 0.9]) for (const z of [-0.36, 0.36]) put(g, cyl(0.025, 0.02, 0.09, 10), C.woodD, {p:[x, 0.045, z], ol:0.003});
  put(g, rbox(0.4, 0.3, 0.12, 0.05), C.yellow, {p:[-0.6, 0.6, -0.15], r:[-10,10,8]});
  g.userData.surfaces = {seat:0.45};
  return g;
});
prop('bed', '침대', 'furniture', () => bedGeo('bed', 1.6, 2.05, 0.55));
function bedGeo(id, W, L, H){
  const g = grp(id, {footprint:[W+0.1, L+0.1], top:H});
  put(g, rbox(W+0.08, H-0.2, L+0.08, 0.04), C.wood, {p:[0, (H-0.2)/2, 0]});
  put(g, rbox(W, 0.24, L, 0.08), C.white, {p:[0, H-0.12, 0]});                                     // 매트리스
  put(g, rbox(W+0.02, 0.06, L*0.62, 0.05), 0xB8D4E8, {p:[0, H+0.005, L*0.19]});                       // 이불
  put(g, rbox(W+0.04, 0.05, 0.08, 0.025), 0x9EC3DE, {p:[0, H+0.01, L*0.19 - L*0.31]});
  put(g, rbox(W+0.08, 0.95, 0.08, 0.04), C.woodD, {p:[0, 0.475+0.05, -L/2-0.04]});                    // 헤드보드
  for (const x of W > 1.4 ? [-W/4, W/4] : [0]) put(g, rbox(Math.min(0.6, W*0.4), 0.14, 0.38, 0.07), C.cream, {p:[x, H+0.06, -L/2+0.26], r:[-12,0,0]});
  return g;
}

/* =====================================================================
   배경
   ===================================================================== */
const S = {};
function set(id, label, build){ S[id] = {label, build}; }
function room(g, o){
  // 열린 방: 바닥 + 뒷벽 + 양옆 벽 (앞은 비움)
  const W = o.w || 9, Dp = o.d || 7, H = o.h || 3.2;
  const fl = put(g, plane(W, Dp+9), o.floor, {r:[-90,0,0], p:[0,0,-Dp/2+3.0+4.5], ol:false}); fl.userData.floor = true;
  const HH = H + 4;   // 세로 화면에서도 천장 위가 비지 않게 벽을 높게
  put(g, plane(W, HH), o.wall, {p:[0, HH/2, -Dp+3.0], ol:false}).userData.floor = true;
  if (o.sides !== false) for (const s of [-1,1]) put(g, plane(Dp+9, HH), o.side || o.wall, {p:[s*W/2, HH/2, -Dp/2+3.0+4.5], r:[0,-s*90,0], ol:false}).userData.floor = true;
  // 걸레받이
  put(g, rbox(W, 0.1, 0.03, 0.005), o.base || 0xE8E0D2, {p:[0, 0.05, -Dp+3.02], ol:0.003});
  if (o.sides !== false) for (const s of [-1,1]) put(g, rbox(0.03, 0.1, Dp, 0.005), o.base || 0xE8E0D2, {p:[s*(W/2-0.015), 0.05, -Dp/2+3.0], ol:0.003});
  return {W, Dp, H, back:-Dp+3.0};
}
function windowAt(g, x, y, z, w, h, o={}){
  const ry = o.ry || 0, f = new T.Group(); f.position.set(x, y, z); f.rotation.y = ry*D; g.add(f);
  put(f, plane(w, h), o.glass || 0xCFE9F5, {flat:true, ol:false, p:[0,0,0.005]});
  put(f, plane(w*0.35, h*0.9), 0xE8F6FC, {flat:true, ol:false, p:[-w*0.2,0,0.008], r:[0,0,12]});
  const fr = o.frame || C.white, t = 0.06;
  for (const s of [-1,1]){ put(f, rbox(w+t, t, 0.06, 0.01), fr, {p:[0, s*h/2, 0.02], ol:0.004}); put(f, rbox(t, h, 0.06, 0.01), fr, {p:[s*w/2, 0, 0.02], ol:0.004}); }
  put(f, rbox(t*0.6, h, 0.05, 0.01), fr, {p:[0,0,0.02], ol:0.003});
  put(f, rbox(w+0.15, 0.04, 0.14, 0.01), fr, {p:[0, -h/2-0.03, 0.06], ol:0.004});
  return f;
}
function plant(g, x, z, s=1, pot=C.coral){
  const p = new T.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); g.add(p);
  put(p, cyl(0.18, 0.14, 0.32, 18), pot, {p:[0, 0.16, 0], ol:0.006});
  put(p, cyl(0.17, 0.17, 0.02, 18), 0x6B4B33, {p:[0, 0.31, 0], ol:false});
  [[0,0.62,0,0.2],[0.12,0.52,0.05,0.15],[-0.12,0.55,-0.04,0.16],[0.04,0.8,-0.05,0.13],[-0.06,0.72,0.08,0.12]].forEach(([a,b,c,r]) => put(p, sph(r, 14), 0x6DAE5C, {p:[a,b,c], s:[1,1.15,1], ol:0.006}));
  return p;
}
function tallPlant(g, x, z, s=1){
  const p = new T.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); g.add(p);
  put(p, cyl(0.2, 0.16, 0.42, 18), C.cream, {p:[0, 0.21, 0], ol:0.006});
  rod(p, [0,0.4,0], [0.02,1.2,0], 0.02, 0x7A5A3A, {ol:0.004});
  for (let i = 0; i < 7; i++){ const a = i*1.3, h = 0.8 + i*0.09; const l = put(p, cached('leaf', () => { const s = new T.SphereGeometry(0.16, 12, 8); s.scale(1, 0.22, 0.55); return s; }), 0x5E9E50, {p:[Math.cos(a)*0.16, h, Math.sin(a)*0.16], r:[0, -a*57.3, -25], ol:0.004}); }
  return p;
}
function frameArt(g, x, y, z, w, h, cols, ry=0){
  const f = new T.Group(); f.position.set(x, y, z); f.rotation.y = ry*D; g.add(f);
  put(f, rbox(w+0.06, h+0.06, 0.03, 0.01), C.woodD, {ol:0.004});
  put(f, plane(w, h), cols[0], {flat:true, ol:false, p:[0,0,0.017]});
  put(f, cached('artc', () => new T.CircleGeometry(1, 24)), cols[1], {flat:true, ol:false, p:[w*0.15, h*0.1, 0.019], s:[w*0.25, w*0.25, 1]});
  put(f, plane(w*0.7, h*0.25), cols[2], {flat:true, ol:false, p:[-w*0.05, -h*0.28, 0.02]});
  return f;
}
function mirrorWall(g, x, y, z, w, h){
  const f = new T.Group(); f.position.set(x, y, z); g.add(f);
  put(f, plane(w, h), 0xC9DCE6, {flat:true, ol:false});
  for (let i = 0; i < 4; i++) put(f, plane(0.12 + (i%2)*0.08, h*0.9), 0xE4F0F6, {flat:true, ol:false, p:[-w/2 + (i+0.6)*w/4, 0, 0.003], r:[0,0,18]});
  put(f, rbox(w+0.06, 0.05, 0.05, 0.01), C.alu, {p:[0, h/2, 0.02], ol:0.003});
  put(f, rbox(w+0.06, 0.05, 0.05, 0.01), C.alu, {p:[0, -h/2, 0.02], ol:0.003});
  for (let i = 1; i < 4; i++) put(f, rbox(0.03, h, 0.03, 0.005), C.alu, {p:[-w/2 + i*w/4, 0, 0.015], ol:false});
  return f;
}
function addProp(g, id, x, z, ry=0, s=1){ const o = P[id].build(); o.position.set(x, 0, z); o.rotation.y = ry*D; o.scale.setScalar(s); g.add(o); return o; }

set('studio', '기본 스튜디오', () => {
  const g = new T.Group(); g.name = 'set-studio';
  cyc(g, 0xF7F2EA, 0xEFE8DC);
  g.userData = {id:'studio', floorY:0, stage:{cx:0, cz:0, w:6, d:4}, sky:'#FBF8F2', cam:{pos:[0,1.4,6.2], target:[0,0.9,0]}};
  return g;
});
set('greenscreen', '그린스크린', () => {
  const g = new T.Group(); g.name = 'set-green';
  cyc(g, 0x00B140, 0x00B140, true);
  g.userData = {id:'greenscreen', floorY:0, stage:{cx:0, cz:0, w:6, d:4}, sky:'#00B140', cam:{pos:[0,1.4,6.2], target:[0,0.9,0]}, chroma:true};
  return g;
});
function cyc(g, wall, floor, flatOnly){
  // 바닥에서 벽으로 휘어 올라가는 무대 배경
  const W = 16, R = 2.2, back = -4.5, H = 7;
  const shape = []; shape.push([8, 0]);
  for (let i = 0; i <= 16; i++){ const a = i/16*Math.PI/2; shape.push([back + R - Math.sin(a)*R, R - Math.cos(a)*R]); }
  shape.push([back, H]);
  const pos = [], idx = [];
  for (let i = 0; i < shape.length; i++){ const [z, y] = shape[i]; pos.push(-W/2, y, z, W/2, y, z); }
  for (let i = 0; i < shape.length-1; i++){ const a = i*2; idx.push(a, a+2, a+1, a+1, a+2, a+3); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new T.Mesh(geo, flatOnly ? flat(wall) : mat(wall)); m.userData.floor = true; m.receiveShadow = true; g.add(m);
  if (!flatOnly){
    const sh = new T.Mesh(cached('cs', () => new T.CircleGeometry(3.2, 48)), flat(floor)); sh.rotation.x = -Math.PI/2; sh.position.y = 0.001; g.add(sh);
  }
}

set('gym', '헬스장', () => {
  const g = new T.Group(); g.name = 'set-gym';
  const r = room(g, {w:11, d:8, h:3.6, floor:0x3E4248, wall:0xE9E6E1, side:0xDCD8D2, base:0x2E3136});
  // 고무 바닥 타일 줄눈
  for (let i = -5; i <= 5; i++) put(g, plane(0.02, 8), 0x33373C, {flat:true, ol:false, r:[-90,0,0], p:[i, 0.002, -1]});
  for (let j = -4; j <= 2; j++) put(g, plane(11, 0.02), 0x33373C, {flat:true, ol:false, r:[-90,0,0], p:[0, 0.002, j]});
  // 벽 띠 + 거울
  put(g, plane(11, 0.35), C.orange, {flat:true, ol:false, p:[0, 2.75, r.back+0.004]});
  put(g, plane(11, 0.08), C.yellow, {flat:true, ol:false, p:[0, 2.5, r.back+0.004]});
  mirrorWall(g, 0, 1.2, r.back+0.01, 7.5, 1.9);
  for (const x of [-4.6, 4.6]) windowAt(g, x, 1.9, r.back+0.01, 1.2, 1.4);
  // 옆과 뒤 기구
  addProp(g, 'squatRack', -3.9, -2.6, 0);
  addProp(g, 'dumbbellRack', 2.3, -4.35, 0);
  addProp(g, 'platesTree', 4.4, -3.6, 0);
  addProp(g, 'flatBench', 3.8, -1.7, 90);
  addProp(g, 'inclineBench', -1.9, -3.9, 0);
  addProp(g, 'kettlebell', 1.0, -4.3); addProp(g, 'kettlebell', 1.3, -4.3, 0, 0.85); addProp(g, 'kettlebell', 0.72, -4.3, 0, 0.75);
  // 케이블 머신 실루엣
  const cm = new T.Group(); cm.position.set(-5.0, 0, -0.8); cm.rotation.y = 90*D; g.add(cm);
  for (const x of [-0.7, 0.7]) put(cm, rbox(0.1, 2.3, 0.1, 0.01), C.dark, {p:[x, 1.15, 0], ol:0.005});
  put(cm, rbox(1.5, 0.1, 0.12, 0.01), C.dark, {p:[0, 2.3, 0], ol:0.005});
  put(cm, rbox(0.3, 0.7, 0.2, 0.02), C.steel, {p:[-0.4, 0.5, 0], ol:0.005}); put(cm, rbox(0.3, 0.7, 0.2, 0.02), C.steel, {p:[0.4, 0.5, 0], ol:0.005});
  put(cm, rbox(1.6, 0.06, 0.6, 0.01), C.dark, {p:[0, 0.03, 0], ol:0.004});
  addProp(g, 'yogaMat', -2.6, -0.2, 90, 1).position.x = -4.2;
  // 시계
  put(g, cyl(0.25, 0.25, 0.04, 28), C.white, {p:[3.0, 2.25, r.back+0.03], r:[90,0,0], ol:0.008});
  rod(g, [3.0, 2.25, r.back+0.06], [3.0, 2.4, r.back+0.06], 0.01, C.ink, {ol:false}); rod(g, [3.0, 2.25, r.back+0.06], [3.1, 2.25, r.back+0.06], 0.01, C.ink, {ol:false});
  g.userData = {id:'gym', floorY:0, stage:{cx:0, cz:0.3, w:5, d:3.5}, sky:'#2B2E33', cam:{pos:[0,1.5,6.4], target:[0,0.95,0]}};
  return g;
});

set('pilates', '필라테스 샵', () => {
  const g = new T.Group(); g.name = 'set-pilates';
  const r = room(g, {w:11, d:8, h:3.4, floor:0xE6CFA8, wall:0xF8F5EF, side:0xF1ECE3, base:0xE0D6C6});
  for (let i = -10; i <= 10; i++) put(g, plane(0.012, 8), 0xD8BE94, {flat:true, ol:false, r:[-90,0,0], p:[i*0.28, 0.002, -1]});
  for (const x of [-3.2, 0, 3.2]) windowAt(g, x, 1.85, r.back+0.01, 2.0, 1.9, {frame:0xFFFFFF, glass:0xDCEFE6});
  put(g, plane(11, 0.25), C.sage, {flat:true, ol:false, p:[0, 0.35, r.back+0.004]});
  // 리포머들
  addProp(g, 'reformer', -3.6, -3.2, 0); addProp(g, 'reformer', 3.6, -3.2, 0);
  addProp(g, 'cadillac', -4.7, -0.4, 90);
  addProp(g, 'wundaChair', 4.6, -1.0, -90);
  addProp(g, 'ladderBarrel', 4.6, 0.6, -90);
  // 선반과 소도구
  put(g, rbox(2.2, 0.05, 0.3, 0.01), C.woodL, {p:[0, 1.0, r.back+0.15], ol:0.004});
  for (let i = 0; i < 3; i++){ const rg = addProp(g, 'pilatesRing', -0.6+i*0.4, r.back+0.15); rg.position.y = 1.025; rg.scale.setScalar(0.9); }
  for (const [x,c] of [[-1.5, C.sky],[1.5, C.coral]]){ const b = addProp(g, 'gymBall', x, r.back+0.45); b.children.forEach(m => { if (m.material && m.material.color) m.material = mat(c); }); }
  const rolls = addProp(g, 'yogaMatRolled', 2.5, r.back+0.25, 90); const r2 = addProp(g, 'yogaMatRolled', 2.65, r.back+0.25, 90); r2.position.y = 0.12;
  tallPlant(g, -5.0, -4.2, 1.1); tallPlant(g, 5.0, -4.2, 1.0); plant(g, -2.0, r.back+0.35, 0.9, C.cream);
  frameArt(g, -4.2, 2.0, r.back+0.02, 0.8, 1.0, [0xEFE6D6, C.sage, C.coral]);
  frameArt(g, 4.2, 2.0, r.back+0.02, 0.8, 1.0, [0xEFE6D6, C.coral, C.sky]);
  // 매달린 조명
  for (const x of [-2, 0, 2]){ rod(g, [x, 3.4, -1.5], [x, 2.7, -1.5], 0.006, C.ink, {ol:false}); put(g, cone(0.22, 0.2, 20), C.cream, {p:[x, 2.62, -1.5], ol:0.006}); }
  g.userData = {id:'pilates', floorY:0, stage:{cx:0, cz:0.3, w:5, d:3.5}, sky:'#F3EEE6', cam:{pos:[0,1.5,6.4], target:[0,0.9,0]}};
  return g;
});

set('street', '거리', () => {
  const g = new T.Group(); g.name = 'set-street';
  // 인도 (무대) + 연석 + 도로
  const sw = put(g, plane(30, 6), 0xD8D2C6, {r:[-90,0,0], p:[0, 0, 0], ol:false}); sw.userData.floor = true;
  for (let i = -15; i <= 15; i++) put(g, plane(0.015, 6), 0xC2BBAE, {flat:true, ol:false, r:[-90,0,0], p:[i, 0.002, 0]});
  for (let j = -2; j <= 2; j++) put(g, plane(30, 0.015), 0xC2BBAE, {flat:true, ol:false, r:[-90,0,0], p:[0, 0.002, j]});
  put(g, rbox(30, 0.15, 0.25, 0.02), 0xB9B2A5, {p:[0, -0.05, 3.1], ol:0.004});
  put(g, plane(30, 10), 0x55595F, {r:[-90,0,0], p:[0, -0.12, 8.2], ol:false});
  for (let i = -14; i <= 14; i += 3) put(g, plane(1.6, 0.15), 0xF2EFE6, {flat:true, ol:false, r:[-90,0,0], p:[i, -0.115, 6.5]});
  // 건물 정면
  const B = [[-9,4.2,0xE9B98F],[-4.6,4.4,0xF2E2C4],[-0.2,4.2,0xA9CBB7],[4.2,4.6,0xE6A6A0],[8.8,4.4,0xC4C8E2]];
  B.forEach(([x,w,c], i) => {
    const h = 6 + (i%2)*1.6;
    put(g, rbox(w, h, 0.6, 0.03), c, {p:[x, h/2, -3.3], ol:0.01});
    put(g, rbox(w+0.1, 0.18, 0.75, 0.02), 0xFFFFFF, {p:[x, h, -3.25], ol:0.006});
    // 1층 가게
    put(g, plane(w*0.7, 1.6), 0xCFE7F2, {flat:true, ol:false, p:[x, 1.25, -2.995]});
    put(g, rbox(w*0.72+0.1, 0.08, 0.06, 0.01), C.dark, {p:[x, 2.08, -2.97], ol:0.003});
    const awn = put(g, rbox(w*0.8, 0.06, 0.8, 0.02), [C.red, C.green, C.orange, C.blue, C.yellow][i], {p:[x, 2.45, -2.6], r:[18,0,0], ol:0.006});
    put(g, plane(w*0.45, 0.32), 0xFFFFFF, {flat:true, ol:false, p:[x, 2.85, -2.995]});
    put(g, plane(w*0.3, 0.08), C.ink, {flat:true, ol:false, p:[x, 2.85, -2.99]});
    for (let row = 0; row < (h > 7 ? 3 : 2); row++) for (const dx of [-w/4, w/4]) windowAt(g, x+dx, 3.8+row*1.5, -2.99, 0.9, 1.0, {frame:0xFFFFFF});
  });
  // 가로수, 가로등, 벤치
  for (const x of [-6.5, 6.5]){
    put(g, cyl(0.09, 0.12, 2.4, 12), 0x7A5A3A, {p:[x, 1.2, -1.9], ol:0.006});
    put(g, sph(0.9, 18), 0x6DAE5C, {p:[x, 2.9, -1.9], s:[1,0.9,1], ol:0.012}); put(g, sph(0.6, 16), 0x7FBE6A, {p:[x+0.5, 3.3, -1.7], ol:0.01});
    put(g, cyl(0.5, 0.5, 0.03, 20), 0x6B4B33, {p:[x, 0.015, -1.9], ol:false});
  }
  for (const x of [-3.4, 3.4]){
    rod(g, [x, 0, -2.2], [x, 3.6, -2.2], 0.05, C.dark, {ol:0.005});
    rod(g, [x, 3.6, -2.2], [x, 3.6, -1.6], 0.04, C.dark, {ol:0.004});
    put(g, cone(0.2, 0.2, 16), C.dark, {p:[x, 3.5, -1.55], ol:0.005}); put(g, sph(0.09, 12), 0xFFF2B3, {p:[x, 3.42, -1.55], flat:true, ol:false});
  }
  const bench = new T.Group(); bench.position.set(9.5, 0, -2.0); g.add(bench);
  put(bench, rbox(1.6, 0.05, 0.4, 0.01), C.wood, {p:[0, 0.45, 0], ol:0.004}); put(bench, rbox(1.6, 0.3, 0.04, 0.01), C.wood, {p:[0, 0.7, -0.18], ol:0.004});
  for (const s of [-1,1]) put(bench, rbox(0.06, 0.45, 0.4, 0.01), C.dark, {p:[s*0.7, 0.225, 0], ol:0.004});
  // 먼 하늘 구름
  for (const [x,y] of [[-8,9],[2,10.5],[10,8.5]]) for (let k = 0; k < 3; k++) put(g, sph(0.9-k*0.15, 14), 0xFFFFFF, {flat:true, p:[x+k*0.9, y+(k%2)*0.3, -12], ol:false});
  g.userData = {id:'street', floorY:0, stage:{cx:0, cz:0.5, w:6, d:4}, sky:'#BFE3F2', cam:{pos:[0,1.5,7.0], target:[0,1.0,0]}, fog:{color:'#BFE3F2', near:18, far:40}};
  return g;
});

set('home', '집 안', () => {
  const g = new T.Group(); g.name = 'set-home';
  const r = room(g, {w:10, d:7.5, h:3.0, floor:0xD2A574, wall:0xF6EBDD, side:0xEFE2D0, base:0xFFFFFF});
  for (let i = -18; i <= 18; i++) put(g, plane(0.012, 7.5), 0xC08F5E, {flat:true, ol:false, r:[-90,0,0], p:[i*0.28, 0.002, -0.75]});
  // 러그
  put(g, rbox(3.4, 0.012, 2.4, 0.01), 0xE8D5B5, {p:[0, 0.006, 0.2], ol:0.003});
  put(g, rbox(3.0, 0.004, 2.0, 0.005), 0xD9BF97, {p:[0, 0.013, 0.2], ol:false});
  addProp(g, 'sofa', 0, -3.6, 0);
  // TV 장
  const tv = new T.Group(); tv.position.set(-3.6, 0, -1.4); tv.rotation.y = 90*D; g.add(tv);
  put(tv, rbox(1.8, 0.45, 0.45, 0.03), C.woodL, {p:[0, 0.225, 0]});
  put(tv, rbox(1.4, 0.8, 0.05, 0.02), C.ink, {p:[0, 0.95, -0.05], ol:0.006}); put(tv, plane(1.3, 0.7), 0x30404F, {flat:true, ol:false, p:[0, 0.95, -0.02]});
  windowAt(g, 2.6, 1.6, r.back+0.01, 1.8, 1.5, {frame:0xFFFFFF, glass:0xD5ECF7});
  for (const s of [-1,1]) put(g, rbox(0.5, 2.3, 0.06, 0.03), 0xE9B98F, {p:[2.6+s*1.2, 1.4, r.back+0.08]});
  rod(g, [1.2, 2.6, r.back+0.1], [4.0, 2.6, r.back+0.1], 0.015, C.woodD, {ol:0.003});
  plant(g, 4.2, -3.9, 1.1, C.sky); tallPlant(g, -4.3, -3.9, 1.0);
  // 스탠드
  rod(g, [-1.6, 0, -3.8], [-1.6, 1.5, -3.8], 0.02, C.dark, {ol:0.004}); put(g, cone(0.25, 0.3, 20), C.cream, {p:[-1.6, 1.55, -3.8], ol:0.006});
  frameArt(g, -0.6, 1.9, r.back+0.02, 0.9, 0.7, [0xF2E6D2, C.orange, C.sky]); frameArt(g, 0.6, 1.95, r.back+0.02, 0.6, 0.8, [0xEEF4EA, C.green, C.yellow]);
  // 낮은 탁자
  put(g, rbox(0.9, 0.05, 0.5, 0.02), C.woodL, {p:[3.4, 0.42, -1.6], ol:0.004});
  for (const x of [-0.38, 0.38]) for (const z of [-0.2, 0.2]) put(g, rbox(0.04, 0.4, 0.04, 0.01), C.woodD, {p:[3.4+x, 0.2, -1.6+z], ol:0.003});
  g.userData = {id:'home', floorY:0, stage:{cx:0, cz:0.3, w:4.5, d:3}, sky:'#F2E9DC', cam:{pos:[0,1.5,6.0], target:[0,0.9,0]}};
  return g;
});

set('bedroom', '침대 위', () => {
  const g = new T.Group(); g.name = 'set-bedroom';
  const r = room(g, {w:9, d:7, h:3.0, floor:0xC99B6C, wall:0xE6EEF5, side:0xDCE6EF, base:0xFFFFFF});
  for (let i = -16; i <= 16; i++) put(g, plane(0.012, 7), 0xB88A5C, {flat:true, ol:false, r:[-90,0,0], p:[i*0.28, 0.002, -0.5]});
  put(g, rbox(4.2, 0.012, 3.4, 0.01), 0xF1E3EC, {p:[0, 0.006, 0.4], ol:0.003});
  const BH = 0.5;
  const bed = new T.Group(); bed.position.set(0, 0, -0.1); g.add(bed);
  const W = 2.6, L = 2.4;
  put(bed, rbox(W+0.1, BH-0.22, L+0.1, 0.05), C.woodL, {p:[0, (BH-0.22)/2, 0]});
  const mt = put(bed, rbox(W, 0.24, L, 0.09), 0xFFFFFF, {p:[0, BH-0.12, 0]}); mt.userData.floor = true;
  put(bed, rbox(W+0.02, 0.05, 0.9, 0.05), 0xB8D4E8, {p:[0, BH+0.005, L/2-0.42]});
  put(bed, rbox(W+0.1, 1.0, 0.1, 0.05), C.wood, {p:[0, 0.5+0.1, -L/2-0.05]});
  for (const x of [-0.7, 0.7]) put(bed, rbox(0.7, 0.16, 0.4, 0.08), 0xFDF6E9, {p:[x, BH+0.07, -L/2+0.28], r:[-14,0,0]});
  for (const s of [-1,1]){
    const ns = new T.Group(); ns.position.set(s*(W/2+0.45), 0, -L/2+0.25); bed.add(ns);
    put(ns, rbox(0.5, 0.55, 0.42, 0.03), C.woodL, {p:[0, 0.275, 0]});
    rod(ns, [0,0.55,0], [0,0.85,0], 0.015, C.dark, {ol:0.003}); put(ns, cone(0.15, 0.2, 18), 0xFFE7B0, {p:[0, 0.9, 0], ol:0.005});
  }
  windowAt(g, 0, 1.9, r.back+0.01, 1.6, 1.0, {frame:0xFFFFFF, glass:0xCFE6F5});
  frameArt(g, -2.6, 1.8, r.back+0.02, 0.7, 0.9, [0xF4ECF2, 0xE3A6C0, C.sky]);
  plant(g, 3.4, -2.8, 1.0, C.cream); tallPlant(g, -3.6, -2.9, 0.9);
  g.userData = {id:'bedroom', floorY:BH, raised:{cx:0, cz:-0.1, w:W+0.1, d:L+0.1}, stage:{cx:0, cz:-0.1, w:W, d:L}, sky:'#EAF0F5', cam:{pos:[0,2.0,5.2], target:[0,1.2,0]}};
  return g;
});

window.StudioAssets = {version:1, props:P, sets:S, addOutline, mat, flat, put, rod, rbox, cyl, sph, tor, gradMap, colors:C};
})();

