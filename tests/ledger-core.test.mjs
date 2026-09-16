/**
 * The ledger core, tested with no infrastructure at all — these are pure functions.
 *
 * The load-bearing test in this file is "purchased value cannot be staked". It is not a style
 * preference: a coin that is bought and can then be staked and lost supplies both the consideration
 * limb and the prize limb of the gambling tests in Washington and New York with no cash-out anywhere
 * in the product. The guarantee has to be structural, and the tests below try to break it several
 * different ways on purpose.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256 } from '../lib/ledger/sha256.mjs';
import {
  LedgerError,
  PLAY_TREASURY,
  VALUE_LIABILITY,
  VALUE_REVENUE,
  accountId,
  escrowAccount,
  parseAccount,
  userAccount,
} from '../lib/ledger/accounts.mjs';
import { transactionId, entryId, assertOpKey } from '../lib/ledger/entry-id.mjs';
import { plan, effects, overdrafts } from '../lib/ledger/posting.mjs';
import { grant, stake, settle, purchase, spend, reverse, INTENTS, wellFormed } from '../lib/ledger/intents.mjs';
import { check } from '../lib/ledger/invariants.mjs';
import { assertStore, REQUIRED } from '../lib/ledger/store-contract.mjs';

const AT = Date.parse('2026-09-16T10:00:00Z');
const ALICE = 'p_alice';
const BOB = 'p_bob';
const ROOM = 'r_0001';

const codeOf = (fn) => {
  try {
    fn();
    return null;
  } catch (error) {
    assert.ok(error instanceof LedgerError, `expected a LedgerError, got ${error}`);
    return error.code;
  }
};

/* ------------------------------------------------------------------ sha256 */

test('sha256 matches the published vectors', () => {
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(
    sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  );
  // Multi-block, and non-ASCII, since operation keys can carry either.
  assert.equal(sha256('a'.repeat(1000)).length, 64);
  assert.equal(sha256('café'), sha256('café'));
  assert.notEqual(sha256('café'), sha256('cafe'));
});

/* ------------------------------------------------------------------ accounts */

test('account ids round-trip and reject malformed input', () => {
  const id = userAccount('play', ALICE);
  assert.equal(id, 'play:user:p_alice');
  const parsed = parseAccount(id);
  assert.equal(parsed.ledger, 'play');
  assert.equal(parsed.kind, 'user');
  assert.equal(parsed.owner, ALICE);
  assert.equal(parsed.mayGoNegative, false);

  assert.equal(codeOf(() => accountId('cash', 'user', ALICE)), 'bad_ledger');
  assert.equal(codeOf(() => accountId('play', 'wallet', ALICE)), 'bad_kind');
  assert.equal(codeOf(() => accountId('play', 'user', 'has:colon')), 'bad_owner');
  assert.equal(codeOf(() => accountId('play', 'user', '')), 'bad_owner');
  assert.equal(codeOf(() => parseAccount('play:user')), 'bad_account');
});

test('only source accounts may hold a negative balance', () => {
  assert.equal(parseAccount(PLAY_TREASURY).mayGoNegative, true);
  assert.equal(parseAccount(VALUE_LIABILITY).mayGoNegative, true);
  assert.equal(parseAccount(VALUE_REVENUE).mayGoNegative, false);
  assert.equal(parseAccount(escrowAccount(ROOM)).mayGoNegative, false);
  assert.equal(parseAccount(userAccount('value', ALICE)).mayGoNegative, false);
});

/* ------------------------------------------------------------------ identifiers */

test('identifiers are derived, stable, and distinct per leg', () => {
  assert.equal(transactionId('settle:r_0001'), transactionId('settle:r_0001'));
  assert.notEqual(transactionId('settle:r_0001'), transactionId('settle:r_0002'));
  const tx = transactionId('stake:r_0001:0');
  assert.notEqual(entryId(tx, 0), entryId(tx, 1));
  assert.equal(entryId(tx, 0), entryId(tx, 0));
  assert.match(tx, /^tx_[0-9a-f]{32}$/);
  assert.match(entryId(tx, 0), /^en_[0-9a-f]{32}$/);
});

