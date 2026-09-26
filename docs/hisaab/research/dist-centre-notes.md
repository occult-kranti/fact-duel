# Distribution — Centre lane notes (`hdb001`–`hdb045`)

Lane file: `editions/hisaab/bank/dist-centre.mjs` (`HISAAB_DIST_CENTRE`, 45 items).
Mode: **Seedha Khaate Mein** (`tags: 'distribution'`). 13 items also carry `pre-election` (each with `poll`),
2 carry `relief`. `node scripts/hisaab-validate.mjs editions/hisaab/bank/dist-centre.mjs` → OK; the whole-bank
run (all lanes present on 25 Sep 2026, including `dist-north.mjs`) → OK. `asOf` is `2026-09` on every item.

## Sources consulted

Open and official data first; every item's `sourceUrl` is a page that was fetched and read in September 2026.

- **Union Budget speech archive, indiabudget.gov.in** (primary): 2003-04 (Jaswant Singh), 2004-05 interim
  (Jaswant Singh, 3 Feb 2004), 2004-05 (P. Chidambaram, 8 Jul 2004), 2008-09 (Chidambaram, 29 Feb 2008), 2009-10
  interim (Pranab Mukherjee, 16 Feb 2009), 2014-15 interim (Chidambaram, 17 Feb 2014), 2015-16 (Arun Jaitley),
  2019-20 interim (Piyush Goyal, 1 Feb 2019). The archive gives who presented each measure, the amount, and the
  government's own mid-course numbers (e.g. the 2008 waiver's reported ₹65,300 crore in Feb 2009).
- **NFSA portal (Dept of Food & Public Distribution)** — AAY launch, prices, scale and three expansions.
- **National Health Mission** — JSY launch date and cash entitlements.
- **PIB** releases and backgrounders — Ujjwala 2.0, PMMVY (Aug 2026), PM Kisan Maandhan (7-year note), PM
  Vishwakarma (3-year note), VB-G RAM G backgrounder.
- **PRS Legislative Research** — Demand for Grants 2025-26: Rural Development (NSAP 2020-21 actuals, MGNREGS
  person-days, delay compensation).
- **NCBI E-utilities (PubMed)** — Lancet 2010 JSY impact evaluation abstract (the Lancet and PubMed HTML pages
  block scripted fetches; the abstract was read through the open E-utilities API).
- **CAG findings** as reported on tabling by The Hindu (farm debt waiver 2013; PAHAL 2016), with the
  government's clarification.
- **Courts**: LiveLaw report of the Supreme Court's 27 Oct 2025 order (WB MGNREGA); the Supreme Court's 2001
  PUCL interim order via Frontline.
- **Parliament replies** as reported: Lok Sabha (NSAP rates, PM-SYM enrolment, PM Internship round III), Rajya
  Sabha (NFS Amendment draft), March 2021 reply on PMGKY women (via Factly).
- Established outlets for the rest: The Hindu, Frontline, Indian Express, Hindustan Times, Times of India,
  Economic Times (ET EnergyWorld, ETCFO), Mint, BusinessLine, New Indian Express, India Today, ThePrint, DW, DD
  News, All India Radio, Factly, Kashmir Life, Daily Excelsior.
- Election dates and tallies: Lok Sabha 2014/2019/2024 and Congress tallies from DW; UP 2017 (The Hindu), UP 2022
  (Indian Express), Chhattisgarh and MP 2023 (ThePrint), five-state 2023 (Frontline, The Hindu for the 9 Oct
  schedule), LS 2024 schedule (The Hindu). Wikipedia used only as a **second** source for polling start dates
  (2004, 2009, 2014, 2019, UP 2017/2022) — never for a claim about a person.

