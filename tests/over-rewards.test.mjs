import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
import { transactProfile } from '../lib/profile-store.mjs';
import { emptyOverRewards, getOverRewardSummary, creditOverReward, localTitleProgress, matchRewardXp, readOverRewards, OVER_RECEIPT_LIMIT } from '../lib/over-rewards.mjs';
import { reconcileClub } from '../lib/stadium-collection.mjs';

const now = 1_800_000_000_000;
function room(id, mode = 'trilogy', { correct = true, timeout = false, modern = true, phase = 'complete' } = {}) {
  const count = mode === 'trilogy' ? 3 : 6;
  const completedRounds = Array.from({ length: count }, (_, index) => ({
    id: `${id}:${index}`, index, result: { winner: correct ? 0 : 1 },
    receipts: [{ choice: timeout && index === count - 1 ? null : 0, correct: correct && !(timeout && index === count - 1), elapsedMs: 5000 }, { choice: 1, correct: !correct, elapsedMs: 6000 }],
    question: { factId: `${id}-q${index}`, question: 'Which option?', options: ['A','B','C','D'], correctIndex: 0, explanation: 'A verified answer.', topic: 'Cricket', subtopic: 'International', sourceUrl: 'https://example.org/source', sourceLabel: 'Primary' },
  }));
  return { id, config: { mode, topic: 'Cricket', ...(modern ? { overRewardsVersion: 1 } : {}) }, phase, seat: 0, roundIndex: count - 1, completedRounds, round: completedRounds.at(-1), players: [{kind:'human'}, {kind:'bot'}], scores: correct ? [count,0] : [0,count], winner: correct ? 0 : 1 };
}
const act = (p, r) => reduceProfile(p, {type:'room', room:r, epoch:p.epoch, at:now});

test('completed overs reward every attempted round and count correct answers independently from duel score', () => {
  const mini = getOverRewardSummary(room('mini'));
  assert.deepEqual([mini.completionXp, mini.precisionXp, mini.clubPoints], [60,30,15]);
  const full = getOverRewardSummary(room('full','gauntlet'));
  assert.deepEqual([full.completionXp, full.precisionXp, full.clubPoints], [150,60,45]);
  const slower = room('slower'); slower.scores = [0,3]; slower.winner=1;
  assert.equal(getOverRewardSummary(slower).precisionXp,30);
  const wrong = getOverRewardSummary(room('wrong','gauntlet',{correct:false}));
  assert.deepEqual([wrong.completionXp,wrong.precisionXp],[150,0]);
});

test('timeouts, cancellation, old protocol and missing/void rounds grant no over bonuses', () => {
  for (const options of [{timeout:true},{phase:'cancelled'},{phase:'between'},{modern:false}]) assert.equal(getOverRewardSummary(room('no','trilogy',options)).eligible,false);
  const missing=room('missing'); missing.completedRounds=missing.completedRounds.slice(1);
  assert.equal(getOverRewardSummary(missing).eligible,false);
  const invalid=room('void'); invalid.completedRounds[0].result.reason='timing-inconsistent';
  assert.equal(getOverRewardSummary(invalid).eligible,false);
});

test('profile transaction stores completion XP, Club bonus and a permanent receipt together', () => {
  const r=room('persist','gauntlet');
  const p=act(emptyProfile('over-epoch',now),r);
  assert.equal(p.progression.overRewards.completed,1);
  assert.equal(p.progression.overRewards.full,1);
  assert.equal(p.progression.overRewards.clubPoints,45);
  assert.equal(p.progression.log.find(e=>e.meta?.bonus==='over-completion-v1').xp,210);
  assert.equal(getOverRewardSummary(r,p).credited,true);
  assert.equal(reconcileClub(null,p).earned,30+6*3+45);
  const restored=readProfile(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(restored.progression.overRewards,p.progression.overRewards);
  assert.equal(act(restored,r).progression.xp,p.progression.xp);
  // The compact receipt survives removal of all recent-match and recent-round history.
  const trimmed={...restored,journal:{...restored.journal,matches:[],rounds:[]}};
  const replay=act(trimmed,r);
  assert.equal(replay.progression.xp,p.progression.xp);
  assert.equal(replay.progression.counters.matches,p.progression.counters.matches);
  assert.equal(replay.progression.overRewards.completed,1);
});

test('concurrent repeated results pay the new over reward once', async () => {
  const p=await transactProfile({type:'reset',newEpoch:'over-concurrency',at:now});
  const r=room('concurrent');
  const results=await Promise.all(Array.from({length:20},()=>transactProfile({type:'room',room:r,epoch:p.epoch,at:now})));
  assert.ok(results.every(x=>x.progression.overRewards.completed===1));
  assert.equal(new Set(results.map(x=>x.progression.xp)).size,1);
});

test('earned titles have fixed, nonexpiring thresholds and reset isolates old in-flight actions', () => {
  let p=emptyProfile('old',now);
  assert.equal(localTitleProgress(p).title,'Gully Starter');
  assert.equal(localTitleProgress(p).remaining,3);
  for(let i=0;i<3;i++) p=act(p,room(`title-${i}`));
  assert.equal(localTitleProgress(p).title,'Mohalla Captain');
  assert.equal(localTitleProgress(p).remaining,7);
  const copy=readProfile(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(localTitleProgress(copy),localTitleProgress(p));
  const reset=reduceProfile(p,{type:'reset',newEpoch:'new',at:now+1000});
  assert.equal(localTitleProgress(reset).title,'Gully Starter');
  assert.strictEqual(reduceProfile(reset,{type:'room',room:room('stale'),epoch:'old',at:now}),reset);
});

test('receipt capacity fails closed, never drops old receipt IDs, and corrupt counters cannot mint Club points', () => {
  const ids=Array.from({length:OVER_RECEIPT_LIMIT},(_,i)=>`old-${i}`);
  const record=readOverRewards({version:1,ids,full:10,clubPoints:1e12,completed:1e12});
  assert.equal(record.completed,OVER_RECEIPT_LIMIT);
  assert.equal(record.clubPoints,(OVER_RECEIPT_LIMIT-10)*15+10*45);
  const result=creditOverReward(record,getOverRewardSummary(room('new')));
  assert.equal(result.credited,false);
  assert.deepEqual(result.record.ids,ids);
  assert.deepEqual(readOverRewards({version:1,ids:[],full:400,clubPoints:999}),emptyOverRewards());
});

test('result XP includes only matching room receipts, excluding same-time rewards from another tab', () => {
  const p={progression:{log:[{xp:30,meta:{matchId:'mine'}},{xp:60,meta:{matchId:'mine'}},{xp:999,meta:{matchId:'other'}},{xp:100,kind:'quest'}]}};
  assert.equal(matchRewardXp(p,'mine'),90);
});
