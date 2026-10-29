# Cricket with stories, not a rules exam

Editorial release: 29 October 2026. Baseline: `71c017e1b31c17c6bf4b43b601395830d5dd294e`.

The playable bank now excludes rule-number/regulation-recall questions. The original records remain in the archive so existing journals, review history and source references are not silently rewritten. Four existing questions are retired: `cr034` (tied Super Over regulation), `cr051` (current Law number), `cr052` (previous Law number), and `cr491` (introduction of the Impact Player rule). Historical cricket incidents and achievements remain. The label `simple` continues to mean an approachable sporting story, not a Cricket 101 lesson.

`lib/server/question-curation.mjs` is the shared editorial gate. It also blocks newly imported Cricket questions in explicit basics/rules categories and narrowly recognised elementary prompts about balls per over, players per side, pitch dimensions, boundary scoring, stump counts and acronym expansion. Patterns deliberately do not block historical run totals, wicket records or deliveries faced in an innings. Tests distinguish these cases. There were no existing team-size or balls-per-over prompts in the served Cricket bank; no removal count is inflated to imply otherwise.

## Spicy: a public-record category

`lib/server/questions/cricket-spicy.mjs` contributes 24 four-option questions, eight each at `simple`, `expert` and `extreme`, using topic `Cricket` and subtopic `Spicy`. The answer positions are evenly distributed. A five-question match can therefore run at any difficulty without recycling a card. The questions cover corruption decisions, disputed findings and appeals, institutional fallout, comebacks, and voluntarily public relationships and professional support.

Sources are 18 official ICC, Cricket Australia and IPL/BCCI pages. Each card includes a source URL, source label and explanatory context. The question stems pin disciplinary facts to the relevant historical decision. Suspensions are not silently treated as current. Key distinctions stay in the answer explanation: failure to report is not proof of match-fixing; a franchise sanction does not implicate every player; a charge overturned or unproven on appeal is not a sustained finding. Public couples and family support are not presented as misconduct.

### Editorial boundaries

- No affair rumours, leaked conversations, private addresses, minors’ personal details, sexual speculation or invented interpersonal drama.
- No uncharged player names as corruption distractors. Wrong answers in disciplinary questions are neutral events, processes, dates, objects or durations.
- No racial slurs reproduced for entertainment. The Harbhajan card tests the appeal outcome and states that the racial-abuse charge was not proven.
- No blanket labels such as “cheater” replacing the specific governing-body finding.
- No current-relationship-status claim inferred from an old wedding report. The Starc/Healy questions ask about their publicly described 2016 event.
- Source links are part of the learning record, not an endorsement of the game by a board or player. Primary-source use does not make the app an official cricket product.

### Source ledger

All sources retrieved on 29 October 2026. Questions and explanations are original paraphrases. The ICC archive page for Harbhajan displays 6 April 2010 as publication metadata while reporting the Sydney 2008 appeal; the card uses the event year, not that archive timestamp.

