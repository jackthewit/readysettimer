// 방마다 하나의 공용 시계. 서버 시작 시각(epoch)부터 결정적으로 계산하므로
// 누가 언제 들어와도 같은 세트·같은 쉬는 시간을 함께 보낸다.
//
// 한 라운드 = [운동1 세트, 운동1 휴식, 운동2 세트, ..., 마지막 세트, 라운드 휴식]

export function buildSegments(shop) {
  const segs = [];
  shop.routine.forEach((ex, idx) => {
    const last = idx === shop.routine.length - 1;
    segs.push({ phase: 'work', idx, dur: shop.work * 1000 });
    segs.push({ phase: last ? 'break' : 'rest', idx, dur: (last ? shop.roundBreak : shop.rest) * 1000 });
  });
  return segs;
}

export function phaseAt(shop, epoch, now, segs = buildSegments(shop)) {
  const cycle = segs.reduce((s, x) => s + x.dur, 0);
  const elapsed = Math.max(0, now - epoch);
  const round = Math.floor(elapsed / cycle) + 1;
  let t = elapsed % cycle;
  let start = now - t;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (t < seg.dur) {
      // 세트 중이면 '이 다음 동작', 쉬는 중이면 '곧 시작할 동작' — 둘 다 idx + 1
      const nextIdx = (seg.idx + 1) % shop.routine.length;
      return {
        round,
        seg: i,
        phase: seg.phase,
        idx: seg.idx,
        total: shop.routine.length,
        startedAt: start,
        endsAt: start + seg.dur,
        exercise: shop.routine[seg.idx],
        next: shop.routine[nextIdx],
        key: `${round}:${i}`,
      };
    }
    t -= seg.dur;
    start += seg.dur;
  }
  /* c8 ignore next */
  throw new Error('unreachable');
}

/** 세트 중에는 채팅 금지. 쉬는 시간(rest)과 라운드 휴식(break)에만 허용. */
export const chatOpen = (p) => p.phase !== 'work';
