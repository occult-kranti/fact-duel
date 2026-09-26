# Budget & spending lane — research notes (`hbx`)

Lane file: `editions/hisaab/bank/spending.mjs` (50 items, hbx001–hbx050). All items `asOf: 2026-09`.
Validator: `node scripts/hisaab-validate.mjs editions/hisaab/bank/spending.mjs` → OK
(difficulty simple 18 / expert 17 / extreme 15; answer slots 13/12/13/12). `tests/hisaab-bank.test.mjs` passes.

## Method

- Every figure was read on the page given as `sourceUrl` (or, where noted, on a listed second
  source) in September 2026. Nothing was taken from memory.
- Primary documents first: Budget at a Glance 2014-15 and 2026-27 (indiabudget.gov.in), PIB, the
  RBI press release, PM CARES Fund audited statements (pmcares.gov.in), and PRS Legislative Research
  budget analyses. Where a primary page could not be fetched, an established outlet was used —
  mostly Business Standard, plus The Hindu, Indian Express, Mint, Scroll, LiveLaw and All India
  Radio News.
- The session's web-search quota ran out partway through the work. After that, article URLs were
  found in Business Standard's monthly sitemaps and in Wikipedia's citation lists, then fetched and
  read directly. Wikipedia itself is never used as a source.
- Blocked or unreadable pages: rbidocs.rbi.org.in (bot captcha), ndtv.com and businesstoday.in (403),
  archive.org, and nhsrcl.in (connection reset). For these, the item cites the outlet that reports
  the primary figure. The rbidocs PDF stays in `sources` as the primary reference for hbx023.

## Sources by item

