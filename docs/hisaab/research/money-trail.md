# The money trail, 2000–2026: overview

*Ledger builder notes, 26 Sep 2026. Data: `editions/hisaab/data/money-ledger.json`. Field reference:
`editions/hisaab/data/money-ledger.schema.md`.*

The product owner asked for a 26-year trail of public money handed out directly. That means distribution
funds (cash and in-kind transfers), government relief funds, and pre-election funds, budgets and bills, with
who announced or passed each measure, the party in power, and the results. The eight money-trail lanes and
the three gap-fill lanes researched it as quiz items (charter §4a). Several older lanes, retro-tagged, add to
it. The **money ledger** turns those items into one clean timeline dataset: **389 measures**, each with its
enactors, governing party, benefit, reach, cost, the poll it preceded (if any), results, the bank items behind
it and a fetched source.

No new research went into the ledger. Every row's facts come from bank items that are already sourced and
checked, and every number was matched by script against the texts of the row's own items. A handful differ
only in format, e.g. 22,27,506 written as 22.27 lakh. Where the bank is
silent, the row says so: an empty `enactedBy`, a missing `reach` or `annualCost`, a `launchedApprox` date,
or an outcome that says there are "no reach or cost figures yet".

## 1. What went in

| | count |
|---|---|
| Bank items carrying a money-trail tag (`distribution` / `relief` / `pre-election`) | 516 |
| of which used in at least one ledger row | 495 |
| of which left out on purpose (§6) | 21 |
| Ledger rows (measures) | **389** |
| rows with a `poll` block (the measure preceded an election) | 164 |
| … of which with `gapDays` | 137 |
| rows with `reach` / with `annualCost` | 205 / 203 |
| rows whose enactor the bank does not name (`enactedBy: []`) | 46 |
| rows dated `launchedApprox` (the bank gives no launch date) | 10 |
| package rows that overlap their parts (Karnataka's 5 guarantees, Telangana's 6) | 2 |
| distinct office-holders named in `enactedBy` | 125 |

**Grouping.** A row is one measure-event: a launch, or a later decision that changed the money or came with
its own pre-poll date. Examples of the latter are a hike, an expansion, a new phase, a special payout, or an
instalment released at a poll-bound venue. Audits, reach counts and renamings fold into the launch row.
Opposition pledges that were never enacted, ECI and court procedure, and aggregate subsidy bills are not
measures, so they get no row (§6).

## 2. Counts by mode and period

`mode` is the ledger's single primary mode. `relief` covers disaster and pandemic money. `pre-election` is any
other measure that preceded a poll. `distribution` is everything else. `tags` keeps the items' full mode
membership. Launch dates are used, so an audit in 2024 of a 2018 scheme counts under 2015–19.

| period | distribution | relief | pre-election | total |
|---|---|---|---|---|
| 2000–04 | 15 | 14 | 11 | 40 |
| 2005–09 | 14 | 13 | 16 | 43 |
| 2010–14 | 25 | 16 | 14 | 55 |
| 2015–19 | 24 | 14 | 36 | 74 |
| 2020–26 (7 years) | 59 | 38 | 80 | 177 |
| **total** | **137** | **95** | **157** | **389** |

By level: **Centre 128** (NDA 94, UPA 34) and **State 261**. The Centre–State split per period is 19/21,
15/28, 22/33, 25/49 and 47/130. 7 relief rows also carry a poll, for example Hyderabad flood relief paused
under the civic-poll code in 2020 and Bihar's ₹7,000 flood transfer 78 days before polling in 2025.

**Timing before polls** (137 rows with `gapDays`): median **98 days**. 8 rows fall within 30 days, 52 within
31–90, 43 within 91–180, 28 within 181–365, and 6 more than a year out. The longest is Punjab Smart Connect at
557 days. The shortest, at 3–4 days, are Union Budget 2017, the five-year free-grain extension, the halted
Rythu Bandhu rabi instalment and Budget 2025's tax cut. These are timing facts. The ledger attributes a motive
only when someone said it ("poll gimmick", "revdi"). Named studies are cited only for programme effects: the
IGC cycle-scheme study, the Lancet JSY evaluation and the PLOS One Chiranjeevi study. No row claims what
caused an election result.

## 3. Counts by governing party

`party` is who governed at that level when the measure came. It is not a verdict, and the counts measure
the bank's coverage, not which party spends more. The Centre has been NDA-led since 2014, so the NDA count is
proportional to that (charter §2.5).

