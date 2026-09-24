import type { VariantId } from '../variants';
import type { Treatment } from './types';
import { LinedTreatment } from './lined';

/**
 * The treatment, available synchronously because LogoScene's constructor
 * reads it immediately.
 */
export function createTreatment(_id: VariantId): Treatment {
  return new LinedTreatment();
}

/** The same treatment, as the async step the loader in index.tsx awaits. */
export async function loadTreatment(_id: VariantId): Promise<Treatment> {
  return new LinedTreatment();
}
