'use client';

import { cn } from '@/lib/utils';

const inputBase = 'w-full rounded-[var(--radius)] border border-line bg-card px-3.5 py-2.5 text-[0.9375rem] transition-colors placeholder:text-ink-4 focus:border-sage focus:outline-none';

export function LabeledInput({ label, value, onChange, onEnter, placeholder, type = 'text', className, inputClassName }: {
  label?: string; value: string; onChange: (v: string) => void; onEnter?: () => void; placeholder?: string; type?: string; className?: string; inputClassName?: string;
}) {
  return (
    <label className={cn('flex min-w-0 flex-1 flex-col gap-1.5', className)}>
      {label && <span className="label-mono text-ink-4">{label}</span>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }}
        className={cn(inputBase, inputClassName)} />
    </label>
  );
}

export function LabeledArea({ label, value, onChange, placeholder, rows = 3, className, hand = false }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string; hand?: boolean;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="label-mono text-ink-4">{label}</span>}
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={cn(inputBase, 'resize-y leading-relaxed placeholder:font-sans placeholder:text-sm', hand ? 'hand text-[1.35rem] leading-snug' : 'font-display text-[1rem]')} />
    </label>
  );
}

export function NumberInput({ value, onChange, onEnter, onBlur, placeholder, className, ariaLabel }: { value: string; onChange: (v: string) => void; onEnter?: () => void; onBlur?: () => void; placeholder?: string; className?: string; ariaLabel?: string }) {
  return (
    <input inputMode="decimal" value={value} placeholder={placeholder} onBlur={onBlur} aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ''))}
      onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }}
      className={cn(inputBase, 'tnum', className)} />
  );
}

export function toNumber(v: string): number | null {
  const n = Number(v.replace(/,/g, ''));
  return v.trim() === '' || Number.isNaN(n) ? null : n;
}
