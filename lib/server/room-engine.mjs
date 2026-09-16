export const MODE_ROUNDS = Object.freeze({ quick: 1, trilogy: 3, gauntlet: 5 });
/**
 * The three legal timers, in seconds, and the one each format opens on. A round ends on whichever
 * comes first: both seats locked, or this clock plus the transport grace. Fewer rounds buy a longer
 * clock — Quick Draw is a single question and gets the full ten seconds; the Gauntlet is five and
 * runs at five — so total question time across a match stays in the same band whatever you pick.
 */
export const DURATIONS = Object.freeze([5, 7, 10]);
export const MODE_DURATION = Object.freeze({ quick: 10, trilogy: 7, gauntlet: 5 });
export const RULES = Object.freeze({
  tieMs: 150,
  ttlMs: 7200000,
  showWindowMs: 12000,
  maxRetries: 10,
  minTransportMs: 500,
  maxTransportMs: 2000,
  settlementBufferMs: 500,
});
export class GameError extends Error {
  constructor(message, status = 400, code = 'invalid_request') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function requireValue(condition, message, status = 400, code = 'invalid_request') {
  if (!condition) throw new GameError(message, status, code);
}
export function hashableToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32,64}$/.test(value);
}
export function normalizeConfig(input, questions) {
  const c = input || {};
  const opponent = c.opponent ?? 'friend';
  requireValue(['friend', 'bot'].includes(opponent), 'Choose a valid opponent.');
  requireValue(typeof c.mode === 'string' && Object.hasOwn(MODE_ROUNDS, c.mode), 'Choose a valid mode.');
  requireValue([0, 10, 25, 50, 100].includes(c.stake), 'Choose a valid demo entry.');
  // A practice bot never plays for coins. A house-banked bot is a faucet whenever players beat it
  // and a sink whenever it beats them, and any balance-aware tuning of it is rigging — so the only
  // honest bot match is a free one: XP, streaks and quests, nothing that can be farmed or lost.
  requireValue(opponent !== 'bot' || c.stake === 0, 'Practice bots play for free. Choose a free entry or a friend.');
  requireValue(DURATIONS.includes(c.duration), 'Choose a valid timer.');
  const filters = {
    domain: c.domain || 'all',
    region: c.region || 'all',
    topic: c.topic || 'all',
    subtopic: c.subtopic || 'all',
    difficulty: c.difficulty || 'all',
  };
  for (const v of Object.values(filters))
    requireValue(typeof v === 'string' && v.length < 100, 'Invalid topic filter.');
  const pool = questions.filter((q) => Object.entries(filters).every(([k, v]) => v === 'all' || q[k] === v));
  const count = MODE_ROUNDS[c.mode];
  requireValue(pool.length >= count, `Choose broader filters: this mode needs ${count} questions.`);
  return { ...filters, mode: c.mode, stake: c.stake, duration: c.duration, opponent };
}
export function shuffle(a, rng = Math.random) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function chooseDeck(questions, config, rng = Math.random) {
  const f = ['domain', 'region', 'topic', 'subtopic', 'difficulty'];
  return shuffle(
    questions.filter((q) => f.every((k) => config[k] === 'all' || q[k] === config[k])),
    rng,
  )
    .slice(0, MODE_ROUNDS[config.mode])
    .map((q) => {
      const order = shuffle([0, 1, 2, 3], rng);
      return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
    });
}
export function makeRoom({ id, hostHash, inviteHash, name, config, deck, now }) {
  return {
    id,
    createdAt: now,
    expiresAt: now + RULES.ttlMs,
    inviteHash,
    players: [{ hash: hostHash, name, ready: false, rttMs: 0, jitterMs: 0 }, null],
    config,
    deck,
    phase: 'waiting',
    roundIndex: 0,
    round: null,
    scores: [0, 0],
    balances: [1000, 1000],
    escrow: 0,
    settled: false,
    winner: null,
    reason: null,
    events: [],
  };
}
// The planner receives only the timer. It cannot inspect a question, key or player input.
export function planBotAttempt(duration, rng = Math.random) {
  const minMs = 1000,
    maxMs = duration * 1000 - 500;
  return { choice: Math.floor(rng() * 4), elapsedMs: minMs + Math.floor(rng() * (maxMs - minMs + 1)) };
}
export function attachBot(r, rng = Math.random) {
  if (r.players[1]?.kind === 'bot') return false;
  requireValue(
    r.phase === 'waiting' && !r.players[1] && !r.settled,
    'A bot can only join an empty waiting seat.',
    409,
    'room_full',
  );
  r.config.opponent = 'bot';
  r.players[1] = { hash: null, name: 'Lucky Guess · BOT', kind: 'bot', ready: true, rttMs: 0, jitterMs: 0 };
  // Persist all plans before readiness. Retries, polling and human answers never reroll them.
  r.botPlans = r.deck.map(() => planBotAttempt(r.config.duration, rng));
  return true;
}
function advanceBot(r, now) {
  const rd = r.round,
    plan = r.botPlans?.[r.roundIndex];
  if (r.players[1]?.kind !== 'bot' || !plan || rd.issuedAt[1] === null || rd.answers[1]) return false;
  const dueAt = rd.issuedAt[1] + plan.elapsedMs;
  if (now < dueAt) return false;
  // A scheduled simulation, not a browser receipt: polling delay must not change the score.
  rd.answers[1] = {
    attemptId: `bot-${r.id}-${r.roundIndex}`,
    choice: plan.choice,
    elapsedMs: plan.elapsedMs,
    receivedAt: dueAt,
    serverElapsedMs: plan.elapsedMs,
    residualMs: 0,
    graceMs: 0,
    timingOK: true,
    correct: plan.choice === rd.question.correctIndex,
    simulated: true,
  };
  event(r, 'bot_attempt_locked', dueAt, { seat: 1 });
  return true;
}
function event(r, type, now, extra = {}) {
  r.events.push({ type, at: now, ...extra });
  r.events = r.events.slice(-32);
}
export function transportGrace(p) {
  return Math.min(RULES.maxTransportMs, Math.max(RULES.minTransportMs, 2 * p.rttMs + p.jitterMs + 250));
}
export function settleMatch(r, winner, reason, now) {
  if (r.settled) return false;
  if (winner === null) {
    r.balances[0] += r.escrow / 2;
    r.balances[1] += r.escrow / 2;
  } else r.balances[winner] += r.escrow;
  r.escrow = 0;
  r.settled = true;
  r.winner = winner;
  r.reason = reason;
  r.phase = reason === 'complete' ? 'complete' : 'cancelled';
  event(r, 'settled', now, { winner, reason });
  return true;
}
function beginRound(r, now) {
  r.players.forEach((p) => (p.ready = false));
  r.round = {
    id: `${r.id}:${r.roundIndex}`,
    scheduledAt: now + 3000,
    issuedAt: [null, null],
    answers: [null, null],
    question: r.deck[r.roundIndex],
    result: null,
  };
  r.phase = 'scheduled';
  event(r, 'round_scheduled', now, { roundId: r.round.id });
}
export function readyPlayer(r, seat, body, now) {
  requireValue(['waiting', 'between'].includes(r.phase), 'This round is already starting.', 409);
  if (r.players[seat].ready) return false;
  requireValue(r.players.every(Boolean), 'Wait for the second player.', 409);
  const p = r.players[seat];
  p.rttMs = Number.isFinite(body.rttMs) ? Math.min(1500, Math.max(0, body.rttMs)) : 0;
  p.jitterMs = Number.isFinite(body.jitterMs) ? Math.min(500, Math.max(0, body.jitterMs)) : 0;
  p.ready = true;
  if (r.players.every((p) => p.ready)) {
    if (r.phase === 'waiting') {
      requireValue(
        r.balances.every((v) => v >= r.config.stake),
        'Not enough demo coins.',
      );
      r.balances = r.balances.map((v) => v - r.config.stake);
      r.escrow = r.config.stake * 2;
    } else r.roundIndex++;
    beginRound(r, now);
  }
  return true;
}
export function revealPlayer(r, seat, roundId, now) {
  requireValue(r.round && r.round.id === roundId, 'That round is no longer active.', 409, 'stale_round');
  requireValue(['scheduled', 'playing'].includes(r.phase), 'The round is not active.', 409);
  requireValue(now >= r.round.scheduledAt, 'The shared countdown is not complete.', 409, 'too_early');
  if (r.round.issuedAt[seat] !== null) return false;
  r.round.issuedAt[seat] = now;
  if (seat === 0 && r.players[1]?.kind === 'bot') r.round.issuedAt[1] = now;
  r.phase = 'playing';
  event(r, 'question_issued', now, { seat });
  return true;
}
export function answerPlayer(r, seat, body, now) {
  const rd = r.round;
  requireValue(rd && body.roundId === rd.id, 'That round is no longer active.', 409, 'stale_round');
  requireValue(
    typeof body.attemptId === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(body.attemptId),
    'Invalid attempt ID.',
  );
  const existing = rd.answers[seat];
  if (existing) {
    requireValue(
      existing.attemptId === body.attemptId,
      'Your answer is already locked.',
      409,
      'already_answered',
    );
    requireValue(
      existing.choice === body.choice && existing.elapsedMs === body.elapsedMs,
      'This attempt ID already has different content.',
      409,
      'attempt_conflict',
    );
    return false;
  }
  requireValue(r.phase === 'playing' && !rd.result, 'The round is closed.', 409, 'round_closed');
  requireValue(rd.issuedAt[seat] !== null, 'Open the question before answering.', 409);
  requireValue(
    Number.isInteger(body.choice) && body.choice >= 0 && body.choice < 4,
    'Select one of the four answers.',
  );
  const elapsed = body.elapsedMs;
  requireValue(
    Number.isFinite(elapsed) && elapsed >= 0 && elapsed < r.config.duration * 1000,
    'The screen timer has expired.',
    409,
    'deadline',
  );
  const serverElapsed = now - rd.issuedAt[seat],
    grace = transportGrace(r.players[seat]);
  requireValue(
    now < rd.issuedAt[seat] + r.config.duration * 1000 + grace,
    'The server receipt deadline has passed.',
    409,
    'deadline',
  );
  const residual = serverElapsed - elapsed;
  const timingOK = residual >= -100 && residual <= grace;
  rd.answers[seat] = {
    attemptId: body.attemptId,
    choice: body.choice,
    elapsedMs: elapsed,
    receivedAt: now,
    serverElapsedMs: serverElapsed,
    residualMs: residual,
    graceMs: grace,
    timingOK,
    correct: body.choice === rd.question.correctIndex,
  };
  event(r, 'attempt_locked', now, { seat });
  return true;
}
function retainRound(r) {
  const rd = r.round;
  if (!rd?.result) return;
  const done = r.completedRounds || (r.completedRounds = []);
  if (done.some((x) => x.id === rd.id)) return;
  const q = rd.question;
  done.push({
    id: rd.id,
    index: r.roundIndex,
    question: {
      factId: q.id,
      domain: q.domain,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      sourceUrl: q.sourceUrl,
      sourceLabel: q.sourceLabel,
    },
    result: { ...rd.result },
    receipts: rd.answers.map((a) =>
      a
        ? {
            choice: a.choice,
            correct: a.correct,
            elapsedMs: a.elapsedMs,
            serverElapsedMs: a.serverElapsedMs,
            simulated: !!a.simulated,
          }
        : null,
    ),
  });
}
function finishRound(r, now) {
  const rd = r.round;
  if (rd.result) return false;
  const invalid = rd.answers.some((a) => a && !a.timingOK);
  if (invalid) {
    rd.result = { winner: null, reason: 'timing-inconsistent', tieMs: RULES.tieMs };
    retainRound(r);
    settleMatch(r, null, 'timing-inconsistent', now);
    return true;
  }
  const correct = rd.answers.map((a, i) => (a?.correct ? i : null)).filter((i) => i !== null);
  let winner = null,
    reason = 'no-correct-answer';
  if (correct.length === 1) {
    winner = correct[0];
    reason = 'correct';
  }
  if (correct.length === 2) {
    const diff = rd.answers[0].elapsedMs - rd.answers[1].elapsedMs;
    if (Math.abs(diff) <= RULES.tieMs) reason = 'close-result';
    else {
      winner = diff < 0 ? 0 : 1;
      reason = 'screen-time';
    }
  }
  rd.result = { winner, reason, tieMs: RULES.tieMs };
  retainRound(r);
  if (winner !== null) r.scores[winner]++;
  event(r, 'round_closed', now, { winner, reason });
  const complete =
    r.roundIndex === MODE_ROUNDS[r.config.mode] - 1 ||
    (r.config.mode === 'trilogy' && r.scores.some((x) => x === 2));
  if (complete) {
    const overall = r.scores[0] === r.scores[1] ? null : r.scores[0] > r.scores[1] ? 0 : 1;
    settleMatch(r, overall, 'complete', now);
  } else {
    r.phase = 'between';
    r.players.forEach((p) => (p.ready = p.kind === 'bot'));
  }
  return true;
}
export function advance(r, now) {
  if (r.settled) return false;
  if (now >= r.expiresAt) {
    settleMatch(r, null, 'room-expired', now);
    return true;
  }
  const rd = r.round;
  if (!rd || !['scheduled', 'playing'].includes(r.phase)) return false;
  if (now >= rd.scheduledAt + RULES.showWindowMs && rd.issuedAt.some((t) => t === null)) {
    settleMatch(r, null, 'player-not-connected', now);
    return true;
  }
  const botChanged = advanceBot(r, now);
  if (rd.issuedAt.every((t) => t !== null)) {
    const closed = rd.answers.every(
      (a, i) =>
        a ||
        now >=
          rd.issuedAt[i] + r.config.duration * 1000 + transportGrace(r.players[i]) + RULES.settlementBufferMs,
    );
    if (closed) return finishRound(r, now);
  }
  return botChanged;
}
export function projection(r, seat, revision, now) {
  const rd = r.round;
  const visible = rd && ((rd.issuedAt[seat] !== null && now >= rd.scheduledAt) || rd.result);
  let question = null;
  if (visible) {
    const q = rd.question;
    question = {
      id: rd.id,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
    };
    if (rd.result)
      Object.assign(question, {
        factId: q.id,
        domain: q.domain,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        sourceUrl: q.sourceUrl,
        sourceLabel: q.sourceLabel,
      });
  }
  return {
    id: r.id,
    createdAt: r.createdAt,
    revision,
    serverNow: now,
    expiresAt: r.expiresAt,
    seat,
    players: r.players.map((p) => (p ? { name: p.name, ready: p.ready, kind: p.kind || 'human' } : null)),
    config: r.config,
    phase: r.phase,
    roundIndex: r.roundIndex,
    scores: r.scores,
    balances: r.balances,
    escrow: r.escrow,
    settled: r.settled,
    winner: r.winner,
    reason: r.reason,
    completedRounds: r.completedRounds || [],
    round: rd
      ? {
          id: rd.id,
          scheduledAt: rd.scheduledAt,
          issuedAt: rd.issuedAt[seat],
          answerLocked: rd.answers.map(Boolean),
          question,
          result: rd.result,
          receipts: rd.result
            ? rd.answers.map((a) =>
                a
                  ? {
                      choice: a.choice,
                      correct: a.correct,
                      elapsedMs: a.elapsedMs,
                      serverElapsedMs: a.serverElapsedMs,
                      residualMs: a.residualMs,
                      timingOK: a.timingOK,
                      simulated: !!a.simulated,
                    }
                  : null,
              )
            : null,
        }
      : null,
    tieMs: RULES.tieMs,
    timingPolicy: 'client-screen-time-casual-v1',
  };
}
