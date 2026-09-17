/**
 * components/fx/overlay-budget.ts — the pop-up budget.
 *
 * One scheduler decides when an overlay is allowed on screen, so the player is never buried by a
 * reward burst. It is a pure module: no React, no DOM, no `Date.now()` of its own (the clock and
 * the timer are injected, which is how the tests drive it).
 *
 * The rules, all of them:
 *  - CAPACITY: at most `OVERLAY_CAPACITY` (2) weight units are on screen. A toast weighs 1, a
 *    ceremony weighs 2 — so a ceremony fills the budget and nothing else can open beside it.
 *  - NEVER AT ONCE: two overlays never arrive in the same instant. A grant waits `OVERLAY_GAP_MS`
 *    (1200 ms) after the previous grant *or* the previous release, whichever is later. The first
 *    overlay after an idle stretch opens straight away.
 *  - FIFO: the queue is served strictly in the order things were asked for, including when the
 *    head is a ceremony that does not fit yet (it holds its place rather than letting a lighter
 *    item jump it — a stable order beats a clever one).
 *  - MERGE: toasts of the same `mergeKey` asked for within `OVERLAY_MERGE_WINDOW_MS` (800 ms) of
 *    the group's first item, and still waiting, collapse into ONE grant carrying every payload.
 *    The scheduler only groups them; the words ("+3 quests · 140 XP") are written by whoever owns
 *    the copy — see `app/screens/use-progression-feedback.tsx`.
 *  - QUIET: `setQuiet(true)` stops new grants dead (this is what "nothing opens while a question
 *    is live" hangs off). Already-open overlays stay; the queue resumes when quiet lifts.
 *  - NOTHING IS DROPPED: the queue has no ceiling and no eviction. Every request is eventually
 *    granted or merged into one that is. Only `release`/`clear` remove anything.
 *
 * Usage:
 *   const budget = createOverlayBudget<Payload>();
 *   const id = budget.request({ type: 'toast', mergeKey: 'quest', payload });
 *   budget.subscribe(render);            // fires whenever the snapshot changes
 *   budget.getSnapshot().active          // what may be on screen right now
 *   budget.release(id);                  // dismissed → frees the slot, starts the 1200 ms gap
 */

/** A toast weighs 1; a ceremony fills the whole budget. */
export type OverlayType = 'toast' | 'ceremony';

/** Weight units allowed on screen at once. */
export const OVERLAY_CAPACITY = 2;

/** Cost of each overlay type against the capacity. */
export const OVERLAY_WEIGHT: Record<OverlayType, number> = { toast: 1, ceremony: 2 };

/** Quiet time between one overlay settling and the next one opening. */
export const OVERLAY_GAP_MS = 1200;

/** Same-kind toasts asked for inside this window of the group's first item merge into it. */
export const OVERLAY_MERGE_WINDOW_MS = 800;

/** Opaque timer handle; whatever the injected clock hands back. */
export type OverlayTimer = unknown;

/** The two bits of ambient state the scheduler needs, injectable so tests can fake both. */
export interface OverlayClock {
  now: () => number;
  setTimer: (fn: () => void, ms: number) => OverlayTimer;
  clearTimer: (timer: OverlayTimer) => void;
}

