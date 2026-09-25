/**
 * editions/hisaab/app/budget.ts — the notification budget (charter §7, design bible §9), binding.
 *
 *   import { useBudget, useQuietRound, useHoldToasts } from '@/editions/hisaab/app/budget';
 *   const b = useBudget();
 *   b.toast({ title: '+2 quests · 110 XP', body: 'Aaj ke 3 kaam' });          // ≤ 1 per screen visit
 *   b.ceremony({ kind: 'file', title: 'Uttar Pradesh ki file clear.', stamp: 'FILE CLEARED · 18/24' });
 *   useQuietRound(live);   // from the countdown to round.result: nothing opens, no WebGL may mount
 *   useHoldToasts(true);   // an untimed route card: toasts wait for the finish screen
 *
 * It wraps `createOverlayBudget` (components/fx/overlay-budget.ts — capacity, gap, priority, quiet) with
 * the edition's stricter rules:
 *
 *  1. TOASTS: at most ONE per screen visit. A visit starts on every route change (the shell calls
 *     `newVisit(route.path)`) and when a sheet opens (`useVisit(key)`). While that visit's toast is
 *     waiting or on screen, later requests MERGE into it (the caller's `merge` writes the words, else
 *     "<first> · +n more"). Once it has been dismissed, later requests in the same visit go unshown to
 *     the Activity log (Profile › Activity) — logged, never lost. A toast still waiting when the visit
 *     ends is logged too, not carried to the next screen. Settings › Quiet everything (`setToastsOff`)
 *     sends every toast straight to Activity.
 *  2. CEREMONIES: only kinds 'label' (a new band) and 'file' (the FIRST clear of a state / sector /
 *     Kiska Media / Forward Court file). Any other kind (level, achievement, stamp, streak, rank…) is
 *     downgraded to an Activity entry — screens update those in place. If a label and a file ceremony
 *     are both pending or open, they MERGE into one ceremony with two stamps. Ceremonies survive visit
 *     changes (a promotion earned in a room is shown on the next screen).
 *  3. QUIET: `setLive(true)` (or `useQuietRound`) from the countdown to `round.result` and during the
 *     pass-and-play hand-over. Nothing opens while live, and three/SceneHost refuses to mount. The fx
 *     layer's own budget is quieted too (the shell bridges it). `hold()` is a softer quiet for untimed
 *     cards: overlays wait, but it is not a live round.
 *  4. Inline, not toast: "Copied ✓" on the button, offline banners and errors are the screen's job.
 *
 * Pure apart from React's useSyncExternalStore; `createHisaabBudget` takes an injectable clock, and
 * tests/hisaab-ui-foundation.test.mjs drives it in node.
 */
import { useEffect, useId, useSyncExternalStore } from 'react';
import { createOverlayBudget, type OverlayClock, type OverlayGrant } from '@/components/fx/overlay-budget';

// ---- payloads ------------------------------------------------------------------------------------

export type ToastTone = 'info' | 'quest' | 'streak' | 'xp';

export type BudgetToastInput = {
  title: string;
  body?: string;
  tone?: ToastTone;
  /**
   * Write the merged copy when several requests land in one visit's toast. Read off the FIRST
   * request of the visit. Default: the first title, body "+n more: <second title>…".
   */
  merge?: (items: readonly BudgetToastInput[]) => { title: string; body?: string };
};

export type BudgetToast = Readonly<{ id: string; title: string; body?: string; tone: ToastTone; count: number }>;

export type CeremonyKind = 'label' | 'file';
/** One stamp inside a ceremony (a merged ceremony has two). */
export type CeremonyPart = Readonly<{
  kind: CeremonyKind;
  /** Small line above the title, e.g. 'Label promotion' / 'File cleared'. */
  kicker?: string;
  title: string;
  /** Devanagari twin of the title (label ceremonies show it above the Latin). */
  titleHi?: string;
  subtitle?: string;
  /** The stamp word(s): 'ISSUED · RECEIPT MAANGO', 'FILE CLEARED · 18/24'. */
  stamp: string;
  /** Seed for the stamp's rotation (an item, route or band id). */
  seed?: string;
}>;

