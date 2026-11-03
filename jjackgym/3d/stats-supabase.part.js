// Vercel판 접속 통계: 1분마다 이번 방문 기록을 Supabase의 gym_ping으로 보낸다.
// 방문자 번호는 브라우저에 만든 무작위 값이고, IP·이름·대화는 보내지 않는다.
// 시험(jg.fast)이나 자동 브라우저에서는 보내지 않는다. 관리자는 gym_stats로 모아 본다 (stats.mjs).
(() => {
  const cfg = window.ONLINE_GYM_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || navigator.webdriver) return;
  let vid = '';
  try {
    if (localStorage.getItem('jg.fast') === '1') return;
    vid = localStorage.getItem('jg.vid') || '';
    if (!/^[a-z0-9]{8,40}$/.test(vid)) { vid = (crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now()).replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 32); localStorage.setItem('jg.vid', vid); }
  } catch { vid = 'nostore'; }
  const newSid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));
  let sid = newSid(), hiddenAt = 0;
  const mobile = matchMedia('(pointer: coarse)').matches;
  let ref = '';
  try { const h = document.referrer ? new URL(document.referrer).hostname : ''; ref = h === location.hostname ? '' : h; } catch { /* 알 수 없음 */ }
  const PING_MS = 60000;

  function ping(final) {
    const v = window.__gymVisit?.();
    if (!v || !v.shop) return; // 아직 짐에 들어오지 않음
    fetch(`${cfg.url}/rest/v1/rpc/gym_ping`, {
      method: 'POST',
      keepalive: !!final,
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_sid: sid, p_vid: vid, p_shop: v.shop, p_mobile: mobile, p_ref: ref, p_reps: v.reps, p_sets: v.sets, p_work: v.work, p_pt: v.pt, p_gest: v.gest, p_stations: v.stations.slice(0, 60) }),
    }).catch(() => {});
  }
  // 처음엔 짐에 들어온 뒤 조금 있다가, 그다음은 1분마다. 내려 둔 탭은 보내지 않고, 10분 넘게 내려 뒀으면 새 방문
  setTimeout(() => ping(), 8000);
  setInterval(() => { if (document.visibilityState === 'visible') ping(); }, PING_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); ping(true); return; }
    if (hiddenAt && Date.now() - hiddenAt > 10 * 60000) sid = newSid(); // 오래 내려 뒀다 돌아오면 새 방문으로 센다
    hiddenAt = 0;
    ping();
  });
  addEventListener('pagehide', () => ping(true));
})();
