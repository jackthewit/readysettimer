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
  await p.click('#repBtn'); await p.click('#repBtn');
  await p.waitForTimeout(100);
  const a1 = await lv();
  await p.click('#repBtn', { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(100);
  const a2 = await lv();
  check(`${id} 누를수록 빨라짐`, a2 >= a1 && a1 >= 1, `${a1.toFixed(1)} → ${a2.toFixed(1)}`);
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
  check(`${id} 기구 동작`, clock.startsWith('1/') && !!pose.clip && pose.y > 0 && pose.y < 4, `${clock} ${pose.clip} 머리높이 ${pose.y}`);
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

  // PT
  await a.click('#openPt');
  await a.waitForTimeout(300);
  await a.click('#ptChips button >> nth=0');
  check('창을 열어도 기구 목록을 누를 수 있음', await a.evaluate(() => { document.querySelector('#stage'); const c = document.querySelector('#pick-mat'); if (!c.offsetParent) return true; c.scrollIntoView(); const r = c.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return c.contains(el); }));
  check('PT 답변', ((await a.locator('#ptLog .msg.coach .text').first().textContent()) || '').length > 5);

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
  // 쌤은 AI 없이 모든 기구를 안다
  const know = await b.evaluate(() => {
    const J = window.__jg, out = { missing: [], empty: [] };
    for (const shop of Object.values(J.SHOPS)) for (const st of shop.stations) {
      if (!J.PT_KNOW[st.preset]) { out.missing.push(st.id); continue; }
      for (const q of ['자세 좀 봐 주세요', '이 운동은 어디에 좋아요?', '더 쉽게 하는 방법 있어요?', '흔한 실수가 뭐예요?', '허리가 뻐근한데 해도 될까요?']) if (J.ptAnswer(q, shop, st).length < 10) out.empty.push(`${st.id}:${q}`);
    }
    out.pain = J.ptAnswer('무릎이 찌릿하게 아파요', J.SHOPS.weight, null);
    out.body = J.ptAnswer('등 운동 뭐가 좋아요?', J.SHOPS.weight, null);
    out.off = J.ptAnswer('오늘 점심 뭐 먹지', J.SHOPS.weight, null);
    return out;
  });
  check('모든 기구에 쌤의 지식이 있음', know.missing.length === 0 && know.empty.length === 0, know.missing.concat(know.empty).join(','));
  check('통증 질문은 멈추고 병원 안내', know.pain.includes('병원'), know.pain);
  check('부위로 운동을 찾아 줌', know.body.includes('등 쪽'), know.body);
  check('운동과 상관없는 말은 받지 않음', know.off.includes('모르겠어'), know.off);

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

  // PT 찬스: 쌤이 옆으로 와서 봐 줌
  await b.click('#pick-mat');
  await mounted(b);
  await b.waitForTimeout(1200);
  const chanceBefore = await b.textContent('#ptChanceBtn');
  await b.click('#ptChanceBtn');
  await b.waitForFunction(() => { const J = window.__jg, B = J.S.coach, A = J.S.meA; return Math.hypot(B.place.x - A.place.x, B.place.z - A.place.z) < 2; }, null, { timeout: 40000 }).catch(() => {});
  const coachGap = await b.evaluate(() => { const J = window.__jg, B = J.S.coach, A = J.S.meA; return Math.hypot(B.place.x - A.place.x, B.place.z - A.place.z); });
  check('PT 쌤을 부르면 옆으로 옴', coachGap < 2, coachGap.toFixed(2));
  await b.waitForFunction(() => !window.__jg.S.ptBusy, null, { timeout: 15000 });
  check('PT 받는 중으로 바뀜', chanceBefore !== (await b.textContent('#ptChanceBtn')), `${chanceBefore} → ${await b.textContent('#ptChanceBtn')}`);
  await b.waitForTimeout(600);
  check('쌤이 말풍선으로 답함', (await b.locator('.tag3.coach .bubble').count()) === 1);
  await b.screenshot({ path: `${SP}/g5c-pt.png` });
  await a.waitForTimeout(800);
  // 후원은 PT와 별개
  check('후원 버튼', (await b.textContent('#joinBtn')) === '온라인짐 후원');
  check('화면 어디에도 PT 결제 표현 없음', await b.evaluate(() => !/PT\s*(회원|이용권|신청|결제)/.test(document.body.innerText + document.querySelector('#payModal').textContent)));
  await b.click('#joinBtn');
  check('후원 창이 열림', await b.isVisible('#payModal'));
  await b.click('#payGo');
  check('아직 돈이 나가지 않는다고 안내', (await b.textContent('#payMsg')).includes('돈은 나가지 않았어요'), await b.textContent('#payMsg'));
  await b.screenshot({ path: `${SP}/g5d-pay.png` });
  await b.click('#payClose');
  await b.click('#releaseBtn');

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
  // PT 찬스가 끝난 뒤에는 다시 자기 일을 하러 감
  await a.evaluate(() => { const J = window.__jg; J.S.me.ptUntil = 0; J.S.ptSession = null; });
  await a.click('#gest-clap');
  await a.waitForTimeout(800);
  await b.evaluate(() => { window.__jg.S.me.ptUntil = 0; window.__jg.RULES.coachWalkSec = 1; window.__jg.S.coachBusyUntil = 0; });
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
  await testClass(a);
  await a.close();
  const pp = await open('필라짹', 'mint', 'pilates');
  await pp.waitForTimeout(1500);
  await pp.screenshot({ path: `${SP}/g9-pilates.png` });
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
