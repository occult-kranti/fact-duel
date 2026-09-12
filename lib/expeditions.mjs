// Public route metadata and device-local solo rules. No live duel answers belong here.
export const EXPEDITIONS = [
 {id:'cricket',topic:'Cricket',domain:'sports',title:'World Cup folklore',subtitle:'India, 1983 and the innings you remember.',code:'IND / 83',stamp:'World Cup stories',start:1,chapters:['The headline','The innings','The fine print']},
 {id:'football',topic:'Football',domain:'sports',title:'One night in Istanbul',subtitle:'Six details from the 2005 Champions League final.',code:'IST / 05',stamp:'Istanbul 2005',start:7,chapters:['Set the scene','The comeback','The other side']},
 {id:'basketball',topic:'Basketball',domain:'sports',title:'The Chicago files',subtitle:'Jordan, Pippen and the details behind the legends.',code:'CHI / 23',stamp:'Chicago files',start:13,chapters:['The icon','Before the rings','Beyond the highlight']},
 {id:'gridiron',topic:'American football',domain:'sports',title:'Green Bay deep cuts',subtitle:'Championship history, from early titles to Super Bowls.',code:'GB / NFL',stamp:'Green Bay archive',start:19,chapters:['Big-game names','The stage','Old-school detail']},
 {id:'tennis',topic:'Tennis',domain:'sports',title:'Advantage, Nadal',subtitle:'Finals, firsts and the points that made the story.',code:'ATP / RN',stamp:'Nadal notebook',start:25,chapters:['The majors','The final set','Match-point detail']},
 {id:'space',topic:'Space',domain:'science',title:'Beyond the blue',subtitle:'From Apollo 11 to the Jupiter system.',code:'SPACE / 01',stamp:'Beyond the blue',start:31,chapters:['Look up','Meet the mission','Further out']},
 {id:'physics',topic:'Physics',domain:'science',title:'Reality, unpacked',subtitle:'Particles, forces and the constants underneath it all.',code:'PHYS / 01',stamp:'Reality notes',start:37,chapters:['The big picture','The messengers','The small print']},
 {id:'biology',topic:'Biology',domain:'science',title:'Life at small scale',subtitle:'DNA and the machinery inside a cell.',code:'BIO / 01',stamp:'Cell explorer',start:43,chapters:['Inside the cell','The information','Under the surface']},
 {id:'computing',topic:'Computing',domain:'science',title:'The web & the code',subtitle:'Web origins meet Python essentials.',code:'CODE / 01',stamp:'Code notebook',start:49,chapters:['Familiar names','How it works','Syntax & history']},
].map(route=>Object.freeze({...route,version:1,key:`${route.id}:1`,ids:Array.from({length:6},(_,i)=>`q${String(route.start+i).padStart(3,'0')}`)}));
export const CONFIDENCE=Object.freeze({steady:{name:'Steady',correct:2,wrong:0},bold:{name:'Bold',correct:3,wrong:-1}});
export const expeditionById=id=>EXPEDITIONS.find(r=>r.id===id);
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(id);
const boundedText=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max;
const date=n=>Number.isFinite(n)&&n>=0&&n<=8.64e15;
export function validExpeditionCards(cards,route){
 return !!route&&Array.isArray(cards)&&cards.length===6&&cards.every((f,i)=>f&&f.factId===route.ids[i]&&f.topic===route.topic&&f.domain===route.domain&&Number.isInteger(f.correctIndex)&&f.correctIndex>=0&&f.correctIndex<4&&Array.isArray(f.options)&&f.options.length===4&&new Set(f.options).size===4&&f.options.every(s=>boundedText(s,500))&&boundedText(f.question,1500)&&boundedText(f.explanation,4000)&&boundedText(f.subtopic,200)&&boundedText(f.sourceLabel,300)&&boundedText(f.sourceUrl,2000)&&/^https:\/\//.test(f.sourceUrl));
}
export function runResult(run){
 let score=0,correct=0,bold=0;
 run.answers.forEach((a,i)=>{const hit=a.choice===run.cards[i].correctIndex;correct+=Number(hit);bold+=Number(a.confidence==='bold');score+=CONFIDENCE[a.confidence][hit?'correct':'wrong'];});
 return {score,correct,bold};
}
function validRun(run,route){
 return run&&validId(run.id)&&date(run.startedAt)&&validExpeditionCards(run.cards,route)&&Number.isInteger(run.cursor)&&run.cursor>=0&&run.cursor<=6&&Array.isArray(run.answers)&&[run.cursor,Math.min(6,run.cursor+1)].includes(run.answers.length)&&run.answers.every(a=>a&&Number.isInteger(a.choice)&&a.choice>=0&&a.choice<4&&Object.hasOwn(CONFIDENCE,a.confidence));
}
function validResult(r){
 if(!r||!validId(r.runId)||!Number.isInteger(r.score)||r.score<-6||r.score>18||!Number.isInteger(r.correct)||r.correct<0||r.correct>6||!Number.isInteger(r.bold)||r.bold<0||r.bold>6||!date(r.at))return false;
 // score = 2*correct + 2*boldCorrect - bold. Reject impossible combinations.
 const boldCorrect=(r.score-2*r.correct+r.bold)/2;
 return Number.isInteger(boldCorrect)&&boldCorrect>=Math.max(0,r.correct+r.bold-6)&&boldCorrect<=Math.min(r.correct,r.bold);
}
export function readExpeditions(value){
 const result={};
 for(const route of EXPEDITIONS){const record=value?.[route.key];if(!record||typeof record!=='object')continue;
  let run=validRun(record.run,route)?record.run:null;
  const first=validResult(record.first)?record.first:null,last=first&&validResult(record.last)?record.last:first;
  const baseline=first&&last.score>first.score?last:first;
  const best=first&&validResult(record.best)&&record.best.score>=baseline.score?record.best:baseline;
  if(run?.cursor===6){const result=runResult(run);if(!first||!last||last.runId!==run.id||['score','correct','bold'].some(k=>last[k]!==result[k]))run=null;}
  if(!run&&!first)continue;
  result[route.key]={run,first,best,last,completions:first&&Number.isSafeInteger(record.completions)&&record.completions>0?Math.min(1000000,record.completions):first?1:0};
 }
 return result;
}
export function expeditionStatus(record){
 if(record?.run&&record.run.cursor<6)return 'continue';
 return record?.first?'complete':'new';
}
export function reduceExpeditions(state,action){
 const route=expeditionById(action.routeId);if(!route)return state;
 const record=state[route.key]||{run:null,first:null,best:null,last:null,completions:0},run=record.run;
 if(action.type==='journey-start'){
  if(!validId(action.runId)||!date(action.at)||!validExpeditionCards(action.cards,route)||(run?.id??null)!==(action.previousRunId??null)||run&&run.cursor<6||run?.id===action.runId)return state;
  return {...state,[route.key]:{...record,run:{id:action.runId,cards:action.cards,startedAt:action.at,cursor:0,answers:[]}}};
 }
 if(!run||run.id!==action.runId||run.cursor===6||action.index!==run.cursor)return state;
 if(action.type==='journey-answer'){
  if(run.answers.length!==run.cursor||!Number.isInteger(action.choice)||action.choice<0||action.choice>3||!Object.hasOwn(CONFIDENCE,action.confidence))return state;
  return {...state,[route.key]:{...record,run:{...run,answers:[...run.answers,{choice:action.choice,confidence:action.confidence}]}}};
 }
 if(action.type==='journey-next'){
  if(run.answers.length!==run.cursor+1||!date(action.at))return state;
  const updated={...run,cursor:run.cursor+1};
  if(updated.cursor<6)return {...state,[route.key]:{...record,run:updated}};
  const result={runId:run.id,...runResult(updated),at:action.at};
  return {...state,[route.key]:{run:updated,first:record.first||result,best:!record.best||result.score>record.best.score?result:record.best,last:result,completions:Math.min(1000000,record.completions+1)}};
 }
 return state;
}
