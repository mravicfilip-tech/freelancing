import { useEffect, useRef } from 'react';
import { LAUNCH } from '../tokenLaunch/content';
import type { Electric } from '../tokenLaunch/electric';
import { OnAirArt, airDirection } from '../tokenLaunch/OnAir';

/** A tick on the dashboard's confirming green, as on the Golden Ticket card. */
function Tick() {
  return (
    <svg className="gold__tick" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" />
      <path d="M5.8 10.3 8.6 13 14.2 7.2" />
    </svg>
  );
}

/**
 * The Token Launch Strategy Call: a card across the page in the Golden Ticket card's shape, with
 * the landing page's On Air (direction 3) on a stage of its own. On the left, what it is, three
 * reasons to be there, and the session's date with the way to reserve a seat; on the right, the
 * live player in the electric wire and the community's questions beside it.
 *
 * When the card comes into view the player loads in as it does in the landing page's popup: it
 * charges in the dark while electricity traces its edge and the feed's cards are traced and fill
 * with skeletons, flips round lit, the recording pours in up to the playhead and the questions
 * arrive. After that the playhead runs on, launch words rise out of the recording, and the queue
 * moves up as each question is answered. With reduced motion it is simply there.
 */
export function TokenLaunch() {
  const root = useRef<HTMLElement>(null);
  const ctl = useRef<Electric | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const field = el.querySelector<HTMLElement>('.launch__field')!;
    const unhold = () => void delete field.dataset.phase;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ctl.current?.setDraw(1);
      unhold();
      return;
    }
    let cancelled = false;
    let ctx: gsap.Context | undefined;

    const play = () =>
      import('gsap').then(
        ({ gsap }) => {
          if (cancelled) return;
          ctx = gsap.context(() => {
            const spot = el.querySelector<HTMLElement>('.launch__spot')!;
            const tl = gsap.timeline();
            tl.from('.launch__halo', { scale: 0.7, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0);
            // the player charges, flips round lit, and the questions arrive (as on the landing page)
            const enter = airDirection.enter(gsap, spot, ctl, { trace: 1.1 });
            tl.add(enter, 0.15);
            tl.from('.launch__info > :not(.gold__ticks)', { y: 12, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 }, 0);
            // the ticks land one by one as the player lights
            tl.from('.gold__ticks li', { x: -10, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.12 }, 1.5);
            tl.from('.gold__tick', { scale: 0.4, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.12, transformOrigin: '50% 50%' }, 1.5);
            tl.from('.launch__reserve', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 1.8);
            unhold();
            // then it plays on
            airDirection.settle(gsap, spot, ctl, 0.15 + enter.duration());
          }, el);
        },
        () => {
          ctl.current?.setDraw(1);
          unhold();
        },
      );

    // it loads in when the card is on screen, so it is seen
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
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={root} className="card launch" aria-labelledby="launch-title">
      <div className="launch__info">
        <p className="launch__kicker">
          <i aria-hidden="true" />
          {LAUNCH.badge} · {LAUNCH.day} {LAUNCH.dateShort} · {LAUNCH.time}
        </p>
        <h2 className="flash__title" id="launch-title">
          {LAUNCH.title}
        </h2>
        <p className="flash__copy">{LAUNCH.copy}</p>

        {/* why to be there: three points, each ticked, one line each */}
        <ul className="gold__ticks">
          <li>
            <Tick />
            <span>The launch plan, straight from the founders</span>
          </li>
          <li>
            <Tick />
            <span>Your questions answered live, on air</span>
          </li>
          <li>
            <Tick />
            <span>Listing, vesting and allocation covered</span>
          </li>
        </ul>

        <div className="flash__code launch__stub">
          <span className="gold__stub-text">
            {/* the Golden Ticket stub's "Your bonus · Nº 0001", for the seat */}
            <span className="flash__code-label">
              Your seat · {LAUNCH.dateShort}
            </span>
            <span className="launch__when">{LAUNCH.time}</span>
          </span>
          <a className="copy launch__reserve" href="#launch">
            {LAUNCH.cta}
            <svg viewBox="0 0 16 16" className="icon-16" aria-hidden="true">
              <path d="M3 8h9M8.5 4 12.5 8 8.5 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* the player's own stage, as on the landing page */}
      <div className="launch__field" data-phase="mint" aria-hidden="true">
        <span className="launch__grid" />
        <span className="launch__halo" />
        <div className="launch__spot">
          <OnAirArt ctl={ctl} running drawn={false} />
        </div>
      </div>
    </section>
  );
}
