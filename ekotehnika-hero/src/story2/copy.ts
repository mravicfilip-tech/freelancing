// Every line the storyline 2 shell puts on screen, Serbian Latin, sentence case.
// Sources are src/content.ts, the hero brief and the competitive analysis in
// studio/clients/ekotehnika/briefs. A line marked // dummy is new, written for this story, Filip to correct.
// Every link stays on ekotehnika.rs or is a tel link. The country wording is Srbija i Crna Gora, never the region.
import { SITE, hero, pillars, trust } from '../content';

export type Tile = { big: string; small: string; href?: string };
export type Cta = { label: string; href: string };

export const kompanija = {
  c1: {
    kicker: 'Kompanija', // dummy
    title: 'Od 1997. na terenu širom Srbije.', // dummy, built from the trust strip
    text: 'Zvanični Linde partner za Srbiju i Crnu Goru, sa servisnim vozilima širom Srbije.', // trust strip and kicker
    tiles: [
      { big: trust[0].text, small: 'Počeli smo kao servis viljuškara' }, // analysis, founded 1997 as a repair shop
      { big: trust[1].text, small: 'Poverili su nam svoje viljuškare' }, // dummy
      { big: 'Linde', small: 'Zvanični partner za Srbiju i Crnu Goru' }, // trust strip
    ] satisfies Tile[],
  },
  r: {
    kicker: 'Kompanija', // dummy
    title: 'Servis je srce naše firme.', // analysis, the site calls the service centre the heart of the company
    text: 'Iz Vrčina, na južnoj ivici Beograda, naši tehničari rade sa originalnim Linde delovima.', // analysis, dummy wording
    tiles: [
      { big: 'Vrčin', small: 'Servisni centar i sedište firme' }, // analysis, dummy wording
      { big: 'Originalni delovi', small: 'Linde delovi za svaki viljuškar' }, // analysis, dummy wording
      { big: 'Linde obuka', small: 'Tehničari obučeni u Linde fabrici' }, // analysis, dummy wording
    ] satisfies Tile[],
  },
};

export const prodaja = {
  kicker: 'Prodaja', // dummy
  title: 'Prodaja Linde viljuškara', // dummy
  text: '96 Linde modela, ponuda po vašoj meri.', // pillars, novi
  detail: 'Novi i polovni viljuškari za svaki posao u skladištu.', // hero.sub, shortened
  cta: { label: pillars[0].cta, href: pillars[0].href } satisfies Cta,
  tiles: [
    { big: 'Čeoni viljuškari', small: 'Linde H20 do H35', icon: 'counter' },
    { big: 'Retrak viljuškari', small: 'Za uske hodnike', icon: 'reach' }, // dummy
    { big: 'Paletari i slagači', small: 'Linde MT15 C', icon: 'pallet' },
    { big: 'Komisioneri', small: 'Linde N20', icon: 'picker' },
  ] as (Tile & { icon: string })[],
};

export const servis = {
  kicker: 'Servis', // dummy
  title: 'Servis viljuškara', // dummy
  text: 'Redovno održavanje, hitne intervencije, zakonski pregledi i ugovori o punom servisu.', // pillars, servis, plus the analysis
  cta: { label: pillars[2].cta, href: pillars[2].href } satisfies Cta,
  tiles: [
    { big: hero.service.label, small: hero.service.number, href: hero.service.tel },
    { big: '300+', small: 'tipova vozila i drugih marki' }, // analysis
  ] as Tile[],
};

export const najam = {
  kicker: 'Najam', // dummy
  title: 'Najam viljuškara', // dummy
  text: 'Od nekoliko sati do godinu dana, u ponudi je 84 modela za najam.', // pillars, najam, and the 84 rental models in the analysis
  cta: { label: pillars[1].cta, href: pillars[1].href } satisfies Cta,
  tiles: [
    { big: '24 sata', small: 'Isporuka za 24 sata' },
    { big: 'Besplatna dostava', small: 'Dostava i preuzimanje bez doplate' },
    { big: 'Održavanje', small: 'Održavanje je uključeno' },
    { big: 'Zamena', small: 'Zamena viljuškara tokom najma' },
  ] as Tile[],
};

export const automatizacija = {
  word: 'automatizacija',
  text: 'Mali roboti nose kutije, a vi radite posao.', // dummy
};

export const proizvodi = {
  kicker: 'Proizvodi', // dummy
  title: 'Glavni proizvodi', // dummy
  items: [
    { name: 'Linde MT15 C', type: 'Elektro paletar', icon: 'pallet' }, // brief, the promo truck
    { name: 'Linde H20 do H35', type: 'Čeoni viljuškari', icon: 'counter' }, // brief
    { name: 'Linde L14 do L16', type: 'Slagači', icon: 'stacker' }, // dummy type
    { name: 'Linde D12 do D14', type: 'Komisioneri', icon: 'picker' }, // dummy type
    { name: 'Linde N20', type: 'Komisioneri', icon: 'picker' }, // brief, the order picker
  ],
  // Ekotehnika's own delivery photos from Filip's Drive, ground level, no drone footage.
  photos: [
    { src: '/photos/isporuka-1.webp', alt: 'Linde E20 EVO, oznaka na boku viljuškara' },
    { src: '/photos/isporuka-2.webp', alt: 'Viljuškar se spušta sa kamiona pri isporuci' },
    { src: '/photos/isporuka-3.webp', alt: 'Linde viljuškar na kamionu, pred istovar' },
    { src: '/photos/isporuka-4.webp', alt: 'Linde viljuškar u kamionu, spreman za isporuku' },
  ],
  cta: { label: pillars[0].more, href: pillars[0].href } satisfies Cta,
};

export const footer = {
  nav: [
    { label: 'Novi', href: `${SITE}/viljuskari/` },
    { label: 'Polovni', href: `${SITE}/polovni-linde-viljuskari/` },
    { label: 'Najam', href: `${SITE}/iznajmljivanje-viljuskara-cena/` },
    { label: 'Servis', href: `${SITE}/servis/odrzavanje-i-popravka/` },
    { label: 'Kontakt', href: `${SITE}/kontakt/` },
  ],
  address: ['Moše Pijade 17b', '11224 Vrčin'],
  phones: [
    { label: hero.sales.label, number: hero.sales.number, tel: hero.sales.tel },
    { label: hero.service.label, number: hero.service.number, tel: hero.service.tel },
  ],
  emails: ['info@ekotehnika.rs', 'servis@ekotehnika.rs'],
  copyright: '© 2026 Ekotehnika viljuškari d.o.o.',
  lede: 'Linde viljuškari. Prodaja, najam i servis na jednom mestu.', // hero headline
};
