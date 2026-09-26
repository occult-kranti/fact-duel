#!/usr/bin/env node
// Find cross-item answer giveaways in the HISAAB DO bank: an item whose correct answer appears, word
// for word, in ANOTHER item's stem, explanation, outcome, otherSide, status or enactedBy. A player
// who meets the second card first is handed the first card's answer.
//
//   node scripts/hisaab-giveaways.mjs            # summary + every unreviewed pair
//   node scripts/hisaab-giveaways.mjs --json     # machine-readable pairs, each with `reviewed`
//
// Exit code: 0 when every pair found is on a reviewed list below, 1 while any unreviewed pair remains.
// A reviewed entry is 'leakId>answerId' → why it is NOT a giveaway (different subject, coincidental
// figure). A real giveaway is never listed: reword the leaking text instead. Each editor group keeps
// its own clearly labelled REVIEWED_OK_<GROUP> constant; they are merged into REVIEWED_OK at the bottom.
//
// Only distinctive answers count (a number of 3+ digits, a number with a unit or %, or 12+ letters of
// text), and only when the leaking item is about the same subject: it shares the answer item's
// subtopic, or at least one distinctive subtopic word. Bare small numbers, years and institution
// names appear everywhere by nature and are skipped.
import { LANES } from '../editions/hisaab/bank/index.mjs';

