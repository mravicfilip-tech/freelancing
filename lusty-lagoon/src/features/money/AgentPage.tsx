import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle, CircleNotch, Circle, Clock, LockKey, MagnifyingGlass, UserCircleMinus, WarningCircle, XCircle } from '@phosphor-icons/react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Field } from '../../components/ui/Field';
import { Message } from '../../components/ui/Message';
import { RadioCard, RadioCards } from '../../components/ui/RadioCards';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Stepper } from '../../components/ui/Stepper';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatAmount, formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useWallet } from '../wallet/store';
import {
  AGENTS,
  PLATFORMS,
  STATUS_ORDER,
  STATUS_WORD,
  largeAgents,
  platformById,
  sendLabel,
  type Agent,
  type AgentStatus,
  type PlatformId,
} from './agentData';
import { addSend, nextSendId, updateSend, useAgentSends } from './agentStore';
import { FieldNote, Panel, StepHeading, SummaryCard, SummaryRow, initialsOf, recordMove, readQuery, useViewSwitch, wait } from './shared';

// Send to agent, Figma 419:992. The player moves credit from their balance to an agent, who loads
// it onto a partner platform account. Same Method, Details, Review, Status pattern as the wallet.
//
// URL switches for screenshots.
//   ?pick=<platform id>&agent=<agent id>&amount=100&account=<username>&step=method|details|review|status
//   ?step=status runs the send to its end on load
//   ?outcome=declined   the agent cannot load it, and the credit goes back to the balance
//   ?state=loading|error|empty|large   the agent list
//   ?access=locked   sending is locked until identity is verified (shared with the wallet)

type Step = 'method' | 'details' | 'review' | 'status';
type Outcome = 'processing' | 'pending' | 'completed' | 'declined';

const STEPS: Step[] = ['method', 'details', 'review', 'status'];
const STEP_LABEL: Record<Step, string> = { method: 'Method', details: 'Details', review: 'Review', status: 'Status' };
const PRESETS = ['25', '50', '100', '250', '500'];

type Form = {
  step: Step;
  platformId?: PlatformId;
  agentId?: string;
  amount: string;
  account: string;
  touched: boolean;
  txId?: string;
  outcome?: Outcome;
  stage: number;
  autoSubmit?: boolean;
};

function initialForm(): Form {
  const q = readQuery();
  const pick = q.get('pick');
  const platformId = PLATFORMS.find((p) => p.id === pick)?.id;
  const agentId = [...AGENTS, ...largeAgents()].find((a) => a.id === q.get('agent'))?.id;
  const want = q.get('step') as Step | null;
  const ready = platformId && agentId;
  const step: Step = ready && want && STEPS.includes(want) ? want : 'method';
  return {
    step,
    platformId,
    agentId,
    amount: q.get('amount') ?? '',
    account: q.get('account') ?? (want === 'status' || want === 'review' ? 'johnd_plays' : ''),
    touched: false,
    stage: 0,
    autoSubmit: ready && want === 'status' ? true : undefined,
  };
}

type Errors = Partial<Record<'platform' | 'agent' | 'amount' | 'account', string>>;

function validate(f: Form, balance: number): Errors {
  const e: Errors = {};
  if (!f.platformId) e.platform = 'Pick the platform you want credit on.';
  if (!f.agentId) e.agent = 'Pick an agent to send it to.';
  const platform = f.platformId ? platformById(f.platformId) : null;
  const raw = f.amount.trim().replace(',', '.');
  const n = Number(raw);
  if (!raw) e.amount = 'Enter how much to send.';
  else if (!Number.isFinite(n) || n <= 0) e.amount = 'Enter the amount as a number, such as 100.';
  else if (platform && n < platform.min) e.amount = `The smallest send to ${platform.name} is ${formatAmount(platform.min, 0)} USDT. Enter at least that.`;
  else if (platform && n > platform.max) e.amount = `The most you can send to ${platform.name} at once is ${formatAmount(platform.max, 0)} USDT. Enter that or less.`;
  else if (n > balance) e.amount = `Your balance is ${formatAmount(balance)} USDT. Enter that or less.`;
  const acct = f.account.trim();
  if (!acct) e.account = `Enter your ${platform?.name ?? 'platform'} username, so the agent loads the right account.`;
  else if (/\s/.test(acct) || acct.length < 3) e.account = 'A username has no spaces and at least 3 characters. Copy it again from the platform.';
  return e;
}

