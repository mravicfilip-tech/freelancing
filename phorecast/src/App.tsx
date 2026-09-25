/* The pages, and the switch between them.
   ---------------------------------------------------------------------------
   `useRouter` (src/lib/router.ts) installs the click interception and the
   popstate listener, applies the scroll rule, and hands back the live route.
   An unknown path falls through to the landing page, which is the only useful
   404 for a small site: the reader gets the site rather than a blank frame.

   Routes: "/" (Landing), "/about", "/blog" (every post) and "/blog/<slug>"
   (one post; an unknown slug gets the blog's own "not found" state).

   Every page carries <Footer />, and the landing and About pages carry
   <Faq />, which is why they are mounted here rather than inside each page's
   own component. The blog has no FAQ: it is not a product page. */
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
import { BlogIndex, BlogPost } from './components/blog/Blog';
import { postBySlug } from './content/blog';
import { ABOUT, BLOG, blogSlug, useRouter } from './lib/router';

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

function Page({ path }: { path: string }) {
  if (path === ABOUT) return <AboutPage />;
  if (path === BLOG) return <BlogIndex />;
  const slug = blogSlug(path);
  // Keyed by slug so moving between posts starts each one fresh (the share
  // button's "copied" state, for one).
  if (slug !== null) return <BlogPost key={slug} post={postBySlug(slug)} />;
  return <Landing />;
}

export function App() {
  const { path } = useRouter();
  return (
    <>
      <Page path={path} />
      <Footer />
    </>
  );
}
