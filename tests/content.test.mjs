/**
 * The sports-only content policy, checked at every seam a hidden domain could leak through.
 *
 * "Hidden, not deleted" is the contract: nothing the profile already holds may stop parsing, and
 * nothing a player can reach may show a hidden domain. Both halves are asserted, because each is
 * the kind of thing that quietly regresses when someone adds a screen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENABLED_DOMAINS, ALL_DOMAINS, domainEnabled, enabledOnly, DOMAIN_CHIPS, SINGLE_DOMAIN } from '../lib/content.mjs';
import { QUESTIONS, ALL_QUESTIONS, HIDDEN_COUNT } from '../lib/server/bank.mjs';
import { EXPEDITIONS, ACTIVE_EXPEDITIONS, activeExpeditionById, expeditionById } from '../lib/expeditions.mjs';
import { EVENTS, ACTIVE_EVENTS, groupEvents, monthlyModes, readEvents } from '../lib/events.mjs';
import { TOPIC_DOMAINS } from '../lib/journal.mjs';
import { dispatch, catalogue } from '../lib/server/duel-service.mjs';
import { MemoryRoomStore } from '../lib/duel-memory-store.mjs';

test('the policy is one list, and it is sports', () => {
  assert.deepEqual([...ENABLED_DOMAINS], ['sports']);
  assert.ok(ENABLED_DOMAINS.every((d) => ALL_DOMAINS.includes(d)));
  assert.equal(SINGLE_DOMAIN, true);
  assert.equal(domainEnabled('science'), false);
  assert.deepEqual(DOMAIN_CHIPS.map((c) => c.id), ['sports'], 'one domain means no "all" chip and no switcher');
});

test('enabledOnly preserves identity when nothing is filtered', () => {
  const list = [{ domain: 'sports' }, { domain: 'sports' }];
  assert.equal(enabledOnly(list), list);
  assert.deepEqual(enabledOnly([{ domain: 'sports' }, { domain: 'science' }]), [{ domain: 'sports' }]);
});

test('the served bank carries no hidden-domain question, and the hidden ones still exist', () => {
  assert.ok(QUESTIONS.length > 0);
  assert.ok(QUESTIONS.every((q) => domainEnabled(q.domain)));
  assert.ok(ALL_QUESTIONS.some((q) => q.domain === 'science'), 'science is hidden, not deleted');
  assert.equal(ALL_QUESTIONS.length - QUESTIONS.length, HIDDEN_COUNT);
  assert.ok(HIDDEN_COUNT > 0);
});

test('every served topic is known to the profile layer, in the right domain', () => {
  for (const q of QUESTIONS) {
    assert.equal(TOPIC_DOMAINS[q.topic], q.domain, `${q.topic} must map to ${q.domain} in TOPIC_DOMAINS`);
  }
  // The two new sports are wired in before their banks land, so their events and facts parse.
  assert.equal(TOPIC_DOMAINS.Baseball, 'sports');
  assert.equal(TOPIC_DOMAINS['Formula 1'], 'sports');
});

test('the catalogue a client sees is the filtered bank', () => {
  const cat = catalogue();
  assert.equal(cat.count, QUESTIONS.length);
  assert.ok(cat.topics.every((t) => domainEnabled(t.domain)));
  assert.ok(cat.facets.every((f) => domainEnabled(f.domain)));
});

test('active expeditions are the visible subset; hidden routes stay resolvable by key', () => {
  assert.ok(ACTIVE_EXPEDITIONS.length > 0);
  assert.ok(ACTIVE_EXPEDITIONS.every((r) => domainEnabled(r.domain)));
  assert.ok(EXPEDITIONS.length > ACTIVE_EXPEDITIONS.length, 'the full list still holds the hidden routes');
  const hidden = EXPEDITIONS.find((r) => !domainEnabled(r.domain));
  assert.ok(expeditionById(hidden.id), 'a profile journey keyed on a hidden route can still be looked up');
  assert.equal(activeExpeditionById(hidden.id), undefined, 'but it cannot be started');
  // Every visible route's cards are actually in the served bank — a route that pointed at hidden
  // questions would 503 the moment someone opened it.
  for (const r of ACTIVE_EXPEDITIONS) {
    for (const id of r.ids) assert.ok(QUESTIONS.some((q) => q.id === id), `${r.id} references ${id}, which is not served`);
  }
});

test('the server refuses a hidden expedition with the same words as an unknown one', async () => {
  const store = new MemoryRoomStore();
  const hidden = EXPEDITIONS.find((r) => !domainEnabled(r.domain));
  const visible = ACTIVE_EXPEDITIONS[0];
  const ok = await dispatch(store, { action: 'expedition', routeId: visible.id }, { now: 1 });
  assert.equal(ok.cards.length, 6);
  let hiddenMsg, unknownMsg;
  await assert.rejects(dispatch(store, { action: 'expedition', routeId: hidden.id }, { now: 1 }), (e) => ((hiddenMsg = e.message), true));
  await assert.rejects(dispatch(store, { action: 'expedition', routeId: 'no-such-route' }, { now: 1 }), (e) => ((unknownMsg = e.message), true));
  assert.equal(hiddenMsg, unknownMsg, 'hidden and nonexistent must be indistinguishable to a client');
});

test('practice cannot be started on a hidden topic', async () => {
  const store = new MemoryRoomStore();
  const hiddenTopic = Object.entries(TOPIC_DOMAINS).find(([, d]) => !domainEnabled(d))[0];
  await assert.rejects(dispatch(store, { action: 'practice', topic: hiddenTopic }, { now: 1 }), /available practice topic/);
  const ok = await dispatch(store, { action: 'practice', topic: 'all' }, { now: 1, rng: () => 0.5 });
  assert.ok(ok.cards.every((c) => domainEnabled(c.domain)), 'a mixed practice never deals a hidden card');
});

test('the calendar shown is the active calendar; the full one still parses', () => {
  assert.ok(ACTIVE_EVENTS.every((e) => domainEnabled(e.domain)));
  assert.ok(EVENTS.some((e) => e.domain === 'science'), 'science events are hidden, not deleted');
  assert.ok(readEvents(EVENTS).some((e) => e.domain === 'science'), 'and the sanitiser still accepts them');
  const at = Date.parse('2026-09-16T12:00:00Z');
  const groups = groupEvents(at);
  for (const list of Object.values(groups)) assert.ok(list.every((e) => domainEnabled(e.domain)));
  assert.ok(monthlyModes(at).every((m) => domainEnabled(m.duel.domain)), 'no limited mode is built on a hidden event');
});
