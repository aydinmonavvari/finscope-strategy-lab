'use client';

import { create } from 'zustand';
import type { Locale } from './i18n';

export type PageId =
  | 'overview'
  | 'strategy-builder'
  | 'backtest'
  | 'backtest-results'
  | 'forward-test'
  | 'paper-trading'
  | 'optimization'
  | 'walk-forward'
  | 'monte-carlo'
  | 'stress-test'
  | 'parameter-analysis'
  | 'strategy-comparison'
  | 'risk-analysis'
  | 'trade-analysis'
  | 'research'
  | 'marketplace'
  | 'my-strategies'
  | 'shared-with-me'
  | 'teams'
  | 'chat'
  | 'reports';

export interface StrategyCondition {
  id: string;
  indicator: string;
  operator: string;
  value: number;
  timeframe: string;
}

export interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: StrategyCondition[];
}

export interface StrategyDefinition {
  entry: {
    operator: 'AND' | 'OR';
    groups: ConditionGroup[];
  };
  exit: {
    operator: 'AND' | 'OR';
    groups: ConditionGroup[];
  };
  stopLoss: { type: 'fixed' | 'atr'; value: number };
  takeProfit: { type: 'fixed' | 'atr'; value: number };
  trailingStop: { enabled: boolean; activation: number; distance: number };
  positionSizing: 'fixed' | 'percent' | 'risk' | 'kelly';
  positionSize: number;
  riskPerTrade: number;
  leverage: number;
  maxPositions: number;
  maxDailyLoss: number;
}

export interface BacktestConfig {
  strategyId: string | null;
  symbol: string;
  exchange: string;
  asset: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  spread: number;
  leverage: number;
  benchmark: string;
  currency: string;
}

export interface Trade {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  direction: 'long' | 'short';
  quantity: number;
  pnl: number;
  pnlPct: number;
  returnR: number;
  mae: number;
  mfe: number;
  holdingBars: number;
  commission: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  cagr: number;
  annualReturn: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  avgR: number;
  expectancy: number;
  profitFactor: number;
  payoffRatio: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  omega: number;
  alpha: number;
  beta: number;
  infoRatio: number;
  volatility: number;
  downsideDev: number;
  maxDrawdown: number;
  avgDrawdown: number;
  recoveryFactor: number;
  ulcerIndex: number;
  riskOfRuin: number;
  var: number;
  cvar: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgHoldingTime: string;
  bestTrade: number;
  worstTrade: number;
  avgTrade: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  metrics: PerformanceMetrics;
  trades: Trade[];
  equityCurve: { date: string; equity: number; benchmark?: number; drawdown: number }[];
  monthlyReturns: { month: string; return: number }[];
  executionTime: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  status: string;
  definition: StrategyDefinition;
  parameters: Record<string, number>;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  backtestCount: number;
  bestSharpe: number | null;
  bestCAGR: number | null;
}

interface AppState {
  // Navigation
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  strategyBuilderKey: number;
  bumpStrategyBuilderKey: () => void;

  // Locale
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Strategies
  strategies: Strategy[];
  setStrategies: (strategies: Strategy[]) => void;
  currentStrategy: Strategy | null;
  setCurrentStrategy: (strategy: Strategy | null) => void;

  // Backtest
  backtestConfig: BacktestConfig;
  setBacktestConfig: (config: Partial<BacktestConfig>) => void;
  backtestResult: BacktestResult | null;
  setBacktestResult: (result: BacktestResult | null) => void;
  backtestRunning: boolean;
  setBacktestRunning: (running: boolean) => void;
  backtestProgress: number;
  setBacktestProgress: (progress: number) => void;
  backtestStage: string;
  setBacktestStage: (stage: string) => void;

  // Command palette
  runCommand: (command: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activePage: 'overview',
  setActivePage: (page) => set({ activePage: page, mobileSidebarOpen: false }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  strategyBuilderKey: 0,
  bumpStrategyBuilderKey: () => set((s) => ({ strategyBuilderKey: s.strategyBuilderKey + 1 })),

  // Locale
  locale: 'en',
  setLocale: (locale) => set({ locale }),

  // Strategies
  strategies: [],
  setStrategies: (strategies) => set({ strategies }),
  currentStrategy: null,
  setCurrentStrategy: (strategy) => set({ currentStrategy: strategy }),

  // Backtest
  backtestConfig: {
    strategyId: null,
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    asset: 'stock',
    timeframe: '1D',
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    initialCapital: 100000,
    commission: 0.1,
    slippage: 0.05,
    spread: 0,
    leverage: 1,
    benchmark: 'SPY',
    currency: 'USD',
  },
  setBacktestConfig: (config) =>
    set((s) => ({ backtestConfig: { ...s.backtestConfig, ...config } })),
  backtestResult: null,
  setBacktestResult: (result) => set({ backtestResult: result }),
  backtestRunning: false,
  setBacktestRunning: (running) => set({ backtestRunning: running }),
  backtestProgress: 0,
  setBacktestProgress: (progress) => set({ backtestProgress: progress }),
  backtestStage: '',
  setBacktestStage: (stage) => set({ backtestStage: stage }),

  // Command palette
  runCommand: (command) => {
    const pages: Record<string, PageId> = {
      'nav.overview': 'overview',
      'nav.strategyBuilder': 'strategy-builder',
      'nav.backtest': 'backtest',
      'nav.forwardTest': 'forward-test',
      'nav.paperTrading': 'paper-trading',
      'nav.optimization': 'optimization',
      'nav.walkForward': 'walk-forward',
      'nav.monteCarlo': 'monte-carlo',
      'nav.stressTest': 'stress-test',
      'nav.parameterAnalysis': 'parameter-analysis',
      'nav.strategyComparison': 'strategy-comparison',
      'nav.riskAnalysis': 'risk-analysis',
      'nav.tradeAnalysis': 'trade-analysis',
      'nav.research': 'research',
      'nav.marketplace': 'marketplace',
      'nav.myStrategies': 'my-strategies',
      'nav.sharedWithMe': 'shared-with-me',
      'nav.teams': 'teams',
      'nav.chat': 'chat',
      'nav.reports': 'reports',
    };
    const pageId = pages[command];
    if (pageId) {
      set({ activePage: pageId, commandPaletteOpen: false, mobileSidebarOpen: false });
    }
  },
}));
