import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { CopyField } from '../components/ui/CopyField';
import { Field } from '../components/ui/Field';
import { Logo } from '../components/ui/Logo';
import { MethodLogo } from '../components/ui/MethodLogo';
import { Progress } from '../components/ui/Progress';
import { RadioCard, RadioCards } from '../components/ui/RadioCards';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusChip } from '../components/ui/StatusChip';
import { Stepper } from '../components/ui/Stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { cashById } from '../data/wallet';
import { Accordion, AccordionItem } from '../components/ui/Accordion';
import { Checkbox } from '../components/ui/Checkbox';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/Dialog';
import { GameTile } from '../components/ui/GameTile';
import { Message } from '../components/ui/Message';
import { PasswordField } from '../components/ui/PasswordField';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { GAMES } from '../data/games';
import { Receipt } from '@phosphor-icons/react';

// The system that replaced the effects. Every part in its states, on one page, for the case study.

const SWATCHES = [
  ['page', '#140C23', 'Page ground'],
  ['sunken', '#181028', 'Inputs, table head'],
  ['panel', '#1E1232', 'Cards and panels'],
  ['raised', '#2A1C45', 'Hover, selected, active nav'],
  ['line', '#3A2A5A', 'Decorative edges'],
  ['field', '#7A64A3', 'Input edges, 3.52 to 1'],
  ['ink', '#FFFFFF', 'Text, 17.68 to 1'],
  ['ink-2', '#B293C6', 'Secondary text, 6.64 to 1'],
  ['ink-3', '#9D86C2', 'Muted text, 5.58 to 1'],
  ['accent', '#B47CFF', 'Selection, focus, active tab'],
  ['brand', '#8D26E7', 'Wordmark only'],
  ['gold', '#F4D543', 'Primary action, once per view'],
  ['tonal', '#3B2366', 'Secondary action'],
  ['pending', '#F19920', 'Pending'],
  ['success', '#3DD68C', 'Completed, money in'],
  ['danger', '#FF7A88', 'Declined, errors'],
] as const;

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-line pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-24 font-semibold text-ink">{title}</h2>
        {note && <p className="max-w-2xl text-16 text-ink2">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: string }) {
  return <span className="text-14 font-semibold uppercase tracking-[var(--bl-ls-label)] text-ink3">{children}</span>;
}

