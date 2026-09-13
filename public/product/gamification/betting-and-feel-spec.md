# FACT//DUEL — Betting, Knowledge Record, Vault, Brain Hero, Sound & Celebrations

**One implementable specification, revision 2.** Six specialist reports were reconciled into revision 1;
four adversarial reviewers then attacked revision 1 and found 11 distinct blockers, 26 serious defects and 8 minor ones. Every
one of those is fixed here, in place, with the numbers re-derived and re-measured against the repo.
Section 11 lists each finding and its disposition.

**Status:** specification, not yet built. Verified against the repo at **177/177** tests passing
(`node --test tests/*.test.mjs`, run on this working tree at `cc805e5`). The brief quoted 175; commit
`cc805e5` (the 5/7/10 s clock and self-advancing rounds) added two, and none of them touches anything in
this spec. Every line reference below was re-checked against that commit.

**Test-count honesty, up front.** Revision 1 claimed "175 tests still pass, nothing changes". That was
false: the economy changes this spec requires are *encoded* in four assertions. Exactly four assertion
lines change, all in `tests/progression.test.mjs`, all of them inventory or economy constants rather
than behaviour contracts. They are enumerated in §10.0 and nowhere else in the suite moves. The count
stays 177 tests; four `assert` arguments inside three of them are updated.

---

## 0. Adjudications and refusals up front

### 0.1 Where the specialists disagreed — the call

| # | Disagreement | Call | Why (one sentence) |
|---|---|---|---|
| D1 | Economy wanted a 12-chip run bankroll across 4 tiers; Psychology wanted 3 re-priced tiers; Honesty wanted the existing 2 tiers untouched. | **Three tiers, no bankroll: Steady +2/0, Bold +3/−1, Called +4/−3.** | A cross-card budget destroys incentive-compatibility — with a budget the best tier on card 3 depends on cards 4–6, so the rating stops being a proper scoring rule, which was the entire honesty justification for showing it as a knowledge number. |
| D2 | Psychology wanted a "Hunch" tier below Steady that still scores (+1/0). | **Refused — there is no tier below Steady.** | Steady already has zero run-point downside, so any tier below it is strictly dominated at every probability; the dignity point is honoured in copy instead. |
| D3 | Economy's top tier was +5/−5 (max run 30); Psychology's was +4/−3 (max 24). | **+4/−3, max run 24, min −18.** | Both put the Bold→Called threshold at exactly 2/3; ±3 keeps the swing survivable on a 6-card route. |
| D4 | Economy: gems as a one-off tier bonus + a new gem sink. Honesty: gems nowhere near the bet. | **Both: gems are never staked; a **cumulative** badge-tier bonus (160 lifetime, genuinely reachable) and a 640-gem catalogue addition ship.** | A one-off award for first reaching a tier is achievement-shaped, not wager-shaped, and it fixes the measured gem over-supply. |
| D5 | Economy/Learning wanted the badge from a formula; Psychology/Honesty wanted a raw fraction. | **Both, in one card: the raw fractions are the headline, the rating drives the badge tier, and the number never appears without its scope.** | The fraction is checkable by the player and the rating is what a badge needs to be monotone. |
| D6 | 3D wanted the brain heat driven by recent Bold share **and the current stake**; Honesty forbids any stake input. | **Heat is driven only by calls that have already *landed*, never by a pending stake, a selected tier, or a call that missed.** | Coupling arousal to an open position is the slot-machine mechanic; coupling it to a *missed* high call is worse, because it rewards losing big. |
| D7 | 3D wanted a pulse up to 2.2 Hz; Honesty capped at 1.5 Hz. | **1.5 Hz hard cap.** | The conservative number is defensible under WCAG 2.3.1 with no argument about visual-field area, and the travelling wave carries the perceived speed anyway. |
| D8 | 3D wanted a new `brain-awake` achievement (breaks `ACHIEVEMENTS.length === 30`). | **No new achievement — the unlock is derived from existing counters and the one-shot ceremony is gated by `localStorage`.** | The ceremony is a per-viewer presentation event, not an earned award, so it does not belong in the exactly-once profile ledger. |
| D9 | Sound wanted sampled CC0 files as a fallback path; Honesty wanted synthesis only. | **Synthesis only. Zero audio files.** | Files buy a better transient and cost a Safari format twin, a static-build base-path code path, first-gesture decode latency and a licence surface — and they do not fix the actual defect, which is bit-identical repetition. |
| D10 | Learning wanted `journal.rounds` cut 200 → 60. | **Stays 200.** | `rounds` is the lookup table for `open`/`recall`/`save`/`report` and the `applyPractice` dedupe; shrinking it is a separate refactor with its own risk. |
| D11 | Economy wanted `runResult()` to return chip/tier tallies. | **`runResult()` keeps exactly `{ score, correct, bold }`.** | Two tests use `assert.deepEqual` on that object, so tallies go in a new `runTally()` export. |
| D12 | *(new in rev 2)* Economy wanted tiered per-card XP (`bold 18`, `called 24`) to make high tiers feel rewarding. | **Per-card XP is tier-neutral: `expeditionCorrect 12` / `expeditionWrong 3`, at every tier.** | Proved in §1.6.4: with `expeditionWrong` held constant, **no** tiered XP table can preserve the 0.5 / 0.667 crossovers without paying *negative* XP for a confident miss, so tiered XP and the proper-scoring-rule claim are mutually exclusive — and the claim is load-bearing for the whole badge. |
| D13 | *(new in rev 2)* Should the cosmetics catalogue grow, given `COSMETICS.length === 23` is asserted? | **Yes — the catalogue grows to 29 and `tests/progression.test.mjs:820-821` is updated to 29.** | A catalogue-inventory constant is updated when the catalogue intentionally grows; that is different from `ACHIEVEMENTS.length`, which stays 30 because **no achievement is added anywhere in this spec**. |

### 0.2 What cannot be built honestly as literally asked

Three of the six requests, taken literally, cannot ship. Each gets the nearest honest thing.

**(1) "community batch [badge], it updates on your profile."**
There is no community. Zero users. `lib/cohort-client.ts:19` sends exactly `{ day, sessions, ms, rounds, matches }` — **no correctness, no topic, no score** — and `lib/server/duel-service.mjs` suppresses every bucket under 5 devices. A community knowledge badge is not merely unfair today; it is **not computable from any data this product collects**, now or after a cohort exists.
**Nearest honest thing:** a **Conviction badge**, minted on this device from this device's own calls, labelled *"on this device · not a comparison against other players"*, sitting beside the existing Level / Rank / Streak cards. It updates on the profile after every expedition card, which is the part of the request that was real.

**(2) "the expeditions are all game bet modes, nothing is learning mode here."**
The *framing* can be fully competitive and this spec makes it so. The *claims* cannot change: `README.md:16` and `app/screens/expeditions/finish.tsx:162` promise no skill ranking, `README.md:87-88` says the difficulty levels are editorial, and the bank is 54 questions — 4 to 6 per topic. Expedition answers must also keep flowing into the Vault, because request (2) depends on exactly that.
**Nearest honest thing:** expeditions are presented as the betting mode — call it, risk points, move your badge — and the *learning* is relocated to the Vault, where it belongs, **and where it now pays XP and quest progress for the first time** (§3.2.5, §3.7). Nothing in the expedition UI calls itself a learning mode any more. Nothing in it claims a mastery measure either.

**(3) "pulsates faster as you bet more and more."**
Rate keyed to the stake currently selected, or to the size of an open position, is stake-conditioned arousal escalation — the slot-machine mechanic wearing a brain. Revision 1's fix (rate keyed to the *share of recent cards called above Steady*) was no better: a player who called Called twenty times and missed twenty times got a brain **73% faster** than a player who answered twenty Steady cards correctly. That is arousal keyed to betting big and losing.
**Nearest honest thing:** the rate is keyed to **calls that have already landed** — Bold or Called *and correct*, over your last 20 resolved expedition answers. It still rises inside a hot run — every Called card that *lands* pushes heat up within seconds — so it reads as "the more I call and land, the faster it beats"; a missed call never moves it. Cap 1.5 Hz. The visible text twin says exactly what it counts.

### 0.3 The five structural rules that make everything else safe

These are stated once here and referenced throughout. They exist because four reviewers independently found the same class of hole.

- **R1 — First-encounter ledger.** A fact's **first** expedition answer is the only one that moves the Conviction tally or pays full per-card XP. `progression.conviction.counted` is the ledger. Every replay, every fold-and-restart, every route re-run contributes nothing new to the badge and pays `XP.expeditionRepeat` (4) per card. This single rule closes the replay farm, the fold farm and the "is the badge a knowledge claim" question at once.
- **R2 — XP never prefers a tier.** Per-card XP is identical at all three tiers. The tier moves run score and nothing else, and the run-score menu is a proper scoring rule.
- **R3 — Correctness orders the record.** `record.best` and the `readExpeditions` baseline order by `correct` first and `score` as the tiebreak, so a 5/6 run can never outrank a 6/6 one.
- **R4 — The writer enforces every cap the sanitiser enforces.** Any cap that `readJournal` applies, `applyPractice` / `recordRoom` / the `review` reducer apply identically at write time, or the profile identity contract breaks.
- **R5 — Nothing stakes a currency, and nothing minted by losing.** Unchanged from revision 1 and from the shipped product.

---

## 1. Expedition betting

### 1.1 The mechanic

An expedition is nine fixed routes of six questions in three chapters, untimed. Before each answer the player picks **how hard they are calling it**. That choice is the bet, it resolves on that card, and it is the only thing at risk.

**There is no currency in the bet.** Not gems, not room coins, not a new balance, not a run bankroll. The stake is run score, and run score is a number on this device. Nothing is spent, nothing can be bought, nothing can be topped up, nothing can be lost that the player brought in.

Three reasons, all from the code:

1. `nat()` at `lib/progression.mjs:544` and the wallet read at `:654` floor gems at 0 on every load — a negative gem balance is **unrepresentable**, so gems cannot express escrow or debt.
2. `readLogEntry` at `lib/progression.mjs:565-581` rejects any log entry with `xp < 0` — XP can never go down. The run score is the only existing quantity that legitimately moves down.
3. Room coins are per-room by design (`lib/server/room-engine.mjs:79,138-141,173-177`); persisting them means inventing the global wallet `README.md:60` says does not exist.

A gem stake was modelled and rejected on its own arithmetic: at a 45% hit rate with a 100-gem bankroll and 25-gem bets, ruin is 100%. It taxes ignorance and subsidises prior knowledge, which is upside down in a product whose second request is *"every question played can be kept in the vault to learn."*

### 1.2 The stake table

`CONFIDENCE` at `lib/expeditions.mjs:110-113` gains one tier. **Steady and Bold keep byte-identical payouts.**

```js
export const CONFIDENCE = Object.freeze({
  steady: { name: 'Steady', correct: 2, wrong: 0,  order: 0 },
  bold:   { name: 'Bold',   correct: 3, wrong: -1, order: 1 },
  called: { name: 'Called', correct: 4, wrong: -3, order: 2 },
});
export const CONFIDENCE_ORDER = Object.freeze(['steady', 'bold', 'called']);
```

| Tier | Correct | Wrong | Expected **run points** at hit-rate *p* | Best when |
|---|---|---|---|---|
| **Steady** | **+2** | **0** | `2p` | `p < 50%` |
| **Bold** | **+3** | **−1** | `4p − 1` | `50% ≤ p < 66.7%` |
| **Called** | **+4** | **−3** | `7p − 3` | `p ≥ 66.7%` |

**There is no tier below Steady, deliberately.** Steady loses no *run points* when wrong, so any lower tier would be strictly dominated at every probability. Steady *is* the "I'd be guessing" move.

**"Nothing lost" is not said anywhere.** A Steady miss costs no run points but it still lands in the Conviction denominator (§2.2), so it *does* move the rating down. Revision 1 printed "nothing lost if you are not" on the same screen as a badge that the card demonstrably moves. The corrected copy is in §2.4 and says the true thing: *Steady never costs you run points; every card, at every tier, counts in your Conviction average.*

**Why these numbers.** The menu is a proper scoring rule: you maximise expected run score by calling your true confidence. The crossovers are exact —

- Steady / Bold indifference at **p = 0.500** — the invariant already asserted at `tests/expeditions.test.mjs:85`; it stays true.
- Bold / Called indifference at **p = 0.667**.

This is the certainty-based marking family used in medical assessment (published CBM table +1/+2/+3 against 0/−2/−6, thresholds at 67% and 80%), tuned down for a 4-option item with a 25% guess floor. The Called threshold of 2/3 is CBM's first threshold exactly.

**And the XP channel does not move those crossovers**, because per-card XP is identical at every tier (R2). §1.6.4 proves that no tiered XP table can preserve them. Verified numerically with `XP.expeditionCorrect 12`, `XP.expeditionWrong 3`, `XP.expeditionScorePoint 8`, total XP EV per card:

| *p* | Steady | Bold | Called |
|---|---|---|---|
| 0.500 | **15.500** | **15.500** | 11.500 |
| 0.667 | 19.667 | **22.335** | **22.335** |

Crossovers at exactly 0.500 and 0.667. The stake-table copy and the badge maths now describe the same game.

### 1.3 Run arithmetic — verified by exhaustive enumeration of all 3⁶ × 2⁶ runs

| | Today | With Called |
|---|---|---|
| Run score range | −6 .. 18 | **−18 .. 24** |
| Max score | 18 | **24** (6/6, all Called) |
| Max score at 5/6 | 15 | **20** |
| Min score at 6/6 | 12 | **12** |
| Max score at 0/6 | 0 | **0** (all Steady) |
| All-Steady run | 0 .. 12 | unchanged |
| All-Bold run | −6 .. 18 | unchanged |

Per-correctness bands, enumerated exhaustively:

| correct | min | max |
|---|---|---|
| 0 | −18 | 0 |
| 1 | −13 | 4 |
| 2 | −8 | 8 |
| 3 | −3 | 12 |
| 4 | 2 | 16 |
| 5 | 7 | **20** |
| 6 | **12** | 24 |

**The consequence, and it is bigger than revision 1 admitted.** The 5/6 and 6/6 bands overlap by 8 points. **19 of the 28 possible tier splits of a 6/6 run score below 20**, including a 6/6 all-Bold run at 18 — the current shipped maximum. So score alone is not a ranking of knowledge, and two things that use it have to change:

- `bold-master` — see §1.7.
- **`record.best`, which is the number the finish screen prints to the player.** `reduceExpeditions` (`lib/expeditions.mjs:294`) picks best by `result.score > record.best.score`, so a 5/6 run at 20 would permanently outrank the player's own flawless 6/6 at 18. Fixed by R3, §1.5.8.

### 1.4 Resolution, pause and abandon

**Every bet resolves on its own card, at the moment the answer lands. There is never a route-level settlement.** This is the rule that makes the bet safe to walk away from.

| Event | Behaviour |
|---|---|
| **Answer** | Score, XP, conviction tallies and badge all move on that card (`app/screens/expeditions/run.tsx:295-374` already reveals there). The bet is closed. |
| **Pause expedition** (`run.tsx:377-387`) | Free, one tap, between any two cards, forever. Nothing is escrowed across it. Copy stays neutral — never "four cards in, don't waste them." |
| **Pause & browse** (`index.tsx:79`) | Identical. Free. |
| **Resume** | The run resumes at `run.cursor`. Answers already resolved stay resolved. |
| **Abandon (leave and never come back)** | Costs nothing. Resolved cards keep their XP and their conviction tallies. Unanswered cards never existed and never enter any tally. |
| **Fold this run** (**new**) | Explicit action on the run screen, available from card 2 onward, **once per route per local day**. Marks the run folded and releases the route so a fresh run can start. |
| **Route completion** | Ceremony only, and only at a non-negative score (§6.5). **Never a settlement.** |

**Why Fold is capped at one per route per day.** Today `journey-start` refuses to replace a partial run, and that refusal is the only thing preventing a one-card farming loop (answer card 1, restart, answer card 1). Revision 1 removed the refusal and added nothing in its place, turning a 6-card cycle into a 4-second 1-card cycle. R1 already reduces a repeated card to 4 XP, and the day cap bounds the loop absolutely at 9 folds a day. Both guards ship; neither alone is enough to state plainly in the UI.

**Refused outright:** whole-route escrow ("bet the route up front"), parlays or streak multipliers across cards, a bankroll that carries between cards, any mechanic where card 6 is worth more because of card 1, any lock-out after a losing run, and **a live signed cumulative run total on the run screen** (§7.4, C28).

**The stamp is unconditional.** `finish.tsx:161-164` keeps awarding it at any score, including −18. The *ceremony* around it is not unconditional — see §6.5.

### 1.5 Data model — `lib/expeditions.mjs`

#### 1.5.1 Run answers (unchanged shape, widened vocabulary)

```
run.answers[i] = { choice: 0..3, confidence: 'steady' | 'bold' | 'called' }
```

`validRun` (`:157-177`) already validates `Object.hasOwn(CONFIDENCE, a.confidence)`, so adding the key to `CONFIDENCE` is the whole change. `'unknown'`, `'constructor'` and `'__proto__'` stay rejected (`tests/expeditions.test.mjs:108-109`).

#### 1.5.2 New export: `runTally(run)`

`runResult(run)` **must keep returning exactly `{ score, correct, bold }`** — `tests/expeditions.test.mjs:78` and `:84` `assert.deepEqual` against that object. Tier counts go in a sibling:

```js
/** Per-tier { n, correct } counts for the answers placed so far. Never mutates the run. */
export function runTally(run) {
  const t = { steady: { n: 0, correct: 0 }, bold: { n: 0, correct: 0 }, called: { n: 0, correct: 0 } };
  run.answers.forEach((a, i) => {
    const hit = a.choice === run.cards[i].correctIndex;
    t[a.confidence].n += 1;
    if (hit) t[a.confidence].correct += 1;
  });
  return t;
}
```

#### 1.5.3 Stored result record

```
record.first / record.best / record.last = {
  runId: string,
  score:   int,           // -18 .. 24
  correct: int,           // 0 .. 6
  bold:    int,           // 0 .. 6   (bold-TIER count only, legacy key, kept)
  at:      epoch ms,
  stakes: {               // NEW, optional — absent on pre-existing results
    steady: { n: int, correct: int },
    bold:   { n: int, correct: int },
    called: { n: int, correct: int },
  },
}
```

`bold` stays for the two `deepEqual`s. **It is the bold-tier count and nothing else** — the finish screen's "calls above Steady" tile must therefore be computed from `runTally(run)` as `t.bold.n + t.called.n`, never from `result.bold` (§7.2).

#### 1.5.4 `validResult` — the one genuinely breaking edit

The current inverse algebra at `:194-200` (`boldCorrect = (score − 2·correct + bold) / 2`) has no three-tier solution. Replace it with two branches:

```js
function validTally(t) {
  return (
    !!t && ['steady','bold','called'].every((k) => {
      const v = t[k];
      return v && Number.isInteger(v.n) && v.n >= 0 && v.n <= 6 &&
             Number.isInteger(v.correct) && v.correct >= 0 && v.correct <= v.n;
    })
  );
}

function validResult(r) {
  if (!r || !validId(r.runId) || !date(r.at)) return false;
  if (![r.score, r.correct, r.bold].every(Number.isInteger)) return false;
  if (r.correct < 0 || r.correct > 6 || r.bold < 0 || r.bold > 6) return false;

  if (r.stakes !== undefined) {                       // NEW results: recompute and compare.
    if (!validTally(r.stakes)) return false;
    const t = r.stakes;
    const n = t.steady.n + t.bold.n + t.called.n;
    const correct = t.steady.correct + t.bold.correct + t.called.correct;
    const score =
      2 * t.steady.correct +
      (3 * t.bold.correct - (t.bold.n - t.bold.correct)) +
      (4 * t.called.correct - 3 * (t.called.n - t.called.correct));
    return n === 6 && correct === r.correct && t.bold.n === r.bold && score === r.score;
  }

  // LEGACY results (no `stakes`): the exact two-tier algebra and bounds, byte-for-byte as shipped.
  if (r.score < -6 || r.score > 18) return false;
  const boldCorrect = (r.score - 2 * r.correct + r.bold) / 2;
  return (
    Number.isInteger(boldCorrect) &&
    boldCorrect >= Math.max(0, r.correct + r.bold - 6) &&
    boldCorrect <= Math.min(r.correct, r.bold)
  );
}
```

**A present-but-invalid `stakes` invalidates the whole result. It is never stripped and never repaired.**
Revision 1 said both things in two sections; this is the single rule, and `tests/expeditions.test.mjs:206`
(`assert.deepEqual(readProfile(bad).journeys, {})`) only holds under it.

**Verified against `tests/expeditions.test.mjs:197-219.`** The three corruption tuples
(`{score:18,correct:0,bold:0}`, `{score:1,correct:1,bold:0}`, `{score:-6,correct:0,bold:0}`) are
`Object.assign`-ed onto a result that under the new code carries `stakes`; each contradicts the stored
tally and is rejected. Note that `{score:1, correct:1, bold:0}` *is* arithmetically reachable under three
tiers (4 Steady wrong + 1 Called correct + 1 Called wrong), so a bounds-only validator would let it
through: **recompute-from-tally is what keeps that test honest, and that is why it is mandatory.**

#### 1.5.5 `readExpeditions` — the object literal must carry the new fields

`readExpeditions` (`:224-235`) builds a **fresh object literal** `{ run, first, best, last, completions }` and
never spreads `record`. Any field not listed there is silently dropped on every load. Revision 1 added
`record.folded` without adding it to this literal, which would have broken the `folded` flag *and* the
identity contract asserted at `tests/expeditions.test.mjs:133`, `tests/progression.test.mjs:547`,
`tests/passport.test.mjs:88`, `tests/events.test.mjs:501` and `tests/analytics.test.mjs:374`.

The literal becomes:

```js
result[route.key] = {
  run,
  first,
  best,
  last,
  completions: /* unchanged */,
  folded: !!run && record.folded === true,          // no run => never folded
  foldedDay: DAY_RE.test(record.foldedDay) ? record.foldedDay : null,
};
```

Also extend the completed-run consistency check at `:211-219` from `['score','correct','bold']` to compare
`last.stakes` against `runTally(run)` when `last.stakes` is present. Absent `stakes` on a legacy record
is not a mismatch.

#### 1.5.6 Fold — the complete change list

```
record.folded:    boolean          // NEW, default false
record.foldedDay: string | null    // NEW, YYYY-MM-DD of the last fold on this route, default null
```

1. **`expeditionStatus(record)`** (`:239-242`) — a record whose `run` exists, has `cursor < 6` and is
   `folded` returns `'complete'` if `first` exists, else `'new'`; it never returns `'continue'`.
2. **`journey-start`** (`:248-265`) — the guard `(run && run.cursor < 6)` becomes
   `(run && run.cursor < 6 && !record.folded)`, **and the returned record must set `folded: false`
   explicitly**: `{ ...record, folded: false, run: {...} }`. Relying on the spread carries `folded: true`
   into the fresh run, which makes every run after the first fold unresumable and silently destructible.
   `foldedDay` is *not* reset — it is the per-day cap and must survive.
3. **`journey-next` completion branch** (`:289-297`) — also a fresh literal that does not spread
   `record`. It must carry `folded: false, foldedDay: record.foldedDay`.
4. **New action `{ type: 'journey-fold', routeId, runId, at }`** — identity unless
   `run && run.id === action.runId && run.cursor < 6 && run.answers.length >= 1 && date(action.at)`
   and `record.foldedDay !== dayKeyOf(action.at)`. On success sets
   `{ ...record, folded: true, foldedDay: dayKeyOf(action.at) }`.
5. A folded run's already-resolved answers keep their XP, journal entries, attempts and conviction
   tallies. It produces **no** `expedition-complete` event, no stamp, no completion count, no result
   record.

**`dayKeyOf` without an import cycle.** `dayKey` lives in `lib/progression.mjs`, which imports
`expeditionById` from `lib/expeditions.mjs`; importing back would be circular. **Move `pad`, `DAY_RE`,
`dayKey` and `dayDiff` into `lib/journal.mjs`** — the module that already exists to hold vocabulary both
sides need (`TOPIC_DOMAINS`, `DIFFICULTIES`) and which imports nothing — and re-export `dayKey` and
`dayDiff` from `lib/progression.mjs` verbatim so every existing import site is untouched.

#### 1.5.7 Sanitisation additions, in the style of `readExpeditions`

| Field | Rule |
|---|---|
| `run.answers[i].confidence` | `Object.hasOwn(CONFIDENCE, v)` — already enforced, now admits `'called'`. |
| `result.stakes` | Present and failing `validTally`, or contradicting the recomputed `score`/`correct`/`bold`: **the whole result is invalid.** Never stripped, never repaired. |
| `result.score` | New results: must equal the tally recompute. Legacy: `−6 .. 18`. |
| `record.folded` | `run ? v === true : false`. |
| `record.foldedDay` | `DAY_RE.test(v) ? v : null`. |

#### 1.5.8 `record.best` and the `readExpeditions` baseline order by correctness first (R3)

```js
const better = (a, b) => !b || a.correct > b.correct || (a.correct === b.correct && a.score > b.score);
```

- `reduceExpeditions` completion branch: `best: better(result, record.best) ? result : record.best`.
- `readExpeditions` (`:210-212`): `const baseline = first && better(last, first) ? last : first;` and
  `const best = first && validResult(record.best) && !better(baseline, record.best) ? record.best : baseline;`

This also removes the cross-table comparison problem: a pre-update best of 18 was scored on a two-tier
table, and correctness-first comparison is meaningful across both tables while raw score is not.

**Verified against the two tests that touch `best`:**
`tests/expeditions.test.mjs:217-219` corrupts `best.correct = 0` on a 6/6 record; the corrupted result
now fails `validResult` outright (tally recompute) and falls back to the baseline with `correct: 6`. ✓
`tests/expeditions.test.mjs:135-155` (the replay test) finishes run-1 all-wrong (0/6, −6) then run-2 all-right (6/6, 18) and
asserts `best.score === 18`; correctness-first picks run-2. ✓

### 1.6 Data model — `lib/progression.mjs`

