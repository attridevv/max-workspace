'use client';

import { formatLongDate, todayParts } from '@/lib/dates';
import { QuickCaptureButton } from './quick-capture';

export function Header() {
  const t = todayParts();
  return <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur"><div className="mx-auto flex h-[57px] max-w-[1120px] items-center justify-between gap-4 px-5 lg:px-8"><span className="font-display text-sm font-[520] lg:hidden">Max Workspace</span><span className="hidden label-mono lg:inline">the companion</span><div className="flex items-center gap-3"><span className="hidden label-mono text-ink-4 sm:inline">{formatLongDate(t.year, t.month, t.day)}</span><QuickCaptureButton /></div></div></header>;
}
