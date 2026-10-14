import type { CSSProperties } from 'react';
import { PHOTOS, type PhotoId } from './photos';

type Props = {
  id: PhotoId;
  alt: string;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  focal?: string;
};

// One of BullHill's own photos. Fills its box with object-fit cover, so the caller sizes the box
// (aspect-ratio, height or a grid cell). focal overrides the photo's default object-position.
export function Photo({ id, alt, sizes = '100vw', className, style, priority = false, focal }: Props) {
  const p = PHOTOS[id];
  const srcSet = p.widths.map((w) => `/photos/${id}-${w}.webp ${w}w`).join(', ');
  return (
    <picture className={`photo ${className ?? ''}`} style={style}>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img
        src={`/photos/${id}-1280.jpg`}
        alt={alt}
        width={p.w}
        height={p.h}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        style={{ objectPosition: focal ?? p.focal }}
      />
    </picture>
  );
}
