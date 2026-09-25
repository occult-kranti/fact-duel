# Elections & money: research notes (`hel`, `bank/elections.mjs`)

Lane owner: content research, Elections & money. Verified: September 2026 (every item `asOf: '2026-09'`).
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/elections.mjs` prints OK (50 items;
simple 17, expert 17, extreme 16; answer slots 13/13/12/12). The whole-bank run is also clean.

## How the items were built

- Every item's `sourceUrl` was fetched and read. Numbers are copied from the page, not from memory.
- Primary sources come first where they exist: the SC electoral-bonds judgment PDF (api.sci.gov.in),
  the SC Chandigarh mayor judgment PDF, PIB (MHA on FCRA), and ADR's own pages. Case reporting is from
  Supreme Court Observer and LiveLaw. Everything else is from established outlets (The Hindu,
  Indian Express, Business Standard, ThePrint/PTI, Scroll, The Wire, ET, TOI, NIE, The Federal).
- **No person is named in any stem or option.** Roles are used instead: "the presiding officer",
  "the chief minister", "a Telangana MLA", "the Union Finance Minister". So no item carries `people`.
  `status` is still written on every item that touches an allegation or a pending case: hel013,
  hel017, hel018, hel030 and hel034 (the one `scam` item).
- Donor and recipient figures are stated as published data. "Quid pro quo" appears only as an
  allegation attributed to critics or media analysis (hel017). Each such item gives the Union's reply
  (the FM's "huge assumption") and the SC's Aug 2024 refusal to order a probe (hel018).
- Party balance on the bond items: BJP (hel010), TMC (hel011, hel014), BRS and BJD (hel012), DMK and
  YSRCP (hel014), BRS again (hel015), CPI(M) as challenger (hel007). FCRA covers BJP and INC together
  (hel020, hel021). Trusts were set up by the UPA (hel022). The SC fines hit CPI(M) and NCP hardest
  (hel050). The defection items run both ways: Telangana, BRS to INC, is hel043.
- Tooling note: the session's WebSearch budget ran out partway through. After that, searching used
  the Google News RSS feed (with its links resolved to publisher URLs) and pages were fetched with curl.
  reddit was never used.

## Data screen: electoral bonds (verified figures)

Two different SBI datasets exist. **Do not mix them on one screen.**

**A. SBI data published by ECI on 14 Mar 2024 (encashments 12 Apr 2019 to 24 Jan 2024).**
Total encashed Rs 12,769 cr; total purchased Rs 12,155 cr (Business Standard, 15 Mar 2024).

| Recipient party | Encashed (Rs crore) | Share | Source |
|---|---|---|---|
| BJP | 6,060.5 | ~47.5% | Business Standard 15 Mar 2024; The Wire |
| AITC (TMC) | 1,609.5 | 12.6% | Business Standard; The Wire |
| INC | 1,421.9 (The Wire: 1,421.8) | 11.1% | Business Standard; The Wire |
| BRS | 1,214.7 | — | The Wire |
| BJD | 775.5 | — | The Wire |
| DMK | 639 (as quoted by the Home Minister; not checked against the dataset) | — | Tribune, 15 Mar 2024 |

| Purchaser | Bought (Rs crore) | Source |
|---|---|---|
| Future Gaming and Hotel Services (lottery) | 1,368 | Business Standard; Scroll |
| Megha Engineering & Infrastructures (MEIL) | 966 (group with 3 associated firms: ~1,200) | ThePrint; Business Standard |
| Qwik Supply Chain | 410 | ThePrint (PTI) |
| Haldia Energy (RP-Sanjiv Goenka group) | 377 | Business Standard |
| Vedanta | 375.65 | Business Standard |
| Essel Mining & Industries | 224.45 | Business Standard |

**B. Donor-to-party matches after the unique numbers were released (ECI, 21 Mar 2024), as analysed by
ADR (PTI, 28 Mar 2024).** Figures differ slightly from outlet to outlet. For example, Business Standard
(22 Mar) gives MEIL to BJP as Rs 519 cr where ADR has Rs 584 cr, and Vedanta to BJP as Rs 226 cr where
ADR has Rs 230 cr. Use ADR's figures.

| Donor | Party | Rs crore |
|---|---|---|
| Future Gaming | TMC | 542 |
| Future Gaming | DMK | 503 |
| Future Gaming | YSRCP | 154 |
| Future Gaming | BJP | 100 (Business Standard, 22 Mar) |
| MEIL | BJP | 584 |
| MEIL | BRS | 195 |
| MEIL | DMK / YSRCP / TDP | 85 / 37 / 28 (MEIL was their 2nd-largest donor) |
| Western UP Power (a MEIL-group firm) | INC | 110 (Business Standard) |
| Qwik Supply Chain | BJP | 375 |
| Vedanta | BJP | 230 |
| Bharti Airtel | BJP | 197.4 |
| Haldia Energy | TMC | 281 |

**Whole-scheme figures (Mar 2018 to Jan 2024, from SBI RTI data), not used in any item:** Rs 16,518 cr
sold in 30 tranches, as the government told the Lok Sabha on 5 Feb 2024. Scroll puts redemptions at
Rs 16,492 cr, with Rs 8,252 cr of it (about half) going to the BJP.

## Sources used (main)

- SC, ADR v. Union of India (15 Feb 2024), full judgment PDF: api.sci.gov.in/…/27935_2017_1_1501_50573_Judgement_15-Feb-2024.pdf
- SC, Kuldeep Kumar v. UT Chandigarh (20 Feb 2024), judgment PDF: api.sci.gov.in/…/4999_2024_1_15_50631_Judgement_20-Feb-2024.pdf
- Supreme Court Observer: the electoral bond timeline; the VVPAT judgment summary; the Bihar SIR
  verdict (27 May 2026) and SIR Day 8 (Aadhaar); the CEC-law split verdict (23 Sep 2026).
- ADR: the 2024 LS criminal/crorepati pages; the FY 2024-25 national party income page (via PTI/Telegraph,
  Mar 2026); the FY 2024-25 electoral trusts analysis (13 Feb 2026).
- PIB (MHA), Amendment in FCRA (7 Mar 2018); Business Standard on the 2014 Delhi HC FCRA ruling and the
  2018 retrospective amendment.
- Outlets are as listed in each item's `sourceLabel`.

## Dropped or not used (and why)

- **Karnataka FIR against the Union FM and BJP functionaries over "electoral bond extortion".**
  Search results (Bar & Bench, Organiser headlines) say the Karnataka HC quashed it on 3 Dec 2024.
  I did not open those pages, and I could not confirm
  whether any appeal is pending. It names a sitting minister, so it was dropped rather than risk a
  stale status.
- **Presiding officer's Section 340 CrPC proceedings (Chandigarh).** The SC issued a show-cause notice
  (20 Feb 2024) and he apologised unconditionally (5 Apr 2024). No later outcome could be found, so
  hel030 names no one and its status says "later outcome not verified".
- **Delhi excise policy / AAP named as an accused by ED.** The status is complex and changing: the CBI
  case discharge of Feb 2026 is under appeal, and contempt proceedings began in May 2026. It belongs to
  the scams lane anyway.
- **CEC removal notices and the Express "two ECs objected 14 times" investigation (Sept 2026).** This is
  breaking news about a named office holder, too live to freeze into a quiz item. Revisit next month.
- **Mukul Roy disqualification (Calcutta HC Nov 2025, stayed by SC Jan 2026).** Considered for balance.
  Dropped because the later status is unclear and the 2021 Assembly's term has ended.
- **NCP split ECI test (Feb 2024).** Verified: the ECI used the legislative-majority test. Cut for
  length. September 2026 news reports refer to Ajit Pawar's death in an accident. Check this before
  writing any NCP item.
- **"Vote chori" / Mahadevapura allegations (Aug 2025).** Covered by the ECI's replies but still a
  live political contest. Aland (hel034) was used instead, because it has a chargesheet and a court
  record.
- **Seed items not used for want of space:** the Nov 2022 extra-sale-window amendment, the PM's Relief
  Fund rule (folded into hel006's explanation), the extra-extreme items on SLU storage and the 7-day
  window (folded into hel033), Rs 16,518 cr total sold, and the 2024 turnout.

## Contested or sensitive (reviewer: please re-read these)

1. **hel017** (bonds after agency raids): allegation framing, with the FM's rebuttal and the SC's refusal
   of an SIT.
2. **hel034** (Aland voter deletions): the only `scam` item. A former BJP MLA and six others are
   chargesheeted; HC refused to quash (1 Sep 2026); charge framing was listed for 16 Sep 2026. **The
   charge-framing outcome was not verified.** The ex-MLA denies the charges.
3. **hel013 / hel014** (Future Gaming): an ED probe was reported. The company is not convicted and its
   purchases were legal under the scheme then in force.
4. **hel016** (Qwik Supply / Reliance): the link rests on PTI's reading of filings. Reliance's denial
   ("not a subsidiary of any Reliance entity") is quoted.
5. **hel030** (Chandigarh): SC findings against the presiding officer. The officer is not named.
6. **hel010**: the Home Minister's "6,000 of 20,000 crore" argument is given as the BJP's reply. Scroll's
   fact-check disputes his totals.

## Stale-risk list (re-verify monthly)

- **hel031 / hel032**: CEC appointments law. The split verdict of 23 Sep 2026 sent it to the CJI for a
  larger bench. Watch for the bench being constituted and for any interim order.
- **hel040**: Goa 2022 defections. The SC agreed in Jul 2026 to examine the case (three-judge bench).
- **hel043**: Telangana. Other BRS-to-Congress MLAs' cases are pending with the Speaker, the HC or the SC.
- **hel039**: the Shiv Sena name/symbol and Speaker's-ruling challenges were in final hearing before a
  CJI-led bench (15 Sep 2026). A verdict would change the context of hel039 but not its answer.
- **hel047**: ONOE JPC deadline is the last week of the 2026 winter session. The report may land.
- **hel046**: women's reservation and delimitation. The government has said delimitation must start
  early for 2029, and a fresh Bill is possible.
- **hel035 / hel036**: SIR. Phase-wise SIR in other states is ongoing, but these items are Bihar-only.
- **hel045**: the Rs 95 lakh spending limit (Jan 2022). No 2026 revision was found. Recheck before the
  next general election.
- **hel024 / hel025 / hel023**: ADR FY 2024-25 data. Replace when the FY 2025-26 analyses come out
  (expected early 2027).

## Field conventions used in this lane

- `state: 'IN'` for Chandigarh (hel030): Chandigarh is not in STATES. `govt: 'NDA'` because the UT is
  administered by the Union.
- `govt: 'Other'` for Karnataka 2019 (JD(S)-Congress coalition; JD(S) is not in GOVTS) and Arunachal
  2016 (the Congress-rebel government with BJP support that the SC unseated).
- `govt: 'BJP'` for Aland (hel034): the BJP governed Karnataka when the deletions were attempted, as
  The Hindu reports.
- Party-income and ADR items use `govt: 'NDA'` (the Centre) by convention.
