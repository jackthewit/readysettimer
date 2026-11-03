// ------------------------------------------------------------------ 비밀의 바디프로필 촬영장
// 들어가는 법: 키보드로 J J A K (짹)을 차례로 누르거나, 메뉴의 「비밀 코드」에 jjak 또는 짹짹을 넣는다.
// 짐에서 멀리 떨어진 곳에 촬영 배경을 만들고, 내 짹짹이를 하나 더 세워 포즈를 잡는다.
// 사진은 4:5(1080×1350)로 찍어 휴대폰은 공유 창(사진 저장), 컴퓨터는 파일로 내려받는다. 안 되면 사진을 길게 눌러 저장.
const STUDIO = {
  at: { x: 40, z: 0 },   // 짐과 떨어진 곳
  vfov: 30,              // 사진 틀 안에서 보이는 세로 시야(도)
  code: ['KeyJ', 'KeyJ', 'KeyA', 'KeyK'],
  backs: [
    { id: 'cream', label: '크림', wall: 0xEFE4D2, glow: 'rgba(255,255,255,.55)', ink: '#2B2B2F' },
    { id: 'coral', label: '코랄', wall: 0xE87A5D, glow: 'rgba(255,226,190,.55)', ink: '#FFF6E8' },
    { id: 'black', label: '블랙', wall: 0x2A2B30, glow: 'rgba(255,214,90,.32)', ink: '#F5D33F' },
    { id: 'sky', label: '하늘', wall: 0x9CCBE6, glow: 'rgba(255,255,255,.55)', ink: '#1F3550' },
    { id: 'yellow', label: '노랑', wall: 0xF2CF1D, glow: 'rgba(255,255,255,.5)', ink: '#2B2B2F' },
  ],
  angles: [
    { label: '정면', pos: [0, 1.0, 4.4], look: [0, 0.84, 0] },
    { label: '사선', pos: [2.2, 1.1, 3.8], look: [0, 0.84, 0] },
    { label: '아래에서', pos: [0.6, 0.3, 4.5], look: [0, 0.88, 0] },
  ],
};
// 찍는 순간의 변신: 고른 몸(남자·여자 × 근육질·다이어트)으로 바뀌고, 옷은 찍을 때마다 차례로 바뀐다
// buff 근육 모프 세기, lean 날씬 모프 세기 (엔진 setBody)
const STUDIO_SEXES = [{ id: 'm', label: '남자' }, { id: 'f', label: '여자' }];
const STUDIO_TYPES = [{ id: 'muscle', label: '근육질' }, { id: 'diet', label: '다이어트' }];
const STUDIO_BODY = {
  m: { muscle: { buff: 1.3, lean: 0 }, diet: { buff: 0.35, lean: 0.8 } },   // 우락부락 · 잔근육 있는 마른 몸
  f: { muscle: { buff: 0.6, lean: 0.55 }, diet: { buff: 0, lean: 1 } },     // 탄탄하고 허리 잘록 · 날씬
};
const STUDIO_LOOKS = {
  m: [
    { id: 'black', label: '블랙 에디션', shirt: 0x24242A, pants: 0x18181C, band: 0xE9B92B, wrist: 0xE9B92B, glasses: 0x141519, chain: true },
    { id: 'champ', label: '챔피언', shirt: 0xE03A3A, pants: 0xF4F1EA, band: 0xE03A3A, wrist: 0xF4F1EA, belt: true },
    { id: 'neon', label: '네온 스포티', shirt: 0x2FB5A0, pants: 0x232C66, band: 0xF4F1EA, wrist: 0x7CEB5E, glasses: 0x2E7BE0 },
  ],
  f: [
    { id: 'pink', label: '핑크 필라테스', shirt: 0xFF9EC4, pants: 0x2E3150, band: 0xFFFFFF, wrist: 0xFF9EC4, bow: 0xFF5C9E, pearls: true },
    { id: 'gold', label: '블랙 앤 골드', shirt: 0x24242A, pants: 0x24242A, band: 0xE9B92B, wrist: 0xE9B92B, glasses: 0x141519, chain: true },
    { id: 'lavender', label: '라벤더', shirt: 0xB9A3F0, pants: 0xF4F1EA, band: 0xB9A3F0, wrist: 0xFFFFFF, bow: 0xFFFFFF, glasses: 0x8E6BD8 },
  ],
};
const studio = { on: false, group: null, A: null, wallMat: null, glowTex: null, back: 0, angle: 0, pose: 0, sex: 'm', type: 'muscle', saved: null, keyBuf: [], look: -1, dressed: null, anim: null, busy: false };