| Cards | Source | Evidence used |
| --- | --- | --- |
| cr600–601 | [ICC, 29 October 2019](https://www.icc-cricket.com/media-releases/shakib-al-hasan-banned-after-accepting-three-charges-under-icc-anti-corruption-code) | Shakib’s admitted reporting failures and suspended portion of sanction |
| cr602 | [ICC, 26 February 2019](https://www.icc-cricket.com/media-releases/sanath-jayasuriya-banned-from-all-cricket-for-two-years) | Jayasuriya’s non-cooperation and obstruction findings |
| cr603–604 | [ICC, 23 November 2023](https://www.icc-cricket.com/media-releases/marlon-samuels-banned-for-six-years-under-anti-corruption-code) | Samuels tribunal, board jurisdiction and hospitality finding |
| cr605–606 | [ICC, 14 April 2021](https://www.icc-cricket.com/media-releases/heath-streak-banned-for-eight-years-under-icc-anti-corruption-code) | Streak decision, introductions and explicit match-outcome limitation |
| cr607 | [ICC, 28 January 2022](https://www.icc-cricket.com/news/brendan-taylor-banned-under-icc-anti-corruption-code-and-anti-doping-code) | Taylor’s agreed sanction and concurrent, separate sanctions |
| cr608 | [ICC, 30 July 2025](https://www.icc-cricket.com/news/zimbabwe-announce-squad-for-second-test-against-new-zealand) | Taylor’s restored eligibility and squad return |
| cr609 | [ICC, 16 March 2021](https://www.icc-cricket.com/media-releases/naveed-and-shaiman-banned-for-eight-years-each-under-icc-anti-corruption-code) | Tribunal findings against Naveed and Anwar |
| cr610–611 | [ICC, 2 May 2024](https://www.icc-cricket.com/media-releases/devon-thomas-banned-for-five-years-under-anti-corruption-code) | Thomas’s three leagues and suspended sanction portion |
| cr612 | [Cricket Australia, 4 April 2018](https://www.cricket.com.au/news/3290437/bancroft-accepts-ca-sanction) | Bancroft’s accepted suspension |
| cr613 | [Cricket Australia, October 2024](https://www.cricket.com.au/news/4155165) | Warner’s restored leadership eligibility |
| cr614–615 | [Cricket Australia, 22 December 2016](https://www.cricket.com.au/news/3274824/icc-hands-down-faf-du-plessis-verdict) | Du Plessis appeal outcome and penalty |
| cr616 | [BCCI/IPL, 20 October 2015](https://www.iplt20.com/news/article/bcci-to-invite-bids-for-two-new-ipl-teams) | Lodha committee implementation and franchise suspensions |
| cr617 | [ICC official appeal statement](https://www.icc-cricket.com/news/icc-statement-following-the-conclusion-of-harbhajan-singhs-independent-appeal-hearing) | Unproven racial-abuse charge and lesser admitted offence |
| cr618 | [ICC, 18 July 2019](https://www.icc-cricket.com/media-releases/icc-board-and-full-council-concludes-in-london) | Zimbabwe governance suspension |
| cr619 | [ICC, 14 October 2019](https://www.icc-cricket.com/news/zimbabwe-and-nepal-readmitted-womens-event-prize-money-receives-a-major-boost) | Zimbabwe and Nepal readmission |
| cr620–621 | [Cricket Australia, 15 April 2016](https://www.cricket.com.au/news/3271084/shes-a-keeper-starc-and-healy-tie-the-knot) | Public Starc/Healy history and wedding posts |
| cr622 | [ICC, 8 September 2022](https://www.icc-cricket.com/news/kohli-reflects-on-tough-times-after-ending-century-drought) | Kohli’s own account of dedication and gesture |
| cr623 | [IPL, 21 May 2017](https://www.iplt20.com/news/article/i-am-proud-of-krunal-hardik-pandya) | Pandya brothers’ published joint interview |

## Serving and deployment boundaries

Local practice, catalogue and expeditions consume the curated `QUESTIONS` export. `ALL_QUESTIONS` remains an archive and must not be used directly as a playable pool.

The human server has its own database, so a frontend-only filter is insufficient. `supabase/jhk/seed-bank.mjs` now applies the same curation before generating `seed-bank.sql`. It also generates the bounded deployment delta `supabase/jhk/migrations/20261029_spicy_content.sql`: delete only the four retired question-pool rows and upsert only the 24 Spicy records in one transaction. No rooms, answer snapshots, sessions, profiles or wallet entries are modified. This preserves already-started match snapshots while preventing new deals of retired questions after the delta is applied.

The new rows carry `sports`, `cricket` and `spicy` file tags. They are included in normal Cricket selection. A dedicated human Spicy matchmaking mode additionally requires the server’s room-file constraint and action whitelist to accept `spicy`; tagging content alone does not supply that product integration.

Regenerate both SQL files with `node supabase/jhk/seed-bank.mjs`; verify with `--check`. Deployment evidence belongs in the release verification record; generated SQL alone is not proof of a remote update.

## Panel acceptance

Round 1 diagnosed rule-recall items, the local/archive boundary, and the separate human seed boundary. The implementation centralises curation, adds a sourced Spicy pool and produces the bounded remote delta.

Focused verification: `node --test tests/stadium-content.test.mjs tests/bank.test.mjs` passes eight tests, including the actual local service playing a complete five-question Spicy match with five distinct cards. Tests also preserve archived records, reject synthetic Cricket 101 imports, keep historical records eligible, validate the source allowlist and ensure the remote delta does not write game/player tables. Automated tests validate structure and behaviour; primary-source editorial review supports the factual content. They do not prove every historical bank question is correct.

### Round 2 acceptance ledger

| Finding / check | Changed artifact reviewed | Result and correction |
| --- | --- | --- |
| Home must launch the requested category directly | `home-screen.tsx` passes `gauntlet`, `Cricket`, `Spicy` to `onDuel`; `arena.tsx` preserves the subtopic and sets difficulty `all` | Accepted by source inspection; actual service test completes five distinct Spicy rounds. Browser squad owns the click-level acceptance. |
| Default should not be restricted to easy questions | `quickDuel` uses difficulty `all`, 30-second Cricket duration | Accepted; does not relabel elementary rules as harder questions. |
| Sensitive disciplinary claims need exact outcomes | Re-read primary decisions for Shakib, Jayasuriya, Samuels, Streak, Taylor and Harbhajan; checked ICC decision index and later Taylor return | No unsupported guilt finding identified. Replaced Harbhajan’s general ICC news link with the ICC’s direct appeal statement. His unproven charge remains explicit. |
| Later reversals/completions must not disappear | Warner 2024 review, Taylor July 2025 return, Zimbabwe October 2019 readmission | Already included beside the historical sanctions. No claim of present ineligibility added. |
| Wrong answers must not implicate unrelated players | All 24 option sets | Accepted: disciplinary distractors concern actions, organisations, dates, objects or durations; none nominates unrelated players as alleged corruptors. |
| Readers need actual sources after an answer | `RoundReview` source link in `app/rivalry-widgets.tsx`; journal links in `app/journal.tsx`; human receipt link in `live-duel-screen.tsx` | Accepted by source inspection: local post-round review renders both source URL and label; complete-match review remains accessible. |
| Remote rollout must be bounded and repeatable | Generated migration transaction | Delta targets only retired IDs and new Spicy IDs; source snapshot preservation checked in an isolated PostgreSQL execution. Remote deployment remains a release step. |
