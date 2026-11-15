'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLife } from '@/lib/store';
import { daysInMonth, formatDayLine, isFuture, monthGrid, monthId, monthLabel, nextMonth, prevMonth, todayParts, weekdayHeaders } from '@/lib/dates';
import { challengeProgress, dayCompletion, documentedDays, elapsedDays, goalPercent, habitCount, monthCompletion, moodAverage } from '@/lib/stats';
import { MONTH_REVIEW_QUESTIONS, MOOD_LABELS, type Mood, type MonthDoc } from '@/lib/types';
import { Button, Check, Panel, PanelHead, Stat } from '@/components/ui/kit';
import { CalendarHeat, HeatLegend, Meter, Ring, heatColor, moodColor } from '@/components/ui/charts';
import { LabeledArea, NumberInput, toNumber } from '@/components/ui/fields';
import { useCapture } from '@/components/shell/quick-capture';
import { cn } from '@/lib/utils';

export function MonthView() {
  const { data, actions } = useLife();
  const t = todayParts();
  const [cursor, setCursor] = useState({ year: t.year, month: t.month });
  const id = monthId(cursor.year, cursor.month);
  const month = data?.months.find((m) => m.id === id) ?? null;
  const isCurrent = cursor.year === t.year && cursor.month === t.month;
  const [selected, setSelected] = useState(t.day);

  function go(to: { year: number; month: number }) {
    setCursor(to);
    setSelected(to.year === t.year && to.month === t.month ? t.day : 1);
  }

  const nav = (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Previous month" onClick={() => go(prevMonth(cursor.year, cursor.month))} className="grid size-10 place-items-center rounded-full border border-line bg-card hover:border-ink"><ArrowLeft className="size-4" /></button>
      {!isCurrent && <button type="button" onClick={() => go({ year: t.year, month: t.month })} className="h-10 rounded-full border border-line bg-card px-4 text-sm hover:border-ink">This month</button>}
      <button type="button" aria-label="Next month" onClick={() => go(nextMonth(cursor.year, cursor.month))} className="grid size-10 place-items-center rounded-full border border-line bg-card hover:border-ink"><ArrowRight className="size-4" /></button>
    </div>
  );

  if (!month) {
    const future = isFuture(cursor.year, cursor.month, 1);
    return (
      <div className="rise">
        <Head title={monthLabel(cursor.year, cursor.month)} caption={future ? 'Not here yet.' : 'No page for this month.'} right={nav} />
        <Panel dotted>
          <div className="flex flex-col items-start gap-4 px-6 py-10">
            <p className="hand text-[1.6rem] text-ink-2">{future ? 'This page is still blank.' : 'You didn’t keep this month.'}</p>
            <p className="max-w-[52ch] text-sm text-ink-3">Open it now and it starts with the habits and numbers from the month before it. Unfinished goals come along too.</p>
            <Button onClick={() => actions.ensureMonth(cursor.year, cursor.month)}>Open {monthLabel(cursor.year, cursor.month)}</Button>
          </div>
        </Panel>
      </div>
    );
  }

  const total = daysInMonth(month.year, month.month);
  const elapsed = elapsedDays(month);
  const pct = monthCompletion(month);
  const ch = challengeProgress(month);
  const mood = moodAverage(month);

  return (
    <div className="rise">
      <Head title={monthLabel(month.year, month.month)}
        caption={isCurrent ? `Day ${t.day} of ${total}. ${total - t.day} left.` : elapsed ? `${documentedDays(month)} of ${total} days written down.` : 'Coming up.'}
        right={nav} />

      {/* headline numbers */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel className="flex items-center gap-4 px-4 py-4">
          <Ring pct={pct} size={58} stroke={6}><span className="font-mono text-[11px] tnum">{pct}%</span></Ring>
          <Stat value={pct + '%'} label="habits kept" className="[&>span:first-child]:text-[1.5rem]" />
        </Panel>
        <Panel className="px-4 py-4"><Stat value={<>{documentedDays(month)}<span className="text-base text-ink-4">/{elapsed || total}</span></>} label="days written" /></Panel>
        <Panel className="px-4 py-4"><Stat value={<>{month.goals.filter((g) => g.done).length}<span className="text-base text-ink-4">/{month.goals.length}</span></>} label="goals done" /></Panel>
        <Panel className="px-4 py-4"><Stat value={mood ? <span className="inline-flex items-center gap-2">{mood.toFixed(1)}<span className="size-3.5 rounded-full" style={{ background: moodColor(mood) }} /></span> : '—'} label="avg mood" /></Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Panel>
          <PanelHead label="The month" right={<HeatLegend />} />
          <div className="p-4 sm:p-5">
            <CalendarHeat
              cells={monthGrid(month.year, month.month, data?.settings.weekStartsOn ?? 1)}
              headers={weekdayHeaders(data?.settings.weekStartsOn ?? 1)}
              value={(d) => (d > elapsed ? null : dayCompletion(month, d))}
              mood={(d) => month.moods?.[String(d)] ?? null}
              selected={selected} today={isCurrent ? t.day : undefined} onPick={setSelected}
              render={(d) => month.highlights[String(d)] ? <span className="absolute top-1 right-1 size-1.5 rounded-full bg-ink/70" aria-hidden="true" /> : null}
            />
            <p className="mt-3 text-xs text-ink-4">Colour = share of habits done. Dot top-right = a line was written. Dot bottom-right = mood.</p>
          </div>
        </Panel>
        <DayPage key={`${month.id}-${selected}-${month.highlights[String(selected)] ?? ''}`} month={month} day={selected} />
      </div>

      <HabitTracker month={month} total={total} elapsed={elapsed} selected={selected} onSelect={setSelected} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panel>
          <PanelHead label="Goals" right={<Link href="/app/goals" className="hover:text-ink">manage →</Link>} />
          {month.goals.length ? (
            <ul className="divide-y divide-line">
              {month.goals.map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <button type="button" onClick={() => actions.updateGoal(month.id, g.id, { done: !g.done })} aria-label={g.done ? 'Mark not done' : 'Mark done'}><Check on={g.done} /></button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-[0.9375rem]', g.done && 'text-ink-4 line-through')}>{g.text}</p>
                    {g.target ? <Meter className="mt-1.5 h-1.5" pct={goalPercent(g)} /> : null}
                  </div>
                  {g.target ? <span className="font-mono text-[11px] text-ink-3 tnum">{goalPercent(g)}%</span> : null}
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-6 text-sm text-ink-3">No goals. <Link href="/app/goals" className="text-sage-deep underline underline-offset-4">Set one</Link>.</p>}
        </Panel>
        <ChallengeBlock month={month} elapsed={elapsed} progress={ch} />
      </div>

      <ReviewBlock key={`r-${month.id}`} month={month} isCurrent={isCurrent} total={total} />
    </div>
  );
}

function Head({ title, caption, right }: { title: string; caption: string; right: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label-mono mb-2 text-sage-deep">Month spread</p>
        <h1 className="font-display text-[2.1rem] leading-[1.08] font-[480] tracking-[-0.015em] sm:text-[2.5rem]">{title}</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-3">{caption}</p>
      </div>
      {right}
    </div>
  );
}

function DayPage({ month, day }: { month: MonthDoc; day: number }) {
  const { actions } = useLife();
  const { toast } = useCapture();
  const saved = month.highlights[String(day)] ?? '';
  const [text, setText] = useState(saved);
  const future = isFuture(month.year, month.month, day);
  const mood = month.moods?.[String(day)];
  const dirty = text.trim() !== saved.trim();

  return (
    <Panel tape>
      <PanelHead label={formatDayLine(month.year, month.month, day)} right={future ? 'ahead' : `${Math.round(dayCompletion(month, day) * 100)}% done`} />
      <div className="flex flex-col gap-5 px-5 py-5">
        <div>
          <LabeledArea label="The line" rows={2} hand value={text} onChange={setText} placeholder={future ? 'This day hasn’t happened yet.' : 'One line. Enough to remember the day.'} />
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" disabled={!dirty} onClick={() => { actions.setHighlight(month.id, day, text); toast(text.trim() ? 'Line saved' : 'Line cleared'); }}>{dirty ? 'Save line' : saved ? 'Saved' : 'Save line'}</Button>
            {dirty && <button type="button" onClick={() => setText(saved)} className="text-xs text-ink-4 hover:text-ink">undo</button>}
          </div>
        </div>
        <div>
          <p className="label-mono mb-2 text-ink-4">Habits</p>
          <div className="flex flex-wrap gap-2">
            {month.habits.map((h) => {
              const on = month.habitDays[h.id]?.includes(day) ?? false;
              return (
                <button key={h.id} type="button" disabled={future} onClick={() => actions.toggleHabitDay(month.id, h.id, day)} aria-pressed={on}
                  className={cn('inline-flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-2 text-[0.8125rem] transition-colors',
                    on ? 'border-sage-deep bg-sage-tint text-ink' : 'border-line bg-card text-ink-3 hover:border-ink-4')}>
                  <Check on={on} className="size-4" />{h.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="label-mono mb-2 text-ink-4">Mood</p>
          <div className="flex flex-wrap gap-1.5">
            {([1, 2, 3, 4, 5] as Mood[]).map((v) => (
              <button key={v} type="button" disabled={future} onClick={() => actions.setMood(month.id, day, mood === v ? null : v)} aria-pressed={mood === v}
                className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs', mood === v ? 'border-ink bg-card text-ink' : 'border-line text-ink-3')}>
                <span className="size-2.5 rounded-full" style={{ background: moodColor(v) }} />{MOOD_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
        {month.metrics.length > 0 && !future && (
          <div>
            <p className="label-mono mb-2 text-ink-4">Numbers</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {month.metrics.map((mt) => <MetricCell key={mt.id} month={month} metricId={mt.id} name={mt.name} unit={mt.unit} day={day} />)}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function MetricCell({ month, metricId, name, unit, day }: { month: MonthDoc; metricId: string; name: string; unit: string; day: number }) {
  const { actions } = useLife();
  const saved = month.metricEntries[metricId]?.[String(day)];
  const [v, setV] = useState(saved === undefined ? '' : String(saved));
  const commit = () => { const n = toNumber(v); if (n !== (saved ?? null)) actions.setMetricValue(month.id, metricId, day, n); };
  return (
    <label className="flex flex-col gap-1 rounded-[8px] border border-line bg-paper/50 px-3 py-2">
      <span className="text-[11px] text-ink-3">{name} <span className="text-ink-4">({unit})</span></span>
      <NumberInput value={v} onChange={setV} onEnter={commit} onBlur={commit} placeholder="—" className="border-0 bg-transparent px-0 py-0.5 font-display text-lg focus:border-0" />
    </label>
  );
}

function HabitTracker({ month, total, elapsed, selected, onSelect }: { month: MonthDoc; total: number; elapsed: number; selected: number; onSelect: (d: number) => void }) {
  const { actions } = useLife();
  const days = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <Panel className="mt-6">
      <PanelHead label="Habit tracker" right="tap a square" />
      <div className="overflow-x-auto">
        <div className="min-w-[720px] px-5 pt-4 pb-5">
          <div className="grid items-center gap-[3px]" style={{ gridTemplateColumns: `8.5rem repeat(${total}, minmax(0,1fr)) 3rem` }}>
            <span />
            {days.map((d) => (
              <button key={d} type="button" onClick={() => onSelect(d)} className={cn('h-5 rounded-[3px] font-mono text-[9px] tnum', d === selected ? 'bg-ink text-paper' : 'text-ink-4 hover:text-ink')}>{d}</button>
            ))}
            <span className="text-right font-mono text-[9px] text-ink-4">%</span>
            {month.habits.map((h) => {
              const set = new Set(month.habitDays[h.id] ?? []);
              const pct = elapsed ? Math.round((habitCount(month, h.id) / elapsed) * 100) : 0;
              return [
                <span key={h.id + 'n'} className="truncate pr-2 text-[0.8125rem] text-ink-2">{h.name}</span>,
                ...days.map((d) => (
                  <button key={h.id + d} type="button" disabled={d > elapsed}
                    onClick={() => { actions.toggleHabitDay(month.id, h.id, d); onSelect(d); }}
                    aria-label={`${h.name}, day ${d}`} aria-pressed={set.has(d)}
                    className={cn('aspect-square rounded-[3px] border transition-colors disabled:cursor-default disabled:opacity-40',
                      set.has(d) ? 'border-sage-deep bg-sage' : 'border-line-2/70 bg-card hover:border-ink-4',
                      d === selected && 'outline-2 outline-offset-1 outline-ink')} />
                )),
                <span key={h.id + 'p'} className="text-right font-mono text-[11px] text-ink-2 tnum">{pct}</span>,
              ];
            })}
            {/* how full each day was */}
            <span className="pt-2 text-[11px] text-ink-4">Day total</span>
            {days.map((d) => {
              const v = d > elapsed ? null : dayCompletion(month, d);
              return (
                <div key={'t' + d} className="flex h-8 items-end pt-2">
                  <span className="block w-full rounded-t-[2px]" style={{ height: v === null ? 2 : `${Math.max(8, v * 100)}%`, background: v === null ? 'var(--color-line)' : heatColor(Math.max(v, 0.01)) }} />
                </div>
              );
            })}
            <span />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ChallengeBlock({ month, elapsed, progress }: { month: MonthDoc; elapsed: number; progress: ReturnType<typeof challengeProgress> }) {
  const { actions } = useLife();
  const [title, setTitle] = useState('');
  if (!month.challenge) {
    return (
      <Panel>
        <PanelHead label="30-day challenge" right="none yet" />
        <form className="flex flex-col gap-3 px-5 py-5" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { actions.setChallenge(month.id, title.trim(), daysInMonth(month.year, month.month)); setTitle(''); } }}>
          <p className="text-sm text-ink-3">One rule for the whole month. Mark each day held or broken.</p>
          <div className="flex gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="No phone before breakfast" className="min-w-0 flex-1 rounded-[8px] border border-line bg-card px-3.5 py-2 text-sm focus:border-sage focus:outline-none" />
            <Button type="submit" size="sm" variant="outline" disabled={!title.trim()}>Start</Button>
          </div>
        </form>
      </Panel>
    );
  }
  const c = month.challenge;
  return (
    <Panel>
      <PanelHead label="30-day challenge" right={`${progress.done} held · ${progress.missed} broken`} />
      <div className="px-5 py-5">
        <p className="font-display text-[1.1rem]">{c.title}</p>
        <div className="mt-4 grid grid-cols-10 gap-1.5">
          {Array.from({ length: c.days }, (_, i) => i + 1).map((d) => {
            const mk = c.marks[d];
            return (
              <button key={d} type="button" disabled={d > elapsed}
                onClick={() => actions.setChallengeMark(month.id, d, mk === 'done' ? 'missed' : mk === 'missed' ? null : 'done')}
                aria-label={`Day ${d}: ${mk ?? 'not marked'}`}
                className={cn('grid aspect-square place-items-center rounded-[4px] border font-mono text-[9px] transition-colors disabled:opacity-35',
                  mk === 'done' && 'border-sage-deep bg-sage-deep text-paper',
                  mk === 'missed' && 'border-pen/60 bg-pen/15 text-pen',
                  !mk && 'border-line bg-card text-ink-4 hover:border-ink-4')}>
                {mk === 'missed' ? '×' : d}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-ink-4">
          <span>Tap once = held · twice = broken · three times = clear</span>
          <button type="button" onClick={() => { if (window.confirm('Remove this challenge?')) actions.clearChallenge(month.id); }} className="hover:text-pen">remove</button>
        </div>
      </div>
    </Panel>
  );
}

function ReviewBlock({ month, isCurrent, total }: { month: MonthDoc; isCurrent: boolean; total: number }) {
  const { actions } = useLife();
  const { toast } = useCapture();
  const t = todayParts();
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries((month.review?.answers ?? []).map((a) => [a.q, a.a])));
  const opensOn = total - 4;
  const ready = !isCurrent || t.day >= opensOn;
  const [open, setOpen] = useState(!!month.review || (isCurrent && ready));
  const filled = MONTH_REVIEW_QUESTIONS.filter((q) => answers[q]?.trim()).length;

  return (
    <Panel className="mt-6">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 border-b border-line px-5 py-3 text-left">
        <span className="label-mono">Month review</span>
        <span className="label-mono text-ink-4">{month.review ? `saved · ${filled}/5` : ready ? `${filled}/5 answered` : `opens on the ${opensOn}th`} {open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
          {!ready && <p className="hand text-[1.3rem] text-ink-3 md:col-span-2">Too early to look back. Fill these in during the last few days.</p>}
          {MONTH_REVIEW_QUESTIONS.map((q, i) => (
            <LabeledArea key={q} className={i === 4 ? 'md:col-span-2' : ''} label={q} rows={2} value={answers[q] ?? ''} onChange={(v) => setAnswers({ ...answers, [q]: v })} placeholder="A sentence is enough." />
          ))}
          <div className="md:col-span-2">
            <Button onClick={() => { actions.saveReview(month.id, { answers: MONTH_REVIEW_QUESTIONS.map((q) => ({ q, a: answers[q] ?? '' })), completedAt: new Date().toISOString() }); toast('Review saved'); }}>Save review</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
