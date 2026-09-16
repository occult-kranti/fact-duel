import test from 'node:test';
import assert from 'node:assert/strict';
import * as season from '../lib/season.mjs';
import {
  SPORTS,
  SEASONS,
  SEASON_TIERS,
  sportOfTopic,
  expectedScore,
  kFor,
  rateDuel,
  emptyRating,
  tierFor,
  softReset,
  seasonFor,
  localDay,
  localWeek,
  weekStartIso,
  emptyStreak,
  advanceStreak,
  emptySupporter,
  readSupporter,
  reduceSupporter,
  cardProgress,
  MAX_SHIELDS,
} from '../lib/season.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';

const T = (iso, hour = 12) => Date.parse(`${iso}T${String(hour).padStart(2, '0')}:00:00Z`);
const DAY = 86_400_000;

test('the served sports and nothing else map to a sport', () => {
  assert.deepEqual([...SPORTS], ['Football', 'Cricket', 'Baseball', 'Formula 1', 'Basketball']);
  for (const s of SPORTS) assert.equal(sportOfTopic(s), s);
  assert.equal(sportOfTopic('Tennis'), null);
  assert.equal(sportOfTopic('Space'), null);
  assert.equal(sportOfTopic(undefined), null);
});

test('expected score is symmetric and the K schedule drops after ten rated duels', () => {
  assert.ok(Math.abs(expectedScore(1000, 1200) + expectedScore(1200, 1000) - 1) < 1e-12);
  assert.equal(expectedScore(1000, 1000), 0.5);
  assert.ok(expectedScore(1400, 1000) > 0.9);
  for (let n = 0; n < 10; n++) assert.equal(kFor(n), 40);
  assert.equal(kFor(10), 20);
  assert.equal(kFor(500), 20);
  let r = emptyRating();
  for (let i = 0; i < 10; i++) r = rateDuel('Football', r, { outcome: 'win' });
  assert.equal(r.ratedGames, 10);
  const before = r.rating;
  const settled = rateDuel('Football', r, { opponentRating: r.rating, outcome: 'win' });
  assert.equal(settled.rating - before, 10); // K = 20 at even odds of a win pays half of K
});

test('bots are never rated; an unknown opponent is 1000 and the number stays provisional until ten', () => {
  const r = emptyRating();
  assert.strictEqual(rateDuel('Football', r, { outcome: 'win', opponent: 'bot' }), r);
  assert.strictEqual(rateDuel('Football', r, { outcome: 'draw', opponent: 'bot' }), r);
  const win = rateDuel('Football', r, { outcome: 'win' });
  assert.equal(win.rating, 1020);
  assert.equal(win.provisional, true);
  const known = rateDuel('Football', r, { outcome: 'win', opponentRating: 1000 });
  assert.equal(known.rating, win.rating);
  let p = r;
  for (let i = 0; i < 9; i++) p = rateDuel('Cricket', p, { outcome: 'loss' });
  assert.equal(p.provisional, true);
  p = rateDuel('Cricket', p, { outcome: 'loss' });
  assert.equal(p.provisional, false);
  assert.strictEqual(rateDuel('Tennis', r, { outcome: 'win' }), r);
  assert.strictEqual(rateDuel('Football', r, { outcome: 'meh' }), r);
});

test('tier boundaries carry generic names', () => {
  assert.deepEqual(
    SEASON_TIERS.map((t) => t.label),
    ['Rookie', 'Squad', 'Starter', 'Captain', 'Legend'],
  );
  assert.equal(tierFor(949).id, 'rookie');
  assert.equal(tierFor(950).id, 'squad');
  assert.equal(tierFor(1049).id, 'squad');
  assert.equal(tierFor(1050).id, 'starter');
  assert.equal(tierFor(1149).id, 'starter');
  assert.equal(tierFor(1150).id, 'captain');
  assert.equal(tierFor(1299).id, 'captain');
  assert.equal(tierFor(1300).id, 'legend');
  assert.equal(tierFor(NaN).id, 'squad'); // an unreadable rating reads as 1000
  for (const t of SEASON_TIERS) assert.doesNotMatch(t.label, /premier|league|nba|mlb|ipl|f1|cup/i);
});