export type BudgetCeremonyInput = {
  /** Anything but 'label' | 'file' is downgraded to Activity (in-place). */
  kind: CeremonyKind | (string & {});
  kicker?: string;
  title: string;
  titleHi?: string;
  subtitle?: string;
  stamp?: string;
  seed?: string;
  continueLabel?: string;
};

export type BudgetCeremony = Readonly<{
  id: string;
  /** In ask order; the first part is the headline, every part gets its stamp. */
  parts: readonly CeremonyPart[];
  continueLabel: string;
}>;

export type ActivityEntry = Readonly<{
  id: string;
  at: number;
  /** 'toast' | 'ceremony:<kind>' | 'update' */
  kind: string;
  title: string;
  body?: string;
  /** False when the budget kept it off screen (it only lives here). */
  shown: boolean;
  /** The visit it happened in (route path). */
  visit: string;
}>;

export type BudgetSnapshot = Readonly<{
  version: number;
  /** A live round: nothing may open and no WebGL may mount. */
  live: boolean;
  /** Overlays are held (live or a hold). */
  held: boolean;
  toastsOff: boolean;
  visit: string;
  /** What may be on screen now (the budget allows one toast per visit; the host renders these). */
  toasts: readonly BudgetToast[];
  ceremony: BudgetCeremony | null;
  /** Newest first, at most ACTIVITY_LIMIT. */
  activity: readonly ActivityEntry[];
}>;

export const TOASTS_PER_VISIT = 1;
export const CEREMONY_KINDS: readonly CeremonyKind[] = Object.freeze(['label', 'file']);
/** How long a toast stays (bible §5 h-toast: 4 s; paused while hovered or focused). */
export const TOAST_MS = 4000;
export const ACTIVITY_LIMIT = 60;

type ToastPayload = { t: 'toast'; items: BudgetToastInput[] };
type CeremonyPayload = { t: 'ceremony'; parts: CeremonyPart[]; continueLabel: string };
type Payload = ToastPayload | CeremonyPayload;

const defaultMerge = (items: readonly BudgetToastInput[]) => {
  const [head, ...rest] = items;
  if (!rest.length) return { title: head.title, body: head.body };
  const more = rest.map((i) => i.title).slice(0, 2).join(' · ');
  const extra = rest.length > 2 ? ` · +${rest.length - 2} more` : '';
  return { title: head.title, body: `${head.body ? `${head.body} · ` : ''}+${rest.length} more: ${more}${extra}` };
};

const isCeremonyKind = (k: string): k is CeremonyKind => (CEREMONY_KINDS as readonly string[]).includes(k);

export type HisaabBudget = ReturnType<typeof createHisaabBudget>;