Tooling: WebSearch was not used (quota exhausted). Discovery ran through Google News RSS (links decoded to the
publisher URL via Google's own article redirect endpoint), publisher pages and the budget archive index; pages
were read with curl plus a small HTML-to-text filter, PDFs with `pypdf`. Reddit was not touched.
Blocked or unreachable: thelancet.com and pubmed HTML (bot walls), thestatesman.com (403), telegraphindia.com
(403), web.archive.org (connection reset), eci.gov.in (JS-only shell), budget speeches 2000-01 to 2002-03 (404).

## Era and govt distribution

| era | items | ids |
|---|---|---|
| 2000–2004 | 6 | hdb001–hdb006 |
| 2005–2009 | 8 | hdb007–hdb014 |
| 2010–2014 | 8 | hdb015–hdb022 |
| 2015–2019 | 9 | hdb023–hdb031 |
| 2020–2026 | 14 | hdb032–hdb045 |

`govt`: NDA 28 (Vajpayee 2000–04: 5; Modi 2014–26: 23), UPA 17 (2004–14). Difficulty 15/15/15. `correctIndex`
10/12/12/11. `state`: IN 44, WB 1 (hdb040 — see below). Topics: Farm & Food 13, Welfare & Subsidies 13, Jobs &
Economy 10, Health 7, Education & Exams 2. `enactedBy` on 28 items; `outcome` on 44 (not on hdb004 — no
result figure was found for the 2003 health insurance scheme).

`govt` convention: every item records the government at the **Centre** that made the decision. hdb040 is filed
under `state: 'WB'` (so it appears in Bengal's Rajya Round) but `govt: 'NDA'`, because the fund freeze and the
appeal were the Centre's; the TMC state government's response is in the outcome.

Pre-election items (13), all with `poll`: hdb005 (LS 2004, 77 days), hdb012 (LS 2009, 412), hdb013 (LS 2009,
59), hdb018 (LS 2014, 276), hdb022 (LS 2014, 49), hdb026 (UP 2017, 286), hdb028 (LS 2019, 69), hdb029 (LS 2019,
46), hdb030 (LS 2019, 69), hdb034 (UP 2022, 184), hdb035 (Chhattisgarh 2023, 3), hdb036 (five states 2023, 34),
hdb038 (LS 2024, 42). Both sides are represented: NDA 2004 (lost), UPA 2008/09 (won), UPA 2013/14 (lost), NDA
2016–2024 (won in each case cited). No item claims a measure caused a result; where relevant the outcome says the
cited sources make no causal claim.

## Contested items (the other side is in the item)

- **hdb029** PM-KISAN first instalment — Chidambaram's "bribe for votes" (attributed, with Modi's "not just an
  election promise" reply and the Model Code timing). `people` + `status` set.
- **hdb035** Free-grain extension announced at a Durg rally — Jairam Ramesh alleged a Model Code violation; Modi's
  reply included; the cited reports record no ECI finding. `people` + `status` set.
- **hdb025** PAHAL savings — CAG (₹1,764 crore from lower offtake) vs the ministry's ₹21,261 crore estimate.
- **hdb021** Farm waiver audit — CAG findings; BJP sought a CBI probe; the ministry ordered corrective steps.
- **hdb040** West Bengal MGNREGA freeze — Centre cited non-compliance; the BJP alleges corruption; CM Mamata
  Banerjee tore up the Centre's conditions note. No named person is accused.
- **hdb045** AAY per-person entitlement — ministry's equity rationale vs a Hindu op-ed's calculation that no AAY
  household gains; Tamil Nadu's objection.
- **hdb018** NFSA — Mulayam Singh Yadav's view that it was moved with the 2014 polls in mind is attributed; K.V.
  Thomas's assurance on state offtake included.

## Discrepancies resolved

- Supreme Court date on the WB appeal: LiveLaw and the Indian Express say **27 Oct 2025** (a Monday); The Hindu's
  9 Dec 2025 report says "September 27" — treated as a slip; 27 Oct used.
- 2008 waiver size: ₹60,000 crore (budget estimate, 2008), ₹65,300 crore for 3.6 crore farmers (early reports,
  Feb 2009), "₹52,000-crore scheme" (The Hindu on the 2013 CAG report). Each item attributes its figure.
- IGMSY pilot: Frontline (Jul 2010) reported a proposed ~95-district pilot; the Indian Express (2017) says it ran
  in 53 districts — 53 used.
- AAY draft: an agency report said the change "would benefit larger poor families"; the arithmetic (7 kg × 5 =
  35 kg cap) means no household gains — hdb045 uses the op-ed's calculation with attribution.

## Dropped or folded (and why)

- **Sampoorna Grameen Rozgar Yojana (Sept 2001)** — launch date and ₹10,000 crore outlay found only on
  Wikipedia, whose source (a MoRD annual report) sits on web.archive.org, which was unreachable. Dropped.
- **Annapurna (2000)** — current entitlement (10 kg free grain) confirmed, launch year not; dropped.
- **Separate items folded into others** to avoid near-duplicates: PMGKAY ₹11.80 lakh crore (in hdb019/hdb035;
  coverage already asked by hsc019), the Aug 2023 ₹200 LPG cut (in hdb036), MGNREGA's 389 crore person-days in
  2020-21 and late-wage compensation (in hdb041), VB-G RAM G's 60-day pause (in hdb039), the 2014 DBTL pause
  (in hdb017), PAHAL "Give It Up" (in hdb023/hdb025), One Rank One Pension acceptance (in hdb022).
- **Not researched this pass** (candidates for a later refresh): post-matric scholarships 2020 (₹59,048 crore),
  RSBY 2008, kerosene DBT pilot (Kotkasim, 2011), Bharat Atta / Bharat rice (Nov 2023 / Feb 2024 — good
  pre-election candidates for the poll lanes), PM-KISAN 17th instalment (June 2024), Lakhpati Didi (not a transfer).
- **JSY's minister** — no fetched page named the health minister, so `enactedBy` lists only the PM (the NHM page
  says the PM launched it).
- **Named private individual** — The Hindu's Bandlapalli piece names the first woman job-card holder; left out
  (charter §2.7).

## Stale-risk facts (re-check monthly)

- hdb045 NFS (Amendment) Bill 2026 — still a draft in Aug 2026; may be introduced, changed or dropped.
- hdb043 NSAP ₹200 rate — "no proposal" as of July 2026; any revision changes the item.
- hdb040 West Bengal — whether work actually restarted under the 6 Dec 2025 conditions, and the switch to VB-G RAM G.
- hdb039 VB-G RAM G — rules, notified wage rates and state cost-sharing disputes after 1 July 2026.
- Running totals: hdb024 (APY enrolments), hdb030 (PM-SYM, 54 lakh at 29 Jul 2026), hdb031 (PM-KMY, 24.96 lakh at
  6 Feb 2026), hdb037 (Vishwakarma, 15 Sep 2026), hdb042 (Internship round III, Jul 2026), hdb044 (PMMVY, Aug 2026).
- hdb035 — any later ECI decision on the Model Code complaint.

## Overlap with other lanes (for the lead)

- **poll-union** (`hpe`) will likely cover the same budgets: 2004 interim (hdb005), 2008 budget / 2009 interim
  waiver (hdb012–013), NFSA ordinance (hdb018), 2014 interim (hdb022), 2019 interim PM-KISAN / PM-SYM
  (hdb028, hdb030), PM-KISAN first instalment (hdb029), LPG cut 2024 (hdb038). These are already tagged
  `pre-election` with `poll`, so that lane can deal them without re-asking the same facts.
- **relief-centre** (`hrf`): hdb032 (PMGKY cash to women) and hdb033 (NSAP 2020-21) carry `relief`.
- Existing items with the same scheme were checked before writing; no fact is re-asked. Angles differ from
  hsc001–004 (PM-KISAN amount/reach/ineligible), hsc009–013 (Ujjwala targets/CAG), hsc019–021 (PMGKAY coverage,
  NFSA name), hsc036–041 (VB-G RAM G days and split, ABPS, 100-day share, MGNREGA year, 2025-26 BE), hsc044
  (APY pension range), hsc056 (DBT launch) and hbx013–015 (subsidy bills).

## Retro-tags proposed for existing items (distribution mode)

`['distribution']`: hsc001, hsc002, hsc003, hsc004 (PM-KISAN); hsc009, hsc010, hsc011, hsc012, hsc013 (Ujjwala);
hsc019, hsc020 (PMGKAY); hsc021 (NFSA); hsc022 (ONORC); hsc025, hsc026 (PMAY-G assistance); hsc028 (PMAY-U 2.0
subsidy); hsc036–hsc041 (MGNREGA / VB-G RAM G); hsc044 (APY); hsc055, hsc056 (DBT); hsc058 (Saubhagya free
connections); hbx013 (subsidy bill); hbx015 (fertiliser subsidy); hzz001–hzz003 (sample PM-KISAN, if that lane
stays). `['distribution','relief']`: hbx014 (food subsidy 2020-21, the Covid free-grain year).
Note: hsc013 (75 lakh more Ujjwala connections, Cabinet approval Sep 2023) preceded the Nov 2023 polls and could also
take `pre-election` if the poll lane adds a `poll` block. State-scheme items (Ladli Behna, Orunodoi, Maiya Samman,
etc.) are left to the three state distribution lanes.

## Schemes and measures covered

| name | level/state | launched | enacted by (name, role, party) | amount / benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| Antyodaya Anna Yojana | Centre | Dec 2000 | Atal Bihari Vajpayee, PM, BJP | 25 kg (35 kg from Apr 2002) at ₹2 wheat / ₹3 rice | 1 cr → 2.5 cr households (May 2005) | ~₹3,500 cr subsidy (2004-05) | LS 2004: INC 145, BJP 138; UPA formed govt | nfsa.gov.in PDS page; budget speeches |
| AAY expansion (Budget 2003-04) | Centre | Apr 2003 | Jaswant Singh, FM, BJP | +50 lakh families | 1.5 cr families | +₹507 cr | LS 2004 (as above) | budget speech 2003-04 |
| AAY to 2 crore (interim budget) | Centre | Feb 2004 | Jaswant Singh, FM, BJP | +50 lakh families | 2 cr families | — | LS 2004, 77 days: NDA lost | interim speech 2004-05 |
| Universal Health Insurance Scheme | Centre | 2003-04 | Jaswant Singh, FM, BJP | ₹1/day premium, ₹30,000 hospital cover; Centre pays ₹100/yr for BPL | not found | not found | — | budget speech 2003-04 |
| Cooked mid-day meals (PUCL order) | Centre/states | Nov 2001 | Supreme Court interim order | cooked meal in primary schools | — | — | — | Frontline, Aug 2002 |
| National Food for Work Programme | Centre | Jul 2004 | P. Chidambaram, FM, INC | wage work pending NREGA | 150 districts | >₹6,000 cr pooled | — | budget speech 2004-05 |
| Janani Suraksha Yojana | Centre | Apr 2005 | Manmohan Singh, PM, INC | ₹1,400 rural LPS; ₹700 rural HPS | <5%–44% of births by state (2007-08) | not found | — | NHM; Lancet 2010 |
| NREGA / MGNREGA | Centre | Feb 2006 (Act 2005) | Raghuvansh Prasad Singh, RD Minister, RJD; Manmohan Singh, PM, INC | 100 days' wage work | 3.51 cr households (2008-09) | ₹30,100 cr (2009-10); lifetime ₹11.75 lakh cr | LS 2009: INC 206 | HT; The Hindu; IE; PRS |
| IGNOAPS (old-age pension) | Centre | Nov 2007 | UPA govt (no minister named in source) | ₹200/month central share since 2012 (60–79) | 146 lakh (2008-09) | NSAP ₹9,652 cr (2025-26) | — | interim speech 2009-10; IE 2026 |
| Agricultural Debt Waiver & Debt Relief | Centre | Feb 2008 | P. Chidambaram, FM, INC | full waiver ≤2 ha; 25% OTS rebate | 3.6 cr farmers (Feb 2009) | ₹60,000 cr est.; ₹65,300 cr reported | LS 2009, 412 days: INC 206, UPA 262 | budget 2008-09; interim 2009; Hindu (CAG 2013) |
| IGMSY maternity benefit | Centre | Oct 2010 | UPA-2 (no minister named in source) | ₹4,000 → ₹6,000 (Sep 2013) | 53 pilot districts | not found | — | IE, Jan 2017 |
| DBT for LPG (DBTL) | Centre | Jun 2013 | M. Veerappa Moily, Petroleum Minister, INC | ₹435 per refill | 2.1 cr consumers (₹3,370 cr) before pause | expected saving ₹8,000–10,000 cr | LS 2014 | The Hindu; interim 2014 |
| National Food Security Act | Centre | ordinance Jul 2013; Act Sep 2013 | K.V. Thomas, MoS Food, INC | 5 kg/person at ₹3/₹2/₹1; maternity ≥₹6,000 | 67% of population | free from 2023; ₹11.80 lakh cr for 2024–28 | LS 2014, 276 days: BJP 282, INC 44 | Frontline; The Hindu |
| Education-loan interest relief | Centre | Feb 2014 | P. Chidambaram, FM, INC | unpaid interest to 31 Dec 2013 on pre-Apr 2009 loans | ~9 lakh borrowers | ~₹2,600 cr one-time | LS 2014, 49 days | interim speech 2014-15 |
| PAHAL (LPG DBT) | Centre | Nov 2014 / Jan 2015 | Dharmendra Pradhan, Petroleum Minister, BJP | LPG subsidy to bank account | 13.9 cr consumers (Aug 2015) | CAG: ₹1,764 cr offtake saving (Apr–Dec 2015) | — | ET EnergyWorld; The Hindu (CAG) |
| Atal Pension Yojana co-contribution | Centre | 2015 | Arun Jaitley, FM, BJP | ₹1,000–5,000 pension; Centre 50% up to ₹1,000/yr × 5 yrs | 9 cr+ gross enrolments (Apr 2026) | not found | — | budget speech 2015-16; DD News |
| PM Ujjwala Yojana (1.0 and 2.0) | Centre | May 2016 (Ballia); Aug 2021 (Mahoba) | Narendra Modi, PM, BJP; Dharmendra Pradhan | free LPG connection; ₹300/cyl targeted subsidy (Oct 2023) | 8 cr (phase 1); 9.6 cr (Aug 2023) | ₹8,000 cr (launch); ~₹12,000 cr (2024-25 subsidy) | UP 2017: BJP 312/403; UP 2022: BJP 255/403; Nov 2023: BJP won 3 of 5 | India Today; PIB; AIR; IE |
| PMMVY maternity benefit | Centre | Jan 2017 (announced 31 Dec 2016) | Narendra Modi, PM; Maneka Gandhi, WCD Minister, BJP | ₹5,000 first child; ₹6,000 second child if girl | 4.60 cr mothers (Aug 2026) | ₹2,022 cr (2025-26 to 8 Jan) | — | IE; PIB; ANI |
| PM-KISAN | Centre | Feb 2019 (effective Dec 2018) | Piyush Goyal, interim FM, BJP; Narendra Modi, PM | ₹6,000/yr in 3 × ₹2,000 | 1.01 cr (first instalment) | ₹75,000 cr (2019-20 BE) | LS 2019, 69/46 days: BJP 303 | interim speech 2019-20; HT |
| PM Shram Yogi Maandhan | Centre | Feb 2019 | Piyush Goyal, interim FM, BJP | ₹3,000/month from 60, matched contributions | 54 lakh (Jul 2026) vs 10 cr expected | ₹500 cr initial; ₹2,011 cr matching to date | LS 2019, 69 days | interim speech 2019-20; BusinessLine |
| PM Kisan Maandhan | Centre | Sep 2019 | Narendra Modi, PM, BJP | ₹3,000/month from 60 | 24.96 lakh (Feb 2026) | ₹10,774 cr 3-yr outlay; ₹540.66 cr used | — | TOI; PIB |
| PMGKY cash to women (Jan Dhan) | Centre | Mar 2020 | Nirmala Sitharaman, FM, BJP | ₹500 × 3 months | 20.65 cr women | ₹30,975 cr total | — | Factly; Mint |
| NSAP Covid transfers | Centre | 2020-21 | — | special transfers to women, elderly, widows | — | ₹42,443 cr actual vs ₹9,197 cr BE | — | PRS |
| PMGKAY five-year extension | Centre | announced Nov 2023 | Narendra Modi, PM, BJP | free grain (5 kg/person; 35 kg AAY) | 81.35 cr | ₹11.80 lakh cr over 5 yrs | CG 2023, 3 days: BJP 54/90 | HT; The Hindu |
| PM Vishwakarma | Centre | Sep 2023 | Narendra Modi, PM, BJP | toolkit ≤₹15,000; ₹500/day stipend; loans ≤₹3 lakh at 5% | 30 lakh registered; 6.19 lakh loans | ₹13,000 cr for FY24–FY28 | — | PIB |
| LPG price cut | Centre | Mar 2024 | Narendra Modi, PM, BJP | ₹100 off per cylinder | all domestic consumers | not found | LS 2024, 42 days: BJP 240, NDA 293 | IE |
| PM Internship Scheme | Centre | Oct 2024 (pilot) | announced in Budget 2024-25 | ₹4,500/month (Centre) + ₹500 CSR + ₹6,000 once | 16,068 joined (rounds I–II) | ₹380 cr (RE 2024-25); ₹10,831 cr (BE 2025-26) | — | ETCFO; IE |
| MGNREGA fund freeze in Bengal | WB | Mar 2022 freeze | Centre (NDA); courts ordered restart | — | — | — | — | LiveLaw; IE; The Hindu |
| VB-G RAM G Act | Centre | passed Dec 2025; in force Jul 2026 | Shivraj Singh Chouhan, RD Minister, BJP | 125 days; 60-day farm-season pause | — | ₹1,51,282 cr/yr (Centre ₹95,692 cr) | — | HT; PIB |
| NFS (Amendment) Bill 2026 (draft) | Centre | draft Jun 2026 | Dept of Food & Public Distribution | AAY: 7 kg/person capped at 35 kg | AAY households | — | — | Kashmir Life (RS reply); The Hindu |

## Verification

Adversarial pass, 26 Sep 2026. I re-fetched every `sourceUrl` and nearly every `sources` URL: 72 pages plus about 20
new ones, using curl and a text filter, `pypdf` for the budget PDFs and PRS, and NCBI E-utilities for the Lancet
abstract. I tried to refute each item's answer, figures, dates, `enactedBy`, poll fields and distractors. **45 checked,
0 dropped, 45 remain.** Nothing needed a replacement item. `node scripts/hisaab-validate.mjs
editions/hisaab/bank/dist-centre.mjs` prints OK. The cross-lane run with poll-union, schemes, relief-centre and
dist-north/west-south/east also prints OK, and `node --test tests/hisaab-bank.test.mjs` passes.

### Poll dates and results: Wikipedia removed as a source
No item cites Wikipedia now. Every poll start date and tally has a non-Wikipedia page, and all gapDays were
recomputed and match.
- LS 2004: polling ran 20 Apr–10 May 2004 (Mint, 15 Aug 2026). INC 145 and BJP 138 (Al Jazeera, 3 Jun 2024).
  hdb005: 3 Feb → 20 Apr 2004 = 77 days.
- LS 2009: first phase on 16 Apr 2009 (Frontline, "High stakes", 24 Apr 2009). INC 206 and UPA 262 (Indian Express
  exit-poll look-back, 2024). hdb012 = 412 days; hdb013 = 59.
- LS 2014: first phase on 7 Apr 2014 (Indian Express, 5 Mar 2014). hdb018 = 276 days; hdb022 = 49.
- LS 2019: first phase on 11 Apr 2019, and the schedule was announced on 10 Mar 2019 (The Hindu). Scroll says the
  Model Code applied from that announcement. hdb028 = 69 days; hdb029 = 46; hdb030 = 69.
- UP 2017: first phase on 11 Feb 2017 (Rediff, 11 Feb 2017). hdb026 = 286 days.
- UP 2022: first phase on 10 Feb 2022 (Indian Express, 8 Jan 2022). hdb034 = 184 days.
- Chhattisgarh and five states 2023: The Hindu, HT and ThePrint. The MP result of 163/230 now cites ThePrint (4 Dec
  2023), because no page cited earlier gave it. LS 2024 was already covered by The Hindu and DW.

### Fixes, item by item
- **hdb001**: the outcome gave away hdb005's answer ("2 crore (2004)"). It now reads "three steps to 2.5 crore by May
  2005". The "35 kg carried into the 2013 law" claim now cites The Hindu (Jul 2026).
- **hdb002**: the outcome said Frontline "found no school meals in the block it visited", which the page does not
  say. It now says Frontline reported Jharkhand had ignored the direction.
- **hdb004**: added a verified outcome from the July 2004 budget. Only 11,408 BPL families had joined by May 2004;
  the scheme was called skewed to the non-poor and redesigned for BPL, with the subsidy raised to ₹200 an individual.
- **hdb005**: replaced the Wikipedia source with Mint and Al Jazeera.
- **hdb007**: removed "2023-24" as NFHS-6's year, because the cited Indian Express page does not give it.
- **hdb008**: the stem changed from "widely credited as the architect" to "has been called the 'unsung architect'",
  the Hindustan Times wording. HT's date is 13 Sep 2020, not 14 Sep.
- **hdb010**: the outcome gave away hdb043's answer (₹200). It now cites the 2026 ministry study (a 45% loss in real
  value).
