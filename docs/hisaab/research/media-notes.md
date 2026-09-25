# Media & speech lane ("Kiska Media?") — research notes

Lane file: `editions/hisaab/bank/media.mjs` (`HISAAB_MEDIA`, ids `hmd001`–`hmd045`, 45 items).
Researched and verified: September 2026 (`asOf: '2026-09'` on every item).
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/media.mjs` → OK (no problems);
whole-bank run also OK; `node --test tests/hisaab-bank.test.mjs` passes. The lane is **not yet
registered** in `editions/hisaab/bank/index.mjs` (lead's job: `media: HISAAB_MEDIA`).

## 1. Shape of the lane

| | count |
|---|---|
| difficulty | simple 15 · expert 16 · extreme 14 |
| correctIndex | 0:11 · 1:11 · 2:12 · 3:11 |
| kind | media 31 · institution 9 · spend 3 · scam 2 |
| state | IN 17 · KL 6 · TN 3 · MH 3 · TG 3 · AP 3 · JK 2 · UP 2 · HR, OD, PB, KA, DL, AS 1 each |
| govt | NDA 20 · LDF 4 · BJP 3 · INC 3 · UPA 2 · AAP 2 · SS 2 · BRS 2 · AIADMK, BJD, TDP, BSP, YSRCP, DMK, UDF 1 each |

Balance notes. Ownership-link items cover owners tied to the BJP (Zee/Subhash Chandra, Asianet &
Republic/Rajeev Chandrasekhar, OTV/Panda, News Live), Congress (Lokmat, Jaihind), SP (Dainik
Jagran), DMK (Sun TV, Kalaignar), AIADMK (News J / Jaya TV), YSRCP (Sakshi), BRS (T News /
Namasthe Telangana), CPI(M) (Kairali), Shiv Sena (Saamana), SAD (PTC) and the Sangh Parivar (Janam).
State action on media is not one-sided: the Centre (NDA) appears for Bhaskar, BBC, NewsClick,
MediaOne, the FCU and J&K; state governments appear for Kerala LDF (s.118A), Maharashtra MVA
(Arnab Goswami), Telangana TRS/BRS (2014 blackout, ad spend), Andhra YSRCP (2019 blackout) and TDP
(2024 blackout), Delhi AAP (ad recovery), Karnataka Congress (misinformation bill) and UP (Kappan).
`govt` records who governed the relevant level in the item's `year` (for a regional ownership fact,
the state government; for a CBI/ED/court matter, the Centre).

## 2. Method

- Memory proposed, a fetched page decided. Each item's `sourceUrl` was fetched in Sept 2026 and
  states the answer; second sources are in `sources`.
- WebSearch's session budget ran out early (shared with other lanes). After that, discovery used the
  Google News RSS feed (titles + dates, used only to find articles and to check for newer status),
  then the publisher page itself was fetched and read (curl / WebFetch). Wikipedia was used only to
  find references, and appears only as a second source (hmd039).
- The Media Ownership Monitor India (RSF + DataLEADS, 2019; site `india.mom-gmr.org`) is used as a
  named study for shareholding figures. Its data is from 2018–19 (see stale risks).
- The Indian Express explainer "Up in the air: Sun TV and Sakshi TV to Kairali, channels linked to
  politicians" (25 Jan 2023) is the single best cross-party source for party-linked channels.

## 3. Sources by item

| id | fact | primary source | second source(s) |
|---|---|---|---|
| hmd001 | Adani took control of NDTV (Dec 2022) | Tribune 31 Dec 2022 (Adani Enterprises filing) | Indian Express 23 Aug 2022; The Hindu 23 Jan 2026 (IANS) |
| hmd002 | VCPL loan to RRPR was funded by Reliance Strategic Ventures | Indian Express 23 Aug 2022 | — |
| hmd003 | JioStar = Reliance 63.16% + Disney 36.84% | JioStar/RIL–Disney joint release 14 Nov 2024 | RSF India profile 2026 |
| hmd004 | RIL → Independent Media Trust → Network18 (2014) | RIL press release 29 May 2014 (PDF) | — |
| hmd005 | Sony terminated Zee merger (22 Jan 2024), settled 27 Aug 2024 | Moneylife | Sony Form 6-K (sec.gov) |
| hmd006 | Subhash Chandra, Independent RS MP, Haryana 2016–22, BJP-backed | PRS MP Track | MOM "Political affiliations" |
| hmd007 | Rajeev Chandrasekhar: left Republic board 2018; Kerala BJP chief 2025 | Onmanorama 23 Mar 2025 | Scroll 2 Apr 2018; Inc42 7 May 2019; MOM Asianet News |
| hmd008 | Dainik Jagran chairman was SP RS MP 2006–12 | MOM Dainik Jagran | MOM political affiliations |
| hmd009 | AIADMK controls News J; Sasikala family runs Jaya TV | Indian Express 25 Jan 2023 | — |
| hmd010 | Odisha TV 96.46% Panda family; Panda ex-BJD, now BJP | MOM Odisha TV | RSF MOM page; IE 2023 |
| hmd011 | PTC "often linked to the SAD's Badal family"; Gurbani bill | The Hindu 20 Jun 2023 | The Hindu 7 Dec 2023 (bill reserved for President) |
| hmd012 | Jaihind TV backed by Kerala Congress | Indian Express 25 Jan 2023 | — |
| hmd013 | Vijay Darda convicted (coal block) July 2023; HC suspended sentence | Outlook July 2023 | ANI 26 Sep 2023; Pioneer Mar 2026 (Bander acquittal); MOM Lokmat |
| hmd014 | NewsClick: SC held arrest invalid (grounds not in writing) | The Wire 15 May 2024 | The Hindu 15 May 2024; LiveLaw 10 Jun 2026 |
| hmd015 | Bombay HC struck down the FCU rule (Sept 2024) | The Hindu 26 Sep 2024 | The Hindu 21 Mar 2024 (SC stay) |
| hmd016 | Kerala s.118A added and repealed (Nov 2020) | The News Minute 25 Nov 2020 | — |
| hmd017 | SC interim bail for Arnab Goswami (11 Nov 2020) | The Hindu 11 Nov 2020 | Bar & Bench 15 Aug 2026 |
| hmd018 | SC quashed MediaOne ban (5 Apr 2023) | Supreme Court Observer | — |
| hmd019 | TV9 & ABN blocked in Telangana (June 2014) | Indian Express 12 Sep 2014 | — |
| hmd020 | Sakshi TV, TV9, NTV, 10TV blacked out in AP (June 2024) | Economic Times 24 Jun 2024 | Madhyamam 24 Jun 2024; IE 2023 |
| hmd021 | MOM: four Hindi dailies = 76.45% readership | RSF MOM page (29 May 2019) | MOM political affiliations |
| hmd022 | ED alleged ₹200 crore to Kalaignar TV; all acquitted 2017 | Outlook 21 Dec 2017 | Bar & Bench Mar 2024 (CBI appeal admitted) |
| hmd023 | Namasthe Telangana govt ads ₹2.6 cr → ₹12.8 cr (RTI) | The Wire 20 Jul 2018 | — |
| hmd024 | RSF 2014: India 140th | RSF 2014 index page | Tribune 3 May 2023 (161st); RSF India 2026 |
| hmd025 | ED fined BBC WS India for exceeding 26% FDI cap | ThePrint 21 Feb 2025 | The Hindu 21 Feb 2025 |
| hmd026 | Anuradha Bhasin: review every 7 working days | Internet Freedom Foundation 10 Jan 2020 | — |
| hmd027 | Centre's ad spend ₹3,723 crore (RS reply, Dec 2022) | Indian Express 16 Dec 2022 | — |
| hmd028 | Umlesh Yadav: first paid-news disqualification, ₹21,250 | The Hindu 21 Oct 2011 | — |
| hmd029 | TRAI 21-day notice rule; AP 2019 blackout | The News Minute 18 Sep 2019 | — |
| hmd030 | Karnataka draft bill: up to 7 years' jail | New Indian Express 27 Jul 2025 | IFF statement 21 Jun 2025 |
| hmd031 | Access Now 2025: India 65 shutdowns | Indian Express 1 Apr 2026 | — |
| hmd032 | J&K 4G restored after ~18 months | Indian Express 5 Feb 2021 | — |
| hmd033 | L-G: recover ₹97.14 crore from AAP (CCRGA finding) | The Hindu 20 Dec 2022 | The Hindu 21 Nov 2023 (₹1,100 crore ad budget) |
| hmd034 | Sun TV owned by Kalanithi Maran, brother of DMK MP | Indian Express 25 Jan 2023 | MOM Dinakaran |
| hmd035 | Sakshi TV = Jagan Mohan Reddy's Indira Television | Indian Express 25 Jan 2023 | — |
| hmd036 | Kairali's owner is CPI(M)-backed; Brittas CPI(M) RS MP | Indian Express 25 Jan 2023 | PRS MP Track |
| hmd037 | Janam TV leans towards the Sangh Parivar; denial at launch | Indian Express 25 Jan 2023 | Business Standard/IANS 18 Feb 2015 |
| hmd038 | Saamana = Shiv Sena mouthpiece; Rashmi Thackeray editor | Scroll 1 Mar 2020 | — |
| hmd039 | T News started by KCR | The Wire 20 Jul 2018 | Wikipedia (launch year only) |
| hmd040 | News Live 51.33% Riniki Bhuyan Sarma | MOM News Live | RSF MOM page |
| hmd041 | RSF 2026: India 157th | RSF India profile | The Wire 30 Apr 2026 |
| hmd042 | Siddique Kappan arrested en route to Hathras | BOOM 2 Feb 2023 | The Hindu 4 Nov 2024 |
| hmd043 | Shreya Singhal struck down s.66A | Supreme Court Observer | — |
| hmd044 | SC put sedition in abeyance (11 May 2022) | The Hindu 11 May 2022 | — |
| hmd045 | I-T searches on Dainik Bhaskar (July 2021) | Indian Express 25 Jul 2021 | — |

## 4. Corrections to the brief's seed list (what the pages actually say)

- **Media Ownership Monitor India** was RSF with **DataLEADS** (Delhi), not Scroll; published
  29 May 2019, 58 outlets studied (RSF page).
- **Republic TV / Rajeev Chandrasekhar:** he resigned from the board of ARG Outlier Asianet News in
  2018 on joining the BJP; in May 2019 Arnab Goswami bought back shares and Asianet stayed a
  *minority investor* — reported as a dilution, not a full exit. He later served as a Union Minister
  of State and became Kerala BJP president in March 2025.
- **Lokmat / Vijay Darda:** convicted July 2023 (Fatehpur East block), but the Delhi HC suspended
  the sentence pending appeal (26 Sep 2023), and a CBI court **acquitted** him in the separate Bander
  block case (27 Mar 2026). The item states all three.
- **NewsClick:** besides the SC ruling (May 2024), the Delhi HC on 10 Jun 2026 **quashed** the 2020
  EOW FIR and the ED money-laundering case. The 2023 UAPA case is separate and was not reported closed.
- **RSF ranks:** 140 (2014) → 150 (2022) → 161 (2023) → 151 (2025) → **157 (2026)**, score 31.96.
- **Access Now:** India's 2025 count was **65**, down from 84 (2024) and 116 (2023); Myanmar led.

## 5. Items dropped or held as spares (and why)

Verified but cut for length (usable as spares or replacements):
- Kartikeya Sharma / iTV Network (NewsX, India News): Independent RS MP from Haryana 2022, BJP–JJP
  backed (IE 2023, PRS). Redundant with hmd006.
- Kasthuri News 24 (JD(S) MLA Anitha Kumaraswamy), Dighvijay News/Vijayavani (ex-BJP MP Vijay
  Sankeshwar), Nandighosha TV (BJD MLAs on the board), Mega 24 (seen as Congress's channel in TN)
  — all in IE 25 Jan 2023.
- Sakal (Pawar family; MOM lists Supriya Sule as a director in 2019) — MOM data may be stale.
- Andhra Pradesh GO 2430 (30 Oct 2019), letting department secretaries sue media for "false"
  reports; Jagan defended it in the Assembly (The News Minute 12 Dec 2019).
- Pegasus: SC technical committee found malware in 5 of 29 phones, not conclusively Pegasus, and said
  the Centre "has not cooperated" (IE 25 Aug 2022).
- Kashmir Press Club registration suspended and premises taken over (CPJ 17 Jan 2022).
- Arnab Goswami's >82% of ARG Outlier (company statement, The Week 19 Feb 2020).
- BJP was the top TV advertiser by BARC insertions in Nov 2018 (MOM) — single-week data, weak hook.

Dropped:
- National Herald / AJL / Young Indian — fast-moving (ED appeal against the trial court order was
  listed in Delhi HC for 12 Oct 2026); belongs to the scams lane.
- Ravish Kumar and other NDTV resignations — named individuals, adds nothing to the ownership fact.
- Hindustan Times chairperson as a nominated Rajya Sabha MP — could not fetch a non-Wikipedia page
  stating it before the search budget ran out.
- Mathrubhumi / M.P. Veerendra Kumar Rajya Sabha membership — MOM text truncated; unverified.
- Eenadu / Ramoji Rao — no party link stated in any fetched source.
- Sakshi / Jagati "quid pro quo" CBI chargesheets (2012) — IE mentions them, but the current trial
  status could not be verified, so the allegation is kept out of the item.
- 2020 TRP ratings case — status not verifiable within budget.
- Narottam Mishra paid-news disqualification (ECI 2017, set aside by Delhi HC 2018, SC appeal heard
  2023) — final outcome not found.
- Savukku Shankar Goondas Act detentions (TN), Sahyog portal / X Corp litigation (SC stayed HC
  proceedings Aug 2026), Mohammed Zubair — volatile or not fully researched.
- Section 69A mention in hmd043 — removed because no fetched page stated it.
- Sun TV family share dispute (Dayanidhi v Kalanithi Maran, 2025 legal notices) — family dispute,
  and the reported withdrawal of notices was not verified.

## 6. Contested items — the other side is in the explanation

| id | what is contested | counterpoint included |
|---|---|---|
| hmd001/002 | Adani's route to NDTV | NDTV said VCPL acted without the founders' consent |
| hmd005 | Zee–Sony termination | settled Aug 2024, all claims withdrawn |
| hmd011 | PTC's link to the Badals | stated as The Hindu's "often linked"; SGPC opposed the bill |
| hmd013 | Darda conviction | sentence suspended pending appeal; separate acquittal 2026 |
| hmd014 | NewsClick | NewsClick called the chargesheet "absurd", "baseless"; HC quashed the funding cases |
| hmd017 | Arnab Goswami arrest | case had been closed in 2019; he alleges vendetta; quash plea pending |
| hmd019 | Telangana 2014 blackout | KTR: government did not ask or pressure operators |
| hmd020 | Andhra 2024 blackout | TDP denied issuing directives |
| hmd022 | Kalaignar TV ₹200 crore | all accused acquitted; CBI appeal pending |
| hmd023 | Namasthe Telangana ads | figures are the I&PR department's own RTI data |
| hmd025 | BBC FEMA penalty | BBC said it had not received the order |
| hmd029 | Andhra 2019 blackout | allegations by channel staff; ministers did not respond |
| hmd033 | Delhi ad recovery | AAP called the L-G's orders illegal and outside his powers |
| hmd037 | Janam TV lean | chairman said no RSS/BJP backing at launch |
| hmd042 | Siddique Kappan | SC: "every person has a right to free expression"; not convicted |
| hmd045 | Dainik Bhaskar | paper said searches followed its Covid reporting; CBDT alleged ₹700 crore evasion |

No distractor in any wrongdoing item names a person: options are courts, amounts, percentages,
resources, agencies or places. Ownership items use party names or other outlets as distractors.

## 7. Stale-risk facts (re-verify before each release)

- **Legal statuses:** hmd013 (Darda appeal in Delhi HC), hmd014 (NewsClick UAPA case), hmd017
  (Arnab quash plea — Bombay HC next listed 4 Sep 2026, outcome not yet checked), hmd022 (2G appeals),
  hmd042 (Kappan trial), hmd011 (Gurbani bill with the President — a LiveLaw headline of 25 Sep 2026
  says the SC closed Punjab's plea on two reserved bills; check which), hmd030 (Karnataka bill).
- **Annual numbers:** RSF index (hmd024, hmd041; next edition ~May 2027); Access Now (hmd031; next
  ~Mar–Apr 2027).
- **Ownership:** MOM shareholding data is from 2018–19 (hmd006, hmd008, hmd010, hmd021, hmd040;
  table below). IANS takeover completion (hmd001). JioStar shareholding (hmd003). News J / Jaya TV
  control (hmd009). Asianet/Jupiter Capital (hmd007).
- **Positions held:** Rajeev Chandrasekhar (Kerala BJP chief), John Brittas (RS term), Rashmi
  Thackeray (Saamana editor), Riniki Bhuyan Sarma (News Live).

## 8. "Kiska Media?" — who owns what (reusable table for the design team)

Text names only; no logos or party symbols. "Link" is what the cited source documents, stated
neutrally; it is not a claim about editorial content.

| outlet | owner / controller | documented political link | source (as of) |
|---|---|---|---|
| NDTV | Adani Group (AMG Media Networks, via RRPR & VCPL) | — | Adani filing via Tribune (Dec 2022) |
| IANS (news agency) | Adani Group (majority Dec 2023; rest agreed Jan 2026) | — | The Hindu (Jan 2026) |
| Network18 (CNN-News18, CNBC-TV18) | Reliance Industries, via Independent Media Trust | — | RIL release (2014) |
| JioStar (Star, Colors, JioHotstar) | Reliance 63.16% · Disney 36.84% | — | JioStar release (Nov 2024) |
| Zee News | Zee Media Corporation (Subhash Chandra's group) | Chandra: Independent RS MP (Haryana) 2016–22, elected with BJP votes | PRS; MOM (2019) |
| Republic TV | ARG Outlier Media; Arnab Goswami >82% (2020) | early backer Rajeev Chandrasekhar (BJP) left board 2018 | Scroll; Inc42; The Week |
| Asianet News, Suvarna News | Jupiter Capital (Rajeev Chandrasekhar) | BJP; Kerala BJP president since 2025 | MOM (2019); Onmanorama (2025) |
| NewsX, India News (iTV) | Kartikeya Sharma | Independent RS MP (Haryana) 2022, BJP–JJP backed | IE (2023); PRS |
| Dainik Jagran | Gupta family (60.63% of Jagran Prakashan) | chairman was SP RS MP 2006–12; brother a BJP RS MP | MOM (2019) |
| Lokmat | Darda family trusts | Vijay Darda ex-Congress RS MP; Rajendra Darda ex-Congress minister | MOM (2019) |
| Sakal | Pawar family (Abhijit Pawar) | MD is a nephew of Sharad Pawar (NCP president in 2019); Supriya Sule listed as director | MOM (2019) |
| Saamana | Shiv Sena | party mouthpiece; editor Rashmi Thackeray (2020) | Scroll (2020) |
| Sun TV, Dinakaran | Kalanithi Maran (Sun Group) | brother Dayanidhi Maran is a DMK MP | IE (2023); MOM (2019) |
| Kalaignar TV / Kalaignar Seithigal | DMK | run directly by the party | IE (2023) |
| News J | AIADMK | controlled by the party | IE (2023) |
| Jaya TV, Jaya Plus | V.K. Sasikala's family | expelled from AIADMK 2017 | IE (2023) |
| Mega 24 | launched by K.V. Thangkabalu | viewed as Congress's channel | IE (2023) |
| Sakshi TV, Sakshi daily | Indira Television / Jagati Publications (Jagan Mohan Reddy's family) | YSRCP | IE (2023) |
| T News, Namasthe Telangana, Telangana Today | K. Chandrasekhar Rao's family circle (Telangana Publications) | BRS | The Wire (2018) |
| Kairali TV, People TV | Malayalam Communications | CPI(M)-backed; MD John Brittas is a CPI(M) RS MP | IE (2023); PRS |
| Jaihind TV | Bharat Broadcasting Network | Congress; chaired by Ramesh Chennithala | IE (2023) |
| Janam TV | Janam Multimedia | leans towards the Sangh Parivar (denied party backing at launch) | IE (2023); BS (2015) |
| Odisha TV | Panda family (96.46%) | Baijayant Panda, ex-BJD, BJP national VP | MOM (2019) |
| Nandighosha TV | Sakala Media | BJD MLAs on the board | IE (2023) |
| News Live (Assam) | Riniki Bhuyan Sarma (51.33%) | wife of Himanta Biswa Sarma (BJP) | MOM (2019) |
| Kasthuri News 24 | Anitha Kumaraswamy | JD(S) | IE (2023) |
| Dighvijay News, Vijayavani | Vijay Sankeshwar | former BJP MP | IE (2023) |
| PTC | private; "often linked to" the Badal family | Shiromani Akali Dal | The Hindu (2023) |
| MediaOne | reportedly operated by Jamaat-e-Islami Hind | — (Centre's ban quashed by SC, 2023) | Supreme Court Observer (2023) |

The table's non-item rows (iTV, Sakal, Nandighosha, Kasthuri, Dighvijay, Mega 24, IANS) are
sourced the same way and can become items without new research.