| party | distribution | relief | pre-election | total | periods present |
|---|---|---|---|---|---|
| NDA (Centre) | 22 | 33 | 39 | 94 | 2000–04, 2010–14, 2015–19, 2020–26 |
| BJP (states) | 28 | 10 | 31 | 69 | all five |
| INC (states) | 24 | 10 | 22 | 56 | all five |
| UPA (Centre) | 8 | 13 | 13 | 34 | 2000–04, 2005–09, 2010–14 |
| AIADMK | 5 | 4 | 3 | 12 | all five |
| TMC | 4 | 1 | 6 | 11 | 2010–14 onward |
| BJD | 4 | 3 | 3 | 10 | all five |
| TDP | 5 | 2 | 3 | 10 | 2000–04, 2010–14 onward |
| JD(U) | 2 | 3 | 5 | 10 | 2005–09, 2010–14, 2020–26 |
| DMK | 5 | 2 | 3 | 10 | 2005–09, 2020–26 |
| BRS (TRS) | 2 | 2 | 4 | 8 | 2010–14 onward |
| AAP | 3 | 2 | 3 | 8 | 2015–19, 2020–26 |
| LDF | 0 | 2 | 5 | 7 | all five |
| Shiv Sena | 3 | 1 | 3 | 7 | 2015–19, 2020–26 |
| SP | 3 | 1 | 2 | 6 | 2005–09 to 2015–19 |
| YSRCP | 3 | 1 | 1 | 5 | 2015–19, 2020–26 |
| JMM | 0 | 1 | 3 | 4 | 2020–26 |
| BSP | 1 | 0 | 2 | 3 | 2005–09, 2010–14 |
| UDF | 2 | 0 | 1 | 3 | 2010–14 onward |
| JKNC | 2 | 1 | 0 | 3 | 2010–14, 2020–26 |
| INLD, SAD, CPI(M), MNF, NPP, ZPM | — | — | — | 2 each | |
| RJD, PDP, JD(S), SDF, NDPP, SKM, TVK | — | — | — | 1 each | |

Thirty-three governing parties or coalitions appear. Where a state was run by a coalition, the row carries
the chief minister's party (e.g. Shiv Sena for the 2024 Mahayuti budget, JD(S) for the 2018 Karnataka
waiver). The allies stay visible through `enactedBy`, e.g. Ajit Pawar (NCP) for Ladki Bahin.

Most named enactors: Narendra Modi 40 (as PM, including state schemes he launched such as Subhadra, Mahtari
Vandan and Mahila Rojgar), Manmohan Singh 11, P. Chidambaram 10, Nitish Kumar 10, Nirmala Sitharaman 10,
Mamata Banerjee 9, and Naveen Patnaik, Jaswant Singh, Siddaramaiah and K. Chandrasekhar Rao 8 each.

## 4. Counts by state

`IN` holds Union measures with no single state. Union measures sited in one state, such as a PM-KISAN
release at Belagavi or central flood aid, carry that state and `level: 'Centre'`.

