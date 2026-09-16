/**
 * Whether a given player, in a given place, at a given moment, may do a given money-shaped thing.
 *
 * This exists as a pure reducer over dated rows rather than as constants in the source because the
 * law it encodes moves faster than the release cycle. India prohibited every online money game —
 * skill included — with effect from 1 May 2026; US states are banning the buy-currency-and-stake
 * structure one legislature at a time. A build constant would mean a deploy per legislature, and a
 * deploy that someone has to remember. A dated row means the prohibition lands on its own date and
 * a new state ban is an INSERT.
 *
 * THE SHAPE OF THE ANSWER IS DELIBERATE. A decision is the AND of three terms, and only one of them
 * can ever say yes:
 *
 *   allow = ceiling(question) AND rule(question) AND flag(question)
 *
 * `ceiling` is compiled in and is the answer to "what has this codebase actually built" — cash-out
 * is false at every milestone, so no row and no flag can enable a withdrawal that does not exist.
 * `rule` is the dated row, and is the ONLY term that can permit. `flag` is the operator kill switch
 * and is deny-only by construction: `payments_master` can stop money moving in seconds without a
 * deploy, and can never start it moving. Three terms that can only subtract means the failure
 * direction of every bug in this file is refusal, which is the direction that does not produce an
 * enforcement action.
 *
 * Default-deny is structural, not a fallback value: when no row matches, `resolve` returns deny. The
 * reason an unknown region can still play is that a seeded wildcard row says so explicitly, not that
 * the resolver falls through to something permissive.
 */

/** The four things a player can ask to do. Order is ascending regulatory weight. */
export const QUESTIONS = Object.freeze(['play', 'paid_entry', 'purchase', 'cash_out']);

/**
 * What this codebase has actually built and is willing to permit, irrespective of any rule row.
 * `cash_out` is false and stays false: the ledger is structured so a withdrawal *could* exist, and
 * nothing implements one. A rule row that sets cash_out=1 is a mistake, and this line makes it an
 * inert mistake rather than a live one.
 */
export const CEILING = Object.freeze({ play: true, paid_entry: true, purchase: true, cash_out: false });

/** Questions that move real money, and which the master kill switch therefore gates. */
export const MONEY_QUESTIONS = Object.freeze(['paid_entry', 'purchase', 'cash_out']);

/** Every reason a decision can carry. A decision never carries free text. */
export const REASONS = Object.freeze([
  'allow',
  'no_rule_deny',
  'rule_deny',
  'flag_deny',
  'capability_unavailable',
  'unknown_question',
]);

const isMoney = (question) => MONEY_QUESTIONS.includes(question);

/**
 * `US-WA` is governed by, in order of preference, a `US-WA` row, a `US` row, then the `*` wildcard.
 * An unrecognisable region yields only the wildcard, which is why an absent `request.cf` — the
 * static build, and local development — lands on play-only rather than on nothing.
 */
export function ancestors(region) {
  const clean = String(region ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(clean)) return ['*'];
  const [country] = clean.split('-');
  return clean === country ? [country, '*'] : [clean, country, '*'];
}

/** `*` is 0, `US` is 1, `US-WA` is 2. Higher wins. */
export const specificity = (region) => (region === '*' ? 0 : String(region).includes('-') ? 2 : 1);

const covers = (rule, at) =>
  Number.isInteger(rule.effectiveFrom) &&
  at >= rule.effectiveFrom &&
  (rule.effectiveTo === null || rule.effectiveTo === undefined || at < rule.effectiveTo);

/**
 * The most specific rule in force for `region` at `at`, or null. Ties on specificity are broken by
 * the later `effectiveFrom`, so a successor row scheduled for a future date takes over from its
 * predecessor at exactly its own timestamp and not a millisecond earlier.
 */
