import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/azeret-mono';
import './foundry.css';
import { useState } from 'react';
import { useContent } from '../shared/lang';
import { Audiences } from './Audiences';
import { Closing } from './Closing';
import { Contact } from './Contact';
import { Crew } from './Crew';
import { Header } from './Header';
import { Hero } from './Hero';
import { Process } from './Process';
import { Projects } from './Projects';
import { Services } from './Services';

export default function Foundry() {
  const [c, setLang] = useContent();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div className="p1" id="top" ref={setRoot} lang={c.lang}>
      <Header c={c} setLang={setLang} root={root} />
      <main>
        <Hero c={c} />
        <Services c={c} />
        <Process c={c} />
        <Projects c={c} />
        <Crew c={c} />
        <Audiences c={c} />
        <Contact c={c} />
      </main>
      <Closing c={c} />
    </div>
  );
}
