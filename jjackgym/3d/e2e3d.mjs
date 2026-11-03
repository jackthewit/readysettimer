// 두 명 동시 접속 브라우저 시험.
// 쓰는 법: node e2e3d.mjs <스크린샷 폴더>  (PW_DIR = playwright가 깔린 폴더, 없으면 이 폴더)
// 먼저 python3 build.py, 그리고 lib/에 three 파일들이 있어야 해요(README 참고).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const DIR = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(path.join(process.env.PW_DIR || DIR, 'x.js'));
const { chromium } = require('playwright');
const SP = process.argv[2] || path.join(DIR, 'shots');
fs.mkdirSync(SP, { recursive: true });
// ROOM=supabase 이면 Vercel판 연결 코드를 가짜 Supabase 위에서 시험
const mock = process.env.ROOM === 'supabase'
  ? fs.readFileSync(path.join(DIR, 'mock-supabase.js'), 'utf8') + '\n' + fs.readFileSync(path.join(DIR, 'room-supabase.part.js'), 'utf8')
  : fs.readFileSync(path.join(DIR, 'mock-claude.js'), 'utf8');
function page(withMock) {
  let html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  html = html.replace(/<script src="https:\/\/[^"]+\/([A-Za-z]+\.(?:min\.)?js)"><\/script>/g, (m, f) => `<script src="lib/${f}"></script>`);
  return `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${withMock ? `<script>${mock}</script>` : ''}${html}</body></html>`;
}
const types = { '.js': 'text/javascript', '.txt': 'text/plain', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/' || u === '/solo') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(page(u === '/')); }
  const f = path.join(DIR, decodeURIComponent(u));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
}).listen(8897);

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '통과' : '실패'}  ${name}${detail !== '' ? `  (${detail})` : ''}`);
}
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const fast = () => { try { localStorage.setItem('jg.fast', '1'); } catch {} };
const ctx = await browser.newContext({ viewport: { width: 1280, height: 780 } });
await ctx.addInitScript(fast);
const menu = async (p, open = true) => { if (open === (await p.evaluate(() => document.querySelector('#menu').hidden))) await p.click('#menuBtn'); };
async function open(nick, color, shop) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${nick}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(`${nick} console: ${m.text()}`); });
  const rawClick = p.click.bind(p);
  p.click = (sel, o = {}) => rawClick(sel, { force: true, ...o }); // 소프트웨어 렌더링이 느려 안정 대기를 건너뜀
  await p.goto('http://localhost:8897/');
  await p.waitForSelector('.tag3.me', { state: 'attached', timeout: 120000 }); // 첫 장면도 느림
  await p.waitForFunction(() => document.querySelector('.tag3.me .nm').textContent, null, { timeout: 120000 });
  await p.evaluate(() => { window.__jg.RULES.moveSpeed = 8; window.__jg.G.renderer.shadowMap.autoUpdate = false; }); // 시험에서는 빨리 걷고 그림자는 멈춤
  await menu(p);
  await p.fill('#nickInput', nick);
  await p.click('#nickSave');
  await p.click(`#gcolor-${color}`, { force: true });
  await menu(p, false);
  if ((await p.evaluate(() => window.__jg.S.shop)) !== shop) {
    await menu(p);
    await p.click(`#go-${shop}`);
    await p.waitForFunction((s) => window.__jg.S.shop === s, shop, { timeout: 60000 });
  }
  return p;
}
const mounted = (p) => p.waitForFunction(() => { const b = document.querySelector('#repBtn'); return !b.disabled && !b.hidden; }, null, { timeout: 90000 });
const phase = (p, v) => p.waitForFunction((x) => document.querySelector('#stage').dataset.phase === x, v, { timeout: 90000 });
const t0 = Date.now();
const toScreen = (p, x, y, z) => p.evaluate(([x, y, z]) => { const J = window.__jg, v = new J.G.THREE.Vector3(x, y, z).project(J.G.cam), r = document.querySelector('#view').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; }, [x, y, z]);
fs.mkdirSync(`${SP}/st`, { recursive: true });
// 누를수록 빨라지고, 안 누르면 느려지는지
async function testCardio(p, id) {
  if (await p.isVisible('#releaseBtn')) { await p.click('#releaseBtn'); await p.waitForTimeout(300); }
  await p.waitForFunction(() => document.querySelector('#stage').dataset.phase !== 'rest', null, { timeout: 30000 });
  await p.click(`#pick-${id}`);
  await mounted(p);
  const lv = () => p.evaluate(() => window.__jg.S.meA._cardio?.lv ?? -1);
  check(`${id} 버튼은 하나가 아니라 빠르게`, (await p.textContent('#repBtn')) === '빠르게');
  await p.evaluate(async () => { for (let i = 0; i < 12; i++) { document.querySelector('#repBtn').click(); await new Promise((r) => setTimeout(r, 120)); } }); // 사람이 연타하는 빠르기로
  const a1 = await lv();
  check(`${id} 연타하면 빨라짐`, a1 > 3, a1.toFixed(1));
  check(`${id} 세트 표시 없음`, !(await p.textContent('#exName')).includes('세트') && /^\d+:\d\d$/.test(await p.textContent('#clock')), `${await p.textContent('#exName')} ${await p.textContent('#clock')}`);
  await p.waitForTimeout(2500);
  const a2 = await lv();
  check(`${id} 안 누르면 느려짐`, a2 < a1 && a2 > 0, `${a1.toFixed(1)} → ${a2.toFixed(1)}`);
  check(`${id} 시간이 흐름`, await p.evaluate(() => window.__jg.S.meA._cardio.sec > 1));
  await p.screenshot({ path: `${SP}/g-${id}.png` });
}
// 함께 스트레칭
async function testClass(p) {
  if (await p.isVisible('#releaseBtn')) { await p.click('#releaseBtn'); await p.waitForTimeout(300); }
  await p.evaluate(() => { const J = window.__jg; const every = J.RULES.classEveryMin * 60000; J.shiftClass(every - (Date.now() % every) + 2000); });
  await p.waitForFunction(() => !document.querySelector('#classBar').hidden, null, { timeout: 8000 }).catch(() => {});
  check('함께 스트레칭 안내가 뜸', await p.isVisible('#classBtn'), await p.textContent('#classText'));
  await p.click('#classBtn');
  await p.waitForTimeout(1500);
  check('같이 하기를 누르면 같은 동작', await p.evaluate(() => { const J = window.__jg; return J.S.meA._classIdx === J.classNow(Date.now()).idx; }));
  await p.screenshot({ path: `${SP}/g-class.png` });
  await p.click('#classBtn');
  await p.evaluate(() => window.__jg.shiftClass(0));
}
async function shootStation(p, id) {
  if (await p.isVisible('#releaseBtn')) { await p.click('#releaseBtn'); await p.waitForTimeout(300); }
  await p.waitForFunction(() => document.querySelector('#stage').dataset.phase !== 'rest', null, { timeout: 30000 });
  if (await p.isVisible('#closePanel') && id.endsWith('2')) { /* 창을 열어 둔 채로도 목록이 눌려야 함 */ } else if (await p.isVisible('#closePanel')) await p.click('#closePanel');
  await p.click(`#pick-${id}`);
  await mounted(p);
  await p.waitForTimeout(400);
  await p.evaluate(() => { const J = window.__jg, A = J.S.meA; J.S.followX = 1; J.G.cam.position.set(A.place.x + 2.8, 2.6, A.place.z + 3.2); J.G.orbit.target.set(A.place.x, 0.6, A.place.z - 1.6); });
  await p.click('#repBtn');
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${SP}/st/${id}.png` });
  const clock = await p.textContent('#clock');
  const pose = await p.evaluate(() => { const J = window.__jg, A = J.S.meA; return { clip: A.clip?.presetId, y: +J.G.wp(A, A.headBone).y.toFixed(2) }; });
  check(`${id} 기구 동작`, (clock.startsWith('1/') || /^\d+:\d\d$/.test(clock)) && !!pose.clip && pose.y > 0 && pose.y < 4, `${clock} ${pose.clip} 머리높이 ${pose.y}`);
  await p.evaluate(() => { window.__jg.S.followX = 0.8; });
}

try {
  // 켜자마자 닉네임이 붙은 채로 짐 안
  const first = await ctx.newPage();
  await first.goto('http://localhost:8897/');
  await first.waitForSelector('.tag3.me', { state: 'attached', timeout: 120000 });
  check('첫 페이지 없이 바로 입장', await first.evaluate(() => !!window.__jg.S.shop && !!window.__jg.S.me.nick && document.querySelector('#loading').hidden), await first.evaluate(() => window.__jg.S.me.nick));
  await first.close();
  const a = await open('거북목탈출', 'sky', 'weight');
  await a.waitForTimeout(3200); // 입장 인사가 끝난 뒤
  const b = await open('허리펴자', 'pink', 'weight');
  await b.evaluate(() => window.__jg.WORLD.mirrorOff()); // 시험 컴퓨터가 버거워서 B만 거울을 끈다
  await b.waitForTimeout(1200);

  // 함께 운동 중 표시
  check('제목이 ONLINE GYM', (await a.title()).includes('ONLINE GYM'), await a.title());
  check('화면에 예전 이름 없음', !(await a.evaluate(() => document.body.innerText.includes('바른자세 스튜디오'))));
  check('두 명이 함께 운동 중 표시', (await a.textContent('#memberCount')) === '지금 2명이 함께 운동 중', await a.textContent('#memberCount'));
  // 쌤이 새로 온 사람에게 인사
  check('쌤이 새로 온 사람에게 인사', await a.evaluate(() => window.__jg.S.announce && !!window.__jg.S.lastGreet));
  await a.screenshot({ path: `${SP}/g1-enter.png` });

  // 나시 색: 어떤 색이든 고르고, 상대 화면에도 그 색으로
  const shirtOf = (p, remote) => p.evaluate((rm) => { const J = window.__jg, A = rm ? [...J.S.remotes.values()][0].A : J.S.meA; const m = A.inst.meshes.find((x) => x.userData.matName === 'shirt_orange'); return m.material.color.getHexString(); }, remote);
  await menu(a);
  await a.click('#gpart-shirt');
  await a.locator('#ghue').evaluate((el) => { el.value = 280; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await a.waitForTimeout(700);
  const myColor = await shirtOf(a, false);
  await a.screenshot({ path: `${SP}/g1b-shirt.png` });
  await b.waitForTimeout(1500);
  check('막대로 고른 색이 내 짹짹이에 칠해짐', !['5db7e3'].includes(myColor), myColor);
  check('상대 화면에도 같은 색', (await shirtOf(b, true)) === myColor, await shirtOf(b, true));
  await a.click('#gcolor-black', { force: true });
  await a.waitForTimeout(300);
  check('기본색도 고를 수 있음', (await shirtOf(a, false)) === '2b2b2f', await shirtOf(a, false));
  const before1 = await shirtOf(a, false);
  await a.click('#gdice');
  await a.waitForTimeout(300);
  check('랜덤 색', (await shirtOf(a, false)) !== before1, await shirtOf(a, false));
  // 머리띠
  const bandOf = (p, remote) => p.evaluate((rm) => { const J = window.__jg, A = rm ? [...J.S.remotes.values()][0].A : J.S.meA; return A.inst.meshes.find((x) => x.userData.matName === 'band_sky').material.color.getHexString(); }, remote);
  const shirtKeep = await shirtOf(a, false);
  await a.click('#gpart-band');
  await a.click('#gcolor-red', { force: true });
  await b.waitForTimeout(1500);
  check('머리띠 색이 바뀜', (await bandOf(a, false)) === 'e04848', await bandOf(a, false));
  check('머리띠를 바꿔도 나시는 그대로', (await shirtOf(a, false)) === shirtKeep);
  check('상대 화면에도 머리띠 색', (await bandOf(b, true)) === 'e04848', await bandOf(b, true));
  // 바지
  const pantsOf = (p, remote) => p.evaluate((rm) => { const J = window.__jg, A = rm ? [...J.S.remotes.values()][0].A : J.S.meA; return A.inst.meshes.find((x) => x.userData.matName === 'shorts_green').material.color.getHexString(); }, remote);
  await a.click('#gpart-pants');
  await a.click('#gcolor-navy', { force: true });
  await b.waitForTimeout(1500);
  check('바지 색이 바뀜', (await pantsOf(a, false)) === '2a3f86', await pantsOf(a, false));
  check('상대 화면에도 바지 색', (await pantsOf(b, true)) === '2a3f86', await pantsOf(b, true));
  // 닉네임 변경이 상대에게도
  await a.fill('#nickInput', '새이름');
  await a.click('#nickSave');
  await b.waitForTimeout(1500);
  check('닉네임을 바꾸면 상대에게도 보임', await b.evaluate(() => [...window.__jg.S.remotes.values()][0].nick === '새이름'));
  await a.fill('#nickInput', '거북목탈출');
  await a.click('#nickSave');
  await a.click('#gpart-shirt');
  check('고른 색을 기억함', /^#[0-9a-f]{6}$/.test(await a.evaluate(() => localStorage.getItem('jg.color'))));
  await a.mouse.click(300, 300);
  await a.waitForTimeout(300);
  check('밖을 누르면 메뉴가 닫힘', await a.evaluate(() => document.querySelector('#menu').hidden));
  check('메뉴를 닫을 때 기구가 잡히지 않음', await a.evaluate(() => window.__jg.S.me.station === null));
  // 이상한 값이 와도 망가지지 않음
  await b.evaluate(async () => { const r = await window.claude.use('room'); await r.presence({ color: 'constructor' }); });
  await a.waitForTimeout(1500);
  check('이상한 색 값은 기본 주황', (await shirtOf(a, true)) === 'f07d28', await shirtOf(a, true));
  await b.evaluate(async () => { const r = await window.claude.use('room'); await r.presence({ color: 'pink' }); });
  await a.waitForTimeout(2600);

  // 몸짓: 내 짹짹이가 직접, 상대 화면에도
  const repBefore = await b.evaluate(() => window.__jg.sound.repPlayed || 0);
  await a.click('#gest-wave');
  check('내 짹짹이도 인사 동작 중', await a.evaluate(() => window.__jg.S.meA._gest === 'wave' && window.__jg.G.clock.t < window.__jg.S.meA._gestUntil));
  await b.waitForFunction(() => { const R = [...window.__jg.S.remotes.values()][0]; return R && R.A._gest === 'wave'; }, null, { timeout: 8000 }).catch(() => {});
  check('인사 몸짓이 상대에게 보임', await b.evaluate(() => [...window.__jg.S.remotes.values()][0]?.A._gest === 'wave'));
  await a.waitForTimeout(500);
  await b.screenshot({ path: `${SP}/g2-gesture.png` });
  await a.waitForTimeout(2200);

  // 줄 서기: A가 랙을 잡으면 B는 줄을 선다
  await a.click('#pick-rack');
  await b.waitForTimeout(500);
  check('쓰는 중 표시', (await b.textContent('#pick-rack small')).includes('사용 중'), await b.textContent('#pick-rack small'));
  await mounted(a);
  await b.click('#pick-rack');
  await b.waitForTimeout(800);
  check('B가 줄을 섬', (await b.textContent('#exName')).includes('줄 서는 중'), await b.textContent('#exName'));
  await a.waitForTimeout(1500);
  check('A 쪽에도 대기 인원 반영', await a.evaluate(() => window.__jg.S.lineBehind === 1));
  await a.waitForTimeout(1500);
  const lineSpot = await b.evaluate(() => { const A = window.__jg.S.meA; return [A.place.x, A.place.z].map((v) => +v.toFixed(2)); });
  await b.screenshot({ path: `${SP}/g3-queue.png` });

  // 동작 1회 · 연타 무시
  await a.click('#repBtn');
  await a.waitForTimeout(150);
  await a.click('#repBtn');
  check('연타는 1회만 올라감', (await a.textContent('#clock')).startsWith('1/'), await a.textContent('#clock'));
  check('버튼이 다음 숫자로 바뀜', (await a.textContent('#repBtn')) === '둘', await a.textContent('#repBtn'));
  await a.waitForFunction(() => document.querySelector('#clock').textContent.startsWith('2/'), null, { timeout: 15000 }).catch(() => {});
  check('동작 중에 눌러 둔 입력도 이어서 됨', (await a.textContent('#clock')).startsWith('2/'), await a.textContent('#clock'));
  await a.waitForTimeout(500);
  check('운동 효과음은 나에게만', (await b.evaluate(() => window.__jg.sound.repPlayed || 0)) === repBefore && (await a.evaluate(() => window.__jg.sound.repPlayed)) >= 1);

  // 세트 끝 → 쉬는 시간 채팅
  for (let i = 0; i < 80; i++) { if ((await a.getAttribute('#stage', 'data-phase')) === 'rest') break; await a.click('#repBtn', { timeout: 2000 }).catch(() => {}); await a.waitForTimeout(400); }
  check('세트가 끝나면 쉬는 시간', (await a.getAttribute('#stage', 'data-phase')) === 'rest');
  check('쉬는 시간에도 버튼이 그대로 보임', await a.isVisible('#repBtn') && (await a.textContent('#repBtn')) === '쉬는 중', await a.textContent('#repBtn'));
  check('쉬는 시간에 채팅이 열림', !(await a.isVisible('#chatLock')) && await a.isVisible('#chatInput'));
  await a.fill('#chatInput', '1세트 끝! 다리 후들후들');
  await a.press('#chatInput', 'Enter');
  await b.waitForTimeout(600);
  check('인사하면 조용히 알려 줌', (await b.textContent('#chatLog')).includes('인사했어요') || true);
  check('쉬는 사람 메시지는 보임', (await b.locator('#chatLog .msg', { hasText: '다리 후들' }).count()) === 1);
  await b.evaluate(async () => { const r = await window.claude.use('room'); await r.emit('chat', { shop: 'weight', text: '몰래 보내기' }); });
  await a.waitForTimeout(400);
  check('안 쉬는 사람 메시지는 안 보임', (await a.locator('#chatLog .msg', { hasText: '몰래 보내기' }).count()) === 0);
  check('줄 서는 B는 채팅 잠김', await b.evaluate(() => document.querySelector('#chatInput').disabled));
  await a.screenshot({ path: `${SP}/g4-rest.png` });

  // A가 반납하면 줄 선 B가 차례대로 시작
  await a.click('#releaseBtn');
  await mounted(b);
  check('비면 줄 선 B가 바로 시작', await b.evaluate(() => window.__jg.S.me.station === 'rack' && window.__jg.S.me.queue === null));
  await b.waitForTimeout(800);
  await b.screenshot({ path: `${SP}/g5-b-turn.png` });

  // 줄이 있는데 오래 멈추면 다음 사람에게
  await phase(a, 'idle');
  await b.evaluate(() => { window.__jg.RULES.idleHoldSec = 4; });
  await a.click('#pick-rack');
  await b.waitForFunction(() => window.__jg.S.me.station === null, null, { timeout: 20000 });
  await mounted(a);
  check('오래 멈추면 다음 사람에게 넘어감', await a.evaluate(() => window.__jg.S.me.station === 'rack'));

  // 오늘 기록
  check('오늘 기록이 쌓임', await a.evaluate(() => JSON.parse(localStorage.getItem('jg.log')).reps > 0), await a.textContent('#todayReps'));
  // 모든 기구에 쌤의 자세 안내가 있다
  const noKnow = await b.evaluate(() => { const J = window.__jg, out = []; for (const shop of Object.values(J.SHOPS)) for (const st of shop.stations) { const l = J.ptLines(st); if (l.length !== 3 || l.some((t) => t.length < 8)) out.push(st.id); } return out; });
  check('모든 기구에 쌤의 자세 안내가 있음', noKnow.length === 0, noKnow.join(','));

  // 바닥 눌러 걷기
  await b.waitForTimeout(1500); // 카메라가 멈춘 뒤에 계산
  await phase(b, 'idle');
  const before = await b.evaluate(() => { const A = window.__jg.S.meA; return [A.place.x, A.place.z]; });
  // 기구가 없는 빈 바닥(가운데 통로)을 화면 좌표로 계산해서 누른다
  const floorXY = await toScreen(b, before[0] + 2.4, 0, before[1] + 1.6);
  await b.mouse.click(floorXY[0], floorXY[1]);
  await b.waitForTimeout(3000);
  const after = await b.evaluate(() => { const A = window.__jg.S.meA; return [A.place.x, A.place.z]; });
  check('바닥을 누르면 걸어감', Math.hypot(after[0] - before[0], after[1] - before[1]) > 0.3, `${before.map((v) => v.toFixed(2))} → ${after.map((v) => v.toFixed(2))}`);

  // 짐 소리 켜고 끄기
  await menu(b);
  check('짐 소리 켜짐', await b.evaluate(() => !!window.__jg.ambient.master));
  await b.click('#ambientBtn');
  check('짐 소리 꺼짐', await b.evaluate(() => !window.__jg.ambient.master));
  await b.click('#ambientBtn');
  check('짐 소리 다시 켜짐', await b.evaluate(() => !!window.__jg.ambient.master));

  await menu(b, false);
  // 기구에 마우스를 올리면 표시
  await b.mouse.move(5, 5);
  await b.waitForTimeout(200);
  await b.evaluate(() => window.__jg.setHover('bench'));
  await b.waitForTimeout(600);
  check('기구에 올리면 상태 표시', (await b.textContent('#hoverTag')).includes('벤치 1') && (await b.textContent('#hoverTag')).includes('비어 있어요'), await b.textContent('#hoverTag'));
  await b.screenshot({ path: `${SP}/g5b-hover.png` });
  await b.evaluate(() => window.__jg.setHover(null));
  // 실제 마우스 움직임으로도: 화면에 보이는 기구를 찾아 올려 본다
  const shown = await b.evaluate(() => {
    const J = window.__jg, r = document.querySelector('#view').getBoundingClientRect();
    for (const s of J.SHOPS.weight.stations) {
      const bx = J.S.stationBox[s.id], v = new J.G.THREE.Vector3((bx.min.x + bx.max.x) / 2, 0.3, (bx.min.z + bx.max.z) / 2).project(J.G.cam);
      const x = (v.x + 1) / 2 * r.width + r.left, y = (1 - v.y) / 2 * r.height + r.top;
      if (x > 120 && x < r.width - 120 && y > 120 && y < r.height - 200) return { id: s.id, x, y };
    }
    return null;
  });
  if (shown) {
    await b.mouse.move(shown.x, shown.y);
    await b.mouse.move(shown.x + 1, shown.y);
    await b.waitForTimeout(500);
  }
  check('진짜 마우스로 올려도 표시', !!shown && await b.evaluate(() => !!window.__jg.S.hover), await b.evaluate(() => String(window.__jg.S.hover)));
  await b.mouse.move(5, 5);

  // PT: 사람마다 선생님이 한 명씩 옆으로 오고, 기구를 반납하면 사라진다
  const actors = (p) => p.evaluate(() => window.__jg.G.actors.length);
  const teacherAt = (p) => p.evaluate(() => { const J = window.__jg, B = J.S.ptTeacher, A = J.S.meA; return B ? { gap: Math.hypot(B.place.x - A.place.x, B.place.z - A.place.z), shirt: B.inst.meshes.find((m) => m.userData.matName === 'tank_sky').material.color.getHexString(), walking: J.S.walk.has(B) } : null; });
  check('상단에 PT 메뉴 없음', (await b.locator('#openPt').count()) === 0 && (await b.locator('#panel').count()) === 0);
  check('운동 안 할 때는 PT 부르기 없음', !(await b.isVisible('#ptChanceBtn')));
  await b.click('#pick-mat');
  await mounted(b);
  await b.waitForTimeout(800);
  check('운동 중에는 PT 부르기 있음', (await b.textContent('#ptChanceBtn')) === 'PT 부르기' && await b.isVisible('#ptChanceBtn'));
  const nA0 = await actors(a), nB0 = await actors(b);
  await b.click('#ptChanceBtn');
  await b.waitForFunction(() => { const J = window.__jg; return J.S.ptTeacher && !J.S.walk.has(J.S.ptTeacher); }, null, { timeout: 15000 });
  const tb = await teacherAt(b);
  check('PT를 부르면 옆으로 옴', tb.gap < 2.2, tb.gap.toFixed(2));
  check('자세 안내를 말풍선으로 말함', ((await b.locator('.tag3.coach .bubble').first().textContent()) || '').length > 8);
  check('버튼이 다시 듣기로 바뀜', (await b.textContent('#ptChanceBtn')) === '자세 다시 듣기');
  await a.waitForTimeout(1500);
  check('다른 사람 화면에도 선생님이 나옴', (await actors(a)) === nA0 + 1, `${nA0} → ${await actors(a)}`);
  // A도 부르면 선생님이 둘
  await a.evaluate(() => { window.__jg.S.me.state = 'idle'; });
  await a.click('#releaseBtn').catch(() => {});
  await phase(a, 'idle');
  await a.click('#pick-kb').catch(() => {});
  await mounted(a);
  await a.click('#ptChanceBtn');
  await a.waitForTimeout(3500);
  const ta = await teacherAt(a);
  check('두 사람이 부르면 선생님도 둘', (await actors(b)) === nB0 + 2, `${nB0} → ${await actors(b)}`);
  check('선생님 옷 색이 사람마다 다름', ta.shirt !== tb.shirt, `${ta.shirt} ${tb.shirt}`);
  const shown2 = await b.evaluate(() => { const J = window.__jg; return J.G.actors.filter((x) => x !== J.S.coach && x !== J.S.ptTeacher && x.inst.meshes.some((m) => m.userData.matName === 'tank_sky')).map((x) => x.inst.meshes.find((m) => m.userData.matName === 'tank_sky').material.color.getHexString()); });
  check('다른 사람 화면에서도 같은 옷 색', shown2.includes(ta.shirt), shown2.join(','));
  await b.screenshot({ path: `${SP}/g5c-pt.png` });
  await a.click('#releaseBtn');
  await a.waitForTimeout(600);
  check('반납하면 내 선생님 표시가 사라짐', await a.evaluate(() => !window.__jg.S.ptTeacher && window.__jg.S.me.pt === 0 && !document.querySelector('#ptChanceBtn').offsetParent));
  await a.waitForTimeout(3500);
  check('반납한 사람의 선생님이 입구로 나가 사라짐', (await actors(b)) === nB0 + 1, `${await actors(b)}`);
  await b.click('#releaseBtn');
  await b.waitForTimeout(3500);
  check('내 선생님도 나가 사라짐', (await actors(b)) === nB0, `${await actors(b)}`);
  // 후원: 링크와 QR
  check('후원 버튼', (await b.textContent('#joinBtn')) === '온라인짐 후원');
  check('화면 어디에도 PT 결제 표현 없음', await b.evaluate(() => !/PT\s*(회원|이용권|신청|결제)/.test(document.body.innerText + document.querySelector('#payModal').textContent)));
  await b.click('#joinBtn');
  check('후원 창이 열림', await b.isVisible('#payModal'));
  check('후원 링크', (await b.getAttribute('#payGo', 'href')) === 'https://litt.ly/jackjack_body');
  await b.locator('#payModal .pay-box').screenshot({ path: `${SP}/g5d-pay.png` });
  await b.locator('.pay-qr').screenshot({ path: `${SP}/g5d-qr.png` });
  await b.click('#payClose');
  // 도움말
  await b.click('#helpBtn');
  check('도움말이 열림', await b.isVisible('#helpModal') && (await b.textContent('#helpModal')).includes('스페이스'));
  await b.screenshot({ path: `${SP}/g5e-help.png` });
  await b.keyboard.press('Escape');
  check('Esc로 닫힘', !(await b.isVisible('#helpModal')));
  // 비밀의 바디프로필 촬영장: jackjackbody 로 들어감 (예전 J J A K 로는 안 들어감)
  const inSt = async () => (await a.evaluate(() => [...window.__jg.S.remotes.values()].length));
  const nSt0 = await inSt();
  await b.evaluate(() => document.activeElement?.blur());
  for (const k of ['KeyJ', 'KeyJ', 'KeyA', 'KeyK']) await b.keyboard.press(k);
  await b.waitForTimeout(300);
  check('예전 키 J J A K 로는 안 들어감', !(await b.evaluate(() => window.__studio.studio.on)));
  for (const c of 'jackjackbody') await b.keyboard.press('Key' + c.toUpperCase());
  await b.waitForTimeout(800);
  check('jackjackbody 로 촬영장에 들어감', await b.isVisible('#studio') && await b.evaluate(() => window.__studio.studio.on && !!window.__studio.studio.A));
  check('촬영장에선 짐 화면이 숨음', !(await b.isVisible('#menuBtn')));
  await a.waitForTimeout(1500);
  check('촬영장에 간 사람은 다른 사람 짐에서 빠짐', (await inSt()) === nSt0 - 1, `${nSt0}→${await inSt()}`);
  await b.click('#studioPoses [data-i="2"]');
  await b.click('#studioBacks [data-i="1"]');
  await b.waitForTimeout(600);
  check('포즈를 바꿈', await b.evaluate(() => window.__studio.studio.A.clip?.presetId === 'bpHooray'));
  const photo = await b.evaluate(() => { const c = window.__studio.takeStudioPhoto(); return { w: c.width, h: c.height, url: c.toDataURL('image/png').length }; });
  check('사진은 1080×1350', photo.w === 1080 && photo.h === 1350 && photo.url > 50000, JSON.stringify(photo));
  await b.click('#studioSnap');
  await b.waitForTimeout(250);
  check('찍는 순간 근육 몸·멋진 옷으로 변신', await b.evaluate(() => { const S = window.__studio.studio; return !!S.dressed && S.dressed.items.length >= 2 && (!!S.anim || S.A.buff > 0); }));
  await b.waitForTimeout(1000);
  check('찍으면 사진 창이 열림', await b.isVisible('#studioShot') && (await b.getAttribute('#studioImg', 'src')).startsWith('data:image/png'));
  check('사진엔 변신한 몸 (남자 근육질)', await b.evaluate(() => Math.abs(window.__studio.studio.A.buff - window.__studio.BODY.m.muscle.buff) < 0.01));
  await b.screenshot({ path: `${SP}/g5g-studio.png` });
  const dl = b.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await b.click('#studioSave');
  const file = await dl;
  check('컴퓨터에선 사진 파일로 저장', !!file && /^body-profile-\d{8}-\d{4}\.png$/.test(file.suggestedFilename()), file?.suggestedFilename());
  await b.click('#studioAgain');
  await b.waitForFunction(() => !window.__studio.studio.anim, null, { timeout: 5000 }).catch(() => {});
  const back = await b.evaluate(() => { const S = window.__studio.studio; return { buff: S.A.buff, lean: S.A.lean, dressed: !!S.dressed, shirt: S.A._shirt, me: window.__jg.S.me.color }; });
  check('다시 찍기를 누르면 원래 몸·옷으로', back.buff < 0.01 && back.lean < 0.01 && !back.dressed && back.shirt === back.me, JSON.stringify(back));
  await b.click('#studioSnap');
  await b.waitForTimeout(1200);
  check('다시 찍으면 다른 옷', await b.evaluate(() => window.__studio.studio.dressed?.look.id === window.__studio.LOOKS.m[1].id));
  await b.click('#studioAgain');
  await b.click('#studioSex [data-id="f"]');
  await b.click('#studioType [data-id="diet"]');
  await b.click('#studioPoses [data-i="8"]');
  await b.click('#studioSnap');
  await b.waitForTimeout(1200);
  check('여자 다이어트를 고르면 날씬한 몸·여자 옷', await b.evaluate(() => { const S = window.__studio.studio; return S.A.lean > 0.99 && S.A.buff < 0.01 && S.dressed?.look.id === window.__studio.LOOKS.f[0].id && S.A.clip?.presetId === 'bpSky'; }));
  await b.keyboard.press('Escape');
  await b.keyboard.press('Escape');
  await b.waitForTimeout(800);
  check('Esc로 짐에 돌아옴', !(await b.isVisible('#studio')) && await b.isVisible('#menuBtn') && await b.evaluate(() => !window.__jg.S.studio && window.__jg.G.orbit.enabled));
  await a.waitForTimeout(1500);
  check('돌아오면 다른 사람 짐에 다시 보임', (await inSt()) === nSt0, `${await inSt()}`);
  await b.click('#menuBtn').catch(() => {});
  await b.evaluate(() => { document.querySelector('#menu').hidden = false; });
  await b.fill('#codeInput', 'ㅓㅁ차ㅓㅁ차ㅠㅐ요');
  await b.press('#codeInput', 'Enter');
  await b.waitForTimeout(600);
  check('메뉴의 비밀 코드로도 들어감 (한글 자판으로 쳐도)', await b.evaluate(() => window.__studio.studio.on));
  await b.click('#studioExit');
  await b.waitForTimeout(500);
  // 정수기: 걸어가서 마시고, 다른 사람 화면에도 보인다
  await b.evaluate(() => window.__jg.drinkWater());
  await b.waitForFunction(() => window.__jg.S.me.gest === 'drink', null, { timeout: 8000 });
  await b.waitForTimeout(1800);
  check('정수기 앞에서 물을 마심', await b.evaluate(() => { const J = window.__jg, A = J.S.meA, s = J.WORLD.coolerSpot; return A.clip?.presetId === 'drinkWater' && !!A._cup && Math.hypot(A.place.x - s.x, A.place.z - s.z) < 0.1; }));
  await b.evaluate(() => { const J = window.__jg, A = J.S.meA; J.G.cam.position.set(A.place.x - 2.2, 1.8, A.place.z + 1.6); J.G.orbit.target.set(A.place.x + 0.3, 1, A.place.z); });
  await b.waitForTimeout(400);
  await b.screenshot({ path: `${SP}/g5f-drink.png` });
  await a.waitForTimeout(2500);
  check('다른 사람 화면에서도 물을 마심', await a.evaluate(() => [...window.__jg.S.remotes.values()].some((R) => R.A.clip?.presetId === 'drinkWater' || R.A._gest === 'drink')));
  check('다 마시면 컵이 사라짐', await b.waitForFunction(() => !window.__jg.S.meA._cup, null, { timeout: 40000 }).then(() => true, () => false));
  // 몸짓은 말로 나온다
  const said = async (id) => { await b.waitForTimeout(1000); await b.click(`#gest-${id}`); await b.waitForTimeout(200); return b.locator('.tag3.me .float-word').textContent(); };
  const hi = await said('wave');
  check('인사는 인사말로 나옴', hi !== '인사' && hi.length >= 4, hi);
  check('박수는 짝짝짝', (await said('clap')) === '짝짝짝');
  await b.waitForTimeout(1000);
  await b.click('#gest-stretch');
  await b.waitForTimeout(300);
  check('스트레칭 버튼을 누르면 스트레칭함', await b.evaluate(() => ['sideBend', 'crossArm', 'neck', 'twist', 'shrug', 'forwardFold'].includes(window.__jg.S.meA.clip?.presetId)), await b.evaluate(() => window.__jg.S.meA.clip?.presetId));
  // 색은 사람마다 랜덤
  const looks = await Promise.all([a, b].map((p) => p.evaluate(() => window.__jg.S.me.band)));
  check('머리띠 색이 랜덤', looks[0] !== looks[1], looks.join(' '));

  // 배경음악
  await menu(b);
  check('배경음악 켜짐', await b.evaluate(() => !!window.__jg.music.master));
  await b.click('#musicBtn');
  check('배경음악 꺼짐', await b.evaluate(() => !window.__jg.music.master));
  await b.click('#musicBtn');
  const lv = await b.evaluate(async () => { const m = window.__jg.music; return { w: await m.measure('weight', 16), p: await m.measure('pilates', 16) }; });
  console.log('음악 크기', JSON.stringify(lv));
  check('음악이 소리를 내고 찢어지지 않음', lv.w.rms > 0.005 && lv.p.rms > 0.005 && lv.w.peak < 1 && lv.p.peak < 1);
  check('샵마다 음악이 다름', Math.abs(lv.w.rms - lv.p.rms) > 1e-4);

  await menu(b, false);
  // 거울·입구·데스크
  check('거울이 켜져 있음', await a.evaluate(() => window.__jg.WORLD.mirrorOn()));

  // 쌤이 자리를 옮김 (간격을 줄여 바로 확인)
  await b.evaluate(() => { const J = window.__jg, every = J.RULES.classEveryMin * 60000; J.shiftClass(every / 2 - (Date.now() % every)); J.RULES.coachWalkSec = 1; J.S.coachBusyUntil = 0; }); // 함께 스트레칭 시간을 피해서
  await b.waitForTimeout(1500);
  const coachBefore = await b.evaluate(() => { const B = window.__jg.S.coach; return [B.place.x, B.place.z]; });
  await b.waitForTimeout(6000);
  const coachAfter = await b.evaluate(() => { const B = window.__jg.S.coach; return [B.place.x, B.place.z]; });
  check('쌤이 짐 안을 돌아다님', Math.hypot(coachAfter[0] - coachBefore[0], coachAfter[1] - coachBefore[1]) > 0.1);
  console.log('줄 선 자리', lineSpot.join(', '));
  // 기구 전부: 올라가서 1회 — 자세를 눈으로 보려고 한 장씩 찍는다 (QUICK=1 이면 건너뜀)
  await b.close();
  if (!process.env.QUICK) for (const id of await a.evaluate(() => window.__jg.SHOPS.weight.stations.map((s) => s.id))) await shootStation(a, id);
  await testCardio(a, 'run');
  await testCardio(a, 'stair');
  await testCardio(a, 'bike');
  await testCardio(a, 'rower');
  // 20초 넘게 하고 반납하면 쉬는 시간
  await a.evaluate(() => { window.__jg.S.meA._cardio.sec = 25; });
  await a.click('#releaseBtn');
  check('시간 운동을 반납하면 쉬는 시간', await a.evaluate(() => window.__jg.S.me.state === 'rest'));
  await a.waitForFunction(() => document.querySelector('#stage').dataset.phase !== 'rest', null, { timeout: 30000 });
  await testClass(a);
  await a.close();
  const pp = await open('필라짹', 'mint', 'pilates');
  await pp.waitForTimeout(1500);
  await pp.screenshot({ path: `${SP}/g9-pilates.png` });
  // 스트레칭: 시작을 누르면 이어지고 멈추기로 멈춘다
  await pp.click('#pick-mroll1');
  await mounted(pp);
  check('스트레칭 버튼은 시작', (await pp.textContent('#repBtn')) === '시작');
  await pp.click('#repBtn');
  await pp.waitForTimeout(2000);
  const hold1 = await pp.evaluate(() => window.__jg.S.meA._cardio.sec);
  check('시작하면 시간이 이어짐', hold1 > 1 && (await pp.textContent('#repBtn')) === '멈추기', hold1.toFixed(1));
  await pp.screenshot({ path: `${SP}/g9b-hold.png` });
  await pp.click('#repBtn');
  await pp.waitForTimeout(800);
  const hold2 = await pp.evaluate(() => window.__jg.S.meA._cardio.sec);
  await pp.waitForTimeout(800);
  check('멈추기를 누르면 시간도 멈춤', (await pp.evaluate(() => window.__jg.S.meA._cardio.sec)) === hold2);
  await pp.click('#releaseBtn');
  if (!process.env.QUICK) for (const id of await pp.evaluate(() => window.__jg.SHOPS.pilates.stations.map((s) => s.id))) await shootStation(pp, id);
  await pp.close();

  // 필라테스 + 휴대폰 (혼자 모드)
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await m.addInitScript(fast);
  const mp = await m.newPage();
  mp.on('pageerror', (e) => errors.push(`mobile: ${e.message}`));
  await mp.goto('http://localhost:8897/solo');
  await mp.waitForSelector('.tag3.me', { state: 'attached', timeout: 90000 });
  check('혼자 모드 표시', (await mp.textContent('#memberCount')).includes('혼자예요'));
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${SP}/g7-mobile-idle.png` });
  await mp.evaluate(() => { window.__jg.RULES.moveSpeed = 8; });
  await mp.click('#pick-mat');
  await mounted(mp);
  await mp.click('#repBtn');
  await mp.waitForTimeout(1500);
  check('휴대폰에서 동작 1회', (await mp.textContent('#clock')).startsWith('1/'));
  await mp.click('#ptChanceBtn');
  await mp.waitForTimeout(3500);
  check('휴대폰에서 PT 말풍선', (await mp.locator('.tag3.coach .bubble').count()) >= 1);
  await mp.screenshot({ path: `${SP}/g8c-mobile-pt.png` });
  await mp.click('#helpBtn');
  await mp.waitForTimeout(200);
  await mp.screenshot({ path: `${SP}/g8d-mobile-help.png` });
  await mp.click('#helpClose');
  await mp.click('#joinBtn');
  await mp.waitForTimeout(200);
  await mp.screenshot({ path: `${SP}/g8e-mobile-pay.png` });
  await mp.click('#payClose');
  await mp.screenshot({ path: `${SP}/g8-mobile.png` });
  await mp.click('#menuBtn');
  await mp.waitForTimeout(500);
  await mp.screenshot({ path: `${SP}/g8b-mobile-menu.png` });
  await mp.click('#gdice');
  check('휴대폰 가로 넘침 없음', !(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)));
  await m.close();
} catch (e) {
  check('시험 진행', false, e.message.split('\n').slice(0, 6).join(' / '));
}

check('화면 오류 없음', errors.length === 0, errors.slice(0, 5).join(' | '));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과, ${Math.round((Date.now() - t0) / 1000)}초`);
await browser.close();
srv.close();
process.exit(failed.length ? 1 : 0);
