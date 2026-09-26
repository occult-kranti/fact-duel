/**
 * HISAAB DO — the route mix (balance review F2, docs/hisaab/review/balance.md).
 *
 * State and sector routes hold at most two `scam` cards of six. On a state route, every government with
 * three or more items in the state's pool is dealt a card that is not a scam card, and one of its
 * schemes when the pool holds both its scam cards and a scheme. Difficulty order, the Centre top-up and
 * its disclosure, route ids and every other route kind are unchanged. The deal stays deterministic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveRoutes, pickCards, ROUTE_MIX, ROUTE_CARDS, slug } from '../editions/hisaab/engine/routes.mjs';
import { SECTORS } from '../editions/hisaab/bank/schema.mjs';
import { BANK } from '../editions/hisaab/bank/index.mjs';

const LEVELS = ['simple', 'expert', 'extreme'];
const byId = new Map(BANK.map((q) => [q.id, q]));
const isScam = (q) => q.kind === 'scam';
const cardsOf = (route, bank = byId) => route.ids.map((id) => bank.get(id));
const levels = (cards) => LEVELS.map((level) => cards.filter((q) => q.difficulty === level).length);

// ---- The pre-F2 picker, frozen verbatim as the reference for "without a mix, nothing changed" ----------
function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function ranked(pool, salt) {
  return [...pool]
    .map((q) => ({ q, h: fnv1a32(`${salt}:${q.id}`) }))
    .sort((a, b) => a.h - b.h || (a.q.id < b.q.id ? -1 : a.q.id > b.q.id ? 1 : 0))
    .map((x) => x.q);
}
const levelIndex = (q) => {
  const i = LEVELS.indexOf(q.difficulty);
  return i < 0 ? LEVELS.length : i;
};
function legacyPickCards(pool, salt, fill = []) {
  const order = ranked(pool, salt);
  const chosen = [];
  for (const level of LEVELS) chosen.push(...order.filter((q) => q.difficulty === level).slice(0, 2));
  for (const q of order) if (chosen.length < ROUTE_CARDS && !chosen.includes(q)) chosen.push(q);
  const padded = [];
  for (const q of fill) {
    if (chosen.length >= ROUTE_CARDS) break;
    if (!chosen.some((c) => c.id === q.id)) {
      chosen.push(q);
      padded.push(q.id);
    }
  }
  const rank = new Map(order.map((q, i) => [q.id, i]));
  const place = (q) => rank.get(q.id) ?? order.length + padded.indexOf(q.id);
  const cards = chosen
    .slice(0, ROUTE_CARDS)
    .sort((a, b) => levelIndex(a) - levelIndex(b) || place(a) - place(b));
  return { cards, padded: padded.filter((id) => cards.some((q) => q.id === id)) };
}

/** A small deterministic PRNG, so the random pools are the same on every run. */
function prng(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
}

let serial = 0;
/** A minimal bank item: the fields route derivation reads. */
function item({
  state = 'IN',
  topic = 'Health',
  kind = 'scheme',
  govt = 'Other',
  difficulty = LEVELS[serial % 3],
  year = null,
} = {}) {
  serial += 1;
  return {
    id: `hzz${String(serial).padStart(3, '0')}`,
    domain: 'civics',
    state,
    topic,
    kind,
    govt,
    difficulty,
    year,
    question: `Q${serial}?`,
  };
}
const many = (n, fields) => Array.from({ length: n }, () => item(fields));

/** Governments owed a clean card on a state route: 3+ items in the pool and at least one clean item. */
function owed(pool) {
  const tally = new Map();
  for (const q of pool) tally.set(q.govt, (tally.get(q.govt) ?? 0) + 1);
  return [...tally]
    .filter(([govt, n]) => n >= ROUTE_MIX.state.govtMin && pool.some((q) => q.govt === govt && !isScam(q)))
    .map(([govt]) => ({
      govt,
      wantsScheme:
        pool.some((q) => q.govt === govt && isScam(q)) &&
        pool.some((q) => q.govt === govt && q.kind === 'scheme'),
    }));
}

// ---- The served bank --------------------------------------------------------------------------------

