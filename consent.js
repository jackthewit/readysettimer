/* =========================================================
   ReadySetTimer — cookie/consent banner (Google Consent Mode v2)
   - Shows until the user makes a choice, then hidden permanently
   - Wires into gtag('consent', 'update', {...}) for AdSense + GA
   - Multilingual label based on <html lang>
   - Also re-openable via any element with class="rst-consent-open"
     (e.g. a "쿠키 설정" link in the footer)
   ========================================================= */

(() => {
  'use strict';

  const LS_KEY = 'rst:consent:v1';

  const L = {
    title:  { ko: '쿠키 · 개인정보 설정',     en: 'Cookies & Privacy',     ja: 'Cookie とプライバシー',
              zh: 'Cookie 与隐私',           es: 'Cookies y privacidad',  pt: 'Cookies e privacidade',
              fr: 'Cookies et confidentialité', de: 'Cookies & Datenschutz' },
    body:   { ko: '더 나은 경험과 광고·통계 분석을 위해 쿠키를 사용합니다. 동의하시면 Google AdSense·Analytics 쿠키가 활성화되고, 거부해도 서비스는 동일하게 동작합니다.',
              en: 'We use cookies to improve your experience and serve/measure ads. Agreeing enables Google AdSense & Analytics cookies; declining keeps the service working the same.',
              ja: 'ユーザー体験の向上と広告計測のため Cookie を使用します。同意いただくと Google AdSense / Analytics の Cookie が有効になります。拒否しても機能に影響はありません。',
              zh: '我们使用 Cookie 以改善体验并投放/衡量广告。同意后启用 Google AdSense 与 Analytics 的 Cookie;拒绝也不影响使用。',
              es: 'Usamos cookies para mejorar la experiencia y medir/servir anuncios. Al aceptar, se activan las cookies de Google AdSense y Analytics; si rechazas, el servicio sigue funcionando igual.',
              pt: 'Usamos cookies para melhorar a experiência e exibir/medir anúncios. Ao aceitar, ativamos cookies do Google AdSense e Analytics; se recusar, o serviço continua funcionando igual.',
              fr: "Nous utilisons des cookies pour améliorer l'expérience et mesurer/diffuser des publicités. Accepter active les cookies Google AdSense et Analytics ; refuser n'empêche pas l'usage.",
              de: 'Wir verwenden Cookies, um das Erlebnis zu verbessern und Anzeigen auszuspielen/zu messen. Zustimmung aktiviert Google-AdSense- und Analytics-Cookies; Ablehnung beeinträchtigt die Nutzung nicht.' },
    accept: { ko: '모두 동의',     en: 'Accept all',     ja: 'すべて同意',    zh: '全部同意',
              es: 'Aceptar todo',  pt: 'Aceitar tudo',   fr: 'Tout accepter', de: 'Alle akzeptieren' },
    reject: { ko: '필수만 허용',   en: 'Essential only', ja: '必要最低限のみ', zh: '仅必要项',
              es: 'Solo esencial', pt: 'Apenas essencial', fr: 'Essentiels uniquement', de: 'Nur notwendige' },
    more:   { ko: '자세히',        en: 'Learn more',     ja: '詳細',          zh: '了解更多',
              es: 'Más información', pt: 'Saiba mais',   fr: 'En savoir plus', de: 'Mehr erfahren' },
    policy: { ko: '/privacy.html', en: '/privacy.html' },
  };
  function lang() {
    const l = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
    return L.title[l] ? l : 'en';
  }
  const t = (k) => L[k]?.[lang()] ?? L[k]?.en ?? k;

  function injectStyles() {
    if (document.getElementById('rst-consent-styles')) return;
    const s = document.createElement('style');
    s.id = 'rst-consent-styles';
    s.textContent = `
      .rst-consent {
        position: fixed; left: 16px; right: 16px; bottom: 16px;
        max-width: 640px; margin: 0 auto;
        z-index: 9999;
        background: rgba(10, 14, 22, 0.96);
        color: var(--ink, #e6eef7);
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 16px;
        padding: 16px 18px;
        backdrop-filter: blur(14px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        font-family: inherit;
        animation: rst-consent-in .35s cubic-bezier(.22,1,.36,1);
      }
      @keyframes rst-consent-in {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .rst-consent h4 {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .rst-consent p {
        margin: 0 0 12px;
        font-size: 13px;
        line-height: 1.6;
        color: var(--ink-dim, #9fb0c4);
      }
      .rst-consent p a {
        color: var(--accent, #22d3ee);
        text-decoration: underline;
        text-decoration-color: color-mix(in oklab, var(--accent, #22d3ee) 40%, transparent);
      }
      .rst-consent-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .rst-consent-actions button {
        padding: 9px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        border: 1px solid var(--line, rgba(255,255,255,0.08));
        background: rgba(255,255,255,0.04);
        color: var(--ink, #e6eef7);
        transition: background .2s, border-color .2s, transform .15s;
      }
      .rst-consent-actions button:hover { background: rgba(255,255,255,0.08); }
      .rst-consent-actions button:active { transform: translateY(1px); }
      .rst-consent-actions .rst-consent-accept {
        background: var(--accent, #22d3ee);
        color: #0b0f17;
        border-color: transparent;
        box-shadow: 0 8px 20px color-mix(in oklab, var(--accent, #22d3ee) 30%, transparent);
      }
      .rst-consent-actions .rst-consent-accept:hover { filter: brightness(1.06); }
      @media (max-width: 520px) {
        .rst-consent { padding: 14px; border-radius: 14px; bottom: 10px; left: 10px; right: 10px; }
        .rst-consent h4 { font-size: 13px; }
        .rst-consent p { font-size: 12px; }
        .rst-consent-actions button { flex: 1 1 auto; padding: 10px 12px; font-size: 12.5px; }
      }
    `;
    document.head.appendChild(s);
  }

  function applyConsent(accepted) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: accepted ? 'granted' : 'denied',
        ad_user_data: accepted ? 'granted' : 'denied',
        ad_personalization: accepted ? 'granted' : 'denied',
        analytics_storage: accepted ? 'granted' : 'denied'
      });
    }
    // If accepted and AdSense script already loaded, push ad slots
    if (accepted && window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      try { window.adsbygoogle.push({}); } catch {}
    }
  }

  function save(accepted) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ accepted, ts: Date.now(), v: 1 }));
    } catch {}
    applyConsent(accepted);
  }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function closeBanner() {
    const el = document.querySelector('.rst-consent');
    if (el) el.remove();
  }

  function showBanner() {
    injectStyles();
    if (document.querySelector('.rst-consent')) return; // already shown
    const banner = document.createElement('div');
    banner.className = 'rst-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t('title'));
    banner.innerHTML = `
      <h4>${t('title')}</h4>
      <p>${t('body')} <a href="${L.policy[lang()] || L.policy.en}">${t('more')} →</a></p>
      <div class="rst-consent-actions">
        <button type="button" class="rst-consent-reject">${t('reject')}</button>
        <button type="button" class="rst-consent-accept">${t('accept')}</button>
      </div>
    `;
    banner.querySelector('.rst-consent-accept').addEventListener('click', () => {
      save(true);
      closeBanner();
    });
    banner.querySelector('.rst-consent-reject').addEventListener('click', () => {
      save(false);
      closeBanner();
    });
    document.body.appendChild(banner);
  }

  function init() {
    const saved = load();
    if (saved && typeof saved.accepted === 'boolean') {
      // Re-apply saved consent on every page (gtag was reset on load)
      applyConsent(saved.accepted);
    } else {
      // Show banner on first visit
      showBanner();
    }
    // Allow footer "Cookie settings" link to re-open the banner
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.rst-consent-open');
      if (!trigger) return;
      e.preventDefault();
      try { localStorage.removeItem(LS_KEY); } catch {}
      showBanner();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
