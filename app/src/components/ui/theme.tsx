'use client';

import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThemeChoice = 'light' | 'dark' | 'system';
const KEY = 'mw-theme';
const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; }
}
function apply(choice: ThemeChoice) {
  const el = document.documentElement;
  if (choice === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', choice);
}
export function setTheme(choice: ThemeChoice) {
  try { if (choice === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, choice); } catch { /* private mode */ }
  apply(choice);
  listeners.forEach((l) => l());
}

export function useTheme() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    read,
    () => 'system' as ThemeChoice,
  );
}

/** Runs in <head> before first paint so there's no flash of the wrong theme. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Paper', icon: Sun },
  { value: 'dark', label: 'Night', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
];

export function ThemeSwitch({ compact = false, className }: { compact?: boolean; className?: string }) {
  const theme = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn('inline-flex rounded-full border border-line bg-paper-2 p-0.5', className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button key={value} type="button" role="radio" aria-checked={theme === value} title={label} onClick={() => setTheme(value)}
          className={cn('inline-flex items-center gap-1.5 rounded-full transition-colors',
            compact ? 'size-8 justify-center' : 'h-8 px-3 text-[0.8125rem]',
            theme === value ? 'bg-card text-ink shadow-sm' : 'text-ink-4 hover:text-ink')}>
          <Icon className="size-[15px]" strokeWidth={1.8} />
          {compact ? <span className="sr-only">{label}</span> : label}
        </button>
      ))}
    </div>
  );
}
