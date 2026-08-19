'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Store,
  FolderOpen,
  Share2,
  Users,
  MessageSquare,
  FileText,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Download,
  Upload,
  Send,
  Search,
  Star,
  TrendingUp,
  ShieldCheck,
  Crown,
  ChevronRight,
  Hash,
  Clock,
  User,
  FileDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Shared Constants
// ═══════════════════════════════════════════════════════════════

const GLASS = 'rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl';
const NEON = '#19C37D';

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { type: 'spring' as const, stiffness: 100, delay },
});

function Disclaimer() {
  const locale = useAppStore((s) => s.locale);
  return (
    <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div>
        <p className="text-xs font-medium text-amber-400">{t('common.perspective', locale)}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{t('common.disclaimer', locale)}</p>
      </div>
    </div>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${NEON}15` }}>
        <Icon className="h-5 w-5" style={{ color: NEON }} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. ResearchPanel
// ═══════════════════════════════════════════════════════════════

export function ResearchPanel() {
  const locale = useAppStore((s) => s.locale);
  const [selectedTopic, setSelectedTopic] = useState(0);

  const topics = [
    {
      id: 1,
      title: 'EMA Crossover Optimization on Tech Stocks',
      status: 'in-progress',
      date: 'Dec 15, 2024',
      notes: 'Testing EMA(8,21) vs EMA(12,26) on AAPL, MSFT, GOOGL over 3-year period. Initial results show EMA(12,26) produces higher Sharpe (2.1 vs 1.8) but lower total return. Need to investigate the impact of transaction costs on shorter-period crossover strategies.',
      tags: ['Trend Following', 'EMA', 'Tech'],
    },
    {
      id: 2,
      title: 'Volatility Regime Detection for Position Sizing',
      status: 'completed',
      date: 'Dec 10, 2024',
      notes: 'Explored using VIX percentile + ATR ratio to detect high/low volatility regimes. In high-vol regimes, reducing position size by 40% improves max DD from -18% to -11% while only sacrificing 3% CAGR. Ready for integration into live framework.',
      tags: ['Volatility', 'Risk Mgmt', 'VIX'],
    },
    {
      id: 3,
      title: 'Momentum Factor Decay Analysis',
      status: 'in-progress',
      date: 'Dec 8, 2024',
      notes: 'Analyzing how quickly 12-month momentum signals decay across different market cap segments. Large caps show slower decay (avg 45 days) vs small caps (avg 22 days). This has implications for rebalancing frequency.',
      tags: ['Momentum', 'Factor Investing'],
    },
    {
      id: 4,
      title: 'Correlation Breakdown During Market Crises',
      status: 'draft',
      date: 'Dec 5, 2024',
      notes: 'Hypothesis: Asset correlations converge to 1.0 during market stress events, reducing diversification benefits. Plan to analyze correlation matrices during 2020 crash, 2022 rate hikes, and historical drawdowns.',
      tags: ['Correlation', 'Risk', 'Portfolio'],
    },
    {
      id: 5,
      title: 'Machine Learning Feature Importance for Entry Signals',
      status: 'draft',
      date: 'Dec 1, 2024',
      notes: 'Testing which technical features (RSI, MACD, ATR, volume ratio, etc.) have the highest predictive power for next-day returns using random forest feature importance. Preliminary results show volume-related features rank highest.',
      tags: ['ML', 'Features', 'Entry Signals'],
    },
  ];

  const dataSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ', 'IWM', 'GLD', 'TLT', 'EURUSD', 'BTCUSD', 'ES futures'];

  const statusColors: Record<string, string> = {
    'in-progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    draft: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const current = topics[selectedTopic];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={FlaskConical} title={t('nav.research', locale)} />

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div {...anim(0.1)} className={cn(GLASS, 'flex flex-col p-5 lg:col-span-1')}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Topics</h3>
            <Button size="sm" variant="outline" className="h-7 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
              <Plus className="mr-1 h-3 w-3" /> New
            </Button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-96">
            {topics.map((topic, idx) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(idx)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-all',
                  idx === selectedTopic
                    ? 'border-white/[0.15] bg-white/[0.06]'
                    : 'border-white/[0.06] bg-transparent hover:bg-white/[0.03]'
                )}
              >
                <p className="text-sm font-medium text-white leading-tight">{topic.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px] border', statusColors[topic.status])}>{topic.status}</Badge>
                  <span className="text-[10px] text-slate-500">{topic.date}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div {...anim(0.15)} className={cn(GLASS, 'flex flex-col p-5 lg:col-span-2')}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{current.title}</h3>
            <Badge variant="outline" className={cn('text-[10px] border', statusColors[current.status])}>{current.status}</Badge>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {current.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-white/10 bg-white/5 text-[10px] text-slate-300">{tag}</Badge>
            ))}
          </div>
          <Separator className="mb-4 bg-white/[0.06]" />
          <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm leading-relaxed text-slate-300">{current.notes}</p>
          </div>
        </motion.div>
      </div>

      <motion.div {...anim(0.2)} className={cn(GLASS, 'p-4')}>
        <div className="mb-3 flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-400">Data Browser</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {dataSymbols.map((sym) => (
            <button key={sym} className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white">
              {sym}
            </button>
          ))}
        </div>
      </motion.div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. MarketplacePanel
// ═══════════════════════════════════════════════════════════════

export function MarketplacePanel() {
  const locale = useAppStore((s) => s.locale);
  const [activeTab, setActiveTab] = useState('popular');

  const strategies = [
    { name: 'Alpha Momentum Pro', author: 'QuantLab', type: 'Momentum', sharpe: 2.45, cagr: '32.1%', winRate: '64.2%', followers: 1247, trending: true },
    { name: 'Volatility Harvest', author: 'RiskEdge', type: 'Volatility', sharpe: 2.18, cagr: '24.7%', winRate: '58.9%', followers: 892, trending: true },
    { name: 'Mean Reversion Elite', author: 'StatTrader', type: 'Mean Reversion', sharpe: 1.95, cagr: '19.3%', winRate: '62.1%', followers: 2103, trending: false },
    { name: 'Breakout System X', author: 'TrendKing', type: 'Breakout', sharpe: 1.72, cagr: '28.5%', winRate: '51.3%', followers: 654, trending: false },
    { name: 'Pairs Arbitrage+', author: 'ArbDesk', type: 'Stat Arb', sharpe: 2.87, cagr: '15.4%', winRate: '71.8%', followers: 431, trending: true },
    { name: 'Adaptive Trend v3', author: 'AlgoForge', type: 'Trend Following', sharpe: 2.03, cagr: '22.8%', winRate: '56.7%', followers: 1568, trending: false },
  ];

  const tabs = [
    { key: 'popular', label: t('marketplace.popular', locale) },
    { key: 'trending', label: t('marketplace.trending', locale) },
    { key: 'robust', label: t('marketplace.topRobust', locale) },
    { key: 'sharpe', label: t('marketplace.topSharpe', locale) },
    { key: 'lowrisk', label: t('marketplace.topLowRisk', locale) },
  ];

  const filtered = useMemo(() => {
    if (activeTab === 'trending') return strategies.filter((s) => s.trending);
    if (activeTab === 'sharpe') return [...strategies].sort((a, b) => b.sharpe - a.sharpe);
    if (activeTab === 'lowrisk') return [...strategies].sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
    if (activeTab === 'robust') return [...strategies].sort((a, b) => b.followers - a.followers);
    return strategies;
  }, [activeTab, strategies]);

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Store} title={t('nav.marketplace', locale)} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'shrink-0 rounded-lg border px-4 py-2 text-xs font-medium transition-all',
              activeTab === tab.key
                ? 'border-[#19C37D]/40 bg-[#19C37D]/15 text-[#19C37D]'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s, i) => (
          <motion.div key={s.name} {...anim(i * 0.06)} className={cn(GLASS, 'flex flex-col p-5')}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                <p className="text-[11px] text-slate-500">by {s.author}</p>
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] text-slate-300">{s.type}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-center">
                <p className="text-[10px] text-slate-500">Sharpe</p>
                <p className="text-sm font-bold text-emerald-400">{s.sharpe}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">CAGR</p>
                <p className="text-sm font-bold text-white">{s.cagr}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">Win Rate</p>
                <p className="text-sm font-bold text-white">{s.winRate}</p>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Users className="h-3 w-3" /> {s.followers.toLocaleString()} followers
              </div>
              <Button size="sm" variant="outline" className="h-7 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
                <Eye className="mr-1 h-3 w-3" /> {t('common.view', locale)}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. MyStrategiesPanel
// ═══════════════════════════════════════════════════════════════

export function MyStrategiesPanel() {
  const locale = useAppStore((s) => s.locale);

  const myStrategies = [
    { name: 'Momentum EMA Cross', type: 'Momentum', status: 'active', lastBacktest: 'Dec 15, 2024', sharpe: 2.34, cagr: '18.7%', maxDD: '-8.3%' },
    { name: 'Mean Reversion BB', type: 'Mean Reversion', status: 'draft', lastBacktest: 'Dec 12, 2024', sharpe: 1.89, cagr: '14.2%', maxDD: '-12.7%' },
    { name: 'Breakout ATR v2', type: 'Breakout', status: 'active', lastBacktest: 'Dec 10, 2024', sharpe: 1.56, cagr: '24.3%', maxDD: '-22.4%' },
    { name: 'RSI Divergence Hunt', type: 'Mean Reversion', status: 'archived', lastBacktest: 'Nov 28, 2024', sharpe: 1.72, cagr: '11.5%', maxDD: '-10.1%' },
    { name: 'Volume Profile S/R', type: 'Custom', status: 'active', lastBacktest: 'Dec 14, 2024', sharpe: 2.01, cagr: '20.8%', maxDD: '-14.2%' },
  ];

  const statusBadge: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    draft: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    archived: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={FolderOpen} title={t('nav.myStrategies', locale)} />

      <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">My Strategies ({myStrategies.length})</h3>
          <Button size="sm" style={{ background: NEON }} className="h-8 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('builder.newStrategy', locale)}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-left text-xs font-medium text-slate-400">{t('common.name', locale)}</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-400">{t('common.type', locale)}</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-400">{t('common.status', locale)}</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-400">Last Backtest</th>
                <th className="pb-3 text-right text-xs font-medium text-slate-400">Sharpe</th>
                <th className="pb-3 text-right text-xs font-medium text-slate-400">CAGR</th>
                <th className="pb-3 text-right text-xs font-medium text-slate-400">Max DD</th>
                <th className="pb-3 text-right text-xs font-medium text-slate-400">{t('common.actions', locale)}</th>
              </tr>
            </thead>
            <tbody>
              {myStrategies.map((s) => (
                <tr key={s.name} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-3 font-medium text-white">{s.name}</td>
                  <td className="py-3 text-slate-400">{s.type}</td>
                  <td className="py-3">
                    <Badge variant="outline" className={cn('text-[10px] capitalize border', statusBadge[s.status])}>{s.status}</Badge>
                  </td>
                  <td className="py-3 text-slate-400">{s.lastBacktest}</td>
                  <td className="py-3 text-right font-medium text-emerald-400">{s.sharpe}</td>
                  <td className="py-3 text-right text-white">{s.cagr}</td>
                  <td className="py-3 text-right text-red-400">{s.maxDD}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. SharedWithMePanel
// ═══════════════════════════════════════════════════════════════

export function SharedWithMePanel() {
  const locale = useAppStore((s) => s.locale);

  const sharedStrategies = [
    { name: 'Quantum Trend System', sharedBy: 'Alex Chen', sharedDate: 'Dec 14, 2024', type: 'Trend Following', sharpe: 2.12, cagr: '21.4%', maxDD: '-11.8%', avatar: 'AC', avatarColor: '#19C37D' },
    { name: 'Volatility Squeeze Play', sharedBy: 'Sarah Kim', sharedDate: 'Dec 12, 2024', type: 'Volatility', sharpe: 1.95, cagr: '17.8%', maxDD: '-9.5%', avatar: 'SK', avatarColor: '#A78BFA' },
    { name: 'Momentum Factor Alpha', sharedBy: 'James Wilson', sharedDate: 'Dec 8, 2024', type: 'Momentum', sharpe: 2.45, cagr: '28.9%', maxDD: '-15.2%', avatar: 'JW', avatarColor: '#FBBF24' },
  ];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Share2} title={t('nav.sharedWithMe', locale)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sharedStrategies.map((s, i) => (
          <motion.div key={s.name} {...anim(i * 0.08)} className={cn(GLASS, 'flex flex-col p-5')}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: s.avatarColor }}
              >
                {s.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">{s.name}</h3>
                <p className="text-[11px] text-slate-500">by {s.sharedBy} · {s.sharedDate}</p>
              </div>
            </div>
            <Badge variant="outline" className="mb-3 w-fit border-white/10 bg-white/5 text-[10px] text-slate-300">{s.type}</Badge>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="text-center">
                <p className="text-[10px] text-slate-500">Sharpe</p>
                <p className="text-xs font-bold text-emerald-400">{s.sharpe}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">CAGR</p>
                <p className="text-xs font-bold text-white">{s.cagr}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">Max DD</p>
                <p className="text-xs font-bold text-red-400">{s.maxDD}</p>
              </div>
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <Button size="sm" variant="outline" className="h-7 flex-1 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
                <Eye className="mr-1 h-3 w-3" /> {t('common.view', locale)}
              </Button>
              <Button size="sm" variant="outline" className="h-7 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
                <Copy className="mr-1 h-3 w-3" /> {t('common.clone', locale)}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. TeamsPanel
// ═══════════════════════════════════════════════════════════════

export function TeamsPanel() {
  const locale = useAppStore((s) => s.locale);
  const [selectedTeam, setSelectedTeam] = useState(0);

  const teams = [
    {
      name: 'Alpha Research Group',
      memberCount: 8,
      strategies: 24,
      avatarColors: ['#19C37D', '#22D3EE', '#FBBF24', '#A78BFA', '#F87171', '#FB923C', '#34D399', '#60A5FA'],
      initials: ['AC', 'SK', 'JW', 'LP', 'MR', 'DT', 'KN', 'RB'],
      roles: [
        { name: 'Alex Chen', role: 'Admin', initials: 'AC', color: '#19C37D' },
        { name: 'Sarah Kim', role: 'Editor', initials: 'SK', color: '#22D3EE' },
        { name: 'James Wilson', role: 'Editor', initials: 'JW', color: '#FBBF24' },
        { name: 'Laura Park', role: 'Viewer', initials: 'LP', color: '#A78BFA' },
        { name: 'Mike Ross', role: 'Viewer', initials: 'MR', color: '#F87171' },
      ],
    },
    {
      name: 'Risk Analysis Team',
      memberCount: 5,
      strategies: 12,
      avatarColors: ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#C084FC'],
      initials: ['DT', 'KN', 'RB', 'PS', 'AJ'],
      roles: [
        { name: 'David Torres', role: 'Admin', initials: 'DT', color: '#F87171' },
        { name: 'Kate Nguyen', role: 'Editor', initials: 'KN', color: '#FBBF24' },
        { name: 'Ryan Brown', role: 'Editor', initials: 'RB', color: '#34D399' },
        { name: 'Patricia Sun', role: 'Viewer', initials: 'PS', color: '#60A5FA' },
      ],
    },
  ];

  const team = teams[selectedTeam];

  const roleColors: Record<string, string> = {
    Admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Editor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    Viewer: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Users} title={t('nav.teams', locale)} />

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div {...anim(0.1)} className={cn(GLASS, 'flex flex-col p-5 lg:col-span-1')}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Teams</h3>
            <Button size="sm" style={{ background: NEON }} className="h-7 text-xs">
              <Plus className="mr-1 h-3 w-3" /> {t('common.create', locale)} Team
            </Button>
          </div>
          <div className="flex-1 space-y-3">
            {teams.map((tm, idx) => (
              <button
                key={tm.name}
                onClick={() => setSelectedTeam(idx)}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition-all',
                  idx === selectedTeam
                    ? 'border-white/[0.15] bg-white/[0.06]'
                    : 'border-white/[0.06] bg-transparent hover:bg-white/[0.03]'
                )}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">{tm.name}</h4>
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] text-slate-400">{tm.strategies} strategies</Badge>
                </div>
                <div className="mt-3 flex items-center">
                  <div className="flex -space-x-2">
                    {tm.avatarColors.slice(0, 5).map((c, ci) => (
                      <div key={ci} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#071A2B] text-[9px] font-bold text-white" style={{ background: c }}>
                        {tm.initials[ci]}
                      </div>
                    ))}
                    {tm.memberCount > 5 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#071A2B] bg-white/10 text-[9px] font-medium text-slate-400">
                        +{tm.memberCount - 5}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-3 border-white/10 bg-white/5 text-[10px] text-slate-400">
                    {tm.memberCount} members
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div {...anim(0.15)} className={cn(GLASS, 'flex flex-col p-5 lg:col-span-2')}>
          <h3 className="mb-4 text-sm font-semibold text-white">{team.name} — Members</h3>
          <div className="flex-1 space-y-3">
            {team.roles.map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: member.color }}>
                    {member.initials}
                  </div>
                  <span className="text-sm text-white">{member.name}</span>
                </div>
                <Badge variant="outline" className={cn('text-[10px] border', roleColors[member.role])}>{member.role}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. ChatPanel
// ═══════════════════════════════════════════════════════════════

export function ChatPanel() {
  const locale = useAppStore((s) => s.locale);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [messageInput, setMessageInput] = useState('');

  const rooms = [
    { name: 'General', icon: Hash, unread: 3 },
    { name: 'Strategy Review', icon: Star, unread: 1 },
    { name: 'Risk Discussion', icon: ShieldCheck, unread: 0 },
    { name: 'Momentum EMA Cross', icon: TrendingUp, unread: 5 },
    { name: 'Breakout ATR v2', icon: TrendingUp, unread: 0 },
  ];

  const messages = [
    { id: 1, user: 'Alex Chen', initials: 'AC', color: '#19C37D', time: '09:15 AM', content: 'Just finished the walk-forward analysis on Momentum EMA. The OOS Sharpe dropped to 1.72 from 2.34 IS. Thoughts?' },
    { id: 2, user: 'Sarah Kim', initials: 'SK', color: '#22D3EE', time: '09:22 AM', content: 'That degradation ratio of 0.73 is actually within acceptable range. What was the OOS Max DD looking like?' },
    { id: 3, user: 'Alex Chen', initials: 'AC', color: '#19C37D', time: '09:25 AM', content: 'OOS Max DD was -11.2% vs -8.3% in sample. The strategy still survived all stress tests though.' },
    { id: 4, user: 'James Wilson', initials: 'JW', color: '#FBBF24', time: '09:31 AM', content: 'Have you tried Bayesian optimization on the parameters? I found that the RSI period is the most sensitive — even a 2-period change affects Sharpe by 0.3.' },
    { id: 5, user: 'Laura Park', initials: 'LP', color: '#A78BFA', time: '09:45 AM', content: 'I ran the Monte Carlo with 5000 simulations. Probability of ruin is under 3% which is good. Expected CAGR 18.4% with 15.7% max DD median.' },
    { id: 6, user: 'Mike Ross', initials: 'MR', color: '#F87171', time: '10:02 AM', content: 'Quick update: shared the Breakout ATR v2 results in the dedicated channel. 45% return but 22% max DD is concerning for live deployment.' },
    { id: 7, user: 'Sarah Kim', initials: 'SK', color: '#22D3EE', time: '10:15 AM', content: 'For the breakout strategy, I suggest implementing a volatility filter. Only trade when VIX is below its 50-day MA. This could cut the max DD significantly.' },
    { id: 8, user: 'Alex Chen', initials: 'AC', color: '#19C37D', time: '10:28 AM', content: 'Good idea Sarah. I\'ll set up a comparison backtest with and without the VIX filter. Should have results by EOD.' },
  ];

  const room = rooms[selectedRoom];
  const RoomIcon = room.icon;

  return (
    <motion.div {...anim()} className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden p-4 md:p-6">
      <PanelTitle icon={MessageSquare} title={t('nav.chat', locale)} />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <motion.div {...anim(0.1)} className={cn(GLASS, 'flex w-56 shrink-0 flex-col p-3')}>
          <h3 className="mb-3 px-1 text-xs font-semibold text-slate-400">Channels</h3>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {rooms.map((r, idx) => {
              const RI = r.icon;
              return (
                <button
                  key={r.name}
                  onClick={() => setSelectedRoom(idx)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all',
                    idx === selectedRoom
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RI className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{r.name}</span>
                  </div>
                  {r.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#19C37D] text-[10px] font-bold text-white">{r.unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div {...anim(0.15)} className={cn(GLASS, 'flex flex-1 flex-col p-0 overflow-hidden')}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <RoomIcon className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">{room.name}</h3>
            <Badge variant="outline" className="ml-auto border-white/10 bg-white/5 text-[10px] text-slate-500">
              {messages.length} messages
            </Badge>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: msg.color }}>
                  {msg.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white">{msg.user}</span>
                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] p-3">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message #${room.name.toLowerCase().replace(/ /g, '-')}...`}
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setMessageInput('');
                }}
              />
              <Button size="icon" style={{ background: NEON }} className="h-10 w-10 shrink-0">
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. ReportsPanel
// ═══════════════════════════════════════════════════════════════

