import { useContent } from '../shared/lang';

export default function Underground() {
  const [c] = useContent();
  return <main className="p3">{c.hero.title}</main>;
}
