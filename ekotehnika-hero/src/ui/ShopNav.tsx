// The site's mega menu, Filip 18 November, "fix this menu, remap it, add new links, show categories, create a mega menu etc". Two panels
// open from the top row on a wide screen. Prodavnica shows the shop's ten categories by the four kinds of truck, each with its picture and
// how many models it holds, and the one offer the old site ran. Usluge shows Najam, Servis, Delovi and Hitan servis, each with its own
// line from content.ts, and Polovni under them as a link to ekotehnika.rs. The categories are as GROUPS in shop/data.ts with the names, counts and faces of shop/catalog.json, kept here so the
// homepage does not load the shop's catalogue, so a category renamed or recounted there is changed here too.
import { useState, type ReactNode } from 'react';
import { hero, pillars, SITE } from '../content';

type Cat = { slug: string; name: string; count: number; face: string };
export const SHOP_NAV: { label: string; cats: Cat[] }[] = [
  {
    label: 'Čeoni viljuškari',
    cats: [
      { slug: 'elektricni-ceoni-viljuskari', name: 'Električni čeoni viljuškari', count: 14, face: 'x20-do-x35' },
      { slug: 'dizel-i-plinski-ceoni-viljuskari', name: 'Dizel i plinski čeoni viljuškari', count: 4, face: 'h20-do-h35' },
      { slug: 'viljuskari-velike-nosivosti', name: 'Viljuškari velike nosivosti', count: 3, face: 'h100-do-h180-d' },
    ],
  },
  {
    label: 'Skladišna vozila',
    cats: [
      { slug: 'regalni-viljuskari', name: 'Regalni viljuškari', count: 5, face: 'r14-do-r25' },
      { slug: 'viljuskari-za-komisioniranje', name: 'Viljuškari za komisioniranje', count: 7, face: 'n20-do-n25-c' },
      { slug: 'slagaci-paleta', name: 'Slagači paleta', count: 17, face: 'l14-do-l20' },
      { slug: 'niskopodizna-vozila', name: 'Niskopodizna vozila', count: 13, face: 't20-do-t25-sp' },
      { slug: 'viljuskari-za-uske-prolaze', name: 'Viljuškari za uske prolaze', count: 2, face: 'k-5231' },
    ],
  },
  {
    label: 'Tegljači i automatizacija',
    cats: [
      { slug: 'tegljaci', name: 'Tegljači', count: 13, face: 'p20' },
      { slug: 'automatizovana-vozila', name: 'Automatizovana vozila', count: 11, face: 'r-matic' },
    ],
  },
];
const ALL = SHOP_NAV.reduce((n, g) => n + g.cats.reduce((m, c) => m + c.count, 0), 0);

// how a frame draws a link, a plain anchor on the homepage, the shop's own Link inside the shop
export type LinkFn = (href: string, children: ReactNode, className?: string, current?: boolean) => ReactNode;

