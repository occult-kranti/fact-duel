# HISAAB DO — project charter

*हिसाब दो — "Show us the accounts."*
*Janta ka paisa. Janta ka sawaal.* (The people's money. The people's question.)

Owner of this document: the team lead. Every agent working on the edition reads it first. When this
file and any other instruction disagree, this file wins; flag the conflict in your report.

## 1. What we are building

A second edition of the Jaanta Hai Kya (JHK) quiz-duel engine, about the last 5–12 years of Indian
public life: government schemes, subsidies and benefits, where public money went, the scams and
frauds around it, the people and institutions involved, and who owns the news that told you about
it. It reuses JHK's engine (duel service, practice bot, rounds and verdict rules, progression,
streaks, quests, journal/vault, expeditions) and ships a **completely new design**.

It deploys as its own GitHub Pages site next to JHK: `https://occult-kranti.github.io/fact-duel/hisaab/`.

### The joke that carries the product

Your rank is a label — the ones Indian TV, WhatsApp and Reddit throw at people. You start as an
**Andhbhakt** (blind devotee — of anyone) and, receipt by receipt, you earn your way to
**Certified Anti-National** — the label you get for asking where the money went. The satire is
aimed at *labelling* and at *blind devotion*, never at a religion, caste, region or community, and
never at an individual private citizen.

The nine rungs map 1:1 onto the engine's nine title bands (`lib/progression.mjs` `LEVEL_TITLES`,
band = floor(level / 5)):

| band | levels | label | one-liner (draft — design lane may polish, not reorder) |
|---|---|---|---|
| 0 | 1–4 | Andhbhakt | Forwards first. Reads never. |
| 1 | 5–9 | WhatsApp University Fresher | Enrolled. Attendance: every group. |
| 2 | 10–14 | Prime-Time Loyalist | Knows the anchor's voice better than the budget. |
| 3 | 15–19 | Neutral Uncle | "Sab chor hain." Has not checked which ones. |
| 4 | 20–24 | Receipt Maango | Has started asking for the bill. |
| 5 | 25–29 | RTI Warrior | Files questions. Waits 30 days. |
| 6 | 30–34 | Urban Naxal (as per the forwards) | Reads CAG reports on the metro. |
| 7 | 35–39 | Tukde-Tukde Gang | Counts crores in tukdas. |
| 8 | 40+ | Certified Anti-National | Knows where the money went. Asks anyway. |

## 2. Non-negotiables (legal, honesty, safety)

These are release gates. A violation is a P0 finding in review.

1. **Every question is sourced.** `sourceUrl` must be a page that states the fact. Preferred
   order: court judgment/order, CAG report, Parliament answer (sansad.in / PIB), official data (ECI,
   RBI, indiabudget.gov.in, PRS), agency press release (CBI/ED/SEBI), then an established outlet
   (The Hindu, Indian Express, Hindustan Times, Times of India, NDTV, Scroll, The Wire, The Print,
   Reuters, BBC, Mint, Business Standard, Economic Times, Deccan Herald, The News Minute,
   Newslaundry, Alt News/BOOM/Factly for fact-checks). Wikipedia is acceptable only as a second
   source, never the only one for a claim about a named person.
2. **Legal status, dated, exactly.** Any item about wrongdoing states status precisely and with an
   `asOf` month: *alleged by X* / *FIR registered* / *arrested* / *chargesheeted* / *on bail* /
   *acquitted* / *convicted* / *case closed* / *court dismissed the petition*. **Never imply guilt
   of anyone not convicted.** Stems say "was named in", "was arrested by", "the CAG flagged",
   "Hindenburg Research alleged" — not "stole", "looted", "the corrupt minister".
3. **The other side's answer is part of the fact.** Where a person, company or government denied
   or contested the claim, or a court/agency cleared them, the explanation says so in one clause.
4. **Distractors never smear.** In a question whose answer is a person accused of something, the
   wrong options must NOT be other real, living, identifiable people. Ask for a role, party, state,
   agency, year, amount or scheme instead, or rephrase so all four options are non-person values.
