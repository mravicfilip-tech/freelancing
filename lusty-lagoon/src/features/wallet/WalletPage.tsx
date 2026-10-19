import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { PaymentFlow } from './PaymentFlow';
import { TransactionHistory } from './TransactionHistory';
import { GiftCardsPanel, TipPanel } from '../money';

const TABS = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'tip', label: 'Tip' },
  { value: 'gift-card', label: 'Gift card' },
];

export function WalletPage() {
  const { tab = 'deposit' } = useParams();
  const navigate = useNavigate();
  const current = TABS.some((t) => t.value === tab) ? tab : 'deposit';
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-32 font-semibold text-ink">Wallet</h1>
        <Tabs value={current} onValueChange={(v) => navigate(`/wallet/${v}`)}>
          <TabsList aria-label="Wallet">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="deposit" className="pt-6 outline-none">
            <PaymentFlow key="deposit" direction="deposit" />
          </TabsContent>
          <TabsContent value="withdraw" className="pt-6 outline-none">
            <PaymentFlow key="withdraw" direction="withdraw" />
          </TabsContent>
          <TabsContent value="tip" className="pt-6 outline-none">
            <TipPanel />
          </TabsContent>
          <TabsContent value="gift-card" className="pt-6 outline-none">
            <GiftCardsPanel />
          </TabsContent>
        </Tabs>
      </div>
      <TransactionHistory />
    </div>
  );
}
