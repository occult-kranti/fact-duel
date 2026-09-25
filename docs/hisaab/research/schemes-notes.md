# Schemes & benefits lane: research notes

Lane: `hsc`. File: `editions/hisaab/bank/schemes.mjs` (`HISAAB_SCHEMES`, 60 items, hsc001–hsc060).
Researched and verified in September 2026. Every item has `asOf: '2026-09'`.

## Summary

- **Validator:** `node scripts/hisaab-validate.mjs editions/hisaab/bank/schemes.mjs` prints `OK — no problems`.
- **Difficulty:** simple 17, expert 23, extreme 20.
- **Answer slots:** 15/15/15/15. The slots were shuffled with a fixed seed, and no slot repeats more than twice in a row.
- **Kind:** scheme 47, spend 10, institution 2, scam 1.
- **govt:** NDA 55, UPA 4, BJP 1. The UPA items are hsc021 (NFSA 2013), hsc035 (Nirmal Bharat Abhiyan 2012), hsc040 (MGNREGA 2005) and hsc056 (DBT rollout, January 2013). The BJP item is hsc049 (the Gujarat state government leaving PMFBY). The Centre has been NDA-led since 2014, so most central-scheme items are NDA, as the charter expects.
- **Named people:** none. No item has a `people` field. Ministers are described by office, and case names are left out. The only item that needs a `status` line is the `scam` item hsc031.
- **What worked, not only what failed:**
  - hsc009: Ujjwala hit its 8-crore target seven months early.
  - hsc012: LPG coverage rose from 61.9% to 94.3%.
  - hsc023: 55.7% of Jan Dhan account holders are women.
  - hsc029: rural tap connections rose from 17% of households to 81.6%, as reported by states.
  - hsc058: Saubhagya electrified 2.86 crore households.
  - hsc013, hsc019, hsc044, hsc054: scheme entitlements.

## Method, and one limitation

- Each fact was read on the fetched page. Pages were fetched with `curl` and parsed as HTML or as PDF text (pypdf), or read with WebFetch.
- Every `sourceUrl` and every URL in `sources` returned HTTP 200 on the final check (Sept 2026).
- The shared WebSearch budget (200 calls) ran out partway through. After that, sources were found in three ways:
  - the site search on pmindia.gov.in (`/en/?s=`), which returns Cabinet-decision pages;
  - the reference lists of Wikipedia articles (MediaWiki API), used only to find primary or press URLs, which were then fetched;
  - known primary URLs on CAG, PIB and PRS.
- Bing and DuckDuckGo gave unusable results when scraped, so they were not used.

## Sources used

**Primary: CAG**
- Report 11 of 2023, PM-JAY: executive summary and the full report (para 5.8.2.8).
- Report 14 of 2019, Ujjwala (PMUY): executive summary.
- Report 20 of 2025, PMKVY: full report (para 2.4.2.2) and the press brief.

**Primary: government**
- PIB press releases:
  - PRID 2100758: PM-KISAN impact.
  - PRID 1980686: PMGKAY for five years.
  - PRID 1990696: food ministry year-end review, 2023.
  - PRID 2161401: Jan Dhan at 11 years.
  - PRID 1593252: NSS 76th round.
  - PRID 1845839: Saubhagya and power supply.
  - relid 90093: 2012 committee on direct cash transfers.
- PMO (pmindia.gov.in) Cabinet decision pages:
  - PM-JAY cover for people aged 70+ (11 Sep 2024).
  - PM-KISAN extended to all landholding farmers (31 May 2019).
  - Ujjwala 8-crore target met (7 Sep 2019) and the Ujjwala expansion (13 Sep 2023).
  - PMAY-G for 2024–29 (9 Aug 2024).
  - PMAY-U extension (10 Aug 2022) and PMAY-U 2.0 (9 Aug 2024).
  - JJM extension to December 2028 (10 Mar 2026).
  - UPS (24 Aug 2024).
  - APY continuation (21 Jan 2026).
  - SVANidhi restructuring (27 Aug 2025).
  - PM Surya Ghar (29 Feb 2024).
  - ECLGS 5.0 (5 May 2026) and the ECLGS limit increase (17 Aug 2022).
  - PMGKAY extension (8 Jul 2020).
- DBT Mission dashboard: dbtbharat.gov.in.

**Primary: PRS Legislative Research**
- Blog: Seven years of Swachh Bharat Mission.
- Bill tracker: VB-G RAM G Bill, 2025.
- Demand for Grants 2025-26 analyses (PDF): Rural Development; Agriculture and Farmers Welfare.

**Outlets**
- The Tribune: PM-KISAN payouts to 42 lakh ineligible people, from a Lok Sabha reply (Jul 2021).
- Outlook Business (PTI): ₹416 crore recovered (Mar 2025).
- The Quint: BBBP committee report (Dec 2021).
- Factly: CAG UDAN audit (2023).
- Down To Earth: Smart Cities status as of March 2025.
- Frontline: CAG audit of Namami Gange (Jan 2018).
- The Indian Express: PMFBY 2.0; Agnipath explainer; UPS explainer; the freebies referral to a three-judge bench.
- The Hindu BusinessLine: Gujarat leaves PMFBY.
- The Hindu: the UPS/NPS piece; the DBT launch in January 2013.
- Business Standard: the Health Ministry's rebuttal on PM-JAY; VB-G RAM G coming into force.
- Deccan Herald: opposition protest over VB-G RAM G.
- SCC Online: MGNREGA repeal date.
- Lokmat Times (IANS): JJM complaints.
- The Wire (mobile site): ABPS analysis by LibTech India; DBT exclusion errors.
- ThePrint and Medical Dialogues: used as second sources only.