export function selectRule(bundle, region, at) {
  const line = ancestors(region);
  let best = null;
  for (const rule of bundle.rules) {
    if (!line.includes(rule.region)) continue;
    if (!covers(rule, at)) continue;
    if (
      !best ||
      specificity(rule.region) > specificity(best.region) ||
      (specificity(rule.region) === specificity(best.region) && rule.effectiveFrom > best.effectiveFrom)
    ) {
      best = rule;
    }
  }
  return best;
}

/** A stable key order, so the same decision serialises to the same bytes on every runtime. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * FNV-1a over the canonical form. This is a FINGERPRINT, not a cryptographic commitment: it exists
 * so two decisions can be compared and deduplicated cheaply and identically on Workers and in Node,
 * and it would not survive someone trying to forge a collision. Nothing security-bearing may depend
 * on it. A tamper-evident record is the `policy_decisions` row, which is append-only in the
 * database, not this number.
 */
export function fingerprint(value) {
  const text = canonical(value);
  let hi = 0x811c9dc5;
  let lo = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    hi = Math.imul(hi ^ code, 0x01000193) >>> 0;
    lo = Math.imul(lo ^ ((code << 5) | (code >>> 3)), 0x01000193) >>> 0;
  }
  return `${hi.toString(16).padStart(8, '0')}${lo.toString(16).padStart(8, '0')}`;
}

/**
 * Resolve one question. Pure: the same bundle and the same subject always produce a byte-identical
 * decision, which is what lets the decision be recorded as evidence and re-derived later to show
 * which rules were in force for a player at the time they played.
 *
 * @param {{rulesVersion: string, rules: Array<object>, flags: Record<string,string>}} bundle
 * @param {{region: string, regionSource: string, question: string}} subject
 * @param {number} at epoch ms
 */
export function resolve(bundle, subject, at) {
  const question = String(subject?.question ?? '');
  const region = String(subject?.region ?? '').toUpperCase() || 'UNKNOWN';
  const regionSource = String(subject?.regionSource ?? 'unknown');
  const base = {
    question,
    region,
    regionSource,
    at,
    rulesVersion: bundle?.rulesVersion ?? 'none',
  };

  if (!QUESTIONS.includes(question)) return decision({ ...base, allow: false, reason: 'unknown_question' });

  // Term 1: has this codebase built the thing at all.
  if (!CEILING[question]) return decision({ ...base, allow: false, reason: 'capability_unavailable' });

  // Term 2: the dated row. The only term that can say yes.
  const rule = selectRule(bundle ?? { rules: [] }, region, at);
  if (!rule) return decision({ ...base, allow: false, reason: 'no_rule_deny' });
  const cite = {
    ruleRegion: rule.region,
    effectiveFrom: rule.effectiveFrom,
    citation: rule.citation ?? null,
    reviewedBy: rule.reviewedBy ?? null,
    reviewedAt: rule.reviewedAt ?? null,
  };
  if (!rule[question]) return decision({ ...base, ...cite, allow: false, reason: 'rule_deny' });

  // Term 3: the operator kill switch. Deny-only.
  if (isMoney(question) && String(bundle?.flags?.payments_master ?? 'off') !== 'on') {
    return decision({ ...base, ...cite, allow: false, reason: 'flag_deny' });
  }

  return decision({
    ...base,
    ...cite,
    allow: true,
    reason: 'allow',
    minAge: rule.minAge ?? 18,
    maxDailyPurchaseMinor: rule.maxDailyPurchaseMinor ?? null,
  });
}

function decision(fields) {
  const out = {
    allow: false,
    reason: 'no_rule_deny',
    ruleRegion: null,
    effectiveFrom: null,
    citation: null,
    reviewedBy: null,
    reviewedAt: null,
    minAge: null,
    maxDailyPurchaseMinor: null,
    ...fields,
  };
  return Object.freeze({ ...out, hash: fingerprint(out) });
}

/** Answer every question at once — what a client needs to render an honest screen. */
export function resolveAll(bundle, subject, at) {
  const out = {};
  for (const question of QUESTIONS) out[question] = resolve(bundle, { ...subject, question }, at);
  return Object.freeze(out);
}
