import type { ReactNode } from 'react';
import { ArrowIcon, ChevronRight, PlusIcon, TagIcon } from './art';

// Small grey button with a square plus or chevron cell on the right.
export function GreyBtn({ href, children, icon = 'plus', onLight = true }: { href: string; children: ReactNode; icon?: 'plus' | 'chevron'; onLight?: boolean }) {
  return (
    <a className={`p3-btn p3-btn--grey${onLight ? '' : ' p3-btn--ondark'}`} href={href}>
      <span>{children}</span>
      <span className="p3-btn__cell" aria-hidden="true">
        {icon === 'plus' ? <PlusIcon /> : <ChevronRight />}
      </span>
    </a>
  );
}

// Primary black button with a bull-red mark before the label.
export function DarkBtn({ href, children, type, disabled, onClick }: { href?: string; children: ReactNode; type?: 'submit' | 'button'; disabled?: boolean; onClick?: () => void }) {
  if (href) {
    return (
      <a className="p3-btn p3-btn--dark" href={href}>
        <i aria-hidden="true" />
        {children}
      </a>
    );
  }
  return (
    <button className="p3-btn p3-btn--dark" type={type ?? 'button'} disabled={disabled} onClick={onClick}>
      <i aria-hidden="true" />
      {children}
    </button>
  );
}

// The 1px bordered tag with the bull-red square cross and a mono label.
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`p3-tag${className ? ` ${className}` : ''}`}>
      <TagIcon />
      <span>{children}</span>
    </span>
  );
}

// A mono kicker with a hairline above it and short ticks at both ends.
export function Kicker({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="p3-kicker" id={id}>
      <span>{children}</span>
    </p>
  );
}

export function ArrowList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={`p3-alist${className ? ` ${className}` : ''}`}>
      {items.map((it, i) => (
        <li key={i}>
          <ArrowIcon />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
