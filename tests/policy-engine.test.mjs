/**
 * The jurisdiction gate's truth table.
 *
 * These tests are written so that a rule change which alters behaviour shows up as a test diff
 * rather than as a quiet difference in production. The expensive failure mode for this file is a
 * permissive bug, so every test that asserts an allow is paired with one that asserts the deny it
 * must decay to.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, resolveAll, ancestors, specificity, QUESTIONS } from '../lib/policy/policy-engine.mjs';
import { buildBundle, readRule, DENY_ALL } from '../lib/policy/bundle.mjs';

const T = (iso) => Date.parse(iso);
const NOW = T('2026-09-14T00:00:00Z');

/** A complete, valid row. Tests override only the field under test. */
const row = (over) => ({
  region: '*',
  effectiveFrom: T('2020-01-01T00:00:00Z'),
  effectiveTo: null,
  play: 1,
  paid_entry: 0,
  purchase: 0,
  cash_out: 0,
  minAge: 18,
  citation: 'seed: no market enabled',
  reviewedBy: 'engineering',
  reviewedAt: T('2026-09-14T00:00:00Z'),
  ...over,
});

const ask = (bundle, region, question, at = NOW) =>
  resolve(bundle, { region, regionSource: 'test', question }, at);

test('with no rules at all, nothing is permitted — not even play', () => {
  for (const question of QUESTIONS) {
    const d = ask(DENY_ALL, 'US-NY', question);
    assert.equal(d.allow, false);
    assert.equal(d.reason, question === 'cash_out' ? 'capability_unavailable' : 'no_rule_deny');
  }
});

test('an unknown region falls to the wildcard, which permits play and nothing else', () => {
  const bundle = buildBundle([row({})], { payments_master: 'on' });
  // No cf header, local dev, the static build: all of these look like this.
  const all = resolveAll(bundle, { region: '', regionSource: 'absent' }, NOW);
  assert.equal(all.play.allow, true);
  assert.equal(all.play.ruleRegion, '*');
  assert.equal(all.paid_entry.allow, false);
  assert.equal(all.purchase.allow, false);
  assert.equal(all.cash_out.allow, false);
});

test('ancestry and specificity: US-WA beats US beats the wildcard', () => {
  assert.deepEqual(ancestors('us-wa'), ['US-WA', 'US', '*']);
  assert.deepEqual(ancestors('US'), ['US', '*']);
  assert.deepEqual(ancestors('garbage'), ['*']);
  assert.ok(specificity('US-WA') > specificity('US'));
  assert.ok(specificity('US') > specificity('*'));

  const bundle = buildBundle(
    [
      row({ region: '*', paid_entry: 0 }),
      row({ region: 'US', paid_entry: 1, citation: 'US: contest of skill' }),
      row({ region: 'US-WA', paid_entry: 0, citation: 'RCW 9.46 — verify with counsel' }),
    ],
    { payments_master: 'on' },
  );

  assert.equal(ask(bundle, 'US-NV', 'paid_entry').ruleRegion, 'US', 'a state with no row inherits the country');
  assert.equal(ask(bundle, 'US-NV', 'paid_entry').allow, true);
  assert.equal(ask(bundle, 'US-WA', 'paid_entry').ruleRegion, 'US-WA', 'a state row wins over its country');
  assert.equal(ask(bundle, 'US-WA', 'paid_entry').allow, false);
  assert.equal(ask(bundle, 'DE', 'paid_entry').ruleRegion, '*', 'an unlisted country inherits the wildcard');
});

test('a dated successor row takes over at its own timestamp, not a millisecond earlier', () => {
  // India's prohibition on online money games took effect 1 May 2026. The predecessor row must stay
  // authoritative right up to the boundary, and the successor must bite exactly on it.
  const flip = T('2026-05-01T00:00:00Z');
  const bundle = buildBundle(
    [
      row({
        region: 'IN',
        effectiveFrom: T('2020-01-01T00:00:00Z'),
        effectiveTo: flip,
        play: 1,
        paid_entry: 1,
        purchase: 1,
        citation: 'pre-PROG position',
      }),
      row({
        region: 'IN',
        effectiveFrom: flip,
        effectiveTo: null,
        play: 1,
        paid_entry: 0,
        purchase: 0,
        citation: 'Promotion and Regulation of Online Gaming Act 2025, in force 2026-05-01',
      }),
    ],
    { payments_master: 'on' },
  );

  assert.equal(ask(bundle, 'IN', 'paid_entry', flip - 1).allow, true, 'permitted the millisecond before');
  assert.equal(ask(bundle, 'IN', 'paid_entry', flip).allow, false, 'and refused exactly on the date');
  assert.equal(ask(bundle, 'IN', 'purchase', flip).reason, 'rule_deny');
  assert.equal(ask(bundle, 'IN', 'play', flip).allow, true, 'free play survives the prohibition');
  assert.match(ask(bundle, 'IN', 'paid_entry', flip).citation, /Online Gaming Act 2025/);
});

test('an expired rule with no successor falls back rather than lingering', () => {
  const bundle = buildBundle(
    [
      row({ region: '*', paid_entry: 0 }),
      row({
        region: 'US',
        paid_entry: 1,
        effectiveFrom: T('2020-01-01T00:00:00Z'),
        effectiveTo: T('2026-01-01T00:00:00Z'),
        citation: 'lapsed',
      }),
    ],
    { payments_master: 'on' },
  );
  assert.equal(ask(bundle, 'US-NV', 'paid_entry', T('2025-06-01T00:00:00Z')).allow, true);
  const after = ask(bundle, 'US-NV', 'paid_entry', NOW);
  assert.equal(after.allow, false, 'the lapsed permission does not survive its own end date');
  assert.equal(after.ruleRegion, '*');
});

