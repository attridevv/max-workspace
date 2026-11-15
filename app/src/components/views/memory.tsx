'use client';

import { useState } from 'react';
import { useLife } from '@/lib/store';
import { daysInMonth, formatTimestamp, monthGrid, monthLabel, monthName, monthShort, todayParts, weekdayHeaders } from '@/lib/dates';
import { challengeProgress, dayCompletion, documentedDays, elapsedDays, habitCount, monthCompletion, moodAverage, yearFigures, sortedMonths, completionOn } from '@/lib/stats';
import { YEAR_REVIEW_QUESTIONS, type MonthDoc, type ReflectionKind } from '@/lib/types';
import { Button, EmptyState, PageHead, Panel, PanelHead, Pill, Stat, Tag } from '@/components/ui/kit';
import { CalendarHeat, HeatLegend, YearHeat, heatColor } from '@/components/ui/charts';
import { LabeledArea } from '@/components/ui/fields';
import { useCapture } from '@/components/shell/quick-capture';
import { cn } from '@/lib/utils';
import { MonthTabs, useMonthPicker } from './shared';

/* ── Reflections ───────────────────────────────────── */

const PROMPTS: Record<ReflectionKind, string[]> = {
  weekly: ['What moved this week?', 'What drained me?', 'What do I want more of next week?'],
  monthly: ['What surprised me this month?', 'Where did my time actually go?'],
  free: ['What’s on my mind?', 'What am I avoiding?', 'What am I grateful for today?'],
};

export function ReflectionsView() {
  const { actions } = useLife();
  const { toast } = useCapture();
  const { months, month, setId } = useMonthPicker();
  const [kind, setKind] = useState<ReflectionKind>('weekly');
  const [prompt, setPrompt] = useState(PROMPTS.weekly[0]);
  const [text, setText] = useState('');
  if (!month) return <PageHead title="Reflections" caption="Open a month first." />;

  return (
    <div className="rise">
      <PageHead kicker={monthLabel(month.year, month.month)} title="Reflections" caption="Longer thoughts. Ten minutes, once a week, is enough." />
      <MonthTabs months={months} id={month.id} setId={setId} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <Panel tape className="lg:sticky lg:top-20">
          <PanelHead label="Write" />
          <form className="flex flex-col gap-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { actions.addReflection(month.id, kind, text.trim(), prompt); setText(''); toast('Reflection kept'); } }}>
            <div className="flex gap-1.5">
              {(['weekly', 'monthly', 'free'] as const).map((k) => <Pill key={k} active={kind === k} onClick={() => { setKind(k); setPrompt(PROMPTS[k][0]); }} className="capitalize">{k}</Pill>)}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="label-mono text-ink-4">Question</span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS[kind].map((p) => (
                  <button key={p} type="button" onClick={() => setPrompt(p)} className={cn('rounded-[6px] border px-2.5 py-1 text-left text-[0.8125rem]', prompt === p ? 'border-sage-deep bg-sage-tint text-ink' : 'border-line text-ink-3 hover:border-ink-4')}>{p}</button>
                ))}
              </div>
            </div>
            <LabeledArea value={text} onChange={setText} rows={6} hand placeholder="Write it the way you’d say it out loud." />
            <Button type="submit" disabled={!text.trim()} className="self-start">Keep this</Button>
          </form>
        </Panel>
        <div className="flex flex-col gap-4">
          {month.reflections.length ? month.reflections.map((r) => (
            <Panel key={r.id} className="rules">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-card px-5 py-3">
                <span className="flex items-center gap-2"><Tag>{r.kind}</Tag><span className="text-[0.8125rem] text-ink-2">{r.prompt}</span></span>
                <span className="font-mono text-[10px] text-ink-4">{formatTimestamp(r.date.includes('T') ? r.date : `${r.date}T12:00:00`).split(' · ')[0]}</span>
              </div>
              <p className="hand px-5 pt-[6px] pb-4 text-[1.45rem] leading-[32px] whitespace-pre-line text-ink">{r.text}</p>
              <div className="flex justify-end px-5 pb-3"><button type="button" onClick={() => { if (window.confirm('Delete this reflection?')) actions.removeReflection(month.id, r.id); }} className="text-xs text-ink-4 hover:text-pen">delete</button></div>
            </Panel>
          )) : <Panel dotted><EmptyState hint="Pick a question on the left and answer it in a few lines.">Nothing written this month.</EmptyState></Panel>}
        </div>
      </div>
    </div>
  );
}

