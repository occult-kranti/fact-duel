/** Shared validation/transport boundary. Match authority lives in the Postgres RPC. */
export const SERVER_RULES = Object.freeze({ rounds: 3, formats: Object.freeze({ mini: 3, full: 6 }), roundMs: 30000, countdownMs: 2500, breakMs: 10000, tieMs: 120, sessionDays: 30, minimumMatches: 3, minimumOpponents: 3 });
export const ECONOMY_RULES = Object.freeze({ startingBalance: 100, maxStake: 10000, completionReward: 10, bonusMultiplier: 1, rewardAnswers: 3, rewardCorrect: 1, rewardsPerFileUtcDay: 1, disconnectGraceMs: 90000 });
export const DUEL_FILES = Object.freeze([
 { id: 'all', name: 'Any topic', rewardMultiplier: 1 },
 { id: 'sports', name: 'Sports', rewardMultiplier: 1 },
 { id: 'science', name: 'Science', rewardMultiplier: 1 },
 { id: 'cricket', name: 'Cricket', rewardMultiplier: 1 },
 { id: 'football', name: 'Football', rewardMultiplier: 1 },
 { id: 'basketball', name: 'Basketball', rewardMultiplier: 1 },
 { id: 'baseball', name: 'Baseball', rewardMultiplier: 1 },
 { id: 'formula-1', name: 'Formula 1', rewardMultiplier: 1 },
 { id: 'space', name: 'Space', rewardMultiplier: 1 },
 { id: 'physics', name: 'Physics', rewardMultiplier: 1 },
 { id: 'biology', name: 'Biology', rewardMultiplier: 1 },
 { id: 'computing', name: 'Computing', rewardMultiplier: 1 },
].map(Object.freeze));
export const ACTIONS = new Set(['presence', 'reaction', 'session', 'recover', 'rotateRecovery', 'exportProfile', 'deleteSession', 'profile', 'create', 'join', 'queue', 'snapshot', 'ready', 'answer', 'next', 'leave', 'leaderboards', 'leaderboard', 'tournaments', 'circles', 'team']);
export const TEAM_OPERATIONS = Object.freeze(['dashboard','create','join','settings','rotateInvite','transfer','kick','leave','challenge','accept','decline','fixture','play','answer','next','tournamentCreate','tournamentJoin','tournamentStart','tournamentLeave','selectLineup','assignRole','assignBadge','roleConsent','fixtureLineup','substitute','readyLineup','startBattle','stopRecurrence','sendRematch']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function cleanTeamText(value, max, label) {
  if (typeof value !== 'string') throw new GameError('BAD_TEAM', `Choose a ${label}.`);
  const next = value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').trim().replace(/\s+/g, ' ');
  if ([...next].length < 2 || [...next].length > max) throw new GameError('BAD_TEAM', `Use 2–${max} characters for the ${label}.`);
  return next;
}
export class GameError extends Error { constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; } }
export function cleanNickname(value) {
  if (typeof value !== 'string') throw new GameError('BAD_NICKNAME', 'Choose a nickname.');
  const name = value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').trim().replace(/\s+/g, ' ');
  if ([...name].length < 2 || [...name].length > 24) throw new GameError('BAD_NICKNAME', 'Use 2–24 characters for your nickname.');
  return name;
}
export function validateInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !ACTIONS.has(body.action)) throw new GameError('BAD_ACTION', 'Unknown game action.');
  const payload = { ...body }; delete payload.action;
  // Never accept identity, timing, scores or answers supplied as assertions.
  for (const key of ['sessionId','playerId','elapsedMs','correct','score','xp','correctIndex','serverNow','tokenHash','balance','savings','reward','rewardMultiplier','payout','winnerId']) delete payload[key];
  delete payload._recoveryHash;
  if (body.action === 'team') {
    const op = payload.op ?? 'dashboard';
    if (!TEAM_OPERATIONS.includes(op)) throw new GameError('BAD_TEAM_ACTION', 'Choose a supported team action.');
    payload.op = op;
    if (op === 'create') {
      payload.name = cleanTeamText(payload.name, 32, 'team name');
      if (![5,11].includes(payload.capacity)) throw new GameError('BAD_TEAM', 'Choose a team of 5 or 11.');
    }
    if (op === 'settings' && payload.name != null) payload.name = cleanTeamText(payload.name, 32, 'team name');
    if (op === 'tournamentCreate') payload.name = cleanTeamText(payload.name, 40, 'cup name');
    if (payload.emblem != null && !['bat','bolt','crown','star'].includes(payload.emblem)) throw new GameError('BAD_BANNER','Choose a supported team emblem.');
    if (payload.palette != null && !['teal','saffron','berry','blue'].includes(payload.palette)) throw new GameError('BAD_PALETTE','Choose a supported team palette.');
    if (payload.joinOpen != null && typeof payload.joinOpen !== 'boolean') throw new GameError('BAD_TEAM','Choose whether team invites are open.');
    if (['challenge','tournamentCreate'].includes(op)) {
      payload.format = payload.format ?? 'mini';
      if (!['mini','full'].includes(payload.format)) throw new GameError('BAD_FORMAT','Choose Mini over or Full over.');
    }
    if (op === 'challenge') {
      if (typeof payload.targetTag !== 'string') throw new GameError('BAD_TEAM_TAG','Enter the other team’s public tag.');
      payload.targetTag = payload.targetTag.trim().toUpperCase();
      if (!/^[A-Z0-9]{1,4}-[A-F0-9]{4}$/.test(payload.targetTag)) throw new GameError('BAD_TEAM_TAG','Check the other team’s public tag.');
    }
    for (const [operations,key] of [[['transfer','kick','assignRole','assignBadge'],'memberId'],[['accept','decline','fixture','play','answer','next','fixtureLineup','substitute','readyLineup','startBattle','stopRecurrence','sendRematch'],'fixtureId'],[['tournamentStart','tournamentLeave'],'tournamentId'],[['substitute'],'outMemberId'],[['substitute'],'inMemberId']]) {
      if (operations.includes(op) && !UUID_RE.test(payload[key] || '')) throw new GameError('BAD_TEAM_ID','Choose a valid team member, match or cup.');
    }
    if (['join','tournamentJoin'].includes(op) && (typeof payload.code !== 'string' || !/^[A-Fa-f0-9]{16}$/.test(payload.code.trim()))) throw new GameError('BAD_CODE','Check the private invite code.');
    if (op === 'answer' && (!Number.isInteger(payload.round) || payload.round < 1 || payload.round > 6 || !Number.isInteger(payload.choice) || payload.choice < 0 || payload.choice > 3 || !UUID_RE.test(payload.requestId || ''))) throw new GameError('BAD_ANSWER','Choose one answer for the current ball.');
    if (['selectLineup','fixtureLineup'].includes(op) && (!Array.isArray(payload.memberIds) || ![5,11].includes(payload.memberIds.length) || new Set(payload.memberIds).size !== payload.memberIds.length || payload.memberIds.some(id => typeof id !== 'string' || !UUID_RE.test(id)))) throw new GameError('BAD_LINEUP','Select five or eleven different club members.');
    if (op === 'assignRole' && !['member','vice-captain','coach'].includes(payload.role)) throw new GameError('BAD_ROLE','Choose member, vice-captain or coach.');
    if (op === 'assignBadge' && !['none','bottle-boy','analyst','keeper','finisher','cheer-captain'].includes(payload.badge)) throw new GameError('BAD_BADGE','Choose an available fun badge.');
    if (op === 'roleConsent' && typeof payload.consent !== 'boolean') throw new GameError('BAD_BADGE','Choose whether to allow fun badges.');
    if (op === 'readyLineup' && typeof payload.ready !== 'boolean') throw new GameError('BAD_READY','Choose whether this line-up is ready for an early battle.');
    if (['challenge','accept'].includes(op) && payload.recurrence != null && !['none','weekly'].includes(payload.recurrence)) throw new GameError('BAD_RECURRENCE','Choose a single match or weekly rematch drafts.');
    // Explicitly ignore authority assertions in this protocol too. No team operation accepts a stake.
    for (const key of ['teamId','tag','capacityOverride','level','points','captainId','winnerTeamId','deadlineAt','startedAt','issuedAt','stake','rosterLimit','isSelected','funBadgeConsent','prepEndsAt','battleStartsAt','homeReady','awayReady','permissions','draftSentAt','warVersion','recurrenceConfirmed','recurrenceStopped']) delete payload[key];
  }
  if (['session','profile'].includes(body.action)) {
    if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
      if (payload.email !== null && typeof payload.email !== 'string') throw new GameError('BAD_EMAIL','Enter a valid email address.');
      payload.email = payload.email === null ? null : payload.email.trim().toLowerCase() || null;
      if (payload.email !== null && (payload.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))) throw new GameError('BAD_EMAIL','Enter a valid email address.');
    }
    if (payload.adultConfirmed != null && payload.adultConfirmed !== true) throw new GameError('AGE_CONFIRMATION_REQUIRED','Confirm that you are at least 18.');
    if (payload.termsVersion != null && payload.termsVersion !== 'beta-1') throw new GameError('TERMS_REQUIRED','Accept the current beta terms.');
    if (payload.avatar != null && !['spark','shield','bolt','star','book','compass'].includes(payload.avatar)) throw new GameError('BAD_AVATAR','Choose a supported avatar.');
    if (payload.locale != null && !['en','hi'].includes(payload.locale)) throw new GameError('BAD_LOCALE','Choose a supported language.');
    if (payload.preferences != null && (typeof payload.preferences !== 'object' || Array.isArray(payload.preferences) || Object.keys(payload.preferences).some(key => !['sound','reducedMotion'].includes(key)) || Object.values(payload.preferences).some(value => typeof value !== 'boolean'))) throw new GameError('BAD_PREFERENCES','Choose supported preferences.');
    if (body.action === 'session' && (payload.adultConfirmed !== true || payload.termsVersion !== 'beta-1')) throw new GameError('PROFILE_REQUIRED','18+ confirmation and beta terms are required for human matches.');
  }
  if (body.action === 'recover') {
    if (!/^[a-f0-9]{64}$/.test(payload.recoveryCode || '')) throw new GameError('BAD_RECOVERY','The recovery code is invalid.');
    payload.recoveryCode = undefined;
  }
  if (body.action === 'session' || (body.action === 'profile' && payload.nickname != null)) payload.nickname = cleanNickname(payload.nickname);
  if (payload.nickname != null) payload.nickname = cleanNickname(payload.nickname);
  if (payload.roomId != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.roomId)) throw new GameError('BAD_ROOM', 'Invalid room.');
  if (['snapshot','ready','answer','next','leave','reaction'].includes(body.action) && !payload.roomId) throw new GameError('BAD_ROOM','A room is required.');
  if (body.action === 'reaction' && (!['all-talk','appeal-rejected','brain-duck','nice-shot','check-replay','too-easy'].includes(payload.sticker) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.requestId || ''))) throw new GameError('BAD_STICKER', 'Choose one supported sticker.');
  if (body.action === 'answer' && (!Number.isInteger(payload.choice) || payload.choice < 0 || payload.choice > 3 || !Number.isInteger(payload.round) || payload.round < 1 || payload.round > 6 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.requestId || ''))) throw new GameError('BAD_ANSWER', 'Choose one answer for the current round.');
  if (payload.stake != null && (!Number.isSafeInteger(payload.stake) || payload.stake < 0 || payload.stake > ECONOMY_RULES.maxStake)) throw new GameError('BAD_STAKE', 'Choose whole units from 0 to 10,000.');
  if (['create', 'queue'].includes(body.action)) {
    if (payload.format != null && !['mini','full'].includes(payload.format)) throw new GameError('BAD_FORMAT', 'Choose Mini over or Full over.');
    payload.stake = payload.stake ?? 0; payload.file = payload.file ?? 'all';
    if (!DUEL_FILES.some(file => file.id === payload.file)) throw new GameError('BAD_FILE', 'Choose an available topic.');
  }
  if (payload.code != null) { payload.code = String(payload.code).trim().toUpperCase(); if (!/^[A-F0-9]{8,16}$/.test(payload.code)) throw new GameError('BAD_CODE','Check the invite code.'); }
  return { action: body.action === 'leaderboard' ? 'leaderboards' : body.action, payload };
}
export function makeToken(random = crypto.getRandomValues.bind(crypto)) { return Array.from(random(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''); }
export async function hashToken(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) throw new GameError('UNAUTHORIZED', 'Your online profile is missing. Create a new one.', 401);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2,'0')).join('');
}
export function roundWinner(answers, tieMs = 120) {
  const right = answers.filter(a => a.correct);
  if (right.length === 1) return right[0].playerId;
  if (right.length !== 2 || Math.abs(right[0].elapsedMs - right[1].elapsedMs) <= tieMs) return null;
  return right[0].elapsedMs < right[1].elapsedMs ? right[0].playerId : right[1].playerId;
}
export function stopwatchXp(correct, elapsedMs) { return !correct ? 0 : elapsedMs < 8000 ? 30 : elapsedMs < 15000 ? 20 : 10; }

// Bind recovery secrets to this game so a code cannot authenticate on another game.
export async function hashRecovery(code) {
  if (!/^[a-f0-9]{64}$/.test(code || '')) throw new GameError('BAD_RECOVERY','The recovery code is invalid.');
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('jhk:recovery:' + code))), b => b.toString(16).padStart(2,'0')).join('');
}
