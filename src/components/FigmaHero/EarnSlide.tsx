import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../theme';
import './EarnSlide.css';

/**
 * The hero's fourth slide: RTX Earn is looking for testers.
 *
 * Built on Tenor's hero (tenor.finance) one to one in form — the same isometric plane, the same two
 * cards on it, the same slab edges, shadows, radii and type scale — carrying RTX Earn's content.
 * The plate behind them is the Remittix presale dashboard, captured from rtxdash.vercel.app in each
 * theme, where Tenor has a misted panel.
 *
 * Tenor's order book becomes the Remittix pool's rate card: its fixed terms above, with the chosen
 * one lit, and the other pools' live APY below. Tenor's borrow panel becomes the deposit card for
 * that chosen term. The figures are the Earn app's own (remittix-earn, `earn/pools.ts`).
 *
 * Motion is Tenor's too: the plane fades in and every bar grows to its depth, the rates arriving
 * after. Then only the live rows move — every few seconds a pool's rate ticks and its bar follows.
 * The fixed terms do not, because they are fixed.
 */

/** The Remittix pool's terms on USDC, longest first. The 12-month term is the one being deposited. */
const TERMS = [
  { term: '12 months', apy: 17.4, chosen: true },
  { term: '6 months', apy: 13.6 },
  { term: '3 months', apy: 8.8 },
  { term: '30 days', apy: 5.2 },
] as const;
/** The other pools on USDC, whose rate is live. */
const LIVE = [
  { name: 'Maple', apy: 5.9 },
  { name: 'Morpho', apy: 4.5 },
  { name: 'Fluid', apy: 4.1 },
] as const;
const DEPOSIT = 5000;
const CHOSEN = TERMS[0];

const pct = (n: number) => `${n.toFixed(1)}%`;
const usd = (n: number, digits = 0) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** Bar length as a share of the slot: the best rate on the card fills it. */
const depth = (apy: number) => Math.max(0.12, apy / CHOSEN.apy);

function UsdcMark() {
  return (
    <svg className="tn__coin" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" />
      <path
        className="tn__coinInk"
        d="M20.2 18.2c0-2.2-1.3-3-4-3.3-1.9-.3-2.3-.8-2.3-1.7s.7-1.5 1.9-1.5c1.1 0 1.8.4 2.1 1.4.1.2.2.3.4.3h1.1c.3 0 .5-.2.5-.5v-.1a3.3 3.3 0 0 0-3-2.8V8.7c0-.3-.2-.5-.5-.5h-1c-.3 0-.5.2-.5.5v1.3c-1.9.3-3.2 1.6-3.2 3.2 0 2.1 1.3 2.9 4 3.2 1.8.3 2.4.7 2.4 1.8 0 1-.9 1.7-2.1 1.7-1.6 0-2.2-.7-2.4-1.6-.1-.2-.3-.3-.5-.3h-1.1c-.3 0-.5.2-.5.5v.1c.3 1.6 1.3 2.7 3.4 3v1.3c0 .3.2.5.5.5h1c.3 0 .5-.2.5-.5v-1.3c1.9-.3 3.3-1.6 3.3-3.4z"
      />
      <path className="tn__coinRing" d="M12.6 24.4c-4.6-1.6-7-6.7-5.3-11.3.9-2.5 2.8-4.4 5.3-5.3.2-.1.4-.3.4-.6v-1c0-.2-.1-.4-.4-.4h-.1C6.9 7.5 3.8 13.5 5.5 19.1c1 3.3 3.6 5.9 7 7h.1c.2.1.4 0 .5-.3v-1c0-.2-.2-.4-.5-.4zM19.4 5.8c-.2-.1-.4 0-.5.3v1c0 .3.2.5.4.6 4.6 1.6 7 6.7 5.3 11.3-.9 2.5-2.8 4.4-5.3 5.3-.2.1-.4.3-.4.6v1c0 .2.1.4.4.4h.1c5.6-1.8 8.7-7.8 6.9-13.4-1-3.3-3.6-5.9-6.9-7.1z" />
    </svg>
  );
}