test('soft reset pulls half way to 1000 and never below the reached tier floor', () => {
  const high = { ...emptyRating(), rating: 1400, ratedGames: 30, floorTier: 'legend' };
  const reset = softReset(high, 's2');
  assert.equal(reset.rating, 1300); // 1200 pulled, floored at Legend 1300
  assert.equal(reset.seasonId, 's2');
  assert.equal(reset.floorTier, 'legend');
  const mid = softReset({ ...emptyRating(), rating: 1160, ratedGames: 12, floorTier: 'captain' }, 's2');
  assert.equal(mid.rating, 1150);
  const low = softReset({ ...emptyRating(), rating: 800, ratedGames: 12, floorTier: 'rookie' }, 's2');
  assert.equal(low.rating, 900);
  const plain = softReset({ ...emptyRating(), rating: 1100, ratedGames: 12, floorTier: 'starter' }, 's2');
  assert.equal(plain.rating, 1050);
  assert.equal(plain.floorTier, 'starter');
});

test('season lookup: current season, boundaries and the off-season with its next window', () => {
  assert.ok(SEASONS.every((s) => SPORTS.includes(s.sport) && s.start < s.end));
  const fb = seasonFor('Football', T('2026-09-16'));
  assert.equal(fb.id, 'football-2026-27');
  assert.equal(fb.offSeason, false);
  assert.equal(fb.daysLeft, 257);
  assert.equal(seasonFor('Football', T('2026-08-21', 0)).id, 'football-2026-27');
  assert.equal(seasonFor('Football', T('2027-05-30', 23)).id, 'football-2026-27');
  const off = seasonFor('Football', T('2027-05-31', 0));
  assert.equal(off.offSeason, true);
  assert.equal(off.label, 'Transfer window');
  assert.equal(off.next, null);
  const preseason = seasonFor('Football', T('2026-08-20'));
  assert.equal(preseason.offSeason, true);
  assert.equal(preseason.next.id, 'football-2026-27');
  assert.equal(preseason.daysUntil, 1);
  // F1 and Baseball 2026 bounds come from the calendar entries.
  assert.equal(seasonFor('Formula 1', T('2026-09-16')).id, 'f1-2026');
  assert.equal(seasonFor('Formula 1', T('2026-09-16')).start, '2026-03-08');
  assert.equal(seasonFor('Formula 1', T('2027-01-01')).next.id, 'f1-2027');
  const mlb = seasonFor('Baseball', T('2026-10-31'));
  assert.equal(mlb.id, 'baseball-2026');
  assert.equal(mlb.start, '2026-03-26');
  assert.equal(mlb.end, '2026-10-31');
  const stove = seasonFor('Baseball', T('2026-12-15'));
  assert.equal(stove.label, 'Hot Stove');
  assert.match(SEASONS.find((s) => s.id === 'baseball-2027').note, /lockout/);
  const cricket = seasonFor('Cricket', T('2026-09-16'));
  assert.equal(cricket.offSeason, true);
  assert.equal(cricket.label, 'Off-season');
  assert.equal(cricket.next.id, 'cricket-wc-2027');
  assert.equal(seasonFor('Cricket', T('2027-10-04')).id, 'cricket-wc-2027');
  assert.equal(seasonFor('Basketball', T('2026-10-19')).offSeason, true);
  assert.equal(seasonFor('Basketball', T('2026-10-20')).id, 'basketball-2026-27');
  // The local day, not the UTC day, decides the boundary.
  assert.equal(seasonFor('Basketball', T('2026-10-19', 23), 120).id, 'basketball-2026-27');
  assert.equal(seasonFor('Tennis', T('2026-09-16')), null);
});

test('ISO weeks follow the local day: a late Sunday in UTC+10 is already Monday', () => {
  assert.equal(localDay(T('2026-09-13', 20), 600), '2026-09-14');
  assert.equal(localDay(T('2026-09-14', 3), -480), '2026-09-13');
  assert.equal(weekStartIso(localWeek(T('2026-09-16'))), '2026-09-14');
  assert.equal(localWeek(T('2026-09-13', 20), 600), localWeek(T('2026-09-16')));
  assert.equal(localWeek(T('2026-09-13', 20), 0), localWeek(T('2026-09-16')) - 1);
});

