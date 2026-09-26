# States — East & North-East (`hst300`–`hst351`) — research notes

Lane file: `editions/hisaab/bank/states-east.mjs` (`HISAAB_STATES_EAST`, 52 items).
Researched and verified September 2026; every item has `asOf: '2026-09'`.
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/states-east.mjs` → OK (whole bank also OK).

## Counts

| state | items | ids |
|---|---|---|
| WB | 10 | hst300–hst309 |
| OD | 7 | hst310–hst316 |
| AS | 7 | hst317–hst323 |
| AR | 4 | hst324–hst327 |
| MN | 4 | hst328–hst331 |
| ML | 4 | hst332–hst335 |
| MZ | 4 | hst336–hst339 |
| NL | 4 | hst340–hst343 |
| SK | 4 | hst344–hst347 |
| TR | 4 | hst348–hst351 |

Difficulty: simple 17 / expert 16 / extreme 19. Answer slots 14/12/12/14.
Kinds: institution 17, scam 14, spend 14, scheme 7.

## How `govt` was assigned

`govt` = the party governing **the state** when the conduct or fact in the item happened, not when a
court or agency later acted. Examples: hst319 (APSC cash-for-jobs, 2014 recruitment, convicted 2024)
→ `INC`; hst316 (OMC penalties for 2000-11 over-mining, paid 2017-22) → `BJD`; hst314 (nutrition
centres idle 2020-March 2024) → `BJD`; hst309/hst311 (elections that ended a party's rule) → the
outgoing party. hst326 (Arunachal, PPA government in Dec 2016) → `Other`. Manipur items for
Feb 2025–Feb 2026 → `President's Rule` (the Centre, NDA, administered the state).

Nagaland: the NDPP merged into the Naga People's Front in October 2025 (hst343). NPF is not in
`GOVTS`, so any Nagaland fact dated after Oct 2025 would have to be `Other`; this lane uses 2019–2025
facts for Nagaland, so all four are `NDPP`.

Distribution: BJP 18, TMC 8, BJD 4, NDPP 4, SKM 4, NPP 3, ZPM 3, INC 2, President's Rule 2,
CPI(M) 2, MNF 1, Other 1.

