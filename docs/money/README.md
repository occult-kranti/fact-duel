# Money-layer research and planning artifacts

The evidence base behind `public/product/compliance/` and
`public/product/compliance/roadmap.md`. These files are inputs to a build step, not prose — a fresh
clone needs them to regenerate the compliance page:

```
node scripts/compliance-data.mjs   # lanes/*.corrected.json + legal-merge.json -> compliance.json
node scripts/compliance-html.mjs   # compliance.json -> checklist.site.html
```

## What each file is

| File | What it is | Authoritative? |
|---|---|---|
| `lanes/lane-N.corrected.json` | The six research lanes **after** their adversarial audit was applied. | **Yes.** These are what the page is built from. |
| `legal-merge.json` | The decision document merged from all six corrected lanes: recommendation, 4×3 model matrix, what is closed, sequencing, questions for counsel. | **Yes.** |
| `legal-lanes.ndjson` | The six lanes **before** correction, one per line, in lane order. | No — kept as the audit trail showing what changed. |
| `legal-audits.ndjson` | The adversarial audit of each lane, same order. Each lists the defects found and their corrections. | No — evidence, not conclusions. |
| `architecture-plan.json` | The senior-tech-lead plan: the chosen architecture, milestones M0–M7, what was rejected and why, open risks. | Yes, for engineering. |
| `compliance-page-design.json` | The design specification the checklist page was built to. | Reference. |

## Two things to know before reading any of it

**The uncorrected briefs contain fabricated citations.** The audit pass found roughly one in four
load-bearing citations to be invented, misnumbered or superseded — among them a Maltese regulation
repealed in 2018 presented as the live regime, and a Montana statute cited five times for a
proposition it does not contain. That is why `legal-lanes.ndjson` is marked *not* authoritative. Read
the corrected lanes; use the raw ones only to see what was wrong.

**A first merge was produced from truncated input and has been deleted.** It claimed the India lane
and one other "arrived missing" and left every India cell blank. All six lanes did arrive; the
synthesiser was handed a 300,000-character slice of ~460,000 characters of lane data and correctly
reported that it could not see them. `legal-merge.json` is the re-run, which reads each lane from
disk. If you find a copy of the old `legal-synthesis.json` anywhere, discard it.

## Status

None of this is legal advice, and several figures in it are marked `UNVERIFIED` — meaning the
research could not confirm them and they must not enter a budget or a geofence until someone does.
The open questions are collected, numbered and deduplicated in the generated page.

The generated page is **deliberately not published**. It carries candid adverse assessments of this
product written to be useful internally, not safe at a public URL. `.github/workflows/pages.yml` has
no copy step for it, and the comment there explains why.