- **hdb011**: the outcome gave away a poll-union answer (hpe, NREGS ₹30,100 crore for 2009-10). It now gives
  2008-09 person-days. The Indian Express label now matches the page's current headline ("MNREGA is now Pujya Bapu
  Rural Employment Guarantee Act"). Same label fix in hdb014 and hdb041.
- **hdb012**: the outcome gave away hdb013's answer (3.6 crore farmers). It now gives the 30 Jun 2008 completion. The
  29 Feb 2008 date and the ₹60,000 crore total are confirmed by The Hindu (Feb 2025), since the budget page does not
  print its own date.
- **hdb013**: the explanation gave away hdb012's answer (₹60,000 crore). It now says "more than the 2008 budget had
  estimated".
- **hdb014**: added HT (Dec 2025) for the passage of VB-G RAM G.
- **hdb015**: the explanation stated hdb020's answer (₹6,000). It now says the law "set a higher minimum".
- **hdb017**: The Hindu's page is a 29 May pre-launch report, so the stem now says the transfer "was to start on 1
  June", and consumers "were to get" the amount. The Hindu (Nov 2014) confirms the scheme did launch on 1 June 2013
  and reached 291 districts. The outcome no longer says "by January 2014", because the interim budget gives no date
  for the LPG figure.
- **hdb018**: The Hindu (26 Aug 2013) confirms the Lok Sabha passed the Bill that night. Added `people` (Mulayam
  Singh Yadav, K.V. Thomas) and a `status` line (political remarks, no allegation of wrongdoing). "Food minister"
  corrected to Minister of State.
