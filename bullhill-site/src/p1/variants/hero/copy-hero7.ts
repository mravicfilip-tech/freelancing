import type { Content } from '../../../shared/content';

// Strings hero 7 needs that content.ts does not carry. No colons, no dashes. The five steps are the
// names in briefs/website/hero7-excavator.md.
const copy = {
  en: {
    code: 'BH 002',
    name: 'Fibre route',
    note: 'From the road to the house, dug, laid and restored.',
    figure: 'An excavator digging a trench along a village verge. The ground ahead of the machine is still a drawing, the ground behind it is rendered.',
    steps: ['Mark the route', 'Dig', 'Lay ducts', 'Fibre blown in', 'Backfill and restore'],
  },
  de: {
    code: 'BH 002',
    name: 'Glasfasertrasse',
    note: 'Von der Straße bis zum Haus, gegraben, verlegt und wiederhergestellt.',
    figure: 'Ein Bagger hebt einen Graben am Dorfrand aus. Das Gelände vor der Maschine ist noch eine Zeichnung, das Gelände dahinter ist gerendert.',
    steps: ['Trasse markieren', 'Graben', 'Leerrohre verlegen', 'Glasfaser eingeblasen', 'Verfüllen und wiederherstellen'],
  },
};

export const t7 = (c: Content) => copy[c.lang];