/** `Date.now()` plus the host timers. */
export const systemOverlayClock: OverlayClock = {
  now: () => Date.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export interface OverlayRequest<P> {
  /** Stable id. Re-requesting a live id replaces that payload instead of queueing a second one. */
  id?: string;
  type: OverlayType;
  /** Toasts sharing this key inside one burst become a single overlay. Ceremonies never merge. */
  mergeKey?: string;
  payload: P;
}

/** One slot's worth of overlay: a single item, or the burst that merged into it. */
export interface OverlayGrant<P> {
  /** The group's handle — the id of its first item. `release(id)` takes this or any member id. */
  id: string;
  type: OverlayType;
  mergeKey?: string;
  /** Every member id, in the order they were asked for. */
  ids: readonly string[];
  /** Every member payload, same order. Length 1 unless the group merged. */
  items: readonly P[];
  /** Monotonic request counter — the stable FIFO order. */
  seq: number;
  queuedAt: number;
  /** When it went on screen; `-1` while it is still waiting. */
  grantedAt: number;
}

export interface OverlaySnapshot<P> {
  /** Bumped on every change; a fresh object is built only when something actually moved. */
  version: number;
  quiet: boolean;
  /** Weight units in use. */
  used: number;
  /** What may be on screen, oldest grant first. */
  active: readonly OverlayGrant<P>[];
  /** What is still waiting, in FIFO order. */
  queued: readonly OverlayGrant<P>[];
}

export interface OverlayBudgetOptions {
  capacity?: number;
  gapMs?: number;
  mergeWindowMs?: number;
  weight?: Partial<Record<OverlayType, number>>;
  clock?: OverlayClock;
  quiet?: boolean;
}

export interface OverlayBudget<P> {
  /** Ask for a slot. Returns the id of the grant this payload will appear under. */
  request: (req: OverlayRequest<P>) => string;
  /** Dismissed or closed: frees the slot and starts the gap. Also cancels a still-queued item. */
  release: (id: string) => boolean;
  /** Drop everything (of one type, or all). Removing something live starts the gap. */
  clear: (type?: OverlayType) => void;
  /** While quiet, nothing new opens. */
  setQuiet: (quiet: boolean) => void;
  isQuiet: () => boolean;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => OverlaySnapshot<P>;
  /** Stop the pending timer and forget the listeners (for unmount). */
  destroy: () => void;
}

interface Entry<P> {
  id: string;
  type: OverlayType;
  mergeKey?: string;
  ids: string[];
  items: P[];
  seq: number;
  queuedAt: number;
  grantedAt: number;
}

export function createOverlayBudget<P>(options: OverlayBudgetOptions = {}): OverlayBudget<P> {
  const capacity = options.capacity ?? OVERLAY_CAPACITY;
  const gapMs = options.gapMs ?? OVERLAY_GAP_MS;
  const mergeWindowMs = options.mergeWindowMs ?? OVERLAY_MERGE_WINDOW_MS;
  const weight: Record<OverlayType, number> = { ...OVERLAY_WEIGHT, ...options.weight };
  const clock = options.clock ?? systemOverlayClock;

  const queued: Entry<P>[] = [];
  const active: Entry<P>[] = [];
  const listeners = new Set<() => void>();

  let quiet = options.quiet ?? false;
  let seq = 0;
  let autoId = 0;
  let version = 0;
  let timer: OverlayTimer = null;
  let destroyed = false;
  // Negative infinity means "no overlay has opened or closed yet", so the first one is immediate.
  let lastGrantAt = Number.NEGATIVE_INFINITY;
  let lastReleaseAt = Number.NEGATIVE_INFINITY;

  const grantOf = (e: Entry<P>): OverlayGrant<P> => ({
    id: e.id,
    type: e.type,
    mergeKey: e.mergeKey,
    ids: e.ids.slice(),
    items: e.items.slice(),
    seq: e.seq,
    queuedAt: e.queuedAt,
    grantedAt: e.grantedAt,
  });

  const used = (): number => active.reduce((n, e) => n + (weight[e.type] ?? 1), 0);

  const build = (): OverlaySnapshot<P> => ({
    version,
    quiet,
    used: used(),
    active: active.map(grantOf),
    queued: queued.map(grantOf),
  });

  let snapshot: OverlaySnapshot<P> = build();

  const changed = (): void => {
    version += 1;
    snapshot = build();
    for (const fn of Array.from(listeners)) fn();
  };

  const disarm = (): void => {
    if (timer === null) return;
    clock.clearTimer(timer);
    timer = null;
  };

  const arm = (ms: number): void => {
    disarm();
    if (destroyed) return;
    timer = clock.setTimer(pump, Math.max(0, ms));
  };

  /** Hand out every slot that is due right now; re-arm for the next one that is not. */
  function pump(): void {
    timer = null;
    if (destroyed || quiet) return;
    let granted = false;
    for (;;) {
      const head = queued[0];
      if (!head) break;
      // Strict FIFO: a ceremony that does not fit yet holds the line rather than being overtaken.
      if (used() + (weight[head.type] ?? 1) > capacity) break;
      const now = clock.now();
      const earliest = Math.max(lastGrantAt, lastReleaseAt) + gapMs;
      if (now < earliest) {
        arm(earliest - now);
        break;
      }
      queued.shift();
      head.grantedAt = now;
      active.push(head);
      lastGrantAt = now;
      granted = true;
    }
    if (granted) changed();
  }

  const schedule = (): void => {
    if (destroyed || quiet) return;
    arm(0);
  };

  const replaceMember = (list: Entry<P>[], id: string, payload: P): Entry<P> | null => {
    for (const e of list) {
      const i = e.ids.indexOf(id);
      if (i === -1) continue;
      e.items[i] = payload;
      return e;
    }
    return null;
  };

  const request = (req: OverlayRequest<P>): string => {
    if (destroyed) return req.id ?? '';
    const now = clock.now();
    const id = req.id ?? `overlay-${(autoId += 1)}`;

    // A repeat of a live id updates that overlay in place — it never takes a second slot.
    const existing = replaceMember(active, id, req.payload) ?? replaceMember(queued, id, req.payload);
    if (existing) {
      changed();
      return existing.id;
    }

    // Merge into the newest waiting group with the same key, if the burst window is still open.
    if (req.type === 'toast' && req.mergeKey) {
      for (let i = queued.length - 1; i >= 0; i -= 1) {
        const e = queued[i];
        if (e.type !== 'toast' || e.mergeKey !== req.mergeKey) continue;
        // The queue is append-only, so anything further back is older still: stop looking.
        if (now - e.queuedAt > mergeWindowMs) break;
        e.ids.push(id);
        e.items.push(req.payload);
        changed();
        schedule();
        return e.id;
      }
    }

    seq += 1;
    queued.push({
      id,
      type: req.type,
      mergeKey: req.mergeKey,
      ids: [id],
      items: [req.payload],
      seq,
      queuedAt: now,
      grantedAt: -1,
    });
    changed();
    schedule();
    return id;
  };

  /** Drop a still-queued item (or one member of a queued group) without touching the gap. */
  const cancel = (id: string): boolean => {
    for (let i = 0; i < queued.length; i += 1) {
      const e = queued[i];
      const j = e.ids.indexOf(id);
      if (j !== -1) {
        e.ids.splice(j, 1);
        e.items.splice(j, 1);
        if (e.ids.length === 0) queued.splice(i, 1);
        changed();
        return true;
      }
      if (e.id === id) {
        queued.splice(i, 1);
        changed();
        return true;
      }
    }
    return false;
  };

  const release = (id: string): boolean => {
    if (destroyed) return false;
    const i = active.findIndex((e) => e.id === id || e.ids.includes(id));
    if (i === -1) return cancel(id);
    active.splice(i, 1);
    lastReleaseAt = clock.now();
    changed();
    schedule();
    return true;
  };

  const clear = (type?: OverlayType): void => {
    const keep = (e: Entry<P>) => (type ? e.type !== type : false);
    const liveBefore = active.length;
    const queuedKept = queued.filter(keep);
    const activeKept = active.filter(keep);
    if (queuedKept.length === queued.length && activeKept.length === active.length) return;
    queued.length = 0;
    queued.push(...queuedKept);
    active.length = 0;
    active.push(...activeKept);
    if (activeKept.length < liveBefore) lastReleaseAt = clock.now();
    changed();
    schedule();
  };

  const setQuiet = (next: boolean): void => {
    if (quiet === next) return;
    quiet = next;
    if (quiet) disarm();
    changed();
    if (!quiet) schedule();
  };

  return {
    request,
    release,
    clear,
    setQuiet,
    isQuiet: () => quiet,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    destroy: () => {
      disarm();
      destroyed = true;
      listeners.clear();
    },
  };
}
