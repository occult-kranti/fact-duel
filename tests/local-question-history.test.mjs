import test from 'node:test';
import assert from 'node:assert/strict';
import { localRotationHistory, reserveLocalDeck, exposeLocalQuestion, withLocalQuestionHistory, recordLocalQuestionExposure } from '../lib/local-question-history.mjs';
import { selectRotatedQuestions } from '../lib/question-rotation.mjs';
const pool = Array.from({length:12},(_,i)=>({id:`q${i}`}));
test('reservations are temporary; actual exposures survive interruption, reload-shaped serialization and duplicates',()=>{
 let memory=reserveLocalDeck(null,{roomId:'a',deck:pool.slice(0,5),at:1000,expiresAt:5000});
 assert.equal(Object.keys(localRotationHistory(memory,2000)).length,5);
 memory=exposeLocalQuestion(memory,{roomId:'a',roundId:'r1',question:pool[0],at:2000});
 memory=exposeLocalQuestion(memory,{roomId:'a',roundId:'r1',question:pool[0],at:3000});
 assert.equal(memory.history.q0,2000);
 const restored=JSON.parse(JSON.stringify(memory));
 assert.deepEqual(Object.keys(localRotationHistory(restored,6000)),['q0']);
 assert.ok(!selectRotatedQuestions(pool,{history:localRotationHistory(restored,6000),count:5}).some(q=>q.id==='q0'));
});
test('reservations deduplicate room creation retries and completion releases unseen future cards',()=>{
 let memory=reserveLocalDeck(null,{roomId:'same',deck:pool.slice(0,5),at:1000});
 memory=reserveLocalDeck(memory,{roomId:'same',deck:pool.slice(5),at:2000});
 assert.deepEqual(Object.keys(localRotationHistory(memory,2000)),pool.slice(0,5).map(q=>q.id));
 memory=exposeLocalQuestion(memory,{roomId:'same',roundId:'r1',question:pool[0],at:3000,finished:true});
 assert.deepEqual(Object.keys(localRotationHistory(memory,4000)),['q0']);
});
test('unavailable storage keeps playable rotation, serializes competing creates, and separates reset epochs',async()=>{
 const epoch=crypto.randomUUID(), decks=[];
 const create=(roomId)=>withLocalQuestionHistory(epoch,async history=>{
  const deck=selectRotatedQuestions(pool,{count:5,history});
  await Promise.resolve(); decks.push(deck);
  return {roomId,deck,at:Date.now(),result:roomId};
 });
 assert.deepEqual(await Promise.all([create('one'),create('two')]),['one','two']);
 assert.equal(new Set(decks.flat().map(q=>q.id)).size,10);
 await recordLocalQuestionExposure(epoch,{roomId:'one',roundId:'r1',question:decks[0][0],at:Date.now()});
 await withLocalQuestionHistory(`${epoch}-reset`,async history=>{assert.equal(Object.keys(history).length,0);return {roomId:'fresh',deck:[],result:true}});
});