const stepErrors = (step: Step, e: Errors) =>
  step === 'method' ? [e.platform, e.agent].filter(Boolean) : step === 'details' ? [e.amount, e.account].filter(Boolean) : [];

const amountOf = (f: Form) => Math.round(Number(f.amount.trim().replace(',', '.')) * 100) / 100;

function StatusDot({ status }: { status: AgentStatus }) {
  // An icon and a word, never colour alone.
  const tone = status === 'online' ? 'text-success' : status === 'busy' ? 'text-pending' : 'text-ink3';
  return (
    <span className="inline-flex items-center gap-1 text-14 font-medium text-ink2">
      <Circle weight="fill" className={cn('h-4 w-4', tone)} aria-hidden />
      {STATUS_WORD[status]}
    </span>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const off = agent.status === 'offline';
  return (
    <RadioCard value={agent.id} disabled={off} className="gap-3 pr-12">
      <Avatar initials={initialsOf(agent.name)} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-16 font-semibold text-ink" title={agent.name}>{agent.name}</span>
        <span className="truncate text-14 text-ink3" title={agent.handle}>@{agent.handle}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <StatusDot status={agent.status} />
          <span className="text-14 text-ink2">{off ? agent.loads : `Loads in ${agent.loads.replace('About ', 'about ')}`}</span>
        </span>
      </span>
    </RadioCard>
  );
}

type ListStatus = 'ready' | 'loading' | 'error';

function MethodStep({ f, set, errors, agents, listStatus, retry }: { f: Form; set: (p: Partial<Form>) => void; errors: Errors; agents: Agent[]; listStatus: ListStatus; retry: () => void }) {
  const [query, setQuery] = useState('');
  const platform = f.platformId ? platformById(f.platformId) : null;
  const forPlatform = useMemo(
    () =>
      agents
        .filter((a) => f.platformId && a.platforms.includes(f.platformId))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name)),
    [agents, f.platformId],
  );
  const shown = forPlatform.filter((a) => `${a.name} ${a.handle}`.toLowerCase().includes(query.trim().toLowerCase()));
  const err = f.touched ? errors : {};

  let list: React.ReactNode;
  if (!platform) {
    list = <p className="rounded-xl border border-line bg-sunken p-4 text-14 text-ink2">Pick a platform first. Then you see the agents who can load it.</p>;
  } else if (listStatus === 'loading') {
    list = (
      <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading agents">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[var(--bl-sp-96)] rounded-xl" />
        ))}
      </div>
    );
  } else if (listStatus === 'error') {
    list = (
      <Message
        className="rounded-xl border border-line bg-sunken py-8"
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="We could not load the agents"
        body="Your balance has not changed. Check your connection, then try again."
        action={<Button variant="secondary" onClick={retry}>Try again</Button>}
      />
    );
  } else if (forPlatform.length === 0) {
    list = (
      <Message
        className="rounded-xl border border-line bg-sunken py-8"
        icon={<UserCircleMinus weight="fill" className="h-10 w-10 text-ink3" aria-hidden />}
        title={`No agents for ${platform.name} right now`}
        body="Agents come online during the day. Pick another platform, or come back in a few minutes."
      />
    );
  } else {
    list = (
      <div className="flex flex-col gap-3">
        {forPlatform.length > 8 && (
          <Field
            label="Find an agent"
            placeholder="Search by name or username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<MagnifyingGlass className="h-5 w-5" aria-hidden />}
            className="max-w-sm"
          />
        )}
        {shown.length === 0 ? (
          <p className="rounded-xl border border-line bg-sunken p-4 text-14 text-ink2">No agent matches that search. Clear it to see all {forPlatform.length}.</p>
        ) : (
          <RadioCards
            value={f.agentId ?? ''}
            onValueChange={(v) => set({ agentId: v })}
            aria-labelledby="agent-label"
            className={cn('grid grid-cols-2 gap-3', shown.length > 8 && 'max-h-[26rem] overflow-y-auto p-1')}
          >
            {shown.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </RadioCards>
        )}
        <p className="num text-14 text-ink3">
          {forPlatform.filter((a) => a.status !== 'offline').length} of {forPlatform.length} agents are taking sends now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Pick a platform and an agent" lead="An agent loads the credit onto your account on the partner platform. It leaves your balance when you confirm." />
      <div className="flex flex-col gap-2">
        <Select
          label="Partner platform"
          placeholder="Choose a platform"
          value={f.platformId ?? ''}
          onValueChange={(v) => set({ platformId: v as PlatformId, agentId: undefined })}
          options={PLATFORMS.map((p) => ({ value: p.id, label: p.name }))}
          hint={platform ? `Sends of ${formatAmount(platform.min, 0)} to ${formatAmount(platform.max, 0)} USDT.` : undefined}
        />
        {err.platform && <FieldNote>{err.platform}</FieldNote>}
      </div>
      <div className="flex flex-col gap-3">
        <span id="agent-label" className="text-14 font-medium text-ink2">
          Agent
        </span>
        {list}
        {err.agent && <FieldNote>{err.agent}</FieldNote>}
      </div>
    </div>
  );
}

function DetailsStep({ f, set, errors, balance, agent }: { f: Form; set: (p: Partial<Form>) => void; errors: Errors; balance: number; agent?: Agent }) {
  const platform = platformById(f.platformId!);
  const err = f.touched ? errors : {};
  const maxAmount = Math.min(balance, platform.max);
  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={`How much should go to ${agent?.name ?? 'the agent'}?`} lead={`It lands as credit on your ${platform.name} account.`} />
      <div className="flex flex-col gap-3">
        <span id="preset-label" className="text-14 font-medium text-ink2">
          Quick amounts
        </span>
        <RadioCards value={PRESETS.includes(f.amount) ? f.amount : ''} onValueChange={(v) => set({ amount: v })} aria-labelledby="preset-label" className="grid grid-cols-5 gap-3">
          {PRESETS.map((p) => (
            <RadioCard key={p} value={p} disabled={Number(p) > balance || Number(p) > platform.max || Number(p) < platform.min} className="justify-center py-3 pl-4 pr-8">
              <span className="num text-16 font-semibold text-ink">{p}</span>
            </RadioCard>
          ))}
        </RadioCards>
      </div>
      <Field
        label="Amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={f.amount}
        onChange={(e) => set({ amount: e.target.value })}
        suffix={
          <span className="flex items-center gap-2">
            <span className="text-16 text-ink3">USDT</span>
            <Button variant="tertiary" size="sm" onClick={() => set({ amount: String(maxAmount) })}>
              Max
            </Button>
          </span>
        }
        hint={`Available ${formatAmount(balance)} USDT. ${platform.name} takes ${formatAmount(platform.min, 0)} to ${formatAmount(platform.max, 0)} USDT at once.`}
        error={err.amount}
      />
      <Field
        label={platform.accountLabel}
        autoComplete="off"
        spellCheck={false}
        value={f.account}
        onChange={(e) => set({ account: e.target.value })}
        hint="The account the agent loads. Check it letter by letter, credit sent to a wrong username is hard to get back."
        error={err.account}
      />
    </div>
  );
}

