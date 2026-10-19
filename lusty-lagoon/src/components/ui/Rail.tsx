import { useRef, type ReactNode } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from './Button';
import { SectionHeader } from './SectionHeader';

// A horizontal row with its own previous and next buttons in the header. Scroll snaps to items.
export function Rail({ id, title, children, action }: { id: string; title: string; children: ReactNode; action?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <SectionHeader
        id={id}
        title={title}
        action={
          <div className="flex items-center gap-2">
            {action}
            <Button variant="quiet" size="icon" aria-label={`Previous, ${title}`} onClick={() => move(-1)}>
              <CaretLeft className="h-5 w-5" aria-hidden />
            </Button>
            <Button variant="quiet" size="icon" aria-label={`Next, ${title}`} onClick={() => move(1)}>
              <CaretRight className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        }
      />
      <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        {children}
      </div>
    </section>
  );
}
