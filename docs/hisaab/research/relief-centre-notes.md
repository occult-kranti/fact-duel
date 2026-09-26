# Relief funds — Centre lane notes (`hrf001`–`hrf041`)

Lane file: `editions/hisaab/bank/relief-centre.mjs` (`HISAAB_RELIEF_CENTRE`, 41 items).
Mode: **Rahat Kosh** (`tags: 'relief'` on every item). One item also carries `pre-election` with a `poll` block
(hrf019, J&K 2014). `node scripts/hisaab-validate.mjs editions/hisaab/bank/relief-centre.mjs` → OK; the whole-bank run
(every lane file present on 26 Sep 2026) → OK; `node --test tests/hisaab-bank.test.mjs` → 4/4 pass. `asOf` is
`2026-09` on every item. The lane is not yet registered in `bank/index.mjs` (the lead does that).

## Sources consulted

Open and official data first; every `sourceUrl` is a page that was fetched and read in September 2026.

- **Rajya Sabha Department-related Standing Committee on Home Affairs, 261st Report "Disaster Management"**
  (presented 7 Aug 2026; `bucketapi.rajyasabha.digital`) — the backbone of the lane: the history of the funds from the
  2nd to the 16th Finance Commission (NCCF ₹500 crore corpus, 12th FC list additions, 13th FC ₹33,581 crore and the
  CRF→SDRF / NCCF→NDRF merger, 14th FC ₹61,219 crore and the 10% local-disaster window, 15th FC SDRMF/NDRMF,
  16th FC ₹2,83,807 crore), MHA's year-by-year SDRF/NDRF release table 2005-06 to 2025-26 (Table 2.3), NDRF
  ₹54,770 crore for 2021-26, NDMF approvals/releases, the UDMA count, lightning mortality.
- **indiabudget.gov.in** (Union budget archive): Budget speeches 2003-04 (Jaswant Singh — NCCD on crude "one year
  only"), 2004-05 interim and July 2004 (checked; no relief figure used), 2005-06 (Chidambaram — ₹3,644 crore
  tsunami packages, ₹10,216 crore programme); **Economic Survey 2002-03** ch. 8 Box 8.1 (drought relief: ₹1,018 crore
  NCCF, ₹1,227 crore CRF, 27.74 lakh tonnes free grain, Task Force under the Deputy PM) and ch. 1 (grain off-take);
  **Finance Bill 2026 memorandum** (NCCD "levied under Finance Act, 2001"; tobacco NCCD schedule change).
- **Finance Commission reports** (fincomindia.nic.in): 11th and 12th FC report archives downloaded and read to
  cross-check the NCCF design (₹500 crore core, recoupment by surcharge). Not cited as `sourceUrl` because they are
  served only as ZIP archives; the Rajya Sabha report states the same facts.
- **PRS Legislative Research**: text of the Disaster Management Act, 2005 (NDMA chaired by the PM; ss. 46–48);
  Bill Track for the Disaster Management (Amendment) Bill, 2024 (introduced 1 Aug 2024; LS 12 Dec 2024; RS 25 Mar
  2025; LS again 27 Mar 2025).
