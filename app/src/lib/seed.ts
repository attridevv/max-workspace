import { daysInMonth, monthId, prevMonth, todayParts } from './dates';
import type { Goal, Habit, Metric, Mood, MonthDoc } from './types';

let counter = 0;
export function uid(p = 'id') {
  counter++;
  return `${p}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const HABIT_PRESETS = ['Run', 'Strength', 'Mobility', 'Reading', 'Meditation', 'Sleep 7h+', 'Water', 'Learning', 'Creative work'];
export const GOAL_SUGGESTIONS = ['Run 100 km', 'Finish 2 books', 'Ship a side project', 'Call family every week', 'Save ₹10,000'];
export const CHALLENGE_PRESETS = ['No phone before breakfast.', 'Run every other day.', 'Study Japanese for 20 minutes.', 'Build something every day.', 'Sleep before midnight.'];
export const METRIC_PRESETS = [
  { name: 'Bodyweight', unit: 'kg' }, { name: 'Sleep', unit: 'hours' }, { name: 'Running', unit: 'km' },
  { name: 'Reading', unit: 'pages' }, { name: 'Study', unit: 'hours' }, { name: 'Money saved', unit: '₹' },
];

/** Pull a number + unit out of goal text: "Run 100 km" → 100 km, "Save ₹10,000" → 10000 ₹ */
export function parseGoalTarget(text: string): { target?: number; unit?: string } {
  const rupee = text.match(/₹\s?([\d,]+)/);
  if (rupee) return { target: Number(rupee[1].replace(/,/g, '')), unit: '₹' };
  const m = text.match(/([\d,.]+)\s*(km|kg|books?|pages?|hours?|h|sessions?|workouts?|runs?|posts?|videos?)\b/i);
  if (m) return { target: Number(m[1].replace(/,/g, '')), unit: m[2].toLowerCase() };
  return {};
}

// ── example data ──────────────────────────────────────────────
// Three months that end today, so every screen has something real to show.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const HIGHLIGHT_POOL = [
  'Morning run felt incredible.', 'Shipped the milestone I kept pushing back.', 'Football with friends. Legs sore, mind quiet.',
  'Finally understood recursion.', 'Cooked dinner instead of ordering in.', 'Watched the sunrise from the terrace.',
  'Long call with Ma. Told her about the plan.', 'Rest day. Slept nine hours and needed every one.', 'Wrote 300 words I actually like.',
  'First tempo run that did not feel like dying.', 'Cleaned the whole room. Head feels clear.', 'An old friend called out of nowhere.',
  'Bad day. Still showed up.', 'Rain. Ran anyway.', 'Ran 8 km before sunrise.', 'Finished the book I had carried for weeks.',
  'Saved my first ₹5,000 this month.', 'Dinner with family. Laughed until it hurt.', 'Deadlift PR — 100 kg.',
  'Morning pages cleared the fog.', 'Walked home instead of taking the bus.', 'Helped a junior debug their code.',
  'First 10-mile week since last winter.', 'Read on the balcony for two hours.', 'Woke up before the alarm, rested.',
  'Chess: beat someone 200 points higher.', 'New playlist carried the long run.', 'Said no to something. Felt good.',
  'Fixed the bug that ate two days.', 'Hill repeats. Hated them, finished them.', 'Sat in the park and did nothing. Needed it.',
];

const HABITS = ['Running', 'Strength', 'Mobility', 'Reading', 'Meditation', 'Sleep 7h+'];
const HABIT_RATE = [0.6, 0.45, 0.7, 0.85, 0.65, 0.75];

function exampleMonth(y: number, m: number, uptoDay: number, seed: number, stage: 0 | 1 | 2): MonthDoc {
  const r = rng(seed);
  const habits: Habit[] = HABITS.map((name, order) => ({ id: uid('habit'), name, order }));
  const habitDays: Record<string, number[]> = {};
  // later months get slightly better — the story of the notebook working
  const lift = (stage - 1) * 0.11;
  habits.forEach((h, i) => {
    const days: number[] = [];
    for (let d = 1; d <= uptoDay; d++) if (r() < HABIT_RATE[i] + lift) days.push(d);
    habitDays[h.id] = days;
  });

  const highlights: Record<string, string> = {};
  const moods: Record<string, Mood> = {};
  for (let d = 1; d <= uptoDay; d++) {
    if (r() < 0.88) highlights[String(d)] = HIGHLIGHT_POOL[Math.floor(r() * HIGHLIGHT_POOL.length)];
    const done = habits.filter((h) => habitDays[h.id].includes(d)).length / habits.length;
    moods[String(d)] = Math.max(1, Math.min(5, Math.round(1.8 + done * 2.6 + (r() - 0.5) * 1.4))) as Mood;
  }

  const metrics: Metric[] = [
    { id: uid('metric'), name: 'Bodyweight', unit: 'kg', order: 0 },
    { id: uid('metric'), name: 'Running', unit: 'km', order: 1 },
    { id: uid('metric'), name: 'Sleep', unit: 'hours', order: 2 },
  ];
  const bw: Record<string, number> = {}, km: Record<string, number> = {}, sl: Record<string, number> = {};
  let weight = 74.8 - stage * 0.9;
  for (let d = 1; d <= uptoDay; d++) {
    weight += (r() - 0.56) * 0.35;
    if (d % 2 === 1 || r() < 0.3) bw[String(d)] = Math.round(weight * 10) / 10;
    if (habitDays[habits[0].id].includes(d)) km[String(d)] = Math.round((4 + r() * 8) * 10) / 10;
    sl[String(d)] = Math.round((6 + r() * 2.4) * 10) / 10;
  }

  const kmDone = Object.values(km).reduce((s, v) => s + v, 0);
  const total = daysInMonth(y, m);
  const goals: Goal[] = [
    { id: uid('goal'), text: 'Run 120 km', target: 120, current: Math.round(kmDone), unit: 'km', area: 'Body', done: kmDone >= 120, order: 0 },
    { id: uid('goal'), text: 'Finish 2 books', target: 2, current: uptoDay >= total ? 2 : Math.min(2, Math.floor(uptoDay / 14)), unit: 'books', area: 'Mind', done: uptoDay >= total, order: 1 },
    { id: uid('goal'), text: 'Ship the portfolio redesign', area: 'Work', done: stage < 2, order: 2 },
    { id: uid('goal'), text: 'Save ₹15,000', target: 15000, current: Math.round((uptoDay / total) * 14000 / 500) * 500, unit: '₹', area: 'Money', done: false, order: 3 },
    { id: uid('goal'), text: 'Call Ma every Sunday', area: 'People', done: uptoDay >= total, order: 4 },
  ];
  for (const g of goals) {
    if (!g.target) continue;
    const steps = Math.min(6, Math.max(1, Math.floor(uptoDay / 4)));
    g.log = Array.from({ length: steps }, (_, i) => ({
      at: new Date(y, m - 1, Math.max(1, Math.round(((i + 1) / steps) * uptoDay))).toISOString(),
      value: Math.round(((g.current ?? 0) * (i + 1)) / steps),
    }));
  }

  const marks: Record<number, 'done' | 'missed'> = {};
  for (let d = 1; d <= uptoDay; d++) marks[d] = r() < 0.86 ? 'done' : 'missed';
  const challenges = ['No phone during the first 30 minutes after waking.', 'Sleep before midnight.', 'Build something every day.'];

  const iso = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    id: monthId(y, m), year: y, month: m, createdAt: new Date(y, m - 1, 1).toISOString(),
    habits, habitDays, goals,
    challenge: { id: uid('challenge'), title: challenges[stage], days: 30, marks },
    highlights, moods,
    reflections: [
      { id: uid('ref'), date: iso(Math.min(uptoDay, 7)), kind: 'weekly', prompt: 'What moved this week?', text: 'Easy runs stopped feeling like punishment. Sleep is the whole game — guard it. Mobility is the weak link.' },
      ...(uptoDay >= 21 ? [{ id: uid('ref'), date: iso(21), kind: 'weekly' as const, prompt: 'What moved this week?', text: 'Longest week of running since last winter. Mornings are mine again.' }] : []),
    ],
    metrics, metricEntries: { [metrics[0].id]: bw, [metrics[1].id]: km, [metrics[2].id]: sl },
    review: uptoDay >= total ? {
      completedAt: new Date(y, m - 1, total).toISOString(),
      answers: [
        { q: 'What changed?', a: 'Mornings. I stopped reaching for the phone first.' },
        { q: 'What worked?', a: 'Laying out running kit the night before.' },
        { q: "What didn't?", a: 'Meditation on weekends — never happened.' },
        { q: 'What did I learn?', a: 'Consistency beats intensity, every single time.' },
        { q: 'What do I carry into next month?', a: 'Bed before midnight. The rest follows.' },
      ],
    } : null,
  };
}

/** The current month (up to yesterday) plus the two before it. */
export function buildExampleMonths(): MonthDoc[] {
  const t = todayParts();
  const p1 = prevMonth(t.year, t.month);
  const p2 = prevMonth(p1.year, p1.month);
  return [
    exampleMonth(t.year, t.month, Math.max(0, t.day - 1), 7, 2),
    exampleMonth(p1.year, p1.month, daysInMonth(p1.year, p1.month), 31, 1),
    exampleMonth(p2.year, p2.month, daysInMonth(p2.year, p2.month), 101, 0),
  ];
}
