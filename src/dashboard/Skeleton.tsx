/**
 * The shape of the page while its figures are still resolving. It mirrors the
 * real layout closely enough that nothing jumps when the data lands — same
 * card count, same split, same row heights.
 *
 * The topbar is not skeletoned: its greeting and title are static, so blanking
 * them would only make the page flicker.
 */

/** One shimmering block. `w` and `h` are any CSS length. */
function Skel({ w = '100%', h = 14, r = 7 }: { w?: string | number; h?: number; r?: number }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

function StatSkel() {
  return (
    <article className="card stat">
      <div className="skel-stack">
        <Skel w={92} h={12} />
        <Skel w={168} h={34} r={9} />
        <Skel w={124} h={12} />
      </div>
      <div className="stat__aside">
        <Skel w={40} h={40} r={12} />
      </div>
    </article>
  );
}

function rows(n: number, h: number) {
  return Array.from({ length: n }, (_, i) => <Skel key={i} h={h} r={10} />);
}

export function DashboardSkeleton() {
  return (
    /* aria-busy on a live region: a screen reader announces that the dashboard
       is loading rather than reading out a wall of empty boxes. */
    <div className="skel-page" aria-busy="true" aria-live="polite" aria-label="Loading your dashboard">
      <section className="stat-row">
        <StatSkel />
        <StatSkel />
        <StatSkel />
      </section>

      <section className="card ladder">
        <div className="skel-stack">
          <Skel w={92} h={12} />
          <Skel w={132} h={44} r={10} />
        </div>
        <div className="skel-ladder">
          {Array.from({ length: 12 }, (_, i) => (
            <Skel key={i} h={40 + i * 7} r={5} />
          ))}
        </div>
        <div className="skel-facts">{rows(3, 34)}</div>
      </section>

      <div className="dash__split">
        <section className="card buy">
          <Skel w={116} h={20} r={8} />
          <div className="skel-stack skel-stack--lg">
            <Skel h={52} r={12} />
            <Skel h={56} r={12} />
            <div className="skel-chips">{rows(4, 40)}</div>
            <Skel h={104} r={12} />
            <Skel h={52} r={12} />
            <Skel h={54} r={999} />
          </div>
        </section>

        <div className="card side">
          <div className="skel-stack skel-stack--lg">
            <Skel w={196} h={26} r={8} />
            <Skel h={64} r={12} />
            <Skel h={78} r={12} />
            <Skel w={140} h={20} r={8} />
            <div className="skel-stack">{rows(3, 46)}</div>
            <Skel h={58} r={12} />
          </div>
        </div>
      </div>

      <section className="card orders">
        <Skel w={132} h={20} r={8} />
        <div className="skel-stack skel-orders">{rows(6, 46)}</div>
      </section>
    </div>
  );
}
