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
 * `load` plus an idle callback is not enough on its own: a quiet instant during
 * the entrance satisfies both, and the scene build lands on top of the sequence
 * it should stay out of. Waiting for the entrance to *finish* is too late: the
 * mark arrives seconds after everything else. So the host raises `motion:ready`
 * at the point where a stutter stops costing anything (see entrance.ts), and
 * that is what this waits for. `motion:done` is the fallback for a section that
 * does not raise the earlier beat, and the cap covers one whose motion never
 * ran at all.
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

/** The lined 3D Phorcast mark. Guarded by an idle load, a WebGL probe, reduced motion and a static fallback. */
export function HeroLogo({ hostRef, forceStatic = false, scroll = true, variant, placement, className = '' }: HeroLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('pending');
  const [epoch, setEpoch] = useState(0);
  // The treatment resolves its medium once, in `build` (additive light on a
  // dark ground, ink over paper; see treatments/lined.ts). Nothing re-reads it,
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

    // FETCHING the scene and BUILDING it are two different costs, split on
    // purpose. Only the BUILD has to wait for the entrance gate: compiling
    // shaders and building the geometry blocks the main thread long enough to
    // starve the entrance of frames. The fetch (a sizeable three.js module
    // graph) blocks nothing and can happen while the copy is still arriving.
    // So the warm-up starts one idle callback after load, usually before the
    // entrance has begun, and by the time the gate opens the modules are
    // already parsed and waiting. Fetching behind the gate would leave an
    // empty box for as long as the network takes.
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
    // finds no WebGL: with `Promise.all` that rejection would arrive the moment
    // the probe runs, and the static fallback would be swapped in immediately
    // instead of whenever this element's host says it is ready. Chaining keeps
    // the fallback swap on the host's gate (the FAQ's mark, whose host never
    // hears `motion:ready` or `motion:done`, waits for the 6s cap).
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
      })
      .catch((err) => {
        if (!(err instanceof NoWebGLError)) console.warn('[HeroLogo] failed to load, using static fallback', err);
        if (!cancelled) setMode('fallback');
      });

    return () => {
      cancelled = true;
      scene?.dispose();
      scene = null;
    };
  }, [hostRef, forceStatic, scroll, variant, placement, epoch, themeEpoch]);

  return (
    <div className={`heroLogo ${className}`} aria-hidden="true" data-mode={mode} data-variant={variant}>
      {mode === 'fallback' ? <img src={logoOutlineUrl} alt="" decoding="async" /> : <canvas ref={canvasRef} />}
    </div>
  );
}
