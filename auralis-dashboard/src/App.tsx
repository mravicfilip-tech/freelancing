import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReviewItem, Task, WorkflowState } from './data';
import { INITIAL_WORKFLOW, seedReview, seedTasks } from './data';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import type { Tab } from './components/TopNav';
import { TopNav } from './components/TopNav';

const RUN_MS = 6000;

export function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks(Date.now()));
  const [review, setReview] = useState<ReviewItem[]>(() => seedReview(Date.now()));
  const [unread, setUnread] = useState(0);
  const [workflow, setWorkflowState] = useState<WorkflowState>(INITIAL_WORKFLOW);
  const timers = useRef<number[]>([]);

  const setWorkflow = useCallback((update: (w: WorkflowState) => WorkflowState) => setWorkflowState(update), []);

  // Keep the "x min ago" labels fresh.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  // Small screens start with the drawer closed.
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) setSidebarOpen(false);
  }, []);

  const runPrompt = (prompt: string, model: string) => {
    const startedAt = Date.now();
    const task: Task = { id: `t${startedAt}`, title: prompt, subtitle: `Generating with ${model}`, startedAt };
    setNow(startedAt);
    setTasks((t) => [task, ...t]);
    const timer = window.setTimeout(() => {
      const finishedAt = Date.now();
      setTasks((t) => t.filter((x) => x.id !== task.id));
      setReview((r) => [
        {
          id: `r${finishedAt}`,
          title: prompt,
          finishedAt,
          meta: { label: 'Model', value: model },
          status: { label: 'Draft Generated', tone: 'violet' },
        },
        ...r,
      ]);
      setUnread((n) => n + 1);
      setNow(finishedAt);
    }, RUN_MS);
    timers.current.push(timer);
  };

  return (
    <div className="app" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      <TopNav
        tab={tab}
        onTab={setTab}
        onMenu={() => {
          setSidebarOpen((o) => !o);
          setUnread(0);
        }}
        unread={unread}
      />
      <div className="body">
        <Sidebar
          open={sidebarOpen}
          now={now}
          tasks={tasks}
          review={review}
          onSubmit={runPrompt}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main">
          {tab === 'overview' ? (
            <Canvas workflow={workflow} setWorkflow={setWorkflow} />
          ) : (
            <div className="placeholder">
              <h1>{tab[0].toUpperCase() + tab.slice(1)}</h1>
              <p>This view isn't part of the reference design yet. The Overview tab holds the workflow canvas.</p>
              <button className="btn-ghost" onClick={() => setTab('overview')}>
                Back to Overview
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
