'use client';
import dynamic from 'next/dynamic';
import type { ComponentType, CSSProperties, ReactNode } from 'react';

/** Props every scene wrapper (and every lazy wrapper) accepts. */
export interface LazySceneProps {
  /** Rendered when WebGL is unavailable, the scene throws, or the GL context is lost. */
  fallback?: ReactNode;
  /** Height of the scene box (a number is px). Each scene has its own default. */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

export const DEFAULT_SCENE_HEIGHT = 360;

export function cssSize(
  value: number | string | undefined,
  fallback: number | string = DEFAULT_SCENE_HEIGHT,
) {
  const v = value ?? fallback;
  return typeof v === 'number' ? `${v}px` : v;
}

const SKELETON_CSS = `@keyframes fd-scene-shimmer{0%{transform:translateX(-70%)}100%{transform:translateX(170%)}}
@keyframes fd-scene-breathe{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.08);opacity:.9}}
@media (prefers-reduced-motion:reduce){[data-scene-skeleton] *{animation:none!important}}`;

export interface SceneSkeletonProps {
  height?: number | string;
  /** Cover the parent box instead of reserving space. */
  overlay?: boolean;
  /** Fade out (kept in the DOM so the transition can run). */
  hidden?: boolean;
  /** Set when a lazy chunk failed to load; the shimmer stops. */
  error?: Error | null;
  /** Calm, non-animated variant used as the last-resort fallback. */
  quiet?: boolean;
}

/** Midnight placeholder shown while a scene chunk loads or before its first frame. */
export function SceneSkeleton({ height, overlay, hidden, error, quiet }: SceneSkeletonProps) {
  const still = quiet || !!error;
  return (
    <div
      data-scene-skeleton=""
      aria-hidden="true"
      style={{
        position: overlay ? 'absolute' : 'relative',
        inset: overlay ? 0 : undefined,
        width: '100%',
        height: overlay ? undefined : height !== undefined ? cssSize(height) : 'var(--fd-scene-h, 360px)',
        overflow: 'hidden',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 60% 55% at 50% 52%, rgba(78,225,255,0.10), rgba(11,15,20,0) 70%)',
        opacity: hidden ? 0 : 1,
        visibility: hidden ? 'hidden' : 'visible',
        transition: 'opacity 420ms ease, visibility 0s linear 420ms',
      }}
    >
      <style href="fd-scene-skeleton" precedence="default">
        {SKELETON_CSS}
      </style>
      {!still && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, transparent 25%, rgba(212,255,58,0.07) 50%, transparent 75%)',
            animation: 'fd-scene-shimmer 2.4s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 112,
          height: 112,
          marginLeft: -56,
          marginTop: -56,
          borderRadius: '50%',
          border: '1px solid rgba(212,255,58,0.28)',
          boxShadow: 'inset 0 0 48px rgba(212,255,58,0.10), 0 0 56px rgba(78,225,255,0.12)',
          animation: still ? undefined : 'fd-scene-breathe 2.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/**
 * `next/dynamic(importer, { ssr: false, loading })` for a scene module whose
 * default export is a full scene (already wrapped in `SceneFrame`). The
 * returned component accepts the scene's props plus `fallback`, and forwards
 * the requested height to the loading skeleton through a CSS variable so the
 * page does not jump when the chunk arrives.
 */
export function lazyScene<P extends LazySceneProps>(
  importer: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> {
  const Dynamic = dynamic<P>(importer, {
    ssr: false,
    loading: ({ error }) => <SceneSkeleton error={error ?? null} />,
  });
  function LazySceneComponent(props: P) {
    return (
      <div style={{ display: 'contents', '--fd-scene-h': cssSize(props.height) } as CSSProperties}>
        <Dynamic {...props} />
      </div>
    );
  }
  LazySceneComponent.displayName = 'LazyScene';
  return LazySceneComponent;
}