const modela = (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'model' : 'modela'}`;

// Prodavnica's panel, the categories by kind, each a row with its picture, then the offer and the way to all the models.
export function ShopMega({ link }: { link: LinkFn }) {
  return (
    <div className="hf-sub hf-mega">
      <div className="hf-sub-in">
        <div className="hf-mega-cols">
          {SHOP_NAV.map((g) => (
            <div className="hf-sub-g" key={g.label}>
              <p className="hf-sub-h">{g.label}</p>
              <ul>
                {g.cats.map((c) => (
                  <li key={c.slug}>
                    {link(
                      `/prodavnica/${c.slug}`,
                      <>
                        <img className="hf-mega-pic" src={`/shop/${c.face}-s.webp`} alt="" loading="lazy" decoding="async" width={48} height={48} />
                        <span className="hf-mega-t">
                          <span className="hf-mega-n">{c.name}</span>
                          <span className="hf-mega-c">{modela(c.count)}</span>
                        </span>
                      </>,
                      'hf-mega-row',
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* the offer of the old site's first slide, as the shop's hero shows it, Filip to confirm the price still holds */}
          <div className="hf-mega-promo">
            {link(
              '/prodavnica/niskopodizna-vozila/mt15-c',
              <>
                <span className="hf-mega-promo-pic">
                  <img src="/shop/mt15-c-s.webp" alt="" loading="lazy" decoding="async" width={240} height={180} />
                </span>
                <span className="hf-mega-tag">Akcija</span>
                <span className="hf-mega-promo-t">Linde MT15 C</span>
                <span className="hf-mega-promo-v">1.390 €</span>
              </>,
              'hf-mega-promo-a',
            )}
          </div>
        </div>
        <div className="hf-sub-foot">
          {link('/prodavnica/svi-modeli', `Svi modeli, ${ALL}`, 'hf-sub-all')}
          {link('/kontakt?tema=kupovina', hero.quote.label, 'hf-sub-all')}
        </div>
      </div>
    </div>
  );
}

// What Ekotehnika does besides selling new trucks. Najam, Servis and Delovi are pages of their own (Filip 19 November, briefs/pages/plan.md),
// Hitan servis calls. Polovni is the one page that stays on ekotehnika.rs, the used trucks are listed there alone, and with Delovi in the
// panel it moves to a line under the four cards, so the panel keeps its width under the menu.
const pillar = (id: string) => pillars.find((p) => p.id === id)!;
export const SERVICES = [
  { id: 'najam', icon: 'calendar', name: pillar('najam').name, line: pillar('najam').line, href: '/najam', go: pillar('najam').more },
  { id: 'servis', icon: 'wrench', name: pillar('servis').name, line: pillar('servis').line, href: '/servis', go: pillar('servis').more },
  { id: 'delovi', icon: 'gear', name: 'Delovi', line: 'Originalni Linde delovi za vaš viljuškar.', href: '/delovi', go: 'Grupe delova' },
  { id: 'hitan', icon: 'phone', name: hero.service.label, line: 'Za hitne intervencije pozovite servis.', href: hero.service.tel, go: hero.service.number },
];
const POLOVNI = { line: pillar('polovni').line, href: `${SITE}/polovni-linde-viljuskari/`, label: 'Polovni na ekotehnika.rs' };

export function ServicesMega({ link }: { link: LinkFn }) {
  return (
    <div className="hf-sub hf-mega is-services">
      <div className="hf-sub-in">
        <ul className="hf-svc">
          {SERVICES.map((s) => (
            <li key={s.id}>
              {link(
                s.href,
                <>
                  <i className={`hf-ico is-${s.icon}`} aria-hidden="true" />
                  <span className="hf-svc-n">{s.name}</span>
                  <span className="hf-svc-l">{s.line}</span>
                  <span className="hf-svc-go">{s.go}</span>
                </>,
                'hf-svc-a',
              )}
            </li>
          ))}
        </ul>
        <div className="hf-sub-foot hf-svc-foot">
          <span className="hf-svc-l">{POLOVNI.line}</span>
          {link(POLOVNI.href, POLOVNI.label, 'hf-sub-all')}
        </div>
      </div>
    </div>
  );
}

// Prodavnica in the menu sheet of a phone, its row and a button that opens the categories under it.
export function ShopSheetItem({ label, href, current, link }: { label: string; href: string; current?: boolean; link: LinkFn }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="hf-menu-shop">
      <div className="hf-menu-row">
        {link(href, label, undefined, current)}
        <button type="button" className="hf-menu-more" aria-expanded={open} aria-controls="hf-menu-cats" onClick={() => setOpen((x) => !x)}>
          <span className="sr-only">Kategorije prodavnice</span>
        </button>
      </div>
      <ul className="hf-menu-cats" id="hf-menu-cats" hidden={!open}>
        {SHOP_NAV.flatMap((g) => g.cats).map((c) => (
          <li key={c.slug}>{link(`/prodavnica/${c.slug}`, c.name)}</li>
        ))}
        <li>{link('/prodavnica/svi-modeli', 'Svi modeli')}</li>
      </ul>
    </li>
  );
}
