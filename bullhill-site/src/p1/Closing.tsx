import { useRef, type CSSProperties } from 'react';
import type { Content } from '../shared/content';
import { DuctEnds } from './art';
import { NotchFrame } from './variants/hero/Notch';
import './variants/hero/hero.css';
import { Bracket } from './Bracket';
import { Logo } from '../shared/Logo';
import { sh, t } from './copy';
import { Rise } from './motion/Rise';
import { useInView } from './motion/motion';
import './motion/sections-b.css';

export function Closing({ c }: { c: Content }) {
  const x = t(c);
  const figRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useInView(figRef);
  useInView(navRef);
  const doneN = c.work.items.findIndex((w) => w.photo === 'restored-lane') + 1;
  const done = c.work.items[doneN - 1];
  return (
    <footer className="end">
      <div className="g gc end__grid">
        {/* The page ends on finished work, the dot terrain and the glowing hill were rejected,
            taste.md 2026-10-14 15:20. */}
        <figure className="end__art" ref={figRef}>
          <NotchFrame id={done.photo} lang={c.lang} sizes="(min-width: 1200px) 46vw, 92vw" focal="50% 62%" />
          <figcaption className="end__cap mono">
            <span className="end__n">{String(doneN).padStart(2, '0')} / {String(c.work.items.length).padStart(2, '0')}</span>
            <span>{done.caption}</span>
          </figcaption>
        </figure>
        <div className="end__panel">
          <div className="end__a">
            <Rise className="end__title display">{sh(c, c.form.title)}</Rise>
            <Rise as="p" body className="end__line mono-body">
              {c.footer.line}
            </Rise>
            <Bracket variant="solid" href={c.contact.phoneHref}>{c.ui.call}</Bracket>
          </div>
          <div className="end__b">
            <DuctEnds className="end__ducts" />
          </div>
          <nav className="end__nav" aria-label={x.mainNav} ref={navRef}>
            {c.nav.map((n, i) => (
              <a key={n.id} href={`#${n.id}`} className="end__link display" style={{ '--l': i } as CSSProperties}>
                <span className="end__lm">
                  <span className="end__li">{sh(c, n.label)}</span>
                </span>
              </a>
            ))}
          </nav>
          <div className="end__info">
            <p className="mono end__k">{x.address}</p>
            <p className="mono end__addr">
              {c.contact.address.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </p>
            <p className="mono end__legal">
              <a href="#top">{c.footer.legal}</a>
              <a href="#top">{c.footer.privacy}</a>
            </p>
            <Logo variant="on-red-white" height={56} className="end__logo" />
          </div>
          <div className="end__base mono">
            <span>{c.footer.company}</span>
            <span>{c.footer.rights}</span>
            <a href="#top">{c.footer.madeFor}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
