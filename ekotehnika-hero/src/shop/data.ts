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
