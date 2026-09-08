import type { Timeline, Gsap } from '../../FigmaFeatures/illustrations/motion';
import { Payments, paymentsMotion } from './Payments';
import { Trading, tradingMotion } from './Trading';
import { Staking, stakingMotion } from './Staking';
import { Storage, storageMotion } from './Storage';

/** A pillar's illustration: `build` runs when it is shown, `idle` returns its loop. */
export interface SceneMotion {
  build(tl: Timeline, il: HTMLElement, at: number, gsap: Gsap): void;
  idle(gsap: Gsap, il: HTMLElement): Timeline;
}

export { Payments, Trading, Staking, Storage };
export const SCENES: Record<string, SceneMotion> = { payments: paymentsMotion, trading: tradingMotion, staking: stakingMotion, storage: storageMotion };
