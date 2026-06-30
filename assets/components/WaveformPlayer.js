/**
 * WaveformPlayer — framework-free port of the React <WaveformPlayer /> component
 * (WaveformPlayer.jsx). Same waveform extraction and real-time spectrum
 * reaction, but as a plain ES module so it drops into this no-build static site.
 *
 * Mount it on any element:
 *   import mountWaveformPlayer from './WaveformPlayer.js';
 *   const wfp = mountWaveformPlayer(el, {
 *     src: '/audio/track.mp3', color: '#808081', columns: 96, height: 120,
 *   });
 *   // wfp.play() · wfp.pause() · wfp.toggle() · wfp.setSrc(url) · wfp.destroy()
 *
 * Notes:
 *  - client-only (touches window / Web Audio) — call it in the browser;
 *  - playback starts on a user gesture (click the waveform or the play button);
 *  - remote audio needs Access-Control-Allow-Origin to feed the live spectrum,
 *    otherwise the bars stay flat; same-origin files and blob: URLs always work.
 */
export default function mountWaveformPlayer(target, props = {}) {
  const {
    src = '',
    columns = 96,
    color = '#808081',
    height = 120,
    background = 'transparent',
    reactivity = 'spectrum',
    baseline = 'center',   // 'center' = grow from middle · 'bottom' = stand on the floor
    controls = true,
    onPlayingChange = null,
  } = props;

  const cssHeight = typeof height === 'number' ? `${height}px` : height;

  /* ---------- DOM (mirrors the JSX return) ---------- */
  const root = document.createElement('div');
  root.className = 'wfp';
  root.style.height = cssHeight;

  const canvas = document.createElement('canvas');
  canvas.className = 'wfp-canvas';
  root.appendChild(canvas);

  let btn = null;
  let timeEl = null;
  if (controls) {
    const bar = document.createElement('div');
    bar.className = 'wfp-bar';
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wfp-btn';
    btn.textContent = 'play';
    timeEl = document.createElement('span');
    timeEl.className = 'wfp-time';
    timeEl.textContent = '0:00 / 0:00';
    bar.appendChild(btn);
    bar.appendChild(timeEl);
    root.appendChild(bar);
  }

  const audio = document.createElement('audio');
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
  root.appendChild(audio);

  target.appendChild(root);

  /* ---------- mutable, non-rendering state ---------- */
  const S = {
    peaks: [], levels: [], display: [], buffer: null,
    actx: null, srcNode: null, analyser: null, freq: null, timeData: null, raf: 0,
  };
  let playing = false;
  let duration = 0;
  let mix = 0;          // 0 = resting waveform, 1 = live equalizer
  let targetMix = 0;

  const ctx = canvas.getContext('2d');

  /* ---------- waveform extraction ---------- */
  const extractPeaks = (buffer, cols) => {
    const raw = buffer.getChannelData(0);
    const block = Math.floor(raw.length / cols);
    const out = new Array(cols).fill(0);
    for (let i = 0; i < cols; i++) {
      let p = 0; const s = block * i;
      for (let j = 0; j < block; j++) { const v = Math.abs(raw[s + j] || 0); if (v > p) p = v; }
      out[i] = p;
    }
    const max = Math.max.apply(null, out) || 1;
    return out.map((v) => v / max);
  };

  /* Light 3-tap smoothing so a single loud block doesn't spike one tall column. */
  const smooth = (arr) => {
    const out = arr.slice();
    for (let i = 0; i < arr.length; i++) {
      const a = i > 0 ? arr[i - 1] : arr[i];
      const c = i < arr.length - 1 ? arr[i + 1] : arr[i];
      out[i] = (a + 2 * arr[i] + c) / 4;
    }
    return out;
  };

  /* Deterministic stand-in so the waveform is visible before a real track loads. */
  const placeholderPeaks = (cols) => {
    const out = new Array(cols);
    for (let i = 0; i < cols; i++) {
      const env = Math.sin((i / Math.max(1, cols - 1)) * Math.PI);
      const detail = Math.abs(Math.sin(i * 0.7) * 0.6 + Math.sin(i * 1.9) * 0.4);
      out[i] = 0.12 + env * detail * 0.85;
    }
    return out;
  };

  /* ---------- rendering (one continuous stepped shape, no seams) ---------- */
  const render = (values) => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (background !== 'transparent') { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
    const cols = values.length; if (!cols) return;
    const colW = w / cols;
    const floorY = baseline === 'bottom' ? h : h / 2;   // where columns stand
    const span = baseline === 'bottom' ? h : h / 2;      // max column height
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    for (let c = 0; c < cols; c++) {
      const t = floorY - Math.max(2, values[c] * span);
      ctx.lineTo(c * colW, t);
      ctx.lineTo((c + 1) * colW, t);
    }
    ctx.lineTo(cols * colW, floorY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawStatic = () => {
    const vals = S.peaks.length === columns
      ? S.peaks
      : (S.buffer ? smooth(extractPeaks(S.buffer, columns)) : placeholderPeaks(columns));
    S.peaks = vals;
    render(vals);
  };

  /* ---------- live analysis ---------- */
  const readLevels = () => {
    if (S.levels.length !== columns) S.levels = new Array(columns).fill(0);
    if (!S.analyser) return;

    if (reactivity === 'level') {
      S.analyser.getByteTimeDomainData(S.timeData);
      let sum = 0;
      for (let i = 0; i < S.timeData.length; i++) { const v = (S.timeData[i] - 128) / 128; sum += v * v; }
      const rms = Math.min(1, Math.sqrt(sum / S.timeData.length) * 2.6);
      for (let i = 0; i < columns; i++) {
        const x = (i / Math.max(1, columns - 1)) * 2 - 1;
        const shape = Math.pow(1 - Math.abs(x), 1.4);
        const tgt = rms * shape;
        S.levels[i] = Math.max(tgt, S.levels[i] * 0.9 - 0.003);
      }
    } else {
      S.analyser.getByteFrequencyData(S.freq);
      const bins = S.analyser.frequencyBinCount;
      const minBin = 1, maxBin = Math.max(minBin + columns, Math.floor(bins * 0.85));
      for (let i = 0; i < columns; i++) {
        // log-spaced band → average every bin inside it (full, even response)
        const b0 = Math.floor(minBin * Math.pow(maxBin / minBin, i / columns));
        let b1 = Math.floor(minBin * Math.pow(maxBin / minBin, (i + 1) / columns));
        if (b1 <= b0) b1 = b0 + 1;
        let sum = 0, n = 0;
        for (let b = b0; b < b1 && b < bins; b++) { sum += S.freq[b]; n++; }
        let v = n ? (sum / n) / 255 : 0;
        // spectral tilt: tame the bass, lift the highs so no single bar dominates the left
        const tilt = 0.55 + 0.95 * (i / Math.max(1, columns - 1));
        v = Math.pow(v * tilt, 0.85) * 1.25;
        if (v > 1) v = 1; if (v < 0) v = 0;
        S.levels[i] = Math.max(v, S.levels[i] * 0.90 - 0.004); // gravity fall
      }
    }
  };

  const startLoop = () => { if (!S.raf) S.raf = requestAnimationFrame(animate); };

  const animate = () => {
    mix += (targetMix - mix) * 0.09;          // smooth fade between the two states
    readLevels();
    if (S.display.length !== columns) S.display = new Array(columns).fill(0);
    const rest = S.peaks.length === columns ? S.peaks : null;
    for (let i = 0; i < columns; i++) {
      const r = rest ? rest[i] : 0;
      S.display[i] = r + ((S.levels[i] || 0) - r) * mix;   // waveform ⟷ equalizer
    }
    render(S.display);
    if (!playing && mix < 0.002) {            // fully faded out → settle on the resting waveform
      S.raf = 0; mix = 0; drawStatic();
    } else {
      S.raf = requestAnimationFrame(animate);
    }
  };

  /* ---------- audio graph ---------- */
  const ensureGraph = () => {
    if (!S.actx) S.actx = new (window.AudioContext || window.webkitAudioContext)();
    if (!S.srcNode) {
      S.srcNode = S.actx.createMediaElementSource(audio);
      S.analyser = S.actx.createAnalyser();
      S.analyser.fftSize = 1024;
      S.analyser.smoothingTimeConstant = 0.8;
      S.srcNode.connect(S.analyser);
      S.analyser.connect(S.actx.destination);
      S.freq = new Uint8Array(S.analyser.frequencyBinCount);
      S.timeData = new Uint8Array(S.analyser.fftSize);
    }
  };

  const toggle = async () => {
    if (!audio.src) return;
    ensureGraph();
    if (S.actx.state === 'suspended') await S.actx.resume();
    if (audio.paused) audio.play(); else audio.pause();
  };

  /* ---------- transport ---------- */
  const fmt = (t) => {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const updateTime = () => { if (timeEl) timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(duration)}`; };

  const notifyPlaying = (value) => { if (typeof onPlayingChange === 'function') onPlayingChange(value); };

  canvas.addEventListener('pointerdown', toggle);
  if (btn) btn.addEventListener('click', toggle);
  audio.addEventListener('play', () => { playing = true; targetMix = 1; if (btn) btn.textContent = 'pause'; startLoop(); notifyPlaying(true); });
  audio.addEventListener('pause', () => { playing = false; targetMix = 0; if (btn) btn.textContent = 'play'; startLoop(); notifyPlaying(false); });
  audio.addEventListener('ended', () => { playing = false; targetMix = 0; if (btn) btn.textContent = 'play'; startLoop(); notifyPlaying(false); });
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('loadedmetadata', () => { duration = audio.duration || 0; updateTime(); });

  const ro = new ResizeObserver(() => { if (S.raf) render(S.display); else drawStatic(); });
  ro.observe(canvas);

  /* ---------- load on src ---------- */
  const load = (url) => {
    if (!url) { S.peaks = []; S.buffer = null; drawStatic(); return; }
    audio.src = url;
    (async () => {
      try {
        const res = await fetch(url);
        const ab = await res.arrayBuffer();
        S.actx = S.actx || new (window.AudioContext || window.webkitAudioContext)();
        const buf = await S.actx.decodeAudioData(ab.slice(0));
        S.buffer = buf;
        duration = buf.duration; updateTime();
        S.peaks = smooth(extractPeaks(buf, columns));
        drawStatic();
      } catch (e) {
        S.peaks = []; drawStatic();
        console.warn('[WaveformPlayer] decode failed:', e);
      }
    })();
  };

  load(src);
  drawStatic();

  return {
    el: root,
    audio,
    isPlaying: () => playing,
    play: () => audio.play(),
    pause: () => audio.pause(),
    toggle,
    setSrc: load,
    destroy: () => { ro.disconnect(); cancelAnimationFrame(S.raf); audio.pause(); root.remove(); },
  };
}