test('an operation key must name an event, not an attempt', () => {
  assert.equal(assertOpKey('settle:r_0001'), 'settle:r_0001');
  assert.equal(assertOpKey('grant:round:r_1:3'), 'grant:round:r_1:3');
  for (const bad of ['', 'settle', ':r_1', 'Settle:r_1', 'settle:', 'settle:r 1', 'settle:r/1', null]) {
    assert.equal(codeOf(() => assertOpKey(bad)), 'bad_op_key', `should reject ${JSON.stringify(bad)}`);
  }
  assert.equal(codeOf(() => assertOpKey(`settle:${'x'.repeat(300)}`)), 'bad_op_key');
});

/* ------------------------------------------------------------------ posting */

test('a transaction must name both sides and sum to zero', () => {
  const ok = plan({
    opKey: 'grant:round:r_1',
    kind: 'grant',
    at: AT,
    legs: [
      { account: PLAY_TREASURY, amount: -10 },
      { account: userAccount('play', ALICE), amount: 10 },
    ],
  });
  assert.equal(ok.entries.length, 2);
  assert.equal(ok.ledger, 'play');

  const one = [{ account: userAccount('play', ALICE), amount: 10 }];
  assert.equal(codeOf(() => plan({ opKey: 'grant:x', kind: 'grant', at: AT, legs: one })), 'unbalanced');
  assert.equal(
    codeOf(() =>
      plan({
        opKey: 'grant:x',
        kind: 'grant',
        at: AT,
        legs: [
          { account: PLAY_TREASURY, amount: -10 },
          { account: userAccount('play', ALICE), amount: 9 },
        ],
      }),
    ),
    'unbalanced',
  );
});

test('amounts must be non-zero safe integers', () => {
  const legs = (amount) => [
    { account: PLAY_TREASURY, amount: -amount },
    { account: userAccount('play', ALICE), amount },
  ];
  for (const bad of [0, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 2, '10', null]) {
    assert.equal(codeOf(() => plan({ opKey: 'grant:x', kind: 'grant', at: AT, legs: legs(bad) })), 'bad_amount');
  }
});

test('the same account may not appear twice in one transaction', () => {
  const me = userAccount('play', ALICE);
  assert.equal(
    codeOf(() =>
      plan({
        opKey: 'grant:x',
        kind: 'grant',
        at: AT,
        legs: [
          { account: PLAY_TREASURY, amount: -10 },
          { account: me, amount: 4 },
          { account: me, amount: 6 },
        ],
      }),
    ),
    'duplicate_account',
  );
});

test('a transaction must carry a kind and a timestamp', () => {
  const legs = [
    { account: PLAY_TREASURY, amount: -1 },
    { account: userAccount('play', ALICE), amount: 1 },
  ];
  assert.equal(codeOf(() => plan({ opKey: 'grant:x', at: AT, legs })), 'bad_kind');
  assert.equal(codeOf(() => plan({ opKey: 'grant:x', kind: 'grant', legs })), 'bad_time');
  assert.equal(codeOf(() => plan({ opKey: 'grant:x', kind: 'grant', at: -1, legs })), 'bad_time');
});

test('a planned transaction is frozen — a recorded movement is not editable after the fact', () => {
  const tx = grant({ principalId: ALICE, amount: 10, opKey: 'grant:round:r_1', at: AT });
  assert.ok(Object.isFrozen(tx));
  assert.ok(Object.isFrozen(tx.entries));
  assert.ok(Object.isFrozen(tx.entries[0]));
});

/* ---------------------------------------------- the guarantee: no cross-ledger movement */

test('a transaction may not span the two ledgers', () => {
  assert.equal(
    codeOf(() =>
      plan({
        opKey: 'convert:x',
        kind: 'grant',
        at: AT,
        legs: [
          { account: userAccount('value', ALICE), amount: -10 },
          { account: userAccount('play', ALICE), amount: 10 },
        ],
      }),
    ),
    'cross_ledger',
    'converting purchased value into stakeable play value must be inexpressible',
  );
});