`PROGRESSION_VERSION` **stays 1** and the profile **stays version 2**. Every new field default-fills.

**The cost of keeping the version pinned, stated rather than asserted away.** This is a static GitHub
Pages build; an old bundle can stay live in an open tab across a deploy, and a rollback is a one-line
revert. An old build reading a new profile hits `validResult`'s `r.score > 18` bound
(`lib/expeditions.mjs:184`) on any Called-tier result, sets `first = null`, and `readExpeditions` then
`continue`s past the route — and because `lib/profile-store.mjs:67` does `store.put(output, KEY)` on the
sanitised result, **the deletion is persisted**. `validRun` rejecting `confidence: 'called'` drops an
in-progress run the same way. Bumping the profile version does not help: an old build would then fall
back to `emptyProfile()` and lose everything, loudly instead of route-by-route.

**Therefore this release ships with a deployment rule, not a schema trick:** a cache-busting deploy
(new hashed entry chunk plus a `Clear-Site-Data`-equivalent `?v=` on the service entry), and a
**documented no-rollback window** — once a profile in the wild carries a Called-tier result, reverting
the bundle destroys that route's history. Put the rule in `README.md` under Verification and in the
release checklist (§9, Stream G).

#### 1.6.1 `emptyProgression()` (`:524-543`) gains one block

```js
conviction: {
  steady: { n: 0, correct: 0 },
  bold:   { n: 0, correct: 0 },
  called: { n: 0, correct: 0 },
  counted: [],               // factIds whose FIRST expedition answer has been tallied (R1). Cap 1200.
  recent:  [],               // up to 20 CONVICTION_CODES, oldest first. Drives the brain only.
  best:    'provisional',    // high-water-mark badge tier, mirrors rank.best
  bestAt:  null,             // the rating at the moment `best` was last raised. null while provisional.
},
```

Lifetime tallies plus two bounded arrays. The rating is **derived**, never stored, exactly as
`levelForXp` and `rankForPoints` derive from `xp` and `rank.points`.

`convictionCards` is **not** added to `COUNTER_KEYS`. Revision 1 had it there as a second, independently
sanitised denominator that could disagree with `convictionCalls(conviction)` and print
"0 of 30 cards called" beside a full badge. There is one denominator: `convictionCalls(c)`.

```js
export const CONVICTION_CODES = Object.freeze(['s0', 's1', 'b0', 'b1', 'c0', 'c1']);
// tier initial + landed flag; 'c1' = a Called card that landed.
export const CONVICTION_WINDOW = 20;
export const CONVICTION_COUNTED_LIMIT = 1200;   // mirrors FACT_LIMIT; the bank is 54 today
```

#### 1.6.2 `readProgression()` (`:605-675`) gains, immediately after the `rank` block

```js
const cv = obj(value.conviction);
for (const k of ['steady', 'bold', 'called']) {
  const v = obj(cv[k]);
  next.conviction[k] = { n: nat(v.n), correct: Math.min(nat(v.correct), nat(v.n)) };
}
next.conviction.counted = [
  ...new Set((Array.isArray(cv.counted) ? cv.counted : []).filter(
    (id) => typeof id === 'string' && /^[A-Za-z0-9:_-]{1,80}$/.test(id) &&
            !['__proto__', 'constructor', 'prototype'].includes(id),
  )),
].slice(0, CONVICTION_COUNTED_LIMIT);
next.conviction.recent = (Array.isArray(cv.recent) ? cv.recent : [])
  .filter((c) => CONVICTION_CODES.includes(c))
  .slice(-CONVICTION_WINDOW);
let cBest = CONVICTION_TIERS.some((t) => t.id === cv.best) ? cv.best : 'provisional';
const cNow = convictionTier(next.conviction).id;            // derived from the sanitised tallies
if (convictionIndex(cNow) > convictionIndex(cBest)) cBest = cNow;
next.conviction.best = cBest;
next.conviction.bestAt =
  cBest === 'provisional' ? null
  : Number.isSafeInteger(cv.bestAt) && cv.bestAt >= 0 && cv.bestAt <= 2000 ? cv.bestAt
  : convictionRating(next.conviction);
```

Rules, matching the existing sanitiser's contract exactly:
- `nat()` every count (non-safe-integer, negative, `NaN`, `Infinity`, string → `0`).
- `correct` is clamped to `n` — the same `Math.min(nat(v.correct), nat(v.n))` shape as `counters.byTopic` at `:620`.
- `best` is whitelisted against `CONVICTION_TIERS` ids, then raised (never lowered) to the tier the sanitised tallies actually support — the same high-water-mark repair `rank` does at `:647-653`.
- `bestAt` is repaired to the live rating rather than invented, so the card can never print a badge with no earned-at number.
- Absent block → the `emptyProgression()` default. **`readProgression` stays identity on valid state.**

#### 1.6.3 `COUNTER_KEYS` (`:485-504`) gains one key

```
'reviews'   // Vault review attempts that were due and advanced or reset a box (§3.7)
```

`nat()`-sanitised by the existing loop at `:610`. Nothing else is added.

#### 1.6.4 `XP` (`:19-54`) — the tier-neutral table, and the proof it has to be

```js
expeditionCorrect: 12,        // UNCHANGED — every correct expedition card, any tier, FIRST encounter
expeditionWrong: 3,           // UNCHANGED — every miss, any tier, FIRST encounter
expeditionRepeat: 4,          // NEW — a card whose factId is already in conviction.counted (R1)
reviewCorrect: 6,             // NEW — a due Vault review answered correctly (§3.7)
review: 3,                    // NEW — a due Vault review answered wrongly
convictionTierGems: Object.freeze({          // NEW — total over CONVICTION_TIERS, paid CUMULATIVELY
  provisional: 0, hunch: 0, read: 10, edge: 25, sharp: 50, deadeye: 75,
}),
```

**`expeditionBoldCorrect: 18` is deleted. `expeditionCalledCorrect` is never added.**

**The proof.** Let the per-card XP be `A(t)` when correct and `W(t)` when wrong, and let score-XP be
`S · runScore` with `S = XP.expeditionScorePoint = 8`. Total XP EV at hit-rate *p* is
`A(t)p + W(t)(1−p) + S·[correct(t)p + wrong(t)(1−p)]`. For the total's tier crossovers to sit where the
run-score crossovers sit, at *every* p, the per-card term must be an affine function of the run-score
term with one shared pair of coefficients: `A(t) = α·correct(t) + β` and `W(t) = α·wrong(t) + β`.

- Anchoring on today's `A(steady) = 12` gives `2α + β = 12`.
- Non-negative XP for a wrong Called card requires `W(called) = −3α + β ≥ 0`, i.e. `β ≥ 3α`.
- Together: `2α + 3α ≤ 12`, so `α ≤ 2.4`, and any `α > 0` makes `W(called) < W(steady)` — a confident
  miss pays **less** XP than a cautious miss.

So the choice is binary: either a confident miss is punished twice (score *and* XP), or per-card XP is
flat (`α = 0`). This spec chooses **flat**: `expeditionWrong: 3` still covers every miss at every tier,
no XP is ever reduced for a wrong high-conviction call, and the bet lives entirely in run score.

Revision 1 kept `18`/`24` and claimed the proper-scoring-rule property anyway. With those numbers the
real crossovers were **p = 0.3636** and **p = 0.5333** — a player at 40% confidence was told to play
Steady and paid to play Bold, and `STAKE_COPY` advertised thresholds the game did not have.

**The `Math.max(0, score)` clamp, restated honestly.** `expeditionComplete + Math.max(0, score) · S`
means that once a run cannot finish above zero, the marginal score-XP of the last cards is **0**. Under
revision 1's tiered table that made Called *strictly dominant* at every p including a blind guess.
Under flat XP it makes the tiers **exactly indifferent** in the XP channel — never inverted. In that
region the only thing the tier moves is the displayed run score, which is the proper scoring rule. The
clamp stays, and this paragraph is the honest statement of what it costs.

**Replay score-XP is paid on improvement only.**

```js
// expedition-complete branch
const gained = e.first ? Math.max(0, e.score) : Math.max(0, e.score - (e.previousBest ?? 0));
let amount = XP.expeditionComplete + gained * XP.expeditionScorePoint;
if (e.first) { counters.stamps += 1; amount += XP.expeditionStamp; }
```

`deriveEvents` supplies `previousBest` from `before.journeys[key].best.score` (§1.6.5). Without this, a
memorised all-Called replay of six cards paid `6×24 + 40 + 24×8 = 376 XP` in 25–40 seconds against a
perfect 5–0 Gauntlet's 562 XP over several timed minutes — making the one mode with no opponent, no
timer and no failure mode the best XP in the game by 3–4× per minute. With flat XP, R1 and
improvement-only, that same memorised replay pays `6×4 + 40 + 0 = 64 XP`, and beating your own record
still pays properly.

`expeditionScorePoint: 8`, `expeditionComplete: 40` and `expeditionStamp: 60` are unchanged. Maximum
**first**-completion award rises from 244 XP (18·8 + 40 + 60) to **292 XP** (24·8 + 40 + 60); a negative
run still pays `Math.max(0, score) → 0` of it.

#### 1.6.5 `deriveEvents` (`:766-784`)

- `expedition-answer` already carries `confidence`; it now also carries **`factId`** (`run.cards[i].factId`,
  needed for R1) and `'called'` as a legal value.
