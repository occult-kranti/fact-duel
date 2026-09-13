/**
 * app/fx-lab/page.tsx — audition page for the juice system.
 *
 * One button per sound cue, haptic, burst preset, particle emitter, toast kind and ceremony
 * kind, plus live pref toggles, a counter, an XP pop and shake demos. Client-only; wraps itself
 * in `<FxProvider>` so it works without touching the root layout. Renders at 390 px without
 * horizontal overflow (see fx-lab.css).
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Rocket } from 'lucide-react';
import {
  CUES,
  FxProvider,
  HAPTIC_PATTERNS,
  NumberCounter,
  XpPop,
  setPref,
  sound,
  useJuice,
  usePrefs,
  useReducedMotion,
  type BurstPreset,
  type CeremonyKind,
  type ConfettiPreset,
  type Cue,
  type HapticKind,
  type ToastKind,
} from '@/components/fx';
import { particles } from '@/lib/fx/particles';
import './fx-lab.css';

const BURSTS: BurstPreset[] = ['correct', 'wrong', 'win', 'gem', 'levelUp', 'stamp', 'combo'];
const CONFETTI: ConfettiPreset[] = ['win', 'levelUp', 'achievement', 'stamp', 'streak', 'rain'];
const TOASTS: ToastKind[] = ['xp', 'quest', 'achievement', 'streak', 'gem', 'info'];
const CEREMONIES: CeremonyKind[] = ['level', 'achievement', 'stamp', 'streak'];
const HAPTICS = Object.keys(HAPTIC_PATTERNS) as HapticKind[];

const TOAST_COPY: Record<ToastKind, { title: string; body: string }> = {
  xp: { title: '+25 XP', body: 'Quick Draw · correct in 1.8 s' },
  quest: { title: 'Quest complete', body: 'Answer 3 science questions' },
  achievement: { title: 'Sharpshooter', body: 'Five correct answers in a row' },
  streak: { title: '4-day streak', body: 'Come back tomorrow to keep it' },
  gem: { title: 'Gem found', body: 'A rare fact joins your journal' },
  info: { title: 'Room ready', body: 'Your friend has joined' },
};

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="lab-section">
      <h2>{title}</h2>
      {note ? <p className="muted">{note}</p> : null}
      {children}
    </section>
  );
}

function Lab() {
  const juice = useJuice();
  const prefs = usePrefs();
  const reduced = useReducedMotion();
  const [status, setStatus] = useState('Tap any button. Audio unlocks on the first tap.');
  const [testing, setTesting] = useState(false);
  const [score, setScore] = useState(1250);
  const [popKey, setPopKey] = useState<number | undefined>(undefined);
  const [popAmount, setPopAmount] = useState(25);
  const shakeTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'FX Lab — FACT//DUEL';
  }, []);

  const say = (s: string) => setStatus(s);

  const previewAll = async () => {
    setTesting(true);
    say('Previewing every cue…');
    await sound.test();
    setTesting(false);
    say('Preview finished.');
  };

  const openCeremony = (kind: CeremonyKind, withSlot = false) => {
    juice.ceremony({
      kind,
      title:
        kind === 'level'
          ? 'Level 12'
          : kind === 'achievement'
            ? 'Sharpshooter'
            : kind === 'stamp'
              ? 'Deep Sea Route'
              : '7-day streak',
      subtitle:
        kind === 'level'
          ? 'Your knowledge keeps climbing.'
          : kind === 'achievement'
            ? 'Five correct answers in a row.'
            : kind === 'stamp'
              ? 'Expedition complete — stamp added to your case.'
              : 'Seven days of duels. Keep it burning.',
      rewards: [
        { label: 'XP', value: '+250', icon: '✦' },
        { label: 'Coins', value: '+40', icon: '◎' },
        { label: 'New title', value: 'Trivia Hound' },
      ],
      slot: withSlot ? <div className="lab-slot">LVL 12</div> : undefined,
      onClose: () => say(`Ceremony "${kind}" closed`),
    });
    say(`Ceremony "${kind}" opened`);
  };

  return (
    <main className="lab">
      <div className="lab-head">
        <h1>FX Lab</h1>
        <Link className="lab-home" href="/">
          <ArrowLeft size={16} aria-hidden="true" /> Back to the clubhouse
        </Link>
      </div>
      <p className="muted">
        Every layer of feedback in one place: procedural sound, haptics, particles, toasts and ceremonies.
      </p>
      <div className="lab-status" role="status" aria-live="polite">
        {status}
      </div>

      <Section
        title="Preferences"
        note="Stored in localStorage under the same keys the settings dialog uses."
      >
        <div className="lab-prefs">
          <button
            type="button"
            className="lab-btn"
            aria-pressed={prefs.sound}
            onClick={() => {
              setPref('sound', !prefs.sound);
              say(`Sound ${!prefs.sound ? 'on' : 'off'}`);
            }}
          >
            Sound {prefs.sound ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="lab-btn"
            aria-pressed={prefs.haptics}
            onClick={() => {
              setPref('haptics', !prefs.haptics);
              say(`Haptics ${!prefs.haptics ? 'on' : 'off'}`);
            }}
          >
            Haptics {prefs.haptics ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="lab-btn"
            aria-pressed={prefs.motion === 'reduced'}
            onClick={() => {
              const next = prefs.motion === 'reduced' ? 'full' : 'reduced';
              setPref('motion', next);
              say(`Motion pref: ${next}${reduced && next === 'full' ? ' (OS still asks for reduced)' : ''}`);
            }}
          >
            Motion {prefs.motion}
            <small>{reduced ? 'reduced motion active' : 'full motion active'}</small>
          </button>
          <button
            type="button"
            className="lab-btn lab-btn--primary"
            onClick={() => {
              if (testing) {
                sound.stop();
                setTesting(false);
                say('Preview stopped.');
              } else void previewAll();
            }}
          >
            {testing ? 'Stop preview' : 'Preview all sounds'}
          </button>
          <label className="lab-range">
            <span>Volume {Math.round(prefs.volume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={prefs.volume}
              onChange={(e) => setPref('volume', Number(e.target.value))}
              onPointerUp={() => sound.play('tap')}
            />
          </label>
        </div>
      </Section>

      <Section
        title="Sound cues"
        note="All procedural — oscillators, noise, filters and envelopes. Each ≤ 1.2 s."
      >
        <div className="lab-grid lab-grid--narrow">
          {CUES.map((cue: Cue) => (
            <button
              type="button"
              key={cue}
              className="lab-btn"
              onClick={() => {
                const len = juice.sound(
                  cue,
                  cue === 'combo' ? { n: 3 } : cue === 'xp' ? { n: 25 } : undefined,
                );
                say(`sound("${cue}") · ${len ? `${Math.round(len * 1000)} ms` : 'skipped'}`);
              }}
            >
              {cue}
            </button>
          ))}
          <button type="button" className="lab-btn" onClick={() => juice.sound('combo', { n: 6 })}>
            combo <small>n = 6</small>
          </button>
          <button type="button" className="lab-btn" onClick={() => juice.sound('combo', { n: 10 })}>
            combo <small>n = 10</small>
          </button>
          <button type="button" className="lab-btn" onClick={() => juice.sound('xp', { n: 250 })}>
            xp <small>n = 250</small>
          </button>
          <button type="button" className="lab-btn" onClick={() => juice.sound('correct', { pitch: 1.5 })}>
            correct <small>pitch 1.5</small>
          </button>
        </div>
      </Section>

      <Section
        title="Haptics"
        note="navigator.vibrate patterns; silent where unsupported (iOS Safari, desktop)."
      >
        <div className="lab-grid lab-grid--narrow">
          {HAPTICS.map((kind) => (
            <button
              type="button"
              key={kind}
              className="lab-btn"
              onClick={() =>
                say(`haptic("${kind}") → ${juice.haptic(kind) ? 'vibrated' : 'unsupported or off'}`)
              }
            >
              {kind}
              <small>[{HAPTIC_PATTERNS[kind].join(', ')}]</small>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Burst presets" note="Particles + cue + haptic at the button. ‘wrong’ also shakes it.">
        <div className="lab-grid">
          {BURSTS.map((preset) => (
            <button
              type="button"
              key={preset}
              className="lab-btn"
              onClick={(e) => {
                juice.burst(e.currentTarget, preset, preset === 'combo' ? { n: 5 } : undefined);
                say(`burst("${preset}")`);
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Particle emitters"
        note="Raw emitters. Under reduced motion: ≤ 6 particles, and confetti becomes a ring pulse."
      >
        <div className="lab-grid">
          {CONFETTI.map((preset) => (
            <button
              type="button"
              key={preset}
              className="lab-btn"
              onClick={() => {
                juice.confetti(preset);
                say(`confetti("${preset}")`);
              }}
            >
              confetti <small>{preset}</small>
            </button>
          ))}
          <button
            type="button"
            className="lab-btn"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              particles.sparkle({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 18 });
              say('sparkle()');
            }}
          >
            sparkle
          </button>
          <button
            type="button"
            className="lab-btn"
            onClick={(e) => {
              juice.floatText(e.currentTarget, '+25 XP');
              say('floatText("+25 XP")');
            }}
          >
            floatText
          </button>
          <button
            type="button"
            className="lab-btn"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              particles.ringPulse({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
              say('ringPulse()');
            }}
          >
            ringPulse
          </button>
          <button
            type="button"
            className="lab-btn"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              particles.coinFountain({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 22 });
              juice.sound('stamp', { pitch: 1.25 });
              juice.haptic('success');
              say('coinFountain()');
            }}
          >
            coinFountain
          </button>
        </div>
      </Section>

      <Section
        title="Toasts"
        note="Max 3 visible, the rest queue. Hover or focus pauses the timer. aria-live=polite."
      >
        <div className="lab-grid">
          {TOASTS.map((kind) => (
            <button
              type="button"
              key={kind}
              className="lab-btn"
              onClick={() => {
                juice.toast({ kind, ...TOAST_COPY[kind] });
                say(`toast("${kind}")`);
              }}
            >
              toast <small>{kind}</small>
            </button>
          ))}
          <button
            type="button"
            className="lab-btn"
            onClick={() => {
              TOASTS.forEach((kind, i) =>
                juice.toast({
                  kind,
                  title: `${TOAST_COPY[kind].title} (${i + 1}/6)`,
                  body: TOAST_COPY[kind].body,
                }),
              );
              say('6 toasts queued');
            }}
          >
            queue six
          </button>
          <button
            type="button"
            className="lab-btn"
            onClick={() => {
              juice.toast({
                kind: 'achievement',
                title: 'Custom icon',
                body: 'Any ReactNode works',
                icon: <Rocket size={20} />,
              });
              say('toast with custom icon');
            }}
          >
            custom icon
          </button>
        </div>
      </Section>

      <Section
        title="Ceremonies"
        note="Focus-trapped dialog, Escape closes, body scroll locked, confetti + cue on open."
      >
        <div className="lab-grid">
          {CEREMONIES.map((kind) => (
            <button type="button" key={kind} className="lab-btn" onClick={() => openCeremony(kind)}>
              ceremony <small>{kind}</small>
            </button>
          ))}
          <button type="button" className="lab-btn" onClick={() => openCeremony('level', true)}>
            ceremony <small>custom slot</small>
          </button>
        </div>
      </Section>

      <Section
        title="Counter & XP pop"
        note="Eased count-up with tabular digits (ticks while counting); pill pops beside the score."
      >
        <div className="lab-card">
          <div>
            <div className="eyebrow">Score</div>
            <div className="lab-score">
              <NumberCounter value={score} duration={900} tick />
              <XpPop amount={popAmount} popKey={popKey} placement="right" />
            </div>
          </div>
          <div className="lab-grid lab-grid--narrow" style={{ flex: '1 1 220px' }}>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                setScore((s) => s + 25);
                setPopAmount(25);
                setPopKey(Date.now());
                say('+25');
              }}
            >
              +25
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                setScore((s) => s + 250);
                setPopAmount(250);
                setPopKey(Date.now());
                say('+250');
              }}
            >
              +250
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                setScore((s) => s + 1000);
                setPopAmount(1000);
                setPopKey(Date.now());
                say('+1,000');
              }}
            >
              +1,000
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                setScore(0);
                say('reset');
              }}
            >
              reset
            </button>
          </div>
        </div>
      </Section>

      <Section title="Shake" note="WAAPI translate jitter, ~350 ms, decaying. None under reduced motion.">
        <div className="lab-card">
          <div ref={shakeTarget} className="lab-target">
            shake me
          </div>
          <div className="lab-grid lab-grid--narrow" style={{ flex: '1 1 220px' }}>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                juice.shake(shakeTarget.current, 1);
                say('shake(element)');
              }}
            >
              element
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                juice.shake(shakeTarget.current, 2.5);
                say('shake(element, 2.5)');
              }}
            >
              element ×2.5
            </button>
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                juice.shake(undefined, 1);
                say('shake(page)');
              }}
            >
              whole page
            </button>
          </div>
        </div>
      </Section>
    </main>
  );
}

export default function FxLabPage() {
  return (
    <FxProvider>
      <Lab />
    </FxProvider>
  );
}
