import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({ children, className, dotted = false, tape = false }: { children: ReactNode; className?: string; dotted?: boolean; tape?: boolean }) {
  return (
    <section className={cn(
      'relative rounded-[var(--radius)] border border-line bg-card shadow-[0_1px_0_rgba(33,30,25,0.04),0_10px_28px_-20px_rgba(33,30,25,0.35)]',
      dotted && 'dots', tape && 'tape', className,
    )}>{children}</section>
  );
}

export function PanelHead({ label, right, className }: { label: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3', className)}>
      <span className="label-mono">{label}</span>
      {right !== undefined && <span className="label-mono text-ink-4">{right}</span>}
    </header>
  );
}

export function PageHead({ kicker, title, caption, right }: { kicker?: ReactNode; title: ReactNode; caption?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="label-mono mb-2 text-sage-deep">{kicker}</p>}
        <h1 className="font-display text-[2.1rem] leading-[1.08] font-[480] tracking-[-0.015em] sm:text-[2.5rem]">{title}</h1>
        {caption && <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-ink-3">{caption}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({ value, label, sub, className }: { value: ReactNode; label: string; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="font-display text-[2rem] leading-none font-[440] tnum">{value}</span>
      <span className="label-mono text-ink-4">{label}</span>
      {sub && <span className="text-xs text-ink-3">{sub}</span>}
    </div>
  );
}

export function EmptyState({ children, hint, action }: { children: ReactNode; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <p className="hand text-[1.45rem] leading-tight text-ink-3">{children}</p>
      {hint && <p className="max-w-[40ch] text-sm text-ink-4">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Check({ on, className }: { on: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('inline-grid size-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors',
      on ? 'border-sage-deep bg-sage-deep text-paper' : 'border-line-2 bg-card', className)}>
      {on && <svg viewBox="0 0 12 12" className="pop size-3"><path d="M2.5 6.2 5 8.6l4.6-5.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </span>
  );
}

export function Button({ children, variant = 'solid', size = 'md', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline' | 'ghost'; size?: 'sm' | 'md' }) {
  return (
    <button type="button" {...props} className={cn(
      'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-40',
      size === 'sm' ? 'h-8 px-3.5 text-[0.8125rem]' : 'h-10 px-5 text-sm',
      variant === 'solid' && 'bg-ink text-paper hover:bg-sage-deep',
      variant === 'outline' && 'border border-line-2 bg-card text-ink-2 hover:border-ink hover:text-ink',
      variant === 'ghost' && 'text-ink-3 hover:bg-paper-2 hover:text-ink',
      className,
    )}>{children}</button>
  );
}

export function Pill({ children, active, onClick, className }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn(
      'shrink-0 rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors',
      active ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink-2 hover:border-ink-4', className,
    )}>{children}</button>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase', className)}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-3">{children}</kbd>;
}
