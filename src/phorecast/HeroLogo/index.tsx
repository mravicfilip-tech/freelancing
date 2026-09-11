import { useEffect, useRef, useState, type RefObject } from 'react';
import type { LogoScene, LogoLayout } from './LogoScene';
import logoOutlineUrl from '../assets/logo-outline.svg';
import './HeroLogo.css';

export interface HeroLogoProps {
  /** The hero section element: sizing, pointer tilt and scroll are all relative to it. */
  hostRef: RefObject<HTMLElement | null>;
  /** Force the static pose. */
  forceStatic?: boolean;
  /** Disable the ScrollTrigger turn/spread/fade. */
  scroll?: boolean;
}

type Mode = 'pending' | 'webgl' | 'fallback';

/** `?devtools` exposes the live scene on window for the checks in scripts/. */
const PARAMS = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const DEV_TOOLS = PARAMS.has('devtools');
type DevWindow = Window & { __heroLogo?: LogoScene; __heroLogoDisposed?: ReturnType<LogoScene['info']> };

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

function currentLayout(): LogoLayout {
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1279px)').matches) return 'tablet';
  return 'desktop';
}

/** The lined 3D Phorecast mark. Same guards as HeroPlanet: idle load, WebGL probe, reduced motion, static fallback. */
export function HeroLogo({ hostRef, forceStatic = false, scroll = true }: HeroLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('pending');
  const [epoch, setEpoch] = useState(0);

  // Remount the scene when a breakpoint flips (placement differs).
  useEffect(() => {
    const queries = [window.matchMedia('(max-width: 767px)'), window.matchMedia('(max-width: 1279px)')];
    const bump = () => setEpoch((e) => e + 1);
    queries.forEach((q) => q.addEventListener('change', bump));
    return () => queries.forEach((q) => q.removeEventListener('change', bump));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const reducedMotion = forceStatic || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // Three.js + GSAP load on demand, after the page has loaded and the main thread is idle.
    let scene: LogoScene | null = null;
    let cancelled = false;
    afterLoadAndIdle()
      .then(() => {
        if (!supportsWebGL()) throw new NoWebGLError();
        return import('./LogoScene');
      })
      .then((mod) => idle().then(() => mod))
      .then(({ LogoScene }) => {
        if (cancelled) return;
        try {
          scene = new LogoScene({ canvas, host, layout: currentLayout(), reducedMotion, touch, scroll });
        } catch (err) {
          console.warn('[HeroLogo] WebGL init failed, using static fallback', err);
          setMode('fallback');
          return;
        }
        setMode('webgl');
        const live = scene;
        live.ready.then(() => {
          if (!cancelled && DEV_TOOLS) (window as DevWindow).__heroLogo = live;
        });
      })
      .catch((err) => {
        if (!(err instanceof NoWebGLError)) console.warn('[HeroLogo] failed to load, using static fallback', err);
        if (!cancelled) setMode('fallback');
      });

    return () => {
      cancelled = true;
      scene?.dispose();
      if (DEV_TOOLS && scene) {
        (window as DevWindow).__heroLogoDisposed = scene.info();
        delete (window as DevWindow).__heroLogo;
      }
      scene = null;
    };
  }, [hostRef, forceStatic, scroll, epoch]);

  return (
    <div className="heroLogo" aria-hidden="true" data-mode={mode}>
      {mode === 'fallback' ? <img src={logoOutlineUrl} alt="" decoding="async" /> : <canvas ref={canvasRef} />}
    </div>
  );
}
