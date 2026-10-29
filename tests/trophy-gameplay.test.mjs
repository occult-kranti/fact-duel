import test from 'node:test';
import assert from 'node:assert/strict';
import { BOT_REPLY_MS, MODE_ROUNDS, MODE_DURATION, RULES, normalizeConfig, chooseDeck, makeRoom, attachBot, readyPlayer, revealPlayer, answerPlayer, advance, projection, modeRoundVerdict } from '../lib/server/room-engine.mjs';
import { emptyProfile, reduceProfile, readProfile } from '../lib/passport.mjs';
import { emptyProgression, readProgression, reduceProgression, deriveEvents } from '../lib/progression.mjs';
import { readJournal, recordRoom } from '../lib/journal.mjs';
const pool = Array.from({ length: 16 }, (_, i) => ({ id: `stadium-test-${i}`, domain: 'sports', region: 'world', topic: 'Cricket', subtopic: 'History', difficulty: 'simple', question: `Card ${i}?`, options: ['A','B','C','D'], correctIndex: 0, sourceUrl: 'https://example.org/fact', sourceLabel: 'Test source', explanation: 'Test explanation.' }));
function game(mode = 'quick', duration = MODE_DURATION[mode]) {
  const config = normalizeConfig({ mode, duration, stake: 0, opponent: 'bot' }, pool);
  const room = makeRoom({ id: `test-${mode}`, hostHash: 'host', inviteHash: 'invite', name: 'Player', config, deck: pool.slice(0, MODE_ROUNDS[mode]), now: 100_000 });
  attachBot(room, () => .99);
  return room;
}
function open(room, now = 100_000) {
  readyPlayer(room, 0, {}, now);
  assert.equal(room.round.scheduledAt, now + 100);
  revealPlayer(room, 0, room.round.id, room.round.scheduledAt);
  return room.round.issuedAt[0];
}
function lock(room, start, { elapsed = 500, delay = 0, choice = 0, id = 'attempt_1234567890' } = {}) {
  const body = { roundId: room.round.id, attemptId: id, elapsedMs: elapsed, choice };
  answerPlayer(room, 0, body, start + elapsed + delay);
  return body;
}
test('bot waits exactly 3500ms from the first accepted answer, independent of correctness and timer', () => {
  for (const duration of [5,7,10,20,30]) for (const choice of [0,1]) {
    const room = game('quick', duration), start = open(room), plans = structuredClone(room.botPlans);
    assert.equal(advance(room, start + duration * 1000 - 2), false, 'bot cannot lock before a player answers');
    const body = lock(room, start, { elapsed: duration * 1000 - 1, choice, delay: 300 });
    const accepted = room.round.answers[0].receivedAt;
    for (let i = 0; i < 1000; i++) {
      advance(room, accepted + i % BOT_REPLY_MS);
      assert.equal(room.round.answers[1], null);
    }
    assert.equal(answerPlayer(room, 0, body, accepted + 1000), false);
    assert.throws(() => answerPlayer(room, 0, { ...body, attemptId: 'replacement_1234567890' }, accepted + 1000), /already locked/);
    const visible = projection(room, 0, 3, accepted + 1000);
    assert.equal(visible.round.botReplyAt, accepted + BOT_REPLY_MS);
    assert.equal(visible.round.question.correctIndex, undefined);
    assert.equal(visible.round.receipts, null);
    assert.equal(visible.botPlans, undefined);
    advance(room, accepted + BOT_REPLY_MS - 1);
    assert.equal(room.round.answers[1], null);
    advance(room, accepted + BOT_REPLY_MS);
    assert.equal(room.phase, 'complete');
    assert.equal(room.round.answers[1].receivedAt, accepted + BOT_REPLY_MS);
    assert.equal(room.round.answers[1].choice, plans[0].choice);
    assert.equal(room.round.answers[1].elapsedMs, plans[0].elapsedMs);
    assert.deepEqual(room.botPlans, plans);
    assert.equal(room.events.filter(e => e.type === 'bot_attempt_locked').length, 1);
  }
});
test('no-answer fallback closes once after the receipt window without deadlock or future rescheduling', () => {
  const room = game(), start = open(room), due = start + 10000 + RULES.minTransportMs + RULES.settlementBufferMs;
  advance(room, due - 1); assert.equal(room.round.answers[1], null);
  advance(room, due); assert.equal(room.phase, 'complete');
  assert.equal(room.round.answers[0], null);
  assert.equal(room.round.answers[1].receivedAt, due);
  advance(room, due + 100000);
  assert.equal(room.events.filter(e => e.type === 'settled').length, 1);
});
test('stadium modes are free bot-only formats with fixed clocks and enough distinct families', () => {
  for (const mode of ['chase','superover']) {
    const input = { mode, duration: MODE_DURATION[mode], opponent: 'bot', stake: 0 };
    assert.equal(normalizeConfig(input, pool).mode, mode);
    assert.throws(() => normalizeConfig({ ...input, opponent: 'friend' }, pool), /practice only/);
    assert.throws(() => normalizeConfig({ ...input, stake: 25 }, pool), /free/);
    assert.throws(() => normalizeConfig({ ...input, duration: 10 }, pool), /timer/);
    assert.throws(() => normalizeConfig(input, pool.slice(0, 4)), /broader filters/);
  }
  assert.throws(() => normalizeConfig({ mode: 'chase', duration:30, opponent:'bot', stake:0 }, pool.map(q=>({...q,familyId:'one-family'}))), /broader filters/);
});
test('Chase finishes at three correct for either seat and both reaching three is a draw', () => {
  for (const both of [false,true]) {
    const room = game('chase');
    for (const plan of room.botPlans) plan.choice = both ? 0 : 1;
    for (let i=0;i<3;i++) { const start=open(room,100000+i*10000); lock(room,start); advance(room,start+500+BOT_REPLY_MS); }
    assert.equal(room.phase,'complete'); assert.equal(room.completedRounds.length,3);
    assert.deepEqual(room.scores,both?[3,3]:[3,0]); assert.equal(room.winner,both?null:0);
  }
});
test('Chase takes the higher correct count at five and cannot exceed five rounds', () => {
  const room=game('chase'); room.botPlans.forEach(p=>p.choice=1);
  for(let i=0;i<5;i++){const start=open(room,100000+i*10000);lock(room,start,{choice:i<2?0:1});advance(room,start+4000);}
  assert.equal(room.phase,'complete');assert.equal(room.roundIndex,4);assert.deepEqual(room.scores,[2,0]);
});
test('Super Over uses strict 5s/10s boundaries, scores both seats, and plays all six balls', () => {
  for(const [elapsed,points] of [[0,6],[4999,6],[5000,4],[9999,4],[10000,2],[14999,2]]) assert.deepEqual(modeRoundVerdict('superover',[{correct:true,elapsedMs:elapsed},{correct:false,elapsedMs:0}]).points,[points,0]);
  const room=game('superover');assert.ok(room.botPlans.every(p=>p.elapsedMs>=10000), 'the preplanned bot can score in all three run bands');room.botPlans.forEach(p=>{p.choice=0;p.elapsedMs=5000;});
  const elapsed=[4999,5000,9999,10000,14999,500];
  for(let i=0;i<6;i++){const start=open(room,100000+i*25000);lock(room,start,{elapsed:elapsed[i],choice:i===5?1:0});advance(room,start+elapsed[i]+BOT_REPLY_MS);assert.equal(room.settled,i===5);}
  assert.deepEqual(room.scores,[18,24]);assert.equal(room.winner,1);assert.equal(room.completedRounds.length,6);
  const visible=projection(room,0,1,300000), profile=reduceProfile(emptyProfile(),{type:'room',room:visible,at:300000});
  assert.equal(profile.journal.matches[0].mode,'superover');
  assert.deepEqual(readJournal(JSON.stringify(profile.journal)).matches[0].scores,[18,24]);
  assert.equal(profile.progression.counters.byMode.superover.played,1);
  assert.equal(profile.progression.counters.attemptedRounds,6);
  assert.equal(readProfile(profile).progression.counters.attemptedRounds,6);
});
test('rotated room decks exclude recently reserved families until unseen families are exhausted', () => {
  const config=normalizeConfig({mode:'gauntlet',duration:30,stake:0,opponent:'bot'},pool);
  const first=chooseDeck(pool,config,()=>.5), history=Object.fromEntries(first.map(q=>[q.id,100]));
  const second=chooseDeck(pool,config,()=>.5,{history});
  assert.equal(second.filter(q=>history[q.id]).length,0);
  assert.equal(new Set(second.map(q=>q.id)).size,5);
});
test('attempted round counters exclude timeouts, count settled misses, and migrate conservatively', () => {
  const old=emptyProgression();old.counters.rounds=20;old.counters.correct=7;delete old.counters.attemptedRounds;
  assert.equal(readProgression(old).counters.attemptedRounds,7);
  let prog=reduceProgression(emptyProgression(),[{kind:'round',correct:false,answered:false,bot:true},{kind:'round',correct:false,answered:true,bot:true},{kind:'round',correct:true,bot:true}],100000);
  assert.equal(prog.counters.rounds,3);assert.equal(prog.counters.attemptedRounds,2);
  const room=game(),start=open(room);advance(room,start+11000);
  const before=emptyProfile(),visible=projection(room,0,1,start+11000),after={...before,journal:recordRoom(before.journal,visible,start+11000)};
  const event=deriveEvents(before,after,{type:'room',room:visible,at:start+11000}).find(e=>e.kind==='round');
  assert.equal(event.answered,false);
});

test('invalid receipt timing cancels Super Over before any runs or Club attempts are awarded', () => {
  const room=game('superover'), start=open(room);
  lock(room,start,{elapsed:1,delay:3000});
  advance(room,start+3001+BOT_REPLY_MS);
  assert.equal(room.phase,'cancelled');assert.equal(room.reason,'timing-inconsistent');assert.deepEqual(room.scores,[0,0]);
  const profile=reduceProfile(emptyProfile(),{type:'room',room:projection(room,0,1,start+7000),at:start+7000});
  assert.equal(profile.progression.counters.attemptedRounds,0);
});