| state | 2000–04 | 2005–09 | 2010–14 | 2015–19 | 2020–26 | total | distribution / relief / pre-election |
|---|---|---|---|---|---|---|---|
| IN | 19 | 12 | 12 | 17 | 33 | 93 | 29 / 23 / 41 |
| TN | 2 | 5 | 4 | 4 | 12 | 27 | 11 / 8 / 8 |
| KA | 2 | 2 | 2 | 5 | 8 | 19 | 8 / 5 / 6 |
| WB | 0 | 2 | 2 | 4 | 11 | 19 | 9 / 3 / 7 |
| AP | 3 | 1 | 2 | 5 | 7 | 18 | 9 / 4 / 5 |
| MH | 1 | 2 | 3 | 4 | 8 | 18 | 4 / 5 / 9 |
| UP | 0 | 3 | 4 | 4 | 4 | 15 | 6 / 3 / 6 |
| BR | 1 | 2 | 1 | 1 | 9 | 14 | 2 / 5 / 7 |
| OD | 2 | 2 | 3 | 3 | 3 | 13 | 6 / 4 / 3 |
| PB | 1 | 3 | 0 | 2 | 7 | 13 | 6 / 2 / 5 |
| KL | 1 | 1 | 2 | 3 | 5 | 12 | 2 / 4 / 6 |
| TG | 0 | 0 | 1 | 2 | 9 | 12 | 6 / 2 / 4 |
| RJ | 1 | 1 | 3 | 1 | 5 | 11 | 3 / 1 / 7 |
| HR | 2 | 1 | 0 | 3 | 4 | 10 | 4 / 1 / 5 |
| CT | 0 | 1 | 2 | 2 | 5 | 10 | 4 / 1 / 5 |
| GJ | 2 | 2 | 0 | 1 | 4 | 9 | 3 / 2 / 4 |
| MP | 1 | 1 | 1 | 2 | 4 | 9 | 2 / 1 / 6 |
| AS | 0 | 1 | 1 | 1 | 6 | 9 | 1 / 3 / 5 |
| HP | 0 | 0 | 1 | 1 | 7 | 9 | 3 / 2 / 4 |
| DL | 0 | 1 | 1 | 3 | 3 | 8 | 2 / 1 / 5 |
| UT | 0 | 0 | 4 | 1 | 3 | 8 | 3 / 5 / 0 |
| JK | 0 | 0 | 3 | 2 | 2 | 7 | 3 / 4 / 0 |
| MZ | 1 | 0 | 1 | 0 | 3 | 5 | 4 / 1 / 0 |
| JH | 0 | 0 | 0 | 1 | 4 | 5 | 0 / 1 / 4 |
| SK | 0 | 0 | 1 | 1 | 2 | 4 | 1 / 2 / 1 |
| GA | 1 | 0 | 1 | 0 | 1 | 3 | 2 / 0 / 1 |
| TR | 0 | 0 | 0 | 1 | 2 | 3 | 1 / 1 / 1 |
| ML | 0 | 0 | 0 | 0 | 2 | 2 | 1 / 0 / 1 |
| MN | 0 | 0 | 0 | 0 | 2 | 2 | 1 / 1 / 0 |
| NL | 0 | 0 | 0 | 0 | 1 | 1 | 0 / 0 / 1 |
| AR | 0 | 0 | 0 | 0 | 1 | 1 | 1 / 0 / 0 |

All 30 charter states and the Union appear.

## 5. Sources and tools the lanes used

The ledger's `sourceUrl`s come from 51 hosts. The top ones are Indian Express 61, The Hindu 46, Times of India
44, indiabudget.gov.in 31, New Indian Express 27, Frontline 24, PRS 22, Hindustan Times 15 and pmindia.gov.in 11.

**Open and official data**, as the lane notes record it:

- **indiabudget.gov.in**: Union budget speeches (2000-01 Part A, 2002-03, 2003-04, 2004-05 interim and July,
  2005-06, 2008-09, 2009-10 interim and July, 2011-12, 2013-14, 2014-15 interim, 2015-16, 2017-18, 2018-19,
  2019-20 interim, 2021-22, 2023-24, 2024-25 interim, 2025-26, 2026-27), Economic Surveys 2002-03 and
  2011-12 to 2013-14, and the Finance Bill 2026 memorandum. This is the backbone of the Union pre-poll and
  distribution rows: who presented each measure and its size.
- **PRS Legislative Research**: state budget analyses (prsindia.org/budgets/states) for AP, CT, HR, JH, KA,
  MH, MN, MP, OD, PB, TG, WB, AS, DL and KL; Union Budget and Demand-for-Grants analyses; bill texts (the Disaster
  Management Act, VB-G RAM G). These supply most `annualCost` lines for states.
- **Finance Commission** (fincomindia.nic.in): the 11th FC report, for the 2000–05 Calamity Relief Fund.
- **Rajya Sabha Standing Committee on Home Affairs, 261st Report "Disaster Management"** (Aug 2026): the
  history of the disaster funds from the 11th to the 16th Finance Commission, and MHA's SDRF/NDRF release series.
- **PIB, PMO (pmindia.gov.in), DD News, All India Radio (newsonair.gov.in), CMO Gujarat, NHM, the NFSA portal,
  dbtbharat.gov.in, pmcares.gov.in and pmnrf.gov.in** (audited statements), and Haryana's Social Justice
  department (pension rate history 1987–2025).
- **ECI results portal**: only the May 2026 party-wise pages (West Bengal, Assam, Tamil Nadu) were live.
  Earlier result pages return 404, so older tallies are cited through outlets that quote ECI figures.
- **Courts**: Indian Kanoon (S. Subramaniam Balaji v Govt of Tamil Nadu, 2013), LiveLaw and Verdictum for
  Supreme Court and High Court orders.
