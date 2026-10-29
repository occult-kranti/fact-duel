# Cricket expansion and question rotation

Authoring/research date: 29 October 2026. Release scope: the existing English four-choice runtime. This document is an internal content and engineering record; its inventory totals are not product UI copy.

## What changed

`lib/server/questions/cricket-expansion.mjs` adds 48 original cards, `cr624`–`cr671`, through `lib/server/bank.mjs`. There are 16 cards per editorial difficulty and 12 authored correct answers in each option position. Serving still shuffles options. The addition includes 21 cards about women's cricket, plus IPL finals, World Cup/WTC stories and international upsets. None tests introductory playing rules. Existing Spicy cards remain unchanged; this pack adds no allegations or private relationship speculation.

The resulting local served bank has 897 cards, including 633 Cricket cards, and 894 reviewed rotation families across all sports. The three differences are known duplicate-fact pairs described below. These are internal diagnostics, not a number to display on categories, modes or the launch screen.

The longest new stem is 107 characters; the longest option is 34. These are copy bounds, not a substitute for device rendering tests. Difficulty labels are editorial. There has been no real-player first-exposure calibration, timing-parity study or focus group for this content pack; no such result is claimed.

## Evidence and rights

The source ledger is also exported as `CRICKET_EXPANSION_SOURCES`. Every used page is an official ICC, IPL or New Zealand Cricket report/history, accessed on 29 October 2026. The supporting passages were read, rather than treating a result title as evidence. Each source supports a closed historical event. Question text and explanations are original concise wording. Web access is not an open-content licence: no article, photograph, logo, video or scorecard layout is imported, and no permission to reuse source assets is claimed.

Each group below contributes three separate questions. The complete question/options/explanation text attributed to any one source is between 92 and 113 words. Distractors are alternative people, venues or numeric values that do not satisfy the specified event fact. Dates, competition categories and stages remain in stems when they distinguish an answer. No current rank, affiliation or active record total is presented as timeless.

