/** Two synthetic zero-stake private games, no answers/rewards. All created profiles deleted in finally. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { rotationKey } from '../lib/question-rotation.mjs';
const endpoint=process.env.JHK_GAME_URL;
if(!endpoint || !/^https:\/\//.test(endpoint)) throw new Error('Set JHK_GAME_URL to the deployed HTTPS function after the migrations are applied.');
const guests=[],checks=[],cleanup=[],startedAt=new Date().toISOString();
let failure=null;
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);console.log(`PASS ${name}`)};
async function call(action,payload={},guest=null){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-region':'ap-south-1',...(guest?{'x-jhk-session':guest.token}:{})},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(18000)});
 const data=await response.json();assert.ok(response.ok&&data?.ok,`${action} failed (${response.status}; ${data?.error?.code||'unknown'})`);return data;
}
async function createGuest(seat){
 const data=await call('session',{nickname:`QA Road ${seat} ${Date.now().toString(36)}`,adultConfirmed:true,termsVersion:'beta-1'});
 assert.match(data.token,/^[a-f0-9]{64}$/);const guest={token:data.token,id:data.session.id};guests.push(guest);
 check(`seat ${seat} has zero server-derived trophies`,data.session.humanRoad?.trophies===0&&data.session.humanRoad.stadiumId==='gully'&&data.session.humanRoad.source==='server-human-results');return guest;
}
try {
 const a=await createGuest('A'),b=await createGuest('B');let previous=null,firstHistory=null;
 for(let game=0;game<2;game++) {
  const created=await call('create',{file:'cricket',stake:0},a),roomId=created.match.id;
  const joined=await call('join',{code:created.match.code},b);
  check(`game ${game+1} is a two-human private zero-stake room`,joined.match.players.length===2&&joined.match.mode==='private'&&joined.match.stake===0);
  if(game===0){
   const payload={roomId,sticker:'nice-shot',requestId:crypto.randomUUID()};const sent=await call('reaction',payload,a);const retry=await call('reaction',payload,a);const rival=await call('snapshot',{roomId},b);
   check('existing banter survives migration with idempotent opponent delivery',sent.match.reactionsEnabled&&retry.match.reactions.length===1&&rival.match.reactions.some(r=>r.id===payload.requestId));
  }
  await call('ready',{roomId,stake:0},a);const ready=await call('ready',{roomId,stake:0},b);
  check(`game ${game+1} countdown hides the question`,ready.match.phase==='countdown'&&ready.match.question===null);
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,Math.min(4000,ready.match.startsAt-ready.serverNow+150))));
  const qa=await call('snapshot',{roomId},a),qb=await call('snapshot',{roomId},b),q=qa.match.question;
  check(`game ${game+1} exposes the same card to both seats without its key`,!!q&&q.id===qb.match.question?.id&&q.correctIndex===undefined&&q.explanation===undefined&&q.sourceUrl===undefined&&qa.match.receipt===null);
  const family=rotationKey(q);const exported=await call('exportProfile',{},a);
  check(`game ${game+1} persists newly delivered history`,Number.isFinite(exported.questionHistory?.[family]));
  if(previous) check('next game avoids the previously exposed fact family',family!==previous);
  else {previous=family;firstHistory=exported.questionHistory[family];}
  await call('snapshot',{roomId},a);const polled=await call('exportProfile',{},a);
  check(`game ${game+1} repeated polls preserve exposure time`,polled.questionHistory[family]===exported.questionHistory[family]);
  check('earlier exposure is not refreshed by later play',polled.questionHistory[previous]===firstHistory);
  const left=await call('leave',{roomId},a);
  check(`game ${game+1} closes without reward or stake`,left.match.phase==='cancelled'&&left.match.economy.reserved===0&&left.match.economy.reward===0);
 }
 for(const guest of guests){const profile=await call('profile',{trophies:999999,humanRoad:{trophies:999999}},guest);check('cancelled practice-like human tests cannot mint trophies or coins',profile.session.humanRoad.trophies===0&&profile.session.humanRoad.eligibleMatches===0&&profile.session.balance===100);}
}catch(error){failure={name:error.name,message:error.message};process.exitCode=1;}
finally{
 for(let i=0;i<guests.length;i++)try{const data=await call('deleteSession',{},guests[i]);assert.equal(data.deleted,true);cleanup.push({seat:i===0?'A':'B',deleted:true});}catch(error){cleanup.push({seat:i===0?'A':'B',deleted:false,error:error.message});process.exitCode=1;}
 const evidence={suite:'trophy-road-live-rotation',startedAt,finishedAt:new Date().toISOString(),endpoint,result:failure||cleanup.some(c=>!c.deleted)?'fail':'pass',checks:checks.length,assertions:checks,cleanup,...(failure?{failure}:{}),scope:'Two synthetic private zero-stake rooms, no submitted answers, no result rewards. No real player modified. No load-capacity claim. Credentials, identifiers and invite codes are omitted.'};
 await fs.mkdir(new URL('../docs/trophy-road/verification/',import.meta.url),{recursive:true});
 await fs.writeFile(new URL('../docs/trophy-road/verification/live-rotation.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({suite:evidence.suite,result:evidence.result,checks:evidence.checks,cleanup}));if(failure)console.error(failure.message);
}