test('matchweek streak: one duel a week extends it, a missed week breaks it, a shield covers it', () => {
  let s = advanceStreak(emptyStreak(), { at: T('2026-09-14') });
  assert.equal(s.current, 1);
  const again = advanceStreak(s, { at: T('2026-09-18') });
  assert.equal(again.current, 1);
  s = advanceStreak(s, { at: T('2026-09-21') });
  assert.equal(s.current, 2);
  s = advanceStreak(s, { at: T('2026-09-28') });
  assert.equal(s.current, 3);
  assert.equal(s.best, 3);
  const broken = advanceStreak(s, { at: T('2026-10-12') }); // week of 5 Oct missed, no shield
  assert.equal(broken.current, 1);
  assert.equal(broken.best, 3);
  // Seven consecutive days earns a shield; a missed week then spends it.
  let d = emptyStreak();
  for (let i = 0; i < 7; i++) d = advanceStreak(d, { at: T('2026-09-14') + i * DAY });
  assert.equal(d.shields, 1);
  assert.equal(d.shieldProgressDays, 0);
  assert.equal(d.current, 1);
  const saved = advanceStreak(d, { at: T('2026-09-28') }); // skipped the week of 21 Sep
  assert.equal(saved.current, 2);
  assert.equal(saved.shields, 0);
  // Two missed weeks with one shield: the streak still breaks and the shield is kept.
  const gone = advanceStreak(d, { at: T('2026-10-05') });
  assert.equal(gone.current, 1);
  assert.equal(gone.shields, 1);
  // Shields cap at two.
  let c = emptyStreak();
  for (let i = 0; i < 28; i++) c = advanceStreak(c, { at: T('2026-09-14') + i * DAY });
  assert.equal(c.shields, MAX_SHIELDS);
  // Same instant twice is identity; a day out of order is ignored.
  assert.strictEqual(advanceStreak(c, { at: T('2026-09-14') + 27 * DAY }), c);
  assert.strictEqual(advanceStreak(c, { at: T('2026-09-01') }), c);
  assert.strictEqual(advanceStreak(c, {}), c);
});

test('there is no way to repair a streak with coins or an ad', () => {
  const names = Object.keys(season);
  for (const name of names) assert.doesNotMatch(name, /coin|ad(id|s|watch)?$|repair|restore|buy|purchase|freeze/i);
  const broken = advanceStreak(
    advanceStreak(emptyStreak(), { at: T('2026-09-14') }),
    { at: T('2026-10-12'), coins: 500, adId: 'rewarded-1', repair: true },
  );
  assert.equal(broken.current, 1);
  const sup = reduceSupporter(emptySupporter(), { type: 'streak-repair', sport: 'Football', coins: 500 }, 1);
  assert.deepEqual(sup, emptySupporter());
});

test('readSupporter round-trips and reads garbage as the empty record', () => {
  assert.deepEqual(readSupporter(null), emptySupporter());
  assert.deepEqual(readSupporter('x'), emptySupporter());
  assert.deepEqual(readSupporter({ version: 2, handle: 'ok' }), emptySupporter());
  const junk = readSupporter({
    version: 1,
    allegiance: { Football: '  Wanderers  ', Tennis: 'nope', Cricket: 'x'.repeat(80), Baseball: '   ' },
    ratings: { Football: { rating: 1234.6, ratedGames: 3, floorTier: 'nope', seasonId: 5, duels: -1 }, Golf: {} },
    streaks: { Cricket: { current: 4, best: 1, shields: 9, shieldProgressDays: 40, lastWeek: 'x' } },
    ageBand: 'child',
    handle: 'bad handle!',
    completedAt: 'soon',
    extra: true,
  });
  assert.deepEqual(junk.allegiance, { Football: 'Wanderers', Cricket: 'x'.repeat(40) });
  assert.deepEqual(junk.ratings, {
    Football: { rating: 1235, ratedGames: 3, provisional: true, floorTier: 'rookie', seasonId: null, duels: 0, lastAt: null },
  });
  assert.deepEqual(junk.streaks, {
    Cricket: { current: 4, best: 4, lastWeek: null, lastDay: null, shields: 2, shieldProgressDays: 6 },
  });
  assert.equal(junk.ageBand, null);
  assert.equal(junk.handle, null);
  assert.equal(junk.completedAt, null);
  assert.equal('extra' in junk, false);
  let s = emptySupporter();
  const at = T('2026-09-16');
  s = reduceSupporter(s, { type: 'allegiance', sport: 'Football', team: 'Rovers' }, at);
  s = reduceSupporter(s, { type: 'handle', handle: 'fan_01' }, at);
  s = reduceSupporter(s, { type: 'age-band', band: '18-plus' }, at);
  for (let i = 0; i < 12; i++)
    s = reduceSupporter(s, { type: 'duel-result', sport: 'Football', outcome: i % 3 ? 'win' : 'loss', opponent: 'human', at: at + i * DAY, tzOffsetMinutes: 60 }, at);
  s = reduceSupporter(s, { type: 'duel-result', sport: 'Cricket', outcome: 'draw', opponent: 'bot', at }, at);
  s = reduceSupporter(s, { type: 'complete' }, at);
  assert.deepEqual(readSupporter(JSON.parse(JSON.stringify(s))), s);
});

