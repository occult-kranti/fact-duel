/* ==========================================================================
   SABHA — The Reading Room · app.js
   Vanilla JS. Hash-routed, no reloads. Works from file:// and static hosts.
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
var EPOCH = Date.UTC(2024, 0, 1); /* accession series opens MMXXIV */
function dayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function accessionNo() {
  var days = Math.floor((Date.now() - EPOCH) / DAY_MS);
  return 10000 + Math.max(0, days); /* increments daily */
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
function announce(msg) { $('#live').textContent = msg; }

/* ---------------- Persistent state ---------------- */
var LS_KEY = 'sabha.v1';
var DEFAULTS = {
  xp: 0, name: 'Reader', lang: 'en', relaxed: false, sound: false, onboarded: false,
  sittings: 0, duelsEntered: 0, prevailed: 0, drawn: 0,
  bestStreak: 0, days: {}, seals: {}, calibration: []
};
var S;
try {
  S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
} catch (e) { S = Object.assign({}, DEFAULTS); }
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* private mode: session-only */ }
}
function markToday() {
  S.days[dayKey()] = true;
  /* keep the ledger trim: last 60 day entries */
  var keys = Object.keys(S.days).sort();
  while (keys.length > 60) { delete S.days[keys.shift()]; }
  save();
}
function activeDays() {
  var n = 0, d = new Date();
  for (var i = 0; i < 30; i++) { if (S.days[dayKey(d)]) n++; d = new Date(d.getTime() - DAY_MS); }
  return n;
}
function dayStreak() {
  var n = 0, d = new Date();
  if (!S.days[dayKey(d)]) d = new Date(d.getTime() - DAY_MS); /* today may not be logged yet */
  while (S.days[dayKey(d)]) { n++; d = new Date(d.getTime() - DAY_MS); }
  return n;
}

/* ---------------- Titles & XP ---------------- */
var TITLES = [
  { name: 'Pathak', xp: 0 },
  { name: 'Vidvan', xp: 300 },
  { name: 'Acharya', xp: 900 },
  { name: 'Maha-Vidvan', xp: 2000 }
];
function titleFor(xp) {
  var t = TITLES[0], idx = 0;
  TITLES.forEach(function (ti, i) { if (xp >= ti.xp) { t = ti; idx = i; } });
  return { title: t, level: idx + 1, next: TITLES[idx + 1] || null };
}
function xpToNext(level) { return Math.round(80 * Math.pow(level, 1.55)); }
function addXP(n) { S.xp += n; save(); }

/* ---------------- Seals ---------------- */
var SEAL_DEFS = [
  { id: 'firstDuel',      name: 'First Duel',       req: 'Complete your first sitting' },
  { id: 'fiveSittings',   name: 'Five Sittings',    req: 'Complete five sittings' },
  { id: 'routeFinished',  name: 'Route Finished',   req: 'Finish a Reading Route' },
  { id: 'mythBuster',     name: 'Myth-Buster',      req: '4 of 5 in a WhatsApp Check' },
  { id: 'wellCalibrated', name: 'Well-Calibrated',  req: '50 rated answers, |error| ≤ 15%' },
  { id: 'sevenDayShelf',  name: 'Seven-Day Shelf',  req: 'Read seven days in a row' }
];
function awardSeal(id) {
  if (S.seals[id]) return false;
  S.seals[id] = true; save();
  return true;
}
function checkSeals() {
  if (S.sittings >= 1) awardSeal('firstDuel');
  if (S.sittings >= 5) awardSeal('fiveSittings');
  if (dayStreak() >= 7) awardSeal('sevenDayShelf');
  var cal = calibrationError();
  if (S.calibration.length >= 50 && cal != null && Math.abs(cal) <= 0.15) awardSeal('wellCalibrated');
}
function calibrationError() {
  if (!S.calibration.length) return null;
  var stated = 0, hits = 0;
  S.calibration.forEach(function (c) { stated += c.conf; hits += c.hit; });
  return (stated / S.calibration.length) - (hits / S.calibration.length);
}

