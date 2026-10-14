import type { Content } from '../../../shared/content';

// Strings hero 6 needs that content.ts does not carry. No colons, no dashes.
const copy = {
  en: {
    code: 'BH 001',
    name: 'Fibre trench',
    note: 'Ducts in a sand bed, backfilled in compacted layers.',
    schematic: 'Schematic',
    render: 'Render',
    figure: 'A block of ground cut open with five ducts running through it. The left half is a schematic drawing, the right half a render of the same block.',
    // the five steps of the scroll, named on screen as it reaches each
    steps: ['Dig', 'Sand bed', 'Ducts', 'Ready for fibre', 'Backfill and restore'],
  },
  de: {
    code: 'BH 001',
    name: 'Glasfasergraben',
    note: 'Rohre im Sandbett, in verdichteten Lagen verfüllt.',
    schematic: 'Schema',
    render: 'Render',
    figure: 'Ein aufgeschnittener Block Erdreich mit fünf Rohren. Die linke Hälfte ist eine Schemazeichnung, die rechte Hälfte ein Render desselben Blocks.',
    steps: ['Graben', 'Sandbett', 'Leerrohre', 'Bereit für Glasfaser', 'Verfüllen und wiederherstellen'],
  },
};

export const t6 = (c: Content) => copy[c.lang];