test('the mix is the one F2 asked for: two scam cards at most, governments with three or more items', () => {
  assert.deepEqual(ROUTE_MIX, { state: { maxScams: 2, govtMin: 3 }, sector: { maxScams: 2 } });
  assert.ok(
    Object.isFrozen(ROUTE_MIX) && Object.isFrozen(ROUTE_MIX.state) && Object.isFrozen(ROUTE_MIX.sector),
  );
});

test('the bank: no state or sector route holds more than two scam cards', () => {
  const routes = deriveRoutes(BANK).filter((r) => r.kind === 'state' || r.kind === 'sector');
  assert.ok(
    routes.filter((r) => r.kind === 'state').length >= 25 &&
      routes.filter((r) => r.kind === 'sector').length >= 10,
  );
  for (const r of routes) {
    const scams = cardsOf(r).filter(isScam).length;
    assert.ok(scams <= ROUTE_MIX[r.kind].maxScams, `${r.id} holds ${scams} scam cards`);
  }
});

test('the bank: every government with three or more items in a state is dealt a card off the scam file', () => {
  for (const r of deriveRoutes(BANK).filter((x) => x.kind === 'state')) {
    const pool = BANK.filter((q) => q.domain === 'civics' && q.state === r.state);
    const own = cardsOf(r).filter((q) => !r.padded.includes(q.id));
    for (const { govt, wantsScheme } of owed(pool)) {
      assert.ok(
        own.some((q) => q.govt === govt && !isScam(q)),
        `${r.id}: ${govt} has a non-scam card`,
      );
      // On the served bank the scheme preference never has to give way, so pin it too.
      if (wantsScheme)
        assert.ok(
          own.some((q) => q.govt === govt && q.kind === 'scheme'),
          `${r.id}: ${govt} has a scheme`,
        );
    }
  }
});

test('F2 as reported: West Bengal and Kerala are no longer one party’s charge sheet', () => {
  const routes = deriveRoutes(BANK);
  const wb = cardsOf(routes.find((r) => r.id === 'state-wb'));
  const kl = cardsOf(routes.find((r) => r.id === 'state-kl'));
  // Before: four TMC scam cards plus two BJP schemes.
  assert.ok(wb.filter((q) => q.govt === 'TMC' && isScam(q)).length <= 2);
  assert.ok(
    wb.some((q) => q.govt === 'TMC' && q.kind === 'scheme'),
    'a TMC scheme (Kanyashree, Lakshmir Bhandar …) is dealt',
  );
  assert.ok(wb.some((q) => q.govt === 'BJP' && !isScam(q)));
  // Before: four LDF cards (two scam) and two NDA cards, no UDF.
  assert.ok(
    kl.some((q) => q.govt === 'LDF' && q.kind === 'scheme'),
    'an LDF scheme is dealt',
  );
  assert.ok(
    kl.some((q) => q.govt === 'UDF' && !isScam(q)),
    'the UDF (six items in the pool) is dealt',
  );
  assert.ok(kl.some((q) => q.govt === 'NDA' && !isScam(q)));
});

