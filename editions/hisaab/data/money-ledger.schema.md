# `money-ledger.json` — field reference

The money ledger is the dataset behind the HISAAB DO "money ledger" timeline screen: one row per measure
that handed out public money directly, between 2000 and 2026. That covers cash and in-kind transfers, relief
funds and disaster money, and the budgets, bills and notifications announced before an election. It is
derived from the question bank (`editions/hisaab/bank/*.mjs`, not `schema.mjs`, `index.mjs` or `sample.mjs`).
Every number, name, date and poll result in a row comes from a bank item listed in that row's `itemIds`. The
bank items were fact-checked against fetched pages under the charter (`docs/hisaab/CHARTER.md` §2, §3a, §4b).
The ledger adds no new research.

The file is a plain JSON array sorted by `launched`, then `state`, then `id`. The overview, with counts,
sources and known gaps, is in `docs/hisaab/research/money-trail.md`.

## Fields

| field | type | required | meaning |
|---|---|---|---|
| `id` | string | yes | Stable kebab-case slug: `<state code>-<measure>-<year>`, e.g. `mp-ladli-behna-2023`. The prefix is `in-` for Union measures with no single state. Unique. |
| `name` | string | yes | Short display name of the measure (≤ 60 characters). |
| `mode` | `'distribution'` \| `'relief'` \| `'pre-election'` | yes | The ledger's own primary mode for the row (rules below). |
| `level` | `'Centre'` \| `'State'` | yes | Which government enacted the measure. A Union measure sited in one state, such as a PM-KISAN release at Yavatmal or central flood aid to Kerala, is `Centre`, with that state in `state`. |
| `state` | string | yes | Code from the charter's STATES list (§5); `IN` means national. |
| `launched` | `'YYYY'` or `'YYYY-MM'` | yes | When the measure was announced, launched or first paid, as the bank dates it. A month is given only when a bank item states it. |
| `launchedApprox` | `true` | no | Present when the bank gives no launch date. `launched` is then the earliest date the bank gives for the measure, such as a later allocation, an anniversary release or a completion date. Treat it as "active by", not "launched in". There are 10 such rows. |
| `enactedBy` | `[{ name, role, party }]` | yes, may be `[]` | Who announced, presented, launched or passed the measure. This is a public act, not an allegation. It is copied from the bank item's `enactedBy`, or set from an item that says "X announced…". It is **empty** when the bank names no one, as with Finance Commission awards, court-ordered measures and some state relief. `party` is the person's own party as the bank records it (e.g. `JD(U)`, `TRS (now BRS)`, `Kerala Congress (M)`). |
| `party` | string | yes | The party or coalition that governed at that level when the measure came. For the Centre this is `NDA` or `UPA`. For states it is the bank's `govt` code (`BJP`, `INC`, `TMC`, `DMK`, `AIADMK`, `LDF`, `UDF`, …), with `JDU` shown as `JD(U)` and `SS` as `Shiv Sena`. The bank's `Other` is resolved to the party's name (`INLD`, `SAD`, `JD(S)`, `SDF`, `PDP`, `JKNC`, `TVK`). For a coalition it is the chief minister's party. |
| `benefit` | string | yes | What was handed out or decided, in one line (≤ 160 characters). |
| `reach` | string | no | How many people, families, accounts or items. The bank's figure, with its date or qualifier ("state figure", "target"). |
| `annualCost` | string | no | The money: a yearly cost, a budget line, a one-off outlay or the total paid so far. The field name is historical, so read the qualifier in the text ("a year", "(2025-26)", "at launch", "by Dec 2025", "in all"). Figures are not comparable across rows and must not be summed (see packages below). |
| `poll` | `{ label, month, gapDays?, result }` | no | The election the measure **preceded**. It is copied from a bank item's `poll`. `month` is `YYYY-MM`. `gapDays` is the bank's count of days from the event the item names (the announcement, cabinet decision or first payment) to the first polling day. It is dropped when that event is not the row's own launch. For example, the Namo Shetkari row (launched Oct 2023) carries the Maharashtra 2024 poll without the gap, because the item counts from the fifth instalment. `result` is the official result as the bank states it (ECI figures through the cited outlet). |
| `outcome` | string | yes | Results, in one or two sentences (≤ 240 characters): reach, cost, audit findings, ineligible beneficiaries removed, what later governments did, and for pre-poll rows the election result. It says what caused a result only when a named study, survey or court says so, and names it. Otherwise it says nothing about cause, or says that "no cited study links…". Where the bank has no result yet, it says so. |
| `package` | `true` | no | The row is a bundle whose parts also have rows of their own: Karnataka's five guarantees and Telangana's six guarantees. Its costs overlap those rows. |
| `tags` | string[] | yes | The union of the money-trail mode tags (`distribution`, `relief`, `pre-election`) on the row's bank items. Use it to put a row in more than one mode, e.g. the Covid cash to Jan Dhan women (`distribution` + `relief`). |
| `itemIds` | string[] | yes | The bank items the row is built from. The first item is usually the source item. An item can back more than one row when it covers both, e.g. `hdb135` backs both the Maiya Samman launch and its pre-poll hike. |
| `sourceUrl` | string | yes | The deep link of the row's source item: a page that was fetched and states the core fact. It is always one of the `itemIds`' `sourceUrl`s. The other items' pages carry the rest of the row. |
| `sourceLabel` | string | yes | "Publisher — title (date)", copied from the source item. |

