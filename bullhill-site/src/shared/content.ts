// All site copy, English first and German second. Every pathway reads from here, so the three
// concepts say the same thing and differ only in design.
//
// STAND-IN marks content the client has not supplied yet. Numbers, project names, people, the
// phone number, the email and the company register numbers are placeholders until BullHill sends
// the real ones. Photos are placeholders too, each one carries the brief for the shot to take.

import type { PhotoId } from './photos';

export type Lang = 'en' | 'de';

// A photo slot. photo names one of BullHill's own photos, brief is the shot still to take when
// there is none.
export type Shot = { id: string; brief: string; photo?: PhotoId };

export type Service = { id: string; n: string; title: string; short: string; body: string; shot: Shot };
export type Step = { n: string; title: string; body: string; photo?: PhotoId };
export type Stat = { value: string; unit?: string; label: string };
export type Project = {
  id: string;
  title: string;
  place: string;
  region: string;
  length: string;
  year: string;
  client: string;
  scope: string;
  connections?: string;
  shot: Shot;
};
export type Audience = { kicker: string; title: string; body: string; points: { title: string; body: string }[]; cta: string };
export type Person = { name: string; role: string; shot: Shot };
export type Machine = { type: string; size: string; count: string };
export type Faq = { q: string; a: string };
export type WorkItem = { photo: PhotoId; caption: string };

export type Content = {
  lang: Lang;
  meta: { title: string; description: string };
  nav: { id: string; label: string }[];
  ui: {
    call: string;
    send: string;
    menu: string;
    close: string;
    langLabel: string;
    photo: string;
    scroll: string;
    prev: string;
    next: string;
    allProjects: string;
    viewProject: string;
    backToTop: string;
  };
  contact: {
    phone: string;
    phoneHref: string;
    email: string;
    whatsapp: string;
    whatsappHref: string;
    hours: string;
    address: string[];
    area: string;
  };
  hero: { kicker: string; title: string; split: [string, string]; lede: string; shot: Shot };
  work: { kicker: string; title: string; lede: string; items: WorkItem[]; count: string };
  ethos: { kicker: string; title: string; body: string; cta: string };
  services: { kicker: string; title: string; lede: string; items: Service[] };
  process: {
    kicker: string;
    title: string;
    lede: string;
    steps: Step[];
    layers: { id: string; label: string; note: string }[];
    note: string;
  };
  stats: { kicker: string; items: Stat[] };
  projects: { kicker: string; title: string; lede: string; items: Project[]; labels: { length: string; year: string; client: string; scope: string; connections: string } };
  audiences: { operators: Audience; contractors: Audience };
  crew: {
    kicker: string;
    title: string;
    body: string;
    people: Person[];
    machinesTitle: string;
    machines: Machine[];
    areaTitle: string;
    regions: string[];
    shot: Shot;
  };
  faq: { kicker: string; title: string; items: Faq[] };
  form: {
    kicker: string;
    title: string;
    lede: string;
    roleLabel: string;
    roles: string[];
    fields: { name: string; company: string; email: string; phone: string; place: string; length: string; message: string };
    placeholders: { place: string; length: string; message: string };
    required: string;
    consent: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
    reply: string;
  };
  footer: { line: string; legal: string; privacy: string; rights: string; company: string; madeFor: string };
};

const shots = {
  hero: { en: 'Wide shot, excavator on an open fibre route at low sun, trench running toward the camera', de: 'Weitwinkel, Bagger auf einer offenen Glasfasertrasse bei tiefer Sonne, Graben läuft auf die Kamera zu' },
  trench: { en: 'Open trench from above, tape measure in frame showing the depth', de: 'Offener Graben von oben, Maßband im Bild zeigt die Tiefe' },
  ducts: { en: 'Coloured ducts lying on the sand bed, top down', de: 'Bunte Leerrohre auf dem Sandbett, von oben' },
  house: { en: 'Crew member feeding a duct through a house wall', de: 'Mitarbeiter führt ein Leerrohr durch eine Hauswand' },
  restore: { en: 'Fresh asphalt patch over a closed trench, street in daylight', de: 'Frischer Asphalt über einem geschlossenen Graben, Straße bei Tageslicht' },
  crew: { en: 'The whole crew in front of the machines, eye level, no posing', de: 'Die ganze Mannschaft vor den Maschinen, auf Augenhöhe, ungestellt' },
};

