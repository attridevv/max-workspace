'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLife } from '@/lib/store';
import { CHALLENGE_PRESETS, GOAL_SUGGESTIONS, HABIT_PRESETS, METRIC_PRESETS } from '@/lib/seed';
import { monthLabel, todayParts } from '@/lib/dates';
import { cn } from '@/lib/utils';

export function Onboarding() {
  const { actions } = useLife();
  const t = todayParts();
  const [step, setStep] = useState(0);
  const period = { year: t.year, month: t.month };
  const [habits, setHabits] = useState(['Run', 'Reading', 'Sleep 7h+']);
  const [goals, setGoals] = useState<string[]>([GOAL_SUGGESTIONS[0]]);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ name: string; unit: string }[]>([]);
  const [custom, setCustom] = useState('');

  function toggle(list: string[], value: string, setter: (v: string[]) => void, max: number) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : list.length < max ? [...list, value] : list);
  }
  function finish() {
    actions.createMonth({ year: period.year, month: period.month, habits, goals: goals.map((text) => ({ text })), challenge: challenge ? { title: challenge, days: 30 } : null, metrics });
  }
  const titles = ['Build your first month.', 'Choose a few habits.', 'Set a few goals.', 'Choose one challenge.', 'Pick optional metrics.'];
  const valid = step === 1 ? habits.length >= 3 : step === 2 ? goals.length >= 1 : true;

  if (step === 0) return <div className="dots flex min-h-dvh items-center bg-paper p-5"><div className="mx-auto max-w-[620px]"><p className="label-mono text-sage-deep">Max Workspace · the companion</p><h1 className="mt-6 font-display text-[3rem] leading-[1.04] font-[460] tracking-[-0.02em]">Build your first month.</h1><p className="mt-5 max-w-[48ch] text-ink-2">A quiet digital doorway into a physical life journal. Set up two pages, then close the screen and live the month.</p><div className="mt-8 flex flex-wrap gap-4"><button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-sage-deep">Start <ArrowRight className="size-4" /></button><button type="button" onClick={() => actions.addExampleMonth()} className="text-sm text-sage-deep hover:text-ink">or explore a filled example</button></div><p className="annot mt-8">Track less. Notice more. Remember better.</p></div></div>;

  return <div className="dots min-h-dvh bg-paper"><div className="mx-auto flex min-h-dvh max-w-[720px] flex-col px-5 py-10"><header className="flex items-center justify-between"><span className="font-display text-[1.05rem] font-[520]">Max Workspace</span><span className="label-mono">Step {step} of 5</span></header><div className="mt-6 flex gap-1.5">{[1,2,3,4,5].map((n) => <span key={n} className={cn('h-[2px] flex-1 rounded-full', n <= step ? 'bg-sage-deep' : 'bg-line')} />)}</div><main className="mt-10 flex-1"><h1 className="font-display text-[2.1rem] leading-tight font-[480]">{titles[step - 1]}</h1><p className="mt-3 text-sm text-ink-3">{step === 1 ? 'Three to eight meaningful habits. Not your entire existence.' : step === 2 ? 'One to five goals, written where you cannot avoid them.' : step === 3 ? 'One focused challenge turns a decision into a habit.' : step === 4 ? 'Optional numbers. Keep only the ones that help you understand your life.' : `The month you are setting up: ${monthLabel(period.year, period.month)}.`}</p><div className="mt-7">
    {step === 1 && <><div className="flex flex-wrap gap-2">{HABIT_PRESETS.map((h) => <Chip key={h} active={habits.includes(h)} onClick={() => toggle(habits, h, setHabits, 8)}>{h}</Chip>)}</div><InputAdd value={custom} setValue={setCustom} onAdd={() => { if (custom.trim() && habits.length < 8) { setHabits([...habits, custom.trim()]); setCustom(''); } }} placeholder="Add a habit" /><p className="label-mono mt-4">{habits.length} chosen · at least 3</p></>}
    {step === 2 && <><ul className="flex flex-col gap-2">{goals.map((g) => <li key={g} className="flex items-center gap-3 rounded border border-line bg-card px-4 py-3"><span className="text-sage-deep">·</span><span className="flex-1">{g}</span><button type="button" onClick={() => setGoals(goals.filter((x) => x !== g))} className="text-xs text-ink-4">remove</button></li>)}</ul><div className="mt-4 flex flex-wrap gap-2">{GOAL_SUGGESTIONS.filter((g) => !goals.includes(g)).map((g) => <Chip key={g} onClick={() => goals.length < 5 && setGoals([...goals, g])}>+ {g}</Chip>)}</div><InputAdd value={custom} setValue={setCustom} onAdd={() => { if (custom.trim() && goals.length < 5) { setGoals([...goals, custom.trim()]); setCustom(''); } }} placeholder="Add a goal" /></>}
    {step === 3 && <><div className="flex flex-wrap gap-2">{CHALLENGE_PRESETS.map((c) => <Chip key={c} active={challenge === c} onClick={() => setChallenge(challenge === c ? null : c)}>{c}</Chip>)}</div><InputAdd value={custom} setValue={setCustom} onAdd={() => { if (custom.trim()) { setChallenge(custom.trim()); setCustom(''); } }} placeholder="Or write your own challenge" /><button type="button" onClick={() => setChallenge(null)} className="mt-5 text-sm text-ink-3 underline underline-offset-4">Skip for this month</button></>}
    {step === 4 && <><div className="flex flex-wrap gap-2">{METRIC_PRESETS.map((m) => { const on = metrics.some((x) => x.name === m.name); return <Chip key={m.name} active={on} onClick={() => setMetrics(on ? metrics.filter((x) => x.name !== m.name) : [...metrics, m])}>{m.name} <span className="font-mono text-[10px]">({m.unit})</span></Chip>; })}</div><p className="annot mt-5 text-sm">No metrics is a perfectly good answer.</p></>}
    {step === 5 && <div className="rounded border border-line bg-card p-5"><p className="font-display text-xl">{monthLabel(period.year, period.month)} is ready.</p><p className="mt-3 text-sm text-ink-3">{habits.length} habits · {goals.length} goals · {challenge ? 'one challenge' : 'no challenge'} · {metrics.length} metrics</p></div>}
  </div></main><footer className="mt-10 flex justify-between border-t border-line pt-6"><button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 text-sm text-ink-3"><ArrowLeft className="size-4" /> Back</button><button type="button" disabled={!valid} onClick={() => step === 5 ? finish() : setStep(step + 1)} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm text-paper hover:bg-sage-deep disabled:opacity-40">{step === 5 ? <>Open the workspace <Check className="size-4" /></> : <>Continue <ArrowRight className="size-4" /></>}</button></footer></div></div>;
}

function Chip({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} aria-pressed={active} className={cn('rounded-full border px-4 py-2 text-sm', active ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink-2 hover:border-sage')}>{children}</button>; }
function InputAdd({ value, setValue, onAdd, placeholder }: { value: string; setValue: (v: string) => void; onAdd: () => void; placeholder: string }) { return <div className="mt-5 flex gap-3"><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder={placeholder} className="min-w-0 flex-1 rounded border border-line bg-card px-3.5 py-2.5 text-sm placeholder:text-ink-4 focus:border-sage focus:outline-none" /><button type="button" onClick={onAdd} className="rounded-full border border-line px-4 py-2 text-sm">Add</button></div>; }
