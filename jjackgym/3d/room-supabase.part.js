// Vercel판 동시 접속: claude.ai의 room과 똑같은 모양으로 Supabase Realtime을 감싼다.
// 앱 코드는 그대로 두고 window.claude.use('room')만 이 구현으로 바뀐다. 설정이 없으면 아무것도 안 해서 혼자 모드로 돈다.
// 데이터베이스 표는 쓰지 않는다.
// Supabase의 presence는 자주 보내면 서버가 접속을 끊는다(Client presence rate limit). 그래서
// presence는 처음 한 번만 보내 드나듦을 알고, 내 상태(위치·기구 등)는 broadcast로 보낸다.
(() => {
  const cfg = window.ONLINE_GYM_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || !window.supabase) return;
  // 시험할 때는 실제 손님과 섞이지 않게 다른 방을 쓴다
  let isTest = false;
  try { isTest = localStorage.getItem('jg.fast') === '1'; } catch { /* 저장소 없음 */ }
  const BASE = isTest ? 'onlinegym-test' : 'onlinegym';
  const CAP = isTest && window.ONLINE_GYM_TEST_CAP ? window.ONLINE_GYM_TEST_CAP : 40; // 한 방 정원. 차 있으면 다음 방으로
  const MAX_CHANNELS = 100;
  const STATE_GAP_MS = 350;   // 내 상태는 이 간격으로 묶어서 보낸다
  const HEARTBEAT_MS = 10000; // 변화가 없어도 가끔 보내서 새로 온 사람과 맞춘다
  const STALE_MS = 75000;     // 이만큼 소식이 없으면 나간 것으로 본다 (내려 둔 탭은 신호가 느리다)

  const peer = Math.random().toString(36).slice(2, 12);
  const client = window.supabase.createClient(cfg.url, cfg.anonKey, { realtime: { params: { eventsPerSecond: 8 } } });
  let channel = null, chNo = 1, retryTimer = null;

  const mine = {};
  const others = new Map(); // peer → { presence, seen }
  let online = false, snapshot = [], stateTimer = null, lastSent = 0, lastJson = '', rebuildQueued = false;
  const peerListeners = [], topicListeners = {};

  function rebuildNow() {
    rebuildQueued = false;
    const me = Object.freeze({ peer, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: Object.freeze({ ...mine }), updatedAt: Date.now() });
    const list = [...others].map(([id, o]) => Object.freeze({ peer: id, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: o.presence, updatedAt: o.seen }));
    snapshot = Object.freeze([me, ...list]);
    for (const fn of peerListeners) fn({ peers: snapshot, joined: [], left: [], updated: [] });
  }
  // 신호가 몰려도 한 번에 묶어 처리
  function rebuild() {
    if (rebuildQueued) return;
    rebuildQueued = true;
    setTimeout(rebuildNow, 60);
  }
  function sendState(force) {
    stateTimer = null;
    const json = JSON.stringify(mine);
    if (!online || (!force && json === lastJson)) return;
    lastJson = json;
    lastSent = Date.now();
    channel.send({ type: 'broadcast', event: 'state', payload: { peer, presence: mine } }).catch(() => {});
  }
  function queueState() {
    if (stateTimer) return;
    stateTimer = setTimeout(sendState, Math.max(0, STATE_GAP_MS - (Date.now() - lastSent)));
  }
  function join(no, auto) {
    if (channel) { const old = channel; channel = null; if (online) old.send({ type: 'broadcast', event: 'bye', payload: { peer } }).catch(() => {}); client.removeChannel(old); }
    clearTimeout(retryTimer);
    online = false;
    others.clear();
    chNo = no;
    const ch = client.channel(`${BASE}-${no}`, { config: { presence: { key: peer }, broadcast: { self: false } } });
    channel = ch;
    ch.on('presence', { event: 'join' }, ({ key }) => {
      // 새로 온 사람에게 내 상태를 알려 준다 (여럿이 한꺼번에 보내지 않게 조금씩 늦춘다)
      if (key !== peer) setTimeout(() => { if (channel === ch) sendState(true); }, 200 + Math.random() * 800);
    });
    ch.on('presence', { event: 'leave' }, ({ key }) => { if (others.delete(key)) rebuild(); });
    ch.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (!payload || typeof payload.peer !== 'string' || payload.peer === peer || payload.peer.length > 40) return;
      if (!payload.presence || typeof payload.presence !== 'object' || JSON.stringify(payload.presence).length > 4096) return;
      others.set(payload.peer, { presence: Object.freeze({ ...payload.presence }), seen: Date.now() });
      rebuild();
    });
    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      if (!payload || typeof payload.topic !== 'string' || typeof payload.peer !== 'string' || payload.peer === peer) return;
      for (const fn of topicListeners[payload.topic] || []) fn({ topic: payload.topic, data: payload.data, peer: payload.peer, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false });
    });
    ch.on('broadcast', { event: 'bye' }, ({ payload }) => {
      if (payload && others.delete(payload.peer)) rebuild();
    });
    ch.subscribe((status) => {
      if (channel !== ch) return;
      online = status === 'SUBSCRIBED';
      if (online) {
        ch.track({ at: Date.now() }).catch(() => {}); // presence는 이 한 번만
        sendState(true);
        // 방이 차 있으면 다음 방으로
        if (auto) setTimeout(() => { if (channel === ch && others.size >= CAP && chNo < MAX_CHANNELS) join(chNo + 1, true); }, 2500);
      } else if (status !== 'JOINING') {
        // 끊기면 잠시 뒤 같은 방으로 다시
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => { if (channel === ch && !online) join(chNo, false); }, 4000);
      }
      rebuild();
    });
    rebuild();
  }
  addEventListener('pagehide', () => {
    if (online) channel.send({ type: 'broadcast', event: 'bye', payload: { peer } }).catch(() => {});
  });
  setInterval(() => {
    const now = Date.now();
    if (online && now - lastSent >= HEARTBEAT_MS) sendState(true);
    let gone = false;
    for (const [id, o] of others) if (now - o.seen > STALE_MS) { others.delete(id); gone = true; }
    if (gone) rebuild();
  }, 2000);
  join(1, true);

  const room = {
    presence(patch) {
      for (const [k, v] of Object.entries(patch)) { if (v === null) delete mine[k]; else mine[k] = v; }
      queueState();
      rebuild();
      return Promise.resolve();
    },
    peers: () => snapshot,
    onPeers(fn) {
      peerListeners.push(fn);
      setTimeout(() => fn({ peers: snapshot, joined: snapshot, left: [], updated: [] }));
      return () => {};
    },
    on(topic, fn) {
      (topicListeners[topic] ||= []).push(fn);
      return () => {};
    },
    emit(topic, data) {
      if (online) channel.send({ type: 'broadcast', event: 'msg', payload: { topic, data, peer } }).catch(() => {});
      // 내 메시지는 바로 내 화면에도 (claude.ai room의 echo와 같게)
      for (const fn of topicListeners[topic] || []) setTimeout(() => fn({ topic, data, peer, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false }));
      return Promise.resolve();
    },
    connected: () => online,
    channelInfo: () => ({ no: chNo, count: others.size + 1, max: MAX_CHANNELS }),
    setChannel: (no) => join(no, false),
  };
  rebuildNow();
  window.claude = { use: (name) => Promise.resolve(name === 'room' ? room : null) };
})();
