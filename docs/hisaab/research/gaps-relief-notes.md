# Relief mode — coverage gaps (`hrf200`–`hrf225`) — research notes

Lane file: `editions/hisaab/bank/money-gaps-relief.mjs` (`HISAAB_GAPS_RELIEF`, 26 items; target 20).
Mode: every item is tagged `relief`. Two items are also tagged `pre-election` and carry `poll`: `hrf207`
(Maharashtra hailstorm package, Lok Sabha 2014) and `hrf211` (Maharashtra flood package, Assembly 2019).
Four cash transfers are also tagged `distribution`: `hrf212`, `hrf213`, `hrf214` and `hrf219`.

Validation (26 Sep 2026):
- `node scripts/hisaab-validate.mjs editions/hisaab/bank/money-gaps-relief.mjs` prints OK.
- The whole-bank run, with every lane file present, also prints OK, so no id or question text is duplicated.
- `node --test tests/hisaab-bank.test.mjs` passes 4/4.

`asOf` is `2026-09` on every item. The lane is not registered in `bank/index.mjs`; the lead does that.

The gaps came from the completeness critic: UP, Haryana, Jharkhand, Chhattisgarh, the North-East and the
Himalayan states had few or no relief items; state COVID cash relief was thin; the Centre's cyclone aid
set against state demands was thin; the 11th and 15th Finance Commission disaster funds had no items; and
few relief items were tagged pre-poll. Each seed lead was checked against a fetched page. Leads that could
not be confirmed were dropped (see below).

## Sources consulted

WebSearch was not used (quota exhausted). Leads came from Google News RSS, with article links decoded to
publisher URLs through Google's redirect endpoint, and from publisher and government site pages. Every
`sourceUrl` and `sources` entry was fetched with Python `requests` or curl and read as text, including JSON-LD
article bodies. PDFs were read with `pypdf`. reddit.com was not touched.

**Open and official data**
- **Finance Commission of India** (`fincomindia.nic.in`). The 11th FC report PDF
  (`asset/doc/commission-reports/11th-FC/11threport.pdf`), ch. IX, para 9.8 and Annexures IX.1–IX.3:
  CRF 2000–05 of ₹11,007.59 crore (Centre ₹8,255.69 crore, states ₹2,751.90 crore); the 10th FC's
  ₹6,304.27 crore for 1995–2000; state-wise tables. Used for `hrf200`. This deep link replaces the ZIP
  archives that relief-centre could not cite.
- **Rajya Sabha Standing Committee on Home Affairs, 261st Report "Disaster Management"** (7 Aug 2026;
  `bucketapi.rajyasabha.digital`), paras 2.13.6–2.13.22: the 15th FC SDRMF of ₹1,60,153 crore and NDRMF
  of ₹68,463 crore; the 80:20 response–mitigation split and the 40/30/10 sub-windows; the new allocation
  formula; the 16th FC review (SDRF releases at 95–100%, mitigation-fund releases at about 80%). Used for
  `hrf215`.
- **Government statements as reported**:
  - PMO announcements on Thane (The Hindu), Yaas (Rediff/PTI) and Tauktae (Mint).
  - The MHA's high-level committee approvals: Gaja (TNM), Joshimath (IE), Himachal and Sikkim (NIE), Tripura's advance (The Hindu).
  - A Lok Sabha written reply on PM CARES for Children (All India Radio, `newsonair.gov.in`).
  - WCD Ministry data on applications (PTI via The Hindu).
  - The Tamil Nadu government's releases (Mint, BS, TOI).
  - The UP government's statements (TNIE, HT).
  - The State Level Bankers' Committee in Telangana (TOI).
  - The Jharkhand CMO (IE).
  - Mizoram's DIPR/PTI (Mint).
- **Election Commission schedules and results, as reported**:
  - Maharashtra's 2014 Lok Sabha phases (Mid-Day, 5 Mar 2014).
  - The 2014 Maharashtra seat tally (TOI, 24 May 2019, which gives the 2014 figures).
  - The 21 Oct 2019 Maharashtra polling date (IE, 21 Sep 2019).
  - The 2019 Assembly result (TOI, 25 Oct 2019).

  The pages on `results.eci.gov.in` are archived, so the ECI was not cited directly (as in the other relief lanes).
- **The Bombay High Court record, as reported** (The Hindu, 21 Mar 2014): the Election Commission's letter
  setting conditions on the hailstorm relief (`hrf207`).

