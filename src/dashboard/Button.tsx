import type { ReactNode } from 'react';

/**
 * Places the hover blob where the pointer entered or left, exactly as
 * `blobOrigin` does on the landing hero. The `fh__btn` rules carry fallbacks
 * for `--fh-*`, so the button is designed to work outside the hero.
 */
function blobOrigin(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
}

type Props = {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

export function Button({
  children,
  variant = 'primary',
  block,
  disabled,
  onClick,
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      className={`fh__btn fh__btn--${variant}${block ? ' dbtn--block' : ''}`}
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={blobOrigin}
      onPointerLeave={blobOrigin}
    >
      {children}
    </button>
  );
}
