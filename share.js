/* =========================================================
   ReadySetTimer — social share row
   - Auto-injects a share bar on every page (main / landing / legal)
   - Buttons: Facebook, X (Twitter), LINE, KakaoTalk, Copy link, Native share
   - Uses current page URL + <title> + meta description
   - Multilingual labels via <html lang> attribute
   - Inserted right before the site footer so it feels part of the flow
   ========================================================= */

(() => {
  'use strict';

  const L10N = {
    share:   { ko: '공유',       en: 'Share',    ja: 'シェア',    zh: '分享',       es: 'Compartir',   pt: 'Compartilhar', fr: 'Partager',  de: 'Teilen' },
    fb:      { ko: '페이스북',    en: 'Facebook', ja: 'Facebook',  zh: 'Facebook',   es: 'Facebook',    pt: 'Facebook',     fr: 'Facebook',  de: 'Facebook' },
    x:       { ko: 'X (트위터)',  en: 'X',        ja: 'X',         zh: 'X',          es: 'X',           pt: 'X',            fr: 'X',         de: 'X' },
    line:    { ko: '라인',        en: 'LINE',     ja: 'LINE',      zh: 'LINE',       es: 'LINE',        pt: 'LINE',         fr: 'LINE',      de: 'LINE' },
    kakao:   { ko: '카카오톡',    en: 'KakaoTalk', ja: 'KakaoTalk', zh: 'KakaoTalk', es: 'KakaoTalk',   pt: 'KakaoTalk',    fr: 'KakaoTalk', de: 'KakaoTalk' },
    copy:    { ko: '링크 복사',   en: 'Copy link', ja: 'リンクコピー', zh: '复制链接', es: 'Copiar enlace', pt: 'Copiar link', fr: 'Copier le lien', de: 'Link kopieren' },
    more:    { ko: '더보기',      en: 'More',     ja: 'その他',     zh: '更多',       es: 'Más',         pt: 'Mais',         fr: 'Plus',      de: 'Mehr' },
    copied:  { ko: '링크가 복사됐어요',            en: 'Link copied',        ja: 'リンクをコピーしました', zh: '已复制链接',
               es: 'Enlace copiado',              pt: 'Link copiado',       fr: 'Lien copié',         de: 'Link kopiert' },
    kkHint:  { ko: '복사됐어요 · 카카오톡에 붙여넣기', en: 'Copied — paste in KakaoTalk',
               ja: 'コピーしました · LINE/KakaoTalkに貼り付け', zh: '已复制 — 粘贴到 KakaoTalk',
               es: 'Copiado — pega en KakaoTalk', pt: 'Copiado — cole no KakaoTalk',
               fr: 'Copié — collez dans KakaoTalk', de: 'Kopiert — in KakaoTalk einfügen' },
  };

  function getLang() {
    const attr = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
    return L10N.share[attr] ? attr : 'en';
  }
  const t = (key) => L10N[key]?.[getLang()] ?? L10N[key]?.en ?? key;

  function injectStyles() {
    if (document.getElementById('rst-share-styles')) return;
    const style = document.createElement('style');
    style.id = 'rst-share-styles';
    style.textContent = `
      .rst-share {
        display: flex; align-items: center; gap: 8px;
        justify-content: center; flex-wrap: wrap;
        margin: 18px auto 8px;
        padding: 0 16px;
      }
      .rst-share .rst-share-label {
        color: var(--ink-faint, #54667c);
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-right: 4px;
      }
      .rst-share-btn {
        position: relative;
        display: grid; place-items: center;
        width: 40px; height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        color: var(--ink, #e6eef7);
        text-decoration: none !important;
        transition: transform .15s cubic-bezier(.22,1,.36,1), background .2s, border-color .2s, color .2s;
        cursor: pointer;
        padding: 0;
        font-family: inherit;
      }
      .rst-share-btn:hover { transform: translateY(-2px); }
      .rst-share-btn svg { width: 18px; height: 18px; }
      .rst-share-btn.sf:hover { background: #1877F2; border-color: #1877F2; color: #fff; }
      .rst-share-btn.sx:hover { background: #000; border-color: #111; color: #fff; }
      .rst-share-btn.sl:hover { background: #06C755; border-color: #06C755; color: #fff; }
      .rst-share-btn.sk:hover { background: #FEE500; border-color: #FEE500; color: #3C1E1E; }
      .rst-share-btn.sc:hover { background: var(--accent, #22d3ee); border-color: var(--accent, #22d3ee); color: #0b0f17; }
      .rst-share-btn.ss:hover { background: #818cf8; border-color: #818cf8; color: #0b0f17; }
      .rst-share-flash {
        position: absolute;
        bottom: calc(100% + 8px); left: 50%;
        transform: translateX(-50%) translateY(4px);
        background: rgba(10, 14, 22, 0.96);
        border: 1px solid rgba(255,255,255,0.16);
        color: var(--ink, #e6eef7);
        font-size: 11px;
        padding: 6px 10px;
        border-radius: 8px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s, transform .2s;
        z-index: 20;
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      }
      .rst-share-flash.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      @media (max-width: 480px) {
        .rst-share { gap: 6px; margin-top: 14px; }
        .rst-share-btn { width: 38px; height: 38px; }
        .rst-share-btn svg { width: 17px; height: 17px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .rst-share-btn { transition: none; }
        .rst-share-btn:hover { transform: none; }
      }
    `;
    document.head.appendChild(style);
  }

  const ICONS = {
    fb:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.4 21.5v-8.1h2.7l.4-3.2h-3.1V8.2c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3-.1-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H7.5v3.2h2.8v8.1h3.1z"/></svg>',
    x:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.3l-7.2 8.22L22.5 21.7h-6.6l-5.16-6.77-5.9 6.77H1.53l7.7-8.8L1.5 2.24h6.76l4.66 6.17 5.32-6.17zm-1.16 17.4h1.82L6.95 4.17H5l12.08 15.48z"/></svg>',
    line:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 5.58 2 9.99c0 3.95 3.58 7.26 8.42 7.88.32.07.76.22.87.49.1.25.07.64.03.89l-.14.85c-.04.25-.2.98.86.54 1.06-.45 5.74-3.38 7.83-5.79 1.44-1.58 2.13-3.19 2.13-4.98C22 5.58 17.5 2 12 2zM8.4 12.4H6.36c-.23 0-.42-.19-.42-.42V8.38c0-.23.19-.42.42-.42s.42.19.42.42v3.18h1.62c.23 0 .42.19.42.42s-.19.42-.42.42zm2.35-.42c0 .23-.19.42-.42.42s-.42-.19-.42-.42V8.38c0-.23.19-.42.42-.42s.42.19.42.42v3.6zm4.07 0c0 .18-.12.34-.29.4-.04.01-.09.02-.13.02-.13 0-.26-.06-.34-.17l-2.07-2.82v2.57c0 .23-.19.42-.42.42s-.42-.19-.42-.42V8.38c0-.18.12-.34.29-.4.04-.01.09-.02.13-.02.13 0 .25.07.34.17l2.07 2.82V8.38c0-.23.19-.42.42-.42s.42.19.42.42v3.6zm3.3-2.22c.23 0 .42.19.42.42s-.19.42-.42.42H16.5v1.05h1.62c.23 0 .42.19.42.42s-.19.42-.42.42h-2.04c-.23 0-.42-.19-.42-.42V8.38c0-.23.19-.42.42-.42h2.04c.23 0 .42.19.42.42s-.19.42-.42.42H16.5v1.05h1.62z"/></svg>',
    kakao: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.2C6.78 3.2 2.55 6.5 2.55 10.6c0 2.62 1.76 4.92 4.42 6.24l-1 3.38c-.08.29.24.52.5.34l4.12-2.69c.47.05.94.07 1.41.07 5.22 0 9.45-3.3 9.45-7.34S17.22 3.2 12 3.2z"/></svg>',
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
  };

  function flash(btn, msg) {
    let el = btn.querySelector('.rst-share-flash');
    if (!el) {
      el = document.createElement('span');
      el.className = 'rst-share-flash';
      btn.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(btn._flashT);
    btn._flashT = setTimeout(() => el.classList.remove('show'), 1700);
  }

  function build() {
    const urlObj = new URL(location.href);
    // strip query params (they're app state like ?t=5m) — share the canonical page URL
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const url = canonical || (urlObj.origin + urlObj.pathname);
    const title = document.title || 'ReadySetTimer';
    const desc = document.querySelector('meta[name="description"]')?.content || '';
    const text = desc.slice(0, 140) || title;

    const encURL = encodeURIComponent(url);
    const encText = encodeURIComponent(title);

    const row = document.createElement('div');
    row.className = 'rst-share';
    row.setAttribute('aria-label', t('share'));

    const lbl = document.createElement('span');
    lbl.className = 'rst-share-label';
    lbl.textContent = t('share');
    row.appendChild(lbl);

    // Facebook
    const fb = document.createElement('a');
    fb.className = 'rst-share-btn sf';
    fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encURL}`;
    fb.target = '_blank'; fb.rel = 'noopener';
    fb.title = t('fb');
    fb.setAttribute('aria-label', `${t('share')} · ${t('fb')}`);
    fb.innerHTML = ICONS.fb;
    row.appendChild(fb);

    // X (Twitter)
    const x = document.createElement('a');
    x.className = 'rst-share-btn sx';
    x.href = `https://twitter.com/intent/tweet?url=${encURL}&text=${encText}`;
    x.target = '_blank'; x.rel = 'noopener';
    x.title = t('x');
    x.setAttribute('aria-label', `${t('share')} · X`);
    x.innerHTML = ICONS.x;
    row.appendChild(x);

    // LINE
    const ln = document.createElement('a');
    ln.className = 'rst-share-btn sl';
    ln.href = `https://social-plugins.line.me/lineit/share?url=${encURL}&text=${encText}`;
    ln.target = '_blank'; ln.rel = 'noopener';
    ln.title = t('line');
    ln.setAttribute('aria-label', `${t('share')} · LINE`);
    ln.innerHTML = ICONS.line;
    row.appendChild(ln);

    // KakaoTalk — try native share, fall back to clipboard (Kakao has no
    // reliable JS-free share URL; a full integration requires the Kakao SDK
    // and a registered app key, which can be added later without changing
    // this button)
    const kk = document.createElement('button');
    kk.type = 'button';
    kk.className = 'rst-share-btn sk';
    kk.title = t('kakao');
    kk.setAttribute('aria-label', `${t('share')} · ${t('kakao')}`);
    kk.innerHTML = ICONS.kakao;
    kk.addEventListener('click', async () => {
      try {
        if (navigator.share) {
          await navigator.share({ url, title, text });
        } else {
          await navigator.clipboard.writeText(url);
          flash(kk, t('kkHint'));
        }
      } catch { /* user cancelled, or clipboard unavailable */ }
    });
    row.appendChild(kk);

    // Copy link
    const cp = document.createElement('button');
    cp.type = 'button';
    cp.className = 'rst-share-btn sc';
    cp.title = t('copy');
    cp.setAttribute('aria-label', t('copy'));
    cp.innerHTML = ICONS.copy;
    cp.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        flash(cp, t('copied'));
      } catch {
        // very old browsers — fallback to manual selection
        const ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); flash(cp, t('copied')); } catch {}
        ta.remove();
      }
    });
    row.appendChild(cp);

    // Native share (mobile/desktop with Web Share API) — "More…"
    if (navigator.share) {
      const ns = document.createElement('button');
      ns.type = 'button';
      ns.className = 'rst-share-btn ss';
      ns.title = t('more');
      ns.setAttribute('aria-label', `${t('share')} · ${t('more')}`);
      ns.innerHTML = ICONS.share;
      ns.addEventListener('click', async () => {
        try { await navigator.share({ url, title, text }); } catch {}
      });
      row.appendChild(ns);
    }

    return row;
  }

  function mount() {
    injectStyles();
    const row = build();

    // Priority: explicit mount point > before .legal-foot > at top of .site-foot
    const explicit = document.querySelector('#share-mount');
    if (explicit) { explicit.appendChild(row); return; }

    const legalFoot = document.querySelector('.legal-foot');
    if (legalFoot) { legalFoot.parentNode.insertBefore(row, legalFoot); return; }

    const siteFoot = document.querySelector('.site-foot');
    if (siteFoot) { siteFoot.insertBefore(row, siteFoot.firstChild); return; }

    // fallback: append to body
    document.body.appendChild(row);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
