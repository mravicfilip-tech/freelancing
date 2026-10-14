import { useContent } from '../shared/lang';

export default function Daylight() {
  const [c] = useContent();
  return <main className="p2">{c.hero.title}</main>;
}
