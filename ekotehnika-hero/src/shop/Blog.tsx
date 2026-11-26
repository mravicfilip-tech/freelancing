// A blog post, the hardest of the blog's screens and the first one built (/newui, taste 2026-11-26 13:06, briefs/blog/plan.md). On the
// site's four frames. The head has the category and the title in frames 1 and 2, the lede and the reading time in 3 and 4. The lead photo
// runs across all four with the site's drift. The text runs in frames 2 and 3, a long post's contents stand pinned in frame 1, and frame 4
// holds one card for the shop category or the service the post leads to, with the page's one red button. A photo in the text widens over
// frames 2 to 4 under that card. The close is the short inquiry on the post's topic, then three other posts. On a phone it is one column,
// the contents a closed row over the text, the card after the text with a secondary button since the phone bar holds the red one.
import { useEffect } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { categoryOf, fmt, hrefCategory, modela, statsOf } from './data';
import { Link } from './route';
import { Cap, Cell } from './parts';
import { QuickAsk } from './QuickAsk';
import { Page, Par } from './Pages';
import { type Block, type Post, type PostCard, minutes, postOf, relatedOf } from './blog';

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Ekotehnika`;
  }, [title]);
}

// a card that names a shop category reads its name, count and capacities from the shop, so it never drifts from the shop's own numbers
function cardOf(c: PostCard) {
  if (!('cat' in c)) return c;
  const k = categoryOf(c.cat);
  const st = statsOf(c.cat);
  const kg = st.kg ? `, nosivost ${st.kg[0] === st.kg[1] ? fmt(st.kg[0]) : `${fmt(st.kg[0])} do ${fmt(st.kg[1])}`} kg` : '';
  return { label: c.label, title: k?.name ?? c.cat, line: `${modela(st.count)}${kg}.`, href: hrefCategory(c.cat), cta: c.cta };
}

// a draft has no date yet, it shows the draft mark in its place
function Meta({ p }: { p: Post }) {
  return (
    <p className="pg-post-meta">
      {p.draft ? <span className="pg-post-draft">Nacrt</span> : <time>{p.date}</time>}
      <span>{minutes(p)} min čitanja</span>
    </p>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === 'h')
          return (
            <h2 className="pg-post-h2" id={b.id} key={i}>
              {b.text}
            </h2>
          );
        if (b.t === 'p') return <p key={i}>{b.text}</p>;
        if (b.t === 'list')
          return (
            <ul className="sp-list pg-post-list" key={i}>
              {b.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          );
        if (b.t === 'pic')
          return (
            <figure className={`pg-post-fig${b.contain ? ' is-contain' : ''}`} key={i}>
              <span className="pg-post-ph">
                <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
              </span>
              <figcaption>{b.cap}</figcaption>
            </figure>
          );
        return (
          <figure className="pg-post-tbl" key={i}>
            <table className="sp-tbl">
              <tbody>
                {b.rows.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <figcaption>{b.cap}</figcaption>
          </figure>
        );
      })}
    </>
  );
}

// the contents of a post with three sections or more, pinned beside the text on a screen, a closed row over the text on a phone
function Contents({ heads, phone = false }: { heads: { id: string; text: string }[]; phone?: boolean }) {
  const list = (
    <ol>
      {heads.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ol>
  );
  if (phone)
    return (
      <details className="sp-more-d pg-toc-m">
        <summary>Sadržaj</summary>
        {list}
      </details>
    );
  return (
    <nav className="pg-toc" aria-label="Sadržaj">
      <p className="sp-lab">Sadržaj</p>
      {list}
    </nav>
  );
}

// a post as a card, its photo, its category, its title as the card's one link and its reading time, for the related posts and the list
export function PostTile({ p }: { p: Post }) {
  return (
    <Cell className="sp-card pg-pc">
      <div className="sp-card-in">
        <span className="pg-pc-pic">{p.lead ? <img src={p.lead.src} alt="" loading="lazy" decoding="async" /> : null}</span>
        <span className="sp-lab">{p.cat}</span>
        <h3 className="pg-pc-t">
          <Link className="sp-card-a" href={`/${p.slug}`}>
            {p.title}
          </Link>
        </h3>
        <Meta p={p} />
      </div>
    </Cell>
  );
}

export function PostPage({ slug }: { slug: string }) {
  const p = postOf(slug)!;
  useTitle(p.title);
  const heads = p.body.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h');
  const toc = heads.length >= 3;
  const card = cardOf(p.card);
  const related = relatedOf(p.slug);
  return (
    <Page>
      <section className="sp-frame pg-post-hd" aria-labelledby="pg-post-h">
        <Cell span={2} className="pg-post-hl">
          <div className="pg-in">
            <p className="sp-lab">{p.cat}</p>
            <h1 className="pg-post-t" id="pg-post-h">
              {p.title}
            </h1>
          </div>
        </Cell>
        <Cell span={2} className="pg-post-hr">
          <div className="pg-in">
            <p className="sp-lede">{p.lede}</p>
            <Meta p={p} />
          </div>
        </Cell>
      </section>

      {p.lead ? (
        <section className="sp-frame pg-post-lead">
          <Cell span={4} className="pg-post-lead-c">
            <Par src={p.lead.src} alt={p.lead.alt} focus={p.lead.focus} eager />
          </Cell>
        </section>
      ) : null}

      <section className="sp-frame pg-post-b">
        <Cell className="pg-post-side">{toc ? <Contents heads={heads} /> : null}</Cell>
        <Cell span={2} className="pg-post-art">
          {p.draft ? (
            <p className="sp-note pg-post-note" role="note">
              {p.draft}
            </p>
          ) : null}
          {toc ? <Contents heads={heads} phone /> : null}
          <article className="pg-post-text">
            <Blocks blocks={p.body} />
          </article>
        </Cell>
        <Cell className="pg-post-aside">
          <aside className="pg-post-card" aria-label={card.title}>
            <p className="sp-lab">{card.label}</p>
            <p className="pg-post-card-t">{card.title}</p>
            <p className="pg-post-card-l">{card.line}</p>
            <Link className="btn btn-primary pg-on-wide" href={card.href} data-cta="post-card">
              <BtnInner>{card.cta}</BtnInner>
            </Link>
            <Link className="btn btn-secondary pg-on-phone" href={card.href} data-cta="post-card">
              <BtnInner>{card.cta}</BtnInner>
            </Link>
          </aside>
        </Cell>
      </section>

      <QuickAsk id="post" tema={p.tema} label="Upit" title={p.ask.title} poruka={p.ask.poruka} cta={p.ask.cta} />

      <section className="sp-frame pg-post-rel pg-rv" aria-labelledby="pg-rel-h">
        <Cell span={4} className="sp-sec-h">
          <h2 className="sp-lab" id="pg-rel-h">
            Još iz bloga
          </h2>
        </Cell>
        {related.map((r) => (
          <PostTile p={r} key={r.slug} />
        ))}
        {Array.from({ length: (4 - related.length) % 4 }, (_, i) => (
          <Cell className="is-blank" key={`b${i}`} />
        ))}
        <Cap />
      </section>
    </Page>
  );
}
