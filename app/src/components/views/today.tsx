'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Pencil } from 'lucide-react';
import { useLife } from '@/lib/store';
import { daysInMonth, formatShortDate, greeting, lastNDays, monthName, todayParts, weekdayShort, dayOfWeek } from '@/lib/dates';
import { completionOn, crossMonthStreak, documentedDays, goalPace, goalPercent, monthCompletion, moodAverage, onThisDay } from '@/lib/stats';
import { MOOD_LABELS, type Mood, type MonthDoc } from '@/lib/types';
import { Check, EmptyState, Panel, PanelHead, Stat, Tag } from '@/components/ui/kit';
import { DayBars, Meter, Ring, moodColor } from '@/components/ui/charts';
import { useCapture } from '@/components/shell/quick-capture';
import { cn } from '@/lib/utils';
import { paceText } from './shared';

export function TodayView() {
  const { data, todayMonth } = useLife();
  if (!data || !todayMonth) return null;
  const t = todayParts();
  const m = todayMonth;
  const doneToday = m.habits.filter((h) => m.habitDays[h.id]?.includes(t.day)).length;
  const name = data.settings.name.trim();

  let line: string;
  if (!m.habits.length) line = 'No habits on this month’s page yet.';
  else if (doneToday === m.habits.length) line = 'Every habit done today. Write the line and close the screen.';
  else if (doneToday === 0) line = `${m.habits.length} habits on today’s page. Start with the easiest one.`;
  else line = `${doneToday} of ${m.habits.length} habits done. ${m.habits.length - doneToday} to go.`;

  return (
    <div className="rise">
      <div className="mb-8">
        <p className="label-mono text-sage-deep">{weekdayShort(dayOfWeek(t.year, t.month, t.day))} · {t.day} {monthName(t.month)}</p>
        <h1 className="mt-2 font-display text-[2.2rem] leading-[1.06] font-[470] tracking-[-0.015em] sm:text-[2.75rem]">
          {greeting()}{name ? `, ${name}` : ''}.
        </h1>
        <p className="mt-2 text-[1rem] text-ink-3">{line}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <CheckIn month={m} day={t.day} />
          <TodayHighlight month={m} day={t.day} />
          <LastTwoWeeks />
        </div>
        <div className="flex flex-col gap-6">
          <MonthCard month={m} />
          <GoalsCard month={m} />
          <OnThisDay />
          <InboxCard />
        </div>
      </div>
    </div>
  );
}

