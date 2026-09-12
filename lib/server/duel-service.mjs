import { QUESTIONS } from './questions.mjs';
import {expeditionById} from '../expeditions.mjs';
import { RULES, GameError, requireValue, hashableToken, normalizeConfig, chooseDeck, makeRoom, attachBot, readyPlayer, revealPlayer, answerPlayer, advance, settleMatch, projection } from './room-engine.mjs';
const encoder=new TextEncoder();
export async function hash(value){const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(value));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function catalogue(){return {count:QUESTIONS.length,levels:['simple','expert','extreme'],regions:['US','India','Europe','Global'],topics:[...new Set(QUESTIONS.map(q=>q.topic))].map(topic=>({topic,domain:QUESTIONS.find(q=>q.topic===topic).domain,count:QUESTIONS.filter(q=>q.topic===topic).length})),facets:QUESTIONS.map(({domain,topic,subtopic,region,difficulty})=>({domain,topic,subtopic,region,difficulty})),rules:{tieMs:RULES.tieMs,maxTransportMs:RULES.maxTransportMs},bankVersion:'2026-09-11-reviewed-sample'};}
const validId=s=>typeof s==='string'&&/^[a-f0-9]{32}$/.test(s);
const nameOf=s=>{requireValue(typeof s==='string','Enter a player name.');const name=s.replace(/[\u0000-\u001f\u007f]/g,'').trim();requireValue(name.length>0&&name.length<=24,'Enter a name up to 24 characters.');return name;};
export class D1RoomStore {
 constructor(db){this.db=typeof db.withSession==='function'?db.withSession('first-primary'):db;}
 async clock(){return await this.db.prepare("SELECT CAST((julianday('now')-2440587.5)*86400000 AS INTEGER) AS db_now").first();}
 async commitReveal(id,revision,room,seat,{databaseClock,now}){
  const clockSql=databaseClock?"CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)":"?";
  const bindings=databaseClock?[]:[now];
  const botStamp=seat===0&&room.players[1]?.kind==='bot'?", '$.round.issuedAt[1]',(SELECT t FROM clock)":'';
  return await this.db.prepare(`WITH clock(t) AS (SELECT ${clockSql}) UPDATE rooms SET state=json_set(?, '$.round.issuedAt[${seat}]',(SELECT t FROM clock)${botStamp}),revision=revision+1 WHERE id=? AND revision=? AND (SELECT t FROM clock)>=? AND (SELECT t FROM clock)<? RETURNING revision,state,expires_at`).bind(...bindings,JSON.stringify(room),id,revision,room.round.scheduledAt,room.round.scheduledAt+RULES.showWindowMs).first();
 }
 async read(id){return await this.db.prepare("SELECT revision,state,expires_at,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER) AS db_now FROM rooms WHERE id=?").bind(id).first();}
 async insert(room){return (await this.db.prepare('INSERT OR IGNORE INTO rooms (id,revision,state,expires_at,created_at) VALUES (?,0,?,?,?)').bind(room.id,JSON.stringify(room),room.expiresAt,room.createdAt).run()).meta.changes===1;}
 async compareSwap(id,revision,room){return (await this.db.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(room),id,revision).run()).meta.changes===1;}
 // The answer's durable acceptance time is stamped inside the successful SQL write.
 async commitAttempt(id,revision,room,seat,{databaseClock,now}){
  const a=room.round.answers[seat],issued=room.round.issuedAt[seat];
  const base=`$.round.answers[${seat}]`, clockSql=databaseClock?"CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)":"?";
  const bindings=databaseClock?[]:[now];
  const sql=`WITH clock(t) AS (SELECT ${clockSql}) UPDATE rooms SET state=json_set(?,
   '${base}.receivedAt',(SELECT t FROM clock),
   '${base}.serverElapsedMs',(SELECT t FROM clock)-?,
   '${base}.residualMs',(SELECT t FROM clock)-?-?,
   '${base}.timingOK',json(CASE WHEN (SELECT t FROM clock)-?-? BETWEEN -100 AND ? THEN 'true' ELSE 'false' END)),
   revision=revision+1 WHERE id=? AND revision=? AND (SELECT t FROM clock)<?
   RETURNING revision,state,expires_at`;
  return await this.db.prepare(sql).bind(...bindings,JSON.stringify(room),issued,issued,a.elapsedMs,issued,a.elapsedMs,a.graceMs,id,revision,issued+room.config.duration*1000+a.graceMs).first();
 }
 async admit(actor,now){const bucket=Math.floor(now/60000),key=`${actor}:${bucket}`;const row=await this.db.prepare('INSERT INTO admission_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,(bucket+2)*60000).first();requireValue(row.count<=30,'Too many room requests. Please wait a minute.',429,'rate_limited');}
 async cleanup(now){await this.db.batch([this.db.prepare('DELETE FROM rooms WHERE id IN (SELECT id FROM rooms WHERE expires_at < ? LIMIT 100)').bind(now),this.db.prepare('DELETE FROM admission_limits WHERE key IN (SELECT key FROM admission_limits WHERE expires_at < ? LIMIT 100)').bind(now)]);}
}
export async function dispatch(store,body,{now=Date.now(),actor='local',rng=Math.random,useDatabaseClock=false}={}){
 requireValue(body&&typeof body==='object'&&!Array.isArray(body),'Invalid request.');const action=body.action;
 if(action==='catalogue')return {catalogue:catalogue(),serverNow:now};
 if(action==='clock')return {serverNow:now};
 if(action==='expedition'){
  const route=expeditionById(body.routeId);requireValue(route,'Choose an available expedition.');
  const cards=route.ids.map(id=>QUESTIONS.find(q=>q.id===id));
  requireValue(cards.every(Boolean),'This expedition is temporarily unavailable.',503);
  return {routeId:route.id,version:route.version,cards:cards.map(q=>{
   const order=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
   return {factId:q.id,domain:q.domain,topic:q.topic,subtopic:q.subtopic,question:q.question,options:order.map(i=>q.options[i]),correctIndex:order.indexOf(q.correctIndex),explanation:q.explanation,sourceUrl:q.sourceUrl,sourceLabel:q.sourceLabel};
  }),practice:true};
 }
 if(action==='practice'){
  const topic=body.topic??'all';requireValue(typeof topic==='string'&&(topic==='all'||QUESTIONS.some(q=>q.topic===topic)),'Choose an available practice topic.');
  // Untimed teaching cards are intentionally open content, separate from sealed room attempts.
  const deck=chooseDeck(QUESTIONS,{mode:'trilogy',domain:'all',region:'all',difficulty:'all',subtopic:'all',topic},rng);
  return {cards:deck.map(q=>({factId:q.id,domain:q.domain,topic:q.topic,subtopic:q.subtopic,question:q.question,options:q.options,correctIndex:q.correctIndex,explanation:q.explanation,sourceUrl:q.sourceUrl,sourceLabel:q.sourceLabel})),practice:true};
 }
 requireValue(validId(body.roomId),'Invalid room link.');requireValue(hashableToken(body.token),'Missing room access token.',401,'unauthorized');
 const tokenHash=await hash(body.token);
 if(action==='create'){
  requireValue(hashableToken(body.invite),'Invalid invitation.');const prior=await store.read(body.roomId);if(prior){const r=JSON.parse(prior.state);requireValue(r.players[0].hash===tokenHash,'Room unavailable.',403);return {room:projection(r,0,prior.revision,now)};}
  await store.admit(actor,now);const config=normalizeConfig(body.config,QUESTIONS);const r=makeRoom({id:body.roomId,hostHash:tokenHash,inviteHash:await hash(body.invite),name:nameOf(body.name),config,deck:chooseDeck(QUESTIONS,config,rng),now});
  if(config.opponent==='bot')attachBot(r,rng);
  const inserted=await store.insert(r);if(!inserted){const row=await store.read(body.roomId);const existing=JSON.parse(row.state);requireValue(existing.players[0].hash===tokenHash,'Room unavailable.',403);return {room:projection(existing,0,row.revision,now)};}
  // Cleanup is bounded and only runs when a room is created, never on the answer path.
  await store.cleanup(now);return {room:projection(r,0,0,now)};
 }
 if(action==='join')await store.admit(actor,now);
 for(let attempt=0;attempt<RULES.maxRetries;attempt++){
  const row=await store.read(body.roomId);requireValue(row,'This room was not found or has expired.',404,'not_found');const room=JSON.parse(row.state);const eventNow=useDatabaseClock&&Number.isFinite(row.db_now)?row.db_now:now;if(action==='join')requireValue(eventNow<room.expiresAt,'This room has expired. Create a new one.',410,'expired');
  let seat=room.players.findIndex(p=>p?.hash===tokenHash);let changed=false;let newAnswer=false;let newReveal=false;
  if(action==='join'&&seat<0){requireValue(hashableToken(body.invite)&&await hash(body.invite)===room.inviteHash,'The invitation is invalid.',403,'invalid_invite');requireValue(room.phase==='waiting'&&!room.players[1],'This room already has two players.',409,'room_full');room.players[1]={hash:tokenHash,name:nameOf(body.name),ready:false,rttMs:0,jitterMs:0};seat=1;changed=true;}
  requireValue(seat>=0,'This screen is not a player in that room.',403,'unauthorized');
  const expired=advance(room,eventNow);changed=changed||expired;
  let deferredError=null;
  try{
   if(action==='add_bot'){requireValue(seat===0,'Only the room creator can add a bot.',403);changed=attachBot(room,rng)||changed;}
   else if(action==='ready'){requireValue((body.roundId??null)===(room.round?.id??null),'That readiness signal is stale.',409,'stale_round');changed=readyPlayer(room,seat,body,eventNow)||changed;}
   else if(action==='reveal'){newReveal=revealPlayer(room,seat,body.roundId,eventNow);changed=newReveal||changed;}
   else if(action==='answer'){newAnswer=answerPlayer(room,seat,body,eventNow);changed=newAnswer||changed;}
   else if(action==='leave')changed=settleMatch(room,null,'player-left',eventNow)||changed;
   else requireValue(['state','join'].includes(action),'Unknown action.');
  }catch(e){if(!expired)throw e;deferredError=e;}
  // A new answer is sealed before a later request can finalize the round.
  if(!newAnswer)changed=advance(room,eventNow)||changed;
  if(!changed){if(deferredError)throw deferredError;return {room:projection(room,seat,row.revision,eventNow)};}
  if(newReveal){
   const saved=await store.commitReveal(body.roomId,row.revision,room,seat,{databaseClock:useDatabaseClock,now:eventNow});
   if(saved){const durable=JSON.parse(saved.state);return {room:projection(durable,seat,saved.revision,durable.round.issuedAt[seat])};}
   continue;
  }
  if(newAnswer){
   const saved=await store.commitAttempt(body.roomId,row.revision,room,seat,{databaseClock:useDatabaseClock,now:eventNow});
   if(saved){const durable=JSON.parse(saved.state);return {room:projection(durable,seat,saved.revision,durable.round.answers[seat].receivedAt)};}
   continue;
  }
  if(await store.compareSwap(body.roomId,row.revision,room)){if(deferredError)throw deferredError;return {room:projection(room,seat,row.revision+1,eventNow)};}
 }
 throw new GameError('This room is busy. Retrying is safe.',503,'room_busy');
}