- **CAG**: audits of PM-JAY, Ujjwala, the 2008 debt waiver, PAHAL, KALIA, Delhi Ladli, UP laptops, the Uttarakhand
  2013 floods, the Chennai 2015 floods, Kerala tsunami rehabilitation, Amphan relief and NDRF transfers.
  cag.gov.in serves a JavaScript shell to scripts, so these were read through the outlets that reported the
  tabling.
- **Open research**: PLOS One (the Chiranjeevi evaluation), the Lancet JSY evaluation via the NCBI E-utilities
  API, the IGC cycle-scheme study via Ideas for India, and Factly/Dataful series cross-checked against official
  tables.
- **Checked, not used for these items**: RBI *State Finances: A Study of Budgets*, data.gov.in, Open Budgets
  India / CivicDataLab, sansad.in and MyNeta/ADR. They gave nothing beyond what PRS or the reported
  replies gave for these measures.

**Open-source tools and methods.** WebSearch was unavailable (quota exhausted), so discovery ran through:

- **Google News RSS**, with article links decoded to publisher URLs through Google's redirect endpoint. Where
  decoding hit a captcha, links were resolved through the publishers' own date sitemaps: Times of India
  monthly sitemaps back to 2001, Indian Express and New Indian Express daily sitemaps, and the Deccan Herald,
  BusinessLine and Frontline archive sitemaps listed in their robots.txt. The Hindu's archive sitemaps are
  disallowed in its robots.txt and were not used.
- **Bing News RSS and DuckDuckGo HTML**, which were mostly useless or rate-limited.
- **Outlet WordPress JSON search**, e.g. EastMojo and Orissa Post.
- **Wikipedia reference lists and `action=raw`/`render`**, used as a *finder* and at most as a second source for
  poll dates. No row rests on Wikipedia.
- Pages were read with curl or Python `requests` through an HTML-to-text filter and JSON-LD `articleBody`
  extraction, with WebFetch as a fallback. PDFs were read with `pypdf`.
- reddit.com was never used.

The ledger itself was built from the bank with a short Node script (dependency-free, run in the session
scratchpad). The script grouped items into hand-cut rows and copied the source, poll, party and enactors from
the items. It then checked that every `itemIds` entry exists, that every row's source is one of its items'
sources, that polls follow launches, and that every number in a row appears in its items.

**Blocked or unreachable** (lanes used another outlet reporting the same primary figure): NDTV, Moneycontrol,
News18, Firstpost, ThePrint (Cloudflare), india.com, Telegraph India, The Statesman, web.archive.org, ndma.gov.in,
pre-2005 PIB archive pages, eci.gov.in (JS shell) and older results.eci.gov.in pages.

## 6. Bank items not in the ledger (21)

| reason | items |
|---|---|
| Opposition or party manifesto pledges that were never enacted as measures | hpe101 (YSR pension pledge, 2004), hpe107 (TDP cash transfer, 2009), hpe114 (Congress paddy price, CT 2013), hpe115 (AAP water, DL 2013), hpe124 (TRS manifesto pensions, 2018), hpe129 (BJP free-vaccine pledge, BR 2020), hpe205 (Congress 'Ghar nu Ghar', GJ 2012), hpe207 (BJP ₹1 rice, KA 2013) |
| ECI, court or government procedure, not money | hpe006 (early Lok Sabha poll, 2004), hpe014 (Budget 2012 date moved), hpe034 (freebies PIL affidavit), hpe037 (EC halts Viksit Bharat messages), hpe122 (Gujarat 2017 poll dates) |
| Aggregate spending bills, not single measures | hbx013 (Union subsidy bill 2026-27), hbx014 (food subsidy 2020-21), hbx015 (fertiliser subsidy), hst108 (Punjab power-subsidy bill) |
| Analysis, not a measure | hdb409 (RBI working group on state loan waivers) |
| Fund predates the 2000–2026 window | hrf041 (PMNRF, set up 1948; its 2026 PMO note, hrf040, sits with PM CARES) |
| Criminal cases against a named person or a contractor, not measures | hst302 (Bengal PDS case), hst212 (BMC jumbo Covid centres case) |

Case outcomes that *are* results of a measure, and that name no one, stay in the ledger with the bank's
precise status words: the Himachal scholarship chargesheet, the Sheopur flood-compensation arrest, the
Ernakulam flood-fund chargesheet and the CAG's Amphan findings.

## 7. Known gaps

**Coverage**

