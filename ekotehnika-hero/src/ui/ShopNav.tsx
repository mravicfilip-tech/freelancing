// The shop's categories under Prodavnica in the top menu, Filip 18 November, "remap it to new home page + shop with categories, contact
// page and so on". By the four kinds of truck, as GROUPS in shop/data.ts, with the names and slugs of shop/catalog.json. Kept here so the
// homepage does not load the shop's catalogue, so a category renamed there is renamed here too.
import { useState, type ReactNode } from 'react';

export const SHOP_NAV: { label: string; cats: [slug: string, name: string][] }[] = [
  {
    label: 'Čeoni viljuškari',
    cats: [
      ['elektricni-ceoni-viljuskari', 'Električni čeoni viljuškari'],
      ['dizel-i-plinski-ceoni-viljuskari', 'Dizel i plinski čeoni viljuškari'],
      ['viljuskari-velike-nosivosti', 'Viljuškari velike nosivosti'],
    ],
  },
  {
    label: 'Skladišna vozila',
    cats: [
      ['regalni-viljuskari', 'Regalni viljuškari'],
      ['viljuskari-za-komisioniranje', 'Viljuškari za komisioniranje'],
      ['slagaci-paleta', 'Slagači paleta'],
      ['niskopodizna-vozila', 'Niskopodizna vozila'],
      ['viljuskari-za-uske-prolaze', 'Viljuškari za uske prolaze'],
    ],
  },
  { label: 'Tegljači', cats: [['tegljaci', 'Tegljači']] },
  { label: 'Automatizacija', cats: [['automatizovana-vozila', 'Automatizovana vozila']] },
];

// how a frame draws a link, a plain anchor on the homepage, the shop's own Link inside the shop
export type LinkFn = (href: string, children: ReactNode, className?: string, current?: boolean) => ReactNode;

// The panel under Prodavnica on a wide screen, open while the pointer or the focus is on Prodavnica or in the panel, see heroframe.css.
export function ShopSub({ link }: { link: LinkFn }) {
  return (
    <div className="hf-sub">
      <div className="hf-sub-in">
        <div className="hf-sub-gs">
          {SHOP_NAV.map((g) => (
            <div className="hf-sub-g" key={g.label}>
              <p className="hf-sub-h">{g.label}</p>
              <ul>
                {g.cats.map(([slug, name]) => (
                  <li key={slug}>{link(`/prodavnica/${slug}`, name)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hf-sub-foot">{link('/prodavnica/svi-modeli', 'Svi modeli', 'hf-sub-all')}</div>
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
        {SHOP_NAV.flatMap((g) => g.cats).map(([slug, name]) => (
          <li key={slug}>{link(`/prodavnica/${slug}`, name)}</li>
        ))}
        <li>{link('/prodavnica/svi-modeli', 'Svi modeli')}</li>
      </ul>
    </li>
  );
}