test('the full (ceiling, rule, flag) truth table — only a rule can permit', () => {
  const table = [];
  for (const question of ['purchase', 'cash_out']) {
    for (const ruleBit of [0, 1]) {
      for (const flag of ['off', 'on']) {
        const bundle = buildBundle([row({ region: 'US', [question]: ruleBit, citation: 'table' })], {
          payments_master: flag,
        });
        const d = ask(bundle, 'US-NV', question);
        table.push(`${question} rule=${ruleBit} flag=${flag} -> ${d.allow ? 'ALLOW' : 'deny'}:${d.reason}`);
      }
    }
  }
  assert.deepEqual(table, [
    'purchase rule=0 flag=off -> deny:rule_deny',
    'purchase rule=0 flag=on -> deny:rule_deny',
    'purchase rule=1 flag=off -> deny:flag_deny',
    'purchase rule=1 flag=on -> ALLOW:allow',
    // cash_out is not built, so neither a permissive row nor a live flag can reach it.
    'cash_out rule=0 flag=off -> deny:capability_unavailable',
    'cash_out rule=0 flag=on -> deny:capability_unavailable',
    'cash_out rule=1 flag=off -> deny:capability_unavailable',
    'cash_out rule=1 flag=on -> deny:capability_unavailable',
  ]);
});

test('the kill switch cannot turn anything on, and does not touch free play', () => {
  const permissive = [row({ region: 'US', play: 1, paid_entry: 1, purchase: 1, citation: 'permissive' })];
  const off = buildBundle(permissive, { payments_master: 'off' });
  const on = buildBundle(permissive, { payments_master: 'on' });

  assert.equal(ask(off, 'US-NV', 'purchase').allow, false);
  assert.equal(ask(on, 'US-NV', 'purchase').allow, true);
  assert.equal(ask(off, 'US-NV', 'play').allow, true, 'stopping money must not stop the game');

  // Absent, misspelled and hostile flag values are all "not on".
  for (const value of [undefined, '', 'ON', 'true', '1', 'yes']) {
    const b = buildBundle(permissive, value === undefined ? {} : { payments_master: value });
    assert.equal(ask(b, 'US-NV', 'purchase').allow, false, `flag ${JSON.stringify(value)} must not enable`);
  }
});

test('resolve is pure: identical inputs give a byte-identical decision and the same hash', () => {
  const bundle = buildBundle([row({ region: 'US', paid_entry: 1, citation: 'pure' })], { payments_master: 'on' });
  const a = ask(bundle, 'US-NV', 'paid_entry');
  const b = ask(bundle, 'US-NV', 'paid_entry');
  assert.deepEqual(a, b);
  assert.equal(a.hash, b.hash);
  assert.equal(JSON.stringify(a), JSON.stringify(b));

  // A different answer must not collide with it.
  const denied = ask(buildBundle([row({ region: 'US' })], { payments_master: 'on' }), 'US-NV', 'paid_entry');
  assert.notEqual(denied.hash, a.hash);
  assert.ok(Object.isFrozen(a), 'a recorded decision must not be mutable after the fact');
});

test('an unrecognised question is denied rather than ignored', () => {
  const bundle = buildBundle([row({ region: 'US', play: 1 })], { payments_master: 'on' });
  const d = ask(bundle, 'US-NV', 'withdraw_to_bank');
  assert.equal(d.allow, false);
  assert.equal(d.reason, 'unknown_question');
});

test('a rule without a citation or a reviewer is rejected, not defaulted', () => {
  assert.match(readRule(row({ citation: '  ' })).error, /cite the authority/);
  assert.match(readRule(row({ reviewedBy: null })).error, /who reviewed it/);
  assert.match(readRule(row({ region: 'UNITED-STATES' })).error, /bad region/);
  assert.match(readRule(row({ effectiveTo: T('2019-01-01T00:00:00Z') })).error, /after effective_from/);

  // A malformed row is dropped and reported; it can never become a permission.
  const bundle = buildBundle([row({ region: 'US', purchase: 1, citation: null }), row({})], {
    payments_master: 'on',
  });
  assert.equal(bundle.errors.length, 1);
  assert.equal(bundle.rules.length, 1);
  assert.equal(ask(bundle, 'US-NV', 'purchase').allow, false);
});

test('rulesVersion changes when the rules or the flags change', () => {
  const rules = [row({ region: 'US', paid_entry: 1, citation: 'v' })];
  const a = buildBundle(rules, { payments_master: 'off' });
  const b = buildBundle(rules, { payments_master: 'on' });
  const c = buildBundle([row({ region: 'US', paid_entry: 0, citation: 'v' })], { payments_master: 'off' });
  assert.notEqual(a.rulesVersion, b.rulesVersion, 'a flag change must be visible in the version');
  assert.notEqual(a.rulesVersion, c.rulesVersion, 'a rule change must be visible in the version');
  assert.equal(a.rulesVersion, buildBundle(rules, { payments_master: 'off' }).rulesVersion, 'and be stable');
});
