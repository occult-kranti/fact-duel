/** Deployed two-seat, zero-stake private-room smoke. Synthetic profiles are deleted in finally.
 * JHK_GAME_URL=https://.../functions/v1/jhk-game node scripts/stadium-live-check.mjs
 * Never emits tokens, recovery codes, profile IDs, nicknames, room IDs or invite codes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const endpoint=process.env.JHK_GAME_URL;
if(!endpoint || !/^https:\/\//.test(endpoint))throw new Error('JHK_GAME_URL must be an HTTPS deployed function endpoint.');
const guests=[];
const checks=[];
const cleanup=[];
const startedAt=new Date().toISOString();
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);console.log(`PASS ${name}`);};
async function call(action,payload={},guest=null,{allowError=false,tokenOverride}={}){
 const token=tokenOverride??guest?.token;
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-region':'ap-south-1',...(token?{'x-jhk-session':token}:{})},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(18000)});
 const data=await response.json();
 if(!allowError)assert.ok(response.ok&&data?.ok,`${action} failed (${response.status}; ${data?.error?.code||'unknown'})`);
 return {data,status:response.status};
}
const fields=value=>value&&typeof value==='object'?Object.entries(value).flatMap(([key,item])=>[key,...fields(item)]):[];
async function create(index){
 const {data}=await call('session',{nickname:`QA Stadium ${index} ${Date.now().toString(36)}`,adultConfirmed:true,termsVersion:'beta-1'});
 assert.match(data.token,/^[a-f0-9]{64}$/);
 const guest={token:data.token,id:data.session.id};guests.push(guest);return guest;
}
let failure=null;
try{
 const {data:presence}=await call('presence');
 check('anonymous presence returns only an aggregate and no identity',presence.ok===true&&Number.isSafeInteger(presence.presence?.activeHumans)&&presence.presence.activeHumans>=0&&presence.presence.windowSeconds===120&&presence.presence.expiresAt>presence.serverNow&&!fields(presence).some(key=>['token','recoveryCode','session','nickname','email','players'].includes(key)));
 const unauthorized=await call('profile',{},null,{allowError:true,tokenOverride:crypto.randomUUID().replaceAll('-','').repeat(2)});
 check('private profile access still rejects unknown bearer',unauthorized.status===401&&unauthorized.data.error?.code==='UNAUTHORIZED');
 const a=await create('A'),b=await create('B');
 check('two synthetic identities remain independent',a.id!==b.id&&a.token!==b.token);
 const {data:created}=await call('create',{stake:0,file:'cricket'},a);
 const roomId=created.match.id;
 const {data:joined}=await call('join',{code:created.match.code},b);
 check('zero-stake private human room exposes banter capability',joined.match.id===roomId&&joined.match.stake===0&&joined.match.mode==='private'&&joined.match.players.length===2&&joined.match.reactionsEnabled===true);
 const invalid=await call('reaction',{roomId,sticker:'custom text is rejected',requestId:crypto.randomUUID()},a,{allowError:true});
 check('arbitrary sticker text rejected by deployed Edge',invalid.status===400&&invalid.data.error?.code==='BAD_STICKER');
 const payload={roomId,sticker:'nice-shot',requestId:crypto.randomUUID()};
 const {data:sent}=await call('reaction',payload,a);
 check('first sticker is acknowledged by authority',sent.match.reactions.some(event=>event.id===payload.requestId&&event.playerId===a.id&&event.sticker==='nice-shot'));
 const {data:opponent}=await call('snapshot',{roomId},b);
 check('real opponent snapshot receives the acknowledged sticker',opponent.match.reactions.some(event=>event.id===payload.requestId&&event.playerId===a.id&&event.sticker==='nice-shot'));
 const {data:duplicate}=await call('reaction',payload,a);
 check('retried request remains one immutable event',duplicate.match.reactions.filter(event=>event.id===payload.requestId).length===1&&duplicate.match.reactions.find(event=>event.id===payload.requestId).at===sent.match.reactions.find(event=>event.id===payload.requestId).at);
 const cooldown=await call('reaction',{roomId,sticker:'all-talk',requestId:crypto.randomUUID()},a,{allowError:true});
 check('deployed authority rejects second sticker in same break',cooldown.data.error?.code==='BANTER_COOLDOWN');
 const responsePayload={roomId,sticker:'check-replay',requestId:crypto.randomUUID()};
 await call('reaction',responsePayload,b);
 const {data:both}=await call('snapshot',{roomId},a);
 check('opponent response reaches first seat and feed is bounded',both.match.reactions.length===2&&both.match.reactions.some(event=>event.id===responsePayload.requestId&&event.playerId===b.id));
 check('match snapshot does not expose bearer recovery or contact data',!fields(both).some(key=>['token','token_hash','recoveryCode','recovery_hash','email'].includes(key))&&!JSON.stringify(both).includes(a.token)&&!JSON.stringify(both).includes(b.token));
 await call('ready',{roomId,stake:0},a);
 const {data:ready}=await call('ready',{roomId,stake:0},b);
 check('normal zero-stake game still reaches countdown',ready.match.phase==='countdown'&&ready.match.economy.reserved===0);
 const blocked=await call('reaction',{roomId,sticker:'all-talk',requestId:crypto.randomUUID()},a,{allowError:true});
 check('countdown rejects reactions before question play',blocked.data.error?.code==='BANTER_CLOSED');
 const {data:left}=await call('leave',{roomId},a);
 check('synthetic match closes without stake or completion reward',left.match.phase==='cancelled'&&left.match.economy.reserved===0&&left.match.economy.reward===0);
}catch(error){failure={name:error.name,message:error.message};process.exitCode=1;}
finally{
 for(let i=0;i<guests.length;i++){
  try{const {data}=await call('deleteSession',{},guests[i]);assert.equal(data.deleted,true);cleanup.push({seat:i===0?'A':'B',deleted:true});}
  catch(error){cleanup.push({seat:i===0?'A':'B',deleted:false,error:error.message});process.exitCode=1;}
 }
 const evidence={suite:'stadium-live-banter-presence',startedAt,finishedAt:new Date().toISOString(),endpoint,result:failure||cleanup.some(item=>!item.deleted)?'fail':'pass',checks:checks.length,assertions:checks,cleanup,...(failure?{failure}:{}),scope:'Two synthetic human-profile clients in one zero-stake private room on the deployed server. No real player modified, no load or physical-device claim. No credentials, profile IDs or invite codes recorded.'};
 await fs.mkdir(new URL('../docs/stadium-redesign/verification/',import.meta.url),{recursive:true});
 await fs.writeFile(new URL('../docs/stadium-redesign/verification/live-banter.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({suite:evidence.suite,result:evidence.result,checks:evidence.checks,cleanup}));
 if(failure)console.error(failure.message);
}
