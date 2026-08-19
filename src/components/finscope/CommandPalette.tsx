'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandSeparator,
  CommandEmpty,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Layers,
  Wrench,
  Play,
  ArrowLeftRight,
  Wallet,
  Settings2,
  Footprints,
  Dice5,
  AlertTriangle,
  SlidersHorizontal,
  GitCompareArrows,
  ShieldCheck,
  BarChart3,
  FlaskConical,
  Store,
  FolderOpen,
  Share2,
  Users,
  MessageSquare,
  FileText,
  Plus,
  Languages,
  Search,
  LayoutDashboard,
  LineChart,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAppStore, type PageId } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Page Definitions for Command Palette
// ═══════════════════════════════════════════════════════════════

interface PageEntry {
  commandKey: string;
  pageId: PageId;
  labelKey: string;
  icon: React.ElementType;
  category: string;
}

const PAGES: PageEntry[] = [
  { commandKey: 'nav.overview', pageId: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard, category: 'Navigation' },
  { commandKey: 'nav.strategyBuilder', pageId: 'strategy-builder', labelKey: 'nav.strategyBuilder', icon: Wrench, category: 'Navigation' },
  { commandKey: 'nav.backtest', pageId: 'backtest', labelKey: 'nav.backtest', icon: Play, category: 'Analysis' },
  { commandKey: 'nav.backtestResults', pageId: 'backtest-results', labelKey: 'results.title', icon: LineChart, category: 'Analysis' },
  { commandKey: 'nav.forwardTest', pageId: 'forward-test', labelKey: 'nav.forwardTest', icon: ArrowLeftRight, category: 'Analysis' },
  { commandKey: 'nav.paperTrading', pageId: 'paper-trading', labelKey: 'nav.paperTrading', icon: Wallet, category: 'Analysis' },
  { commandKey: 'nav.optimization', pageId: 'optimization', labelKey: 'nav.optimization', icon: Settings2, category: 'Analysis' },
  { commandKey: 'nav.walkForward', pageId: 'walk-forward', labelKey: 'nav.walkForward', icon: Footprints, category: 'Analysis' },
  { commandKey: 'nav.monteCarlo', pageId: 'monte-carlo', labelKey: 'nav.monteCarlo', icon: Dice5, category: 'Analysis' },
  { commandKey: 'nav.stressTest', pageId: 'stress-test', labelKey: 'nav.stressTest', icon: AlertTriangle, category: 'Analysis' },
  { commandKey: 'nav.parameterAnalysis', pageId: 'parameter-analysis', labelKey: 'nav.parameterAnalysis', icon: SlidersHorizontal, category: 'Analysis' },
  { commandKey: 'nav.strategyComparison', pageId: 'strategy-comparison', labelKey: 'nav.strategyComparison', icon: GitCompareArrows, category: 'Analysis' },
  { commandKey: 'nav.riskAnalysis', pageId: 'risk-analysis', labelKey: 'nav.riskAnalysis', icon: ShieldCheck, category: 'Analysis' },
  { commandKey: 'nav.tradeAnalysis', pageId: 'trade-analysis', labelKey: 'nav.tradeAnalysis', icon: BarChart3, category: 'Analysis' },
  { commandKey: 'nav.research', pageId: 'research', labelKey: 'nav.research', icon: FlaskConical, category: 'Workspace' },
  { commandKey: 'nav.marketplace', pageId: 'marketplace', labelKey: 'nav.marketplace', icon: Store, category: 'Workspace' },
  { commandKey: 'nav.myStrategies', pageId: 'my-strategies', labelKey: 'nav.myStrategies', icon: FolderOpen, category: 'Workspace' },
  { commandKey: 'nav.sharedWithMe', pageId: 'shared-with-me', labelKey: 'nav.sharedWithMe', icon: Share2, category: 'Workspace' },
  { commandKey: 'nav.teams', pageId: 'teams', labelKey: 'nav.teams', icon: Users, category: 'Workspace' },
  { commandKey: 'nav.chat', pageId: 'chat', labelKey: 'nav.chat', icon: MessageSquare, category: 'Workspace' },
  { commandKey: 'nav.reports', pageId: 'reports', labelKey: 'nav.reports', icon: FileText, category: 'Workspace' },
];