- **hdb019**: removed "81.35 crore people", which is the answer to a schemes-lane item (hsc019).
- **hdb021**: **re-angled**. Poll-union already has a twin item on the same CAG audit that asks the 8.5% ineligible
  share and whose explanation gives 13.46%, the figure hdb021 asked. Both items are tagged `distribution`, so each
  would give the other away in Seedha Khaate Mein. hdb021 now asks about the ₹164.60 crore a private bank was
  reimbursed, against the rules, for loans to microfinance institutions. That fact is on the same Hindu page and
  poll-union does not use it. Added a `status` line; no person or bank is named. No CBI case over the audit turned
  up in reporting.
- **hdb022**: replaced the Wikipedia source with the Indian Express 2014 schedule.
- **hdb023**: the ET page did not tie Dharmendra Pradhan to PAHAL. Added ET EnergyWorld (Dec 2015; Pradhan, as
  petroleum minister, presented PAHAL's Guinness certificate to the PM) and The Hindu (Nov 2014 relaunch in 54
  districts).
- **hdb025**: the date was wrong. The CAG report was tabled in Parliament on Friday 12 Aug 2016, so the explanation
  now says "August 2016", not "July". The Hindu first reported the findings on 20 Jul. The label date is now 13 Aug
  2016. "Actual 6.27-cylinder average" is corrected to "2014-15 national average".
