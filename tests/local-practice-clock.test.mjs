import test from 'node:test';
import assert from 'node:assert/strict';
import { localPracticeStartAt, createBackgroundTaskQueue } from '../lib/local-practice-clock.mjs';
import { makeRoom, attachBot, readyPlayer, revealPlayer, answerPlayer } from '../lib/server/room-engine.mjs';

const question = {id:'clock-q',question:'Question',options:['A','B','C','D'],correctIndex:0};
test('slow display of a local bot question uses its issued clock without weakening timing checks', () => {
  const room = makeRoom({ id:'clock-room', hostHash:'host', inviteHash:'invite', name:'Player',
    config:{mode:'trilogy',duration:30,opponent:'bot',stake:0},deck:[question,question,question],now:100000 });
  attachBot(room, () => .51); readyPlayer(room,0,{},100000);
  const issuedAt=room.round.scheduledAt;
  revealPlayer(room,0,room.round.id,issuedAt);
  // Reproduces the observed 2.033 s post-issue render delay plus a 4.633 s answer.
  const shownAt=5000;
  const at=localPracticeStartAt({now:shownAt,wallNow:issuedAt+2033,issuedAt,useIssueTime:true});
  assert.equal(at,2967);
  assert.equal(30000-(shownAt-at),27967);
  const elapsedMs=shownAt+4633-at;
  answerPlayer(room,0,{roundId:room.round.id,attemptId:'clock_attempt_0001',choice:0,elapsedMs},issuedAt+6666);
  assert.equal(room.round.answers[0].timingOK,true);
  assert.equal(room.round.answers[0].residualMs,0);
  assert.equal(room.round.answers[0].graceMs,500);
});

test('other transports and missing issue stamps preserve the existing visible-start clock', () => {
  for (const issuedAt of [null,undefined,NaN]) assert.equal(localPracticeStartAt({now:5000,wallNow:100000,issuedAt,useIssueTime:true}),5000);
  assert.equal(localPracticeStartAt({now:5000,wallNow:100000,issuedAt:97000,useIssueTime:false}),5000);
  assert.equal(localPracticeStartAt({now:5000,wallNow:100000,issuedAt:100001,useIssueTime:true}),5000);
});

test('storage bookkeeping never blocks the caller and duplicates share one in-flight job', async () => {
  const queue=createBackgroundTaskQueue(); let release, writes=0;
  const blocked=new Promise(resolve=>{release=resolve;});
  const task=queue('room/round',async()=>{writes++;await blocked;});
  const duplicate=queue('room/round',()=>{throw new Error('duplicate work');});
  assert.equal(task,duplicate);
  let responseReturned=false; await Promise.resolve().then(()=>{responseReturned=true;});
  assert.equal(responseReturned,true); assert.equal(writes,1);
  release(); assert.equal(await task,true);
});

test('failed background persistence is handled and the next snapshot can retry', async () => {
  const queue=createBackgroundTaskQueue(); let writes=0;
  assert.equal(await queue('room/round',()=>{writes++;throw new Error('storage denied');}),false);
  assert.equal(await queue('room/round',()=>{writes++;}),true);
  assert.equal(writes,2);
});
