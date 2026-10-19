import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';

// Small parts only this variant uses, in the kit's style.

/** A card title in heavy display capitals, with the live dot when the content moves. */
export function CardTitle({ id, children, dot, as: Tag = 'h2', className }: { id?: string; children: ReactNode; dot?: boolean; as?: 'h1' | 'h2'; className?: string }) {
  return (
    <Tag id={id} className={cn('flex items-center gap-3 text-20 font-extrabold uppercase leading-6 tracking-[-0.01em] text-ink', className)}>
      {dot && <span aria-hidden className="h-[10px] w-[10px] shrink-0 rounded-full bg-win ring-4 ring-win/15" />}
      {children}
    </Tag>
  );
}

/** A segmented tab bar on the panel, the kit's purple fill on the picked tab. */
export function Segmented<T extends string>({ items, value, onChange, label, controls }: { items: { value: T; label: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; label: string; controls?: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-[14px] bg-[rgb(var(--k-item))] p-1">
      {items.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          aria-controls={controls}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex h-9 items-center gap-2 rounded-[10px] px-3 text-14 font-bold transition-colors',
            value === t.value ? 'k-btn-purple text-ink' : 'text-[rgb(var(--k-muted))] hover:text-ink',
          )}
        >
          {t.icon && <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const handle = (name: string) => `@${name.replace(/\s|\./g, '').toLowerCase()}`;
