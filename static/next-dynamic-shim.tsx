/**
 * static/next-dynamic-shim.tsx — `next/dynamic` for the static build.
 *
 * `components/three/lazy-scene.tsx` is the only Next-specific import in the client tree. It calls
 * `dynamic(importer, { ssr: false, loading })`, where `loading` is rendered while the chunk is in
 * flight and re-rendered with `{ error }` if the chunk fails. There is no server here, so `ssr` is
 * a no-op; the rest is React.lazy + Suspense plus an error boundary so a failed chunk shows the
 * calm skeleton instead of tearing down the screen.
 *
 * vite.config.static.ts aliases `next/dynamic` to this module.
 */
import { Component, lazy, Suspense, type ComponentType, type ReactNode } from 'react';

export interface DynamicLoadingProps {
  error?: Error | null;
  isLoading?: boolean;
  pastDelay?: boolean;
  retry?: () => void;
}

export interface DynamicOptions {
  /** Ignored: this build never server-renders. */
  ssr?: boolean;
  loading?: ComponentType<DynamicLoadingProps>;
}

type Loader<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

class ChunkBoundary extends Component<
  { fallback: (error: Error) => ReactNode; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

export default function dynamic<P extends object>(
  loader: Loader<P>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const Lazy = lazy(async () => {
    const loaded = (await loader()) as any;
    return { default: (loaded?.default ?? loaded) as ComponentType<any> };
  });
  const Loading = options.loading;
  const pending = Loading ? <Loading isLoading pastDelay error={null} retry={() => {}} /> : null;
  function DynamicComponent(props: P) {
    return (
      <ChunkBoundary fallback={(error) => (Loading ? <Loading error={error} isLoading={false} /> : null)}>
        <Suspense fallback={pending}>
          <Lazy {...(props as any)} />
        </Suspense>
      </ChunkBoundary>
    );
  }
  DynamicComponent.displayName = 'DynamicShim';
  return DynamicComponent;
}
