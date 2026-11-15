import { CalendarDays, CalendarRange, ChartLine, Highlighter, Inbox, Library, NotebookPen, Repeat2, Settings, Sun, Target, type LucideIcon } from 'lucide-react';

export interface NavItem { href: string; label: string; icon: LucideIcon; }
export interface NavGroup { title: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { title: 'Today', items: [
    { href: '/app', label: 'Today', icon: Sun },
    { href: '/app/inbox', label: 'Inbox', icon: Inbox },
  ] },
  { title: 'This month', items: [
    { href: '/app/month', label: 'Month spread', icon: CalendarDays },
    { href: '/app/habits', label: 'Habits', icon: Repeat2 },
    { href: '/app/goals', label: 'Goals', icon: Target },
    { href: '/app/numbers', label: 'Numbers', icon: ChartLine },
  ] },
  { title: 'Memory', items: [
    { href: '/app/highlights', label: 'Highlights', icon: Highlighter },
    { href: '/app/reflections', label: 'Reflections', icon: NotebookPen },
    { href: '/app/archive', label: 'Archive', icon: Library },
    { href: '/app/year', label: 'Year in review', icon: CalendarRange },
  ] },
];

export const SETTINGS: NavItem = { href: '/app/settings', label: 'Settings', icon: Settings };
export const ABOUT_URL = 'https://attridevv.github.io/max-workspace/';
export const ALL_NAV = [...NAV.flatMap((g) => g.items), SETTINGS];

export function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === href : pathname.startsWith(href);
}
