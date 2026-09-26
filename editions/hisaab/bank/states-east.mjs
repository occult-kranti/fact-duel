// HISAAB DO — lane: States — East & North-East (prefix `hst`, ids 300–399). See docs/hisaab/CHARTER.md §2–§5.
// Research notes, sources, drops and stale-risk items: docs/hisaab/research/states-east-notes.md
// Every item was checked against the page in `sourceUrl` in September 2026. `govt` records the party
// that governed the state when the conduct or fact in the item happened (see the notes for the rule).

// ── Shared sources ────────────────────────────────────────────────────────────
const PRS = (slug) => `https://prsindia.org/budgets/states/${slug}`;
const PRS_WB_2627 = PRS('west-bengal-budget-analysis-2026-27');
const PRS_OD_2627 = PRS('odisha-budget-analysis-2026-27');
const PRS_OD_1920 = PRS('odisha-budget-analysis-2019-20');
const PRS_AS_2627 = PRS('assam-budget-analysis-2026-27');
const PRS_AR_2627 = PRS('arunachal-pradesh-budget-analysis-2026-27');
const PRS_MN_2627 = PRS('manipur-budget-analysis-2026-27');
const PRS_MZ_2627 = PRS('mizoram-budget-analysis-2026-27');
const PRS_MZ_2425 = PRS('mizoram-budget-analysis-2024-25');
const PRS_NL_2627 = PRS('nagaland-budget-analysis-2026-27');
const PRS_ML_2627 = PRS('meghalaya-budget-analysis-2026-27');
const PRS_SK_2627 = PRS('sikkim-budget-analysis-2026-27');
const PRS_TR_2627 = PRS('tripura-budget-analysis-2026-27');

const NIE_WB_CAG_2026 =
  'https://www.newindianexpress.com/states/west-bengal/2026/Jul/25/wb-tables-28-cag-reports-after-four-years-bjp-govt-plans-action-over-alleged-amphan-relief-scam';
const AIR_RESULTS_2026 = 'https://newsonair.gov.in/bjp-set-to-form-government-in-west-bengal-and-assam-nda-retains-puducherry/';
const MPOST_KHANDU_PE =
  'https://www.millenniumpost.in/big-stories/sc-orders-cbi-enquiry-into-award-of-contracts-to-firms-linked-to-arunachal-cms-kin-654867';
const MPOST_KHANDU_AUG =
  'https://www.millenniumpost.in/big-stories/supreme-court-summons-arunachal-chief-secretary-home-secretary-for-non-cooperation-in-cbi-probe-against-cm-pema-khandu-670794';
const HINDU_KHANDU_SEP =
  'https://www.thehindu.com/news/national/himachal-pradesh/congress-targets-pm-modi-over-cbi-inquiry-into-irregularities-involving-arunachal-cm/article71480423.ece';
const ANI_KHANDU_MAY =
  'https://aninews.in/news/national/politics/i-am-innocent-arunachal-cm-pema-khandu-on-corruption-allegations-vows-to-cooperate-with-cbi-investigation20260505221432/';
const AIR_MN_PR_REVOKED = 'https://newsonair.gov.in/presidents-rule-revoked-in-manipur/';
const NIE_ML_BLAST_TOLL =
  'https://www.newindianexpress.com/india/2026/Feb/10/meghalaya-coal-mine-blast-two-more-die-in-assam-hospital-toll-rises-to-30';
const NIE_ML_BLAST_PROBE =
  'https://www.newindianexpress.com/india/2026/Feb/15/retired-hc-judge-to-head-judicial-probe-into-blast-at-meghalayas-illegal-coal-mine';
const NIE_SKM_2024 =
  'https://www.newindianexpress.com/india/2024/Jun/02/bjp-capitalises-on-weakened-opposition-in-arunachal-welfare-schemes-do-wonders-for-skm-in-sikkim';

