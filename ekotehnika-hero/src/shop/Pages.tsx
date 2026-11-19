// The service pages and the company page, Filip 19 November, "Need to work on the service pages and about pages ... So it's interesting.
// Also to the service pages add parts page (Delovi)". The plan is briefs/pages/plan.md, every fact and its source briefs/pages/content.md.
// Then "Do different hero's, add more CTA's that are more prominent and more attractive, add wow effects" (taste 2026-11-19 13:10), so
// each page has its own hero built round its own strongest asset. Najam a rental card beside a reel of the delivery photos, Servis the
// map on black with Hitan servis as a big call button, Delovi the four groups as photo tiles, Kompanija the headquarters across the whole
// width. Each page has one black call band mid page and closes on a short inquiry in place, QuickAsk.tsx (round 3, taste 2026-11-19
// 14:00). Red stays on the one primary per view, the black band turns its primary white. The motion is the site's own, the Fade with a 12px rise, layers that come in along the grid, figures
// that count up, photos that drift a little slower than the page, and all of it off when less motion is asked for.
// The words are the client's own where the live site or the old site has them, the rest are short plain lines for the client to check.
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { hero, pillars } from '../content';
import { najam as najamCopy, servis as servisCopy, servisMap, statement } from '../story2/copy';
import { SERVICES as MENU } from '../ui/ShopNav';
import { CATEGORIES, PRODUCTS } from './data';
import { Link } from './route';
import { Cap, Cell } from './parts';
import { QuickAsk } from './QuickAsk';
import { ReelCols } from './Reel';
// the shop's styles first, so these come after them and win where a rule ties (Shop.tsx imports this file before shop.css)
import './shop.css';
import './pages.css';

