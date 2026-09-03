import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Drawer } from '../common/Drawer';
import { SidebarNav } from './SidebarNav';
import { TopMacroBar } from './TopMacroBar';
import { DesktopUpdateIndicator } from './DesktopUpdateIndicator';
import { ThemeToggle } from '../theme/ThemeToggle';
import { UiLanguageToggle } from '../i18n/UiLanguageToggle';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import { cn } from '../../utils/cn';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useUiLanguage();

  useEffect(() => {
    if (!mobileOpen) return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-surface-dark text-foreground flex flex-col font-sans antialiased selection:bg-accent-long/20 selection:text-accent-long">
      {/* Persistent Top Macro Strip (h-10 fixed at top) */}
      <TopMacroBar />

      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop Left Command Rail (w-16 hover:w-56 transition-all duration-200 z-30) */}
        <aside
          className="sticky top-10 z-30 hidden lg:flex flex-col shrink-0 border-r border-border-subtle bg-card-dark backdrop-blur-md transition-all duration-200 h-[calc(100vh-2.5rem)] select-none w-16 hover:w-56 p-2 group/sidebar overflow-hidden"
          aria-label={t('layout.desktopSidebar')}
        >
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <SidebarNav
              variant="rail"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 flex flex-col min-h-0 bg-surface-dark">
          {/* Mobile Top Bar Controls */}
          <div className="flex lg:hidden items-center justify-between px-3 py-2 border-b border-border-subtle bg-card-dark/80">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-border-subtle bg-surface-dark text-secondary-text hover:text-foreground"
              aria-label={t('layout.openNav')}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <DesktopUpdateIndicator />
              <UiLanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Page Outlet */}
          <div className="flex-1 p-3 sm:p-4 lg:p-5 max-w-[1720px] w-full mx-auto">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title={t('layout.navMenu')}
        width="max-w-xs"
        zIndex={90}
        side="left"
      >
        <div className="p-2 bg-card-dark h-full">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </div>
      </Drawer>
    </div>
  );
};
