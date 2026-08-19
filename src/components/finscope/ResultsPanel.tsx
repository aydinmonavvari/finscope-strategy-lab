'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Activity,
  List,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import type { PerformanceMetrics, Trade, BacktestResult } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const GLASS_CARD = 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function fmtPct(v: number, decimals = 2): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

function fmtNum(v: number, decimals = 2): string {
  return v.toFixed(decimals);
}

function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function goodColor(v: number, invert = false): string {
  const isGood = invert ? v <= 0 : v >= 0;
  return isGood ? 'text-[#19C37D]' : 'text-red-400';
}

// ═══════════════════════════════════════════════════════════════
// Metric Mini Card (Summary Bar)
// ═══════════════════════════════════════════════════════════════

function MetricMiniCard({ label, value, color, icon }: { label: string; value: string; color: string; icon?: React.ReactNode }) {
  return (
    <div className={cn(GLASS_CARD, 'p-3 min-w-[140px] flex-shrink-0')}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <p className={cn('text-sm font-bold font-mono', color)}>{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Metric Detail Card (Performance Metrics tab)
// ═══════════════════════════════════════════════════════════════

function MetricCard({ label, value, rawValue, invert = false, maxAbs = 100 }: {
  label: string; value: string; rawValue: number; invert?: boolean; maxAbs?: number;
}) {
  const pct = Math.min(Math.abs(rawValue) / maxAbs, 1) * 100;
  const isGood = invert ? rawValue <= 0 : rawValue >= 0;
  const barColorCls = isGood ? 'bg-[#19C37D]' : 'bg-red-400';
  const textColor = isGood ? 'text-[#19C37D]' : 'text-red-400';

  return (
    <div className={cn(GLASS_CARD, 'p-3 space-y-2')}>
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <p className={cn('text-base font-bold font-mono', textColor)}>{value}</p>
      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColorCls)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════════════════════════

function EmptyState({ onGoBack }: { onGoBack: () => void }) {
  const locale = useAppStore((s) => s.locale);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className={cn(GLASS_CARD, 'p-12 text-center space-y-4 max-w-md')}>
        <BarChart3 className="h-16 w-16 text-white/10 mx-auto" />
        <h2 className="text-lg font-semibold text-white/60">{t('results.noResults', locale)}</h2>
        <Button onClick={onGoBack} variant="outline" className="border-[#19C37D]/30 text-[#19C37D] hover:bg-[#19C37D]/10">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('results.goToBacktest', locale)}
        </Button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Summary Bar
// ═══════════════════════════════════════════════════════════════

function SummaryBar({ metrics }: { metrics: PerformanceMetrics }) {
  const locale = useAppStore((s) => s.locale);
  const items = [
    { label: t('metric.totalReturn', locale), value: fmtPct(metrics.totalReturn), color: goodColor(metrics.totalReturn), icon: metrics.totalReturn >= 0 ? <TrendingUp className="h-3 w-3 text-[#19C37D]" /> : <TrendingDown className="h-3 w-3 text-red-400" /> },
    { label: t('metric.cagr', locale), value: fmtPct(metrics.cagr), color: goodColor(metrics.cagr), icon: <Activity className="h-3 w-3 text-white/30" /> },
    { label: t('metric.sharpe', locale), value: fmtNum(metrics.sharpe), color: goodColor(metrics.sharpe), icon: <Target className="h-3 w-3 text-white/30" /> },
    { label: t('metric.maxDrawdown', locale), value: fmtPct(metrics.maxDrawdown), color: goodColor(metrics.maxDrawdown, true), icon: <TrendingDown className="h-3 w-3 text-white/30" /> },
    { label: t('metric.winRate', locale), value: fmtPct(metrics.winRate), color: goodColor(metrics.winRate), icon: <Target className="h-3 w-3 text-white/30" /> },
    { label: t('metric.profitFactor', locale), value: fmtNum(metrics.profitFactor), color: goodColor(metrics.profitFactor - 1), icon: <BarChart3 className="h-3 w-3 text-white/30" /> },
    { label: t('metric.totalTrades', locale), value: String(metrics.totalTrades), color: 'text-white/80', icon: <List className="h-3 w-3 text-white/30" /> },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((item, i) => (
        <motion.div key={item.label} {...fadeUp} transition={{ delay: i * 0.05 }}>
          <MetricMiniCard {...item} />
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 1: Equity Curve
// ═══════════════════════════════════════════════════════════════

function EquityCurveTab({ data }: { data: BacktestResult['equityCurve'] }) {
  const locale = useAppStore((s) => s.locale);
  const combined = useMemo(() => data.map((d) => ({ ...d, drawdownAbs: Math.abs(d.drawdown) })), [data]);

  return (
    <motion.div {...fadeUp} className="space-y-4">
      <div className={cn(GLASS_CARD, 'p-4')}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/60">{t('results.equityCurve', locale)}</h3>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#19C37D] rounded" />{t('results.equityCurve', locale)}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-white/30 rounded" />Benchmark</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400/60 rounded-sm" />{t('results.drawdown', locale)}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={combined} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#19C37D" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#19C37D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
            <YAxis yAxisId="equity" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} orientation="left" tickFormatter={(v: number) => fmtCurrency(v)} />
            <YAxis yAxisId="drawdown" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(239,68,68,0.5)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} orientation="right" reversed tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
            <RTooltip contentStyle={{ backgroundColor: 'rgba(7,26,43,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} />
            <Area yAxisId="equity" type="monotone" dataKey="equity" stroke="#19C37D" strokeWidth={2} fill="url(#equityGrad)" dot={false} name="Equity" />
            <Area yAxisId="equity" type="monotone" dataKey="benchmark" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill={undefined} dot={false} strokeDasharray="4 4" name="Benchmark" />
            <Bar yAxisId="drawdown" dataKey="drawdownAbs" fill="rgba(239,68,68,0.25)" name="Drawdown" barSize={3} />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 2: Performance Metrics
// ═══════════════════════════════════════════════════════════════

function PerformanceMetricsTab({ metrics }: { metrics: PerformanceMetrics }) {
  const locale = useAppStore((s) => s.locale);

  const returnMetrics = [
    { label: t('metric.totalReturn', locale), value: fmtPct(metrics.totalReturn), raw: metrics.totalReturn },
    { label: t('metric.cagr', locale), value: fmtPct(metrics.cagr), raw: metrics.cagr },
    { label: t('metric.annualReturn', locale), value: fmtPct(metrics.annualReturn), raw: metrics.annualReturn },
    { label: t('results.monthlyAvg', locale), value: fmtPct(metrics.cagr / 12), raw: metrics.cagr / 12 },
  ];

  const riskAdjusted = [
    { label: t('metric.sharpe', locale), value: fmtNum(metrics.sharpe), raw: metrics.sharpe, maxAbs: 3, invert: false },
    { label: t('metric.sortino', locale), value: fmtNum(metrics.sortino), raw: metrics.sortino, maxAbs: 4, invert: false },
    { label: t('metric.calmar', locale), value: fmtNum(metrics.calmar), raw: metrics.calmar, maxAbs: 5, invert: false },
    { label: t('metric.omega', locale), value: fmtNum(metrics.omega), raw: metrics.omega, maxAbs: 3, invert: false },
    { label: t('metric.alpha', locale), value: fmtPct(metrics.alpha), raw: metrics.alpha, maxAbs: 30, invert: false },
    { label: t('metric.beta', locale), value: fmtNum(metrics.beta), raw: metrics.beta, maxAbs: 2, invert: Math.abs(metrics.beta - 1) > 0.3 },
    { label: t('metric.infoRatio', locale), value: fmtNum(metrics.infoRatio), raw: metrics.infoRatio, maxAbs: 2, invert: false },
  ];

  const riskMetrics = [
    { label: t('metric.volatility', locale), value: fmtPct(metrics.volatility), raw: metrics.volatility, maxAbs: 50, invert: true },
    { label: t('metric.downsideDev', locale), value: fmtPct(metrics.downsideDev), raw: metrics.downsideDev, maxAbs: 30, invert: true },
    { label: t('metric.maxDrawdown', locale), value: fmtPct(metrics.maxDrawdown), raw: metrics.maxDrawdown, maxAbs: 50, invert: true },
    { label: t('metric.avgDrawdown', locale), value: fmtPct(metrics.avgDrawdown), raw: metrics.avgDrawdown, maxAbs: 20, invert: true },
    { label: t('metric.ulcerIndex', locale), value: fmtNum(metrics.ulcerIndex), raw: metrics.ulcerIndex, maxAbs: 15, invert: true },
    { label: t('metric.riskOfRuin', locale), value: fmtPct(metrics.riskOfRuin), raw: metrics.riskOfRuin, maxAbs: 100, invert: true },
    { label: t('metric.var', locale), value: fmtPct(metrics.var), raw: metrics.var, maxAbs: 20, invert: true },
    { label: t('metric.cvar', locale), value: fmtPct(metrics.cvar), raw: metrics.cvar, maxAbs: 30, invert: true },
  ];

  type MetricItem = { label: string; value: string; raw: number; maxAbs?: number; invert?: boolean };

  const renderSection = (title: string, items: MetricItem[]) => (
    <motion.div {...fadeUp}>
      <h4 className="text-xs uppercase tracking-wider text-white/40 mb-3 font-medium">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} rawValue={item.raw} invert={item.invert ?? false} maxAbs={item.maxAbs ?? 100} />
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {renderSection(t('results.returnMetrics', locale), returnMetrics)}
      <Separator className="bg-white/[0.06]" />
      {renderSection(t('results.riskAdjustedReturns', locale), riskAdjusted)}
      <Separator className="bg-white/[0.06]" />
      {renderSection(t('results.riskMetrics', locale), riskMetrics)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Trade Analysis
// ═══════════════════════════════════════════════════════════════

function TradeAnalysisTab({ metrics, trades }: { metrics: PerformanceMetrics; trades: Trade[] }) {
  const locale = useAppStore((s) => s.locale);

  const tradeMetricItems = [
    { label: t('metric.totalTrades', locale), value: String(metrics.totalTrades), color: 'text-white/80' },
    { label: t('metric.winningTrades', locale), value: String(metrics.winningTrades), color: 'text-[#19C37D]' },
    { label: t('metric.losingTrades', locale), value: String(metrics.losingTrades), color: 'text-red-400' },
    { label: t('metric.avgWin', locale), value: fmtPct(metrics.avgWin), color: goodColor(metrics.avgWin) },
    { label: t('metric.avgLoss', locale), value: fmtPct(metrics.avgLoss), color: goodColor(metrics.avgLoss) },
    { label: t('metric.avgR', locale), value: fmtNum(metrics.avgR), color: goodColor(metrics.avgR) },
    { label: t('metric.expectancy', locale), value: fmtPct(metrics.expectancy), color: goodColor(metrics.expectancy) },
    { label: t('metric.bestTrade', locale), value: fmtPct(metrics.bestTrade), color: goodColor(metrics.bestTrade) },
    { label: t('metric.worstTrade', locale), value: fmtPct(metrics.worstTrade), color: goodColor(metrics.worstTrade) },
    { label: t('metric.avgHoldingTime', locale), value: metrics.avgHoldingTime, color: 'text-white/80' },
    { label: t('metric.longestWinStreak', locale), value: String(metrics.longestWinStreak), color: 'text-[#19C37D]' },
    { label: t('metric.longestLossStreak', locale), value: String(metrics.longestLossStreak), color: 'text-red-400' },
  ];

  const chartData = useMemo(() => {
    return [...trades].sort((a, b) => a.id - b.id).map((tr) => ({ id: tr.id, pnl: tr.pnlPct }));
  }, [trades]);

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {tradeMetricItems.map((item) => (
            <div key={item.label} className={cn(GLASS_CARD, 'p-3 space-y-1')}>
              <span className="text-[10px] uppercase tracking-wider text-white/40">{item.label}</span>
              <p className={cn('text-sm font-bold font-mono', item.color)}>{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div className={cn(GLASS_CARD, 'p-4')}>
          <h4 className="text-xs uppercase tracking-wider text-white/40 mb-4">P&L Distribution</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="id" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
              <RTooltip contentStyle={{ backgroundColor: 'rgba(7,26,43,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} formatter={(value: number) => [fmtPct(value), 'P&L']} />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]} barSize={8}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? '#19C37D' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 4: Trade List
// ═══════════════════════════════════════════════════════════════

function TradeListTab({ trades }: { trades: Trade[] }) {
  const locale = useAppStore((s) => s.locale);
  const [showAll, setShowAll] = useState(false);

  const sortedTrades = useMemo(() => [...trades].sort((a, b) => b.entryDate.localeCompare(a.entryDate)), [trades]);
  const displayTrades = showAll ? sortedTrades : sortedTrades.slice(0, 20);

  const columns = [
    { key: 'id', label: '#' },
    { key: 'entryDate', label: t('common.date', locale) },
    { key: 'direction', label: t('results.direction', locale) },
    { key: 'entryPrice', label: t('results.entry', locale) },
    { key: 'exitPrice', label: t('results.exit', locale) },
    { key: 'pnlPct', label: t('results.pnl', locale) },
    { key: 'returnR', label: t('results.rMultiple', locale) },
    { key: 'mae', label: t('metric.mae', locale) },
    { key: 'mfe', label: t('metric.mfe', locale) },
    { key: 'holdingBars', label: t('results.holdingBars', locale) },
  ];

  return (
    <motion.div {...fadeUp} className="space-y-4">
      <div className={cn(GLASS_CARD, 'p-4')}>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#071A2B]/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/[0.06]">
                {columns.map((col) => (
                  <th key={col.key} className="py-2.5 px-2 text-left text-[10px] uppercase tracking-wider text-white/40 font-medium">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayTrades.map((trade, idx) => (
                <tr key={trade.id} className={cn('border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]', idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]')}>
                  <td className="py-2 px-2 text-white/50 font-mono">{trade.id}</td>
                  <td className="py-2 px-2 text-white/70 font-mono">{trade.entryDate}</td>
                  <td className="py-2 px-2">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-mono', trade.direction === 'long' ? 'border-[#19C37D]/30 text-[#19C37D]' : 'border-red-400/30 text-red-400')}>
                      {trade.direction === 'long' ? 'Long' : 'Short'}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-white/70 font-mono">{trade.entryPrice.toFixed(2)}</td>
                  <td className="py-2 px-2 text-white/70 font-mono">{trade.exitPrice.toFixed(2)}</td>
                  <td className={cn('py-2 px-2 font-mono font-medium', goodColor(trade.pnlPct))}>{fmtPct(trade.pnlPct)}</td>
                  <td className={cn('py-2 px-2 font-mono', goodColor(trade.returnR))}>{fmtNum(trade.returnR)}R</td>
                  <td className="py-2 px-2 text-red-400/70 font-mono">{fmtPct(trade.mae)}</td>
                  <td className="py-2 px-2 text-[#19C37D]/70 font-mono">{fmtPct(trade.mfe)}</td>
                  <td className="py-2 px-2 text-white/50 font-mono">{trade.holdingBars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedTrades.length > 20 && (
          <div className="pt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            >
              {showAll ? t('common.previous', locale) : t('results.showAll', locale)} ({sortedTrades.length})
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 5: Monthly Returns Heatmap
// ═══════════════════════════════════════════════════════════════

function MonthlyReturnsTab({ monthlyReturns }: { monthlyReturns: BacktestResult['monthlyReturns'] }) {
  const locale = useAppStore((s) => s.locale);

  const { years, grid } = useMemo(() => {
    const yearSet = new Set<string>();
    monthlyReturns.forEach((mr) => {
      const parts = mr.month.split('-');
      if (parts.length >= 1) yearSet.add(parts[0]);
    });
    const sortedYears = Array.from(yearSet).sort();

    const gridMap: Record<string, Record<number, number>> = {};
    monthlyReturns.forEach((mr) => {
      const parts = mr.month.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (!gridMap[year]) gridMap[year] = {};
        gridMap[year][monthIdx] = mr.return;
      }
    });

    return { years: sortedYears, grid: gridMap };
  }, [monthlyReturns]);

  const getCellColor = (val: number | undefined): string => {
    if (val === undefined) return 'bg-white/[0.02]';
    const absVal = Math.min(Math.abs(val) / 10, 1);
    if (val >= 0) {
      const opacity = 0.1 + absVal * 0.6;
      return `bg-[#19C37D]`;
    } else {
      const opacity = 0.1 + absVal * 0.6;
      return `bg-red-400`;
    }
  };

  const getCellOpacity = (val: number | undefined): number => {
    if (val === undefined) return 1;
    return 0.15 + Math.min(Math.abs(val) / 10, 1) * 0.7;
  };

  const getTextColor = (val: number | undefined): string => {
    if (val === undefined) return 'text-white/20';
    return val >= 0 ? 'text-[#19C37D]' : 'text-red-400';
  };

  return (
    <motion.div {...fadeUp} className="space-y-4">
      <div className={cn(GLASS_CARD, 'p-4')}>
        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-4">{t('results.monthlyReturns', locale)}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="py-2 px-2 text-left text-[10px] uppercase tracking-wider text-white/30 font-medium">Year</th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="py-2 px-1 text-center text-[10px] uppercase tracking-wider text-white/30 font-medium">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => {
                const yearData = grid[year] || {};
                let yearTotal = 0;
                for (let m = 0; m < 12; m++) {
                  if (yearData[m] !== undefined) yearTotal += yearData[m];
                }

                return (
                  <tr key={year} className="border-b border-white/[0.04]">
                    <td className="py-2 px-2 text-white/50 font-mono font-medium">{year}</td>
                    {Array.from({ length: 12 }, (_, m) => {
                      const val = yearData[m];
                      return (
                        <td key={m} className="py-1.5 px-0.5">
                          <div
                            className={cn('rounded-md py-1.5 px-1 text-center font-mono text-[10px] transition-colors', getCellColor(val))}
                            style={{ opacity: getCellOpacity(val) }}
                          >
                            <span className={getTextColor(val)}>
                              {val !== undefined ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : '-'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-center">
                      <span className={cn('font-mono text-[10px] font-bold', yearTotal >= 0 ? 'text-[#19C37D]' : 'text-red-400')}>
                        {yearTotal >= 0 ? '+' : ''}{yearTotal.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main ResultsPanel
// ═══════════════════════════════════════════════════════════════

export default function ResultsPanel() {
  const { locale, backtestResult, setActivePage } = useAppStore();

  if (!backtestResult) {
    return <EmptyState onGoBack={() => setActivePage('backtest')} />;
  }

  const { metrics, trades, equityCurve, monthlyReturns, executionTime } = backtestResult;

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActivePage('backtest')} className="text-white/50 hover:text-white/80 hover:bg-white/[0.04] h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white">{t('results.title', locale)}</h1>
          <Badge variant="outline" className="border-[#19C37D]/30 text-[#19C37D] text-xs">
            {backtestResult.symbol} · {backtestResult.timeframe}
          </Badge>
          <span className="text-xs text-white/30 font-mono">
            {backtestResult.startDate} → {backtestResult.endDate}
          </span>
        </div>
        <span className="text-xs text-white/30 font-mono">
          {executionTime.toFixed(0)}ms
        </span>
      </motion.div>

      {/* Summary Bar */}
      <motion.div {...fadeUp}>
        <SummaryBar metrics={metrics} />
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="equity-curve" className="space-y-4">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] rounded-lg h-10 p-1">
            <TabsTrigger value="equity-curve" className="text-xs data-[state=active]:bg-[#19C37D]/20 data-[state=active]:text-[#19C37D] text-white/50 rounded-md px-3">
              <Activity className="h-3.5 w-3.5 mr-1.5" />{t('results.equityCurve', locale)}
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-[#19C37D]/20 data-[state=active]:text-[#19C37D] text-white/50 rounded-md px-3">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />{t('results.performance', locale)}
            </TabsTrigger>
            <TabsTrigger value="trade-analysis" className="text-xs data-[state=active]:bg-[#19C37D]/20 data-[state=active]:text-[#19C37D] text-white/50 rounded-md px-3">
              <Target className="h-3.5 w-3.5 mr-1.5" />{t('results.tradeAnalysis', locale)}
            </TabsTrigger>
            <TabsTrigger value="trade-list" className="text-xs data-[state=active]:bg-[#19C37D]/20 data-[state=active]:text-[#19C37D] text-white/50 rounded-md px-3">
              <List className="h-3.5 w-3.5 mr-1.5" />{t('results.tradeList', locale)}
            </TabsTrigger>
            <TabsTrigger value="monthly-returns" className="text-xs data-[state=active]:bg-[#19C37D]/20 data-[state=active]:text-[#19C37D] text-white/50 rounded-md px-3">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />{t('results.monthlyReturns', locale)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equity-curve">
            <EquityCurveTab data={equityCurve} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetricsTab metrics={metrics} />
          </TabsContent>

          <TabsContent value="trade-analysis">
            <TradeAnalysisTab metrics={metrics} trades={trades} />
          </TabsContent>

          <TabsContent value="trade-list">
            <TradeListTab trades={trades} />
          </TabsContent>

          <TabsContent value="monthly-returns">
            <MonthlyReturnsTab monthlyReturns={monthlyReturns} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Disclaimer */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <div className={cn(GLASS_CARD, 'p-3 flex items-center gap-3')}>
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-500/70 text-[10px] shrink-0">
            {t('common.perspective', locale)}
          </Badge>
          <p className="text-[10px] text-white/30 leading-relaxed">{t('common.disclaimer', locale)}</p>
        </div>
      </motion.div>
    </div>
  );
}