// ── Reviewed false positives: distribution lanes ─────────────────────────────────────────────────────
// Leaks whose text sits in dist-centre, dist-north, dist-west-south, dist-east or money-gaps-dist.
// Each pair was read by hand (26 Sep 2026): the leaking card is about another scheme, state or measure
// and only shares a common figure, so reading it first does not tell a player the other card's answer.
const REVIEWED_OK_DIST = {
  'hdb323>hst152': 'Assam SHG seed capital (₹10,000 first tranche) vs Bihar Mahila Rojgar launch payment',
  'hdb134>hst159': 'Delhi BJP scheme’s ₹2,500 vs Jharkhand Maiya Samman rate',
  'hdb331>hst346': 'Sikkim SDF’s 20,000 temporary jobs vs SKM Aama Yojana grant',
  'hdb221>hmd020': 'Pasupu-Kumkuma EC case (Delhi HC direction) vs AP channel blackout case',
  'hdb306>hel026': 'TMC vote share in Bengal vs ADR share of MPs with criminal cases',
  'hdb044>hdb020': 'PMMVY payout for a second girl child vs the NFSA s.4(b) legal floor; both ₹5,000 and ₹6,000 appear',
  'hdb317>hdb024': 'Odisha Madhu Babu pension rate vs Atal Pension Yojana co-contribution cap',
  'hdb333>hdb036': 'Meghalaya CM-Elevate ₹300 crore outlay vs Ujjwala ₹300 LPG subsidy',
  'hdb040>hdb038': '“100% e-KYC” for Bengal MGNREGA vs ₹100 LPG price cut',
  'hdb030>hdb043': 'PM-SYM worker contribution of ₹55–200 vs NSAP old-age pension rate',
  'hdb133>hdb043': 'Haryana’s ₹200 state pension top-up vs the Centre’s NSAP rate',
  'hdb317>hdb043': 'Odisha’s ₹200 pre-2019 state pension rise vs the Centre’s NSAP rate',
  'hdb101>hdb103': 'Haryana old-age allowance ₹500–700 (2009) vs UP unemployment allowance (2006)',
  'hdb107>hdb103': 'Haryana old-age allowance ₹500–700 (2009) vs UP unemployment allowance (2006)',
  'hdb200>hdb103': 'Goa senior citizens’ ₹500 medical allowance vs UP unemployment allowance',
  'hdb217>hdb103': 'Goa Griha Aadhar ₹500 rise (2026) vs UP unemployment allowance',
  'hdb334>hdb116': 'Arunachal Dulari Kanya deposit vs UP Kanya Vidya Dhan grant',
  'hdb012>hdb119': 'Centre’s ₹50,000 crore waiver (2008) vs Rajasthan’s ₹50,000 per-farmer cap (2018)',
  'hdb219>hdb120': 'Karnataka 2018 waiver cap vs Punjab 2018 waiver cap',
  'hdb226>hdb120': 'Maharashtra 2019 waiver cap vs Punjab 2018 waiver cap',
  'hdb417>hdb120': 'Telangana 2024 waiver cap vs Punjab 2018 waiver cap',
  'hdb116>hdb125': 'SP’s 2026 promise for UP Kanya Vidya Dhan vs Bihar Kanya Utthan graduation grant',
  'hdb125>hdb132': 'Bihar Kanya Utthan Class 12 grant vs UP Kanya Sumangala total',
  'hdb043>hdb136': 'Centre’s all-state average pension (~₹1,100) vs Bihar’s 2025 pension rate',
  'hdb207>hdb218': 'MP Ladli Laxmi Class 9 payment vs Telangana Rythu Bandhu per-acre rate',
  'hdb117>hdb225': 'UP 2017 bad-loan settlement vs Telangana 2019 waiver allocation',
  'hdb219>hdb226': 'Karnataka 2018 waiver cap vs Maharashtra 2019 waiver cap',
  'hdb417>hdb226': 'Telangana 2024 waiver cap vs Maharashtra 2019 waiver cap',
  'hdb113>hdb233': 'J&K Ladli Beti ₹450 crore budget vs MP ₹450 LPG cylinder',
  'hdb302>hdb301': 'Rupashree marriage grant vs Kanyashree grant at 18: different schemes that share a figure',
  'hdb219>hdb315': 'Karnataka’s 2018 farm-loan waiver vs what Odisha’s KALIA announcement rejected',
  'hdb024>hdb317': 'Atal Pension Yojana cap vs Odisha Madhu Babu pension rate',
  'hdb133>hdb321': 'Haryana old-age pension ₹3,000 vs Assam Orunodoi 2021 promise',
  'hdb303>hdb321': 'Bengal BJP’s ₹3,000 farm top-up vs Assam Orunodoi 2021 promise',
  'hdb317>hdb330': 'Odisha’s ₹700 rate for over-80s vs Tripura’s 2018 pension rate',
  'hdb116>hdb334': 'SP’s promised UP Kanya Vidya Dhan amount vs Arunachal Dulari Kanya total',
  'hdb125>hdb334': 'Bihar Kanya Utthan graduation grant vs Arunachal Dulari Kanya total',
  'hdb145>hrf016': 'Uttarakhand women’s self-employment loan limit vs 2013 PMNRF ex gratia',
  'hdb400>hrf031': 'Janashree Bima accidental-death cover (2000) vs Covid death ex gratia (2021)',
  'hdb004>hpe005': 'UHIS ₹100 premium subsidy (2003) vs Farm Income Insurance district count (2004)',
  'hdb030>hpe101': 'PM-SYM contribution range vs YSR’s 2004 Andhra pension promise',
  'hdb207>hpe151': 'MP Ladli Laxmi amount at 21 vs Delhi Ladli amount at 18',
  'hdb244>hpe151': 'MP Ladli Laxmi commitment per girl vs Delhi Ladli amount at 18',
  'hdb408>hpe116': 'Maharashtra 2017 waiver cap vs Andhra 2014 per-family ceiling',
  'hdb101>hpe125': 'Haryana’s 1999 old-age allowance vs MP Sambal flat power bill',
  'hdb121>hpe125': 'Delhi’s 200 free power units vs MP Sambal flat power bill',
  'hdb417>hpe126': 'Telangana 2024 waiver cap vs Kamal Nath’s 2018 MP waiver order',
  'hdb224>hpe140': 'Chhattisgarh’s ₹2,500 paddy price vs Telangana Mahalakshmi promise',
  'hdb219>hpe143': 'Karnataka 2018 waiver cap vs Jharkhand 2024 waiver limit',
  'hdb226>hpe143': 'Maharashtra 2019 waiver cap vs Jharkhand 2024 waiver limit',
  'hdb417>hpe143': 'Telangana 2024 waiver cap vs Jharkhand 2024 waiver limit',
  'hdb129>hpe146': 'Himachal’s ₹1-a-unit slab up to 125 units vs Bihar’s 125 free units',
  'hdb333>hdb406': '70,000 Meghalaya youth entering the workforce vs Indira Awaas grant',
  'hdb012>hdb407': 'Centre’s ₹50,000 crore waiver (2008) vs Karnataka’s ₹50,000 per-farmer cap (2017)',
  'hdb229>hdb412': 'Tamil Nadu’s ₹100 Pongal cash of 1990 vs Maharashtra ration-kit price',
  'hdb028>hdb415': 'PM-KISAN’s own ₹6,000 vs Madhya Pradesh’s state top-up',
  'hdb122>hdb415': 'PM-KISAN ₹6,000 cited in Jharkhand vs Madhya Pradesh’s state top-up',
  'hdb420>hdb415': 'Maharashtra Namo Shetkari top-up vs Madhya Pradesh top-up',
  'hdb136>hdb418': 'Tejashwi Yadav quoted as opposition critic in 2025; says nothing of the Jan 2024 cabinet',
  'hdb221>hdb423': 'Andhra Pasupu-Kumkuma (2019) vs Manipur SHG scheme (2026)',
  'hdb323>hdb423': 'Assam SHG seed capital vs Manipur SHG scheme',
  'hdb416>hdb423': 'Telangana women’s fare savings in crore vs Manipur SHG payment',
  'hdb022>hrf206': 'OROP ₹500 crore in the 2014 interim budget vs 2012 Cyclone Thane relief',
  'hdb030>hrf206': 'PM-SYM ₹500 crore allocation vs 2012 Cyclone Thane relief',
  'hdb101>hpe212': 'Haryana old-age allowance from 2014 vs Himachal unemployment allowance',
  'hdb103>hpe212': 'UP unemployment allowance revived in 2012 vs Himachal allowance of 2017',
  'hdb107>hpe212': 'Haryana old-age allowance from 2014 vs Himachal unemployment allowance',
  'hdb110>hpe212': 'UP unemployment allowance rate (2012) vs Himachal allowance of 2017',
  'hdb422>hpe219': 'Bihar Student Credit Card repayment band vs Laghu Udyami grant',
};

