import type { Content } from '../../../shared/content';

// Strings hero 7 needs that content.ts does not carry. No colons, no dashes. The five steps are the
// names in briefs/website/hero7-excavator.md.
const copy = {
  en: {
    code: 'BH 002',
    name: 'Fibre route',
    note: 'From the road to the house, dug, laid and restored.',
    figure: 'An excavator digs a trench along a village verge from a house to the street. Ducts are laid, fibre is blown in to the house and the verge is restored. Where the ground is still a drawing the work has not reached it, where it is rendered the work is done.',
    steps: ['Mark the route', 'Dig', 'Lay ducts', 'Fibre blown in', 'Backfill and restore'],
  },
  de: {
    code: 'BH 002',
    name: 'Glasfasertrasse',
    note: 'Von der Straße bis zum Haus, gegraben, verlegt und wiederhergestellt.',
    figure: 'Ein Bagger hebt am Dorfrand einen Graben vom Haus bis zur Straße aus. Leerrohre werden verlegt, die Glasfaser wird bis zum Haus eingeblasen und der Seitenstreifen wird wiederhergestellt. Wo das Gelände noch eine Zeichnung ist, hat die Arbeit es nicht erreicht, wo es gerendert ist, ist sie getan.',
    steps: ['Trasse markieren', 'Graben', 'Leerrohre verlegen', 'Glasfaser eingeblasen', 'Verfüllen und wiederherstellen'],
  },
};

export const t7 = (c: Content) => copy[c.lang];