| id | fact | sourceUrl (primary) | also |
|---|---|---|---|
| hbx001 | Budget ₹17,94,892 cr (2014-15 BE) → ₹53,47,315 cr (2026-27 BE); nominal GDP ₹128.8 → ₹393 lakh cr | Budget at a Glance 2026-27 | BAG 2014-15, PIB highlights 2026-27 |
| hbx002 | Rupee Goes To: interest 20p, states' share 22p, defence 11p, subsidies 6p | BAG 2026-27 p.3 | PRS 2026-27 |
| hbx003 | Rupee Comes From: borrowings 24p; FD ₹16,95,768 cr; gross borrowing ₹17.2 lakh cr | BAG 2026-27 p.2 | PIB |
| hbx004 | Income tax 21p vs corporation tax 18p; ₹14.66 vs ₹12.31 lakh cr | BAG 2026-27 | PRS |
| hbx005 | Interest = 37% of revenue receipts (2013-14), 42% (2020-21), 40% (2026-27); committed spending 65.3% | PRS 2026-27 | — |
| hbx006 | FD 2020-21 actual 9.2% (₹18,18,291 cr) | PRS 2022-23 | PRS 2026-27 |
| hbx007 | FD 2013-14 RE 4.6% (₹5,24,539 cr); 2014-15 target 4.1% | BAG 2014-15 | — |
| hbx008 | Liabilities peaked at 61% of GDP (2020-21); 55.6% BE 2026-27; aim 50±1% by Mar 2031 | PRS 2026-27 | PIB |
| hbx009 | Capex ₹2,26,781 cr (BE 2014-15) → ₹12,21,821 cr (BE 2026-27); effective capex ₹17,14,523 cr | BAG 2026-27 | BAG 2014-15 |
| hbx010 | Capex 2024-25 BE ₹11,11,111 cr vs actual ₹10,51,953 cr | BAG 2026-27 | PRS 2024-25, PRS 2026-27 |
| hbx011 | Defence ₹7,84,678 cr = 15% of spending; capital outlay ₹2,19,306 cr | PRS 2026-27 | BAG |
| hbx012 | Health ministry ₹1,06,530 cr; Education ₹1,39,289 cr | PRS 2026-27 | — |
| hbx013 | Food + fertiliser = 87% of ₹4,54,773 cr subsidies | PRS 2026-27 | — |
| hbx014 | Food subsidy 2020-21 BE ₹1,15,570 cr → RE ₹4,22,618 cr (FCI dues cleared) | PRS 2021-22 | — |
| hbx015 | Fertiliser subsidy 2022-23 actual ₹2,51,339 cr | PRS 2024-25 | PRS 2026-27 |
| hbx016 | Jal Jeevan Mission 2025-26 BE ₹67,000 cr → RE ₹17,000 cr | PRS 2026-27 | — |
| hbx017 | Income tax 2025-26 BE ₹14,38,000 cr → RE ₹13,12,000 cr; nil-tax limit ₹7 → ₹12 lakh | PRS 2026-27 | Business Standard (Feb 2025) |
| hbx018 | Disinvestment 2025-26 RE ₹33,837 cr = 71.9% of ₹47,000 cr; 2026-27 target ₹80,000 cr | PRS 2026-27 | — |
| hbx019 | 16th Finance Commission: states' share stays at 41%; 18 of 28 states sought 50% | PRS 2026-27 (annexure) | Business Standard (1 Feb 2026) |
| hbx020 | Divisible pool excludes cesses and surcharges | PRS 2026-27 (annexure) | — |
| hbx021 | RBI transfer ₹1,76,051 cr (Aug 2019) = ₹1,23,414 cr + ₹52,637 cr | PRS Monthly Policy Review Aug 2019 | Business Standard/ANI |
| hbx022 | RBI surplus ₹2,86,588.46 cr for 2025-26; contingent risk buffer ₹1,09,379.64 cr at 6.5% | rbi.org.in press release prid=62789 | Business Standard, PRS |
| hbx023 | 99.3% of demonetised notes returned (₹15.31 of ₹15.42 lakh cr) | Business Standard/ANI (29 Aug 2018) | rbidocs annual report ch. VIII, BS on the SC verdict |
| hbx024 | Supreme Court upheld demonetisation 4:1 (2 Jan 2023) | Business Standard | BS (Congress reaction) |
| hbx025 | ₹2,000 notes: 98.47% returned, ₹5,451 cr still out (30 Apr 2026) | newsonair.gov.in (2 May 2026) | — |
| hbx026 | Bank write-offs ₹16.35 lakh cr in 10 years; peak ₹2,36,265 cr (2018-19); "not a waiver" | Business Standard/PTI (17 Mar 2025) | — |
| hbx027 | Corporate tax 30% → 22% (effective 25.17%); revenue forgone estimated at ₹1,45,000 cr | PIB PRID 1585641 | — |
| hbx028 | Revenue loss ₹1,28,170 cr (2019-20), ₹1,00,241 cr (2020-21, re-estimated) | Business Standard/PTI (8 Aug 2023) | — |
| hbx029 | GST launched at midnight in Parliament's Central Hall; opposition boycott | Business Standard/IANS (1 Jul 2017) | — |
| hbx030 | Compensation cess extended to March 2026; ₹1.10 lakh cr back-to-back loans in 2020-21 | Business Standard/IANS (17 Sep 2021) | PRS 2026-27 (cess ₹0 in BE 2026-27) |
| hbx031 | GST 2.0: 40% on tobacco and large cars | PIB factsheet Id=150302 | — |
| hbx032 | Air India: ₹18,000 cr bid = ₹2,700 cr cash + ₹15,300 cr debt; ₹46,262 cr debt left in AIAHL | Business Standard (8 Oct 2021) | — |
| hbx033 | LIC IPO ₹20,557 cr at ₹949; listed at ₹873 (−8%) | Business Standard (18 May 2022) | BS (13 May 2022) |
| hbx034 | NMP 2.0: ₹16.72 lakh cr (FY26–FY30); NMP 1.0 ~90% of ₹6 lakh cr | Business Standard (24 Feb 2026) | BS 2021 ×2 |
| hbx035 | PM CARES received ₹3,076.62 cr by 31 Mar 2020 | pmcares.gov.in audited statement 2019-20 | pmcares.gov.in "About" page |
| hbx036 | PM CARES 2020-21 disbursals (vaccines ₹1,392.83 cr, ventilators ₹1,311.34 cr, …) | Audited statement 2020-21 | — |
| hbx037 | PM CARES closing balance ₹8,452.07 cr (31 Mar 2025); FY25 payments ₹87.85 lakh | Audited statement 2024-25 | — |
| hbx038 | SC dismissed plea to move PM CARES funds to NDRF (18 Aug 2020) | LiveLaw | Mint |
| hbx039 | Trust told Delhi HC its money is "not a fund of the Government of India" (Sep 2021) | Indian Express (23 Sep 2021) | LiveLaw (PMO RTI appeal, Jun 2020) |
| hbx040 | New Parliament building estimated at ₹971 cr; ₹20,000 cr is the wider Central Vista | Business Standard (Sep 2023) | Scroll, BS (Tata Projects contract) |
| hbx041 | SC cleared Central Vista 2:1 (5 Jan 2021); the dissent's reasoning | The Hindu | — |
| hbx042 | Statue of Unity: L&T bid ₹2,980 cr vs ₹2,063 cr estimate; ₹200 cr in Union Budget 2014-15 | Indian Express (11 Jul 2014) | The Hindu |
| hbx043 | Bullet-train JICA loan at 0.1% over 50 years, funding 81%; first run 15 Aug 2027 | Business Standard/The Wire (2017) | BS (1 Jan 2026) |
| hbx044 | CAG on Bharatmala: 75.62% of length awarded vs 158.24% of outlay sanctioned | Business Standard (17 Aug 2023) | — |
| hbx045 | Dwarka Expressway ₹250 cr/km vs ₹18.2 cr/km; the ministry's rebuttal | Business Standard (16 Aug 2023) | BS (16 Aug 2023) |
| hbx046 | Central ad spend: ₹1,220.89 cr (2017-18) … ₹264.78 cr (2021-22); ₹3,723 cr in total | Business Standard/PTI (15 Dec 2022) | — |
| hbx047 | 10 public sector banks merged into 4; PNB absorbed OBC and United Bank | PRS Monthly Policy Review Aug 2019 | — |
| hbx048 | Petrol excise ₹9.48 (2014) → ₹32.98 (May 2020) → ₹19.90; petroleum revenue ₹1.72 → ₹4.92 lakh cr | Business Standard/PTI (6 May 2020) | BS/PTI (1 Aug 2022) |
| hbx049 | Retrospective tax scrapped; ₹7,900 cr collected from Cairn to be refunded | Business Standard (23 Aug 2021) | BS (6 Aug 2021) |
| hbx050 | MPLADS suspended for 2020-22; ₹7,900 cr sent to the Consolidated Fund | Business Standard/ANI (6 Apr 2020) | BS/ANI (Congress MP's objection) |

## Contested items — both sides are in the explanation

- **hbx045 (Dwarka Expressway)** and **hbx044 (Bharatmala)**: both are CAG findings. The road
  ministry called the per-km comparison a "gross misrepresentation of facts". Officials also said the
  audit missed that land-acquisition costs had risen about five times. Both explanations include
  these responses. The stems say "CAG flagged/found", never "scam".
- **hbx023 / hbx024 (demonetisation)**: hbx023 gives the 99.3% return figure alongside the
  government's stated aims. hbx024 gives the 4:1 verdict, the dissent's reasoning, and Congress's
  point that the verdict did not test whether the objectives were met.
- **PM CARES (hbx035–hbx039)**: these items state only what the fund's own audited accounts, the
  Supreme Court and the court filings say. They give the fund's position on budgetary support, audit
  and RTI in its own words. No item implies misuse.
- **hbx026 (write-offs)**: carries the government's explanation that a write-off is not a waiver.
- **hbx027 / hbx028 (corporate tax cut)**: the government's investment rationale, and the later
  recovery in collections, sit next to the revenue-loss figures.
- **hbx034 (NMP)**: Congress's "legalised loot" charge and the government's description of the
  assets covered.
- **hbx029 (GST launch)**: the opposition boycott and the government's rejection of its charge.
- **hbx043 (bullet train loan)**: the "virtually free" claim, and a published critique of it.
- **hbx046 (ad spend)**: the minister's reading that ad spending had not increased.
- **hbx049 (retrospective tax)**: notes the 2012 amendment was the UPA government's, which the NDA
  withdrew in 2021.

## Balance

The lane records govt as NDA 48 / UPA 1 / BJP (Gujarat) 1. That split is proportional, because the
lane covers the Union's money from 2014 to 2026. UPA-era context appears in hbx005 (2013-14 interest
share), hbx007 (2013-14 fiscal deficit) and hbx049 (the 2012 retrospective amendment). The items
are mostly neutral numbers. Where an audit or the opposition criticises the NDA government, its
rebuttal is included.

