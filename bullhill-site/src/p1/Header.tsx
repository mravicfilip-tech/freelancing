import { Dialog } from 'radix-ui';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Content, Lang } from '../shared/content';
import { LangSwitch } from '../shared/LangSwitch';
import { Logo } from '../shared/Logo';
import { Arrow, PhoneIcon } from './art';
import { Bracket } from './Bracket';
import { t } from './copy';

// The two line burger of the phone MENU button, 16px, the stroke of the phone icon. foundry.css shows it under 768 only.
function BurgerIcon() {
  return (
    <svg className="hd__burger" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M2 5h12M2 11h12" />
    </svg>
  );
}

export function Header({ c, setLang, root }: { c: Content; setLang: (l: Lang) => void; root: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  const x = t(c);
  return (
    <header className="hd">
      <div className="hd__in">
        <a className="hd__logo" href="#top" aria-label="BullHill">
          <Logo variant="on-dark" height={40} />
        </a>

        <nav className="hd__nav" aria-label={x.mainNav}>
          {c.nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="hd__link">
              {n.label}
            </a>
          ))}
        </nav>
        <LangSwitch className="lang hd__lang" lang={c.lang} setLang={setLang} label={c.ui.langLabel} />
        <Bracket className="hd__call" href={c.contact.phoneHref}>
          {c.ui.call}
        </Bracket>

        <div className="hd__phone">
          <Bracket square href={c.contact.phoneHref} aria-label={c.ui.call}>
            <PhoneIcon />
          </Bracket>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Bracket arrow={false}>
                <BurgerIcon />
                {c.ui.menu}
              </Bracket>
            </Dialog.Trigger>
            <Dialog.Portal container={root}>
              {/* the overlay carries Radix's scroll lock, so the page stays put under the open menu */}
              <Dialog.Overlay className="menu__scrim" />
              <Dialog.Content className="menu" aria-describedby={undefined}>
                <Dialog.Title className="sr-only">{c.ui.menu}</Dialog.Title>
                <div className="menu__top">
                  <a className="hd__logo" href="#top" onClick={() => setOpen(false)} aria-label="BullHill">
                    <Logo variant="on-dark" height={32} />
                  </a>
                  <Dialog.Close asChild>
                    <Bracket arrow={false}>{c.ui.close}</Bracket>
                  </Dialog.Close>
                </div>
                <nav className="menu__nav" aria-label={x.mainNav}>
                  {c.nav.map((n, i) => (
                    <a key={n.id} href={`#${n.id}`} className="menu__link" style={{ '--mi': i } as CSSProperties} onClick={() => setOpen(false)}>
                      {n.label}
                      <span className="menu__go" aria-hidden="true">
                        <Arrow dir="right" />
                      </span>
                    </a>
                  ))}
                </nav>
                <div className="menu__foot">
                  <a className="menu__contact" href={c.contact.phoneHref}>
                    {c.contact.phone}
                  </a>
                  <a className="menu__contact" href={`mailto:${c.contact.email}`}>
                    {c.contact.email}
                  </a>
                  <div className="menu__row">
                    <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
                    <LangSwitch className="lang" lang={c.lang} setLang={setLang} label={c.ui.langLabel} />
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

