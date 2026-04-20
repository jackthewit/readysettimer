/* =========================================================
   Focus Timer — app logic
   - Timer + Pomodoro modes
   - High-precision countdown via performance.now()
   - Color-tone transitions by remaining ratio
   - LocalStorage-backed settings & custom presets
   - Keyboard shortcuts, fullscreen, sound, Page Title tick
   ========================================================= */

(() => {
  'use strict';

  // ---------- constants ----------
  const LS_KEY = 'focus-timer:v1';
  const RING_CIRC = 2 * Math.PI * 186; // must match CSS stroke-dasharray

  const DEFAULTS = {
    timerMinutes: 25,
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longEvery: 4,
    autostart: true,
    sound: true,
    color: true,
    bigFinal: false,
    customPresets: [],
    mode: 'timer',
  };

  // ---------- state ----------
  const state = {
    settings: loadSettings(),
    mode: 'timer',          // 'timer' | 'pomodoro'
    phase: 'idle',          // 'idle' | 'work' | 'short' | 'long' | 'done'
    durationMs: 25 * 60 * 1000,
    remainingMs: 25 * 60 * 1000,
    running: false,
    endAt: 0,               // performance.now() target
    rafId: 0,
    cycle: 0,               // completed pomodoros in current set
    selectedPresetSec: null,
  };
  state.mode = state.settings.mode || 'timer';

  // ---------- dom ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const el = {
    body: document.body,
    tH: $('#t-h'), tM: $('#t-m'), tS: $('#t-s'),
    sub: $('#time-sub'),
    phaseBadge: $('#phase-badge'),
    cycleBadge: $('#cycle-badge'),
    ring: $('.ring-progress'),
    btnStart: $('#btn-start'),
    btnStartLabel: $('#btn-start-label'),
    icoPlay: $('.ico-play'),
    icoPause: $('.ico-pause'),
    btnReset: $('#btn-reset'),
    btnSkip: $('#btn-skip'),
    btnSound: $('#btn-sound'),
    btnSettings: $('#btn-settings'),
    btnFullscreen: $('#btn-fullscreen'),
    tabs: $$('.tab'),
    presets: $('#presets'),
    presetCustomBtn: $('#preset-custom'),
    toast: $('#toast'),

    settingsModal: $('#settings-modal'),
    optTimerMinutes: $('#opt-timer-minutes'),
    optWork: $('#opt-work'),
    optShort: $('#opt-short'),
    optLong: $('#opt-long'),
    optLongEvery: $('#opt-long-every'),
    optAutostart: $('#opt-autostart'),
    optSound: $('#opt-sound'),
    optColor: $('#opt-color'),
    optBigFinal: $('#opt-hide-ms'),
    btnSave: $('#btn-save'),

    customModal: $('#custom-modal'),
    cpH: $('#cp-h'), cpM: $('#cp-m'), cpS: $('#cp-s'), cpName: $('#cp-name'),
    cpSave: $('#cp-save'),
  };

  // set CSS dasharray programmatically (avoids magic-number mismatch if radius changes)
  el.ring.setAttribute('stroke-dasharray', RING_CIRC.toFixed(2));

  // ---------- storage ----------
  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch { return { ...DEFAULTS }; }
  }
  function saveSettings() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state.settings)); }
    catch { /* ignore quota errors */ }
  }

  // ---------- helpers ----------
  function toast(msg, ms = 1600) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.remove('show'), ms);
  }
  const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function formatPreset(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h) return `${h}시간${m ? ` ${m}분` : ''}`;
    if (m && !s) return `${m}분`;
    if (!m && s) return `${s}초`;
    return `${m}분 ${s}초`;
  }

  // ---------- tone (color) mapping ----------
  function updateTone() {
    if (!state.settings.color) {
      el.body.dataset.tone = 'calm';
      el.body.dataset.alert = '0';
      return;
    }
    const ratio = state.durationMs > 0 ? state.remainingMs / state.durationMs : 0;
    let tone = 'calm';

    if (state.phase === 'done') {
      tone = 'done';
    } else if (state.mode === 'pomodoro') {
      if (state.phase === 'short' || state.phase === 'long') {
        tone = 'break';
      } else {
        // work phase — shift as time runs out
        tone = ratio > 0.5 ? 'focus' : ratio > 0.25 ? 'warm' : ratio > 0.1 ? 'hot' : 'danger';
      }
    } else {
      tone = ratio > 0.6 ? 'calm' : ratio > 0.35 ? 'focus' : ratio > 0.2 ? 'warm' : ratio > 0.08 ? 'hot' : 'danger';
    }
    el.body.dataset.tone = tone;
    el.body.dataset.alert = (state.running && state.remainingMs <= 10000 && state.remainingMs > 0) ? '1' : '0';
    el.body.dataset.big = (state.settings.bigFinal && state.running && state.remainingMs <= 10000 && state.remainingMs > 0) ? '1' : '0';
  }

  // ---------- render ----------
  function render() {
    const ms = Math.max(0, state.remainingMs);
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    el.tH.textContent = pad(h);
    el.tM.textContent = pad(m);
    el.tS.textContent = pad(s);
    el.body.dataset.hasHours = h > 0 ? '1' : '0';

    // title tick
    if (state.running || state.phase === 'done') {
      const prefix = state.phase === 'done' ? '✓ ' : '';
      document.title = `${prefix}${h ? pad(h) + ':' : ''}${pad(m)}:${pad(s)} · Focus Timer`;
    } else {
      document.title = 'Focus Timer — 프레젠테이션 타이머 & 뽀모도로';
    }

    // ring progress
    const ratio = state.durationMs > 0 ? ms / state.durationMs : 0;
    const offset = RING_CIRC * (1 - ratio);
    el.ring.style.strokeDashoffset = offset.toFixed(2);

    // phase label
    const phaseLabel = {
      idle: state.mode === 'pomodoro' ? '뽀모도로 준비' : '준비',
      work: '집중',
      short: '짧은 휴식',
      long: '긴 휴식',
      done: '완료',
    }[state.phase] || '준비';
    el.phaseBadge.textContent = phaseLabel;

    // sub label (total duration in minutes)
    const totalMin = Math.round(state.durationMs / 60000);
    el.sub.textContent = state.mode === 'pomodoro'
      ? `${phaseLabel} · ${totalMin}분`
      : `${formatPreset(Math.round(state.durationMs / 1000))} 카운트다운`;

    // cycle badge
    if (state.mode === 'pomodoro') {
      el.cycleBadge.hidden = false;
      const every = state.settings.longEvery || 4;
      el.cycleBadge.textContent = `집중 ${state.cycle % every} / ${every}`;
    } else {
      el.cycleBadge.hidden = true;
    }

    // start button
    el.btnStart.setAttribute('aria-pressed', String(state.running));
    el.icoPlay.style.display = state.running ? 'none' : '';
    el.icoPause.style.display = state.running ? '' : 'none';
    el.btnStartLabel.textContent = state.running ? '일시정지' : (state.remainingMs < state.durationMs && state.remainingMs > 0 ? '계속' : '시작');
    el.body.dataset.running = state.running ? '1' : '0';
    el.body.dataset.phase = state.phase;

    updateTone();
  }

  // ---------- ticking ----------
  function tick() {
    const now = performance.now();
    state.remainingMs = Math.max(0, state.endAt - now);
    render();
    if (state.remainingMs <= 0) {
      finishPhase();
      return;
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (state.running) return;
    if (state.remainingMs <= 0 || state.phase === 'done') {
      const next = state.mode === 'pomodoro' ? 'work' : 'idle';
      state.phase = next;
      state.durationMs = state.mode === 'pomodoro'
        ? phaseDurationMs('work')
        : (state.selectedPresetSec ?? state.settings.timerMinutes * 60) * 1000;
      state.remainingMs = state.durationMs;
    }
    state.running = true;
    state.endAt = performance.now() + state.remainingMs;
    state.rafId = requestAnimationFrame(tick);
    render();
    maybeUnlockAudio();
    requestNotify();
  }

  function pause() {
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(state.rafId);
    state.remainingMs = Math.max(0, state.endAt - performance.now());
    render();
  }

  function toggleStart() {
    state.running ? pause() : start();
  }

  function reset(toDefault = false) {
    state.running = false;
    cancelAnimationFrame(state.rafId);
    el.body.dataset.alert = '0';
    el.body.dataset.big = '0';
    if (toDefault) state.cycle = 0;
    if (state.mode === 'pomodoro') {
      setPhase('idle', true);
    } else {
      const secs = state.selectedPresetSec ?? (state.settings.timerMinutes * 60);
      state.durationMs = secs * 1000;
      state.remainingMs = state.durationMs;
      state.phase = 'idle';
    }
    render();
  }

  // ---------- phase / pomodoro ----------
  function phaseDurationMs(phase) {
    const s = state.settings;
    switch (phase) {
      case 'work':  return s.work * 60 * 1000;
      case 'short': return s.shortBreak * 60 * 1000;
      case 'long':  return s.longBreak * 60 * 1000;
      default: return s.timerMinutes * 60 * 1000;
    }
  }

  function setPhase(phase, resetTime = true) {
    state.phase = phase;
    if (state.mode === 'pomodoro') {
      const p = phase === 'idle' ? 'work' : phase;
      state.durationMs = phaseDurationMs(p);
    } else {
      const secs = state.selectedPresetSec ?? (state.settings.timerMinutes * 60);
      state.durationMs = secs * 1000;
    }
    if (resetTime) state.remainingMs = state.durationMs;
    render();
  }

  function nextPomodoroPhase() {
    if (state.phase === 'work' || state.phase === 'idle') {
      state.cycle += 1;
      const every = state.settings.longEvery || 4;
      return (state.cycle % every === 0) ? 'long' : 'short';
    }
    return 'work';
  }

  function finishPhase() {
    state.running = false;
    cancelAnimationFrame(state.rafId);
    playChime();
    notify();

    if (state.mode === 'pomodoro') {
      const next = nextPomodoroPhase();
      state.phase = next;
      state.durationMs = phaseDurationMs(next);
      state.remainingMs = state.durationMs;
      render();
      toast(next === 'work' ? '집중 시작!' : next === 'long' ? '긴 휴식 시간 🌿' : '짧은 휴식 시간 ☕');
      if (state.settings.autostart) {
        setTimeout(() => start(), 350);
      }
    } else {
      state.phase = 'done';
      state.remainingMs = 0;
      render();
      toast('시간 종료!');
    }
  }

  function skip() {
    if (state.mode !== 'pomodoro') {
      reset();
      return;
    }
    cancelAnimationFrame(state.rafId);
    state.running = false;
    const next = nextPomodoroPhase();
    state.phase = next;
    state.durationMs = phaseDurationMs(next);
    state.remainingMs = state.durationMs;
    render();
    if (state.settings.autostart) start();
  }

  // ---------- mode switching ----------
  function setMode(mode) {
    if (mode === state.mode) return;
    pause();
    state.mode = mode;
    state.settings.mode = mode;
    saveSettings();
    state.cycle = 0;
    state.selectedPresetSec = null;
    $$('.preset.is-active').forEach(b => b.classList.remove('is-active'));
    el.tabs.forEach(t => {
      const active = t.dataset.mode === mode;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    // hide preset row in pomodoro
    el.presets.style.display = mode === 'pomodoro' ? 'none' : '';
    if (mode === 'pomodoro') {
      setPhase('work', true);
      state.phase = 'idle';
      state.durationMs = phaseDurationMs('work');
      state.remainingMs = state.durationMs;
    } else {
      setPhase('idle', true);
    }
    render();
  }

  // ---------- presets ----------
  function renderPresets() {
    // remove dynamic custom buttons, keep defaults + custom "+" button
    $$('.preset', el.presets).forEach(b => {
      if (b.dataset.custom === '1') b.remove();
    });
    (state.settings.customPresets || []).forEach((cp) => {
      const btn = document.createElement('button');
      btn.className = 'preset';
      btn.dataset.seconds = String(cp.seconds);
      btn.dataset.custom = '1';
      btn.textContent = cp.name || formatPreset(cp.seconds);
      const x = document.createElement('span');
      x.className = 'x';
      x.textContent = '×';
      x.title = '삭제';
      x.addEventListener('click', (e) => {
        e.stopPropagation();
        state.settings.customPresets = state.settings.customPresets.filter(p => p !== cp);
        saveSettings();
        renderPresets();
      });
      btn.appendChild(x);
      el.presets.insertBefore(btn, el.presetCustomBtn);
    });
  }

  function selectPreset(seconds, btn) {
    if (state.mode !== 'timer') return;
    state.selectedPresetSec = seconds;
    state.settings.timerMinutes = Math.max(1, Math.round(seconds / 60));
    saveSettings();
    state.durationMs = seconds * 1000;
    state.remainingMs = state.durationMs;
    state.running = false;
    cancelAnimationFrame(state.rafId);
    state.phase = 'idle';
    $$('.preset.is-active').forEach(b => b.classList.remove('is-active'));
    if (btn) btn.classList.add('is-active');
    render();
  }

  // ---------- sound ----------
  let audioCtx = null;
  function maybeUnlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playChime() {
    if (!state.settings.sound || !audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;
    [880, 1175, 1568].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const t0 = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      osc.start(t0); osc.stop(t0 + 0.6);
    });
  }

  // ---------- notifications ----------
  function notify() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try { new Notification('Focus Timer', { body: '시간이 종료되었습니다.', silent: true }); } catch {}
    }
  }
  function requestNotify() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  // ---------- fullscreen / focus mode ----------
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      el.body.dataset.focus = '1';
    } else {
      document.exitFullscreen?.();
      el.body.dataset.focus = '0';
    }
  }
  document.addEventListener('fullscreenchange', () => {
    el.body.dataset.focus = document.fullscreenElement ? '1' : '0';
  });

  // ---------- settings modal ----------
  function openSettings() {
    el.optTimerMinutes.value = state.settings.timerMinutes;
    el.optWork.value = state.settings.work;
    el.optShort.value = state.settings.shortBreak;
    el.optLong.value = state.settings.longBreak;
    el.optLongEvery.value = state.settings.longEvery;
    el.optAutostart.checked = !!state.settings.autostart;
    el.optSound.checked = !!state.settings.sound;
    el.optColor.checked = !!state.settings.color;
    el.optBigFinal.checked = !!state.settings.bigFinal;
    el.settingsModal.showModal();
  }
  function saveSettingsFromForm() {
    state.settings.timerMinutes = clamp(+el.optTimerMinutes.value || 25, 1, 600);
    state.settings.work         = clamp(+el.optWork.value || 25, 1, 120);
    state.settings.shortBreak   = clamp(+el.optShort.value || 5, 1, 60);
    state.settings.longBreak    = clamp(+el.optLong.value || 15, 1, 60);
    state.settings.longEvery    = clamp(+el.optLongEvery.value || 4, 2, 12);
    state.settings.autostart    = el.optAutostart.checked;
    state.settings.sound        = el.optSound.checked;
    state.settings.color        = el.optColor.checked;
    state.settings.bigFinal     = el.optBigFinal.checked;
    saveSettings();
    updateSoundButton();
    if (!state.running) {
      if (state.mode === 'pomodoro') {
        setPhase(state.phase === 'idle' ? 'work' : state.phase, true);
        state.phase = state.phase === 'work' ? 'idle' : state.phase;
      } else if (!state.selectedPresetSec) {
        state.durationMs = state.settings.timerMinutes * 60 * 1000;
        state.remainingMs = state.durationMs;
      }
    }
    render();
    toast('설정이 저장되었습니다.');
  }

  // ---------- custom preset modal ----------
  function openCustomPreset() {
    el.cpH.value = 0; el.cpM.value = 20; el.cpS.value = 0; el.cpName.value = '';
    el.customModal.showModal();
  }
  function saveCustomPreset() {
    const h = clamp(+el.cpH.value || 0, 0, 9);
    const m = clamp(+el.cpM.value || 0, 0, 59);
    const s = clamp(+el.cpS.value || 0, 0, 59);
    const seconds = h * 3600 + m * 60 + s;
    if (seconds < 1) { toast('1초 이상 입력해주세요.'); return; }
    const name = (el.cpName.value || '').trim() || formatPreset(seconds);
    state.settings.customPresets = state.settings.customPresets || [];
    if (state.settings.customPresets.length >= 12) {
      state.settings.customPresets.shift();
    }
    state.settings.customPresets.push({ seconds, name });
    saveSettings();
    renderPresets();
    toast('프리셋이 추가되었습니다.');
  }

  // ---------- sound button visual ----------
  function updateSoundButton() {
    el.btnSound.setAttribute('aria-pressed', String(!!state.settings.sound));
    el.btnSound.style.color = state.settings.sound ? '' : 'var(--ink-faint)';
  }

  // ---------- events ----------
  el.btnStart.addEventListener('click', toggleStart);
  el.btnReset.addEventListener('click', () => reset(true));
  el.btnSkip.addEventListener('click', skip);
  el.btnFullscreen.addEventListener('click', toggleFullscreen);
  el.btnSound.addEventListener('click', () => {
    state.settings.sound = !state.settings.sound;
    saveSettings();
    updateSoundButton();
    if (state.settings.sound) { maybeUnlockAudio(); playChime(); }
    toast(`알림음 ${state.settings.sound ? '켜짐' : '꺼짐'}`);
  });

  el.btnSettings.addEventListener('click', openSettings);
  el.btnSave.addEventListener('click', (e) => { /* dialog closes via method="dialog" */ });
  el.settingsModal.addEventListener('close', () => {
    if (el.settingsModal.returnValue === 'save') saveSettingsFromForm();
  });

  el.presetCustomBtn.addEventListener('click', (e) => { e.preventDefault(); openCustomPreset(); });
  el.customModal.addEventListener('close', () => {
    if (el.customModal.returnValue === 'save') saveCustomPreset();
  });

  el.presets.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset');
    if (!btn || btn.id === 'preset-custom') return;
    if (e.target.classList.contains('x')) return; // delete handled separately
    const sec = +btn.dataset.seconds;
    if (!sec) return;
    selectPreset(sec, btn);
  });

  el.tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault(); toggleStart(); break;
      case 'r': case 'R': reset(true); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'm': case 'M': setMode(state.mode === 'timer' ? 'pomodoro' : 'timer'); break;
      case 'n': case 'N': skip(); break;
      case 's': case 'S':
        state.settings.sound = !state.settings.sound; saveSettings(); updateSoundButton();
        toast(`알림음 ${state.settings.sound ? '켜짐' : '꺼짐'}`);
        break;
      default:
        if (state.mode === 'timer' && /^[1-9]$/.test(e.key)) {
          const btn = $$('.preset', el.presets)[+e.key - 1];
          if (btn && btn.dataset.seconds) selectPreset(+btn.dataset.seconds, btn);
        }
    }
  });

  // tab-visibility re-sync (raf pauses in background; recompute when we return)
  document.addEventListener('visibilitychange', () => {
    if (!state.running) return;
    if (document.visibilityState === 'visible') {
      state.remainingMs = Math.max(0, state.endAt - performance.now());
      if (state.remainingMs <= 0) finishPhase();
      else { cancelAnimationFrame(state.rafId); state.rafId = requestAnimationFrame(tick); }
    }
  });

  // AdSense push (safe no-op if script blocked)
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}

  // ---------- init ----------
  function init() {
    updateSoundButton();
    renderPresets();
    // initial mode setup
    if (state.mode === 'pomodoro') {
      el.tabs.forEach(t => {
        const active = t.dataset.mode === 'pomodoro';
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      el.presets.style.display = 'none';
      state.phase = 'idle';
      state.durationMs = phaseDurationMs('work');
      state.remainingMs = state.durationMs;
    } else {
      state.durationMs = (state.settings.timerMinutes || 25) * 60 * 1000;
      state.remainingMs = state.durationMs;
    }
    render();
  }

  init();
})();