test('purchased value cannot reach a match escrow, by any route', () => {
  // Direct: value account into a play escrow.
  assert.equal(
    codeOf(() =>
      plan({
        opKey: 'stake:r_0001:0',
        kind: 'stake',
        at: AT,
        legs: [
          { account: userAccount('value', ALICE), amount: -10 },
          { account: escrowAccount(ROOM), amount: 10 },
        ],
      }),
    ),
    'cross_ledger',
  );

  // Via the intent, which names the play ledger and cannot be told otherwise: there is no argument
  // to `stake` that selects a ledger, so the only way in is the direct route above.
  const viaIntent = stake({ principalId: ALICE, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:0', at: AT });
  assert.equal(viaIntent.ledger, 'play');
  assert.ok(viaIntent.entries.every((e) => parseAccount(e.account).ledger === 'play'));

  // And an escrow account only exists on the play ledger at all.
  assert.equal(parseAccount(escrowAccount(ROOM)).ledger, 'play');
  assert.equal(codeOf(() => accountId('value', 'escrow', ROOM)), null, 'the id is expressible…');
  assert.equal(
    codeOf(() =>
      plan({
        opKey: 'stake:r_0001:0',
        kind: 'stake',
        at: AT,
        legs: [
          { account: userAccount('value', ALICE), amount: -10 },
          { account: accountId('value', 'escrow', ROOM), amount: 10 },
        ],
      }),
    ),
    null,
    '…so the partition alone does not stop a value-ledger escrow — `wellFormed` is what rejects it',
  );
  const forged = plan({
    opKey: 'stake:r_0001:0',
    kind: 'stake',
    at: AT,
    legs: [
      { account: userAccount('value', ALICE), amount: -10 },
      { account: accountId('value', 'escrow', ROOM), amount: 10 },
    ],
  });
  assert.equal(wellFormed(forged), false, 'a stake on the value ledger is not a permitted combination');
  assert.equal(check([forged]).ok, false);
  assert.ok(check([forged]).violations.some((v) => v.rule === 'well_formed'));
});

test('the intent table is the readable answer to "what can touch which ledger"', () => {
  assert.deepEqual(Object.keys(INTENTS).sort(), ['grant', 'purchase', 'reverse', 'settle', 'spend', 'stake']);
  assert.deepEqual(
    Object.fromEntries(Object.entries(INTENTS).map(([k, v]) => [k, v.ledger])),
    { grant: 'play', stake: 'play', settle: 'play', purchase: 'value', spend: 'value', reverse: 'value' },
  );
  // There is no cash-out intent, at any milestone.
  assert.equal(INTENTS.cashout, undefined);
  assert.equal(INTENTS.withdraw, undefined);
  // And nothing mints value — purchased value enters only against a provider reference.
  assert.equal(INTENTS.mint, undefined);
});

/* ------------------------------------------------------------------ intents */

test('a duel round-trips through the books and leaves the escrow empty', () => {
  const log = [
    grant({ principalId: ALICE, amount: 100, opKey: 'grant:signup:p_alice', at: AT }),
    grant({ principalId: BOB, amount: 100, opKey: 'grant:signup:p_bob', at: AT }),
    stake({ principalId: ALICE, roomId: ROOM, amount: 25, opKey: 'stake:r_0001:0', at: AT + 1 }),
    stake({ principalId: BOB, roomId: ROOM, amount: 25, opKey: 'stake:r_0001:1', at: AT + 2 }),
    settle({ roomId: ROOM, payouts: [{ principalId: ALICE, amount: 50 }], opKey: 'settle:r_0001', at: AT + 3, reason: 'complete' }),
  ];
  const result = check(log);
  assert.deepEqual(result.violations, []);
  assert.equal(result.balances.get(userAccount('play', ALICE)), 125);
  assert.equal(result.balances.get(userAccount('play', BOB)), 75);
  assert.equal(result.balances.get(escrowAccount(ROOM)), 0, 'a settled match strands nothing');
  assert.equal(result.balances.get(PLAY_TREASURY), -200, 'the treasury records lifetime issuance');
  assert.equal(result.perLedger.play, 0);
});

test('a draw refunds both seats and still exhausts the escrow', () => {
  const log = [
    grant({ principalId: ALICE, amount: 50, opKey: 'grant:signup:p_alice', at: AT }),
    grant({ principalId: BOB, amount: 50, opKey: 'grant:signup:p_bob', at: AT }),
    stake({ principalId: ALICE, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:0', at: AT + 1 }),
    stake({ principalId: BOB, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:1', at: AT + 2 }),
    settle({
      roomId: ROOM,
      payouts: [
        { principalId: ALICE, amount: 10 },
        { principalId: BOB, amount: 10 },
      ],
      opKey: 'settle:r_0001',
      at: AT + 3,
      reason: 'draw',
    }),
  ];
  const result = check(log);
  assert.deepEqual(result.violations, []);
  assert.equal(result.balances.get(escrowAccount(ROOM)), 0);
  assert.equal(result.balances.get(userAccount('play', ALICE)), 50);
});

test('one principal on both sides of a settlement is paid once, for the sum', () => {
  // A practice match where one person holds both seats, or a draw returning each seat its own
  // stake, legitimately produces two payouts to the same player. `plan()` refuses two legs against
  // one account — correctly, since everywhere else that is a caller bug — so `settle` nets first.
  const log = [
    grant({ principalId: ALICE, amount: 100, opKey: 'grant:a', at: AT }),
    stake({ principalId: ALICE, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:0', at: AT + 1 }),
    stake({ principalId: ALICE, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:1', at: AT + 2 }),
    settle({
      roomId: ROOM,
      payouts: [
        { principalId: ALICE, amount: 10 },
        { principalId: ALICE, amount: 10 },
      ],
      opKey: 'settle:r_0001',
      at: AT + 3,
      reason: 'draw',
    }),
  ];
  const tx = log[3];
  assert.equal(tx.entries.length, 2, 'netted to one escrow leg and one payout leg');
  assert.equal(tx.entries.find((e) => e.account === userAccount('play', ALICE)).amount, 20);

  const result = check(log);
  assert.deepEqual(result.violations, []);
  assert.equal(result.balances.get(userAccount('play', ALICE)), 100);
  assert.equal(result.balances.get(escrowAccount(ROOM)), 0);
});

test('settling for more than the escrow holds overdraws it and is caught', () => {
  const log = [
    grant({ principalId: ALICE, amount: 50, opKey: 'grant:signup:p_alice', at: AT }),
    stake({ principalId: ALICE, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:0', at: AT + 1 }),
    settle({ roomId: ROOM, payouts: [{ principalId: ALICE, amount: 999 }], opKey: 'settle:r_0001', at: AT + 2 }),
  ];
  const result = check(log);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.rule === 'no_overdraft' && v.detail.includes('escrow')));
});

test('intents refuse non-positive amounts and unattributed money', () => {
  assert.equal(codeOf(() => grant({ principalId: ALICE, amount: 0, opKey: 'grant:x', at: AT })), 'bad_amount');
  assert.equal(codeOf(() => grant({ principalId: ALICE, amount: -5, opKey: 'grant:x', at: AT })), 'bad_amount');
  assert.equal(codeOf(() => stake({ principalId: ALICE, roomId: ROOM, amount: -1, opKey: 'stake:x', at: AT })), 'bad_amount');
  assert.equal(codeOf(() => settle({ roomId: ROOM, payouts: [], opKey: 'settle:x', at: AT })), 'bad_payouts');
  assert.equal(codeOf(() => purchase({ principalId: ALICE, amount: 500, at: AT })), 'no_provider_ref');
  assert.equal(codeOf(() => reverse({ principalId: ALICE, amount: 500, at: AT })), 'no_provider_ref');
});

test('a purchase is a debt until it is spent, and a reversal unwinds it', () => {
  const bought = purchase({ principalId: ALICE, amount: 500, providerRef: 'pi_abc123', at: AT });
  assert.equal(bought.ledger, 'value');
  assert.equal(bought.opKey, 'purchase:pi_abc123', 'keyed on the provider reference, so a webhook retry is a no-op');

  const spent = spend({ principalId: ALICE, amount: 200, opKey: 'spend:cosmetic:aurora', at: AT + 1, item: 'aurora' });
  const result = check([bought, spent]);
  assert.deepEqual(result.violations, []);
  assert.equal(result.balances.get(userAccount('value', ALICE)), 300);
  assert.equal(result.balances.get(VALUE_LIABILITY), -500, 'still owed to the player until spent');
  assert.equal(result.balances.get(VALUE_REVENUE), 200);
  assert.equal(result.perLedger.value, 0);

  const undone = check([bought, reverse({ principalId: ALICE, amount: 500, providerRef: 'pi_abc123', at: AT + 2 })]);
  assert.deepEqual(undone.violations, []);
  assert.equal(undone.balances.get(userAccount('value', ALICE)), 0);
});

test('a reversal cannot push a player below zero', () => {
  const log = [
    purchase({ principalId: ALICE, amount: 500, providerRef: 'pi_abc', at: AT }),
    spend({ principalId: ALICE, amount: 400, opKey: 'spend:cosmetic:x', at: AT + 1 }),
    reverse({ principalId: ALICE, amount: 500, providerRef: 'pi_abc', at: AT + 2 }),
  ];
  const result = check(log);
  assert.equal(result.ok, false, 'spend-then-chargeback must be visible, not silently absorbed');
  assert.ok(result.violations.some((v) => v.rule === 'no_overdraft'));
});

/* ------------------------------------------------------------------ invariants */

test('check() replays in order, so a mid-sequence overdraft that recovers is still caught', () => {
  const log = [
    grant({ principalId: ALICE, amount: 10, opKey: 'grant:a', at: AT }),
    stake({ principalId: ALICE, roomId: ROOM, amount: 10, opKey: 'stake:r_0001:0', at: AT + 1 }),
    // Spends what it does not have, then is made whole. Final balances look innocent.
    stake({ principalId: ALICE, roomId: 'r_0002', amount: 10, opKey: 'stake:r_0002:0', at: AT + 2 }),
    settle({ roomId: ROOM, payouts: [{ principalId: ALICE, amount: 10 }], opKey: 'settle:r_0001', at: AT + 3 }),
  ];
  const result = check(log);
  assert.equal(result.balances.get(userAccount('play', ALICE)), 0, 'ends at zero — a final check would pass');
  assert.equal(result.ok, false, 'but it went negative on the way, which is what a double-spend looks like');
  assert.ok(result.violations.some((v) => v.rule === 'no_overdraft'));
});

test('a forged identifier is detected', () => {
  const real = grant({ principalId: ALICE, amount: 10, opKey: 'grant:a', at: AT });
  const forged = { ...real, id: 'tx_deadbeefdeadbeefdeadbeefdeadbeef' };
  assert.ok(check([forged]).violations.some((v) => v.rule === 'derived_id'));

  const forgedEntry = {
    ...real,
    entries: [{ ...real.entries[0], id: 'en_0000000000000000000000000000000f' }, real.entries[1]],
  };
  assert.ok(check([forgedEntry]).violations.some((v) => v.rule === 'derived_id'));
});

test('the same transaction posted twice is a violation, not a doubling', () => {
  const once = grant({ principalId: ALICE, amount: 10, opKey: 'grant:a', at: AT });
  const result = check([once, once]);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.rule === 'unique_transaction'));
  assert.ok(result.violations.some((v) => v.rule === 'unique_entry'));
});

test('a cross-ledger leak does not hide behind a zero global sum', () => {
  // Hand-built: balanced overall, but each ledger is off by ten in opposite directions.
  const leak = [
    { ...grant({ principalId: ALICE, amount: 10, opKey: 'grant:a', at: AT }) },
  ];
  const tampered = {
    ...leak[0],
    entries: [leak[0].entries[0], { ...leak[0].entries[1], account: userAccount('value', ALICE) }],
  };
  const result = check([tampered]);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.rule === 'trial_balance'), 'each ledger must balance independently');
});

/* ------------------------------------------------------------------ helpers and contract */

test('effects and overdrafts answer before anything is written', () => {
  const tx = stake({ principalId: ALICE, roomId: ROOM, amount: 25, opKey: 'stake:r_0001:0', at: AT });
  assert.deepEqual([...effects(tx).entries()].sort(), [
    [escrowAccount(ROOM), 25],
    [userAccount('play', ALICE), -25],
  ].sort());

  assert.deepEqual(overdrafts(tx, new Map([[userAccount('play', ALICE), 100]])), []);
  assert.deepEqual(overdrafts(tx, new Map([[userAccount('play', ALICE), 10]])), [userAccount('play', ALICE)]);
  assert.deepEqual(overdrafts(tx, {}), [userAccount('play', ALICE)], 'an unknown balance reads as zero');

  // A source account is expected to go negative and must never be reported.
  const minted = grant({ principalId: ALICE, amount: 10, opKey: 'grant:a', at: AT });
  assert.deepEqual(overdrafts(minted, new Map()), []);
});

test('the store contract names what an implementation must provide', () => {
  assert.deepEqual(REQUIRED, ['post', 'balances', 'entriesFor', 'transaction']);
  assert.equal(codeOf(() => assertStore({ post() {} })), 'bad_store');
  const complete = { post() {}, balances() {}, entriesFor() {}, transaction() {} };
  assert.equal(assertStore(complete), complete);
});

test('the ledger core imports nothing that performs I/O', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../lib/ledger/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.mjs'));
  assert.ok(files.length >= 6, `expected the whole ledger core, saw ${files.join(', ')}`);
  for (const file of files) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    for (const spec of imports) {
      assert.ok(
        spec.startsWith('./'),
        `${file} imports ${spec}; the ledger core must stay pure and dependency-free`,
      );
    }
  }
});
