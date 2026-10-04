import { Captions, Hash, ImageUp, Newspaper, Pencil, Scissors, SearchCheck, Sparkles, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { EditAction, NodeId, Point, WorkflowState } from '../data';
import { CONTENT_TYPES, NODE_WIDTH, STYLES, TONES, TYPOGRAPHY, buildPreviews } from '../data';
import { Field, NodeCard, Select } from './NodeCard';
import { Portrait } from './Portrait';

interface Props {
  nodes: Record<NodeId, Point>;
  dragging: NodeId | null;
  onDragStart: (id: NodeId, e: PointerEvent<HTMLElement>) => void;
  workflow: WorkflowState;
  setWorkflow: (update: (w: WorkflowState) => WorkflowState) => void;
}

const EDIT_ACTIONS: { id: EditAction; label: string; icon: LucideIcon }[] = [
  { id: 'rewrite', label: 'Rewrite', icon: Pencil },
  { id: 'shorten', label: 'Shorten', icon: Scissors },
  { id: 'seo', label: 'SEO Optimize', icon: SearchCheck },
  { id: 'hashtags', label: 'Hashtags', icon: Hash },
];

const STYLE_FILTER: Record<string, string> = {
  Cinematic: 'contrast(1.08) saturate(1.1)',
  Minimal: 'saturate(0.5) brightness(1.08)',
  Neon: 'saturate(1.8) hue-rotate(-18deg) contrast(1.15)',
  Monochrome: 'grayscale(1) contrast(1.1)',
};

export function Nodes({ nodes, dragging, onDragStart, workflow: w, setWorkflow }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof WorkflowState>(key: K, value: WorkflowState[K]) =>
    setWorkflow((prev) => ({ ...prev, [key]: value }));
  const previews = buildPreviews(w);
  const common = { onDragStart };

  return (
    <>
      <NodeCard {...common} dragging={dragging === 'tools'} id="tools" title="Tools" pos={nodes.tools} width={NODE_WIDTH.tools} ports={{ out: '52%' }}>
        <div className="panel glow">
          <Field label="Topic">
            <input className="input" value={w.topic} onChange={(e) => set('topic', e.target.value)} aria-label="Topic" />
          </Field>
          <Field label="Content Type">
            <Select label="Content type" value={w.contentType} options={CONTENT_TYPES} onChange={(v) => set('contentType', v)} />
          </Field>
          <Field label="Tone">
            <Select label="Tone" value={w.tone} options={TONES} onChange={(v) => set('tone', v)} />
          </Field>
          <Field label="Keywords">
            <input
              className="input"
              value={w.keywords}
              placeholder="Enter keywords, comma separated"
              onChange={(e) => set('keywords', e.target.value)}
              aria-label="Keywords"
            />
          </Field>
        </div>
      </NodeCard>

      <NodeCard {...common} dragging={dragging === 'generator'} id="generator" title="AI Content Generator" pos={nodes.generator} width={NODE_WIDTH.generator} ports={{ in: '22px', out: '74%' }} className="glow-left">
        <div className="actions">
          <ToggleRow icon={Captions} label="Post Caption" on={w.outputs.caption} onClick={() => set('outputs', { ...w.outputs, caption: !w.outputs.caption })} />
          <ToggleRow icon={Newspaper} label="Blog Section" on={w.outputs.blog} onClick={() => set('outputs', { ...w.outputs, blog: !w.outputs.blog })} />
        </div>
      </NodeCard>

      <NodeCard {...common} dragging={dragging === 'editor'} id="editor" title="Editor" pos={nodes.editor} width={NODE_WIDTH.editor} ports={{ in: '30%', out: '62%' }}>
        <div className="panel glow actions">
          {EDIT_ACTIONS.map(({ id, label, icon }) => (
            <ToggleRow
              key={id}
              icon={icon}
              label={label}
              on={w.edits[id]}
              onClick={() => set('edits', { ...w.edits, [id]: !w.edits[id] })}
            />
          ))}
        </div>
      </NodeCard>

      <NodeCard {...common} dragging={dragging === 'thumbnail'} id="thumbnail" title="Thumbnail Generator" pos={nodes.thumbnail} width={NODE_WIDTH.thumbnail} ports={{ out: '50%' }} className="glow-left">
        <div className="panel">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (w.imageUrl) URL.revokeObjectURL(w.imageUrl);
              set('imageUrl', URL.createObjectURL(file));
              e.target.value = '';
            }}
          />
          <div className="upload-row">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
              <ImageUp size={15} strokeWidth={1.75} aria-hidden />
              {w.imageUrl ? 'Replace Image' : 'Upload Image'}
            </button>
            {w.imageUrl && (
              <button
                className="icon-btn small"
                aria-label="Remove uploaded image"
                onClick={() => {
                  URL.revokeObjectURL(w.imageUrl!);
                  set('imageUrl', null);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Field label="Style">
            <Select label="Style" value={w.style} options={STYLES} onChange={(v) => set('style', v)} />
          </Field>
          <Select label="Typography" value={w.typography} options={TYPOGRAPHY} onChange={(v) => set('typography', v)} />
        </div>
      </NodeCard>

      <NodeCard {...common} dragging={dragging === 'output'} id="output" title="Output" pos={nodes.output} width={NODE_WIDTH.output} ports={{ in: '58%' }} className="node-output">
        <div className="thumb" style={{ filter: STYLE_FILTER[w.style] }}>
          {w.imageUrl ? <img src={w.imageUrl} alt="Uploaded thumbnail" draggable={false} /> : <Portrait />}
          {w.typography !== 'Typography' && (
            <span className={`thumb-type ${w.typography === 'Editorial Serif' ? 'serif' : 'sans'}`}>
              {w.topic || 'AI Automation'}
            </span>
          )}
        </div>
        <div className="panel glow">
          {!w.outputs.caption && !w.outputs.blog && <p className="field-label">Enable an output in AI Content Generator.</p>}
          {w.outputs.caption && (
            <Field label="Post Preview">
              <div className="preview">
                <p>
                  <Sparkles size={12} className="preview-icon" aria-hidden />
                  {previews.post}
                </p>
              </div>
            </Field>
          )}
          {w.outputs.blog && (
            <Field label="Blog Preview">
              <div className="preview">
                <p>{previews.blog}</p>
              </div>
            </Field>
          )}
        </div>
      </NodeCard>
    </>
  );
}

function ToggleRow({ icon: Icon, label, on, onClick }: { icon: LucideIcon; label: string; on: boolean; onClick: () => void }) {
  return (
    <button className="action-row" aria-pressed={on} onClick={onClick}>
      <Icon size={14} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
