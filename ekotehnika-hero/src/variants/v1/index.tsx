// Variant 1, Globus. A 1:1 take on the United Carriers hero in Linde colours. A dot globe with a
// hot red rim, arcs out of Vrčin, and a scroll story that dives into Serbia, floods white and
// lands on the counters chapter.
import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useScrollStory, range, clamp01 } from '../../scroll/useScrollStory';
import { hero, SITE, pillars } from '../../content';
import { Globe, type Anchor } from './Globe';
import { VRCIN } from './land';
import { LENGTH, cardAt, easeInOut, expoOut, floodAt } from './timeline';
import './v1.css';

// Headline from hero.headline, cut to three lines like the reel's EVERY LEG OF THE JOURNEY.
const HEAD = ['Prodaja,', 'najam i', 'servis.'];
// Dummy, shortened from hero.sub.
const SUB = 'Novi i polovni Linde viljuškari i servis na terenu, sve na jednom mestu.';
// Dummy lines for the small mono detail at the top left.
const GLITCH = ['EKOTEHNIKA / VRČIN', 'LINDE MH / SRB  MNE', 'PRODAJA  NAJAM  SERVIS', 'OD 1997.'];
// Dummy, the partner line on the white page.
const PARTNER = 'Jedan partner za svaki viljuškar u vašem pogonu, od prve ponude do servisa na terenu.';
// Dummy statement in the reel's mixed weight caps style.
const STATEMENT = [
  { t: 'Prodajemo', tone: 'soft' },
  { t: 'viljuškare.', tone: 'soft' },
  { t: 'Održavamo', tone: 'ink' },
  { t: 'ih u radu', tone: 'ink', dot: true },
];
// Counters. The years and the client count are the company's own facts. Labels are dummy.
const COUNTS = [
  { v: '1997', label: 'Osnovani kao servis viljuškara' },
  { v: '2000', label: 'Uvozimo Linde viljuškare' },
  { v: '2023', label: 'Zvanični Linde partner' },
  { v: '1.000+', label: 'Klijenata širom Srbije' },
];
const TAGS: (Anchor & { label: string; side: 'r' | 'l' | 'u' })[] = [
  { ...VRCIN, label: 'Vrčin', side: 'u' },
  { lat: 43.7, lon: 21.25, label: 'Srbija', side: 'r' },
  { lat: 42.8, lon: 19.25, label: 'Crna Gora', side: 'l' },
];

const NAV = [
  { label: 'Novi', href: pillars[0].href },
  { label: 'Polovni', href: pillars[3].href },
  { label: 'Najam', href: pillars[1].href },
  { label: 'Servis', href: pillars[2].href },
  { label: 'Kontakt', href: hero.quote.href },
];

const NOISE = '#%&*+=<>/\\[]_-01';
const rnd = (s: string) => s[Math.floor(Math.random() * s.length)];
function scramble(text: string, k: number) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const at = i / text.length;
    if (c === ' ' || k >= 1 || at < k * 1.3 - 0.3) out += c;
    else if (at < k * 1.3 + 0.15) out += rnd(NOISE);
    else out += ' ';
  }
  return out;
}

// Counts up toward the value. Years run up the last stretch, the client count from zero.
function tickYear(v: string, k: number) {
  if (k >= 1) return v;
  const e = 1 - Math.pow(1 - k, 3);
  if (v.includes('.')) {
    const n = Math.round(e * 1000);
    return n >= 1000 ? '1.000' : String(n);
  }
  const y = Number(v);
  return String(Math.round(y - 140 + e * 140));
}

