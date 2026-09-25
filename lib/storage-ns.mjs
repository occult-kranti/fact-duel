/**
 * lib/storage-ns.mjs — the namespace every browser storage name is built from.
 *
 * Two builds can share one origin (GitHub Pages serves JHK at /fact-duel/ and the HISAAB DO edition
 * at /fact-duel/hisaab/ from the same host), and IndexedDB, localStorage and BroadcastChannel are
 * scoped to the ORIGIN, not the path. So every name the engine stores under is derived from these
 * two prefixes in lib/storage-names.mjs, and an edition build aliases this one file to its own
 * (editions/hisaab/storage-ns.mjs). JHK resolves it here, where the values are the historical ones,
 * so every JHK name stays byte-identical to what shipped before this file existed.
 *
 * Dependency-free and pure: importable from the client, the static build and node tests alike.
 */
export const STORAGE_NS = Object.freeze({
  /** Prefix of the long names: IndexedDB databases, BroadcastChannels and most localStorage keys. */
  long: 'fact-duel',
  /** Prefix of the short names: the guest principal, locale, profile gate and scene flags. */
  short: 'fd',
});
