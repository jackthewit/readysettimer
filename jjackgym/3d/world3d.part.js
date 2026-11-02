// ONLINE GYM 3D 공간: 넓은 방, 진짜로 비치는 거울, 입구, 안내 데스크, 새 기구.
// 모션 스튜디오 원본(assets.js)은 그대로 두고, 그 부품으로 이 짐 전용 무대를 더한다.
const WORLD = (() => {
  const G = window.GymEngine, T = G.THREE, AS = G.AS;
  const { put, rod, rbox, cyl, sph, colors: C } = AS;
  const plane = (w, h) => new T.PlaneGeometry(w, h);
  const ROOM = { x: 11, back: -9, front: 16 }; // 방 크기: x ±11, 뒤 벽 z=-9, 앞은 열려 있음
  const DOOR = { x: 8, w: 2.6, h: 2.5 };

  function group(id, top, footprint) {
    const g = new T.Group();
    g.name = id;
    g.userData = { id, footprint, top, grips: [], moving: {} };
    return g;
  }

  // ---------------------------------------------------------------- 새 기구
  AS.props.treadmill = {
    label: '러닝머신', category: 'weights', build() {
      const g = group('treadmill', 0.1, [0.9, 2]);
      put(g, rbox(0.9, 0.08, 2, 0.02), C.dark, { p: [0, 0.04, 0], ol: 0.006 });
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 256;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#26272b'; cx.fillRect(0, 0, 64, 256);
      cx.fillStyle = '#3a3c42'; for (let i = 0; i < 8; i++) cx.fillRect(0, i * 32, 64, 8);
      const tex = new T.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.repeat.set(1, 2);
      const belt = new T.Mesh(plane(0.62, 1.8), new T.MeshBasicMaterial({ map: tex }));
      belt.rotation.x = -Math.PI / 2;
      belt.position.set(0, 0.086, 0);
      g.add(belt);
      g.userData.moving.belt = belt;
      for (const s of [-1, 1]) {
        rod(g, [s * 0.38, 0.08, 0.72], [s * 0.34, 1.12, 0.86], 0.03, C.steel, { ol: 0.005 });
        rod(g, [s * 0.34, 0.86, 0.84], [s * 0.34, 0.86, 0.24], 0.02, C.steel, { ol: 0.004 });
      }
      put(g, rbox(0.74, 0.3, 0.1, 0.02), C.dark, { p: [0, 1.18, 0.88], r: [28, 0, 0], ol: 0.006 });
      put(g, rbox(0.5, 0.17, 0.01, 0.004), C.sky, { p: [0, 1.19, 0.83], r: [28, 0, 0], ol: false });
      return g;
    },
  };
  // 천국의 계단: 계단이 계속 내려오고 그 위를 오른다
  const STEP_RISE = 1.05, STEP_RUN = 0.95;
  const placeStep = (s, u) => { s.position.set(0, 0.16 + u * STEP_RISE, -0.45 + u * STEP_RUN); s.visible = u > 0.02 && u < 0.98; };
  AS.props.stairMill = {
    label: '천국의 계단', category: 'weights', build() {
      const g = group('stairMill', 0.6, [1, 1.4]);
      put(g, rbox(1, 0.06, 1.4, 0.01), C.dark, { p: [0, 0.03, 0], ol: 0.005 });
      for (const s of [-1, 1]) {
        put(g, rbox(0.05, 0.14, 1.45, 0.01), C.steel, { p: [s * 0.42, 0.66, 0.02], r: [-48, 0, 0], ol: 0.004 }); // 계단 옆 틀
        rod(g, [s * 0.4, 0.5, -0.1], [s * 0.4, 1.5, 0.05], 0.022, C.steel, { ol: 0.004 });
        rod(g, [s * 0.4, 1.5, 0.05], [s * 0.3, 1.5, 0.5], 0.022, C.steel, { ol: 0.004 });
      }
      rod(g, [-0.3, 1.5, 0.5], [0.3, 1.5, 0.5], 0.022, C.steel, { ol: 0.004 });
      put(g, rbox(0.5, 0.26, 0.06, 0.02), C.dark, { p: [0, 1.62, 0.54], r: [24, 0, 0], ol: 0.005 });
      put(g, rbox(0.36, 0.14, 0.01, 0.004), C.sky, { p: [0, 1.63, 0.505], r: [24, 0, 0], ol: false });
      const steps = [];
      for (let i = 0; i < 7; i++) {
        const s = put(g, rbox(0.74, 0.05, 0.3, 0.008), C.black, { ol: 0.004 });
        placeStep(s, i / 7);
        steps.push(s);
      }
      g.userData.moving.steps = steps;
      return g;
    },
  };
  AS.props.liftPlatform = {
    label: '데드리프트 플랫폼', category: 'weights', build() {
      const g = group('liftPlatform', 0.03, [2.4, 1.6]);
      put(g, rbox(2.4, 0.03, 1.6, 0.005), C.rubber, { p: [0, 0.015, 0], ol: 0.004 });
      put(g, rbox(1.1, 0.008, 1.6, 0.002), C.woodL, { p: [0, 0.033, 0], ol: false });
      return g;
    },
  };

  AS.props.latMachine = {
    label: '랫풀다운', category: 'weights', build() {
      const g = group('latMachine', 0.5, [1.1, 1.5]);
      put(g, rbox(1, 0.05, 1.5, 0.01), C.dark, { p: [0, 0.025, -0.1], ol: 0.004 });
      for (const s of [-1, 1]) rod(g, [s * 0.38, 0.03, -0.72], [s * 0.38, 2.4, -0.72], 0.04, C.dark, { ol: 0.005 });
      put(g, rbox(0.84, 0.08, 1.05, 0.01), C.dark, { p: [0, 2.4, -0.22], ol: 0.005 });
      put(g, cyl(0.07, 0.07, 0.05, 20), C.steel, { p: [0, 2.33, 0.2], r: [0, 0, 90], ol: 0.004 });
      put(g, rbox(0.34, 1.2, 0.2, 0.01), C.steel, { p: [0, 0.75, -0.72], ol: 0.005 }); // 무게 추
      for (let i = 0; i < 7; i++) put(g, rbox(0.36, 0.015, 0.21, 0.002), C.dark, { p: [0, 0.3 + i * 0.16, -0.72], ol: false });
      rod(g, [0, 0.03, 0], [0, 0.42, 0], 0.035, C.steel, { ol: 0.004 });
      put(g, rbox(0.42, 0.08, 0.42, 0.03), C.black, { p: [0, 0.46, 0], ol: 0.005 });
      rod(g, [0, 0.03, 0.42], [0, 0.72, 0.42], 0.03, C.steel, { ol: 0.004 });
      put(g, rbox(0.46, 0.1, 0.12, 0.03), C.black, { p: [0, 0.76, 0.42], ol: 0.005 }); // 무릎 받침
      return g;
    },
  };
  AS.props.rowingMachine = {
    label: '로잉 머신', category: 'weights', build() {
      const g = group('rowingMachine', 0.3, [2.5, 0.6]);
      put(g, rbox(2.2, 0.06, 0.12, 0.01), C.steel, { p: [0, 0.14, 0], ol: 0.005 });
      for (const x of [-1.05, 0.95]) put(g, rbox(0.1, 0.12, 0.5, 0.01), C.dark, { p: [x, 0.06, 0], ol: 0.004 });
      put(g, cyl(0.26, 0.26, 0.1, 28), C.dark, { p: [1.12, 0.34, 0], r: [90, 0, 0], ol: 0.006 }); // 플라이휠
      put(g, cyl(0.1, 0.1, 0.12, 18), C.orange, { p: [1.12, 0.34, 0], r: [90, 0, 0], ol: false });
      put(g, rbox(0.1, 0.22, 0.42, 0.02), C.black, { p: [0.72, 0.28, 0], r: [0, 0, 18], ol: 0.004 }); // 발판
      const seat = put(g, rbox(0.34, 0.07, 0.3, 0.025), C.black, { p: [-0.1, 0.22, 0], ol: 0.005 });
      g.userData.moving.seat = seat;
      return g;
    },
  };
  AS.props.spinBike = {
    label: '실내 자전거', category: 'weights', build() {
      const g = group('spinBike', 0.88, [0.5, 1.2]);
      for (const z of [-0.5, 0.5]) put(g, rbox(0.5, 0.05, 0.08, 0.015), C.dark, { p: [0, 0.03, z], ol: 0.004 });
      rod(g, [0, 0.05, -0.5], [0, 0.05, 0.5], 0.03, C.dark, { ol: 0.004 });
      rod(g, [0, 0.05, -0.15], [0, 0.82, -0.08], 0.03, C.steel, { ol: 0.005 });
      rod(g, [0, 0.05, 0.5], [0, 1.1, 0.42], 0.03, C.steel, { ol: 0.005 });
      put(g, cyl(0.24, 0.24, 0.05, 28), C.steel, { p: [0, 0.34, 0.48], r: [0, 0, 90], ol: 0.006 }); // 바퀴
      put(g, rbox(0.2, 0.06, 0.3, 0.025), C.black, { p: [0, 0.85, -0.08], ol: 0.005 });     // 안장
      put(g, rbox(0.46, 0.04, 0.08, 0.015), C.black, { p: [0, 1.12, 0.46], ol: 0.004 });    // 손잡이
      put(g, rbox(0.1, 0.04, 0.24, 0.01), C.dark, { p: [0.16, 0.3, 0.1], ol: 0.003 });      // 페달
      put(g, rbox(0.1, 0.04, 0.24, 0.01), C.dark, { p: [-0.16, 0.3, 0.1], ol: 0.003 });
      return g;
    },
  };
  AS.props.legExtension = {
    label: '레그 익스텐션', category: 'weights', build() {
      const g = group('legExtension', 0.56, [0.8, 1.2]);
      put(g, rbox(0.7, 0.05, 1.2, 0.01), C.dark, { p: [0, 0.025, 0], ol: 0.004 });
      rod(g, [0, 0.03, -0.05], [0, 0.48, -0.05], 0.04, C.steel, { ol: 0.004 });
      put(g, rbox(0.42, 0.08, 0.46, 0.03), C.black, { p: [0, 0.52, 0], ol: 0.005 });
      put(g, rbox(0.42, 0.62, 0.08, 0.03), C.black, { p: [0, 0.86, -0.27], r: [-8, 0, 0], ol: 0.005 });
      for (const s of [-1, 1]) put(g, rbox(0.04, 0.04, 0.3, 0.01), C.steel, { p: [s * 0.27, 0.56, -0.02], ol: 0.003 }); // 손잡이
      const lever = new T.Group();
      lever.position.set(0, 0.52, 0.3);
      g.add(lever);
      rod(lever, [0, 0, 0], [0, -0.32, 0.12], 0.018, C.steel, { ol: 0.004 });
      put(lever, cyl(0.04, 0.04, 0.3, 14), C.black, { p: [0, -0.34, 0.13], r: [0, 0, 90], ol: 0.004 }); // 발목 패드
      g.userData.moving.pedal = lever;
      return g;
    },
  };

  // ---------------------------------------------------------------- 글씨 판
  function sign(parent, lines, o) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round(1024 * o.h / o.w);
    const tex = new T.CanvasTexture(c);
    const draw = () => {
      const x = c.getContext('2d');
      x.fillStyle = o.bg; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = o.fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      lines.forEach(([t, size], i) => {
        x.font = `${size}px 'Black Han Sans', 'IBM Plex Sans KR', sans-serif`;
        x.fillText(t, c.width / 2, c.height * (i + 0.5) / lines.length);
      });
      tex.needsUpdate = true;
    };
    draw();
    // 구글 글꼴은 글자 묶음별로 내려오므로, 쓰는 글자를 알려 줘야 한글이 다른 글꼴로 안 나온다
    try { document.fonts.load("64px 'Black Han Sans'", lines.map((l) => l[0]).join('')).then(draw).catch(() => {}); } catch { /* 기본 글꼴로 */ }
    const m = new T.Mesh(plane(o.w, o.h), new T.MeshBasicMaterial({ map: tex }));
    m.position.set(...o.p);
    if (o.ry) m.rotation.y = o.ry * Math.PI / 180;
    parent.add(m);
    return m;
  }

  // ---------------------------------------------------------------- 방
  function room(g, o) {
    const fl = put(g, plane(ROOM.x * 2, ROOM.front - ROOM.back), o.floor, { r: [-90, 0, 0], p: [0, 0, (ROOM.front + ROOM.back) / 2], ol: false });
    fl.userData.floor = true;
    const H = 8;
    put(g, plane(ROOM.x * 2, H), o.wall, { p: [0, H / 2, ROOM.back], ol: false }).userData.floor = true;
    for (const s of [-1, 1]) {
      put(g, plane(ROOM.front - ROOM.back, H), o.side, { p: [s * ROOM.x, H / 2, (ROOM.front + ROOM.back) / 2], r: [0, -s * 90, 0], ol: false }).userData.floor = true;
    }
    put(g, plane(ROOM.x * 2, 0.45), o.band, { flat: true, ol: false, p: [0, 3.05, ROOM.back + 0.005] });
  }
  /** 뒤 벽 거울: Reflector가 장면을 한 번 더 그려서 실제로 비친다. 느린 기기는 mirrorOff()로 끔 */
  let reflector = null;
  function mirror(g, cx, w, h) {
    const y = 0.15 + h / 2, z = ROOM.back + 0.02;
    put(g, plane(w, h), 0xC9DCE6, { flat: true, ol: false, p: [cx, y, z - 0.005] }); // 끈 뒤의 평범한 거울 색
    const view = document.querySelector('#view');
    const narrow = view.clientWidth < 700;
    const tw = Math.min(narrow ? 720 : 1400, Math.max(360, view.clientWidth || 1000));
    const th = Math.min(narrow ? 720 : 900, Math.max(360, view.clientHeight || 600));
    if (reflector) reflector.getRenderTarget().dispose();
    reflector = new T.Reflector(plane(w, h), { textureWidth: tw, textureHeight: th, clipBias: 0.003, color: 0x7F7F7F });
    reflector.position.set(cx, y, z);
    g.add(reflector);
    for (const yy of [y - h / 2, y + h / 2]) put(g, rbox(w + 0.08, 0.06, 0.05, 0.01), C.alu, { p: [cx, yy, z + 0.02], ol: 0.003 });
    for (const s of [-1, 1]) put(g, rbox(0.06, h, 0.05, 0.01), C.alu, { p: [cx + s * w / 2, y, z + 0.02], ol: 0.003 });
    const n = Math.round(w / 2.4);
    for (let i = 1; i < n; i++) put(g, rbox(0.02, h, 0.02, 0.004), C.alu, { p: [cx - w / 2 + i * w / n, y, z + 0.012], ol: false });
  }
  function windowOnSide(g, s, z, frame, glass) {
    const f = new T.Group();
    f.position.set(s * (ROOM.x - 0.01), 1.75, z);
    f.rotation.y = -s * 90 * Math.PI / 180;
    g.add(f);
    put(f, plane(2.4, 1.9), glass, { flat: true, ol: false });
    put(f, plane(0.7, 1.7), 0xF2FAFD, { flat: true, ol: false, p: [-0.5, 0, 0.004], r: [0, 0, 12] });
    for (const t of [-1, 1]) {
      put(f, rbox(2.46, 0.06, 0.06, 0.01), frame, { p: [0, t * 0.95, 0.02], ol: 0.004 });
      put(f, rbox(0.06, 1.9, 0.06, 0.01), frame, { p: [t * 1.2, 0, 0.02], ol: 0.004 });
    }
    put(f, rbox(0.04, 1.9, 0.05, 0.01), frame, { p: [0, 0, 0.02], ol: 0.003 });
  }

  // ---------------------------------------------------------------- 입구
  let doorL = null, doorR = null, doorAmt = 0, doorOpenUntil = 0;
  function entrance(g, o) {
    const z = ROOM.back + 0.02, { x, w, h } = DOOR;
    put(g, plane(w, h), 0xDCEEF6, { flat: true, ol: false, p: [x, h / 2, z - 0.006] }); // 문 너머 바깥
    put(g, plane(w, 0.5), 0xBFD8C0, { flat: true, ol: false, p: [x, 0.25, z - 0.004] });
    for (const s of [-1, 1]) put(g, rbox(0.1, h + 0.1, 0.12, 0.01), o.frame, { p: [x + s * (w / 2 + 0.05), h / 2, z + 0.04], ol: 0.005 });
    put(g, rbox(w + 0.2, 0.12, 0.12, 0.01), o.frame, { p: [x, h + 0.06, z + 0.04], ol: 0.005 });
    const leaf = (sx) => {
      const d = new T.Group();
      d.position.set(x + sx * w / 4, 0, z + 0.03);
      g.add(d);
      put(d, plane(w / 2 - 0.02, h - 0.04), 0xB9DFEF, { flat: true, ol: false, mo: { transparent: true, opacity: 0.55 }, p: [0, h / 2, 0] });
      put(d, rbox(0.03, 0.42, 0.04, 0.01), C.steel, { p: [-sx * (w / 4 - 0.12), 1.15, 0.03], ol: 0.003 });
      for (const t of [0, 1]) put(d, rbox(w / 2, 0.04, 0.03, 0.005), o.frame, { p: [0, t * (h - 0.04) + 0.02, 0.005], ol: 0.003 });
      return d;
    };
    doorL = leaf(-1);
    doorR = leaf(1);
    sign(g, [[o.title, 92]], { w: 3.6, h: 0.55, bg: o.signBg, fg: o.signFg, p: [x, h + 0.42, z + 0.03] });
    put(g, rbox(w + 0.6, 0.015, 1.5, 0.004), o.mat, { p: [x, 0.008, z + 0.85], ol: false }); // 발 매트
    sign(g, [['어서 오세요', 96]], { w: 1.8, h: 0.34, bg: '#3A3C40', fg: '#F5D33F', p: [x, 0.018, z + 0.85] }).rotation.x = -Math.PI / 2;
  }
  function openDoor(ms = 2600) { doorOpenUntil = Date.now() + ms; }
  G.hooks.push((dt) => {
    if (!doorL || !doorL.parent) return;
    const want = Date.now() < doorOpenUntil ? 1 : 0;
    doorAmt += (want - doorAmt) * Math.min(1, dt * 5);
    doorL.position.x = DOOR.x - DOOR.w / 4 - doorAmt * (DOOR.w / 2 - 0.1);
    doorR.position.x = DOOR.x + DOOR.w / 4 + doorAmt * (DOOR.w / 2 - 0.1);
  });

  // ---------------------------------------------------------------- 안내 데스크 · 라커 · 정수기
  function counter(g, o) {
    const c = new T.Group();
    c.position.set(o.x, 0, o.z);
    c.name = 'counter';
    g.add(c);
    put(c, rbox(3, 1.02, 0.62, 0.03), o.body, { p: [0, 0.51, 0], ol: 0.008 });
    put(c, rbox(3.16, 0.06, 0.8, 0.02), o.top, { p: [0, 1.05, 0], ol: 0.006 });
    put(c, rbox(3, 0.1, 0.5, 0.01), C.dark, { p: [0, 0.05, 0.08], ol: false });
    sign(c, [['안내 데스크', 110]], { w: 1.7, h: 0.36, bg: o.signBg, fg: o.signFg, p: [0, 0.62, 0.315] });
    put(c, rbox(0.46, 0.3, 0.03, 0.01), C.black, { p: [-1, 1.3, -0.1], r: [-8, 18, 0], ol: 0.005 }); // 화면
    rod(c, [-1, 1.08, -0.1], [-1, 1.2, -0.1], 0.025, C.dark, { ol: false });
    put(c, cyl(0.05, 0.08, 0.08, 16), C.yellow, { p: [0.2, 1.12, 0.14], ol: 0.004 });  // 호출 벨
    put(c, sph(0.018, 10), C.dark, { p: [0.2, 1.17, 0.14], ol: false });
    [0, 1, 2].forEach((i) => put(c, rbox(0.38, 0.08, 0.26, 0.03), o.towel, { p: [1.05, 1.12 + i * 0.08, 0], ol: 0.003 })); // 수건
    return c;
  }
  function lockers(g, x, z, n, col) {
    for (let i = 0; i < n; i++) {
      const l = new T.Group();
      l.position.set(x, 0, z + i * 0.62);
      l.rotation.y = -Math.PI / 2;
      g.add(l);
      put(l, rbox(0.58, 1.9, 0.5, 0.01), col, { p: [0, 0.95, 0], ol: 0.006 });
      for (const y of [0.5, 1.4]) {
        put(l, rbox(0.5, 0.82, 0.01, 0.004), col, { p: [0, y, 0.255], ol: 0.003 });
        put(l, sph(0.02, 8), C.steel, { p: [0.18, y, 0.27], ol: false });
      }
    }
  }
  function waterCooler(g, x, z) {
    const w = new T.Group();
    w.position.set(x, 0, z);
    g.add(w);
    put(w, rbox(0.36, 0.95, 0.36, 0.02), C.white, { p: [0, 0.475, 0], ol: 0.006 });
    put(w, cyl(0.15, 0.15, 0.42, 18), 0xBFE3F2, { p: [0, 1.17, 0], ol: 0.005 });
    put(w, rbox(0.2, 0.1, 0.03, 0.01), C.steel, { p: [0, 0.72, 0.18], ol: 0.003 });
  }
  function plant(g, x, z, s, pot) {
    const p = new T.Group();
    p.position.set(x, 0, z);
    p.scale.setScalar(s);
    g.add(p);
    put(p, cyl(0.2, 0.15, 0.36, 18), pot, { p: [0, 0.18, 0], ol: 0.006 });
    [[0, 0.68, 0, 0.22], [0.14, 0.56, 0.06, 0.17], [-0.14, 0.6, -0.05, 0.18], [0.04, 0.88, -0.05, 0.14], [-0.06, 0.8, 0.09, 0.13]]
      .forEach(([a, b, c, r]) => put(p, sph(r, 14), 0x6DAE5C, { p: [a, b, c], s: [1, 1.15, 1], ol: 0.006 }));
  }
  // ---------------------------------------------------------------- 웨이트샵
  AS.sets.gymWide = {
    label: '웨이트샵 (넓은 방)', build() {
      const g = new T.Group();
      g.name = 'set-gymWide';
      room(g, { floor: 0x3E4248, wall: 0xE9E6E1, side: 0xDCD8D2, band: C.orange });
      put(g, plane(ROOM.x * 2, 0.1), C.yellow, { flat: true, ol: false, p: [0, 2.78, ROOM.back + 0.005] });
      // 고무 바닥 줄눈
      for (let i = -11; i <= 11; i++) put(g, plane(0.02, ROOM.front - ROOM.back), 0x33373C, { flat: true, ol: false, r: [-90, 0, 0], p: [i, 0.002, (ROOM.front + ROOM.back) / 2] });
      for (let j = ROOM.back + 1; j <= ROOM.front; j++) put(g, plane(ROOM.x * 2, 0.02), 0x33373C, { flat: true, ol: false, r: [-90, 0, 0], p: [0, 0.002, j] });
      // 입구 쪽 밝은 바닥 (로비)
      put(g, plane(ROOM.x - 3.4, 5), 0xCFCAC0, { r: [-90, 0, 0], p: [(ROOM.x + 3.4) / 2, 0.004, ROOM.back + 2.5], ol: false });
      mirror(g, -3.6, 13.8, 2.45);
      entrance(g, { frame: C.dark, title: 'ONLINE GYM 웨이트', signBg: '#26272B', signFg: '#F5D33F', mat: C.dark });
      counter(g, { x: 5, z: -6.9, body: C.dark, top: C.orange, signBg: '#3A3C40', signFg: '#FFFFFF', towel: C.white });
      lockers(g, ROOM.x - 0.3, -6.6, 6, 0x5D7382);
      waterCooler(g, 10.4, -2.1);
      plant(g, 10.3, -8.3, 1.2, C.coral);
      plant(g, 5.9, -8.4, 1, C.cream);
      for (const z of [-5.6, -0.8, 4]) windowOnSide(g, -1, z, C.white, 0xCFE9F5);
      g.userData = { id: 'gymWide', floorY: 0, stage: { cx: 0, cz: 0, w: 18, d: 12 }, sky: '#2B2E33', cam: { pos: [0, 6, 11], target: [0, 0.8, -2] } };
      return g;
    },
  };

  // ---------------------------------------------------------------- 필라테스샵
  AS.sets.pilatesWide = {
    label: '필라테스샵 (넓은 방)', build() {
      const g = new T.Group();
      g.name = 'set-pilatesWide';
      room(g, { floor: 0xE6CFA8, wall: 0xF8F5EF, side: 0xF1ECE3, band: C.sage });
      for (let i = -39; i <= 39; i++) put(g, plane(0.012, ROOM.front - ROOM.back), 0xD8BE94, { flat: true, ol: false, r: [-90, 0, 0], p: [i * 0.28, 0.002, (ROOM.front + ROOM.back) / 2] });
      put(g, plane(ROOM.x - 3.4, 5), 0xF1E7D6, { r: [-90, 0, 0], p: [(ROOM.x + 3.4) / 2, 0.004, ROOM.back + 2.5], ol: false });
      mirror(g, -3.6, 13.8, 2.45);
      entrance(g, { frame: 0xFFFFFF, title: 'ONLINE GYM 필라테스', signBg: '#9CC3A8', signFg: '#2B2B2B', mat: 0x8DA893 });
      counter(g, { x: 5, z: -6.9, body: C.woodL, top: C.cream, signBg: '#9CC3A8', signFg: '#2B2B2B', towel: C.sky });
      lockers(g, ROOM.x - 0.3, -6.6, 5, 0xE7DCC8);
      waterCooler(g, 10.4, -2.6);
      plant(g, 10.3, -8.3, 1.2, C.cream);
      plant(g, 5.9, -8.4, 1, C.coral);
      for (const z of [-5.6, -0.8, 4]) windowOnSide(g, -1, z, 0xFFFFFF, 0xDCEFE6);
      for (const x of [-7, -2, 3]) {
        rod(g, [x, 4, -3.6], [x, 2.9, -3.6], 0.008, C.ink, { ol: false });
        put(g, cyl(0.04, 0.3, 0.22, 20), C.cream, { p: [x, 2.82, -3.6], ol: 0.006 });
      }
      g.userData = { id: 'pilatesWide', floorY: 0, stage: { cx: 0, cz: 0, w: 18, d: 12 }, sky: '#F3EEE6', cam: { pos: [0, 6, 11], target: [0, 0.8, -2] } };
      return g;
    },
  };

  return {
    ROOM, DOOR, openDoor, placeStep,
    bounds: { x0: -10.4, x1: 10.2, z0: -8.3, z1: 5.4 },
    doorSpot: { x: DOOR.x, z: ROOM.back + 0.5 },
    doorBox: new T.Box3(new T.Vector3(DOOR.x - DOOR.w / 2, 0, ROOM.back - 0.2), new T.Vector3(DOOR.x + DOOR.w / 2, DOOR.h, ROOM.back + 0.3)),
    deskBox: new T.Box3(new T.Vector3(3.3, 0, -7.4), new T.Vector3(6.7, 1.5, -6.4)),
    /** 줄 달린 손잡이: 줄은 고정점에서 손까지 */
    makeBar(width, from) {
      const group = new T.Group();
      put(group, cyl(0.016, 0.016, width, 12), C.steel, { r: [0, 0, 90], ol: 0.004 });
      const cable = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 1, 8), new T.MeshBasicMaterial({ color: 0x26272B }));
      return { group, cable, from };
    },
    placeBar(b, at, ry) {
      b.group.position.copy(at);
      b.group.rotation.y = ry * Math.PI / 180;
      const d = b.from.distanceTo(at);
      b.cable.position.copy(b.from).add(at).multiplyScalar(0.5);
      b.cable.scale.y = d;
      b.cable.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), at.clone().sub(b.from).normalize());
    },
    /** 손에 드는 원판 */
    makePlate() {
      const p = new T.Group();
      put(p, cyl(0.2, 0.2, 0.04, 28), C.plateR, { r: [90, 0, 0], ol: 0.006 });
      put(p, cyl(0.05, 0.05, 0.05, 16), C.dark, { r: [90, 0, 0], ol: false });
      return p;
    },
    mirrorOff() { if (reflector) reflector.visible = false; },
    mirrorOn: () => !!(reflector && reflector.visible),
  };
})();
