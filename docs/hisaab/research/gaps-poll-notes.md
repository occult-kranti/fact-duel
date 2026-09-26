# Before the vote — coverage gaps (`hpe200`–`hpe224`) — research notes

Lane file: `editions/hisaab/bank/money-gaps-poll.mjs` (`HISAAB_GAPS_POLL`, 25 items; target 25).
Mode: **Chunav Se Pehle**. Every item is tagged `pre-election` and carries `poll { label, month, result }`, with
`gapDays` on 16 items. 18 items are also tagged `distribution`, where cash or goods were handed out or promised.

Validation (26 Sep 2026):
- `node scripts/hisaab-validate.mjs editions/hisaab/bank/money-gaps-poll.mjs` prints OK.
- The whole-bank run, with every lane file in the directory, also prints OK, so no id or question text clashes.
- `node --test tests/hisaab-bank.test.mjs` passes 4/4.

`asOf` is `2026-09` on every item. The lane is **not registered** in `bank/index.mjs`; the lead does that.

The gaps came from the completeness critic. Lok Sabha 2024 was thin, and the Centre's PM-KISAN releases staged in
poll-bound states had no item. Several state cycles had no items: Gujarat's state governments, Rajasthan 2013 and
2023, Maharashtra and Haryana in 2009, 2014 and 2019, Punjab 2012 and 2017, UP 2012 and 2017, the UDF and Left as
incumbents, the hill states and the North-East. No pre-poll item was dated 2000, 2001, 2005, 2007 or 2010. Each
seed lead was checked against a fetched page. Leads that could not be confirmed were dropped (see below).

## Sources consulted

WebSearch was not used (quota exhausted). Leads came from Google News RSS, with article links decoded to publisher
URLs through Google's redirect endpoint, and from Wikipedia reference lists, used only as a finder. Every
`sourceUrl` and `sources` entry was fetched in September 2026 and read as text. Tools: Python `requests` or curl,
JSON-LD article bodies, and India Today's embedded `articleBody` JSON through a mobile user agent. CMO Gujarat was
read with WebFetch, and the budget PDF with `pypdf`. reddit.com was not touched. Wikipedia is not cited anywhere in
this lane.

**Open and official data**
- **indiabudget.gov.in**: Interim Budget 2024-25 speech (`budget2024-25(I)/doc/Budget_Speech.pdf`). Para 56 raises the
  Lakhpati Didi target from 2 crore to 3 crore; para 49 extends Ayushman Bharat to ASHA and anganwadi workers;
  para 43 covers rooftop solar for 1 crore homes. Old tax demands are withdrawn up to ₹25,000 (to 2009-10) and
  ₹10,000 (2010-11 to 2014-15). Used for `hpe220`.
- **PRS Legislative Research, state budget analyses**:
  - Haryana 2019-20: Captain Abhimanyu, 25 Feb 2019; two new schemes with ₹1,500 crore (`hpe213`).
  - Maharashtra 2019-20: Sudhir Mungantiwar's additional budget of 18 Jun 2019; revenue deficit ₹20,293 crore,
    fiscal deficit ₹61,670 crore (`hpe214`).
  - Mizoram 2023-24: Zoramthanga, 13 Feb 2023; SEDP ₹50,000 each to 60,000 families. Used for the `hdb326`
    retro-tag.
  - Also checked Uttarakhand 2021-22, Sikkim 2024-25 and Arunachal 2024-25. PRS has no Tripura, Meghalaya,
    Manipur or Punjab analyses for the years needed (404).
- **PIB**: PM-KISAN completes 19 instalments (24 Feb 2025), used for `hpe223`.
- **PM India (pmindia.gov.in)**: the Yavatmal release of 28 Feb 2024 (`hpe221`) and the Washim release of 5 Oct 2024
  (`hpe222`), including the PM's reference to "the ongoing polling in Haryana today".
- **CMO Gujarat**: the 13th Garib Kalyan Mela, 14 Oct 2022 (`hpe215`).
- **ECI results portal**: the Tamil Nadu May 2026 party-wise page (S22) is live and cited (`hpe224`). The archived
  pages for 2023–2025 return 404, so those tallies come from outlets. **DD News** and **All India Radio (newsonair)**
  were used for the PM-KISAN 21st instalment, the 2026 poll schedule and the Assam 2026 result.
- Not needed for these items: RBI State Finances, CAG, sansad.in, Indian Kanoon and MyNeta/ADR. No item turns on an
  audit, a court holding or candidate data.

