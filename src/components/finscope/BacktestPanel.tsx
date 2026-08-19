'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Search,
  Loader2,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  Timer,
  Gauge,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const EXCHANGES = ['NASDAQ', 'NYSE', 'BSE', 'LSE', 'Forex', 'Binance', 'Bybit', 'Other'];

const ASSETS = ['stock', 'etf', 'forex', 'crypto', 'commodity', 'index', 'bond', 'future'];

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'IRR', 'BTC', 'USDT'];

const STRATEGY_TYPES = [
  'MA Crossover',
  'RSI Reversal',
  'Bollinger Bounce',
  'Trend Following',
  'Momentum Breakout',
];

const STAGES = [
  'backtest.progress.loading',
  'backtest.progress.validating',
  'backtest.progress.simulating',
  'backtest.progress.calculating',
  'backtest.progress.generating',
];

interface Preset {
  name: string;
  key: string;
  icon: React.ReactNode;
  params: {
    fastPeriod?: number;
    slowPeriod?: number;
    rsiPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    stopLossATR?: number;
    takeProfitATR?: number;
    commission?: number;
    slippage?: number;
    leverage?: number;
  };
}

const PRESETS: Preset[] = [
  {
    name: 'backtest.preset.conservative',
    key: 'conservative',
    icon: <Shield className="h-3.5 w-3.5" />,
    params: { fastPeriod: 20, slowPeriod: 50, rsiPeriod: 14, rsiOverbought: 75, rsiOversold: 25, stopLossATR: 3, takeProfitATR: 5, commission: 0.1, slippage: 0.05, leverage: 1 },
  },
  {
    name: 'backtest.preset.moderate',
    key: 'moderate',
    icon: <Gauge className="h-3.5 w-3.5" />,
    params: { fastPeriod: 12, slowPeriod: 26, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossATR: 2, takeProfitATR: 3, commission: 0.1, slippage: 0.05, leverage: 1 },
  },
  {
    name: 'backtest.preset.aggressive',
    key: 'aggressive',
    icon: <Zap className="h-3.5 w-3.5" />,
    params: { fastPeriod: 5, slowPeriod: 13, rsiPeriod: 7, rsiOverbought: 80, rsiOversold: 20, stopLossATR: 1, takeProfitATR: 2, commission: 0.05, slippage: 0.02, leverage: 3 },
  },
  {
    name: 'backtest.preset.scalping',
    key: 'scalping',
    icon: <Timer className="h-3.5 w-3.5" />,
    params: { fastPeriod: 3, slowPeriod: 8, rsiPeriod: 5, rsiOverbought: 75, rsiOversold: 25, stopLossATR: 0.5, takeProfitATR: 1, commission: 0.05, slippage: 0.02, leverage: 5 },
  },
  {
    name: 'backtest.preset.swing',
    key: 'swing',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    params: { fastPeriod: 10, slowPeriod: 30, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossATR: 2, takeProfitATR: 4, commission: 0.1, slippage: 0.05, leverage: 2 },
  },
];

const GLASS_CARD = 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl';
const GLASS_INPUT = 'bg-white/[0.05] border-white/[0.1] text-foreground';

// ═══════════════════════════════════════════════════════════════
// GlassCard wrapper
// ═══════════════════════════════════════════════════════════════

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(GLASS_CARD, 'p-4', className)}>{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Progress Overlay
// ═══════════════════════════════════════════════════════════════

function ProgressOverlay({
  progress,
  stage,
  elapsed,
  remaining,
}: {
  progress: number;
  stage: string;
  elapsed: number;
  remaining: number;
}) {
  const locale = useAppStore((s) => s.locale);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071A2B]/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(GLASS_CARD, 'w-full max-w-md p-8 space-y-6')}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-[#19C37D]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t('backtest.running', locale)}
            </h3>
            <p className="text-sm text-white/50">{t(stage, locale)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/40">
            <span>{Math.round(progress)}%</span>
            <span>
              {t('backtest.elapsed', locale)}: {formatTime(elapsed)}
            </span>
          </div>
          <Progress value={progress} className="h-2 [&>div]:bg-[#19C37D] [&>div]:transition-all" />
          <div className="flex justify-between text-xs text-white/40">
            <span>{t('backtest.remaining', locale)}: {formatTime(remaining)}</span>
            <span className="text-[#19C37D]">
              {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                  {stage === s && (
                    <>
                      {STAGES.slice(0, i).map((_, j) => (
                        <span key={j} className="text-[#19C37D]">●</span>
                      ))}
                      <span className="text-[#19C37D] animate-pulse">●</span>
                      {STAGES.slice(i + 1).map((_, j) => (
                        <span key={j + i + 1} className="text-white/20">●</span>
                      ))}
                    </>
                  )}
                </React.Fragment>
              ))}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Success Card (MODE B)
