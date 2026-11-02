(function(){
'use strict';
/* ===== 스튜디오 엔진: 기준 뼈대, 모델, 출연자, 접지·발 고정(IK), 기구 쥐기 ===== */
const T = THREE, D2R = Math.PI/180, R2D = 180/Math.PI;
const $ = s => document.querySelector(s);
const AS = window.StudioAssets;

/* ---------- 기준 뼈대 관절 ---------- */
const GROUPS = [
  ['몸통',   ['hips','spine','chest','neck']],
  ['머리',   ['head','jaw']],
  ['왼팔',   ['shoulderL','upperArmL','forearmL','handL']],
  ['오른팔', ['shoulderR','upperArmR','forearmR','handR']],
  ['왼다리', ['thighL','shinL','footL','toeL']],
  ['오른다리',['thighR','shinR','footR','toeR']],
];
const PRO_GROUPS = [['손가락', ['pointL','fingersL','thumbL','pointR','fingersR','thumbR']]];
const BONES = ['hips','spine','chest','neck','head','jaw','shoulderL','upperArmL','forearmL','handL','fingersL','thumbL','pointL',
  'shoulderR','upperArmR','forearmR','handR','fingersR','thumbR','pointR','thighL','shinL','footL','toeL','thighR','shinR','footR','toeR'];
const LABEL = {hips:'골반(루트)',spine:'허리',chest:'가슴',neck:'목',head:'머리',jaw:'아래턱·부리',
  shoulderL:'왼어깨',upperArmL:'왼위팔',forearmL:'왼아래팔',handL:'왼손목',fingersL:'왼손가락(약지·새끼)',thumbL:'왼엄지',pointL:'왼검지·중지',
  shoulderR:'오른어깨',upperArmR:'오른위팔',forearmR:'오른아래팔',handR:'오른손목',fingersR:'오른손가락(약지·새끼)',thumbR:'오른엄지',pointR:'오른검지·중지',
  thighL:'왼허벅지',shinL:'왼정강이',footL:'왼발목',toeL:'왼발가락',thighR:'오른허벅지',shinR:'오른정강이',footR:'오른발목',toeR:'오른발가락'};
const SHORT = {hips:'골반',spine:'허리',chest:'가슴',neck:'목',head:'머리',jaw:'턱',shoulderL:'어깨',upperArmL:'위팔',forearmL:'아래팔',handL:'손목',
  shoulderR:'어깨',upperArmR:'위팔',forearmR:'아래팔',handR:'손목',thighL:'허벅지',shinL:'정강이',footL:'발목',toeL:'발가락',thighR:'허벅지',shinR:'정강이',footR:'발목',toeR:'발가락',
  fingersL:'왼손가락',fingersR:'오른손가락',thumbL:'왼엄지',thumbR:'오른엄지',pointL:'왼검지',pointR:'오른검지'};
const PARENT = {spine:'hips',chest:'spine',neck:'chest',head:'neck',jaw:'head',
  shoulderL:'chest',upperArmL:'shoulderL',forearmL:'upperArmL',handL:'forearmL',fingersL:'handL',thumbL:'handL',pointL:'handL',
  shoulderR:'chest',upperArmR:'shoulderR',forearmR:'upperArmR',handR:'forearmR',fingersR:'handR',thumbR:'handR',pointR:'handR',
  thighL:'hips',shinL:'thighL',footL:'shinL',toeL:'footL',thighR:'hips',shinR:'thighR',footR:'shinR',toeR:'footR'};
const DRV_J = {hips:[0,0.24,0],spine:[0,0.04,0],chest:[0,0.12,0],neck:[0,0.10,0],head:[0,0,0],jaw:[0,0.135,0.183],
  shoulderL:[0.16,0.07,0],upperArmL:[0.035,0,0],forearmL:[0,-0.11,0],handL:[0,-0.09,0],fingersL:[0,-0.04,0],thumbL:[0,-0.02,0.01],pointL:[0,-0.04,0.005],
  shoulderR:[-0.16,0.07,0],upperArmR:[-0.035,0,0],forearmR:[0,-0.11,0],handR:[0,-0.09,0],fingersR:[0,-0.04,0],thumbR:[0,-0.02,0.01],pointR:[0,-0.04,0.005],
  thighL:[0.07,-0.04,0],shinL:[0,-0.075,0],footL:[0,-0.085,0],toeL:[0,-0.01,0.05],
  thighR:[-0.07,-0.04,0],shinR:[0,-0.075,0],footR:[0,-0.085,0],toeR:[0,-0.01,0.05]};
function makeDriver(){
  const group = new T.Group(), bones = {};
  for (const n of BONES){ const b = new T.Group(); b.name = n; b.position.fromArray(DRV_J[n]); bones[n] = b; }
  for (const n of BONES) (n === 'hips' ? group : bones[PARENT[n]]).add(bones[n]);
  return {group, bones, base:new T.Vector3().fromArray(DRV_J.hips), hipH:DRV_J.hips[1]};
}

/* ---------- 포즈 ---------- */
function identityPose(){ const p = {rot:{}, root:new T.Vector3()}; for (const b of BONES) p.rot[b] = new T.Quaternion(); return p; }
function copyPose(src, dst){ for (const b of BONES) dst.rot[b].copy(src.rot[b]); dst.root.copy(src.root); return dst; }
function clonePose(p){ return copyPose(p, identityPose()); }
const qE = (x,y,z) => new T.Quaternion().setFromEuler(new T.Euler(x*D2R, y*D2R, z*D2R, 'XYZ'));
const r5 = v => Math.round(v*1e5)/1e5;
function serPose(p){ const rot = {}; for (const b of BONES){ const q = p.rot[b]; if (Math.abs(q.w) < 0.999999) rot[b] = [r5(q.x),r5(q.y),r5(q.z),r5(q.w)]; } return {root:[r5(p.root.x),r5(p.root.y),r5(p.root.z)], rot}; }
function desPose(o){ const p = identityPose(); if (o.root) p.root.fromArray(o.root); for (const b in (o.rot||{})) if (p.rot[b]) p.rot[b].fromArray(o.rot[b]).normalize(); return p; }

/* 접지 정보(키마다): g 접지 방식, pl 발 고정 가중치 [왼,오], st 발 위치 [[dx,dz],[dx,dz]](골반높이 배율), hr 뒤꿈치 들기(도) */
function defMeta(){ return {g:'feet', pl:[1,1], st:[[0,0],[0,0]], hr:[0,0], hw:[0,0], ht:[null,null], rf:0, cx:0, sl:[0,0], ey:0}; }
function lerpMeta(a, b, u, out){
  // 엎드림(손 짚기)↔서기: 손은 먼저 짚고 늦게 뗌 (버피·태양경배처럼 손이 바닥을 받치는 동안은 엎드림 방식 유지)
  const sw = 0.5;
  out.g = u < sw ? a.g : b.g;
  out.ey = (a.ey || 0) + ((b.ey || 0) - (a.ey || 0)) * u;
  out.rf = (a.rf || 0) + ((b.rf || 0) - (a.rf || 0)) * u; out.cx = (a.cx || 0) + ((b.cx || 0) - (a.cx || 0)) * u;
  for (let i = 0; i < 2; i++){
    out.pl[i] = a.pl[i] + (b.pl[i]-a.pl[i])*u; out.hr[i] = a.hr[i] + (b.hr[i]-a.hr[i])*u;
    const wa = a.hw ? a.hw[i] : 0, wb = b.hw ? b.hw[i] : 0;
    if (!out.hw) out.hw = [0,0]; if (!out.ht) out.ht = [null,null];
    out.hw[i] = wa + (wb - wa)*u; out.ht[i] = (wb > wa || (wb === wa && u >= 0.5)) ? (b.ht ? b.ht[i] : null) : (a.ht ? a.ht[i] : null);
    // 손 닿는 곳이 바뀌는 사이에는 두 곳 사이를 부드럽게 옮겨 감 (한순간에 튀지 않게)
    if (!out.hx) out.hx = [null, null];
    const na = a.ht ? a.ht[i] : null, nb = b.ht ? b.ht[i] : null;
    out.hx[i] = (na && nb && na !== nb && wa > 0.01 && wb > 0.01) ? {a:na, b:nb, wa:wa * (1 - u), wb:wb * u} : null;
    out.st[i][0] = a.st[i][0] + (b.st[i][0]-a.st[i][0])*u; out.st[i][1] = a.st[i][1] + (b.st[i][1]-a.st[i][1])*u;
    // 디딘 발의 자리가 바뀌면 끌지 말고 살짝 들어 옮김 (걸음처럼)
    if (!out.sl) out.sl = [0, 0];
    const dst = Math.hypot(b.st[i][0] - a.st[i][0], b.st[i][1] - a.st[i][1]);
    out.sl[i] = (dst > 0.04 && a.pl[i] > 0.5 && b.pl[i] > 0.5) ? Math.sin(Math.PI * u) * Math.min(1, dst / 0.25) : 0;
  }
  return out;
}
function cloneMeta(m){ return {g:m.g, pl:m.pl.slice(), st:[m.st[0].slice(), m.st[1].slice()], hr:m.hr.slice(), hw:(m.hw || [0,0]).slice(), ht:(m.ht || [null,null]).slice(), rf:m.rf || 0, cx:m.cx || 0, sl:(m.sl || [0,0]).slice(), ey:m.ey || 0}; }

/* ---------- 렌더러·장면 ---------- */
const view = $('#view');
const renderer = new T.WebGLRenderer({antialias:true, preserveDrawingBuffer:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.autoClear = false;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
view.appendChild(renderer.domElement);
const scene = new T.Scene(), overlay = new T.Scene();
const cam = new T.PerspectiveCamera(30, 16/9, 0.05, 200);
cam.position.set(0, 1.4, 6.5);
const orbit = new T.OrbitControls(cam, renderer.domElement);
orbit.enableDamping = true; orbit.target.set(0, 0.9, 0); orbit.maxPolarAngle = Math.PI*0.495; orbit.update();
const tc = new T.TransformControls(cam, renderer.domElement);
tc.setSize(0.8); overlay.add(tc);
const hemi = new T.HemisphereLight(0xffffff, 0xcfc6b8, 0.56); scene.add(hemi);
const sun = new T.DirectionalLight(0xffffff, 0.46); sun.position.set(2.5, 5, 4); scene.add(sun); scene.add(sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
Object.assign(sun.shadow.camera, {left:-4, right:4, top:4, bottom:-4, near:0.5, far:20});
const rim = new T.DirectionalLight(0xfff4e6, 0.2); rim.position.set(-3, 4, -5); scene.add(rim);   // 뒤쪽 테두리 빛
const world = new T.Group(); scene.add(world);           // 배경
const propLayer = new T.Group(); scene.add(propLayer);   // 놓은 소품
const actorLayer = new T.Group(); scene.add(actorLayer); // 출연자

const GC = ['getX','getY','getZ','getW'];
function gc(a, i, k){ return a[GC[k]](i); }
/* ---------- 재질 ---------- */
const INK = 0x1d1a17;
function toon(color, o){ return new T.MeshToonMaterial(Object.assign({color, gradientMap:AS.gradMap(), skinning:true}, o||{})); }
// 눈 감는 동안 눈 테두리 두께를 줄여 감은 눈 둘레에 고리 자국이 안 남게 (출연자마다 따로)
function outlineBlinkMat(w){
  const mat = new T.MeshBasicMaterial({color:INK, side:T.BackSide, skinning:true, morphTargets:true});
  const uB = {value:0}; mat.userData = {w, uB, blink:true};
  mat.onBeforeCompile = sh => { sh.uniforms.uW = {value:w}; sh.uniforms.uBlink = uB;
    sh.vertexShader = 'uniform float uW;\nuniform float uBlink;\nattribute float eyeM;\n' + sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed = vec3(position) + normal * uW * (1.0 - eyeM * uBlink);'); };
  mat.customProgramCacheKey = () => 'olBlink';
  return mat;
}
function outlineSkinned(mesh, w){
  let mat;
  if (mesh.geometry.userData.blink) mat = outlineBlinkMat(w);
  else { mat = new T.MeshBasicMaterial({color:INK, side:T.BackSide, skinning:true, morphTargets:!!mesh.geometry.morphAttributes.position});
    mat.onBeforeCompile = sh => { sh.uniforms.uW = {value:w};
      sh.vertexShader = 'uniform float uW;\n' + sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed = vec3(position) + normal * uW;'); }; }
  const o = new T.SkinnedMesh(mesh.geometry, mat); o.bind(mesh.skeleton, mesh.bindMatrix); o.updateMorphTargets();
  o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale);
  o.frustumCulled = false; o.renderOrder = -1; o.userData.outline = true; o.raycast = () => {};
  mesh.parent.add(o); return o;
}

/* ---------- 관절 쓸 때 홀쭉해지기: 몸 겉모양만 가늘게 하는 모프(블렌드 셰이프) ----------
   0 왼팔 · 1 오른팔 · 2 왼다리 · 3 오른다리 · 4 몸통. 뼈 길이·발 위치는 그대로라 바닥 닿는 곳은 안 바뀜 */
const SLIM = {human:{limb:0.14, torso:0.06}, chibi:{limb:0.3, torso:0.3}};
function buildSlimMorphs(tpl){
  const kind = tpl.id, mp = mapFor(tpl.def.kind === 'human' ? 'human' : 'meshy');
  const H = mp.handle, k = kind === 'human' ? SLIM.human : SLIM.chibi;
  for (const mesh of tpl.meshes){
    const g = mesh.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    if (!pos || !si) continue;
    const sk = mesh.skeleton, names = sk.bones.map(b => b.name);
    const bp = sk.boneInverses.map(m => new T.Vector3().setFromMatrixPosition(new T.Matrix4().copy(m).invert()));   // 묶을 때 뼈 위치
    const idx = n => names.indexOf(n);
    const desc = n => { const out = new Set(); const b = sk.bones[idx(n)]; if (b) b.traverse(o => { if (o.isBone) out.add(idx(o.name)); }); return out; };
    // 팔·다리 구간: [시작뼈, 끝뼈] (끝뼈 아래 손·발은 그대로)
    const segs = [];
    for (const [ti, sd, a, b, c] of [[0,'L','upperArm','forearm','hand'],[1,'R','upperArm','forearm','hand'],[2,'L','thigh','shin','foot'],[3,'R','thigh','shin','foot']]){
      const ia = idx(H[a+sd]), ib = idx(H[b+sd]), ic = idx(H[c+sd]); if (ia < 0 || ib < 0 || ic < 0) continue;
      const all = desc(H[a+sd]), end = desc(H[c+sd]);
      segs.push({ti, set:new Set([...all].filter(i => !end.has(i))), p:[bp[ia], bp[ib], bp[ic]]});
    }
    const trunk = new Set(['hips','spine','chest'].map(n => idx(H[n])).filter(i => i >= 0));
    // 몸통 축: 골반 → 가슴
    const ih = idx(H.hips), ic2 = idx(H.chest), iN = idx(H.neck);
    const n = pos.count, tg = [0,1,2,3,4].map(() => new Float32Array(n*3));
    const bm = mesh.bindMatrix, bmi = mesh.bindMatrixInverse, lin = new T.Matrix3().setFromMatrix4(bmi);
    const v = new T.Vector3(), q = new T.Vector3(), d = new T.Vector3(), ab = new T.Vector3();
    for (let i = 0; i < n; i++){
      v.fromBufferAttribute(pos, i).applyMatrix4(bm);
      const wOf = set => { let w = 0; for (let j = 0; j < 4; j++){ if (set.has(gc(si,i,j))) w += gc(sw,i,j); } return w; };
      for (const S_ of segs){
        const w = wOf(S_.set); if (w < 0.02) continue;
        // 가장 가까운 축 위의 점
        let best = 1e9;
        for (let j = 0; j < 2; j++){
          const a = S_.p[j], b = S_.p[j+1]; ab.copy(b).sub(a);
          const t = Math.max(0, Math.min(1, d.copy(v).sub(a).dot(ab) / Math.max(1e-9, ab.lengthSq())));
          const qq = a.clone().addScaledVector(ab, t), dist = qq.distanceTo(v);
          if (dist < best){ best = dist; q.copy(qq); }
        }
        d.copy(q).sub(v).multiplyScalar(k.limb * w).applyMatrix3(lin);
        tg[S_.ti][i*3] = d.x; tg[S_.ti][i*3+1] = d.y; tg[S_.ti][i*3+2] = d.z;
      }
      if (ih >= 0 && ic2 >= 0){
        const w = wOf(trunk); if (w < 0.02) continue;
        // 몸통: 척추선에서 앞뒤(z)는 많이, 옆(x)은 조금 안쪽으로
        const a = bp[ih], b = bp[iN >= 0 ? iN : ic2]; ab.copy(b).sub(a);
        const t = Math.max(0, Math.min(1, d.copy(v).sub(a).dot(ab) / Math.max(1e-9, ab.lengthSq())));
        q.copy(a).addScaledVector(ab, t);
        // 배만 살짝 집어넣기 (등은 그대로): 척추선보다 앞쪽 점만, 배 높이에서 가장 많이
        if (v.z <= q.z) continue;
        const belly = Math.max(0, 1 - Math.abs(t - 0.35) / 0.4);
        d.set(0, 0, (q.z - v.z) * k.torso).multiplyScalar(w * belly).applyMatrix3(lin);
        tg[4][i*3] = d.x; tg[4][i*3+1] = d.y; tg[4][i*3+2] = d.z;
      }
    }
    g.morphAttributes.position = tg.map(a => new T.BufferAttribute(a, 3));
    g.morphTargetsRelative = true;
    mesh.updateMorphTargets();
    if (mesh.material) mesh.material.morphTargets = true, mesh.material.needsUpdate = true;
    // 바닥 계산용 (CPU에서 모프까지 반영)
    g.userData.slim = tg;
  }
}
// 모프까지 반영한 피부 점 위치 (메시 공간)
const _bpv = new T.Vector3(), _bmx = new T.Matrix4(), _bv2 = new T.Vector3();
function skinPoint(m, i, out){
  const g = m.geometry, sk = m.skeleton, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  _bpv.fromBufferAttribute(g.attributes.position, i);
  const tg = g.userData.slim, inf = m.morphTargetInfluences;
  if (tg && inf) for (let k = 0; k < tg.length; k++){ const f = inf[k]; if (f) { _bpv.x += tg[k][i*3]*f; _bpv.y += tg[k][i*3+1]*f; _bpv.z += tg[k][i*3+2]*f; } }
  _bpv.applyMatrix4(m.bindMatrix); out.set(0,0,0);
  for (let j = 0; j < 4; j++){
    const w = gc(sw,i,j); if (!w) continue; const bi = gc(si,i,j);
    _bmx.multiplyMatrices(sk.bones[bi].matrixWorld, sk.boneInverses[bi]);
    out.addScaledVector(_bv2.copy(_bpv).applyMatrix4(_bmx), w);
  }
  return out.applyMatrix4(m.bindMatrixInverse);
}
/* ---------- 눈 깜박임: 동그란 눈(검은 부분 중 둥근 덩어리 두 개)을 위아래로 납작하게 → 감은 눈 선 ----------
   모프 6번째(번호 5). 속눈썹은 윗눈꺼풀을 따라 같이 내려옴 */
const BLINK_IDX = 5;
function buildBlinkMorph(tpl){
  for (const mesh of tpl.meshes){
    const g = mesh.geometry, pos = g.attributes.position; if (!pos || !g.morphAttributes.position) continue;
    const n = pos.count, tg = new Float32Array(n*3);
    if (tpl.def.kind !== 'human' && mesh.userData.ink && g.index){
      const bm = mesh.bindMatrix, lin = new T.Matrix3().setFromMatrix4(mesh.bindMatrixInverse);
      const P = []; const v = new T.Vector3();
      for (let i = 0; i < n; i++){ v.fromBufferAttribute(pos, i).applyMatrix4(bm); P.push(v.clone()); }
      // 같은 자리 점 묶기 → 삼각형으로 이어진 덩어리 찾기
      const key = new Map(), rep = new Int32Array(n);
      for (let i = 0; i < n; i++){ const q = P[i], k = Math.round(q.x*1e5)+','+Math.round(q.y*1e5)+','+Math.round(q.z*1e5); if (!key.has(k)) key.set(k, i); rep[i] = key.get(k); }
      const par = new Int32Array(n).map((_, i) => i);
      const fd = x => { while (par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
      const ix = g.index.array;
      for (let t = 0; t < ix.length; t += 3){ const a = fd(rep[ix[t]]), b = fd(rep[ix[t+1]]), c = fd(rep[ix[t+2]]); par[b] = a; par[fd(c)] = a; }
      const comps = new Map();
      for (let i = 0; i < n; i++){ const r = fd(rep[i]); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(i); }
      const info = [...comps.values()].map(vs => { const mn = new T.Vector3(1e9,1e9,1e9), mx = new T.Vector3(-1e9,-1e9,-1e9);
        for (const i of vs){ mn.min(P[i]); mx.max(P[i]); }
        const sz = mx.clone().sub(mn); return {vs, mn, mx, c:mn.clone().add(mx).multiplyScalar(0.5), w:sz.x, h:sz.y}; });
      const eyes = info.filter(o => o.h > 1e-4 && o.w / o.h > 0.5 && o.w / o.h < 2).sort((a, b) => b.vs.length - a.vs.length).slice(0, 2);
      if (eyes.length === 2 && Math.abs(eyes[0].c.y - eyes[1].c.y) < eyes[0].h){
        const d = new T.Vector3();
        // 감은 눈: 가운데보다 조금 아래, 두께 14%, 양 끝이 살짝 올라간 선(∪)
        const lidY = (E, x, y) => { const hh = E.h/2, hw = E.w/2, dx = Math.max(-1, Math.min(1, (x - E.c.x) / hw)); return E.c.y - 0.3*hh + (y - E.c.y)*0.14 + 0.28*hh*dx*dx; };
        const em = new Float32Array(n); for (const E of eyes) for (const i of E.vs) em[i] = 1; g.setAttribute('eyeM', new T.BufferAttribute(em, 1));
        for (const E of eyes) for (const i of E.vs){ const q = P[i]; d.set(0, lidY(E, q.x, q.y) - q.y, 0).applyMatrix3(lin); tg[i*3] = d.x; tg[i*3+1] = d.y; tg[i*3+2] = d.z; }
        // 속눈썹: 눈 바로 위 작은 덩어리 → 윗눈꺼풀이 내려간 만큼 같이
        for (const o of info){ if (eyes.includes(o)) continue;
          const E = eyes.reduce((b, e) => (o.c.distanceTo(e.c) < o.c.distanceTo(b.c) ? e : b));
          if (o.c.distanceTo(E.c) > Math.max(E.w, E.h) * 2.2 || o.c.y < E.c.y || o.vs.length > E.vs.length * 1.5) continue;
          for (const i of o.vs){ const q = P[i], top = E.c.y + E.h/2; d.set(0, lidY(E, q.x, top) - top, 0).applyMatrix3(lin); tg[i*3] = d.x; tg[i*3+1] = d.y; tg[i*3+2] = d.z; }
        }
        tpl.blink = true; g.userData.blink = true;
      }
    }
    while (g.morphAttributes.position.length < BLINK_IDX) g.morphAttributes.position.push(new T.BufferAttribute(new Float32Array(n*3), 3));
    g.morphAttributes.position[BLINK_IDX] = new T.BufferAttribute(tg, 3);
    if (g.userData.slim){ while (g.userData.slim.length < BLINK_IDX) g.userData.slim.push(new Float32Array(n*3)); g.userData.slim[BLINK_IDX] = tg; }
    mesh.updateMorphTargets();
  }
}
// 저절로 깜박임: 약 3~5초마다 한 번 (가끔 두 번 연속). 시간만으로 정해져서 영상으로 뽑아도 항상 같음
const EYES = {auto:true, t:0};
function hash01(n){ const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function autoBlink(t, seed){
  const P = 3.4, tt = t + seed * 1.37, k = Math.floor(tt / P);
  let v = 0;
  for (const kk of [k - 1, k]){
    const s0 = kk * P + hash01(kk + seed * 17) * 2.4;
    const one = s => { const u = (tt - s) / 0.17; if (u <= 0 || u >= 1) return 0; return u < 0.4 ? u / 0.4 : 1 - (u - 0.4) / 0.6; };
    v = Math.max(v, one(s0)); if (hash01(kk * 3.1 + seed) < 0.22) v = Math.max(v, one(s0 + 0.3));
  }
  return v;
}
function setBlink(A, v){
  for (const m of A.inst.all){ const inf = m.morphTargetInfluences; if (inf && inf.length > BLINK_IDX) inf[BLINK_IDX] = v;
    if (m.material && m.material.userData && m.material.userData.uB) m.material.userData.uB.value = v; }
}
function updateEyes(A){
  const c = A.clip, capEye = c && c.source === 'capture' && c.keys && (c._ey ?? (c._ey = c.keys.some(k => k.meta && k.meta.ey != null)));
  const auto = EYES.auto && !capEye && A.liveEye == null ? autoBlink(EYES.t, parseInt(String(A.id).slice(1)) || 0) : 0;
  const v = Math.max(auto, (A.meta && A.meta.ey) || 0, A.liveEye || 0);
  A.eye = Math.max(0, Math.min(1, v)); setBlink(A, A.eye);
}
// 출연자의 모프 세기 맞추기 (몸 메시 + 테두리 메시 모두)
function setSlim(A, vals){
  for (const m of A.inst.all){ const inf = m.morphTargetInfluences; if (!inf) continue; for (let k = 0; k < vals.length && k < inf.length; k++) inf[k] = vals[k]; }
}

/* ---------- 모델 정의 ---------- */
const MODEL_DEF = {
  jjak: {label:'짹짹이', H:1.0, outline:0.0065, kind:'meshy'},
  buri: {label:'부리부리', H:2.0, outline:0.012, kind:'meshy'},
  human:{label:'사람', H:1.74, outline:0.0035, kind:'human'},
};
// 기준 뼈대 → 모델 뼈
function mapFor(kind){
  const m = {}; const S = (a,b) => ({type:'dirSeg', a, b});
  if (kind === 'meshy'){
    m['Hips'] = {type:'rot', drv:'hips'}; m['Spine02'] = {type:'rot', drv:'spine'};
    m['Spine01'] = {type:'rot', drv:'spine', drv2:'chest', f:0.5}; m['Spine'] = {type:'rot', drv:'chest'};
    m['neck'] = {type:'rot', drv:'neck'}; m['Head'] = {type:'rot', drv:'head'}; m['jaw'] = {type:'rot', drv:'jaw'};
    for (const s of 'LR'){
      const N = s === 'L' ? 'Left' : 'Right';
      m[N+'Shoulder'] = {type:'rot', drv:'shoulder'+s};
      m[N+'Arm'] = {...S('upperArm'+s,'forearm'+s), end:N+'ForeArm'};
      m[N+'ForeArm'] = {...S('forearm'+s,'hand'+s), end:N+'Hand'};
      m[N+'Hand'] = {type:'handSeg', a:'forearm'+s, b:'hand'+s, from:N+'ForeArm'};
      m[N+'UpLeg'] = {...S('thigh'+s,'shin'+s), end:N+'Leg'};
      m[N+'Leg'] = {...S('shin'+s,'foot'+s), end:N+'Foot'};
      m[N+'Foot'] = {type:'dirRot', drv:'foot'+s, end:N+'ToeBase'};
      m[N+'ToeBase'] = {type:'rot', drv:'toe'+s};
    }
    const handle = {hips:'Hips', spine:'Spine02', chest:'Spine', neck:'neck', head:'Head', jaw:'jaw'};
    const legs = {};
    for (const s of 'LR'){ const N = s === 'L' ? 'Left' : 'Right';
      Object.assign(handle, {['shoulder'+s]:N+'Shoulder', ['upperArm'+s]:N+'Arm', ['forearm'+s]:N+'ForeArm', ['hand'+s]:N+'Hand',
        ['thigh'+s]:N+'UpLeg', ['shin'+s]:N+'Leg', ['foot'+s]:N+'Foot', ['toe'+s]:N+'ToeBase'});
      legs[s] = {up:N+'UpLeg', low:N+'Leg', foot:N+'Foot', toes:[N+'ToeBase'], ball:N+'ToeBase'}; }
    return {map:m, handle, legs, hands:{L:{wrist:'LeftHand', fore:'LeftForeArm'}, R:{wrist:'RightHand', fore:'RightForeArm'}},
      back:/^(Hips|Spine|Spine0[12]|neck|Head|jaw|LeftShoulder|RightShoulder)$/, seat:/^(Hips|LeftUpLeg|RightUpLeg)$/, feet:/(Foot|ToeBase)$/,
      shoulders:{L:'LeftArm', R:'RightArm'}, hipsBone:'Hips', headBone:'Head'};
  }
  // 사람 (MakeHuman 뼈대: 불러올 때 '.' 이 빠짐  foot.L → footL)
  m['root'] = {type:'rot', drv:'hips'};
  ['spine05','spine04','spine03','spine02','spine01'].forEach((b,i) => m[b] = {type:'rot', drv:'spine', drv2:'chest', f:i/4});
  m['neck01'] = {type:'rot', drv:'neck'}; m['neck02'] = {type:'rot', drv:'neck', drv2:'head', f:0.3}; m['neck03'] = {type:'rot', drv:'neck', drv2:'head', f:0.6};
  m['head'] = {type:'rot', drv:'head'}; m['jaw'] = {type:'rot', drv:'jaw'};
  for (const s of 'LR'){
    m['clavicle'+s] = {type:'rot', drv:'shoulder'+s};
    m['upperarm01'+s] = {...S('upperArm'+s,'forearm'+s), end:'lowerarm01'+s};
    m['lowerarm01'+s] = {...S('forearm'+s,'hand'+s), end:'wrist'+s};
    m['wrist'+s] = {type:'handSeg', a:'forearm'+s, b:'hand'+s, end:'finger3-1'+s};
    m['upperleg01'+s] = {...S('thigh'+s,'shin'+s), end:'lowerleg01'+s};
    m['lowerleg01'+s] = {...S('shin'+s,'foot'+s), end:'foot'+s};
    m['foot'+s] = {type:'dirRot', drv:'foot'+s, end:'toe3-1'+s};
    for (let k=1;k<=5;k++){ m[`toe${k}-1${s}`] = {type:'rot', drv:'toe'+s}; m[`toe${k}-2${s}`] = {type:'curl', drv:'toe'+s, f:0.35}; }
    for (let k=2;k<=5;k++) for (let j=1;j<=3;j++) m[`finger${k}-${j}${s}`] = {type:'curl', drv:(k <= 3 ? 'point' : 'fingers')+s, f:[0,1,1.1,0.8][j]};
    for (let j=1;j<=3;j++) m[`finger1-${j}${s}`] = {type:'curl', drv:'thumb'+s, f:[0,0.5,0.8,0.8][j]};
  }
  const handle = {hips:'root',spine:'spine04',chest:'spine02',neck:'neck02',head:'head',jaw:'jaw'};
  const legs = {};
  for (const s of 'LR'){
    Object.assign(handle,{['shoulder'+s]:'clavicle'+s,['upperArm'+s]:'upperarm01'+s,['forearm'+s]:'lowerarm01'+s,['hand'+s]:'wrist'+s,
      ['thigh'+s]:'upperleg01'+s,['shin'+s]:'lowerleg01'+s,['foot'+s]:'foot'+s,['toe'+s]:'toe1-1'+s, ['fingers'+s]:'finger5-2'+s, ['thumb'+s]:'finger1-3'+s, ['point'+s]:'finger2-2'+s});
    legs[s] = {up:'upperleg01'+s, low:'lowerleg01'+s, foot:'foot'+s, toes:[1,2,3,4,5].map(k => `toe${k}-1${s}`), ball:'toe3-1'+s};
  }
  return {map:m, handle, legs, hands:{L:{wrist:'wristL', fore:'lowerarm01L', grip:'finger3-1L', idx:'finger2-1L', pinky:'finger5-1L'}, R:{wrist:'wristR', fore:'lowerarm01R', grip:'finger3-1R', idx:'finger2-1R', pinky:'finger5-1R'}},
    back:/^(root|spine0\d|neck0\d|head|clavicle[LR]|shoulder01[LR]|breast[LR]|pelvis[LR])$/, seat:/^(root|pelvis[LR]|upperleg01[LR])$/, feet:/^(foot[LR]|toe\d-\d[LR])$/,
    shoulders:{L:'upperarm01L', R:'upperarm01R'}, hipsBone:'root', headBone:'head'};
}

/* ---------- 모델 불러오기 (원본 하나 → 출연자마다 복제) ---------- */
const templates = {};
const gltfLoader = new T.GLTFLoader();
const CHAR_BUF = {};   // 추가한 캐릭터의 GLB (id → ArrayBuffer)
async function fetchModel(id){
  if (CHAR_BUF[id]) return CHAR_BUF[id].slice(0);
  try {
    const r = await fetch('models/'+id+'.glb.b64.txt'); if (!r.ok) throw 0;
    const b64 = (await r.text()).trim(), bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i);
    return u8.buffer;
  } catch(e){ const r = await fetch('models/'+id+'.glb'); if (!r.ok) throw new Error(id+' 모델 파일 없음'); return await r.arrayBuffer(); }
}
const HUMAN_LOOK = {
  sport:{skin:0xE8C9AE, top:0x3F7FBF, bottom:0x2C3038, shoe:0xF4F1EA, sole:0xE0663E},
  mannequin:{skin:0xDDD6CC, top:0xDDD6CC, bottom:0xDDD6CC, shoe:0xDDD6CC, sole:0xDDD6CC},
};
function humanRegion(name){
  if (/^(foot|toe)/.test(name)) return 'shoe';
  if (/^(upperleg|lowerleg|pelvis)/.test(name) || name === 'root') return 'bottom';
  if (/^(spine0[1-5]|breast|clavicle|shoulder01|upperarm01|upperarm02)/.test(name)) return 'top';
  return 'skin';
}
function paintHuman(tpl, look){
  const L = HUMAN_LOOK[look] || HUMAN_LOOK.sport;
  for (const mesh of tpl.meshes){
    const g = mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, pos = g.attributes.position;
    let col = g.attributes.color; if (!col){ col = new T.BufferAttribute(new Float32Array(pos.count*3), 3); g.setAttribute('color', col); }
    const c = new T.Color(), names = mesh.skeleton.bones.map(b => b.name);
    for (let i = 0; i < pos.count; i++){
      let best = 0, bw = -1; for (let k = 0; k < 4; k++){ const w = gc(sw,i,k); if (w > bw){ bw = w; best = gc(si,i,k); } }
      const reg = humanRegion(names[best]);
      c.setHex(reg === 'shoe' && pos.getY(i) < 0.025 ? L.sole : L[reg]); col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }
}
async function loadTemplate(id){
  const def = MODEL_DEF[id];
  const buf = await fetchModel(id);
  const gltf = await new Promise((res, rej) => gltfLoader.parse(buf, '', res, rej));
  const root = gltf.scene, meshes = [];
  if (def.custom) charPrepare(root, def);   // 추가한 캐릭터: 뼈 이름 맞추기 · 키 맞추기
  root.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
  const tpl = {id, def, root, meshes};
  for (const mesh of meshes){
    mesh.frustumCulled = false; mesh.castShadow = true;
    if (def.kind === 'human'){ mesh.material = toon(0xffffff, {vertexColors:true}); }
    else {
      const src = mesh.material, c = src.color ? src.color.clone().convertLinearToSRGB() : new T.Color(0xdddddd);
      const isBlack = c.r + c.g + c.b < 0.3;
      mesh.userData.ink = isBlack || /black|eye/i.test(src.name || ''); mesh.userData.matName = src.name || '';
      if (def.custom && (src.map || src.vertexColors)){   // 추가한 캐릭터: 그림(텍스처)·꼭짓점 색을 살린 만화 재질
        if (src.map){ src.map.encoding = T.LinearEncoding; src.map.needsUpdate = true; }   // 화면 출력이 sRGB 변환 없이 나가므로 그림 색 그대로
        mesh.material = toon(src.map ? new T.Color(0xffffff) : c, {map:src.map || null, vertexColors:!!src.vertexColors}); mesh.userData.ink = false;
      } else
      mesh.material = isBlack ? new T.MeshBasicMaterial({color:INK, skinning:true}) : toon(c);
    }
  }
  if (def.kind === 'human') paintHuman(tpl, 'sport');
  buildSlimMorphs(tpl); buildBlinkMorph(tpl); buildJiggle(tpl);
  for (const mesh of meshes) if (!(mesh.material.isMeshBasicMaterial)) outlineSkinned(mesh, def.outline);
  templates[id] = tpl; return tpl;
}

/* ---------- 흔들리는 부위: 짹짹이 앞머리·정수리 머리카락, 부리부리 머리깃 ----------
   머리뼈 아래에 '흔들림 뼈'를 새로 달고, 그 부위 살을 끝으로 갈수록 그 뼈에 더 붙임. 움직일 때 스프링처럼 늦게 따라오며 출렁 */
const sm01 = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const JIGGLE_CFG = {
  jjak:[
    {name:'JiggleTuft', mat:'yellow', pivot:[0.015, 0.915, -0.035], dir:[0, 1, 0], len:0.07, k:170, z:0.22, max:0.7,
      w:p => p.y > 0.915 ? sm01((p.y - 0.915) / 0.06) : 0},
    {name:'JiggleBang', mat:'yellow', pivot:[-0.075, 0.885, 0.15], dir:[0, -1, 0.15], len:0.11, k:130, z:0.2, max:0.6,
      w:p => (p.z > 0.12 && p.x > -0.17 && p.x < 0.005 && p.y < 0.885 && p.y > 0.7) ? sm01((p.z - 0.12) / 0.025) * sm01((0.885 - p.y) / 0.09) : 0},
  ],
  buri:[
    {name:'JiggleCrest', mat:'hair_gray', pivot:[0.05, 1.83, -0.07], dir:[0, 1, 0.25], len:0.14, k:120, z:0.22, max:0.55,
      w:p => p.y > 1.82 ? sm01((p.y - 1.82) / 0.13) : 0},
  ],
};
const JIG = {on:true};
function buildJiggle(tpl){
  const cfg = JIGGLE_CFG[tpl.id]; if (!cfg) return;
  const sks = [...new Set(tpl.meshes.map(m => m.skeleton))], sk0 = sks[0];
  const hi = sk0.bones.findIndex(b => b.name === 'Head'); if (hi < 0) return;
  const head = sk0.bones[hi], headBind = new T.Matrix4().copy(sk0.boneInverses[hi]).invert(), headBindInv = sk0.boneInverses[hi].clone();
  const added = [];
  for (const c of cfg){
    const m0 = tpl.meshes.find(m => m.userData.matName === c.mat); if (!m0) continue;
    const pv = new T.Vector3(...c.pivot).applyMatrix4(m0.bindMatrix);
    const local = pv.clone().applyMatrix4(headBindInv);
    const jb = new T.Bone(); jb.name = c.name; jb.position.copy(local); head.add(jb);
    const bind = headBind.clone().multiply(new T.Matrix4().makeTranslation(local.x, local.y, local.z));
    added.push({c, jb, inv:bind.clone().invert(), mesh:m0});
  }
  if (!added.length) return;
  // 새 뼈를 뼈대에 붙이기 (원래 뼈 번호는 그대로, 뒤에 이어 붙임)
  const map = new Map();
  for (const sk of sks){ const nsk = new T.Skeleton(sk.bones.concat(added.map(a => a.jb)), sk.boneInverses.concat(added.map(a => a.inv))); map.set(sk, nsk); }
  for (const m of tpl.meshes){ const nsk = map.get(m.skeleton); if (nsk) m.bind(nsk, m.bindMatrix); }
  // 그 부위 살을 흔들림 뼈에 나눠 붙임
  added.forEach((a, ai) => {
    const g = a.mesh.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const jIdx = a.mesh.skeleton.bones.indexOf(a.jb), v = new T.Vector3(); let n = 0;
    for (let i = 0; i < pos.count; i++){
      v.fromBufferAttribute(pos, i); const w = a.c.w(v); if (w < 0.01) continue;
      const ws = [0, 1, 2, 3].map(k => gc(sw, i, k) * (1 - w)), is = [0, 1, 2, 3].map(k => gc(si, i, k));
      let mk = 0; for (let k = 1; k < 4; k++) if (ws[k] < ws[mk]) mk = k;
      // 가장 작은 칸을 흔들림 뼈로 (원래 그 칸 몫은 나머지에 고루)
      const rest = ws[mk]; ws[mk] = w; is[mk] = jIdx; const sum = ws.reduce((x, y) => x + y, 0) - w; if (sum > 1e-6) for (let k = 0; k < 4; k++) if (k !== mk) ws[k] += rest * ws[k] / sum;
      si.setXYZW(i, is[0], is[1], is[2], is[3]); sw.setXYZW(i, ws[0], ws[1], ws[2], ws[3]); n++;
    }
    si.needsUpdate = sw.needsUpdate = true; a.c._n = n;
  });
  tpl.jiggle = added.map(a => a.c);
}
const _jv1 = new T.Vector3(), _jv2 = new T.Vector3(), _jq1 = new T.Quaternion(), _jq2 = new T.Quaternion();
function jiggleUpdate(A){
  if (!A.jig){ A.jig = (A.tpl.jiggle || []).map(c => ({c, b:A.bones[c.name], dir:new T.Vector3(...c.dir).normalize(), p:null, v:new T.Vector3(), t:null, f:-1, q:new T.Quaternion()})); }
  for (const J of A.jig){
    const b = J.b; if (!b) continue;
    b.quaternion.set(0, 0, 0, 1); b.updateMatrixWorld(true);
    if (!JIG.on || A._measuring){ J.p = null; continue; }
    const P = b.getWorldPosition(new T.Vector3()), hq = b.parent.getWorldQuaternion(_jq1), sc = new T.Vector3().setFromMatrixScale(b.matrixWorld).x;
    const L = J.c.len * sc, tdir = J.dir.clone().applyQuaternion(hq), tgt = tdir.clone().multiplyScalar(L).add(P);
    const t = A._ct ?? 0;
    let dt = J.t == null ? -1 : t - J.t;
    if (Math.abs(dt) < 1e-6){ if (J.f === FRAME.id){ b.quaternion.copy(J.q); b.updateMatrixWorld(true); continue; } dt = FRAME.dt; }
    if (!J.p || !(dt > 0 && dt < 0.25)){ J.p = tgt.clone(); J.v.set(0, 0, 0); }
    else {
      const k = J.c.k, c = 2 * Math.sqrt(k) * J.c.z, n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
      for (let s = 0; s < n; s++){ const a = _jv1.copy(tgt).sub(J.p).multiplyScalar(k).addScaledVector(J.v, -c); J.v.addScaledVector(a, h); J.p.addScaledVector(J.v, h); }
      const d = _jv2.copy(J.p).sub(P); if (d.lengthSq() < 1e-12) d.copy(tdir); d.setLength(L); J.p.copy(P).add(d);
    }
    // 바닥 아래로는 흔들리지 않게 (엎드려 머리가 바닥 가까이 있을 때)
    const fy = floorAt(A.place.x, A.place.z) + 0.01 * sc * A.def.H;
    if (J.p.y < fy){ J.p.y = fy; J.v.y = Math.max(0, J.v.y); const d = _jv2.copy(J.p).sub(P); if (d.lengthSq() > 1e-12){ d.setLength(L); J.p.copy(P).add(d); } }
    J.t = t; J.f = FRAME.id;
    // 처진 방향만큼 흔들림 뼈를 돌림 (너무 많이 꺾이지 않게)
    const cur = _jv2.copy(J.p).sub(P).normalize();
    _jq2.setFromUnitVectors(tdir, cur);
    // 머리가 바닥 가까이 있으면 흔들림을 줄임
    const near = Math.max(0, Math.min(1, (P.y - floorAt(A.place.x, A.place.z)) / (L * 2.5))), mx = J.c.max * near;
    const ang = 2 * Math.acos(Math.min(1, Math.abs(_jq2.w))); if (ang > mx) _jq2.slerp(new T.Quaternion(), ang > 1e-6 ? 1 - mx / ang : 1);
    const local = hq.clone().invert().multiply(_jq2).multiply(hq);
    b.quaternion.copy(local); b.updateMatrixWorld(true); J.q.copy(local);
  }
}

/* ---------- 출연자 ---------- */
const actors = [];
let actorSeq = 0;
const ringGeo = new T.RingGeometry(0.42, 0.5, 48).rotateX(-Math.PI/2);
function makeInstance(tpl){
  const root = T.SkeletonUtils.clone(tpl.root);
  const meshes = []; root.traverse(o => { if (o.isSkinnedMesh && !o.userData.outline) meshes.push(o); });
  const all = []; root.traverse(o => { if (o.isSkinnedMesh) all.push(o); });
  for (const o of all) if (o.userData.outline && o.material.userData && o.material.userData.blink) o.material = outlineBlinkMat(o.material.userData.w);
  const mesh = meshes[0];
  const bones = {}; mesh.skeleton.bones.forEach(b => bones[b.name] = b);
  return {root, meshes, all, mesh, bones};
}
function createActor(kind, opts={}){
  const tpl = templates[kind]; if (!tpl) return null;
  const def = tpl.def, inst = makeInstance(tpl);
  const A = {id:'a'+(++actorSeq), kind, def, name:opts.name || def.label, tpl,
    root:new T.Group(), lift:new T.Group(), model:inst.root, inst, bones:inst.bones,
    drv:makeDriver(), pose:identityPose(), meta:defMeta(), clip:null, start:0, speed:1, loop:true, yawClip:0,
    place:{x:opts.x||0, z:opts.z||0, ry:opts.ry||0, s:opts.s||1, elev:opts.elev||0, on:null},
    equip:[], equipKey:'', ground:true, live:null, visible:true, trails:null};
  A.root.add(A.lift); A.lift.add(inst.root); actorLayer.add(A.root);
  A.root.userData.actor = A;
  // 바닥 고리 (배치 모드에서 고르기·옮기기)
  A.ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({color:0xF07D28, transparent:true, opacity:0.85, depthTest:false}));
  A.ring.renderOrder = 5; A.ring.userData.actor = A; A.ring.scale.setScalar(def.H*0.32); overlay.add(A.ring);
  setupRig(A); setupStretch(A); A.root.updateMatrixWorld(true); setupVolumes(A); setupLandmarks(A);
  // 쉬는 자세의 무게중심 치우침(캐릭터 생김새 탓)은 '균형 잡힌 상태'로 보고 빼 줌
  A.root.updateMatrixWorld(true);
  { const cm = centerOfMass(A, new T.Vector3()); let sx = 0, sz = 0, n = 0;
    for (const s of 'LR'){ if (!A.legs[s]) continue; for (const nm of [A.legs[s].foot, A.legs[s].ball]){ const p = A.bones[nm].getWorldPosition(new T.Vector3()); A.root.worldToLocal(p); sx += p.x; sz += p.z; n++; } }
    A.comBias = cm && n ? [cm.x - sx/n, cm.z - sz/n] : [0, 0]; }
  actors.push(A); applyPlace(A);
  return A;
}
function setupRig(A){
  const {map, handle, legs, hands, back, seat, feet, shoulders, hipsBone, headBone} = mapFor(A.def.kind);
  A.root.updateMatrixWorld(true);
  const mesh = A.inst.mesh;
  const rootBone = mesh.skeleton.bones.find(b => !(b.parent && b.parent.isBone));
  const order = []; rootBone.traverse(o => { if (o.isBone) order.push(o); });
  // 쉬는 자세 (출연자 기준 공간 = lift 안쪽)
  const inv = new T.Matrix4().copy(A.lift.matrixWorld).invert(), invQ = new T.Quaternion();
  A.lift.getWorldQuaternion(invQ).invert();
  const rest = {};
  for (const b of order){
    const wp = b.getWorldPosition(new T.Vector3()).applyMatrix4(inv);
    const wq = invQ.clone().multiply(b.getWorldQuaternion(new T.Quaternion()));
    rest[b.name] = {local:b.quaternion.clone(), pos:b.position.clone(), wq, wp};
  }
  for (const name in map){
    const e = map[name]; if (!A.bones[name]) { delete map[name]; continue; }
    const R = rest[name];
    if (e.type === 'dirSeg' || e.type === 'dirRot' || e.type === 'handSeg'){
      let dir;
      if (e.end && rest[e.end]) dir = rest[e.end].wp.clone().sub(R.wp);
      else if (e.from && rest[e.from]) dir = R.wp.clone().sub(rest[e.from].wp);
      else dir = new T.Vector3(0,-1,0);
      dir.normalize(); e.restDir = dir; e.axis = dir.clone().applyQuaternion(R.wq.clone().invert());
    }
  }
  const pq = rootBone.parent ? rootBone.parent.getWorldQuaternion(new T.Quaternion()) : new T.Quaternion();
  A.armQ = invQ.clone().multiply(pq);
  // 루트 이동을 뼈 부모 공간으로 바꾸는 행렬
  const pm = rootBone.parent ? rootBone.parent.matrixWorld.clone() : new T.Matrix4();
  const toLift = inv.clone().multiply(pm);           // 부모공간 → lift공간
  A.rootDeltaM = new T.Matrix3().setFromMatrix4(toLift).invert();
  Object.assign(A, {map, handle, legs, hands, order, rest, rootBone, shoulderNames:shoulders, hipsBone, headBone});
  A.hipH = rest[rootBone.name].wp.y;
  // 관절 보조뼈 (짹짹이·부리부리): 굽힐 때 반만 돌아 관절 살 부피 유지
  A.mids = [];
  for (const sd of ['Left','Right']) for (const [mid, partner] of [['KneeMid','Leg'],['HipMid','UpLeg'],['ElbowMid','ForeArm']]){
    const b = A.bones[sd+mid], c = A.bones[sd+partner]; if (!b || !c) continue;
    const O = rest[c.name].wq.clone().invert().multiply(rest[b.name].wq);
    A.mids.push({b, c, local:rest[b.name].local.clone(), O});
  }
  // 다리 길이·발 정보
  A.legInfo = {};
  for (const s of 'LR'){
    const L = legs[s], up = rest[L.up], low = rest[L.low], ft = rest[L.foot], ball = rest[L.ball];
    if (!up || !low || !ft || !ball) continue;
    A.legInfo[s] = {a:up.wp.distanceTo(low.wp), b:low.wp.distanceTo(ft.wp), ankle:ft.wp.clone(), ball:ball.wp.clone(), footQ:ft.wq.clone(),
      toeQ:L.toes.map(t => rest[t] ? rest[t].wq.clone() : null)};
  }
  // 손 정보
  A.handInfo = {};
  for (const s of 'LR'){
    const h = hands[s], w = rest[h.wrist], f = rest[h.fore]; if (!w || !f) continue;
    const dir = w.wp.clone().sub(f.wp); const foreLen = dir.length(); dir.normalize();
    let gripLocal, widthLocal;
    if (h.grip && rest[h.grip]){
      gripLocal = rest[h.grip].wp.clone().sub(w.wp).applyQuaternion(w.wq.clone().invert());
      const wd = rest[h.idx].wp.clone().sub(rest[h.pinky].wp).normalize();
      widthLocal = wd.applyQuaternion(w.wq.clone().invert());
    } else {
      gripLocal = dir.clone().multiplyScalar(foreLen*0.45).applyQuaternion(w.wq.clone().invert());
      widthLocal = new T.Vector3(0,0,1).applyQuaternion(w.wq.clone().invert());
    }
    A.handInfo[s] = {gripLocal, widthLocal};
  }
  // 접지 표본 점 (부위별)
  A.samples = {all:[], back:[], seat:[], feet:[], body:[], armL:[], armR:[], head:[], upper:[], noArms:[], legs:[], front:[], legL:[], legR:[], footL:[], footR:[], noArmsFeet:[]};
  const chestSet = new Set(); { const cb = A.bones[handle.chest]; if (cb) cb.traverse(o => { if (o.isBone) chestSet.add(o.name); }); }
  const legSide = {L:new Set(), R:new Set()}; for (const sd of 'LR'){ const tb = A.bones[handle['thigh'+sd]]; if (tb) tb.traverse(o => { if (o.isBone) legSide[sd].add(o.name); }); }
  const headSet = new Set(); { const hb = A.bones[handle.head]; if (hb) hb.traverse(o => { if (o.isBone) headSet.add(o.name); }); }
  const legSet = new Set(); for (const sd of 'LR'){ const tb = A.bones[handle['thigh'+sd]]; if (tb) tb.traverse(o => { if (o.isBone) legSet.add(o.name); }); }
  const armSet = {L:new Set(), R:new Set()};
  for (const sd of 'LR'){ const ub = A.bones[handle['upperArm'+sd]]; if (ub) ub.traverse(o => { if (o.isBone) armSet[sd].add(o.name); }); }
  for (const m of A.inst.meshes){
    const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count;
    const names = m.skeleton.bones.map(b => b.name);
    const stride = Math.max(1, Math.floor(n / 500));
    for (let i = 0; i < n; i++){
      let best = 0, bw = -1; for (let k = 0; k < 4; k++){ const w = gc(sw,i,k); if (w > bw){ bw = w; best = gc(si,i,k); } }
      const nm = names[best];
      if (feet.test(nm)){ A.samples.feet.push([m, i]); if (i % 2 === 0){ if (legSide.L.has(nm)) A.samples.footL.push([m, i]); else if (legSide.R.has(nm)) A.samples.footR.push([m, i]); } }
      if ((legSet.has(nm) || feet.test(nm)) && i % 2 === 0){ A.samples.legs.push([m, i]); if (legSide.L.has(nm)) A.samples.legL.push([m, i]); else if (legSide.R.has(nm)) A.samples.legR.push([m, i]); }
      if (i % stride) continue;
      A.samples.all.push([m, i]);
      if (!feet.test(nm)) A.samples.body.push([m, i]);
      if (armSet.L.has(nm)) A.samples.armL.push([m, i]); else if (armSet.R.has(nm)) A.samples.armR.push([m, i]); else { A.samples.noArms.push([m, i]); if (!feet.test(nm)) A.samples.noArmsFeet.push([m, i]); }
      if (headSet.has(nm)) A.samples.head.push([m, i]);
      if (chestSet.has(nm) && !armSet.L.has(nm) && !armSet.R.has(nm)) A.samples.front.push([m, i]);
      if (armSet.L.has(nm) || armSet.R.has(nm) || legSet.has(nm) || feet.test(nm)) (A.samples.limbs || (A.samples.limbs = [])).push([m, i]);
      if (!armSet.L.has(nm) && !armSet.R.has(nm) && !legSet.has(nm) && !feet.test(nm)) A.samples.upper.push([m, i]);
      if (back.test(nm)) A.samples.back.push([m, i]);
      if (seat.test(nm)) A.samples.seat.push([m, i]);
    }
  }
  for (const k in A.samples){ const s = A.samples[k]; if (s.length > 700){ const st = Math.ceil(s.length/700); A.samples[k] = s.filter((_, i) => i % st === 0); } }
  // 관절 점
  A.handles = {};
  for (const b of BONES){
    if (!handle[b] || !A.bones[handle[b]]) continue;
    const hm = new T.Mesh(handleGeo, b === 'hips' ? hMatRoot : hMat);
    hm.scale.setScalar(A.def.H*0.016 * (b === 'hips' ? 1.4 : 1)); hm.renderOrder = 10; hm.userData = {actor:A, bone:b}; overlay.add(hm); A.handles[b] = hm;
  }
  const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(BONES.length*6), 3));
  A.lines = new T.LineSegments(lg, lineMat); A.lines.renderOrder = 9; A.lines.frustumCulled = false; overlay.add(A.lines);
}
const handleGeo = new T.SphereGeometry(1, 12, 8);
const hMat = new T.MeshBasicMaterial({color:0xF07D28, depthTest:false, transparent:true, opacity:0.95});
const hMatRoot = new T.MeshBasicMaterial({color:0x4C9A2A, depthTest:false, transparent:true, opacity:0.95});
const hMatSel = new T.MeshBasicMaterial({color:0x2E8FB5, depthTest:false});
const lineMat = new T.LineBasicMaterial({color:0x1d1a17, depthTest:false, transparent:true, opacity:0.45});

function removeActor(A){
  const i = actors.indexOf(A); if (i < 0) return;
  actors.splice(i, 1);
  actorLayer.remove(A.root); overlay.remove(A.ring); overlay.remove(A.lines);
  for (const b in A.handles) overlay.remove(A.handles[b]);
  for (const e of A.equip) A.root.remove(e.obj);
  if (A.trails) for (const t of A.trails) overlay.remove(t.line);
  if (A.jdots) for (const k in A.jdots) A.root.remove(A.jdots[k]);
}
function applyPlace(A){
  const p = A.place;
  A.root.position.set(p.x, p.elev, p.z);
  A.root.rotation.set(0, (p.ry + A.yawClip)*D2R, 0);
  A.root.scale.setScalar(p.s);
  A.ring.position.set(p.x, p.elev + 0.004, p.z);
  A.ring.scale.setScalar(A.def.H*0.32*p.s);
}

/* ---------- 클립 재생 ---------- */
function clipDur(c){ return c ? Math.max(c.duration, c.keys.length ? c.keys[c.keys.length-1].t : 0, 0.01) : 1; }
const _metaA = defMeta(), _metaB = defMeta();
function sampleClip(c, t, out, meta){
  const k = c && c.keys; if (!k || !k.length) return;
  const mk = i => k[i].meta || c.meta || null;
  if (t <= k[0].t || k.length === 1){ copyPose(k[0].pose, out); setMeta(meta, mk(0), c); return; }
  if (t >= k[k.length-1].t){ copyPose(k[k.length-1].pose, out); setMeta(meta, mk(k.length-1), c); return; }
  let lo = 0, hi = k.length-1;
  while (hi - lo > 1){ const m = (lo+hi)>>1; if (k[m].t <= t) lo = m; else hi = m; }
  let u = (t - k[lo].t) / (k[hi].t - k[lo].t);
  if (c.source === 'keys') u = u*u*(3-2*u);
  const a = k[lo].pose, b = k[hi].pose;
  for (const n of BONES) out.rot[n].copy(a.rot[n]).slerp(b.rot[n], u);
  out.root.lerpVectors(a.root, b.root, u);
  setMeta(_metaA, mk(lo), c); setMeta(_metaB, mk(hi), c); lerpMeta(_metaA, _metaB, u, meta);
}
function setMeta(dst, src, c){
  const d = defMeta(); if (c && c.source === 'capture') d.g = 'low', d.pl = [0,0];
  const s = src || {};
  dst.g = s.g || d.g; dst.pl[0] = s.pl ? s.pl[0] : d.pl[0]; dst.pl[1] = s.pl ? s.pl[1] : d.pl[1];
  dst.st[0][0] = s.st ? s.st[0][0] : 0; dst.st[0][1] = s.st ? s.st[0][1] : 0; dst.st[1][0] = s.st ? s.st[1][0] : 0; dst.st[1][1] = s.st ? s.st[1][1] : 0;
  dst.hr[0] = s.hr ? s.hr[0] : 0; dst.hr[1] = s.hr ? s.hr[1] : 0;
  if (!dst.hw) dst.hw = [0,0]; dst.hw[0] = s.hw ? s.hw[0] : 0; dst.hw[1] = s.hw ? s.hw[1] : 0;
  if (!dst.ht) dst.ht = [null,null]; dst.ht[0] = s.ht ? s.ht[0] : null; dst.ht[1] = s.ht ? s.ht[1] : null;
  dst.rf = s.rf || 0; dst.cx = s.cx || 0; dst.sl = [0, 0]; dst.ey = s.ey || 0;
  return dst;
}
function actorTime(A, t){
  if (!A.clip) return 0;
  const d = clipDur(A.clip), lt = (t - A.start) * A.speed;
  if (lt < 0) return 0;
  return A.loop ? lt % d : Math.min(lt, d);
}

/* ---------- 기준 뼈대 → 모델 ---------- */
const _q1 = new T.Quaternion(), _q2 = new T.Quaternion(), _q3 = new T.Quaternion(), _v1 = new T.Vector3(), _v2 = new T.Vector3(), _v3 = new T.Vector3();
function applyDriver(A){
  const d = A.drv;
  for (const b of BONES) d.bones[b].quaternion.copy(A.pose.rot[b]);
  d.bones.hips.position.copy(d.base);
  d.group.updateMatrixWorld(true);
  A.drvQ = A.drvQ || {}; A.drvP = A.drvP || {};
  for (const b of BONES){ A.drvQ[b] = d.bones[b].getWorldQuaternion(A.drvQ[b] || new T.Quaternion()); A.drvP[b] = d.bones[b].getWorldPosition(A.drvP[b] || new T.Vector3()); }
}
const _ax = new T.Vector3(1,0,0);
function driveModel(A){
  const cur = A._cur || (A._cur = {});
  const rb = A.rootBone, rr = A.rest[rb.name];
  // 루트 이동 (골반 높이 배율 → 미터 → 부모 공간)
  _v1.copy(A.pose.root).multiplyScalar(A.hipH).applyMatrix3(A.rootDeltaM);
  rb.position.copy(rr.pos).add(_v1);
  const dq = A.drvQ, dp = A.drvP;
  for (const b of A.order){
    const R = A.rest[b.name], e = A.map[b.name];
    const Wp = (b.parent && b.parent.isBone) ? cur[b.parent.name] : A.armQ;
    const W = cur[b.name] || (cur[b.name] = new T.Quaternion());
    if (!e){ W.copy(Wp).multiply(R.local); }
    else if (e.type === 'rot'){
      const d = e.drv2 ? _q1.copy(dq[e.drv]).slerp(dq[e.drv2], e.f) : _q1.copy(dq[e.drv]);
      W.copy(d).multiply(R.wq);
    } else if (e.type === 'curl'){
      // 손가락·발가락 말기: 부모 기준 쉬는 자세에 X축 회전을 곱함
      _e.setFromQuaternion(A.pose.rot[e.drv], 'XYZ');
      const ang = (e.drv.startsWith('toe') ? _e.x : _e.x) * e.f;
      W.copy(Wp).multiply(R.local).multiply(_q1.setFromAxisAngle(_ax, ang));
    } else {
      _q3.copy(Wp).multiply(R.local);
      const curDir = _v1.copy(e.axis).applyQuaternion(_q3).normalize();
      let tgt;
      if (e.type === 'dirSeg') tgt = _v2.copy(dp[e.b]).sub(dp[e.a]).normalize();
      else if (e.type === 'handSeg'){
        _q1.copy(dq[e.b]).multiply(_q2.copy(dq[e.a]).invert());
        tgt = _v2.copy(dp[e.b]).sub(dp[e.a]).normalize().applyQuaternion(_q1).normalize();
      } else tgt = _v2.copy(e.restDir).applyQuaternion(dq[e.drv]).normalize();
      W.copy(_q2.setFromUnitVectors(curDir, tgt)).multiply(_q3);
    }
    b.quaternion.copy(_q1.copy(Wp).invert().multiply(W));
  }
  stretchLimbs(A);
}
const _e = new T.Euler();

/* ---------- 관절 강조: 일하는 관절 둘레의 팔다리를 살짝 늘이고 점으로 표시 ---------- */
const JEMPH = {level:1, dots:false};                 // level: 0 끔 · 0.6 살짝 · 1 보통 · 1.6 크게
const STRETCH_AMP = {human:0.08, jjak:0.55, buri:0.4};
const SEG_DEF = {upperArm:['upperArm','forearm'], forearm:['forearm','hand'], thigh:['thigh','shin'], shin:['shin','foot']};
const JOINTS = {shoulder:'upperArm', elbow:'forearm', wrist:'hand', hip:'thigh', knee:'shin', ankle:'foot'};
const dotGeo = new T.SphereGeometry(1, 16, 10), dotRingGeo = new T.RingGeometry(1.25, 1.6, 28);
function setupStretch(A){
  A.segs = {}; A.segS = {}; A.jw = null; A._jprev = {};
  for (const s of 'LR') for (const k in SEG_DEF){
    const st = A.bones[A.handle[SEG_DEF[k][0]+s]], en = A.bones[A.handle[SEG_DEF[k][1]+s]];
    if (!st || !en) continue;
    const chain = []; let b = en;
    while (b && b !== st){ chain.push({b, pos:A.rest[b.name].pos.clone()}); b = b.parent; }
    if (b !== st) continue;
    // 같은 마디에서 갈라진 보조뼈(무릎·팔꿈치 보조뼈 등)도 함께 옮김
    for (const ch of st.children) if (ch.isBone && !chain.some(c => c.b === ch) && !/S$/.test(ch.name) && A.rest[ch.name].pos.length() > 1e-4) chain.push({b:ch, pos:A.rest[ch.name].pos.clone()});
    A.segs[k+s] = chain; A.segS[k+s] = 1;
    (A.segLen0 || (A.segLen0 = {}))[k+s] = A.rest[en.name].pos.length();
    // 늘이기 전용 뼈 (짹짹이·부리부리): 이 뼈를 길게 하면 그 마디 살이 고르게 늘어남
    (A.sbones || (A.sbones = {}))[k+s] = A.bones[st.name + 'S'] || null;
  }
  // 관절 점 (무대 장면 안에 둬서 녹화에도 담김)
  A.jdots = {};
  const r = A.def.H * (A.def.kind === 'human' ? 0.014 : A.kind === 'jjak' ? 0.017 : 0.011);
  for (const s of 'LR') for (const j in JOINTS){
    if (!A.bones[A.handle[JOINTS[j]+s]]) continue;
    const g = new T.Group();
    const core = new T.Mesh(dotGeo, new T.MeshBasicMaterial({color:0xFF8A3D, transparent:true}));
    const ring = new T.Mesh(dotRingGeo, new T.MeshBasicMaterial({color:0xffffff, transparent:true, side:T.DoubleSide}));
    core.renderOrder = 20; ring.renderOrder = 19; g.add(ring, core); g.scale.setScalar(r); g.visible = false;
    g.userData = {core, ring, bone:A.bones[A.handle[JOINTS[j]+s]]};
    A.root.add(g); A.jdots[j+s] = g;
  }
}
// 동작 전체에서 관절이 얼마나 움직이는지 → 0~1
function clipJointWeights(c){
  if (!c || !c.keys || !c.keys.length) return {};
  if (c._jw) return c._jw;
  const ks = c.keys, step = Math.max(1, Math.floor(ks.length / 60));
  const range = {};
  for (const b of ['upperArmL','forearmL','thighL','shinL','footL','handL','upperArmR','forearmR','thighR','shinR','footR','handR']){
    let mx = 0;
    for (let i = 0; i < ks.length; i += step){
      const qi = ks[i].pose.rot[b]; if (!qi) continue;
      mx = Math.max(mx, 2*Math.acos(Math.min(1, Math.abs(qi.w))));       // 쉬는 자세 대비
      for (let j = i + step; j < ks.length; j += step){ const qj = ks[j].pose.rot[b]; mx = Math.max(mx, qi.angleTo(qj)); }
    }
    range[b] = mx * R2D;
  }
  const f = d => Math.max(0, Math.min(1, (d - 18) / 62));
  const calm = {cute:0.55, kpop:0.6, basic:0.5, body:0.7}[c.cat] || 1;
  const w = {};
  for (const s of 'LR'){
    w['shoulder'+s] = f(range['upperArm'+s]) * calm; w['elbow'+s] = f(range['forearm'+s]) * calm;
    w['hip'+s] = f(range['thigh'+s]) * calm;         w['knee'+s] = f(range['shin'+s]) * calm;
    w['ankle'+s] = f(range['foot'+s] * 1.4) * calm;  w['wrist'+s] = f(range['hand'+s] * 1.2) * calm * 0.6;
    w['upperArm'+s] = Math.max(w['shoulder'+s], w['elbow'+s]); w['forearm'+s] = Math.max(w['elbow'+s], w['shoulder'+s]*0.4);
    w['thigh'+s] = Math.max(w['hip'+s], w['knee'+s]);           w['shin'+s] = Math.max(w['knee'+s], w['hip'+s]*0.4, w['ankle'+s]*0.6);
  }
  return (c._jw = w);
}
let _jt = performance.now(), _jdt = 1/60;
function jointTick(){ const n = performance.now(); _jdt = Math.min(0.1, Math.max(0.001, (n - _jt)/1000)); _jt = n; }
// 사람 몸 비율(몸통 대비 팔·다리 마디 길이) — 짧은 팔다리 캐릭터가 이만큼까지 늘어남
const HUMAN_RATIO = {upperArm:0.547, forearm:0.58, thigh:0.906, shin:0.946};
const SEG_KIND = {upperArm:'arm', forearm:'arm', thigh:'leg', shin:'leg'};
const qAng = q => 2 * Math.acos(Math.min(1, Math.abs(q.w))) * R2D;
const SEG_TAIL = {jjak:{shin:0.057}, buri:{shin:0.015}};
// 마디 길이 정하기: 아래 관절을 f배 거리로 옮기고, 늘이기 뼈는 길이 f배·굵기는 살짝 가늘게
const SEG_MAX = 3.2, ARM_MAX = 2.2;
// 몸 비율 모드: cute 귀여운 그대로(늘이기·겹침 피하기 없음) · stretch 관절 늘이기(동작마다 필요한 만큼) · human 사람 비율로 고정
const BODY = {mode:'stretch'};
// 사람 비율 모드도 동작을 미리 잴 때만은 바닥·손 닿기용으로 늘일 수 있게 (잰 길이를 동작 내내 고정으로 씀)
const stretchOn = A => BODY.mode === 'stretch' || (BODY.mode === 'human' && !!(A && A._measuring));
function fixedSeg(A){
  const cr = charRatios(A), out = {};
  for (const sd of 'LR') for (const seg of ['upperArm','forearm','thigh','shin']){
    let f = BODY.mode === 'human' && A.kind !== 'human' && cr[seg] ? Math.max(1, HUMAN_RATIO[seg] / cr[seg]) : 1;
    // 사람 비율 모드: 팔을 위로 뻗으면 큰 머리 위로 손이 나올 만큼은 길게 (사람도 만세하면 손이 머리 위로 나오니까)
    if (BODY.mode === 'human' && A.kind !== 'human' && SEG_KIND[seg] === 'arm') f = Math.max(f, A._upNeed || 1);
    out[seg+sd] = f; }
  return out;
}   // 한 마디가 늘어날 수 있는 최대 배율
function setSegLen(A, k, f){
  const ch = A.segs && A.segs[k]; if (!ch) return;
  f = Math.min(f, /^(upperArm|forearm)/.test(k) ? ARM_MAX : SEG_MAX);
  A.segS[k] = f;
  for (const c of ch) c.b.position.copy(c.pos).multiplyScalar(f);
  const sb = A.sbones && A.sbones[k];
  if (sb){
    // 마디 끝에 발뼈를 따르는 부분(짹짹이 양말 등)이 있으면 그만큼 빼고 늘여 이음새가 벌어지지 않게
    const tail = (SEG_TAIL[A.kind] || {})[k.slice(0, -1)] || 0, L = A.segLen0 && A.segLen0[k] || 0;
    const fs = (tail > 0 && L > tail) ? (f * L - tail) / (L - tail) : f;
    const t = BODY.mode === 'human' ? 1 : Math.pow(f, -0.28); sb.scale.set(t, fs, t);
  }
}
const smooth01 = x => { x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); };
// 손과 발끝으로 버티는 자세인가: 바닥 쪽(더 낮은) 다리의 무릎이 펴져 있으면 플랭크류, 굽어 있으면 무릎 꿇은 네발
function plankLike(A){
  const P = A.drvP, dq = A.pose.rot; if (!P || !P.footL || !P.footR) return false;
  const sd = P.footL.y <= P.footR.y ? 'L' : 'R';
  return qAng(dq['shin'+sd]) < 40;
}
function stretchLimbs(A){
  if (!A.segs) return;
  // 녹화 분석한 동작은 클립 전체에서 한 번 재고, 실시간은 따로(ui) 갱신
  if (!A.live){
    const c = A.clip;
    if (c && c.source === 'capture' && c.raw){ if (!c._prop) c._prop = medianRatios(c.raw.map(f => f && f.w)); A.propT = propTargets(A, c._prop); }
    else A.propT = null;
  }
  // 관절을 굽힌 만큼 '사람 비율'로 늘어남: 똑바로 서 있으면 원래 모습, 깊게 굽히면 사람처럼 긴 팔다리
  const cr = charRatios(A), dq = A.pose.rot, lv = JEMPH.level;
  const use = {};
  // 팔을 머리 위로 올릴 때: 큰 머리 위로 손이 나올 만큼 (손목이 정수리보다 위) 늘림
  if (A._upNeed == null){
    const R = n => A.rest[A.handle[n]] && A.rest[A.handle[n]].wp, sh = R('upperArmL'), el = R('forearmL'), wr = R('handL'), hd = R('head');
    const top = hd.y + (A.kind === 'human' ? 0.09 : 0.42) * A.def.H;
    const handLen = A.handInfo && A.handInfo.L ? A.handInfo.L.gripLocal.length() * 1.7 : 0;
    A._upNeed = sh && el && wr ? Math.min(({jjak:1.8, buri:1.5})[A.kind] || 1.45, Math.max(1, 1.08 * (top - handLen * 1.1 - sh.y) / (sh.distanceTo(el) + el.distanceTo(wr)))) : 1;
  }
  for (const sd of 'LR'){
    const hip = qAng(dq['thigh'+sd]), knee = qAng(dq['shin'+sd]), sh = qAng(dq['upperArm'+sd]), el = qAng(dq['forearm'+sd]);
    // 팔이 얼마나 위를 향하는지 (기준 뼈대에서 아래팔 끝 방향의 y)
    // 몸통 기준 '머리 위' 방향 (누워서 팔을 위로 뻗는 건 머리 위가 아님)
    let dirUp = 0;
    if (A.drvP && A.drvP['hand'+sd] && A.drvP['upperArm'+sd] && A.drvQ && A.drvQ.chest){
      const v = _v2.copy(A.drvP['hand'+sd]).sub(A.drvP['upperArm'+sd]), L = v.length();
      if (L > 1e-6) dirUp = v.dot(_v3.set(0,1,0).applyQuaternion(A.drvQ.chest)) / L;
    }
    use['up'+sd] = smooth01((dirUp - 0.3) / 0.6);
    use['leg'+sd] = smooth01(Math.max(knee - 15, hip - 25) / 60);      // 무릎이나 엉덩이를 굽힌 만큼
    use['arm'+sd] = smooth01((Math.max(el - 15, (sh - 60) * 0.6)) / 70);
    // 플랭크·푸시업처럼 손과 발끝으로 버티는 자세(무릎을 편 네발): 짧은 팔다리 때문에 큰 머리가 바닥에 닿지 않게 사람 비율까지 늘림
    if (A.meta && A.meta.g === 'low2' && plankLike(A)){ use['leg'+sd] = Math.max(use['leg'+sd], 1); use['arm'+sd] = Math.max(use['arm'+sd], 1); use['up'+sd] = 1; }
    // 무릎 꿇은 네발(고양이·버드독·아기 자세): 허벅지를 늘이면 엉덩이가 들려 팔이 터무니없이 길어지므로 다리는 그대로
    // 팔도 관절 굽힘으로는 늘이지 않음 (바닥을 짚을 때만 아래 kneelSolve에서 필요한 만큼)
    // 무릎 꿇고 엎드린 자세(아기 자세·고양이·버드독): 짧은 다리로 무릎을 꿇으면 어색하고 다리가 찌그러지므로 다리는 사람 비율까지 늘림
    else if (A.meta && A.meta.g === 'low2'){ use['leg'+sd] = A.kind !== 'human' && kneeling(A) ? 1 : 0; if (A.kind !== 'human'){ use['arm'+sd] = 0; use['up'+sd] = 0; } }
  }
  for (const k in A.segs){
    const seg = k.slice(0, -1), sd = k.slice(-1);
    let tgt = 1;
    if (lv > 0 && cr[seg]){ const H = Math.max(1, HUMAN_RATIO[seg] / cr[seg]); tgt = 1 + (H - 1) * lv * use[SEG_KIND[seg] + sd];
      if (SEG_KIND[seg] === 'arm') tgt = Math.max(tgt, 1 + (A._upNeed - 1) * lv * use['up' + sd]); }
    const pt = A.propT; if (pt && PROP.on){ const pk = pt[seg]; if (pk) tgt = pk; }
    // 동작을 고르면 그 동작 전체에서 필요한 길이를 미리 재 두고 처음부터 그 길이로 (중간에 늘었다 줄었다 하지 않게)
    if (A.clipSeg && A.clipSegFor === A.clip && !(A.propT && PROP.on)) tgt = A.clipSeg[k] || tgt;
    if (BODY.mode === 'cute') tgt = 1;      // 귀여운 모드: 모션캡처 중에도 원래 몸 그대로
    else if (BODY.mode === 'human' && !(A.propT && PROP.on)){
      const base = (A._fixed || (A._fixed = {}))[BODY.mode + k] ?? (A._fixed[BODY.mode + k] = fixedSeg(A)[k]);
      if (A._measuring) tgt = Math.max(tgt, base);
      else tgt = Math.max(base, (A.clipSeg && A.clipSegFor === A.clip && A.clipSeg[k]) || 1);
    }
    setSegLen(A, k, tgt);
  }
  // 목 늘이기: 고개를 기울인 만큼 머리를 목 방향으로 들어 올림 (어깨는 그대로, 머리 밑동은 목뼈와 섞여 늘어남)
  if (A.kind !== 'human'){
    const hb = A.bones[A.handle.head], R = hb && A.rest[hb.name];
    if (R){ _e.setFromQuaternion(_q1.copy(dq.neck).multiply(dq.head), 'XYZ'); const side = Math.abs(_e.z) * R2D; hb.position.copy(R.pos); hb.position.y += smooth01((side - 8) / 30) * 0.02 * A.def.H; }   // 옆으로 기울일 때만 살짝
  }
  // 늘어난 만큼 살짝 홀쭉하게 (부피 느낌 유지)
  const r = k => { const seg = k.slice(0, -1), H = cr[seg] ? Math.max(1.0001, HUMAN_RATIO[seg] / cr[seg]) : 2; return Math.max(0, Math.min(1, ((A.segS[k] || 1) - 1) / (H - 1))); };
  const aL = Math.max(r('upperArmL'), r('forearmL')), aR = Math.max(r('upperArmR'), r('forearmR'));
  const lL = Math.max(r('thighL'), r('shinL')), lR = Math.max(r('thighR'), r('shinR'));
  const fl = sd => { const q = A.pose.rot['thigh'+sd]; _e.setFromQuaternion(q, 'XYZ'); return Math.max(0, Math.min(1, (-_e.x*R2D - 35) / 50)); };
  const mk = A.sbones && A.sbones.thighL ? 0 : 0.7;      // 늘이기 뼈가 있으면 뼈 굵기로 처리
  setSlim(A, [aL*mk, aR*mk, lL*mk, lR*mk, Math.max(fl('L'), fl('R'))]);
}
// 다리를 늘인 만큼 서 있는 몸을 올려 줌 (발이 바닥에 묻히거나 무릎이 과하게 굽지 않게)
function legGrow(A){
  if (!A.segs || !A.legInfo.L) return 0;
  let g = Infinity;
  for (const s of 'LR'){ const info = A.legInfo[s]; if (!info) continue;
    g = Math.min(g, info.a * ((A.segS['thigh'+s] || 1) - 1) + info.b * ((A.segS['shin'+s] || 1) - 1)); }
  return isFinite(g) ? g : 0;
}
function updateJointDots(A){
  if (!A.jdots) return;
  const on = JEMPH.dots && JEMPH.level > 0 && A.visible && A.clip;
  const w = on ? clipJointWeights(A.clip) : null;
  for (const k in A.jdots){
    const g = A.jdots[k], wk = w ? (w[k] || 0) : 0;
    g.visible = wk > 0.25;
    if (!g.visible) continue;
    // 관절 중심은 팔다리 속이라, 카메라 쪽 피부 위로 살짝 꺼내 놓음 (몸 뒤쪽 점은 몸에 가려짐)
    g.userData.bone.getWorldPosition(_v1);
    _v2.copy(cam.position).sub(_v1).normalize().multiplyScalar(A.def.H * A.place.s * (A.def.kind === 'human' ? 0.035 : 0.06));
    _v1.add(_v2); A.root.worldToLocal(_v1); g.position.copy(_v1);
    const seg = JOINTS[k.slice(0, -1)] + k.slice(-1), sp = (A.jspeed && (A.jspeed[seg] || A.jspeed[{shoulder:'upperArm',elbow:'forearm',hip:'thigh',knee:'shin',ankle:'shin',wrist:'forearm'}[k.slice(0,-1)] + k.slice(-1)])) || 0;
    const base = A.def.H * (A.def.kind === 'human' ? 0.014 : A.kind === 'jjak' ? 0.017 : 0.011);
    g.scale.setScalar(base * (0.75 + 0.35*wk + 0.5*sp));
    g.userData.core.material.opacity = 0.55 + 0.4*wk;
    g.userData.core.material.color.setHSL(0.07 - 0.07*sp, 0.95, 0.58);
    g.userData.ring.material.opacity = 0.35 + 0.5*sp;
    g.quaternion.copy(A.root.quaternion).invert().multiply(cam.quaternion);   // 링이 늘 카메라를 보게
  }
}

/* ---------- 접지: 피부 표본 점의 가장 낮은 높이 ---------- */
const _sv = new T.Vector3(), _rootInv = new T.Matrix4();
function lowestY(A, list){
  _rootInv.copy(A.root.matrixWorld).invert();
  let mn = Infinity;
  for (let i = 0; i < list.length; i++){
    const [m, vi] = list[i];
    skinPoint(m, vi, _sv); _sv.applyMatrix4(m.matrixWorld).applyMatrix4(_rootInv);
    if (_sv.y < mn) mn = _sv.y;
  }
  return mn;
}

function contacts(A, list, hz){
  _rootInv.copy(A.root.matrixWorld).invert();
  let yf = Infinity, zf = 0, yb = Infinity, zb = 0;
  for (let i = 0; i < list.length; i++){
    const [m, vi] = list[i]; skinPoint(m, vi, _sv); _sv.applyMatrix4(m.matrixWorld).applyMatrix4(_rootInv);
    if (_sv.z > hz){ if (_sv.y < yf){ yf = _sv.y; zf = _sv.z; } } else if (_sv.y < yb){ yb = _sv.y; zb = _sv.z; }
  }
  if (!isFinite(yf) || !isFinite(yb) || Math.abs(zf - zb) < 1e-3) return null;
  return {yf, zf, yb, zb};
}
/* ---------- 다리 IK ---------- */
const _H = new T.Vector3(), _K = new T.Vector3(), _A = new T.Vector3(), _Tg = new T.Vector3(), _pole = new T.Vector3(), _dir = new T.Vector3(), _Kn = new T.Vector3();
function rotateBoneTo(bone, from, to){
  if (from.lengthSq() < 1e-12 || to.lengthSq() < 1e-12) return;
  _q1.setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
  bone.getWorldQuaternion(_q2); _q2.premultiply(_q1);
  bone.parent.getWorldQuaternion(_q3); bone.quaternion.copy(_q3.invert().multiply(_q2));
  bone.updateMatrixWorld(true);
}
function legTargets(A, meta, groundLocal){
  // 출연자 공간(root 기준)의 발목 목표점과 발 방향
  const out = {};
  // 발의 '수직축 둘레 회전'만 뽑음 (발끝을 세우거나 내려도 방향이 튀지 않게)
  const yawOf = q => 2 * Math.atan2(q.y, q.w);
  for (const [i, s] of [[0,'L'],[1,'R']]){
    const info = A.legInfo[s]; if (!info) continue;
    const ey = n => { _e.setFromQuaternion(A.pose.rot[n], 'XYZ'); return _e.y; };
    const psi = yawOf(A.drvQ.hips) + ey('thigh'+s) + ey('shin'+s) + ey('foot'+s);
    const phi = meta.hr[i]*D2R;
    const hipU = A.hipH * (A._legR || 1);
    // 귀여운 모드(짧은 다리 그대로)는 보폭을 줄여 다리가 접히거나 발이 뜨지 않게
    const stK = BODY.mode === 'cute' && A.kind !== 'human' ? 0.65 : 1;
    const ankle0 = info.ankle.clone(); ankle0.x += meta.st[i][0]*hipU*stK; ankle0.z += meta.st[i][1]*hipU*stK;
    const qy = new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0), psi);
    const ball = info.ball.clone().sub(info.ankle).applyQuaternion(qy).add(ankle0);
    const qf = qy.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0), phi));
    const ank = info.ankle.clone().sub(info.ball).applyQuaternion(qf).add(ball);
    const lift = ((meta.sl && meta.sl[i]) || 0) * hipU * 0.16;
    ank.y += groundLocal + lift; ball.y += groundLocal + lift;
    out[s] = {ankle:ank, qy, qf, w:meta.pl[i]};
  }
  return out;
}
// 다리 두 마디를 '무릎 경첩 축'이 같도록 통째로 방향 맞춤 → 허벅지·정강이가 따로 비틀려 바지가 꼬이지 않음
const _FWD = new T.Vector3(0,0,1), _mr = new T.Matrix4(), _mn = new T.Matrix4();
function orientBone(bone, Wr, Xr, Yr, Xn, Yn, w = 1){
  const yr = Yr.clone().normalize(), xr = Xr.clone().addScaledVector(yr, -Xr.dot(yr)).normalize(), zr = xr.clone().cross(yr);
  const yn = Yn.clone().normalize(), xn = Xn.clone().addScaledVector(yn, -Xn.dot(yn)).normalize(), zn = xn.clone().cross(yn);
  _mr.makeBasis(xr, yr, zr); _mn.makeBasis(xn, yn, zn);
  const q = new T.Quaternion().setFromRotationMatrix(_mn.multiply(_mr.transpose())).multiply(Wr);
  if (w < 0.999){ bone.getWorldQuaternion(_q2); q.copy(_q2.slerp(q, w)); }   // 발을 떼는 순간 튀지 않게 원래 자세와 섞음
  bone.parent.getWorldQuaternion(_q3); bone.quaternion.copy(_q3.invert().multiply(q)); bone.updateMatrixWorld(true);
}
function legOrient(A, s, up, low, H, Kn, Tg, w = 1){
  const L = A.legs[s], R = A.rest, lq = A.lift.getWorldQuaternion(new T.Quaternion());
  const upDir = R[L.low].wp.clone().sub(R[L.up].wp).applyQuaternion(lq), lowDir = R[L.foot].wp.clone().sub(R[L.low].wp).applyQuaternion(lq);
  const fwd = _FWD.clone().applyQuaternion(lq);
  const t1 = Kn.clone().sub(H), t2 = Tg.clone().sub(Kn);
  let hinge = t1.clone().cross(t2);
  if (hinge.lengthSq() < 1e-6 * t1.lengthSq() * t2.lengthSq()){
    // 다리가 거의 펴졌을 때: 발끝 방향으로 무릎이 향하게
    const toe = fwd.clone(); if (A._tqy && A._tqy[s]) toe.set(0,0,1).applyQuaternion(A._tqy[s]).applyQuaternion(A.root.getWorldQuaternion(_q2));
    hinge = t1.clone().cross(toe).negate();
  }
  // 쉬는 자세의 경첩 축 = 앞 × 뼈 방향
  const XrU = fwd.clone().cross(upDir).normalize(), XrL = fwd.clone().cross(lowDir).normalize();
  const WrU = lq.clone().multiply(R[L.up].wq), WrL = lq.clone().multiply(R[L.low].wq);
  // 쉬는 자세 기준으로 무릎이 앞으로 굽는 방향과 맞추기
  const hn = hinge.normalize(); if (hn.dot(XrU) < 0 && t1.clone().cross(t2).lengthSq() < 1e-6 * t1.lengthSq() * t2.lengthSq()) hn.negate();
  orientBone(up, WrU, XrU, upDir, hn, t1, w);
  low.updateMatrixWorld(true);
  const kp = low.getWorldPosition(new T.Vector3());
  orientBone(low, WrL, XrL, lowDir, hn, Tg.clone().sub(kp), w);
}

function solveLegs(A, meta, groundLocal){
  const tg = legTargets(A, meta, groundLocal);
  const rw = A.root;
  // 닿지 않으면 몸 전체를 내림
  let drop = 0;
  for (const s of 'LR'){
    const t = tg[s]; if (!t || t.w < 0.01) continue;
    const L = A.legs[s], info = A.legInfo[s];
    A.bones[L.up].getWorldPosition(_H); rw.worldToLocal(_H);
    A.bones[L.low].getWorldPosition(_K); rw.worldToLocal(_K); A.bones[L.foot].getWorldPosition(_A); rw.worldToLocal(_A);
    const reach = (_H.distanceTo(_K) + _K.distanceTo(_A)) * 0.995;
    const dx = t.ankle.x - _H.x, dz = t.ankle.z - _H.z, hz = Math.hypot(dx, dz);
    if (hz < reach){ const need = (_H.y - t.ankle.y) - Math.sqrt(reach*reach - hz*hz); if (need > drop) drop = need * t.w; }
    else drop = Math.max(drop, (_H.y - t.ankle.y) * t.w);
  }
  if (drop > 0){ A.lift.position.y -= drop; A.root.updateMatrixWorld(true); }
  for (const s of 'LR'){
    const t = tg[s]; if (!t || t.w < 0.01) continue;
    const L = A.legs[s], info = A.legInfo[s];
    const up = A.bones[L.up], low = A.bones[L.low], foot = A.bones[L.foot];
    up.getWorldPosition(_H); low.getWorldPosition(_K); foot.getWorldPosition(_A);
    _Tg.copy(t.ankle); rw.localToWorld(_Tg);
    _Tg.lerpVectors(_A, _Tg, t.w);
    const a = _H.distanceTo(_K), b = _K.distanceTo(_A);
    let d = _H.distanceTo(_Tg); d = Math.max(Math.abs(a-b)+1e-4, Math.min(a+b-1e-4, d));
    _dir.copy(_Tg).sub(_H).normalize();
    // 무릎 방향: 굽힌 다리는 지금 무릎 쪽, 거의 편 다리는 발끝 쪽(앞)
    // 무릎 방향: 발끝이 향한 쪽을 따라감 (안짱·안장다리 방지). 발끝 방향이 다리 축과 거의 나란하면(누운 자세 등) 지금 무릎 쪽
    _pole.copy(_K).sub(_H); _pole.addScaledVector(_dir, -_pole.dot(_dir));
    if (_pole.lengthSq() > 1e-10) _pole.normalize();
    _v3.set(0,0,1).applyQuaternion(t.qy).applyQuaternion(rw.getWorldQuaternion(_q3)); _v3.addScaledVector(_dir, -_v3.dot(_dir));
    _pole.multiplyScalar(0.3).addScaledVector(_v3, 1.0);
    if (_pole.lengthSq() < 1e-10) _pole.copy(_v3);
    _pole.normalize();
    const x = (a*a - b*b + d*d) / (2*d), h = Math.sqrt(Math.max(0, a*a - x*x));
    // 허벅지가 배를 파고들면 무릎을 바깥쪽으로 조금씩 열어 봄 (0·12·24·36도)
    const upQ = up.quaternion.clone(), lowQ = low.quaternion.clone(), K0 = _K.clone(), A0 = _A.clone(), pole0 = _pole.clone();
    const hb = A.bones[A.hipsBone].getWorldPosition(new T.Vector3()), lat = _H.clone().sub(hb); lat.addScaledVector(_dir, -lat.dot(_dir));
    let bestA = 0, bestD = Infinity;
    for (const deg of (COLL.on && COLL.legs && A.vol && A.vol.length ? [0, 12, 24, 36] : [0])){
      up.quaternion.copy(upQ); low.quaternion.copy(lowQ); up.updateMatrixWorld(true);
      _K.copy(K0); _A.copy(A0);
      const ax = _dir.clone(), p1 = pole0.clone().applyAxisAngle(ax, deg*D2R), p2 = pole0.clone().applyAxisAngle(ax, -deg*D2R);
      _pole.copy(p1.dot(lat) >= p2.dot(lat) ? p1 : p2);
      _Kn.copy(_H).addScaledVector(_dir, x).addScaledVector(_pole, h);
      (A._tqy || (A._tqy = {}))[s] = t.qy;
      legOrient(A, s, up, low, _H, _Kn, _Tg, t.w);
      if (!(COLL.on && COLL.legs && A.vol && A.vol.length)) break;
      const dp = thighDepth(A, s); if (dp < bestD - 0.01){ bestD = dp; bestA = deg; }
      if (dp < 0.01) break;
      if (deg === 36 && bestA !== 36){   // 가장 나았던 각도로 되돌리기
        up.quaternion.copy(upQ); low.quaternion.copy(lowQ); up.updateMatrixWorld(true); _K.copy(K0); _A.copy(A0);
        const q1 = pole0.clone().applyAxisAngle(ax, bestA*D2R), q2 = pole0.clone().applyAxisAngle(ax, -bestA*D2R);
        _pole.copy(q1.dot(lat) >= q2.dot(lat) ? q1 : q2);
        _Kn.copy(_H).addScaledVector(_dir, x).addScaledVector(_pole, h);
        legOrient(A, s, up, low, _H, _Kn, _Tg, t.w);
      }
    }
    // 발 방향: 바닥에 평평하게 (뒤꿈치 들기만큼 기울임)
    const rq = rw.getWorldQuaternion(new T.Quaternion());
    const want = rq.clone().multiply(t.qf).multiply(info.footQ);
    foot.getWorldQuaternion(_q2); _q2.slerp(want, t.w);
    foot.parent.getWorldQuaternion(_q3); foot.quaternion.copy(_q3.invert().multiply(_q2)); foot.updateMatrixWorld(true);
    L.toes.forEach((tn, k) => {
      const tb = A.bones[tn], tq = info.toeQ[k]; if (!tb || !tq) return;
      const wt = rq.clone().multiply(t.qy).multiply(tq);
      tb.getWorldQuaternion(_q2); _q2.slerp(wt, t.w);
      tb.parent.getWorldQuaternion(_q3); tb.quaternion.copy(_q3.invert().multiply(_q2)); tb.updateMatrixWorld(true);
    });
  }
}

/* ---------- 모션캡처: 찍힌 사람의 팔다리 비율에 맞춰 캐릭터 팔다리 늘이기 ----------
   MediaPipe 세계 좌표(미터)에서 몸통(어깨 가운데↔골반 가운데) 대비 위팔·아래팔·허벅지·정강이 길이 비율을 재고,
   캐릭터의 같은 비율과 견줘 구간마다 늘임 배율을 정함. 몸통 길이는 그대로 둠. */
const PROP = {on:true, k:0.7};
const LM_SEG = {upperArm:[[11,13],[12,14]], forearm:[[13,15],[14,16]], thigh:[[23,25],[24,26]], shin:[[25,27],[26,28]]};
function lmDist(w, a, b){ const p = w[a], q = w[b]; return Math.hypot(p[0]-q[0], p[1]-q[1], p[2]-q[2]); }
// 한 프레임의 비율 (보이는 것만) → {seg: 비율}
function personRatios(w){
  if (!w) return null;
  const v = i => (w[i][3] ?? 1) > 0.55;
  if (![11,12,23,24].every(v)) return null;
  const mid = (a, b) => [(w[a][0]+w[b][0])/2, (w[a][1]+w[b][1])/2, (w[a][2]+w[b][2])/2];
  const sm = mid(11,12), hm = mid(23,24), torso = Math.hypot(sm[0]-hm[0], sm[1]-hm[1], sm[2]-hm[2]);
  if (torso < 0.15) return null;
  const out = {};
  for (const k in LM_SEG){ const vals = LM_SEG[k].filter(([a,b]) => v(a) && v(b)).map(([a,b]) => lmDist(w, a, b) / torso); if (vals.length) out[k] = vals.reduce((x,y) => x+y, 0) / vals.length; }
  return out;
}
// 캐릭터 쉬는 자세의 같은 비율
function charRatios(A){
  if (A._cr) return A._cr;
  const R = n => A.rest[A.handle[n]] && A.rest[A.handle[n]].wp;
  const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);
  const sm = mid(R('upperArmL'), R('upperArmR')), hm = mid(R('thighL'), R('thighR')), torso = sm.distanceTo(hm);
  const seg = (a, b) => (R(a+'L').distanceTo(R(b+'L')) + R(a+'R').distanceTo(R(b+'R'))) / 2 / torso;
  return (A._cr = {upperArm:seg('upperArm','forearm'), forearm:seg('forearm','hand'), thigh:seg('thigh','shin'), shin:seg('shin','foot')});
}
// 여러 프레임에서 고른 값(가운데값)으로 안정적인 비율
function medianRatios(frames){
  const acc = {upperArm:[], forearm:[], thigh:[], shin:[]};
  for (const w of frames){ const r = personRatios(w); if (!r) continue; for (const k in r) acc[k].push(r[k]); }
  const out = {};
  for (const k in acc){ const a = acc[k].sort((x,y) => x-y); if (a.length >= 5) out[k] = a[a.length >> 1]; }
  return out;
}
function propTargets(A, pr){
  const cr = charRatios(A), out = {};
  for (const k in pr){ if (!cr[k]) continue;
    const raw = pr[k] / cr[k], f = 1 + (raw - 1) * PROP.k;
    out[k] = Math.max(0.8, Math.min(2.4, f)); }
  return out;
}

