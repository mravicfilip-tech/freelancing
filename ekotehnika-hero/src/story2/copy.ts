// Every line the storyline 2 shell puts on screen, Serbian Latin, sentence case.
// Sources are src/content.ts, the hero brief and the competitive analysis in
// studio/clients/ekotehnika/briefs. A line marked // dummy is new, written for this story, Filip to correct.
// Titles are written as lines, so each line can sit in its own wipe mask. No colons or dashes in a headline.
// Every link stays on ekotehnika.rs or is a tel or mailto link. The country wording is Srbija i Crna Gora.
import { SITE, hero, pillars, trust } from '../content';

export type Cta = { label: string; href: string };
// One cell of a spec row. count runs the figure up from 0, prefix and suffix stay as they are.
export type Fact = { figure: string; count?: number; suffix?: string; label: string; note?: string; href?: string };
export type Marker = { n: string; name: string };

export const markers = {
  c1: { n: '01', name: 'Kompanija' }, // dummy
  r: { n: '02', name: 'Kompanija' }, // dummy
  p: { n: '03', name: 'Prodaja' }, // dummy
  s: { n: '04', name: 'Servis' }, // dummy
  n: { n: '05', name: 'Najam' }, // dummy
  at: { n: '06', name: 'Automatizacija' }, // dummy
} satisfies Record<string, Marker>;

// The corner label of the grid and the section counter on the right edge.
export const frame = {
  coords: '44.66 N 20.44 E', // dummy
  place: 'Vrčin', // dummy
  total: '06',
};

export const hero2 = {
  marker: hero.kicker,
  // Two lines of the brief headline, the first at display size and the second as the lede under it.
  title: hero.headline[0],
  lede: hero.headline[1],
  quote: hero.quote,
};

export const kompanija = {
  c1: {
    title: ['Od 1997. na terenu', 'širom Srbije.'], // dummy, built from the trust strip
    text: 'Zvanični Linde partner za Srbiju i Crnu Goru, sa servisnim vozilima širom Srbije.', // trust strip and kicker
    facts: [
      { figure: '1997', label: 'Godina osnivanja' }, // analysis, founded 1997 as a repair shop, label dummy
      { figure: '1.000+', count: 1000, suffix: '+', label: 'Klijenata' }, // trust strip
      { figure: 'Linde', label: 'Zvanični partner' }, // trust strip
    ] satisfies Fact[],
  },
  r: {
    title: ['Servis je srce', 'naše firme.'], // analysis, the site calls the service centre the heart of the company
    text: 'Iz Vrčina, na južnoj ivici Beograda, naši tehničari rade sa originalnim Linde delovima.', // analysis, dummy wording
    list: [
      { label: 'Vrčin', line: 'Servisni centar i sedište firme' }, // analysis, dummy wording
      { label: 'Originalni delovi', line: 'Linde delovi za svaki viljuškar' }, // analysis, dummy wording
      { label: 'Linde obuka', line: 'Tehničari obučeni u Linde fabrici' }, // analysis, dummy wording
    ],
  },
};