export const HISAAB_STATES_EAST = Object.freeze([
  // ── West Bengal ─────────────────────────────────────────────────────────────
  {
    id: 'hst300',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Education & Exams',
    subtopic: 'WBSSC 2016 school recruitment',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2025,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      "On 3 April 2025 the Supreme Court upheld the cancellation of West Bengal's 2016 school-staff recruitment by the School Service Commission. Roughly how many appointments did that void?",
    options: ['About 8,000', 'About 25,700', 'About 42,000', 'About 64,000'],
    correctIndex: 1,
    explanation:
      'The bench led by CJI Sanjiv Khanna voided 25,753 teaching and non-teaching appointments, calling the process "vitiated and tainted" (rank-jumping, mark discrepancies, letters to off-panel candidates). It ordered fresh selection; untainted staff need not refund pay. The state government had appealed the Calcutta HC order of April 2024.',
    status:
      'Supreme Court judgment, 3 Apr 2025: 25,753 appointments void, fresh selection ordered. Separate CBI/ED criminal cases against former officials pending trial as of Sept 2026 (ED filed further charge sheets in June and Aug 2026); no convictions.',
    otherSide:
      "The TMC state government had appealed, calling the High Court's order 'arbitrary'; after the verdict the then CM said fresh recruitment would be held within three months.",
    people: ['Sanjiv Khanna'],
    sourceUrl:
      'https://www.tribuneindia.com/news/india/west-bengal-recruitment-row-sc-upholds-hc-verdict-invalidating-25753-teachers-other-staff-in-west-bengal-schools',
    sourceLabel: 'The Tribune — SC upholds HC verdict invalidating 25,753 teachers, other staff in WB schools (3 Apr 2025)',
    sources: [
      'https://newsonair.gov.in/sc-upholds-calcutta-hc-order-of-invalidating-appointment-of-more-than-25000-teachers',
      'https://www.tribuneindia.com/news/india/west-bengal-moves-supreme-court-against-calcutta-high-court-order-on-job-scam-614241/amp',
      'https://www.tribuneindia.com/news/india/ed-files-additional-chargesheet-in-bengals-ssc-assistant-teacher-recruitment-scam/',
    ],
  },
  {
    id: 'hst301',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Education & Exams',
    subtopic: 'School-jobs case: cash seizure',
    kind: 'scam',
    difficulty: 'expert',
    year: 2022,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      'After arresting a sitting West Bengal minister in the school-jobs case in July 2022, the ED said it seized roughly how much cash from homes linked to one of his associates?',
    options: ['About Rs 5 crore', 'About Rs 20 crore', 'About Rs 50 crore', 'About Rs 150 crore'],
    correctIndex: 2,
    explanation:
      'Nearly Rs 50 crore in cash plus gold was seized after ex-education minister Partha Chatterjee was arrested. He was dropped from the cabinet and TMC posts, and said he was a "victim of conspiracy" and the money was not his. He walked out on bail in Nov 2025 after 3+ years in custody; the trial is pending.',
    status:
      'Arrested by ED, July 2022; charge-sheeted by the ED and CBI in several school-jobs cases (latest ED filings June and Aug 2026); on bail, released Nov 2025. On 17 Sept 2026 the CBI told a special court he breached bail conditions; his lawyer cited ill health. Not convicted; denies wrongdoing.',
    otherSide:
      'Chatterjee called himself "a victim of a conspiracy" and said of the seized cash, "This is not my money"; he has not been convicted.',
    people: ['Partha Chatterjee'],
    sourceUrl: 'https://thefederal.com/category/states/east/west-bengal/school-jobs-scam-case-partha-chatterjee-granted-bail-208647',
    sourceLabel: 'The Federal — School jobs "scam": ex-Bengal minister Partha Chatterjee granted bail after 3 years (26 Sep 2025)',
    sources: [
      'https://www.tribuneindia.com/news/nation/i-am-victim-of-conspiracy-time-will-tell-if-action-against-me-justified-partha-chatterjee-416869',
      'https://www.thehansindia.com/kolkata/cbi-accuses-former-bengal-minister-partha-chatterjee-of-violating-bail-conditions-in-ssc-teachers-recruitment-scam-1122920',
      'https://zeenews.india.com/india/its-not-mine-this-money-partha-chatterjee-makes-explosive-claim-2491457.html',
      'https://dailypioneer.com/news/ed-files-fresh-chargesheet-in-bengal-ssc-staff',
    ],
  },
  {
    id: 'hst302',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Farm & Food',
    subtopic: 'Ration-distribution (PDS) case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2023,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      "The ED arrested Jyotipriya Mallick in October 2023 in a probe into alleged irregularities in Bengal's public distribution system. Which department had he headed from 2011 to 2021?",
    options: ['Finance', 'School Education', 'Panchayats & Rural Development', 'Food & Supplies'],
    correctIndex: 3,
    explanation:
      'The ED alleges subsidised ration grain was diverted while he was food minister and called him the "ringmaster". A special court granted him bail in Jan 2025 after about 13 months in custody. Mallick calls the case a political "conspiracy". He lost his Habra seat in 2026 and quit his TMC posts in June 2026.',
    status:
      'Arrested by ED, 27 Oct 2023; ED charge sheet filed 12 Dec 2023; on bail since 15 Jan 2025; trial pending as of Sept 2026. Not convicted; says the case is politically motivated.',
    otherSide:
      'Mallick calls the case "a deep conspiracy by a political party" and says it is politically motivated; he has not been convicted.',
    people: ['Jyotipriya Mallick'],
    sourceUrl:
      'https://www.theweek.in/news/india/2025/01/15/west-bengal-ration-scam-former-minister-jyotipriya-mallick-gets-bail-walks-out-of-jail-after-13-months.html',
    sourceLabel: 'The Week — Ration scam: former minister Jyotipriya Mallick gets bail after 13 months (15 Jan 2025)',
    sources: [
      'https://www.newindianexpress.com/states/west-bengal/2026/Mar/23/victory-with-record-margin-will-be-answer-to-conspiracy-behind-jailing-me-tmcs-jyotipriya-mallick',
      'https://theprint.in/india/ex-bengal-minister-jyotipriya-mallick-granted-bail-in-ration-case-tmc-hails-courts-decision/2446898/',
      'https://www.deccanherald.com/india/west-bengal/ed-files-chargesheet-against-bengal-minister-jyoti-priya-mallick-businessman-in-ration-scam-2808053',
      'https://www.millenniumpost.in/bengal/jyotipriya-mallick-quits-all-tmc-posts-cites-failing-health-664903',
    ],
    tags: ['distribution'],
  },
  {
    id: 'hst303',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Governance & Institutions',
    subtopic: 'Narada sting case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2021,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      'In May 2021 the CBI arrested two sitting West Bengal ministers, an MLA and a former Kolkata mayor in the Narada sting case. Which court had ordered the CBI probe in 2017?',
    options: ['The Calcutta High Court', 'The Supreme Court', 'A special CBI court', 'The state Lokayukta'],
    correctIndex: 0,
    explanation:
      'The tapes, released before the 2016 polls, purportedly showed leaders accepting cash. The four got interim bail and were charge-sheeted by the CBI and the ED in 2021. The ED said its probe would continue against others, incl. Suvendu Adhikari, then BJP opposition leader and CM since May 2026; he was not charge-sheeted, which the TMC called partisan.',
    status:
      'Four arrested May 2021, on bail; charge-sheeted (CBI May 2021, ED Sept 2021); trial pending. Suvendu Adhikari not charge-sheeted: the CBI said in May 2021 it lacked Lok Sabha sanction to probe him (an MP in 2014); no later filing found as of Sept 2026, nor any public response from him on the Narada allegation. None convicted.',
    otherSide:
      'The TMC said the Centre was "using the central agencies to throttle the voice of the opposition"; none of the accused has been convicted.',
    people: ['Suvendu Adhikari'],
    sourceUrl:
      'https://www.aninews.in/news/national/general-news/narada-scam-cbi-arrests-bengal-ministers-firhad-hakim-subrata-mukherjee-others20210517123817/',
    sourceLabel: 'ANI — Narada scam: CBI arrests Bengal ministers Firhad Hakim, Subrata Mukherjee, others (17 May 2021)',
    sources: [
      'https://www.business-standard.com/article/politics/ed-files-chargesheet-against-senior-trinamool-leaders-in-narada-case-121090101448_1.html',
      'https://scroll.in/latest/995265/narada-case-cbi-says-it-did-not-have-sanction-to-investigate-against-suvendu-adhikari-three-others',
      NIE_WB_CAG_2026,
    ],
  },
  {
    id: 'hst304',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Governance & Institutions',
    subtopic: 'Cattle-smuggling case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2022,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      "The CBI arrested Anubrata Mondal in August 2022 in the cross-border cattle-smuggling case. He was the Trinamool Congress's president in which district?",
    options: ['Murshidabad', 'Malda', 'Nadia', 'Birbhum'],
    correctIndex: 3,
    explanation:
      'The case concerns alleged smuggling of cattle across the India–Bangladesh border; the CBI froze deposits of about Rs 17 crore it linked to him and his family. He got bail from the Supreme Court in the CBI case (July 2024) and from a Delhi court in the ED case (Sept 2024). In July 2026 he joined a rebel camp against the TMC leadership.',
    status:
      'Arrested by CBI, 11 Aug 2022; on bail in the CBI case (SC, 30 Jul 2024) and the ED case (Rouse Avenue court, 20 Sept 2024); trial pending as of Sept 2026. Not convicted.',
    otherSide:
      'Bailing him, the Supreme Court noted the trial was not going to begin soon; his counsel blamed the ED for the delay. No public denial of the charges by Mondal was found.',
    people: ['Anubrata Mondal'],
    sourceUrl: 'https://lawbeat.in/top-stories/supreme-court-grants-bail-anubrata-mondal-cattle-smuggling-case',
    sourceLabel: 'LawBeat — Supreme Court grants bail to Anubrata Mondal in cattle smuggling case (30 Jul 2024)',
    sources: [
      'https://www.millenniumpost.in/bengal/cattle-smuggling-anubrata-granted-bail-in-ed-case-likely-to-return-to-birbhum-next-week-580393',
      'https://www.aninews.in/news/national/general-news/cattle-smuggling-case-delhi-court-grants-bail-to-tmcs-anubrata-mondal20240920204044/',
      'https://www.newindianexpress.com/states/west-bengal/2026/Jul/15/abhishek-sent-me-to-jail-told-mamata-four-times-to-remove-him-tmc-rebel-anubrata-madan-echoes-charge',
    ],
  },
  {
    id: 'hst305',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Health',
    subtopic: 'R.G. Kar hospital finances case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2024,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      "The CBI's financial-irregularities case against the former principal of Kolkata's R.G. Kar Medical College grew out of a petition filed by whom?",
    options: [
      "The hospital's former deputy superintendent",
      'The CAG of India',
      'The state health department',
      "A junior doctors' association",
    ],
    correctIndex: 0,
    explanation:
      "The petition alleged misuse of public funds, mismanagement of bodies and resale of biomedical waste. The Calcutta HC moved the probe to the CBI, which arrested Sandip Ghosh on 2 Sept 2024 and charge-sheeted him. The state sanctioned his prosecution in the CBI case in 2025; the new BJP government cleared the ED's in May 2026. He remains in custody and has sought bail in the Supreme Court.",
    status:
      'Arrested by CBI, 2 Sept 2024; charge-sheeted; prosecution sanctioned (CBI case 2025, ED case May 2026); in custody. SC issued notice on his bail plea in Aug 2026, CBI reply due 15 Oct 2026. Not convicted.',
    otherSide:
      'His bail plea says no money trail or unaccounted wealth has been traced to him and that the investigation is complete; he has not been convicted.',
    people: ['Sandip Ghosh'],
    sourceUrl:
      'https://www.livelaw.in/top-stories/supreme-court-seeks-cbi-response-on-sandip-ghoshs-bail-plea-in-rg-kar-medical-hospital-case-547520',
    sourceLabel: "LiveLaw — Supreme Court seeks CBI response on Sandip Ghosh's bail plea in RG Kar case (27 Aug 2026)",
    sources: [
      'https://newsonair.gov.in/cbi-arrests-former-principal-of-r-g-kar-medical-college-and-hospital-dr-sandip-ghosh-over-financial-misconduct',
      'https://dailypioneer.com/news/slug-lite/the-supreme-court-on-tuesday-issued-notice-to-the-central-bureau-of-investigation-on-the-bail-plea-of-sandip-ghosh-former-principal-of-rg-kar-medical-college-and-hospital-in-the-financial-irregularities-case?year=2026',
      'https://www.newsonair.gov.in/west-bengal-govt-allows-ed-to-prosecute-former-principal-of-r-g-kar-medical-college-in-financial-irregularity-case/',
    ],
  },
  {
    id: 'hst306',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Banking & Finance',
    subtopic: 'Saradha chit fund',
    kind: 'scam',
    difficulty: 'simple',
    year: 2014,
    asOf: '2026-09',
    govt: 'TMC',
    question:
      'In May 2014 the Supreme Court took the Saradha chit-fund investigation away from the West Bengal police. Which agency did it hand the probe to?',
    options: ['NIA', 'SEBI', 'CBI', 'SFIO'],
    correctIndex: 2,
    explanation:
      "Saradha collapsed in 2013 after allegedly raising about Rs 2,500 crore from depositors in Bengal, Odisha and the North-East; about Rs 1,900 crore allegedly went unpaid. The court cited the case's inter-state reach. Its former chairman got Supreme Court bail in a CBI case in Aug 2026, the court noting his custody in it since Dec 2016.",
    status:
      'Probe transferred to CBI by SC order of 9 May 2014; former chairman granted bail by SC on 18 Aug 2026 after nearly 10 years in custody in that case; trials pending as of Sept 2026.',
    otherSide:
      'The TMC state government had strongly resisted handing the probe to the CBI; the court said state police had made no headway on the conspiracy or the money trail.',
    sourceUrl: 'https://www.scconline.com/blog/post/2026/08/20/sc-grants-bail-to-sudipta-sen-in-saradha-chit-fund-case/',
    sourceLabel: 'SCC Online — SC grants bail to Saradha ex-chairman in chit fund case (20 Aug 2026)',
    sources: ['https://www.moneylife.in/article/supreme-court-asks-cbi-to-probe-saradha-other-ponzi-scams/37324.html'],
  },
  {
    id: 'hst307',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Welfare & Subsidies',
    subtopic: 'Annapurna Bhandar',
    kind: 'scheme',
    difficulty: 'simple',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "West Bengal's new BJP government replaced the TMC's Lakshmir Bhandar with Annapurna Bhandar in 2026. What monthly transfer does it promise eligible women?",
    options: ['Rs 1,500', 'Rs 2,000', 'Rs 2,500', 'Rs 3,000'],
    correctIndex: 3,
    explanation:
      'Lakshmir Bhandar (2021) paid Rs 1,500–1,700 and cost Rs 26,700 crore in 2025-26; Annapurna is budgeted at Rs 36,000 crore for 2026-27 (PRS) but excludes taxpayers, car owners and higher-income homes. A Sept 2026 ground report found many applicants unpaid; the CM said 1.48 crore women had been paid in August.',
    sourceUrl: PRS_WB_2627,
    sourceLabel: 'PRS Legislative Research — West Bengal Budget Analysis 2026-27 (2026)',
    sources: [
      'https://www.thequint.com/news/bengal-cash-transfer-scheme-bjp-government-non-payment-women-woes',
      'https://www.theweek.in/news/india/2026/05/27/west-bengal-women-s-welfare-scheme-annapurna-bhandar-application-forms-out-here-s-who-will-benefit.html',
    ],
    tags: ['distribution'],
    enactedBy: [
      { name: 'Suvendu Adhikari', role: 'Chief Minister, West Bengal', party: 'BJP' },
      { name: 'Swapan Dasgupta', role: 'Finance Minister, West Bengal (presented the 2026-27 budget)', party: 'BJP' },
    ],
  },
  {
    id: 'hst308',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Governance & Institutions',
    subtopic: 'CAG reports tabled after a gap',
    kind: 'institution',
    difficulty: 'expert',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "In July 2026 West Bengal's finance minister placed 28 CAG audit reports before the Assembly. How long had it been since CAG reports were last tabled there?",
    options: ['About six months', 'Two years', 'Four years', 'Ten years'],
    correctIndex: 2,
    explanation:
      'The new BJP government said the previous TMC government had not tabled CAG reports since 2022. The CM said FIRs would be sought if the CAG audit of Cyclone Amphan relief (2020) showed wrongdoing — an announcement, not a finding of guilt; no charge sheet had been reported as of Sept 2026. The audit put 2024-25 debt at 38.66% of GSDP, just above the 38% FRBM benchmark.',
    sourceUrl: NIE_WB_CAG_2026,
    sourceLabel: 'The New Indian Express — WB tables 28 CAG reports after four years (25 Jul 2026)',
    sources: [PRS_WB_2627, 'https://www.outlookindia.com/national/inside-the-cag-audit-of-west-bengals-amphan-relief'],
    otherSide: 'The TMC rejects BJP allegations over CAG findings, saying audit observations do not by themselves establish wrongdoing, and accuses the BJP of using audit reports for political ends.',
  },
  {
    id: 'hst309',
    domain: 'civics',
    region: 'India',
    state: 'WB',
    topic: 'Elections & Funding',
    subtopic: '2026 Assembly election',
    kind: 'institution',
    difficulty: 'simple',
    year: 2026,
    asOf: '2026-09',
    govt: 'TMC',
    question: "The BJP's win in the May 2026 West Bengal Assembly election ended how many years of Trinamool Congress rule?",
    options: ['10 years', '15 years', '20 years', '25 years'],
    correctIndex: 1,
    explanation:
      "The TMC had governed since 2011. All India Radio reported the BJP won more than two-thirds of the seats; AIR noted it was the first time since 1972 that Bengal would be ruled by the party in power at the Centre. The BJP's first budget was presented in June 2026.",
    sourceUrl: AIR_RESULTS_2026,
    sourceLabel: 'All India Radio — BJP set to form government in West Bengal and Assam (5 May 2026)',
    sources: [PRS_WB_2627],
  },

  // ── Odisha ──────────────────────────────────────────────────────────────────
  {
    id: 'hst310',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Welfare & Subsidies',
    subtopic: 'Subhadra Yojana',
    kind: 'scheme',
    difficulty: 'simple',
    year: 2024,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Under Odisha's Subhadra Yojana, launched in September 2024, how much does each eligible woman aged 21–60 receive in total?",
    options: ['Rs 50,000 over five years', 'Rs 10,000 over one year', 'Rs 25,000 over five years', 'Rs 1 lakh over ten years'],
    correctIndex: 0,
    explanation:
      "The new BJP state government's flagship scheme pays Rs 10,000 a year and was expected to cover more than one crore women; the first transfer, on 17 Sept 2024, sent Rs 1,250 crore to about 25 lakh women. Odisha's 2026-27 budget allots Rs 10,145 crore to it — about 5% of revenue spending (PRS).",
    sourceUrl: 'https://www.newsonair.gov.in/pm-to-launch-odisha-govts-flagship-initiative-subhadra-scheme-in-bhubaneswar',
    sourceLabel: "All India Radio — PM launches Odisha government's flagship Subhadra scheme (17 Sep 2024)",
    sources: [PRS_OD_2627],
    tags: ['distribution'],
    enactedBy: [{ name: 'Mohan Charan Majhi', role: 'Chief Minister, Odisha', party: 'BJP' }],
    outcome:
      'The first transfer, made at the launch on 17 Sept 2024, sent Rs 1,250 crore to about 25 lakh women (AIR); 2026-27 allocation Rs 10,145 crore (PRS).',
  },
  {
    id: 'hst311',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Elections & Funding',
    subtopic: '2024 Assembly election',
    kind: 'institution',
    difficulty: 'extreme',
    year: 2024,
    asOf: '2026-09',
    govt: 'BJD',
    question:
      "How many of the Odisha Assembly's 147 seats did the BJP win in 2024, ending the Biju Janata Dal's 24 years in power?",
    options: ['51', '62', '78', '91'],
    correctIndex: 2,
    explanation:
      'Final results: BJP 78, BJD 51, Congress 14, CPI(M) 1 and three independents. The BJD had governed since 2000; the new BJP government presented its first budget in July 2024.',
    sourceUrl:
      'https://www.outlookindia.com/elections/odisha-vidhan-sabha-result-2024-updates-bjp-majority-bjd-rule-to-end-full-list-of-winners',
    sourceLabel: "Outlook — Odisha Assembly Election Result 2024: BJD's 24-year rule ends (Jun 2024)",
    sources: [PRS('odisha-budget-analysis-2024-25')],
  },
  {
    id: 'hst312',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Banking & Finance',
    subtopic: 'State debt compared',
    kind: 'spend',
    difficulty: 'expert',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      'Per PRS summaries of the 2026-27 state budgets, which of these states expects the lowest outstanding liabilities as a share of its GSDP?',
    options: ['West Bengal', 'Odisha', 'Mizoram', 'Nagaland'],
    correctIndex: 1,
    explanation:
      'End-2026-27 estimates: Odisha 14.1% of GSDP; West Bengal 38%; Nagaland 41% (excluding central capex loans); Mizoram 43.5%. Odisha also budgets a revenue surplus of 3% of GSDP; its ratio is up from 13.1% in 2025-26 (revised).',
    sourceUrl: PRS_OD_2627,
    sourceLabel: 'PRS Legislative Research — Odisha Budget Analysis 2026-27 (2026)',
    sources: [PRS_WB_2627, PRS_NL_2627, PRS_MZ_2627],
  },
  {
    id: 'hst313',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Farm & Food',
    subtopic: 'KALIA scheme',
    kind: 'scheme',
    difficulty: 'simple',
    year: 2019,
    asOf: '2026-09',
    govt: 'BJD',
    question:
      "The BJD government's KALIA scheme, allotted Rs 5,611 crore in Odisha's 2019-20 budget, gives financial support to which group?",
    options: [
      'Pregnant and nursing mothers',
      'Unemployed graduates',
      'Farm families incl. sharecroppers and landless labourers',
      'Urban street vendors',
    ],
    correctIndex: 2,
    explanation:
      "PRS: KALIA sought to support about 75 lakh farm families, including small and marginal farmers, sharecroppers and landless agricultural labourers. Odisha's 2026-27 budget under the BJP allots Rs 6,088 crore to its Samrudha Krushaka Yojana for farmers.",
    sourceUrl: PRS_OD_1920,
    sourceLabel: 'PRS Legislative Research — Odisha Budget Analysis 2019-20 (2019)',
    sources: [PRS_OD_2627],
    tags: ['distribution'],
    enactedBy: [{ name: 'Niranjan Pujari', role: 'Finance Minister, Odisha (presented the 2019-20 budget)', party: 'BJD' }],
  },
  {
    id: 'hst314',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Health',
    subtopic: 'PVTG nutrition centres (CAG)',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2024,
    asOf: '2026-09',
    govt: 'BJD',
    question:
      'Odisha set up 116 nutrition centres in 2020 for children and mothers of particularly vulnerable tribal groups. How many did the CAG find still non-functional in March 2024?',
    options: ['9', '24', '38', '55'],
    correctIndex: 3,
    explanation:
      'The CAG said 55 centres, set up at a cost of Rs 3.59 crore, never ran because no budget was provided for operating costs, so at least 8,517 young children and 5,972 pregnant and nursing mothers missed the service. The whole period audited (2020–March 2024) fell under the BJD government.',
    sourceUrl:
      'https://www.newindianexpress.com/cities/bhubaneswar/2026/Apr/02/nrcs-failed-children-of-particularly-vulnerable-tribal-groups-in-need-of-nourishment-cag',
    sourceLabel: 'The New Indian Express — NRCs failed children of particularly vulnerable tribal groups: CAG (2 Apr 2026)',
    sources: ['https://cag.gov.in/uploads/download_audit_report/2025/Chapter-1-069cbab6fa14b30.84392419.pdf'],
    otherSide: "The ST & SC Development Department told the CAG (Sept 2025) that funds were not the problem, as it needed the Women and Child department's approval to run the centres, and promised to run them under the programme's next phase.",
  },
  {
    id: 'hst315',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Education & Exams',
    subtopic: 'Police SI exam paper leak',
    kind: 'scam',
    difficulty: 'simple',
    year: 2025,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Odisha's police sub-inspector recruitment exam, set for October 2025, was hit by a question-paper scandal. Which agency filed the charge sheet in January 2026?",
    options: ['CBI', 'Odisha Crime Branch', 'Enforcement Directorate', 'NIA'],
    correctIndex: 0,
    explanation:
      "The Crime Branch had arrested 125 people, 114 of them candidates, before the Centre gave the case to the CBI at the state's request (Nov 2025). The CBI says the recruitment board hired a central PSU, which sublet work to a private firm that roped in another agency; a question set was allegedly swapped before printing.",
    status:
      'CBI charge sheet filed 2 Jan 2026; accused include promoters of two private agencies; trial pending. In Sept 2026 the CBI told the state the board chairman "may be required to be examined"; he is not named an accused (SC hearing, 24 Sept 2026). No convictions.',
    otherSide:
      'The CBI says the private agencies kept the recruitment board "completely in dark"; no public reply from the accused was reported as of Sept 2026.',
    sourceUrl: 'https://www.newindianexpress.com/cities/bhubaneswar/2026/Jan/06/third-party-agencies-changed-si-exam-paper-cbi',
    sourceLabel: 'The New Indian Express — Third-party agencies changed SI exam paper: CBI (6 Jan 2026)',
    sources: [
      'https://www.newindianexpress.com/cities/bhubaneswar/2025/Nov/12/centre-hands-over-odisha-si-recruitment-scam-probe-to-cbi-after-state-request',
      'https://www.newindianexpress.com/states/odisha/2026/Sep/02/cbi-likely-to-question-oprb-chairman-susanta-kumar-nath-over-si-recruitment-scam',
      'https://www.barandbench.com/news/arent-you-treating-him-as-accused-supreme-court-questions-odisha-for-excluding-ips-officer-from-dgp-selection',
    ],
  },
  {
    id: 'hst316',
    domain: 'civics',
    region: 'India',
    state: 'OD',
    topic: 'Energy & Mining',
    subtopic: 'OMC mining penalties (CAG)',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2022,
    asOf: '2026-09',
    govt: 'BJD',
    question:
      'A CAG audit found the state-run Odisha Mining Corporation paid about how much in penalties for producing minerals beyond environmental or forest clearance limits?',
    options: ['Rs 980 crore', 'Rs 4,364 crore', 'Rs 11,200 crore', 'Rs 23,500 crore'],
    correctIndex: 1,
    explanation:
      "The audit (to March 2023) found 14 of OMC's 18 operative mines produced 29.47 million tonnes in 2000-11 beyond clearance limits or without forest clearance. After the Supreme Court's Aug 2017 ruling that such output is illegally mined, OMC paid Rs 4,364.15 crore in penalties; Rs 3,761.88 crore of it between 2017 and 2022. BJD-led governments were in office throughout.",
    sourceUrl:
      'https://www.newindianexpress.com/cities/bhubaneswar/2026/Apr/01/odisha-mining-corporation-pays-rs-4364-crore-penalty-for-illegal-excess-mineral-production',
    sourceLabel: 'The New Indian Express — Odisha Mining Corporation pays Rs 4,364 crore penalty (1 Apr 2026)',
    sources: ['https://cag.gov.in/uploads/download_audit_report/2025/Audit-Report_No.-6-of-2025_PSU_English-069cb90f7c66626.08739142.pdf'],
    otherSide: 'The state government told the CAG (May 2024) that the penalties were paid late because OMC was pursuing legal remedies; the CAG said the reply did not explain why output broke the clearance limits.',
  },

  // ── Assam ───────────────────────────────────────────────────────────────────
  {
    id: 'hst317',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Governance & Institutions',
    subtopic: 'NRC final list',
    kind: 'institution',
    difficulty: 'simple',
    year: 2019,
    asOf: '2026-09',
    govt: 'BJP',
    question: "How many people were left out of Assam's final National Register of Citizens, published on 31 August 2019?",
    options: ['About 19 lakh', 'About 40 lakh', 'About 75 lakh', 'About 1.3 crore'],
    correctIndex: 0,
    explanation:
      'The NRC state coordinator said 3,11,21,004 people were found eligible and 19,06,657 were left out, including those who did not file claims; an earlier draft had left out about 40 lakh. Those excluded could appeal to Foreigners Tribunals.',
    sourceUrl:
      'https://www.indiatoday.in/india/story/nrc-final-list-how-and-where-to-check-your-name-on-assam-national-register-of-citizens-1593695-2019-08-31',
    sourceLabel: 'India Today — NRC final list: how and where to check your name (31 Aug 2019)',
  },
  {
    id: 'hst318',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Governance & Institutions',
    subtopic: 'NRC update: CAG audit',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2022,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "The CAG's audit of Assam's NRC update, tabled in December 2022, said the project's cost rose from Rs 288 crore in 2014 to roughly what by March 2022?",
    options: ['About Rs 400 crore', 'About Rs 750 crore', 'About Rs 1,100 crore', 'About Rs 1,600 crore'],
    correctIndex: 3,
    explanation:
      'The CAG put the cost at Rs 1,602.66 crore and flagged excess and inadmissible payments to vendors and 215 software utilities added "in a haphazard manner", which it said risked data tampering without an audit trail. It said a valid, error-free NRC had not been achieved and sought action over irregular payments.',
    sourceUrl: 'https://scroll.in/latest/1040532/cag-flags-irregularities-in-assams-nrc-exercise',
    sourceLabel: "Scroll — CAG flags irregularities in Assam's NRC exercise (25 Dec 2022)",
    sources: ['https://cag.gov.in/uploads/download_audit_report/2022/Report-No.-4-of-2022-Govt.-of-Assam_SEGS-063d89eeff1c6d5.93730240.pdf'],
    otherSide: "Assam's Home and Political Department replied (Jan 2022) that the NRC was a Government of India project run under Supreme Court supervision, with the state giving only logistic support.",
  },
  {
    id: 'hst319',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Jobs & Economy',
    subtopic: 'APSC cash-for-jobs case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2014,
    asOf: '2026-09',
    govt: 'INC',
    question:
      'In July 2024 a special court convicted 32 people, including a former Assam Public Service Commission chairman, in a cash-for-jobs case. Recruitment to which posts was at issue?',
    options: ['Agricultural development officers', 'Police sub-inspectors', 'Government school teachers', 'Civil judges'],
    correctIndex: 0,
    explanation:
      'The case concerned agricultural development officer posts advertised in 2013 and filled in 2014; it was investigated for eight years. The court convicted the former chairman, two former commission members and 29 officers who paid for their jobs, and acquitted 11 people. The Gauhati HC later suspended the sentences pending appeal.',
    status:
      'Convicted by a special court on 22 Jul 2024 (32 convicted, 11 acquitted); sentenced 29 Jul 2024 (ex-chairman 14 years). The Gauhati HC suspended the sentences and bailed 26 convicts pending appeal (2024); appeals still pending as of Apr 2026.',
    otherSide:
      'The Gauhati High Court suspended the sentences and granted bail to 26 of the convicts in 2024 while their appeals are heard.',
    sourceUrl:
      'https://timesofindia.indiatimes.com/city/guwahati/assam-cash-for-job-scam-apsc-ex-chief-among-32-convicted/articleshow/111937784.cms',
    sourceLabel: 'Times of India — Assam cash-for-job scam: APSC ex-chief among 32 convicted (23 Jul 2024)',
    sources: [
      'https://www.newsonair.gov.in/sentences-pronounced-for-apsc-agriculture-development-officer-recruitment-scam',
      'https://assamtribune.com/assam/gauhati-hc-suspends-verdict-in-apsc-cash-for-jobs-scam-grants-bail-to-26-accused-1549937',
      'https://thefederal.com/category/states/north-east/assam/apsc-cash-for-job-scam-assam-biggest-recruitment-scandal-at-a-legal-crossroads-240797',
    ],
  },
  {
    id: 'hst320',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Welfare & Subsidies',
    subtopic: 'Orunodoi',
    kind: 'scheme',
    difficulty: 'expert',
    year: 2022,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Assam's Orunodoi cash transfer for women began in October 2020 at Rs 830 a month per family. What had the monthly amount risen to by 2022?",
    options: ['Rs 900', 'Rs 1,000', 'Rs 1,250', 'Rs 1,500'],
    correctIndex: 2,
    explanation:
      'It rose to Rs 1,000 in 2021 and Rs 1,250 in 2022. Beneficiaries grew from 17 lakh (2020-21) to 24 lakh (2024-25) and payouts from Rs 850 crore to Rs 3,680 crore. PRS puts 2025-26 spending at Rs 6,000 crore (revised) and the 2026-27 allocation at Rs 3,700 crore.',
    sourceUrl: PRS_AS_2627,
    sourceLabel: 'PRS Legislative Research — Assam Budget Analysis 2026-27 (2026)',
    tags: ['distribution'],
  },
  {
    id: 'hst321',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Welfare & Subsidies',
    subtopic: 'Orunodoi lump-sum transfer',
    kind: 'scheme',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      'On 10 March 2026, under two months before the Assam election results, how much did the state send in one go to each of about 40 lakh Orunodoi beneficiaries?',
    options: ['Rs 1,250', 'Rs 2,500', 'Rs 4,000', 'Rs 9,000'],
    correctIndex: 3,
    explanation:
      'PRS notes the Rs 9,000 covered four months of benefits plus a Rs 4,000 festive bonus. Revised estimates put 2025-26 Orunodoi spending at Rs 6,000 crore, well above earlier years. Results came on 4 May 2026 and the BJP-led alliance was re-elected.',
    sourceUrl: PRS_AS_2627,
    sourceLabel: 'PRS Legislative Research — Assam Budget Analysis 2026-27 (2026)',
    sources: [AIR_RESULTS_2026, 'https://www.newsonair.gov.in/polling-ends-peacefully-for-assembly-elections-in-assam-keralam-and-puducherry'],
    tags: ['distribution', 'pre-election'],
    enactedBy: [{ name: 'Himanta Biswa Sarma', role: 'Chief Minister, Assam', party: 'BJP' }],
    outcome:
      'About 40 lakh women got Rs 9,000 each on 10 Mar 2026, 30 days before Assam voted on 9 Apr; 2025-26 Orunodoi spending was revised to Rs 6,000 crore (PRS). The BJP-led NDA won a third straight term (AIR).',
    poll: { label: 'Assam Assembly 2026', month: '2026-04', gapDays: 30, result: 'BJP-led NDA won a third straight term, past the 64-seat majority mark' },
  },
  {
    id: 'hst322',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Elections & Funding',
    subtopic: '2026 Assembly election',
    kind: 'institution',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question: "How many of the Assam Assembly's 126 seats did the BJP itself win in 2026, as its alliance secured a third straight term?",
    options: ['71', '82', '94', '102'],
    correctIndex: 1,
    explanation:
      "All India Radio's tally: BJP 82, Bodoland People's Front 10, AGP 9; Congress 19; AIUDF and Raijor Dal 2 each; TMC 1. The majority mark is 64.",
    sourceUrl: AIR_RESULTS_2026,
    sourceLabel: 'All India Radio — BJP set to form government in West Bengal and Assam (5 May 2026)',
  },
  {
    id: 'hst323',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Banking & Finance',
    subtopic: 'Committed spending',
    kind: 'spend',
    difficulty: 'expert',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Assam's 2026-27 budget ties up 63% of its revenue receipts in 'committed' spending. Which single item takes the biggest share of receipts?",
    options: ['Salaries', 'Pensions', 'Interest payments', 'Power subsidies'],
    correctIndex: 0,
    explanation:
      'PRS: salaries take 32% of revenue receipts, pensions 21% and interest 10% (Rs 75,019 crore in all), limiting room for capital spending. In 2024-25, 66% went on these items. The budget was presented on 10 July 2026.',
    sourceUrl: PRS_AS_2627,
    sourceLabel: 'PRS Legislative Research — Assam Budget Analysis 2026-27 (2026)',
  },

  // ── Arunachal Pradesh ───────────────────────────────────────────────────────
  {
    id: 'hst324',
    domain: 'civics',
    region: 'India',
    state: 'AR',
    topic: 'Infrastructure',
    subtopic: 'Contracts to CM-linked firms (PIL)',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "In April 2026 the Supreme Court told the CBI to hold a preliminary enquiry into Arunachal public-works contracts allegedly given to firms linked to CM Pema Khandu's family. Roughly what value was the court told of?",
    options: ['About Rs 127 crore', 'About Rs 1,270 crore', 'About Rs 5,400 crore', 'About Rs 12,700 crore'],
    correctIndex: 1,
    explanation:
      "Petitioners said about Rs 1,270 crore of contracts over 10 years went to four firms tied to relatives of BJP Chief Minister Pema Khandu; the enquiry covers 2015–2025. The state called the PIL 'sponsored litigation'. In Aug 2026 the CBI reported state non-cooperation and the court summoned top officials. Congress has sought his resignation; he remains CM.",
    status:
      'Preliminary enquiry ordered by the Supreme Court on 6 Apr 2026; CBI reported state non-cooperation (Jul 2026); ongoing as of Sept 2026, no FIR or charge sheet reported. Khandu has not been charged and says he is innocent.',
    otherSide:
      'Khandu said "I am innocent", called the allegations politically motivated and pledged full cooperation with the CBI; the state had called the PIL "sponsored litigation".',
    people: ['Pema Khandu'],
    sourceUrl: MPOST_KHANDU_PE,
    sourceLabel: "Millennium Post (PTI) — SC orders CBI enquiry into award of contracts to firms linked to Arunachal CM's kin (6 Apr 2026)",
    sources: [MPOST_KHANDU_AUG, HINDU_KHANDU_SEP, ANI_KHANDU_MAY],
  },
  {
    id: 'hst325',
    domain: 'civics',
    region: 'India',
    state: 'AR',
    topic: 'Education & Exams',
    subtopic: 'APPSC paper leak 2022',
    kind: 'scam',
    difficulty: 'simple',
    year: 2022,
    asOf: '2026-09',
    govt: 'BJP',
    question: 'The 2022 Arunachal Pradesh Public Service Commission paper-leak case came to light over which recruitment exam?',
    options: ['Combined civil services exam', 'Police constable exam', 'Lower Division Clerk exam', 'Assistant Engineer (Civil) exam'],
    correctIndex: 3,
    explanation:
      "A candidate's complaint after the August 2022 AE (Civil) exam led to arrests by the state police's Special Investigation Cell, and the APPSC secretary and joint secretary were suspended. The CBI took over on 27 Oct 2022 and charge-sheeted 10 accused that December.",
    status:
      'CBI charge sheet against 10 accused filed Dec 2022; the state dismissed an officer over the leak in Dec 2024; no trial verdict found as of Sept 2026. No convictions.',
    otherSide:
      "The state government itself sought the CBI probe and suspended the commission's secretary and joint secretary; the APPSC chairman resigned on moral grounds.",
    sourceUrl:
      'https://www.newindianexpress.com/india/2022/Dec/09/cbi-files-charge-sheet-in-appsc-question-paper-leak-case-2526546.html',
    sourceLabel: 'The New Indian Express (PTI) — CBI files charge sheet in APPSC question paper leak case (9 Dec 2022)',
    sources: [
      'https://news.careers360.com/appsc-examination-paper-leak-secretary-joint-secretary-suspended',
      'https://www.indiatodayne.in/arunachal-pradesh/story/arunachal-government-terminates-service-of-officer-in-appsc-paper-leak-case-1140632-2024-12-19',
    ],
  },
  {
    id: 'hst326',
    domain: 'civics',
    region: 'India',
    state: 'AR',
    topic: 'Elections & Funding',
    subtopic: '2016 mass switch to BJP',
    kind: 'institution',
    difficulty: 'expert',
    year: 2016,
    asOf: '2026-09',
    govt: 'Other',
    question:
      "On 31 December 2016 Arunachal's chief minister and 32 other MLAs joined the BJP, giving it a full government without an election. Which party were they in that morning?",
    options: ['Indian National Congress', "National People's Party", "People's Party of Arunachal", 'Janata Dal (United)'],
    correctIndex: 2,
    explanation:
      'The Indian Express reported 33 of the PPA\'s 43 MLAs, including the Speaker, moved, lifting the BJP to 47 in the 60-seat House after a year in which the state saw four chief ministers. Pema Khandu said the PPA had suspended them without notice. He has led BJP governments since.',
    status:
      'Political event; no case arises from it. Separately, a Supreme Court-ordered CBI preliminary enquiry into contracts (Apr 2026) was ongoing as of Sept 2026; Khandu has not been charged and says he is innocent.',
    otherSide:
      'Khandu said the PPA had suspended the MLAs "without serving a notice or calling for an explanation", calling that "very undemocratic".',
    people: ['Pema Khandu'],
    sourceUrl:
      'https://indianexpress.com/article/india/arunachal-gets-full-fledged-bjp-govt-as-pema-khandu-32-others-join-saffron-party-4453088/',
    sourceLabel: 'The Indian Express — Arunachal gets full-fledged BJP govt as Pema Khandu, 32 others join (31 Dec 2016)',
    sources: [HINDU_KHANDU_SEP, ANI_KHANDU_MAY],
  },
  {
    id: 'hst327',
    domain: 'civics',
    region: 'India',
    state: 'AR',
    topic: 'Jobs & Economy',
    subtopic: 'Salary bill',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question: "What share of Arunachal Pradesh's 2026-27 revenue receipts is budgeted for government salaries alone, per PRS?",
    options: ['About 46%', 'About 61%', 'About 72%', 'About 84%'],
    correctIndex: 0,
    explanation:
      'Salaries 46%, pensions 10% and interest 3% add up to committed spending of 60% of revenue receipts (Rs 18,486 crore). Outstanding liabilities are put at 35.1% of GSDP, excluding 50-year central capex loans. The budget was presented on 10 March 2026.',
    sourceUrl: PRS_AR_2627,
    sourceLabel: 'PRS Legislative Research — Arunachal Pradesh Budget Analysis 2026-27 (2026)',
  },

  // ── Manipur ─────────────────────────────────────────────────────────────────
  {
    id: 'hst328',
    domain: 'civics',
    region: 'India',
    state: 'MN',
    topic: 'Governance & Institutions',
    subtopic: 'Budget passed by Parliament',
    kind: 'institution',
    difficulty: 'simple',
    year: 2025,
    asOf: '2026-09',
    govt: "President's Rule",
    question:
      "In March 2025 Manipur's 2025-26 budget, of over Rs 35,000 crore, was presented by the Union Finance Minister in Parliament rather than in the state assembly. Why?",
    options: [
      "The state was under President's Rule",
      'Manipur is a Union Territory',
      'The assembly had been dissolved for early polls',
      'The state had no finance minister',
    ],
    correctIndex: 0,
    explanation:
      "President's Rule under Article 356 began on 13 Feb 2025 after the chief minister resigned, so the legislature's powers passed to Parliament; the assembly was suspended, not dissolved. The Finance Minister said Rs 400 crore was provided for relief camps and 7,000 PMAY houses were sanctioned for displaced people, and announced a Rs 500 crore contingency corpus.",
    sourceUrl: 'https://newsonair.gov.in/fm-nirmala-sitharaman-announces-rs-500-cr-corpus-for-manipur-to-establish-contingency-fund/',
    sourceLabel: 'All India Radio — FM announces Rs 500 cr corpus for Manipur contingency fund (12 Mar 2025)',
    sources: [AIR_MN_PR_REVOKED],
  },
  {
    id: 'hst329',
    domain: 'civics',
    region: 'India',
    state: 'MN',
    topic: 'Governance & Institutions',
    subtopic: "President's Rule revoked",
    kind: 'institution',
    difficulty: 'expert',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "President's Rule imposed in Manipur on 13 February 2025 ended when a new BJP-led government was sworn in. When did that happen?",
    options: ['May 2025', 'August 2025', 'February 2026', 'March 2027'],
    correctIndex: 2,
    explanation:
      "The Home Ministry revoked it on 4 Feb 2026, almost a year later, and a BJP MLA was sworn in as chief minister the same day. The assembly, whose term runs to March 2027, had been kept in suspended animation rather than dissolved.",
    sourceUrl: AIR_MN_PR_REVOKED,
    sourceLabel: "All India Radio — BJP MLA sworn in as Manipur CM; President's Rule revoked (4 Feb 2026)",
    sources: [PRS_MN_2627],
  },
  {
    id: 'hst330',
    domain: 'civics',
    region: 'India',
    state: 'MN',
    topic: 'Welfare & Subsidies',
    subtopic: 'Special central grant',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2025,
    asOf: '2026-09',
    govt: "President's Rule",
    question:
      'To help Manipur rehabilitate internally displaced people, rebuild damaged houses and prepay loans, how large a special grant did the Centre extend to it in 2025-26?',
    options: ['Rs 219 crore', 'Rs 640 crore', 'Rs 1,150 crore', 'Rs 2,198 crore'],
    correctIndex: 3,
    explanation:
      "PRS: the state expects a further Rs 2,140 crore under this head in 2026-27, plus a Rs 2,250 crore gap-filling grant. The 2025-26 grant came while Manipur was under President's Rule (Feb 2025 to Feb 2026).",
    sourceUrl: PRS_MN_2627,
    sourceLabel: 'PRS Legislative Research — Manipur Budget Analysis 2026-27 (2026)',
    tags: ['relief'],
  },
  {
    id: 'hst331',
    domain: 'civics',
    region: 'India',
    state: 'MN',
    topic: 'Jobs & Economy',
    subtopic: 'Government vacancies',
    kind: 'institution',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "As of March 2026, roughly what share of the Manipur government's 1.19 lakh sanctioned posts were vacant, according to its budget papers?",
    options: ['About 18%', 'About 44%', 'About 63%', 'About 79%'],
    correctIndex: 1,
    explanation:
      'PRS: 52,290 posts were vacant. Education had the most, with 54% of 28,766 posts unfilled; medical and health services 41%; Manipur Police 19%. The 2026-27 budget, the first of the restored elected government, was presented on 9 March 2026.',
    sourceUrl: PRS_MN_2627,
    sourceLabel: 'PRS Legislative Research — Manipur Budget Analysis 2026-27 (2026)',
  },

  // ── Meghalaya ───────────────────────────────────────────────────────────────
  {
    id: 'hst332',
    domain: 'civics',
    region: 'India',
    state: 'ML',
    topic: 'Energy & Mining',
    subtopic: 'Rat-hole mining ban',
    kind: 'institution',
    difficulty: 'simple',
    year: 2014,
    asOf: '2026-09',
    govt: 'INC',
    question: 'Which body banned rat-hole coal mining in Meghalaya in April 2014?',
    options: ['The Supreme Court', 'The Meghalaya High Court', 'The Union Coal Ministry', 'The National Green Tribunal'],
    correctIndex: 3,
    explanation:
      'In July 2019 the Supreme Court allowed mining again only in compliance with national mining law and rules. Mining outside that framework is illegal, yet deadly accidents at illegal mines have continued, including in 2018, 2021 and 2026.',
    sourceUrl: 'https://theprint.in/india/another-year-another-mining-tragedy-why-meghalayas-rat-holes-wont-stop-killing/594667/',
    sourceLabel: "ThePrint — Another year, another mining tragedy: why Meghalaya's rat-holes won't stop killing (2 Feb 2021)",
    sources: [NIE_ML_BLAST_PROBE],
  },
  {
    id: 'hst333',
    domain: 'civics',
    region: 'India',
    state: 'ML',
    topic: 'Energy & Mining',
    subtopic: 'Ksan mine flooding 2018',
    kind: 'institution',
    difficulty: 'expert',
    year: 2018,
    asOf: '2026-09',
    govt: 'NPP',
    question:
      "In December 2018 river water flooded an illegal rat-hole coal mine at Ksan in Meghalaya's East Jaintia Hills. How many miners were trapped inside?",
    options: ['15', '28', '41', '60'],
    correctIndex: 0,
    explanation:
      'Water from the nearby Lytein river flooded the mine on 13 Dec 2018 and all the trapped miners died; after a search lasting months, only two bodies were ever retrieved (ThePrint). The mine was operating despite the 2014 ban.',
    sourceUrl: 'https://theprint.in/india/another-year-another-mining-tragedy-why-meghalayas-rat-holes-wont-stop-killing/594667/',
    sourceLabel: "ThePrint — Another year, another mining tragedy: why Meghalaya's rat-holes won't stop killing (2 Feb 2021)",
    sources: ['https://www.newindianexpress.com/india/2026/Feb/05/18-killed-one-injured-in-blast-at-illegal-coal-mine-in-meghalaya'],
  },
  {
    id: 'hst334',
    domain: 'civics',
    region: 'India',
    state: 'ML',
    topic: 'Energy & Mining',
    subtopic: 'Missing seized coal',
    kind: 'scam',
    difficulty: 'simple',
    year: 2025,
    asOf: '2026-09',
    govt: 'NPP',
    question:
      'When about 4,000 tonnes of seized coal vanished from two Meghalaya depots in 2025, what explanation did a state minister suggest?',
    options: [
      'It was auctioned to the state power utility',
      'It was moved to a central warehouse',
      'Heavy rain may have washed it away',
      'It had been exported under licence',
    ],
    correctIndex: 2,
    explanation:
      'The loss surfaced in the 31st interim report of the High Court-appointed Justice B.P. Katakey committee; one depot that had recorded 1,839 tonnes held about 2.5 tonnes. The HC told the state to act against officials. The minister later said he "cannot blame just the rain" and had no conclusive evidence either way.',
    status:
      'FIRs lodged (state status report to the High Court, July 2025); HC directed action against officials responsible; no charge sheet or conviction reported as of Sept 2026. The committee chair is not accused of anything.',
    otherSide:
      'The minister later said he "cannot blame just the rain" and had no conclusive evidence; the state told the High Court that FIRs had been lodged.',
    people: ['B.P. Katakey'],
    sourceUrl:
      'https://www.newindianexpress.com/india/2025/Jul/28/rain-might-have-washed-it-away-meghalaya-minister-after-4000-tonnes-of-coal-go-missing',
    sourceLabel: "The New Indian Express (PTI) — 'Rain might have washed it away': Meghalaya minister on missing coal (28 Jul 2025)",
    sources: [
      'https://www.newindianexpress.com/india/2025/Jul/25/nearly-4000-mt-of-coal-allegedly-disappears-from-meghalaya-depots-hc-slams-government-inaction',
      NIE_ML_BLAST_TOLL,
    ],
  },
  {
    id: 'hst335',
    domain: 'civics',
    region: 'India',
    state: 'ML',
    topic: 'Energy & Mining',
    subtopic: 'Illegal-mine blast 2026',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'NPP',
    question:
      "A suspected dynamite blast at an illegal coal mine in Meghalaya's East Jaintia Hills on 5 February 2026 killed about how many people?",
    options: ['About 5', 'About 12', 'About 30', 'About 80'],
    correctIndex: 2,
    explanation:
      'Eighteen bodies were recovered that day; the toll reached 30 within five days as injured miners died in hospitals in Shillong and Silchar, and a later notification cited 31. Police arrested two alleged mine owners, and the state set up a judicial commission under a retired HC judge.',
    status:
      'FIR registered; two alleged mine owners arrested (Feb 2026); judicial commission appointed 14 Feb 2026 with six months to report; no report made public as of Sept 2026. No convictions.',
    otherSide:
      'CM Conrad Sangma said police were told to take "full action against those responsible" and set up a judicial commission; no reply from the arrested owners was reported.',
    people: ['Conrad Sangma'],
    sourceUrl: NIE_ML_BLAST_TOLL,
    sourceLabel: 'The New Indian Express — Meghalaya coal mine blast: toll rises to 30 (10 Feb 2026)',
    sources: [
      NIE_ML_BLAST_PROBE,
      'https://www.newindianexpress.com/india/2026/Feb/05/18-killed-one-injured-in-blast-at-illegal-coal-mine-in-meghalaya',
      'https://india.mongabay.com/2026/02/incident-at-illegal-coal-mine-resurfaces-concerns-about-banned-rat-hole-mining/',
    ],
  },

  // ── Mizoram ─────────────────────────────────────────────────────────────────
  {
    id: 'hst336',
    domain: 'civics',
    region: 'India',
    state: 'MZ',
    topic: 'Elections & Funding',
    subtopic: '2023 Assembly election',
    kind: 'institution',
    difficulty: 'simple',
    year: 2023,
    asOf: '2026-09',
    govt: 'MNF',
    question: "The Zoram People's Movement won Mizoram in December 2023. What made its government a first for the state?",
    options: [
      'First coalition government',
      'First government led by neither the MNF nor Congress',
      'First BJP-backed government',
      "First elected government after President's Rule",
    ],
    correctIndex: 1,
    explanation:
      "The ZPM won 27 of 40 seats, unseating the Mizo National Front (10); the BJP won 2 and Congress 1. The MNF had governed in 1998–2008 and 2018–23; its outgoing chief minister lost his own seat.",
    sourceUrl:
      'https://www.newindianexpress.com/india/2023/Dec/05/mizoram-zpm-govt-to-be-sworn-in-on-december-8-ex-cm-zoramthanga-quits-as-mnf-chief-2638866.html',
    sourceLabel: 'The New Indian Express — Mizoram ZPM govt to be sworn in on December 8 (5 Dec 2023)',
  },
  {
    id: 'hst337',
    domain: 'civics',
    region: 'India',
    state: 'MZ',
    topic: 'Infrastructure',
    subtopic: 'Bairabi–Sairang rail line',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2025,
    asOf: '2026-09',
    govt: 'ZPM',
    question:
      "The 51.38 km Bairabi–Sairang railway, which in 2025 brought trains to within 20 km of Mizoram's capital, was built at what cost?",
    options: ['Rs 812 crore', 'Rs 1,950 crore', 'Rs 4,300 crore', 'Rs 8,071 crore'],
    correctIndex: 3,
    explanation:
      'Approved in 2008 with work from Nov 2014, the line has 48 tunnels (12.85 km) and a pier bridge 114 m tall. The Prime Minister inaugurated it on 13 Sept 2025. It is a central Railways project; the ZPM governed the state when it opened.',
    sourceUrl:
      'https://www.newindianexpress.com/india/2025/Sep/06/mizorams-capital-set-to-join-indian-railway-network-5138-km-bairabisairang-line-to-boost-connectivity-in-the-northeast',
    sourceLabel: "The New Indian Express — Mizoram's capital set to join Indian Railway network (6 Sep 2025)",
    sources: ['https://newsonair.gov.in/bairabi-sairang-railway-line-in-mizoram-completes-one-year/'],
  },
  {
    id: 'hst338',
    domain: 'civics',
    region: 'India',
    state: 'MZ',
    topic: 'Banking & Finance',
    subtopic: 'Stamp duty and Bana Kaih',
    kind: 'spend',
    difficulty: 'expert',
    year: 2024,
    asOf: '2026-09',
    govt: 'ZPM',
    question:
      "Mizoram's ZPM government used its first budget, for 2024-25, to raise stamp duty on property from 1% of market value to what?",
    options: ['3%', '5%', '7%', '10%'],
    correctIndex: 0,
    explanation:
      "Widows get a concessional 2.5% rate. The same budget allotted Rs 200 crore to 'Bana Kaih', the ZPM's hand-holding policy for people in farming and industry, and held household power tariffs unchanged (PRS).",
    sourceUrl: PRS_MZ_2425,
    sourceLabel: 'PRS Legislative Research — Mizoram Budget Analysis 2024-25 (2024)',
  },
  {
    id: 'hst339',
    domain: 'civics',
    region: 'India',
    state: 'MZ',
    topic: 'Banking & Finance',
    subtopic: 'Fiscal deficit overshoot',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'ZPM',
    question:
      "Mizoram budgeted a 2025-26 fiscal deficit of 4.6% of GSDP. What do the revised estimates in its 2026-27 budget show?",
    options: ['4.6% of GSDP, on target', '7.6% of GSDP', '10.8% of GSDP', '14.2% of GSDP'],
    correctIndex: 1,
    explanation:
      "PRS: spending ran 14% above budget in 2025-26. For 2026-27 the ZPM government targets 3.8%. Outstanding liabilities are projected at 43.5% of GSDP, or 31% excluding the Centre's 50-year interest-free capex loans.",
    sourceUrl: PRS_MZ_2627,
    sourceLabel: 'PRS Legislative Research — Mizoram Budget Analysis 2026-27 (2026)',
  },

  // ── Nagaland ────────────────────────────────────────────────────────────────
  {
    id: 'hst340',
    domain: 'civics',
    region: 'India',
    state: 'NL',
    topic: 'Jobs & Economy',
    subtopic: 'Unadvertised police appointments',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2019,
    asOf: '2026-09',
    govt: 'NDPP',
    question:
      'In September 2024 the Gauhati High Court quashed Nagaland police constable appointments made in 2018–19 without any advertisement. How many appointments?',
    options: ['935', '1,780', '3,100', '5,400'],
    correctIndex: 0,
    explanation:
      'Qualified job-seekers challenged the hiring, noting only 206 posts went through open recruitment. The state argued the appointments were governed by the Nagaland Police Manual. The court let the 935 serve up to six months and ordered an advertised fresh selection, with age relaxation for them. The Supreme Court declined to interfere in Jan 2025.',
    status:
      'Appointments quashed by the Gauhati HC (Kohima Bench) on 20 Sept 2024; Supreme Court dismissed an SLP against it on 21 Jan 2025; fresh recruitment advertised Sept 2025. No criminal case involved.',
    otherSide:
      'The state argued the appointments were governed by the Nagaland Police Manual; after the ruling the DGP said the posts would be advertised afresh.',
    sourceUrl:
      'https://www.newindianexpress.com/india/2024/Sep/21/gauhati-hc-quashes-backdoor-appointment-of-935-nagaland-police-constables',
    sourceLabel: "The New Indian Express — Gauhati HC quashes 'backdoor' appointment of 935 Nagaland police constables (21 Sep 2024)",
    sources: [
      'https://morungexpress.com/nagaland-to-initiate-fresh-process-to-recruit-935-police-constables-as-hc-quashes-previous-recruitments',
      'https://morungexpress.com/nagalands-legal-landscape-2025-governance-cases-dominate-court-proceedings',
    ],
  },
  {
    id: 'hst341',
    domain: 'civics',
    region: 'India',
    state: 'NL',
    topic: 'Jobs & Economy',
    subtopic: 'Committed spending',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2025,
    asOf: '2026-09',
    govt: 'NDPP',
    question:
      "Per actual figures for 2024-25 cited by PRS, what share of Nagaland's revenue receipts went on salaries, pensions and interest?",
    options: ['About 28%', 'About 45%', 'About 58%', 'About 71%'],
    correctIndex: 3,
    explanation:
      "For 2026-27 the budget projects 68% (salaries 40%, pensions 20%, interest 7%), leaving little for capital outlay; neighbouring Meghalaya budgets 31%. Nagaland's outstanding liabilities are put at about 41% of GSDP, excluding capex loans.",
    sourceUrl: PRS_NL_2627,
    sourceLabel: 'PRS Legislative Research — Nagaland Budget Analysis 2026-27 (2026)',
    sources: [PRS_ML_2627],
  },
  {
    id: 'hst342',
    domain: 'civics',
    region: 'India',
    state: 'NL',
    topic: 'Governance & Institutions',
    subtopic: 'Urban local body polls 2024',
    kind: 'institution',
    difficulty: 'expert',
    year: 2024,
    asOf: '2026-09',
    govt: 'NDPP',
    question:
      "Nagaland's urban local body elections of 26 June 2024 were the first with 33% of seats reserved for women. They were also the first since which year?",
    options: ['1994', '2004', '2014', '2019'],
    correctIndex: 1,
    explanation:
      'Polls covered 3 municipal councils and 36 town councils; 142 of 418 wards were reserved for women under the Nagaland Municipal Act, 2023. The previous urban local body polls, in 2004, had no seats reserved for women (AIR).',
    sourceUrl: 'https://newsonair.gov.in/nagaland-to-conduct-urban-local-bodies-ulb-elections-on-june-26/',
    sourceLabel: 'All India Radio — Nagaland to conduct urban local body elections on June 26 (3 May 2024)',
  },
  {
    id: 'hst343',
    domain: 'civics',
    region: 'India',
    state: 'NL',
    topic: 'Elections & Funding',
    subtopic: 'NCP MLAs merge into ruling party',
    kind: 'institution',
    difficulty: 'simple',
    year: 2025,
    asOf: '2026-09',
    govt: 'NDPP',
    question:
      'In May 2025 all seven NCP MLAs in Nagaland merged into which ruling party, taking it to 32 seats in the 60-member House?',
    options: ['BJP', 'NPF', 'NPP', 'NDPP'],
    correctIndex: 3,
    explanation:
      "The Speaker accepted the merger into the NDPP, which ruled with the BJP. In October 2025 the NDPP itself merged into the Naga People's Front, whose legislature party then had 34 members with the chief minister as its leader.",
    sourceUrl: 'https://www.newindianexpress.com/india/2025/May/31/all-seven-ncp-mlas-merge-with-ruling-ndpp-in-nagaland',
    sourceLabel: 'The New Indian Express — All seven NCP MLAs merge with ruling NDPP in Nagaland (31 May 2025)',
    sources: ['https://newsonair.gov.in/chief-minister-neiphiu-rio-elected-leader-of-npf-legislature-party-after-merger/'],
  },

  // ── Sikkim ──────────────────────────────────────────────────────────────────
  {
    id: 'hst344',
    domain: 'civics',
    region: 'India',
    state: 'SK',
    topic: 'Energy & Mining',
    subtopic: 'Teesta-III dam',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2023,
    asOf: '2026-09',
    govt: 'SKM',
    question:
      "Sikkim's 1,200 MW Teesta-III hydro project, wrecked by the October 2023 glacial-lake outburst flood, saw its cost rise from an initial Rs 5,700 crore to about how much?",
    options: ['Rs 7,200 crore', 'Rs 13,965 crore', 'Rs 21,400 crore', 'Rs 32,000 crore'],
    correctIndex: 1,
    explanation:
      "Backed by the SDF government from 2004 and completed five years late in 2017, it was the state's largest hydro project. After South Lhonak lake burst, the SKM government agreed to sell its majority stake to the minority partner, pending approval (2024). An expert panel's approval to rebuild, reported in Feb 2025, was opposed by parties and citizen groups.",
    sourceUrl: 'https://www.aljazeera.com/economy/2024/4/18/a-flash-flood-and-a-quiet-sale-highlight-indias-sikkims-hydro-problems',
    sourceLabel: "Al Jazeera — A flash flood and a quiet sale highlight Sikkim's hydro problems (18 Apr 2024)",
    sources: [
      'https://scroll.in/article/1078987/sikkim-parties-citizen-groups-oppose-approval-to-rebuild-dam-destroyed-in-glacial-deluge',
      'https://www.newindianexpress.com/india/2023/Oct/05/sikkim-flash-flood-2021-study-had-warned-about-threat-of-south-lhonak-lake-bursting-2621117.html',
    ],
  },
  {
    id: 'hst345',
    domain: 'civics',
    region: 'India',
    state: 'SK',
    topic: 'Elections & Funding',
    subtopic: '2024 Assembly election',
    kind: 'institution',
    difficulty: 'expert',
    year: 2024,
    asOf: '2026-09',
    govt: 'SKM',
    question:
      "How many of Sikkim's 32 assembly seats did the ruling SKM win in 2024, a sweep in which the state's longest-serving former CM lost?",
    options: ['17', '23', '28', '31'],
    correctIndex: 3,
    explanation:
      "The SDF won the only other seat; the BJP, Congress and the new Citizen Action Party drew a blank. In 2019 the SKM had won 17 to the SDF's 15, ending 25 years of SDF rule. Observers credited welfare schemes such as Sikkim Aama Yojana.",
    sourceUrl: NIE_SKM_2024,
    sourceLabel: 'The New Indian Express — Welfare schemes do wonders for SKM in Sikkim (2 Jun 2024)',
  },
  {
    id: 'hst346',
    domain: 'civics',
    region: 'India',
    state: 'SK',
    topic: 'Welfare & Subsidies',
    subtopic: 'Sikkim Aama Yojana',
    kind: 'scheme',
    difficulty: 'expert',
    year: 2023,
    asOf: '2026-09',
    govt: 'SKM',
    question:
      "Under the SKM government's Sikkim Aama Yojana, introduced in 2023, what financial grant do eligible non-working mothers aged 18–59 receive?",
    options: ['Rs 20,000', 'Rs 36,000', 'Rs 50,000', 'Rs 1 lakh'],
    correctIndex: 0,
    explanation:
      'It covers eligible non-working, unwed, widowed, divorced or separated mothers. Other SKM schemes include Bahini (free sanitary pads for secondary-school girls) and Vatsalaya (up to Rs 3 lakh for IVF treatment). Observers linked such schemes to the SKM sweep of 2024.',
    sourceUrl: NIE_SKM_2024,
    sourceLabel: 'The New Indian Express — Welfare schemes do wonders for SKM in Sikkim (2 Jun 2024)',
    tags: ['distribution'],
    enactedBy: [{ name: 'Prem Singh Tamang', role: 'Chief Minister, Sikkim', party: 'SKM' }],
  },
  {
    id: 'hst347',
    domain: 'civics',
    region: 'India',
    state: 'SK',
    topic: 'Infrastructure',
    subtopic: 'Capex financed by central loans',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2026,
    asOf: '2026-09',
    govt: 'SKM',
    question:
      "What share of Sikkim's budgeted 2026-27 capital outlay is to be financed by the Centre's 50-year interest-free SASCI loans, per PRS?",
    options: ['About 12%', 'About 30%', 'About 56%', 'About 90%'],
    correctIndex: 2,
    explanation:
      'Sikkim budgets Rs 3,312 crore under SASCI for 2026-27. In 2024-25 these loans (Rs 1,742 crore) paid for half of its capital outlay. They sit outside the annual borrowing ceiling; outstanding liabilities excluding them are about 30% of GSDP.',
    sourceUrl: PRS_SK_2627,
    sourceLabel: 'PRS Legislative Research — Sikkim Budget Analysis 2026-27 (2026)',
  },

  // ── Tripura ─────────────────────────────────────────────────────────────────
  {
    id: 'hst348',
    domain: 'civics',
    region: 'India',
    state: 'TR',
    topic: 'Elections & Funding',
    subtopic: '2018 Assembly election',
    kind: 'institution',
    difficulty: 'simple',
    year: 2018,
    asOf: '2026-09',
    govt: 'CPI(M)',
    question: "The BJP's 2018 win in Tripura ended how many years of Left Front rule in the state?",
    options: ['20', '25', '30', '34'],
    correctIndex: 1,
    explanation:
      'The BJP and its ally IPFT swept the state. The Indian Express noted the BJP had no MLA in the outgoing House and had polled only about 1.5% of the vote five years earlier; the Congress failed to win a seat.',
    sourceUrl:
      'https://indianexpress.com/article/north-east-india/tripura/tripura-election-results-2018-full-list-of-winners-5084676/',
    sourceLabel: 'The Indian Express — Tripura election results 2018: full list of winners (4 Mar 2018)',
  },
  {
    id: 'hst349',
    domain: 'civics',
    region: 'India',
    state: 'TR',
    topic: 'Education & Exams',
    subtopic: 'Terminated teachers',
    kind: 'institution',
    difficulty: 'expert',
    year: 2017,
    asOf: '2026-09',
    govt: 'CPI(M)',
    question:
      'How many Tripura government school teachers were terminated in 2017 and 2020 after the courts struck down the policy under which they had been hired?',
    options: ['1,032', '3,400', '6,800', '10,323'],
    correctIndex: 3,
    explanation:
      "The Tripura High Court held the state's Employment Policy, 2003 'bad-in-law', and the teachers lost their jobs in 2017 and 2020. Groups of them are still litigating in the Supreme Court; in Jan 2026, 350 who say they were hired in 2010 and regularised in 2015 wrote to the CJI, arguing the policy was never notified.",
    sourceUrl:
      'https://www.newindianexpress.com/india/2026/Jan/14/alleging-illegal-termination-350-sacked-tripura-teachers-write-to-cji-seeking-his-urgent-intervention',
    sourceLabel: 'The New Indian Express — 350 sacked Tripura teachers write to CJI (14 Jan 2026)',
    sources: ['https://www.newindianexpress.com/india/2024/Apr/10/700-under-graduate-teachers-from-tripura-move-sc-against-termination-order'],
    otherSide: 'The sacked teachers argue the 2003 policy was never notified, and some say they were hired in 2010 and regularised in 2015; groups of them are still litigating in the Supreme Court.',
  },
  {
    id: 'hst350',
    domain: 'civics',
    region: 'India',
    state: 'TR',
    topic: 'Governance & Institutions',
    subtopic: 'PSU returns (CAG)',
    kind: 'spend',
    difficulty: 'extreme',
    year: 2024,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      'Tripura invested Rs 1,901 crore in its state-owned companies and co-operatives between 2019-20 and 2023-24. How much dividend did it receive in 2023-24, per the CAG?',
    options: ['Rs 7.85 crore', 'Rs 190 crore', 'Rs 612 crore', 'Rs 1,120 crore'],
    correctIndex: 0,
    explanation:
      "Only two joint-stock companies paid, and no other government company did. The CAG (2025) called continued investment in loss-making PSUs with negative net worth 'a significant fiscal risk', with returns far below the state's borrowing costs, and urged a review.",
    sourceUrl: PRS_TR_2627,
    sourceLabel: 'PRS Legislative Research — Tripura Budget Analysis 2026-27 (2026), citing CAG Report No. 1 of 2025',
    sources: ['https://cag.gov.in/uploads/download_audit_report/2025/Report-No.-1-of-2025_SFAR-2023-24-Tripura-(06-06-2025)-069bbe8e1a087a9.43416176.pdf'],
    otherSide: "No reply from Tripura's government to this finding is reported as of Sep 2026; the CAG report, which includes government replies where received, records none on it.",
  },
  {
    id: 'hst351',
    domain: 'civics',
    region: 'India',
    state: 'TR',
    topic: 'Jobs & Economy',
    subtopic: 'Overseas placement scheme',
    kind: 'scheme',
    difficulty: 'simple',
    year: 2026,
    asOf: '2026-09',
    govt: 'BJP',
    question: "Tripura's 2026-27 budget announced the Mukhyamantri Antarjatik Kormosangsthan Prakalpa. What is it meant to do?",
    options: [
      'Give interest-free loans to tea gardens',
      'Pay an unemployment allowance to graduates',
      'Place nursing, ITI, diploma and graduate students in jobs abroad',
      'Build hostels for migrant workers in other states',
    ],
    correctIndex: 2,
    explanation:
      "PRS lists it among the BJP government's employment initiatives, alongside an 'Agartala AI City' for start-ups and start-up hubs in every district. Tripura budgets 54% of its 2026-27 revenue receipts for salaries, pensions and interest.",
    sourceUrl: PRS_TR_2627,
    sourceLabel: 'PRS Legislative Research — Tripura Budget Analysis 2026-27 (2026)',
  },
]);
