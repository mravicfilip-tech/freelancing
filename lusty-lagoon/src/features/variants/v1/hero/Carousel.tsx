import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { BellRinging, CaretLeft, CaretRight, Pause, Play, Ticket } from '@phosphor-icons/react';
import { DAILY_CHEST, useCountdown } from '../../shared/data';
import { GIVEAWAY } from '../../../lobby/data';
import { cn } from '../../../../lib/cn';
import { Key, useStill } from '../ui';
import { Figure, FireMark, Headline, Line, OnlinePill, PlayKey, Scene, Sparks, TopWin } from './parts';

// Iteration 3, Carousel (round 8, note 6, plan part C3). Three slides in one frame, each with its own
// art set into its own scene, built on briefs/round-7/art-recipe.md.
//   Welcome, the redhead from the register page on the purple sunset beach (lobby/hero-sunset), Play
//   Sugar Rush.
//   Hot streak giveaway, the purple slot machine in the slot arcade (landing/casino-arcade), Join.
//   Daily chest, the chest on the sand by the lit pool of the night jungle (kit/neon-casino), Remind me.
// The online pill, Top win today and the streak stay put while the slides change. Dots, arrows and a
// pause key sit at the bottom left, the phone swipes. It moves on every 6 seconds, held while the
// pointer or focus is inside, and never on its own under ?still or reduced motion. The dot's fill runs
// the clock, so the hold and the dot always agree.

const SLIDES = [
  { id: 'welcome', name: 'Welcome' },
  { id: 'giveaway', name: 'Hot streak giveaway' },
  { id: 'chest', name: 'Daily chest' },
] as const;

const EMBERS = [
  { x: '66%', y: '58%', delay: 0, dur: 9 },
  { x: '72%', y: '64%', delay: -3, dur: 11 },
  { x: '78%', y: '54%', delay: -6, dur: 10, lilac: true },
  { x: '70%', y: '44%', delay: -8, dur: 12 },
];
const SPARKS = [
  { x: '60%', y: '30%', delay: 0, dur: 15 },
  { x: '86%', y: '24%', delay: -9, dur: 16 },
  { x: '92%', y: '60%', delay: -4, dur: 18, lilac: true },
];

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** A key with the round mark at its end, the hero's one key per slide. */
function SlideKey({ onClick, children, mark }: { onClick?: () => void; children: ReactNode; mark: ReactNode }) {
  return (
    <Key tone="orange" size={56} onClick={onClick} className="h8-key gap-3 pl-8 pr-[10px]">
      {children}
      <span className="n1-key-mark h-9 w-9">{mark}</span>
    </Key>
  );
}