// The four tabs of Prodaja. The model range and the nosivost follow the Linde model designation, where the number
// is the nominal load in tenths of a tonne. // dummy until Ekotehnika confirms against the data sheets.
// size is the cut out file in its own pixels. a, b and c are marked parts in those pixels, a the mast badge or the nearest
// plate for the range, b a fork tine for the capacity and c the plate on the body for the model shown. The shell maps them to the
// screen through the fitted image, see PPane in shell/panes.tsx. model is the designation already in the alt text.
export const prodaja = {
  title: ['Prodaja Linde', 'viljuškara'], // dummy
  text: '96 Linde modela, ponuda po vašoj meri.', // pillars, novi
  cta: { label: pillars[0].cta, href: pillars[0].href } satisfies Cta,
  callouts: ['Raspon modela', 'Nosivost', 'Na slici'], // dummy
  tabs: [
    {
      name: 'Čeoni viljuškari',
      range: 'Linde H20 do H35',
      cap: '2,0 do 3,5 t',
      model: 'Linde H30 D', // alt text
      img: '/products/ceoni-dizel-h30d.webp',
      alt: 'Linde H30 D čeoni viljuškar sa dizel motorom',
      size: [1200, 895],
      a: [497, 142], // the Linde badge on the mast
      b: [255, 832], // the front fork tine
      c: [845, 566], // the H30 plate on the door
    },
    {
      name: 'Retrak viljuškari',
      range: 'Linde R14 do R25',
      cap: '1,4 do 2,5 t',
      model: 'Linde R16', // alt text
      img: '/products/retrak-r16.webp',
      alt: 'Linde R16 retrak viljuškar za uske hodnike',
      size: [794, 1088],
      a: [520, 308], // the Linde badge on the mast roller
      b: [235, 1018], // the front fork tine
      c: [667, 628], // the Linde plate on the body
    },
    {
      name: 'Paletari i slagači',
      range: 'Linde T20 do T25',
      cap: '2,0 do 2,5 t',
      model: 'Linde T20 R', // alt text
      img: '/products/paletar-t20r.webp',
      alt: 'Linde T20 R električni paletar',
      size: [811, 721],
      a: [700, 180], // the red rear cover, no badge shows on this truck
      b: [215, 568], // the upper fork tine
      c: [590, 390], // the battery door
    },
    {
      name: 'Komisioneri',
      range: 'Linde N20 do N25 C',
      cap: '2,0 do 2,5 t',
      model: 'Linde N20 C', // alt text
      img: '/products/komisioner-n20c.webp',
      alt: 'Linde N20 C komisioner',
      size: [1200, 712],
      a: [930, 135], // the display on the operator deck
      b: [330, 588], // the upper fork tine
      c: [883, 330], // the red side frame
    },
  ],
};

export const servis = {
  title: ['Servis', 'viljuškara'], // dummy
  text: 'Redovno održavanje, hitne intervencije, zakonski pregledi i ugovori o punom servisu.', // pillars, servis, plus the analysis
  cta: { label: pillars[2].cta, href: pillars[2].href } satisfies Cta,
  giant: '300+', // analysis
  giantLabel: 'tipova vozila i drugih marki', // analysis
  dataLabel: hero.service.label,
  dataNumber: hero.service.number,
  dataTel: hero.service.tel,
};

// The servis map, round 5, Filip 14 October, "Curug and Vrcin are the two service locations that pick ups cover the whole map
// of Serbia". No numbers, the site has none for the service area.
export const servisMap = {
  title: ['Dva servisna centra,', 'cela Srbija.'], // dummy, from Filip's ask
  text: 'Servisna vozila iz Vrčina i Čuruga dolaze do vas, gde god da radi vaš viljuškar.', // dummy, from the trust strip, "sa servisnim vozilima širom Srbije"
  bases: [
    { id: 'vrcin', label: 'Vrčin', line: 'Servisni centar i sedište firme' }, // analysis
    { id: 'curug', label: 'Čurug', line: 'Servisni centar' }, // dummy, Filip's second location
  ],
  cover: 'Servisna vozila širom Srbije', // trust strip
  cta: servis.cta,
};

export const najam = {
  title: ['Najam', 'viljuškara'], // dummy
  text: 'Od nekoliko sati do godinu dana, u ponudi je 84 modela za najam.', // pillars, najam, and the 84 rental models in the analysis
  cta: { label: pillars[1].cta, href: pillars[1].href } satisfies Cta,
  facts: [
    { figure: '24', count: 24, suffix: ' sata', label: 'Isporuka' },
    { figure: 'Besplatna', label: 'Dostava i preuzimanje' }, // dummy label wording
    { figure: 'Održavanje', label: 'Uključeno u najam' },
    { figure: 'Zamena', label: 'Viljuškara tokom najma' },
  ] satisfies Fact[],
};