/* ---------- 물리 법칙: 무게중심 균형 · 점프 포물선 ---------- */
const PHYS = {on:true, g:9.8};
const MASS = {
  human:{trunk:0.28, chest:0.22, head:0.08, upperArm:0.028, forearm:0.016, hand:0.006, thigh:0.10, shin:0.046, foot:0.015},
  chibi:{trunk:0.16, chest:0.17, head:0.36, upperArm:0.02, forearm:0.012, hand:0.008, thigh:0.045, shin:0.025, foot:0.015}};
const _cm = new T.Vector3(), _ca = new T.Vector3(), _cb = new T.Vector3();
function bonePosL(A, drv, out){ const b = A.bones[A.handle[drv]]; if (!b) return null; b.getWorldPosition(out); return A.root.worldToLocal(out); }
// 무게중심 (출연자 공간)
function centerOfMass(A, out){
  const M = A.kind === 'human' ? MASS.human : MASS.chibi; out.set(0,0,0); let tot = 0;
  const add = (p, m) => { if (p){ out.addScaledVector(p, m); tot += m; } };
  const mid = (a, b, m) => { const pa = bonePosL(A, a, _ca), pb = bonePosL(A, b, _cb); if (pa && pb) add(pa.add(pb).multiplyScalar(0.5), m); };
  mid('hips', 'chest', M.trunk); mid('chest', 'neck', M.chest);
  const hb = bonePosL(A, 'head', new T.Vector3()), hp = bonePosL(A, 'hips', new T.Vector3());
  if (hb && hp){ const up = hb.clone().sub(hp).normalize(); add(hb.addScaledVector(up, (A.kind === 'human' ? 0.05 : 0.2) * A.def.H), M.head); }
  for (const s of 'LR'){
    mid('upperArm'+s, 'forearm'+s, M.upperArm); mid('forearm'+s, 'hand'+s, M.forearm); add(bonePosL(A, 'hand'+s, new T.Vector3()), M.hand);
    mid('thigh'+s, 'shin'+s, M.thigh); mid('shin'+s, 'foot'+s, M.shin); mid('foot'+s, 'toe'+s, M.foot);
  }
  return tot ? out.multiplyScalar(1/tot) : null;
}
function hull2(pts){
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cr = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  const lo = [], up = [];
  for (const p of pts){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length-1; i >= 0; i--){ const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// 디딤 영역(발바닥 볼록 다각형) 안으로 무게중심을 옮기는 데 필요한 수평 이동
function balanceShift(A, m){
  const pts = [];
  for (const [i, s] of [[0,'L'],[1,'R']]){
    if (m.pl[i] < 0.5 || !A.legs[s]) continue;
    const an = A.bones[A.legs[s].foot].getWorldPosition(new T.Vector3()), ba = A.bones[A.legs[s].ball].getWorldPosition(new T.Vector3());
    A.root.worldToLocal(an); A.root.worldToLocal(ba);
    const d = ba.clone().sub(an); d.y = 0; const L = d.length() || 0.05; d.normalize();
    const side = new T.Vector3(d.z, 0, -d.x).multiplyScalar(L*0.32);
    const heel = an.clone().addScaledVector(d, -L*0.3), toe = ba.clone().addScaledVector(d, L*0.35);
    for (const p of [heel.clone().add(side), heel.clone().sub(side), toe.clone().add(side), toe.clone().sub(side)]) pts.push([p.x, p.z]);
  }
  if (pts.length < 3) return null;
  const com = centerOfMass(A, _cm); if (!com) return null;
  const H = hull2(pts), c = [com.x - (A.comBias ? A.comBias[0] : 0), com.z - (A.comBias ? A.comBias[1] : 0)];
  // 안쪽이면 이동 없음
  let inside = true;
  for (let i = 0; i < H.length; i++){ const a = H[i], b = H[(i+1) % H.length]; if ((b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]) < 0){ inside = false; break; } }
  if (inside) return [0, 0];
  // 가장 가까운 테두리 점 (조금 안쪽으로)
  let best = null, bd = Infinity;
  for (let i = 0; i < H.length; i++){
    const a = H[i], b = H[(i+1) % H.length], ex = b[0]-a[0], ez = b[1]-a[1], l2 = ex*ex + ez*ez || 1e-9;
    const u = Math.max(0, Math.min(1, ((c[0]-a[0])*ex + (c[1]-a[1])*ez) / l2)), px = a[0] + ex*u, pz = a[1] + ez*u;
    const dd = (px-c[0])**2 + (pz-c[1])**2; if (dd < bd){ bd = dd; best = [px, pz]; }
  }
  let cx = 0, cz = 0; for (const p of H){ cx += p[0]; cz += p[1]; } cx /= H.length; cz /= H.length;
  best[0] += (cx - best[0]) * 0.15; best[1] += (cz - best[1]) * 0.15;
  return [best[0] - c[0], best[1] - c[1]];
}
// 클립의 공중 구간 (두 발 모두 뜬 키 묶음) → [이륙, 착지]
function clipFlights(c){
  if (!c || !c.keys || c.source !== 'keys') return [];
  if (c._fl) return c._fl;
  // 두 발이 다 풀려 있고 몸을 위로 띄운 키만 '공중' (발만 풀고 바닥에서 도는 동작은 제외)
  const ks = c.keys, air = k => k.meta && (k.meta.g || 'feet') === 'feet' && k.meta.pl[0] < 0.01 && k.meta.pl[1] < 0.01 && k.pose.root.y > 0.02;
  const out = [];
  for (let i = 0; i < ks.length; i++){
    if (!air(ks[i])) continue;
    let j = i; while (j + 1 < ks.length && air(ks[j+1])) j++;
    let t0 = i > 0 ? (ks[i-1].t + ks[i].t) / 2 : ks[i].t, t1 = j + 1 < ks.length ? (ks[j].t + ks[j+1].t) / 2 : ks[j].t;
    // 공중 시간은 사람 점프처럼 최대 0.5초 (키 간격이 길어도 1m씩 튀어 오르지 않게) — 공중 키 시각을 가운데로
    const MAXF = 0.5;
    if (t1 - t0 > MAXF){ const c = Math.max(t0 + MAXF/2, Math.min(t1 - MAXF/2, (ks[i].t + ks[j].t) / 2)); t0 = c - MAXF/2; t1 = c + MAXF/2; }
    if (t1 - t0 > 0.04) out.push([t0, t1]);
    i = j;
  }
  return (c._fl = out);
}

const _sh = new T.Vector3(), _hd = new T.Vector3();
function armOnFloor(A, sd, gl){
  const list = A.samples['arm'+sd]; if (!list || !list.length) return;
  const ub = A.bones[A.handle['upperArm'+sd]], hb = A.bones[A.handle['hand'+sd]]; if (!ub || !hb) return;
  for (let it = 0; it < 4; it++){
    const mn = lowestY(A, list) - gl; if (mn > -0.002 * A.def.H) return;
    ub.getWorldPosition(_sh); hb.getWorldPosition(_hd);
    const v = _hd.clone().sub(_sh), L = v.length(); if (L < 1e-6) return;
    const w = v.clone(); w.y += -mn * A.place.s * 1.05;                  // 손을 바닥 높이까지
    if (Math.abs(w.y) >= L) w.y = Math.sign(w.y) * L * 0.999;
    const hz = Math.sqrt(Math.max(0, L*L - w.y*w.y));
    // 팔이 거의 수직으로 내려와 있으면 옆(몸 바깥)으로 짚게 — 몸 안으로 접혀 들어가지 않게
    const lat = _sh.clone().sub(A.bones[A.handle.chest].getWorldPosition(new T.Vector3())); lat.y = 0;
    const hv = new T.Vector3(v.x, 0, v.z), h0 = hv.length();
    if (lat.lengthSq() > 1e-10) lat.normalize();
    // 수직에 가까울수록 바깥쪽을 더 많이 섞음 (경계에서 갑자기 바뀌지 않게 연속으로)
    const kk = Math.max(0, Math.min(1, 1 - h0 / (0.5 * L))), kLat = kk * kk * (3 - 2 * kk);
    const dir = h0 > 1e-6 ? hv.clone().multiplyScalar(1 / h0) : lat.clone();
    dir.lerp(lat, Math.max(kLat, hv.dot(lat) < 0 ? 0.35 : 0)); if (dir.lengthSq() < 1e-8) dir.copy(lat);
    dir.normalize(); w.x = dir.x * hz; w.z = dir.z * hz;
    rotateBoneTo(ub, v, w);
  }
}
/* ---------- 몸 겹침 막기: 머리·가슴·배를 타원 덩어리로 보고, 팔다리가 파고들면 밖으로 비켜 줌 ---------- */
const COLL = {on:true, legs:false, limbR:0.6, vol:0.9, swivel:true, flex:true, head:true};
function boneDesc(A, name){ const out = new Set(), b = A.bones[name]; if (b) b.traverse(o => { if (o.isBone) out.add(o.name); }); return out; }
function setupVolumes(A){
  const tpl = A.tpl;
  if (tpl._vol){ A.vol = tpl._vol.vol; A.limbR = tpl._vol.limbR; return; }
  const H = A.handle, D = n => boneDesc(A, H[n]);
  const head = D('head'), chestAll = D('chest'), neck = D('neck'), hipsAll = D('hips');
  const shoulders = new Set([...D('shoulderL'), ...D('shoulderR'), ...D('upperArmL'), ...D('upperArmR')]);
  const thighs = new Set([...D('thighL'), ...D('thighR')]);
  const chest = new Set([...chestAll].filter(n => !neck.has(n) && !shoulders.has(n)));
  const belly = new Set([...hipsAll].filter(n => !chestAll.has(n) && !thighs.has(n)));
  const limbSets = {}; for (const sd of 'LR') for (const k of ['upperArm','forearm','thigh','shin']){
    const a = boneDesc(A, H[k+sd]), nx = {upperArm:'forearm', forearm:'hand', thigh:'shin', shin:'foot'}[k], b = boneDesc(A, H[nx+sd]);
    limbSets[k+sd] = new Set([...a].filter(n => !b.has(n))); }
  const groups = {head:[], chest:[], belly:[]}, limbD = {};
  // 배 덩어리는 고관절보다 위쪽 살만 (바지·엉덩이 아래는 다리와 늘 붙어 있으니 빼기)
  const hj = A.rest[H.thighL].wp, kj = A.rest[H.shinL].wp, hipTop = hj.y + (hj.y - kj.y) * 0.15;
  const inv = new T.Matrix4().copy(A.lift.matrixWorld).invert(), p = new T.Vector3();
  const axis = k => [A.rest[H[k]].wp, A.rest[H[{upperArmL:'forearmL',upperArmR:'forearmR',forearmL:'handL',forearmR:'handR',thighL:'shinL',thighR:'shinR',shinL:'footL',shinR:'footR'}[k]]].wp];
  for (const m of A.inst.meshes){
    const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = g.attributes.position.count, names = m.skeleton.bones.map(b => b.name);
    const st = Math.max(1, Math.floor(n / 6000));
    for (let i = 0; i < n; i += st){
      let best = 0, bw = -1; for (let j = 0; j < 4; j++){ const w = gc(sw,i,j); if (w > bw){ bw = w; best = gc(si,i,j); } }
      const nm = names[best];
      skinPoint(m, i, p); p.applyMatrix4(m.matrixWorld).applyMatrix4(inv);
      if (head.has(nm)) groups.head.push(p.clone()); else if (chest.has(nm)) groups.chest.push(p.clone()); else if (belly.has(nm) && p.y > hipTop) groups.belly.push(p.clone());
      for (const k in limbSets) if (limbSets[k].has(nm)){ const [a, b] = axis(k), ab = b.clone().sub(a);
        const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); (limbD[k] || (limbD[k] = [])).push(a.clone().addScaledVector(ab, t).distanceTo(p)); }
    }
  }
  groups.torso = groups.chest.concat(groups.belly);
  const frame = {head:H.head, chest:H.chest, belly:H.hips, torso:H.spine};
  const vol = [];
  for (const k in groups){
    const pts = groups[k]; if (pts.length < 20) continue;
    const R = A.rest[frame[k]], qi = R.wq.clone().invert();
    const lo = new T.Vector3(1e9,1e9,1e9), hi = new T.Vector3(-1e9,-1e9,-1e9);
    for (const q of pts){ const l = q.clone().sub(R.wp).applyQuaternion(qi); lo.min(l); hi.max(l); }
    vol.push({name:k, bone:frame[k], c:lo.clone().add(hi).multiplyScalar(0.5), a:hi.clone().sub(lo).multiplyScalar(0.5 * (k === 'torso' ? 1.0 : COLL.vol)), a0:hi.clone().sub(lo).multiplyScalar(0.5 * 0.97), noColl:k === 'chest' || k === 'belly'});
  }
  const med = a => { if (!a || !a.length) return 0.02; a.sort((x,y) => x-y); return a[a.length >> 1]; };
  const limbR = {}; for (const k in limbSets) limbR[k] = med(limbD[k]);
  // 쉬는 자세(차렷·T자)에서 팔다리가 덩어리에 닿지 않을 만큼만 덩어리 크기를 줄여 맞춤
  const restPts = [];
  for (const sd of 'LR'){
    const P = n => A.rest[H[n+sd]].wp;
    for (const t of [0.6, 1]){ restPts.push([P('thigh').clone().lerp(P('shin'), t), limbR['thigh'+sd]]); restPts.push([P('upperArm').clone().lerp(P('forearm'), t), limbR['upperArm'+sd], 'chest']); }
    for (const t of [0.5, 1]){ restPts.push([P('shin').clone().lerp(P('foot'), t), limbR['shin'+sd]]); restPts.push([P('forearm').clone().lerp(P('hand'), t), limbR['forearm'+sd]]); }
  }
  for (const V of vol){
    const R = A.rest[V.bone], qi = R.wq.clone().invert();
    let f = 1;
    for (let it = 0; it < 8; it++){
      let mn = Infinity;
      for (const [q, r, skip] of restPts){ if (skip === V.name) continue;
        const l = q.clone().sub(R.wp).applyQuaternion(qi).sub(V.c), rr = r * COLL.limbR;
        mn = Math.min(mn, Math.hypot(l.x/(V.a.x*f + rr), l.y/(V.a.y*f + rr), l.z/(V.a.z*f + rr))); }
      if (mn >= 1.05) break;
      f *= 0.92;
    }
    V.a.multiplyScalar(f);
  }
  tpl._vol = {vol, limbR}; A.vol = vol; A.limbR = limbR;
}
const _cq = new T.Quaternion(), _cpv = new T.Vector3(), _cl = new T.Vector3(), _cd = new T.Vector3();
// 점 p(세계)가 덩어리 안이면 밖으로 나갈 이동(세계)을 out 에 넣고 깊이(0~1) 돌려줌
function volPush(A, V, p, r, out, sideX){
  const b = A.bones[V.bone], s = A.place.s;
  b.getWorldPosition(_cpv); b.getWorldQuaternion(_cq);
  _cl.copy(p).sub(_cpv).applyQuaternion(_cq.invert()).divideScalar(s).sub(V.c);
  const ax = V.a.x + r, ay = V.a.y + r, az = V.a.z + r;
  const e = Math.sqrt((_cl.x/ax)**2 + (_cl.y/ay)**2 + (_cl.z/az)**2);
  if (e >= 1 || e < 1e-4) return 0;
  if (V.name === 'head' && sideX){
    // 머리: 팔을 옆(자기 쪽)으로만 비켜 냄 — 얼굴 앞으로 가로지르지 않게
    const rest = 1 - (_cl.y / ay) ** 2 - (_cl.z / az) ** 2; if (rest <= 0) return 0;
    const sg = sideX;       // 늘 자기 쪽으로 (반대편으로 넘어가 얼굴을 가로지르지 않게)
    b.getWorldQuaternion(_cq); out.set(sg * ax * Math.sqrt(rest) - _cl.x, 0, 0).multiplyScalar(s).applyQuaternion(_cq);
    return 1 - e;
  }
  if (V.name === 'torso'){
    // 팔이 자기 쪽에 있으면 밀지 않음 — 몸통을 가로질러 반대쪽으로 넘어갈 때만 (팔 가로 당기기·팔짱 등)
    if (sideX && _cl.x * sideX > -0.15 * V.a.x) return 0;
    // 몸통은 같은 높이에서 앞·옆으로만 밀어냄 (위로 밀어 올리지 않게)
    const hy = (_cl.y / ay) ** 2, hxz = (_cl.x / ax) ** 2 + (_cl.z / az) ** 2;
    if (hy >= 1 || hxz < 1e-8) return 0;
    const k = Math.sqrt((1 - hy) / hxz);
    b.getWorldQuaternion(_cq); out.set(_cl.x * (k - 1), 0, _cl.z * (k - 1)).multiplyScalar(s).applyQuaternion(_cq);
    return 1 - e;
  }
  b.getWorldQuaternion(_cq); out.copy(_cl).multiplyScalar(1/e - 1).multiplyScalar(s).applyQuaternion(_cq);
  return 1 - e;
}
// 한 마디(pivot→end)를 덩어리들 밖으로 돌려 빼기. skip: 이 마디에서 검사하지 않을 덩어리 이름
function pushSeg(A, bone, pivotName, endName, r, ts, skip, maxDeg, rotBone, sideX){
  const pv = A.bones[pivotName].getWorldPosition(new T.Vector3()), en = A.bones[endName].getWorldPosition(new T.Vector3());
  let bestD = null, bestDepth = 0, bestP = null;
  for (const t of ts){
    const p = pv.clone().lerp(en, t);
    for (const V of A.vol){ if (V.noColl || (skip && skip.includes(V.name))) continue;
      const dep = volPush(A, V, p, r, _cd, sideX); if (dep > bestDepth){ bestDepth = dep; bestD = _cd.clone(); bestP = p; } }
  }
  if (!bestD) return false;
  // rotBone 이 있으면 그 뼈(어깨)를 돌려서 밀어냄 → 팔꿈치 각도는 동작 그대로
  const rb = rotBone || bone, rp = rotBone ? rotBone.getWorldPosition(new T.Vector3()) : pv;
  const v = bestP.clone().sub(rp), w = v.clone().add(bestD.multiplyScalar(1.05));
  const ang = v.angleTo(w), lim = maxDeg * D2R;
  if (ang > lim){ const q = new T.Quaternion().setFromUnitVectors(v.clone().normalize(), w.clone().normalize()); const qa = new T.Quaternion().slerp(q, lim / ang); w.copy(v).applyQuaternion(qa); }
  rotateBoneTo(rb, v, w);
  return true;
}
function resolveArms(A){
  if (!COLL.on || BODY.mode === 'cute' || !A.vol || !A.vol.length) return;
  const s = A.place.s;
  for (const sd of 'LR'){
    const ub = A.bones[A.handle['upperArm'+sd]], fb = A.bones[A.handle['forearm'+sd]], hb = A.bones[A.handle['hand'+sd]]; if (!ub || !fb || !hb) continue;
    const rU = A.limbR['upperArm'+sd] * s * COLL.limbR, rF = A.limbR['forearm'+sd] * s * COLL.limbR;
    // 이 팔이 몸통의 어느 쪽인지 (몸통 뼈 기준 좌우 부호)
    const TV = A.vol.find(v => v.name === 'torso'); let sideX = 0;
    if (TV){ const tb = A.bones[TV.bone]; tb.getWorldQuaternion(_cq); const l = ub.getWorldPosition(new T.Vector3()).sub(tb.getWorldPosition(new T.Vector3())).applyQuaternion(_cq.invert()).divideScalar(s).sub(TV.c); sideX = Math.sign(l.x) || 0; }
    for (let it = 0; it < 5; it++){ if (!pushSeg(A, ub, ub.name, fb.name, rU, [0.75, 1], ['head'], 40, null, sideX)) break; ub.updateMatrixWorld(true); }
    for (let it = 0; it < 5; it++){ if (!pushSeg(A, fb, fb.name, hb.name, rF, [0.25, 0.5, 0.75, 1], ['head'], 30, ub, sideX)) break; ub.updateMatrixWorld(true); }
    // 팔짱·가슴 앞 손: 팔꿈치 각도는 그대로, 어깨에서 팔을 앞으로 조금 들어 아래팔이 가슴 속에 묻히지 않게
    if (COLL.flex) flexOut(A, sd, ub, fb, hb, sideX);
    // 큰 머리: 팔을 위로 올릴 때 위팔·팔꿈치가 머리 속으로 들어가지 않게 어깨에서 바깥으로 (손끝은 손 닿기가 따로 맞춤)
    const notHead = A.vol.filter(v => v.name !== 'head').map(v => v.name);
    // 머리 기준으로 이 팔이 어느 쪽인지 (머리뼈 축이 몸통과 다를 수 있어 따로 잼)
    const HV = A.vol.find(v => v.name === 'head'); let sideH = sideX;
    if (HV){ const hb_ = A.bones[HV.bone]; hb_.getWorldQuaternion(_cq); const l = ub.getWorldPosition(new T.Vector3()).sub(hb_.getWorldPosition(new T.Vector3())).applyQuaternion(_cq.invert()).divideScalar(s).sub(HV.c); sideH = Math.sign(l.x) || sideX; }
    for (let it = 0; it < (COLL.head ? 6 : 0); it++){
      const a_ = pushSeg(A, ub, ub.name, fb.name, rU, [0.6, 1], notHead, 45, null, sideH); ub.updateMatrixWorld(true);
      const b_ = pushSeg(A, fb, fb.name, hb.name, rF, [0.2, 0.45], notHead, 45, ub, sideH); ub.updateMatrixWorld(true);
      if (!a_ && !b_) break;
    }
  }
}
// 발을 딛지 않은 다리: 허벅지·정강이를 배·가슴 밖으로
function resolveFreeLegs(A, m){
  if (!COLL.on || !COLL.legs || !A.vol || !A.vol.length) return;
  const s = A.place.s;
  for (const [i, sd] of [[0,'L'],[1,'R']]){
    if (m.pl[i] > 0.5 && (m.g === 'feet' || m.g === 'seat')) continue;
    const tb = A.bones[A.handle['thigh'+sd]], sb = A.bones[A.handle['shin'+sd]], fb = A.bones[A.handle['foot'+sd]]; if (!tb || !sb || !fb) continue;
    const rT = A.limbR['thigh'+sd] * s * COLL.limbR, rS = A.limbR['shin'+sd] * s * COLL.limbR;
    for (let it = 0; it < 3; it++){ if (!pushSeg(A, tb, tb.name, sb.name, rT, [0.6, 1], null, 25)) break; tb.updateMatrixWorld(true); }
    for (let it = 0; it < 2; it++){ if (!pushSeg(A, sb, sb.name, fb.name, rS, [0.5, 1], ['belly'], 30)) break; sb.updateMatrixWorld(true); }
  }
}
// 딛은 다리의 허벅지가 배를 얼마나 파고드는지
function thighDepth(A, sd){
  const tb = A.bones[A.handle['thigh'+sd]], sb = A.bones[A.handle['shin'+sd]];
  const r = A.limbR['thigh'+sd] * A.place.s * COLL.limbR, pv = tb.getWorldPosition(new T.Vector3()), en = sb.getWorldPosition(new T.Vector3());
  let d = 0; for (const t of [0.6, 1]){ const p = pv.clone().lerp(en, t); for (const V of A.vol) d = Math.max(d, volPush(A, V, p, r, _cd)); }
  return d;
}

