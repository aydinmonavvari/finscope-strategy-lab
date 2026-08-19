#!/usr/bin/env python3
"""mobile_fix.py — Fix mobile sidebar & responsiveness for finscope-strategy-lab
Usage: python3 mobile_fix.py
"""
import os, shutil, sys

BASE = os.path.dirname(os.path.abspath(__file__))

GREEN = '\033[92m'
RED = '\033[91m'
RST = '\033[0m'

def ok(msg):   print(f"  {GREEN}✓{RST} {msg}")
def err(msg):  print(f"  {RED}✗{RST} {msg}")

def patch_file(rel_path, old, new):
    fpath = os.path.join(BASE, rel_path)
    if not os.path.exists(fpath):
        err(f"{rel_path} not found"); return False
    with open(fpath, 'r') as f:
        content = f.read()
    if old not in content:
        err(f"{rel_path}: pattern not found"); return False
    content = content.replace(old, new, 1)
    with open(fpath, 'w') as f:
        f.write(content)
    ok(f"Patched {rel_path}")
    return True

print(f"\n  Fixing mobile sidebar & responsiveness...")

count = 0

# 1. page.tsx — fix overflow and add w-full min-w-0
count += patch_file(
    'src/app/page.tsx',
    '    <div className="relative min-h-screen w-full overflow-hidden bg-[#071A2B]">',
    '    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#071A2B]">',
)

count += patch_file(
    'src/app/page.tsx',
    'className="relative z-10 min-h-screen flex flex-col transition-[margin] duration-300"',
    'className="relative z-10 min-h-screen flex flex-col w-full transition-[margin] duration-300"',
)

count += patch_file(
    'src/app/page.tsx',
    '<div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto scrollbar-thin">',
    '<div className="flex-1 w-full min-w-0 p-3 sm:p-4 md:p-6 overflow-y-auto scrollbar-thin">',
)

# 2. Sidebar.tsx — add useEffect import + body scroll lock + bigger close button + shadow
count += patch_file(
    'src/components/finscope/Sidebar.tsx',
    "'use client';\n\nimport { motion, AnimatePresence } from 'framer-motion';",
    "'use client';\n\nimport { useEffect } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';",
)

count += patch_file(
    'src/components/finscope/Sidebar.tsx',
    '''export default function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  const closeMobileSidebar = () => setMobileSidebarOpen(false);''',
    '''export default function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);''',
)

count += patch_file(
    'src/components/finscope/Sidebar.tsx',
    'className="absolute right-3 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg',
    'className="absolute right-2 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg',
)

count += patch_file(
    'src/components/finscope/Sidebar.tsx',
    'bg-[#051220] md:hidden"\n            role="complementary"',
    'bg-[#051220] shadow-2xl shadow-black/50 md:hidden"\n            role="complementary"',
)

# 3. globals.css — add mobile CSS fix
count += patch_file(
    'src/app/globals.css',
    '''[dir="rtl"] .metric-value {
  direction: ltr;
  text-align: right;
}''',
    '''[dir="rtl"] .metric-value {
  direction: ltr;
  text-align: right;
}

/* Mobile fixes */
@media (max-width: 767px) {
  body {
    overflow-x: hidden;
    width: 100vw;
  }
  body.sidebar-open {
    overflow: hidden !important;
  }
}''',
)

if count >= 6:
    print(f"\n  {GREEN}✓ All {count} mobile fixes applied!{RST}")
else:
    print(f"\n  {RED}✗ Only {count}/6 patches applied. Some patterns were not found.{RST}")
    sys.exit(1)