export function KitPage() {
  const [pick, setPick] = useState('visa');
  return (
    <div className="mx-auto flex max-w-canvas flex-col gap-12 px-[var(--bl-page-pad)] py-12">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Logo />
          <h1 className="font-display text-40 font-semibold text-ink">Lusty Lagoon kit</h1>
          <p className="max-w-2xl text-18 text-ink2">
            Flat surfaces, three text colours, one gold action per view. Hierarchy and state come from size, weight, colour and a check mark,
            never from gradients, glow, bevels or inset shadows.
          </p>
        </div>
      </header>

      <Section title="Colour" note="Sampled from the Figma file. Contrast is measured on panel.">
        <div className="grid grid-cols-4 gap-4">
          {SWATCHES.map(([name, hex, job]) => (
            <div key={name} className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
              <span className="h-10 w-10 shrink-0 rounded-lg border border-line" style={{ background: hex }} aria-hidden />
              <span className="flex min-w-0 flex-col">
                <span className="text-14 font-semibold text-ink">
                  {name} <span className="font-mono font-normal text-ink3">{hex}</span>
                </span>
                <span className="text-14 text-ink2">{job}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type" note="Bai Jamjuree for display and the wordmark, Switzer for everything you read to act.">
        <div className="flex flex-col gap-3">
          <p className="font-display text-40 font-semibold text-ink">Where luck meets lust</p>
          <p className="font-display text-24 font-semibold text-ink">How do you want to deposit?</p>
          <p className="text-18 text-ink">Crypto lands in minutes. Cards and PayPal land at once.</p>
          <p className="text-16 text-ink2">Coins sent on any other network are lost and cannot be returned.</p>
          <p className="text-14 text-ink3">Between $20 and $5,000.</p>
        </div>
      </Section>

      <Section title="Buttons" note="Gold is the one primary action per view. Tonal purple is secondary. Text buttons are for Back, Max and links.">
        <div className="grid grid-cols-4 gap-6">
          {(['primary', 'secondary', 'tertiary', 'quiet'] as const).map((v) => (
            <div key={v} className="flex flex-col items-start gap-3">
              <Label>{v}</Label>
              <Button variant={v} size="lg">
                Continue
                {v === 'primary' && <ArrowRight className="h-5 w-5" aria-hidden />}
              </Button>
              <Button variant={v}>Make another deposit</Button>
              <Button variant={v} loading>
                Processing
              </Button>
              <Button variant={v} disabled>
                Not available
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tabs" note="Label plus a 2px underline. No fill, no inset shadow.">
        <Tabs defaultValue="withdraw">
          <TabsList aria-label="Example tabs">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="tip">Tip</TabsTrigger>
            <TabsTrigger value="gift">Gift card</TabsTrigger>
          </TabsList>
          {['deposit', 'withdraw', 'tip', 'gift'].map((v) => (
            <TabsContent key={v} value={v} className="pt-4 text-14 text-ink3">
              Panel for {v}
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      <Section title="Selection cards" note="The fix for the Visa note. Selected is a 2px accent border, a raised fill and a check, so it never reads as a stronger gradient.">
        <RadioCards value={pick} onValueChange={setPick} aria-label="Payment method" className="grid grid-cols-4 gap-3">
          {(['mastercard', 'visa', 'paypal', 'wire'] as const).map((id) => (
            <RadioCard key={id} value={id} className="gap-4" disabled={id === 'wire'}>
              <MethodLogo selection={{ kind: 'cash', methodId: id }} />
              <span className="flex flex-col pr-6">
                <span className="text-16 font-semibold text-ink">{cashById(id).name}</span>
                <span className="text-14 text-ink2">{id === 'wire' ? 'Unavailable' : 'Instantly, 2.5% fee'}</span>
              </span>
            </RadioCard>
          ))}
        </RadioCards>
      </Section>

      <Section title="Fields">
        <div className="grid grid-cols-3 gap-6">
          <Field label="Amount" prefix="$" placeholder="0.00" hint="Between $20 and $5,000." />
          <Field label="Amount" prefix="$" defaultValue="5" error="The minimum is $20." />
          <Field label="Amount" prefix="$" defaultValue="100" disabled hint="Locked while a payment is in progress." />
        </div>
        <CopyField label="Your USDT address" value="TQm4h8Xz2Rk9Vn5bL7wC3pE6sJ1aG8dY2u" />
      </Section>

      <Section title="Status, progress and steps">
        <div className="flex gap-3">
          <StatusChip status="pending" />
          <StatusChip status="completed" />
          <StatusChip status="declined" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-14">
              <span className="num text-ink">
                550,000 <span className="text-ink3">of 650,000</span>
              </span>
              <span className="num font-semibold text-ink">84%</span>
            </div>
            <Progress value={84} label="84% of the way to Silver" />
          </div>
        </div>
        <Stepper steps={['Method', 'Amount', 'Review', 'Status']} current={2} />
      </Section>

      <Section title="Choices and toggles" note="Radix underneath, so keyboard and focus behave. Every control has a label.">
        <div className="grid grid-cols-3 gap-6">
          <Select label="Default payment method" options={[{ value: 'visa', label: 'Visa ending 4821' }, { value: 'usdt', label: 'USDT on Tron' }, { value: 'paypal', label: 'PayPal' }]} defaultValue="visa" />
          <PasswordField label="Password" defaultValue="lagoon2026" hint="At least 8 characters, with a letter and a number." />
          <div className="flex flex-col gap-4">
            <Switch label="Deposit and withdrawal updates" description="A notice when money lands or leaves." defaultChecked />
            <Switch label="Giveaway news" />
            <Checkbox label="I am 18 or older and I agree to the terms" defaultChecked />
          </div>
        </div>
      </Section>

      <Section title="Games, questions and dialogs">
        <div className="grid grid-cols-6 gap-4">
          {GAMES.filter((g) => !g.wideOnly).slice(0, 6).map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-line bg-panel px-6">
            <Accordion type="single" collapsible defaultValue="a">
              <AccordionItem value="a" title="How long do withdrawals take?">
                After a short security check, crypto usually arrives in under 20 minutes.
              </AccordionItem>
              <AccordionItem value="b" title="Are there fees?">
                Cards cost 2.5% and PayPal 3%. Crypto deposits are free.
              </AccordionItem>
            </Accordion>
          </div>
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-panel p-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open a dialog</Button>
              </DialogTrigger>
              <DialogContent title="Sugar Rush" description="Pragmatic Play">
                <p className="text-16 text-ink2">A dialog on the panel surface, with the page dimmed behind it.</p>
              </DialogContent>
            </Dialog>
            <Message className="py-6" icon={<Receipt weight="fill" className="h-10 w-10 text-ink3" aria-hidden />} title="No transactions yet" body="Deposits and withdrawals show here the moment you make one." />
          </div>
        </div>
      </Section>

      <Section title="Notes and loading">
        <div className="grid grid-cols-2 gap-6">
          <Callout tone="warning">
            <p className="font-semibold">Send only USDT on Tron (TRC20).</p>
            <p className="text-ink2">Coins sent on any other network are lost and cannot be returned.</p>
          </Callout>
          <Callout>
            <p>Card details go straight to our payment processor.</p>
          </Callout>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Section>
    </div>
  );
}
