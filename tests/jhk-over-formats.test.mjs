import test from 'node:test';
import assert from 'node:assert/strict';
import { MODE_ROUNDS, matchDecided, normalizeConfig, makeRoom, attachBot, readyPlayer, revealPlayer, answerPlayer, advance, projection, BOT_REPLY_MS } from '../lib/server/room-engine.mjs';
import { FORMAT_COPY } from '../lib/duel-presentation.mjs';
const pool = Array.from({length: 12}, (_, i) => ({id: `over-${i}`, question: `Question ${i}`, options: ['A','B','C','D'], correctIndex: 0, topic: 'Cricket'}));

test('Mini over always resolves three rounds and Full over six, including decisive leads and ties', () => {
  assert.equal(MODE_ROUNDS.trilogy, 3);
  assert.equal(MODE_ROUNDS.gauntlet, 6);
  for (const [mode, length] of [['trilogy', 3], ['gauntlet', 6]]) {
    for (let i = 0; i < length; i++) for (const scores of [[6,0], [0,6], [0,0], [3,3]])
      assert.equal(matchDecided(mode, i, scores), i === length - 1);
    const config = normalizeConfig({mode, duration: 30, opponent: 'bot', stake: 0}, pool);
    assert.equal(config.overRewardsVersion, 1);
    assert.equal(FORMAT_COPY[mode].number, String(length).padStart(2, '0'));
  }
  assert.equal(normalizeConfig({mode: 'quick', duration: 30, opponent:'bot', stake:0}, pool).overRewardsVersion, undefined);
});

test('an existing five-card room finishes its original deck and does not gain new-over reward eligibility', () => {
  const config = { mode:'gauntlet', duration:30, opponent:'bot', stake:0 };
  const room = makeRoom({id:'old-five-card-room', hostHash:'host', inviteHash:'invite', name:'Reader', config, deck: pool.slice(0,5), now:100000});
  attachBot(room, () => .99);
  room.botPlans.forEach(p => { p.choice = 1; });
  for (let i=0; i<5; i++) {
    const now = 100000 + i*10000;
    readyPlayer(room,0,{},now);
    const start = room.round.scheduledAt;
    revealPlayer(room,0,room.round.id,start);
    answerPlayer(room,0,{roundId:room.round.id,attemptId:`legacy_attempt_${i}`,choice:0,elapsedMs:500},start+500);
    advance(room,start+500+BOT_REPLY_MS);
    assert.equal(room.phase, i===4 ? 'complete' : 'between');
  }
  const view = projection(room,0,1,200000);
  assert.equal(view.roundCount,5);
  assert.equal(view.completedRounds.length,5);
  assert.equal(view.config.overRewardsVersion,undefined);
});
