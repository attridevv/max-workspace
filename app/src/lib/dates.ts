const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function monthId(y: number, m: number) { return `${y}-${String(m).padStart(2, '0')}`; }
export function parseMonthId(id: string) { const [y, m] = id.split('-').map(Number); return { year: y, month: m }; }
export function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
export function monthName(m: number) { return MONTHS[m - 1]; }
export function monthShort(m: number) { return SHORT[m - 1]; }
export function monthLabel(y: number, m: number) { return `${monthName(m)} ${y}`; }
export function dayOfWeek(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }
export function weekdayShort(w: number) { return WEEKDAYS[w]; }
/** leading nulls so day 1 lands on the right weekday column */
export function monthGrid(y: number, m: number, w0: 0 | 1 = 1) {
  const total = daysInMonth(y, m);
  const lead = (dayOfWeek(y, m, 1) - w0 + 7) % 7;
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 1; i <= total; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function weekdayHeaders(w0: 0 | 1 = 1) { return Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + w0) % 7]); }
export function todayParts() { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() }; }
export function todayMonthId() { const { year, month } = todayParts(); return monthId(year, month); }
export function isToday(y: number, m: number, d: number) { const t = todayParts(); return t.year === y && t.month === m && t.day === d; }
export function isFuture(y: number, m: number, d: number) {
  const t = todayParts();
  return new Date(y, m - 1, d).getTime() > new Date(t.year, t.month - 1, t.day).getTime();
}
export function formatLongDate(y: number, m: number, d: number) { return `${d} ${monthName(m)} ${y}`; }
export function formatShortDate(y: number, m: number, d: number) { return `${d} ${SHORT[m - 1]}`; }
export function formatDayLine(y: number, m: number, d: number) { return `${WEEKDAYS[dayOfWeek(y, m, d)]}, ${d} ${SHORT[m - 1]}`; }
export function isWeekend(y: number, m: number, d: number) { const w = dayOfWeek(y, m, d); return w === 0 || w === 6; }
export function nextMonth(y: number, m: number) { return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 }; }
export function prevMonth(y: number, m: number) { return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 }; }
export function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${SHORT[d.getMonth()]} · ${d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}
export function relativeTime(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
export function todayIsoDate() { const { year, month, day } = todayParts(); return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
/** Walk back n days from a date (inclusive), oldest first */
export function lastNDays(n: number, from = todayParts()) {
  const out: { year: number; month: number; day: number }[] = [];
  const base = new Date(from.year, from.month - 1, from.day);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  }
  return out;
}
export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
