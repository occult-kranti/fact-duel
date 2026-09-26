# Money trail — distribution gap-fill: research notes

Lane file: `editions/hisaab/bank/money-gaps-dist.mjs` (`HISAAB_GAPS_DIST`, ids `hdb400`–`hdb424`, 25 items).
Researched and checked in September 2026; every item carries `asOf: '2026-09'`.

- Validator (`node scripts/hisaab-validate.mjs editions/hisaab/bank/money-gaps-dist.mjs`): **OK, no problems.**
  25 items; difficulty simple 8 · expert 9 · extreme 8; answers 6/6/6/7; kind scheme 23 · spend 2.
- Whole bank (`node scripts/hisaab-validate.mjs`, which now picks up this file): OK — no duplicate ids or question
  text across lanes. `node --test tests/hisaab-bank.test.mjs`: 4/4 pass.
- The lane is **not registered** in `editions/hisaab/bank/index.mjs` (outside this lane's write scope).
- All 65 distinct URLs (`sourceUrl` + `sources`) returned HTTP 200 to curl with a browser user-agent on 26 Sep 2026.
- No item uses `people`/`status`: none is about wrongdoing by a named person. Three items carry political
  counter-claims, attributed: hdb410 (the 2022 probe into alleged plate-count inflation by unnamed canteen
  operators), hdb405 (an Opposition charge that Karunya was being stopped, and the minister's reply) and hdb417
  (the BRS calling the waiver a 'betrayal', and the CM's reply).
- Every item is tagged `distribution`; six are also `pre-election` with a `poll` block. `enactedBy` is on 23 of 25
  (hdb403 Chiranjeevi and hdb409 RBI have none: no fetched source names who launched Chiranjeevi, and hdb409 is a
  finding, not a measure). `outcome` is on all 25.

## How sources were found (WebSearch unavailable)

- **Google News RSS** for leads (titles, dates, publishers). Its article links could not be decoded (captcha), so deep
  URLs were resolved through publishers' own sitemaps: Times of India monthly news sitemaps
  (`/staticsitemap/toi/news/YYYY-Month-N.xml`, back to 2003), Indian Express daily sitemaps
  (`/sitemap.xml?yyyy=&mm=&dd=`), New Indian Express and Deccan Herald daily sitemaps, and Frontline's archive sitemap
  (listed in its robots.txt). The Hindu's archive sitemaps are disallowed in its robots.txt and were not used.
- Bing's RSS endpoint ignored everything after the first query word and was useless; DuckDuckGo returned nothing.
- reddit.com was not touched.

### Open and official data used

| source | used for |
|---|---|
| indiabudget.gov.in — Union Budget speeches 2000-01 (Part A sections), 2002-03 (Part A), 2004-05 interim, 2013-14 | Janashree Bima Yojana terms (hdb400); SGRY launch and grain (hdb401); Vajpayee/Yashwant Sinha as PM/FM (hdb400, hdb401); IAY allocations 2000-01 and 2013-14 (hdb406) |
| indiabudget.gov.in — Economic Surveys 2002-03 (ch. 14), 2011-12, 2012-13, 2013-14 (ch. 13) | grain off-take incl. SGRY (hdb401); AABY launch date and cover, JBY merger (hdb400); IAY unit grant revisions and houses built (hdb406) |
| PRS Legislative Research state budget analyses (prsindia.org/budgets/states) | Telangana 2024-25 (Mahalakshmi ₹3,083 cr, Gruha Jyoti, presenter — hdb416); Manipur 2026-27 (women's SHG scheme, presenter, fiscal figures — hdb423). Also checked, nothing usable: Telangana 2025-26 and 2026-27 (Mahalaxmi ₹4,305 cr already in hst265), Manipur 2023-24/2024-25 (no CMHT), MP 2023-24 to 2026-27 (no Kisan Kalyan line), NE states 2026-27 |
| RBI Internal Working Group to Review Agricultural Credit (2019), via The Indian Express explainer of 8 Mar 2026, which quotes it and reproduces its state waiver table | hdb409; waiver sizes in hdb408. rbi.org.in report pages load but are navigation shells; the PDF was not located |
| PM India (pmindia.gov.in) releases and speech texts | Namo Shetkari launch at Shirdi, 26 Oct 2023, and the Washim tranche, 5 Oct 2024 (hdb420) |
| PLOS One (open access) — De Costa et al. 2014 | Chiranjeevi Yojana reach and effect (hdb403) |
| Europe PMC REST API (abstracts only) | read the WHO Bulletin (Mohanan et al. 2014) difference-in-differences abstract on Chiranjeevi; PMC and Europe PMC article pages were captcha/403-blocked, so it is **not cited** in the item (see "for the reviewer") |
| ECI | results.eci.gov.in / eci.gov.in not used (earlier lanes found 2023–24 result pages 404). Seat tallies come from news reports (TOI, IE, NIE, HT, Mint); Wikipedia election pages (read via `action=raw`) are secondary sources for polling dates only |
| CAG, data.gov.in, Open Budgets India, sansad.in, MyNeta | checked for scheme-level figures on these topics; nothing fetched added to the above |

Outlets: The Times of India (9 items as main source), The New Indian Express (5), The Indian Express (4), PRS (2),
indiabudget.gov.in (3), PM India, PLOS One; supporting: Frontline, Deccan Herald, Hindustan Times, Mint.

## Counts

### Era distribution (by `year`)

| 2000–04 | 2005–09 | 2010–14 | 2015–19 | 2020–26 |
|---|---|---|---|---|
| 3 (hdb400–402) | 2 (hdb403–404) | 2 (hdb405–406) | 3 (hdb407–409) | 15 (hdb410–424) |

The whole bank had only 4 items for 2000, 6 for 2001 and 8 for 2003; this lane adds one to each.

### `govt` distribution

| govt | n | items |
|---|---|---|
| BJP | 6 | hdb403, 404 (GJ); 408 (MH); 413 (HP); 415 (MP); 423 (MN) |
| INC | 5 | hdb402, 407, 414 (KA); 416, 417 (TG) |
| SS | 3 | hdb410 (MVA, Uddhav Thackeray); 412 (Shinde); 420 (Shinde-led Mahayuti) |
| NDA | 2 | hdb400, 401 (Centre, Vajpayee) |
| JDU | 2 | hdb418 (cabinet then included the RJD); 422 (NDA) |
| TDP | 2 | hdb419, 421 (AP, TDP-led NDA) |
| Other | 2 | hdb409 (state waivers by many parties, RBI finding); hdb424 (TVK, not in GOVTS) |
| UDF | 1 | hdb405 (Kerala, K.M. Mani, Kerala Congress (M)) |
| UPA | 1 | hdb406 (Centre) |
| DMK | 1 | hdb411 |

New governing parties for the money trail: UDF (first UDF item in any money-trail mode), TVK (first TN item after the
2026 change of government), Manipur (first item for the state), TDP after 2024 and the Telangana Congress's own
flagships. The RJD appears as the deputy-CM party of the cabinet that sanctioned hdb418; no RJD-led (2000–05) transfer
could be sourced. NCP appears only as a coalition partner (hdb410, hdb420), never as the enacting party.

Balance: incumbents that lost after a pre-poll measure — Congress (KA 2018), BJP (HP 2022); incumbents that won — BJP
(MP 2023), NDA (Bihar LS 2024, Bihar 2025), Mahayuti (MH 2024). No item says a transfer caused a result.

### Pre-poll items (no causal claims)

| id | measure | poll | gapDays (from) | result |
|---|---|---|---|---|
| hdb407 | KA co-op loan waiver | KA Assembly 2018 (12 May) | 325 (announced Wed 21 Jun 2017) | Hung: BJP 104, Congress 78, JD(S) 37 |
| hdb413 | HP 50% bus-fare concession for women | HP Assembly 2022 (12 Nov) | 211 (announced Himachal Day, 15 Apr 2022; cabinet nod 26 May = 170) | Congress 40 of 68, BJP 25 |
| hdb415 | MP Kisan Kalyan top-up raised to ₹6,000 | MP Assembly 2023 (17 Nov) | 98 (cabinet Fri 11 Aug 2023) | BJP 163 of 230, Congress 66 |
| hdb418 | Bihar Laghu Udyami Yojana | Lok Sabha 2024, Bihar (from 19 Apr) | 94 (cabinet sanction Tue 16 Jan 2024; launch Mon 5 Feb = 74) | NDA parties 30 of 40 |
| hdb420 | Namo Shetkari tranche at Washim | MH Assembly 2024 (20 Nov) | 46 (tranche 5 Oct 2024; launch 26 Oct 2023 = 391) | Mahayuti 235 of 288, BJP 132 |
| hdb422 | Student Credit Card made interest-free | Bihar Assembly 2025 (6 Nov) | 51 (announced Tue 16 Sep 2025) | NDA 202 of 243 |

Weekdays given by sources ("on Wednesday", "on Friday"…) were checked against the calendar; gapDays were computed
with Python's `datetime`.

## Schemes and measures covered

| name | level/state | launched | enacted by | amount/benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| Janashree Bima Yojana | Centre | 2000-01 budget | Yashwant Sinha, Union FM, BJP | ₹20k natural / ₹50k accidental death; BPL pay half premium (≤₹10/month) | — | — | merged into AABY (2007) | Budget 2000-01 speech; Economic Surveys |
| Sampoorna Grameen Rozgar Yojana | Centre | Sep 2001 | Atal Bihari Vajpayee, PM, BJP | wage work paid partly in free grain | 50 lakh t allocated; 30.6 lakh t authorised by Feb 2002 | grain | — | Budget 2002-03 speech |
| Yeshasvini | KA | Jun 2003 | S.M. Krishna, CM, INC | surgery cover for ₹5/month | 250 surgeries in 27 days; 74 hospitals | ₹14.25 cr collected | KA 2004 (not asked) | TOI 2003 |
| Chiranjeevi Yojana | GJ | Dec 2005 (pilot); Jan 2007 statewide | — (Gujarat govt, BJP) | state pays private obstetricians for deliveries | >6 lakh deliveries since 2007 | fully state-funded | — | PLOS One 2014 |
| Garib Kalyan Melas | GJ | 2009 | Narendra Modi, CM, BJP | scheme benefits, tool kits at events | 1.66 cr people via 1,600+ melas (state claim) | 14th round ₹4,568 cr (2024) | — | IE 2024 |
| Karunya Benevolent Fund | KL | 2011-12 budget | K.M. Mani, FM, Kerala Congress (M) | lottery-funded treatment aid | ~1.5 lakh patients, ~₹1,400 cr (claimed) | — | folded into KASP (2019) | NIE 2019; TOI 2019 |
| Indira Awaas Yojana grant | Centre | 1 Apr 2013 revision | P. Chidambaram, FM (Budget 2013-14), INC | ₹70,000 plains / ₹75,000 hills per house | 301 lakh houses to Dec 2012 | ₹15,184 cr (2013-14 BE) | — | Economic Surveys; Budget 2013-14 |
| Co-op crop loan waiver | KA | Jun 2017 | Siddaramaiah, CM, INC | waiver up to ₹50,000 | 22.27 lakh farmers | ₹8,165 cr (one-time) | KA 2018: hung; BJP 104, INC 78, JD(S) 37 | TOI 2017, 2018 |
| Shetkari Sanman loan waiver | MH | Jun 2017 | Devendra Fadnavis, CM, BJP | waiver up to ₹1.5 lakh + OTS + ₹25k incentive | 89 lakh farmers (announced) | ₹34,022 cr (one-time) | — | TOI 2017; Frontline 2026 |
| State loan waivers (RBI IWG) | 10 states | 2014-15 to 2018-19 | many parties | — | — | ₹2.4 lakh cr in all | 8 of 10 within 90 days of results | IE 2026 (RBI IWG 2019) |
| Shiv Bhojan thali | MH | 26 Jan 2020 | Uddhav Thackeray, CM, Shiv Sena | ₹10 meal; ₹40 subsidy | ~2 lakh a day, 1,800 centres | ~₹220 cr needed (operator's estimate) | revived before BMC polls | IE 2022, 2026; TOI 2025 |
| Vidiyal Payanam | TN | May 2021 | M.K. Stalin, CM, DMK | free ordinary-bus travel | 570.86 cr trips to Oct 2024 | ₹4,000 cr (2026-27 interim) | TN 2026: DMK lost | NIE 2024, 2026; TOI 2026 |
| Anandacha Shidha | MH | Diwali 2022 | Eknath Shinde, CM, Shiv Sena | ₹100 festival ration kit | — | ₹350 cr per round | skipped Diwali 2025 | TOI 2025 |
| HRTC fare concession | HP | Apr 2022 | Jai Ram Thakur, CM, BJP | 50% off for women | — | — | HP 2022: Congress 40/68 | IE 2022; Mint |
| Shakti | KA | 11 Jun 2023 | Siddaramaiah, CM, INC | free bus travel | ~650 cr tickets; 1 cr+ women/day | ₹11,748 cr over 2.5 years | — | TOI 2025; IE 2023 |
| Kisan Kalyan top-up | MP | Sep 2020; raised Aug 2023 | Shivraj Singh Chouhan, CM, BJP | ₹4,000 → ₹6,000 on top of PM-KISAN | — | — | MP 2023: BJP 163/230 | TOI 2020, 2023; NIE |
| Mahalakshmi free bus | TG | 9 Dec 2023 | Bhatti Vikramarka Mallu, DyCM & FM, INC (2024-25 budget) | free bus travel | 290 cr+ trips in 28 months | ₹3,083 cr (2024-25 BE) | — | PRS; TOI 2026 |
| ₹2 lakh crop loan waiver | TG | Jul–Aug 2024 | A. Revanth Reddy, CM, INC | waiver up to ₹2 lakh | 25 lakh+ farmers | ~₹21,000 cr paid of ₹31,000 cr planned | — | TOI 2024; NIE 2024 |
| Laghu Udyami Yojana | BR | Jan–Feb 2024 | Nitish Kumar, CM, JD(U) | ₹2 lakh over 5 years in 3 instalments | 94 lakh families eligible; 5 lakh in first round | ₹1,000 cr (2024-25) | LS 2024 Bihar: NDA 30/40 | IE 2024; TOI 2024 |
| Deepam-2 | AP | Nov 2024 | N. Chandrababu Naidu, CM, TDP | 3 free LPG refills a year | 90.1 lakh (2025-26) | ₹2,684 cr (stated); ₹2,601 cr (2025-26 BE) | — | NIE 2024, 2025 |
| Namo Shetkari Mahasanman Nidhi | MH | Oct 2023 | Narendra Modi, PM, BJP (launch) | ₹6,000/yr on top of PM-KISAN | 86 lakh+ farmers | ~₹1,900 cr (Washim tranche, per PM) | MH 2024: Mahayuti 235/288 | PM India; IE |
| Stree Shakti | AP | 15 Aug 2025 | N. Chandrababu Naidu, CM, TDP | free bus travel | 87 cr+ trips; 24 lakh women/day | ₹3,095 cr (first year) vs ₹1,942 cr estimate | — | NIE 2025, 2026; DH |
| Student Credit Card (interest-free) | BR | Oct 2016; changed Sep 2025 | Nitish Kumar, CM, JD(U) | loans up to ₹4 lakh, now interest-free | — | — | Bihar 2025: NDA 202/243 | TOI 2025; IE; HT |
| Women's SHG assistance | MN | 2026-27 budget | Y. Khemchand Singh, CM, BJP | ₹10,000 in year one by DBT | 3.5 lakh women over 3 years | ₹350 cr (2026-27) | — | PRS; TOI |
| Vettri Payanam expansion | TN | from 2 Oct 2026 | C. Joseph Vijay, CM, TVK | free travel extended to deluxe/mofussil buses | ~1 cr women/day expected | ~₹6,000 cr (from ~₹4,400 cr) | — | NIE 2026 |

## Items dropped and why

- **Kerala UDF ₹1-a-kg rice (2011)** and **Oommen Chandy mass-contact aid**: TOI 2011 sitemaps had no matching story;
  The Hindu URLs could not be resolved (archive sitemaps disallowed); NDTV blocks fetches.
- **Kerala CHIS (2008, LDF)**: Frontline's 2008 archive URLs carry no slugs; the Nov 2008 issue was scanned and the
  article not found.
- **Gujarat MA Yojana (2012)** and **Vanbandhu Kalyan Yojana (2007)**: MA Yojana not found in TOI 2012–13 sitemaps.
  IE (17 Mar 2021) confirms Vanbandhu was 'launched by former chief minister Narendra Modi in 2007', but prints the
  second phase's five-year spend as 'Rs 1 lakh' (apparently ₹1 lakh crore), and no source gave the 2007 package size.
- **Manipur CMHT**: only e-pao, Imphal Times, Sangai Express and Eastern Mirror carried it, and their deep URLs could not
  be resolved from Google News; PRS Manipur analyses do not mention it. Replaced by the 2026-27 women's SHG scheme
  (hdb423), which stays on scheme money only.
- **Meghalaya (Mukul Sangma), Nagaland (NPF), Tripura CPI(M) pensions**: no fetchable source.
- **Annapurna (2000-01)**: the Budget 2000-01 speech sections read do not mention it; launch year still unconfirmed.
- **TN free bicycles (2001)**, **UP Kanya Vidya Dhan (2004)**: not found in TOI 2004–05 sitemaps.
- **Uttarakhand Gaura Devi Kanya Dhan**: NIE (18 Apr 2021) says it was launched in 2017, which conflicts with the
  scheme's older history; dropped as contested. Nanda Devi Kanya Yojana and HP's Mother Teresa scheme were not found.
- **Rajiv Gandhi Jeevandayee (MH, 2012)**: only a TOI Nagpur story (Oct 2012) on hospitals starting to treat patients,
  with no launch date, cover or reach. **Rajiv Aarogyasri (AP, 2007)**: not found in TOI 2007–08 sitemaps.
- **Karnataka Bhagyalakshmi (2006)** — kept as a reserve: TOI (1 Dec 2024) says the first batch, 2.36 lakh girls
  registered in April 2006, got ₹32,351 each at maturity. The launch attribution (OneIndia, 14 Nov 2006) could not be
  fetched (OneIndia's 2006 day sitemaps returned no URLs), and the fact asked would date to 2024 under a different
  government, so it was not written.
- **Kerosene DBT pilot, Kotkasim (2011)**: no source found. **Aadhaar DBT launch (1 Jan 2013)**: already asked by hsc056.
- **Rajasthan's Dec 2018 waiver (Gehlot)**: the RBI table in IE gives ₹18,000 crore (1.9% of GSDP); folded into the
  context of hdb409 rather than written separately (The Hindu's 19 Dec 2018 URL not resolvable).
- **Maharashtra's June 2026 waiver (₹36,585 crore)**: folded into hdb408's outcome rather than a separate item.
- **RJD-led Bihar (Rabri Devi, 2000–05)**: no cash or in-kind transfer could be sourced from fetchable pages; the RJD
  appears only as the deputy-CM party of the cabinet in hdb418.
- **AP Annadata Sukhibhava 2025**, **Haryana Parivar Samridhi timing**, **Rajasthan's 2024 PM-KISAN top-up**, **Saat
  Nischay Swayam Sahayata Bhatta**, **Garib Kalyan Mela first-edition total**: not reached in time.
- **MP Kisan Kalyan July 2026 payout** (₹3,308 crore to 82.7 lakh farmers, per ANI/Free Press Journal headlines): deep
  URLs not resolved; not used.

## Contested or discrepant figures (reviewer: please double-check)

- **Bihar LS 2024 (hdb418)**: IE's winners list gives BJP 12, JD(U) 12, LJP(RV) 5, HAM(S) 1 = 30 for NDA parties; an
  IE Political Pulse piece (6 Jun 2024) says the NDA won '31 of the 40'. The item uses 30 with the breakdown.
- **MH 2017 waiver (hdb408)**: TOI ₹34,022 crore; the RBI table (via IE) ₹34,020 crore; IE (Oct 2020) '₹35,000 crore'.
- **Telangana waiver (hdb417)**: planned ₹31,000 crore (NIE); about ₹21,000 crore paid by Dec 2024 (TOI); the BRS said in
  Aug 2024 that ₹17,900 crore could not cover a ₹2 lakh waiver. The item gives TOI's total and both sides' claims.
- **Namo Shetkari at Washim (hdb420)**: the PM's words ('More than 90 lakh farmers … have been given approximately 1,900
  crore rupees') do not make clear whether that was the day's tranche or cumulative; the item says 'had been given'.
- **gapDays choices**: hdb418 counts from the 16 Jan 2024 cabinet sanction (94; the 5 Feb launch gives 74); hdb420
  counts from the 5 Oct 2024 Washim payment (46; the Oct 2023 launch gives 391); hdb413 counts from the 15 Apr 2022
  announcement (211; the cabinet nod gives 170).
- **Bihar 2025 polling dates (hdb422)**: the Wikipedia infobox currently shows wrong dates (30 Apr / 7 May 2025); IE
  (6 Oct 2025) gives 6 and 11 Nov, which the item uses. Wikipedia is not cited for this item.
- **Claimed, not audited**: Garib Kalyan Mela totals (hdb404, CM's own figures); Karunya reach (hdb405, 'claimed' per
  NIE); Vidiyal trips (hdb411, government release); Stree Shakti first-year cost (hdb421, official data). Each is
  attributed in the text.
- **Chiranjeevi (hdb403)**: a second 2014 study (Mohanan et al., *Bulletin of the WHO* 92(3):187–94), read via the
  Europe PMC API, found no statistically significant change in institutional delivery (2.42 points; 95% CI −5.90 to
  10.74) between 2005 and 2010. It supports the item's outcome but is not cited, because no human-readable page of it
  could be fetched.
- **`govt` labels**: hdb409 is `Other` (a finding about waivers by many parties); hdb424 is `Other` because TVK is not
  in GOVTS (`enactedBy.party` says TVK). hdb418 is `JDU` although the cabinet that sanctioned it included the RJD and
  the JD(U) joined the NDA before the launch; hdb420 is `SS` (Shinde was CM) although the PM launched the scheme.
- **Party of office-holders**: party affiliations of Vajpayee, Yashwant Sinha, Chidambaram, Chouhan and Bhatti
  Vikramarka are not stated on the cited pages (their offices are); they are standard public record.

## Stale-risk facts (re-check before the next release)

- hdb424: the TN expansion was due on 2 Oct 2026; check it took effect and what it costs.
- hdb414: Shakti dues (₹4,006 crore, Dec 2025) move monthly.
- hdb410: Shiv Bhojan dues and the scheme's status after the BMC polls.
- hdb412: whether Anandacha Shidha is revived.
- hdb408: implementation of Maharashtra's June 2026 waiver.
- hdb423: first payouts under Manipur's SHG scheme.
- hdb421, hdb419: Stree Shakti and Deepam-2 costs in the 2026-27 AP budget.
- hdb411: whether the TVK keeps the renamed scheme's allocation.

## Existing items in other lanes that belong in the distribution mode (retro-tags suggested)

None of these has `tags` today. † = also a `pre-election` candidate; the owning lane would have to add a `poll` block.

| ids | file | subject | suggested tags |
|---|---|---|---|
| hst104 | states-north | Delhi free bus travel, pink ticket (AAP, 2019) | distribution |
| hst141 | states-north | J&K free public transport for women (NC, 2025) | distribution |
| hst152 † | states-north | Bihar Mukhyamantri Mahila Rojgar Yojana (poll: Bihar 2025) | distribution |
| hst204 | states-west-south | Gujarat Namo Lakshmi (2024) | distribution |
| hst244 | states-west-south | Kerala Oommen Chandy Health Insurance (UDF, 2026) | distribution |
| hst257, hst258, hst263 | states-west-south | AP NTR Bharosa pensions, AP Talliki Vandanam, TG Rythu Bharosa | distribution |
| hst346 | states-east | Sikkim Aama Yojana (SKM, 2023) | distribution |
| hsc001–004 | schemes | PM-KISAN | distribution |
| hsc005–008 | schemes | Ayushman Bharat PM-JAY | distribution |
| hsc009–013 | schemes | PM Ujjwala Yojana | distribution |
| hsc019–022 | schemes | PMGKAY free grain, NFSA, One Nation One Ration Card | distribution |
| hsc023–028 | schemes | PM Jan Dhan, PMAY-Gramin, PMAY-Urban | distribution |
| hsc036–041 | schemes | MGNREGA / VB-G RAM G | distribution |
| hsc053, hsc054, hsc055, hsc056, hsc058 | schemes | PM SVANidhi, PM Surya Ghar, DBT (2), Saubhagya | distribution |
| hbx013–015 | spending | Union subsidy bill, food subsidy 2020-21, fertiliser subsidy | distribution |

## Verification

Independent adversarial check, 26 Sep 2026. Every item's `sourceUrl`, and the supporting `sources` the item's claims
rest on, was re-fetched with curl and read as text. Each item was checked for the correct option, exact numbers, dates,
`enactedBy`, `poll` fields and gapDays arithmetic (Python `datetime`), charter §2/§4b rules, and wrong distractors.
Where this section and the sections above disagree, this section wins.

**Result:** 25 items checked; 0 dropped; 1 rewritten to a new angle (hdb418); 16 others corrected or tightened.
Validator on the lane: OK (25 items; answers 6/6/6/7; difficulty simple 7 · expert 10 · extreme 8). Whole bank: OK.
`node --test tests/hisaab-bank.test.mjs`: 4/4 pass.

### Confirmed as written (source states the answer, numbers and dates)

hdb401, hdb403, hdb404, hdb408, hdb409, hdb411, hdb419, hdb422, hdb423 (only the source list changed where noted
below; none for these). hdb404's distractors (Keshubhai Patel, Anandiben Patel, Vijay Rupani) are former Gujarat CMs
in a "who launched" question, which §4b.1 allows; none was CM in 2009. hdb408's scheme name ("Shetkari Sanman") is the
one Frontline uses. TOI calls it "Krushi Sanman", so both sources are kept.

### Fixes

| id | what was wrong or weak | fix |
|---|---|---|
| hdb400 | Yashwant Sinha's name was not on any cited page | added the Budget 2000-01 speech opening (`bsa1.htm`), which names Sinha as FM and Vajpayee as PM. The outcome now also gives JBY's reach: 289.94 lakh lives covered by Dec 2012 (ES 2012-13) |
| hdb402 | stem said "co-operative farmers" and "member", and the explanation said "told TOI". TOI says "farmers", and the surgeon spoke at a function. "Member contributions" was not in the source | the stem now says "farmers … an enrolled farmer"; the explanation attributes the quote to the function. The outcome gives the principal secretary's words: "the government had collected ₹14.25 crore, to be deposited in co-operative banks" |
| hdb405 | the reach is "claimed" per NIE, but the stem asked how many it "had helped" | stem: "was it said to have helped" |
| hdb406 | the ₹45,000→₹70,000 revision is not in Chidambaram's budget speech, which only allocated ₹15,184 crore to IAY | enactedBy role narrowed to "Union Finance Minister (IAY allocation, Budget 2013-14)" |
| hdb407 | said the waiver "cost" ₹8,165 crore; TOI calls it a "burden". The Wikipedia source was redundant (TOI gives the 12 May poll date) | wording changed to "a burden of ₹8,165 crore"; Wikipedia removed. Note: the RBI working-group table (via IE) lists Karnataka's 2017-18 waiver at ₹18,000 crore, which differs from TOI's ₹8,165 crore. Neither figure is the answer (₹50,000 per farmer) |
| hdb410 | **distractor also true:** IE (2022) gives the rural thali cost as ₹35, so the rural subsidy was ₹25, which was one of the options. The stem was in the present tense, and the probe wording overstated the source | ₹25 replaced by ₹60, and the stem is dated to 2025–26 (TOI Nov 2025 and IE Mar 2026 both give ₹40 of ₹50). The explanation now follows IE: Fadnavis said "alleged malpractices", including *possible* inflation of plate counts by operators, "would be investigated". No one is named. The outcome adds TOI's facts: left out of the March 2025 budget, ₹21 crore released in late 2025, CCTV at centres |
| hdb412 | outcome said no kit "was given", but TOI (7 Oct 2025) reports only the decision; Google News showed no reversal | now "the state said no Diwali kit would be given, as the finance department could not sanction funds" |
| hdb413 | "cabinet approved it on 26 May" is not printed; IE is dated 27 May. The IE Political Pulse source does not mention the concession, and its headline adds an unrelated corruption frame about the CM. Wikipedia was redundant (Mint gives the 12 Nov poll date) | now "the cabinet then approved it, IE reported on 27 May"; Political Pulse and Wikipedia removed |
| hdb414 | ₹11,748 crore is what the state had *reimbursed*; ₹4,006 crore more was owed, so "spent" was loose. The minister's reply was missing | stem: "how much had the state reimbursed the bus corporations". The outcome gives the exact ₹4,006 crore and transport minister Ramalinga Reddy's reply (₹2,000 crore of state-serviced loans, funding for 2,000 buses) |
| hdb415 | "began topping up … in Sept 2020": TOI reports an announcement on 22 Sept 2020. The 17 Nov 2023 poll date rested on Wikipedia only | stem: "announced a ₹4,000-a-year top-up"; Wikipedia replaced by IE (17 Nov 2023: "MP sees 76% turnout"), which gives Friday 17 Nov |
| hdb416 | "raised transport spending by 125%": PRS's 125% compares the 2024-25 BE (₹8,911 cr) with the 2023-24 *revised* estimate (₹3,967 cr) | stem now says "125% above 2023-24's revised estimate" |
| hdb417 | "paid out by December 2024": TOI says the fourth tranche (announced 30 Nov) *will take* the total to ₹21,000 crore | stem: "With a fourth tranche in Nov 2024, what total did it put its spending at?" |
| hdb418 | **duplicate fact:** hpe219 (money-gaps-poll) already asks "₹2 lakh over five years" from the same IE page. The IE outlays are also internally inconsistent: 5 lakh families × ₹50,000 is ₹2,500 crore, not the "₹250 crore" IE prints, and 20 lakh × ₹50,000 is not "₹1,000 crore" | rewritten to a "who passed it" angle: who was deputy CM in the cabinet that sanctioned it on 16 Jan 2024? Answer: Tejashwi Yadav (IE: "Deputy CM Tejashwi Prasad Yadav"). Distractors are other Bihar deputy CMs (Samrat Choudhary from 28 Jan 2024; Sushil Kumar Modi; Tarkishore Prasad), which §4b.1 allows. enactedBy adds Tejashwi Yadav (RJD). TOI (28 Jan 2024) added for Nitish leaving the Mahagathbandhan. The inconsistent outlay figures were dropped. Difficulty simple → expert. Poll block unchanged (94 days to 19 Apr; NDA 30 of 40, per IE's winners list). Wikipedia removed (IE gives the 19 Apr start) |
| hdb420 | **ambiguity settled:** the PMO release for Washim (5 Oct 2024) says the PM "launched the 5th installment of NaMo Shetkari … disbursing about Rs 2,000 crore". So the ₹1,900 crore in the speech is that day's tranche, not a cumulative total. The seat count 235 (IE) conflicts with hpe222's 230 (The Hindu). ₹12,000, the combined PM-KISAN + state total, was a near-true distractor. Wikipedia was the only poll-date source | explanation now says the 5th instalment was about ₹2,000 crore per the PMO, ~₹1,900 crore per the speech; the PMO release is added. The outcome and poll.result give 235 *with smaller allies* and IE's party figures (BJP 132, Shiv Sena 57, NCP 41 = 230 for the three parties), which reconciles with hpe222. ₹12,000 is replaced by ₹10,000. Wikipedia is replaced by The Hindu (Wednesday 20 Nov 2024) |
| hdb421 | "rode an APSRTC bus": DH says only "travels by bus" | now "travelled by bus" |
| hdb424 | outcome was pre-rollout. NIE (22 Sep 2026) has newer figures. The name needed care: TOI (9 Jul 2026) reported the renaming as "Magalir Payanam", while NIE (25 Aug, 22 Sep 2026) calls it "Vettri Payanam" | outcome refreshed from NIE 22 Sep: at the 21 Sep review, 12,692 buses and ~84.32 lakh women a day from 2 Oct. Two districts wait for a bypoll Model Code of Conduct to lift. The outcome now says "NIE calls the expanded scheme Vettri Payanam". hdb411's outcome ("dropped 'Vidiyal' … in July 2026") is consistent with both |

The unused Wikipedia helper `W` was removed from the file; no item cites Wikipedia any more.

### Author's flagged items: verdicts

- **hdb410** (probe into alleged plate-count inflation): kept, with tightened wording (see fixes). No person is
  named. The probe's outcome was not found, so it is described only as announced ("would be investigated"). IE (Mar
  2026) confirms dues up to nine months late.
- **hdb417** (KTR's "betrayal"): confirmed verbatim in NIE (16 Aug 2024), and so is the CM's "₹18,000 crore in 27
  days". This is a political counter-claim against a party, not a wrongdoing allegation against a person, so no
  status line is needed. Note that NIE's CM story also carries the CM's own allegations ("loot") against BRS leaders;
  the item does not use them.
- **hdb418**: rewritten (see fixes). The "2023 state survey" wording is kept as a neutral description (sources call
  it the caste survey); eligibility is stated by income only. Both attributed quotes from the old version were
  dropped in the rewrite, except the BJP spokesperson's "politically motivated", which is attributed.
- **hdb405, hdb412**: the Opposition charges and ministers' replies are confirmed in TOI and attributed as political
  statements.
- **hdb423**: stays on scheme money only; President's Rule appears only as the TOI swearing-in fact.
- **hdb404**: the §4b.1 exception applies; the totals are the CM's own claims and are attributed.
- **hdb409**: the quote matches IE's RBI extract exactly ("eight out of ten loan waiver announcements since 2014 were
  made within 90 days of their respective states' election results"). No motive is claimed.

### Author's "unverified" list: verdicts

- hdb403: agreed. The WHO Bulletin study is not cited. enactedBy is still absent because no fetched page names who
  launched Chiranjeevi (PLOS One says "the government of Gujarat"). `govt: 'BJP'` is right for Dec 2005.
- hdb418 30 vs 31: 30 confirmed from IE's winners list (BJP 12, JD(U) 12, LJP(RV) 5, one HAM winner; RJD 4, INC 3).
- hdb420 ₹1,900 crore: **resolved.** It is the 5th instalment paid that day (PMO release: about ₹2,000 crore). gapDays
  46 from 5 Oct 2024 is therefore a payment date, as the charter asks.
- hdb424: updated to NIE 22 Sep 2026. The rollout (2 Oct) is still after asOf.
- Parties of office-holders: Vajpayee is now named on a cited page (Budget 2000-01 and 2004-05 interim speeches), and
  so is Sinha. Chidambaram (Budget 2013-14 speech), Chouhan (TOI 2020/2023) and Bhatti Vikramarka (PRS) are named;
  their *parties* remain standard public record, as does the RJD for Tejashwi Yadav.
- Poll dates: all six now rest on non-Wikipedia pages. KA 12 May 2018 (TOI), HP 12 Nov 2022 (Mint), MP 17 Nov 2023
  (IE), LS Bihar 19 Apr 2024 (IE), MH 20 Nov 2024 (The Hindu), Bihar 6 Nov 2025 (IE). All six gapDays re-computed and
  correct: 325, 211, 98, 94, 46, 51.
- hdb408 ₹34,022 vs ₹34,020 vs ₹35,000 crore: ₹34,022 crore is in both TOI (2017) and Frontline (2026). The RBI's
  ₹34,020 crore is a rounding difference. The distractors (₹3,402 / ₹14,022 / ₹64,022 crore) are far from all three.

### Wrongdoing and status lines

No item in this lane concerns wrongdoing by a named person, so none needs `people`/`status`. The only wrongdoing
context (hdb410) names no one and is worded as an allegation to be investigated.

### Balance after verification

`govt`: BJP 6, INC 5, SS 3, NDA 2, JDU 2, TDP 2, Other 2, UDF 1, UPA 1, DMK 1. hdb418 now also names the RJD in
`enactedBy`, as the deputy-CM party of the sanctioning cabinet. Pre-poll results still cut both ways: incumbents lost
in KA 2018 and HP 2022 and won in MP 2023, Bihar LS 2024, MH 2024 and Bihar 2025. No item claims a cause.