## People named

Only **hbx021 (Bimal Jalan)**, as chair of the RBI committee. `status` says no allegation. Other
items refer to office-holders by role only ("the Finance Minister", "a Minister of State for
Finance", "the Railways Minister"). Petitioners, officials and a rival Air India bidder that the
sources name were deliberately left out.

## Dropped or held in reserve

Verified but cut to keep the lane at 50. These are ready as replacements:

- Bank recapitalisation of ₹2.11 lakh cr (Oct 2017): ₹1.35 lakh cr in bonds plus ₹76,000 cr from
  other sources (Business Standard, 25 Oct 2017).
- BSNL revival package of ₹1.64 lakh cr (Jul 2022), with a cash component of about ₹44,000 cr,
  following ₹69,000 cr in 2019 (Business Standard, 28 Jul 2022).
- Government stake in Vodafone Idea of 48.99%, after ₹36,950 cr of spectrum dues were converted to
  equity (Apr 2025, Business Standard).
- Atmanirbhar package of ₹20 lakh cr, "around 10% of GDP" (May 2020, Business Standard/PTI).
- Interest-free capex loans to states of ₹1.85 lakh cr in 2026-27 (PRS).
- 16th Finance Commission roadmap: Centre's fiscal deficit at 3.5% by 2030-31 (PRS).
- The Budget 2022-23 goal of a fiscal deficit below 4.5% by 2025-26, against 4.4% in the 2025-26 RE
  (PRS 2022-23 and PRS 2026-27). hbx006 mentions the 4.4% figure but not the goal.
- 16th Finance Commission's new "contribution to GDP" criterion at 10% weight (PRS). Folded into the
  hbx019 explanation.
- Bullet train's 15 Aug 2027 date. Folded into the hbx043 explanation.

Not verified, so dropped:

- **Kumbh 2025 and other mega-event spending**: no Parliament or CAG figure found in a fetchable
  source. Religious-event items also need extra care under §2.6.
- **G20 summit cost**: no Parliament figure found in a fetchable source.
- **Bullet-train revised cost**: only a 2022 Times of India estimate (₹1.6 lakh cr) and a headline
  saying ₹90,966 cr had been spent by July 2026 (source not fetched). Not used as a fact.
- **Tata Projects' ₹862 cr bid for the Parliament building**: Business Today blocked the fetch, and
  the Business Standard report did not state the figure. Dropped; hbx040 names the contractor only.
- **Statue of Unity total cost of ₹2,989 cr**: this figure is from Wikipedia. The Indian Express
  reported the bid at ₹2,980 cr, and that is what hbx042 uses.
- **Corporate tax "₹1.84 lakh crore loss"**: seen only on a coaching site. hbx028 uses the
  Parliament figures reported by PTI instead.
- **Rafale pricing, CAG and Supreme Court**: overlaps the scams lane, and the primary pages were not
  read. Left for that lane.
- **PM CARES after 2021**: January 2026 headlines report a Delhi HC observation that the fund has
  third-party privacy rights under the RTI Act. The article text was not read, so it is not used.
  hbx039 is pinned to the dated September 2021 filing.

## Figures most likely to change (refresh list)

1. **Budget 2027-28 (1 Feb 2027)** will supersede the rupee charts and all BE/RE figures in hbx001–005,
   hbx008–013, hbx016–018 and hbx020.
   **Also: `https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf` always
   points to the current year's document and will show 2027-28 after 1 Feb 2027.** hbx002–hbx004
   rely on that URL alone, so repoint them to the archived 2026-27 copy once indiabudget.gov.in
   publishes it.
2. **₹2,000 notes (hbx025)**: the RBI updates the return figure monthly. The stem is pinned to
   30 April 2026, so it stays true.
3. **RBI surplus (hbx022)**: the next transfer is decided around May 2027. The stem says "record",
   so re-check it then.
4. **PM CARES balance (hbx037)**: the 2025-26 audited statement is due around August 2027. The stem
   is dated.
5. **Bullet train (hbx043)**: the 15 Aug 2027 operations date is a target.
6. **Disinvestment (hbx018)**, **JJM (hbx016)** and **income-tax shortfall (hbx017)**: these are
   revised estimates, and 2025-26 actuals will replace them.
7. **Debt path (hbx008)**: the 50±1% by March 2031 aim may be restated.
8. **PM CARES litigation (hbx039)**: re-read the current Delhi HC status before release, even though
   the item only claims the 2021 filing.

## For the reviewer to double-check

- hbx023: Business Standard's ANI text misprints "₹15,417.93 lakh crore"; the RBI figure is
  ₹15,417.93 billion. The item uses ₹15.42 lakh crore.
- hbx039 `status` is a filing-position line rather than a case outcome. Confirm this wording meets
  §2.2 for a non-scam item.
- hbx042 uses `state: 'GJ'` and `govt: 'BJP'`, because the tender was the Gujarat government's. The
  ₹200 crore Union allocation in the explanation was the NDA Centre's.

## Fact audit (26 Sep 2026)

An independent auditor re-checked all 50 items against their fetched source pages on 26 Sep 2026. Items
naming a person or describing contested conduct were cross-examined, and the newest reporting was
searched through Google News RSS and web search. The lane now has **49 items** because hbx046 was
dropped. `node scripts/hisaab-validate.mjs` prints OK for the whole bank, and `node --test
tests/hisaab-*.test.mjs` passes (44 pass, 4 todo). The spreads are simple 18 / expert 16 /
extreme 15, and the answer slots are 13/12/13/11.

### Verified with no change needed

hbx001, 004, 005, 007, 008, 010, 011, 013, 015, 016, 018, 022 (figures), 025, 028, 030, 032, 033, 036, 037,
041, 042 and 047 were checked figure by figure against the source (Budget at a Glance 2014-15 and
2026-27; PRS 2021-22, 2022-23, 2024-25 and 2026-27; the RBI press release; BS, IE and The Hindu
articles; the PM CARES audited statements read from the scanned pages).

- The PM CARES statements are image scans. The 2020-21 and 2024-25 statements were read as images.
  The 2019-20 statement is JBIG2 and could not be decoded here. Its figures (₹3,076.62 cr receipts,
  ₹39.68 lakh from abroad) were confirmed from the FY 2019-20 column of the 2020-21 statement, which
  is now in hbx035 `sources`.
- The 56.1% debt figure (2025-26 RE) in hbx008 comes from PIB PRID 2221455. PRS's chart shows only 56%.

### Fixes

| id | what changed and why |
|---|---|
| hbx002 | Removed "defence (11 paise)" from the explanation. It pointed at hbx011's answer (Defence is the largest ministry). Now compares interest with subsidies (6p) and central sector schemes (17p), both from BAG. |
| hbx003 | The explanation ranked income tax (21p) above corporation tax (18p), which is hbx004's answer. Now it says only that all taxes bring 64p and non-tax revenue 10p (BAG). |
| hbx006 | Removed "as pandemic spending jumped (PRS)". The PRS 2022-23 analysis does not say this. |
| hbx009 | Removed "2024-25 actuals came in below the estimate". It ruled out two of hbx010's four options. Added the PRS figure of 11.5% above the 2025-26 RE, and added PRS to `sources`. |
| hbx012 | Removed the comparison with Defence's ₹7,84,678 cr. It let a player work out hbx011's answer (about 15%). |
| hbx014 | Attribution fixed. PRS cites the budget speech for clearing the FCI's dues; PRS did not make that claim itself. |
| hbx017 | Added Mint (Delhi voted 5 Feb, four days after the Budget) and Frontline (BJP 48, AAP 22) as sources for the outcome and poll fields. |
| hbx019 | Removed "The Centre accepted it, effective April 2026", which is not on any fetched page. Added the Commission's own reason from BS: states already account for more than two-thirds of non-debt revenues. Added the 2026-27 to 2030-31 period from PRS. |
| hbx020 | Removed "41%" from the explanation because it is hbx019's answer. |
| hbx021 | Added `otherSide`: Congress's "stealing from RBI" charge and the FM's reply that questioning the RBI was "outlandish" (Deccan Herald, 27 Aug 2019, added to `sources`). The status wording now claims only what the item does. The distractor ₹2,86,588 cr, which is hbx022's exact answer, became ₹2,40,000 cr. |
| hbx022 | The distractor ₹1.76 lakh cr was hbx021's answer and also hgh048's 2G figure. It is now ₹1.58 lakh cr. |
| hbx023 | Removed "the court upheld it 4:1", which is hbx024's answer. Added `otherSide`: the Centre's "well-considered" rationale given to the SC (BS, 2 Jan 2023). Added the RBI's note that currency in circulation had passed its pre-demonetisation level (BS/ANI). |
| hbx024 | The dissent is now described from the BS verdict report: the power lay in Parliament's power under Entry 36, List I, not in s.26(2). Congress's objection moved to `otherSide`. |
| hbx026 | Added `otherSide`: the FM said a write-off is not a waiver. Added the 2023-24 figure of ₹1,70,270 cr from the same page. |
| hbx027 | Removed the `pre-election` tag, the `poll` field and the ECI-announcement outcome. They gave away hpe029's answer ("Polls in Maharashtra and Haryana"), and poll-union already covers that timing. The new outcome is collections of ₹6.63 → ₹5.56 lakh cr (BS/PTI 2023, added to `sources`). |
| hbx029 | Added `otherSide`: the FM rejected the opposition's self-promotion charge, and the PM's "better and sacred" venue remark (BS/IANS). |
| hbx031 | **Re-angled.** hpe040's explanation ("plus 40% for sin and luxury goods") gave away the old answer of 40%. The item now asks which item was exempted altogether: individual health insurance (PIB factsheet; HT, 3 Sep 2025). The outcome dates and Bihar result are now sourced: HT (council decision on 3 Sep, effective 22 Sep), The Hindu (first phase on 6 Nov) and HT (NDA 202, BJP 89, JD(U) 85). |
| hbx034 | Added `otherSide`: the FM said there is no transfer of ownership or land. Congress's quote is now given in full as "legalised loot and organised plunder", and the asset list matches BS. |
| hbx035 | Removed "gets no budgetary support". It hinted at hrf040's answer ("donations, not from the Consolidated Fund"). Added the FCRA exemption (pmcares.gov.in) and the 2020-21 statement to `sources`. |
| hbx038 | Added `otherSide`: the petitioner's transparency argument (Mint). |
| hbx039 | **Re-angled.** hbx039's answer ("not a Government of India fund") and hrf040's answer and outcome gave each other away. The item now asks what the same Sept 2021 reply said barred disclosure in any case: the RTI Act's s.8 third-party bar (IE). **Status updated:** no final ruling is reported on the Article 12 petition as of Sep 2026. In Jan 2026 a Delhi HC bench, in a separate RTI appeal (Girish Mittal / I-T dept), orally said the fund keeps third-party privacy rights (BS and LiveLaw, 13 Jan 2026, added to `sources`). Added `otherSide`: the petitioner's argument. |
| hbx040 | Added Tata Projects' winning bid of ₹861.90 cr (BS, 16 Sep 2020, already in `sources`). The earlier note saying BS did not state the bid was wrong. |
| hbx043 | Added `otherSide`: the PM called the loan "virtually free of cost" (BS/The Wire, 2017). |
| hbx044 | The explanation now gives the CAG's recommendation to fix responsibility, and notes that no later finding was reported (searched Sep 2026: only the Aug 2023 rebuttals and a Sep 2023 PAC briefing). The official's rebuttal moved to `otherSide` and is attributed to "an official", not "officials", as the source says. |
| hbx045 | Added `otherSide`: the ministry's "gross misrepresentation" statement. Added All India Radio (14 Aug 2023, the ministry's clarification) to `sources`. The explanation separates the ministry's statement (₹152 cr/km) from what "ministry sources" said (₹181.94 cr/km, 12% below estimates). |
| hbx048 | The motive clause ("meant to capture the fall in oil prices") is now attributed to PTI. |
| hbx049 | **Re-angled.** Its answer of ₹7,900 cr (Cairn) was the same as hbx050's answer of ₹7,900 cr (MPLADS). It now asks for the total collected from the three firms, about ₹8,000 cr (same BS page). The explanation no longer contains ₹7,900. |
| hbx050 | Added the November 2021 restoration of MPLADS (₹2 cr per MP for the rest of 2021-22, then ₹5 cr a year; PIB PRID 1770523, added to `sources`). The purpose is attributed to the government. Added `otherSide`: a Congress MP's objection. |

