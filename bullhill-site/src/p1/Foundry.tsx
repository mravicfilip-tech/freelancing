import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/azeret-mono';
import './foundry.css';
import './motion/motion.css';
import { useState } from 'react';
import { useContent } from '../shared/lang';
import { Audiences } from './Audiences';
import { Closing } from './Closing';
import { Contact } from './Contact';
import { Crew } from './Crew';
import { Faq } from './Faq';
import { Header } from './Header';
import { Hero } from './Hero';
import { Process } from './Process';
import { Projects } from './Projects';
import { Services } from './Services';
import { Work } from './Work';
import { ButtonLab } from './variants/buttons/Lab';
import { HERO_VARIANTS } from './variants/hero';
import { motionOn } from './motion/motion';
import { heroVariant, lab } from './variants/params';

export default function Foundry() {
  const [c, setLang] = useContent();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const hv = heroVariant();
  const [motion] = useState(motionOn);
  const HeroN = hv === 1 ? Hero : HERO_VARIANTS[hv];
  if (lab() === 'buttons') {
    return (
      <div className="p1" id="top" ref={setRoot} lang={c.lang}>
        <Header c={c} setLang={setLang} root={root} />
        <main>
          <ButtonLab c={c} />
        </main>
      </div>
    );
  }
  return (
    <div className="p1" id="top" ref={setRoot} lang={c.lang} data-motion={motion ? 'on' : 'off'}>
      <Header c={c} setLang={setLang} root={root} />
      <main>
        <HeroN c={c} />
        <Work c={c} />
        <Services c={c} />
        <Process c={c} />
        <Projects c={c} />
        <Crew c={c} />
        <Audiences c={c} />
        <Faq c={c} />
        <Contact c={c} />
      </main>
      <Closing c={c} />
    </div>
  );
}
