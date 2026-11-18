// The shop's search, Filip 18 November, "make search bigger and when opening the search suggest top 5 models searched for and do
// suggested searching". A large field. Opened empty it offers five models and the visitor's own last searches. While a word is typed it
// suggests the models and the categories that hold it, each with its picture, and a last row that opens every result. The site has no
// record of what people search yet, so the five are a pick (SUGGESTED in data.ts), not a count, until search analytics run.
// The combobox pattern, the arrows move through the suggestions, Enter opens one or all the results, Escape and a click outside shut it.
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

export function SearchBox({ placeholder = 'Pretražite modele, npr. X20 ili slagač' }: { placeholder?: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(-1);
  const [past, setPast] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const term = q.trim();

  const found = useMemo(() => (term ? PRODUCTS.filter((p) => matches(p, term)) : []), [term]);
  const items: Item[] = useMemo(() => {
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
  }, [term, found, past]);

  useEffect(() => {
    if (!open) return;
    setPast(recent());
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
    if (it.kind === 'all' || it.kind === 'recent') remember(it.kind === 'all' ? term : it.label);
    else if (term) remember(term);
    setOpen(false);
    navigate(it.href);
  };
  const submit = () => {
    if (hot >= 0 && items[hot]) return go(items[hot]);
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

  const pastItems = items.filter((x) => x.kind === 'recent');
  const restItems = items.filter((x) => x.kind !== 'recent');
  return (
    <div className="sp-sb" ref={root} data-open={open || undefined}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor={`${id}-q`}>
          Pretražite modele
        </label>
        <input
          id={`${id}-q`}
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
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={key}
        />
        <button type="submit" className="sp-sb-go" aria-label="Pretraži" onPointerDown={(e) => e.preventDefault()}>
          <i className="sp-sb-i" aria-hidden="true" />
        </button>
      </form>
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
