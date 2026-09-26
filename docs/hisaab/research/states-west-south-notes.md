# States — West & South: research notes

Lane file: `editions/hisaab/bank/states-west-south.mjs` (`HISAAB_STATES_WEST_SOUTH`, ids hst200–hst265).
Charter: `docs/hisaab/CHARTER.md` §2–§5. Researched and status-checked in September 2026 (`asOf: 2026-09` on every item).

## Summary

- **66 items** (target 60). Per state: GJ 7, MH 7, CT 7, TN 7, AP 7, TG 7, GA 6, MP 6, KA 6, KL 6.
- Difficulty 22 / 22 / 22 (simple / expert / extreme). Correct slot spread 17 / 17 / 16 / 16.
- Kinds: scam 33, scheme 15, spend 13, institution 5.
- `node scripts/hisaab-validate.mjs editions/hisaab/bank/states-west-south.mjs` prints OK; the whole-bank run
  (all lanes present on disk) also prints OK, so no id or question-text clash with the other lanes.
  `node --test tests/hisaab-*.test.mjs`: 29 pass, 0 fail.
- **Not yet registered:** `editions/hisaab/bank/index.mjs` does not list this lane. I was told to touch only my
  two files, so whoever owns the registry needs to add `HISAAB_STATES_WEST_SOUTH`.

## How it was verified

Each item's `sourceUrl` was fetched and read (curl with a text extractor, or WebFetch), and the answer, figure and
status were checked against the page text, not against search snippets. Where a page was paywalled after the
first paragraphs, only the visible text was used. Where a later status came only from a headline (Google News
RSS result titles for 2026 events), that headline URL is listed in `sources`, and these cases are named below.
The session's WebSearch quota ran out partway through. After that, discovery used Google News RSS (with the
publisher URLs decoded), and every fact was still confirmed by fetching the publisher page.

Primary-source mix: PRS state budget analyses 2026-27 (which carry CAG, 16th Finance Commission and White Paper
findings) for all fiscal items, one PIB release, and court coverage from LiveLaw, LawBeat and Law Trend. The rest
comes from The Hindu, Indian Express, Hindustan Times, Times of India, Business Standard, Scroll, Frontline,
Deccan Chronicle, The New Indian Express, The News Minute, The South First, India TV, Tribune, Business Today,
BusinessLine, Down To Earth and The Wire. Regional dailies were used where national outlets had nothing
fetchable: The Goan and Bhaskar English (both as sources on Goa and MP items), Metro Vaartha (second source only)
and The Pioneer. The reviewer may want to swap The Goan and Bhaskar English for national outlets if the charter's
outlet list is read as closed.

## `govt` tagging rule

`govt` = the party heading the state government whose conduct, programme or spending the item is about.
- **Scheme and spending items:** the government that ran or budgeted the scheme at that time.
- **Wrongdoing items:** the government in office when the alleged conduct happened, even if the FIR, arrest or
  court ruling came later under another party. This applies to hst217 (Louis Berger, INC era; 2026 ruling),
  hst226, hst227 and hst228 (Chhattisgarh cases, INC era; FIRs and arrests under the BJP), hst252 (AP skill
  development, TDP era; arrest under the YSRCP in 2023, closure under the TDP in 2026), hst253 (AP liquor, YSRCP
  era; arrests under the TDP) and hst259 (Kaleshwaram, BRS era; the commission and HC ruling came under the INC).
- **Coalitions:** hst209 (Anil Deshmukh) is tagged **NCP**. The MVA government was headed by the Shiv Sena, but the
  Home department and the accused minister were NCP. If the review lane prefers "CM's party", retag it to SS.
- **Exceptions to flag:** hst233 (MUDA) is tagged INC because the item examines the case against a sitting
  Congress CM (2024–26); the 14 sites were allotted in 2021 under the BJP government. hst254 (Rushikonda) is tagged
  YSRCP (it built the complex), although the 2026 PPP decision was the TDP government's. hst251 (TN power-sector
  debt) is tagged DMK because the figure is at 31 March 2026, but the debt built up over several governments.

**Distribution:** BJP 24, INC 13, DMK 5, SS 4, YSRCP 4, BRS 4, LDF 3, UDF 3, TDP 3, AIADMK 2, NCP 1. BJP leads
because it governed GJ, GA and MP for almost the whole window, and also CT (2023–) and MH (2014–19, 2024–).

**Balance check (does any side appear only as the villain?):**
- **BJP:** wrongdoing items include Morbi, the paper leak, the Rajkot fire, the fake office, the Goa jobs cases,
  the Arpora fire, Vyapam, the nursing colleges, Mahakal Lok, NAN, "40% commission" and PSI. Schemes include Namo
  Lakshmi, Ladki Bahin, Griha Aadhar, Ladli Behna and Mahtari Vandan. Counterpoints included: the 2019 INC work
  order behind the Mahakal Lok idols, and the police clean chit in the 2022 contractor-death case.
- **INC:** wrongdoing items include Louis Berger, Mahadev, the CT liquor case, coal levy, MUDA, Valmiki, the
  Kaleshwaram follow-up and Kancha Gachibowli. Schemes include Godhan Nyay, the KA guarantees, Rythu Bharosa and
  the six guarantees. Counterpoints included: the MUDA clean chit accepted by a court, Louis Berger cognisance set
  aside, and the Congress's own action against the Mahadev syndicate. The Mahadev item also records that the ED
  arrested a BJP Economic Cell convenor, whom the BJP removed.
