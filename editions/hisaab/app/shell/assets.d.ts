/**
 * shell/assets.d.ts — the few non-code modules the edition imports from script. Narrow on purpose:
 * no wildcard, so nothing changes for JHK's own type-check.
 */
declare module '@fontsource/kalam/400.css';
declare module '@fontsource-variable/akshar/files/akshar-latin-wght-normal.woff2?url' {
  const src: string;
  export default src;
}
declare module '@fontsource/mukta/files/mukta-latin-400-normal.woff2?url' {
  const src: string;
  export default src;
}