- **The North-East is thin.** Nagaland and Arunachal have 1 row each, Meghalaya and Manipur 2, Tripura 3 and
  Sikkim 4. Nothing before 2010 except Mizoram 2002 and Assam 2007. The lanes found no fetchable, specific
  sources for Assam's Majoni/Mamoni (2009), Meghalaya under Mukul Sangma, Nagaland under the NPF, Tripura's
  Left-era pensions, or Manipur's CMHT.
- **2000–04 is the thinnest era** (40 rows, 19 of them Union). Before 2005, 16 states have no row, three of
  which (CT, JH, UT) were only formed in November 2000 and one (TG) in 2014. The
  lanes found no specific, fetchable pre-poll handout for Tamil Nadu 2001, Delhi 2003, Chhattisgarh 2003, or
  the Hindi-belt states before 2005. The RJD-led Bihar of 2000–05 has only a relief row.
- **Mode holes by state.** UT, JK, MZ, MN and AR have no pre-election row. JH and NL have no plain distribution
  row. GA and ML have no relief row (the Goa floods of July 2021 had no relief figure).
- **Verified but not written** (reserves in the lane notes that would make good rows after a bank item is
  added):
  - Bharat rice and atta (2024)
  - the ₹2 fuel cut of March 2024
  - the withdrawal of small tax demands (interim budget 2024)
  - PM-KISAN's 14th (Sikar) and 15th (Khunti) releases
  - Telangana Rythu Bima (2018)
  - UP's free-ration extension (2022) and Bal Seva Yojana (2021)
  - Delhi's free LPG on festivals (2026)
  - Karnataka Bhagyalakshmi (2006)
  - the Kerala Ockhi helicopter bill (2018)
  - Surat flood relief (2026)
  - the NDRF recovery-window awards
- **Researched but unsourced:** Annapurna (2000), Rajiv Aarogyasri (2007), Kerala CHIS (2008), Gujarat
  Vanbandhu (2007), Haryana Ladli (2005), UP Samajwadi Pension, TN free bicycles (2001), Pudhumai Penn (2022)
  and Kalyana Lakshmi (2014).

**Data inside the rows**

- **186 rows have no `annualCost` and 184 no `reach`.** RBI *State Finances: A Study of Budgets* (its tables
  on cash transfers to women, farm loan waivers and subsidies) was not used by any lane. It is the natural next
  source for comparable cost lines, for example for Gruha Lakshmi, the Kalaignar Magalir Urimai payouts and
  Maiya Samman.
- **`launchedApprox` rows (10) need true launch dates:** PM Jan Dhan, Saubhagya, One Nation One Ration Card,
  PMAY-U's extension, Grihini Suvidha, the Maharashtra CM's Covid fund, Chiranjeevi (Rajasthan), SEDP (Mizoram),
  Nanda Gaura, and Kerala's 2000–01 treasury curbs.
- **46 rows name no enactor**, because the bank names none. These are mainly Finance Commission awards,
  court-ordered measures, state relief episodes, and schemes such as PMFBY, PM Jan Dhan and Chiranjeevi
  (Gujarat) whose items do not say who launched them.
- **`gapDays` is missing on 27 of the 164 poll rows.** No fetched page fixed the date: India Shining ads,
  WB 2011, CG 2013, the 2008 launches of Bhamashah and Delhi Ladli, and the Ladki Bahin advance. In 2 rows
  (Namo Shetkari, Maiya Samman) the gap was dropped because the item counts it from a later event. The
  colour-TV row carries no poll: its 2006 launch followed that year's election, and the ECI's March 2011 halt is
  in its outcome.
- **ECI results before May 2026** are cited through outlets, because the results portal's archived pages
  return 404. Refresh from ECI statistical reports when they can be reached.
- **Statuses to watch** (they change row outcomes too):
  - the Mahila Rojgar petition in the Patna HC
  - the Delhi Lakshmi endorsement-rule PILs
  - the Punjab Mawan Dhiyan Satikar PIL (5 Oct 2026)
  - the Himachal scholarship trial
  - the Sheopur case
  - the NFS (Amendment) draft
  - NSAP rates
  - the women's reservation amendment
  - Telangana's unverified ₹2,500 Mahalakshmi cash (only the free bus is verified)

**Refreshing the ledger.** When a bank item changes, search the JSON for its id and update each row that lists
it. When a new money-trail item lands, either add it to an existing row's `itemIds` (an audit, reach or cost
update) or cut a new row (a new measure, hike or pre-poll payout). Copy `sourceUrl`, `poll`, `party` and
`enactedBy` from the item, keep every number to what the item states, and re-run the number check.
