// Hero copy, from studio/clients/ekotehnika/briefs/hero-rebuild/BRIEF.md section 6.
// Serbian only. Every link stays on ekotehnika.rs or is a tel link.

export const SITE = 'https://ekotehnika.rs';

export const hero = {
  kicker: 'Zvanični Linde partner za Srbiju i Crnu Goru',
  headline: ['Linde viljuškari.', 'Prodaja, najam i servis na jednom mestu.'],
  sub: 'Novi i polovni viljuškari, najam od jednog dana i servis na terenu širom Srbije. Od 1997.',
  quote: { label: 'Zatražite ponudu', href: `${SITE}/kontakt/` },
  sales: { label: 'Prodaja', number: '+381 63 282-050', tel: 'tel:+38163282050' },
  service: { label: 'Hitan servis', number: '+381 60 300 20 50', tel: 'tel:+381603002050' },
  promo: {
    lead: 'Akcija.',
    text: 'Linde MT15 C elektro paletar, 1.390 €',
    href: `${SITE}/viljuskari/niskopodizno-vozilo/mt15-c/`,
  },
};

export type PillarId = 'novi' | 'najam' | 'servis' | 'polovni';

export type Pillar = {
  id: PillarId;
  name: string;
  line: string;
  cta: string;
  href: string;
  more: string;
};

export const pillars: Pillar[] = [
  {
    id: 'novi',
    name: 'Novi viljuškari',
    line: '96 Linde modela, ponuda po vašoj meri.',
    cta: 'Zatražite ponudu',
    href: `${SITE}/viljuskari/`,
    more: 'Pogledajte modele',
  },
  {
    id: 'najam',
    name: 'Najam',
    line: 'Od nekoliko sati do godinu dana. Isporuka za 24 sata.',
    cta: 'Zatražite ponudu za najam',
    href: `${SITE}/iznajmljivanje-viljuskara-cena/`,
    more: 'Uslovi najma',
  },
  {
    id: 'servis',
    name: 'Servis',
    line: 'Redovno održavanje, hitne intervencije, ugovori o punom servisu.',
    cta: 'Zakažite servis',
    href: `${SITE}/servis/odrzavanje-i-popravka/`,
    more: 'Usluge servisa',
  },
  {
    id: 'polovni',
    name: 'Polovni',
    line: 'Linde Approved Trucks sa garancijom 6 meseci ili 500 radnih sati.',
    cta: 'Zatražite ponudu za polovni',
    href: `${SITE}/polovni-linde-viljuskari/`,
    more: 'Polovni na stanju',
  },
];

export const trust = [
  { id: 'founded', text: 'Od 1997.' },
  { id: 'clients', text: '1.000+ klijenata', count: 1000 },
  { id: 'status', text: 'Zvanični Linde partner' },
  { id: 'coverage', text: 'Servisna vozila širom Srbije' },
] as const;

export const nav = [
  'Novi',
  'Polovni',
  'Iznajmljivanje',
  'Servis',
  'Delovi',
  'Automatizacija',
  'Bezbednost',
  'Industrijski roboti',
  'Blog',
  'O nama',
  'Kontakt',
];
