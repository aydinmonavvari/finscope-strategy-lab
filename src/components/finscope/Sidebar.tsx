'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wrench,
  Clock,
  Forward,
  Wallet,
  Settings2,
  Shuffle,
  Dice5,
  AlertTriangle,
  SlidersHorizontal,
  GitCompareArrows,
  ShieldAlert,
  BarChart3,
  BookOpen,
  Store,
  FolderOpen,
  Users,
  UsersRound,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useAppStore, type PageId } from '@/lib/store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  pageId: PageId;
  labelKey: string;
  icon: LucideIcon;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: 'MAIN',
    items: [
      { pageId: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard },
      { pageId: 'strategy-builder', labelKey: 'nav.strategyBuilder', icon: Wrench },
      { pageId: 'backtest', labelKey: 'nav.backtest', icon: Clock },
    ],
  },
  {
    labelKey: 'TESTING',
    items: [
      { pageId: 'forward-test', labelKey: 'nav.forwardTest', icon: Forward },
      { pageId: 'paper-trading', labelKey: 'nav.paperTrading', icon: Wallet },
    ],
  },
  {
    labelKey: 'ANALYSIS',
    items: [
      { pageId: 'optimization', labelKey: 'nav.optimization', icon: Settings2 },
      { pageId: 'walk-forward', labelKey: 'nav.walkForward', icon: Shuffle },
      { pageId: 'monte-carlo', labelKey: 'nav.monteCarlo', icon: Dice5 },
      { pageId: 'stress-test', labelKey: 'nav.stressTest', icon: AlertTriangle },
      { pageId: 'parameter-analysis', labelKey: 'nav.parameterAnalysis', icon: SlidersHorizontal },
      { pageId: 'strategy-comparison', labelKey: 'nav.strategyComparison', icon: GitCompareArrows },
      { pageId: 'risk-analysis', labelKey: 'nav.riskAnalysis', icon: ShieldAlert },
      { pageId: 'trade-analysis', labelKey: 'nav.tradeAnalysis', icon: BarChart3 },
    ],
  },
  {
    labelKey: 'WORKSPACE',
    items: [
      { pageId: 'research', labelKey: 'nav.research', icon: BookOpen },
      { pageId: 'marketplace', labelKey: 'nav.marketplace', icon: Store },
      { pageId: 'my-strategies', labelKey: 'nav.myStrategies', icon: FolderOpen },
      { pageId: 'shared-with-me', labelKey: 'nav.sharedWithMe', icon: Users },
    ],
  },
  {
    labelKey: 'TEAM',
    items: [
      { pageId: 'teams', labelKey: 'nav.teams', icon: UsersRound },
      { pageId: 'chat', labelKey: 'nav.chat', icon: MessageSquare },
    ],
  },
  {
    labelKey: 'OUTPUT',
    items: [
      { pageId: 'reports', labelKey: 'nav.reports', icon: FileText },
    ],
  },
];

function NavItemButton({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { activePage, setActivePage, locale } = useAppStore();
  const isActive = activePage === item.pageId;
  const Icon = item.icon;
  const label = t(item.labelKey, locale);

  const buttonContent = (
    <button
      onClick={() => setActivePage(item.pageId)}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        collapsed && 'justify-center px-2',
        isActive
          ? 'bg-[rgba(25,195,125,0.15)] text-[#19C37D]'
          : 'text-[#94A3B8] hover:bg-[rgba(25,195,125,0.08)] hover:text-[#E2E8F0]'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#19C37D]"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          'shrink-0 transition-colors',
          collapsed ? 'size-5' : 'size-4',
          isActive ? 'text-[#19C37D]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
        )}
      />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="truncate whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}

export default function Sidebar() {
  const { sidebarCollapsed, locale } = useAppStore();

  return (
    <motion.div
      className="fixed left-0 top-0 z-20 flex h-full flex-col border-r border-[rgba(25,195,125,0.1)] bg-[#051220]"
      animate={{ width: sidebarCollapsed ? 68 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="complementary"
    >
      {/* Brand / Logo */}
      <div className={cn('flex h-14 shrink-0 items-center border-b border-[rgba(25,195,125,0.08)] px-4', sidebarCollapsed && 'justify-center px-2')}>
        <AnimatePresence mode="wait">
          {sidebarCollapsed ? (
            <motion.div
              key="collapsed-brand"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <span className="text-lg font-bold tracking-tight text-[#19C37D] finscope-text-glow">
                FS
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="expanded-brand"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="text-base font-bold tracking-tight text-[#19C37D] finscope-text-glow">
                FinScope
              </span>
              <span className="text-[10px] font-medium tracking-wide text-[#64748B]">
                Strategy Lab™
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-1">
        {navGroups.map((group, groupIndex) => (
          <div key={group.labelKey}>
            {groupIndex > 0 && (
              <Separator className="my-2 bg-[rgba(25,195,125,0.06)]" />
            )}
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  key={group.labelKey}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="sidebar-section-title mb-1 px-3 pt-1"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                    {group.labelKey}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {group.items.map((item) => (
              <NavItemButton
                key={item.pageId}
                item={item}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom disclaimer */}
      <div className={cn('shrink-0 border-t border-[rgba(25,195,125,0.08)] px-4 py-3', sidebarCollapsed && 'px-2')}>
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.p
              key="disclaimer-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] leading-tight text-[#475569]"
            >
              {t('common.perspective', locale)}
            </motion.p>
          ) : (
            <motion.div
              key="disclaimer-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-[#475569] cursor-default">⚠</span>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t('common.perspective', locale)}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
