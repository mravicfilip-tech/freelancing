import {
  ACCOUNT,
  cashById,
  cashFee,
  checkAddress,
  coinById,
  type CashMethodId,
  type CoinId,
  type Direction,
  type Selection,
} from '../../data/wallet';

// One state machine for the four paths, deposit or withdraw, by coin or by cash method.
//
//   deposit coin     Method, Send, Status
//   deposit cash     Method, Amount, Review, Status
//   withdraw coin    Method, Details, Review, Status
//   withdraw cash    Method, Details, Review, Status

export type StepId = 'method' | 'send' | 'amount' | 'details' | 'review' | 'status';
export type Outcome = 'processing' | 'pending' | 'completed' | 'declined';

export type FlowState = {
  direction: Direction;
  step: StepId;
  selection?: Selection;
  networkId?: string;
  amount: string;
  address: string;
  memo: string;
  paypalEmail: string;
  iban: string;
  holder: string;
  card: { number: string; expiry: string; cvc: string };
  touched: boolean;
  txId?: string;
  outcome?: Outcome;
  /** Index of the last finished stage in the status timeline. */
  stage: number;
  /** Confirmations seen so far on a coin deposit. */
  confirms: number;
  /** The amount the simulated chain saw on a coin deposit. */
  received?: number;
  /** Set by a ?step=status deep link, which runs the flow to its end on load. */
  autoSubmit?: boolean;
};

export function stepsFor(direction: Direction, sel?: Selection): StepId[] {
  if (direction === 'deposit') return sel?.kind === 'coin' ? ['method', 'send', 'status'] : ['method', 'amount', 'review', 'status'];
  return ['method', 'details', 'review', 'status'];
}

export const STEP_LABEL: Record<StepId, string> = {
  method: 'Method',
  send: 'Send',
  amount: 'Amount',
  details: 'Details',
  review: 'Review',
  status: 'Status',
};

export function initialState(direction: Direction, q: URLSearchParams): FlowState {
  const base: FlowState = {
    direction,
    step: 'method',
    amount: '',
    address: '',
    memo: '',
    paypalEmail: ACCOUNT.paypalEmail,
    iban: '',
    holder: 'John Doe',
    card: { number: '', expiry: '', cvc: '' },
    touched: false,
    stage: 0,
    confirms: 0,
  };
  // Deep links for the case study shots, for example ?pick=usdt&step=send or ?pick=visa&amount=100&step=review.
  const pick = q.get('pick');
  if (!pick) return base;
  const coin = (['btc', 'eth', 'usdt', 'usdc', 'ltc', 'xrp', 'trx', 'doge'] as CoinId[]).find((c) => c === pick);
  const cash = (['mastercard', 'visa', 'paypal', 'wire'] as CashMethodId[]).find((c) => c === pick);
  const selection: Selection | undefined = coin ? { kind: 'coin', coinId: coin } : cash ? { kind: 'cash', methodId: cash } : undefined;
  if (!selection) return base;
  const steps = stepsFor(direction, selection);
  const want = q.get('step') as StepId | null;
  return {
    ...base,
    selection,
    networkId: coin ? (q.get('network') ?? coinById(coin).networks[0].id) : undefined,
    amount: q.get('amount') ?? '',
    address: q.get('address') ?? '',
    step: want === 'status' ? steps[steps.length - 2] : want && steps.includes(want) ? want : steps[1],
    autoSubmit: want === 'status',
  };
}

export type Action =
  | { type: 'select'; selection: Selection }
  | { type: 'network'; networkId: string }
  | { type: 'field'; key: 'amount' | 'address' | 'memo' | 'paypalEmail' | 'iban' | 'holder'; value: string }
  | { type: 'card'; key: 'number' | 'expiry' | 'cvc'; value: string }
  | { type: 'go'; step: StepId }
  | { type: 'touch' }
  | { type: 'submit'; txId: string; outcome: Outcome; received?: number }
  | { type: 'stage'; stage: number; outcome?: Outcome; confirms?: number }
  | { type: 'reset' };

export function reducer(s: FlowState, a: Action): FlowState {
  switch (a.type) {
    case 'select': {
      const networkId = a.selection.kind === 'coin' ? coinById(a.selection.coinId).networks[0].id : undefined;
      return { ...s, selection: a.selection, networkId, amount: '', address: '', memo: '', touched: false };
    }
    case 'network':
      return { ...s, networkId: a.networkId, touched: false };
    case 'field':
      return { ...s, [a.key]: a.value };
    case 'card':
      return { ...s, card: { ...s.card, [a.key]: a.value } };
    case 'go':
      return { ...s, step: a.step, touched: false };
    case 'touch':
      return { ...s, touched: true };
    case 'submit':
      return { ...s, step: 'status', txId: a.txId, outcome: a.outcome, received: a.received, stage: 0, confirms: 0 };
    case 'stage':
      return { ...s, stage: a.stage, outcome: a.outcome ?? s.outcome, confirms: a.confirms ?? s.confirms };
    case 'reset':
      return { ...initialState(s.direction, new URLSearchParams()) };
  }
}

