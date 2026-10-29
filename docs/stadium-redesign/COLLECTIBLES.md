# Stadium club: identity, builds and earned points

Implemented for the mobile Stadium redesign, 29 October 2026. This is a device-local collection, not a human ranking service. The user explicitly requested buyable show-off elements, titles, cards and time-based badges.

## Round 1 findings and decisions

The existing progression module already has deduplicated completed-match and correct-answer counters. Existing cosmetics are achievement unlocks; the existing game coin economy has a different settlement boundary. A cosmetics shop must not spend or alter those coins. The new Club points are therefore explicit free, nontransferable play credits for cosmetics only. No purchase with real money, cash-out, wagering, exchange, advantage or artificial online number is introduced.

The primary collection surface is `StadiumLocker` (`app/screens/stadium-locker.tsx`). The root mounts it with `{ player, name? }`. Existing progression and legacy unlock cosmetics remain intact. One card shows the equipped title, finish, buildings and actual local counters. Three category buttons keep the mobile store short: Build, Titles and Cards. The card can be copied as text by the visitor for sharing. It identifies itself as a device-local card; no automatic opponent transmission or server validation is claimed.

## Earn, buy and equip

- Every completed match contributes **30 Club points**.
- Every correct timed duel answer contributes **3 Club points**. Correct answers are capped at the recorded total rounds.
- The club reconciles the cumulative total from `profile.progression.counters`, so opening the collection repeatedly or replaying a room snapshot does not create another reward. Existing recorded play is credited too.
- The previous credited total is a high-water mark within a profile epoch. A stale profile read cannot remove already earned points. A reset epoch starts a new collection. Local edits are possible, as they are for the existing local profile; this is not a trusted economy.
- Spending is computed from the unique owned catalogue items, not a mutable subtraction counter. A purchase owns and equips the item once. Re-equipping is free; returning to a starter does not refund purchases.
- Buying disabled items cannot overdraw. A synchronous UI action latch plus an IndexedDB read/write transaction handles rapid taps and competing tabs.

| Slot | Starter | Upgrade | Club points |
| --- | --- | --- | ---: |
| Title | Gully captain | Matchday menace / Pavilion pundit | 45 / 120 |
| Card | Turf edition | Sunset foil / Floodlight chrome | 90 / 180 |
| Stand | Gully terrace | The pavilion | 90 |
| Lighting | Day session | Floodlight towers | 120 |
| Scoreboard | Scorekeeper stand | The big screen | 150 |

The composed miniature stadium visibly adds the equipped pavilion, towers and screen. It is lightweight, code-native SVG geometry with a fixed viewbox and no motion dependency. Player statistics and controls remain HTML. Generated stadium art belongs to the broader product surface, not this exact miniature diagram.

## Time-limited badges

**Fresh victory** is active until 24 hours after the latest recorded win. **Hat-trick heat** requires the latest three distinct recorded matches to be wins, each within 24 hours; it expires when the oldest of those three reaches 24 hours. Practice wins count, and the card explicitly says the record is local. The user can select a badge or hide it. A saved selection never extends expiry. Losing breaks the three-match condition immediately. Duplicate IDs and future-dated entries are ignored.

Badges show time remaining in hours/minutes. The mounted display refreshes every 30 seconds and on focus. The pure selector uses an exact `expiresAt > now` boundary; visually, a badge can remain for up to one refresh interval before disappearing. Badge status gives no points or game advantage, and leaving the screen cannot pause the timer. This is not a streak punishment or a lost purchased item.

## Persistence and failure

`lib/stadium-collection.mjs` owns a versioned IndexedDB database `fact-duel-stadium-club-v1` (derived from the edition namespace through `STORAGE.stadiumClubDb`; the refresh channel likewise uses `STORAGE.stadiumClubChannel`), object store `club`, keyed by profile epoch. A transaction reads, sanitizes, reconciles and mutates once. BroadcastChannel and focus reads refresh another open locker. A blocked/unavailable database times out after four seconds, then the feature uses a page-session memory store and shows an explicit notice. The memory record survives component remounts during that page session. It is not exported by the existing player profile export, synced to a server or claimed portable across devices.

Readers reject unknown catalogue entries, duplicate owned IDs, wrong-slot equipment and saved ownership beyond the credited balance. The starter collection is always present. The component never prevents a match from starting; the store is a secondary destination.

## Verification

`tests/stadium-collection.test.mjs` tests actual credit reconciliation, malformed saves, repeat purchases, wrong-slot/locked equipment, insufficient balance, simultaneous same-item and different-item transactions, reset epochs, session fallback, and timed badge boundary/duplicates/consecutive-win conditions. Mobile runtime inspection is performed by the independent verifier on the integrated root screens.

Acceptance checks: visible local scope, one chosen item per slot, balance never negative, repeat snapshot/reload grants no duplicate points, purchases remain on refresh, 44 px minimum controls, 320 px content reflow, no artificial online number, timed badge disappears after expiry, and storage failure does not disable gameplay.

## Round 2 review and corrections

The integrated mobile pass found a real day-theme contrast defect: the component referenced old `--fd-*` tokens, so light surfaces received dark-theme fallback text. It now uses the application's `--text`, `--muted` and `--line` tokens. The screenshot server had hot reload disabled, so confirmation uses a restarted candidate in the final pass.

The full suite also caught a hardcoded BroadcastChannel name. Database and channel names now derive from the central edition namespace; the existing isolation/literal checks and a new collection-specific namespace test pass without exclusions.

The independent verifier completed two actual one-question wins, observed 66 earned points, bought a 45-point title with rapid taps, observed 21 remaining, reloaded without a duplicate reward, and advanced the clock to verify badge expiry. Empty-state affordability and narrow reflow also passed. Ten collection tests plus the four existing namespace tests passed. The new component, module and tests pass targeted ESLint; TypeScript passed on the integrated candidate after the component edits.

Final visual confirmation: the restarted pass-2 day and night 390 px locker captures were inspected. The corrected headings, balance, category labels, item names and controls are readable in both themes; the verifier's measured heading contrast passed 4.5:1. No further visual correction was needed. Evidence: `verification/pass2/club-empty-390.png` and `verification/pass2/club-night-390.png`.