/* ── Archive ───────────────────────────────────────── */

export function ArchiveView() {
  const { data } = useLife();
  const months = data ? sortedMonths(data) : [];
  const [raw, setId] = useState('');
  const month = months.find((m) => m.id === raw) ?? months[0];
  if (!month || !data) return <PageHead title="Archive" caption="Every month becomes a chapter." />;
  const w0 = data.settings.weekStartsOn;

  return (
    <div className="rise">
      <PageHead kicker="Memory" title="Archive" caption="Every month becomes a chapter. Pick one to read it back." />
      <div className="-mx-4 mb-6 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {months.map((m, i) => (
          <button key={m.id} type="button" onClick={() => setId(m.id)} aria-pressed={m.id === month.id}
            className={cn('w-[190px] shrink-0 rounded-[10px] border bg-card p-4 text-left transition-all sm:w-auto',
              m.id === month.id ? 'border-ink shadow-[0_10px_24px_-16px_rgba(33,30,25,0.5)]' : 'border-line hover:border-ink-4')}>
            <div className="flex items-baseline justify-between">
              <span className="label-mono text-ink-4">Ch. {months.length - i}</span>
              <span className="font-mono text-[10px] text-ink-4">{m.year}</span>
            </div>
            <p className="mt-1 font-display text-[1.3rem]">{monthName(m.month)}</p>
            <MiniMonth month={m} />
            <p className="mt-2 text-xs text-ink-3"><span className="tnum">{monthCompletion(m)}%</span> habits · <span className="tnum">{documentedDays(m)}</span> lines</p>
          </button>
        ))}
      </div>

      <Chapter key={month.id} month={month} w0={w0} number={months.length - months.indexOf(month)} />
    </div>
  );
}

function MiniMonth({ month }: { month: MonthDoc }) {
  const el = elapsedDays(month);
  return (
    <div className="mt-3 grid grid-cols-7 gap-[2px]" aria-hidden="true">
      {monthGrid(month.year, month.month, 1).map((d, i) => (
        <span key={i} className="aspect-square rounded-[2px]" style={{ background: d === null ? 'transparent' : d > el ? 'var(--color-paper-2)' : heatColor(dayCompletion(month, d)) }} />
      ))}
    </div>
  );
}