test('route ids are unchanged: the mix changes which six, never which routes', () => {
  const mixed = deriveRoutes(BANK);
  const plain = deriveRoutes(BANK, { mix: null });
  assert.deepEqual(
    mixed.map((r) => r.id),
    plain.map((r) => r.id),
  );
  for (const [i, r] of mixed.entries()) {
    const was = plain[i];
    for (const field of ['id', 'kind', 'key', 'version', 'title', 'code', 'stamp', 'poolSize'])
      assert.equal(r[field], was[field], `${r.id}.${field}`);
    assert.equal(
      r.version,
      1,
      'no version bump: an unfinished run on changed cards is dropped by readExpeditions',
    );
    // Money-trail, year, Kiska Media and Forward Court routes take no mix: they are exactly as before.
    if (r.kind !== 'state' && r.kind !== 'sector') assert.deepEqual(r, was, `${r.id} is untouched`);
  }
  // Without a mix the picker is the pre-F2 one: every state and sector pool of the bank (the ones the
  // Centre does not top up) …
  const civics = BANK.filter((q) => q.domain === 'civics');
  for (const r of plain) {
    if (r.kind === 'state' && r.padded.length === 0) {
      const pool = civics.filter((q) => q.state === r.state);
      assert.deepEqual(
        r.ids,
        legacyPickCards(pool, r.id).cards.map((q) => q.id),
        r.id,
      );
    }
    if (r.kind === 'sector') {
      const pool = civics.filter((q) => q.topic === r.sector);
      assert.deepEqual(
        r.ids,
        legacyPickCards(pool, r.id).cards.map((q) => q.id),
        r.id,
      );
    }
  }
  // … and random pools with a top-up, odd difficulties and duplicate fill.
  const rnd = prng(20260926);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  for (let t = 0; t < 400; t++) {
    const pool = Array.from({ length: 1 + Math.floor(rnd() * 14) }, (_, i) => ({
      id: `p${t}-${i}`,
      difficulty: pick([...LEVELS, 'unrated']),
      kind: pick(['scam', 'scheme', 'spend', 'institution']),
      govt: pick(['A', 'B', 'C']),
    }));
    const fill = Array.from({ length: Math.floor(rnd() * 6) }, (_, i) => ({
      id: `f${t}-${i}`,
      difficulty: pick(LEVELS),
      kind: pick(['scam', 'spend']),
    }));
    if (pool.length && rnd() < 0.3) fill.unshift(pool[0]);
    assert.deepEqual(
      pickCards(pool, `salt-${t}`, fill),
      legacyPickCards(pool, `salt-${t}`, fill),
      `random pool ${t}`,
    );
  }
  // The state and sector routes the bank derived on the day F2 landed are all still derived.
  const ids = new Set(mixed.map((r) => r.id));
  const stateCodes =
    'up ut hp pb hr dl jk rj br jh gj mh ga mp ct ka kl tn ap tg wb od as ar mn ml mz nl sk tr'.split(' ');
  for (const code of stateCodes) assert.ok(ids.has(`state-${code}`), `state-${code}`);
  for (const sector of SECTORS.filter((s) => s !== 'Media & Speech'))
    assert.ok(ids.has(`sector-${slug(sector)}`), sector);
});

test('a route whose six already met the mix keeps them; the difficulty ladder is the same as before', () => {
  const mixed = deriveRoutes(BANK);
  const plain = deriveRoutes(BANK, { mix: null });
  let kept = 0;
  for (const [i, r] of mixed.entries()) {
    if (r.kind !== 'state' && r.kind !== 'sector') continue;
    const was = plain[i];
    const before = cardsOf(was);
    const pool = BANK.filter(
      (q) => q.domain === 'civics' && (r.kind === 'state' ? q.state === r.state : q.topic === r.sector),
    );
    const ownBefore = before.filter((q) => !was.padded.includes(q.id));
    const met =
      before.filter(isScam).length <= 2 &&
      (r.kind === 'sector' ||
        owed(pool).every(({ govt, wantsScheme }) =>
          ownBefore.some((q) => q.govt === govt && (wantsScheme ? q.kind === 'scheme' : !isScam(q))),
        ));
    if (met) {
      assert.deepEqual(r.ids, was.ids, `${r.id} already met the mix and keeps its six`);
      kept += 1;
    }
    const after = cardsOf(r);
    assert.deepEqual(levels(after), levels(before), `${r.id}: same cards per difficulty as before`);
    const order = after.map(levelIndex);
    assert.deepEqual(order, [...order].sort(), `${r.id}: simple → expert → extreme`);
    assert.equal(r.padded.length, was.padded.length, `${r.id}: the Centre top-up is unchanged on this bank`);
  }
  assert.ok(kept >= 20, `most routes already met the mix (${kept})`);
});