/* ---------------- i18n ---------------- */
var STR = {
  en: {
    navDesk: 'Front Desk', navModes: 'Sittings', navPass: 'Reader’s Pass',
    colophonLine: 'A knowledge game. No money, no gambling, no ads. Every answer shows its source.',
    tagline: 'Where India tests what it knows.',
    estLine: 'EST. MMXXIV · ACCESSION No. ',
    todaysDuel: 'Today’s Acquisition', opponentTier: 'Opponent: The Archivist · Gentle hand',
    enterRoom: 'Enter the Reading Room',
    catIndex: 'Index of Categories', catHint: 'Choose a shelf — a Single Sitting is drawn from it.',
    lastThirty: 'Your shelf — the last 30 days',
    modesTitle: 'Choose a Sitting', modesSub: 'Six forms of duel. Timers are a hairline, never a cage.',
    relaxed: 'Relaxed Mode', relaxedHint: 'No countdowns. Speed is ignored entirely. Your choice is remembered.',
    opponent: 'Across the table', oppArchivist: 'The Archivist (the house reader)',
    oppTable: 'Across the Table (two readers, one device)',
    begin: 'Begin', back: 'Back to the Front Desk',
    you: 'You', seatA: 'Seat A', seatB: 'Seat B', archivist: 'The Archivist',
    lock: 'Enter into the Record', lockHint: 'You may change your answer until you enter it.',
    passDevice: 'Pass the device — no peeking', passHint: 'Seat A’s answer is sealed. Hand the device to Seat B.',
    seatReady: 'Seat B is ready',
    next: 'Next', seeVerdict: 'See the verdict',
    correct: 'Correct', incorrect: 'Not correct', unanswered: 'Unanswered', drawLabel: 'Draw',
    source: 'Source:', verifySource: 'Verify at source ↗',
    orderTitle: 'ORDER OF THE READING ROOM',
    youPrevailed: 'You prevailed', archivistPrevailed: 'The Archivist prevailed', drawn: 'The sitting is drawn',
    seatAPrevailed: 'Seat A prevailed', seatBPrevailed: 'Seat B prevailed',
    roundLedger: 'Round-by-round ledger', colRound: 'Round', colYou: 'You', colOpp: 'Opponent', colResult: 'Entered',
    totals: 'Totals',
    xpEarned: 'Marks entered (XP)',
    again: 'Sit again', toDesk: 'Return to the Front Desk', toModes: 'Choose another sitting',
    routeTitle: 'The Reading Route', routeSub: 'Six questions in three chapters, untimed. State your confidence before each reveal — first choice locks.',
    chapter: 'Chapter',
    confPrompt: 'How surely do you hold this answer?',
    confSteady: 'Steady', confSteadyDesc: 'Measured. +2 if right, 0 if wrong.',
    confBold: 'Bold', confBoldDesc: 'Firm. +3 if right, −1 if wrong.',
    confCalled: 'Called', confCalledDesc: 'Certain. +4 if right, −3 if wrong.',
    routeDone: 'The Route is finished', routePoints: 'Route marks',
    checkTitle: 'WhatsApp Check', checkSub: 'Five forwards from the family group. True or false — then the official record.',
    recordTitle: 'The Record Shows', recordSub: 'Two popular framings of one event. Both are flawed. Pick what the record shows.',
    trueL: 'True', falseL: 'False',
    debunkTrue: 'THE RECORD: TRUE', debunkFalse: 'THE RECORD: FALSE',
    partialNote: 'Partial credit: both popular versions are indeed mistaken.',
    passTitle: 'Reader’s Pass', standing: 'Standing', sealsShelf: 'The Seal Shelf',
    statsTitle: 'Borrowing Ledger',
    stDuels: 'Sittings completed', stPrevailed: 'Prevailed', stDrawn: 'Drawn', stDays: 'Days on the shelf (30)', stStreak: 'Days in a row', stXP: 'Marks (XP)',
    fName: 'Reader', fTitle: 'Title', fSince: 'On the shelf since',
    editName: 'Edit', saveName: 'Save',
    certBtn: 'Print certificate', shareBtn: 'Share on WhatsApp', copyBtn: 'Copy share text', copied: 'Copied to the clipboard.',
    sound: 'Sound', soundHint: 'A dry stamp thud and a page rustle. Off by default.',
    lang: 'Language / भाषा',
    toNext: 'marks to', calibrationLine: 'Calibration ledger',
    ob1Title: 'Welcome to the Reading Room',
    ob1Body: 'SABHA is a quiet place to test what you know of India’s history and civics. One practice sitting will show you everything — one idea at a time.',
    ob1Btn: 'Begin the practice sitting',
    obHint1: 'Tap the answer you think is right — there is no penalty for trying. The Archivist is reading alongside you.',
    obLockHint: 'Changed your mind? Tap another line. Only “Enter into the Record” is final.',
    obSourceTitle: 'Every answer shows its source',
    obSourceBody: 'After each answer the archive opens its catalog card — the institution and a two-line note. Credibility is a feature here.',
    obScoreTitle: 'How the record is kept',
    obScoreBody: 'Correct answers enter the record (20 marks); trying earns 5. Prevailing in a sitting earns 50. Marks raise your standing: Pathak, Vidvan, Acharya, Maha-Vidvan.',
    obDone: 'Take your seat at the Front Desk',
    practiceLabel: 'PRACTICE SITTING',
    quit: 'Leave the sitting',
    verdictAccess: 'READING ROOM RECORD · ACCESSION No. ',
    sharePre: 'SABHA — The Reading Room: ',
    shareTail: ' Dispute this record.',
    modeSingle: 'A Single Sitting', modeSingleRules: 'One question · 10 seconds',
    modeBo3: 'Best of Three Sittings', modeBo3Rules: 'First to 2 rounds · 7 seconds',
    modeFull: 'The Full Session', modeFullRules: 'Five rounds, score decides · 5 seconds',
    modeRoute: 'Reading Route', modeRouteRules: 'Six questions, three chapters · confidence ladder · untimed',
    modeCheck: 'WhatsApp Check', modeCheckRules: 'Five viral forwards · True or False · official debunk after each',
    modeRecord: 'The Record Shows', modeRecordRules: 'Three contested memories · pick what the record shows'
  },
  hi: {
    navDesk: 'फ्रंट डेस्क', navModes: 'बैठकें', navPass: 'पाठक पास',
    colophonLine: 'एक ज्ञान-खेल। न पैसा, न जुआ, न विज्ञापन। हर उत्तर अपना स्रोत दिखाता है।',
    tagline: 'जहाँ भारत परखता है कि वह क्या जानता है।',
    estLine: 'स्थापना MMXXIV · प्रवेश संख्या ',
    todaysDuel: 'आज की नई सूची', opponentTier: 'प्रतिद्वंद्वी: अभिलेखागारिक · सौम्य हाथ',
    enterRoom: 'पाठक कक्ष में प्रवेश करें',
    catIndex: 'वर्गों की सूची', catHint: 'एक शेल्फ चुनिए — उसी से एकल बैठक निकलेगी।',
    lastThirty: 'आपकी शेल्फ — पिछले 30 दिन',
    modesTitle: 'बैठक चुनिए', modesSub: 'द्वंद्व के छह रूप। समय-सीमा एक बारिक रेखा है, पिंजरा नहीं।',
    relaxed: 'आराम मोड', relaxedHint: 'कोई उल्टी गिनती नहीं। गति की पूरी अनदेखी। आपकी पसंद याद रखी जाती है।',
    opponent: 'मेज़ के उस पार', oppArchivist: 'अभिलेखागारिक (गृह-पाठक)',
    oppTable: 'मेज़ के उस पार (दो पाठक, एक यंत्र)',
    begin: 'शुरू करें', back: 'फ्रंट डेस्क पर लौटें',
    you: 'आप', seatA: 'पहली सीट', seatB: 'दूसरी सीट', archivist: 'अभिलेखागारिक',
    lock: 'अभिलेख में दर्ज करें', lockHint: 'दर्ज करने तक आप उत्तर बदल सकते हैं।',
    passDevice: 'यंत्र सौंपिए — झाँकना मना है', passHint: 'पहली सीट का उत्तर मुहरबंद है। यंत्र दूसरी सीट को दीजिए।',
    seatReady: 'दूसरी सीट तैयार है',
    next: 'आगे', seeVerdict: 'निर्णय देखिए',
    correct: 'सही', incorrect: 'सही नहीं', unanswered: 'अनुत्तरित', drawLabel: 'बराबर',
    source: 'स्रोत:', verifySource: 'स्रोत पर जाँचें ↗',
    orderTitle: 'पाठक कक्ष का आदेश',
    youPrevailed: 'आप विजयी रहे', archivistPrevailed: 'अभिलेखागारिक विजयी रहे', drawn: 'बैठक बराबर रही',
    seatAPrevailed: 'पहली सीट विजयी रही', seatBPrevailed: 'दूसरी सीट विजयी रही',
    roundLedger: 'चरण-दर-चरण बही', colRound: 'चरण', colYou: 'आप', colOpp: 'प्रतिद्वंद्वी', colResult: 'दर्ज',
    totals: 'योग',
    xpEarned: 'दर्ज अंक (XP)',
    again: 'फिर बैठिए', toDesk: 'फ्रंट डेस्क पर लौटें', toModes: 'दूसरी बैठक चुनिए',
    routeTitle: 'पठन-मार्ग', routeSub: 'तीन अध्यायों में छह प्रश्न, बिना समय-सीमा। हर उत्तर से पहले अपना भरोसा बताइए — पहली पसंद अंतिम।',
    chapter: 'अध्याय',
    confPrompt: 'आप अपने उत्तर को कितनी सच्चाई से थामते हैं?',
    confSteady: 'स्थिर', confSteadyDesc: 'संयत। सही पर +2, गलत पर 0।',
    confBold: 'साहसिक', confBoldDesc: 'दृढ़। सही पर +3, गलत पर −1।',
    confCalled: 'निश्चित', confCalledDesc: 'पूरा भरोसा। सही पर +4, गलत पर −3।',
    routeDone: 'पठन-मार्ग पूर्ण हुआ', routePoints: 'मार्ग के अंक',
    checkTitle: 'व्हाट्सऐप जाँच', checkSub: 'परिवार-समूह के पाँच संदेश। सही या गलत — फिर आधिकारिक अभिलेख।',
    recordTitle: 'अभिलेख क्या कहता है', recordSub: 'एक घटना की दो लोकप्रिय कहानियाँ। दोनों में त्रुटि है। चुनिए कि अभिलेख क्या दिखाता है।',
    trueL: 'सही', falseL: 'गलत',
    debunkTrue: 'अभिलेख: सही', debunkFalse: 'अभिलेख: गलत',
    partialNote: 'आंशिक अंक: दोनों लोकप्रिय कथन सचमुच त्रुटिपूर्ण हैं।',
    passTitle: 'पाठक पास', standing: 'स्थिति', sealsShelf: 'मुहर-शेल्फ',
    statsTitle: 'उधार-बही',
    stDuels: 'पूर्ण बैठकें', stPrevailed: 'विजय', stDrawn: 'बराबर', stDays: 'शेल्फ पर दिन (30)', stStreak: 'लगातार दिन', stXP: 'अंक (XP)',
    fName: 'पाठक', fTitle: 'उपाधि', fSince: 'शेल्फ पर तारीख',
    editName: 'बदलिए', saveName: 'सहेजिए',
    certBtn: 'प्रमाणपत्र छापिए', shareBtn: 'व्हाट्सऐप पर साझा करें', copyBtn: 'साझा-पाठ नक़ल करें', copied: 'क्लिपबोर्ड पर नक़ल हुआ।',
    sound: 'ध्वनि', soundHint: 'मुहर की मंद थाप और पन्ने की सरसराहट। डिफ़ॉल्ट रूप से बंद।',
    lang: 'Language / भाषा',
    toNext: 'अंक शेष, अगली उपाधि:', calibrationLine: 'माप-बही',
    ob1Title: 'पाठक कक्ष में स्वागत है',
    ob1Body: 'SABHA भारत के इतिहास और नागरिक-शास्त्र का ज्ञान परखने का शांत स्थान है। एक अभ्यास-बैठक सब कुछ सिखा देगी — एक बार में एक ही बात।',
    ob1Btn: 'अभ्यास-बैठक शुरू करें',
    obHint1: 'जो उत्तर सही लगे, उसे छुइए — प्रयास की कोई क़ीमत नहीं। अभिलेखागारिक साथ पढ़ रहा है।',
    obLockHint: 'मन बदला? दूसरी पंक्ति छुइए। केवल “अभिलेख में दर्ज करें” ही अंतिम है।',
    obSourceTitle: 'हर उत्तर अपना स्रोत दिखाता है',
    obSourceBody: 'हर उत्तर के बाद अभिलेखागार अपना सूची-पत्र खोलता है — संस्था और दो पंक्तियों की टिप्पणी। यहाँ विश्वसनीयता ही सुविधा है।',
    obScoreTitle: 'अभिलेख कैसे रखा जाता है',
    obScoreBody: 'सही उत्तर अभिलेख में दर्ज होते हैं (20 अंक); प्रयास पर 5। बैठक जीतने पर 50। अंक आपकी उपाधि बढ़ाते हैं: पाठक, विद्वान, आचार्य, महा-विद्वान।',
    obDone: 'फ्रंट डेस्क पर अपनी सीट लीजिए',
    practiceLabel: 'अभ्यास-बैठक',
    quit: 'बैठक छोड़ें',
    verdictAccess: 'पाठक कक्ष अभिलेख · प्रवेश संख्या ',
    sharePre: 'SABHA — पाठक कक्ष: ',
    shareTail: ' इस अभिलेख को चुनौती दीजिए।',
    modeSingle: 'एकल बैठक', modeSingleRules: 'एक प्रश्न · 10 सेकंड',
    modeBo3: 'तीन में से श्रेष्ठ', modeBo3Rules: 'पहले 2 चरण · 7 सेकंड',
    modeFull: 'पूर्ण सत्र', modeFullRules: 'पाँच चरण, अंक तय करेंगे · 5 सेकंड',
    modeRoute: 'पठन-मार्ग', modeRouteRules: 'छह प्रश्न, तीन अध्याय · भरोसा-सीढ़ी · बिना समय-सीमा',
    modeCheck: 'व्हाट्सऐप जाँच', modeCheckRules: 'पाँच वायरल संदेश · सही या गलत · हर एक के बाद आधिकारिक खंडन',
    modeRecord: 'अभिलेख क्या कहता है', modeRecordRules: 'तीन विवादित स्मृतियाँ · चुनिए कि अभिलेख क्या दिखाता है'
  }
};
function t(key) {
  var dict = STR[S.lang] || STR.en;
  return dict[key] != null ? dict[key] : (STR.en[key] != null ? STR.en[key] : key);
}
function applyChrome() {
  document.documentElement.lang = S.lang === 'hi' ? 'hi' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
}

