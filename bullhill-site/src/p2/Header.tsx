import { useState } from 'react';
import { Dialog } from 'radix-ui';
import type { Content, Lang } from '../shared/content';
import { Logo } from '../shared/Logo';
import { LangSwitch } from '../shared/LangSwitch';
import { Icon } from './icons';
import { pick } from './copy';

type Props = { c: Content; setLang: (l: Lang) => void; container: HTMLElement | null };

export function Notice({ c, onClose }: { c: Content; onClose: () => void }) {
  const k = pick(c.lang);
  return (
    <div className="p2-notice">
      <p>
        <span>{k.notice.text}</span> <a href="#contact">{k.notice.link}</a>
      </p>
      <button type="button" className="p2-notice__close" onClick={onClose} aria-label={k.notice.close}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function Header({ c, setLang, container }: Props) {
  const [open, setOpen] = useState(false);
  const k = pick(c.lang);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  return (
    <header className="p2-header">
      <div className="p2-header__blur" aria-hidden="true" />
      <div className="p2-wrap p2-header__row">
        <a href="#top" className="p2-header__logo" aria-label="BullHill">
          <Logo variant="on-light" height={40} alt="" />
        </a>

        <nav className="p2-pill" aria-label={k.mainNav}>
          <ul className="p2-pill__links">
            {c.nav.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`}>{n.label}</a>
              </li>
            ))}
          </ul>
          <LangSwitch lang={c.lang} setLang={setLang} label={c.ui.langLabel} className="p2-lang" />
          <a className="p2-btn p2-btn--outline p2-btn--sm" href={c.contact.phoneHref}>
            {c.ui.call}
          </a>
          <a className="p2-btn p2-btn--primary p2-btn--sm" href="#contact">
            {c.ui.send}
            <Icon name="arrow" size={16} />
          </a>
        </nav>

        <div className="p2-header__mobile">
          <a className="p2-btn p2-btn--primary" href={c.contact.phoneHref}>
            <Icon name="phone" size={16} />
            {c.ui.call}
          </a>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className="p2-btn p2-btn--menu">{c.ui.menu}</Dialog.Trigger>
            <Dialog.Portal container={container}>
              <Dialog.Overlay className="p2-sheet__overlay" />
              <Dialog.Content className="p2-sheet" aria-describedby={undefined}>
                <div className="p2-sheet__top">
                  <Logo variant="on-light" height={40} alt="" />
                  <Dialog.Title className="sr-only">{c.ui.menu}</Dialog.Title>
                  <Dialog.Close className="p2-btn p2-btn--menu">
                    <Icon name="close" size={16} />
                    {c.ui.close}
                  </Dialog.Close>
                </div>
                <nav aria-label={k.menuNav}>
                  <ul className="p2-sheet__links">
                    {c.nav.map((n) => (
                      <li key={n.id}>
                        <a href={`#${n.id}`} onClick={go(n.id)}>
                          {n.label}
                          <Icon name="arrow" size={24} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="p2-sheet__foot">
                  <LangSwitch lang={c.lang} setLang={setLang} label={c.ui.langLabel} className="p2-lang p2-lang--sheet" />
                  <div className="p2-sheet__btns">
                    <a className="p2-btn p2-btn--outline" href={c.contact.phoneHref}>
                      {c.ui.call}
                    </a>
                    <a className="p2-btn p2-btn--primary" href="#contact" onClick={go('contact')}>
                      {c.ui.send}
                      <Icon name="arrow" size={16} />
                    </a>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
