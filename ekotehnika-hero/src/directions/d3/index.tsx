// Direction 3, Minijatura. A light isometric miniature in Sora, after the Emons reel. A fixed
// card on the left carries one chapter at a time over a steady conversion row, and a row of
// zone buttons under it tracks the truck and jumps between zones.

import { useRef } from 'react';
import { hero, pillars, SITE, trust } from '../../content';
import { Arrow, Badge, Calendar, Phone, PillarIcon, Users } from '../../components/Icons';
import { clamp01, smooth, useStory } from '../../story/useStory';
import { RESTS, STORY } from './story';
import './d3.css';

type Chapter = { step: string; title: string; line?: string; link?: { label: string; href: string; cta: string } };

const pillar = (id: string) => pillars.find((p) => p.id === id)!;

const CHAPTERS: Chapter[] = [
  { step: hero.kicker, title: hero.headline.join(' '), line: hero.sub },
  {
    step: '01  Novi viljuškari',
    title: pillar('novi').line,
    link: { label: pillar('novi').more, href: pillar('novi').href, cta: 'pillar-novi' },
  },
  // dummy
  { step: '02  Skladište', title: 'Svaka isporuka počinje na polici.', line: 'Linde podiže teret mirno, i sa najviše police.' },
  // dummy
  { step: '03  Bezbednost', title: 'Crvena tačka stiže pre viljuškara.', line: 'Pešaci na podu vide gde viljuškar ide, pre nego što stigne.' },
  {
    step: '04  Servis',
    title: pillar('servis').line,
    link: { label: pillar('servis').more, href: pillar('servis').href, cta: 'pillar-servis' },
  },
  {
    step: '05  Polovni',
    title: pillar('polovni').line,
    link: { label: pillar('polovni').more, href: pillar('polovni').href, cta: 'pillar-polovni' },
  },
  {
    step: '06  Najam',
    title: pillar('najam').line,
    link: { label: pillar('najam').more, href: pillar('najam').href, cta: 'pillar-najam' },
  },
  // dummy
  { step: 'Isporučeno', title: 'Od 1997. na terenu, širom Srbije.' },
];

const ZONES = [
  { id: 'novi', chapter: 1 },
  { id: 'servis', chapter: 4 },
  { id: 'polovni', chapter: 5 },
  { id: 'najam', chapter: 6 },
] as const;

const links = [
  { label: 'Novi', href: '/viljuskari/' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

export default function Direction3({ reduced }: { reduced: boolean }) {
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const zoneRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement>(null);
  const statsRef = useRef<HTMLUListElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  const { stageRef, canvasRef, failed, goTo } = useStory({
    story: STORY,
    reduced,
    scrollPerBeat: 1000,
    rests: RESTS,
    onFrame: (b) => {
      // Each chapter owns the card from halfway to its rest point until halfway to the next one.
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const from = i === 0 ? -1 : (RESTS[i - 1] + RESTS[i]) / 2;
        const to = i === RESTS.length - 1 ? 99 : (RESTS[i] + RESTS[i + 1]) / 2;
        const o = smooth(clamp01((b - from) / 0.12)) * (1 - smooth(clamp01((b - (to - 0.12)) / 0.12)));
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * (b < RESTS[i] ? 16 : -16)}px)`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        el.inert = o < 0.5;
      });
      const fin = smooth(clamp01((b - 6.75) / 0.2));
      if (statsRef.current) {
        statsRef.current.style.opacity = String(fin);
        statsRef.current.style.visibility = fin < 0.01 ? 'hidden' : 'visible';
      }
      if (countRef.current) {
        const n = Math.round(1000 * smooth(clamp01((b - 6.75) / 0.25)));
        countRef.current.textContent = n >= 1000 ? '1.000+' : `${Math.round(n / 10) * 10}+`;
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${b / STORY.lastBeat})`;
      const current = [...ZONES].reverse().find((z) => b >= RESTS[z.chapter] - 0.5);
      zoneRefs.current.forEach((el, k) => el?.classList.toggle('is-active', ZONES[k] === current && b < 6.75));
    },
  });

  return (
    <div className="d3" ref={stageRef}>
      {failed ? (
        <div className="d3-fallback">Ilustracija skladišta sa Linde viljuškarom</div>
      ) : (
        <canvas
          ref={canvasRef}
          className="d3-canvas"
          role="img"
          aria-label="Minijatura skladišta Ekotehnike, Linde viljuškar preuzima paletu sa police i vozi je pored servisa i polovnih viljuškara do rampe"
        />
      )}

      <header className="d3-nav">
        <a className="d3-logos" href={`${SITE}/`}>
          <img src="/brand/linde-mh.png" width={67} height={40} alt="Linde Material Handling" />
          <img src="/brand/ekotehnika.png" width={88} height={24} alt="Ekotehnika, početna strana" />
        </a>
        <nav aria-label="Glavna navigacija">
          <ul>
            {links.map((l) => (
              <li key={l.label}>
                <a href={`${SITE}${l.href}`}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="d3-pill d3-pill-line" href={hero.service.tel} data-cta="call-service">
          <Phone size={16} />
          {hero.service.label} {hero.service.number}
        </a>
      </header>

      <section className="d3-card" aria-labelledby="d3-title">
        <div className="d3-chapters">
          {CHAPTERS.map((c, i) => (
            <div
              key={i}
              className={`d3-chapter${i === 0 ? ' is-intro' : ''}`}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
            >
              <p className="d3-step">{c.step}</p>
              {i === 0 ? (
                <h1 id="d3-title" className="d3-title">
                  {c.title}
                </h1>
              ) : (
                <h2 className="d3-title">{c.title}</h2>
              )}
              {c.line && <p className="d3-line">{c.line}</p>}
              {c.link && (
                <a className="d3-link" href={c.link.href} data-cta={c.link.cta}>
                  {c.link.label} <Arrow />
                </a>
              )}
            </div>
          ))}
          <ul className="d3-stats" ref={statsRef}>
            <li>
              <Calendar size={20} />
              {trust[0].text}
            </li>
            <li>
              <Users size={20} />
              <span className="sr-only">{trust[1].text}</span>
              <span aria-hidden="true">
                <span ref={countRef}>1.000+</span> klijenata
              </span>
            </li>
            <li>
              <Badge size={20} />
              {trust[2].text}
            </li>
          </ul>
        </div>

        <div className="d3-actions">
          <a className="d3-pill d3-pill-red" href={hero.quote.href} data-cta="quote">
            {hero.quote.label}
          </a>
          <a className="d3-pill d3-pill-line" href={hero.sales.tel} data-cta="call-sales">
            <Phone size={16} />
            {hero.sales.label} {hero.sales.number}
          </a>
        </div>
      </section>

      <nav className="d3-zones" aria-label="Zone skladišta">
        <span className="d3-track" aria-hidden="true">
          <span ref={fillRef} />
        </span>
        <ul>
          {ZONES.map((z, k) => {
            const p = pillar(z.id);
            return (
              <li key={z.id}>
                <button
                  type="button"
                  ref={(el) => {
                    zoneRefs.current[k] = el;
                  }}
                  data-cta={`pillar-${z.id}`}
                  onClick={() => goTo(RESTS[z.chapter])}
                >
                  <PillarIcon id={z.id} size={22} />
                  <span>{p.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