/* ---------- 손 닿기: 몸의 기준점(뒤통수·볼·턱·허리·무릎·발끝 등)에 손바닥을 갖다 댐 (캐릭터 몸집에 맞춰 자동) ---------- */
const LMK = {
  headBack:{v:'head', d:[0,-0.2,-1]}, nape:{v:'head', d:[0,-0.7,-0.75]}, headTop:{v:'head', d:[0,1,0.1]}, headFront:{v:'head', d:[0,0.1,1]}, forehead:{v:'head', d:[0,0.45,1]},
  cheekL:{v:'head', d:[0.8,-0.35,0.55]}, cheekR:{v:'head', d:[-0.8,-0.35,0.55]}, chin:{v:'head', d:[0,-0.85,0.55]},
  earL:{v:'head', d:[1,0.05,0]}, earR:{v:'head', d:[-1,0.05,0]}, headSideL:{v:'head', d:[1,0.4,0]}, headSideR:{v:'head', d:[-1,0.4,0]},
  chest:{v:'chest', d:[0,0,1]}, chestL:{v:'chest', d:[0.5,0,0.85]}, chestR:{v:'chest', d:[-0.5,0,0.85]}, belly:{v:'belly', d:[0,0,1]},
  hipL:{v:'belly', d:[1,-0.45,0]}, hipR:{v:'belly', d:[-1,-0.45,0]}, backL:{v:'belly', d:[0.45,0,-1]}, backR:{v:'belly', d:[-0.45,0,-1]},
  kneeL:{b:'shinL', f:0.05, d:[0,0,1]}, kneeR:{b:'shinR', f:0.05, d:[0,0,1]}, shinL:{b:'shinL', f:0.5, d:[0,0,1]}, shinR:{b:'shinR', f:0.5, d:[0,0,1]},
  elbowL:{b:'forearmL', f:0, d:[0,1,0]}, elbowR:{b:'forearmR', f:0, d:[0,1,0]},
  toeL:{b:'toeL', f:0, d:[0,0.6,1]}, toeR:{b:'toeR', f:0, d:[0,0.6,1]}, ankleL:{b:'footL', f:0, d:[0,0,-1]}, ankleR:{b:'footR', f:0, d:[0,0,-1]},
};
function setupLandmarks(A){
  const tpl = A.tpl; if (tpl._lmk){ A.lmk = tpl._lmk; return; }
  const H = A.handle, out = {}, rHand = ((A.limbR.forearmL || 0.03) * 0.55);
  for (const k in LMK){
    const L = LMK[k]; let bone, p;
    const d = new T.Vector3(...L.d).normalize();
    if (L.v){
      const V = (A.vol || []).find(v => v.name === L.v); if (!V) continue;
      const R = A.rest[V.bone], a = V.a0 || V.a;
      const dl = d.clone().applyQuaternion(R.wq.clone().invert());       // 뼈 기준 방향
      const t = 1 / Math.sqrt((dl.x/a.x)**2 + (dl.y/a.y)**2 + (dl.z/a.z)**2);
      p = R.wp.clone().add(V.c.clone().add(dl.multiplyScalar(t)).applyQuaternion(R.wq)).addScaledVector(d, rHand);
      bone = V.bone;
    } else {
      const bn = H[L.b]; if (!bn || !A.rest[bn]) continue;
      const R = A.rest[bn], ch = A.bones[bn].children.find(c => c.isBone && A.rest[c.name]);
      p = R.wp.clone(); if (ch && L.f) p.lerp(A.rest[ch.name].wp, L.f);
      p.addScaledVector(d, (/^forearm/.test(L.b) ? (A.limbR.upperArmL || 0.03) : (A.limbR['shinL'] || 0.03)) * 0.9 + rHand);
      bone = bn;
    }
    const R = A.rest[bone];
    out[k] = {bone, local:p.sub(R.wp).applyQuaternion(R.wq.clone().invert())};
  }
  tpl._lmk = out; A.lmk = out;
}
function landmarkWorld(A, name, out){
  const L = A.lmk && A.lmk[name]; if (!L) return null;
  const b = A.bones[L.bone]; b.getWorldPosition(out); b.getWorldQuaternion(_q1);
  return out.add(_v1.copy(L.local).multiplyScalar(A.place.s).applyQuaternion(_q1));
}
const _hS = new T.Vector3(), _hE = new T.Vector3(), _hW = new T.Vector3(), _hT = new T.Vector3(), _hP = new T.Vector3(), _hG = new T.Vector3();
const ARM_STRETCH = {jjak:4, buri:4, human:1.3};
function handIK(A){
  const c = A.clip, m = A.meta; if (!c || !m.hw || COLL.noIK) return;
  // 다른 팔 팔꿈치를 잡는 손은 나중에 (상대 팔이 먼저 자리 잡게)
  const order = [[0,'L'],[1,'R']].sort((p, q) => (/^elbow/.test((m.ht && m.ht[p[0]]) || '') ? 1 : 0) - (/^elbow/.test((m.ht && m.ht[q[0]]) || '') ? 1 : 0));
  for (const [i, sd] of order){
    const w = m.hw[i], name = (m.ht && m.ht[i]) || (c.hands && c.hands[sd]);
    if (!name || w < 0.01){ swivelRelease(A, sd); continue; }
    const ub = A.bones[A.handle['upperArm'+sd]], fb = A.bones[A.handle['forearm'+sd]], hb = A.bones[A.handle['hand'+sd]]; if (!ub || !fb || !hb) continue;
    if (!landmarkWorld(A, name, _hT)) continue;
    const hx = m.hx && m.hx[i];
    if (hx && landmarkWorld(A, hx.a, _hG)){ const pa = _hG.clone(); if (landmarkWorld(A, hx.b, _hG)) _hT.copy(pa.multiplyScalar(hx.wa).addScaledVector(_hG, hx.wb).multiplyScalar(1 / Math.max(1e-6, hx.wa + hx.wb))); }
    // 닿지 않으면 닿을 만큼만 팔을 늘임 (캐릭터별 한도)
    {
      ub.getWorldPosition(_hS); fb.getWorldPosition(_hE); hb.getWorldPosition(_hW);
      const g0 = gripWorld(A, sd) ? _gp[sd] : _hW, reachTo = _hT.clone().sub(g0.clone().sub(_hW));
      const len = _hS.distanceTo(_hE) + _hE.distanceTo(_hW), need = _hS.distanceTo(reachTo) / (len * 0.97);
      const f = 1 + (Math.min(ARM_STRETCH[A.kind] || 1.05, Math.max(1, need)) - 1) * w;
      if (f > 1.001 && stretchOn(A) && !(A.clipSeg && A.clipSegFor === A.clip && !A._measuring)) for (const k of ['upperArm'+sd, 'forearm'+sd]) setSegLen(A, k, (A.segS[k] || 1) * f);
      ub.updateMatrixWorld(true);
    }
    // 완전히 닿은 자세를 먼저 구하고, 원래 동작과의 사이를 '각도'로 섞음 (목표 위치를 섞으면 팔꿈치가 휘청거림)
    const q0u = ub.quaternion.clone(), q0f = fb.quaternion.clone();
    for (let it = 0; it < 2; it++){
      ub.getWorldPosition(_hS); fb.getWorldPosition(_hE); hb.getWorldPosition(_hW);
      // 손바닥 가운데가 목표에 닿도록 손목 목표를 정함
      const g = gripWorld(A, sd) ? _gp[sd] : _hW;
      const tgt = _hT.clone().sub(g.clone().sub(_hW));
      const a = _hS.distanceTo(_hE), b = _hE.distanceTo(_hW);
      let d = _hS.distanceTo(tgt); d = Math.max(Math.abs(a-b) + 1e-4, Math.min(a + b - 1e-4, d));
      const dir = tgt.clone().sub(_hS).normalize();
      _hP.copy(_hE).sub(_hS); _hP.addScaledVector(dir, -_hP.dot(dir));
      if (_hP.lengthSq() < 1e-10) _hP.set(0, -1, 0).addScaledVector(dir, dir.y);
      _hP.normalize();
      const x = (a*a - b*b + d*d) / (2*d), h = Math.sqrt(Math.max(0, a*a - x*x));
      const En = _hS.clone().addScaledVector(dir, x).addScaledVector(_hP, h);
      rotateBoneTo(ub, _hE.clone().sub(_hS), En.clone().sub(_hS));
      fb.getWorldPosition(_hE); hb.getWorldPosition(_hW);
      rotateBoneTo(fb, _hW.clone().sub(_hE), tgt.clone().sub(_hE));
    }
    if (w < 0.999){ ub.quaternion.copy(q0u.slerp(ub.quaternion, w)); fb.quaternion.copy(q0f.slerp(fb.quaternion, w)); ub.updateMatrixWorld(true); }
    if (COLL.swivel) swivelOut(A, sd, ub, fb, hb);
  }
}
// 손은 목표에 둔 채, 팔꿈치를 어깨-손목 축으로 돌려 가슴·머리 속에 묻히지 않는 쪽으로 (팔 가로 당기기·팔짱·턱 괴기 등)
const _swQ = new T.Quaternion(), _swQ2 = new T.Quaternion(), _swA = new T.Vector3();
function armPen(A, sd, ub, fb, hb, sideX){
  if (!A.vol) return 0;
  const S_ = ub.getWorldPosition(new T.Vector3()), E = fb.getWorldPosition(new T.Vector3()), W_ = hb.getWorldPosition(new T.Vector3());
  const rU = A.limbR['upperArm'+sd] * A.place.s * COLL.limbR, rF = A.limbR['forearm'+sd] * A.place.s * COLL.limbR;
  let pen = 0;
  for (const [p, r] of [[S_.clone().lerp(E, 0.6), rU], [E, rU], [E.clone().lerp(W_, 0.35), rF], [E.clone().lerp(W_, 0.65), rF]])
    for (const V of A.vol){ if (V.noColl) continue; pen += volPush(A, V, p, r, _cd, V.name === 'torso' ? (sideX || 0) : 0); }
  // 손이 얼굴 앞을 가리지 않게 (손 닿기 동작이 아닐 때만 쓰임)
  if (!A.meta.hw || !(A.meta.hw[sd === 'L' ? 0 : 1] > 0.01)){ const HV = A.vol.find(v => v.name === 'head'); if (HV) pen += volPush(A, HV, W_, rF * 3, _cd, 0); }
  return pen;
}
function flexOut(A, sd, ub, fb, hb, sideX){
  ub.updateMatrixWorld(true);
  const TH = 0.05, key = 'fx' + sd;
  const cb = A.bones[A.handle.chest]; if (!cb) return;
  const cq = cb.getWorldQuaternion(new T.Quaternion()), lat = new T.Vector3(1, 0, 0).applyQuaternion(cq), fwd = new T.Vector3(0, 0, 1).applyQuaternion(cq);
  const pq = ub.parent.getWorldQuaternion(new T.Quaternion()), wq0 = ub.getWorldQuaternion(new T.Quaternion()), save = ub.quaternion.clone();
  const E0 = fb.getWorldPosition(new T.Vector3()).dot(fwd);
  const setA = th => { _swQ.setFromAxisAngle(lat, th).multiply(wq0); ub.quaternion.copy(_swQ2.copy(pq).invert().multiply(_swQ)); ub.updateMatrixWorld(true); };
  let target = 0;
  if (armPen(A, sd, ub, fb, hb, sideX) >= TH){
    setA(5 * D2R); const sg = fb.getWorldPosition(_v3).dot(fwd) >= E0 ? 1 : -1;
    let bp = 1e9;
    for (let d = 2; d <= 32; d += 2){ setA(sg * d * D2R); const p = armPen(A, sd, ub, fb, hb, sideX); if (p < bp - 1e-3){ bp = p; target = sg * d * D2R; } if (p < TH){ target = sg * d * D2R; break; } }
  }
  const th = smoothAngle(A, key, target, 200 * D2R, true);
  if (Math.abs(th) > 1e-4) setA(th); else { ub.quaternion.copy(save); ub.updateMatrixWorld(true); }
}
// 시간에 따라 부드럽게: 같은 시각에 다시 부르면 앞 결과를 그대로, 다음 프레임엔 초당 정해진 각도까지만 바뀜 (좌우로 튀지 않게)
// 화면 한 장(프레임) 번호와 걸린 시간 — 멈춤·실시간 따라하기처럼 동작 시간이 그대로여도 매 화면마다 부드럽게 따라가게
const FRAME = {id:0, dt:1/60};
function smoothAngle(A, key, target, rate, fresh0){
  if (A._measuring) return target;
  const st = (A._smA || (A._smA = {}))[key] || (A._smA[key] = {th:0, t:-1e9, f:-1});
  const t = A._ct ?? 0; let dt = t - st.t;
  if (Math.abs(dt) < 1e-6){ if (st.f === FRAME.id) return st.th; dt = FRAME.dt; }    // 같은 화면에서 또 부르면 같은 값, 새 화면이면 실제 흐른 시간만큼
  st.f = FRAME.id;
  const cont = dt > 0 && dt < 0.25;
  // 처음·건너뛰기: 기울기는 바로 목표로, 팔꿈치 돌림은 0에서 시작해 천천히
  const base = cont ? st.th : (fresh0 ? 0 : target), lim = rate * (cont ? dt : 1/30);
  const th = base + Math.max(-lim, Math.min(lim, target - base));
  st.th = th; st.t = t; return th;
}
// 손 닿기가 끝나도 팔꿈치 돌림을 한 번에 풀지 않고 천천히 0으로
function swivelRelease(A, sd){
  const st = A._smA && A._smA['sw' + sd]; if (!st || Math.abs(st.th) < 1e-3) return;
  const ub = A.bones[A.handle['upperArm'+sd]], hb = A.bones[A.handle['hand'+sd]]; if (!ub || !hb) return;
  ub.updateMatrixWorld(true);
  const S_ = ub.getWorldPosition(new T.Vector3()); _swA.copy(hb.getWorldPosition(new T.Vector3())).sub(S_); if (_swA.lengthSq() < 1e-10) return; _swA.normalize();
  const th = smoothAngle(A, 'sw' + sd, 0, 240 * D2R, true); if (Math.abs(th) < 1e-4) return;
  const pq = ub.parent.getWorldQuaternion(new T.Quaternion()), wq0 = ub.getWorldQuaternion(new T.Quaternion());
  _swQ.setFromAxisAngle(_swA, th).multiply(wq0); ub.quaternion.copy(_swQ2.copy(pq).invert().multiply(_swQ)); ub.updateMatrixWorld(true);
}
function swivelOut(A, sd, ub, fb, hb){
  if (BODY.mode === 'cute' || !COLL.on || !A.vol || !A.vol.length) return;
  ub.updateMatrixWorld(true);
  const TH = 0.03, key = 'sw' + sd, prev = ((A._smA || {})[key] || {th:0}).th;
  const S_ = ub.getWorldPosition(new T.Vector3()), W_ = hb.getWorldPosition(new T.Vector3());
  _swA.copy(W_).sub(S_); if (_swA.lengthSq() < 1e-10) return; _swA.normalize();
  const save = ub.quaternion.clone(), pq = ub.parent.getWorldQuaternion(new T.Quaternion()), wq0 = ub.getWorldQuaternion(new T.Quaternion());
  const setA = th => { _swQ.setFromAxisAngle(_swA, th).multiply(wq0); ub.quaternion.copy(_swQ2.copy(pq).invert().multiply(_swQ)); ub.updateMatrixWorld(true); };
  let target = 0;
  const p0 = armPen(A, sd, ub, fb, hb);
  if (p0 >= TH || Math.abs(prev) > 1e-3){
    // 묻히지 않는 각도들 중 '직전 각도'에 가깝고 덜 돌린 것
    let best = null, bs = 1e9, minP = 1e9, minTh = 0;
    // 팔이 거의 펴져 있으면 돌려도 소용없으니 건너뜀, 돌림은 ±100도까지
    const E_ = fb.getWorldPosition(new T.Vector3()), bendA = E_.clone().sub(S_).angleTo(W_.clone().sub(E_));
    if (bendA > 0.35){
      for (let d = -100; d <= 100; d += 3){ const th = d * D2R; setA(th); const p = armPen(A, sd, ub, fb, hb);
        if (p < minP - 0.02){ minP = p; minTh = th; }
        if (p < TH){ const sc = Math.abs(th - prev) + 0.6 * Math.abs(th); if (sc < bs){ bs = sc; best = th; } } }
      target = best != null ? best : (minP < p0 - 0.05 ? minTh : 0);
    }
  }
  const th = smoothAngle(A, key, target, 240 * D2R, true);
  if (Math.abs(th) > 1e-4) setA(th); else { ub.quaternion.copy(save); ub.updateMatrixWorld(true); }
}

