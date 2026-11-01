import Anthropic from '@anthropic-ai/sdk';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// AI PT '부리부리 쌤'.
// - ANTHROPIC_API_KEY(또는 `ant auth login` 프로필)가 있으면 Claude가 답한다.
// - 없거나 PT_AI=off 이면 키워드 기반 오프라인 답변으로 대신한다 (로컬 개발용).

const MODEL = process.env.PT_MODEL || 'claude-opus-5-5';
const PHASE_LABEL = { work: '세트 중', rest: '쉬는 시간', break: '라운드 휴식' };

function systemPrompt(shop) {
  const list = shop.routine.map((r, i) => `${i + 1}. ${r.name} — "${r.cue}"`).join('\n');
  return `너는 온라인 헬스장 '짹짹이 바른자세 스튜디오'의 PT 쌤 '부리부리'야.
흰 새 캐릭터에 뾰족한 검은 머리, 늘 팔짱을 끼고 있지만 회원들을 진심으로 아끼는 트레이너야.
회원들은 '짹짹이'라고 불러. 지금 너는 ${shop.name}(${shop.tagline}) 수업을 맡고 있어.

오늘 루틴 (세트 ${shop.work}초 / 쉬는 시간 ${shop.rest}초):
${list}

스튜디오 철학:
- 아픈 곳만 주무르지 말고 직접 움직이게 한다. ("목이 뻣뻣하다고 목만 주무르지 마!")
- 허리가 할 일을 대신하지 않게 고관절·엉덩이를 쓰고, 목 대신 등(흉추)을 움직인다.
- 무리해서 억지로 하지 않는다. 가동 범위 안에서 천천히, 호흡은 참지 않는다.

답하는 방식:
- 반말로 친근하고 짧게. 2~4문장, 길어도 250자 안쪽. 채팅 말풍선에 그대로 뜨니까 마크다운·목록 기호·이모지 남발 금지.
- 동작 질문엔 핵심 자세 포인트 1~2개와 흔한 실수 1개를 짚어 줘. 쉬운 대체 동작이 있으면 알려 줘.
- 메시지 앞의 [지금 상황]은 스튜디오가 붙여 주는 정보야. 지금 하는 동작과 연결해서 답하면 좋아.
- 날카로운 통증, 저림, 부상, 수술 이력, 임신, 질환 같은 얘기가 나오면 진단하지 말고 그 동작은 멈추라고 한 뒤 병원·전문가 상담을 권해.
- 운동·자세·건강 습관과 상관없는 질문은 가볍게 한마디 받아 주고 운동 얘기로 데려와.
- 너는 AI 트레이너라는 걸 숨기지 않아. 물어보면 솔직하게 말해.`;
}

function contextNote({ shop, phase, nick }) {
  const pos = `${phase.idx + 1}/${phase.total}`;
  const label = PHASE_LABEL[phase.phase] || phase.phase;
  const now = phase.phase === 'work'
    ? `${label} — ${phase.exercise.name} (${pos})`
    : `${label} — 방금 ${phase.exercise.name} 끝, 다음은 ${phase.next.name}`;
  return `[지금 상황] ${shop.name} · ${now} · 질문한 짹짹이: ${nick}`;
}

// ---------------------------------------------------------------- offline

const OFFLINE_RULES = [
  [/통증|아파|아프|저려|저림|찌릿|부상|다쳤/, '아픈 데가 있으면 그 동작은 바로 멈추자! 날카롭게 아프거나 저리면 참지 말고 병원에서 꼭 확인받아. 오늘은 통증 없는 범위에서만 천천히~'],
  [/허리/, '허리가 할 일을 대신하지 않게 하는 게 핵심이야! 허리를 숙이는 게 아니라 고관절을 접는 느낌, 엉덩이로 움직여봐.'],
  [/목|뒷목|거북/, '목이 뻣뻣하다고 목만 주무르지 마! 목부터 등까지 같이 움직여야 해. 흉추 회전이랑 캣/카우 같이 해보자~'],
  [/무릎/, '무릎은 발끝 방향이랑 같이 가야 해. 안으로 모이면 안 돼! 엉덩이를 뒤로 빼면서 앉으면 무릎 부담이 줄어~'],
  [/어깨|승모|날개/, '어깨가 귀 쪽으로 으쓱 올라가면 안 돼! 날개뼈를 살짝 아래 뒤로 모은 상태로 움직여봐.'],
  [/호흡|숨/, '숨은 절대 참지 마! 힘 쓸 때 내쉬고 돌아올 때 들이마셔. 갈비뼈를 옆으로 넓히는 느낌~'],
  [/몇\s*(번|개|회|세트)|횟수|반복/, '세트 시간 동안 자세가 무너지지 않는 만큼만 해! 개수보다 자세가 먼저야. 마지막 2~3개가 살짝 힘든 정도면 딱 좋아.'],
  [/스쿼트/, '스쿼트는 엉덩이를 뒤로 빼면서 앉고, 무릎은 발끝 방향! 가슴은 활짝 열고 발바닥 전체로 바닥을 밀어.'],
  [/데드|힙힌지|힌지/, '허리 말고 고관절을 접어! 무게는 몸에 가까이 붙이고, 엉덩이로 뒷벽을 찾는 느낌이야.'],
  [/플랭크/, '엉덩이 들지 말고 배꼽 당겨! 어깨는 팔꿈치 바로 위, 숨은 계속 쉬어야 해~'],
  [/브릿지/, '허리로 들어 올리지 말고 엉덩이로 밀어 올려! 갈비뼈가 들리지 않게 배에 힘 살짝~'],
  [/안녕|하이|반가/, '어서 와 짹짹이! 오늘도 바른 자세로 같이 움직여보자~ 궁금한 거 있으면 언제든 물어봐!'],
  [/누구|ai|AI|사람|로봇/, '나는 짹짹이 스튜디오의 AI PT 부리부리야! 팔짱은 끼고 있지만 질문은 다 받아줄게~'],
];

