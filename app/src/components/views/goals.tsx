'use client';

import { useState } from 'react';
import { Minus, Pencil, Plus } from 'lucide-react';
import { useLife } from '@/lib/store';
import { daysInMonth, monthLabel, monthName, parseMonthId } from '@/lib/dates';
import { elapsedDays, goalPace, goalPercent } from '@/lib/stats';
import { parseGoalTarget } from '@/lib/seed';
import { GOAL_AREAS, type Goal, type GoalArea, type MonthDoc } from '@/lib/types';
import { Button, Check, EmptyState, PageHead, Panel, Pill, Tag } from '@/components/ui/kit';
import { Meter, Ring, Sparkline } from '@/components/ui/charts';
import { NumberInput, toNumber } from '@/components/ui/fields';
import { useCapture } from '@/components/shell/quick-capture';
import { cn } from '@/lib/utils';
import { MonthTabs, fmtNum, paceText, useMonthPicker } from './shared';

export function GoalsView() {
  const { months, month, setId } = useMonthPicker();
  if (!month) return <PageHead title="Goals" caption="Open a month first." />;
  const done = month.goals.filter((g) => g.done).length;
  const numeric = month.goals.filter((g) => g.target && !g.done);
  const onPace = numeric.filter((g) => goalPace(month, g)?.ahead).length;
  const total = daysInMonth(month.year, month.month);
  const elapsed = elapsedDays(month);
  const pct = month.goals.length ? Math.round((done / month.goals.length) * 100) : 0;
  const sorted = [...month.goals].sort((a, b) => Number(a.done) - Number(b.done) || a.order - b.order);

  return (
    <div className="rise">
      <PageHead kicker={monthLabel(month.year, month.month)} title="Goals" caption="A few things this month is for. Numbers where you can, a tick where you can’t." />
      <MonthTabs months={months} id={month.id} setId={setId} />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-6 px-5 py-5 sm:gap-10">
          <Ring pct={pct} size={92} stroke={8} label={`${done} of ${month.goals.length} goals done`}>
            <span className="font-display text-[1.45rem] leading-none tnum">{done}<span className="text-sm text-ink-4">/{month.goals.length}</span></span>
          </Ring>
          <div className="grid flex-1 grid-cols-3 gap-4">
            <Mini value={`${done}`} label="done" />
            <Mini value={numeric.length ? `${onPace}/${numeric.length}` : '—'} label="on pace" tone={numeric.length && onPace < numeric.length ? 'pen' : undefined} />
            <Mini value={`${Math.max(0, total - elapsed)}`} label="days left" />
          </div>
        </div>
        <div className="border-t border-line px-5 py-3">
          <div className="flex gap-[2px]" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <span key={i} className={cn('h-1.5 flex-1 rounded-[1px]', i < elapsed ? 'bg-ink-4/60' : 'bg-paper-3')} />)}
          </div>
          <p className="mt-1.5 text-xs text-ink-4">The red tick on each bar is where even pace would put you today.</p>
        </div>
      </Panel>

      {sorted.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((g) => <GoalCard key={g.id} month={month} goal={g} />)}
        </div>
      ) : (
        <Panel dotted><EmptyState hint="Write it with a number if it has one — “Run 100 km” — and you’ll get a progress bar and pace.">No goals this month yet.</EmptyState></Panel>
      )}

      <AddGoal month={month} />
    </div>
  );
}

function Mini({ value, label, tone }: { value: string; label: string; tone?: 'pen' }) {
  return (
    <div>
      <p className={cn('font-display text-[1.6rem] leading-none tnum', tone === 'pen' && 'text-pen')}>{value}</p>
      <p className="label-mono mt-1.5 text-ink-4">{label}</p>
    </div>
  );
}

