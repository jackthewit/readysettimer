import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const require = createRequire('/home/user/readysettimer/jjackgym/');
const { chromium } = require('playwright');
const SP = process.argv[2];
const DIR = path.join(SP, 'gym3d');
const mock = fs.readFileSync(path.join(SP, 'jjackgym-artifact', 'mock-claude.js'), 'utf8');
const LIB = { 'three.min.js': 'three.min.js', 'OrbitControls.js': 'OrbitControls.js', 'TransformControls.js': 'TransformControls.js', 'BufferGeometryUtils.js': 'BufferGeometryUtils.js', 'SkeletonUtils.js': 'SkeletonUtils.js', 'GLTFLoader.js': 'GLTFLoader.js' };
function page(withMock) {
  let html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  html = html.replace(/<script src="https:\/\/[^"]+\/([A-Za-z]+\.(?:min\.)?js)"><\/script>/g, (m, f) => `<script src="lib/${LIB[f] || f}"></script>`);
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

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 780 } });
await ctx.addInitScript(() => { try { localStorage.setItem('jg.fast', '1'); } catch {} });
async function open(nick, color, shop) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${nick}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${nick} console: ${m.text()}`); });
  await p.goto('http://localhost:8897/');
  await p.waitForFunction(() => !document.querySelector('#shopWeight').disabled, null, { timeout: 90000 });
  await p.fill('#nick', nick);
  await p.click(`#color-${color}`, { force: true });
  await p.click(`button.shop[value="${shop}"]`);
  await p.waitForSelector('.tag3.me');
  return p;
}
const t0 = Date.now();
const a = await open('거북목탈출', 'sky', 'weight');
const b = await open('허리펴자', 'pink', 'weight');
await a.waitForTimeout(1500);
await a.screenshot({ path: `${SP}/g1-enter.png` });

// A가 스쿼트 랙을 누르면 걸어가서 올라간다
await a.click('#pick-rack');
await b.waitForTimeout(400);
const bRackDisabled = await b.isDisabled('#pick-rack');
const bRackLabel = await b.textContent('#pick-rack small');
await a.waitForFunction(() => !document.querySelector('#repBtn').disabled && !document.querySelector('#repBtn').hidden, null, { timeout: 60000 });
// B는 벤치로
await b.click('#pick-bench');
await b.waitForFunction(() => !document.querySelector('#repBtn').disabled && !document.querySelector('#repBtn').hidden, null, { timeout: 60000 });
await a.waitForTimeout(800);
await a.screenshot({ path: `${SP}/g2-mounted.png` });
// A 1회 → 동작 중 다시 눌러도 무시
await a.click('#repBtn');
await a.waitForTimeout(300);
await a.click('#repBtn');
const repsAfterDouble = await a.textContent('#clock');
await a.waitForTimeout(1200);
await b.screenshot({ path: `${SP}/g3-b-sees-a.png` });
// 세트 끝까지
for (let i = 0; i < 60; i++) { if ((await a.getAttribute('#stage', 'data-phase')) === 'rest') break; await a.click('#repBtn'); await a.waitForTimeout(500); }
const aPhase = await a.getAttribute('#stage', 'data-phase');
const chatOpen = !(await a.isVisible('#chatLock'));
await a.fill('#chatInput', '1세트 끝! 다리 후들후들');
await a.press('#chatInput', 'Enter');
await b.waitForTimeout(500);
const bSawChat = await b.locator('#chatLog .msg', { hasText: '다리 후들' }).count();
await b.evaluate(async () => { const r = await window.claude.use('room'); await r.emit('chat', { shop: 'weight', text: '몰래 보내기' }); });
await a.waitForTimeout(400);
const aSawSneaky = await a.locator('#chatLog .msg', { hasText: '몰래 보내기' }).count();
await a.screenshot({ path: `${SP}/g4-rest.png` });
// PT
await a.click('#tabPt');
await a.click('#ptChips button >> nth=0');
await a.waitForFunction(() => !document.querySelector('#ptLog .typing'), null, { timeout: 10000 });
const ptAnswer = await a.locator('#ptLog .msg.coach .text').first().textContent();
// 바닥 클릭으로 걷기 (B: 기구 반납 후)
await b.click('#releaseBtn');
await b.waitForTimeout(500);
const box = await b.locator('#view').boundingBox();
const beforeTag = await b.evaluate(() => document.querySelector('.tag3.me').style.transform);
await b.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.75);
await b.waitForTimeout(2500);
const afterTag = await b.evaluate(() => document.querySelector('.tag3.me').style.transform);
await b.screenshot({ path: `${SP}/g5-b-walk.png` });

// 필라테스 + 모바일
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.addInitScript(() => { try { localStorage.setItem('jg.fast', '1'); } catch {} });
const mp = await m.newPage();
mp.on('pageerror', (e) => errors.push(`mobile: ${e.message}`));
await mp.goto('http://localhost:8897/solo');
await mp.waitForFunction(() => !document.querySelector('#shopPilates').disabled, null, { timeout: 90000 });
await mp.fill('#nick', '모바일짹');
await mp.click('button.shop[value="pilates"]');
await mp.waitForSelector('.tag3.me');
await mp.click('#pick-m1');
await mp.waitForFunction(() => !document.querySelector('#repBtn').disabled && !document.querySelector('#repBtn').hidden, null, { timeout: 60000 });
await mp.click('#repBtn');
await mp.waitForTimeout(1500);
await mp.screenshot({ path: `${SP}/g6-mobile.png` });
const hScroll = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

console.log(JSON.stringify({ secs: Math.round((Date.now() - t0) / 1000), bRackDisabled, bRackLabel, repsAfterDouble, aPhase, chatOpen, bSawChat, aSawSneaky, ptAnswer, walked: beforeTag !== afterTag, hScroll, errors }, null, 1));
await browser.close();
srv.close();