- **hdb026**: replaced the Wikipedia source with Rediff. The Ballia launch is also asked by sample.mjs `hzz` item,
  but sample.mjs is not served (index.mjs), so this item was kept.
- **hdb027**: removed a direct statement of hdb020's answer (₹6,000).
- **hdb028**: the budget speech was paraphrased more exactly (first instalment "paid in that financial year").
  Replaced Wikipedia with The Hindu's 2019 schedule. sample.mjs asks the same 1 Dec 2018 date, but it is not served.
- **hdb029**: the status line was made clearer, and the 10 Mar 2019 Model Code date now cites Scroll instead of
  Wikipedia.
- **hdb030**: added The Hindu (2019 schedule) and DW for the poll fields.
- **hdb032**: the 44% figure came from the government's reply in Parliament (Factly), not "finance ministry data".
  It is now attributed that way, with 8.72 crore given.
- **hdb034**: the explanation gave away hdb026's answer (Ballia). It now says the PM spoke by video conference.
  Replaced Wikipedia with the Indian Express 2022 schedule.
- **hdb035**: dropped "first" from the stem, because the PM announced it at both Durg and Ratlam that day and the
  order is not sourced. The status now names Jairam Ramesh and says no ECI finding appears in reporting checked to
  Sep 2026 (Google News searches found none). Added ThePrint for MP 163/230.
