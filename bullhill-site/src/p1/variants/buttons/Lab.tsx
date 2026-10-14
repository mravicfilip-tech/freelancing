import type { Content } from '../../../shared/content';

// The five button styles side by side with their states, at ?v=1&lab=buttons.
export function ButtonLab({ c }: { c: Content }) {
  return <section className="blab">{c.ui.send}</section>;
}