export function offlineAnswer(question, phase) {
  for (const [re, ans] of OFFLINE_RULES) if (re.test(question)) return ans;
  const ex = phase.phase === 'work' ? phase.exercise : phase.next;
  return `지금 ${phase.phase === 'work' ? '하는' : '다음'} 동작은 '${ex.name}'이야. 포인트는 이거! "${ex.cue}" 더 궁금한 건 구체적으로 물어봐~`;
}

// ---------------------------------------------------------------- Claude

const env = process.env;
const hasCredentials = Boolean(
  env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE ||
  env.ANTHROPIC_FEDERATION_RULE_ID || existsSync(join(homedir(), '.config', 'anthropic')),
);

let client = null;
let aiDisabledReason = env.PT_AI === 'off' ? 'PT_AI=off' : hasCredentials ? null : 'ANTHROPIC_API_KEY 없음';
let useFallbacks = true;

function getClient() {
  if (!client) client = new Anthropic({ maxRetries: 1, timeout: 60_000 });
  return client;
}

export function aiStatus() {
  return aiDisabledReason ? { ai: false, reason: aiDisabledReason } : { ai: true, model: MODEL };
}

/**
 * 부리부리 쌤에게 질문한다. 답을 조각 단위로 onDelta에 흘려보내고, 최종 텍스트를 돌려준다.
 * @param {object} o
 * @param {object} o.shop        SHOPS 항목
 * @param {object} o.phase       phaseAt() 결과
 * @param {string} o.nick        질문자 닉네임
 * @param {string} o.question    질문 (정제된 텍스트)
 * @param {Array}  [o.history]   이전 PT 대화 ({role, content}[])
 * @param {(t:string)=>void} o.onDelta
 * @param {AbortSignal} [o.signal]
 */
export async function askCoach({ shop, phase, nick, question, history = [], onDelta, signal }) {
  const userContent = `${contextNote({ shop, phase, nick })}\n\n${question}`;
  const offline = () => {
    const text = offlineAnswer(question, phase);
    onDelta(text);
    return { text, userContent, source: 'offline' };
  };
  if (aiDisabledReason) return offline();

  const request = {
    model: MODEL,
    max_tokens: 4000,
    // 채팅이라 지연이 중요하다 → 낮은 effort
    output_config: { effort: 'low' },
    // 샵별 시스템 프롬프트는 고정 → 자동 프롬프트 캐싱
    cache_control: { type: 'ephemeral' },
    system: systemPrompt(shop),
    messages: [...history, { role: 'user', content: userContent }],
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    let sent = '';
    try {
      const params = useFallbacks
        ? { ...request, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }
        : request;
      const stream = useFallbacks
        ? getClient().beta.messages.stream(params, { signal })
        : getClient().messages.stream(params, { signal });

      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
          sent += ev.delta.text;
          onDelta(ev.delta.text);
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        const msg = '음… 그건 내가 답하기 어려운 질문이야. 우리 자세 얘기로 돌아가 볼까?';
        onDelta((sent ? '\n' : '') + msg);
        return { text: msg, userContent, source: 'refusal' };
      }
      return { text: sent.trim(), userContent, source: 'ai' };
    } catch (err) {
      if (signal?.aborted || err instanceof Anthropic.APIUserAbortError) throw err;
      if (sent) {
        // 이미 일부를 흘려보냈다면 이어 붙여서 마무리
        const tail = ' …앗, 쌤 말이 끊겼네! 다시 물어봐 줄래?';
        onDelta(tail);
        return { text: sent + tail, userContent, source: 'partial' };
      }
      if (err instanceof Anthropic.BadRequestError && useFallbacks) {
        // fallbacks 파라미터를 받지 않는 환경이면 끄고 한 번 더
        console.warn('[coach] fallbacks rejected, retrying without:', err.message);
        useFallbacks = false;
        continue;
      }
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        aiDisabledReason = 'API 인증 실패';
        console.warn('[coach] auth failed — switching to offline answers:', err.message);
      } else if (err instanceof Anthropic.RateLimitError) {
        const msg = '쌤한테 질문이 몰려서 잠깐 숨 고르는 중! 조금 있다가 다시 물어봐~';
        onDelta(msg);
        return { text: msg, userContent, source: 'ratelimit' };
      } else if (err instanceof Anthropic.APIError) {
        console.warn(`[coach] API error ${err.status}:`, err.message);
      } else {
        console.warn('[coach] error:', err?.message || err);
        // 자격 증명이 아예 없는 경우 등 — 이후로는 오프라인 답변
        if (!(err instanceof Anthropic.APIConnectionError)) aiDisabledReason = String(err?.message || err).slice(0, 80);
      }
      return offline();
    }
  }
  return offline();
}
