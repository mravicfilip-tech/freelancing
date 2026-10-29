import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../theme';
import { EarnCards } from './EarnCards';
import { EARN_VARIANT } from './earnVariant';
import './EarnSlide.css';

/**
 * The hero's fourth slide: RTX Earn is looking for testers.
 *
 * One scene, played as a test session on the real product. At the back is the Remittix presale
 * dashboard in a window, captured from production (rtxdash.vercel.app at 1200 × 860, 1.25x, in each
 * theme) together with three of its own states — an amount picked, card payment chosen, the promo
 * code copied — so when the session touches the dashboard, the dashboard answers with its own UI
 * rather than with something drawn to look like it. The page runs on far below 860px, so it is
 * captured trimmed: the Buy card ends at its amount, the flash sale at its promo code (without its
 * paragraph), and nothing after that row is drawn, so the window's foot is the page's own margin
 * rather than a cut. In front of it lie two cards (EarnCards, in three versions picked with
 * `?earn=1|2|3`).
 *
 * Every movement has a cause. The pointer — a beta tester, named like Medusa's — picks $500,
 * switches to card and copies the promo code, the dashboard answering each time. Then it works the
 * cards: it opens the Remittix pool and the deposit runs down the wire to it (1), claims yield and
 * the claim lands in the activity (2), or pays out and a burst of payouts passes the whitelist on
 * its way to the wallet (3). A tester joins the row, the board clears, and the next tester starts.
 * In (3) the payouts also run on their own the whole time the slide is up, so the eye is drawn
 * to the circuit even between sessions.
 *
 * The markup is the resting picture, so a reader with reduced motion gets all of it standing still;
 * the animation sets its own start state and puts the markup back when the slide is left.
 */

const TESTERS = ['AK', 'MJ', 'LS'] as const;