Balance check (charter §2.5): TMC-era wrongdoing items are WB-heavy (hst300–306) because the TMC
governed West Bengal from 2011 to May 2026 and that is where the court/agency record is. BJP-governed
states carry their own accountability items: hst324 (SC-ordered CBI enquiry, Arunachal CM's kin),
hst325 (APPSC leak), hst315 (Odisha SI exam scam), hst318 (CAG on NRC), hst350 (CAG on Tripura PSUs),
hst307 (Annapurna payment delays). The new WB BJP government appears in hst307–hst308. Congress-era
items: hst319, hst332. Left-era: hst348–hst349. BJD-era audit findings: hst314, hst316.

## Sources (by item)

PRS state budget analyses (prsindia.org/budgets/states/…) carry most money facts: hst307, hst312,
hst313, hst320, hst321, hst323, hst327, hst330, hst331, hst338, hst339, hst341, hst347, hst350, hst351.
Court/legal outlets: LiveLaw (hst305), SCC Online (hst306), LawBeat (hst304). Agency/official:
All India Radio / newsonair.gov.in (hst309, hst310, hst322, hst328, hst329, hst342 and several
secondary sources). News outlets: The Tribune, The Federal, The Week, ThePrint, ANI, Business
Standard, Millennium Post (PTI copy), The Hindu, The Indian Express, New Indian Express, Scroll,
Times of India, India Today, Outlook, Al Jazeera.

| id | state | govt | kind | subtopic | primary source host (+extra) |
|---|---|---|---|---|---|
| hst300 | WB | TMC | scam | WBSSC 2016 school recruitment | tribuneindia.com (+2) |
| hst301 | WB | TMC | scam | School-jobs case: cash seizure | thefederal.com (+2) |
| hst302 | WB | TMC | scam | Ration-distribution (PDS) case | theweek.in (+2) |
| hst303 | WB | TMC | scam | Narada sting case | aninews.in (+2) |
| hst304 | WB | TMC | scam | Cattle-smuggling case | lawbeat.in (+2) |
| hst305 | WB | TMC | scam | R.G. Kar hospital finances case | livelaw.in (+1) |
| hst306 | WB | TMC | scam | Saradha chit fund | scconline.com (+1) |
| hst307 | WB | BJP | scheme | Annapurna Bhandar | prsindia.org (+2) |
| hst308 | WB | BJP | institution | CAG reports tabled after a gap | newindianexpress.com (+1) |
| hst309 | WB | TMC | institution | 2026 Assembly election | newsonair.gov.in (+1) |
| hst310 | OD | BJP | scheme | Subhadra Yojana | newsonair.gov.in (+1) |
| hst311 | OD | BJD | institution | 2024 Assembly election | outlookindia.com (+1) |
| hst312 | OD | BJP | spend | State debt compared | prsindia.org (+3) |
| hst313 | OD | BJD | scheme | KALIA scheme | prsindia.org (+1) |
| hst314 | OD | BJD | spend | PVTG nutrition centres (CAG) | newindianexpress.com |
| hst315 | OD | BJP | scam | Police SI exam paper leak | newindianexpress.com (+2) |
| hst316 | OD | BJD | spend | OMC mining penalties (CAG) | newindianexpress.com |
| hst317 | AS | BJP | institution | NRC final list | indiatoday.in |
| hst318 | AS | BJP | spend | NRC update: CAG audit | scroll.in |
| hst319 | AS | INC | scam | APSC cash-for-jobs case | timesofindia.indiatimes.com |
| hst320 | AS | BJP | scheme | Orunodoi | prsindia.org |
| hst321 | AS | BJP | scheme | Orunodoi lump-sum transfer | prsindia.org (+1) |
| hst322 | AS | BJP | institution | 2026 Assembly election | newsonair.gov.in |
| hst323 | AS | BJP | spend | Committed spending | prsindia.org |
| hst324 | AR | BJP | scam | Contracts to CM-linked firms (PIL) | millenniumpost.in (+2) |
| hst325 | AR | BJP | scam | APPSC paper leak 2022 | newindianexpress.com (+1) |
| hst326 | AR | Other | institution | 2016 mass switch to BJP | indianexpress.com (+1) |
| hst327 | AR | BJP | spend | Salary bill | prsindia.org |
| hst328 | MN | President's Rule | institution | Budget passed by Parliament | newsonair.gov.in (+1) |
| hst329 | MN | BJP | institution | President's Rule revoked | newsonair.gov.in (+1) |
| hst330 | MN | President's Rule | spend | Special central grant | prsindia.org |
| hst331 | MN | BJP | institution | Government vacancies | prsindia.org |
| hst332 | ML | INC | institution | Rat-hole mining ban | theprint.in (+1) |
| hst333 | ML | NPP | institution | Ksan mine flooding 2018 | theprint.in (+1) |
| hst334 | ML | NPP | scam | Missing seized coal | newindianexpress.com (+2) |
| hst335 | ML | NPP | scam | Illegal-mine blast 2026 | newindianexpress.com (+1) |
| hst336 | MZ | MNF | institution | 2023 Assembly election | newindianexpress.com |
| hst337 | MZ | ZPM | spend | Bairabi–Sairang rail line | newindianexpress.com (+1) |
| hst338 | MZ | ZPM | spend | Stamp duty and Bana Kaih | prsindia.org |
| hst339 | MZ | ZPM | spend | Fiscal deficit overshoot | prsindia.org |
| hst340 | NL | NDPP | scam | Backdoor police appointments | newindianexpress.com |
| hst341 | NL | NDPP | spend | Committed spending | prsindia.org (+1) |
| hst342 | NL | NDPP | institution | Urban local body polls 2024 | newsonair.gov.in |
| hst343 | NL | NDPP | institution | NCP MLAs merge into ruling party | newindianexpress.com (+1) |
| hst344 | SK | SKM | spend | Teesta-III dam | aljazeera.com (+2) |
| hst345 | SK | SKM | institution | 2024 Assembly election | newindianexpress.com |
| hst346 | SK | SKM | scheme | Sikkim Aama Yojana | newindianexpress.com |
| hst347 | SK | SKM | spend | Capex financed by central loans | prsindia.org |
| hst348 | TR | CPI(M) | institution | 2018 Assembly election | indianexpress.com |
| hst349 | TR | CPI(M) | institution | Terminated teachers | newindianexpress.com (+1) |
| hst350 | TR | BJP | spend | PSU returns (CAG) | prsindia.org |
| hst351 | TR | BJP | scheme | Overseas placement scheme | prsindia.org |

Outlets outside the charter's example list, flagged for the reviewer: The Federal (hst301),
LawBeat (hst304), Millennium Post (hst304 extra; hst324 is PTI copy), SCC Online (hst306), Al Jazeera
(hst344), Careers360 (hst325 extra, PTI copy), The Hans India (hst301 extra, IANS copy), Moneylife
(hst306 extra), All India Radio (public broadcaster). Where a named person appears, at least one
2026 source is attached.

## Items dropped and why

- **Assam PPE-kit supply allegation (2020, reported 2022)** — dropped. Could not fetch a page with the
  current status of the related defamation litigation, and the firm at the centre is linked to the
  CM's spouse, a private businessperson (charter §2.7 risk). Revisit only with a court-record source.
- **Arunachal PDS / hill-transport-subsidy scam (CBI)** — only a 2010 arrest headline found; no
  verified outcome. Dropped.
- **Justice M.B. Shah Commission figures (Odisha mining)** — not verified directly. Replaced by the
  CAG audit of OMC penalties (hst316), which cites the Supreme Court's Aug 2017 ruling.
- **Odisha chit funds (Seashore, Artha Tatwa)** and **Rose Valley (WB/Tripura)** — not verified within
  the search budget. Saradha (hst306) covers the chit-fund theme.
- **Manipur violence death toll and displacement numbers** — no primary figure fetched. Left out on
  purpose; the Manipur items use institutional and fiscal facts only (President's Rule, relief grant,
  vacancies). No ethnic or communal framing anywhere in the NE items.
- **Manipur Development Society case (former CM, CBI)** — status not verified. Dropped.
- **Nagaland's first women MLAs (2023)** — no fetched source. Replaced by the 2024 urban local body polls (hst342).
- **Odisha joining AB-PMJAY (Jan 2025)** — PIB page URL not retrievable. Dropped.
- **Standalone Lakshmir Bhandar cost item** — folded into hst307 (Rs 26,700 crore in 2025-26).
- **Seat counts for WB 2026 and Tripura 2018** — sources differ (AIR: 206 declared with one pending;
  other tallies 207/208) or only show leads. The questions ask "how many years of rule ended" instead.
- **Supreme Court's July 2016 restoration of the Nabam Tuki govt (Arunachal)** — not fetched. Replaced
  by the Dec 2016 PPA→BJP switch (hst326).
- **Meghalaya Katakey panel 2026 figures ("18.46 lakh tonnes missing", Shillong Times)** — page not
  fetched. Not used.

## Contested or sensitive items (reviewer: read these first)

- **hst303 Narada** names Suvendu Adhikari (WB CM since May 2026) as someone the ED said in Sept 2021
  it would keep probing. He was not charge-sheeted, and the TMC called that partisan. No later filing
  was found. The stem asks only which court ordered the probe.
- **hst324 Arunachal contracts** is a sitting CM (Pema Khandu). The Supreme Court ordered a CBI
  *preliminary enquiry* on 6 Apr 2026. There is no FIR or charge sheet. The state called the PIL
  "sponsored litigation". The Rs 1,270 crore figure is what the petitioners told the court.
- **hst301 Partha Chatterjee**: the cash was seized from homes linked to an associate. The associate
  is deliberately not named (private individual). His "victim of conspiracy" denial is included.
- **hst302 Jyotipriya Mallick**: his March 2026 claim that the case is a "conspiracy" is included.
- **hst305 Sandip Ghosh**: this is the financial-irregularities case only. The item does not touch the
  2024 rape-murder case beyond naming the institution.
- **hst334 Meghalaya missing coal**: the minister is not named, and his later "cannot blame just the
  rain" clarification is included.
- **hst321 Orunodoi Rs 9,000 transfer**: the stem states only dated facts (10 Mar 2026; results 4 May
  2026). It does not claim the transfer was timed for the vote.
- **hst307 Annapurna Bhandar**: the Quint ground report (payment delays) is set against the CM's claim
  of 1.48 crore women paid.
- **hst308 CAG / Amphan**: the CM announced FIRs "if" the audit shows wrongdoing. The item says
  plainly that this is an announcement, not a finding.
- **hst317/hst318 NRC**: numbers and audit findings only. No framing by community.

## Statuses at risk of going stale (re-check first)

| id | what could change | next check |
|---|---|---|
| hst301 | CBI plea (Sept 2026) that Partha Chatterjee breached bail conditions | Oct 2026 |
| hst305 | SC bail plea of Sandip Ghosh; CBI reply due 15 Oct 2026 | Oct 2026 |
| hst324 | SC monitoring of the CBI enquiry; possible FIR or closure | monthly |
| hst303 | Narada trial; any action on others named in the tapes under the new WB govt | quarterly |
| hst306 | Saradha trials after the Aug 2026 bail | quarterly |
| hst302, hst304 | PMLA/CBI trials; both men are now outside or in revolt against TMC | quarterly |
| hst315 | Odisha SI scam: CBI may examine the board chairman | Oct 2026 |
| hst335 | Meghalaya blast judicial commission report | quarterly |
| hst340 | possible appeal against the HC quashing of 935 Nagaland appointments | quarterly |
| hst349 | Tripura teachers' matters in the Supreme Court | quarterly |
| hst319, hst325 | appeals (APSC) and trial outcome (APPSC) not verified | quarterly |
| hst344 | Teesta-III rebuild (SC notice reported Mar 2026) and stake sale | quarterly |
| hst307 | Annapurna payment backlog | Oct 2026 |

## Method notes

WebSearch and WebFetch were used first. When the session's WebSearch budget ran out, the rest was
found through publisher and official site searches (New Indian Express, newsonair.gov.in), Google/Bing
News RSS for headline discovery, and Wikipedia reference lists (links only, never cited). Every
`sourceUrl` page was fetched and read. No Wikipedia page is used as a source.

## Fact audit (26 Sep 2026)

Independent audit of all 52 items (hst300–hst351) by a second agent. Every `sourceUrl` and every
`sources` entry was fetched (curl, or WebFetch where the site blocks curl: ThePrint, The Week) and
the correct option's fact, numbers and dates were checked against the page. Newest reporting to
26 Sep 2026 was searched (Google News RSS + web search) for every item with `people`, `status` or
kind `scam`. Result: **52 checked, 0 dropped, 52 kept; 15 `otherSide` rows added; 26 items changed.**
Validator: `node scripts/hisaab-validate.mjs` → OK for the whole bank; `node --test
tests/hisaab-bank.test.mjs` passes. No id changed.

### Fixes (by item)

| id | what changed and why |
|---|---|
| hst300 | status: ED filed further charge sheets June and Aug 2026 (Tribune). `otherSide`: the TMC government's appeal calling the HC order "arbitrary" and the then CM's promise of fresh recruitment (Tribune, AIR). New source added. |
| hst301 | status corrected: he is charge-sheeted by both ED and CBI in several cases (not only "CBI Dec 2024"); latest ED filings June and 20 Aug 2026 (Pioneer/PTI); CBI's 17 Sept 2026 bail-breach plea dated. `otherSide`: "victim of a conspiracy" (Tribune) and "This is not my money" (Zee News, 31 Jul 2022). The "money was not his" claim had no fetched source before; now it does. |
| hst302 | `otherSide`: "a deep conspiracy by a political party" (NIE/PTI, Mar 2026). Sources added for the 12 Dec 2023 charge sheet (Deccan Herald: filed 46 days after arrest) and for his June 2026 exit from TMC posts (Millennium Post); Habra loss in May 2026 confirmed. |
| hst303 | status: the CBI said in May 2021 it lacked Lok Sabha sanction to probe Suvendu Adhikari (an MP in 2014) (Scroll); no later filing and no public response from him found. `otherSide`: TMC's "using the central agencies to throttle the voice of the opposition" (Business Standard). |
| hst304 | status: ED-case bail dated (Rouse Avenue court, 20 Sept 2024, ANI). `otherSide`: SC noted the trial would not start soon; his counsel blamed the ED for delay; no public denial by Mondal found after searching. |
| hst305 | explanation/status: CBI charge sheet; state sanction for the CBI case (2025) and the new BJP government's sanction for the ED case (18 May 2026, AIR). `otherSide`: his SC bail plea says no money trail or unaccounted wealth has been traced to him (Pioneer/PTI, 26 Aug 2026). Note: the plea says the supplementary charge sheet attributes vendor gratification to the co-accused petitioner; the item does not name the petitioner. |
| hst306 | "in custody since Dec 2016" reworded: SCC Online says custody *in that CBI case* since 30 Dec 2016. `otherSide`: the TMC government "strongly resisted" the CBI transfer; the court said state police made no headway on conspiracy or money trail (Moneylife, 9 May 2014). |
| hst308 | "no charges reported as of July 2026" → "no charge sheet reported as of Sept 2026" (searched; consistent with relief-states hrf123, which notes police complaints since May 2026). |
| hst310 | "in two instalments" removed (not in any fetched source). Explanation/outcome no longer say the PM launched it, and Narendra Modi removed from `enactedBy` (he launched it; the Odisha government enacted it): dist-east hdb335 asks who launched Subhadra. |
| hst311 | "first time the BJP formed a government of its own in Odisha" removed (not in Outlook or PRS); replaced with the sourced first-budget date (PRS 2024-25: 25 Jul 2024). |
| hst312 | "low debt was built up under the BJD" removed (not in PRS); replaced with PRS's 13.1% (2025-26 RE). |
| hst314 | "Most of the period" → "The whole period": 2020–Mar 2024 was entirely BJD rule. |
| hst315 | status: the SC asked Odisha on 24 Sept 2026 whether it was treating the board chairman as an accused; he is not named one (Bar & Bench). `otherSide`: CBI says the agencies kept the board "completely in dark"; no reply from the accused reported. |
| hst316 | "The BJD governed throughout" → "BJD-led governments were in office throughout" (the BJP was a coalition partner until 2009). |
| hst319 | **Status was stale.** The Gauhati HC suspended the sentences and bailed 26 convicts pending appeal (Assam Tribune, 1 Sept 2024); appeals pending as of Apr 2026 (The Federal). Sentences added (ex-chairman 14 years, AIR 29 Jul 2024). Recruitment date corrected to "posts advertised in 2013, filled in 2014" (AIR, Assam Tribune). `otherSide`: the HC suspension. |
| hst321 | **Giveaway removed:** outcome and `poll.result` said "BJP won 82 of 126 seats", which is hst322's answer. Now "BJP-led NDA won a third straight term, past the 64-seat majority mark". Source added for the 9 Apr 2026 polling date (AIR). |
| hst324 | status: CBI reported state non-cooperation (17 Jul 2026 report; SC, 3 Aug 2026). `otherSide`: Khandu's "I am innocent", allegations "politically motivated", pledge to cooperate (ANI, 5 May 2026) plus the state's "sponsored litigation" plea. Next SC hearing was 25 Sept 2026; no outcome reported yet. |
| hst325 | status: the state dismissed an officer over the leak (Dec 2024, India Today NE); no trial verdict found. `otherSide`: the state itself sought the CBI probe and suspended the secretary and joint secretary; the APPSC chairman resigned on moral grounds (NIE, Careers360). |
| hst326 | status: Khandu says he is innocent in the separate CBI enquiry. `otherSide`: his reason for the switch, that the PPA suspended MLAs "without serving a notice", "very undemocratic" (Indian Express). |
| hst332 | "the state has said mining outside that framework stays illegal" (unsourced attribution) → plain statement that such mining is illegal. |
| hst333 | "a rescue ... that involved the Navy ... only a few miners" was not in ThePrint → "only two bodies were ever retrieved" (ThePrint). |
| hst334 | status: the state told the HC that FIRs had been lodged (NIE, 25 Jul 2025), so "no charges" became "no charge sheet". `otherSide`: minister's "cannot blame just the rain" clarification. |
| hst335 | status: commission had six months from 14 Feb 2026; no report made public by Sept 2026 (sittings May 2026, site visit July). `otherSide`: CM Conrad Sangma's "full action against those responsible" and the judicial commission (NIE, 5 Feb 2026); `people` now lists him. Mongabay added (two owners arrested). |
| hst336 | "Congress had ruled from 2008 to 2018" was not in the source → "The MNF had governed in 1998–2008 and 2018–23" (NIE). Outgoing CM left unnamed so the item needs no `people`/`status`. |
| hst340 | **Status was stale.** The Supreme Court dismissed the SLP on 21 Jan 2025; Nagaland advertised 1,176 constable posts on 30 Sept 2025 (Morung Express). Subtopic "Backdoor…" → "Unadvertised police appointments" ("backdoor" is the petitioners' word). `otherSide`: the state's Police-Manual argument and the DGP's pledge to re-advertise. |
| hst344 | "A 2025 expert-panel nod" → "approval to rebuild, reported in Feb 2025" (Scroll says only "a few weeks" before 2 Feb 2025). |

Checked and unchanged (source states the answer and the numbers): hst307, hst309, hst313, hst317,
hst318, hst320, hst322, hst323, hst327–hst331, hst337–hst339, hst341–hst343, hst345–hst351.

### Distractors and stems

No wrongdoing question has a real person as an option. Every stem attributes: "the ED said",
"allegedly given", "in a probe into alleged irregularities", "the CAG found". hst334 still leaves the
minister unnamed. Motive words: the only one was the "Backdoor" subtopic (hst340), now reworded.

### Giveaway check

A script compared every answer in the bank (`LANES` in `bank/index.mjs`) with this lane's
`explanation`, `outcome`, `otherSide`, `status` and `poll.result`. Two real giveaways were fixed:
hst321 (82 seats, hst322's answer) and hst310 (the PM as launcher, dist-east hdb335's answer). The
remaining hits are coincidental numbers in unrelated contexts, such as Orunodoi "Rs 6,000 crore" and
PM-KISAN "₹6,000".

### Unresolved (outside this lane's edit scope, or not verifiable)

- **Other lanes give away this lane's answers.** Their auditors should re-angle these:
  dist-east hdb307.outcome and poll-states hpe148 ("ending 15 years of TMC rule" gives hst309);
  dist-east hdb323.outcome/poll.result ("82 of 126" gives hst322); dist-east hdb317.poll.result and
  poll-states hpe145.outcome/poll.result ("78 of 147" gives hst311); poll-states hpe145.explanation
  ("₹50,000 over five years" gives hst310); dist-east hdb321.outcome ("₹1,250 a month" gives
  hst320); dist-east hdb328.outcome ("after 25 years" gives hst348).
- hst310 `sourceLabel` still carries AIR's real headline ("PM launches…"), which overlaps with
  dist-east hdb335. It was kept because a label must quote the real headline.
- hst335 toll: one regional site (Assam Times) says the CM told the Assembly the toll was 33. No
  charter outlet confirming this was fetched, so the item keeps 30 (NIE, 10 Feb) and 31 (notification,
  NIE 15 Feb). The answer "About 30" holds either way.
- hst325: nothing newer than Dec 2024 was found on the APPSC case. The main accused's bail (Nov 2023) was seen
  only in a headline and not fetched, so it is not used.
- hst334: nothing on the missing coal was found after July 2025. Katakey-panel reports in 2026 cover wider
  illegal mining.
- hst306: headlines (NIE, IE, Apr 2026) say the Calcutta HC bailed the former chairman in the state
  cases. The pages were not fetched, so status cites only the SC bail of 18 Aug 2026.
- hst301: the "not my money" quote is sourced to Zee News. The Hindu, HT and TOI reported it too
  (RSS headlines, 31 Jul–1 Aug 2022), but their pages could not be fetched.
- No public denial was found from Anubrata Mondal (hst304) or from Suvendu Adhikari on Narada
  (hst303). Both items say so.
- New sources outside the charter's example list: Zee News (hst301), Daily Pioneer (PTI copy; hst301, hst305),
  Bar & Bench (hst315), Assam Tribune (hst319), India Today NE (hst325), Mongabay India
  (hst335) and Morung Express (hst340).

### Statuses to re-check first (next audit)

hst324 (SC hearing of 25 Sept 2026; possible RC/FIR), hst305 (CBI reply due 15 Oct 2026), hst301
(bail-breach hearing 29 Sept 2026), hst335 (commission report overdue), hst319 (HC appeals),
hst315 (SC DGP-panel matter; whether the chairman is examined).