| Cards | Primary source and publication date | Inspected claim location |
|---|---|---|
| cr624–cr626 | [ICC Women's World Cup History](https://www.icc-cricket.com/news/icc-womens-world-cup-history), 18 Jan 2017 | 1973 winner and leading runs/wickets |
| cr627–cr629 | [ICC history from 1973–2025](https://www.icc-cricket.com/tournaments/womens-cricket-worldcup-2025/news/from-1973-2025-an-historic-look-at-the-women-s-world-cup), 9 Sep 2025 | 2000 final margin, 2009 Shaw figures, 1978 Hyderabad venue |
| cr630–cr632 | [ICC 2016 Women's World T20 final](https://www.icc-cricket.com/news/taylor-matthews-take-west-indies-women-to-maiden-world-t20-title), 3 Apr 2016 | Matthews/Taylor innings and deliveries remaining |
| cr633–cr635 | [ICC 2020 Women's T20 final](https://www.icc-cricket.com/news/australia-lift-fifth-t20-world-cup-title), 8 Mar 2020 | Mooney innings, Schutt wickets, opening stand |
| cr636–cr638 | [ICC 2022 Women's World Cup final](https://www.icc-cricket.com/media-releases/australia-win-icc-womens-cricket-world-cup-2022-with-special-victory-over-england), 3 Apr 2022 | Healy innings, Hagley Oval and opening stand |
| cr639–cr641 | [NZC 2024 Women's T20 final](https://www.nzc.nz/match-reports/archive/new-zealands-first-t20-world-cup-win/), 20 Oct 2024 | Kerr/Halliday innings and Mair figures in report/score summary |
| cr642–cr644 | [IPL 2019 final report](https://www.iplt20.com/news/article/match-report-final-mi-vs-csk), 12 May 2019 | Watson/Pollard scores and Deepak Chahar figures |
| cr645–cr647 | [ICC 2007 men's World Cup overview](https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-2007-overview), 9 Mar 2019 | Gilchrist grip aid, McGrath wickets, Jayawardena semi-final |
| cr648–cr650 | [ICC 1999 men's World Cup overview](https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-1999-overview), 11 Mar 2019 | Klusener award, Warne semi-final figures, Anwar semi-final |
| cr651–cr653 | [ICC 2003 men's World Cup overview](https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-2003-overview), 11 Mar 2019 | Martyn innings, third-wicket stand and Symonds semi-final |
| cr654–cr656 | [ICC 2015 final retrospective](https://www.icc-cricket.com/tournaments/cricketworldcup/news/on-this-day-australia-win-icc-cwc-2015), 29 Mar 2018 | Faulkner award, Elliott score and Clarke's final ODI |
| cr657–cr659 | [ICC 2021 WTC final](https://www.icc-cricket.com/news/new-zealand-crowned-world-test-champions-after-thrilling-final-day), 23 Jun 2021 | Winning runs, Watling retirement and unbroken partnership |
| cr660–cr662 | [ICC Afghanistan–Australia 2024](https://www.icc-cricket.com/news/live-aussies-send-in-afghanistan-in-crucial-super-eight-clash-in-st-vincent), 23 Jun 2024 | Gulbadin wickets, Noor's catch and result |
| cr663–cr665 | [ICC USA–Pakistan 2024](https://www.icc-cricket.com/news/live-pakistan-open-t20-world-cup-campaign-against-hosts-usa-in-dallas), 6 Jun 2024 | Last-ball boundary, Super Over total and Kenjige figures |
| cr666–cr668 | [ICC Netherlands–South Africa 2023](https://www.icc-cricket.com/tournaments/cricketworldcup/news/dutch-delight-netherlands-register-famous-victory-against-south-africa), 17 Oct 2023 | Edwards/Dutt innings and rain-adjusted match length |
| cr669–cr671 | [ICC women's pioneers](https://www.icc-cricket.com/media-releases/the-world-cup-that-pioneered-womens-cricket), 28 Jul 2023 | Hunter, Kerr and Wilson milestones |

Additional primary cross-checks for the less familiar milestones: [ICC Hunter match report](https://www.icc-cricket.com/news/record-breaker-amy-hunter-shines-bright-in-irelands-series-win-over-zimbabwe) and [ICC Wilson Hall of Fame announcement](https://www.icc-cricket.com/news/anil-kumble-and-betty-wilson-to-be-inducted-into-the-icc-cricket-hall-of-fame). These are further ICC records, not independent publishers. The Wilson match is also described by [MCC/Lord's](https://www.lords.org/lords/our-history/evolution-of-womens-cricket).

Source criticism matters even for governing bodies. An older ICC history misidentified England's opponent in the 2009 final; the 2025 history was used for that claim. Another ICC live article gave Kerr's 2024 final figures differently from the NZC score summary; this pack's bowling-figures question is about Mair and uses NZC. The pioneers page mistakenly labels Belinda Clark's country; no Clark nationality claim from that page is used. Unrelated erroneous claims were not copied into cards.

## Rotation contract

`lib/question-rotation.mjs` is pure. Serving authorities own profile identity, persistence, concurrency and when an exposure is recorded. Its API is:

```js
rotationKey(question)
selectRotatedQuestions(eligiblePool, { count, history, participants, rng })
recordQuestionSeen(history, question, { at })
mergeRotationHistories([historyA, historyB])
```

`history` is a plain map from stable family key to positive numeric timestamp. The reader strips malformed values and prototype-sensitive keys. The selector does not mutate cards, options, history or the eligible pool. It never examines correct answers.

1. Apply all selected content, topic, region, difficulty and mode eligibility filters before calling the helper.
2. Group equivalent fact variants into one family. Select at most one variant per family in a deck.
3. Merge participants' histories by the latest timestamp for each family. A family previously shown to either human is considered seen.
4. Select families unseen by all participants first, then the least recently seen families. Randomize ties and the variant within a family.
5. Record new exposure through the authority; older writes cannot roll a timestamp backwards. The caller must deduplicate retries for the same exposure. The timestamp helper alone is not an event-idempotency mechanism.

There is no promise of never repeating forever. If a selected category has seven eligible families and the mode deals five, a second game must eventually reuse families. It uses the two unserved families first, then the oldest available families. If a mode needs more distinct families than the entire eligible pool, the helper returns fewer; the caller must offer an available mode or reject that setup. It never fills with duplicates or silently widens filters.

Same-time batches have randomized ties; this is least-recent exposure selection, not a strict equal-frequency quota. A deterministic tie RNG is useful in tests but does not guarantee identical lifetime presentation counts. Existing history cannot be reconstructed for play that happened before history tracking was installed.

### Reviewed equivalence aliases

| Existing IDs | Stable family key | Equivalent fact |
|---|---|---|
| cr042, cr473 | cricket-ipl-suspension-seasons-2016-17 | The two IPL suspension seasons |
| cr056, cr291 | cricket-yuvraj-broad-six-sixes-2007 | Broad as the bowler for Yuvraj's six sixes |
| cr244, cr566 | cricket-afridi-chennai-141-1999 | Afridi's 141 in the Chennai Test |

Old card-ID histories are still respected for these aliases. Explicit `familyKey` or `familyId` takes precedence, followed by the alias map, then the stable card ID. Shared source URL or shared match is not enough to merge a family: the venue and the winning margin are different facts. The 48 new cards were compared against existing question text and manually checked for overlapping events; they do not add a second wording of any reviewed old fact.

### Local and human authorities

For local bot play, deck reservation history can be written before play to prevent simultaneous tabs repeatedly reserving the same cards. This means an abandoned deck can count as reserved even when never shown. The storage/serving implementation must call this reservation history rather than claiming it measures reading. Player-facing journal counters should still be based on actual encounters.

For authenticated human play, the authoritative pool is the private Supabase question table. Importing the JavaScript file alone does **not** add the cards to human rooms. The backend work must generate/apply a bounded seed delta for `cr624`–`cr671` and add the six existing family aliases; the full seed must also carry stable family keys. Both-ready deck selection merges both seats' histories under the room transaction. Actual round releases, not polling or answer retries, record human exposure. The initial room deck can validate availability but must be replaced using both players' histories before either sees a card.

This document records the contract; final deployment and SQL execution evidence belong in the backend/release record. It does not claim a database migration was applied merely because these local files exist.

## Count visibility audit

`app/collections.tsx` already presents the player's own encountered/opened/recalled counters. `app/screens/play/match-settings.tsx` presents availability without a pool number. Discovery's dots and “n of 3” describe its current three-card run; they are not the available category inventory. Journal deck counts describe the player's saved material. These useful progress indicators remain permitted.

The public English and Hindi IPL SEO fallback text previously disclosed the matched pool size. Both now explain the broader sample without a number. A rendered regression varies the internal matched total while holding the displayed sample fixed and requires identical complete HTML across every intent, including metadata, accessible copy and JSON-LD. The existing app scan no longer describes SEO as an exception.

The shared catalogue response replaces top-level and per-topic `count` with `available` booleans. Static and HTTP transports use the same service. Answer-free facets stay available for internal combined-filter minimum-deck-size checks and subtopic menus; no UI prints their size. Facets remain enumerable and the static build carries a local bank, so this is a presentation/API contract, **not a bank-secrecy guarantee**. The Hisaab edition uses the same availability contract without changes to its bank alias or gameplay.

## Review and validation record

**Round 1 — scope and failure analysis.** Audited the served bank and existing duplicate candidates. Identified shuffle-only new-deck selection as the repeat mechanism. Defined eligible-pool-first rotation, both-seat history union, three semantic aliases and the small-pool limit. Initially flagged Discovery dots; inspection confirmed a three-card run, so the concern was withdrawn rather than deleting useful progress.

**Round 2 — implementation and source review.** Authored 48 short cards from 16 primary source pages. Reviewed option distinctness, event scope, answer leakage and existing question overlap. Added the bank import and private source ledger. Hardened history input, null participants/RNG handling and family recency reduction. A stress assertion expecting equal lifetime frequencies under fixed same-time ties failed; that was a stronger promise than the algorithm makes. Replaced it with the required no-starvation and within-deck uniqueness checks, and documented tie behavior explicitly.

**Round 3 — independent and integration review.** The research/QA agent spot-checked the official 1973, USA 2024 and pioneers pages, confirming the selected answers. It flagged the Wilson explanation's extra year/opponent detail as absent from the single displayed source link; the explanation was narrowed to the linked claim. The full 48-card set was compared with the old bank and reviewed for historical scope, duplicate-fact rephrasing, option uniqueness and source word budgets. No new same-fact rephrasing was found. The three legacy aliases were independently compared with the SQL function and matched exactly. Existing Cricket 101 curation remains unchanged. Root's review added the SEO/public-catalogue count audit; the rendered regression first caught a remaining Hindi leak, which was then fixed. The public catalogue now communicates availability while retaining internal facet checks. These are agent/editorial and automated reviews, not a human pilot.

Targeted command:

```sh
node --test tests/question-rotation.test.mjs tests/cricket-expansion.test.mjs tests/bank.test.mjs tests/no-pool-counts.test.mjs tests/no-pool-counts-seo.test.mjs tests/seo-pages.test.mjs
```

Result after round 3 content/SEO fixes: **37 passed, 0 failed**. Coverage includes exhaustion before repetition, max recency across human seats, family aliases with legacy history, narrow/empty pools, source and option immutability, malformed history/RNG, monotonic timestamps, 100 five-card deals from a seven-family pool, source-ledger completeness, rendered SEO count privacy and the existing full-bank schema/answer-leak checks. Separate catalogue integration tests cover HTTP/static transports, filter gating and the Hisaab alias. These automated checks establish runtime invariants; they do not establish factual truth or real-player fairness by themselves.

Final integration check added `tests/catalogue-availability.test.mjs`, `tests/content.test.mjs`, `tests/duel-memory.test.mjs`, `tests/hisaab-bank.test.mjs` and `tests/stadium-content.test.mjs` to that command: **70 passed, 0 failed**. This includes real static-client calls, memory/D1 parity, Hisaab bank aliases, retired-rule exclusion and Spicy preservation. A separate parsed SQL comparison confirmed all 48 bounded-seed prompts, correct indices, explanations and family keys match the frozen JavaScript pack, and all six SQL family aliases match the pure helper.

## Calibration and corrections

The research skill's richer private authoring schema and taxonomy were reviewed as guidance. This is an addition to the repository's legacy flat card format, not a claimed migration to that proposed schema. No fabricated source licence, human sign-off, measured difficulty or calibrated fast-duel parity is inserted. Current game eligibility follows the repository's serving policy; before making competitive fairness claims, collect first-exposure accuracy, timeout rate and correct-response time by card/version, mode, locale and input type. Compare touch and keyboard separately, include sample sizes/uncertainty and review cards with high timeout or disagreement rates. Consider practice-only piloting for materially unfamiliar content.

Keep stable IDs through wording fixes. Add a family alias for newly discovered equivalent facts. If the correct answer changes after source correction, retire/quarantine the old item at the server curation boundary, publish a corrected version and regenerate the bounded human seed. Review this pack when a cited official report is corrected, when localization changes the answer distinction, or when pilot evidence shows ambiguous choices. Historical claims do not need a daily freshness poll.
