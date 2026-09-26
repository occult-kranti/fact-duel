# States — North & Hindi belt: research notes

Lane file: `editions/hisaab/bank/states-north.mjs` (`HISAAB_STATES_NORTH`, ids `hst100`–`hst161`).
Researched and status-checked in September 2026; every item carries `asOf: '2026-09'`.

Validator (`node scripts/hisaab-validate.mjs editions/hisaab/bank/states-north.mjs`): **OK, no problems.**
The whole bank (`node scripts/hisaab-validate.mjs`) and `node --test tests/hisaab-*.test.mjs` (29/29) also pass.

## Counts

| state | items | ids |
|---|---|---|
| DL | 7 | hst100–hst106 |
| PB | 6 | hst107–hst112 |
| HR | 6 | hst113–hst118 |
| HP | 6 | hst119–hst124 |
| UP | 6 | hst125–hst130 |
| UT | 6 | hst131–hst136 |
| JK | 6 | hst137–hst142 |
| RJ | 6 | hst143–hst148 |
| BR | 7 | hst149–hst155 |
| JH | 6 | hst156–hst161 |
| **total** | **62** | |

- Difficulty: simple 21, expert 22, extreme 19 (each ≥ 25%).
- Kind: spend 22, scam 22, scheme 11, institution 7.
- correctIndex spread: 13 / 15 / 19 / 15.

## The `govt` convention in this lane (please apply the same reading when auditing)

`govt` names whoever ran the **state** when the thing the item is *about* happened:

- scheme / spend / institution items → the government that ran, budgeted or presided over it;
- case (`scam`) items → the government in office when the **alleged conduct** happened. A later
  arrest, chargesheet or ruling by a different government is carried in `status`, and `year` is the
  year of the event the question asks about.

So Majithia (hst110, alleged 2007–17, arrested 2025 under AAP) is `Other` (SAD–BJP; SAD is not in
GOVTS); Hooda/Manesar (hst113, 2004) is `INC`; the Rajasthan SI exam (hst143, held 2021) is `INC`
although it was cancelled under the BJP; land-for-jobs (hst150) is `UPA` because the Railway jobs
were a Union-ministry matter in 2004–09. J&K under a Lieutenant Governor (2018–Oct 2024) is
`President's Rule`; the National Conference government (Oct 2024–) and the multi-government Roshni
scheme are `Other`. Bihar items before 15 Apr 2026 are `JDU` (Nitish Kumar as CM, with the BJP except
in 2022–24, when the JD(U)–RJD government was in office — hst154 is from that spell). **Samrat
Choudhary (BJP) became Bihar CM on 15 Apr 2026**, so any new Bihar item after that date is `BJP`.

### Distribution

| govt | total | scam | spend | scheme | institution |
|---|---|---|---|---|---|
| BJP | 17 | 4 | 8 | 3 | 2 |
| INC | 13 | 6 | 4 | 3 | 0 |
| AAP | 11 | 3 | 5 | 2 | 1 |
| JDU | 6 | 1 | 3 | 1 | 1 |
| JMM | 6 | 3 | 1 | 1 | 1 |
| President's Rule | 4 | 1 | 1 | 0 | 2 |
| Other (SAD–BJP, NC, multi-govt) | 3 | 2 | 0 | 1 | 0 |
| SP | 1 | 1 | 0 | 0 | 0 |
| UPA | 1 | 1 | 0 | 0 | 0 |

