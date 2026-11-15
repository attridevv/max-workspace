'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { monthId, todayIsoDate, todayMonthId, todayParts } from './dates';
import { buildExampleMonths, parseGoalTarget, uid } from './seed';
import { clearData, emptyData, loadData, normalize, saveData } from './storage';
import type { CaptureType, ChallengeMark, Goal, GoalArea, LifeData, Mood, MonthDoc, MonthReview, ReflectionKind, YearReview } from './types';

export interface NewMonthSetup {
  year: number; month: number;
  habits: string[];
  goals: { text: string; target?: number; unit?: string; area?: GoalArea }[];
  challenge: { title: string; days: number } | null;
  metrics: { name: string; unit: string }[];
}
export interface NewGoal { text: string; target?: number; unit?: string; area?: GoalArea }
export type FileTarget = 'highlight' | 'goal' | 'reflection';

type Action =
  | { type: 'init'; data: LifeData }
  | { type: 'createMonth'; setup: NewMonthSetup }
  | { type: 'ensureMonth'; year: number; month: number }
  | { type: 'loadExample' }
  | { type: 'toggleHabitDay'; monthId: string; habitId: string; day: number }
  | { type: 'addHabit'; monthId: string; name: string }
  | { type: 'renameHabit'; monthId: string; habitId: string; name: string }
  | { type: 'removeHabit'; monthId: string; habitId: string }
  | { type: 'setHighlight'; monthId: string; day: number; text: string }
  | { type: 'setMood'; monthId: string; day: number; mood: Mood | null }
  | { type: 'addGoal'; monthId: string; goal: NewGoal }
  | { type: 'updateGoal'; monthId: string; goalId: string; patch: Partial<Omit<Goal, 'id'>> }
  | { type: 'setGoalProgress'; monthId: string; goalId: string; value: number }
  | { type: 'removeGoal'; monthId: string; goalId: string }
  | { type: 'setChallenge'; monthId: string; title: string; days: number }
  | { type: 'clearChallenge'; monthId: string }
  | { type: 'setChallengeMark'; monthId: string; day: number; mark: ChallengeMark | null }
  | { type: 'addReflection'; monthId: string; kind: ReflectionKind; text: string; prompt?: string; date?: string }
  | { type: 'removeReflection'; monthId: string; reflectionId: string }
  | { type: 'addMetric'; monthId: string; name: string; unit: string }
  | { type: 'removeMetric'; monthId: string; metricId: string }
  | { type: 'setMetricValue'; monthId: string; metricId: string; day: number; value: number | null }
  | { type: 'saveReview'; monthId: string; review: MonthReview }
  | { type: 'saveYearReview'; review: YearReview }
  | { type: 'updateSettings'; patch: Partial<LifeData['settings']> }
  | { type: 'capture'; text: string; captureType: CaptureType }
  | { type: 'fileCapture'; id: string; to: FileTarget }
  | { type: 'removeCapture'; id: string }
  | { type: 'importData'; data: LifeData }
  | { type: 'resetAll' };

const now = () => new Date().toISOString();
const touch = (d: LifeData): LifeData => ({ ...d, updatedAt: now() });
const sortMonths = (ms: MonthDoc[]) => [...ms].sort((a, b) => (a.id < b.id ? 1 : -1));

function updateMonth(d: LifeData, id: string, fn: (m: MonthDoc) => MonthDoc): LifeData {
  return touch({ ...d, months: d.months.map((m) => (m.id === id ? fn(m) : m)) });
}

function makeMonth(s: NewMonthSetup): MonthDoc {
  const habits = s.habits.map((name, order) => ({ id: uid('habit'), name, order }));
  return {
    id: monthId(s.year, s.month), year: s.year, month: s.month, createdAt: now(),
    habits, habitDays: Object.fromEntries(habits.map((h) => [h.id, []])),
    goals: s.goals.map((g, order) => {
      const parsed = g.target ? {} : parseGoalTarget(g.text);
      return { id: uid('goal'), text: g.text, target: g.target ?? parsed.target, unit: g.unit ?? parsed.unit, area: g.area, current: 0, done: false, order, log: [] };
    }),
    challenge: s.challenge ? { id: uid('challenge'), title: s.challenge.title, days: s.challenge.days, marks: {} } : null,
    highlights: {}, moods: {}, reflections: [],
    metrics: s.metrics.map((m, order) => ({ id: uid('metric'), name: m.name, unit: m.unit, order })),
    metricEntries: {}, review: null,
  };
}