/* ---------------- Sound (WebAudio synth, off by default) ---------------- */
var AC = null;
function audioCtx() {
  if (!S.sound) return null;
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function stampThud() {
  var ac = audioCtx(); if (!ac) return;
  var t0 = ac.currentTime;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(90, t0);
  o.frequency.exponentialRampToValueAtTime(48, t0 + 0.12);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.012); /* felt attack */
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + 0.3);
  /* soft knock of the desk */
  var nb = ac.createBuffer(1, ac.sampleRate * 0.08, ac.sampleRate), d = nb.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  var ns = ac.createBufferSource(); ns.buffer = nb;
  var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
  var ng = ac.createGain(); ng.gain.setValueAtTime(0.25, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  ns.connect(lp).connect(ng).connect(ac.destination); ns.start(t0);
}
function pageRustle() {
  var ac = audioCtx(); if (!ac) return;
  var t0 = ac.currentTime, dur = 0.28;
  var nb = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = nb.getChannelData(0);
  for (var i = 0; i < d.length; i++) {
    var p = i / d.length;
    d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * p) * 0.5; /* no click attack */
  }
  var ns = ac.createBufferSource(); ns.buffer = nb;
  var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.6;
  var g = ac.createGain(); g.gain.setValueAtTime(0.12, t0);
  ns.connect(bp).connect(g).connect(ac.destination); ns.start(t0);
}
function bellPartial() { /* single low brass harmonic, 600ms decay — with correct stamp */
  var ac = audioCtx(); if (!ac) return;
  var t0 = ac.currentTime;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = 392;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + 0.62);
}
function pencilScratch() {
  var ac = audioCtx(); if (!ac) return;
  var t0 = ac.currentTime, dur = 0.14;
  var nb = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = nb.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  var ns = ac.createBufferSource(); ns.buffer = nb;
  var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
  var g = ac.createGain(); g.gain.setValueAtTime(0.08, t0);
  ns.connect(hp).connect(g).connect(ac.destination); ns.start(t0);
}

/* ---------------- Wax seal SVG (irregular edge, 4–6 nubs) ---------------- */
function sealSVG(size, earned, rotDeg) {
  var nubs = 4 + Math.floor(Math.random() * 3); /* 4–6 */
  var cx = 50, cy = 50, R = 42;
  var pts = [];
  var steps = nubs * 7;
  for (var i = 0; i <= steps; i++) {
    var a = (i / steps) * Math.PI * 2;
    var nub = Math.abs(Math.sin((i / steps) * Math.PI * nubs));
    var jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    var r = R - 6 + nub * 6 + jitter * 2.4;
    pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
  }
  var fill = earned ? '#A8372A' : 'none';
  var edge = earned ? '#7E2A20' : '#C9BC9C';
  var face = earned ? '#F5E9CF' : '#55503F';
  var faint = earned ? '' : ' opacity="0.45"';
  return '<svg class="seal-svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '"' + faint +
    ' style="transform:rotate(' + (rotDeg || 0) + 'deg)" role="img" aria-hidden="true">' +
    '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="' + edge + '" stroke-width="2"/>' +
    (earned ? '' : '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#211D18" stroke-width="0.5" opacity="0.35" transform="translate(0.6,0.8)"/>') +
    '<circle cx="50" cy="50" r="28" fill="none" stroke="' + face + '" stroke-width="1.5"/>' +
    '<text x="50" y="58" text-anchor="middle" font-family="Rozha One, Noto Serif Devanagari, serif" font-size="26" fill="' + face + '">सभा</text>' +
    '</svg>';
}
function pressSeal(host, size, soundOn) {
  /* 420ms two-phase settle, ±2° rotation variance, ink-ring bloom, desk thud */
  var rot = (Math.random() * 4 - 2).toFixed(1);
  var seal = el('div', 'seal stamped');
  seal.style.setProperty('--seal-rot', rot + 'deg');
  seal.innerHTML = sealSVG(size, true, 0);
  var ring = el('div', 'ink-ring bloom');
  host.innerHTML = '';
  host.appendChild(seal); host.appendChild(ring);
  if (soundOn !== false) stampThud();
  return seal;
}

/* ---------------- Router ---------------- */
var ROUTES = {};
var currentRoute = null;
function nav(hash, opts) {
  opts = opts || {};
  var target = '#' + hash;
  if (location.hash === target) { render(hash, opts); return; }
  pendingOpts = opts;
  location.hash = target;
}
var pendingOpts = null;
function routeFromHash() {
  var h = (location.hash || '').replace(/^#\/?/, '');
  return h || (S.onboarded ? 'home' : 'onboarding');
}
function render(route, opts) {
  if (!S.onboarded && route !== 'onboarding') route = 'onboarding'; /* first session is the guided practice */
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

/* ---------------- Shared chrome builders ---------------- */
function sectionHead(parent, labelText, titleText, subText) {
  var wrap = el('div', 'section-head');
  var hr = el('hr', 'gilt-rule'); hr.setAttribute('aria-hidden', 'true');
  wrap.appendChild(hr);
  wrap.appendChild(el('p', 'label', labelText));
  var h = el('h2', 'track-in', titleText);
  wrap.appendChild(h);
  if (subText) wrap.appendChild(el('p', 'sub', subText));
  parent.appendChild(wrap);
  return wrap;
}
function sourceCard(parent, q) {
  var card = el('div', 'card source-card');
  var p = el('p', 'src-line');
  var strong = el('strong', null, t('source') + ' ');
  p.appendChild(strong);
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
function tickRail(parent) {
  var wrap = el('div', 'tick-rail-wrap');
  wrap.appendChild(el('p', 'label ink', t('lastThirty')));
  var rail = el('div', 'tick-rail');
  rail.setAttribute('role', 'img');
  rail.setAttribute('aria-label', t('lastThirty'));
  var todayK = dayKey();
  for (var i = 29; i >= 0; i--) {
    var d = new Date(Date.now() - i * DAY_MS);
    var k = dayKey(d);
    var tick = el('span', 'tick' + (S.days[k] ? ' active' : '') + (k === todayK && S.days[k] ? ' today' : ''));
    tick.title = k;
    rail.appendChild(tick);
  }
  wrap.appendChild(rail);
  parent.appendChild(wrap);
  return wrap;
}

/* ==========================================================================
   SCREEN 0 — ONBOARDING (guided practice, one concept per step)
   ========================================================================== */
var OB = { step: 0, q: null, botDone: false, botCorrect: false, picked: -1, locked: false, botTimer: null };

ROUTES.onboarding = function (root) {
  OB = { step: OB.step || 0, q: OB.q, botDone: false, botCorrect: false, picked: -1, locked: false };
  if (OB.step === 1 && !OB.q) {
    OB.q = (window.SABHA_QUESTIONS || []).filter(function (q) { return q.mode === 'duel' && q.difficulty === 1; })[0];
  }
  drawOnboarding(root);
};

function drawOnboarding(root) {
  root.innerHTML = '';
  var wrap = el('div', 'onboard');

  if (OB.step === 0) {
    var card = el('div', 'card');
    card.appendChild(el('p', 'onboard-step-no', t('practiceLabel') + ' · 1 / 3'));
    card.appendChild(el('h1', null, t('ob1Title')));
    card.appendChild(el('p', null, t('ob1Body')));
    var b = el('button', 'btn btn-lac', t('ob1Btn'));
    b.addEventListener('click', function () { pageRustle(); OB.step = 1; OB.q = null; render('onboarding'); });
    card.appendChild(el('div', 'actions')).appendChild(b);
    wrap.appendChild(card);
  }

  if (OB.step === 1) {
    var q = OB.q;
    var card1 = el('div', 'card');
    var top = el('div', 'card-top');
    top.appendChild(el('span', 'label', t('practiceLabel')));
    top.appendChild(el('span', 'mono', 'No. P-001'));
    card1.appendChild(top);
    card1.appendChild(el('p', 'q-text', q.q));
    card1.appendChild(el('p', 'hint-line', OB.locked ? t('obLockHint') : t('obHint1')));

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
      });
      li.appendChild(btn);
      opts.appendChild(li);
    });
    card1.appendChild(opts);

    var lockRow = el('div', 'lock-row');
    var lockBtn = el('button', 'btn btn-lac', t('lock'));
    lockBtn.disabled = true;
    lockRow.appendChild(lockBtn);
    lockRow.appendChild(el('span', 'hint', t('lockHint')));
    card1.appendChild(lockRow);
    opts.addEventListener('click', function () { lockBtn.disabled = OB.picked < 0 || OB.locked; });

    /* the gentle bot reads alongside */
    var botDelay = 1500 + Math.random() * 2500;
    OB.botCorrect = Math.random() < 0.25;
    OB.botTimer = later(function () { OB.botDone = true; maybeOnboardReveal(card1, opts, wrap); }, botDelay);

    lockBtn.addEventListener('click', function () {
      if (OB.picked < 0) return;
      OB.locked = true;
      lockBtn.disabled = true;
      opts.querySelectorAll('.option-btn').forEach(function (b3) { b3.disabled = true; });
      maybeOnboardReveal(card1, opts, wrap);
    });

    wrap.appendChild(card1);
  }

  if (OB.step === 2) {
    var card2 = el('div', 'card');
    card2.appendChild(el('p', 'onboard-step-no', t('practiceLabel') + ' · 2 / 3'));
    card2.appendChild(el('h1', null, t('obSourceTitle')));
    card2.appendChild(el('p', null, t('obSourceBody')));
    var b2 = el('button', 'btn btn-lac', t('next'));
    b2.addEventListener('click', function () { pageRustle(); OB.step = 3; render('onboarding'); });
    card2.appendChild(el('div', 'actions')).appendChild(b2);
    wrap.appendChild(card2);
  }

  if (OB.step === 3) {
    var card3 = el('div', 'card');
    card3.appendChild(el('p', 'onboard-step-no', t('practiceLabel') + ' · 3 / 3'));
    card3.appendChild(el('h1', null, t('obScoreTitle')));
    card3.appendChild(el('p', null, t('obScoreBody')));
    var b3 = el('button', 'btn btn-lac', t('obDone'));
    b3.addEventListener('click', function () {
      S.onboarded = true; save(); pageRustle();
      OB.step = 0;
      nav('/home');
    });
    card3.appendChild(el('div', 'actions')).appendChild(b3);
    wrap.appendChild(card3);
  }

  root.appendChild(wrap);
}

