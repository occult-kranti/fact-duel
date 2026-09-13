# FACT//DUEL — Numeric Backbone for the Seed Deck

**Status of the company, stated once and plainly:** FACT//DUEL is a private-beta web app with **no accounts, no server-side progression, 54 sample questions, zero users outside a private playtest, and zero revenue**. Progression is device-local, which means **we cannot currently measure D1/D7/D30 retention at all** — not "we haven't yet," but *cannot*, architecturally. Every number below is either a third-party benchmark or a plan built on one. **None of it is FACT//DUEL traction.** Where the deck needs a traction slide, the honest content is the milestone list in §4.4, not a metric.

DocSend's strongest negative signal is relevant here: *"VCs spend 80 percent more time evaluating the traction of companies that didn't raise money successfully"* ([DocSend](https://web.archive.org/web/20240302210508/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/), third-party estimate). A vague traction slide invites the inspection that kills the round. State zero, move on.

---

## 1. TAM / SAM / SOM — built bottom-up

### 1.0 Method

Per Paul Graham's definition, used literally: *"If there are x number of customers who'd pay an average of $y per year for what you're making, then the total addressable market, or TAM, of your company is $xy. Investors don't expect you to collect all that money, but it's an upper bound"* ([paulgraham.com/convince.html](https://paulgraham.com/convince.html), company-disclosure). So TAM and SAM carry **no activation discount** — every population member is counted at full ARPU. The activation, retention and conversion haircuts live entirely in SOM, where they belong.