// 포즈: 정지 자세. 뼈 이름은 엔진의 기본 자세(REST) 기준
const STUDIO_POSES = (() => {
  const R = G.PRS.REST;
  const both = (n, x, y, z) => ({ [n + 'L']: [x, y, z], [n + 'R']: [x, -y, -z] });
  const J2 = (...a) => Object.assign({}, R, ...a);
  const FIST = { fingersL: [-80, 0, 0], fingersR: [-80, 0, 0], pointL: [-80, 0, 0], pointR: [-80, 0, 0], thumbL: [-50, 0, 0], thumbR: [-50, 0, 0] };
  const legs = both('thigh', -6, 0, 12);
  const HIP_L = { upperArmL: [10, 0, 52], forearmL: [0, 0, -98] }; // 왼손은 허리에
  return [
    { id: 'bpDouble', label: '더블 바이셉스', p: J2(FIST, legs, both('upperArm', 0, 0, 96), { forearmL: [0, 0, 118], forearmR: [0, 0, -118], chest: [-6, 0, 0], head: [-6, 0, 0] }) },
    { id: 'bpSide', label: '사이드 체스트', p: J2(FIST, legs, { upperArmL: [0, 0, 96], forearmL: [0, 0, 118], upperArmR: [0, 0, -38], forearmR: [0, 0, -96], chest: [-4, 14, 0], head: [-4, -18, 0] }) },
    { id: 'bpHooray', label: '만세', p: J2(FIST, legs, both('upperArm', 0, 0, 150), { chest: [-8, 0, 0], head: [-14, 0, 0] }) },
    { id: 'bpPoint', label: '저기 봐', p: J2(legs, { upperArmR: [-96, 0, -8], forearmR: [-6, 0, 0], upperArmL: [0, 0, 38], forearmL: [0, 0, 96], chest: [-3, -14, 0], head: [-4, 10, 0], fingersR: [-80, 0, 0], thumbR: [-50, 0, 0] }) },
    { id: 'bpHips', label: '허리에 손', p: J2(FIST, both('thigh', -4, 0, 9), both('upperArm', 10, 0, 52), both('forearm', 0, 0, -98), { chest: [-5, 0, 0], head: [-8, 6, 0] }) },
    { id: 'bpOneArm', label: '한 팔 알통', p: J2(FIST, legs, HIP_L, { upperArmR: [0, 0, -96], forearmR: [0, 0, -118], chest: [-4, 8, 0], head: [-6, -14, 0] }) },
    { id: 'bpV', label: '브이', p: J2(legs, HIP_L, { upperArmR: [0, 0, -95], forearmR: [0, 0, -75], pointR: [0, 0, 0], fingersR: [-80, 0, 0], thumbR: [-50, 0, 0], head: [0, 0, -12] }) },
    { id: 'bpModel', label: '모델 포즈', p: J2(FIST, HIP_L, { thighL: [-4, 0, 6], thighR: [-14, 0, -4], shinR: [22, 0, 0], upperArmR: [0, 0, -12], chest: [0, 0, -5], head: [-4, 0, 8] }) },
    { id: 'bpSky', label: '하늘 찌르기', p: J2(legs, HIP_L, { upperArmR: [0, 0, -165], pointR: [0, 0, 0], fingersR: [-80, 0, 0], thumbR: [-50, 0, 0], head: [-16, -8, 0] }) },
    { id: 'bpTada', label: '짜잔', p: J2(both('thigh', -6, 0, 18), both('upperArm', 0, 0, 30), both('forearm', -60, 0, 60), { chest: [-8, 0, 0], head: [-6, 0, 0] }) },
    { id: 'bpHair', label: '머리 넘기기', p: J2(legs, both('upperArm', 0, 0, 140), both('forearm', 0, 0, 70), { fingersL: [-30, 0, 0], fingersR: [-30, 0, 0], head: [-10, 0, 0] }) },
  ];
})();
const studioPoseClip = (i) => {
  const q = STUDIO_POSES[i];
  if (!G.presetById(q.id)) G.PRS.list.push({ id: q.id, cat: 'x', name: q.label, dur: 1, keys: [[0, q.p, { g: 'feet', pl: [1, 1] }], [1, q.p, { g: 'feet', pl: [1, 1] }]] });
  return G.presetClip(G.presetById(q.id));
};

