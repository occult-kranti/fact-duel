/**
 * ui/ceremony.tsx — `h-ceremony` host (bible §5, §9). The shell mounts <CeremonyHost/> once. Only two
 * kinds exist — 'label' (a new band) and 'file' (the first clear of a file) — and if both fire the
 * budget merges them into ONE ceremony with two stamps. Screens ask `useBudget().ceremony(…)`.
 *
 * Scrim + centred card (r-xl), a 240px 3D slot (THAPPA; 2D stamps until the three lane lands), title,
 * subtitle, one Continue button. role="dialog" aria-modal, focus trapped and restored, Esc = Continue.
 * Paper chits (confetti recoloured by base.css), `levelUp` / `stamp` cue, heavy haptic — once.
 */
import { useEffect, useRef } from 'react';
import { useJuice } from '@/components/fx';
import { budget, useBudgetSnapshot, type BudgetCeremony } from '../budget';
import { Thappa, ThappaArt } from '../three/thappa';
import { Button } from './button';
import './ceremony.css';

function CeremonyCard({ ceremony }: { ceremony: BudgetCeremony }) {
  const juice = useJuice();
  const card = useRef<HTMLDivElement>(null);
  const cont = useRef<HTMLButtonElement>(null);
  const [head, ...rest] = ceremony.parts;
  const hasLabel = ceremony.parts.some((p) => p.kind === 'label');

  // Once per ceremony id: cue, haptic, paper chits. Focus the only action; restore focus on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    cont.current?.focus();
    juice.sound(hasLabel ? 'levelUp' : 'stamp');
    juice.haptic('heavy');
    juice.confetti('stamp');
    return () => before?.focus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ceremony.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        budget.closeCeremony();
        return;
      }
      if (e.key !== 'Tab' || !card.current) return;
      const focusable = card.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const titleId = `${ceremony.id}-title`;
  return (
    <div className="h-ceremony" role="presentation">
      <div className="h-ceremony__scrim" aria-hidden="true" />
      <div className="h-ceremony__card" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={card}>
        <div className="h-ceremony__slot">
          {ceremony.parts.length === 1 ? (
            // The card already played its cue + heavy haptic on open: the 3D stamp lands silently.
            <Thappa text={head.stamp} kind="noted" seed={head.seed ?? head.stamp} height={200} cues={false} />
          ) : (
            <div className="h-ceremony__stamps" role="img" aria-label={`Stamped: ${ceremony.parts.map((p) => p.stamp).join(', ')}.`}>
              {ceremony.parts.map((p) => (
                <ThappaArt key={p.kind} text={p.stamp} kind="noted" seed={p.seed ?? p.stamp} />
              ))}
            </div>
          )}
        </div>
        {head.kicker ? <p className="h-ceremony__kicker">{head.kicker}</p> : null}
        <h2 className="h-ceremony__title" id={titleId}>
          {head.titleHi ? (
            <span className="h-ceremony__titlehi" lang="hi">
              {head.titleHi}
            </span>
          ) : null}
          <span>{head.title}</span>
        </h2>
        {head.subtitle ? <p className="h-ceremony__sub">{head.subtitle}</p> : null}
        {rest.map((p) => (
          <p key={p.kind} className="h-ceremony__also">
            <strong>{p.title}</strong>
            {p.subtitle ? ` — ${p.subtitle}` : null}
          </p>
        ))}
        <Button ref={cont} variant="primary" block onClick={() => budget.closeCeremony()}>
          {ceremony.continueLabel}
        </Button>
      </div>
    </div>
  );
}

export function CeremonyHost() {
  const { ceremony } = useBudgetSnapshot();
  return ceremony ? <CeremonyCard key={ceremony.id} ceremony={ceremony} /> : null;
}
