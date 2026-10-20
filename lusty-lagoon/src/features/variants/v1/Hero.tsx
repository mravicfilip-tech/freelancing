import { useLocation } from 'react-router-dom';
import { BaseHero } from './hero/Base';
import { Spotlight } from './hero/Spotlight';
import { Poster } from './hero/Poster';
import { Carousel } from './hero/Carousel';
import './hero/hero.css';

// The hero, round 8 (note 6, plan part C). Filip asked for three iterations of the hero to pick from.
// With no ?hero param the page shows Base, the round 7 hero, unchanged on desktop. ?hero=1 is
// Spotlight right, ?hero=2 Poster, ?hero=3 Carousel. Each one holds under 768px wide too, so the
// phone shell renders this same component.

export function Hero({ onPlay, onGiveaway, onChest }: { onPlay: () => void; onGiveaway?: () => void; onChest?: () => void }) {
  const pick = new URLSearchParams(useLocation().search).get('hero');
  if (pick === '1') return <Spotlight onPlay={onPlay} />;
  if (pick === '2') return <Poster onPlay={onPlay} />;
  if (pick === '3') return <Carousel onPlay={onPlay} onGiveaway={onGiveaway} onChest={onChest} />;
  return <BaseHero onPlay={onPlay} />;
}
