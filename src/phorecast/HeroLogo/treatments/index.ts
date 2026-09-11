import type { VariantId } from '../variants';
import type { Treatment } from './types';
import { LinedTreatment } from './lined';
import { GlassTreatment } from './glass';
import { ParticlesTreatment } from './particles';
import { SolidTreatment } from './solid';
import { LiquidTreatment } from './liquid';

export function createTreatment(id: VariantId): Treatment {
  switch (id) {
    case 'glass':
      return new GlassTreatment();
    case 'particles':
      return new ParticlesTreatment();
    case 'solid':
      return new SolidTreatment();
    case 'liquid':
      return new LiquidTreatment();
    default:
      return new LinedTreatment();
  }
}
