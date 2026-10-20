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
import { DASHBOARD_VARIANTS, V1_OPTION_SETS } from './features/variants/variants';
import { VariantSwitcher } from './components/dev/VariantSwitcher';
import { lazy, Suspense, useEffect, useState } from 'react';

// Each dashboard variant brings its own shell, so it sits outside AppShell. Round 6 keeps three
// directions, 1, 2 and 5. Variants 3 and 4 were dropped and the rest keep their numbers.
const VARIANT_PAGES = [1, 2, 5].map((n) => ({ n, Page: lazy(() => import(`./features/variants/v${n}/Variant${n}.tsx`)) }));

// One switcher for every variant set, per the studio doctrine. It shows only on a route in the list.
// On /variants/1 the round 8 choices replace it, one stacked bar per set (variants.ts, V1_OPTION_SETS).
function Switcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = usePhone();
  if (location.pathname !== '/variants/1') return <VariantSwitcher variants={DASHBOARD_VARIANTS} location={location} navigate={navigate} indexHref="/variants" title="Dashboard" />;
  // A missing value counts as its set's fallback, so the bare URL still shows the bars.
  const now = new URLSearchParams(location.search);
  for (const set of V1_OPTION_SETS) if (!now.has(set.param)) now.set(set.param, set.fallback);
  const shown = (phone ? ['m', 'hero'] : ['hero', 'cards']).map((p) => V1_OPTION_SETS.find((set) => set.param === p)!);
  return (
    <>
      {shown.map((set, i) => (
        <VariantSwitcher
          key={set.param}
          variants={set.options.map((o) => {
            const q = new URLSearchParams(now);
            q.set(set.param, o.value);
            return { key: String(set.options.indexOf(o) + (set.options[0].value === '0' ? 0 : 1)), short: o.short, label: o.label, note: o.note, href: `/variants/1?${q}` };
          })}
          location={{ pathname: location.pathname, search: `?${now}` }}
          navigate={navigate}
          indexHref={i === 0 ? '/variants' : undefined}
          title={set.title}
          bottom={(phone ? 104 : 16) + i * 56}
          keyboard={i === 0}
        />
      ))}
    </>
  );
}

/** True under 768px wide, where variant 1 renders its phone shell. */
function usePhone() {
  const query = '(max-width: 767px)';
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setPhone(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return phone;
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
