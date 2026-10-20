import { Figure, Headline, Line, OnlinePill, PlayKey, Scene, Sparks, StreakChip, TopWin } from './parts';

// Iteration 1, Spotlight right (round 8, note 6, plan part C1). The headline side is a clean deep
// purple with one soft light behind the text. The scene, the lagoon at sunset from the register page
// (auth/register-sunset, 1100 by 1375), shows only in the right part, behind the woman, and fades into
// the purple at its left edge. The sun low over the water is her key light, warm on her left side.
// Top win today sits low on the right and crosses the scene's edge. Layers follow
// briefs/round-7/art-recipe.md, the scene, the key light and haze, her figure with the light wrap and
// rim, the haze across her crop and the card in front of her, the vignette.

const SPARKS = [
  { x: '58%', y: '30%', delay: 0, dur: 15 },
  { x: '66%', y: '64%', delay: -6, dur: 18, lilac: true },
  { x: '84%', y: '22%', delay: -10, dur: 16 },
  { x: '92%', y: '58%', delay: -3, dur: 19, lilac: true },
  { x: '75%', y: '80%', delay: -12, dur: 17 },
];

export function Spotlight({ onPlay }: { onPlay: () => void }) {
  return (
    <section aria-labelledby="h8-title" data-hero="1" className="h8-hero h8-spot">
      {/* The one soft light behind the text. */}
      <span aria-hidden className="h8-spot-light" />

      {/* 1 and 2. The scene, graded toward the purple and out of focus, fading in from the left, with
          the sun's warm light behind her shoulder and a haze band low in the frame. */}
      <span aria-hidden className="h8-spot-stage">
        <Scene src="/art/auth/register-sunset.webp" className="h8-spot-scene" />
        <span className="h8-spot-grade" />
        <span className="h8-spot-sun" />
      </span>

      {/* 4 and 5. The woman, 618 by 1036, drawn at most 516 tall, lit from the sun on her left. */}
      <Figure src="/art/landing/girl-offshoulder.webp" w={618} h={1036} className="h8-spot-fig" />

      {/* 3 and 6. She is cropped above her knees, so the haze crosses her crop, and the top win card in
          front of her takes the rest. */}
      <span aria-hidden className="h8-haze h8-spot-haze" />
      <Sparks items={SPARKS} className="h8-spot-sparks" />
      {/* 7. The vignette, the scene melts into the hero's edge at the top, the bottom and the right. */}
      <span aria-hidden className="h8-spot-vignette" />

      <div className="h8-spot-copy">
        <div className="h8-spot-chips">
          <OnlinePill />
          <StreakChip className="h8-spot-streak" />
        </div>
        <div className="flex flex-col gap-4">
          <Headline id="h8-title" />
          <Line className="h8-spot-line" />
        </div>
        <PlayKey onPlay={onPlay} className="h8-spot-key" />
      </div>

      <TopWin onPlay={onPlay} layout="wide" className="h8-spot-win" />
    </section>
  );
}
