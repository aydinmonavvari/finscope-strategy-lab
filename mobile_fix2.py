#!/usr/bin/env python3
"""mobile_fix2.py — Fix remaining mobile sidebar issues (flexible regex matching)
Usage: python3 mobile_fix2.py
"""
import os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
GREEN = '\033[92m'
RST = '\033[0m'

def ok(msg):   print(f"  {GREEN}✓{RST} {msg}")
def err(msg):  print(f"  {RED}✗{RST} {msg}")
RED = '\033[91m'

count = 0

# ── Patch Sidebar.tsx ──
fpath = os.path.join(BASE, 'src/components/finscope/Sidebar.tsx')
with open(fpath, 'r') as f:
    content = f.read()

# 1. Add body scroll lock useEffect after closeMobileSidebar
if 'document.body.style.overflow' not in content:
    pattern = r"(const closeMobileSidebar = \(\) => setMobileSidebarOpen\(false\);)"
    replacement = r"""\1

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);"""
    content, n = re.subn(pattern, replacement, content, count=1)
    if n:
        ok('Added body scroll lock'); count += 1
    else:
        err('Could not find closeMobileSidebar')
else:
    ok('Body scroll lock already exists'); count += 1

# 2. Make close button bigger
if 'h-10 w-10' not in content or 'right-2 top-3' not in content:
    content = content.replace('right-3 top-4 z-50 flex h-8 w-8', 'right-2 top-3 z-50 flex h-10 w-10')
    if 'right-2 top-3 z-50 flex h-10 w-10' in content:
        ok('Close button enlarged'); count += 1
    else:
        err('Could not find close button')
else:
    ok('Close button already fixed'); count += 1

# 3. Add shadow to mobile sidebar
if 'shadow-2xl shadow-black' not in content:
    # Find the mobile sidebar className and add shadow
    pattern = r'bg-\[#051220\](\s+md:hidden)'
    replacement = r'bg-[#051220] shadow-2xl shadow-black/50\1'
    content, n = re.subn(pattern, replacement, content, count=1)
    if n:
        ok('Added shadow to mobile sidebar'); count += 1
    else:
        err('Could not find mobile sidebar class')
else:
    ok('Shadow already exists'); count += 1

if count >= 3:
    with open(fpath, 'w') as f:
        f.write(content)
    print(f"\n  {GREEN}✓ All {count}/3 remaining fixes applied!{RST}")
else:
    err(f'Only {count}/3 applied')
    sys.exit(1)
