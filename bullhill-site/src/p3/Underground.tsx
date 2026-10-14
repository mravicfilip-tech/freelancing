import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource-variable/chivo-mono';
import './underground.css';
import { useState } from 'react';
import { useContent } from '../shared/lang';
import { Header } from './Header';
import { CrewPhoto, DescentBand, Hero, Process, Services, Steps } from './SectionsA';
import { Audiences, Matrix, Projects } from './SectionsB';
import { Contact, Faq, Footer } from './SectionsC';

// Pathway 3, Underground. Follows vaulk.com, a photo that descends into dark earth, thin white
// wireframes, mono tags, notched frames and one light panel at a time.
export default function Underground() {
  const [c, setLang] = useContent();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div className="p3" ref={setRoot}>
      <Header c={c} lang={c.lang} setLang={setLang} container={root} />
      <main>
        <Hero c={c} />
        <DescentBand />
        <Process c={c} />
        <Services c={c} />
        <Steps c={c} />
        <CrewPhoto c={c} />
        <Matrix c={c} />
        <Projects c={c} />
        <Audiences c={c} />
        <Faq c={c} />
        <Contact c={c} />
      </main>
      <Footer c={c} lang={c.lang} setLang={setLang} />
    </div>
  );
}
