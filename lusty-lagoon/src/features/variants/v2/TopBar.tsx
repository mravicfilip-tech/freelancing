import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../wallet/store';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { BalancePill, Box } from '../kit/parts';
import { BellSquare, SearchBox, UserBox } from '../kit/TopParts';
import { LIVE_WINS } from '../shared/data';

// The top bar, Grimdrop's row in kit boxes. A live count box and the search on the left, the
// balance with Deposit in the middle, the bell and the account box over the right column.

export function TopBar({ query, onQuery, onSearch }: { query: string; onQuery: (q: string) => void; onSearch: () => void }) {
  const navigate = useNavigate();
  const { balance } = useWallet();
  return (
    <header className="sticky top-0 z-10 flex h-[84px] items-center gap-3 bg-page pr-4">
      <Box className="shrink-0 gap-3 pl-4 pr-2">
        <span aria-hidden className="h-[10px] w-[10px] rounded-full bg-[#3DDC84] ring-4 ring-[#3DDC84]/20" />
        <span className="text-16 font-bold text-ink">Live wins</span>
        <span className="num flex h-9 items-center rounded-[10px] bg-black/25 px-3 text-14 font-semibold text-[rgb(var(--k-muted))]">
          <span className="mr-1 text-[#C9A2FF]">{LIVE_WINS.length}</span> in the last 15 minutes
        </span>
      </Box>
      <SearchBox id="v2-top-search" value={query} onChange={onQuery} onSubmit={onSearch} className="w-[340px] shrink-0" />
      <div className="ml-auto flex items-center gap-3">
        <BalancePill amount={formatAmount(balance)} currency={ACCOUNT.currency} onDeposit={() => navigate('/wallet/deposit')} depositLabel="Deposit" />
        <BellSquare />
        <UserBox />
      </div>
    </header>
  );
}
