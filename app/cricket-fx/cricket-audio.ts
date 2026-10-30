import { getPrefs, subscribePrefs } from '@/lib/fx/prefs';
import { sound } from '@/lib/fx/sound';

export type CricketMomentKind = 'boundary' | 'wicket' | 'run-out' | 'level';

/** Original synthesis only. Reuses the game's gesture-unlocked context; never unlocks itself. */
export function playCricketCue(kind: CricketMomentKind): () => void {
  const prefs = getPrefs();
  const ctx = sound.context;
  if (!prefs.sound || prefs.volume <= 0 || typeof document === 'undefined' || document.hidden || !ctx || ctx.state !== 'running') return () => {};

  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];
  let ended = false;
  const master = ctx.createGain();
  master.gain.value = prefs.volume * .18;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -18;
  limiter.knee.value = 12;
  limiter.ratio.value = 12;
  limiter.attack.value = .003;
  limiter.release.value = .12;
  master.connect(limiter).connect(ctx.destination);
  nodes.push(master, limiter);
  const now = ctx.currentTime + .012;
  const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.9), ctx.sampleRate);
  const samples = noise.getChannelData(0);
  // Low-pass-correlated noise is an abstract crowd wash, not a recording of a crowd.
  let previous = 0;
  for (let i = 0; i < samples.length; i++) samples[i] = previous = (previous + (Math.random() * 2 - 1) * .24) / 1.24;

  const burst = (at: number, duration: number, gain: number, frequency: number) => {
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .65;
    const envelope = ctx.createGain();
    const start = now + at;
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(.025, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter).connect(envelope).connect(master);
    source.start(start); source.stop(start + duration + .01);
    sources.push(source); nodes.push(source, filter, envelope);
  };
  const knock = (at: number, frequency: number, gain = .4) => {
    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now + at);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .45, now + at + .08);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(gain, now + at);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + at + .12);
    oscillator.connect(envelope).connect(master);
    oscillator.start(now + at); oscillator.stop(now + at + .13);
    sources.push(oscillator); nodes.push(oscillator, envelope);
  };

  if (kind === 'boundary') {
    knock(.14, 760, .65); burst(.14, .09, .7, 1850); // bat on leather
    burst(.35, 1.45, .72, 880); // stadium cheer swell
    [.5, .68, .9, 1.1].forEach((at, i) => burst(at, .08, .65, 1800 + i * 100));
  } else if (kind === 'level') {
    [.2, .4, .62, .86].forEach(at => burst(at, .1, .5, 1700));
    burst(.3, 1.15, .3, 900);
  } else {
    // A quiet ball/bails sound and sympathetic stadium breath, never a victory fanfare.
    const at = kind === 'run-out' ? .72 : .42;
    burst(.1, .6, .24, 680);
    knock(at, 960, .45); knock(at + .08, 1450, .22); burst(at, .08, .32, 2100);
  }

  let unsubscribe = () => {};
  const stop = () => {
    if (ended) return;
    ended = true;
    clearTimeout(timer);
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisibility);
    for (const source of sources) { try { source.stop(); } catch { /* already ended */ } }
    for (const node of nodes) { try { node.disconnect(); } catch { /* already disconnected */ } }
  };
  const onVisibility = () => { if (document.hidden) stop(); };
  unsubscribe = subscribePrefs(next => {
    if (!next.sound || next.volume <= 0) stop();
    else master.gain.setTargetAtTime(next.volume * .18, ctx.currentTime, .02);
  });
  document.addEventListener('visibilitychange', onVisibility);
  const timer = setTimeout(stop, 2200);
  return stop;
}
