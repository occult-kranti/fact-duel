import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {transactProfile} from '../lib/profile-store.mjs';
import {passportSummary} from '../lib/passport.mjs';
import {dispatch} from '../lib/server/duel-service.mjs';
const card=(i)=>({factId:`q${i}`,question:`Question ${i}?`,options:['A','B','C','D'],correctIndex:0,explanation:'Explanation.',topic:'Space',subtopic:'Orbits',sourceUrl:'https://example.org/fact',sourceLabel:'Source'});
test('browser database serializes independent updates, immutable retries and stale writes after reset',async()=>{
 await transactProfile({type:'reset',newEpoch:'test-1',at:0});
 await Promise.all(Array.from({length:30},(_,i)=>transactProfile({type:'practice',epoch:'test-1',at:1000,fact:card(i),choice:1,roundId:`practice:${i}`})));
 const before=await transactProfile(null);assert.equal(before.journal.rounds.length,30);assert.equal(passportSummary(before.passport).points,450);
 await Promise.all(Array.from({length:10},()=>transactProfile({type:'open',epoch:'test-1',at:2000,roundId:'practice:0'})));
 const after=await transactProfile(null);assert.equal(passportSummary(after.passport).points,455);
 await transactProfile({type:'reset',newEpoch:'test-2',at:3000});
 await transactProfile({type:'practice',epoch:'test-1',at:4000,fact:card(40),choice:0,roundId:'stale'});
 const reset=await transactProfile(null);assert.equal(reset.journal.rounds.length,0);assert.equal(passportSummary(reset.passport).points,0);assert.equal(reset.epoch,'test-2');
 const legacy={version:1,rounds:[before.journal.rounds[0]],matches:[],saved:[]};
 const reloaded=await transactProfile(null,JSON.stringify(legacy));assert.equal(reloaded.journal.rounds.length,0,'old localStorage cannot resurrect after DB reset');
});

test('two browser transactions cannot overwrite expedition choices, skip a card or duplicate its stamp',async()=>{
 const epoch='journey-race';await transactProfile({type:'reset',newEpoch:epoch,at:0});
 const {cards}=await dispatch(null,{action:'expedition',routeId:'cricket'});
 const event={epoch,routeId:'cricket',runId:'race-run',at:1000};
 await Promise.all(['race-run','other-run'].map(runId=>transactProfile({...event,type:'journey-start',runId,cards,previousRunId:null})));
 let p=await transactProfile(null);assert.equal(p.journeys['cricket:1'].run.id,'race-run');
 for(let i=0;i<6;i++){
  await Promise.all([transactProfile({...event,type:'journey-answer',index:i,choice:cards[i].correctIndex,confidence:'bold'}),transactProfile({...event,type:'journey-answer',index:i,choice:(cards[i].correctIndex+1)%4,confidence:'steady'})]);
  await Promise.all([transactProfile({...event,type:'journey-next',index:i}),transactProfile({...event,type:'journey-next',index:i})]);
 }
 p=await transactProfile(null);assert.equal(p.journeys['cricket:1'].first.score,18);assert.equal(p.journeys['cricket:1'].completions,1);assert.equal(p.journal.rounds.length,6);
 await transactProfile({type:'reset',newEpoch:'journey-reset',at:3000});
 await transactProfile({...event,type:'journey-start',runId:'late-load',cards,previousRunId:null});assert.deepEqual((await transactProfile(null)).journeys,{});
});