/** Make sure a month exists. A new month carries habits, numbers and unfinished goals from the one before. */
function ensureMonth(d: LifeData, year: number, month: number): LifeData {
  const id = monthId(year, month);
  if (d.months.some((m) => m.id === id)) return d;
  const before = sortMonths(d.months).find((m) => m.id < id);
  const fresh = makeMonth({
    year, month,
    habits: before?.habits.map((h) => h.name) ?? ['Run', 'Reading', 'Sleep 7h+'],
    goals: [],
    challenge: null,
    metrics: before?.metrics.map((m) => ({ name: m.name, unit: m.unit })) ?? [],
  });
  if (before) {
    fresh.goals = before.goals.filter((g) => !g.done).map((g, order) => ({
      ...g, id: uid('goal'), order, current: g.target ? 0 : undefined, log: [], carriedFrom: before.id,
    }));
  }
  return touch({ ...d, months: sortMonths([...d.months, fresh]) });
}

function ensureToday(d: LifeData) {
  const t = todayParts();
  return { data: ensureMonth(d, t.year, t.month), id: monthId(t.year, t.month), day: t.day };
}

function appendHighlight(existing: string | undefined, text: string) {
  return existing?.trim() ? `${existing.trim()} · ${text}` : text;
}

function reducer(state: LifeData | null, action: Action): LifeData | null {
  if (action.type === 'init') return action.data;
  if (action.type === 'resetAll') return emptyData();
  if (action.type === 'importData') return touch(normalize(action.data));
  if (!state) return state;

  switch (action.type) {
    case 'createMonth': {
      const id = monthId(action.setup.year, action.setup.month);
      return touch({ ...state, months: sortMonths([...state.months.filter((m) => m.id !== id), makeMonth(action.setup)]) });
    }
    case 'ensureMonth':
      return ensureMonth(state, action.year, action.month);
    case 'loadExample': {
      const ex = buildExampleMonths();
      const ids = new Set(ex.map((m) => m.id));
      return touch({ ...state, months: sortMonths([...state.months.filter((m) => !ids.has(m.id)), ...ex]) });
    }
    case 'toggleHabitDay':
      return updateMonth(state, action.monthId, (m) => {
        const days = m.habitDays[action.habitId] ?? [];
        const next = days.includes(action.day) ? days.filter((x) => x !== action.day) : [...days, action.day].sort((a, b) => a - b);
        return { ...m, habitDays: { ...m.habitDays, [action.habitId]: next } };
      });
    case 'addHabit':
      return updateMonth(state, action.monthId, (m) => {
        const h = { id: uid('habit'), name: action.name, order: m.habits.length };
        return { ...m, habits: [...m.habits, h], habitDays: { ...m.habitDays, [h.id]: [] } };
      });
    case 'renameHabit':
      return updateMonth(state, action.monthId, (m) => ({ ...m, habits: m.habits.map((h) => (h.id === action.habitId ? { ...h, name: action.name } : h)) }));
    case 'removeHabit':
      return updateMonth(state, action.monthId, (m) => {
        const hd = { ...m.habitDays }; delete hd[action.habitId];
        return { ...m, habits: m.habits.filter((h) => h.id !== action.habitId), habitDays: hd };
      });
    case 'setHighlight':
      return updateMonth(state, action.monthId, (m) => {
        const hl = { ...m.highlights };
        if (action.text.trim()) hl[String(action.day)] = action.text.trim(); else delete hl[String(action.day)];
        return { ...m, highlights: hl };
      });
    case 'setMood':
      return updateMonth(state, action.monthId, (m) => {
        const moods = { ...m.moods };
        if (action.mood === null) delete moods[String(action.day)]; else moods[String(action.day)] = action.mood;
        return { ...m, moods };
      });
    case 'addGoal':
      return updateMonth(state, action.monthId, (m) => {
        const parsed = action.goal.target ? {} : parseGoalTarget(action.goal.text);
        const goal: Goal = {
          id: uid('goal'), text: action.goal.text, area: action.goal.area,
          target: action.goal.target ?? parsed.target, unit: action.goal.unit || parsed.unit,
          current: 0, done: false, order: m.goals.length, log: [],
        };
        return { ...m, goals: [...m.goals, goal] };
      });
    case 'updateGoal':
      return updateMonth(state, action.monthId, (m) => ({ ...m, goals: m.goals.map((g) => (g.id === action.goalId ? { ...g, ...action.patch } : g)) }));
    case 'setGoalProgress':
      return updateMonth(state, action.monthId, (m) => ({
        ...m,
        goals: m.goals.map((g) => {
          if (g.id !== action.goalId) return g;
          const value = Math.max(0, action.value);
          const log = [...(g.log ?? []), { at: now(), value }].slice(-60);
          return { ...g, current: value, log, done: g.target ? value >= g.target : g.done };
        }),
      }));
    case 'removeGoal':
      return updateMonth(state, action.monthId, (m) => ({ ...m, goals: m.goals.filter((g) => g.id !== action.goalId) }));
    case 'setChallenge':
      return updateMonth(state, action.monthId, (m) => ({ ...m, challenge: { id: m.challenge?.id ?? uid('challenge'), title: action.title, days: action.days, marks: m.challenge?.marks ?? {} } }));
    case 'clearChallenge':
      return updateMonth(state, action.monthId, (m) => ({ ...m, challenge: null }));
    case 'setChallengeMark':
      return updateMonth(state, action.monthId, (m) => {
        if (!m.challenge) return m;
        const marks = { ...m.challenge.marks };
        if (action.mark === null) delete marks[action.day]; else marks[action.day] = action.mark;
        return { ...m, challenge: { ...m.challenge, marks } };
      });
    case 'addReflection':
      return updateMonth(state, action.monthId, (m) => ({
        ...m, reflections: [{ id: uid('ref'), date: action.date ?? todayIsoDate(), kind: action.kind, prompt: action.prompt, text: action.text }, ...m.reflections],
      }));
    case 'removeReflection':
      return updateMonth(state, action.monthId, (m) => ({ ...m, reflections: m.reflections.filter((r) => r.id !== action.reflectionId) }));
    case 'addMetric':
      return updateMonth(state, action.monthId, (m) => ({ ...m, metrics: [...m.metrics, { id: uid('metric'), name: action.name, unit: action.unit, order: m.metrics.length }] }));
    case 'removeMetric':
      return updateMonth(state, action.monthId, (m) => {
        const me = { ...m.metricEntries }; delete me[action.metricId];
        return { ...m, metrics: m.metrics.filter((x) => x.id !== action.metricId), metricEntries: me };
      });
    case 'setMetricValue':
      return updateMonth(state, action.monthId, (m) => {
        const e = { ...(m.metricEntries[action.metricId] ?? {}) };
        if (action.value === null || Number.isNaN(action.value)) delete e[String(action.day)]; else e[String(action.day)] = action.value;
        return { ...m, metricEntries: { ...m.metricEntries, [action.metricId]: e } };
      });
    case 'saveReview':
      return updateMonth(state, action.monthId, (m) => ({ ...m, review: action.review }));
    case 'saveYearReview':
      return touch({ ...state, yearReviews: { ...state.yearReviews, [String(action.review.year)]: action.review } });
    case 'updateSettings':
      return touch({ ...state, settings: { ...state.settings, ...action.patch } });
    case 'capture': {
      // Highlights and goals go straight onto today's page. Everything else waits in the inbox.
      if (action.captureType === 'Highlight' || action.captureType === 'Goal') {
        const { data, id, day } = ensureToday(state);
        return updateMonth(data, id, (m) => action.captureType === 'Highlight'
          ? { ...m, highlights: { ...m.highlights, [String(day)]: appendHighlight(m.highlights[String(day)], action.text) } }
          : { ...m, goals: [...m.goals, { id: uid('goal'), text: action.text, ...parseGoalTarget(action.text), current: 0, done: false, order: m.goals.length, log: [] }] });
      }
      return touch({ ...state, captures: [{ id: uid('cap'), text: action.text, type: action.captureType, createdAt: now() }, ...state.captures] });
    }
    case 'fileCapture': {
      const cap = state.captures.find((c) => c.id === action.id);
      if (!cap) return state;
      const without = { ...state, captures: state.captures.filter((c) => c.id !== action.id) };
      const { data, id, day } = ensureToday(without);
      return updateMonth(data, id, (m) => {
        if (action.to === 'highlight') return { ...m, highlights: { ...m.highlights, [String(day)]: appendHighlight(m.highlights[String(day)], cap.text) } };
        if (action.to === 'goal') return { ...m, goals: [...m.goals, { id: uid('goal'), text: cap.text, ...parseGoalTarget(cap.text), current: 0, done: false, order: m.goals.length, log: [] }] };
        return { ...m, reflections: [{ id: uid('ref'), date: todayIsoDate(), kind: 'free', prompt: cap.type, text: cap.text }, ...m.reflections] };
      });
    }
    case 'removeCapture':
      return touch({ ...state, captures: state.captures.filter((c) => c.id !== action.id) });
    default:
      return state;
  }
}

