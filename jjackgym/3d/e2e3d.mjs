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
const mock = fs.readFileSync(path.join(DIR, 'mock-claude.js'), 'utf8');
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
async function open(nick, color, shop) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${nick}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(`${nick} console: ${m.text()}`); });
  await p.goto('http://localhost:8897/');
  await p.waitForFunction(() => !document.querySelector('#shopWeight').disabled, null, { timeout: 90000 });
  await p.fill('#nick', nick);
  await p.click(`#color-${color}`, { force: true });
  await p.click(`button.shop[value="${shop}"]`);
  await p.waitForSelector('.tag3.me');
  return p;
}
const mounted = (p) => p.waitForFunction(() => { const b = document.querySelector('#repBtn'); return !b.disabled && !b.hidden; }, null, { timeout: 90000 });
const phase = (p, v) => p.waitForFunction((x) => document.querySelector('#stage').dataset.phase === x, v, { timeout: 90000 });
const t0 = Date.now();

try {
  const a = await open('거북목탈출', 'sky', 'weight');
  await a.waitForTimeout(3200); // 입장 인사가 끝난 뒤
  const b = await open('허리펴자', 'pink', 'weight');
  await b.waitForTimeout(1200);

  // 함께 운동 중 표시
  check('두 명이 함께 운동 중 표시', (await a.textContent('#memberCount')) === '지금 2명이 함께 운동 중', await a.textContent('#memberCount'));
  // 쌤이 새로 온 사람에게 인사
  check('쌤이 새로 온 사람에게 인사', (await a.evaluate(() => window.__jg.S.lastGreet)) === '허리펴자');
  await a.screenshot({ path: `${SP}/g1-enter.png` });

  // 몸짓: 내 짹짹이가 직접, 상대 화면에도
  const repBefore = await b.evaluate(() => window.__jg.sound.repPlayed || 0);
  await a.click('#gest-wave');
  await b.waitForFunction(() => { const R = [...window.__jg.S.remotes.values()][0]; return R && R.A._gest === 'wave'; }, null, { timeout: 8000 }).catch(() => {});
  check('인사 몸짓이 상대에게 보임', await b.evaluate(() => [...window.__jg.S.remotes.values()][0]?.A._gest === 'wave'));
  check('내 짹짹이도 인사 동작 중', await a.evaluate(() => window.__jg.S.meA._gest === 'wave' && window.__jg.G.clock.t < window.__jg.S.meA._gestUntil));
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
  await a.waitForTimeout(500);
  check('운동 효과음은 나에게만', (await b.evaluate(() => window.__jg.sound.repPlayed || 0)) === repBefore && (await a.evaluate(() => window.__jg.sound.repPlayed)) >= 1);

  // 세트 끝 → 쉬는 시간 채팅
  for (let i = 0; i < 80; i++) { if ((await a.getAttribute('#stage', 'data-phase')) === 'rest') break; await a.click('#repBtn', { timeout: 2000 }).catch(() => {}); await a.waitForTimeout(400); }
  check('세트가 끝나면 쉬는 시간', (await a.getAttribute('#stage', 'data-phase')) === 'rest');
  check('쉬는 시간에 채팅이 열림', !(await a.isVisible('#chatLock')) && await a.isVisible('#chatInput'));
  await a.fill('#chatInput', '1세트 끝! 다리 후들후들');
  await a.press('#chatInput', 'Enter');
  await b.waitForTimeout(600);
  check('쉬는 사람 메시지는 보임', (await b.locator('#chatLog .msg', { hasText: '다리 후들' }).count()) === 1);
  await b.evaluate(async () => { const r = await window.claude.use('room'); await r.emit('chat', { shop: 'weight', text: '몰래 보내기' }); });
  await a.waitForTimeout(400);
  check('안 쉬는 사람 메시지는 안 보임', (await a.locator('#chatLog .msg', { hasText: '몰래 보내기' }).count()) === 0);
  check('줄 서는 B는 채팅 잠김', await b.evaluate(() => document.querySelector('#chatInput').disabled));
  await a.screenshot({ path: `${SP}/g4-rest.png` });

  // PT
  await a.click('#tabPt');
  await a.click('#ptChips button >> nth=0');
  await a.waitForFunction(() => !document.querySelector('#ptLog .typing'), null, { timeout: 15000 });
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

  // 바닥 눌러 걷기
  await phase(b, 'idle');
  const box = await b.locator('#view').boundingBox();
  const before = await b.evaluate(() => { const A = window.__jg.S.meA; return [A.place.x, A.place.z]; });
  await b.mouse.click(box.x + box.width * 0.72, box.y + box.height * 0.62);
  await b.waitForTimeout(2500);
  const after = await b.evaluate(() => { const A = window.__jg.S.meA; return [A.place.x, A.place.z]; });
  check('바닥을 누르면 걸어감', Math.hypot(after[0] - before[0], after[1] - before[1]) > 0.3, `${before.map((v) => v.toFixed(2))} → ${after.map((v) => v.toFixed(2))}`);

  // 짐 소리 켜고 끄기
  check('짐 소리 켜짐', await b.evaluate(() => !!window.__jg.ambient.master));
  await b.click('#ambientBtn');
  check('짐 소리 꺼짐', await b.evaluate(() => !window.__jg.ambient.master));
  await b.click('#ambientBtn');
  check('짐 소리 다시 켜짐', await b.evaluate(() => !!window.__jg.ambient.master));

  // 쌤이 자리를 옮김 (간격을 줄여 바로 확인)
  const coachBefore = await a.evaluate(() => { const B = window.__jg.S.coach; return [B.place.x, B.place.z]; });
  await a.evaluate(() => { window.__jg.RULES.coachWalkSec = 1; window.__jg.S.coachBusyUntil = 0; });
  await a.waitForTimeout(4000);
  const coachAfter = await a.evaluate(() => { const B = window.__jg.S.coach; return [B.place.x, B.place.z]; });
  check('쌤이 짐 안을 돌아다님', Math.hypot(coachAfter[0] - coachBefore[0], coachAfter[1] - coachBefore[1]) > 0.1);
  console.log('줄 선 자리', lineSpot.join(', '));
  await a.close();
  await b.close();

  // 필라테스 + 휴대폰 (혼자 모드)
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await m.addInitScript(fast);
  const mp = await m.newPage();
  mp.on('pageerror', (e) => errors.push(`mobile: ${e.message}`));
  await mp.goto('http://localhost:8897/solo');
  await mp.waitForFunction(() => !document.querySelector('#shopPilates').disabled, null, { timeout: 90000 });
  await mp.screenshot({ path: `${SP}/g6-lobby.png` });
  await mp.fill('#nick', '모바일짹');
  await mp.click('button.shop[value="pilates"]');
  await mp.waitForSelector('.tag3.me');
  check('혼자 모드 표시', (await mp.textContent('#memberCount')) === '지금은 혼자 운동 중');
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${SP}/g7-mobile-idle.png` });
  await mp.click('#pick-m1');
  await mounted(mp);
  await mp.click('#repBtn');
  await mp.waitForTimeout(1500);
  check('휴대폰에서 동작 1회', (await mp.textContent('#clock')).startsWith('1/'));
  await mp.screenshot({ path: `${SP}/g8-mobile.png` });
  check('휴대폰 가로 넘침 없음', !(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)));
  await m.close();
} catch (e) {
  check('시험 진행', false, e.message.split('\n')[0]);
}

check('화면 오류 없음', errors.length === 0, errors.slice(0, 5).join(' | '));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과, ${Math.round((Date.now() - t0) / 1000)}초`);
await browser.close();
srv.close();
process.exit(failed.length ? 1 : 0);