// 배경: 바닥에서 벽으로 둥글게 이어지는 종이(호리존트) + 조명 두 대 + 뒤쪽 은은한 빛
function buildPhotoStudio() {
  const g = new T.Group();
  g.position.set(STUDIO.at.x, 0, STUDIO.at.z);
  // 둥근 배경 종이: 단면(바닥 4m → 반지름 1m 곡면 → 벽 5m)을 따라 판을 휜다
  const W = 9, FL = 4, RAD = 1, WL = 5, len = FL + Math.PI * RAD / 2 + WL;
  const geo = new T.PlaneGeometry(W, len, 1, 48), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const s = (pos.getY(i) / len + 0.5) * len; // 0(앞 바닥) → len(벽 위)
    let y, z;
    if (s <= FL) { y = 0; z = 3 - s; }
    else if (s <= FL + Math.PI * RAD / 2) { const a = (s - FL) / RAD; y = RAD - Math.cos(a) * RAD; z = 3 - FL - Math.sin(a) * RAD; }
    else { y = RAD + (s - FL - Math.PI * RAD / 2); z = 3 - FL - RAD; }
    pos.setXYZ(i, pos.getX(i), y, z);
  }
  geo.computeVertexNormals();
  studio.wallMat = new T.MeshStandardMaterial({ color: STUDIO.backs[0].wall, roughness: 0.95, metalness: 0, side: T.DoubleSide });
  const paper = new T.Mesh(geo, studio.wallMat);
  paper.receiveShadow = true;
  g.add(paper);
  // 뒤 벽의 둥근 빛
  const c = document.createElement('canvas'); c.width = c.height = 256;
  studio.glowCanvas = c;
  studio.glowTex = new T.CanvasTexture(c);
  const glow = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: studio.glowTex, transparent: true, depthWrite: false }));
  glow.position.set(0, 1.55, 3 - FL - RAD + 0.02);
  g.add(glow);
  // 조명 두 대 (소프트박스)
  const stand = new T.MeshStandardMaterial({ color: 0x2B2B2F, roughness: 0.6 });
  const box = new T.MeshStandardMaterial({ color: 0x1E1E22, roughness: 0.7 });
  const face = new T.MeshBasicMaterial({ color: 0xFFFDF5 });
  for (const sx of [-1, 1]) {
    const l = new T.Group();
    l.position.set(sx * 2.6, 0, 0.6);
    l.rotation.y = sx * 0.55;
    const pole = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 2.1, 10), stand); pole.position.y = 1.05; l.add(pole);
    for (let k = 0; k < 3; k++) { const leg = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.7, 8), stand); const a = k * Math.PI * 2 / 3; leg.position.set(Math.cos(a) * 0.22, 0.14, Math.sin(a) * 0.22); leg.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); l.add(leg); }
    const sb = new T.Mesh(new T.BoxGeometry(0.9, 1.1, 0.32), box); sb.position.set(0, 2.15, 0); l.add(sb);
    const fc = new T.Mesh(new T.PlaneGeometry(0.82, 1.02), face); fc.position.set(0, 2.15, 0.165); l.add(fc);
    g.add(l);
  }
  // 발 자리 표시
  const mark = new T.MeshBasicMaterial({ color: 0xE04848 });
  for (const r of [0.6, -0.6]) { const t = new T.Mesh(new T.PlaneGeometry(0.34, 0.05), mark); t.rotation.set(-Math.PI / 2, 0, r); t.position.set(0, 0.004, 0.55); g.add(t); }
  // 촬영 빛: 앞쪽 위에서 비추는 부드러운 빛
  const key = new T.SpotLight(0xFFF4E2, 0.55, 14, 0.6, 0.7, 1.2);
  key.position.set(1.6, 3.4, 4.2); key.target.position.set(0, 0.9, 0);
  g.add(key, key.target);
  G.scene.add(g);
  return g;
}
function paintStudioBack() {
  const b = STUDIO.backs[studio.back];
  studio.wallMat.color.setHex(b.wall);
  const x = studio.glowCanvas.getContext('2d');
  x.clearRect(0, 0, 256, 256);
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, b.glow); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  studio.glowTex.needsUpdate = true;
  for (const el of document.querySelectorAll('#studioBacks button')) el.setAttribute('aria-pressed', el.dataset.i === String(studio.back));
}

// 사진 틀(4:5)을 화면 가운데에 두고, 틀 안의 세로 시야가 STUDIO.vfov가 되도록 카메라를 맞춘다
function studioFrame() {
  const v = $('#view'), vw = v.clientWidth, vh = v.clientHeight;
  const narrow = matchMedia('(max-width: 860px)').matches;
  // 위아래 버튼을 피하되 틀은 화면 한가운데에 둔다 (카메라 가운데 = 틀 가운데)
  const m = narrow ? Math.min(176, vh * 0.23) : Math.min(120, vh * 0.16);
  let gh = vh - 2 * m, gw = gh * 0.8;
  if (gw > vw * 0.94) { gw = vw * 0.94; gh = gw / 0.8; }
  return { vw, vh, gw, gh };
}
function aimStudioCam() {
  if (!studio.on) return;
  const f = studioFrame(), a = STUDIO.angles[studio.angle], o = STUDIO.at;
  const half = Math.tan(STUDIO.vfov * Math.PI / 360) * f.vh / f.gh;
  G.cam.fov = Math.atan(half) * 360 / Math.PI;
  G.cam.aspect = f.vw / f.vh;
  G.cam.position.set(o.x + a.pos[0], a.pos[1], o.z + a.pos[2]);
  G.orbit.target.set(o.x + a.look[0], a.look[1], o.z + a.look[2]);
  G.cam.lookAt(G.orbit.target);
  G.cam.updateProjectionMatrix();
  const fr = $('#studioFrame');
  fr.style.width = `${f.gw}px`; fr.style.height = `${f.gh}px`;
  for (const el of document.querySelectorAll('#studioAngles button')) el.setAttribute('aria-pressed', el.dataset.i === String(studio.angle));
}
function setStudioPose(i) {
  studio.pose = (i + STUDIO_POSES.length) % STUDIO_POSES.length;
  if (studio.A) G.setClip(studio.A, studioPoseClip(studio.pose), { blend: 0.35 });
  for (const el of document.querySelectorAll('#studioPoses button')) el.setAttribute('aria-pressed', el.dataset.i === String(studio.pose));
}

