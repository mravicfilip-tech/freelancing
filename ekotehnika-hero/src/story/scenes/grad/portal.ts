// The DOM layer the Grad labels render into. It sits inside the scene's own wrapper, so React owns
// it and unmounting a combination never reaches into the pin spacer. R3F bridges this context.
import { createContext, type RefObject } from 'react';

export const LabelLayer = createContext<RefObject<HTMLDivElement | null> | null>(null);
