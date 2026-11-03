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
const studio = { on: false, group: null, A: null, wallMat: null, glowTex: null, back: 0, angle: 0, pose: 0, saved: null, keyBuf: [] };

// 포즈: 정지 자세. 뼈 이름은 엔진의 기본 자세(REST) 기준
const STUDIO_POSES = (() => {
  const R = G.PRS.REST;
  const both = (n, x, y, z) => ({ [n + 'L']: [x, y, z], [n + 'R']: [x, -y, -z] });
  const J2 = (...a) => Object.assign({}, R, ...a);
  const FIST = { fingersL: [-80, 0, 0], fingersR: [-80, 0, 0], pointL: [-80, 0, 0], pointR: [-80, 0, 0], thumbL: [-50, 0, 0], thumbR: [-50, 0, 0] };
  const legs = both('thigh', -6, 0, 12);
  return [
    { id: 'bpDouble', label: '더블 바이셉스', p: J2(FIST, legs, both('upperArm', 0, 0, 96), { forearmL: [0, 0, 118], forearmR: [0, 0, -118], chest: [-6, 0, 0], head: [-6, 0, 0] }) },
    { id: 'bpSide', label: '사이드 체스트', p: J2(FIST, legs, { upperArmL: [0, 0, 96], forearmL: [0, 0, 118], upperArmR: [0, 0, -38], forearmR: [0, 0, -96], chest: [-4, 14, 0], head: [-4, -18, 0] }) },
    { id: 'bpHooray', label: '만세', p: J2(FIST, legs, both('upperArm', 0, 0, 150), { chest: [-8, 0, 0], head: [-14, 0, 0] }) },
    { id: 'bpPoint', label: '저기 봐', p: J2(legs, { upperArmR: [-96, 0, -8], forearmR: [-6, 0, 0], upperArmL: [0, 0, 38], forearmL: [0, 0, 96], chest: [-3, -14, 0], head: [-4, 10, 0], fingersR: [-80, 0, 0], thumbR: [-50, 0, 0] }) },
    { id: 'bpHips', label: '허리에 손', p: J2(FIST, both('thigh', -4, 0, 9), both('upperArm', 10, 0, 42), both('forearm', 0, 0, 100), { chest: [-5, 0, 0], head: [-8, 6, 0] }) },
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
  const m = narrow ? Math.min(150, vh * 0.2) : Math.min(104, vh * 0.15);
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
  // 글씨: 위에 BODY PROFILE, 아래에 이름과 날짜
  const ink = STUDIO.backs[studio.back].ink, d = new Date();
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = "64px 'Black Han Sans', sans-serif";
  x.fillText('BODY PROFILE', W / 2, 118);
  x.font = "500 26px 'IBM Plex Sans KR', sans-serif";
  x.fillText('비밀의 촬영장 · ONLINE GYM', W / 2, 164);
  x.textAlign = 'left'; x.font = "84px 'Black Han Sans', sans-serif";
  x.fillText('2027', 64, H - 74);
  x.textAlign = 'right'; x.font = "600 34px 'IBM Plex Sans KR', sans-serif";
  x.fillText(S.me.nick || '짹짹이', W - 64, H - 118);
  x.font = "500 26px 'IBM Plex Sans KR', sans-serif";
  x.fillText(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} · ${STUDIO_POSES[studio.pose].label}`, W - 64, H - 74);
  return c;
}
function snapStudio() {
  const c = takeStudioPhoto();
  if (!c) return;
  sound.beep(1200, 0.05, 0, 0.12); sound.beep(700, 0.09, 0.06, 0.1);
  const fl = $('#studioFlash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
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
function closeStudioShot() { $('#studioShot').hidden = true; }
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
      else if (/^Digit[1-5]$/.test(e.code)) setStudioPose(+e.code.slice(5) - 1);
      return;
    }
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    studio.keyBuf.push(e.code);
    if (studio.keyBuf.length > STUDIO.code.length) studio.keyBuf.shift();
    if (studio.keyBuf.join() === STUDIO.code.join()) { studio.keyBuf = []; openStudio(); }
  });
  if (FAST) window.__studio = { studio, openStudio, closeStudio, takeStudioPhoto, snapStudio, setStudioPose, saveStudioPhoto }; // 시험용
})();
