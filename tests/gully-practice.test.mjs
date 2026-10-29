import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, planBotAttempt, PRACTICE_DURATIONS, DURATIONS } from '../lib/server/room-engine.mjs';
import { QUESTIONS } from '../lib/server/bank.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
import { MemoryRoomStore } from '../lib/duel-memory-store.mjs';
const config={opponent:'bot',mode:'gauntlet',duration:30,stake:0,domain:'sports',topic:'Cricket',difficulty:'simple'};
test('reading-friendly practice accepts long timers without widening friend timers or stakes',()=>{
 for(const duration of PRACTICE_DURATIONS){assert.equal(normalizeConfig({...config,duration},QUESTIONS).duration,duration);assert.throws(()=>normalizeConfig({...config,opponent:'friend',duration},QUESTIONS),/valid timer/);assert.throws(()=>normalizeConfig({...config,duration,stake:25},QUESTIONS),/free/);}
 assert.deepEqual([...DURATIONS],[5,7,10]);
});
test('long practice clock does not make the preplanned bot keep a fast player waiting 30 seconds',()=>{
 for(const d of PRACTICE_DURATIONS)for(const roll of [0,.25,.51,1-Number.EPSILON]){const plan=planBotAttempt(d,()=>roll);assert.ok(plan.elapsedMs>=1000&&plan.elapsedMs<=9500);assert.ok(plan.choice>=0&&plan.choice<4);}
});
test('first-play simple cricket runs all six rounds, keeps the timer and never stakes coins',async()=>{
 const store=new MemoryRoomStore();let now=1_000_000;
 const auth={roomId:crypto.randomUUID().replaceAll('-',''),token:crypto.randomUUID().replaceAll('-',''),invite:crypto.randomUUID().replaceAll('-','')};
 const call=(action,extra={})=>dispatch(store,{...auth,action,...extra},{now,actor:auth.token,rng:()=>.51});
 let data=await call('create',{name:'Reader',config});
 for(let i=0;i<6;i++){
  data=await call('ready',{roundId:data.room.round?.id??null});now=data.room.round.scheduledAt;
  data=await call('reveal',{roundId:data.room.round.id});assert.equal(data.room.config.duration,30);assert.equal(data.room.round.question.difficulty,'simple');
  const roundId=data.room.round.id;now+=1100;
  await call('answer',{roundId,attemptId:crypto.randomUUID().replaceAll('-',''),choice:0,elapsedMs:1000});now+=10_000;
  data=await call('state');assert.equal(data.room.config.stake,0);
 }
 assert.equal(data.room.phase,'complete');assert.equal(data.room.settled,true);
});
