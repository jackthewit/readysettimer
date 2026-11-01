import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHOPS } from '../lib/routines.js';
import { phaseAt, buildSegments, chatOpen } from '../lib/schedule.js';

const shop = SHOPS.weight; // work 40 / rest 40 / break 90, 8 exercises
const E = 1_000_000;

test('starts with the first exercise in a work set', () => {
  const p = phaseAt(shop, E, E);
  assert.equal(p.phase, 'work');
  assert.equal(p.idx, 0);
  assert.equal(p.round, 1);
  assert.equal(p.endsAt, E + 40_000);
  assert.equal(chatOpen(p), false);
});

test('rest follows the set and opens chat', () => {
  const p = phaseAt(shop, E, E + 40_000);
  assert.equal(p.phase, 'rest');
  assert.equal(p.idx, 0);
  assert.equal(p.next.name, shop.routine[1].name);
  assert.equal(chatOpen(p), true);
});

test('last exercise is followed by a round break, then round 2', () => {
  const segs = buildSegments(shop);
  const cycle = segs.reduce((s, x) => s + x.dur, 0);
  assert.equal(cycle, (8 * 40 + 7 * 40 + 90) * 1000);
  const brk = phaseAt(shop, E, E + cycle - 1000);
  assert.equal(brk.phase, 'break');
  assert.equal(brk.idx, 7);
  assert.equal(brk.next.name, shop.routine[0].name);
  assert.ok(chatOpen(brk));
  const r2 = phaseAt(shop, E, E + cycle);
  assert.equal(r2.round, 2);
  assert.equal(r2.phase, 'work');
  assert.equal(r2.idx, 0);
});

test('everyone computes the same phase regardless of join time', () => {
  const t = E + 123_456;
  assert.deepEqual(phaseAt(shop, E, t), phaseAt(shop, E, t));
  const p = phaseAt(shop, E, t);
  assert.ok(p.startedAt <= t && t < p.endsAt);
});

test('"next" is always the exercise after the current one', () => {
  const work = phaseAt(shop, E, E + 1000);
  assert.equal(work.next.name, shop.routine[1].name);
  const rest = phaseAt(shop, E, E + 41_000);
  assert.equal(rest.next.name, shop.routine[1].name);
});