function maybeOnboardReveal(card, opts, wrap) {
  if (!OB.locked || !OB.botDone || card.dataset.revealed) return;
  card.dataset.revealed = '1';
  var q = OB.q;
  var playerCorrect = OB.picked === q.answerIndex;
  opts.querySelectorAll('.option-btn').forEach(function (b, i) {
    b.classList.remove('selected');
    if (i === q.answerIndex) {
      b.classList.add('correct');
      b.querySelector('.option-state').textContent = t('correct');
      var slot = el('span', 'seal-slot');
      b.appendChild(slot);
      pressSeal(slot, 44);
      bellPartial();
    } else if (i === OB.picked) {
      b.classList.add('wrong');
      b.querySelector('.option-state').textContent = t('incorrect');
      pencilScratch();
    }
  });
  addXP(playerCorrect ? 20 : 5);
  S.sittings += 1; markToday(); checkSeals();
  sourceCard(card, q);
  announce(playerCorrect ? t('correct') : t('incorrect'));
  var b = el('button', 'btn btn-lac', t('next'));
  b.addEventListener('click', function () { pageRustle(); OB.step = 2; render('onboarding'); });
  card.appendChild(el('div', 'actions')).appendChild(b);
}

/* ==========================================================================
   SCREEN 1 — HOME · The Front Desk
   ========================================================================== */
var CATEGORIES = [
  { key: 'constitution', en: 'Constitution & Assembly', eras: ['Constituent Assembly & Constitution-Making'] },
  { key: 'freedom',      en: 'Freedom Movement',        eras: ['Colonial Period & Freedom Movement'] },
  { key: 'civics',       en: 'Civics & Elections',      eras: ['Civics/Polity'] },
  { key: 'states',       en: 'States & Regions',        eras: ['Regional & State History'] },
  { key: 'economy',      en: 'Economy & Reform',        eras: ['Economic Milestones', 'Liberalisation Era (1991–2014)', '1977–1991'] },
  { key: 'ancient',      en: 'Ancient to Mughal',       eras: ['Ancient India', 'Medieval India', 'Mughal Era'] },
  { key: 'world',        en: 'India in the World',      eras: ['India in the World', 'Contemporary Institutions (2014–today)', 'Post-Independence (1947–1977)'] }
];