export function createHisaabBudget(options: { clock?: OverlayClock } = {}) {
  const clock = options.clock;
  const overlay = createOverlayBudget<Payload>({ clock });
  const now = () => (clock ? clock.now() : Date.now());
  const listeners = new Set<() => void>();

  let visit = '/';
  /** This visit's toast: its overlay id while queued or on screen; `used` once it has been shown. */
  let visitToast: { id: string; items: BudgetToastInput[]; shown: boolean } | null = null;
  let visitToastUsed = false;
  let ceremonyId: string | null = null;
  let live = false;
  let holds = 0;
  let toastsOff = false;
  let seq = 0;
  let version = 0;
  const activity: ActivityEntry[] = [];

  const nextId = (p: string) => `${p}-${(seq += 1)}`;

  const log = (entry: Omit<ActivityEntry, 'id' | 'at' | 'visit'>) => {
    activity.unshift(Object.freeze({ ...entry, id: nextId('act'), at: now(), visit }));
    if (activity.length > ACTIVITY_LIMIT) activity.length = ACTIVITY_LIMIT;
  };

  const inOverlay = (id: string | null) => {
    if (!id) return null;
    const snap = overlay.getSnapshot();
    const active = snap.active.find((g) => g.id === id || g.ids.includes(id));
    if (active) return { grant: active, live: true as const };
    const queued = snap.queued.find((g) => g.id === id || g.ids.includes(id));
    return queued ? { grant: queued, live: false as const } : null;
  };

  const toastView = (grant: OverlayGrant<Payload>): BudgetToast | null => {
    const payload = grant.items[0];
    if (!payload || payload.t !== 'toast') return null;
    const items = payload.items;
    const words = (items[0].merge ?? defaultMerge)(items);
    return Object.freeze({ id: grant.id, title: words.title, body: words.body, tone: items[0].tone ?? 'info', count: items.length });
  };

  const ceremonyView = (grant: OverlayGrant<Payload>): BudgetCeremony | null => {
    const payload = grant.items[0];
    if (!payload || payload.t !== 'ceremony') return null;
    return Object.freeze({ id: grant.id, parts: Object.freeze(payload.parts.slice()), continueLabel: payload.continueLabel });
  };

  let snapshot: BudgetSnapshot = build();
  function build(): BudgetSnapshot {
    const snap = overlay.getSnapshot();
    const toasts: BudgetToast[] = [];
    let ceremony: BudgetCeremony | null = null;
    for (const grant of snap.active) {
      if (grant.type === 'toast') {
        const t = toastView(grant);
        if (t) toasts.push(t);
      } else if (!ceremony) ceremony = ceremonyView(grant);
    }
    return Object.freeze({
      version,
      live,
      held: live || holds > 0,
      toastsOff,
      visit,
      toasts: Object.freeze(toasts),
      ceremony,
      activity: Object.freeze(activity.slice()),
    });
  }

  const emit = () => {
    version += 1;
    snapshot = build();
    for (const fn of Array.from(listeners)) fn();
  };

  // Mark the visit toast as shown when the overlay grants it.
  overlay.subscribe(() => {
    if (visitToast && !visitToast.shown && inOverlay(visitToast.id)?.live) visitToast.shown = true;
    emit();
  });

  const syncQuiet = () => overlay.setQuiet(live || holds > 0);

  /** A new screen visit (route change, sheet open): the one-toast allowance resets. */
  function newVisit(key: string) {
    if (key === visit) return;
    if (visitToast) {
      const where = inOverlay(visitToast.id);
      if (where && !where.live) {
        // Still waiting: it belonged to the screen that raised it. Log it instead of carrying it over.
        const words = (visitToast.items[0].merge ?? defaultMerge)(visitToast.items);
        log({ kind: 'toast', title: words.title, body: words.body, shown: false });
      }
      if (where) overlay.release(visitToast.id);
    }
    visit = key;
    visitToast = null;
    visitToastUsed = false;
    emit();
  }

  /** Ask for this visit's toast. Returns its id, or null when it went to Activity instead. */
  function toast(input: BudgetToastInput): string | null {
    if (toastsOff) {
      log({ kind: 'toast', title: input.title, body: input.body, shown: false });
      emit();
      return null;
    }
    if (visitToast && inOverlay(visitToast.id)) {
      visitToast.items.push(input);
      overlay.request({ id: visitToast.id, type: 'toast', payload: { t: 'toast', items: visitToast.items.slice() } });
      log({ kind: 'toast', title: input.title, body: input.body, shown: true });
      emit();
      return visitToast.id;
    }
    if (visitToastUsed || visitToast) {
      log({ kind: 'toast', title: input.title, body: input.body, shown: false });
      emit();
      return null;
    }
    const id = nextId('toast');
    visitToast = { id, items: [input], shown: false };
    visitToastUsed = true;
    log({ kind: 'toast', title: input.title, body: input.body, shown: true });
    overlay.request({ id, type: 'toast', payload: { t: 'toast', items: [input] } });
    return id;
  }

  function dismissToast(id: string) {
    overlay.release(id);
  }

  /** Ask for a ceremony. Returns its id, or null when the kind is not allowed (logged as an update). */
  function ceremony(input: BudgetCeremonyInput): string | null {
    if (!isCeremonyKind(input.kind)) {
      log({ kind: 'update', title: input.title, body: input.subtitle, shown: false });
      emit();
      return null;
    }
    const part: CeremonyPart = Object.freeze({
      kind: input.kind,
      kicker: input.kicker,
      title: input.title,
      titleHi: input.titleHi,
      subtitle: input.subtitle,
      stamp: input.stamp ?? (input.kind === 'file' ? 'FILE CLEARED' : 'ISSUED'),
      seed: input.seed,
    });
    log({ kind: `ceremony:${input.kind}`, title: input.title, body: input.subtitle, shown: true });
    const existing = ceremonyId ? inOverlay(ceremonyId) : null;
    if (existing && ceremonyId) {
      const payload = existing.grant.items[0] as CeremonyPayload;
      // One ceremony, two stamps: a second part of the other kind joins; a repeat of a kind replaces it.
      const parts = payload.parts.filter((p) => p.kind !== part.kind);
      const merged = part.kind === 'label' ? [part, ...parts] : [...parts, part];
      overlay.request({ id: ceremonyId, type: 'ceremony', payload: { t: 'ceremony', parts: merged, continueLabel: payload.continueLabel } });
      return ceremonyId;
    }
    const id = nextId('ceremony');
    ceremonyId = id;
    overlay.request({ id, type: 'ceremony', payload: { t: 'ceremony', parts: [part], continueLabel: input.continueLabel ?? 'Continue' } });
    return id;
  }

  function closeCeremony() {
    const open = overlay.getSnapshot().active.find((g) => g.type === 'ceremony');
    if (open) {
      overlay.release(open.id);
      if (open.id === ceremonyId) ceremonyId = null;
    }
  }

  /** Log an in-place update to Activity (level inside a band, a Stamp Register entry, rank, streak). */
  function note(title: string, body?: string) {
    log({ kind: 'update', title, body, shown: false });
    emit();
  }

  function setLive(next: boolean) {
    if (live === next) return;
    live = next;
    syncQuiet();
    emit();
  }

  /** Hold overlays (an untimed card). Returns the release function; holds nest. */
  function hold() {
    holds += 1;
    syncQuiet();
    emit();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds = Math.max(0, holds - 1);
      syncQuiet();
      emit();
    };
  }

  function setToastsOff(next: boolean) {
    if (toastsOff === next) return;
    toastsOff = next;
    if (next) overlay.clear('toast');
    emit();
  }

  return {
    newVisit,
    toast,
    dismissToast,
    ceremony,
    closeCeremony,
    note,
    setLive,
    isLive: () => live,
    hold,
    setToastsOff,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => snapshot,
    destroy() {
      overlay.destroy();
      listeners.clear();
    },
  };
}