// ── Reviewed false positives: relief-fund and before-the-vote lanes ─────────────────────────────────
// Leaks whose text sits in relief-centre, relief-states, poll-union, poll-states, money-gaps-relief or
// money-gaps-poll. Each pair was read by hand (26 Sep 2026): the leaking card is about another scheme,
// state, year or event and only shares a common figure. Real giveaways found in these lanes were reworded
// instead (PM-JAY cover, Lakshmir Bhandar rates, FC allocations and hazard list, the PM's ₹1,000 crore
// interim-aid habit, the national Covid ex gratia, the BJP's 2023 paddy price).
const REVIEWED_OK_RELIEF_POLL = {
  'hrf134>hbx030': 'Sheopur ex-tehsildar’s arrest date (26 Mar 2026) vs GST compensation cess end date',
  'hpe208>hst213': 'Maharashtra’s 2014 power-tariff cut of about 20% vs its 2026-27 debt-to-GSDP ratio',
  'hrf218>hst229': 'Mahtari Dular Covid-orphan scholarship (Class 9–12) vs Mahtari Vandan payment to women',
  'hpe220>hdb005': 'Lakhpati Didi target raised from 2 crore women (2024) vs AAY extension to 2 crore families (2004)',
  'hpe137>hdb024': 'Rajasthan’s ₹1,000 minimum pension (2023) vs Atal Pension Yojana co-contribution cap',
  'hpe209>hdb024': 'Kerala welfare pension raised from ₹1,000 (2016) vs Atal Pension Yojana co-contribution cap',
  'hpe101>hdb043': 'YSR’s 2004 Andhra pension promise vs the Centre’s NSAP old-age rate',
  'hpe116>hdb117': 'Andhra 2014 expert panel’s ₹1 lakh waiver cap vs UP 2017 waiver limit',
  'hpe117>hdb117': 'Telangana 2014 ₹1 lakh waiver promise vs UP 2017 waiver limit',
  'hpe143>hdb119': 'Jharkhand’s pre-2024 ₹50,000 waiver limit vs Rajasthan’s 2018 cap',
  'hpe126>hdb120': 'Kamal Nath’s 2018 MP waiver order vs Punjab 2018 waiver cap',
  'hpe126>hdb226': 'Kamal Nath’s 2018 MP waiver order vs Maharashtra 2019 waiver cap',
  'hpe137>hdb317': 'Rajasthan’s ₹1,000 minimum pension (2023) vs Odisha Madhu Babu pension rate (2024)',
  'hpe209>hdb317': 'Kerala welfare pension raised from ₹1,000 (2016) vs Odisha Madhu Babu pension rate (2024)',
  'hpe026>hdb335': 'Modi launching PM-JAY in Ranchi (2018) vs who launched Odisha’s Subhadra (2024)',
  'hpe110>hdb321': 'UP free laptops and tablets at about ₹3,000 crore (2012) vs Assam Orunodoi 2021 promise',
  'hrf106>hdb324': '11,000 tsunami houses due in Kerala vs Mizoram MIP grant per family',
  'hrf016>hdb326': 'PMNRF ₹50,000 per injured person (Uttarakhand 2013) vs Mizoram SEDP payment',
  'hpe219>hdb326': 'Bihar Laghu Udyami first instalment of ₹50,000 vs Mizoram SEDP payment',
  'hrf108>hrf015': 'Maharashtra’s own ₹500 crore release after the 2005 floods vs the PM’s 2012 Assam aid',
  'hrf112>hrf020': 'Odisha’s ₹1,000 crore request after Phailin, not aid a PM announced',
  'hrf215>hrf021': '15th FC’s 10% share for preparedness vs the 14th FC cap for local disasters',
  'hrf016>hrf031': 'PMNRF ₹50,000 per injured person (2013) vs Covid death ex gratia (2021)',
  'hrf109>hrf138': 'Karnataka’s 2009 flood-loss estimate of ₹20,000 crore vs Punjab 2025 per-acre compensation',
  'hpe222>hrf138': 'PM-KISAN instalment of about ₹20,000 crore vs Punjab 2025 per-acre compensation',
  'hpe126>hpe143': 'Kamal Nath’s 2018 MP waiver order vs Jharkhand 2024 waiver limit',
  'hpe143>hdb407': 'Jharkhand’s pre-2024 ₹50,000 waiver limit vs Karnataka 2017 co-op waiver cap',
  'hpe149>hdb412': 'Tamil Nadu’s ₹100 Pongal gift of 2014 vs Maharashtra ration-kit price',
  'hpe217>hdb415': 'PM-KISAN’s own ₹6,000 vs Madhya Pradesh’s state top-up',
  'hrf216>hrf206': 'Yaas aid split (₹500 crore to Odisha, 2021) vs 2012 Cyclone Thane relief',
  'hrf212>hrf218': 'UP ₹1,000 lockdown transfer to labourers vs Chhattisgarh Covid-orphan scholarship',
  'hrf031>hrf224': 'Covid PIL petitioners’ ₹4 lakh demand vs Mizoram CM’s 2024 landslide ex gratia',
  'hrf222>hrf224': 'Bihar’s ₹4 lakh for hooch deaths vs Mizoram CM’s 2024 landslide ex gratia',
  'hpe110>hpe212': 'UP unemployment allowance rate (2012) vs Himachal allowance of 2017',
  'hrf212>hpe212': 'UP ₹1,000 lockdown transfer (2020) vs Himachal unemployment allowance (2017)',
  'hpe028>hpe220': '2019 interim-budget tax benefit for about 3 crore taxpayers vs Lakhpati Didi target (2024)',
};

