export type ChallengeMark = 'done' | 'missed';

export interface Habit { id: string; name: string; order: number; }

export type GoalArea = 'Body' | 'Mind' | 'Work' | 'Money' | 'People';
export const GOAL_AREAS: GoalArea[] = ['Body', 'Mind', 'Work', 'Money', 'People'];

export interface GoalStep { at: string; value: number; }
export interface Goal {
  id: string;
  text: string;
  target?: number;
  current?: number;
  unit?: string;
  done: boolean;
  order: number;
  area?: GoalArea;
  /** progress history, newest last */
  log?: GoalStep[];
  /** month id this goal was carried over from */
  carriedFrom?: string;
}

export interface Challenge { id: string; title: string; days: number; marks: Record<number, ChallengeMark>; }
export type ReflectionKind = 'weekly' | 'monthly' | 'free';
export interface Reflection { id: string; date: string; kind: ReflectionKind; prompt?: string; text: string; }
export interface Metric { id: string; name: string; unit: string; order: number; }
export interface MonthReview { answers: { q: string; a: string }[]; completedAt: string; }

/** 1 = rough · 5 = great */
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface MonthDoc {
  id: string; year: number; month: number; createdAt: string;
  habits: Habit[]; habitDays: Record<string, number[]>;
  goals: Goal[]; challenge: Challenge | null;
  highlights: Record<string, string>; reflections: Reflection[];
  metrics: Metric[]; metricEntries: Record<string, Record<string, number>>;
  moods: Record<string, Mood>;
  review: MonthReview | null;
}

export interface Settings { name: string; weekStartsOn: 0 | 1; }
export interface YearReview { year: number; answers: { q: string; a: string }[]; favoriteMoments: string[]; completedAt: string; }

export type CaptureType = 'Highlight' | 'Idea' | 'Lesson' | 'Memory' | 'Goal' | 'Observation';
export const CAPTURE_TYPES: CaptureType[] = ['Highlight', 'Idea', 'Lesson', 'Memory', 'Goal', 'Observation'];
export interface Capture { id: string; text: string; type: CaptureType; createdAt: string; }

export interface LifeData {
  version: number; createdAt: string; updatedAt: string;
  settings: Settings; months: MonthDoc[]; yearReviews: Record<string, YearReview>; captures: Capture[];
}

export const SCHEMA_VERSION = 1;

export const MONTH_REVIEW_QUESTIONS = [
  'What changed?',
  'What worked?',
  "What didn't?",
  'What did I learn?',
  'What do I carry into next month?',
] as const;

export const YEAR_REVIEW_QUESTIONS = [
  'What changed most this year?',
  'What did I get better at?',
  'What did I stop doing?',
  'Which moments do I want to remember?',
  'What am I proud I kept doing?',
] as const;

export const MOOD_LABELS: Record<Mood, string> = { 1: 'Rough', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
