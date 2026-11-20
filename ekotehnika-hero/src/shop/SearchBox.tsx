// The shop's search, Filip 18 November, "make search bigger and when opening the search suggest top 5 models searched for and do
// suggested searching". A large field. Opened empty it offers five models and the visitor's own last searches. While a word is typed it
// suggests the models and the categories that hold it, each with its picture, and a last row that opens every result. The site has no
// record of what people search yet, so the five are a pick (SUGGESTED in data.ts), not a count, until search analytics run.
// The combobox pattern, the arrows move through the suggestions, Enter opens one or all the results, Escape and a click outside shut it.
// On Kontakt the same search picks models for the inquiry (Filip 19 November, "do same search as on category page"), onPick. Then it
// suggests models only, a pick goes to the form's list and leaves the field empty for the next, the models already picked drop out,
// no search is remembered, and it sits in the form as a field, not a form of its own.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CATEGORIES, PRODUCTS, SUGGESTED, categoryOf, fmt, hrefCategory, hrefProduct, matches, modela, productBySlug, type Product } from './data';
import { navigate } from './route';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'dj');
const RECENT = 'sp-recent';
const recent = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT) ?? '[]').slice(0, 5);
  } catch {
    return [];
  }
};
const remember = (q: string) => {
  try {
    const list = [q, ...recent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    window.localStorage.setItem(RECENT, JSON.stringify(list));
  } catch {
    /* a browser that keeps nothing keeps no history */
  }
};

type Item = { id: string; href: string; kind: 'model' | 'cat' | 'recent' | 'all'; label: string; p?: Product; note?: string };

export function SearchBox({
  // the list page's own wording, the longer one was cut on a phone (mobile audit 20 November)
  placeholder = 'Pretraga, npr. X20 ili slagač',
  onPick,
  exclude = [],
  inputId,
  disabled = false,
}: {
  placeholder?: string;
  onPick?: (p: Product) => void;
  exclude?: string[];
  inputId?: string;
  disabled?: boolean;
}) {
  const pick = Boolean(onPick);
  const ex = exclude.join('|');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(-1);
  const [past, setPast] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const term = q.trim();

  const found = useMemo(() => (term ? PRODUCTS.filter((p) => matches(p, term) && !ex.split('|').includes(p.slug)) : []), [term, ex]);
  const items: Item[] = useMemo(() => {
    if (pick) {
      const list = term
        ? found.slice(0, 8)
        : SUGGESTED.map((s) => productBySlug(s)).filter((p): p is Product => Boolean(p) && !ex.split('|').includes(p!.slug));
      return list.map((p) => ({ id: `m-${p.slug}`, href: hrefProduct(p), kind: 'model' as const, label: `Linde ${p.code}`, p }));
    }
    if (!term) {
      return [
        ...past.map((r) => ({ id: `r-${r}`, href: `/prodavnica/svi-modeli?q=${encodeURIComponent(r)}`, kind: 'recent' as const, label: r })),
        ...SUGGESTED.map((s) => productBySlug(s))
          .filter((p): p is Product => Boolean(p))
          .map((p) => ({ id: `m-${p.slug}`, href: hrefProduct(p), kind: 'model' as const, label: `Linde ${p.code}`, p })),
      ];
    }
    const cats = CATEGORIES.filter((c) => norm(c.name).includes(norm(term)));
    return [
      ...found.slice(0, 6).map((p) => ({ id: `m-${p.slug}`, href: hrefProduct(p), kind: 'model' as const, label: `Linde ${p.code}`, p })),
      ...cats.slice(0, 3).map((c) => ({ id: `c-${c.slug}`, href: hrefCategory(c.slug), kind: 'cat' as const, label: c.name, note: modela(c.count) })),
      { id: 'all', href: `/prodavnica/svi-modeli?q=${encodeURIComponent(term)}`, kind: 'all' as const, label: `Svi rezultati za „${term}”`, note: modela(found.length) },
    ];
  }, [term, found, past, pick, ex]);

  useEffect(() => {
    if (!open) return;
    if (!pick) setPast(recent());
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  useEffect(() => setHot(-1), [term]);

  // a panel that opens past the foot of a wide window brings the page up until all of it shows, a phone scrolls a focused field itself
  useLayoutEffect(() => {
    if (!open || window.matchMedia('(max-aspect-ratio: 4/5)').matches) return;
    const panel = root.current?.querySelector<HTMLElement>('.sp-sb-panel');
    const over = panel ? panel.getBoundingClientRect().bottom - (window.innerHeight - 16) : 0;
    if (over > 0) window.scrollBy({ top: over, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [open, past]);

  const go = (it: Item) => {
    if (pick) {
      if (it.p) onPick!(it.p);
      setQ('');
      setOpen(false);
      input.current?.focus();
      return;
    }
    if (it.kind === 'all' || it.kind === 'recent') remember(it.kind === 'all' ? term : it.label);
    else if (term) remember(term);
    setOpen(false);
    navigate(it.href);
  };
  const submit = () => {
    if (hot >= 0 && items[hot]) return go(items[hot]);
    // in the form, Enter or the cell takes the first model found
    if (pick) return term && items[0] ? go(items[0]) : input.current?.focus();
    // an empty field, the search button opens the suggestions
    if (!term) return input.current?.focus();
    remember(term);
    setOpen(false);
    navigate(`/prodavnica/svi-modeli?q=${encodeURIComponent(term)}`);
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHot((h) => Math.min(items.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHot((h) => Math.max(-1, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };
  const forget = () => {
    try {
      window.localStorage.removeItem(RECENT);
    } catch {
      /* nothing kept */
    }
    setPast([]);
    input.current?.focus();
  };

  const row = (it: Item, i: number) => (
    <li
      role="option"
      id={`${id}-${i}`}
      aria-selected={i === hot}
      className={`sp-sug is-${it.kind}`}
      onPointerEnter={() => setHot(i)}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => go(it)}
      key={it.id}
    >
      {it.kind === 'model' && it.p ? (
        <span className="sp-sug-pic">{it.p.thumb ? <img src={it.p.thumb} alt="" /> : null}</span>
      ) : (
        <span className={`sp-sug-i is-${it.kind}`} aria-hidden="true" />
      )}
      <span className="sp-sug-t">
        <span className="sp-sug-l">{it.label}</span>
        {it.p ? (
          <span className="sp-sug-s">
            {it.p.kind}
            {it.p.kg !== null ? `, ${fmt(it.p.kg)} kg` : ''}
          </span>
        ) : it.note ? (
          <span className="sp-sug-s">{it.note}</span>
        ) : null}
      </span>
      {it.kind === 'model' && it.p ? <span className="sp-sug-c">{categoryOf(it.p.category)?.name}</span> : null}
    </li>
  );

  const field = (
    <>
      {inputId ? null : (
        <label className="sr-only" htmlFor={`${id}-q`}>
          Pretražite modele
        </label>
      )}
      <input
        id={inputId ?? `${id}-q`}
        ref={input}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={hot >= 0 ? `${id}-${hot}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        disabled={disabled}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={key}
      />
      <button
        type={pick ? 'button' : 'submit'}
        className="sp-sb-go"
        aria-label={pick ? 'Dodajte model' : 'Pretraži'}
        disabled={disabled}
        onPointerDown={(e) => e.preventDefault()}
        onClick={pick ? submit : undefined}
      >
        <i className="sp-sb-i" aria-hidden="true" />
      </button>
    </>
  );

  const pastItems = items.filter((x) => x.kind === 'recent');
  const restItems = items.filter((x) => x.kind !== 'recent');
  return (
    <div className={`sp-sb${pick ? ' is-field' : ''}`} ref={root} data-open={open || undefined}>
      {pick ? (
        <div className="sp-sb-f">{field}</div>
      ) : (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {field}
        </form>
      )}
      {open ? (
        <div className="sp-sb-panel">
          {!term && pastItems.length ? (
            <div className="sp-sb-group">
              <div className="sp-sb-h">
                <span>Nedavne pretrage</span>
                <button type="button" className="sp-clear" onPointerDown={(e) => e.preventDefault()} onClick={forget}>
                  Obriši
                </button>
              </div>
            </div>
          ) : null}
          <ul className="sp-sb-list" role="listbox" id={`${id}-list`} aria-label="Predlozi">
            {pastItems.map((it) => row(it, items.indexOf(it)))}
            {!term ? (
              <li className="sp-sb-h" role="presentation">
                <span>Predloženi modeli</span>
              </li>
            ) : found.length === 0 ? (
              <li className="sp-sb-none" role="presentation">
                Nijedan model sa „{term}”. Probajte oznaku modela, npr. X20, ili vrstu, npr. slagač.
              </li>
            ) : null}
            {restItems.map((it) => row(it, items.indexOf(it)))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
