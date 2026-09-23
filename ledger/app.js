/* ==========================================================================
   LEDGER — The Politics & Money Desk · app.js
   Vanilla JS. Hash-routed, no reloads. Works from file:// and static hosts.
   Engine adapted from SABHA; design and systems per LEDGER_DOCTRINE.md.
   ========================================================================== */
(function () {
'use strict';

/* ---------------- Utilities ---------------- */
var $ = function (sel, root) { return (root || document).querySelector(sel); };
var el = function (tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
var NF = new Intl.NumberFormat('en-IN');
var fmt = function (n) { return NF.format(n); };
var CIRCLED = ['①', '②', '③', '④'];
var DAY_MS = 86400000;
function dayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function announce(msg) { var l = $('#live'); if (l) l.textContent = msg; }
function hash32(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ---------------- Question bank & desks ---------------- */
var BANK = (window.LEDGER_POLITICS || []).concat(window.LEDGER_FINANCE || []);
var DESKS = [
  { id: 'polity',  nameK: 'deskPolity',  descK: 'deskPolityDesc',
    eras: ['The Record: Audits & Courts', 'Elections & Institutions', 'Ministries & Machinery', 'Parties & Symbols'] },
  { id: 'money',   nameK: 'deskMoney',   descK: 'deskMoneyDesc',
    eras: ['Money & Markets', 'Investment Awareness', 'Budgets & Documents'] },
  { id: 'schemes', nameK: 'deskSchemes', descK: 'deskSchemesDesc',
    eras: ['Schemes & Policy Timeline (politics of)', 'Government Schemes'] }
];
function deskOf(q) {
  for (var i = 0; i < DESKS.length; i++) if (DESKS[i].eras.indexOf(q.era) >= 0) return DESKS[i];
  return DESKS[0];
}
function deskQuestions(id) {
  var d = DESKS.filter(function (x) { return x.id === id; })[0];
  return BANK.filter(function (q) { return d.eras.indexOf(q.era) >= 0; });
}

/* ---------------- Persistent state ---------------- */
var LS_KEY = 'ledger.v1';
var DEFAULTS = {
  xp: 0, coins: 1000, name: 'Reader', lang: 'en', relaxed: false, sound: false, onboarded: false,
  grantDay: null,
  weekKey: null, weekXp: 0, weekRecord: { w: 0, d: 0, l: 0 },
  tier: 0, leagueHistory: [], prevRank: null,
  clippings: [], ratings: { polity: 1000, money: 1000, schemes: 1000 },
  sittings: 0, duelsEntered: 0, prevailed: 0, drawn: 0, days: {}
};
var S;
try {
  S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
} catch (e) { S = Object.assign({}, DEFAULTS); }
S.weekRecord = Object.assign({ w: 0, d: 0, l: 0 }, S.weekRecord);
S.ratings = Object.assign({ polity: 1000, money: 1000, schemes: 1000 }, S.ratings);
if (!Array.isArray(S.clippings)) S.clippings = [];
if (!Array.isArray(S.leagueHistory)) S.leagueHistory = [];
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* private mode: session-only */ }
}
function markToday() {
  S.days[dayKey()] = true;
  var keys = Object.keys(S.days).sort();
  while (keys.length > 60) delete S.days[keys.shift()];
  save();
}

/* ---------------- Titles & XP ---------------- */
var TITLES = [
  { name: 'Stringer', xp: 0 },
  { name: 'Correspondent', xp: 300 },
  { name: 'Editor', xp: 900 },
  { name: 'Editor-in-Chief', xp: 2000 }
];
function titleFor(xp) {
  var t = TITLES[0], idx = 0;
  TITLES.forEach(function (ti, i) { if (xp >= ti.xp) { t = ti; idx = i; } });
  return { title: t, level: idx + 1, next: TITLES[idx + 1] || null };
}
function xpToNext(level) { return Math.round(80 * Math.pow(level, 1.55)); }
function addXP(n) { S.xp += n; S.weekXp += n; save(); }

/* ---------------- Economy (simulated coins — free, no money) ---------------- */
var STAKES = [0, 10, 25, 50, 100, 250, 500];
var FEE_BPS = { 0: 0, 10: 0, 25: 0, 50: 1000, 100: 1000, 250: 1000, 500: 1500 };
function feeFor(stake) { return Math.round(2 * stake * (FEE_BPS[stake] || 0) / 10000); }
function prizeFor(stake) { return 2 * stake - feeFor(stake); }
function dailyGrant() {
  var today = dayKey();
  if (S.grantDay === today) return false;
  var first = !S.grantDay;
  S.grantDay = today;
  if (first) { save(); return false; } /* wallet opens at 1,000; grant from day two */
  S.coins += 30; save();
  return true;
}

/* ---------------- The weekly league of 30 ---------------- */
var TIERS = ['Desk League', 'Press League', "Editors' League"];
var TIER_BASE = [0, 350, 750]; /* higher desks follow the news harder */
var RIVALS = [
  ['kumar', 'Cuttings-Desk Kumar'], ['meera', 'Madras Mail Meera'], ['sunita', 'Stringer Sunita'],
  ['banerjee', 'Bureau Chief Banerjee'], ['nair', 'Night-Editor Nair'], ['chatterjee', 'Copytaster Chatterjee'],
  ['subramaniam', 'Sub-Editor Subramaniam'], ['lakshmi', 'Linotype Lakshmi'], ['prasad', 'Proof-Reader Prasad'],
  ['gopal', 'Gazette Gopal'], ['diwan', 'Desk Diwan'], ['pillai', 'Pagination Pillai'],
  ['kamath', 'Colophon Kamath'], ['biswas', 'Byline Biswas'], ['dsouza', 'Deadline D’Souza'],
  ['trivedi', 'Telegraph Trivedi'], ['menon', 'Masthead Menon'], ['naidu', 'Newsprint Naidu'],
  ['desai', 'Dateline Desai'], ['feroz', 'Front-Page Feroz'], ['chawla', 'Column-Inch Chawla'],
  ['pandey', 'Press-Room Pandey'], ['iyer', 'Ink-Stained Iyer'], ['ghosh', 'Galley Ghosh'],
  ['bhattacharya', 'Bulletin Bhattacharya'], ['eapen', 'Edition Eapen'], ['wankhede', 'Wire-Service Wankhede'],
  ['reddy', 'Red-Pencil Reddy'], ['kaur', 'Corrections Kaur']
];
function isoWeekKey(d) {
  d = d || new Date();
  var dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var day = (dt.getUTCDay() + 6) % 7; /* 0 = Monday */
  dt.setUTCDate(dt.getUTCDate() - day + 3); /* Thursday of this week */
  var firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  var fd = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - fd + 3);
  var week = 1 + Math.round((dt - firstThu) / (7 * DAY_MS));
  return dt.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}
function weekDayIndex(d) { d = d || new Date(); return (d.getDay() + 6) % 7; } /* 0=Mon .. 6=Sun */
function rivalDayGain(id, wk, day) { return 40 + (hash32(id + '|' + wk + '|' + day) % 221); } /* 40..260 */
function rivalWeekTotal(id, wk, uptoDay, tier) {
  var sum = TIER_BASE[tier] || 0;
  for (var d = 0; d <= uptoDay; d++) sum += rivalDayGain(id, wk, d);
  return sum;
}
function rivalRecord(id, wk) {
  var h = hash32(id + '|' + wk + '|rec');
  var played = 3 + (h % 8);
  var w = h % (played + 1);
  var d = (h >>> 4) % (played - w + 1);
  var l = played - w - d;
  return { w: w, d: d, l: l };
}
function rivalMove(id, wk) { return (hash32(id + '|' + wk + '|mv') % 5) - 2; } /* -2..+2 seeded jitter */
function leagueRows(wk, uptoDay, playerXp, tier) {
  var rows = RIVALS.map(function (r) {
    return {
      id: r[0], name: r[1], player: false,
      awareness: rivalWeekTotal(r[0], wk, uptoDay, tier),
      rec: rivalRecord(r[0], wk),
      move: rivalMove(r[0], wk)
    };
  });
  rows.push({
    id: 'you', name: S.name, player: true,
    awareness: playerXp,
    rec: { w: S.weekRecord.w, d: S.weekRecord.d, l: S.weekRecord.l },
    move: null /* filled by caller against prevRank */
  });
  rows.sort(function (a, b) {
    if (b.awareness !== a.awareness) return b.awareness - a.awareness;
    return hash32(a.id + '|' + wk) - hash32(b.id + '|' + wk); /* stable seeded tie-break */
  });
  rows.forEach(function (r, i) { r.rank = i + 1; });
  var me = rows.filter(function (r) { return r.player; })[0];
  if (me) me.move = S.prevRank == null ? 0 : S.prevRank - me.rank;
  return rows;
}
function playerRank() {
  var rows = leagueRows(S.weekKey, weekDayIndex(), S.weekXp, S.tier);
  return rows.filter(function (r) { return r.player; })[0].rank;
}
/* Monday rollover: archive last week, promote/relegate, reset */
function leagueRollover() {
  var cur = isoWeekKey();
  if (S.weekKey === cur) return false;
  var note = null;
  if (S.weekKey) {
    var rows = leagueRows(S.weekKey, 6, S.weekXp, S.tier); /* full final week */
    var me = rows.filter(function (r) { return r.player; })[0];
    var oldTier = S.tier;
    var newTier = me.rank <= 10 ? Math.min(2, oldTier + 1) : (me.rank >= 26 ? Math.max(0, oldTier - 1) : oldTier);
    S.leagueHistory.unshift({ week: S.weekKey, tier: TIERS[oldTier], rank: me.rank, xp: S.weekXp });
    if (S.leagueHistory.length > 8) S.leagueHistory = S.leagueHistory.slice(0, 8);
    S.tier = newTier;
    note = { rank: me.rank, oldTier: oldTier, newTier: newTier };
  }
  S.weekKey = cur; S.weekXp = 0; S.weekRecord = { w: 0, d: 0, l: 0 }; S.prevRank = null;
  save();
  return note;
}
function noteRank() { S.prevRank = playerRank(); save(); }

/* ---------------- Desk ratings (Elo-lite, K=32) ---------------- */
function rateRound(deskId, score) { /* score 1 / 0.5 / 0 for the account holder */
  var r = S.ratings[deskId] || 1000;
  var expected = 1 / (1 + Math.pow(10, (1000 - r) / 400));
  S.ratings[deskId] = Math.round(r + 32 * (score - expected));
}

/* ---------------- Clippings (vault, cap 100) ---------------- */
function fileClipping(q, picked) {
  var clip = {
    id: q.id, q: q.q, options: q.options, answerIndex: q.answerIndex,
    desk: deskOf(q).id, picked: picked, date: dayKey(),
    source: q.source, sourceUrl: q.sourceUrl, note: q.note
  };
  S.clippings.unshift(clip);
  while (S.clippings.length > 100) S.clippings.pop();
  save();
}

/* ---------------- i18n ---------------- */
var STR = {
  en: {
    navEdition: 'Edition', navDuels: 'Duels', navLeague: 'League', navBeats: 'Beats', navClips: 'Clippings', navCard: 'Press Card',
    coins: 'Coins',
    colophonLine: 'Simulated coins. No money, no prizes. Every answer shows its source.',
    tagline: 'Who follows the news best?',
    volLine: 'THE POLITICS & MONEY DESK · DAILY · ',
    leadStory: 'Today’s Lead', openLead: 'Open the lead',
    leadHint: 'One question, ten seconds, against the Wire Bot. The desk rotates daily.',
    deskIndex: 'Desk Index', deskHint: 'Three desks. Open a beat for six untimed questions with a confidence ladder.',
    leagueSnapshot: 'League Snapshot', viewLeague: 'Full table',
    deskPolity: 'Polity Desk', deskMoney: 'Money Desk', deskSchemes: 'Schemes Desk',
    deskPolityDesc: 'Audits, courts, elections, ministries, parties — the documented record, 2000–2026.',
    deskMoneyDesc: 'Money, markets, budgets and investment literacy.',
    deskSchemesDesc: 'Government schemes and the policy timeline.',
    modesTitle: 'Choose a Duel', modesSub: 'Three forms of fact duel. Timers are a hairline, never a cage.',
    relaxed: 'Relaxed Mode', relaxedHint: 'No countdowns. Speed is ignored entirely. Your choice is remembered.',
    opponent: 'Across the desk', oppWire: 'The Wire Bot (the house machine)', oppTable: 'Across the Desk (two readers, one device)',
    stakeLabel: 'Stake (simulated coins)', stakeBotNote: 'The Wire Bot plays free — no stake against the house.',
    stakeHint: 'Both readers stake equally. Winner takes 2× stake minus a desk fee; a draw refunds in full.',
    begin: 'Begin', back: 'Back to the Edition',
    you: 'You', seatA: 'Seat A', seatB: 'Seat B', wireBot: 'The Wire Bot',
    lock: 'File the answer', lockHint: 'You may change your answer until you file it.',
    passDevice: 'Pass the device — no peeking', passHint: 'Seat A’s answer is filed and hidden. Hand the device to Seat B.',
    seatReady: 'Seat B is ready',
    next: 'Next', seeVerdict: 'See the front page',
    correct: 'Correct', incorrect: 'Not correct', unanswered: 'Unanswered', drawLabel: 'Draw',
    source: 'Source:', verifySource: 'Verify at source ↗',
    lateEdition: 'LATE EDITION', filed: 'FILED', verified: 'VERIFIED',
    headPrevail: 'READER PREVAILS', headBot: 'WIRE BOT TAKES IT', headDraw: 'EDITION DRAWN',
    headA: 'SEAT A PREVAILS', headB: 'SEAT B PREVAILS',
    youPrevailed: 'You prevailed', botPrevailed: 'The Wire Bot prevailed', drawn: 'The edition is drawn',
    seatAPrevailed: 'Seat A prevailed', seatBPrevailed: 'Seat B prevailed',
    roundLedger: 'Round-by-round ledger', colRound: 'Round', colYou: 'You', colOpp: 'Wire Bot', colResult: 'Round to', colSource: 'Source',
    totals: 'Totals', xpEarned: 'Awareness filed (XP)',
    coinSettleWin: 'Coin settlement: stake {s} each · prize {p} · desk fee {f} · credited.',
    coinSettleDraw: 'Coin settlement: draw — both stakes refunded in full.',
    coinSettleFree: 'A free duel — no coins moved.',
    again: 'Duel again', toDesk: 'Return to the Edition', toModes: 'Choose another duel',
    quit: 'Leave the duel',
    modeSingle: 'Front Page', modeSingleRules: 'One question · 10 seconds',
    modeBo3: 'Above the Fold', modeBo3Rules: 'First to 2 rounds · 7 seconds',
    modeFull: 'The Long Read', modeFullRules: 'Five rounds, score decides · 5 seconds',
    leagueTitle: 'The League Table', leagueSub: 'Thirty readers, one week. Awareness filed this week sets your rank. The table resets on Monday: top 10 move up a league, bottom 5 move down.',
    colRank: 'Rank', colReader: 'Reader', colAware: 'Awareness', colWdl: 'W–D–L', colMove: 'Move',
    tierLabel: 'League', weekLabel: 'Week', daysLeft: 'days left',
    promoNote: 'Promotion band — top 10 rise on Monday', relNote: 'Relegation band — bottom 5 fall on Monday',
    archiveTitle: 'Past weeks', youTag: 'YOU',
    beatsTitle: 'Beats', beatsSub: 'Six untimed questions on one desk. State your confidence before each reveal — the first choice locks. +40 awareness on completion.',
    startBeat: 'Open the beat',
    confPrompt: 'How surely do you hold this answer?',
    confSteady: 'Steady', confSteadyDesc: 'Measured. +2 if right, 0 if wrong.',
    confBold: 'Bold', confBoldDesc: 'Firm. +3 if right, −1 if wrong.',
    confCalled: 'Called', confCalledDesc: 'Certain. +4 if right, −3 if wrong.',
    beatDone: 'The beat is filed', beatPoints: 'Beat marks',
    clipsTitle: 'Clippings', clipsSub: 'Every question you have answered, cut and kept. Review them; drill the ones you missed.',
    filterAll: 'All desks', recallBtn: 'Recall drill', emptyClips: 'No clippings yet. Answer a question and it will be cut and kept here.',
    clipYour: 'Your pick', clipAnswer: 'On the record',
    recallTitle: 'Recall Drill', recallSub: 'Five clippings, untimed. +6 awareness per correct review.',
    recallDone: 'Drill complete', recallScore: 'Recalled correctly',
    cardTitle: 'Press Card', standing: 'Standing', ratingsTitle: 'Desk ratings', weekRec: 'This week',
    stSittings: 'Duels completed', stPrevailed: 'Prevailed', stDrawn: 'Drawn', stXP: 'Awareness (XP)', ledgerStats: 'The desk ledger',
    fName: 'Reader', fTitle: 'Title', fCoins: 'Coins (simulated)', fLeague: 'League', fSince: 'Reading since',
    editName: 'Edit', saveName: 'Save',
    certBtn: 'Print Press Card', shareBtn: 'Share on WhatsApp', copyBtn: 'Copy share text', copied: 'Copied to the clipboard.',
    sound: 'Sound', soundHint: 'A teletype tick on reveal, a press ker-chunk on filing. Off by default.',
    lang: 'Language / भाषा',
    toNext: 'awareness to',
    coinsNote: 'Coins are simulated. No money, no prizes, nothing to buy.',
    scoringTitle: 'The scoring table',
    scoringBody: 'Correct answer 20 · trying 5 · duel won 50 · draw 25 · beat filed 40 · review 6. Speed adds at most 10 marks of 100 in timed duels, and nothing in Relaxed Mode.',
    ob1Title: 'Your first question',
    obHint1: 'Tap the answer you think is right — there is no penalty for trying. The Wire Bot is answering alongside you.',
    obLockHint: 'Changed your mind? Tap another line. Only “File the answer” is final.',
    obSourceTitle: 'Every answer shows its source',
    obSourceBody: 'After each answer the desk shows its clipping — the institution, the record, and a link to verify. Credibility is a feature here.',
    obScoreTitle: 'Coins, awareness, and your weekly table',
    obScoreBody: 'Right answers build awareness (XP) and raise your title: Stringer, Correspondent, Editor, Editor-in-Chief. Coins are simulated — you start with 1,000 and get 30 a day; they stake friendly duels, nothing else. The league is your weekly table: thirty readers, ranked by awareness, fresh every Monday.',
    obDone: 'Take your seat at the desk',
    practiceLabel: 'PRACTICE QUESTION',
    tickerAware: 'AWARENESS', tickerLeague: 'LEAGUE', tickerCoins: 'COINS', tickerToday: 'TODAY',
    grantNote: 'DAILY GRANT +30 COINS CREDITED',
    duelNoteWin: 'DESK DISPATCH: YOU PREVAIL {a}–{b} OVER THE WIRE BOT',
    duelNoteLoss: 'DESK DISPATCH: WIRE BOT TAKES IT {b}–{a}',
    duelNoteDraw: 'DESK DISPATCH: HONOURS EVEN {a}–{b}',
    beatNote: 'BEAT FILED: {d} COMPLETE +40 AWARENESS',
    rankNote: 'LEAGUE: #{r} ▲{m}', rankNoteDown: 'LEAGUE: #{r} ▼{m}', rankNoteFlat: 'LEAGUE: #{r} —',
    sharePre: 'LEDGER — The Politics & Money Desk: ',
    shareTail: ' Dispute this record.',
    todayIs: 'Today’s desk',
    verdictFile: 'LEDGER WIRE · FILED ',
    practiceNo: 'No. P-001'
  },
  hi: {
    navEdition: 'संस्करण', navDuels: 'द्वंद्व', navLeague: 'लीग', navBeats: 'बीट', navClips: 'कतरनें', navCard: 'प्रेस कार्ड',
    coins: 'सिक्के',
    colophonLine: 'काल्पनिक सिक्के। न पैसा, न इनाम। हर उत्तर अपना स्रोत दिखाता है।',
    tagline: 'सबसे बेहतर ख़बर कौन जानता है?',
    volLine: 'राजनीति और धन डेस्क · दैनिक · ',
    leadStory: 'आज की लीड', openLead: 'लीड खोलिए',
    leadHint: 'एक प्रश्न, दस सेकंड, वायर बॉट के विरुद्ध। डेस्क रोज़ बदलता है।',
    deskIndex: 'डेस्क सूची', deskHint: 'तीन डेस्क। बीट खोलिए — छह प्रश्न, बिना समय-सीमा, भरोसा-सीढ़ी के साथ।',
    leagueSnapshot: 'लीग झलक', viewLeague: 'पूरी तालिका',
    deskPolity: 'पॉलिटी डेस्क', deskMoney: 'मनी डेस्क', deskSchemes: 'स्कीम्स डेस्क',
    deskPolityDesc: 'लेखापरीक्षा, न्यायालय, चुनाव, मंत्रालय, दल — दस्तावेज़ी अभिलेख, 2000–2026।',
    deskMoneyDesc: 'धन, बाज़ार, बजट और निवेश-साक्षरता।',
    deskSchemesDesc: 'सरकारी योजनाएँ और नीति-समयरेखा।',
    modesTitle: 'द्वंद्व चुनिए', modesSub: 'तथ्य-द्वंद्व के तीन रूप। समय-सीमा एक बारिक रेखा है, पिंजरा नहीं।',
    relaxed: 'आराम मोड', relaxedHint: 'कोई उल्टी गिनती नहीं। गति की पूरी अनदेखी। आपकी पसंद याद रखी जाती है।',
    opponent: 'डेस्क के उस पार', oppWire: 'वायर बॉट (गृह-यंत्र)', oppTable: 'डेस्क के उस पार (दो पाठक, एक यंत्र)',
    stakeLabel: 'दाँव (काल्पनिक सिक्के)', stakeBotNote: 'वायर बॉट मुफ़्त खेलता है — घर के विरुद्ध कोई दाँव नहीं।',
    stakeHint: 'दोनों पाठक बराबर लगाते हैं। विजेता लेता है दोगुना दाँव घटा डेस्क शुल्क; बराबरी पर पूरी वापसी।',
    begin: 'शुरू करें', back: 'संस्करण पर लौटें',
    you: 'आप', seatA: 'पहली सीट', seatB: 'दूसरी सीट', wireBot: 'वायर बॉट',
    lock: 'उत्तर फ़ाइल करें', lockHint: 'फ़ाइल करने तक आप उत्तर बदल सकते हैं।',
    passDevice: 'यंत्र सौंपिए — झाँकना मना है', passHint: 'पहली सीट का उत्तर फ़ाइल होकर छिपा है। यंत्र दूसरी सीट को दीजिए।',
    seatReady: 'दूसरी सीट तैयार है',
    next: 'आगे', seeVerdict: 'फ्रंट पेज देखिए',
    correct: 'सही', incorrect: 'सही नहीं', unanswered: 'अनुत्तरित', drawLabel: 'बराबर',
    source: 'स्रोत:', verifySource: 'स्रोत पर जाँचें ↗',
    lateEdition: 'लेट एडिशन', filed: 'फ़ाइल्ड', verified: 'सत्यापित',
    headPrevail: 'पाठक विजयी', headBot: 'वायर बॉट आगे', headDraw: 'संस्करण बराबर',
    headA: 'पहली सीट विजयी', headB: 'दूसरी सीट विजयी',
    youPrevailed: 'आप विजयी रहे', botPrevailed: 'वायर बॉट विजयी रहा', drawn: 'संस्करण बराबर रहा',
    seatAPrevailed: 'पहली सीट विजयी रही', seatBPrevailed: 'दूसरी सीट विजयी रही',
    roundLedger: 'चरण-दर-चरण बही', colRound: 'चरण', colYou: 'आप', colOpp: 'वायर बॉट', colResult: 'चरण किसे', colSource: 'स्रोत',
    totals: 'योग', xpEarned: 'दर्ज जागरूकता (XP)',
    coinSettleWin: 'सिक्का निपटान: दाँव {s} प्रत्येक · पुरस्कार {p} · डेस्क शुल्क {f} · जमा किया गया।',
    coinSettleDraw: 'सिक्का निपटान: बराबर — दोनों दाँव पूरे लौटाए गए।',
    coinSettleFree: 'मुफ़्त द्वंद्व — कोई सिक्का नहीं चला।',
    again: 'फिर द्वंद्व', toDesk: 'संस्करण पर लौटें', toModes: 'दूसरा द्वंद्व चुनिए',
    quit: 'द्वंद्व छोड़ें',
    modeSingle: 'फ्रंट पेज', modeSingleRules: 'एक प्रश्न · 10 सेकंड',
    modeBo3: 'अबव द फ़ोल्ड', modeBo3Rules: 'पहले 2 चरण · 7 सेकंड',
    modeFull: 'द लॉन्ग रीड', modeFullRules: 'पाँच चरण, अंक तय करेंगे · 5 सेकंड',
    leagueTitle: 'लीग तालिका', leagueSub: 'तीस पाठक, एक सप्ताह। इस सप्ताह दर्ज जागरूकता आपका पद तय करती है। सोमवार को तालिका नई होती है: शीर्ष 10 ऊपर, अंतिम 5 नीचे।',
    colRank: 'पद', colReader: 'पाठक', colAware: 'जागरूकता', colWdl: 'ज–ब–ह', colMove: 'चाल',
    tierLabel: 'लीग', weekLabel: 'सप्ताह', daysLeft: 'दिन शेष',
    promoNote: 'प्रोन्नति पट्टी — शीर्ष 10 सोमवार को ऊपर', relNote: 'अवनति पट्टी — अंतिम 5 सोमवार को नीचे',
    archiveTitle: 'पिछले सप्ताह', youTag: 'आप',
    beatsTitle: 'बीट', beatsSub: 'एक डेस्क के छह प्रश्न, बिना समय-सीमा। हर उत्तर से पहले भरोसा बताइए — पहली पसंद अंतिम। पूर्णता पर +40 जागरूकता।',
    startBeat: 'बीट खोलिए',
    confPrompt: 'आप अपने उत्तर को कितनी सच्चाई से थामते हैं?',
    confSteady: 'स्थिर', confSteadyDesc: 'संयत। सही पर +2, गलत पर 0।',
    confBold: 'साहसिक', confBoldDesc: 'दृढ़। सही पर +3, गलत पर −1।',
    confCalled: 'निश्चित', confCalledDesc: 'पूरा भरोसा। सही पर +4, गलत पर −3।',
    beatDone: 'बीट फ़ाइल हुई', beatPoints: 'बीट के अंक',
    clipsTitle: 'कतरनें', clipsSub: 'आपके हर उत्तर की कतरन, काटकर सहेजी गई। देखिए; चूके हुए प्रश्नों का अभ्यास कीजिए।',
    filterAll: 'सभी डेस्क', recallBtn: 'स्मरण अभ्यास', emptyClips: 'अभी कोई कतरन नहीं। कोई प्रश्न उत्तर दीजिए — वह यहाँ कटकर सहेजा जाएगा।',
    clipYour: 'आपकी पसंद', clipAnswer: 'अभिलेख पर',
    recallTitle: 'स्मरण अभ्यास', recallSub: 'पाँच कतरनें, बिना समय-सीमा। हर सही समीक्षा पर +6 जागरूकता।',
    recallDone: 'अभ्यास पूर्ण', recallScore: 'सही स्मरण',
    cardTitle: 'प्रेस कार्ड', standing: 'स्थिति', ratingsTitle: 'डेस्क रेटिंग', weekRec: 'इस सप्ताह',
    stSittings: 'पूर्ण द्वंद्व', stPrevailed: 'विजय', stDrawn: 'बराबर', stXP: 'जागरूकता (XP)',
    fName: 'पाठक', fTitle: 'उपाधि', fCoins: 'सिक्के (काल्पनिक)', fLeague: 'लीग', fSince: 'पठन आरंभ',
    editName: 'बदलिए', saveName: 'सहेजिए',
    certBtn: 'प्रेस कार्ड छापिए', shareBtn: 'व्हाट्सऐप पर साझा करें', copyBtn: 'साझा-पाठ नक़ल करें', copied: 'क्लिपबोर्ड पर नक़ल हुआ।',
    sound: 'ध्वनि', soundHint: 'प्रकटन पर टेलीटाइप टिक और फ़ाइलिंग पर प्रेस की थाप। डिफ़ॉल्ट रूप से बंद।',
    lang: 'Language / भाषा',
    toNext: 'जागरूकता शेष',
    coinsNote: 'सिक्के काल्पनिक हैं। न पैसा, न इनाम, न कुछ खरीदने को।',
    scoringTitle: 'अंक-तालिका',
    scoringBody: 'सही उत्तर 20 · प्रयास 5 · द्वंद्व विजय 50 · बराबर 25 · बीट पूर्ण 40 · समीक्षा 6। समयबद्ध द्वंद्व में गति अधिकतम 100 में से 10 अंक देती है; आराम मोड में कुछ नहीं।',
    ob1Title: 'आपका पहला प्रश्न',
    obHint1: 'जो उत्तर सही लगे, उसे छुइए — प्रयास की कोई क़ीमत नहीं। वायर बॉट साथ उत्तर दे रहा है।',
    obLockHint: 'मन बदला? दूसरी पंक्ति छुइए। केवल “उत्तर फ़ाइल करें” ही अंतिम है।',
    obSourceTitle: 'हर उत्तर अपना स्रोत दिखाता है',
    obSourceBody: 'हर उत्तर के बाद डेस्क अपनी कतरन दिखाता है — संस्था, अभिलेख, और जाँच की कड़ी। यहाँ विश्वसनीयता ही सुविधा है।',
    obScoreTitle: 'सिक्के, जागरूकता और आपकी साप्ताहिक तालिका',
    obScoreBody: 'सही उत्तर जागरूकता (XP) बढ़ाते हैं और उपाधि देते हैं: स्ट्रिंगर, कॉरस्पॉन्डेंट, एडिटर, एडिटर-इन-चीफ़। सिक्के काल्पनिक हैं — 1,000 से शुरुआत, रोज़ 30 मिलते हैं; केवल मैत्रीपूर्ण द्वंद्व में लगते हैं। लीग आपकी साप्ताहिक तालिका है: तीस पाठक, जागरूकता के क्रम में, हर सोमवार नई।',
    obDone: 'डेस्क पर अपनी सीट लीजिए',
    practiceLabel: 'अभ्यास प्रश्न',
    tickerAware: 'जागरूकता', tickerLeague: 'लीग', tickerCoins: 'सिक्के', tickerToday: 'आज',
    grantNote: 'दैनिक अनुदान +30 सिक्के जमा',
    duelNoteWin: 'डेस्क डिस्पैच: आप वायर बॉट पर {a}–{b} विजयी',
    duelNoteLoss: 'डेस्क डिस्पैच: वायर बॉट {b}–{a} आगे',
    duelNoteDraw: 'डेस्क डिस्पैच: बराबरी {a}–{b}',
    beatNote: 'बीट फ़ाइल: {d} पूर्ण +40 जागरूकता',
    rankNote: 'लीग: #{r} ▲{m}', rankNoteDown: 'लीग: #{r} ▼{m}', rankNoteFlat: 'लीग: #{r} —',
    sharePre: 'LEDGER — राजनीति और धन डेस्क: ',
    shareTail: ' इस अभिलेख को चुनौती दीजिए।',
    todayIs: 'आज का डेस्क',
    verdictFile: 'लेजर वायर · फ़ाइल्ड ',
    practiceNo: 'सं. P-001'
  }
};
function t(key) {
  var dict = STR[S.lang] || STR.en;
  return dict[key] != null ? dict[key] : (STR.en[key] != null ? STR.en[key] : key);
}
function applyChrome() {
  document.documentElement.lang = S.lang === 'hi' ? 'hi' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
  var wn = $('#wallet-num'); if (wn) wn.textContent = fmt(S.coins);
}

/* ---------------- Sound (WebAudio, off by default) ---------------- */
var AC = null;
function audioCtx() {
  if (!S.sound) return null;
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function teletypeTick() { /* two dry keys of the wire machine — on reveal */
  var ac = audioCtx(); if (!ac) return;
  var t0 = ac.currentTime;
  [0, 0.07].forEach(function (off, i) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = i ? 1900 : 1500;
    g.gain.setValueAtTime(0.0001, t0 + off);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + off + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.045);
    o.connect(g).connect(ac.destination); o.start(t0 + off); o.stop(t0 + off + 0.05);
  });
}
function pressKerchunk() { /* the press locks a plate — on filing an answer */
  var ac = audioCtx(); if (!ac) return;
  var t0 = ac.currentTime;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(82, t0);
  o.frequency.exponentialRampToValueAtTime(44, t0 + 0.1);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.45, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + 0.26);
  var nb = ac.createBuffer(1, ac.sampleRate * 0.07, ac.sampleRate), d = nb.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  var ns = ac.createBufferSource(); ns.buffer = nb;
  var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
  var ng = ac.createGain(); ng.gain.setValueAtTime(0.22, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
  ns.connect(lp).connect(ng).connect(ac.destination); ns.start(t0);
}

