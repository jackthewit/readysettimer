/* =========================================================
   ReadySetTimer — app logic
   - Timer + Pomodoro + Stopwatch modes
   - High-precision timing via performance.now()
   - Color-tone transitions by remaining ratio
   - LocalStorage-backed settings, custom presets, stopwatch history
   - Keyboard shortcuts, fullscreen, sound (types/volume/repeat)
   ========================================================= */

(() => {
  'use strict';

  // ---------- i18n ----------
  const I18N = window.I18N;
  const t = (k, p) => I18N ? I18N.t(k, p) : k;
  function currentLang() { return I18N ? I18N.getLang() : 'en'; }

  // ---------- constants ----------
  const LS_KEY = 'focus-timer:v1';
  const LS_HISTORY = 'focus-timer:sw-history:v1';
  const RING_CIRC = 2 * Math.PI * 186;

  const DEFAULTS = {
    timerMinutes: 25,
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longEvery: 4,
    autostart: true,
    sound: true,
    soundType: 'chime',    // 'chime' | 'bell' | 'beep' | 'soft' | 'digital'
    soundVolume: 70,       // 0-100
    soundRepeat: 1,        // 1-10
    color: true,
    bigFinal: true,
    bigFinalSec: 6,
    customPresets: [],
    mode: 'timer',         // 'timer' | 'pomodoro' | 'stopwatch'
  };

  // ---------- state ----------
  const state = {
    settings: loadSettings(),
    mode: 'timer',
    phase: 'idle',
    durationMs: 25 * 60 * 1000,
    remainingMs: 25 * 60 * 1000,
    running: false,
    endAt: 0,
    rafId: 0,
    cycle: 0,
    selectedPresetSec: null,

    // stopwatch
    sw: {
      running: false,
      startAt: 0,           // performance.now() when started
      elapsedBase: 0,       // accumulated elapsed across pause/resume
      rafId: 0,
      lapStart: 0,          // elapsed ms at last lap
      laps: [],             // [{index, split, lap}]
    },
    history: loadHistory(),
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
    bigCountdown: $('#big-countdown'),
    bigNum: $('#big-num'),

    btnStart: $('#btn-start'),
    btnStartLabel: $('#btn-start-label'),
    icoPlay: $('.timer-view .ico-play'),
    icoPause: $('.timer-view .ico-pause'),
    btnReset: $('#btn-reset'),
    btnSkip: $('#btn-skip'),
    btnSound: $('#btn-sound'),
    btnSettings: $('#btn-settings'),
    btnFullscreen: $('#btn-fullscreen'),
    tabs: $$('.tab'),
    presets: $('#presets'),
    presetCustomBtn: $('#preset-custom'),
    toast: $('#toast'),

    // stopwatch
    swM: $('#sw-m'), swS: $('#sw-s'), swCs: $('#sw-cs'),
    swSub: $('#sw-sub'),
    swStart: $('#sw-start'),
    swStartLabel: $('#sw-start-label'),
    swIcoPlay: $('.stopwatch-view .ico-play'),
    swIcoPause: $('.stopwatch-view .ico-pause'),
    swReset: $('#sw-reset'),
    swLap: $('#sw-lap'),
    swSave: $('#sw-save'),
    swLapList: $('#sw-lap-list'),
    swLapEmpty: $('#sw-lap-empty'),
    swLapCount: $('#sw-lap-count'),
    swHistList: $('#sw-hist-list'),
    swHistEmpty: $('#sw-hist-empty'),
    swHistCount: $('#sw-hist-count'),
    swClearAll: $('#sw-clear-all'),

    // settings modal
    settingsModal: $('#settings-modal'),
    optTimerMinutes: $('#opt-timer-minutes'),
    optWork: $('#opt-work'),
    optShort: $('#opt-short'),
    optLong: $('#opt-long'),
    optLongEvery: $('#opt-long-every'),
    optAutostart: $('#opt-autostart'),
    optSound: $('#opt-sound'),
    optSoundType: $('#opt-sound-type'),
    optSoundRepeat: $('#opt-sound-repeat'),
    optSoundVolume: $('#opt-sound-volume'),
    optVolVal: $('#opt-vol-val'),
    optColor: $('#opt-color'),
    optBigFinal: $('#opt-hide-ms'),
    optBigFinalSec: $('#opt-bigfinal-sec'),
    btnSave: $('#btn-save'),
    btnTestSound: $('#btn-test-sound'),

    customModal: $('#custom-modal'),
    cpH: $('#cp-h'), cpM: $('#cp-m'), cpS: $('#cp-s'), cpName: $('#cp-name'),
    cpSave: $('#cp-save'),

    swSaveModal: $('#sw-save-modal'),
    swSaveTime: $('#sw-save-time'),
    swSaveMeta: $('#sw-save-meta'),
    swSaveLabel: $('#sw-save-label'),
    swSaveNote: $('#sw-save-note'),
    swSaveConfirm: $('#sw-save-confirm'),
    swExportAll: $('#sw-export-all'),
  };
  let swPending = null;

  el.ring.setAttribute('stroke-dasharray', RING_CIRC.toFixed(2));

  // ---------- storage ----------
  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch { return { ...DEFAULTS }; }
  }
  function saveSettings() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state.settings)); } catch {}
  }
  function loadHistory() {
    try {
      const raw = localStorage.getItem(LS_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveHistory() {
    try { localStorage.setItem(LS_HISTORY, JSON.stringify(state.history)); } catch {}
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
    if (h && m) return t('unit.hm', { h, m });
    if (h) return t('unit.h', { n: h });
    if (m && s) return t('unit.ms', { m, s });
    if (m) return t('unit.m', { n: m });
    return t('unit.s', { n: s });
  }
  function formatStopwatch(ms) {
    const totalCs = Math.floor(ms / 10);
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const s = totalSec % 60;
    const m = Math.floor(totalSec / 60);
    return { m, s, cs };
  }
  function formatSwFull(ms) {
    const { m, s, cs } = formatStopwatch(ms);
    return `${pad(m)}:${pad(s)}.${pad(cs)}`;
  }
  function formatHistoryDate(ts) {
    try {
      return new Date(ts).toLocaleString(currentLang(), {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      const d = new Date(ts);
      const pad2 = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
  }

  // ---------- tone (color) mapping ----------
  function updateTone() {
    if (!state.settings.color) {
      el.body.dataset.tone = state.mode === 'stopwatch' ? 'focus' : 'calm';
      el.body.dataset.alert = '0';
      el.body.dataset.big = '0';
      return;
    }

    let tone = 'calm';
    if (state.mode === 'stopwatch') {
      tone = state.sw.running ? 'focus' : 'calm';
      el.body.dataset.tone = tone;
      el.body.dataset.alert = '0';
      el.body.dataset.big = '0';
      return;
    }

    const ratio = state.durationMs > 0 ? state.remainingMs / state.durationMs : 0;
    if (state.phase === 'done') {
      tone = 'done';
    } else if (state.mode === 'pomodoro') {
      if (state.phase === 'short' || state.phase === 'long') tone = 'break';
      else tone = ratio > 0.5 ? 'focus' : ratio > 0.25 ? 'warm' : ratio > 0.1 ? 'hot' : 'danger';
    } else {
      tone = ratio > 0.6 ? 'calm' : ratio > 0.35 ? 'focus' : ratio > 0.2 ? 'warm' : ratio > 0.08 ? 'hot' : 'danger';
    }
    el.body.dataset.tone = tone;

    // big/alert thresholds
    const bigSec = Math.max(1, state.settings.bigFinalSec || 6);
    const inFinal = state.running && state.remainingMs > 0 && state.remainingMs <= bigSec * 1000;
    el.body.dataset.big = (state.settings.bigFinal && inFinal) ? '1' : '0';
    el.body.dataset.alert = (state.running && state.remainingMs > 0 && state.remainingMs <= bigSec * 1000) ? '1' : '0';
  }

  // ---------- timer render ----------
  function render() {
    if (state.mode === 'stopwatch') { renderStopwatch(); return; }

    const ms = Math.max(0, state.remainingMs);
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    el.tH.textContent = pad(h);
    el.tM.textContent = pad(m);
    el.tS.textContent = pad(s);
    el.body.dataset.hasHours = h > 0 ? '1' : '0';

    // big final overlay number (just seconds, ceil)
    const bigSec = Math.max(1, state.settings.bigFinalSec || 6);
    if (state.settings.bigFinal && state.running && ms > 0 && ms <= bigSec * 1000) {
      const n = Math.max(1, Math.ceil(ms / 1000));
      if (el.bigNum.textContent !== String(n)) {
        el.bigNum.textContent = String(n);
        // retrigger pop animation
        el.bigNum.style.animation = 'none';
        void el.bigNum.offsetWidth;
        el.bigNum.style.animation = '';
      }
    }

    // title tick
    if (state.running || state.phase === 'done') {
      const prefix = state.phase === 'done' ? '✓ ' : '';
      document.title = `${prefix}${h ? pad(h) + ':' : ''}${pad(m)}:${pad(s)} · ReadySetTimer`;
    } else {
      document.title = t('app.title');
    }

    // ring progress
    const ratio = state.durationMs > 0 ? ms / state.durationMs : 0;
    el.ring.style.strokeDashoffset = (RING_CIRC * (1 - ratio)).toFixed(2);

    // phase label
    const phaseKey = {
      idle: state.mode === 'pomodoro' ? 'phase.idlePomo' : 'phase.idle',
      work: 'phase.work', short: 'phase.short', long: 'phase.long', done: 'phase.done',
    }[state.phase] || 'phase.idle';
    const phaseLabel = t(phaseKey);
    el.phaseBadge.textContent = phaseLabel;

    const totalMin = Math.round(state.durationMs / 60000);
    el.sub.textContent = state.mode === 'pomodoro'
      ? t('timer.pomoSub', { phase: phaseLabel, min: totalMin })
      : t('timer.countdown', { time: formatPreset(Math.round(state.durationMs / 1000)) });

    if (state.mode === 'pomodoro') {
      el.cycleBadge.hidden = false;
      const every = state.settings.longEvery || 4;
      const rem = state.cycle % every;
      const display = (state.cycle > 0 && rem === 0) ? every : rem;
      el.cycleBadge.textContent = t('pomo.cycle', { n: display, total: every });
    } else {
      el.cycleBadge.hidden = true;
    }

    el.btnStart.setAttribute('aria-pressed', String(state.running));
    el.icoPlay.style.display = state.running ? 'none' : '';
    el.icoPause.style.display = state.running ? '' : 'none';
    el.btnStartLabel.textContent = state.running
      ? t('btn.pause')
      : (state.remainingMs < state.durationMs && state.remainingMs > 0 ? t('btn.resume') : t('btn.start'));
    el.body.dataset.running = state.running ? '1' : '0';
    el.body.dataset.phase = state.phase;

    updateTone();
  }

  function tick() {
    const now = performance.now();
    state.remainingMs = Math.max(0, state.endAt - now);
    render();
    if (state.remainingMs <= 0) { finishPhase(); return; }
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
    } else if (state.mode === 'pomodoro' && state.phase === 'idle') {
      // first-ever pomodoro start: enter the work phase
      state.phase = 'work';
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

  function toggleStart() { state.running ? pause() : start(); }

  function reset(toDefault = false) {
    state.running = false;
    cancelAnimationFrame(state.rafId);
    el.body.dataset.alert = '0';
    el.body.dataset.big = '0';
    if (toDefault) state.cycle = 0;
    if (state.mode === 'pomodoro') setPhase('idle', true);
    else {
      const secs = state.selectedPresetSec ?? (state.settings.timerMinutes * 60);
      state.durationMs = secs * 1000;
      state.remainingMs = state.durationMs;
      state.phase = 'idle';
    }
    render();
  }

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
    playSound();
    notify();

    if (state.mode === 'pomodoro') {
      const next = nextPomodoroPhase();
      state.phase = next;
      state.durationMs = phaseDurationMs(next);
      state.remainingMs = state.durationMs;
      render();
      const tk = next === 'work' ? 'toast.focusStart' : next === 'long' ? 'toast.longBreak' : 'toast.shortBreak';
      toast(t(tk));
      if (state.settings.autostart) setTimeout(() => start(), 350);
    } else {
      state.phase = 'done';
      state.remainingMs = 0;
      render();
      toast(t('toast.done'));
    }
  }

  function skip() {
    if (state.mode !== 'pomodoro') { reset(); return; }
    cancelAnimationFrame(state.rafId);
    state.running = false;
    const next = nextPomodoroPhase();
    state.phase = next;
    state.durationMs = phaseDurationMs(next);
    state.remainingMs = state.durationMs;
    render();
    if (state.settings.autostart) start();
  }

  // ---------- stopwatch ----------
  function swCurrentMs() {
    const sw = state.sw;
    return sw.running ? sw.elapsedBase + (performance.now() - sw.startAt) : sw.elapsedBase;
  }

  function swTick() {
    renderStopwatch();
    if (state.sw.running) state.sw.rafId = requestAnimationFrame(swTick);
  }

  function swStartPause() {
    const sw = state.sw;
    if (sw.running) {
      sw.elapsedBase += performance.now() - sw.startAt;
      sw.running = false;
      cancelAnimationFrame(sw.rafId);
    } else {
      sw.running = true;
      sw.startAt = performance.now();
      sw.rafId = requestAnimationFrame(swTick);
      maybeUnlockAudio();
    }
    renderStopwatch();
  }

  function swReset() {
    const sw = state.sw;
    sw.running = false;
    cancelAnimationFrame(sw.rafId);
    sw.elapsedBase = 0;
    sw.startAt = 0;
    sw.lapStart = 0;
    sw.laps = [];
    renderStopwatch();
  }

  function swLap() {
    const sw = state.sw;
    if (!sw.running) return;
    const now = swCurrentMs();
    if (now <= 0) return;
    const lapTime = now - sw.lapStart;
    sw.lapStart = now;
    sw.laps.push({ index: sw.laps.length + 1, split: now, lap: lapTime, memo: '' });
    renderStopwatch();
  }

  function swSaveRun() {
    const total = swCurrentMs();
    if (total < 10) { toast(t('toast.noTime')); return; }
    // capture laps by deep-copying (preserves memos the user typed)
    swPending = {
      total,
      laps: state.sw.laps.map(l => ({ index: l.index, split: l.split, lap: l.lap, memo: (l.memo || '').trim() })),
    };
    el.swSaveTime.textContent = formatSwFull(total);
    el.swSaveMeta.textContent = t('sw.lapsCount', { n: swPending.laps.length });
    // auto-suggest a title based on current date/time
    el.swSaveLabel.value = '';
    el.swSaveLabel.placeholder = t('swsave.namePh');
    if (el.swSaveNote) el.swSaveNote.value = '';
    el.swSaveModal.showModal();
    setTimeout(() => el.swSaveLabel.focus(), 50);
  }

  function commitSwSave() {
    if (!swPending) return;
    let title = (el.swSaveLabel.value || '').trim().slice(0, 60);
    if (!title) {
      title = t('sw.titleAuto', { date: new Date().toLocaleString(currentLang(), { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) });
    }
    const note = (el.swSaveNote?.value || '').trim().slice(0, 240);
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      note,
      total: swPending.total,
      laps: swPending.laps,
      savedAt: Date.now(),
    };
    state.history.unshift(entry);
    if (state.history.length > 50) state.history.length = 50;
    saveHistory();
    renderHistory();
    swPending = null;
    toast(t('toast.recSaved'));
  }

  function swDeleteHistory(id) {
    state.history = state.history.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
  }

  // ---------- CSV export ----------
  function csvEscape(v) {
    v = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function buildCsvForRecord(rec) {
    const title = histTitle(rec);
    const savedAt = new Date(rec.savedAt).toISOString();
    const lines = [];
    lines.push(`# ${t('swsave.name')}: ${title}`);
    lines.push(`# ${t('sw.titleHistory')}: ${savedAt}`);
    lines.push(`# Total: ${formatSwFull(rec.total)}`);
    if (rec.note) lines.push(`# ${t('sw.noteCol')}: ${rec.note.replace(/\r?\n/g, ' ')}`);
    lines.push('');
    lines.push(['#', t('btn.lap'), t('sw.totalTime', { time: '' }).trim() || 'Cumulative', t('sw.memoCol')].map(csvEscape).join(','));
    rec.laps.forEach(l => {
      lines.push([l.index, formatSwFull(l.lap), formatSwFull(l.split), l.memo || ''].map(csvEscape).join(','));
    });
    return lines.join('\n');
  }
  function buildCsvForAll() {
    const rows = [];
    rows.push([t('swsave.name'), t('sw.titleHistory'), 'Saved ISO', 'Total', '#', t('btn.lap'), t('sw.totalTime', { time: '' }).trim() || 'Cumulative', t('sw.memoCol'), t('sw.noteCol')].map(csvEscape).join(','));
    state.history.forEach(rec => {
      const title = histTitle(rec);
      const savedAt = new Date(rec.savedAt).toISOString();
      if (rec.laps.length === 0) {
        rows.push([title, savedAt, savedAt, formatSwFull(rec.total), '', '', '', '', rec.note || ''].map(csvEscape).join(','));
      } else {
        rec.laps.forEach((l, i) => {
          rows.push([title, savedAt, savedAt, formatSwFull(rec.total), l.index, formatSwFull(l.lap), formatSwFull(l.split), l.memo || '', i === 0 ? (rec.note || '') : ''].map(csvEscape).join(','));
        });
      }
    });
    return rows.join('\n');
  }
  function downloadCsv(filename, csv) {
    // BOM ensures Excel opens UTF-8 (Korean/Japanese/etc.) correctly
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function slugify(s) {
    return (s || 'run').trim().replace(/[\s\/\\:*?"<>|]+/g, '_').slice(0, 40) || 'run';
  }
  function swExportOne(rec) {
    const csv = buildCsvForRecord(rec);
    const ts = new Date(rec.savedAt).toISOString().replace(/[:T]/g, '-').slice(0, 19);
    downloadCsv(`${slugify(histTitle(rec))}_${ts}.csv`, csv);
  }
  function swExportAll() {
    if (!state.history.length) return;
    const csv = buildCsvForAll();
    const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    downloadCsv(`focus-timer_all_${ts}.csv`, csv);
  }

  function swClearAllHistory() {
    if (state.history.length === 0) return;
    if (!confirm(t('confirm.clearAll'))) return;
    state.history = [];
    saveHistory();
    renderHistory();
    toast(t('toast.allCleared'));
  }

  function renderStopwatch() {
    const ms = swCurrentMs();
    const { m, s, cs } = formatStopwatch(ms);
    el.swM.textContent = pad(m);
    el.swS.textContent = pad(s);
    el.swCs.textContent = pad(cs);
    el.swSub.textContent = state.sw.running
      ? (state.sw.laps.length ? t('sw.lapsCount', { n: state.sw.laps.length }) : t('sw.running'))
      : (ms > 0 ? t('sw.paused') : t('sw.waiting'));

    el.swStart.setAttribute('aria-pressed', String(state.sw.running));
    el.swIcoPlay.style.display = state.sw.running ? 'none' : '';
    el.swIcoPause.style.display = state.sw.running ? '' : 'none';
    el.swStartLabel.textContent = state.sw.running
      ? t('btn.pause')
      : (ms > 0 ? t('btn.resume') : t('btn.start'));

    el.swLap.disabled = !state.sw.running;
    el.swSave.disabled = ms < 10;

    if (state.sw.running) document.title = `${pad(m)}:${pad(s)} · ${t('tab.stopwatch')}`;
    else if (state.mode === 'stopwatch') document.title = `ReadySetTimer — ${t('tab.stopwatch')}`;

    renderLaps();
    updateTone();
  }

  function renderLaps() {
    const list = el.swLapList;
    list.innerHTML = '';
    const laps = state.sw.laps;
    el.swLapCount.textContent = laps.length;
    el.swLapEmpty.style.display = laps.length ? 'none' : '';
    if (!laps.length) return;

    let best = Infinity, worst = -Infinity;
    laps.forEach(l => { if (l.lap < best) best = l.lap; if (l.lap > worst) worst = l.lap; });

    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const li = document.createElement('li');
      li.classList.add('lap-row');
      if (laps.length > 1 && l.lap === best) li.classList.add('lap-best');
      if (laps.length > 1 && l.lap === worst) li.classList.add('lap-worst');
      const memoPh = t('sw.memoPh');
      li.innerHTML = `
        <span class="idx">#${l.index}</span>
        <span class="val">${formatSwFull(l.lap)}</span>
        <input type="text" class="lap-memo" maxlength="40" placeholder="${escapeHtml(memoPh)}" value="${escapeHtml(l.memo || '')}" />
        <span class="delta">${escapeHtml(t('sw.totalTime', { time: formatSwFull(l.split) }))}</span>
      `;
      const input = li.querySelector('.lap-memo');
      input.addEventListener('input', () => { l.memo = input.value; });
      list.appendChild(li);
    }
  }

  function histTitle(h) {
    // backward-compat: older entries stored `label` instead of `title`
    const raw = (h.title || h.label || '').trim();
    return raw || t('sw.untitled');
  }

  function renderHistory() {
    const list = el.swHistList;
    list.innerHTML = '';
    const hist = state.history;
    el.swHistCount.textContent = hist.length;
    el.swHistEmpty.style.display = hist.length ? 'none' : '';
    if (el.swExportAll) el.swExportAll.style.display = hist.length ? '' : 'none';
    if (!hist.length) return;

    hist.forEach(h => {
      const li = document.createElement('li');
      li.className = 'hist-item';
      li.dataset.id = h.id;
      const title = histTitle(h);

      const lapsHtml = h.laps.length
        ? `<ol class="hist-laps">${h.laps.map(l => `
            <li>
              <span class="idx">#${l.index}</span>
              <span class="val">${formatSwFull(l.lap)}</span>
              <span class="memo">${l.memo ? escapeHtml(l.memo) : '<em class="memo-empty">—</em>'}</span>
              <span class="split">${escapeHtml(t('sw.totalTime', { time: formatSwFull(l.split) }))}</span>
            </li>`).join('')}</ol>`
        : `<p class="hist-empty-detail">${escapeHtml(t('sw.noLapsInRec'))}</p>`;

      const noteHtml = h.note
        ? `<p class="hist-note"><strong>${escapeHtml(t('sw.noteCol'))}:</strong> ${escapeHtml(h.note)}</p>`
        : '';

      li.innerHTML = `
        <header class="hist-head">
          <span class="hist-title">${escapeHtml(title)}</span>
          <span class="hist-sub">${escapeHtml(formatHistoryDate(h.savedAt))} · ${escapeHtml(t('sw.lapsCount', { n: h.laps.length }))} · ${formatSwFull(h.total)}</span>
        </header>
        <div class="hist-details" aria-hidden="true">
          ${noteHtml}
          ${lapsHtml}
          <div class="hist-actions">
            <button type="button" class="hist-export" data-i18n="sw.exportCsv">Export CSV</button>
            <button type="button" class="hist-del-btn danger" data-i18n="btn.remove">Delete</button>
          </div>
        </div>
        <button class="hist-del" data-i18n-attr="title:btn.remove,aria-label:btn.remove" title="${escapeHtml(t('btn.remove'))}">✕</button>
      `;
      li.querySelector('.hist-del').addEventListener('click', (e) => {
        e.stopPropagation();
        swDeleteHistory(h.id);
      });
      li.querySelector('.hist-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        swDeleteHistory(h.id);
      });
      li.querySelector('.hist-export').addEventListener('click', (e) => {
        e.stopPropagation();
        swExportOne(h);
      });
      li.querySelector('.hist-head').addEventListener('click', () => {
        li.classList.toggle('is-open');
      });
      list.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- mode switching ----------
  function setMode(mode) {
    if (mode === state.mode) return;
    // pause whichever is running
    pause();
    if (state.sw.running) {
      state.sw.elapsedBase += performance.now() - state.sw.startAt;
      state.sw.running = false;
      cancelAnimationFrame(state.sw.rafId);
    }
    state.mode = mode;
    state.settings.mode = mode;
    saveSettings();
    el.body.dataset.mode = mode;

    $$('.preset.is-active').forEach(b => b.classList.remove('is-active'));
    el.tabs.forEach(t => {
      const active = t.dataset.mode === mode;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });

    if (mode === 'stopwatch') {
      el.body.dataset.phase = 'idle';
      renderStopwatch();
      renderHistory();
    } else {
      state.cycle = 0;
      state.selectedPresetSec = null;
      el.presets.style.display = mode === 'pomodoro' ? 'none' : '';
      if (mode === 'pomodoro') {
        state.phase = 'idle';
        state.durationMs = phaseDurationMs('work');
        state.remainingMs = state.durationMs;
      } else {
        state.phase = 'idle';
        state.durationMs = (state.settings.timerMinutes || 25) * 60 * 1000;
        state.remainingMs = state.durationMs;
      }
      render();
    }
  }

  // ---------- presets ----------
  function renderPresets() {
    // relabel built-in presets in the current language
    $$('.preset', el.presets).forEach(b => {
      if (b.id === 'preset-custom') return;
      if (b.dataset.custom === '1') return;
      const sec = +b.dataset.seconds;
      if (sec) {
        b.firstChild && b.firstChild.nodeType === 3
          ? b.firstChild.nodeValue = formatPreset(sec)
          : b.textContent = formatPreset(sec);
      }
    });
    $$('.preset', el.presets).forEach(b => { if (b.dataset.custom === '1') b.remove(); });
    (state.settings.customPresets || []).forEach((cp) => {
      const btn = document.createElement('button');
      btn.className = 'preset';
      btn.dataset.seconds = String(cp.seconds);
      btn.dataset.custom = '1';
      btn.textContent = cp.name || formatPreset(cp.seconds);
      const x = document.createElement('span');
      x.className = 'x';
      x.textContent = '×';
      x.title = t('btn.remove');
      x.addEventListener('click', (e) => {
        e.stopPropagation();
        // if the deleted preset was the active one, clear selection so timer
        // doesn't keep pointing at a gone value
        if (state.selectedPresetSec === cp.seconds) {
          state.selectedPresetSec = null;
          state.durationMs = (state.settings.timerMinutes || 25) * 60 * 1000;
          state.remainingMs = state.durationMs;
          render();
        }
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

  // ---------- sound generators ----------
  let audioCtx = null;
  function maybeUnlockAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  const SOUND_PRESETS = {
    // each returns duration (s) for one cycle
    chime(ctx, vol, t0) {
      [880, 1175, 1568].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain); gain.connect(ctx.destination);
        const start = t0 + i * 0.16;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.28 * vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
        osc.start(start); osc.stop(start + 0.6);
      });
      return 0.9;
    },
    bell(ctx, vol, t0) {
      // struck bell: fundamental + harmonics with long decay
      const freqs = [523.25, 1046.5, 1567.98, 2093];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(g); g.connect(ctx.destination);
        const amp = [0.45, 0.25, 0.15, 0.08][i] * vol;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(amp, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6 - i * 0.25);
        osc.start(t0); osc.stop(t0 + 1.7);
      });
      return 1.8;
    },
    beep(ctx, vol, t0) {
      [1000, 1000, 1000].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        osc.connect(g); g.connect(ctx.destination);
        const s = t0 + i * 0.18;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.18 * vol, s + 0.005);
        g.gain.setValueAtTime(0.18 * vol, s + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.12);
        osc.start(s); osc.stop(s + 0.14);
      });
      return 0.6;
    },
    soft(ctx, vol, t0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t0);
      osc.frequency.exponentialRampToValueAtTime(660, t0 + 0.4);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.8);
      osc.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2 * vol, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
      osc.start(t0); osc.stop(t0 + 1.2);
      return 1.2;
    },
    digital(ctx, vol, t0) {
      // quick data-beep pattern
      const pattern = [1760, 1318.5, 1760, 2093];
      pattern.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.connect(g); g.connect(ctx.destination);
        const s = t0 + i * 0.1;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.14 * vol, s + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.08);
        osc.start(s); osc.stop(s + 0.1);
      });
      return 0.5;
    },
  };

  function playSound(force = false) {
    if (!force && !state.settings.sound) return;
    maybeUnlockAudio();
    if (!audioCtx) return;
    const variant = SOUND_PRESETS[state.settings.soundType] || SOUND_PRESETS.chime;
    const vol = clamp((state.settings.soundVolume ?? 70) / 100, 0, 1);
    const repeat = clamp(state.settings.soundRepeat || 1, 1, 10);
    let t = audioCtx.currentTime + 0.02;
    for (let i = 0; i < repeat; i++) {
      const dur = variant(audioCtx, vol, t);
      t += dur + 0.15;
    }
  }

  // ---------- notifications ----------
  function notify() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try { new Notification('ReadySetTimer', { body: t('toast.done'), silent: true }); } catch {}
    }
  }
  function requestNotify() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  // ---------- fullscreen ----------
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
    const s = state.settings;
    el.optTimerMinutes.value = s.timerMinutes;
    el.optWork.value = s.work;
    el.optShort.value = s.shortBreak;
    el.optLong.value = s.longBreak;
    el.optLongEvery.value = s.longEvery;
    el.optAutostart.checked = !!s.autostart;
    el.optSound.checked = !!s.sound;
    el.optSoundType.value = s.soundType || 'chime';
    el.optSoundRepeat.value = s.soundRepeat || 1;
    el.optSoundVolume.value = s.soundVolume ?? 70;
    el.optVolVal.textContent = `${s.soundVolume ?? 70}%`;
    el.optColor.checked = !!s.color;
    el.optBigFinal.checked = !!s.bigFinal;
    el.optBigFinalSec.value = s.bigFinalSec || 6;
    el.settingsModal.showModal();
  }

  function saveSettingsFromForm() {
    const s = state.settings;
    s.timerMinutes = clamp(+el.optTimerMinutes.value || 25, 1, 600);
    s.work         = clamp(+el.optWork.value || 25, 1, 120);
    s.shortBreak   = clamp(+el.optShort.value || 5, 1, 60);
    s.longBreak    = clamp(+el.optLong.value || 15, 1, 60);
    s.longEvery    = clamp(+el.optLongEvery.value || 4, 2, 12);
    s.autostart    = el.optAutostart.checked;
    s.sound        = el.optSound.checked;
    s.soundType    = el.optSoundType.value;
    s.soundRepeat  = clamp(+el.optSoundRepeat.value || 1, 1, 10);
    s.soundVolume  = clamp(+el.optSoundVolume.value || 70, 0, 100);
    s.color        = el.optColor.checked;
    s.bigFinal     = el.optBigFinal.checked;
    s.bigFinalSec  = clamp(+el.optBigFinalSec.value || 6, 1, 60);
    saveSettings();
    updateSoundButton();
    if (state.mode !== 'stopwatch' && !state.running) {
      if (state.mode === 'pomodoro') {
        state.durationMs = phaseDurationMs(state.phase === 'idle' ? 'work' : state.phase);
        state.remainingMs = state.durationMs;
      } else if (!state.selectedPresetSec) {
        state.durationMs = s.timerMinutes * 60 * 1000;
        state.remainingMs = state.durationMs;
      }
    }
    render();
    toast(t('toast.settingsSaved'));
  }

  // ---------- custom preset modal ----------
  function openCustomPreset() {
    el.cpH.value = 0; el.cpM.value = 20; el.cpS.value = 0; el.cpName.value = '';
    el.customModal.showModal();
  }
  function saveCustomPreset() {
    const h = clamp(+el.cpH.value || 0, 0, 9);
    const m = clamp(+el.cpM.value || 0, 0, 59);
    const sec = clamp(+el.cpS.value || 0, 0, 59);
    const seconds = h * 3600 + m * 60 + sec;
    if (seconds < 1) { toast(t('toast.min1sec')); return; }
    const name = (el.cpName.value || '').trim() || formatPreset(seconds);
    state.settings.customPresets = state.settings.customPresets || [];
    if (state.settings.customPresets.length >= 12) state.settings.customPresets.shift();
    state.settings.customPresets.push({ seconds, name });
    saveSettings();
    renderPresets();
    toast(t('toast.presetSaved'));
  }

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
    if (state.settings.sound) { maybeUnlockAudio(); playSound(true); }
    toast(t(state.settings.sound ? 'toast.soundOn' : 'toast.soundOff'));
  });

  el.btnSettings.addEventListener('click', openSettings);
  el.settingsModal.addEventListener('close', () => {
    if (el.settingsModal.returnValue === 'save') saveSettingsFromForm();
  });
  // cancel buttons are type="button" to prevent them from being the form's default submit
  $('#btn-cancel-settings').addEventListener('click', () => el.settingsModal.close('cancel'));
  $('#btn-cancel-custom').addEventListener('click', () => el.customModal.close('cancel'));
  $('#btn-cancel-sw').addEventListener('click', () => el.swSaveModal.close('cancel'));
  $('#btn-close-settings')?.addEventListener('click', () => el.settingsModal.close('cancel'));
  $('#btn-close-custom')?.addEventListener('click', () => el.customModal.close('cancel'));
  $('#btn-close-sw')?.addEventListener('click', () => el.swSaveModal.close('cancel'));
  // Enter in any modal input should submit (save), not cancel
  [el.settingsModal, el.customModal].forEach(m => {
    m.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input, select')) {
        e.preventDefault();
        m.close('save');
      }
    });
  });
  el.btnTestSound.addEventListener('click', () => {
    // commit transient values for preview
    const prev = { ...state.settings };
    state.settings.sound = true;
    state.settings.soundType = el.optSoundType.value;
    state.settings.soundVolume = +el.optSoundVolume.value;
    state.settings.soundRepeat = +el.optSoundRepeat.value;
    maybeUnlockAudio();
    playSound(true);
    state.settings = prev; // restore (saveSettingsFromForm will persist on save)
  });
  el.optSoundVolume.addEventListener('input', () => {
    el.optVolVal.textContent = `${el.optSoundVolume.value}%`;
  });

  el.presetCustomBtn.addEventListener('click', (e) => { e.preventDefault(); openCustomPreset(); });
  el.customModal.addEventListener('close', () => {
    if (el.customModal.returnValue === 'save') saveCustomPreset();
  });

  el.swSaveModal.addEventListener('close', () => {
    if (el.swSaveModal.returnValue === 'save') commitSwSave();
    else swPending = null;
  });
  // Enter in label field submits
  el.swSaveLabel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      el.swSaveModal.close('save');
    }
  });

  el.presets.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset');
    if (!btn || btn.id === 'preset-custom') return;
    if (e.target.classList.contains('x')) return;
    const sec = +btn.dataset.seconds;
    if (!sec) return;
    selectPreset(sec, btn);
  });

  el.tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

  // stopwatch events
  el.swStart.addEventListener('click', swStartPause);
  el.swReset.addEventListener('click', swReset);
  el.swLap.addEventListener('click', swLap);
  el.swSave.addEventListener('click', swSaveRun);
  el.swClearAll.addEventListener('click', swClearAllHistory);
  el.swExportAll?.addEventListener('click', swExportAll);

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // don't hijack keys while any dialog is open
    if (document.querySelector('dialog[open]')) return;
    const key = e.key;
    switch (key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        state.mode === 'stopwatch' ? swStartPause() : toggleStart();
        break;
      case 'r': case 'R':
        state.mode === 'stopwatch' ? swReset() : reset(true);
        break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'm': case 'M': {
        const order = ['timer', 'pomodoro', 'stopwatch'];
        const next = order[(order.indexOf(state.mode) + 1) % order.length];
        setMode(next);
        break;
      }
      case 'n': case 'N':
        if (state.mode !== 'stopwatch') skip();
        break;
      case 'l': case 'L':
        if (state.mode === 'stopwatch') swLap();
        break;
      case 's': case 'S':
        if (state.mode === 'stopwatch') swSaveRun();
        else {
          state.settings.sound = !state.settings.sound;
          saveSettings(); updateSoundButton();
          toast(t(state.settings.sound ? 'toast.soundOn' : 'toast.soundOff'));
        }
        break;
      default:
        if (state.mode === 'timer' && /^[1-9]$/.test(key)) {
          // skip the "+ 직접 입력" button; only real presets count
          const all = $$('.preset', el.presets).filter(b => b.id !== 'preset-custom' && b.dataset.seconds);
          const btn = all[+key - 1];
          if (btn) selectPreset(+btn.dataset.seconds, btn);
        }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (state.mode !== 'stopwatch' && state.running) {
      state.remainingMs = Math.max(0, state.endAt - performance.now());
      if (state.remainingMs <= 0) finishPhase();
      else { cancelAnimationFrame(state.rafId); state.rafId = requestAnimationFrame(tick); }
    } else if (state.mode === 'stopwatch' && state.sw.running) {
      cancelAnimationFrame(state.sw.rafId);
      state.sw.rafId = requestAnimationFrame(swTick);
    }
  });

  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}

  // ---------- i18n wiring ----------
  function rebuildLangUI() {
    // populate language <select> in settings
    const sel = $('#opt-lang');
    if (sel && I18N) {
      sel.innerHTML = '';
      Object.entries(I18N.LOCALES).forEach(([code, name]) => {
        const o = document.createElement('option');
        o.value = code; o.textContent = name;
        if (code === I18N.getLang()) o.selected = true;
        sel.appendChild(o);
      });
    }
    // populate language popover (topbar globe button menu)
    const menu = $('#lang-menu');
    if (menu && I18N) {
      menu.innerHTML = '';
      Object.entries(I18N.LOCALES).forEach(([code, name]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lang-menu-item' + (code === I18N.getLang() ? ' is-active' : '');
        b.dataset.lang = code;
        b.textContent = name;
        b.addEventListener('click', () => {
          I18N.setLang(code);
          applyLangChange();
          menu.hidden = true;
        });
        menu.appendChild(b);
      });
    }
  }

  function applyLangChange() {
    if (!I18N) return;
    I18N.applyI18n();
    // re-render everything that embeds translated strings inside JS
    renderPresets();
    if (state.mode === 'stopwatch') { renderStopwatch(); renderHistory(); }
    else render();
    // redraw volume suffix
    if (el.optVolVal) el.optVolVal.textContent = `${state.settings.soundVolume ?? 70}%`;
    rebuildLangUI();
  }

  // lang menu toggle
  const langBtn = $('#btn-lang');
  const langMenu = $('#lang-menu');
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.hidden = !langMenu.hidden;
      if (!langMenu.hidden) {
        const rect = langBtn.getBoundingClientRect();
        langMenu.style.top = `${rect.bottom + 6}px`;
        langMenu.style.right = `${window.innerWidth - rect.right}px`;
      }
    });
    document.addEventListener('click', (e) => {
      if (!langMenu.hidden && !langMenu.contains(e.target) && e.target !== langBtn) langMenu.hidden = true;
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') langMenu.hidden = true; });
  }
  // lang change via settings select
  const optLang = $('#opt-lang');
  if (optLang && I18N) {
    optLang.addEventListener('change', () => {
      I18N.setLang(optLang.value);
      applyLangChange();
    });
  }

  // ---------- init ----------
  function init() {
    if (I18N) { I18N.applyI18n(); }
    rebuildLangUI();
    updateSoundButton();
    renderPresets();
    el.body.dataset.mode = state.mode;

    el.tabs.forEach(t => {
      const active = t.dataset.mode === state.mode;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });

    if (state.mode === 'stopwatch') {
      renderStopwatch();
      renderHistory();
    } else {
      el.presets.style.display = state.mode === 'pomodoro' ? 'none' : '';
      if (state.mode === 'pomodoro') {
        state.phase = 'idle';
        state.durationMs = phaseDurationMs('work');
        state.remainingMs = state.durationMs;
      } else {
        state.durationMs = (state.settings.timerMinutes || 25) * 60 * 1000;
        state.remainingMs = state.durationMs;
      }
      render();
      renderHistory(); // populate hidden history too (in case user switches)
    }
  }

  init();
})();
