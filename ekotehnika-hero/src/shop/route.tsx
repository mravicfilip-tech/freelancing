// The shop's own routes, read from the address. The homepage is the scroll story at /, everything under /prodavnica and /kontakt is the
// shop (App.tsx), and vercel.json sends those paths to index.html. A link inside the shop moves by history, so no page loads twice.
import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { isPostSlug } from './blogSlugs';

export type Route =
  | { page: 'home' }
  | { page: 'all' }
  | { page: 'category'; cat: string }
  | { page: 'model'; cat: string; model: string }
  | { page: 'contact'; tema: string | null; model: string | null; poruka: string | null }
  | { page: 'najam' }
  | { page: 'servis' }
  | { page: 'delovi' }
  | { page: 'kompanija' }
  | { page: 'post'; slug: string }
  | { page: 'missing' };

// the pages of the services and the company, Filip 19 November, briefs/pages/plan.md
const PAGES = ['najam', 'servis', 'delovi', 'kompanija'] as const;

// a blog post sits at the root like on the old site, /linde-safety-guard/, so its address is told apart by the list of posts (blogSlugs.ts)
export const isShopPath = (path: string) =>
  /^\/(prodavnica|kontakt|najam|servis|delovi|kompanija)(\/|$)/.test(path) || isPostSlug(path.replace(/^\/+|\/+$/g, ''));

export function parse(path: string, search: string): Route {
  const parts = path.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] === 'kontakt' && parts.length === 1) {
    const q = new URLSearchParams(search);
    return { page: 'contact', tema: q.get('tema'), model: q.get('model'), poruka: q.get('poruka') };
  }
  const page = PAGES.find((x) => x === parts[0]);
  if (page && parts.length === 1) return { page };
  if (parts.length === 1 && isPostSlug(parts[0])) return { page: 'post', slug: parts[0] };
  if (parts[0] !== 'prodavnica') return { page: 'missing' };
  if (parts.length === 1) return { page: 'home' };
  if (parts.length === 2) return parts[1] === 'svi-modeli' ? { page: 'all' } : { page: 'category', cat: parts[1] };
  if (parts.length === 3) return { page: 'model', cat: parts[1], model: parts[2] };
  return { page: 'missing' };
}

const EVENT = 'shop:navigate';

export function navigate(href: string) {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new Event(EVENT));
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const read = () => parse(window.location.pathname, window.location.search);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('popstate', on);
    window.addEventListener(EVENT, on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener(EVENT, on);
    };
  }, []);
  return route;
}

// A link inside the shop. A plain click moves by history, a click for a new tab or window is left to the browser.
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!isShopPath(href.split('?')[0])) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={go} {...rest} />;
}
