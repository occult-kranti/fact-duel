# Expedition release — verification and limits

12 September 2026. The release is published only after the production build succeeds.

| Gate | Evidence and boundary |
|---|---|
| Automated suite | 68 tests passed, 0 failures. Covers existing live-duel engine, bot, timing, coin, HTTP and profile invariants plus the new expedition paths. |
| New progression checks | All nine manifests; first-choice/stance lock; all-correct +18 and all-wrong −6; no skipping; partial and six-answered-awaiting-Finish reload; idempotent completion; independent routes; first/best separation; bounded activity awards; migration; malformed and impossible score rejection. |
| Concurrent storage | Fake IndexedDB transactions exercise competing route starts, answers, advances, Finish and reset. They do not constitute observed real-browser multi-tab validation. |
| TypeScript | `tsc --noEmit` passed against the implementation. |
| Production build | Required to pass before saving and publishing this release; packaged output includes current reports. Optional Three.js still has a large-chunk warning, not a failed build or a device-performance measurement. |
| Advisor | Two bounded source passes. Four findings repaired and re-inspected: committed-state cues, distinct settings intent, feasible saved scores and consistent completion ownership. The advisor independently ran the nine focused expedition tests. |
| Research | Seven primary/official sources inspected within declared access limits. Four were new URLs in the combined deduplicated ledger, now 73 URLs. No new user-review sample, full-book reading, question-bank audit or market-size study this turn. |
| Navigation/report integrity | Current reports linked in Studio; public roadmap equals the source baseline; all roadmap dependencies resolve; 73 tracked issues, 38 marked done. |
| Content boundary | Exactly 54 existing questions across nine six-question packs. Options shuffle per run and freeze in its saved snapshot. Client modules do not import the server question bank; explicit practice responses carry teaching answers. |
| Audience and currency | Existing owner-private access preserved. Free simulated room coins remain separate from local run scores and cosmetic stamps. |

Not performed: rendered browser QA, physical phone interaction, 200% zoom, screen-reader observation, graphics-driver measurements, distant two-screen/WAN testing, production load testing, user retention or delayed learning study. The managed Sites preview is limited to explicitly requested browser/visual/end-to-end QA; this turn did not request that observation. Responsive implementation and source review are not reported as measured device results.

The existing room polling and timing architecture was not replaced. The new untimed mode makes one pack request when a run starts and stores subsequent answer progress locally; it does not provide stronger anti-cheat or human latency guarantees. Future cross-device progression, retired-route archives and deeper editorial packs remain planned work.
