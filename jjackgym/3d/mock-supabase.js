// 시험용 가짜 Supabase: 같은 브라우저 컨텍스트의 탭끼리 BroadcastChannel로 Realtime을 흉내낸다.
(() => {
  window.ONLINE_GYM_SUPABASE = { url: 'https://example.invalid', anonKey: 'test' };
  window.supabase = {
    createClient: () => ({
      channel(name, opts) {
        const me = opts.config.presence.key, bc = new BroadcastChannel(`supa-${name}`), state = {}, handlers = { presence: [], broadcast: [] };
        let mine = null;
        const fire = (event, key) => { for (const h of handlers.presence) if (h.filter.event === event) h.fn({ key }); };
        bc.onmessage = ({ data }) => {
          if (data.k === 'track') { state[data.key] = [{ ...data.value, presence_ref: 'x' }]; fire('join', data.key); }
          if (data.k === 'hello' && mine) bc.postMessage({ k: 'track', key: me, value: mine });
          if (data.k === 'bye') { delete state[data.key]; fire('leave', data.key); }
          if (data.k === 'send') for (const h of handlers.broadcast) if (h.filter.event === data.event) h.fn({ event: data.event, payload: data.payload });
        };
        addEventListener('beforeunload', () => bc.postMessage({ k: 'bye', key: me }));
        return {
          on(type, filter, fn) { handlers[type].push({ filter, fn }); return this; },
          subscribe(cb) { setTimeout(() => { bc.postMessage({ k: 'hello' }); cb('SUBSCRIBED'); }, 50); return this; },
          track(value) { mine = value; state[me] = [{ ...value, presence_ref: 'x' }]; bc.postMessage({ k: 'track', key: me, value }); return Promise.resolve('ok'); },
          send(m) { bc.postMessage({ k: 'send', event: m.event, payload: m.payload }); return Promise.resolve('ok'); },
          presenceState: () => state,
        };
      },
    }),
  };
})();
