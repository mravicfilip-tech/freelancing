import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { theme } from '../theme';
import { Opener } from './Opener';
import { Inside } from './Inside';
import { Claimed } from './Claimed';
import { BOXES, seedClaims, type Claim, type Prize } from './data';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import '../markets/markets.css';
import './mystery.css';

/**
 * Mystery box. The opener leads, what a box can hold sits under it, and the
 * claimed list closes the page; a paid open lands its prize at the top of
 * that list.
 */
export function MysteryPage() {
  const mode = theme.use();
  /** `?empty=1` renders the page before this wallet has opened a box. */
  const [claims, setClaims] = useState<Claim[]>(() => (new URLSearchParams(window.location.search).get('empty') === '1' ? [] : seedClaims()));

  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  const onWin = (prize: Prize, spent: number) =>
    setClaims((c) => [{ id: (c[0]?.id ?? 900) + 1, prize, box: BOXES[3], spent, when: new Date() }, ...c]);

  return (
    <div className="dash mystery" data-theme={mode}>
      <Sidebar active="mystery" />
      <main className="dash__main">
        <Topbar title="Mystery box" />
        <Opener onWin={onWin} />
        <Inside />
        <Claimed rows={claims} />
      </main>
      <MobileNav active="mystery" />
    </div>
  );
}
