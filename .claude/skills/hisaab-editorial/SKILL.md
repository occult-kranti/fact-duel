---
name: hisaab-editorial
description: Editorial and legal working card for HISAAB DO (the politics & public-money edition) — how to research, write, source, status-date and validate bank questions about schemes, spending, scams, media ownership and elections without defaming anyone. Load before adding, editing, fact-checking or refreshing any item in editions/hisaab/bank/.
---

# HISAAB DO editorial card

Source of truth: `docs/hisaab/CHARTER.md` (§2 gates, §3 schema, §4 lanes, §5 vocabularies).
Contract as code: `editions/hisaab/bank/schema.mjs`. Validator: `node scripts/hisaab-validate.mjs [file…]`.

## The five rules that keep us out of court
1. **Evidence, not memory.** Every item's `sourceUrl` is a deep link to a page that states the
   answer. Memory proposes; a fetched page decides. Can't fetch it → drop it.
2. **Status, dated.** Anything about wrongdoing carries `status` in legal words — alleged by /
   FIR / arrested / chargesheeted / on bail / acquitted / convicted / closed / petition dismissed —
   plus `asOf: 'YYYY-MM'`. Search for the newest news before writing it.
3. **No implied guilt.** Stems say "was named in", "was arrested by", "the CAG flagged", "X
   alleged". Never "looted", "the corrupt…", "scamster".
4. **Their answer is part of the fact.** Denials, clearances, acquittals and official
   clarifications go in the explanation, one clause.
5. **Distractors never smear.** When the answer is an accused person, the other three options are
   roles, parties, agencies, states, years or amounts — never other real people.

## Balance
- Record `govt` (who governed that level then) on every item; the Centre since 2014 is NDA.
- State lanes cover whoever governed. Forward Court debunks claims from every side (≥ 40% each way).
- Satire targets labels and blind devotion, never a religion, caste, region or community.
  No communal claims, no group slurs, no private individuals.

## Writing a good item
- One concrete hook: a rupee figure, a count, a date, an audit finding, a court holding.
- Stem ≤ 220 chars; options ≤ 90 chars, same format and magnitude; answer text never in the stem.
- Rotate `correctIndex`; keep each difficulty ≥ 25% of a lane (simple = headline, expert =
  followed the news, extreme = numbers/dates).
- Explanation ≤ 420 chars: the fact → the status as of `asOf` → the counterpoint.
- Prefer primary sources (court, CAG, sansad.in, PIB, ECI, RBI, indiabudget.gov.in, PRS, SEBI) →
  established outlets → Wikipedia only as a second source.

## Refreshing
- Monthly: re-verify every `status` with `asOf` older than 6 months; bump `asOf` only after
  re-reading a new source. An acquittal or a closure changes the item; it never disappears silently —
  note the change in the lane's `docs/hisaab/research/<lane>-notes.md`.
- Corrections from players go to the Sources & Corrections page flow; fix within the next release.

## Done means
`node scripts/hisaab-validate.mjs` prints OK, `node --test tests/hisaab-*.test.mjs` passes, and the
lane notes list sources used, items dropped and statuses at risk of going stale.
