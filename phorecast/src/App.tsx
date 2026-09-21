/* The two pages, and the switch between them.
   ---------------------------------------------------------------------------
   `useRouter` (src/lib/router.ts) installs the click interception and the
   popstate listener, applies the scroll rule, and hands back the live route.
   An unknown path falls through to the landing page, which is the only useful
   404 for a two-page site: the reader gets the site rather than a blank frame.

   Both pages carry <Faq /> and <Footer />, which is why they are mounted here
   rather than inside either page's own component. */
import { Hero } from './components/hero/Hero';
import { Bento } from './components/bento/Bento';
import { Familiar } from './components/familiar/Familiar';
import { Pillars } from './components/pillars/Pillars';
import { Fan } from './components/fan/Fan';
import { Steps } from './components/steps/Steps';
import { Built } from './components/built/Built';
import { Faq } from './components/faq/Faq';
import { Footer } from './components/footer/Footer';
import { About } from './components/about/About';
import { ABOUT, useRouter } from './lib/router';

function Landing() {
  return (
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
  );
}

function AboutPage() {
  return (
    <main className="about-page">
      <About />
      <Faq />
    </main>
  );
}

export function App() {
  const { path } = useRouter();
  return (
    <>
      {path === ABOUT ? <AboutPage /> : <Landing />}
      <Footer />
    </>
  );
}