export function Carousel({ onPlay, onGiveaway, onChest }: { onPlay: () => void; onGiveaway?: () => void; onChest?: () => void }) {
  const still = useStill();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const chest = useCountdown(DAILY_CHEST.readyInSeconds);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const today = DAILY_CHEST.days.findIndex((d) => d.status === 'today');

  // It may move on its own at all, and it is moving right now.
  const canAuto = !still && !reduced;
  const running = canAuto && !paused && !hover && !focus;
  const count = SLIDES.length;
  const go = (i: number) => setIndex((i + count) % count);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    }
  };
  const down = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const up = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  const slides: Record<(typeof SLIDES)[number]['id'], { art: ReactNode; copy: ReactNode }> = {
    welcome: {
      art: (
        <>
          <Scene src="/art/lobby/hero-sunset.webp" flip className="h8-slide-scene h8-welcome-scene" />
          <span className="h8-slide-grade" />
          <span className="h8-welcome-sun" />
          <span className="h8-slide-vignette" />
          <Figure src="/art/auth/register-player.webp" w={601} h={1000} className="h8-welcome-fig" />
          <span className="h8-haze h8-slide-haze" />
          <Sparks items={SPARKS} />
        </>
      ),
      copy: (
        <>
          <div className="flex flex-col gap-4">
            <Headline id="h8-title" />
            <Line />
          </div>
          <PlayKey onPlay={onPlay} />
        </>
      ),
    },
    giveaway: {
      art: (
        <>
          <Scene src="/art/landing/casino-arcade.webp" className="h8-slide-scene h8-give-scene" />
          <span className="h8-slide-grade" />
          <span className="h8-give-lamp" />
          <span className="h8-slide-vignette" />
          <span className="h8-pool h8-give-pool" />
          <span className="h8-give-contact" />
          <Figure src="/art/landing/slot-machine.webp" w={531} h={900} className="h8-give-fig" />
          <span className="h8-haze h8-slide-haze" />
          <Sparks items={SPARKS} />
        </>
      ),
      copy: (
        <>
          <div className="flex flex-col gap-4">
            <Headline as="h2">Hot streak giveaway</Headline>
            <Line>
              Ten players share <span className="num font-bold text-ink">{GIVEAWAY.pool} BTC</span> on {GIVEAWAY.ends}. Every ${GIVEAWAY.entryEvery} you play this week is one entry.
            </Line>
          </div>
          <SlideKey onClick={onGiveaway} mark={<Ticket weight="fill" className="h-4 w-4" aria-hidden />}>
            Join
          </SlideKey>
        </>
      ),
    },
    chest: {
      art: (
        <>
          <Scene src="/art/kit/neon-casino.webp" className="h8-slide-scene h8-chest-scene" />
          <span className="h8-slide-grade" />
          <span className="h8-chest-glow" />
          <span className="h8-slide-vignette" />
          <span className="h8-pool h8-chest-pool" />
          <span className="h8-chest-contact" />
          <Figure src="/art/lobby/giveaway-chest.webp" w={420} h={420} className="h8-chest-fig" />
          <span className="h8-haze h8-slide-haze" />
          <Sparks items={EMBERS} />
        </>
      ),
      copy: (
        <>
          <div className="flex flex-col gap-4">
            <Headline as="h2">Daily chest</Headline>
            <Line>
              Day {today + 1} pays <span className="num font-bold text-ink">{DAILY_CHEST.days[today].amount} {DAILY_CHEST.currency}</span>. The chest opens in{' '}
              <span className="num font-bold text-ink" aria-label={`${chest.h} hours ${chest.m} minutes`}>
                {chest.hms}
              </span>
              .
            </Line>
          </div>
          <SlideKey onClick={onChest} mark={<BellRinging weight="fill" className="h-4 w-4" aria-hidden />}>
            Remind me
          </SlideKey>
        </>
      ),
    },
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Lagoon highlights"
      data-hero="3"
      className={cn('h8-hero h8-car', !canAuto && 'h8-car-still')}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
    >
      <div className="h8-car-slides" aria-live={running ? 'off' : 'polite'} onPointerDown={down} onPointerUp={up} onPointerCancel={() => (swipe.current = null)}>
        {SLIDES.map((s, i) => {
          const on = i === index;
          return (
            <div
              key={s.id}
              id={`h8-slide-${s.id}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}, ${s.name}`}
              aria-hidden={!on}
              inert={!on}
              className={cn('h8-slide', `h8-slide-${s.id}`, on && 'is-on')}
            >
              <span aria-hidden className="h8-slide-art">
                {slides[s.id].art}
              </span>
              <div className="h8-slide-copy">{slides[s.id].copy}</div>
            </div>
          );
        })}
      </div>

      <OnlinePill className="h8-car-online" />

      <div className="h8-car-foot">
        <div role="group" aria-label="Choose a slide" className="h8-car-controls" onKeyDown={onKey}>
          <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="h8-car-arrow n1-ring">
            <CaretLeft weight="bold" className="h-4 w-4" aria-hidden />
          </button>
          <span className="flex items-center">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${i + 1}, ${s.name}`}
                aria-controls={`h8-slide-${s.id}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => go(i)}
                className="h8-car-dot n1-ring"
              >
                <span className="h8-car-pip">
                  {i === index && canAuto && <span key={index} className={cn('h8-car-fill', !running && 'is-held')} onAnimationEnd={() => go(index + 1)} />}
                </span>
              </button>
            ))}
          </span>
          <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="h8-car-arrow n1-ring">
            <CaretRight weight="bold" className="h-4 w-4" aria-hidden />
          </button>
          {canAuto && (
            <button type="button" aria-label={paused ? 'Play the slides' : 'Pause the slides'} aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="h8-car-arrow n1-ring">
              {paused ? <Play weight="fill" className="h-4 w-4" aria-hidden /> : <Pause weight="fill" className="h-4 w-4" aria-hidden />}
            </button>
          )}
        </div>
        <div className="h8-car-stats">
          <TopWin onPlay={onPlay} layout="cell" detail={false} className="h8-car-win" />
          <span aria-hidden className="h8-car-rule" />
          <p className="h8-car-streak flex shrink-0 items-center gap-2 whitespace-nowrap text-12 font-extrabold uppercase tracking-[0.06em] text-ink">
            <FireMark />
            <span>
              <span className="num">{DAILY_CHEST.streak}</span> day streak
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
