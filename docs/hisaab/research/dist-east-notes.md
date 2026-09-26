# Distribution — East & North-East (`hdb300`–`hdb399`) — research notes

Lane file: `editions/hisaab/bank/dist-east.mjs` (`HISAAB_DIST_EAST`, 39 items, ids hdb300–hdb338).
Mode: every item carries `tags: ['distribution']`; 15 also carry `'pre-election'` with a `poll` block.
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/dist-east.mjs` → OK; whole bank OK;
`node --test tests/hisaab-*.test.mjs` → 40/40 pass. Status of every item checked September 2026 (`asOf: '2026-09'`).

## How this run worked ("try again")

A previous run had left a 35-item lane file (committed in `4878295`) but no notes and no summary. This run
re-fetched **every** `sourceUrl` and every URL in `sources` (66 pages, text extracted and grepped for each
claim), fixed what the pages did not support, and added four new items where seed ideas were still missing
(Subhadra launch, Mo Kudia 2008, Biju Pucca Ghar 2014, Annapurna first payout 2026).

Fixes made to the inherited items:

| id | problem found against the fetched page | fix |
|---|---|---|
| hdb300 | IE ties "₹2 a kg" to 2016 Jangalmahal, not explicitly to the 2009 launch | stem now says "subsidised rice for poor families"; ₹2 moved to explanation with its 2016 context |
| hdb305 | scheme spelled "Taposili Bandhu"; Mint spells it "Taposili Bondhu" | spelling follows source |
| hdb306 | The Hindu gives Chandrima Bhattacharya's title as MoS (Independent Charge) | role in explanation and `enactedBy` corrected |
| hdb309 | IE says the scheme was "recently rebranded", not that it was renamed in August; BBBP non-participation is Adhikari's statement | stem says "has rebranded… called by August 2026"; BBBP clause attributed to Adhikari |
| hdb315 | ₹12,500 is a one-off unit cost for landless households' livelihood activities, not a yearly payment | explanation reworded |
| hdb317 | "after 24 years in power" is not on the Outlook page | removed; outcome now gives the pension bill (₹2,685 cr → ₹3,683 cr, CMO via PTI) and the result |
| hdb325 | Frontline spells the CM "Lalthanhawla" | spelling follows source |
| hdb330 | sourceUrl (TOI 2024) did not state the answer (₹700); the Sept 2022 date comes only from a Congress leader; "3.18 lakh" comes from a BJP booth worker quoted by EastMojo; "16 Feb" not on Frontline page | sourceUrl → IE 2018 (states ₹700 and the ₹2,000 promise); stem says "in the run-up to the 2023 poll"; both figures attributed to who said them |
| hdb307, hdb323 | 2026 results rested on news reports only | ECI party-wise result pages added (`results.eci.gov.in/ResultAcGenMay2026/…S25` and `…S03`); poll result for WB now "BJP 207, TMC 80 (ECI)" |

## Sources consulted

**Official / open data (fetched directly):**
- **Election Commission of India results portal** — `results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm`
  (West Bengal 2026: BJP 207, AITC 80) and `…-S03.htm` (Assam 2026: BJP 82, INC 19, BPF 10, AGP 10).
  Older result paths (2021 WB, 2023 NE, 2024 Odisha) now return 404 on this host, so earlier results are
  cited from The Hindu, Frontline, Outlook, NIE, IE and CNBC-TV18, which quote ECI figures.
- **Prime Minister's Office** (pmindia.gov.in) — Subhadra launch release, 17 Sep 2024.
- **Nagaland Department of Information & Public Relations** (ipr.nagaland.gov.in) — CMHIS launch, including the
  NHA CEO's "second state in North-east with universal health coverage" remark.
- **All India Radio / News On AIR** (newsonair.gov.in) — WB 2026 poll schedule (23 & 29 April) and 2026 results.
- **Wikipedia raw pages** — used only to confirm polling start dates behind `gapDays` (never as the only
  source for a claim about a person).

**Official documents reached through reporting (the item names the report):**
- CAG compliance audit on KALIA (Odisha, tabled Sept 2024) — via The Indian Express.
- West Bengal 2026-27 interim budget / Gender & Child Budget statement — via The Indian Express.
- Odisha 2024-25 budget (health), Mizoram 2025-26 budget, WB 2026-27 budget — via NIE, The Hindu.
- Assam Budget 2025-26 / 2026-27 scheme table (Orunodoi 3.0, MMUA, Nijut Moina) — via Frontline.
- Union Rural Development Ministry MGNREGA state rankings 2016-17 — via IANS (The Quint).
- Sikkim Assembly written answer on One Family One Job regularisations — via India Today NE.

**Established outlets:** The Hindu, Frontline, The Indian Express, Times of India, Business Standard (PTI/ANI),
Mint, New Indian Express, Economic Times (and ET BFSI / ET Government / ET HealthWorld), India Today,
India Today NE, CNBC-TV18, Outlook, The Quint, EastMojo, Orissa Post, OTV, Telangana Today, Oneindia (UNI copy).

**Not used this run:** PRS state budget analyses, RBI *State Finances: A Study of Budgets*, data.gov.in, Open
Budgets India / CivicDataLab, Indian Kanoon, sansad.in. PRS/RBI would be the right sources to add annual
cost lines for Lakshmir Bhandar, Orunodoi and Subhadra in a refresh (see "next steps").

**Discovery tools:** Google News RSS (titles/dates only; its article links are opaque), DuckDuckGo HTML
endpoint (worked for ~10 queries, then rate-limited with an "anomaly" page), outlet WordPress JSON search
(EastMojo, Orissa Post), and direct slug guesses verified by HTTP 200 + content check. Reddit was never used.

## Items considered and dropped (or not added)

- **Mo Ghara (Odisha, June 2023 housing-loan scheme) as its own item** — the only report on its stall after the
  2024 change of government is a district-level Orissa Post story (Nabarangpur: 3,690 recommended, 26
  sanctioned, 12 paid). Too thin for a stand-alone item; the same page is used only as a supporting source for
  hdb337's Nabarangpur housing figures.
- **Assam Majoni / Mamoni (2009, Gogoi government)** — only scheme-aggregator sites and a 2009 Assam Times note
  were found; no established-outlet source. Assam therefore has nothing before 2015 in this lane (gap).
- **"30 lakh Lakshmir Bhandar beneficiaries ineligible" (Adhikari, 27–28 May 2026)** and **TMC's "first scam"
  charge on Annapurna (NIE, 1 Jul 2026)** — seen in Google News titles but not fetched (search rate-limited),
  so not used. hdb338 carries Mamata Banerjee's response from Telangana Today instead.
- **Tripura's Sept 2022 pension-hike announcement as a primary report** — not found; hdb330 reworded (above).
- **Nagaland CMHIS "second NE state" remark** — kept, now backed by the IPR page, which loaded on retry.
- **Subhadra ₹50,000 total, Orunodoi ₹1,250 and the ₹9,000 lump sum, Annapurna ₹3,000, Sikkim Aama ₹20,000,
  Bana Kaih stamp duty, KALIA target group** — already asked in `states-east.mjs` (hst310, hst320, hst321,
  hst307, hst346, hst338, hst313). This lane takes other angles (who launched, reach, audit, promise vs
  delivery, rejections) and does not repeat those facts in any stem.
- **Manipur** — no sourced state cash-transfer flagship found in time; the Centre's ₹2,198-crore relief grant is
  already hst330 (a relief item, not distribution). Manipur has no item in this lane (gap).
- **Odisha Mission Shakti interest-free loans** — Frontline confirms seed money, revolving funds and interest
  subvention (used in hdb312) but gives no loan-volume figure; no separate item.

## Contested items and how the other side appears

- **hdb315 KALIA (2018)** — "poll gimmick" is attributed to the BJP and Congress (TOI); the state's reply (the
  Finance Commission praised it) is in the same sentence.
- **hdb316 KALIA CAG audit** — the CAG's "remote chances of recovery" is quoted; the BJD government's 2020 refund
  notices and the BJP's 2020 call not to repay are both stated. `govt` is **BJD** because the audited spending
  (2019–21) was the BJD government's, though the report was released under the BJP in Sept 2024 — reviewer may
  prefer `BJP` (time of release); flagged.
- **hdb319 Gogoi's ₹862-crore package (2015)** — Gogoi's own words on politics are quoted, with his denial of the
  BJP's diversion charge.
- **hdb322 Nijut Moina** — Congress's "creating beneficiaries" line and Sarma's reply.
- **hdb323 Mahila Udyamita Abhiyaan** — Sarma's "not a vote-centric scheme" (TOI) and his claim that Bihar copied
  it; Frontline/IE carry Gaurav Gogoi's allegation that women were pressed into BJP activity (not used in the
  item text; could be added as a counterpoint).
- **hdb326 Mizoram SEDP** — figures are Deputy CM Tawnluia's as reported in a Quint opinion piece; the government's
  pandemic explanation for the missing third phase is included.
- **hdb329 Tripura fake ration cards** — government figures only; the report carried no Left Front response
  (stated in the explanation).
- **hdb330 Tripura pension** — the hike date is from a Congress leader, the coverage figure from a BJP worker;
  both are attributed.
- **hdb338 Annapurna rejections** — the CM's stated grounds (deaths, voter-roll deletions, duplicate accounts,
  doubts over citizenship or domicile) and Mamata Banerjee's objection. The item avoids any community framing;
  the CM's "non-Indians" phrase in The Hindu is deliberately not quoted.
- **No item claims a cause for an election result.** Where outlets asserted one (IE's headline that KALIA
  "helped BJD win 2019"; Frontline on KALIA; TOI on Bihar's women's scheme), the items do not repeat it.

## Stale-risk facts (re-check monthly)

- **hdb338 / hdb307** — Annapurna rejections and re-applications are live (Aug 2026 reapplication window; protests
  reported by The Wire, 1 Sep 2026). Beneficiary counts will move.
- **hdb309** — Kanya Ratna's ₹2,000 yearly grant starts with the 2027 session; check it happened.
- **hdb310** — Swasthya Sathi → Ayushman Bharat migration; co-branding "yet to be decided" (June 2026).
- **hdb303** — the BJP budget's ₹3,000 farmer top-up over PM-KISAN (June 2026): implementation not yet reported.
- **hdb321** — the BJP's 2026 manifesto again promised Orunodoi ₹3,000; watch whether the new term delivers.
- **hdb316** — KALIA's successor CM-KISAN; any recovery from the 12.72 lakh ineligible beneficiaries.
- **hdb331** — regularisation of One Family One Job staff under Sikkim's 2024 policy.
- **hdb335** — Subhadra instalments continue (next due around Raksha Bandhan / Women's Day each year).
- **hdb322, hdb323, hdb327** — yearly budget counts (Nijut Moina girls, MMUA tranches, Bana Kaih allocation).

## Distribution

**Era (item `year`):** 2000–04: 3 · 2005–09: 3 · 2010–14: 4 · 2015–19: 7 · 2020–26: 22 (every 5-year band ≥ 2).

**Govt (who governed that level when the fact happened):** BJP 12 · BJD 9 · TMC 8 · CPI(M) 2 · INC 2 · MNF 2 ·
ZPM 1 · NDPP 1 · NPP 1 · Other (SDF, Sikkim) 1. Every party that governed a covered state in the period has
at least one item, and every party appears as the author of at least one scheme (not only as a target of
criticism). Items that record audit findings or exclusions cover the BJD (hdb316), the TMC (hdb308), the Left
(hdb300, via a right-to-food adviser; hdb329, via the BJP government), the MNF (hdb326) and the BJP (hdb330,
hdb338).

**State:** WB 12 · OD 11 · AS 5 · MZ 4 · TR 3 · SK 1 · NL 1 · ML 1 · AR 1 · MN 0.
**Difficulty:** simple 11 · expert 15 · extreme 13. **correctIndex:** 10/10/10/9. **Kind:** scheme 35, spend 4.

**Poll timing (`gapDays`)** = days from announcement or first payment to the first day of polling in that state.
Polling dates checked: WB LS 2019 = 11 Apr 2019; WB 2021 = 27 Mar 2021; WB LS 2024 = 19 Apr 2024;
WB 2026 = 23 Apr 2026 (AIR); Odisha 2009 = 16 Apr 2009; Odisha 2019 = 11 Apr 2019; Odisha 2024 = 13 May 2024;
Assam 2016 = 4 Apr 2016; Assam 2021 = 27 Mar 2021; Assam 2026 = 9 Apr 2026 (CNBC-TV18); Sikkim 2019 =
11 Apr 2019; Nagaland 2023 = 27 Feb 2023; Tripura 2023 = 16 Feb 2023. `gapDays` is omitted where the
announcement day is not known to the day (hdb321, hdb323, hdb330).

## Schemes and measures covered

| name | level/state | launched | enacted by (name, role, party) | amount / benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| Subsidised rice for BPL | WB | 2009 | Centre + Left Front govt (CPI(M)-led) | rice at ₹2/kg (2016) | 2.64 cr; 3.2 cr under TMC | — | WB 2011: Left out after 34 yrs | IE 28 Mar 2016 (hdb300) |
| Kanyashree Prakalpa | WB | Oct 2013 | Mamata Banerjee, CM, TMC | ₹750→₹1,000/yr (13–18); ₹25,000 at 18 | 81 lakh girls (2023-24) | ₹1,250 cr (2018); ₹1,058 cr RE 2025-26 | — | The Hindu 2018, 2024 (hdb301) |
| Rupashree | WB | Jan 2018 | Amit Mitra, FM, TMC; Mamata Banerjee | ₹25,000 one-time for marriage | 11.71 lakh (Jan 2022) | ₹693.76 cr (2025-26) | — | The Hindu 31 Jan 2018; NIE 2022 (hdb302) |
| Krishak Bandhu | WB | 31 Dec 2018 | Mamata Banerjee, CM, TMC | ₹5,000/acre/yr (₹10,000 from 2021); ₹2 lakh death benefit | 37.7 lakh farmers (Sep 2019) | ₹1,000 cr (2019-20) | LS 2019 (101 d): TMC 22, BJP 18 | IE 21 Oct 2019 (hdb303) |
| Sabooj Sathi | WB | 2015 | Mamata Banerjee, CM, TMC | bicycles, Class 9–12 | 85 lakh (2020) | >₹2,700 cr total | — | IE 10 Sep 2020 (hdb304) |
| Duare Sarkar | WB | 1 Dec 2020 | Mamata Banerjee, CM, TMC | camps for 11+ schemes | >1 cr visits in 2 weeks | — | WB 2021 (116 d): TMC 213, BJP 77 | Mint 19 Dec 2020 (hdb305) |
| Lakshmir Bhandar hike | WB | 8 Feb 2024 | Chandrima Bhattacharya, MoS (IC) Finance, TMC | ₹500→₹1,000 (gen), ₹1,000→₹1,200 (SC/ST) | 2.11 cr women | ₹14,400 cr (2024-25) | LS 2024 (71 d): TMC 29, BJP 12 | The Hindu 8 Feb 2024 (hdb306) |
| Lakshmir Bhandar hike | WB | 5 Feb 2026 | Chandrima Bhattacharya, MoS Finance, TMC | +₹500 → ₹1,500 / ₹1,700 | 2.2 cr women | ₹28,615 cr RE 2025-26; ₹74,000 cr in 50 months | WB 2026 (77 d): BJP 207, TMC 80 (ECI) | IE 5 Feb 2026 (hdb307, hdb308) |
| Kanya Ratna (ex-Kanyashree) | WB | Aug 2026 | Suvendu Adhikari, CM, BJP | ₹1,000→₹2,000/yr from 2027; ₹25,000 at 18 kept | 9.48 lakh + 1.29 lakh paid 14 Aug 2026 | ₹418 cr (one day) | — | IE 15 Aug 2026 (hdb309) |
| Swasthya Sathi → Ayushman Bharat | WB | Jul 2026 | Suvendu Adhikari, CM, BJP | ₹5 lakh/family cover | 2.45 cr families (SS); 1.43 cr (AB list) | state pays full premium for non-AB families | — | IE 9 Jun 2026 (hdb310) |
| Annapurna (replaces Lakshmir Bhandar) | WB | 1 Jul 2026 | Suvendu Adhikari, CM, BJP | ₹3,000/month | ~1.1 cr credited day one; 26 lakh of 1.6 cr applications rejected | ₹36,000 cr (2026-27) | — | IE 1 Jul 2026 (hdb338) |
| Cheap rice after Kashipur deaths | OD | 2001 | Naveen Patnaik, CM, BJD | 16 kg/month at ₹4.75/kg | BPL families | — | — | Frontline 2022 (hdb311) |
| Mission Shakti (SHGs) | OD | 2001 | Naveen Patnaik, CM, BJD | seed money, revolving fund, interest subvention | >6 lakh SHGs, >70 lakh women | — | — | Frontline 2022 (hdb312) |
| Mo Kudia housing | OD | Jan 2008 | Naveen Patnaik, CM, BJD | ₹25,000 (2008) → ₹70–75k (2014) per house | target ~15 lakh households | ₹330 cr (2014-15) | — | TOI 12 Sep 2014; UNI 2008 (hdb336) |
| ₹2-a-kg rice | OD | 1 Aug 2008 | Naveen Patnaik, CM, BJD | rice at ₹2/kg | BPL families | state paid above central subsidy | OD 2009 (258 d): BJD 103/147 | Frontline 2022; IE 2014 (hdb313) |
| Re 1-a-kg rice | OD | Feb 2013 | Naveen Patnaik, CM, BJD | rice at ₹1/kg | BPL families | — | OD 2014: BJD 117/147 | Frontline 2022 (hdb314) |
| Biju Pucca Ghar | OD | 11 Sep 2014 | Naveen Patnaik, CM, BJD | pucca house, in woman's name | all rural kutcha houses (aim) | ₹330 cr → ~₹3,000 cr (phased) | — | Business Standard 11 Sep 2014 (hdb337) |
| KALIA | OD | 21 Dec 2018 | Naveen Patnaik, CM, BJD | ₹10,000/yr (→₹4,000 after PM-KISAN); ₹12,500 unit cost for landless | >37 lakh before MCC; 65.64 lakh (2019–21) | ₹10,180 cr over 3 yrs; ₹9,333 cr disbursed | OD 2019 (111 d): BJD 112/146 | IE 22 Dec 2018; CAG via IE 13 Sep 2024 (hdb315, hdb316) |
| Madhu Babu pension hike | OD | 10 Feb 2024 | Naveen Patnaik, CM, BJD | +₹500 → ₹1,000 / ₹1,200 / ₹1,400 | 36.75 lakh | ₹2,685 cr → ₹3,683 cr | OD 2024 (93 d): BJP 78, BJD 51 | Business Standard (PTI) 10 Feb 2024 (hdb317) |
| Gopabandhu Jan Arogya (ex-BSKY) + PM-JAY | OD | Jul 2024 / 11 Apr 2025 | Mohan Charan Majhi, CM, BJP | health cover | 3.5 cr people, 1.3 cr families | ₹5,450 cr (GJAY 2024-25) | — | NIE 26 Jul 2024 (hdb318) |
| Subhadra | OD | 17 Sep 2024 | Narendra Modi, PM, BJP; Mohan Charan Majhi, CM, BJP | ₹10,000/yr for 5 yrs | >10 lakh day one; ~1 cr by 2025 | ₹5,000 cr per instalment round | — | PMO 17 Sep 2024; The Hindu 9 Aug 2025 (hdb335) |
| Gogoi's pre-poll package | AS | 26 Sep 2015 | Tarun Gogoi, CM, INC | ~25 schemes: yarn, laptops, seeds, blankets, pensions | 76.41 lakh people | ₹862 cr | AS 2016 (191 d): BJP 60, INC 26 | The Hindu 26 Sep 2015 (hdb319) |
| Arundhati gold scheme | AS | Nov 2019 / 24 Sep 2020 | Sarbananda Sonowal, CM; Himanta Biswa Sarma, FM; BJP | ₹30,000 → ₹40,000 for 10 g gold | 587 of 1,121 first applicants | — | AS 2021 (184 d): NDA 75/126 | India Today 24 Sep 2020 (hdb320) |
| Orunodoi | AS | 2 Oct / Dec 2020 | Himanta Biswa Sarma, FM; Sarbananda Sonowal, CM; BJP | ₹830 → ₹1,250/month (₹3,000 promised 2021 and 2026) | 18–22 lakh → ~40 lakh | ₹5,000 cr (2025-26) | AS 2021: NDA 75/126 | IE 16 Mar 2021; IE 2 Apr 2026 (hdb321) |
| Nijut Moina | AS | Aug / 6 Oct 2024 | Himanta Biswa Sarma, CM, BJP | ₹1,000 / ₹1,250 / ₹2,500 a month, 10 months | 4.3 lakh (2025-26) → >5.5 lakh | ₹391 cr (2025-26) | — | The Hindu 6 Oct 2024 (hdb322) |
| Mahila Udyamita Abhiyaan | AS | 2025-26 budget | Himanta Biswa Sarma, CM, BJP | ₹10,000 + ₹25,000 + ₹50,000 seed capital | >28.5 lakh approved | ₹3,038 cr (2025-26) | AS 2026: BJP 82/126 (ECI) | IE 2 Apr 2026; TOI Nov 2025 (hdb323) |
| Mizoram Intodelhna Programme | MZ | 2002 | Zoramthanga, CM, MNF | ₹11,000 per family | 53,288 families | ₹30.38 cr total | MZ 2008: INC 32, MNF 3 | Frontline 2013 (hdb324) |
| New Land Use Policy | MZ | Jan 2011 | Lalthanhawla, CM, INC | ₹1.26 lakh over 5 yrs | 1.2 lakh farmers | ₹2,873.13 cr total | MZ 2013: INC 34; 2018: INC 5, MNF 26 | Frontline 2013; NIE 2018 (hdb325) |
| SEDP family assistance | MZ | 2019–22 | Zoramthanga, CM, MNF | ₹3 lakh promised; ₹50,000 / ₹25,000 paid | 60,000 + 60,000 families | — | MZ 2023: ZPM 27, MNF 10 | The Quint 6 Nov 2023 (hdb326) |
| Bana Kaih | MZ | Sep 2024 | Lalduhoma, CM, ZPM | support prices for ginger, turmeric, chilli, broom; loans ≤₹50 lakh | — | ₹200 cr → ₹350 cr | — | The Hindu 4 Mar 2025 (hdb327) |
| MGNREGA work days (Left era) | TR | FY2009-16 | (central Act; state run by Manik Sarkar's Left Front) | work days | 79.88 days/household (2016-17) | — | TR 2018: Left out after 25 yrs | The Quint (IANS) 6 Apr 2017 (hdb328) |
| PDS digitisation | TR | 2018 | Biplab Kumar Deb, CM, BJP | ration cards | 62,340 cards / 2.8 lakh consumers called fake | — | — | IE 13 Sep 2018 (hdb329) |
| Social pension ₹2,000 | TR | 2022 | Manik Saha, CM, BJP | ₹700 → ₹1,000 → ₹2,000 | 4.19 lakh (2018) → 3.78 lakh (Congress) | — | TR 2023: BJP–IPFT 33/60 | IE 2018; TOI 2024; EastMojo 2023 (hdb330) |
| One Family, One Job | SK | 12 Jan 2019 | Pawan Kumar Chamling, CM, SDF | temporary govt job per family | 11,772 letters on day one | salaries budgeted for 89 days | SK 2019 (89 d): SKM 17, SDF 15 | India Today 13 Jan 2019 (hdb331) |
| CM's Health Insurance Scheme | NL | 14 Oct 2022 | Neiphiu Rio, CM, NDPP | ₹20 lakh (employees) / ₹5 lakh (others) | universal | ₹69 cr premium (yr 1) | NL 2023 (136 d): NDPP–BJP 37/60 | ET BFSI (PTI) 15 Oct 2022; Nagaland IPR (hdb332) |
| CM-Elevate | ML | Oct 2023 | Conrad K. Sangma, CM, NPP | up to 75% grant/subsidy | 20,000 target | ₹300 cr over 5 yrs | — | ET 17 Oct 2023 (hdb333) |
| Dulari Kanya revamp | AR | 17 Feb 2025 | Pema Khandu, CM, BJP | ₹30,000 FD at birth + ₹20,000 at Class 11 | — | — | — | ANI 18 Feb 2025 (hdb334) |

## Retro-tags proposed for items in other lanes

All in `states-east.mjs` (no tags today):

| id | subject | proposed tags | note |
|---|---|---|---|
| hst307 | Annapurna Bhandar ₹3,000 | distribution | complements hdb338 |
| hst310 | Subhadra ₹50,000 over 5 years | distribution | complements hdb335 |
| hst313 | KALIA 2019-20 allocation | distribution | — |
| hst320 | Orunodoi ₹830 → ₹1,250 | distribution | — |
| hst321 | Orunodoi ₹9,000 lump sum, 10 Mar 2026 | distribution, pre-election | needs `poll: { label: 'Assam Assembly 2026', month: '2026-04', gapDays: 30, result: 'BJP won 82 of 126 seats; NDA third straight term' }` (polling 9 Apr 2026; ECI S03) |
| hst346 | Sikkim Aama Yojana ₹20,000 | distribution | — |
| hst302 | ED case on Bengal PDS (ration) distribution | distribution | in-kind transfer system; keep its existing `status` |

## Next steps for a refresh

1. Add PRS / RBI *State Finances* annual cost lines for Lakshmir Bhandar, Orunodoi and Subhadra (the RBI
   study's women-cash-transfer tables would give audited-style totals rather than press figures).
2. Fill the gaps: Assam before 2015, Manipur, a second item each for SK/NL/ML/AR, and a 2010–14 Bengal item
   (e.g. early TMC-era schemes) from established outlets.
3. Re-check the stale-risk list above; bump `asOf` only after re-reading a new source.

## Verification

Adversarial pass, 26 Sep 2026, by a second agent that did not write the lane. Every `sourceUrl` and every URL in
`sources` (now 89 distinct pages) was fetched again and the text checked for the correct option, each number,
each date and each `enactedBy` name/role/party. 88 pages returned HTTP 200 to curl; India Today NE's Mizoram SEDP
page (403 to curl) was read through WebFetch and confirms the Aug 2022 "family-oriented SEDP" figures (60,000
beneficiaries, 1,500 per constituency, ₹50,000 each in ₹25,000 instalments). Every distractor was checked against
the same pages for being accidentally true. Every `gapDays` was recomputed (all 11 correct) and every polling start
date cross-checked (AIR for WB 2026, CNBC-TV18 for Assam 2026, Frontline for Odisha 2019, Wikipedia raw pages as a
second source for the rest). ECI's 2026 party-wise pages (S25 West Bengal: BJP 207, AITC 80; S03 Assam: BJP 82)
were re-read. Result: **39 checked, 0 dropped, 39 kept**; validator OK; whole bank OK; `node --test tests/hisaab-*.test.mjs` 40/40.

### Fixes

| id | what the pages showed | fix |
|---|---|---|
| hdb301 | `sourceUrl` (The Hindu, Jan 2024) never states the answer (₹25,000 at 18); only the Jan 2018 Hindu page in `sources` does | swapped: 2018 page is now `sourceUrl`, 2024 explainer moved to `sources` |
| hdb303 | "(pro rata for smaller plots)" is not on the 2019 IE page (pro rata appears only for the 2021 "2.0" version) | clause removed; explanation now says ₹5,000 a year for a farmer with an acre, as IE states |
| hdb304 | "its second global award" is not on the IE page | outcome now says the WSIS prize followed Kanyashree's 2017 UN award (IE) |
| hdb311 | **Substantive.** The only source (Frontline's May 2022 "SPECIAL FEATURE: Odisha", a state-profile package) says the state "ensured" 16 kg at ₹4.75 *after* Kashipur. Frontline's own Oct 2001 reporting from Kashipur shows ₹4.75 × 16 kg was the *existing* BPL entitlement, which the Rayagada Collector said was not enough; the Collector put the deaths under 20 and blamed food poisoning/natural causes, villagers said over 70 | stem rewritten to ask what a BPL family paid for its 16 kg ration "as deaths … made headlines"; `sourceUrl` → Frontline 13 Oct 2001 ("The spectre of starvation"), with "Deaths and denials" (Frontline 2001), HT (Nov 2024) and the 2022 feature in `sources`; the official denial is now in the explanation; `enactedBy` (Naveen Patnaik) removed because the ₹4.75 entitlement was the TPDS rate, not a measure he enacted; distractor ₹3 (the new Antyodaya price, which a reader could confuse) → ₹6.50; outcome now gives HT's toll of 24 and the Nov 2024 Kandhamal deaths with both the BJD's charge and the BJP government's reply |
| hdb312 | Answer (2001) rested only on the 2022 Frontline special feature | `sourceUrl` → The Hindu, 17 Oct 2022 (regular reporting: "Launched … in 2001", 6 lakh SHGs, 70 lakh women); 0% loans up to ₹3 lakh and ₹200 crore subvention added from it; outcome now gives SHG bank credit ₹1,036 cr (2016-17) → ₹4,190 cr (2020-21) |
| hdb313 | ₹2 rice from 1 Aug 2008 rested on the special feature | second source → Frontline 3 Feb 2016 ("Egg on the face"), which states it and calls it "a few months before the elections" |
| hdb314 | Same | `sourceUrl` → Frontline 2016 (₹1 from 1 Feb 2013; BPL families 25 kg at ₹1); the 2018 food-security scheme now cited to The Wire (2 Oct 2018); outcome adds the 2016 NFSA ration-card irregularity charges (Congress/BJP) and the response (3 lakh+ cards surrendered, grievance officers named) |
| hdb315 | Distractor "A bonus over the paddy MSP" is partly true on the IE page (the Food Supplies Minister ruled out a paddy bonus the same day) | → "Free seeds and fertiliser" |
| hdb316 | Explanation omitted that the department itself had flagged 9.76 lakh of the 12.72 lakh (CAG); no `status` although the item is an audit finding in an item naming the scheme's author | 9.76 lakh clause added; ₹107.64 cr mismatch moved to outcome; `status` added ("CAG compliance-audit finding … named no individual"); Deccan Herald added as second source. `govt` kept **BJD** (the audited spending) — see flag below |
| hdb318 | Explanation said Nadda "launched" GJAY/PM-JAY on 11 Apr 2025, but the cited ET page (7 Apr) only said he was scheduled to | ET HealthWorld 12 Apr 2025 ("Nadda launches Ayushman Bharat scheme in Odisha") added as first source |
| hdb321 | "Sarma became CM" is on none of the cited pages | removed; outcome now adds that the BJP again promised ₹3,000 in 2026 (IE) |
| hdb322 | Distractor "Failing a single exam" may be partly true (continuation needs promotion to the next class) | → "Studying outside her home district" |
| hdb323 | Explanation carried Sarma's "not a vote-centric scheme" defence and his Bihar claim but not the charge he was answering (§2.3) | Bihar claim dropped; Congress's allegation that beneficiaries were pressed into BJP activity, and its own ₹50,000 "without political conditions" promise, added (IE 2 Apr 2026); tranche breakdown credited to TOI |
| hdb324 | Frontline's MIP figures are internally inconsistent (53,288 × ₹11,000 = ₹58.6 cr, but it gives the total as ₹30.38 cr) | total dropped from the explanation; the question asks only the per-beneficiary figure Frontline states. See flag below |
| hdb325 | "mautam destroyed crops of 1.3 lakh families" — Frontline says 1,30,621 families were *affected* | "hit the crops of 1.3 lakh families" |
| hdb329 | Outcome was about pensions; the cards' fate was unreported | outcome now: cards cancelled in 2018; March 2026 Assembly reply on e-KYC (India Today NE, 18 Mar 2026), officials' "no fake cards remain" attributed |
| hdb330 | The ₹2,000 hike's timing rested on a Congress leader and a BJP booth worker only | corroborated: Tripura Times (28 Dec 2022) reports CM Manik Saha listing the rise to ₹2,000 among his government's achievements before the Feb 2023 poll — now in `sources` and the explanation; the 3.18 lakh figure now credited to a Social Welfare Department official (EastMojo), with the CPI(M)'s "about a lakh dropped" |
| hdb335 | Distractor "CM Mohan Charan Majhi" is arguably partly true (his government's scheme; he was on stage) | → "Governor Raghubar Das" (also present per the PMO release, but the PMO and The Hindu both say the PM launched it) — still permitted by §4b.1 |
| hdb336 | "at least 10 lakh families" — UNI says 10 lakh BPL *beneficiaries*; "riot-hit" wording | "beneficiaries"; "5,000 houses were sanctioned for BPL families in violence-hit Kandhamal" |
| hdb337 | Outcome used a district-level Orissa Post count mixing PMAY and a workers' scheme | outcome now: Biju Pucca Ghar discontinued by the BJP government (The Hindu, 28 Nov 2024); Antyodaya Gruha Yojana launched Mar 2025 at ₹1.2 lakh a house, with CM Majhi's "slower pace" claim attributed (NIE); Orissa Post source removed |
| hdb338 | Figures dated 1 Jul 2026 only | outcome refreshed: 1.58 crore women paid on 17 Sept 2026 (DD News/PTI), vs about 2.2 crore on Lakshmir Bhandar; DD News added to `sources` |

### Checked and unchanged

hdb300, hdb302, hdb305, hdb306, hdb307, hdb308, hdb309, hdb310, hdb317, hdb319, hdb320, hdb326, hdb327, hdb328,
hdb331, hdb332, hdb333, hdb334 — every figure, date, name, poll result and distractor matched the fetched pages.
Author-flagged sensitive items: hdb315 ("poll gimmick" attributed to BJP and Congress, reply in the same sentence —
TOI 13 Jan 2019 confirms both); hdb319 (Gogoi's quote and his denial are verbatim in The Hindu); hdb326 (SEDP figures
attributed to Deputy CM Tawnluia in a Quint opinion piece; the Aug 2022 launch figures now also confirmed on India
Today NE); hdb325/hdb335 ("who launched" questions with real office-holders as distractors — allowed by §4b.1, no
wrongdoing context); hdb338 (the CM's "non-Indians" phrase is still not quoted; the Telangana Today piece also carries
Mamata Banerjee's allegation that religion and race were being considered — deliberately not used, §2.6).

### Drops

None. The lane stays at 39 items (target 35, floor 28).

### Flags for the reviewer

- **Frontline "SPECIAL FEATURE: Odisha" (6 May 2022).** It is bylined by Frontline staff but sits in a state-profile
  package, and on Kashipur it contradicts Frontline's own 2001 reporting. It is no longer the `sourceUrl` of any item;
  it survives only as a secondary source on hdb311 and hdb312. Treat it as the state's framing, not independent reporting.
- **hdb324 / MIP.** Frontline 2013's per-family (₹11,000) and total (₹30.38 cr) figures cannot both be right. The
  Hindu (10 Feb 2023) also reports that a special court in Aizawl **acquitted** Zoramthanga, ex-Agriculture Minister
  H. Rammawi and two others in April 2021 in an 11-year-old corruption case over more than ₹218 lakh of MIP money.
  Not added to the item (it would need `people` + a re-checked status, and no appeal status was found); a refresh
  could add it as the scheme's outcome with that acquittal status.
- **hdb316 `govt`.** Kept BJD (the audited 2019–21 spending was the BJD government's) with `year: 2024` (release under
  the BJP). A year-based mode will show it under 2024 with govt BJD; switch to BJP if the review lane prefers
  time-of-release.
- **hdb329** still carries no Left Front response; none was found in Google News (2018–2026). The item says so.
- **hdb330** `gapDays` stays omitted: the announcement day is known only to the month (Sept 2022, per the Congress);
  the Tripura Times report fixes the hike as in force by 28 Dec 2022.
- Not used, still unverified: Adhikari's May 2026 "30 lakh ineligible" Lakshmir Bhandar claim and the TMC's "first
  scam" charge on Annapurna (neither fetched).
- Table rows above for hdb311 (now "BPL ration at ₹4.75, existing entitlement", no `enactedBy`) and hdb337 (outcome
  source now The Hindu/NIE, not Orissa Post) are superseded by this section.

### New sources fetched in this pass

Frontline 13 Oct 2001 ("The spectre of starvation", "Deaths and denials"); Frontline 3 Feb 2016 ("Egg on the face");
The Hindu 17 Oct 2022 (Odisha women SHGs); The Wire 2 Oct 2018 (Odisha food security scheme); Hindustan Times 5 Nov
2024 (Kandhamal mango-kernel deaths); Deccan Herald 12 Sep 2024 (KALIA CAG); ET HealthWorld 12 Apr 2025 (PM-JAY
launch in Odisha); The Hindu 28 Nov 2024 (21 Odisha schemes renamed); NIE 31 Mar 2025 (Antyodaya Gruha Yojana);
India Today NE 18 Mar 2026 (Tripura e-KYC); Tripura Times 28 Dec 2022 (CM on ₹2,000 pension); DD News 17 Sep 2026
(Annapurna 1.58 crore); The Hindu 10 Feb 2023 (MIP acquittal context, not cited in an item). Discovery used Google
News RSS with the article links decoded through Google's own batchexecute endpoint; Bing RSS and DuckDuckGo were
tried and gave nothing usable; web.archive.org was unreachable through the proxy.
