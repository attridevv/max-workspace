import { daysInMonth, lastNDays, monthId, todayParts } from './dates';
import type { Goal, LifeData, MonthDoc } from './types';

/** How many days of this month have happened (including today). */
export function elapsedDays(m: MonthDoc) {
  const t = todayParts();
  const total = daysInMonth(m.year, m.month);
  if (t.year === m.year && t.month === m.month) return t.day;
  return m.year > t.year || (m.year === t.year && m.month > t.month) ? 0 : total;
}

export function habitCount(m: MonthDoc, hid: string) { return m.habitDays[hid]?.length ?? 0; }
export function habitPercent(m: MonthDoc, hid: string) { const e = elapsedDays(m); return e ? Math.round((habitCount(m, hid) / e) * 100) : 0; }

/** Current run of marked days ending today (or yesterday, if today is still open). */
export function habitStreak(m: MonthDoc, hid: string) {
  const t = todayParts();
  const marked = new Set(m.habitDays[hid] ?? []);
  let d = m.year === t.year && m.month === t.month ? t.day : daysInMonth(m.year, m.month);
  if (!marked.has(d)) d--;
  let s = 0;
  while (d >= 1 && marked.has(d)) { s++; d--; }
  return s;
}
export function bestStreak(m: MonthDoc, hid: string) {
  const days = m.habitDays[hid] ?? [];
  let best = 0, run = 0, prev = -1;
  for (const d of days) { run = d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return best;
}

/** Streak that crosses month boundaries, matched by habit name. */
export function crossMonthStreak(data: LifeData, name: string) {
  const days = lastNDays(120);
  let s = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    const m = data.months.find((x) => x.id === monthId(d.year, d.month));
    const h = m?.habits.find((x) => x.name === name);
    const on = !!(m && h && m.habitDays[h.id]?.includes(d.day));
    if (!on) { if (i === days.length - 1) continue; break; }
    s++;
  }
  return s;
}

export function documentedDays(m: MonthDoc) { return Object.values(m.highlights).filter((t) => t.trim()).length; }
export function habitMarks(m: MonthDoc) { return Object.values(m.habitDays).reduce((s, d) => s + d.length, 0); }
export function possibleMarks(m: MonthDoc) { return m.habits.length * elapsedDays(m); }
export function monthCompletion(m: MonthDoc) { const p = possibleMarks(m); return p ? Math.round((habitMarks(m) / p) * 100) : 0; }

/** Share of habits done on one day, 0–1. */
export function dayCompletion(m: MonthDoc, day: number) {
  if (!m.habits.length) return 0;
  return m.habits.filter((h) => m.habitDays[h.id]?.includes(day)).length / m.habits.length;
}

/** Completion for any calendar day across all months; null when no month or no habits. */
export function completionOn(data: LifeData, y: number, mo: number, d: number): number | null {
  const m = data.months.find((x) => x.id === monthId(y, mo));
  if (!m || !m.habits.length) return null;
  return dayCompletion(m, d);
}

/** Habit hit rate by weekday (Mon..Sun or Sun..Sat), 0–1. */
export function weekdayPattern(m: MonthDoc, hid: string, w0: 0 | 1 = 1) {
  const hits = Array(7).fill(0), seen = Array(7).fill(0);
  const marked = new Set(m.habitDays[hid] ?? []);
  for (let d = 1; d <= elapsedDays(m); d++) {
    const w = (new Date(m.year, m.month - 1, d).getDay() - w0 + 7) % 7;
    seen[w]++; if (marked.has(d)) hits[w]++;
  }
  return hits.map((h, i) => (seen[i] ? h / seen[i] : 0));
}

export function challengeProgress(m: MonthDoc) {
  if (!m.challenge) return { done: 0, missed: 0, open: 0, pct: 0 };
  const marks = Object.values(m.challenge.marks);
  const done = marks.filter((x) => x === 'done').length;
  const missed = marks.filter((x) => x === 'missed').length;
  const open = Math.max(0, Math.min(m.challenge.days, elapsedDays(m)) - done - missed);
  return { done, missed, open, pct: done + missed ? Math.round((done / (done + missed)) * 100) : 0 };
}

export function goalsProgress(m: MonthDoc) { return { done: m.goals.filter((g) => g.done).length, total: m.goals.length }; }
export function goalPercent(g: Pick<Goal, 'target' | 'current' | 'done'>) {
  if (g.done) return 100;
  if (g.target && g.target > 0 && typeof g.current === 'number') return Math.max(0, Math.min(100, Math.round((g.current / g.target) * 100)));
  return 0;
}

/** Where a numeric goal should be by today if progress were even across the month. */
export function goalPace(m: MonthDoc, g: Goal) {
  if (!g.target || g.done) return null;
  const total = daysInMonth(m.year, m.month);
  const expected = (g.target * elapsedDays(m)) / total;
  const diff = (g.current ?? 0) - expected;
  return { expected, diff, ahead: diff >= 0 };
}

export function moodAverage(m: MonthDoc) {
  const v = Object.values(m.moods ?? {});
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

export function metricSeries(m: MonthDoc, metricId: string) {
  const e = m.metricEntries[metricId] ?? {};
  return Object.keys(e).map(Number).sort((a, b) => a - b).map((day) => ({ day, value: e[String(day)] }));
}
export function latestMetricValue(m: MonthDoc, mid: string) {
  const s = metricSeries(m, mid);
  return s.length ? s[s.length - 1] : null;
}
const ADDITIVE_UNITS = ['km', 'pages', '₹', 'hours', 'min', 'sessions'];
/** Units that add up over a month (km run), vs. readings where the latest value matters (kg, hours slept). */
export function isAdditive(unit: string, name = '') { return ADDITIVE_UNITS.includes(unit) && !/sleep/i.test(name); }

export function sortedMonths(d: LifeData) { return [...d.months].sort((a, b) => (a.id < b.id ? 1 : -1)); }
export function monthsOfYear(d: LifeData, y: number) { return sortedMonths(d).filter((m) => m.year === y); }

export interface YearFigures {
  monthsDocumented: number; daysDocumented: number; habitMarks: number; goalsCompleted: number; goalsSet: number;
  challengesAttempted: number; challengesHeld: number; bestMonth: MonthDoc | null;
}
export function yearFigures(d: LifeData, y: number): YearFigures {
  const ms = monthsOfYear(d, y);
  let hm = 0, gc = 0, gs = 0, ca = 0, ch = 0, dd = 0;
  let bestMonth: MonthDoc | null = null;
  for (const m of ms) {
    hm += habitMarks(m); gc += m.goals.filter((g) => g.done).length; gs += m.goals.length; dd += documentedDays(m);
    if (m.challenge) { ca++; if (challengeProgress(m).pct >= 80) ch++; }
    if (!bestMonth || monthCompletion(m) > monthCompletion(bestMonth)) bestMonth = m;
  }
  return { monthsDocumented: ms.length, daysDocumented: dd, habitMarks: hm, goalsCompleted: gc, goalsSet: gs, challengesAttempted: ca, challengesHeld: ch, bestMonth };
}

/** Highlights from the same day number in earlier months — "on this day". */
export function onThisDay(d: LifeData) {
  const t = todayParts();
  return sortedMonths(d)
    .filter((m) => !(m.year === t.year && m.month === t.month))
    .map((m) => ({ month: m, text: m.highlights[String(t.day)] }))
    .filter((x): x is { month: MonthDoc; text: string } => !!x.text?.trim())
    .slice(0, 3);
}
