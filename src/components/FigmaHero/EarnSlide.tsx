import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../theme';
import posterUrl from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wdth-normal.woff2?url';
import './EarnSlide.css';

/**
 * The hero's fourth slide: RTX Earn is looking for testers.
 *
 * One scene, played as a test session on the real product. At the back is the Remittix presale
 * dashboard in a window, captured from production (rtxdash.vercel.app at 1200 × 860, 1.25x, in each
 * theme) together with three of its own states — an amount picked, card payment chosen, the promo
 * code copied — so when the session touches the dashboard, the dashboard answers with its own UI
 * rather than with something drawn to look like it.
 *
 * In front of it, the offer, built on Kong's bento (bentogrids.com, "Bento design at Kong") one to
 * one in form: its lime "PARTNER UP! 50% REV SHARE" card becomes the early-access card — a heavy
 * condensed 17.4% FIXED APY, and the pools running past in reels where Kong runs its partners — its
 * violet "STAKE EASY, EARN STEADY." card becomes the perks with their icon tiles and pills, and its
 * "213" starburst becomes the tester seats left.
 *
 * Every movement has a cause. The pointer picks $500, switches to card and copies the promo code,
 * the dashboard answering each time; then it takes the open seat in the testers row, a tester
 * joins, and the sticker's count turns down by one. The board clears and the next tester starts.
 * Only the reels run on a clock of their own, as Kong's do.
 *
 * The markup is the resting picture, so a reader with reduced motion gets all of it standing still;
 * the animation sets its own start state and puts the markup back when the slide is left.
 */