**Established outlets**: Frontline (2001, 2009, 2013, 2023 archive); Rediff (2003, 2012, 2017); The Hindu (2013,
2023, 2024, 2025); The Indian Express (2014, 2017, 2019, 2022, 2023, 2024, 2025); Times of India (2017, 2019, 2022,
2023, 2024, 2026); Hindustan Times (2016, 2023, 2025); India Today (2011, 2012, 2014, 2019); Mint (2022, 2023);
Deccan Chronicle (2016); The Tribune (2017); Outlook (Punjab 2007 explainer); Down To Earth (2013); ThePrint (2023);
The New Indian Express (2018); Business Standard (2026); The Economic Times and ET Telecom (2012, 2017); DW (2024);
ANI (2022).

Secondary and weaker sources, kept only alongside a primary or established source:
- Jagran Josh, used only for Kerala's 16 May 2016 polling date (`hpe209`); the tally is Deccan Chronicle's.
- Meghalaya Monitor, used for a BJP leader's Dec 2022 demand (`hpe216`).

Blocked or unreachable:
- NDTV, Firstpost and Syllad (403).
- web.archive.org (connection reset).
- Old hindu.com/hinduonnet URLs (dead).
- cmogujarat.gov.in through curl (tunnel closed); WebFetch worked.
- indiatoday.in on the desktop user agent (403). The mobile user agent returned the article JSON.

## Era and govt distribution

| era | items | ids |
|---|---|---|
| 2000–2004 | 2 | hpe200 (Kerala 2001), hpe201 (MP 2003) |
| 2005–2009 | 2 | hpe202 (Punjab 2007), hpe203 (Maharashtra 2009) |
| 2010–2014 | 5 | hpe204 (UP 2012), hpe205 (Gujarat 2012), hpe206 (Rajasthan 2013), hpe207 (Karnataka 2013), hpe208 (Maharashtra 2014) |
| 2015–2019 | 6 | hpe209 (Kerala 2016), hpe210 (Punjab 2017), hpe211 (UP 2017), hpe212 (Himachal 2017), hpe213 (Haryana 2019), hpe214 (Maharashtra 2019) |
| 2020–2026 | 10 | hpe215–hpe224 (Gujarat 2022, Meghalaya 2023, Karnataka 2023, Rajasthan 2023, LS 2024 ×3, Maharashtra 2024, Bihar 2025, Tamil Nadu 2026) |

The 2005–2009 and 2000–2004 cycles are the thinnest. See "not written" below for what was tried. Two retro-tags
add 2005–2009 cycles without new questions: `hdb103` (UP 2007) and `hdb207` (MP 2008). Four more add later
cycles that had no item: `hdb108` (UP 2012), `hdb109` (Rajasthan 2013), `hdb300` (West Bengal 2011) and `hdb115`
(Uttarakhand 2017).

**`govt`**, meaning who governed that level when the measure came:

