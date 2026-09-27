import test from 'node:test';
import assert from 'node:assert/strict';
import { QUEST_TEMPLATES } from '../lib/progression.mjs';
import { practiceMissionDestination, visiblePracticeMissions } from '../lib/jhk-online/practice-missions.mjs';

test('every advertised live practice mission advances through its routed learning surface', () => {
  const events = {
    journeys: [{kind:'expedition-answer',correct:true}, {kind:'expedition-complete'}],
    journal: [{kind:'open'}, {kind:'save'}, {kind:'review',due:true}],
    discovery: [{kind:'discovery',correct:true}],
  };
  const templates = QUEST_TEMPLATES.filter(q => practiceMissionDestination(q.id));
  assert.equal(templates.length, 9);
  for (const template of templates) {
    const destination = practiceMissionDestination(template.id);
    assert.ok(events[destination].some(event => template.advances(event, {})), `${template.id} can advance from ${destination}`);
  }
});

test('live practice list excludes all unsupported duel and timing goals without rewriting progress', () => {
  const items = QUEST_TEMPLATES.map((q, i) => ({id:`today:${q.id}`,template:q.id,progress:i,done:i%2===0}));
  const visible = visiblePracticeMissions(items);
  assert.equal(visible.length, 9);
  for (const item of visible) assert.equal(item, items.find(q => q.id===item.id));
  for (const template of ['play-1','win-2','topic-play','mode-play','combo-3','win-gauntlet','win-3','speed-2','human-1','perfect-trilogy']) {
    assert.equal(practiceMissionDestination(template), null);
    assert.ok(!visible.some(q => q.template===template));
  }
  assert.deepEqual(visiblePracticeMissions([{template:'new-unknown-goal'}]), []);
  assert.deepEqual(visiblePracticeMissions([]), []);
});
