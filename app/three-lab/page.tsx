'use client';
import './three-lab.css';
import { useEffect, useRef, useState } from 'react';
import {
  GemVaultFallback,
  LazyGemVault,
  LazyHeroOrb,
  LazyRewardMedal,
  LazyStampCase3D,
  type MedalTier,
  type MedalVariant,
  type StampInfo,
} from '@/components/three';

const ACCENTS = [
  { id: 'volt', hex: '#d4ff3a' },
  { id: 'gold', hex: '#ffc83d' },
  { id: 'cyan', hex: '#4ee1ff' },
  { id: 'magenta', hex: '#ff5ea8' },
];
const VARIANTS: MedalVariant[] = ['level', 'achievement', 'stamp', 'streak'];
const TIERS: MedalTier[] = ['bronze', 'silver', 'gold'];
const STAMP_COLORS = [
  '#d4ff3a',
  '#ffc83d',
  '#4ee1ff',
  '#ff5ea8',
  '#8ef0c2',
  '#ff9a3d',
  '#9d8bff',
  '#ffe27a',
  '#5ad1ff',
];

// §4.4's pulse map and §4.9's budget, restated. brain-core keeps `rateFor`, `PULSE_DEPTH` and the
// cost table private, and this lab is the only screen where a human reads the ceiling off a surface
// instead of inferring it from a moving canvas — so the numbers have to be printed, not implied.
const WAKE_MODES = 4;
const REST_RATE = 0.27;
const MAX_RATE = 1.5;
const PULSE_DEPTH = 0.25;
const SCALE_REST = 0.012;
const SCALE_GAIN = 0.014;
const WAVE_AMP = 0.16;
const EMBER_MAX = 0.3;
const pulseRate = (heat: number) => REST_RATE + (MAX_RATE - REST_RATE) * Math.pow(heat, 0.75);

/** What §4.9 was measured against, so a reading can be judged without opening the spec. */
const BUDGET = { tris: 5120, kb: 150, devMs: 3.82, phoneMs: 15 };

interface BrainBudget {
  detail: number;
  tris: number;
  verts: number;
  kb: number;
  ms: number;
  hitMs: number;
}

/**
 * Dynamic import on purpose: this page is server-rendered, and components/three/index.ts exists
 * precisely so no route pulls three into its SSR pass. Two calls, not one — the second is a
 * guaranteed module-cache hit, which is what makes a near-zero first reading legible as "the hero
 * already built this level" rather than "the build is free".
 */
