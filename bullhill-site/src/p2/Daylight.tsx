import { useState } from 'react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { useContent } from '../shared/lang';
import { Notice, Header } from './Header';
import { Hero } from './Hero';
import { Work } from './Work';
import { LogoStrip } from './Intro';
import { Projects } from './Projects';
import { Cluster } from './Cluster';
import { Services } from './Services';
import { Process } from './Process';
import { Audiences } from './Audiences';
import { Crew } from './Crew';
import { Contact } from './Contact';
import { Footer } from './Footer';
import './daylight.css';
import './daylight-sections.css';
import './daylight-widgets.css';
import './daylight-end.css';

export default function Daylight() {
  const [c, setLang] = useContent();
  const [notice, setNotice] = useState(true);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div className="p2" ref={setRoot} lang={c.lang}>
      {notice && <Notice c={c} onClose={() => setNotice(false)} />}
      <Header c={c} setLang={setLang} container={root} />
      <main>
        <Hero c={c} />
        <Work c={c} />
        <LogoStrip c={c} />
        <Projects c={c} />
        <Cluster c={c} />
        <Services c={c} />
        <Process c={c} />
        <Audiences c={c} />
        <Crew c={c} />
        <Contact c={c} />
      </main>
      <Footer c={c} />
    </div>
  );
}
