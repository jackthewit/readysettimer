// 짐에 놓인 기구마다 동작이 있도록 새로 만든 동작들. 규칙은 presets1.js 머리말과 같다.
// (X- = 앞으로 굽힘, 정강이 X+ = 무릎 굽힘, 왼쪽 Z+ = 바깥으로 벌림, g: seat = 엉덩이가 받침면, back = 등이 받침면)
(() => {
  const G = window.GymEngine, list = G.PRS.list;
  const J = (...xs) => Object.assign({}, ...xs);
  const REST = G.PRS.REST;
  const OPEN = { fingersL: [0, 0, 0], fingersR: [0, 0, 0], pointL: [0, 0, 0], pointR: [0, 0, 0] };
  const GRIP = { fingersL: [-80, 0, 0], fingersR: [-80, 0, 0], pointL: [-80, 0, 0], pointR: [-80, 0, 0], thumbL: [-50, 0, 0], thumbR: [-50, 0, 0] };
  const SUP = { hips: [-90, 0, 0] };
  const add = (p) => list.push(p);
  const both = (name, x, y, z) => ({ [`${name}L`]: [x, y, z], [`${name}R`]: [x, -y, -z] });

  // ---- 철봉: 풀업. 어깨부터 끌어내리며 턱을 봉까지
  const HANG = { g: 'feet', pl: [0, 0] };
  const hang = J(REST, GRIP, both('upperArm', 0, 0, 158), both('forearm', 0, 0, 0), both('thigh', -8, 0, 3), both('shin', 18, 0, 0), both('foot', 25, 0, 0));
  const pulled = J(REST, GRIP, both('upperArm', 0, 0, 96), { forearmL: [0, 0, 118], forearmR: [0, 0, -118] }, both('thigh', -10, 0, 3), both('shin', 24, 0, 0), both('foot', 25, 0, 0), { head: [-8, 0, 0] });
  add({ id: 'pullUp', cat: 'weights', name: '풀업', note: '철봉 잡고 몸 끌어올리기', dur: 2.8, keys: [
    [0, hang, HANG], [1.2, pulled, J(HANG, { r: [0, 0.24, 0] })], [1.5, pulled, J(HANG, { r: [0, 0.24, 0] })], [2.8, hang, HANG]] });

  // ---- 인클라인 벤치: 덤벨 프레스. 등받이에 기대어 가슴 위로
  const SEAT = { g: 'seat', pl: [0, 0] };
  const recl = { hips: [-52, 0, 0], neck: [24, 0, 0], head: [10, 0, 0], thighL: [-38, 0, 8], thighR: [-38, 0, -8], shinL: [86, 0, 0], shinR: [86, 0, 0], footL: [-4, 0, 0], footR: [-4, 0, 0] };
  add({ id: 'inclinePress', cat: 'weights', name: '인클라인 덤벨 프레스', note: '비스듬히 기대어 덤벨 밀기', dur: 2.6, equip: 'db2', keys: [
    [0, J(REST, GRIP, recl, both('upperArm', -86, 0, 12), both('forearm', 0, 0, 0)), SEAT],
    [1.1, J(REST, GRIP, recl, both('upperArm', 22, 0, 70), { forearmL: [0, 0, 100], forearmR: [0, 0, -100] }), SEAT],
    [1.4, J(REST, GRIP, recl, both('upperArm', 22, 0, 70), { forearmL: [0, 0, 100], forearmR: [0, 0, -100] }), SEAT],
    [2.6, J(REST, GRIP, recl, both('upperArm', -86, 0, 12), both('forearm', 0, 0, 0)), SEAT]] });

  // ---- 원판: 프런트 레이즈 · 스쿼트 (손 사이의 원판은 앱이 따라 붙임)
  const held = (a) => J(REST, OPEN, both('upperArm', a, 0, -10), both('forearm', -4, 0, 0));
  add({ id: 'plateRaise', cat: 'weights', name: '원판 프런트 레이즈', note: '원판 들고 앞으로 올리기', dur: 2.4, keys: [
    [0, held(-14)], [1, held(-84)], [1.3, held(-84)], [2.4, held(-14)]] });
  const hug = J(both('upperArm', -30, 0, -14), both('forearm', -96, 0, 0));
  const stand = J(REST, OPEN, hug, { head: [-3, 0, 0] });
  const squat = J(REST, OPEN, hug, { hips: [28, 0, 0], neck: [-14, 0, 0], head: [-8, 0, 0] }, both('thigh', -88, 0, 8), both('shin', 92, 0, 0));
  const SQ = { r: [0, -0.34, -0.14], st: [[0.12, 0], [-0.12, 0]] }, ST = { st: [[0.12, 0], [-0.12, 0]] };
  add({ id: 'plateSquat', cat: 'weights', name: '원판 스쿼트', note: '원판 가슴에 안고 앉기', dur: 3, keys: [
    [0, stand, ST], [1.3, squat, SQ], [1.6, squat, SQ], [3, stand, ST]] });

  // ---- 캐딜락: 레그 스프링. 누워서 다리를 내렸다 올림
  const BACK = { g: 'back', pl: [0, 0] };
  const sideArms = J(OPEN, both('upperArm', 0, 0, 12), both('forearm', 0, 0, 0));
  const legsAt = (a) => J(SUP, sideArms, { thighL: [a, 0, 4], thighR: [a, 0, -4] }, both('shin', 4, 0, 0), both('foot', 25, 0, 0));
  add({ id: 'cadLegSpring', cat: 'pilates', name: '캐딜락 레그 스프링', note: '누워서 다리 천천히 내리기', dur: 3.6, yaw: 90, need: 'mat', g: 'back', keys: [
    [0, legsAt(-82), BACK], [1.6, legsAt(-46), BACK], [2, legsAt(-46), BACK], [3.6, legsAt(-82), BACK]] });

  // ---- 운다 체어: 앉아서 페달 누르기
  const chairArms = J(OPEN, both('upperArm', -6, 0, 20), both('forearm', -28, 0, 0));
  const wundaUp = J(REST, chairArms, both('thigh', -80, 0, 5), both('shin', 96, 0, 0), both('foot', 6, 0, 0));
  const wundaDn = J(REST, chairArms, both('thigh', -60, 0, 5), both('shin', 78, 0, 0), both('foot', 30, 0, 0));
  add({ id: 'wundaFootwork', cat: 'pilates', name: '운다 체어 풋워크', note: '앉아서 발로 페달 누르기', dur: 3, keys: [
    [0, wundaUp, SEAT], [1.2, wundaDn, SEAT], [1.6, wundaDn, SEAT], [3, wundaUp, SEAT]] });

  // ---- 래더 바렐: 숏 박스 라운드 백. 앉아서 등을 둥글게 말며 뒤로
  const reach = J(OPEN, both('upperArm', -78, 0, 6), both('forearm', 0, 0, 0));
  const boxUp = J(REST, reach, both('thigh', -76, 0, 5), both('shin', 66, 0, 0));
  const boxBack = J(REST, reach, { hips: [-30, 0, 0], spine: [12, 0, 0], chest: [12, 0, 0], neck: [12, 0, 0], head: [8, 0, 0] }, both('thigh', -46, 0, 5), both('shin', 66, 0, 0));
  add({ id: 'barrelRoundBack', cat: 'pilates', name: '숏 박스 라운드 백', note: '앉아서 등 말며 뒤로 기대기', dur: 3.4, keys: [
    [0, boxUp, SEAT], [1.5, boxBack, SEAT], [1.9, boxBack, SEAT], [3.4, boxUp, SEAT]] });

  // ---- 짐볼: 앉아서 하는 코어 운동 3가지 (발은 바닥에)
  const FS = [[0.1, 0.5], [-0.1, 0.5]];
  const onBall = J(both('thigh', -86, 0, 6), both('shin', 88, 0, 0));
  const BALL = { g: 'seat', st: FS, pl: [1, 1] };
  const marchArms = J(OPEN, both('upperArm', -6, 0, 26), both('forearm', -22, 0, 0));
  const kneeUpL = J(REST, marchArms, onBall, { thighL: [-112, 0, 6], shinL: [96, 0, 0] }), kneeUpR = J(REST, marchArms, onBall, { thighR: [-112, 0, -6], shinR: [96, 0, 0] });
  const ballBase = J(REST, marchArms, onBall);
  add({ id: 'ballMarch', cat: 'pilates', name: '짐볼 시티드 마치', note: '볼에 앉아 무릎 번갈아 들기', dur: 3, keys: [
    [0, ballBase, BALL], [0.7, kneeUpL, { g: 'seat', st: FS, pl: [0, 1] }], [1.5, ballBase, BALL], [2.2, kneeUpR, { g: 'seat', st: FS, pl: [1, 0] }], [3, ballBase, BALL]] });
  const fwdArms = J(OPEN, both('upperArm', -78, 0, 8), both('forearm', 0, 0, 0));
  const twist = (y) => J(REST, fwdArms, onBall, { spine: [0, y, 0], chest: [0, y, 0], neck: [0, y * 0.6, 0] });
  add({ id: 'ballTwist', cat: 'pilates', name: '짐볼 시티드 트위스트', note: '볼에 앉아 상체 돌리기', dur: 3.2, keys: [
    [0, twist(0), BALL], [0.8, twist(24), BALL], [1.6, twist(0), BALL], [2.4, twist(-24), BALL], [3.2, twist(0), BALL]] });
  const bend = (z) => J(REST, OPEN, onBall, { spine: [0, 0, z], chest: [0, 0, z * 0.7] },
    z > 0 ? { upperArmL: [0, 0, 160], forearmL: [0, 0, 8], upperArmR: [0, 0, -12] } : z < 0 ? { upperArmR: [0, 0, -160], forearmR: [0, 0, -8], upperArmL: [0, 0, 12] } : both('upperArm', 0, 0, 12));
  add({ id: 'ballSideBend', cat: 'pilates', name: '짐볼 사이드 벤드', note: '볼에 앉아 옆구리 늘리기', dur: 3.6, keys: [
    [0, bend(0), BALL], [0.9, bend(16), BALL], [1.8, bend(0), BALL], [2.7, bend(-16), BALL], [3.6, bend(0), BALL]] });

  // ---- 폼롤러: 척추 따라 길게 눕기
  const ROLL = { g: 'back', pl: [1, 1] };
  const kneesBent = J(both('thigh', -56, 0, 6), both('shin', 106, 0, 0), both('foot', -30, 0, 0));
  const openArms = (z, f) => J(SUP, OPEN, kneesBent, both('upperArm', f, 0, z), both('forearm', 0, 0, 0));
  add({ id: 'rollerChestOpen', cat: 'pilates', name: '폼롤러 가슴 열기', note: '롤러에 누워 팔 벌리기', dur: 4, yaw: 90, need: 'mat', g: 'back', keys: [
    [0, openArms(8, -82), ROLL], [1.7, openArms(82, -10), ROLL], [2.3, openArms(82, -10), ROLL], [4, openArms(8, -82), ROLL]] });
  const table = (ext) => J(SUP, OPEN, both('forearm', 0, 0, 0), both('thigh', -88, 0, 4), both('shin', 88, 0, 0), both('upperArm', -86, 0, 6), ext);
  const NOPL = { g: 'back', pl: [0, 0] };
  add({ id: 'rollerDeadBug', cat: 'pilates', name: '폼롤러 데드버그', note: '롤러 위에서 팔다리 번갈아 뻗기', dur: 4, yaw: 90, need: 'mat', g: 'back', keys: [
    [0, table({}), NOPL],
    [1, table({ upperArmR: [-160, 0, -6], thighL: [-42, 0, 4], shinL: [22, 0, 0] }), NOPL],
    [2, table({}), NOPL],
    [3, table({ upperArmL: [-160, 0, 6], thighR: [-42, 0, -4], shinR: [22, 0, 0] }), NOPL],
    [4, table({}), NOPL]] });

  // ---- 랫풀다운: 앉아서 바를 가슴 위쪽으로
  const latLegs = J(both('thigh', -86, 0, 6), both('shin', 86, 0, 0));
  const latUp = J(REST, GRIP, latLegs, both('upperArm', 0, 0, 150), both('forearm', 0, 0, 0));
  const latDn = J(REST, GRIP, latLegs, { hips: [-8, 0, 0], neck: [6, 0, 0] }, { upperArmL: [-16, 0, 58], upperArmR: [-16, 0, -58], forearmL: [0, 0, 112], forearmR: [0, 0, -112] });
  add({ id: 'latPulldown', cat: 'weights', name: '랫풀다운', note: '앉아서 바를 가슴 쪽으로 당기기', dur: 2.8, keys: [
    [0, latUp, SEAT], [1.2, latDn, SEAT], [1.5, latDn, SEAT], [2.8, latUp, SEAT]] });

  // ---- 로잉 머신: 다리 → 등 → 팔 순서로 당기기
  const catchPose = J(REST, GRIP, { hips: [18, 0, 0], neck: [-12, 0, 0] }, both('thigh', -146, 0, 7), both('shin', 92, 0, 0), both('foot', -12, 0, 0), both('upperArm', -108, 0, 6), both('forearm', 0, 0, 0));
  const drive = J(REST, GRIP, { hips: [-14, 0, 0], neck: [8, 0, 0] }, both('thigh', -76, 0, 5), both('shin', 10, 0, 0), both('foot', -8, 0, 0), both('upperArm', 2, 0, 14), both('forearm', -96, 0, 0));
  add({ id: 'rowerRow', cat: 'weights', name: '로잉', note: '다리로 밀고 등으로 당기기', dur: 2.6, keys: [
    [0, catchPose, SEAT], [1, drive, SEAT], [1.3, drive, SEAT], [2.6, catchPose, SEAT]] });

  // ---- 실내 자전거: 양다리가 반대로 도는 페달링
  const bikeArms = J(GRIP, both('upperArm', -72, 0, 6), both('forearm', -10, 0, 0));
  const pedal = (a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return J(REST, bikeArms, { hips: [22, 0, 0], neck: [-14, 0, 0] },
      { thighL: [-82 - 20 * c, 0, 3], shinL: [86 + 16 * s, 0, 0], thighR: [-82 + 20 * c, 0, -3], shinR: [86 - 16 * s, 0, 0] });
  };
  add({ id: 'bikePedal', cat: 'weights', name: '자전거 타기', note: '앉아서 페달 돌리기', dur: 1.6, keys: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [i * 0.2, pedal(i * Math.PI / 4), SEAT]) });

  // ---- 레그 익스텐션: 앉아서 무릎 펴기
  const extArms = J(GRIP, both('upperArm', 8, 0, 20), both('forearm', -36, 0, 0));
  const extDown = J(REST, extArms, { hips: [-8, 0, 0] }, both('thigh', -80, 0, 4), both('shin', 90, 0, 0), both('foot', -8, 0, 0));
  const extUp = J(REST, extArms, { hips: [-8, 0, 0] }, both('thigh', -80, 0, 4), both('shin', 12, 0, 0), both('foot', -8, 0, 0));
  add({ id: 'legExtensionMove', cat: 'weights', name: '레그 익스텐션', note: '앉아서 무릎 펴기', dur: 2.6, keys: [
    [0, extDown, SEAT], [1.1, extUp, SEAT], [1.4, extUp, SEAT], [2.6, extDown, SEAT]] });

  // ---- 천국의 계단: 번갈아 무릎 들며 오르기
  const STAIR = { g: 'feet', pl: [0, 0] };
  const stairArms = J(GRIP, both('upperArm', -34, 0, 10), both('forearm', -34, 0, 0));
  const stepL = J(REST, stairArms, { hips: [8, 0, 0], neck: [-6, 0, 0], thighL: [-62, 0, 3], shinL: [78, 0, 0], footL: [-6, 0, 0], thighR: [-6, 0, -3], shinR: [12, 0, 0], footR: [8, 0, 0] });
  const stepR = J(REST, stairArms, { hips: [8, 0, 0], neck: [-6, 0, 0], thighR: [-62, 0, -3], shinR: [78, 0, 0], footR: [-6, 0, 0], thighL: [-6, 0, 3], shinL: [12, 0, 0], footL: [8, 0, 0] });
  add({ id: 'stairClimb', cat: 'weights', name: '계단 오르기', note: '천국의 계단 오르기', dur: 1.2, keys: [
    [0, stepL, STAIR], [0.6, stepR, STAIR], [1.2, stepL, STAIR]] });
})();
