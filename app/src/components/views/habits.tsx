'use client';

import { useState } from 'react';
import { Flame, Pencil } from 'lucide-react';
import { useLife } from '@/lib/store';
import { dayOfWeek, lastNDays, monthId, monthLabel, monthShort, weekdayHeaders, weekdayShort } from '@/lib/dates';
import { bestStreak, crossMonthStreak, habitCount, habitPercent, weekdayPattern, elapsedDays } from '@/lib/stats';
import type { Habit, LifeData, MonthDoc } from '@/lib/types';
import { Button, PageHead, Panel } from '@/components/ui/kit';
import { Ring, WeekdayBars } from '@/components/ui/charts';
import { HABIT_PRESETS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import { MonthTabs, useMonthPicker } from './shared';

const FULL_DAYS: Record<string, string> = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };

export function HabitsView() {
  const { data } = useLife();
  const { months, month, setId } = useMonthPicker();
  if (!month || !data) return <PageHead title="Habits" caption="Open a month first." />;
  const w0 = data.settings.weekStartsOn;
  const ranked = [...month.habits].sort((a, b) => habitPercent(month, b.id) - habitPercent(month, a.id));
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];

  return (
    <div className="rise">
      <PageHead kicker={monthLabel(month.year, month.month)} title="Habits"
        caption={best && weakest && best !== weakest && elapsedDays(month)
          ? `${best.name} is carrying the month at ${habitPercent(month, best.id)}%. ${weakest.name} needs a look at ${habitPercent(month, weakest.id)}%.`
          : 'Patterns, not scores. A blank square is just a blank square.'} />
      <MonthTabs months={months} id={month.id} setId={setId} />

      <div className="flex flex-col gap-4">
        {month.habits.map((h) => <HabitCard key={h.id} data={data} month={month} habit={h} w0={w0} />)}
      </div>
      <AddHabit month={month} />
    </div>
  );
}

function HabitCard({ data, month, habit: h, w0 }: { data: LifeData; month: MonthDoc; habit: Habit; w0: 0 | 1 }) {
  const { actions } = useLife();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(h.name);
  const pct = habitPercent(month, h.id);
  const streak = crossMonthStreak(data, h.name);
  const best = bestStreak(month, h.id);
  const pattern = weekdayPattern(month, h.id, w0);
  const headers = weekdayHeaders(w0);
  const strongest = pattern.indexOf(Math.max(...pattern));
  const days = lastNDays(84);

  // 12 weeks, aligned so each row is one weekday
  const lead = (dayOfWeek(days[0].year, days[0].month, days[0].day) - w0 + 7) % 7;

  return (
    <Panel>
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.1fr)_auto_auto] lg:items-center lg:gap-8">
        <div className="flex items-center gap-4">
          <Ring pct={pct} size={64} stroke={6} label={`${pct}% this month`}><span className="font-mono text-xs tnum">{pct}%</span></Ring>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) actions.renameHabit(month.id, h.id, name.trim()); setRenaming(false); }}>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 border-b border-line bg-transparent font-display text-xl focus:border-sage focus:outline-none" />
                <Button type="submit" size="sm">Save</Button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <h2 className="truncate font-display text-[1.35rem]">{h.name}</h2>
                <button type="button" aria-label={`Rename ${h.name}`} onClick={() => setRenaming(true)} className="grid size-7 place-items-center rounded-full text-ink-4 hover:bg-paper-2 hover:text-ink"><Pencil className="size-3" /></button>
              </div>
            )}
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-ink-3">
              <span className={cn('inline-flex items-center gap-1', streak > 1 && 'text-pen')}><Flame className="size-3.5" />{streak ? `${streak}-day streak` : 'no streak'}</span>
              <span>best {best}</span>
              <span>{habitCount(month, h.id)} days</span>
            </div>
            <button type="button" onClick={() => { if (window.confirm(`Stop tracking ${h.name} this month? Its marks for this month go too.`)) actions.removeHabit(month.id, h.id); }} className="mt-1.5 text-xs text-ink-4 hover:text-pen">remove</button>
          </div>
        </div>
        <div>
          <p className="label-mono mb-2 text-ink-4">Last 12 weeks</p>
          <div className="overflow-x-auto">
            <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
              {Array.from({ length: lead }, (_, i) => <span key={'l' + i} className="size-[11px]" />)}
              {days.map((d) => {
                const m = data.months.find((x) => x.id === monthId(d.year, d.month));
                const hh = m?.habits.find((x) => x.name === h.name);
                const on = !!(m && hh && m.habitDays[hh.id]?.includes(d.day));
                const tracked = !!hh;
                return (
                  <span key={`${d.month}-${d.day}`} title={`${weekdayShort(dayOfWeek(d.year, d.month, d.day))} ${d.day} ${monthShort(d.month)}: ${on ? 'done' : tracked ? 'missed' : 'not tracked'}`}
                    className={cn('size-[11px] rounded-[2px]', !tracked && 'border border-dashed border-line')}
                    style={{ background: on ? 'var(--color-heat-4)' : tracked ? 'var(--color-heat-0)' : 'transparent' }} />
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <WeekdayBars values={pattern} headers={headers} />
          {pattern[strongest] > 0 && <p className="w-[6.5rem] text-xs leading-snug text-ink-3">Best on <span className="text-ink">{FULL_DAYS[headers[strongest]]}s</span></p>}
        </div>
      </div>
    </Panel>
  );
}

function AddHabit({ month }: { month: MonthDoc }) {
  const { actions } = useLife();
  const [text, setText] = useState('');
  const existing = new Set(month.habits.map((h) => h.name.toLowerCase()));
  const add = (name: string) => { if (name.trim() && !existing.has(name.trim().toLowerCase())) actions.addHabit(month.id, name.trim()); };
  return (
    <Panel dotted className="mt-6">
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="label-mono">Add a habit</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(text); setText(''); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Something you want to do most days" className="min-w-0 flex-1 rounded-[8px] border border-line bg-card px-3.5 py-2.5 text-sm focus:border-sage focus:outline-none" />
          <Button type="submit" disabled={!text.trim()}>Add</Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {HABIT_PRESETS.filter((p) => !existing.has(p.toLowerCase())).map((p) => (
            <button key={p} type="button" onClick={() => add(p)} className="rounded-full border border-line bg-card px-3 py-1 text-[0.8125rem] text-ink-3 hover:border-ink-4">+ {p}</button>
          ))}
        </div>
        <p className="text-xs text-ink-4">Six is a lot. Habits carry into next month automatically.</p>
      </div>
    </Panel>
  );
}
