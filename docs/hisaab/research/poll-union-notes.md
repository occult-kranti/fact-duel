# Before the vote — Union lane notes (`hpe001`–`hpe042`)

Lane file: `editions/hisaab/bank/poll-union.mjs` (`HISAAB_POLL_UNION`, 42 items; target 40).
Mode: **Chunav Se Pehle** (`tags: 'pre-election'` on every item, each with `poll`). 7 items also carry
`distribution` (hpe008, hpe012, hpe016, hpe019, hpe022, hpe026, hpe030) and 1 carries `relief` (hpe030).
`node scripts/hisaab-validate.mjs editions/hisaab/bank/poll-union.mjs` → OK; the whole-bank run (every lane file
in the directory on 26 Sep 2026) → OK; `node --test tests/hisaab-bank.test.mjs` → 4/4 pass. `asOf` is `2026-09`
everywhere. The lane is **not yet registered** in `bank/index.mjs` (the lead does that).

## Sources consulted

Every `sourceUrl` is a page fetched and read in September 2026. Open and official data first:

- **Union Budget speech archive, indiabudget.gov.in** (primary for 17 items): 2004-05 interim (Jaswant Singh,
  3 Feb 2004), 2008-09 (P. Chidambaram), 2009-10 interim (Pranab Mukherjee, 16 Feb 2009), 2009-10 (Pranab
  Mukherjee, 6 Jul 2009), 2011-12 (Pranab Mukherjee), 2013-14 (Chidambaram), 2014-15 interim (Chidambaram),
  2017-18 and 2018-19 (Arun Jaitley), 2019-20 interim (Piyush Goyal), 2021-22, 2023-24, 2025-26 and 2026-27
  (Nirmala Sitharaman). The presenter's name and title were read off each speech's header. PDFs read with `pypdf`.
