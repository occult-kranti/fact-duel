/**
 * components/fx/fx-canvas.tsx — the fixed, full-viewport canvas the particle engine draws on.
 *
 * Rendered by `<FxProvider>` once mounted on the client. `elevated` lifts it above the ceremony
 * backdrop (but below the ceremony card) so confetti rains over the dimmed page.
 */
'use client';
import { useEffect, useRef } from 'react';
import { particles } from '@/lib/fx/particles';

export interface FxCanvasProps {
  elevated?: boolean;
}

export function FxCanvas({ elevated = false }: FxCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    particles.attach(canvas);
    return () => particles.detach();
  }, []);
  return (
    <canvas
      ref={ref}
      className="fx-canvas"
      data-elevated={elevated ? 'true' : undefined}
      aria-hidden="true"
    />
  );
}
