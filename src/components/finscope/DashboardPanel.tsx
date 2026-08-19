'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Layers,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Play,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Animated Number Counter (uses useMotionValue + useTransform + animate)
// ═══════════════════════════════════════════════════════════════

function AnimatedNumber({
  value,
  formatFn,
  delay = 0,
}: {
  value: number;
  formatFn: (v: number) => string;
  delay?: number;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => formatFn(v));
  const [display, setDisplay] = useState(formatFn(0));

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    const timer = setTimeout(() => {
      const controls = animate(motionVal, value, {
        duration: 1.6,
        ease: 'easeOut',
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [motionVal, rounded, value, formatFn, delay]);

  return <span>{display}</span>;
}

// ═══════════════════════════════════════════════════════════════
// Custom Chart Tooltips
// ═══════════════════════════════════════════════════════════════

function EquityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0D2137] px-3 py-2.5 shadow-2xl">
      <p className="mb-1.5 text-[11px] text-[#94A3B8]">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name === 'Equity' ? 'Equity' : 'Benchmark (SPY)'}:{' '}
          ${entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-[#0D2137] px-3 py-2 shadow-2xl">
      <p className="text-sm font-medium" style={{ color: d.payload.fill }}>
        {d.name}: {d.value}%
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Static Data
// ═══════════════════════════════════════════════════════════════

interface KpiCard {
  labelKey: string;
  icon: React.ElementType;
  value: number;
  formatFn: (v: number) => string;
  changeText: string;
  changePositive: boolean;
  sparkline: number[];
}

const KPI_CARDS: KpiCard[] = [
  {
    labelKey: 'dashboard.totalStrategies',
    icon: Layers,
    value: 123,
    formatFn: (v: number) => Math.round(v).toLocaleString(),
    changeText: '+12.5%',
    changePositive: true,
    sparkline: [98, 102, 99, 105, 108, 106, 112, 115, 118, 120, 119, 123],
  },
  {
    labelKey: 'dashboard.runningTests',
    icon: PlayCircle,
    value: 5,
    formatFn: (v: number) => Math.round(v).toString(),
    changeText: '+25%',
    changePositive: true,
    sparkline: [2, 3, 2, 4, 3, 4, 5, 3, 4, 5],
  },
  {
    labelKey: 'dashboard.completedTests',
    icon: CheckCircle2,
    value: 847,
    formatFn: (v: number) => Math.round(v).toLocaleString(),
    changeText: '+8.3%',
    changePositive: true,
    sparkline: [720, 745, 738, 770, 785, 800, 795, 810, 820, 830, 840, 847],
  },
  {
    labelKey: 'dashboard.bestSharpe',
    icon: TrendingUp,
    value: 2.34,
    formatFn: (v: number) => v.toFixed(2),
    changeText: '+0.15',
    changePositive: true,
    sparkline: [1.8, 1.95, 1.9, 2.0, 2.05, 1.98, 2.1, 2.15, 2.2, 2.18, 2.28, 2.34],
  },
  {
    labelKey: 'dashboard.bestCAGR',
    icon: Zap,
    value: 45.2,
    formatFn: (v: number) => v.toFixed(1) + '%',
    changeText: '+3.2%',
    changePositive: true,
    sparkline: [35, 37, 36.5, 38, 40, 39, 41, 42, 43, 44, 44.5, 45.2],
  },
  {
    labelKey: 'dashboard.lowestDrawdown',
    icon: ShieldAlert,
    value: -8.3,
    formatFn: (v: number) => v.toFixed(1) + '%',
    changeText: '-1.2%',
    changePositive: false,
    sparkline: [-12, -11.5, -10.8, -10.2, -9.5, -9.8, -9.1, -8.8, -8.5, -8.4, -8.35, -8.3],
  },
];

const RECENT_BACKTESTS = [
  {
    name: 'Momentum Alpha v3',
    symbol: 'AAPL',
    timeframe: '1D',
    date: '2024-12-15',
    status: 'completed' as const,
    returnPct: 32.4,
    sharpe: 2.34,
    maxDD: -8.3,
  },
  {
    name: 'Trend Following EMA',
    symbol: 'SPY',
    timeframe: '4H',
    date: '2024-12-14',
    status: 'completed' as const,
    returnPct: 18.7,
    sharpe: 1.89,
    maxDD: -12.1,
  },
  {
    name: 'Mean Reversion BB',
    symbol: 'MSFT',
    timeframe: '1D',
    date: '2024-12-14',
    status: 'running' as const,
    returnPct: null,
    sharpe: null,
    maxDD: null,
  },
  {
    name: 'Breakout ATR v2',
    symbol: 'TSLA',
    timeframe: '1H',
    date: '2024-12-13',
    status: 'completed' as const,
    returnPct: 45.2,
    sharpe: 1.56,
    maxDD: -22.4,
  },
  {
    name: 'RSI Divergence',
    symbol: 'NVDA',
    timeframe: '4H',
    date: '2024-12-13',
    status: 'failed' as const,
    returnPct: null,
    sharpe: null,
    maxDD: null,
  },
  {
    name: 'Volume Profile S/R',
    symbol: 'AMZN',
    timeframe: '1D',
    date: '2024-12-12',
    status: 'completed' as const,
    returnPct: 12.8,
    sharpe: 1.12,
    maxDD: -6.7,
  },
];

const HEATMAP_YEARS = [
  [3.2, -1.5, 4.1, 2.3, -0.8, 1.9, 3.5, -2.1, 0.7, 4.8, 2.1, -0.3],
  [1.8, 2.5, -1.2, 3.7, 0.4, -0.5, 2.9, 1.3, -1.8, 3.1, 0.6, 2.4],
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STRATEGY_DIST = [
  { name: 'Momentum', value: 35, color: '#19C37D' },
  { name: 'Trend', value: 25, color: '#22D3EE' },
  { name: 'Mean Reversion', value: 20, color: '#FBBF24' },
  { name: 'Breakout', value: 12, color: '#F87171' },
  { name: 'Other', value: 8, color: '#94A3B8' },
];

const TEAM_ACTIVITY = [
  {
    initials: 'AK',
    action: 'completed backtest for',
    target: 'Momentum Alpha v3',
    time: '5m',
    color: '#19C37D',
  },
  {
    initials: 'SM',
    action: 'created strategy',
    target: 'Mean Reversion Bollinger',
    time: '12m',
    color: '#22D3EE',
  },
  {
    initials: 'JD',
    action: 'shared strategy',
    target: 'Trend Following EMA',
    time: '28m',
    color: '#FBBF24',
  },
  {
    initials: 'LP',
    action: 'started optimization on',
    target: 'Breakout ATR v2',
    time: '1h',
    color: '#F87171',
  },
  {
    initials: 'MR',
    action: 'exported report',
    target: 'Q4 Performance Analysis',
    time: '2h',
    color: '#C084FC',
  },
];

// ═══════════════════════════════════════════════════════════════
// Seeded Random for Deterministic Equity Curve
// ═══════════════════════════════════════════════════════════════

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ═══════════════════════════════════════════════════════════════
// Glass Card Styles
// ═══════════════════════════════════════════════════════════════

const GLASS_CARD =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl';

// ═══════════════════════════════════════════════════════════════
// Main Dashboard Panel
// ═══════════════════════════════════════════════════════════════

export default function DashboardPanel() {
  const { locale, setActivePage, setCurrentStrategy, backtestResult, bumpStrategyBuilderKey } = useAppStore();

  // Generate deterministic equity curve data (50 points)
  const equityData = useMemo(() => {
    const rand = seededRandom(42);
    const data: { date: string; equity: number; benchmark: number }[] = [];
    let equity = 100000;
    let benchmark = 100000;

    for (let i = 0; i < 50; i++) {
      if (i > 0) {
        equity *= 1 + (rand() * 0.042 - 0.009);
        benchmark *= 1 + (rand() * 0.028 - 0.013);
      }
      const d = new Date(2023, 0, 2 + i * 7);
      data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        equity: Math.round(equity),
        benchmark: Math.round(benchmark),
      });
    }
    return data;
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'running':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'failed':
        return 'bg-red-500/15 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 1 — KPI Metric Cards                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        {KPI_CARDS.map((card, idx) => {
          const Icon = card.icon;
          const sparkData = card.sparkline.map((v) => ({ v }));
          return (
            <motion.div
              key={card.labelKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, delay: idx * 0.08 }}
              className={cn(GLASS_CARD, 'flex flex-col gap-2 p-4')}
            >
              {/* Icon + Label */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10">
                  <Icon className="h-4 w-4 text-[#19C37D]" />
                </div>
                <span className="text-xs text-muted-foreground leading-tight">
                  {t(card.labelKey, locale)}
                </span>
              </div>

              {/* Value + Change */}
              <div className="flex items-end justify-between gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">
                  <AnimatedNumber
                    value={card.value}
                    formatFn={card.formatFn}
                    delay={idx * 0.08}
                  />
                </span>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    card.changePositive
                      ? 'text-emerald-400'
                      : 'text-red-400',
                  )}
                >
                  {card.changePositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {card.changeText}
                </span>
              </div>

              {/* Sparkline */}
              <div className="mt-auto h-10 w-full -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <defs>
                      <linearGradient
                        id={`spark-grad-${idx}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#19C37D" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#19C37D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#19C37D"
                      strokeWidth={1.5}
                      fill={`url(#spark-grad-${idx})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Quick Action Bar                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setCurrentStrategy(null);
            bumpStrategyBuilderKey();
            setActivePage('strategy-builder');
          }}
          className="gap-2 bg-[#19C37D] text-[#071A2B] hover:bg-[#19C37D]/85 font-semibold"
        >
          <Plus className="size-4" />
          {locale === 'fa' ? 'استراتژی جدید' : 'New Strategy'}
        </Button>
        <Button
          onClick={() => setActivePage('backtest')}
          variant="outline"
          className="gap-2 border-[#19C37D]/30 bg-[#19C37D]/5 text-[#19C37D] hover:bg-[#19C37D]/15 hover:text-[#19C37D] font-semibold"
        >
          <Play className="size-4" />
          {locale === 'fa' ? 'اجرا بک‌تست' : 'Run Backtest'}
        </Button>
        <Button
          onClick={() => setActivePage('reports')}
          variant="outline"
          className="gap-2 border-white/10 bg-white/[0.03] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white font-semibold"
        >
          <FileText className="size-4" />
          {locale === 'fa' ? 'تولید گزارش' : 'Generate Report'}
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 2 — Performance Overview + Recent Backtests          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Performance Overview — Left (3/5) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.5 }}
          className={cn(GLASS_CARD, 'col-span-1 p-5 lg:col-span-3')}
        >
          <h3 className="mb-4 text-sm font-semibold text-white">
            {t('dashboard.performanceOverview', locale)}
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(25,195,125,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148,163,184,0.15)' }}
                  interval={6}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  width={52}
                  domain={['dataMin - 2000', 'dataMax + 2000']}
                />
                <Tooltip content={<EquityTooltip />} />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#19C37D"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#19C37D',
                    stroke: '#071A2B',
                    strokeWidth: 2,
                  }}
                  name="Equity"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#475569"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="6 3"
                  name="Benchmark"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Backtests — Right (2/5) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.6 }}
          className={cn(GLASS_CARD, 'col-span-1 flex flex-col p-5 lg:col-span-2')}
        >
          <h3 className="mb-4 text-sm font-semibold text-white">
            {t('dashboard.recentBacktests', locale)}
          </h3>
          <div className="flex flex-1 flex-col divide-y divide-white/[0.06] overflow-hidden">
            {RECENT_BACKTESTS.map((bt, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                  {/* Name row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {bt.name}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        statusColor(bt.status),
                      )}
                    >
                      {bt.status === 'completed'
                        ? t('backtest.complete', locale)
                        : bt.status === 'running'
                          ? t('backtest.running', locale).replace('...', '')
                          : t('backtest.failed', locale)}
                    </span>
                  </div>
                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                    <span className="font-medium text-white/80">{bt.symbol}</span>
                    <span>{bt.timeframe}</span>
                    <span>{bt.date}</span>
                  </div>
                  {/* Metrics row */}
                  {bt.returnPct !== null && (
                    <div className="flex items-center gap-4 text-[11px]">
                      <span>
                        <span className="text-[#94A3B8]">{t('metric.totalReturn', locale)}: </span>
                        <span
                          className={cn(
                            'font-semibold',
                            bt.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {bt.returnPct >= 0 ? '+' : ''}
                          {bt.returnPct}%
                        </span>
                      </span>
                      <span>
                        <span className="text-[#94A3B8]">{t('metric.sharpe', locale)}: </span>
                        <span className="font-semibold text-white">{bt.sharpe}</span>
                      </span>
                      <span>
                        <span className="text-[#94A3B8]">{t('metric.maxDrawdown', locale)}: </span>
                        <span className="font-semibold text-red-400">{bt.maxDD}%</span>
                      </span>
                    </div>
                  )}
                </div>
                {idx < RECENT_BACKTESTS.length - 1 && (
                  <Separator className="bg-white/[0.06]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 3 — Heatmap + Distribution + Team Activity            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Monthly Returns Heatmap — Left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.7 }}
          className={cn(GLASS_CARD, 'p-5')}
        >
          <h3 className="mb-4 text-sm font-semibold text-white">
            {t('results.monthlyReturns', locale)}
          </h3>
          <div className="overflow-x-auto">
            <div className="grid min-w-[420px] grid-cols-[48px_repeat(12,1fr)] gap-1.5">
              {/* Header row — month labels */}
              <div />
              {MONTH_LABELS.map((m) => (
                <div
                  key={m}
                  className="text-center text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]"
                >
                  {m}
                </div>
              ))}

              {/* Data rows */}
              {HEATMAP_YEARS.map((year, yi) => (
                <React.Fragment key={yi}>
                  <div className="flex items-center text-xs font-semibold text-[#94A3B8]">
                    202{yi + 3}
                  </div>
                  {year.map((val, mi) => {
                    const intensity = Math.min(Math.abs(val) / 5, 1);
                    const isPositive = val >= 0;
                    return (
                      <div
                        key={mi}
                        className={cn(
                          'flex h-9 items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                          isPositive
                            ? 'bg-emerald-500/[0.08] text-emerald-400 hover:bg-emerald-500/[0.15]'
                            : 'bg-red-500/[0.08] text-red-400 hover:bg-red-500/[0.15]',
                        )}
                        style={{
                          opacity: 0.5 + intensity * 0.5,
                        }}
                      >
                        {val > 0 ? '+' : ''}
                        {val}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/30" />
              {t('metric.totalReturn', locale)} &gt; 0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/30" />
              {t('metric.totalReturn', locale)} &lt; 0
            </span>
          </div>
        </motion.div>

        {/* Strategy Distribution — Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.8 }}
          className={cn(GLASS_CARD, 'flex flex-col p-5')}
        >
          <h3 className="mb-2 text-sm font-semibold text-white">
            {t('dashboard.strategyDistribution', locale)}
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STRATEGY_DIST}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {STRATEGY_DIST.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {STRATEGY_DIST.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] text-[#94A3B8]">
                  {item.name}{' '}
                  <span className="font-semibold text-white">{item.value}%</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team Activity — Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.9 }}
          className={cn(GLASS_CARD, 'flex flex-col p-5')}
        >
          <h3 className="mb-4 text-sm font-semibold text-white">
            {t('dashboard.teamActivity', locale)}
          </h3>
          <div className="flex flex-1 flex-col divide-y divide-white/[0.06]">
            {TEAM_ACTIVITY.map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* Avatar placeholder */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: act.color + '25', color: act.color }}
                >
                  {act.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-[#CBD5E1]">
                    <span className="font-semibold text-white">{act.initials}</span>{' '}
                    {act.action}{' '}
                    <span className="font-medium text-[#19C37D]">{act.target}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">{act.time} ago</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BOTTOM — Disclaimer Bar                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className={cn(
          GLASS_CARD,
          'flex items-center justify-center gap-2 px-4 py-3',
        )}
      >
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />
        <p className="text-center text-[11px] leading-relaxed text-[#94A3B8]">
          <span className="font-semibold text-amber-400/80">
            {t('common.perspective', locale)}
          </span>{' '}
          — {t('common.disclaimer', locale)}
        </p>
      </motion.div>
    </div>
  );
}