- **Indian Kanoon** — S. Subramaniam Balaji v Govt of Tamil Nadu (SC, 5 Jul 2013), full judgment.
- **Court and legal reporting** — LiveLaw (EC affidavit in the freebies PIL, Apr 2022; 131st Amendment vote, Apr
  2026), LawBeat (Feb 2026 listing), ETLegalWorld (women's reservation votes), Frontline (EWS verdict 3:2).
- **CAG** — 2013 audit of the 2008 farm debt waiver, as reported on tabling by The Hindu and The Economic Times
  (with the Finance Minister's response).
- **Election Commission** — its orders and advisories as reported: Budget 2017 directions (Times of India), the
  Mar 2024 Viksit Bharat order (The Hindu, BOOM, with MeitY's reply), the Oct 2022 manifesto-finance proposal
  (The News Minute, with party replies in The Indian Express). `results.eci.gov.in` only redirects to the Aug 2026
  bye-election page; archived result pages for 2024–2026 return 404, so seat tallies come from outlets below.
- **Poll dates and results** — The Hindu (LS 2004/2009 explainer; UP 2017; Karnataka 2018 and 2023; Punjab 2022),
  Frontline (UP 2012; Gujarat 2017; Delhi 2025; Nov 2023 rounds; 2026 results), The Indian Express (Bihar 2015;
  UP 2022; Maharashtra–Haryana 2019 schedule), Mint (Bihar 2020), Scroll (Dec 2018 results; Chhattisgarh 2018
  phases), Rediff (Chhattisgarh 2013), Times of India (Maharashtra 2019; 2021 four-state results), Hindustan Times
  (Bihar 2025), DW (BJP 282/303/240 in 2014/2019/2024). First-phase dates were cross-checked against news
  headlines of polling day; `gapDays` is omitted where a date could not be confirmed: hpe001 (date of the
  EC's India Shining ban), hpe006 (dissolution date), hpe009 (exact day of the Aug 2008 pay-award decision),
  hpe013 (WB 2011 first phase), hpe014 (UP 2012) and hpe017 (Chhattisgarh 2013).
- **Established outlets for the rest** — The Hindu, Frontline, The Indian Express, Hindustan Times, Times of India,
  The Economic Times, Mint, Scroll, Rediff (2004 and 2009 archive, incl. Reuters copy), Alt News (PMSSY/AIIMS
  history), BOOM, Deccan Herald, The Federal, The News Minute.
- Wikipedia was **not** used as a source for any item.

Tooling: WebSearch was not used (quota exhausted). Discovery ran through Google News RSS, with links decoded to
publisher URLs through Google's article-redirect endpoint (`scratchpad/gdec.py`), plus Wikipedia's external-link
lists as a finder only. Pages were read with curl and an HTML-to-text filter. Reddit was not touched.
Blocked or unreachable: finmin.nic.in (Sixth Pay Commission decision PDF — no response), web.archive.org
(connection reset), indiatoday.in and firstpost.com (Access Denied), theprint.in (bot challenge), thewire.in
(truncated). Where these held a fact, another outlet reporting the same primary figure was used.

## Era and govt distribution

| era | items | ids |
|---|---|---|
| 2000–2004 | 6 | hpe001–hpe006 (Lok Sabha 2004) |
| 2005–2009 | 6 | hpe007–hpe012 (Lok Sabha 2009) |
| 2010–2014 | 8 | hpe013–hpe020 (WB 2011, UP 2012, CG 2013, LS 2014) |
| 2015–2019 | 9 | hpe021–hpe029 (Bihar 2015, 2017 rounds, Karnataka 2018, 2018 rounds, LS 2019, Maharashtra 2019) |
| 2020–2026 | 13 | hpe030–hpe042 (Bihar 2020, 2021 rounds, 2022 rounds, Karnataka 2023, Nov 2023, LS 2024, Delhi 2025, Bihar 2025, 2026 rounds) |

`govt` (the government at the Centre that took the decision): **NDA 28** (Vajpayee 2000–04: 6; Modi 2014–26: 22),
**UPA 14** (2004–14). `enactedBy` entries by party: BJP 25, INC 11, RJD 1 (Lalu Prasad), on 33 items.
Nine items have no `enactedBy`: the act was the Election Commission's, a court's or a newspaper's (hpe001,
hpe014, hpe015, hpe023, hpe034, hpe037, hpe042) or the source named no minister (hpe011, hpe032). `outcome` is on
41 items (not hpe005: no source reported what became of the 2004 farm-income insurance extension).
Difficulty 13 simple / 15 expert / 14 extreme. `correctIndex` 10/11/11/10. Kinds: spend 24, scheme 9,
institution 9. `state`: IN 35; state-specific Union measures carry the state code (KA 2, WB, CT, BR, GJ, TN).

Balance notes: both coalitions appear on the same kinds of act — pre-poll pay commissions (UPA 2008 and 2013;
NDA 2025), income-tax relief (UPA 2008; NDA 2019 and 2025), excise cuts (UPA 2008–09 and 2014; NDA 2021),
poll-state budget mentions (UPA 2011 and 2013; NDA 2017, 2018, 2021, 2023, 2026), and the EC reining in or
advising governments of both (2004 India Shining under the NDA; 2012 Budget timing under the UPA; 2017 and
2024 under the NDA). hpe042 gives the Indian Express tally for both: 24 of 70 poll-bound states under the UPA,
21 of 72 under the NDA. Results cut both ways: incumbents lost after several measures (2004, 2014, Bihar 2015,
Karnataka 2018 and 2023) and won after others (2009, 2019, 2025).

## Table of measures covered

| # | measure | level / state | launched | enacted by | amount / benefit | reach | cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|---|
| 001 | 'India Shining' ads; EC bars broadcast | Union | Dec 2003–Apr 2004 | Govt of India (NDA) | ad campaign | national | ₹65 cr (Reuters) / ~₹150 cr (IE est.) | LS 2004: INC 145, BJP 138 | Rediff/Reuters |
| 002 | 'Mini-budget': customs cuts, travel tax abolished | Union | Jan 2004 | Jaswant Singh, FM, BJP | duty cuts | — | — | LS 2004 (+103 d) | Rediff |
| 003 | DA merged into basic pay | Union | Feb 2004 | Jaswant Singh | DA up to 50% of pay | central staff | — | LS 2004 (+77 d) | indiabudget |
| 004 | PMSSY: six AIIMS-like hospitals | Union | Aug 2003 / Feb 2004 | Vajpayee, Jaswant Singh | 6 hospitals | 6 states | — | LS 2004; MBBS from 2012 | Alt News, indiabudget |
| 005 | Farm Income Insurance to 100 districts | Union | Feb 2004 | Jaswant Singh | insurance | 20→100 districts | — | LS 2004 (+77 d) | indiabudget |
| 006 | Early Lok Sabha poll | Union | early 2004 | Vajpayee, PM, BJP | — | — | — | ~6 months early; UPA won | IE, The Hindu |
| 007 | Income-tax exemption ₹1.1→1.5 lakh | Union | Feb 2008 | P. Chidambaram, FM, INC | ≥₹4,000 each | all taxpayers | — | LS 2009 (+412 d): INC 206 | indiabudget |
| 008 | Rashtriya Swasthya Bima Yojana | Union | Feb/Apr 2008 | P. Chidambaram | ₹30,000 cover | 46 lakh families by Jul 2009 | ₹205 cr (2008-09), ₹350 cr (2009-10) | LS 2009 | indiabudget |
| 009 | Sixth Pay Commission award | Union | Aug 2008 | UPA (reported by Pranab Mukherjee) | pay from Jan 2006 | 45 lakh staff, 38 lakh pensioners | — | LS 2009 | indiabudget, Mint |
| 010 | Interim rail budget: 2% fare cut | Union | Feb 2009 | Lalu Prasad, Railway Min., RJD | 2% cut | passengers | ₹700 cr lower earnings | LS 2009 (+62 d) | IE |
| 011 | CENVAT cuts (4 + 2 points) | Union | Dec 2008–Feb 2009 | UPA | 6 points | — | stimulus ₹1.86 lakh cr (3.5% GDP) | LS 2009 (+51 d) | indiabudget |
| 012 | NREGS 2009-10 allocation | Union | Feb 2009 | Pranab Mukherjee, FM, INC | ₹30,100 cr | 3.51 cr households (2008-09) | ₹30,100 cr | LS 2009 (+59 d) | indiabudget |
| 013 | ₹200 cr grant to IIT Kharagpur | WB | Feb 2011 | Pranab Mukherjee | ₹200 cr | — | one-time | WB 2011: TMC ended Left rule | indiabudget, IE |
| 014 | Budget 2012 held to 16 March | Union | 2012 | UPA govt | — | — | — | UP 2012: SP 224/403 | Scroll (Quraishi) |
| 015 | SC freebies ruling → EC manifesto code | Union | Jul 2013 | Supreme Court; EC | — | — | — | LS 2014 (+276 d) | Indian Kanoon, HT |
| 016 | CAG audit of 2008 farm debt waiver | Union | Mar 2013 | scheme: P. Chidambaram | 8.5% ineligible; 13.46% left out | 3.69 cr + 0.6 cr farmers est. | ₹52,000 cr (The Hindu) | LS 2009 (+412 d from 2008 budget) | The Hindu, ET |
| 017 | Raipur plant-stress institute; ₹1,000 cr eastern green revolution | CT | Feb 2013 | P. Chidambaram | institute | — | ₹1,000 cr (BGREI) | CG 2013: BJP 49/90 | indiabudget, Rediff |
| 018 | Seventh Pay Commission announced | Union | Sep 2013 | Chidambaram, Manmohan Singh | award from Jan 2016 | ~80 lakh staff & pensioners | — | LS 2014 (+194 d) | ET, Mint |
| 019 | LPG cap 9→12; DBTL put on hold | Union | Jan 2014 | M. Veerappa Moily, INC | 3 more cylinders | all LPG homes; DBTL in 289 districts | ₹5,000 cr a year | LS 2014 (+67 d) | IE, Mint |
| 020 | Excise cut on small cars/two-wheelers 12%→8% | Union | Feb 2014 | P. Chidambaram | 4 points | — | — | LS 2014 (+49 d) | indiabudget |
| 021 | ₹1.25 lakh cr Bihar package | BR | Aug 2015 | Narendra Modi, PM, BJP | ₹1.25 lakh cr (+₹40,000 cr ongoing) | Bihar | — | Bihar 2015 (+55 d): MGB 178 | The Hindu, IE |
| 022 | One Rank One Pension | Union | Sep 2015 | Manohar Parrikar, BJP | revision every 5 yrs | 26 lakh veterans, 6 lakh widows | ₹8,000–10,000 cr; arrears ₹10–12,000 cr | Bihar 2015 (+37 d): NDA 58 | Rediff |
| 023 | EC: no state schemes in Budget 2017 | Union | Jan 2017 | EC | — | 5 poll states | — | 2017 rounds (+3 d): BJP 312/403 UP | TOI, Scroll |
| 024 | New AIIMS for Gujarat, Jharkhand | GJ | Feb 2017 | Arun Jaitley, BJP | 2 AIIMS | — | — | Gujarat 2017 (+311 d): BJP 99/182 | indiabudget, Frontline |
| 025 | Bengaluru suburban rail | KA | Feb 2018 | Arun Jaitley | 160 km | — | ₹17,000 cr est. | Karnataka 2018 (+100 d): hung, BJP 104 | indiabudget, DH |
| 026 | Ayushman Bharat PM-JAY launch (Ranchi) | Union | Sep 2018 | Narendra Modi | ₹5 lakh cover | 10.74 cr families | — | Nov–Dec 2018 (+50 d): INC won MP, RJ, CG | The Hindu, Scroll |
| 027 | 10% EWS quota amendment | Union | Jan 2019 | Thaawarchand Gehlot, BJP | quota | — | — | LS 2019 (+93 d): BJP 303 | Mint, TOI |
| 028 | Full tax rebate up to ₹5 lakh | Union | Feb 2019 | Piyush Goyal, BJP | rebate; std deduction ₹50,000 | ~3 cr taxpayers | ₹18,500 cr + ₹4,700 cr | LS 2019 (+69 d) | indiabudget |
| 029 | Corporate tax cut (Panaji) | Union | Sep 2019 | Nirmala Sitharaman, BJP | base rate 22% | companies | ₹1.45 lakh cr a year | Maharashtra/Haryana (+31 d) | IE, TOI |
| 030 | Free grain extended to Nov 2020 | Union | Jun 2020 | Narendra Modi | 5 kg grain + 1 kg pulses | 80 cr people | >₹90,000 cr | Bihar 2020 (+120 d): NDA 125 | TOI, Mint |
| 031 | Highways for poll states (TN ₹1.03 lakh cr) | TN | Feb 2021 | Nirmala Sitharaman | 3,500 km TN; Kerala, WB, Assam too | — | — | 2021 rounds (+54 d) | indiabudget, TOI |
| 032 | Fuel excise cut ₹5 petrol / ₹10 diesel | Union | Nov 2021 | Govt of India (NDA) | per litre | all | — | 2022 rounds (+99 d) | TOI, HT |
| 033 | Farm laws repeal | Union | Nov 2021 | Narendra Modi; N.S. Tomar | repeal | — | — | 2022 rounds (+83 d) | The Hindu, IE |
| 034 | Freebies PIL: EC affidavit | Union | Jan–Apr 2022 | Supreme Court; EC | — | — | — | 2022 rounds (+16 d); PIL pending Jul 2026 | LiveLaw, ET |
| 035 | Upper Bhadra aid | KA | Feb 2023 | Nirmala Sitharaman | ₹5,300 cr | central Karnataka | — | Karnataka 2023 (+98 d): INC 135; not released per state govt (2026) | indiabudget, The Federal |
| 036 | Women's reservation amendment | Union | Sep 2023 | Arjun Ram Meghwal, BJP | 1/3 seats | LS & Assemblies | — | Nov 2023 (+48 d): BJP 3 of 5 | ETLegal, LiveLaw |
| 037 | EC halts 'Viksit Bharat' WhatsApp messages | Union | Mar 2024 | EC (order to MeitY) | — | — | — | LS 2024 (+29 d): BJP 240 | The Hindu, BOOM |
| 038 | Eighth Pay Commission approved | Union | Jan 2025 | Modi; Ashwini Vaishnaw | from Jan 2026 (expected) | 50 lakh staff, 65 lakh pensioners | — | Delhi 2025 (+20 d): BJP 48/70 | The Hindu, IE |
| 039 | Budget 2025: ₹12 lakh tax-free | Union | Feb 2025 | Nirmala Sitharaman | nil tax to ₹12 lakh | — | — | Delhi 2025 (+4 d): BJP 48/70 | HT, Mint |
| 040 | GST two-slab overhaul | Union | Sep 2025 | Nirmala Sitharaman | 5%/18% slabs | — | ₹48,000 cr a year | Bihar 2025 (+45 d): NDA 202/243 | HT |
| 041 | Budget 2026: rare-earth and HSR corridors | Union | Feb 2026 | Nirmala Sitharaman | corridors, no allocations | — | — | 2026 rounds (+67 d) | indiabudget, IE, Frontline |
| 042 | IE tally of budget sops for poll states | Union | Feb 2026 | — | — | UPA 24/70; NDA 21/72 | — | 2026 rounds | IE |

## Items dropped and why

- **CAA rules (notified 11 Mar 2024)** — eligibility is defined by religion; the item could not be written without
  group framing, and it is not a money measure. Dropped.
- **Jat inclusion in the central OBC list (Mar 2014)** — caste framing. Dropped.
- **LPG ₹200 cut (Aug 2023) and ₹100 cut (Mar 2024); PM-KISAN announcement and first instalment (2019); Ujjwala
  subsidy raise (Oct 2023); free grain for five years (Nov 2023); education-loan relief and AAY expansion in
  interim budgets** — already asked by dist-centre (hdb005, hdb022, hdb028, hdb029, hdb035, hdb036, hdb038). Not
  repeated; hpe019 and hpe030 take different angles (cap/DBTL; cost of the 2020 extension).
- **Interim Budget 2024: withdrawal of old tax demands** (up to ₹25,000 for years to 2009-10, ₹10,000 for 2010-11
  to 2014-15; ~1 crore taxpayers) and **₹2 petrol/diesel cut of 14 Mar 2024** — both verified (indiabudget; Times
  of India) but held back to keep the lane near its target and avoid a third item from the same fortnight as
  hdb038/hpe037. Good reserves.
- **PM's 'revdi culture' remark (16 Jul 2022, Bundelkhand Expressway, Jalaun)** and Kejriwal's reply — verified
  (The Hindu) but not tied to one poll; left out rather than attach a guessed `poll`.
- **EC's Oct 2022 proposal on the financial viability of promises** — verified; folded into hpe034's outcome.
- **Budget 2008-09 IITs (AP, Bihar, Rajasthan) before the Dec 2008 polls** — no fetched source for the 2008 results;
  used in hpe042's explanation only via the IE tally.
- **Budget 2005-06 "₹232 crore for Bihar flood prevention"** (IE 2026) — the speech gives ₹180 crore for flood
  management across UP, Bihar, Bengal, Orissa, Assam and the North-East plus ₹52 crore for Farakka; not a Bihar-only
  allocation as IE describes. Dropped as contested.
- **Budget 2006-07 expressways before the 2006 state polls** — the list also covered non-poll states; weak link.
- **EC asking the Centre to defer the 2014 gas-price revision** — no fetched source found. Dropped.
- **Defence Modernisation Fund (₹25,000 crore, 2004)** — no source for what happened to it; kept as a clause in
  hpe003 only.
- **2009 poll spending (Congress ₹343 crore, BJP ₹448 crore, RTI)** — party money, not public money; belongs in the
  elections lane.

## Contested or delicate points (reviewer, please check)

- **hpe001** — the campaign's cost is reported two ways: a ₹65-crore government campaign (Reuters via Rediff, 2004)
  and ~₹150 crore "estimated to have been spent" by the BJP (Indian Express, 2023). The item asks about the EC's
  action, not the cost; both figures appear, attributed.
- **hpe004** — the NIE (2011) line that the NDA treated PMSSY as "election-oriented" is attributed and paired with
  Alt News' note that work ran under both governments.
- **hpe013, hpe017, hpe024, hpe025, hpe035, hpe042** — describing a budget line as a poll-state "sop" is the Indian
  Express's framing; the stems state timing only.
- **hpe016** — the BJP called the waiver a "scam" in 2013; the item uses the CAG's findings, names P. Chidambaram only
  as the minister who responded, and carries `people` + `status`.
- **hpe021** — "Nitish called the package a myth" rests on a related-story headline on The Hindu's page.
- **hpe022** — ₹8,000–10,000 crore is Parrikar's 2015 estimate "at present, rising in future".
- **hpe035** — "not released" is the Karnataka government's statement (Jul 2025, Apr 2026); the Centre's position
  was not found in a fetched source.
- **hpe011 / hpe034** — `gapDays` runs from the second excise cut (24 Feb 2009) and from the Supreme Court notice
  (25 Jan 2022) respectively.
- **Causation** — no item claims a measure caused a result; where an outlet speculated (Mint on the 2025 tax cut)
  the outcome says no study establishes it.

## Stale-risk list (re-verify monthly)

- **hpe034** — the freebies PIL (Ashwini Upadhyay v Union of India) was still pending in July 2026 ("This matter can
  wait", CJI Surya Kant). Any hearing or order changes the outcome line.
- **hpe038** — Eighth Pay Commission report due about 18 months from its Oct 2025 terms of reference (~spring 2027).
- **hpe035** — release of the ₹5,300 crore for Upper Bhadra.
- **hpe025** — Bengaluru suburban rail progress (19.95% in Aug 2026; deadline Mar 2030).
- **hpe036** — women's reservation still not in force (awaits census and delimitation; 131st Amendment failed Apr 2026).
- **hpe004** — the AIIMS status line relies on a 2019 CAG report cited in 2021.

## Existing items that belong in the Chunav Se Pehle mode (proposed retro-tags)

These live in other lanes and are untagged; each needs a `poll` added with the tag (suggested values below, from
sources already in the bank or fetched for this lane):

| id | lane | add tags | suggested poll |
|---|---|---|---|
| hbx017 | spending | pre-election | Delhi Assembly 2025, 2025-02, gapDays 4, "BJP won 48 of 70 seats; AAP 22" |
| hbx027 | spending | pre-election | Maharashtra & Haryana Assembly 2019, 2019-10, gapDays 31, "Maharashtra: BJP 105, Shiv Sena 56, NCP 54 of 288" |
| hbx031 | spending | pre-election | Bihar Assembly 2025, 2025-11, gapDays 45, "NDA won 202 of 243 seats" |
| hsc054 | schemes | distribution, pre-election | Lok Sabha 2024, 2024-04, gapDays 50 (29 Feb 2024 approval), "BJP 240 of 543; NDA formed govt" |
| hsc057 | schemes | pre-election | Himachal & Gujarat Assembly 2022, 2022-11 (next polls after the Aug 2022 referral), no gapDays |
| hst104 | states-north | distribution, pre-election | Delhi Assembly 2020, 2020-02, gapDays 102 (29 Oct 2019 → 8 Feb 2020), "AAP won 62 of 70 seats" |
| hst152 | states-north | distribution, pre-election | Bihar Assembly 2025, 2025-11, gapDays 41 (26 Sep → 6 Nov 2025), "NDA won 202 of 243 seats" |
| hst207 | states-west-south | distribution, pre-election | Maharashtra Assembly 2024, 2024-11, gapDays 145 (28 Jun → 20 Nov 2024), "Mahayuti won 235 of 288" |
| hst248 | states-west-south | distribution, pre-election | Tamil Nadu Assembly 2026, 2026-04, "TVK won 108 of 234; DMK 59" |
| hst321 | states-east | distribution, pre-election | Assam Assembly 2026, 2026-04, gapDays 30 (10 Mar → 9 Apr 2026), "BJP won 82 of 126; NDA third term" |
| hfw009 | forwards | pre-election | Madhya Pradesh Assembly 2023, 2023-11, "BJP won 163 of 230 seats" |
| hrf026 | relief-centre | relief, pre-election | Lok Sabha & Odisha Assembly 2019, 2019-04, "BJD won 112 of 146 seats polled in Odisha" |

## Verification

Adversarial verification pass, 26 Sep 2026, by a second agent working independently of the author.
Method: every `sourceUrl` and every listed source was fetched again (curl + an HTML/PDF-to-text filter; 84 URLs,
all readable except the 2025-26 budget speech, whose URL had the wrong case; see hpe042). Each correct option,
number, date, `enactedBy` name/role/party, distractor, `status` and `poll` field was checked against the page text.
Every `gapDays` value was recomputed from a first-polling date read on a fetched page (dates below). Recent news
(Aug–Sep 2026) was searched through Google News RSS for the items with open status lines. Reddit was not used.
Result: **42 checked, 0 dropped, 42 kept**. 17 items had content fixes (text, a distractor, a poll field or the
source URL); 13 more gained only a polling-date source; 12 are untouched. `node scripts/hisaab-validate.mjs editions/hisaab/bank/poll-union.mjs` → OK; whole-bank run → OK;
`node --test tests/hisaab-bank.test.mjs` → 4/4 pass. Difficulty is now 12 simple / 15 expert / 15 extreme;
`correctIndex` 10/11/11/10.

### Polling dates confirmed from fetched pages (used for every `gapDays`)

| election | first polling day | source |
|---|---|---|
| Lok Sabha 2004 | 20 Apr 2004 (dissolution 6 Feb 2004) | The Hindu explainer (2024) |
| Lok Sabha 2009 | 16 Apr 2009 | The Hindu explainer (2024) |
| Lok Sabha 2014 | 7 Apr 2014 | The Indian Express, 5 Mar 2014 (nine phases, 7 Apr–12 May) |
| Bihar 2015 | 12 Oct 2015 | BBC, 12 Oct 2015 |
| 2017 five-state round | 4 Feb 2017 | Scroll, Quraishi interview (polls 4 Feb–8 Mar) |
| Gujarat 2017 | 9 Dec 2017 | PIB fact sheet on phase 1, 29 Nov 2017 |
| Karnataka 2018 | 12 May 2018 | The Hindu live updates, 12 May 2018 |
| Nov–Dec 2018 round | 12 Nov 2018 (Chhattisgarh) | Scroll explainer |
| Lok Sabha 2019 | 11 Apr 2019 | Scroll, 10 Mar 2019 |
| Maharashtra & Haryana 2019 | 21 Oct 2019 | The Indian Express, 21 Sep 2019 |
| Bihar 2020 | 28 Oct 2020 | The Indian Express, 25 Sep 2020 |
| 2021 round | 27 Mar 2021 (Assam, WB phase 1) | PIB, 27 Mar 2021 |
| 2022 round | 10 Feb 2022 (UP phase 1; no state voted earlier) | Times of India, 8 Jan 2022 schedule |
| Karnataka 2023 | 10 May 2023 | The Hindu, 13 May 2023 |
| Nov 2023 round | 7 Nov 2023 (Mizoram, Chhattisgarh phase 1) | The Hindu, 9 Oct 2023 schedule |
| Lok Sabha 2024 | 19 Apr 2024 | The Hindu, 18 Apr 2024 |
| Delhi 2025 | 5 Feb 2025 | Frontline, 8 Feb 2025 |
| Bihar 2025 | 6 Nov 2025 | The Hindu, 6 Nov 2025 |
| 2026 round | 9 Apr 2026 (Assam, Kerala, Puducherry) | The Hindu, 9 Apr 2026 (re-fetched in this lane; the author had borrowed it from hdb242/hdb323) |

All 36 existing `gapDays` values recomputed correctly. The date sources were added to each item's `sources`.

### Fixes (by id)

- **hpe005**: `outcome` added. The Economic Times (4 Sep 2014) says the Farm Income Insurance pilot ran in 2003-04 in
  22 districts of 14 states and was **discontinued in 2004**. It also says Radha Mohan Singh proposed reviving farm
  income insurance in 2014. Source added. The speech's "20 districts" and ET's "22 districts" differ; the stem keeps
  the speech's figure because the question asks what the speech said.
- **hpe006**: attribution fixed. The Indian Express does not name the three states; The Hindu does, so the
  explanation now credits each outlet. `gapDays: 74` added: the Lok Sabha was dissolved on 6 Feb 2004 (The Hindu) and
  polling began 20 Apr 2004. One of the six open gaps is now closed.
- **hpe007**: the distractor "₹1.8 lakh" was replaced with "₹1.75 lakh". ₹1.8 lakh was the new exemption limit for
  women in the same budget, so it was a true figure in another context.
- **hpe013**: `outcome` and `poll.result` now carry the seat count: Trinamool won 184 of 294 seats and the Left Front
  fell from 235 to 61 (Al Jazeera, 18 May 2011). The poll month (April) is supported by BBC, 13 May 2011: "held over
  April and May". Both pages were added as sources. The explanation's "₹400 crore for rice" now reads accurately as ₹400
  crore more for the eastern green-revolution programme for rice farming in Assam, West Bengal and five others.
  `gapDays` is still not set: the first-phase date (18 Apr 2011) appears only on Wikipedia, whose ECI and CEO sources
  are dead, and web.archive.org was unreachable.
- **hpe014**: `poll` relabelled from "Assembly polls in UP and 4 other states, 2012" to **"Uttar Pradesh Assembly
  2012"**. The five-state round began on 28 Jan 2012 in Manipur (e-pao, Dec 2011), so month 2012-02 was wrong for the
  round but is right for UP, which is the state the result names. UP's February start is from e-pao's report of the
  ECI schedule. Frontline prints "224 out of 406 seats", a typo. "403" is now backed by The Hindu (2017), which gives
  UP's 403 seats and the SP's outgoing 224. Both pages were added as sources.
- **hpe016** (sensitive): "pre-poll" was removed from the stem, because the waiver came 412 days before polling; the
  timing stays in `poll`. The distractor "About 25%" was replaced with "About 3.5%", because ET reports lapses in
  22.32% of 90,576 cases and a player could reasonably confuse the two. The explanation was corrected: 13.46% of the
  9,334 test-checked accounts were *eligible but left out*; the old text said "of 9,334 eligible accounts". The status
  line was made precise: the findings concern lenders and the Finance Ministry's Department of Financial Services, with
  "no finding against any named person". P. Chidambaram still appears only as the minister who responded. The BJP's
  2013 "scam" charge is still left out.
- **hpe017**: added The Hindu (10 Oct 2013), which confirms a two-phase Chhattisgarh poll in November, so month
  2013-11 is now sourced. `gapDays` is still not set: The Hindu dates phase 1 only as "last week".
- **hpe021** (sensitive; rewritten): **cross-lane duplicate**. hpe118 in `poll-states.mjs` already asks the size of the
  Ara package (₹1.25 lakh crore). The item now asks a different fact from the page the author had flagged. In his
  letter to Arun Jaitley (The Hindu, 8 Sep 2015), Nitish Kumar said **₹1.08 lakh crore** of the package was money
  already promised to Bihar, and he called it a "packaged myth" of old schemes "devised to influence people". That
  claim is attributed, and Modi's framing (₹1.65 lakh crore in all, "face and fate", poor use of central funds by the
  state) is kept in the explanation. The old "myth" line rested on a related-story headline; it now has the full
  article as its `sourceUrl`. Difficulty changed from simple to extreme and `subtopic` was updated. The `poll` field
  is unchanged (gapDays 55 from 18 Aug).
- **hpe022**: added BBC, 12 Oct 2015 as the polling-date source. The "gimmick" quote is attributed to the veterans'
  leader, as before.
- **hpe023**: the distractor "Present only a vote on account" was replaced with "Clear the Budget speech with the EC
  first". In the same letter, the EC had advised the poll-bound states to take votes on account (Times of India), so
  the old distractor was partly true. The explanation now says this advice was for the states.
- **hpe024, hpe025, hpe027, hpe028, hpe031, hpe036, hpe037, hpe040**: polling-date sources added (see the table
  above). Text unchanged, except hpe040, whose explanation now also mentions the 40% slab for sin and luxury goods.
  "Become 5% and 18%" alone was incomplete.
- **hpe015, hpe018, hpe019, hpe020**: added The Indian Express (5 Mar 2014) for the 7 Apr 2014 start date.
- **hpe030** (sensitive): the distractor "₹50,000 crore" was replaced with "₹60,000 crore". In the same address Modi
  cited ₹50,000 crore for rural employment, so it was a true figure in another context. Added The Indian Express for
  the Bihar 2020 polling date. The festival names are the PM's own quote, reported by TOI, and no group is framed.
- **hpe032, hpe033, hpe034**: added TOI's 2022 schedule. hpe033: "the Lok Sabha had cleared it that morning" became
  "earlier that day"; The Hindu says the Lok Sabha reconvened at noon and passed the Bill immediately. hpe034:
  "'undoubtedly a serious issue'" is LiveLaw's paraphrase, not a quote, so the quote marks were removed and the line is
  attributed to LiveLaw.
- **hpe034** (sensitive; status re-checked): a Google News RSS search for Aug–Sep 2026 found no hearing of the
  Upadhyay freebies PIL after the 17 Jul 2026 "This matter can wait" (PTI/ET). The 16 Sep 2026 SC listing (LawBeat,
  The Hindu) concerns a **different** 2022 Upadhyay PIL, on manifesto accountability and standard formats. It must not
  be confused with this one. The outcome line stands, and `asOf` 2026-09 is confirmed.
- **hpe035** (sensitive): **the Centre's side added**. TOI (10 Sep 2024) reports a 5 Sep 2024 letter from the Jal
  Shakti ministry's water resources secretary. It said approval needed updated figures on expenditure, balance cost and
  eligible assistance, and that release "would depend on the availability of resources". The outcome now gives that
  position before Karnataka's July 2025 and April 2026 statements that the money was still unreleased. TOI was added as
  a source. The "only special mentions" line matches The Indian Express (2026).
- **hpe039**: the AAP's reply (the BJP had "no vision for Delhi") was added after "attacked the AAP-led Delhi
  government", as §2.3 requires (HT, same page).
- **hpe041, hpe042**: `poll.result` and the outcomes said "TVK won Tamil Nadu". Frontline's table gives TVK 108 of 234,
  short of the 118 majority mark, so both now read "TVK largest in Tamil Nadu (108 of 234)". Later news (Sep 2026)
  reports uncertainty over the TVK government. "BJP won West Bengal" became "BJP-led alliance" (Frontline: "BJP+ 207").
  In hpe042, the source URL `budget2025-26/doc/Budget_Speech.pdf` returns 404; it was corrected to
  `budget_speech.pdf`, fetched, and the Makhana Board confirmed. The 2026 Hindu turnout page (9 Apr) was added to both.

### Content confirmed (source states the answer; distractors false; poll fields right; some gained a date source only)

hpe001 (sensitive: the EC ban and ₹65 crore are from Reuters/Rediff and ~₹150 crore is from IE 2023; both are
attributed), hpe002, hpe003, hpe004 (sensitive: NIE's "election-oriented" is attributed via Alt News, with the
both-governments note; MBBS 2012 confirmed), hpe008 (the "private hospitals" clause comes from the July 2009 speech,
already in `sources`), hpe009, hpe010, hpe011, hpe012, hpe015, hpe018, hpe019 (Mint's "bow to populism" is attributed
and paired with Tewari's reply), hpe020, hpe022, hpe024, hpe025, hpe026, hpe027 (sensitive: no caste or religious
framing; the vote was 323–3 and 165–7; K.V. Thomas's motive claim is paired with Gehlot's "good intentions" reply;
the SC upheld it 3:2), hpe028, hpe029, hpe031, hpe036, hpe037, hpe038, hpe040.

### Dropped

None. The lane stays at 42 items, above the 32 floor, so no replacements were needed.

### Still open (reviewer)

- `gapDays` is unset on hpe001 (date of the EC's India Shining order not on any fetched page), hpe009 (exact day in
  Aug 2008 of the pay-award decision), hpe013 (WB 2011 first phase: only Wikipedia gives 18 Apr) and hpe017 (CG 2013
  phase 1 date: only "last week" in The Hindu). The note on hpe014 is resolved by the relabel.
- hpe041's `sourceUrl` (`indiabudget.gov.in/doc/Budget_Speech.pdf`) is the *current-year* speech. It will point to
  Budget 2027-28 after 1 Feb 2027, so re-point it to the 2026-27 archive path once the site archives it.
- Stale-risk additions: **hpe041/hpe042**: whether the TVK government in Tamil Nadu holds (reported uncertainty in
  Sep 2026) does not change the poll result line, but re-check the wording if a fresh poll is called.
  **hpe038**: government told Rajya Sabha in Aug 2026 that the 8th CPC report is due by May 2027 (not re-fetched
  here; outcome unchanged). **hpe036**: women's reservation still not in force as of Aug 2026 (Rahul Gandhi–Rijiju
  exchange, 8 Aug 2026).
- Cross-lane: hpe118 (poll-states) and hpe021 now cover the same Bihar package from different angles, one asking the
  size and one asking Nitish's rebuttal. The dist-centre item on the CAG audit of the 2008 waiver (the ₹164.60 crore
  paid to a private bank) and hpe016 (share of ineligible accounts) use the same audit from different angles.
