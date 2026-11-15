'use client';

import { useState } from 'react';
import { useLife } from '@/lib/store';
import { monthLabel, monthShort } from '@/lib/dates';
import { sortedMonths } from '@/lib/stats';
import type { MonthDoc } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Which month a page is looking at. Defaults to this month, falls back to the latest. */
export function useMonthPicker() {
  const { data, todayMonth } = useLife();
  const months = data ? sortedMonths(data) : [];
  const [raw, setRaw] = useState('');
  const id = months.some((m) => m.id === raw) ? raw : (todayMonth?.id ?? months[0]?.id ?? '');
  const month = months.find((m) => m.id === id) ?? null;
  return { months, month, setId: setRaw };
}

export function MonthTabs({ months, id, setId }: { months: MonthDoc[]; id: string; setId: (id: string) => void }) {
  if (months.length < 2) return null;
  return (
    <div className="-mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Month">
      {months.map((m) => (
        <button key={m.id} type="button" role="tab" aria-selected={m.id === id} onClick={() => setId(m.id)}
          className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors',
            m.id === id ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink-3 hover:border-ink-4')}>
          <span className="sm:hidden">{monthShort(m.month)} {String(m.year).slice(2)}</span>
          <span className="hidden sm:inline">{monthLabel(m.year, m.month)}</span>
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-[1.25rem] font-[480]">{children}</h2>
      {right}
    </div>
  );
}

/** "On pace", "8 km ahead", "₹1,000 behind" — rounds tiny gaps to on-pace. */
export function paceText(diff: number, unit?: string) {
  const step = unit === '₹' ? 100 : 1;
  if (Math.abs(diff) < step / 2 + 0.0001 || Math.round(Math.abs(diff)) === 0) return { text: 'Right on pace', ahead: true };
  return diff > 0 ? { text: `On pace · ${fmtNum(diff, unit)} ahead`, ahead: true } : { text: `${fmtNum(-diff, unit)} behind pace`, ahead: false };
}

export function fmtNum(v: number, unit?: string) {
  const n = Math.abs(v) >= 1000 ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(Math.round(v * 10) / 10);
  if (!unit) return n;
  if (unit === '₹') return `₹${n}`;
  return `${n} ${n === '1' && unit.endsWith('s') && unit.length > 3 ? unit.slice(0, -1) : unit}`;
}
