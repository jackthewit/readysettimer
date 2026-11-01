// 부리부리 쌤 AI 경로 테스트: 로컬 가짜 Messages API(SSE)로 SDK 스트리밍·fallback 파라미터를 확인한다.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const requests = [];
let mode = 'ok';

function sse(res, events) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  for (const e of events) res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
  res.end();
}

function streamOf(chunks, stopReason = 'end_turn') {
  return [
    { type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    ...chunks.map((text) => ({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } })),
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 20 } },
    { type: 'message_stop' },
  ];
}

const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const json = JSON.parse(body || '{}');
    requests.push({ url: req.url, headers: req.headers, body: json });
    if (mode === 'reject-fallbacks' && json.fallbacks) {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'fallbacks: unsupported' } }));
    }
    if (mode === 'refusal') return sse(res, streamOf([], 'refusal'));
    sse(res, streamOf(['허리 말고 ', '고관절을 접어!']));
  });
});

let askCoach, SHOPS, phaseAt;
before(async () => {
  await new Promise((r) => mock.listen(0, r));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  delete process.env.PT_AI;
  ({ askCoach } = await import('../lib/coach.js?ai'));
  ({ SHOPS } = await import('../lib/routines.js'));
  ({ phaseAt } = await import('../lib/schedule.js'));
});
after(() => mock.close());

const ctx = () => ({ shop: SHOPS.weight, phase: phaseAt(SHOPS.weight, 0, 1000), nick: '짹짹' });

test('streams the answer and sends fallbacks + low effort', async () => {
  mode = 'ok';
  const deltas = [];
  const r = await askCoach({ ...ctx(), question: '데드리프트 허리 아파?', onDelta: (d) => deltas.push(d) });
  assert.equal(r.source, 'ai');
  assert.equal(r.text, '허리 말고 고관절을 접어!');
  assert.deepEqual(deltas, ['허리 말고 ', '고관절을 접어!']);
  const req = requests.at(-1);
  assert.equal(req.body.model, 'claude-opus-5-5');
  assert.equal(req.body.fallbacks, 'default');
  assert.deepEqual(req.body.output_config, { effort: 'low' });
  assert.deepEqual(req.body.cache_control, { type: 'ephemeral' });
  assert.equal(req.body.stream, true);
  assert.match(req.headers['anthropic-beta'], /server-side-fallback-2026-07-01/);
  assert.match(req.body.messages.at(-1).content, /^\[지금 상황\] 웨이트샵 · 세트 중 — 스탠딩 니 업/);
  assert.match(req.body.system, /부리부리/);
});

test('refusal is turned into a gentle redirect', async () => {
  mode = 'refusal';
  const r = await askCoach({ ...ctx(), question: '?', onDelta: () => {} });
  assert.equal(r.source, 'refusal');
  assert.match(r.text, /자세 얘기로/);
});

test('if fallbacks are rejected, retries once without them', async () => {
  mode = 'reject-fallbacks';
  const n = requests.length;
  const r = await askCoach({ ...ctx(), question: '스쿼트?', onDelta: () => {} });
  assert.equal(r.source, 'ai');
  const tries = requests.slice(n);
  assert.equal(tries.length, 2);
  assert.equal(tries[0].body.fallbacks, 'default');
  assert.equal(tries[1].body.fallbacks, undefined);
});
