import './lab.css';
import type { Content } from '../../../shared/content';
import { PhoneIcon } from '../../art';
import { Bracket } from '../../Bracket';
import { labKind } from '../params';
import type { VariantN } from '../params';
import { SlabLab } from './SlabLab';

// The five button styles side by side with their states, at ?v=1&lab=buttons. The state cells are
// demo copies forced with state classes so one still screenshot shows every state. English only,
// this page is for review and does not ship.
const STYLES: { n: VariantN; name: string; text: string }[] = [
  { n: 1, name: 'Bracket', text: 'Four corner marks round the label. Hover spreads the corners 2px and adds a faint fill. As built.' },
  { n: 2, name: 'Bracket sweep', text: 'The corners stay put. Red rises from the bottom edge on hover and the label turns white. Press pulls the corners in 2px.' },
  { n: 3, name: 'Slab and arrow', text: 'A solid slab. On hover the arrow leaves to the right, a new one slides in from the left and the slab turns red. Press drops it 1px.' },
  { n: 4, name: 'Text roll', text: 'No box. A red square, the label and a rule. On hover the label rolls up, its copy rolls in from below and the rule draws across in red.' },
  { n: 5, name: 'Split cell', text: 'A label cell and a square arrow cell. On hover the arrow cell turns red, the arrow points up and right and the label shifts 4px. Press scales to 0.96.' },
];

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

function Demo({ c, n, use, cls = '', disabled = false, live = false }: { c: Content; n: VariantN; use: Use; cls?: string; disabled?: boolean; live?: boolean }) {
  const extra = live ? {} : { tabIndex: -1 };
  if (use === 'icon') {
    return (
      <Bracket btn={n} square className={cls} disabled={disabled} aria-label={c.ui.call} {...extra}>
        <PhoneIcon />
      </Bracket>
    );
  }
  return (
    <Bracket btn={n} variant={use === 'primary' ? 'fill' : 'line'} className={cls} disabled={disabled} {...extra}>
      {use === 'primary' ? c.ui.send : c.ui.call}
    </Bracket>
  );
}

function Panel({ c, ground, kicker, note }: { c: Content; ground: 'dark' | 'light'; kicker: string; note: string }) {
  return (
    <div className={`blab__panel blab__panel--${ground}`}>
      <div className="g">
        <header className="blab__phead">
          <h2 className="mono blab__ph">{kicker}</h2>
          <p className="mono">{note}</p>
        </header>
        {STYLES.map((s) => (
          <article className="blab__row" key={s.n} aria-labelledby={`blab-${ground}-${s.n}`}>
            <div className="blab__id">
              <span className="blab__n" aria-hidden="true">
                {String(s.n).padStart(2, '0')}
              </span>
              <h3 id={`blab-${ground}-${s.n}`} className="blab__name display">
                {s.name}
              </h3>
              <p className="blab__text mono-body">{s.text}</p>
              <div className="blab__live">
                <p className="mono">Try it</p>
                <div className="blab__live-row">
                  <Demo c={c} n={s.n} use="primary" live />
                  <Demo c={c} n={s.n} use="secondary" live />
                  <Demo c={c} n={s.n} use="icon" live />
                </div>
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
                          <Demo c={c} n={s.n} use={u.id} cls={st.cls} disabled={st.disabled} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ButtonLab({ c }: { c: Content }) {
  // ?lab=slab opens the slab and arrow lab, any other lab value opens the five styles.
  if (labKind() === 'slab') return <SlabLab c={c} />;
  return (
    <section className="blab" aria-labelledby="blab-title">
      <div className="blab__intro">
        <div className="g">
          <p className="mono kicker">Button lab</p>
          <h1 id="blab-title" className="display blab__title">
            Five button styles
          </h1>
          <p className="mono-body blab__lede">
            Each style on a dark and a light ground, with every state forced so it shows in a still. Open one on the whole site with ?v=1&amp;btn=1 up to 5.
          </p>
        </div>
      </div>
      <Panel c={c} ground="dark" kicker="Dark ground" note="Text #dadada on #111" />
      <Panel c={c} ground="light" kicker="Light ground" note="Text #111 on #dadada" />
    </section>
  );
}