export function EarnSlide({ active }: { active: boolean }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  /* The capture is the heaviest thing on the slide and nobody sees it before the fourth slide, so it
     is not requested with the page: it mounts the first time the slide is shown, or once the page
     has settled, whichever comes first. */
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (active) setLoad(true);
  }, [active]);
  useEffect(() => {
    const id = window.setTimeout(() => setLoad(true), 5000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!active || !load || !root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const live = Array.from(root.querySelectorAll<HTMLElement>('.tn__row--live'));
    let cancelled = false;
    let revert: (() => void) | null = null;
    const plate = root.querySelector<HTMLImageElement>('.tn__shot');

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    Promise.all([import('gsap'), plate?.decode().catch(() => undefined)]).then(([{ gsap }]) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const q = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));

        // ---- Entry: the plate settles, the plane fades in, and every bar grows to its depth ----
        const entry = gsap.timeline({ onComplete: () => void tick() });
        entry.from('.tn__plate', { opacity: 0, y: 10, duration: 0.8, ease: 'power3.out' }, 0);
        entry.from('.tn__plane', { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.15);
        entry.from(q('.tn__bar'), { scaleX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.035 }, 0.3);
        entry.from(q('.tn__apy'), { opacity: 0, duration: 0.5, ease: 'power1.out', stagger: 0.035 }, 0.55);

        // ---- Live: every few seconds one pool's rate moves a little, and its bar with it ----
        const tick = () => {
          const row = live[Math.floor(Math.random() * live.length)];
          const base = Number(row.dataset.apy);
          const now = Math.round((base + rand(-0.25, 0.25)) * 10) / 10;
          const apy = row.querySelector<HTMLElement>('.tn__apy')!;
          gsap
            .timeline()
            .to(apy, { opacity: 0, y: -3, duration: 0.18, ease: 'power2.in' })
            .add(() => void (apy.textContent = pct(now)))
            .fromTo(apy, { y: 3 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
          gsap.to(row.querySelectorAll('.tn__bar'), { width: (i: number) => `${depth(now) * (i === 0 ? 100 : 34)}%`, duration: 0.9, ease: 'power3.inOut' });
          gsap.delayedCall(rand(2.2, 3.4), tick);
        };
      }, root);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
      // The live rows wrote their rates outside GSAP's control; put the design back.
      live.forEach((row) => {
        const apy = row.querySelector<HTMLElement>('.tn__apy');
        if (apy) apy.textContent = pct(Number(row.dataset.apy));
      });
    };
  }, [active, load]);

  const earn = (DEPOSIT * CHOSEN.apy) / 100;

  return (
    <div ref={ref} className="earnSlide" aria-hidden="true">
      <div className="tn">
        {/* ---- The plate: the dashboard, where Tenor has its misted panel ---- */}
        <div className="tn__plate">
          {load && <img className="tn__shot" src={`/figma/earn/dash-base-${theme}.webp`} alt="" width={1200} height={860} decoding="async" />}
          <span className="tn__mist" />
          <span className="tn__frame" />
        </div>

        {/* ---- The plane: both cards lie on it, the rate card to the right of the deposit card ---- */}
        <div className="tn__plane">
          <div className="tn__rig">
            <div className="tn__panel">
              <div className="tn__tabs">
                <span className="tn__tab tn__tab--on">Deposit</span>
                <span className="tn__tab">Withdraw</span>
              </div>
              <div className="tn__field">
                <span className="tn__k">You deposit</span>
                <span className="tn__v">
                  <span className="tn__num">{usd(DEPOSIT)}</span>
                  <span className="tn__chip">
                    <UsdcMark />
                    USDC
                  </span>
                </span>
              </div>
              <div className="tn__field">
                <span className="tn__k">You earn in {CHOSEN.term}</span>
                <span className="tn__v">
                  <span className="tn__num">{usd(earn, 2)}</span>
                  <span className="tn__chip">
                    <UsdcMark />
                    USDC
                  </span>
                </span>
              </div>
              <div className="tn__term">
                <span className="tn__k">Term</span>
                <span className="tn__d">{CHOSEN.term}</span>
                <span className="tn__r">
                  <span className="tn__rate">{pct(CHOSEN.apy)}</span>
                  <span className="tn__fx">Fixed APY</span>
                </span>
              </div>
              <span className="tn__cta">Deposit</span>
            </div>

            <div className="tn__book">
              <div className="tn__head">
                <UsdcMark />
                <span className="tn__mk">
                  <b>USDC</b>
                  <span className="tn__tm">
                    Remittix pool
                    <span className="tn__dd">on Base</span>
                  </span>
                </span>
              </div>
              <div className="tn__rows">
                {TERMS.map((t, i) => (
                  <div key={t.term} className={`tn__row tn__row--fixed${'chosen' in t ? ' tn__row--chosen' : ''}`} data-apy={t.apy}>
                    <span className="tn__slot">
                      <span className="tn__bar tn__bar--track" style={{ width: `${depth(t.apy) * 100}%` }} />
                      <span className="tn__bar tn__bar--fill" style={{ width: `${depth(t.apy) * 34}%` }} />
                      <span className="tn__label">{t.term}</span>
                      {i === TERMS.length - 1 && <span className="tn__badge">Fixed APY</span>}
                    </span>
                    <span className="tn__apy">{pct(t.apy)}</span>
                  </div>
                ))}
              </div>
              <div className="tn__sep" />
              <div className="tn__rows tn__rows--live">
                {LIVE.map((p, i) => (
                  <div key={p.name} className="tn__row tn__row--live" data-apy={p.apy}>
                    <span className="tn__slot">
                      <span className="tn__bar tn__bar--track" style={{ width: `${depth(p.apy) * 100}%` }} />
                      <span className="tn__bar tn__bar--fill" style={{ width: `${depth(p.apy) * 34}%` }} />
                      <span className="tn__label">{p.name}</span>
                      {i === 0 && <span className="tn__badge">Live APY</span>}
                    </span>
                    <span className="tn__apy">{pct(p.apy)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