async function measureBrain(level: number): Promise<BrainBudget> {
  const { brainGeometry } = await import('@/components/three/brain-core');
  const t0 = performance.now();
  const geometry = brainGeometry(level);
  const ms = performance.now() - t0;
  const t1 = performance.now();
  brainGeometry(level);
  const hitMs = performance.now() - t1;
  let bytes = geometry.index?.array.byteLength ?? 0;
  for (const attribute of Object.values(geometry.attributes)) {
    const array = (attribute as { array?: ArrayBufferView }).array;
    if (array) bytes += array.byteLength;
  }
  const verts = geometry.attributes.position.count;
  return { detail: level, tris: (geometry.index?.count ?? verts) / 3, verts, kb: bytes / 1024, ms, hitMs };
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function ThreeLabPage() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [level, setLevel] = useState(24);
  const [accent, setAccent] = useState(ACCENTS[0].hex);
  const [intensity, setIntensity] = useState(1);
  const [parallax, setParallax] = useState(true);
  const [heat, setHeat] = useState(0);
  // The lab opens on the woken brain: a locked core is one slider notch away, but a scene that boots
  // as today's sphere hides the thing this page exists to inspect.
  const [modes, setModes] = useState(WAKE_MODES);
  const [detail, setDetail] = useState(4);
  const [budget, setBudget] = useState<BrainBudget | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [orbMounted, setOrbMounted] = useState(true);
  const [stress, setStress] = useState<{ running: boolean; cycles: number }>({ running: false, cycles: 0 });
  const stressTimer = useRef<number | null>(null);

  const [variant, setVariant] = useState<MedalVariant>('level');
  const [tier, setTier] = useState<MedalTier>('gold');
  const [medalAccent, setMedalAccent] = useState(ACCENTS[2].hex);
  const [replayKey, setReplayKey] = useState(0);

  const [gems, setGems] = useState(12);
  const [stamps, setStamps] = useState<StampInfo[]>(
    STAMP_COLORS.map((color, i) => ({ id: `route-${i + 1}`, color, earned: i % 3 !== 2 })),
  );

  useEffect(() => {
    setWebgl(detectWebGL());
    return () => {
      if (stressTimer.current) window.clearInterval(stressTimer.current);
    };
  }, []);

  // Runs before the lazy hero chunk resolves, so the first reading at L = 4 is a genuinely cold
  // build rather than the module cache the orb will have warmed a beat later.
  useEffect(() => {
    let live = true;
    measureBrain(detail).then((next) => {
      if (live) setBudget(next);
    });
    return () => {
      live = false;
    };
  }, [detail]);

  const remeasure = () => {
    setMeasuring(true);
    measureBrain(detail)
      .then(setBudget)
      .finally(() => setMeasuring(false));
  };

  const runStress = () => {
    if (stress.running) return;
    let cycles = 0;
    setStress({ running: true, cycles: 0 });
    stressTimer.current = window.setInterval(() => {
      cycles += 1;
      setOrbMounted((m) => !m);
      setStress({ running: cycles < 40, cycles: Math.floor(cycles / 2) });
      if (cycles >= 40 && stressTimer.current) {
        window.clearInterval(stressTimer.current);
        stressTimer.current = null;
        setOrbMounted(true);
      }
    }, 160);
  };

  const earned = stamps.filter((s) => s.earned).length;
  const rate = pulseRate(heat);
  const brainState = modes >= WAKE_MODES ? 'awake' : modes >= 2 ? 'forming' : 'locked core';
  // Derived rather than flagged on the way into the effect: a stale reading is exactly the one whose
  // level no longer matches the slider, and saying so needs no second state write.
  const busy = measuring || budget?.detail !== detail;

  return (
    <main className="three-lab">
      <header>
        <div>
          <h1>
            FACT<span>//</span>DUEL · 3D lab
          </h1>
          <p className="lab-sub">
            React Three Fiber scenes, client-only, procedural lighting, no network assets.{' '}
            {webgl === null
              ? 'Checking WebGL…'
              : webgl
                ? 'WebGL available.'
                : 'WebGL unavailable: fallbacks shown.'}
          </p>
        </div>
        <div className="lab-chips" aria-label="Palette">
          {[
            ['midnight', '#0b0f14'],
            ['volt', '#d4ff3a'],
            ['gold', '#ffc83d'],
            ['cyan', '#4ee1ff'],
            ['magenta', '#ff5ea8'],
          ].map(([name, hex]) => (
            <span key={name} className="lab-chip" style={{ '--chip': hex } as React.CSSProperties}>
              <i /> {name} {hex}
            </span>
          ))}
        </div>
      </header>

      <div className="lab-grid">
        <section className="lab-card wide" aria-labelledby="orb-title">
          <div className="lab-card-head">
            <h2 id="orb-title">Hero orb</h2>
            <p>
              Knowledge core · level scales rings, brightness and particles · pointer parallax · modes wake
              the brain at 4, landed-call heat sets its rate
            </p>
          </div>
          <div className="lab-stage">
            {orbMounted ? (
              <LazyHeroOrb
                level={level}
                accent={accent}
                intensity={intensity}
                parallax={parallax}
                modesPlayed={modes}
                heat={heat}
                height={440}
              />
            ) : (
              <div style={{ height: 440 }} />
            )}
          </div>
          <div className="lab-controls">
            <label className="lab-field">
              Level
              <input
                type="range"
                min={1}
                max={60}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                aria-label="Level"
              />
              <output>{level}</output>
            </label>
            <label className="lab-field">
              Intensity
              <input
                type="range"
                min={0.5}
                max={1.8}
                step={0.05}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                aria-label="Intensity"
              />
              <output>{intensity.toFixed(2)}</output>
            </label>
            <label className="lab-field">
              Heat
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={heat}
                onChange={(e) => setHeat(Number(e.target.value))}
                aria-label="Landed-conviction heat"
              />
              <output>{heat.toFixed(2)}</output>
            </label>
            <label className="lab-field">
              Modes played
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={modes}
                onChange={(e) => setModes(Number(e.target.value))}
                aria-label="Distinct modes played"
              />
              <output>
                {modes}/6 · {brainState}
              </output>
            </label>
            <span className="lab-note">
              Pulse at heat {heat.toFixed(2)} — rate <b>{rate.toFixed(2)} Hz</b> of a hard{' '}
              {MAX_RATE.toFixed(2)} Hz ceiling · depth <b>{PULSE_DEPTH.toFixed(2)}</b>, constant at every heat
              · scale ±{(100 * (SCALE_REST + SCALE_GAIN * heat)).toFixed(1)}% · wave{' '}
              {(WAVE_AMP * heat).toFixed(3)} · ember mix {(EMBER_MAX * heat).toFixed(2)}.
            </span>
            <span className="lab-note">
              Heat counts only calls that already landed above Steady, over the last 20 resolved expedition
              answers. A pending stake, a selected tier and a missed call are all unreachable from it — a miss
              can only cool this slider, never push it.
            </span>
            <div className="lab-group" role="group" aria-label="Accent">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="lab-swatch"
                  style={{ '--swatch': a.hex } as React.CSSProperties}
                  aria-label={`Accent ${a.id}`}
                  aria-pressed={accent === a.hex}
                  onClick={() => setAccent(a.hex)}
                />
              ))}
            </div>
            <button
              type="button"
              className="lab-btn"
              aria-pressed={parallax}
              onClick={() => setParallax((p) => !p)}
            >
              Parallax
            </button>
            <button type="button" className="lab-btn" onClick={() => setOrbMounted((m) => !m)}>
              {orbMounted ? 'Unmount' : 'Mount'}
            </button>
            <button type="button" className="lab-btn" onClick={runStress} disabled={stress.running}>
              {stress.running ? `Stress… ${stress.cycles}/20` : 'Mount/unmount ×20'}
            </button>
          </div>
        </section>

        <section className="lab-card wide" aria-labelledby="budget-title">
          <div className="lab-card-head">
            <h2 id="budget-title">Brain budget</h2>
            <p>
              §4.9, measured in this browser rather than quoted · the hero always builds L=4, so detail is an
              escape hatch and not a shipping switch
            </p>
          </div>
          <div className="lab-controls">
            <label className="lab-field">
              Detail
              <input
                type="range"
                min={3}
                max={4}
                step={1}
                value={detail}
                onChange={(e) => setDetail(Number(e.target.value))}
                aria-label="Mesh subdivision level"
              />
              <output>L={detail}</output>
            </label>
            <button
              type="button"
              className="lab-btn primary"
              style={{ minHeight: 44 }}
              onClick={remeasure}
              disabled={busy}
            >
              {busy ? 'Measuring…' : 'Re-measure'}
            </button>
            {budget && !busy ? (
              <>
                <span className="lab-field">
                  Triangles <output>{budget.tris.toLocaleString()}</output>
                </span>
                <span className="lab-field">
                  Vertices <output>{budget.verts.toLocaleString()}</output>
                </span>
                <span className="lab-field">
                  Buffers <output>{budget.kb.toFixed(0)} KB</output>
                </span>
                <span className="lab-field">
                  Build <output>{budget.ms.toFixed(2)} ms</output>
                </span>
                <span className="lab-field">
                  Cache hit <output>{budget.hitMs.toFixed(2)} ms</output>
                </span>
                <span className="lab-note">
                  Budget at L=4: <b>{BUDGET.tris.toLocaleString()}</b> triangles · ~<b>{BUDGET.kb} KB</b> of
                  GPU buffers · <b>{BUDGET.devMs.toFixed(2)} ms</b> to build on an x86 dev box, with{' '}
                  <b>10–{BUDGET.phoneMs} ms</b> the allowance on a mid phone at 3–4× slower scalar JS. This
                  reading is{' '}
                  {budget.tris === BUDGET.tris ? 'on' : budget.tris < BUDGET.tris ? 'under' : 'over'} the
                  triangle line and {budget.ms <= BUDGET.phoneMs ? 'inside' : 'outside'} the phone allowance.
                </span>
                <span className="lab-note">
                  {budget.ms < 0.25
                    ? 'Near-zero build: L=' +
                      budget.detail +
                      ' was already in the module cache — the hero warmed it. Reload the page for a cold number.'
                    : 'Cold build. The cache makes every later mount free, so this cost is paid once per page load, behind the SceneFrame skeleton rather than as a dropped frame.'}
                </span>
                <span className="lab-note">
                  L=3 is 1,280 triangles and loses the midline — it reads as a bean, which is why the ship
                  value is 4 on every device. If a mid phone ever drops frames, the five orbit rings are 2,048
                  triangles each (10,240 total) and the particle buffer rewrites every frame: cut those first.
                </span>
              </>
            ) : (
              <span className="lab-note">Building the mesh…</span>
            )}
          </div>
        </section>

        <section className="lab-card" aria-labelledby="medal-title">
          <div className="lab-card-head">
            <h2 id="medal-title">Reward medal</h2>
            <p>Spring flip-in · drei Float + Sparkles · geometry-only emblems</p>
          </div>
          <div className="lab-stage">
            <LazyRewardMedal
              variant={variant}
              tier={tier}
              accent={medalAccent}
              replayKey={replayKey}
              height={380}
            />
          </div>
          <div className="lab-controls">
            <div className="lab-group" role="group" aria-label="Variant">
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="lab-btn"
                  aria-pressed={variant === v}
                  onClick={() => {
                    setVariant(v);
                    setReplayKey((k) => k + 1);
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            {variant === 'achievement' && (
              <div className="lab-group" role="group" aria-label="Tier">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="lab-btn"
                    aria-pressed={tier === t}
                    onClick={() => {
                      setTier(t);
                      setReplayKey((k) => k + 1);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            {variant === 'stamp' && (
              <div className="lab-group" role="group" aria-label="Stamp accent">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="lab-swatch"
                    style={{ '--swatch': a.hex } as React.CSSProperties}
                    aria-label={`Stamp accent ${a.id}`}
                    aria-pressed={medalAccent === a.hex}
                    onClick={() => setMedalAccent(a.hex)}
                  />
                ))}
              </div>
            )}
            <button type="button" className="lab-btn primary" onClick={() => setReplayKey((k) => k + 1)}>
              Replay flip
            </button>
          </div>
        </section>

        <section className="lab-card" aria-labelledby="stamps-title">
          <div className="lab-card-head">
            <h2 id="stamps-title">Stamp case</h2>
            <p>{earned}/9 earned · instanced discs · tilts toward the pointer · tap a stamp to toggle</p>
          </div>
          <div className="lab-stage">
            <LazyStampCase3D
              stamps={stamps}
              height={380}
              onSelect={(id) =>
                setStamps((list) => list.map((s) => (s.id === id ? { ...s, earned: !s.earned } : s)))
              }
            />
          </div>
          <div className="lab-controls">
            <button
              type="button"
              className="lab-btn"
              onClick={() => setStamps((list) => list.map((s) => ({ ...s, earned: true })))}
            >
              Earn all
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => setStamps((list) => list.map((s) => ({ ...s, earned: false })))}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="lab-card wide" aria-labelledby="vault-title">
          <div className="lab-card-head">
            <h2 id="vault-title">Gem vault</h2>
            <p>Rapier physics · instanced octahedra · tap the tray to nudge · CSS fallback beside it</p>
          </div>
          <div className="lab-split">
            <div className="lab-stage">
              <span className="lab-tag">WebGL + rapier</span>
              <LazyGemVault count={gems} height={420} />
            </div>
            <div className="lab-stage">
              <span className="lab-tag">CSS fallback</span>
              <GemVaultFallback count={gems} height={420} />
            </div>
          </div>
          <div className="lab-controls">
            <span className="lab-field">
              Gems <output>{gems}</output>
            </span>
            <button
              type="button"
              className="lab-btn primary"
              onClick={() => setGems((g) => Math.min(120, g + 1))}
            >
              +1 gem
            </button>
            <button type="button" className="lab-btn" onClick={() => setGems((g) => Math.min(120, g + 5))}>
              +5
            </button>
            <button type="button" className="lab-btn" onClick={() => setGems((g) => Math.min(120, g + 25))}>
              +25
            </button>
            <button type="button" className="lab-btn" onClick={() => setGems((g) => Math.max(0, g - 5))}>
              −5
            </button>
            <button type="button" className="lab-btn" onClick={() => setGems(0)}>
              Empty
            </button>
            <span className="lab-note">Max 120 rigid bodies; the oldest gem is recycled beyond that.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
