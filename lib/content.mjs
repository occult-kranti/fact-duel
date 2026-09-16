/**
 * Which content domains the product currently shows. One flag, read everywhere.
 *
 * The founder's decision of 16 September 2026: sports only. Science is HIDDEN, not deleted — the
 * question data, the expedition routes, the event calendar and every profile that already holds
 * science facts stay intact and valid, and the sanitisers keep accepting them. What changes is what
 * a player can see or start. That distinction matters: a profile that earned a Physics stamp last
 * month must still round-trip through `readProfile` byte-identically, and a science event in the
 * calendar must still parse, or a hidden domain would silently corrupt data it was never meant to
 * touch.
 *
 * Pure and dependency-free, importable from the server, the client and the static build alike, so
 * there is exactly one answer to "is this domain on?" and no surface can drift from it.
 */

export const ALL_DOMAINS = Object.freeze(['sports', 'science']);

/** The domains a player can see and play today. Change this list; nothing else. */
export const ENABLED_DOMAINS = Object.freeze(['sports']);

export const domainEnabled = (domain) => ENABLED_DOMAINS.includes(domain);

/** True when there is only one visible domain, in which case domain switchers are noise. */
export const SINGLE_DOMAIN = ENABLED_DOMAINS.length === 1;

/** Filter anything carrying a `.domain` down to the enabled set, preserving order and identity. */
export const enabledOnly = (list) => {
  const out = (list ?? []).filter((item) => domainEnabled(item?.domain));
  return out.length === (list ?? []).length ? list : out;
};

/**
 * The domain chips a screen may offer. An "all" option is only meaningful with two or more domains
 * to choose between; with one, the screen should render no switcher at all.
 */
export const DOMAIN_CHIPS = Object.freeze(
  SINGLE_DOMAIN
    ? ENABLED_DOMAINS.map((id) => ({ id, label: label(id) }))
    : [{ id: 'all', label: 'All' }, ...ENABLED_DOMAINS.map((id) => ({ id, label: label(id) }))],
);

function label(id) {
  return { sports: 'Sports', science: 'Science' }[id] ?? id;
}

/** The product's own one-line description of what it covers, for metadata and hero copy. */
export const SUBJECT_LINE = SINGLE_DOMAIN ? label(ENABLED_DOMAINS[0]).toUpperCase() : ENABLED_DOMAINS.map(label).join(' × ').toUpperCase();
