'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Forward,
  Wallet,
  Settings2,
  Footprints,
  Dice5,
  AlertTriangle,
  SlidersHorizontal,
  GitCompareArrows,
  ShieldCheck,
  BarChart3,
  Play,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  DollarSign,
  Percent,
  Target,
  Activity,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tooltip as ShTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Shared Constants
// ═══════════════════════════════════════════════════════════════

const GLASS = 'rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl';
const NEON = '#19C37D';
const GRID_COLOR = 'rgba(25,195,125,0.06)';
const AXIS_TEXT = '#94A3B8';
const TOOLTIP_BG = '#0B2239';

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { type: 'spring' as const, stiffness: 100, delay },
});

function Disclaimer() {
  const locale = useAppStore((s) => s.locale);
  return (
    <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div>
        <p className="text-xs font-medium text-amber-400">{t('common.perspective', locale)}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{t('common.disclaimer', locale)}</p>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 px-3 py-2.5 shadow-2xl" style={{ background: TOOLTIP_BG }}>
      <p className="mb-1.5 text-[11px]" style={{ color: AXIS_TEXT }}>{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
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
// 1. ForwardTestPanel
// ═══════════════════════════════════════════════════════════════

export function ForwardTestPanel() {
  const locale = useAppStore((s) => s.locale);
  const [strategy, setStrategy] = useState('momentum-ema');
  const [capital, setCapital] = useState('100000');
  const [startDate, setStartDate] = useState('2024-10-01');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  const comparisonData = useMemo(() => {
    if (!completed) return [];
    return [
      { metric: t('metric.totalReturn', locale), backtest: '32.4%', forward: '28.1%', diff: '-4.3%' },
      { metric: t('metric.sharpe', locale), backtest: '2.34', forward: '1.98', diff: '-0.36' },
      { metric: t('metric.sortino', locale), backtest: '3.12', forward: '2.67', diff: '-0.45' },
      { metric: t('metric.maxDrawdown', locale), backtest: '-8.3%', forward: '-11.2%', diff: '-2.9%' },
      { metric: t('metric.winRate', locale), backtest: '62.5%', forward: '58.3%', diff: '-4.2%' },
      { metric: t('metric.profitFactor', locale), backtest: '2.15', forward: '1.87', diff: '-0.28' },
      { metric: t('metric.cagr', locale), backtest: '18.7%', forward: '15.2%', diff: '-3.5%' },
      { metric: t('metric.expectancy', locale), backtest: '$42.50', forward: '$35.20', diff: '-$7.30' },
      { metric: t('metric.totalTrades', locale), backtest: '148', forward: '42', diff: '' },
      { metric: t('metric.avgR', locale), backtest: '1.82R', forward: '1.54R', diff: '-0.28R' },
    ];
  }, [completed, locale]);

  const equityData = useMemo(() => {
    if (!completed) return [];
    const data = [];
    let backtestVal = 100000;
    let forwardVal = 100000;
    for (let i = 0; i <= 90; i++) {
      backtestVal *= 1 + (Math.random() * 0.02 - 0.006);
      if (i > 60) forwardVal *= 1 + (Math.random() * 0.02 - 0.008);
      const date = new Date(2024, 0, 1);
      date.setDate(date.getDate() + i * 4);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        backtest: Math.round(backtestVal),
        forward: i > 60 ? Math.round(forwardVal) : null,
      });
    }
    return data;
  }, [completed]);

  const handleRun = useCallback(() => {
    setRunning(true);
    setCompleted(false);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setRunning(false);
        setCompleted(true);
      }
      setProgress(Math.min(Math.round(p), 100));
    }, 300);
  }, []);

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Forward} title={t('nav.forwardTest', locale)} />

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5 lg:col-span-1')}>
          <h3 className="mb-4 text-sm font-semibold text-white">Configuration</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">{t('backtest.startDate', locale)}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-white/10 bg-white/5 text-white" disabled={running} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">{t('backtest.selectStrategy', locale)}</Label>
              <Select value={strategy} onValueChange={setStrategy} disabled={running}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0B2239]">
                  <SelectItem value="momentum-ema">Momentum EMA Cross</SelectItem>
                  <SelectItem value="mean-revert-bb">Mean Reversion BB</SelectItem>
                  <SelectItem value="breakout-atr">Breakout ATR v2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">{t('backtest.initialCapital', locale)}</Label>
              <Input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="border-white/10 bg-white/5 text-white" disabled={running} />
            </div>
            {running && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{locale === 'fa' ? 'در حال اجرا...' : 'Running...'}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/10" />
              </div>
            )}
            {completed && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">{locale === 'fa' ? 'تست فوروارد با موفقیت انجام شد' : 'Forward test completed successfully'}</span>
              </div>
            )}
            <Button className="w-full" style={{ background: NEON }} onClick={handleRun} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? (locale === 'fa' ? 'در حال اجرا...' : 'Running...') : (locale === 'fa' ? 'شروع تست فوروارد' : 'Start Forward Test')}
            </Button>
          </div>
        </motion.div>

        <motion.div {...anim(0.2)} className={cn(GLASS, 'p-5 lg:col-span-2')}>
          {!completed && !running && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <Forward className="mb-3 h-10 w-10 text-white/10" />
              <p className="text-sm text-slate-500">{locale === 'fa' ? 'تنظیمات را وارد کرده و دکمه شروع را بزنید' : 'Configure parameters and click Start to run forward test'}</p>
            </div>
          )}
          {running && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#19C37D]/50" />
              <p className="text-sm text-slate-400">{locale === 'fa' ? 'در حال شبیه‌سازی...' : 'Simulating forward test...'}</p>
            </div>
          )}
          {completed && equityData.length > 0 && (
            <>
              <h3 className="mb-4 text-sm font-semibold text-white">Backtest vs Forward Test Equity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: AXIS_TEXT }} interval={14} />
                  <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="backtest" stroke={NEON} dot={false} strokeWidth={2} name="Backtest" />
                  <Line type="monotone" dataKey="forward" stroke="#F97316" dot={false} strokeWidth={2} name="Forward" connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
              <h3 className="mb-3 mt-5 text-sm font-semibold text-white">Metric Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="pb-3 text-left text-xs font-medium text-slate-400">Metric</th>
                      <th className="pb-3 text-right text-xs font-medium text-slate-400">Backtest</th>
                      <th className="pb-3 text-right text-xs font-medium text-slate-400">Forward Test</th>
                      <th className="pb-3 text-right text-xs font-medium text-slate-400">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        <td className="py-2.5 text-white">{row.metric}</td>
                        <td className="py-2.5 text-right text-slate-300">{row.backtest}</td>
                        <td className="py-2.5 text-right font-medium text-white">{row.forward}</td>
                        <td className="py-2.5 text-right">
                          {row.diff && (
                            <span className={row.diff.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}>
                              {row.diff}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. PaperTradingPanel
// ═══════════════════════════════════════════════════════════════

export function PaperTradingPanel() {
  const locale = useAppStore((s) => s.locale);

  const pnlData = useMemo(() => {
    const data = [];
    let val = 100000;
    for (let i = 1; i <= 30; i++) {
      val += (Math.sin(i * 0.7) * 400 + Math.cos(i * 1.3) * 250 + i * 15);
      data.push({ day: `Day ${i}`, pnl: Math.round(val - 100000) });
    }
    return data;
  }, []);

  const positions = [
    { symbol: 'AAPL', direction: 'Long', qty: 50, entry: 178.50, current: 179.93, pnl: 71.50, pnlPct: '+0.8%' },
    { symbol: 'NVDA', direction: 'Short', qty: 30, entry: 495.20, current: 496.69, pnl: -44.70, pnlPct: '-0.3%' },
  ];

  const orders = [
    { id: 1, time: '09:31:12', symbol: 'AAPL', side: 'BUY', qty: 50, price: 178.50, status: 'Filled' },
    { id: 2, time: '09:45:03', symbol: 'NVDA', side: 'SELL', qty: 30, price: 495.20, status: 'Filled' },
    { id: 3, time: '10:12:44', symbol: 'MSFT', side: 'BUY', qty: 20, price: 378.90, status: 'Filled' },
    { id: 4, time: '10:30:00', symbol: 'TSLA', side: 'SELL', qty: 15, price: 248.30, status: 'Cancelled' },
    { id: 5, time: '11:02:18', symbol: 'GOOGL', side: 'BUY', qty: 25, price: 141.75, status: 'Pending' },
  ];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Wallet} title={t('nav.paperTrading', locale)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Virtual Balance', value: '$100,426.80', sub: '+$426.80 today', positive: true },
          { label: 'Open P&L', value: '+$26.80', sub: '+0.03%', positive: true },
          { label: 'Day Trades', value: '3', sub: '2 filled, 1 pending', positive: false },
          { label: 'Win Rate (30d)', value: '61.2%', sub: '42 of 68 trades', positive: true },
        ].map((m, i) => (
          <motion.div key={m.label} {...anim(i * 0.05)} className={cn(GLASS, 'p-4')}>
            <p className="text-xs text-slate-400">{m.label}</p>
            <p className={cn('mt-1 text-xl font-bold', m.positive ? 'text-emerald-400' : 'text-white')}>{m.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...anim(0.15)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-3 text-sm font-semibold text-white">P&L (30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={pnlData}>
              <defs><linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={NEON} stopOpacity={0.3} /><stop offset="100%" stopColor={NEON} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: AXIS_TEXT }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="pnl" stroke={NEON} fill="url(#pnlGrad)" name="P&L" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(0.2)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-3 text-sm font-semibold text-white">Open Positions</h3>
          <div className="space-y-3">
            {positions.map((p) => (
              <div key={p.symbol} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{p.symbol}</span>
                    <Badge variant={p.direction === 'Long' ? 'default' : 'destructive'} className={cn('text-[10px]', p.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')}>
                      {p.direction}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{p.qty} shares @ ${p.entry}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold', p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{p.pnl >= 0 ? '+' : ''}{p.pnlPct}</p>
                  <p className={cn('text-xs', p.pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70')}>{p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...anim(0.25)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-3 text-sm font-semibold text-white">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 text-left text-xs text-slate-400">Time</th>
                <th className="pb-2 text-left text-xs text-slate-400">Symbol</th>
                <th className="pb-2 text-left text-xs text-slate-400">Side</th>
                <th className="pb-2 text-right text-xs text-slate-400">Qty</th>
                <th className="pb-2 text-right text-xs text-slate-400">Price</th>
                <th className="pb-2 text-right text-xs text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/[0.04]">
                  <td className="py-2 text-slate-300">{o.time}</td>
                  <td className="py-2 font-medium text-white">{o.symbol}</td>
                  <td className="py-2"><span className={o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{o.side}</span></td>
                  <td className="py-2 text-right text-slate-300">{o.qty}</td>
                  <td className="py-2 text-right text-slate-300">${o.price}</td>
                  <td className="py-2 text-right">
                    <Badge variant={o.status === 'Filled' ? 'default' : o.status === 'Pending' ? 'secondary' : 'destructive'} className={cn('text-[10px]', o.status === 'Filled' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : o.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')}>
                      {o.status}
                    </Badge>
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
// 3. OptimizationPanel
// ═══════════════════════════════════════════════════════════════

export function OptimizationPanel() {
  const locale = useAppStore((s) => s.locale);
  const [method, setMethod] = useState('grid');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [params, setParams] = useState({
    fastMin: '5', fastMax: '30',
    slowMin: '20', slowMax: '100',
    rsiMin: '7', rsiMax: '28',
    slAtrMin: '1.0', slAtrMax: '4.0',
    tpAtrMin: '1.5', tpAtrMax: '6.0',
  });

  const updateParam = (key: string, val: string) => setParams((p) => ({ ...p, [key]: val }));

  const scatterData = useMemo(() => {
    if (!completed) return [];
    const data = [];
    for (let i = 0; i < 60; i++) {
      const fast = 5 + Math.floor(Math.sin(i * 0.5) * 12 + 13);
      const slow = 20 + Math.floor(Math.cos(i * 0.3) * 35 + 40);
      const sharpe = 0.5 + Math.sin(i * 0.7) * 1.2 + Math.cos(i * 0.4) * 0.6;
      data.push({ fast, slow, sharpe: +sharpe.toFixed(2) });
    }
    return data;
  }, [completed]);

  const bestResult = useMemo(() => {
    if (!completed) return null;
    return scatterData.reduce((best, d) => d.sharpe > (best?.sharpe || -999) ? d : best, null);
  }, [completed, scatterData]);

  const paramRows = [
    { label: 'Fast Period', minKey: 'fastMin', maxKey: 'fastMax' },
    { label: 'Slow Period', minKey: 'slowMin', maxKey: 'slowMax' },
    { label: 'RSI Period', minKey: 'rsiMin', maxKey: 'rsiMax' },
    { label: 'SL ATR Multiplier', minKey: 'slAtrMin', maxKey: 'slAtrMax' },
    { label: 'TP ATR Multiplier', minKey: 'tpAtrMin', maxKey: 'tpAtrMax' },
  ];

  const getScatterColor = (v: number) => {
    if (v >= 2.0) return '#19C37D';
    if (v >= 1.5) return '#22D3EE';
    if (v >= 1.0) return '#FBBF24';
    if (v >= 0.5) return '#F97316';
    return '#EF4444';
  };

  const handleRun = useCallback(() => {
    setRunning(true);
    setCompleted(false);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 3;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setRunning(false);
        setCompleted(true);
      }
      setProgress(Math.min(Math.round(p), 100));
    }, 250);
  }, []);

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Settings2} title={t('nav.optimization', locale)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-4 text-sm font-semibold text-white">Parameter Ranges</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Strategy</Label>
              <Select defaultValue="momentum-ema" disabled={running}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0B2239]">
                  <SelectItem value="momentum-ema">Momentum EMA Cross</SelectItem>
                  <SelectItem value="mean-revert-bb">Mean Reversion BB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator className="bg-white/[0.06]" />
            {paramRows.map((r) => (
              <div key={r.label} className="grid grid-cols-3 items-center gap-3">
                <Label className="text-xs text-slate-400">{r.label}</Label>
                <Input value={params[r.minKey as keyof typeof params]} onChange={(e) => updateParam(r.minKey, e.target.value)} placeholder="Min" className="border-white/10 bg-white/5 text-center text-xs text-white" disabled={running} />
                <Input value={params[r.maxKey as keyof typeof params]} onChange={(e) => updateParam(r.maxKey, e.target.value)} placeholder="Max" className="border-white/10 bg-white/5 text-center text-xs text-white" disabled={running} />
              </div>
            ))}
            <Separator className="bg-white/[0.06]" />
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Method</Label>
              <Select value={method} onValueChange={setMethod} disabled={running}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0B2239]">
                  <SelectItem value="grid">Grid Search</SelectItem>
                  <SelectItem value="random">Random Search</SelectItem>
                  <SelectItem value="bayesian">Bayesian Optimization</SelectItem>
                  <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {running && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{locale === 'fa' ? 'در حال بهینه‌سازی...' : 'Optimizing...'}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/10" />
              </div>
            )}
            {completed && bestResult && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">
                  {locale === 'fa' ? 'بهینه‌سازی کامل شد — بهترین Sharpe: ' : 'Optimization complete — Best Sharpe: '}
                  <span className="font-bold">{bestResult.sharpe}</span> (Fast: {bestResult.fast}, Slow: {bestResult.slow})
                </span>
              </div>
            )}
            <Button className="w-full" style={{ background: NEON }} onClick={handleRun} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? (locale === 'fa' ? 'در حال اجرا...' : 'Optimizing...') : (locale === 'fa' ? 'اجرای بهینه‌سازی' : 'Run Optimization')}
            </Button>
          </div>
        </motion.div>

        <motion.div {...anim(0.2)} className={cn(GLASS, 'p-5')}>
          {!completed && !running && (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center text-center">
              <Settings2 className="mb-3 h-10 w-10 text-white/10" />
              <p className="text-sm text-slate-500">{locale === 'fa' ? 'تنظیمات را وارد کرده و بهینه‌سازی را اجرا کنید' : 'Set parameter ranges and run optimization'}</p>
            </div>
          )}
          {running && (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center text-center">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#19C37D]/50" />
              <p className="text-sm text-slate-400">{locale === 'fa' ? 'در حال بررسی پارامترها...' : 'Testing parameter combinations...'}</p>
              <p className="mt-1 text-xs text-slate-500">Progress: {progress}%</p>
            </div>
          )}
          {completed && scatterData.length > 0 && (
            <>
              <h3 className="mb-3 text-sm font-semibold text-white">Parameter Surface (Sharpe Ratio)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="fast" name="Fast Period" tick={{ fontSize: 10, fill: AXIS_TEXT }} label={{ value: 'Fast Period', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: AXIS_TEXT } }} />
                  <YAxis dataKey="slow" name="Slow Period" tick={{ fontSize: 10, fill: AXIS_TEXT }} label={{ value: 'Slow Period', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: AXIS_TEXT } }} />
                  <ZAxis dataKey="sharpe" range={[40, 400]} name="Sharpe" />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-white/10 px-3 py-2 shadow-2xl" style={{ background: TOOLTIP_BG }}>
                        <p className="text-[11px]" style={{ color: AXIS_TEXT }}>Fast: {d.fast} / Slow: {d.slow}</p>
                        <p className="text-sm font-medium" style={{ color: getScatterColor(d.sharpe) }}>Sharpe: {d.sharpe}</p>
                      </div>
                    );
                  }} />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, idx) => (
                      <Cell key={idx} fill={getScatterColor(entry.sharpe)} fillOpacity={0.7} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#19C37D' }} /> ≥ 2.0</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#22D3EE' }} /> ≥ 1.5</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#FBBF24' }} /> ≥ 1.0</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#F97316' }} /> ≥ 0.5</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#EF4444' }} /> &lt; 0.5</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. WalkForwardPanel
// ═══════════════════════════════════════════════════════════════

export function WalkForwardPanel() {
  const locale = useAppStore((s) => s.locale);

  const wfData = [
    { window: 'W1', isPeriod: 'Jan–Mar 2023', oosPeriod: 'Apr–Jun 2023', isSharpe: '2.15', oosSharpe: '1.87', isCagr: '22.4%', oosCagr: '18.1%', isMaxDD: '-7.2%', oosMaxDD: '-9.8%', isWR: '64.2%', oosWR: '59.8%' },
    { window: 'W2', isPeriod: 'Apr–Jun 2023', oosPeriod: 'Jul–Sep 2023', isSharpe: '1.98', oosSharpe: '1.72', isCagr: '19.8%', oosCagr: '16.5%', isMaxDD: '-8.5%', oosMaxDD: '-11.3%', isWR: '61.5%', oosWR: '57.2%' },
    { window: 'W3', isPeriod: 'Jul–Sep 2023', oosPeriod: 'Oct–Dec 2023', isSharpe: '2.31', oosSharpe: '2.05', isCagr: '25.1%', oosCagr: '21.3%', isMaxDD: '-6.8%', oosMaxDD: '-8.9%', isWR: '66.1%', oosWR: '62.4%' },
    { window: 'W4', isPeriod: 'Oct–Dec 2023', oosPeriod: 'Jan–Mar 2024', isSharpe: '2.08', oosSharpe: '1.65', isCagr: '20.3%', oosCagr: '14.7%', isMaxDD: '-9.1%', oosMaxDD: '-13.5%', isWR: '60.8%', oosWR: '55.1%' },
    { window: 'W5', isPeriod: 'Jan–Mar 2024', oosPeriod: 'Apr–Jun 2024', isSharpe: '2.45', oosSharpe: '2.18', isCagr: '27.6%', oosCagr: '23.4%', isMaxDD: '-5.9%', oosMaxDD: '-7.6%', isWR: '68.3%', oosWR: '64.7%' },
  ];

  const barData = wfData.map((w) => ({
    window: w.window,
    'IS Sharpe': parseFloat(w.isSharpe),
    'OOS Sharpe': parseFloat(w.oosSharpe),
    'IS CAGR': parseFloat(w.isCagr),
    'OOS CAGR': parseFloat(w.oosCagr),
    'IS MaxDD': parseFloat(w.isMaxDD),
    'OOS MaxDD': parseFloat(w.oosMaxDD),
  }));

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Footprints} title={t('nav.walkForward', locale)} />

      <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-4 text-sm font-semibold text-white">IS/OOS Window Configuration</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">IS Window Size</Label>
            <Input defaultValue="3 months" className="border-white/10 bg-white/5 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">OOS Window Size</Label>
            <Input defaultValue="3 months" className="border-white/10 bg-white/5 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Step Size</Label>
            <Input defaultValue="3 months" className="border-white/10 bg-white/5 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Anchoring</Label>
            <Select defaultValue="rolling">
              <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0B2239]">
                <SelectItem value="rolling">Rolling</SelectItem>
                <SelectItem value="expanding">Expanding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <motion.div {...anim(0.15)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-4 text-sm font-semibold text-white">Walk-Forward Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 text-left text-xs text-slate-400">Window</th>
                <th className="pb-2 text-left text-xs text-slate-400">In-Sample</th>
                <th className="pb-2 text-left text-xs text-slate-400">Out-of-Sample</th>
                <th className="pb-2 text-right text-xs text-emerald-400">IS Sharpe</th>
                <th className="pb-2 text-right text-xs text-cyan-400">OOS Sharpe</th>
                <th className="pb-2 text-right text-xs text-emerald-400">IS CAGR</th>
                <th className="pb-2 text-right text-xs text-cyan-400">OOS CAGR</th>
                <th className="pb-2 text-right text-xs text-emerald-400">IS MaxDD</th>
                <th className="pb-2 text-right text-xs text-cyan-400">OOS MaxDD</th>
              </tr>
            </thead>
            <tbody>
              {wfData.map((w) => (
                <tr key={w.window} className="border-b border-white/[0.04]">
                  <td className="py-2.5 font-medium text-white">{w.window}</td>
                  <td className="py-2.5 text-slate-400">{w.isPeriod}</td>
                  <td className="py-2.5 text-slate-400">{w.oosPeriod}</td>
                  <td className="py-2.5 text-right text-emerald-400">{w.isSharpe}</td>
                  <td className="py-2.5 text-right text-cyan-400">{w.oosSharpe}</td>
                  <td className="py-2.5 text-right text-emerald-400">{w.isCagr}</td>
                  <td className="py-2.5 text-right text-cyan-400">{w.oosCAGR}</td>
                  <td className="py-2.5 text-right text-emerald-400">{w.isMaxDD}</td>
                  <td className="py-2.5 text-right text-cyan-400">{w.oosMaxDD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div {...anim(0.2)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-3 text-sm font-semibold text-white">IS vs OOS Comparison</h3>
        <Tabs defaultValue="sharpe">
          <TabsList className="border-white/10 bg-white/5">
            <TabsTrigger value="sharpe" className="text-xs">Sharpe Ratio</TabsTrigger>
            <TabsTrigger value="cagr" className="text-xs">CAGR</TabsTrigger>
            <TabsTrigger value="maxdd" className="text-xs">Max Drawdown</TabsTrigger>
          </TabsList>
          <TabsContent value="sharpe">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="window" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
                <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="IS Sharpe" fill={NEON} radius={[4, 4, 0, 0]} />
                <Bar dataKey="OOS Sharpe" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="cagr">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="window" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
                <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="IS CAGR" fill={NEON} radius={[4, 4, 0, 0]} />
                <Bar dataKey="OOS CAGR" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="maxdd">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="window" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
                <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="IS MaxDD" fill={NEON} radius={[4, 4, 0, 0]} />
                <Bar dataKey="OOS MaxDD" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </motion.div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. MonteCarloPanel
// ═══════════════════════════════════════════════════════════════

export function MonteCarloPanel() {
  const locale = useAppStore((s) => s.locale);
  const [simulations, setSimulations] = useState(1000);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeHorizon, setTimeHorizon] = useState('5y');

  const fanData = useMemo(() => {
    if (!completed) return [];
    const data = [];
    for (let i = 0; i <= 60; i++) {
      const base = 100000 * Math.pow(1.0025, i);
      const p5 = base * (1 - 0.18 - Math.sin(i * 0.1) * 0.05);
      const p25 = base * (1 - 0.08 - Math.sin(i * 0.08) * 0.03);
      const p50 = base * (1 + Math.sin(i * 0.05) * 0.01);
      const p75 = base * (1 + 0.1 + Math.cos(i * 0.06) * 0.04);
      const p95 = base * (1 + 0.25 + Math.cos(i * 0.12) * 0.06);
      data.push({ month: i, p5: Math.round(p5), p25: Math.round(p25), p50: Math.round(p50), p75: Math.round(p75), p95: Math.round(p95) });
    }
    return data;
  }, [completed]);

  const handleRun = useCallback(() => {
    setRunning(true);
    setCompleted(false);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 10 + 3;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setRunning(false);
        setCompleted(true);
      }
      setProgress(Math.min(Math.round(p), 100));
    }, 200);
  }, []);

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={Dice5} title={t('nav.monteCarlo', locale)} />

      <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Configuration</h3>
          <span className="text-xs text-slate-400">Simulations: <span className="font-bold text-white">{simulations.toLocaleString()}</span></span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0 text-xs text-slate-400">Simulations</Label>
            <input type="range" min={100} max={10000} step={100} value={simulations} onChange={(e) => setSimulations(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#19C37D]" disabled={running} />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0 text-xs text-slate-400">Time Horizon</Label>
            <Select value={timeHorizon} onValueChange={setTimeHorizon} disabled={running}>
              <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0B2239]">
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="3y">3 Years</SelectItem>
                <SelectItem value="5y">5 Years</SelectItem>
                <SelectItem value="10y">10 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {running && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{locale === 'fa' ? 'در حال شبیه‌سازی...' : 'Simulating...'} ({Math.round(progress * simulations / 100).toLocaleString()} / {simulations.toLocaleString()})</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
            </div>
          )}
          {completed && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">{locale === 'fa' ? `شبیه‌سازی مونت‌کارلو با ${simulations.toLocaleString()} اجرا انجام شد` : `Monte Carlo simulation completed with ${simulations.toLocaleString()} runs`}</span>
            </div>
          )}
          <Button className="w-full" style={{ background: NEON }} onClick={handleRun} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? (locale === 'fa' ? 'در حال شبیه‌سازی...' : 'Simulating...') : (locale === 'fa' ? 'اجرای شبیه‌سازی مونت‌کارلو' : 'Run Monte Carlo Simulation')}
          </Button>
        </div>
      </motion.div>

      <motion.div {...anim(0.15)} className={cn(GLASS, 'p-5')}>
        {!completed && !running && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <Dice5 className="mb-3 h-10 w-10 text-white/10" />
            <p className="text-sm text-slate-500">{locale === 'fa' ? 'تعداد شبیه‌سازی‌ها را تنظیم و اجرا کنید' : 'Set simulation count and run Monte Carlo analysis'}</p>
          </div>
        )}
        {running && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#19C37D]/50" />
            <p className="text-sm text-slate-400">{locale === 'fa' ? 'در حال تولید مسیرهای تصادفی...' : 'Generating random equity paths...'}</p>
          </div>
        )}
        {completed && fanData.length > 0 && (
          <>
            <h3 className="mb-3 text-sm font-semibold text-white">Equity Fan Chart (Percentile Paths)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={fanData}>
                <defs><linearGradient id="fanGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={NEON} stopOpacity={0.15} /><stop offset="100%" stopColor={NEON} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: AXIS_TEXT }} label={{ value: 'Months', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: AXIS_TEXT } }} />
                <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="p95" stroke={NEON} strokeOpacity={0.2} dot={false} name="95th %ile" />
                <Line type="monotone" dataKey="p75" stroke={NEON} strokeOpacity={0.35} dot={false} name="75th %ile" />
                <Line type="monotone" dataKey="p50" stroke={NEON} strokeOpacity={0.9} dot={false} strokeWidth={2} name="50th %ile" />
                <Line type="monotone" dataKey="p25" stroke={NEON} strokeOpacity={0.35} dot={false} name="25th %ile" />
                <Line type="monotone" dataKey="p5" stroke={NEON} strokeOpacity={0.2} dot={false} name="5th %ile" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </motion.div>

      {completed && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Expected CAGR', value: '18.4%', sub: 'Median of all paths', color: 'text-emerald-400' },
            { label: 'Expected Max DD', value: '-15.7%', sub: 'Median worst drawdown', color: 'text-red-400' },
            { label: 'Probability of Ruin', value: '2.3%', sub: 'Capital drops below 50%', color: 'text-amber-400' },
          ].map((m, i) => (
            <motion.div key={m.label} {...anim(0.2 + i * 0.05)} className={cn(GLASS, 'p-4 text-center')}>
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className={cn('mt-1 text-2xl font-bold', m.color)}>{m.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{m.sub}</p>
            </motion.div>
          ))}
        </div>
      )}
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. StressTestPanel
// ═══════════════════════════════════════════════════════════════

export function StressTestPanel() {
  const locale = useAppStore((s) => s.locale);

  const scenarios = [
    {
      name: 'Market Crash -30%',
      icon: TrendingDown,
      desc: 'Sudden 30% market decline over 5 trading days',
      impacts: [
        { label: 'Portfolio Loss', value: '-22.4%', bad: true },
        { label: 'Max Drawdown', value: '-28.1%', bad: true },
        { label: 'Recovery Days', value: '87', bad: false },
        { label: 'Survival', value: 'Yes', bad: false },
      ],
    },
    {
      name: 'Volatility Spike +200%',
      icon: Activity,
      desc: 'VIX triples from 18 to 54 over 2 weeks',
      impacts: [
        { label: 'Portfolio Loss', value: '-14.7%', bad: true },
        { label: 'Max Drawdown', value: '-19.3%', bad: true },
        { label: 'Whipsaw Trades', value: '+340%', bad: true },
        { label: 'Survival', value: 'Yes', bad: false },
      ],
    },
    {
      name: 'Interest Rate Hike',
      icon: ArrowUpRight,
      desc: 'Fed raises rates by 200bps in a single meeting',
      impacts: [
        { label: 'Portfolio Loss', value: '-8.2%', bad: true },
        { label: 'Max Drawdown', value: '-12.5%', bad: true },
        { label: 'Beta Impact', value: '-0.34', bad: true },
        { label: 'Survival', value: 'Yes', bad: false },
      ],
    },
    {
      name: 'Gap Down -5%',
      icon: ArrowDownRight,
      desc: 'Overnight gap down of 5% on major holdings',
      impacts: [
        { label: 'Portfolio Loss', value: '-6.8%', bad: true },
        { label: 'Stop Loss Triggered', value: '3 of 5', bad: true },
        { label: 'Slippage Cost', value: '-$2,340', bad: true },
        { label: 'Survival', value: 'Yes', bad: false },
      ],
    },
  ];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={AlertTriangle} title={t('nav.stressTest', locale)} />

      <div className="grid gap-4 sm:grid-cols-2">
        {scenarios.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.name} {...anim(i * 0.08)} className={cn(GLASS, 'p-5')}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15">
                  <Icon className="h-4.5 w-4.5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                  <p className="text-[11px] text-slate-500">{s.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {s.impacts.map((imp) => (
                  <div key={imp.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <p className="text-[10px] text-slate-500">{imp.label}</p>
                    <p className={cn('mt-0.5 text-sm font-semibold', imp.bad ? (imp.label === 'Survival' ? 'text-emerald-400' : 'text-red-400') : 'text-slate-300')}>{imp.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. ParameterAnalysisPanel
// ═══════════════════════════════════════════════════════════════

export function ParameterAnalysisPanel() {
  const locale = useAppStore((s) => s.locale);

  const sensitivityData = [
    { param: 'Fast EMA Period', best: '12', median: '15', worst: '8', score: 0.72, range: '10–18' },
    { param: 'Slow EMA Period', best: '26', median: '30', worst: '45', score: 0.65, range: '22–34' },
    { param: 'RSI Period', best: '14', median: '14', worst: '7', score: 0.81, range: '12–16' },
    { param: 'SL ATR Multiple', best: '2.0', median: '2.5', worst: '1.0', score: 0.58, range: '1.5–3.0' },
    { param: 'TP ATR Multiple', best: '3.0', median: '3.5', worst: '6.0', score: 0.69, range: '2.5–4.0' },
  ];

  const rsiPeriods = [7, 10, 12, 14, 16, 18, 21, 25, 28];
  const slAtrValues = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

  const heatmap = useMemo(() => {
    const map: Record<string, number> = {};
    rsiPeriods.forEach((r, ri) => {
      slAtrValues.forEach((s, si) => {
        const key = `${ri}-${si}`;
        const base = 2.0 + Math.sin((r + s) * 0.3) * 1.2 - Math.abs(r - 14) * 0.08 - Math.abs(s - 2.0) * 0.15;
        map[key] = Math.max(-0.5, +base.toFixed(2));
      });
    });
    return map;
  }, []);

  const getHeatColor = (v: number) => {
    if (v >= 2.5) return 'rgba(25,195,125,0.7)';
    if (v >= 2.0) return 'rgba(25,195,125,0.5)';
    if (v >= 1.5) return 'rgba(25,195,125,0.3)';
    if (v >= 1.0) return 'rgba(251,191,36,0.4)';
    if (v >= 0.5) return 'rgba(249,115,22,0.4)';
    return 'rgba(239,68,68,0.5)';
  };

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={SlidersHorizontal} title={t('nav.parameterAnalysis', locale)} />

      <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-4 text-sm font-semibold text-white">Parameter Sensitivity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 text-left text-xs text-slate-400">Parameter</th>
                <th className="pb-2 text-center text-xs text-slate-400">Best Value</th>
                <th className="pb-2 text-center text-xs text-slate-400">Median</th>
                <th className="pb-2 text-center text-xs text-slate-400">Worst</th>
                <th className="pb-2 text-center text-xs text-slate-400">Sensitivity</th>
                <th className="pb-2 text-center text-xs text-slate-400">Robust Range</th>
              </tr>
            </thead>
            <tbody>
              {sensitivityData.map((row) => (
                <tr key={row.param} className="border-b border-white/[0.04]">
                  <td className="py-2.5 text-white">{row.param}</td>
                  <td className="py-2.5 text-center font-medium text-emerald-400">{row.best}</td>
                  <td className="py-2.5 text-center text-slate-300">{row.median}</td>
                  <td className="py-2.5 text-center text-red-400">{row.worst}</td>
                  <td className="py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={row.score * 100} className="h-1.5 w-16" />
                      <span className="text-xs text-slate-400">{(row.score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-xs font-medium text-cyan-400">{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div {...anim(0.15)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-4 text-sm font-semibold text-white">Sharpe Ratio Heatmap: RSI Period × Stop Loss ATR</h3>
        <div className="overflow-x-auto">
          <div className="inline-grid min-w-full gap-0.5" style={{ gridTemplateColumns: `80px repeat(${slAtrValues.length}, minmax(0, 1fr))` }}>
            <div />
            {slAtrValues.map((s) => (
              <div key={s} className="text-center text-[10px] font-medium text-slate-400">SL {s}</div>
            ))}
            {rsiPeriods.map((r, ri) => (
              <React.Fragment key={r}>
                <div className="flex items-center text-xs text-slate-400">RSI {r}</div>
                {slAtrValues.map((s, si) => {
                  const val = heatmap[`${ri}-${si}`] || 0;
                  return (
                    <TooltipProvider key={`${r}-${s}`}>
                      <ShTooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex h-10 min-w-[52px] cursor-default items-center justify-center rounded text-[11px] font-medium text-white"
                            style={{ background: getHeatColor(val) }}
                          >
                            {val.toFixed(1)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="border-white/10 bg-[#0B2239] text-xs text-slate-300">
                          RSI: {r}, SL ATR: {s} → Sharpe: {val.toFixed(2)}
                        </TooltipContent>
                      </ShTooltip>
                    </TooltipProvider>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8. StrategyComparisonPanel
// ═══════════════════════════════════════════════════════════════

export function StrategyComparisonPanel() {
  const locale = useAppStore((s) => s.locale);

  type MVal = string | number;
  const metrics: { key: string; label: string; higherBetter: boolean; fmt?: (v: number) => string }[] = [
    { key: 'return', label: t('metric.totalReturn', locale), higherBetter: true },
    { key: 'cagr', label: t('metric.cagr', locale), higherBetter: true },
    { key: 'sharpe', label: t('metric.sharpe', locale), higherBetter: true },
    { key: 'sortino', label: t('metric.sortino', locale), higherBetter: true },
    { key: 'maxDD', label: t('metric.maxDrawdown', locale), higherBetter: false },
    { key: 'winRate', label: t('metric.winRate', locale), higherBetter: true },
    { key: 'pf', label: t('metric.profitFactor', locale), higherBetter: true },
    { key: 'expectancy', label: t('metric.expectancy', locale), higherBetter: true },
    { key: 'volatility', label: t('metric.volatility', locale), higherBetter: false },
    { key: 'calmar', label: t('metric.calmar', locale), higherBetter: true },
  ];

  const strategies: Record<string, Record<string, MVal>> = {
    'Momentum EMA': { return: '32.4%', cagr: 18.7, sharpe: 2.34, sortino: 3.12, maxDD: '-8.3%', winRate: '62.5%', pf: 2.15, expectancy: '$42.50', volatility: 12.4, calmar: 2.25 },
    'Mean Reversion BB': { return: '24.1%', cagr: 14.2, sharpe: 1.89, sortino: 2.45, maxDD: '-12.7%', winRate: '58.1%', pf: 1.78, expectancy: '$31.20', volatility: 15.8, calmar: 1.12 },
    'Breakout ATR v2': { return: '45.2%', cagr: 24.3, sharpe: 1.56, sortino: 1.98, maxDD: '-22.4%', winRate: '48.7%', pf: 1.92, expectancy: '$58.70', volatility: 22.1, calmar: 1.08 },
    'RSI Divergence': { return: '18.6%', cagr: 11.5, sharpe: 1.72, sortino: 2.18, maxDD: '-10.1%', winRate: '55.3%', pf: 1.65, expectancy: '$24.80', volatility: 13.2, calmar: 1.14 },
  };

  const stratNames = Object.keys(strategies);

  const getBestIdx = (mKey: string) => {
    const m = metrics.find((m) => m.key === mKey);
    if (!m) return -1;
    let bestIdx = 0;
    let bestVal = -Infinity;
    stratNames.forEach((name, idx) => {
      const raw = strategies[name][mKey];
      let num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return;
      if (!m.higherBetter) num = -num;
      if (num > bestVal) { bestVal = num; bestIdx = idx; }
    });
    return bestIdx;
  };

  const radarData = [
    { dim: 'Sharpe', 'Momentum EMA': 2.34, 'Mean Reversion BB': 1.89, 'Breakout ATR v2': 1.56 },
    { dim: 'Sortino', 'Momentum EMA': 3.12, 'Mean Reversion BB': 2.45, 'Breakout ATR v2': 1.98 },
    { dim: 'Win Rate', 'Momentum EMA': 62.5, 'Mean Reversion BB': 58.1, 'Breakout ATR v2': 48.7 },
    { dim: 'CAGR', 'Momentum EMA': 18.7, 'Mean Reversion BB': 14.2, 'Breakout ATR v2': 24.3 },
    { dim: 'PF', 'Momentum EMA': 2.15, 'Mean Reversion BB': 1.78, 'Breakout ATR v2': 1.92 },
    { dim: 'Calmar', 'Momentum EMA': 2.25, 'Mean Reversion BB': 1.12, 'Breakout ATR v2': 1.08 },
  ];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={GitCompareArrows} title={t('nav.strategyComparison', locale)} />

      <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-4 text-sm font-semibold text-white">Metrics Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 text-left text-xs text-slate-400">Metric</th>
                {stratNames.map((n) => (
                  <th key={n} className="pb-2 text-right text-xs font-medium text-white">{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const bestIdx = getBestIdx(m.key);
                return (
                  <tr key={m.key} className="border-b border-white/[0.04]">
                    <td className="py-2.5 text-slate-400">{m.label}</td>
                    {stratNames.map((name, idx) => (
                      <td key={name} className={cn('py-2.5 text-right', idx === bestIdx ? 'font-semibold text-emerald-400' : 'text-slate-300')}>
                        {strategies[name][m.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div {...anim(0.15)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-3 text-sm font-semibold text-white">Radar Comparison</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: AXIS_TEXT }} />
            <Radar name="Momentum EMA" dataKey="Momentum EMA" stroke={NEON} fill={NEON} fillOpacity={0.15} strokeWidth={2} />
            <Radar name="Mean Reversion BB" dataKey="Mean Reversion BB" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.1} strokeWidth={2} />
            <Radar name="Breakout ATR v2" dataKey="Breakout ATR v2" stroke="#FBBF24" fill="#FBBF24" fillOpacity={0.1} strokeWidth={2} />
            <Tooltip content={<ChartTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: NEON }} />Momentum EMA</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#22D3EE' }} />Mean Reversion BB</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FBBF24' }} />Breakout ATR v2</span>
        </div>
      </motion.div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 9. RiskAnalysisPanel
// ═══════════════════════════════════════════════════════════════

export function RiskAnalysisPanel() {
  const locale = useAppStore((s) => s.locale);
  const riskScore = 42;
  const riskLevel = riskScore <= 30 ? t('risk.low', locale) : riskScore <= 60 ? t('risk.moderate', locale) : riskScore <= 80 ? t('risk.high', locale) : t('risk.extreme', locale);
  const riskColor = riskScore <= 30 ? '#19C37D' : riskScore <= 60 ? '#FBBF24' : riskScore <= 80 ? '#F97316' : '#EF4444';

  const riskCards = [
    { label: t('metric.var', locale), value: '-$4,230', sub: '95% confidence, 1-day', icon: ShieldCheck, color: '#22D3EE' },
    { label: t('metric.cvar', locale), value: '-$6,870', sub: 'Expected shortfall', icon: ShieldCheck, color: '#F97316' },
    { label: t('metric.riskOfRuin', locale), value: '2.3%', sub: 'Kelly criterion', icon: ShieldCheck, color: '#EF4444' },
    { label: t('metric.maxDrawdown', locale), value: '-12.4%', sub: 'Historical maximum', icon: TrendingDown, color: '#FBBF24' },
    { label: t('metric.volatility', locale), value: '14.2%', sub: 'Annualized', icon: Activity, color: '#A78BFA' },
    { label: t('metric.beta', locale), value: '0.78', sub: 'vs SPY benchmark', icon: BarChart3, color: '#19C37D' },
  ];

  const ddDistData = [
    { range: '0-2%', count: 18 },
    { range: '2-4%', count: 14 },
    { range: '4-6%', count: 10 },
    { range: '6-8%', count: 8 },
    { range: '8-10%', count: 5 },
    { range: '10-12%', count: 3 },
    { range: '12-14%', count: 2 },
    { range: '14%+', count: 1 },
  ];

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={ShieldCheck} title={t('nav.riskAnalysis', locale)} />

      <motion.div {...anim(0.1)} className={cn(GLASS, 'flex flex-col items-center p-8')}>
        <h3 className="mb-6 text-sm font-semibold text-white">{t('risk.score', locale)}</h3>
        <div className="relative flex h-40 w-56 items-end justify-center overflow-hidden">
          <svg viewBox="0 0 200 110" className="h-full w-full">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={riskColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(riskScore / 100) * 251.3} 251.3`} />
          </svg>
          <div className="absolute bottom-2 flex flex-col items-center">
            <span className="text-4xl font-bold" style={{ color: riskColor }}>{riskScore}</span>
            <span className="text-xs font-medium" style={{ color: riskColor }}>{riskLevel}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-xs text-slate-500">
          <span>0 <span className="text-emerald-400">Low</span></span>
          <span>50 <span className="text-amber-400">Moderate</span></span>
          <span>100 <span className="text-red-400">Extreme</span></span>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {riskCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} {...anim(0.15 + i * 0.04)} className={cn(GLASS, 'flex items-start gap-3 p-4')}>
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c.color}15` }}>
                <Icon className="h-4 w-4" style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">{c.label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{c.value}</p>
                <p className="text-[10px] text-slate-500">{c.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div {...anim(0.3)} className={cn(GLASS, 'p-5')}>
        <h3 className="mb-3 text-sm font-semibold text-white">Drawdown Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ddDistData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
            <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" name="Occurrences" radius={[4, 4, 0, 0]}>
              {ddDistData.map((_, idx) => (
                <Cell key={idx} fill={idx < 4 ? NEON : idx < 6 ? '#FBBF24' : '#EF4444'} fillOpacity={0.7 + idx * 0.03} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
      <Disclaimer />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 10. TradeAnalysisPanel
// ═══════════════════════════════════════════════════════════════

export function TradeAnalysisPanel() {
  const locale = useAppStore((s) => s.locale);

  const winLossData = [
    { name: '0-0.5R', wins: 12, losses: 8 },
    { name: '0.5-1R', wins: 18, losses: 10 },
    { name: '1-2R', wins: 22, losses: 7 },
    { name: '2-3R', wins: 14, losses: 4 },
    { name: '3-5R', wins: 8, losses: 2 },
    { name: '5R+', wins: 4, losses: 1 },
  ];

  const rMultipleData = [
    { range: '-4R', count: 3 },
    { range: '-3R', count: 5 },
    { range: '-2R', count: 8 },
    { range: '-1R', count: 14 },
    { range: '0R', count: 6 },
    { range: '1R', count: 18 },
    { range: '2R', count: 22 },
    { range: '3R', count: 12 },
    { range: '4R', count: 8 },
    { range: '5R+', count: 5 },
  ];

  const holdingTimeData = [
    { range: '< 1h', count: 8 },
    { range: '1-4h', count: 14 },
    { range: '4-24h', count: 22 },
    { range: '1-3d', count: 28 },
    { range: '3-7d', count: 16 },
    { range: '7-14d', count: 8 },
    { range: '14d+', count: 4 },
  ];

  const cumPnlData = useMemo(() => {
    const data = [];
    let cum = 0;
    for (let i = 1; i <= 50; i++) {
      const pnl = (Math.sin(i * 0.9) * 300 + Math.cos(i * 0.4) * 200 + i * 8);
      cum += pnl;
      data.push({ trade: `#${i}`, pnl: Math.round(cum) });
    }
    return data;
  }, []);

  return (
    <motion.div {...anim()} className="space-y-5 p-4 md:p-6">
      <PanelTitle icon={BarChart3} title={t('nav.tradeAnalysis', locale)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...anim(0.1)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-3 text-sm font-semibold text-white">Win / Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winLossData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="wins" name="Wins" fill={NEON} radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" name="Losses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(0.15)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-3 text-sm font-semibold text-white">R-Multiple Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rMultipleData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
                {rMultipleData.map((d, idx) => (
                  <Cell key={idx} fill={d.range.startsWith('-') ? '#EF4444' : d.range === '0R' ? '#64748B' : NEON} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...anim(0.2)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-3 text-sm font-semibold text-white">Holding Time Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={holdingTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Trades" fill={NEON} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(0.25)} className={cn(GLASS, 'p-5')}>
          <h3 className="mb-3 text-sm font-semibold text-white">Cumulative P&L Per Trade</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={cumPnlData}>
              <defs><linearGradient id="cumPnlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={NEON} stopOpacity={0.2} /><stop offset="100%" stopColor={NEON} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="trade" tick={{ fontSize: 9, fill: AXIS_TEXT }} interval={9} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_TEXT }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="pnl" name="Cum. P&L" stroke={NEON} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      <Disclaimer />
    </motion.div>
  );
}