test('reduceSupporter is identity-preserving and refuses bad input', () => {
  const s = emptySupporter();
  assert.strictEqual(reduceSupporter(s, { type: 'allegiance', sport: 'Tennis', team: 'X' }, 1), s);
  assert.strictEqual(reduceSupporter(s, { type: 'allegiance', sport: 'Football', team: '   ' }, 1), s);
  assert.strictEqual(reduceSupporter(s, { type: 'age-band', band: 'child' }, 1), s);
  assert.strictEqual(reduceSupporter(s, { type: 'handle', handle: 'no spaces' }, 1), s);
  assert.strictEqual(reduceSupporter(s, { type: 'handle', handle: 'x'.repeat(25) }, 1), s);
  assert.strictEqual(reduceSupporter(s, { type: 'handle', handle: '' }, 1), s);
  assert.strictEqual(reduceSupporter(s, { type: 'duel-result', sport: 'Football', outcome: 'win' }, NaN), s);
  assert.strictEqual(reduceSupporter(s, { type: 'nope' }, 1), s);
  assert.strictEqual(reduceSupporter(s, null, 1), s);
  const a = reduceSupporter(s, { type: 'allegiance', sport: 'Football', team: ' Rovers ' }, 1);
  assert.equal(a.allegiance.Football, 'Rovers');
  assert.strictEqual(reduceSupporter(a, { type: 'allegiance', sport: 'Football', team: 'Rovers' }, 2), a);
  const cleared = reduceSupporter(a, { type: 'allegiance', sport: 'Football', team: '' }, 3);
  assert.deepEqual(cleared.allegiance, {});
  const h = reduceSupporter(a, { type: 'handle', handle: 'Fan_9' }, 1);
  assert.equal(h.handle, 'Fan_9');
  assert.strictEqual(reduceSupporter(h, { type: 'handle', handle: 'Fan_9' }, 2), h);
  assert.equal(reduceSupporter(h, { type: 'handle', handle: '' }, 2).handle, null);
  const b = reduceSupporter(h, { type: 'age-band', band: 'prefer-not' }, 1);
  assert.strictEqual(reduceSupporter(b, { type: 'age-band', band: 'prefer-not' }, 2), b);
  const c = reduceSupporter(b, { type: 'complete' }, 5);
  assert.equal(c.completedAt, 5);
  assert.strictEqual(reduceSupporter(c, { type: 'complete' }, 9), c);
});