- **hdb036**: after the 30 Aug 2023 cut of ₹200 for all consumers, Ujjwala households' combined benefit could be
  read as ₹400 or ₹500, which were two of the distractors. The stem now asks for the targeted subsidy "from ₹200 to
  what", and the options are ₹250/₹300/₹400/₹500. The quote is now exact: Thakur announced the August cut "on the
  occasion of Rakshabandhan and Onam". Mizoram (ZPM) was removed from `poll.result` because no cited page gives it;
  the outcome now says "of the four states counted on 3 December".
- **hdb037**: the ₹42 crore was incentives "disbursed", not "sanctioned" (PIB).
- **hdb038**: removed "₹300", which gave away hdb036's answer.
- **hdb040**: **the outcome was stale**. The BJP won the 2026 West Bengal Assembly election (Business Standard, 4 May
  2026), and the jobs guarantee resumed in Bengal as VB-G RAM G on 1 Jul 2026 "after almost four years" (The Hindu,
  2 Jul 2026). The outcome now says so. Also removed "the BJP alleges corruption in the state", which none of the
  cited pages say; the sources attribute the allegation to the Centre ("alleging financial irregularities",
  "embezzlement"). Added `people` (Mamata Banerjee, and Justices Vikram Nath and Sandeep Mehta) and a `status` line
  (an allegation, not a finding; no person accused). The Supreme Court date of 27 Oct 2025 is confirmed by LiveLaw's
  own 27 Oct story and by the Indian Express; The Hindu's "September 27" is a slip. The `govt: 'NDA'` / `state: 'WB'`
  convention is unchanged.
