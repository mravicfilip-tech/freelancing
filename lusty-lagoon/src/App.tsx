import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { TooltipProvider } from './components/ui/Tooltip';
import { WalletProvider } from './features/wallet/store';
import { WalletPage } from './features/wallet/WalletPage';
import { KitPage } from './pages/KitPage';
import { LandingPage } from './features/landing/LandingPage';
import { FaqPage } from './features/faq/FaqPage';
import { LobbyPage } from './features/lobby/LobbyPage';
import { LoginPage, RegisterPage } from './features/auth';
import { AccountPage, NotificationsPage } from './features/account';
import { AgentPage, ReferPage } from './features/money';
import { NotFound } from './pages/NotFound';


export function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/kit" element={<KitPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<AppShell />}>
              <Route path="faq" element={<FaqPage />} />
              <Route path="lobby" element={<LobbyPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="agent" element={<AgentPage />} />
              <Route path="refer" element={<ReferPage />} />
              <Route path="wallet" element={<Navigate to="/wallet/deposit" replace />} />
              <Route path="wallet/:tab" element={<WalletPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
