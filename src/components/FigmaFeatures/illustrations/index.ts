import type { IllustrationMotion } from './motion';
import { payMotion } from './Pay';
import { fxMotion } from './Fx';
import { simpleMotion } from './Simple';
import { fastMotion } from './Fast';
import { uiMotion } from './Ui';

export { Pay } from './Pay';
export { Fx } from './Fx';
export { Simple } from './Simple';
export { Fast } from './Fast';
export { Ui } from './Ui';
export type { IllustrationMotion } from './motion';

/** Motion for each illustration, keyed by the Stage's `data-il`. */
export const MOTION: Record<string, IllustrationMotion> = { pay: payMotion, fx: fxMotion, simple: simpleMotion, fast: fastMotion, ui: uiMotion };