- **hdb042**: **the stipend was stale**. ETCFO (23 Jul 2026) says ₹4,500 + ₹500 + ₹6,000 was the original design,
  and round III raised the stipend to ₹9,000 (and widened the age band to 18–25). The explanation now gives both.
- **hdb044**: removed "₹6,000" (hdb020's answer). The outcome now adds 64.65 lakh biometric enrolments (PIB, 21 Aug
  2026).
- **hdb045**: the "less per head" rationale is now attributed to the ministry, via its Daily Excelsior statement.
  The Bill is still a draft; no introduction or Cabinet approval was found in reporting to 25 Sep 2026.

### Confirmed with no change needed
hdb003, hdb006, hdb009, hdb016 (the Lancet abstract via E-utilities: from under 5% to 44%, and 3.7 fewer perinatal
deaths per 1,000), hdb020, hdb024, hdb031, hdb033, hdb039, hdb041 and hdb043. Their answers, numbers, dates, names
and distractors all check out against the fetched pages.

### Charter checks
- Motive words are attributed with a reply: "bribe for votes" (Chidambaram, with Modi's reply, hdb029), "blatant
  violation" (Jairam Ramesh, with Modi's reply, hdb035), and "moved with elections in mind" (Mulayam Singh Yadav,
  with K.V. Thomas's assurance, hdb018). No cause of any election result is claimed.
- Person distractors appear only in "who piloted/launched" questions (hdb008, hdb039), which §4b.1 allows. None of
  the wrongdoing-context items (hdb021, hdb025, hdb040) has a person as an option.
- No private individuals. The Hindu's Bandlapalli piece names a job-card holder, who stays out.
- `govt`: NDA 28, UPA 17. Every era is still covered.

### Still open (re-check monthly)
- hdb045: the NFS (Amendment) Bill may be introduced, changed or dropped.
- hdb043: any revision of the NSAP ₹200 rate.
- hdb035: any later ECI action on the Model Code complaint (none found).
- hdb040: Bengal's pending MGNREGS dues "to be released after verification" (The Hindu, Jul 2026).
- Running totals: hdb024, hdb030, hdb031, hdb037, hdb042 and hdb044.
- These earlier notes are superseded by this section: "Wikipedia used only as a second source for polling start
  dates" (no longer used at all), and the hdb040 stale-risk line about whether work restarted (it did, on 1 Jul
  2026).
