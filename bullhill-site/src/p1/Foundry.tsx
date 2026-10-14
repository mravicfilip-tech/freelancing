import { useContent } from '../shared/lang';

export default function Foundry() {
  const [c] = useContent();
  return <main className="p1">{c.hero.title}</main>;
}
