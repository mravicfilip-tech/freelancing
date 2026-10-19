import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { PaymentFlow } from './PaymentFlow';
import { TransactionHistory } from './TransactionHistory';

const TABS = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'tip', label: 'Tip' },
  { value: 'gift-card', label: 'Gift card' },
];

function NotInPrototype({ what }: { what: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6">
      <p className="text-16 text-ink2">{what} are not part of this prototype yet.</p>
    </div>
  );
}

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
            <NotInPrototype what="Tips" />
          </TabsContent>
          <TabsContent value="gift-card" className="pt-6 outline-none">
            <NotInPrototype what="Gift cards" />
          </TabsContent>
        </Tabs>
      </div>
      <TransactionHistory />
    </div>
  );
}
