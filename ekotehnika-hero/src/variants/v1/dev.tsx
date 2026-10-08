// Temporary harness for building V1 while other variants are mid build. Deleted before hand-off.
import { createRoot } from 'react-dom/client';
import '../../styles.css';
import { Placeholder } from '../../components/Placeholder';
import V1 from './index';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
createRoot(document.getElementById('root')!).render(
  <>
    <V1 reduced={reduced} />
    <Placeholder />
  </>,
);