// ── Reviewed false positives: original lanes ─────────────────────────────────────────────────────────
// Leaks whose text sits in schemes, spending, scams, states-north, states-west-south, states-east, media,
// elections, forwards or balance-cases. Each pair was read by hand (26 Sep 2026): the leaking card is
// about another scheme, state, year or quantity, or is a card about the answer scheme itself that says
// nothing of the other card's case. Real giveaways found here were reworded instead (hst146 no longer
// names the NPS cut-off date or the Old Pension Scheme, which hsc043 and hst119 ask for).
const REVIEWED_OK_ORIGINAL = {
  'hst155>hbx006': 'Bihar’s 2024-25 revised fiscal deficit vs the Union’s 2020-21 deficit: a coincidental 9.2%',
  'hst339>hbx007': 'Mizoram’s budgeted 2025-26 deficit vs the Union’s 2013-14 revised deficit: a coincidental 4.6%',
  'hsc029>hst145': 'Jal Jeevan Mission coverage card names its own scheme; says nothing of the Rajasthan minister’s case',
  'hsc030>hst145': 'Jal Jeevan Mission outlay card names its own scheme; says nothing of the Rajasthan minister’s case',
  'hsc031>hst145': 'National JJM complaint counts (answer: UP); names no minister and no Rajasthan case',
  'hbx016>hst145': 'Jal Jeevan Mission budget-cut card names its own scheme; says nothing of the Rajasthan minister’s case',
  'hst311>hmd010': 'Odisha 2024 result names the BJD as the ousted ruling party; says nothing of the OTV owner’s past party',
  'hsc044>hdb024': 'APY’s ₹1,000–₹5,000 monthly pension vs the Centre’s yearly co-contribution cap: different quantities',
  'hsc044>hdb317': 'Atal Pension Yojana pension range vs Odisha Madhu Babu pension rate (2024)',
  'hsc004>hdb038': '“100% Aadhaar-seeded” PM-KISAN database vs the ₹100 LPG price cut',
  'hsc045>hdb038': '100 Smart Cities vs the ₹100 LPG price cut',
  'hbx035>hdb038': 'PM CARES donations’ 100% tax exemption vs the ₹100 LPG price cut',
  'hst209>hdb038': 'Alleged ₹100 crore-a-month collection target (Mumbai, 2021) vs the ₹100 LPG price cut',
  'hbx019>hrf021': '16th FC’s 10% weight for GDP in the tax formula vs the 14th FC cap for local disasters',
  'hel025>hpe005': 'BSP’s 100% non-donation income (ADR) vs the 2004 Farm Income Insurance district count',
  'hgh044>hdb407': 'Sahara refunds of up to ₹50,000 per depositor vs Karnataka’s 2017 co-op waiver cap',
  'hsc001>hdb415': 'PM-KISAN’s own ₹6,000 vs Madhya Pradesh’s state top-up',
  'hst152>hpe219': 'Mahila Rojgar Yojana’s later support of up to ₹2 lakh vs Laghu Udyami Yojana’s ₹2 lakh: different Bihar schemes',
};