ROUTES.home = function (root) {
  /* Masthead band */
  var mh = el('section', 'masthead');
  mh.setAttribute('aria-label', 'Sabha');
  var hr1 = el('hr', 'gilt-rule'); hr1.setAttribute('aria-hidden', 'true');
  mh.appendChild(hr1);
  mh.appendChild(el('h1', 'masthead-word', S.lang === 'hi' ? 'सभा' : 'SABHA'));
  mh.appendChild(el('p', 'masthead-deva', 'सभा'));
  mh.appendChild(el('p', 'masthead-tag', t('tagline')));
  mh.appendChild(el('p', 'masthead-meta', t('estLine') + String(accessionNo()).padStart(5, '0')));
  var hr2 = el('hr', 'gilt-rule'); hr2.setAttribute('aria-hidden', 'true');
  mh.appendChild(hr2);
  root.appendChild(mh);

  var grid = el('div', 'front-desk-grid');

  /* Today's duel — catalog card, rotated −0.6° off the grid */
  var bank = duelBank();
  var todayQ = bank[Math.floor(Date.now() / DAY_MS) % bank.length];
  var card = el('div', 'card card-break today-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'label', t('todaysDuel')));
  top.appendChild(el('span', 'mono', 'No. ' + String(accessionNo()).padStart(5, '0') + '-A'));
  card.appendChild(top);
  card.appendChild(el('p', 'q-tease', todayQ.q));
  card.appendChild(el('p', 'small muted', todayQ.era + ' · ' + t('opponentTier')));
  var enter = el('button', 'btn btn-lac', t('enterRoom'));
  enter.addEventListener('click', function () {
    pageRustle();
    startDuel({ mode: 'single', opponent: 'archivist', pool: [todayQ] });
  });
  card.appendChild(enter);
  grid.appendChild(card);

  /* Ledger index of categories */
  var idxWrap = el('div');
  idxWrap.appendChild(el('p', 'label', t('catIndex')));
  idxWrap.appendChild(el('p', 'small muted', t('catHint')));
  var ul = el('ul', 'ledger');
  CATEGORIES.forEach(function (c, i) {
    var li = el('li', 'ledger-row');
    var btn = el('button', 'ledger-btn');
    btn.type = 'button';
    btn.appendChild(el('span', 'ledger-idx', String(i + 1).padStart(2, '0')));
    btn.appendChild(el('span', 'ledger-name', c.en));
    var count = bank.filter(function (q) { return c.eras.indexOf(q.era) >= 0; }).length;
    btn.appendChild(el('span', 'ledger-count', fmt(count) + ' · L1–L4'));
    btn.addEventListener('click', function () {
      pageRustle();
      var pool = bank.filter(function (q) { return c.eras.indexOf(q.era) >= 0; });
      startDuel({ mode: 'single', opponent: 'archivist', pool: shuffle(pool).slice(0, 1) });
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });
  idxWrap.appendChild(ul);
  grid.appendChild(idxWrap);
  root.appendChild(grid);

  tickRail(root);
};

/* ==========================================================================
   SCREEN 2 — MODE SELECT
   ========================================================================== */
var MODES = [
  { id: 'single', nameK: 'modeSingle', rulesK: 'modeSingleRules', timed: true },
  { id: 'bo3',    nameK: 'modeBo3',    rulesK: 'modeBo3Rules',    timed: true },
  { id: 'full',   nameK: 'modeFull',   rulesK: 'modeFullRules',   timed: true },
  { id: 'route',  nameK: 'modeRoute',  rulesK: 'modeRouteRules',  timed: false },
  { id: 'check',  nameK: 'modeCheck',  rulesK: 'modeCheckRules',  timed: false },
  { id: 'record', nameK: 'modeRecord', rulesK: 'modeRecordRules', timed: false }
];
var modeChoice = { opponent: 'archivist' };

ROUTES.modes = function (root) {
  sectionHead(root, t('navModes'), t('modesTitle'), t('modesSub'));

  /* Relaxed Mode — visible before every timed duel, persisted */
  var rb = el('div', 'relaxed-bar');
  var rc = el('div', 'relaxed-copy');
  rc.appendChild(el('p', 'label', t('relaxed')));
  rc.appendChild(el('p', 'hint', t('relaxedHint')));
  rb.appendChild(rc);
  var tog = el('button', 'toggle');
  tog.type = 'button';
  tog.setAttribute('role', 'switch');
  tog.setAttribute('aria-checked', String(S.relaxed));
  tog.setAttribute('aria-label', t('relaxed'));
  tog.appendChild(el('span', 'visually-hidden', t('relaxed')));
  tog.addEventListener('click', function () {
    S.relaxed = !S.relaxed; save();
    tog.setAttribute('aria-checked', String(S.relaxed));
  });
  rb.appendChild(tog);
  root.appendChild(rb);

  /* Opponent */
  var ow = el('div', 'stack');
  ow.appendChild(el('p', 'label', t('opponent')));
  var orow = el('div', 'opponent-row');
  [['archivist', t('oppArchivist')], ['table', t('oppTable')]].forEach(function (pair) {
    var b = el('button', 'btn', pair[1]);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(modeChoice.opponent === pair[0]));
    b.addEventListener('click', function () {
      modeChoice.opponent = pair[0];
      orow.querySelectorAll('.btn').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
    });
    orow.appendChild(b);
  });
  ow.appendChild(orow);
  root.appendChild(ow);

  /* Mode ledger */
  var ul = el('ul', 'mode-list');
  MODES.forEach(function (m) {
    var li = el('li', 'mode-row');
    var info = el('div');
    info.appendChild(el('p', 'mode-name', t(m.nameK)));
    info.appendChild(el('p', 'mode-rules', t(m.rulesK)));
    li.appendChild(info);
    var b = el('button', 'btn' + (m.id === 'single' ? ' btn-lac' : ''), t('begin'));
    b.type = 'button';
    b.addEventListener('click', function () {
      pageRustle();
      if (m.id === 'route') startRoute();
      else if (m.id === 'check') startCheck();
      else if (m.id === 'record') startRecord();
      else startDuel({ mode: m.id, opponent: modeChoice.opponent });
    });
    li.appendChild(b);
    ul.appendChild(li);
  });
  root.appendChild(ul);

  var back = el('button', 'btn btn-quiet', t('back'));
  back.addEventListener('click', function () { nav('/home'); });
  root.appendChild(el('div', 'actions')).appendChild(back);
};

/* ==========================================================================
   SCREEN 3 — DUEL ARENA · The Bench
   ========================================================================== */
function duelBank() {
  return (window.SABHA_QUESTIONS || []).filter(function (q) { return q.mode === 'duel'; });
}

var D = null; /* active duel session */

function startDuel(opts) {
  var bank = duelBank();
  var counts = { single: 1, bo3: 3, full: 5 };
  var n = counts[opts.mode] || 1;
  var pool = opts.pool ? opts.pool.slice() : shuffle(bank).slice(0, n);
  if (pool.length < n) {
    var rest = shuffle(bank.filter(function (q) { return pool.indexOf(q) < 0; }));
    pool = pool.concat(rest.slice(0, n - pool.length));
  }
  D = {
    mode: opts.mode,
    opponent: opts.opponent || 'archivist',
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
  head.appendChild(el('p', 'label', modeName + ' · ' + (D.relaxed ? t('relaxed') : fmt(D.timerMs / 1000) + 's')));
  var quit = el('button', 'btn btn-quiet', t('quit'));
  quit.addEventListener('click', function () { teardownSession(); D = null; nav('/modes'); });
  head.appendChild(quit);
  root.appendChild(head);

  /* The bench: two readers, one spine */
  var bench = el('div', 'bench');
  var sideA = benchSide(t(D.opponent === 'table' ? 'seatA' : 'you'), 'READER No. 01147');
  bench.appendChild(sideA.wrap);
  bench.appendChild(el('div', 'bench-spine'));
  var sideB = benchSide(D.opponent === 'table' ? t('seatB') : t('archivist'), D.opponent === 'table' ? 'READER No. 01148' : 'HOUSE READER');
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

  /* Hairline timer (or relaxed note) */
  var t0 = performance.now();
  if (!D.relaxed && !(D.opponent === 'table')) {
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
      every(function () {
        left -= 1;
        if (left >= 0) figs.textContent = String(left);
      }, 1000);
    }, Math.max(0, D.timerMs - 5000));
    later(function () {
      R.expired = true;
      if (!R.aLocked) maybeResolve();
    }, D.timerMs);
  } else {
    zone.appendChild(el('p', 'timer-relaxed', D.relaxed ? t('relaxed') + ' — · —' : '· — ·'));
  }

  /* Question card — reserved space, visibility-gated reveal via double rAF */
  var card = el('div', 'card q-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'label', R.q.era));
  top.appendChild(el('span', 'mono', 'No. ' + R.q.id.toUpperCase() + ' · L' + R.q.difficulty));
  card.appendChild(top);
  var qText = el('p', 'q-text', R.q.q);
  qText.style.visibility = 'hidden';
  card.appendChild(qText);

  var opts = el('ol', 'options');
  R.q.options.forEach(function (opt, i) {
    var li = el('li', 'option-row');
    li.style.animationDelay = (i * 60) + 'ms';
    li.classList.add('deal');
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
  var lockBtn = el('button', 'btn btn-lac', t('lock'));
  lockBtn.disabled = true;
  lockBtn.addEventListener('click', onLock);
  lockRow.appendChild(lockBtn);
  lockRow.appendChild(el('span', 'hint', t('lockHint')));
  card.appendChild(lockRow);
  zone.appendChild(card);
  R.ui = { card: card, opts: opts, lockBtn: lockBtn, t0: t0 };

  /* double-rAF: reserve space first, then blur-to-sharp develop (no layout shift) */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      qText.style.visibility = '';
      qText.classList.add('develop');
      pageRustle();
    });
  });

  /* Opponent behaviour */
  D.ui.sideA.mark.textContent = '';
  if (D.opponent === 'archivist') {
    D.ui.sideB.mark.textContent = '· · ·';
    var delay = D.relaxed
      ? 1500 + Math.random() * 2500
      : 1000 + Math.random() * Math.max(500, D.timerMs - 1500);
    R.bTime = Math.round(delay);
    R.botCorrect = Math.random() < 0.25;
    R.bSel = R.botCorrect ? R.q.answerIndex : pickWrong(R.q);
    later(function () { R.botDone = true; R.bLocked = true; maybeResolve(); }, delay);
  } else {
    /* Across the Table: Seat A answers first */
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

    if (D.opponent === 'table' && R.phase === 'a') {
      /* shield: pass the device */
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
    pageRustle();
    D.cur.phase = 'b';
    D.ui.sideA.mark.textContent = '✓ sealed';
    drawRoundSeatB();
  });
  sh.appendChild(el('div', 'actions')).appendChild(b);
  zone.appendChild(sh);
}