// ---- 변신: 근육 몸 + 멋진 옷 ----
// 소품은 모델 좌표(묶을 때 자세)로 만들어 뼈에 붙인다: 뼈 아래에 그 뼈의 '묶을 때 역행렬'을 한 겹 두면 모델 좌표가 그대로 맞는다
const GOLD = () => new T.MeshStandardMaterial({ color: 0xF0B93A, metalness: 0.35, roughness: 0.3, emissive: 0x3A2600 });
function inkShell(mesh, w = 0.004) {
  const m = new T.MeshBasicMaterial({ color: 0x1A1A1C, side: T.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${w.toFixed(4)};`); };
  const o = new T.Mesh(mesh.geometry, m);
  o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale);
  return o;
}
function boneHolder(A, name) {
  const sk = A.inst.mesh.skeleton, i = sk.bones.findIndex((b) => b.name === name);
  const h = new T.Group();
  h.matrixAutoUpdate = false; h.matrix.copy(sk.boneInverses[i]);
  sk.bones[i].add(h);
  return h;
}
// 변신한 몸의 겉면 점들 (근육 모프 6 · 날씬 모프 7을 섞은 모양)
function bodySurface(mat, body) {
  const m = G.templates.jjak.meshes.find((x) => x.userData.matName === mat), g = m.geometry, P = g.attributes.position;
  const B = g.morphAttributes.position[6], L = g.morphAttributes.position[7], b = body.buff, l = body.lean;
  const pts = [];
  for (let i = 0; i < P.count; i++) pts.push([P.getX(i) + B.getX(i) * b + L.getX(i) * l, P.getY(i) + B.getY(i) * b + L.getY(i) * l, P.getZ(i) + B.getZ(i) * b + L.getZ(i) * l]);
  return pts;
}
function frontZ(pts, x, y, r = 0.02) {
  let z = -9;
  for (const p of pts) if (Math.abs(p[0] - x) < r && Math.abs(p[1] - y) < r) z = Math.max(z, p[2]);
  return z;
}
const FACE_X = -0.0135; // 얼굴 가운데(모델 좌표)
function makeGlasses(color) {
  const g = new T.Group();
  const shape = new T.Shape(), w = 0.074, h = 0.05, r = 0.016;
  shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + 0.006); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const lensGeo = new T.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false, curveSegments: 6 });
  const lensMat = new T.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.42 });
  const shine = new T.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.75 });
  for (const sd of [-1, 1]) {
    const L = new T.Group();
    L.position.set(FACE_X + sd * 0.041, 0.707, 0.118 - Math.abs(sd) * 0.002);
    L.rotation.y = sd * 0.28;
    const lens = new T.Mesh(lensGeo, lensMat); lens.scale.x = sd; lens.castShadow = true;
    L.add(inkShell(lens, 0.005), lens);
    const s = new T.Mesh(new T.PlaneGeometry(0.01, 0.042), shine); s.position.set(-0.014, 0.002, 0.0095); s.rotation.z = -0.6; L.add(s);
    // 다리: 렌즈 바깥에서 머리 옆으로
    const arm = new T.Mesh(new T.BoxGeometry(0.008, 0.008, 0.13), new T.MeshBasicMaterial({ color: 0x1A1A1C }));
    arm.position.set(sd * 0.037, 0.012, -0.06); arm.rotation.y = sd * 0.42; L.add(arm);
    g.add(L);
  }
  const bridge = new T.Mesh(new T.BoxGeometry(0.014, 0.007, 0.007), new T.MeshBasicMaterial({ color: 0x1A1A1C }));
  bridge.position.set(FACE_X, 0.716, 0.125); g.add(bridge);
  return g;
}
function chainPath(body, n) {
  const pts = bodySurface('shirt_orange', body), path = [];
  for (let k = 0; k <= n; k++) {
    const a = Math.PI * k / n, x = FACE_X + Math.cos(a) * 0.1, y = 0.56 - Math.sin(a) * 0.085;
    path.push(new T.Vector3(x, y, frontZ(pts, x, y) + 0.008));
  }
  return { pts, path };
}
// 진주 목걸이
function makePearls(body) {
  const { path } = chainPath(body, 15), g = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0xFFF8F0, roughness: 0.25, metalness: 0.1, emissive: 0x2A2622 });
  const geo = new T.SphereGeometry(0.0105, 14, 10);
  for (const p of path.slice(1, -1)) { const s = new T.Mesh(geo, mat); s.position.copy(p).add(new T.Vector3(0, 0, 0.004)); s.castShadow = true; g.add(inkShell(s, 0.002), s); }
  return g;
}
// 머리 리본: 머리 오른쪽 위 겉면에 붙인다
function makeBow(color) {
  const m = G.templates.jjak.meshes.find((x) => x.userData.matName === 'yellow'), P = m.geometry.attributes.position;
  const c = new T.Vector3(FACE_X, 0.76, -0.05), dir = new T.Vector3(0.62, 0.62, 0.3).normalize();
  let best = -9; const at = new T.Vector3(), v = new T.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (v.y < 0.7) continue; const d = v.clone().sub(c), L = d.length(); const s = d.dot(dir) - 0.6 * d.clone().addScaledVector(dir, -d.dot(dir)).length(); if (s > best && L > 0) { best = s; at.copy(v); } }
  const g = new T.Group(), mat = new T.MeshStandardMaterial({ color, roughness: 0.6 });
  for (const sd of [-1, 1]) {
    const lp = new T.Mesh(new T.SphereGeometry(1, 18, 12), mat);
    lp.scale.set(0.05, 0.034, 0.018); lp.position.set(sd * 0.042, 0, 0); lp.rotation.z = sd * 0.35; lp.castShadow = true;
    g.add(inkShell(lp, 0.12), lp);
  }
  const knot = new T.Mesh(new T.SphereGeometry(0.018, 14, 10), mat); knot.scale.z = 0.8; g.add(inkShell(knot, 0.003), knot);
  g.position.copy(at).addScaledVector(dir, 0.006);
  g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir);
  g.rotateZ(-0.5);
  return g;
}
function makeChain(body) {
  const { pts, path } = chainPath(body, 16), g = new T.Group();
  const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(path), 48, 0.0065, 8, false), GOLD());
  tube.castShadow = true;
  g.add(inkShell(tube, 0.0025), tube);
  const bot = path[8];
  const coin = new T.Mesh(new T.CylinderGeometry(0.026, 0.026, 0.008, 28), GOLD());
  coin.rotation.x = Math.PI / 2; coin.position.set(bot.x, bot.y - 0.03, frontZ(pts, bot.x, bot.y - 0.03) + 0.008);
  coin.castShadow = true;
  g.add(inkShell(coin, 0.003), coin);
  return g;
}
function makeBelt(body) {
  const pts = [...bodySurface('shorts_green', body), ...bodySurface('shirt_orange', body)].filter((p) => Math.abs(p[1] - 0.305) < 0.02);
  let x0 = 9, x1 = -9, z0 = 9, z1 = -9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
  const g = new T.Group(), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const band = new T.Mesh(new T.CylinderGeometry(1, 1, 0.05, 48, 1, true), new T.MeshStandardMaterial({ color: 0x1E1E22, roughness: 0.5, side: T.DoubleSide }));
  band.scale.set((x1 - x0) / 2 + 0.016, 1, (z1 - z0) / 2 + 0.016); band.position.set(cx, 0.305, cz);
  const plate = new T.Mesh(new T.CylinderGeometry(0.052, 0.052, 0.01, 32), GOLD());
  plate.rotation.x = Math.PI / 2; plate.scale.set(1.3, 1, 0.85); plate.position.set(FACE_X, 0.305, z1 + 0.02);
  const gem = new T.Mesh(new T.SphereGeometry(0.016, 16, 12), new T.MeshStandardMaterial({ color: 0xE03A3A, roughness: 0.2, metalness: 0.2 }));
  gem.scale.z = 0.5; gem.position.set(FACE_X, 0.305, z1 + 0.026);
  for (const o of [band, plate, gem]) o.castShadow = true;
  g.add(inkShell(band, 0.003), band, inkShell(plate, 0.003), plate, gem);
  return g;
}
function makeWristband(color, sd) {
  const m = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.036, 24, 1, true), new T.MeshStandardMaterial({ color, roughness: 0.75, side: T.DoubleSide }));
  m.rotation.z = Math.PI / 2; m.position.set(sd * 0.352, 0.5, -0.045); m.castShadow = true;
  const g = new T.Group(); g.add(inkShell(m, 0.003), m);
  return g;
}
function dressStudio(look, body) {
  const A = studio.A; if (!A) return;
  undressStudio(false);
  paintPart(A, 'shirt_orange', look.shirt); paintPart(A, 'shorts_green', look.pants); paintPart(A, 'band_sky', look.band);
  const items = [];
  const put = (bone, obj) => { const h = boneHolder(A, bone); h.add(obj); items.push(h); };
  if (look.glasses) put('Head', makeGlasses(look.glasses));
  if (look.chain) put('Spine', makeChain(body));
  if (look.pearls) put('Spine', makePearls(body));
  if (look.belt) put('Hips', makeBelt(body));
  if (look.bow) put('Head', makeBow(look.bow));
  put('LeftHand', makeWristband(look.wrist, 1)); put('RightHand', makeWristband(look.wrist, -1));
  studio.dressed = { look, items };
}
function undressStudio(repaint = true) {
  const d = studio.dressed; studio.dressed = null;
  if (d) for (const h of d.items) h.parent && h.parent.remove(h);
  const A = studio.A;
  if (A && repaint) { A._shirt = A._band = A._pants = null; paint(A, S.me.color, S.me.band, S.me.pants); }
}
// 몸 바꾸기 (변신할 때는 살짝 넘쳤다 돌아오는 탄력, 돌아올 때는 부드럽게)
function bodyTo(to, dur) {
  const A = studio.A; if (!A) return;
  studio.anim = { from: { buff: A.buff || 0, lean: A.lean || 0 }, to, t0: performance.now(), dur, pop: to.buff + to.lean > 0 };
}
G.hooks.push(() => {
  const an = studio.anim, A = studio.A;
  if (!an || !A) return;
  const u = Math.min(1, (performance.now() - an.t0) / an.dur);
  const e = an.pop ? 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2) : u * u * (3 - 2 * u);
  G.setBody(A, an.from.buff + (an.to.buff - an.from.buff) * e, Math.max(0, an.from.lean + (an.to.lean - an.from.lean) * e));
  if (u >= 1) { G.setBody(A, an.to.buff, an.to.lean); studio.anim = null; }
});
const studioBody = () => STUDIO_BODY[studio.sex][studio.type];
function setStudioBody(sex, type) {
  if (sex) studio.sex = sex;
  if (type) studio.type = type;
  studio.look = -1; // 몸을 바꾸면 옷은 처음 것부터
  for (const el of document.querySelectorAll('#studioSex button')) el.setAttribute('aria-pressed', el.dataset.id === studio.sex);
  for (const el of document.querySelectorAll('#studioType button')) el.setAttribute('aria-pressed', el.dataset.id === studio.type);
}

function openStudio() {
  if (studio.on || !S.shop || !S.meA) return;
  if (S.me.station) releaseStation(true);
  if (S.me.queue) leaveQueue();
  closePay(); closeHelp(); toggleMenu(false);
  studio.on = true; S.studio = true;
  studio.saved = { pos: G.cam.position.clone(), target: G.orbit.target.clone(), fov: G.cam.fov, orbit: G.orbit.enabled, fog: G.scene.fog };
  if (!studio.group) studio.group = buildPhotoStudio();
  studio.group.visible = true;
  G.scene.fog = null;
  G.orbit.enabled = false;
  studio.A = makeJjak(STUDIO.at.x, STUDIO.at.z + 0.55, S.me.color, S.me.band, S.me.pants);
  studio.A.place.ry = 0; G.applyPlace(studio.A);
  G.sun.position.set(STUDIO.at.x + 2.5, 6, STUDIO.at.z + 5);
  G.sun.target.position.set(STUDIO.at.x, 0, STUDIO.at.z);
  paintStudioBack();
  setStudioPose(studio.pose);
  document.body.classList.add('in-studio');
  $('#studio').hidden = false;
  aimStudioCam();
  syncPresence(true);
  sound.unlock(); sound.turn();
  toast('비밀의 바디프로필 촬영장에 들어왔어요!', 2600);
}
function closeStudio() {
  if (!studio.on) return;
  studio.on = false; S.studio = false;
  closeStudioShot();
  $('#studio').hidden = true;
  document.body.classList.remove('in-studio');
  studio.anim = null; studio.dressed = null; studio.busy = false;
  if (studio.A) { G.removeActor(studio.A); studio.A = null; }
  studio.group.visible = false;
  const sv = studio.saved;
  G.scene.fog = sv.fog;
  G.cam.fov = sv.fov; G.cam.aspect = $('#view').clientWidth / $('#view').clientHeight; G.cam.updateProjectionMatrix();
  G.cam.position.copy(sv.pos); G.orbit.target.copy(sv.target);
  G.orbit.enabled = sv.orbit; G.orbit.update();
  syncPresence(true);
}

// 사진: 1080×1350으로 따로 그려서 화면 크기와 상관없이 같은 틀로 나온다
function takeStudioPhoto() {
  if (!studio.on) return null;
  const r = G.renderer, oldPr = r.getPixelRatio(), size = r.getSize(new T.Vector2());
  const oldFov = G.cam.fov, oldAspect = G.cam.aspect;
  const W = 1080, H = 1350;
  r.setPixelRatio(1); r.setSize(W, H, false);
  G.cam.fov = STUDIO.vfov; G.cam.aspect = W / H; G.cam.updateProjectionMatrix();
  r.clear(); r.render(G.scene, G.cam);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.drawImage(r.domElement, 0, 0, W, H);
  r.setPixelRatio(oldPr); r.setSize(size.x, size.y, false);
  G.cam.fov = oldFov; G.cam.aspect = oldAspect; G.cam.updateProjectionMatrix();
  // 근육 몸이면 팔 근처에 반짝이
  if (studio.A && studio.dressed) {
    G.cam.fov = STUDIO.vfov; G.cam.aspect = W / H; G.cam.updateProjectionMatrix();
    const scr = (a, b, f) => { const p = G.wp(studio.A, a).lerp(G.wp(studio.A, b), f).project(G.cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
    const mid = scr('Spine', 'Spine', 0);
    for (const sd of ['Left', 'Right']) {
      // 알통 바깥쪽(몸 가운데에서 먼 쪽)에 큰 별 하나, 작은 별 하나
      const [bx, by] = scr(sd + 'Arm', sd + 'ForeArm', 0.5), o = bx < mid[0] ? -1 : 1;
      sparkle(x, bx + o * 78, by - 46, 28); sparkle(x, bx + o * 34, by - 104, 14);
    }
    G.cam.fov = oldFov; G.cam.aspect = oldAspect; G.cam.updateProjectionMatrix();
  }
  // 글씨: 위에 BODY PROFILE, 아래에 이름과 날짜
  const ink = STUDIO.backs[studio.back].ink, d = new Date();
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = "64px 'Black Han Sans', sans-serif";
  x.fillText('BODY PROFILE', W / 2, 118);
  // 이름·날짜는 제목 아래(발 쪽은 비워 둔다), 구석에 작게 ONLINE GYM
  x.font = "600 34px 'IBM Plex Sans KR', sans-serif";
  x.fillText(S.me.nick || '짹짹이', W / 2, 172);
  x.font = "500 24px 'IBM Plex Sans KR', sans-serif";
  const look = studio.dressed ? ` · ${studio.dressed.look.label}` : '';
  x.fillText(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} · ${STUDIO_POSES[studio.pose].label}${look}`, W / 2, 212);
  x.textAlign = 'right'; x.font = "600 22px 'IBM Plex Sans KR', sans-serif";
  x.fillText('ONLINE GYM', W - 56, H - 52);
  return c;
}
// 찍기: 누르면 먼저 몸이 커지고 옷이 바뀐 뒤(변신) 셔터가 눌린다
function snapStudio() {
  if (!studio.on || studio.busy || !studio.A) return;
  studio.busy = true;
  const looks = STUDIO_LOOKS[studio.sex], body = studioBody();
  studio.look = (studio.look + 1) % looks.length;
  dressStudio(looks[studio.look], body);
  bodyTo(body, 520);
  [520, 660, 880].forEach((f, i) => sound.beep(f, 0.08, i * 0.07, 0.09));
  const fl = $('#studioFlash'); fl.classList.remove('go', 'puff'); void fl.offsetWidth; fl.classList.add('puff');
  setTimeout(shutterStudio, 680);
}
function shutterStudio() {
  studio.busy = false;
  if (!studio.on) return;
  const c = takeStudioPhoto();
  if (!c) return;
  sound.beep(1200, 0.05, 0, 0.12); sound.beep(700, 0.09, 0.06, 0.1);
  const fl = $('#studioFlash'); fl.classList.remove('go', 'puff'); void fl.offsetWidth; fl.classList.add('go');
  studio.lastUrl = c.toDataURL('image/png');
  studio.lastCanvas = c;
  // 휴대폰 공유는 누른 순간 바로 불러야 해서(아이폰) 파일을 미리 만들어 둔다
  studio.lastFile = null;
  const name = studioFileName();
  c.toBlob((b) => { if (b && studio.lastCanvas === c) studio.lastFile = new File([b], name, { type: 'image/png' }); }, 'image/png');
  $('#studioImg').src = studio.lastUrl;
  $('#studioNote').textContent = '';
  $('#studioShot').hidden = false;
}
// 사진 창을 닫으면 원래 몸·옷으로 돌아온다
function closeStudioShot() {
  $('#studioShot').hidden = true;
  if (studio.dressed && !studio.busy) { undressStudio(); bodyTo({ buff: 0, lean: 0 }, 380); }
}
// 반짝이(네 갈래 별)
function sparkle(x, cx, cy, r) {
  x.save(); x.translate(cx, cy);
  x.fillStyle = '#FFFFFF'; x.strokeStyle = 'rgba(30,30,34,.85)'; x.lineWidth = Math.max(2, r * 0.12); x.lineJoin = 'round';
  x.beginPath();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, rr = k % 2 ? r * 0.28 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  x.closePath(); x.stroke(); x.fill();
  x.restore();
}
const studioFileName = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `body-profile-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`; };
async function saveStudioPhoto() {
  const c = studio.lastCanvas;
  if (!c) return;
  const touch = matchMedia('(pointer: coarse)').matches;
  const file = studio.lastFile;
  // 휴대폰: 공유 창에서 「이미지 저장」(사진첩)
  if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'ONLINE GYM 바디프로필' }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  // 컴퓨터: 파일로 내려받기
  try {
    const a = document.createElement('a');
    a.download = file ? file.name : studioFileName();
    a.href = file ? URL.createObjectURL(file) : studio.lastUrl;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => { if (a.href.startsWith('blob:')) URL.revokeObjectURL(a.href); }, 4000);
  } catch { /* 아래 안내로 */ }
  // 내려받기가 막힌 곳(앱 안 미리보기 등)을 위해 안내도 남긴다
  $('#studioNote').textContent = touch ? '저장이 안 되면 사진을 길게 눌러 저장해 주세요.' : '저장이 안 되면 사진에서 오른쪽 클릭 → 이미지 저장을 눌러 주세요.';
}

