'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Ellipsis, Sun, Target, X } from 'lucide-react';
import { useLife } from '@/lib/store';
import { daysInMonth, monthName, todayParts } from '@/lib/dates';
import { monthCompletion } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { ABOUT_URL, ALL_NAV, isActive, NAV, SETTINGS, type NavItem } from './nav';
import { useCapture } from './quick-capture';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitch } from '@/components/ui/theme';

function RailLink({ item, pathname, badge }: { item: NavItem; pathname: string; badge?: number }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined}
      className={cn('group flex items-center gap-3 rounded-[8px] px-3 py-2 text-[0.9375rem] transition-colors',
        active ? 'bg-card text-ink shadow-[0_1px_0_rgba(33,30,25,0.05),0_4px_14px_-10px_rgba(33,30,25,0.4)]' : 'text-ink-2 hover:bg-paper-3/70 hover:text-ink')}>
      <Icon className={cn('size-[17px] shrink-0', active ? 'text-sage-deep' : 'text-ink-4 group-hover:text-ink-3')} strokeWidth={1.75} />
      <span className="flex-1">{item.label}</span>
      {!!badge && <span className="rounded-full bg-pen px-1.5 py-px font-mono text-[10px] text-paper tnum">{badge}</span>}
    </Link>
  );
}

export function Rail() {
  const pathname = usePathname();
  const { data, todayMonth } = useLife();
  const t = todayParts();
  const total = daysInMonth(t.year, t.month);
  const inbox = data?.captures.length ?? 0;
  return (
    <aside className="hidden w-[256px] shrink-0 border-r border-line bg-paper-2/80 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <Link href="/app" className="flex items-center gap-2.5 px-6 pt-6 pb-5">
          <Logo size={34} />
          <span className="leading-tight">
            <span className="block font-display text-[1.02rem] font-[540]">Max Workspace</span>
            <span className="block font-mono text-[10px] tracking-[0.14em] text-ink-4 uppercase">Notebook companion</span>
          </span>
        </Link>

        {/* the month at a glance — always visible */}
        <div className="mx-4 mb-3 rounded-[10px] border border-line bg-card px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[0.95rem]">{monthName(t.month)}</span>
            <span className="font-mono text-[10px] text-ink-4 tnum">day {t.day}/{total}</span>
          </div>
          <div className="mt-2 flex gap-[2px]" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={cn('h-1.5 flex-1 rounded-[1px]', i + 1 < t.day ? 'bg-sage' : i + 1 === t.day ? 'bg-ink' : 'bg-paper-3')} />
            ))}
          </div>
          {todayMonth && <p className="mt-2 text-xs text-ink-3"><span className="tnum font-medium text-ink">{monthCompletion(todayMonth)}%</span> of habits kept so far</p>}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Workspace">
          {NAV.map((g) => (
            <div key={g.title} className="mt-4 first:mt-1">
              <p className="px-3 pb-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-4 uppercase">{g.title}</p>
              <div className="flex flex-col gap-0.5">
                {g.items.map((item) => <RailLink key={item.href} item={item} pathname={pathname} badge={item.href === '/app/inbox' ? inbox : undefined} />)}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center justify-between gap-2 pr-1">
            <div className="flex-1"><RailLink item={SETTINGS} pathname={pathname} /></div>
            <ThemeSwitch compact />
          </div>
          <a href={ABOUT_URL} target="_blank" rel="noopener" className="mt-1 block px-3 py-1.5 text-xs text-ink-4 hover:text-sage-deep">How the notebook works ↗</a>
        </div>
      </div>
    </aside>
  );
}

function Tab({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: typeof Sun; pathname: string }) {
  const active = isActive(pathname, href);
  return (
    <Link href={href} className={cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', active ? 'text-ink' : 'text-ink-4')}>
      <Icon className="size-5" strokeWidth={active ? 2.1 : 1.6} />{label}
    </Link>
  );
}

/** Phone: a bottom tab bar with capture in the middle, and a sheet for the rest. */
export function MobileNav() {
  const pathname = usePathname();
  const { open } = useCapture();
  const { data } = useLife();
  const [more, setMore] = useState(false);
  const inbox = data?.captures.length ?? 0;

  const tabs = [
    { href: '/app', label: 'Today', icon: Sun },
    { href: '/app/month', label: 'Month', icon: CalendarDays },
  ];
  const tabs2 = [{ href: '/app/goals', label: 'Goals', icon: Target }];
  const moreActive = !['/app', '/app/month', '/app/goals'].some((h) => isActive(pathname, h));


  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Workspace">
        <div className="mx-auto flex max-w-[520px] items-stretch px-2">
          {tabs.map((t) => <Tab key={t.href} {...t} pathname={pathname} />)}
          <div className="flex flex-1 items-center justify-center">
            <button type="button" onClick={() => open()} aria-label="Capture" className="-mt-5 grid size-14 place-items-center rounded-full bg-ink text-2xl text-paper shadow-[0_8px_20px_-6px_rgba(33,30,25,0.55)] ring-4 ring-paper">＋</button>
          </div>
          {tabs2.map((t) => <Tab key={t.href} {...t} pathname={pathname} />)}
          <button type="button" onClick={() => setMore(true)} className={cn('relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]', moreActive ? 'text-ink' : 'text-ink-4')}>
            <Ellipsis className="size-5" strokeWidth={moreActive ? 2.1 : 1.6} />More
            {!!inbox && <span className="absolute top-1.5 right-[calc(50%-16px)] size-2 rounded-full bg-pen" />}
          </button>
        </div>
      </nav>
      {more && (
        <div className="fixed inset-0 z-50 bg-scrim lg:hidden" onClick={() => setMore(false)}>
          <div className="rise absolute inset-x-0 bottom-0 rounded-t-[18px] border-t border-line bg-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <ThemeSwitch />
              <button type="button" onClick={() => setMore(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-paper-2"><X className="size-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ALL_NAV.filter((n) => !['/app', '/app/month', '/app/goals'].includes(n.href)).map((n) => {
                const Icon = n.icon;
                const active = isActive(pathname, n.href);
                return (
                  <Link key={n.href} href={n.href} onClick={() => setMore(false)} className={cn('relative flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3.5 text-center text-xs', active ? 'border-ink bg-paper text-ink' : 'border-line text-ink-2')}>
                    <Icon className="size-5 text-sage-deep" strokeWidth={1.7} />{n.label}
                    {n.href === '/app/inbox' && !!inbox && <span className="absolute top-2 right-2 rounded-full bg-pen px-1.5 font-mono text-[10px] text-paper">{inbox}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
