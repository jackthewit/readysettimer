import { randomUUID } from 'node:crypto';
import { phaseAt, buildSegments, chatOpen } from './schedule.js';

export const COLORS = ['orange', 'pink', 'sky', 'mint', 'purple', 'red'];
export const CHEERS = ['💪', '🔥', '👏', '🐥', '💦'];

export const LIMITS = {
  nick: 12,
  chat: 140,
  ask: 300,
  history: 40,
  chatGapMs: 800,
  cheerGapMs: 1200,
  askWindowMs: 10 * 60 * 1000,
  askPerWindow: 15,
};

/** 제어문자 제거 + 공백 정리 + 코드포인트 기준 길이 제한 */
export function cleanText(input, max) {
  const s = String(input ?? '')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [...s].slice(0, max).join('');
}

/** "@쌤 …", "쌤, …", "@부리부리 …" 로 시작하면 공개 질문으로 본다. */
export function extractCoachMention(text) {
  const m = text.match(/^(?:@\s*(?:쌤|부리부리(?:\s*쌤)?)|부리부리\s*쌤|쌤)\s*[,:!?~]*\s*(.*)$/u);
  if (!m) return null;
  const q = m[1].trim();
  return q.length ? q : null;
}

export class Room {
  constructor(shop, { epoch = Date.now(), maxMembers = 50 } = {}) {
    this.shop = shop;
    this.epoch = epoch;
    this.maxMembers = maxMembers;
    this.segs = buildSegments(shop);
    this.members = new Map();
    this.history = [];
    this.coachBusy = false;
  }

  phase(now = Date.now()) {
    return phaseAt(this.shop, this.epoch, now, this.segs);
  }

  join({ nick, color }) {
    if (this.members.size >= this.maxMembers) {
      const err = new Error('방이 꽉 찼어요. 잠시 후 다시 시도해 주세요.');
      err.code = 'full';
      throw err;
    }
    const name = cleanText(nick, LIMITS.nick) || '익명 짹짹이';
    const used = new Set([...this.members.values()].map((m) => m.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    const member = {
      id: randomUUID(),
      nick: name,
      color: COLORS.includes(color) ? color : COLORS[0],
      slot,
      joinedAt: Date.now(),
      lastChatAt: 0,
      lastCheerAt: 0,
      askTimes: [],
      askBusy: false,
      ptHistory: [],
    };
    this.members.set(member.id, member);
    return member;
  }

  leave(id) {
    return this.members.delete(id);
  }

  publicMember(m) {
    return { id: m.id, nick: m.nick, color: m.color, slot: m.slot };
  }

  roster() {
    return [...this.members.values()].map((m) => this.publicMember(m));
  }

  /** 채팅 규칙 검사. 통과하면 { ok: true, text } */
  checkChat(member, raw, now = Date.now()) {
    const p = this.phase(now);
    if (!chatOpen(p)) {
      return {
        ok: false,
        code: 'chat_locked',
        message: '세트 중엔 운동에 집중! 쉬는 시간에 채팅할 수 있어요.',
        opensAt: p.endsAt,
      };
    }
    const text = cleanText(raw, LIMITS.chat);
    if (!text) return { ok: false, code: 'empty', message: '메시지를 입력해 주세요.' };
    if (now - member.lastChatAt < LIMITS.chatGapMs) {
      return { ok: false, code: 'slow_down', message: '조금 천천히 보내 주세요.' };
    }
    member.lastChatAt = now;
    return { ok: true, text };
  }

  checkCheer(member, emoji, now = Date.now()) {
    if (!CHEERS.includes(emoji)) return false;
    if (now - member.lastCheerAt < LIMITS.cheerGapMs) return false;
    member.lastCheerAt = now;
    return true;
  }

  /** PT 쌤 개인 질문 한도 검사. 통과하면 { ok: true, text } */
  checkAsk(member, raw, now = Date.now()) {
    const text = cleanText(raw, LIMITS.ask);
    if (!text) return { ok: false, code: 'empty', message: '질문을 입력해 주세요.' };
    if (member.askBusy) return { ok: false, code: 'busy', message: '쌤이 아직 답하는 중이에요.' };
    member.askTimes = member.askTimes.filter((t) => now - t < LIMITS.askWindowMs);
    if (member.askTimes.length >= LIMITS.askPerWindow) {
      return { ok: false, code: 'too_many', message: '질문이 너무 많아요! 10분 뒤에 다시 물어봐 주세요.' };
    }
    member.askTimes.push(now);
    return { ok: true, text };
  }

  pushHistory(msg) {
    this.history.push(msg);
    if (this.history.length > LIMITS.history) this.history.splice(0, this.history.length - LIMITS.history);
  }
}
