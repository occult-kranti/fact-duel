// HISAAB DO — balance cases (hgh100–hgh129).
//
// Why this file exists: the balance audit (docs/hisaab/review/balance.md, §2, §6 F1, §9.1–9.2) found
// 38 opposition politicians named as accused against 2 from the BJP, and almost no accountability
// items for 2000–2013. These items add the well-documented BJP/NDA-side record (convictions,
// commission findings, clearances, cases eased after party switches) plus early-era cases for every
// side, held to the same rules as every other lane: dated legal status, no implied guilt, the other
// side's answer on every item, non-person distractors. Sources and cross-checks:
// docs/hisaab/research/balance-cases-notes.md.
//
// `govt` = who governed at the level concerned when the alleged conduct happened (the
// states-west-south rule the audit recommends bank-wide), not the party of the accused. So a BJP
// minister convicted over leases granted by a Congress state government is coded INC (hgh113), and
// cases eased after a switch to the NDA are coded to the government of the original conduct.
export const HISAAB_BALANCE_CASES = Object.freeze([
  {
    id: 'hgh100',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Defence & Security',
    subtopic: 'Tehelka: Operation West End',
    kind: 'scam',
    difficulty: 'simple',
    year: 2001,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      "Tehelka's March 2001 'Operation West End' tapes showed reporters posing as arms dealers from a fictitious UK firm. What were they offering to supply the Army?",
    options: ['Hand-held thermal imagers', 'Bulletproof jackets', 'Artillery shells', 'Night-vision rifles'],
    correctIndex: 0,
    explanation:
      'The sting filmed BJP president Bangaru Laxman accepting cash; he quit as party chief. Samata Party president Jaya Jaitly was also filmed. A CBI court convicted Laxman in 2012 (he died in 2014, on bail) and Jaitly in 2020 (sentence suspended on appeal). The sting shook the Vajpayee-led NDA government.',
    status:
      'Bangaru Laxman: convicted, 4 years (Apr 2012); HC bail (Oct 2012); died Mar 2014. Jaya Jaitly: convicted, 4 years (Jul 2020); sentence suspended by Delhi HC pending appeal (Jul 2020); no appeal ruling found (Sep 2026).',
    otherSide:
      "Laxman argued in the HC that inducing a crime through a sting is 'prohibited'; Jaitly has called the Tehelka row 'political mud-slinging' with no substance, and has appealed.",
    people: ['Bangaru Laxman', 'Jaya Jaitly'],
    sourceUrl: 'https://www.deccanherald.com/india/hc-grants-bail-bangaru-laxman-2365634',
    sourceLabel: 'Deccan Herald (PTI) — HC grants bail to Bangaru Laxman in fake defence deal case (11 Oct 2012)',
    sources: [
      'https://indianexpress.com/article/india/tehelka-sting-operation-case-hours-after-trial-court-order-hc-stays-4-year-jail-for-jaya-jaitly-6531602/',
      'https://indianexpress.com/article/india/india-others/former-bjp-president-bangaru-laxman-dies-of-cardiac-arrest-in-hyderabad/',
      'https://theprint.in/pageturner/afterword/controversy-borne-tehelka-sting-op-no-substance-jaya-jaitly/15356/',
      'https://www.tribuneindia.com/2001/20010316/main1.htm',
    ],
  },
  {
    id: 'hgh101',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Defence & Security',
    subtopic: 'Bangaru Laxman conviction',
    kind: 'scam',
    difficulty: 'simple',
    year: 2012,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      'In April 2012 a special CBI court convicted former BJP president Bangaru Laxman of taking ₹1 lakh from Tehelka reporters posing as arms dealers in 2001. What sentence did it impose?',
    options: ['Two years in jail', 'Four years in jail', 'Seven years in jail', 'A fine only, no jail'],
    correctIndex: 1,
    explanation:
      'He was convicted under the Prevention of Corruption Act, fined ₹1 lakh and taken into custody on 27 April 2012. The CBI said he took the money in his office at the party headquarters on 1 Jan 2001 to recommend a fictitious supplier to the defence ministry. The Delhi HC granted him bail as an appellant in Oct 2012; he died in March 2014.',
    status:
      'Convicted and sentenced to 4 years (Apr 2012); granted bail by Delhi HC as appellant (Oct 2012); died 1 Mar 2014 with no appeal ruling reported.',
    otherSide:
      "Seeking bail, he cited his age and ill health and a High Court ruling that inducing a person to commit a crime through a sting is 'prohibited'.",
    people: ['Bangaru Laxman'],
    sourceUrl: 'https://www.deccanherald.com/india/hc-grants-bail-bangaru-laxman-2365634',
    sourceLabel: 'Deccan Herald (PTI) — HC grants bail to Bangaru Laxman in fake defence deal case (11 Oct 2012)',
    sources: [
      'https://indianexpress.com/article/india/india-others/former-bjp-president-bangaru-laxman-dies-of-cardiac-arrest-in-hyderabad/',
    ],
  },
  {
    id: 'hgh102',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Defence & Security',
    subtopic: 'Jaya Jaitly conviction',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2020,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      "In July 2020 a CBI court convicted Jaya Jaitly, Samata Party president at the time of the 2001 Tehelka sting. How much did it hold she accepted from the fake firm's representative?",
    options: ['₹20,000', '₹1 lakh', '₹2 lakh', '₹10 lakh'],
    correctIndex: 2,
    explanation:
      "The court held she took ₹2 lakh in 2000–01 to use her influence to get Army orders for 'hand-held thermal cameras'; a retired major general took ₹20,000 and a former party colleague was also convicted. On 30 July 2020 it sentenced her to four years; the Delhi HC suspended the sentence the same day pending appeal, noting she had not been arrested.",
    status:
      'Convicted (21 Jul 2020) and sentenced to 4 years (30 Jul 2020); sentence suspended by Delhi HC pending appeal (30 Jul 2020); no appeal ruling found (Sep 2026).',
    otherSide:
      "Jaitly has called the Tehelka controversy 'political mud-slinging' with 'no substance' (2017) and appealed; the HC suspended her sentence the day it was passed.",
    people: ['Jaya Jaitly'],
    sourceUrl:
      'https://indianexpress.com/article/india/tehelka-sting-operation-case-hours-after-trial-court-order-hc-stays-4-year-jail-for-jaya-jaitly-6531602/',
    sourceLabel: 'The Indian Express — Hours after trial court order, HC stays 4-year jail for Jaya Jaitly (31 Jul 2020)',
    sources: [
      'https://www.tribuneindia.com/news/nation/20-yrs-on-jaitly-convicted-of-graft-118000',
      'https://theprint.in/pageturner/afterword/controversy-borne-tehelka-sting-op-no-substance-jaya-jaitly/15356/',
      'https://www.tribuneindia.com/2001/20010316/main1.htm',
    ],
  },
  {
    id: 'hgh103',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Defence & Security',
    subtopic: 'Barak missile deal',
    kind: 'scam',
    difficulty: 'expert',
    year: 2013,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      "In Dec 2013 the CBI filed a closure report in its case over India's 2000 purchase of Barak anti-missile systems from Israel, which had named ex-Defence Minister George Fernandes. Why?",
    options: [
      'The deal had been cancelled before payment',
      'Parliament refused sanction to prosecute',
      'The Navy certified the missiles as effective',
      'Replies from abroad did not back the kickback claims',
    ],
    correctIndex: 3,
    explanation:
      "The 2006 FIR alleged bribes in the ₹1,150 crore deal, including ₹1 crore to Samata Party's Jaya Jaitly via its treasurer to influence Fernandes. The CBI said Israel denied any payment and it found no evidence for the claims made on Tehelka's tapes. A special court accepted the closure in Jan 2017, clearing Fernandes, Jaitly, ex-Navy chief Sushil Kumar and an arms dealer.",
    status:
      'CBI FIR (2006); closure report (24 Dec 2013) accepted by special CBI court (27 Jan 2017); all named cleared; no one charged.',
    otherSide:
      'Fernandes, Jaitly, the ex-treasurer and the arms dealer all denied any bribe; the court found no reason to differ with the CBI and no link between the dealer and any commission.',
    people: ['George Fernandes', 'Jaya Jaitly', 'Sushil Kumar'],
    sourceUrl:
      'https://www.business-standard.com/article/pti-stories/cbi-files-closure-report-in-barak-missile-deal-113122400798_1.html',
    sourceLabel: 'Business Standard (PTI) — CBI files closure report in Barak missile deal (24 Dec 2013)',
    sources: [
      'https://www.business-standard.com/article/news-ians/court-accepts-closure-report-in-barak-missile-deal-117020101010_1.html',
    ],
  },
  {
    id: 'hgh104',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Banking & Finance',
    subtopic: 'Laxmi Vilas Palace hotel sale',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2002,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      "In 2002 the Vajpayee government's disinvestment ministry sold Udaipur's ITDC-run Laxmi Vilas Palace hotel for ₹7.52 crore. What loss did the complaint behind a 2020 CBI-court order allege?",
    options: ['About ₹244 crore', 'About ₹24 crore', 'About ₹2,440 crore', 'About ₹75 crore'],
    correctIndex: 0,
    explanation:
      'The CBI twice filed closure reports, but in Sept 2020 a special CBI court in Jodhpur ordered a new FIR against ex-disinvestment minister Arun Shourie, the then disinvestment secretary, a valuer, an adviser and the buyer’s chief. In Oct 2020 the Rajasthan HC stayed the proceedings; the Centre’s own law officer backed the petitioners.',
    status:
      'CBI closure reports (twice) not accepted; special court ordered FIR (Sep 2020); Rajasthan HC stayed proceedings against Shourie and four others (22 Oct 2020); no later ruling found (Sep 2026); not charged.',
    otherSide:
      'Shourie denies any irregularity and told the HC the sale had twice survived court challenges; the CBI and the Additional Solicitor General said no offence was made out.',
    people: ['Arun Shourie'],
    sourceUrl:
      'https://www.deccanherald.com/india/rajasthan-high-court-stays-proceedings-against-arun-shourie-others-in-laxmi-vilas-palace-sale-case-905701.html',
    sourceLabel:
      'Deccan Herald (PTI) — Rajasthan High Court stays proceedings against Arun Shourie, others in Laxmi Vilas Palace sale case (22 Oct 2020)',
    sources: ['https://thewire.in/law/laxmi-vilas-palace-case-rajasthan-hc-stays-arrest-warrant-against-arun-shourie'],
  },
  {
    id: 'hgh105',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Defence & Security',
    subtopic: "Kargil 'coffin' case",
    kind: 'scam',
    difficulty: 'expert',
    year: 2013,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      'The CBI charge-sheeted three ex-Army officers and a US vendor over caskets and body bags bought after the 1999 Kargil war. What did a Delhi court do with the officers in Dec 2013?',
    options: [
      'Sentenced them to three years in jail',
      'Discharged them for lack of prima facie evidence',
      'Sent the case back for further probe',
      'Referred them to a court-martial',
    ],
    correctIndex: 1,
    explanation:
      "The 2009 charge sheet alleged 'overpriced and substandard' aluminium caskets were bought from an unapproved US vendor. The court found no prima facie evidence against the officers, and the Centre later told the Supreme Court the vendor too had been discharged. The affair drew criticism of the BJP-led government in 2002, but the CBI never charge-sheeted Defence Minister George Fernandes.",
    status:
      'CBI case (2006), charge sheet (Aug 2009); three officers discharged (11 Dec 2013); US vendor discharged, per the Centre; SC dismissed PILs for a probe, finding nothing amiss in the CBI probe and trial (13 Oct 2015). No politician charged.',
    otherSide:
      'In 2015 the Supreme Court dismissed PILs seeking a probe, saying nothing was found amiss in the CBI probe and trial; Fernandes was never named in the charge sheet.',
    people: ['George Fernandes'],
    sourceUrl:
      'https://www.business-standard.com/article/news-ians/coffin-scam-court-finds-no-evidence-against-three-ex-armymen-113121100980_1.html',
    sourceLabel: 'Business Standard (IANS) — Coffin scam: Court finds no evidence against three ex-armymen (11 Dec 2013)',
    sources: ['https://www.tribuneindia.com/news/archive/nation/kargil-deals-sc-rejects-two-pils-for-probe-145350'],
  },
  {
    id: 'hgh106',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Energy & Mining',
    subtopic: 'Petrol pump allotments, 2000–02',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2004,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      'After allegations that fuel-outlet dealerships went to kin and associates of BJP leaders, a Supreme Court-appointed panel scrutinised 409 allotments of 2000–02. How many did the court approve cancelling in Oct 2004?',
    options: ['112', '409', '297', '41'],
    correctIndex: 2,
    explanation:
      'In Aug 2002 PM Vajpayee cancelled all 3,000-plus petrol-pump, LPG and kerosene allotments made since Jan 2000. In Dec 2002 the Supreme Court quashed that blanket order and had two retired judges examine the allotments named in media reports. In Oct 2004 it approved cancelling the 297 of 409 the panel found were not made on merit or went to ineligible people.',
    status:
      "Blanket cancellation quashed by SC (Dec 2002); 297 of 409 scrutinised allotments found 'tainted' and cancelled with SC approval (Oct 2004). No case against Ram Naik found.",
    otherSide:
      'Petroleum minister Ram Naik said he had done nothing wrong, as allotments were made by dealer selection boards headed by retired judges.',
    people: ['Ram Naik'],
    sourceUrl: 'https://www.tribuneindia.com/2004/20041012/main1.htm',
    sourceLabel: 'The Tribune — SC cancels 297 petrol, kerosene outlets (12 Oct 2004)',
    sources: [
      'https://indiankanoon.org/doc/189070545/',
      'https://www.tribuneindia.com/2002/20020806/main1.htm',
      'https://www.tribuneindia.com/2004/20041013/edit.htm',
    ],
  },
  {
    id: 'hgh107',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Energy & Mining',
    subtopic: 'Dilip Singh Judeo video case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2003,
    asOf: '2026-09',
    govt: 'NDA',
    question:
      'Union minister of state Dilip Singh Judeo quit in Nov 2003 after a video allegedly showed him taking cash over mining projects in Chhattisgarh and Odisha. What became of the CBI case against him?',
    options: [
      'He was convicted in 2008',
      'It was closed for want of sanction',
      'He was acquitted in 2016',
      'It abated when he died in 2013',
    ],
    correctIndex: 3,
    explanation:
      "The CBI charge-sheeted him and five others, alleging he took ₹9 lakh in a hotel room on 5 Nov 2003. He died during the trial and proceedings against him abated in Oct 2013. In Apr 2016 a Delhi court acquitted the other five, including the then Chhattisgarh CM's son, whom the CBI accused of plotting the filming, holding guilt was not proved.",
    status:
      'Resigned (Nov 2003); CBI charge sheet; proceedings against him abated on his death (order of 30 Oct 2013); five co-accused acquitted (4 Apr 2016). Never convicted.',
    otherSide:
      'Judeo denied the allegations and the BJP blamed political rivals; the court acquitted all five co-accused in 2016 for want of proof.',
    people: ['Dilip Singh Judeo', 'Amit Jogi'],
    sourceUrl: 'https://indiankanoon.org/doc/78921788/',
    sourceLabel: 'Special Judge (CBI), Rohini Courts, Delhi — CBI vs Dalip Singh Judev & others, judgment (4 Apr 2016)',
    sources: ['https://www.aljazeera.com/news/2003/11/17/indian-minister-quits-after-expose'],
  },
  {
    id: 'hgh108',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Governance & Institutions',
    subtopic: '2005 cash-for-query sting',
    kind: 'scam',
    difficulty: 'simple',
    year: 2005,
    asOf: '2026-09',
    govt: 'UPA',
    question:
      'Parliament expelled 11 MPs after a Dec 2005 TV sting showed them allegedly taking cash to ask questions in the House. Which party had the most of the 11?',
    options: ['BJP', 'BSP', 'Congress', 'RJD'],
    correctIndex: 0,
    explanation:
      'Ten Lok Sabha members were expelled: five BJP, three BSP, one Congress and one RJD; the Rajya Sabha expelled one BJP member, making six BJP MPs in all. The Supreme Court upheld the expulsions in 2007. In Dec 2017 a Delhi court framed graft and criminal-conspiracy charges against all 11 former MPs.',
    status:
      'Expelled (Dec 2005), upheld by SC (2007); charges framed against 11 ex-MPs (7 Dec 2017); no verdict found (Sep 2026); none convicted.',
    otherSide:
      'The expelled MPs challenged their expulsion in the Supreme Court and lost; none of the 11 has been convicted (checked Sep 2026).',
    sourceUrl: 'https://www.deccanherald.com/amp/story/archives%2F11-ex-mps-trial-2005.html',
    sourceLabel: 'Deccan Herald (PTI) — 11 ex-MPs on trial in 2005 cash-for-query scam (7 Dec 2017)',
    sources: [
      'https://www.deccanherald.com/amp/story/india%2Fmahua-moitra-moves-sc-how-top-court-ruled-on-2005-mp-disqualification-2807534',
    ],
  },
  {
    id: 'hgh109',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Governance & Institutions',
    subtopic: 'Cash-for-query: SC on expulsions',
    kind: 'institution',
    difficulty: 'extreme',
    year: 2007,
    asOf: '2026-09',
    govt: 'UPA',
    question:
      'In 2007 a five-judge Supreme Court bench ruled on petitions by the 11 MPs expelled over the 2005 cash-for-query sting. What was the verdict?',
    options: [
      'Struck down the expulsions, 3–2',
      'Upheld the expulsions, 4–1',
      'Upheld the expulsions, 5–0',
      'Sent them back to Parliament to redo',
    ],
    correctIndex: 1,
    explanation:
      "The bench led by Chief Justice Y.K. Sabharwal called expulsion a 'self-protection exercise' by Parliament and said courts would not interfere so long as some relevant material sustained the House's action. The expelled MPs were six from the BJP, three from the BSP and one each from the Congress and the RJD.",
    status:
      'Expulsions upheld by the Supreme Court (2007); the criminal case against the 11 ex-MPs is at trial (charges framed Dec 2017); none convicted (Sep 2026).',
    otherSide:
      'The ruling was a 4–1 majority, not unanimous; the MPs had challenged Parliament’s power to expel them, and one of the five judges sided with them.',
    sourceUrl:
      'https://www.deccanherald.com/amp/story/india%2Fmahua-moitra-moves-sc-how-top-court-ruled-on-2005-mp-disqualification-2807534',
    sourceLabel: 'Deccan Herald — How top court ruled on 2005 MP disqualification (12 Dec 2023)',
  },
  {
    id: 'hgh110',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Elections & Funding',
    subtopic: '2008 cash-for-votes case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2013,
    asOf: '2026-09',
    govt: 'UPA',
    question:
      'Three BJP MPs waved wads of cash in the Lok Sabha before the July 2008 trust vote, saying it was paid to buy their votes. What did a Delhi court do in the case in Nov 2013?',
    options: [
      'Framed charges against all the accused',
      'Ordered a fresh probe by the CBI',
      'Discharged most accused, charging only one aide',
      'Dropped it for want of Lok Sabha sanction',
    ],
    correctIndex: 2,
    explanation:
      "Delhi Police charge-sheeted ex-SP leader Amar Singh and L.K. Advani's aide Sudheendra Kulkarni in 2011, alleging they masterminded a plot to bribe MPs. In Nov 2013 a special judge discharged both, BJP MPs Faggan Singh Kulaste, Ashok Argal and Mahavir Bhagora, and a BJP activist, framing corruption charges only against Amar Singh's former aide.",
    status:
      'Delhi Police charge sheet (Aug 2011); Amar Singh, Kulkarni, the three BJP MPs and an activist discharged (22 Nov 2013); charges framed against one aide, outcome not found (Sep 2026).',
    otherSide:
      'The three MPs said they had carried out a sting to expose horse-trading before the trust vote; the court discharged them along with the others.',
    people: ['Amar Singh', 'Sudheendra Kulkarni', 'Faggan Singh Kulaste', 'Ashok Argal', 'Mahavir Bhagora'],
    sourceUrl:
      'https://www.business-standard.com/article/news-ians/amar-singh-three-other-mps-discharged-in-cash-for-vote-case-113112200628_1.html',
    sourceLabel: 'Business Standard (IANS) — Amar Singh, three other MPs discharged in cash-for-vote case (22 Nov 2013)',
  },
  {
    id: 'hgh111',
    domain: 'civics',
    region: 'India',
    state: 'KA',
    topic: 'Energy & Mining',
    subtopic: 'Karnataka Lokayukta mining report',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2011,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Karnataka Lokayukta Santosh Hegde's July 2011 report on illegal mining led BJP CM B.S. Yediyurappa to resign. What loss to the state did the report estimate?",
    options: ['About ₹1,608 crore', 'About ₹6,085 crore', 'About ₹1.6 lakh crore', 'About ₹16,085 crore'],
    correctIndex: 3,
    explanation:
      'The 466-page report said miners and officials colluded to deprive the state of mining revenue in Ballari, and set out alleged illegal transfers to foreign firms owned by the Reddy brothers. It led to the resignations of Yediyurappa and his tourism minister G. Janardhana Reddy. A CBI court acquitted Yediyurappa in a linked kickback case in 2016.',
    status:
      'Yediyurappa: named in Lokayukta report, resigned as CM (2011); acquitted in the linked CBI kickback case (Oct 2016). Reddy: convicted in the separate OMC case (May 2025), sentence suspended by HC pending appeal (Jun 2025).',
    otherSide:
      'A special CBI court acquitted Yediyurappa and 12 others in the linked ₹40 crore kickback case in Oct 2016, holding the prosecution failed to prove guilt.',
    people: ['B.S. Yediyurappa', 'G. Janardhana Reddy', 'Santosh Hegde'],
    sourceUrl: 'https://theprint.in/economy/the-2011-report-that-revealed-the-largest-illegal-mining-scam-in-india/57525/',
    sourceLabel: 'ThePrint — The 2011 report that revealed the largest illegal mining scam in India (11 May 2018)',
    sources: [
      'https://www.business-standard.com/article/politics/santosh-hegde-welcomes-probe-into-mining-113101800598_1.html',
      'https://www.tribuneindia.com/news/archive/nation/yeddy-3-of-family-acquitted-in-rs-40-crore-mining-bribery-case-315374',
    ],
  },
  {
    id: 'hgh112',
    domain: 'civics',
    region: 'India',
    state: 'KA',
    topic: 'Energy & Mining',
    subtopic: 'Yediyurappa mining kickback case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2016,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "The CBI alleged ₹40 crore in kickbacks, incl. ₹20 crore to a trust run by B.S. Yediyurappa's family, for mining favours when he was CM (2008–11). What did a special CBI court rule in Oct 2016?",
    options: ['Acquitted all 13 accused', 'Framed charges and began the trial', 'Sent the case to the Lokayukta', 'Ordered further investigation'],
    correctIndex: 0,
    explanation:
      'Judge R.B. Dharmagouder held the prosecution had failed to prove guilt under the Prevention of Corruption Act or the IPC, clearing Yediyurappa, his two sons, his son-in-law, JSW Steel and others. He had quit as CM in 2011 after a Lokayukta report on illegal mining; the verdict came as he led the state BJP towards the 2018 polls.',
    status:
      'CBI charge sheet (2012); all 13 accused acquitted by special CBI court (26 Oct 2016); no appeal reported in sources checked (Sep 2026).',
    otherSide:
      "The court acquitted all accused, holding the prosecution 'unsuccessful in establishing the guilt' of any of them.",
    people: ['B.S. Yediyurappa', 'B.Y. Raghavendra', 'B.Y. Vijayendra'],
    sourceUrl:
      'https://www.tribuneindia.com/news/archive/nation/yeddy-3-of-family-acquitted-in-rs-40-crore-mining-bribery-case-315374',
    sourceLabel: 'The Tribune (PTI) — Yeddy acquitted in Rs 40-crore mining bribery case (27 Oct 2016)',
  },
  {
    id: 'hgh113',
    domain: 'civics',
    region: 'India',
    state: 'AP',
    topic: 'Energy & Mining',
    subtopic: 'Obulapuram Mining case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2025,
    asOf: '2026-09',
    govt: 'INC',
    question:
      'In May 2025 a CBI court in Hyderabad convicted Karnataka BJP MLA and ex-minister G. Janardhana Reddy in the Obulapuram Mining Company case. What sentence did he get?',
    options: ['Three years in jail', "Seven years' rigorous imprisonment", 'Life imprisonment', 'A fine only, no jail'],
    correctIndex: 1,
    explanation:
      "The court found OMC, run by Reddy's family, tampered with lease boundaries and mined illegally in 2007–09, a ₹884 crore loss. The leases were granted by Andhra Pradesh's then Congress government; its then mines minister, now a BRS MLA, was acquitted, and the CBI has appealed that. The Telangana HC suspended Reddy's sentence in June 2025, and his Assembly seat was restored.",
    status:
      "Convicted, 7 years' RI (6 May 2025); sentence suspended, bail granted by Telangana HC pending appeal (11 Jun 2025); Assembly seat restored 'subject to further judicial pronouncements' (Jun 2025); CBI appeal against 2 acquittals admitted (Aug 2025); no appeal ruling found (Sep 2026).",
    otherSide:
      'Reddy has appealed; his counsel told the HC he had already spent nearly half the term in custody as an undertrial after his 2011 arrest.',
    people: ['G. Janardhana Reddy', 'Sabitha Indra Reddy'],
    sourceUrl:
      'https://thesouthfirst.com/andhrapradesh/gali-janardhana-reddy-three-others-convicted-in-obulapuram-mining-case-sabitha-indra-reddy-acquitted/',
    sourceLabel: 'The South First — Obulapuram mining case: CBI court convicts Gali Janardhan Reddy (6 May 2025)',
    sources: [
      'https://thesouthfirst.com/telangana/telangana-high-court-suspends-sentence-of-gali-janardhan-reddy-grants-bail/',
      'https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fjanardhana-reddys-membership-in-karnataka-assembly-restored-3592634',
      'https://www.siasat.com/omc-case-hc-issues-notices-to-ex-min-sabita-indra-reddy-ex-ias-officer-kripanandam-3260421/',
    ],
  },
  {
    id: 'hgh114',
    domain: 'civics',
    region: 'India',
    state: 'KA',
    topic: 'Health',
    subtopic: "D'Cunha commission on COVID buys",
    kind: 'scam',
    difficulty: 'extreme',
    year: 2024,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "The Justice Michael D'Cunha commission said Karnataka's 2 April 2020 order of 1 lakh PPE kits from one importer cost how much per kit, about double what local suppliers charged?",
    options: ['About ₹330', 'About ₹900', 'About ₹2,118', 'About ₹5,400'],
    correctIndex: 2,
    explanation:
      "Set up by the Congress government in Aug 2023, the commission recommended prosecuting ex-CM B.S. Yediyurappa and ex-health minister B. Sriramulu, saying they 'manipulated' purchases of 3 lakh kits to favour two firms; local suppliers had charged ₹400–₹1,444. An FIR against officials followed in Dec 2024; by Apr 2026 no other action had been taken.",
    status:
      'Commission recommended prosecution (interim report, made public Nov 2024); FIR against officials (Dec 2024); no FIR or action against either leader reported (Indian Express, Apr 2026).',
    otherSide:
      "Yediyurappa called the probe mala fide and said 'we will face it legally'; Sriramulu said he would quit politics if any wrongdoing by him was proved.",
    people: ['B.S. Yediyurappa', 'B. Sriramulu', "Michael D'Cunha"],
    sourceUrl:
      'https://www.thenewsminute.com/karnataka/commission-accuses-yediyurappa-sreeramulu-of-bloating-covid-supply-deals-seeks-prosecution',
    sourceLabel: 'The News Minute — Commission accuses Yediyurappa, Sreeramulu of bloating COVID supply deals (9 Nov 2024)',
    sources: [
      'https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fcongress-government-ordering-probe-into-covid-19-handling-during-bjp-regime-has-malafide-intent-yediyurappa-3279562',
      'https://www.tribuneindia.com/news/india/covid-scam-panel-has-recommended-prosecution-of-yediyurappa-sriramulu-says-karnataka-minister/',
      'https://indianexpress.com/article/cities/bangalore/karnataka-congress-govt-covid-scam-40-percent-commission-probe-delay-10613922/',
    ],
  },
  {
    id: 'hgh115',
    domain: 'civics',
    region: 'India',
    state: 'KA',
    topic: 'Governance & Institutions',
    subtopic: 'KSDL bribery case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2023,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "In Mar 2023 Lokayukta police trapped BJP MLA Madal Virupakshappa's son, a state officer, with ₹40 lakh over tenders at a soap PSU the MLA chaired. What did the HC do in the MLA's case in Dec 2023?",
    options: ['Ordered a CBI probe', 'Framed charges against him', 'Sent the case to the ED', 'Quashed the case against him'],
    correctIndex: 3,
    explanation:
      'Police said they seized over ₹6 crore from the son’s home and named the MLA, chairman of Karnataka Soaps and Detergents Ltd, as accused no. 1; he was arrested after losing an anticipatory-bail plea. The HC found no prima facie evidence he demanded or took a bribe. In Apr 2025 a special court discharged the son too, holding recovery of cash without proof of demand is no offence.',
    status:
      'Named A1 in Lokayukta FIR and arrested (Mar 2023); case against him quashed by Karnataka HC (20 Dec 2023); son discharged by special court (Apr 2025); no appeal ruling found (Sep 2026).',
    otherSide:
      "The HC said there was 'not even a whisper' of demand or acceptance of a bribe by him; he had argued he was dragged in only because he chaired KSDL.",
    people: ['Madal Virupakshappa'],
    sourceUrl:
      'https://www.thenewsminute.com/karnataka/karnataka-hc-quashes-corruption-case-against-former-bjp-mla-madal-virupakshappa',
    sourceLabel: 'The News Minute — Karnataka HC quashes corruption case against former BJP MLA Madal Virupakshappa (21 Dec 2023)',
    sources: [
      'https://www.thenewsminute.com/karnataka/a-sensational-trap-and-a-curious-exoneration-the-madal-virupakshappa-case',
      'https://www.newindianexpress.com/cities/bengaluru/2025/Apr/10/bengaluru-special-court-discharges-prashanth-madal-another-accused-in-lokayukta-bribery-case',
    ],
  },
  {
    id: 'hgh116',
    domain: 'civics',
    region: 'India',
    state: 'KA',
    topic: 'Infrastructure',
    subtopic: 'Contractor-death case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2022,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Police cleared Karnataka's BJP ex-minister K.S. Eshwarappa in July 2022 over a Belagavi contractor's death; the contractor had alleged a 40% cut was sought on road works. What did his family then ask a court to do?",
    options: [
      'Reject the clean chit and give the probe to another agency',
      'Transfer the trial to a court outside Karnataka',
      'Award the family compensation from the state',
      'Close the case and seal the records',
    ],
    correctIndex: 0,
    explanation:
      "Eshwarappa, named as the main accused, resigned as rural development minister after the April 2022 death. Udupi police filed a 'B' (closure) report saying there was no evidence he or anyone linked to him threatened the contractor. In Aug 2022 the family petitioned the special court for legislators, alleging political influence on the probe.",
    status:
      "Named in FIR; resigned as minister (Apr 2022); police 'B' report (Jul 2022); family's protest petition (Aug 2022); no court ruling on it found (Sep 2026). Not charged.",
    otherSide:
      'Eshwarappa said the police report vindicated him and had denied the allegations; the family said the probe was politically influenced.',
    people: ['K.S. Eshwarappa'],
    sourceUrl:
      'https://www.thenewsminute.com/karnataka/cops-give-bjp-leader-eshwarappa-clean-chit-contractor-santhosh-patil-death-166044',
    sourceLabel: 'The News Minute — Cops give BJP leader Eshwarappa clean chit in contractor Santhosh Patil death (20 Jul 2022)',
    sources: [
      'https://www.thenewsminute.com/karnataka/contractor-santhosh-patil-s-family-moves-court-against-clean-chit-ks-eshwarappa-167122',
    ],
  },
  {
    id: 'hgh117',
    domain: 'civics',
    region: 'India',
    state: 'MP',
    topic: 'Education & Exams',
    subtopic: 'Vyapam: contract-teacher test',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2012,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "A Feb 2018 CBI chargesheet over Vyapam's 2012 recruitment of Grade-II contract teachers in Madhya Pradesh named ex-minister Laxmikant Sharma and his OSD. How many others did it name?",
    options: ['28', '85', '8', '185'],
    correctIndex: 1,
    explanation:
      "The CBI said Sharma, then the BJP government's technical education minister, appointed a Vyapam exam controller who was not on the shortlist, and that favoured candidates' marks were inflated. Arrested and expelled by the BJP in June 2014, he got bail in all seven Vyapam cases against him in Dec 2015. He died in June 2021, never convicted.",
    status:
      'Arrested, expelled from BJP (Jun 2014); bail in all 7 Vyapam cases (Dec 2015); CBI chargesheet in this case (Feb 2018); CBI found no evidence against him in the separate 2012 constable-test case (Jan 2019); died Jun 2021; never convicted.',
    otherSide:
      "Released on bail in 2015, he said he had 'faith in the judiciary'; in a separate Vyapam case the CBI said in 2019 it found no evidence of his involvement.",
    people: ['Laxmikant Sharma'],
    sourceUrl: 'https://www.deccanherald.com/archives/cbi-files-fresh-chargesheet-against-1919448',
    sourceLabel: 'Deccan Herald (PTI) — CBI files fresh chargesheet against MP Minister (8 Feb 2018)',
    sources: [
      'https://scroll.in/latest/868048/vyapam-scam-cbi-files-charges-against-former-madhya-pradesh-minister-86-others',
      'https://www.deccanherald.com/india/vyapam-former-minister-grilled-2060222',
      'https://www.deccanherald.com/india/vyapam-scam-ex-minister-laxmikant-2166683',
      'https://scroll.in/latest/910142/vyapam-scam-chargesheet-filed-against-26-accused-for-forgery-and-criminal-conspiracy',
      'https://www.business-standard.com/article/politics/madhya-pradesh-senior-bjp-leader-laxmikant-sharma-dies-of-covid-19-121060100611_1.html',
    ],
  },
  {
    id: 'hgh118',
    domain: 'civics',
    region: 'India',
    state: 'GJ',
    topic: 'Energy & Mining',
    subtopic: 'Porbandar limestone case',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2013,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      'In June 2013 a Porbandar court convicted Gujarat BJP cabinet minister Babu Bokhiria and three others in an illegal limestone-mining case dating to 2006. What value did the case put on the limestone?',
    options: ['₹5.4 crore', '₹540 crore', '₹54 crore', '₹5,400 crore'],
    correctIndex: 2,
    explanation:
      "The chief judicial magistrate gave them three years in jail; a sessions court stayed the conviction pending appeal, and the Gujarat HC refused to disturb that stay in Sept 2014. In Nov 2014 the sessions court acquitted Bokhiria and the others, including a former Congress MP. Bokhiria was by then Gujarat's agriculture and water resources minister.",
    status:
      'Convicted, 3 years (15 Jun 2013); conviction stayed pending appeal; acquitted by Porbandar sessions court (17 Nov 2014); no reversal reported (Sep 2026).',
    otherSide:
      'The sessions court overturned the conviction and acquitted Bokhiria and all three co-accused in Nov 2014.',
    people: ['Babu Bokhiria', 'Bharat Odedara'],
    sourceUrl:
      'https://www.business-standard.com/article/pti-stories/babu-bokhiria-acquitted-in-illegal-limestone-mining-case-114111700807_1.html',
    sourceLabel: 'Business Standard (PTI) — Babu Bokhiria acquitted in illegal limestone mining case (17 Nov 2014)',
    sources: ['https://www.business-standard.com/article/politics/gujarat-minister-babu-bokhiria-gets-3-year-jail-term-113061500235_1.html'],
  },
  {
    id: 'hgh119',
    domain: 'civics',
    region: 'India',
    state: 'GJ',
    topic: 'Farm & Food',
    subtopic: 'Gujarat fisheries contracts',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2012,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "In July 2012 Gujarat's Governor overruled the state cabinet to sanction prosecution of BJP minister Parshottam Solanki over 2008 fishing contracts for 58 reservoirs, allegedly given without tenders. What sum was alleged?",
    options: ['₹4 crore', '₹40 crore', '₹4,000 crore', '₹400 crore'],
    correctIndex: 3,
    explanation:
      "The cabinet under then CM Narendra Modi had refused sanction. A 2015 ACB report indicated irregularities, and then agriculture minister Dileep Sanghani was also made an accused. After the HC rejected both men's discharge pleas (Jul 2024), the Supreme Court discharged Sanghani in Feb 2025, finding 'not even an iota of material' against him; in Mar 2025 the HC stayed Solanki's trial.",
    status:
      "Governor's sanction (30 Jul 2012); ACB report found irregularities (2015); discharge pleas rejected by HC (Jul 2024); Sanghani discharged by SC (27 Feb 2025); Solanki's trial stayed by HC (interim, Mar 2025); no later ruling found (Sep 2026). Neither convicted.",
    otherSide:
      'Solanki has said the contracts were granted by Sanghani as cabinet minister; the SC quashed the case against Sanghani, noting there was not even an allegation that he sought or took a bribe.',
    people: ['Parshottam Solanki', 'Dileep Sanghani', 'Narendra Modi'],
    sourceUrl:
      'https://www.business-standard.com/india-news/fisheries-scam-gujarat-hc-rejects-discharge-pleas-of-two-ex-bjp-ministers-124072800464_1.html',
    sourceLabel: 'Business Standard (PTI) — Fisheries scam: Gujarat HC rejects discharge pleas of two ex-BJP ministers (28 Jul 2024)',
    sources: [
      'https://www.etvbharat.com/en/!bharat/rs-400-crore-fisheries-scam-sc-quashes-case-against-ex-gujarat-minister-enn25022705931',
      'https://www.livelaw.in/high-court/gujarat-high-court/gujarat-high-court-order-corruption-case-against-bjp-minister-purshottambhai-odhavji-solanki-fisheries-scam-285625',
      'https://www.deccanherald.com/india/gujarat-order-to-prosecute-bjp-minister-upheld-271802.html',
    ],
  },
  {
    id: 'hgh120',
    domain: 'civics',
    region: 'India',
    state: 'MH',
    topic: 'Welfare & Subsidies',
    subtopic: "Maharashtra 'chikki' purchases",
    kind: 'scam',
    difficulty: 'simple',
    year: 2016,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Maharashtra's BJP minister Pankaja Munde was accused in 2015 of flouting purchase rules on ₹206 crore of chikki, mats and notebooks for children. What did the Anti-Corruption Bureau do in Dec 2016?",
    options: [
      'Closed the case, finding nothing to back it',
      'Arrested two of the suppliers',
      'Sent the file to the state Lokayukta',
      'Referred the case to the CBI',
    ],
    correctIndex: 0,
    explanation:
      "An ACB official said there was 'nothing to substantiate' the Congress complaint. Separately, PILs alleging sub-standard chikki stayed before the Bombay HC, which had stayed payments to contractors and in Aug 2021 asked the state why no FIR had been filed against suppliers.",
    status:
      'ACB closed the inquiry (Dec 2016); PILs on supply quality pending in Bombay HC (last reported hearing Aug 2021); no case against her (Sep 2026).',
    otherSide:
      "Munde called the charges politically motivated, 'a scam of words', and said the previous Congress-NCP government bought similar items for ₹408 crore.",
    people: ['Pankaja Munde'],
    sourceUrl: 'https://indianexpress.com/article/india/pankaja-munde-gets-clean-chit-from-acb-in-chikki-case-4438668/',
    sourceLabel: "The Indian Express (PTI) — Pankaja Munde gets clean chit from ACB in 'chikki' case (21 Dec 2016)",
    sources: ['https://indianexpress.com/article/cities/mumbai/chikki-scam-bombay-hc-maharashtra-govt-7450950/'],
  },
  {
    id: 'hgh121',
    domain: 'civics',
    region: 'India',
    state: 'HP',
    topic: 'Environment & Land',
    subtopic: 'HPCA land case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2013,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "In Aug 2013, months after the Congress took power in Himachal, its Vigilance Bureau booked BJP MP Anurag Thakur and ex-CM P.K. Dhumal over land leased for which project?",
    options: ['A Shimla ropeway', 'The Dharamsala cricket stadium', 'A Kangra airport extension', 'A Manali ski resort'],
    correctIndex: 1,
    explanation:
      "The FIR alleged cheating, conspiracy and corruption in leasing land to the state cricket association, then headed by Thakur, for the stadium. In 2018 the new BJP government moved to withdraw 'politically motivated' cases, and its law officer appeared for Thakur. In Nov 2018 the Supreme Court quashed the FIR; in Dec 2018 it quashed a second, encroachment FIR, finding no criminality.",
    status:
      "Vigilance FIR (1 Aug 2013); HC refused to quash (Apr 2014); state decided to withdraw cases (Apr 2018); FIR quashed by SC (2 Nov 2018); second FIR, first quashed 'by mistake', quashed on hearing (6 Dec 2018). None convicted.",
    otherSide:
      'Thakur said it was a civil dispute that the Virbhadra Singh-led Congress government turned into a criminal case; Dhumal called the cases political vendetta.',
    people: ['Anurag Thakur', 'Prem Kumar Dhumal', 'Virbhadra Singh'],
    sourceUrl:
      'https://www.tribuneindia.com/news/archive/himachal/supreme-court-quashes-fir-against-anurag-thakur-prem-kumar-dhumal-677724',
    sourceLabel: 'The Tribune — Supreme Court quashes FIR against Anurag Thakur, Prem Kumar Dhumal (3 Nov 2018)',
    sources: [
      'https://www.tribuneindia.com/news/archive/himachal/quashed-fir-against-bjp-mp-anurag-thakur-by-mistake-sc-685731',
      'https://www.tribuneindia.com/news/archive/himachal/news-detail-694443',
      'https://www.business-standard.com/article/pti-stories/hp-law-officer-defends-anurag-thakur-in-sc-against-state-govt-118032600777_1.html',
    ],
  },
  {
    id: 'hgh122',
    domain: 'civics',
    region: 'India',
    state: 'MH',
    topic: 'Environment & Land',
    subtopic: 'Bhosari MIDC land case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2025,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "Maharashtra's BJP revenue minister Eknath Khadse resigned in 2016 over his wife and son-in-law's purchase of MIDC-acquired land in Pune's Bhosari. What did a special court do in Dec 2025?",
    options: [
      "Accepted the ACB's closure report",
      'Transferred the case to a Pune court',
      'Rejected his discharge plea',
      'Moved the case to the CBI',
    ],
    correctIndex: 2,
    explanation:
      "The ACB had filed a closure report, which the court did not accept. In Dec 2025 the special MP/MLA court said the material made out a case under the Prevention of Corruption Act and listed it for framing of charges; in Feb 2026 the Bombay HC put that on hold while Khadse challenges the order. He left the BJP for the NCP in 2020; the ED runs a separate case.",
    status:
      'ACB closure report not accepted; discharge plea rejected by special court (Dec 2025); framing of charges stayed by Bombay HC on his challenge (Feb 2026); no later ruling found; not convicted (Sep 2026).',
    otherSide:
      'Khadse had been cleared by an earlier ACB inquiry and by the Zoting inquiry commission; he argues no sanction was obtained to prosecute him and has challenged the refusal to discharge him.',
    people: ['Eknath Khadse'],
    sourceUrl:
      'https://www.freepressjournal.in/mumbai/mumbai-special-mpmla-court-rejects-discharge-plea-of-ex-revenue-minister-eknath-khadse-his-wife-son-in-law-in-2016-pune-land-corruption-case',
    sourceLabel: 'Free Press Journal — Special MP/MLA court rejects discharge plea of Eknath Khadse (11 Dec 2025)',
    sources: [
      'https://indianexpress.com/article/cities/mumbai/hc-defers-framing-of-charges-against-eknath-khadse-wife-in-land-deal-case-suggests-getting-nbw-cancelled-10526178/',
      'https://indianexpress.com/article/legal-news/court-cancels-non-bailable-warrants-against-eknath-khadse-wife-10530786/',
      'https://www.deccanherald.com/amp/story/india%2Fncps-eknath-khadse-grilled-by-ed-in-land-grab-case-939386.html',
    ],
  },
  {
    id: 'hgh123',
    domain: 'civics',
    region: 'India',
    state: 'UP',
    topic: 'Health',
    subtopic: 'NRHM accused joins BJP',
    kind: 'scam',
    difficulty: 'expert',
    year: 2012,
    asOf: '2026-09',
    govt: 'BSP',
    question:
      'In Jan 2012 the BJP inducted ex-UP minister Babu Singh Kushwaha, then under CBI probe over NRHM funds; the CBI raided his home that week. What did he announce days later?',
    options: [
      "He would be the BJP's CM candidate",
      'He would turn approver for the CBI',
      'He would contest as an independent',
      'He would keep his BJP membership on hold until cleared',
    ],
    correctIndex: 3,
    explanation:
      "The CBI was probing ₹10,000 crore of NRHM funds from his time in Mayawati's BSP cabinet. The induction drew criticism from rivals, from ally JD(U) and from BJP leaders including L.K. Advani, and the party said he would not get a ticket. He won Jaunpur for the SP in 2024.",
    status:
      'Arrested by CBI (3 Mar 2012); NRHM cases: formally charged in 8 of 25 (Jun 2024); not convicted (Sep 2026); SP MP from Jaunpur since 2024.',
    otherSide:
      "Kushwaha called the charges 'false propaganda' and a political conspiracy and said he was confident of clearing his name; the BJP said induction did not mean a ticket.",
    people: ['Babu Singh Kushwaha'],
    sourceUrl: 'https://www.tribuneindia.com/2012/20120108/nation.htm',
    sourceLabel: 'The Tribune — Kushwaha to keep BJP membership on hold (8 Jan 2012)',
    sources: [
      'https://www.deccanherald.com/content/216650/bjp-fire-inducting-kushwaha.html',
      'https://www.tribuneindia.com/news/archive/nation/nrhm-scam-sc-notice-to-cbi-on-bail-plea-of-ex-up-minister-82141',
      'https://www.business-standard.com/elections/lok-sabha-election/india-s-joy-may-be-short-lived-as-7-up-mps-risk-losing-parliamentary-seats-124061200247_1.html',
    ],
  },
  {
    id: 'hgh124',
    domain: 'civics',
    region: 'India',
    state: 'AS',
    topic: 'Banking & Finance',
    subtopic: 'Saradha: Himanta Biswa Sarma',
    kind: 'scam',
    difficulty: 'expert',
    year: 2014,
    asOf: '2026-09',
    govt: 'INC',
    question:
      "The CBI searched then Congress leader Himanta Biswa Sarma's Guwahati home in Aug 2014 and questioned him in Nov 2014 in the Saradha probe. What has he said his status in the case is?",
    options: ['A witness, not an accused', 'A complainant against Saradha', 'A court-appointed monitor', 'An investor who lost money'],
    correctIndex: 0,
    explanation:
      "The Saradha group chief's 2013 letter to the CBI alleged Sarma took at least ₹3 crore, which he calls baseless. He joined the BJP in Aug 2015 and is now Assam CM. In 2019 a CBI official told the Times of India the probe had so far found no evidence against him; the Indian Express reported in Apr 2024 that the case was open but had not moved since his switch.",
    status:
      'Home searched (Aug 2014) and questioned by CBI (Nov 2014); not charge-sheeted in any report found; no CBI action since 2015 (Indian Express, Apr 2024); no later development found (Sep 2026).',
    otherSide:
      "Sarma has called the allegations 'frivolous and baseless', saying he joined the probe as a witness and it all predates his move to the BJP.",
    people: ['Himanta Biswa Sarma'],
    sourceUrl: 'https://m.thewire.in/article/politics/saradha-scam-assam-mamata-banerjee-bjp-himanta-biswa-sarma',
    sourceLabel: 'The Wire — Saradha scam Assam timeline: why Mamata is daring BJP to arrest Himanta Biswa Sarma (6 Feb 2019)',
    sources: [
      'https://indianexpress.com/article/express-exclusive/since-2014-25-opposition-leaders-facing-corruption-probe-crossed-over-to-bjp-23-of-them-got-reprieve-9247737/',
    ],
  },
  {
    id: 'hgh125',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Infrastructure',
    subtopic: 'Air India aircraft-leasing case',
    kind: 'scam',
    difficulty: 'extreme',
    year: 2024,
    asOf: '2026-09',
    govt: 'UPA',
    question:
      'In March 2024 the CBI filed a closure report in a 2017 case on Air India aircraft leasing decided while Praful Patel was aviation minister. How long after he joined the NDA side?',
    options: ['About eight days', 'About eight months', 'About three years', 'A year before he switched'],
    correctIndex: 1,
    explanation:
      "The FIR alleged costly leases from 2006 left planes idle and caused about ₹840 crore in losses; it did not name Patel as an accused. He had joined the NDA with Ajit Pawar's NCP faction in 2023. The CBI found no criminal offence or conspiracy. In Feb 2026 the special court issued notice to the complainant, the Centre for Public Interest Litigation, before deciding on the closure.",
    status:
      'Not named as an accused in the FIR (2017); CBI closure report (Mar 2024); court issued notice to complainant (Feb 2026); decision on closure not found (Sep 2026).',
    otherSide:
      "Patel said the CBI 'found nothing against me', that the FIR did not name him and that leasing decisions went through a group of ministers, not him alone.",
    people: ['Praful Patel', 'Ajit Pawar'],
    sourceUrl:
      'https://scroll.in/latest/1065949/cbi-closes-aviation-scam-case-against-ncps-praful-patel-eight-months-after-he-joined-nda',
    sourceLabel: "Scroll — CBI closes aviation scam case against NCP's Praful Patel eight months after he joined NDA (29 Mar 2024)",
    sources: [
      'https://aninews.in/news/national/general-news/cbi-closure-report-in-air-india-leasing-case-court-issues-notice-to-complainant20260225190745/',
      'https://aninews.in/news/national/politics/cbi-found-nothing-against-me-praful-patel-opens-up-on-closure-report-in-air-india-scam-washing-machine-jibe20240501145406/',
      'https://www.thenewsminute.com/news/cbi-submits-closure-report-in-corruption-case-against-former-minister-praful-patel',
      'https://theprint.in/india/cbi-closes-air-india-corruption-case-against-praful-patel-ajit-pawar-led-ncp-mp/2018968/',
    ],
  },
  {
    id: 'hgh126',
    domain: 'civics',
    region: 'India',
    state: 'MH',
    topic: 'Banking & Finance',
    subtopic: 'MSCB loans case',
    kind: 'scam',
    difficulty: 'simple',
    year: 2024,
    asOf: '2026-09',
    govt: 'INC',
    question:
      "Mumbai's EOW filed a closure report in the MSCB loans case in 2020, sought to reopen it in 2022, then closed it again in Jan 2024. What had Ajit Pawar done in between?",
    options: [
      'Resigned from the Assembly',
      'Retired from electoral politics',
      'Joined the BJP-led state government as Deputy CM',
      'Quit the NCP to join the Congress',
    ],
    correctIndex: 2,
    explanation:
      'The FIR, ordered by the Bombay HC in 2019, alleged ₹25,000 crore losses from loans to sugar mills and others in 2007–17; Pawar was then a district-bank director. The first closure came while he was in the MVA government, the reopening after the BJP returned in 2022, the second closure after he joined it in July 2023. A court accepted it on 27 Feb 2026, a month after he died in a plane crash.',
    status:
      "EOW closure reports (Oct 2020, Jan 2024); closure accepted by special court (27 Feb 2026), rejecting Anna Hazare's protest petitions and the ED's intervention; Pawar died 28 Jan 2026. Never charged.",
    otherSide:
      "A special court accepted the EOW's finding that no criminal case was made out, rejecting protest petitions by Anna Hazare and others and the ED's bid to intervene.",
    people: ['Ajit Pawar', 'Anna Hazare'],
    sourceUrl:
      'https://www.tribuneindia.com/news/india/court-accepts-closure-report-in-maharashtra-state-co-operative-bank-case-involving-ajit-pawar/amp',
    sourceLabel: 'The Tribune (PTI) — Court accepts closure report in Maharashtra State Co-operative Bank case involving Ajit Pawar (27 Feb 2026)',
    sources: [
      'https://indianexpress.com/article/express-exclusive/since-2014-25-opposition-leaders-facing-corruption-probe-crossed-over-to-bjp-23-of-them-got-reprieve-9247737/',
      'https://www.freepressjournal.in/mumbai/maharashtra-court-accepts-closure-report-in-25000-crore-msc-bank-scam-case-days-after-ajit-pawars-death',
      'https://newsonair.gov.in/maharashtra-deputy-cm-ajit-pawar-dies-in-plane-crash/',
    ],
  },
  {
    id: 'hgh127',
    domain: 'civics',
    region: 'India',
    state: 'MH',
    topic: 'Environment & Land',
    subtopic: 'Adarsh society case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2024,
    asOf: '2026-09',
    govt: 'INC',
    question:
      'Ex-Maharashtra CM Ashok Chavan, charge-sheeted by the CBI in the Adarsh housing case in 2012, joined the BJP in Feb 2024. What was the state of the case against him then?',
    options: [
      'Closed on a CBI closure report',
      'Ended in his acquittal in 2019',
      'Transferred to a Delhi court',
      'Trial stayed by the Supreme Court since 2018',
    ],
    correctIndex: 3,
    explanation:
      'The CBI accused him of approving extra floor space for the Mumbai society in return for two flats for relatives; he quit as CM in 2010. A governor refused sanction to prosecute; a successor granted it in 2016 under the BJP government, but the Bombay HC quashed it in 2017 for lack of fresh evidence. The Supreme Court stayed the trial proceedings in 2018; the Indian Express said in Apr 2024 the stay remained.',
    status:
      'CBI chargesheet (2012); sanction quashed by Bombay HC (Dec 2017); SC stay on proceedings (Jan 2018), in place per Indian Express (Apr 2024); no conviction; no later ruling found (Sep 2026).',
    otherSide:
      "Chavan calls Adarsh a 'political accident' and said his past had 'nothing to do' with his decision to leave the Congress.",
    people: ['Ashok Chavan'],
    sourceUrl:
      'https://indianexpress.com/article/express-exclusive/since-2014-25-opposition-leaders-facing-corruption-probe-crossed-over-to-bjp-23-of-them-got-reprieve-9247737/',
    sourceLabel: 'The Indian Express — 25 Opposition leaders facing probes crossed over to BJP, 23 got reprieve (3 Apr 2024)',
    sources: [
      'https://theprint.in/india/demolition-regularisation-pleas-pending-chavan-moves-on-but-mumbais-adarsh-society-languishes/2048404/',
      'https://lawchakra.in/other-courts/adarsh-scam-court-chargesheet-against-ashok-chavan/',
    ],
  },
  {
    id: 'hgh128',
    domain: 'civics',
    region: 'India',
    state: 'MH',
    topic: 'Infrastructure',
    subtopic: 'Topsgrup–MMRDA case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2025,
    asOf: '2026-09',
    govt: 'BJP',
    question:
      "The ED alleged Sena MLA Pratap Sarnaik got ₹7 crore-plus in kickbacks via an MMRDA security deal. In 2022 a magistrate accepted the police closure report in the base case. What did the Bombay HC do in June 2025?",
    options: [
      'Set it aside and sent it back for a fresh look',
      'Upheld it and ended the ED case',
      'Referred it to a larger bench',
      'Transferred the case to the CBI',
    ],
    correctIndex: 0,
    explanation:
      "The acceptance came three months after Sarnaik joined Eknath Shinde's revolt and the new Shinde–BJP government. The HC said the magistrate accepted the report 'without application of mind', only because the complainant dropped his objection, and kept all contentions open. Sarnaik, now a Shiv Sena minister, had urged Uddhav Thackeray in June 2021 to patch up with the BJP, citing agency 'harassment'.",
    status:
      'ED case (Nov 2020); EOW closure accepted by magistrate (14 Sep 2022); set aside by Bombay HC and sent back (Jun 2025); no fresh ruling found (Sep 2026); no chargesheet against him reported.',
    otherSide:
      "Sarnaik has called the ED action 'harassment' and his party called the raids a 'political vendetta'; the EOW found no cognisable offence, and the HC did not rule on the merits.",
    people: ['Pratap Sarnaik', 'Eknath Shinde', 'Uddhav Thackeray'],
    sourceUrl:
      'https://indianexpress.com/article/cities/mumbai/ed-plea-bombay-hc-magistrates-order-eow-closure-report-topsgrup-10066386/',
    sourceLabel:
      "The Indian Express — On ED's plea, Bombay High Court sets aside magistrate's order accepting EOW's closure report in Topsgrup case (14 Jun 2025)",
    sources: [
      'https://indianexpress.com/article/india/shiv-sena-pratap-sarnaik-ed-topsgrup-7068890/',
      'https://www.tribuneindia.com/news/nation/ed-makes-second-arrest-in-money-laundering-case-linked-to-shiv-sena-mla-181936/amp',
      'https://www.deccanherald.com/amp/story/india%2Fed-raids-on-sarnaiks-properties-politically-motivated-congress-920824.html',
      'https://indianexpress.com/article/express-exclusive/since-2014-25-opposition-leaders-facing-corruption-probe-crossed-over-to-bjp-23-of-them-got-reprieve-9247737/',
    ],
  },
  {
    id: 'hgh129',
    domain: 'civics',
    region: 'India',
    state: 'IN',
    topic: 'Banking & Finance',
    subtopic: 'Kothapalli Geetha bank-loan case',
    kind: 'scam',
    difficulty: 'expert',
    year: 2022,
    asOf: '2026-09',
    govt: 'UPA',
    question:
      'In Sept 2022 a CBI court sentenced ex-MP Kothapalli Geetha, in the BJP since 2019, to five years for cheating a bank over a 2009 loan. What did the Telangana HC do in March 2024?',
    options: ['Doubled her sentence', 'Stayed her conviction', 'Acquitted her', 'Ordered a fresh trial'],
    correctIndex: 1,
    explanation:
      "The CBI said a ₹25 crore loan taken in 2009 by the couple's firm, Visweswara Infrastructure, grew to over ₹42 crore. The HC suspended her sentence and granted bail in Sept 2022, then stayed the conviction in March 2024, clearing her to contest; the BJP fielded her from Araku weeks later. The Indian Express reported in Apr 2024 that the CBI had yet to challenge the stay.",
    status:
      'Convicted, 5 years (Sep 2022); sentence suspended (Sep 2022); conviction stayed by Telangana HC (Mar 2024); CBI yet to challenge (Apr 2024); no appeal ruling found (Sep 2026).',
    otherSide:
      'The Telangana HC stayed her conviction in March 2024, so she could contest the Lok Sabha poll while her appeal is heard.',
    people: ['Kothapalli Geetha'],
    sourceUrl:
      'https://indianexpress.com/article/express-exclusive/since-2014-25-opposition-leaders-facing-corruption-probe-crossed-over-to-bjp-23-of-them-got-reprieve-9247737/',
    sourceLabel: 'The Indian Express — 25 Opposition leaders facing probes crossed over to BJP, 23 got reprieve (3 Apr 2024)',
    sources: ['https://theprint.in/india/cbi-arrests-former-mp-after-conviction-in-bank-loan-fraud-case/1128685/'],
  },
]);