function GoalCard({ month, goal: g }: { month: MonthDoc; goal: Goal }) {
  const { actions } = useLife();
  const { toast } = useCapture();
  const [step, setStep] = useState('');
  const [editing, setEditing] = useState(false);
  const pct = goalPercent(g);
  const pace = goalPace(month, g);
  const current = g.current ?? 0;
  const history = (g.log ?? []).map((l) => l.value);
  const stepGuess = g.target ? (g.unit === '₹' ? Math.max(100, Math.round(g.target / 20 / 100) * 100) : g.target >= 50 ? 5 : 1) : 1;

  function add(delta: number) {
    const next = Math.max(0, current + delta);
    actions.setGoalProgress(month.id, g.id, next);
    if (g.target && next >= g.target && current < g.target) toast(`Goal hit: ${g.text}`);
  }

  if (editing) return <GoalEditor month={month} goal={g} onDone={() => setEditing(false)} />;

  return (
    <Panel className={cn('flex flex-col', g.done && 'bg-paper-2/70')}>
      <div className="flex items-start gap-3 px-5 pt-5">
        {!g.target && (
          <button type="button" onClick={() => actions.updateGoal(month.id, g.id, { done: !g.done })} aria-label={g.done ? 'Mark not done' : 'Mark done'} className="mt-0.5">
            <Check on={g.done} className="size-[22px]" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {g.area && <Tag>{g.area}</Tag>}
            {g.carriedFrom && <Tag className="bg-tape/50">from {monthName(parseMonthId(g.carriedFrom).month)}</Tag>}
            {g.done && <Tag className="bg-sage-tint text-sage-deep">done</Tag>}
          </div>
          <h3 className={cn('font-display text-[1.2rem] leading-snug', g.done && 'text-ink-3 line-through decoration-1')}>{g.text}</h3>
        </div>
        <button type="button" onClick={() => setEditing(true)} aria-label="Edit goal" className="grid size-8 shrink-0 place-items-center rounded-full text-ink-4 hover:bg-paper-2 hover:text-ink"><Pencil className="size-3.5" /></button>
      </div>

      {g.target ? (
        <div className="mt-auto px-5 pt-4 pb-5">
          <div className="flex items-end justify-between gap-3">
            <p className="font-display text-[1.9rem] leading-none tnum">
              {fmtNum(current, g.unit === '₹' ? '₹' : undefined)}
              <span className="text-base text-ink-4"> / {fmtNum(g.target, g.unit === '₹' ? '₹' : undefined)}{g.unit && g.unit !== '₹' ? ` ${g.unit}` : ''}</span>
            </p>
            {history.length > 1 && <Sparkline values={history} width={92} height={30} />}
          </div>
          <Meter className="mt-3" pct={pct} pace={pace ? (pace.expected / g.target) * 100 : undefined} />
          <div className="mt-2 flex items-center justify-between text-xs">
            {(() => { const pt = pace ? paceText(pace.diff, g.unit) : null; return (
              <span className={cn(g.done || pt?.ahead ? 'text-sage-deep' : 'text-pen')}>{g.done ? 'Hit it.' : pt?.text ?? ''}</span>
            ); })()}
            <span className="font-mono text-ink-3 tnum">{pct}%</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={() => add(-stepGuess)} aria-label={`Minus ${stepGuess}`} className="grid size-9 place-items-center rounded-full border border-line bg-card hover:border-ink"><Minus className="size-4" /></button>
            <button type="button" onClick={() => add(stepGuess)} className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-card px-3 text-sm hover:border-ink"><Plus className="size-3.5" />{fmtNum(stepGuess, g.unit)}</button>
            <form className="flex min-w-0 flex-1 items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); const n = toNumber(step); if (n !== null) { add(n); setStep(''); } }}>
              <NumberInput value={step} onChange={setStep} placeholder="add…" ariaLabel="Amount to add" className="h-9 min-w-0 py-1.5 text-sm" />
              <Button type="submit" size="sm" variant="outline" disabled={toNumber(step) === null}>Add</Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-auto px-5 pt-3 pb-5">
          <p className="text-xs text-ink-4">{g.done ? 'Ticked off.' : 'No number on this one. Tick it when it’s done.'}</p>
        </div>
      )}
    </Panel>
  );
}

function GoalEditor({ month, goal: g, onDone }: { month: MonthDoc; goal: Goal; onDone: () => void }) {
  const { actions } = useLife();
  const [text, setText] = useState(g.text);
  const [target, setTarget] = useState(g.target ? String(g.target) : '');
  const [current, setCurrent] = useState(g.current !== undefined ? String(g.current) : '');
  const [unit, setUnit] = useState(g.unit ?? '');
  const [area, setArea] = useState<GoalArea | undefined>(g.area);

  function save() {
    const t = toNumber(target);
    const c = toNumber(current);
    actions.updateGoal(month.id, g.id, { text: text.trim() || g.text, target: t ?? undefined, unit: unit.trim() || undefined, area });
    if (t && c !== null && c !== g.current) actions.setGoalProgress(month.id, g.id, c);
    onDone();
  }

  return (
    <Panel className="ring-2 ring-ink/10">
      <div className="flex flex-col gap-4 px-5 py-5">
        <input value={text} onChange={(e) => setText(e.target.value)} className="w-full border-b border-line bg-transparent pb-1.5 font-display text-[1.2rem] focus:border-sage focus:outline-none" aria-label="Goal" />
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1"><span className="label-mono text-ink-4">Now</span><NumberInput value={current} onChange={setCurrent} placeholder="0" /></label>
          <label className="flex flex-col gap-1"><span className="label-mono text-ink-4">Target</span><NumberInput value={target} onChange={setTarget} placeholder="none" /></label>
          <label className="flex flex-col gap-1"><span className="label-mono text-ink-4">Unit</span><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="km" className="w-full rounded-[var(--radius)] border border-line bg-card px-3.5 py-2.5 text-[0.9375rem] focus:border-sage focus:outline-none" /></label>
        </div>
        <div className="flex flex-wrap gap-1.5">{GOAL_AREAS.map((a) => <Pill key={a} active={area === a} onClick={() => setArea(area === a ? undefined : a)}>{a}</Pill>)}</div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <button type="button" onClick={() => { if (window.confirm(`Remove “${g.text}”?`)) actions.removeGoal(month.id, g.id); }} className="text-sm text-pen hover:underline">Remove goal</button>
          <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button><Button size="sm" onClick={save}>Save</Button></div>
        </div>
      </div>
    </Panel>
  );
}

function AddGoal({ month }: { month: MonthDoc }) {
  const { actions } = useLife();
  const { toast } = useCapture();
  const [text, setText] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [area, setArea] = useState<GoalArea | undefined>();
  const guess = parseGoalTarget(text);

  function submit() {
    if (!text.trim()) return;
    const t = toNumber(target);
    actions.addGoal(month.id, { text: text.trim(), target: t ?? guess.target, unit: unit.trim() || guess.unit, area });
    toast('Goal added');
    setText(''); setTarget(''); setUnit(''); setArea(undefined);
  }

  return (
    <Panel dotted className="mt-6">
      <form className="flex flex-col gap-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <p className="label-mono">Add a goal</p>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Run 100 km · Read 2 books · Save ₹10,000"
          className="hand w-full rounded-[8px] border border-line bg-card px-4 py-2.5 text-[1.4rem] placeholder:font-sans placeholder:text-[0.9375rem] placeholder:text-ink-4 focus:border-sage focus:outline-none" />
        {guess.target && !target && <p className="-mt-2 text-xs text-sage-deep">Tracking this as {fmtNum(guess.target, guess.unit)}. Change it below if that’s wrong.</p>}
        <div className="flex flex-wrap gap-1.5">{GOAL_AREAS.map((a) => <Pill key={a} active={area === a} onClick={() => setArea(area === a ? undefined : a)}>{a}</Pill>)}</div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex w-28 flex-col gap-1"><span className="label-mono text-ink-4">Target</span><NumberInput value={target} onChange={setTarget} placeholder={guess.target ? String(guess.target) : 'optional'} /></label>
          <label className="flex w-24 flex-col gap-1"><span className="label-mono text-ink-4">Unit</span><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={guess.unit ?? 'km'} className="w-full rounded-[var(--radius)] border border-line bg-card px-3.5 py-2.5 text-[0.9375rem] focus:border-sage focus:outline-none" /></label>
          <Button type="submit" disabled={!text.trim()} className="sm:ml-auto">Add goal</Button>
        </div>
      </form>
    </Panel>
  );
}
