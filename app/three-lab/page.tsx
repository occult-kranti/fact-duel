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
            <p>Knowledge core · level scales rings, brightness and particles · pointer parallax</p>
          </div>
          <div className="lab-stage">
            {orbMounted ? (
              <LazyHeroOrb
                level={level}
                accent={accent}
                intensity={intensity}
                parallax={parallax}
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
