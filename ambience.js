// Ambient music engine for "Para Mari" — a tender harp/piano texture
// composed live with the Web Audio API. Tap the toggle to play.
(function () {
  const toggleBtn = document.getElementById('audio-toggle');
  if (!toggleBtn) return;

  const REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ctx = null;
  let master = null;
  let convolver = null;
  let on = false;
  let loopId = null;
  let scheduledUntil = 0;
  let suspendedByVisibility = false;

  // Note frequencies (well-tempered, A4 = 440)
  function f(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  // MIDI helpers
  const C4 = 60, C5 = 72;

  // Lullaby-like progression in C: I - vi - IV - V (Cmaj9, Am9, Fmaj7, G/B)
  // Each chord = bass + soft pad + melodic arpeggio over 2 beats.
  const PROGRESSION = [
    { bass: C4 - 12,        chord: [C4, C4+4, C4+7, C4+11, C4+14], mel: [C5+7, C5+11, C5+14, C5+11] },
    { bass: C4 - 12 + 9,    chord: [C4-3, C4+0, C4+4, C4+7, C4+12], mel: [C5+9, C5+12, C5+14, C5+9] },
    { bass: C4 - 12 + 5,    chord: [C4+5, C4+9, C4+12, C4+16],     mel: [C5+5, C5+9, C5+12, C5+9]  },
    { bass: C4 - 12 + 7,    chord: [C4+7, C4+11, C4+14, C4+17],    mel: [C5+11, C5+14, C5+17, C5+14] }
  ];

  // Synthetic plate-style IR for warmth.
  function buildIR(duration = 2.6, decay = 2.4) {
    const sr = ctx.sampleRate;
    const len = sr * duration;
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return buf;
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    convolver = ctx.createConvolver();
    convolver.buffer = buildIR();
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    convolver.connect(wet).connect(master);
    // Two paths: dry to master, wet through convolver
    master._wet = wet;
  }

  /* ----- A single pluck voice (harp-y / pianish hybrid) ----- */
  function pluck(midi, when, dur = 1.2, gain = 0.15, kind = 'mel') {
    const t = when;
    const freq = f(midi);
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noise = ctx.createBufferSource();
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const ndata = noiseBuf.getChannelData(0);
    for (let i = 0; i < ndata.length; i++) ndata[i] = (Math.random() * 2 - 1) * (1 - i / ndata.length);
    noise.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = gain * 0.4;

    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.005; // detuned octave for shimmer
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = gain * 0.15;

    // gentle low-pass for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'bass' ? 700 : 2400;
    filter.Q.value = 0.6;

    const env = ctx.createGain();
    env.gain.value = 0;
    // Pluck envelope
    const atk = 0.005;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + atk);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter); osc2.connect(osc2Gain).connect(filter);
    noise.connect(noiseGain).connect(filter);
    filter.connect(env);
    // Split dry/wet
    const dry = ctx.createGain(); dry.gain.value = 0.7;
    env.connect(dry).connect(master);
    env.connect(convolver);

    osc.start(t); osc2.start(t); noise.start(t);
    osc.stop(t + dur + 0.05);
    osc2.stop(t + dur + 0.05);
    noise.stop(t + 0.06);
  }

  function pad(midi, when, dur = 4, gain = 0.04) {
    const t = when;
    const freq = f(midi);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.005;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;

    const env = ctx.createGain();
    env.gain.value = 0;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 1.2);
    env.gain.linearRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter); osc2.connect(filter);
    filter.connect(env);
    env.connect(master);
    env.connect(convolver);

    osc.start(t); osc2.start(t);
    osc.stop(t + dur + 0.1); osc2.stop(t + dur + 0.1);
  }

  /* ----- Schedule one bar of music starting at time `t` ----- */
  let barIdx = 0;
  function scheduleBar(t) {
    const bpm = 64;
    const beat = 60 / bpm;
    const chord = PROGRESSION[barIdx % PROGRESSION.length];

    // Soft pad on the chord
    chord.chord.forEach((m, i) => pad(m, t + i * 0.04, beat * 4, 0.03));

    // Bass on beat 1
    pluck(chord.bass, t, beat * 3, 0.13, 'bass');

    // Arpeggio melody — 4 notes spread across the bar with a touch of swing
    chord.mel.forEach((m, i) => {
      const swing = (i % 2 === 1) ? 0.06 : 0;
      const tt = t + (i * beat) + swing + (Math.random() * 0.012 - 0.006);
      const g = 0.10 + Math.random() * 0.04;
      pluck(m, tt, beat * 1.6, g, 'mel');
    });

    // Occasional sparkle high note every other bar
    if (barIdx % 2 === 0) pluck(chord.mel[0] + 12, t + beat * 2.2, beat * 2, 0.07, 'mel');

    barIdx++;
  }

  function lookahead() {
    if (!on) return;
    const ahead = 1.6;
    while (scheduledUntil < ctx.currentTime + ahead) {
      scheduleBar(scheduledUntil);
      scheduledUntil += (60 / 64) * 4;
    }
  }

  function start() {
    init();
    if (ctx.state === 'suspended') ctx.resume();
    on = true;
    scheduledUntil = ctx.currentTime + 0.05;
    barIdx = 0;
    // Lower master gain under reduced-motion (still play if user opts in).
    const targetGain = REDUCED_MOTION ? 0.30 : 0.55;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 1.2);
    if (loopId) clearInterval(loopId);
    loopId = setInterval(lookahead, 200);
    toggleBtn.classList.remove('off'); toggleBtn.classList.add('on');
    window.dispatchEvent(new CustomEvent('mari:audio', { detail: { on: true } }));
  }

  function stop() {
    on = false;
    if (loopId) { clearInterval(loopId); loopId = null; }
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    }
    toggleBtn.classList.remove('on'); toggleBtn.classList.add('off');
    window.dispatchEvent(new CustomEvent('mari:audio', { detail: { on: false } }));
  }

  function toggle() { if (on) stop(); else start(); }

  toggleBtn.addEventListener('click', toggle);

  // Suspend audio when the page is hidden; resume when visible.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      if (on && ctx.state === 'running') {
        ctx.suspend();
        if (loopId) { clearInterval(loopId); loopId = null; }
        suspendedByVisibility = true;
      }
    } else if (suspendedByVisibility) {
      suspendedByVisibility = false;
      if (on) {
        ctx.resume();
        scheduledUntil = ctx.currentTime + 0.05;
        if (loopId) clearInterval(loopId);
        loopId = setInterval(lookahead, 200);
      }
    }
  });

  window.Ambience = {
    toggle, start, stop,
    isOn: () => on
  };
})();
