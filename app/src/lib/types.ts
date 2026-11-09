export type ChallengeMark = 'done' | 'missed';

export interface Habit { id: string; name: string; order: number; }
export interface Goal { id: string; text: string; target?: number; current?: number; unit?: string; done: boolean; order: number; }
export interface Challenge { id: string; title: string; days: number; marks: Record<number, ChallengeMark>; }
export type ReflectionKind = 'weekly' | 'monthly' | 'free';
export interface Reflection { id: string; date: string; kind: ReflectionKind; prompt?: string; text: string; }
export interface Metric { id: string; name: string; unit: string; order: number; }
export interface MonthReview { answers: { q: string; a: string }[]; completedAt: string; }
export interface MonthDoc {
  id: string; year: number; month: number; createdAt: string;
  habits: Habit[]; habitDays: Record<string, number[]>;
  goals: Goal[]; challenge: Challenge | null;
  highlights: Record<string, string>; reflections: Reflection[];
  metrics: Metric[]; metricEntries: Record<string, Record<string, number>>;
  review: MonthReview | null;
}
export interface Settings { name: string; weekStartsOn: 0 | 1; }
export interface YearReview { year: number; answers: { q: string; a: string }[]; favoriteMoments: string[]; completedAt: string; }
export interface LifeData {
  version: number; createdAt: string; updatedAt: string;
  settings: Settings; months: MonthDoc[]; yearReviews: Record<string, YearReview>; captures: Capture[];
}
export interface Capture { id: string; text: string; type: CaptureType; createdAt: string; }
export type CaptureType = 'Highlight' | 'Idea' | 'Lesson' | 'Memory' | 'Goal' | 'Observation';
export const CAPTURE_TYPES: CaptureType[] = ['Highlight', 'Idea', 'Lesson', 'Memory', 'Goal', 'Observation'];
export const SCHEMA_VERSION = 1;
export const MONTH_REVIEW_QUESTIONS = ["What changed?", "What worked?", "What didn't?", "What did I learn?", "What do I want to carry into next month?"] as const;
export const YEAR_REVIEW_QUESTIONS = ['What changed most this year?', 'What did you become better at?', 'What did you stop doing?', 'What moments do you want to remember?', 'What are you proud that you continued?'] as const;