function updateMids(A){
  if (!A.mids || !A.mids.length) return;
  for (const M_ of A.mids){
    M_.b.parent.getWorldQuaternion(_q1);
    const qa = _q1.clone().multiply(M_.local);
    M_.c.getWorldQuaternion(_q2); const qb = _q2.clone().multiply(M_.O);
    qa.slerp(qb, 0.5);
    M_.b.quaternion.copy(_q1.invert().multiply(qa)); M_.b.updateMatrixWorld(true);
  }
}

// 손목도 관절: 손이 바닥 가까이 가면 손바닥을 바닥에 평평하게 (푸시업·플랭크·고양이 자세 등)
function handFlat(A, gl){
  const s_ = A.place.s, Hh = A.def.H * s_, rq = A.lift.getWorldQuaternion(new T.Quaternion());
  const groundY = A.root.localToWorld(new T.Vector3(0, gl, 0)).y;
  for (const sd of 'LR'){
    const h = A.hands[sd], wb = A.bones[h.wrist], fb = A.bones[h.fore]; if (!wb || !fb) continue;
    const R = A.rest[wb.name]; if (!R) continue;
    const wp = wb.getWorldPosition(new T.Vector3()), ht = wp.y - groundY, th = 0.1 * Hh;
    const w = smooth01(1 - ht / th); if (w < 0.01) continue;
    // 쉬는 자세에서 손이 가리키던 수평 방향 → 지금 아래팔이 가리키는 수평 방향으로
    const tipName = h.grip || (wb.children.find(c => c.isBone) || {}).name;
    const r0 = (tipName && A.rest[tipName]) ? A.rest[tipName].wp.clone().sub(R.wp) : R.wp.clone().sub(A.rest[fb.name].wp); r0.y = 0; if (r0.lengthSq() < 1e-10) continue;
    const fd = wp.clone().sub(fb.getWorldPosition(new T.Vector3())).applyQuaternion(rq.clone().invert()); fd.y = 0; if (fd.lengthSq() < 1e-10) continue;
    const yaw = new T.Quaternion().setFromUnitVectors(r0.normalize(), fd.normalize());
    const want = rq.clone().multiply(yaw).multiply(R.wq);
    wb.getWorldQuaternion(_q2); _q2.slerp(want, w);
    wb.parent.getWorldQuaternion(_q3); wb.quaternion.copy(_q3.invert().multiply(_q2)); wb.updateMatrixWorld(true);
  }
}

