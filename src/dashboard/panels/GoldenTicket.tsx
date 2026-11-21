import { useEffect, useRef } from 'react';
import { GOLDEN_TICKET } from '../data';
import { BonusChips, GoldenTicket as Ticket } from '../goldenTicket/GoldenTicket';
import type { Electric } from '../goldenTicket/electric';
import { mint, settle } from '../goldenTicket/goldenMotion';

/** A tick on a gold disc. */
function Tick() {
  return (
    <svg className="gold__tick" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" />
      <path d="M5.8 10.3 8.6 13 14.2 7.2" />
    </svg>
  );
}

/**
 * The Golden Ticket bonus: a card across the page, in the flash sale's language, with the
 * landing page's ticket and its slide's motion (goldenTicket/). On the left, what it is, three
 * reasons to want it, and the wallet's bonus with the way to claim it; on the right, the ticket on a stage of its own with the four stage chips (+60X down to 30X).
 *
 * When the card comes into view the ticket is minted, as on the landing page: it charges in
 * the dark while electricity traces its edge, flips round in gold with a shockwave, the
 * lettering rises and the chips burst out from behind it, and the bonus counts up. After
 * that it sways, leans toward the pointer, and every few seconds the wire surges and the
 * live chip flares. With reduced motion it is simply there.
 */
export function GoldenTicket() {
  const { stages, live, ticket } = GOLDEN_TICKET;
  const root = useRef<HTMLElement>(null);
  const ctl = useRef<Electric | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const field = el.querySelector<HTMLElement>('.gold__field')!;
    const unhold = () => void delete field.dataset.phase;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ctl.current?.setDraw(1);
      unhold();
      return;
    }
    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let off: (() => void) | undefined;

    const play = () =>
      import('gsap').then(
        ({ gsap }) => {
          if (cancelled) return;
          ctx = gsap.context(() => {
            const spot = el.querySelector<HTMLElement>('.gold__spot')!;
            const value = el.querySelector<HTMLElement>('.gold__value')!;
            const tl = gsap.timeline();
            tl.from('.gold__halo', { scale: 0.7, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0);
            // the ticket charges, flips round in gold, and its chips burst out (as on the landing page)
            tl.add(mint(gsap, spot, ctl, { trace: 1.1 }), 0.15);
            // the bonus counts up as the ticket lights, and the claim arrives
            const n = { v: 0 };
            tl.to(n, { v: stages[live], duration: 0.9, ease: 'power2.out', onUpdate: () => void (value.textContent = `+${Math.round(n.v)}X`) }, 1.55);
            tl.from('.gold__info > :not(.gold__ticks)', { y: 12, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 }, 0);
            // the ticks land one by one as the ticket lights
            tl.from('.gold__ticks li', { x: -10, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.12 }, 1.5);
            tl.from('.gold__tick', { scale: 0.4, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.12, transformOrigin: '50% 50%' }, 1.5);
            tl.from('.gold__claim', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 1.8);
            unhold();

            // then it sways and its chips bob, and every few seconds the wire surges
            settle(gsap, spot, 3);
            const pulse = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 3.6 });
            pulse.add(() => ctl.current?.surge(2.2), 0);
            pulse.fromTo('.gpill[data-step="0"]', { scale: 1 }, { scale: 1.08, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);
            pulse.fromTo('.gold__value', { scale: 1 }, { scale: 1.06, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '0% 50%' }, 0.05);

            // it leans toward the pointer over its stage
            if (window.matchMedia('(pointer: fine)').matches) {
              gsap.set(spot, { transformPerspective: 900 });
              const rx = gsap.quickTo(spot, 'rotationX', { duration: 0.6, ease: 'power3.out' });
              const ry = gsap.quickTo(spot, 'rotationY', { duration: 0.6, ease: 'power3.out' });
              const move = (e: PointerEvent) => {
                const r = field.getBoundingClientRect();
                ry(((e.clientX - r.left) / r.width - 0.5) * 16);
                rx(((e.clientY - r.top) / r.height - 0.5) * -12);
              };
              const leave = () => {
                rx(0);
                ry(0);
              };
              field.addEventListener('pointermove', move);
              field.addEventListener('pointerleave', leave);
              off = () => {
                field.removeEventListener('pointermove', move);
                field.removeEventListener('pointerleave', leave);
              };
            }
          }, el);
        },
        () => {
          ctl.current?.setDraw(1);
          unhold();
        },
      );

    // it mints when the card is on screen, so it is seen
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        play();
      },
      { threshold: 0.35 },
    );
    io.observe(field);
    return () => {
      cancelled = true;
      io.disconnect();
      off?.();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bonus = stages[live];
  const next = stages[live + 1];

  return (
    <section ref={root} className="card gold" aria-labelledby="gold-title">
      <div className="gold__info">
        <p className="gold__kicker">
          <i aria-hidden="true" />
          Golden Ticket · Stage {live + 1} live
        </p>
        <h2 className="flash__title" id="gold-title">
          Claim your Golden Ticket
        </h2>
        <p className="flash__copy">
          The earlier you enter, the bigger your bonus. Buy in Stage {live + 1} to lock in{' '}
          <strong>+{bonus}X</strong>
          {next !== undefined ? ` before it steps down to ${next}X.` : '.'}
        </p>

        {/* why the ticket is worth having now: three points, each ticked */}
        <ul className="gold__ticks">
          <li>
            <Tick />
            <span>+{bonus}X, the biggest bonus of any stage</span>
          </li>
          <li>
            <Tick />
            <span>Limited allocation, earliest buyers only</span>
          </li>
          <li>
            <Tick />
            <span>Locked in the moment you buy</span>
          </li>
        </ul>

        <div className="flash__code gold__stub">
          <span className="gold__stub-text">
            <span className="flash__code-label">Your bonus · Nº {ticket}</span>
            <span className="gold__value">+{bonus}X</span>
          </span>
          <a className="copy gold__claim" href="#buy">
            Claim allocation
            <svg viewBox="0 0 16 16" className="icon-16" aria-hidden="true">
              <path d="M3 8h9M8.5 4 12.5 8 8.5 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* The ticket's own stage, as on the landing page; the chips read the stages out. */}
      <div className="gold__field" data-phase="mint">
        <span className="gold__grid" aria-hidden="true" />
        <span className="gold__halo" aria-hidden="true" />
        <div className="gold__spot">
          <span className="gwave" aria-hidden="true" />
          <div className="gold__tilt">
            <div className="gt-pose">
              <Ticket ctl={ctl} running drawn={false} />
            </div>
          </div>
          <BonusChips />
        </div>
        <ol className="sr-only" aria-label="Bonus by stage">
          {stages.map((b, i) => (
            <li key={b}>
              Stage {i + 1}: {b}X{i === live ? ' (live)' : ''}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