5. **Balance across parties.** The Centre since 2014 is NDA-led, so central items will reflect
   that — that is proportionality, not bias. State lanes cover whichever party governed. Each lane
   records `govt` on every item; the review lane audits the distribution and flags any lane where
   one side is only ever the villain in cases where the record shows otherwise.
6. **No communal, caste or religious targeting; no hate speech; no slurs** against groups. Political
   labels that are the point of the satire (Andhbhakt, Anti-National, Urban Naxal, Tukde-Tukde,
   WhatsApp University, Godi Media, IT Cell, Neutral Uncle) are allowed. Group slurs are not, even in
   research notes (describe them abstractly: "a slur for X supporters").
7. **No private individuals.** Public office holders, candidates, public companies and their
   named executives acting in public matters only.
8. **No invented numbers, no invented presence.** Every figure comes from the source. Bots are
   labelled BOT. Live counts are real or absent. Coins are free and simulated.
9. **No State Emblem, no party symbols, no real logos** of parties or media houses in the art.
   Text names are fine; marks are not.
10. **Secrets never enter the repository.** Research credentials live in environment variables
    only; nothing under `docs/`, `scripts/` or `editions/` may contain a key, password or token.

## 3. The question schema (edition bank)

Every bank file is an ES module in `editions/hisaab/bank/` exporting one frozen array. Items keep
the JHK shape (so the engine deals them unchanged) plus edition fields:

```js
export const HISAAB_SCHEMES = Object.freeze([
  {
    id: 'hsc001',                  // /^h[a-z]{2}\d{3}$/ — prefix = lane (see §4), unique across all lanes
    domain: 'civics',              // always 'civics'
    region: 'India',               // always 'India' (engine field)
    state: 'IN',                   // 'IN' for national/central, else a state code from §5
    topic: 'Welfare & Subsidies',  // one of the SECTORS in §5, exactly
    subtopic: 'PM-KISAN',          // the scheme, case, outlet or institution — short
    kind: 'scheme',                // 'scheme' | 'spend' | 'scam' | 'media' | 'funding' | 'forward' | 'institution'
    difficulty: 'simple',          // 'simple' (headline fact) | 'expert' (followed the news) | 'extreme' (numbers/dates)
    year: 2019,                    // year the fact happened
    asOf: '2026-09',               // month the status in this item was last verified
    govt: 'NDA',                   // who governed at that level then: NDA, UPA, BJP, INC, AAP, TMC, DMK, AIADMK,
                                   // YSRCP, TDP, BRS, BJD, JMM, RJD, JDU, SP, BSP, SS, NCP, LDF, UDF, SKM, MNF,
                                   // NDPP, NPP, ZPM, CPI(M), President's Rule, Other
    question: '…',                 // ≤ 220 chars, plain English, no answer text inside it
    options: ['…', '…', '…', '…'], // four distinct, plausible, similar length; see §2.4
    correctIndex: 0,               // 0–3, spread evenly across the lane
    explanation: '…',              // ≤ 420 chars: the fact, its status as of asOf, the counterpoint if any
    status: '…',                   // REQUIRED when kind is 'scam' or a person is named: legal status line
    people: ['…'],                 // names of public persons mentioned anywhere in the item (audit only)
    sourceUrl: 'https://…',        // the page that states the answer
    sourceLabel: '…',              // "Publisher — title (date)"
    sources: ['https://…'],        // optional further URLs
  },
]);
```

Rules the test suite (`tests/hisaab-bank.test.mjs`) will enforce: unique ids and question text
across all lanes; four distinct options; answer text not contained in the question; `correctIndex`
spread (each slot > 1/8 of a lane); each difficulty ≥ 25% of every lane; `https` sources;
`status` present on every `scam` item and every item with `people`; `asOf` matches `/^20\d\d-\d\d$/`;
`topic` ∈ SECTORS; `state` ∈ STATES.

## 4. Lanes (content), id prefixes and targets

