import { useEffect, useRef, useState, type RefObject } from 'react';
import type { PlanetScene, PlanetLayout } from './PlanetScene';
import './HeroPlanet.css';

export interface HeroPlanetProps {
  /** The hero section element: sizing, pointer parallax and scroll drift are all relative to it. */
  hostRef: RefObject<HTMLElement | null>;
  /** Force the static pose (used by the capture stage). */
  forceStatic?: boolean;
  /** Layout override; otherwise derived from the viewport width. */
  layout?: PlanetLayout;
  /** Disable the ScrollTrigger drift/fade. */
  scroll?: boolean;
}

type Mode = 'pending' | 'webgl' | 'fallback';

/** `?devtools` exposes the live scene on window for the leak / motion checks in scripts/. */
const PARAMS = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const DEV_TOOLS = PARAMS.has('devtools');
/** `?variant=ledger|core|network` previews a preset from ./variants.ts. */
const VARIANT = PARAMS.get('variant');
type DevWindow = Window & { __heroPlanet?: PlanetScene; __heroPlanetDisposed?: ReturnType<PlanetScene['info']> };

class NoWebGLError extends Error {}

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    // Release the probe context immediately so it does not count against the browser's limit.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function idle(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 800 });
    else window.setTimeout(resolve, 50);
  });
}

function afterLoadAndIdle(): Promise<void> {
  const loaded =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
  return loaded.then(idle);
}

function currentLayout(): PlanetLayout {
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1279px)').matches) return 'tablet';
  return 'desktop';
}

export function HeroPlanet({ hostRef, forceStatic = false, layout, scroll = true }: HeroPlanetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('pending');
  const [epoch, setEpoch] = useState(0);

  // Remount the scene when the mobile/desktop breakpoint flips (point counts differ).
  useEffect(() => {
    if (layout) return;
    const queries = [window.matchMedia('(max-width: 767px)'), window.matchMedia('(max-width: 1279px)')];
    const bump = () => setEpoch((e) => e + 1);
    queries.forEach((q) => q.addEventListener('change', bump));
    return () => queries.forEach((q) => q.removeEventListener('change', bump));
  }, [layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const reducedMotion = forceStatic || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // The Three.js + GSAP bundle is loaded on demand, after the page has loaded and the main
    // thread is idle, so it never competes with the hero's first paint.
    let scene: PlanetScene | null = null;
    let cancelled = false;
    afterLoadAndIdle()
      .then(() => {
        // Probe WebGL only now — creating a context inside the mount task would delay first paint.
        if (!supportsWebGL()) throw new NoWebGLError();
        return import('./PlanetScene');
      })
      // Module evaluation and scene construction are kept in separate tasks so neither becomes a long task.
      .then((mod) => idle().then(() => mod))
      .then(({ PlanetScene }) => {
        if (cancelled) return;
        try {
          scene = new PlanetScene({ canvas, host, layout: layout ?? currentLayout(), reducedMotion, touch, scroll, variant: VARIANT });
        } catch (err) {
          console.warn('[HeroPlanet] WebGL init failed, using static fallback', err);
          setMode('fallback');
          return;
        }
        setMode('webgl');
        const live = scene;
        live.ready.then(() => {
          if (!cancelled && DEV_TOOLS) (window as DevWindow).__heroPlanet = live;
        });
      })
      .catch((err) => {
        if (!(err instanceof NoWebGLError)) console.warn('[HeroPlanet] failed to load, using static fallback', err);
        if (!cancelled) setMode('fallback');
      });

    return () => {
      cancelled = true;
      scene?.dispose();
      if (DEV_TOOLS && scene) {
        (window as DevWindow).__heroPlanetDisposed = scene.info();
        delete (window as DevWindow).__heroPlanet;
      }
      scene = null;
    };
  }, [hostRef, forceStatic, layout, scroll, epoch]);

  return (
    <div className="heroPlanet" aria-hidden="true" data-mode={mode}>
      {mode === 'fallback' ? (
        <img src="/hero-planet-fallback.png" alt="" decoding="async" />
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
}