function armsToFloor(A, tY, sides, cap){
  const inv = new T.Matrix4().copy(A.root.matrixWorld).invert(), s_ = A.place.s, p = new T.Vector3();
  let knee = tY != null ? tY : Infinity;
  if (tY == null)
  for (const sd of 'LR'){ const b = A.bones[A.handle['shin'+sd]]; if (!b) continue; b.getWorldPosition(p).applyMatrix4(inv); knee = Math.min(knee, p.y - (A.limbR['shin'+sd] || 0.03)); }
  if (!isFinite(knee)) return;
  if (tY == null && A.samples.head.length) knee = Math.min(knee, lowestY(A, A.samples.head) - 0.015 * A.def.H);
  for (const sd of (sides || 'LR')){
    const list = A.samples['arm'+sd]; if (!list || !list.length) continue;
    for (let it = 0; it < 3; it++){
      const low = lowestY(A, list), d = low - knee; if (d < 0.003 * A.def.H) break;
      const sh = A.bones[A.handle['upperArm'+sd]].getWorldPosition(new T.Vector3()).applyMatrix4(inv), wr = A.bones[A.handle['hand'+sd]].getWorldPosition(new T.Vector3()).applyMatrix4(inv);
      const v = sh.y - wr.y; if (v < 0.02 * A.def.H) break;
      if (!stretchOn(A) || (A.clipSeg && A.clipSegFor === A.clip && !A._measuring)) break;
      let f = Math.min(1 + d / v, 4);
      if (cap){ const cur = Math.max(A.segS['upperArm'+sd] || 1, A.segS['forearm'+sd] || 1); if (cur >= cap - 1e-3) break; f = Math.min(f, cap / cur); }
      if ((A.segS['forearm'+sd] || 1) * f > SEG_MAX) break;
      { const ku = 'upperArm'+sd, kf = 'forearm'+sd, lu = (A.segS[ku]||1) * ((A.segLen0||{})[ku]||1), lf = (A.segS[kf]||1) * ((A.segLen0||{})[kf]||1), add = (lu + lf) * (f - 1);
        setSegLen(A, ku, (A.segS[ku]||1) * (1 + add*0.4/lu)); setSegLen(A, kf, (A.segS[kf]||1) * (1 + add*0.6/lf)); }
      A.root.updateMatrixWorld(true);
    }
  }
}

