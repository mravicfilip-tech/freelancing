import { useCallback, useLayoutEffect, useRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode, Ref } from 'react';
import './variants/buttons/buttons.css';
import './variants/buttons/slab.css';
import { btnVariant, lab, slabVariant } from './variants/params';
import type { SlabN, VariantN } from './variants/params';

type Common = { variant?: 'line' | 'fill'; square?: boolean; className?: string; btn?: VariantN; slab?: SlabN; children: ReactNode };
type AProps = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;
type BProps = Common & { href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

type Ground = 'dark' | 'light' | 'red';

// The ground a button sits on, read from the first opaque background above it, so the slab,
// the sweep and the hot colour take the right pair on dark, light and the bull-red panel.
function groundOf(el: HTMLElement): Ground {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
    if (!m || m.length < 3) continue;
    const [r, g, b] = m.map(Number);
    const a = m.length > 3 ? Number(m[3]) : 1;
    if (a < 0.5) continue;
    if (r > 140 && g < 70 && b < 70) return 'red';
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45 ? 'dark' : 'light';
  }
  return 'light';
}

function ArrowSvg({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}

// Slab version 5. The label is split into one span per letter for the flip, and the plain label
// stays in a visually hidden span, so the accessible name is the label and not the letters.
function Flap({ children }: { children: ReactNode }) {
  if (typeof children !== 'string') return <span className="bk__l">{children}</span>;
  const chars = Array.from(children);
  return (
    <span className="bk__l">
      <span className="bk__sr">{children}</span>
      <span className="bk__fx" aria-hidden="true" style={{ '--n': chars.length } as CSSProperties}>
        {chars.map((ch, i) => (
          <span className="bk__fc" key={i} style={{ '--i': i } as CSSProperties}>
            {ch === ' ' ? '\u00a0' : ch}
          </span>
        ))}
      </span>
    </span>
  );
}

// The five versions of the slab and arrow, style 3. 1 is the reference as built.
function slabInside(s: SlabN, square: boolean | undefined, children: ReactNode) {
  if (s === 2) {
    return (
      <span className="bk__s2">
        <span className="bk__l">{children}</span>
        {!square && <ArrowSvg className="bk__arw" />}
      </span>
    );
  }
  if (s === 3) {
    return (
      <>
        <span className="bk__l">{children}</span>
        {!square && (
          <span className="bk__cell3" aria-hidden="true">
            <ArrowSvg className="bk__arw" />
          </span>
        )}
      </>
    );
  }
  if (s === 4) {
    return (
      <>
        <span className="bk__l">{children}</span>
        {!square && (
          <span className="bk__trk" aria-hidden="true">
            <ArrowSvg className="bk__arw" />
          </span>
        )}
        <span className="bk__cut" aria-hidden="true" />
      </>
    );
  }
  if (s === 5) {
    return (
      <>
        {square ? <span className="bk__l">{children}</span> : <Flap>{children}</Flap>}
        {!square && <ArrowSvg className="bk__arw" />}
      </>
    );
  }
  return (
    <>
      <span className="bk__l">{children}</span>
      {!square && (
        <span className="bk__ar" aria-hidden="true">
          <ArrowSvg className="bk__a1" />
          <ArrowSvg className="bk__a2" />
        </span>
      )}
    </>
  );
}

// The inside of the button for each of the five styles. Styles 1 and 2 keep the four corner marks.
function inside(n: VariantN, s: SlabN, square: boolean | undefined, children: ReactNode) {
  if (n === 3) return slabInside(s, square, children);
  if (n === 4) {
    // The label twice. The copy is hidden from assistive tech, so the roll reads once.
    return (
      <>
        {!square && <span className="bk__sq" aria-hidden="true" />}
        <span className="bk__roll">
          <span className="bk__win">
            <span className="bk__t">{children}</span>
            <span className="bk__t bk__t--2" aria-hidden="true">
              {children}
            </span>
          </span>
          <span className="bk__rule" aria-hidden="true" />
        </span>
      </>
    );
  }
  if (n === 5) {
    return square ? (
      <span className="bk__cell bk__cell--i">{children}</span>
    ) : (
      <>
        <span className="bk__cell bk__cell--l">
          <span className="bk__l">{children}</span>
        </span>
        <span className="bk__cell bk__cell--i" aria-hidden="true">
          <ArrowSvg className="bk__a" />
        </span>
      </>
    );
  }
  return (
    <>
      <span className="bk__c bk__c--tl" aria-hidden="true" />
      <span className="bk__c bk__c--tr" aria-hidden="true" />
      <span className="bk__c bk__c--bl" aria-hidden="true" />
      <span className="bk__c bk__c--br" aria-hidden="true" />
      <span className="bk__l">{children}</span>
    </>
  );
}

// The site button. Style 1 is the bracket button of the reference, no fill, four L shaped corners.
// The default is Filip's pick, style 3 the slab and arrow in version 3 the arrow cell.
// ?v=1&btn=1..5 restyles every button on the page, and the lab passes `btn` to pin one style.
// ?v=1&btn=3&slab=1..5 picks one of the five slab and arrow versions, and a `slab` prop pins one.
// The filled variant is the primary use, the form submit.
export function Bracket(props: AProps | BProps) {
  const { variant = 'line', square, className, btn, slab, children, ...rest } = props;
  // The labs show several styles and ignore ?btn and ?slab. A ?slab alone picks the slab style.
  const n: VariantN = btn ?? (slab ? 3 : lab() ? 1 : slabVariant() ? 3 : btnVariant());
  const sv: SlabN = n === 3 ? (slab ?? (lab() ? 1 : slabVariant() ?? 3)) : 1;
  const own = useRef<HTMLElement | null>(null);
  const { ref: outer, ...clean } = rest as unknown as Omit<typeof rest, 'ref'> & { ref?: Ref<HTMLElement> };
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      own.current = el;
      if (typeof outer === 'function') outer(el);
      else if (outer) (outer as { current: HTMLElement | null }).current = el;
    },
    [outer],
  );
  useLayoutEffect(() => {
    if (own.current) own.current.dataset.ground = groundOf(own.current);
  }, [n, sv]);
  const cls = `bk${variant === 'fill' ? ' bk--fill' : ''}${square ? ' bk--square' : ''}${className ? ` ${className}` : ''}`;
  const body = inside(n, sv, square, children);
  if ('href' in clean && clean.href !== undefined) {
    return (
      <a className={cls} data-btn={n} data-slab={n === 3 ? sv : undefined} ref={setRef} {...(clean as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" className={cls} data-btn={n} data-slab={n === 3 ? sv : undefined} ref={setRef as (el: HTMLButtonElement | null) => void} {...(clean as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {body}
    </button>
  );
}
