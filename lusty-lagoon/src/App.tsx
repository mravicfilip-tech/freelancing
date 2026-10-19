import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { TooltipProvider } from './components/ui/Tooltip';
import { WalletProvider } from './features/wallet/store';
import { WalletPage } from './features/wallet/WalletPage';
import { KitPage } from './pages/KitPage';
import { Placeholder } from './pages/Placeholder';

const PLACEHOLDERS = [
  ['lobby', 'Lobby'],
  ['agent', 'Send to agent'],
  ['refer', 'Refer a friend'],
  ['faq', 'FAQ'],
  ['account', 'Account'],
  ['notifications', 'Notifications'],
] as const;

export function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/kit" element={<KitPage />} />
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/wallet/deposit" replace />} />
              <Route path="wallet" element={<Navigate to="/wallet/deposit" replace />} />
              <Route path="wallet/:tab" element={<WalletPage />} />
              {PLACEHOLDERS.map(([path, title]) => (
                <Route key={path} path={path} element={<Placeholder title={title} />} />
              ))}
              <Route path="*" element={<Placeholder title="Page not found" />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
