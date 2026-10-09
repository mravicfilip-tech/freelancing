// Storyline 2, from studio/clients/ekotehnika/briefs/hero-rebuild/storyline-2-plan.md and Filip's voice over.
// One pinned story of 12,000px, then the products range and the footer as normal page sections.
// Beats marked hold are "stop scroll" moments, the scene rests while the text and tiles fill the open space.

export const LENGTH = 12000;

export type Section = 'hero' | 'kompanija' | 'prodaja' | 'servis' | 'najam' | 'automatizacija';

export type BeatSpan = {
  id: string;
  section: Section;
  start: number;
  end: number;
  hold?: boolean;
  note: string;
};

export const TIMELINE: BeatSpan[] = [
  { id: 'H', section: 'hero', start: 0, end: 500, hold: true, note: 'Hero, the forklift side on at the right, outdoor, still' },
  { id: 'D1', section: 'kompanija', start: 500, end: 1500, note: 'The Ekotehnika site moves past, forklift stays, wheels turn' },
  { id: 'C1', section: 'kompanija', start: 1500, end: 2300, hold: true, note: 'Stop in front of the building, load raised, company details' },
  { id: 'D2', section: 'kompanija', start: 2300, end: 2900, note: 'The drive continues to the path' },
  { id: 'F', section: 'kompanija', start: 2900, end: 3500, note: 'Smooth flip from side view to top down' },
  { id: 'R', section: 'kompanija', start: 3500, end: 4700, hold: true, note: 'Top down along the S path with the load to the warehouse, company details at left' },
  { id: 'Z', section: 'prodaja', start: 4700, end: 5300, note: 'Zoom into the warehouse roof' },
  { id: 'P', section: 'prodaja', start: 5300, end: 6400, hold: true, note: 'Prodaja text, then the 3D warehouse model with indoor forklifts' },
  { id: 'A', section: 'prodaja', start: 6400, end: 7600, note: 'Warehouse opens, side view, camera lowers and runs down the aisle at the forklift' },
  { id: 'B', section: 'prodaja', start: 7600, end: 8000, note: 'Camera zooms into a black part of the forklift' },
  { id: 'S', section: 'servis', start: 8000, end: 9000, hold: true, note: 'Dark blueprint forklift, still, wheels turn, diagonal lines move past' },
  { id: 'L', section: 'servis', start: 9000, end: 9600, note: 'A very large fork across the frame lifts the next section up' },
  { id: 'N', section: 'najam', start: 9600, end: 10500, hold: true, note: 'Many forklifts ready for rent, a grid filling row by row' },
  { id: 'T', section: 'najam', start: 10500, end: 10900, note: 'The grid drops away, the dark floor rises, dotted paths draw' },
  { id: 'AT', section: 'automatizacija', start: 10900, end: 12000, hold: true, note: 'Small robots carry boxes out and back along dotted paths' },
];

export const beatAt = (pos: number) => {
  for (let i = TIMELINE.length - 1; i >= 0; i--) if (pos >= TIMELINE[i].start) return i;
  return 0;
};
