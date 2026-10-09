// The hero story timeline, from studio/clients/ekotehnika/briefs/hero-rebuild/storyboard.html.
// 9,000px of pinned scroll, 14 beats, three per service. Beats marked clip play by themselves for
// about clip seconds once the visitor stops scrolling inside them, scroll skips them to their end.
// U1 plays on load. Panel copy lives in src/board/beats.tsx, BEATS[i].panel(k), same order.

export const LENGTH = 9000;

export type ServiceId = 'najam' | 'polovni' | 'novi' | 'servis';

export type BeatSpan = {
  id: string;
  service: ServiceId | null;
  start: number;
  end: number;
  clip?: number;
};

export const TIMELINE: BeatSpan[] = [
  { id: 'U1', service: null, start: 0, end: 450, clip: 3 },
  { id: 'N1', service: 'najam', start: 450, end: 1110 },
  { id: 'N2', service: 'najam', start: 1110, end: 1770, clip: 3 },
  { id: 'N3', service: 'najam', start: 1770, end: 2430 },
  { id: 'P1', service: 'polovni', start: 2430, end: 3090 },
  { id: 'P2', service: 'polovni', start: 3090, end: 3750, clip: 3 },
  { id: 'P3', service: 'polovni', start: 3750, end: 4410 },
  { id: 'V1', service: 'novi', start: 4410, end: 5070 },
  { id: 'V2', service: 'novi', start: 5070, end: 5730, clip: 3 },
  { id: 'V3', service: 'novi', start: 5730, end: 6390 },
  { id: 'S1', service: 'servis', start: 6390, end: 7050 },
  { id: 'S2', service: 'servis', start: 7050, end: 7710, clip: 3 },
  { id: 'S3', service: 'servis', start: 7710, end: 8370 },
  { id: 'K1', service: null, start: 8370, end: 9000 },
];

export const SERVICES: { id: ServiceId; name: string; href: string }[] = [
  { id: 'najam', name: 'Najam', href: 'https://ekotehnika.rs/iznajmljivanje-viljuskara-cena/' },
  { id: 'polovni', name: 'Polovni', href: 'https://ekotehnika.rs/polovni-linde-viljuskari/' },
  { id: 'novi', name: 'Novi', href: 'https://ekotehnika.rs/viljuskari/' },
  { id: 'servis', name: 'Servis', href: 'https://ekotehnika.rs/servis/odrzavanje-i-popravka/' },
];

// The beat each service opens on, for the rail.
export const firstBeatOf = (s: ServiceId) => TIMELINE.findIndex((b) => b.service === s);

// The still each service shows with reduced motion, its last beat at rest.
export const stillBeatOf = (s: ServiceId) => {
  let last = 0;
  TIMELINE.forEach((b, i) => {
    if (b.service === s) last = i;
  });
  return last;
};

export const beatAt = (pos: number) => {
  for (let i = TIMELINE.length - 1; i >= 0; i--) if (pos >= TIMELINE[i].start) return i;
  return 0;
};
