/**
 * Turning `jurisdiction_rules` rows into the frozen bundle `policy-engine.mjs` resolves against.
 *
 * The validation here is deliberately hostile, because a malformed rule row is the one input that
 * could make the engine permissive by accident. A row missing a citation or a reviewer is REJECTED
 * rather than defaulted: the point of recording who reviewed a permission and against what authority
 * is that an unreviewed market cannot be enabled quietly, and a default would hand that back.
 *
 * `rulesVersion` is derived from the content of the accepted rows, so a decision recorded months ago
 * names the exact rule set that produced it and cannot be confused with a later one.
 */
import { fingerprint, QUESTIONS } from './policy-engine.mjs';

const REGION = /^(\*|[A-Z]{2}(-[A-Z0-9]{1,3})?)$/;
const bit = (v) => v === 1 || v === true || v === '1';
const int = (v) => (Number.isInteger(v) ? v : Number.isInteger(Number(v)) ? Number(v) : null);
const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * @returns {{rule: object|null, error: string|null}}
 */
export function readRule(row) {
  const region = text(row?.region)?.toUpperCase() ?? '';
  if (!REGION.test(region)) return { rule: null, error: `bad region: ${JSON.stringify(row?.region)}` };

  const effectiveFrom = int(row?.effectiveFrom ?? row?.effective_from);
  if (effectiveFrom === null) return { rule: null, error: `${region}: effective_from must be an integer` };

  const rawTo = row?.effectiveTo ?? row?.effective_to ?? null;
  const effectiveTo = rawTo === null || rawTo === undefined ? null : int(rawTo);
  if (rawTo !== null && rawTo !== undefined && effectiveTo === null) {
    return { rule: null, error: `${region}: effective_to must be an integer or null` };
  }
  if (effectiveTo !== null && effectiveTo <= effectiveFrom) {
    return { rule: null, error: `${region}: effective_to must be after effective_from` };
  }

  const citation = text(row?.citation);
  if (!citation) return { rule: null, error: `${region}: a rule must cite the authority it rests on` };
  const reviewedBy = text(row?.reviewedBy ?? row?.reviewed_by);
  if (!reviewedBy) return { rule: null, error: `${region}: a rule must name who reviewed it` };
  const reviewedAt = int(row?.reviewedAt ?? row?.reviewed_at);
  if (reviewedAt === null) return { rule: null, error: `${region}: reviewed_at must be an integer` };

  const rule = {
    region,
    effectiveFrom,
    effectiveTo,
    citation,
    reviewedBy,
    reviewedAt,
    minAge: int(row?.minAge ?? row?.min_age) ?? 18,
    maxDailyPurchaseMinor: int(row?.maxDailyPurchaseMinor ?? row?.max_daily_purchase_minor),
  };
  for (const q of QUESTIONS) rule[q] = bit(row?.[q] ?? row?.[q.replace(/_(\w)/g, (_, c) => c.toUpperCase())]);
  return { rule: Object.freeze(rule), error: null };
}

/**
 * Build a bundle, dropping rows that fail validation and reporting them. A caller that cares — the
 * ops health check does — can refuse to serve on a non-empty `errors`; the resolver itself simply
 * never sees a malformed row, which keeps default-deny intact whatever arrives from the database.
 */
export function buildBundle(rows, flags = {}) {
  const rules = [];
  const errors = [];
  for (const row of rows ?? []) {
    const { rule, error } = readRule(row);
    if (rule) rules.push(rule);
    else errors.push(error);
  }
  rules.sort((a, b) => a.region.localeCompare(b.region) || a.effectiveFrom - b.effectiveFrom);

  const cleanFlags = {};
  for (const [k, v] of Object.entries(flags ?? {})) cleanFlags[String(k)] = String(v);

  return Object.freeze({
    rulesVersion: fingerprint({ rules, flags: cleanFlags }),
    rules: Object.freeze(rules),
    flags: Object.freeze(cleanFlags),
    errors: Object.freeze(errors),
  });
}

/** The bundle a server with no database answer must use: nothing is permitted, including play. */
export const DENY_ALL = buildBundle([], { payments_master: 'off' });