function Chapter({ month, w0, number }: { month: MonthDoc; w0: 0 | 1; number: number }) {
  const el = elapsedDays(month);
  const lines = Object.entries(month.highlights).filter(([, t]) => t.trim()).sort(([a], [b]) => Number(a) - Number(b));
  const picks = lines.filter((_, i) => i % Math.max(1, Math.ceil(lines.length / 6)) === 0).slice(0, 6);
  const ch = challengeProgress(month);
  const mood = moodAverage(month);
  return (
    <div className="flex flex-col gap-6">
      <Panel className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="border-b border-line bg-chapter px-6 py-7 text-chapter-ink lg:border-r lg:border-b-0">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase opacity-70">Chapter {number}</p>
            <h2 className="mt-2 font-display text-[2.4rem] leading-none">{monthName(month.month)}</h2>
            <p className="mt-1 font-mono text-xs opacity-70">{month.year}</p>
            {month.review?.answers.find((a) => a.a.trim()) && (
              <p className="hand mt-6 text-[1.5rem] leading-snug">“{month.review.answers.find((a) => a.q.startsWith('What changed'))?.a || month.review.answers.find((a) => a.a.trim())!.a}”</p>
            )}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div><p className="font-display text-[1.6rem] leading-none tnum">{monthCompletion(month)}%</p><p className="mt-1 font-mono text-[10px] tracking-[0.1em] uppercase opacity-70">habits</p></div>
              <div><p className="font-display text-[1.6rem] leading-none tnum">{documentedDays(month)}</p><p className="mt-1 font-mono text-[10px] tracking-[0.1em] uppercase opacity-70">lines</p></div>
              <div><p className="font-display text-[1.6rem] leading-none tnum">{mood ? mood.toFixed(1) : '—'}</p><p className="mt-1 font-mono text-[10px] tracking-[0.1em] uppercase opacity-70">mood</p></div>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between"><span className="label-mono">The month</span><HeatLegend /></div>
            <div className="mx-auto max-w-[400px]">
              <CalendarHeat cells={monthGrid(month.year, month.month, w0)} headers={weekdayHeaders(w0)}
                value={(d) => (d > el ? null : dayCompletion(month, d))} mood={(d) => month.moods?.[String(d)] ?? null} />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <PanelHead label="Habits" />
          <ul className="flex flex-col gap-3 px-5 py-5">
            {month.habits.map((h) => {
              const pct = el ? Math.round((habitCount(month, h.id) / el) * 100) : 0;
              return (
                <li key={h.id}>
                  <div className="flex justify-between text-[0.875rem]"><span>{h.name}</span><span className="font-mono text-[11px] text-ink-3 tnum">{pct}%</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-paper-3"><div className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel>
          <PanelHead label="Goals" right={`${month.goals.filter((g) => g.done).length}/${month.goals.length}`} />
          <ul className="flex flex-col gap-2.5 px-5 py-5 text-[0.875rem]">
            {month.goals.map((g) => <li key={g.id} className="flex gap-2"><span className={g.done ? 'text-sage-deep' : 'text-ink-4'}>{g.done ? '✓' : '○'}</span><span className={cn(!g.done && 'text-ink-3')}>{g.text}</span></li>)}
            {!month.goals.length && <li className="text-ink-4">No goals set.</li>}
          </ul>
          {month.challenge && <div className="border-t border-line px-5 py-4 text-[0.875rem]"><p className="label-mono mb-1 text-ink-4">Challenge</p>{month.challenge.title} <span className="text-ink-4">— held {ch.done} days</span></div>}
        </Panel>
        <Panel className="rules">
          <PanelHead label="Lines worth keeping" className="bg-card" />
          <ul className="px-5 pt-[6px] pb-4">
            {picks.map(([d, text]) => <li key={d} className="flex gap-3 leading-[32px]"><span className="w-5 shrink-0 font-mono text-[10px] text-ink-4">{d}</span><span className="hand text-[1.3rem]">{text}</span></li>)}
            {!picks.length && <li className="hand text-[1.3rem] leading-[32px] text-ink-4">No lines written.</li>}
          </ul>
        </Panel>
      </div>

      {month.review && (
        <Panel>
          <PanelHead label="Month review" />
          <dl className="grid gap-5 px-5 py-5 md:grid-cols-2">
            {month.review.answers.filter((a) => a.a.trim()).map((a) => <div key={a.q}><dt className="label-mono text-ink-4">{a.q}</dt><dd className="mt-1 font-display text-[1.05rem]">{a.a}</dd></div>)}
          </dl>
        </Panel>
      )}
    </div>
  );
}

/* ── Year in review ────────────────────────────────── */

export function YearView() {
  const { data } = useLife();
  const t = todayParts();
  const [year, setYear] = useState(t.year);
  if (!data) return null;
  const figures = yearFigures(data, year);
  const years = [...new Set([t.year, ...data.months.map((m) => m.year)])].sort((a, b) => b - a);

  return (
    <div className="rise">
      <PageHead kicker="Memory" title={`${year}, in review`} caption="Print it and paste it into the back of the notebook."
        right={<div className="no-print flex gap-2">
          {years.length > 1 && <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 rounded-full border border-line bg-card px-3 text-sm">{years.map((y) => <option key={y}>{y}</option>)}</select>}
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>} />

      <Panel className="mb-6">
        <PanelHead label="Every day of the year" right={`${figures.monthsDocumented} months kept`} />
        <div className="px-5 py-5"><YearHeat year={year} w0={data.settings.weekStartsOn} value={(m, d) => {
          const v = completionOn(data, year, m, d);
          if (v === null) return null;
          const now = new Date(t.year, t.month - 1, t.day).getTime();
          return new Date(year, m - 1, d).getTime() > now ? null : v;
        }} /></div>
      </Panel>

      {!figures.monthsDocumented ? <Panel><EmptyState>No months kept in {year}.</EmptyState></Panel> : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Panel>
              <PanelHead label="Month by month" right="habits kept" />
              <MonthBars data={data} year={year} />
            </Panel>
            <Panel>
              <PanelHead label="From your pages" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-5 py-6">
                <Stat value={figures.daysDocumented} label="lines written" />
                <Stat value={figures.habitMarks} label="habit marks" />
                <Stat value={`${figures.goalsCompleted}/${figures.goalsSet}`} label="goals done" />
                <Stat value={`${figures.challengesHeld}/${figures.challengesAttempted}`} label="challenges held" />
                {figures.bestMonth && <Stat className="col-span-2" value={monthName(figures.bestMonth.month)} label="strongest month" sub={`${monthCompletion(figures.bestMonth)}% of habits kept`} />}
              </div>
            </Panel>
          </div>
          <YearQuestions key={year} year={year} />
        </div>
      )}
    </div>
  );
}

function MonthBars({ data, year }: { data: NonNullable<ReturnType<typeof useLife>['data']>; year: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = Array.from({ length: 12 }, (_, i) => {
    const m = data.months.find((x) => x.year === year && x.month === i + 1);
    return m ? { pct: monthCompletion(m), mood: moodAverage(m), lines: documentedDays(m), days: daysInMonth(year, i + 1) } : null;
  });
  const show = hover !== null ? vals[hover] : null;
  return (
    <div className="px-5 pt-5 pb-4">
      <div className="flex h-40 items-end gap-1.5" onPointerLeave={() => setHover(null)}>
        {vals.map((v, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" onPointerEnter={() => setHover(i)}>
            <span className={cn('block w-full max-w-[28px] rounded-t-[4px] transition-all', !v && 'border border-dashed border-line')}
              style={{ height: v ? `${Math.max(4, v.pct)}%` : 4, background: v ? (hover === i ? 'var(--color-ink)' : heatColor(v.pct / 100)) : 'transparent' }} />
            <span className="font-mono text-[9px] text-ink-4">{monthShort(i + 1).slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-line pt-2 font-mono text-[11px] text-ink-3">
        {hover === null ? 'Hover a month' : show ? `${monthName(hover + 1)} · ${show.pct}% habits · ${show.lines}/${show.days} lines${show.mood ? ` · mood ${show.mood.toFixed(1)}` : ''}` : `${monthName(hover + 1)} · not kept`}
      </p>
    </div>
  );
}

function YearQuestions({ year }: { year: number }) {
  const { data, actions } = useLife();
  const { toast } = useCapture();
  const saved = data?.yearReviews[String(year)];
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries((saved?.answers ?? []).map((a) => [a.q, a.a])));
  return (
    <Panel>
      <PanelHead label="Five questions, in ink" right={saved ? `saved ${formatTimestamp(saved.completedAt).split(' · ')[0]}` : undefined} />
      <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
        {YEAR_REVIEW_QUESTIONS.map((q, i) => <LabeledArea key={q} className={i === 4 ? 'md:col-span-2' : ''} label={q} rows={3} hand value={answers[q] ?? ''} onChange={(v) => setAnswers({ ...answers, [q]: v })} />)}
        <div className="no-print md:col-span-2">
          <Button onClick={() => { actions.saveYearReview({ year, answers: YEAR_REVIEW_QUESTIONS.map((q) => ({ q, a: answers[q] ?? '' })), favoriteMoments: [], completedAt: new Date().toISOString() }); toast('Year saved'); }}>Save the year</Button>
        </div>
      </div>
    </Panel>
  );
}