function makeActions(dispatch: React.Dispatch<Action>) {
  return {
    createMonth: (setup: NewMonthSetup) => dispatch({ type: 'createMonth', setup }),
    ensureMonth: (year: number, month: number) => dispatch({ type: 'ensureMonth', year, month }),
    loadExample: () => dispatch({ type: 'loadExample' }),
    toggleHabitDay: (monthId: string, habitId: string, day: number) => dispatch({ type: 'toggleHabitDay', monthId, habitId, day }),
    addHabit: (monthId: string, name: string) => dispatch({ type: 'addHabit', monthId, name }),
    renameHabit: (monthId: string, habitId: string, name: string) => dispatch({ type: 'renameHabit', monthId, habitId, name }),
    removeHabit: (monthId: string, habitId: string) => dispatch({ type: 'removeHabit', monthId, habitId }),
    setHighlight: (monthId: string, day: number, text: string) => dispatch({ type: 'setHighlight', monthId, day, text }),
    setMood: (monthId: string, day: number, mood: Mood | null) => dispatch({ type: 'setMood', monthId, day, mood }),
    addGoal: (monthId: string, goal: NewGoal) => dispatch({ type: 'addGoal', monthId, goal }),
    updateGoal: (monthId: string, goalId: string, patch: Partial<Omit<Goal, 'id'>>) => dispatch({ type: 'updateGoal', monthId, goalId, patch }),
    setGoalProgress: (monthId: string, goalId: string, value: number) => dispatch({ type: 'setGoalProgress', monthId, goalId, value }),
    removeGoal: (monthId: string, goalId: string) => dispatch({ type: 'removeGoal', monthId, goalId }),
    setChallenge: (monthId: string, title: string, days: number) => dispatch({ type: 'setChallenge', monthId, title, days }),
    clearChallenge: (monthId: string) => dispatch({ type: 'clearChallenge', monthId }),
    setChallengeMark: (monthId: string, day: number, mark: ChallengeMark | null) => dispatch({ type: 'setChallengeMark', monthId, day, mark }),
    addReflection: (monthId: string, kind: ReflectionKind, text: string, prompt?: string, date?: string) => dispatch({ type: 'addReflection', monthId, kind, text, prompt, date }),
    removeReflection: (monthId: string, reflectionId: string) => dispatch({ type: 'removeReflection', monthId, reflectionId }),
    addMetric: (monthId: string, name: string, unit: string) => dispatch({ type: 'addMetric', monthId, name, unit }),
    removeMetric: (monthId: string, metricId: string) => dispatch({ type: 'removeMetric', monthId, metricId }),
    setMetricValue: (monthId: string, metricId: string, day: number, value: number | null) => dispatch({ type: 'setMetricValue', monthId, metricId, day, value }),
    saveReview: (monthId: string, review: MonthReview) => dispatch({ type: 'saveReview', monthId, review }),
    saveYearReview: (review: YearReview) => dispatch({ type: 'saveYearReview', review }),
    updateSettings: (patch: Partial<LifeData['settings']>) => dispatch({ type: 'updateSettings', patch }),
    capture: (text: string, captureType: CaptureType) => dispatch({ type: 'capture', text, captureType }),
    fileCapture: (id: string, to: FileTarget) => dispatch({ type: 'fileCapture', id, to }),
    removeCapture: (id: string) => dispatch({ type: 'removeCapture', id }),
    importData: (data: LifeData) => dispatch({ type: 'importData', data }),
    resetAll: () => { clearData(); dispatch({ type: 'resetAll' }); },
  };
}
export type LifeActions = ReturnType<typeof makeActions>;

interface LifeContextValue { data: LifeData | null; hydrated: boolean; todayMonth: MonthDoc | null; actions: LifeActions; }
const LifeContext = createContext<LifeContextValue | null>(null);

export function LifeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null);
  const [hydrated, setHydrated] = useState(false);
  const actions = useMemo(() => makeActions(dispatch), []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      let data = loadData() ?? emptyData();
      // a new month opens itself: carry habits and unfinished goals forward
      if (data.months.length) data = ensureToday(data).data;
      dispatch({ type: 'init', data });
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => { if (hydrated && state) saveData(state); }, [state, hydrated]);

  const todayMonth = useMemo(() => state?.months.find((m) => m.id === todayMonthId()) ?? null, [state]);
  const value = useMemo(() => ({ data: state, hydrated, todayMonth, actions }), [state, hydrated, todayMonth, actions]);
  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>;
}

export function useLife() {
  const ctx = useContext(LifeContext);
  if (!ctx) throw new Error('useLife must be used inside <LifeProvider>');
  return ctx;
}
