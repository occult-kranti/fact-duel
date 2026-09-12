import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPEDITIONS,CONFIDENCE,runResult,validExpeditionCards,expeditionStatus} from '../lib/expeditions.mjs';
import {emptyProfile,readProfile,reduceProfile,passportSummary} from '../lib/passport.mjs';
import {dispatch} from '../lib/server/duel-service.mjs';
import {handleDuelRequest} from '../lib/server/http-handler.mjs';
const route=EXPEDITIONS[0];
const act=(p,a)=>reduceProfile(p,{epoch:p.epoch,at:1000,routeId:route.id,...a});
async function begin(p=emptyProfile(),runId='run-1',r=route){
 const {cards}=await dispatch(null,{action:'expedition',routeId:r.id});
 return act(p,{type:'journey-start',routeId:r.id,runId,cards,previousRunId:p.journeys[r.key]?.run?.id??null});
}
function answer(p,index,correct=true,confidence='steady',runId='run-1'){
 const f=p.journeys[route.key].run.cards[index];
 return act(p,{type:'journey-answer',index,runId,choice:correct?f.correctIndex:(f.correctIndex+1)%4,confidence});
}
function next(p,index,runId='run-1'){return act(p,{type:'journey-next',index,runId});}
function finish(p,correct=true,confidence='steady',runId='run-1'){
 for(let i=0;i<6;i++){p=answer(p,i,correct,confidence,runId);p=next(p,i,runId);}return p;
}
test('all nine packs match finite manifests, preserve sources and leave catalogue answer-free',async()=>{
 const ids=[];
 for(const r of EXPEDITIONS){const pack=await dispatch(null,{action:'expedition',routeId:r.id});assert.equal(pack.practice,true);assert.equal(pack.version,1);assert.ok(validExpeditionCards(pack.cards,r));assert.deepEqual(pack.cards.map(f=>f.factId),r.ids);ids.push(...r.ids);}
 assert.equal(new Set(ids).size,54);
 assert.ok(!JSON.stringify(await dispatch(null,{action:'catalogue'})).includes('correctIndex'));
 await assert.rejects(dispatch(null,{action:'expedition',routeId:'constructor'}),e=>e.status===400);
 const res=await handleDuelRequest(new Request('https://example.test/api/duel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'expedition',routeId:route.id})}),{});
 assert.equal(res.status,200);assert.equal((await res.json()).cards.length,6);
});
test('signed confidence scoring is exact; scoring stance and first choice cannot change',async()=>{
 let p=await begin();p=answer(p,0,false,'bold');assert.deepEqual(runResult(p.journeys[route.key].run),{score:-1,correct:0,bold:1});
 assert.strictEqual(answer(p,0,true,'steady'),p);assert.equal(p.journal.rounds.length,1);assert.equal(p.journal.rounds[0].correct,false);
 p=next(p,0);p=answer(p,1,true,'steady');assert.deepEqual(runResult(p.journeys[route.key].run),{score:1,correct:1,bold:1});
 assert.equal(CONFIDENCE.steady.correct*.5,CONFIDENCE.bold.correct*.5+CONFIDENCE.bold.wrong*.5);
});
test('all correct and all wrong runs earn one completion stamp with truthful scores',async()=>{
 for(const hit of [true,false]){let p=finish(await begin(),hit,'bold');const r=p.journeys[route.key];assert.equal(r.first.score,hit?18:-6);assert.equal(r.first.correct,hit?6:0);assert.equal(r.completions,1);assert.equal(r.run.cursor,6);assert.equal(expeditionStatus(r),'complete');assert.strictEqual(next(p,5),p);assert.equal(p.journal.matches.length,0);assert.equal(p.journal.rounds.length,6);}
});
test('cannot skip unanswered cards, replace partial runs or apply stale answer/advance',async()=>{
 let p=await begin();assert.strictEqual(next(p,0),p);assert.strictEqual(answer(p,1),p);assert.strictEqual(answer(p,0,true,'bold','wrong-run'),p);
 assert.strictEqual(await begin(p,'replacement'),p);p=answer(p,0);p=next(p,0);
 assert.strictEqual(next(p,0),p);assert.strictEqual(answer(p,0),p);
 for(const confidence of ['unknown','constructor','__proto__'])assert.strictEqual(answer(p,1,true,confidence),p);
});
test('resume preserves selected answer before advancing and all answered before explicit finish',async()=>{
 let p=await begin();p=answer(p,0,false,'bold');p=readProfile(JSON.parse(JSON.stringify(p)));
 assert.equal(p.journeys[route.key].run.answers[0].confidence,'bold');assert.equal(p.journeys[route.key].run.cursor,0);assert.equal(p.journeys[route.key].first,null);
 p=next(p,0);for(let i=1;i<6;i++){p=answer(p,i,true,'steady');if(i<5)p=next(p,i);}
 p=readProfile(JSON.parse(JSON.stringify(p)));assert.equal(p.journeys[route.key].run.cursor,5);assert.equal(p.journeys[route.key].run.answers.length,6);assert.equal(p.journeys[route.key].first,null);assert.equal(expeditionStatus(p.journeys[route.key]),'continue');
 p=next(p,5);assert.equal(p.journeys[route.key].first.score,9);assert.deepEqual(readProfile(JSON.parse(JSON.stringify(p))),p);
});
test('replay retains immutable first result and caps activity awards to distinct content',async()=>{
 let p=finish(await begin(),false,'bold');const first=p.journeys[route.key].first,points=passportSummary(p.passport).points;
 p=await begin(p,'run-2');p=finish(p,true,'bold','run-2');assert.deepEqual(p.journeys[route.key].first,first);assert.equal(p.journeys[route.key].best.score,18);assert.equal(p.journeys[route.key].completions,2);assert.equal(passportSummary(p.passport).points,points);assert.equal(p.journal.rounds.length,12);
 assert.strictEqual(act(p,{type:'journey-start',runId:'run-3',cards:p.journeys[route.key].run.cards,previousRunId:'run-1'}),p);
});
test('independent routes resume without replacement; reset epoch rejects delayed work',async()=>{
 let p=await begin();p=answer(p,0);p=await begin(p,'space-run',EXPEDITIONS[5]);assert.equal(Object.keys(p.journeys).length,2);assert.equal(p.journeys[route.key].run.answers.length,1);
 const oldEpoch=p.epoch,cards=p.journeys[route.key].run.cards;p=act(p,{type:'reset',newEpoch:'new-generation'});assert.deepEqual(p.journeys,{});
 assert.strictEqual(act(p,{type:'journey-start',epoch:oldEpoch,runId:'delayed',cards,previousRunId:null}),p);
 assert.strictEqual(act(p,{type:'journey-answer',epoch:oldEpoch,runId:'run-1',index:0,choice:0,confidence:'bold'}),p);
});
test('older profiles migrate without invented history; malformed route snapshots are discarded',async()=>{
 const old=emptyProfile();delete old.journeys;assert.deepEqual(readProfile(old).journeys,{});
 let p=await begin();const altered=JSON.parse(JSON.stringify(p));altered.journeys[route.key].run.cards[0].factId='q999';assert.deepEqual(readProfile(altered).journeys,{});
 const bad=JSON.parse(JSON.stringify(p));bad.journeys[route.key].run.cards[0].correctIndex=9;assert.deepEqual(readProfile(bad).journeys,{});
 const copy=JSON.parse(JSON.stringify(p));copy.journeys['unknown:2']=copy.journeys[route.key];assert.equal(Object.keys(readProfile(copy).journeys).length,1);
});
test('corrupted completion summaries cannot invent impossible scores or contradictory earned screens',async()=>{
 const p=finish(await begin(),true,'bold');
 for(const tuple of [{score:18,correct:0,bold:0},{score:1,correct:1,bold:0},{score:-6,correct:0,bold:0}]){
  const bad=JSON.parse(JSON.stringify(p));Object.assign(bad.journeys[route.key].first,tuple);assert.deepEqual(readProfile(bad).journeys,{});
 }
 const missing=JSON.parse(JSON.stringify(p));delete missing.journeys[route.key].first;assert.deepEqual(readProfile(missing).journeys,{});
 const wrongLast=JSON.parse(JSON.stringify(p));wrongLast.journeys[route.key].last.runId='other';const out=readProfile(wrongLast).journeys[route.key];assert.equal(out.run,null);assert.equal(out.first.score,18);
 const corruptBest=JSON.parse(JSON.stringify(p));corruptBest.journeys[route.key].best.correct=0;assert.equal(readProfile(corruptBest).journeys[route.key].best.correct,6);
});
