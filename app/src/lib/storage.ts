import { SCHEMA_VERSION, type LifeData, type MonthDoc } from './types';

export const STORAGE_KEY = 'max-workspace-v1';

export function emptyData(): LifeData {
  const now = new Date().toISOString();
  return { version: SCHEMA_VERSION, createdAt: now, updatedAt: now, settings: { name: '', weekStartsOn: 1 }, months: [], yearReviews: {}, captures: [] };
}

/** Fill fields added after a month was first saved, so old data never crashes a screen. */
export function normalizeMonth(m: MonthDoc): MonthDoc {
  return {
    ...m,
    habits: m.habits ?? [],
    habitDays: m.habitDays ?? {},
    goals: (m.goals ?? []).map((g) => ({ ...g, log: g.log ?? [] })),
    challenge: m.challenge ?? null,
    highlights: m.highlights ?? {},
    reflections: m.reflections ?? [],
    metrics: m.metrics ?? [],
    metricEntries: m.metricEntries ?? {},
    moods: m.moods ?? {},
    review: m.review ?? null,
  };
}

export function normalize(d: LifeData): LifeData {
  return {
    ...emptyData(),
    ...d,
    settings: { name: d.settings?.name ?? '', weekStartsOn: d.settings?.weekStartsOn ?? 1 },
    months: Array.isArray(d.months) ? d.months.map(normalizeMonth) : [],
    yearReviews: d.yearReviews ?? {},
    captures: Array.isArray(d.captures) ? d.captures : [],
  };
}

export function isLifeData(v: unknown): v is LifeData {
  if (!v || typeof v !== 'object') return false;
  const d = v as Partial<LifeData>;
  return d.version === SCHEMA_VERSION && Array.isArray(d.months);
}

export function loadData(): LifeData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isLifeData(parsed) ? normalize(parsed) : null;
  } catch { return null; }
}

export function saveData(d: LifeData) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
}

export function clearData() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function downloadJson(d: LifeData) {
  const now = new Date();
  const name = `max-workspace-backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
