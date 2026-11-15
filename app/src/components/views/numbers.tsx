'use client';

import { useState } from 'react';
import { useLife } from '@/lib/store';
import { daysInMonth, isFuture, monthLabel, monthShort, todayParts } from '@/lib/dates';
import { elapsedDays, isAdditive, metricSeries } from '@/lib/stats';
import { METRIC_PRESETS } from '@/lib/seed';
import type { Metric, MonthDoc } from '@/lib/types';
import { Button, EmptyState, PageHead, Panel, PanelHead } from '@/components/ui/kit';
import { LineChart } from '@/components/ui/charts';
import { NumberInput, toNumber } from '@/components/ui/fields';
import { useCapture } from '@/components/shell/quick-capture';
import { cn } from '@/lib/utils';
import { MonthTabs, fmtNum, useMonthPicker } from './shared';

export function NumbersView() {
  const { months, month, setId } = useMonthPicker();
  if (!month) return <PageHead title="Numbers" caption="Open a month first." />;
  return (
    <div className="rise">
      <PageHead kicker={monthLabel(month.year, month.month)} title="Numbers" caption="Only the numbers that help you understand the month. Log them here or on any day of the spread." />
      <MonthTabs months={months} id={month.id} setId={setId} />
      {month.metrics.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {month.metrics.map((mt) => <MetricCard key={mt.id} month={month} metric={mt} />)}
        </div>
      ) : (
        <Panel dotted><EmptyState hint="Bodyweight, km run, hours slept, money saved — pick one below.">No numbers on this month.</EmptyState></Panel>
      )}
      <AddMetric month={month} />
    </div>
  );
}

function MetricCard({ month, metric }: { month: MonthDoc; metric: Metric }) {
  const { actions } = useLife();
  const { toast } = useCapture();
  const t = todayParts();
  const isCurrent = month.year === t.year && month.month === t.month;
  const [day, setDay] = useState(isCurrent ? t.day : Math.max(1, elapsedDays(month)));
  const [value, setValue] = useState('');
  const series = metricSeries(month, metric.id);
  const additive = isAdditive(metric.unit, metric.name);
  const total = series.reduce((s, p) => s + p.value, 0);
  let run = 0;
  const points = additive ? series.map((p) => ({ x: p.day, y: (run += p.value) })) : series.map((p) => ({ x: p.day, y: p.value }));
  const first = series[0]?.value, last = series[series.length - 1]?.value;
  const delta = first !== undefined && last !== undefined ? last - first : null;
  const goal = additive ? month.goals.find((g) => g.target && g.unit === metric.unit)?.target : undefined;
  const existing = month.metricEntries[metric.id]?.[String(day)];

  function log() {
    const n = toNumber(value);
    if (n === null) return;
    actions.setMetricValue(month.id, metric.id, day, n);
    toast(`${metric.name}: ${fmtNum(n, metric.unit)} on the ${day}${['th', 'st', 'nd', 'rd'][day % 10 > 3 || Math.floor(day / 10) === 1 ? 0 : day % 10]}`);
    setValue('');
  }

  return (
    <Panel>
      <PanelHead label={metric.name} right={metric.unit} />
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3 px-5 pt-5">
        <div>
          <p className="font-display text-[2.2rem] leading-none tnum">{additive ? fmtNum(total, metric.unit === '₹' ? '₹' : undefined) : last !== undefined ? fmtNum(last) : '—'}<span className="ml-1 text-base text-ink-4">{metric.unit !== '₹' ? metric.unit : ''}</span></p>
          <p className="label-mono mt-1.5 text-ink-4">{additive ? 'total this month' : 'latest'}</p>
        </div>
        {!additive && delta !== null && series.length > 1 && (
          <div>
            <p className={cn('font-display text-[1.3rem] leading-none tnum', delta === 0 ? 'text-ink-3' : 'text-ink')}>{delta > 0 ? '+' : delta < 0 ? '−' : '±'}{fmtNum(Math.abs(delta))}</p>
            <p className="label-mono mt-1.5 text-ink-4">since the {series[0].day}{series[0].day === 1 ? 'st' : 'th'}</p>
          </div>
        )}
        <div>
          <p className="font-display text-[1.3rem] leading-none tnum">{series.length}</p>
          <p className="label-mono mt-1.5 text-ink-4">entries</p>
        </div>
      </div>
      <div className="px-3 pt-4 sm:px-5">
        <LineChart points={points} xMax={daysInMonth(month.year, month.month)} unit={metric.unit} goal={goal}
          xLabel={(x) => `${x} ${monthShort(month.month)}`} />
        {additive && <p className="mt-1 px-2 text-xs text-ink-4">Running total — each entry adds to it.</p>}
      </div>
      <form className="flex flex-wrap items-end gap-2 border-t border-line px-5 py-4" onSubmit={(e) => { e.preventDefault(); log(); }}>
        <label className="flex flex-col gap-1">
          <span className="label-mono text-ink-4">Day</span>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="h-[42px] rounded-[var(--radius)] border border-line bg-card px-2.5 text-sm">
            {Array.from({ length: daysInMonth(month.year, month.month) }, (_, i) => i + 1).filter((d) => !isFuture(month.year, month.month, d)).reverse().map((d) => (
              <option key={d} value={d}>{d} {monthShort(month.month)}{isCurrent && d === t.day ? ' · today' : ''}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[7rem] flex-1 flex-col gap-1">
          <span className="label-mono text-ink-4">{existing !== undefined ? `Logged ${fmtNum(existing)} — replace` : 'Value'}</span>
          <NumberInput value={value} onChange={setValue} placeholder={metric.unit} />
        </label>
        <Button type="submit" disabled={toNumber(value) === null}>Log</Button>
        {existing !== undefined && <Button variant="ghost" onClick={() => actions.setMetricValue(month.id, metric.id, day, null)}>Clear</Button>}
      </form>
      <div className="flex justify-end px-5 pb-3">
        <button type="button" onClick={() => { if (window.confirm(`Stop tracking ${metric.name} this month?`)) actions.removeMetric(month.id, metric.id); }} className="text-xs text-ink-4 hover:text-pen">remove</button>
      </div>
    </Panel>
  );
}

function AddMetric({ month }: { month: MonthDoc }) {
  const { actions } = useLife();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const have = new Set(month.metrics.map((m) => m.name.toLowerCase()));
  return (
    <Panel dotted className="mt-6">
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="label-mono">Track a number</p>
        <div className="flex flex-wrap gap-1.5">
          {METRIC_PRESETS.filter((p) => !have.has(p.name.toLowerCase())).map((p) => (
            <button key={p.name} type="button" onClick={() => actions.addMetric(month.id, p.name, p.unit)} className="rounded-full border border-line bg-card px-3 py-1 text-[0.8125rem] text-ink-3 hover:border-ink-4">+ {p.name} <span className="font-mono text-[10px] text-ink-4">{p.unit}</span></button>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim() && unit.trim()) { actions.addMetric(month.id, name.trim(), unit.trim()); setName(''); setUnit(''); } }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="min-w-0 flex-[2] rounded-[8px] border border-line bg-card px-3.5 py-2.5 text-sm focus:border-sage focus:outline-none" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="w-24 rounded-[8px] border border-line bg-card px-3.5 py-2.5 text-sm focus:border-sage focus:outline-none" />
          <Button type="submit" disabled={!name.trim() || !unit.trim()}>Add</Button>
        </form>
        <p className="text-xs text-ink-4">km, pages, hours, min and ₹ add up over the month. Readings like kg or hours slept show the latest value.</p>
      </div>
    </Panel>
  );
}
