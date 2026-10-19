import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="flex-1 px-[var(--bl-page-pad)] pb-16 pt-8">
          <div className="mx-auto w-full max-w-canvas">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
