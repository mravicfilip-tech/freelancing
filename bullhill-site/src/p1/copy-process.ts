import type { Content } from '../shared/content';

// Strings the process section needs that content.ts does not carry.
const copy = {
  en: {
    knowMore: 'Know more',
    drawing: 'Cross section of a fibre trench',
    stepBrief: 'Site lead marking existing lines on the road with spray paint, survey day',
    ticks: {
      '01': ['Route walked.', 'Existing lines marked.', 'Road permits sorted.'],
      '02': ['Trench to plan depth.', 'Section by section.', 'Street kept passable.'],
      '03': ['Ducts on a sand bed.', 'Chambers set.', 'Warning tape above.'],
      '04': ['Trench compacted.', 'Surface put back.', 'Ready for cable.'],
    } as Record<string, string[]>,
  },
  de: {
    knowMore: 'Mehr erfahren',
    drawing: 'Querschnitt eines Glasfasergrabens',
    stepBrief: 'Bauleiter markiert bestehende Leitungen mit Sprühfarbe auf der Straße, Begehungstag',
    ticks: {
      '01': ['Trasse abgegangen.', 'Bestehende Leitungen markiert.', 'Genehmigungen geklärt.'],
      '02': ['Graben auf Plantiefe.', 'Abschnitt für Abschnitt.', 'Straße bleibt befahrbar.'],
      '03': ['Rohre im Sandbett.', 'Schächte gesetzt.', 'Warnband darüber.'],
      '04': ['Graben verdichtet.', 'Oberfläche wiederhergestellt.', 'Bereit für das Kabel.'],
    } as Record<string, string[]>,
  },
};

export const tp = (c: Content) => copy[c.lang];