// 리포머: 발을 발바에 대고 다리를 펴면 몸과 캐리지가 함께 밀려남 (무릎 각도는 동작 그대로, 발이 발바에 닿게)
// 줄을 쥐는 동작은 줄이 손을 따라가고, 캐리지 이동(cx, 머리 쪽 +)만큼 몸도 같이 움직임
const _rfX = new T.Vector3(1,0,0), _rfU = new T.Vector3(0,1,0);
function rfContact(A, sd, mode, out){
  const L = A.legs[sd];
  return mode === 'heel' ? A.bones[L.foot].getWorldPosition(out) : A.bones[L.ball].getWorldPosition(out);
}
function legReach(A, sd, tgtContact, mode, w){
  const L = A.legs[sd], ub = A.bones[L.up], lb = A.bones[L.low], fb = A.bones[L.foot]; if (!ub || !lb || !fb) return;
  for (let it = 0; it < 3; it++){
    const S_ = ub.getWorldPosition(new T.Vector3()), E = lb.getWorldPosition(new T.Vector3()), W_ = fb.getWorldPosition(new T.Vector3());
    const cp = rfContact(A, sd, mode, new T.Vector3());
    const tgt = tgtContact.clone().sub(cp.clone().sub(W_)).lerp(W_, 1 - w);
    const a = S_.distanceTo(E), b = E.distanceTo(W_);
    let d = S_.distanceTo(tgt); d = Math.max(Math.abs(a - b) + 1e-4, Math.min(a + b - 1e-4, d));
    const dir = tgt.clone().sub(S_).normalize();
    const pole = E.clone().sub(S_); pole.addScaledVector(dir, -pole.dot(dir));
    if (pole.lengthSq() < 1e-10) pole.copy(_rfU); pole.normalize();
    const x = (a*a - b*b + d*d) / (2*d), h = Math.sqrt(Math.max(0, a*a - x*x));
    const En = S_.clone().addScaledVector(dir, x).addScaledVector(pole, h);
    rotateBoneTo(ub, E.clone().sub(S_), En.clone().sub(S_));
    lb.getWorldPosition(E); fb.getWorldPosition(W_);
    rotateBoneTo(lb, W_.clone().sub(E), tgt.clone().sub(E));
  }
}
function reformerSolve(A){
  const R = A.reformer; if (!R || !R.obj || !R.obj.parent || A.meta.g !== 'back') return;
  const g = R.obj, ud = g.userData.rf, m = A.meta, c = A.clip || {};
  g.updateMatrixWorld(true); A.root.updateMatrixWorld(true);
  const ax = _rfX.clone().transformDirection(g.matrixWorld).normalize(), inv = new T.Matrix4().copy(g.matrixWorld).invert(), sc = g.scale.x;
  const mode = c.rfFoot === 'heel' ? 'heel' : 'ball', rf = m.rf || 0, Hs = A.def.H * A.place.s;
  let shift = -(m.cx || 0) * sc;
  const tg = {};
  if (rf > 0.01){
    let sum = 0, n = 0;
    for (const sd of (c.rfLeg || 'LR')){
      const L = A.legs[sd]; if (!L) continue;
      const hp = A.bones[L.up].getWorldPosition(new T.Vector3()), cp = rfContact(A, sd, mode, new T.Vector3());
      const dFK = hp.distanceTo(cp), cl = cp.clone().applyMatrix4(inv);
      const B = new T.Vector3(ud.bar[0], ud.bar[1], cl.z).applyMatrix4(g.matrixWorld).addScaledVector(_rfU, ud.barR * sc + (mode === 'heel' ? 0.035 : 0.012) * Hs);
      const D = B.clone().sub(hp), a = D.dot(ax), perp = D.clone().addScaledVector(ax, -a).length();
      sum += a - Math.sqrt(Math.max(0, dFK*dFK - perp*perp)); n++; tg[sd] = B;
    }
    if (n) shift += (sum / n) * rf;
  }
  if (Math.abs(shift) > 1e-6){
    const o = A.root.worldToLocal(new T.Vector3()), e = A.root.worldToLocal(ax.clone().multiplyScalar(shift));
    A.lift.position.add(e.sub(o)); A.root.updateMatrixWorld(true);
  }
  if (rf > 0.01) for (const sd in tg) legReach(A, sd, tg[sd], mode, rf);
  // 캐리지는 어깨 밑에 (어깨받침 바로 발 쪽)
  if (R.car){
    const sh = A.bones[A.handle.upperArmL].getWorldPosition(new T.Vector3()).add(A.bones[A.handle.upperArmR].getWorldPosition(new T.Vector3())).multiplyScalar(0.5).applyMatrix4(inv);
    R.car.position.x = Math.max(ud.carMin, Math.min(ud.carMax, sh.x + 0.2));
  }
  // 줄: 손에 걸린 동작이면 기둥 꼭대기 → 손
  if (R.straps){
    const on = !!c.strap; R.straps.visible = !on;
    if (on && !R.ropes){
      R.ropes = [0,1].map(() => { const r = new T.Mesh(new T.CylinderGeometry(0.007, 0.007, 1, 8), new T.MeshBasicMaterial({color:0x2B2B33})); g.add(r); return r; });
      R.loops = [0,1].map(() => { const r = new T.Mesh(new T.TorusGeometry(0.045, 0.01, 8, 18), new T.MeshBasicMaterial({color:0x2B2B33})); g.add(r); return r; });
    }
    if (R.ropes) [0,1].forEach(i => { R.ropes[i].visible = on; R.loops[i].visible = on; });
    if (on) [['L',0],['R',1]].forEach(([sd, i]) => {
      if (!gripWorld(A, sd)) return;
      const hpL = _gp[sd].clone().applyMatrix4(inv), post = new T.Vector3(ud.post[0], ud.post[1], Math.sign(hpL.z || (i ? -1 : 1)) * ud.post[2]);
      const v = hpL.clone().sub(post), len = v.length(), r = R.ropes[i];
      r.position.copy(post).add(hpL).multiplyScalar(0.5); r.scale.set(1, Math.max(1e-3, len), 1);
      r.quaternion.setFromUnitVectors(_rfU, v.normalize());
      R.loops[i].position.copy(hpL); R.loops[i].quaternion.copy(r.quaternion);
    });
  }
}

// 서서 숙이는 동작: 큰 머리·몸통이 바닥을 뚫으려 하면 (발은 그대로 두고) 허리를 그만큼 덜 숙임
function unbendToFloor(A, gl){
  const sp = A.bones[A.handle.spine], hd = A.bones[A.handle.head]; if (!sp || !hd || !A.samples.upper.length) return;
  const H = A.def.H, inv = new T.Matrix4();
  // 먼저: 동작을 미리 잴 때는 다리를 늘여 엉덩이를 들어 올려 머리·몸통이 바닥에 닿지 않게 (허리를 펴지 않고)
  if (stretchOn(A) && (!(A.clipSeg && A.clipSegFor === A.clip) || A._measuring)){
    for (let it = 0; it < 3; it++){
      const mn = lowestY(A, A.samples.upper) - gl; if (mn > 0.04 * H) break;
      const info = A.legInfo.L; if (!info) break;
      const need = (0.05 * H - mn) * 1.1, L = info.a * (A.segS.thighL || 1) + info.b * (A.segS.shinL || 1), f = (L + need) / L;
      for (const k of ['thighL','thighR','shinL','shinR']) setSegLen(A, k, (A.segS[k] || 1) * f);
      A.lift.position.y += need; A.root.updateMatrixWorld(true);
    }
  }
  for (let it = 0; it < 10; it++){
    const mn = lowestY(A, A.samples.upper) - gl; if (mn > 0.02 * H) return;
    const sP = sp.getWorldPosition(new T.Vector3()), hP = hd.getWorldPosition(new T.Vector3());
    const v = hP.sub(sP); const ax = v.clone().cross(new T.Vector3(0,1,0)); if (ax.lengthSq() < 1e-10) return; ax.normalize();
    const step = Math.min(0.25, Math.max(0.05, (0.02 * H - mn) * A.place.s / Math.max(0.05, v.length())));
    sp.getWorldQuaternion(_q2); _q2.premultiply(_q1.setFromAxisAngle(ax, step));
    sp.parent.getWorldQuaternion(_q3); sp.quaternion.copy(_q3.invert().multiply(_q2)); sp.updateMatrixWorld(true);
  }
}