- `expedition-complete` gains **`stakes`** (the run's `runTally`) and **`previousBest`**
  (`before.journeys[route.key]?.best?.score ?? 0`).
- New kind **`review`**, derived only when `action.type === 'review'`, from the newest entry of
  `after.journal.attempts` when its `id` is not in the before-set:
  `{ kind: 'review', factId, correct, due, advanced }`. `due` and `advanced` come straight from the
  reducer's own box update (§3.4) so the event cannot claim a queue position the schedule did not give it.
  The diff reads `after.journal.attempts[0]` only — it never scans the array.

#### 1.6.6 Reducer, expedition branches (`:1060-1082`) — complete, with every literal shown

```js
} else if (e.kind === 'expedition-answer') {
  const fresh = typeof e.factId === 'string' && !countedSet.has(e.factId);   // R1
  const amount = fresh ? (e.correct ? XP.expeditionCorrect : XP.expeditionWrong) : XP.expeditionRepeat;

  // The brain window moves on EVERY answer, fresh or repeat: it is a recency display, not a claim.
  recent = [...recent, `${e.confidence[0]}${e.correct ? 1 : 0}`].slice(-CONVICTION_WINDOW);

  if (fresh) {
    countedSet.add(e.factId);
    counted = [...counted, e.factId].slice(-CONVICTION_COUNTED_LIMIT);
    const slot = conviction[e.confidence];
    conviction = {
      ...conviction,
      [e.confidence]: { n: slot.n + 1, correct: slot.correct + (e.correct ? 1 : 0) },
    };
  }

  award('expedition-answer', amount, [
    `Expedition card ${(e.index ?? 0) + 1}`,
    e.correct ? (e.confidence === 'steady' ? 'correct' : `${CONFIDENCE[e.confidence].name.toLowerCase()} hit`) : 'missed',
    fresh ? null : 'already met',
  ].filter(Boolean).join(' · '), {
    routeId: clip(e.routeId), index: e.index ?? 0, confidence: e.confidence,
    correct: e.correct, fresh,
  });

  // Badge promotion, evaluated only when a fresh card moved the tally.
  if (fresh) {
    const to = convictionTier({ ...conviction, counted, recent, best: convictionBest, bestAt });
    if (convictionIndex(to.id) > convictionIndex(convictionBest)) {
      let bonus = 0;
      for (const t of CONVICTION_TIERS)
        if (convictionIndex(t.id) > convictionIndex(convictionBest) &&
            convictionIndex(t.id) <= convictionIndex(to.id))
          bonus += XP.convictionTierGems[t.id] ?? 0;              // total map + ?? 0: never NaN
      const from = convictionBest;
      convictionBest = to.id;
      bestAt = convictionRating({ ...conviction });
      award('rank', 0, `Conviction badge: ${to.label}`, { from, to: to.id, rating: bestAt }, bonus);
    }
  }
}
```

Four things revision 1 left implicit and one it got wrong:

1. **`XP.convictionTierGems` is total over `CONVICTION_TIERS`** and every read is `?? 0`.
   `convictionTier` genuinely returns `hunch` for a player who reaches the card minimum under 1150, and
   `XP.convictionTierGems['hunch']` was `undefined` in revision 1 — `gems += undefined` is `NaN`, which
   `nat()` silently zeroes on the next load: **a total gem wipe.**
2. **The bonus is cumulative across every tier crossed.** Revision 1 paid only the destination tier, so
   an all-Called player who jumped `provisional → deadeye` on card 30 collected **75** of the advertised
   160 while a slower player who crossed each line separately collected all 160 — the reward was
   inverted and the "160 lifetime" figure was unreachable by anyone.
3. **`conviction` must be added to the achievement fixed-point `draft` literal** (`:1153-1163`) **and to
   the reducer's final return literal** (`:1178-1189`). Both enumerate their keys explicitly; omit it and
   every conviction tally is discarded at the end of the reduce.
4. **No full-screen ceremony fires for a conviction promotion.** `arena.tsx:897` already sets
   `ceremonies: !!room || tab === 'journeys'`, so a `useProgressionFeedback` ceremony cannot open during a
   run — but it would queue and then ambush the player on the next screen. Instead the promotion is
   presented **inline on the finish scorecard** (§6.8) and, if the player never reaches a finish screen,
   as a single toast. A full-screen gold-family overlay landing immediately after a successful
   high-risk call, adjacent to the next stake choice, is exactly the escalation reinforcement D6 refuses.
5. `LOG_KINDS` gains **`'review'`** (§3.7) and reuses **`'rank'`** for the conviction promotion line, so
   the badge needs no new kind.

#### 1.6.7 `progressionDiff` (`:1180-1202`) gains one key

```js
convictionUp: convictionIndex(after.conviction.best) > convictionIndex(before.conviction.best)
  ? { from: before.conviction.best, to: after.conviction.best, rating: after.conviction.bestAt }
  : null,
```

Read by the finish-screen inline block (§6.8) and by the toast path. **Not** by any ceremony opener.

### 1.7 Achievements and quests

| Item | Change |
|---|---|
| `bold-master` (`:373-375`) | **Predicate** `e.score === 18` → `e.score >= 18 && (e.correct ?? 6) === 6 && (e.stakes?.steady.n ?? 0) === 0`. **Description** → **"Finish a route six for six with nothing below Bold."** |
| `bold-4` quest (`:250-257`) | **Retargeted to accuracy, tier-neutral.** Same `id`, same `hard` tier, same target 4, so the daily-quest seed sequence is unchanged. **Label** → `'Answer 4 expedition cards correctly'`. **`advances`** → `(e) => e.kind === 'expedition-answer' && e.correct`. |
| `review-5` quest (**new**) | `quest('review-5','medium','Clear 5 cards from your review queue',5,'due review answered',(e) => e.kind === 'review' && e.due)`. |
| **`ACHIEVEMENTS.length`** | **Stays 30.** No achievement is added anywhere in this spec. `tests/progression.test.mjs:757` is untouched. |

**Why the `bold-master` predicate is written that way.** Enumerating all 6/6 tier splits scoring ≥ 18
that contain Steady cards gives nine of them, including `3 Steady + 3 Called = 18` — revision 1's
predicate (`e.correct === 6 && e.score >= 18`) awarded a gold badge worth 300 XP and 50 gems for "nothing
below Bold" to a run that was half Steady. Using `stakes.steady.n === 0` makes the description literally
true. The `?? 6` and `?? 0` fallbacks exist for exactly one caller:
`tests/progression.test.mjs:800-812` feeds `reduceProgression` a **synthetic** event
`{ kind: 'expedition-complete', routeId: 'space', score: 18, first: true }` with no `correct` and no
`stakes`; under a strict predicate the achievement never fires, XP drops 554 → 254,
`levelForXp(xp).level` drops 3 → 2, and `assert.ok(level >= 3)` at `:810` fails. Real events always carry
both fields (`deriveEvents` sets `correct: a.last.correct` at `:783` and `stakes` per §1.6.5), so the
4-Called-plus-2-Steady run at 20 and the 3-Steady-plus-3-Called run at 18 are both still rejected.

**Why `bold-4` stops naming a tier.** It paid 80 XP + 15 gems for *choosing a higher stake tier* on a
daily deadline — direct pressure to over-call, and over-calling is precisely the miscalibration §2.2
says the rating exists to detect. A quest system that pays for the thing the badge beside it penalises
corrupts the badge. **No quest, achievement or cosmetic may key on the tier selected.** (Revision 1 also
relabelled it "Call 4 cards Bold or higher" while leaving `e.correct` in the predicate, so a player who
called four and missed four would have watched it sit at 0/4.)

### 1.8 Cosmetics — the gem sink, with the arithmetic done

Existing priced catalogue, itemised: chartreuse-ring 60 + obsidian 300 + quiz-hound 40 +
stadium-lights 80 + nebula 80 + lab-glass 120 + coral 50 + cyan 50 + magenta 90 = **870**. Month-1 supply
for a typical solo player is ~925 (quests 450, levels 275, achievements 200), so today a committed
player clears the entire Locker inside 30 days with 55 gems left over.

Add six cosmetics. `COSMETICS.length` goes **23 → 29**, and `tests/progression.test.mjs:820-821`
is updated to 29 (D13).

| Kind | id | Name | Price | Unlock |
|---|---|---|---|---|
| frame | `called-halo` | Called | 140 | `{ conviction: 'edge' }` |
| frame | `deadeye` | Dead eye | 220 | `{ conviction: 'deadeye' }` |
| title | `caller` | Caller | null | `{ conviction: 'read' }` |
| title | `sharp` | Sharp | null | `{ conviction: 'sharp' }` |
| banner | `called-it` | Called it | 160 | `{ conviction: 'edge' }` |
| banner | `field-notes` | Field notes | 120 | **none — ungated** |

**The numbers, corrected.** New priced sink = 140 + 220 + 160 + 120 = **640**. New supply = the cumulative
tier bonus, **160** for anyone who reaches Dead eye. Net tightening = **480**, not revision 1's "~250".
Month-1 balance moves from **+55** to **1085 supply against a 1510 catalogue = −425**.

**The ungated item exists on purpose.** Every gated item is unreachable for a player who never calls
above Steady, so revision 1's sink did nothing for exactly the player whose surplus it was meant to
absorb. `field-notes` at 120 puts that player at **925 supply against a 990 reachable catalogue = −65**:
no longer over-supplied, without paying them to take the −3 tier.

`canEquip` (`:463-473`) gains one line beside the existing `u.rank` branch:

```js
if (u.conviction && convictionIndex(prog.conviction.best) < convictionIndex(u.conviction)) return false;
```

**`reduceCosmetics`'s buy path (`:850-866`) must also gate.** Today it checks only
`c.price === null || owned || gems < price`, so a priced-and-gated item would be buyable before the tier
is earned. Extract the unlock block from `canEquip` into `unlockMet(prog, c)` and add `|| !unlockMet(prog, c)`
to the buy guard. Free gated items are unaffected.

---

## 2. Conviction — the profile badge

### 2.1 What it is never called

**Banned strings, anywhere in UI copy, alt text, aria labels, asset names, CSS class names, analytics event names or the deck:**

> Knowledge Level · Knowledge Score · IQ · Mastery Level · Mastery Score · Rating (as a player rating) · Percentile · Top N% · Certified · Verified · Proven · Accuracy Rank · Community Rank · Community Badge · Community Champion · Top Scholar · Elite · #1 · Founding Member · Global Rank

`Expert` and `Extreme` remain legal **only** as question-difficulty labels, which is their current use.

Also banned as casino vocabulary: *wager, chips, pot, jackpot, odds, payout, house, spin, cash out, all in, double down, ante, streak bonus multiplier*. Permitted: *call, confidence, at risk, points*.

### 2.2 The formula, from data the app already records

**Conviction Rating (CR)** is derived from the six integers in `progression.conviction` and nothing else.

```js
// lib/progression.mjs — new, immediately after RANK_TIERS

/** Total run points those calls actually scored, using CONFIDENCE's own table. */
export function convictionPoints(c) {
  return (
    2 * c.steady.correct +
    (3 * c.bold.correct - (c.bold.n - c.bold.correct)) +
    (4 * c.called.correct - 3 * (c.called.n - c.called.correct))
  );
}

/** DISTINCT facts on which a first-encounter expedition call was placed (R1). 0..54 today. */
export function convictionCalls(c) {
  return c.steady.n + c.bold.n + c.called.n;
}

/** Distinct facts called above Steady. The second gate, and the headline fraction's denominator. */
export function convictionRiskCalls(c) {
  return c.bold.n + c.called.n;
}

/** Distinct calls above Steady that landed. */
export function convictionRiskLanded(c) {
  return c.bold.correct + c.called.correct;
}

/** 1000 + 200 x mean run points per called card, clamped 0..2000. 1000 when nothing is called yet. */
export function convictionRating(c) {
  const n = convictionCalls(c);
  if (!n) return 1000;
  return Math.max(0, Math.min(2000, Math.round(1000 + 200 * (convictionPoints(c) / n))));
}
```

**Why this formula and not another.** Mean-points-per-card is itself a proper scoring rule, so the rating ties exactly where expected run score ties — which is what makes it defensible as a statement about the player rather than about their appetite for risk:

| At hit-rate *p* | Steady | Bold | Called |
|---|---|---|---|
| p = 0.500 | **1200** | **1200** | 1100 |
| p = 0.667 | 1267 | **1333** | **1333** |
| p = 1.000 | 1400 | 1600 | 1800 |

Only miscalibrated over-calling drags you under 1000 — which is exactly the signal, and the only thing the app can truthfully claim to have measured about you.

**Steady is included in the denominator on purpose.** Excluding it would make declining free and invite a player to Steady everything they do not know, which would turn the badge into a measure of how selectively you bet rather than how well you know what you know. The consequence — a Steady miss *does* move the rating down — is stated in the UI copy (§2.4) instead of being contradicted by it.

### 2.3 What makes it a knowledge claim rather than a memorisation claim (R1)

Revision 1's badge was farmable to its top tier in about three minutes. The route is worth spelling out because the fix is shaped by it:

> Play any route once. `finish.tsx:186-220` then prints `Correct answer: …` for all six cards, the answers land in `journal.rounds[].correctAnswer`, and `exportAll` (`app/use-player.ts:215`) will dump them to disk as JSON. Press **Replay for practice** — `journey-start` imposes no cooldown, no cap and no distinct-route requirement. Replay the same route five times calling everything Called from memory: 30 cards, 120 points, mean 4.0, rating **exactly 1800 → Dead eye**, plus the gems and the 220-gem `deadeye` frame. Thirty taps.

Revision 1's two stated guards — "the 30-card minimum, and the fact that Steady counts in the
denominator" — are both **satisfied** by that exploit. Neither touches replay.

**R1 closes it structurally.** Only a fact's **first** expedition answer moves `conviction`. The
denominator is therefore bounded by the bank (54 distinct facts today), `CONVICTION_MIN_CARDS = 30`
genuinely means thirty distinct facts — five distinct routes — and Dead eye at 1700 requires a mean of
3.5 points per first-sight card, i.e. roughly 93% accuracy calling Called on facts you are seeing in an
expedition for the first time. That is an actual knowledge claim.

**The residue, stated on the card rather than hidden.** A player can still meet facts elsewhere first —
Discovery prints its answers, duels journal them, the Vault teaches them — and then call Called on first
*expedition* sight. That is not the same defect: it produces thirty distinct facts of genuine knowledge,
however recently acquired, rather than six facts counted five times. The card says so:

> *Counts the first time each fact appears in an expedition. Facts you learned elsewhere first still
> count — this measures whether your calls match what you know, not how you came to know it.*

**A second gate: `CONVICTION_MIN_CALLS`.** An all-Steady player's rating maxes at 1400, which sits in
Edge — so revision 1 awarded a badge called CONVICTION, a title called **Caller** and a banner called
**Called it** to a player who had never made a call, and §6.8's ceremony congratulated them with
"**0 of 0** above Steady". Any tier above Hunch now also requires **20 resolved calls above Steady**.

### 2.4 Badge tiers

`CONVICTION_TIERS` is a direct structural copy of `RANK_TIERS` (`:136-165`), including the high-water-mark pattern at `:647-653`. **The badge label never demotes; the rating beside it does, and the card prints both.**

```js
export const CONVICTION_TIERS = Object.freeze([
  { id: 'provisional', label: 'Provisional', min: -Infinity },
  { id: 'hunch',       label: 'Hunch',       min: 0 },
  { id: 'read',        label: 'Read',        min: 1150 },
  { id: 'edge',        label: 'Edge',        min: 1300 },
  { id: 'sharp',       label: 'Sharp',       min: 1500 },
  { id: 'deadeye',     label: 'Dead eye',    min: 1700 },
].map(Object.freeze));

export const CONVICTION_MIN_CARDS = 30;   // distinct facts first met in an expedition (R1)
export const CONVICTION_MIN_CALLS = 20;   // of those, how many were called above Steady

export function convictionTier(c) {
  if (convictionCalls(c) < CONVICTION_MIN_CARDS) return CONVICTION_TIERS[0];        // provisional
  const rating = convictionRating(c);
  const i = CONVICTION_TIERS.reduce((best, t, j) => (rating >= t.min ? j : best), 1);
  if (convictionRiskCalls(c) < CONVICTION_MIN_CALLS) return CONVICTION_TIERS[Math.min(i, 1)]; // cap at Hunch
  return CONVICTION_TIERS[i];
}
```

| Badge | Requires | Cumulative gems on first reaching it |
|---|---|---|
| Provisional | fewer than 30 distinct called cards | — |
| Hunch | 30 cards; under 1150, **or** fewer than 20 calls above Steady | — |
| Read | 1150 – 1299, ≥ 20 calls above Steady | 10 |
| Edge | 1300 – 1499 | 25 (35 total from Provisional) |
| Sharp | 1500 – 1699 | 50 (85 total) |
| Dead eye | 1700 + | 75 (160 total) |

Three guards against farming, all structural: the first-encounter ledger (R1), the 30 distinct-card
minimum, and the 20 calls-above-Steady minimum. Steady counting in the denominator is a *calibration*
property, not an anti-farm guard, and is no longer described as one.

**The acknowledged design limit, stated on the card.** A player who answers every expedition card
correctly but never calls above Steady stays **Provisional** forever. That is intended: Conviction is a
calibration-under-risk measure and there is nothing to calibrate when nothing is at risk. The card says
exactly how to move it, so it is a stated rule rather than a hidden ranking of risk appetite:

> *Conviction is about the calls you make above Steady. Steady-only play stays Provisional — there is
> nothing yet to be right or wrong about.*

This is the honest answer to the objection that the badge "ranks a 70% gambler above a 90% careful
player": among players who do call, the rating is a proper scoring rule and honest calling maximises it;
a player who never calls is not ranked at all.

### 2.5 Exact on-screen wording

Every numeric claim carries its denominator and its scope **in the same visual unit** — never a bare
four-digit number that reads as Elo to anyone who has seen a ranked game.

**Profile — new fourth card beside Level / Rank / Streak** (`app/screens/player-screen.tsx:56-64`):

```
CONVICTION
{Badge label}                          best reached · earned at {bestAt}

Calls above Steady: {landed} of {riskCalls} right.
Steady: {sLanded} of {sCalls}.
Conviction now: {rating} of 2000 — the average points your calls have scored, on this device.

Counts the first time each fact appears in an expedition; replays never move it.
Not a comparison against other players — there is no leaderboard.
```

- When `rating < CONVICTION_TIERS[index(best)].min`, a fourth line is added:
  `Your badge keeps the highest tier you have reached; the number moves with your recent calls.`
  Revision 1 would have printed **`Dead eye  1313`** with nothing explaining it — a computed case:
  30 Called at 28 correct gives 1707 → Dead eye; 30 more Called at 40% gives 94/60 → 1313.
- **Never render a fraction with a zero denominator.** Below one resolved call above Steady the second
  line reads `No calls above Steady yet.`
- Below `CONVICTION_MIN_CALLS` resolved calls above Steady, **no percentage appears anywhere** — raw
  fractions only.

Under 30 distinct called cards, the whole card reads instead:

```
CONVICTION
Provisional

{calls} of 30 distinct expedition facts called. Your badge appears at 30.
Of those, {riskCalls} were called above Steady — the badge needs 20.
Calls above Steady so far: {landed} of {riskCalls}.
Earned on this device. Replays do not count.
```

**Expedition run, above the confidence control** (`run.tsx`, new):

```
Call it. Steady +2 / 0 · Bold +3 / −1 · Called +4 / −3.
Points in this run only. Nothing is spent and nothing can be bought.
```

**Expedition run, per-tier stake line** (`STAKE_COPY`, `run.tsx:31-34`):

```ts
const STAKE_COPY: Record<string, string> = {
  steady: 'Steady: +2 if you are right, 0 if you are not. No run points at risk — and the card still counts toward your Conviction average.',
  bold:   'Bold: +3 if you are right, -1 if you are not. Worth it above a coin flip.',
  called: 'Called: +4 if you are right, -3 if you are not. Worth it when you are two-thirds sure.',
};
```

**Accessibility of the stake control — the payout must be in the accessible name.** Today
`aria-pressed` announces the toggle state and nothing else, so a screen-reader user could place a −3
call having never been told it risks anything. That was tolerable at −1 on one tier; at −3 with a −18
floor it is a bet placed without disclosure, and rule 10 ("the disclaimer travels with the mechanic") is
not met by a disclaimer no screen reader reads.

- Each button carries `aria-label="Called: plus 4 if right, minus 3 if wrong"` — **words, not glyphs**.
- The stake line gets `aria-live="polite"` so a tier change is announced.
- **Every announced string uses the word "minus" or an ASCII hyphen-minus.** U+2212 MINUS SIGN is
  commonly announced as nothing by NVDA and JAWS, which would turn "Called +4 / −3" into
  "Called plus 4 slash 3". U+2212 is permitted **only** inside `aria-hidden` display text.
  `signed()` at `expeditions/parts.tsx:14` already emits ASCII; keep it that way and stop hand-writing
  U+2212 in copy strings.

**Legend** (`run.tsx:223`): `How sure are you?` → **`How well do you know this one?`**

**Feedback line under the switch** — never a nudge. Before 5 resolved calls above Steady exist:
`Called pays most when you are sure. There is nothing here for bluffing.` After:
`Your Bold and Called cards so far: {landed} of {calls} right.`

**Expedition finish, replacing `finish.tsx:161-164`:**

```
Your stamp marks completion, whatever the score. Points are scored inside this run only —
there is no wallet, nothing is spent and nothing can be bought. Replays use the same six
questions with the options reshuffled each run; scores are a record on this device, not a ranking.
```

**Expedition finish at a negative score, added above the recap:**

```
{score} points. Every one of these six is in your Vault, untimed, whenever you want it.
```

**Section rename** — `app/screens/player-screen.tsx:71` `Mastery` → **`Topic record`**, and the eyebrow `WHERE YOU ARE STRONG` → `WHAT YOU HAVE ANSWERED`, sub-label `Correct answers ÷ rounds played` → **`Duel rounds only`**.

**Fix a false sentence that ships today.** `app/screens/player/mastery.tsx:50-52` says *"a duel or an expedition in any {domain} topic starts these bars."* `counters.byTopic` is written **only** in the `e.kind === 'round'` branch (`lib/progression.mjs:952-959`); expedition and Discovery answers have never fed it. Replace with: **"Nothing recorded yet — a duel round in any {domain} topic starts these bars. Expedition cards are recorded in your Vault and your Conviction, not here."**

### 2.6 The honest cohort line, and where it may appear

The badge is device-local and says so. Separately, on `/analytics` **only** — never on the profile, never as a personal badge:

```
Aggregate only, from devices that opted in. Buckets describing fewer than 5 devices are
suppressed. This says nothing about any individual player, including you.
```

The only path to a genuine community comparison would be adding `boldCalls` / `boldCorrect` to the cohort payload (`lib/cohort-client.ts:19-33`), a new server column, updated consent copy and the same suppression floor. That is a new consent scope, not a copy change, and it is **out of scope here**.

---

## 3. The Vault as the learning surface

Expeditions are the betting mode. The Vault is where learning happens. The bridge between them is a single fact: **a Bold or Called card that missed is, by definition, a high-confidence error, and high-confidence errors are the most correctable ones there are** (Metcalfe 2017, *Learning from Errors*: "Errors committed with high confidence are corrected more readily than low-confidence errors"). Nothing else in the app knows which of your errors were confident. The betting mechanic is therefore a confidence-elicitation instrument that hands the Vault a ranked queue.

### 3.1 Four defects in the current capture, before any new design

1. **Recall Lab attempts are not recorded at all.** `app/journal.tsx:211` calls `onRecall(current.id)` → `lib/passport.mjs:238-260`, which flips `passport.facts[id].recalled` false → true **once, forever**. The second, fifth and twentieth recall write nothing.
2. **Recall Lab attempts pay nothing, either.** `deriveEvents` has no branch that can see a second recall, so the surface the product calls "where learning happens" awards **0 XP and 0 quest progress** — while revision 1 simultaneously paid 376 XP for re-tapping six memorised expedition answers. Fixed in §3.7.
3. **The bet is discarded at the journal boundary.** `applyPractice` (`lib/passport.mjs:288-318`) journals an expedition card without `confidence` and without what the player picked. Confidence survives only inside `record.run`, which `reduceExpeditions` overwrites on the next `journey-start`.
4. **The fact ledger preserves award eligibility, not learning.** `passport.facts[id]` is `{ topic, opened, recalled }` — three booleans. It cannot answer *"did they get this right again later"*, which is the only question the Vault needs.

### 3.2 The capture contract

**Shape: additive. `journal.version` stays 1. `rounds` and `matches` are untouched.** `tests/journal.test.mjs:87` asserts `readJournal('{"version":2}')` returns empty, and `:89-101` asserts the 200/100 caps.

**`EMPTY_JOURNAL` becomes a factory.** `lib/journal.mjs:55` and `:63` both `return { ...EMPTY_JOURNAL }` — a
**shallow** spread of a module-level singleton. Today the collections are arrays that code only ever
replaces, so the aliasing is latent. `cards` and `facts` are keyed maps whose natural write is
`journal.cards[factId] = snapshot`; one such mutation writes into the singleton and every profile minted
afterwards in that page session inherits it — **including the one `emptyProfile()` mints on `reset`**
(`lib/passport.mjs:25, :145`), so a reset would hand the fresh profile the old profile's card store. No
existing test would catch it, because both sides of the `deepEqual` would alias the same object.

```js
export const emptyJournal = () => ({
  version: 1,
  rounds: [], matches: [], saved: [],   // unchanged, unchanged caps
  cards: {},      // factId -> content snapshot, stored ONCE
  facts: {},      // factId -> learning record
  attempts: [],   // every answer on every surface, newest first
});
export const EMPTY_JOURNAL = Object.freeze(emptyJournal());   // kept for the lib/passport.mjs import
```

Both `readJournal` exits call `emptyJournal()`. **Every write to `cards` / `facts` is copy-on-write**
(`{ ...journal.cards, [id]: snap }`), matching how `passport.facts` is written at `lib/passport.mjs:220-226`.

`passport.facts` is left alone. It is the exactly-once award ledger that `deriveEvents` diffs (`lib/progression.mjs:786-795`); giving it a second job would break the identity contract. Two records, two jobs, zero test churn.

#### 3.2.1 The attempt record — one per answer, every surface

| Field | Type | Source | Why |
|---|---|---|---|
| `id` | string ≤ 120 | existing round id (`round-…`, `practice:…`, `journey:<runId>:<i>`, `review:<factId>:<at>`) | dedupe key; `deriveEvents` already keys on it |
| `factId` | `/^[A-Za-z0-9:_-]{1,80}$/` | question | the join key for everything below |
| `at` | epoch ms | `action.at` | spacing is impossible without real timestamps |
| `surface` | `'duel' \| 'expedition' \| 'discovery' \| 'recall' \| 'event'` | dispatch site | separates proving from learning |
| `contextId` | string ≤ 64 | matchId / runId / discovery session | groups attempts into a run; drives the Runs timeline |
| `index` | int 0..31 | position in run | ordering within a run |
| **`chose`** | string ≤ 500 \| null | **the option text the player picked** | see below |
| `correct` | boolean | derived, then stored | survives bank edits and option re-ordering |
| `elapsedMs` | number \| null | receipt; `null` when untimed | fluency signal; never scored in the Vault |
| `confidence` | `'steady' \| 'bold' \| 'called' \| null` | `run.answers[i].confidence` | **the bet.** The Vault's priority queue is built from this |
| `stake` | `0\|10\|25\|50\|100` \| null | `room.config.stake` | the duel-side bet, already client-side |
| `opponent` | `'bot' \| 'human' \| null` | `room.players[].kind` | a bot round stays labelled in the history too |
| `revealed` | boolean | set by the review session itself | anti-gaming, see §3.2.5 |

**`chose` stores the option *text*, not an index, and this is not a preference.** `lib/server/room-engine.mjs:61`
runs `const order = shuffle([0,1,2,3], rng)` per question, and `lib/server/duel-service.mjs:377-388` does
the identical per-card shuffle on **every expedition run** — which is exactly why `lib/journal.mjs:84-85`
stores `options: q.options` on every round entry today, and why `README.md:16` says "Replay uses the same
questions with **freshly shuffled options**". Revision 1 stored a 0..3 index against a *single* stored
option order, so rendering `cards[factId].options[attempt.choice]` would have printed an answer the
player never selected — on the one surface whose header promises a truthful history. Storing the text is
self-contained, survives a bank edit, and costs ~40 bytes.

No question text, no options, no personal data. **Measured: 235 bytes** as JSON with these key names
(benchmarked on a realistic 600-attempt array). Keep the readable names — `exportAll`
(`app/use-player.ts:202-222`) hands this file to the player.

#### 3.2.2 The fact record — `journal.facts[factId]`

```
topic, difficulty
seen, correct              // lifetime counts, never evicted
firstAt, lastAt, lastCorrect
streak                     // consecutive correct, resets on a miss
days                       // count of DISTINCT local days with a correct answer
bySurface { duel, expedition, discovery, recall }
boldWrong                  // Bold-or-Called misses: the priority queue
firstMissAt                // write-once: the first incorrect attempt        <- the claim tile
recoveredAt                // write-once: the first correct attempt on a LATER dayKey than firstMissAt
box (0..5), due (epoch ms), lapses, retiredAt
```

**Measured: 286 bytes.** `days`, `firstMissAt` and `recoveredAt` all use `dayKey()` (now in
`lib/journal.mjs`, §1.5.6) so local-midnight handling matches the streak exactly.

**`firstMissAt` / `recoveredAt` exist because §3.6's headline claim is not computable without them.**
"n of the m facts you missed have since been answered correctly **on a later day**" needs the day of the
miss ordered against the day of the correct answer. `days` counts distinct days with a *correct* answer
only, so a fact missed and recovered within one day is byte-identical in the aggregates to one recovered
a week later — and once the miss falls outside the per-fact attempt cap, the tile could only guess, and
it would guess high. Two write-once fields make the tile exact and make §3.2.6's "the statistics stay
complete" true as written.

**`opens` is deliberately *not* on this record.** Revision 1 made it a counter incremented from the
`open` action. `app/screens/vault/fact-card.tsx:58-63` calls `onOpen(fact.id)` on *every* toggle, and
`lib/passport.mjs`'s open branch deliberately returns the **same profile reference** on a repeat —
`tests/progression.test.mjs:565` asserts exactly that (`assert.strictEqual(act(p, { type:'open', … }), p)`).
A counter there changes the reference on every toggle, fails that assertion, and turns an idle disclosure
widget into an unbounded IndexedDB write plus a revision bump per tap. Open counts, if ever wanted, are
derivable from the attempt stream; the `open` action stays byte-identical.

#### 3.2.3 The card store — `journal.cards[factId]`

The full content snapshot (question, options, correctIndex, explanation, topic, subtopic, sourceUrl,
sourceLabel, difficulty) stored **once per fact**, from whichever presentation was first journalled.
**Measured: 630 bytes** in the benchmark (padded synthetic text; ~399 bytes on the real bank).

This is the whole storage argument. Today `lib/journal.mjs:77-94` copies the full question into **every** round entry — measured at **167,816 bytes for 200 rounds** holding at most 54 distinct facts. Roughly three-quarters of the current window is duplicated text.

#### 3.2.4 Sanitisation in `readJournal`, and the writer that must match it (R4)

Same contract as `validFact`: whitelist, clamp, drop, cap. Never repair by invention.

| Collection | Rules | Cap |
|---|---|---|
| `cards` | Key matches `/^[A-Za-z0-9:_-]{1,80}$/` and is not `__proto__`/`constructor`/`prototype`. Value must satisfy the existing `validFact`-style field checks (4 distinct options, `correctIndex` 0..3, `https?://` source, bounded text). Drop the entry otherwise. | **300** |
| `facts` | Same key rule. `nat()` every count; `correct ≤ seen`; `box` clamped 0..5; `due`/`firstAt`/`lastAt`/`retiredAt`/`firstMissAt`/`recoveredAt` pass `validDate` or become `null`; `topic` must be in `TOPIC_DOMAINS`; `difficulty` in `DIFFICULTIES` or dropped; `bySurface` keys whitelisted to the five surfaces. | **300** |
| `attempts` | Every field type-checked as in §3.2.1; `surface` whitelisted; `confidence` whitelisted against `CONFIDENCE` keys or `null`; `stake` in `[0,10,25,50,100]` or `null`; `chose` a string ≤ 500 or `null`; `index` 0..31. Entries failing any check are dropped, not fixed. | **12 per `factId`, 600 global** |

**R4 — the writer enforces the identical caps, in the identical order.** A cap enforced only in the
sanitiser breaks the identity contract the whole profile layer rests on: `readJournal` would drop the
13th attempt on a fact while `applyPractice` kept appending, and the moment a player answered one fact
13 times — trivial in a repeat-until-correct review loop —
`readProfile(JSON.parse(JSON.stringify(p)))` would stop deep-equalling `p`, failing
`tests/expeditions.test.mjs:133`, `tests/progression.test.mjs:547`, `tests/passport.test.mjs:88`,
`tests/events.test.mjs:501` and `tests/analytics.test.mjs:374`. The existing code already models this:
`lib/passport.mjs:317` does `.slice(0, 200)` in the writer, mirroring `readJournal`'s `.slice(0, 200)`.

**Ordering is by prepend, never by sort.** `at` ties are routine — the tests dispatch every action with
`at: 1000` — so a sort is not stable across engines. Every writer **prepends** the new attempt and then
applies, in this order: (1) drop the oldest attempt for that `factId` beyond 12, (2) truncate the whole
array to 600. `readJournal` walks the stored array front-to-back applying the same two rules, which is
exactly what a correct writer produces.

#### 3.2.5 Per-surface wiring

| Surface | Today | Change |
|---|---|---|
| Duel round | `lib/journal.mjs:76-95` takes only `correct` (`:91`) and `elapsedMs` (`:92`) from `rd.receipts[room.seat]` | also take `.choice` (receipts carry it, `lib/server/room-engine.mjs:277-287`) and resolve it to `q.options[choice]` at write time; emit an attempt with `surface:'duel'`, `stake` from `room.config.stake`, `opponent` from `room.players` |
| Expedition card | `lib/passport.mjs:196-204` → `applyPractice:288-318` | thread `confidence` through the `journey-answer` branch (it is already in `run.answers[i]`); emit `surface:'expedition'`, `contextId: run.id`, `index`, `chose: f.options[action.choice]` |
| Discovery card | `lib/passport.mjs:206`, `app/discovery.tsx:92` | emit `surface:'discovery'`, `contextId` = the existing session uuid |
| **Recall Lab** | `app/journal.tsx:211` — **writes nothing** | new `{ type: 'review', factId, roundId, choice, chose, correct, revealed, at }` action → attempt with `surface:'recall'` + box/due update + a `review` progression event. **This is the single change that makes every other part of section 3 possible.** |
| Explanation open | `app/screens/vault/fact-card.tsx:58-66` | **unchanged.** See §3.2.2. |

**`revealed` is supplied by the review session, not reconstructed from stored open history.** The review
deck knows, in its own component state, whether the player expanded the explanation for the current card
before answering, and passes `revealed: true` in the action. Revision 1 defined it as "the explanation
was opened within 60 s before this attempt" and then designed a fact record with **no timestamp for an
open**, so every attempt would have been written `revealed: false` and §3.5's "the `revealed` flag blocks
the obvious exploit" would have been decorative. Session-local state is both simpler and stricter, and it
needs no new write path. On every other surface the explanation is only shown *after* the answer, so
`revealed` is `false` by construction.

`matchId: 'practice'` survives inside `journal.rounds` for compatibility, but it stops being the way the app distinguishes surfaces — it conflated three different ones.

#### 3.2.6 Caps, measured storage cost, and the measured read cost

**Bytes at rest** (measured by serialising realistic records; see `scratchpad/bench.mjs` in §10.8):

| Collection | Today | Proposed | Per entry | At the 54-fact bank | Saturated |
|---|---|---|---|---|---|
| `journal.rounds` | 200 | **200, unchanged** | 507 B | 101 KB | 101 KB |
| `journal.matches` | 100 | 100, unchanged | ~80 B | 8 KB | 8 KB |
| `journal.cards` | — | 300 | 630 B | 34 KB (54) | 189 KB |
| `journal.facts` | — | 300 | 286 B | 15 KB (54) | 86 KB |
| `journal.attempts` | — | **12 per fact, 600 global** | 235 B | 141 KB | 141 KB |
| **Journal total** | **168 KB** | | **≈ 299 KB** | **≈ 525 KB** |

**The cost that actually matters is not disk, and revision 1 measured the wrong thing.**
`lib/profile-store.mjs:65` runs `readProfile(read.result)` inside **every** readwrite transaction, and
`lib/passport.mjs:52` implements that as `readJournal(JSON.stringify(value.journal))` — a full
stringify + parse of the entire journal on every single write. `app/use-player.ts:10` sets
`HEARTBEAT_MS = 15_000`, so that cost lands every 15 seconds while the app is open, including mid-duel
against the 50 ms timer tick at `app/screens/room/question-stage.tsx:86`, on a timer track that has no
CSS transition and therefore shows every dropped frame. Arguing about the IndexedDB quota does not
address it.

**Measured on this machine (node 22, `scratchpad/bench.mjs`):**

| | Today | Revision 2 |
|---|---|---|
| Journal bytes | 167,816 | 583,639 (saturated) |
| `JSON.stringify` + `JSON.parse` leg | **1.136 ms** | 4.358 ms |
| Validation of `rounds`/`matches`/`saved` | 0.417 ms | 0.417 ms |
| Validation of `cards`/`facts`/`attempts` | — | **0.617 ms** |
| **Total journal read per transaction** | **1.553 ms** | **1.034 ms** |

**The fix is to delete the JSON round trip, not to shrink the data.** Split the sanitiser in two:

```js
export function readJournalValue(value) { /* the existing body, taking a parsed object */ }
export function readJournal(raw) {
  try { return readJournalValue(JSON.parse(raw || 'null')); } catch { return emptyJournal(); }
}
```

`lib/passport.mjs:52` then calls `readJournalValue(value.journal)` directly; the `issues` check at `:49`
and the `applyPractice` self-check at `:319` become `readJournalValue({ version: 1, rounds: [...] })`. `readJournalValue` wraps its own body
in `try/catch` so a structured-clone value with a cycle or an exotic type degrades to the empty journal
exactly as the string path does; every field is already type-checked (`typeof === 'string'`,
`Number.isFinite`, `Array.isArray`), so a `Date` or a `Map` arriving from IndexedDB fails the same checks
it failed after a stringify. **The public `readJournal(raw)` signature is unchanged, so no test moves.**

Net: a saturated revision-2 profile reads **faster** than a shipped one does today (1.03 ms vs 1.55 ms),
against a budget of **≤ 4 ms on this machine / ≤ 16 ms on a mid phone**. If a future bank makes it
exceed that, the caps are the tuning knob and this table is the instrument.

Aggregates in `facts` are never evicted, so the *statistics* stay complete after old attempts age out of
the rolling tail — and with `firstMissAt` / `recoveredAt` that is now true of §3.6's claim tile too.

`exportAll` pretty-prints (`app/use-player.ts:215`): a saturated profile downloads at roughly 1.2 MB.
Acceptable; note it in the README.

### 3.3 Information architecture

#### 3.3.1 The one structural flip

`app/screens/vault/fact-card.tsx:53-56` prints the correct answer on the card face. That makes the primary learning surface a **restudy** surface, which is the weaker option and feels like the stronger one — Roediger & Karpicke found repeated studying beat repeated testing at 5 minutes but lost at 2 days and 1 week, "even though repeated studying increased students' confidence in their ability to remember"; the follow-up put it at ~80% vs ~36% one week later.

**The Vault card becomes a prompt, not an answer sheet.** Face = question + four options + source label. Tap an option → immediate correct/wrong + explanation + source (the existing `Choices` component, `app/screens/vault/choices.tsx:44`). A secondary "just show me" affordance stays for the player who wants to reread; it is never the default, it sets `revealed`, and it **never advances a box**.

#### 3.3.2 Sections, in order

1. **Due today** — the landing section, capped at 12 cards. Ordered `boldWrong > 0` first, then `lastCorrect === false`, then oldest `due`.
2. **Shaky** — `seen > 0 && lastCorrect === false`, not yet due. Browsable, never badged, never nagging.
3. **Everything** — the full fact list.
4. **Runs & matches** — every expedition run, duel and Discovery session as a row that expands to its per-card outcomes, built from `attempts` grouped by `contextId`. This replaces the thin W/L/D list at `app/journal.tsx:429-470`.

#### 3.3.3 Grouping, filtering, sorting

- **Group by:** Topic (default) · Status (New / Shaky / Learning / Retired) · Where met (Duel · Expedition · Discovery) · Route (the nine expeditions).
- **Filters**, extending the four chips at `app/journal.tsx:46-51`: All · Saved · Sports · Science · **Wrong last time** · **Bold misses** · **Never revisited** · **Due**.
- **Sort — and this is a real bug fix.** `uniqueFacts` (`lib/journal.mjs:115-121`) orders by *first* encounter: `Map.set` on an existing key keeps the original insertion position, so the newest content sits in the oldest slot. Change to last-attempt descending, with due items pinned to the top.

#### 3.3.4 The list must not resolve through `journal.rounds`

`open`, `recall`, `save` and `report` all resolve through `profile.journal.rounds.find(...)`
(`lib/passport.mjs:245-268`) and return the profile unchanged when no round matches — while the new Vault
lists facts from `cards`/`facts`, which hold up to 300. A fact whose round has rolled out of the 200-round
window would render a Save button that dispatches, finds nothing, returns the same profile — and the UI
would still fire `juice.burst(el,'gem')` and float `+4 XP` for an action that did nothing.

**Fix:** the lookup becomes "find in `journal.rounds`, else synthesise the fact from
`journal.cards[factId]`", and `save` accepts either `question` or `factId`. `journal.saved` stays keyed on
the question string so `tests/progression.test.mjs` (`{ type:'save', question:'Question q001?' }`) is
untouched. **And no reward juice fires before the dispatch resolves** — the burst and the float move
inside the promise, gated on the returned revision having changed.

### 3.4 The schedule

**A five-step day ladder on `facts[id].box`: 1 · 3 · 7 · 16 · 35.**

- **Fixed ladder, not an SM-2 clone.** Karpicke & Bauernschmidt tested expanding, equal and contracting schedules: absolute spacing produced roughly a 200% improvement in long-term retention over massed retrieval, with **no reliable advantage for any particular relative schedule shape**. Build the simple thing.
- **Those numbers.** Cepeda et al. (>1,350 participants, delays to a year) found the optimal gap declines from ~20–40% of a 1-week retention target to ~5–10% of a 1-year target. 1/3/7/16/35 sits inside that envelope for a "remember this through the season" target (35 days ≈ 10% of a year).
- **Lapse:** a miss drops the fact **two boxes, not to zero**, sets `due = at + 1 day`, `lapses += 1`.
- **Retire:** box 5 **and** `days >= 3` (correct on three distinct local days). Retired facts resurface once at +90 days as an audit, then leave the queue permanently.
- **Daily cap 12.** Stated as product judgement: an uncapped queue in a game becomes homework.
- **Interleave topics** within a day's queue rather than blocking by topic. Also a judgement call.
- **No notifications.** Static build, no server (`vite.config.static.ts`). The queue surfaces as a count on the Vault tab and on the Home hero.
- **`revealed: true` records the attempt and changes neither `box` nor `due`.**

**Feedback is mandatory on every Vault attempt.** Rowland's meta-analysis: with feedback g = 0.73 [0.61, 0.86]; without, g = 0.39 [0.29, 0.49]. Butler & Roediger showed feedback both raised correct responses and reduced lure intrusions at one week. Every Vault attempt shows the explanation and the source, always.

**The terminal state is written, not discovered.** The bank is 54 facts; a committed player retires all of
them in roughly two months, at which point "Due today" is permanently empty, the Home hero queue count is
0 and §3.5's "You're ready to re-run" prompt is satisfied everywhere. That reads as broken unless it is
designed:

```
Nothing is due. All {n} facts you have met are retired from your review queue.
The next audit is {date}.

[ Open Runs & matches ]   [ Meet new facts in a duel ]
```

§3.4 states plainly that the queue is **finite by design against the current bank**.

### 3.5 The wrong-answer loop

**Out of a bad run.** `app/screens/expeditions/finish.tsx:186-220` already lists all six cards with the player's answer, the correct answer, the explanation and the source. Keep it exactly. Add one primary action directly beneath the recap:

> **Take your {n} misses to the Vault** → seeds a review deck of precisely those facts, `due = now`, navigates to the Vault, opens the session.

No XP for pressing it — that would be a farm. No shame copy. The true line belongs there: *a confident miss is the highest-value thing that happened in that run.*

**Through the Vault.** The seeded session is a normal review session: prompt → attempt → feedback → box update. Bold and Called misses first. The `revealed` flag blocks the obvious exploit.

**Back out to prove it.** When every fact in a seeded deck comes back correct, the session end offers **"Run *{route title}* again"** → the existing `onReplay` path (`finish.tsx:180-188` → `journey-start`).

**The reverse door, which does not exist today.** In the Vault, when ≥ 4 of a route's 6 facts sit at box ≥ 2, surface **"You're ready to re-run *{route title}*."** That is the Vault sending the player back to the betting mode, which is what makes the split a loop rather than a funnel. **It is safe to ship precisely because of R1:** the re-run cannot move the Conviction badge, so the Vault is never pushing the player into a farm.

**The caveat ships attached, in the UI, and it is now accurate about the options.** The route replays the same six questions **with the options reshuffled each run** (`lib/server/duel-service.mjs:377-388`), so `record.best` can rise with repetition whether or not anything was learned. On the compare row at `finish.tsx:154-176`:

> *Replays use the same six questions, with the options reshuffled each run. A higher score means you
> remember these cards — it is not a wider test of the topic, and it does not move your Conviction.*

Revision 1 wrote "the same six questions in the same order with the same options", which contradicts both `README.md:16` and the code.

### 3.6 Honest claim language for the Vault

**What the record supports — observations, never inferences:**

- "You answered this correctly on **3 separate days**, most recently **Tuesday**."
- "Missed in a duel on 2 Sep · reviewed 3 Sep · correct again 10 Sep."
- "**18 of the 31 facts you've missed** have since come back correct on a later day." — computed as
  `n = count(recoveredAt !== null)`, `m = count(firstMissAt !== null)`, **never from `attempts`**.

**What it does not support, and why:**

1. **It is recognition, not recall.** Every question is 4-option multiple choice. Rowland's moderator analysis puts initial recognition testing at g = 0.29 [0.10, 0.47] against cued recall's 0.61. A 4-option item has a 25% floor: with 6 attempts, 4 correct is not distinguishable from guessing. **Therefore: never render a per-fact percentage. Counts and dates only.**
2. **Same items, reshuffled options.** Repeat correctness can be memory for the card rather than knowledge of the fact.
3. **One device, and an editable one.** The same posture as `lib/analytics.mjs:35-40` (`SAMPLE_CAVEAT`).
4. **No transfer evidence.** The only transfer-ish evidence the app holds is "the same question, a week later," and it must say precisely that and nothing more.

**Shippable copy:**

- **Vault header:** **"Your history, on this device. Every fact you've answered, with your recent attempts on each."**
  Revision 1 promised "Every question you've answered, and when" while capping attempts per fact — a claim
  its own storage layer contradicts by design, on the one surface whose entire justification is honesty.
- **When a fact's attempt list has been trimmed, the fact says so:** *"Showing your last 12 attempts · {seen} total."* `facts[id].seen` carries the true count.
- The single claim tile: **"Came back later: {n} of the {m} facts you missed have since been answered correctly on a later day."** Micro-caption: *"Same question, options reshuffled — that's memory for this card, not a test of the topic."*
- Session end: **"4 of 5 came back. Next look: Tuesday."**
- Queue status: **"Retired from your review queue"** — the one place a strong word is legitimate, because it describes the queue, not the player.
- **Banned:** "mastered", "mastery score", "knowledge level", "you know X%", "learning gain", "proven".

### 3.7 The Vault pays — `review` as a first-class event

The product calls the Vault "where learning happens" and paid it nothing. That is fixed here, at a rate
deliberately below the expedition rate so it never becomes the new farm.

- `LOG_KINDS` gains `'review'`. `COUNTER_KEYS` gains `'reviews'`.
- `XP.reviewCorrect: 6`, `XP.review: 3`.
- **Paid only when the attempt was `due` and actually moved the schedule** — `e.due && e.advanced`. An
  off-queue re-attempt, or one with `revealed: true`, records fully in `attempts` and pays **0**. With the
  12-card daily cap the ceiling is **72 XP/day**, against 12 XP for a single first-encounter expedition
  card. The Recall Lab therefore cannot be farmed by re-answering one fact.
- New medium quest `review-5`, "Clear 5 cards from your review queue" (§1.7). Adding a template changes
  which quests a given `epoch:day` seed rolls; `tests/progression.test.mjs:584-612` asserts determinism,
  one-per-tier, and that some day differs from another — **it pins no template id**, so it passes.
- `visit` already credits the streak (`lib/progression.mjs:798`), so the streak was never at risk here.
  XP and quests were.

---

## 4. The brain hero

Replaces the inner icosahedron core of the hero orb. The middle yellow physics scene — accent, wire shell, orbit rings, satellites, particles, glow sprite — stays exactly as it is.

### 4.1 The measurement that decides the geometry

Camera is `fov: 38, position: [0, 0.15, 5.8]` (`hero-orb.tsx:465`), so visible height at z = 0 is `2·tan(19°)·5.8 = 3.994` world units. `useViewportScale(5.4, 0.62)` (`:408`) returns **1.0 on a phone** — the hero box is wide and short (≈358 × 196 CSS px), so the clamp never bites. `--fd-orb-h` is 196 px on a phone, 240/320/360 at the 600/900/1200 breakpoints (`home.css:6, 976, 1000, 1027`). dpr is capped `[1, 1.5]` (`scene-frame.tsx:111`).

The current core — `SphereGeometry(0.66, …)` (`:65`) — is therefore **1.32 world units → 64.8 CSS px → 97 device px on a phone**. That is the entire design constraint: the brain is never larger than a big app icon. Rendered at that size, fine gyri are sub-pixel and the brain reads **only** from silhouette (frontal pole, temporal-lobe notch, cerebellum bump) plus the midline fissure.

**Therefore the brain is presented larger than the core it replaces:** long half-extent **0.82 world units → 80 CSS px / 121 device px on a phone**, +24%. To keep separation and make the shell read as a cage, `IcosahedronGeometry(1.0, 1)` at `hero-orb.tsx:113` and `:119` becomes `1.12`.

### 4.2 Geometry: CPU-displaced indexed icosphere + baked cavity map

**Hand-rolled indexed icosphere** (midpoint-cache subdivision), level 4 → **5,120 tris / 2,562 verts**, displaced once on the CPU at mount by a scalar field:

```
r(x,y,z) = 1
  + |perlin(x·0.55s, y·1.3s, |z|·1.15s)|^0.50 · 0.105        // primary gyri
  + |perlin(x·1.15s, y·2.1s, |z|·1.9s)|^0.55 · 0.047         // secondary folds
  − 0.26 · exp(−(|z|/0.19)²) · smoothstep(−0.5, 0.05, y)     // interhemispheric fissure
  − 0.15 · exp(−(syl/0.15)²) · lateralMask                   // Sylvian fissure
  − 0.11 · exp(−((y+0.30)/0.085)²) · posteriorMask           // transverse fissure
  + cerebellum / brainstem / temporal-lobe Gaussians
  then anisotropic scale (1.18, 0.80, 0.90) + taper / flat base / crown
```

with `s = 7.0`. Three details are load-bearing:

- **Sample `|z|`, not `z`.** Bilateral mirror symmetry across the sagittal plane. This alone flips the read from "lumpy rock" to "anatomical", and costs nothing.
- **`|noise|^p` with small `p`, not ridged noise.** The zero-set of a 3D noise field is a family of closed curves — the topology of sulci. `pow(|n|, 0.5)` gives broad crowns and narrow grooves. Ridged noise (`1−|n|`) gives the inverse and looks like coral.
- **Compress the x sample (×0.55), expand y and z.** Folds elongate front-to-back like real gyri instead of reading as isotropic warts.

Frequency is not free: `s = 4.2` and `s = 5.4` give ~4–6 sulci and read as a walnut; `s = 7.0` gives ~10–12 bands, the legibility sweet spot at 121 device px; higher aliases into noise.

**The cavity map — the part that actually makes it work.** The project has no bloom, no shadows and no AO pass. The fissure *is* in the geometry (radius drops 1.14 → 0.85 across the midline) but with only diffuse + emissive a narrow deep groove is invisible, because nothing darkens it. So during the build, capture the displacement per vertex, percentile-stretch it (`p3..p80` — the fissure is an outlier and a naive min/max stretch puts 65% of vertices in the top decile and yields a flat blob), and bake it into a `color` attribute as `shade = 0.18 + 1.00·t`, with `vertexColors: true`. Grooves darken to 0.18, gyral crowns brighten to 1.14. Zero per-frame cost, no texture, no UVs, no AO pass.

**Also bake `aFlow`** — a 1-component `Float32Array`, normalised anterior-posterior position, 0 at the brainstem → 1 at the frontal pole. Same loop, used by the travelling pulse.

**Do not use `IcosahedronGeometry` + `BufferGeometryUtils.mergeVertices`.** three's `PolyhedronGeometry` emits non-indexed geometry, so `computeVertexNormals()` produces flat per-face normals and you must weld first; `mergeVertices` measures at **10.64 ms** of a 14.6 ms pipeline — 80% of the build. The hand-rolled indexed icosphere emits welded geometry directly: **L=4 full build (subdivide + displace + cavity + aFlow + normals) = 3.82 ms**, a 13× improvement, and it avoids pulling the 2.2 KB `BufferGeometryUtils` chunk into this route.

Level 3 (1,280 tris) is **not** enough — it loses the midline and reads as a bean. At 3.8 ms, splitting by device is not worth the branch: **always L = 4**, with `detail` kept as an escape hatch for `/three-lab`.

**Cache the geometry module-level** (`const CACHE = new Map<number, BufferGeometry>()`) and do **not** route it through `useDisposable` (`shared.tsx:23`) — one ~150 KB buffer for the app's lifetime beats rebuilding on every remount.

**Rejected alternatives:** two hemisphere meshes (doubles draw calls, creates a seam, and the scale pulse opens a visible gap between the halves); metaballs / marching cubes (a 48³ grid is 110,592 field samples plus an unwelded soup needing `mergeVertices`; 200–400 ms on a phone for a result indistinguishable at 121 px); instanced tubes for gyri (requires hand-authored gyral curves and 9–18k tris for the folds alone); shader-only vertex displacement (moves ~5k noise evals to every frame, needs 3 extra evals per vertex for finite-difference normals, and **cannot produce the baked cavity map**, losing the one feature that makes it legible).

### 4.3 Material and glow

One `MeshStandardMaterial`, one mesh, **no second rim shell** — the current `haloGeometry` BackSide trick (`hero-orb.tsx:66, 79-91`) is deleted, because it is a sphere and cannot hug a brain.

```ts
new THREE.MeshStandardMaterial({
  color: mixHex(accent, PALETTE.midnight, 0.55),
  metalness: 0.35,                         // down from 0.9 — wet tissue, not chrome
  roughness: 0.42,
  emissive: new THREE.Color(accent),
  emissiveIntensity: brightness * 0.30,    // down from CORE_EMISSIVE 0.42
  envMapIntensity: 1.1,
  vertexColors: true,                      // the cavity map
});
```

**Emissive must come down.** `three/src/renderers/shaders/ShaderChunk/color_fragment.glsl.js:4` is `diffuseColor *= vColor;` — vertex colours modulate **diffuse only**. `meshphysical.glsl.js:168` sets `vec3 totalEmissiveRadiance = emissive;` from a uniform, untouched by `vColor`. On a glowing brain the uniform emissive floods every sulcus flat and cancels the cavity map. At ≈0.42 with a strong fresnel wash the folds vanish entirely.

**Shader patch via `onBeforeCompile`**, two injections. `#include <emissivemap_fragment>` sits at `meshphysical.glsl.js:182`, *after* `<color_fragment>`, so `vColor` is in scope:

```glsl
// fragment — replace '#include <emissivemap_fragment>' with:
#include <emissivemap_fragment>
totalEmissiveRadiance *= vColor;                          // cavity modulates the glow too
float fres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
totalEmissiveRadiance += uRimColor * fres * uRim;         // fresnel rim, no extra mesh
float wave = 0.5 + 0.5 * sin(vFlow * 6.2831 * 1.8 - uTime * uRate);
totalEmissiveRadiance *= 1.0 + uWaveAmp * wave;           // travelling pulse
```

```glsl
// vertex — declare `attribute float aFlow; varying float vFlow;` in <common>,
// assign `vFlow = aFlow;` in <begin_vertex>.
```

Set `customProgramCacheKey = () => 'fd-brain-v1'`.

**Create the material with deps `[]`, not `[accent]`,** and mutate `.color` / `.emissive` in an effect — the pattern already used by `GlowSprite` (`shared.tsx:108-111`). Otherwise every Locker accent change re-creates the material and triggers a shader recompile hitch.

The glow now comes from three cheaper places: the modest emissive × cavity, the in-material fresnel rim, and the existing additive `GlowSprite` behind the subject (`shared.tsx:93-113`, mounted at `hero-orb.tsx:428-433`).

### 4.4 The pulse — mapping from landed conviction

**`heat` is 0..1 and is computed only from calls that have already *landed*.** It never reads the tier
currently selected on a card, never reads an unanswered card, never reads a room stake, and **never rises
because a call missed**.

```js
// lib/heat.mjs — pure, no three import, so the hero and the tests share one definition.
import { CONVICTION_WINDOW, convictionRating } from './progression.mjs';

/** How many of the last CONVICTION_WINDOW resolved expedition answers were above Steady AND correct. */
export function landedRecent(prog) {
  const recent = prog?.conviction?.recent ?? [];
  return { landed: recent.filter((c) => c === 'b1' || c === 'c1').length, window: CONVICTION_WINDOW };
}

export function convictionHeat(prog) {
  const { landed, window } = landedRecent(prog);
  const progress = Math.min(1, Math.max(0, (convictionRating(prog.conviction) - 1000) / 800));
  return Math.min(1, Math.max(0, 0.6 * (landed / window) + 0.4 * progress));
}
```

**Two things revision 1 got wrong here, both structural.**

1. **It read the window from the progression log, claiming "no schema change".** `LOG_LIMIT = 40` is a
   ring shared by all 17 `LOG_KINDS`, and expedition play is the densest producer of the *other* kinds:
   each card emits an `expedition-answer` plus `fact` plus `recall`, plus quest/level/achievement/streak
   lines. Measured: after one 6-card run the log holds 6 `expedition-answer` entries; after two runs it
   holds 11 and is already at the 40 cap; one 5-round Gauntlet drops it to 8. A 20-sample window is
   unreachable, and it collapses to 0 after a few duels — so the brain's speed would have depended on how
   recently you played a *different* mode, which no label can explain. `conviction.recent` (§1.6.1) is
   twenty whitelisted three-character codes in a block the sanitiser already visits.
2. **It counted calls *placed*, not calls *landed*.** A player who called Called twenty times and missed
   twenty times got `boldShare = 1.0`, `convictionProgress = 0`, `heat = 0.60` → **1.11 Hz**, hotter and
   redder, while a player who answered twenty Steady cards correctly got 0.64 Hz. The brain ran 73%
   faster for twenty consecutive losses at the highest-risk tier — stake-conditioned arousal keyed to
   losing, arriving through the back door of "resolved, therefore safe". *Resolved* is not *landed*.
   With the corrected term, twenty missed calls give `heat = 0`.

Damp with `THREE.MathUtils.damp(cur, target, 1.6, dt)` — the helper already used at `hero-orb.tsx:418-419` — so a landed call ramps the brain over ~0.6 s rather than snapping. Because `recent` moves as each card resolves, **the brain visibly speeds up during a run in which the player keeps calling and landing it.** That is the owner's request, delivered from calls that came off.

**`recent` counts repeat encounters too, and the text twin says so.** It is a recency display, not a
knowledge claim: "12 of your last 20 expedition calls landed above Steady" is true whether or not those
facts were new. The Conviction badge is the surface that makes the knowledge claim, and R1 protects it.

**Two channels, deliberately split so "feels fast" and "flashes" are decoupled.**

*Global brightness* — a JS uniform write per frame, exactly as the current core does at `:98`:

```
rate(heat)  = 0.27 + (1.50 − 0.27) · heat^0.75      Hz     // 0.75 front-loads the first landed call
depth       = 0.25                                          // CONSTANT — never rises with heat
scale(heat) = 0.012 + 0.014 · heat                          // ±1.2% resting → ±2.6% max
emissiveIntensity = brightness · 0.30 · (1 + depth · sin(2π · rate · t))
```

*Travelling wave* — `uWaveAmp: 0 → 0.16` across heat, `uRate = 2π · rate · 1.6`, running stem → frontal pole. **This is what carries the perceived speed at high heat**, which is why the amplitude never has to rise.

**Colour at heat:** `emissive = mixHex(accent, PALETTE.ember, 0.30 · heat)`, capped at 0.30 so it never reaches saturated red (WCAG has a separate red-flash rule).

**Why it is not a strobe — three independent margins.**
1. Max rate **1.50 Hz**, half the WCAG 2.3.1 general limit of three flashes per second.
2. Amplitude is ±25% of the brain's own emissive and **does not increase with heat**; the brain's luminance swing stays well under 10% of maximum relative luminance, i.e. below the definition of a general flash at all.
3. The travelling wave covers ≤ 25% of the brain at once; the brain is ~9,700 CSS px² on a phone and ~20,000 px² on desktop, an order of magnitude under the ~87,296 px² area threshold. (The *hero box* at the 1200 breakpoint is ~288,000 px², over the threshold — so the area exemption would not save a whole-box flash. It saves the wave, and nothing here flashes the box.)

**No free spin.** The brain's own rotation stays exactly what the current core does: nothing. The `rig` parallax at `hero-orb.tsx:412-419` is the only motion that moves it, and it is pointer-driven and already disabled under reduced motion.

### 4.5 Unlock threshold and staging

**N = 4 of 6 distinct modes played.** Breadth, not a grind counter — and derivable from counters that already exist, so the profile stays version 2 and `PROGRESSION_VERSION` stays 1:

```ts
const modesPlayed =
  (c.byMode.quick.played    > 0 ? 1 : 0) +   // Quick Draw
  (c.byMode.trilogy.played  > 0 ? 1 : 0) +   // Triple Threat
  (c.byMode.gauntlet.played > 0 ? 1 : 0) +   // The Gauntlet
  (c.expeditions            > 0 ? 1 : 0) +
  (c.discoveries            > 0 ? 1 : 0) +
  (c.eventModes             > 0 ? 1 : 0);
```

All six are already in `COUNTER_KEYS` / `byMode` (`lib/progression.mjs:485-504, 532`) and pass the existing sanitiser untouched. Four of six is reachable in one 10–15 minute session and teaches the whole app.

**Locked states:**
- **0–1 modes:** exactly today's scene. No brain geometry is built at all.
- **2–3 modes:** build the brain at L = 3 (2.1 ms) and render it *inside* the existing core sphere, which goes `transparent, opacity 0.55`. You see a folded shape swimming in the core — "it's forming". One extra draw call, only for players who are halfway.

**The chip carries its own sentence; nothing meaningful lives in a `title` attribute.** Revision 1 printed
`BRAIN 3/4` with a tooltip reading "You have played 3 of the 6 ways to play" — two different fractions of
two different things, with the only explanation in a `title`, which is invisible on every touch device
(the phone-first primary target) and not reachable by VoiceOver rotor navigation. Instead, beside the
existing hero badge (`hero-stage.tsx:35`, `.fd-hub-hero-badge` at `home.css:238`):

```
BRAIN 3/4        (chip, fd-mono)
Four of the six ways to play wakes it. You have played three.     (visible line, .fd-hub-hero-note)
```

**Ceremony on crossing to 4 — 2.6 s, once:**

| t | What |
|---|---|
| 0.0 – 0.5 s | Core emissive ramps ×2.5, scale +6%. An inhale. Fire the existing `unlock` cue. |
| 0.5 – 1.1 s | Core opacity 0.55 → 0 and scale 1.0 → 1.25 while the brain scales 0.55 → 1.0 from inside it. |
| 1.1 – 1.8 s | Wire shell snaps 1.12 → 1.02 → 1.12; the instanced nodes flash. |
| 1.8 – 2.6 s | First full pulse at resting rate; rim brightens; particles take one outward impulse. |

**Gating — no new achievement.** The ceremony is a presentation event, not an earned award, so it does not enter the exactly-once profile ledger. Gate it on `localStorage['fd.brain.awoke']` written on first play. If a player clears site data the ceremony may replay once; that is the documented trade for keeping `ACHIEVEMENTS.length === 30` and `tests/progression.test.mjs:757` intact.

### 4.6 Reduced motion

`SceneFrame` sets `frameloop='demand'` when reduced (`scene-frame.tsx:163`), so `useFrame` effectively never ticks and the player gets **one static frame**. That frame must be the **resting mean, not a peak**:

```
emissiveIntensity = brightness · 0.30      // no sine term
scale             = 1.0
uWaveAmp          = 0
rim               = on
GlowSprite        = on
```

Heat is still expressed, **statically**: base emissive scales `1.0 → 1.18` across heat 0→1 and the ember mix still applies, so a player whose calls are landing has a brain that is **brighter, never faster**.

**No ceremony under reduced motion.** The brain is simply present on the next mount and the badge reads `BRAIN AWAKE`.

**One gotcha:** under `frameloop='demand'` nothing repaints when heat changes. The component needs `const invalidate = useThree(s => s.invalidate)` and `useEffect(() => invalidate(), [heat, reduced, unlock])`.

The `if (reduced) return` guard at `hero-orb.tsx:96` is preserved verbatim in the new component, and the `pnpm e2e` reduced-motion assertion must cover the new geometry before it ships.

### 4.7 Honesty label and the visible text twin

A glowing brain that pulses faster is one bad label away from "your brain got bigger". It is **not** a knowledge signal — it is a landed-conviction indicator, and it must be readable as text on the same screen (rule 36), not only as an `aria-label`.

**Visible, under the hero badge, always present when the brain is awake:**

```
BRAIN AWAKE · 12 of your last 20 expedition calls landed above Steady
```

That line is the text twin: it names the number, its denominator and its scope, it is true under reduced
motion, and it is what the pulse is reporting. Revision 1 supplied only an `aria-label` and a bare
`BRAIN AWAKE` chip, so rule 36 was listed as an unedited acceptance criterion and never met.

**Accessible label**, replacing `hero-orb.tsx:456` / `hero-stage.tsx:30`, **state-appropriate**:

```
motion on:      Your brain core at level {level}. It pulses faster the more of your recent calls land
                above Steady. It shows how your calls have been landing, not how much you know.
reduced motion: Your brain core at level {level}. It brightens the more of your recent calls land above
                Steady. It shows how your calls have been landing, not how much you know.
```

Revision 1's label said "the more of your calls **land**" while the formula counted calls *placed* — the
label was the honest version of a dishonest number. §4.4 now makes the formula match the label; both say
"land", and both mean it.

Badge chip, locked: `BRAIN {n}/4` plus the visible sentence in §4.5. Badge chip, unlocked: `BRAIN AWAKE` plus the text twin above.

**Banned near the brain anywhere:** "your brain is growing", "brain power", "smarter", "IQ", any cognitive-improvement framing, any health claim.

### 4.8 Props

```ts
// components/three/brain-core.tsx  (NEW — replaces Core at hero-orb.tsx:63-108)
export interface BrainCoreProps {
  accent: string;                 // hex; PALETTE.volt default. The middle yellow stays.
  brightness: number;             // existing level-driven value, hero-orb.tsx:410 — unchanged
  reduced: boolean;               // from useSceneState()
  heat?: number;                  // 0..1 landed-conviction heat. Default 0.
  unlock?: number;                // 0..1; < 1 => ghost inside the old core. Default 0.
  ceremony?: boolean;             // play the 2.6 s wake sequence once. Default false.
  detail?: 3 | 4;                 // mesh level. Default 4.
}

// hero-orb.tsx — HeroOrbProps (:20-31) and HeroOrbSceneProps (:390) each gain:
  /** Distinct game modes played, 0..6. The brain wakes at 4. Default 0. */
  modesPlayed?: number;
  /** 0..1 landed-conviction heat. Decoration only — never a score, never a pending stake. */
  heat?: number;
```

`heat` arrives as a **number already computed by `lib/heat.mjs`**. The component takes no progression
object, no room, no confidence state: the stake and the selected tier are structurally unavailable to it,
which is how C10 is enforced rather than promised.

Everything existing (`level`, `accent`, `intensity`, `parallax`, `label`, `fallback`, `height`, `className`, `style`, `LazySceneProps`) is unchanged.

### 4.9 Performance budget

Measured on an x86 dev machine, node 22. Phone figures assume a mid Snapdragon 7-series / A13-class device at ~3–4× slower scalar JS.

| | Today | With brain |
|---|---|---|
| Core triangles | 2,976 core + 1,472 halo = **4,448** | **5,120** |
| Scene total at level 60, 5 rings | ~20,350 | ~21,020 (**+3.3%**) |
| Draw calls | core + halo | brain (**net −1**) |
| Geometry build | 0 | **3.82 ms** measured (L = 4); budget 10–15 ms on a mid phone |
| GPU buffers | ~78 KB | ~150 KB (**+72 KB**) |
| Per-frame CPU | 1 uniform write + 1 scale | 3 uniform writes + 1 scale |
| Route chunk | `hero-orb` 7,879 B raw | **+3,428 B minified / +1,717 B gzipped** for the geometry half, plus ~1.6 KB min for component/pulse/ceremony logic → new chunk ≈ **11.5 KB** |

Zero new npm dependencies. No network assets. No `BufferGeometryUtils` import.

**Where the build cost lands:** `SceneFrame` already overlays `SceneSkeleton` until the first drawn frame (`scene-frame.tsx:89-97, 178-182, 232`), so a one-shot 10–15 ms build at mount costs time-to-first-frame *behind an existing skeleton*, not a dropped frame in a running loop. With the module-level cache it is paid once per page load, not per remount.

**dpr cap unchanged** at `[1, 1.5]`. The added fragment work is ~1 multiply + 1 `pow` + 1 `sin` over ~22k device fragments on a phone — under 1% of a 16.7 ms budget.

**Offscreen pausing unchanged:** `frameloop='never'` when out of view or the tab is hidden (`scene-frame.tsx:162-163`). Gate the geometry build on `useSceneState().inView` if you want it airtight.

**The real hot spot is not the brain.** `Particles` (`hero-orb.tsx:375-386`) rewrites up to 260 Y-coordinates and sets `needsUpdate = true` every frame — a full `bufferSubData` of 3,120 B per frame — and the five orbit rings are `TorusGeometry(r, 0.016, 8, 128)` = **2,048 triangles each, 10,240 total**. If frame time on a mid phone is ever a problem, drop `tubularSegments` 128 → 64 **before** touching the brain.

---

## 5. Sound

### 5.1 The chosen path, and why

**Keep procedural synthesis. Rebuild the three interaction cues. Ship zero audio files.**

Sampled files would buy a better onset transient and cost: a Safari format twin (Opus is *partial* on Safari desktop 11–26.6 and full on iOS Safari only from 18.4+, so a phone-first game needs an AAC/`.m4a` sibling plus format negotiation), a new `__STATIC_BASE__`-aware runtime URL path in `vite.config.static.ts:26-56, 94` that does not exist today, first-gesture fetch+decode latency where `sound.unlock()` (`sound.ts:579-583`) is currently instantaneous, and a licence/provenance surface in `public/licenses/`. **And they would not fix the actual complaint** — a sampled click played bit-identically 200 times per session has exactly the identical-repetition signature that makes the current cues read as fake. Round-robin variation is the fix; it is free in synthesis and N× in bytes with samples.

This also keeps `README.md:141` and `design-bible.md:122` true: **there are no audio files anywhere.** The base64-embedded-transient hybrid is explicitly **out of scope for this release**.

### 5.2 Priority 0 — the wiring bug, which is what the owner is actually hearing

**There is no scroll sound in this product.** Call-site audit:

| Cue | Real call sites (excluding `sound.ts`) |
|---|---|
| `tap` | 9 helpers → **100 `onPointerDown` bindings across 36 files** |
| `select` | 5 |
| `tick` | 1 |
| `hover` | **0** — defined at `sound.ts:251-253`, trimmed at `:444`, never played |
| `whoosh` | **0** |

What the owner hears while scrolling is `tap`, because all six press helpers fire it unconditionally on `pointerdown`, and on a touch screen the `pointerdown` that *begins a scroll fling* lands on whatever card is under the finger. **Every scroll gesture clicks at you.** No resynthesis fixes that; it is a gating problem.

Fix the six helpers, not the 100 call sites:

- `app/screens/home/press.ts:10-16`
- `app/screens/vault/press.ts:12-18`
- `app/screens/play/press.tsx:19-25`
- `app/screens/events/press.ts:17-24`
- `app/screens/room/room-bits.tsx:26-32`
- `app/screens/expeditions/parts.tsx:17-22` (`useTap`)

```
pointerdown:   record { pointerId, x, y, t }; if pointerType === 'mouse' → play now
               (a mouse-down is never a scroll)
pointermove:   travel > 10 px → cancel
pointerup:     not cancelled && elapsed < 600 ms → play tap + haptic
pointercancel: cancel
```

Cost: 40–90 ms of *cue* latency on touch. The comments at `home/press.ts:4` and `room/room-bits.tsx:23-24` justify `pointerdown` as "never delays the click" — the **click** still fires from React's `onClick` and is not delayed; only the sound moves.

**This does not touch the live-duel timing contract.** `app/screens/room/question-stage.tsx` plays `correct`/`wrong` at `:125-128` *after* the reveal and contains no `tap` call at all.

Also drop `tap` from `info` toasts (`components/fx/toast-stack.tsx:38, 78`) — a toast the player did not trigger should not click at them.

### 5.3 Why the three cues sound synthetic — the DSP diagnosis

A transient audit of every builder:

```
tap         tone=1 noise=0   <-- NO transient layer
hover       tone=1 noise=0   <-- NO transient layer
select      tone=2 noise=0   <-- NO transient layer
correct     tone=1 noise=1
combo       tone=3 noise=1
win         tone=5 noise=1
levelUp     tone=4 noise=1
stamp       tone=2 noise=1
```

**The three cues the owner dislikes are exactly the three interaction cues with no noise layer.**

1. **No onset transient.** `sound.ts:248-257` calls `v.tone()` only. A real contact sound has a broadband onset spanning 2–3 octaves in the first 5 ms; an oscillator has none.
2. **Single-oscillator purity.** `tap` and `hover` are one `sine` each — a single spectral line, zero bandwidth. `select` is two sines.
3. **A pitch sweep at onset.** `tap` (`sound.ts:249`) is `freq: 1300, to: 720, glide: 0.03` — `1200·log₂(1300/720) = 1023 cents`, **a 10.2-semitone downward chirp in 30 ms**, begun by `exponentialRampToValueAtTime` (`:162`) *during* the 2 ms attack. Physical objects fix their pitch at onset and damp in *amplitude*.
4. **Bit-identical repetition.** `Voice.tone()` (`:148-192`) computes `f0` deterministically and `detune` is a constant — **no per-trigger randomisation anywhere in the tone path.** `Voice.noise()` *does* randomise its buffer offset (`:223-225`), which is exactly why the noise-bearing cues sound better. This is the dominant defect.
5. **No body, no space.** No cue has a resonant tail; there is no `ConvolverNode`, no delay, nothing.
6. **The limiter is a compressor and every tap rides its knee.** `buildChain()` sets `threshold −14, knee 12, ratio 4, attack 3 ms` (`:510-514`). `tap` peaks at `0.5 × TRIM 1.15 × volume 0.35 = 0.201` ≈ **−13.9 dBFS — exactly on the threshold, inside a 12 dB knee.**
7. **`select` is heard as two beeps, not one timbre.** Its two sines are 60 ms apart (`at: 0.06`), above the ~30 ms auditory fusion threshold.

### 5.4 Engine changes

**`sound.ts:130-229` (`Voice`)** — add `jit?: { cents?: number; ms?: number; vel?: number }` to `ToneParams`, applied at the `f0` computation (`:158`), the start time (`:150`) and `peak` (`:155`). Add `transient(p)`, a thin wrapper over `noise()` permitting sub-millisecond attacks. Add `send?: number` on both, routing a parallel tap to the space bus.

**`sound.ts:507-519` (`buildChain`)** — two changes:
- Add the space bus: `spaceSend: GainNode → ConvolverNode → spaceLevel: GainNode → master`.
- Make the compressor a **safety limiter**: `threshold −8, knee 6, ratio 6, attack 0.001, release 0.08`.

**`sound.ts:533`** — cache the IR buffer next to `this.noise`.

**Zero-byte impulse response:**

```
makeSpace(ac): 0.16 s, 2 channels generated independently (decorrelated → width)
  t   = i / sampleRate
  env = (1 - t/dur)^2.4
  gate = t < 0.025 ? (Math.random() < 0.12 ? 1 : 0) : 1    // sparse early reflections
  data[i] = (Math.random()*2-1) * env * gate
  then one-pole lowpass the whole buffer at ~5 kHz so the tail is dark
```

**Anti-repeat primitives:**

```
shuffleBag(items) → next(): cycles a shuffled copy, reshuffles on exhaustion, rejecting a
                    first element equal to the previous cycle's last
jitterCents(spread, last) → uniform(-spread, spread), redrawn once if
                            |value - last| < spread * 0.25
```

Use a **shuffle bag, not modulo** — modulo round-robin produces an audible 4-beat pattern.

**Make `CUE_THROTTLE_MS` per-cue** (`:84`, consumed at `:608`): `tap 45`, `hover/tick 60`, `select 90`, everything else keeps 40.

### 5.5 Per-cue parameters

**TAP** (`sound.ts:248-250`) — target 35–55 ms. A soft dry "tok".

| Layer | Spec |
|---|---|
| L1 transient (**new**) | Bandpass white noise, centre **2400–3600 Hz** randomised per trigger, Q 0.8–1.2; attack **0.3–0.8 ms**, hold 1–2 ms, release 6–14 ms; peak 0.10–0.16 |
| L2 body | **triangle**, not sine. f0 **640–760 Hz** from a 4-entry shuffle bag ±60 cents. **Delete the 1023-cent glide** — either none, or 1.04× down over 12 ms (≈68 cents). Attack 1.5–2.5 ms, decay to 0.35 over 18–26 ms, release 20–30 ms; lowpass 2600–3400 Hz Q 0.5; peak 0.14–0.20 |
| L3 resonance | Bandpass noise at f0 × **2.02–2.06** (deliberately *not* an exact octave), Q 6–10; attack 1 ms, dur 8 ms, release 40–70 ms; peak 0.03–0.05 |
| Space send | 0.06–0.10 |
| Variation | pitch ±50 cents with anti-repeat; velocity × `uniform(0.86, 1.06)`; L2 offset jitter 0–1.2 ms; L3 offset 1–3 ms |
| Loudness target | **−24 to −26 dBFS RMS** over the active window |

**SCROLL / HOVER TICK** (`sound.ts:251-253`) — **recommendation: ship no continuous scroll sound at all.** `hover` has zero call sites today. If a *detent* tick is wanted:

| Layer | Spec |
|---|---|
| Pure transient, **no body layer** | Highpass white noise, corner **4000–5200 Hz** ±8% per trigger, Q 0.7; attack 0.2–0.4 ms, dur 1.5–3 ms, release 8–16 ms; peak 0.035–0.055 → **−34 to −38 dBFS** |
| Space send | **0** — a tick with reverb sounds like a drip |
| Throttle | **55–70 ms** |
| Trigger | Discrete snap events only, never per scroll frame |

**SELECT** (`sound.ts:254-257`) — target 120–180 ms, reading as a mechanism engaging.

| Layer | Spec |
|---|---|
| L1 detent | Bandpass noise, centre 1800–2600 Hz, Q 1.0–1.4; attack 0.4 ms, dur 2–3 ms, release 12–20 ms; peak 0.12–0.18 |
| L2 note | **Two detuned partials** — triangle at f0 (peak 0.11) plus a second triangle at **+7 to +13 cents** (peak 0.08). f0 from a bag of {587.3, 622.3, 659.3} ±25 cents. Attack 2–3 ms, decay to 0.4 over 40–60 ms, release 90–130 ms. **Lowpass sweeping 3000 → 1800 Hz over 120 ms, Q 0.6** |
| L3 confirming partial | Sine at f0 × **2.98–3.02**; onset at **+18 to +26 ms** — inside the fusion threshold, which converts "two beeps" into "one timbre". Attack 1.5 ms, dur 20 ms, release 60–90 ms; peak 0.045–0.065 |
| Space send | 0.14–0.20. Throttle 90 ms |

**The conviction switch must not use `select`.** The Steady / Bold / Called buttons take a **neutral detent at identical pitch, identical gain and identical timbre for all three tiers**. If tapping Called sounds like a small win, the app is paying you to bet. Ship a dedicated `detent` cue with the tick parameters above and no per-tier variation of any kind.

**Retune `TRIM`** (`sound.ts:442-465`) for the new peaks — start at `tap 0.55`, `hover 0.35`, `select 0.70`, then re-measure with `sound.render()` (`:634-648`) driven from `/fx-lab` (`app/fx-lab/page.tsx:196-220`). **Default master volume stays `0.35`** (`lib/fx/prefs.ts:44`). Nothing gets louder.

### 5.6 New cue: `kept`

The loss celebration needs a cue that is neither `win` nor `loss`. Add to the `Cue` type (`:26-48`), `CUES` (`:54-79`), `BUILDERS` (`:247`) and `TRIM` (`:442`) at **`kept: 0.78`** — below `TRIM.win` (0.88), in the code block itself.

Revision 1 wrote `kept: 0.9`, which is **greater** than `TRIM.win = 0.88` and therefore violated its own §6.2 ceiling 3, then filed the correction as a TODO ("must be retuned below `win` before ship") inside a document whose §8 preamble says a build that violates any acceptance criterion does not ship. A ship-blocking TODO in a spec is a defect in the spec.

```ts
kept: (v) => {
  v.tone({ type: 'triangle', freq: A4,  a: 0.010, dur: 0.09, r: 0.13, peak: 0.26, lp: 1100 });
  v.tone({ type: 'triangle', freq: D5, at: 0.13, a: 0.010, dur: 0.12, r: 0.20, peak: 0.24, lp: 1100 });
  v.noise({ at: 0.13, a: 0.002, dur: 0.018, r: 0.05, peak: 0.10,
            filter: { type: 'bandpass', from: 2200, q: 1.4 } });
},
```

Two soft triangle taps a rising fourth apart, low-passed, with a paper tick — ascending but quiet, reading as *"noted"*, not *"won"*, not *"lost"*. **~0.33 s, deliberately less than half the `win` cue's 0.77 s.**

### 5.7 TRIM is not a loudness measurement, and the ceiling test must stop pretending it is

`sound.ts:245` says it plainly: *"Peaks are 'as composed'; the TRIM table below normalises loudness."*
`TRIM[cue]` multiplies gain at `:619`, so it is **inversely** related to the composed peak —
`hover: 1.6 // designed very soft (≈ -24 dB)` and `tick: 1.5 // designed subtle` are the loudest entries
in the table and two of the quietest cues in the app. An assertion that `TRIM.loss < TRIM.win` proves
nothing about output level: two cues at TRIM 0.7 and 0.88 can come out in either order depending on what
they were composed at. Today it happens to hold because `loss` peaks ≈0.30 and `win` ≈0.48 at the C6
chord — by luck, not by the test.

**The ceiling is measured on the output, once, and frozen.** `sound.render(cue)` already renders into an
`OfflineAudioContext`. Add `lib/fx/sound-levels.ts`:

```ts
/** True-peak and RMS of each cue as rendered at master gain 1, measured offline and frozen.
 *  Regenerate with `pnpm fx:levels` (scripts/measure-cues.mjs) whenever a builder changes. */
export const CUE_LEVEL = Object.freeze({ /* cue: { peak, rms } */ });
export const outputLevel = (cue: Cue) => CUE_LEVEL[cue].rms * TRIM[cue];
```

and assert `outputLevel('loss') < outputLevel('win')` and `outputLevel('kept') < outputLevel('win')` in
`tests/honesty.test.mjs` by parsing both frozen tables. That is a test of the thing the rule is about.

### 5.8 Constraint check

No test touches `lib/fx/sound.ts` today — `grep -rln "sound" tests/` returns nothing; §5.7 adds the first one, and it reads two frozen tables rather than running audio. Zero audio files added, so `vite.config.static.ts` and the offline build are untouched. Profile version 2 untouched. The live-duel timing contract is untouched. Reduced motion is unaffected; prefs gating at `sound.ts:600-609` still applies.

---

## 6. Win and loss celebrations

**The asymmetry is the message: a win interrupts you; a loss hands you something and gets out of the way.** The loss moment is never a modal — a full-screen overlay after a loss is the shape of a consolation prize, and consolation prizes patronise.

This is also the highest-risk request in the list, because "celebrate a loss" is the literal definition of a **loss disguised as a win**. Dixon et al. (2013) found celebratory sound on losses-disguised-as-wins drove win *overestimation* from 15% to 24%. The product currently does the right thing: `app/rivalry-widgets.tsx:160-164` fires confetti only on `v.key === 'win'`, and `lib/fx/sound.ts:453` trims `loss: 0.7` with the comment *"deliberately gentle"*.

**The line: encouragement names what actually happened and offers what was actually earned. Manipulation makes the loss feel like a win.**

### 6.1 Side by side

| | **WIN** | **LOSS** |
|---|---|---|
| **Tone** | Arrival. Bright, upward, short, loud. | Settling. A card placed on a table. Warm, quiet, unhurried. The vocabulary of *collecting*, not of comforting. |
| **Surface** | Medallion + confetti; at ceremonial tier, the existing `<Ceremony>` overlay. | **Inline block below the verdict.** Non-blocking, scrolled into view. No dialog, no `aria-modal`, no forced dismissal. |
| **Palette** | Gold / volt. | **Cyan — the learning temperature (design-bible §5). Never gold, never a medal.** |
| **Motion** | Confetti `from:'top'`, count 160 (`use-juice.ts:191-193`); medallion 0.8 → 1.06 → 1; 80 ms hit-stop; scoreline counts up. | **No confetti, no shake, no downward motion.** 2–4 fact chips slide **up** and stack into a card (`translateY(16px) → 0`, stagger 90 ms). One cyan ring pulse r = 70. Second beat at +400 ms. |
| **Sound** | `win` (0.77 s). | `loss`, then `kept` (0.33 s) on the second beat. |

### 6.2 Three ceilings, enforced by test

If any of these inverts, it is a loss disguised as a win:

1. `lossCeremonyMs <= winCeremonyMs`
2. `lossPeakParticles <= 0.25 * winPeakParticles`
3. **`outputLevel('loss') < outputLevel('win')` and `outputLevel('kept') < outputLevel('win')`**, measured
   on the rendered output per §5.7 — not on `TRIM` alone, which is an inverse gain and measures nothing.

All three hold with the values shipped in this spec; none is a TODO.

### 6.3 The verdict always lands first

`lib/duel-presentation.mjs:64-66` already produces `RIVAL WINS` plus the true score. **Nothing may render above it and no animation may begin before it is on screen and in the `aria-live` region.** The verdict title and subtitle are not softened. You do not soften the verdict; you give it a second beat that becomes the last word.

The margin stays true. `marginLine` (`app/screens/room/room-math.ts:126-161`) already reports the real per-round time gap and returns the plain line when there is none. **Never** "so close" on a 5–0.

### 6.4 Exact loss copy — duel, with every number templated

A new block below `marginLine` in `MatchFinish` (`app/rivalry-widgets.tsx:198`). `n = orderedRounds.length`, `k` = of those, how many facts were new to `passport.facts` before this match.

```
WHAT YOU KEEP

<title line — first TRUE case wins:>
1. all answers correct, lost on speed → "You were right every time. They were faster."
2. a topic accounts for the losses    → "Physics is where this went. 2 of 3 Physics rounds got away."
3. no correct answers                 → "{n} facts, then. That is the trade."
4. default                            → "{n} facts you have now answered at least once."

· {n} facts in your Vault{, k of them new}         <- the ", k of them new" clause is dropped when k === 0
· Fastest correct answer: {t} s, round {i}
· Day {d} streak held                              <- only when THIS match credited the streak
· +{xp} XP
· -10 rank points · still {tier}                   <- the true delta
· Arena Rank protected at the {tier} floor         <- ONLY when demotion protection actually fired

[ Open the {n} facts ]        [ Rematch ]
```

**Revision 1 hardcoded three of these and two were false in most modes.**
`lib/server/room-engine.mjs:1` is `MODE_ROUNDS = { quick: 1, trilogy: 3, gauntlet: 5 }`, and trilogy ends
early at 2–0 (`:320-321`). "Three new facts, then" is wrong after a Quick Draw (one round), wrong after a
Gauntlet (five), and wrong after a 0–2 trilogy (two). "Ten minutes ago" is invented — a Quick Draw duel is
one question, so the phrase is **deleted**. And "facts you did not have" is false on any repeat: the bank
is 54 questions and `lib/journal.mjs:75` journals a round whether or not the fact is already in the Vault,
which is why novelty is split into the `k` clause and dropped when `k === 0`.

**The two bullets that claimed a hold where a real loss occurred are gated on the hold actually happening.**

- *Rank.* `lib/progression.mjs:1032-1033` is `points = Math.max(rank.floor, rank.points + delta)` with
  `XP.rankLoss = -10`, and `floor` is the min of the **best** tier reached (0/100/250/500/900). A Gold
  player at 300 who loses goes to **290**: demotion protection never engaged, ten real points were lost,
  and the tier did not move — so revision 1's "Arena Rank held at the Gold floor" was false twice. The
  protection line now renders **only when `rank.points + delta < rank.floor`**; otherwise the screen
  prints the true delta.
- *Streak.* Credit is once per day on any activity (`:1105-1122`, gated on `streak.lastDay !== today`). On
  the second and every later match of a day the loss held nothing — it was secured hours earlier. The
  bullet renders **only when `before.streak.lastDay !== dayKey(at)`**.

**Every bullet and every title line renders only when true.** That rule now applies to the title lines,
which is where revision 1's false numbers lived.

### 6.5 Exact loss copy — expedition, and the ceremony that must not fire

A new block in `finish.tsx` above the recap (line 187), built from `runTally(run)`:

```
YOUR CALL vs THE CARDS

Steady   3 of 3 right      calibrated
Bold     1 of 1 right      +3
Called   0 of 2 right      -6

<if the lower tiers were right:>
"You were right about what you knew — and right about what you did not.
 The two Called cards are the two facts worth re-reading."
<else:>
"Your calls ran ahead of your knowledge this time.
 Four of the six are worth a second look."

[ Re-read those two ]        [ Back to expeditions ]
```

And at a negative run score, the §2.5 line:
`{score} points. Every one of these six is in your Vault, untimed, whenever you want it.`

**The stamp ceremony is gated on a non-negative score.** `finish.tsx:63-94` currently opens the
full-screen `<Ceremony>` unconditionally on the first completion of a route, with
`kicker: 'STAMP COLLECTED'` and `rewards: [{ label: 'Run score', value: signed(result.score) }, …]`. With
a −18 floor, a new player who calls Called on all six and misses all six would get a gold-family
`aria-modal` dialog announcing **"STAMP COLLECTED / Run score −18 / Completion XP +100"** — a win-shaped
ceremony minted by losing, inverting §6.2 ceilings 1 and 2 and landing squarely on C7 and C8.

- `result.score < 0`: **no `juice.ceremony` call at all.** The stamp renders inline in the cyan/learning
  family with the `kept` cue, and the calibration block above is the first beat.
- `result.score >= 0`: the ceremony fires as today, and the `Run score` reward chip is present.
- **The stamp itself is still unconditional** (§1.4). What is conditional is the celebration around it.

**Cooling after a bad run.** If a run finishes below zero, the primary button on `finish.tsx:166-185` becomes **"Re-read the cards you called wrong"**; `Replay for practice` stays, demoted to ghost. This is not paternalism: loss-chasing is re-entering *immediately after* a loss, and this replaces it with re-entering *after* the thing that actually makes the next run better.

### 6.6 Why this shape and not a consolation

Breines & Chen (2012, *PSPB*) ran four experiments: a self-compassion condition beat a **self-esteem** condition on incremental beliefs about a weakness, on motivation to make amends, and — Experiment 3 — participants **spent more time studying for a difficult test after an initial failure**. The condition that propped up esteem ("you're still great!") did *worse*. The attribution literature descending from Weiner is consistent that failure feedback pointing at **controllable and temporally unstable** causes sustains persistence, while feedback pointing at ability or luck does not.

Hence: **name one controllable thing, hand over one thing gained, never rate the person.**

**Banned from the loss moment:** "So close!", "Everyone has an off day", "Don't give up", "You'll get it next time", "unlucky", "the bot got lucky", "you're due", any mascot pity face, any downward animation, any red X placed on the player rather than on an answer, any countdown, any streak or shield urgency, any auto-rematch or auto-advance, and any Rematch button larger than the exit.

### 6.7 Keeping the win from becoming noise

`rivalry-widgets.tsx:160-164` fires `juice.confetti('win')` on **every** win, guarded only by room id. Ten matches a session is ten confetti storms → habituation → sound off. Four rules:

1. **Tier the win by what was at stake.** Add `winTier(room, player)` to `room-math.ts`:
   - *Routine* — bot, Quick Draw, no rank tier change, no combo ≥ 3: **no confetti.** Medallion pop + `win` cue at `gain: 0.7` + counter. ~700 ms.
   - *Notable* — human opponent, or Triple Threat / Gauntlet, or combo ≥ 3, or a personal best: current confetti + full `win` cue.
   - *Ceremonial* — rank promotion, level-up, achievement, first human win: the `<Ceremony>` overlay **only**. Never stack a ceremony on confetti. **A conviction promotion is not on this list** — see §6.8.
2. **Decay within a session.** Nth consecutive routine bot win: `gain = max(0.55, 1 − 0.12·(n−1))`, and after 3 identical celebrations the 4th is medallion + counter only.
3. **Never celebrate the same thing twice.** `finish.tsx:55-94` already implements the "wait for a free overlay, re-arm if replaced" pattern — reuse it verbatim.
4. **Vary the content, never the volume.** Unpredictability is served by *which true fact* the win screen surfaces, not by randomising intensity. Randomised intensity is a reinforcement schedule; randomised true content is a reason to read the screen.

### 6.8 The conviction badge promotion — inline, never a ceremony

A conviction promotion can only happen on an expedition card (R1 makes it impossible anywhere else), i.e. **mid-run**. A full-screen gold-family `<Ceremony>` opening on top of the run would steal focus from the heading `run.tsx:135-141` just focused, collide with the `scrollIntoView` fired 280 ms after an answer (`run.tsx:113-120`), and land a celebration immediately after a successful high-risk call, adjacent to the next stake choice. `arena.tsx:897` (`ceremonies: !!room || tab === 'journeys'`) already prevents the overlay from opening during the run — but it queues it, and it would then ambush the player on the next screen.

**So there is no conviction ceremony.** The reducer pays the gems (exactly-once is correct there); the presentation is:

- **On the finish scorecard**, inline, below the calibration block, in the cyan family, cue `unlock` at `gain: 0.8`:

```
CONVICTION · {tier label}
Calls above Steady: {landed} of {riskCalls} right, over {calls} distinct facts.
Earned at {bestAt} of 2000, on this device.
+{gems} gems
```

- **If the player never reaches a finish screen** (they paused after the promoting card), a single toast when `quiet.ceremonies` opens: `Conviction: {tier label}` / `{landed} of {riskCalls} calls above Steady`.
- **Never** with `0 of 0`: `CONVICTION_MIN_CALLS` makes that state unreachable, and the renderer still guards the zero denominator.

**Exit is always as prominent as replay.** On both win and loss, the primary-weight action set must include at least one action that leaves the loop (Done / Vault), matching the pattern already at `finish.tsx:167-186`.

---

## 7. Copy changes

### 7.1 "Play Lucky Guess" → the mode, not the bot

`MODE_NAMES.quick` is **already** `'Quick Draw'` (`lib/progression.mjs:11-15`). `Lucky Guess` is the bot's name. The defect is that the primary CTA labels itself with the opponent instead of the mode — and it does so even when the selected mode is Triple Threat or The Gauntlet.

**`app/screens/play/launch-panel.tsx:47`**

```diff
-          ? 'Play Lucky Guess'
+          ? `Play ${mode.name}`
```

So the button reads **Play Quick Draw** / **Play Triple Threat** / **Play The Gauntlet**, matching the mode actually selected. `mode.name` is already in scope (it is used at `:54`).

**`lib/duel-client-static.ts:58`**

```diff
-'Friend duels need a server to pass the room between two devices, so they are off in this offline
- demo build. Play Lucky Guess (bot), an expedition or an event instead.'
+'Friend duels need a server to pass the room between two devices, so they are off in this offline
+ demo build. Play Quick Draw against Lucky Guess (BOT), an expedition or an event instead.'
```

**Leave every other occurrence alone — they are all correct.** In each of these the bot name is doing the bot's job (naming the opponent), which is required by the honesty posture:

| File | Line | Text | Verdict |
|---|---|---|---|
| `app/screens/play/launch-panel.tsx` | 56 | `vs Lucky Guess (BOT)` | correct — opponent |
| `app/screens/home-screen.tsx` | 99 | `Quick Draw · one question vs Lucky Guess BOT` | correct — mode **and** opponent |
| `app/screens/events/event-card.tsx` | 114 | `Quick Draw · {topic} · vs Lucky Guess (BOT)` | correct |
| `app/screens/play/opponent-picker.tsx` | 74 | `Lucky Guess` | correct — it is the opponent picker |
| `app/screens/room-screen.tsx` | 102 | `Lucky Guess is ready. Its choices and response times are random.` | correct |
| `app/rivalry-widgets.tsx` | 345 | `Lucky Guess · BOT` | correct |
| `lib/server/room-engine.mjs` | 101 | `name: 'Lucky Guess · BOT'` | correct — the seat's name |

**Rule to carry forward:** a mode name names the format; the bot name names the seat. Never substitute one for the other. Wherever both are relevant, print both, with `BOT` attached to the bot.

### 7.2 Every other string that changes

| Site | From | To |
|---|---|---|
| `player-screen.tsx:71` | `Mastery` | **`Topic record`** |
| `player-screen.tsx:70` (eyebrow) | `WHERE YOU ARE STRONG` | **`WHAT YOU HAVE ANSWERED`** |
| `player-screen.tsx:73` (aside) | `Correct answers ÷ rounds played` | **`Duel rounds only`** |
| `player/mastery.tsx:50-52` | `…a duel or an expedition in any {domain} topic starts these bars.` | **`Nothing recorded yet — a duel round in any {domain} topic starts these bars. Expedition cards are recorded in your Vault and your Conviction, not here.`** (the current sentence is false; expeditions have never fed `byTopic`) |
| `expeditions/run.tsx:223` (legend) | `How sure are you?` | **`How well do you know this one?`** |
| `expeditions/run.tsx:31-34` | 2-entry `STAKE_COPY` | the 3-entry table in §2.5, ASCII minus, with `aria-label` payouts |
| `expeditions/run.tsx:194-200` | `RUN SCORE {signed(result.score)}` | **`CARDS RIGHT {correct} / {answered}`** plus `CALLS LANDED {landed} / {riskCalls}`; see §7.4 |
| `expeditions/run.tsx` (new, above the fieldset) | — | `Call it. Steady +2 / 0 · Bold +3 / −1 · Called +4 / −3.` / `Points in this run only. Nothing is spent and nothing can be bought.` |
| `expeditions/run.tsx:298` (feedback strong) | `That's the one.` / `A fact for the vault.` | per-tier lines, §7.3 |
| `expeditions/finish.tsx:161-164` | current note | the §2.5 replacement note |
| `expeditions/finish.tsx:154-176` (compare row) | — | add the §3.5 replay caveat, **and render best as `{correct}/6 · {signed(score)} pts`** so the correctness-first ordering (R3) is legible |
| `expeditions/finish.tsx:134-142` | `BOLD PICKS n/6` from `result.bold` | **`CALLS ABOVE STEADY n/6`, computed as `runTally(run).bold.n + runTally(run).called.n`** — `result.bold` is the bold-TIER count and would render `0 / 6` for a run of six Called cards (§1.5.3) |
| `app/journal.tsx` (Vault header) | — | **`Your history, on this device. Every fact you've answered, with your recent attempts on each.`** |
| `app/journal.tsx` (per fact, when trimmed) | — | **`Showing your last 12 attempts · {seen} total.`** |
| `app/journal.tsx:225` | `You remembered.` / `One to revisit.` | keep — both are true and neither praises the player |
| `hero-orb.tsx:456` / `hero-stage.tsx:30` | current orb label | the §4.7 brain label, **state-appropriate under reduced motion** |
| `hero-stage.tsx` (new visible line) | — | the §4.7 text twin |
| `README.md:16` | expedition paragraph | append the wallet sentence from §2.5 and the three-tier table |
| `README.md:133` | `It is not a mastery measure.` | append the Conviction definition and the first-encounter rule |
| `README.md` Verification | — | **the no-rollback window from §1.6** |
| `README.md:141` | "no audio files" | unchanged — §5 keeps it true |

### 7.3 Per-tier answer feedback (`run.tsx:298`)

| | Correct | Wrong |
|---|---|---|
| **Steady** | `That's the one. +2` | `A fact for the vault. 0 points - you called it Steady.` |
| **Bold** | `Called it. +3` | `Bold, and wrong. -1. The fact is yours now.` |
| **Called** | `You knew it. +4` | `Called, and wrong. -3. That is the price of the call - and this is the card most worth re-reading.` |

ASCII hyphen-minus throughout, because these strings land in a `role="status"` region and are read aloud.

The Called-and-wrong line is the most important string in the betting product: it prices the loss truthfully **and** points at the highest-value thing that just happened.

### 7.4 Pacing and default rules that are copy-adjacent

- **The conviction control is untimed** and stays changeable until the answer lands. No timer is ever added to that fieldset.
- **The default resets to `steady` on every card.** `run.tsx:103-107` already does `setConfidence('steady')` on `[index]`; **keep it exactly as it is.** Revision 1 changed it to carry the last tier forward, which is the remembered-stake pattern rule 5 forbids in its own words ("never remember 'your usual'") and C2 calls the single most harmful pattern on the list — and it was asymmetric, since revision 1 simultaneously forbade auto-de-escalation, so one Called card would have pre-selected the −3 tier as the neutral default on every subsequent card and into the next run, escapable only by a manual tap every card. Rule 5 stands unedited and unadjudicated.
- **No stake prompt between cards.** The control belongs to the card, not to a transition.
- **No nudge copy anywhere.** No "you're on a roll", no "go Bold", no suggested tier.
- **No live signed cumulative run total.** The run header shows `CARDS RIGHT {correct} / {answered}` and `CALLS LANDED {landed} / {riskCalls}`; the per-card feedback shows that card's `+4` / `−3`; the signed run total appears once, on the finish scorecard, where §6.5's calibration block gives it context.

  *Why.* The spec refuses cross-card bankrolls, parlays and "any mechanic where card 6 is worth more because of card 1" — and a live signed total manufactures exactly that pressure without a mechanic. Concretely: three Called cards missed leaves the player staring at `RUN SCORE −9` with three cards left, where all-Steady caps the run at −3 and the only route back to positive is Called on the remaining three. The deeper you are down, the higher the tier you must select to break even. At today's −1 worst case the hole is −3 and this is harmless; at −3 per card it is −15 after five cards and it is chasing, generated by a number the app is holding up in front of you. §7.4's "the default never moves on its own" protects against the app escalating; it does nothing about the player escalating.

---

## 8. Hard rules — acceptance criteria

The honesty reviewer's numbered list, **verbatim**. Every one is an acceptance criterion; a build that violates any of them does not ship. Adjudications where this spec extends a rule are listed separately in §8.6 and never edit the rule itself. **Every rule this spec touches now appears in §8.6 — revision 1 left rules 5, 15 and 36 unadjudicated while violating all three.**

### 8.1 Betting with simulated currency (rules 1–12)

1. **No expedition stake may use coins, gems, or any balance.** The expedition bet is points-at-risk within the run only — the existing `CONFIDENCE` table at `lib/expeditions.mjs:111-112`, possibly renamed and re-skinned. Introducing a persistent expedition wager would require inventing the global wallet the product says it does not have.
2. **Nothing may ever be spent to obtain, increase, refill or protect a stake.** No IAP, no ad-for-coins, no gems→coins conversion, no rewarded video, no "top up".
3. **Room stakes stay the fixed ladder `[0, 10, 25, 50, 100]`** (`lib/server/room-engine.mjs:29`). No new tier, no custom amount, no "all in".
4. **`0` stays the default and stays first.** `app/screens/types.ts:77` and `app/screens/play/match-settings.tsx:10`. The free option must keep the label `Free`.
5. **The stake selector never changes itself.** Never pre-select a higher stake after a loss, never remember "your usual", never suggest a stake. Default resets to `0` on every new room.
6. **No randomness may multiply a stake.** Wild Rounds are acceptable because they multiply *XP*, which is not at risk. Variable-ratio reward may **add** to what you earn, never **multiply what you risked**.
7. **Balance exhaustion must be a dead end, not a hook.** The existing `'Not enough demo coins.'` plus "start a new room". **No refill timer, no countdown, no "free coins in 2:00", no daily coin grant.**
8. **Losing may not be made cheaper or reversible.** No insurance, no "protect this bet", no undo, no double-or-nothing.
9. **Bet and reveal are never adjacent to a reward animation.** No renderer, ceremony, particle burst or escalating cue may run between the confidence choice and the answer reveal on the expedition run screen.
10. **The disclaimer travels with the mechanic.** Every surface where a stake is chosen or settled carries the simulated-money line. Expedition betting adds one more — it is not exempt because the points are not coins.
11. **Never use casino vocabulary.** Banned anywhere in UI copy, asset names, class names or analytics events: *wager, chips, pot, jackpot, odds, payout, house, spin, cash out, all in, double down, ante, streak bonus multiplier*. Use *call, confidence, at risk, points*.
12. **Age framing is a decision, not a default.** The store listing must not target a family or child audience, and no ad creative may depict the betting mechanic.

### 8.2 "Knowledge level" (rules 13–18)

13. **Never ship the phrase "Knowledge Level."** Also banned: *Knowledge Score, IQ, Mastery Level, Rating, Percentile, Top N%, Certified, Verified, Proven, Accuracy Rank*, and *Expert/Master* as an earned personal status.
14. **The honest new measure is calibration, not knowledge.** "How often your Bold calls landed" is a true statement about self-knowledge and claims nothing about what the player knows. Ship it under the name **Conviction**.
15. **Every numeric claim appears with its denominator and its scope**, in the same visual unit, never in a tooltip. A bare "Conviction 74%" is a false credential; "Bold calls landed: 14 of 19 · on this device" is a fact.
16. **Below 20 resolved Bold calls, show the raw fraction and no percentage at all.**
17. **It cannot decay and cannot fall on a schedule.** A number that drains while you are away is a return-pressure device, not a measure.
18. **Rename the existing "Mastery" section.** Rename to **"Topic record"**.

### 8.3 "Community badge" (rules 19–24)

19. **Truthful today (zero users):** only first-person, device-scoped facts, each carrying *on this device*.
20. **Truthful once ≥5 opted-in devices exist:** aggregate cohort rates on `/analytics` only, each with `n`, each suppressed below `COHORT.minBucket = 5`. **These never move onto the player profile.**
21. **Never computable, therefore never shippable:** "You beat X% of players", "Top 10% in Physics", global or weekly leaderboards, ranked ladders, head-to-head standings.
22. **Fabricated presence is banned outright:** player counts, "N online now", activity feeds, bot-seeded leaderboards, "your friends", invented rivals, "trending" anything.
23. **A badge name may not imply a peer group it cannot verify.** Refused: *Community Champion, Top Scholar, Elite, #1, Verified Expert, Founding Member*. Permitted: names describing your own act.
24. **If the owner wants a badge on the profile today, it is a completion badge**, minted by the device from the device's own record. Do not call it a community badge until there is a community.

### 8.4 Celebrating a loss (rules 25–31)

25. **The outcome is stated first, plainly, before any reward renders.**
26. **The loss ceremony must be a different family, not a dimmer win.** Different palette (cyan/learning, never gold), different particle behaviour, different cue, no confetti, no fanfare, no medal.
27. **Three measurable ceilings, enforced by test:** loss ceremony duration ≤ win duration; loss peak particle count ≤ 25% of win; loss cue level ≤ win cue level.
28. **Only genuinely-earned things may appear on a loss screen.** **Nothing may be minted for losing** — no consolation gems, no "participation" badge, no pity XP, no coin rebate.
29. **The margin stays true.** Never round a margin down to look closer, never say "so close" on a 5–0.
30. **The loss screen must never:** use "you" in a congratulatory sentence; imply the loss was luck; imply the next attempt is owed; count down; attach urgency to the streak or a shield; auto-rematch or auto-advance; make Rematch the largest or only action; or appear more often than the win screen.
31. **Exit is always as prominent as replay.**

### 8.5 Accessibility and consent (rules 32–38)

32. **Hard ceiling on the hero pulse: 3 Hz, design ceiling 1.5 Hz.** Any "pulses faster" coupling must be `clamp(rate, 0.27, 1.5)` Hz, with the ±25% emissive amplitude **not** increased alongside it.
33. **The pulse rate may track an earned state, never a pending stake.** Permitted inputs: player level, lifetime Bold calls landed, Vault size, cumulative run score. **Forbidden input: the stake currently selected, or the stake amount at risk.**
34. **The reduced-motion static path is not optional for the brain.**
35. **A brain is a health-adjacent symbol. It may not be used to make a claim.**
36. **Every visual state has a text twin.** The pulse rate must be readable as text on the same screen.
37. **"Better sound" must not mean "louder".** Default master volume stays `0.35`. No cue may get louder as a stake rises.
38. **Sampled audio changes the consent surface.** Keep procedural synthesis; nothing about consent, licensing or the static build changes.

### 8.6 Adjudications — where this spec extends a rule (the rules above are unedited)

| Rule | Extension | Why it is still satisfied |
|---|---|---|
| 1 | `CONFIDENCE` gains a third tier, `called: +4 / −3`. | The rule requires "no coins, gems, or any balance", and explicitly allows renaming and re-skinning. The stake is still run points only. |
| **5** | **None. Revision 1's carry-forward default is withdrawn; `run.tsx:103-107` keeps `setConfidence('steady')` on every card.** | A remembered tier is a remembered stake, which the rule forbids in its own words. Listed here because revision 1 violated it silently (§7.4). |
| 11 / 3 | Tier names are Steady / Bold / **Called**. | "Call" is on the rule's own permitted list. Room stakes are untouched. |
| 13 | The number shown is called **Conviction**. | Rule 14 names Conviction explicitly. The word "Rating" never appears in UI copy. |
| **15** | **The rating is printed only as `Conviction now: {rating} of 2000 — the average points your calls have scored, on this device.`, in the same visual unit as the fractions above it, never as a bare number beside the tier label.** | A bare four-digit number with a 1000 baseline and a six-rung ladder reads as Elo/MMR, which implies a cross-player scale that cannot exist with zero users and a cohort payload carrying no correctness data. Revision 1 printed exactly that and never adjudicated rule 15. |
| 16 | Percentages are suppressed below 20 resolved calls above Steady; the badge tier is suppressed below 30 distinct called cards **and** below 20 calls above Steady. | Stricter than the rule in both directions. |
| 17 | The badge label never demotes; the live rating does move down. | The rule forbids decay *on a schedule* — a number that drains while you are away. This one moves only when you place another call, and both the high-water label and the live number are shown together with one line explaining the difference (§2.5). |
| 24 | A **Conviction badge** ships alongside the existing route stamps. | Minted by the device from the device's own record, labelled "not a comparison against other players". The phrase "community badge" appears nowhere. |
| 27 | The new `kept` cue is added to the loss moment, and the ceiling is measured on rendered output rather than on `TRIM`. | `outputLevel('kept') < outputLevel('win')` with the frozen level table (§5.7); `kept` is ~0.33 s against `win`'s ~0.77 s; it is neither `win`, `levelUp` nor `unlock`. |
| 28 | Conviction badge tiers pay cumulative one-off gems. | Paid for crossing a threshold in your own call record, exactly like an achievement — never for losing, never on a loss screen, never inside a run's settlement. And §6.5 removes the one place revision 1 *did* mint a win-shaped celebration from a loss. |
| 32 / 33 | Heat drives rate 0.27 → 1.50 Hz. | Amplitude is held constant at ±25%. Heat reads only calls that **landed**; a missed call can never raise it, and `<BrainCore>` receives a pre-computed number, so the selected tier and every room stake are structurally unavailable to the component. |
| **36** | **The text twin is a visible line under the hero badge: `BRAIN AWAKE · 12 of your last 20 expedition calls landed above Steady`, plus a state-appropriate `aria-label`.** | Revision 1 supplied only an `aria-label` that named no number and described motion to users for whom §4.6 makes the scene static. Listed here because the rule was quoted as an unedited criterion and not met. |

### 8.7 Mechanics refused outright

| # | Mechanic | Why |
|---|---|---|
| C1 | "Win it back" / double-or-nothing after a loss | Textbook loss-chasing prompt. |
| C2 | Stake selector auto-raising, remembering or recommending a higher stake after a loss | The single most harmful pattern on the list. |
| C3 | Random multiplier on the stake | Variable-ratio reinforcement applied to the amount at risk. |
| C4 | Coin purchase, gem→coin conversion, rewarded ads, any IAP touching a stake | Puts expenditure into a betting loop. |
| C5 | Coin refill timer or daily coin grant on a zero balance | The core social-casino retention hook. |
| C6 | Expedition "bet" drawing on gems or any persistent balance | Requires inventing the global wallet the product says does not exist. |
| C7 | Confetti, fanfare, gold or a medal on a loss screen | Loss disguised as a win. **Includes the first-completion stamp ceremony at a negative run score (§6.5).** |
| C8 | Any reward minted *because* the player lost | Teaches that losing pays. |
| C9 | "You were so close" on a result that was not close; fabricated near-misses | Clark et al. (2009): near-misses were rated *less pleasant yet increased desire to play*, and the effect held **only when the player had chosen their own icon** — player agency is exactly what our bet supplies. |
| C10 | Hero pulse rate driven by the selected tier or any stake | Stake-conditioned arousal escalation dressed as a brain. |
| **C10b** | **Hero pulse rate driven by calls *placed* rather than calls *landed*** | A one-card-delayed proxy for stake size: it makes the brain run hotter for a player losing repeatedly at the top tier, which is C10 with a delay. |
| C11 | Pulse above 1.5 Hz, or amplitude raised alongside rate | WCAG 2.3.1 risk. |
| C12 | Any cue that gets louder or higher-pitched as the tier rises | Same conditioning mechanism in the audio channel. |
| C13 | "Knowledge Level", a percentile, or any accuracy figure without its denominator | False credential from a 54-item bank. |
| C14 | A level, rating or badge that decays or demotes on a schedule | Return-pressure device. |
| C15 | Leaderboards, ranks, percentiles, "you beat X%", any player comparison | Zero users; the cohort payload carries no correctness data. |
| C16 | Player counts, "N online", activity feeds, seeded rivals, "trending route" | Fabricated presence. |
| C17 | A badge named for a peer group | Claims a verified population that does not exist. |
| C18 | Any cohort figure shown on the profile as a personal badge | An aggregate about opt-in devices is not a statement about the viewer. |
| C19 | Auto-rematch, auto-advance, or a rematch button larger than the exit | Session-extension dark pattern. |
| C20 | Streak-loss or shield urgency attached to a loss result | Punishment framing at the worst moment. |
| C21 | Removing or de-emphasising the `Free` (0) stake | The zero-stake path stays the default. |
| C22 | Casino vocabulary in copy, asset names, CSS classes or analytics event names | Names migrate into store listings and decks. |
| C23 | Marketing or store creative depicting the betting mechanic | Google Play Families Policy. |
| C24 | A cross-card bankroll, parlay, streak multiplier or whole-route escrow | Couples card 6 to card 1 and destroys the proper-scoring-rule property the badge depends on. |
| C25 | A losing streak that locks the player out of calling | The death spiral. |
| C26 | Sunk-cost framing ("four cards in — don't waste them") | Pausing stays one tap and free. |
| C27 | A "Pass"/insurance mechanic that withdraws a call after seeing the question | Structurally close to casino insurance. |
| **C28** | **A live signed cumulative run total on the expedition run screen** | Manufactures the chasing pressure of a bankroll without a bankroll: the further down you are, the higher the tier you need to break even, and the app is holding the number up in front of you (§7.4). |
| **C29** | **Any quest, achievement or cosmetic that keys on the confidence tier *selected* rather than the outcome** | Pays the player to over-call, which is precisely the miscalibration the Conviction rating exists to detect — the quest system would corrupt the badge beside it, on a daily deadline (§1.7). |
| **C30** | **Any per-card reward that pays more for one tier than another** | The XP channel silently re-prices the bet and moves the crossovers the stake table advertises (§1.6.4, R2). |

---

## 9. File-by-file work plan

Six work streams. **Streams A–F touch disjoint files except where noted**, so they can be built in parallel by different people. The only cross-stream dependencies are that **A1 lands before A2**, and that **B depends on A2's selectors existing** (one shared edit to `lib/progression.mjs`).

### Stream A — expedition betting engine (blocks B; nothing else)

| # | File | Change |
|---|---|---|
| A0 | `lib/journal.mjs` | **Move `pad`, `DAY_RE`, `dayKey`, `dayDiff` here** from `lib/progression.mjs` (§1.5.6), so `lib/expeditions.mjs` can day-key a fold without an import cycle. `lib/progression.mjs` re-exports both functions verbatim. **Do this first; C1 also edits this file, so A0 and C1 must be sequenced or merged by hand.** |
| A1 | `lib/expeditions.mjs` | `CONFIDENCE` gains `called`; add `CONFIDENCE_ORDER`; add `runTally()`; rewrite `validResult` with the tally branch + legacy branch; extend the completion cross-check; **add `folded` and `foldedDay` to the `readExpeditions` object literal and to the `journey-next` completion literal**; `journey-start` sets `folded: false` explicitly; new `journey-fold` action with the one-per-route-per-day guard; `expeditionStatus` handles folded; **`best` and the baseline order by correctness first (R3)**. `runResult()`'s return shape is untouched. |
| A2 | `lib/progression.mjs` | `emptyProgression().conviction` (six counts + `counted` + `recent` + `best` + `bestAt`); the `readProgression` conviction block; `COUNTER_KEYS += 'reviews'` (**no `convictionCards`**); `XP` — delete `expeditionBoldCorrect`, add `expeditionRepeat`, `reviewCorrect`, `review`, and the **total** `convictionTierGems` map; `CONVICTION_TIERS` / `CONVICTION_CODES` / `CONVICTION_WINDOW` / `CONVICTION_MIN_CARDS` / `CONVICTION_MIN_CALLS` / `convictionRating` / `convictionTier` / `convictionIndex` / `convictionPoints` / `convictionCalls` / `convictionRiskCalls` / `convictionRiskLanded`; the reducer's `expedition-answer` branch (first-encounter ledger, `recent` ring, cumulative promotion bonus with `?? 0`) and `expedition-complete` branch (improvement-only replay score-XP); **`conviction` added to the achievement `draft` literal and to the reducer's return literal**; `LOG_KINDS += 'review'` and the `review` branch; `deriveEvents` — `factId` on `expedition-answer`, `stakes` + `previousBest` on `expedition-complete`, the new `review` kind; `progressionDiff` gains `convictionUp`; `bold-master` predicate + description; `bold-4` retargeted to accuracy; new `review-5` quest; `COSMETICS` + `unlockMet()` + `canEquip` + **the `reduceCosmetics` buy gate**. |
| A3 | `lib/passport.mjs` | `applyPractice` receives and forwards `confidence` and the chosen option text; the `journey-` branch passes `run.answers[index].confidence`; route `journey-fold` through `reduceExpeditions`; the new `review` action; **`readProfile` calls `readJournalValue(value.journal)` instead of `readJournal(JSON.stringify(...))`** (§3.2.6); `open`/`recall`/`save`/`report` fall back to `journal.cards` (§3.3.4). |
| A4 | `app/use-player.ts` | New `fold(routeId, runId)` and `review(...)` dispatchers beside the existing `journey-` calls. |

### Stream B — betting + conviction UI (depends on A2 only for the selectors)

| # | File | Change |
|---|---|---|
| B1 | `app/screens/expeditions/run.tsx` | Three-way `fieldset` with per-tier `aria-label` payouts in words (`:222-245`); `STAKE_COPY` with ASCII minus (`:31-34`); `aria-live="polite"` on the stake line; legend (`:223`); **keep `setConfidence('steady')` at `:103-107`**; per-tier feedback strings (`:298`); **flat per-card XP in the result-juice effect (`:85-101`) — no `XP.expeditionBoldCorrect`**; the §2.5 disclaimer above the control; the feedback line under the switch; **header replaced with `CARDS RIGHT` / `CALLS LANDED` (`:194-200`)**; `Fold this run` beside `Pause expedition` (`:377-393`), shown only from card 2 and only when today's fold is unused. |
| B2 | `app/screens/expeditions/finish.tsx` | `BOLD PICKS` tile → `CALLS ABOVE STEADY` **from `runTally(run)`**; the `YOUR CALL vs THE CARDS` calibration block; the §2.5 note replacement; the replay caveat and `{correct}/6 · {signed(score)}` on the compare row; `Take your {n} misses to the Vault`; below-zero cooling CTA swap; **the stamp ceremony gated on `result.score >= 0`**; the inline conviction promotion block (§6.8). |
| B3 | `app/screens/expeditions/parts.tsx` | Third switch state + icon (`Target`) and its styles; `signed()` unchanged (it already emits ASCII). |
| B4 | `app/screens/player-screen.tsx` | Fourth hero card (Conviction); section rename + eyebrow + aside. |
| B5 | `app/screens/player/conviction-card.tsx` | **New.** Badge label, `bestAt`, live rating with its scope sentence, raw fractions with zero-denominator guards, provisional state, the replay/first-encounter caveat, the Steady-only line. |
| B6 | `app/screens/player/mastery.tsx` | Fix the false empty-state sentence at `:50-52`. |
| B7 | `app/screens/expeditions/expeditions.css` | Three-state switch geometry (the current `[data-on]` thumb is two-position); 44 px targets at 320 px. |

### Stream C — Vault capture and IA (independent of A and B except A0)

| # | File | Change |
|---|---|---|
| C1 | `lib/journal.mjs` | `emptyJournal()` factory + frozen `EMPTY_JOURNAL`; `cards` / `facts` / `attempts`; `readJournalValue` split out of `readJournal`; sanitise and cap all three with the prepend ordering rule; `recordRoom` also takes `.choice` and emits a duel attempt; **fix `uniqueFacts` ordering** (`:115-121`). |
| C2 | `lib/journal-review.mjs` | **New.** The box ladder (1/3/7/16/35), lapse rule, retire rule, `dueToday(journal, at, cap)`, `seedDeck(factIds, at)`, and the shared `trimAttempts(list)` that both the writer and the sanitiser call (R4). Pure, no I/O. |
| C3 | `lib/passport.mjs` | (shared with A3 — land A3 first or merge by hand) the `review` action, attempt emission for expedition/discovery, `facts` updates including `firstMissAt` / `recoveredAt`. |
| C4 | `app/journal.tsx` | Recall Lab dispatches `review` instead of the write-nothing `onRecall`, passing session-local `revealed`; sections (Due / Shaky / Everything / Runs & matches); four new filter chips; the Runs timeline replacing `:429-470`; the Vault header copy; the per-fact trim disclosure; the terminal empty state (§3.4). |
| C5 | `app/screens/vault/fact-card.tsx` | **Card face becomes a prompt, not an answer sheet** — remove the always-visible correct answer at `:53-56`, add the `Choices` prompt, keep a secondary "just show me" that sets `revealed` and never advances a box. **No `opens` counter; the `open` dispatch is byte-identical.** Reward juice moves inside the dispatch promise (§3.3.4). |
| C6 | `app/use-player.ts` | (shared with A4) `review(...)` dispatcher. |

### Stream D — brain hero (fully independent)

| # | File | Change |
|---|---|---|
| D1 | `lib/heat.mjs` | **New, tiny.** `convictionHeat(progression)` and `landedRecent(progression)` — the §4.4 formulas, pure, no three import. Depends on A2 for `conviction.recent`; until A2 lands, `recent` reads as `[]` and heat is 0, so D can be built and tested against a stub. |
| D2 | `components/three/brain-core.tsx` | **New.** Icosphere subdivider, perlin, brain field, cavity + `aFlow` bake, module cache, material + `onBeforeCompile`, pulse `useFrame`, ceremony timeline, `invalidate` effect. |
| D3 | `components/three/hero-orb.tsx` | Delete `Core` (`:63-108`); wire shell `1.0` → `1.12` (`:113, :119`); add `modesPlayed` / `heat` to both prop interfaces; swap `<Core>` → `<BrainCore>` (`:434`); state-appropriate `label` (`:456`). |
| D4 | `app/screens/home/hero-stage.tsx` | Compute `modesPlayed` from `player.progression.counters` and `heat` from `lib/heat.mjs`; pass through; add the `BRAIN n/4` chip **and its visible sentence**; add the awake text twin; reduced-motion label variant. |
| D5 | `app/screens/home/home.css` | `.fd-hub-hero-chip` and `.fd-hub-hero-note` beside `.fd-hub-hero-badge` (`:238`). |
| D6 | `app/three-lab/page.tsx` | Heat / modes / detail sliders (`:128`). |

### Stream E — sound (fully independent)

| # | File | Change |
|---|---|---|
| E1 | `lib/fx/press-gate.ts` | **New.** The shared pointerdown → pointerup gate with the 10 px / 600 ms cancel. |
| E2 | the six press helpers | **Priority 0.** All six call `press-gate`. |
| E3 | `lib/fx/sound.ts` | `Voice` jitter + `transient()` + `send`; `buildChain` space bus + limiter retune; module-level IR cache; `shuffleBag` / `jitterCents`; rebuild `tap` / `hover` / `select`; new `detent` and `kept` (**TRIM 0.78**) cues; per-cue `CUE_THROTTLE_MS`; re-measured `TRIM`. |
| E4 | `lib/fx/sound-levels.ts` + `scripts/measure-cues.mjs` | **New.** The frozen offline-measured `CUE_LEVEL` table and `outputLevel()`, plus the `pnpm fx:levels` script that regenerates it (§5.7). |
| E5 | `components/fx/toast-stack.tsx` | Drop `tap` from `info` toasts (`:38, :78`). |
| E6 | `app/fx-lab/page.tsx` | RMS readout per cue (`:196-220`). |

### Stream F — celebrations (depends on E3 for `kept` and E4 for the ceiling test)

| # | File | Change |
|---|---|---|
| F1 | `app/screens/room/room-math.ts` | New `winTier(room, player)`; new `whatYouKeep(room, journal, progressionBefore)` returning the §6.4 title case and **only the bullets that are true**, including the two gated ones. |
| F2 | `app/rivalry-widgets.tsx` | Tiered win celebration replacing the unconditional `juice.confetti('win')` (`:160-164`); the `WHAT YOU KEEP` block below `marginLine` (`:198`). **Do not widen the `v.key !== 'win'` guard.** |
| F3 | `components/fx/use-juice.ts` | New `settle(target)` helper: the upward chip stack + one cyan ring pulse + `kept` + `light`/`tick` haptics. No confetti path. |
| F4 | `app/screens/room/room.css` · `app/screens/expeditions/expeditions.css` | `.fd-keep` block styles; the stagger keyframes. |
| F5 | `components/fx/ceremony.tsx` | No change. |

### Stream G — docs and release (do last, after A–F land)

| File | Change |
|---|---|
| `public/product/gamification/design-bible.md` | §9 gains rules 1–38 as bullets; §1 Posture gains "simulated stakes are points-or-room-coins only; no expenditure path exists or will be built". |
| `README.md` | `:16` wallet sentence + three-tier table; `:133` Conviction definition + first-encounter rule; the export-size line; **the no-rollback window (§1.6)**; `:141` unchanged and still true. |
| release checklist | Cache-busting deploy; no-rollback window recorded with the date and the first release tag that writes Called-tier results. |
| `public/product/pitch/*` | Regenerate with the Conviction definition and the honest-badge framing. |

### 9.1 Parallelism summary

```
A0 ──▶ A1 ──▶ A2 ──▶ A3 ──▶ A4 ──▶ B1..B7
 │                     └──────────▶ (B needs A2 selectors only)
 └──▶ C1 ──▶ C2 ──▶ C3 ──▶ C4/C5/C6      (A0 and C1 share lib/journal.mjs: sequence them)
                     ▲
                     └── A3 also edits lib/passport.mjs: land A3 before C3

D1 ──▶ D2 ──▶ D3 ──▶ D4/D5/D6            independent (D1 stubs `recent` until A2 lands)

E1 ──▶ E2                                 independent of everything
E3 ──▶ E4 ──▶ F3                          F needs `kept` and the level table
E3 ──▶ E5/E6

F1 ──▶ F2 ──▶ F4
```

**Four people can work simultaneously: A+B, C, D, E+F.** Three files are touched by more than one stream and are called out above: `lib/journal.mjs` (A0 + C1), `lib/passport.mjs` (A3 + C3) and `app/use-player.ts` (A4 + C6 — two independent dispatchers). Land the A-side edit first in each case.

---

## 10. Test plan

Baseline: **177/177 passing today** (`node --test tests/*.test.mjs` at `cc805e5`; the brief's 175 predates
the duel-clock commit, which this spec does not touch).

### 10.0 The four assertion lines that change, and why

Nothing else in the suite moves. Each of these encodes an economy or inventory constant that this spec
deliberately changes; none of them is a behaviour contract.

| Test | Line | From | To | Cause |
|---|---|---|---|---|
| `tests/progression.test.mjs` — "expeditions: per-card XP…" | `:508` | `assert.equal(logXp(…,'expedition-answer'), 18)` | `…, XP.expeditionCorrect)` → **12** | Tier-neutral per-card XP (R2, §1.6.4). |
| same | `:516` | `…, 18 + 12 + 3)` | `…, XP.expeditionCorrect * 2 + XP.expeditionWrong)` → **27** | Same. |
| same | `:545-553` | `… + XP.expeditionComplete + 18 * XP.expeditionScorePoint` | `… + XP.expeditionComplete + 5 * XP.expeditionScorePoint` | Replay score-XP is improvement-only; run-2 scores 18 against a previous best of 13 (§1.6.4). |
| `tests/progression.test.mjs` — "cosmetics…" | `:820-821` | `assert.equal(COSMETICS.length, 23)` ×2 | **29** ×2 | The catalogue grows by six (§1.8, D13). |

**Everything else in that test is unaffected** and was checked line by line: `:507` (log kinds after one
card), `:509` (`counters.recalls`), `:510` (`passportSummary` points), `:519-537` (the 13-point run-1 and
its completion award), `:539-540` (`stamps`, `expeditions`), `:554` (`bold-master`, which still fires —
run-2 is all-Bold so `stakes.steady.n === 0`), `:555` (`counters.facts === 6`, a passport ledger this
spec does not touch) and `:556` (the `readProfile` identity round trip).

### 10.1 Tests that must keep passing unchanged (verified by inspection)

| Test | Why it survives |
|---|---|
| `tests/expeditions.test.mjs:85` — the p = 0.5 indifference identity | Steady and Bold payouts are byte-identical. |
| `tests/expeditions.test.mjs:78, 84` — `assert.deepEqual(runResult(...), { score, correct, bold })` | `runResult`'s return shape is unchanged; tallies live in `runTally`. |
| `tests/expeditions.test.mjs:87-100` — all-Bold 6/6 = 18, all-Bold 0/6 = −6 | Unchanged payouts. |
| `tests/expeditions.test.mjs:108-109` — `'unknown'`, `'constructor'`, `'__proto__'` rejected | `Object.hasOwn(CONFIDENCE, …)` is untouched. |
| `tests/expeditions.test.mjs:133, 155` — `readProfile` identity round trips | `folded` / `foldedDay` are in the `readExpeditions` literal (§1.5.5); every new journal cap is enforced by the writer as well as the sanitiser (R4). |
| `tests/expeditions.test.mjs:135-155` — resume, mixed run scoring 9 | Unchanged payouts. |
| `tests/expeditions.test.mjs` replay test — `first` immutable, `best.score === 18` | Correctness-first ordering picks the 6/6 run (§1.5.8). |
| `tests/expeditions.test.mjs:199-203` — three corruption tuples rejected | Recompute-from-tally rejects all three. **`{score:1, correct:1, bold:0}` is arithmetically reachable under three tiers, so a bounds-only validator would not.** |
| `tests/expeditions.test.mjs:212-219` — corrupt `last.runId`, corrupt `best.correct` | The corrupted `best` fails `validResult` outright and falls back to a baseline with `correct: 6`. |
| `tests/progression.test.mjs:547` — profile identity after a full expedition | As above. |
| `tests/progression.test.mjs:565` — `assert.strictEqual(act(p, {type:'open', …}), p)` | **The `open` action is byte-identical. No `opens` counter is added** (§3.2.2). |
| `tests/progression.test.mjs:584-612` — daily quests deterministic, one per tier | The test pins tier composition and determinism, **not template ids**, so adding `review-5` and relabelling `bold-4` (same id, same tier) both pass. |
| `tests/progression.test.mjs:757` — `ACHIEVEMENTS.length === 30` | **No achievement is added anywhere in this spec.** |
| `tests/progression.test.mjs:800-812` — synthetic `expedition-complete` at score 18 reaches level ≥ 3 | `bold-master`'s `(e.correct ?? 6)` and `(e.stakes?.steady.n ?? 0)` fallbacks keep it firing on a fixture with neither field; `expeditionScorePoint` and the `e.first` branch are unchanged, so the 18 × 8 term is unchanged (§1.7). |
| `tests/journal.test.mjs:87` — `readJournal('{"version":2}')` → empty | `journal.version` stays 1; `readJournal(raw)`'s signature is unchanged by the `readJournalValue` split. |
| `tests/journal.test.mjs:89-101` — 200/100 caps | `rounds` and `matches` caps are unchanged. |
| `tests/passport.test.mjs:88`, `tests/events.test.mjs:501`, `tests/analytics.test.mjs:374` — identity | R4 plus the `readExpeditions` literal. |
| `tests/events.test.mjs:405` — `LOG_KINDS.includes('event')` | Adding `'review'` is additive. |
| all `tests/duel.test.mjs`, `tests/bot.test.mjs`, `tests/http.test.mjs` | No server, room-engine or timing change anywhere in this spec. |

### 10.2 New unit tests — `tests/expeditions.test.mjs`

1. **Called tier scores exactly.** 6 Called correct = 24; all wrong = −18; mixed matches the table.
2. **The 2/3 indifference invariant**, asserted the way `:85` asserts the 1/2 one.
3. **`runTally` counts per tier and never mutates the run.**
4. **`validResult` tally branch** — a result whose `stakes` disagree by one is rejected; a consistent one round-trips as identity. **A result with a malformed `stakes` deletes the whole route record, not just the field.**
5. **`validResult` legacy branch** — no `stakes`, score 18/correct 6/bold 6 survives; score 19 does not; `{score:1, correct:1, bold:0}` with no `stakes` is still rejected on the old algebra.
6. **Score-18-is-not-perfect** — a 5/6 run reaching exactly 18 produces a valid result and does **not** award `bold-master`. Also: a 6/6 run of 3 Steady + 3 Called scoring 18 does **not** award it, and a 6/6 run of 4 Called + 2 Steady scoring 20 does **not**.
7. **`record.best` is correctness-first** — a 5/6 at 20 does not displace a stored 6/6 at 18, in both `reduceExpeditions` and the `readExpeditions` baseline.
8. **Fold** — sets `folded`; `expeditionStatus` stops returning `'continue'`; a fresh `journey-start` is accepted **and the new record has `folded === false`**; answering two cards of that new run leaves `expeditionStatus === 'continue'` and a second `journey-start` returns the same reference; a fold on a completed run, a zero-answer run, a wrong `runId`, or a second fold on the same route the same day are all identity; `folded` and `foldedDay` survive `readProfile(JSON.parse(JSON.stringify(p)))`; a folded run produces no `expedition-complete`, no stamp and no `completions` increment.
9. **Abandon costs nothing** — resolved answers keep their journal entries and conviction tallies after the route is replaced.

### 10.3 New unit tests — `tests/progression.test.mjs`

10. **`convictionRating` ties where EV ties** — Steady vs Bold at p = 0.5 both give 1200; Bold vs Called at p = 2/3 both give 1333; an empty record gives exactly 1000.
11. **XP never prefers a tier (R2).** For the same `{ correct }` outcome, the `expedition-answer` XP of a Steady, a Bold and a Called card are **equal**. And: total XP EV crosses over at exactly p = 0.5 and p = 2/3, computed from the exported constants — the assertion that keeps §1.2's copy true.
12. **First-encounter ledger (R1).** Replaying a route six times moves `conviction` exactly once per fact; `convictionCalls` after five replays of one route is **6, not 30**; the repeat cards pay `XP.expeditionRepeat`; `conviction.counted` holds six ids and is deduped and capped.
13. **Replay score-XP is improvement-only** — a repeat completion at or below the previous best pays `XP.expeditionComplete` and nothing more; beating it pays the difference.
14. **`convictionTier` gates** — 29 distinct cards at rating 1800 returns `provisional`; 30 cards with 19 calls above Steady returns at most `hunch`; the 20th risk call promotes.
15. **The badge label never demotes, and `bestAt` is preserved** — after reaching `sharp` at 1510, a long run of missed Called cards drops the rating below 1300 while `best === 'sharp'` and `bestAt === 1510`.
16. **Tier gems are cumulative and paid exactly once** — a single promotion `provisional → deadeye` pays **160**; replaying the events pays nothing more; **`XP.convictionTierGems` is total over `CONVICTION_TIERS` and no wallet value is ever `NaN`** (assert `Number.isSafeInteger` on `gems` and `lifetimeGems` after a `hunch` promotion).
17. **`readProgression` sanitisation** — negative counts, `NaN`, `Infinity`, strings, `correct > n`, an unknown `best` id, an out-of-range `bestAt`, non-whitelisted `recent` codes, duplicate and malformed `counted` ids, and a missing `conviction` block all normalise; `readProgression` is **identity** on a valid profile.
18. **`conviction` survives the reduce** — a reduce that moves the tally returns a profile whose `conviction` is the moved one (the regression test for the `draft` / return-literal omission).
19. **`PROGRESSION_VERSION` is still 1 and the profile is still version 2** after a full write → serialise → `readProfile` cycle with conviction data present.
20. **No log entry ever has `xp < 0`** — assert over the whole log after a run of six missed Called cards.
21. **`progressionDiff().convictionUp`** is non-null exactly when `best` advanced, and carries `rating`.
22. **Cosmetic gating** — a priced `unlock.conviction` item cannot be **bought** below its tier (`reduceCosmetics` returns the same reference) and cannot be equipped; both succeed after promotion. `field-notes` is buyable at any tier.
23. **`review` pays only for due, schedule-moving attempts** — an off-queue re-attempt and a `revealed: true` attempt both record an attempt and pay 0; the daily ceiling is 12 × `XP.reviewCorrect`.

### 10.4 New unit tests — `tests/journal.test.mjs` and a new `tests/review.test.mjs`

24. **`emptyJournal()` is a factory** — mutating `readJournal(null).cards` does not affect a second `readJournal(null)`, and does not affect `emptyProfile()`. (Fails today against a shallow-spread singleton.)
25. **`readJournalValue` and `readJournal` agree** — for any object `v`, `readJournalValue(v)` deep-equals `readJournal(JSON.stringify(v))`.
26. **`readJournal` default-fills** `cards` / `facts` / `attempts` on an old journal and stays identity on a valid new one.
27. **Caps, writer and sanitiser together (R4)** — 15 attempts on one fact through the *writer* leave exactly 12; 700 attempts through the writer leave exactly 600; and in both cases `readProfile(JSON.parse(JSON.stringify(p)))` deep-equals `p`. The `facts` aggregates are **not** reduced by the eviction.
28. **Ordering is prepend, not sort** — 20 attempts all dispatched with `at: 1000` come back in dispatch order, newest first.
29. **Sanitisation** — `__proto__` / `constructor` / `prototype` fact ids dropped from `cards` and `facts`; an attempt with `surface: 'hack'`, `stake: 37`, `confidence: 'allin'` or a 900-character `chose` is dropped, not repaired.
30. **`chose` survives a reshuffle** — the same fact answered in two runs with different option orders records the two option *texts* the player actually picked; rendering never consults an index.
31. **`uniqueFacts` ordering** — the most recently attempted fact sorts first (this fails today).
32. **Box ladder** — correct advances 0→1→2→3→4→5 with `due` at +1/+3/+7/+16/+35 days computed on local midnights via `dayKey`; a miss drops exactly two boxes (never below 0), sets `due = at + 1 day` and increments `lapses`.
33. **`revealed` blocks advancement** — an attempt with `revealed: true` records but does not change `box` or `due`, and pays no XP.
34. **Retire** — box 5 with `days >= 3` sets `retiredAt` and removes it from `dueToday`; it reappears once at +90 days.
35. **Daily cap** — `dueToday` returns at most 12, `boldWrong` first, then `lastCorrect === false`, then oldest `due`.
36. **`days` counts distinct local days**, not attempts.
37. **`firstMissAt` / `recoveredAt` are write-once and day-ordered** — a fact missed and recovered on the same local day has `recoveredAt === null`; recovered the next day, it is set and never moves again. The claim tile's `n` and `m` are computed from these fields with **no attempt in the window**, and stay correct after the per-fact cap evicts the miss.
38. **Recall Lab now records** — dispatching `review` twice on the same fact produces two attempts and two `seen` increments (the current `onRecall` produces zero after the first).
39. **Vault actions resolve past the 200-round window** — a fact whose round has rolled out is still savable and openable via `journal.cards`.
40. **Round-trip size and read cost** — a saturated journal (300 cards, 300 facts, 600 attempts) serialises under 700 KB, and `readJournalValue` on it completes in under 4 ms on CI (§3.2.6's instrument, run as a soft budget with a logged number).

### 10.5 New unit tests — `tests/honesty.test.mjs` (new file)

**There is currently no test asserting any honesty string. This is the cheapest durable guard against drift.**

41. **Banned vocabulary** — a `grep`-equivalent over `app/**` and `lib/**` finds none of: `wager`, `jackpot`, `payout`, `cash out`, `all in`, `double down`, `ante`, `Knowledge Level`, `Knowledge Score`, `Mastery Level`, `Top 10%`, `Community Rank`, `Community Badge`, `Founding Member` (case-insensitive, excluding this spec file and `node_modules`).
42. **The word `Mastery` no longer appears as a section heading** in `app/screens/player-screen.tsx`.
43. **Cue output levels** — `outputLevel('loss') < outputLevel('win')` and `outputLevel('kept') < outputLevel('win')`, parsed from the frozen `CUE_LEVEL` and `TRIM` tables (§5.7). **Not** a bare `TRIM` comparison.
44. **`matchVerdict` loss output** contains no exclamation mark and none of `['great', 'amazing', 'so close', 'unlucky', 'nice try', "you're due"]` (case-insensitive).
45. **No stake outside `[0, 10, 25, 50, 100]` is constructible** through `room-engine`.
46. **The default stake is `0`** in `app/screens/types.ts` and `match-settings.tsx`.
47. **No `CONFIDENCE` tier costs or pays any currency field** — the tier objects have exactly the keys `{ name, correct, wrong, order }`.
48. **The conviction badge copy contains `on this device`** and does not contain `community`.
49. **No announced string contains U+2212.** Scan `STAKE_COPY`, the per-tier feedback strings and every `aria-label` literal in `app/screens/expeditions/**` for `−`; it is permitted only inside `aria-hidden` JSX text.
50. **No quest or achievement predicate references `confidence`** (C29) — a source scan of `QUEST_TEMPLATES` and `ACHIEVEMENTS` in `lib/progression.mjs`.

### 10.6 Browser invariants (`pnpm e2e`)

51. **The live-duel timing contract is untouched.** Re-run the existing assertions: question card mounts hidden until the double-rAF reveal marker; the timer track has no CSS transition; option order is fixed; **no renderer is mounted during a room**. Any regression here is a release blocker.
52. **Scroll does not click.** A 200 px scroll fling starting on a pressable card fires **zero** `tap` cues. A genuine tap fires exactly one.
53. **Tap latency.** The `onClick` navigation still fires within the existing budget; only the cue is deferred.
54. **Reduced motion, hero.** With `prefers-reduced-motion: reduce`, sample the canvas twice 1 s apart and assert identical pixels; assert `emissiveIntensity === brightness * 0.30` exactly.
55. **Reduced motion, label.** The hero `aria-label` says "brightens", not "pulses faster", and the visible text twin is present.
56. **Reduced motion, celebrations.** No confetti path runs; the loss block appears without motion.
57. **Pulse rate ceiling.** Drive `heat = 1` in `/three-lab` and assert the computed rate is `<= 1.5` Hz and the emissive depth is exactly `0.25`.
58. **Heat has no stake input, and no miss input.** Static check that `<BrainCore>` receives no prop derived from `room.config.stake` or the selected tier, plus a runtime assertion that (a) changing the selected tier mid-card does not change `heat`, and (b) resolving a **missed** Called card does not increase `heat`.
59. **Loss ceremony ceilings.** Loss ceremony duration ≤ win duration; loss peak particle count ≤ 25% of win.
60. **No ceremony at a negative expedition score.** Finish a first run at a negative score and assert no `role="dialog"` node appears.
61. **The verdict lands first.** On a loss, the `aria-live` region contains `RIVAL WINS` before any `WHAT YOU KEEP` node exists in the DOM.
62. **Loss bullets are true.** A Gold player at 300 points losing a bot duel shows `-10 rank points · still Gold` and **no** "protected at the floor" line; a second loss on the same day shows **no** streak-held bullet; a Quick Draw loss says "1 fact", never "Three".
63. **Exit prominence.** On both win and loss screens, at least one primary-weight action leaves the loop, and Rematch is never the largest control.
64. **Three-state switch at 320 px.** The Steady / Bold / Called control reflows without horizontal page scroll and every hit target is ≥ 44 px.
65. **The stake payout is in the accessible name.** Each tier button's computed accessible name contains the words "plus" and "minus" and the two numbers.
66. **No live signed run total.** The expedition run screen contains no signed cumulative score node (C28).
67. **Vault card is a prompt.** The correct answer is **not** in the DOM of a Vault fact card before an option is chosen.
68. **No juice before a dispatch resolves.** Saving a fact whose round has rolled out of the window either succeeds (and bursts) or is disabled — never bursts on a no-op.

### 10.7 Edge cases that must be covered explicitly

| # | Case | Expected |
|---|---|---|
| 69 | A run paused mid-card, browser closed, profile reloaded days later | `cursor` and `answers` restored exactly; no bet is "open"; resuming costs nothing |
| 70 | A profile written by the current shipped build (no `stakes`, no `conviction`, no `cards`/`facts`/`attempts`) | Loads clean, default-fills, `readProfile` identity on the result, no invented history |
| 71 | A profile written by **this** build read by the **previous** build | Called-tier results are deleted and persisted. This is the documented no-rollback window (§1.6); the test exists to prove the failure mode is understood, and the release checklist is the mitigation |
| 72 | A hand-edited profile with `conviction.best = 'deadeye'` but tallies supporting `hunch` | The whitelist keeps `deadeye` (high-water marks never fall), `bestAt` is repaired to the live rating, and the card renders both numbers with the explaining line |
| 73 | `conviction.steady.correct > conviction.steady.n` | Clamped to `n`, exactly as `byTopic` is |
| 74 | `conviction.called.n = Number.MAX_SAFE_INTEGER` | `nat()` caps it; the rating stays inside 0..2000; no `Infinity` or `NaN` escapes |
| 75 | `conviction.counted` at 1200 entries, a new fact arrives | Oldest id evicted; that fact then counts as fresh a second time. **Documented, and unreachable with a 54-fact bank** — revisit if the bank passes 1200 |
| 76 | Two tabs answering the same expedition card | The existing revision/epoch guard rejects the second; no double tally, no double gems |
| 77 | Fold, then immediately start a new run, then restore the old profile from an export | The folded run does not resurrect as `'continue'`; `foldedDay` still blocks a second fold that day |
| 78 | A route replayed 50 times | `completions` caps at 1,000,000; `best` never regresses; `conviction` never moves after the first run; `attempts` roll at 12 per fact while `facts.seen` keeps counting |
| 79 | Journal at exactly 600 attempts, one more arrives | Oldest is evicted by the writer; `facts` aggregates unchanged; identity holds |
| 80 | A fact whose `factId` disappears from the bank | `journal.cards[factId]` keeps the snapshot so the Vault still renders it; `dueToday` still returns it |
| 81 | All 54 facts retired | The terminal empty state renders with the audit date; no nag count on the hero |
| 82 | WebGL context lost during the brain ceremony | The existing static-art fallback takes over; no unhandled rejection; the `localStorage` flag is still written |
| 83 | Brain hero mounted offscreen at page load | Geometry build happens once behind the skeleton; `frameloop='never'` keeps the pulse paused; scrolling into view starts at the resting phase, not a peak |
| 84 | `heat` changes while `prefers-reduced-motion` is on | `invalidate()` repaints exactly one new static frame; no animation loop starts |
| 85 | Audio context suspended (iOS, before first gesture) | `sound.unlock()` still resolves instantly; the press gate does not leak listeners across unmounts |
| 86 | 100 rapid taps in 2 s | Per-cue throttle (`tap 45 ms`) holds; no compressor pumping; no listener leak; the shuffle bag never repeats the same variant twice in a row |
| 87 | A player who only ever plays Steady, 200 cards, 100% correct | Badge stays **Provisional**; the card renders `No calls above Steady yet.` without dividing by zero; the Steady-only line explains it; no `caller` / `called-it` cosmetic unlocks |
| 88 | A player at exactly 20 resolved calls above Steady | The percentage appears for the first time; at 19 it must not |
| 89 | A heartbeat transaction lands during a live duel question | `readProfile` on a saturated profile completes within budget (§3.2.6); the 50 ms timer tick shows no dropped frame in the e2e trace |
| 90 | Offline static build (`vite.config.static.ts`) | No new network request of any kind; no audio file; the brain chunk lazy-loads from the `/fact-duel/` base correctly |

### 10.8 The measurement harness

Two numbers in this spec are measured, not estimated, and both must be reproducible:

- **`scripts/bench-journal.mjs`** — builds a realistic journal at today's shape and at the revision-2
  caps, times `JSON.stringify` + `JSON.parse`, the existing validation and the new-collection
  sanitisation, and prints the §3.2.6 table. Run it before changing any cap.
- **`scripts/measure-cues.mjs`** (`pnpm fx:levels`) — renders every cue through an `OfflineAudioContext`
  and regenerates `lib/fx/sound-levels.ts`. Run it whenever a builder changes; test 43 reads its output.

---

## 11. Changes made after adversarial review

Four reviewers attacked revision 1 — an economy lens, an implementation adversary working against the
real reducers and the 175-test suite, a claims audit, and a hostile/discouraged-player lens. They
filed 15 blocker entries (11 distinct defects — the badge farm was found three times and the brain
heat twice), 29 serious entries (26 distinct) and 10 minor entries (8 distinct). **Every blocker and
every serious finding is fixed. All eight minor findings are fixed.** Eight places where this revision
deliberately departs from a reviewer's proposed remedy are set out in §11.4, each with the reason.

### 11.1 Blockers

| # | Finding | What changed |
|---|---|---|
| B1 | **The Conviction badge is farmable to Dead eye in ~3 minutes on one route.** Raised independently by the economy, claims and hostile-player lenses. Replay the same six cards five times calling everything Called from memory: 30 cards, rating exactly 1800. Revision 1's two stated guards were both satisfied by the exploit. | **R1, the first-encounter ledger** (§0.3, §1.6.6, §2.3). Only a fact's first expedition answer moves `conviction`; `progression.conviction.counted` is the ledger; the denominator is bounded by the 54-fact bank; `CONVICTION_MIN_CARDS = 30` now genuinely means thirty distinct facts. The §3.5 replay caveat is also carried onto the Conviction card verbatim, and §2.3 documents the residual "studied elsewhere first" path on the card itself rather than hiding it. |
| B2 | **Tiered per-card XP destroys the proper-scoring-rule claim.** With `bold 18` / `called 24` / `wrong 3`, the real XP crossovers are p = 0.3636 and p = 0.5333, not the 0.5 and 0.667 advertised in the stake table, `STAKE_COPY` and §2.2 — and `Math.max(0, score)` makes Called *strictly dominant* on a losing run, including a blind guess. | **R2.** `expeditionBoldCorrect` is deleted, `expeditionCalledCorrect` is never added, per-card XP is `expeditionCorrect 12` / `expeditionWrong 3` at every tier (§1.6.4), with an algebraic proof that no tiered table can preserve the crossovers without paying negative XP for a confident miss. Verified numerically: crossovers land at exactly 0.500 and 0.667. The clamp's remaining cost — tier *indifference*, never inversion, on a run that cannot finish positive — is stated rather than elided. New test 11 asserts both properties. |
| B3 | **`COSMETICS.length === 23` is asserted at `tests/progression.test.mjs:820-821`** and revision 1 added five cosmetics while claiming 175/175. | Adjudicated openly as **D13** and listed in §10.0: the catalogue grows to **29** and both assertions change. `ACHIEVEMENTS.length` stays 30 because no achievement is added. The spec now opens with a test-count honesty note rather than a false claim. |
| B4 | **The new `bold-master` predicate breaks `tests/progression.test.mjs:800-812`**, which feeds a synthetic `expedition-complete` with no `correct` field; XP drops 554 → 254 and `assert.ok(level >= 3)` fails. | Predicate is `e.score >= 18 && (e.correct ?? 6) === 6 && (e.stakes?.steady.n ?? 0) === 0` (§1.7). The fixture passes; real events always carry both fields; and the `stakes` term also fixes the separate finding that "nothing below Bold" fired on runs containing three Steady cards. |
| B5 | **An `opens` counter on the `open` action breaks `tests/progression.test.mjs:565`** (`assert.strictEqual(act(p, {type:'open'}), p)`) and turns a disclosure widget into an unbounded write per toggle. | `opens` and `lastOpenAt` are **removed from the design entirely**; the `open` action is byte-identical (§3.2.2). This also resolved the separate `revealed` finding — see S10. |
| B6 | **Fold was broken twice over.** `readExpeditions` builds a fresh literal and would have dropped `folded` on every load, breaking five identity assertions; and `journey-start` spreads `record`, so every run after the first fold was born folded, unresumable, and silently destructible. | §1.5.5 adds `folded` and `foldedDay` to the `readExpeditions` literal **and** to the `journey-next` completion literal (also a fresh literal, which revision 1 missed); §1.5.6 makes `journey-start` set `folded: false` explicitly; test 8 covers fold → start → answer → `'continue'` and the second-start identity. |
| B7 | **Fold is an unguarded repeater for everything an expedition card pays** — a ~4-second, one-card loop. | Two guards, both shipped: **R1** reduces a repeated card to `XP.expeditionRepeat` (4), and fold is capped at **one per route per local day** via `record.foldedDay`, with a minimum of one answered card (§1.4, §1.5.6). |
| B8 | **The storage argument measured disk, not the code path.** `readProfile` runs `readJournal(JSON.stringify(value.journal))` inside every readwrite transaction, on a 15 s heartbeat, potentially mid-duel against a 50 ms timer tick. | Measured, then fixed at the cause (§3.2.6): the sanitiser is split into `readJournalValue(object)` and `readJournal(raw)`, and `readProfile` calls the object form — deleting the 1.1–4.4 ms stringify+parse leg. Caps cut to 300 / 300 / 12-per-fact-600. **Measured result: a saturated revision-2 journal reads in 1.03 ms against today's 1.55 ms** — the profile gets faster, not slower. `readJournal(raw)`'s public signature is unchanged, so no test moves. A benchmark script ships as the instrument (§10.8). |
| B9 | **`attempts[].choice` is meaningless**: options are reshuffled per run (`room-engine.mjs:61`, `duel-service.mjs:377-388`), so an index against one stored snapshot would print an answer the player never picked — and §3.5/§3.6's "same options" copy contradicts `README.md:16` and the code. | The attempt stores **`chose`, the option text** (§3.2.1). The copy is corrected everywhere to "the same six questions, with the options reshuffled each run", which is the true and slightly stronger caveat. Test 30 covers it. |
| B10 | **The brain's label said "land", the formula counted calls *placed*.** Twenty missed Called cards gave 1.11 Hz; twenty correct Steady cards gave 0.64 Hz — the brain ran 73% faster for the player who bet big and lost twenty times. | `heat` is computed from **landed** calls only (§4.4): `recent` entries `b1` and `c1`. A missed call contributes nothing. The label is now true as written, C10b is added to the refusal list, and rules 32/33 are re-adjudicated in §8.6 on the corrected term. |
| B11 | **The Vault pays nothing.** The surface the spec calls "where learning happens" awarded 0 XP and 0 quest progress, while revision 1 paid 376 XP for re-tapping memorised expedition answers. | §3.7: `LOG_KINDS` gains `review`, `COUNTER_KEYS` gains `reviews`, `XP.reviewCorrect 6` / `XP.review 3`, paid **only** for a due attempt that moved the schedule (ceiling 72 XP/day against the 12-card cap), plus a `review-5` medium quest. The quest-seed tests pin tier composition, not ids, so they pass. |

### 11.2 Serious

| # | Finding | What changed |
|---|---|---|
| S1 | `record.best` orders by score alone, so a 5/6 run at 20 permanently outranks a 6/6 at 18 — **19 of 28 6/6 splits score below 20**. | **R3** (§1.5.8): `better()` orders by `correct` first, `score` as tiebreak, in both `reduceExpeditions` and the `readExpeditions` baseline; the finish screen renders `{correct}/6 · {signed(score)} pts` so the ordering is legible. Verified against both `best`-touching tests. |
| S2 | The tier-gem bonus was non-cumulative, so "160 lifetime" was unreachable and the reward was **inverted** — the fastest player got 75, a plodder got 160. | §1.6.6 pays cumulatively for every tier crossed in one promotion. Test 16 asserts a single `provisional → deadeye` promotion pays exactly 160. |
| S3 | §1.8's gem arithmetic was wrong (claimed ~250 tightening; the real figure was 360), and every new priced item was gated, so the over-supply persisted for exactly the cautious player it was meant to fix. | §1.8 is recomputed and itemised: new sink **640**, new supply **160**, net **480**, month-1 balance **+55 → −425**. One **ungated** 120-gem banner is added so the sink reaches the Steady-only player (−65 for them). |
| S4 | Memorised replay was the XP-optimal activity by 3–4× per minute. | Replay score-XP is **improvement-only** (§1.6.4), and R1 drops repeat cards to 4 XP. The same memorised replay goes from 376 XP to 64. One assertion line changes (§10.0). |
| S5 | `boldShare` from the 40-entry shared progression log is unreachable in practice — measured at 6 entries after one run, 0 after a few duels. "No schema change" was a cost, not a virtue. | `progression.conviction.recent` — twenty whitelisted codes in a block the sanitiser already visits (§1.6.1, §4.4). |
| S6 | `EMPTY_JOURNAL` is a shallow-spread module singleton; a keyed-map write would leak into every later profile, including the one `reset` mints. | `emptyJournal()` factory, frozen `EMPTY_JOURNAL` kept for the existing import, copy-on-write stated for `cards`/`facts` (§3.2). Test 24 covers it. |
| S7 | `XP.convictionTierGems[tier]` was `undefined` for `hunch` → `NaN` in the wallet → silent total gem wipe on the next `nat()`; and `conviction` was missing from the reducer's `draft` and return literals. | The map is **total over `CONVICTION_TIERS`**, every read is `?? 0`, and §1.6.6 shows both literals explicitly. Tests 16 and 18 cover both. |
| S8 | Caps enforced only in the sanitiser break the identity contract the moment a writer exceeds them. | **R4** (§3.2.4): the writer applies the identical caps in the identical order, prepending rather than sorting (because `at` ties are routine in the tests). Tests 27 and 28. |
| S9 | `revealed` was defined as a 60-second window against a record with no open timestamp — it could never be anything but `false`. | `revealed` is supplied by the review session's own state and passed in the action (§3.2.5). Simpler, stricter, no new write path, and it composes with B5. |
| S10 | "Nothing lost if you are not" is false on a screen whose badge the card demonstrably moves. | The Steady line, §1.2 and §2.2 are rewritten to the true version: *Steady never costs you run points; every card, at every tier, counts in your Conviction average.* |
| S11 | An all-Steady player reached **Edge** and unlocked a title called **Caller** and a banner called **Called it** with `0 of 0` calls; §6.8 congratulated them on "0 of 0 above Steady". | `CONVICTION_MIN_CALLS = 20` gates every tier above Hunch (§2.4); the zero-denominator string is guarded; the ceremony is replaced by an inline block that cannot render `0 of 0`. |
| S12 | The badge label and the live rating could assert two different tiers with nothing explaining it (`Dead eye · 1313`). | `conviction.bestAt` is stored at promotion; the card prints **both**, labelled, plus one explaining line (§2.5). Test 15. |
| S13 | Rule 15 was quoted as an unedited acceptance criterion and violated by a bare four-digit number that reads as Elo. | §2.5 prints the rating only with its scale, its meaning and its scope in the same visual unit; **rule 15 is now adjudicated in §8.6**. |
| S14 | Loss copy hardcoded "Three facts" and "ten minutes ago" — false in Quick Draw (1 round), Gauntlet (5) and a 0–2 trilogy (2). | §6.4 templates `n` from `orderedRounds.length`, deletes "ten minutes ago", and splits novelty into a `k` clause dropped when `k === 0`. The "renders only when true" rule now covers title lines, not just bullets. |
| S15 | Two loss bullets reported a hold where a real loss occurred: "Arena Rank held at the {tier} floor" fires when a Gold player at 300 drops to 290 without protection engaging; "Day n streak held" credits the loss for something secured hours earlier. | Both are gated on the hold actually happening (§6.4); otherwise the screen prints the true delta or omits the bullet. E2E test 62. |
| S16 | `kept: 0.9 > TRIM.win 0.88` violated the spec's own ceiling and was filed as a ship-blocking TODO; and `TRIM` is an inverse gain that measures nothing about output level. | `kept: 0.78` is in the code block (§5.6). §5.7 adds a frozen offline-measured `CUE_LEVEL` table and `outputLevel()`, and §6.2 ceiling 3 and test 43 assert on **rendered output**, not on `TRIM`. |
| S17 | The Vault's headline claim tile — "n of the m facts you missed have since been answered correctly on a later day" — was not computable from the fact record, and would have guessed high. | `firstMissAt` and `recoveredAt`, write-once and day-ordered (§3.2.2). The tile is computed from those fields and **never** from `attempts`, so §3.2.6's "the statistics stay complete" is true as written. Test 37. |
| S18 | §7.4's carry-forward stake default is the remembered-stake pattern rule 5 forbids and C2 calls the most harmful on the list — and it was asymmetric with the no-de-escalation rule. | Withdrawn. `run.tsx:103-107` keeps `setConfidence('steady')` on every card, and **rule 5 is adjudicated in §8.6** as "no extension". |
| S19 | A live signed cumulative run total manufactures chasing pressure without a mechanic: at −9 with three cards left, only Called can get you back. | The run header becomes `CARDS RIGHT` / `CALLS LANDED`; the signed total appears once, on the finish scorecard. Added to the refusal list as **C28** (§7.4). |
| S20 | The conviction ceremony fires mid-run, stealing focus from the run heading and landing a celebration immediately after a successful high-risk call. | There is **no conviction ceremony** (§6.8). The gems are paid in the reducer; the presentation is an inline block on the finish scorecard, or a single toast. |
| S21 | The stake control announces `aria-pressed` and nothing about the payout, so a screen-reader user places a −3 call with no disclosure; and U+2212 is commonly announced as nothing. | Per-tier `aria-label` with the payout in **words**, `aria-live="polite"` on the stake line, and **ASCII-only in every announced string** (§2.5, §7.3); U+2212 permitted only in `aria-hidden` text. Tests 49 and 65. |
| S22 | `bold-4` paid 80 XP + 15 gems on a daily deadline for *choosing a higher tier* — direct pressure to over-call, which is the miscalibration the rating exists to detect. | Retargeted to accuracy, tier-neutral, same id and tier so the seed sequence is unchanged (§1.7). **C29** is added: no quest, achievement or cosmetic may key on the tier selected. Test 50 scans for it. |
| S23 | The first-completion stamp ceremony fires unconditionally, so a −18 run gets a gold `aria-modal` dialog reading "STAMP COLLECTED / Run score −18". | The ceremony is gated on `result.score >= 0` (§6.5); below zero the stamp renders inline in cyan with the `kept` cue. The stamp itself stays unconditional. Added to **C7**. E2E test 60. |
| S24 | The Vault header promised "every question you've answered" under a per-fact attempt cap. | Header corrected to "Every fact you've answered, with your recent attempts on each", plus a per-fact "Showing your last 12 attempts · {seen} total" disclosure (§3.6). |
| S25 | `open`/`recall`/`save`/`report` resolve through the 200-round window while the new Vault lists up to 300 facts, so a Save would no-op while the UI fired reward juice. | The lookup falls back to `journal.cards`, `save` accepts a `factId`, and **reward juice moves inside the dispatch promise** (§3.3.4). Tests 39 and 68. |
| S26 | An accurate Steady-only player is permanently locked out of two tiers and 125 of the 160 gems, and the rating ranks a 70% caller above a 90% Steady player. | Made an explicit, stated design position rather than a silent ranking (§2.4): Conviction is a calibration-**under-risk** measure, Steady-only play stays Provisional, and the card says exactly that and exactly how to move it. Plus the ungated cosmetic from S3. |

### 11.3 Minor

| # | Finding | What changed |
|---|---|---|
| M1 | §1.5.4 and §1.5.7 gave opposite rules for a bad `stakes` ("dropped entirely" vs "invalid, not repaired"), and `tests/expeditions.test.mjs:206` only holds under one of them. | One rule, stated once, in both places: a present `stakes` that fails validation or contradicts the scalars **invalidates the whole result** (§1.5.4, §1.5.7). |
| M2 | `convictionCards` (a `COUNTER_KEYS` entry) and `convictionCalls(c)` were two independently sanitised denominators for the same quantity. | `convictionCards` is **not added**. There is one denominator, `convictionCalls(c)` (§1.6.1). |
| M3 | Pinning the profile version is forward-compatible and backward-destructive: an old bundle deletes every Called-tier result and persists the deletion. | Owned rather than asserted away (§1.6): a cache-busting deploy and a **documented no-rollback window**, in the README and the release checklist, with edge case 71 as the proof the failure mode is understood. |
| M4 | `CALLED ABOVE STEADY n/6` was to be rendered from `result.bold`, which is the bold-**tier** count — six Called cards would render `0 / 6`. | Computed from `runTally(run).bold.n + runTally(run).called.n` (§1.5.3, §7.2). |
| M5 | The brain chip read `BRAIN 3/4` with a tooltip saying "3 of the 6 ways to play" — two fractions of two things, with the explanation in a `title` that is invisible on touch. | The chip carries a **visible sentence**; nothing meaningful lives in a `title` on this product (§4.5). |
| M6 | Rule 36 ("every visual state has a text twin") was quoted as an unedited criterion and never met — only an `aria-label`, which also described motion to reduced-motion users. | A **visible** text twin under the hero badge, and a state-appropriate `aria-label` (§4.7). **Rule 36 is now adjudicated in §8.6.** |
| M7 | The terminal state — all 54 facts retired, "Due today" permanently empty — was never described. | Written and shipped with the feature, with the audit date and two onward actions; §3.4 states the queue is finite by design against the current bank. Edge case 81. |
| M8 | `bold-4`'s new label dropped "correctly" while the predicate kept `e.correct`. | Superseded by S22 — the quest is now honest about being an accuracy quest. |

### 11.4 Where this revision does not do what a reviewer suggested, and why

1. **The score-XP offset `(score + 18) * 4` is not adopted.** The reviewer proposed it alongside flat
   per-card XP to stop `Math.max(0, score)` flattening the downside. Flat per-card XP alone is
   sufficient: in the clamped region every tier pays *identically*, so the XP channel is indifferent, not
   inverted, and the tier still moves the run score, which is the proper scoring rule. The offset would
   additionally rewrite two score-XP assertions that this spec otherwise leaves alone, and it pays XP for
   a −18 run, which sits awkwardly beside rule 28. The residual indifference is documented in §1.6.4
   instead of being hidden.
2. **`cards` / `facts` / `attempts` stay in the profile blob rather than moving to separate IndexedDB
   object stores.** Separate stores mean a DB version bump, a second read path outside the single
   readwrite transaction that currently guarantees atomicity, and `deriveEvents` losing its
   before/after view of the data it must diff — a large change to the purity and identity contracts the
   whole profile layer rests on. Deleting the JSON round trip achieves more, measured: **1.03 ms against
   today's 1.55 ms** on a saturated journal. If a future bank makes that budget fail, the caps are the
   knob and §10.8's benchmark is the instrument; separate stores remain the escape hatch.
3. **The attempt stores `chose` (option text), not `order: [int,int,int,int]`.** The client never sees the
   canonical bank order — `duel-service.mjs` and `room-engine.mjs` shuffle server-side and hand the
   client only the permuted `options` array — so the client cannot compute `order` relative to anything
   stable. Storing the text is self-contained, survives a bank edit, and is the only version of this fix
   the client can actually produce.
4. **The conviction ledger is `conviction.counted`, not `!before.passport.facts[factId]`.**
   `passport.facts` is written by duels and Discovery as well, so gating on it would mean a fact first met
   in a duel could **never** contribute to Conviction — which would make the badge a measure of which
   mode you happened to meet a fact in. A dedicated expedition-only ledger is one bounded, sanitised
   array and says exactly what it means.
5. **`boldShare` is derived from `conviction.recent`, not from `journal.attempts`.** The attempt stream
   would work, but it would make the Home hero depend on scanning up to 600 attempts on every render and
   would couple Stream D to Stream C, destroying the parallelism §9 is built on. Twenty three-character
   codes in a block the sanitiser already visits costs ~80 bytes.
6. **`bold-4` is retargeted to accuracy rather than having `e.correct` dropped.** The reviewer offered
   dropping `e.correct` as the alternative; that would make it farmable in four taps a day *and* would
   pay for tier selection, which C29 now forbids outright.
7. **The Conviction rating number stays on the profile card** rather than being removed, as one reviewer
   preferred. Removing it would leave the badge tier as an unexplained six-rung ladder with no way for a
   player to see where they sit inside a band or why the tier is what it is. Rule 15 is satisfied by
   printing it with its scale, its meaning and its scope in the same visual unit — which is what the rule
   actually asks for — and §8.6 now carries that adjudication explicitly.
8. **The one finding not adopted.** The hostile-player lens argued that a `boldWrong`-first review queue
   plus the "You're ready to re-run" prompt pushes the player back into a farm. With R1 in place the
   re-run cannot move the Conviction badge, pays 4 XP per card and pays completion XP only on
   improvement, so the loop is a genuine study loop with nothing left to farm. §3.5 states that
   dependency explicitly, so the prompt must not ship before R1.