// ═══════════════════════════════════════════════════════════════

function SuccessCard() {
  const locale = useAppStore((s) => s.locale);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className={cn(GLASS_CARD, 'p-10 text-center space-y-4 max-w-sm')}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        >
          <CheckCircle2 className="h-16 w-16 text-[#19C37D] mx-auto" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white">
          {t('backtest.complete', locale)}
        </h2>
        <p className="text-sm text-white/50">
          {t('results.switching', locale)}
        </p>
        <div className="pt-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#19C37D] mx-auto" />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main BacktestPanel Component
// ═══════════════════════════════════════════════════════════════

export default function BacktestPanel() {
  const {
    locale,
    backtestConfig,
    setBacktestConfig,
    backtestResult,
    setBacktestResult,
    backtestRunning,
    setBacktestRunning,
    backtestProgress,
    setBacktestProgress,
    backtestStage,
    setBacktestStage,
    setActivePage,
  } = useAppStore();

  const [strategyType, setStrategyType] = useState('MA Crossover');
  const [fastPeriod, setFastPeriod] = useState(12);
  const [slowPeriod, setSlowPeriod] = useState(26);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [stopLossATR, setStopLossATR] = useState(2);
  const [takeProfitATR, setTakeProfitATR] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = backtestConfig;

  const applyPreset = useCallback(
    (preset: Preset) => {
      const p = preset.params;
      if (p.fastPeriod !== undefined) setFastPeriod(p.fastPeriod);
      if (p.slowPeriod !== undefined) setSlowPeriod(p.slowPeriod);
      if (p.rsiPeriod !== undefined) setRsiPeriod(p.rsiPeriod);
      if (p.rsiOverbought !== undefined) setRsiOverbought(p.rsiOverbought);
      if (p.rsiOversold !== undefined) setRsiOversold(p.rsiOversold);
      if (p.stopLossATR !== undefined) setStopLossATR(p.stopLossATR);
      if (p.takeProfitATR !== undefined) setTakeProfitATR(p.takeProfitATR);
      const updateConfig: Record<string, number> = {};
      if (p.commission !== undefined) updateConfig.commission = p.commission;
      if (p.slippage !== undefined) updateConfig.slippage = p.slippage;
      if (p.leverage !== undefined) updateConfig.leverage = p.leverage;
      setBacktestConfig(updateConfig);
    },
    [setBacktestConfig]
  );

  const runBacktest = useCallback(async () => {
    setBacktestRunning(true);
    setBacktestProgress(0);
    setBacktestStage('backtest.progress.loading');
    setElapsed(0);
    setRemaining(3);

    let currentProgress = 0;
    const startTime = Date.now();
    const totalDuration = 3000;

    timerRef.current = setInterval(() => {
      const secondsElapsed = (Date.now() - startTime) / 1000;
      setElapsed(secondsElapsed);
      setRemaining(Math.max(0, (totalDuration - secondsElapsed * 1000) / 1000));
    }, 100);

    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setBacktestProgress(100);
        setBacktestStage('backtest.progress.generating');

        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        setTimeout(async () => {
          try {
            const response = await fetch('/api/backtest?XTransformPort=3000', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...cfg,
                strategyType,
                fastPeriod,
                slowPeriod,
                rsiPeriod,
                rsiOverbought,
                rsiOversold,
                stopLossATR,
                takeProfitATR,
              }),
            });
            const json = await response.json();
            if (json.success && json.data) {
              setBacktestResult(json.data);
            }
          } catch {
            // If API fails, proceed to results anyway for demo
          } finally {
            setBacktestRunning(false);
          }
        }, 500);
        return;
      }

      setBacktestProgress(currentProgress);

      const stageIndex = Math.min(
        Math.floor((currentProgress / 100) * STAGES.length),
        STAGES.length - 1
      );
      setBacktestStage(STAGES[stageIndex]);
    }, 100);
  }, [
    cfg, strategyType, fastPeriod, slowPeriod, rsiPeriod,
    rsiOverbought, rsiOversold, stopLossATR, takeProfitATR,
    setBacktestRunning, setBacktestProgress, setBacktestStage, setBacktestResult,
  ]);

  useEffect(() => {
    if (backtestResult && !backtestRunning) {
      const timer = setTimeout(() => {
        setActivePage('backtest-results');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [backtestResult, backtestRunning, setActivePage]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isModeB = !!backtestResult && !backtestRunning;

  return (
    <TooltipProvider>
      <div className="space-y-4 p-1">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <h1 className="text-2xl font-bold text-white">{t('backtest.title', locale)}</h1>
          <Badge variant="outline" className="border-[#19C37D]/30 text-[#19C37D] text-xs">
            {t('common.backtested', locale)}
          </Badge>
        </motion.div>

        <AnimatePresence mode="wait">
          {isModeB ? (
            <SuccessCard key="success" />
          ) : (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-4"
            >
              {/* LEFT SIDE — Settings (60%) */}
              <div className="lg:col-span-3 space-y-4">
                {/* Symbol & Exchange */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    {t('backtest.settings', locale)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.symbol', locale)}</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                          value={cfg.symbol}
                          onChange={(e) => setBacktestConfig({ symbol: e.target.value })}
                          className={cn(GLASS_INPUT, 'pl-8 h-9 text-sm')}
                          placeholder="AAPL"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.exchange', locale)}</Label>
                      <Select
                        value={cfg.exchange}
                        onValueChange={(v) => setBacktestConfig({ exchange: v })}
                      >
                        <SelectTrigger className={cn(GLASS_INPUT, 'h-9 text-sm')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d2236] border-white/10">
                          {EXCHANGES.map((ex) => (
                            <SelectItem key={ex} value={ex} className="text-white/80 focus:text-white focus:bg-white/5">
                              {ex}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.asset', locale)}</Label>
                      <Select
                        value={cfg.asset}
                        onValueChange={(v) => setBacktestConfig({ asset: v })}
                      >
                        <SelectTrigger className={cn(GLASS_INPUT, 'h-9 text-sm')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d2236] border-white/10">
                          {ASSETS.map((a) => (
                            <SelectItem key={a} value={a} className="text-white/80 focus:text-white focus:bg-white/5 capitalize">
                              {t(`asset.${a}`, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.timeframe', locale)}</Label>
                      <Select
                        value={cfg.timeframe}
                        onValueChange={(v) => setBacktestConfig({ timeframe: v })}
                      >
                        <SelectTrigger className={cn(GLASS_INPUT, 'h-9 text-sm')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d2236] border-white/10">
                          {TIMEFRAMES.map((tf) => (
                            <SelectItem key={tf} value={tf} className="text-white/80 focus:text-white focus:bg-white/5">
                              {t(`timeframe.${tf}`, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </GlassCard>

                {/* Date Range & Capital */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    {t('backtest.startDate', locale)} / {t('backtest.endDate', locale)}
                    &nbsp;&amp; {t('backtest.initialCapital', locale)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.startDate', locale)}</Label>
                      <Input
                        type="date"
                        value={cfg.startDate}
                        onChange={(e) => setBacktestConfig({ startDate: e.target.value })}
                        className={cn(GLASS_INPUT, 'h-9 text-sm')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.endDate', locale)}</Label>
                      <Input
                        type="date"
                        value={cfg.endDate}
                        onChange={(e) => setBacktestConfig({ endDate: e.target.value })}
                        className={cn(GLASS_INPUT, 'h-9 text-sm')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.initialCapital', locale)}</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                        <Input
                          type="number"
                          value={cfg.initialCapital}
                          onChange={(e) => setBacktestConfig({ initialCapital: Number(e.target.value) })}
                          className={cn(GLASS_INPUT, 'pl-7 h-9 text-sm')}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Commission, Slippage, Spread */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    {t('backtest.commission', locale)} / {t('backtest.slippage', locale)} / {t('backtest.spread', locale)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.commission', locale)}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={cfg.commission}
                          onChange={(e) => setBacktestConfig({ commission: Number(e.target.value) })}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.slippage', locale)}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={cfg.slippage}
                          onChange={(e) => setBacktestConfig({ slippage: Number(e.target.value) })}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.spread', locale)}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cfg.spread}
                        onChange={(e) => setBacktestConfig({ spread: Number(e.target.value) })}
                        className={cn(GLASS_INPUT, 'h-9 text-sm')}
                      />
                    </div>
                  </div>
                </GlassCard>

                {/* Leverage, Benchmark, Currency */}
                <GlassCard>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-white/50">{t('backtest.leverage', locale)}</Label>
                        <span className="text-sm font-mono text-[#19C37D]">{cfg.leverage}x</span>
                      </div>
                      <Slider
                        value={[cfg.leverage]}
                        onValueChange={([v]) => setBacktestConfig({ leverage: v })}
                        min={1}
                        max={10}
                        step={1}
                        className="[&_[data-slot=slider-range]]:bg-[#19C37D] [&_[data-slot=slider-thumb]]:bg-[#19C37D] border-[#19C37D]"
                      />
                    </div>
                    <Separator className="bg-white/[0.06]" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/50">{t('backtest.benchmark', locale)}</Label>
                        <Input
                          value={cfg.benchmark}
                          onChange={(e) => setBacktestConfig({ benchmark: e.target.value })}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/50">{t('backtest.currency', locale)}</Label>
                        <Select
                          value={cfg.currency}
                          onValueChange={(v) => setBacktestConfig({ currency: v })}
                        >
                          <SelectTrigger className={cn(GLASS_INPUT, 'h-9 text-sm')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d2236] border-white/10">
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c} className="text-white/80 focus:text-white focus:bg-white/5">
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Run Backtest Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={runBacktest}
                    disabled={backtestRunning}
                    className="w-full h-12 bg-[#19C37D] hover:bg-[#15a86b] text-white font-semibold text-base rounded-xl shadow-lg shadow-[#19C37D]/20 transition-all"
                  >
                    {backtestRunning ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Play className="h-5 w-5 mr-2" />
                    )}
                    {t('backtest.run', locale)}
                  </Button>
                </motion.div>
              </div>

              {/* RIGHT SIDE — Strategy & Presets (40%) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Strategy Type */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    {t('backtest.strategyType', locale)}
                  </h3>
                  <Select value={strategyType} onValueChange={setStrategyType}>
                    <SelectTrigger className={cn(GLASS_INPUT, 'h-9 text-sm')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d2236] border-white/10">
                      {STRATEGY_TYPES.map((st) => (
                        <SelectItem key={st} value={st} className="text-white/80 focus:text-white focus:bg-white/5">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </GlassCard>

                {/* Indicator Parameters */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    Indicator Parameters
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/50">{t('backtest.fastPeriod', locale)}</Label>
                        <Input
                          type="number"
                          value={fastPeriod}
                          onChange={(e) => setFastPeriod(Number(e.target.value))}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/50">{t('backtest.slowPeriod', locale)}</Label>
                        <Input
                          type="number"
                          value={slowPeriod}
                          onChange={(e) => setSlowPeriod(Number(e.target.value))}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                      </div>
                    </div>
                    <Separator className="bg-white/[0.06]" />
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">{t('backtest.rsiPeriod', locale)}</Label>
                      <Input
                        type="number"
                        value={rsiPeriod}
                        onChange={(e) => setRsiPeriod(Number(e.target.value))}
                        className={cn(GLASS_INPUT, 'h-9 text-sm')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/50">{t('backtest.rsiOverbought', locale)}</Label>
                        <Input
                          type="number"
                          value={rsiOverbought}
                          onChange={(e) => setRsiOverbought(Number(e.target.value))}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/50">{t('backtest.rsiOversold', locale)}</Label>
                        <Input
                          type="number"
                          value={rsiOversold}
                          onChange={(e) => setRsiOversold(Number(e.target.value))}
                          className={cn(GLASS_INPUT, 'h-9 text-sm')}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Risk Parameters (ATR Sliders) */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    Risk Parameters
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-white/50">{t('backtest.stopLossATR', locale)}</Label>
                        <span className="text-sm font-mono text-red-400">{stopLossATR}x ATR</span>
                      </div>
                      <Slider
                        value={[stopLossATR]}
                        onValueChange={([v]) => setStopLossATR(v)}
                        min={0.5}
                        max={5}
                        step={0.5}
                        className="[&_[data-slot=slider-range]]:bg-red-400 [&_[data-slot=slider-thumb]]:bg-red-400 border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-white/50">{t('backtest.takeProfitATR', locale)}</Label>
                        <span className="text-sm font-mono text-[#19C37D]">{takeProfitATR}x ATR</span>
                      </div>
                      <Slider
                        value={[takeProfitATR]}
                        onValueChange={([v]) => setTakeProfitATR(v)}
                        min={0.5}
                        max={10}
                        step={0.5}
                        className="[&_[data-slot=slider-range]]:bg-[#19C37D] [&_[data-slot=slider-thumb]]:bg-[#19C37D] border-[#19C37D]"
                      />
                    </div>
                  </div>
                </GlassCard>

                {/* Quick Presets */}
                <GlassCard>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                    {t('backtest.quickPresets', locale)}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                      <Tooltip key={preset.key}>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => applyPreset(preset)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium',
                              'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]',
                              'hover:border-[#19C37D]/30 text-white/70 hover:text-white',
                              'transition-all cursor-pointer'
                            )}
                          >
                            {preset.icon}
                            {t(preset.name, locale)}
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-[#0d2236] border-white/10 text-white/80 text-xs">
                          {t(preset.name, locale)}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Overlay */}
      <AnimatePresence>
        {backtestRunning && (
          <ProgressOverlay
            progress={backtestProgress}
            stage={backtestStage}
            elapsed={elapsed}
            remaining={remaining}
          />
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
