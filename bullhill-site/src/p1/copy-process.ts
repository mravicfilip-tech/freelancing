import type { Content } from '../shared/content';

// Strings the process section needs that content.ts does not carry.
const copy = {
  en: {
    knowMore: 'Know more',
    drawing: 'Cross section of a fibre trench',
    stepBrief: 'Site lead marking existing lines on the road with spray paint, survey day',
  },
  de: {
    knowMore: 'Mehr erfahren',
    drawing: 'Querschnitt eines Glasfasergrabens',
    stepBrief: 'Bauleiter markiert bestehende Leitungen mit Sprühfarbe auf der Straße, Begehungstag',
  },
};

export const tp = (c: Content) => copy[c.lang];
