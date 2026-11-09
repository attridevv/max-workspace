'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  ['/app', 'Dashboard', '01'], ['/app/month', 'Monthly view', '02'],
  ['/app/habits', 'Habits', '03'], ['/app/goals', 'Goals', '04'],
  ['/app/highlights', 'Highlights', '05'], ['/app/reflections', 'Reflections', '06'],
  ['/app/archive', 'Life archive', '07'], ['/app/year', 'Year in review', '08'],
  ['/app/settings', 'Settings', '09'],
] as const;

function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === href : pathname.startsWith(href);
}

export function Rail() {
  const pathname = usePathname();
  return <aside className="hidden w-[248px] shrink-0 border-r border-line bg-paper-2 lg:block">
    <div className="sticky top-0 flex h-dvh flex-col">
      <Link href="/app" className="border-b border-line px-6 py-5">
        <span className="flex items-center gap-2.5 font-display text-[1.02rem] font-[520]"><span className="text-sage-deep" aria-hidden="true">▣</span> Max Workspace</span>
        <span className="mt-1.5 block font-mono text-[10px] tracking-[0.16em] text-ink-4 uppercase">the companion</span>
      </Link>
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Workspace sections">
        {links.map(([href, label, n]) => <Link key={href} href={href} aria-current={isActive(pathname, href) ? 'page' : undefined} className={cn('flex items-baseline gap-3 border-l-2 px-6 py-[9px] text-[0.9375rem] transition-colors', isActive(pathname, href) ? 'border-sage-deep bg-card text-ink' : 'border-transparent text-ink-2 hover:border-line-2 hover:text-ink')}><span className="font-mono text-[10px] tracking-[0.1em] text-ink-4">{n}</span>{label}</Link>)}
      </nav>
      <div className="border-t border-line px-6 py-4 font-mono text-[10px] tracking-[0.1em] text-ink-4 uppercase">Local-first<br />stored on this device<a href="https://attridevv.github.io/max-workspace/" target="_blank" rel="noopener" className="mt-2 block tracking-[0.08em] text-sage-deep normal-case hover:text-ink">About the notebook →</a></div>
    </div>
  </aside>;
}

export function MobileNav() {
  const pathname = usePathname();
  return <nav className="sticky top-[57px] z-30 flex gap-2 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur lg:hidden" aria-label="Workspace sections">{links.map(([href, label]) => <Link key={href} href={href} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-[0.8125rem] whitespace-nowrap', isActive(pathname, href) ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2')}>{label}</Link>)}</nav>;
}
