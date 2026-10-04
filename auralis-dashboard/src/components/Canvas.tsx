import { MessageSquare, MousePointer2, PenTool, Slash, Square, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { NodeId, Point, WorkflowState } from '../data';
import { EDGES, INITIAL_NODES } from '../data';
import { Nodes } from './Nodes';

type Tool = 'select' | 'rect' | 'text' | 'pen' | 'line' | 'comment';

const TOOLS: { id: Tool; label: string; key: string; icon: LucideIcon }[] = [
  { id: 'select', label: 'Select', key: 'V', icon: MousePointer2 },
  { id: 'rect', label: 'Rectangle', key: 'R', icon: Square },
  { id: 'text', label: 'Text', key: 'T', icon: Type },
  { id: 'pen', label: 'Pen', key: 'P', icon: PenTool },
  { id: 'line', label: 'Line', key: 'L', icon: Slash },
  { id: 'comment', label: 'Comment', key: 'C', icon: MessageSquare },
];

type Annotation =
  | { id: number; type: 'rect'; x: number; y: number; w: number; h: number }
  | { id: number; type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { id: number; type: 'pen'; points: Point[] }
  | { id: number; type: 'text' | 'comment'; x: number; y: number; text: string };

interface View {
  x: number;
  y: number;
  zoom: number;
}

type Gesture =
  | { kind: 'pan'; start: Point; origin: View }
  | { kind: 'node'; id: NodeId; start: Point; origin: Point }
  | { kind: 'draw'; id: number; start: Point };

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const PAD = 32;

interface Props {
  workflow: WorkflowState;
  setWorkflow: (update: (w: WorkflowState) => WorkflowState) => void;
}

export function Canvas({ workflow, setWorkflow }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const nextId = useRef(1);

  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const [ports, setPorts] = useState<Record<string, Point>>({});
  const [tool, setTool] = useState<Tool>('select');
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [draggingNode, setDraggingNode] = useState<NodeId | null>(null);
  const [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [notes, setNotes] = useState<Annotation[]>([]);
  const [editing, setEditing] = useState<number | null>(null);

  // Port anchors relative to their card, re-measured when a card changes size.
  useLayoutEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const measure = () => {
      const next: Record<string, Point> = {};
      world.querySelectorAll<HTMLElement>('[data-port]').forEach((el) => {
        next[el.dataset.port!] = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
      });
      setPorts((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    world.querySelectorAll('[data-node]').forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  const fitView = useCallback(() => {
    const vp = viewportRef.current;
    const world = worldRef.current;
    if (!vp || !world) return;
    let maxX = 0;
    let maxY = 0;
    world.querySelectorAll<HTMLElement>('[data-node]').forEach((el) => {
      const id = el.dataset.node as NodeId;
      maxX = Math.max(maxX, nodes[id].x + el.offsetWidth);
      maxY = Math.max(maxY, nodes[id].y + el.offsetHeight);
    });
    const minX = Math.min(...Object.values(nodes).map((n) => n.x));
    const minY = Math.min(...Object.values(nodes).map((n) => n.y));
    const w = maxX - minX + PAD * 2;
    const h = maxY - minY + PAD * 2 + 72; // keep clear of the toolbar
    const zoom = Math.min(1, Math.max(MIN_ZOOM, Math.min(vp.clientWidth / w, vp.clientHeight / h)));
    setView({
      zoom,
      x: Math.max(0, (vp.clientWidth - (maxX - minX) * zoom) / 2) - minX * zoom,
      y: PAD * zoom + Math.max(0, (vp.clientHeight - 72 - h * zoom) / 2) - (minY - PAD) * zoom,
    });
  }, [nodes]);

  // Fit once on mount so the whole flow is visible on smaller screens.
  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    fitView();
  }, [fitView]);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = viewportRef.current!.getBoundingClientRect();
      return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom };
    },
    [view],
  );

  // Wheel: pinch / ctrl+wheel zooms around the pointer, plain wheel pans.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView((v) => {
        if (e.ctrlKey || e.metaKey) {
          const zoom = clamp(v.zoom * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM);
          const k = zoom / v.zoom;
          return { zoom, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
        }
        return { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY };
      });
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, []);

  // Keyboard shortcuts, ignored while typing.
  useEffect(() => {
    const typing = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setNotes((n) => n.slice(0, -1));
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') setTool('select');
      const match = TOOLS.find((t) => t.key === e.key.toUpperCase());
      if (match) setTool(match.id);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const startPan = (e: ReactPointerEvent<HTMLElement>) => {
    gesture.current = { kind: 'pan', start: { x: e.clientX, y: e.clientY }, origin: view };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onNodeDragStart = (id: NodeId, e: ReactPointerEvent<HTMLElement>) => {
    if (tool !== 'select' || spaceHeld) return;
    e.stopPropagation();
    gesture.current = { kind: 'node', id, start: { x: e.clientX, y: e.clientY }, origin: nodes[id] };
    setDraggingNode(id);
    viewportRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || spaceHeld || (e.button === 0 && tool === 'select')) {
      // Clicks on a node's own controls stay with the control.
      if (!spaceHeld && e.button === 0 && (e.target as HTMLElement).closest('.node')) return;
      startPan(e);
      return;
    }
    if (e.button !== 0) return;
    const p = toWorld(e.clientX, e.clientY);
    const id = nextId.current++;
    if (tool === 'text' || tool === 'comment') {
      e.preventDefault(); // keep focus on the new textarea instead of the canvas
      setNotes((n) => [...n, { id, type: tool, x: p.x, y: p.y, text: '' }]);
      setEditing(id);
      setTool('select');
      return;
    }
    const note: Annotation =
      tool === 'rect'
        ? { id, type: 'rect', x: p.x, y: p.y, w: 0, h: 0 }
        : tool === 'line'
          ? { id, type: 'line', x1: p.x, y1: p.y, x2: p.x, y2: p.y }
          : { id, type: 'pen', points: [p] };
    setNotes((n) => [...n, note]);
    gesture.current = { kind: 'draw', id, start: p };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = toWorld(e.clientX, e.clientY);
    setCursor(p);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pan') {
      setView({ ...g.origin, x: g.origin.x + e.clientX - g.start.x, y: g.origin.y + e.clientY - g.start.y });
    } else if (g.kind === 'node') {
      const dx = (e.clientX - g.start.x) / view.zoom;
      const dy = (e.clientY - g.start.y) / view.zoom;
      setNodes((n) => ({ ...n, [g.id]: { x: Math.round(g.origin.x + dx), y: Math.round(g.origin.y + dy) } }));
    } else {
      setNotes((list) =>
        list.map((a) => {
          if (a.id !== g.id) return a;
          if (a.type === 'rect')
            return { ...a, x: Math.min(g.start.x, p.x), y: Math.min(g.start.y, p.y), w: Math.abs(p.x - g.start.x), h: Math.abs(p.y - g.start.y) };
          if (a.type === 'line') return { ...a, x2: p.x, y2: p.y };
          if (a.type === 'pen') return { ...a, points: [...a.points, p] };
          return a;
        }),
      );
    }
  };

  const endGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    setPanning(false);
    setDraggingNode(null);
    if (g?.kind === 'draw') {
      // Drop accidental clicks that drew nothing.
      setNotes((list) =>
        list.filter((a) => {
          if (a.id !== g.id) return true;
          if (a.type === 'rect') return a.w > 4 && a.h > 4;
          if (a.type === 'line') return Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 4;
          if (a.type === 'pen') return a.points.length > 2;
          return true;
        }),
      );
    }
  };

  const updateNoteText = (id: number, text: string) =>
    setNotes((list) => list.map((a) => (a.id === id && (a.type === 'text' || a.type === 'comment') ? { ...a, text } : a)));

  const finishEditing = (id: number) => {
    setEditing(null);
    setNotes((list) => list.filter((a) => !(a.id === id && (a.type === 'text' || a.type === 'comment') && !a.text.trim())));
  };

  const portPos = (id: NodeId, side: 'in' | 'out'): Point | null => {
    const off = ports[`${id}:${side}`];
    return off ? { x: nodes[id].x + off.x, y: nodes[id].y + off.y } : null;
  };

  const mode = spaceHeld || panning ? (panning ? 'grabbing' : 'grab') : tool === 'select' ? 'select' : 'draw';

  return (
    <div className="canvas">
      <div
        ref={viewportRef}
        className="viewport"
        data-mode={mode}
        data-tool={tool}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        style={{
          backgroundPosition: `${view.x}px ${view.y}px`,
          backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px`,
        }}
      >
        <div ref={worldRef} className="world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
          <svg className="edges" aria-hidden>
            <defs>
              {EDGES.map(({ from, to }) => {
                const a = portPos(from, 'out');
                const b = portPos(to, 'in');
                if (!a || !b) return null;
                return (
                  <linearGradient key={`${from}-${to}`} id={`edge-${from}-${to}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
                    <stop offset="0" stopColor="#7c5cf0" stopOpacity="0.35" />
                    <stop offset="0.55" stopColor="#c9bdf7" stopOpacity="0.7" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
                  </linearGradient>
                );
              })}
            </defs>
            {EDGES.map(({ from, to }) => {
              const a = portPos(from, 'out');
              const b = portPos(to, 'in');
              if (!a || !b) return null;
              const d = curve(a, b);
              return (
                <g key={`${from}-${to}`}>
                  <path d={d} className="edge" stroke={`url(#edge-${from}-${to})`} />
                  <path d={d} className="edge-flow" pathLength={100} />
                  <circle cx={b.x} cy={b.y} r={3} className="edge-end" />
                </g>
              );
            })}
          </svg>

          <Nodes nodes={nodes} dragging={draggingNode} onDragStart={onNodeDragStart} workflow={workflow} setWorkflow={setWorkflow} />

          <svg className="annotations" aria-hidden>
            {notes.map((a) => {
              if (a.type === 'rect') return <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h} rx={10} />;
              if (a.type === 'line') return <line key={a.id} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />;
              if (a.type === 'pen') return <polyline key={a.id} points={a.points.map((p) => `${p.x},${p.y}`).join(' ')} />;
              return null;
            })}
          </svg>

          {notes.map((a) =>
            a.type === 'text' || a.type === 'comment' ? (
              <div
                key={a.id}
                className={a.type === 'text' ? 'note-text' : 'comment'}
                style={{ transform: `translate(${a.x}px, ${a.y}px)` }}
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={() => setEditing(a.id)}
              >
                {a.type === 'comment' && <span className="comment-pin" aria-hidden />}
                {editing === a.id ? (
                  <textarea
                    autoFocus
                    rows={1}
                    value={a.text}
                    placeholder={a.type === 'text' ? 'Type something' : 'Add a comment'}
                    aria-label={a.type === 'text' ? 'Text label' : 'Comment'}
                    onChange={(e) => updateNoteText(a.id, e.target.value)}
                    onBlur={() => finishEditing(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                        e.preventDefault();
                        (e.target as HTMLTextAreaElement).blur();
                      }
                    }}
                  />
                ) : (
                  <p>{a.text}</p>
                )}
              </div>
            ) : null,
          )}
        </div>
      </div>

      <div className="toolbar" role="toolbar" aria-label="Canvas tools">
        {TOOLS.map(({ id, label, key, icon: Icon }) => (
          <button
            key={id}
            className="tool"
            aria-pressed={tool === id}
            aria-label={`${label} (${key})`}
            title={`${label} — ${key}`}
            onClick={() => setTool(id)}
          >
            <Icon size={18} strokeWidth={1.75} />
          </button>
        ))}
      </div>

      <button className="stats" onClick={fitView} title="Fit to screen">
        <span>Zoom {Math.round(view.zoom * 100)}%</span>
        <span>
          X {Math.round(cursor.x)} · Y {Math.round(cursor.y)}
        </span>
        <span>
          {Object.keys(nodes).length} nodes · {EDGES.length} links
        </span>
        <span>{notes.length} annotations</span>
      </button>
    </div>
  );
}

function curve(a: Point, b: Point): string {
  const dx = Math.max(36, Math.abs(b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