`otherSide` was added to 12 items: hbx021, 023, 024, 026, 029, 034, 038, 039, 043, 044, 045 and 050.
Each one comes from a page fetched in this audit. Only hbx021 and hbx039 required it under the charter
(`people` / `status`). There are no `scam` items in this lane.

### Dropped

- **hbx046 (central govt ad spend, which year was highest)**: it duplicates hmd027 in the media lane,
  which uses the same 15 Dec 2022 Rajya Sabha reply. hmd027's explanation lists the year-by-year
  figures, so it gives this item's answer away, and hbx046's ₹3,723 cr gave hmd027's answer away. The
  charter puts govt ad spend in the media lane, so the item was dropped here and the id retired.

### Unresolved or for the reviewer

- **Primary sources that could not be fetched**: rbidocs.rbi.org.in (hbx023's annual-report chapter)
  still returns a bot page. hbx023 relies on BS/ANI, which quotes the report. The SC demonetisation
  judgment text (hbx024) was not fetched; the dissent is described from BS's verdict report.
- **Budget at a Glance URL**: it will point to 2027-28 after 1 Feb 2027. hbx001–004, 009 and 010 must
  be repointed then (unchanged from the earlier refresh list).
- **Overlap with poll-union**: hbx017 overlaps hpe039 (Budget 2025 and the Delhi poll), and hbx031
  overlaps hpe040 (GST 2.0 and the Bihar poll). Their `outcome` and `poll` framing is shared. After the
  re-angle neither gives the other's answer away, but the owner may want only one of each pair tagged
  `pre-election`.
- **Coincidental figures across lanes judged not to be giveaways**: the same value appears in
  unrelated contexts. Examples: "three times" (hbx001 vs hrf211), 50%, 15% and 10% shares, ₹17,000 cr
  (hbx016 JJM RE vs hpe025), ₹20,000 cr (Central Vista vs hsc051 Namami Gange), ₹200/₹500 cr
  (hbx042 vs hmd022/hrf), 9.2% and 4.6% (Bihar and Mizoram state deficits vs hbx006/007), and
  ₹8,000 cr (hbx049 vs state loan-waiver costs). None of these states another item's fact.
- **hbx043 bullet train**: headlines from July and Aug 2026 (News18, Railway Supply) report cost
  escalation, and the final completion date and cost are still open. These were not read in full.
  The item's "over ₹1 lakh crore" and the minister's 15 Aug 2027 target, dated Jan 2026, remain
  literally true. Re-check this after Aug 2027.
- **hbx044**: "no later finding reported" is based on news searches only. The Public Accounts
  Committee's handling of the Bharatmala report after its Sep 2023 briefing was not traced.
- **hbx039**: the Delhi HC's Jan 2026 remarks were oral, in a different case (the Girish Mittal RTI
  appeal). Re-check both cases before the next release.