**Established outlets and archives:**
- The Frontline archive, for 2000, 2004, 2007 and 2009.
- The Hindu, The Indian Express, Hindustan Times, The Times of India, The New Indian Express, Livemint, Business Standard and The Economic Times.
- The News Minute, Down To Earth, The Wire, India Today, The Tribune and Rediff (PTI).
- RuralVoice, Northeast Today and Northeast News (nenews.in), for North-East and Jharkhand follow-ups.

**Tried and unavailable or not used:**
- The Statesman returned 403 on the Tripura ₹288.93 crore story. That figure is not used.
- NDTV was skipped by policy. The Maharashtra minister's Tauktae quote was taken from Mint's live blog instead.
- NewsClick has a bot wall, so the MP EOW probe of the Bundelkhand package was not used.
- The Factly state-measures explainer (6 Apr 2020) renders its tables as images, so no figure was taken from it.
- Krishi Jagran was the only readable source for UP's January 2022 e-Shram ₹1,000 transfer, which was therefore dropped.

## Overlap check (done before writing)

I grepped all bank files for each subject. Where an existing item touched it, I asked about a different fact:

| subject | existing item | how this lane differs |
|---|---|---|
| Joshimath | `hst134` asks the crack count (868). Its explanation gives ₹26 crore and ₹1 lakh payouts in mid-2023. | `hrf220` asks the January 2023 rise from ₹5,000 to ₹1.5 lakh. Its outcome gives the ₹1,658.17 crore R&R plan. No crack figure is used. |
| Himachal 2023 | `hrf131` asks SDRF+NDRF receipts across 2023–24 (₹1,148 crore). Its outcome gives the ₹4,500 crore state package and ₹7 lakh per house. | `hrf225` asks the June 2025 recovery grant (₹2,006.40 crore) against the ₹9,042 crore PDNA ask. |
| Teesta-III, Sikkim GLOF | `hst344` asks the dam's cost. | `hrf221` asks the ₹44.8 crore SDRF advance and the Bengal row over it. |
| PM CARES | `hbx035`–`hbx039` cover receipts, spending, the 2024-25 balance (the ₹87.85 lakh scheme spend is in the `hbx037` explanation), the NDRF plea and RTI. `hrf034`'s outcome gives 4,345 children and ₹346 crore (2022-23). | `hrf217` asks applications approved against rejected (July 2024). Its outcome uses the 2023-24 spend (₹15.37 crore) and the state-wise beneficiaries. None of the existing figures is reused as an answer. |
| Bihar hooch deaths | `hst151` asks the excise department's "confirmed" deaths (about 190). | `hrf222` asks the condition attached to the 2023 ex gratia. The 364-death police figure (The Wire) was left out so the two counts do not collide. |
| TN Gaja | `hdb220` asks why TN paid ₹2,000 in 2019 (drought and Gaja). | `hrf210` asks the NDRF award. |
| Chhattisgarh | Items in dist-west-south and states-west-south ask about Mahtari Vandan (a women's transfer). | `hrf218` is Mahtari Dular (a scholarship for Covid orphans), a different scheme. |
| Finance Commissions | `hrf001` (NCCF corpus), `hrf009` (12th FC list), `hrf013` (13th), `hrf021` (14th) and `hrf038` (16th). | `hrf200` asks the 11th FC CRF size; `hrf215` asks the 15th FC's 80:20 split. |
| Cyclone ₹1,000 crore aid | `hrf020` asks the "₹1,000 crore habit" (Singh 2008 and 2013, Modi 2014). | `hrf216` asks how the Yaas money was split, not its size. |

## Items dropped or held, and why

- **UP Mukhyamantri Bal Seva Yojana (30 May 2021).** Verified by HT (30 May 2021) and Mint (18 Jun 2021): ₹4,000 a month to a guardian until the child reaches adulthood; ₹1,01,000 for a girl's marriage; tablets or laptops; about 1,000 children expected. Dropped so that UP stays at three items and the lane does not carry three Covid-orphan items. It is a ready reserve.
- **Hathras stampede ex gratia (Jul 2024).** Skipped. The event was a religious congregation run by a private individual, which the charter's framing rules make risky.
- **Cyclone Fengal (TN, Dec 2024).** Not fetched. It would repeat the Gaja and Michaung "Centre gave X against a demand of Y" pattern for the same state.
- **Kerala's ₹20,000 crore Covid package and AP's ₹1,000 per household (2020).** Not fetched. The Frontline and Factly pages were not read, so no figure is claimed.
- **Leh cloudburst package (2010).** Google News again returned only the PM's visit notice. No fetchable page gives the amount.
- **Morbi and Balasore PMNRF ex gratia.** Not researched for this pass.
- **UP e-Shram ₹1,000 (Jan 2022, weeks before the UP poll).** Only Krishi Jagran was readable, and the HT headline was seen but its page not read.
- **Bundelkhand package: MP EOW probe (NewsClick, Feb 2020).** The page has a bot wall, and any item would need a dated status. `hrf204` asks only about spending as reported by the nodal agency, names no one, and does not quote The Hindu's "pockets of officers" headline.
- **Goa floods (Jul 2021).** IE confirms the "worst floods in decades" but no relief figure was found. Goa is still at zero relief items.
- **Assam 2022 flood-relief irregularities and the CAG SDRF chapters.** Not attempted. India Today NE has a bot wall, and cag.gov.in serves a JavaScript shell (per the relief-centre notes).
- **Chennai ₹5,000 package as a pre-poll item (Dec 2015).** The amount is already folded into `hrf117`'s outcome. Not repeated.
- **Maharashtra 2014 hailstorm petitioners.** They are private individuals and are not named. `hrf207` cites the government and the EC only.
- **Assam 2007 (`hrf203`).** Frontline's line about advising displaced islanders to settle on river sandbars was left out, to avoid any community framing.

## Contested items (the other side is in the item)

- `hrf201`. "Insufficient" cash relief is Frontline's judgement and is attributed to it. The figures come from the state's revenue secretary.
- `hrf204`. The nodal agency's spending figures are set against the BSP government blaming late central releases and its ₹80,000 crore demand.
- `hrf207`. The EC's conditions are the fact. The state's line that the package was "assistance, not compensation" is included. There is no causal claim about the 2014 result.
- `hrf208`. The compensation and waiver figures come from a state BJP statement and are attributed to it.
- `hrf209`. The SP's "drama" charge is set against the Railways' statement that it had asked the collectors. The DMs' written replies are included.
- `hrf210`. The state official's reply is included: NDRF money is temporary relief and cannot be compared with the permanent-restoration ask.
- `hrf211`. HT says only that the package came "ahead of the state Assembly elections". There is no motive word and no causal claim.
- `hrf216`. Mamata Banerjee's ₹20,000 crore ask is included. A Maharashtra minister's "clear cut discrimination" charge over Tauktae is attributed; the minister is described by role.
- `hrf221`. Mamata Banerjee's "central discrimination" charge is set against the BJP's reply that no Bengal minister had visited the hills in 60 hours.
- `hrf222`. The policy reversal is set out with the earlier refusal, the officer's deterrence rationale, and the 2026 complaint from people blinded by liquor.
- `hrf225`. The Congress government pressing for faster release is set against the state BJP thanking the Centre.

## Discrepancies resolved

- **Bundelkhand package size.** The Hindu (2012) gives ₹7,266 crore and The Wire (2021) ₹7,466 crore. The item uses The Hindu, which is contemporaneous. The Hindu also gives UP's allocation as both ₹3,506 crore and ₹3,606 crore (NRAA); neither is used.
- **TN first-instalment cost.** Mint gives ₹4,153.69 crore and BS ₹4,153.39 crore. The item says "over ₹4,150 crore".
- **Telangana credit date.** TOI (15 Apr 2020) says the crediting was "completed on Wednesday". The stem says only "by 15 April".
- **Bihar hooch counts.** Three measures exist: police details of 199 incidents in 2016–23 (India Today, 2023); about 364 deaths per the ADG (Prohibition) (The Wire, 2026); and about 190 "confirmed" deaths per the excise department (`hst151`). `hrf222` uses only the 199 incidents, attributed.

## Year and `govt` conventions

- `year` is the year of the relief act:
  - `hrf204` (package 2009; the spending status is from Nov 2011) is filed under 2009, as relief-states did for later audits.
  - `hrf206` uses 2012, the year the interim relief was announced, for a cyclone of Dec 2011.
  - `hrf217` uses 2024, the year of the application data, for a scheme of 2021.
- `govt`:
  - Items coded to a state record the **state** government, even where the Centre acted (Thane, Gaja, Sikkim, HP, Tripura). This follows relief-states (`hrf122`, `hrf133`).
  - Items coded `IN` record the Centre (NDA).
  - `hrf205` records the Left Front as `CPI(M)`, the code GOVTS provides for West Bengal and Tripura.

## Distribution

- **Era (year field):** 2000–04: 3 (`hrf200`–`hrf202`); 2005–09: 3 (`hrf203`–`hrf205`); 2010–14: 2 (`hrf206`, `hrf207`);
  2015–19: 4 (`hrf208`–`hrf211`); 2020–26: 14 (`hrf212`–`hrf225`). The heavy recent share follows the critic's brief:
  Covid state payouts, the Himalayan and NE disasters of 2023–24, and PM CARES for Children.
- **Govt:** BJP 6, NDA 4, INC 4, AIADMK 2, and one each for RJD, BSP, CPI(M), SP, BRS, DMK, JMM, SKM, JDU and ZPM.
  Parties new to Rahat Kosh: RJD, BSP, SP, CPI(M), JMM, SKM and ZPM.
- **States newly covered or filled:** UP 3 (was 0), HR 1 (was 0), JH 1 (was 0), CT 1 (was 0), TR 1, MZ 1 and SK 1 (the first NE
  items outside Assam and Sikkim-2011), UT 1 (the first after 2015), HP 1, and WB with its first pre-2020 item. Goa is still 0.
- **Difficulty:** 8 simple, 9 expert, 9 extreme. **Answer slots:** 6/7/7/6. **Kinds:** spend 14, scheme 10, institution 2.
- **`enactedBy`** on 22 items. **`outcome`** on 25; `hrf218` has none because no reach figure was found. No item carries
  `people` or `status`: no one is named in a wrongdoing context. Leaders appear only as enactors, or quoted on the record
  about relief.

## Stale-risk facts (re-check monthly)

- `hrf217`: PM CARES for Children approvals and spending. Look for the next audited accounts, and for any court or RTI challenge to the rejections.
- `hrf223`: Tripura's recovery money. Only the first instalment (₹75.60 crore of ₹252 crore) had been released by May 2026.
- `hrf224`: Mizoram's ₹237.6 crore Remal memorandum. No central award was found as of Sep 2026.
- `hrf225`: releases against Himachal's ₹2,006.40 crore plan.
- `hrf221`: releases against Sikkim's ₹555.27 crore recovery plan.
- `hrf222`: Bihar's compensation policy. The blinded survivors' demand is open; Bihar's CM in Sep 2026 is Samrat Choudhary (per the relief-states notes), and a new government could change it.
- `hrf219`: whether Jharkhand pays drought relief again in a 2026 drought year.
- `hrf205`: progress on the Sundarbans embankments. The item's result is the May 2012 status; any later audit adds to it.

## Measures covered (compact table)

| name | level/state | launched | enacted by (name, role, party) | amount/benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| CRF 2000–05 (`hrf200`) | Centre/all states | Apr-2000 | 11th Finance Commission (Vajpayee govt, NDA) | ₹11,007.59 cr over 5 yrs, 75:25 | all states; 6 calamities | ≈₹1,992–2,421 cr/yr (annexure) | — | 11th FC report (fincomindia) |
| Drought relief doles (`hrf201`) | GJ | Jan–May-2000 | state govt (BJP) | ₹10/day adult, ₹5 child; cap ₹1,000/family/month | 5 lakh workers; 9,421 villages | — | — | Frontline 13 May 2000 |
| CRF release, Bihar floods (`hrf202`) | BR | Jul-2004 | Centre (UPA) to state (RJD) | ₹30.525 cr released; ₹81.8 cr CRF allocation | >1 crore people (unconfirmed) | — | — | Frontline 13 Aug 2004 |
| Majuli package (`hrf203`) | AS | Sep–Oct-2007 | Tarun Gogoi, CM, INC | ₹100 cr for the island | 1.35 lakh displaced islanders | — | — | Frontline 19 Oct 2007 |
| Bundelkhand package (`hrf204`) | UP/MP | 2009 | UPA govt (Planning Commission) | ₹7,266 cr, 2009-10 to 2011-12 | 7 UP + 6 MP districts | UP spent ₹280.99 cr by Nov 2011 | — | The Hindu 12 Feb 2012; The Wire 2021 |
| Aila relief (`hrf205`) | WB | May-2009 | Buddhadeb Bhattacharjee, CM, CPI(M) | ₹40 cr; free rice and dal; 2.5 lakh tarpaulins | >40 lakh affected | embankment project ₹5,032 cr | — | Frontline 19 Jun 2009; DTE 2012 |
| Thane interim aid (`hrf206`) | TN | Jan-2012 | Manmohan Singh, PM, INC | ₹500 cr (+₹125 cr Puducherry) | Cuddalore and coastal TN | — | — | The Hindu 10 Jan 2012 |
| Hailstorm package (`hrf207`) | MH | Mar-2014 | Prithviraj Chavan, CM, INC (EC-cleared) | ₹4,000 cr (₹2,000 cr direct aid) | 28 districts (petitioners' figure) | — | LS 2014 (MH), gap 21 days: BJP–SS 42 of 48 | The Hindu 21 Mar 2014; TOI 2019 |
| Hail relief waiver (`hrf208`) | HR | Mar–Apr-2015 | Manohar Lal Khattar, CM, BJP | 1-yr power-bill waiver (>50% loss); ₹10,000/acre wheat | hail-hit farmers | — | — | The Tribune 3 Apr 2015 |
| Water train vs tankers (`hrf209`) | UP | May-2016 | Akhilesh Yadav, CM, SP | asked for 10,000 tankers; relief packets | Bundelkhand districts | — | (UP 2017 not tagged) | IE 6 May 2016; IE 1 Apr 2016 |
| Gaja NDRF award (`hrf210`) | TN | Dec-2018 | Rajnath Singh, HM (HLC), BJP | ₹1,146.12 cr vs ₹15,000 cr sought | delta districts; 63 dead | — | — | TNM 2 Jan 2019 |
| Flood package (`hrf211`) | MH | Aug-2019 | Devendra Fadnavis, CM, BJP | 3× NDRF crop norms; loan waiver ≤1 ha; ₹2.5 lakh houses | Sangli, Kolhapur, Satara, Konkan | sought ₹6,813 cr from Centre | MH Oct 2019, gap 63 days: BJP 105, SS 56, NCP 54 | HT 20 Aug 2019; TOI 25 Oct 2019 |
| Covid maintenance allowance (`hrf212`) | UP | Apr-2020 | Yogi Adityanath, CM, BJP | ₹1,000 by DBT | 35 lakh (1 Apr) + 11 lakh construction + 5 lakh urban | ₹230 cr more in Jun 2021 | — | TNIE 10 Apr 2020; HT 10 Jun 2021 |
| Lockdown cash (`hrf213`) | TG | Apr-2020 | K. Chandrasekhar Rao, CM, TRS/BRS | ₹1,500 per white card + 12 kg rice | 76 lakh accounts | ₹2,000 cr programme | — | TOI 15 Apr 2020 |
| Covid relief ₹4,000 (`hrf214`) | TN | May-2021 | M.K. Stalin, CM, DMK | ₹4,000 in two parts + grocery kit | 2.09 cr rice cards | ₹8,392.76 cr (+₹844.51 cr kits) | (post-poll delivery of a poll promise) | Mint 7 May 2021; TOI 3 Jun 2021 |
| 15th FC SDRMF/NDRMF (`hrf215`) | Centre/all states | 2021–26 | 15th Finance Commission (NDA govt) | ₹1,60,153 cr + ₹68,463 cr; 80:20 | all states | — | — | RS Committee 261st Report |
| Tauktae/Yaas aid (`hrf216`) | GJ/OD/WB/JH | May-2021 | Narendra Modi, PM, BJP | ₹1,000 cr each; ₹2 lakh ex gratia | 4 states | — | — | Rediff/PTI 28 May 2021; Mint 19 May 2021 |
| PM CARES for Children (`hrf217`) | Centre | May-2021 | Narendra Modi, PM, BJP | ₹10 lakh at 23; stipend 18–23 | 4,532 approved of 9,331 | ₹15.37 cr (2023-24) | — | The Hindu/PTI 16 Jul 2024 |
| Mahtari Dular (`hrf218`) | CT | May–Jun-2021 | Bhupesh Baghel, CM, INC | free schooling; ₹500/₹1,000 a month | not found | — | — | TOI 14 Jun 2021 |
| Sukhad Rahat Yojana (`hrf219`) | JH | Oct-2022 | Hemant Soren, CM, JMM | ₹3,500 per farmer family | 30 lakh targeted; 13.35 lakh applied | ≈₹1,200 cr | — | IE 30 Oct 2022; DTE 12 Dec 2022 |
| Joshimath interim aid (`hrf220`) | UT | Jan-2023 | Pushkar Singh Dhami, CM, BJP; Amit Shah (HLC) | ₹1.5 lakh/family; ₹1,658.17 cr R&R plan | ~3,000 households | — | — | TOI 12 Jan 2023; IE 30 Nov 2023 |
| GLOF SDRF advance (`hrf221`) | SK | Oct-2023 | Amit Shah, HM, BJP | ₹44.8 cr; later ₹555.27 cr plan | Teesta valley | — | — | HT 8 Oct 2023; NIE 18 Jun 2025 |
| Hooch-death ex gratia (`hrf222`) | BR | Apr-2023 | Nitish Kumar, CM, JD(U) | ₹4 lakh from CMRF, with a pledge | 199 incidents since 2016 | — | — | India Today 24 Apr 2023; The Wire 2026 |
| Flood package (`hrf223`) | TR | Sep-2024 | Manik Saha, CM, BJP | ₹564 cr (state funds) | 9.8 lakh ration cards (rice) | Centre: ₹40 cr advance; ₹252 cr recovery | — | ET 7 Sep 2024; Northeast Today 30 May 2026 |
| Remal ex gratia (`hrf224`) | MZ | May-2024 | Lalduhoma, CM, ZPM | ₹4 lakh per death; ₹15 cr to SDRF | 27 dead (Aizawl) | sought ₹237.6 cr | — | Mint 29 May 2024; nenews 24 Jun 2024 |
| HP recovery grant (`hrf225`) | HP | Jun-2025 | Amit Shah, HM (HLC), BJP | ₹2,006.40 cr (₹1,504.80 cr central) vs ₹9,042 cr PDNA | 2023 monsoon districts | — | — | NIE 18 Jun 2025 |

The CRF annual figures in the first row (₹1,992.10 crore in 2000-01 rising to ₹2,421.41 crore in 2004-05) are the
annexure's column totals. They do not appear in the item.

## retroTags proposed (existing items that belong in Rahat Kosh)

- `hbx035`, `hbx036`, `hbx037`, `hbx038`, `hbx039` (PM CARES: receipts, disbursals, balance, NDRF plea, Article 12/RTI) → `['relief']`.
- `hbx050` (MPLADS suspended for 2020-22, with the money redirected to the Covid response) → `['relief']`.
- `hst134` (Joshimath; the explanation gives compensation and immediate-relief payouts) → `['relief']`.
- `hst330` (the Centre's 2025-26 special grant to Manipur to rehabilitate displaced people, under President's Rule) → `['relief']`.
  Budget facts only, with no group framing, as the brief asked.
- `hdb220` (TN ₹2,000 in 2019, justified by drought and Cyclone Gaja) → `['distribution', 'pre-election', 'relief']`.
- `hdb229` (TN ₹2,500 Pongal cash in 2021; the CM cited Covid and cyclone distress) → `['distribution', 'pre-election', 'relief']`. Borderline.
- `hst212` (the ED case over BMC's jumbo Covid centres, about the misuse of Covid-relief spending; the item already carries a status) → `['relief']`. Borderline.

**For the lead:** `hrf132` (Michaung ₹6,000, Dec 2023) could take a `poll` block for Lok Sabha 2024 in Tamil Nadu,
but retroTags cannot carry one. The polling date and the TN result were not fetched in this lane.

## For the reviewer to double-check

- `hrf200` cites a 322-page PDF. The facts are in ch. IX, para 9.8, in the summary paras 14.64–14.66 and in Annexure IX.1.
- `hrf202`: Frontline calls the Bihar affected-population figure "unconfirmed reports", and the outcome says so.
- `hrf207`: "21 days" runs from the government resolution of Thursday 20 Mar 2014 (The Hindu: "we issued on Thursday night") to Maharashtra's first phase on 10 Apr 2014 (Mid-Day).
- `hrf211`: 63 days runs from Monday 19 Aug 2019 (HT, 20 Aug: "on Monday") to 21 Oct 2019 (IE).
- `hrf216`: the Maharashtra minister is Nawab Malik (NCP), whom Mint names. The item describes him by role only, so it needs no `people` or `status` entry.
- `hrf218` has no `outcome`, because no reach or spend figure for Mahtari Dular was found.

## Verification (adversarial pass, 26 Sep 2026)

An independent verifier re-fetched every `sourceUrl` and every `sources` entry (curl / Python `requests`; PDFs read with
`pypdf`) and tried to refute each of the 26 items. **Result: 26 checked, 0 dropped, 14 items fixed.** The lane stays at 26
items. `node scripts/hisaab-validate.mjs editions/hisaab/bank/money-gaps-relief.mjs` prints OK. A run over all lane
files (excluding `index.mjs` and `sample.mjs`) also prints OK, so no id or stem is duplicated across lanes.
`node --test tests/hisaab-bank.test.mjs` passes 4/4.

No item is about wrongdoing, so no `status` line needed re-dating. `asOf` stays `2026-09` on every item.

### Confirmed as written (no change)

- `hrf200`: 11th FC report, para 9.8, paras 14.65–14.66 and Annexure IX.1 (₹11,007.59 / ₹8,255.69 / ₹2,751.90 crore;
  10th FC ₹6,304.27 crore; UP 98,711 lakh; Goa 685 lakh; six calamities; man-made disasters excluded).
- `hrf203`: Frontline, 19 Oct 2007.
- `hrf205`: Frontline, 19 Jun 2009; DTE, 14 May 2012.
- `hrf207`: GR of Thu 20 Mar 2014 to the first phase on 10 Apr 2014 is 21 days. The EC conditions are in The Hindu
  (21 Mar 2014). TOI (24 May 2019) states the "BJP-Sena ruling alliance had secured 42 seats in 2014". NCP's 4 and
  INC's 2 in 2014 are derived from the same TOI piece.
- `hrf210`: TNM, 2 Jan 2019. "On Monday" is 31 Dec 2018.
- `hrf211`: Mon 19 Aug 2019 (HT) to 21 Oct 2019 (IE) is 63 days. The result is from TOI, 25 Oct 2019.
- `hrf212`: TNIE (10 Apr 2020); HT (Wed 9 Jun 2021).
- `hrf218`: TOI, 14 Jun 2021. There is still no reach or spend figure; Google News RSS turned up only launch stories.
- `hrf220`: TOI and IE.
- `hrf224`: Mint (PTI/DIPR) and nenews. RSS found no central award against the ₹237.6 crore memorandum. The Feb 2025
  ₹1,554.99 crore approval covered AP, Nagaland, Odisha, Telangana and Tripura, not Mizoram. Still stale-risk.

### ECI

`results.eci.gov.in` (2019 AC and PC party-wise pages) returned 404 and `eci.gov.in/statistical-reports` returned 406;
`old.eci.gov.in` reset the connection. The results in `hrf207` and `hrf211` therefore stay sourced to TOI.

### Fixes

- **`hrf201`** (wording): the Frontline source is "Principal Secretary, Revenue", not "revenue secretary". Changed to
  "principal secretary (revenue)".
- **`hrf202`** (attribution): Frontline says the state "has reportedly demanded" ₹1,000 crore. Added "reportedly".
- **`hrf204`** (disputed figure): the explanation now says "The Hindu put the package at ₹7,266 crore". The Wire's
  ₹7,466 crore is noted above and not used.
- **`hrf206`** (misread source): the outcome said Cuddalore had "crops on two lakh hectares damaged there". The Hindu
  says two lakh hectares were damaged in all and Cuddalore accounted for over one lakh. Rewritten as over ₹4,000 crore
  of the projected ₹5,250 crore in losses, and over one lakh of the two lakh hectares.
- **`hrf208`** (attribution in the stem): the waiver slabs come only from a state BJP vice-president's statement
  (Tribune, 3 Apr 2015). No government order or second outlet was found (RSS returned only this story). The stem now
  says "Haryana's BJP said…". "March 2015 hailstorms" became "2015 hailstorms", because the source gives no month.
- **`hrf209`** (distractor also true): India Today (8 May 2016, "Akhilesh Yadav seeks money not water train from
  Centre") and Deccan Chronicle (7 May 2016, "UP seeks Rs 11,000 crore…") show UP also asked for about ₹11,000 crore
  at the 7 May meeting with the PM. The distractor "₹10,000 crore in drought aid" was therefore nearly true. Replaced
  with "Water airlifted by the Air Force".
- **`hrf212`** (precision): "free rations … went to 1.65 crore workers" became "a month's free ration … was being given
  to", as TNIE puts it.
- **`hrf213`** (dating and attribution):
  - TOI's story is timestamped 04:57 IST on Wed 15 Apr yet says the crediting was "completed on Wednesday". The stem
    now says "By mid-April".
  - "per bankers" was dropped. The State Level Bankers' Committee confirmed only the ₹1,112 crore; the 76 lakh count is TOI's.
  - The rice is now "announced" rather than "gave".
- **`hrf214`** (wording): "paid the first ₹2,000" became "released", since the 7 May order was for payment within May.
- **`hrf215`** (primary source added): read the 15th FC report, Vol I (paras 8.2 and 8.46ff; Table 8.2). It states the
  20% mitigation / 80% response split, ₹1,60,153 crore, ₹68,463 crore and the 40/30/10 windows. Added to `sources`.
  The outcome now says "for most states", as the RS committee report does.
- **`hrf216`** (charge wording and counterpoint):
  - Mint quotes Nawab Malik asking "Is this not clear cut discrimination?". The explanation now reports it as a question.
  - The outcome adds Mint's line that the Tauktae ex gratia applied "in all the affected states".
- **`hrf217`** (primary source added): the sansad.in Lok Sabha answer USQ 1841 (2 Aug 2024) was fetched from the
  Lok Sabha Q&A API.
  - It confirms announcement on 29.05.2021, the 11.03.2020–05.05.2023 window, ₹10 lakh at 23, and 4,532 beneficiaries
    (Maharashtra 855, UP 467, MP 433).
  - The URL was added to `sources`, and the outcome now dates the reply to 2 Aug 2024.
  - RSS found no ministry explanation for the rejections, so "no specific reason" (PTI) stands.
- **`hrf219`** (overclaim): "Soren ordered ₹3,500 again" became "directed that ₹3,500 be paid again", as RuralVoice
  reports a direction. No payment figure was found.
- **`hrf221`** (balance and attribution):
  - The reply was from the BJP's IT cell chief (Amit Malviya, per HT), not the party generally. The item now says so,
    by role.
  - Added Mamata Banerjee's own point that the state sent ₹25 crore to the GTA.
- **`hrf222`** (source access, distractor and outcome):
  - India Today returns 403 intermittently. It was read on a retry, and the ₹4 lakh, the CM's Relief Fund, the 199
    police-recorded incidents (2016–23), the pledge "not to consume liquor and to support prohibition" and the IAS
    officer's deterrence quote were all confirmed. The Assembly "no question" quote is in The Wire (17 Jun 2026).
  - The distractor "An affidavit naming the liquor seller" could not be ruled out as a real condition, because Google
    News decoding was rate-limited (429). It was replaced with "A promise to keep their children in school".
  - The outcome claimed every family "has received ₹4 lakh", which no source states. It now says the ₹4 lakh is paid
    only for deaths, that there is no compensation for blindness (Joint Commissioner, Prohibition, to The Wire), and
    that the state keeps no count of those blinded.
- **`hrf223`** (lopsided outcome): the outcome implied the Centre's only money after the ₹40 crore advance was the
  May 2026 recovery instalment. DD News (Feb 2025; HLC approval of ₹1,554.99 crore for five states) shows ₹288.93 crore
  of additional NDRF assistance for Tripura. Added it, with the DD News URL in `sources`.
- **`hrf225`** (unsupported claim): "From the same window" is not in NIE. Rephrased as "The Centre had earlier approved
  recovery plans of…".

### Distractor audit

Every distractor was checked against the fetched pages. Two were close to true and were replaced (`hrf209` and
`hrf222`, above). Four others were kept, each with a reason:

- `hrf200` "₹6,304 crore": the 10th FC total for a different period.
- `hrf206` "₹125 crore": Puducherry's share, not Tamil Nadu's.
- `hrf223` "₹40 crore": the central SDRF advance; the stem asks for the package from state funds.
- `hrf225` "₹633.73 crore": the Dec 2023 NDRF award; the stem asks for the June 2025 approval.

In each of these the stem's qualifier excludes the distractor, and none names a person in a wrongdoing context.

### Charter checks

- No item names anyone in a wrongdoing context.
- Motive words appear only as attributed quotes: the SP's "drama" (`hrf209`), Malik's question (`hrf216`) and Mamata
  Banerjee's "central discrimination" (`hrf221`).
- The only causal claims about election results are the two explicit "no cited source ties…" disclaimers.
- No private individuals are named. The 2014 PIL petitioners and the people quoted by The Wire are not in any item.
- No communal or caste framing. Frontline's line about sandbars and a community reference in `hrf203` remain excluded.

### Still open for the reviewer

- `hrf207`/`hrf211`: ECI pages unreachable; TOI results stand.
- `hrf208`: the only source is a party statement; the item is attributed.
- `hrf218`: no outcome.
- `hrf224`: no central award found.