function CheckIn({ month: m, day }: { month: MonthDoc; day: number }) {
  const { data, actions } = useLife();
  const done = m.habits.filter((h) => m.habitDays[h.id]?.includes(day)).length;
  const mood = m.moods?.[String(day)];
  return (
    <Panel tape>
      <PanelHead label="Today’s check-in" right={`${done} / ${m.habits.length}`} />
      <ul className="divide-y divide-line/70">
        {m.habits.map((h) => {
          const on = m.habitDays[h.id]?.includes(day) ?? false;
          const streak = data ? crossMonthStreak(data, h.name) : 0;
          return (
            <li key={h.id}>
              <button type="button" onClick={() => actions.toggleHabitDay(m.id, h.id, day)} aria-pressed={on}
                className={cn('flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-paper/60', on && 'bg-sage-tint/45')}>
                <Check on={on} className="size-[22px]" />
                <span className={cn('flex-1 text-[1rem]', on ? 'text-ink' : 'text-ink-2')}>{h.name}</span>
                {streak > 1 && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-pen tnum" title={`${streak}-day streak`}>
                    <Flame className="size-3.5" strokeWidth={2} />{streak}
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {!m.habits.length && <li className="px-5 py-6 text-sm text-ink-3">No habits yet. <Link href="/app/habits" className="text-sage-deep underline underline-offset-4">Add one</Link>.</li>}
      </ul>
      <div className="border-t border-line px-5 py-4">
        <p className="label-mono mb-3 text-ink-4">How did today feel?</p>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mood">
          {([1, 2, 3, 4, 5] as Mood[]).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={mood === v}
              onClick={() => actions.setMood(m.id, day, mood === v ? null : v)}
              className={cn('flex flex-col items-center gap-1.5 rounded-[8px] border py-2.5 text-xs transition-all',
                mood === v ? 'border-ink bg-card text-ink shadow-sm' : 'border-line text-ink-3 hover:border-ink-4')}>
              <span className={cn('size-4 rounded-full transition-transform', mood === v && 'pop scale-110')} style={{ background: moodColor(v) }} />
              {MOOD_LABELS[v]}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TodayHighlight({ month: m, day }: { month: MonthDoc; day: number }) {
  const { actions } = useLife();
  const { toast } = useCapture();
  const saved = m.highlights[String(day)] ?? '';
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const showEditor = editing || !saved;

  function save() {
    actions.setHighlight(m.id, day, text);
    setEditing(false);
    setText('');
    if (text.trim()) toast('Written on today’s page');
  }

  return (
    <Panel className="margin-line overflow-hidden">
      <PanelHead label="Today’s line" right={formatShortDate(m.year, m.month, day)} className="bg-card" />
      <div className="py-4 pr-5 pl-12">
        {showEditor ? (
          <div>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} autoFocus={editing}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') { setEditing(false); setText(''); } }}
              placeholder="One line. The thing you’d want to remember about today."
              className="hand w-full resize-none bg-transparent text-[1.6rem] leading-[32px] placeholder:font-sans placeholder:text-[0.9375rem] placeholder:leading-[32px] placeholder:text-ink-4 focus:outline-none" />
            <div className="mt-2 flex items-center gap-3">
              <button type="button" disabled={!text.trim() && !saved} onClick={save} className="h-9 rounded-full bg-ink px-4 text-sm text-paper hover:bg-sage-deep disabled:opacity-40">Save line</button>
              {editing && <button type="button" onClick={() => { setEditing(false); setText(''); }} className="text-sm text-ink-3 hover:text-ink">Cancel</button>}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <p className="hand flex-1 text-[1.75rem] leading-[32px] text-ink">{saved}</p>
            <button type="button" onClick={() => { setText(saved); setEditing(true); }} aria-label="Edit today’s line"
              className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-card text-ink-3 hover:border-ink hover:text-ink">
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function LastTwoWeeks() {
  const { data } = useLife();
  if (!data) return null;
  const days = lastNDays(14);
  const values = days.map((d) => completionOn(data, d.year, d.month, d.day));
  const labels = days.map((d) => `${weekdayShort(dayOfWeek(d.year, d.month, d.day))} ${d.day} ${monthName(d.month).slice(0, 3)}`);
  const known = values.filter((v): v is number => v !== null);
  const avg = known.length ? Math.round((known.reduce((s, v) => s + v, 0) / known.length) * 100) : 0;
  return (
    <Panel>
      <PanelHead label="Last 14 days" right={`avg ${avg}%`} />
      <div className="px-5 pt-5 pb-4"><DayBars values={values} labels={labels} highlight={values.length - 1} /></div>
    </Panel>
  );
}

function MonthCard({ month: m }: { month: MonthDoc }) {
  const pct = monthCompletion(m);
  const mood = moodAverage(m);
  const total = daysInMonth(m.year, m.month);
  return (
    <Panel>
      <PanelHead label={monthName(m.month)} right={<Link href="/app/month" className="hover:text-ink">open spread →</Link>} />
      <div className="flex items-center gap-5 px-5 py-5">
        <Ring pct={pct} size={116} label={`${pct}% of habits kept`}>
          <span className="font-display text-[1.7rem] leading-none tnum">{pct}<span className="text-base">%</span></span>
          <span className="mt-1 block font-mono text-[9px] tracking-[0.12em] text-ink-4 uppercase">habits</span>
        </Ring>
        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-4">
          <Stat value={<>{documentedDays(m)}<span className="text-base text-ink-4">/{total}</span></>} label="lines" />
          <Stat value={`${m.goals.filter((g) => g.done).length}/${m.goals.length}`} label="goals" />
          <Stat value={mood ? <span className="inline-flex items-center gap-2">{mood.toFixed(1)}<span className="size-3 rounded-full" style={{ background: moodColor(mood) }} /></span> : '—'} label="avg mood" className="col-span-2" />
        </div>
      </div>
    </Panel>
  );
}

function GoalsCard({ month: m }: { month: MonthDoc }) {
  const goals = [...m.goals].sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 4);
  return (
    <Panel>
      <PanelHead label="Goals" right={<Link href="/app/goals" className="hover:text-ink">all →</Link>} />
      {goals.length ? (
        <ul className="flex flex-col gap-4 px-5 py-5">
          {goals.map((g) => {
            const pace = goalPace(m, g);
            return (
              <li key={g.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn('text-[0.9375rem]', g.done && 'text-ink-4 line-through')}>{g.text}</span>
                  <span className="font-mono text-[11px] text-ink-3 tnum">{g.target ? `${goalPercent(g)}%` : g.done ? 'done' : ''}</span>
                </div>
                {g.target ? <Meter className="mt-2" pct={goalPercent(g)} pace={pace ? (pace.expected / g.target) * 100 : undefined} /> : null}
                {pace && (() => { const pt = paceText(pace.diff, g.unit); return <p className={cn('mt-1.5 text-xs', pt.ahead ? 'text-sage-deep' : 'text-pen')}>{pt.text}</p>; })()}
              </li>
            );
          })}
        </ul>
      ) : <EmptyState hint="Three is plenty.">No goals this month.</EmptyState>}
    </Panel>
  );
}

function OnThisDay() {
  const { data } = useLife();
  if (!data) return null;
  const items = onThisDay(data);
  if (!items.length) return null;
  return (
    <Panel className="bg-paper-2">
      <PanelHead label="On this day" />
      <ul className="flex flex-col gap-4 px-5 py-5">
        {items.map(({ month, text }) => (
          <li key={month.id}>
            <Tag>{monthName(month.month)} {month.year}</Tag>
            <p className="hand mt-1.5 text-[1.35rem] leading-snug text-ink-2">“{text}”</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function InboxCard() {
  const { data } = useLife();
  const { open } = useCapture();
  const n = data?.captures.length ?? 0;
  return (
    <Panel>
      <PanelHead label="Inbox" right={n ? `${n} waiting` : 'clear'} />
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        {n ? (
          <>
            <p className="hand line-clamp-2 flex-1 text-[1.25rem] leading-snug text-ink-2">{data!.captures[0].text}</p>
            <Link href="/app/inbox" className="shrink-0 text-sm text-sage-deep hover:text-ink">Sort →</Link>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-3">Nothing waiting. Ideas and lessons you capture land here.</p>
            <button type="button" onClick={() => open('Idea')} className="shrink-0 text-sm text-sage-deep hover:text-ink">Capture →</button>
          </>
        )}
      </div>
    </Panel>
  );
}
