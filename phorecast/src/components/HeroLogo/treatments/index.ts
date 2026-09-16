import type { VariantId } from '../variants';
import type { Treatment } from './types';
import { LinedTreatment } from './lined';

/**
 * The default treatment, available synchronously because LogoScene's
 * constructor reads it immediately.
 */
export function createTreatment(_id: VariantId): Treatment {
  return new LinedTreatment();
}

/**
 * Resolves any treatment, loading the non-default ones on demand.
 *
 * Importing all five statically pulled their whole Three.js surface into the
 * bundle — physical materials, the PMREM generator, points, box geometry —
 * for treatments the site never uses. Both placements use `lined`; the rest
 * exist for `?variant=` and are not worth shipping to everyone.
 */
export async function loadTreatment(id: VariantId): Promise<Treatment> {
  switch (id) {
    case 'glass':
      return new (await import('./glass')).GlassTreatment();
    case 'particles':
      return new (await import('./particles')).ParticlesTreatment();
    case 'solid':
      return new (await import('./solid')).SolidTreatment();
    case 'liquid':
      return new (await import('./liquid')).LiquidTreatment();
    default:
      return new LinedTreatment();
  }
}
