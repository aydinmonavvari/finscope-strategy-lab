'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  X,
  Play,
  Save,
  GitBranch,
  GripVertical,
  Shield,
  Target,
  BarChart3,
  Settings2,
  FileJson,
  Upload,
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import type { Strategy } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ImportStrategyDialog, type ImportedStrategyData } from '@/components/finscope/ImportStrategyDialog';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const INDICATORS = [
  { value: 'SMA', labelKey: 'indicator.sma' },
  { value: 'EMA', labelKey: 'indicator.ema' },
  { value: 'RSI', labelKey: 'indicator.rsi' },
  { value: 'MACD', labelKey: 'indicator.macd' },
  { value: 'Stochastic', labelKey: 'indicator.stochastic' },
  { value: 'Bollinger Bands', labelKey: 'indicator.bollingerBands' },
  { value: 'ATR', labelKey: 'indicator.atr' },
  { value: 'ADX', labelKey: 'indicator.adx' },
  { value: 'CCI', labelKey: 'indicator.cci' },
  { value: 'ROC', labelKey: 'indicator.roc' },
  { value: 'OBV', labelKey: 'indicator.obv' },
  { value: 'VWAP', labelKey: 'indicator.vwap' },
  { value: 'Price', labelKey: 'indicator.price' },
  { value: 'Volume', labelKey: 'indicator.volume' },
  { value: 'WMA', labelKey: 'indicator.wma' },
  { value: 'Donchian', labelKey: 'indicator.donchian' },
  { value: 'Pivot Points', labelKey: 'indicator.pivotPoints' },
  { value: 'Momentum', labelKey: 'indicator.momentum' },
  { value: 'Ichimoku', labelKey: 'indicator.ichimoku' },
] as const;

const OPERATORS = [
  { value: 'crosses_above', labelKey: 'operator.crossover' },
  { value: 'crosses_below', labelKey: 'operator.crossunder' },
  { value: 'gt', labelKey: 'operator.gt' },
  { value: 'lt', labelKey: 'operator.lt' },
  { value: 'eq', labelKey: 'operator.eq' },
  { value: 'between', labelKey: 'operator.between' },
] as const;

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'] as const;

const STRATEGY_TYPES = [
  { value: 'momentum', labelKey: 'builder.type.momentum' },
  { value: 'trend', labelKey: 'builder.type.trend' },
  { value: 'meanReversion', labelKey: 'builder.type.meanReversion' },
  { value: 'breakout', labelKey: 'builder.type.breakout' },
  { value: 'volatility', labelKey: 'builder.type.volatility' },
  { value: 'statArb', labelKey: 'builder.type.statArb' },
  { value: 'pairs', labelKey: 'builder.type.pairs' },
  { value: 'custom', labelKey: 'builder.type.custom' },
] as const;

const VISIBILITY_OPTIONS = [
  { value: 'private', labelKey: 'builder.vis.private' },
  { value: 'unlisted', labelKey: 'builder.vis.unlisted' },
  { value: 'public', labelKey: 'builder.vis.public' },
  { value: 'team', labelKey: 'builder.vis.team' },
] as const;

const SIZING_OPTIONS = [
  { value: 'fixed', labelKey: 'builder.sizing.fixed' },
  { value: 'percent', labelKey: 'builder.sizing.percent' },
  { value: 'risk', labelKey: 'builder.sizing.risk' },
  { value: 'kelly', labelKey: 'builder.sizing.kelly' },
] as const;

const GLASS_CARD =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl';

const GLASS_INPUT =
  'bg-white/[0.05] border-white/[0.1] text-foreground focus:border-[#19C37D]/50 focus:ring-[#19C37D]/20';

const GEN_ID = () => Math.random().toString(36).substring(2, 9);

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface Condition {
  id: string;
  indicator: string;
  operator: string;
  value: string;
  value2: string;
  timeframe: string;
}

interface ConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: Condition[];
}

// ═══════════════════════════════════════════════════════════════
// Default Data — EMA Crossover Strategy
// ═══════════════════════════════════════════════════════════════

const DEFAULT_ENTRY_GROUPS: ConditionGroup[] = [
  {
    id: GEN_ID(),
    logic: 'AND',
    conditions: [
      {
        id: GEN_ID(),
        indicator: 'EMA',
        operator: 'crosses_above',
        value: 'EMA(26)',
        value2: '',
        timeframe: '1D',
      },
      {
        id: GEN_ID(),
        indicator: 'RSI',
        operator: 'gt',
        value: '50',
        value2: '',
        timeframe: '1D',
      },
      {
        id: GEN_ID(),
        indicator: 'MACD',
        operator: 'gt',
        value: '0',
        value2: '',
        timeframe: '1D',
      },
    ],
  },
];

