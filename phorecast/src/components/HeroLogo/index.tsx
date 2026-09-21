import { useEffect, useRef, useState, type RefObject } from 'react';
import { useThemeEpoch } from '../../lib/theme';
import type { LogoScene, LogoLayout, LogoPlacement } from './LogoScene';
import type { VariantId } from './variants';
import logoOutlineUrl from './logo-outline.svg';
import './HeroLogo.css';

export interface HeroLogoProps {
  /** The hero section element: sizing, pointer tilt and scroll are all relative to it. */
  hostRef: RefObject<HTMLElement | null>;
  /** Force the static pose. */
  forceStatic?: boolean;
  /** Disable the ScrollTrigger turn/spread/fade. */
  scroll?: boolean;
  /** Treatment of the mark (see ./variants.ts). */
  variant: VariantId;
  /** Place the mark explicitly instead of using the breakpoint layout. */
  placement?: LogoPlacement;
  /** Extra class on the wrapper, for per-section placement. */
  className?: string;
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

function afterLoad(): Promise<void> {
  return document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
}

/**
 * Resolves once the host section says it is safe to do expensive work, or after
 * `cap` either way.
 *
 * Waiting for `load` plus an idle callback was not enough on its own: a quiet
 * instant during the entrance satisfies both, and the scene landed squarely on
 * top of the sequence it was meant to stay out of. But waiting for the entrance
 * to *finish* was too far the other way -- the mark turned up seconds after
 * everything else had settled. Sections now mark the point where a stutter stops
 * costing anything, which is much earlier than the end, and that is what this
 * waits for. `motion:done` is the fallback for a section that does not raise the
 * earlier beat, and the cap covers one whose motion never ran at all.
 */
function afterHostEntrance(host: HTMLElement, cap = 6000): Promise<void> {
  if (host.dataset.motionDone) return Promise.resolve();
  return new Promise<void>((resolve) => {
    let timer = 0;
    const done = () => {
      window.clearTimeout(timer);
      host.removeEventListener('motion:ready', done);
      host.removeEventListener('motion:done', done);
      resolve();
    };
    timer = window.setTimeout(done, cap);
    host.addEventListener('motion:ready', done, { once: true });
    host.addEventListener('motion:done', done, { once: true });
  });
}

/** A short breath, taken twice: before the fetch, and after the gate. */
function shortIdle(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: 250 });
    } else {
      window.setTimeout(resolve, 60);
    }
  });
}

function currentLayout(): LogoLayout {
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1279px)').matches) return 'tablet';
  return 'desktop';
}

/** The lined 3D Phorcast mark. Same guards as HeroPlanet: idle load, WebGL probe, reduced motion, static fallback. */
export function HeroLogo({ hostRef, forceStatic = false, scroll = true, variant, placement, className = '' }: HeroLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('pending');
  const [epoch, setEpoch] = useState(0);
  // The treatment resolves its medium once, in `build` — additive light on a
  // dark ground, ink over paper (see treatments/lined.ts). Nothing re-reads it,
  // so a live switch has to arrive as a rebuild, exactly as `useSectionMotion`
  // rebuilds a section rather than re-theming a running timeline. The section
  // has already raised `motion:done` by then, so the gate in `afterHostEntrance`
  // is already open and the mark is back within an idle callback.
  const themeEpoch = useThemeEpoch();

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

    let scene: LogoScene | null = null;
    let cancelled = false;

    // FETCHING the scene and BUILDING it are two different costs and they were
    // being paid one after the other, both behind the entrance gate. Nothing --
    // not a byte of Three.js -- was even requested until the hero said its
    // headline had landed, and only then did a 165KB gzipped module graph go
    // over the wire. Measured at 390 wide: the first request left at 2560ms and
    // the mark's first frame was drawn at 2667ms, on localhost, where the
    // network is free. On a phone on mobile data the fetch is another second on
    // top of that, and the reader is looking at an empty box for all of it.
    //
    // Only the BUILD has to wait. Compiling shaders and building the geometry
    // blocks the main thread long enough to starve the entrance of frames --
    // that is what the gate is for, and it stays. The fetch blocks nothing: it
    // is the network, and it can happen while the copy is still arriving. So
    // the two are split. The warm-up starts one idle callback after load, which
    // in practice is before the entrance has begun, and by the time the gate
    // opens the modules are already parsed and waiting.
    //
    // The catch on `warm` is not decoration: it starts before anything is
    // waiting on it, so a rejection would otherwise be unhandled.
    const warm = afterLoad()
      .then(shortIdle)
      .then(() => {
        if (!supportsWebGL()) throw new NoWebGLError();
        return Promise.all([import('./LogoScene'), import('./treatments')] as const);
      });
    warm.catch(() => {});

    // The gate FIRST and the modules second, rather than both at once. The two
    // read the same when everything succeeds, and differently when the probe
    // finds no WebGL: with `Promise.all` that rejection arrives the moment the
    // probe runs, and the static fallback is swapped in immediately instead of
    // whenever this element's host says it is ready. That is a visible change
    // and not always for the better -- a second mark on this page is hosted by
    // an element that never hears `motion:ready` or `motion:done`, so its gate
    // runs to the 6s cap and the swap timing there moved by seconds. Chaining
    // leaves every decision exactly where it was and moves only the fetch.
    afterLoad()
      .then(() => afterHostEntrance(host))
      .then(shortIdle)
      .then(() => warm)
      .then(async ([mod, treatments]) => ({ mod, treatment: await treatments.loadTreatment(variant) }))
      .then(({ mod: { LogoScene }, treatment }) => {
        if (cancelled) return;
        try {
          scene = new LogoScene({
            canvas, host, layout: currentLayout(), reducedMotion, touch, scroll, variant, placement, treatment,
            // The device cannot draw it at a usable rate. The mark is
            // decorative; a static outline beats taking the page down with it.
            onTooSlow: () => {
              if (cancelled) return;
              console.info('[HeroLogo] frames over budget, falling back to the static mark');
              setMode('fallback');
              // Out of the tick that raised it before touching the renderer, and
              // after React has swapped the canvas out, so the context is
              // released rather than left alive on a detached element.
              window.setTimeout(() => { scene?.dispose(); scene = null; }, 0);
            },
          });
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
  }, [hostRef, forceStatic, scroll, variant, placement, epoch, themeEpoch]);

  return (
    <div className={`heroLogo ${className}`} aria-hidden="true" data-mode={mode} data-variant={variant}>
      {mode === 'fallback' ? <img src={logoOutlineUrl} alt="" decoding="async" /> : <canvas ref={canvasRef} />}
    </div>
  );
}