const en: Content = {
  lang: 'en',
  meta: {
    title: 'BullHill, fibre trenching and duct laying',
    description: 'Trenching, ducts and house connections for fibre networks across Germany, Austria, Belgium, the Netherlands and Czechia.',
  },
  nav: [
    { id: 'services', label: 'Services' },
    { id: 'process', label: 'How we build' },
    { id: 'projects', label: 'Projects' },
    { id: 'crew', label: 'Crew' },
    { id: 'contact', label: 'Contact' },
  ],
  ui: {
    call: 'Call us',
    send: 'Send the job',
    menu: 'Menu',
    close: 'Close',
    langLabel: 'Language',
    photo: 'Photo',
    scroll: 'Scroll',
    prev: 'Previous',
    next: 'Next',
    allProjects: 'All projects',
    viewProject: 'View project',
    backToTop: 'Back to top',
  },
  contact: {
    // the client's own, 15 October 2026, the same number for calls and WhatsApp
    phone: '+43 665 65942472',
    phoneHref: 'tel:+4366565942472',
    email: 'bullhilldoo@gmail.com',
    whatsapp: 'WhatsApp',
    whatsappHref: 'https://wa.me/4366565942472',
    hours: 'Mon to Fri, 7am to 5pm',
    address: ['Kidričeva ulica 24', '3000 Celje, Slovenia'],
    area: 'Germany, Austria, Belgium, the Netherlands and Czechia',
  },
  hero: {
    kicker: 'Fibre civil works',
    title: 'We dig the routes fibre runs through.',
    split: ['We dig the routes', 'fibre runs through'],
    lede: 'Trenching, ducts and house connections for fibre networks across Germany, Austria, Belgium, the Netherlands and Czechia. Our own crew.',
    shot: { id: 'hero', brief: shots.hero.en, photo: 'route-trench-village' },
  },
  work: {
    kicker: 'Our work',
    title: 'From open trench to finished pavement.',
    lede: 'Photos from our own routes. Ducts in the ground, surfaces put back.',
    count: 'photos',
    items: [
      { photo: 'route-trench-village', caption: 'Ducts in the trench along a village road' },
      { photo: 'ducts-fence', caption: 'Duct bundle laid along a garden fence' },
      { photo: 'ducts-soil', caption: 'Green and orange ducts on the trench bed' },
      { photo: 'excavator-street', caption: 'Mini excavator on a street section' },
      { photo: 'restored-lane', caption: 'Crossing closed and resurfaced' },
      { photo: 'restored-manhole', caption: 'Pavement restored around a manhole' },
      { photo: 'restored-wall', caption: 'Restored strip along the kerb' },
    ],
  },
  ethos: {
    kicker: 'Who we are',
    title: 'The ground work comes first.',
    body: 'Fibre only reaches a house once someone has dug the way. That is our job. BullHill is a trenching crew working for network operators, main contractors and municipalities. We plan the route with you, dig it, lay the ducts and leave the street the way we found it.',
    cta: 'Meet the crew',
  },
  services: {
    kicker: 'What we do',
    title: 'Four jobs, one crew.',
    lede: 'Everything between the planned route and a duct ready for cable.',
    items: [
      {
        id: 'trenching',
        n: '01',
        title: 'Fibre trenching',
        short: 'Open trenches to plan depth, in fields, verges and town streets.',
        body: 'We open the trench to the depth and width the plan sets, usually 60 to 80 cm, and keep it safe and tidy while it is open.',
        shot: { id: 'trench', brief: shots.trench.en, photo: 'ducts-fence' },
      },
      {
        id: 'ducts',
        n: '02',
        title: 'Ducts and chambers',
        short: 'Duct bundles on a sand bed, chambers set, warning tape above.',
        body: 'Duct bundles go onto a clean sand bed, chambers and hand holes are set at the marked points, and warning tape goes in above the ducts.',
        shot: { id: 'ducts', brief: shots.ducts.en, photo: 'ducts-soil' },
      },
      {
        id: 'connections',
        n: '03',
        title: 'House connections',
        short: 'From the street duct to the wall of the building, one by one.',
        body: 'We take the duct from the street to the building wall, through gardens and driveways, and seal the entry point.',
        shot: { id: 'house', brief: shots.house.en, photo: 'restored-lane' },
      },
      {
        id: 'restoration',
        n: '04',
        title: 'Surface restoration',
        short: 'Paving or grass, put back the way we found it.',
        body: 'Every trench is backfilled and compacted, then the surface goes back. Paving stones, gravel or turf.',
        shot: { id: 'restore', brief: shots.restore.en, photo: 'restored-manhole' },
      },
    ],
  },
  process: {
    kicker: 'How a route gets built',
    title: 'We dig now. The fibre comes later.',
    lede: 'A fibre route is a set of empty ducts in the ground. Once the trench is closed, the fibre is blown through them, by our crew or by the operator.',
    steps: [
      { n: '01', title: 'Survey and marking', body: 'We walk the route and mark the existing lines and the trench line before a machine moves.' },
      { n: '02', title: 'Dig', photo: 'excavator-street', body: 'Excavators open the trench to plan depth, section by section, with the street kept passable.' },
      { n: '03', title: 'Lay ducts', photo: 'ducts-soil', body: 'Ducts go onto a sand bed, chambers are set, warning tape goes in above.' },
      { n: '04', title: 'Backfill and restore', photo: 'restored-manhole', body: 'We compact the trench and put the surface back. The route is ready for cable.' },
    ],
    layers: [
      { id: 'surface', label: 'Surface', note: 'Paving or turf, restored' },
      { id: 'base', label: 'Base course', note: 'Compacted gravel' },
      { id: 'tape', label: 'Warning tape', note: 'About 30 cm above the ducts' },
      { id: 'backfill', label: 'Backfill', note: 'Compacted in layers' },
      { id: 'ducts', label: 'Ducts', note: 'Empty, ready for fibre' },
      { id: 'sand', label: 'Sand bed', note: 'About 10 cm' },
    ],
    note: 'Typical depth 60 to 80 cm',
  },
  stats: {
    kicker: 'In the ground so far',
    items: [
      // the client's figures, 15 October 2026
      { value: '8', unit: 'km', label: 'of trench dug' },
      { value: '270', label: 'house connections' },
      { value: '5', label: 'towns and municipalities' },
      { value: '1', label: 'year in the ground' },
    ],
  },
  projects: {
    kicker: 'Projects',
    title: 'Routes we have built.',
    lede: 'A few of the routes from the last three years, from village backbones to town centre rollouts.',
    labels: { length: 'Route', year: 'Year', client: 'For', scope: 'Scope', connections: 'Connections' },
    items: [
      // STAND-IN projects, names and figures to be replaced with BullHill's own
      { id: 'marchtrenk', title: 'Backbone route', place: 'Marchtrenk', region: 'Upper Austria', length: '6.4 km', year: '2025', client: 'Regional network operator', scope: 'Trench, 4 ducts, 6 chambers', shot: { id: 'p1', photo: 'ducts-fence', brief: 'Long straight trench along a country road, machine in the distance' } },
      { id: 'amstetten', title: 'Town centre rollout', place: 'Amstetten', region: 'Lower Austria', length: '3.1 km', year: '2025', client: 'Main contractor', scope: 'Trench, ducts, house connections', connections: '412', shot: { id: 'p2', photo: 'excavator-street', brief: 'Narrow town street with paving lifted, crew at work' } },
      { id: 'leibnitz', title: 'Village connection', place: 'Leibnitz', region: 'Styria', length: '9.8 km', year: '2024', client: 'Municipality', scope: 'Trench, ducts, restoration', connections: '186', shot: { id: 'p3', photo: 'route-trench-village', brief: 'Trench through vineyard country, drone view' } },
      { id: 'seekirchen', title: 'Business park access', place: 'Seekirchen', region: 'Salzburg', length: '2.2 km', year: '2024', client: 'Regional network operator', scope: 'Trench, road crossing, chambers', shot: { id: 'p4', photo: 'restored-wall', brief: 'Road crossing at night with lights and barriers' } },
      { id: 'passau', title: 'Cross border link', place: 'Passau', region: 'Bavaria', length: '5.5 km', year: '2023', client: 'Main contractor', scope: 'Trench, 2 ducts, restoration', shot: { id: 'p5', photo: 'restored-lane', brief: 'Finished route, restored verge, marker posts in a row' } },
    ],
  },
  audiences: {
    operators: {
      kicker: 'For network operators',
      title: 'A crew that keeps your rollout on plan.',
      body: 'You set the route and the standard. We dig it, report every week and hand over a route that is ready for cable.',
      points: [
        { title: 'Weekly progress', body: 'Metres dug, ducts laid and chambers set, sent every Friday with photos.' },
        { title: 'As built records', body: 'Measured positions and photos for every section, in the format you use.' },
        { title: 'One site lead', body: 'The same person on site and on the phone from the first metre to the last.' },
      ],
      cta: 'Talk about a route',
    },
    contractors: {
      kicker: 'For main contractors',
      title: 'Extra capacity when the schedule is tight.',
      body: 'We join your project as a subcontractor with a crew that knows the work.',
      points: [
        { title: 'Machines for the ground', body: 'Excavators, trucks and compaction gear matched to each route.' },
        { title: 'Your site rules', body: 'We work to your safety plan, your traffic plan and your reporting.' },
        { title: 'Short notice starts', body: 'Across Germany, Austria, Belgium, the Netherlands and Czechia, when a section needs more hands.' },
      ],
      cta: 'Book the crew',
    },
  },
  crew: {
    kicker: 'Crew',
    title: 'A small crew that knows the work.',
    body: 'BullHill started with one route. Today the crew works every season, from the first frost-free week to the last.',
    people: [
      // STAND-IN people
      { name: 'Name to follow', role: 'Founder and site lead', shot: { id: 'c1', brief: 'Portrait, site lead next to the excavator, eye level' } },
      { name: 'Name to follow', role: 'Machine operator', shot: { id: 'c2', brief: 'Portrait in the cab, door open' } },
      { name: 'Name to follow', role: 'Ducts and connections', shot: { id: 'c3', brief: 'Portrait in the trench, holding a duct' } },
    ],
    machinesTitle: 'The fleet',
    // none until BullHill has machines of its own, the client 15 October 2026. The fleet row hides while empty.
    machines: [],
    areaTitle: 'Where we work',
    regions: ['Germany', 'Austria', 'Belgium', 'Netherlands', 'Czechia'],
    shot: { id: 'crew', brief: shots.crew.en, photo: 'excavator-street' },
  },
  faq: {
    kicker: 'Questions',
    title: 'What people ask before they book us.',
    items: [
      { q: 'Do you lay the fibre cable as well?', a: 'Yes. We build the route, the ducts and the chambers, and we can blow the fibre in too. If the operator does that part, we leave the ducts ready for it.' },
      { q: 'How many metres a day can you dig?', a: 'It depends on the ground and the surface. Open fields go fast, a paved town centre far slower. We give a figure per route after the survey.' },
      { q: 'Which regions do you cover?', a: 'Germany, Austria, Belgium, the Netherlands and Czechia. Jobs further away on request.' },
      { q: 'Do you restore paving and turf?', a: 'Yes. Every trench is closed and the surface put back, paving stones, gravel or turf.' },
      { q: 'Can we hire you as a subcontractor?', a: 'Yes. Most of our work is for main contractors and network operators.' },
    ],
  },
  form: {
    kicker: 'Contact',
    title: 'Send us the route.',
    lede: 'Tell us where it runs and roughly how long it is. We call back with a first price and a start date.',
    roleLabel: 'You are',
    roles: ['Network operator', 'Main contractor', 'Municipality', 'Private'],
    fields: { name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', place: 'Where is the route', length: 'Length, roughly', message: 'Message' },
    placeholders: { place: 'Town or postcode', length: 'For example 2 km', message: 'Surface, timing, anything we should know' },
    required: 'Required',
    consent: 'We use your details only to answer this request.',
    submit: 'Send the job',
    sending: 'Sending',
    success: 'Thanks. We call you back within one working day.',
    error: 'That did not go through. Call us or try again in a minute.',
    reply: 'We reply within one working day.', // STAND-IN promise, to confirm with BullHill
  },
  footer: {
    line: 'Fibre civil works. Germany, Austria, Belgium, the Netherlands and Czechia.',
    legal: 'Legal notice',
    privacy: 'Privacy',
    rights: '© 2026 BullHill',
    // the Slovenian register and VAT numbers follow from the client, the line hides while empty
    company: '',
    madeFor: 'Back to top',
  },
};

const de: Content = {
  lang: 'de',
  meta: {
    title: 'BullHill, Tiefbau für Glasfaser',
    description: 'Grabenbau, Leerrohre und Hausanschlüsse für Glasfasernetze in Deutschland, Österreich, Belgien, den Niederlanden und Tschechien.',
  },
  nav: [
    { id: 'services', label: 'Leistungen' },
    { id: 'process', label: 'Ablauf' },
    { id: 'projects', label: 'Projekte' },
    { id: 'crew', label: 'Team' },
    { id: 'contact', label: 'Kontakt' },
  ],
  ui: {
    call: 'Anrufen',
    send: 'Auftrag senden',
    menu: 'Menü',
    close: 'Schließen',
    langLabel: 'Sprache',
    photo: 'Foto',
    scroll: 'Scrollen',
    prev: 'Zurück',
    next: 'Weiter',
    allProjects: 'Alle Projekte',
    viewProject: 'Projekt ansehen',
    backToTop: 'Nach oben',
  },
  contact: {
    phone: '+43 665 65942472',
    phoneHref: 'tel:+4366565942472',
    email: 'bullhilldoo@gmail.com',
    whatsapp: 'WhatsApp',
    whatsappHref: 'https://wa.me/4366565942472',
    hours: 'Mo bis Fr, 7 bis 17 Uhr',
    address: ['Kidričeva ulica 24', '3000 Celje, Slowenien'],
    area: 'Deutschland, Österreich, Belgien, Niederlande und Tschechien',
  },
  hero: {
    kicker: 'Tiefbau für Glasfaser',
    title: 'Wir graben die Trassen, durch die Glasfaser läuft.',
    split: ['Wir graben die Trassen', 'für die Glasfaser'],
    lede: 'Grabenbau, Leerrohre und Hausanschlüsse für Glasfasernetze in Deutschland, Österreich, Belgien, den Niederlanden und Tschechien. Eigene Mannschaft.',
    shot: { id: 'hero', brief: shots.hero.de, photo: 'route-trench-village' },
  },
  work: {
    kicker: 'Unsere Arbeit',
    title: 'Vom offenen Graben bis zum fertigen Gehweg.',
    lede: 'Fotos von unseren eigenen Trassen. Rohre im Boden, Oberflächen wiederhergestellt.',
    count: 'Fotos',
    items: [
      { photo: 'route-trench-village', caption: 'Rohre im Graben entlang einer Ortsstraße' },
      { photo: 'ducts-fence', caption: 'Rohrverband entlang eines Gartenzauns' },
      { photo: 'ducts-soil', caption: 'Grüne und orange Rohre auf der Grabensohle' },
      { photo: 'excavator-street', caption: 'Minibagger auf einem Straßenabschnitt' },
      { photo: 'restored-lane', caption: 'Querung geschlossen und neu befestigt' },
      { photo: 'restored-manhole', caption: 'Gehweg rund um einen Schacht wiederhergestellt' },
      { photo: 'restored-wall', caption: 'Wiederhergestellter Streifen entlang der Bordsteinkante' },
    ],
  },
  ethos: {
    kicker: 'Wer wir sind',
    title: 'Zuerst kommt der Tiefbau.',
    body: 'Glasfaser erreicht ein Haus erst, wenn jemand den Weg gegraben hat. Das ist unsere Arbeit. BullHill ist eine Tiefbau-Mannschaft und arbeitet für Netzbetreiber, Generalunternehmer und Gemeinden. Wir planen die Trasse mit Ihnen, graben sie, verlegen die Rohre und hinterlassen die Straße so, wie wir sie vorgefunden haben.',
    cta: 'Das Team kennenlernen',
  },
  services: {
    kicker: 'Leistungen',
    title: 'Vier Aufgaben, eine Mannschaft.',
    lede: 'Alles zwischen der geplanten Trasse und dem Rohr, das bereit für das Kabel ist.',
    items: [
      { id: 'trenching', n: '01', title: 'Grabenbau', short: 'Offene Gräben auf Plantiefe, in Feldern, Banketten und Ortsstraßen.', body: 'Wir öffnen den Graben in der geplanten Tiefe und Breite, meist 60 bis 80 cm, und halten ihn sicher und sauber, solange er offen ist.', shot: { id: 'trench', brief: shots.trench.de, photo: 'ducts-fence' } },
      { id: 'ducts', n: '02', title: 'Leerrohre und Schächte', short: 'Rohrverbände im Sandbett, Schächte gesetzt, Warnband darüber.', body: 'Die Rohrverbände kommen auf ein sauberes Sandbett, Schächte und Handlöcher werden an den markierten Punkten gesetzt, darüber das Warnband.', shot: { id: 'ducts', brief: shots.ducts.de, photo: 'ducts-soil' } },
      { id: 'connections', n: '03', title: 'Hausanschlüsse', short: 'Vom Rohr in der Straße bis zur Hauswand, Haus für Haus.', body: 'Wir führen das Rohr von der Straße bis zur Gebäudewand, durch Gärten und Einfahrten, und dichten die Einführung ab.', shot: { id: 'house', brief: shots.house.de, photo: 'restored-lane' } },
      { id: 'restoration', n: '04', title: 'Oberflächen', short: 'Pflaster oder Rasen, so wie wir sie vorgefunden haben.', body: 'Jeder Graben wird verfüllt und verdichtet, dann kommt die Oberfläche zurück. Pflaster, Schotter oder Rasen.', shot: { id: 'restore', brief: shots.restore.de, photo: 'restored-manhole' } },
    ],
  },
  process: {
    kicker: 'So entsteht eine Trasse',
    title: 'Wir graben jetzt. Die Glasfaser kommt später.',
    lede: 'Eine Glasfasertrasse ist ein Bündel leerer Rohre im Boden. Sobald der Graben zu ist, wird die Glasfaser eingeblasen, von unserem Team oder vom Netzbetreiber.',
    steps: [
      { n: '01', title: 'Begehung und Markierung', body: 'Wir gehen die Trasse ab und markieren bestehende Leitungen und die Grabenlinie, bevor eine Maschine anrollt.' },
      { n: '02', title: 'Graben', photo: 'excavator-street', body: 'Bagger öffnen den Graben auf Plantiefe, Abschnitt für Abschnitt, die Straße bleibt befahrbar.' },
      { n: '03', title: 'Rohre verlegen', photo: 'ducts-soil', body: 'Die Rohre kommen auf ein Sandbett, Schächte werden gesetzt, darüber das Warnband.' },
      { n: '04', title: 'Verfüllen und wiederherstellen', photo: 'restored-manhole', body: 'Wir verdichten den Graben und stellen die Oberfläche wieder her. Die Trasse ist bereit für das Kabel.' },
    ],
    layers: [
      { id: 'surface', label: 'Oberfläche', note: 'Pflaster oder Rasen, wiederhergestellt' },
      { id: 'base', label: 'Tragschicht', note: 'Verdichteter Schotter' },
      { id: 'tape', label: 'Warnband', note: 'Etwa 30 cm über den Rohren' },
      { id: 'backfill', label: 'Verfüllung', note: 'Lagenweise verdichtet' },
      { id: 'ducts', label: 'Leerrohre', note: 'Leer, bereit für Glasfaser' },
      { id: 'sand', label: 'Sandbett', note: 'Etwa 10 cm' },
    ],
    note: 'Übliche Tiefe 60 bis 80 cm',
  },
  stats: {
    kicker: 'Bisher im Boden',
    items: [
      { value: '8', unit: 'km', label: 'Graben gebaut' },
      { value: '270', label: 'Hausanschlüsse' },
      { value: '5', label: 'Orte und Gemeinden' },
      { value: '1', label: 'Jahr im Tiefbau' },
    ],
  },
  projects: {
    kicker: 'Projekte',
    title: 'Trassen, die wir gebaut haben.',
    lede: 'Einige Trassen aus den letzten drei Jahren, vom Dorf-Backbone bis zum Ausbau im Ortszentrum.',
    labels: { length: 'Trasse', year: 'Jahr', client: 'Für', scope: 'Umfang', connections: 'Anschlüsse' },
    items: [
      { id: 'marchtrenk', title: 'Backbone-Trasse', place: 'Marchtrenk', region: 'Oberösterreich', length: '6,4 km', year: '2025', client: 'Regionaler Netzbetreiber', scope: 'Graben, 4 Rohre, 6 Schächte', shot: { id: 'p1', photo: 'ducts-fence', brief: 'Langer gerader Graben entlang einer Landstraße, Maschine im Hintergrund' } },
      { id: 'amstetten', title: 'Ausbau Ortszentrum', place: 'Amstetten', region: 'Niederösterreich', length: '3,1 km', year: '2025', client: 'Generalunternehmer', scope: 'Graben, Rohre, Hausanschlüsse', connections: '412', shot: { id: 'p2', photo: 'excavator-street', brief: 'Enge Ortsstraße mit aufgenommenem Pflaster, Mannschaft bei der Arbeit' } },
      { id: 'leibnitz', title: 'Anbindung Ortschaft', place: 'Leibnitz', region: 'Steiermark', length: '9,8 km', year: '2024', client: 'Gemeinde', scope: 'Graben, Rohre, Wiederherstellung', connections: '186', shot: { id: 'p3', photo: 'route-trench-village', brief: 'Graben durch Weinbaugebiet, Drohnenansicht' } },
      { id: 'seekirchen', title: 'Anbindung Gewerbepark', place: 'Seekirchen', region: 'Salzburg', length: '2,2 km', year: '2024', client: 'Regionaler Netzbetreiber', scope: 'Graben, Straßenquerung, Schächte', shot: { id: 'p4', photo: 'restored-wall', brief: 'Straßenquerung bei Nacht mit Licht und Absperrung' } },
      { id: 'passau', title: 'Grenzüberschreitende Verbindung', place: 'Passau', region: 'Bayern', length: '5,5 km', year: '2023', client: 'Generalunternehmer', scope: 'Graben, 2 Rohre, Wiederherstellung', shot: { id: 'p5', photo: 'restored-lane', brief: 'Fertige Trasse, wiederhergestelltes Bankett, Markierungspfosten in einer Reihe' } },
    ],
  },
  audiences: {
    operators: {
      kicker: 'Für Netzbetreiber',
      title: 'Eine Mannschaft, die Ihren Ausbau im Plan hält.',
      body: 'Sie legen Trasse und Standard fest. Wir graben, berichten jede Woche und übergeben eine Trasse, die bereit für das Kabel ist.',
      points: [
        { title: 'Wöchentlicher Fortschritt', body: 'Gegrabene Meter, verlegte Rohre und gesetzte Schächte, jeden Freitag mit Fotos.' },
        { title: 'Bestandsdokumentation', body: 'Eingemessene Lage und Fotos für jeden Abschnitt, in Ihrem Format.' },
        { title: 'Ein Bauleiter', body: 'Dieselbe Person auf der Baustelle und am Telefon, vom ersten bis zum letzten Meter.' },
      ],
      cta: 'Über eine Trasse sprechen',
    },
    contractors: {
      kicker: 'Für Generalunternehmer',
      title: 'Zusätzliche Kapazität, wenn der Zeitplan eng wird.',
      body: 'Wir steigen als Subunternehmer in Ihr Projekt ein, mit einer Mannschaft, die die Arbeit kennt.',
      points: [
        { title: 'Maschinen für den Boden', body: 'Bagger, LKW und Verdichtungsgeräte, passend zu jeder Trasse.' },
        { title: 'Ihre Baustellenregeln', body: 'Wir arbeiten nach Ihrem Sicherheitsplan, Ihrem Verkehrsplan und Ihrem Berichtswesen.' },
        { title: 'Kurzfristiger Start', body: 'In Deutschland, Österreich, Belgien, den Niederlanden und Tschechien, wenn ein Abschnitt mehr Leute braucht.' },
      ],
      cta: 'Mannschaft buchen',
    },
  },
  crew: {
    kicker: 'Team',
    title: 'Eine kleine Mannschaft, die die Arbeit kennt.',
    body: 'BullHill begann mit einer Trasse. Heute arbeitet die Mannschaft jede Saison, von der ersten frostfreien Woche bis zur letzten.',
    people: [
      { name: 'Name folgt', role: 'Gründer und Bauleiter', shot: { id: 'c1', brief: 'Porträt, Bauleiter neben dem Bagger, auf Augenhöhe' } },
      { name: 'Name folgt', role: 'Maschinist', shot: { id: 'c2', brief: 'Porträt in der Kabine, Tür offen' } },
      { name: 'Name folgt', role: 'Rohre und Anschlüsse', shot: { id: 'c3', brief: 'Porträt im Graben, mit einem Leerrohr in der Hand' } },
    ],
    machinesTitle: 'Der Fuhrpark',
    machines: [],
    areaTitle: 'Wo wir arbeiten',
    regions: ['Deutschland', 'Österreich', 'Belgien', 'Niederlande', 'Tschechien'],
    shot: { id: 'crew', brief: shots.crew.de, photo: 'excavator-street' },
  },
  faq: {
    kicker: 'Fragen',
    title: 'Was man uns vor dem ersten Auftrag fragt.',
    items: [
      { q: 'Verlegen Sie auch das Glasfaserkabel?', a: 'Ja. Wir bauen die Trasse, die Rohre und die Schächte und können die Glasfaser auch einblasen. Macht das der Netzbetreiber, übergeben wir die Rohre bereit dafür.' },
      { q: 'Wie viele Meter schaffen Sie am Tag?', a: 'Das hängt von Boden und Oberfläche ab. Auf freiem Feld geht es schnell, im gepflasterten Ortszentrum viel langsamer. Nach der Begehung nennen wir eine Zahl pro Trasse.' },
      { q: 'In welchen Regionen arbeiten Sie?', a: 'In Deutschland, Österreich, Belgien, den Niederlanden und Tschechien. Aufträge weiter weg auf Anfrage.' },
      { q: 'Stellen Sie Pflaster und Rasen wieder her?', a: 'Ja. Jeder Graben wird geschlossen und die Oberfläche wiederhergestellt, Pflaster, Schotter oder Rasen.' },
      { q: 'Können wir Sie als Subunternehmer beauftragen?', a: 'Ja. Der Großteil unserer Arbeit ist für Generalunternehmer und Netzbetreiber.' },
    ],
  },
  form: {
    kicker: 'Kontakt',
    title: 'Schicken Sie uns die Trasse.',
    lede: 'Sagen Sie uns, wo sie verläuft und wie lang sie ungefähr ist. Wir rufen mit einem ersten Preis und einem Starttermin zurück.',
    roleLabel: 'Sie sind',
    roles: ['Netzbetreiber', 'Generalunternehmer', 'Gemeinde', 'Privat'],
    fields: { name: 'Name', company: 'Firma', email: 'E-Mail', phone: 'Telefon', place: 'Wo verläuft die Trasse', length: 'Länge, ungefähr', message: 'Nachricht' },
    placeholders: { place: 'Ort oder Postleitzahl', length: 'Zum Beispiel 2 km', message: 'Oberfläche, Zeitplan, was wir wissen sollten' },
    required: 'Pflichtfeld',
    consent: 'Wir verwenden Ihre Angaben nur, um diese Anfrage zu beantworten.',
    submit: 'Auftrag senden',
    sending: 'Wird gesendet',
    success: 'Danke. Wir rufen Sie innerhalb eines Werktags zurück.',
    error: 'Das hat nicht geklappt. Rufen Sie uns an oder versuchen Sie es gleich noch einmal.',
    reply: 'Antwort innerhalb eines Werktags.',
  },
  footer: {
    line: 'Tiefbau für Glasfaser. Deutschland, Österreich, Belgien, Niederlande und Tschechien.',
    legal: 'Impressum',
    privacy: 'Datenschutz',
    rights: '© 2026 BullHill',
    company: '',
    madeFor: 'Nach oben',
  },
};

export const content: Record<Lang, Content> = { en, de };