test('the deal is deterministic: same bank, same six — whatever order the bank is listed in', () => {
  const once = deriveRoutes(BANK);
  assert.deepEqual(deriveRoutes(BANK), once);
  assert.deepEqual(deriveRoutes([...BANK].reverse()), once, 'reversed');
  const rnd = prng(7);
  const shuffled = [...BANK]
    .map((q) => ({ q, k: rnd() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.q);
  assert.deepEqual(deriveRoutes(shuffled), once, 'shuffled');
  const pool = BANK.filter((q) => q.state === 'WB');
  assert.deepEqual(
    pickCards(pool, 'state-wb', [], ROUTE_MIX.state),
    pickCards([...pool].reverse(), 'state-wb', [], ROUTE_MIX.state),
  );
});

// ---- Synthetic pools --------------------------------------------------------------------------------

test('a WB-shaped pool: the scam cards are capped and each government shows its schemes', () => {
  serial = 0;
  const pool = [
    ...many(8, { state: 'WB', govt: 'TMC', kind: 'scam' }),
    ...many(6, { state: 'WB', govt: 'TMC', kind: 'scheme' }),
    ...many(2, { state: 'WB', govt: 'TMC', kind: 'spend' }),
    ...many(4, { state: 'WB', govt: 'BJP', kind: 'scheme' }),
    ...many(2, { state: 'WB', govt: 'CPI(M)', kind: 'spend' }), // two items: not owed a card
  ];
  // Every salt, so the rule is not a lucky hash.
  for (let s = 0; s < 60; s++) {
    const { cards, padded } = pickCards(pool, `salt-${s}`, [], ROUTE_MIX.state);
    assert.equal(cards.length, ROUTE_CARDS);
    assert.deepEqual(padded, []);
    assert.ok(cards.filter(isScam).length <= 2, `salt-${s}: at most two scam cards`);
    assert.ok(
      cards.some((q) => q.govt === 'TMC' && q.kind === 'scheme'),
      `salt-${s}: a TMC scheme`,
    );
    assert.ok(
      cards.some((q) => q.govt === 'BJP' && !isScam(q)),
      `salt-${s}: a BJP card`,
    );
    assert.deepEqual(levels(cards), [2, 2, 2], `salt-${s}: two per difficulty`);
  }
});

test('a government with no scam cards on file needs only a clean card; one with no scheme takes any clean card', () => {
  serial = 0;
  const pool = [
    ...many(6, { state: 'UP', govt: 'BJP', kind: 'scheme' }),
    ...many(2, { state: 'UP', govt: 'BJP', kind: 'scam' }),
    ...many(3, { state: 'UP', govt: 'BSP', kind: 'spend' }), // no scams: any clean card
    ...many(3, { state: 'UP', govt: 'SP', kind: 'scam' }),
    ...many(1, { state: 'UP', govt: 'SP', kind: 'institution' }), // scams but no scheme: its one clean card
    ...many(3, { state: 'UP', govt: 'RJD', kind: 'scam' }), // nothing clean: cannot be owed
  ];
  for (let s = 0; s < 60; s++) {
    const { cards } = pickCards(pool, `salt-${s}`, [], ROUTE_MIX.state);
    assert.ok(cards.filter(isScam).length <= 2);
    assert.ok(cards.some((q) => q.govt === 'BJP' && q.kind === 'scheme'));
    assert.ok(cards.some((q) => q.govt === 'BSP'));
    assert.ok(cards.some((q) => q.govt === 'SP' && q.kind === 'institution'));
  }
});

test('when the rules cannot all hold, governments give way before the difficulty ladder, smallest share first', () => {
  serial = 0;
  // Only extremes are clean for B, C and D, and two extremes fit a 2/2/2 run: one of them must go.
  const pool = [
    ...many(2, { state: 'KA', govt: 'A', difficulty: 'simple' }),
    ...many(2, { state: 'KA', govt: 'A', difficulty: 'expert' }),
    ...['B', 'C', 'D'].flatMap((govt) => [
      item({ state: 'KA', govt, kind: 'scam', difficulty: 'simple' }),
      item({ state: 'KA', govt, kind: 'scam', difficulty: 'expert' }),
      item({ state: 'KA', govt, kind: 'spend', difficulty: 'extreme' }),
    ]),
  ];
  for (let s = 0; s < 30; s++) {
    const { cards } = pickCards(pool, `salt-${s}`, [], ROUTE_MIX.state);
    assert.deepEqual(levels(cards), [2, 2, 2], 'the ladder holds');
    assert.ok(cards.filter(isScam).length <= 2);
    const shown = new Set(cards.filter((q) => !isScam(q)).map((q) => q.govt));
    assert.ok(shown.has('A') && shown.has('B') && shown.has('C'), 'A (largest), then B and C by name');
    assert.ok(!shown.has('D'), 'D, last of the three-item governments, gives way');
  }
});

test('a state short of clean cards takes up to two from the Centre instead of a third scam, and says so', () => {
  serial = 0;
  const bank = [
    ...many(4, { state: 'GA', topic: 'Infrastructure', kind: 'scam', govt: 'BJP' }),
    ...many(2, { state: 'GA', topic: 'Infrastructure', kind: 'spend', govt: 'BJP' }),
    ...many(1, { topic: 'Infrastructure', kind: 'scam', govt: 'NDA' }), // a Centre scam: never the top-up here
    ...many(3, { topic: 'Infrastructure', kind: 'scheme', govt: 'NDA' }),
    ...many(3, { topic: 'Health', kind: 'scheme', govt: 'NDA' }),
  ];
  const goa = deriveRoutes(bank).find((r) => r.id === 'state-ga');
  const cards = cardsOf(goa, new Map(bank.map((q) => [q.id, q])));
  assert.equal(cards.length, ROUTE_CARDS);
  assert.equal(cards.filter(isScam).length, 2, 'two scam cards, not four');
  assert.equal(goa.ownCount, 4);
  assert.equal(goa.padded.length, 2);
  assert.ok(
    goa.padded.every((id) => {
      const q = bank.find((b) => b.id === id);
      return q.state === 'IN' && q.topic === 'Infrastructure' && !isScam(q);
    }),
    'clean Centre items in the state’s own sectors first',
  );
  assert.match(goa.subtitle, /4 receipts from Goa, 2 from the Centre/);
  // Without the mix the same bank deals all six from Goa: the top-up is only the cap's doing.
  assert.equal(deriveRoutes(bank, { mix: null }).find((r) => r.id === 'state-ga').padded.length, 0);
});

test('the Centre never supplies more than two cards; with nothing clean to give, the cap yields and the route stays', () => {
  serial = 0;
  const allScams = [
    ...many(6, { state: 'SK', kind: 'scam', govt: 'SKM' }),
    ...many(6, { kind: 'scheme', govt: 'NDA' }),
  ];
  const sk = deriveRoutes(allScams).find((r) => r.id === 'state-sk');
  assert.equal(sk.ownCount, 4, 'a state route is at least four of its own cards');
  assert.equal(sk.padded.length, 2);
  // A four-item state whose Centre has only scam cards to lend keeps its route, as it did before F2.
  serial = 0;
  const thin = [
    ...many(4, { state: 'TR', kind: 'scam', govt: 'BJP' }),
    ...many(3, { kind: 'scam', govt: 'NDA' }),
  ];
  const before = deriveRoutes(thin, { mix: null }).map((r) => r.id);
  assert.deepEqual(
    deriveRoutes(thin).map((r) => r.id),
    before,
  );
  assert.ok(before.includes('state-tr'));
  assert.equal(deriveRoutes(thin).find((r) => r.id === 'state-tr').ids.length, ROUTE_CARDS);
});

test('sector routes: the same cap, going over it only when the file has too few other cards', () => {
  serial = 0;
  const capped = [
    ...many(8, { topic: 'Defence & Security', kind: 'scam', govt: 'NDA' }),
    ...many(6, { topic: 'Defence & Security', kind: 'spend', govt: 'NDA' }),
  ];
  const defence = deriveRoutes(capped).find((r) => r.id === 'sector-defence-security');
  const bank = new Map(capped.map((q) => [q.id, q]));
  assert.equal(cardsOf(defence, bank).filter(isScam).length, 2);
  assert.deepEqual(defence.padded, [], 'a sector route is never topped up');
  serial = 0;
  const thin = [
    ...many(5, { topic: 'Health', kind: 'scam', govt: 'AAP' }),
    ...many(1, { topic: 'Health', kind: 'scheme', govt: 'AAP' }),
  ];
  const health = deriveRoutes(thin).find((r) => r.id === 'sector-health');
  assert.equal(
    cardsOf(health, new Map(thin.map((q) => [q.id, q]))).filter(isScam).length,
    5,
    'six cards need five of them',
  );
  assert.ok(
    !('govtMin' in ROUTE_MIX.sector),
    'a sector route owes no government a card: that rule is the state routes’',
  );
});