// 화면 만들기 (버튼 목록)
(function studioUi() {
  $('#studioPoses').innerHTML = STUDIO_POSES.map((q, i) => `<button type="button" data-i="${i}">${q.label}</button>`).join('');
  $('#studioBacks').innerHTML = STUDIO.backs.map((b, i) => `<button type="button" data-i="${i}" title="${b.label}" style="--c:#${b.wall.toString(16).padStart(6, '0')}"><span>${b.label}</span></button>`).join('');
  $('#studioAngles').innerHTML = STUDIO.angles.map((a, i) => `<button type="button" data-i="${i}">${a.label}</button>`).join('');
  $('#studioSex').innerHTML = STUDIO_SEXES.map((o) => `<button type="button" data-id="${o.id}">${o.label}</button>`).join('');
  $('#studioType').innerHTML = STUDIO_TYPES.map((o) => `<button type="button" data-id="${o.id}">${o.label}</button>`).join('');
  $('#studioSex').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStudioBody(b.dataset.id, null); });
  $('#studioType').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStudioBody(null, b.dataset.id); });
  setStudioBody();
  $('#studioPoses').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStudioPose(+b.dataset.i); });
  $('#studioBacks').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { studio.back = +b.dataset.i; paintStudioBack(); } });
  $('#studioAngles').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { studio.angle = +b.dataset.i; aimStudioCam(); } });
  $('#studioSnap').addEventListener('click', snapStudio);
  $('#studioExit').addEventListener('click', closeStudio);
  $('#studioSave').addEventListener('click', saveStudioPhoto);
  $('#studioAgain').addEventListener('click', closeStudioShot);
  addEventListener('resize', aimStudioCam);
  // 메뉴의 비밀 코드
  $('#codeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#codeInput').value.trim().toLowerCase().replace(/\s+/g, '');
    $('#codeInput').value = '';
    if (v === 'jjak' || v === '짹짹' || v === '짹') openStudio();
    else toast('코드가 맞지 않아요.', 1800);
  });
  // 키보드: J J A K 차례로 (한글 입력 상태여도 키 위치로 알아본다)
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
    if (studio.on) {
      if (e.code === 'Escape') { if (!$('#studioShot').hidden) closeStudioShot(); else closeStudio(); }
      else if (e.code === 'Space' && !e.repeat) { e.preventDefault(); if ($('#studioShot').hidden) snapStudio(); }
      else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') setStudioPose(studio.pose + (e.code === 'ArrowRight' ? 1 : -1));
      else if (/^Digit[1-9]$/.test(e.code) && +e.code.slice(5) <= STUDIO_POSES.length) setStudioPose(+e.code.slice(5) - 1);
      return;
    }
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    studio.keyBuf.push(e.code);
    if (studio.keyBuf.length > STUDIO.code.length) studio.keyBuf.shift();
    if (studio.keyBuf.join() === STUDIO.code.join()) { studio.keyBuf = []; openStudio(); }
  });
  if (FAST) window.__studio = { studio, openStudio, closeStudio, takeStudioPhoto, snapStudio, setStudioPose, saveStudioPhoto, dressStudio, undressStudio, closeStudioShot, LOOKS: STUDIO_LOOKS, BODY: STUDIO_BODY, setStudioBody }; // 시험용
})();
