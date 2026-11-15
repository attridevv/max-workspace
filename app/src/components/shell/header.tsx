'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDayLine, todayParts } from '@/lib/dates';
import { NAV, SETTINGS, isActive } from './nav';
import { QuickCaptureButton } from './quick-capture';
import { Logo } from '@/components/ui/logo';

export function Header() {
  const t = todayParts();
  const pathname = usePathname();
  const group = NAV.find((g) => g.items.some((i) => isActive(pathname, i.href)));
  const item = group?.items.find((i) => isActive(pathname, i.href)) ?? (isActive(pathname, SETTINGS.href) ? SETTINGS : null);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        {/* phone: logo + page name */}
        <Link href="/app" className="flex min-w-0 items-center gap-2 lg:hidden">
          <Logo size={28} />
          <span className="truncate font-display text-[1rem] font-[540]">{item?.label ?? 'Max Workspace'}</span>
        </Link>
        {/* desktop: where you are */}
        <p className="hidden items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase lg:flex">
          {group && group.title !== item?.label && <><span className="text-ink-4">{group.title}</span><span className="text-line-2">/</span></>}
          <span className="text-ink-2">{item?.label}</span>
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.12em] whitespace-nowrap text-ink-4 uppercase">{formatDayLine(t.year, t.month, t.day)}</span>
          <div className="hidden lg:block"><QuickCaptureButton /></div>
        </div>
      </div>
    </header>
  );
}
