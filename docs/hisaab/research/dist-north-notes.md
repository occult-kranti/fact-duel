# Distribution — North & Hindi belt: research notes

Lane file: `editions/hisaab/bank/dist-north.mjs` (`HISAAB_DIST_NORTH`, ids `hdb100`–`hdb145`, 46 items).
Researched and checked in September 2026; every item carries `asOf: '2026-09'`.

- Validator (`node scripts/hisaab-validate.mjs editions/hisaab/bank/dist-north.mjs`): **OK, no problems.**
- Whole bank (`node scripts/hisaab-validate.mjs`): OK. `node --test tests/hisaab-*.test.mjs`: 29/29 pass.
  The lane is **not yet registered** in `editions/hisaab/bank/index.mjs` (outside this lane's write scope).
- All 81 distinct URLs (source + `sources`) returned HTTP 200 to curl with a browser user-agent on 25 Sep 2026.

## Counts

| | |
|---|---|
| States | UP 9 · PB 6 · HR 5 · BR 5 · RJ 5 · DL 5 · UT 3 · JH 3 · HP 3 · JK 2 |
| Difficulty | simple 15 · expert 16 · extreme 15 |
| correctIndex | 12 / 11 / 11 / 12 |
| Kind | scheme 42 · spend 3 (CAG audits) · institution 1 (Supreme Court) |
| Tags | all 46 `distribution`; 17 also `pre-election` (each with `poll`) |
| `enactedBy` | 45 of 46 (hdb102 omitted — the source does not name who launched it) |
| `outcome` | 46 of 46 |

### Era distribution (by `year`)

| 2000–04 | 2005–09 | 2010–14 | 2015–19 | 2020–26 |
|---|---|---|---|---|
| 2 (hdb100–101) | 6 (hdb102–107) | 5 (hdb108–112) | 10 (hdb113–122) | 23 (hdb123–145) |

2000–04 is thin: news archives for state-level handouts from that period are hard to reach without
search. Both items there rest on primary or near-primary sources (Haryana's own pension rate table; The
Indian Express on Punjab's free-power history). See "Dropped" for what was tried.

### `govt` distribution

| govt | n | items |
|---|---|---|
| BJP | 15 | hdb112, 117, 119, 122, 123, 126, 127, 129, 131, 132, 133, 138, 142, 143, 145 |
| INC | 9 | hdb100, 102, 107, 109, 115, 120, 124, 130, 144 |
| JDU | 5 | hdb104, 118, 125, 136, 140 |
| AAP | 5 | hdb114, 121, 128, 134, 141 |
| SP | 4 | hdb103, 110, 111, 116 |
| Other | 4 | hdb101 (INLD), hdb105 (SAD–BJP), hdb113 (PDP–BJP), hdb139 (NC) |
| BSP | 2 | hdb106, 108 |
| JMM | 2 | hdb135, 137 |

`govt` follows the states-north convention: whoever ran the state when the thing asked about happened.
So hdb128 (Delhi Ladli CAG findings as of Dec 2022) is `AAP` although the scheme was launched by Sheila
Dikshit (INC, in `enactedBy`); hdb140 (Feb 2026) is `JDU` — Nitish Kumar was still CM; Samrat Choudhary
(BJP) took over on 15 Apr 2026. hdb115 is `INC` although central rule was in force on either side of the
~24 hours the question is about.

Balance: every party that governed these ten states between 2002 and 2026 appears as both launcher and
subject of scrutiny. Audits/critiques land on SP (laptop and jobless-allowance CAG audits), AAP-era
Delhi (Ladli CAG), BJP Haryana (Khemka on Parivar Samridhi; Lado Lakshmi reach), BJP UP (19-paise
waiver certificates), JMM (18 lakh names deleted), INC Punjab ("₹7 cheques"), BJP Delhi (MP/MLA
endorsement PIL) and the JD(U)-led NDA (Supreme Court plea on pre-poll payments).

### Pre-poll items and what happened (no causal claims)

| id | measure | poll | gap (days) | incumbent |
|---|---|---|---|---|
| hdb101 | HR pension ₹300 (INLD) | HR 2005 | 94 | lost |
| hdb106 | UP Mahamaya Balika Ashirvad (BSP) | LS 2009 (UP) | 91 | BSP 20 of 80 |
| hdb107 | HR pension ₹500–700 (INC) | HR 2009 | 226 | re-elected |
| hdb116 | UP Kanya Vidya Dhan ₹30,000 (SP) | UP 2017 | 179 | lost |
| hdb119 | RJ loan waiver ₹50,000 (BJP) | RJ 2018 | 298 | lost |
| hdb121 | DL 200 free units (AAP) | DL 2020 | 191 | re-elected |
| hdb122 | JH Krishi Ashirwad (BJP) | JH 2019 | — | lost |
| hdb124 | PB ₹3/unit cut (INC) | PB 2022 | 111 | lost |
| hdb126 | UP phones/tablets (BJP) | UP 2022 | 47 | re-elected |
| hdb129 | HP free 60 units (BJP) | HP 2022 | 291 | lost |
| hdb130 | RJ smartphones (INC) | RJ 2023 | 107 | lost |
| hdb133 | HR pension ₹3,000 (BJP) | HR 2024 | 278 | re-elected |
| hdb134 | DL Mahila Samman (AAP) | DL 2025 | 55 | lost |
| hdb135 | JH Maiya ₹2,500 (JMM) | JH 2024 | 102 | re-elected |
| hdb136 | BR pension ₹1,100 (JD(U)) | BR 2025 | 138 | re-elected |
| hdb140 | BR ₹10,000 MMRY (JD(U)) | BR 2025 | 41 | re-elected |
| hdb144 | HP Pyari Behna announced (INC) | LS 2024 (HP) | 89 | BJP swept 4/4 |

The record cuts both ways (7 re-elected, 9 lost, 1 mixed); the items state results only. No outcome
field attributes a result to a handout: the only cause-and-effect claim in the lane is hdb118, which
reports a named study (Mitra & Moene, IGC 2017) on education outcomes, not votes. Opinions such as
"election gimmick" (hdb121), "copycat"/"nakalchi sarkar" (hdb136), "betrayal" (hdb117, hdb119, hdb124)
and "competitive populism" (hdb133) are attributed to whoever said them, with the other side's position.

`gapDays` = days from the announcement / first payment named in the stem to the first polling day. For
hdb122 the first state payment date could not be sourced, so `gapDays` is omitted.

## Method and sources

WebSearch was unavailable (quota). Discovery used **Google News RSS** (`news.google.com/rss/search`,
English and Hindi editions) with a small script that decodes the RSS article links to publisher URLs;
every page was then read in full with curl (HTML → text, JSON-LD `articleBody`) or WebFetch. No reddit
or mirrors were touched. NDTV returned 403 to scripts (not used); The Hindu Centre report body was not
reachable; India Today's 2012 Annashree page returned 403 at research time.

Open / official data used:
- **Government of Haryana, Social Justice & Empowerment — Old Age Samman Allowance rate history**
  (socialjusticehry.gov.in; every rate change 1987–Nov 2025): hdb101, hdb107, hdb133.
- **CAG audit reports as reported** (The Indian Express, TNIE): UP laptops 2012–14 (hdb111), UP
  unemployment-allowance functions (hdb110), Delhi Ladli scheme (hdb128).
- **Supreme Court proceedings** (Verdictum report of *Jan Suraaj Party v. ECI*, W.P.(C) 107/2026): hdb140.
- **Delhi High Court PILs** (LiveLaw; HT on the government affidavit; ANI via The News Mill): hdb143.
- **State Assembly answers** as reported: Rajasthan smartphones (hdb130, minister Rathore, Jan 2024),
  Rajasthan free medicines (hdb109), J&K Ladli Beti (hdb113, minister Itoo), Jharkhand deletions (hdb137).
- **PMO** (pmindia.gov.in) for the Bihar MMRY launch; **All India Radio** (newsonair.gov.in) for the J&K
  cabinet decisions and the MMRY third phase.
- **ECI results**, through established outlets (The Hindu, Frontline, HT, IE, Mint, Scroll) and, for poll
  dates and seat counts only, Wikipedia election pages as a second source (HR 2005/2009, UP 2017/2022,
  RJ 2018, DL 2020, HP 2022).
- **Ideas for India** (the authors' own summary of the IGC working paper) for the cycle-scheme study.

Established outlets otherwise: The Indian Express, The Hindu, Frontline, Hindustan Times, The Times of
India, TNIE, Business Standard/PTI, ThePrint/PTI, The Tribune, The Economic Times, India Today, Rediff
(BS copy), ETV Bharat, Garhwal Post; Hindi: Dainik Bhaskar (2014 UP budget), Prabhat Khabar (2026 SP
promise), Navbharat Times (Mulayam-era schemes, background only).

## Compact table of measures covered

| scheme / measure | state | launched | enacted by (role, party) | amount / benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| Free farm power suspended (hdb100) | PB | Oct 2002 (suspension) | Amarinder Singh (CM, INC) | free power withdrawn till Nov 2005 | all farmers | ₹7,715 cr subsidy (2026-27) | — | IE 2023 |
| Old-age allowance ₹300 (hdb101) | HR | Nov 2004 | O.P. Chautala (CM, INLD) | ₹200 → ₹300/month | — | — | HR Feb 2005: INC 67/90, INLD 9 | Haryana SJE |
| Rakshak Yojana (hdb102) | PB | 2005 | (INC govt) | girl-child cash transfer | 306 by Mar 2010 | — | — | Frontline 2012 |
| Unemployment allowance (hdb103) | UP | Feb 2006 budget | Mulayam Singh Yadav (CM, SP) | ₹500/month to jobless graduates | — | est. ₹250 cr | UP 2007: SP lost (not in item) | HT 2006 |
| Mukhyamantri Cycle Yojana (hdb104, hdb118) | BR | 2006 | Nitish Kumar (CM, JD(U)) | ₹2,000 per Class 9 student | 1.56 L (2007-08) → 11.3 L (2024-25) | — | — | IE 2025; I4I |
| Atta-dal (hdb105) | PB | 15 Aug 2007 | Parkash Singh Badal (CM, SAD) | wheat ₹4/kg, dal ₹20/kg | BPL families; now 40 L NFSA families | ₹1,000 cr kits (2026) | — | Tribune 2026 |
| Mahamaya Garib Balika Ashirvad (hdb106) | UP | Jan 2009 | Mayawati (CM, BSP) | ₹22,000 NSC → ₹1 L at 18 | BPL girls born from 15 Jan 2009 | ₹2,000 cr (with sister scheme) | LS 2009: BSP 20/80 | IE 2009 |
| Old-age allowance ₹500–700 (hdb107) | HR | 1 Mar 2009 | B.S. Hooda (CM, INC) | ₹300 → ₹500–700/month | — | — | HR Oct 2009: INC 40/90 | Haryana SJE |
| Mahamaya Garib Arthik Madad (hdb108) | UP | Nov 2010 | Mayawati (CM, BSP) | ₹300/month to woman head | ~31 L BPL families | ₹535 cr (phase 1) | — | The Hindu 2010 |
| Free medicines (hdb109) | RJ | 2 Oct 2011 | Ashok Gehlot (CM, INC) | free essential drugs; tests from 2013 | 52.4 cr visits to Dec 2017 | — | — | IE 2019 |
| Berozgari bhatta revival (hdb110) | UP | May 2012 | Akhilesh Yadav (CM, SP) | ₹1,000/month | ~1.26 L cheques 2012-13 | ₹20.58 cr paid; ₹15.06 cr on events | — | IE 2017 (CAG) |
| Free laptops (hdb111) | UP | 2012–14 | Akhilesh Yadav (CM, SP) | laptop to Class 12 pass | 14.35 L; 4.55 L left out | ₹2,822.71 cr supply | — | IE 2015 (CAG) |
| Bhamashah card (hdb112) | RJ | 15 Aug 2014 (relaunch) | Vasundhara Raje (CM, BJP) | bank account for woman head | all families (target) | — | — | Rediff/BS 2014 |
| Ladli Beti (hdb113) | JK | Sep 2015 | Mufti Mohammad Sayeed (CM, PDP) | ₹1,000/month; ~₹6.5 L at 21 | 2.03 L enrolled (2026) | ₹450 cr (2025-26) | — | ETV Bharat 2026 |
| Water-bill waiver (hdb114) | DL | Feb 2016 | Arvind Kejriwal (CM, AAP) | 25–100% of pending dues | by property category | — | — | The Hindu 2016 |
| "CM for a night" decisions (hdb115) | UT | 21–22 Apr 2016 | Harish Rawat (CM, INC) | pension hikes among 11 decisions | lapsed | — | — | TOI 2016 |
| Kanya Vidya Dhan (hdb116) | UP | Aug 2016 (revamp) | Akhilesh Yadav (CM, SP) | ₹30,000 per Class 12 girl | 89,100 girls | ₹267.30 cr | UP 2017: BJP 312/403 | TOI 2016 |
| Farm loan waiver (hdb117) | UP | Apr 2017 | Yogi Adityanath (CM, BJP) | up to ₹1 L | ~86 L farmers | ~₹36,000 cr (one-off) | — | The Hindu 2017; HT |
| Crop loan waiver (hdb119) | RJ | Feb 2018 | Vasundhara Raje (CM, BJP) | up to ₹50,000 | small/marginal, coop loans | ₹8,000 cr (one-off) | RJ Dec 2018: INC 100/199 | TOI 2018 |
| Farm debt waiver (hdb120) | PB | Jan 2018 | Amarinder Singh (CM, INC) | up to ₹2 L | 5.63 L (phase 1) | ~₹2,700 cr (phase 1) | — | HT 2018 |
| 200 free units (hdb121) | DL | 1 Aug 2019 | Arvind Kejriwal (CM, AAP) | free ≤200 units; ~50% to 400 | ~35–70% of consumers | — | DL 2020: AAP 62/70 | The Hindu 2019 |
| Krishi Ashirwad (hdb122) | JH | 2019 | Raghubar Das (CM, BJP) | ₹5,000/acre (+PM-KISAN = ₹11k–31k) | — | — | JH 2019: JMM alliance 47/81 | HT 2019 |
| Grihini Suvidha (hdb123) | HP | 2018–20 | Jai Ram Thakur (CM, BJP) | free LPG connection | 2,76,243 families | — | — | ET Energy 2020 |
| ₹3/unit tariff cut (hdb124) | PB | 1 Nov 2021 | C.S. Channi (CM, INC) | ₹3/unit off (≤7 kW) | ~69 L of 71 L consumers | ₹1,500–1,800 cr (withdrawn 2024) | PB 2022: AAP 92/117 | BS/PTI 2024; India Today |
| Kanya Utthan (hdb125) | BR | 2021-22 hike | Nitish Kumar (CM, JD(U)) | ₹50,000 graduate; ₹25,000 Class 12 | up to 1.6 cr girls | — | — | India Today 2021 |
| Phones/tablets (hdb126) | UP | 25 Dec 2021 | Yogi Adityanath (CM, BJP) | free smartphone/tablet | target 1 cr | ₹3,000 cr earmarked | UP 2022: BJP 255/403 | HT 2021 |
| Parivar Samridhi (hdb127) | HR | 2019 | M.L. Khattar (CM, BJP) | ₹6,000/yr per family | 8.78 L paid (13.51 L enrolled) | ₹270.84 cr paid to mid-2021 | — | IE 2021 |
| Ladli (Delhi) CAG (hdb128) | DL | 2008 (audit to Dec 2022) | Sheila Dikshit (CM, INC) | up to ₹1 L at 18 | 8.84 L active; 55% unpaid | ₹618.38 cr unclaimed | — | TNIE 2025 |
| Free 60 units (hdb129) | HP | Jan 2022 | Jai Ram Thakur (CM, BJP) | free ≤60 units; ₹1/unit to 125 | ~11 L consumers | ₹60 cr | HP 2022: INC 40/68 | IE 2022 |
| Indira Gandhi smartphones (hdb130) | RJ | 10 Aug 2023 | Ashok Gehlot (CM, INC) | phone + data | 24.56 L women | ₹1,670.08 cr | RJ 2023: BJP 115/199 | IE 2024 |
| ₹450 LPG (hdb131) | RJ | 1 Jan 2024 | Bhajan Lal Sharma (CM, BJP) | cylinder at ₹450 (was ₹500) | ~76 L BPL families | (Gehlot's ₹500: ₹750 cr) | — | The Hindu 2023 |
| Kanya Sumangala (hdb132) | UP | 2019; hike 2024-25 | Yogi Adityanath (CM, BJP) | ₹15,000 → ₹25,000 in 6 stages | 16.24 L girls | — | — | IE 2023 |
| Old-age pension ₹3,000 (hdb133) | HR | 1 Jan 2024 | M.L. Khattar (CM, BJP) | ₹3,000/month (₹3,200 from Nov 2025) | 17.85 L | ₹5,538 cr (2023-24) | HR 2024: BJP 48/90 | TOI 2024 |
| Mahila Samman (hdb134) | DL | Mar 2024 budget; Dec 2024 | Atishi (CM, AAP); Kejriwal | ₹1,000 approved; ₹2,100 promised | est. 40–50 L (Kejriwal) | ₹2,000 cr budgeted | DL 2025: BJP 48/70 | IE 2024 |
| Maiya Samman (hdb135, hdb137) | JH | 3 Aug 2024 | Hemant Soren (CM, JMM) | ₹1,000 → ₹2,500/month | ~50 L; 18 L names deleted | ₹13,363 cr (2025-26) | JH 2024: JMM alliance 56/81 | BS 2024; TNIE 2025 |
| Social security pension (hdb136) | BR | Jun 2025 | Nitish Kumar (CM, JD(U)) | ₹400 → ₹1,100/month | ~1.1 cr | +₹921.41 cr/yr | BR 2025: NDA 202/243 | IE 2025 |
| Lado Lakshmi (hdb138) | HR | Sep 2025 | Nayab Singh Saini (CM, BJP) | ₹2,100/month | 5.22 L in 1st instalment | ₹5,000 cr budgeted (hst115) | — | ThePrint 2025 |
| Pensions / AAY sops (hdb139) | JK | Mar 2025 budget | Omar Abdullah (CM, NC) | pensions ₹1,250/1,500/2,000; 200 units free | 10 L+ pensioners | — | — | AIR 2025 |
| Mahila Rojgar Yojana (hdb140) | BR | 26 Sep 2025 | Nitish Kumar (CM, JD(U)); launched by PM Modi | ₹10,000 (+ up to ₹2 L promised) | 1.81 cr women | ₹18,100 cr to Feb 2026 | BR 2025: NDA 202/243 | Verdictum 2026; HT 2026 |
| Mawan Dhiyan Satikar (hdb141) | PB | Mar 2026 budget | Bhagwant Mann (CM), Harpal Cheema (FM), AAP | ₹1,000/month (more for some) | ~97% of adult women | ₹9,300 cr | PB 2027 (due) | IE 2026 |
| Nanda Gaura (hdb142) | UT | (2017) | Pushkar Singh Dhami (CM, BJP) — 2026 transfer | ₹11,000 at birth; ₹51,000 after Class 12 | 3.78 L girls cumulative | ₹145.93 cr (2025-26) | UT 2027 (due) | Garhwal Post 2026 |
| Delhi Lakshmi (hdb143) | DL | notified 6 Aug 2026 | Rekha Gupta (CM, BJP) | ₹2,500/month (₹1,500 RD + ₹1,000 e-rupee) | up to 17 L women | ₹5,110 cr (2026-27) | — | HT 2026 |
| Pyari Behna (hdb144) | HP | announced Mar 2024; approved May 2026 | Sukhvinder Sukhu (CM, INC) | ₹1,500/month | 2 L in phase 1 | not announced | LS 2024 (HP): BJP 4/4 | ET 2026 |
| Free bus 60+ women (hdb145) | UT | Aug 2026 | Pushkar Singh Dhami (CM, BJP) | free Roadways travel | women 60–64 added | — | UT 2027 (due) | TOI 2026 |

## Items dropped or folded in, and why

| idea | outcome |
|---|---|
| UP Kanya Vidya Dhan — Mulayam-era launch year and amount | Sources disagree (₹20,000 per Prabhat Khabar, ₹25,000 per Navbharat Times; year not stated). Folded into hdb116 without a figure. |
| UP 2014-15 budget defunding laptops, jobless allowance and Kanya Vidya Dhan (Dainik Bhaskar) | Folded into hdb116's explanation. |
| Delhi Dilli Annashree Yojana (₹600/month, 2012–13) | Only source found (India Today) returned 403; The Hindu Centre report body not reachable. |
| Bihar 125 free units (announced 17 Jul 2025, 1.67 crore homes; IE) | Verified; dropped only to keep Bihar at 5 new items beside hst152. Ready to add (gap 112 days, NDA 202/243). |
| Bihar RJD complaint to ECI on MMRY transfers of 17/24/31 Oct 2025 (ThePrint/PTI) | Folded into hdb140 `sources`; no ECI reply found, so not asked. |
| Tejashwi Yadav's April 2026 claim that women were warned their money would be withdrawn | Unanswered allegation about voter intimidation; no response or evidence found. Not used. |
| Punjab Smart Connect phones (Aug 2020, ₹92 cr, 1,74,015 students; TNIE) | Verified; dropped for balance. |
| Punjab 300 free units (Jul 2022) | Overlaps hst108 (power-subsidy bill); mentioned in hdb124 only. |
| Delhi free LPG on Holi/Diwali (Feb 2026, ₹853 via DBT, ₹242 cr; IE) | Verified; dropped for balance. |
| Haryana Ladli (2005, Hooda) | No deep-linkable source found. |
| Haryana pension ₹1,000 from Jan 2014 | Kept to hdb107's explanation to avoid four near-identical pension cards. |
| Haryana Saksham Yuva (2016 honorarium) | Only a headline seen. |
| HP 50% bus-fare concession for women (2022) | Headlines only; not read in full. |
| UP Samajwadi Pension Yojana (2014–17) | No fetchable primary figures. |
| Tribune: atta-dal was the "driving force" behind SAD–BJP's 2012 win; Frontline/BS: Maiya Samman "helped" the JMM | Causal claims by newspapers, not named studies — not used as causes. |
| Pre-2005 items in JH, BR, RJ, DL, HP, UT, JK | Searches (English and Hindi, pre-2010 date filters) found nothing fetchable and specific. |

## Contested or delicate items (reviewer, please read)

- **hdb140 (MMRY, Supreme Court)** — the plea was withdrawn, not decided; the Court said freebies are
  under separate examination. Whether Jan Suraaj then went to the Patna High Court, and with what result,
  was **not verified**. ₹15,600 crore and "25–35 lakh after the code" are the petitioner's figures.
- **hdb143 (Delhi Lakshmi endorsement)** — PILs pending (hearing 17 Sep 2026); outcome unknown. The
  government's defence (affidavit of 15 Sep) is in the explanation.
- **hdb134 (Delhi Mahila Samman notices)** — the officers who issued the notices worked under the L-G's
  control; AAP said the BJP pressured them. Both sides are in the explanation.
- **hdb127 (Parivar Samridhi)** — one officer's review of government data; no government reply found.
- **hdb106** — one distractor ("a bicycle and ₹25,000 on reaching Class 11") is the real sister scheme
  launched the same day; the explanation names it. Swap if the reviewer finds it too tricky.
- **hdb113 (Ladli Beti)** — ETV says ₹1,000 is credited monthly "until 21" and ~₹6.5 lakh is paid at 21;
  the deposit/interest mechanics are not spelled out, so the item says "about".
- **hdb101 / hdb107** — the official page gives dates, not governments; the party in power is inferred
  from CM tenures (Chautala from 24 Jul 1999; Hooda 2005–14), confirmed on the Wikipedia election pages.
- **hdb109** — "ran through the BJP's 2013–18 term" is inferred from the cumulative Oct 2011–Dec 2017 count.
- **hdb115** — `govt: 'INC'` although President's Rule applied before and after the ~24 hours in question.
- **hdb138** — "under 4% of adult women" is AIDWA's figure, attributed.
- **hdb144** — earlier area-wise rollouts (Kinnaur, Banjar) seen only in headlines; not used.

## Statuses at risk of going stale (re-verify monthly)

| id | as written | watch for |
|---|---|---|
| hdb140 | SC plea withdrawn Feb 2026; ₹2 L top-up unpaid (RJD, Apr 2026) | Patna HC petition; second MMRY instalment; SC freebies case |
| hdb143 | PILs pending; payments due from 1 Sep 2026 | HC order on the endorsement rule; whether payments were credited |
| hdb144 | approved May 2026, no outlay | first payments, budget figure |
| hdb141 | budgeted Mar 2026 | rollout; **add `pre-election` + `poll` once the Punjab 2027 schedule is announced** |
| hdb142, hdb145 | 2026 measures | **same for Uttarakhand 2027** |
| hdb113 | new Ladli Beti accounts paused (Aug 2026) | MoU renewal, funds released |
| hdb137 | deleted-names list promised (Mar 2025) | publication; restorations |
| hdb138 | first instalment Nov 2025 | payment schedule changed to quarterly (headline only, Dec 2025) |
| hdb116 | SP promise of ₹50,000 (Sep 2026) | UP 2027 manifestos |
| hdb105 | Meri Rasoi kits from Apr 2026 | rollout and cost |
| hdb100 | ₹7,715 cr farm-power subsidy (2026-27 BE) | revised estimates |

## Existing items that belong in the `distribution` mode (retroTags)

From `states-north.mjs` (not edited — outside this lane's write scope):

| id | subject | suggested tags |
|---|---|---|
| hst104 | Delhi free bus rides for women (pink ticket, 29 Oct 2019) | `distribution`, `pre-election` → poll `{ label: 'Delhi Assembly 2020', month: '2020-02', gapDays: 102, result: 'AAP won 62 of 70 seats; BJP 8' }` |
| hst106 | Delhi Lakshmi / Mahila Samriddhi (₹2,500) | `distribution` |
| hst108 | Punjab power-subsidy bill | `distribution` |
| hst115 | Haryana Lado Lakshmi (₹2,100) | `distribution` |
| hst117 | Haryana Mera Pani Meri Viraasat (₹8,000/acre) | `distribution` |
| hst141 | J&K free public transport for women | `distribution` |
| hst152 | Bihar Mukhyamantri Mahila Rojgar Yojana (₹10,000) | `distribution`, `pre-election` → poll `{ label: 'Bihar Assembly 2025', month: '2025-11', gapDays: 41, result: 'NDA won 202 of 243 seats; BJP 89, JD(U) 85' }` (the schema requires `poll` with this tag) |
| hst159 | Jharkhand Maiya Samman (₹2,500) | `distribution` |
| hst161 | Jharkhand Maiya Samman budget (₹13,363 crore) | `distribution` |

Borderline, left out: hst111 (Punjab ₹10 lakh health cover) and hst147 (Rajasthan Chiranjeevi) are
insurance entitlements rather than transfers; hst119 and hst146 (Old Pension Scheme) concern government
employees' pensions, not public handouts.