function drawRoundSeatB() {
  /* same question, Seat B answers — no timer in table mode (fairness across hand-off) */
  var R = D.cur, zone = D.ui.zone;
  zone.innerHTML = '';
  zone.appendChild(el('p', 'timer-relaxed', t('seatB') + ' · — ·'));
  var card = el('div', 'card q-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'label', R.q.era));
  top.appendChild(el('span', 'mono', 'No. ' + R.q.id.toUpperCase() + ' · L' + R.q.difficulty));
  card.appendChild(top);
  var qText = el('p', 'q-text develop', R.q.q);
  card.appendChild(qText);
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
  var lockBtn = el('button', 'btn btn-lac', t('lock'));
  lockBtn.disabled = true;
  lockBtn.addEventListener('click', function () {
    if (R.bSel < 0 || R.bLocked) return;
    R.bLocked = true;
    R.bTime = Math.round(performance.now() - R.t0b);
    lockBtn.disabled = true;
    opts.querySelectorAll('.option-btn').forEach(function (b) { b.disabled = true; });
    maybeResolve();
  });
  lockRow.appendChild(lockBtn);
  lockRow.appendChild(el('span', 'hint', t('lockHint')));
  card.appendChild(lockRow);
  zone.appendChild(card);
  R.t0b = performance.now();
  R.ui = { card: card, opts: opts, lockBtn: lockBtn };
  pageRustle();
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
  var bReady = R.bLocked || (D.opponent === 'archivist' && R.botDone) || R.expired;
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
  if (Math.abs(aTime - bTime) <= 150) return 'draw';
  return aTime < bTime ? 'a' : 'b';
}

function resolveRound() {
  var R = D.cur;
  R.revealed = true;
  teardownSession(); /* stop timer/urgency intervals; keep nothing running */

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
  D.wins[winner === 'a' ? 'a' : winner === 'b' ? 'b' : 'a'] += winner === 'a' ? 1 : 0;
  if (winner === 'b') D.wins.b += 1;
  D.pts.a += aPts; D.pts.b += bPts;

  R.aCorrect = aCorrect; R.bCorrect = bCorrect;
  R.winner = winner; R.aPts = aPts; R.bPts = bPts;
  D.rounds.push(R);
  D.round += 1;

  /* XP: seat A is the account holder */
  var xp = aCorrect ? 20 : 5;
  D.xp += xp;

  /* reveal on the card the active seat last saw (for table mode re-render Seat A's card) */
  revealCard();
  updateBench();
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
    var top = el('div', 'card-top');
    top.appendChild(el('span', 'label', R.q.era));
    top.appendChild(el('span', 'mono', 'No. ' + R.q.id.toUpperCase() + ' · L' + R.q.difficulty));
    card.appendChild(top);
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
      var slot = el('span', 'seal-slot');
      b.appendChild(slot);
      pressSeal(slot, 44);
    }
    if (i === R.aSel && !R.aCorrect) {
      b.classList.add('wrong');
      b.querySelector('.option-state').textContent = t('incorrect');
    }
  });
  if (R.aCorrect) bellPartial(); else pencilScratch();

  /* opponent's mark appears as a stamped note on their side — simultaneity as two seals */
  var secs = isFinite(R.bTime) ? (R.bTime / 1000).toFixed(1) + 's' : '—';
  D.ui.sideB.mark.textContent = (D.opponent === 'table' ? t('seatB') : t('archivist')) + ': ' +
    (R.bSel < 0 ? t('unanswered') : (R.bCorrect ? t('correct') : t('incorrect'))) + ' · ' + secs;
  D.ui.sideA.mark.textContent = (D.opponent === 'table' ? t('seatA') : t('you')) + ': ' +
    (R.aSel < 0 ? t('unanswered') : (R.aCorrect ? t('correct') : t('incorrect'))) +
    (isFinite(R.aTime) ? ' · ' + (R.aTime / 1000).toFixed(1) + 's' : '');

  sourceCard(card, R.q);

  var actions = el('div', 'actions');
  var nextB = el('button', 'btn btn-lac', duelOver() ? t('seeVerdict') : t('next'));
  nextB.addEventListener('click', function () {
    pageRustle();
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
  /* outcome: rounds won decide; Full Session falls back to points */
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
  S.sittings += 1;
  S.duelsEntered += 1;
  if (outcome === 'a') S.prevailed += 1;
  if (outcome === 'draw') S.drawn += 1;
  markToday(); checkSeals(); save();

  nav('/results', { slide: true });
}

/* ==========================================================================
   SCREEN 4 — RESULTS · Entered into the Record
   ========================================================================== */
ROUTES.results = function (root) {
  if (!D || !D.rounds.length) { nav('/home'); return; }
  var isTable = D.opponent === 'table';
  var outcomeText =
    D.outcome === 'a' ? (isTable ? t('seatAPrevailed') : t('youPrevailed')) :
    D.outcome === 'b' ? (isTable ? t('seatBPrevailed') : t('archivistPrevailed')) :
    t('drawn');

  var sheet = el('div', 'verdict-sheet');
  sheet.appendChild(el('div', 'accession-stamp', t('verdictAccess') + String(accessionNo()).padStart(5, '0')));
  sheet.appendChild(el('p', 'label', t('roundLedger')));
  sheet.appendChild(el('h1', 'verdict-heading track-in', t('orderTitle')));
  sheet.appendChild(el('p', 'verdict-outcome', outcomeText + ', ' + fmt(D.wins.a) + '–' + fmt(D.wins.b)));

  /* Round-by-round ledger, triple rule above totals */
  var tbl = el('table', 'record-table');
  var thead = el('thead');
  var hr = el('tr');
  [t('colRound'), isTable ? t('seatA') : t('colYou'), isTable ? t('seatB') : t('archivist'), t('colResult'), t('source').replace(':', '')].forEach(function (h) {
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
    tr.appendChild(el('td', null, R.winner === 'draw' ? t('drawLabel') : (R.winner === 'a' ? (isTable ? t('seatA') : t('you')) : (isTable ? t('seatB') : t('archivist')))));
    var src = el('td');
    src.appendChild(el('div', 'rt-note', R.q.source));
    if (R.q.sourceUrl) {
      var vlink = el('a', 'src-verify', t('verifySource'));
      vlink.href = R.q.sourceUrl; vlink.target = '_blank'; vlink.rel = 'noopener';
      src.appendChild(vlink);
    }
    src.appendChild(el('div', 'rt-note', R.q.note));
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

  /* wax seal pressed on entry — the signature stamp */
  var sealHost = el('div', 'verdict-seal');
  sheet.appendChild(sealHost);
  later(function () { pressSeal(sealHost, 96); }, 300);
  root.appendChild(sheet);

  /* Honors board — your standing, never a loss list */
  var ti = titleFor(S.xp);
  var hb = el('div', 'stack');
  hb.appendChild(el('p', 'label', t('standing')));
  var row = el('div', 'honors-row me');
  row.appendChild(el('span', null, S.name + ' — ' + ti.title.name));
  row.appendChild(el('span', 'mono', fmt(S.xp) + ' XP'));
  hb.appendChild(row);
  root.appendChild(hb);

  var actions = el('div', 'actions');
  var again = el('button', 'btn btn-lac', t('again'));
  again.addEventListener('click', function () { pageRustle(); startDuel({ mode: D.mode, opponent: D.opponent }); });
  var toModes = el('button', 'btn', t('toModes'));
  toModes.addEventListener('click', function () { nav('/modes'); });
  var toDesk = el('button', 'btn btn-quiet', t('toDesk'));
  toDesk.addEventListener('click', function () { nav('/home'); });
  actions.appendChild(again); actions.appendChild(toModes); actions.appendChild(toDesk);
  root.appendChild(actions);

  tickRail(root);
};

/* ==========================================================================
   SCREEN 5 — READING ROUTE (expedition + confidence ladder)
   ========================================================================== */
var RT = null;
var CONF = [
  { id: 'steady', conf: 0.6, win: 2, lose: 0,  nameK: 'confSteady', descK: 'confSteadyDesc' },
  { id: 'bold',   conf: 0.75, win: 3, lose: -1, nameK: 'confBold',   descK: 'confBoldDesc' },
  { id: 'called', conf: 0.9, win: 4, lose: -3, nameK: 'confCalled', descK: 'confCalledDesc' }
];
function startRoute() {
  var bank = shuffle(duelBank());
  var picks = [];
  [1, 2, 3].forEach(function (tier) { /* 3 chapters of 2, rising difficulty */
    var inTier = bank.filter(function (q) { return q.difficulty <= tier + 1 && picks.indexOf(q) < 0; });
    picks = picks.concat(inTier.slice(0, 2));
  });
  if (picks.length < 6) picks = picks.concat(bank.filter(function (q) { return picks.indexOf(q) < 0; }).slice(0, 6 - picks.length));
  RT = { questions: picks.slice(0, 6), i: 0, points: 0, entries: [], phase: 'answer', sel: -1, confIdx: -1 };
  nav('/route');
}

ROUTES.route = function (root) {
  if (!RT) { startRoute(); return; }
  if (RT.i >= RT.questions.length) { routeSummary(root); return; }
  var q = RT.questions[RT.i];
  var chapter = Math.floor(RT.i / 2) + 1;

  sectionHead(root, t('modeRoute'), t('routeTitle'), t('routeSub'));

  var prog = el('div', 'route-progress');
  prog.setAttribute('aria-label', fmt(RT.i + 1) + ' / 6');
  RT.questions.forEach(function (_, i) {
    prog.appendChild(el('span', 'route-step' + (i < RT.i ? ' done' : i === RT.i ? ' now' : '')));
  });
  root.appendChild(prog);

  var ch = el('div', 'chapter-head');
  ch.appendChild(el('span', 'chapter-numeral', t('chapter') + ' ' + ['I', 'II', 'III'][chapter - 1]));
  root.appendChild(ch);

  var card = el('div', 'card q-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'label', q.era));
  top.appendChild(el('span', 'mono', 'No. ' + q.id.toUpperCase() + ' · L' + q.difficulty));
  card.appendChild(top);
  var qText = el('p', 'q-text', q.q);
  qText.style.visibility = 'hidden';
  card.appendChild(qText);
  requestAnimationFrame(function () { requestAnimationFrame(function () { qText.style.visibility = ''; qText.classList.add('develop'); }); });

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
      if (RT.phase !== 'answer') return;
      RT.sel = i;
      opts.querySelectorAll('.option-btn').forEach(function (b, j) { b.classList.toggle('selected', j === i); });
      ladderWrap.style.display = '';
      pageRustle();
    });
    li.appendChild(btn);
    opts.appendChild(li);
  });
  card.appendChild(opts);

  /* confidence ladder — first choice locks */
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
      if (RT.phase !== 'answer') return;
      RT.phase = 'locked'; /* first choice locks */
      RT.confIdx = i;
      b.setAttribute('aria-pressed', 'true');
      ladder.querySelectorAll('.ladder-btn').forEach(function (x) { x.disabled = true; });
      resolveRoute(card, opts);
    });
    ladder.appendChild(b);
  });
  ladderWrap.appendChild(ladder);
  card.appendChild(ladderWrap);
  root.appendChild(card);
};

