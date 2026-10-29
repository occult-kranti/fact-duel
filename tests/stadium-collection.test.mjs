import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { activeClubBadges, buyClubItem, clubBalance, createClubRecord, equipClubItem, readClubRecord, reconcileClub, transactClub, transactClubMemory } from '../lib/stadium-collection.mjs';
import { storageNames } from '../lib/storage-names.mjs';

const profile = (epoch, matches = 0, correct = 0, rounds = correct) => ({ epoch, progression: { counters: { matches, correct, rounds } }, journal: { matches: [] } });

test('stadium database and refresh channel are isolated by the edition namespace', () => {
  const a = storageNames({ long: 'a', short: 'a' }), b = storageNames({ long: 'b', short: 'b' });
  assert.notEqual(a.stadiumClubDb, b.stadiumClubDb);
  assert.notEqual(a.stadiumClubChannel, b.stadiumClubChannel);
});

test('club earns only cumulative match and answer credits, never repeated snapshot grants', () => {
  const p = profile('points', 2, 7);
  let record = reconcileClub(null, p);
  assert.equal(clubBalance(record), 81);
  for (let i = 0; i < 25; i++) record = reconcileClub(record, p);
  assert.equal(clubBalance(record), 81);
  assert.equal(reconcileClub(record, profile('points', 3, 8)).earned, 114);
  assert.equal(reconcileClub(record, profile('points', 1, 1)).earned, 81, 'stale profile cannot subtract already granted credits');
  assert.equal(reconcileClub(record, profile('new-epoch')).earned, 0, 'a profile reset starts a fresh club');
});

test('buying is idempotent, bounded by balance, and equips only the purchased slot', () => {
  let record = reconcileClub(null, profile('purchase', 3));
  const before = structuredClone(record.equipped);
  let result = buyClubItem(record, 'stand-pavilion');
  assert.equal(result.status, 'bought'); record = result.record;
  assert.equal(clubBalance(record), 0);
  assert.equal(record.equipped.stand, 'stand-pavilion');
  assert.equal(record.equipped.light, before.light);
  assert.equal(buyClubItem(record, 'stand-pavilion').status, 'owned');
  assert.equal(buyClubItem(record, 'title-menace').status, 'insufficient');
  assert.equal(buyClubItem(record, 'made-up').status, 'unknown');
  assert.equal(equipClubItem(record, 'title-pundit').status, 'locked');
  record = equipClubItem(record, 'stand-terrace').record;
  assert.equal(record.equipped.stand, 'stand-terrace');
  assert.equal(clubBalance(record), 0, 'switching back never refunds a collectible');
});

test('malformed state cannot keep overspent ownership, unknown equipment or impossible counters', () => {
  const bad = { ...createClubRecord('bad'), earned: 45, owned: ['title-menace', 'title-menace', 'board-screen', '__proto__'], equipped: { title: 'board-screen', card: 'title-menace' }, badge: 'forever-best' };
  const record = readClubRecord(bad, 'bad');
  assert.equal(record.owned.filter((id) => id === 'title-menace').length, 1);
  assert.ok(!record.owned.includes('board-screen'));
  assert.equal(record.equipped.title, 'title-rookie');
  assert.equal(record.equipped.card, 'card-turf');
  assert.equal(record.badge, 'fresh-win');
  assert.equal(clubBalance(record), 0);
  assert.equal(reconcileClub(null, profile('bad-counters', -50, Infinity, 100)).earned, 0);
  assert.equal(reconcileClub(null, profile('clamp-correct', 0, 100, 4)).earned, 12);
});

test('twenty competing tabs can buy one item only once without minting snapshot rewards', async () => {
  const p = profile('atomic-one', 4);
  const results = await Promise.all(Array.from({ length: 20 }, () => transactClub(p, { type: 'buy', id: 'light-floodlights' })));
  assert.equal(results.filter((r) => r.status === 'bought').length, 1);
  const { record } = await transactClub(p);
  assert.equal(clubBalance(record), 0);
  assert.equal(record.owned.filter((id) => id === 'light-floodlights').length, 1);
  assert.equal(record.equipped.light, 'light-floodlights');
});

test('competing different purchases cannot spend the same points', async () => {
  const p = profile('atomic-different', 3);
  const results = await Promise.all(['stand-pavilion', 'card-sunset'].map((id) => transactClub(p, { type: 'buy', id })));
  assert.equal(results.filter((r) => r.status === 'bought').length, 1);
  assert.equal(results.filter((r) => r.status === 'insufficient').length, 1);
  assert.equal(clubBalance((await transactClub(p)).record), 0);
});

test('session-only fallback survives component remount and separates reset profiles', () => {
  const p = profile('memory-1', 2);
  const result = transactClubMemory(p, { type: 'buy', id: 'title-menace' });
  assert.equal(result.status, 'bought');
  assert.equal(clubBalance(transactClubMemory(p).record), 15);
  assert.equal(transactClubMemory(p, { type: 'buy', id: 'title-menace' }).status, 'owned');
  assert.equal(clubBalance(transactClubMemory(profile('memory-2')).record), 0);
});

test('fresh victory badge expires at exactly 24 hours and never trusts future entries', () => {
  const at = 1_800_000_000_000;
  const p = profile('badges');
  p.journal.matches = [{ id: 'won', outcome: 'win', at }, { id: 'future', outcome: 'win', at: at + 1000 }];
  assert.equal(activeClubBadges(p, at)[0].expiresAt, at + 86_400_000);
  assert.equal(activeClubBadges(p, at + 86_400_000 - 1).length, 1);
  p.journal.matches.pop();
  assert.equal(activeClubBadges(p, at + 86_400_000).length, 0);
});

test('hat-trick requires three distinct consecutive wins in the actual current window', () => {
  const now = 1_800_000_000_000;
  const p = profile('hat-trick');
  p.journal.matches = [0, 1, 2].map((i) => ({ id: `win-${i}`, at: now - (i + 1) * 1000, outcome: 'win' }));
  let heat = activeClubBadges(p, now).find((b) => b.id === 'hot-hand');
  assert.equal(heat.expiresAt, now - 3000 + 86_400_000);
  p.journal.matches.push({ id: 'new-loss', at: now, outcome: 'loss' });
  assert.ok(!activeClubBadges(p, now).some((b) => b.id === 'hot-hand'));
  p.journal.matches = Array(3).fill({ id: 'same', outcome: 'win', at: now });
  assert.ok(!activeClubBadges(p, now).some((b) => b.id === 'hot-hand'));
});

test('persisted badge choice does not make an expired badge active', async () => {
  const p = profile('expiry-choice');
  const now = 1_800_000_000_000;
  p.journal.matches = [{ id: 'won', at: now, outcome: 'win' }];
  const result = await transactClub(p, { type: 'badge', id: 'fresh-win' });
  assert.equal(result.record.badge, 'fresh-win');
  assert.equal(activeClubBadges(p, now + 86_400_000).length, 0);
});
