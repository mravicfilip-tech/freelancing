import { Hero } from './components/hero/Hero';
import { Bento } from './components/bento/Bento';
import { Steps } from './components/steps/Steps';
import { Faq } from './components/faq/Faq';
import { Footer } from './components/footer/Footer';

export function App() {
  return (
    <>
      <main>
        <Hero />
        <Bento />
        <Steps />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