/* ---------------- Red stamp (LATE EDITION family, rotated −4°) ---------------- */
function makeStamp(text, size) {
  var s = el('span', 'stamp stamped' + (size === 'big' ? ' big' : size === 'small' ? ' small' : ''), text);
  return s;
}
function pressStamp(host, text, size, silent) {
  host.innerHTML = '';
  host.appendChild(makeStamp(text, size));
  if (!silent) pressKerchunk();
}

/* ---------------- Awareness ticker ---------------- */
function tickerText(extra) {
  var rank = S.weekKey ? playerRank() : 30;
  var move = S.prevRank == null ? 0 : S.prevRank - rank;
  var desk = DESKS[Math.floor(Date.now() / DAY_MS) % DESKS.length];
  var parts = [];
  if (extra) parts.push(extra);
  parts.push(t('tickerAware') + ' ' + fmt(S.xp));
  parts.push(t('tickerLeague') + ' #' + fmt(rank) + (move > 0 ? ' ▲' + fmt(move) : move < 0 ? ' ▼' + fmt(-move) : ' —'));
  parts.push(t('tickerCoins') + ' ' + fmt(S.coins));
  parts.push(t('tickerToday') + ': ' + t(desk.nameK).toUpperCase());
  return parts.join('  ·  ');
}
var pendingTickerNote = null;
function updateTicker(extra) {
  var inner = $('#ticker-inner');
  if (!inner) return;
  if (extra == null && pendingTickerNote) { extra = pendingTickerNote; pendingTickerNote = null; }
  inner.textContent = tickerText(extra);
  inner.classList.remove('run');
  void inner.offsetWidth; /* restart the single pass */
  inner.classList.add('run');
}

