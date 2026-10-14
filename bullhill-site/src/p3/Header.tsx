import { useEffect, useState } from 'react';
import { Dialog } from 'radix-ui';
import type { Content, Lang } from '../shared/content';
import { Logo } from '../shared/Logo';
import { LangSwitch } from '../shared/LangSwitch';
import { CloseIcon, ChevronRight, MenuIcon, PhoneIcon } from './art';
import { t } from './copy';

export function useActiveId(ids: string[], margin = '-45% 0px -50% 0px') {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');
  useEffect(() => {
    const els = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: margin },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key, margin]);
  return active;
}

type Props = { c: Content; lang: Lang; setLang: (l: Lang) => void; container: HTMLElement | null };

export function Header({ c, lang, setLang, container }: Props) {
  const [open, setOpen] = useState(false);
  const active = useActiveId(c.nav.map((n) => n.id));
  const navItems = c.nav.filter((n) => n.id !== 'contact');
  return (
    <header className="p3-head">
      <div className="p3-head__tab">
        <span className="p3-head__shape" aria-hidden="true" />
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="p3-iconbtn p3-head__menu" aria-label={c.ui.menu}>
            <MenuIcon />
          </Dialog.Trigger>
          <Dialog.Portal container={container}>
            <Dialog.Overlay className="p3-sheet__overlay" />
            <Dialog.Content className="p3-sheet" aria-describedby={undefined}>
              <div className="p3-sheet__top">
                <Dialog.Title className="p3-sheet__title">{c.ui.menu}</Dialog.Title>
                <Dialog.Close className="p3-iconbtn" aria-label={c.ui.close}>
                  <CloseIcon />
                </Dialog.Close>
              </div>
              <nav className="p3-sheet__nav" aria-label={t(c, 'mainNav')}>
                {c.nav.map((n) => (
                  <Dialog.Close asChild key={n.id}>
                    <a href={`#${n.id}`} className="p3-sheet__link">
                      <span>{n.label}</span>
                      <ChevronRight />
                    </a>
                  </Dialog.Close>
                ))}
              </nav>
              <div className="p3-sheet__foot">
                <LangSwitch lang={lang} setLang={setLang} label={c.ui.langLabel} className="p3-lang" />
                <a className="p3-sheet__contact" href={c.contact.phoneHref}>
                  {c.contact.phone}
                </a>
                <a className="p3-sheet__contact" href={`mailto:${c.contact.email}`}>
                  {c.contact.email}
                </a>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <a className="p3-head__logo" href="#top" aria-label="BullHill">
          <Logo variant="on-dark" kind="wordmark" height={20} alt="BullHill" />
        </a>
        <nav className="p3-head__nav" aria-label={t(c, 'mainNav')}>
          {navItems.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="p3-head__link" aria-current={active === n.id ? 'true' : undefined}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M1 1 L6.5 6.5 M2 6.5 H6.5 V2" />
              </svg>
              {n.label}
            </a>
          ))}
        </nav>
        <LangSwitch lang={lang} setLang={setLang} label={c.ui.langLabel} className="p3-lang p3-head__lang" />
        <a className="p3-pill" href="#contact">
          <i aria-hidden="true" />
          {t(c, 'contactUs')}
        </a>
      </div>
      <a className="p3-head__call" href={c.contact.phoneHref} aria-label={`${c.ui.call} ${c.contact.phone}`}>
        <PhoneIcon />
      </a>
    </header>
  );
}
