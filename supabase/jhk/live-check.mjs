/** Live deployment smoke: real isolated profile credentials, private human seats, full result.
 * JHK_GAME_URL=https://.../functions/v1/jhk-game SUPABASE_ANON_KEY=... node supabase/jhk/live-check.mjs
 * Optional SIBLING_GAME_URL checks independent HISAAB/AYD credentials in both directions.
 * Creates disposable QA profiles; deletes them in finally. Never logs bearer credentials.
 */
import assert from 'node:assert/strict';
import {ALL_QUESTIONS} from '../../lib/server/bank.mjs';
const endpoint=process.env.JHK_GAME_URL;
const key=process.env.SUPABASE_ANON_KEY;
if(!endpoint)throw new Error('Set JHK_GAME_URL. SUPABASE_ANON_KEY is optional with custom profile bearer authentication.');
if(!/^https:\/\//.test(endpoint))throw new Error('Use an HTTPS deployed function URL.');
const questions=new Map(ALL_QUESTIONS.map(q=>[q.id,q]));
const guests=[];const checks=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);console.log(`PASS ${name}`);};
async function call(action,payload={},guest=null,url=endpoint,header='x-jhk-session',allowError=false){
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-region':'ap-south-1',...(key?{apikey:key,Authorization:`Bearer ${key}`} : {}),...(guest?{[header]:guest.token}:{})},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(18000)});
 const data=await response.json();
 if(!allowError)assert.ok(response.ok && data.ok,`${action} failed: ${JSON.stringify(data.error||{status:response.status})}`);
 return data;
}
async function create(nickname,url=endpoint,header='x-jhk-session'){
 const result=await call('session',{nickname,email:`qa-${crypto.randomUUID()}@example.invalid`,adultConfirmed:true,termsVersion:'beta-1'},null,url,header);assert.match(result.token,/^[a-f0-9]{64}$/);assert.match(result.recoveryCode,/^[a-f0-9]{64}$/);assert.equal(result.session.profileComplete,true);
 const guest={token:result.token,id:result.session.id,url,header};guests.push(guest);return guest;
}
async function room(a,b,stake,file='science'){
 const created=await call('create',{stake,file},a);const joined=await call('join',{code:created.match.code},b);
 assert.equal(joined.match.id,created.match.id);return created.match;
}
async function awaitQuestions(a,b,roomId){
 const end=Date.now()+45000;
 while(Date.now()<end){
  const [left,right]=await Promise.all([call('snapshot',{roomId},a),call('snapshot',{roomId},b)]);
  if(left.match.question && right.match.question && left.match.phase==='question' && right.match.phase==='question')return [left.match,right.match];
  assert.ok(!['cancelled','finished'].includes(left.match.phase),'room remains active while waiting for question');await pause(350);
 }
 throw new Error('Question release timeout');
}
try{
 const stamp=Date.now().toString(36);const a=await create(`QA JHK A ${stamp}`);const b=await create(`QA JHK B ${stamp}`);
 check('two independent server profiles',a.id!==b.id && a.token!==b.token);
 if(process.env.SIBLING_GAME_URL){
  const sibling=await create(`QA Cross ${stamp}`,process.env.SIBLING_GAME_URL,'x-hisaab-session');
  const wrongA=await call('profile',{},a,sibling.url,sibling.header,true);const wrongB=await call('profile',{},sibling,endpoint,'x-jhk-session',true);
  check('cross-game profile credentials are rejected in both directions',wrongA.error?.code==='UNAUTHORIZED' && wrongB.error?.code==='UNAUTHORIZED');
 }
 const beforeA=(await call('profile',{},a)).session.balance;const beforeB=(await call('profile',{},b)).session.balance;
 let game=await room(a,b,20);
 check('friend invite selects a second human and disclosed stake',game.stake===20 && game.file==='science');
 const roomId=game.id;
 await Promise.all([call('ready',{roomId,stake:20},a),call('ready',{roomId,stake:20},a)]);
 check('concurrent duplicate ready reserves exactly once',(await call('profile',{},a)).session.balance===beforeA-20);
 const reserved=await call('ready',{roomId,stake:20},b);
 check('both stakes reserved before countdown',reserved.match.economy.reserved===20 && ['countdown','question'].includes(reserved.match.phase));
 let expectedXp=0;
 for(let round=1;round<=5;round++){
  const [left,right]=await awaitQuestions(a,b,roomId);
  assert.equal(left.round,round);assert.equal(right.question.id,left.question.id);
  check(`round ${round} hides key until answer`,!('correctIndex' in left.question) && !('explanation' in left.question) && left.question.domain==='science');
  const source=questions.get(left.question.id);assert.ok(source,'question belongs to existing reviewed bank');
  const rightText=source.options[source.correctIndex];const choice=left.question.options.findIndex(option=>option.en===rightText);assert.ok(choice>=0);
  const requestId=crypto.randomUUID();
  const [acceptedA,acceptedB,duplicateA]=await Promise.all([call('answer',{roomId,round,choice,requestId},a),call('answer',{roomId,round,choice:(choice+1)%4,requestId:crypto.randomUUID()},b),call('answer',{roomId,round,choice,requestId},a)]);
  const receiptA=[acceptedA,duplicateA].find(response=>response.match.round===round && response.match.receipt)?.match.receipt;
  assert.ok(receiptA,'at least one concurrent answer returns its own locked receipt');
  if(duplicateA.match.round===round && duplicateA.match.receipt)assert.deepEqual(duplicateA.match.receipt,receiptA,'concurrent duplicate answer preserves one immutable receipt');
  expectedXp+=receiptA.xp;
  assert.equal(receiptA.correct,true);if(acceptedB.match.round===round)assert.equal(acceptedB.match.receipt.correct,false);
  const retried=await call('answer',{roomId,round,choice,requestId},a);
  if(retried.match.round===round)assert.equal(retried.match.receipt.choice,choice);
  else assert.equal(retried.match.round,round+1,'late old-answer retry may return the automatically advanced current round');
  game=(await call('snapshot',{roomId},a)).match;
  if(round<5){
   if(game.round===round){assert.equal(game.phase,'result');await call('next',{roomId},a);await call('next',{roomId},b);}
   else assert.equal(game.round,round+1,'result break may advance automatically before a slow client continues');
  }
 }
 check('five-round match completes with authoritative winner',game.phase==='finished' && game.winnerId===a.id);
 const afterA=(await call('profile',{},a)).session;const afterB=(await call('profile',{},b)).session;
 check('concurrent answer retries credit server XP exactly once',afterA.onlineXp===expectedXp);
 check('single pot and eligible completion reward conserve ledger',afterA.balance===beforeA+30 && afterB.balance===beforeB-20 && game.economy.reward===10 && game.economy.payout===40);
 await call('snapshot',{roomId},a);check('terminal replay does not pay twice',(await call('profile',{},a)).session.balance===afterA.balance);
 game=await room(a,b,0,'sports');await call('ready',{roomId:game.id,stake:0},a);await call('ready',{roomId:game.id,stake:0},b);
 const zero=await call('leave',{roomId:game.id},a);check('zero-stake human match starts and cannot create a debt on leaving',zero.match.economy.balance===afterA.balance && zero.match.economy.reserved===0);
 game=await room(a,b,10);await call('ready',{roomId:game.id,stake:10},a);await call('leave',{roomId:game.id},b);
 check('prestart cancellation refunds the one reserved seat',(await call('profile',{},a)).session.balance===afterA.balance);
 game=await room(a,b,10);await call('ready',{roomId:game.id,stake:10},a);await call('ready',{roomId:game.id,stake:10},b);await call('leave',{roomId:game.id},a);
 check('poststart quit forfeits stake without minting a reward',(await call('profile',{},a)).session.balance===afterA.balance-10 && (await call('profile',{},b)).session.balance===afterB.balance+10);
 console.log(JSON.stringify({suite:'jhk-live-two-profile',checks:checks.length,result:'pass',scope:'two synthetic test clients on deployed authority; no load/fairness proof'}));
} finally{
 for(const guest of guests){try{await call('deleteSession',{},guest,guest.url,guest.header);}catch(error){console.error(`QA profile cleanup failed: ${error.message}`);process.exitCode=1;}}
}
