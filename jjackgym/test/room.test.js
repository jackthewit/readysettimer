import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHOPS } from '../lib/routines.js';
import { Room, cleanText, extractCoachMention, LIMITS } from '../lib/room.js';
import { offlineAnswer } from '../lib/coach.js';

const E = 1_000_000;
const WORK = E + 1_000;            // pilates: work 45s
const REST = E + 46_000;           // rest 30s

test('chat is locked during a set and open during rest', () => {
  const room = new Room(SHOPS.pilates, { epoch: E });
  const m = room.join({ nick: '짹짹', color: 'pink' });
  const locked = room.checkChat(m, '안녕', WORK);
  assert.equal(locked.ok, false);
  assert.equal(locked.code, 'chat_locked');
  assert.equal(locked.opensAt, E + 45_000);
  const ok = room.checkChat(m, '  안녕  하세요 ', REST);
  assert.deepEqual(ok, { ok: true, text: '안녕 하세요' });
});

test('chat is rate limited and length capped', () => {
  const room = new Room(SHOPS.pilates, { epoch: E });
  const m = room.join({ nick: 'a' });
  assert.equal(room.checkChat(m, 'x', REST).ok, true);
  assert.equal(room.checkChat(m, 'y', REST + 100).code, 'slow_down');
  const long = room.checkChat(m, 'ㅋ'.repeat(500), REST + 5_000);
  assert.equal([...long.text].length, LIMITS.chat);
  assert.equal(room.checkChat(m, '   ', REST + 10_000).code, 'empty');
});

test('join sanitises nick/color, assigns lowest free slot, enforces capacity', () => {
  const room = new Room(SHOPS.weight, { epoch: E, maxMembers: 2 });
  const a = room.join({ nick: '\u0000<b>짹</b>\n', color: 'hacker' });
  assert.equal(a.nick, '<b>짹</b>');
  assert.equal(a.color, 'orange');
  assert.equal(a.slot, 0);
  const b = room.join({ nick: '' });
  assert.equal(b.nick, '익명 짹짹이');
  assert.equal(b.slot, 1);
  assert.throws(() => room.join({ nick: 'c' }), (e) => e.code === 'full');
  room.leave(a.id);
  assert.equal(room.join({ nick: 'd' }).slot, 0);
});

test('PT questions are limited per member', () => {
  const room = new Room(SHOPS.weight, { epoch: E });
  const m = room.join({ nick: 'q' });
  for (let i = 0; i < LIMITS.askPerWindow; i++) assert.equal(room.checkAsk(m, `질문 ${i}`, E + i).ok, true);
  assert.equal(room.checkAsk(m, '또', E + 100).code, 'too_many');
  assert.equal(room.checkAsk(m, '나중에', E + LIMITS.askWindowMs + 100).ok, true);
  m.askBusy = true;
  assert.equal(room.checkAsk(m, '바쁨', E + LIMITS.askWindowMs + 200).code, 'busy');
});

test('cheers only accept whitelisted emoji', () => {
  const room = new Room(SHOPS.weight, { epoch: E });
  const m = room.join({ nick: 'c' });
  assert.equal(room.checkCheer(m, '<script>', E), false);
  assert.equal(room.checkCheer(m, '💪', E), true);
  assert.equal(room.checkCheer(m, '🔥', E + 100), false);
});

test('coach mentions', () => {
  assert.equal(extractCoachMention('@쌤 스쿼트 할 때 무릎 아파요'), '스쿼트 할 때 무릎 아파요');
  assert.equal(extractCoachMention('쌤, 플랭크 몇 초?'), '플랭크 몇 초?');
  assert.equal(extractCoachMention('@부리부리 쌤 안녕'), '안녕');
  assert.equal(extractCoachMention('부리부리쌤 호흡은?'), '호흡은?');
  assert.equal(extractCoachMention('@쌤'), null);
  assert.equal(extractCoachMention('쌤님 최고'), '님 최고');
  assert.equal(extractCoachMention('오늘 쌤 멋있다'), null);
});

test('cleanText strips control and bidi characters', () => {
  assert.equal(cleanText('a\u202eb\u0007c', 10), 'a b c');
});

test('offline coach answers safety questions first', () => {
  const room = new Room(SHOPS.weight, { epoch: E });
  const p = room.phase(E + 1000);
  assert.match(offlineAnswer('허리가 찌릿하게 아파요', p), /병원/);
  assert.match(offlineAnswer('뭐야', p), new RegExp(p.exercise.name.replace(/[()]/g, '\\$&')));
});