**Wikipedia (second source only)**
- Articles: Unified Pension Scheme; National Pension System; National Food Security Act, 2013; NREGA 2005; Direct Benefit Transfer; Swachh Bharat Mission.
- Used to back up dates and which government was in office, never as the only source.

## Seed ideas dropped, or not used, and why

- **PAHAL/DBTL savings (CAG 2016):** the Deccan Herald story body could not be read (HTTP 403 via WebFetch), and the CAG report itself was not located. Dropped.
- **PLI (allocated vs disbursed) and Mudra (Tarun Plus, NPAs):** no primary page reached after the search budget ran out. Dropped.
- **RSBY ₹30,000 cover (the UPA-era forerunner of PM-JAY):** The Hindu's page is blocked by the egress policy. The sentence was removed from hsc005.
- **Uptake of UPS and PM Internship:** no Parliament answer found. Dropped.
- **The PM's "revdi" remark (July 2022):** not fetched. The Supreme Court's referral of the freebies question (hsc057) is used instead.
- **MGNREGA wage delays and pending liabilities:** not in the fetched PRS text. Replaced by two PRS figures: the share of households getting 100 days, and wages paid below the notified rate.
- **Fertiliser NBS rates, fortified rice, e-Shram:** pages found, but they overlap the Budget lane or give thin facts. Not used.
- **Quotas for ex-Agniveers in the central armed police forces:** not verified. Left out of hsc052.
- **Share of inoperative Jan Dhan accounts:** not verified. Only a qualitative line is used.
- **CAG 2017 audit of PMFBY:** not located. PRS and the 2021 Standing Committee on Agriculture are used instead.
- **Rajasthan JJM case (₹960 crore, involving a former IAS officer):** it names people and belongs to the Scams or States lanes. Not used here.
- **Stand-Up India:** skipped because eligibility is caste-based, to stay clear of the caste-content rule.
- **Figures that differ between sources, where the primary figure was used:**
  - ThePrint gives 95.53% for PMKVY bank-detail gaps. CAG says 94.53%, and hsc016 uses CAG.
  - A Business Today headline says 9.85 lakh PM-JAY beneficiaries per mobile number. CAG's maximum for a single number is 7,49,820, and hsc007 uses CAG.

## Contested items: reviewer, please look closely

- **hsc007 and hsc008 (PM-JAY audit by CAG):**
  - The Health Ministry disputes both findings.
  - On mobile numbers, it says they play no role in eligibility.
  - On claims for "dead" patients, it called the media reports misleading, citing pre-authorisation that can be raised up to three days before admission.
  - Both replies are in the explanations.
- **hsc016 (PMKVY bank details):** the ministry's reply is included. It says the field was made non-mandatory and that pay-outs go through Aadhaar-seeded accounts.
- **hsc031 (JJM complaints, `kind: 'scam'`):**
  - These are complaints and departmental action reported by the states. There is no court finding.
  - The status line says so.
  - Some reports give 83% for Uttar Pradesh's share; Lokmat/IANS says "about 84 per cent", and the item follows that.
- **hsc032 (NSO 2018 vs the open-defecation-free claim):** the statistics ministry's own caveat about respondent bias is included.
- **hsc055 (DBT "estimated gains", ₹5.14 lakh crore):**
  - This is a live government estimate, read in Sept 2026.
  - The counterpoint on exclusion errors (The Wire, 2022) is included.
  - This figure goes stale fastest.
- **hsc036 and hsc037 (VB-G RAM G):**
  - Politically contested.
  - The explanation carries the opposition's demand to send the bill to a standing committee, and the Centre's framing of a 125-day guarantee plus an infrastructure mandate.
  - A reviewer may want a fuller critique, for example on the 60:40 cost burden on states.
- **hsc049 (Gujarat leaves PMFBY):** only one source (BusinessLine). The other states that left before Gujarat are not named, because they were not verified.
- **Secondary sources where a primary exists:**
  - hsc014 and hsc015 (BBBP) use The Quint; the primary is the 5th Report of the Committee on Empowerment of Women (2021-22), tabled 9 Dec 2021.
  - hsc018 (UDAN) uses Factly; the primary is CAG Report 22 of 2023.
  - hsc050 (Namami Gange) uses Frontline; the primary is the CAG audit of 2017.
  - A reviewer with search access could swap in the primary links.
- **hsc057 (freebies):** whether the three-judge bench has since ruled was not checked. The stem and explanation only state the August 2022 referral.
- **Which government was in office for the UPA items (hsc021, hsc035, hsc040, hsc056):** this follows from the dates (UPA governed from 2004 to May 2014), backed by Wikipedia as a second source. The PRS and PIB pages do not name the government.

## Figures most likely to go stale (re-verify each month)

1. **hsc055:** DBT estimated gains. The dashboard figure changes all the time.
2. **hsc029 and hsc030:** JJM coverage (15.80 crore households, 81.61%) and progress toward the December 2028 deadline.
3. **hsc036 and hsc037:** how VB-G RAM G is being implemented, and whether states have notified it. The Act has been in force only since 1 July 2026.
4. **hsc023:** Jan Dhan account count and women's share (as of 13 Aug 2025).
5. **hsc044:** APY subscriber count (8.66 crore as of 19 Jan 2026).
6. **hsc025:** completion of the backlog of 35 lakh PMAY-G houses from the earlier phase.
7. **hsc013:** Ujjwala total of 10.35 crore, a target for 2023–26.
8. **hsc002 and hsc004:**
   - PM-KISAN instalment counts and the recovery total.
   - A December 2025 report (not fetched) mentions ₹416.75 crore and 21 instalments.
9. **hsc060:** ECLGS 5.0 (May 2026). Uptake and changes to the guarantee cap may follow.
10. **hsc057:** the freebies case. A ruling by the larger bench would change the explanation.
