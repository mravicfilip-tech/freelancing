import { useEffect, useId, useRef, useState } from 'react';
import { isCurrentPage, type NavLink } from './navigation';

type Props = {
  label: string;
  items: NavLink[];
  /** BEM block for styling: `${className}`, `__trigger`, `__chevron`, `__menu`, `__link`. */
  className: string;
};

/**
 * Disclosure-style nav dropdown: a button toggles a list of links. Opens on hover for a mouse,
 * on click or Enter/Space otherwise; closes on Escape, an outside press, or focus leaving it.
 */
export function NavDropdown({ label, items, className }: Props) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const openedByHover = useRef(false);
  const hasCurrent = items.some((i) => isCurrentPage(i.href));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className={className}
      data-open={open || undefined}
      data-current={hasCurrent || undefined}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        openedByHover.current = true;
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        openedByHover.current = false;
        setOpen(false);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`${className}__trigger`}
        aria-expanded={open}
        aria-controls={menuId}
        // A mouse that hovered the menu open shouldn't close it again by clicking the label.
        onClick={(e) => setOpen((o) => (e.detail > 0 && openedByHover.current ? true : !o))}
      >
        {label}
        <span className={`${className}__chevron`} aria-hidden="true" />
      </button>
      <ul id={menuId} className={`${className}__menu`}>
        {items.map((item) => (
          <li key={item.href}>
            <a
              className={`${className}__link`}
              href={item.href}
              aria-current={isCurrentPage(item.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