export const automatizacija = {
  title: ['Automatizacija', 'skladišta'], // dummy
  text: 'Mali roboti nose kutije, a vi radite posao.', // dummy, the offer line until Ekotehnika gives the real one
  cta: { label: hero.quote.label, href: hero.quote.href } satisfies Cta,
  facts: [
    { figure: 'Non-stop', label: 'Rad bez pauze' }, // dummy, no invented figure
    { figure: 'Palete', label: 'Prevoz po skladištu' }, // dummy
    { figure: 'Kutije', label: 'Do mesta isporuke' }, // dummy
  ] satisfies Fact[],
};

// D1, the statement. Row one is the tagline from the logo, row two the company claim.
export const statement = {
  label: 'Ekotehnika, Vrčin',
  rows: ['Snaga koja pokreće', 'Od 1997. širom Srbije i Crne Gore'],
  photo: { src: '/photos/isporuka-3.webp', alt: 'Linde viljuškar na kamionu, pred istovar' },
};

// D2, Proizvodi, the products section after the story, round 3 item 8. One cell per Linde cut out in public/products.
// Counts, ranges and capacities are dummy until Ekotehnika confirms them against the data sheets. The counts add up to the 96.
// lead is the one cell that spans two rows. The range is the Linde model designation without the brand, the section is all Linde, and
// the capacity is the nosivost, where the number is the nominal load in tenths of a tonne.
export type ProductCell = { name: string; range: string; cap: string; img: string; alt: string; href: string; lead?: boolean };

export const proizvodi = {
  label: 'Proizvodi',
  total: 96, // pillars, novi
  title: ['Glavni', 'proizvodi'],
  lede: 'Od čeonih viljuškara do automatizacije.', // dummy
  cta: { label: pillars[0].more, href: pillars[0].href } satisfies Cta,
  unit: 'modela', // dummy
  cells: [
    { name: 'Čeoni dizel viljuškari', range: 'H20 do H35', cap: '2,0 do 3,5 t', img: '/products/ceoni-dizel-h30d.webp', alt: 'Linde H30 D čeoni viljuškar sa dizel motorom', href: `${SITE}/linde-dizel-viljuskari/`, lead: true }, // Linde series range and capacity
    { name: 'Čeoni električni', range: 'E12 do E20', cap: '1,2 do 2,0 t', img: '/products/ceoni-elektro-e16p.webp', alt: 'Linde E16 P čeoni električni viljuškar', href: `${SITE}/linde-elektricni-viljuskari/` }, // Linde series range and capacity
    { name: 'Retrak viljuškari', range: 'R14 do R25', cap: '1,4 do 2,5 t', img: '/products/retrak-r16.webp', alt: 'Linde R16 retrak viljuškar za uske hodnike', href: `${SITE}/linde-regalni-viljuskari/` }, // Linde series range and capacity
    { name: 'Slagači', range: 'L10 do L16', cap: '1,0 do 1,6 t', img: '/products/slagac-l14r.webp', alt: 'Linde L14 R slagač', href: `${SITE}/viljuskari/` }, // Linde series range and capacity
    { name: 'Paletari', range: 'T20 do T25', cap: '2,0 do 2,5 t', img: '/products/paletar-t20r.webp', alt: 'Linde T20 R električni paletar', href: `${SITE}/viljuskari/` }, // Linde series range and capacity
    { name: 'Komisioneri', range: 'N20 do N25 C', cap: '2,0 do 2,5 t', img: '/products/komisioner-n20c.webp', alt: 'Linde N20 C komisioner', href: `${SITE}/viljuskari/` }, // Linde series range and capacity
    { name: 'Automatizacija', range: 'C-Matic 10', cap: '1,0 t', img: '/products/automatizacija-cmatic10.webp', alt: 'Linde C-Matic 10 autonomno vozilo za palete', href: `${SITE}/resenja/automatizacija/` }, // Linde series range and capacity
  ] satisfies ProductCell[],
  // Ekotehnika's own delivery photos from Filip's Drive, ground level, no drone footage. Shown only in the closing section, see closing.photos.
  photos: [
    { src: '/photos/isporuka-1.webp', alt: 'Linde E20 EVO, oznaka na boku viljuškara' },
    { src: '/photos/isporuka-2.webp', alt: 'Viljuškar se spušta sa kamiona pri isporuci' },
    { src: '/photos/isporuka-3.webp', alt: 'Linde viljuškar na kamionu, pred istovar' },
    { src: '/photos/isporuka-4.webp', alt: 'Linde viljuškar u kamionu, spreman za isporuku' },
  ],
};