Per a16z: *"we like seeing a bottoms-up analysis, which takes into account your target customer profile, their willingness to pay... By contrast, a top-down analysis calculates TAM based on market share and a total market size"* ([a16z, 16 More Startup Metrics](https://a16z.com/16-more-startup-metrics/)). Their failure case is the $1 toothbrush × 40% of China. We avoid it by never inventing a penetration percentage in TAM or SAM.

### 1.1 The ARPU input ($y) — two measured anchors, no invention

We use **annual revenue per monthly active user**, derived from two live comparables:

| Anchor | Arithmetic | Result | Source |
|---|---|---|---|
| Duolingo FY2025 (streak/XP/quest loop, subscription) | $1,037.6M revenue ÷ 133.1M MAU | **$7.80 / MAU / yr** | [SEC 8-K ex-99, Q4 FY25 shareholder letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm) — audited filing |
| MAG Interactive (owner of QuizDuel; ads + IAP quiz/word games) | $21.563M nine-month net sales ÷ 2.2M MAU = $9.80 per 9 months; × 12/9 | **$13.07 / MAU / yr** | [MAG Interactive Q3 2025/26 interim report](https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf) — company disclosure |

**Internal consistency check on the MAG figure:** ARPDAU 9.0 US cents × 365 days × 0.9M DAU = **$29.57M/yr**, against nine-month net sales annualised of $28.75M and a Q3 run-rate of $27.95M. The three routes agree within ~6%, so $13.07/MAU/yr is not an artefact.

**Caveat that must travel with this number:** MAG's net sales, DAU and MAU are **group-level across its whole portfolio**, not QuizDuel standalone. MAG does not break QuizDuel out. Treat $13.07 as "a listed casual quiz/word publisher's blended per-MAU economics," not "QuizDuel's ARPU."

**ARPU band used throughout: $7.80 – $13.07 per active user per year.**

### 1.2 The population input ($x) — counted, never estimated

| Bloc | Count | Source | Kind |
|---|---|---|---|
| US adults using a smartphone as a second screen, 2026 | **216.8M** (80.6% of US adults) | [EMARKETER](https://www.emarketer.com/content/second-screen-engagement-during-live-sports) | third-party estimate |
| North American adults in fantasy sports or sports betting, past 12 months | **90.3M** (of which 82.8M US = 31% of US adults) | [FSGA / Angus Reid 2026](https://members.thefsga.org/news/Details/new-fsga-research-details-growing-role-of-ai-prediction-markets-in-fantasy-sports-and-sports-betting-341850) | third-party estimate |
| US football (soccer) fans | **62M** (4th-largest market globally) | [Nielsen 2025 Global Sports Report](https://www.nielsen.com/news-center/2025/the-future-of-sport-nielsens-2025-report-reveals-growth-drivers/) | third-party estimate |
| Global cricket fans, ages 16–69 | **1,000M+** (plus 300M+ active participants 16+) | [ICC global market research](https://www.icc-cricket.com/media-releases/first-global-market-research-project-unveils-more-than-one-billion-cricket-fans) | governing-body disclosure, 2018 |

**Deliberately excluded from the arithmetic:** Nielsen's *"51% of people globally are fans of football"* is a percentage with no verified population denominator in our evidence base, so we do not convert it to a headcount. That omission makes TAM **narrower**, not wider — Europe and Latin America contribute zero to our TAM. Say so; it is a credibility asset.

**Also excluded:** the science-audience blocs (r/science 34.5M members; Kurzgesagt 25.5M subscribers and 3.85bn lifetime views; National Geographic 268M Instagram followers; 115.8M ASTC-network science-centre *visits* in 2024). These are followers, members and visits — **not people, and heavily overlapping with the sports blocs**. Adding them would be double-counting. Science is treated as a *content overlay that widens appeal within the same population*, not as additive audience. Sources in §6.

### 1.3 TAM

**TAM-A — servable-today definition (US, English, second-screen behaviour):**
```
216.8M people  ×  $7.80/user/yr  =  $1,691M
216.8M people  ×  $13.07/user/yr =  $2,834M
```
**TAM-A = $1.69bn – $2.83bn.**

**TAM-B — global ambition case (adds the cricket bloc):**
```
(216.8M + 1,000M) = 1,216.8M people
1,216.8M  ×  $7.80  =  $9,491M
1,216.8M  ×  $13.07 = $15,904M
```
**TAM-B = $9.49bn – $15.90bn.**

**TAM-B is directional only, and here is exactly why.** It applies a US/Nordic ARPU to a South Asian population. Newzoo's regional split contradicts that directly: Asia-Pacific generated **$95.0bn** of games revenue in 2025 against North America's **$54.0bn** ([Newzoo](https://newzoo.com/articles/global-games-market-2025), third-party estimate) — on a vastly larger population, i.e. APAC per-capita spend is a fraction of NA's. We have no verified APAC per-user ARPU, so we cannot apply a defensible haircut. **Put TAM-A on the slide; keep TAM-B in the appendix as an upper bound with this caveat attached.** TAM-A already clears YC's *"TAM >$1B if possible"* bar ([A guide to seed fundraising](https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising)).

### 1.4 SAM — what we can reach in three years

Constraints that define it: web-only distribution (no app-store presence), English-language, no accounts shipped yet, sports-and-science content niche. That maps to the **competitive North American sports audience**: people who already engage daily and already spend on sports products.

```
90.3M North American fantasy/betting adults (FSGA 2026)
90.3M × $7.80  =   $704.3M
90.3M × $13.07 = $1,180.2M
```
**SAM = $704M – $1.18bn.**

Two behavioural facts qualify this bloc as genuinely addressable rather than merely large, both from FSGA 2026: **66% of 13–20-year-old season-long fantasy players update lineups daily**, with an average starting age of 14 and a **median annual spend of $100**; and **51% of participants do both fantasy and betting** (up from 49%). This is a daily-habit, already-spending, competitively-motivated audience — the behavioural profile a 1v1 duel loop is built for.

Nesting note: TAM-A is US-only (216.8M) while SAM includes Canada (90.3M = 82.8M US + ~7.5M Canada). The ~7.5M Canadian overhang is a known, immaterial inconsistency; flagged rather than smoothed over.

### 1.5 SOM — **this is a plan, not a forecast**

**SOM is the Year-3 exit of the base-case plan in §4. It is a target we have chosen, derived from third-party benchmarks, with zero company data behind it. It is not a prediction of what will happen, and nobody should read it as one.**

Base-case Year 3 (full derivation in §4):
- **Revenue: $1.63M** (install-economics model) or **$0.42M** (subscription cross-check model) — the honest band is **$0.4M – $1.6M**
- **Steady-state MAU: ~106,000**

As a share of the markets above:
```
$1.63M ÷ $704.3M  (SAM low)  = 0.23%
$1.63M ÷ $1,180.2M (SAM high) = 0.14%
$1.63M ÷ $9,491M  (TAM-B low) = 0.017%
```
**SOM = 0.14% – 0.23% of SAM.** A seed-stage SOM that is a fraction of one percent of SAM is what an honest bottom-up model produces. Resist every instinct to round it up.

### 1.6 Top-down cross-check — and the gap

| Top-down category | 2025 size | Source | Kind |
|---|---|---|---|
| Second-screen sports apps | **$3.0bn** (→$3.5bn 2026, $17.1bn by 2036, 17.2% CAGR) | [Fact.MR](https://www.factmr.com/report/second-screen-sports-apps-market) | third-party estimate |
| Fan engagement | **$8.09bn** (→$9.79bn 2026, $20.94bn 2030 @ 20.9% CAGR; NA $2.89bn) | [The Business Research Company](https://www.thebusinessresearchcompany.com/report/fan-engagement-global-market-report) | third-party estimate |
| Fan engagement (rival vendor) | **$16.2bn** (2024) → $66.7bn 2034 @ 15.2% | [market.us](https://market.us/report/fan-engagement-market/) | third-party estimate |
| Game-based learning | **$6.23bn** → $17.82bn 2030 @ 23.4% | [MarketsandMarkets](https://www.marketsandmarkets.com/Market-Reports/game-based-learning-market-169115901.html) | third-party estimate |
| Game-based learning (rival vendor) | **$24.5bn** → $88.6bn 2034 @ 14.59% | [IMARC](https://www.imarcgroup.com/game-based-learning-market) | third-party estimate |
| Mobile games IAP | **$81.75bn** (+1.3% YoY) on 50.41bn downloads (−7.2%) | [Sensor Tower State of Mobile 2026](https://www.sensortower.com/blog/state-of-mobile-2026) | third-party estimate |
| Global games market | **$201.6bn** (+9.1%); mobile $113.3bn (+10.7%) | [Newzoo](https://newzoo.com/articles/global-games-market-2025/) | third-party estimate |

**Top-down centre of gravity for a category as close as we can get to ours: $3bn – $8bn.**

**Gap 1 — the vendors disagree with each other more than they disagree with us.** IMARC sizes game-based learning at **3.93×** MarketsandMarkets' figure for *the identical year*. market.us sizes fan engagement at **2.00×** TBRC's. When two paid research firms differ by 4× on the same market in the same year, neither number can discipline a business plan. This is the empirical case for bottom-up, and it belongs in the deck as one line.

**Gap 2 — our TAM-A sits *below* the top-down range; our TAM-B sits *above* it.** TAM-A ($1.69–2.83bn) is smaller than fan engagement ($8.09bn) because we count only US second-screen adults at *observed* per-user revenue, while the vendors count sponsorship, ticketing, merchandising and B2B platform spend we will never touch. TAM-B ($9.49–15.90bn) exceeds them because of the uniform-ARPU error described in §1.3. **The convergence is TAM-A, and it is the conservative number.**

**Gap 3 — the one that actually matters. Nobody is collecting this money in trivia today.** Sensor Tower's Q2 2025 US iOS estimates for the genuine Trivia genre:

```
Kahoot!             $38.5K/week peak (mid-June), falling to $28.2K by quarter end
Trivia Crack Premium ~$33K/week
GeoGuessr            $31K → $28.7K/week

Top three combined: $102.5K/week × 52 = $5.33M/year, gross, before Apple's 15–30% cut
Kahoot! alone:       $38.5K/week × 52 = $2.00M/year
```
Source: [Sensor Tower](https://sensortower.com/blog/2025-q2-ios-top-5-trivia%20games-revenue-us-604118ed241bc16eb8b8453a) — modelled estimates of gross consumer spend, not audited revenue.

**A $3–8bn "market" against $5.33M/year of observed top-three revenue on the largest single storefront is a ~1,000× gap.** Two readings, and the deck must present both:

- **Thesis reading:** the category is structurally under-monetised and under-built. Trivia Crack has **267,939,837 lifetime Android installs** yet grosses ~$33K/week on US iOS, and has abandoned duels entirely — its Play listing is now titled *"Trivia Crack by The Floor"* and leads with a FOX TV tie-in ([Google Play](https://play.google.com/store/apps/details?id=com.etermax.preguntados.lite&hl=en_US&gl=US)). Demand is proven; the product has been abandoned.
- **Risk reading:** trivia audiences don't pay, and this is what the ceiling looks like. HQ Trivia, QuizUp and Trivia Royale all died with large audiences (§2.3).

**The reconciling evidence — the category monetises, just not as consumer trivia IAP.** Kahoot! collected **$146.0M in FY2022 at a 95% gross margin** via B2B/education subscriptions ([Q4 2022 report](https://kahoot.com/files/2023/02/4Q22_Kahoot_quarterly_report.pdf)). Duolingo collects **$1,037.6M** via a streak/XP/quest subscription habit — a loop mechanically identical to FACT//DUEL's — at a **9.03% MAU→paid conversion** ([SEC](https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm)). **Business-model implication: model FACT//DUEL on Duolingo's habit-subscription economics, not Trivia Crack's IAP economics.** That is what the §4 subscription cross-check tests.

---

## 2. Competitor comparison — real figures only

### 2.1 The scaled players

| Company | Status | Users | Money | Store signal | Sources |
|---|---|---|---|---|---|
| **Duolingo** (NASDAQ: DUOL) | Public | 58.7M DAU (+23% YoY), 140.6M MAU (+10%), 12.7M paid subs (+17%) @ 30 Jun 2026 → **9.03% MAU→paid**, 41.75% DAU/MAU | Q2 2026 rev **$298.5M** (+18%), bookings $289.1M, GM 72.6%, net income $33.2M, adj EBITDA $77.3M. FY2025 rev **$1,037.6M**, net income $414.1M. FY2026 guide: rev $1,207M, EBITDA $320M. Mkt cap **$6.72bn** @ $143.68 (11 Sep 2026) | — | [SEC Q2 FY26](https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm), [SEC FY25](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm) |
| **Kahoot!** | Private since **23 Jan 2024** (last trading day 22 Jan) | Marketing only post-privatisation: 10M educators, 14bn cumulative non-unique participants since 2013, 195 countries, 95%+ of Fortune 500, 600+ staff | Taken private at **NOK 35.00/share, NOK 17.2bn** equity (492,836,049 shares; 53.1% premium) by Goldman Sachs AM + General Atlantic + KIRKBI + Glitrafjord. Last public: Q3 2023 rev $42.3M (+16%), 1.4M paid subs, $115M cash. FY2022 rev **$146.0M** (+60%), ARR $156M, adj EBITDA $30.3M, **95% GM**. Post-private **parent-only** Norwegian filings: FY2025 op. revenue **USD 112.824M** (FY24 99.775M, FY23 85.513M), equity USD 620.231M. Pricing **$19–$79/mo per presenter** ($228–$948/yr) | Android **100,263,409** installs, 4.7★/856,977; iOS US 4.56★/47,901 | [Oslo Børs 595365](https://newsweb.oslobors.no/message/595365), [Q2 2023](https://kahoot.com/files/2023/08/2Q23_Kahoot_quarterly_report.pdf), [Brønnøysund](https://data.brreg.no/regnskapsregisteret/regnskap/997770234), [kahoot.com/company](https://kahoot.com/company/), [kahoot360.com/pricing](https://kahoot360.com/pricing/) |
| **Trivia Crack** (etermax) | Live, **pivoted away from duels** | No verified user count (see §5.4). Etermax company-wide: ">150M active users annually", 180+ countries; Trivia Crack "#1 in trivia in 125 countries" | ~$33K/week US iOS gross (Sensor Tower est., Q2 2025). IAP $0.99–$199.99 + ads | Android **267,939,837** lifetime installs (Play internal; displayed 100M+), 4.5★/7,860,305; iOS US 4.60★/747,919. **Listing now "Trivia Crack by The Floor"**, leading with FOX Season 6 | [Google Play](https://play.google.com/store/apps/details?id=com.etermax.preguntados.lite&hl=en_US&gl=US), [etermax](https://www.etermax.com/news/15-years-leading-gamified-entertainment-with-knowledge-driven-experiences) |
| **Wayground** (ex-Quizizz) | Live; rebranded **24 Jun 2025** | 150+ countries, 90% of US schools (self-reported) | **$31.5M Series B** (Tiger Global, Jun 2021); **$44M** disclosed total. **No company-confirmed valuation** — the "$300M" is a single unattributed TechCrunch aside | iOS 4.75★/41,871; Android 10M+ installs, 4.7★/220K. **Both last updated 14 Nov 2025 — 10 months stale** | [PR Newswire](https://www.prnewswire.com/news-releases/quizizz-gains-momentum-raises-31-5-million-to-motivate-every-student-301322655.html), [rebrand](https://www.prnewswire.com/news-releases/quizizz-becomes-wayground-announces-new-ai-and-curriculum-supports-302489367.html) |
| **QuizDuel** (MAG Interactive, listed) | Live, **shrinking** | Group 9-mo avg **0.9M DAU (−14% YoY)**, **2.2M MAU (−13%)**; DAU/MAU 40.9% | Q3 (Mar–May 26) net sales **$6.988M** (+9% USD); 9-mo **$21.563M** (+13% USD); **ARPDAU 9.0¢** (+31%); ≈$28.8M annualised | US iOS **3.51★ / 78 ratings**; Germany 2.27★/7,477; Sweden 2.55★/837 | [MAG Q3 25/26](https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf), [iTunes lookup](https://itunes.apple.com/lookup?id=1484354626&country=de) |
| **Sporcle** | Private, live | **6,819,542,349** lifetime quizzes played (live counter, 13 Sep 2026); 1M+ community quizzes; 1M+ played daily; 250,000+ live trivia nights since 2009; founded 30 Jan 2007 | Sporcle Orange **$3.99/mo or $43.99/yr** individual; **$6.99/mo or $74.99/yr** family (4 accounts). Bought Stump! Trivia assets for **$1.4M cash** (Jan 2020, ~400 events/week) | Android 100K+ installs | [sporcle.com/about](https://www.sporcle.com/about/), [memberships](https://www.sporcle.com/memberships/), [SEC 8-K](https://www.sec.gov/Archives/edgar/data/748592/000149315220000627/form8-k.htm) |
| **Blooket** | Private, bootstrapped, **zero disclosed figures** | Similarweb estimate: **20.3M visits** over 3 months to Aug 2026; #1,651 global, #23 US Education; 72.26% US; 8.63 pages/visit; **7m01s avg duration** | None published | — | [Similarweb](https://www.similarweb.com/website/blooket.com/) |
| **Jackbox** | Private | **826M+ player joins** since Dec 2022 (press-release figure only; press kit separately claims "over a billion user sessions" since Nov 2014) | None published | — | [press coverage](https://cogconnected.com/2026/05/jackbox-party-pack-12-brings-its-chaotic-fun-on-all-major-platforms-later-this-year/) |
| **Jeopardy! World Tour** (Uken) | Live | — | IAP $0.99–$99.99 + ads | Android **5,177,147** installs, 4.4★/169,403; iOS 4.35★/87,580, **last updated 20 Oct 2025** | [Google Play](https://play.google.com/store/apps/details?id=com.sonypicturestelevision.jeopardy2&hl=en&gl=US) |
| **Psych!** (Warner Bros.) | Android-maintained, **iOS abandoned** | — | IAP $0.99–$19.99 | Android 5M+, 64,151 reviews, updated 26 May 2026; **iOS untouched since 25 Aug 2023**, 4.32★/20,930 | [Google Play](https://play.google.com/store/apps/details?id=com.wb.goog.ellen.psych&hl=en_US&gl=US) |

### 2.2 The live 1v1 vacuum — the single most important competitive fact

Every app currently marketing itself as *live 1v1 trivia* is negligible:

| App | Downloads | Reviews | Last update |
|---|---|---|---|
| **Quizion: 1v1 Trivia Battles** (`com.quizion.app`) | **10+** | none displayed | 13 Aug 2026 |
| **TRIVIA GO! Live 1v1 Quiz Game** (`live.trivia`, Sorbet Live) | **10K+** | 4.5★ / 138 | **22 May 2025** |

Source: [Google Play](https://play.google.com/store/apps/details?id=com.quizion.app&hl=en_US), verified 13 Sep 2026.

Set against: Trivia Crack (267.9M installs) has pivoted to a TV tie-in; QuizDuel is shrinking 13–14% YoY with a 3.51★/78-rating US presence; Wayground's apps have been stale for 10 months; Psych!'s iOS build has been stale for three years. **The 1v1 duel format has an installed-base history in the hundreds of millions and essentially no maintained incumbent.** That is the competition slide — and it is the honest one, because the same evidence explains *why* (§2.3).

### 2.3 The graveyard — why the vacuum exists

| Product | Peak | Capital | End | Sources |
|---|---|---|---|---|
| **HQ Trivia** | **2.38M concurrent players** (28 Mar 2018); ~15M all-time installs (Sensor Tower est.) | >$15M raised; SEC Form D shows $15,000,001 offered / $12,539,999 sold to 6 investors, Founders Fund lead, Cyan Banister director | Downloads fell to **67,000/month by Jan 2020 — 3.35% of the ~2M/month Feb 2018 peak**. Shut 14 Feb 2020, 25 staff. Relaunched 29 Mar 2020, last game 17 Nov 2022, delisted from stores 5 Aug 2023 | [TechCrunch](https://techcrunch.com/2020/02/14/hq-trivia-shuts-down/), [SEC Form D](https://www.sec.gov/Archives/edgar/data/1734125/000173412518000001/xslFormDX01/primary_doc.xml) |
| **QuizUp** (1v1 trivia) | "On track to pass 20 million users" (company, 19 May 2014 — a 6-month registration milestone, **not a peak**); 1bn+ matches across 230 countries (Mar 2014) | ~$32.4M equity per SEC Form Ds | Sold to Glu Mobile 19 Dec 2016 for cancellation of **$7.5M face value** of convertible notes — **Glu booked fair value at $3.2M, zero goodwill**. Removed from App Store 20 Jan 2021; discontinued 22 Mar 2021 | [Glu 10-K](https://www.sec.gov/Archives/edgar/data/1366246/000155837017001621/gluu-20161231x10k.htm), [Glu 8-K](https://www.sec.gov/Archives/edgar/data/1366246/000155837016010604/gluu-20161215x8k.htm) |
| **Trivia Royale** (Teatime Games, by QuizUp's founder) | **2.5M downloads in ~3 weeks** from 17 Jun 2020 launch; **45% D1 iOS retention**; ~30 min avg daily use — on a launch budget **under $500,000** (~40% to TikTok influencers) → **blended ≤$0.20 per download** | $9,155,139 + $1,499,913 per SEC Form Ds | Announced closure **23 Feb 2021** — 8 months after launch. All 16 staff let go. Revenue insufficient, funding talks collapsed | [TechCrunch](https://techcrunch.com/2020/07/10/how-thor-fridrikssons-trivia-royale-earned-2-5m-downloads-in-3-weeks/), [SEC Form D](https://www.sec.gov/Archives/edgar/data/1717682/000171768218000001/primary_doc.xml) |

**The lesson the deck must show it has absorbed: Trivia Royale proves trivia acquires users almost free (≤$0.20 blended) with elite D1 (45%). It died anyway, in eight months.** Distribution was never the binding constraint in this category — **monetisation and long-tail retention were.** Any FACT//DUEL narrative that leads with "we'll go viral" is arguing the case that is already settled and ignoring the case that killed everyone.

### 2.4 Adjacent comparable — competitive-play economics

**Skillz** (NYSE: SKLZ) is the cleanest public read on head-to-head competitive mobile:

| | FY2021 (peak) | FY2025 |
|---|---|---|
| Revenue | $380.2M | **$104.5M** (+12.5%) |
| Paying MAU | 513,000 | **141,000** |
| Monthly ARPPU | $61.75 (derived: $380.154M ÷ 513,000 ÷ 12) | **$61.70** (stated) |
| Net loss | −$187.9M | **−$70.4M** (adj EBITDA −$50.5M) |
| Cash | — | $194.5M vs $129.7M debt; cash down $77.4M on the year |

Sources: [SEC FY22 8-K ex-99.1](https://www.sec.gov/Archives/edgar/data/1801661/000180166123000003/ex991_fy22q4-8xkxearningsr.htm), [SEC FY25 8-K ex-99.1](https://www.sec.gov/Archives/edgar/data/1801661/000180166126000019/q425skillzex991-earningsre.htm).

Two readings worth one line each: **ARPPU held at ~$62/month across four years while the paying base fell 73%** — competitive-play users monetise extraordinarily well and churn extraordinarily hard. Skillz also won a **$42.9M jury verdict** against AviaGames (9 Feb 2024) for willful patent infringement, with trial evidence that AviaGames ran bots ("Cucumbers," "Guides") against paying humans in cash games ([SEC 10-K](https://www.sec.gov/Archives/edgar/data/1801661/000180166124000100/sklz-20231231.htm)) — a standing reminder that in 1v1 competitive products, **opponent integrity is a legal and existential issue, not a feature**. FACT//DUEL should have an answer for "is my opponent real?" before it has an answer for "how do we monetise?"

---

## 3. Benchmarks — casual mobile games, 2025–26

### 3.1 Retention — GameAnalytics, 16,000+ mobile games, 9 regions, iOS+Android, ≥1,000 MAU, calendar year 2025

| Percentile | D1 | D7 | D30 |
|---|---|---|---|
| **Median (P50)** | ~22% | just under 4% | **0.68 – 0.79%** |
| P75 | just above 30% | 6–7% | 1.6 – 1.8% |
| P90 | ~40% | 11–12% | — |
| P99 | 64–68% | >25% (peaking above 28%) | 13–15% |
| **North America (P50)** | **23.28%** | **4.97%** | **1.18%** |
| Oceania (P50) | 25.63% (rank 1) | 5.60% (tied rank 1) | 1.39% (rank 1) |

Source: [GameAnalytics 2026 Mobile & PC Gaming Benchmarks](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks) — third-party estimate, published 24 Aug 2026. NA ranks 2nd on D1 and D30; **3rd on D7**, behind Africa and Oceania (both 5.60%).

**The structural fact this implies, and it should be a slide:** at median D30 of ~0.7%, a game's MAU is *almost entirely its current month's new installs*. Modelled in §4.2: at base-case scale, the retained resident base is **5,900 of 105,900 MAU — 5.6%**. **Retention is not a metric in this category; it is the entire business.**

### 3.2 Sessions — same source, same sample

| | Median (P50) | North America | Top 1% (P99) |
|---|---|---|---|
| Session length | 3.1 – 3.5 min | 3.64 min | 22+ min |
| Sessions/day | 3.8 – 3.9 | 4.23 | 12+ |
| Daily playtime | ~12 min | **14.45 min** (highest region) | 94+ min |

A 1v1 duel is a natural 3–4 minute unit — dead-on the median session length. That is a design argument, not a traction claim.

### 3.3 Monetisation — AppsFlyer, *The State of App Monetization 2026*, data Jan 2025 – Mar 2026

| Metric | Value |
|---|---|
| Casual games — D90 **IAP ARPU** (per install) | **$1.34** |
| Casual games — D90 **ARPPU** (per payer) | **$7.26** |
| Casual games — D90 **IAA ARPU** (ad revenue per install) | **$0.55** |
| Casual total D90 revenue per install | **$1.89** |
| North America gaming — install → **first-time payer** (30d) | **11.14%** one-time / **5.08%** repeat |
| Casino gaming — install → first-time payer | 4.95% / 3.01% repeat |

Source: [AppsFlyer](https://www.appsflyer.com/resources/reports/app-marketing-monetization-report/) — third-party estimate.

**Derived, with a caveat:** $1.34 ÷ $7.26 = **18.46% implied casual D90 payer rate**. This is *arithmetic on two published figures*, not a published benchmark — AppsFlyer's ARPU and ARPPU may rest on different samples and windows, and it sits well above the 11.14% NA 30-day figure. We use 18.46% only as the **optimistic-case ceiling** in §4 and label it as derived.

**Comparable conversion anchor from a filing:** Duolingo converts **9.03% of MAU to paid subscribers** ([SEC Q2 FY26](https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm)) — audited, and the closest analogue to a habit-subscription model. FY2025: 9.17%.

### 3.4 ARPDAU — **we have no verified genre benchmark**

The commonly-circulated bands ($0.15–$0.50 hybrid-casual / $0.03–$0.08 hypercasual / $0.01–$0.05 ads-only casual) **failed verification as citation laundering** (§5.1). The only ARPDAU figure in our evidence base that comes from a reporting company:

| Source | ARPDAU | Period |
|---|---|---|
| **MAG Interactive** (QuizDuel, Wordzee et al.) — group | **9.0 US cents** (+31% YoY) | 9 months, Sep 2025 – May 2026 |
| MAG Interactive — group | 8.8 US cents (+24% YoY) | Q3, Mar–May 2026 |

Source: [MAG Q3 2025/26 interim report](https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf) — company disclosure. **Use this and only this.** Do not put a genre ARPDAU range in the deck.

### 3.5 Store listing conversion — **the claimed figures were wrong; here is what verification found**

The claim that trivia converts *above* average on stores (8.2% iOS / 20.4% Android vs 3.2% / 14.3% casual) was **traced and refuted**. AppTweak's actual published US calendar-2025 figures, pulled from its underlying chart data during verification:

| Category | iOS page-view → install | Google Play page-view → install |
|---|---|---|
| **Games – Trivia** | **5.2%** — *lowest of ~38 categories* | **19.8%** |
| Games – Casual | **34.1%** | 11.4% |
| Games – Puzzle | 35.7% | — |
| Games (all) | 26.7% | 19.9% |
| All-category average | 8.56% | 16.15% |
| iOS impression → install | Trivia **2.60%** / Casual 1.10% | — |

Source: [AppTweak](https://www.apptweak.com/) conversion benchmarks, US, CY2025 — **vendor-measured estimate, established during our own verification pass, not from the original claim.** Flagged for re-confirmation in §5.2.

**What this actually means for FACT//DUEL, and it is favourable:** trivia converts *worst of all categories* on iOS store listings and roughly *at par* on Google Play. **Being web-first sidesteps the single worst funnel in the category** — the iOS product page. That is a real strategic argument, but it must be stated as "AppTweak estimates," never as fact, and it does not transfer automatically: see §5.14.

### 3.6 CAC — **no verified 2025–26 benchmark exists in our evidence base**

We have exactly one sourced acquisition data point, and it is six years old and from a company that died:

```
Trivia Royale, Jun–Jul 2020:
  <$500,000 launch budget (≈40% = $200,000 to TikTok influencers)
  2,500,000 downloads in ~3 weeks
  → blended ≤ $0.20 per download
```
Source: [TechCrunch](https://techcrunch.com/2020/07/10/how-thor-fridrikssons-trivia-royale-earned-2-5m-downloads-in-3-weeks/). This is **blended cost per download including organic/viral**, not paid CPI, and Teatime Games shut down seven months later.

**Rather than invent a CAC, §4 inverts the question and reports the break-even blended cost per install implied by each scenario's own economics.** That number is pure arithmetic on sourced inputs and needs no benchmark.

---

## 4. Three-year scenarios — **plans, not predictions**

### 4.0 Read this before the numbers

a16z's anchoring rule: *"In most cases, your projections shouldn't be vastly different from the historical data. If MAUs have grown ~20% MoM for the past six months, it's probably unrealistic to assume 200% MoM growth for the next year"* ([a16z, The Insider's Guide to Data Rooms](https://a16z.com/the-insiders-guide-to-data-rooms-what-to-know-before-you-raise/), Justine Moore, 25 Aug 2022).

**We have no historical data to anchor to.** Zero users, zero months of cohort data. So the anchoring test cannot be passed, and by a16z's own guidance the right artifact at this stage is **not** a three-year model: they list *"Detailed 3- to 5-year financial projections"* among things they would **not** recommend including, wanting instead *"the key milestones you're looking to hit in the coming 12–18 months (and what you'll need to get there)."* YC concurs — *"Create detailed financials"* is on its explicit DON'T list ([A guide to seed fundraising](https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising)), and CRV puts *"financial models and supporting data... in the appendix or data room, not the core presentation"* ([CRV](https://www.crv.com/content/seed-funding-pitch-deck)).

**Therefore: §4.1–4.3 go in the appendix. §4.4 goes in the deck.** Every figure below is marked **(P)** for plan, per a16z's labelling rule; there are no actuals to mark **(A)**.

### 4.1 The model — identical across all three scenarios; only inputs change

```
Revenue(year) = Installs × [ payer_rate × ARPPU ] + Installs × IAA_per_install
Steady-state MAU = monthly_installs + ( monthly_installs × D30 ÷ monthly_churn )
```
`monthly_churn` of the retained base is set at **20%/month in all scenarios** — this is a **modelling assumption with no source**, held constant so it cannot flatter any scenario. ARPPU is held at the AppsFlyer casual D90 figure of **$7.26** in all three.

### 4.2 Inputs and arithmetic

| Input | Conservative | Base | Optimistic | Where it comes from |
|---|---|---|---|---|
| D30 retention | 0.68% | 1.18% | 1.70% | Global median low / **NA median** / global P75 — [GameAnalytics CY2025](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks) |
| Install → payer | 5.08% | 11.14% | 18.46% | NA repeat-payer / **NA one-time payer** / derived $1.34÷$7.26 — [AppsFlyer](https://www.appsflyer.com/resources/reports/app-marketing-monetization-report/) |
| ARPPU (D90) | $7.26 | $7.26 | $7.26 | AppsFlyer casual |
| Ad revenue per install | **$0.00** | $0.55 | $0.55 | Conservative assumes **no ad stack** — we are a web app with no mediation today |
| Monthly churn of retained base | 20% | 20% | 20% | **Assumption, unsourced** |
| **Installs Y1 / Y2 / Y3** | 25K / 90K / 250K | 75K / 350K / 1.2M | 200K / 1.0M / 4.0M | **Assumptions. No company data. These are the chosen inputs, not derived from anything.** |

**Revenue per install:**
```
Conservative:  0.0508 × $7.26 + $0.00  =  $0.3688
Base:          0.1114 × $7.26 + $0.55  =  $1.3588   (= $0.8088 IAP + $0.55 IAA)
Optimistic:    0.1846 × $7.26 + $0.55  =  $1.8902   (≡ AppsFlyer's own $1.34 + $0.55)
```
**Note what that last line means: even the optimistic case assumes only *median casual* per-install monetisation. All of the optimism sits in install volume, none in monetisation quality.**

### 4.3 Output — all figures **(P)**

**Conservative**
| | Installs | × $/install | Revenue | Monthly installs | Steady MAU | Rev/MAU/yr |
|---|---|---|---|---|---|---|
| Y1 | 25,000 | $0.3688 | **$9,220** | 2,083 | 2,154 | $4.28 |
| Y2 | 90,000 | $0.3688 | **$33,193** | 7,500 | 7,755 | $4.28 |
| Y3 | 250,000 | $0.3688 | **$92,202** | 20,833 | 21,542 | $4.28 |
| **3-yr** | **365,000** | | **$134,615** | | | |

**Base**
| | Installs | × $/install | Revenue | Monthly installs | Steady MAU | Rev/MAU/yr |
|---|---|---|---|---|---|---|
| Y1 | 75,000 | $1.3588 | **$101,907** | 6,250 | 6,619 | $15.40 |
| Y2 | 350,000 | $1.3588 | **$475,567** | 29,167 | 30,888 | $15.40 |
| Y3 | 1,200,000 | $1.3588 | **$1,630,517** | 100,000 | **105,900** | $15.40 |
| **3-yr** | **1,625,000** | | **$2,207,992** | | | |

**Optimistic**
| | Installs | × $/install | Revenue | Monthly installs | Steady MAU | Rev/MAU/yr |
|---|---|---|---|---|---|---|
| Y1 | 200,000 | $1.8902 | **$378,039** | 16,667 | 18,083 | $20.91 |
| Y2 | 1,000,000 | $1.8902 | **$1,890,196** | 83,333 | 90,417 | $20.91 |
| Y3 | 4,000,000 | $1.8902 | **$7,560,784** | 333,333 | 361,667 | $20.91 |
| **3-yr** | **5,200,000** | | **$9,829,019** | | | |

**Stress test 1 — subscription cross-check.** Model the same Year-3 MAU as a Duolingo-style habit subscription: MAU × 9.03% MAU→paid conversion ([Duolingo SEC](https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm)) × $43.99/yr ([Sporcle Orange individual price](https://www.sporcle.com/memberships/)):

| Scenario | Y3 MAU | × 9.03% = subs | × $43.99 | vs install model | Divergence |
|---|---|---|---|---|---|
| Conservative | 21,542 | 1,945 | **$85,570** | $92,202 | **1.08×** — the two models agree |
| Base | 105,900 | 9,563 | **$420,666** | $1,630,517 | **3.88×** |
| Optimistic | 361,667 | 32,658 | **$1,436,647** | $7,560,784 | **5.26×** |

**This is the most important honest finding in the model. The conservative case is genuinely conservative — two independent routes land within 8% of each other. The base case is not: it implicitly assumes we monetise ~3.9× better than a Duolingo-conversion-rate subscription at Sporcle's price would deliver at the same MAU, and the optimistic case assumes ~5.3×.** The base-case Year-3 band should therefore be presented as **$0.4M – $1.6M**, not $1.6M.

(Mechanical caveat: revenue-per-MAU looks high in the base/optimistic cases partly because high churn means annual installs are ~11× steady-state MAU — throughput, not intensity. Per-MAU revenue is not comparable across products with different churn, which is why the subscription cross-check matters.)

**Stress test 2 — comparables ceiling.** Base-case Y3 rev/MAU/yr of $15.40 exceeds both real anchors: MAG Interactive **$13.07** and Duolingo **$7.80**. Optimistic's $20.91 exceeds both by 1.6×–2.7×. **Any scenario that out-monetises Duolingo per active user should be labelled a ceiling, not a target.**

**Stress test 3 — break-even acquisition cost.** Because we have no verified CAC benchmark (§3.6), we invert:
```
Break-even blended cost per install (D90):
  Conservative  $0.37
  Base          $1.36
  Optimistic    $1.89
```
Trivia Royale's sourced blended figure was **≤$0.20** — inside all three. **But that company died with 2.5M downloads and 45% D1**, so clearing break-even CPI is necessary and demonstrably not sufficient. CAC remains the input that decides whether any of this works, and **we cannot source it** (§5.6).

### 4.4 What actually goes in the deck — 12–18 month milestones

Per a16z and CRV, replace the three-year model with milestones. These are chosen so that each is **falsifiable against a published benchmark**, which is the only kind of pre-traction milestone worth presenting:

1. **Ship accounts and server-side progression.** Today progression is device-local with no accounts — we cannot measure retention *at all*. This is milestone zero; nothing else is measurable until it lands.
2. **Instrument and publish D1 / D7 / D30 against GameAnalytics medians** (D1 22%, D7 just under 4%, D30 0.68–0.79%; NA: 23.28% / 4.97% / 1.18%).
3. **Target: beat NA median D7 of 4.97%** on a ≥1,000-player cohort. Stated as a target, with the benchmark visible.
4. **Grow the question bank from 54.** State the current number — 54 — plainly. Set a target and a production rate.
5. **Ship an opponent-integrity answer** before monetisation (Skillz v. AviaGames, $42.9M, bots against paying humans).
6. **Validate one monetisation route** — the subscription cross-check ($43.99/yr at a 9% MAU→paid target) is the one with comparables behind it.

### 4.5 The ask — YC's own formula

*"A rule of thumb is that an engineer... costs all-in about $15k per month. So, if you would like to be funded for 18 months of operations with an average of five engineers, then you will need about 15k x 5 x 18 = $1.35mm... Simply answer that you are raising for N months (usually 12-18) and will thus need $X, where X will usually be between $500k and $1.5 million"* ([YC](https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising)).

```
4 engineers × $15,000/month × 18 months = $1,080,000
→ raise ~$1.2M for 18 months   (inside YC's $500k–$1.5M band)
```
Dilution, against [Carta Q3 2025](https://carta.com/data/state-of-private-markets-q3-2025/) medians:
```
$1.2M on a $16.0M median seed pre-money  → $1.2M / $17.2M post = 6.98%
$1.2M into a $24.0M median seed post-money (Carta Q4 2025 all-time high) = 5.00%
```
Both sit under YC's *"If you can manage to give up as little as 10% of your company in your seed round, that is wonderful."* Note: base-case Y1 revenue of $101,907 **(P)** is immaterial to runway — the raise buys 18 months to produce the retention data we do not have, which is exactly what §4.4 is for.

### 4.6 Where each number belongs, by DocSend dwell time

DocSend's per-section dwell times rank where investors actually stop ([DocSend](https://web.archive.org/web/20260622084020/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/)): **Business model 64s** (longest), Product 59s, Traction 40s, Team 38s, Financials 37s, Problem/Solution/Competition 34s each, Ask 32s, **Market size 29s**, Company purpose 26s, Why now 23s. Total review time is **2:18–2:30** on DocSend's last published weekly readings (2024), down from 3:44 (2015) and 3:27 (2019).

Practical consequences:
- **Market size gets 29 seconds.** One number (**TAM-A: $1.69–2.83bn**) and one arithmetic line (216.8M × $7.80–13.07). Everything else in §1 is appendix.
- **Business model gets 64 seconds** — the most of any slide. That is where the $43.99/yr × 9.03% conversion cross-check and the Kahoot/Duolingo margin evidence belong, not in the market slide.
- **Competition gets 34 seconds.** Lead with the vacuum table (§2.2): Quizion 10+ downloads, TRIVIA GO! 10K+ and stale since May 2025, against Trivia Crack's 267.9M installs pivoting to a TV show.
- Per CRV, *"a traction teaser on the first 2 or 3 slides."* We have no traction, so the first-three-slides credibility hook must be the **competitive vacuum plus the graveyard** — evidence, not metrics.
- Length: YC/Hale says 5–7 Demo Day slides; YC/Harris 10 sets of ≤3; CRV 10–15 core slides; DocSend 19–20 pages. **Target 12–15 core slides with the model in the appendix.**

---

## 5. What we do not know

### Failed verification — do not use these numbers

**5.1 Genre ARPDAU bands** ($0.15–0.50 hybrid-casual / $0.03–0.08 hypercasual / $0.01–0.05 ads-only casual) — **unverifiable, citation laundering.** Traced: Playio blog → "Game Growth Advisor, F2P Monetization Models 2026" → gamegrowthadvisor.com, the personal consulting blog of one operator, whose own attribution table labels them *"GGA canonical reference set, moderate confidence"* and *"the bands I am willing to plan against."* Playio stripped that caveat and relabelled them a benchmark. Two secondary sources contradict the internal ordering (Juego Studios reverses hypercasual and casual; AppSamurai assigns $0.15–0.50 to *mid-core*). Tenjin's 2026 ad-mon report contains no ARPDAU at all; GameAnalytics, Liftoff and AppsFlyer genre ARPDAU are gated; Appodeal's live tool returns no data. **What would settle it:** purchase of the gated Liftoff/Appodeal/AppsFlyer genre reports, or our own live ARPDAU after §4.4 milestone 1.

**5.2 Store conversion for trivia** — the claimed 8.2% iOS / 20.4% Android (vs 3.2% / 14.3% casual) is **wrong**. Mistplay printed them crediting Business of Apps, which credits AppTweak; AppTweak's own text says the **lowest** average CVR of any category is Games–Trivia at **5.2%** against an 8.56% US iOS all-category average, with Games–Casual at 34.1% — the ranking is inverted and the casual figure is off by an order of magnitude. Mistplay's own table also contradicts Business of Apps on Puzzle. The Android half survives (trivia 19.8% vs casual 11.4%). The associated IPM figures (trivia 10.3 vs 8.62 global) attributed to Adjust remain **entirely unverified** — gated report, 403/429 on every fetch. **What would settle it:** an AppTweak subscription export; for the IPM figures, the Adjust gaming report itself. **Do not put the IPM numbers in the deck on any sourcing we currently have.**

**5.3 Sensor Tower puzzle-genre revenue** — neither "$14.4bn puzzle / $20.2bn strategy in 2025" nor "$8.07bn puzzle H1 2026 / ~70% of all growth" is verifiable; both appear only in a secondary summary of a gated report. The framing is also wrong twice over: the original sentence identifies the two fastest-*growing* genres, not a size ranking; and since the total market *contracted*, a "70% of all growth" share cannot refer to net growth. **What IS confirmed from Sensor Tower's own ungated pages and safe to use:** global mobile gaming IAP revenue was **$40bn in H1 2026, down ~2% period-on-period**, and Puzzle **"surged 17% YoY to surpass $4 billion in IAP revenue"** in Q2 2026, the only major mobile genre with positive YoY download growth (+1%), while overall gaming revenue fell 4.5% YoY. **What would settle the rest:** buying *State of Gaming 2026*.

**5.4 Trivia Crack's true scale** — ">600 million downloads" and ">150 million active users annually" are **unverifiable and PR-originated.** The download figure was introduced to English Wikipedia on 2021-04-01 by an anonymous IP geolocating to Quilmes, Buenos Aires (etermax's home metro), replacing sourced text with press-kit boilerplate; the article carries an original-research banner. Spanish Wikipedia says *800 million* and frames it as a franchise-wide total. The ">150M active users annually" figure is etermax's, but describes **etermax the company across all its games**, not Trivia Crack. **Use instead: 267,939,837 lifetime Android installs** (Google Play's own store data, displayed as 100M+); Apple publishes no count. **What would settle it:** an etermax press release or investor disclosure stating a Trivia Crack–specific figure.

**5.5 Sporcle Events live scale** — the claimed "75 teams / 6 hosts" live widget **does not exist**; repeated fetches of sporcle.com/events, /events/locations and /events/the-globe found no live ticker. Sporcle's own pages state **500+ local quiz hosts** and **3,000+ pub quizzes per month** (≈750/week), which makes the 20,000 people/week figure internally coherent at ~27 players per event rather than contradicting it. All Sporcle figures are self-reported marketing; Sporcle is private and files nothing. **What would settle it:** nothing public — treat as marketing.

**5.6 CAC / CPI for trivia or casual games, 2025–26** — **no verified benchmark of any kind.** Only anchor: Trivia Royale's ≤$0.20 blended cost per download (Jul 2020), from a company that shut eight months later. **What would settle it:** our own paid tests post-launch, or a purchased Liftoff/Adjust/Tenjin CPI benchmark. Until then, use the break-even CPI arithmetic in §4.3 and say we cannot source the market rate.

**5.7 Global fan bases by sport** (soccer 3.5bn / cricket 2.5bn / basketball 2bn / hockey 2bn / tennis 1bn) — **unverifiable aggregator numbers.** The source site's own methodology page admits it found them via *"a quick search online"* and that the question *"possibly has never been definitively determined."* The cricket figure is **actively contradicted by the sport's own governing body**: the ICC's global market research puts cricket at **~1 billion** fans aged 16–69, not 2.5bn. FIFA's own primary figures are ~250M active players and 3.2bn *tournament viewers*, which is a different metric from standing fandom. **Use only ICC 1bn+ and Nielsen's 51% / 62M US.**

**5.8 Consumer-app seed round medians** — the claimed "consumer apps lowest at $1.5–2.5M vs $3.2M national median at a record $24M post-money" is **wrong on attribution, timing and substance**. The cited Carta report does not exist; Carta's Q1 2026 pre-seed report covers only unpriced SAFEs and contains no seed medians; the $24M figure is Carta's **Q4 2025** all-time-high seed post-money **across all sectors**, with no consumer split published; and Carta's Q1 2026 note says early-stage primary valuations *softened*. **What we can use:** [Carta Q3 2025](https://carta.com/data/state-of-private-markets-q3-2025/) — median seed pre-money **$16M** (+14% YoY), Series A **$49.3M** (all-time high), **~17% down rounds** (lowest in nearly three years). Note Carta published **no** Series A YoY figure; against its own Q3 2024 median of $45.0M the move is ~+10%, not +20%. **What would settle the sector question:** a Carta Round Benchmarking Tool export (values load client-side and could not be retrieved).

### Unresolved elsewhere

**5.9 Quizizz/Wayground valuation** — no primary source states any valuation. The "~$300M" exists only as an unattributed hedged TechCrunch line added ~30 minutes post-publication. Total raised is **$44M** across disclosed rounds ($12.5M Series A + $31.5M Series B); "$47M" is TechCrunch-only. **Do not put $300M in a competitive slide.**

**5.10 Kahoot's post-privatisation group financials** — only **parent-entity** Norwegian statutory accounts exist (KAHOOT! AS, org.nr. 997 770 234: FY2025 operating revenue **USD 112.824M**, FY2024 99.775M, FY2023 85.513M; equity USD 620.231M). **These are not consolidated group results**, and Kahoot has published no audited group figures since delisting on 23 Jan 2024. Do not compare them like-for-like to the $146.0M FY2022 group revenue. **What would settle it:** consolidated accounts for the BidCo/holding entity in Brønnøysund.

**5.11 Jackbox's 826M** — appears in the press-release version sent to media and is independently corroborated, **but appears on no Jackbox-controlled property**; Jackbox's own press kit instead says "over a billion user sessions" all-time since Nov 2014. They are different metrics (player *joins* since Dec 2022 vs *sessions* since 2014). Attribute carefully or omit.

**5.12 Blooket** — bootstrapped and privately held; **all figures are Similarweb estimates**, not company data.

**5.13 Whether consumer trivia can monetise at scale at all** — the open question behind Gap 3 (§1.6). The top-grossing true trivia app on US iOS peaks at ~$38.5K/week. **What would settle it:** our own paid-conversion cohort after milestone 1.

**5.14 Whether app-store benchmarks transfer to a web app** — **every** retention, session, conversion and monetisation benchmark in §3 is measured on iOS and Android app-store installs. FACT//DUEL is a web app with no accounts. We have **no verified benchmark for web-first game retention, web-first acquisition cost, or web-first payer conversion**, and no evidence that app-store D30 medians apply to a browser product with no install step and no push notifications. **This is the single largest methodological risk in the entire model, and it should be stated on the slide rather than buried.** **What would settle it:** our own instrumented cohorts.

**5.15 Everything about FACT//DUEL** — no users, no DAU/MAU, no D1/D7/D30, no session length, no ARPDAU, no conversion, no CAC, no revenue, no LTV. 54 questions in the bank. Device-local progression with no accounts means **retention is currently unmeasurable in principle.** **What would settle it:** ship accounts + analytics, run a four-week cohort of ≥1,000 players, and report D1/D7/D30, session length and sessions/day against the GameAnalytics medians in §3.1.

---

## 6. Source register

**Kind key:** `AF` audited filing / `CD` company disclosure / `TPE` third-party estimate / `AE` analyst estimate / `PR` press report / `MKT` marketing

### Company & competitor figures

| Figure | Value | Kind | URL |
|---|---|---|---|
| Duolingo Q2 2026 revenue, margins, guidance | $298.5M (+18%), GM 72.6%, net income $33.2M, adj EBITDA $77.3M; FY26 guide $1,207M rev / $320M EBITDA | AF | https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm |
| Duolingo Q2 2026 users | 58.7M DAU (+23%), 140.6M MAU (+10%), 12.7M paid (+17%) | AF | https://www.sec.gov/Archives/edgar/data/1562088/000162828026053603/duol-20260630.htm |
| Duolingo FY2025 | Rev $1,037.6M (+39%), bookings $1,158.4M, GM 72.2%, net income $414.1M, adj EBITDA $305.9M, 52.7M DAU / 133.1M MAU / 12.2M subs | AF | https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm |
| Duolingo market cap | $6.72bn @ $143.68, close 11 Sep 2026 | TPE | https://www.sec.gov/Archives/edgar/data/1562088/000162828026053603/duol-20260630.htm |
| Duolingo Streak Revival, Jun 2026 | 15.4M learners revived streaks; ~8M had no active streak (26.2% of DAU) | AF | https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm |
| Kahoot take-private terms | NOK 35.00/share, NOK 17.2bn (492,836,049 shares), 53.1% premium, 14 Jul 2023. **No USD deal value in the primary source** | CD | https://newsweb.oslobors.no/message/595365 |
| Kahoot delisting | 23 Jan 2024 (last trading day 22 Jan) | CD | https://newsweb.oslobors.no/message/608893 |
| Kahoot FY2022 | Rev $146.0M (+60%), invoiced $169.0M, ARR $156M, adj EBITDA $30.3M, 95% GM, >1.3M paid subs, $104.8M cash, no debt | CD | https://kahoot.com/files/2023/02/4Q22_Kahoot_quarterly_report.pdf |
| Kahoot Q2 2023 | Rev $41.3M (+14%), ARR $163.5M (+15%), 1,365,000 paid subs, adj EBITDA $11.0M, 95% GM | CD | https://kahoot.com/files/2023/08/2Q23_Kahoot_quarterly_report.pdf |
| Kahoot final disclosure (Q3 2023) | Rev $42.3M (+16%), YTD $124.1M, adj EBITDA $12.5M, 1.4M subs, $115M cash. **FY23 ">$170M" guidance was NOT in this release** — it came from the Q4 2022 report of 16 Feb 2023 | CD | https://newsweb.oslobors.no/message/603474 |
| Kahoot post-private (parent-only) | FY2025 op. revenue USD 112.824M; FY2024 99.775M; FY2023 85.513M; equity USD 620.231M | AF | https://data.brreg.no/regnskapsregisteret/regnskap/997770234 |
| Kahoot marketing scale | 10M educators; 14bn cumulative participants since 2013; 195 countries; 95%+ Fortune 500; 600+ staff; 11 offices | MKT | https://kahoot.com/company/ |
| Kahoot 360 pricing | $19–$79/mo per presenter ($228–$948/yr), billed annually, ex-VAT | CD | https://kahoot360.com/pricing/ |
| Kahoot app stores | Android 100,263,409 installs, 4.7★/856,977, IAP $2.99–$469.99, updated 3 Sep 2026; iOS US 4.56★/47,901, updated 20 Aug 2026 | CD | https://play.google.com/store/apps/details?id=no.mobitroll.kahoot.android&hl=en_US&gl=US |
| Trivia Crack Android/iOS | 267,939,837 lifetime Android installs (displayed 100M+), 4.5★/7,860,305, IAP $0.99–$199.99 + ads; iOS US 4.60★/747,919, updated 11 Sep 2026 | CD | https://play.google.com/store/apps/details?id=com.etermax.preguntados.lite&hl=en_US&gl=US |
| Trivia Crack pivot | Store title "Trivia Crack by The Floor"; description leads with FOX Season 6, "exclusive new episodes every Thursday" | CD | https://play.google.com/store/apps/details?id=com.etermax.preguntados.lite&hl=en_US&gl=US |
| etermax corporate | Founded 2009; >150M active users annually **company-wide**; 180+ countries; Trivia Crack "#1 in trivia in 125 countries" | TPE | https://www.etermax.com/news/15-years-leading-gamified-entertainment-with-knowledge-driven-experiences |
| Quizizz Series B | $31.5M led by Tiger Global, 29–30 Jun 2021; $44M disclosed total; **no company-stated valuation** | PR | https://www.prnewswire.com/news-releases/quizizz-gains-momentum-raises-31-5-million-to-motivate-every-student-301322655.html |
| Wayground rebrand | 24 Jun 2025; 150+ countries; 90% of US schools (self-reported) | PR | https://www.prnewswire.com/news-releases/quizizz-becomes-wayground-announces-new-ai-and-curriculum-supports-302489367.html |
| Wayground stores | iOS 4.75★/41,871, v8.21, updated 14 Nov 2025; Android 10M+, 4.7★/220K, same date | CD | https://itunes.apple.com/lookup?id=1160249042&country=us |
| MAG Interactive / QuizDuel | Q3 net sales 65,302 KSEK / $6.988M (+9% USD); 9-mo $21.563M (+13%); ARPDAU 9.0¢ (+31%); DAU 0.9M (−14%), MAU 2.2M (−13%) | CD | https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf |
| QuizDuel store ratings | US 3.51★/78; DE 2.27★/7,477; SE 2.55★/837 | CD | https://itunes.apple.com/lookup?id=1484354626&country=de |
| Sporcle scale | 6,819,542,349 lifetime plays (13 Sep 2026); 1M+ community quizzes; 1M+ daily plays; 250,000+ trivia nights since 2009; founded 30 Jan 2007 | CD | https://www.sporcle.com/about/ |
| Sporcle pricing | Orange $3.99/mo or $43.99/yr individual; $6.99/mo or $74.99/yr family (4 accounts) | CD | https://www.sporcle.com/memberships/ |
| Sporcle / Stump! Trivia | $1.4M cash asset purchase, agreement 13 Jan 2020, ~400 events/week | AF | https://www.sec.gov/Archives/edgar/data/748592/000149315220000627/form8-k.htm |
| Blooket | Similarweb: 20.3M visits (3 mo to Aug 2026), #1,651 global, 72.26% US, 8.63 pages/visit, 7m01s | TPE | https://www.similarweb.com/website/blooket.com/ |
| Jackbox | 826M+ player joins since Dec 2022 (press-release only); press kit "over a billion user sessions" since Nov 2014 | CD | https://cogconnected.com/2026/05/jackbox-party-pack-12-brings-its-chaotic-fun-on-all-major-platforms-later-this-year/ |
| Jeopardy! World Tour | Android 5,177,147 installs, 4.4★/169,403, IAP $0.99–$99.99 + ads; iOS 4.35★/87,580, updated 20 Oct 2025 | CD | https://play.google.com/store/apps/details?id=com.sonypicturestelevision.jeopardy2&hl=en&gl=US |
| Psych! | Android 5M+, 64,151 reviews, IAP $0.99–$19.99, updated 26 May 2026; iOS 4.32★/20,930, updated 25 Aug 2023 | CD | https://play.google.com/store/apps/details?id=com.wb.goog.ellen.psych&hl=en_US&gl=US |
| **Live 1v1 vacuum** | Quizion 10+ Android downloads (updated 13 Aug 2026); TRIVIA GO! 10K+, 4.5★/138, no update since 22 May 2025 | CD | https://play.google.com/store/apps/details?id=com.quizion.app&hl=en_US |
| HQ Trivia shutdown | 14 Feb 2020, 25 staff; peak 2.38M concurrent (28 Mar 2018); ~15M all-time installs; 67,000 installs Jan 2020 vs ~2M/mo Feb 2018 | PR | https://techcrunch.com/2020/02/14/hq-trivia-shuts-down/ |
| HQ Trivia funding | $15,000,001 offered / $12,539,999 sold, 6 investors; Founders Fund; Cyan Banister director | AF | https://www.sec.gov/Archives/edgar/data/1734125/000173412518000001/xslFormDX01/primary_doc.xml |
| QuizUp / Glu acquisition | 19 Dec 2016; $7.5M face value notes cancelled, **fair value $3.2M**, zero goodwill; ~$32.4M equity raised; 20M users claimed 19 May 2014 | AF | https://www.sec.gov/Archives/edgar/data/1366246/000155837017001621/gluu-20161231x10k.htm |
| QuizUp shutdown | App Store removal 20 Jan 2021; discontinued 22 Mar 2021 | TPE | https://web.archive.org/web/20210201011909/https://glumobile.helpshift.com/a/quizup/ |
| Trivia Royale | Launched 17 Jun 2020; 2.5M downloads by 10 Jul 2020; 45% D1 iOS; <$500K budget (~40% TikTok); Teatime closed 23 Feb 2021, 16 staff | PR | https://techcrunch.com/2020/07/10/how-thor-fridrikssons-trivia-royale-earned-2-5m-downloads-in-3-weeks/ |
| Teatime Games funding | $9,155,139 (Form D filed 9 May 2018) + $1,499,913 (first sale 19 Sep 2017) | AF | https://www.sec.gov/Archives/edgar/data/1717682/000171768218000001/primary_doc.xml |
| Skillz FY2021 peak | Rev $380.2M, 513,000 paying MAU, net loss $187.9M; FY2022 $269.7M, −$438.9M, 386,000 paying MAU | AF | https://www.sec.gov/Archives/edgar/data/1801661/000180166123000003/ex991_fy22q4-8xkxearningsr.htm |
| Skillz FY2025 | Rev $104.5M (+12.5%), net loss $70.4M, adj EBITDA −$50.5M, 141,000 paying MAU @ $61.7 ARPPU, $194.5M cash vs $129.7M debt | CD | https://www.sec.gov/Archives/edgar/data/1801661/000180166126000019/q425skillzex991-earningsre.htm |
| Skillz v. AviaGames | $42.9M jury verdict, 9 Feb 2024; bot evidence ("Cucumbers", "Guides") | PR | https://www.sec.gov/Archives/edgar/data/1801661/000180166124000100/sklz-20231231.htm |
| Sportradar FY2025 (sports-data benchmark) | €1,290M revenue (+17%), adj EBITDA €297M (23.0%), FCF €167M | CD | https://www.sec.gov/Archives/edgar/data/1836470/000110465926022552/tm267539d1_ex99-1.htm |

### Market sizing

| Figure | Value | Kind | URL |
|---|---|---|---|
| Global games market 2025 | $201.6bn (+9.1%) | TPE | https://newzoo.com/articles/global-games-market-2025/ |
| Mobile / console / PC 2025 | $113.3bn (+10.7%) / $44.7bn (+2.8%) / $43.6bn (+12%) | TPE | https://web.archive.org/web/20260701174151/https://newzoo.com/resources/blog/global-games-market-q2-2026 |
| 2025 by region | APAC $95.0bn (+9.9%), NA $54.0bn (+5.7%), EU $36.3bn (+10.7%), LatAm $8.6bn (+9.6%), MEA $7.7bn (+15.0%) | TPE | https://newzoo.com/articles/global-games-market-2025 |
| Newzoo 2028 forecast | $234.4bn by 2028, 5.1% CAGR; mobile $121.1bn in 2026 (+6.8%) | AE | https://web.archive.org/web/20260722150002/https://newzoo.com/articles/global-games-market-2025 |
| Mobile IAP 2025 | $81.75bn (+1.3%) on 50.41bn downloads (−7.2%) | TPE | https://www.sensortower.com/blog/state-of-mobile-2026 |
| Puzzle install mix | Word 9%, **Trivia 6%** of all-time worldwide puzzle downloads; Swap/match-3 **61% of puzzle revenue** (base 50B downloads / $42B revenue, Jan 2012–Jun 2023) | TPE | https://sensortower.com/blog/unveiling-the-new-puzzle-landscape |
| **Trivia revenue reality check** | US iOS Q2 2025: Kahoot peak $38.5K/wk → $28.2K; Trivia Crack Premium ~$33K; GeoGuessr $31K → $28.7K. (Elevate's $194.7K is a brain-trainer, **not trivia**) | TPE | https://sensortower.com/blog/2025-q2-ios-top-5-trivia%20games-revenue-us-604118ed241bc16eb8b8453a |
| Mobile ad-mon ecosystem | ">$12B ecosystem" across 19 markets; **no calendar year attached**; puzzle 53% and casual/hyper-casual 40% each are **Feb–Apr 2026** snapshots, not 2025 | TPE | https://sensortower.com/blog/gaming-deep-dive-ad-monetization-report |
| Game-based learning (vendor A) | $6.23bn (2025) → $17.82bn (2030), 23.4% CAGR | TPE | https://www.marketsandmarkets.com/Market-Reports/game-based-learning-market-169115901.html |
| Game-based learning (vendor B) | $24.5bn (2025) → $88.6bn (2034), 14.59% CAGR — **3.93× vendor A** | TPE | https://www.imarcgroup.com/game-based-learning-market |
| EdTech & smart classrooms | $197.3bn (2025) → $353.1bn (2030), 12.3% CAGR | TPE | https://www.marketsandmarkets.com/Market-Reports/educational-technology-ed-tech-market-1066.html |
| HolonIQ edtech projection | $404bn by 2025, 16.3% CAGR from 2019, 5.5% of a $7.3tn education market (**projected from a 2020 base**) | TPE | https://www.holoniq.com/notes/global-education-technology-market-to-reach-404b-by-2025 |
| HolonIQ education outlook | ~$10tn by 2030 @ 4.4% CAGR; **EdTech VC $1.8bn in 2024 — lowest since 2014**, 2% of total VC since 2010; ECE 7% > Workforce 6.5% > Post-Sec 4% > K-12 3.5% | TPE | https://www.holoniq.com/notes/2025-global-education-outlook |
| Fan engagement (vendor A) | $8.09bn (2025) → $9.79bn (2026) → $20.94bn (2030) @ **20.9% CAGR** (21.1% is the single-year rate); NA $2.89bn | TPE | https://www.thebusinessresearchcompany.com/report/fan-engagement-global-market-report |
| Fan engagement (vendor B) | $16.2bn (2024) → $66.7bn (2034) @ 15.2%; teams/leagues 38.5%; NA 36.8% ($5.96bn) — **2.00× vendor A** | TPE | https://market.us/report/fan-engagement-market/ |
| Second-screen sports apps | $3.0bn (2025) → $3.5bn (2026) → $17.1bn (2036) @ 17.2% | TPE | https://www.factmr.com/report/second-screen-sports-apps-market |
| **US second-screen adults** | **216.8M (80.6% of US adults), 2026** | TPE | https://www.emarketer.com/content/second-screen-engagement-during-live-sports |

### Audience populations

| Figure | Value | Kind | URL |
|---|---|---|---|
| **NA fantasy/betting participants** | **90.3M North Americans; 82.8M US adults (31%)**, up from 29% in 2025 | TPE | https://members.thefsga.org/news/Details/new-fsga-research-details-growing-role-of-ai-prediction-markets-in-fantasy-sports-and-sports-betting-341850 |
| FSGA 2025 split | 84M US+CA; ~57M fantasy (53M US / 4.2M CA); ~66M bettors (61M US / 5.1M CA); n=3,930, fielded 30 May–5 Jun 2025 | TPE | https://members.thefsga.org/news/Details/new-fsga-research-highlights-industry-stability-and-next-generation-growth-in-fantasy-sports-and-sports-betting-305937 |
| Youth engagement | 51% do both (from 49%); avg start age 14; **66% update lineups daily**; median annual spend $100 | TPE | https://members.thefsga.org/news/Details/new-fsga-research-highlights-industry-stability-and-next-generation-growth-in-fantasy-sports-and-sports-betting-305937 |
| Prediction markets | 7% of US adults traded in past year; users mean age 38.6, 69% male | TPE | https://members.thefsga.org/news/Details/new-fsga-research-details-growing-role-of-ai-prediction-markets-in-fantasy-sports-and-sports-betting-341850 |
| US sports betting handle 2025 | $166.94bn (+11.0%); revenue $16.96bn (+22.8%); taxes $3.71bn (+32.4%) | CD | https://www.americangaming.org/new/commercial-gaming-revenue-hits-78-7-billion-in-2025-driving-record-18-1-billion-in-gaming-taxes-nationwide/ |
| Global football fandom | 51% of people globally | TPE | https://www.nielsen.com/insights/2025/global-sports-report-2025/ |
| **US soccer fans** | **62M** — 4th-largest market globally | TPE | https://www.nielsen.com/news-center/2025/the-future-of-sport-nielsens-2025-report-reveals-growth-drivers/ |
| **Global cricket fans** | **1bn+ (ages 16–69)**; 300M+ active participants 16+ | CD | https://www.icc-cricket.com/media-releases/first-global-market-research-project-unveils-more-than-one-billion-cricket-fans |
| IPL 2025 reach | 1.19bn cumulative (537M TV + 652M digital); 840bn minutes watch-time | CD | https://www.jiostar.com/news/from-stadiums-to-screens-jiostars-tata-ipl-2025-a-year-of-firsts-report-highlights-how-a-billion-viewers-came-together-to-celebrate-cricket/ |
| FIFA WC 2026 digital | 20bn video views; 30bn impressions; 1.7bn engagements; 187M unique FIFA.com visitors; 50M app users (as of 8 Jul 2026, 96/104 matches) | CD | https://inside.fifa.com/media-releases/packed-stadiums-record-digital-reach-world-cup-2026-numbers-unprecedented-scale |
| FIFA WC 2026 broadcast | USA v Paraguay **27.5M** avg (FOX+Telemundo) — most-watched football match ever in the US; China 192M unique over 11 matches; Brazil v Haiti 30.7M avg / 51.3M reach; Mexico v Korea 25.5M. **Overnight data** | CD | https://inside.fifa.com/organisation/media-releases/world-cup-breaks-broadcast-records-across-board |
| r/science | ~34.5M members (34,498,121 @ 21 Aug 2026) | PR | https://web.archive.org/web/20260821020823/https://www.reddit.com/r/science/ |
| Kurzgesagt | 25.5M subscribers; 3,851,277,759 lifetime views (13 Sep 2026). **Not the largest science channel by views** — Vsauce 6.95bn, TED-Ed 4.70bn, Veritasium 4.54bn, Mark Rober 18.88bn | PR | https://www.youtube.com/@kurzgesagt/about |
| National Geographic Instagram | 268,558,516 followers (displayed 269M), 2nd most-followed brand | TPE | https://www.instagram.com/natgeo/ |
| Science-centre visits | 115.8M visits worldwide 2024 (**extrapolated** from 126 respondents' 46.6M across 814 member orgs; visits, not visitors) | CD | https://www.astc.org/wp-content/uploads/2025/10/the-2024-Annual-Statistics-Summary-Report.pdf |
| Smithsonian 2025 | NMNH 3.3M; Air & Space 1.9M (Mall) + 1.0M (Udvar-Hazy); 14.9M total | PR | https://web.archive.org/web/20260514211535/https://www.si.edu/newsdesk/about/stats |

### Benchmarks

| Figure | Value | Kind | URL |
|---|---|---|---|
| Retention, CY2025 | P50 D1 ~22% / D7 <4% / D30 0.68–0.79%; P75 30% / 6–7% / 1.6–1.8%; P90 ~40% / 11–12%; P99 64–68% / >25% / 13–15%. 16,000+ games, 9 regions, ≥1,000 MAU | TPE | https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks |
| NA retention | D1 23.28%, D7 4.97%, D30 1.18%. Oceania leads D1 (25.63%) and D30 (1.39%); **NA is 3rd on D7** behind Africa and Oceania (both 5.60%) | TPE | https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks |
| Sessions | P50 3.1–3.5 min, 3.8–3.9/day, ~12 min/day; **NA 14.45 min/day** (3.64 min × 4.23); P99 22+ min, 12+/day, 94+ min/day | TPE | https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks |
| Monetisation | Casual D90 IAP ARPU $1.34; ARPPU $7.26; IAA ARPU $0.55; casino install→FTP 4.95%/3.01%; **NA gaming 11.14% one-time / 5.08% repeat**. Data Jan 2025–Mar 2026 | TPE | https://www.appsflyer.com/resources/reports/app-marketing-monetization-report/ |
| Store CVR (US, CY2025) | iOS Games-Trivia **5.2%** (lowest of ~38 cats) vs Casual 34.1%, Puzzle 35.7%, Games-all 26.7%, all-cat avg 8.56%; Play Trivia 19.8% vs Casual 11.4%, Games-all 19.9%, avg 16.15%; iOS impression→install Trivia 2.60% / Casual 1.10%. **Established in our verification pass — re-confirm before use** | TPE | https://www.apptweak.com/ |
| **ARPDAU** | **No verified genre benchmark exists.** Only company-reported figure: MAG Interactive 9.0¢ (9-mo) / 8.8¢ (Q3) | CD | https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf |
| **CAC/CPI** | **No verified benchmark.** Sole anchor: Trivia Royale ≤$0.20 blended per download (Jul 2020) | PR | https://techcrunch.com/2020/07/10/how-thor-fridrikssons-trivia-royale-earned-2-5m-downloads-in-3-weeks/ |

### Funding environment & pitch craft

| Figure | Value | Kind | URL |
|---|---|---|---|
| Carta Q3 2025 | Seed pre-money median **$16M** (+14% YoY); Series A **$49.3M** (all-time high); ~17% down rounds. **No Series A YoY published** — vs Q3 2024's $45.0M implies ~+10%, not +20% | TPE | https://carta.com/data/state-of-private-markets-q3-2025/ |
| Crunchbase 2025 seed | >half of US seed dollars in rounds ≥$10M; ~350 deals $10–50M, 20+ at ≥$50M; SF Bay ~⅓ of deals, 45% of dollars | PR | https://news.crunchbase.com/venture/average-seed-funding-amounts-deals-grew-2025/ |
| Drake Star gaming 2025 | **$6.2bn private placements across 509 rounds (+38% on $4.5bn), only 10 rounds >$50M.** M&A $143.6bn / 189 deals (**not $161bn** — that is all 759 deals across all categories) | AE | https://www.drakestar.com/hubfs/Research/GAMING/Drake%20Star%20Global%20Gaming%20Report%202025.pdf |
| Gaming seed comparable | Antihero Studios $4.5M seed (3 Mar 2026), a16z Speedrun + Laton; pre-alpha 70,000 players, 50 min across 3 daily sessions | PR | https://www.antiherostudios.com/ |
| Gaming growth comparable | Grand Games $70M Series B (11 May 2026), Balderton; $103M total, ~6× step-up; 5× YoY revenue, 50M downloads | CD | https://www.balderton.com/news/grand-games-raises-70m-series-b/ |
| Consumer breakout comparable | Whatnot $545M Series G @ $20B (7 Aug 2026), from $11.5B Oct 2025; GMV >$8B in H1 2026 | PR | https://finance.yahoo.com/small-business/articles/whatnot-raises-545m-series-g-174141222.html |
| Rewards-games seed | Playbite $1M (announced 30 Oct 2023), Grishin Robotics; several hundred thousand MAU across 42 titles | PR | https://gamesbeat.com/playbite-raises-1m-to-bring-back-the-magic-of-arcades-for-mobile-games/ |
| YC — deck length | 5–7 slides; 2 min 30 sec; "Make it legible / simple / obvious" | CD | https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck |
| YC — what decks are for | "Investors invest in teams not slides"; 9 named distractions to cut | CD | https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck |
| YC — seed deck order | 10 sets: title, problem, solution, traction, metrics, insight, business model, market, team, ask; ≤3 slides per set | CD | https://www.ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck |
| YC — 12-part deck, TAM | 12 sections; "TAM >$1B if possible" | CD | https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising |
| YC — DON'Ts | 17 DON'Ts including "Create detailed financials" and "Use ridiculous / silly market size numbers without clear justification" | CD | https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising |
| YC — raise math | $15k/eng/month; 15k×5×18 = $1.35mm; raise $500k–$1.5M for 12–18 months; dilution 10% wonderful, ≤20% typical, avoid >25% | CD | https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising |
| YC — exec summary | 1–2 pages (1 better); vision, product, team, traction, market size, minimum financials | CD | https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising |
| Sequoia | 10 sections, ending in Vision; financials: "If you have any, please include" | CD | https://www.sequoiacap.com/article/writing-a-business-plan/ |
| a16z — bottom-up TAM | Bottoms-up preferred; toothbrush example 1.36B × $1 × 40% = $540M ("why 40%?") | CD | https://a16z.com/16-more-startup-metrics/ |
| Seibel — bottom-up | Bottom-up preferred; top-down pitfall is not narrowing the customer | CD | https://www.ycombinator.com/library/4b-how-to-pitch-your-company |
| Seibel — 7 questions | What / market / progress / insight / model / team / ask; progress = ratio of work done to time worked | CD | https://www.ycombinator.com/library/4b-how-to-pitch-your-company |
| DocSend — seed | 3 min 20 sec avg review; 19–20 pages; 12 sections; open with purpose/problem/solution/market | TPE | https://web.archive.org/web/20240302210508/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/ |
| DocSend — dwell times | Business model 64s, Product 59s, Traction 40s, Team 38s, Financials 37s, Problem/Solution/Competition 34s, Ask 32s, Market 29s, Purpose 26s, Why now 23s | TPE | https://web.archive.org/web/20260622084020/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/ |
| DocSend — failure signal | **80% more time on traction of decks that failed**; pre-launch traction = LOIs, testimonials, pipeline, beta feedback | TPE | https://web.archive.org/web/20240302210508/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/ |
| DocSend — pre-seed | 92% of successful decks have a problem slide (100% West Coast); 1.8 problem / 2.8 product slides; ~60% include traction; 20 pages; <3.5 min | TPE | https://web.archive.org/web/20251007221137/https://www.docsend.com/blog/pre-seed-pitch-deck-guide/ |
| DocSend — time trend | 3:44 (2015) → 3:27 (2019); 20 slides unchanged; successful founders contacted 77 investors / 40 meetings vs 70 / 15 | TPE | https://web.archive.org/web/20200930105556/https://www.docsend.com/blog/a-brief-anatomy-of-a-successful-seed-raise/ |
| DocSend — last published | 2:30 most of Q1 2024; 2:24 early Q2; **2:18 in Apr and Jun 2024** — final figure ever published | TPE | https://web.archive.org/web/20260525121043/https://www.docsend.com/pitch-deck-metrics/ |
| a16z — no baked model | "Detailed 3- to 5-year financial projections" and "Market sizing" on the do-not-include list; wants 12–18 month milestones. (Author: **Justine** Moore, 25 Aug 2022) | CD | https://a16z.com/the-insiders-guide-to-data-rooms-what-to-know-before-you-raise/ |
| a16z — projection hygiene | Anchor to historicals (20% MoM history ≠ 200% MoM projection); label (A)/(P); never let deck and model disagree | CD | https://a16z.com/the-insiders-guide-to-data-rooms-what-to-know-before-you-raise/ |
| Paul Graham | 3 things: formidable founders, promising market, usually some evidence of success; decided in first few minutes; TAM = x × $y | CD | https://paulgraham.com/convince.html |
| CRV (Jun 2026) | 10–15 core slides; traction teaser in first 2–3; models in appendix; one idea per slide | CD | https://www.crv.com/content/seed-funding-pitch-deck |

---

### Three sentences to carry into every slide

1. **We have no users and no revenue, and we say so** — the evidence base here is entirely third-party, and the plan in §4 is a plan, never a forecast.
2. **The bottom-up TAM is $1.69–2.83bn (216.8M × $7.80–13.07) and the honest SOM is 0.14–0.23% of SAM** — every other market number in the deck is a vendor estimate that disagrees with its nearest rival by 2–4×.
3. **The 1v1 duel format has a proven installed base in the hundreds of millions and no maintained incumbent — and every previous attempt died of retention and monetisation, not distribution.** Which is why the only milestones worth funding are the ones that produce retention data we currently cannot even measure.
---

## 7. Addendum — what shipped on 13 September 2026, and what it changes

This section is dated and additive. Nothing above is retracted except where stated here explicitly.

### 7.1 §5.15 is no longer true as written

§5.15 said: *"Device-local progression with no accounts means retention is currently unmeasurable in
principle."* That sentence described a real architectural gap, and the gap has been closed.

What now exists in the product, on `main`:

| Capability | Where | Evidence |
|---|---|---|
| Install day, active days, session count, engaged time, and the four in-app counters (duel rounds, matches, expedition cards, quests) recorded per device | `lib/analytics.mjs`, wired through the profile reducer | 24 tests, green across five timezones |
| Per-device D1 / D7 / D30 — did this device come back on day 1, 7, 30 | `retention()` in the same module | returns `true`, `false`, or `null` while the window is still open; a test asserts an unfinished window never reads as a miss |
| A player-facing view of the entire record, with JSON and CSV export and erase | `/analytics` in the app | browser-verified at two widths in both themes |
| A cohort **rate** across devices, from an opt-in anonymous daily ping | `cohort-ping` / `cohort-report` in `lib/server/duel-service.mjs`, table `cohort_days` | 20 tests; aggregate-only report, no per-device row, buckets under five devices suppressed |

**What is still true:** there are no players yet, so there is no cohort, so there is still no retention
rate to quote. The difference is that the instrument now exists and is tested, rather than the
measurement being impossible. The honest claim for the deck is: *"the instrument is built; the round
buys the cohort to point it at."*

**Deliberate limitation, stated plainly:** one device can only ever produce a boolean. The app never
computes a rate from a single device, and the screen says so in its own copy. A rate requires the
opt-in cohort, and that requires players.

### 7.2 The product is now publicly playable, with no install and no account

`pnpm build:static` produces a build that runs the entire game in a browser with no server: bot duels
in all three modes, expeditions, discovery, the vault, the passport, the events calendar and the
limited modes. It does this by keeping the real duel engine and replacing only the storage beneath it;
14 differential tests run each scenario against both the in-memory store and the real D1-backed store
and compare every return value, every thrown error and the rows left behind.

Two-device friend duels genuinely need a server and are disabled in that build, with an on-screen
notice saying so.

**Why this matters to the deck:** the traction slide no longer has to be an argument. An investor can
play a complete duel in about fifteen seconds from a link, on a phone, without installing anything —
which is also the distribution claim the product makes about itself.

### 7.3 What this does NOT change

- No users, no revenue, no cohort, no CAC, no LTV, no ARPDAU. Every figure in §4 remains a plan (P).
- §5.14 stands: every retention benchmark in §3 is measured on app-store installs, and there is still
  no verified benchmark for web-first game retention. Our own instrument is now the route to one.
- The question bank is still 54 questions.
- Everything in §5.1–§5.13 is unchanged.
