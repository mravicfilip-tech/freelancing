// Strings Daylight needs that content.ts does not carry. English and German, picked by c.lang.
// Every number here is a STAND-IN until BullHill sends its own.
import type { Lang } from '../shared/content';

const en = {
  notice: { text: 'Now booking routes for the 2027 season.', link: 'Send the job', close: 'Close notice' },
  mainNav: 'Main',
  menuNav: 'Menu',
  hero: {
    cardTitle: 'Route 04, Marchtrenk',
    status: 'Route status',
    length: 'Length',
    ducts: 'Ducts',
    chambers: 'Chambers',
    progress: 'Progress',
    lengthV: '6.4 km',
    ductsV: '4',
    chambersV: '6',
    progressV: '72%',
    delta: '+8%',
  },
  logos: { line: 'Built for network operators and main contractors across Austria and southern Germany.', slot: 'Client logo', region: 'Client logos' },
  projects: {
    group: 'Project slider',
    // a longer headline per project id, none for the client's own routes, so the slider shows the place
    headlines: {} as Record<string, string>,
    goTo: 'Go to project',
  },
  gauge: { label: 'Trench depth', value: '80', unit: 'cm', cover: 'Cover', coverV: '60 cm', width: 'Width', widthV: '40 cm', plan: 'Plan depth' },
  duct: {
    heads: ['Duct', 'Size', 'Status'],
    rows: [
      ['Duct A', '40 mm', 'Laid'],
      ['Duct B', '40 mm', 'Laid'],
      ['Duct C', '50 mm', 'Laid'],
      ['Duct D', '50 mm', 'Open'],
    ],
    done: 'Laid',
  },
  counter: { of: 'of 480 planned', done: 'connected' },
  surface: { label: 'Surface', items: ['Asphalt', 'Paving', 'Gravel', 'Turf'], status: 'Restored' },
  proc: {
    cards: {
      bars: { title: 'Progress per section', body: 'Every section is tracked from the first cut to the last patch.', rows: ['Trench', 'Ducts', 'Restored'] },
      check: { title: 'Ready for cable', body: 'A route is handed over only when every step is ticked.' },
      metrics: {
        title: 'Reported weekly',
        body: 'The figures arrive every Friday with photos.',
        heads: ['Metric', 'Value'],
        rows: [['Dug this week', '480 m'], ['Ducts laid', '4'], ['Chambers set', '6']],
        foot: 'All tracked and handed over with the route.',
      },
    },
    stepsLabel: 'Steps',
  },
  why: {
    title: 'Why teams book BullHill.',
    body: 'Network operators and main contractors book us for the same reasons. We turn up, we dig to plan and we leave a route that is ready for cable.',
    statsLabel: 'In numbers',
    photos: 'Photos',
  },
  crew: { various: 'Various', heads: ['Machine', 'Size', 'Count'] },
  contact: {
    reachUs: 'Reach us directly',
    hoursLabel: 'Hours',
    requiredNote: 'Required fields are marked with a star.',
    emailInvalid: 'Enter a valid email address.',
    statusSending: 'Sending',
    sent: 'Sent',
    again: 'Send another',
    formLabel: 'Send the job form',
  },
  footer: {
    quick: 'Quick links',
    line: 'Got a route to dig?',
    services: 'Services',
    nav: 'Navigate',
    contact: 'Contact',
    hill: 'Legal',
  },
};

type Copy = typeof en;

const de: Copy = {
  notice: { text: 'Jetzt Trassen für die Saison 2027 buchen.', link: 'Auftrag senden', close: 'Hinweis schließen' },
  mainNav: 'Hauptmenü',
  menuNav: 'Menü',
  hero: {
    cardTitle: 'Trasse 04, Marchtrenk',
    status: 'Trassenstand',
    length: 'Länge',
    ducts: 'Rohre',
    chambers: 'Schächte',
    progress: 'Fortschritt',
    lengthV: '6,4 km',
    ductsV: '4',
    chambersV: '6',
    progressV: '72 %',
    delta: '+8 %',
  },
  logos: { line: 'Gebaut für Netzbetreiber und Generalunternehmer in Österreich und Süddeutschland.', slot: 'Kundenlogo', region: 'Kundenlogos' },
  projects: {
    group: 'Projektslider',
    headlines: {},
    goTo: 'Zum Projekt',
  },
  gauge: { label: 'Grabentiefe', value: '80', unit: 'cm', cover: 'Überdeckung', coverV: '60 cm', width: 'Breite', widthV: '40 cm', plan: 'Plantiefe' },
  duct: {
    heads: ['Rohr', 'Größe', 'Status'],
    rows: [
      ['Rohr A', '40 mm', 'Verlegt'],
      ['Rohr B', '40 mm', 'Verlegt'],
      ['Rohr C', '50 mm', 'Verlegt'],
      ['Rohr D', '50 mm', 'Offen'],
    ],
    done: 'Verlegt',
  },
  counter: { of: 'von 480 geplant', done: 'angeschlossen' },
  surface: { label: 'Oberfläche', items: ['Asphalt', 'Pflaster', 'Schotter', 'Rasen'], status: 'Wiederhergestellt' },
  proc: {
    cards: {
      bars: { title: 'Fortschritt je Abschnitt', body: 'Jeder Abschnitt wird vom ersten Schnitt bis zur letzten Flickstelle erfasst.', rows: ['Graben', 'Rohre', 'Oberfläche'] },
      check: { title: 'Bereit für das Kabel', body: 'Eine Trasse wird erst übergeben, wenn jeder Schritt abgehakt ist.' },
      metrics: {
        title: 'Wöchentlicher Bericht',
        body: 'Die Zahlen kommen jeden Freitag mit Fotos.',
        heads: ['Kennzahl', 'Wert'],
        rows: [['Gegraben diese Woche', '480 m'], ['Rohre verlegt', '4'], ['Schächte gesetzt', '6']],
        foot: 'Alles erfasst und mit der Trasse übergeben.',
      },
    },
    stepsLabel: 'Schritte',
  },
  why: {
    title: 'Warum Teams BullHill buchen.',
    body: 'Netzbetreiber und Generalunternehmer buchen uns aus denselben Gründen. Wir kommen, graben nach Plan und übergeben eine Trasse, die bereit für das Kabel ist.',
    statsLabel: 'In Zahlen',
    photos: 'Fotos',
  },
  crew: { various: 'Verschieden', heads: ['Maschine', 'Größe', 'Anzahl'] },
  contact: {
    reachUs: 'Direkt erreichbar',
    hoursLabel: 'Zeiten',
    requiredNote: 'Pflichtfelder sind mit einem Stern markiert.',
    emailInvalid: 'Bitte eine gültige E-Mail-Adresse eingeben.',
    statusSending: 'Wird gesendet',
    sent: 'Gesendet',
    again: 'Noch einen senden',
    formLabel: 'Formular Auftrag senden',
  },
  footer: {
    quick: 'Schnellzugriff',
    line: 'Eine Trasse zu graben?',
    services: 'Leistungen',
    nav: 'Navigation',
    contact: 'Kontakt',
    hill: 'Rechtliches',
  },
};

export const copy: Record<Lang, Copy> = { en, de };
export const pick = (lang: Lang): Copy => copy[lang];
