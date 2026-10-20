import { DAILY_CHEST, ONLINE_NOW } from '../../shared/data';
import { Live } from '../ui';
import { Faces, Figure, FireMark, Headline, Line, PlayKey, Scene, Sparks, TopWin } from './parts';

// Iteration 2, Poster (round 8, note 6, plan part C2). The scene runs edge to edge, Filip's own lagoon
// cove from the landing hero (landing/hero-beach, 1920 by 1259), the only scene wide enough to fill the
// hero at 2560 without being drawn past its pixels. It is graded from sunset into a warm night, the
// sky deep purple, the sun's last light orange on the water. The woman with the lei stands large,
// centre right, cropped at the thigh, mirrored so the light on her faces the sun. The headline sits in
// a frosted glass panel on the left. Online now, Top win today and the streak share one glass bar along
// the bottom, which crosses her crop as the thing in front of her.

const SPARKS = [
  { x: '50%', y: '26%', delay: 0, dur: 16 },
  { x: '56%', y: '58%', delay: -7, dur: 19, lilac: true },
  { x: '76%', y: '20%', delay: -11, dur: 15 },
  { x: '82%', y: '50%', delay: -4, dur: 18, lilac: true },
  { x: '90%', y: '34%', delay: -13, dur: 17 },
];

export function Poster({ onPlay }: { onPlay: () => void }) {
  return (
    <section aria-labelledby="h8-title" data-hero="2" className="h8-hero h8-poster">
      {/* 1 and 2. The cove, graded to night, the sky darkened into purple and the sun's light on the
          water. */}
      <span aria-hidden className="h8-poster-stage">
        <Scene src="/art/landing/hero-beach.webp" className="h8-poster-scene" />
        <span className="h8-poster-sky" />
        <span className="h8-poster-grade" />
        <span className="h8-poster-sun" />
      </span>

      {/* 4 and 5. The woman, 533 by 1100, drawn at most 620 tall, the frame cutting her at the thigh. */}
      <Figure src="/art/landing/girl-lei.webp" w={533} h={1100} flip className="h8-poster-fig" />

      {/* 3, 6 and 7. The haze across her crop, sparks, and the vignette that calms the panel side. */}
      <span aria-hidden className="h8-haze h8-poster-haze" />
      <Sparks items={SPARKS} className="h8-poster-sparks" />
      <span aria-hidden className="h8-poster-vignette" />

      <div className="h8-poster-panel">
        <div className="flex flex-col gap-4">
          <Headline id="h8-title" />
          <Line className="h8-poster-line" />
        </div>
        <PlayKey onPlay={onPlay} />
      </div>

      {/* The one bar along the bottom. */}
      <div className="h8-poster-bar">
        <p className="h8-poster-cell">
          <span className="n1-label h8-label">Online now</span>
          <span className="flex items-center gap-2 text-20 font-extrabold leading-7 text-ink">
            <Live />
            <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span>
            <Faces className="ml-0" />
          </span>
        </p>
        <span aria-hidden className="h8-poster-rule" />
        <TopWin onPlay={onPlay} layout="cell" className="h8-poster-win" />
        <span aria-hidden className="h8-poster-rule" />
        <p className="h8-poster-cell">
          <span className="n1-label h8-label">Your streak</span>
          <span className="flex items-center gap-2 text-20 font-extrabold leading-7 text-ink">
            <FireMark />
            <span>
              <span className="num">{DAILY_CHEST.streak}</span> days
            </span>
          </span>
        </p>
      </div>
    </section>
  );
}