function resolveRoute(card, opts) {
  var q = RT.questions[RT.i];
  var c = CONF[RT.confIdx];
  var correct = RT.sel === q.answerIndex;
  var delta = correct ? c.win : c.lose;
  RT.points = Math.max(0, RT.points + delta); /* floor at 0 */
  S.calibration.push({ conf: c.conf, hit: correct ? 1 : 0 });
  if (S.calibration.length > 300) S.calibration = S.calibration.slice(-300);
  var xp = correct ? 20 : 5;
  addXP(xp);
  RT.entries.push({ q: q, sel: RT.sel, correct: correct, conf: c, delta: delta, xp: xp });

  opts.querySelectorAll('.option-btn').forEach(function (b, i) {
    b.disabled = true;
    b.classList.remove('selected');
    if (i === q.answerIndex) {
      b.classList.add('correct');
      b.querySelector('.option-state').textContent = t('correct');
      var slot = el('span', 'seal-slot');
      b.appendChild(slot);
      pressSeal(slot, 44);
    } else if (i === RT.sel) {
      b.classList.add('wrong');
      b.querySelector('.option-state').textContent = t('incorrect');
    }
  });
  if (correct) bellPartial(); else pencilScratch();
  sourceCard(card, q);

  var actions = el('div', 'actions');
  var nb = el('button', 'btn btn-lac', RT.i + 1 >= RT.questions.length ? t('seeVerdict') : t('next'));
  nb.addEventListener('click', function () {
    pageRustle();
    RT.i += 1; RT.phase = 'answer'; RT.sel = -1; RT.confIdx = -1;
    render('route');
  });
  actions.appendChild(nb);
  card.appendChild(actions);
  announce(correct ? t('correct') : t('incorrect'));
}

function routeSummary(root) {
  addXP(40); /* route complete */
  awardSeal('routeFinished');
  S.sittings += 1; markToday(); checkSeals(); save();

  var sheet = el('div', 'verdict-sheet');
  sheet.appendChild(el('div', 'accession-stamp', t('verdictAccess') + String(accessionNo()).padStart(5, '0')));
  sheet.appendChild(el('p', 'label', t('modeRoute')));
  sheet.appendChild(el('h1', 'verdict-heading track-in', t('routeDone')));
  sheet.appendChild(el('p', 'verdict-outcome', t('routePoints') + ': ' + fmt(RT.points)));

  var tbl = el('table', 'record-table');
  var tb = el('tbody');
  RT.entries.forEach(function (e, i) {
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
  trT.appendChild(el('td', 'num', fmt(RT.points)));
  trT.appendChild(el('td', 'num', t('xpEarned') + ': +' + fmt(RT.entries.reduce(function (s, e) { return s + e.xp; }, 0) + 40)));
  tb.appendChild(trT);
  tbl.appendChild(tb);
  sheet.appendChild(tbl);

  var sealHost = el('div', 'verdict-seal');
  sheet.appendChild(sealHost);
  later(function () { pressSeal(sealHost, 96); }, 300);
  root.appendChild(sheet);

  var actions = el('div', 'actions');
  var again = el('button', 'btn btn-lac', t('again'));
  again.addEventListener('click', function () { pageRustle(); startRoute(); });
  var toModes = el('button', 'btn', t('toModes'));
  toModes.addEventListener('click', function () { nav('/modes'); });
  actions.appendChild(again); actions.appendChild(toModes);
  root.appendChild(actions);
  RT = null;
}

/* ==========================================================================
   SCREEN 6a — WHATSAPP CHECK
   ========================================================================== */
var CK = null;
function startCheck() {
  CK = { items: (window.SABHA_QUESTIONS || []).filter(function (q) { return q.mode === 'check'; }), i: 0, score: 0, sel: -1 };
  nav('/check');
}
ROUTES.check = function (root) {
  if (!CK) { startCheck(); return; }
  if (CK.i >= CK.items.length) { checkSummary(root); return; }
  var q = CK.items[CK.i];

  sectionHead(root, t('modeCheck'), t('checkTitle'), t('checkSub'));
  root.appendChild(el('p', 'mono muted', fmt(CK.i + 1) + ' / ' + fmt(CK.items.length)));

  var card = el('div', 'card q-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'label', t('modeCheck')));
  top.appendChild(el('span', 'mono', 'No. ' + q.id.toUpperCase()));
  card.appendChild(top);
  card.appendChild(el('p', 'q-text', q.q));

  var tf = el('div', 'tf-row');
  [1, 0].forEach(function (val, pos) { /* True (1) / False (0) */
    var b = el('button', 'tf-btn', pos === 0 ? t('trueL') : t('falseL'));
    b.type = 'button';
    b.addEventListener('click', function () {
      if (CK.sel >= 0) return;
      CK.sel = val;
      var picked = val === 1 ? 0 : 1; /* answerIndex 1 = "False" is the second option */
      var correctIdx = q.answerIndex === 1 ? 1 : 0;
      var isCorrect = picked === correctIdx;
      if (isCorrect) CK.score += 1;
      addXP(isCorrect ? 20 : 5);
      tf.querySelectorAll('.tf-btn').forEach(function (x, j) {
        x.disabled = true;
        if (j === correctIdx) { x.classList.add('correct'); x.textContent += ' — ' + t('correct'); }
        else if (j === picked) { x.classList.add('wrong'); x.textContent += ' — ' + t('incorrect'); }
      });
      if (isCorrect) { pressSealInline(card); bellPartial(); } else pencilScratch();
      var flag = el('p', 'debunk-flag ' + (q.answerIndex === 1 ? 'false' : 'true'),
        q.answerIndex === 1 ? t('debunkFalse') : t('debunkTrue'));
      card.appendChild(flag);
      sourceCard(card, q);
      var actions = el('div', 'actions');
      var nb = el('button', 'btn btn-lac', CK.i + 1 >= CK.items.length ? t('seeVerdict') : t('next'));
      nb.addEventListener('click', function () { pageRustle(); CK.i += 1; CK.sel = -1; render('check'); });
      actions.appendChild(nb);
      card.appendChild(actions);
      announce(isCorrect ? t('correct') : t('incorrect'));
    });
    tf.appendChild(b);
  });
  card.appendChild(tf);
  root.appendChild(card);
};
function pressSealInline(card) {
  var slot = el('div', 'seal-slot');
  slot.style.marginTop = '16px';
  card.appendChild(slot);
  pressSeal(slot, 56);
}
function checkSummary(root) {
  var myth = CK.score >= 4;
  if (myth) awardSeal('mythBuster');
  S.sittings += 1; markToday(); checkSeals(); save();
  var sheet = el('div', 'verdict-sheet');
  sheet.appendChild(el('div', 'accession-stamp', t('verdictAccess') + String(accessionNo()).padStart(5, '0')));
  sheet.appendChild(el('p', 'label', t('modeCheck')));
  sheet.appendChild(el('h1', 'verdict-heading track-in', t('checkTitle')));
  sheet.appendChild(el('p', 'verdict-outcome', fmt(CK.score) + ' / ' + fmt(CK.items.length) + (myth ? ' · Myth-Buster' : '')));
  var sealHost = el('div', 'verdict-seal');
  sheet.appendChild(sealHost);
  later(function () { pressSeal(sealHost, 96); }, 300);
  root.appendChild(sheet);
  var actions = el('div', 'actions');
  var toModes = el('button', 'btn btn-lac', t('toModes'));
  toModes.addEventListener('click', function () { nav('/modes'); });
  actions.appendChild(toModes);
  root.appendChild(actions);
  CK = null;
}

/* ==========================================================================
   SCREEN 6b — THE RECORD SHOWS
   ========================================================================== */
var RS = null;
function startRecord() {
  RS = { items: (window.SABHA_QUESTIONS || []).filter(function (q) { return q.mode === 'record'; }), i: 0, points: 0, sel: -1 };
  nav('/record');
}
ROUTES.record = function (root) {
  if (!RS) { startRecord(); return; }
  if (RS.i >= RS.items.length) { recordSummary(root); return; }
  var q = RS.items[RS.i];

  sectionHead(root, t('modeRecord'), t('recordTitle'), t('recordSub'));
  root.appendChild(el('p', 'mono muted', fmt(RS.i + 1) + ' / ' + fmt(RS.items.length)));

  var card = el('div', 'card q-card');
  var top = el('div', 'card-top');
  top.appendChild(el('span', 'label', t('modeRecord')));
  top.appendChild(el('span', 'mono', 'No. ' + q.id.toUpperCase()));
  card.appendChild(top);
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
      if (RS.sel >= 0) return;
      RS.sel = i;
      var full = i === q.answerIndex;
      var partial = !full && i === q.options.length - 1; /* "both mistaken" earns partial */
      RS.points += full ? 3 : partial ? 1 : 0;
      addXP(full ? 20 : partial ? 10 : 5);
      opts.querySelectorAll('.option-btn').forEach(function (b, j) {
        b.disabled = true;
        b.classList.remove('selected');
        if (j === q.answerIndex) {
          b.classList.add('correct');
          b.querySelector('.option-state').textContent = t('correct');
          var slot = el('span', 'seal-slot');
          b.appendChild(slot);
          pressSeal(slot, 44);
        } else if (j === RS.sel) {
          b.classList.add('wrong');
          b.querySelector('.option-state').textContent = partial ? '+1' : t('incorrect');
        }
      });
      if (full) bellPartial(); else pencilScratch();
      if (partial) card.appendChild(el('p', 'hint-line', t('partialNote')));
      sourceCard(card, q);
      var actions = el('div', 'actions');
      var nb = el('button', 'btn btn-lac', RS.i + 1 >= RS.items.length ? t('seeVerdict') : t('next'));
      nb.addEventListener('click', function () { pageRustle(); RS.i += 1; RS.sel = -1; render('record'); });
      actions.appendChild(nb);
      card.appendChild(actions);
      announce(full ? t('correct') : t('incorrect'));
    });
    li.appendChild(btn);
    opts.appendChild(li);
  });
  card.appendChild(opts);
  root.appendChild(card);
};
function recordSummary(root) {
  S.sittings += 1; markToday(); checkSeals(); save();
  var sheet = el('div', 'verdict-sheet');
  sheet.appendChild(el('div', 'accession-stamp', t('verdictAccess') + String(accessionNo()).padStart(5, '0')));
  sheet.appendChild(el('p', 'label', t('modeRecord')));
  sheet.appendChild(el('h1', 'verdict-heading track-in', t('recordTitle')));
  sheet.appendChild(el('p', 'verdict-outcome', fmt(RS.points) + ' / ' + fmt(RS.items.length * 3)));
  var sealHost = el('div', 'verdict-seal');
  sheet.appendChild(sealHost);
  later(function () { pressSeal(sealHost, 96); }, 300);
  root.appendChild(sheet);
  var actions = el('div', 'actions');
  var toModes = el('button', 'btn btn-lac', t('toModes'));
  toModes.addEventListener('click', function () { nav('/modes'); });
  actions.appendChild(toModes);
  root.appendChild(actions);
  RS = null;
}

