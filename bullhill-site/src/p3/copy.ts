// Strings pathway 3 needs that content.ts does not hold. English and German, picked by c.lang.
import type { Content, Shot } from '../shared/content';

type Pair<T> = { en: T; de: T };

const copy = {
  contactUs: { en: 'Contact us', de: 'Kontakt' },
  mainNav: { en: 'Main', de: 'Hauptmenü' },
  serviceIndex: { en: 'Services index', de: 'Leistungen im Überblick' },
  serviceCta: { en: 'Ask about this job', de: 'Zu diesem Auftrag fragen' },
  servicePoints: {
    en: [
      ['Width and depth to plan, usually 60 to 80 cm', 'Open in fields, verges and town streets', 'Edges secured and the street kept passable', 'Existing lines located and marked first'],
      ['Duct bundles laid on a clean sand bed', 'Chambers and hand holes set at the marked points', 'Warning tape placed above the ducts', 'Ends capped and marked for the cable crew'],
      ['From the street duct to the building wall', 'Gardens and driveways crossed and put back', 'Wall entry sealed and photographed', 'Every connection logged for the as built record'],
      ['Backfill compacted in layers', 'Asphalt, paving stones, gravel or turf', 'Edges and kerbs finished clean', 'Street left the way we found it'],
    ],
    de: [
      ['Breite und Tiefe nach Plan, meist 60 bis 80 cm', 'Offen in Feldern, Banketten und Ortsstraßen', 'Ränder gesichert, die Straße bleibt befahrbar', 'Bestehende Leitungen vorher geortet und markiert'],
      ['Rohrverbände auf sauberem Sandbett', 'Schächte und Handlöcher an den markierten Punkten', 'Warnband über den Rohren', 'Enden verschlossen und für den Kabelzug markiert'],
      ['Vom Straßenrohr bis zur Hauswand', 'Gärten und Einfahrten gequert und wiederhergestellt', 'Wanddurchführung abgedichtet und fotografiert', 'Jeder Anschluss für die Bestandsdokumentation erfasst'],
      ['Verfüllung lagenweise verdichtet', 'Asphalt, Pflaster, Schotter oder Rasen', 'Ränder und Kanten sauber geschlossen', 'Straße so hinterlassen, wie wir sie vorgefunden haben'],
    ],
  } as Pair<string[][]>,
  stepsLine: { en: 'One chain from the permit to the restored street.', de: 'Eine Kette von der Genehmigung bis zur wiederhergestellten Straße.' },
  knowMore: { en: 'Know more', de: 'Mehr erfahren' },
  stepShots: {
    en: [
      'Site lead marking existing lines on the road with spray paint, survey day',
      'Excavator opening the trench, the street kept open beside it',
      'Ducts being laid on the sand bed, tape roll in frame',
      'Plate compactor closing the trench, fresh surface behind it',
    ],
    de: [
      'Bauleiter markiert bestehende Leitungen mit Sprühfarbe auf der Straße, Begehungstag',
      'Bagger öffnet den Graben, die Straße daneben bleibt offen',
      'Leerrohre werden auf das Sandbett gelegt, Warnbandrolle im Bild',
      'Rüttelplatte schließt den Graben, dahinter die frische Oberfläche',
    ],
  } as Pair<string[]>,
  projectsLine: { en: 'Five routes, one way of working.', de: 'Fünf Trassen, eine Arbeitsweise.' },
  projectWord: { en: 'Project', de: 'Projekt' },
  speak: { en: 'Speak with BullHill', de: 'Sprechen Sie mit BullHill' },
  faqCta: { en: 'Ask us directly', de: 'Direkt anfragen' },
  contactLine: { en: 'Reach BullHill by form, by phone or on WhatsApp.', de: 'Erreichen Sie BullHill per Formular, Telefon oder WhatsApp.' },
  emailInvalid: { en: 'Enter an email like name@company.at', de: 'E-Mail im Format name@firma.at eingeben' },
  contactDetails: { en: 'Contact details', de: 'Kontaktdaten' },
  labelPhone: { en: 'Phone', de: 'Telefon' },
  labelEmail: { en: 'Email', de: 'E-Mail' },
  labelAddress: { en: 'Address', de: 'Adresse' },
  statusError: { en: 'Error', de: 'Fehler' },
  statusDone: { en: 'Sent', de: 'Gesendet' },
};

export type CopyKey = keyof typeof copy;

export function t<K extends CopyKey>(c: Content, key: K): (typeof copy)[K]['en'] {
  return copy[key][c.lang] as (typeof copy)[K]['en'];
}

export function stepShot(c: Content, i: number): Shot {
  return { id: `s${i + 1}`, brief: copy.stepShots[c.lang][i] };
}
