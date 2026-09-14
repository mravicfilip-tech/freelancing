import { useEffect, useRef } from 'react';
import { Fast, Fx, Pay, Simple, Ui, MOTION } from '../../components/FigmaFeatures/illustrations';
import { Payments, Staking, Storage, Trading, SCENES } from '../../components/FigmaEcosystem/illustrations';
import { StepIllustration } from '../../components/FigmaHowToBuy/illustrations';
import type { ArtKind } from './data';
import '../../components/FigmaFeatures/illustrations/illustrations.css';
import '../../components/FigmaEcosystem/illustrations/ecosystem-illustrations.css';

/**
 * An update's picture is one of the site's own illustrations: the feature
 * band's scenes, the ecosystem pillars, or a how-to-buy step. They are drawn
 * in design px inside a stage that fits its box, so here each sits on the
 * site's light paper inside a frame the card sizes, cropped to the frame.
 *
 * The feature and ecosystem scenes are authored for GSAP: their parts start
 * hidden and the site's entrance builds them. Here each scene's own build
 * runs to its last frame, so a card shows the finished picture; only a
 * `live` frame (the feature card) then plays the scene's idle loop, and only
 * while it is on screen. The how-to-buy steps animate in CSS on their own.
 */
const SCENE: Record<ArtKind, () => React.ReactNode> = {
  ui: () => <Ui />,
  pay: () => <Pay />,
  fx: () => <Fx />,
  fast: () => <Fast />,
  simple: () => <Simple />,
  payments: () => <Payments />,
  trading: () => <Trading />,
  staking: () => <Staking />,
  storage: () => <Storage />,
  'hb-claim': () => <StepIllustration step="claim" />,
  'hb-signup': () => <StepIllustration step="sign-up" />,
  'hb-currency': () => <StepIllustration step="currency" />,
};

export function UpdateArt({ kind, className, live = false }: { kind: ArtKind; className?: string; live?: boolean }) {
  const Scene = SCENE[kind];
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const il = root.current?.querySelector<HTMLElement>('.ff__il');
    if (!il) return;
    const id = il.dataset.il ?? '';
    const motion = MOTION[id] ?? SCENES[id.replace(/^ec-/, '')];
    if (!motion) return;

    let cancelled = false;
    let build: gsap.core.Timeline | undefined;
    let loop: gsap.core.Timeline | undefined;
    let io: IntersectionObserver | undefined;

    Promise.all([import('gsap'), import('gsap/MotionPathPlugin')]).then(([{ gsap }, { MotionPathPlugin }]) => {
      if (cancelled) return;
      gsap.registerPlugin(MotionPathPlugin);
      build = gsap.timeline({ paused: true });
      motion.build(build, il, 0, gsap);
      build.progress(1);
      if (!live || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      loop = motion.idle(gsap, il);
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? loop?.play() : loop?.pause()), { rootMargin: '60px' });
      io.observe(il);
    });

    return () => {
      cancelled = true;
      io?.disconnect();
      loop?.kill();
      build?.kill();
    };
  }, [kind, live]);

  return (
    <div ref={root} className={`upd-art${className ? ` ${className}` : ''}`} data-art={kind} aria-hidden="true">
      <div className="upd-art__fit">
        <Scene />
      </div>
    </div>
  );
}
