'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppStore, type PageId } from '@/lib/store';
import AnimatedBackground from '@/components/finscope/AnimatedBackground';
import Sidebar from '@/components/finscope/Sidebar';
import Header from '@/components/finscope/Header';
import DashboardPanel from '@/components/finscope/DashboardPanel';
import StrategyBuilderPanel from '@/components/finscope/StrategyBuilderPanel';
import BacktestPanel from '@/components/finscope/BacktestPanel';
import ResultsPanel from '@/components/finscope/ResultsPanel';
import {
  ForwardTestPanel,
  PaperTradingPanel,
  OptimizationPanel,
  WalkForwardPanel,
  MonteCarloPanel,
  StressTestPanel,
  ParameterAnalysisPanel,
  StrategyComparisonPanel,
  RiskAnalysisPanel,
  TradeAnalysisPanel,
} from '@/components/finscope/SecondaryPanels';
import {
  ResearchPanel,
  MarketplacePanel,
  MyStrategiesPanel,
  SharedWithMePanel,
  TeamsPanel,
  ChatPanel,
  ReportsPanel,
} from '@/components/finscope/WorkspacePanels';
import { CommandPalette } from '@/components/finscope/CommandPalette';

const pageComponents: Record<PageId, React.ComponentType> = {
  'overview': DashboardPanel,
  'strategy-builder': StrategyBuilderPanel,
  'backtest': BacktestPanel,
  'backtest-results': ResultsPanel,
  'forward-test': ForwardTestPanel,
  'paper-trading': PaperTradingPanel,
  'optimization': OptimizationPanel,
  'walk-forward': WalkForwardPanel,
  'monte-carlo': MonteCarloPanel,
  'stress-test': StressTestPanel,
  'parameter-analysis': ParameterAnalysisPanel,
  'strategy-comparison': StrategyComparisonPanel,
  'risk-analysis': RiskAnalysisPanel,
  'trade-analysis': TradeAnalysisPanel,
  'research': ResearchPanel,
  'marketplace': MarketplacePanel,
  'my-strategies': MyStrategiesPanel,
  'shared-with-me': SharedWithMePanel,
  'teams': TeamsPanel,
  'chat': ChatPanel,
  'reports': ReportsPanel,
};

export default function HomePage() {
  const {
    activePage,
    sidebarCollapsed,
    commandPaletteOpen,
    setCommandPaletteOpen,
    locale,
    strategyBuilderKey,
  } = useAppStore();

  const [isDesktop, setIsDesktop] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Apply RTL/LTR based on locale
  useEffect(() => {
    const dir = locale === 'fa' ? 'rtl' : 'ltr';
    const lang = locale === 'fa' ? 'fa' : 'en';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [locale]);

  const ActivePanel = pageComponents[activePage];
  const sidebarWidth = sidebarCollapsed ? 68 : 260;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#071A2B]">
      <AnimatedBackground />
      <Sidebar />
      <main
        ref={mainRef}
        className="relative z-10 min-h-screen flex flex-col transition-[margin] duration-300"
        style={{
          marginLeft: isDesktop ? sidebarWidth : 0,
        }}
      >
        <Header />
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto scrollbar-thin">
          {ActivePanel && activePage === 'strategy-builder'
            ? <StrategyBuilderPanel key={strategyBuilderKey} />
            : <ActivePanel />
          }
        </div>
        <footer className="mt-auto shrink-0 border-t border-white/[0.06] px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#475569]">
            <p>© {new Date().getFullYear()} FinScope Strategy Lab™ — Educational / Research Use Only</p>
            <p>Past performance does not guarantee future results. This is not financial advice.</p>
          </div>
        </footer>
      </main>
      <CommandPalette />
    </div>
  );
}
