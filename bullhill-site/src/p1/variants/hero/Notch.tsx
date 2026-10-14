import type { Lang } from '../../../shared/content';
import { Photo } from '../../../shared/Photo';
import { photoAlt, type PhotoId } from '../../../shared/photos';

// The notched photo frame from work card note 1. A 1px hairline, an 8px inset, the bottom right
// corner cut with a skewed bar in the notch, and crosshair marks on the four corners. Sizing comes
// from the caller, the frame fills its box. The `s` size is for the small thumbnails.
export function NotchFrame({ id, lang, focal, size = 'l', sizes, priority }: { id: PhotoId; lang: Lang; focal?: string; size?: 'l' | 's'; sizes?: string; priority?: boolean }) {
  return (
    <div className={`hn${size === 's' ? ' hn--s' : ''}`}>
      <i className="hn__x hn__x--tl" aria-hidden="true" />
      <i className="hn__x hn__x--tr" aria-hidden="true" />
      <i className="hn__x hn__x--bl" aria-hidden="true" />
      <i className="hn__x hn__x--br" aria-hidden="true" />
      <div className="hn__clip">
        <Photo id={id} alt={photoAlt(id, lang)} focal={focal} sizes={sizes} priority={priority} className="hn__ph" />
      </div>
      <span className="hn__bar" aria-hidden="true" />
    </div>
  );
}
