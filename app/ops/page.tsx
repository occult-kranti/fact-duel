import type { Metadata } from 'next';
import { OpsDashboard } from './dashboard';

export const metadata: Metadata = {
  title: 'Ops — Jaanta Hai Kya',
  description: 'Founder-only live stats: traffic, search, ad revenue and the game’s own counters.',
  robots: { index: false, follow: false },
};

/**
 * `/ops` — the founder dashboard as its own address.
 *
 * Unlike `/analytics`, this is NOT a tab of the game shell: it is a separate, token-gated page
 * with its own stylesheet, so nothing here is reachable from the game's navigation and none of its
 * code ships in the player bundle. The static GitHub Pages build only bundles `static/main.tsx`,
 * so this route exists on the Worker deployment alone.
 */
export default function OpsPage() {
  return <OpsDashboard />;
}
