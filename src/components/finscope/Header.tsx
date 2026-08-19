'use client';

import { Menu, Keyboard, ArrowLeft, Globe } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/lib/i18n';

const pageTitles: Record<string, string> = {
  overview: 'dashboard.title',
  'strategy-builder': 'builder.title',
  backtest: 'backtest.title',
  'forward-test': 'nav.forwardTest',
  'paper-trading': 'nav.paperTrading',
  optimization: 'nav.optimization',
  'walk-forward': 'nav.walkForward',
  'monte-carlo': 'nav.monteCarlo',
  'stress-test': 'nav.stressTest',
  'parameter-analysis': 'nav.parameterAnalysis',
  'strategy-comparison': 'nav.strategyComparison',
  'risk-analysis': 'risk.title',
  'trade-analysis': 'nav.tradeAnalysis',
  research: 'nav.research',
  marketplace: 'marketplace.title',
  'my-strategies': 'nav.myStrategies',
  'shared-with-me': 'nav.sharedWithMe',
  teams: 'nav.teams',
  chat: 'nav.chat',
  reports: 'nav.reports',
};

export default function Header() {
  const {
    activePage,
    sidebarCollapsed,
    toggleSidebar,
    locale,
    setLocale,
    setCommandPaletteOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useAppStore();

  const pageTitle = t(pageTitles[activePage], locale);

  const handleLocaleSwitch = (newLocale: Locale) => {
    setLocale(newLocale);
    if (newLocale === 'fa') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'fa';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between px-4',
        'bg-[rgba(7,26,43,0.8)] backdrop-blur-md',
        'border-b border-[rgba(25,195,125,0.08)]'
      )}
      style={{ marginLeft: undefined, transition: 'margin-left 0.3s ease' }}
    >
      {/* Left: sidebar toggle + page title on mobile */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen(!mobileSidebarOpen);
            } else {
              toggleSidebar();
            }
          }}
          className="text-[#94A3B8] hover:text-[#19C37D] hover:bg-[#19C37D]/10 shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-4" />
        </Button>
        <h1 className="text-sm font-semibold text-[#E2E8F0] tracking-tight truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Back to Finscope.ir */}
        <a
          href="https://finscope.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] font-medium text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#19C37D] transition-all"
          title="Finscope.ir"
        >
          <Globe className="size-3.5" />
          <span className="hidden sm:inline">Finscope.ir</span>
          <ArrowLeft className="size-3 hidden sm:inline" />
        </a>

        {/* Command palette trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="text-[#94A3B8] hover:text-[#19C37D] hover:bg-[#19C37D]/10 gap-1.5"
        >
          <Keyboard className="size-4" />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-[rgba(25,195,125,0.15)] bg-[rgba(25,195,125,0.05)] px-1.5 font-mono text-[10px] font-medium text-[#64748B]">
            ⌘K
          </kbd>
        </Button>

        {/* Language switcher */}
        <div className="flex items-center gap-1">
          <Badge
            className={cn(
              'cursor-pointer select-none text-[11px] font-semibold px-2 py-0.5 transition-all duration-200 border-none',
              locale === 'en'
                ? 'bg-[#19C37D]/20 text-[#19C37D]'
                : 'bg-transparent text-[#64748B] hover:text-[#94A3B8]'
            )}
            onClick={() => handleLocaleSwitch('en')}
          >
            EN
          </Badge>
          <Badge
            className={cn(
              'cursor-pointer select-none text-[11px] font-semibold px-2 py-0.5 transition-all duration-200 border-none',
              locale === 'fa'
                ? 'bg-[#19C37D]/20 text-[#19C37D]'
                : 'bg-transparent text-[#64748B] hover:text-[#94A3B8]'
            )}
            onClick={() => handleLocaleSwitch('fa')}
          >
            فارسی
          </Badge>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="pulse-green relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#19C37D] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#19C37D]" />
          </span>
          <span className="text-[11px] font-medium text-[#64748B] hidden sm:inline">
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
