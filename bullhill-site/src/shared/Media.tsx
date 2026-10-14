import type { CSSProperties } from 'react';
import type { Lang, Shot } from './content';
import { Photo } from './Photo';
import { photoAlt } from './photos';
import { Placeholder } from './Placeholder';

type Props = {
  shot: Shot;
  lang: Lang;
  label: string;
  index?: number;
  ratio?: string;
  className?: string;
  style?: CSSProperties;
  brief?: boolean;
  mark?: boolean;
  sizes?: string;
  priority?: boolean;
  focal?: string;
};

// A photo slot. Shows BullHill's own photo when the shot names one, the placeholder with its
// shot brief when it does not. Root class is `photo` or `ph`, plus className either way.
export function Media({ shot, lang, label, index, ratio, className, style, brief, mark, sizes, priority, focal }: Props) {
  if (shot.photo) {
    return (
      <Photo
        id={shot.photo}
        alt={photoAlt(shot.photo, lang)}
        sizes={sizes}
        priority={priority}
        focal={focal}
        className={className}
        style={{ aspectRatio: ratio, ...style }}
      />
    );
  }
  return <Placeholder shot={shot} label={label} index={index} ratio={ratio} className={className} style={style} brief={brief} mark={mark} />;
}
