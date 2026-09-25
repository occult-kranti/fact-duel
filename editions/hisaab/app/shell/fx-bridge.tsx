/**
 * shell/fx-bridge.tsx — routes the shared fx layer's pop-ups through the edition's budget.
 *
 * components/fx's FxProvider owns particles, sound and haptics, and would also render JHK-styled
 * toasts and ceremonies. Inside this bridge, `useJuice().toast/ceremony` (and anything else that reads
 * FxContext) land in app/budget.ts instead: one toast per visit, ceremonies only 'label' / 'file' —
 * JHK's own kinds (level, achievement, stamp, streak) become Activity entries. The fx layer's own
 * budget is kept quiet whenever ours is held, so nothing can slip past during a live round.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import { FxContext, useFx, type FxContextValue } from '@/components/fx';
import { budget, useBudgetSnapshot, type ToastTone } from '../budget';

const TONES: Record<string, ToastTone> = { quest: 'quest', streak: 'streak', xp: 'xp' };

export function FxBudgetBridge({ children }: { children: ReactNode }) {
  const fx = useFx();
  const { held } = useBudgetSnapshot();

  useEffect(() => {
    fx?.setQuiet(held);
  }, [fx, held]);

  const value = useMemo<FxContextValue | null>(
    () =>
      fx && {
        ...fx,
        toasts: [],
        toast: (input) => budget.toast({ title: input.title, body: input.body, tone: TONES[input.kind] ?? 'info' }) ?? '',
        dismissToast: (id) => budget.dismissToast(id),
        clearToasts: () => {},
        ceremony: null,
        openCeremony: (input) =>
          budget.ceremony({ kind: input.kind, kicker: input.kicker, title: input.title ?? input.kind, subtitle: input.subtitle, continueLabel: input.continueLabel }) ?? '',
        closeCeremony: () => budget.closeCeremony(),
        pendingOverlays: 0,
        setQuiet: (quiet) => budget.setLive(quiet),
      },
    [fx],
  );
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}
