'use client';
/**
 * The Locker — gems and cosmetics (design bible §4: soft currency, nothing auto-spent, no real
 * money anywhere). Four tabs, one card per cosmetic, and the honest status straight from
 * `cosmeticStatus`: equipped / owned / available / buyable / locked. A locked card is disabled and
 * says exactly what would unlock it. The physics gem vault is only mounted while the Locker is
 * open, only when the browser can draw it, and only when there is at least one gem to draw —
 * at zero it is the static fallback pile, not a 2.2 MB physics chunk around an empty bowl.
 */
import { useState } from 'react';
import { Check, ChevronDown, Gem, Lock, Sparkles, Vault } from 'lucide-react';
import { NumberCounter, useJuice } from '@/components/fx';
import { GemVaultFallback, LazyGemVault } from '@/components/three';
import { achievementById, canEquip, COSMETICS, cosmeticStatus, RANK_TIERS } from '@/lib/progression.mjs';
import { usePress, useWebGL } from './shared';

type Cosmetic = {
  id: string;
  kind: 'frame' | 'title' | 'banner' | 'accent';
  name: string;
  description: string;
  price: number | null;
  unlock: { level?: number; achievement?: string; rank?: string };
};
type Status = 'equipped' | 'owned' | 'available' | 'buyable' | 'locked';

const ALL = COSMETICS as ReadonlyArray<Cosmetic>;
const TABS: { id: Cosmetic['kind']; label: string }[] = [
  { id: 'frame', label: 'Frames' },
  { id: 'title', label: 'Titles' },
  { id: 'banner', label: 'Banners' },
  { id: 'accent', label: 'Accents' },
];
const rankLabel = (id: string) =>
  (RANK_TIERS as ReadonlyArray<{ id: string; label: string }>).find((t) => t.id === id)?.label ?? id;

/** The one line that explains a locked card. Never speculative — it quotes the unlock rule. */
function lockReason(c: Cosmetic, gems: number): string {
  if (c.price !== null) return `${(c.price - gems).toLocaleString()} more gems needed`;
  if (c.unlock.level) return `Unlocks at level ${c.unlock.level}`;
  if (c.unlock.achievement)
    return `Unlocks with the “${achievementById(c.unlock.achievement)?.name ?? c.unlock.achievement}” badge`;
  if (c.unlock.rank) return `Unlocks at ${rankLabel(c.unlock.rank)} in the arena`;
  return 'Not available yet';
}

/** Price / unlock rule shown on every card, whatever its status. */
function priceLine(c: Cosmetic, status: Status) {
  if (c.price !== null)
    return status === 'equipped' || status === 'owned' ? (
      <span className="fd-cos-price" data-tone="accent">
        <Gem aria-hidden="true" /> Owned
      </span>
    ) : (
      <span className="fd-cos-price" data-tone="gold">
        <Gem aria-hidden="true" /> {c.price.toLocaleString()} gems
      </span>
    );
  const rule = c.unlock.level
    ? `Level ${c.unlock.level}`
    : c.unlock.achievement
      ? `Badge: ${achievementById(c.unlock.achievement)?.name ?? c.unlock.achievement}`
      : c.unlock.rank
        ? `${rankLabel(c.unlock.rank)} tier`
        : 'Free';
  return (
    <span className="fd-cos-price" data-tone={status === 'locked' ? undefined : 'accent'}>
      <Sparkles aria-hidden="true" /> {rule}
    </span>
  );
}

export function Locker({ player }: { player: any }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Cosmetic['kind']>('frame');
  const juice = useJuice();
  const press = usePress();
  const webgl = useWebGL();
  const prog = player.progression;
  const gems: number = prog.wallet.gems;
  const items = ALL.filter((c) => c.kind === tab);
  const owned = prog.cosmetics.owned.length;

  const buy = (c: Cosmetic, el: Element) => {
    juice.burst(el, 'gem');
    player.buyCosmetic(c.id);
  };
  const equip = (c: Cosmetic, el: Element) => {
    juice.burst(el, 'gem');
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
          <Gem aria-hidden="true" />
          <NumberCounter value={gems} />
          <span className="sr-only">gems</span>
        </span>
        <ChevronDown className="fd-locker-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="fd-locker-body" id="fd-locker-body">
          <figure className="fd-locker-vault">
            {/* An empty vault is a static pile: never pay ~2.2 MB of physics to draw nothing. */}
            {webgl && gems > 0 ? (
              <LazyGemVault
                count={Math.min(gems, 120)}
                maxGems={120}
                height={240}
                accent="#ffc83d"
                label={`Vault holding ${Math.min(gems, 120)} of your ${gems} gems`}
                fallback={<GemVaultFallback count={Math.min(gems, 48)} height={240} accent="#ffc83d" />}
              />
            ) : (
              <GemVaultFallback count={Math.min(gems, 48)} height={240} accent="#ffc83d" />
            )}
            <figcaption>
              {gems > 0
                ? `${gems.toLocaleString()} gems in the vault${gems > 120 ? ' (120 shown)' : ''}.`
                : 'The vault is empty. Quests, level-ups and badges drop gems in.'}
            </figcaption>
          </figure>

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
              const buyable = status === 'buyable';
              const equippable = status === 'owned' || status === 'available';
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
                  {priceLine(c, status)}
                  <button
                    type="button"
                    className="fd-cos-action fd-btn"
                    data-kind={equipped ? 'equipped' : buyable ? 'buy' : equippable ? 'equip' : 'locked'}
                    disabled={equipped || blocked}
                    aria-describedby={locked ? `fd-cos-why-${c.id}` : undefined}
                    onPointerDown={blocked || equipped ? undefined : press}
                    onClick={(e) =>
                      buyable ? buy(c, e.currentTarget) : equippable ? equip(c, e.currentTarget) : undefined
                    }
                  >
                    {equipped ? (
                      <>
                        <Check aria-hidden="true" /> Equipped
                      </>
                    ) : buyable ? (
                      <>
                        <Gem aria-hidden="true" /> Buy for {c.price?.toLocaleString()}
                      </>
                    ) : equippable ? (
                      <>
                        <Sparkles aria-hidden="true" /> Equip
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden="true" /> Locked
                      </>
                    )}
                  </button>
                  {locked && (
                    <p className="fd-cos-reason" id={`fd-cos-why-${c.id}`}>
                      <Lock aria-hidden="true" />
                      {lockReason(c, gems)}
                    </p>
                  )}
                  {!locked && !equipped && !canEquip(prog, c) && (
                    <p className="fd-cos-reason">
                      <Gem aria-hidden="true" />
                      Buying it adds it to your locker — you choose when to wear it.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <p className="fd-disclaimer">
            Gems are earned by playing: quests, level-ups and badges. They buy cosmetics only, never answers,
            time or an advantage in a duel.
          </p>
        </div>
      )}
    </section>
  );
}