// ---- the app's budget and its hooks --------------------------------------------------------------

/** The one budget the app uses (module singleton: the shell, screens and the fx bridge share it). */
export const budget: HisaabBudget = createHisaabBudget();

/** The budget's state (toasts and ceremony on screen, live/held flags, Activity). */
export function useBudgetSnapshot(): BudgetSnapshot {
  return useSyncExternalStore(budget.subscribe, budget.getSnapshot, budget.getSnapshot);
}

/** What a screen calls. Stable functions; no re-render on its own. */
export function useBudget() {
  return API;
}
const API = Object.freeze({
  toast: budget.toast,
  dismissToast: budget.dismissToast,
  ceremony: budget.ceremony,
  closeCeremony: budget.closeCeremony,
  note: budget.note,
  hold: budget.hold,
  setLive: budget.setLive,
  isLive: budget.isLive,
});

/**
 * A live timed round: pass true from the countdown until `round.result` (and during the pass-and-play
 * hand-over). Nothing opens and no 3D mounts while it is on; it lifts on false or unmount.
 */
export function useQuietRound(active: boolean) {
  useEffect(() => {
    if (!active) return;
    budget.setLive(true);
    return () => budget.setLive(false);
  }, [active]);
}

/** Hold toasts and ceremonies while `active` (untimed route cards hold them for the finish screen). */
export function useHoldToasts(active: boolean) {
  useEffect(() => (active ? budget.hold() : undefined), [active]);
}

/**
 * A sheet or dialog that counts as a new visit (bible §9.1) while it is open; closing it returns to the
 * screen's visit. `key` defaults to a stable per-component id.
 */
export function useVisit(open: boolean, key?: string) {
  const auto = useId();
  useEffect(() => {
    if (!open) return;
    const before = budget.getSnapshot().visit;
    budget.newVisit(`${before}#${key ?? auto}`);
    return () => budget.newVisit(before);
  }, [open, key, auto]);
}

/** True while a live round is on (SceneHost and anything else that must stand down reads this). */
export function useLiveRound(): boolean {
  return useBudgetSnapshot().live;
}

/** Profile › Activity: in-place updates and toasts the budget kept off screen, newest first. */
export function useActivity(): readonly ActivityEntry[] {
  return useBudgetSnapshot().activity;
}
