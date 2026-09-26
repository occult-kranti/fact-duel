# Before the vote — the States (`hpe100`–`hpe199`) — research notes

Lane file: `editions/hisaab/bank/poll-states.mjs` (`HISAAB_POLL_STATES`), 52 items, ids `hpe100`–`hpe151`.
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/poll-states.mjs` prints OK. The full-bank run, with
every lane including `poll-union.mjs`, also prints OK, so no ids or question texts clash across lanes.
`node --test tests/hisaab-bank.test.mjs` passes. The lane is **not yet registered** in `bank/index.mjs`; the lead does that.

All items were checked against fetched pages in September 2026 (`asOf: '2026-09'`).

## Method and rules applied

- **Every item is tagged `'pre-election'`.** Items where money or goods changed hands also carry `'distribution'`.
  Two drought/flood items and the Kerala COVID food kits carry `'relief'`.
- **`poll`** gives `{ label, month, result }` on every item. `gapDays` is filled in only when both the announcement or
  first-payment date and the first polling day are on the record: 29 items have it (after verification; see below). The notes on gapDays below list how
  the less obvious ones were counted.
- **`enactedBy`** names whoever announced, presented or passed the measure: a CM, FM or PM, or an opposition leader for
  manifesto promises. 49 of 52 items have it (after verification). It is left out where a party or institution acted and
  no one person announced the measure (hpe114, hpe115, hpe122).
- **No item has `people`.** None names a person in a wrongdoing context, so none needs `status`. Named leaders appear
  only as the people who announced or passed schemes.
- **Motive words are always attributed.** "Election ploy" is quoted from Mint (hpe111). "Too little, too late" is
  Frontline's (hpe102). "Repackaging of old schemes" is the Bihar government's (hpe118). "Brazen violation" is Sitaram
  Yechury's (hpe129). "More like the Trinamool manifesto" is BJP MLA Ashok Lahiri's (hpe148). Each comes with the other
  side's reply where the source gives one. HT's "poll sop" label for Sanchar Kranti is not used.
- **No item claims an election result was caused by a scheme.** Where outlets (IANS, DTE, Telangana Today) made causal
  claims without a named study, those claims were left out. The only survey cited is Lokniti-CSDS / MIT-SOG, and only
  for *awareness* of Ladki Bahin (hpe144), not for vote effect.
- **Wikipedia is used only as a second source**, for official seat tallies and polling dates. Every item's `sourceUrl`
  is a primary or established-outlet page that states the answer.

## Sources consulted

**Open and official data**
- ECI live results pages. 2026 is still online:
  `results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm` (Tamil Nadu: TVK 108, DMK 59, AIADMK 47) and `-S25.htm`
  (West Bengal: BJP 207, TMC 80). Result pages for earlier years return 404, so older tallies come from outlets, with
  Wikipedia infoboxes as the second source.
- Supreme Court judgment *S. Subramaniam Balaji v. Govt of Tamil Nadu* (5 Jul 2013), via Indian Kanoon, doc 106854428.
- News On AIR, the public broadcaster (Haryana ₹500 LPG).
- A CAG audit finding on Madhya Pradesh's construction-workers' welfare fund, as reported by The Wire (Apr 2025).
- A CAG audit of Delhi's Ladli scheme, as reported by the New Indian Express (Feb 2025).
- ECI orders as quoted in full by the Hindustan Times (the Andhra DBT order of 9 May 2024).
- Maharashtra State Election Commission statements as quoted by The Hindu (Jan 2026).
- Budget and vote-on-account speeches as reported: Andhra Pradesh 2019, West Bengal 2026, Karnataka 2023.

**Established outlets**
- Frontline archives, 2002–2013. These were the backbone for the 2000–2013 items.
- The Hindu, The Indian Express, India Today (archive), The New Indian Express, Hindustan Times, Times of India,
  Business Standard, Mint, Down To Earth, The News Minute, Scroll, The Wire, BBC, Al Jazeera, Rediff (2004 and 2008
  archives), Deccan Chronicle, ET EnergyWorld, The South First, Telangana Today, The Asian Age, Economic Times and
  CNBC-TV18.
- Secondary only: Babushahi, RuralVoice, and Wikipedia for tallies and polling dates.

**Discovery**
- Google News RSS, with link decoding.
- Wikipedia reference lists, and Wikipedia raw section-0 pages for `election_date`.
- Indian Kanoon search.
- WebSearch was not used (quota exhausted). Reddit was not used.
- NDTV, Moneycontrol, News18, ThePrint (Cloudflare) and Business Standard premium pages would not load. Other outlets
  reporting the same fact were used instead.

## Coverage table

| # | Measure | State | Launched / announced | Enacted / announced by | Amount / benefit | Reach | Annual cost (as reported) | Next poll & result | Source |
|---|---|---|---|---|---|---|---|---|---|
| hpe100 | Power-dues waiver promise → 75% offer | HR | promise pre-Feb 2000; offer Apr 2002 | Om Prakash Chautala, CM (INLD) | 75% of dues | farmers in arrears | — | HR 2000: INLD 47/90 | Frontline 2002 |
| hpe150 | Drought-relief works wage | RJ | 2002–03 | Ashok Gehlot, CM (INC) | ₹60/day | 4.48 cr people hit by drought | — | RJ 2003: BJP 120/200 | Frontline 2003 |
| hpe101 | Pension promise ₹75→₹200 | AP | 2003–04 campaign | Y.S. Rajasekhara Reddy, LoP (INC) | ₹200/month | widows, aged, disabled | — | AP 2004: INC 185/294; TDP 47 | India Today 2004 |
| hpe102 | Farm-distress compensation | KA | before Apr 2004 | S.M. Krishna, CM (INC) | ₹1 lakh/family | barely 10% of needy got it | — | KA 2004: BJP 79, INC 65, JD(S) 58 | Frontline 2004 |
| hpe103 | DMK free-TV promise: cost row | TN | 29 Mar 2006 | M. Karunanidhi, DMK president | free colour TV | homes without TV | ₹530 cr/yr for 2 yrs (DMK) vs ₹15,000 cr (Jayalalithaa's claim) | TN 2006: DPA 163/234 (DMK 96) | Frontline 2006 |
| hpe104 | Co-op loan waiver | TN | 13 May 2006 | M. Karunanidhi, CM (DMK) | full co-op crop-loan waiver | farmers | ₹6,866 cr (one-time) | — (post-poll delivery) | Frontline 2006 |
| hpe105 | ₹3 rice + 25-paise salt | CT | early 2008 | Raman Singh, CM (BJP) | salt at 25 p/kg | BPL families | — | CT 2008: BJP 50/90 | Frontline 2008 |
| hpe106 | Bhamashah v1 | RJ | 2008 | Vasundhara Raje, CM (BJP) | bank transfers to women | 26 lakh accounts; ₹160 cr to 10 lakh | — | RJ 2008: INC 96, BJP 78 | The Hindu 2014 |
| hpe151 | Ladli scheme | DL | 2008 | Sheila Dikshit, CM (INC) | up to ₹1 lakh at 18 | girls | — (CAG: ₹618.38 cr unclaimed) | DL 2008: INC 43/70 | NIE 2025, TOI 2026 |
| hpe107 | TDP Cash Transfer Scheme promise | AP | Apr 2009 | N. Chandrababu Naidu, TDP (opposition) | ≥₹2,000/month + free CTV | every poor family | — | AP 2009: INC 156/294 | NIE 2009 |
| hpe108 | Free-TV distribution halted under the MCC | TN | 2 Mar 2011 | ECI / CEO (the scheme was the DMK's) | — | 10 lakh sets on order | — | TN 2011: AIADMK 150; front 203 | The Hindu 2011 |
| hpe109 | ₹2 rice for APL cards (EC ban lifted) | KL | 2011 | LDF govt (V.S. Achuthanandan, CM) | 6–10 kg at ₹2/kg | APL cards | ₹250 cr budgeted | KL 2011: UDF 72, LDF 68 | The Hindu 2011 |
| hpe110 | Unemployment allowance (35+) | UP | 15 Mar 2012 | Akhilesh Yadav, CM (SP) | ₹1,000/month | ~9 lakh | ₹1,100 cr/yr | UP 2012: SP 224/403 | The Hindu 2012 |
| hpe111 | Chhattisgarh Food Security Act | CT | 22 Dec 2012 | Raman Singh, CM (BJP) | legal food guarantee | ~50 lakh families (~90%) | >₹2,311 cr | CT 2013: BJP 49, INC 39 | Mint 2012 |
| hpe112 | Dilli Annashree | DL | 15 Dec 2012 | Sheila Dikshit, CM (INC) | ₹600/month | ~2 lakh families | — | DL 2013: BJP 31, AAP 28, INC 8 | India Today 2012 |
| hpe113 | Fans, mixies, grinders: reach per TN's SC submission (rewritten in verification) | TN | G.O. 3 Jun 2011 | J. Jayalalithaa, CM (AIADMK) | 25 lakh packages in 2011-12 | ~1.83 crore women in phases | — | TN 2011: AIADMK 150 | Indian Kanoon |
| hpe114 | Congress paddy ₹2,000 promise | CT | 2013 campaign | Congress (opposition) | ₹2,000/qtl vs MSP ₹1,310 | paddy farmers | — | CT 2013: BJP 49, INC 39 | Frontline 2013 |
| hpe115 | AAP free-water promise | DL | Nov 2013 | AAP manifesto | 700 L/day free | households | — | DL 2013 as above | Down To Earth 2013 |
| hpe116 | Loan-waiver ceiling ₹1.5 lakh | AP | 21 Jul 2014 | N. Chandrababu Naidu, CM (TDP) | up to ₹1.5 lakh/family | 96.27% of 80 lakh+ borrowers | ₹43,000 cr total | (AP 2014: TDP 102/175 before it) | DTE 2014 |
| hpe117 | Loan-waiver cut-off (2013-14 only) | TG | 4 Jun 2014 | K. Chandrasekhar Rao, CM (TRS) | up to ₹1 lakh | 2013-14 crop loans | ₹14,897 → ₹7,840 cr | (TG 2014: TRS 63/119) | DTE 2014 |
| hpe118 | Projects launched with the Bihar package (re-angled in verification) | BR | 18 Aug 2015 | Narendra Modi, PM (BJP) | ₹9,700 cr projects; package ₹1.25 lakh cr | state | — | BR 2015: GA 178/243 | India Today 2015 |
| hpe119 | Khadya Sathi | WB | 27 Jan 2016 | Mamata Banerjee, CM (TMC) | rice/wheat ₹2/kg | >7 crore people | — | WB 2016: TMC 211/294 | IE 2016 |
| hpe120 | 100 free power units | TN | 23 May 2016 | J. Jayalalithaa, CM (AIADMK) | 100 units free | all homes | ~₹1,607 cr | (post-poll delivery of promise) | Business Standard 2016 |
| hpe121 | Indira Canteens | KA | 16 Aug 2017 | Siddaramaiah, CM (INC) | ₹5 breakfast, ₹10 meals | 198 wards | — | KA 2018: BJP 104, INC 78, JD(S) 37 | IE 2017 |
| hpe122 | Gujarat poll dates delayed (flood relief cited) | GJ | 12 Oct 2017 | ECI (CEC A.K. Joti) | — | — | — | GJ 2017: BJP 99, INC 77 | IE 2017 |
| hpe123 | Sanchar Kranti smartphones | CT | 26 Jul 2018 | Raman Singh, CM (BJP) | free smartphone | 50 lakh planned; ~20 lakh undelivered | ₹1,467.90 cr | CT 2018: INC 68, BJP 15 | IE 2018, HT 2018 |
| hpe124 | TRS manifesto: Aasara ₹2,016 | TG | 2 Dec 2018 | K. Chandrasekhar Rao, caretaker CM (TRS) | ₹1,000 → ₹2,016/month | pensioners | — | TG 2018: TRS 88/119 | TNM 2018 |
| hpe125 | Sambal ₹200 flat power bill + dues waiver | MP | cabinet 5 Jun 2018 | Shivraj Singh Chouhan, CM (BJP) | ₹200/month bill | 88 lakh families expected | — (CAG: ₹416.33 cr diverted in 2021) | MP 2018: INC 114, BJP 109 | ET Energy 2018 |
| hpe126 | Loan waiver ≤₹2 lakh on oath day | MP | 17 Dec 2018 | Kamal Nath, CM (INC) | crop loans ≤₹2 lakh | farmers | — | (post-poll delivery of promise) | The Hindu 2018 |
| hpe127 | Annadata Sukhibhava | AP | 5 Feb 2019 | Yanamala Ramakrishnudu, FM (TDP) | farm investment aid | farmers | ₹5,000 cr allotted | AP 2019: YSRCP 151, TDP 23 | HT 2019, The Hindu 2019 |
| hpe128 | Punjab Smart Connect phones | PB | 12 Aug 2020 | Amarinder Singh, CM (INC) | free smartphone | 1,74,015 students | ₹92 cr | PB 2022: AAP 92, INC 18 | NIE 2020 |
| hpe129 | Free-vaccine manifesto promise | BR | 22 Oct 2020 | Nirmala Sitharaman, Union FM (BJP) | free Covid vaccine | everyone in Bihar | — | BR 2020: NDA kept power (BJP 74, JD(U) 43; RJD 75) | TOI 2020 |
| hpe130 | Free food kits | KL | 10 Apr 2020; extended Dec 2020 | Pinarayi Vijayan, CM (CPI(M)) | 17-item kit | >87 lakh families | — | KL 2021: LDF 99/140 | TNM 2021 |
| hpe131 | Co-op crop-loan waiver | TN | 5 Feb 2021 | Edappadi K. Palaniswami, CM (AIADMK) | loan waiver | 16.43 lakh farmers | ₹12,110 cr | TN 2021: DMK 133; alliance 159 | The Hindu 2021 |
| hpe132 | Lakshmir Bhandar launch | WB | 1 Sep 2021 | Mamata Banerjee, CM (TMC) | ₹500–1,000/month | >1.1 cr applicants | — | (WB 2021: TMC 213) | TOI 2021 |
| hpe133 | Power-dues waiver ≤2 kW | PB | 29 Sep 2021 | Charanjit Singh Channi, CM (INC) | pending bills waived | 53 lakh ≤2 kW connections | ₹1,200 cr | PB 2022: AAP 92 | Business Standard 2021 |
| hpe134 | Free water ≤16,000 L/month | GA | 1 Sep 2021 | Pramod Sawant, CM (BJP) | free water | ~60% of people | — | GA 2022: BJP 20/40 | IE 2021 |
| hpe135 | 50% cut in tube-well power bills | UP | Jan 2022 | Yogi Adityanath, CM (BJP) | 50% cut | >13 lakh users | — | UP 2022: BJP 255, SP 111 | TOI 2022 |
| hpe136 | Bommai budget: interest-free loans to ₹5 lakh | KA | 17 Feb 2023 | Basavaraj Bommai, CM/FM (BJP) | ₹5 lakh interest-free; Bhoo Siri ₹10,000 | ~50 lakh farmers | — | KA 2023: INC 135, BJP 66 | The South First 2023 |
| hpe137 | Minimum Guaranteed Income Act | RJ | 21 Jul 2023 | Ashok Gehlot, CM (INC) | 125 days of work; ₹1,000 pension +15%/yr | all families; pensioners | — | RJ 2023: BJP 115, INC 69 | The Hindu 2023 |
| hpe138 | BJP paddy ₹3,100 promise | CT | 3 Nov 2023 | Amit Shah, Union HM (BJP) | ₹3,100/qtl, 21 qtl/acre | paddy farmers | — | CT 2023: BJP 54, INC 35 | The Hindu 2023 |
| hpe139 | ₹19,000 cr to finish loan waiver | TG | 2 Aug 2023 | K. Chandrasekhar Rao, CM (BRS) | ≤₹1 lakh waiver | farmers | ₹19,000 cr release | TG 2023: INC 64, BRS 39 | Indian Express 2023 |
| hpe140 | Congress six guarantees | TG | 17 Sep 2023 | Sonia Gandhi (INC) | ₹2,500/month to women, etc. | women, farmers | — | TG 2023 as above | IE 2023 |
| hpe141 | ECI halts ₹14,165.66 cr DBT credits | AP | order 9 May 2024 (releases Jan–Mar) | ECI; releases by Y.S. Jagan Mohan Reddy, CM (YSRCP) | 6 DBT schemes | — | ₹14,165.66 cr | AP 2024: TDP 135, JSP 21, BJP 8; YSRCP 11 | HT 2024 |
| hpe142 | Har Ghar-Har Grihini ₹500 LPG | HR | 12 Aug 2024 | Nayab Singh Saini, CM (BJP) | ₹500 cylinder, 12/yr | ~50 lakh families | ₹1,500 cr/yr | HR 2024: BJP 48, INC 37 | News On AIR 2024 |
| hpe143 | Loan-waiver limit ₹2 lakh | JH | 7 Aug 2024 | Hemant Soren, CM (JMM) | ≤₹2 lakh | 1.76 lakh by Sept | ~₹750 cr | JH 2024: JMM 34, INC 16; BJP 21 | India Today 2024 |
| hpe144 | Ladki Bahin paid through November before MCC | MH | by 15 Oct 2024 | Eknath Shinde, CM (Shiv Sena) | ₹1,500/month | 2.34 cr women | ₹46,000 cr budgeted | MH 2024: BJP 132, SS 57, NCP 41 | Asian Age 2024, Scroll 2024 |
| hpe145 | Subhadra ₹50,000 voucher promise | OD | manifesto May 2024 | BJP manifesto | ₹50,000 in 2 yrs (promised) → over 5 yrs (as run) | women 21–60 | — | OD 2024: BJP 78, BJD 51 | The Hindu 2024 |
| hpe146 | 125 free power units | BR | 17 Jul 2025 | Nitish Kumar, CM (JD(U)) | 125 units free | 1.67 cr consumers | — | BR 2025: NDA 202 (BJP 89, JD(U) 85) | NIE 2025 |
| hpe147 | SEC bars advance Ladki Bahin instalment | MH | 12 Jan 2026 | State Election Commission; govt of Devendra Fadnavis, CM (BJP) | ₹3,000 advance barred | — | — | BMC Jan 2026: BJP 89/227; allies 118 | The Hindu 2026 |
| hpe148 | Banglar Yuba-Sathi | WB | 5 Feb 2026 (start advanced to 1 Apr; transfers announced from 7 Mar) | Chandrima Bhattacharya, FM; Mamata Banerjee, CM (TMC) | ₹1,500/month, ages 21–40 | 90 lakh–1 crore applicants (CM) | ₹5,000 cr (2026-27) | WB 2026: BJP 207, TMC 80 | TOI 2026 |
| hpe149 | Pongal cash gift | TN | 4 Jan 2026 | M.K. Stalin, CM (DMK) | ₹3,000/card | ~2.23 cr cards | ₹6,936.18 cr | TN 2026: TVK 108, DMK 59, AIADMK 47 | NIE 2026 |

## Distribution

**By era**

| Era | Items | Share |
|---|---|---|
| 2000–04 | 4 | 8% |
| 2005–09 | 6 | 12% |
| 2010–14 | 10 | 19% |
| 2015–19 | 10 | 19% |
| 2020–26 | 22 | 42% |

The earlier eras are thinner because few pre-2005 state articles are indexed; the older items rest mainly on Frontline's
archive.

**By `govt`**

| Govt | Items |
|---|---|
| INC | 12 |
| BJP | 12 |
| AIADMK | 4 |
| BRS | 4 |
| TDP | 3 |
| DMK | 3 |
| TMC | 3 |
| LDF | 2 |
| JDU | 2 |
| SP | 1 |
| YSRCP | 1 |
| JMM | 1 |
| SS | 1 |
| BJD | 1 |
| NDA (Centre) | 1 |
| Other (INLD) | 1 |

Parties appear in several roles:

- **As the government making the handout.** Every party that governed a state appears this way.
- **As the opposition making the promise.** Examples are the TDP in 2009, the Congress in 2013, 2018 and 2023, the AAP
  in 2013, and the BJP in 2020, 2023 and 2024.
- **As the side the ECI or SEC acted against.** In 2011 this was the DMK, in 2017 the BJP (the Gujarat delay was
  alleged to favour it), in 2024 the YSRCP and in 2026 the BJP-led Mahayuti.

No single party is cast only as the one bending the model code.

**Other spreads**

| Spread | Result |
|---|---|
| States covered | 19 states |
| Difficulty | simple 16 / expert 17 / extreme 19 (after verification) |
| `correctIndex` | 13 / 13 / 13 / 13 |

## Items dropped or not written, and why

- **Punjab's free farm power, withdrawn Oct 2002 and restored Nov 2005.** Verified (Indian Express 2023), but `hdb100`
  already asks it.
- **Rajasthan's 2002–03 relief days, cut from 15 to 10.** `hrf103` asks it. I wrote a different angle, the ₹60 wage and
  the 2003 result (`hpe150`).
- **Telangana's Rythu Bima (2018).** Verified: ₹636 crore premium for 31.25 lakh farmers (Telangana Today). Dropped to
  keep Telangana from dominating the lane. The Sept 2026 report that the scheme had "stopped" was seen only as a
  headline and was not used.
- **UP's free-ration extension (Mar 2022).** Verified: ₹3,270 crore for 15 crore people. It is folded into the outcome
  of `hpe135` rather than written as its own item.
- **The Congress's ₹2,500 paddy promise in Chhattisgarh (2018).** The Business Standard page was premium and would not
  load. `hdb224` already mentions ₹2,500.
- **Andhra pensions doubled to ₹2,000 (Jan 2019).** The only source is Naidu's own claim, reported by the Indian
  Express. It overlaps `hdb221` (Pasupu-Kumkuma).
- **Bihar cycle scheme (2006).** Verified (Indian Express 2025), but it came four years before the 2010 poll, so the
  pre-election timing is too weak.
- **Odisha's ₹1-a-kg rice (2013), Bhamashah as a 2008 poll-eve launch date, and the Karnataka 2023 "guarantee card"
  wording.** No fetchable page stated the fact. The India Today page for the guarantee card would not render.
- **Tamil Nadu 2001, Madhya Pradesh 2003, Delhi 2003 and Chhattisgarh 2003.** No fetchable page described a specific
  pre-poll handout. The Chhattisgarh 2003 material involved a private individual (the CM's spouse), so it was avoided.
- **The Maharashtra Oct 2024 "Diwali bonus" or advance-instalment date.** No page gave the exact credit date. `hpe144`
  therefore states "paid till November before the MCC" and gives no gapDays.
- **The UP 2012 CAG finding on cheque-distribution events.** `hdb110` asks it, so it was removed from the `hpe110`
  outcome.

## Contested or sensitive items (reviewer: please re-read)

- **hpe102 — farmer-suicide compensation, Karnataka 2004.** The topic is sensitive. The wording is factual, and the
  "barely 10%" figure is Frontline's assessment.
- **hpe100 — Haryana 2002 police firings (three dead).** The item is framed around the broken promise and the
  agitation, not around any individual.
- **hpe122 — Gujarat 2017.** The Congress alleged the BJP pushed the ECI to delay. Both the ECI's stated reasons and
  S.Y. Quraishi's criticism are given.
- **hpe141 — the ECI's order to Andhra Pradesh (2024).** The ECI's reasoning is given in full: the releases were
  announced before the MCC but not transferred. The order is framed as a timing issue, not as wrongdoing by a named
  person.
- **hpe125 — CAG on Madhya Pradesh's welfare board.** The CAG's finding is quoted: ₹416.33 crore paid to offset power
  subsidy. The Wire's own characterisation ("illegal diversion") and its naming of the former CM are not used.
- **hpe111, hpe118, hpe129, hpe145, hpe148.** Each carries opinion words attributed to a named speaker or outlet, with
  the counterpoint where the source gives one.
- **hpe113 — the Supreme Court's freebies ruling.** It is kept distinct from `hsc057`: that item asks what the 2013
  ruling held, while this one asks whom the court directed to frame guidelines.

## Facts at risk of going stale (recheck monthly)

- **hpe148 — Banglar Yuba-Sathi.** Verified in the verification pass: the start was advanced from 15 Aug to 1 Apr, and
  transfers were announced from 7 Mar 2026. The new BJP government's June 2026 budget offered ₹3,000 a month under
  'Bhorsa Karmasathi'; whether that formally replaced Yuba-Sathi is not stated by the source.
- **hpe145 — Subhadra.** Eligibility rules and instalment status change.
- **hpe147 — Ladki Bahin and the Jan 2026 civic polls.** Beneficiary counts are changing after the 2025–26
  verification drive (see `hst208`).
- **hpe143 — Jharkhand loan waiver.** The final count of farmers covered is not settled.
- **hpe140 — Telangana's six guarantees.** Implementation, especially the ₹2,500 Mahalakshmi payment, has not been
  verified. The outcome states only the 2023 result.
- **hpe149 — Tamil Nadu 2026.** The TVK government is new. The outcome gives only ECI seat counts. By-elections are due
  in Oct 2026.

## Notes on gapDays

- **Counted from the announcement or launch date** to the first polling day. Examples: hpe103 (manifesto 29 Mar 2006 →
  8 May 2006) and hpe123 (26 Jul 2018 → 12 Nov 2018).
- **hpe141 (Andhra Pradesh 2024)** counts from the first "button-press" release on 23 Jan 2024 to 13 May 2024, giving
  111 days. The ECI order itself came 4 days before polling, which the stem says.
- **hpe122 (Gujarat 2017)** counts from the ECI's Himachal-only announcement (12 Oct) to Gujarat's first phase
  (9 Dec), giving 58 days.
- **hpe130 (Kerala kits)** counts from the first kit on 10 Apr 2020, giving 361 days. The December 2020 extension has
  no exact date.
- **Left without gapDays** where the date is unknown: hpe100, hpe101, hpe102, hpe105, hpe106, hpe107, hpe109, hpe110,
  hpe114, hpe115, hpe135, hpe144, hpe145, hpe147, hpe150 and hpe151. (hpe133 gained gapDays 144 in verification.)
- **Left without gapDays** where the measure came after the vote, as delivery of a promise: hpe104, hpe113 (rewritten), hpe116, hpe117,
  hpe120, hpe126 and hpe132. For these the `poll` records the election the promise was made for.

## retroTags suggested for existing items

These items belong in "Chunav Se Pehle". Each needs a `poll` block added when it is tagged. The suggested poll is in
the structured summary returned to the lead.

| Item | Suggested tags | Why |
|---|---|---|
| hst152 | distribution, pre-election | Bihar ₹10,000 transfers, weeks before the 2025 poll |
| hst248 | distribution, pre-election | Tamil Nadu ₹5,000 transfers, Feb 2026 |
| hst321 | distribution, pre-election | Assam Orunodoi ₹9,000, Mar 2026 |
| hst207 | distribution, pre-election | Ladki Bahin amount, Maharashtra 2024 |
| hst104 | distribution, pre-election | Delhi free bus rides for women from Oct 2019, before the 2020 poll |
| hdb211 | distribution, pre-election | Tamil Nadu 2011 mixer, grinder and fan promise |
| hdb212 | distribution, pre-election | Tamil Nadu 2011 laptop promise |
| hdb205 | distribution, pre-election | Tamil Nadu 2006 colour TVs |
| hdb117 | distribution, pre-election | UP 2017 loan waiver |
| hdb215 | distribution, pre-election | Karnataka 2013 Anna Bhagya |
| hdb219 | distribution, pre-election | Karnataka 2018 loan waiver |
| hdb222 | distribution, pre-election | Andhra Pradesh 2019 Rythu Bharosa |
| hdb234 | distribution, pre-election | Karnataka 2023 guarantees |
| hdb138 | distribution, pre-election | Haryana 2024 Lado Lakshmi |
| hdb103 | distribution, pre-election | UP 2006 unemployment allowance, before the 2007 poll |
| hdb141 | distribution, pre-election | Punjab 2026-27 budget, before the 2027 poll |
| hrf026 | relief, pre-election | Cyclone Fani during the 2019 MCC |
| hrf103 | relief, pre-election | Rajasthan drought "not an election issue" (2003) |
| hst119 | pre-election | Himachal 2022 Old Pension Scheme promise |
| hsc057 | pre-election | Freebies reference to a larger bench |
| hfw009 | pre-election | MP 2023 Ladli Behna deepfake |

## Verification

This section records the adversarial verification pass, carried out in September 2026 by a second agent who did not
write the lane. Every item's `sourceUrl`, and every URL in `sources`, was fetched again. Most were fetched with curl,
and India Today bodies were read from the embedded JSON because WebFetch is blocked there. Each correct option, number,
date, `enactedBy` entry and poll figure was checked against the page. The job was to refute each item where possible.
Every `gapDays` value was recomputed from source dates, and all 29 match. Polling dates were cross-checked on Wikipedia
or on the cited outlet.

**Result:** 52 items checked. **No items were dropped.** Ids are unchanged. The lane has 52 items and the validator
prints OK, both for this file and for all lane files together, so no ids or question texts clash across lanes.
`node --test tests/hisaab-bank.test.mjs` passes. No item names a person in a wrongdoing context, so none needs `people`
or `status`. The distribution by `govt` is unchanged.

### Items rewritten (same id)

- **hpe113 — rewritten because it duplicated `hpe015` (poll-union).** Both asked whom the Supreme Court's 2013 freebies
  ruling directed to frame manifesto guidelines (the ECI). The item now asks a fact recorded in the same judgment
  (Indian Kanoon doc 106854428, para 60): Tamil Nadu's submission that a G.O. of 3 June 2011 ordered 25 lakh packages
  of fans, mixies and grinders for 2011-12, with about 1.83 crore women to be covered in phases. The old answer
  already appears in `hpe015`. The new fact does not overlap `hdb211`, which asks what the AIADMK promised.
  - Other changes: `year` 2013 → 2011; `kind` → scheme; `topic` → Welfare & Subsidies; `difficulty` simple → extreme.
  - `enactedBy` J. Jayalalithaa was added.
  - The petitioner's name was removed from the explanation; the case title stays only in `sourceLabel`.
- **hpe118 — re-angled because `hpe021` (poll-union) states its answer.** `hpe021`'s stem gives the ₹1.25 lakh crore
  package size, and its explanation gives the ₹1.65 lakh crore total. The item now asks the value of the projects Modi
  launched the same day at Arrah: ₹9,700 crore, per India Today.
  - `difficulty` simple → extreme.
  - Jaitley's retort is now quoted as the source reports it: ask the Congress why the projects "were not implemented".

### Fixes to facts, sources and wording

- **hpe103:** The ₹530 crore remark came at a 5 April rally, not when the manifesto was released on 29 March (Frontline).
  The stem now says "Defending the DMK's manifesto". The outcome now says that on 17 May Karunanidhi *said*
  distribution *would begin* on 15 September. The source does not report that it began.
- **hpe105:** Scroll was added as a source for the "third term in 2013" claim in the outcome.
- **hpe109:**
  - The minister spoke on 19 April, six days *after* polling (13 April). The explanation now says so.
  - The distractor "A High Court stay on the subsidy" was replaced with "A delay in printing new APL cards". No fetched
    source rules out court proceedings over the EC ban, so the old distractor could not be shown to be false.
  - `enactedBy` was changed from V.S. Achuthanandan, whom the source does not name, to C. Divakaran, Food and Civil
    Supplies Minister (CPI), whom it does. His party was confirmed on Wikipedia.
  - `difficulty` expert → simple, to rebalance.
- **hpe111:** The state BJP's reply (the law made food a right, per Mint) was added next to the "election ploy" charge.
- **hpe114:** The source says "election manager", not campaign manager. Frontline's credit is only for the ₹2 rice; the
  "timely paddy payments" were Frontline's own observation, so that is no longer put in critics' mouths. The Hindu 2023
  was added as a source for the ₹3,100 remark.
- **hpe116:** "a cool RBI" is now the source's own words, "not favourably disposed" (Down To Earth).
- **hpe117:**
  - The stem "winning … on a promise" implied a cause. It now says "his TRS won … having promised".
  - The ₹17,000 crore figure is attributed to The News Minute, not "IANS".
  - The TNM 2018 manifesto page was added as the source for the second ₹1 lakh waiver promise.
- **hpe120:** The 2021 figure for the 2016 waiver is attributed to Palaniswami, who gave it, not to "the state".
- **hpe121:** The outcome now matches the source: the Congress *offered* to back a JD(S)-led government under H.D.
  Kumaraswamy.
- **hpe122:** The India Today second source returns 403, so it was replaced by Wikipedia (BJP 99, Congress 77). The
  "per India Today" attribution was dropped.
- **hpe123:** The source does not say Kovind handed out the phones. The stem now reads "At an event with President
  Kovind…". Wikipedia was added for the 68/15 tally.
- **hpe125:**
  - No source gave a 1 July start. The stem now anchors on the cabinet approval of 5 June 2018 (ET EnergyWorld), so
    `gapDays` changed from 150 to 176 (to 28 Nov 2018).
  - The CAG finding is now dated "reported in April 2025" (The Wire, 11 Apr 2025, "recently tabled"). It was
    previously "tabled in 2025", which is unconfirmed.
- **hpe127:**
  - The distractor "Renamed it but kept the payout" was replaced with "Paid the pending first instalment". HT says the
    scheme was "rechristened", which made the old distractor half-true.
  - The explanation now matches HT exactly: Rythu Bharosa launched on 15 October with ₹12,500 into each farmer's
    account, instead of "₹12,500 a year".
  - Wikipedia was added for the 11 April 2019 polling date.
- **hpe129:**
  - The stem now says the vaccine pledge was "the first of its 11 resolutions" (TOI). Sitharaman did not "call" it that.
  - The distractor "19 lakh jobs in five years" was replaced with "Restoring the old pension scheme". The 19 lakh jobs
    pledge was also in the same manifesto, so the old distractor was true.
- **hpe130:** The ₹1,600 pension figure came only from a private interviewee, so it was removed. TNM's counterpoint (the
  pandemic's hit to jobs) was added next to the "elections in mind" view.
- **hpe132:** The TOI Feb 2026 page was added as the source for the outcome's 2.2 crore women and ₹1,500 figures.
- **hpe133:**
  - `sourceUrl` moved to Business Standard (29 Sep 2021), which names Channi's cabinet, the date, the ₹1,200 crore cost
    and 53 lakh consumers. The TOI explainer did not name Channi as the one who ordered the waiver.
  - The stem is now dated to September 2021, and `gapDays` 144 was added.
  - The outcome now records that the AAP had promised in June 2021 to waive all pending domestic bills and give 300
    free units (Business Standard). Both sides now appear.
- **hpe134:** The Wire reports that three independents pledged support and that the BJP was only "in talks" with the
  MGP. The "formed the government with … MGP support" claim was corrected accordingly.
- **hpe137:** The distractors 5% and 10% were the real half-yearly components of the 15% annual rise, so they were
  replaced with 8%, 12% and 20%.
- **hpe139:**
  - `sourceUrl` moved to The Indian Express (3 Aug 2023). The original source, Telangana Today, is widely seen as close
    to the BRS; it stays as a second source.
  - The explanation now carries the opposition's "poll gimmick" charge, attributed to Revanth Reddy and the BJP, with
    KCR's stated reasons for the delay.
  - The stem says "mid-September", because IE and Telangana Today differ on the exact date.
- **hpe140:** The outcome now adds a verified result: free bus travel from 9 Dec 2023, with 290 crore zero-fare trips by
  early 2026 (TOI). The ₹2,500 Mahalakshmi cash payment remains **unverified** and is not claimed either way.
- **hpe141:**
  - The distractor "About ₹6,394 crore" was the YSR Asara component of the answer, so it was replaced.
  - The other side was added: YSRCP leaders blamed a TDP complaint. The outcome now says a court let the money go only
    after polling, and that the state released ₹1,480 crore (Asara) and ₹502 crore (fee reimbursement) two days after
    the vote (Hans India, 17 May 2024).
- **hpe143:** The outcome now gives the source's figure of ₹400.66 crore transferred on 26 Sep 2024 for 1.76 lakh farmers.
- **hpe144:** A named survey was added to the outcome: The Hindu's Lokniti-CSDS post-poll finding that more women than
  men backed the Mahayuti, more so among women who had applied for the scheme. It is stated as a correlation, as the
  charter allows, and is not claimed as a cause. There is still no `gapDays`: TOI says the October–November advance was
  credited across October, with no single date.
- **hpe145:** The stem now says "Over how long", matching NIE and The Hindu ("encashed over two years"). `enactedBy` J.P.
  Nadda was added; NIE says he released the manifesto and stated the two-year term.
- **hpe146:** The Wikipedia source was replaced by HT (BJP 89, JD(U) 85, RJD 25) and The Hindu (first phase 6 Nov 2025).
  **Wikipedia's 2025 Bihar infobox currently shows wrong polling dates (30 Apr / 7 May 2025).** Other lanes that cite
  it for dates should not rely on it.
- **hpe147:**
  - CM Fadnavis's reply was added: he said it was a continuing scheme.
  - `enactedBy` now leads with Girish Mahajan (BJP), the minister who announced the ₹3,000 advance, per The Hindu.
- **hpe148 — a factual error was corrected.** The outcome said the TMC lost power "before the scheme's planned rollout".
  In fact:
  - Mamata Banerjee advanced the start from 15 August to 1 April (TOI, 11 Feb 2026; The Hindu, 23 Feb 2026).
  - On 7 March she said transfers would begin that day (Millennium Post, 7 Mar 2026).
  The explanation and outcome now record this. Other changes:
  - `enactedBy` Mamata Banerjee was added.
  - The stale-risk flag is resolved: the new BJP government's June 2026 budget offered jobless youth ₹3,000 a month under
    "Bhorsa Karmasathi" (The Hindu, 22 Jun 2026). The source does not say whether this formally replaced Yuba-Sathi.
  - News On AIR was added for the 23 and 29 April polling dates.
- **hpe150:**
  - "The drought did go to the polls" implied a cause no study supports, so it was removed.
  - "A worker said the ₹60 was not paid in full" is now "a goshala employee", which is what Frontline says.
- **hpe151:** The ₹618.38 crore unclaimed-funds figure was removed from the explanation because `hdb128` asks it. The
  duplicate-registration figure (16,546) replaces it.
- **Outcome wording in hpe127, hpe130, hpe131, hpe133, hpe134, hpe136, hpe137, hpe139, hpe142, hpe144 and hpe149:**
  "On [polling day] X won" became "In the [date] poll X won". Results were declared later, so the old wording was
  misleading.

### Checked and left unchanged

hpe100, hpe101, hpe102, hpe104, hpe106, hpe107, hpe108, hpe110, hpe112, hpe115, hpe116, hpe119, hpe124, hpe126,
hpe128, hpe131, hpe132, hpe135, hpe136, hpe138, hpe142 and hpe149. Each correct option, number, date, `enactedBy`
entry and tally is stated on its fetched source. Minor source or wording additions to hpe116, hpe132, hpe136 and hpe142
are listed above.

### The author's sensitive flags, re-read

- **hpe100:** No person is named in connection with the firings. The police firings and deaths are Frontline's report.
- **hpe102:** The item is phrased respectfully. "Barely 10%" and "too little, too late" are attributed to Frontline, and
  Krishna's own explanation of the result is attributed to him.
- **hpe113:** Rewritten, as described above.
- **hpe122:** The ECI's reasons, Quraishi's criticism and the Congress allegation are all attributed. No named person
  is accused.
- **hpe125:** The CAG finding is stated as the CAG's. The Wire's "illegal diversion" wording and its naming of the
  former CM are still left out.
- **hpe129:** Yechury's charge is attributed, and Malviya's reply is kept.
- **hpe141:** The ECI's reasoning is kept, and the YSRCP's response and the court outcome were added. No named person is
  accused.
- **hpe145:** The opposition's "cheating" charge is attributed; the scheme rules are quoted from The Hindu.

### Still unverified, carried forward

- The status of Telangana's ₹2,500 Mahalakshmi cash payment (hpe140). Only free bus travel was verified.
- The exact 2008 launch months of Bhamashah (hpe106) and Delhi Ladli (hpe151), and the exact October 2024 credit date of
  the Ladki Bahin advance (hpe144). None of these three has `gapDays`.
- Whether any Yuba-Sathi money was actually credited before the MCC (hpe148). The item claims only what was announced.

### Sources added in verification

- Business Standard:
  - Punjab 2 kW waiver (29 Sep 2021).
  - Kejriwal's 300-unit promise (29 Jun 2021).
- The Indian Express: KCR's waiver and the opposition's reaction (3 Aug 2023).
- Hans India: AP funds released after polling (17 May 2024).
- The Hindu:
  - Lokniti-CSDS post-poll survey on Maharashtra (25 Nov 2024).
  - Bihar first phase (6 Nov 2025).
  - Bengal BJP budget (22 Jun 2026).
- Hindustan Times: Bihar 2025 tally.
- TOI:
  - Yuva Sathi advanced to 1 April (11 Feb 2026).
  - Telangana free-bus trips (Apr 2026).
- Millennium Post: Yuba Sathi transfers from 7 March (7 Mar 2026).
- News On AIR: 2026 TN and WB polling schedule.
- Wikipedia:
  - Tallies and dates for 2014 AP, 2017 GJ, 2018 CT and 2019 AP (tallies only as second source).
  - C. Divakaran's party.
