// The shop's catalogue, built by scripts/shop-catalog.py from the client's Drive and the old site's cards (briefs/shop). 89 series in
// 10 categories, one product each. kg and mm are the old site's nosivost and visina podizanja, only where one card matches the series,
// see briefs/shop/match.md. Nothing in here is made up, a series without a match has no numbers.
import catalog from './catalog.json';

export type Category = { slug: string; name: string; kind: string; drive: string; count: number };
export type Product = {
  slug: string;
  category: string;
  code: string;
  kind: string;
  series: string;
  drive: string;
  match: 'exact' | 'guess' | 'shared' | 'none';
  kg: number | null;
  mm: number | null;
  render: string | null;
  // render, a cut out on a clear ground, studio, a photo on white shown whole, scene, a photo cropped to a square
  look: 'render' | 'studio' | 'scene' | null;
  thumb: string | null;
  photos: string[];
  datasheet: { name: string; href: string } | null;
};

export const CATEGORIES = catalog.categories as Category[];
export const PRODUCTS = catalog.products as Product[];

export const categoryOf = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const productsOf = (cat: string) => PRODUCTS.filter((p) => p.category === cat);
export const productOf = (cat: string, slug: string) => PRODUCTS.find((p) => p.category === cat && p.slug === slug);
export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

// The picture a category shows on the shop's first page, a model buyers know, by its slug.
const FACE: Record<string, string> = {
  'elektricni-ceoni-viljuskari': 'x20-do-x35',
  'dizel-i-plinski-ceoni-viljuskari': 'h20-do-h35',
  'viljuskari-velike-nosivosti': 'h100-do-h180-d',
  'regalni-viljuskari': 'r14-do-r25',
  'viljuskari-za-komisioniranje': 'n20-do-n25-c',
  'slagaci-paleta': 'l14-do-l20',
  'niskopodizna-vozila': 't20-do-t25-sp',
  tegljaci: 'p20',
  'viljuskari-za-uske-prolaze': 'k-5231',
  'automatizovana-vozila': 'r-matic',
};
export const faceOf = (cat: string) => {
  const p = productBySlug(FACE[cat] ?? '') ?? productsOf(cat).find((x) => x.thumb);
  return p?.thumb ?? null;
};

// Serbian figures, a dot between thousands, 2.000 kg
export const fmt = (n: number) => n.toLocaleString('de-DE');

// "1 model", "2 modela", "5 modela", Serbian counting
export const modela = (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'model' : 'modela'}`;

export const hrefCategory = (cat: string) => `/prodavnica/${cat}`;
export const hrefProduct = (p: Product) => `/prodavnica/${p.category}/${p.slug}`;
export const hrefAsk = (p: Product | null, tema: 'kupovina' | 'najam' | 'servis' = 'kupovina') =>
  `/kontakt?tema=${tema}${p ? `&model=${p.slug}` : ''}`;

// ---- the shop's filters, Filip 18 November, "add more sorting/filter options, make it look like a shop" ----

// The four kinds of truck the ten categories fall into, for the row of filters over the categories on the first page.
export const GROUPS: { id: string; label: string; cats: string[] }[] = [
  { id: 'ceoni', label: 'Čeoni viljuškari', cats: ['elektricni-ceoni-viljuskari', 'dizel-i-plinski-ceoni-viljuskari', 'viljuskari-velike-nosivosti'] },
  {
    id: 'skladiste',
    label: 'Skladišna vozila',
    cats: ['regalni-viljuskari', 'viljuskari-za-komisioniranje', 'slagaci-paleta', 'niskopodizna-vozila', 'viljuskari-za-uske-prolaze'],
  },
  { id: 'tegljaci', label: 'Tegljači', cats: ['tegljaci'] },
  { id: 'automatizacija', label: 'Automatizacija', cats: ['automatizovana-vozila'] },
];

// The bands of the two numbers, the old site's nosivost in kg and visina podizanja in mm. A model without the number is in none of them.
export type Band = { id: string; label: string; min: number; max: number };
export const KG_BANDS: Band[] = [
  { id: 'do-1500', label: 'do 1.500 kg', min: 0, max: 1500 },
  { id: '1500-2500', label: '1.501 do 2.500 kg', min: 1501, max: 2500 },
  { id: '2500-5000', label: '2.501 do 5.000 kg', min: 2501, max: 5000 },
  { id: 'preko-5000', label: 'preko 5.000 kg', min: 5001, max: Infinity },
];
export const MM_BANDS: Band[] = [
  { id: 'do-2000', label: 'do 2.000 mm', min: 0, max: 2000 },
  { id: '2000-6000', label: '2.001 do 6.000 mm', min: 2001, max: 6000 },
  { id: '6000-10000', label: '6.001 do 10.000 mm', min: 6001, max: 10000 },
  { id: 'preko-10000', label: 'preko 10.000 mm', min: 10001, max: Infinity },
];
export const inBand = (v: number | null, b: Band) => v !== null && v >= b.min && v <= b.max;

export type Sort = 'preporuceno' | 'nosivost-rastuce' | 'nosivost-opadajuce' | 'visina-opadajuce' | 'naziv';
export const SORTS: { id: Sort; label: string }[] = [
  { id: 'preporuceno', label: 'Preporučeno' },
  { id: 'nosivost-rastuce', label: 'Nosivost, od manje' },
  { id: 'nosivost-opadajuce', label: 'Nosivost, od veće' },
  { id: 'visina-opadajuce', label: 'Visina podizanja, od veće' },
  { id: 'naziv', label: 'Naziv, A do Ž' },
];

// a model without the number goes last whichever way the list runs
const byNumber = (k: 'kg' | 'mm', dir: 1 | -1) => (a: Product, b: Product) => {
  const x = a[k];
  const y = b[k];
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return (x - y) * dir;
};
export function sorted(list: Product[], sort: Sort) {
  const out = [...list];
  if (sort === 'nosivost-rastuce') out.sort(byNumber('kg', 1));
  if (sort === 'nosivost-opadajuce') out.sort(byNumber('kg', -1));
  if (sort === 'visina-opadajuce') out.sort(byNumber('mm', -1));
  if (sort === 'naziv') out.sort((a, b) => a.code.localeCompare(b.code, 'sr', { numeric: true }));
  return out;
}

// The facts of a category for its tile, the lowest and the highest nosivost and the highest lift of its models where the old site gives
// them. The tow tractors' figure is a pulling or a platform load, not a lift, so it is not set beside the others.
export function statsOf(cat: string) {
  const items = productsOf(cat);
  const kg = cat === 'tegljaci' ? [] : items.map((p) => p.kg).filter((v): v is number => v !== null);
  const mm = items.map((p) => p.mm).filter((v): v is number => v !== null && v > 500);
  return {
    count: items.length,
    kg: kg.length ? [Math.min(...kg), Math.max(...kg)] : null,
    mm: mm.length ? Math.max(...mm) : null,
  };
}

// a search over the code, the kind and the category's name, "x20", "r14", "slagač", the letters with and without their marks
const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj');
export const matches = (p: Product, q: string) => {
  const words = plain(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = plain(`${p.code} ${p.kind} ${categoryOf(p.category)?.name ?? ''} ${p.series} linde`).replace(/\s+do\s+/g, ' ');
  const tight = hay.replace(/\s+/g, '');
  return words.every((w) => hay.includes(w) || tight.includes(w));
};