/* ---------------- Router ---------------- */
var ROUTES = {};
var currentRoute = null;
var pendingOpts = null;
function nav(hash, opts) {
  opts = opts || {};
  var target = '#' + hash;
  if (location.hash === target) { render(hash, opts); return; }
  pendingOpts = opts;
  location.hash = target;
}
function routeFromHash() {
  var h = (location.hash || '').replace(/^#\/?/, '');
  return h || (S.onboarded ? 'home' : 'onboarding');
}
function render(route, opts) {
  if (!S.onboarded && route !== 'onboarding') route = 'onboarding';
  var fn = ROUTES[route] || ROUTES.home;
  currentRoute = route;
  var stage = $('#screen');
  var old = stage.firstElementChild;
  var fresh = el('div', 'screen-body');
  stage.appendChild(fresh);
  fn(fresh, opts || {});
  if (old) {
    if (opts && opts.slide) {
      fresh.classList.add('screen-enter-right');
      old.classList.add('screen-exit-left');
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 400);
    } else {
      stage.removeChild(old);
    }
  }
  document.querySelectorAll('.nav-btn[data-nav]').forEach(function (b) {
    if (b.getAttribute('data-nav') === route) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  applyChrome();
  updateTicker();
}
window.addEventListener('hashchange', function () {
  var o = pendingOpts; pendingOpts = null;
  teardownSession();
  render(routeFromHash(), o || {});
});

/* ---------------- Session teardown (timers etc.) ---------------- */
var activeTimers = [];
function later(fn, ms) { var id = setTimeout(fn, ms); activeTimers.push(id); return id; }
function every(fn, ms) { var id = setInterval(fn, ms); activeTimers.push(id); return id; }
function teardownSession() {
  activeTimers.forEach(function (id) { clearTimeout(id); clearInterval(id); });
  activeTimers = [];
}

/* ---------------- Shared builders ---------------- */
function sectionHead(parent, labelText, titleText, subText) {
  var wrap = el('div', 'section-head');
  wrap.appendChild(el('p', 'label', labelText));
  var h = el('h2', 'track-in', titleText);
  wrap.appendChild(h);
  if (subText) wrap.appendChild(el('p', 'sub', subText));
  parent.appendChild(wrap);
  return wrap;
}
function clippingHead(card, q, labelOverride) {
  var top = el('div', 'card-top');
  var dl = el('span', 'dateline', labelOverride || (q.era + ' · ' + dayKey()));
  top.appendChild(dl);
  var desk = deskOf(q);
  top.appendChild(el('span', 'desk-tag ' + desk.id, t(desk.nameK)));
  card.appendChild(top);
  return top;
}
function sourceCard(parent, q) {
  var card = el('div', 'card source-card');
  var p = el('p', 'src-line');
  p.appendChild(el('strong', null, t('source') + ' '));
  p.appendChild(document.createTextNode(q.source));
  card.appendChild(p);
  card.appendChild(el('p', 'src-note', q.note));
  if (q.sourceUrl) {
    var link = el('a', 'src-verify', t('verifySource'));
    link.href = q.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    card.appendChild(link);
  }
  parent.appendChild(card);
  return card;
}
function toggleSwitch(label, hint, get, set) {
  var bar = el('div', 'relaxed-bar');
  var copy = el('div', 'relaxed-copy');
  copy.appendChild(el('p', 'label', label));
  if (hint) copy.appendChild(el('p', 'hint', hint));
  bar.appendChild(copy);
  var tog = el('button', 'toggle');
  tog.type = 'button';
  tog.setAttribute('role', 'switch');
  tog.setAttribute('aria-checked', String(get()));
  tog.setAttribute('aria-label', label);
  tog.addEventListener('click', function () {
    set(!get());
    tog.setAttribute('aria-checked', String(get()));
  });
  bar.appendChild(tog);
  return bar;
}

/* ==========================================================================
   SCREEN 0 — ONBOARDING (3 steps: answer → source byline → scoring/coins/league)
   ========================================================================== */
var OB = { step: 0, q: null, botDone: false, picked: -1, locked: false };

ROUTES.onboarding = function (root) {
  OB = { step: OB.step || 1, q: OB.q, botDone: false, picked: -1, locked: false };
  if (OB.step === 1 && !OB.q) {
    OB.q = BANK.filter(function (q) { return q.difficulty <= 2; })[0] || BANK[0];
  }
  drawOnboarding(root);
};

function drawOnboarding(root) {
  root.innerHTML = '';
  var wrap = el('div', 'onboard');

  if (OB.step === 1) {
    var q = OB.q;
    var card = el('div', 'card card-break');
    card.appendChild(el('p', 'onboard-step-no', t('practiceLabel') + ' · 1 / 3'));
    card.appendChild(el('h1', null, t('ob1Title')));
    clippingHead(card, q, t('practiceNo') + ' · ' + dayKey());
    card.appendChild(el('p', 'q-text', q.q));
    card.appendChild(el('p', 'hint-line', OB.locked ? t('obLockHint') : t('obHint1')));

    var opts = el('ol', 'options');
    q.options.forEach(function (opt, i) {
      var li = el('li', 'option-row');
      var btn = el('button', 'option-btn');
      btn.type = 'button';
      btn.appendChild(el('span', 'option-num', CIRCLED[i]));
      btn.appendChild(el('span', 'option-text', opt));
      btn.appendChild(el('span', 'option-state', ''));
      btn.addEventListener('click', function () {
        if (OB.locked) return;
        OB.picked = i;
        opts.querySelectorAll('.option-btn').forEach(function (b2, j) {
          b2.classList.toggle('selected', j === OB.picked);
        });
        lockBtn.disabled = false;
      });
      li.appendChild(btn);
      opts.appendChild(li);
    });
    card.appendChild(opts);

    var lockRow = el('div', 'lock-row');
    var lockBtn = el('button', 'btn btn-red', t('lock'));
    lockBtn.disabled = true;
    lockRow.appendChild(lockBtn);
    lockRow.appendChild(el('span', 'hint', t('lockHint')));
    card.appendChild(lockRow);

    /* the Wire Bot answers alongside */
    var botDelay = 1500 + Math.random() * 2500;
    OB.botTimer = later(function () { OB.botDone = true; maybeOnboardReveal(card, opts); }, botDelay);
    lockBtn.addEventListener('click', function () {
      if (OB.picked < 0 || OB.locked) return;
      OB.locked = true;
      lockBtn.disabled = true;
      opts.querySelectorAll('.option-btn').forEach(function (b3) { b3.disabled = true; });
      pressKerchunk();
      maybeOnboardReveal(card, opts);
    });
    wrap.appendChild(card);
  }

  if (OB.step === 2) {
    var card2 = el('div', 'card');
    card2.appendChild(el('p', 'onboard-step-no', t('practiceLabel') + ' · 2 / 3'));
    card2.appendChild(el('h1', null, t('obSourceTitle')));
    card2.appendChild(el('p', null, t('obSourceBody')));
    var b2 = el('button', 'btn btn-red', t('next'));
    b2.addEventListener('click', function () { OB.step = 3; render('onboarding'); });
    card2.appendChild(el('div', 'actions')).appendChild(b2);
    wrap.appendChild(card2);
  }

  if (OB.step === 3) {
    var card3 = el('div', 'card');
    card3.appendChild(el('p', 'onboard-step-no', t('practiceLabel') + ' · 3 / 3'));
    card3.appendChild(el('h1', null, t('obScoreTitle')));
    card3.appendChild(el('p', null, t('obScoreBody')));
    var b3 = el('button', 'btn btn-red', t('obDone'));
    b3.addEventListener('click', function () {
      S.onboarded = true; save();
      OB.step = 1;
      nav('/home');
    });
    card3.appendChild(el('div', 'actions')).appendChild(b3);
    wrap.appendChild(card3);
  }

  root.appendChild(wrap);
}

function maybeOnboardReveal(card, opts) {
  if (!OB.locked || !OB.botDone || card.dataset.revealed) return;
  card.dataset.revealed = '1';
  var q = OB.q;
  var playerCorrect = OB.picked === q.answerIndex;
  opts.querySelectorAll('.option-btn').forEach(function (b, i) {
    b.classList.remove('selected');
    if (i === q.answerIndex) {
      b.classList.add('correct');
      b.querySelector('.option-state').textContent = t('correct');
      var slot = el('span', 'stamp-slot');
      b.appendChild(slot);
      pressStamp(slot, t('verified'), 'small', true);
    } else if (i === OB.picked) {
      b.classList.add('wrong');
      b.querySelector('.option-state').textContent = t('incorrect');
    }
  });
  teletypeTick();
  addXP(playerCorrect ? 20 : 5);
  fileClipping(q, OB.picked);
  S.sittings += 1; markToday();
  sourceCard(card, q);
  announce(playerCorrect ? t('correct') : t('incorrect'));
  var b = el('button', 'btn btn-red', t('next'));
  b.addEventListener('click', function () { OB.step = 2; render('onboarding'); });
  card.appendChild(el('div', 'actions')).appendChild(b);
}

/* ==========================================================================
   SCREEN 1 — HOME · Today's Edition
   ========================================================================== */
ROUTES.home = function (root) {
  var mh = el('section', 'masthead');
  mh.setAttribute('aria-label', 'Ledger');
  mh.appendChild(el('h1', 'masthead-word', S.lang === 'hi' ? 'लेजर' : 'LEDGER'));
  mh.appendChild(el('p', 'masthead-deva', 'लेजर'));
  mh.appendChild(el('p', 'masthead-tag', t('tagline')));
  mh.appendChild(el('p', 'masthead-meta', t('volLine') + dayKey()));
  var hr = el('hr', 'rule-double'); hr.setAttribute('aria-hidden', 'true');
  mh.appendChild(hr);
  root.appendChild(mh);

  var grid = el('div', 'front-desk-grid');

  /* Today's lead — rotating, date-seeded, as a news clipping */
  var desk = DESKS[Math.floor(Date.now() / DAY_MS) % DESKS.length];
  var deskPool = deskQuestions(desk.id);
  var todayQ = deskPool[Math.floor(Date.now() / DAY_MS) % deskPool.length];
  var card = el('div', 'card card-break');
  clippingHead(card, todayQ, t('leadStory').toUpperCase() + ' · ' + dayKey());
  card.appendChild(el('p', 'q-tease dropcap', todayQ.q));
  card.appendChild(el('p', 'small muted', t(desk.nameK) + ' · ' + t('leadHint')));
  var enter = el('button', 'btn btn-red', t('openLead'));
  enter.addEventListener('click', function () {
    startDuel({ mode: 'single', opponent: 'wire', pool: [todayQ], stake: 0 });
  });
  card.appendChild(enter);
  grid.appendChild(card);

  /* League snapshot: top 5 + the player's row */
  var snapWrap = el('div');
  snapWrap.appendChild(el('p', 'label', t('leagueSnapshot') + ' — ' + TIERS[S.tier]));
  var snap = el('table', 'sheet snapshot-table');
  var sh = el('thead'); var shr = el('tr');
  [t('colRank'), t('colReader'), t('colAware')].forEach(function (h) { shr.appendChild(el('th', null, h)); });
  sh.appendChild(shr); snap.appendChild(sh);
  var sb = el('tbody');
  var rows = leagueRows(S.weekKey, weekDayIndex(), S.weekXp, S.tier);
  var me = rows.filter(function (r) { return r.player; })[0];
  rows.slice(0, 5).concat(me.rank <= 5 ? [] : [me]).forEach(function (r) {
    var tr = el('tr', r.player ? 'me' : '');
    tr.appendChild(el('td', 'rank', fmt(r.rank)));
    var nm = el('td', null, r.player ? r.name + ' (' + t('youTag') + ')' : r.name);
    tr.appendChild(nm);
    tr.appendChild(el('td', 'num', fmt(r.awareness)));
    sb.appendChild(tr);
  });
  snap.appendChild(sb);
  snapWrap.appendChild(snap);
  var vl = el('button', 'btn btn-quiet', t('viewLeague'));
  vl.addEventListener('click', function () { nav('/league'); });
  snapWrap.appendChild(vl);
  grid.appendChild(snapWrap);
  root.appendChild(grid);

  /* Desk index */
  var idxWrap = el('div', 'stack');
  idxWrap.appendChild(el('p', 'label', t('deskIndex')));
  idxWrap.appendChild(el('p', 'small muted', t('deskHint')));
  var ul = el('ul', 'ledger');
  DESKS.forEach(function (d, i) {
    var li = el('li', 'ledger-row');
    var btn = el('button', 'ledger-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'ledger-idx', String(i + 1).padStart(2, '0')));
    btn.appendChild(el('span', 'ledger-name', t(d.nameK)));
    btn.appendChild(el('span', 'ledger-count', fmt(deskQuestions(d.id).length) + ' · 6Q'));
    btn.addEventListener('click', function () { startBeat(d.id); });
    li.appendChild(btn);
    ul.appendChild(li);
  });
  idxWrap.appendChild(ul);
  root.appendChild(idxWrap);
};

/* ==========================================================================
   SCREEN 2 — MODE SELECT (relaxed, opponent, stakes)
   ========================================================================== */
var MODES = [
  { id: 'single', nameK: 'modeSingle', rulesK: 'modeSingleRules' },
  { id: 'bo3',    nameK: 'modeBo3',    rulesK: 'modeBo3Rules' },
  { id: 'full',   nameK: 'modeFull',   rulesK: 'modeFullRules' }
];
var modeChoice = { opponent: 'wire', stake: 0 };

ROUTES.modes = function (root) {
  sectionHead(root, t('navDuels'), t('modesTitle'), t('modesSub'));

  root.appendChild(toggleSwitch(t('relaxed'), t('relaxedHint'),
    function () { return S.relaxed; },
    function (v) { S.relaxed = v; save(); }));

  /* Opponent */
  var ow = el('div', 'stack');
  ow.appendChild(el('p', 'label', t('opponent')));
  var orow = el('div', 'opponent-row actions');
  [['wire', t('oppWire')], ['table', t('oppTable')]].forEach(function (pair) {
    var b = el('button', 'btn', pair[1]);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(modeChoice.opponent === pair[0]));
    b.addEventListener('click', function () {
      modeChoice.opponent = pair[0];
      orow.querySelectorAll('.btn').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      drawStakes(); /* stakes only exist across the desk */
    });
    orow.appendChild(b);
  });
  ow.appendChild(orow);
  root.appendChild(ow);

  /* Stake selector — pass-and-play only; the Wire Bot plays free */
  var sw = el('div', 'stack');
  sw.appendChild(el('p', 'label', t('stakeLabel')));
  var stakeNote = el('p', 'hint', '');
  var srow = el('div', 'stake-row');
  sw.appendChild(srow);
  sw.appendChild(stakeNote);
  root.appendChild(sw);
  function drawStakes() {
    var isBot = modeChoice.opponent === 'wire';
    if (isBot) modeChoice.stake = 0;
    srow.innerHTML = '';
    STAKES.forEach(function (st) {
      var b = el('button', 'stake-btn', fmt(st));
      b.type = 'button';
      b.disabled = isBot;
      b.setAttribute('aria-pressed', String(modeChoice.stake === st));
      b.addEventListener('click', function () {
        modeChoice.stake = st;
        srow.querySelectorAll('.stake-btn').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        drawStakes();
      });
      srow.appendChild(b);
    });
    stakeNote.textContent = isBot ? t('stakeBotNote')
      : (modeChoice.stake > 0
          ? t('stakeHint') + ' ' + t('coins') + ': ' + fmt(S.coins) + ' · ' +
            (t('coinSettleWin').replace('{s}', fmt(modeChoice.stake))
              .replace('{p}', fmt(prizeFor(modeChoice.stake))).replace('{f}', fmt(feeFor(modeChoice.stake))))
          : t('stakeHint'));
  }
  drawStakes();

  /* Mode ledger */
  var ul = el('ul', 'mode-list');
  MODES.forEach(function (m) {
    var li = el('li', 'mode-row');
    var info = el('div');
    info.appendChild(el('p', 'mode-name', t(m.nameK)));
    info.appendChild(el('p', 'mode-rules', t(m.rulesK)));
    li.appendChild(info);
    var b = el('button', 'btn' + (m.id === 'single' ? ' btn-red' : ''), t('begin'));
    b.type = 'button';
    b.addEventListener('click', function () {
      startDuel({ mode: m.id, opponent: modeChoice.opponent, stake: modeChoice.opponent === 'table' ? modeChoice.stake : 0 });
    });
    li.appendChild(b);
    ul.appendChild(li);
  });
  root.appendChild(ul);

  /* Scoring table — published, transparent */
  var sc = el('div', 'stack');
  sc.appendChild(el('p', 'label', t('scoringTitle')));
  sc.appendChild(el('p', 'small muted', t('scoringBody')));
  sc.appendChild(el('p', 'small muted', t('coinsNote')));
  root.appendChild(sc);

  var back = el('button', 'btn btn-quiet', t('back'));
  back.addEventListener('click', function () { nav('/home'); });
  root.appendChild(el('div', 'actions')).appendChild(back);
};

/* ==========================================================================
   SCREEN 3 — DUEL · The Desk
   ========================================================================== */
var D = null; /* active duel session */

function startDuel(opts) {
  var counts = { single: 1, bo3: 3, full: 5 };
  var n = counts[opts.mode] || 1;
  var pool = opts.pool ? opts.pool.slice() : shuffle(BANK).slice(0, n);
  if (pool.length < n) {
    var rest = shuffle(BANK.filter(function (q) { return pool.indexOf(q) < 0; }));
    pool = pool.concat(rest.slice(0, n - pool.length));
  }
  var stake = opts.opponent === 'table' ? (opts.stake || 0) : 0; /* bots never play for coins */
  if (stake > 0) {
    if (S.coins < 2 * stake) { stake = 0; } /* insufficient: duel proceeds free */
    else { S.coins -= 2 * stake; save(); }   /* both seats escrowed from this desk's wallet */
  }
  D = {
    mode: opts.mode,
    opponent: opts.opponent || 'wire',
    stake: stake,
    questions: pool,
    round: 0,
    rounds: [],
    wins: { a: 0, b: 0 },
    pts: { a: 0, b: 0 },
    timerMs: opts.mode === 'single' ? 10000 : (opts.mode === 'bo3' ? 7000 : 5000),
    relaxed: !!S.relaxed,
    xp: 0
  };
  nav('/duel');
}

function duelOver() {
  if (!D) return true;
  if (D.mode === 'single') return D.round >= 1;
  if (D.mode === 'bo3') return D.wins.a >= 2 || D.wins.b >= 2 || D.round >= 3;
  return D.round >= 5;
}

ROUTES.duel = function (root) {
  if (!D) { nav('/modes'); return; }
  var modeName = t(D.mode === 'single' ? 'modeSingle' : D.mode === 'bo3' ? 'modeBo3' : 'modeFull');

  var head = el('div', 'bench-head');
  head.appendChild(el('p', 'label', modeName + ' · ' + (D.relaxed ? t('relaxed') : fmt(D.timerMs / 1000) + 's') +
    (D.stake > 0 ? ' · ' + t('coins') + ' ' + fmt(D.stake) : '')));
  var quit = el('button', 'btn btn-quiet', t('quit'));
  quit.addEventListener('click', function () {
    teardownSession();
    if (D.stake > 0) { S.coins += 2 * D.stake; save(); } /* cancel: full refund */
    D = null; nav('/modes');
  });
  head.appendChild(quit);
  root.appendChild(head);

  var bench = el('div', 'bench');
  var sideA = benchSide(D.opponent === 'table' ? t('seatA') : t('you'), 'READER OF RECORD');
  bench.appendChild(sideA.wrap);
  bench.appendChild(el('div', 'bench-spine'));
  var sideB = benchSide(D.opponent === 'table' ? t('seatB') : t('wireBot'), D.opponent === 'table' ? 'SECOND READER' : 'HOUSE MACHINE · FREE');
  bench.appendChild(sideB.wrap);
  root.appendChild(bench);

  var zone = el('div', 'question-zone');
  root.appendChild(zone);
  D.ui = { sideA: sideA, sideB: sideB, zone: zone };
  runRound();
};

function benchSide(name, plateSub) {
  var wrap = el('div', 'bench-side');
  var np = el('div', 'nameplate');
  np.appendChild(document.createTextNode(name));
  np.appendChild(el('span', 'plate-sub', plateSub));
  wrap.appendChild(np);
  var fig = el('div', 'figure', '0');
  wrap.appendChild(fig);
  var ticks = el('div', 'round-ticks');
  wrap.appendChild(ticks);
  var mark = el('div', 'opp-mark mono', '');
  wrap.appendChild(mark);
  return { wrap: wrap, fig: fig, ticks: ticks, mark: mark };
}

function runRound() {
  if (duelOver()) { finishDuel(); return; }
  var q = D.questions[D.round % D.questions.length];
  var R = {
    q: q, aSel: -1, bSel: -1, aTime: null, bTime: null,
    aLocked: false, bLocked: false, botDone: false, expired: false,
    revealed: false, phase: 'a'
  };
  D.cur = R;
  drawRound();
}

function drawRound() {
  var R = D.cur, zone = D.ui.zone;
  zone.innerHTML = '';
  var t0 = performance.now();

  /* Hairline timer (hidden in Relaxed Mode and in table mode) */
  if (!D.relaxed && D.opponent !== 'table') {
    var track = el('div', 'timer-track');
    var line = el('div', 'timer-line drain');
    line.style.setProperty('--dur-timer', D.timerMs + 'ms');
    track.appendChild(line);
    var figs = el('span', 'timer-figures');
    figs.setAttribute('aria-hidden', 'true');
    track.appendChild(figs);
    zone.appendChild(track);
    later(function () {
      line.classList.add('urgent');
      var left = 5;
      figs.textContent = String(left);
      every(function () { left -= 1; if (left >= 0) figs.textContent = String(left); }, 1000);
    }, Math.max(0, D.timerMs - 5000));
    later(function () {
      R.expired = true;
      if (!R.aLocked) maybeResolve();
    }, D.timerMs);
  } else {
    zone.appendChild(el('p', 'timer-relaxed', D.relaxed ? t('relaxed') + ' — · —' : '· — ·'));
  }

  /* Question clipping — dateline, desk tag, headline question */
  var card = el('div', 'card q-card');
  clippingHead(card, R.q);
  card.appendChild(el('p', 'q-text', R.q.q));

  var opts = el('ol', 'options');
  R.q.options.forEach(function (opt, i) {
    var li = el('li', 'option-row deal');
    li.style.animationDelay = (i * 60) + 'ms';
    var btn = el('button', 'option-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'option-num', CIRCLED[i]));
    btn.appendChild(el('span', 'option-text', opt));
    btn.appendChild(el('span', 'option-state', ''));
    btn.addEventListener('click', function () { onPick(i); });
    li.appendChild(btn);
    opts.appendChild(li);
  });
  card.appendChild(opts);

  var lockRow = el('div', 'lock-row');
  var lockBtn = el('button', 'btn btn-red', t('lock'));
  lockBtn.disabled = true;
  lockBtn.addEventListener('click', onLock);
  lockRow.appendChild(lockBtn);
  lockRow.appendChild(el('span', 'hint', t('lockHint')));
  card.appendChild(lockRow);
  zone.appendChild(card);
  R.ui = { card: card, opts: opts, lockBtn: lockBtn, t0: t0 };

  /* Opponent behaviour */
  D.ui.sideA.mark.textContent = '';
  if (D.opponent === 'wire') {
    D.ui.sideB.mark.textContent = '· · ·';
    var delay = D.relaxed
      ? 1500 + Math.random() * 2500                              /* relaxed: 1.5–4s */
      : 1000 + Math.random() * Math.max(1, D.timerMs - 1500);    /* timed: 1s .. timer−0.5s */
    R.bTime = Math.round(delay);
    R.botCorrect = Math.random() < 0.25;                         /* the Wire Bot: 25% correct */
    R.bSel = R.botCorrect ? R.q.answerIndex : pickWrong(R.q);
    later(function () { R.botDone = true; R.bLocked = true; maybeResolve(); }, delay);
  } else {
    D.ui.sideB.mark.textContent = '';
    if (R.phase === 'a') D.ui.sideA.mark.textContent = '· · ·';
  }

  function onPick(i) {
    var seat = D.opponent === 'table' && R.phase === 'b' ? 'b' : 'a';
    if ((seat === 'a' && R.aLocked) || (seat === 'b' && R.bLocked) || R.revealed) return;
    if (seat === 'a') R.aSel = i; else R.bSel = i;
    R.ui.opts.querySelectorAll('.option-btn').forEach(function (b, j) {
      b.classList.toggle('selected', j === i);
    });
    R.ui.lockBtn.disabled = false;
  }
  function onLock() {
    var seat = D.opponent === 'table' && R.phase === 'b' ? 'b' : 'a';
    if (seat === 'a') {
      if (R.aSel < 0 || R.aLocked) return;
      R.aLocked = true;
      R.aTime = Math.round(performance.now() - R.ui.t0);
    } else {
      if (R.bSel < 0 || R.bLocked) return;
      R.bLocked = true;
      R.bTime = Math.round(performance.now() - R.ui.t0);
    }
    R.ui.lockBtn.disabled = true;
    R.ui.opts.querySelectorAll('.option-btn').forEach(function (b) { b.disabled = true; });
    pressKerchunk(); /* the press locks the plate */

    if (D.opponent === 'table' && R.phase === 'a') {
      R.phase = 'shield';
      drawShield();
      return;
    }
    maybeResolve();
  }
}

function drawShield() {
  var zone = D.ui.zone;
  zone.innerHTML = '';
  var sh = el('div', 'shield');
  sh.appendChild(el('h2', null, t('passDevice')));
  sh.appendChild(el('p', null, t('passHint')));
  var b = el('button', 'btn', t('seatReady'));
  b.addEventListener('click', function () {
    D.cur.phase = 'b';
    D.ui.sideA.mark.textContent = '✓ filed';
    drawRoundSeatB();
  });
  sh.appendChild(el('div', 'actions')).appendChild(b);
  zone.appendChild(sh);
}

function drawRoundSeatB() {
  /* same question, Seat B answers — no timer in table mode */
  var R = D.cur, zone = D.ui.zone;
  zone.innerHTML = '';
  zone.appendChild(el('p', 'timer-relaxed', t('seatB') + ' · — ·'));
  var card = el('div', 'card q-card');
  clippingHead(card, R.q);
  card.appendChild(el('p', 'q-text', R.q.q));
  var opts = el('ol', 'options');
  R.q.options.forEach(function (opt, i) {
    var li = el('li', 'option-row deal');
    li.style.animationDelay = (i * 60) + 'ms';
    var btn = el('button', 'option-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'option-num', CIRCLED[i]));
    btn.appendChild(el('span', 'option-text', opt));
    btn.appendChild(el('span', 'option-state', ''));
    btn.addEventListener('click', function () {
      if (R.bLocked) return;
      R.bSel = i;
      opts.querySelectorAll('.option-btn').forEach(function (b, j) { b.classList.toggle('selected', j === i); });
      lockBtn.disabled = false;
    });
    li.appendChild(btn);
    opts.appendChild(li);
  });
  card.appendChild(opts);
  var lockRow = el('div', 'lock-row');
  var lockBtn = el('button', 'btn btn-red', t('lock'));
  lockBtn.disabled = true;
  lockBtn.addEventListener('click', function () {
    if (R.bSel < 0 || R.bLocked) return;
    R.bLocked = true;
    R.bTime = Math.round(performance.now() - R.t0b);
    lockBtn.disabled = true;
    opts.querySelectorAll('.option-btn').forEach(function (b) { b.disabled = true; });
    pressKerchunk();
    maybeResolve();
  });
  lockRow.appendChild(lockBtn);
  lockRow.appendChild(el('span', 'hint', t('lockHint')));
  card.appendChild(lockRow);
  zone.appendChild(card);
  R.t0b = performance.now();
  R.ui = { card: card, opts: opts, lockBtn: lockBtn };
}

function pickWrong(q) {
  var wrong = [];
  q.options.forEach(function (_, i) { if (i !== q.answerIndex) wrong.push(i); });
  return wrong[Math.floor(Math.random() * wrong.length)];
}

function maybeResolve() {
  var R = D.cur;
  if (R.revealed) return;
  var aReady = R.aLocked || R.expired;
  var bReady = R.bLocked || (D.opponent === 'wire' && R.botDone) || R.expired;
  if (D.opponent === 'table') bReady = R.bLocked;
  if (!aReady || !bReady) return;
  if (D.opponent === 'table' && R.phase !== 'b') return;
  resolveRound();
}

function adjudicate(aCorrect, bCorrect, aTime, bTime, durationMs, relaxed) {
  if (aCorrect && !bCorrect) return 'a';
  if (!aCorrect && bCorrect) return 'b';
  if (!aCorrect && !bCorrect) return 'draw';
  if (relaxed) return 'draw'; /* speed ignored entirely */
  if (Math.abs(aTime - bTime) <= 150) return 'draw'; /* 150ms draw window */
  return aTime < bTime ? 'a' : 'b';
}

function resolveRound() {
  var R = D.cur;
  R.revealed = true;
  teardownSession();

  var aCorrect = R.aSel === R.q.answerIndex;
  var bCorrect = R.bSel === R.q.answerIndex;
  if (R.aSel < 0) aCorrect = false;
  if (R.bSel < 0) bCorrect = false;
  var aTime = R.aTime == null ? Infinity : R.aTime;
  var bTime = R.bTime == null ? Infinity : R.bTime;
  var winner = adjudicate(aCorrect, bCorrect, aTime, bTime, D.timerMs, D.relaxed);

  /* round value 100; speed bonus ≤10% of round value; off in Relaxed Mode */
  var aPts = 0, bPts = 0;
  if (winner === 'a' || winner === 'b') {
    var winTime = winner === 'a' ? aTime : bTime;
    var bonus = 0;
    if (!D.relaxed && isFinite(winTime)) {
      bonus = Math.max(0, Math.min(10, Math.round(10 * (1 - winTime / D.timerMs))));
    }
    if (winner === 'a') aPts = 100 + bonus; else bPts = 100 + bonus;
  }
  if (winner === 'a') D.wins.a += 1;
  if (winner === 'b') D.wins.b += 1;
  D.pts.a += aPts; D.pts.b += bPts;

  R.aCorrect = aCorrect; R.bCorrect = bCorrect;
  R.winner = winner; R.aPts = aPts; R.bPts = bPts;
  D.rounds.push(R);
  D.round += 1;

  /* XP + clipping + desk rating: seat A is the account holder */
  D.xp += aCorrect ? 20 : 5;
  fileClipping(R.q, R.aSel);
  rateRound(deskOf(R.q).id, winner === 'a' ? 1 : winner === 'draw' ? 0.5 : 0);

  revealCard();
  updateBench();
  teletypeTick();
  announce((aCorrect ? t('correct') : t('incorrect')) + '. ' + R.q.source);
}

function revealCard() {
  var R = D.cur;
  var card, opts;
  if (D.opponent === 'table' && R.phase !== 'a') {
    /* re-render the settled card for both seats to read together */
    var zone = D.ui.zone;
    zone.innerHTML = '';
    card = el('div', 'card q-card');
    clippingHead(card, R.q);
    card.appendChild(el('p', 'q-text', R.q.q));
    opts = el('ol', 'options');
    R.q.options.forEach(function (opt, i) {
      var li = el('li', 'option-row');
      var btn = el('button', 'option-btn');
      btn.type = 'button'; btn.disabled = true;
      btn.appendChild(el('span', 'option-num', CIRCLED[i]));
      btn.appendChild(el('span', 'option-text', opt));
      btn.appendChild(el('span', 'option-state', ''));
      li.appendChild(btn);
      opts.appendChild(li);
    });
    card.appendChild(opts);
    zone.appendChild(card);
  } else {
    card = R.ui.card; opts = R.ui.opts;
    if (R.ui.lockBtn && R.ui.lockBtn.parentNode) R.ui.lockBtn.parentNode.style.display = 'none';
  }

  opts.querySelectorAll('.option-btn').forEach(function (b, i) {
    b.disabled = true;
    b.classList.remove('selected');
    if (i === R.q.answerIndex) {
      b.classList.add('correct');
      b.querySelector('.option-state').textContent = t('correct');
      var slot = el('span', 'stamp-slot');
      b.appendChild(slot);
      pressStamp(slot, t('verified'), 'small', true);
    }
    if (i === R.aSel && !R.aCorrect) {
      b.classList.add('wrong');
      b.querySelector('.option-state').textContent = t('incorrect');
    }
  });

  var secs = isFinite(R.bTime) ? (R.bTime / 1000).toFixed(1) + 's' : '—';
  D.ui.sideB.mark.textContent = (D.opponent === 'table' ? t('seatB') : t('wireBot')) + ': ' +
    (R.bSel < 0 ? t('unanswered') : (R.bCorrect ? t('correct') : t('incorrect'))) + ' · ' + secs;
  D.ui.sideA.mark.textContent = (D.opponent === 'table' ? t('seatA') : t('you')) + ': ' +
    (R.aSel < 0 ? t('unanswered') : (R.aCorrect ? t('correct') : t('incorrect'))) +
    (isFinite(R.aTime) ? ' · ' + (R.aTime / 1000).toFixed(1) + 's' : '');

  sourceCard(card, R.q);

  var actions = el('div', 'actions');
  var nextB = el('button', 'btn btn-red', duelOver() ? t('seeVerdict') : t('next'));
  nextB.addEventListener('click', function () {
    if (duelOver()) finishDuel(); else runRound();
  });
  actions.appendChild(nextB);
  card.appendChild(actions);
}

function updateBench() {
  D.ui.sideA.fig.textContent = fmt(D.pts.a);
  D.ui.sideB.fig.textContent = fmt(D.pts.b);
  paintTicks(D.ui.sideA.ticks, D.wins.a, D.mode === 'bo3' ? 2 : (D.mode === 'single' ? 1 : 5));
  paintTicks(D.ui.sideB.ticks, D.wins.b, D.mode === 'bo3' ? 2 : (D.mode === 'single' ? 1 : 5));
}
function paintTicks(host, won, slots) {
  host.innerHTML = '';
  for (var i = 0; i < slots; i++) {
    var tickEl = el('span', 'round-tick' + (i < won ? ' won' : ''));
    if (i === won - 1) tickEl.classList.add('grow');
    host.appendChild(tickEl);
  }
}

function finishDuel() {
  var outcome;
  if (D.wins.a > D.wins.b) outcome = 'a';
  else if (D.wins.b > D.wins.a) outcome = 'b';
  else if (D.pts.a > D.pts.b) outcome = 'a';
  else if (D.pts.b > D.pts.a) outcome = 'b';
  else outcome = 'draw';
  D.outcome = outcome;

  var matchXP = outcome === 'a' ? 50 : outcome === 'draw' ? 25 : 0;
  D.xp += matchXP;
  addXP(D.xp);

  /* coin settlement (pass-and-play stakes only) */
  if (D.stake > 0) {
    if (outcome === 'draw') S.coins += 2 * D.stake;              /* draw: full refund */
    else S.coins += prizeFor(D.stake);                           /* winner: 2×stake − fee */
  }

  /* weekly record (account holder) + league movement */
  if (outcome === 'a') { S.weekRecord.w += 1; S.prevailed += 1; }
  else if (outcome === 'draw') { S.weekRecord.d += 1; S.drawn += 1; }
  else S.weekRecord.l += 1;
  S.sittings += 1;
  S.duelsEntered += 1;
  markToday();
  save();
  noteRank(); /* remember rank for ▲▼ movement */

  var note = null;
  if (D.opponent === 'wire') {
    note = outcome === 'a' ? t('duelNoteWin').replace('{a}', fmt(D.wins.a)).replace('{b}', fmt(D.wins.b))
      : outcome === 'b' ? t('duelNoteLoss').replace('{a}', fmt(D.wins.a)).replace('{b}', fmt(D.wins.b))
      : t('duelNoteDraw').replace('{a}', fmt(D.wins.a)).replace('{b}', fmt(D.wins.b));
  }
  pendingTickerNote = note;
  nav('/results', { slide: true });
}

/* ==========================================================================
   SCREEN 4 — RESULTS · Tomorrow's front page
   ========================================================================== */
ROUTES.results = function (root) {
  if (!D || !D.rounds.length) { nav('/home'); return; }
  var isTable = D.opponent === 'table';
  var headline =
    D.outcome === 'a' ? (isTable ? t('headA') : t('headPrevail')) :
    D.outcome === 'b' ? (isTable ? t('headB') : t('headBot')) : t('headDraw');
  var outcomeText =
    D.outcome === 'a' ? (isTable ? t('seatAPrevailed') : t('youPrevailed')) :
    D.outcome === 'b' ? (isTable ? t('seatBPrevailed') : t('botPrevailed')) : t('drawn');

  var sheet = el('div', 'verdict-sheet');
  var kick = el('div', 'verdict-kicker');
  kick.appendChild(el('span', 'dateline', t('verdictFile') + dayKey()));
  kick.appendChild(el('span', 'dateline', t(D.mode === 'single' ? 'modeSingle' : D.mode === 'bo3' ? 'modeBo3' : 'modeFull').toUpperCase()));
  sheet.appendChild(kick);
  sheet.appendChild(el('h1', 'verdict-heading track-in', headline + ' ' + fmt(D.wins.a) + '–' + fmt(D.wins.b)));
  sheet.appendChild(el('p', 'verdict-outcome', outcomeText + ' · ' + fmt(D.pts.a) + '–' + fmt(D.pts.b)));
  var stampHost = el('div', 'verdict-stamp');
  sheet.appendChild(stampHost);
  later(function () { pressStamp(stampHost, t('lateEdition'), 'big'); }, 300);

  /* coin settlement line */
  var coinLine = el('p', 'coin-settle',
    D.stake > 0
      ? (D.outcome === 'draw'
          ? t('coinSettleDraw')
          : t('coinSettleWin').replace('{s}', fmt(D.stake)).replace('{p}', fmt(prizeFor(D.stake))).replace('{f}', fmt(feeFor(D.stake))))
      : t('coinSettleFree'));
  sheet.appendChild(coinLine);

  /* round-by-round ledger */
  sheet.appendChild(el('p', 'label', t('roundLedger')));
  var tbl = el('table', 'sheet record-table');
  var thead = el('thead');
  var hr = el('tr');
  [t('colRound'), isTable ? t('seatA') : t('colYou'), isTable ? t('seatB') : t('colOpp'), t('colResult'), t('colSource')].forEach(function (h) {
    hr.appendChild(el('th', null, h));
  });
  thead.appendChild(hr);
  tbl.appendChild(thead);
  var tb = el('tbody');
  D.rounds.forEach(function (R, i) {
    var tr = el('tr');
    tr.appendChild(el('td', 'num', fmt(i + 1)));
    var aCell = el('td');
    aCell.appendChild(document.createTextNode(R.aSel < 0 ? t('unanswered') : (R.aCorrect ? '✓ ' + t('correct') : '✗ ' + t('incorrect'))));
    aCell.appendChild(el('div', 'rt-note mono', isFinite(R.aTime) ? (R.aTime / 1000).toFixed(1) + 's · ' + fmt(R.aPts) : fmt(R.aPts)));
    tr.appendChild(aCell);
    var bCell = el('td');
    bCell.appendChild(document.createTextNode(R.bSel < 0 ? t('unanswered') : (R.bCorrect ? '✓ ' + t('correct') : '✗ ' + t('incorrect'))));
    bCell.appendChild(el('div', 'rt-note mono', isFinite(R.bTime) ? (R.bTime / 1000).toFixed(1) + 's · ' + fmt(R.bPts) : fmt(R.bPts)));
    tr.appendChild(bCell);
    tr.appendChild(el('td', null, R.winner === 'draw' ? t('drawLabel') : (R.winner === 'a' ? (isTable ? t('seatA') : t('you')) : (isTable ? t('seatB') : t('wireBot')))));
    var src = el('td');
    src.appendChild(el('div', 'rt-note', R.q.source));
    if (R.q.sourceUrl) {
      var vlink = el('a', 'src-verify', t('verifySource'));
      vlink.href = R.q.sourceUrl; vlink.target = '_blank'; vlink.rel = 'noopener';
      src.appendChild(vlink);
    }
    tr.appendChild(src);
    tb.appendChild(tr);
  });
  var trT = el('tr', 'totals');
  trT.appendChild(el('td', null, t('totals')));
  trT.appendChild(el('td', 'num', fmt(D.pts.a)));
  trT.appendChild(el('td', 'num', fmt(D.pts.b)));
  trT.appendChild(el('td', null, outcomeText));
  trT.appendChild(el('td', 'num', t('xpEarned') + ': +' + fmt(D.xp)));
  tb.appendChild(trT);
  tbl.appendChild(tb);
  sheet.appendChild(tbl);
  root.appendChild(sheet);

  /* Standing — progress, never a loss list */
  var ti = titleFor(S.xp);
  var hb = el('div', 'stack');
  hb.appendChild(el('p', 'label', t('standing')));
  var row = el('div', 'honors-row');
  row.appendChild(el('span', null, S.name + ' — ' + ti.title.name));
  row.appendChild(el('span', 'mono', fmt(S.xp) + ' XP · ' + t('coins') + ' ' + fmt(S.coins)));
  hb.appendChild(row);
  root.appendChild(hb);

  var actions = el('div', 'actions');
  var again = el('button', 'btn btn-red', t('again'));
  again.addEventListener('click', function () { startDuel({ mode: D.mode, opponent: D.opponent, stake: D.stake }); });
  var toModes = el('button', 'btn', t('toModes'));
  toModes.addEventListener('click', function () { nav('/modes'); });
  var toDesk = el('button', 'btn btn-quiet', t('toDesk'));
  toDesk.addEventListener('click', function () { nav('/home'); });
  actions.appendChild(again); actions.appendChild(toModes); actions.appendChild(toDesk);
  root.appendChild(actions);
};

/* ==========================================================================
   SCREEN 5 — THE LEAGUE TABLE (weekly league of 30)
   ========================================================================== */
ROUTES.league = function (root) {
  var daysLeft = 6 - weekDayIndex();
  sectionHead(root, TIERS[S.tier], t('leagueTitle'), t('leagueSub'));

  var meta = el('p', 'mono muted',
    t('tierLabel') + ': ' + TIERS[S.tier] + ' · ' + t('weekLabel') + ' ' + S.weekKey + ' · ' + fmt(daysLeft) + ' ' + t('daysLeft'));
  root.appendChild(meta);

  var legend = el('div', 'league-legend');
  var l1 = el('span', null, ''); l1.appendChild(el('span', 'legend-chip promo')); l1.appendChild(document.createTextNode(t('promoNote')));
  var l2 = el('span', null, ''); l2.appendChild(el('span', 'legend-chip rel')); l2.appendChild(document.createTextNode(t('relNote')));
  legend.appendChild(l1); legend.appendChild(l2);
  root.appendChild(legend);

  var rows = leagueRows(S.weekKey, weekDayIndex(), S.weekXp, S.tier);
  var wrap = el('div', 'league-wrap');
  var tbl = el('table', 'sheet league-table');
  var thead = el('thead'); var hr = el('tr');
  [t('colRank'), t('colReader'), t('colAware'), t('colWdl'), t('colMove')].forEach(function (h) { hr.appendChild(el('th', null, h)); });
  thead.appendChild(hr); tbl.appendChild(thead);
  var tb = el('tbody');
  rows.forEach(function (r) {
    var cls = [];
    if (r.player) cls.push('me');
    if (r.rank <= 10) cls.push('band-promo');
    if (r.rank >= 26) cls.push('band-rel');
    var tr = el('tr', cls.join(' '));
    tr.appendChild(el('td', 'rank', fmt(r.rank)));
    tr.appendChild(el('td', null, r.player ? r.name + ' (' + t('youTag') + ')' : r.name));
    tr.appendChild(el('td', 'num', fmt(r.awareness)));
    tr.appendChild(el('td', 'num', fmt(r.rec.w) + '–' + fmt(r.rec.d) + '–' + fmt(r.rec.l)));
    var mv = r.move || 0;
    var mvCls = mv > 0 ? 'up' : mv < 0 ? 'down' : 'flat';
    var mvTxt = mv > 0 ? '▲ ' + fmt(mv) : mv < 0 ? '▼ ' + fmt(-mv) : '—';
    var mvTd = el('td', null, '');
    var mvSpan = el('span', 'mv ' + mvCls, mvTxt);
    mvSpan.setAttribute('aria-label', mv > 0 ? 'Up ' + mv : mv < 0 ? 'Down ' + (-mv) : 'No change');
    mvTd.appendChild(mvSpan);
    tr.appendChild(mvTd);
    tb.appendChild(tr);
  });
  tbl.appendChild(tb);
  wrap.appendChild(tbl);
  root.appendChild(wrap);

  if (S.leagueHistory.length) {
    var aw = el('div', 'stack');
    aw.appendChild(el('p', 'label', t('archiveTitle')));
    var at = el('table', 'sheet');
    var ab = el('tbody');
    S.leagueHistory.forEach(function (h) {
      var tr = el('tr');
      tr.appendChild(el('td', null, h.week));
      tr.appendChild(el('td', null, h.tier));
      tr.appendChild(el('td', 'num', '#' + fmt(h.rank)));
      tr.appendChild(el('td', 'num', fmt(h.xp) + ' XP'));
      ab.appendChild(tr);
    });
    at.appendChild(ab);
    aw.appendChild(at);
    root.appendChild(aw);
  }
  noteRank(); /* seeing the table fixes the session's movement baseline */
};

/* ==========================================================================
   SCREEN 6 — BEATS (six untimed questions, confidence ladder)
   ========================================================================== */
var CONF = [
  { id: 'steady', win: 2, lose: 0,  nameK: 'confSteady', descK: 'confSteadyDesc' },
  { id: 'bold',   win: 3, lose: -1, nameK: 'confBold',   descK: 'confBoldDesc' },
  { id: 'called', win: 4, lose: -3, nameK: 'confCalled', descK: 'confCalledDesc' }
];
var BT = null;

ROUTES.beats = function (root) {
  sectionHead(root, t('navBeats'), t('beatsTitle'), t('beatsSub'));
  var ul = el('ul', 'ledger');
  DESKS.forEach(function (d, i) {
    var li = el('li', 'ledger-row');
    var btn = el('button', 'ledger-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'ledger-idx', String(i + 1).padStart(2, '0')));
    var nm = el('span', 'ledger-name');
    nm.appendChild(document.createTextNode(t(d.nameK)));
    nm.appendChild(el('div', 'small muted', t(d.descK)));
    btn.appendChild(nm);
    btn.appendChild(el('span', 'ledger-count', fmt(deskQuestions(d.id).length)));
    btn.addEventListener('click', function () { startBeat(d.id); });
    li.appendChild(btn);
    ul.appendChild(li);
  });
  root.appendChild(ul);
};

function startBeat(deskId) {
  var pool = shuffle(deskQuestions(deskId));
  BT = { desk: deskId, questions: pool.slice(0, 6), i: 0, points: 0, entries: [], phase: 'answer', sel: -1, confIdx: -1 };
  nav('/beat');
}

ROUTES.beat = function (root) {
  if (!BT) { nav('/beats'); return; }
  if (BT.i >= BT.questions.length) { beatSummary(root); return; }
  var q = BT.questions[BT.i];
  var d = DESKS.filter(function (x) { return x.id === BT.desk; })[0];

  sectionHead(root, t(d.nameK), t('beatsTitle'), t('beatsSub'));

  var prog = el('div', 'beat-progress');
  prog.setAttribute('aria-label', fmt(BT.i + 1) + ' / 6');
  BT.questions.forEach(function (_, i) {
    prog.appendChild(el('span', 'beat-step' + (i < BT.i ? ' done' : i === BT.i ? ' now' : '')));
  });
  root.appendChild(prog);

  var card = el('div', 'card q-card');
  clippingHead(card, q);
  card.appendChild(el('p', 'q-text', q.q));

  var opts = el('ol', 'options');
  q.options.forEach(function (opt, i) {
    var li = el('li', 'option-row deal');
    li.style.animationDelay = (i * 60) + 'ms';
    var btn = el('button', 'option-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'option-num', CIRCLED[i]));
    btn.appendChild(el('span', 'option-text', opt));
    btn.appendChild(el('span', 'option-state', ''));
    btn.addEventListener('click', function () {
      if (BT.phase !== 'answer') return;
      BT.sel = i;
      opts.querySelectorAll('.option-btn').forEach(function (b, j) { b.classList.toggle('selected', j === i); });
      ladderWrap.style.display = '';
    });
    li.appendChild(btn);
    opts.appendChild(li);
  });
  card.appendChild(opts);

  var ladderWrap = el('div');
  ladderWrap.style.display = 'none';
  ladderWrap.appendChild(el('p', 'label', t('confPrompt')));
  var ladder = el('div', 'ladder');
  CONF.forEach(function (c, i) {
    var b = el('button', 'ladder-btn');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.appendChild(el('span', 'ladder-name', t(c.nameK)));
    b.appendChild(el('span', 'ladder-desc', t(c.descK)));
    b.appendChild(el('span', 'ladder-pay', (c.win > 0 ? '+' + c.win : c.win) + ' / ' + (c.lose > 0 ? '+' + c.lose : c.lose)));
    b.addEventListener('click', function () {
      if (BT.phase !== 'answer') return;
      BT.phase = 'locked'; /* first choice locks */
      BT.confIdx = i;
      b.setAttribute('aria-pressed', 'true');
      ladder.querySelectorAll('.ladder-btn').forEach(function (x) { x.disabled = true; });
      pressKerchunk();
      resolveBeat(card, opts);
    });
    ladder.appendChild(b);
  });
  ladderWrap.appendChild(ladder);
  card.appendChild(ladderWrap);
  root.appendChild(card);
};

function resolveBeat(card, opts) {
  var q = BT.questions[BT.i];
  var c = CONF[BT.confIdx];
  var correct = BT.sel === q.answerIndex;
  var delta = correct ? c.win : c.lose;
  BT.points = Math.max(0, BT.points + delta);
  addXP(correct ? 20 : 5);
  fileClipping(q, BT.sel);
  rateRound(BT.desk, correct ? 1 : 0);
  BT.entries.push({ q: q, correct: correct, conf: c, delta: delta });

  opts.querySelectorAll('.option-btn').forEach(function (b, i) {
    b.disabled = true;
    b.classList.remove('selected');
    if (i === q.answerIndex) {
      b.classList.add('correct');
      b.querySelector('.option-state').textContent = t('correct');
      var slot = el('span', 'stamp-slot');
      b.appendChild(slot);
      pressStamp(slot, t('verified'), 'small', true);
    } else if (i === BT.sel) {
      b.classList.add('wrong');
      b.querySelector('.option-state').textContent = t('incorrect');
    }
  });
  teletypeTick();
  sourceCard(card, q);

  var actions = el('div', 'actions');
  var nb = el('button', 'btn btn-red', BT.i + 1 >= BT.questions.length ? t('seeVerdict') : t('next'));
  nb.addEventListener('click', function () {
    BT.i += 1; BT.phase = 'answer'; BT.sel = -1; BT.confIdx = -1;
    render('beat');
  });
  actions.appendChild(nb);
  card.appendChild(actions);
  announce(correct ? t('correct') : t('incorrect'));
}

function beatSummary(root) {
  addXP(40); /* beat complete */
  S.sittings += 1; markToday(); save();
  noteRank();

  var d = DESKS.filter(function (x) { return x.id === BT.desk; })[0];
  var sheet = el('div', 'verdict-sheet');
  var kick = el('div', 'verdict-kicker');
  kick.appendChild(el('span', 'dateline', t('verdictFile') + dayKey()));
  kick.appendChild(el('span', 'dateline', t(d.nameK).toUpperCase()));
  sheet.appendChild(kick);
  sheet.appendChild(el('h1', 'verdict-heading track-in', t('beatDone')));
  sheet.appendChild(el('p', 'verdict-outcome', t('beatPoints') + ': ' + fmt(BT.points)));
  var stampHost = el('div', 'verdict-stamp');
  sheet.appendChild(stampHost);
  later(function () { pressStamp(stampHost, t('filed'), 'big'); }, 300);

  var tbl = el('table', 'sheet record-table');
  var tb = el('tbody');
  BT.entries.forEach(function (e, i) {
    var tr = el('tr');
    tr.appendChild(el('td', 'num', fmt(i + 1)));
    tr.appendChild(el('td', null, (e.correct ? '✓ ' + t('correct') : '✗ ' + t('incorrect')) + ' · ' + t(e.conf.nameK)));
    tr.appendChild(el('td', 'num', (e.delta > 0 ? '+' : '') + fmt(e.delta)));
    var src = el('td');
    src.appendChild(el('div', 'rt-note', e.q.source));
    if (e.q.sourceUrl) {
      var rlink = el('a', 'src-verify', t('verifySource'));
      rlink.href = e.q.sourceUrl; rlink.target = '_blank'; rlink.rel = 'noopener';
      src.appendChild(rlink);
    }
    tr.appendChild(src);
    tb.appendChild(tr);
  });
  var trT = el('tr', 'totals');
  trT.appendChild(el('td', null, t('totals')));
  trT.appendChild(el('td', null, ''));
  trT.appendChild(el('td', 'num', fmt(BT.points)));
  trT.appendChild(el('td', 'num', t('xpEarned') + ': +' + fmt(BT.entries.reduce(function (s, e) { return s + (e.correct ? 20 : 5); }, 0) + 40)));
  tb.appendChild(trT);
  tbl.appendChild(tb);
  sheet.appendChild(tbl);
  root.appendChild(sheet);

  var actions = el('div', 'actions');
  var again = el('button', 'btn btn-red', t('again'));
  again.addEventListener('click', function () { startBeat(BT.desk); });
  var toBeats = el('button', 'btn', t('navBeats'));
  toBeats.addEventListener('click', function () { nav('/beats'); });
  actions.appendChild(again); actions.appendChild(toBeats);
  root.appendChild(actions);

  pendingTickerNote = t('beatNote').replace('{d}', t(d.nameK).toUpperCase());
  BT = null;
}

/* ==========================================================================
   SCREEN 7 — CLIPPINGS (vault) + RECALL DRILL
   ========================================================================== */
var clipFilter = 'all';
ROUTES.clippings = function (root) {
  sectionHead(root, t('navClips'), t('clipsTitle'), t('clipsSub'));

  var bar = el('div', 'actions');
  var filters = [{ id: 'all', label: t('filterAll') }].concat(DESKS.map(function (d) { return { id: d.id, label: t(d.nameK) }; }));
  filters.forEach(function (f) {
    var b = el('button', 'btn btn-quiet', f.label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(clipFilter === f.id));
    b.addEventListener('click', function () { clipFilter = f.id; render('clippings'); });
    bar.appendChild(b);
  });
  var recall = el('button', 'btn btn-red', t('recallBtn'));
  recall.disabled = S.clippings.length < 1;
  recall.addEventListener('click', startRecall);
  bar.appendChild(recall);
  root.appendChild(bar);

  var clips = S.clippings.filter(function (c) { return clipFilter === 'all' || c.desk === clipFilter; });
  if (!clips.length) { root.appendChild(el('p', 'muted', t('emptyClips'))); return; }

  clips.forEach(function (c) {
    var card = el('div', 'card');
    var top = el('div', 'card-top');
    top.appendChild(el('span', 'dateline', c.date));
    top.appendChild(el('span', 'desk-tag ' + c.desk, t((DESKS.filter(function (d) { return d.id === c.desk; })[0] || DESKS[0]).nameK)));
    card.appendChild(top);
    card.appendChild(el('p', 'q-tease', c.q));
    var meta = el('p', 'small muted');
    var yourPick = c.picked >= 0 && c.options[c.picked] ? c.options[c.picked] : t('unanswered');
    meta.textContent = t('clipYour') + ': ' + yourPick + ' · ' + t('clipAnswer') + ': ' + c.options[c.answerIndex];
    card.appendChild(meta);
    var p = el('p', 'src-line');
    p.appendChild(el('strong', null, t('source') + ' '));
    p.appendChild(document.createTextNode(c.source));
    card.appendChild(p);
    if (c.sourceUrl) {
      var link = el('a', 'src-verify', t('verifySource'));
      link.href = c.sourceUrl; link.target = '_blank'; link.rel = 'noopener';
      card.appendChild(link);
    }
    root.appendChild(card);
  });
};

var RC = null;
function startRecall() {
  RC = { items: shuffle(S.clippings).slice(0, 5), i: 0, score: 0 };
  nav('/recall');
}
ROUTES.recall = function (root) {
  if (!RC || !RC.items.length) { nav('/clippings'); return; }
  if (RC.i >= RC.items.length) { recallSummary(root); return; }
  var c = RC.items[RC.i];

  sectionHead(root, t('recallTitle'), t('recallTitle'), t('recallSub'));
  root.appendChild(el('p', 'mono muted', fmt(RC.i + 1) + ' / ' + fmt(RC.items.length)));

  var card = el('div', 'card q-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'dateline', c.date));
  top.appendChild(el('span', 'desk-tag ' + c.desk, t((DESKS.filter(function (d) { return d.id === c.desk; })[0] || DESKS[0]).nameK)));
  card.appendChild(top);
  card.appendChild(el('p', 'q-text', c.q));

  var opts = el('ol', 'options');
  c.options.forEach(function (opt, i) {
    var li = el('li', 'option-row deal');
    li.style.animationDelay = (i * 60) + 'ms';
    var btn = el('button', 'option-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'option-num', CIRCLED[i]));
    btn.appendChild(el('span', 'option-text', opt));
    btn.appendChild(el('span', 'option-state', ''));
    btn.addEventListener('click', function () {
      var correct = i === c.answerIndex;
      if (correct) { RC.score += 1; addXP(6); } /* +6 per correct review */
      opts.querySelectorAll('.option-btn').forEach(function (b, j) {
        b.disabled = true;
        if (j === c.answerIndex) {
          b.classList.add('correct');
          b.querySelector('.option-state').textContent = t('correct');
        } else if (j === i) {
          b.classList.add('wrong');
          b.querySelector('.option-state').textContent = t('incorrect');
        }
      });
      pressKerchunk();
      teletypeTick();
      var p = el('p', 'src-line');
      p.appendChild(el('strong', null, t('source') + ' '));
      p.appendChild(document.createTextNode(c.source));
      card.appendChild(p);
      var actions = el('div', 'actions');
      var nb = el('button', 'btn btn-red', RC.i + 1 >= RC.items.length ? t('seeVerdict') : t('next'));
      nb.addEventListener('click', function () { RC.i += 1; render('recall'); });
      actions.appendChild(nb);
      card.appendChild(actions);
      announce(correct ? t('correct') : t('incorrect'));
    });
    li.appendChild(btn);
    opts.appendChild(li);
  });
  card.appendChild(opts);
  root.appendChild(card);
};
function recallSummary(root) {
  S.sittings += 1; markToday(); save();
  var sheet = el('div', 'verdict-sheet');
  var kick = el('div', 'verdict-kicker');
  kick.appendChild(el('span', 'dateline', t('verdictFile') + dayKey()));
  kick.appendChild(el('span', 'dateline', t('recallTitle').toUpperCase()));
  sheet.appendChild(kick);
  sheet.appendChild(el('h1', 'verdict-heading track-in', t('recallDone')));
  sheet.appendChild(el('p', 'verdict-outcome', t('recallScore') + ': ' + fmt(RC.score) + ' / ' + fmt(RC.items.length) + ' · +' + fmt(RC.score * 6) + ' XP'));
  var stampHost = el('div', 'verdict-stamp');
  sheet.appendChild(stampHost);
  later(function () { pressStamp(stampHost, t('filed'), 'big'); }, 300);
  root.appendChild(sheet);
  var actions = el('div', 'actions');
  var toClips = el('button', 'btn btn-red', t('navClips'));
  toClips.addEventListener('click', function () { nav('/clippings'); });
  actions.appendChild(toClips);
  root.appendChild(actions);
  RC = null;
}

/* ==========================================================================
   SCREEN 8 — PRESS CARD (profile)
   ========================================================================== */
ROUTES.card = function (root) {
  var ti = titleFor(S.xp);

  var cover = el('div', 'pass-cover');
  cover.appendChild(el('h1', 'pass-title track-in', t('cardTitle')));
  cover.appendChild(el('p', 'pass-no', t('volLine') + dayKey()));
  root.appendChild(cover);

  var pages = el('div');

  function fieldRow(label, valueText) {
    var row = el('div', 'field-row');
    row.appendChild(el('span', 'f-label', label));
    row.appendChild(el('span', 'f-value', valueText));
    return row;
  }

  /* Name — editable */
  var nameRow = el('div', 'field-row');
  nameRow.appendChild(el('span', 'f-label', t('fName')));
  var nameVal = el('span', 'f-value', S.name);
  var editBtn = el('button', 'btn btn-quiet', t('editName'));
  editBtn.style.marginLeft = '16px';
  nameRow.appendChild(nameVal);
  nameRow.appendChild(editBtn);
  editBtn.addEventListener('click', function () {
    var input = el('input', 'f-edit');
    input.type = 'text';
    input.value = S.name;
    input.maxLength = 40;
    input.setAttribute('aria-label', t('fName'));
    var saveB = el('button', 'btn btn-red', t('saveName'));
    saveB.style.marginLeft = '16px';
    nameRow.replaceChild(input, nameVal);
    nameRow.replaceChild(saveB, editBtn);
    input.focus();
    saveB.addEventListener('click', function () {
      S.name = input.value.trim() || 'Reader'; save();
      nameVal.textContent = S.name;
      nameRow.replaceChild(nameVal, input);
      nameRow.replaceChild(editBtn, saveB);
      applyChrome(); updateTicker();
    });
  });
  pages.appendChild(nameRow);
  pages.appendChild(fieldRow(t('fTitle'), ti.title.name + ' (' + fmt(S.xp) + ' XP)'));
  pages.appendChild(fieldRow(t('fCoins'), fmt(S.coins) + ' — ' + t('coinsNote')));
  pages.appendChild(fieldRow(t('fLeague'), TIERS[S.tier] + ' · #' + fmt(playerRank()) + ' · ' + t('weekLabel') + ' ' + S.weekKey));
  pages.appendChild(fieldRow(t('fSince'), (Object.keys(S.days).sort()[0] || dayKey())));
  pages.appendChild(fieldRow(t('weekRec'), fmt(S.weekRecord.w) + '–' + fmt(S.weekRecord.d) + '–' + fmt(S.weekRecord.l) + ' · ' + fmt(S.weekXp) + ' XP'));

  /* Standing ladder */
  var stWrap = el('div', 'stack');
  stWrap.appendChild(el('p', 'label', t('standing')));
  var bar = el('div', 'standing-bar');
  var segs = 24;
  var nextXp = ti.next ? ti.next.xp : ti.title.xp + xpToNext(ti.level);
  var baseXp = ti.title.xp;
  var frac = ti.next ? Math.min(1, (S.xp - baseXp) / (nextXp - baseXp)) : 1;
  for (var i = 0; i < segs; i++) bar.appendChild(el('span', 'standing-seg' + (i / segs < frac ? ' fill' : '')));
  stWrap.appendChild(bar);
  var ladderLine = TITLES.map(function (x) { return x.name + ' ' + fmt(x.xp); }).join(' · ');
  stWrap.appendChild(el('p', 'small muted', ladderLine + (ti.next ? ' — ' + fmt(Math.max(0, nextXp - S.xp)) + ' ' + t('toNext') + ' ' + ti.next.name : '')));
  pages.appendChild(stWrap);

  /* Desk ratings (Elo-lite) */
  pages.appendChild(el('p', 'label', t('ratingsTitle')));
  var rt = el('table', 'sheet stats-ledger');
  var rtb = el('tbody');
  DESKS.forEach(function (d) {
    var tr = el('tr');
    tr.appendChild(el('td', null, t(d.nameK)));
    tr.appendChild(el('td', 'num', fmt(S.ratings[d.id] || 1000)));
    rtb.appendChild(tr);
  });
  rt.appendChild(rtb);
  pages.appendChild(rt);

  /* Ledger stats */
  pages.appendChild(el('p', 'label', t('ledgerStats')));
  var tbl = el('table', 'sheet stats-ledger');
  var rows2 = [
    [t('stSittings'), fmt(S.sittings)],
    [t('stPrevailed'), fmt(S.prevailed)],
    [t('stDrawn'), fmt(S.drawn)],
    [t('navClips'), fmt(S.clippings.length)]
  ];
  rows2.forEach(function (r) {
    var tr = el('tr');
    tr.appendChild(el('td', null, r[0]));
    tr.appendChild(el('td', 'num', r[1]));
    tbl.appendChild(tr);
  });
  var trT = el('tr', 'totals');
  trT.appendChild(el('td', null, t('stXP')));
  trT.appendChild(el('td', 'num', fmt(S.xp)));
  tbl.appendChild(trT);
  pages.appendChild(tbl);

  /* Sound + language + relaxed */
  pages.appendChild(toggleSwitch(t('sound'), t('soundHint'),
    function () { return S.sound; },
    function (v) { S.sound = v; save(); if (v) teletypeTick(); }));
  pages.appendChild(toggleSwitch(t('relaxed'), t('relaxedHint'),
    function () { return S.relaxed; },
    function (v) { S.relaxed = v; save(); }));
  var lRow = el('div', 'relaxed-bar');
  lRow.appendChild(el('p', 'label', t('lang')));
  var lBtn = el('button', 'btn', S.lang === 'hi' ? 'English' : 'हिंदी');
  lBtn.type = 'button';
  lBtn.addEventListener('click', function () { toggleLang(); });
  lRow.appendChild(lBtn);
  pages.appendChild(lRow);

  root.appendChild(pages);

  /* Actions: print + WhatsApp share + copy */
  var actions = el('div', 'actions');
  var certB = el('button', 'btn btn-red', t('certBtn'));
  certB.addEventListener('click', printCard);
  var shareB = el('button', 'btn', t('shareBtn'));
  shareB.addEventListener('click', function () {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText()), '_blank', 'noopener');
  });
  var copyB = el('button', 'btn btn-quiet', t('copyBtn'));
  copyB.addEventListener('click', function () { copyText(shareText(), copyB); });
  actions.appendChild(certB); actions.appendChild(shareB); actions.appendChild(copyB);
  root.appendChild(actions);
};

function shareText() {
  var ti = titleFor(S.xp);
  return t('sharePre') + ti.title.name + ' · ' + fmt(S.xp) + ' XP · ' +
    TIERS[S.tier] + ' #' + fmt(playerRank()) + ' · ' + fmt(S.coins) + ' ' + t('coins') + '.' + t('shareTail');
}
function copyText(text, btn) {
  function done() {
    var old = btn.textContent;
    btn.textContent = t('copied');
    setTimeout(function () { btn.textContent = old; }, 2000);
    announce(t('copied'));
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
  } else { legacyCopy(text); done(); }
}
function legacyCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* clipboard unavailable */ }
  document.body.removeChild(ta);
}

/* ---------------- Print Press Card ---------------- */
function printCard() {
  var ti = titleFor(S.xp);
  $('#cert-name').textContent = S.name;
  var body = $('#cert-body');
  body.innerHTML = '';
  body.appendChild(document.createTextNode('holding the standing of '));
  body.appendChild(el('strong', null, ti.title.name));
  body.appendChild(document.createTextNode(' at the Politics & Money Desk.'));
  $('#cert-detail').textContent =
    fmt(S.xp) + ' awareness · ' + TIERS[S.tier] + ' #' + fmt(playerRank()) + ' · ' +
    fmt(S.weekRecord.w) + '–' + fmt(S.weekRecord.d) + '–' + fmt(S.weekRecord.l) + ' this week · ' +
    fmt(S.coins) + ' simulated coins.';
  $('#cert-date').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#cert-acc').textContent = 'LEDGER · ' + dayKey();
  pressKerchunk();
  window.print();
}

/* ---------------- Language toggle ---------------- */
function toggleLang() {
  S.lang = S.lang === 'hi' ? 'en' : 'hi';
  save();
  applyChrome();
  render(currentRoute || 'home');
}

/* ---------------- Boot ---------------- */
function boot() {
  var granted = dailyGrant();
  var rolled = leagueRollover();
  document.getElementById('brand').addEventListener('click', function () { nav(S.onboarded ? '/home' : '/onboarding'); });
  document.querySelectorAll('.nav-btn[data-nav]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!S.onboarded) { nav('/onboarding'); return; }
      nav('/' + b.getAttribute('data-nav'));
    });
  });
  document.getElementById('wallet-chip').addEventListener('click', function () {
    if (S.onboarded) nav('/card');
  });
  document.getElementById('lang-toggle').addEventListener('click', toggleLang);
  var tickerInner = document.getElementById('ticker-inner');
  tickerInner.addEventListener('animationend', function () { tickerInner.classList.remove('run'); });
  applyChrome();
  render(routeFromHash());
  var bootNote = null;
  if (rolled) {
    bootNote = 'WEEK ' + S.weekKey + ' OPENS · ' + TIERS[S.tier].toUpperCase() +
      (rolled.newTier > rolled.oldTier ? ' · PROMOTED' : rolled.newTier < rolled.oldTier ? ' · RELEGATED' : '') +
      ' · LAST WEEK #' + fmt(rolled.rank);
  }
  if (granted) bootNote = (bootNote ? bootNote + ' · ' : '') + t('grantNote');
  if (bootNote) updateTicker(bootNote);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
