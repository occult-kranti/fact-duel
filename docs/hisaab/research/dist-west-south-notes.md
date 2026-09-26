# Distribution — West & South: research notes

Lane file: `editions/hisaab/bank/dist-west-south.mjs` (`HISAAB_DIST_WEST_SOUTH`, ids `hdb200`–`hdb244`, 45 items).
Researched and checked in September 2026; every item carries `asOf: '2026-09'`.

- Validator (`node scripts/hisaab-validate.mjs editions/hisaab/bank/dist-west-south.mjs`): **OK, no problems.**
- Whole bank (`node scripts/hisaab-validate.mjs`): OK. `node --test tests/hisaab-*.test.mjs`: 40/40 pass.
  The lane is **not registered** in `editions/hisaab/bank/index.mjs` (outside this lane's write scope).
- All 88 distinct URLs (source + `sources`) returned HTTP 200 to curl with a browser user-agent on 26 Sep 2026.
- No item uses `people`/`status`: none is about wrongdoing. The one item near a regulatory finding (hdb236, the ECI
  withdrawing Rythu Bandhu permission) names the office ("the state's finance minister"), not the person.

## How sources were found (WebSearch unavailable)

- **Google News RSS** for titles, dates and publishers; links were then resolved to deep URLs through the
  publishers' own date sitemaps: Times of India (`/staticsitemap/toi/news/YYYY-Month-N.xml`, back to 2001),
  Indian Express (`/sitemap.xml?yyyy=&mm=&dd=`), New Indian Express (`/sitemap/sitemap-daily-YYYY-MM-DD.xml`,
  back to ~2011), Deccan Herald, BusinessLine and Frontline (archive sitemaps listed in their robots.txt).
- **TOI slug search** over monthly sitemaps was the main route to 2003–2011 coverage.
- **Bing News RSS** for 2023–26 stories. Google News article links could not be decoded (captcha).
- The Hindu's `/sitemap/archive*` is disallowed in its robots.txt, so it was **not** used; Hindu articles are
  cited only where another route produced the URL.
- Wikipedia election pages (infobox read via `action=render`) were used **only as secondary sources** for poll
  dates and seat tallies; every office-holder named in `enactedBy` also has a non-Wikipedia source.

### Open and official data used

| source | used for |
|---|---|
| PRS Legislative Research, state budget analyses (prsindia.org/budgets/states) | KA 2018-19 loan waiver (hdb219); AP 2019-20 allocations (hdb222, 223, 227); CG 2019-20 waiver and ₹2,500 paddy, 2020-21 Kisan Nyay, 2024-25 Mahtari Vandan (hdb224, 228, 238); TG 2019-20 loan waiver and Rythu Bandhu hike (hdb218, 225); MH 2020-21 loan waiver (hdb226) |
| PIB (pib.gov.in) | Mahtari Vandan launch and first instalment, 10 Mar 2024 (hdb238) |
| Election Commission results | results.eci.gov.in pages for 2023–24 now return 404; seat tallies taken from news reports and Wikipedia election infoboxes (which cite ECI) |
| RBI State Finances, CAG, data.gov.in, Open Budgets India | checked for scheme-level figures; nothing fetched there added to what PRS already gave for these items |
| State government pages | Goa social-welfare portal and Telangana Aasara/Kalyana Lakshmi portals did not respond; Goa facts come from The Goan |

Outlets: Times of India (main source for 18 items), The Indian Express, The New Indian Express, Deccan Herald, Frontline,
The Goan, OneIndia (UNI copy).

## Counts

| | |
|---|---|
| States | TN 10 · AP 7 · MP 5 · KA 5 · MH 4 · CT 4 · TG 4 · GA 2 · GJ 2 · KL 2 |
| Difficulty | extreme 16 · simple 15 · expert 14 |
| correctIndex | 11 / 14 / 10 / 10 |
| Kind | scheme 43 · spend 2 |
| Tags | all 45 `distribution`; 21 also `pre-election` (each with `poll`) |
| `enactedBy` | 44 of 45 (hdb239 Namo Shri omitted: the source names no minister) |
| `outcome` | 45 of 45 |

### Era distribution (by `year`)

| 2000–04 | 2005–09 | 2010–14 | 2015–19 | 2020–26 |
|---|---|---|---|---|
| 5 (hdb200–204) | 6 (hdb205–210) | 7 (hdb211–217) | 9 (hdb218–226) | 18 (hdb227–244) |

### `govt` distribution

| govt | n | items |
|---|---|---|
| BJP | 11 | hdb200, 207, 208, 214, 217, 231, 232, 233, 238, 239, 244 |
| INC | 9 | hdb202, 203, 209, 215, 216, 224, 228, 234, 235 |
| AIADMK | 6 | hdb204, 211, 212, 213, 220, 229 |
| DMK | 4 | hdb205, 206, 210, 237 |
| BRS (TRS) | 4 | hdb218, 225, 230, 236 |
| YSRCP | 3 | hdb222, 223, 227 |
| SS | 3 | hdb226 (MVA), 240, 241 (Shinde) |
| TDP | 2 | hdb201, 221 |
| LDF | 2 | hdb242, 243 |
| Other | 1 | hdb219 (JD(S)–Congress coalition) |

`govt` = who ran the state when the fact happened. hdb203 is `INC` (Congress CM of the Congress–NCP front);
hdb213 is `AIADMK` although the TV scheme was the DMK's (both CMs are in `enactedBy`).

Balance: every party that governed these states appears as the one handing out money, and results are shown
whichever way they went — incumbents that won after a pre-poll measure (BJP MP 2008/2013/2023, BJP CG 2008,
INC AP 2009, TRS 2018, BJP GJ 2022, Mahayuti 2024, BJP LS 2024) and incumbents that lost (TDP 2004 and 2019,
AIADMK 2019 LS and 2021, BRS 2021 by-poll and 2023, LDF 2026, DMK 2026). No item says a transfer caused a result.

### Pre-poll items (no causal claims)

| id | measure | poll | gap (days) | result |
|---|---|---|---|---|
| hdb201 | Naidu's Mahanadu farm package (28 May 2003) | AP 2004 | 328 | Congress 185 of 294; TDP 47 |
| hdb203 | MH free farm power, Jul 2004–Mar 2005 | MH 2004 | — (start date only) | NCP 71, Congress 69 of 288 |
| hdb208 | CG rice at ₹3 (16 Jan 2008) | CG 2008 | 303 | BJP 50 of 90 |
| hdb209 | AP rice at ₹2 (9 Apr 2008) | AP 2009 | 372 | Congress 156 of 294 |
| hdb210 | TN rice at Re 1 (announced 30 Aug 2008) | LS 2009 (TN) | 256 | DMK-led 27 of 39 |
| hdb214 | MP Annapurna (1 Jun 2013) | MP 2013 | 177 | BJP 165 of 230 |
| hdb218 | Rythu Bandhu launch (10 May 2018) | TG 2018 | 211 | TRS 88 of 119 |
| hdb220 | TN ₹2,000 BPL aid (11 Feb 2019) | LS 2019 (TN) | 66 | DMK-led 38 of 39 |
| hdb221 | Pasupu-Kumkuma final instalment (EC order 4 Apr 2019) | AP 2019 | — (launch date not in source) | YSRCP 151 of 175 |
| hdb229 | TN Pongal ₹2,500 (paid from 4 Jan 2021) | TN 2021 | 92 | DMK 133 of 234 |
| hdb230 | Dalit Bandhu (4 Aug 2021) | Huzurabad by-poll | 87 | BJP won by 23,855 |
| hdb231 | GJ two free cylinders (17 Oct 2022) | GJ 2022 | 45 | BJP 156 of 182 |
| hdb232 | Ladli Behna first transfer (10 Jun 2023) | MP 2023 | 160 | BJP 163 of 230 |
| hdb233 | Ladli Behna ₹1,250 + ₹450 LPG | MP 2023 | — (hike date not in source) | BJP 163 of 230 |
| hdb236 | ECI withdraws Rythu Bandhu nod (27 Nov 2023) | TG 2023 | 3 | Congress 64 of 119 |
| hdb238 | Mahtari Vandan first instalment (10 Mar 2024) | LS 2024 (CG) | 40 | BJP 10 of 11 |
| hdb239 | Namo Shri GRs (16 Mar 2024) | LS 2024 (GJ) | 52 | BJP 25 of 26 |
| hdb240, 241 | MH pre-poll budget (28 Jun 2024) | MH 2024 | 145 | Mahayuti 235 of 288 |
| hdb242, 243 | KL welfare package (29 Oct 2025) | KL 2026 | 162 | UDF 102 of 140 |

Every date above was cross-checked against the weekday the source gives ("on Wednesday", etc.).

## Schemes and measures covered

| name | state | launched | enacted by | benefit | reach | annual cost | next poll & result | source |
|---|---|---|---|---|---|---|---|---|
| Dayanand Social Security Scheme | GA | 2002 | Manohar Parrikar, CM, BJP | ₹2,000/month + ₹500 medical (2026) | ~2.5 lakh with Griha Aadhar | ₹480 cr (2026-27) | Goa 2027 (pending) | The Goan |
| Mahanadu farm package | AP | May 2003 | N. Chandrababu Naidu, CM, TDP | ₹15,000 grant + ₹2,500 credit per farmer SHG; interest waivers | 80 lakh farmers in SHGs (plan) | ₹250 cr + ₹94 cr waivers | AP 2004: Congress 185/294 | TOI |
| Free farm power | AP | May 2004 | Y.S. Rajasekhara Reddy, CM, INC | free power + bill-arrears waiver | all farmers | ₹436 cr (2004-05) + ₹1,192 cr dues | AP 2009: Congress 156/294 | TOI |
| Free farm power (Jul 2004–Mar 2005) | MH | Jul 2004 | Sushilkumar Shinde, CM, INC | free power | farmers | ₹1,590 cr subsidy | MH 2004: DF retained | TOI |
| Domestic tariff rollback | TN | May 2004 | J. Jayalalithaa, CM, AIADMK | Dec 2001 tariffs | ~1.2 cr families | ₹910 cr | — | TOI |
| Free colour TV | TN | Sep 2006 | M. Karunanidhi, CM, DMK | a colour TV | 14.6 lakh by Jul 2007 | — | scrapped Jun 2011 | TOI |
| Ladli Laxmi Yojana | MP | May 2007 | Shivraj Singh Chouhan, CM, BJP | >₹1 lakh by 21 | 3.45 lakh girls in 2020-21; >23 lakh by 2016 | ₹1,363.62 cr (2020-21) | — | OneIndia (UNI), NIE, IE |
| Rice at ₹3/kg, 35 kg | CT | Jan 2008 | Raman Singh, CM, BJP | subsidised rice | ~34 lakh BPL families | ₹837 cr | CG 2008: BJP 50/90 | TOI |
| Rice at ₹2/kg | AP | Apr 2008 | Y.S. Rajasekhara Reddy, CM, INC | subsidised rice | ~1.87 cr BPL families | — | AP 2009: Congress 156/294 | TOI |
| Rice at Re 1/kg | TN | Sep 2008 | M. Karunanidhi, CM, DMK | 20 kg/month at Re 1 | 1.86 cr families | +₹400 cr | LS 2009: DMK-led 27/39 | TOI |
| Mixer, grinder, fan (2011 promise) | TN | Sep 2011 | J. Jayalalithaa, CM, AIADMK | appliances | — | — | — | IE, TOI |
| Free laptops | TN | Sep 2011 | J. Jayalalithaa, CM, AIADMK | a laptop | 51.67 lakh (2011–19) | ₹6,456 cr initial; ₹7,257.61 cr to 2019 | — | NIE |
| Mukhyamantri Annapurna | MP | Jun 2013 | Shivraj Singh Chouhan, CM, BJP | wheat/salt Re 1, rice ₹2 | 74 lakh families | ₹1,000 cr | MP 2013: BJP 165/230 | TOI |
| Anna Bhagya | KA | Jul 2013 | Siddaramaiah, CM, INC | 30 kg rice at Re 1 | 98 lakh families | ₹4,200 cr | — | NIE |
| Ksheera Bhagya | KA | Aug 2013 | Siddaramaiah, CM, INC | 150 ml milk ×3/week | 1.04 cr children | ₹384 cr | — | NIE |
| Griha Aadhar | GA | 2013 | Manohar Parrikar, CM, BJP | ₹1,500/month (2026) | ~2.5 lakh with DSSS | ₹249 cr (2026-27) | Goa 2027 (pending) | The Goan |
| Rythu Bandhu | TG | May 2018 | K. Chandrasekhar Rao, CM, TRS | ₹4,000/acre/season; ₹10,000/yr from 2019 | ~58 lakh farmers | ₹12,000 cr | TG 2018: TRS 88/119 | TOI, PRS |
| Farm loan waiver | KA | Jul 2018 | H.D. Kumaraswamy, CM & FM, JD(S) | loans ≤ ₹2 lakh | — | ₹34,000 cr (total) | — | PRS |
| ₹2,000 special assistance | TN | Feb 2019 | Edappadi K. Palaniswami, CM, AIADMK | ₹2,000 one-time | ~60 lakh BPL families | ₹1,200 cr | LS 2019: DMK-led 38/39 | IE |
| Pasupu-Kumkuma | AP | Feb 2019 | N. Chandrababu Naidu, CM, TDP | ₹10,000 + smartphone | ~93 lakh / 97.94 lakh women | ₹9,794 cr | AP 2019: YSRCP 151/175 | IE, TOI |
| YSR Rythu Bharosa | AP | Oct 2019 | Y.S. Jagan Mohan Reddy, CM, YSRCP | ₹13,500/yr incl. PM-KISAN | ~54 lakh farmers | ₹8,750 cr (2019-20) | — | TOI, PRS |
| Farm loan waiver + ₹2,500 paddy | CT | 2019-20 budget | Bhupesh Baghel, CM, INC | waiver; paddy at ₹2,500/qtl | ~20 lakh farmers | ₹5,000 cr + ₹5,000 cr | — | PRS |
| Crop loan waiver | TG | Sep 2019 | K. Chandrasekhar Rao, CM, TRS | waiver | — | ₹6,000 cr | — | PRS |
| Mahatma Jyotirao Phule Karj Mukti | MH | Dec 2019 | Uddhav Thackeray, CM, Shiv Sena | waiver ≤ ₹2 lakh | — | ₹15,000 cr + ₹7,000 cr | — | PRS, TOI |
| Jagananna Amma Vodi | AP | Jan 2020 | Y.S. Jagan Mohan Reddy, CM, YSRCP | ₹15,000/yr to mothers | 42.1 lakh mothers, 81.7 lakh students | ₹6,318 cr (first release) | — | NIE, PRS |
| Rajiv Gandhi Kisan Nyay | CT | 2020-21 | Bhupesh Baghel, CM, INC | paddy bonus | — | ₹5,100 cr | CG 2023: BJP 54/90 | PRS |
| Pongal ₹2,500 + kit | TN | Jan 2021 | Edappadi K. Palaniswami, CM, AIADMK | ₹2,500 + kit | 2.6 cr card families | — | TN 2021: DMK 133/234 | NIE, IE |
| Dalit Bandhu | TG | Aug 2021 | K. Chandrasekhar Rao, CM, TRS | ₹10 lakh grant per SC family | pilot | — | Huzurabad 2021: BJP won | NIE, TOI |
| Two free LPG cylinders | GJ | Oct 2022 | Bhupendra Patel, CM; Kanu Desai, FM, BJP | 2 cylinders/yr | ~38 lakh PMUY families | ₹650 cr | GJ 2022: BJP 156/182 | IE, TOI |
| Ladli Behna | MP | Jun 2023 (first transfer) | Shivraj Singh Chouhan, CM, BJP | ₹1,000 → ₹1,250 (→ ₹1,500 Nov 2025) | ~1.25 cr women | ₹8,000 cr + ₹5,000 cr | MP 2023: BJP 163/230 | IE, NIE |
| Anna Bhagya cash | KA | Jul 2023 | Siddaramaiah, CM, INC | ₹170/member/month | 4.42 cr people (IE) | ~₹10,092 cr (planned rice cost) | — | TOI, IE, DH |
| Gruha Lakshmi | KA | Aug 2023 | Siddaramaiah, CM, INC | ₹2,000/month | 1.15 cr women | — | — | IE |
| Rythu Bandhu rabi instalment halted | TG | Nov 2023 | K. Chandrasekhar Rao, CM, BRS | — | — | — | TG 2023: Congress 64/119 | TOI |
| Kalaignar Magalir Urimai Thogai | TN | Sep 2023 | M.K. Stalin, CM, DMK | ₹1,000/month | 1.06 cr at launch; ~1.31 cr by 2026 | ₹12,000 cr | TN 2026: TVK 108/234 | NIE, TOI |
| Mahtari Vandan | CT | Mar 2024 | Narendra Modi (PM, launched) | ₹1,000/month | ~70 lakh women | ₹3,000 cr (2024-25) | LS 2024: BJP 10/11 | PIB, PRS |
| Namo Shri | GJ | Mar 2024 (GRs) | — | ₹12,000 per pregnancy | 11 categories | ₹750 cr | LS 2024: BJP 25/26 | TOI |
| Ladki Bahin (budget) | MH | Jun 2024 | Ajit Pawar, DyCM & FM, NCP; Eknath Shinde, CM, Shiv Sena | ₹1,500/month | 80 lakh paid by 15 Aug 2024 | ₹46,000 cr | MH 2024: Mahayuti 235/288 | TOI |
| Free power for pumps ≤ 7.5 HP | MH | Jun 2024 | Ajit Pawar, DyCM & FM, NCP | free power | 44.61 lakh farmers | — | MH 2024: Mahayuti 235/288 | TOI |
| Welfare pension ₹2,000; women's aid ₹1,000 | KL | Oct 2025 | Pinarayi Vijayan, CM; K.N. Balagopal, FM, CPI(M) | ₹2,000/month; ₹1,000/month | ~62 lakh (NIE) / ~49 lakh (IE); 31.34 lakh women | ₹13,000 cr; ₹3,800 cr | KL 2026: UDF 102/140 | IE, NIE, Frontline |

## Items dropped and why

- **AP DBT freeze before the May 2024 poll** (ECI stop, High Court orders): only The Hans India reported the
  court orders, and its URL could not be resolved. Dropped.
- **Telangana Kalyana Lakshmi and Aasara pensions (2014)**, **Mahalakshmi free bus (2023)**, **Karnataka Shakti
  ridership**, **TN Pudhumai Penn (2022)**: official portals did not respond and no resolvable news link was found.
- **Karnataka Bhagyalakshmi (2006)**, **Gujarat Chiranjeevi (2005)**, **Vahli Dikri (2019)**, **Goa Ladli Laxmi
  (2012)**, **TN free bicycles (2001)**: TOI sitemap slug search found nothing; no other fetchable source.
- **Farm-loan waivers of Maharashtra 2017 (Fadnavis), Karnataka 2017 (Siddaramaiah), MP 2018 (Kamal Nath)**: the PRS
  analyses fetched do not state the size or terms; no news link resolved in time.
- **TN free colour TV total cost**: TOI's 2026 recap says ~₹3,600 crore and "nearly 45 lakh households"; a 2012 NIE
  headline says ₹2,267 crore (article URL not found). The 45 lakh figure conflicts with the state's own 14.6 lakh by
  July 2007 plus a 30-lakh third phase, so no cost/total item was written.
- **The Hindu, "Now silent on Bihar, EC had halted two welfare schemes in TN" (Nov 2025)**: URL not resolvable without
  The Hindu's archive sitemaps, which its robots.txt disallows.
- **Kerala COVID food kits before the 2021 poll**: not sourced in time.
- **Gujarat 2017 poll-date gap and "sops" claim**: an elections-lane topic (ECI timing), not a transfer.

## Contested or discrepant figures (reviewer: please double-check)

- **Kerala pension reach (hdb242)**: The Indian Express says ~49 lakh; the New Indian Express says ~62 lakh. The item
  does not use either number.
- **Ladli Behna age band (hdb232)**: the June 2023 IE report says 23–60; its October 2023 report says 21–60. The item
  follows its own source (June, 23–60).
- **Mahayuti seats (hdb240, 241)**: 235 of 288 including smaller allies (Wikipedia infobox); the three main parties
  won 230 (BJP 132, Shiv Sena 57, NCP 41). Both breakdowns are in the item.
- **Karnataka 2018 Congress seats (hdb219)**: infobox says 80 (often reported as 78 on counting day).
- **TN Re 1 rice (hdb210)**: the TOI headline says "from Sept 5", the body says launch on 15 Sept; gapDays uses the
  announcement date (30 Aug 2008).
- **MH 2019 waiver window (hdb226)**: PRS says loans taken April 2015–March 2019; TOI (21 Dec 2019) says loans taken
  till 30 Sept 2019. The item follows PRS.
- **Pasupu-Kumkuma reach (hdb221)**: ~93 lakh women per the petition quoted by IE; the state said 97.94 lakh SHG
  members got ₹9,794 crore. Both are given, attributed.
- **DSSS launch year (hdb200)**: 2002 per The Goan; some summaries say 2001-02.
- **Griha Aadhar launch year (hdb217)**: 2013 per The Goan.
- **"Revdi"/"poll sop"/"bonanza" wording**: appears only as quoted, attributed characterisation (TOI's "Poll sop"
  headline, The Goan's "poll bonanza", IE on PM Modi's "revdi culture" remark), never as the item's own description.

## Stale-risk facts (re-check before the next release)

- Goa's planned ₹500 rise in DSSS and Griha Aadhar (announced Sept 2026, not yet notified) — hdb200, hdb217.
- Ladli Behna monthly amount (₹1,500 since Nov 2025) — hdb233 outcome.
- Karnataka Anna Bhagya rice-versus-cash status (rice resumed Feb 2025) — hdb234.
- TN KMUT coverage (~1.31 crore) and scheme names under the new TVK government (it has already rebranded the laptop
  scheme) — hdb212, hdb237.
- Kerala pension and women's aid under the UDF government elected in May 2026 — hdb242, hdb243.

## Existing items in other lanes that belong in the distribution mode (retro-tags suggested)

All are in `states-west-south.mjs` unless noted; none currently has `tags`. Items marked † would also fit
`pre-election`, which needs a `poll` block added by the owning lane.

| id | subject | suggested tags |
|---|---|---|
| hst204 | Namo Lakshmi Yojana (GJ) | distribution |
| hst207 | Ladki Bahin amount (MH) † — poll MH 2024, gap 145 days from 28 Jun 2024 | distribution, pre-election |
| hst208 | Ladki Bahin verification deletions (MH) | distribution |
| hst218 | Griha Aadhar amount (GA) | distribution |
| hst220 | Ladli Behna 2026-27 allocation (MP) | distribution |
| hst229 | Mahtari Vandan amount (CT) | distribution |
| hst230 | Godhan Nyay Yojana (CT) | distribution |
| hst232 | CG subsidies and cash transfers share of receipts | distribution |
| hst237 | Karnataka five guarantees cost | distribution |
| hst238 | CAG on Karnataka guarantees vs infrastructure | distribution |
| hst248 | KMUT ₹5,000 before the 2026 poll (TN) † — poll TN 2026 (23 Apr), result TVK 108/234 | distribution, pre-election |
| hst249 | CM's Breakfast Scheme (TN) | distribution |
| hst250 | Amma Canteens (TN) | distribution |
| hst257 | NTR Bharosa pensions (AP) | distribution |
| hst258 | Talliki Vandanam (AP) | distribution |
| hst263 | Rythu Bandhu → Rythu Bharosa (TG) | distribution |
| hst265 | Telangana six guarantees cost | distribution |
| hfw009 (forwards.mjs) | Ladli Behna deepfake before MP 2023 † | distribution, pre-election |

## Verification

An adversarial check on 26 Sep 2026 by a second agent, independent of the author. Every item's `sourceUrl` and every
URL in `sources` (94 in all after the fixes) was fetched with curl and read against the stem, the correct option, every
figure, date, `enactedBy` entry and `poll` field. Every URL returned HTTP 200. Weekdays given in sources ("on Friday",
etc.) were checked against the calendar, and every `gapDays` was recomputed. The validator is **OK** (45 items;
difficulty 16/15/14; answers 11/14/10/10). A whole-bank `checkBank` run that includes this unregistered lane finds no
duplicate ids or question text, and `node --test tests/hisaab-*.test.mjs` passes 40/40.

**Result: 45 checked, 0 dropped, 21 fixed, 24 confirmed unchanged.** Ids are unchanged. Where the tables above
disagree with this section, this section supersedes them.

### Fixes

| id | problem found | fix |
|---|---|---|
| hdb200 | The launch year is contested: The Goan (2026) says 2002, TOI (21 Dec 2012) says "started in 2001". The old "which year?" item hinged on that. | Rewritten as "began under which chief minister?". The answer is Manohar Parrikar (BJP), CM from 24 Oct 2000 to 2 Feb 2005, which covers both dates; The Goan says both schemes were "conceptualised during the tenure of" Parrikar. The distractors are other Goa CMs (Kamat, Sawant, Faleiro), allowed by §4b.1, and none held office in 2001–02. TOI 2012 added. The outcome now gives Sawant's stated reason for the ₹500 rise (inflation) next to The Goan's "poll bonanza". |
| hdb201 | The outcome said officials put "the new schemes" at ₹3,000 crore. That TOI figure (26 May 2003) is for schemes announced *before* the Mahanadu, not the farm package. | The outcome and explanation now say the figure came from TOI two days before the Mahanadu. |
| hdb203 | **Author flag resolved.** TOI, "Shinde goes one up on Thackeray" (5 Aug 2004), says CM Sushilkumar Shinde announced free power "on Wednesday" (4 Aug 2004) for over 23 lakh farmers and quotes him: "not a political decision" but drought relief. | Added as a source, and Shinde's reply added to the explanation. `gapDays` 70 (4 Aug → 13 Oct 2004). The stem now says "Ten weeks before". The irrelevant job-freeze story and the Shinde Wikipedia page were removed from sources. |
| hdb205, hdb213 | Their outcomes repeated "14.6 lakh sets", the answer to hdb206. | The outcomes were reworded without that figure. hdb213's explanation and outcome were rebalanced so the "7 lakh cancelled" fact appears once. |
| hdb207 | NIE (2021) says "close to Rs 1 lakh" at 21, while the 2007 launch release (UNI) says "more than Rs 1 lakh". | The stem now asks what the state *said at the May 2007 launch*; the answer is unchanged. |
| hdb212 | The distractor "₹1,100 crore" is a real allocation for the scheme (its 2015-16 figure, per the same NIE article), so it could be argued true. | Replaced with "₹2,456 crore". |
| hdb214 | No fetched source named Chouhan as the announcer. The explanation's "extra ₹1,000 crore a year" is not what TOI says: a spokesman put the spending at ₹1,000 crore, and IE (Apr 2013) gives a ₹360 crore extra subsidy. | Added IE, "Polls on mind, Chouhan says will provide wheat at Re 1 per kg" (21 Apr 2013): Chouhan announced it at Dhar on 20 Apr 2013 and called it "a step ahead of the Centre's food security bill". The cost is now attributed ("the state said it would spend ₹1,000 crore of its own funds"). |
| hdb217 | **Author flag resolved, and the item changed.** "Launched in 2013" is contestable. TOI (7 Dec 2012) says Parrikar announced Griha Aadhar in his March 2012 budget speech and it was "formally launched on October 2" 2012. The first sanction letters went out on 4 Jan 2013 (TOI, 4 Jan 2013). | Rewritten to ask the opening monthly rate: ₹1,000 (TOI, Jan 2013). hst218 already asks the 2026 rate (₹1,500), so this is a different angle. `enactedBy` is now sourced; The Goan was kept as a secondary source. |
| hdb219 | The outcome said the May 2018 poll gave the Congress 80 of 224. Only 222 seats were polled on 12 May; the Congress won 78 at the 15 May count and reached 80 after deferred and by-polls. | Reworded: 104 / 78 / 37 of 222 counted on 15 May. |
| hdb220 | TN voted for only 38 seats on 18 Apr 2019; Vellore polled in August. | The outcome and `poll.result` now say so. The 38-of-39 total and `gapDays` 66 are unchanged. |
| hdb221 | "About 93 lakh women" is the petitioner's figure, quoted by IE, but read as fact. | Now attributed to the petition. The ECI ruling, the options and the result were confirmed. |
| hdb226 | The outcome added the ₹15,000 crore 2019-20 waiver allocation (earlier schemes) into this scheme's "₹22,000 crore" spending. | Replaced: PRS shows ₹7,000 crore for the scheme in FM Ajit Pawar's 2020-21 budget. Added the opposition's response (Fadnavis walked out over the promised full waiver; TOI, 21 Dec 2019). |
| hdb230 | TOI says the Congress got "less than 1.46 per cent", not 1.46%. | Now "under 1.5%, per TOI". |
| hdb231 | `enactedBy` listed CM Bhupendra Patel, but neither source says he announced it. Both name minister and spokesperson Jitu Vaghani and FM Kanu Desai. | `enactedBy` is now Vaghani and Desai. Added the government's own framing, that the VAT cut was a "Diwali gift", beside TOI's "just ahead of the assembly elections". |
| hdb236 | **Sensitive-item check.** The ECI finding is against an identifiable office-holder, but the item had no status line, and the BRS's reply (§2.3) was missing. | Added a `status` line: an ECI withdrawal and Model Code finding (27 Nov 2023), a regulatory finding and not a criminal case, contested by the BRS. Added TOI, "EC halts Rythu Bandhu…" (28 Nov 2023): permission was given on 24 Nov on no-publicity conditions; the BRS told the ECI the minister had not publicised it and called the Congress anti-farmer. The person is still unnamed. |
| hdb237 | The 2026 result relied on Wikipedia only. | Added NIE (5 May 2026), which confirms the TVK's 108 seats. |
| hdb239 | **Author flag resolved.** IE, "7 new municipal corporations in Gujarat's Rs 3.32-lakh cr Budget" (3 Feb 2024), says FM Kanu Desai announced Namo Shri, with ₹750 crore, in the 2 Feb 2024 budget. | `enactedBy` added (Kanu Desai, BJP). Per §3a, `gapDays` counts from the announcement, so it is now 95 (2 Feb → 7 May 2024) instead of 52. The outcome still notes the 52 days from the 16 Mar orders to polling. |
| hdb240 | **Sensitive-item check.** "TOI noted the scheme was patterned on MP's Ladli Behna" is not in either cited TOI page. | Removed; replaced with the sourced eligibility (women aged 21–60, ₹1,500 a month). The distractors (Fadnavis, Shinde, Mungantiwar) are allowed by §4b.1 and none presented the June 2024 budget. |
| hdb242 | NIE gives ₹13,000 crore as an estimate ("could account for"), not a costing. | Now "an estimated ₹13,000 crore". The Kerala 2026 Wikipedia page was added as a secondary source for the 9 Apr 2026 poll date. |
| hdb244 | "More than ₹1 lakh" at 21 contradicts its own source (NIE: "close to Rs 1 lakh"). | Now "close to ₹1 lakh … NIE reports". |

### Confirmed unchanged (source read, facts match)

hdb202 (TOI 15 May 2004; 14 May 2004 was a Friday), hdb204 (31 May 2004 was a Monday; ₹910 crore; 1.2 crore
families), hdb206, hdb208 (16 Jan 2008 was a Wednesday; `gapDays` 303), hdb209, hdb210 (30 Aug 2008 was a Saturday;
`gapDays` 256), hdb211, hdb215, hdb216, hdb218 (10 May 2018 was a Thursday; `gapDays` 211), hdb222, hdb223, hdb224,
hdb225, hdb227, hdb228, hdb229 (`gapDays` 92 from the 4 Jan 2021 first payment), hdb232 (`gapDays` 160), hdb233,
hdb234, hdb235, hdb238 (PIB 10 Mar 2024; `gapDays` 40), hdb241 (`gapDays` 145), hdb243.

- **hdb223:** PRS lists Arogyasri at ₹1,740 crore, so that distractor is verifiably smaller than Pension Kanuka's
  ₹15,747 crore.
- **hdb243:** 31.34 lakh AAY/PHH women is confirmed by NIE and IE; ₹3,800 crore by IE.

### Author's sensitive and unverified list: outcome

- **hdb209:** Confirmed. "Poll sop" (headline) and "neatly appropriating" are TOI's words, attributed. The "who
  pioneered" distractors are former CMs, allowed by §4b.1, and none pioneered ₹2 rice (NTR did).
- **hdb230:** Confirmed neutral. The TOI result story has analysts' quotes with caste references; the item does not use
  them and makes no causal claim.
- **hdb233:** Confirmed. IE (14 Oct 2023) reports PM Modi's "revdi culture" attacks on opposition states and that party
  leaders in Delhi found the scheme hard to defend; both are attributed. `gapDays` is still left out because the date
  of the ₹1,250 hike is not in a fetched source.
- **hdb221:** `gapDays` is still left out because no fetched source gives the February 2019 launch date.
- **hdb219:** Resolved: 78 on counting day, 80 after later polls.
- **hdb240/241:** 235 of 288 for the Mahayuti is confirmed by the Wikipedia infobox and prose.
- **hdb212:** ₹6,456.44 crore is quoted from "official sources" by NIE, and the item says so.
- **hdb242:** Reach is still given as no number (IE says 49 lakh; NIE and TOI (FM Balagopal) say 62 lakh).

### Statuses and dates to re-check

hdb236's `status` (ECI, Nov 2023) is final unless litigated; nothing newer was found. The stale-risk list above
(Goa's ₹500 rise, Ladli Behna rate, Anna Bhagya rice/cash, KMUT under the TVK government, Kerala pensions under the
UDF) still applies.