// Numbers for the summary column and the checks, worked out in one place.

export type Quote = {
  amount: number;
  fee: number;
  /** What lands, in the unit named by receiveUnit. */
  receive: number;
  receiveUnit: string;
  feeLabel: string;
  coinAmount?: number;
  min: number;
  max: number;
};

const num = (v: string) => {
  const n = Number(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

export function quote(s: FlowState, balance: number): Quote | null {
  if (!s.selection) return null;
  const amount = num(s.amount);
  if (s.selection.kind === 'cash') {
    const m = cashById(s.selection.methodId);
    const fee = Number.isFinite(amount) ? cashFee(m, amount) : 0;
    const feeLabel = m.flatFee ? `Flat fee` : `Fee, ${m.feePct}%`;
    if (s.direction === 'deposit') {
      return { amount, fee, receive: amount - fee, receiveUnit: 'USDT', feeLabel, min: m.min, max: m.max };
    }
    return { amount, fee, receive: amount - fee, receiveUnit: 'USD', feeLabel, min: m.min, max: Math.min(m.max, balance) };
  }
  const coin = coinById(s.selection.coinId);
  const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
  const coinAmount = amount / coin.rate;
  return {
    amount,
    fee: net.withdrawFee,
    receive: coinAmount - net.withdrawFee,
    receiveUnit: coin.symbol,
    feeLabel: 'Network fee',
    coinAmount,
    min: Math.ceil(coin.minWithdraw * coin.rate),
    max: balance,
  };
}

export type Errors = Partial<Record<'selection' | 'amount' | 'address' | 'paypalEmail' | 'iban' | 'holder' | 'number' | 'expiry' | 'cvc', string>>;

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

export function validate(s: FlowState, balance: number): Errors {
  const e: Errors = {};
  if (s.step === 'method') {
    if (!s.selection) e.selection = s.direction === 'deposit' ? 'Pick a coin or a payment method to deposit with.' : 'Pick where you want the money to go.';
    return e;
  }
  const q = quote(s, balance);
  const needsAmount = s.step === 'amount' || s.step === 'details';
  if (needsAmount && q) {
    const unit = s.selection?.kind === 'cash' && s.direction === 'deposit' ? '$' : '';
    const tail = s.selection?.kind === 'cash' && s.direction === 'deposit' ? '' : ' USDT';
    if (!s.amount.trim()) e.amount = 'Enter an amount.';
    else if (!Number.isFinite(q.amount) || q.amount <= 0) e.amount = 'Enter the amount as a number, like 100.';
    else if (s.direction === 'withdraw' && q.amount > balance) e.amount = `That is more than your balance of ${fmt(balance)} USDT.`;
    else if (q.amount < q.min) e.amount = `The minimum is ${unit}${fmt(q.min)}${tail}.`;
    else if (q.amount > q.max) e.amount = `The maximum is ${unit}${fmt(q.max)}${tail}.`;
    else if (q.receive <= 0) e.amount = 'After the fee nothing would arrive. Enter a larger amount.';
  }
  if (s.step === 'details' && s.selection?.kind === 'coin') {
    const coin = coinById(s.selection.coinId);
    const net = coin.networks.find((n) => n.id === s.networkId) ?? coin.networks[0];
    const check = checkAddress(s.address, net);
    if (!check.ok) e.address = check.message;
  }
  if (s.step === 'details' && s.selection?.kind === 'cash') {
    const id = s.selection.methodId;
    if (id === 'paypal' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.paypalEmail.trim())) e.paypalEmail = 'Enter the email address of your PayPal account.';
    if (id === 'wire') {
      if (s.iban.replace(/\s/g, '').length < 15 || !/^[A-Z]{2}\d{2}[A-Z0-9 ]+$/i.test(s.iban.trim())) e.iban = 'Enter a full IBAN, starting with the country code, like DE89 3704 0044 0532 0130 00.';
      if (!s.holder.trim()) e.holder = 'Enter the name on the bank account.';
    }
  }
  if (s.step === 'review' && s.direction === 'deposit' && s.selection?.kind === 'cash' && s.selection.methodId === 'mastercard') {
    const digits = s.card.number.replace(/\D/g, '');
    if (digits.length !== 16 || !luhn(digits)) e.number = 'Check the card number. It has 16 digits.';
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(s.card.expiry.trim());
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) e.expiry = 'Enter the expiry date as MM/YY.';
    else if (new Date(2000 + Number(m[2]), Number(m[1])) < new Date()) e.expiry = 'This card has expired.';
    if (!/^\d{3}$/.test(s.card.cvc.trim())) e.cvc = 'Enter the 3 digits on the back of the card.';
  }
  return e;
}

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
