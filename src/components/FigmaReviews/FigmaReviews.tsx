import { useCallback, useEffect, useRef, useState } from 'react';
import { useReviewsMotion } from './useReviewsMotion';
import './FigmaReviews.css';

const R = (n: string) => `/figma/reviews/${n}`;

/** How long a slide holds before the slider advances on its own. */
const DWELL = 7000;

/**
 * The three customer slides. Each person's photo is both the slide's backdrop and the face on
 * their chip, so the chip row doubles as the slider's navigation: the active chip is the slide
 * you are on. `focus` is where the face sits in the photo, used to crop the 48px avatar.
 */
const SLIDES = [
  {
    id: 'alice',
    name: 'Alice Smith',
    note: 'Review from customer #1',
    photo: R('slide-1.webp'),
    focus: '55% 6%',
    quote: 'Remittix made sending crypto directly to my bank account surprisingly fast and simple, with no confusing steps or hidden hassle.',
  },
  {
    id: 'robert',
    name: 'Robert Brown',
    note: 'Review from customer #2',
    photo: R('slide-2.webp'),
    focus: '53% 4%',
    quote: 'The whole process felt smooth and straightforward, and my funds arrived exactly when I expected.',
  },
  {
    id: 'maria',
    name: 'Maria Evans',
    note: 'Review from customer #3',
    photo: R('slide-3.webp'),
    focus: '42% 0%',
    quote: 'Remittix takes the complexity out of crypto payments and makes sending money feel as simple as a regular bank transfer.',
  },
] as const;

export function FigmaReviews() {
  const root = useRef<HTMLElement>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const { go } = useReviewsMotion(root, slide);

  const select = useCallback((next: number) => {
    setSlide(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  // The slider advances on its own, and rests while the pointer is on it.
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), DWELL);
    return () => window.clearTimeout(t);
  }, [slide, paused]);

  return (
    <section ref={root} className="rv" data-motion="pending" aria-labelledby="rv-title">
      <div className="rv__frame">
        <h2 id="rv-title" className="rv__title">
          <span className="rv__line">
            <span className="rv__lineInner">Community Reviews</span>
          </span>
        </h2>

        <div
          className="rv__slider"
          role="group"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          {SLIDES.map((s, i) => (
            <article
              key={s.id}
              className="rv__slide"
              data-slide={i}
              aria-hidden={i !== slide}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
            >
              <img className="rv__photo" src={s.photo} alt="" />
              <span className="rv__scrim" />
              <div className="rv__eyebrow">
                <img className="rv__quote" src={R('quote.svg')} alt="" width={20} height={20} />
                <p>What our Customers are saying</p>
              </div>
              <blockquote className="rv__quoteBlock">
                <p className="rv__words">&ldquo;{s.quote}&rdquo;</p>
                <footer className="rv__by">Satisfied Remittix Customer</footer>
              </blockquote>
            </article>
          ))}

          {/* The lit edge that rides the wipe between slides. */}
          <span className="rv__seam" aria-hidden="true" />

          <div className="rv__chips" role="tablist" aria-label="Choose a review">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === slide}
                className="rv__chip"
                data-active={i === slide || undefined}
                onClick={() => { select(i); go(i); }}
              >
                <span className="rv__avatar">
                  <img src={s.photo} alt="" style={{ objectPosition: s.focus }} />
                </span>
                <span className="rv__who">
                  <b>{s.name}</b>
                  <small>{s.note}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
