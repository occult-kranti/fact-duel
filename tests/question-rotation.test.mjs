import test from 'node:test';
import assert from 'node:assert/strict';
import { rotationKey, selectRotatedQuestions, recordQuestionSeen, mergeRotationHistories, readRotationHistory } from '../lib/question-rotation.mjs';
const pool=Array.from({length:12},(_,i)=>({id:`cr${800+i}`,question:`Substantive fact ${i}`,options:['a','b','c','d'],correctIndex:0}));
test('three four-card deals exhaust eligible cards before any repetition, then choose oldest',()=>{
 let history={},ids=[];
 for(let run=0;run<3;run++){const deck=selectRotatedQuestions(pool,{count:4,history,rng:()=>.5});ids.push(...deck.map(q=>q.id));for(const q of deck)history=recordQuestionSeen(history,q,{at:run+1});}
 assert.equal(new Set(ids).size,12);
 assert.deepEqual(selectRotatedQuestions(pool,{count:4,history,rng:()=>.5}).map(q=>q.id),ids.slice(0,4));
});
test('both human seats histories matter, using latest exposure for already seen families',()=>{
 const a={cr800:1,cr801:10},b={cr800:100,cr802:20};
 const deck=selectRotatedQuestions(pool.slice(0,4),{count:4,participants:[a,b],rng:()=>.5});
 assert.deepEqual(deck.map(q=>q.id),['cr803','cr801','cr802','cr800']);
 assert.equal(mergeRotationHistories([a,b]).cr800,100);
});
test('known reworded facts count as one family and old card-ID history is respected',()=>{
 const dupes=[{id:'cr042'},{id:'cr473'},{id:'cr800'}];
 assert.equal(rotationKey(dupes[0]),rotationKey(dupes[1]));
 const deck=selectRotatedQuestions(dupes,{count:5,history:{cr473:99},rng:()=>0});
 assert.equal(deck.length,2);assert.equal(deck[0].id,'cr800');
});
test('small and filtered pools never widen or duplicate a family to fill a mode',()=>{
 const narrow=pool.slice(0,2);assert.equal(selectRotatedQuestions(narrow,{count:6}).length,2);
 assert.deepEqual(selectRotatedQuestions([],{}),[]);assert.deepEqual(selectRotatedQuestions(pool,{count:-1}),[]);
 assert.equal(selectRotatedQuestions([{id:'a',familyKey:'family'},{id:'b',familyKey:'family'}],{count:2}).length,1);
});
test('selection leaves source/options/history intact and ignores answer correctness',()=>{
 const frozen=pool.map(q=>Object.freeze({...q,options:Object.freeze([...q.options])}));const history=Object.freeze({cr800:3});
 const left=selectRotatedQuestions(frozen,{count:4,history,rng:()=>.6});
 const right=selectRotatedQuestions(frozen.map(q=>({...q,correctIndex:3})),{count:4,history,rng:()=>.6});
 assert.deepEqual(left.map(q=>q.id),right.map(q=>q.id));assert.equal(frozen[0].options[0],'a');assert.deepEqual(history,{cr800:3});
});
test('malformed history and RNG cannot pollute prototypes, duplicate or escape the pool',()=>{
 const value=JSON.parse('{"__proto__":99,"constructor":10,"good":1,"bad":-2}');
 assert.equal(readRotationHistory(value).good,1);assert.equal(Object.keys(readRotationHistory(value)).length,1);
 assert.equal(selectRotatedQuestions(pool,{count:4,rng:()=>NaN}).length,4);
 assert.equal(selectRotatedQuestions(pool,{count:4,rng:()=>2}).length,4);
 assert.equal(selectRotatedQuestions(pool,{count:4,participants:null,rng:null}).length,4);
 const h=recordQuestionSeen({cr800:50},pool[0],{at:40});assert.equal(h.cr800,50);
});
test('a hundred five-card deals stay unique and never starve a seven-card eligible pool',()=>{
 const narrow=pool.slice(0,7);let history={},previous=[];
 for(let run=0;run<100;run++){
  const deck=selectRotatedQuestions(narrow,{count:5,history,rng:()=>.5});
  assert.equal(new Set(deck.map(rotationKey)).size,5);
  if(previous.length)assert.equal(new Set([...previous,...deck].map(rotationKey)).size,7);
  for(const q of deck)history=recordQuestionSeen(history,q,{at:run+1});
  previous=deck;
 }
});
