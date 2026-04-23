/* =========================================================
   ReadySetTimer — inline "hero" timer for landing pages
   - Auto-detects duration from the URL (/5min.html → 300s, etc.)
   - Renders a functional mini timer right below the <h1>/lead
   - Replaces the old static CTA so users can start immediately
   - SEO content (H2 sections, FAQ, related nav) stays intact
   ========================================================= */

(() => {
  'use strict';

  // 1) Determine duration from the current URL path
  function resolveSeconds() {
    const p = location.pathname;
    // /5min.html, /25min.html, /60min.html ...
    const m = p.match(/\/(\d+)min(?:\.html)?$/i);
    if (m) return parseInt(m[1], 10) * 60;
    // /pomodoro.html → 25 minutes (one focus block, the clearest demo)
    if (/\/pomodoro(?:\.html)?$/i.test(p)) return 25 * 60;
    // Language pillar pages: /en/, /ja/, /zh/, ...
    if (/^\/(en|ja|zh|es|pt|fr|de)\/$/.test(p) || /^\/(en|ja|zh|es|pt|fr|de)\/index\.html$/.test(p)) {
      return 25 * 60;
    }
    return 0;
  }

  const seconds = resolveSeconds();
  if (!seconds) return; // non-landing page, nothing to do

  // 2) Localized labels (based on <html lang>)
  const LANG = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const L = {
    start:  { ko:'시작', en:'Start', ja:'開始', zh:'开始', es:'Iniciar', pt:'Iniciar', fr:'Démarrer', de:'Start' },
    pause:  { ko:'일시정지', en:'Pause', ja:'一時停止', zh:'暂停', es:'Pausar', pt:'Pausar', fr:'Pause', de:'Pause' },
    resume: { ko:'계속', en:'Resume', ja:'再開', zh:'继续', es:'Seguir', pt:'Retomar', fr:'Reprendre', de:'Weiter' },
    reset:  { ko:'초기화', en:'Reset', ja:'リセット', zh:'重置', es:'Reiniciar', pt:'Reiniciar', fr:'Réinit.', de:'Zurücks.' },
    open:   { ko:'설정·풀스크린 등 전체 기능 →', en:'Full app (settings, fullscreen) →', ja:'設定・全画面など全機能 →', zh:'完整应用(设置、全屏) →',
              es:'App completa (ajustes, pantalla completa) →', pt:'App completo (ajustes, tela cheia) →',
              fr:'App complète (paramètres, plein écran) →', de:'Voll-App (Einstellungen, Vollbild) →' },
    hint:   { ko:'{space} 시작/정지 · {r} 초기화', en:'{space} start/stop · {r} reset', ja:'{space} 開始/停止 · {r} リセット',
              zh:'{space} 开始/停止 · {r} 重置', es:'{space} iniciar/parar · {r} reiniciar', pt:'{space} iniciar/parar · {r} reiniciar',
              fr:'{space} démarrer/arrêter · {r} réinit.', de:'{space} Start/Stopp · {r} Zurücks.' },
    done:   { ko:'완료!', en:'Done!', ja:'完了!', zh:'完成!', es:'¡Listo!', pt:'Concluído!', fr:'Terminé !', de:'Fertig!' },
  };
  const t = (k) => L[k]?.[LANG] ?? L[k]?.en ?? k;

  // 3) Find insertion point — just after the leading paragraph (.landing-lead).
  //    Falls back to the top of <article>.
  const article = document.querySelector('.legal-main article');
  if (!article) return;
  const lead = article.querySelector('.landing-lead');

  // 4) Build DOM
  const RING_CIRC = 2 * Math.PI * 186;
  const section = document.createElement('section');
  section.className = 'hero-timer';
  section.setAttribute('aria-label', 'Timer');
  section.innerHTML = `
    <div class="hero-timer-ring">
      <svg viewBox="0 0 400 400" aria-hidden="true">
        <circle class="hero-ring-track" cx="200" cy="200" r="186" />
        <circle class="hero-ring-progress" cx="200" cy="200" r="186"
                stroke-dasharray="${RING_CIRC.toFixed(2)}" stroke-dashoffset="0" />
      </svg>
      <div class="hero-timer-display">
        <span class="hero-time">
          <span class="hero-m">00</span><span class="hero-colon">:</span><span class="hero-s">00</span>
        </span>
        <span class="hero-done" aria-hidden="true">${t('done')}</span>
      </div>
    </div>
    <div class="hero-timer-controls">
      <button type="button" class="hero-btn hero-btn-primary" data-action="start">
        <span class="hero-play">▶</span>
        <span class="hero-label">${t('start')}</span>
      </button>
      <button type="button" class="hero-btn" data-action="reset">↺ ${t('reset')}</button>
    </div>
    <p class="hero-timer-hint">
      <kbd>Space</kbd> ${t('hint').replace('{space}','').replace('{r}','').replace('· ·','·').trim().replace(/^·\s*/,'')}
      · <a class="hero-open-app" href="/?t=${Math.round(seconds/60)}m&lang=${LANG}">${t('open')}</a>
    </p>
  `;

  // Insert after lead paragraph (or after h1 if no lead)
  if (lead && lead.parentNode) {
    lead.parentNode.insertBefore(section, lead.nextSibling);
  } else {
    article.insertBefore(section, article.firstChild);
  }

  // 5) Remove the old CTA (it's now redundant — timer is inline)
  const oldCta = document.querySelector('.cta-timer');
  if (oldCta) oldCta.remove();

  // 6) Timer logic
  const el = {
    m: section.querySelector('.hero-m'),
    s: section.querySelector('.hero-s'),
    ring: section.querySelector('.hero-ring-progress'),
    startBtn: section.querySelector('[data-action="start"]'),
    resetBtn: section.querySelector('[data-action="reset"]'),
    startLabel: section.querySelector('.hero-label'),
    startIcon: section.querySelector('.hero-play'),
  };

  let duration = seconds * 1000;
  let remaining = duration;
  let running = false;
  let endAt = 0;
  let rafId = 0;
  let audioCtx = null;

  const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
  const baseTitle = document.title;

  function render() {
    const ms = Math.max(0, remaining);
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const r = totalSec % 60;
    el.m.textContent = pad(m);
    el.s.textContent = pad(r);
    const ratio = duration > 0 ? ms / duration : 0;
    el.ring.style.strokeDashoffset = (RING_CIRC * (1 - ratio)).toFixed(2);
    el.startIcon.textContent = running ? '❚❚' : '▶';
    el.startLabel.textContent = running
      ? t('pause')
      : (remaining < duration && remaining > 0 ? t('resume') : t('start'));
    section.classList.toggle('running', running);
    section.classList.toggle('done', ms === 0 && remaining === 0 && !running && duration > 0 && startedOnce);

    // tab-title tick for visibility when user switches tabs
    if (running) {
      document.title = `${pad(m)}:${pad(r)} · ${baseTitle}`;
    } else if (ms === 0 && startedOnce) {
      document.title = `✓ ${t('done')} · ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }

  let startedOnce = false;
  function tick() {
    remaining = Math.max(0, endAt - performance.now());
    render();
    if (remaining <= 0) {
      running = false;
      cancelAnimationFrame(rafId);
      playBeep();
      render();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) { pause(); return; }
    if (remaining <= 0) remaining = duration;
    running = true;
    startedOnce = true;
    endAt = performance.now() + remaining;
    rafId = requestAnimationFrame(tick);
    maybeUnlockAudio();
    render();
  }
  function pause() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    remaining = Math.max(0, endAt - performance.now());
    render();
  }
  function reset() {
    running = false;
    cancelAnimationFrame(rafId);
    remaining = duration;
    startedOnce = false;
    render();
  }

  function maybeUnlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playBeep() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [880, 1175, 1568].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(g); g.connect(audioCtx.destination);
      const t0 = now + i * 0.16;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.24, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      osc.start(t0); osc.stop(t0 + 0.6);
    });
  }

  el.startBtn.addEventListener('click', start);
  el.resetBtn.addEventListener('click', reset);

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); start(); }
    else if (e.key === 'r' || e.key === 'R') { reset(); }
  });

  // Resync when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && running) {
      remaining = Math.max(0, endAt - performance.now());
      if (remaining <= 0) { running = false; playBeep(); render(); }
      else { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
    }
  });

  render();
})();