// 점프: 뛰기 직전·착지 직후의 골반 높이를 미리 재 둠 (공중에서 몸이 갑자기 꺼지거나 튀지 않게)
function measureFlights(A){
  A._flY = null;
  const c = A.clip, fls = clipFlights(c); if (!fls.length || !A.ground) return;
  const save = clonePose(A.pose), sm = cloneMeta(A.meta), ct = A._ct, out = [];
  A._measuring = true;
  for (const f of fls){
    const ys = [];
    for (const tt of [Math.max(0, f[0] - 0.002), Math.min(clipDur(c), f[1] + 0.002)]){
      sampleClip(c, tt, A.pose, A.meta); A._ct = tt; updateActor(A);
      const hp = A.bones[A.hipsBone].getWorldPosition(new T.Vector3()); A.root.worldToLocal(hp); ys.push(hp.y);
    }
    out.push(ys);
  }
  A._measuring = false; A._ct = ct;
  copyPose(save, A.pose); Object.assign(A.meta, sm);
  A._flY = out;
}
// 동작 전체를 미리 훑어 마디마다 필요한 가장 긴 길이를 기록
function measureClipStretch(A){
  A.clipSeg = null; A.clipSegFor = null;
  const c = A.clip; if (BODY.mode === 'cute' || !c || !c.keys || !c.keys.length || !A.segs || c.source === 'capture') return;
  const save = clonePose(A.pose), sm = cloneMeta(A.meta), mx = {};
  A._measuring = true;
  const ts = c.keys.map(k => k.t); for (let i = 0; i + 1 < c.keys.length; i++) ts.push((c.keys[i].t + c.keys[i+1].t) / 2);
  // 팔·다리 전체 길이가 가장 길었던 순간의 두 마디 비율을 함께 씀 (다른 순간의 최댓값끼리 섞지 않게)
  const len0 = k => (A.segLen0 && A.segLen0[k]) || 1, best = {};
  for (const t of ts){
    sampleClip(c, t, A.pose, A.meta); A._ct = t;
    updateActor(A);
    for (const [a, b] of [['upperArm','forearm'],['thigh','shin']]) for (const sd of 'LR'){
      const ka = a+sd, kb = b+sd, tot = (A.segS[ka] || 1) * len0(ka) + (A.segS[kb] || 1) * len0(kb);
      if (!best[ka] || tot > best[ka].tot) best[ka] = {tot, a:A.segS[ka] || 1, b:A.segS[kb] || 1};
      mx[ka] = best[ka].a; mx[kb] = best[ka].b;
    }
  }
  A._measuring = false;
  // 좌우 팔·다리는 같은 길이로 (한쪽만 길면 어색하니)
  for (const [a, b] of [['upperArm','forearm'],['thigh','shin']]){
    const pick = best[a+'L'] && best[a+'R'] ? (best[a+'L'].tot >= best[a+'R'].tot ? 'L' : 'R') : 'L';
    mx[a+'L'] = mx[a+'R'] = mx[a+pick] || 1; mx[b+'L'] = mx[b+'R'] = mx[b+pick] || 1; }
  copyPose(save, A.pose); Object.assign(A.meta, sm);
  A.clipSeg = mx; A.clipSegFor = c;
}

// 서기↔앉기↔엎드리기처럼 몸을 바닥에 놓는 방식이 바뀌는 순간: 몸 위치가 한 번에 튀지 않게 0.35초 동안 이어 줌
function liftBlend(A, m, gl, anyPlant){
  const gk = m.g + (A._kneel ? 'K' : '');      // 바닥 맞추는 방법이 바뀔 때도 부드럽게 이어 줌
  const t = A._ct ?? 0, L = A._lb || (A._lb = {g:gk, t:-1e9, p:A.lift.position.clone(), rx:A.lift.rotation.x, tr:null});
  const dt = t - L.t;
  if (dt !== 0){
    if (dt > 0 && dt < 0.2){ if (L.g !== gk) L.tr = {t0:t - dt, p:L.p.clone(), rx:L.rx, d:0.35}; }
    else L.tr = null;
  }
  if (L.tr){
    const u = (t - L.tr.t0) / L.tr.d;
    if (u >= 1 || u < 0){ if (dt !== 0) L.tr = null; }
    else {
      const k = u*u*(3 - 2*u);
      A.lift.position.lerpVectors(L.tr.p, A.lift.position.clone(), k);
      const k2 = Math.min(1, u * 3), kk = k2*k2*(3 - 2*k2);                // 기울기는 빨리(0.12초), 위치는 천천히
      A.lift.rotation.x = L.tr.rx + (A.lift.rotation.x - L.tr.rx) * kk;
      A.root.updateMatrixWorld(true);
      if (anyPlant) solveLegs(A, m, m.g === 'feet' ? 0 : gl);
    }
  }
  if (dt !== 0){ L.g = gk; L.t = t; L.p.copy(A.lift.position); L.rx = A.lift.rotation.x; }
}
// 마지막 안전망: 팔이 한 프레임에 크게 튀지 않게 (초당 600도까지만 바뀜) — 여러 보정이 겹쳐도 요동치지 않게
const ARM_RATE = 600 * D2R, _rlQ = new T.Quaternion();
function armRateLimit(A){
  if (A._measuring || BODY.mode === 'cute' && !COLL.on) return;
  const t = A._ct ?? 0, st = A._rl || (A._rl = {t:-1e9, q:{}, f:-1});
  let dt = t - st.t, same = Math.abs(dt) < 1e-6;
  // 시간이 멈춰 있어도(멈춤·실시간) 새 화면이면 실제 흐른 시간만큼은 움직일 수 있게 (팔이 얼어붙지 않게)
  if (same && st.f !== FRAME.id){ same = false; dt = FRAME.dt; }
  const cont = dt > 0 && dt < 0.25;
  for (const k of ['upperArmL','forearmL','upperArmR','forearmR']){
    const b = A.bones[A.handle[k]]; if (!b) continue;
    const prev = st.q[k];
    if (prev && (cont || same)){
      const lim = same ? (st.lim && st.lim[k] != null ? st.lim[k] : 0) : ARM_RATE * dt;
      const ang = 2 * Math.acos(Math.min(1, Math.abs(prev.dot(b.quaternion))));
      if (ang > lim && ang > 1e-4){ _rlQ.copy(prev).slerp(b.quaternion, lim / ang); b.quaternion.copy(_rlQ); b.updateMatrixWorld(true); }
    }
    if (!same){ (st.q[k] || (st.q[k] = new T.Quaternion())).copy(b.quaternion); (st.lim || (st.lim = {}))[k] = 0; }
  }
  if (!same){ st.t = t; st.f = FRAME.id; }
}
/* ---------- 무릎 꿇은 엎드림 (고양이·아기 자세·버드독) ----------
   1) 정강이·발등이 바닥에 눕게 몸 전체 기울기를 맞춤 (발이 뜨지 않게)
   2) 큰 머리가 무릎·허벅지에 끼면 허리를 늘여 머리를 무릎 앞으로
   3) 머리가 바닥을 뚫으면 허리를 들어 올리고, 깊이 숙인 자세면 머리를 바닥에 살짝 대 줌
   4) 손은 바닥을 짚는 팔(아래로 뻗은 팔)만 바닥까지 늘이고, 앞으로 뻗은 팔은 조금만 */
const WAIST_MAX = 1.3, KNEEL = {on:true, waist:true};
function waistChain(A){
  const out = [], hips = A.bones[A.hipsBone]; let b = A.bones[A.handle.neck];
  while (b && b !== hips && A.rest[b.name]){ out.push({b, pos:A.rest[b.name].pos.clone()}); b = b.parent; }
  return out;
}
function setWaist(A, f){
  if (A.kind === 'human') return;
  const ch = A._waistCh || (A._waistCh = waistChain(A));
  for (const c of ch) c.b.position.copy(c.pos).multiplyScalar(f);
  A.waistS = f;
}
const _pq1 = new T.Quaternion(), _pq2 = new T.Quaternion(), _pq3 = new T.Quaternion(), _pv = new T.Vector3();
function pitchBone(A, b, ang){
  A.root.getWorldQuaternion(_pq1); _pv.set(1, 0, 0).applyQuaternion(_pq1);
  _pq1.setFromAxisAngle(_pv, ang); b.getWorldQuaternion(_pq2); _pq2.premultiply(_pq1);
  b.parent.getWorldQuaternion(_pq3); b.quaternion.copy(_pq3.invert().multiply(_pq2)); b.updateMatrixWorld(true);
}
function rootLocal(A, name, out){ const b = A.bones[name]; b.getWorldPosition(out); return A.root.worldToLocal(out); }
function zRange(A, list){
  _rootInv.copy(A.root.matrixWorld).invert(); let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < list.length; i++){ const [m, vi] = list[i]; skinPoint(m, vi, _sv); _sv.applyMatrix4(m.matrixWorld).applyMatrix4(_rootInv); if (_sv.z < mn) mn = _sv.z; if (_sv.z > mx) mx = _sv.z; }
  return [mn, mx];
}
function kneelSolve(A){
  const H = A.def.H, legs = A.samples.legs, head = A.samples.head;
  const v1 = new T.Vector3(), v2 = new T.Vector3();
  // 1) 정강이 눕히기
  A.lift.rotation.x = 0; A.root.updateMatrixWorld(true);
  // 무릎 관절과 발목 관절을 잇는 선(정강이)이 바닥과 나란하게
  { let th = 0; for (const sd of 'LR'){ const k = rootLocal(A, A.handle['shin'+sd], v1), a_ = rootLocal(A, A.handle['foot'+sd], v2); th += Math.atan2(k.y - a_.y, Math.max(1e-4, k.z - a_.z)) / 2; }
    A.lift.rotation.x = Math.max(-0.6, Math.min(0.6, th)); A.root.updateMatrixWorld(true); }
  const rx = smoothAngle(A, 'tilt', A.lift.rotation.x, 120 * D2R);
  A.lift.rotation.x = rx; A.root.updateMatrixWorld(true);
  A.lift.position.y -= lowestY(A, legs); A.root.updateMatrixWorld(true);
  // 2)·3) 허리 길이와 허리 들기
  const sp = A.bones[A.handle.spine], q0 = sp.quaternion.clone(), cb = A.bones[A.handle.chest], qc = cb.quaternion.clone(), nb = A.bones[A.handle.neck], qn = nb.quaternion.clone();
  const hp = rootLocal(A, A.hipsBone, new T.Vector3());
  const L0 = (A._waistCh || (A._waistCh = waistChain(A))).reduce((s_, c) => s_ + c.pos.length(), 0) || 0.2 * H;
  const fr = A.samples.front.length ? A.samples.front : head;
  // 허리 들기 = 등을 둥글게: 허리 아래쪽은 들고, 가슴·목은 반대로 살짝 숙여 등이 휘게 (곧게 들리거나 늘어나지 않게)
  const headLow = a => { sp.quaternion.copy(q0); cb.quaternion.copy(qc); nb.quaternion.copy(qn);
    if (a){ pitchBone(A, sp, a); if (a < 0){ const c = Math.min(-a, 0.5); pitchBone(A, cb, 0.4 * c); pitchBone(A, nb, 0.25 * c); } } else sp.updateMatrixWorld(true);
    return fr.length ? lowestY(A, fr) : 1; };
  let f = 1, a = 0;
  // 허리를 얼마나 들어야 머리가 바닥 위에 오는지 (각도, 음수 = 들어 올림)
  const raiseFor = () => {
    const h0 = headLow(0);
    if (h0 >= 0) return 0;
    let lo = -1.3, hi = 0; if (headLow(lo) < 0) return lo;
    for (let k = 0; k < 12; k++){ const mid = (lo + hi) / 2; if (headLow(mid) >= 0) lo = mid; else hi = mid; }
    return lo;
  };
  // (허리를 길게 늘이지 않음 — 등을 둥글게 휘어서 자세를 만듦)
  for (let round = 0; round < 1; round++){
    // 허리 들기/숙이기: 머리 맨 아래가 바닥 높이(0)에 오도록. 깊이 숙이지 않은 자세는 뚫을 때만 고침
    const h0 = headLow(0);
    const nk = rootLocal(A, A.handle.neck, v1).sub(hp).normalize(), deep = nk.y < -0.15;
    if (h0 < 0 || (deep && h0 < 0.12 * H)){
      // lo 쪽은 머리가 바닥 위, hi 쪽은 바닥 아래 (음수 각 = 들어 올림)
      let lo = h0 < 0 ? -1.3 : 0, hi = h0 < 0 ? 0 : 0.5;
      if (h0 >= 0 && headLow(hi) >= 0) a = hi;
      else if (h0 < 0 && headLow(lo) < 0) a = lo;
      else { for (let k = 0; k < 12; k++){ const mid = (lo + hi) / 2; if (headLow(mid) >= 0) lo = mid; else hi = mid; } a = lo; }
    } else a = 0;
  }
  // 시간에 따라 부드럽게 (한 프레임에 튀지 않게)
  const fs = smoothAngle(A, 'waistF', f, 1.5), as = smoothAngle(A, 'waistA', a, 150 * D2R);
  setWaist(A, fs); headLow(as);
  A.root.updateMatrixWorld(true);
  footFlat(A);
  // 4) 손: 아래로 뻗은 팔은 바닥 짚기, 앞으로 뻗은 팔은 조금만
  const inv = new T.Matrix4().copy(A.root.matrixWorld).invert(), p = new T.Vector3(), q = new T.Vector3();
  const torso = rootLocal(A, A.handle.neck, new T.Vector3()).sub(rootLocal(A, A.hipsBone, new T.Vector3())).normalize();
  for (const sd of 'LR'){
    A.bones[A.handle['upperArm'+sd]].getWorldPosition(p).applyMatrix4(inv); A.bones[A.handle['hand'+sd]].getWorldPosition(q).applyMatrix4(inv);
    const d = q.sub(p).normalize();
    if (d.y < -0.6 && Math.abs(torso.y) < 0.6) armsToFloor(A, 0.012 * H, sd);              // 네발로 짚는 팔
    else if (d.dot(torso) > 0.5 && torso.y < 0.3) armsToFloor(A, 0.012 * H, sd, 1.3);       // 앞으로 쭉 뻗은 팔 (아기 자세)
  }
  // 팔 말고 몸이 바닥을 뚫을 때만 몸을 올림 (팔은 마지막에 접어서 바닥을 짚게)
  A.lift.position.y -= Math.min(0, lowestY(A, A.samples.noArmsFeet.length ? A.samples.noArmsFeet : A.samples.all)); A.root.updateMatrixWorld(true);
  footLift(A); A.root.updateMatrixWorld(true);
  A._kneel = true;
  return true;
}
// 네발 자세: 팔이 짧으면 손이 무릎과 같은 높이(바닥)에 닿을 만큼 팔을 늘이고,
// 앞(손)과 뒤(무릎·발) 두 곳이 모두 바닥에 닿게 몸을 앞뒤로 기울임 — 닿는 곳은 손·무릎·발만 (큰 머리는 빼고)
function low2Core(A){
  A.lift.rotation.x = 0; A.lift.position.set(0, 0, 0); A.root.updateMatrixWorld(true);
  const lim = (A.samples.limbs && A.samples.limbs.length) ? A.samples.limbs : A.samples.all;
  for (let pass = 0; pass < 2; pass++){
    armsToFloor(A);
    for (let it = 0; it < 3; it++){
      const hz = A.bones[A.hipsBone].getWorldPosition(_v3); A.root.worldToLocal(hz);
      const c = contacts(A, lim, hz.z);
      if (!c) break;
      let th = Math.atan2(c.yf - c.yb, c.zf - c.zb);
      th = Math.max(-0.25, Math.min(0.25, th));
      const nx = Math.max(-0.6, Math.min(0.6, A.lift.rotation.x + th));     // 전체 기울임은 ±35도까지
      if (Math.abs(nx - A.lift.rotation.x) < 0.002) break;
      A.lift.rotation.x = nx; A.root.updateMatrixWorld(true);
    }
  }
}
// 두 무릎을 꿇었는가: 두 정강이가 모두 바닥과 거의 나란함 (런지처럼 한쪽 정강이가 서 있으면 아님)
function kneeling(A){
  const P = A.drvP; if (!P || !P.shinL || !P.shinR || !P.footL || !P.footR) return false;
  for (const sd of 'LR'){ const k = P['shin'+sd], f = P['foot'+sd], L = k.distanceTo(f); if (L < 1e-6 || Math.abs(k.y - f.y) / L > 0.45 || qAng(A.pose.rot['shin'+sd]) < 50) return false; }
  return true;
}
// 다리를 바닥과 나란히 뻗고 엎드렸는가 (다운독처럼 엉덩이를 높이 든 자세는 아님)
function prone(A){
  const P = A.drvP; if (!P) return false;
  for (const sd of 'LR'){ const h = P['thigh'+sd], f = P['foot'+sd]; if (!h || !f) return false; const L = h.distanceTo(f); if (L < 1e-6 || Math.abs(h.y - f.y) / L > 0.45) return false;
    // 발등을 바닥에 댄(발끝을 편) 자세만 — 발가락으로 버티는 플랭크는 아님
    _e.setFromQuaternion(A.pose.rot['foot'+sd], 'XYZ'); if (_e.x * R2D < 35) return false; }
  return true;
}
// 엎드림 보정(허리 들기·다리 내리기)이 끝나면 한 번에 풀지 않고 천천히 원래대로
function waistEase(A, keepF){
  const st = A._smA; if (!st || A.kind === 'human') return;
  const hasF = st.waistF && Math.abs(st.waistF.th - 1) > 1e-3, hasA = st.waistA && Math.abs(st.waistA.th) > 1e-3;
  if (hasF && !keepF) setWaist(A, smoothAngle(A, 'waistF', 1, 1.5));
  if (hasA){ const a = smoothAngle(A, 'waistA', 0, 150 * D2R); if (Math.abs(a) > 1e-4) pitchBone(A, A.bones[A.handle.spine], a); }
  for (const sd of 'LR'){ const k = st['ld' + sd]; if (k && Math.abs(k.th) > 1e-3){ const b = smoothAngle(A, 'ld' + sd, 0, 120 * D2R); if (Math.abs(b) > 1e-4) pitchBone(A, A.bones[A.handle['thigh'+sd]], b); } }
  A.root.updateMatrixWorld(true);
}
// 엎드려 누운 자세에서 배가 커서 다리가 뜨면: 엉덩이 관절에서 다리를 바닥 쪽으로 내림
function legsDown(A){
  for (const sd of 'LR'){
    const list = A.samples['leg'+sd], tb = A.bones[A.handle['thigh'+sd]]; if (!list || !list.length || !tb) continue;
    const q0 = tb.quaternion.clone(), at = b => { tb.quaternion.copy(q0); if (b) pitchBone(A, tb, b); else tb.updateMatrixWorld(true); return lowestY(A, list); };
    const h0 = at(0); if (h0 < 0.006 * A.def.H){ at(smoothAngle(A, 'ld' + sd, 0, 120 * D2R)); continue; }
    // 다리를 내리는 방향 (엎드림은 다리가 뒤로, 무릎 꿇기는 허벅지가 앞으로)
    const dir = at(-0.08) < at(0.08) ? -1 : 1;
    let lo = 0, hi = 0.5 * dir, ang;
    if (at(hi) > 0) ang = hi;
    else { for (let k = 0; k < 10; k++){ const mid = (lo + hi) / 2; if (at(mid) > 0) lo = mid; else hi = mid; } ang = lo; }
    at(smoothAngle(A, 'ld' + sd, ang, 120 * D2R));
  }
}
// 몸 전체를 바닥에 내렸을 때 다리(무릎·발)가 바닥에서 얼마나 뜨는지
function low2Float(A){ return lowestY(A, A.samples.legs) - lowestY(A, A.samples.all); }
// 바닥을 짚는 팔이 있는가 (몸통 기준으로 배 쪽으로 뻗은 팔 = 네발·플랭크)
function supportArms(A){
  if (!A.drvP || !A.drvQ || !A.drvQ.chest) return false;
  const z = _v3.set(0, 0, 1).applyQuaternion(A.drvQ.chest);
  for (const sd of 'LR'){ const h = A.drvP['hand'+sd], u = A.drvP['upperArm'+sd]; if (!h || !u) continue;
    const d = _v2.copy(h).sub(u); const L = d.length(); if (L > 1e-6 && d.dot(z) / L > 0.85) return true; }
  return false;
}
// 무릎 꿇기·엎드림: 발등을 바닥에 쫙 펴서 댐 (발끝은 뒤로, 살짝 바깥으로 벌어짐). 발목을 꺾지 않음
const FOOT_SPLAY = 12 * D2R;
function footFlat(A){
  const up = new T.Vector3(0, 1, 0).applyQuaternion(A.root.getWorldQuaternion(new T.Quaternion()));
  const hp = A.bones[A.hipsBone].getWorldPosition(new T.Vector3());
  for (const sd of 'LR'){
    const fb = A.bones[A.handle['foot'+sd]], kb = A.bones[A.handle['shin'+sd]], L = A.legs[sd], tb = L && A.bones[L.ball]; if (!fb || !kb || !tb) continue;
    const k = kb.getWorldPosition(new T.Vector3()), an = fb.getWorldPosition(new T.Vector3()), to = tb.getWorldPosition(new T.Vector3());
    const dir = an.clone().sub(k); dir.addScaledVector(up, -dir.dot(up)); if (dir.lengthSq() < 1e-10) continue; dir.normalize();
    // 바깥쪽 (몸 가운데에서 이 발 쪽)
    const lat = an.clone().sub(hp); lat.addScaledVector(up, -lat.dot(up)); lat.addScaledVector(dir, -lat.dot(dir)); if (lat.lengthSq() > 1e-10) lat.normalize();
    const tgt = dir.clone().multiplyScalar(Math.cos(FOOT_SPLAY)).addScaledVector(lat, Math.sin(FOOT_SPLAY));
    // 발목에서 발끝 방향을 그 방향에 맞춤 (발가락 마디는 곧게)
    tb.quaternion.copy(A.rest[tb.name] ? A.rest[tb.name].local : tb.quaternion); tb.updateMatrixWorld(true);
    to.copy(tb.getWorldPosition(new T.Vector3()));
    rotateBoneTo(fb, to.clone().sub(an), tgt);
    A.root.updateMatrixWorld(true);
  }
}
// 몸을 바닥에 내린 뒤 발이 바닥 아래로 들어갔으면 발등이 바닥에 딱 닿을 만큼만 발끝을 듦
function footLift(A){
  for (const sd of 'LR'){
    const fb = A.bones[A.handle['foot'+sd]], list = A.samples['foot'+sd]; if (!fb || !list || !list.length) continue;
    const q0 = fb.quaternion.clone(), at = b => { fb.quaternion.copy(q0); if (b) pitchBone(A, fb, b); else fb.updateMatrixWorld(true); return lowestY(A, list); };
    const h0 = at(0); if (h0 > -0.004 * A.def.H) continue;
    const dir = at(-0.1) > at(0.1) ? -1 : 1;
    let lo = 0, hi = 0.6 * dir; if (at(hi) < 0){ at(hi); continue; }
    for (let k = 0; k < 9; k++){ const mid = (lo + hi) / 2; if (at(mid) < -0.003 * A.def.H) lo = mid; else hi = mid; }
    at(hi);
  }
}
/* ---------- 한 출연자 한 프레임 ---------- */
function updateActor(A){
  if (!A.visible){ A.root.visible = false; return; }
  A.root.visible = true;
  applyDriver(A);
  if (A.waistS && A.waistS !== 1) setWaist(A, 1);
  driveModel(A); updateEyes(A);
  A.lift.position.set(0,0,0); A.lift.rotation.set(0,0,0);
  A.root.updateMatrixWorld(true); updateMids(A);
  resolveArms(A); resolveFreeLegs(A, A.meta); A.root.updateMatrixWorld(true);
  if (!A.ground){ jiggleUpdate(A); return; }
  const m = A.meta, gl = (floorAt(A.place.x, A.place.z) - A.place.elev) / A.place.s;   // 바닥(진짜 땅) 높이, 출연자 공간
  A._kneel = false;
  if (m.g !== 'low2') waistEase(A);
  const anyPlant = (m.pl[0] > 0.01 || m.pl[1] > 0.01) && A.legInfo.L;
  const grow = legGrow(A);
  // 다리가 늘어난 만큼 서 있는 높이·엉덩이 내림·보폭도 같은 비율로 (사람처럼 보이게)
  A._legR = 1 + grow / A.hipH;
  if (grow > 1e-5 && (m.g === 'feet')){ A.lift.position.y += grow * (1 + A.pose.root.y); A.lift.position.z += A.pose.root.z * grow; A.root.updateMatrixWorld(true); }
  if (m.g === 'feet' && anyPlant) unbendToFloor(A, gl);
  if (m.g === 'feet'){
    // 점프: 이륙~착지 사이엔 발바닥이 중력 포물선을 따라감 (높이 = g·τ·(T−τ)/2)
    const fl = PHYS.on && A.clip ? clipFlights(A.clip).find(f => A._ct >= f[0] && A._ct <= f[1]) : null;
    if (fl){
      const T_ = fl[1] - fl[0], tau = A._ct - fl[0], h = 0.5 * PHYS.g * tau * (T_ - tau) / A.place.s;
      // 무게중심(골반)이 포물선을 그림: 뛰기 직전·착지 직후 골반 높이를 이어 주고 그 위에 높이 h (다리를 접으면 발만 올라감)
      const fi = clipFlights(A.clip).indexOf(fl), fy = A._flY && A._flY[fi];
      if (fy){
        const hp = A.bones[A.hipsBone].getWorldPosition(new T.Vector3()); A.root.worldToLocal(hp);
        const base = fy[0] + (fy[1] - fy[0]) * (tau / T_);
        A.lift.position.y += base + h - hp.y; A.root.updateMatrixWorld(true);
        const mnF = lowestY(A, A.samples.feet); if (mnF < 0){ A.lift.position.y -= mnF; A.root.updateMatrixWorld(true); }
      } else { A.lift.position.y -= lowestY(A, A.samples.feet) - h; A.root.updateMatrixWorld(true); }
      A._bal = null;
    } else if (anyPlant){
      solveLegs(A, m, 0);
      // 균형: 무게중심이 딛고 선 발 위에 오도록 몸을 수평으로 옮김 (부드럽게)
      if (PHYS.on){
        const d = balanceShift(A, m), b = A._bal || (A._bal = [0, 0]);
        const lim = A.hipH * 0.08, k = 1 - Math.exp(-_jdt * 3);
        const tx = d ? Math.max(-lim, Math.min(lim, b[0] + d[0])) : b[0] * 0.9, tz = d ? Math.max(-lim, Math.min(lim, b[1] + d[1])) : b[1] * 0.9;
        b[0] += (tx - b[0]) * k; b[1] += (tz - b[1]) * k;
        if (Math.abs(b[0]) + Math.abs(b[1]) > 1e-5){ A.lift.position.x += b[0]; A.lift.position.z += b[1]; A.root.updateMatrixWorld(true); solveLegs(A, m, 0); }
      }
    }
    else { const mn = lowestY(A, A.samples.feet); if (mn < 0){ A.lift.position.y -= mn; A.root.updateMatrixWorld(true); } }
    // 서서 깊이 숙여 손을 아래로 뻗는 동작(앞으로 숙이기 등): 손이 바닥 근처면 바닥까지 닿게 팔을 늘임
    // 몸통이 아래를 향할 만큼 깊이 숙였을 때만 (서 있는 자세에서는 절대 안 함)
    const chP = A.bones[A.handle.chest].getWorldPosition(new T.Vector3()), hpP = A.bones[A.hipsBone].getWorldPosition(new T.Vector3());
    const bent = (chP.y - hpP.y) < 0.25 * chP.distanceTo(hpP);
    if (anyPlant && bent){
      const inv = new T.Matrix4().copy(A.root.matrixWorld).invert(), H = A.def.H;
      let low = false;
      for (const sd of 'LR'){
        const sh = A.bones[A.handle['upperArm'+sd]].getWorldPosition(new T.Vector3()).applyMatrix4(inv), wr = A.bones[A.handle['hand'+sd]].getWorldPosition(new T.Vector3()).applyMatrix4(inv);
        if (wr.y - gl < 0.3 * H && sh.y - wr.y > 0.15 * H) low = true;
      }
      if (low) armsToFloor(A, gl + 0.012 * H);
    }
  } else if (m.g === 'low2' && KNEEL.on && A.kind !== 'human' && kneeling(A) && !supportArms(A) && A.samples.legs.length){
    kneelSolve(A); legsDown(A); A.root.updateMatrixWorld(true);
  } else if (m.g === 'low2'){
    // 네발·플랭크: 손과 무릎·발이 바닥에 닿게 몸을 기울임 (low2Core)
    // 큰 머리가 바닥에 닿아 무릎·발이 뜨면 허리를 늘여서 머리를 앞으로 (발이 바닥에 붙을 만큼만)
    const keep = {}; for (const k of ['upperArmL','forearmL','upperArmR','forearmR']) keep[k] = A.segS[k] || 1;
    const core = () => { for (const k in keep) setSegLen(A, k, keep[k]); low2Core(A); };
    const tol = 0.012 * A.def.H;
    // 다리를 편 엎드림(코브라·스완·스위밍)에서 큰 머리 때문에 다리가 뜨면: 다리를 바닥에 눕히고 허리(가슴)를 들어 머리를 바닥 위로
    if (KNEEL.on && A.kind !== 'human' && plankLike(A) && prone(A) && A.samples.legs.length){
      kneelSolve(A); legsDown(A); A.root.updateMatrixWorld(true);
    } else {
    waistEase(A, true);
    core();
    if (KNEEL.waist && BODY.mode !== 'cute' && A.kind !== 'human' && A.samples.legs.length){
      let f = 1;
      if (low2Float(A) > tol){
        let lo = 1, hi = WAIST_MAX; setWaist(A, hi); core();
        if (low2Float(A) > tol) f = hi;
        else { for (let k = 0; k < 6; k++){ const mid = (lo + hi) / 2; setWaist(A, mid); core(); if (low2Float(A) > tol) lo = mid; else hi = mid; } f = hi; }
      }
      f = smoothAngle(A, 'waistF', f, 1.5);
      setWaist(A, f); core();
    }
    // 기울기가 한 프레임만 튀지 않게 시간에 따라 부드럽게 (초당 120도까지)
    const rx = smoothAngle(A, 'tilt', A.lift.rotation.x, 120 * D2R);
    if (Math.abs(rx - A.lift.rotation.x) > 1e-5){ A.lift.rotation.x = rx; A.root.updateMatrixWorld(true); }
    const mn = lowestY(A, A.samples.all); A.lift.position.y -= mn; A.root.updateMatrixWorld(true);
    }
  } else if (m.g === 'low' || m.g === 'back' || m.g === 'seat'){
    // 누운·앉은 자세: 팔 끝이 바닥 아래로 가면 몸을 띄우지 않고 팔을 접어 짚게 (아래 armOnFloor)
    const list = m.g === 'back' ? A.samples.back : m.g === 'seat' ? A.samples.seat : (A.samples.noArms.length ? A.samples.noArms : A.samples.all);
    const mn = lowestY(A, list.length ? list : A.samples.all) - (m.g === 'seat' && A.seatH ? A.seatH / A.place.s : 0);
    A.lift.position.y -= mn; A.root.updateMatrixWorld(true);
    if (anyPlant) solveLegs(A, m, gl);
    if (m.g !== 'low'){ const all = lowestY(A, A.samples.feet); if (all < gl){ /* 발이 땅 아래로 가면 무시(다리 IK가 처리) */ } }
  }
  // 서 있거나 앉은 자세에서 손이 바닥을 뚫으면 몸을 띄우지 말고 팔을 접어 손을 바닥에 짚게 함
  if (m.g === 'feet' || m.g === 'seat' || m.g === 'low') for (const sd of 'LR') armOnFloor(A, sd, gl);
  // 캡처 동작: 바닥에 닿은 발이 미끄러지지 않게 미리 계산한 몸 위치 보정
  if (A.clip && A.clip.footFix && !A._measuring && !A.live){ const ff = footFixAt(A.clip, A._ct || 0); if (ff){ A.lift.position.x += ff[0]; A.lift.position.z += ff[1]; A.root.updateMatrixWorld(true); } }
  liftBlend(A, m, gl, anyPlant);
  // 마지막 안전장치: 무릎·머리 등 몸 어디도 진짜 땅 아래로 파고들지 않게
  const blending = !!(A._lb && A._lb.tr);
  if (blending || A._kneel) for (const sd of 'LR') armOnFloor(A, sd, gl);      // 자세가 바뀌는 사이에는 몸을 띄우지 말고 팔을 접어 짚음
  const sink = Math.min(lowestY(A, blending && A.samples.upper.length ? A.samples.upper : A.samples.body), A.samples.feet && A.samples.feet.length ? lowestY(A, A.samples.feet) + 0.003 * A.def.H : Infinity) - gl;
  if (sink < -0.004 * A.def.H){ A.lift.position.y -= sink; A.root.updateMatrixWorld(true); }
  reformerSolve(A);
  handIK(A); handFlat(A, gl); armRateLimit(A);
  if (m.g === 'feet' || m.g === 'seat' || m.g === 'low' || A._kneel) for (const sd of 'LR') armOnFloor(A, sd, gl);   // 긴 팔이 바닥을 뚫지 않게 (맨 마지막에 한 번 더)
  updateMids(A);
  jiggleUpdate(A);
}

