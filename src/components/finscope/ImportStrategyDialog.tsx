'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Code2,
  MonitorSmartphone,
  FileJson,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Info,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  parsePineScript,
  parseMT5Json,
  MT5_JSON_TEMPLATE,
  PINE_EXAMPLE,
  type ParsedStrategy,
  type ParsedCondition,
} from '@/lib/pine-parser';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface ImportedStrategyData {
  name: string;
  description: string;
  entryConditions: {
    id: string;
    indicator: string;
    operator: string;
    value: string;
    value2: string;
    timeframe: string;
  }[];
  exitConditions: {
    id: string;
    indicator: string;
    operator: string;
    value: string;
    value2: string;
    timeframe: string;
  }[];
  stopLossType: 'fixed' | 'atr';
  stopLossValue: number;
  takeProfitType: 'fixed' | 'atr';
  takeProfitValue: number;
  indicators: string[];
  source: 'pine' | 'mt5' | 'json';
}

interface ImportStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportedStrategyData) => void;
}

// ═══════════════════════════════════════════════════════════════
// Helper: map parsed conditions to our Condition format
// ═══════════════════════════════════════════════════════════════

const GEN_ID = () => Math.random().toString(36).substring(2, 9);

function mapCondition(c: ParsedCondition) {
  return {
    id: GEN_ID(),
    indicator: c.indicator,
    operator: c.operator,
    value: c.value,
    value2: '',
    timeframe: c.timeframe || '1D',
  };
}

function mapPineOperator(op: string): string {
  const map: Record<string, string> = {
    'crosses_above': 'crosses_above',
    'crosses_below': 'crosses_below',
    'gt': 'gt',
    'lt': 'lt',
    'eq': 'eq',
  };
  return map[op] || op;
}

// ═══════════════════════════════════════════════════════════════
// Parse Result Card
// ═══════════════════════════════════════════════════════════════

