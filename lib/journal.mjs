export const EMPTY_JOURNAL={version:1,rounds:[],matches:[],saved:[]};
const validDate=value=>Number.isFinite(value)&&Math.abs(value)<=8.64e15;
const validFact=r=>r&&(r.factId===undefined||typeof r.factId==='string'&&/^[a-zA-Z0-9:_-]{1,80}$/.test(r.factId))&&['id','matchId','question','correctAnswer','explanation','topic','subtopic','sourceUrl','sourceLabel'].every(k=>typeof r[k]==='string')&&validDate(r.at)&&Array.isArray(r.options)&&r.options.length===4&&r.options.every(x=>typeof x==='string')&&new Set(r.options).size===4&&r.options.includes(r.correctAnswer)&&/^https?:\/\//.test(r.sourceUrl)&&typeof r.bot==='boolean'&&(r.correct===null||typeof r.correct==='boolean')&&(r.elapsedMs===null||Number.isFinite(r.elapsedMs)&&r.elapsedMs>=0);
const validMatch=m=>m&&typeof m.id==='string'&&validDate(m.at)&&['quick','trilogy','gauntlet'].includes(m.mode)&&['win','loss','draw'].includes(m.outcome)&&typeof m.bot==='boolean'&&Array.isArray(m.scores)&&m.scores.length===2&&m.scores.every(n=>Number.isInteger(n)&&n>=0&&n<=5);
export function readJournal(raw){
 try{const d=JSON.parse(raw||'null');if(d?.version!==1)return {...EMPTY_JOURNAL};
  return {version:1,rounds:(Array.isArray(d.rounds)?d.rounds:[]).filter(validFact).slice(0,200),matches:(Array.isArray(d.matches)?d.matches:[]).filter(validMatch).slice(0,100),saved:(Array.isArray(d.saved)?d.saved:[]).filter(x=>typeof x==='string').slice(0,200)};
 }catch{return {...EMPTY_JOURNAL};}
}
export function recordRoom(journal,room,now=Date.now()){
 if(Array.isArray(room?.completedRounds)&&room.completedRounds.length){for(const r of room.completedRounds){journal=recordRoom(journal,{...room,completedRounds:[],phase:'between',round:r},now);}}
 const rd=room?.round,q=rd?.question;
 let next=journal;
 if(rd?.result&&Number.isInteger(q?.correctIndex)&&!journal.rounds.some(r=>r.id===rd.id)){
  const a=rd.receipts?.[room.seat];
  const fact={id:rd.id,...(typeof q.factId==='string'?{factId:q.factId}:{}),matchId:room.id,at:now,question:q.question,options:q.options,correctAnswer:q.options[q.correctIndex],explanation:q.explanation,topic:q.topic,subtopic:q.subtopic,sourceUrl:q.sourceUrl,sourceLabel:q.sourceLabel,correct:a?.correct??null,elapsedMs:a?.elapsedMs??null,bot:room.players.some(p=>p?.kind==='bot')};
  next={...next,rounds:[fact,...next.rounds].slice(0,200)};
 }
 if(room?.phase==='complete'&&!next.matches.some(m=>m.id===room.id)){
  next={...next,matches:[{id:room.id,at:now,mode:room.config.mode,bot:room.players.some(p=>p?.kind==='bot'),outcome:room.winner===null?'draw':room.winner===room.seat?'win':'loss',scores:room.scores},...next.matches].slice(0,100)};
 }
 return next;
}
export function uniqueFacts(rounds){const aliases=new Map(rounds.filter(r=>r.factId).map(r=>[r.question,r.factId]));return [...new Map([...rounds].reverse().map(r=>[r.factId||aliases.get(r.question)||r.question,r])).values()].reverse();}
