// Storyline 2, from studio/clients/ekotehnika/briefs/hero-rebuild/storyline-2-plan.md and Filip's voice over.
// One pinned story of 13,000px, 16,940px with the warehouse Najam (?najam=2, see preview.ts), then the products range and the footer as normal page sections.
// Beats marked hold are "stop scroll" moments, the scene rests while the text and tiles fill the open space.

import { NAJAM } from './preview';

// Najam 0 is production's Najam, the grid of forklifts that fills row by row, N 900px and T and AT where they were. Najam 2 is the
// warehouse story of round 6, N 4,640px since round 7 gave Istovar 900px, T 600px, and T and AT 3,740px later. Every beat index stays either way.
export const WAREHOUSE = NAJAM > 0;
export const N_LEN = 4640;
// T, the one camera move from the high view down through the roof light into the automation aisle. 600px in Najam 2, 400px in Najam 0.
export const T_LEN = WAREHOUSE ? 600 : 400;
// The u at which Najam 2 swaps the inside of its hall for the automation aisle's, 0.45 of the way down T. The camera is 46 m up and 60 m out, the roof
// is shut, and the roof light starts to open only at 13.5, so no frame of the move can see the swap.
export const T_SWAP = 13.45;
export const LENGTH = WAREHOUSE ? 12100 + N_LEN + (T_LEN - 400) : 13000;

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
    ? { id: 'N', section: 'najam', start: 10600, end: 10600 + N_LEN, hold: true, note: 'Najam as one rent story, a working warehouse in four sub beats and three flights, see N_SUB' }
    : { id: 'N', section: 'najam', start: 10600, end: 11500, hold: true, note: 'Many forklifts ready for rent, a grid filling row by row' },
  { id: 'T', section: 'najam', start: WAREHOUSE ? 10600 + N_LEN : 11500, end: WAREHOUSE ? 10600 + N_LEN + T_LEN : 11900, note: WAREHOUSE ? 'The camera dives from the high view through the roof light into the automation aisle, the hall stays' : 'The grid drops away, the dark floor rises, dotted paths draw' },
  { id: 'AT', section: 'automatizacija', start: WAREHOUSE ? 10600 + N_LEN + T_LEN : 11900, end: WAREHOUSE ? 11700 + N_LEN + T_LEN : 13000, hold: true, note: 'Small robots carry boxes out and back along dotted paths' },
];

// The servis map, the second half of S, round 5. Not a beat of its own, so every beat index and every u in the scenes stays,
// but a layer of the shell with its own span, from S k 0.5 to L k 0.5, where the fork has lifted Najam over it.
export const SERVIS_MAP: BeatSpan = { id: 'SM', section: 'servis', start: 9000, end: 10300, hold: true, note: 'The servis map, two centres and twelve roads to the ends of Serbia' };

// Najam, round 6. N grew from 900px to 4,300px and tells one rent story in a working warehouse, four sub beats and three camera flights
// between them, all of the one beat so every beat index and every u in the scenes stays. Round 7 gave Istovar 900px of it and N 4,640px. The
// windows are shares of N, k of N, written here as the scroll they take, and the scene and the shell both read them. N1 the lorry arrives at the
// docks, N2 the pallets come off it, N3 the pallets go into the racks and the term cells light one by one, N4 the lorry is loaded and leaves. The
// flights carry the camera from the high view down to dock 1, from the yard in through the door of dock 1 to the end of the last aisle, and from
// there up through the roof light to the high view again. The flight in through the door is the longest, 820px, since it is one calm move that
// glides along the facade, goes through the doorway and settles inside, and the other two are 520px, as long as the flights of F and Z are. No two
// flights touch, and N4 ends on the pose T starts from, so T has the whole move into the aisle to itself.
//   N1 0 to 600   dock flight 600 to 1,120   N2 1,120 to 2,020   aisle flight 2,020 to 2,840   N3 2,840 to 3,640   high flight 3,640 to 4,160   N4 4,160 to 4,640
const nk = (px: number) => px / N_LEN;
export const N_SUB = { N1: [0, nk(600)], N2: [nk(1120), nk(2020)], N3: [nk(2840), nk(3640)], N4: [nk(4160), 1] } as const;
export const N_FLIGHT = { dock: [nk(600), nk(1120)], aisle: [nk(2020), nk(2840)], high: [nk(3640), nk(4160)] } as const;