- **Other parties:** SS has both cases and schemes. The **LDF** is covered by the CMRL, gold and Karuvannur cases.
  The **UDF** has the Palarivattom case plus two 2026 decisions. The **DMK** has Senthil Balaji and TASMAC plus
  three schemes. The **AIADMK** has the Jayalalithaa DA case and Amma Canteens. The **YSRCP** has the liquor case,
  SECI, off-budget borrowing and Rushikonda; the Talliki Vandanam item credits its Amma Vodi, and the skill case
  records that its prosecution of Naidu was closed. The **TDP** has the skill-case closure (with the challenge to
  it noted) and two schemes. The **BRS** has Kaleshwaram, Formula-E and TSPSC; Rythu Bandhu is credited in hst263.
- **Note for the reviewer:** the YSRCP has three wrongdoing items and one neutral fiscal item, but no positive
  scheme item of its own. Consider swapping hst254 (Rushikonda) for a YSRCP-era scheme item.

## The most sensitive items

| id | why |
|---|---|
| hst239 | CMRL–Exalogic. The accused is the former CM's daughter, a private businessperson. She is not named (the item says "an IT firm owned by… daughter"), but she is identifiable. Kept because the public-interest link is the CM's government. The CM's denial is included. Review against charter §2.7. |
| hst227 | CT liquor case. Names Chaitanya Baghel (the ex-CM's son; not an office-holder) and Kawasi Lakhma. Both are on bail and neither is convicted. |
| hst226 | Mahadev app. Names ex-CM Bhupesh Baghel as named in an FIR, with no chargesheet reported against him. Includes the Congress counterpoint and the ED's arrest of a BJP functionary. |
| hst252 | Skill-development case. Naidu, now CM, is the accused, and the closure was sought by the CID under his own government. The item records the "mistake of fact" plea and the challenge to the closure. |
| hst255 | SECI deal. Rests on a US SEC allegation that is untested in court. The item names no official, and the denials by both the Adani Group and the YSRCP are included. |
| hst233 | MUDA. Siddaramaiah was cleared by the Lokayukta and the court accepted it; the ED's and a complainant's challenges are pending. The item mentions his wife but does not name her. |

Also handle with care:
- hst234: Nagendra says he is innocent. He resigned twice.
- hst245: Senthil Balaji.
- hst259 and hst261: KCR and KTR.
- hst209: Deshmukh.
- hst200: the Oreva MD.
- hst247: Sasikala is convicted, so the status is firm.

## Statuses at risk of going stale (re-check first)

- **hst200 (Morbi):** latest found is Oct 2025 (charge framing pending in HC). No 2026 update found.
- **hst211 (Dharavi):** the latest SC order found is from Mar 2025 (notice issued, no stay). Final hearing status in 2026 not found.
- **hst233 (MUDA):** challenges in the Karnataka HC were pending as of Aug 2026.
- **hst234 (Valmiki):** Nagendra resigned on 28 Aug 2026 and was questioned by the ED in Sept 2026. The bail detail is inferred: he was free and sworn in as a minister in Aug 2026.
- **hst226 (Mahadev):** "no chargesheet against Baghel" is based on the Frontline piece of 18 Jul 2026. The CBI arrested an app kingpin on 24 Sept 2026 (a headline only), so things are moving.
- **hst227 (CT liquor):** Lakhma's bail is *interim* (Feb 2026).
- **hst245 and hst246 (TN):** a change of government (TVK, May 2026) is reshaping both cases. The state's SC appeal on TASMAC was reportedly going to be withdrawn; this comes from a TOI headline of Jun 2026 whose body was paywalled.
- **hst252 (Naidu):** the HC challenge to the closure (Mar 2026) is pending.
- **hst253 (AP liquor):** new chargesheets or ED action are likely.
- **hst259 (Kaleshwaram):** whether the CBI has registered a case is not verified. The state was "seeking" a CBI probe in Apr 2026.
- **hst261 (Formula-E):** next hearing is 30 Oct 2026.
- **hst264 (Kancha Gachibowli):** the latest verified order is the SC stay of Apr 2025. No 2026 order was found.
- **hst236 (PSI):** trial pending since Sept 2025.
- **hst240 (Kerala gold):** trial-transfer plea in the SC (Apr 2025).
- **hst215 (Goa jobs):** the police inquiry into the Nov 2025 claim has no reported outcome.
- **Scheme amounts that change often:**
  - hst218: Griha Aadhar; a ₹500 hike was announced in Sept 2026 but not yet in force.
  - hst207 and hst208: Ladki Bahin.
  - hst220: Ladli Behna.
  - hst229: Mahtari Vandan.
  - hst257: NTR Bharosa.

## Status lines resting partly on headlines (body paywalled or not fetched)

- **hst226:** the CBI kingpin arrest is only mentioned in the notes, not in the item.
- **hst227:** Lakhma's interim bail. The Hindu and LiveLaw headlines of 3 Feb 2026 agree.
- **hst229:** the Jan 2026 Mahtari Vandan transfer. The ANI page was fetched and the figures appear in its heading.
- **hst231:** the SC's cancellation of anticipatory bail and the ED custody (Sept 2025). Both come from headlines (LawChakra, Business Standard).
- **hst233:** the ED and complainant challenges come from HT, TOI and LiveLaw headlines.
- **hst239:** court access for the ED (Jun 2026) comes from a Statesman/The Week headline.
- **hst242:** the ex-minister's death (NIE headline, Jan 2026), his 2020 arrest and 2021 bail (TNM headlines), and the RDS blacklisting (Hindu headline, Jul 2023).
- **hst246:** the possible withdrawal of the state's appeal comes from a TOI headline.
- **hst249:** the June 2026 expansion to Class 8. The NIE page was fetched, including the "15 lakh" figure.
- **hst262:** the Feb 2024 cancellation of the notification comes from a Hindu headline.

## Dropped or not used, and why

- **Kavitha (Delhi excise case):** the case concerns Delhi's policy under the AAP government, and it fits the North/Delhi lane better. Not included, to avoid a mis-tagged `govt`.
- **Jagan Mohan Reddy's DA cases:** the alleged conduct was under the INC government of 2004–09, which would give a confusing `govt` tag. No fresh 2026 status was found.
- **Ajit Pawar irrigation and MSCB cases:** Ajit Pawar died on 28 Jan 2026 (plane crash). I did not want to write a status about a deceased person without a fresh closure record.
- **Eshwarappa (Santosh Patil death) as a stand-alone item:** involves a suicide. Folded into hst235 as a one-clause counterpoint, with the police B report and without names.
- **Life Mission (Kerala):** could not confirm the 2026 status of the ED case against M. Sivasankar.
- **Kerala solar case (2013):** the remaining strands concern sexual-abuse allegations, which are outside scope, and are messy.
- **MP farm-loan waiver (Kamal Nath, "27 lakh farmers"):** the only fetchable page (Factly) debunks a doctored KBC video and does not itself establish the figure. NDTV was blocked. Dropped; the Forward Court lane may want the Factly item.
- **Statue of Unity cost (₹2,989 crore):** The Wire's page rendered no body text. The L&T PDF was not parseable without a PDF tool. Dropped.
- **Mundra heroin, Lashkar-e-Taiba funding claim:** appeared only in a search summary and not on a fetched page, so it was removed from the explanation.
- **Rajkot fire, "no fire NOC":** appeared only in a search summary. The item uses the chargesheet facts instead.
- **Mahadev app, "Baghel denies":** no fetched page quoted his denial. The item uses the Congress counterpoint from Frontline.
- **Tamil Nadu 2026 (TVK government):** the TN items stop before or at the change of government. `Other` is used for no item.

## Per-item sources

| id | state | govt | kind | level | subtopic | sources |
|---|---|---|---|---|---|---|
| hst200 | GJ | BJP | scam | simple | Morbi bridge collapse | [primary](https://m.thewire.in/article/government/administrative-lapses-and-technical-incompetence-behind-morbi-bridge-collapse-sit-says) · [2](https://timesofindia.indiatimes.com/city/ahmedabad/morbi-bridge-collapse-hc-defers-oreva-mds-plea-challenging-charge-framing/articleshow/124879846.cms) · [3](https://indianexpress.com/article/cities/ahmedabad/oreva-group-md-jaysukh-patel-walks-out-jail-sc-grants-bail-morbi-bridge-collapse-case-9235825/) |
| hst201 | GJ | BJP | scam | expert | Mundra port heroin seizure | [primary](https://www.business-standard.com/article/current-affairs/nia-files-2nd-additional-chargesheet-in-mundra-port-narcotics-seizure-case-123022000782_1.html) · [2](https://theprint.in/world/mundra-port-drug-case-2988-kg-heroin-seized-27-arrests-drugs-originated-from-afghanistan-says-mos-rai/1697725/) |
| hst202 | GJ | BJP | scam | extreme | GPSSB junior clerk paper leak | [primary](https://www.indiatvnews.com/education/news/gujarat-junior-clerk-exam-cancelled-after-question-paper-leak-over-10-people-detained-latest-update-2023-01-29-843051) · [2](https://news.careers360.com/gujarat-exam-paper-leak-news-two-held-from-kolkata-number-of-arrests-rises-19) |
| hst203 | GJ | BJP | scam | simple | Rajkot TRP game zone fire | [primary](https://www.business-standard.com/india-news/rajkot-game-zone-fire-police-file-over-100-000-page-chargesheet-against-15-124072401295_1.html) |
| hst204 | GJ | BJP | scheme | simple | Namo Lakshmi Yojana | [primary](https://www.thehindu.com/news/national/gujarat/gujarats-namo-lakshmi-yojana-disburses-924-crore-benefits-over-10-lakh-girl-students/article69796544.ece) |
| hst205 | GJ | BJP | scam | extreme | Fake irrigation office, Chhota Udepur | [primary](https://indianexpress.com/article/cities/ahmedabad/fake-office-bogus-seals-forged-signatures-gujarat-conman-grants-rs-4-crore-held-9003012/) |
| hst206 | GJ | BJP | spend | extreme | Gujarat budget 2026-27 | [primary](https://prsindia.org/budgets/states/gujarat-budget-analysis-2026-27) |
| hst207 | MH | SS | scheme | simple | Ladki Bahin Yojana | [primary](https://www.businesstoday.in/india/story/92-lakh-beneficiaries-removed-from-maharashtras-ladki-bahin-yojana-after-verification-report-542573-2026-07-13) · [2](https://scroll.in/latest/1095195/maharashtra-paid-rs-9605-crore-to-ineligible-beneficiaries-of-ladki-bahin-scheme-report) |
| hst208 | MH | BJP | scheme | expert | Ladki Bahin verification drive | [primary](https://www.businesstoday.in/india/story/92-lakh-beneficiaries-removed-from-maharashtras-ladki-bahin-yojana-after-verification-report-542573-2026-07-13) · [2](https://scroll.in/latest/1095195/maharashtra-paid-rs-9605-crore-to-ineligible-beneficiaries-of-ladki-bahin-scheme-report) |
| hst209 | MH | NCP | scam | expert | ₹100-crore allegation (Anil Deshmukh) | [primary](https://www.tribuneindia.com/news/nation/former-maharashtra-minister-anil-deshmukh-released-from-prison-after-court-refused-to-stay-its-bail-order-465319) · [2](https://www.tribuneindia.com/news/nation/bombay-high-court-grants-bail-to-ex-maharashtra-minister-anil-deshmukh-in-corruption-case-being-probed-by-cbi-460214) |
| hst210 | MH | SS | institution | expert | Shiv Sena split: SC verdict | [primary](https://www.livelaw.in/top-stories/shivsena-supreme-court-maharashtra-case-uddhav-thackeray-eknath-shinde-228476) · [2](https://www.tribuneindia.com/news/nation/sc-verdict-on-maharashtra-political-row-today-506659) |
| hst211 | MH | SS | spend | extreme | Dharavi redevelopment tender | [primary](https://www.tribuneindia.com/news/india/sc-refuses-to-order-status-quo-on-adanis-dharavi-redevelopment-project/amp) |
| hst212 | MH | SS | scam | extreme | BMC jumbo COVID centres case | [primary](https://www.theweek.in/wire-updates/national/2023/09/29/bom23-mh-court-covid-patkar.html) · [2](https://lawtrend.in/bombay-high-court-grants-bail-to-sujit-patkar-in-covid-19-jumbo-centre-scam/) |
| hst213 | MH | BJP | spend | extreme | Maharashtra debt 2026-27 | [primary](https://prsindia.org/budgets/states/maharashtra-budget-analysis-2026-27) |
| hst214 | GA | BJP | institution | expert | Goa mining leases quashed | [primary](https://scroll.in/latest/867824/supreme-court-cancels-goa-mining-leases-asks-government-to-restart-the-auction-process) · [2](https://www.thehindu.com/news/national/supreme-court-cancels-88-mining-leases-in-goa/article61485130.ece) |
| hst215 | GA | BJP | scam | expert | Goa cash-for-jobs cases | [primary](https://indianexpress.com/article/india/goa-cash-for-jobs-scam-scrutinising-accuseds-allegations-cant-take-them-at-face-value-say-police-10362875/) · [2](https://www.thegoan.net/goa-news/jobsforcash-rackets-multiple-arrests-but-questions-remain/121498.html) |
| hst216 | GA | BJP | institution | simple | Arpora nightclub fire | [primary](https://www.indiatvnews.com/news/india/magisterial-probe-exposes-major-lapses-behind-goa-nightclub-fire-2025-12-28-1023551) |
| hst217 | GA | INC | scam | expert | Louis Berger bribery case | [primary](https://www.hindustantimes.com/cities/others/louis-berger-bribery-case-hc-in-goa-grants-relief-to-ex-cm-kamat-and-alemao-101777908919673.html) · [2](https://www.newindianexpress.com/india/2021/Jul/22/louis-berger-bribery-goa-court-orders-framing-of-charges-against-digambar-kamat-churchill-alemao-2333860.html) |
| hst218 | GA | BJP | scheme | simple | Griha Aadhar | [primary](https://www.thegoan.net/goa-news/another-bonanza-on-cards-govt-to-enhance-dsss-griha-aadhar-by-rs-500/153962.html) · [2](https://timesofindia.indiatimes.com/city/goa/50k-griha-aadhar-recipients-risk-removal-without-docus/articleshow/130723570.cms) |
| hst219 | GA | BJP | spend | extreme | Goa debt 2026-27 | [primary](https://prsindia.org/budgets/states/goa-budget-analysis-2026-27) |
| hst220 | MP | BJP | scheme | extreme | Ladli Behna Yojana | [primary](https://prsindia.org/budgets/states/madhya-pradesh-budget-analysis-2026-27) · [2](https://www.aninews.in/news/national/general-news/mp-cm-mohan-yadav-to-transfer-rs-1500-ladli-behna-installment-additional-rs-250-as-raksha-bandhan-gift-today20260819130847) |
| hst221 | MP | BJP | scam | expert | Vyapam cases | [primary](https://www.bhaskarenglish.in/local/mp/news/indore-cbi-court-jails-10-for-vyapam-patwari-exam-scam-convicted-for-cheating-impersonation-in-2008-recruitment-136688144.html) |
| hst222 | MP | BJP | scam | expert | Nursing-college recognition case | [primary](https://www.hindustantimes.com/india-news/nursing-college-scam-cbi-suspends-officer-over-bribery-charge-101716405596448.html) · [2](https://www.thehindu.com/news/national/madhya-pradesh/mp-nursing-college-bribery-scam-cbi-inspector-terminated-from-service/article68204206.ece) |
| hst223 | MP | BJP | scam | simple | Mahakal Lok statues | [primary](https://indianexpress.com/article/india/madhya-pradesh-lokayukta-investigate-damage-mahakal-lok-corridor-statues-8641287/) · [2](https://timesofindia.indiatimes.com/city/bhopal/mahakal-lok-scam-probe-lokayukta-summons-smart-city-top-official/articleshow/108722419.cms) |
| hst224 | MP | INC | institution | simple | Fall of the Kamal Nath government | [primary](https://indianexpress.com/article/india/kamal-nath-resigns-madhya-pradesh-cm-government-falls-6323939/) |
| hst225 | MP | BJP | spend | extreme | MP debt 2026-27 | [primary](https://prsindia.org/budgets/states/madhya-pradesh-budget-analysis-2026-27) |
| hst226 | CT | INC | scam | simple | Mahadev betting app case | [primary](https://frontline.thehindu.com/politics/mahadev-betting-app-case/article71238138.ece) |
| hst227 | CT | INC | scam | expert | Chhattisgarh liquor case | [primary](https://www.thehindu.com/news/national/chhattisgarh/chhattisgarh-liquor-scam-case-supreme-court-rejects-pleas-of-ed-state-against-grant-of-bail-to-chaitanya-baghel/article71252745.ece) · [2](https://www.thehindu.com/news/national/madhya-pradesh/supreme-court-grants-interim-bail-to-former-chhattisgarh-minister-in-two-liquor-scam-cases/article70588132.ece) |
| hst228 | CT | INC | scam | extreme | Coal levy case | [primary](https://www.deccanchronicle.com/nation/proceeds-of-crime-used-for-polls-ed-attaches-more-assets-in-chhattisgarh-coal-scam-1930127) · [2](https://www.livelaw.in/top-stories/supreme-court-grants-interim-bail-to-chhattisgarh-coal-scam-accused-suryakant-tiwari-ranu-sahu-saumya-chaurasia-293715) |
| hst229 | CT | BJP | scheme | simple | Mahtari Vandan Yojana | [primary](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2013167) · [2](https://www.aninews.in/news/national/general-news/chhattisgarh-cm-vishnu-deo-sai-to-transfer-rs-64134-crore-to-6847-lakh-women-across-the-state20260130051453) |
| hst230 | CT | INC | scheme | expert | Godhan Nyay Yojana | [primary](https://indianexpress.com/article/india/chhattisgarh-baghel-government-buying-cow-urine-make-pesticide-fertiliser-8056924/) |
| hst231 | CT | BJP | scam | expert | NAN (civil supplies) case | [primary](https://www.thehindu.com/news/national/cbi-takes-over-case-of-chhattisgarh-ex-bureaucrats-former-ag-influencing-nan-scam-probe/article69465718.ece) · [2](https://www.business-standard.com/india-news/chhattisgarh-nan-scam-ed-gets-4-week-custody-of-2-ex-ias-officers-125092300121_1.html) |
| hst232 | CT | BJP | spend | extreme | Chhattisgarh subsidies 2026-27 | [primary](https://prsindia.org/budgets/states/chhattisgarh-budget-analysis-2026-27) |
| hst233 | KA | INC | scam | simple | MUDA site allotment case | [primary](https://www.thehindu.com/news/national/karnataka/muda-case-bengaluru-special-court-accepts-b-report-filed-by-lokayukta-police-giving-clean-chit-to-siddaramaiah-and-wife-parvathi/article70560918.ece) · [2](https://www.hindustantimes.com/india-news/ed-moves-karnataka-hc-against-closure-of-muda-case-involving-cm-siddaramaiah-101775569553796.html) · [3](https://www.livelaw.in/high-court/karnataka-high-court/karnataka-high-court-activist-snehamayi-krishna-b-report-muda-scam-545843) |
| hst234 | KA | INC | scam | extreme | Valmiki ST Corporation case | [primary](https://indianexpress.com/article/cities/bangalore/karnataka-valmiki-scam-cbi-chargesheet-b-nagendra-accused-10721351/) · [2](https://www.thehindu.com/news/national/karnataka/b-nagedra-resigns-from-karnataka-cabinet-amid-valmiki-corporation-scam-row/article71400624.ece) · [3](https://english.gujaratsamachar.com/news/national/b-nagendra-resigns-from-karnataka-cabinet-over-valmiki-corporation-scam-says-i-am-innocent-56888072515) |
| hst235 | KA | BJP | scam | extreme | ‘40% commission’ inquiry | [primary](https://www.thehindu.com/news/national/karnataka/40-commission-allegations-sit-to-study-nagamohan-das-panel-report/article69439640.ece) · [2](https://indianexpress.com/article/cities/bangalore/karnataka-congress-govt-covid-scam-40-percent-commission-probe-delay-10613922/) · [3](https://www.thehindu.com/news/cities/Mangalore/death-of-contractor-police-give-clean-chit-to-eshwarappa/article65662553.ece) |
| hst236 | KA | BJP | scam | expert | PSI recruitment case | [primary](https://indianexpress.com/article/cities/bangalore/strong-prima-facie-case-karnataka-hc-ips-amrit-paul-plea-criminal-trial-psi-recruitment-scam-10307757/) · [2](https://www.thehindu.com/news/national/karnataka/karnataka-high-court-grants-bail-to-ips-officer-amrit-paul-in-psi-scam/article67344589.ece) |
| hst237 | KA | INC | scheme | extreme | Five guarantees: cost | [primary](https://prsindia.org/budgets/states/karnataka-budget-analysis-2026-27) |
| hst238 | KA | INC | spend | expert | CAG on guarantees vs infrastructure | [primary](https://prsindia.org/budgets/states/karnataka-budget-analysis-2026-27) |
| hst239 | KL | LDF | scam | extreme | CMRL–Exalogic case | [primary](https://www.hindustantimes.com/india-news/pinarayi-vijayan-rejects-opposition-s-call-for-his-resignation-over-sfio-charges-against-his-daughter-101744226231065.html) · [2](https://www.thestatesman.com/india/kerala-court-hands-ed-access-to-key-sfio-records-in-cmrl-exalogic-case-dealing-setback-to-veena-vijayan-and-cmrl-1503603456.html) |
| hst240 | KL | LDF | scam | simple | Diplomatic-baggage gold case | [primary](https://www.thehindu.com/news/national/kerala/kerala-gold-smuggling-sc-issues-notice-to-accused-on-eds-plea-for-transfer-of-trial-to-karnataka/article69486638.ece) · [2](https://english.metrovaartha.com/news/court-grants-pardon-to-accused-in-2020-kerala-gold-smuggling-case) |
| hst241 | KL | LDF | scam | simple | Karuvannur co-operative bank case | [primary](https://www.thehindu.com/news/national/kerala/karuvannur-bank-case-court-accepts-eds-supplementary-chargesheet-against-cpim-party-leaders/article71069271.ece) · [2](https://thesouthfirst.com/kerala/karuvannur-bank-scam-court-finds-prima-facie-case-against-cpim-mp-and-mla/) |
| hst242 | KL | UDF | scam | expert | Palarivattom flyover case | [primary](https://timesofindia.indiatimes.com/city/kochi/palarivattom-flyover-scam-vigilance-department-awaits-government-approval-to-proceed/articleshow/115061942.cms) · [2](https://www.thehindu.com/news/cities/Kochi/palarivattom-flyover-to-be-demolished/article29429907.ece) · [3](https://www.thehindu.com/news/cities/Kochi/palarivattom-flyover-fiasco-pwd-blacklists-rds-projects-for-five-years/article67067907.ece) |
| hst243 | KL | UDF | spend | simple | K-Rail SilverLine scrapped | [primary](https://www.thehindu.com/news/national/kerala/keralas-udf-govt-scraps-k-rail-project-launched-by-ldf/article71001199.ece) |
| hst244 | KL | UDF | scheme | expert | Oommen Chandy Health Insurance | [primary](https://prsindia.org/budgets/states/kerala-budget-analysis-2026-27) |
| hst245 | TN | DMK | scam | simple | Cash-for-jobs case (Senthil Balaji) | [primary](https://dailypioneer.com/news/spp-to-conduct-trial-against-senthil-balaji-tn-to-sc) · [2](https://www.thehindu.com/news/national/supreme-court-stays-senthilbalajis-arrest-in-tasmac-corruption-case/article71290196.ece) |
| hst246 | TN | DMK | scam | simple | TASMAC money-laundering probe | [primary](https://lawbeat.in/top-stories/tasmac-money-laundering-probe-supreme-court-declines-to-examine-legality-of-ed-searches-at-this-stage-1604279) · [2](https://timesofindia.indiatimes.com/city/chennai/tn-may-withdraw-appeal-in-sc-against-ed-action-on-tasmac/articleshow/132029081.cms) |
| hst247 | TN | AIADMK | scam | simple | Jayalalithaa assets case | [primary](https://indianexpress.com/article/india/aiadmk-j-jayalalithaa-da-case-corruption-supreme-court-karnataka-government-4600606/) |
| hst248 | TN | DMK | scheme | expert | Kalaignar Magalir Urimai Thogai | [primary](https://www.thehindu.com/news/national/tamil-nadu/opposition-parties-slam-tamil-nadu-cm-stalin-5000-payout-to-women-under-kalaignar-magalir-urimai-thogai-scheme/article70627629.ece) |
| hst249 | TN | DMK | scheme | extreme | CM’s Breakfast Scheme | [primary](https://www.thehindu.com/news/national/tamil-nadu/cms-breakfast-scheme-to-be-expanded-to-benefit-2059-lakh-students-says-stalin/article69972026.ece) · [2](https://www.newindianexpress.com/states/tamil-nadu/2026/Jun/16/cm-breakfast-scheme-expanded-up-to-class-8-in-tamil-nadu) |
| hst250 | TN | AIADMK | scheme | expert | Amma Canteens | [primary](https://www.downtoearth.org.in/governance/how-tamil-nadu-s-amma-canteen-scheme-stood-the-test-of-time-77776) |
| hst251 | TN | DMK | spend | extreme | Power-sector PSU debt | [primary](https://prsindia.org/budgets/states/tamil-nadu-budget-analysis-2026-27) |
| hst252 | AP | TDP | scam | simple | Skill development case | [primary](https://thesouthfirst.com/andhrapradesh/acb-court-approves-closure-of-skill-development-scam-case-against-andhra-cm-chandrababu-naidu/) · [2](https://www.deccanherald.com/india/andhra-pradesh/acb-court-allows-cid-to-close-ap-skill-development-case-against-chandrababu-naidu-3860822) · [3](https://www.newindianexpress.com/states/andhra-pradesh/2026/Mar/06/ex-apssdc-chief-moves-hc-against-case-closure) |
| hst253 | AP | YSRCP | scam | extreme | AP liquor policy case | [primary](https://www.thenewsminute.com/andhra-pradesh/ysrcp-mp-midhun-reddy-arrested-in-alleged-andhra-liquor-scam-case) · [2](https://www.thehindu.com/news/national/andhra-pradesh/andhra-liquor-scam-enforcement-directorate-summons-rajampet-mp-mithun-reddy/article70524816.ece) · [3](https://timesofindia.indiatimes.com/city/vijayawada/andhra-pradesh-hc-partially-modifies-acb-bail-order-for-midhun-reddy-in-liquor-scam-case/articleshow/129560940.cms) |
| hst254 | AP | YSRCP | spend | expert | Rushikonda buildings | [primary](https://www.newindianexpress.com/states/andhra-pradesh/2026/Jul/04/aptdc-invites-expression-of-interest-for-rushikonda-palace) · [2](https://thesouthfirst.com/opinion/one-building-two-years-no-decision-the-cost-of-andhras-rushikonda-delay/) |
| hst255 | AP | YSRCP | scam | extreme | SECI solar deal and US allegation | [primary](https://www.thehindu.com/news/national/andhra-pradesh/adani-indictment-allegations-against-jagan-andhra-government-are-incorrect-ysr-congress/article68895313.ece) · [2](https://www.thehindu.com/news/national/andhra-pradesh/indictment-of-adani-former-ap-cm-bribed-with-1750-crore-in-a-power-deal-alleges-us-sec/article68893644.ece) · [3](https://thesouthfirst.com/andhrapradesh/despite-corruption-taint-why-naidu-regime-will-continue-jagan-seci-adani-power-deal/) |
| hst256 | AP | YSRCP | spend | expert | Off-budget borrowings (CAG) | [primary](https://prsindia.org/budgets/states/andhra-pradesh-budget-analysis-2026-27) |
| hst257 | AP | TDP | scheme | extreme | NTR Bharosa pensions | [primary](https://www.newindianexpress.com/states/andhra-pradesh/2026/Sep/23/rs-33485-crore-for-ntr-bharosa-pensions-in-2026-27-minister-kondapalli-srinivas) |
| hst258 | AP | TDP | scheme | simple | Talliki Vandanam | [primary](https://thesouthfirst.com/andhrapradesh/tdp-led-andhra-government-launches-talliki-vandanam-scheme-ahead-of-first-anniversary/) · [2](https://m.economictimes.com/news/india/andhra-naidu-talliki-vandanam-rs-8745-crore-benefit-mothers-schoolchildren/articleshow/121778604.cms) |
| hst259 | TG | BRS | scam | expert | Kaleshwaram: Ghose commission | [primary](https://indianexpress.com/article/legal-news/kaleshwaram-case-telangana-high-court-quashes-pc-ghose-commission-findings-against-kcr-others-10649575/) · [2](https://timesofindia.indiatimes.com/city/hyderabad/t-to-seek-cbi-probe-into-kaleshwaram-cm-to-meet-director/articleshow/130478011.cms) |
| hst260 | TG | BRS | spend | simple | Medigadda barrage damage | [primary](https://indianexpress.com/article/legal-news/kaleshwaram-case-telangana-high-court-quashes-pc-ghose-commission-findings-against-kcr-others-10649575/) |
| hst261 | TG | BRS | scam | extreme | Formula-E race case | [primary](https://www.thehindu.com/news/cities/Hyderabad/brs-leader-rama-rao-appears-before-court-in-formula-e-race-case/article71289911.ece) · [2](https://www.newindianexpress.com/states/telangana/2026/Sep/19/ktr-again-appears-before-acb-court) |
| hst262 | TG | BRS | scam | expert | TSPSC Group-1 paper leak | [primary](https://indianexpress.com/article/cities/hyderabad/telangana-hc-orders-reconduct-of-tspsc-group-1-prelims-exam-cancelled-second-time-8953187/) · [2](https://www.thehindu.com/news/national/telangana/telangana-tspsc-cancels-group-i-notification-new-notification-likely-today/article67863444.ece) |
| hst263 | TG | INC | scheme | simple | Rythu Bandhu to Rythu Bharosa | [primary](https://www.thehindubusinessline.com/economy/agri-business/telangana-farmers-to-receive-rs-12000-per-acre-annually-under-rythu-bharosa-scheme/article69063900.ece) · [2](https://prsindia.org/budgets/states/telangana-budget-analysis-2026-27) |
| hst264 | TG | INC | institution | simple | Kancha Gachibowli land | [primary](https://indianexpress.com/article/india/supreme-court-stays-tree-felling-kancha-gachibowli-area-telangana-9922091/) |
| hst265 | TG | INC | spend | extreme | Six guarantees: cost | [primary](https://prsindia.org/budgets/states/telangana-budget-analysis-2026-27) |

## Fact audit (26 Sep 2026)

Independent release-gate audit of all 66 items (hst200–hst265). Every `sourceUrl` and every URL in
`sources` was fetched (curl + HTML-to-text; WebFetch for The Week and ThePrint, which block curl).
Status lines were refreshed against Google News reporting up to 26 Sep 2026. No items dropped; ids
unchanged. `otherSide` added to all 39 items that have `people`, `status` or `kind: 'scam'` (plus
hst264). Whole bank: `node scripts/hisaab-validate.mjs` prints OK; `tests/hisaab-bank.test.mjs` passes.
Lane difficulty is now simple 21 / expert 23 / extreme 22 (hst258 moved simple → expert).

### Private individuals (charter §2.7)
- **hst227** rebuilt around the public office holder: the stem now asks the condition of ex-excise
  minister Kawasi Lakhma's SC interim bail (Feb 2026: stay out of Chhattisgarh except for court).
  The former CM's son is no longer named, described or listed in `people`; the old source (whose
  headline named him) was replaced by NIE (21 Feb 2026) + Verdictum (3 Feb 2026), neither of which
  mentions him.
- **hst239** keeps the daughter unnamed: the stem says "an IT firm owned by a relative of then-CM
  Pinarayi Vijayan"; stem, explanation and status never name her; the Statesman source whose URL
  carried her name was dropped; the HT `sourceLabel` was shortened to end at "SFIO charges".
- **hst200** Morbi: the Oreva MD is a private-company executive (Ajanta Manufacturing Pvt Ltd is
  not a public company), so his name was removed from explanation, status and `people`.
- Checked and left unnamed: Chhota Udepur conman (hst205), jumbo-COVID partner (hst212), Goa
  cash-for-jobs accused (hst215), game-zone co-owners (hst203), coal-levy businessmen and the
  Congress ex-treasurer (hst228), Mundra accused (hst201), gold-case accused (hst240), MUDA
  complainant and the CM's wife (hst233), BJP economic-cell convenor (hst226). hst239 and hst233
  still refer to a relative by relationship because the case is about that allotment/payment.

### Corrections of fact
- **hst235**: the Nagamohan Das commission said contractors did **not** prove the 40% figure ("may
  not be 100% true", DH 12 Sep 2025) — the old text only said the minister was evasive. Added the
  Sept 2025 study committee and the Mar 2026 Council reply that the SIT was not yet formed.
- **hst246**: the SC **stayed** the ED's TASMAC probe in May 2025 ("crossing all limits") — missing
  before; status no longer says "ED probe ongoing" without that.
- **hst255**: US criminal charges against Adani executives dismissed at the DOJ's request (10 Aug
  2026), SEC case settled for $18m without admission, FCPA counts against five co-defendants still
  pending (Wire, 5 Sep 2026). US filings name no AP official; Jagan Mohan Reddy added to `people`
  (he is in the Hindu headline) with "not charged, denies wrongdoing".
- **hst250**: Down To Earth's "about 400 canteens in the state" (2021) matches Chennai's count
  only; statewide there were 620 in May 2026 (TOI, official release: 383 GCC + 237 elsewhere).
  Re-anchored the stem on the May 2026 figure (answer "About 620"), `year` 2026.
- **hst221**: the Patwari case began as a 2012 Khargone FIR (chargesheet 2014), not "a 2014 chargesheet".
- **hst238**: removed "partly financed with borrowing" (not in PRS/CAG text); now says the schemes
  raised revenue expenditure and the revenue deficit (PRS citing CAG Report No. 4 of 2025).
- **hst223**: the Lokayukta took suo motu cognisance of the statue damage; the Congress MLA's
  complaint was the earlier (2022) one. BJP's March-2019-work-order reply moved to `otherSide`.
- **hst229**: PIB release (403 to every fetcher) replaced by TOI (10 Mar 2024); unverifiable
  "widows/divorced/deserted" detail dropped; "68.47 lakh" (ANI headline) corrected to "about 68
  lakh" (ANI body: 68,39,592).
- **hst248**: "(ECI)" attribution replaced by TOI (13 May 2026), which states 108/59/47.
- **hst242**: "arrested 2020, HC bail 2021" could not be sourced; status now says the Governor
  sanctioned his prosecution in 2020 (NIE obituary, Jan 2026).
- **hst233**: Siddaramaiah ceased to be CM on 3 Jun 2026 (D.K. Shivakumar sworn in); stem reworded.
- **hst243**: "championed as a flagship" replaced by what the source says (launched by the LDF).

### Status refreshed (asOf 2026-09)
hst201 (Gujarat HC bail for delay Apr 2026; SC refused to cancel Aug 2026) · hst203 (discharge
refused up to SC Nov 2025; all on bail May 2026) · hst205 (₹21.15 crore since 2016; 10 arrested incl.
a retired IAS officer; main accused died in custody May 2024) · hst209 (Governor's ED sanction filed
Aug 2026; CBI case still pre-charge, court rebuked delay pleas Aug 2026) · hst211 (Seclink SC appeal
deferred Nov 2025) · hst212 (supplementary chargesheet Dec 2024) · hst215 (Crime Branch found no
evidence for the accused's claims Dec 2025; narco-test plea Jan 2026) · hst226 (CBI FIR naming Baghel,
Dec 2024; CBI's July 2026 chargesheets vs 66 accused) · hst228 (EOW arrested a Congress leader Jul
2026) · hst231 (HC refused pre-arrest bail May 2026) · hst233 (HC hearings Aug–Sep 2026; Desai
commission clearance Sept 2025) · hst234 (third CBI chargesheet; ED questioning Sept 2026) · hst236
(ED attachment Jan 2026; departmental chargesheet Jul 2026) · hst239 (ED sought FIR, state chose a
preliminary enquiry, Kerala HC hearing 26 Sep 2026) · hst241 (leaders bailed Jul 2026) · hst245
(anticipatory bail in the MLA-poaching case; denial Sept 2026) · hst252 (ED found no evidence of
Naidu's role, Feb 2026) · hst253 (SIT now puts loss at ₹3,500 crore; stem pinned to the July 2025
₹3,200 crore figure) · hst254 (HC PIL against lease; nothing leased, Jul 2026) · hst259 (CBI probe
limited to three barrages, Jul 2026).

### Answer giveaways fixed
- hst229 `outcome` stated ₹655 crore = answer of **hdb238** → replaced with the Jan 2026 cumulative.
- hst259 `explanation` named Medigadda = answer of **hst260** → "a barrage's piers".
- hst257 `explanation` stated the Centre's ₹200 = answer of **hdb043** → re-angled.
- hst207 `enactedBy` listed Ajit Pawar = answer of **hdb240** → removed (Shinde remains).
- hst207 `sourceLabel` carried "92 lakh" = answer of **hst208** → primary swapped to Scroll.
- hst248 re-angled to the ₹5,000 lump sum because **hdb237**'s outcome states "1.31 crore".
- hst258 re-angled to the 67-lakh roll-out because **hdb227**'s stem names Amma Vodi at ₹15,000.

### Unresolved / for other lanes and the reviewer
- **hdb238** (dist-west-south) explanation states "₹1,000-a-month" = answer of hst229; **hdb216**
  explanation's "₹4 a litre" (milk subsidy) coincides with hst230's answer. Not editable here.
- **hgh019** (scams) asks what happened to the US charges in Aug 2026; hst255's `status` must state
  that dismissal (charter §2.2), so a player who sees hst255's receipt first learns it. Kept out of
  hst255's explanation/otherSide.
- Newest reporting not found (searched): Seclink SC appeal after Nov 2025; GPSSB, Chhota Udepur and
  TSPSC leak trials; Mahakal Lok Lokayukta since Mar 2024; whether Tamil Nadu actually withdrew its
  TASMAC appeal; formal CBI case number in Kaleshwaram. Gujarat Samachar items dated Jul 2026 on
  Morbi appear to be re-dated older stories and were not used.
- High stale risk (re-check monthly): hst239 (FIR decision / HC ruling due), hst245, hst233, hst209,
  hst255 (co-defendants), hst246, hst253.
