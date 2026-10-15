import type { Content } from '../shared/content';
import type { PhotoId } from '../shared/photos';

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
    workRow: 'Photos of our work',
    successTitle: 'Sent',
    matrixTitle: 'The numbers behind the routes.',
    matrixBody: 'The totals so far.',
    faqCta: 'Ask us directly',
  },
  de: {
    mainNav: 'Hauptmenü',
    crewLine: 'Danach hinterlassen wir die Straße, wie wir sie vorfanden.',
    email: 'E-Mail',
    emailInvalid: 'Bitte eine gültige E-Mail-Adresse eingeben',
    hours: 'Zeiten',
    address: 'Adresse',
    scrollRow: 'Projekttrassen',
    workRow: 'Fotos unserer Arbeit',
    successTitle: 'Gesendet',
    matrixTitle: 'Die Zahlen hinter den Trassen.',
    matrixBody: 'Die Summen bisher.',
    faqCta: 'Direkt anfragen',
  },
};

export const t = (c: Content) => copy[c.lang];

// Focal points for the tall work cards and the 4 / 3 project photos, so the ducts, the machine
// and the mountains stay in frame when the photo is cropped.
export const WORK_FOCAL: Record<PhotoId, string> = {
  'route-trench-village': '50% 40%',
  'ducts-fence': '50% 62%',
  'ducts-soil': '36% 50%',
  'excavator-street': '68% 46%',
  'restored-lane': '50% 62%',
  'restored-manhole': '46% 60%',
  'restored-wall': '40% 56%',
  'ducts-trench': '40% 55%',
  'crew-dusk': '55% 58%',
  'road-crew': '42% 55%',
  'restored-path': '45% 62%',
  'restored-fence': '45% 62%',
  'dumper-dusk': '45% 62%',
  'site-setup': '45% 60%',
};
export const PROJECT_FOCAL: Partial<Record<PhotoId, string>> = {
  'route-trench-village': '50% 36%',
  'excavator-street': '50% 42%',
  'ducts-fence': '50% 58%',
};

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
