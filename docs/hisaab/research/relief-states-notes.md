# Relief funds — States (`hrf100`–`hrf139`) — research notes

Lane file: `editions/hisaab/bank/relief-states.mjs` (`HISAAB_RELIEF_STATES`, 40 items, target 35).
Mode: every item is tagged `relief`; `hrf124` (Hyderabad ₹10,000) and `hrf136` (Bihar ₹7,000) are also
tagged `pre-election` and carry `poll`. Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/relief-states.mjs`
prints OK. The whole-bank run (all lanes, including the concurrently written `relief-centre.mjs`) also prints
OK, and `node --test tests/hisaab-bank.test.mjs` passes. The lane is not yet registered in `bank/index.mjs`
(the lead does that). All items were checked against fetched pages in September 2026 (`asOf: '2026-09'`).

## Sources consulted

No WebSearch. Leads came from Google News RSS (links decoded to the publisher URL), then each page was
fetched and read. Every `sourceUrl` is a deep link to a page that states the answer.

**Official and primary material (read through the page that reports it):**
- **CAG audit reports.** Kerala Tsunami Rehabilitation Programme (G&SS report for the year to March 2012, via NIE); Uttarakhand 2013 floods (tabled 3 Nov 2015, via Mint); Tamil Nadu 2015 Chennai floods (tabled 9 Jul 2018, via India Today and TNM); West Bengal Cyclone Amphan relief (tabled 25 Jul 2026, via IE, Mathrubhumi and Outlook).
- **Supreme Court orders and hearings.** Kerala 'salary challenge' (The Hindu, 29 Oct 2018); Chennai stampede bail plea (Rediff/PTI, 27 Jan 2006); Covid ex gratia approval (IE, 4 Oct 2021); 5% scrutiny of claims (Rediff/PTI, 24 Mar 2022); Andhra SDRF diversion, *Gaurav Bansal v UoI* (LiveLaw, 18 Jul 2022); Gujarat's ex gratia affidavit (Al Jazeera/Reuters, 14 Dec 2021).
- **High Court and Lokayukta.** Kerala HC stay on the 'letter of dissent' (NIE); Calcutta HC order for a CAG audit of Amphan relief and its refusal to recall it (NIE, 21 Jan 2021); Kerala Lokayukta full-bench order of 13 Nov 2023 (Onmanorama, India Today, HT) and the HC notice on the appeal (Kerala Kaumudi, Jan 2024).
- **Parliament and ministry statements.** Lok Sabha written reply on Wayanad's SASCI money (MoS Finance, via Onmanorama, 19 Aug 2025). MHA statements on Punjab's SDRF balance (IE, 1 Oct 2025), on Karnataka's drought award (TNM, 27 Apr 2024) and on the Tamil Nadu award (NIE, 28 Apr 2024). HLC approvals of Dec 2018 (NIE).
- **State government releases and Assembly replies**, all reported with figures: Bihar CMO (ET/PTI); Delhi social welfare minister (TOI); J&K Deputy CM in the Assembly (ET); Kerala revenue minister in the Assembly (TOI); Assam CM (NIE); Surat collector (IE); GHMC press note (The Hindu).
- **Election results.** GHMC 2020 (TOI live results; NewsMeter for the withheld Neredmet ward) and Bihar 2025 (The Wire). The 2025 pages on `results.eci.gov.in` now return 404 (archived), so the ECI could not be cited directly.

**Established outlets and archives:** Frontline archive (2001–2013 relief coverage — the backbone of the early
eras), India Today magazine archive, The Hindu, Indian Express, NIE, TOI, ET, Business Standard, Mint, The
News Minute, Onmanorama, Down To Earth, Deccan Chronicle, The Tribune, BBC, Al Jazeera (Reuters), LiveLaw,
Rediff (PTI and a book excerpt), Oneindia, Kerala Kaumudi, The Assam Tribune.

**Tried and unavailable:** Bing and DuckDuckGo HTML search returned nothing useful. The Wikipedia API was
rate-limited, and Wikipedia is not used as a source here. Firstpost, ThePrint, NewsClick and India Today NE
pages returned bot walls. Scroll's page did not parse, so TNM carries the same Karnataka story.

## Overlap check (done before and after writing)

I grepped the bank for every scheme and event covered here. The existing items on these subjects are:
- `hst308`, the WB CAG reports tabled after four years: its explanation names the Amphan audit, so I asked for the audit's **findings** instead.
- `hdb220`, TN's ₹2,000 aid in 2019 that cited drought and Cyclone Gaja: not repeated.
- `hbx035`–`hbx039` on PM CARES: central, not repeated.

`relief-centre.mjs` (`hrf001`–`hrf041`) landed while this lane was being written. I read it item by item and
**replaced four of my items that asked the same fact**:

| my item | clashed with | replaced by |
|---|---|---|
| Kosi 2008: which PM declared a national calamity | `hrf011` asks the same classification, and its explanation gives the grain amount | `hrf107` Chennai flood-relief stampede (SC, Jan 2006) |
| Hudhud 2014: ₹1,000 crore interim aid | `hrf020` asks the ₹1,000 crore 'habit', Hudhud included | `hrf113` Maharashtra fodder camps (2013) |
| Titli 2018: ₹539.52 crore NDRF award | `hrf025` explanation gives the same award | `hrf120` asks Naidu's ₹3,673 crore loss claim instead |
| Wayanad 2025: form of the ₹529.50 crore help (SASCI loan) | `hrf036` explanation spells out the loan | `hrf135` Wayanad memorandum ('₹75,000 per funeral') row |

I also removed figures from my outcomes that would give away relief-centre answers: J&K's ₹44,000 crore ask
(`hrf018`) and Amphan's recommended award (`hrf030`). The Kerala award of Dec 2018 (`hrf025`) stays out of my
Titli item.

## Items dropped and why

- **Ockhi helicopter bill, Kerala 2018.** Verified: TNM and NIE, Jan 2018. An order to pay ₹8 lakh for the CM's charter from disaster funds was withdrawn after protests, and the government said the money would come from the SDRF. Dropped only to keep Kerala at five items. It is a ready reserve.
- **Surat floods package, Gujarat July 2026.** Verified: TOI and IE, Jul 2026. Vendors got ₹7,500 to ₹50,000; shops a choice of ₹1 lakh or a 7% interest subsidy; property tax was waived for a year; ₹4.85 crore in cash aid went to 53,999 people. Dropped for count. A ready reserve and a good BJP 2026 item.
- **Kerala CMDRF 2018–19 receipts** (₹4,970.29 crore on the portal after revision) is folded into the `hrf119` outcome. **CAG 'Preparedness and response to floods in Kerala'** (tabled 11 Nov 2021: 18% of 7,112 SDRF works incomplete) is verified but dropped for Kerala balance.
- **Jayalalithaa's Dec 2015 ₹5,000 package** is folded into `hrf117`. **The Centre's ₹276.10 crore for TN (Apr 2024)** is folded into the `hrf132` outcome. **HP's ₹7 lakh house compensation** is folded into the `hrf131` outcome. **The SC's 5% scrutiny of ex gratia claims** is folded into `hrf127`.
- **Kerala's contribution from the Guruvayur Devaswom to the CMDRF.** Skipped to avoid framing a religious institution.
- **Modi's rebuffed Kedarnath rebuilding offer (2013).** Skipped: it concerns a religious site, and the only sources are Modi's own 2017 account plus a line in IBTimes.
- **Hudhud PSU losses 'uncompensated'** (Deccan Chronicle, 2017) is a CPI(M) leader's claim that '₹1,000 crore … not a rupee sent'. It could not be checked against MHA data, so it was dropped.
- **Kerala Kaumudi's '₹24 crore flood-fund scam' headline.** The figure is not supported by the chargesheet (₹27.73 lakh), so it was not used.
- **Assembly results for Rajasthan 2003, Tamil Nadu 2016 and Andhra Pradesh 2004** were not fetched in this lane, so no poll results are claimed for those items.
- **The Assam 2022 'flood relief scam exposed by CM'** story (India Today NE) is behind a bot wall and was not used.

## Contested items (the other side is in the explanation)

- `hrf104`. The ₹228 crore figure is the Kisan Sabha's claim, attributed as such. The state's own ask is in the item.
- `hrf110`. That Gujarat cashed the returned cheque comes from a biography excerpt, and the outcome attributes it to "the excerpt".
- `hrf112`. Frontline's Phailin piece is openly critical, and the item says so. The BJD's charge of UPA apathy is included.
- `hrf115`. The RTI allegations are set against the chief secretary's clean chit. The BJP wanted a CBI probe.
- `hrf117`. Volunteers allege the stickers; the AIADMK denied them and promised action.
- `hrf123`. The CAG findings are set against TMC leader Kunal Ghosh questioning the report's neutrality. Outlook stresses that the audit shows administrative lapses and does not establish criminal wrongdoing.
- `hrf124`. The Congress's 'vote bank' charge is attributed. The SEC halt is fact. No causal claim is made about the GHMC result.
- `hrf131`. Modi's 'bandarbant' allegation and Jai Ram Thakur's claims are set against the HP government calling them baseless. No complaint had been filed.
- `hrf135`. The Opposition calls the memo inflated; the CMO says the figures are NDRF-norm estimates. The actual cremation spend (₹19.67 lakh) is given.
- `hrf139`. The Lokayukta cleared the cabinet; the Opposition leader called the verdict biased; the HC appeal is pending.
- `hrf122` and `hrf133` both have both sides: the Congress's 'humiliated' and 'not a quarter', set against the BJP or Centre saying Karnataka was first in line and that the Election Commission cleared the release.

## Stale-risk facts (re-check monthly)

- `hrf139`. The Kerala HC appeal against the Lokayukta order had notice issued in Jan 2024, and no ruling was found. Kerala has been under a UDF government since May 2026, which could revive the case.
- `hrf128`. Ernakulam flood-fund case: chargesheeted Feb 2021, accused on bail, trial outcome unknown.
- `hrf134`. Sheopur flood-compensation case: an arrest in March 2026 and an investigation under way. Watch for a chargesheet.
- `hrf123`. Amphan relief. West Bengal's BJP government (CM Suvendu Adhikari) said in July 2026 it would seek FIRs if the audit showed wrongdoing; none were reported by the end of July. A special Assembly session on the CAG reports was due.
- `hrf137` and `hrf138`. The Punjab SDRF dispute and the payment of flood compensation are live. Punjab's next Assembly poll is due in early 2027 and could make `hrf138` a pre-election item after the result.
- `hrf130`. The 2026 Assam payments (₹15,000, some families unpaid in Sept 2026) are moving.
- `hrf115`. No proceedings after Dec 2015 were found. If a court or the CBI took it up later, the status changes.
- `hrf136`. Bihar's CM in Sept 2026 is Samrat Choudhary (TOI, 13 Sep 2026). The item is about Nitish Kumar's 2025 transfer, so its facts do not change.

## Distribution

- **Era (year field):** 2000–04 has 5 items; 2005–09 has 5; 2010–14 has 5; 2015–19 has 8; 2020–26 has 17. Pre-2015 items rely heavily on the Frontline archive, which Google News still indexes.
- **Govt (the state government at the time):** INC 8, BJP 6, AIADMK 5, LDF 5, BJD 3, AAP 3, TDP 2, JD(U) 2, and one each for DMK, TMC, BRS, Shiv Sena, YSRCP and Other (the JKNC in J&K).
- **Where the central government is the actor**, the explanation names it:
  - UPA: Phailin 2013 (`hrf112`).
  - NDA (Vajpayee): the 2002–03 droughts in AP, Rajasthan and TN (`hrf102`–`hrf104`).
  - NDA (Modi): J&K 2014–15, Titli, Karnataka 2019 and 2024, TN 2024, Amphan, Punjab 2025, HP 2023–24, Wayanad.
- **Balance of wrongdoing items.** Wrongdoing or misuse items touch the INC (UT 2015; HP, allegation only), the LDF (Ernakulam; Lokayukta, cleared), the AIADMK (stickers; 2005 stampede), the TMC (Amphan audit), the BJP (MP Sheopur case), the YSRCP (SDRF diversion) and the BRS (allegation only). No single party is only ever the villain.
- **State:** TN 6, KL 5, AP 3, OD 3, MH 3, KA 3, UT 3, GJ 2, BR 2, PB 2, and one each for RJ, JK, WB, TG, DL, AS, HP and MP.
- **Difficulty:** 11 simple, 16 expert, 13 extreme. **Answer slots:** 10/11/9/10.

## Measures covered (compact table)

| name | level/state | launched | enacted by (name, role, party) | amount/benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| Quake cash doles (`hrf100`) | GJ | Jan–Mar 2001 | Keshubhai Patel, CM, BJP | cash doles; a room per uprooted family | 8 lakh families (promise) | — | replaced as CM Oct 2001 (not a poll) | India Today 5 Mar 2001 |
| Drought relief work (`hrf103`) | RJ | Aug 2002 | Ashok Gehlot, CM, INC | work cut from 15 to 10 days/month | 32 districts; 20.80 lakh BPL families funded | Centre ₹188.82 cr (cash wages) | RJ Dec 2003 — not sourced here | Frontline 9 May 2003 |
| Tsunami package (`hrf105`) | TN | Jan 2005 | J. Jayalalithaa, CM, AIADMK | ₹400 cash + clothes, rice, kerosene | coastal families | sought ₹4,800 cr from Centre | — | Frontline 28 Jan 2005 |
| Tsunami rehab funds (`hrf106`) | KL | 2005–12 (diversion Oct 2006) | state govt (LDF in Oct 2006) | houses, coastal works | 8,549 of 11,000 houses by 2012 | ₹1,441.75 cr programme | — | NIE 20 Mar 2013 (CAG) |
| Flood relief release (`hrf108`) | MH | Jul–Aug 2005 | Vilasrao Deshmukh, CM, INC | ₹500 cr state + ₹500 cr Centre | 8 lakh families hit | — | — | Frontline 26 Aug 2005 |
| Aasare houses (`hrf109`) | KA | Oct 2009 | B.S. Yeddyurappa, CM, BJP | 1 lakh houses at ₹1 lakh each | Raichur: 11,123 of 12,241 built by 2013 | extra taxes to raise ₹2,000 cr | — | Frontline 6 Nov 2009; The Hindu 26 Sep 2013 |
| CM's relief fund (`hrf111`) | UT | Jun 2013 | appeal by Vijay Bahuguna, CM, INC | donations | ₹181.39 cr by 5 Jul 2013 | — | CM replaced Jan 2014 | Business Standard 5 Jul 2013 |
| Fodder camps (`hrf113`) | MH | 2012–13 | Prithviraj Chavan, CM, INC | 553 camps | 4.52 lakh cattle | ₹749.29 cr | — | Down To Earth 15 Mar 2013 |
| Flood package (`hrf114`) | JK | Sep 2014 | Omar Abdullah, CM, JKNC | ₹200 cr cash; 6 months' free ration | Jammu and Kashmir divisions | Centre approved ₹1,102 cr (2015) | lost office after the 2014 poll (result not sourced here) | The Hindu 12 Sep 2014; ET 6 Apr 2015 |
| Flood package (`hrf117` outcome) | TN | 7 Dec 2015 | J. Jayalalithaa, CM, AIADMK | ₹5,000 (₹10,000 if hut lost) + rice, dhoti, saree | flood-hit families | — | TN May 2016 — not sourced here | ET 7 Dec 2015 |
| 'Salary challenge' (`hrf119`) | KL | Sep 2018 | Pinarayi Vijayan, CM, CPI(M) | a month's pay to the CMDRF, voluntary after the HC/SC | state staff | CMDRF ₹4,970 cr for the 2018–19 floods | — | The Hindu 29 Oct 2018 |
| Fani package (`hrf121`) | OD | May 2019 | Naveen Patnaik, CM, BJD | ₹2,000 + 50 kg rice (worst-hit NFSA families); ₹95,100 per fully damaged house | 1.08 cr affected | — | poll already held Apr 2019 | TOI 5 May 2019 |
| Hyderabad flood relief (`hrf124`) | TG | 19 Oct 2020 | K. Chandrasekhar Rao, CM, TRS/BRS | ₹10,000 per family | 6.64 lakh families by 18 Nov | ₹664 cr | GHMC 1 Dec 2020: TRS 56 of 150, BJP 48, AIMIM 44, INC 2 (gap 43 days) | The Hindu 18 Nov 2020 |
| CM Covid-19 Relief Fund (`hrf125`) | MH | 2020 | Uddhav Thackeray, CM, Shiv Sena | donations; ₹82.4 cr for migrants' train fares | — | ₹799 cr corpus, ₹192 cr spent (Nov 2021) | — | TOI 23 Nov 2021 |
| Covid family aid (`hrf126`) | DL | May/Jun 2021 | Arvind Kejriwal, CM, AAP | ₹50,000 + ₹2,500/month | 21,235 paid by Dec 2021 | — | — | Mint 23 Jun 2021; TOI 13 Dec 2021 |
| Flood cash relief (`hrf130`) | AS | Jun–Jul 2022 | Himanta Biswa Sarma, CM, BJP | ₹3,800 per family; ₹1,000 per student | 1.81 lakh families; 1.01 lakh students | ~₹400 cr for houses | — | NIE 16 Jul 2022 |
| House compensation (`hrf131` outcome) | HP | Oct 2023 | Sukhvinder Singh Sukhu, CM, INC | ₹7 lakh per fully damaged house (was ₹1.3 lakh) | — | ₹4,500 cr package | — | IE 30 May 2024; HT 5 Jul 2024 |
| Michaung cash relief (`hrf132`) | TN | 9 Dec 2023 | M.K. Stalin, CM, DMK | ₹6,000 via ration shops | 24.25 lakh cardholders + 5.28 lakh applicants | ₹1,486.94 cr | — | NIE 22 Dec 2023 |
| Drought NDRF award (`hrf133`) | KA | 26 Apr 2024 | HLC under Amit Shah, Union HM, BJP | ₹3,454 cr (sought ₹18,171 cr); state paid ₹2,000 each to 33 lakh farmers | 223 of 240 taluks | — | LS 2024 phase 2 on 7 May (result not claimed) | TNM 27 Apr 2024 |
| Flood gratuitous relief (`hrf136`) | BR | 20 Aug 2025 | Nitish Kumar, CM, JD(U) | ₹7,000 per family (was ₹6,000) | 6,51,602 families in 12 districts | ₹456.12 cr | Bihar Nov 2025: NDA 202 of 243 (gap 78 days) | ET 20 Aug 2025 |
| Crop compensation (`hrf138`) | PB | 8 Sep 2025 | Bhagwant Mann, CM, AAP | ₹20,000/acre for 75–100% loss | ~3.5 lakh acres, 2,508 villages | — | PB 2027 — pending | IE 8 Sep 2025; TOI 13 Oct 2025 |

## retroTags proposed (existing items that belong in Rahat Kosh)

- `hst134` (states-north, Joshimath subsidence, with compensation and relief payouts): add `relief`.
- `hst308` (states-east, WB CAG reports; its explanation turns on the Amphan relief audit): add `relief`. This one is borderline.
- `hst330` (states-east, Manipur special central grant to rehabilitate displaced people): add `relief`.
- `hdb220` (dist-west-south, TN ₹2,000 in 2019, justified by drought and Cyclone Gaja): add `relief` to its existing `distribution` and `pre-election` tags.
- `hdb229` (dist-west-south, TN Pongal cash ₹2,500 in 2021; the CM cited Covid and cyclone distress): add `relief`. Borderline.
- `hbx035`–`hbx039` (spending, PM CARES: receipts, spending, balance, NDRF plea, RTI): add `relief`. These are central, so relief-centre may propose them too.

## For the reviewer to double-check

- `hrf101` and `hrf104` rest on a single Frontline article each, from 2001 and 2003.
- `hrf113` gives the water-tanker figure as '2.136' in Down To Earth's box, so the item does not use it.
- `hrf123` uses `year: 2020` (when the relief was paid) for a finding tabled in 2026, so that Saal-dar-Saal files it under Amphan's year. The same convention applies to `hrf106` (2006 diversion, 2013 report).
- `hrf134` sets `year: 2026` (the arrest) for a case about 2021 payouts. The accused former tehsildar is a public servant but is **not named**, on purpose.
- `hrf128` names no individuals: a clerk and local party functionaries are described by role only.

## Verification

Adversarial verifier pass, 26 Sep 2026. I fetched all 40 `sourceUrl` pages and all 43 `sources` pages
again with curl. Every one returned 200, and I read each page's text, including the article bodies
that NIE, TNM, Mint, India Today and BS embed as JSON. For every item I checked:
- the correct option, the numbers, the dates and the `enactedBy` names;
- that no distractor is also true;
- the `pre-election` poll arithmetic;
- the status of every wrongdoing item against the newest reporting, through Google News RSS
  with links decoded to publisher URLs.

**Result:** no item was refuted and none is dropped. The lane stays at 40 items and keeps its ids.
26 items were fixed and 14 needed no change. `node scripts/hisaab-validate.mjs editions/hisaab/bank/relief-states.mjs`
prints OK, `node --test tests/hisaab-bank.test.mjs` passes, and a whole-bank `checkBank` shows no
cross-lane problems involving this lane.

### Fixes

- `hrf100`: the stem said Patel's government "kept changing its rules". India Today says "blundering reaction … as many as 11 government orders were issued in 10 days". The stem now follows the source.
- `hrf101`: the explanation credited "an official". The speaker was Saroj Kumar Jha, leader of the UN inter-sectoral team, now described by role and not named. The unsourced BJD clause is now backed by The Hindu (Jul 2023): Naveen Patnaik was sworn in on 5 Mar 2000, leading a BJD-BJP coalition. That page was added to `sources`.
- `hrf103`: the outcome said "no central money had come" for gratuitous relief. It now says "no funds had been allocated", the source's words. The foodgrain figure is attributed to a senior official.
- `hrf105`: the stem's "first relief package gave each affected family" is not in Frontline, which says "the government has begun the distribution of a package". The stem now uses that. The open-market leakage lapse is about the whole national tsunami effort, and the explanation now says so.
- `hrf106`: `govt: LDF` in Oct 2006 is now sourced (HT, 18 May 2006: Achuthanandan sworn in heading an LDF ministry), added to `sources`.
- `hrf107`: "his rumours" became "rumours he allegedly spread". The SC rejected the state's rumour theory, so the item must not presume he spread them.
- `hrf108`: the Frontline source never names Deshmukh. Added Rediff (1 Aug 2005), "Why the Deshmukh government failed", which names "the Vilasrao Deshmukh government" and "the Congress-led government" during the 26 July floods. This backs `enactedBy`.
- `hrf109`: the floods ran from 28 Sep to 3 Oct 2009 (Frontline), so the stem now says "Sept–Oct 2009". "Many funded by donors" was loose; the stem now says "later built under the 'Aasare' scheme".
- `hrf110`: the outcome said "the excerpt says Gujarat cashed the returned cheque". In the book excerpt that is JD(U) president Sharad Yadav's account to Gadkari ("from what he knew"). The outcome now attributes it to him.
- `hrf114`: "approved ₹1,102 crore under SDRF norms" was reworded. ET's "under SDRF norms" qualifies the ₹2,600 crore requirement, not the approval.
- `hrf115` (sensitive): the status is now dated. The chief-secretary committee's clean chit was on 17 Jul 2015 (IE, 18 Jul 2015, added to `sources`). The state did not take up the BJP's CBI demand (Tribune, Dec 2015). I searched Google News for later HC, CBI or recovery action on the 2013 relief bills and found none, so the status reads "checked Sep 2026".
- `hrf119`: the `enactedBy` entry (Pinarayi Vijayan) was unsourced. Added the India Today interview (Sept 2018), in which he describes deciding to issue the Salary Challenge.
- `hrf120`: "much of it in the coconut and cashew belt" overstated TNM, which says only that coconut and cashew trees in Uddanam were uprooted. Softened.
- `hrf121`: "Two days after Cyclone Fani hit" is not stated; TOI (5 May) says only that the package was "already unveiled". The stem is now anchored to landfall on 3 May 2019.
- `hrf122`: the ₹3,100 crore spend was claimed by BJP state general secretary N. Ravi Kumar, and the six lakh relocations by a state disaster official (Frontline). The outcome now attributes each.
- `hrf123` (sensitive): the status was updated. The old line, "no charges were reported as of Jul 2026", was stale. A Calcutta HC order of 30 Jul 2026 (Court Book, added to `sources`) records that police complaints filed since the May 2026 change of government include allegations about Amphan relief distribution. The complaints are against a TMC MP, who is deliberately not named in the item. No chargesheet was found through Sep 2026. The `sourceLabel` used IE's SEO headline ending "…relief was stolen"; it now quotes only "Same photos, many claims", so the label does not imply guilt.
- `hrf125`: the explanation made the CMO say it could not comment on how the rest would be used. TOI's own line is "it was unclear if there were any plans". The explanation now attributes that line to TOI.
- `hrf126`: the distractor "A government job" was close to the scheme's offer to enrol one family member as a civil defence volunteer. It is replaced by "A ₹5 lakh fixed deposit".
- `hrf127`: the stem gave away "₹50,000", which is the answer to relief-centre `hrf031`. The figure is removed from the stem.
- `hrf128` (sensitive): the status "None convicted" was rephrased as "no verdict or conviction reported". Added the party's answer as an `outcome`: the CPI(M) expelled its local members among the accused in March 2020 (The Hindu, 7 Mar 2020, added to `sources`). The ₹10.58 lakh recovery moved to the outcome. No individuals are named. Searches found no verdict.
- `hrf130`: "deadliest floods on record" is the CM's own description ("worst ever … in terms of human casualties") and is now attributed to him. The ₹400 crore for houses was a plan ("we will spend") and now reads that way. The outcome adds the 1.17 lakh families reached in 2026 (Assam Tribune, 13 Sep 2026).
- `hrf131` (sensitive): the "only ₹3 lakh" line was a Mandi councillor's statement (HT) and is now attributed to him. Status: no later complaint or probe was found (checked Sep 2026).
- `hrf133`: "the court asked both sides to settle" is Siddaramaiah's account (The Hindu) and is now attributed. The taluk total differs between sources (TNM says 240, The Hindu 236), so the outcome now says only "223 taluks".
- `hrf134` (sensitive): the status was updated with IE's 1 May 2026 follow-up and HT (27 Mar 2026), both added to `sources`:
  - the FIR was registered in Sep 2023 and widened to Prevention of Corruption Act offences in Mar 2026;
  - both the MP HC and the SC refused the former tehsildar anticipatory bail; the explanation had named only the HC;
  - by May 2026 at least 30 of 110 accused had been arrested;
  - prosecution was sanctioned for her and 18 patwaris;
  - no chargesheet or verdict was found through Sep 2026.
  She is still not named.
- `hrf135` and `hrf139` (sensitive): V.D. Satheesan is now Kerala's CM (UDF, since May 2026; Kerala Kaumudi), so both items now say "then Opposition leader". Statuses are re-dated to "checked Sep 2026". `hrf139` adds LiveLaw (7 Jan 2024) on the HC admitting the appeal. No HC ruling was found in searches through Sep 2026.

### Checked with no change

`hrf102`, `hrf104`, `hrf111`, `hrf112`, `hrf113`, `hrf116`, `hrf117`, `hrf118`, `hrf124`, `hrf129`, `hrf132`, `hrf136`, `hrf137`, `hrf138`.
- `hrf104`: the author's doubt is resolved. The Feb 28 piece itself names "K. Balakrishnan, general secretary, Tamil Nadu unit of the All India Kisan Sabha". The 14 Feb 2003 companion piece names "Prime Minister A.B. Vajpayee".
- `hrf124` (pre-election): the gap is 19 Oct to 1 Dec 2020, which is 43 days. The TSEC halt came on 18 Nov. The result, TRS 56 (including Neredmet), BJP 48, AIMIM 44 and INC 2, is confirmed by TOI and NewsMeter. The 'vote bank' charge is attributed to the Congress.
- `hrf136` (pre-election): the gap is 20 Aug to 6 Nov 2025, which is 78 days. Polling was on 6 and 11 Nov (The Hindu). The Wire gives NDA 202, BJP 89, JD(U) 85, RJD 25. The ECI results pages still 404, so The Wire stays the result source.

### Drops

None. The lane has 40 items, above both the 35 target and the 28-item floor.

### Stale-risk (updated)

- `hrf123`: police complaints over Amphan relief were filed after May 2026. Watch for chargesheets, and for the special Assembly session on the CAG reports.
- `hrf134`: watch for a chargesheet or bail for the former tehsildar.
- `hrf139`: an HC ruling on the appeal against the Lokayukta order is pending. The new UDF government could take a position.
- `hrf128`: the vigilance-court trial outcome is still unknown.
- `hrf115` and `hrf131`: allegation-only items with no proceedings found. Re-check every six months.