// D3, the client wall. Ekotehnika gave permission, the list and the logo files are still to come. Only Vemax and
// Belt are named in the Drive, the other cells are dummy.
export const klijenti = {
  label: 'Poverili su nam',
  claim: trust[1].text,
  count: 1000,
  cells: [
    { name: 'Vemax' },
    { name: 'Belt' },
    ...Array.from({ length: 10 }, (_, i) => ({ name: `Klijent ${String(i + 3).padStart(2, '0')}`, dummy: true })), // dummy
  ] as { name: string; dummy?: boolean }[],
};

// D4, the closing section between Proizvodi and the footer, Filip 2026-10-12 18:50. The four delivery photos sit in grid cells, two each
// side, in the order left outer, left inner, right inner, right outer. The headline is the line from the removed closing band.
export const closing = {
  label: 'Kontakt',
  line: ['Recite nam', 'šta vam treba'], // dummy
  text: 'Pozovite nas ili pošaljite upit za ponudu.', // dummy
  cta: { label: hero.quote.label, href: hero.quote.href } satisfies Cta,
  phones: [
    { label: hero.sales.label, number: hero.sales.number, tel: hero.sales.tel, cta: 'call-sales' },
    { label: hero.service.label, number: hero.service.number, tel: hero.service.tel, cta: 'call-service' },
  ],
  photos: [proizvodi.photos[1], proizvodi.photos[0], proizvodi.photos[2], proizvodi.photos[3]],
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
  // Row one of the footer, the two numbers with the e-mail under each. The e-mail pairing follows the address names.
  phones: [
    { label: hero.sales.label, number: hero.sales.number, tel: hero.sales.tel, email: 'info@ekotehnika.rs', cta: 'call-sales' },
    { label: hero.service.label, number: hero.service.number, tel: hero.service.tel, email: 'servis@ekotehnika.rs', cta: 'call-service' },
  ],
  emails: ['info@ekotehnika.rs', 'servis@ekotehnika.rs'],
  labels: { address: 'Adresa', nav: 'Navigacija' },
  // The truck row on the bottom rule, four stills of the real models from scripts/render-footer-trucks.mjs, one per grid cell.
  // Every still is 600 by 507 css px (1200 by 1014 files) and shares one scale, so the sizes between the trucks are true.
  trucks: [
    { src: '/footer/mt15c.webp', alt: 'Linde MT15 električni paletar, u perspektivi' },
    { src: '/footer/h30d.webp', alt: 'Linde H30 čeoni dizel viljuškar, u perspektivi' },
    { src: '/footer/r16.webp', alt: 'Linde R16 retrak viljuškar sa visokim stubom, u perspektivi' },
    { src: '/footer/n20.webp', alt: 'Linde N20 komisioner, u perspektivi' },
  ],
  trucksSize: { w: 600, h: 507 },
  copyright: '© 2026 Ekotehnika viljuškari d.o.o.',
  legal: 'Sva prava zadržana.', // dummy
  lede: 'Linde viljuškari. Prodaja, najam i servis na jednom mestu.', // hero headline
  service: hero.service,
};