function ReviewStep({ f, agent }: { f: Form; agent?: Agent }) {
  const platform = platformById(f.platformId!);
  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Check and confirm" lead="The amount leaves your balance now. The agent loads it by hand, as the summary says." />
      <div className="flex items-center gap-4 rounded-xl border border-line bg-sunken p-4">
        <Avatar initials={initialsOf(agent?.name ?? '?')} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-16 font-semibold text-ink">{agent?.name}</span>
          <span className="break-words text-14 text-ink2">
            Loads {formatAmount(amountOf(f))} credit onto {platform.name}, account {f.account.trim()}
          </span>
        </div>
      </div>
      <Callout tone="warning">
        <p className="font-semibold">Only the agent can return credit once it is loaded.</p>
        <p className="text-ink2">If the username is wrong, message the agent right away. We cannot take credit back from a partner platform.</p>
      </Callout>
    </div>
  );
}

type Stage = { label: string };

function StatusStep({ f, agent, onRetry, onPickAnother, onReset }: { f: Form; agent?: Agent; onRetry: () => void; onPickAnother: () => void; onReset: () => void }) {
  const platform = platformById(f.platformId!);
  const amount = formatAmount(amountOf(f));
  const outcome = f.outcome ?? 'processing';
  const stages: Stage[] = [{ label: `Sent to ${agent?.name}` }, { label: 'Agent confirms' }, { label: `Loaded on ${platform.name}` }];
  const view = {
    processing: { Icon: CircleNotch, tone: 'text-accent', title: 'Sending to your agent', spin: true },
    pending: { Icon: Clock, tone: 'text-pending', title: `Waiting for ${agent?.name}`, spin: false },
    completed: { Icon: CheckCircle, tone: 'text-success', title: `Credit loaded on ${platform.name}`, spin: false },
    declined: { Icon: XCircle, tone: 'text-danger', title: `${agent?.name} could not load this`, spin: false },
  }[outcome];
  const lead =
    outcome === 'completed'
      ? `${amount} credit is on your ${platform.name} account, ${f.account.trim()}. Open the platform to play.`
      : outcome === 'declined'
        ? `Your ${amount} USDT is back in your balance. Pick another agent, or check your ${platform.name} username.`
        : outcome === 'pending'
          ? `${agent?.name} usually loads credit ${agent?.loads.toLowerCase()}. You can leave this page, the send stays in your list below.`
          : undefined;
  const done = outcome === 'declined' ? 1 : f.stage;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <view.Icon weight={view.spin ? 'bold' : 'fill'} className={cn('h-10 w-10', view.tone, view.spin && 'animate-spin')} aria-hidden />
        <StepHeading title={view.title} lead={lead} />
      </div>
      <ol className="flex flex-col gap-0" aria-label="Progress">
        {stages.map((st, i) => {
          const state = outcome === 'declined' && i === 1 ? 'failed' : i < done || (i === done && outcome === 'completed') ? 'done' : i === done ? 'now' : 'todo';
          return (
            <li key={st.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2',
                    state === 'done' && 'border-success bg-success',
                    state === 'now' && 'border-accent',
                    state === 'failed' && 'border-danger bg-danger',
                    state === 'todo' && 'border-line',
                  )}
                >
                  {state === 'done' && <CheckCircle weight="fill" size={16} className="text-page" aria-hidden />}
                  {state === 'failed' && <XCircle weight="fill" size={16} className="text-page" aria-hidden />}
                  {state === 'now' && <span className="h-[var(--bl-sp-8)] w-2 animate-pulse rounded-full bg-accent" aria-hidden />}
                </span>
                {i < stages.length - 1 && <span aria-hidden className={cn('h-6 w-[var(--bl-border-2)]', state === 'done' ? 'bg-success' : 'bg-line')} />}
              </div>
              <div className="flex flex-col pb-4">
                <span className={cn('text-16 font-medium', state === 'todo' ? 'text-ink3' : 'text-ink')}>
                  {st.label}
                  <span className="sr-only">, {state === 'done' ? 'done' : state === 'now' ? 'in progress' : state === 'failed' ? 'failed' : 'not started'}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex gap-3">
        {outcome === 'declined' ? (
          <>
            <Button size="lg" onClick={onRetry}>
              Try again
            </Button>
            <Button size="lg" variant="secondary" onClick={onPickAnother}>
              Pick another agent
            </Button>
          </>
        ) : outcome === 'processing' ? null : (
          <>
            {outcome === 'completed' && (
              <Button asChild size="lg">
                <Link to="/lobby">Go to the lobby</Link>
              </Button>
            )}
            <Button size="lg" variant={outcome === 'completed' ? 'secondary' : 'primary'} onClick={onReset}>
              Send more credit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Summary({ f, agent, balance }: { f: Form; agent?: Agent; balance: number }) {
  const sends = useAgentSends();
  const platform = f.platformId ? platformById(f.platformId) : null;
  const rec = f.txId ? sends.find((s) => s.id === f.txId) : undefined;
  const receipt = f.step === 'status' && rec;
  const errors = validate(f, balance);
  const amountOk = !errors.amount && f.amount.trim() !== '';
  const UNSET = <span className="text-16 text-ink3">Not set</span>;
  return (
    <SummaryCard id="summary-title" title={receipt ? 'Receipt' : 'Summary'} chip={receipt ? <StatusChip status={rec.status} /> : undefined}>
      {!platform ? (
        <p className="text-16 text-ink2">Pick a platform and an agent to see what you send and when it lands.</p>
      ) : (
        <>
          <dl className="flex flex-col gap-3">
            <SummaryRow label="Platform">{platform.name}</SummaryRow>
            <SummaryRow label="Agent">{agent ? agent.name : UNSET}</SummaryRow>
            {f.account.trim() && f.step !== 'method' && f.step !== 'details' && <SummaryRow label="Account">{f.account.trim()}</SummaryRow>}
            <SummaryRow label="You send">{amountOk ? `${formatAmount(amountOf(f))} USDT` : UNSET}</SummaryRow>
            <SummaryRow label="Fee">0.00 USDT</SummaryRow>
            <SummaryRow label="Credit on platform" strong>
              {amountOk ? formatAmount(amountOf(f)) : UNSET}
            </SummaryRow>
          </dl>
          {agent && (!receipt || rec.status === 'pending') && (
            <p className="flex items-center gap-2 text-14 text-ink2">
              <Clock className="h-5 w-5 shrink-0 text-ink3" aria-hidden />
              {agent.status === 'offline' ? agent.loads : `Loaded ${agent.loads.toLowerCase().replace('about', 'in about')}`}
            </p>
          )}
          {receipt && (
            <dl className="flex flex-col gap-3 border-t border-line pt-4">
              <SummaryRow label="Reference">{rec.id}</SummaryRow>
              <SummaryRow label="Balance now">{formatAmount(balance)} USDT</SummaryRow>
            </dl>
          )}
        </>
      )}
    </SummaryCard>
  );
}

function SendsTable() {
  const sends = useAgentSends();
  return (
    <section aria-labelledby="sends-title" className="flex flex-col gap-4">
      <h2 id="sends-title" className="font-display text-24 font-semibold text-ink">
        Your sends to agents
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        {sends.length === 0 ? (
          <Message
            icon={<ArrowUpRight weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
            title="No sends yet"
            body="Credit you send to an agent shows here the moment you confirm, with its status."
          />
        ) : (
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">Credit you sent to agents, newest first</caption>
            <thead className="bg-sunken">
              <tr className="text-14 font-medium text-ink3">
                <th scope="col" className="h-11 w-1/3 px-6">Sent to</th>
                <th scope="col" className="h-11 px-4 text-right">Amount</th>
                <th scope="col" className="h-11 px-4">Status</th>
                <th scope="col" className="h-11 px-4">Date</th>
                <th scope="col" className="h-11 px-6">Reference</th>
              </tr>
            </thead>
            <tbody>
              {sends.map((s) => {
                const d = formatDate(s.date);
                return (
                  <tr key={s.id} className="border-t border-line transition-colors hover:bg-raised">
                    <td className="px-6 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised">
                          <ArrowUpRight weight="bold" className="h-4 w-4 text-ink2" aria-hidden />
                        </span>
                        <span className="truncate text-16 text-ink" title={sendLabel(s)}>{sendLabel(s)}</span>
                      </span>
                    </td>
                    <td className="num px-4 py-3 text-right text-16 font-semibold text-ink">−{formatAmount(s.amount)} USDT</td>
                    <td className="px-4 py-3">
                      <StatusChip status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-col">
                        <span className="num text-16 text-ink">{d.day}</span>
                        <span className="num text-14 text-ink3">{d.time}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="block truncate font-mono text-14 text-ink2">{s.reference}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export function AgentPage() {
  const wallet = useWallet();
  const view = useViewSwitch();
  const [f, setF] = useState<Form>(initialForm);
  const set = (p: Partial<Form>) => setF((cur) => ({ ...cur, ...p }));
  const [listStatus, setListStatus] = useState<ListStatus>(view === 'loading' ? 'loading' : view === 'error' ? 'error' : 'ready');
  const agents = useMemo(() => (view === 'empty' ? [] : view === 'large' ? largeAgents() : AGENTS), [view]);
  const agent = f.agentId ? agents.find((a) => a.id === f.agentId) ?? [...AGENTS, ...largeAgents()].find((a) => a.id === f.agentId) : undefined;

  const fast = useMemo(() => !!f.autoSubmit, []); // eslint-disable-line react-hooks/exhaustive-deps
  const declineOutcome = useMemo(() => readQuery().get('outcome') === 'declined', []);
  const locked = wallet.withdrawLocked;
  const errors = validate(f, wallet.balance);
  const stepErr = stepErrors(f.step, errors);
  const index = STEPS.indexOf(f.step);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Focus moves to the step heading on every step change.
  const shown = useRef(f.step);
  useEffect(() => {
    if (shown.current === f.step) return;
    shown.current = f.step;
    document.getElementById('step-title')?.focus();
  }, [f.step]);

  const retryList = async () => {
    setListStatus('loading');
    await wait(900);
    if (alive.current) setListStatus('ready');
  };

  const next = () => {
    if (stepErr.length) {
      set({ touched: true });
      return;
    }
    set({ step: STEPS[index + 1], touched: false });
  };
  const back = () => set({ step: STEPS[index - 1], touched: false });

  async function submit() {
    const e = validate(f, wallet.balance);
    if (Object.keys(e).length || !f.platformId || !f.agentId) {
      set({ touched: true });
      return;
    }
    const platformId = f.platformId;
    const amount = amountOf(f);
    const id = nextSendId();
    const tick = (ms: number) => (fast ? Promise.resolve() : wait(ms));
    const name = agent?.name ?? 'Agent';
    // Credit leaves the balance at once, as a withdrawal does, and returns if the agent declines.
    const reference = `${platformId.slice(0, 2).toUpperCase()}-${id.slice(-6)}`;
    recordMove(wallet, { id, direction: 'withdraw', label: `Agent ${name}, ${platformById(platformId).name}`, icon: 'agent', amount, status: 'pending', reference });
    addSend({ id, platformId, agentId: f.agentId, agentName: name, amount, status: 'pending', date: new Date().toISOString().slice(0, 19), reference: `${platformId.slice(0, 2).toUpperCase()}-${id.slice(-6)}` });
    set({ step: 'status', txId: id, outcome: 'processing', stage: 0 });
    await tick(900);
    if (!alive.current) return;
    set({ outcome: 'pending', stage: 1 });
    await tick(2200);
    if (!alive.current) return;
    if (declineOutcome) {
      updateSend(id, { status: 'declined' });
      wallet.update(id, { status: 'declined' }, amount);
      set({ outcome: 'declined', stage: 1 });
    } else {
      updateSend(id, { status: 'completed' });
      wallet.update(id, { status: 'completed' });
      set({ outcome: 'completed', stage: 2 });
    }
  }

  // A ?step=status deep link submits once on load.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!f.autoSubmit || autoRan.current) return;
    autoRan.current = true;
    void submit();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => setF({ step: 'method', amount: '', account: f.account, touched: false, stage: 0 });

  const isSubmit = f.step === 'review';
  const body = locked ? (
    <div className="flex flex-col items-start gap-4">
      <LockKey weight="fill" className="h-6 w-6 text-pending" aria-hidden />
      <StepHeading title="Verify your identity to send to an agent" lead="It takes about 2 minutes with a photo ID. Deposits and play are open while you wait." />
      <Button asChild size="lg">
        <Link to="/account">Verify identity</Link>
      </Button>
    </div>
  ) : f.step === 'method' ? (
    <MethodStep f={f} set={set} errors={errors} agents={agents} listStatus={listStatus} retry={retryList} />
  ) : f.step === 'details' ? (
    <DetailsStep f={f} set={set} errors={errors} balance={wallet.balance} agent={agent} />
  ) : f.step === 'review' ? (
    <ReviewStep f={f} agent={agent} />
  ) : (
    <StatusStep
      f={f}
      agent={agent}
      onRetry={() => set({ step: 'review', outcome: undefined, stage: 0 })}
      onPickAnother={() => set({ step: 'method', agentId: undefined, outcome: undefined, stage: 0 })}
      onReset={reset}
    />
  );

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold text-ink">Send to agent</h1>
        <p className="max-w-2xl text-16 text-ink2">
          Move credit from your balance to an agent. The agent loads it onto your account on a partner platform, so you can play there.
        </p>
      </div>
      <div className="grid grid-cols-12 items-start gap-6">
        <Panel label="Send to agent" className="col-span-7">
          {!locked && <Stepper steps={STEPS.map((s) => STEP_LABEL[s])} current={index} />}
          {body}
          {!locked && f.step !== 'status' && (
            <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
              {index > 0 ? (
                <Button variant="quiet" size="lg" onClick={back}>
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button size="lg" onClick={isSubmit ? submit : next}>
                {isSubmit ? 'Confirm send' : 'Continue'}
              </Button>
            </div>
          )}
        </Panel>
        <div className="col-span-5">
          <Summary f={f} agent={agent} balance={wallet.balance} />
        </div>
      </div>
      <SendsTable />
    </div>
  );
}
