import { useEffect, useRef } from 'react';
import { CheckIcon, RtxMark } from '../icons';

/**
 * The auth page's right half: a miniature of the dashboard you are signing in
 * to reach, playing the same story as the site's third how-to-buy scene — the
 * balance counts up, the allocation turns claimable, Claim is pressed.
 *
 * Adapted rather than ported. That scene is an HTML string scaled into a fixed
 * 774x440 canvas so it can sit inside a card; here the panel owns its width, so
 * this is real markup on the dashboard's own tokens and type scale, and it
 * reflows instead of being letterboxed.
 *
 * One rAF drives everything by writing CSS variables and text to refs. Nothing
 * here re-renders React, so a 12s loop costs no reconciliation.
 */
const LOOP_MS = 12000;
const BALANCE = 18_420;

/** Where each beat starts, as a fraction of the loop. */
const BEAT = { count: 0.04, ladder: 0.3, claimable: 0.54, press: 0.7, hold: 0.84 };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
/** Cubic ease-out: fast off the mark, settles rather than stops. */
const ease = (t: number) => 1 - (1 - t) ** 3;
const between = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export function PresaleScene() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    // Someone who asked for no motion gets the story's outcome, not its middle.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--fill', '1');
      el.style.setProperty('--claimable', '1');
      el.style.setProperty('--pressed', '1');
      if (count.current) count.current.textContent = BALANCE.toLocaleString('en-US');
      return;
    }

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const t = ((now - start) % LOOP_MS) / LOOP_MS;

      const counting = ease(between(t, BEAT.count, BEAT.ladder));
      if (count.current) {
        count.current.textContent = Math.round(BALANCE * counting).toLocaleString('en-US');
      }
      el.style.setProperty('--fill', String(ease(between(t, BEAT.ladder, BEAT.claimable))));
      el.style.setProperty('--claimable', String(between(t, BEAT.claimable, BEAT.press)));
      el.style.setProperty('--pressed', String(between(t, BEAT.press, BEAT.hold)));

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="scene" ref={root} aria-hidden="true">
      <div className="scene__glow" />

      <article className="scene__card scene__card--balance">
        <p className="scene__label">Your balance</p>
        <p className="scene__figure">
          <span ref={count}>0</span>
          <span className="scene__suffix">$RTX</span>
        </p>
        <p className="scene__note">Stage 12 · unlocks in full at listing</p>
        <RtxMark className="scene__mark" />
      </article>

      <article className="scene__card scene__card--ladder">
        <div className="scene__row">
          <p className="scene__label">Stage 12 sold</p>
          <p className="scene__pct">76.5%</p>
        </div>
        <ol className="scene__bars">
          {Array.from({ length: 9 }, (_, i) => (
            <li key={i} style={{ '--i': i, '--h': `${34 + i * 6}px` } as React.CSSProperties} />
          ))}
        </ol>
      </article>

      <article className="scene__card scene__card--claim">
        <span className="scene__claim-l">
          <b>Stage 12 allocation</b>
          <small>18,420 RTX · 0.50 ETH</small>
        </span>
        <span className="scene__claim-r">
          <span className="scene__status">
            <span className="scene__status-a">Pending</span>
            <span className="scene__status-b">Claimable</span>
          </span>
          <span className="scene__btn">
            <span className="scene__btn-a">Claim</span>
            <span className="scene__btn-b">
              <CheckIcon className="icon-16" />
              Claimed
            </span>
          </span>
        </span>
      </article>
    </div>
  );
}
