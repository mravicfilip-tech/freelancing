import { CircleDashed, CirclePlay } from 'lucide-react';
import type { ReviewItem, Task } from '../data';
import { timeAgo } from '../data';
import { PromptBox } from './PromptBox';

interface Props {
  open: boolean;
  now: number;
  tasks: Task[];
  review: ReviewItem[];
  onSubmit: (prompt: string, model: string) => void;
  onClose: () => void;
}

export function Sidebar({ open, now, tasks, review, onSubmit, onClose }: Props) {
  return (
    <>
      <div className="scrim" data-open={open} onClick={onClose} aria-hidden />
      <aside className="sidebar" data-open={open} aria-label="Activity">
        <div className="sidebar-scroll">
          <section>
            <h2 className="section-label">
              In progress <span>{tasks.length}</span>
            </h2>
            <ul className="task-list">
              {tasks.map((t) => (
                <li key={t.id} className="task">
                  <CircleDashed className="task-icon spin" size={15} strokeWidth={1.75} aria-hidden />
                  <div>
                    <p className="task-title">{t.title}</p>
                    <p className="task-sub">{t.subtitle}</p>
                    <p className="task-time">{timeAgo(t.startedAt, now)}</p>
                  </div>
                </li>
              ))}
              {tasks.length === 0 && <li className="empty">Nothing running right now.</li>}
            </ul>
          </section>

          <hr className="rule" />

          <section>
            <h2 className="section-label">
              Ready for review <span>{review.length}</span>
            </h2>
            <ul className="task-list">
              {review.map((r) => (
                <li key={r.id} className="task review">
                  <CirclePlay className="task-icon" size={16} strokeWidth={1.75} aria-hidden />
                  <div className="review-body">
                    <p className="task-title row">
                      <span className="truncate">{r.title}</span>
                      <span className="task-time inline">{timeAgo(r.finishedAt, now)}</span>
                    </p>
                    <p className="task-sub">
                      {r.meta.label}: <span className="meta-value">{r.meta.value}</span>
                    </p>
                    <p className="task-sub">
                      Status: <span className={`status status-${r.status.tone}`}>{r.status.label}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <PromptBox onSubmit={onSubmit} />
      </aside>
    </>
  );
}