const Centres = lazy(() => import('./Centres'));
const HeroMap = lazy(() => import('./Centres').then((m) => ({ default: m.HeroMap })));

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Ekotehnika`;
  }, [title]);
}

// a link to the form with its topic and a first line of the message filled in, which the visitor can change
export const ask = (tema: string, poruka?: string) => `/kontakt?tema=${tema}${poruka ? `&poruka=${encodeURIComponent(poruka)}` : ''}`;
const pillar = (id: string) => pillars.find((p) => p.id === id)!;
const still = () => typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtN = (n: number, plain = false) => (plain ? String(Math.round(n)) : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));

// ---- the motion of a page ----
// Cells of a section marked pg-rv come in with the Fade as they reach the window, one after another along the row. A figure with
// data-count counts up from data-from when it comes in. A photo with data-par drifts against the scroll, 40px at most. A call band
// marked pg-cta brings its photos in from their own sides. Nothing is hidden before the script has armed it, so with no script or with
// less motion asked for, everything is simply there.
function usePageMotion(root: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || still() || !('IntersectionObserver' in window)) return;
    const cells = Array.from(el.querySelectorAll<HTMLElement>('.pg-rv > .sp-cell:not(.sp-cap)'));
    cells.forEach((c) => {
      const sibs = Array.from(c.parentElement!.children).filter((x) => x.classList.contains('sp-cell') && !x.classList.contains('sp-cap'));
      c.style.setProperty('--i', String(sibs.indexOf(c) % 4));
    });
    const counts = Array.from(el.querySelectorAll<HTMLElement>('[data-count]'));
    const bands = Array.from(el.querySelectorAll<HTMLElement>('.pg-cta'));
    el.dataset.rv = '';
    const runs: number[] = [];
    const count = (n: HTMLElement) => {
      const to = Number(n.dataset.count);
      const from = Number(n.dataset.from ?? 0);
      const plain = n.dataset.plain !== undefined;
      const t0 = performance.now();
      const step = (t: number) => {
        const x = Math.min(1, (t - t0) / 1400);
        n.textContent = fmtN(from + (to - from) * (1 - Math.pow(1 - x, 3)), plain);
        if (x < 1) runs.push(requestAnimationFrame(step));
      };
      n.textContent = fmtN(from, plain);
      runs.push(requestAnimationFrame(step));
    };
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target as HTMLElement;
          io.unobserve(t);
          t.dataset.in = '';
          if (t.dataset.count !== undefined) count(t);
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    [...cells, ...counts, ...bands].forEach((x) => io.observe(x));

    const pars = Array.from(el.querySelectorAll<HTMLElement>('[data-par]'));
    let raf = 0;
    const drift = () => {
      raf = 0;
      const vh = window.innerHeight;
      pars.forEach((img) => {
        const r = img.parentElement!.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        img.style.setProperty('--py', `${(Math.max(-1, Math.min(1, p)) * 40).toFixed(1)}px`);
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(drift);
    };
    drift();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
      runs.forEach(cancelAnimationFrame);
      delete el.dataset.rv;
    };
  }, [root]);
}

function Page({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  usePageMotion(root);
  return (
    <div className="pg" ref={root}>
      {children}
    </div>
  );
}

// a photo in a box that clips it, so it can drift against the scroll
function Par({ src, alt = '', focus, eager = false }: { src: string; alt?: string; focus?: string; eager?: boolean }) {
  return (
    <span className="pg-par">
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" data-par="" style={focus ? { objectPosition: focus } : undefined} />
    </span>
  );
}

// four figures in the four frames, the homepage's facts, a number counts up as it comes in
type Fig = { value: ReactNode; label: string };
function Figures({ label, items, big = false }: { label: string; items: Fig[]; big?: boolean }) {
  return (
    <section className={`sp-frame pg-figs pg-rv${big ? ' is-big' : ''}`} aria-label={label}>
      {items.map((f) => (
        <Cell className="pg-fig" key={f.label}>
          <p className="pg-fig-v">{f.value}</p>
          <p className="pg-fig-l">{f.label}</p>
        </Cell>
      ))}
    </section>
  );
}

const Num = ({ n, from, text, plain }: { n: number; from?: number; text: string; plain?: boolean }) => (
  <span className="pg-n" data-count={n} data-from={from} data-plain={plain ? '' : undefined}>
    {text}
  </span>
);

function Head({ id, label, note }: { id: string; label: string; note?: string }) {
  return (
    <Cell span={4} className="sp-sec-h">
      <h2 className="sp-lab" id={id}>
        {label}
      </h2>
      {note ? <p className="sp-sec-note">{note}</p> : null}
    </Cell>
  );
}

function CentresMap({ label, pic }: { label: string; pic?: { src: string; alt: string } }) {
  return (
    <Suspense fallback={<section className="sp-frame pg-centres" aria-busy="true" style={{ minHeight: 680 }} />}>
      <Centres label={label} pic={pic} />
    </Suspense>
  );
}

// ---- the call band, black across the four frames, a photo in each outer frame that comes in from its side, the words and the actions
// in the middle two. The homepage's closing section on black (taste 2026-11-19 13:10). Once per page, mid page, never the close and never
// beside another dark section (taste 2026-11-19 14:00, "repeatable section which is really bad rework it"). The close is QuickAsk.
// Only the last section of a page draws the closing cap. A cap under any other section lies 2px over the next row's own top rule and
// draws a doubled line (Filip 19 November, "you have duplicate lines ... make sure you never do those again").
type Act = { label: string; href: string; cta: string; phone?: boolean };
function Band({ id, label, title, line, primary, secondary, photos, last = false }: {
  id: string;
  label: string;
  title: string;
  line?: string;
  primary: Act;
  secondary?: Act;
  photos: [string, string];
  last?: boolean;
}) {
  const act = (a: Act, kind: 'primary' | 'secondary') => {
    const cls = `btn btn-${kind}${a.phone ? ' btn-phone' : ''}`;
    const inner = <BtnInner>{a.label}</BtnInner>;
    return a.href.startsWith('/') ? (
      <Link className={cls} href={a.href} data-cta={a.cta}>
        {inner}
      </Link>
    ) : (
      <a className={cls} href={a.href} data-cta={a.cta}>
        {inner}
      </a>
    );
  };
  return (
    <section className="sp-frame pg-cta pg-dark" data-ink="dark" aria-labelledby={`pg-${id}-h`}>
      <Cell className="pg-cta-ph is-l">
        <Par src={photos[0]} />
      </Cell>
      <Cell span={2} className="pg-cta-c">
        <h2 className="sp-lab" id={`pg-${id}-h`}>
          {label}
        </h2>
        <p className="pg-cta-t">{title}</p>
        {line ? <p className="pg-cta-l">{line}</p> : null}
        <div className="pg-cta-acts">
          {act(primary, 'primary')}
          {secondary ? act(secondary, 'secondary') : null}
        </div>
      </Cell>
      <Cell className="pg-cta-ph is-r">
        <Par src={photos[1]} />
      </Cell>
      {last ? <Cap /> : null}
    </section>
  );
}

// The other places of the site, a tile each with a photo, so every page leads on to the rest
const PLACES = [
  { id: 'prodavnica', name: 'Prodavnica', line: `${PRODUCTS.length} modela u ${CATEGORIES.length} kategorija.`, href: '/prodavnica', pic: '/shop/hero/range.webp' },
  { id: 'najam', name: 'Najam', line: pillar('najam').line, href: '/najam', pic: '/photos/isporuka-3.webp' },
  { id: 'servis', name: 'Servis', line: pillar('servis').line, href: '/servis', pic: '/pages/servis-centar.webp' },
  { id: 'delovi', name: 'Delovi', line: MENU.find((s) => s.id === 'delovi')!.line, href: '/delovi', pic: '/pages/delovi-setovi.webp' },
  { id: 'kompanija', name: 'Kompanija', line: statement.rows[1], href: '/kompanija', pic: '/pages/kompanija-zgrada.webp' },
];

function Places({ current, label = 'Pogledajte i', note, last = false }: { current: string; label?: string; note?: string; last?: boolean }) {
  const items = PLACES.filter((p) => p.id !== current).slice(0, 4);
  return (
    <section className="sp-frame pg-go-row pg-rv" aria-labelledby="pg-go-h">
      <Head id="pg-go-h" label={label} note={note} />
      {items.map((p) => (
        <Cell className="sp-tile pg-go" key={p.id}>
          <Link className="sp-tile-a" href={p.href}>
            <span className="sp-pic">
              <img src={p.pic} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="sp-tile-name">{p.name}</span>
            <span className="pg-go-l">{p.line}</span>
            <i className="sp-go" aria-hidden="true" />
          </Link>
        </Cell>
      ))}
      {last ? <Cap /> : null}
    </section>
  );
}

const SALES_CALL: Act = { label: `${hero.sales.label} ${hero.sales.number}`, href: hero.sales.tel, cta: 'call-sales', phone: true };

// ---- Najam ----
// The hero, the words and a rental card on the left, short or long rental, the long one with its four terms, and one primary that
// carries the choice into the form. On the right two columns of the delivery photos rise slowly, each at its own pace, and hold under
// the pointer. Reference Sixt's booking box over a photo.
const TERMS = najamCopy.terms.cells.map((c) => c.figure);
const SHORT = 'Za sezonski špic, veliki broj narudžbina ili događaj. I kao jednostavan način da viljuškar upoznate pre kupovine.';
const REEL_A = [
  { src: '/photos/isporuka-4.webp', focus: '50% 60%' },
  { src: '/pages/najam-flota.webp', focus: '30% 50%' },
  { src: '/photos/isporuka-2.webp', focus: '50% 50%' },
];
const REEL_B = [
  { src: '/photos/isporuka-3.webp', focus: '50% 55%' },
  { src: '/pages/kompanija-isporuka.webp', focus: '60% 50%' },
  { src: '/photos/isporuka-1.webp', focus: '50% 40%' },
];

function Reel() {
  return (
    <Cell span={2} className="pg-reel">
      <ReelCols a={REEL_A} b={REEL_B} />
    </Cell>
  );
}

// The term picker of the long rental, a stepper, Filip's pick of 19 November (taste 14:32, "go with 3", board in
// briefs/pages/n2-term-cards-board.png, kit term-stepper). One large figure with its years between a minus and a plus cell, and the
// four terms as stops under it.
const YEARS: Record<string, string> = { '36': '3 godine', '48': '4 godine', '60': '5 godina', '72': '6 godina' };

function Terms({ term, setTerm }: { term: string; setTerm: (t: string) => void }) {
  const at = TERMS.indexOf(term);
  return (
    <div className="pg-step">
      <div className="pg-step-row">
        <button type="button" className="pg-step-b is-minus" aria-label="Kraći period" disabled={at === 0} onClick={() => setTerm(TERMS[at - 1])} />
        <output className="pg-step-v" aria-live="polite">
          <b key={term}>{term}</b>
          <span>meseci, {YEARS[term]}</span>
        </output>
        <button type="button" className="pg-step-b is-plus" aria-label="Duži period" disabled={at === TERMS.length - 1} onClick={() => setTerm(TERMS[at + 1])} />
      </div>
      <div className="pg-step-stops">
        {TERMS.map((m) => (
          <label className={`pg-step-stop${term === m ? ' is-on' : ''}`} key={m}>
            <input type="radio" name="pg-term" value={m} checked={term === m} onChange={() => setTerm(m)} />
            <span>{m}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RentCard() {
  const [mode, setMode] = useState<'kratko' | 'dugo'>('dugo');
  const [term, setTerm] = useState(TERMS[1]);
  const msg = mode === 'kratko' ? 'Zanima me kratkoročni najam.' : `Zanima me dugoročni najam na ${term} meseci.`;
  return (
    <div className="pg-rent">
      <fieldset className="pg-rent-f">
        <legend className="sp-lab">Vrsta najma</legend>
        <div className="sp-seg pg-rent-seg">
          {(
            [
              ['kratko', 'Kratkoročni'],
              ['dugo', 'Dugoročni'],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className={mode === id ? 'is-on' : undefined}>
              <input type="radio" name="pg-mode" value={id} checked={mode === id} onChange={() => setMode(id)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {mode === 'kratko' ? (
        <div className="pg-rent-short" key="kratko">
          <p className="pg-rent-v">Od nekoliko sati do godinu dana</p>
          <p className="pg-rent-t">{SHORT}</p>
        </div>
      ) : (
        <fieldset className="pg-rent-f" key="dugo">
          <legend className="sp-lab">Period</legend>
          <Terms term={term} setTerm={setTerm} />
        </fieldset>
      )}
      <div className="pg-rent-act">
        <Link className="btn btn-primary" href={ask('najam', msg)} data-cta="rent">
          <BtnInner>{pillar('najam').cta}</BtnInner>
        </Link>
        <a className="pg-rent-call" href={hero.sales.tel} data-cta="call-sales">
          ili pozovite <span>{hero.sales.number}</span>
        </a>
      </div>
    </div>
  );
}

export function Najam() {
  useTitle('Najam viljuškara');
  return (
    <Page>
      <section className="sp-frame pg-hn" aria-labelledby="pg-najam-h">
        <Cell span={2} className="pg-hn-text">
          <div className="pg-in">
            <p className="sp-lab">Najam</p>
            <h1 className="sp-hero-t" id="pg-najam-h">
              Najam viljuškara
            </h1>
            <p className="sp-lede">{pillar('najam').line}</p>
          </div>
          <RentCard />
        </Cell>
        <Reel />
      </section>

      <Figures
        label="Najam ukratko"
        items={najamCopy.facts.map((f) => ({ value: f.count ? <><Num n={f.count} text={f.figure} /> <span className="pg-u">{f.suffix!.trim()}</span></> : f.figure, label: f.label }))}
      />

      <Band
        id="najam-mid"
        label="Isporuka"
        title="Viljuškar kod vas za 24 sata."
        line="Dostava i preuzimanje su besplatni, a održavanje je uključeno u najam."
        primary={{ label: pillar('najam').cta, href: ask('najam'), cta: 'rent' }}
        secondary={SALES_CALL}
        photos={['/shop/hero/ceoni.webp', '/pages/kompanija-regali.webp']}
      />

      <section className="sp-frame pg-band pg-rv" aria-labelledby="pg-which-h">
        <Cell span={2} className="pg-pic">
          <Par src="/shop/hero/range-2.webp" alt="Linde viljuškari u hali" />
        </Cell>
        <Cell span={2} className="pg-text">
          <h2 className="sp-lab" id="pg-which-h">
            Koji viljuškar
          </h2>
          <p className="pg-h2">Za svaki model iz prodavnice možete pitati i za najam.</p>
          {/* the old Najam page, "Cena najma viljuškara zavisi od modela, visine podizanja, dodatne opreme i dužine zakupa" */}
          <p className="sp-lede">Cena najma zavisi od modela, visine podizanja, dodatne opreme i dužine najma.</p>
          <div className="pg-act">
            <Link className="btn btn-secondary" href="/prodavnica">
              <BtnInner>Pogledajte modele</BtnInner>
            </Link>
          </div>
        </Cell>
      </section>

      <QuickAsk
        id="najam-ask"
        tema="najam"
        label="Ponuda za najam"
        title="Recite nam šta vam treba i na koliko dugo."
        poruka="Zanima me najam viljuškara."
        cta={pillar('najam').cta}
      />
      <Places current="najam" last />
    </Page>
  );
}

// ---- Servis ----
// The hero on black, the homepage's one dark screen. The words, Hitan servis as a big call button, and the map drawing on beside them,
// both centres marked.
const SERVICES = [
  { icon: 'calendar', name: 'Redovno održavanje', line: 'Servis u propisanim intervalima, pre nego što kvar zaustavi rad.' },
  { icon: 'siren', name: 'Hitne intervencije', line: 'Jedan poziv je dovoljan. Tehničar dolazi sa originalnim rezervnim delovima.', call: true },
  { icon: 'clipboard', name: 'Zakonski pregledi', line: 'Propisani bezbednosni pregledi, sa potpunom servisnom dokumentacijom.' },
  { icon: 'deal', name: 'Ugovori o punom servisu', line: 'Jedan ugovor pokriva sve neophodne mere održavanja.' },
];
// the old service page's tabs, "Ispitivanje pre početka rada"
const CHECKS = ['Konstrukcija vozila i vozni mehanizam', 'Motor, baterija i punjači', 'Hidraulika i tečnosti', 'Elektrika', 'Sistem za prihvat tereta'];

// The Hitan servis call and Zakažite servis in the Servis hero, round 4 note 39, "rework this" (briefs/shop/notes.md). The old box was
// capped at 560px and its number ran under the phone cell on a screen whose digits set wider, and the phone cell's ring stood as a dark box.
// Three versions for Filip's pick on one board, ?poziv=1 to 3, each sized to its own number. 1 one row, the call as an outlined button
// beside Zakažite servis. 2 an action bar, the call the white primary and Zakažite servis the secondary, two equal halves. 3 the number as
// type with a pulsing mark, the two buttons under it. Until he picks, 1 shows.
const callVariant = () => {
  const v = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('poziv');
  return v === '2' || v === '3' ? Number(v) : 1;
};

function CallBlock() {
  const [v] = useState(callVariant);
  const book = (cls: string) => (
    <Link className={cls} href={ask('servis')} data-cta="service">
      <BtnInner>{pillar('servis').cta}</BtnInner>
    </Link>
  );
  if (v === 2)
    return (
      <div className="pg-in pg-call2">
        <a className="pg-c2 is-call" href={hero.service.tel} data-cta="call-service">
          <span className="pg-c2-t">
            <span className="pg-c2-l">{hero.service.label}</span>
            <span className="pg-c2-n">{hero.service.number}</span>
          </span>
          <i className="pg-c2-i is-phone" aria-hidden="true" />
        </a>
        <Link className="pg-c2 is-book" href={ask('servis')} data-cta="service">
          <span className="pg-c2-t">
            <span className="pg-c2-l">Servis po dogovoru</span>
            <span className="pg-c2-n">{pillar('servis').cta}</span>
          </span>
          <i className="pg-c2-i is-plus" aria-hidden="true" />
        </Link>
      </div>
    );
  if (v === 3)
    return (
      <div className="pg-in pg-call3">
        <a className="pg-c3" href={hero.service.tel} data-cta="call-service">
          <span className="pg-c3-l">
            <i className="pg-c3-dot" aria-hidden="true" />
            {hero.service.label}
          </span>
          <span className="pg-c3-n">{hero.service.number}</span>
        </a>
        <div className="sp-hero-acts">
          <a className="btn btn-primary btn-phone" href={hero.service.tel} data-cta="call-service">
            <BtnInner>Pozovite servis</BtnInner>
          </a>
          {book('btn btn-secondary')}
        </div>
      </div>
    );
  return (
    <div className="pg-in pg-call1">
      <a className="pg-c1" href={hero.service.tel} data-cta="call-service">
        <span className="pg-c1-t">
          <span className="pg-c1-l">{hero.service.label}</span>
          <span className="pg-c1-n">{hero.service.number}</span>
        </span>
        <i className="pg-c1-i" aria-hidden="true" />
      </a>
      {book('btn btn-primary')}
    </div>
  );
}

export function Servis() {
  useTitle('Servis viljuškara');
  return (
    <Page>
      <section className="sp-frame pg-hs pg-dark" data-ink="dark" aria-labelledby="pg-servis-h">
        <Cell span={2} className="pg-hs-text">
          <div className="pg-in">
            <p className="sp-lab">Servis</p>
            <h1 className="sp-hero-t" id="pg-servis-h">
              Servis viljuškara
            </h1>
            <p className="sp-lede">{servisCopy.text}</p>
          </div>
          <CallBlock />
        </Cell>
        <Cell span={2} className="pg-map pg-hs-map">
          <Suspense fallback={<div className="pg-map-fig" />}>
            <HeroMap />
          </Suspense>
          <p className="pg-hs-cap">{servisMap.title.join(' ')}</p>
        </Cell>
      </section>

      <section className="sp-frame pg-svc pg-rv" aria-labelledby="pg-svc-h">
        <Head id="pg-svc-h" label={pillar('servis').more} />
        {SERVICES.map((s) => (
          <Cell className="sp-feat pg-feat" key={s.name}>
            <i className={`sp-ico is-${s.icon}`} aria-hidden="true" />
            <h3 className="sp-feat-h">{s.name}</h3>
            <p className="pg-feat-t">{s.line}</p>
            {s.call ? (
              <a className="sp-more" href={hero.service.tel} data-cta="call-service">
                {hero.service.number}
              </a>
            ) : null}
          </Cell>
        ))}
        <Cell span={2} className="pg-giant">
          <div className="pg-giant-x">
            <p className="pg-giant-v">
              <Num n={300} text="300" />+
            </p>
            <p className="pg-giant-l">{servisCopy.giantLabel}</p>
          </div>
          <img src="/pages/servis-vozilo.webp" alt="Servisno vozilo Ekotehnike" loading="lazy" decoding="async" width={1400} height={661} />
        </Cell>
        <Cell span={2} className="pg-checks">
          <h3 className="pg-h3">Ispitivanje pre početka rada</h3>
          <ul className="sp-list">
            {CHECKS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Cell>
      </section>

      <Band
        id="servis-mid"
        label={hero.service.label}
        title="Viljuškar stoji? Pozovite servis."
        line={servisMap.text}
        primary={{ label: `${hero.service.label} ${hero.service.number}`, href: hero.service.tel, cta: 'call-service', phone: true }}
        secondary={{ label: pillar('servis').cta, href: ask('servis'), cta: 'service' }}
        photos={['/photos/isporuka-1.webp', '/pages/najam-flota.webp']}
      />

      <CentresMap label="Servisni centri" pic={{ src: '/pages/servis-centar.webp', alt: 'Servisni centar Ekotehnike sa viljuškarima u dvorištu, snimak iz vazduha' }} />

      <QuickAsk
        id="servis-ask"
        tema="servis"
        label="Zakazivanje"
        title="Zakažite servis ili pozovite za hitnu intervenciju."
        poruka="Potreban mi je servis viljuškara."
        cta={pillar('servis').cta}
      />
      <Places current="servis" last />
    </Page>
  );
}

// ---- Delovi ----
// The hero is the four groups the old site sold (competitive analysis, section 4) as photo tiles, each opening the form with its group
// filled in. Reference the shop's own category tiles. The lines are plain, for the client to check and fill.
const GROUPS = [
  // the client's own social post for GRI green tyres, cut below the cab and above its words (Filip 19 November, "can we get a tire img")
  { icon: 'tyre', name: 'Gume', line: 'Gume za viljuškare.', ask: 'gume', pic: '/pages/delovi-gume.webp' },
  { icon: 'battery', name: 'Baterije i punjači', line: 'Baterije i punjači za električne viljuškare.', ask: 'baterije i punjače', pic: '/pages/delovi-punjaci.webp' },
  { icon: 'fork', name: 'Priključci', line: 'Push pull i drugi priključni uređaji.', ask: 'priključke', pic: '/pages/delovi-viljuske.webp' },
  { icon: 'gear', name: 'Potrošni delovi', line: 'Delovi koji se menjaju na redovnom servisu.', ask: 'potrošne delove', pic: '/pages/delovi-setovi.webp', contain: true },
];
const PARTS_CTA = 'Zatražite ponudu za delove';

export function Delovi() {
  useTitle('Delovi za viljuškare');
  return (
    <Page>
      <section className="sp-frame pg-hd" aria-labelledby="pg-delovi-h">
        <Cell span={2} className="pg-hd-text">
          <div className="pg-in">
            <p className="sp-lab">Delovi</p>
            <h1 className="sp-hero-t" id="pg-delovi-h">
              Originalni Linde delovi
            </h1>
          </div>
        </Cell>
        <Cell span={2} className="pg-hd-r">
          <div className="pg-in">
            <p className="sp-lede">Gume, baterije i punjači, priključci i potrošni delovi za vaš viljuškar. Izaberite grupu ili nam pišite za bilo koji deo.</p>
            <div className="sp-hero-acts">
              <Link className="btn btn-primary" href={ask('delovi')} data-cta="parts">
                <BtnInner>{PARTS_CTA}</BtnInner>
              </Link>
            </div>
          </div>
        </Cell>
        {GROUPS.map((g, i) => (
          <Cell className="sp-tile pg-part" key={g.name}>
            <Link className="sp-tile-a" href={ask('delovi', `Zanima me ponuda za ${g.ask}.`)} data-cta="parts" style={{ '--i': i } as CSSProperties}>
              <span className={`sp-pic pg-part-pic${g.pic ? '' : ' is-ico'}${g.contain ? ' is-contain' : ''}`}>
                {g.pic ? <img src={g.pic} alt="" decoding="async" /> : <i className={`sp-ico is-${g.icon}`} aria-hidden="true" />}
              </span>
              <span className="pg-part-n">
                <i className={`sp-ico is-${g.icon}`} aria-hidden="true" />
                {g.name}
              </span>
              <span className="pg-go-l">{g.line}</span>
              <span className="pg-part-go">Zatražite ponudu</span>
              <i className="sp-go" aria-hidden="true" />
            </Link>
          </Cell>
        ))}
      </section>

      <Band
        id="delovi-mid"
        label="Uz servis"
        title="Tehničar dolazi sa originalnim rezervnim delovima."
        line="Za hitne intervencije pozovite servis."
        primary={{ label: PARTS_CTA, href: ask('delovi'), cta: 'parts' }}
        secondary={{ label: pillar('servis').more, href: '/servis', cta: 'service' }}
        photos={['/pages/najam-flota.webp', '/photos/isporuka-1.webp']}
      />

      <QuickAsk
        id="delovi-ask"
        tema="delovi"
        label="Ponuda za delove"
        title="Navedite model viljuškara, serijski broj i deo koji vam treba."
        poruka="Zanima me ponuda za delove."
        cta={PARTS_CTA}
      />
      <Places current="delovi" last />
    </Page>
  );
}

// ---- Kompanija ----
// The hero, the headquarters from the drone across the whole width, drifting with the scroll, the tagline in a pure white block at its
// foot, and the four figures along its bottom edge, counting up. Reference the homepage's statement band.
export function Kompanija() {
  useTitle('Kompanija');
  return (
    <Page>
      <section className="sp-frame pg-hk" aria-labelledby="pg-kompanija-h">
        <Cell span={4} className="pg-hk-c">
          <Par src="/pages/kompanija-zgrada.webp" alt="Sedište Ekotehnike sa znakovima Ekotehnika i Linde, snimak iz vazduha" focus="45% 50%" eager />
          <div className="pg-hk-words pg-in">
            <p className="sp-lab">Kompanija</p>
            <h1 className="sp-hero-t" id="pg-kompanija-h">
              {statement.rows[0]}
            </h1>
            <p className="sp-lede">{statement.rows[1]}</p>
            <div className="sp-hero-acts">
              <Link className="btn btn-primary" href={hero.quote.href} data-cta="quote">
                <BtnInner>{hero.quote.label}</BtnInner>
              </Link>
              <Link className="btn btn-secondary" href="/prodavnica">
                <BtnInner>Pogledajte modele</BtnInner>
              </Link>
            </div>
          </div>
        </Cell>
      </section>

      <Figures
        label="Ekotehnika u brojevima"
        big
        items={[
          { value: <Num n={1997} from={1950} text="1997" plain />, label: 'Godina osnivanja' },
          { value: <><Num n={1000} text="1.000" />+</>, label: 'Klijenata' },
          { value: <Num n={2} text="2" />, label: 'Servisna centra' },
          { value: 'Linde', label: 'Zvanični partner' },
        ]}
      />

      <section className="sp-frame pg-band pg-rv" aria-labelledby="pg-heart-h">
        <Cell span={2} className="pg-text">
          <h2 className="sp-lab" id="pg-heart-h">
            O nama
          </h2>
          <p className="pg-h2">Servis je srce naše firme.</p>
          <p className="sp-lede">Iz Vrčina, na južnoj ivici Beograda, naši tehničari rade sa originalnim Linde delovima.</p>
          <ul className="sp-list">
            <li>Originalni delovi, Linde delovi za svaki viljuškar</li>
            <li>Linde obuka, tehničari obučeni u Linde fabrici</li>
            <li>Servisna vozila širom Srbije</li>
          </ul>
        </Cell>
        <Cell span={2} className="pg-pic">
          <Par src="/pages/kompanija-tim.webp" alt="Tim Ekotehnike između redova viljuškara, snimak iz vazduha" focus="50% 60%" />
        </Cell>
      </section>

      <Band
        id="kompanija-mid"
        label="Šta radimo"
        title="Novi viljuškari, najam, servis i delovi."
        line="Zvanični Linde partner za Srbiju i Crnu Goru, sa servisnim vozilima širom Srbije."
        primary={{ label: hero.quote.label, href: hero.quote.href, cta: 'quote' }}
        secondary={{ label: 'Pogledajte modele', href: '/prodavnica', cta: 'shop' }}
        photos={['/pages/najam-flota.webp', '/photos/isporuka-4.webp']}
      />

      <Places current="kompanija" label="Logistička i intralogistička rešenja" />

      <CentresMap label="Gde smo" />

      <section className="sp-frame pg-field pg-rv" aria-labelledby="pg-field-h">
        <Head id="pg-field-h" label="Na terenu" note="Isporuke i rad kod klijenata" />
        <Cell span={2} className="pg-pic">
          <Par src="/pages/kompanija-isporuka.webp" alt="Linde viljuškari kod klijenta, posle isporuke" />
        </Cell>
        <Cell span={2} className="pg-pic">
          <Par src="/pages/kompanija-regali.webp" alt="Skladište klijenta sa regalima i ručnim viljuškarom" />
        </Cell>
      </section>

      <QuickAsk
        id="kompanija-ask"
        tema="kupovina"
        label="Ponuda"
        title="Zatražite ponudu za novi Linde viljuškar."
        poruka=""
        cta={hero.quote.label}
        last
      />
    </Page>
  );
}
