import { LifeData, SCHEMA_VERSION } from './types';
export const STORAGE_KEY = 'max-workspace-v1';
export function emptyData(): LifeData {
  const now = new Date().toISOString();
  return { version: SCHEMA_VERSION, createdAt: now, updatedAt: now, settings: { name: '', weekStartsOn: 1 }, months: [], yearReviews: {}, captures: [] };
}
function normalize(d: LifeData): LifeData {
  return { ...emptyData(), ...d, settings: { name: d.settings?.name ?? '', weekStartsOn: d.settings?.weekStartsOn ?? 1 }, months: Array.isArray(d.months) ? d.months : [], yearReviews: d.yearReviews ?? {}, captures: Array.isArray(d.captures) ? d.captures : [] };
}
export function isLifeData(v: unknown): v is LifeData { if (!v || typeof v !== 'object') return false; const d = v as Partial<LifeData>; return d.version === SCHEMA_VERSION && Array.isArray(d.months); }
export function loadData(): LifeData | null {
  if (typeof window === 'undefined') return null;
  try { const r = window.localStorage.getItem(STORAGE_KEY); if (!r) return null; const p = JSON.parse(r); if (!isLifeData(p)) return null; return normalize(p); } catch { return null; }
}
export function saveData(d: LifeData) { if (typeof window !== 'undefined') try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
export function clearData() { if (typeof window !== 'undefined') try { window.localStorage.removeItem(STORAGE_KEY); } catch {} }
export function exportFileName() { const d = new Date(); return `max-workspace-backup-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`; }
export function downloadJson(d: LifeData) { const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = exportFileName(); a.click(); URL.revokeObjectURL(u); }