/* ==========================================================================
   SCREEN 7 — READER'S PASS (profile)
   ========================================================================== */
ROUTES.pass = function (root) {
  var ti = titleFor(S.xp);

  /* Leather cover */
  var cover = el('div', 'pass-cover');
  var hr1 = el('hr', 'gilt-rule'); hr1.setAttribute('aria-hidden', 'true');
  cover.appendChild(hr1);
  cover.appendChild(el('h1', 'pass-title track-in', t('passTitle')));
  cover.appendChild(el('p', 'pass-no', 'READER No. 01147 · ' + t('estLine') + String(accessionNo()).padStart(5, '0')));
  var hr2 = el('hr', 'gilt-rule'); hr2.setAttribute('aria-hidden', 'true');
  cover.appendChild(hr2);
  root.appendChild(cover);

  var pages = el('div', 'pass-pages');

  /* Catalog-entry fields */
  function fieldRow(label, valueNode) {
    var row = el('div', 'field-row');
    row.appendChild(el('span', 'f-label', label));
    var v = el('span', 'f-value');
    if (typeof valueNode === 'string') v.textContent = valueNode; else v.appendChild(valueNode);
    row.appendChild(v);
    return row;
  }
  /* Name — editable catalog entry */
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
    var saveB = el('button', 'btn btn-lac', t('saveName'));
    saveB.style.marginLeft = '16px';
    nameRow.replaceChild(input, nameVal);
    nameRow.replaceChild(saveB, editBtn);
    input.focus();
    saveB.addEventListener('click', function () {
      S.name = input.value.trim() || 'Reader'; save();
      nameVal.textContent = S.name;
      nameRow.replaceChild(nameVal, input);
      nameRow.replaceChild(editBtn, saveB);
    });
  });
  pages.appendChild(nameRow);
  pages.appendChild(fieldRow(t('fTitle'), ti.title.name + ' (' + fmt(S.xp) + ' XP)'));
  pages.appendChild(fieldRow(t('fSince'), (Object.keys(S.days).sort()[0] || dayKey())));

  /* Standing ladder progress */
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

  /* Calibration ledger */
  var calErr = calibrationError();
  var calP = el('p', 'small muted',
    t('calibrationLine') + ': ' + fmt(S.calibration.length) + ' / 50' +
    (calErr != null ? ' · ' + (calErr >= 0 ? '+' : '') + Math.round(calErr * 100) + '%' : ''));
  pages.appendChild(calP);

  /* Seal shelf */
  pages.appendChild(el('p', 'label', t('sealsShelf')));
  var shelf = el('div', 'seal-shelf');
  SEAL_DEFS.forEach(function (sd) {
    var earned = !!S.seals[sd.id];
    var cell = el('div', 'seal-cell' + (earned ? '' : ' unearned'));
    var sealBox = el('div', 'seal');
    sealBox.innerHTML = sealSVG(88, earned, earned ? (Math.random() * 4 - 2).toFixed(1) : 0);
    cell.appendChild(sealBox);
    cell.appendChild(el('p', 'seal-name', sd.name));
    cell.appendChild(el('p', 'seal-req', sd.req));
    shelf.appendChild(cell);
  });
  pages.appendChild(shelf);

  /* Borrowing-ledger stats, triple-rule totals */
  pages.appendChild(el('p', 'label', t('statsTitle')));
  var tbl = el('table', 'stats-ledger');
  var rows = [
    [t('stDuels'), fmt(S.sittings)],
    [t('stPrevailed'), fmt(S.prevailed)],
    [t('stDrawn'), fmt(S.drawn)],
    [t('stDays'), fmt(activeDays())],
    [t('stStreak'), fmt(dayStreak())]
  ];
  rows.forEach(function (r) {
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

  /* Sound toggle */
  var sRow = el('div', 'relaxed-bar');
  var sCopy = el('div', 'relaxed-copy');
  sCopy.appendChild(el('p', 'label', t('sound')));
  sCopy.appendChild(el('p', 'hint', t('soundHint')));
  sRow.appendChild(sCopy);
  var sTog = el('button', 'toggle');
  sTog.type = 'button';
  sTog.setAttribute('role', 'switch');
  sTog.setAttribute('aria-checked', String(S.sound));
  sTog.setAttribute('aria-label', t('sound'));
  sTog.addEventListener('click', function () {
    S.sound = !S.sound; save();
    sTog.setAttribute('aria-checked', String(S.sound));
    if (S.sound) pageRustle();
  });
  sRow.appendChild(sTog);
  pages.appendChild(sRow);

  /* Language toggle */
  var lRow = el('div', 'relaxed-bar');
  lRow.appendChild(el('p', 'label', t('lang')));
  var lBtn = el('button', 'btn', S.lang === 'hi' ? 'English' : 'हिंदी');
  lBtn.type = 'button';
  lBtn.addEventListener('click', function () { toggleLang(); });
  lRow.appendChild(lBtn);
  pages.appendChild(lRow);

  root.appendChild(pages);

  /* Actions: certificate + WhatsApp share + copy */
  var actions = el('div', 'actions');
  var certB = el('button', 'btn btn-lac', t('certBtn'));
  certB.addEventListener('click', printCertificate);
  var shareB = el('button', 'btn', t('shareBtn'));
  shareB.addEventListener('click', function () {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText()), '_blank', 'noopener');
  });
  var copyB = el('button', 'btn btn-quiet', t('copyBtn'));
  copyB.addEventListener('click', function () {
    copyText(shareText(), copyB);
  });
  actions.appendChild(certB); actions.appendChild(shareB); actions.appendChild(copyB);
  root.appendChild(actions);

  tickRail(root);
};

function shareText() {
  var ti = titleFor(S.xp);
  return t('sharePre') + ti.title.name + ' · ' + fmt(S.xp) + ' XP · ' +
    fmt(S.sittings) + ' sittings · Accession No. ' + String(accessionNo()).padStart(5, '0') + '.' +
    t('shareTail');
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

/* ---------------- Certificate (printable view via window.print) ---------------- */
function printCertificate() {
  var ti = titleFor(S.xp);
  $('#cert-name').textContent = S.name;
  $('#cert-body').innerHTML = '';
  $('#cert-body').appendChild(document.createTextNode('holds the standing of '));
  var st = el('strong', null, ti.title.name);
  $('#cert-body').appendChild(st);
  $('#cert-body').appendChild(document.createTextNode(' in the Reading Room.'));
  $('#cert-detail').textContent =
    fmt(S.sittings) + ' sittings · ' + fmt(S.prevailed) + ' prevailed · ' + fmt(S.xp) + ' marks entered.';
  $('#cert-date').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#cert-acc').textContent = 'ACCESSION No. ' + String(accessionNo()).padStart(5, '0');
  $('#cert-seal').innerHTML = sealSVG(120, true, -4);
  stampThud();
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
  document.getElementById('brand').addEventListener('click', function () { nav(S.onboarded ? '/home' : '/onboarding'); });
  document.querySelectorAll('.nav-btn[data-nav]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.getAttribute('data-nav');
      if (!S.onboarded) { nav('/onboarding'); return; }
      nav('/' + r);
    });
  });
  document.getElementById('lang-toggle').addEventListener('click', toggleLang);
  applyChrome();
  render(routeFromHash());
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
