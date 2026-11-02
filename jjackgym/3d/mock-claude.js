// 테스트용 가짜 window.claude: 같은 브라우저 컨텍스트의 탭끼리 BroadcastChannel로 room을 흉내낸다.
(() => {
  const peer = Math.random().toString(36).slice(2, 10);
  const ch = new BroadcastChannel('jg-room');
  const peers = new Map(); // peer -> presence
  let mine = {};
  const peerL = [], topicL = {};
  let snap = [];
  const rebuild = () => {
    snap = Object.freeze([
      Object.freeze({ peer, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: Object.freeze({ ...mine }), updatedAt: Date.now() }),
      ...[...peers].map(([p, pr]) => Object.freeze({ peer: p, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: Object.freeze(pr), updatedAt: Date.now() })),
    ]);
    const change = { peers: snap, joined: [], left: [], updated: [] };
    for (const f of peerL) setTimeout(() => f(change));
  };
  ch.onmessage = ({ data }) => {
    if (data.k === 'p') { peers.set(data.peer, data.presence); rebuild(); }
    if (data.k === 'hello') ch.postMessage({ k: 'p', peer, presence: mine });
    if (data.k === 'bye') { peers.delete(data.peer); rebuild(); }
    if (data.k === 'e') for (const f of topicL[data.topic] || []) f({ topic: data.topic, data: data.data, peer: data.peer, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false });
  };
  addEventListener('beforeunload', () => ch.postMessage({ k: 'bye', peer }));
  const room = {
    presence(patch) {
      for (const [k, v] of Object.entries(patch)) { if (v === null) delete mine[k]; else mine[k] = v; }
      ch.postMessage({ k: 'p', peer, presence: mine });
      rebuild();
      return Promise.resolve();
    },
    peers: () => snap,
    onPeers(f) { peerL.push(f); setTimeout(() => f({ peers: snap, joined: snap, left: [], updated: [] })); return () => {}; },
    on(topic, f) { (topicL[topic] ||= []).push(f); return () => {}; },
    emit(topic, data) {
      ch.postMessage({ k: 'e', topic, data, peer });
      for (const f of topicL[topic] || []) setTimeout(() => f({ topic, data, peer, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false }));
      return Promise.resolve();
    },
    connected: () => true,
  };
  const sample = async (turns, opts) => {
    const q = turns.at(-1).content;
    const ans = q.includes('레그프레스') ? '레그프레스는 무릎이 발끝 방향으로 가야 해! 허리가 등받이에서 뜨지 않게 엉덩이로 밀어~' : '좋아! 허리 말고 엉덩이로 움직이는 느낌을 찾아봐~';
    let t = '';
    for (const piece of ans.match(/.{1,5}/gsu)) { await new Promise((r) => setTimeout(r, 30)); t += piece; opts?.onText?.({ text: t, delta: piece }); }
    return { text: t, truncated: false, modelTierApplied: 'quick' };
  };
  window.claude = { use: (n) => Promise.resolve(n === 'room' ? room : n === 'sample' ? sample : null) };
  ch.postMessage({ k: 'hello' });
  rebuild();
})();
