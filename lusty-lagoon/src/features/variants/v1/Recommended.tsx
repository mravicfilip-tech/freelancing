import { Skeleton } from '../../../components/ui/Skeleton';
import { GameTile } from '../../../components/ui/GameTile';
import { gameById, type CatalogueGame } from '../../../data/games';
import { RECOMMENDED } from '../../lobby/data';
import { RailArrows, SectionHead, useRail } from './parts';

export function Recommended({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const rail = useRail(152 * 4);
  const games = RECOMMENDED.map((id) => gameById(id)!);
  return (
    <section aria-labelledby="v1-reco" className="min-w-0">
      <SectionHead id="v1-reco" title="Recommended for you" hint="Based on what you play">
        {state !== 'error' && state !== 'loading' && <RailArrows rail={rail} name="recommended for you" />}
      </SectionHead>
      <div ref={rail.ref} onScroll={rail.update} className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none]">
        {state === 'loading'
          ? Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-[222px] w-[149px] shrink-0" />)
          : games.map((g) => (
              <div key={g.id} className="w-[149px] shrink-0 snap-start">
                <GameTile game={g} onPlay={() => onPlay(g)} />
              </div>
            ))}
      </div>
    </section>
  );
}
