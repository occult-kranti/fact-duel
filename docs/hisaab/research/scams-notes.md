# Scams & accountability lane — research notes (`hgh`)

File: `editions/hisaab/bank/scams.mjs` (`HISAAB_SCAMS`, hgh001–hgh060, all `state: 'IN'`).
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/scams.mjs` → OK (60 items;
simple/expert/extreme 20/20/20; answer slots 15/15/15/15, and 5/5/5/5 inside each difficulty).
All statuses were verified against pages read in **September 2026**; every item carries `asOf: '2026-09'`.

## Method

- Memory was used only to pick candidates. Every item's answer, figure and status comes from a page
  fetched and read in this session. The `sourceUrl` is the page that states the answer; `sources`
  holds a second (usually 2025–26) page for anyone named.
- The session's WebSearch budget ran out early, so the rest of the discovery used Google News RSS
  search plus direct fetches of the article pages. NDTV, CNBC, ThePrint (Cloudflare), Moneycontrol and
  some India Today pages refused scripted fetches. Where that happened, the item cites a page that did
  load. A few blocked URLs remain only as secondary `sources`: NDTV (hgh014), France 24 (hgh016),
  ThePrint (hgh036, hgh037, hgh051) and Business Today (hgh019).
- Wording follows §2: "accused / chargesheeted / on bail / acquitted / closed / petition dismissed".
  Every item that names someone has a `status` line and gives their denial or the clearance.
  Every question about *who* or *what happened* has non-person options: countries, agencies, amounts,
  outcomes and case titles. No distractor names a living person accused of anything.

## Sources used (primary source per item)

| id | subtopic | level | primary source |
|---|---|---|---|
| hgh001 | PNB fraud | expert | The Hindu — Explained: The case against Mehul Choksi (May 2022) |
| hgh002 | Nirav Modi extradition | simple | CNN — The rapid unraveling of a billionaire diamond dealer to the stars (9 Aug 2026) |
| hgh003 | Mehul Choksi extradition | simple | Akashvani News — Belgium's top court rejects Mehul Choksi's appeal (10 Dec 2025) |
| hgh004 | Mehul Choksi extradition | simple | The Hindu — Explained: The case against Mehul Choksi (May 2022) |
| hgh005 | Vijay Mallya | simple | Manorama — Mumbai court declares Vijay Mallya fugitive economic offender (5 Jan 2019) |
| hgh006 | Vijay Mallya | extreme | Business Standard — Rs 14,131.6 crore recovered from Vijay Mallya's asset sales: FM (18 Dec 2024) |
| hgh007 | Vijay Mallya | expert | LiveLaw — Supreme Court sentences Vijay Mallya to 4 months for contempt (11 Jul 2022) |
| hgh008 | Fugitive economic offenders | extreme | Deccan Herald (PTI) — 15 fugitive economic offenders owe Rs 58,000 cr to banks (1 Dec 2025) |
| hgh009 | DHFL bank fraud | extreme | LawBeat — DHFL bank fraud case: Supreme Court grants bail to Wadhawan brothers (17 Dec 2025) |
| hgh010 | ABG Shipyard fraud | extreme | Business Standard (IANS) — CBI files chargesheet in ABG Shipyard loan fraud case (20 Nov 2022) |
| hgh011 | Yes Bank rescue | simple | Times of India — RBI supersedes Yes Bank board, caps withdrawals at Rs 50,000 (6 Mar 2020) |
| hgh012 | Yes Bank cases | extreme | Business Standard (PTI) — Rana Kapoor gets bail, walks out of jail after 4 years (19 Apr 2024) |
| hgh013 | ICICI–Videocon case | expert | Bar & Bench — CBI's arrest of Chanda Kochhar was illegal: Bombay High Court (6 Feb 2024) |
| hgh014 | Rafale deal | simple | Times of India — Supreme Court dismisses pleas seeking review of Rafale judgment (14 Nov 2019) |
| hgh015 | Rafale deal | extreme | Hindustan Times — Rafale deal 2.9% cheaper than UPA-era deal, says CAG (13 Feb 2019) |
| hgh016 | Rafale deal | simple | Free Press Journal — French judge opens criminal investigation into Rafale deal (3 Jul 2021) |
| hgh017 | Adani–Hindenburg | extreme | LiveLaw — Supreme Court refuses SIT probe in Adani-Hindenburg case (3 Jan 2024) |
| hgh018 | Adani–Hindenburg | expert | The New Indian Express — SEBI gives clean chit to Adani Group in the Hindenburg case (18 Sep 2025) |
| hgh019 | Adani US case | simple | Outlook India — US court dismisses criminal charges against Gautam Adani (11 Aug 2026) |
| hgh020 | Adani–Hindenburg | simple | Times of India — Why did Hindenburg Research shut down? (16 Jan 2025) |
| hgh021 | Adani–Hindenburg | expert | LiveLaw — Prima facie 'no regulatory failure', says SC expert committee (19 May 2023) |
| hgh022 | Lokpal | expert | The Hindu — Lokpal gives clean chit to Madhabi Puri Buch in Hindenburg case (28 May 2025) |
| hgh023 | NEET-UG 2024 | simple | Supreme Court Observer — SC refuses to cancel NEET UG 2024 (23 Jul 2024) |
| hgh024 | NEET-UG 2026 | simple | The Hindu — NEET UG 2026: over 2.7 lakh candidates skipped re-test (17 Jul 2026) |
| hgh025 | Anti-paper-leak law | extreme | PRS Legislative Research — Public Examinations Amendment Bill, 2026 (Jul 2026) |
| hgh026 | Pegasus spyware | extreme | The Hindu — Malware found in 5 phones, no proof of Pegasus: panel (25 Aug 2022) |
| hgh027 | CBI and politicians | expert | The Indian Express — From 60% in UPA to 95% in NDA: Opposition leaders in CBI net (20 Sep 2022) |
| hgh028 | ED and politicians | simple | The Indian Express — Since 2014, 4-fold jump in ED cases against politicians; 95% from Opposition (21 Sep 2022) |
| hgh029 | ED and politicians | extreme | The Indian Express — ED driven by legal mandate, evidence: official responds (5 Apr 2024) |
| hgh030 | Defections under probe | expert | The Indian Express — 25 Opposition leaders facing probes crossed over to BJP, 23 got reprieve (3 Apr 2024) |
| hgh031 | PMLA convictions | simple | LiveLaw — 2 convictions in 193 ED cases against political leaders (19 Mar 2025) |
| hgh032 | PMLA convictions | expert | The New Indian Express — ED marks 70th anniversary with record attachments (1 May 2026) |
| hgh033 | PMLA law | expert | Hindustan Times — Why the Supreme Court will take another look at its 2022 PMLA verdict (21 Aug 2026) |
| hgh034 | ED leadership | expert | LiveLaw — Supreme Court invalidates extensions of ED Director's term (11 Jul 2023) |
| hgh035 | CBI general consent | extreme | The South First (PTI) — 10 states withdraw general consent to CBI: Centre (20 Dec 2023) |
| hgh036 | CVC report | extreme | The Hindu — 7,229 CBI cases under PC Act pending trial; 409 for over 20 years (1 Sep 2026) |
| hgh037 | Lokpal | expert | The Hindu — Lokpal disposed of 68% complaints without any action: panel report (4 Apr 2023) |
| hgh038 | Lokpal | simple | Hindustan Times — Lokpal withdraws tender for 7 BMW cars after furore (2 Jan 2026) |
| hgh039 | Lokpal | expert | The Hindu — Justice P.C. Ghose appointed first Lokpal (19 Mar 2019) |
| hgh040 | Bank fraud data | extreme | The Indian Express — Bank frauds amount rises 46% to Rs 48,000 crore in FY26 (29 May 2026) |
| hgh041 | Bank fraud rules | expert | LiveLaw — Banks must hear borrowers before classifying accounts as fraud: SC (27 Mar 2023) |
| hgh042 | Wilful defaulters | extreme | Moneylife — India's wilful default crisis laid bare in Parliament (17 Mar 2026) |
| hgh043 | ED asset attachments | extreme | The New Indian Express — ED marks 70th anniversary with record asset attachments (1 May 2026) |
| hgh044 | Sahara refunds | extreme | Economic Times — Rs 8,800 crore refunded to over 40 lakh Sahara depositors (17 Mar 2026) |
| hgh045 | AgustaWestland | simple | The Wire — Jail for Christian Michel, joint venture for Adani revives AgustaWestland ghosts (17 Feb 2026) |
| hgh046 | AgustaWestland | simple | India Legal — SC grants Centre three weeks to respond to Christian Michel plea (24 Jul 2026) |
| hgh047 | 2G spectrum case | expert | Hindustan Times — Kejriwal acquittal: challenge may spark 2G case back into life (28 Feb 2026) |
| hgh048 | 2G spectrum case | simple | Hindustan Times — Kejriwal acquittal: challenge may spark 2G case back into life (28 Feb 2026) |
| hgh049 | Coal block allocation | extreme | LiveLaw — Supreme Court quashes 214 coal blocks allocated since 1993 (24 Sep 2014) |
| hgh050 | Coal block allocation | expert | The Wire — Coal block acquittal raises hard questions about prosecuting bureaucrats (28 Mar 2026) |
| hgh051 | Commonwealth Games 2010 | expert | The Hindu — Court accepts ED's closure report in 2010 CWG case (29 Apr 2025) |
| hgh052 | National Herald case | expert | The New Indian Express — Sonia, Rahul term ED's plea in National Herald case an 'abuse of process' (22 Sep 2026) |
| hgh053 | INX Media case | extreme | The News Minute — No charge framed against me: P Chidambaram walks out of Tihar (5 Dec 2019) |
| hgh054 | Sterling Biotech case | expert | India Today — Supreme Court closes Sandesara fraud case after settlement (14 Apr 2026) |
| hgh055 | Anil Ambani group probe | simple | Verdictum — SC criticises ED for 'unexplained delay' in Anil Ambani group case (4 Feb 2026) |
| hgh056 | Sanjay Bhandari case | expert | The Hindu — UK court refuses India permission to appeal Bhandari extradition discharge (8 Apr 2025) |
| hgh057 | Lalit Modi | simple | The Hindu — Vanuatu PM orders cancellation of Lalit Modi's passport (10 Mar 2025) |
| hgh058 | IL&FS collapse | extreme | Economic Times — IL&FS: the crisis that has India in panic mode (1 Oct 2018) |
| hgh059 | PACL investor refunds | simple | Outlook Money (PTI) — ED restitutes Rs 15,000-crore worth assets in PACL 'fraud' case (31 Mar 2026) |
| hgh060 | NSE co-location case | extreme | The New Indian Express — SC allows NSE and SEBI to settle co-location dispute (18 Sep 2026) |

## Items dropped, and why

| candidate | why dropped |
|---|---|
| Electoral bonds; Delhi excise, Vyapam, MUDA, WB SSC, Mahadev app, Saradha, Narada | Out of lane (elections lane / state lanes). |
| Bank loan write-offs (₹10 lakh crore of corporate loans in 12 years, Aug 2026) | Verified (The Wire/PTI), but dropped to avoid duplicating the spending lane's write-off item (₹16.35 lakh crore over 10 years). Replaced by ED attachments (hgh043). |
| US indictment of the Adanis: the "$265 million bribes" allegation as its own question | The charges were dismissed with prejudice (10 Aug 2026) and never tested at trial. The allegation now appears only as context in hgh019's explanation, next to the dismissal and the denial. |
| Chanda Kochhar: the SAFEMA tribunal's "₹64 crore bribe" finding as its own question | This is an appellate finding in an asset-attachment case, not a criminal verdict, and headlines calling it "found guilty" mislead. It stays in hgh013's explanation and is marked as under challenge in the Bombay HC. |
| Karvy Stock Broking (SEBI 7-year ban, Apr 2023) | Verified (ET), but the latest appeal status could not be checked. Cut for space. |
| Mahua Moitra: Lokpal sanction in the cash-for-query case (SC stay, Mar 2026) | Fast-moving and pending for a named MP. It is also closer to the elections lane. |
| Anil Ambani: SBI's "fraud" tag on RCom | Only one Ambani-group item was kept (hgh055, SC's SIT direction). The case is moving weekly: a new CBI FIR was filed on 18 Sep 2026. |
| Jet Airways / Naresh Goyal; Rotomac; Bhushan Steel | No current source read. Not verified. |
| PNB "Brady House branch", CAG coal "₹1.86 lakh crore" | Not found in any page read. Not used. |
| Pegasus: "government neither confirmed nor denied buying it" | No page read states it. hgh026 uses only the CJI's reading of the report ("not cooperative"). |
| Cyber-fraud losses 2025 | The only figure found covers senior citizens and women (₹7,769 crore), not the total. |
| Satyam (2015), NSEL (2013) | Outside the 2014–26 focus, and the lane already has enough pre-2014 context. |
| Separate item on Nirav Modi's FEO declaration (Dec 2019) | Covered by hgh008 (FEO count) and hgh002. |

## Status could change soon (re-check before each release)

- **hgh002 Nirav Modi.** The ECHR route closed in July 2026 (reported by Indian media; the ECHR told CNN nothing was pending in his name). MEA says extradition follows "once proceedings conclude". He could be flown to India any week, and then the answer changes.
- **hgh001, hgh003, hgh004 Mehul Choksi.** Belgian courts cleared extradition (Oct and Dec 2025). The Belgian justice minister's decision was pending in Sept 2026. The Wire reports two more appeal levels plus the ECHR.
- **hgh005–hgh007 Vijay Mallya.** His FEO-Act challenge is in the Bombay HC. In Dec 2025 the SG said UK extradition was "nearing finalisation".
- **hgh009 DHFL.** SC bail in Dec 2025; the trial has 736 witnesses.
- **hgh010 ABG Shipyard.** No development found since the Nov 2022 chargesheet and the Dec 2022 bail (which the CBI challenged). The "no verdict reported" status needs a fresh look.
- **hgh012 Rana Kapoor.** New complaints from May–Aug 2026 are under probe.
- **hgh013 Kochhar.** Their Bombay HC challenge to the tribunal's attachment order is pending.
- **hgh016 Rafale (France).** The Wire (Feb 2026) says the probe continues. No outcome is known.
- **hgh019 Adani (US).** Charges against the Adanis were dismissed on 10 Aug 2026. The judge put off a decision on the five other (absent) defendants. The SEC settlements are final.
- **hgh024 NEET-UG 2026.** CBI probe ongoing. Chargesheets or arrests may follow.
- **hgh033 PMLA review.** A new bench was formed in Aug 2026; no hearing date yet. A ruling would change the item's premise.
- **hgh045, hgh046 AgustaWestland / Christian Michel.** His SC plea for release is pending (Centre given 3 weeks on 24 Jul 2026).
- **hgh047, hgh048 2G.** CBI appeal pending in the Delhi HC.
- **hgh049, hgh050 Coal.** More coal-case verdicts keep coming, and H.C. Gupta's appeals against his convictions are pending.
- **hgh052 National Herald.** ED revision listed in the Delhi HC for 12 Oct 2026.
- **hgh053 INX Media.** The ED is pressing for trial. Charges may be framed.
- **hgh055 Anil Ambani group.** Multiple FIRs, an ED SIT and two ex-executives arrested (June 2026). High churn.
- **hgh056 Sanjay Bhandari, hgh057 Lalit Modi.** FEO or asset steps may follow. Lalit Modi's Vanuatu court challenge is pending.
- **hgh044 Sahara refunds.** The payout window runs to 31 Dec 2026, so the figure grows monthly.
- **hgh035 CBI general consent.** The list changes when state governments change.

## Contested, or needs reviewer attention

- **Agency bias (hgh027–hgh032).** The Indian Express findings (95% Opposition; 23 of 25 defectors got relief) are paired with the government's rebuttal: 149 of ~6,260 PMLA cases involve politicians (hgh029), and the ED claims ~94% conviction in completed trials (hgh032). On the other side sits Parliament's own "2 convictions in 193 cases" (hgh031). hgh030 deliberately names none of the 25 politicians.
- **Adani (hgh017–hgh021).** Every item states the group's denial and the regulatory or court outcome (SC Jan 2024, SEBI Sept 2025, US dismissal Aug 2026). No item asserts that the allegations were true.
- **Rafale (hgh014–hgh016).** Two SC dismissals and a CAG "2.86% cheaper" finding sit against an open French inquiry. The CAG item includes the Congress's conflict-of-interest objection, without naming the auditor.
- **Pegasus (hgh026).** "Not cooperative" is the CJI's oral reading of a sealed report (The Hindu, 25 Aug 2022). It is attributed to him as such.
- **Sandesara (hgh054).** The SC quashed the criminal cases after a settlement. We found no sourced critique of the "pay and close" precedent, so none is included.
- **`people` field.** It also lists officials who are not accused, because they are quoted: Nirmala Sitharaman (hgh006), Pankaj Chaudhary (hgh008), Subramanian Swamy as complainant (hgh052). Their `status` lines are written about the accused, not about them.
- **`govt` tags.** NDA 58, UPA 2 (hgh045 is the 2010 AgustaWestland order and hgh048 the 2010 CAG 2G estimate). Several UPA-era cases (2G, coal, CWG, INX, National Herald) are tagged NDA because the fact asked about (acquittal, appeal, closure, arrest) happened after 2014. Accused people and parties are spread across the spectrum: Congress-era ministers, NDA-era agencies and regulators, and private promoters.
- **Topic choice.** The National Herald case (hgh052) is filed under `Media & Speech` because it concerns a newspaper's holding company. INX Media is under `Governance & Institutions` because it is about FIPB clearance.

## Fact audit (26 Sep 2026)

Independent release-gate audit of all 60 items. Every `sourceUrl` and every `sources` URL was fetched
and read (curl + text extraction; WebFetch for pages that refuse scripts). Newest reporting to 26 Sep
2026 was searched through Google News RSS for every item with people, a `status` or `kind: 'scam'`.
The whole bank validates OK and `node --test tests/hisaab-*.test.mjs` passes. **No item was dropped**;
ids, `correctIndex` slots (15/15/15/15) and difficulty split (20/20/20) are unchanged.

### `otherSide` added (42 items)

All 38 items that need one (people, status or scam) now carry `otherSide`, each taken from a page that
was read: hgh001–hgh010, hgh012–hgh014, hgh016–hgh020, hgh022–hgh024, hgh026, hgh042, hgh045–hgh057,
hgh059, hgh060. Optional ones were added where an agency or party reply exists: hgh015 (Congress
conflict-of-interest objection), hgh027 (CBI official: "merely a coincidence"), hgh028 (ED official:
cannot register cases on its own), hgh030 (CBI/ED officials). Two say no reply was found after a search:
hgh009 (no public reply from the Wadhawans; uses the SC's bail reasoning) and hgh059 (no reply from
PACL; uses the Delhi HC's May 2026 attachment ruling).

### Factual corrections

| id | what was wrong | fix and source |
|---|---|---|
| hgh049 | "five convictions so far, with sentences stayed by the Delhi HC" is not supported by any source read; The Wire (28 Mar 2026) says at least 19 convictions in 27 decided coal cases | Explanation and status rewritten on The Wire's figures; added the Hindu (19 Aug 2026: SC tells Delhi HC to decide coal appeals) and TOI (30 Jul 2026: SC quashes the 2015 summons to ex-PM Manmohan Singh, added to `people` and `otherSide`) |
| hgh054 | Stem said the SC "closed the criminal cases" in April 2026 and that the brothers "left India in 2017"; explanation said they "had been declared fugitive economic offenders". The primary source (India Today) refuses fetches. ETLegal (23 Dec 2025) shows the criminal, ED and FEO-Act cases were quashed in Dec 2025; the April 2026 order closed the matter with finality | Stem re-dated to the April 2026 final closure without the unsourced exit year; explanation now gives the Dec 2025 quashing, the ₹5,111.43 crore deposit, ~₹9,800 crore total recovery vs ₹5,383 crore FIR, and the banks' ₹19,283.77 crore dues claim (IE, 19 Mar 2026). New `sourceUrl`: ETLegalWorld (ANI), 16 Apr 2026 |
| hgh058 | Source (ET, 1 Oct 2018) does not mention the NCLT supersession; "205 of 302 group entities" is not in the CNBC-TV18 page | New `sourceUrl`: TOI (PTI), 1 Oct 2018 (NCLT supersession, ~₹91,000 crore debt); explanation says "over 200 group companies" per CNBC-TV18 |
| hgh034 | Stem said the SC held "the third extension" illegal; LiveLaw says the Nov 2021 and Nov 2022 extension orders were both held illegal | Stem now says "the 2021 and 2022 extensions" |
| hgh032 | "(19 persons in FY26)" — the NIE page says 19 convicted "during the current fiscal year", which on 1 May 2026 is ambiguous | Removed the figure |
| hgh059 | "Promoter died in Aug 2024" — no page read gives the date | Now "has since died" (source: "late promoter") |
| hgh019 | "bribes … promised to Indian state officials" | Now "Indian government officials" (Business Today); DOJ timing reworded to match Outlook ("said in May 2026 it would drop the case, later calling it primarily foreign") |
| hgh014 | "Petitioners had alleged irregularities in pricing and the choice of offset partner" is not in the TOI source; NDTV secondary refuses fetches | Explanation rewritten to what TOI states (FIR/probe sought; "roving inquiry" not appropriate; one judge concurred separately); NDTV dropped, The Wire (Feb 2026) added |
| hgh023 | Stem said "a proven paper leak" (reads as a finding of guilt); explanation said a re-test "would hurt lakhs of honest candidates" (not in source) | "a leak confirmed at some centres"; explanation uses the SC's "cascading effects" wording |
| hgh025 | "allows seizure of offenders' property" | "convicted offenders' property" (Akashvani) |
| hgh030 | ED official quoted as saying it "cannot proceed" once the base FIR is closed | Source says it becomes "difficult" to proceed; fixed |
| hgh029 | CBI share given as "about 1%" | Source says "approximately 1/1.5 per cent"; now "about 1–1.5%" |
| hgh048 | "('presumptive')" is not the source's word | Now "a notional loss" (HT) |
| hgh036 | "released Sept 2026" | "reported in Sept 2026" (The Hindu, 1 Sep 2026) |
| hgh016 | Missing that the PNF moved after a complaint by the NGO Sherpa | Added (France 24, read via WebFetch) |

### Status updates from the newest reporting (to 26 Sep 2026)

- **hgh009 DHFL:** a special CBI court ordered charges framed against the Wadhawans (ET, 1 Aug 2026). Status and explanation updated.
- **hgh010 ABG Shipyard:** a Delhi court took cognisance of the chargesheets (BS, 13 Aug 2025); ex-chairman denies wrongdoing (Mint, 1 Aug 2026).
- **hgh013 Kochhar:** Bombay HC stayed the tribunal order upholding ED's attachment (HT, 13 May 2026).
- **hgh017/hgh018/hgh020 Adani–Hindenburg:** five group firms settled separate SEBI disclosure/audit cases for ₹1.5 crore without admitting or denying findings (LawStreet, 23 Sep 2026).
- **hgh019 Adani US case:** the judge refused on 4 Sep 2026 to drop charges against the five co-defendants (The Wire, 5 Sep 2026).
- **hgh022 Buch:** Bombay HC quashed a separate ACB-court FIR order over a 1994 listing (BS, 8 Jul 2026).
- **hgh023 NEET 2024:** Patna special CBI court framed charges against 52 accused; trial from 1 Oct 2026 (TOI, 25 Sep 2026).
- **hgh024 NEET 2026:** CBI chargesheeted 13 accused; Delhi fast-track court took cognisance (Mid-day, 19 Aug 2026).
- **hgh026 Pegasus:** SC hearing of 29 Apr 2025 (The Hindu) added; no 2026 hearing found.
- **hgh005–hgh007 Mallya:** Feb 2026 statement that he cannot return (DH); ED's 8 Sep 2026 affidavit that recovery does not end the PMLA case (LawBeat, 12 Sep 2026); Bombay HC hearing of 22 Sep 2026 (Bar & Bench).
- **hgh052 National Herald:** Delhi Police EOW registered a fresh FIR against the Gandhis on 3 Oct 2025 (TNM, 16 Dec 2025); added to status and explanation.
- **hgh054 Sandesara:** see corrections. **hgh057 Lalit Modi:** SAFEMA tribunal set aside most ED FEMA penalties (LawBeat, 23 Jul 2026).
- **hgh059 PACL:** Delhi HC quashed some ED attachments (LiveLaw, 15 May 2026).
- Checked with no change found: hgh002/hgh003 (no extradition yet; Belgian minister undecided), hgh012, hgh016, hgh033 (no hearing date), hgh045/hgh046 (SC listed Michel's plea for 25 Aug 2026; no ruling reported), hgh047/hgh048 (2G appeal pending), hgh053, hgh055 (fresh CBI FIR, 18 Sep 2026, already covered), hgh056.

### Giveaway fixes (answers of other items that were stated in this lane)

| item re-angled | leaked answer of | change |
|---|---|---|
| hgh005 | itself leaked by hgh008's stem ("declared 'fugitive economic offenders' under the 2018 Act") and hgh006/hgh007 statuses | Re-angled: now asks what an FEO declaration lets the government do (confiscate property; india.com and Manorama). Same slot (1) and difficulty |
| hgh056 | new hgh005 answer | Removed "allowing his assets to be confiscated" |
| hgh047 | media.mjs 2G item states the appeal was admitted in March 2024 and pending, and hgh048 says the appeal is pending | Re-angled: now asks what the Delhi HC said when admitting the appeal ("some contradictions" needing deeper examination, HT 28 Feb 2026). Same slot (3); year 2026 → 2024 |
| hgh001, hgh004 | hgh002 (UK prison) and hgh003 (Belgium) | "fighting extradition from the UK and Belgium" → "contesting extradition"; statuses now say "in custody abroad" |
| hgh016 | hgh014 (SC dismissed the Rafale reviews) | Removed "the Supreme Court dismissed pleas for a probe in 2018 and 2019" from explanation and status |
| hgh017, hgh020 | hgh018 (SEBI closed proceedings without penalty) | "SEBI closed key related-party proceedings" → "SEBI passed final orders" |
| hgh018 | hgh019 (US case dismissed) and hgh020 (Hindenburg shut down) | Dropped both from status/explanation |
| hgh023 | hgh024 (NTA cancelled NEET-UG 2026) | Removed "In 2026 the NTA did cancel NEET-UG" |
| hgh025 | hgh024 | Stem "After the NEET-UG 2026 cancellation" → "After the NEET-UG 2026 leak row" |
| hgh029 | hgh031 (2 convictions) | Removed "convictions of two ex-ministers" |
| hgh037 | hgh039 (first Lokpal appointed March 2019) | Stem "since it began work in 2019" → "since it started functioning"; "since 2019-20" → "in four years" |
| hgh040 | hgh041 (banks must hear borrowers) | "after the SC's ruling on hearing borrowers" → "to comply with a 2023 Supreme Court judgment" |

A scripted cross-bank check (every answer's figures and full text against every other item's question,
explanation, status, otherSide and outcome) found no other topical leak into or out of this lane; the
remaining hits are coincidental figures in unrelated items (for example ₹50,000 caps).

### Unresolved, for the reviewer

- **hgh027 / hgh028** both have 95% as the answer (CBI and ED). hgh027's explanation states the CBI's 95%, which can nudge a player on hgh028 by analogy. Both are the reported facts, so they were left.
- **hgh032** keeps "About 6%" as a distractor. It is wrong for the question (the ED's May 2026 claim of ~94%), but LiveLaw's reading of Dec 2024 Parliament data gives a 6.42% rate on another measure. Consider a different distractor if players complain.
- **hgh036** ("409") and **hgh060** ("₹625 crore") use real figures for other measures as distractors; both are wrong for the question asked.
- **hgh049:** TOI (30 Jul 2026) says the SC cancelled "204 of 218" blocks; LiveLaw (2014) and The Hindu (19 Aug 2026) say 214. Kept 214.
- **hgh003:** The Wire (9 Sep 2026) mentions an April 2026 Antwerp court step addressed to the justice minister, but the sentence was truncated in the fetched page. The item does not depend on it.
- **Out of lane:** `states-west-south.mjs` **hst255** (AP–SECI solar deal) still gives the US case status as "Allegations in a US SEC complaint and US indictment (Nov 2024), untested in court". The criminal charges against Gautam and Sagar Adani were dismissed with prejudice on 10 Aug 2026 and the SEC claims were settled (Outlook, 11 Aug 2026; see hgh019). That lane's owner should update it.
- **Blocked pages:** India Today and NDTV refuse both curl and WebFetch. hgh054's India Today source was replaced; hgh014's NDTV secondary was dropped. ThePrint and France 24 pages were read through WebFetch and kept.