test('duel results rate humans, count bots, and soft-reset once per real season', () => {
  const at = T('2026-09-16');
  let s = reduceSupporter(emptySupporter(), { type: 'duel-result', sport: 'Football', outcome: 'win', opponent: 'bot', at }, at);
  assert.equal(s.ratings.Football.rating, 1000);
  assert.equal(s.ratings.Football.ratedGames, 0);
  assert.equal(s.ratings.Football.duels, 1);
  assert.equal(s.ratings.Football.seasonId, 'football-2026-27');
  assert.equal(s.streaks.Football.current, 1);
  s = reduceSupporter(s, { type: 'duel-result', sport: 'Football', outcome: 'win', opponent: 'human', at }, at);
  assert.equal(s.ratings.Football.rating, 1020);
  assert.equal(s.ratings.Football.ratedGames, 1);
  // Off-season duels still rate and raise the floor for the next season.
  let f1 = emptySupporter();
  for (let i = 0; i < 20; i++)
    f1 = reduceSupporter(f1, { type: 'duel-result', sport: 'Formula 1', outcome: 'win', opponent: 'human', at: T('2027-01-10') + i * DAY }, at);
  assert.equal(f1.ratings['Formula 1'].seasonId, null);
  assert.equal(f1.ratings['Formula 1'].rating, 1209);
  assert.equal(f1.ratings['Formula 1'].floorTier, 'captain');
  const opened = reduceSupporter(f1, { type: 'duel-result', sport: 'Formula 1', outcome: 'loss', opponent: 'human', at: T('2027-03-14') }, at);
  assert.equal(opened.ratings['Formula 1'].seasonId, 'f1-2027');
  // Reset: 1000 + 209 / 2 = 1105, held at the Captain floor of 1150, then one settled loss.
  assert.equal(opened.ratings['Formula 1'].rating, 1150 - Math.round(20 * expectedScore(1150, 1000)));
  assert.equal(opened.ratings['Formula 1'].floorTier, 'captain');
  // The same season never resets twice.
  const again = reduceSupporter(opened, { type: 'duel-result', sport: 'Formula 1', outcome: 'draw', opponent: 'human', at: T('2027-06-01') }, at);
  assert.equal(again.ratings['Formula 1'].ratedGames, 22);
  assert.ok(Math.abs(again.ratings['Formula 1'].rating - opened.ratings['Formula 1'].rating) < 10);
});

test('card progress is honest: a fresh profile is 2 of 7 and the first duel is not pretended', () => {
  const fresh = cardProgress(emptySupporter(), emptyProfile());
  assert.equal(fresh.done, 2);
  assert.equal(fresh.total, 7);
  assert.deepEqual(
    fresh.steps.filter((x) => x.done).map((x) => x.id),
    ['profile', 'wallet'],
  );
  assert.equal(fresh.steps.find((x) => x.id === 'duel').done, false);
  assert.equal(cardProgress(emptySupporter(), null).done, 1);
  let s = emptySupporter();
  const at = T('2026-09-16');
  s = reduceSupporter(s, { type: 'duel-result', sport: 'Football', outcome: 'win', opponent: 'bot', at }, at);
  assert.equal(cardProgress(s, emptyProfile()).done, 3);
  s = reduceSupporter(s, { type: 'allegiance', sport: 'Football', team: 'Rovers' }, at);
  s = reduceSupporter(s, { type: 'handle', handle: 'fan' }, at);
  s = reduceSupporter(s, { type: 'age-band', band: 'prefer-not' }, at);
  assert.equal(cardProgress(s, emptyProfile()).done, 6);
  for (const sport of ['Football', 'Cricket', 'Baseball'])
    s = reduceSupporter(s, { type: 'duel-result', sport, outcome: 'loss', opponent: 'human', at }, at);
  assert.equal(cardProgress(s, emptyProfile()).done, 7);
});

