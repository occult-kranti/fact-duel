/**
 * The reconciler: replays every posted transaction through the pure invariants and compares the
 * result with the cached heads the store keeps for fast reads.
 *
 * A ledger fails silently. A wrong cached balance does not throw, it just pays someone the wrong
 * amount, and a stranded escrow is a match that quietly ate its entries. So this runs on a schedule
 * (an `/api/ops` kind driven by `.github/workflows/sweep.yml`) and its report is the evidence — it
 * is not a correctness component, because no money invariant may depend on a job that might not
 * run. The constraints in the schema are the guarantee; this is how a human finds out they held.
 */
import { check, openEscrows, issued, outstandingLiability } from '../ledger/invariants.mjs';

const PAGE = 500;

/** Pull every transaction the store holds, in posting order, in pages. */
export async function scanAll(store, { page = PAGE, max = 100_000 } = {}) {
  const out = [];
  for (let offset = 0; offset < max; offset += page) {
    const batch = await store.scan({ limit: page, offset });
    out.push(...batch);
    if (batch.length < page) break;
  }
  return out;
}

/**
 * @returns {{ok: boolean, transactions: number, violations: Array<object>, drift: Array<object>, openEscrows: Array<object>, issued: number, outstandingLiability: number}}
 */
export async function reconcile(store, options = {}) {
  const transactions = await scanAll(store, options);
  const result = check(transactions);
  const heads = await store.heads();

  // The cached head of every account must equal what the entries replay to; and every entry
  // sequence must be dense (1..n) with the head pointing at n, or a post wrote entries the cache
  // does not reflect.
  const drift = [];
  const seqs = new Map();
  for (const tx of transactions) {
    for (const entry of tx.entries) {
      const list = seqs.get(entry.account) ?? [];
      list.push(entry.seq);
      seqs.set(entry.account, list);
    }
  }
  const accounts = new Set([...result.balances.keys(), ...heads.keys()]);
  for (const account of accounts) {
    const replayed = result.balances.get(account) ?? 0;
    const head = heads.get(account) ?? { balance: 0, entrySeq: 0 };
    if (head.balance !== replayed) drift.push({ account, rule: 'cached_balance', cached: head.balance, replayed });
    const list = (seqs.get(account) ?? []).sort((a, b) => a - b);
    const dense = list.every((s, i) => s === i + 1);
    if (!dense) drift.push({ account, rule: 'dense_sequence', seqs: list });
    if (head.entrySeq !== list.length) drift.push({ account, rule: 'head_sequence', cached: head.entrySeq, entries: list.length });
  }

  return {
    ok: result.ok && drift.length === 0,
    transactions: transactions.length,
    violations: result.violations,
    drift,
    openEscrows: openEscrows(result.balances),
    issued: issued(result.balances),
    outstandingLiability: outstandingLiability(result.balances),
    perLedger: result.perLedger,
  };
}