/* ---------- 기구 쥐기 ---------- */
const EQUIP = {
  db2:[{prop:'dumbbell', hand:'L'}, {prop:'dumbbell', hand:'R'}],
  dbL:[{prop:'dumbbell', hand:'L'}], dbR:[{prop:'dumbbell', hand:'R'}],
  bb:[{prop:'barbell', hand:'LR'}],
  kb:[{prop:'kettlebell', hand:'LR'}], kbR:[{prop:'kettlebell', hand:'R'}],
  ring:[{prop:'pilatesRing', hand:'LR'}],
};
function setEquip(A, key){
  if (A.equipKey === key) return;
  for (const e of A.equip) A.root.remove(e.obj);
  A.equip = []; A.equipKey = key || '';
  if (!key || !EQUIP[key]) return;
  for (const spec of EQUIP[key]){
    const src = AS.props[spec.prop].build();
    const inner = new T.Group(); const g = src.userData.grips[0];
    // 손잡이 점이 원점이 되도록
    src.position.set(-(g ? g.pos[0] : 0), -(g ? g.pos[1] : 0), -(g ? g.pos[2] : 0));
    if (spec.prop === 'barbell' || spec.prop === 'pilatesRing') src.position.x = 0;
    inner.add(src); A.root.add(inner);
    A.equip.push({spec, obj:inner});
  }
}
const _gp = {L:new T.Vector3(), R:new T.Vector3()}, _gw = {L:new T.Vector3(), R:new T.Vector3()};
function gripWorld(A, s){
  const h = A.hands[s], w = A.bones[h.wrist], info = A.handInfo[s]; if (!w || !info) return false;
  w.getWorldQuaternion(_q1);
  w.getWorldPosition(_gp[s]).add(_v1.copy(info.gripLocal).multiplyScalar(A.place.s).applyQuaternion(_q1));
  _gw[s].copy(info.widthLocal).applyQuaternion(_q1).normalize();
  return true;
}
// 머리를 공 하나로 봄 (머리뼈 기준 중심·반지름을 처음 한 번 재 둠)
const _hsC = new T.Vector3(); let _hsR = 0;
function headSphere(A, out){
  const hb = A.bones[A.handle.head]; if (!hb || !A.samples.head || !A.samples.head.length) return false;
  hb.updateMatrixWorld(true);
  if (!A._hs){
    const inv = new T.Matrix4().copy(hb.matrixWorld).invert(), pts = [], c = new T.Vector3();
    for (const [m, vi] of A.samples.head){ const p = new T.Vector3(); skinPoint(m, vi, p); p.applyMatrix4(m.matrixWorld).applyMatrix4(inv); pts.push(p); c.add(p); }
    c.multiplyScalar(1 / pts.length);
    const ds = pts.map(p => p.distanceTo(c)).sort((a, b) => a - b);
    A._hs = {c, r:ds[Math.floor(ds.length * 0.8)] || 0};
  }
  out.copy(A._hs.c).applyMatrix4(hb.matrixWorld);
  _hsR = A._hs.r * hb.getWorldScale(_v3).x;
  return true;
}
function updateEquip(A){
  if (!A.equip.length) return;
  A.root.updateMatrixWorld(true);
  const rq = A.root.getWorldQuaternion(new T.Quaternion()), rqi = rq.clone().invert();
  const f = Math.max(0.5, Math.min(1.15, A.def.H/1.74));
  for (const e of A.equip){
    const sp = e.spec; let pos = new T.Vector3(), q = new T.Quaternion();
    if (sp.hand === 'LR'){
      if (!gripWorld(A,'L') || !gripWorld(A,'R')) continue;
      pos.copy(_gp.L).add(_gp.R).multiplyScalar(0.5);
      const x = _gp.L.clone().sub(_gp.R).normalize();
      if (sp.prop === 'kettlebell'){
        const sh = A.bones[A.shoulderNames.L].getWorldPosition(new T.Vector3()).add(A.bones[A.shoulderNames.R].getWorldPosition(new T.Vector3())).multiplyScalar(0.5);
        const y = sh.sub(pos).normalize();
        q.setFromUnitVectors(new T.Vector3(0,1,0), y);
      } else if (sp.prop === 'pilatesRing'){
        q.setFromUnitVectors(new T.Vector3(1,0,0), x);
      } else q.setFromUnitVectors(new T.Vector3(1,0,0), x);
    } else {
      if (!gripWorld(A, sp.hand)) continue;
      pos.copy(_gp[sp.hand]);
      if (sp.prop === 'kettlebell'){
        A.bones[A.hands[sp.hand].fore].getWorldPosition(_v2);
        q.setFromUnitVectors(new T.Vector3(0,1,0), _v2.sub(pos).normalize());
      } else q.setFromUnitVectors(new T.Vector3(1,0,0), _gw[sp.hand]);
    }
    // 큰 머리 캐릭터: 바벨·케틀벨이 머리를 뚫으면 머리 바깥(가까운 쪽)으로 비켜 놓음
    if (A.kind !== 'human' && headSphere(A, _hsC)){
      const R = _hsR + (sp.prop === 'barbell' ? 0.035 : 0.06) * A.place.s * f;
      if (sp.prop === 'barbell' && sp.hand === 'LR'){
        const x = _gp.L.clone().sub(_gp.R).normalize(), d = _hsC.clone().sub(pos); d.addScaledVector(x, -d.dot(x));
        const L = d.length(); if (L < R){ if (L < 1e-5) d.set(0, 0, -1).applyQuaternion(rq); else d.normalize(); pos.addScaledVector(d, -(R - L)); }
      } else {
        const d = pos.clone().sub(_hsC), L = d.length(); if (L < R){ if (L < 1e-5) d.set(0, 0, 1).applyQuaternion(rq); else d.normalize(); pos.copy(_hsC).addScaledVector(d, R); }
      }
    }
    e.obj.position.copy(A.root.worldToLocal(pos));
    e.obj.quaternion.copy(rqi).multiply(q);
    e.obj.scale.setScalar(f);
  }
}

/* ---------- 바닥 높이 (배경에 따라) ---------- */
let curSet = null;
function floorY(){ return curSet && curSet.userData.floorY || 0; }
// 침대처럼 무대 일부만 높은 배경: 그 영역 안에서만 높이를 줌
function floorAt(x, z){
  const u = curSet && curSet.userData; if (!u || !u.floorY) return 0;
  if (u.raised){ const r = u.raised; if (Math.abs(x - r.cx) > r.w/2 || Math.abs(z - r.cz) > r.d/2) return 0; }
  return u.floorY;
}

function computeAnchor(A){
  const save = clonePose(A.pose), sm = cloneMeta(A.meta), ok = A.ground;
  sampleClip(A.clip, 0, A.pose, A.meta);
  applyDriver(A); driveModel(A); A.lift.position.set(0,0,0); A.root.updateMatrixWorld(true);
  const m = A.meta;
  if (m.g === 'low' || m.g === 'back' || m.g === 'seat'){
    const list = m.g === 'back' ? A.samples.back : m.g === 'seat' ? A.samples.seat : A.samples.all;
    A.lift.position.y -= lowestY(A, list); A.root.updateMatrixWorld(true);
  }
  A.anchor = {};
  for (const s of 'LR'){ if (!A.legs[s]) continue; const p = A.bones[A.legs[s].foot].getWorldPosition(new T.Vector3()); A.root.worldToLocal(p); A.anchor[s] = p; }
  copyPose(save, A.pose); Object.assign(A.meta, sm);
}
// 발 목표 기준점: 앵커가 있으면 그 위치, 없으면 서 있을 때 발목
const _legTargetsCore = legTargets;
legTargets = function(A, meta, gl){
  if (!A.anchor) return _legTargetsCore(A, meta, gl);
  const keep = {};
  for (const s of 'LR'){ const info = A.legInfo[s]; if (!info || !A.anchor[s]) continue; keep[s] = info.ankle; info.ankle = new T.Vector3(A.anchor[s].x, info.ankle.y, A.anchor[s].z); info._ball = info.ball; info.ball = info._ball.clone().add(info.ankle).sub(keep[s]); }
  const out = _legTargetsCore(A, meta, gl);
  for (const s in keep){ const info = A.legInfo[s]; info.ball = info._ball; info.ankle = keep[s]; }
  return out;
};
function mergeSetChildren(set){
  const BU = T.BufferGeometryUtils; if (!BU || !BU.mergeBufferGeometries) return;
  set.updateMatrixWorld(true);
  const inv = new T.Matrix4();
  for (const child of set.children.slice()){
    if (!child.isGroup && !(child.isMesh && child.children.length)) continue;
    inv.copy(child.matrixWorld).invert();
    const buckets = new Map();
    child.traverse(o => {
      if (!o.isMesh || o.userData.floor) return;
      const key = o.material.uuid + (o.castShadow ? 's' : '');
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!buckets.has(key)) buckets.set(key, {mat:o.material, cast:o.castShadow, outline:!!o.userData.outline, geos:[]});
      buckets.get(key).geos.push(g);
    });
    if (!buckets.size) continue;
    const keep = [];
    child.traverse(o => { if (o.isMesh && o.userData.floor) keep.push(o); });
    const merged = new T.Group(); merged.position.copy(child.position); merged.quaternion.copy(child.quaternion); merged.scale.copy(child.scale);
    merged.userData = child.userData;
    for (const b of buckets.values()){
      const geo = BU.mergeBufferGeometries(b.geos, false); if (!geo) continue;
      const m = new T.Mesh(geo, b.mat); m.castShadow = b.cast; m.receiveShadow = !b.outline; if (b.outline){ m.renderOrder = -1; m.userData.outline = true; m.raycast = () => {}; }
      merged.add(m);
    }
    for (const k of keep){ merged.attach(k); }
    set.remove(child); set.add(merged);
  }
}
/* ===== GLUE (replaces the UI section 4517-12774) ===== */
function charPrepare(){}                 // stub: only called for def.custom (user-added characters)
function footFixAt(){ return null; }     // stub: only called for capture clips with footFix
const PRS = window.StudioPresets;
const clock = {t:0};
function wp(A, name){ return A.bones[name].getWorldPosition(new T.Vector3()); }   // = line 5314
function presetById(id){ return PRS.list.find(p => p.id === id) || null; }
/* presetClip: verbatim 4915-4924 */
function presetClip(pr){
  const defPl = (pr.g && pr.g !== 'feet') ? [0,0] : [1,1];
  const keys = pr.keys.map(([t, spec, o]) => {
    o = o || {};
    const p = identityPose(); for (const b in spec) if (p.rot[b]) p.rot[b].copy(qE(...spec[b])); if (o.r) p.root.set(...o.r);
    return {t, pose:p, meta:{g:o.g || pr.g || 'feet', pl:(o.pl || defPl).slice(), st:o.st ? [o.st[0].slice(), o.st[1].slice()] : [[0,0],[0,0]], hr:(o.hr || [0,0]).slice(), hw:(o.hw || [0,0]).slice(), ht:(o.ht || [null,null]).slice(), rf:o.rf || 0, cx:o.cx || 0, ey:o.ey || 0}};
  });
  return {name:pr.name, source:'keys', duration:pr.dur, keys, presetId:pr.id, cat:pr.cat || '', hands:pr.hands || null, yaw:pr.yaw || 0, equip:pr.equip || '', need:pr.need || '', anchor:!!pr.anchor, rfFoot:pr.rfFoot || '', rfLeg:pr.rfLeg || '', strap:!!pr.strap};
}
/* computeAnchor + legTargets override: verbatim 4998-5020 (pasted here) */
/* minimal setActorClip (4925-4937 without UI) */
function setClip(A, c, opts = {}){
  const keep = A.clip ? clonePose(A.pose) : null;
  A.clip = c; A.start = clock.t; A.loop = opts.loop !== false; A._smA = null; A._lb = null;
  A.yawClip = (c && c.yaw) || 0;
  setEquip(A, c && c.equip);
  if (opts.beforeMeasure) opts.beforeMeasure(A, c); else applyPlace(A);
  A.anchor = null;
  if (c && c.anchor) computeAnchor(A);
  measureClipStretch(A); measureFlights(A);
  A._blend = keep && opts.blend !== 0 ? {pose:keep, t0:clock.t, d:opts.blend ?? 0.3} : null;
  A._onDone = opts.onDone || null;
}
function applyBlend(A){                   // = afterSample 6440-6448 minus shortsMouth
  const b = A._blend; if (!b) return;
  const u = (clock.t - b.t0) / b.d;
  if (u >= 1 || u < 0){ A._blend = null; return; }
  const k = 1 - u*u*(3-2*u);
  for (const n of BONES) A.pose.rot[n].slerp(b.pose.rot[n], k);
  A.pose.root.lerp(b.pose.root, k);
}
function addActor(kind, opts = {}){
  const A = createActor(kind, opts); if (!A) return null;
  A.place.elev = floorAt(A.place.x, A.place.z); applyPlace(A);
  setClip(A, presetClip(presetById(opts.preset || 'idle')), {blend:0});
  return A;
}
function playOnce(A, presetId, then = 'idle', opts = {}){
  setClip(A, presetClip(presetById(presetId)), Object.assign({}, opts, {loop:false, onDone:B => setClip(B, presetClip(presetById(then)))}));
}
function setSet(id, merge = false){
  if (curSet) world.remove(curSet);
  curSet = AS.sets[id].build();
  if (merge) mergeSetChildren(curSet);
  world.add(curSet);
  const u = curSet.userData;
  scene.fog = u.fog ? new T.Fog(u.fog.color, u.fog.near, u.fog.far) : null;
  renderer.setClearColor(u.sky || '#FBF8F2', 1);
  for (const A of actors){ A.place.elev = floorAt(A.place.x, A.place.z); applyPlace(A); }
  return curSet;
}
function stations(){ return curSet ? curSet.children.filter(o => o.userData && o.userData.id && AS.props[o.userData.id]) : []; }
const ang2 = v => Math.atan2(-v.z, v.x) * R2D;
function mountStation(A, station, presetId){
  const c = presetClip(presetById(presetId)), s = station.scale.x, ud = station.userData;
  station.updateMatrixWorld(true);
  const P = station.getWorldPosition(new T.Vector3());
  const axis = new T.Vector3(1,0,0).transformDirection(station.matrixWorld); axis.y = 0; axis.normalize();
  const top = (ud.surfaces && (ud.surfaces.seat || ud.surfaces.carriage)) || ud.top || 0;
  setClip(A, c, {loop:true, beforeMeasure:(A, c) => {
    A.seatH = 0; A.reformer = null;
    A.place.x = P.x; A.place.z = P.z; A.place.elev = floorAt(P.x, P.z) + top * s; applyPlace(A);
    const measure = () => { sampleClip(c, 0, A.pose, A.meta); A._ct = 0; updateActor(A);
      const head = wp(A, A.headBone), hips = wp(A, A.hipsBone), feet = wp(A, A.legs.L.foot).add(wp(A, A.legs.R.foot)).multiplyScalar(0.5);
      const fd = feet.clone().sub(head); fd.y = 0; fd.normalize(); return {head, hips, feet, fd}; };
    let m = measure();
    A.place.ry += ang2(axis) - ang2(m.fd); applyPlace(A);
    m = measure();
    let want;
    if (c.need === 'reformer'){
      const sh = wp(A, A.handle.upperArmL).add(wp(A, A.handle.upperArmR)).multiplyScalar(0.5);
      const cxMax = Math.max(0, ...c.keys.map(k => (k.meta && k.meta.cx) || 0));
      want = sh.addScaledVector(m.fd, (0.68 - cxMax) * s);
    } else if (c.need === 'bench') want = m.hips.clone().lerp(m.head, 0.45);
    else want = m.head.clone().add(m.feet).multiplyScalar(0.5);
    A.place.x += P.x - want.x; A.place.z += P.z - want.z; applyPlace(A);
    if (c.need === 'reformer'){ const mv = ud.moving || {}; A.reformer = {obj:station, car:mv.carriage, straps:mv.straps, ropes:null}; }
  }});
}
function leaveStation(A, x, z){
  const R = A.reformer;
  if (R){ if (R.straps) R.straps.visible = true; if (R.ropes) for (const r of [...R.ropes, ...R.loops]) r.visible = false; if (R.car) R.car.position.x = R.obj.userData.rf.car0; }
  A.reformer = null; A.anchor = null; A.seatH = 0;
  A.place.x = x; A.place.z = z; A.place.elev = floorAt(x, z); applyPlace(A);
  setClip(A, presetClip(presetById('idle')));
}
function recolor(A, matName, hex){
  for (const m of A.inst.meshes) if (m.userData.matName === matName){ m.material = m.material.clone(); m.material.color.setHex(hex); }
}
const HOOKS = [];
let last = performance.now();
function frame(now){
  const dt = Math.min(0.1, (now - last) / 1000); last = now; jointTick();
  clock.t += dt;
  EYES.t = clock.t; FRAME.id++; FRAME.dt = Math.max(1/240, dt);
  for (const A of actors.slice()){
    if (!A.visible){ A.root.visible = false; continue; }
    if (A.clip){ A._ct = actorTime(A, clock.t); sampleClip(A.clip, A._ct, A.pose, A.meta); applyBlend(A); }
    updateActor(A); updateEquip(A);
    if (A.clip && !A.loop && A._onDone && (clock.t - A.start) * A.speed >= clipDur(A.clip)){ const cb = A._onDone; A._onDone = null; cb(A); }
  }
  for (const f of HOOKS) { try { f(dt, clock.t); } catch (e) { console.error(e); } }
  orbit.update();
  renderer.clear(); renderer.render(scene, cam);
  requestAnimationFrame(frame);
}
function resize(){ const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(view); resize();
requestAnimationFrame(frame);
function tick(A, t){ A._ct = t; sampleClip(A.clip, t, A.pose, A.meta); updateActor(A); updateEquip(A); }
window.GymEngine = {tick, hooks:HOOKS, ang2, actorTime, sampleClip, updateActor, THREE:T, AS, PRS, scene, cam, orbit, renderer, world, propLayer, actorLayer, sun, hemi, rim, actors, templates, CHAR_BUF, MODEL_DEF, HUMAN_LOOK, paintHuman,
  loadTemplate, createActor, addActor, removeActor, applyPlace, presetClip, presetById, setClip, playOnce, clipDur, setSet, stations, mountStation, leaveStation, recolor, floorAt, clock, BODY, JIG, EYES, PHYS, wp};
})();