| lane | prefix | file | target | scope |
|---|---|---|---|---|
| Schemes & benefits | `hsc` | `bank/schemes.mjs` | 60 | Central schemes, subsidies, DBT, what they promised, what audits/Parliament found |
| Budget & spending | `hbx` | `bank/spending.mjs` | 50 | Union budget, subsidy bill, debt, capex, flagship project costs, ads, PM CARES, demonetisation, GST |
| Scams & accountability | `hgh` | `bank/scams.mjs` | 60 | National frauds and cases, agencies (CBI/ED/Lokpal/SEBI), conviction data, defections under probe |
| States — North & Hindi belt | `hst` 100–199 | `bank/states-north.mjs` | 60 | UP, UT, HP, PB, HR, DL, JK, RJ, BR, JH — ≥ 6 each |
| States — West & South | `hst` 200–299 | `bank/states-west-south.mjs` | 60 | GJ, MH, GA, MP, CT, KA, KL, TN, AP, TG — ≥ 6 each |
| States — East & North-East | `hst` 300–399 | `bank/states-east.mjs` | 50 | WB, OD, AS, AR, MN, ML, MZ, NL, SK, TR — ≥ 4 each, ≥ 6 for WB/OD/AS |
| Media & speech | `hmd` | `bank/media.mjs` | 45 | Who owns which outlet and their political links, press freedom, govt ad spend, raids on media |
| Elections & money | `hel` | `bank/elections.mjs` | 50 | Electoral bonds and donors, party income, criminal cases of legislators, defections, ECI |
| Forward Court | `hfw` | `bank/forwards.mjs` | 40 | Viral claims from all sides and what fact-checkers found |

Each lane also writes `docs/hisaab/research/<lane>-notes.md`: sources used, items dropped and why,
and anything the reviewer should double-check.

## 5. Controlled vocabularies

**SECTORS** (`topic`): `Welfare & Subsidies`, `Farm & Food`, `Health`, `Education & Exams`,
`Infrastructure`, `Banking & Finance`, `Energy & Mining`, `Defence & Security`,
`Elections & Funding`, `Media & Speech`, `Governance & Institutions`, `Jobs & Economy`,
`Environment & Land`.

**STATES** (`state`): `IN` (national/central), `UP`, `UT` (Uttarakhand), `HP`, `PB`, `HR`, `DL`, `JK`,
`RJ`, `BR`, `JH`, `GJ`, `MH`, `GA`, `MP`, `CT` (Chhattisgarh), `KA`, `KL`, `TN`, `AP`, `TG`
(Telangana), `WB`, `OD`, `AS`, `AR`, `MN`, `ML`, `MZ`, `NL`, `SK`, `TR`.

## 6. Game modes (engine mapping)

| mode | what the player does | engine |
|---|---|---|
| **Aaj Ka Hisaab** (daily) | 5 questions, same for everyone that day | expedition-style run, date seed |
| **Rajya Rounds** (state-wise) | pick a state on the map → a 6-card route | expeditions, one route per state |
| **Sector Files** (sector-wise) | pick a sector file → a 6-card route | expeditions, one route per sector |
| **Kiska Media?** | media ownership and speech | route over `Media & Speech` |
| **Forward Court** | rule on viral forwards | route over `kind: 'forward'` |
| **Duel vs Bot** | Quick Draw / Triple Threat / Gauntlet vs the labelled practice bot | duel service in-process |
| **Duel a Friend** | same formats, peer-to-peer room code (no server) | P2P transport, same verdict rules |
| **Pass & Play** | two players, one phone, untimed | local |

## 7. Notification budget (fewer than JHK)

At most **one** transient toast per screen visit; **no** streak nags or "come back" prompts;
ceremonies only for a label promotion and a completed state/sector file; everything else is a quiet
in-place update. No sound until first tap. Settings can silence all of it.

## 8. Repository layout

```
editions/hisaab/            the edition: entry, config, screens, theme, bank, p2p
editions/hisaab/bank/       content lanes (one file per lane) + index.mjs registry
docs/hisaab/                charter, roadmap, design bible, research, reviews
tests/hisaab-*.test.mjs     edition tests
vite.config.hisaab.ts       the edition build → dist-hisaab/
.github/workflows/pages-hisaab.yml   publishes dist-hisaab into gh-pages/hisaab/
.claude/skills/hisaab-*     edition skills (design, editorial)
```

JHK must keep building and behaving exactly as before. Edition differences are made by aliasing
modules in the edition build or by additive, default-preserving options in shared modules.