## How rows were cut

- **One row per measure-event.** A scheme's launch is one row. Later audits, reach counts, lifetime-spend
  figures and renamings of the same scheme fold into that row's `outcome` and `itemIds`. A later decision
  that changed the money, or came with its own date before an election, gets its own row. That covers a hike,
  an expansion, a new phase, a special pre-poll payout or an instalment released at a poll-bound venue.
  Examples: Lakshmir Bhandar (launch 2021, hike 2024, hike 2026), Antyodaya Anna Yojana (launch 2000,
  expansions 2003 and 2004), the PM-KISAN launch plus five pre-poll instalment releases.
- **Promises are not measures.** An opposition party's manifesto pledge that was never enacted gets no row.
  The bank items about such pledges are listed in `money-trail.md`. When a pledge was later enacted, the row
  is the enacted measure, dated when it was enacted. The pledge and that election's result go in `outcome`.
  Examples: Subhadra (Odisha) and the Old Pension Scheme (Himachal). Ladli Behna is not one of these: it was
  enacted before its poll.
- **Processes are not measures.** ECI and court proceedings about schemes, advertising rulings, poll-date
  decisions and aggregate subsidy bills get no row of their own. Where one of them is the result of a
  measure, such as the SC's 2013 freebies ruling on the colour-TV scheme, it is folded into that measure's row.

## How `mode` is set

1. `relief`: disaster, drought, flood, cyclone and pandemic relief funds, packages and payments, plus the
   architecture of the disaster funds (Finance Commission awards, NCCF/NDRF/SDRF, PM CARES). A relief row
   can still carry a `poll`: 7 rows do, such as Bihar's ₹7,000 flood relief 78 days before polling.
2. `pre-election`: any other row with a `poll`, meaning a bank item ties the measure to an election it came
   before. This is the Chunav Se Pehle (before the vote) lens.
3. `distribution`: everything else. These are cash and in-kind transfers with no poll attached.

The bank items' own tags are kept in `tags`. A screen can filter by `mode` for one colour per row, or by `tags`
for membership.

## Invariants (checked when the file was built)

- Every `itemIds` entry exists in the bank. Every row's `sourceUrl` is one of its items' `sourceUrl`s.
- Every `poll` is copied from one of the row's items, and polling comes after `launched`.
- Every number in `benefit`, `reach`, `annualCost` and `outcome` appears in the row's items. A few are
  reformatted, e.g. 22,27,506 becomes 22.27 lakh. This was checked by script.
- No row names a private individual. No row's text names a person in a wrongdoing context. Case outcomes
  use the bank's precise status words ("chargesheeted", "arrested… denies", "alleged", "CAG flagged") and give a
  date.
- Words like "freebie", "revdi" and "vote-buying" appear only when attributed to whoever said them.

## Example

```json
{
  "id": "mp-ladli-behna-2023",
  "name": "Ladli Behna Yojana",
  "mode": "pre-election",
  "level": "State",
  "state": "MP",
  "launched": "2023-06",
  "enactedBy": [{ "name": "Shivraj Singh Chouhan", "role": "Chief Minister, Madhya Pradesh", "party": "BJP" }],
  "party": "BJP",
  "benefit": "Monthly cash for women aged 23–60: ₹1,000 at launch, ₹1,250 before the 2023 poll, ₹1,500 by August 2026",
  "reach": "About 1.25 crore women",
  "annualCost": "₹23,883 crore (2026-27); ₹1,209.64 crore first transfer",
  "poll": { "label": "Madhya Pradesh Assembly 2023", "month": "2023-11", "gapDays": 160, "result": "BJP won 163 of 230 seats; Congress 66" },
  "outcome": "First paid 160 days before polling; over ₹6,800 crore paid by mid-October. The BJP won 163 of 230.",
  "tags": ["distribution", "pre-election"],
  "itemIds": ["hdb232", "hst220", "hfw009"],
  "sourceUrl": "https://indianexpress.com/article/cities/bhopal/chouhan-keeps-ladli-behna-promise-transfers-rs-1000-to-1-25-cr-beneficiaries-8656399/",
  "sourceLabel": "The Indian Express — Chouhan keeps 'Ladli Behna' promise, transfers Rs 1,000 to 1.25 cr beneficiaries (10 Jun 2023)"
}
```

## Using it on a screen

- For the timeline, sort by `launched`. Rows with only a year sort before the months of that year. Show
  `launchedApprox` rows as "by YYYY".
- Filter by `mode` or `tags`, by `state` and `level`, by `party`, or by year. Rows are balanced across
  every party that governed. `party` is who governed, not a verdict.
- To render a poll, take the countdown from `poll.gapDays` (when present) and the result from
  `poll.result`. Show no causal badge: the ledger makes no causal claims.
- To open a row, deal its `itemIds` as quiz cards, and link `sourceUrl` as the receipt.
- Keep in sync: when a bank item's facts or status change, update the rows that list it. Search for its id.