| govt | items |
|---|---|
| INC | 7: Digvijaya Singh, Amarinder Singh, Ashok Chavan, Gehlot ×2, Prithviraj Chavan, Virbhadra Singh |
| NDA (Centre) | 6: Lakhpati Didi, and PM-KISAN at Belagavi, Yavatmal, Washim, Bhagalpur and Coimbatore |
| BJP (states) | 5: Karnataka 2013, Gujarat 2012 (the Congress's pledge), Haryana 2019, Maharashtra 2019, Gujarat 2022 |
| LDF | 1 |
| UDF | 1 |
| BSP | 1 |
| SP | 1 |
| SAD | 1, coded `Other` as in `hdb105` |
| NPP | 1 |
| JD(U) | 1 |

Parties that were never incumbents in this mode before: the UDF (`hpe209`), the LDF as a loser (`hpe200`), the BSP
(`hpe204`), the SAD (`hpe210`) and the NPP (`hpe216`). The NCP appears as the Congress's governing partner in
`hpe203` and `hpe208`.

Results cut every way. Incumbents lost after:
- Kerala 2001; MP 2003; Punjab 2007 and 2017.
- UP 2012 and 2017.
- Rajasthan 2013 and 2023; Karnataka 2013 and 2023.
- Maharashtra 2014; Kerala 2016; Himachal 2017.
- Tamil Nadu 2026, where the Centre's party was not the incumbent.

Incumbents won after:
- Maharashtra 2009 and 2024; Gujarat 2012 and 2022.
- Meghalaya 2023; Bihar 2025.
- Lok Sabha 2024, where the BJP won 240 seats, short of a majority on its own.

Haryana 2019 was hung.

**Difficulty**: 8 simple, 9 expert, 8 extreme. **`correctIndex`**: 7/6/6/6. **Kinds**: 16 scheme, 9 spend.
`enactedBy` is on 23 items. It is left out of `hpe200`, where the source names no one for the treasury curbs, and
`hpe205`, where the pledge was made by the state Congress with no person named. `outcome` is on all 25.

## Table of measures covered

| id | measure | level / state | when | enacted by | amount / benefit | reach | cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|---|
| 200 | Treasury curbs amid fiscal crisis | Kerala | late 2000–May 2001 | LDF govt | curbs on routine payments | — | debt ₹21,000 cr | Kerala 2001: UDF 99/140, LDF 40 | Frontline |
| 201 | Buying power from other states | MP | to May 2003 | Digvijaya Singh, CM, INC | ₹40–60 cr spent | — | ₹40–60 cr | MP 2003: BJP 172/230, INC 39 | Rediff |
| 202 | Free farm power restored | Punjab | Nov 2005 | Amarinder Singh, CM, INC | free power | all farmers | — | Punjab 2007 (13 Feb): SAD–BJP 67/117, INC 44 | Outlook, IE |
| 203 | Slum cut-off moved 1995→2000 | Maharashtra | 2009 (pre-poll) | Ashok Chavan, CM, INC (with NCP) | regularisation | ~75 lakh slum residents in Mumbai | — | Maharashtra 2009: INC 82, NCP 62 of 288 | Frontline |
| 204 | 699 projects and schemes on CM's birthday | UP | 15 Jan 2011 | Mayawati, CM, BSP | incl. 10% DA rise | — | >₹4,000 cr | UP 2012: SP 224/403 | India Today |
| 205 | 'Ghar nu Ghar' pledge (opposition) | Gujarat | Aug–Sep 2012 | Gujarat Congress (no name in source) | 100-yard plot + ₹1 lakh loan | forms at ~500 booths | — | Gujarat 2012: BJP 115/182 | Rediff, India Today |
| 206 | Free diagnostic tests (after free medicines) | Rajasthan | Apr 2013 | Ashok Gehlot, CM, INC | free tests | 7.63 cr beneficiaries claimed (medicines) | ₹341 cr (2012-13, medicines) | Rajasthan 2013: BJP 163/200, INC 21 | NIE, Down To Earth |
| 207 | Manifesto: 25 kg rice at ₹1; ₹2 rice blocked by MCC | Karnataka | 19 Apr 2013 | Shettar, CM; Jaitley, BJP | ₹1/kg rice | BPL families | — | Karnataka 2013 (+16 d): INC 121/223, BJP 40 | The Hindu, Frontline |
| 208 | ~20% power tariff cut | Maharashtra | Jan 2014 | Prithviraj Chavan, CM, INC | lower tariffs | all consumers | ₹606 cr/month; ₹8,400 cr total | Maharashtra 2014: BJP 122, SS 63, INC 42, NCP 41 | IE, India Today |
| 209 | Welfare pension ₹1,000→₹1,500 | Kerala | 12 Feb 2016 | Oommen Chandy, CM, INC (UDF) | +₹500/month | pensioners | — | Kerala 2016 (+94 d): LDF 91/140, UDF 47 | Deccan Chronicle |
| 210 | 20 new benefits in Budget 2016-17 | Punjab | Mar 2016 | Parkash Singh Badal, CM, SAD | insurance, crop loans, cycles, atta-dal | atta-dal 30 lakh families | ~₹3,000 cr | Punjab 2017 (4 Feb): INC 77/117, AAP 20, SAD 15 | HT, TOI |
| 211 | Samajwadi Smartphone Yojana registration | UP | 10 Oct 2016 | Akhilesh Yadav, CM, SP | free phone (due late 2017) | >1.4 cr registered | — | UP 2017 (+124 d): BJP 312/403, SP 47 | IE, ET Telecom, Rediff |
| 212 | Unemployment allowance | Himachal | 12 Apr 2017 | Virbhadra Singh, CM; Sukhu, HPCC, INC | ₹1,000/month (₹1,500 disabled) | ~2 lakh youth | ₹150 cr | Himachal 2017 (+211 d): BJP 44/68, INC 21 | Tribune, TOI |
| 213 | Two new social-security schemes | Haryana | 25 Feb 2019 | Capt. Abhimanyu, FM, BJP | — | farm families ≤5 acres; workers < ₹15,000/month | ₹1,500 cr | Haryana 2019 (+238 d): BJP 40/90, INC 31 | PRS, TOI |
| 214 | Additional budget 2019-20 | Maharashtra | 18 Jun 2019 | Sudhir Mungantiwar, FM, BJP | CM Employment Generation (10,000 units) | — | revenue deficit ₹20,293 cr | Maharashtra 2019 (+125 d): BJP 105, SS 56, NCP 54 | PRS, India Today, TOI |
| 215 | Garib Kalyan Mela, 13th round | Gujarat | 14 Oct 2022 | Bhupendra Patel, CM, BJP | aid on the spot | 35,583 in a day (1.65 cr over 12 rounds) | ₹281 cr (₹34,596 cr earlier) | Gujarat 2022 (+48 d): BJP 156/182 | CMO Gujarat, Mint |
| 216 | FOCUS+ family benefit | Meghalaya | 28 Jul 2022 | Conrad Sangma, CM, NPP | ₹5,000 per household | all households | — | Meghalaya 2023 (+214 d): NPP 26/60 | ANI, HT, TOI |
| 217 | PM-KISAN 13th instalment, Belagavi | Union / Karnataka | 27 Feb 2023 | Narendra Modi, PM, BJP | ₹2,000 each | ~8 cr farmers | >₹16,000 cr | Karnataka 2023 (+72 d): INC 135/224 | TOI, The Hindu |
| 218 | Mehngai Rahat camps (10 schemes) | Rajasthan | 24 Apr–30 Jun 2023 | Ashok Gehlot, CM, INC | guarantee cards | 1.82 cr families registered (govt) | — | Rajasthan 2023 (+215 d): BJP 115/199, INC 69 | ThePrint, Mint |
| 219 | Bihar Laghu Udyami Yojana | Bihar | 16 Jan 2024 (cabinet) | Nitish Kumar, CM, JD(U) | ₹2 lakh over 5 yrs | 94 lakh families targeted | ₹250 cr first tranche | LS 2024 Bihar (+94 d): NDA 30/40 | IE, TOI |
| 220 | Lakhpati Didi target 2→3 crore | Union | 1 Feb 2024 | Nirmala Sitharaman, FM, BJP | income ≥ ₹1 lakh/yr (target) | 3.01 cr reached by Feb 2026 | — | LS 2024 (+78 d): BJP 240, NDA 293 | indiabudget, BS, DW |
| 221 | PM-KISAN 16th + Namo Shetkari, Yavatmal | Union / Maharashtra | 28 Feb 2024 | Narendra Modi, PM, BJP | ₹2,000 each (+ state top-up) | >11 cr families cumulative; 88 lakh MH | ~₹21,000 cr + ₹3,800 cr | LS 2024 (+51 d): BJP 240 | PM India, DW |
| 222 | PM-KISAN 18th + Namo Shetkari, Washim | Union / Maharashtra | 5 Oct 2024 (Haryana polling day) | Narendra Modi, PM, BJP | ₹2,000 each | ~9.4 cr farmers | ~₹20,000 cr + ₹2,000 cr | Maharashtra 2024 (+46 d): Mahayuti 230/288 | PM India, The Hindu |
| 223 | PM-KISAN 19th, Bhagalpur | Union / Bihar | 24 Feb 2025 | Narendra Modi, PM, BJP | ₹2,000 each | 9.8 cr (2.41 cr women) | >₹22,000 cr | Bihar 2025 (+255 d): NDA 202/243 | PIB, HT |
| 224 | PM-KISAN 21st, Coimbatore | Union / Tamil Nadu | 19 Nov 2025 | Narendra Modi, PM, BJP | ₹2,000 each | ~9 cr | ~₹18,000 cr | Tamil Nadu 2026 (+155 d): TVK 108/234, DMK 59 | DD News, ECI |

## Items dropped or not written, and why

**Lok Sabha 2024 seeds**
- **Bharat rice at ₹29/kg (6 Feb 2024) and Bharat atta.** The launch was confirmed from Google News headlines only
  (Manorama, India Today NE, ET). No fetched page gave quantities sold before the model code. The seed's angle was
  not verifiable, and the lane already has six Union-level NDA items. Dropped.
- **₹2/litre fuel cut (14 Mar 2024) and withdrawal of small tax demands.** These remain poll-union's reserves. The
  tax-demand paragraph was re-read in the interim budget speech and is noted above.
- **Ayushman Bharat for ASHA and anganwadi workers; rooftop solar for 1 crore homes.** Folded into the `hpe220`
  explanation. Surya Ghar itself is proposed as a retro-tag (`hsc054`).

**Other seeds not written**
- **PM-KISAN 14th instalment at Sikar (Jul 2023) and 15th at Khunti (15 Nov 2023, during the November 2023 polls).**
  Not written, to keep the PM-KISAN venue pattern at five items.
- **MP 2023, Kisan Kalyan raised to ₹6,000.** The NDTV page is blocked. MP 2023 already has three items (`hdb232`,
  `hdb233`, `hfw009`). Skipped.
- **Haryana 2014, old-age allowance to ₹1,000.** It would be a fourth Haryana pension item after `hdb101`, `hdb107`
  and `hdb133`, and `hdb107`'s explanation already mentions it. Skipped.
- **Haryana's Parivar Samridhi as the origin of the Feb 2019 schemes.** PRS describes the two schemes but does not
  name them, so `hpe213` does not link them to `hdb127`.

**Uttarakhand and Himachal**
- **Uttarakhand 2022, the Ghasiyari Kalyan Yojana.** Amit Shah launched it in Dehradun on 30 Oct 2021 (Business
  Standard, ANI), but no fetched page gave its benefit or cost. Dropped. Uttarakhand still has no new item; see the
  `hdb115` retro-tag.
- **Uttarakhand 2007** (Frontline, "Tumble in the hills") and **Himachal 2003 and 2007** (Frontline, 2003, 2007,
  2008). The articles were scanned. They cite prices, infighting and employee grievances, but no money measure.
  Himachal 2012 (Dhumal): nothing found.

**North-East and West Bengal**
- **Tripura 2018 (Left Front).** The Hindu Centre and HT pieces were found, but neither named a pre-poll money
  measure. PRS has no Tripura analysis. Dropped.
- **Manipur 2022.** A News Mill headline on "new schemes for Maram areas" (Oct 2021) was not fetched as a full page.
  Nothing verified.
- **West Bengal 2011 (Left Front).** No pre-poll measure was found beyond `hdb300`, which is proposed as a retro-tag.

**Earlier state cycles**
- **Bihar February 2005 (RJD).** Frontline's January 2005 coverage centres on an alleged model-code violation at a
  rally, which is wrongdoing about a named leader, so it was not used. No budget measure was found. The RJD appears
  only as a partner in the cabinet that approved `hpe219`: Nitish Kumar's JD(U)–RJD–Congress government approved it
  on 16 Jan 2024, before he rejoined the NDA on 28 Jan.
- **Bihar 2010.** The only lead, the 2006 cycle scheme, is too far from the poll (poll-states reached the same
  view).
- **Punjab 2012, the atta-dal extension.** No fetched page. The Frontline 2012 piece found has group framing
  throughout. Not used.
- **Gujarat 2007 (Vanbandhu Kalyan Yojana) and Gujarat 2002.** No fetched page gave the launch date and size of
  Vanbandhu. Gujarat 2002 was not pursued.
- **Tamil Nadu, Assam and West Bengal 2001; Kerala and Assam 2006.** No specific pre-poll handout was found. For
  Tamil Nadu 2001, the Frontline–CSDS post-poll survey attributes the DMK's defeat mainly to alliance arithmetic,
  not anti-incumbency. It is recorded here and used nowhere, since no DMK measure was found.

**Material in fetched sources left out of the items**
- A criminal case involving a BSP MLA, in the Mayawati birthday source.
- A Lokayukta complaint against a named former chief minister, in the Gujarat 2012 India Today piece.
- The opposition's budget-leak allegation, in the Maharashtra 2019 budget coverage.
- A private builder's award, in the Frontline 2009 Mumbai piece.
- BJP leader Bernard Marak's claim that central funds were "diverted" into FOCUS. Only his demand to release
  payments is used.

## Contested or delicate points (reviewer, please re-read)

**Opinion words, each attributed**
- **hpe205**: "gimmick" is Rediff analyst Sheela Bhatt's word. The same sentence carries her counterpoint that the
  queues exposed a housing gap.
- **hpe210**: "vote-clinching" is HT's.
- **hpe214**: "populist" is India Today's.
- **hpe218**: "revdi culture" is the BJP's, paired with Gehlot's reply that the schemes were not freebies but
  financial management.
- **hpe203**: "a clear move for the votes" is Frontline's.
- **hpe204**: "with eyes on the assembly polls" is India Today's.

**Framing choices**
- **hpe219**: the 94 lakh families come from Bihar's 2022–23 caste-based survey. The item calls it "the state's
  2023 survey" to avoid caste framing; the income cut-off (under ₹6,000 a month) is the operative fact. The JD(U)
  quote is from an unnamed party leader, as The Indian Express reported it.
- **hpe206**: 7.63 crore is the state's own beneficiary figure, and Down To Earth says it was about twice the number
  of voters. The item does not claim the free-medicine scheme affected the result.

**Tallies that differ between sources**
- **hpe201**: 172 of 230 is Rediff's count on results day. Later tallies elsewhere give 173.
- **hpe202**: the SAD's own 2007 tally is 48 in Frontline (2012) and 49 in the NIE (2022), so the item uses only
  the alliance's 67 (Outlook) and the Congress's 44.
- **hpe207**: 121 of the 223 seats polled is Frontline's count on 15 May 2013. One seat's poll was countermanded,
  and final tallies elsewhere give the Congress 122.

**Other checks**
- **hpe216**: the Meghalaya Monitor source is a local outlet.
- **hpe222**: that Haryana voted the same day is stated in PM India's own release.
- **hpe223**: 9.8 crore is PIB's figure for farmers "benefitted" at release.
- **Causation**: no item claims a measure caused a result.

## Stale-risk list (re-verify monthly)

- **hpe220**: the Lakhpati Didi count (3.01 crore, Feb 2026) keeps rising. The new target is 6 crore by 2029-30.
- **hpe219**: Laghu Udyami disbursal is not reported separately. 7.75 lakh is the applications to it and the
  Mukhyamantri Udyami Yojana combined (Bihar Economic Survey, Feb 2026).
- **hpe221–hpe224**: PM-KISAN cumulative totals (₹3 lakh crore, then ₹3.70 lakh crore) and the ₹416 crore recovered
  change with every instalment.
- **hpe224**: Tamil Nadu has a new TVK government, and by-elections are due in Oct 2026. The item gives only the ECI
  seat count.
- **hpe216**: FOCUS+ instalments continue. A report of a first instalment to over 93,000 beneficiaries (Syllad, Aug
  2025) was seen only as a headline, and the page returned 403.

## Existing items that belong in Chunav Se Pehle (proposed retro-tags)

Each needs a `poll` block when it is tagged. The values below come from sources fetched for this lane, or already
cited in the item.

| id | lane | add tags | suggested poll |
|---|---|---|---|
| hdb103 | dist-north | pre-election (keep distribution) | UP Assembly 2007, `2007-04`, result "BSP won 206 of 403 seats" (India Today, 2012). No gapDays: the Feb 2006 budget date is not confirmed. |
| hdb108 | dist-north | pre-election | UP Assembly 2012, `2012-02`, "SP won 224 of 403; the BSP lost power" (India Today). |
| hdb109 | dist-north | pre-election | Rajasthan Assembly 2013, `2013-12`, gapDays 791 (2 Oct 2011 → 1 Dec 2013, Down To Earth), "BJP won 163 of 200; Congress 21" (NIE). |
| hdb115 | dist-north | pre-election | Uttarakhand Assembly 2017, `2017-02`, "BJP won 57 of 70; Congress 11" (Business Standard, 30 Oct 2021). gapDays about 299 if polling was on 15 Feb 2017; the date is not re-verified here. |
| hdb207 | dist-west-south | pre-election | MP Assembly 2008, `2008-11`, "BJP kept power with 142 of 228 seats declared (Rediff, 9 Dec 2008), down from 173". gapDays 575 if polling was on 27 Nov 2008; the date is not re-verified. |
| hdb300 | dist-east | pre-election | West Bengal Assembly 2011, `2011-04`, "TMC-led alliance 227 of 294; Left Front 62" (Frontline, 3 Jun 2011). |
| hdb326 | dist-east | pre-election | Mizoram Assembly 2023, `2023-11`, gapDays 267 (13 Feb 2023 budget, PRS → 7 Nov 2023 poll, Frontline), "ZPM won 27 of 40; MNF 10". |
| hst346 | states-east | distribution, pre-election | Sikkim Assembly 2024, `2024-04`, "SKM won 31 of 32 seats" (per `hst345`). |
| hst321 | states-east | distribution, pre-election | Assam Assembly 2026, `2026-04`, gapDays 30 (10 Mar → 9 Apr 2026, newsonair), "BJP-led alliance re-elected (results 4 May 2026)". |
| hsc054 | schemes | distribution, pre-election | Lok Sabha 2024, `2024-04`, gapDays 50 (29 Feb → 19 Apr 2024), "BJP won 240 of 543; NDA 293" (DW). |
| hdb215 | dist-west-south | pre-election | Karnataka Assembly 2013, `2013-05`, promise delivered after the vote (no gapDays), "Congress won 121 of 223 seats polled; BJP 40" (Frontline). Pairs with `hpe207`. |
| hst119 | states-north | pre-election | Himachal Assembly 2022, `2022-11`, promise delivered after the vote (no gapDays), "Congress won 40 of 68; BJP 25" (Mint). |

## Verification

An adversarial verifier re-checked the lane on **26 Sep 2026**, independently of the author. For each of the 25
items, every `sourceUrl` and `sources` entry was fetched again (74 URLs; Python `requests` with a mobile user agent
for India Today; WebFetch for CMO Gujarat and Meghalaya Monitor). The verifier checked the correct option, every
figure and date, the `enactedBy` names, roles and parties, the `poll` month and `gapDays` arithmetic, the result
against the best available tally, and whether any distractor was also true.

Google News link decoding was captcha-blocked for this run. Missing URLs were found through The Hindu's daily
sitemaps (`/sitemap/archive/all/YYYYMMDD_N.xml`) and through Wikipedia reference lists, used only as a finder.

**Result: 25 checked, 0 dropped, 25 kept.** Fifteen items were edited and ten needed no change. Ids are unchanged.
The validator prints OK for the lane and for the whole bank, and `tests/hisaab-bank.test.mjs` passes 4/4.
`gapDays` is now on 17 items (was 16).

### Fixes

- **hpe200**: the CSDS comparison now says "much lower" instead of "far lower". Frontline's wording is "much better
  than" the LDF government.
- **hpe201**:
  - The result was Rediff's count on results day (BJP 172, Congress 39), which summed to only 227 of 230 seats. It
    is replaced by the final tally, BJP 173 of 230 and Congress 38 (The Indian Express, 5 Oct 2023, "BJP dominance
    since 2003"). `outcome` and `poll.result` are updated.
  - The Rediff results URL (`in.rediff.com/election/2003/dec/04mp3.htm`) now redirects to a 404. It is replaced with
    `im.rediff.com/election/2003/dec/04mp3.htm`, the same article, which still resolves.
  - The polling date is added: Rediff (27 Nov 2003) says the polls were on **1 December 2003**. `poll.month`
    `2003-12` is correct. Wikipedia's "27 November 2003" is wrong, and the Rediff source is cited instead.
  - Digvijaya Singh's reply that it was "an anti-incumbency vote" is added.
- **hpe203**:
  - Frontline's words are now quoted exactly: "a clear move to garner the votes" of Mumbai's slum-dwellers.
  - For balance, the explanation adds Frontline's note that successive governments had used slum regularisation in
    elections.
  - The Hindu (13 Oct 2009) is added for the polling date.
- **hpe204**: `gapDays: 389` is added. Mayawati's birthday was Saturday 15 Jan 2011 (India Today), and UP's first
  phase was Wednesday 8 Feb 2012 (The Hindu, "55 seats up for grabs in U.P. Phase-I polls today"). The Hindu is
  added as a source and in `outcome`.
- **hpe205**:
  - Stem: "about 500 booths" becomes "some 500 locations". That is Rediff's word; India Today gives "around 550
    booths" as announced, and both are now in the explanation.
  - The Congress's 61 seats (up from 59; Times of India) are added to `outcome` and `poll.result`.
- **hpe208**: the fetched Indian Express interview never gives Ajoy Mehta's title.
  - "Per the utility's chief" becomes "per MSEDCL's Ajoy Mehta", and the explanation says he was "speaking for"
    MSEDCL instead of calling him its managing director.
  - The ten-month duration is attributed to the Narayan Rane committee report, as the interviewer cited it.
  - The Hindu (15 Oct 2014) is added for the polling date.
- **hpe209**:
  - The weak Jagran Josh source is replaced. The Indian Express (17 May 2016) says Kerala's "voting ended on Monday",
    that is, 16 May 2016. `gapDays` 94 is confirmed.
  - The UDF's reply is added: Minister K. Babu said the budget served every member's constituency, not just the UDF's.
  - The road-works clause was cut for length.
- **hpe210**: HT gives no SAD reply to its "vote-clinching" label. The explanation now adds HT's own framing that
  all three main parties were in "competitive populism", with the Congress and AAP pledging loan waivers, so the
  label does not read as aimed at one side. The "debt" clause was shortened for length.
- **hpe211**: "officials cited the burden on the exchequer" becomes "the department gave no reason, but sources
  cited the burden". The Indian Express attributes the reason to sources, not officials.
- **hpe212**: the **₹1,500 distractor was also true**, because it was the amount for physically challenged youth. It
  is replaced with ₹3,000.
- **hpe213**: Captain Abhimanyu's full name, Captain Abhimanyu Singh Sandhu, as PRS gives it, is used in
  `enactedBy` and the explanation.
- **hpe214**:
  - India Today says the budget "focuses on agriculture" and gives "sops for women and physically handicapped
    people", not "sops for farmers". The wording is corrected.
  - The Indian Express is added for the 21 Oct 2019 polling date behind `gapDays` 125.
- **hpe216**:
  - Meghalaya polled **59 of 60 seats** in 2023; Sohiong was countermanded. "NPP won 26 of 60" becomes "26 of the
    59 seats polled", per Hindustan Times, in `outcome` and `poll.result`.
  - Bernard Marak's demand is now quoted as Meghalaya Monitor gives it: release the ₹5,000 under FOCUS and FOCUS+
    to beneficiaries "at the earliest". The previous "still waiting" was an inference. The page was re-read with
    WebFetch after a 429. It confirms he is a BJP leader and Tura MDC, and the item still leaves out his "diverted"
    allegation.
- **hpe219**: The Hindu (15 Apr 2024) is added. It states that Bihar's first Lok Sabha phase (Aurangabad, Gaya,
  Jamui, Nawada) was on 19 April 2024, the base for `gapDays` 94.
- **hpe220**: the "March 2027 deadline" is from the Times of India (13 Feb 2026), not Business Standard, and TOI is
  now credited in `outcome`. Business Standard says "by end of 2027".
- **hpe223**: the 2.41 crore distractor was a true figure, the women among the beneficiaries. It is replaced with
  "6.2 crore".
- **hpe224**: DD News carries no date. The Hindu (19 Nov 2025) is added, confirming the Coimbatore release on
  19 November 2025 and `gapDays` 155.

### Checked and unchanged

- **hpe202**: Outlook and The Indian Express support every figure.
- **hpe206**: Down To Earth and the New Indian Express support every figure.
- **hpe207**: The Hindu and Frontline support every figure, and 19 Apr to 5 May 2013 is 16 days.
- **hpe215**: CMO Gujarat and Mint support every figure, and `gapDays` 48 is correct.
- **hpe217**: the Times of India and The Hindu support every figure, and `gapDays` 72 is correct.
- **hpe218**: ThePrint, Mint and Frontline support every figure, and `gapDays` 215 is correct.
- **hpe221**: PM India and DW support every figure, and `gapDays` 51 is correct.
- **hpe222**: PM India and The Hindu support every figure, and `gapDays` 46 is correct.
- **All `gapDays`** were recomputed from the source dates: 16, 94, 124, 211, 238, 125, 48, 214, 72, 215, 94, 78,
  51, 46, 255 and 155, plus the new 389 on hpe204. All are correct.

### The author's sensitive flags, re-read

- **hpe219**: the "2023 survey" wording is accurate; the survey ran in 2023 and its report came out in Oct–Nov 2023.
  The JD(U) quote and the BJP's criticism are verbatim in The Indian Express.
- **hpe205**: Sheela Bhatt's "gimmick" and her counterpoint are verbatim. The Lokayukta material in India Today stays
  out.
- **hpe218**: "revdi culture" and Gehlot's reply are verbatim. 1.82 crore is the government's figure; ThePrint also
  gives 1.79 crore as the number of families who came to the camps.
- **hpe210**: see the fix above.
- **hpe206**: no causal claim is made.
- **hpe203**: see the fix above; the private builder stays out.
- **hpe204**: the BSP MLA case stays out.
- **hpe216**: see the fix above.
- **hpe201**: see the fix above.
- **hpe207**: 121 of 223 seats polled is correct for results day. Periyapatna, the countermanded seat, polled later.
- **hpe209**: see the fix above.

### The author's unverified list, re-checked

- **Dropped leads**: Bharat rice, Ghasiyari, Tripura 2018, Manipur 2022, West Bengal 2011, Bihar 2005 and 2010,
  and the other pre-2012 cycles. None of them is in the file, so there was nothing to refute.
- **hpe204**: now has `gapDays` (see the fixes).
- **hpe200–hpe203, hpe205, hpe206, hpe208 and hpe210**: still no `gapDays`. None of the sources gives the exact
  day of the measure. Their `poll.month` values are now backed by fetched pages:
  - The Hindu for Maharashtra, 13 Oct 2009 and 15 Oct 2014.
  - Rediff for MP, 1 Dec 2003.
  - Frontline's "May 10 Assembly elections" survey package for Kerala 2001.
  - Down To Earth for Rajasthan, 1 Dec 2013.
  - Rediff's pre-poll piece of 5 Dec 2012 and the Economic Times results piece for Gujarat, December 2012.
- **Retro-tag `hdb115`**:
  - The polling date is confirmed. The Hindu (16 Feb 2017) reports Uttarakhand voted "on Wednesday", that is,
    15 Feb 2017.
  - `gapDays` is 299 from 22 Apr 2016, or 300 from 21 Apr 2016.
  - **Caution**: all 11 cabinet decisions in `hdb115` lapsed when the Supreme Court stayed the High Court order. A
    `pre-election` tag would describe money that was never paid. The lead should word the poll block that way, or
    skip the tag.
- **Retro-tag `hdb207`**: the polling date is confirmed. BBC Hindi (14 Oct 2008) lists MP polling on 27 November
  2008, and 2 May 2007 to 27 Nov 2008 is 575 days.
- **FOCUS+ first instalment (Syllad)**: not re-tried. It is not used in any item.

### Balance (unchanged)

`govt` is still INC 7, NDA 6, BJP 5 and one each of LDF, UDF, BSP, SP, Other (SAD), NPP and JDU. The author's
won/lost lists above still hold, with 14 cycles lost by the incumbent, 7 kept and Haryana 2019 hung.
**Maharashtra 2019 (`hpe214`) is missing from both lists.** The ruling BJP–Shiv Sena alliance won the seats shown
(BJP 105, Shiv Sena 56), and the item does not go beyond that tally.

- Every opinion word is attributed to the outlet or party that used it.
- The reply is included where the source gives one: hpe205, hpe209, hpe218 and hpe219.
- Where there is no reply, all-party context is given: hpe203 and hpe210.
- No distractor names a person in a wrongdoing context, and no item names a private individual.