Balance notes: BJP-run states contribute exam-leak and governance items (UP constable and RO/ARO
leaks, UKSSSC 2025 leak, HPSC cash-for-marks, HPSC 151-of-613 result, Ganga Expressway cave-in) as
well as neutral budget facts. INC items include scams from its governments (Manesar, HP scholarships,
Rajasthan SI/RPSC/JJM, 2016 Uttarakhand exam) *and* its schemes (OPS in HP and RJ, Chiranjeevi). AAP
items include the CAG audits and cases *and* its schemes (pink ticket, ₹10 lakh health cover), plus
the case against its own minister that police later sought to close (hst107). Where a case is
against an opposition figure, the item says so and records their denial (Majithia: "political
vendetta"; Lalu family: "politically motivated"; Soren: "hearsay"; Alam: "innocent").

## Method and sources

WebSearch was used until the session's search budget ran out; after that, discovery used Google News
RSS (headlines and dates only), ThePrint's site search (PTI wire copy), The Hindu's dated sitemaps
(`/sitemap/archive/all/YYYYMMDD_1.xml`) and PRS budget PDFs, and each page was then read in full with
WebFetch or curl. No reddit or mirrors were touched.

Primary / preferred sources used:
- **PRS Legislative Research state budget analyses 2025-26** for all ten states (debt, committed
  spending, subsidy and scheme allocations): hst106, hst108, hst109, hst115–117, hst124, hst129,
  hst136, hst140, hst141, hst148, hst155, hst159, hst161.
- **Court coverage with dates**: SC Observer / SCC Online (Kejriwal bail, discharge revision),
  The Hindu (Article 370, Roshni, Rajasthan SI, land-for-jobs), ThePrint/PTI (Soren, Manesar).
- **CAG reports as reported**: The Tribune / AIR (Delhi excise, CM residence, mohalla clinics).
- **All India Radio (newsonair.gov.in)** for the Punjab anti-drug drive and Majithia arrest/chargesheet.
- Established outlets otherwise: The Hindu, ThePrint (PTI), The Tribune, Al Jazeera, Business Today,
  India TV, ETV Bharat.

Weaker sources used only as secondary links (flag for review): `socialnews.xyz` (IANS/wire copy;
hst101, hst102 second source; hst106 second source), `aninews.in` (hst103 second source; returns 403
to bots but the text was read via search), AAP's own press release (hst100, for its response).
`businesstoday.in` returns 403 to curl but was read via WebFetch.

All 79 URLs were checked with curl on 25 Sep 2026: all return HTTP 200 except Business Today (403 to
scripts, fine in a browser).

## Items dropped and why

| idea | reason |
|---|---|
| Robert Vadra — Shikohpur ED case | **Charter conflict.** The brief lists it, but §2.7 allows only public office holders, candidates and public companies' executives; Vadra is a private businessman. Verified facts were ready (ED chargesheet Jul 2025, cognisance 15 Apr 2026, pre-arrest bail 16 May 2026, denial) — the team lead can decide; it can go back in if §2.7 is read to cover him. |
| Harish Rawat's aide — ED cash seizure (Sep 2026) | Too fresh (12 Sep 2026); Rawat is not an accused; any question would point at him. |
| Kiru hydro case / Satya Pal Malik | Chargesheet May 2025, but he died in Aug 2025 (case abates against him); he had himself alleged he was offered bribes. Too contested to reduce to a quiz line. |
| UP 69,000 teacher recruitment | The dispute is about reservation arithmetic by caste category — outside "no caste content". |
| NRHM scam (UP), fodder scam (BR) | Mostly outside the 5–12 year window; fodder would also have made Lalu Prasad the subject of two items. |
| Uttarakhand Assembly back-door appointments (228 cancelled, 2022) | Could not reach a deep-linkable article (Indian Express/HT IDs not discoverable once search ran out). Worth adding later; notably the appointments spanned INC and BJP Speakers. |
| Haryana Parivar Pehchan Patra | No fetchable source for current numbers. |
| Punjab ex-minister Sadhu Singh Dharamsot (INC) | ED arrest Jan 2024 verified (ThePrint), but his Apr 2025 Supreme Court bail was only seen as a headline. Good INC-era Punjab item to add once sourced. |
| Delhi DTC cumulative losses (₹60,741 crore, CAG 2022, via PRS) | Dropped only to keep Delhi from dominating; sourced in the PRS Delhi PDF if needed. |
| Kejriwal/Sisodia separate arrest-and-bail items | Merged into hst101 and hst102 to avoid three near-duplicate cards. |
| Bihar 2016 prohibition — Saran Dec 2022 death toll | Tolls differ widely by source and date; used the official 190 "confirmed" figure (hst151) instead. |

## Contested items (reviewer, please read these closely)

- **hst101 / hst102 (Kejriwal, Sisodia)** — Discharged by the trial court on 27 Feb 2026; CBI revision
  pending; the HC stayed the trial court's remarks against the investigating officer. The
  explanation says "not convicted" and gives the court's reasoning. Next HC hearing 5–6 Oct 2026 —
  **re-check in October**.
- **hst100 / hst103 / hst105 (CAG audits of AAP-era Delhi)** — Tabled by the successor BJP government;
  AAP's response is included for the excise audit (it says most chapters faulted the old policy) and
  the CM-residence audit (says the BJP made false claims). No AAP response to the mohalla-clinic
  findings was found; the explanation notes who tabled it and when.
- **hst107 (Vijay Singla)** — Police filed a cancellation report (Jun 2025) saying voice samples did not
  match; whether the Mohali court accepted it is **not confirmed**. Wording is careful not to say he
  was cleared.
- **hst110 (Majithia)** — Figures differ between outlets (₹540 crore in AIR/most reports; one Tribune
  passage mentions ₹790 crore). Used ₹540 crore.
- **hst113 (Hooda, Manesar)** — The Supreme Court has *stayed* charge-framing against Hooda (17 Nov
  2025); charges were framed only against other accused. The item says so.
- **hst144 (RPSC member, 2022 teacher exam)** — The member is not named in the item. His 2026 bail
  status (SC interim bail Feb 2026, revoked Mar 2026) was seen only in TOI/Bhaskar headlines; status
  line says "per reports".
- **hst145 (Mahesh Joshi)** — The ₹900 crore figure is PTI's description; his "conspiracy" denial is
  from a TOI headline (Apr 2025). HC bail refusal (Aug 2026) is from an ETV Bharat headline.
- **hst149 (Srijan)** — Names Nitish Kumar and Rabri Devi only as the targets of rival parties'
  blame; the status line records that no politician is charged in sources checked.
- **hst150 (land-for-jobs)** — Counts of those charged/discharged differ (The Hindu: family + 42;
  ThePrint/PTI: 41 charged, 52 discharged), so no number is used.
- **hst154 (Aguwani bridge)** — Names Tejashwi Yadav only as the minister in charge who promised
  action; `status` says no case against any minister was reported.
- **hst156 (Hemant Soren)** — Fast-moving: charge-framing listed 30 Sep 2026 — **re-check in October**.
- **hst158 (Alamgir Alam)** — The person from whose flat cash was seized (a domestic help) is a
  private individual and is not named.

## Statuses at risk of going stale (re-verify monthly)

| id | status as written | watch for |
|---|---|---|
| hst101, hst102 | CBI revision pending in Delhi HC; arguments 5–6 Oct 2026 | HC order on revision; PMLA case revival |
| hst107 | cancellation report filed Jun 2025 | Mohali court acceptance/rejection |
| hst110 | on SC bail since Feb 2026; trial pending | framing of charges |
| hst113 | SC stay on charges against Hooda (Nov 2025) | SC decision on stay |
| hst114 | officer on bail; trial pending | verdict |
| hst122 | HC attachment order (Nov 2024) | appeal/stay or payment — not checked after Nov 2024 |
| hst125, hst126 | prosecutions pending | chargesheets / verdicts |
| hst132 | exam cancelled; CBI probe recommended | re-test date, CBI chargesheet |
| hst133 | 2016 exam case pending | trial outcome |
| hst138 | CBI probe ordered Oct 2020 | **later history not verified** — highest stale risk in the lane |
| hst139 | CBI chargesheet 2022, ED probe | trial |
| hst143 | re-exam held 20 Sep 2026 | results |
| hst144 | custody status per reports | bail / trial |
| hst145 | in judicial custody (ACB case) | bail, chargesheet (ACB filed a 3,000-page chargesheet Jul 2026 per a headline — not used) |
| hst150 | CBI trial; ED charge-framing 30 Sep 2026 | ED charges |
| hst156 | charge-framing 30 Sep 2026 | framing of charges; HC appeal |
| hst157 | bail; reinstated | trial |
| hst158 | SC bail May 2026 | trial |
| hst106 | first ₹2,500 instalment promised around Raksha Bandhan 2026 | whether payments actually began |

## Things the reviewer should double-check

1. **hst133** — the 2016 exam and its result (30 Mar 2016) straddle the start of President's Rule in
   Uttarakhand (27 Mar 2016). `govt: 'INC'` assumes the exam itself was held before that date; The
   Hindu gives only "March 2016".
2. **hst104** — "8.5 lakh regular women riders" is Al Jazeera's launch-day figure, not an audited count.
3. **hst112** — arrest/FIR numbers are the Punjab government's own; later cumulative figures (60,000+
   FIRs) were seen only on non-established sites and were not used.
