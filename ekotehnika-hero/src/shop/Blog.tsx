// A blog post, one reading column (taste 2026-11-26 14:34, after Stripe's blog post page). Filip found the first build "a bit confusing to
// look at", four things side by side after the lead photo, pinned contents, a draft box, the text and a red card, and photos that widened
// under the card. Now the head stacks the category, the title, the lede, the reading time and the draft line in frames 1 to 3. The lead
// photo runs across all four frames with the site's drift. The body is one cell with no line inside it, the text and every photo in frames
// 2 and 3, a long post's contents a short list at the top of the text, and the post's card its last block with a secondary button. The red
// stays on the short inquiry under it, then three other posts. On a phone the contents are a closed row over the text.
import { useEffect, useState } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { categoryOf, fmt, hrefCategory, modela, statsOf } from './data';
import { Link } from './route';
import { Cap, Cell } from './parts';
import { QuickAsk } from './QuickAsk';
import { Page, Par } from './Pages';
import { type Block, type Post, type PostCard, minutes, postOf, POSTS, relatedOf } from './blog';

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
        <Cell span={4} className="pg-post-hc">
          <div className="pg-in">
            <p className="sp-lab">{p.cat}</p>
            <h1 className="pg-post-t" id="pg-post-h">
              {p.title}
            </h1>
            <p className="sp-lede">{p.lede}</p>
            <Meta p={p} />
            {/* the draft's note is one grey line under the reading time, the mark beside it already says Nacrt */}
            {p.draft ? <p className="pg-post-dnote">{p.draft.replace(/^Nacrt\.\s*/, '')}</p> : null}
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
        <Cell span={4} className="pg-post-bc">
          <div className="pg-post-col">
            {toc ? <Contents heads={heads} /> : null}
            {toc ? <Contents heads={heads} phone /> : null}
            <article className="pg-post-text">
              <Blocks blocks={p.body} />
            </article>
            <aside className="pg-post-card" aria-label={card.title}>
              <p className="sp-lab">{card.label}</p>
              <p className="pg-post-card-t">{card.title}</p>
              <p className="pg-post-card-l">{card.line}</p>
              <Link className="btn btn-secondary" href={card.href} data-cta="post-card">
                <BtnInner>{card.cta}</BtnInner>
              </Link>
            </aside>
          </div>
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

// The blog's list at /blog/, built from the post page's parts once Filip accepted it ("go, build the list page", 26 November). The newest
// post as a wide card across the four frames, its photo in frames 1 and 2 and its words in 3 and 4, then the other posts in the shop's
// card grid. The chips of the shop's category bar come once a category holds two posts or more, until then they would each filter to one.
// A list with no posts says the first ones are on their way.
export function BlogPage() {
  useTitle('Blog');
  const cats = [...new Set(POSTS.map((p) => p.cat))];
  const chips = cats.filter((c) => POSTS.filter((p) => p.cat === c).length >= 2);
  const [cat, setCat] = useState('');
  const shown = cat ? POSTS.filter((p) => p.cat === cat) : POSTS;
  const [lead, ...rest] = shown;
  const blanks = (4 - (rest.length % 4)) % 4;
  return (
    <Page>
      <section className="sp-frame pg-post-hd" aria-labelledby="pg-blog-h">
        <Cell span={2} className="pg-post-hl">
          <div className="pg-in">
            <p className="sp-lab">Ekotehnika</p>
            <h1 className="pg-post-t" id="pg-blog-h">
              Blog
            </h1>
          </div>
        </Cell>
        <Cell span={2} className="pg-post-hr">
          <div className="pg-in">
            <p className="sp-lede">Bezbednost, servis i delovi, događaji i poslovi sa terena.</p>
          </div>
        </Cell>
      </section>

      {chips.length ? (
        <section className="sp-frame" aria-labelledby="pg-blog-cats">
          <Cell span={4} className="sp-bar sp-cats-bar">
            <h2 className="sp-lab" id="pg-blog-cats">
              Teme
            </h2>
            <div className="sp-pills" role="group" aria-label="Teme bloga">
              {['', ...chips].map((c) => (
                <button type="button" className="sp-pill" aria-pressed={cat === c} onClick={() => setCat(c)} key={c || 'sve'}>
                  {c || 'Sve'} <span>{c ? POSTS.filter((p) => p.cat === c).length : POSTS.length}</span>
                </button>
              ))}
            </div>
          </Cell>
        </section>
      ) : null}

      {lead ? (
        <section className={`sp-frame pg-bl-lead${rest.length ? '' : ' is-last'}`} aria-labelledby="pg-bl-lead-h">
          <Cell span={2} className="pg-bl-lead-pic">
            {lead.lead ? (
              <Link href={`/${lead.slug}`} tabIndex={-1} aria-hidden="true">
                <Par src={lead.lead.src} focus={lead.lead.focus} eager />
              </Link>
            ) : null}
          </Cell>
          <Cell span={2} className="pg-bl-lead-t">
            <p className="sp-lab">{lead.cat}</p>
            <h2 className="pg-bl-lead-h" id="pg-bl-lead-h">
              <Link className="sp-card-a" href={`/${lead.slug}`}>
                {lead.title}
              </Link>
            </h2>
            <p className="sp-lede">{lead.lede}</p>
            <Meta p={lead} />
          </Cell>
          {rest.length ? null : <Cap />}
        </section>
      ) : (
        <section className="sp-frame" aria-label="Blog">
          <Cell span={4}>
            <p className="sp-lede">Prvi tekstovi stižu uskoro.</p>
          </Cell>
          <Cap />
        </section>
      )}

      {rest.length ? (
        <section className="sp-frame pg-post-rel pg-rv" aria-labelledby="pg-bl-all">
          <Cell span={4} className="sp-sec-h">
            <h2 className="sp-lab" id="pg-bl-all">
              Svi tekstovi
            </h2>
          </Cell>
          {rest.map((p) => (
            <PostTile p={p} key={p.slug} />
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <Cell className="is-blank" key={`b${i}`} />
          ))}
          <Cap />
        </section>
      ) : null}
    </Page>
  );
}