export default function Variant1({ reduced }: { reduced: boolean }) {
  const { stageRef, progress } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.07 });
  const start = useMemo(() => performance.now(), []);
  const tagEls = useRef<(HTMLElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const q = <T extends HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));
    const lines = q('.v1-line > span');
    const fades = q('[data-fade]');
    const heroBox = el.querySelector<HTMLElement>('.v1-hero')!;
    const glitch = q('.v1-glitch span');
    const glitchBox = el.querySelector<HTMLElement>('.v1-glitch')!;
    const nav = el.querySelector<HTMLElement>('.v1-nav')!;
    const flood = el.querySelector<HTMLElement>('.v1-flood')!;
    const frame = el.querySelector<HTMLElement>('.v1-frame')!;
    const words = q('.v1-partner span');
    const partner = el.querySelector<HTMLElement>('.v1-partner')!;
    const stLines = q('.v1-st-line > span');
    const stFill = q('.v1-st-line > span');
    const stCta = el.querySelector<HTMLElement>('.v1-st-cta')!;
    const col = el.querySelector<HTMLElement>('.v1-counts')!;
    const nums = q('.v1-num');
    const labels = q('.v1-count small');
    const ch = el.querySelector<HTMLElement>('.v1-chapters')!;
    let lastGlitch = 0;
    const glitchSeed = GLITCH.map(() => Math.random() * 3);
    const numCache = COUNTS.map(() => '');

    const tick = () => {
      const now = performance.now();
      const t = (now - start) / 1000;
      const p = progress.current;
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Hero type. Lines rise out of their masks on load, then glitch apart and leave on scroll.
      const exit = easeInOut(range(p, 0.015, 0.1));
      lines.forEach((s, i) => {
        const inK = expoOut(clamp01((t - 0.35 - i * 0.11) / 1.1));
        const out = range(p, 0.012 + i * 0.012, 0.075 + i * 0.012);
        const g = Math.sin(out * Math.PI);
        s.style.transform = `translate3d(${(g * (i % 2 ? -26 : 34)).toFixed(1)}px, ${((1 - inK) * 105 - easeInOut(out) * 40).toFixed(1)}%, 0)`;
        s.style.opacity = (1 - easeInOut(out)).toFixed(3);
        s.style.setProperty('--g', g.toFixed(3));
        s.style.filter = g > 0.02 ? `blur(${(g * 3).toFixed(2)}px)` : '';
      });
      fades.forEach((f) => {
        const d = Number(f.dataset.fade);
        const inK = expoOut(clamp01((t - 0.6 - d * 0.12) / 1.0));
        const out = easeInOut(range(p, 0.006 + d * 0.006, 0.05 + d * 0.006));
        f.style.opacity = (inK * (1 - out)).toFixed(3);
        f.style.transform = `translate3d(0, ${((1 - inK) * 18 - out * 30).toFixed(1)}px, 0)`;
      });
      heroBox.style.visibility = exit >= 1 ? 'hidden' : 'visible';

      // Mono detail. Decodes on load, then glitches in short bursts.
      const burst = t - lastGlitch > 3.2 ? ((lastGlitch = t), 0) : t - lastGlitch;
      glitch.forEach((s, i) => {
        const dec = clamp01((t - 0.4 - i * 0.18) / 0.9);
        const k = dec < 1 ? dec : burst < 0.35 && glitchSeed[i] > 1.2 ? burst / 0.35 : 1;
        const txt = scramble(GLITCH[i], k);
        if (s.textContent !== txt) s.textContent = txt;
      });
      glitchBox.style.opacity = (1 - exit).toFixed(3);

      // Flood and the card.
      const fl = floodAt(p);
      // The white rises from the floor to the top of the page, a soft edge in front of it.
      const edge = fl * 140 - 20;
      flood.style.setProperty('--m0', `${edge.toFixed(1)}%`);
      flood.style.setProperty('--m1', `${(edge + 22).toFixed(1)}%`);
      flood.style.opacity = Math.min(1, fl * 4).toFixed(3);
      flood.style.visibility = fl > 0.001 ? 'visible' : 'hidden';
      const c = cardAt(p, W, H);
      if (c.open > 0.001) {
        flood.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${c.x.toFixed(1)} ${c.y.toFixed(1)}h${c.w.toFixed(1)}v${c.h.toFixed(1)}h${(-c.w).toFixed(1)}Z")`;
        frame.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
        frame.style.width = `${c.w.toFixed(1)}px`;
        frame.style.height = `${c.h.toFixed(1)}px`;
        frame.style.opacity = c.open.toFixed(3);
      } else {
        flood.style.clipPath = '';
        frame.style.opacity = '0';
      }
      nav.classList.toggle('is-light', fl > 0.55);
      ch.style.visibility = p > 0.4 ? 'visible' : 'hidden';

      // Partner line, word by word out of a blur, as in the reel at 2.2s.
      const pOut = easeInOut(range(p, 0.545, 0.585));
      words.forEach((w, i) => {
        const k = easeInOut(range(p, 0.44 + i * 0.0045, 0.475 + i * 0.0045));
        w.style.opacity = (k * (1 - pOut)).toFixed(3);
        w.style.filter = k < 1 || pOut > 0 ? `blur(${((1 - k) * 10 + pOut * 8).toFixed(2)}px)` : '';
        w.style.transform = `translate3d(${((1 - k) * 18).toFixed(1)}px, ${(-pOut * 24).toFixed(1)}px, 0)`;
      });
      partner.style.visibility = p > 0.42 && pOut < 1 ? 'visible' : 'hidden';

      // Statement. Lines rise in, then each fills from shade grey to its tone, left to right.
      stLines.forEach((s, i) => {
        const k = expoOut(range(p, 0.565 + i * 0.016, 0.62 + i * 0.016));
        s.style.transform = `translate3d(0, ${((1 - k) * 110).toFixed(1)}%, 0)`;
      });
      stFill.forEach((s, i) => {
        const f = easeInOut(range(p, 0.6 + i * 0.026, 0.67 + i * 0.026));
        s.style.setProperty('--f', `${(f * 104).toFixed(1)}%`);
      });
      const ctaK = expoOut(range(p, 0.66, 0.72));
      stCta.style.opacity = ctaK.toFixed(3);
      stCta.style.transform = `translate3d(0, ${((1 - ctaK) * 24).toFixed(1)}px, 0)`;
      stCta.style.visibility = ctaK > 0.01 ? 'visible' : 'hidden';

      // Counters. The column rides up, each number ticks and blurs while it counts.
      const s = W / 1440;
      const y0 = (900 - range(p, 0.55, 0.95) * 1460) * s;
      col.style.transform = `translate3d(0, ${y0.toFixed(1)}px, 0)`;
      nums.forEach((n, i) => {
        const top = y0 + i * 300 * s;
        const k = clamp01((780 * s - top) / (380 * s));
        const v = tickYear(COUNTS[i].v, k);
        if (numCache[i] !== v) {
          numCache[i] = v;
          n.textContent = v;
          n.dataset.v = v;
        }
        const moving = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
        n.style.setProperty('--gy', `${(moving * 14).toFixed(1)}px`);
        n.style.filter = moving > 0.02 ? `blur(${(moving * 2.4).toFixed(2)}px)` : '';
        labels[i].style.opacity = clamp01((k - 0.6) * 3).toFixed(3);
      });
    };
    if (import.meta.env.DEV) (window as unknown as { __v1: typeof progress }).__v1 = progress;
    gsap.ticker.add(tick);
    tick();
    return () => gsap.ticker.remove(tick);
  }, [reduced, progress, start]);

  return (
    <section className={`v1${reduced ? ' is-still' : ''}`} aria-label="Ekotehnika, Linde viljuškari" ref={root}>
      <div className="v1-stage" ref={stageRef}>
        <div className="v1-gl" aria-hidden="true">
          <Globe progress={progress} reduced={reduced} start={start} tagEls={tagEls} tags={TAGS} />
        </div>
        <div className="v1-tags" aria-hidden="true">
          {TAGS.map((t, i) => (
            <span
              key={t.label}
              className="v1-tag"
              data-side={t.side}
              ref={(e) => {
                tagEls.current[i] = e;
              }}
            >
              <span>{t.label}</span>
            </span>
          ))}
        </div>

        <div className="v1-flood" aria-hidden="true" />
        <div className="v1-frame" aria-hidden="true" />

        <header className="v1-nav">
          <a className="v1-brand" href={SITE} aria-label="Ekotehnika, početna strana">
            <img src="/brand/linde-mh.png" alt="Linde Material Handling" width={112} height={67} />
            <img src="/brand/ekotehnika.png" alt="Ekotehnika" width={110} height={30} />
          </a>
          <nav aria-label="Glavni meni">
            {NAV.map((n) => (
              <a key={n.label} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
        </header>

        <div className="v1-glitch" aria-hidden="true">
          {GLITCH.map((g) => (
            <span key={g}>{reduced ? g : ''}</span>
          ))}
        </div>

        <div className="v1-hero">
          <p className="v1-kicker" data-fade="0">
            Zvanični Linde partner
          </p>
          <h1 className="v1-h1">
            {HEAD.map((l) => (
              <span key={l} className="v1-line">
                <span>{l}</span>
              </span>
            ))}
          </h1>
          <p className="v1-sub" data-fade="1">
            {SUB}
          </p>
          <div className="v1-ctas" data-fade="2">
            <a className="v1-pill v1-pill--solid" href={hero.quote.href} data-cta="quote">
              {hero.quote.label}
            </a>
            <a className="v1-pill v1-pill--line" href={hero.sales.tel} data-cta="call-sales">
              {hero.sales.label} <span>{hero.sales.number}</span>
            </a>
          </div>
        </div>

        {!reduced && (
          <div className="v1-chapters">
            <p className="v1-partner">
              {PARTNER.split(' ').map((w, i) => (
                <span key={i}>{w} </span>
              ))}
            </p>
            <div className="v1-statement">
              <p className="v1-st">
                {STATEMENT.map((l) => (
                  <span key={l.t} className={`v1-st-line is-${l.tone}`}>
                    <span>
                      {l.t}
                      {l.dot && <i>.</i>}
                    </span>
                  </span>
                ))}
              </p>
              <a className="v1-pill v1-pill--red v1-st-cta" href={hero.quote.href} data-cta="quote">
                {hero.quote.label}
              </a>
            </div>
            <div className="v1-counts-clip">
              <ul className="v1-counts">
                {COUNTS.map((c) => (
                  <li key={c.v} className="v1-count">
                    <span className="v1-num" data-v={c.v}>
                      {c.v}
                    </span>
                    <small>{c.label}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
