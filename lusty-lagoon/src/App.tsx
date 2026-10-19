import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import { VariantsIndex } from './features/variants/VariantsIndex';
import { ButtonBoard, SidebarBoard } from './features/variants/boards/Boards';
import { DASHBOARD_VARIANTS } from './features/variants/variants';
import { VariantSwitcher } from './components/dev/VariantSwitcher';
import { lazy, Suspense } from 'react';

// Each dashboard variant brings its own shell, so it sits outside AppShell. Variant 2 was dropped in
// round 4 and the others keep their numbers, so Filip's notes keep their meaning.
const VARIANT_PAGES = [1, 3, 4, 5].map((n) => ({ n, Page: lazy(() => import(`./features/variants/v${n}/Variant${n}.tsx`)) }));

// One switcher for every variant set, per the studio doctrine. It shows only on a route in the list.
function Switcher() {
  return <VariantSwitcher variants={DASHBOARD_VARIANTS} location={useLocation()} navigate={useNavigate()} indexHref="/variants" title="Dashboard" />;
}


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
            <Route path="/variants" element={<VariantsIndex />} />
            <Route path="/variants/buttons" element={<ButtonBoard />} />
            <Route path="/variants/sidebar" element={<SidebarBoard />} />
            {VARIANT_PAGES.map(({ n, Page }) => (
              <Route
                key={n}
                path={`/variants/${n}`}
                element={
                  <Suspense fallback={null}>
                    <Page />
                  </Suspense>
                }
              />
            ))}
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
          <Switcher />
        </TooltipProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
