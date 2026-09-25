/**
 * editions/hisaab/main.tsx — SPA entry of the HISAAB DO edition build (vite.config.hisaab.ts).
 *
 * Mounts the placeholder dev shell (app/dev-shell.tsx) behind a dynamic import, so a failed chunk
 * shows a plain retry card instead of a blank page — the same rule static/main.tsx follows. The UI
 * lane replaces the dev shell with the real screens; this file only needs its import changed.
 */
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');
const root = createRoot(container);

void (async () => {
  try {
    const { DevShell } = await import('./app/dev-shell');
    root.render(<DevShell />);
  } catch {
    root.render(
      <main style={{ padding: '24px 16px', font: '16px/1.5 system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 8px' }}>HISAAB DO could not load.</h1>
        <p style={{ margin: '0 0 12px' }}>The connection dropped while the game was loading.</p>
        <button type="button" onClick={() => location.reload()} style={{ minHeight: 44, padding: '0 16px', fontSize: 16 }}>
          Try again
        </button>
      </main>,
    );
  }
})();
