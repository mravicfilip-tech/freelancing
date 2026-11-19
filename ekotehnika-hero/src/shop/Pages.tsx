// The service pages and the company page, Filip 19 November, "Need to work on the service pages and about pages ... So it's interesting.
// Also to the service pages add parts page (Delovi)". The plan is briefs/pages/plan.md, every fact and its source briefs/pages/content.md.
// Najam, Servis, Delovi and Kompanija, each built of the shop's own parts, the hero of words and a collage, rows of cells between the five
// verticals, and each ends on its own topic of the form. The words are the client's own where the live site or the old site has them,
// the rest are short plain lines for the client to check. No worldwide Linde figures, no hours, no response times.
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { hero, pillars } from '../content';
import { najam as najamCopy, servis as servisCopy, statement } from '../story2/copy';
import { SERVICES as MENU } from '../ui/ShopNav';
import { CATEGORIES, PRODUCTS } from './data';
import { Link } from './route';
import { Cap, Cell } from './parts';
// the shop's styles first, so these come after them and win where a rule ties (Shop.tsx imports this file before shop.css)
import './shop.css';
import './pages.css';

const Centres = lazy(() => import('./Centres'));

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Ekotehnika`;
  }, [title]);
}

// a link to the form with its topic and a first line of the message filled in, which the visitor can change
const ask = (tema: string, poruka?: string) => `/kontakt?tema=${tema}${poruka ? `&poruka=${encodeURIComponent(poruka)}` : ''}`;
const pillar = (id: string) => pillars.find((p) => p.id === id)!;

type Pic = { src: string; alt?: string; focus?: string };

function PageHero({ id, kicker, title, line, extra, acts, main, second, tile }: {
  id: string;
  kicker: string;
  title: string;
  line: string;
  extra?: ReactNode;
  acts: ReactNode;
  main: Pic;
  second?: Pic;
  tile?: Pic;
}) {
  return (
    <section className="sp-frame sp-hero pg-hero" aria-labelledby={`pg-${id}-h`}>
      <Cell span={2} className="sp-hero-text">
        <div className="sp-hero-slide">
          <p className="sp-lab">{kicker}</p>
          <h1 className="sp-hero-t" id={`pg-${id}-h`}>
            {title}
          </h1>
          <p className="sp-lede">{line}</p>
          {extra}
          <div className="sp-hero-acts">{acts}</div>
        </div>
      </Cell>
      <Cell span={2} className="sp-hero-pic">
        <div className="sp-hero-imgs">
          <div className="sp-col is-in">
            <div className="sp-col-main">
              <img src={main.src} alt={main.alt ?? ''} style={main.focus ? { objectPosition: main.focus } : undefined} decoding="async" draggable={false} />
            </div>
            {second ? (
              <div className="sp-col-second">
                <img src={second.src} alt={second.alt ?? ''} style={second.focus ? { objectPosition: second.focus } : undefined} decoding="async" draggable={false} />
              </div>
            ) : null}
            {tile ? (
              <div className="sp-col-tile">
                <img src={tile.src} alt={tile.alt ?? ''} decoding="async" draggable={false} />
              </div>
            ) : null}
          </div>
        </div>
      </Cell>
      <Cap />
    </section>
  );
}

// four figures in the four frames, the homepage's facts
function Figures({ label, items }: { label: string; items: { value: ReactNode; label: string }[] }) {
  return (
    <section className="sp-frame pg-figs" aria-label={label}>
      {items.map((f) => (
        <Cell className="pg-fig" key={f.label}>
          <p className="pg-fig-v">{f.value}</p>
          <p className="pg-fig-l">{f.label}</p>
        </Cell>
      ))}
      <Cap />
    </section>
  );
}

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

function CentresMap({ label }: { label: string }) {
  return (
    <Suspense fallback={<section className="sp-frame pg-centres" aria-busy="true" style={{ minHeight: 680 }} />}>
      <Centres label={label} />
    </Suspense>
  );
}

// The close of a page, one row, its line and its own topic of the form. The footer under it carries both numbers, both e-mails and the
// address, so the close does not repeat them.
function Close({ id, label, title, act }: { id: string; label: string; title: string; act: ReactNode }) {
  return (
    <section className="sp-frame pg-close" aria-labelledby={`pg-${id}-close`}>
      <Cell span={4} className="pg-close-c">
        <div>
          <h2 className="sp-lab" id={`pg-${id}-close`}>
            {label}
          </h2>
          <p className="pg-h2">{title}</p>
        </div>
        <div className="pg-act">{act}</div>
      </Cell>
      <Cap />
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

function Places({ current, label = 'Pogledajte i', note }: { current: string; label?: string; note?: string }) {
  const items = PLACES.filter((p) => p.id !== current).slice(0, 4);
  return (
    <section className="sp-frame pg-go-row" aria-labelledby="pg-go-h">
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
      <Cap />
    </section>
  );
}

// ---- Najam ----
const TERMS = najamCopy.terms.cells.map((c) => c.figure);

export function Najam() {
  useTitle('Najam viljuškara');
  return (
    <>
      <PageHero
        id="najam"
        kicker="Najam"
        title="Najam viljuškara"
        line={pillar('najam').line}
        acts={
          <>
            <Link className="btn btn-primary" href={ask('najam')} data-cta="rent">
              <BtnInner>{pillar('najam').cta}</BtnInner>
            </Link>
            <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales">
              <BtnInner>
                {hero.sales.label} <span className="num">{hero.sales.number}</span>
              </BtnInner>
            </a>
          </>
        }
        main={{ src: '/photos/isporuka-4.webp', alt: 'Linde viljuškar u kamionu, pred isporuku', focus: '50% 60%' }}
        second={{ src: '/photos/isporuka-2.webp', focus: '50% 50%' }}
      />

      <Figures
        label="Najam ukratko"
        items={najamCopy.facts.map((f) => ({ value: f.suffix ? <>{f.figure} <span>{f.suffix.trim()}</span></> : f.figure, label: f.label }))}
      />

      <section className="sp-frame pg-terms" aria-labelledby="pg-terms-h">
        <Head id="pg-terms-h" label="Kratkoročni i dugoročni najam" />
        <Cell span={2} className="pg-term">
          <i className="sp-ico is-calendar" aria-hidden="true" />
          <h3 className="pg-h3">Kratkoročni najam</h3>
          <p className="pg-term-v">Od nekoliko sati do godinu dana</p>
          {/* the old Najam page, its words made short, for the client to check */}
          <p className="pg-term-t">Za sezonski špic, veliki broj narudžbina ili događaj. I kao jednostavan način da viljuškar upoznate pre kupovine.</p>
          <div className="pg-term-act">
            <Link className="btn btn-secondary" href={ask('najam', 'Zanima me kratkoročni najam.')} data-cta="rent">
              <BtnInner>{pillar('najam').cta}</BtnInner>
            </Link>
          </div>
        </Cell>
        <Cell span={2} className="pg-term">
          <i className="sp-ico is-deal" aria-hidden="true" />
          <h3 className="pg-h3">Dugoročni najam</h3>
          <p className="pg-term-v">
            Od {TERMS[0]} do {TERMS[TERMS.length - 1]} meseci
          </p>
          <p className="pg-term-t">Izaberite period i pošaljite upit.</p>
          <div className="pg-term-act">
            <div className="pg-months" role="group" aria-label="Period dugoročnog najma">
              {TERMS.map((m) => (
                <Link className="pg-month" href={ask('najam', `Zanima me dugoročni najam na ${m} meseci.`)} data-cta="rent" key={m}>
                  <b>{m}</b>
                  <span>meseci</span>
                </Link>
              ))}
            </div>
          </div>
        </Cell>
        <Cap />
      </section>

      <section className="sp-frame pg-band" aria-labelledby="pg-which-h">
        <Cell span={2} className="pg-pic">
          <img src="/pages/najam-flota.webp" alt="Redovi Linde viljuškara, snimak iz vazduha" loading="lazy" decoding="async" />
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
        <Cap />
      </section>

      <Close
        id="najam"
        label="Ponuda za najam"
        title="Recite nam šta vam treba i na koliko dugo."
        act={
          <Link className="btn btn-primary" href={ask('najam')} data-cta="rent">
            <BtnInner>{pillar('najam').cta}</BtnInner>
          </Link>
        }
      />
      <Places current="najam" />
    </>
  );
}

// ---- Servis ----
// the four services in the live line's words, each line the old service page made short, for the client to check
const SERVICES = [
  { icon: 'calendar', name: 'Redovno održavanje', line: 'Servis u propisanim intervalima, pre nego što kvar zaustavi rad.' },
  { icon: 'siren', name: 'Hitne intervencije', line: 'Jedan poziv je dovoljan. Tehničar dolazi sa originalnim rezervnim delovima.', call: true },
  { icon: 'clipboard', name: 'Zakonski pregledi', line: 'Propisani bezbednosni pregledi, sa potpunom servisnom dokumentacijom.' },
  { icon: 'deal', name: 'Ugovori o punom servisu', line: 'Jedan ugovor pokriva sve neophodne mere održavanja.' },
];
// the old service page's tabs, "Ispitivanje pre početka rada"
const CHECKS = ['Konstrukcija vozila i vozni mehanizam', 'Motor, baterija i punjači', 'Hidraulika i tečnosti', 'Elektrika', 'Sistem za prihvat tereta'];

export function Servis() {
  useTitle('Servis viljuškara');
  return (
    <>
      <PageHero
        id="servis"
        kicker="Servis"
        title="Servis viljuškara"
        line={servisCopy.text}
        extra={
          <a className="pg-hot" href={hero.service.tel} data-cta="call-service">
            <span className="sp-lab">{hero.service.label}</span>
            <span className="pg-hot-n">{hero.service.number}</span>
          </a>
        }
        acts={
          <Link className="btn btn-primary" href={ask('servis')} data-cta="service">
            <BtnInner>{pillar('servis').cta}</BtnInner>
          </Link>
        }
        main={{ src: '/pages/servis-centar.webp', alt: 'Servisni centar Ekotehnike sa viljuškarima u dvorištu, snimak iz vazduha', focus: '62% 50%' }}
        second={{ src: '/photos/isporuka-1.webp', focus: '50% 40%' }}
      />

      <section className="sp-frame pg-svc" aria-labelledby="pg-svc-h">
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
            <p className="pg-giant-v">{servisCopy.giant}</p>
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
        <Cap />
      </section>

      <CentresMap label="Servisni centri" />

      <Close
        id="servis"
        label="Zakazivanje"
        title="Zakažite servis ili pozovite za hitnu intervenciju."
        act={
          <Link className="btn btn-primary" href={ask('servis')} data-cta="service">
            <BtnInner>{pillar('servis').cta}</BtnInner>
          </Link>
        }
      />
      <Places current="servis" />
    </>
  );
}

// ---- Delovi ----
// the groups the old site sold (competitive analysis, section 4), the lines plain for the client to check and fill
const GROUPS = [
  { icon: 'tyre', name: 'Gume', line: 'Gume za viljuškare.', ask: 'gume' },
  { icon: 'battery', name: 'Baterije i punjači', line: 'Baterije i punjači za električne viljuškare.', ask: 'baterije i punjače' },
  { icon: 'fork', name: 'Priključci', line: 'Push pull i drugi priključni uređaji.', ask: 'priključke' },
  { icon: 'gear', name: 'Potrošni delovi', line: 'Delovi koji se menjaju na redovnom servisu.', ask: 'potrošne delove' },
];
const PARTS_CTA = 'Zatražite ponudu za delove';
// the menu's line for Hitan servis, ui/ShopNav.tsx
const SERVICES_LINE = 'Za hitne intervencije pozovite servis.';

export function Delovi() {
  useTitle('Delovi za viljuškare');
  return (
    <>
      <PageHero
        id="delovi"
        kicker="Delovi"
        title="Originalni Linde delovi"
        line="Gume, baterije i punjači, priključci i potrošni delovi za vaš viljuškar."
        acts={
          <Link className="btn btn-primary" href={ask('delovi')} data-cta="parts">
            <BtnInner>{PARTS_CTA}</BtnInner>
          </Link>
        }
        main={{ src: '/pages/delovi-viljuske.webp', alt: 'Linde viljuške poređane na paleti', focus: '50% 40%' }}
        tile={{ src: '/pages/delovi-punjaci.webp', alt: 'Punjači sa oznakom Ekotehnike' }}
      />

      <section className="sp-frame pg-parts" aria-labelledby="pg-parts-h">
        <Head id="pg-parts-h" label="Grupe delova" />
        {GROUPS.map((g) => (
          <Cell className="sp-feat pg-feat" key={g.name}>
            <i className={`sp-ico is-${g.icon}`} aria-hidden="true" />
            <h3 className="sp-feat-h">{g.name}</h3>
            <p className="pg-feat-t">{g.line}</p>
            <Link className="sp-more" href={ask('delovi', `Zanima me ponuda za ${g.ask}.`)} data-cta="parts">
              {PARTS_CTA}
            </Link>
          </Cell>
        ))}
        <Cap />
      </section>

      <section className="sp-frame pg-band" aria-labelledby="pg-kit-h">
        <Cell span={2} className="pg-pic">
          <img src="/pages/delovi-setovi.webp" alt="Linde servisni set, filteri, kaiševi i potrošni delovi" loading="lazy" decoding="async" style={{ objectFit: 'contain', background: 'var(--white)' }} />
        </Cell>
        <Cell span={2} className="pg-text">
          <h2 className="sp-lab" id="pg-kit-h">
            Uz servis
          </h2>
          {/* the old service page, "jedan tehničar će krenuti na put sa potrebnim originalnim rezervnim delovima" */}
          <p className="pg-h2">Tehničar dolazi sa originalnim rezervnim delovima.</p>
          <p className="sp-lede">{SERVICES_LINE}</p>
          <div className="pg-act">
            <Link className="btn btn-secondary" href="/servis">
              <BtnInner>{pillar('servis').more}</BtnInner>
            </Link>
          </div>
        </Cell>
        <Cap />
      </section>

      <Close
        id="delovi"
        label="Ponuda za delove"
        title="Navedite model viljuškara, serijski broj i deo koji vam treba."
        act={
          <Link className="btn btn-primary" href={ask('delovi')} data-cta="parts">
            <BtnInner>{PARTS_CTA}</BtnInner>
          </Link>
        }
      />
      <Places current="delovi" />
    </>
  );
}

// ---- Kompanija ----
export function Kompanija() {
  useTitle('Kompanija');
  return (
    <>
      <PageHero
        id="kompanija"
        kicker="Kompanija"
        title={statement.rows[0]}
        line={statement.rows[1]}
        acts={
          <>
            <Link className="btn btn-primary" href={hero.quote.href} data-cta="quote">
              <BtnInner>{hero.quote.label}</BtnInner>
            </Link>
            <Link className="btn btn-secondary" href="/prodavnica">
              <BtnInner>Pogledajte modele</BtnInner>
            </Link>
          </>
        }
        main={{ src: '/pages/kompanija-zgrada.webp', alt: 'Sedište Ekotehnike sa znakovima Ekotehnika i Linde, snimak iz vazduha', focus: '40% 50%' }}
        second={{ src: '/pages/kompanija-tim.webp', alt: 'Tim Ekotehnike između redova viljuškara, snimak iz vazduha', focus: '50% 60%' }}
      />

      <Figures
        label="Ekotehnika u brojevima"
        items={[
          { value: '1997', label: 'Godina osnivanja' },
          { value: '1.000+', label: 'Klijenata' },
          { value: '2', label: 'Servisna centra' },
          { value: 'Linde', label: 'Zvanični partner' },
        ]}
      />

      <section className="sp-frame pg-band" aria-labelledby="pg-heart-h">
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
          <img src="/pages/najam-flota.webp" alt="Redovi Linde viljuškara u dvorištu Ekotehnike, snimak iz vazduha" loading="lazy" decoding="async" />
        </Cell>
        <Cap />
      </section>

      <Places current="kompanija" label="Logistička i intralogistička rešenja" note="Zvanični Linde partner za Srbiju i Crnu Goru, sa servisnim vozilima širom Srbije." />

      <CentresMap label="Gde smo" />

      <section className="sp-frame pg-field" aria-labelledby="pg-field-h">
        <Head id="pg-field-h" label="Na terenu" note="Isporuke i rad kod klijenata" />
        <Cell span={2} className="pg-pic">
          <img src="/pages/kompanija-isporuka.webp" alt="Linde viljuškari kod klijenta, posle isporuke" loading="lazy" decoding="async" />
        </Cell>
        <Cell span={2} className="pg-pic">
          <img src="/pages/kompanija-regali.webp" alt="Skladište klijenta sa regalima i ručnim viljuškarom" loading="lazy" decoding="async" />
        </Cell>
        <Cap />
      </section>

      <Close
        id="kompanija"
        label="Ponuda"
        title="Zatražite ponudu za novi Linde viljuškar."
        act={
          <Link className="btn btn-primary" href={hero.quote.href} data-cta="quote">
            <BtnInner>{hero.quote.label}</BtnInner>
          </Link>
        }
      />
    </>
  );
}