const norm = (s) => String(s ?? '').toLowerCase().replace(/[₹,]/g, '').replace(/rs\.?\s*/g, '').replace(/\s+/g, ' ').trim();
const GENERIC = new Set(['supreme court', 'enforcement directorate', 'central bureau of investigation', 'election commission of india', 'comptroller and auditor general', 'rajya sabha', 'lok sabha', 'president\'s rule']);
const items = Object.entries(LANES).flatMap(([lane, arr]) => arr.map((q) => ({ lane, q })));
const textOf = (q) =>
  norm([q.question, q.explanation, q.outcome, q.otherSide, q.status, ...(q.enactedBy ?? []).map((e) => `${e.name} ${e.role}`)].join(' | '));

const STOP = new Set(['scheme', 'yojana', 'case', 'cases', 'fund', 'funds', 'india', 'indian', 'state', 'government', 'relief', 'budget', 'bill', 'report', 'audit', 'election', 'elections', 'assembly', 'mission', 'national', 'central', 'union', 'pradesh', 'scam', 'party', 'poll', 'polls', 'mantri', 'mukhyamantri', 'pradhan', 'with', 'from', 'after', 'before']);
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w));
const pairs = [];
for (const a of items) {
  const ans = norm(a.q.options[a.q.correctIndex]);
  const bigNumber = /\d{3,}|\d[\d.]*\s*(%|kg|days|crore|lakh|per cent|km|seats|months|years)/.test(ans.replace(/\s+/g, ' '));
  const letters = ans.replace(/[^a-z]/g, '').length;
  if (/^(19|20)\d\d$/.test(ans) || GENERIC.has(ans)) continue;
  if (!bigNumber && letters < 12) continue;
  const subject = new Set(words(a.q.subtopic));
  for (const b of items) {
    if (b === a) continue;
    const t = textOf(b.q);
    const sameSubject = norm(b.q.subtopic) === norm(a.q.subtopic) || words(b.q.subtopic + ' ' + b.q.question).some((w) => subject.has(w));
    if (!sameSubject) continue;
    // Word-boundary match so "25" doesn't match "250".
    const re = new RegExp(`(^|[^a-z0-9.])${ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
    if (re.test(t)) pairs.push({ answerOf: a.q.id, answerLane: a.lane, answer: a.q.options[a.q.correctIndex], leakedIn: b.q.id, leakLane: b.lane });
  }
}

// ── Merge every group's reviewed list into one set, then report ─────────────────────────────────────
// Add another group's list by spreading it in here: { ...REVIEWED_OK_DIST, ...REVIEWED_OK_<GROUP> }.
const REVIEWED_OK = new Map(Object.entries({ ...REVIEWED_OK_DIST, ...REVIEWED_OK_RELIEF_POLL, ...REVIEWED_OK_ORIGINAL }));
const keyOf = (p) => `${p.leakedIn}>${p.answerOf}`;
for (const p of pairs) {
  p.reviewed = REVIEWED_OK.has(keyOf(p));
  if (p.reviewed) p.reason = REVIEWED_OK.get(keyOf(p));
}
const unreviewed = pairs.filter((p) => !p.reviewed);
const found = new Set(pairs.map(keyOf));
// A reviewed entry that no longer matches (text reworded, item dropped) is harmless but should be pruned.
const stale = [...REVIEWED_OK.keys()].filter((k) => !found.has(k));
if (process.argv.includes('--json')) console.log(JSON.stringify(pairs, null, 1));
else {
  const byLeakLane = unreviewed.reduce((m, p) => ((m[p.leakLane] = (m[p.leakLane] ?? 0) + 1), m), {});
  console.log(`${pairs.length} giveaway pairs across ${items.length} items: ${pairs.length - unreviewed.length} reviewed as false positives, ${unreviewed.length} unreviewed`);
  console.log('unreviewed, by lane holding the leak:', JSON.stringify(byLeakLane));
  for (const p of unreviewed) console.log(`  ${p.leakedIn} (${p.leakLane}) gives away ${p.answerOf}: "${p.answer}"`);
  if (stale.length) console.log(`stale reviewed entries (no longer found; prune them): ${stale.join(', ')}`);
}
process.exitCode = unreviewed.length > 0 ? 1 : 0;
