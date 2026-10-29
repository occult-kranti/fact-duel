import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { QUESTIONS, ALL_QUESTIONS } from '../lib/server/bank.mjs';
import { CRICKET_SPICY } from '../lib/server/questions/cricket-spicy.mjs';
import { questionPlayable, RETIRED_QUESTION_IDS } from '../lib/server/question-curation.mjs';
import { dispatch } from '../lib/server/duel-service.mjs';
import { MemoryRoomStore } from '../lib/duel-memory-store.mjs';

test('law-recall cards remain archived but are absent from every served bank pool', () => {
  for (const id of RETIRED_QUESTION_IDS) {
    assert.ok(ALL_QUESTIONS.some(q => q.id === id), `${id} archive preserved`);
    assert.ok(!QUESTIONS.some(q => q.id === id), `${id} is not playable`);
  }
  assert.ok(QUESTIONS.some(q => q.id === 'cr050'), 'historical Mankad incident remains');
  assert.ok(QUESTIONS.some(q => q.id === 'cr053'), 'a partnership record is not a rule question');
});

test('curation rejects imported Cricket 101 without deleting sporting history', () => {
  for (const question of ['How many balls in an over?', 'How many legal deliveries are in an over?', 'How many players make up a cricket team?', 'What is the length of a cricket pitch?', 'What does LBW stand for?', 'How many runs are awarded for a six?']) {
    assert.equal(questionPlayable({topic:'Cricket', question}), false, question);
  }
  assert.equal(questionPlayable({topic:'Cricket', subtopic:'Rules', question:'Unrecognised rule prompt'}), false);
  assert.equal(questionPlayable({topic:'Cricket', question:'How many balls did Yuvraj face for his fifty in 2007?'}), true);
  assert.equal(questionPlayable({topic:'Cricket', question:'How many wickets did Laker take at Old Trafford in 1956?'}), true);
});

test('Spicy has depth at every difficulty and official source attribution on every card', () => {
  assert.equal(CRICKET_SPICY.length, 24);
  for (const difficulty of ['simple','expert','extreme']) assert.equal(CRICKET_SPICY.filter(q=>q.difficulty===difficulty).length, 8);
  for (const q of CRICKET_SPICY) {
    assert.ok(QUESTIONS.includes(q));
    assert.equal(q.subtopic, 'Spicy');
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(['www.icc-cricket.com','www.cricket.com.au','www.iplt20.com'].includes(new URL(q.sourceUrl).hostname));
    assert.ok(q.explanation.length > 80);
  }
  assert.match(CRICKET_SPICY.find(q=>q.id==='cr600').explanation, /did not find.*fixed/);
  assert.match(CRICKET_SPICY.find(q=>q.id==='cr617').explanation, /not proven/);
  assert.match(CRICKET_SPICY.find(q=>q.id==='cr613').explanation, /restoring leadership eligibility/);
});

test('the real local service deals five distinct Spicy cards with no retired questions', async () => {
  const store=new MemoryRoomStore(); let now=1_000_000;
  const auth={roomId:crypto.randomUUID().replaceAll('-',''),token:crypto.randomUUID().replaceAll('-',''),invite:crypto.randomUUID().replaceAll('-','')};
  const call=(action,extra={})=>dispatch(store,{...auth,action,...extra},{now,actor:auth.token,rng:()=>.51});
  const config={opponent:'bot',mode:'gauntlet',duration:30,stake:0,domain:'sports',region:'all',topic:'Cricket',subtopic:'Spicy',difficulty:'all'};
  let data=await call('create',{name:'Spicy reader',config}); const dealt=new Set();
  for(let i=0;i<5;i++) {
    data=await call('ready',{roundId:data.room.round?.id??null}); now=data.room.round.scheduledAt;
    data=await call('reveal',{roundId:data.room.round.id});
    const q=data.room.round.question; assert.equal(q.subtopic,'Spicy'); assert.ok(!RETIRED_QUESTION_IDS.includes(q.id)); dealt.add(q.id);
    const roundId=data.room.round.id; now+=1100;
    await call('answer',{roundId,attemptId:crypto.randomUUID().replaceAll('-',''),choice:0,elapsedMs:1000}); now+=10_000;
    data=await call('state');
  }
  assert.equal(dealt.size,5); assert.equal(data.room.phase,'complete');
});

test('the deployment delta touches only retired questions and Spicy question rows', () => {
  const sql=fs.readFileSync(new URL('../supabase/jhk/migrations/20261029_spicy_content.sql',import.meta.url),'utf8');
  const payload=JSON.parse(sql.split('$jhk_bank$')[1]);
  assert.deepEqual(payload.map(q=>q.id),CRICKET_SPICY.map(q=>q.id));
  assert.ok(payload.every(q=>q.files.includes('spicy')));
  assert.equal(/(?:delete from|insert into|update) jhk_private\.(rooms|answers|sessions|wallet)/.test(sql),false);
});
