import { fmtDate, type Update } from './data';
import { Thumb } from './thumb';
import './card.css';

/** What kind of update and when. "Dev release 123" carries the number the
    team counts by; the others are just their kind. */
export function Kicker({ u, date = true }: { u: Update; date?: boolean }) {
  return (
    <p className="upd-kicker">
      <span>{u.category === 'Dev release' ? `Dev release ${u.n}` : u.category}</span>
      {date && <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time>}
    </p>
  );
}

export function Title({ u, as: Tag = 'h3', className = 'upd-title' }: { u: Update; as?: 'h2' | 'h3'; className?: string }) {
  return (
    <Tag className={className}>
      {u.title} <em>{u.accent}</em>
    </Tag>
  );
}

/** One update as a card: the thumbnail carries the headline, the body is
    the kicker and one line, and the whole card is the link. Used on Updates
    and on Earn, so the two screens show the same thing the same way. */
export function UpdateCard({ u }: { u: Update }) {
  return (
    <a className="upd-card" href={`/updates#update-${u.id}`}>
      <Thumb u={u} />
      <span className="upd-card__body">
        <Kicker u={u} />
        <span className="upd-card__excerpt">{u.excerpt}</span>
      </span>
    </a>
  );
}
