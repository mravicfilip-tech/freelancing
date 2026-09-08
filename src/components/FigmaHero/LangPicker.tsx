import { useEffect, useId, useRef, useState } from 'react';
import './LangPicker.css';

/** Endonyms, with the four the old picker had wrong put right, ordered by ISO code. */
const LANGS: { code: string; name: string; rtl?: boolean }[] = [
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'bg', name: 'български' },
  { code: 'cs', name: 'čeština' },
  { code: 'de', name: 'Deutsch' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'hu', name: 'magyar' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português' },
  { code: 'ro', name: 'română' },
  { code: 'ru', name: 'Русский' },
  { code: 'sk', name: 'slovenčina' },
  { code: 'th', name: 'ไทย' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'zh', name: '中文（简体）' },
];

function Tick() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

/**
 * Language picker for the nav. All twenty-two fit in two columns, so choosing one is a single
 * movement rather than a scroll; the ISO code stands in for a flag, since a language is not a
 * country. Search, arrow keys, Enter and Escape all work.
 */
export function LangPicker() {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState('en');
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const shown = LANGS.filter((l) => !q || l.code.includes(q) || l.name.toLowerCase().includes(q));
  const chosen = LANGS.find((l) => l.code === sel)!;

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setOpen(false);
      btn.current?.focus();
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    const id = window.setTimeout(() => field.current?.focus(), 40);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
      window.clearTimeout(id);
    };
  }, [open]);

  /** Arrow keys walk the options in visual order; Enter from the field takes the first match. */
  const steer = (e: React.KeyboardEvent) => {
    const opts = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('.lp__opt') ?? []);
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (opts[i + 1] ?? opts[0])?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      (opts[i - 1] ?? opts[opts.length - 1])?.focus();
    }
    if (e.key === 'Enter' && e.target === field.current) {
      e.preventDefault();
      opts[0]?.click();
    }
  };

  const choose = (code: string) => {
    setSel(code);
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <div className="lp" ref={root} data-open={open} onKeyDown={steer}>
      <button
        ref={btn}
        type="button"
        className="fh__lang"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={`Language: ${chosen.name}`}
        onClick={() => {
          setQuery('');
          setOpen((v) => !v);
        }}
      >
        {sel.toUpperCase()}
        <img className="fh__chevron" src="/figma/chevron.svg" alt="" width={11} height={6} />
      </button>

      <div className="lp__pop" role="dialog" aria-label="Choose a language" hidden={!open}>
        <div className="lp__search">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5 18 18" />
          </svg>
          <input
            ref={field}
            type="search"
            value={query}
            placeholder="Search languages"
            aria-label="Search languages"
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="lp__count">{shown.length}</span>
        </div>

        <div className="lp__list" id={listId} role="listbox" aria-label="Languages">
          {shown.map((l) => (
            <button
              key={l.code}
              type="button"
              className="lp__opt"
              role="option"
              aria-selected={l.code === sel}
              dir={l.rtl ? 'rtl' : undefined}
              onClick={() => choose(l.code)}
            >
              <span className="lp__code">{l.code}</span>
              <span className="lp__name">{l.name}</span>
              <span className="lp__tick">
                <Tick />
              </span>
            </button>
          ))}
          {shown.length === 0 && <p className="lp__empty">No language matches that.</p>}
        </div>
      </div>
    </div>
  );
}