const DEFAULT_EXIT_GROUPS: ConditionGroup[] = [
  {
    id: GEN_ID(),
    logic: 'AND',
    conditions: [
      {
        id: GEN_ID(),
        indicator: 'EMA',
        operator: 'crosses_below',
        value: 'EMA(26)',
        value2: '',
        timeframe: '1D',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
};

// ═══════════════════════════════════════════════════════════════
// Condition Row Component
// ═══════════════════════════════════════════════════════════════

function ConditionRow({
  condition,
  locale,
  index,
  onUpdate,
  onRemove,
  groupLogic,
  isLast,
}: {
  condition: Condition;
  locale: 'en' | 'fa';
  index: number;
  onUpdate: (id: string, field: keyof Condition, val: string) => void;
  onRemove: (id: string) => void;
  groupLogic: 'AND' | 'OR';
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {index > 0 && (
        <div className="flex w-full items-center gap-2 py-1">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#19C37D]/70">
            {groupLogic}
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      )}
      <motion.div
        variants={itemVariants}
        className={cn(
          'flex w-full flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:gap-2',
        )}
      >
        <div className="flex flex-1 items-center gap-2">
          <GripVertical className="hidden h-4 w-4 shrink-0 text-white/20 sm:block" />
          <Select
            value={condition.indicator}
            onValueChange={(v) => onUpdate(condition.id, 'indicator', v)}
          >
            <SelectTrigger className={cn('h-9 w-full text-xs', GLASS_INPUT)}>
              <SelectValue placeholder={t('builder.indicator', locale)} />
            </SelectTrigger>
            <SelectContent className="border-white/[0.1] bg-[#0D2137]">
              {INDICATORS.map((ind) => (
                <SelectItem key={ind.value} value={ind.value} className="text-xs">
                  {t(ind.labelKey, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={condition.operator}
          onValueChange={(v) => onUpdate(condition.id, 'operator', v)}
        >
          <SelectTrigger className={cn('h-9 w-full text-xs sm:w-[160px]', GLASS_INPUT)}>
            <SelectValue placeholder={t('builder.operator', locale)} />
          </SelectTrigger>
          <SelectContent className="border-white/[0.1] bg-[#0D2137]">
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value} className="text-xs">
                {t(op.labelKey, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="text"
            value={condition.value}
            onChange={(e) => onUpdate(condition.id, 'value', e.target.value)}
            className={cn('h-9 w-full text-xs sm:w-[100px]', GLASS_INPUT)}
            placeholder={t('builder.value', locale)}
          />
          {condition.operator === 'between' && (
            <Input
              type="text"
              value={condition.value2}
              onChange={(e) => onUpdate(condition.id, 'value2', e.target.value)}
              className={cn('h-9 w-full text-xs sm:w-[100px]', GLASS_INPUT)}
              placeholder={t('builder.value', locale)}
            />
          )}
        </div>

        <Select
          value={condition.timeframe}
          onValueChange={(v) => onUpdate(condition.id, 'timeframe', v)}
        >
          <SelectTrigger className={cn('h-9 w-full text-xs sm:w-[90px]', GLASS_INPUT)}>
            <SelectValue placeholder={t('builder.timeframe', locale)} />
          </SelectTrigger>
          <SelectContent className="border-white/[0.1] bg-[#0D2137]">
            {TIMEFRAMES.map((tf) => (
              <SelectItem key={tf} value={tf} className="text-xs">
                {t(`timeframe.${tf}`, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => onRemove(condition.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('builder.removeCondition', locale)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Condition Group Block Component
// ═══════════════════════════════════════════════════════════════

function ConditionGroupBlock({
  group,
  locale,
  groupIndex,
  totalGroups,
  groupOperator,
  onUpdateCondition,
  onRemoveCondition,
  onAddCondition,
  onRemoveGroup,
  onToggleGroupLogic,
  onToggleGroupOperator,
}: {
  group: ConditionGroup;
  locale: 'en' | 'fa';
  groupIndex: number;
  totalGroups: number;
  groupOperator: 'AND' | 'OR';
  onUpdateCondition: (id: string, field: keyof Condition, val: string) => void;
  onRemoveCondition: (id: string) => void;
  onAddCondition: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onToggleGroupLogic: (groupId: string) => void;
  onToggleGroupOperator: () => void;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      {groupIndex > 0 && (
        <div className="flex items-center gap-3 py-1.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
          <button
            type="button"
            onClick={onToggleGroupOperator}
            className={cn(
              'rounded-md border px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-all',
              groupOperator === 'AND'
                ? 'border-[#19C37D]/30 bg-[#19C37D]/10 text-[#19C37D] hover:bg-[#19C37D]/20'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20',
            )}
          >
            {groupOperator}
          </button>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
        </div>
      )}

      <div className={cn(GLASS_CARD, 'p-4')}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[#19C37D]/70" />
            <span className="text-xs font-medium text-white/60">
              {t('builder.entryConditions', locale)} #{groupIndex + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleGroupLogic(group.id)}
              className={cn(
                'rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                group.logic === 'AND'
                  ? 'border-[#19C37D]/30 bg-[#19C37D]/10 text-[#19C37D]'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-400',
              )}
            >
              {group.logic}
            </button>
            {totalGroups > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => onRemoveGroup(group.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('common.delete', locale)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {group.conditions.map((cond, idx) => (
            <ConditionRow
              key={cond.id}
              condition={cond}
              locale={locale}
              index={idx}
              onUpdate={onUpdateCondition}
              onRemove={onRemoveCondition}
              groupLogic={group.logic}
              isLast={idx === group.conditions.length - 1}
            />
          ))}
        </motion.div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 h-8 gap-1.5 text-xs text-white/40 hover:bg-white/[0.05] hover:text-[#19C37D]"
          onClick={() => onAddCondition(group.id)}
        >
          <Plus className="h-3.5 w-3.5" />
          {t('builder.addCondition', locale)}
        </Button>
      </div>
    </motion.div>
  );
}
// ═══════════════════════════════════════════════════════════════
// Condition Builder (reusable for entry/exit)
// ═══════════════════════════════════════════════════════════════

function ConditionBuilder({
  groups,
  groupOperator,
  locale,
  onSetGroups,
  onSetGroupOperator,
}: {
  groups: ConditionGroup[];
  groupOperator: 'AND' | 'OR';
  locale: 'en' | 'fa';
  onSetGroups: React.Dispatch<React.SetStateAction<ConditionGroup[]>>;
  onSetGroupOperator: React.Dispatch<React.SetStateAction<'AND' | 'OR'>>;
}) {
  const updateCondition = useCallback(
    (id: string, field: keyof Condition, val: string) => {
      onSetGroups((prev) =>
        prev.map((g) => ({
          ...g,
          conditions: g.conditions.map((c) =>
            c.id === id ? { ...c, [field]: val } : c,
          ),
        })),
      );
    },
    [onSetGroups],
  );

  const removeCondition = useCallback(
    (id: string) => {
      onSetGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            conditions: g.conditions.filter((c) => c.id !== id),
          }))
          .filter((g) => g.conditions.length > 0),
      );
    },
    [onSetGroups],
  );

  const addCondition = useCallback(
    (groupId: string) => {
      onSetGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: [
                  ...g.conditions,
                  {
                    id: GEN_ID(),
                    indicator: 'SMA',
                    operator: 'gt',
                    value: '',
                    value2: '',
                    timeframe: '1D',
                  },
                ],
              }
            : g,
        ),
      );
    },
    [onSetGroups],
  );

  const addGroup = useCallback(() => {
    onSetGroups((prev) => [
      ...prev,
      {
        id: GEN_ID(),
        logic: 'AND',
        conditions: [
          {
            id: GEN_ID(),
            indicator: 'SMA',
            operator: 'gt',
            value: '',
            value2: '',
            timeframe: '1D',
          },
        ],
      },
    ]);
  }, [onSetGroups]);

  const removeGroup = useCallback(
    (groupId: string) => {
      onSetGroups((prev) => prev.filter((g) => g.id !== groupId));
    },
    [onSetGroups],
  );

  const toggleGroupLogic = useCallback(
    (groupId: string) => {
      onSetGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, logic: g.logic === 'AND' ? 'OR' : 'AND' }
            : g,
        ),
      );
    },
    [onSetGroups],
  );

  const toggleGroupOperator = useCallback(() => {
    onSetGroupOperator((prev) => (prev === 'AND' ? 'OR' : 'AND'));
  }, [onSetGroupOperator]);

  return (
    <div className="space-y-3">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {groups.map((group, idx) => (
          <ConditionGroupBlock
            key={group.id}
            group={group}
            locale={locale}
            groupIndex={idx}
            totalGroups={groups.length}
            groupOperator={groupOperator}
            onUpdateCondition={updateCondition}
            onRemoveCondition={removeCondition}
            onAddCondition={addCondition}
            onRemoveGroup={removeGroup}
            onToggleGroupLogic={toggleGroupLogic}
            onToggleGroupOperator={toggleGroupOperator}
          />
        ))}
      </motion.div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-dashed border-white/[0.1] bg-transparent text-xs text-white/50 hover:border-[#19C37D]/40 hover:bg-[#19C37D]/5 hover:text-[#19C37D]"
        onClick={addGroup}
      >
        <Plus className="h-3.5 w-3.5" />
        {t('builder.addGroup', locale)}
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Strategy Tree (JSON-like Preview)
// ═══════════════════════════════════════════════════════════════

function JsonSyntaxSpan({
  children,
  color = 'text-white/30',
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <span className={color}>{children}</span>;
}

function JsonKey({ children }: { children: React.ReactNode }) {
  return <span className="text-[#94A3B8]">&quot;{children}&quot;</span>;
}

function JsonValue({
  children,
  type = 'string',
}: {
  children: React.ReactNode;
  type?: 'string' | 'number' | 'boolean' | 'null';
}) {
  const colorMap = {
    string: 'text-[#19C37D]',
    number: 'text-[#22D3EE]',
    boolean: 'text-[#FBBF24]',
    null: 'text-white/20',
  };
  return <span className={colorMap[type]}>{children}</span>;
}

function StrategyTree({
  entryGroups,
  entryOperator,
  exitGroups,
  exitOperator,
  stopLossType,
  stopLossValue,
  takeProfitType,
  takeProfitValue,
  trailingEnabled,
  trailingActivation,
  trailingDistance,
  positionSizing,
  positionSize,
  riskPerTrade,
  leverage,
  maxPositions,
  maxDailyLoss,
}: {
  entryGroups: ConditionGroup[];
  entryOperator: string;
  exitGroups: ConditionGroup[];
  exitOperator: string;
  stopLossType: string;
  stopLossValue: number;
  takeProfitType: string;
  takeProfitValue: number;
  trailingEnabled: boolean;
  trailingActivation: number;
  trailingDistance: number;
  positionSizing: string;
  positionSize: number;
  riskPerTrade: number;
  leverage: number;
  maxPositions: number;
  maxDailyLoss: number;
}) {
  return (
    <div className="custom-scroll max-h-[420px] overflow-y-auto rounded-lg border border-white/[0.06] bg-black/30 p-4 font-mono text-[11px] leading-relaxed">
      <div className="space-y-0.5">
        <JsonSyntaxSpan>{'{'}</JsonSyntaxSpan>

        {/* Entry */}
        <div className="pl-4">
          <JsonKey>entry</JsonKey>
          <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
          <div className="pl-4">
            <JsonKey>operator</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="string">{entryOperator}</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>groups</JsonKey>
            <JsonSyntaxSpan>: [</JsonSyntaxSpan>
            {entryGroups.map((group, gi) => (
              <div key={group.id} className="pl-4">
                <JsonSyntaxSpan>{'{'}</JsonSyntaxSpan>
                <div className="pl-4">
                  <JsonKey>logic</JsonKey>
                  <JsonSyntaxSpan>: </JsonSyntaxSpan>
                  <JsonValue type="string">{group.logic}</JsonValue>
                  <JsonSyntaxSpan>,</JsonSyntaxSpan>
                </div>
                <div className="pl-4">
                  <JsonKey>conditions</JsonKey>
                  <JsonSyntaxSpan>: [</JsonSyntaxSpan>
                  {group.conditions.map((cond, ci) => (
                    <div key={cond.id} className="pl-4">
                      <JsonSyntaxSpan>{'{'}</JsonSyntaxSpan>
                      <div className="pl-4">
                        <JsonKey>indicator</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.indicator}</JsonValue>
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      </div>
                      <div className="pl-4">
                        <JsonKey>operator</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.operator}</JsonValue>
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      </div>
                      <div className="pl-4">
                        <JsonKey>value</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.value}</JsonValue>
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      </div>
                      <div className="pl-4">
                        <JsonKey>timeframe</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.timeframe}</JsonValue>
                      </div>
                      <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
                      {ci < group.conditions.length - 1 && (
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      )}
                    </div>
                  ))}
                  <div className="pl-0">
                    <JsonSyntaxSpan>]</JsonSyntaxSpan>
                  </div>
                </div>
                <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
                {gi < entryGroups.length - 1 && (
                  <JsonSyntaxSpan>,</JsonSyntaxSpan>
                )}
              </div>
            ))}
            <div className="pl-0">
              <JsonSyntaxSpan>]</JsonSyntaxSpan>
            </div>
          </div>
          <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
          <JsonSyntaxSpan>,</JsonSyntaxSpan>
        </div>

        {/* Exit */}
        <div className="pl-4">
          <JsonKey>exit</JsonKey>
          <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
          <div className="pl-4">
            <JsonKey>operator</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="string">{exitOperator}</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>groups</JsonKey>
            <JsonSyntaxSpan>: [</JsonSyntaxSpan>
            {exitGroups.map((group, gi) => (
              <div key={group.id} className="pl-4">
                <JsonSyntaxSpan>{'{'}</JsonSyntaxSpan>
                <div className="pl-4">
                  <JsonKey>logic</JsonKey>
                  <JsonSyntaxSpan>: </JsonSyntaxSpan>
                  <JsonValue type="string">{group.logic}</JsonValue>
                  <JsonSyntaxSpan>,</JsonSyntaxSpan>
                </div>
                <div className="pl-4">
                  <JsonKey>conditions</JsonKey>
                  <JsonSyntaxSpan>: [</JsonSyntaxSpan>
                  {group.conditions.map((cond, ci) => (
                    <div key={cond.id} className="pl-4">
                      <JsonSyntaxSpan>{'{'}</JsonSyntaxSpan>
                      <div className="pl-4">
                        <JsonKey>indicator</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.indicator}</JsonValue>
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      </div>
                      <div className="pl-4">
                        <JsonKey>operator</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.operator}</JsonValue>
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      </div>
                      <div className="pl-4">
                        <JsonKey>value</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.value}</JsonValue>
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      </div>
                      <div className="pl-4">
                        <JsonKey>timeframe</JsonKey>
                        <JsonSyntaxSpan>: </JsonSyntaxSpan>
                        <JsonValue type="string">{cond.timeframe}</JsonValue>
                      </div>
                      <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
                      {ci < group.conditions.length - 1 && (
                        <JsonSyntaxSpan>,</JsonSyntaxSpan>
                      )}
                    </div>
                  ))}
                  <div className="pl-0">
                    <JsonSyntaxSpan>]</JsonSyntaxSpan>
                  </div>
                </div>
                <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
                {gi < exitGroups.length - 1 && (
                  <JsonSyntaxSpan>,</JsonSyntaxSpan>
                )}
              </div>
            ))}
            <div className="pl-0">
              <JsonSyntaxSpan>]</JsonSyntaxSpan>
            </div>
          </div>
          <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
          <JsonSyntaxSpan>,</JsonSyntaxSpan>
        </div>

        {/* Risk Management */}
        <div className="pl-4">
          <JsonKey>riskManagement</JsonKey>
          <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
          <div className="pl-4">
            <JsonKey>stopLoss</JsonKey>
            <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
            <div className="pl-4">
              <JsonKey>type</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="string">{stopLossType}</JsonValue>
              <JsonSyntaxSpan>,</JsonSyntaxSpan>
            </div>
            <div className="pl-4">
              <JsonKey>value</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="number">{stopLossValue}</JsonValue>
            </div>
            <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>takeProfit</JsonKey>
            <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
            <div className="pl-4">
              <JsonKey>type</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="string">{takeProfitType}</JsonValue>
              <JsonSyntaxSpan>,</JsonSyntaxSpan>
            </div>
            <div className="pl-4">
              <JsonKey>value</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="number">{takeProfitValue}</JsonValue>
            </div>
            <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>trailingStop</JsonKey>
            <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
            <div className="pl-4">
              <JsonKey>enabled</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="boolean">{trailingEnabled.toString()}</JsonValue>
              <JsonSyntaxSpan>,</JsonSyntaxSpan>
            </div>
            <div className="pl-4">
              <JsonKey>activation</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="number">{trailingActivation}%</JsonValue>
              <JsonSyntaxSpan>,</JsonSyntaxSpan>
            </div>
            <div className="pl-4">
              <JsonKey>distance</JsonKey>
              <JsonSyntaxSpan>: </JsonSyntaxSpan>
              <JsonValue type="number">{trailingDistance} ATR</JsonValue>
            </div>
            <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
          </div>
          <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
          <JsonSyntaxSpan>,</JsonSyntaxSpan>
        </div>

        {/* Position */}
        <div className="pl-4">
          <JsonKey>position</JsonKey>
          <JsonSyntaxSpan>: {'{'}</JsonSyntaxSpan>
          <div className="pl-4">
            <JsonKey>sizing</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="string">{positionSizing}</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>size</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="number">{positionSize}</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>riskPerTrade</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="number">{riskPerTrade}%</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>leverage</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="number">{leverage}x</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>maxPositions</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="number">{maxPositions}</JsonValue>
            <JsonSyntaxSpan>,</JsonSyntaxSpan>
          </div>
          <div className="pl-4">
            <JsonKey>maxDailyLoss</JsonKey>
            <JsonSyntaxSpan>: </JsonSyntaxSpan>
            <JsonValue type="number">{maxDailyLoss}%</JsonValue>
          </div>
          <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
        </div>

        <JsonSyntaxSpan>{'}'}</JsonSyntaxSpan>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Slider with Label
// ═══════════════════════════════════════════════════════════════

function LabeledSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  suffix = '',
  locale,
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  locale: 'en' | 'fa';
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-white/60">{label}</Label>
        <span className="text-xs font-semibold text-[#19C37D]">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        className="[&_[role=slider]]:bg-[#19C37D] [&_[role=slider]]:border-[#19C37D] [&>span:first-child]:bg-white/[0.1] [&>span:first-child]:h-1.5"
      />
      <div className="flex justify-between text-[10px] text-white/20">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Strategy Builder Panel
// ═══════════════════════════════════════════════════════════════

export default function StrategyBuilderPanel() {
  const locale = useAppStore((s) => s.locale);
  const currentStrategy = useAppStore((s) => s.currentStrategy);
  const setCurrentStrategy = useAppStore((s) => s.setCurrentStrategy);
  const setActivePage = useAppStore((s) => s.setActivePage);

  // ── Import Dialog ──
  const [importOpen, setImportOpen] = useState(false);

  // ── General ──
  const [strategyName, setStrategyName] = useState('EMA Crossover Strategy');
  const [description, setDescription] = useState(
    'A classic trend-following strategy using EMA crossovers combined with RSI and MACD confirmation filters.',
  );
  const [strategyType, setStrategyType] = useState('trend');
  const [visibility, setVisibility] = useState('private');

  // ── Entry Conditions ──
  const [entryGroups, setEntryGroups] =
    useState<ConditionGroup[]>(DEFAULT_ENTRY_GROUPS);
  const [entryOperator, setEntryOperator] = useState<'AND' | 'OR'>('AND');

  // ── Exit Conditions ──
  const [exitGroups, setExitGroups] =
    useState<ConditionGroup[]>(DEFAULT_EXIT_GROUPS);
  const [exitOperator, setExitOperator] = useState<'AND' | 'OR'>('AND');

  // ── Risk Management ──
  const [stopLossType, setStopLossType] = useState<'fixed' | 'atr'>('fixed');
  const [stopLossValue, setStopLossValue] = useState(2);
  const [takeProfitType, setTakeProfitType] = useState<'fixed' | 'atr'>('fixed');
  const [takeProfitValue, setTakeProfitValue] = useState(4);
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingActivation, setTrailingActivation] = useState(1.5);
  const [trailingDistance, setTrailingDistance] = useState(1.5);
  const [positionSizing, setPositionSizing] = useState('fixed');
  const [positionSize, setPositionSize] = useState(100);
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [maxPositions, setMaxPositions] = useState(5);
  const [maxDailyLoss, setMaxDailyLoss] = useState(3);

  // ── Computed ──
  const totalConditions = useMemo(() => {
    const entryCount = entryGroups.reduce(
      (sum, g) => sum + g.conditions.length,
      0,
    );
    const exitCount = exitGroups.reduce(
      (sum, g) => sum + g.conditions.length,
      0,
    );
    return entryCount + exitCount;
  }, [entryGroups, exitGroups]);

  const handleSaveStrategy = useCallback(() => {
    const strategy: Strategy = {
      id: currentStrategy?.id || GEN_ID(),
      name: strategyName || t('builder.untitledStrategy', locale),
      description,
      type: strategyType,
      visibility,
      status: 'draft',
      definition: {
        entry: {
          operator: entryOperator,
          groups: entryGroups.map((g) => ({
            id: g.id,
            operator: g.logic,
            conditions: g.conditions.map((c) => ({
              id: c.id,
              indicator: c.indicator,
              operator: c.operator,
              value: parseFloat(c.value) || 0,
              timeframe: c.timeframe,
            })),
          })),
        },
        exit: {
          operator: exitOperator,
          groups: exitGroups.map((g) => ({
            id: g.id,
            operator: g.logic,
            conditions: g.conditions.map((c) => ({
              id: c.id,
              indicator: c.indicator,
              operator: c.operator,
              value: parseFloat(c.value) || 0,
              timeframe: c.timeframe,
            })),
          })),
        },
        stopLoss: { type: stopLossType, value: stopLossValue },
        takeProfit: { type: takeProfitType, value: takeProfitValue },
        trailingStop: {
          enabled: trailingEnabled,
          activation: trailingActivation,
          distance: trailingDistance,
        },
        positionSizing: positionSizing as 'fixed' | 'percent' | 'risk' | 'kelly',
        positionSize,
        riskPerTrade,
        leverage,
        maxPositions,
        maxDailyLoss,
      },
      parameters: {},
      authorId: 'user-1',
      createdAt: currentStrategy?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: currentStrategy?.version || '1.0.0',
      backtestCount: currentStrategy?.backtestCount || 0,
      bestSharpe: currentStrategy?.bestSharpe || null,
      bestCAGR: currentStrategy?.bestCAGR || null,
    };
    setCurrentStrategy(strategy);
  }, [
    strategyName,
    description,
    strategyType,
    visibility,
    entryOperator,
    entryGroups,
    exitOperator,
    exitGroups,
    stopLossType,
    stopLossValue,
    takeProfitType,
    takeProfitValue,
    trailingEnabled,
    trailingActivation,
    trailingDistance,
    positionSizing,
    positionSize,
    riskPerTrade,
    leverage,
    maxPositions,
    maxDailyLoss,
    currentStrategy,
    locale,
    setCurrentStrategy,
  ]);

  const handleRunBacktest = useCallback(() => {
    handleSaveStrategy();
    setActivePage('backtest');
  }, [handleSaveStrategy, setActivePage]);

  const handleImport = useCallback((data: ImportedStrategyData) => {
    setStrategyName(data.name);
    setDescription(data.description);
    if (data.entryConditions.length > 0) {
      setEntryGroups([
        {
          id: GEN_ID(),
          logic: 'AND' as const,
          conditions: data.entryConditions.map((c) => ({
            id: GEN_ID(),
            indicator: c.indicator,
            operator: c.operator,
            value: c.value,
            value2: c.value2,
            timeframe: c.timeframe,
          })),
        },
      ]);
    }
    if (data.exitConditions.length > 0) {
      setExitGroups([
        {
          id: GEN_ID(),
          logic: 'AND' as const,
          conditions: data.exitConditions.map((c) => ({
            id: GEN_ID(),
            indicator: c.indicator,
            operator: c.operator,
            value: c.value,
            value2: c.value2,
            timeframe: c.timeframe,
          })),
        },
      ]);
    }
    setStopLossType(data.stopLossType);
    setStopLossValue(data.stopLossValue);
    setTakeProfitType(data.takeProfitType);
    setTakeProfitValue(data.takeProfitValue);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* ═══════════════════════════════════════════════════════ */}
        {/* LEFT SIDE — Strategy Definition Form (3/5 = 60%)      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.05 }}
          className={cn(GLASS_CARD, 'col-span-1 p-4 md:p-5 lg:col-span-3')}
        >
          <Tabs defaultValue="entry" className="w-full">
            <TabsList className="mb-5 flex w-full flex-wrap gap-1 bg-white/[0.03] p-1">
              <TabsTrigger
                value="entry"
                className="flex-1 gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
              >
                <Target className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t('builder.entryConditions', locale)}
                </span>
                <Badge
                  variant="secondary"
                  className="h-5 min-w-[20px] rounded-full bg-[#19C37D]/10 px-1.5 text-[10px] font-semibold text-[#19C37D]"
                >
                  {entryGroups.reduce((s, g) => s + g.conditions.length, 0)}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="exit"
                className="flex-1 gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t('builder.exitConditions', locale)}
                </span>
                <Badge
                  variant="secondary"
                  className="h-5 min-w-[20px] rounded-full bg-[#19C37D]/10 px-1.5 text-[10px] font-semibold text-[#19C37D]"
                >
                  {exitGroups.reduce((s, g) => s + g.conditions.length, 0)}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="risk"
                className="flex-1 gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t('builder.riskManagement', locale)}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="flex-1 gap-1.5 text-xs data-[state=active]:bg-[#19C37D]/15 data-[state=active]:text-[#19C37D]"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t('builder.general', locale)}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* ─── TAB 1: Entry Conditions ─── */}
            <TabsContent value="entry" className="mt-0">
              <ConditionBuilder
                groups={entryGroups}
                groupOperator={entryOperator}
                locale={locale}
                onSetGroups={setEntryGroups}
                onSetGroupOperator={setEntryOperator}
              />
            </TabsContent>

            {/* ─── TAB 2: Exit Conditions ─── */}
            <TabsContent value="exit" className="mt-0">
              <ConditionBuilder
                groups={exitGroups}
                groupOperator={exitOperator}
                locale={locale}
                onSetGroups={setExitGroups}
                onSetGroupOperator={setExitOperator}
              />
            </TabsContent>

            {/* ─── TAB 3: Risk Management ─── */}
            <TabsContent value="risk" className="mt-0">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Stop Loss */}
                <motion.div variants={itemVariants} className={cn(GLASS_CARD, 'p-4')}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                      <Shield className="h-3.5 w-3.5 text-red-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      {t('builder.stopLoss', locale)}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">
                          {t('common.type', locale)}
                        </Label>
                        <Select
                          value={stopLossType}
                          onValueChange={(v) =>
                            setStopLossType(v as 'fixed' | 'atr')
                          }
                        >
                          <SelectTrigger className={cn('h-9 text-xs', GLASS_INPUT)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/[0.1] bg-[#0D2137]">
                            <SelectItem value="fixed" className="text-xs">
                              {t('builder.fixed', locale)}
                            </SelectItem>
                            <SelectItem value="atr" className="text-xs">
                              {t('builder.atrMultiple', locale)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">
                          {t('builder.value', locale)}
                          {stopLossType === 'fixed' ? ' (%)' : ' (ATR)'}
                        </Label>
                        <Input
                          type="number"
                          value={stopLossValue}
                          onChange={(e) =>
                            setStopLossValue(parseFloat(e.target.value) || 0)
                          }
                          className={cn('h-9 text-xs', GLASS_INPUT)}
                          min={0}
                          step={stopLossType === 'atr' ? 0.5 : 0.1}
                        />
                      </div>
                    </div>
                    {stopLossType === 'atr' && (
                      <LabeledSlider
                        label={`${t('builder.value', locale)} (ATR)`}
                        value={stopLossValue}
                        onValueChange={setStopLossValue}
                        min={0.5}
                        max={5}
                        step={0.5}
                        locale={locale}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Take Profit */}
                <motion.div variants={itemVariants} className={cn(GLASS_CARD, 'p-4')}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Target className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      {t('builder.takeProfit', locale)}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">
                          {t('common.type', locale)}
                        </Label>
                        <Select
                          value={takeProfitType}
                          onValueChange={(v) =>
                            setTakeProfitType(v as 'fixed' | 'atr')
                          }
                        >
                          <SelectTrigger className={cn('h-9 text-xs', GLASS_INPUT)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/[0.1] bg-[#0D2137]">
                            <SelectItem value="fixed" className="text-xs">
                              {t('builder.fixed', locale)}
                            </SelectItem>
                            <SelectItem value="atr" className="text-xs">
                              {t('builder.atrMultiple', locale)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-white/60">
                          {t('builder.value', locale)}
                          {takeProfitType === 'fixed' ? ' (%)' : ' (ATR)'}
                        </Label>
                        <Input
                          type="number"
                          value={takeProfitValue}
                          onChange={(e) =>
                            setTakeProfitValue(parseFloat(e.target.value) || 0)
                          }
                          className={cn('h-9 text-xs', GLASS_INPUT)}
                          min={0}
                          step={takeProfitType === 'atr' ? 0.5 : 0.1}
                        />
                      </div>
                    </div>
                    {takeProfitType === 'atr' && (
                      <LabeledSlider
                        label={`${t('builder.value', locale)} (ATR)`}
                        value={takeProfitValue}
                        onValueChange={setTakeProfitValue}
                        min={0.5}
                        max={5}
                        step={0.5}
                        locale={locale}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Trailing Stop */}
                <motion.div variants={itemVariants} className={cn(GLASS_CARD, 'p-4')}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
                        <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {t('builder.trailingStop', locale)}
                      </h4>
                    </div>
                    <Switch
                      checked={trailingEnabled}
                      onCheckedChange={setTrailingEnabled}
                      className="data-[state=checked]:bg-[#19C37D]"
                    />
                  </div>
                  {trailingEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <LabeledSlider
                        label={t('builder.activation', locale)}
                        value={trailingActivation}
                        onValueChange={setTrailingActivation}
                        min={0.5}
                        max={10}
                        step={0.5}
                        suffix="%"
                        locale={locale}
                      />
                      <LabeledSlider
                        label={`${t('builder.distance', locale)} (ATR)`}
                        value={trailingDistance}
                        onValueChange={setTrailingDistance}
                        min={0.5}
                        max={5}
                        step={0.5}
                        locale={locale}
                      />
                    </motion.div>
                  )}
                </motion.div>

                <Separator className="bg-white/[0.06]" />

                {/* Position Sizing */}
                <motion.div variants={itemVariants} className={cn(GLASS_CARD, 'p-4')}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                      <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      {t('builder.positionSizing', locale)}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        {t('common.type', locale)}
                      </Label>
                      <Select
                        value={positionSizing}
                        onValueChange={setPositionSizing}
                      >
                        <SelectTrigger className={cn('h-9 text-xs', GLASS_INPUT)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.1] bg-[#0D2137]">
                          {SIZING_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="text-xs"
                            >
                              {t(opt.labelKey, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        {t('builder.positionSize', locale)}
                      </Label>
                      <Input
                        type="number"
                        value={positionSize}
                        onChange={(e) =>
                          setPositionSize(parseFloat(e.target.value) || 0)
                        }
                        className={cn('h-9 text-xs', GLASS_INPUT)}
                        min={0}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Risk Per Trade */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <LabeledSlider
                    label={t('builder.riskPerTrade', locale)}
                    value={riskPerTrade}
                    onValueChange={setRiskPerTrade}
                    min={0.5}
                    max={5}
                    step={0.5}
                    suffix="%"
                    locale={locale}
                  />

                  <LabeledSlider
                    label={`${t('builder.leverage', locale)} (x)`}
                    value={leverage}
                    onValueChange={setLeverage}
                    min={1}
                    max={10}
                    step={1}
                    suffix="x"
                    locale={locale}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        {t('builder.maxPositions', locale)}
                      </Label>
                      <Input
                        type="number"
                        value={maxPositions}
                        onChange={(e) =>
                          setMaxPositions(parseInt(e.target.value) || 1)
                        }
                        className={cn('h-9 text-xs', GLASS_INPUT)}
                        min={1}
                        max={50}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        {t('builder.maxDailyLoss', locale)} (%)
                      </Label>
                      <Input
                        type="number"
                        value={maxDailyLoss}
                        onChange={(e) =>
                          setMaxDailyLoss(parseFloat(e.target.value) || 0)
                        }
                        className={cn('h-9 text-xs', GLASS_INPUT)}
                        min={0}
                        step={0.5}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* ─── TAB 4: General ─── */}
            <TabsContent value="general" className="mt-0">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <Label className="text-xs text-white/60">
                    {t('builder.strategyName', locale)}
                  </Label>
                  <Input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    className={cn('h-10 text-sm font-medium', GLASS_INPUT)}
                    placeholder={t('builder.strategyName', locale)}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <Label className="text-xs text-white/60">
                    {t('builder.description', locale)}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(
                      'min-h-[100px] resize-none text-sm',
                      GLASS_INPUT,
                    )}
                    placeholder={t('builder.description', locale)}
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">
                      {t('builder.strategyType', locale)}
                    </Label>
                    <Select value={strategyType} onValueChange={setStrategyType}>
                      <SelectTrigger className={cn('h-9 text-xs', GLASS_INPUT)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/[0.1] bg-[#0D2137]">
                        {STRATEGY_TYPES.map((st) => (
                          <SelectItem
                            key={st.value}
                            value={st.value}
                            className="text-xs"
                          >
                            {t(st.labelKey, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">
                      {t('builder.visibility', locale)}
                    </Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger className={cn('h-9 text-xs', GLASS_INPUT)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/[0.1] bg-[#0D2137]">
                        {VISIBILITY_OPTIONS.map((vis) => (
                          <SelectItem
                            key={vis.value}
                            value={vis.value}
                            className="text-xs"
                          >
                            {t(vis.labelKey, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* RIGHT SIDE — Strategy Summary (2/5 = 40%)              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.15 }}
          className="col-span-1 lg:col-span-2"
        >
          <div className="sticky top-6 space-y-4">
            {/* Summary Header */}
            <div className={cn(GLASS_CARD, 'p-4')}>
              <div className="mb-3 flex items-center gap-2">
                <FileJson className="h-4 w-4 text-[#19C37D]" />
                <h3 className="text-sm font-semibold text-white">
                  {t('builder.strategySummary', locale)}
                </h3>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {strategyName || t('builder.untitledStrategy', locale)}
                </h2>
                <Badge
                  className="border-[#19C37D]/20 bg-[#19C37D]/10 text-[#19C37D]"
                >
                  {totalConditions} {t('builder.totalConditions', locale).toLowerCase()}
                </Badge>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-white/40">
                {description}
              </p>
            </div>

            {/* Strategy Type & Visibility badges */}
            <div className={cn(GLASS_CARD, 'flex items-center gap-3 p-4')}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  {t('builder.strategyType', locale)}
                </span>
                <Badge
                  variant="outline"
                  className="border-[#19C37D]/20 text-xs text-[#19C37D]"
                >
                  {t(
                    `builder.type.${strategyType}` as string,
                    locale,
                  )}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-4 bg-white/[0.08]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  {t('builder.visibility', locale)}
                </span>
                <Badge
                  variant="outline"
                  className="border-white/10 text-xs text-white/60"
                >
                  {t(
                    `builder.vis.${visibility}` as string,
                    locale,
                  )}
                </Badge>
              </div>
            </div>

            {/* JSON Tree */}
            <div className={cn(GLASS_CARD, 'p-4')}>
              <div className="mb-3 flex items-center gap-2">
                <FileJson className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs font-medium text-white/50">
                  {t('builder.strategyDefinition', locale)}
                </span>
              </div>
              <StrategyTree
                entryGroups={entryGroups}
                entryOperator={entryOperator}
                exitGroups={exitGroups}
                exitOperator={exitOperator}
                stopLossType={stopLossType}
                stopLossValue={stopLossValue}
                takeProfitType={takeProfitType}
                takeProfitValue={takeProfitValue}
                trailingEnabled={trailingEnabled}
                trailingActivation={trailingActivation}
                trailingDistance={trailingDistance}
                positionSizing={positionSizing}
                positionSize={positionSize}
                riskPerTrade={riskPerTrade}
                leverage={leverage}
                maxPositions={maxPositions}
                maxDailyLoss={maxDailyLoss}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-dashed border-[#19C37D]/30 bg-[#19C37D]/5 text-[#19C37D] hover:bg-[#19C37D]/15 hover:text-[#19C37D]"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                {locale === 'fa' ? 'وارد کردن از TV / MT5' : 'Import from TV / MT5'}
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 border-[#19C37D]/30 bg-[#19C37D]/5 text-[#19C37D] hover:bg-[#19C37D]/15 hover:text-[#19C37D]"
                  onClick={handleSaveStrategy}
                >
                  <Save className="h-4 w-4" />
                  {t('builder.save', locale)}
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-[#19C37D] text-[#071A2B] hover:bg-[#19C37D]/85"
                  onClick={handleRunBacktest}
                >
                  <Play className="h-4 w-4" />
                  {t('builder.runBacktest', locale)}
                </Button>
              </div>
            </div>
            <ImportStrategyDialog
              open={importOpen}
              onOpenChange={setImportOpen}
              onImport={handleImport}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