// The hall's plan, najamplan.ts and najamdock.ts, was written for the first build of N, 4,000px with a flight of 520px in through the door, and
// every mark in it is a k of that N. Two parts of the story grew since, so the plan keeps its own clock, planK. Istovar grew from 560px to 900px
// and the plan's 560px of it play over the 900, so each forklift trip is a third slower and a third longer in the scroll, and the flight in grew
// from 520px to 820px, played the same way. Everywhere else the plan runs with the story px for px, so N1, N3 and N4 play as they always did and
// nothing in them moved but where it stands in the scroll. Kept free of everything so a node check can read it.
const PLAN_LEN = 4000;
const N2_PX = [1120, 2020] as const;
const N2_PLAN_PX = 560;
const IN_PX = [2020, 2840] as const;
const IN_PLAN_PX = 520;
// the scroll the plan does not use, after the flight in
const PLAN_SLACK = N2_PX[1] - N2_PX[0] - N2_PLAN_PX + (IN_PX[1] - IN_PX[0] - IN_PLAN_PX);
export const planK = (k: number) => {
  const px = k * N_LEN;
  if (px <= N2_PX[0]) return px / PLAN_LEN;
  if (px < N2_PX[1]) return (N2_PX[0] + ((px - N2_PX[0]) * N2_PLAN_PX) / (N2_PX[1] - N2_PX[0])) / PLAN_LEN;
  if (px <= IN_PX[0]) return (N2_PX[0] + N2_PLAN_PX) / PLAN_LEN;
  if (px < IN_PX[1]) return (N2_PX[0] + N2_PLAN_PX + ((px - IN_PX[0]) * IN_PLAN_PX) / (IN_PX[1] - IN_PX[0])) / PLAN_LEN;
  return (px - PLAN_SLACK) / PLAN_LEN;
};
// the story k of a plan k after the flight in, for the marks the shell reads
const storyOfPlan = (m: number) => (m * PLAN_LEN + PLAN_SLACK) / N_LEN;

// The four pallets that go up into the racks in N3, as k of the plan, the moment each one is set down, and the same as k of N. The scene
// lands a pallet on the plan marks and the lit term cell in the shell moves on at the story marks, 36 months at the first and 72 at the
// fourth. The first two are X50s, the third a reach truck on the second beam and the last the reach truck at the top beam. They spread over
// N3, a pallet every 150px or so.
export const N_PLAN_PALLETS = [0.63, 0.667, 0.7, 0.735] as const;
export const N_PALLETS = N_PLAN_PALLETS.map(storyOfPlan) as unknown as readonly [number, number, number, number];

// The terms pane, a layer only span over the rest of N after the flight in. It is not a beat of its own, so the beat indices stay, but a layer
// of the shell. Today's words of N stay over N1, the first flight, N2 and the first part of the flight in, and leave in N_LEAVE, 50px of
// scroll, while the camera is still in the yard, 300px before it reaches the door, so nothing is ever read over the doorway. The screen has no
// words for the passage through the door and the run along the wall, and the terms rise only when the camera stands still inside, at the
// end of the flight. They hold through N3, the third flight and N4 to the end of N, where T takes the floor.
const N_BEAT = TIMELINE.find((b) => b.id === 'N')!;
export const N_LEAVE = [nk(2140), nk(2190)] as const;
export const N_SWAP = N_FLIGHT.aisle[1];
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