- **PMNRF official site** (pmnrf.gov.in): About page (ten-year income/expenditure/balance table to 2024-25, updated
  17 Aug 2026) and FAQ (independent auditor KKC & Associates LLP; no statutory audit deadline; PM's discretion).
- **PMO India** (pmindia.gov.in): Srinagar flood announcements 23 Oct 2014; PM's Development Package for J&K 7 Nov
  2015; Cyclone Fani aerial survey 6 May 2019. **PIB**: PMGKP ₹1.70 lakh crore release, 26 Mar 2020.
- **Parliament** answers as reported: Lok Sabha Feb 2025 on PMGKP insurance claims (New Indian Express); Rajya Sabha
  27 Nov 2024 on Wayanad (The Hindu).
- **Courts**: Supreme Court COVID ex gratia (June 2021 judgment via The Hindu; Oct 2021 order via LiveLaw; Mar 2022
  hearing via The Hindu); Swaraj Abhiyan drought ruling (May 2016, The Hindu and Mint).
- **CAG** as reported: Union Government accounts 2024-25 (NDRF savings; The News Minute, Mathrubhumi); West Bengal
  performance audits tabled July 2026 (PM CARES PSA plants — Economic Times/PTI; Amphan NDRF claim — Times of India).
- Established outlets for the rest: The Hindu, Frontline, Indian Express, Hindustan Times, Times of India, Economic
  Times, New Indian Express, The News Minute, Scroll, The Wire, Livemint, Rediff (PTI copy), The Quint, Factly,
  The Federal, Mathrubhumi. Wikipedia used once, as a **second** source for J&K 2014 polling dates (not about a person).
- Open data: **Factly/Dataful** (SDRF/NDRF release series, read against the committee's own table).

Tooling: WebSearch was not used (quota exhausted). Discovery ran through Google News RSS (links decoded to the
publisher URL through Google's article redirect endpoint), publisher and ministry site search, the budget/Survey
archive indexes and the Finance Commission download page. Pages were read with curl plus an HTML-to-text filter,
PDFs with `pypdf`. Reddit was not touched. Bing RSS was tried as a discovery channel and returned irrelevant results.

Blocked or unreadable: ndma.gov.in (tunnel closed), archive.pib.gov.in and pre-2005 PIB archive pages (error pages),
NDTV (skipped by policy), india.com (403), one India Today story (403), ThePrint (Cloudflare check), Indian Kanoon
search via curl (no results), the PMNRF 2024-25 receipts-and-payments PDF (scanned image, no text layer — the About
page table was used instead), the MHA DM-division "initiatives" PDF (scanned), indiabudget 2001-02 and 2002-03 budget
speeches (404).

## Era, govt and difficulty distribution

| era | items | ids |
|---|---|---|
| 2000–2004 | 6 | hrf001–hrf006 |
| 2005–2009 | 6 | hrf007–hrf012 |
| 2010–2014 | 8 | hrf013–hrf020 |
| 2015–2019 | 7 | hrf021–hrf027 |
| 2020–2026 | 14 | hrf028–hrf041 |

`govt`: NDA 29 (Vajpayee 2000–04: 5; Modi 2014–26: 24), UPA 12 (2004–14). UPA governed 10 of the 26 years; the lane
gives it 12 of 41 items — the recent years carry more items because 2020–26 has the audited PM CARES/PMNRF data, the
COVID court orders and three Finance Commission cycles' worth of fund data. Both governments appear in the same roles:
PMs announcing ₹1,000 crore interim aid after aerial surveys (Singh 2008/2009/2011/2013, Modi 2014/2019/2020 —
hrf020 asks it as a cross-party item), Home-Minister-led HLC awards below the state's ask (Rajnath Singh 2018,
Amit Shah 2025), and audit/parliamentary findings (PAC 2008 on tsunami funds under UPA; CAG 2026 on unspent NDRF
money under NDA).

`govt` convention (same as dist-centre): the government at the **Centre** that took the decision. `state` is the
affected state for single-state packages so the item also shows in that Rajya Round: GJ (hrf002), BR (hrf011),
KA (hrf012), SK (hrf014), AS (hrf015), UT (hrf016–017), JK (hrf018–019, hrf022), AP (hrf020), KL (hrf024–025,
hrf035–036), OD (hrf026), WB (hrf030); IN for the other 24.

Difficulty 13 simple / 15 expert / 13 extreme. `correctIndex` 9/11/10/11. Kinds: spend 21, institution 19, scheme 1.
`enactedBy` on 22 items; `outcome` on all 41. `people` + `status` on hrf018, hrf034, hrf037 (no wrongdoing context); `status` also on hrf010 (PAC findings).

Pre-election: **hrf019** only — Modi's ₹745 crore (₹570 crore housing + ₹175 crore hospitals) in Srinagar on
23 Oct 2014, 33 days before J&K's first polling day (25 Nov 2014); result hung (PDP 28, BJP 25, NC 15, INC 12 of 87),
PDP–BJP coalition from 1 Mar 2015. The outcome states that no cited source links the aid to the vote. Cyclone Fani
(hrf026) was **not** tagged: the ₹341 crore advance came on 29 April 2019, the day Odisha's last phase voted, and the
₹1,000 crore on 6 May, after Odisha had voted; the item asks about the EC lifting the Model Code for relief instead.
Disaster relief was not tagged `pre-election` merely because a poll followed months later (e.g. Uttarakhand Dec
2013 → LS 2014, Amphan May 2020 → WB 2021), to avoid implying motive.

## Contested items (the other side is in the item)

- **hrf024** Kerala 2018 UAE ₹700 crore — Centre's 2004-policy refusal; UAE ambassador's "no amount finalised".
- **hrf029** Atmanirbhar — Indian Express's "~1% of GDP" analysis vs Sitharaman's framing (land, labour, liquidity,
  laws) and the Finance Ministry's own ₹20.97 lakh crore breakdown.
- **hrf031** COVID ex gratia — petitioners sought ₹4 lakh; the Centre argued s.12 was recommendatory; the court's
  holding; later concern over fake claims.
- **hrf033** PM CARES PSA plants — CAG (WB) finding vs the West Bengal Medical Services Corporation's reply.
- **hrf036** Wayanad ₹260.56 crore vs ₹2,221 crore — Kerala's criticism, Shah's "norms, no bias" line, the HC's
  utilisation-certificate direction.
- **hrf037** DM Amendment — Shah's attributed "freebies" remark with TMC and CPI(M) objections. `people` + `status`.
- **hrf039** CAG NDRF savings — the process for NDRF releases is stated; the cited coverage carried no ministry reply.
- **hrf040** PMO note on Parliament questions — PMO's reasoning (voluntary corpus, Rule 41(2)) vs RTI campaigners.
- **hrf023** Swaraj Abhiyan — the court rejecting the Centre's "federalism, we only fund" position.

## Discrepancies resolved

- **Why the crude NCCD was levied**: FIPI's 2020 pre-budget memo (ET EnergyWorld) says it was for "an earthquake in
  Maharashtra"; the 2003-04 budget speech (primary) says the 2002 drought had left the NCCF short. The speech is used.
- **J&K 2014 result date**: The Quint's timeline says "28 December"; results were declared on 23 December 2014
  (Wikipedia, citing contemporaneous reports). The item does not state the date; the seat tally matches in both.
- **Kerala's Wayanad demand year**: The News Minute (Aug 2026) says "in 2023"; the landslides were in July 2024 and TNM's
  own Oct 2025 story gives the ₹2,221 crore PDNA demand — 2024/25 context used.
- **Amphan damage figure**: the Indian Express printed "Rs 1,02,442 lakh crore" (a typo); ₹1,02,442 crore
  (≈ ₹1.02 lakh crore) used, only as a distractor and in the explanation.
- **PMNRF disbursements**: the FAQ's disbursal column appears shifted by two years against the About page's audited
  income/expenditure/balance table; hrf041 uses the About page.
- **Republished dates**: several Hindu archive pages show "Updated 2021" on 2008–2014 stories; original dates were
  taken from the article text (weekday + context).

## Dropped or folded (and why)

- **PMNRF's 1948 managing committee (incl. the Congress president) and the 1985 hand-over to the PM** — verified via
  Factly (Apr 2020) quoting a Delhi HC judgment; dropped for count. Good candidate for Forward Court (the 2020 forward
  claiming Congress-president approval was needed).
- **2001 Gujarat 2% income-tax surcharge** — only a one-line PTI report (Rediff); folded into hrf002's explanation.
- **Amphan "claim inflated by ₹32,000 crore"** (CAG, tabled July 2026 by WB's new BJP government) — a state-level
  audit finding against the previous TMC government with no TMC response found; left to **relief-states**. hrf030
  uses only the NDRF claim/recommendation figures from that report.
- **Karnataka's 2024 drought suit (₹3,454/3,499 crore released after SC) and Tamil Nadu's Michaung claim (₹37,907
  crore vs ₹276 crore)** — Centre–state disputes, left to **relief-states** (TNM Aug 2026 mentions both).
- **PM CARES ventilators at Faridkot (May 2021)** — Health Ministry denial read (New Indian Express); dropped to avoid a
  single-source item naming manufacturers in a fault context.
- **PM CARES 2024-25: ₹324 crore refund, auditor change (SARC → KKC), two-year delay** (Frontline Aug 2026) — overlaps
  hbx037 (2024-25 balance); not re-asked.
- **IMCT deputed before a state memorandum (MHA decision of 19 Aug 2019)** — committee para 2.13.12; dropped for count.
- **NDMIS spend split** (55.6% agriculture inputs, 23.4% ex gratia, 13% infrastructure) and the **NDRF recovery and
  reconstruction window** (₹4,220.10 crore for Uttarakhand, Sikkim, HP) — good extreme candidates for a refresh.
- **Leh cloudburst 2010** — no fetchable page with the central figure. **Hudhud loss estimate** (TOI "₹70,000 crore")
  — headline only, not fetched, not used. **COVID ex gratia 90-day window** (SCC Online, Mar 2022) — not fetched.
- **"Two days before the EC schedule"** for hrf019 — only an india.com page (403) carried the 25 Oct 2014 schedule
  date; the claim is not made.
- Named private individuals: none. Named petitioners in the COVID case, and Anand Shah (PM CARES advisory board), were
  deliberately not named.

## Stale-risk facts (re-check monthly)

- hrf005 — crude NCCD still levied (ET, Jan 2026; Finance Bill 2026 changed only tobacco NCCD). Any notification
  removing it changes the item.
- hrf036 — further Wayanad releases after the ₹76.16 crore first instalment; the Kerala HC case.
- hrf037 — number of states with an Urban Disaster Management Authority (only Karnataka as of Aug 2026).
- hrf038 — whether the MHA notifies heatwave and lightning nationally.
- hrf039 — any Finance Ministry/MHA response to the CAG's 2024-25 findings; next year's accounts.
- hrf040 — any challenge to, or reversal of, the PMO's 30 Jan 2026 note.
- hrf041 — PMNRF balance when 2025-26 accounts are posted; auditor change.
- hrf034 — PM CARES trustee changes.
- hrf002 — NCCD schedule/effective rates.

## Overlap with other lanes (for the lead)

- **spending** (`hbx`) owns PM CARES receipts (hbx035), 2020-21 disbursals (hbx036), 2024-25 balance (hbx037), the
  SC NDRF plea (hbx038) and the Article 12/RTI stand (hbx039). This lane asks different facts: trustees/advisory board
  (hrf034), PSA plants (hrf033), the PMO's Parliament-questions note (hrf040). hrf034's outcome uses 2022-23
  (₹346 crore) and 4,345 children, not the 2024-25 ₹87.85 lakh that hbx037 mentions.
- **dist-centre** (`hdb`) owns PMGKP cash to Jan Dhan women (hdb032) and NSAP 2020-21 (hdb033); hrf028 asks the PMGKP
  health-worker insurance outcome instead.
- **relief-states** (`hrf1xx`) — likely overlaps on Kerala 2018, Wayanad, Amphan, Uttarakhand 2013. This lane keeps
  the Centre's decisions (policy, HLC awards, PM announcements); state CM relief funds, state audits and state-side
  misuse belong there.
- **states-east** hst308 already mentions the WB CAG/Amphan audit (see retro-tags).

## Retro-tags proposed for existing items (relief mode)

`['relief']`: hbx035, hbx036, hbx037, hbx038, hbx039 (PM CARES); hbx050 (MPLADS money redirected to fight Covid);
hbx014 (2020-21 food subsidy — dist-centre also proposes `distribution`); hst134 (Joshimath compensation and
immediate relief); hst212 (BMC jumbo Covid centres, ED case on Covid-relief spending); hst308 (WB's 28 CAG reports,
incl. the Amphan relief audit — marginal). hdb032 and hdb033 already carry `relief`.

## Schemes and measures covered

| name | level/state | launched (month-year) | enacted by (name, role, party) | amount / benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| National Calamity Contingency Fund (hrf001) | Centre | 2000 (11th FC, 2000–05) | — (FC recommendation, Vajpayee govt) | ₹500 crore initial core, recouped by surcharge | severe calamities beyond state CRFs | ₹1,018 crore released in 2002-03 drought | — | RS Committee 261st Report |
| National Calamity Contingent Duty (hrf002) | Centre | Feb-2001 (Finance Act 2001) | Yashwant Sinha, FM, BJP | levy to refill NCCF; tobacco schedule 25%→60% (2026) | all taxpayers of covered goods | not stated in sources | — | Finance Bill 2026 memo; Rediff/PTI |
| 2002 drought relief (hrf003–004) | Centre | Jul-2002 | Task Force under the Deputy PM (NDA) | ₹1,018 cr NCCF, ₹1,227 cr CRF, 27.74 lakh t free grain | 13+ states | as listed | — | Economic Survey 2002-03 |
| NCCD on crude (hrf005) | Centre | Feb-2003 | Jaswant Singh, FM, BJP | ₹50/t crude, 1% on cars etc., "one year" | oil producers | not stated | LS 2004 (NDA lost) | Budget speech 2003-04; ET Jan 2026 |
| No-foreign-aid policy (hrf006) | Centre | Dec-2004 | Manmohan Singh, PM, INC | declined foreign-govt aid | all disasters to 2020 | — | — | Indian Express 2018/2021 |
| Tsunami: Rajiv Gandhi Rehabilitation Package (hrf007, hrf010) | TN, KL, AP, PY, A&N | Jan–Feb-2005 | P. Chidambaram, FM, INC | ₹3,644 cr; ₹10,216 cr programme | 5 states/UTs | — | — | Budget speech 2005-06; Frontline 2009 |
| Disaster Management Act (hrf008) | Centre | Dec-2005 | UPA govt (Parliament) | NDMA under the PM; NDRF/NDMF/SDRF | national | — | — | PRS (Act text) |
| 12th FC calamity list (hrf009) | Centre | 2005–10 | — | landslides, avalanches, cloudbursts, pests added | all states | SDRF releases ₹2,623–3,792 cr/yr | — | RS Committee report |
| Kosi floods aid (hrf011) | BR | Aug-2008 | Manmohan Singh, PM, INC | ₹1,000 cr + 1.25 lakh t grain; "national disaster" | ~20 lakh displaced | — | Bihar 2010 (not tagged) | Economic Times 2008; TOI 2024 |
| Karnataka–AP floods (hrf012) | KA, AP | Oct-2009 | Manmohan Singh, PM, INC | ₹1,000 cr each | 226 deaths in KA | — | — | The Hindu 2009 |
| 13th FC SDRF/NDRF (hrf013) | Centre | 2010–15 | — | ₹33,581 cr; 75:25 / 90:10 | all states | ₹25,488 cr SDRF + ₹17,559 cr NDRF released over 5 yrs | — | RS Committee report |
| Sikkim earthquake aid (hrf014) | SK | Sep-2011 | Manmohan Singh, PM, INC | ₹1,000 cr vs ~₹1 lakh cr estimate | Sikkim | — | — | The Hindu 2011 |
| Assam floods aid (hrf015) | AS | Jul-2012 | Manmohan Singh, PM, INC | ₹500 cr ad hoc | ~20 lakh people | — | — | Rediff/PTI 2012 |
| Uttarakhand 2013 aid (hrf016–017) | UT | Jun/Dec-2013 | Manmohan Singh, PM, INC | ₹1,000 cr; PMNRF ₹2 lakh/death; ₹7,346 cr package | Uttarakhand | — | LS 2014 (not tagged) | The Hindu 2013 |
| J&K floods aid (hrf018–019, hrf022) | JK | Sep/Oct-2014, Nov-2015 | Narendra Modi, PM, BJP | ₹1,000 cr; ₹745 cr; ₹7,854 cr flood component of ₹80,068 cr | J&K | — | J&K Assembly Nov–Dec 2014: hung (PDP 28, BJP 25) | HT; PMO India; The Quint |
| Hudhud interim aid (hrf020) | AP | Oct-2014 | Narendra Modi, PM, BJP | ₹1,000 cr | Visakhapatnam region | — | — | Indian Express 2014 |
| 14th FC (hrf021) | Centre | 2015–20 | — | ₹61,219 cr; 10% for local disasters | all states | SDRF ₹8,756–10,938 cr/yr | — | RS Committee report |
| Swaraj Abhiyan order → NDMF (hrf023) | Centre | May-2016 (order) / Feb-2022 (fund) | Supreme Court; NDA govt | NDMF: ₹5,685 cr approved, ₹741.8 cr released | states' mitigation projects | — | — | The Hindu; Mint; RS report |
| Kerala floods 2018 (hrf024–025) | KL | Aug–Dec-2018 | Rajnath Singh, HM, BJP (HLC) | UAE ₹700 cr declined; ₹3,048.39 cr NDRF vs ₹4,700 cr sought | 488 deaths | — | — | Indian Express; The Hindu |
| Cyclone Fani (hrf026) | OD | Apr–May-2019 | Narendra Modi, PM, BJP | ₹341 cr + ₹1,000 cr; MCC lifted in 11 districts | >10 lakh evacuated | — | LS/Odisha 2019 under way (not tagged) | Scroll; PMO India |
| NDRF releases (hrf027) | Centre | 2005–2025 | — | peak ₹18,531 cr (2019-20) | all states | ₹869 cr (2023-24) to ₹18,531 cr | — | RS Committee Table 2.3 |
| PMGKP health-worker insurance (hrf028) | Centre | Mar-2020 | Nirmala Sitharaman, FM, BJP | ₹50 lakh cover | ~22 lakh workers; 2,545 claims paid | ~₹1,272 cr paid in all | — | PIB; New Indian Express |
| Atmanirbhar package (hrf029) | Centre | May-2020 | Narendra Modi, PM; Nirmala Sitharaman, FM, BJP | ₹20.97 lakh cr headline incl. ₹8.02 lakh cr RBI | economy-wide | ~1% of GDP fresh spending (IE) | — | Indian Express |
| Amphan aid (hrf030) | WB | May-2020 | Narendra Modi, PM, BJP | ₹1,000 cr advance; ₹2,707.7 cr NDRF vs ₹35,018 cr sought | WB (16 districts) | — | WB 2021 (not tagged) | TOI (CAG); Scroll; IE |
| COVID ex gratia (hrf031) | Centre/states | Jun–Oct-2021 | Supreme Court; NDMA | ₹50,000 per death from SDRF | families of Covid dead | — | — | LiveLaw; The Hindu |
| Foreign aid accepted (hrf032) | Centre | Apr-2021 | NDA govt | aid from ~40 countries | national | — | — | Indian Express |
| PM CARES PSA plants (hrf033) | Centre | 2021 | Narendra Modi, PM (PM CARES chair), BJP | 1,224 plants funded | one per district | — | — | TOI; ET/PTI (CAG WB) |
| PM CARES trustees/advisers (hrf034) | Centre | Sep-2022 | PMO (PM CARES trust) | PM CARES for Children: 4,345 children; ₹346 cr (2022-23) | — | — | — | The Hindu; Frontline |
| Wayanad (hrf035–036) | KL | Nov-2024 – Oct-2025 | Amit Shah, HM, BJP (HLC) | "severe nature"; ₹529.50 cr loan; ₹260.56 cr NDRF vs ₹2,221 cr | Wayanad | — | Kerala Assembly 2026 (not tagged) | The Hindu; TNIE; TNM |
| DM (Amendment) Act 2025 (hrf037) | Centre | Mar-2025 | Amit Shah, HM, BJP | UDMAs, statutory HLC/NCMC, databases | only Karnataka UDMA by Aug 2026 | — | — | Indian Express; PRS; RS report |
| 16th FC disaster funds (hrf038) | Centre | 2026–31 | — | ₹2,83,807 cr; heatwave + lightning | all states | ≈₹56,761 cr/yr (average of the 5-yr corpus) | — | RS Committee report |
| CAG: NDRF savings (hrf039) | Centre | Aug-2026 (report) | — | ₹5,356 cr of ₹11,474 cr transferred | states | — | — | The News Minute; Mathrubhumi |
| PMO note on Parliament questions (hrf040) | Centre | Jan-2026 | PMO | PM CARES, PMNRF, NDF questions inadmissible | — | — | — | Indian Express; The Wire |
| PMNRF (hrf041) | Centre | 1948 | PM (chair) | balance ₹6,852.19 cr (2024-25) | disaster victims, medical aid | ₹282.43 cr spent (2024-25) | — | pmnrf.gov.in |

## Verification

Adversarial re-check, 26 Sep 2026. A second agent re-fetched the `sourceUrl` of all 41 items with curl and read every
stated figure, date, name and role on the page (PDFs through `pypdf`). It also re-read most `sources`, re-checked every
status against the newest coverage it could find (Google News RSS to Sep 2026), re-did the poll arithmetic and tested each
distractor. **Result: 41 checked, 0 dropped, 41 kept; 16 items edited.** No item was renumbered. After the edits,
`node scripts/hisaab-validate.mjs editions/hisaab/bank/relief-centre.mjs` prints OK, the whole-bank run prints OK and
`node --test tests/hisaab-bank.test.mjs` passes 4/4.

### Items the pages confirm with no change needed (25)

hrf003, hrf004, hrf005, hrf006, hrf007, hrf008, hrf009, hrf012, hrf013, hrf015, hrf016, hrf017, hrf020, hrf021, hrf022,
hrf023, hrf025, hrf027, hrf029, hrf031, hrf033, hrf034, hrf035, hrf036, hrf041. Each figure, date and `enactedBy`
name, role and party matched the fetched page. Notes on some of them:
- The **Rajya Sabha 261st report** (bucketapi.rajyasabha.digital) was re-read in full at paras 2.13.2–2.13.25 and
  Table 2.3. It confirms the NCCF ₹500 crore corpus, the 12th FC additions, the 13th FC ₹33,581 crore / 75:25 / 90:10
  split, the 14th FC ₹61,219 crore / 10%, the 15th FC ₹1,60,153 crore + ₹68,463 crore, NDRF ₹54,770 crore, the NDMF
  guidelines of 28.02.2022 (₹5,685 crore approved, ₹741.8 crore released), the full SDRF/NDRF release series, the 16th FC
  corpus of ₹2,83,807 crore, heatwave/lightning, and 35.8% (2,887 of 8,060). The report was presented to the Rajya Sabha
  on 7 Aug 2026.
- **Primary cross-check found for the 2001 facts.** The Union Budget 2001-02 speech is on indiabudget.gov.in at
  `/budget_archive/ub2001-02/bs/speech.htm`, with parts `gujarat.htm` and `speech_b.htm` (the old `speecha.htm` path
  returns 404). It states that the "NCCF, set up with initial corpus of Rs 500 crore as a result of the Eleventh Finance
  Commission recommendations", sent ₹500 crore at once to Gujarat. Para 110 proposes the special excise levy on tobacco
  to refill the NCCF, and Part B keeps "the surcharge of 2% for relief to quake hit areas of Gujarat". This settles two
  of the author's unverified points (hrf001/hrf002).
- hrf005: ET (15 Jan 2026) confirms the ₹50/tonne crude NCCD, "originally valid until February 29, 2004", still levied.
  The Finance Bill 2026 memo's excise section changes only the tobacco NCCD and the biogas/diesel notifications. A Google
  News search to Sep 2026 found no notification removing the crude NCCD. The status stands.
- hrf015: the India Today magazine page returned 200 this time and says "Manmohan Singh represents Assam in the Rajya
  Sabha". The clause in the stem is now verified.
- hrf029: the "land, labour, liquidity and laws" phrase is in the listed IE tranche breakdown (17 May 2020), not in the
  ExplainSpeaking page. Both pages are cited, so no edit was needed.
- hrf033: 1,224 funded and 1,100+ commissioned (TOI, 7 Oct 2021). West Bengal CAG: 23 of 46 PM CARES plants were
  functional in Dec 2023, and the WBMSCL's reply is quoted with the CAG's rejoinder (ET/PTI, 26 Jul 2026).
- hrf036: TNM (2 Oct 2025) gives ₹260.56 crore against ₹2,221 crore, "about 11 per cent", and calls it the "first
  dedicated financial assistance". TNM (16 Aug 2026) gives the ₹76.16 crore first instalment and the HC's
  utilisation-certificate direction and "co-operative federalism" reminder. NIE (15 Feb 2025) gives ₹529.50 crore under
  SASCI, 50 years, spend by 31 Mar 2025, and "challenging" per FM Balagopal. No later ruling or release was found
  (search to 26 Sep 2026).
- hrf041: the PMNRF FAQ (KKC & Associates LLP, no statutory audit period, PM's discretion) and the About page (1948, no
  budgetary support, not constituted by Parliament; 2024-25: ₹695.00 crore income, ₹282.43 crore spent, balance
  ₹6,852.19 crore; 2015-16: ₹2,637.03 crore) both confirmed.

### Fixes (16 items)

| id | what was wrong / weak | fix |
|---|---|---|
| hrf001 | stem said "initial core amount"; the report and the 2001 speech both say "corpus". The outcome's ₹1,018 crore rested on a source not listed on the item | stem → "initial corpus"; added the 2001 budget speech (`gujarat.htm`) and ES 2002-03 Box 8.1 as `sources`; outcome now also records the ₹500 crore sent to Gujarat from the NCCF in 2001 (primary) |
| hrf002 | `state: 'GJ'` misfiled a national excise levy in the Gujarat Rajya Round; the explanation leaned on a one-line PTI report for the Gujarat surcharge | `state` → `IN`; explanation rewritten from the primary 2001 speech (Part B para 110 and the 2% Gujarat surcharge); `speech_b.htm` added to `sources` (Rediff kept as a second source) |
| hrf010 | stem said money was "diverted and misspent"; Frontline's summary of the PAC says "diverted for other purposes … diversion … and other related irregularities" | stem reworded to the report's terms ("diverted to other purposes … the diversion and related irregularities") |
| hrf011 | distractor "As a 'disaster of severe nature'" is a real official MHA category that could be argued to apply, so the item risked a second defensible answer | replaced with "As a 'regional emergency'" |
| hrf014 | `sourceLabel` date was vague ("Sep 2011") | → "(29 Sep 2011)" (page metadata) |
| hrf018 | `sourceLabel` date wrong: HT page is dated 23 Oct 2014, not 25 Oct | corrected to 23 Oct 2014 |
| hrf019 | polling dates rested on Wikipedia | Wikipedia removed. The first phase on 25 Nov 2014 comes from Rediff/PTI (2 Dec 2014: "The first phase of the five-phase polls … on November 25"). The end of polling on Saturday 20 Dec comes from NIE (21 Dec 2014). The tally comes from The Quint. gapDays re-computed: 23 Oct → 25 Nov 2014 = 33 days ✓. Result PDP 28 / BJP 25 / NC 15 / INC 12 of 87 ✓ (TOI's counting-day story also has PDP 28, BJP 25 and INC 12) |
| hrf024 | explanation said "the UAE ambassador" said no amount was finalised; NIE attributes that to UAE embassy officials; the Kerala side's argument was missing | now "UAE embassy officials"; added the CM's reply that there was no blanket ban on goodwill aid (NIE). The CM is not named, so no `people` entry is needed |
| hrf026 | explanation said Odisha was "in the middle of" its elections on 30 Apr 2019, but Odisha's last phase had voted on 29 Apr | now: votes cast but not yet counted, and the EC let polled EVMs in two districts be moved (Scroll/IANS) |
| hrf028 | correct option "2,545" was the only exact figure among three "About …" options, which gave the answer away | options now "About 250 / About 22,000 / About 2 lakh / About 2,500"; the explanation keeps the exact 2,545 |
| hrf030 | stem asked what was "recommended". IE (31 Jul 2026, on the same CAG report) shows the central team first recommended ₹2,500.29 crore, and ₹2,707.77 crore was approved after the NEC. The outcome's "under 8% of the claim" framing also sat beside a CAG finding (the damage estimates were "not supported by proper evidence") that the item does not carry | stem → "cleared, subject to adjusting its SDRF balance"; explanation notes the ₹2,500.29 crore first proposal; outcome replaced with the actual NDRF release (₹2,250.28 crore); IE Political Pulse added to `sources`. The inflation allegation is still left to relief-states. No TMC response was found in TOI, The Hindu, IE or Mathrubhumi coverage (Jul–Aug 2026) |
| hrf032 | explanation tied the 16-year policy to "the 2004 tsunami", which the cited 2021 page does not say; the government's own framing was missing | wording follows the 2021 page ("policy of the previous 16 years"); added the officials' line that India made no appeal and accepted gifts "with gratitude"; IE 2018 (tsunami origin) added to `sources` |
| hrf037 | outcome stated as fact "by Aug 2026 only Karnataka had set one up"; the report says "as per information provided to the Committee" | now attributed: "a Rajya Sabha committee said in Aug 2026 that only Karnataka had set one up"; "creating" → "allowing" urban authorities (the Act empowers states; it does not create them) |
| hrf038 | explanation said the 16th FC "set" the corpus; a Finance Commission recommends | → "recommended" |
| hrf039 | outcome implied the ₹67,882 / 46,013 / 36,219 crore savings were disaster money; TNM says "under 'Transfers to states' under various schemes" | now "across schemes"; wording kept to the CAG's own quote ("despite being regularly pointed out in our Audit Reports") |
| hrf040 | the only counterpoint cited was RTI campaigners; the opposition's reaction was known only from an unfetched headline | ETV Bharat (9 Feb 2026) fetched: the Congress (Pawan Khera) said the PMO was blocking scrutiny. Explanation now reads "The Congress and RTI campaigners said it blocked scrutiny" (the party is named, the person is not); ETV Bharat added to `sources`. No reversal or court challenge of the 30 Jan 2026 note was found up to Sep 2026 |

### Drops

None. Every item's key fact was found on a fetched page. The lane stays at 41 items (target 40), so no replacement
items were needed. The id range and correctIndex spread are unchanged (9/11/10/11). Difficulty is unchanged
(13 simple / 15 expert / 13 extreme). `state` now shows IN 25 because of the hrf002 move.

### Sensitive items: the verifier's view

- hrf010: acceptable. No person is named, the status is set, and the stem now uses the PAC's own words. The primary
  PAC report (Lok Sabha, 25 Apr 2008) and the 2006 CAG audit still could not be fetched: eparlib.sansad.in does not
  connect from this sandbox. Frontline (13 Feb 2009) quotes both.
- hrf018, hrf034, hrf037: named people appear in no wrongdoing context, and a `status` line is present. Distractors in
  the "who" questions are roles or amounts, not people. Ratan Tata (hrf034) died in Oct 2024. The item is historical
  (appointments of Sep 2022), so it is not changed.
- hrf019: the timing is stated as a fact with no motive word. The outcome says no cited source ties the aid to the
  result. It is the lane's only `pre-election` item, and its poll block was re-verified.
- hrf024, hrf036, hrf039: the other side is in each explanation. For hrf039 no ministry reply had been reported by
  26 Sep 2026, and the item says so.
- hrf030, hrf033: see the fix table for hrf030. hrf033 carries WBMSCL's reply and the CAG's rejoinder.

### Still unverified at primary level (caveats for the lead)

- hrf028: the Lok Sabha answer (7 Feb 2025) was read through the New Indian Express; sansad.in was not fetched.
  PIB 26 Mar 2020 confirms the ₹50 lakh cover for about 22 lakh workers.
- hrf030, hrf033, hrf039: CAG reports were read through TOI, IE, ET/PTI, TNM and Mathrubhumi. cag.gov.in serves a
  JavaScript shell to curl.
- hrf010: see above.
- In the notes table, the 16th FC "≈₹56,761 cr/yr" is the author's own average and appears in no item. Treat it as
  derived, not sourced.
- The earlier line "Wikipedia used once" (under Sources consulted) no longer applies: hrf019 now cites no Wikipedia page.
  The `state` list under "Era, govt and difficulty" is out of date for hrf002, which is now `IN`, not `GJ`.

### Status re-check dates (all `asOf: 2026-09`)

hrf005: no removal of the crude NCCD found. hrf036: no Wayanad ruling or release after the Aug 2026 coverage.
hrf037: UDMA count as reported to the committee (Aug 2026). hrf039: no ministry reply found. hrf040: no reversal
found. hrf041: PMNRF page last updated 17 Aug 2026.
