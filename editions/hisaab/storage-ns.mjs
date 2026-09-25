/**
 * editions/hisaab/storage-ns.mjs — the edition's storage namespace.
 *
 * vite.config.hisaab.ts (and the node test hook, editions/hisaab/node-aliases.mjs) alias
 * lib/storage-ns.mjs to this file, so every IndexedDB database, localStorage key and BroadcastChannel
 * the shared engine names through lib/storage-names.mjs comes out as `hisaab-*` / `hd-*` here instead
 * of JHK's `fact-duel-*` / `fd-*`. Both sites live on one GitHub Pages origin; without this the two
 * games would read and overwrite each other's profile, wallet and settings.
 */
export const STORAGE_NS = Object.freeze({
  long: 'hisaab',
  short: 'hd',
});