export function ReportsPanel() {
  const locale = useAppStore((s) => s.locale);

  const reports = [
    {
      id: 1,
      strategyName: 'Momentum EMA Cross',
      date: 'Dec 15, 2024',
      type: 'Full Backtest Report',
      typeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      metrics: { return: '32.4%', sharpe: '2.34', maxDD: '-8.3%', trades: '148' },
    },
    {
      id: 2,
      strategyName: 'Breakout ATR v2',
      date: 'Dec 12, 2024',
      type: 'Walk-Forward Analysis',
      typeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      metrics: { return: '45.2%', sharpe: '1.56', maxDD: '-22.4%', trades: '203' },
    },
    {
      id: 3,
      strategyName: 'Volatility Harvest',
      date: 'Dec 10, 2024',
      type: 'Risk Assessment',
      typeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      metrics: { return: '24.7%', sharpe: '2.18', maxDD: '-11.2%', trades: '94' },
    },
  ];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <PanelTitle icon={FileText} title={t('nav.reports', locale)} />
        <Button style={{ background: NEON }} className="h-8 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Generate Report
        </Button>
      </div>

      <div className="space-y-4">
        {reports.map((r, i) => (
          <motion.div key={r.id} {...anim(i * 0.08)} className={cn(GLASS, 'p-5')}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">{r.strategyName}</h3>
                  <Badge variant="outline" className={cn('text-[10px] border', r.typeColor)}>{r.type}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" /> {r.date}
                </p>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {Object.entries(r.metrics).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                      <p className="text-[10px] capitalize text-slate-500">{key === 'maxDD' ? 'Max DD' : key === 'sharpe' ? 'Sharpe' : key === 'return' ? 'Return' : key}</p>
                      <p className={cn('mt-0.5 text-sm font-bold', key === 'maxDD' ? 'text-red-400' : key === 'sharpe' ? 'text-emerald-400' : 'text-white')}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
                  <Eye className="mr-1 h-3 w-3" /> {t('common.view', locale)}
                </Button>
                <Button size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
                  <FileDown className="mr-1 h-3 w-3" /> PDF
                </Button>
                <Button size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10">
                  <Upload className="mr-1 h-3 w-3" /> CSV
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <Disclaimer />
    </motion.div>
  );
}
