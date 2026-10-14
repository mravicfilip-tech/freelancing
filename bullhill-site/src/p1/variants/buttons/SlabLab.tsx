import './lab.css';
import type { Content } from '../../../shared/content';
import { PhoneIcon } from '../../art';
import { Bracket } from '../../Bracket';
import type { SlabN } from '../params';

// The five versions of the slab and arrow at ?v=1&lab=slab. Each version is one numbered section
// with three ground bands, dark, light and the red closing panel. A band holds one live set and a
// table of demo copies forced with state classes, so one still shows default, hover, pressed,
// focus and disabled for primary, secondary and icon use. English only, this page is for review.
const VERSIONS: { n: SlabN; name: string; text: string }[] = [
  { n: 1, name: 'Arrow swap', text: 'The reference, style 3 as built. On hover the arrow leaves to the right, a new one slides in from the left and the slab turns red. Press drops it 1px.' },
  { n: 2, name: 'Offset plate', text: 'A hard 4px plate of bull-red-dark sits behind the slab. Hover moves the slab 2px onto it and pushes the arrow 4px right. Press moves it flat.' },
  { n: 3, name: 'Arrow cell', text: 'The arrow sits in its own square cell behind a 1px hairline. Hover widens the cell, turns it red and runs the arrow to the far edge. The label holds still.' },
  { n: 4, name: 'Cut line', text: 'A 2px rule under the label draws across from the left on hover, like a cut being made, and the arrow rides along toward its end.' },
  { n: 5, name: 'Split flap', text: 'On hover the letters flip one by one like a split flap board, the arrow steps 6px right and the slab turns red. The accessible name stays the plain label.' },
];

const GROUNDS = [
  { id: 'dark', label: 'Dark ground', note: 'Slab #dadada on #111' },
  { id: 'light', label: 'Light ground', note: 'Slab #111 on #dadada' },
  { id: 'red', label: 'Red closing panel', note: 'Slab #111 on #d00b11' },
] as const;

const STATES = [
  { id: 'default', label: 'Default', cls: '', disabled: false },
  { id: 'hover', label: 'Hover', cls: 'is-hover', disabled: false },
  { id: 'pressed', label: 'Pressed', cls: 'is-hover is-press', disabled: false },
  { id: 'focus', label: 'Focus', cls: 'is-focus', disabled: false },
  { id: 'disabled', label: 'Disabled', cls: '', disabled: true },
] as const;

type Use = 'primary' | 'secondary' | 'icon';
const USES: { id: Use; label: string }[] = [
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
  { id: 'icon', label: 'Icon' },
];

function Demo({ c, n, use, cls = '', disabled = false, live = false }: { c: Content; n: SlabN; use: Use; cls?: string; disabled?: boolean; live?: boolean }) {
  const extra = live ? {} : { tabIndex: -1 };
  if (use === 'icon') {
    return (
      <Bracket btn={3} slab={n} square className={cls} disabled={disabled} aria-label={c.ui.call} {...extra}>
        <PhoneIcon />
      </Bracket>
    );
  }
  return (
    <Bracket btn={3} slab={n} variant={use === 'primary' ? 'fill' : 'line'} className={cls} disabled={disabled} {...extra}>
      {use === 'primary' ? c.ui.send : c.ui.call}
    </Bracket>
  );
}

function Band({ c, n, ground }: { c: Content; n: SlabN; ground: (typeof GROUNDS)[number] }) {
  return (
    <div className={`slab__band slab__band--${ground.id}`} data-ground-band={ground.id}>
      <div className="g slab__bgrid">
        <div className="slab__bid">
          <div>
            <p className="mono slab__bl">{ground.label}</p>
            <p className="mono slab__bn">{ground.note}</p>
          </div>
          <div className="slab__live">
            <Demo c={c} n={n} use="primary" live />
            <Demo c={c} n={n} use="secondary" live />
            <Demo c={c} n={n} use="icon" live />
          </div>
        </div>
        <div className="blab__scroll" aria-hidden="true">
          <table className="blab__states">
            <thead>
              <tr>
                <th scope="col" />
                {STATES.map((st) => (
                  <th scope="col" className="mono" key={st.id}>
                    {st.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USES.map((u) => (
                <tr key={u.id}>
                  <th scope="row" className="mono">
                    {u.label}
                  </th>
                  {STATES.map((st) => (
                    <td key={st.id}>
                      <Demo c={c} n={n} use={u.id} cls={st.cls} disabled={st.disabled} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SlabLab({ c }: { c: Content }) {
  return (
    <section className="blab slab" aria-labelledby="slab-title">
      <div className="blab__intro">
        <div className="g">
          <p className="mono kicker">Button lab</p>
          <h1 id="slab-title" className="display blab__title">
            Five slab and arrow versions
          </h1>
          <p className="mono-body blab__lede">
            Style 3 as five versions. Each one on a dark, a light and the red closing ground, with every state forced so it shows in a still. Open one on the whole site with ?v=1&amp;btn=3&amp;slab=1 up to 5.
          </p>
        </div>
      </div>
      {VERSIONS.map((s) => (
        <article className="slab__v" id={`s${s.n}`} key={s.n} aria-labelledby={`slab-name-${s.n}`}>
          <header className="g slab__vh">
            <span className="blab__n" aria-hidden="true">
              {String(s.n).padStart(2, '0')}
            </span>
            <h2 id={`slab-name-${s.n}`} className="blab__name display">
              {s.name}
            </h2>
            <p className="blab__text mono-body">{s.text}</p>
          </header>
          {GROUNDS.map((g) => (
            <Band c={c} n={s.n} ground={g} key={g.id} />
          ))}
        </article>
      ))}
    </section>
  );
}
