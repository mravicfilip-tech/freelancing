import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { FAQS } from './faqs';

export function FaqPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold text-ink">Questions and answers</h1>
        <p className="text-16 text-ink2">Deposits, withdrawals, ranks and partner platforms, in plain words.</p>
      </div>
      <div className="rounded-2xl border border-line bg-panel px-6">
        <Accordion type="single" collapsible defaultValue={FAQS[0].id}>
          {FAQS.map((f) => (
            <AccordionItem key={f.id} value={f.id} title={f.q}>
              {f.a}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
