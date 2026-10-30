// Storyline 2, from studio/clients/ekotehnika/briefs/hero-rebuild/storyline-2-plan.md and Filip's voice over.
// One pinned story of 13,000px, 16,100px with the warehouse Najam (?najam=2, see preview.ts), then the products range and the footer as normal page sections.
// Beats marked hold are "stop scroll" moments, the scene rests while the text and tiles fill the open space.

import { NAJAM } from './preview';

// Najam 0 is production's Najam, the grid of forklifts that fills row by row, N 900px and T and AT where they were. Najam 2 is the
// warehouse story of round 6, N 4,000px and T and AT 3,100px later. Every beat index stays either way.
export const WAREHOUSE = NAJAM > 0;
export const LENGTH = WAREHOUSE ? 16100 : 13000;

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
  { id: 'S', section: 'servis', start: 8000, end: 10000, hold: true, note: 'The X50 lit on the black ground, then from k 0.5 the servis map, Čurug and Vrčin and their roads' },
  { id: 'L', section: 'servis', start: 10000, end: 10600, note: 'A very large fork across the frame lifts the next section up' },
  WAREHOUSE
    ? { id: 'N', section: 'najam', start: 10600, end: 14600, hold: true, note: 'Najam as one rent story, a working warehouse in four sub beats and three flights, see N_SUB' }
    : { id: 'N', section: 'najam', start: 10600, end: 11500, hold: true, note: 'Many forklifts ready for rent, a grid filling row by row' },
  { id: 'T', section: 'najam', start: WAREHOUSE ? 14600 : 11500, end: WAREHOUSE ? 15000 : 11900, note: WAREHOUSE ? 'The hall drops away and the camera goes down into the automation aisle' : 'The grid drops away, the dark floor rises, dotted paths draw' },
  { id: 'AT', section: 'automatizacija', start: WAREHOUSE ? 15000 : 11900, end: WAREHOUSE ? 16100 : 13000, hold: true, note: 'Small robots carry boxes out and back along dotted paths' },
];

// The servis map, the second half of S, round 5. Not a beat of its own, so every beat index and every u in the scenes stays,
// but a layer of the shell with its own span, from S k 0.5 to L k 0.5, where the fork has lifted Najam over it.
export const SERVIS_MAP: BeatSpan = { id: 'SM', section: 'servis', start: 9000, end: 10300, hold: true, note: 'The servis map, two centres and twelve roads to the ends of Serbia' };

// Najam, round 6. N grew from 900px to 4,000px and tells one rent story in a working warehouse, four sub beats and three camera flights
// between them, all of the one beat so every beat index and every u in the scenes stays. The windows are shares of N, k of N, and the
// scene and the shell both read them here. N1 the lorry arrives at the docks, N2 the pallets come off it, N3 the pallets go into the
// racks and the term cells light one by one, N4 the lorry is loaded and leaves. The flights carry the camera from the high view down
// to dock 1, from the dock to the end of the last aisle, and from there up to the high view again. Each flight is 520px, as long as the
// flights of F and Z are, with no two touching, and N4 ends on the pose T starts from, so T has the whole move into the aisle to itself.
export const N_SUB = { N1: [0, 0.15], N2: [0.28, 0.42], N3: [0.55, 0.75], N4: [0.88, 1] } as const;
export const N_FLIGHT = { dock: [0.15, 0.28], aisle: [0.42, 0.55], high: [0.75, 0.88] } as const;

// The four pallets that go up into the racks in N3, as k of N, the moment each one is set down. The scene lands a pallet on these
// marks and the lit term cell in the shell moves on at the same marks, 36 months at the first and 72 at the fourth. The first two are
// X50s, the third a reach truck on the second beam and the last the reach truck at the top beam. They spread over N3, a pallet every
// 150px or so.
export const N_PALLETS = [0.63, 0.667, 0.7, 0.735] as const;

// The terms pane, a layer only span over the rest of N after the second flight. It is not a beat of its own, so the beat indices stay,
// but a layer of the shell. Today's words of N stay over N1, the first flight, N2 and the second flight, and are cut as the terms start
// to rise in the last 0.03 of that flight, 120px before the camera arrives, so the screen never stands without words for longer than
// the first letters take to come up. The terms hold through N3, the third flight and N4 to the end of N, where T takes the floor.
const N_BEAT = TIMELINE.find((b) => b.id === 'N')!;
export const N_SWAP = N_FLIGHT.aisle[1] - 0.03;
export const NAJAM_TERMS: BeatSpan = {
  id: 'NT',
  section: 'najam',
  start: N_BEAT.start + N_SWAP * (N_BEAT.end - N_BEAT.start),
  end: N_BEAT.end,
  hold: true,
  note: 'The rental terms, 36, 48, 60 and 72 months, the lit one moving on as each pallet goes up',
};

export const beatAt = (pos: number) => {
  for (let i = TIMELINE.length - 1; i >= 0; i--) if (pos >= TIMELINE[i].start) return i;
  return 0;
};
