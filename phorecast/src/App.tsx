import { Hero } from './components/hero/Hero';
import { Bento } from './components/bento/Bento';
import { Familiar } from './components/familiar/Familiar';
import { Pillars } from './components/pillars/Pillars';
import { Fan } from './components/fan/Fan';
import { Steps } from './components/steps/Steps';
import { Built } from './components/built/Built';
import { Faq } from './components/faq/Faq';
import { Footer } from './components/footer/Footer';

export function App() {
  return (
    <>
      <main>
        <Hero />
        <Bento />
        <Familiar />
        <Pillars />
        <Fan />
        <Steps />
        <Built />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
