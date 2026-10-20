import { Play } from '@phosphor-icons/react';
import { gameById } from '../../../data/games';
import { Key } from './ui';
import { Figure, OnlinePill, Sparks, StreakPill, TopWin } from './hero/parts';
import './hero/hero.css';

// The hero, round 8 (note 6). Filip's pick, "Combo baseline and 3, no slider". The art of the round 8
// carousel's welcome slide, held still, the purple sunset beach (lobby/hero-sunset, 1740 by 907,
// mirrored so the sun sits high on the right) with the redhead from the register page (auth/
// register-player, 601 by 1000) standing in it, and the round 7 hero's layout round it. The online
// pill, the headline, the line and Play Sugar Rush on the left, Top win today on the right from 1920
// and under the key below it, the streak pill low by her feet. Built on briefs/round-7/art-recipe.md,
// back to front. The scene graded into the purple and out of focus, the sun's colour, the vignette that
// calms the copy side, her figure with the light wrap and a warm rim from the sun, the haze across her
// crop, and sparks. Under 768px the art takes a band at the top and the copy runs under it.
// onGiveaway and onChest stay optional in the signature, so the page and the phone shell can pass them
// unchanged. This hero has no key for them.

const SPARKS = [
  { x: '60%', y: '30%', delay: 0, dur: 15 },
  { x: '86%', y: '24%', delay: -9, dur: 16 },
  { x: '92%', y: '60%', delay: -4, dur: 18, lilac: true },
  { x: '68%', y: '70%', delay: -12, dur: 17, lilac: true },
];

export function Hero({ onPlay }: { onPlay: () => void; onGiveaway?: () => void; onChest?: () => void }) {
  const game = gameById('sugar-rush')!;
  return (
    <section aria-labelledby="n1-hero-title" className="h8-hero">
      <span aria-hidden className="h8-art">
        {/* 1. The scene, never drawn past its source pixels, graded, with the sun turned orange. */}
        <span className="h8-scene">
          <img src="/art/lobby/hero-sunset.webp" alt="" className="h8-scene-img" />
        </span>
        <span className="h8-grade" />
        <span className="h8-sun" />
        {/* 7. The vignette sits under her, so it calms the copy side and never darkens her. */}
        <span className="h8-vignette" />
        {/* 4 and 5. The redhead, drawn at most 516 tall, lit warm from the sun on her right. */}
        <Figure src="/art/auth/register-player.webp" w={601} h={1000} className="h8-her" />
        {/* 3 and 6. Her dress ends at the frame, so the haze crosses her crop, and the sparks drift in
            front of her. */}
        <span className="h8-haze" />
        <Sparks items={SPARKS} />
      </span>

      <StreakPill className="h8-streak" />
      {/* Top win today on the right from 1920, as the round 7 hero places it. */}
      <TopWin onPlay={onPlay} className="h8-win-tall hidden flex-col gap-4 p-6 w1920:flex" />

      <div className="h8-copy">
        <div className="flex flex-col items-start gap-6">
          <OnlinePill className="h8-online" />
          <div className="flex flex-col gap-4">
            {/* The page's one heading style, Bai Jamjuree 700 in sentence case (round 7, note 2). */}
            <h1 id="n1-hero-title" className="h8-head font-display font-bold text-ink">
              Where luck
              <br />
              meets lust.
            </h1>
            <p className="h8-line text-16 font-medium leading-6">Spin, win and open a free chest every single day.</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-6">
          <Key tone="orange" size={56} onClick={onPlay} className="h8-key gap-3 pl-8 pr-[10px]">
            Play {game.short ?? game.name}
            <span className="n1-key-mark h-9 w-9">
              <Play weight="fill" className="h-4 w-4 translate-x-px" aria-hidden />
            </span>
          </Key>
          {/* Below 1920 the top win sits under the key, a wide card, so it never covers her. */}
          <TopWin onPlay={onPlay} wide className="h8-win-wide flex w-full items-center gap-4 p-3 pr-4 w1920:hidden" />
        </div>
      </div>
    </section>
  );
}