// ---------------------------------------------------------------------------------------------------
// Passport level: a completed room rates the sport of its rounds, once, and a bot room does not.
const question = (topic, id = 'q1') => ({
  factId: id,
  question: `Question ${id}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Because.',
  topic,
  subtopic: 'General',
  sourceUrl: 'https://example.org/source',
  sourceLabel: 'Source',
});
const room = ({ id = 'm1', bot = false, topics = ['Football'], winner = 0 } = {}) => {
  const rounds = topics.map((t, i) => ({
    id: `${id}:${i}`,
    index: i,
    result: { winner: 0 },
    question: question(t, `${id}-q${i}`),
    receipts: [{ correct: true, elapsedMs: 900 }, { correct: false, elapsedMs: 1200 }],
  }));
  return {
    id,
    createdAt: 1000,
    phase: 'complete',
    seat: 0,
    config: { mode: 'trilogy', topic: 'all' },
    players: [{ kind: 'human' }, { kind: bot ? 'bot' : 'human' }],
    scores: [2, 1],
    winner,
    completedRounds: rounds.slice(0, -1),
    round: rounds[rounds.length - 1],
  };
};
const act = (p, a) => reduceProfile(p, { epoch: p.epoch, at: T('2026-09-16'), tzOffsetMinutes: 60, ...a });

test('passport: a complete human room moves the sport rating; a bot room only counts the duel', () => {
  const base = emptyProfile();
  assert.deepEqual(base.supporter, emptySupporter());
  const human = act(base, { type: 'room', room: room({ topics: ['Football', 'Football', 'Cricket'] }) });
  assert.equal(human.supporter.ratings.Football.rating, 1020);
  assert.equal(human.supporter.ratings.Football.ratedGames, 1);
  assert.equal(human.supporter.ratings.Football.duels, 1);
  assert.equal(human.supporter.streaks.Football.current, 1);
  assert.equal('Cricket' in human.supporter.ratings, false);
  assert.strictEqual(act(human, { type: 'room', room: room({ topics: ['Football', 'Football', 'Cricket'] }) }), human);
  const lost = act(human, { type: 'room', room: room({ id: 'm2', winner: 1 }) });
  assert.equal(lost.supporter.ratings.Football.rating, 1020 + Math.round(40 * (0 - 1 / (1 + 10 ** (-20 / 400)))));
  const drawn = act(human, { type: 'room', room: room({ id: 'm3', winner: null }) });
  assert.equal(drawn.supporter.ratings.Football.ratedGames, 2);
  const bot = act(base, { type: 'room', room: room({ bot: true }) });
  assert.equal(bot.supporter.ratings.Football.rating, 1000);
  assert.equal(bot.supporter.ratings.Football.ratedGames, 0);
  assert.equal(bot.supporter.ratings.Football.duels, 1);
  assert.equal(bot.supporter.ratings.Football.provisional, true);
  const science = act(base, { type: 'room', room: room({ topics: ['Space'] }) });
  assert.deepEqual(science.supporter, emptySupporter());
  const playing = act(base, { type: 'room', room: { ...room(), phase: 'playing' } });
  assert.deepEqual(playing.supporter, emptySupporter());
});

test('passport: supporter actions round-trip through the profile and old profiles read as empty', () => {
  let p = act(emptyProfile(), { type: 'supporter', op: { type: 'allegiance', sport: 'Basketball', team: 'The Bears' } });
  assert.equal(p.supporter.allegiance.Basketball, 'The Bears');
  assert.equal(p.revision, 1);
  assert.strictEqual(act(p, { type: 'supporter', op: { type: 'allegiance', sport: 'Basketball', team: 'The Bears' } }), p);
  p = act(p, { type: 'supporter', op: { type: 'handle', handle: 'courtside' } });
  p = act(p, { type: 'supporter', op: { type: 'age-band', band: 'under-18' } });
  assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))), p);
  const legacy = JSON.parse(JSON.stringify(p));
  delete legacy.supporter;
  assert.deepEqual(readProfile(legacy).supporter, emptySupporter());
  assert.equal(readProfile(legacy).passport.skin, 'classic');
  assert.deepEqual(cardProgress(p.supporter, p).done, 5);
});

test('passport: completing every step stamps completedAt exactly once', () => {
  let p = emptyProfile();
  p = act(p, { type: 'supporter', op: { type: 'allegiance', sport: 'Football', team: 'Rovers' } });
  p = act(p, { type: 'supporter', op: { type: 'handle', handle: 'rover' } });
  p = act(p, { type: 'supporter', op: { type: 'age-band', band: '18-plus' } });
  assert.equal(p.supporter.completedAt, null);
  for (const [i, topic] of ['Football', 'Cricket', 'Baseball'].entries())
    p = act(p, { type: 'room', room: room({ id: `r${i}`, topics: [topic] }) });
  assert.equal(p.supporter.completedAt, T('2026-09-16'));
  const later = act(p, { type: 'room', room: room({ id: 'r9', topics: ['Basketball'] }), at: T('2026-09-17') });
  assert.equal(later.supporter.completedAt, T('2026-09-16'));
});
