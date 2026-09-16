'use client';
/**
 * The Locker — cosmetics (design bible §4: nothing auto-spent, no real money, no second currency).
 * Four tabs, one card per cosmetic, and the honest status straight from `cosmeticStatus`:
 * equipped / owned / unlocked / locked. Every card names the play that unlocks it — a level, a
 * badge, an arena tier or a conviction badge — and a locked card is disabled and says exactly what
 * would unlock it. Nothing here is for sale: an item is owned the moment its rule is met.
 */
import { useState } from 'react';
import { Check, ChevronDown, Lock, Sparkles, Vault } from 'lucide-react';
import { useJuice } from '@/components/fx';
import {
  achievementById,
  COSMETICS,
  cosmeticStatus,
  CONVICTION_TIERS,
  DEFAULT_COSMETICS,
  RANK_TIERS,
} from '@/lib/progression.mjs';
import { usePress } from './shared';

type Cosmetic = {
  id: string;
  kind: 'frame' | 'title' | 'banner' | 'accent';
  name: string;
  description: string;
  price: null;
  unlock: { level?: number; achievement?: string; rank?: string; conviction?: string };
};
type Status = 'equipped' | 'owned' | 'unlocked' | 'locked';

const ALL = COSMETICS as ReadonlyArray<Cosmetic>;
const DEFAULTS = new Set(Object.values(DEFAULT_COSMETICS as Record<string, string>));
const TABS: { id: Cosmetic['kind']; label: string }[] = [
  { id: 'frame', label: 'Frames' },
  { id: 'title', label: 'Titles' },
  { id: 'banner', label: 'Banners' },
  { id: 'accent', label: 'Accents' },
];
const tierLabel = (tiers: unknown, id: string) =>
  (tiers as ReadonlyArray<{ id: string; label: string }>).find((t) => t.id === id)?.label ?? id;
const badgeName = (id: string) => (achievementById(id) as { name: string } | undefined)?.name ?? id;

/** The one line that explains a locked card. Never speculative — it quotes the unlock rule. */
function lockReason(c: Cosmetic): string {
  if (c.unlock.level) return `Reach level ${c.unlock.level}`;
  if (c.unlock.achievement) return `Earn the ${badgeName(c.unlock.achievement)} badge`;
  if (c.unlock.rank) return `Reach ${tierLabel(RANK_TIERS, c.unlock.rank)} in the arena`;
  if (c.unlock.conviction)
    return `Reach the ${tierLabel(CONVICTION_TIERS, c.unlock.conviction)} conviction badge`;
  return 'Not available yet';
}

/** Unlock rule shown on every card, whatever its status. */
function ruleLine(c: Cosmetic, status: Status) {
  const rule = c.unlock.level
    ? `Level ${c.unlock.level}`
    : c.unlock.achievement
      ? `Badge: ${badgeName(c.unlock.achievement)}`
      : c.unlock.rank
        ? `${tierLabel(RANK_TIERS, c.unlock.rank)} tier`
        : c.unlock.conviction
          ? `${tierLabel(CONVICTION_TIERS, c.unlock.conviction)} badge`
          : 'Starter';
  const held = status !== 'locked';
  return (
    <span className="fd-cos-price" data-tone={held ? 'accent' : undefined}>
      <Sparkles aria-hidden="true" /> {held && !DEFAULTS.has(c.id) ? `Unlocked · ${rule}` : rule}
    </span>
  );
}

export function Locker({ player }: { player: any }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Cosmetic['kind']>('frame');
  const juice = useJuice();
  const press = usePress();
  const prog = player.progression;
  const items = ALL.filter((c) => c.kind === tab);
  const owned: number = prog.cosmetics.owned.length;
  const earnable = ALL.filter((c) => !DEFAULTS.has(c.id)).length;

  const equip = (c: Cosmetic, el: Element) => {
    juice.burst(el, 'stamp');
    player.equipCosmetic(c.id);
  };

  return (
    <section className="fd-locker" aria-labelledby="fd-locker-h">
      <button
        type="button"
        className="fd-locker-toggle fd-btn"
        aria-expanded={open}
        aria-controls="fd-locker-body"
        onPointerDown={press}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="fd-locker-icon" aria-hidden="true">
          <Vault />
        </span>
        <div>
          <strong id="fd-locker-h">The Locker</strong>
          <small>{owned} unlocked · frames, titles, banners, accents</small>
        </div>
        <span className="fd-wallet">
          <Sparkles aria-hidden="true" />
          {owned}/{earnable}
          <span className="sr-only">cosmetics unlocked</span>
        </span>
        <ChevronDown className="fd-locker-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="fd-locker-body" id="fd-locker-body">
          <div className="fd-chips" role="tablist" aria-label="Cosmetic kind">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`fd-locker-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="fd-locker-grid"
                className="fd-chip fd-btn"
                onPointerDown={press}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <b>{ALL.filter((c) => c.kind === t.id).length}</b>
              </button>
            ))}
          </div>

          <div
            className="fd-cosmetics"
            id="fd-locker-grid"
            role="tabpanel"
            aria-labelledby={`fd-locker-tab-${tab}`}
          >
            {items.map((c) => {
              const status = cosmeticStatus(prog, c.id) as Status;
              const equipped = status === 'equipped';
              const locked = status === 'locked';
              const blocked = locked || !player.loaded;
              return (
                <article className="fd-cos" key={c.id} data-status={status}>
                  <div className="fd-cos-head">
                    <div style={{ minWidth: 0 }}>
                      <strong>{c.name}</strong>
                      <small>{c.description}</small>
                    </div>
                    <span className="fd-cos-swatch" data-kind={c.kind} data-id={c.id} aria-hidden="true">
                      {c.kind === 'title' ? 'Aa' : null}
                    </span>
                  </div>
                  {ruleLine(c, status)}
                  <button
                    type="button"
                    className="fd-cos-action fd-btn"
                    data-kind={equipped ? 'equipped' : locked ? 'locked' : 'equip'}
                    disabled={equipped || blocked}
                    aria-describedby={locked ? `fd-cos-why-${c.id}` : undefined}
                    onPointerDown={blocked || equipped ? undefined : press}
                    onClick={(e) => (blocked || equipped ? undefined : equip(c, e.currentTarget))}
                  >
                    {equipped ? (
                      <>
                        <Check aria-hidden="true" /> Equipped
                      </>
                    ) : locked ? (
                      <>
                        <Lock aria-hidden="true" /> Locked
                      </>
                    ) : (
                      <>
                        <Sparkles aria-hidden="true" /> Equip
                      </>
                    )}
                  </button>
                  {locked && (
                    <p className="fd-cos-reason" id={`fd-cos-why-${c.id}`}>
                      <Lock aria-hidden="true" />
                      {lockReason(c)}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <p className="fd-disclaimer">
            Cosmetics are earned by playing: levels, badges, arena tiers and conviction badges. They dress
            your card and change nothing in a duel.
          </p>
        </div>
      )}
    </section>
  );
}
