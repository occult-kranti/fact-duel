# LEDGER — The Politics & Money Desk

*Who follows the news best?*

A self-contained static web game: fact duels on the documented Indian record —
politics 2000–2026 (audits, courts, elections, ministries, parties, schemes) and
money literacy (markets, budgets, investment awareness). **Every answer shows its
source** with a verify link. Vanilla JS, hash-routed, no build step, no external
images; only Google Fonts on a CDN. Runs from `file://`.

Sibling of SABHA: same fact-duel engine architecture, entirely different design
("The Daily Desk" — newsprint, ink, editorial red, market-terminal) and new
economy/league/clippings systems.

## Run

```
cd ledger
python3 -m http.server 8000   # then open http://localhost:8000/
```

…or simply double-click `index.html` — everything works from `file://`.

## Modes

- **Duels** — *Front Page* (1 question, 10s), *Above the Fold* (first to 2, 7s),
  *The Long Read* (5 rounds, 5s). Correctness first; if both are correct the
  faster answer wins unless within 150 ms (draw). Speed bonus ≤10% of the round
  value. Opponents: **The Wire Bot** (25% correct, human-like delay 1s–timer−0.5s;
  1.5–4s relaxed) and **Across the Desk** pass-and-play with a shield
  interstitial and no timer. **Relaxed Mode** (persisted) removes countdowns and
  ignores speed entirely.
- **Beats** — Polity / Money / Schemes desks, six untimed questions each with a
  confidence ladder (Steady +2/0 · Bold +3/−1 · Called +4/−3; first choice
  locks), a source byline after every answer, +40 awareness on completion.
- **Clippings** — every answered question is cut and kept (cap 100): your pick,
  the record, the source. Filter by desk; **Recall drill** re-asks five random
  clippings untimed, +6 awareness per correct review.

## Economy (simulated — free)

Wallet starts at 1,000 coins; daily grant +30 (once per day on load). Stakes
[10…500] exist **only for pass-and-play**; the Wire Bot always plays free.
Winner collects the combined pot flat: pot = 2×stake, no deduction; draw or
cancel refunds in full. No purchase, no
ads, nothing to win: *"Simulated coins. No money involved, nothing to buy."*

## Awareness & titles

Correct 20 · trying 5 · duel won 50 · draw 25 · beat filed 40 · review 6.
Titles: Stringer 0 → Correspondent 300 → Editor 900 → Editor-in-Chief 2000
(`xpToNext = round(80 · level^1.55)`). Desk ratings are Elo-lite (start 1000,
K=32, per desk, from duel/beat rounds).

## The League

A weekly table of 30 — you plus 29 persistent simulated rival readers. Rival
awareness accrues deterministically per day: `seed = hash(rivalId + weekKey +
dayIndex)`, daily gain 40–260, computed at load; movement ▲▼ is seeded jitter
for rivals and rank-vs-last-session for you. The player’s weekly awareness is
real XP earned that week. Monday rollover archives the final position, promotes
the top 10 / relegates the bottom 5 across Desk League → Press League →
Editors’ League, and resets the week. Promotion and relegation bands are tinted
rows (glyph + text, never colour alone).

## Content sourcing rules

90 questions (45 politics + 45 finance), each sourced to an official/public
record (CAG, Supreme Court, ECI, RBI, SEBI, PIB, PRS, budget documents) with a
URL and a two-line note. Audit and court items are framed as instruments and
holdings, never allegations against individuals; mutable facts carry an
"as of …" stamp; coverage is symmetric across parties and eras.

## Files

- `index.html` — shell, fonts, ticker, print-only Press Card
- `styles.css` — the Daily Desk system (zero radius, 1px rules, spreadsheet
  tables, print CSS, full `prefers-reduced-motion` collapse)
- `app.js` — engine (state, i18n EN/हिं, router, duel flow, league, economy)
- `questions-politics.js`, `questions-finance.js` — the sourced bank
  (`window.LEDGER_POLITICS` + `window.LEDGER_FINANCE`)

Accessibility ship bar: question text ≥22px at 7:1, body 19px, UI floor 14px,
targets ≥48px, `en-IN` number formatting, Devanagari line-height 1.65, Relaxed
Mode before every timed duel, colour never the sole signal, keyboard-operable,
live-region announcements.