interface ActionEntry {
  commandKey: string;
  labelKey: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

// ═══════════════════════════════════════════════════════════════
// CommandPalette Component
// ═══════════════════════════════════════════════════════════════

export function CommandPalette() {
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const setCurrentStrategy = useAppStore((s) => s.setCurrentStrategy);
  const bumpStrategyBuilderKey = useAppStore((s) => s.bumpStrategyBuilderKey);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const runCommand = useAppStore((s) => s.runCommand);

  const handleNavigate = useCallback(
    (pageId: PageId, commandKey: string) => {
      setActivePage(pageId);
      setCommandPaletteOpen(false);
    },
    [setActivePage, setCommandPaletteOpen]
  );

  const actions: ActionEntry[] = [
    {
      commandKey: 'action.run-backtest',
      labelKey: 'backtest.run',
      icon: Play,
      shortcut: '⌘B',
      action: () => {
        handleNavigate('backtest', 'nav.backtest');
      },
    },
    {
      commandKey: 'action.new-strategy',
      labelKey: 'builder.newStrategy',
      icon: Plus,
      shortcut: '⌘N',
      action: () => {
        setCurrentStrategy(null);
        bumpStrategyBuilderKey();
        handleNavigate('strategy-builder', 'nav.strategyBuilder');
      },
    },
    {
      commandKey: 'action.toggle-language',
      labelKey: 'Toggle Language',
      icon: Languages,
      shortcut: '⌘L',
      action: () => {
        setLocale(locale === 'en' ? 'fa' : 'en');
        setCommandPaletteOpen(false);
      },
    },
  ];

  // Group pages by category
  const categories = ['Navigation', 'Analysis', 'Workspace'];
  const grouped = categories.map((cat) => ({
    heading: cat,
    items: PAGES.filter((p) => p.category === cat),
  }));

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent
        className="overflow-hidden p-0 border-white/[0.08] bg-[#0B2239]/95 backdrop-blur-2xl shadow-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>Search for pages and actions</DialogDescription>
        </DialogHeader>
        <Command
          className="[&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4"
        >
          <div className="flex items-center border-b border-white/[0.08] px-4">
            <Search className="mr-2 h-4 w-4 text-slate-500" />
            <CommandInput
              placeholder={t('command.search', locale)}
              className="h-12 border-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[380px]">
            <CommandEmpty className="py-6 text-sm text-slate-500">
              {t('command.noResults', locale)}
            </CommandEmpty>

            {grouped.map((group, gIdx) => (
              <React.Fragment key={group.heading}>
                {gIdx > 0 && <CommandSeparator className="mx-2 bg-white/[0.06]" />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((page) => {
                    const Icon = page.icon;
                    return (
                      <CommandItem
                        key={page.commandKey}
                        value={`${page.labelKey} ${page.category.toLowerCase()} ${t(page.labelKey, locale).toLowerCase()}`}
                        onSelect={() => handleNavigate(page.pageId, page.commandKey)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-white cursor-pointer"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(25,195,125,0.1)' }}>
                          <Icon className="h-4 w-4" style={{ color: '#19C37D' }} />
                        </div>
                        <span className="flex-1 text-sm">{t(page.labelKey, locale)}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}

            <CommandSeparator className="mx-2 bg-white/[0.06]" />
            <CommandGroup heading="Actions">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.commandKey}
                    value={`${action.labelKey} action ${t(action.labelKey, locale).toLowerCase()}`}
                    onSelect={action.action}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-white cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
                      <Icon className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="flex-1 text-sm">{t(action.labelKey, locale)}</span>
                    {action.shortcut && (
                      <span className="rounded border border-white/[0.10] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                        {action.shortcut}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
