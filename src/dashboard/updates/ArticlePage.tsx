import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { EmptyState, OrdersArt } from '../EmptyState';
import { theme } from '../theme';
import { useCopy } from '../useCopy';
import { CheckIcon, ChevronRight, CopyIcon } from '../icons';
import { UPDATES, fmtDate, type Update } from './data';
import { Thumb } from './thumb';
import { Kicker, Title, UpdateCard } from './UpdateCard';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './updates.css';

/**
 * One update in full. The cover is the update's thumbnail at banner size,
 * the article runs in a reading column under it, and the three updates
 * around it wait at the foot. Until the team writes the long form, the
 * sections after the update's own paragraphs are stand-ins by category.
 */

type Block = { h: string; p?: string; list?: string[]; quote?: string };

/** Stand-in sections, so the page reads like the finished article will. */
function expand(u: Update): Block[] {
  const what = u.category === 'Dev release' ? 'the release' : u.category === 'Security' ? 'the audit' : u.category === 'Presale' ? 'the presale' : 'the announcement';
  return [
    {
      h: 'What changes for you',
      p: `Nothing you need to do today. ${u.title} ${u.accent} rolls into the dashboard on its own, and every account sees the same thing at the same time. Where ${what} touches a balance, a payout or a fee, the figure on your dashboard is the one that counts.`,
      list: ['No action is needed on existing orders or referrals', 'Figures on the dashboard update as the change lands', 'Anything that needs your confirmation asks for it in the app, never by email'],
    },
    {
      h: 'How it was tested',
      p: 'Every release runs the same route before it reaches you: the internal build for a week, the community testers on testnet for another, then a staged rollout that watches error rates and settlement times before it opens to every account.',
      quote: 'We would rather ship a week late than explain a lost transfer. Every rail in this release ran on testnet with real corridors and real limits before it was switched on.',
    },
    {
      h: "What's next",
      p: `The next update follows in a week. The roadmap on the site is kept current with what shipped and what slipped, and the Updates channel in Discord carries the same posts the day they go out.`,
    },
  ];
}

function Article({ u }: { u: Update }) {
  const [copied, copy] = useCopy();
  const i = UPDATES.findIndex((x) => x.id === u.id);
  const around = [UPDATES[i - 1], UPDATES[i + 1], UPDATES[i + 2] ?? UPDATES[i - 2]].filter((x): x is Update => Boolean(x) && x.id !== u.id).slice(0, 3);
  const blocks = expand(u);
  const [lead, ...rest] = u.body;

  return (
    <>
      <article className="card art" aria-labelledby="art-title">
        <div className="upd-hero art__cover" aria-hidden="true">
          <Thumb u={u} titled={false} className="thumb--hero" />
        </div>
        <div className="art__col">
          <a className="link-quiet art__back" href="/updates">
            <ChevronRight className="icon-14 art__back-chev" />
            All updates
          </a>
          <Kicker u={u} />
          <Title u={u} as="h2" className="art__title" />
          <p className="art__lead">{lead}</p>
          {rest.map((p) => <p className="art__p" key={p.slice(0, 24)}>{p}</p>)}
          {blocks.map((b) => (
            <section className="art__sec" key={b.h}>
              <h3 className="art__h">{b.h}</h3>
              {b.p && <p className="art__p">{b.p}</p>}
              {b.list && (
                <ul className="art__list">
                  {b.list.map((li) => <li key={li}>{li}</li>)}
                </ul>
              )}
              {b.quote && <blockquote className="art__quote">{b.quote}</blockquote>}
            </section>
          ))}
          <footer className="art__foot">
            <span className="art__meta">Published <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time> · {u.category}</span>
            <Button variant="ghost" onClick={() => copy(window.location.href)}>
              {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
              {copied ? 'Link copied' : 'Copy link'}
            </Button>
          </footer>
        </div>
      </article>

      <section className="card upd art__more" aria-labelledby="art-more">
        <header className="card__head">
          <div>
            <h2 className="card__title" id="art-more">More updates</h2>
            <p className="orders__sub">Around this one</p>
          </div>
          <a className="link-quiet" href="/updates">
            All updates
            <ChevronRight className="icon-14" />
          </a>
        </header>
        <div className="upd-grid">
          {around.map((x) => <UpdateCard u={x} key={x.id} />)}
        </div>
      </section>
    </>
  );
}

export function ArticlePage({ id }: { id: number }) {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);
  const u = UPDATES.find((x) => x.id === id);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  return (
    <div className="dash updates" data-theme={mode}>
      <Sidebar active="updates" />
      <main className="dash__main">
        <Topbar title="Updates" />
        {u ? (
          <Article u={u} />
        ) : (
          <section className="card">
            <EmptyState art={OrdersArt} title="That update isn't here" body="It may have been renumbered, or the link is missing a digit. Every update the team has posted is on the Updates page.">
              <Button onClick={() => window.location.assign('/updates')}>All updates</Button>
            </EmptyState>
          </section>
        )}
      </main>
      <MobileNav active="updates" />
    </div>
  );
}
