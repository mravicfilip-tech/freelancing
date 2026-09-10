/**
 * The three faces the pre-Figma hero directions are set in: `?hero=1` is Instrument Sans, `?hero=2`
 * Bricolage Grotesque, `?hero=3` Schibsted Grotesk (see DESIGN.md). HeroPlanet also paints its badge
 * labels in Instrument Sans onto a canvas, so the face has to be loaded before it draws.
 *
 * They are pulled in here rather than from main.tsx because none of them appear on the page a
 * visitor actually lands on. Every module that imports this one is itself loaded on demand, so the
 * faces — around 230KB of woff2, plus their @font-face rules in the render-blocking stylesheet —
 * stay out of the default page entirely.
 */
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/schibsted-grotesk';