function ParseResultCard({
  result,
  locale,
}: {
  result: ParsedStrategy;
  locale: 'en' | 'fa';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#19C37D]/20 bg-[#19C37D]/5 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#19C37D]" />
        <span className="text-sm font-semibold text-[#19C37D]">
          {locale === 'fa' ? 'استراتژی با موفقیت تحلیل شد' : 'Strategy parsed successfully'}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-white/50">{locale === 'fa' ? 'نام' : 'Name'}</span>
          <span className="font-medium text-white">{result.name}</span>
        </div>

        {result.indicators.length > 0 && (
          <div>
            <span className="text-white/50">
              {locale === 'fa' ? 'اندیکاتورها' : 'Indicators'}
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {result.indicators.map((ind, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-[#19C37D]/20 text-[10px] text-[#19C37D]"
                >
                  {ind.type} {ind.name.match(/\(([^)]+)\)/)?.[1] || ''}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-white/50">
            {locale === 'fa' ? 'شرایط ورود' : 'Entry Conditions'}
          </span>
          <span className="font-medium text-[#19C37D]">{result.entryConditions.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/50">
            {locale === 'fa' ? 'شرایط خروج' : 'Exit Conditions'}
          </span>
          <span className="font-medium text-white/60">{result.exitConditions.length}</span>
        </div>

        {result.parameters && Object.keys(result.parameters).length > 0 && (
          <div>
            <span className="text-white/50">
              {locale === 'fa' ? 'پارامترها' : 'Parameters'}
            </span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {Object.entries(result.parameters)
                .filter(([k]) => !k.endsWith('_label'))
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1 text-[10px]">
                    <span className="text-white/30 font-mono">{k}:</span>
                    <span className="text-white/70 font-mono">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Import Strategy Dialog
// ═══════════════════════════════════════════════════════════════

export function ImportStrategyDialog({
  open,
  onOpenChange,
  onImport,
}: ImportStrategyDialogProps) {
  const locale = useAppStore((s) => s.locale);

  // Pine Script state
  const [pineCode, setPineCode] = useState('');
  const [pineResult, setPineResult] = useState<ParsedStrategy | null>(null);
  const [pineError, setPineError] = useState('');
  const [pineParsing, setPineParsing] = useState(false);

  // MT5 state
  const [mt5Json, setMt5Json] = useState('');
  const [mt5Result, setMt5Result] = useState<ParsedStrategy | null>(null);
  const [mt5Error, setMt5Error] = useState('');
  const [mt5Parsing, setMt5Parsing] = useState(false);

  // TradingView URL state
  const [tvUrl, setTvUrl] = useState('');
  const [tvLoading, setTvLoading] = useState(false);
  const [tvError, setTvError] = useState('');

  const [copied, setCopied] = useState(false);

  // ─── Pine Script Parse ───
  const handleParsePine = useCallback(() => {
    setPineError('');
    setPineResult(null);
    setPineParsing(true);

    // Use setTimeout to not block UI
    setTimeout(() => {
      try {
        if (!pineCode.trim()) {
          setPineError(locale === 'fa' ? 'لطفاً کد Pine Script را وارد کنید' : 'Please enter Pine Script code');
          setPineParsing(false);
          return;
        }
        const result = parsePineScript(pineCode);
        if (result.entryConditions.length === 0) {
          setPineError(
            locale === 'fa'
              ? 'هیچ شرط ورودی یافت نشد. مطمئن شوید کد شامل strategy.entry با شرط if است.'
              : 'No entry conditions found. Make sure the code includes strategy.entry with an if condition.'
          );
          setPineParsing(false);
          return;
        }
        setPineResult(result);
      } catch (e) {
        setPineError(`Parse error: ${(e as Error).message}`);
      }
      setPineParsing(false);
    }, 50);
  }, [pineCode, locale]);

  // ─── MT5 JSON Parse ───
  const handleParseMT5 = useCallback(() => {
    setMt5Error('');
    setMt5Result(null);
    setMt5Parsing(true);

    setTimeout(() => {
      try {
        if (!mt5Json.trim()) {
          setMt5Error(locale === 'fa' ? 'لطفاً JSON را وارد کنید' : 'Please enter JSON data');
          setMt5Parsing(false);
          return;
        }
        const result = parseMT5Json(mt5Json);
        setMt5Result(result);
      } catch (e) {
        setMt5Error((e as Error).message);
      }
      setMt5Parsing(false);
    }, 50);
  }, [mt5Json, locale]);

  // ─── TradingView URL Fetch ───
  const handleFetchTV = useCallback(async () => {
    setTvError('');
    setTvLoading(true);
    try {
      if (!tvUrl.trim()) {
        setTvError(locale === 'fa' ? 'لطفاً لینک را وارد کنید' : 'Please enter a URL');
        setTvLoading(false);
        return;
      }
      // Try to fetch Pine Script from TradingView URL via our API
      const res = await fetch('/api/fetch-pine?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tvUrl }),
      });
      const data = await res.json();
      if (data.code) {
        setPineCode(data.code);
        const result = parsePineScript(data.code);
        if (result.entryConditions.length > 0) {
          setPineResult(result);
        }
      } else {
        setTvError(data.error || 'Failed to fetch script');
      }
    } catch {
      setTvError(
        locale === 'fa'
          ? 'خطا در دریافت کد. لطفاً کد را مستقیماً کپی کرده و در تب Pine Script وارد کنید.'
          : 'Error fetching code. Please copy the code directly and paste it in the Pine Script tab.'
      );
    }
    setTvLoading(false);
  }, [tvUrl, locale]);

  // ─── Apply Import ───
  const handleApplyPine = useCallback(() => {
    if (!pineResult) return;
    const data: ImportedStrategyData = {
      name: pineResult.name,
      description: pineResult.description,
      entryConditions: pineResult.entryConditions.map(mapCondition),
      exitConditions: pineResult.exitConditions.map(mapCondition),
      stopLossType: 'fixed',
      stopLossValue: 2,
      takeProfitType: 'fixed',
      takeProfitValue: 4,
      indicators: pineResult.indicators.map((i) => i.type),
      source: 'pine',
    };
    onImport(data);
    onOpenChange(false);
  }, [pineResult, onImport, onOpenChange]);

  const handleApplyMT5 = useCallback(() => {
    if (!mt5Result) return;
    const data: ImportedStrategyData = {
      name: mt5Result.name,
      description: mt5Result.description,
      entryConditions: mt5Result.entryConditions.map(mapCondition),
      exitConditions: mt5Result.exitConditions.map(mapCondition),
      stopLossType: 'fixed',
      stopLossValue: 2,
      takeProfitType: 'fixed',
      takeProfitValue: 4,
      indicators: mt5Result.indicators.map((i) => i.type),
      source: 'mt5',
    };
    onImport(data);
    onOpenChange(false);
  }, [mt5Result, onImport, onOpenChange]);

  // ─── Copy Template ───
  const handleCopyTemplate = useCallback((template: string) => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleLoadExample = useCallback(() => {
    setPineCode(PINE_EXAMPLE);
    setPineResult(null);
    setPineError('');
  }, []);

  // ─── Reset on close ───
  const handleClose = useCallback(
    (val: boolean) => {
      if (!val) {
        setPineCode('');
        setPineResult(null);
        setPineError('');
        setMt5Json('');
        setMt5Result(null);
        setMt5Error('');
        setTvUrl('');
        setTvError('');
      }
      onOpenChange(val);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-white/[0.08] bg-[#0B2239]/95 backdrop-blur-2xl shadow-2xl sm:max-w-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <Upload className="h-5 w-5 text-[#19C37D]" />
            {locale === 'fa' ? 'وارد کردن استراتژی' : 'Import Strategy'}
          </DialogTitle>
          <DialogDescription className="text-xs text-white/40">
            {locale === 'fa'
              ? 'استراتژی خود را از TradingView یا MetaTrader 5 وارد کنید'
              : 'Import your strategy from TradingView or MetaTrader 5'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tradingview" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3 gap-1 bg-white/[0.03] p-1">
            <TabsTrigger
              value="tradingview"
              className="gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">TradingView</span>
              <span className="sm:hidden">TV</span>
            </TabsTrigger>
            <TabsTrigger
              value="mt5"
              className="gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
            >
              <MonitorSmartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">MetaTrader 5</span>
              <span className="sm:hidden">MT5</span>
            </TabsTrigger>
            <TabsTrigger
              value="help"
              className="gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {locale === 'fa' ? 'راهنما' : 'Guide'}
              </span>
              <span className="sm:hidden">?</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 1: TradingView Pine Script                     */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="tradingview" className="mt-0 space-y-3">
            {/* URL Input */}
            <div className="space-y-2">
              <Label className="text-xs text-white/50">
                {locale === 'fa' ? 'لینک اسکریپت TradingView (اختیاری)' : 'TradingView Script URL (optional)'}
              </Label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={tvUrl}
                  onChange={(e) => setTvUrl(e.target.value)}
                  placeholder="https://www.tradingview.com/script/..."
                  className="flex h-9 flex-1 rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 text-xs text-white placeholder:text-white/20 focus:border-[#19C37D]/50 focus:ring-1 focus:ring-[#19C37D]/20 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchTV}
                  disabled={tvLoading}
                  className="shrink-0 border-[#19C37D]/30 bg-[#19C37D]/5 text-[#19C37D] hover:bg-[#19C37D]/15"
                >
                  {tvLoading ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 animate-pulse" />
                    </span>
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              {tvError && (
                <p className="text-[11px] text-red-400/80">{tvError}</p>
              )}
            </div>

            {/* Code Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-white/50">
                  {locale === 'fa' ? 'کد Pine Script' : 'Pine Script Code'}
                </Label>
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadExample}
                    className="text-[10px] text-[#19C37D]/60 hover:text-[#19C37D] transition-colors"
                  >
                    {locale === 'fa' ? 'مثال بارگذاری' : 'Load Example'}
                  </button>
                </div>
              </div>
              <Textarea
                value={pineCode}
                onChange={(e) => {
                  setPineCode(e.target.value);
                  setPineResult(null);
                  setPineError('');
                }}
                placeholder={locale === 'fa'
                  ? 'کد Pine Script خود را اینجا粘贴 کنید...\n//@version=5\nstrategy("My Strategy")\n...'
                  : 'Paste your Pine Script code here...\n//@version=5\nstrategy("My Strategy")\n...'}
                className="custom-scroll min-h-[180px] max-h-[300px] resize-none rounded-lg border-white/[0.1] bg-black/40 font-mono text-[11px] leading-relaxed text-[#94A3B8] placeholder:text-white/15 focus:border-[#19C37D]/50"
              />
            </div>

            {/* Parse Button */}
            <Button
              onClick={handleParsePine}
              disabled={pineParsing || !pineCode.trim()}
              className="w-full gap-2 bg-[#19C37D] text-[#071A2B] hover:bg-[#19C37D]/85"
            >
              <Code2 className="h-4 w-4" />
              {pineParsing
                ? locale === 'fa' ? 'در حال تحلیل...' : 'Analyzing...'
                : locale === 'fa' ? 'تحلیل کد Pine Script' : 'Analyze Pine Script'}
            </Button>

            {/* Error */}
            {pineError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{pineError}</p>
              </div>
            )}

            {/* Result */}
            <AnimatePresence>
              {pineResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ParseResultCard result={pineResult} locale={locale} />
                  <Button
                    onClick={handleApplyPine}
                    className="mt-3 w-full gap-2 bg-[#19C37D] text-[#071A2B] hover:bg-[#19C37D]/85 font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {locale === 'fa' ? 'وارد کردن به سازنده استراتژی' : 'Import to Strategy Builder'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 2: MetaTrader 5                              */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="mt5" className="mt-0 space-y-3">
            {/* Info banner */}
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-[11px] leading-relaxed text-amber-200/70">
                {locale === 'fa'
                  ? 'برای وارد کردن استراتژی از MT5، JSON زیر را با اطلاعات استراتژی خود پر کنید. می‌توانید از دکمه «کپی قالب» استفاده کنید.'
                  : 'To import from MT5, fill in the JSON below with your strategy data. Use the "Copy Template" button to get started.'}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleCopyTemplate(MT5_JSON_TEMPLATE)}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-[#19C37D]" />
                    <span className="text-[#19C37D]">{locale === 'fa' ? 'کپی شد!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{locale === 'fa' ? 'کپی قالب' : 'Copy Template'}</span>
                  </>
                )}
              </button>
            </div>

            <Textarea
              value={mt5Json}
              onChange={(e) => {
                setMt5Json(e.target.value);
                setMt5Result(null);
                setMt5Error('');
              }}
              placeholder={locale === 'fa'
                ? 'JSON استراتژی MT5 را اینجا وارد کنید...'
                : 'Paste your MT5 strategy JSON here...'}
              className="custom-scroll min-h-[200px] max-h-[350px] resize-none rounded-lg border-white/[0.1] bg-black/40 font-mono text-[11px] leading-relaxed text-[#94A3B8] placeholder:text-white/15 focus:border-[#19C37D]/50"
            />

            <Button
              onClick={handleParseMT5}
              disabled={mt5Parsing || !mt5Json.trim()}
              className="w-full gap-2 bg-[#19C37D] text-[#071A2B] hover:bg-[#19C37D]/85"
            >
              <FileJson className="h-4 w-4" />
              {mt5Parsing
                ? locale === 'fa' ? 'در حال پردازش...' : 'Processing...'
                : locale === 'fa' ? 'تحلیل JSON متاتریدر' : 'Analyze MT5 JSON'}
            </Button>

            {mt5Error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{mt5Error}</p>
              </div>
            )}

            <AnimatePresence>
              {mt5Result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ParseResultCard result={mt5Result} locale={locale} />
                  <Button
                    onClick={handleApplyMT5}
                    className="mt-3 w-full gap-2 bg-[#19C37D] text-[#071A2B] hover:bg-[#19C37D]/85 font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {locale === 'fa' ? 'وارد کردن به سازنده استراتژی' : 'Import to Strategy Builder'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 3: Help / Guide                               */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="help" className="mt-0">
            <div className="custom-scroll max-h-[50vh] space-y-4 overflow-y-auto pr-1">
              {/* TradingView Guide */}
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#19C37D]" />
                  <h4 className="text-sm font-semibold text-white">TradingView</h4>
                  <Badge variant="outline" className="border-[#19C37D]/20 text-[10px] text-[#19C37D]">
                    Pine Script v5
                  </Badge>
                </div>
                <ol className="space-y-2 text-[11px] leading-relaxed text-white/50">
                  <li className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10 text-[10px] font-bold text-[#19C37D]">1</span>
                    <span>
                      {locale === 'fa'
                        ? 'به TradingView بروید و استراتژی خود را در Pine Editor باز کنید'
                        : 'Go to TradingView and open your strategy in Pine Editor'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10 text-[10px] font-bold text-[#19C37D]">2</span>
                    <span>
                      {locale === 'fa'
                        ? 'تمام کد را کپی کنید (Ctrl+A, Ctrl+C)'
                        : 'Copy all the code (Ctrl+A, Ctrl+C)'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10 text-[10px] font-bold text-[#19C37D]">3</span>
                    <span>
                      {locale === 'fa'
                        ? 'در تب TradingView بالاPaste کنید و دکمه «تحلیل» را بزنید'
                        : 'Paste it in the TradingView tab above and click "Analyze"'}
                    </span>
                  </li>
                </ol>
                <div className="mt-3 rounded-md bg-white/[0.03] p-2.5 font-mono text-[10px] text-white/30">
                  <span className="text-[#19C37D]">{locale === 'fa' ? 'پشتیبانی' : 'Supports'}:</span>{' '}
                  ta.sma, ta.ema, ta.rsi, ta.macd, ta.atr, ta.adx, ta.bb, ta.stoch, ta.cci, ta.roc, ta.obv, ta.wma, ta.mom
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* MT5 Guide */}
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4 text-[#19C37D]" />
                  <h4 className="text-sm font-semibold text-white">MetaTrader 5</h4>
                  <Badge variant="outline" className="border-amber-500/20 text-[10px] text-amber-400">
                    JSON Export
                  </Badge>
                </div>
                <ol className="space-y-2 text-[11px] leading-relaxed text-white/50">
                  <li className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10 text-[10px] font-bold text-[#19C37D]">1</span>
                    <span>
                      {locale === 'fa'
                        ? 'از تب MetaTrader 5 دکمه «کپی قالب» را بزنید'
                        : 'Click "Copy Template" from the MetaTrader 5 tab'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10 text-[10px] font-bold text-[#19C37D]">2</span>
                    <span>
                      {locale === 'fa'
                        ? 'قالب JSON را با اطلاعات استراتژی خود پر کنید (اندیکاتورها، شرایط ورود/خروج، مدیریت ریسک)'
                        : 'Fill in the JSON template with your strategy info (indicators, entry/exit conditions, risk management)'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#19C37D]/10 text-[10px] font-bold text-[#19C37D]">3</span>
                    <span>
                      {locale === 'fa'
                        ? 'JSON را در تب MT5 بالاPaste کرده و «تحلیل» را بزنید'
                        : 'Paste the JSON in the MT5 tab above and click "Analyze"'}
                    </span>
                  </li>
                </ol>
                <div className="mt-3 rounded-md border border-amber-500/10 bg-amber-500/5 p-2.5 text-[10px] text-amber-200/60">
                  <span className="font-semibold">💡 {locale === 'fa' ? 'نکته' : 'Tip'}:</span>{' '}
                  {locale === 'fa'
                    ? 'در آینده، اتصال مستقیم به MT5 از طریق API محلی نیز اضافه خواهد شد.'
                    : 'Direct MT5 API connection via a local bridge will be added in a future update.'}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Label component (inline since we don't import it at top level for the URL field)
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}