export function EarnSlide({ active }: { active: boolean }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  /* The captures are the heaviest thing on the slide, so they mount the first time the slide is
     shown — at once, now that it opens the hero — or once the page has settled, whichever comes
     first. */
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
    /* The scene renders `data-entrance="pending"`, hidden in CSS, so the hero's first paint never
       shows its finished picture a beat before the entry takes it apart; the attribute is cleared
       in the frame the entry takes over — or at once, if there is no entry to wait for. */
    const reveal = () => void delete root.dataset.entrance;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }

    const q = <T extends Element>(s: string) => root.querySelector<T>(s)!;
    const qa = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));
    const shots = qa<HTMLImageElement>('.el__shot');

    let cancelled = false;
    let revert: (() => void) | null = null;

    // GSAP is only loaded when the slide is first shown, so it never delays the hero's first paint.
    // The window waits for its pictures, so it never arrives empty or swaps in a state half-loaded.
    Promise.all([import('gsap'), ...shots.map((s) => s.decode().catch(() => undefined))]).then(([{ gsap }]) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const stage = q<HTMLElement>('.el');
        const win = q<HTMLElement>('.el__window');
        const far = q<HTMLElement>('.ev-flow, .ev-menuCard, .ev-safe');
        const near = q<HTMLElement>('.ev-table, .ev-feed, .ev-term');
        const pill = q<HTMLElement>('.el__testers');
        const amount = q<HTMLElement>('.el__patch--amount');
        const card = q<HTMLElement>('.el__patch--card');
        const copied = q<HTMLElement>('.el__patch--copied');
        const cursor = q<HTMLElement>('.el__cursor');
        const joiner = q<HTMLElement>('.el__seat--join');
        /* The new tester's plate opens its own room in the row, so it is sized off a seated one. */
        const seated = qa<HTMLElement>('.el__seat');
        const seatWidth = () => parseFloat(getComputedStyle(seated[0]).width);
        const seatOverlap = () => parseFloat(getComputedStyle(seated[1]).marginLeft);

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
        const hover = (el: Element, on: boolean) => () => void el.toggleAttribute('data-hover', on);
        const park = () => ({ x: stage.offsetWidth * 0.9, y: stage.offsetHeight * 0.97 });

        /* ---- Safe payouts (3): the circuit draws in, then payouts run through it for as long as the
           slide is up — a stream of fine dashes on every trace (CSS), and every 1.6s a brighter run
           along one of the three ways through, sending a ring off the shield as it passes the
           whitelist and nudging the wallet as it lands. ---- */
        const safe =
          EARN_VARIANT === '3'
            ? (() => {
                const traces = qa<SVGPathElement>('.ev-traces path');
                const runs = qa<SVGPathElement>('.ev-comet[data-run]');
                const bursts = qa<SVGPathElement>('.ev-comet[data-burst]');
                const seal = q<HTMLElement>('.ev-seal');
                const ripple = q<HTMLElement>('.ev-ripple');
                const wallet = q<SVGElement>('.ev-orb--wallet .ev-icon');
                /* A run's dash starts just short of the path and ends just past it; it is over the
                   shield a little past half-way, and at the wallet near the end. */
                const run = (tl: gsap.core.Timeline, path: SVGPathElement, t: number, duration: number, marks: boolean) => {
                  tl.fromTo(path, { strokeDashoffset: 16, opacity: 1 }, { strokeDashoffset: -path.getTotalLength(), duration, ease: 'none' }, t);
                  tl.set(path, { opacity: 0 }, t + duration);
                  if (!marks) return;
                  tl.fromTo(ripple, { scale: 1, opacity: 0.5 }, { scale: 1.5, opacity: 0, duration: 0.8, ease: 'power2.out' }, t + duration * 0.55);
                  tl.fromTo(seal, { scale: 1 }, { scale: 1.3, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 }, t + duration * 0.55);
                  tl.fromTo(wallet, { scale: 1 }, { scale: 1.22, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, t + duration * 0.92);
                };
                return {
                  enter: (tl: gsap.core.Timeline, t: number) => {
                    // The traces draw from the pool out; the right-hand ones are written from the edge in.
                    traces.forEach((p) => {
                      const length = p.getTotalLength();
                      gsap.set(p, { strokeDasharray: length, strokeDashoffset: p.hasAttribute('data-back') ? -length : length });
                    });
                    tl.to(traces, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.04 }, t);
                    tl.set(traces, { clearProps: 'strokeDasharray,strokeDashoffset' }, t + 1.4);
                    tl.from('.ev-halo', { opacity: 0, duration: 0.8, ease: 'power1.out' }, t + 0.2);
                    tl.from(qa('.ev-orb'), { scale: 0.5, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.16 }, t + 0.1);
                    tl.from(seal, { scale: 0, duration: 0.5, ease: 'back.out(3)' }, t + 0.7);
                    tl.from('.ev-stream', { opacity: 0, duration: 0.6, ease: 'power1.out' }, t + 0.9);
                  },
                  loop: () => {
                    const tl = gsap.timeline({ repeat: -1 });
                    runs.forEach((p, i) => run(tl, p, i * 1.6, 1.3, true));
                    tl.to({}, { duration: 0.3 }, 4.5);
                  },
                  burst: (tl: gsap.core.Timeline, t: number) => bursts.forEach((p, i) => run(tl, p, t, 1.1, i === 0)),
                };
              })()
            : null;

        /* ---- What the pointer does on the cards, and how each card goes back for the next tester ---- */
        type Act = {
          target: Element;
          fx: number;
          start: () => void;
          play: (tl: gsap.core.Timeline, t: number) => void;
          clear: (tl: gsap.core.Timeline, t: number) => void;
        };
        const acts: Record<typeof EARN_VARIANT, () => Act> = {
          // 1. Open the Remittix pool: the deposit runs down the wire, and the pool's light comes on.
          '1': () => {
            const row = q('.ev-tableRow--ours');
            const pulse = q<HTMLElement>('.ev-pulse');
            const pool = q<HTMLElement>('.ev-node--pool');
            const dot = q<HTMLElement>('.ev-dot--pool');
            return {
              target: row,
              fx: 0.28,
              start: () => dot.setAttribute('data-off', ''),
              play: (tl, t) => {
                tl.add(hover(row, true), t - 0.1);
                tl.set(pulse, { opacity: 1, y: 0 }, t + 0.1);
                tl.to(pulse, { y: () => pool.offsetTop - pulse.offsetTop - pulse.offsetHeight / 2, duration: 0.7, ease: 'power2.inOut' }, t + 0.1);
                tl.to(pulse, { opacity: 0, duration: 0.15 }, t + 0.8);
                tl.add(() => dot.removeAttribute('data-off'), t + 0.8);
                tl.fromTo(dot, { scale: 0.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, t + 0.8);
              },
              clear: (tl, t) => {
                tl.add(hover(row, false), t);
                tl.add(() => dot.setAttribute('data-off', ''), t);
              },
            };
          },
          // 2. Claim yield from the menu: the claim opens in at the top of the activity.
          '2': () => {
            const item = q('.ev-act--claim');
            const fresh = q<HTMLElement>('.ev-event--new');
            const gap = () => parseFloat(getComputedStyle(q('.ev-event:not(.ev-event--new)')).paddingBottom);
            return {
              target: item,
              fx: 0.62,
              start: () => undefined,
              play: (tl, t) => {
                tl.add(hover(item, true), t - 0.1);
                tl.to(fresh, { height: 'auto', paddingBottom: gap, opacity: 1, duration: 0.6, ease: 'power3.out' }, t + 0.15);
                tl.from(fresh.firstElementChild, { y: -8, duration: 0.6, ease: 'power3.out' }, t + 0.15);
                tl.add(hover(item, false), t + 0.6);
              },
              clear: (tl, t) => {
                tl.to(fresh, { height: 0, paddingBottom: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' }, t);
              },
            };
          },
          // 3. Pay out from the pool: the payout runs to the shield, passes the whitelist, goes on to the wallet.
          // 3. Pay out from the pool: all three ways through fire at once, on top of the steady run.
          '3': () => ({
            target: q('.ev-orb--pool'),
            fx: 0.5,
            start: () => undefined,
            play: (tl, t) => safe!.burst(tl, t + 0.05),
            clear: () => undefined,
          }),
        };
        const act = acts[EARN_VARIANT]();

        // The start of the story: the next tester not yet seated, the pointer off stage.
        gsap.set(joiner, { width: 0, scale: 0.6, opacity: 0, marginLeft: 0 });
        gsap.set([amount, card, copied], { autoAlpha: 0 });
        gsap.set(cursor, { autoAlpha: 0, ...park() });
        act.start();

        // ---- Entry: the window settles, then the cards land on it, nearest last ----
        const entry = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => void session() });
        entry.from(win, { y: 14, opacity: 0, duration: 0.9 }, 0);
        entry.from(far, { x: 18, opacity: 0, duration: 0.9 }, 0.22);
        entry.from(pill, { y: 12, opacity: 0, duration: 0.9 }, 0.3);
        entry.from(near, { y: 22, opacity: 0, duration: 1 }, 0.36);
        if (EARN_VARIANT === '3') entry.from(qa('.ev-bars i'), { scaleY: 0, duration: 0.7, ease: 'power3.out', stagger: 0.03 }, 0.6);
        if (safe) {
          safe.enter(entry, 0.4);
          entry.add(() => safe.loop(), 1.6);
        }
        reveal();

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

          // 4. Off the dashboard and onto the cards.
          travel(tl, at(act.target, act.fx), 4.15, 0.95);
          press(tl, 5.15);
          act.play(tl, 5.2);

          // A tester joins the row, and the pointer leaves.
          tl.to(joiner, { width: seatWidth(), marginLeft: seatOverlap(), duration: 0.45, ease: 'power3.out' }, 6.5);
          tl.to(joiner, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 6.6);
          tl.to(cursor, { x: '+=36', y: '+=32', autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 6.7);

          // Hold on it, then clear the board — the dashboard and the cards included — for the next tester.
          tl.to([card, copied], { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 9.6);
          act.clear(tl, 9.6);
          tl.to(joiner, { scale: 0.6, opacity: 0, duration: 0.25, ease: 'power2.in' }, 9.6);
          tl.to(joiner, { width: 0, marginLeft: 0, duration: 0.35, ease: 'power2.inOut' }, 9.8);
          tl.to({}, { duration: 0.6 }, 10.2);
        };
      }, root);
      revert = () => ctx.revert();
    }, reveal);

    return () => {
      cancelled = true;
      revert?.();
      // The session set states outside GSAP's record; put the resting picture back.
      qa('[data-hover]').forEach((el) => el.removeAttribute('data-hover'));
      qa('[data-off]').forEach((el) => el.removeAttribute('data-off'));
    };
  }, [active, load]);

  return (
    <div ref={ref} className="earnSlide" data-entrance="pending" aria-hidden="true">
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

        {/* ---- Near: the cards ---- */}
        <EarnCards variant={EARN_VARIANT} />

        {/* Medusa's named pointer. */}
        <span className="el__cursor">
          <svg viewBox="0 0 16 20" aria-hidden="true">
            <path d="M1.5 1.5v14.2l3.7-3.5 2.6 6.1 2.6-1.1-2.6-6h5.3z" />
          </svg>
          <span className="el__cursorTag">Beta tester</span>
        </span>
      </div>
    </div>
  );
}
