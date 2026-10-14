import type { Content } from '../shared/content';

// Strings this pathway needs that content.ts does not carry.
const copy = {
  en: {
    mainNav: 'Main',
    crewLine: 'Then we leave the street the way we found it.',
    email: 'Email',
    emailInvalid: 'Enter a valid email address',
    hours: 'Hours',
    address: 'Address',
    scrollRow: 'Project routes',
    successTitle: 'Sent',
  },
  de: {
    mainNav: 'Hauptmenü',
    crewLine: 'Danach hinterlassen wir die Straße, wie wir sie vorfanden.',
    email: 'E-Mail',
    emailInvalid: 'Bitte eine gültige E-Mail-Adresse eingeben',
    hours: 'Zeiten',
    address: 'Adresse',
    scrollRow: 'Projekttrassen',
    successTitle: 'Gesendet',
  },
};

export const t = (c: Content) => copy[c.lang];

// Soft hyphens for the long German compounds, so a 24px title can break at 390 without
// relying on the browser's hyphenation dictionary. Invisible everywhere else.
const SHY = '\u00ad';
const BREAKS: [string, number[]][] = [
  ['Aufgrabungsgenehmigungen', [10]],
  ['Baustellenregeln', [10]],
  ['Bestandsdokumentation', [8]],
  ['Generalunternehmer', [7]],
  ['Grenzüberschreitende', [5, 8]],
  ['Hausanschlüsse', [4]],
  ['Kurzfristiger', [4]],
  ['Netzbetreiber', [4]],
  ['Niederösterreich', [5]],
  ['Oberösterreich', [4]],
  ['Sicherheitsplan', [11]],
  ['Straßenquerung', [7]],
  ['Subunternehmer', [3]],
  ['Süddeutschland', [3]],
  ['Verdichtungsgeräte', [11]],
  ['Wiederherstellung', [6]],
  ['Wiederherstellen', [6, 9]],
  ['Glasfasertrasse', [9]],
  ['Rohrverbände', [4]],
  ['Weinbaugebiet', [4]],
];
const SHY_RE = new RegExp(BREAKS.map(([w]) => w).join('|'), 'gi');
export const sh = (c: Content, text: string) =>
  c.lang !== 'de'
    ? text
    : text.replace(SHY_RE, (w) => {
        const spec = BREAKS.find(([b]) => b.toLowerCase() === w.toLowerCase())![1];
        return [...w].map((ch, i) => (spec.includes(i) ? SHY + ch : ch)).join('');
      });
