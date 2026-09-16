import { Hero } from './components/hero/Hero';
import { Bento } from './components/bento/Bento';
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
        <Fan />
        <Steps />
        <Built />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