4. **hst146** — options include Chhattisgarh, which restored OPS weeks later (Mar 2022); the stem's
   "February 2022 … budget" makes Rajasthan the only correct answer.
5. **hst142** — The Hindu's explainer also lists other subjects outside the Assembly's practical reach;
   the distractors were picked from State List subjects the Act does not exclude.

## Fact audit (26 Sep 2026)

Independent release-gate audit of all 62 items (`hst100`–`hst161`). Every `sourceUrl` and every
`sources` URL was fetched and read (108 URLs, all HTTP 200 on 26 Sep 2026; PRS PDFs read with pypdf);
newest reporting to 26 Sep 2026 was searched (Google News RSS + WebSearch, publisher pages then
read in full) for every item that names a person, carries a `status`, or is `kind: 'scam'`.
Ids unchanged; **no items dropped**; the Robert Vadra item stays dropped (§2.7), and no other
private individual is named anywhere in the lane (accused institute owners, touts, the OSD, the
kingpin in the JKSSB case and the candidates in the UKSSSC case are described by role only).

After the audit: `node scripts/hisaab-validate.mjs` (whole bank) **OK**; `node --test
tests/hisaab-*.test.mjs` 44 pass / 0 fail. Lane difficulty is now simple 19 / expert 24 / extreme 19
(hst114 and hst144 moved simple → expert); correctIndex spread unchanged at 13/15/19/15.

