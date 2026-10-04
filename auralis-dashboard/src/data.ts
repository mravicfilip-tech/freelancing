export type NodeId = 'tools' | 'generator' | 'editor' | 'thumbnail' | 'output';

export interface Point {
  x: number;
  y: number;
}

export interface Edge {
  from: NodeId;
  to: NodeId;
}

/** World-space layout taken from the reference shot (canvas origin top-left). */
export const INITIAL_NODES: Record<NodeId, Point> = {
  tools: { x: 40, y: 32 },
  generator: { x: 318, y: 238 },
  editor: { x: 596, y: 334 },
  thumbnail: { x: 40, y: 548 },
  output: { x: 874, y: 228 },
};

export const NODE_WIDTH: Record<NodeId, number> = {
  tools: 232,
  generator: 214,
  editor: 230,
  thumbnail: 232,
  output: 232,
};

export const EDGES: Edge[] = [
  { from: 'tools', to: 'generator' },
  { from: 'generator', to: 'editor' },
  { from: 'thumbnail', to: 'editor' },
  { from: 'editor', to: 'output' },
];

export const CONTENT_TYPES = ['Blog post', 'LinkedIn post', 'Newsletter', 'Tweet thread'] as const;
export const TONES = ['Professional', 'Friendly', 'Bold', 'Witty'] as const;
export const STYLES = ['Cinematic', 'Minimal', 'Neon', 'Monochrome'] as const;
export const TYPOGRAPHY = ['Typography', 'Bold Sans', 'Editorial Serif'] as const;
export const MODELS = ['GPT-5', 'Claude', 'Gemini'] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type Tone = (typeof TONES)[number];
export type ImageStyle = (typeof STYLES)[number];
export type Typography = (typeof TYPOGRAPHY)[number];
export type EditAction = 'rewrite' | 'shorten' | 'seo' | 'hashtags';

export interface WorkflowState {
  topic: string;
  contentType: ContentType;
  tone: Tone;
  keywords: string;
  outputs: { caption: boolean; blog: boolean };
  edits: Record<EditAction, boolean>;
  style: ImageStyle;
  typography: Typography;
  imageUrl: string | null;
}

export const INITIAL_WORKFLOW: WorkflowState = {
  topic: 'AI Marketing',
  contentType: 'Blog post',
  tone: 'Professional',
  keywords: '',
  outputs: { caption: true, blog: true },
  edits: { rewrite: false, shorten: false, seo: false, hashtags: false },
  style: 'Cinematic',
  typography: 'Typography',
  imageUrl: null,
};

export interface Task {
  id: string;
  title: string;
  subtitle: string;
  startedAt: number;
}

export interface ReviewItem {
  id: string;
  title: string;
  finishedAt: number;
  meta: { label: string; value: string };
  status: { label: string; tone: 'green' | 'violet' };
}

const MIN = 60_000;

export function seedTasks(now: number): Task[] {
  return [
    { id: 't1', title: 'Daily LinkedIn Auto-Post', subtitle: 'Automated Post Generation', startedAt: now - 10 * MIN },
    { id: 't2', title: 'Daily LinkedIn Auto-Post', subtitle: 'Automated Post Generation', startedAt: now - 15 * MIN },
    { id: 't3', title: 'Daily LinkedIn Auto-Post', subtitle: 'Automated Post Generation', startedAt: now - 20 * MIN },
  ];
}

export function seedReview(now: number): ReviewItem[] {
  return [
    {
      id: 'r1',
      title: 'Social Media Post – “Top 5 AI Tools for Marketers”',
      finishedAt: now - 5 * MIN,
      meta: { label: 'Sentiment Score', value: '+94% · 15' },
      status: { label: 'Approved', tone: 'green' },
    },
    {
      id: 'r2',
      title: 'Blog Draft – “AI Automation in 2026”',
      finishedAt: now - 8 * MIN,
      meta: { label: 'Word Count', value: '1,200' },
      status: { label: 'Draft Generated', tone: 'violet' },
    },
  ];
}

export function timeAgo(then: number, now: number): string {
  const mins = Math.floor((now - then) / MIN);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const POST_LINES: Record<Tone, [(t: string) => string, (t: string) => string]> = {
  Professional: [
    (t) => `${t} is changing how we work. Here's what teams need to know before the next quarter.`,
    (t) => `Teams adopting ${t} are shipping faster and spending less. A look at what's driving it.`,
  ],
  Friendly: [
    (t) => `Let's talk about ${t} — it's quietly changing how we all work, and it's kind of great.`,
    (t) => `Curious about ${t}? Here's a friendly, no-jargon tour of what it can do for you.`,
  ],
  Bold: [
    (t) => `${t} isn't coming. It's already here, and it's rewriting how work gets done.`,
    (t) => `Ignore ${t} at your own risk. The teams using it are already ahead.`,
  ],
  Witty: [
    (t) => `Plot twist: ${t} just became your most productive coworker. It never asks for a raise.`,
    (t) => `${t}: the only colleague who reads every brief and still meets the deadline.`,
  ],
};

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return match ? match[0].trim() : text;
}

function hashtag(text: string): string {
  return (
    '#' +
    text
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join('')
  );
}

export function buildPreviews(w: WorkflowState): { post: string; blog: string } {
  const topic = w.topic.trim() || 'AI Automation';
  let post = POST_LINES[w.tone][w.edits.rewrite ? 1 : 0](topic);
  let blog =
    `${topic} is transforming the way businesses create, schedule and measure content. ` +
    `In this ${w.contentType.toLowerCase()}, we break down the workflows, tools and results behind it.`;

  if (w.edits.shorten) {
    post = firstSentence(post);
    blog = firstSentence(blog);
  }
  if (w.edits.seo) {
    const keys = w.keywords.trim() || `${topic} guide 2026`;
    blog += ` Keywords: ${keys}.`;
  }
  if (w.edits.hashtags) {
    const extra = w.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map(hashtag);
    post += ` ${[hashtag(topic), ...extra, '#ContentAutomation'].join(' ')}`;
  }
  return { post, blog };
}
