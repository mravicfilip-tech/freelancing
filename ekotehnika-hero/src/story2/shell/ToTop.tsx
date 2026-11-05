// The back to top button, Filip 5 November, "add back to top button". A black square with an arrow up at the bottom right, the icon cell of
// the site's buttons. It shows once the story is over, when the top of Proizvodi has come up past the middle of the screen, and stays on
// for the sections after it, so it never stands over a frame of the story. A click takes the page and the story to the first screen at once,
// toFirstScreen, and puts the focus on the logos at the top. On a phone it stands over the bar at the foot, see shell.css.
import { useEffect, useState } from 'react';
import { BtnInner } from './ui';
import { toFirstScreen } from '../../scroll/useScrollStory';

export function ToTop() {
  const [on, setOn] = useState(false);
  // read on every scroll, once a frame, so a jump straight to the footer that never crosses Proizvodi still shows it
  useEffect(() => {
    const after = document.body.querySelector<HTMLElement>('[data-after-story]');
    if (!after) return;
    let id = 0;
    const read = () => {
      id = 0;
      setOn(after.getBoundingClientRect().top < window.innerHeight * 0.5);
    };
    const on = () => {
      if (!id) id = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return (
    <button type="button" className="btn btn-primary to-top" aria-label="Nazad na vrh" data-show={on || undefined} onClick={toFirstScreen}>
      <BtnInner>Na vrh</BtnInner>
    </button>
  );
}