### `otherSide` added (26 items)

Required on every item with `people`, `status` or `kind: 'scam'` — all 24 now carry it, each taken
from a fetched page: hst100, hst101, hst102, hst107, hst110, hst113, hst114, hst123, hst125, hst126,
hst127, hst132, hst133, hst138, hst139, hst143, hst144, hst145, hst149, hst150, hst154, hst156,
hst157, hst158. Also added (optional) to hst103 (AAP's reply on the CM residence) and hst122 (the
CM's reply on the Himachal Bhawan attachment). Three say plainly that no reply was found after a
search: hst127 (no SP reply to the Gomti probe), hst133 (no response from the arrested 2016
commission officials), hst144 (no statement from the suspended RPSC member).

### Factual fixes

| id | fix |
|---|---|
| hst113 | **Wrong answer framing.** The Aug 2004 acquisition notice came under the INLD government (Hooda became CM in Mar 2005), so "which party ran Haryana then [2004]?" → INC was wrong. Re-angled to the 24 Aug 2007 release order the CBI calls the key act (INC government, answer unchanged); `year` 2004 → 2007; status now says the SC stayed *proceedings* against Hooda. |
| hst111 | The planned 2 Oct 2025 start slipped; the scheme was actually rolled out on 22 Jan 2026 (ThePrint/PTI added). |
| hst103 | Source replaced: the Tribune piece only reported leaked findings ("according to media reports"); new `sourceUrl` The Pioneer (24 Mar 2026) on the tabled report (23 Mar 2026, 342% overrun). "Signed Nov 2024" removed (unsourced). The PAC's 14 Sep 2026 site visit was **called off** (Hans India) — explanation updated. |
| hst106 | "Renamed in July 2026" and "25 Mar" were not in the sources; stem now says "has since been renamed" (The Hindu: manifesto name, later renamed). Explanation updated with the 26 Aug 2026 sanction letters and 1 Sept payments. Endorsement rule deliberately not mentioned (it is hdb143's answer). |
| hst114 | Bail detail corrected: HC granted regular bail in the linked ED case on 21 Nov 2024 (TOI), not "2023". INLD reaction removed (not in source). |
| hst131 | "Passed in February 2023" → brought in by ordinance (Governor's assent 10 Feb 2023), later passed as an Act. |
| hst132 | Status updated: CBI chargesheeted three accused; special CBI court found grounds to frame charges (Aug 2026). |
| hst138 | Stale status fixed: the Oct 2020 judgment declared the Roshni Act void ab initio; in Jan 2026 the HC let PC Act prosecutions continue but quashed chargesheets where no corrupt intent was shown (Kashmir Observer). |
| hst139 | Off-topic second source (a JE-exam chargesheet) replaced with Daily Excelsior (Apr 2026): kingpin bailed Nov 2024, HC refused to cancel bail. |
| hst144 | Status sourced: SOG arrest Apr 2023, SC interim bail 9 Feb 2026 revoked Mar 2026, prosecution sanction Apr 2026 (TOI). |
| hst145 | Denial now sourced (TOI 25 Apr 2025 "conspiracy"); HC bail denial 13 Aug 2026 sourced to ETV Bharat; ACB chargesheet noted. |
| hst147 | Unsourced "BJP said the previous government's schemes would continue" removed; 2023 result now sourced (Mint). |
| hst149 | "Some verdicts reported in 2025" made exact: first verdict Nov 2025, three bank/collectorate staff convicted in one case (ETV Bharat). |
| hst150 | Unsourced "pleaded not guilty (Feb 2026)" removed; added SC 13 Apr 2026 (declined to quash FIR; sanction plea left to trial; personal appearance exempted). "Without public notice" removed (not in source). |
| hst152 | Unsourced "Congress called it vote-buying ('vote revdi')" replaced with the sourced RJD complaint to the EC over post-MCC payments (ThePrint/PTI). Result now sourced (HT). |
| hst154 | Status updated (show-cause notice to builder; Patna HC blamed state and contractor laxity). |
| hst156 | Status updated: HC refused to stay proceedings (18 Sep 2026); charges framed against the 16 co-accused; framing against Soren deferred to 30 Sep 2026 (HT, 25 Sep 2026). |
| hst157 | Unsourced "ED told the court she could influence the case" removed; SC declined to quash cognisance on 25 Sep 2026 (ETV Bharat). Stem now "funds allegedly diverted". |
| hst158 | Status updated: SC declined to interfere with rejection of discharge plea (16 Sep 2026). |
| hst123 | Status updated (SC set aside an accused institute chairman's anticipatory bail, 16 Jul 2026; LiveLaw). Stem now "allegedly fake claims". |
| hst125, hst126 | Status updated from vague "prosecutions pending" to the ED prosecution complaints (Jan 2025, 7 accused under trial; Jan 2026, 18 accused) (HT). |
| hst107 | Status: Mohali court reserved its decision on the closure report; no ruling found. HC bail date sourced (Tribune). |
| hst110 | "Political vendetta" moved to `otherSide`; noted no charges framed yet. |
| hst137 | Statehood still not restored (HT, 26 Sep 2026: second Assembly resolution). |
| hst104, hst119 | Election results now sourced (The Hindu 2020; Mint 2022). |
| hst105 | Tabling date (28 Feb 2025) sourced to ET (the Tribune piece was pre-tabling). |
| hst118 | Added HPSC's reply (secretary: process robust, marking transparent). |
| hst130 | Stem now dates the cave-in report (1 Sep 2026). |

### Answer giveaways removed (explanation/outcome/otherSide stating another item's answer)

| id | problem → fix |
|---|---|
| hst100, hst101 → hst102 | Both said the trial court "discharged all 23", which was hst102's answer. hst102 re-angled to the Delhi HC's March 2026 stay of the trial court's remarks against the CBI investigating officer (SCC Online); discharge now lives in status/otherSide. hst102 status no longer says "ED's" (hst101's answer). |
| hst109 | "Rajasthan at 36.5%" gave away hst148 → replaced with Himachal 40.5%. |
| hst136, hst140 | "Punjab 44.5%" gave away hst109 → removed. |
| hst161 | "Himachal: 83%" gave away hst124 → removed. |
| hst111 | "₹20,500 crore power subsidy" gave away hst108 → removed. |
| hst159 | "₹13,363 crore" gave away hst161 → removed; hst161 re-angled to the 11% share because ₹13,363 crore is also stated by dist-north hdb135/hdb137. |
| hst125 | Named the RO/ARO cancellation (hst126's answer) → rephrased as "a second state recruitment paper". |
| hst143 → hst144 | hst143 names the RPSC (hst144's answer) three times → hst144 re-angled to the ₹60 lakh the SOG alleged (Hindu). |
| hst118 → hst114 | hst118 names the HPSC (hst114's answer) → hst114 re-angled to the ₹3.5 crore seized. |
| hst146 | "Himachal followed in Jan 2023" gave away hst119 → removed. |
| hst110 | "2007–2017, when the SAD-BJP alliance ruled Punjab" gave away money-gaps-poll hpe202 (who won Feb 2007) → removed. |
| hst154 | Named Tejashwi Yadav as deputy CM in the JD(U)-RJD government — dist-north hdb418's answer → name removed ("the minister holding the road construction portfolio"); `people` removed accordingly. |

### Unresolved / for the reviewer

1. **Other lanes give away this lane's answers** (not editable here; flag for the dist-north owner):
   hdb138 outcome states Lado Lakshmi's ₹2,100 (hst115); hdb135 explanation states Maiya Samman's
   ₹2,500 (hst159); hdb140 outcome states the ₹10,000 per woman (hst152). hdb110's stem says the SP
   governed UP in 2012–13 (weak hint for hst127).
2. **hst133** `govt: 'INC'` rests on the VPDO exam date of 6 Mar 2016 (seen only on an exam-listing
   site, before President's Rule began on 27 Mar); results came on 30 Mar under President's Rule.
3. **hst122** — no ruling after the Nov 2024 attachment order (appeal, deposit or auction) was found.
   A search snippet of a Tribune report says a division bench's conditional stay had been vacated in
   July 2024; that page was not read in full, so the item does not use it.
4. **hst107** — the Mohali court's ruling on the closure report (reserved for 14 Jul 2025) was not
   found anywhere; status says so.
5. **hst114** — the officer's bail in the original Vigilance case (as opposed to the ED case) was not
   confirmed; status cites only the ED-case bail.
6. **Watch in October 2026**: hst101/hst102 (Delhi HC revision, 5–6 Oct), hst150 (ED land-for-jobs
   charge framing, 30 Sep), hst156 (Soren charge framing, 30 Sep).
7. hst125 carries an HT URL whose slug contains "ro-aro" as a source; if the receipt displays full
   source URLs it hints at hst126's answer.
8. Minor numeric coincidence: hst152 says the Mahila Rojgar scheme promises "up to ₹2 lakh more",
   the same figure as money-gaps-poll hpe219's answer for a different Bihar scheme.