const APY = '17.4';
const SEATS = 213;
const TESTERS = ['AK', 'MJ', 'LS'] as const;
/** The pools, in reels: Kong sets its partners' marks between bolts and squiggles. */
const REELS = [
  ['USDC', 'bolt', 'Maple', 'mark', 'Morpho', 'bolt'],
  ['Aave v3', 'wave', 'Fluid', 'mark', 'USDT', 'wave'],
  ['Spark', 'bolt', 'ETH', 'mark', 'Remittix', 'bolt'],
] as const;
const PERKS = [
  { name: 'Fixed terms', glyph: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z' },
  { name: 'Live APY', glyph: 'M3 13h4l3-7 4 12 3-5h4' },
  { name: '24h settlement', glyph: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2' },
] as const;

/** Kong's starburst: fourteen points, no two quite the same length. */
const STAR = (() => {
  const reach = [50, 44, 48, 41, 50, 46, 43, 49, 45, 50, 42, 47, 44, 49];
  return Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 34 : reach[i / 2];
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
})();

/* Kong's display type is heavy and condensed; Bricolage Grotesque's width axis gives the slide its
   own, under its own name so it never meets the legacy heroes' copy of the family. It is fetched
   with the captures rather than with the page. */
let posterFace: Promise<unknown> | null = null;
const loadPosterFace = () =>
  (posterFace ??= new FontFace('Earn Poster', `url(${posterUrl}) format('woff2')`, { weight: '200 800', stretch: '75% 100%' })
    .load()
    .then((face) => document.fonts.add(face))
    .catch(() => undefined));

/** A figure whose digits turn like an odometer's: each one is a strip of 0–9 shown through a slot. */
function Odometer({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`el__odo${className ? ` ${className}` : ''}`}>
      {value.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="el__odoSlot">
            <span className="el__odoStrip" style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>
              {'0123456789'.split('').map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className="el__odoSep">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/** The reels' separators, Kong's bolt and squiggle, and the Remittix mark where Kong has its own. */
function Sep({ kind }: { kind: string }) {
  if (kind === 'mark') return <img className="el__reelMark" src="/figma/logo.svg" alt="" width={33} height={17} />;
  return (
    <svg className={`el__reelSep el__reelSep--${kind}`} viewBox="0 0 24 24" aria-hidden="true">
      {kind === 'bolt' ? <path d="M14.5 2 4 14h6.5L9 22l11-13h-6.8z" /> : <path d="M2 14l3.3-4 3.4 4 3.3-4 3.3 4 3.4-4 3.3 4" />}
    </svg>
  );
}

/** Where a strip rests in the markup: showing its digit. */
const settle = (odo: HTMLElement, value: string) => {
  const digits = value.replace(/\D/g, '');
  odo.querySelectorAll<HTMLElement>('.el__odoStrip').forEach((strip, i) => {
    strip.removeAttribute('style');
    strip.style.transform = `translateY(${-Number(digits[i]) * 10}%)`;
  });
};

export function EarnSlide({ active }: { active: boolean }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  /* The captures and the poster face are the heaviest things on the slide and nobody sees them
     before the fourth slide, so they are not requested with the page: they load the first time the
     slide is shown, or once the page has settled, whichever comes first. */
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (active) setLoad(true);
  }, [active]);
  useEffect(() => {
    const id = window.setTimeout(() => setLoad(true), 5000);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!load) return;
    void loadPosterFace();
  }, [load]);

  useEffect(() => {
    const root = ref.current;
    if (!active || !load || !root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const q = <T extends Element>(s: string) => root.querySelector<T>(s)!;
    const qa = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));
    const shots = qa<HTMLImageElement>('.el__shot');
    const apyOdo = q<HTMLElement>('.el__apy');
    const seatsOdo = q<HTMLElement>('.el__seatsLeft');

    let cancelled = false;
    let revert: (() => void) | null = null;

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    // The window waits for its pictures and the cards for their face, so nothing arrives half-drawn.
    Promise.all([import('gsap'), loadPosterFace(), ...shots.map((s) => s.decode().catch(() => undefined))]).then(([{ gsap }]) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const stage = q<HTMLElement>('.el');
        const win = q<HTMLElement>('.el__window');
        const access = q<HTMLElement>('.el__access');
        const perks = q<HTMLElement>('.el__perks');
        const sticker = q<HTMLElement>('.el__sticker');
        const pill = q<HTMLElement>('.el__testers');
        const amount = q<HTMLElement>('.el__patch--amount');
        const card = q<HTMLElement>('.el__patch--card');
        const copied = q<HTMLElement>('.el__patch--copied');
        const cursor = q<HTMLElement>('.el__cursor');
        const joiner = q<HTMLElement>('.el__seat--join');
        const open = q<HTMLElement>('.el__seat--open');
        /* The new tester's plate opens its own room in the row, so it is sized off a seated one. */
        const seated = qa<HTMLElement>('.el__seat');
        const seatWidth = () => parseFloat(getComputedStyle(seated[0]).width);
        const seatOverlap = () => parseFloat(getComputedStyle(seated[1]).marginLeft);
        let seats = SEATS;

        /* ---- The odometer: each digit turns to its new value, the right-hand ones last ----
           `y: 0` alongside the percentage clears the offset the markup starts each strip at, which
           GSAP reads in as pixels and would otherwise add to the turn. */
        const turn = (odo: HTMLElement, value: string, duration = 0.6) => {
          const strips = Array.from(odo.querySelectorAll<HTMLElement>('.el__odoStrip'));
          const digits = value.replace(/\D/g, '').split('');
          strips.forEach((strip, i) => {
            gsap.to(strip, { y: 0, yPercent: -Number(digits[i]) * 10, duration, ease: 'power3.out', delay: i * 0.05 });
          });
        };

        /* ---- Where things are, in the stage's own pixels (the stage is scaled on wide screens) ---- */
        const at = (el: Element, fx = 0.5, fy = 0.5) => {
          const s = stage.getBoundingClientRect();
          const k = s.width / stage.offsetWidth;
          const r = el.getBoundingClientRect();
          return { x: (r.left + r.width * fx - s.left) / k, y: (r.top + r.height * fy - s.top) / k };
        };
        /* The pointer travels as a hand does: across and down on different curves, so the path bends. */
        const travel = (tl: gsap.core.Timeline, to: { x: number; y: number }, t: number, duration: number) => {
          tl.to(cursor, { x: to.x, duration, ease: 'power2.inOut' }, t);
          tl.to(cursor, { y: to.y, duration, ease: 'power3.inOut' }, t);
        };
        const press = (tl: gsap.core.Timeline, t: number) => {
          tl.to(cursor, { scale: 0.86, duration: 0.08, ease: 'power2.in' }, t);
          tl.to(cursor, { scale: 1, duration: 0.22, ease: 'back.out(3)' }, t + 0.08);
        };
        /* A state of the dashboard comes in the way the app's own does: at once, with the briefest fade. */
        const show = (tl: gsap.core.Timeline, el: HTMLElement, t: number) => tl.to(el, { autoAlpha: 1, duration: 0.12, ease: 'power1.out' }, t);
        const park = () => ({ x: stage.offsetWidth * 0.9, y: stage.offsetHeight * 0.97 });
        /* The seat is taken in the testers row; on a phone, where that row is not drawn, on the sticker. */
        const seat = () => (open.offsetParent ? open : sticker);

        // The start of the story: the APY not yet counted, the next tester not yet seated, the pointer off stage.
        gsap.set(joiner, { width: 0, scale: 0.6, opacity: 0, marginLeft: 0 });
        gsap.set([amount, card, copied], { autoAlpha: 0 });
        gsap.set(cursor, { autoAlpha: 0, ...park() });
        apyOdo.querySelectorAll<HTMLElement>('.el__odoStrip').forEach((s) => gsap.set(s, { y: 0, yPercent: 0 }));

        // ---- Entry: the window settles, the cards land on it, nearest last, and the sticker is slapped on ----
        const entry = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => void session() });
        entry.from(win, { y: 14, opacity: 0, duration: 0.9 }, 0);
        entry.from(perks, { x: 18, opacity: 0, duration: 0.9 }, 0.22);
        entry.from(pill, { y: 12, opacity: 0, duration: 0.9 }, 0.3);
        entry.from(access, { y: 22, opacity: 0, duration: 1 }, 0.36);
        entry.add(() => turn(apyOdo, APY, 1.1), 0.55);
        entry.from(sticker, { scale: 1.5, opacity: 0, duration: 0.55, ease: 'back.out(2.4)' }, 1.05);

        // ---- The session ----
        const session = () => {
          const tl = gsap.timeline({ onComplete: session });

          tl.set(cursor, park(), 0);
          tl.to(cursor, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 0.05);

          // 1. Choose an amount: $500, and the field fills.
          travel(tl, at(q('.el__hit--amount')), 0, 1.0);
          press(tl, 1.05);
          show(tl, amount, 1.12);

          // 2. Pay by card: the tab moves and the field's currency turns to USD.
          travel(tl, at(q('.el__hit--card')), 1.55, 0.7);
          press(tl, 2.3);
          show(tl, card, 2.37);
          tl.set(amount, { autoAlpha: 0 }, 2.5);

          // 3. Copy promo code, across in the flash sale.
          travel(tl, at(q('.el__hit--copy')), 2.8, 0.85);
          press(tl, 3.7);
          show(tl, copied, 3.77);

          // 4. Take the open seat: a tester joins, and the seats left turn down by one.
          travel(tl, at(seat()), 4.15, 0.95);
          press(tl, 5.15);
          tl.to(joiner, { width: seatWidth(), marginLeft: seatOverlap(), duration: 0.45, ease: 'power3.out' }, 5.2);
          tl.to(joiner, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 5.3);
          tl.add(() => turn(seatsOdo, String((seats -= 1)), 0.7), 5.3);
          tl.fromTo(sticker, { scale: 1.12 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, 5.3);
          tl.to(cursor, { x: '+=36', y: '+=32', autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 5.75);

          // Hold on it, then clear the board — the dashboard included — for the next tester.
          tl.to([card, copied], { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 8.4);
          tl.to(joiner, { scale: 0.6, opacity: 0, duration: 0.25, ease: 'power2.in' }, 8.4);
          tl.to(joiner, { width: 0, marginLeft: 0, duration: 0.35, ease: 'power2.inOut' }, 8.6);
          tl.to({}, { duration: 0.6 }, 9.0);
        };
      }, root);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
      // The odometers were turned from callbacks, outside the context's record; put the resting figures back.
      settle(apyOdo, APY);
      settle(seatsOdo, String(SEATS));
    };
  }, [active, load]);

  return (
    <div ref={ref} className="earnSlide" aria-hidden="true">
      <div className="el">
        {/* ---- Far: the dashboard ---- */}
        <div className="el__window">
          <div className="el__bar">
            <span className="el__dots">
              <i />
              <i />
              <i />
            </span>
            <span className="el__address">Remittix Dashboard</span>
          </div>
          <div className="el__screen">
            {load && (
              <>
                <img className="el__shot" src={`/figma/earn/dash-base-${theme}.webp`} alt="" width={1200} height={860} decoding="async" />
                <img className="el__shot el__patch el__patch--amount" src={`/figma/earn/dash-amount-${theme}.webp`} alt="" decoding="async" />
                <img className="el__shot el__patch el__patch--card" src={`/figma/earn/dash-card-${theme}.webp`} alt="" decoding="async" />
                <img className="el__shot el__patch el__patch--copied" src={`/figma/earn/dash-copied-${theme}.webp`} alt="" decoding="async" />
              </>
            )}
            {/* Where the session's pointer goes, on the capture's own controls. */}
            <span className="el__hit el__hit--amount" />
            <span className="el__hit el__hit--card" />
            <span className="el__hit el__hit--copy" />
          </div>
        </div>

        {/* ---- Kong's violet card: the perks ---- */}
        <div className="el__perks">
          <b className="el__perksHead">
            Test early,
            <br />
            earn steady.
          </b>
          <p className="el__perksCopy">Real deposits, real yield, before anyone else.</p>
          <ul className="el__perkList">
            {PERKS.map((perk) => (
              <li key={perk.name}>
                <span className="el__perkIcon">
                  <svg viewBox="0 0 24 24">
                    <path d={perk.glyph} />
                  </svg>
                </span>
                <span className="el__perk">{perk.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="el__testers">
          <span className="el__seats">
            {TESTERS.map((initials, i) => (
              <span key={initials} className="el__seat" data-tone={i}>
                {initials}
              </span>
            ))}
            <span className="el__seat el__seat--join" data-tone={3}>
              DR
            </span>
            <span className="el__seat el__seat--open">+</span>
          </span>
          <span className="el__testersText">
            <b>Beta testers</b>
            Join the next run
          </span>
        </div>

        {/* ---- Kong's lime card: early access ---- */}
        <div className="el__access">
          <b className="el__accessHead">Early access!</b>
          <p className="el__accessCopy">Test RTX Earn before launch. Put stablecoins to work in fixed-term and live pools, and earn while you test.</p>
          <div className="el__deal">
            <span className="el__big">
              <Odometer value={APY} className="el__apy" />%
            </span>
            <span className="el__bigLabel">Fixed APY</span>
          </div>
          <div className="el__reels">
            {REELS.map((reel, i) => (
              <div key={i} className="el__reel" data-dir={i % 2 ? 'right' : 'left'}>
                {/* Twice over, so the strip can run half its length and start again unseen. */}
                <div className="el__reelTrack">
                  {[...reel, ...reel].map((item, j) =>
                    item === 'bolt' || item === 'wave' || item === 'mark' ? (
                      <Sep key={j} kind={item} />
                    ) : (
                      <span key={j} className="el__reelName" data-face={j % 3}>
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Kong's starburst: the seats left ---- */}
        <span className="el__sticker">
          <svg viewBox="-6 -6 112 112">
            <polygon points={STAR} />
          </svg>
          <span className="el__stickerNum">
            <Odometer value={String(SEATS)} className="el__seatsLeft" />
          </span>
          <span className="el__stickerLabel">Seats left</span>
        </span>

        <svg className="el__cursor" viewBox="0 0 16 20" aria-hidden="true">
          <path d="M1.5 1.5v14.2l3.7-3.5 2.6 6.1 2.6-1.1-2.6-6h5.3z" />
        </svg>
      </div>
    </div>
  );
}
