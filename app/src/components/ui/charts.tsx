'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* One hue per job, light → dark. Habits = sage (how much got done). Mood = ochre (how it felt). */
export const SAGE_STEPS = ['var(--color-heat-0)', 'var(--color-heat-1)', 'var(--color-heat-2)', 'var(--color-heat-3)', 'var(--color-heat-4)'];
export const MOOD_STEPS = ['var(--color-mood-1)', 'var(--color-mood-2)', 'var(--color-mood-3)', 'var(--color-mood-4)', 'var(--color-mood-5)'];

export function heatColor(v: number | null | undefined) {
  if (v === null || v === undefined) return 'transparent';
  if (v <= 0) return SAGE_STEPS[0];
  return SAGE_STEPS[Math.min(4, Math.max(1, Math.ceil(v * 4)))];
}
export function moodColor(v: number | null | undefined) {
  if (!v) return 'transparent';
  return MOOD_STEPS[Math.min(5, Math.max(1, Math.round(v))) - 1];
}

/* ── Ring ───────────────────────────────────────────── */
export function Ring({ pct, size = 112, stroke = 9, children, label }: { pct: number; size?: number; stroke?: number; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(p)} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        {p > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sage-deep)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-700 ease-out" />}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ── Sparkline ──────────────────────────────────────── */
export function Sparkline({ values, width = 120, height = 32, className }: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return <svg width={width} height={height} className={className} aria-hidden="true" />;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / span) * (height - 6)] as const);
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--color-sage-deep)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill="var(--color-sage-deep)" stroke="var(--color-card)" strokeWidth={2} />
    </svg>
  );
}

/* ── Line chart with crosshair + tooltip ───────────── */
export function LineChart({ points, xMax, unit, height = 180, xLabel = (x: number) => String(x), goal }: {
  points: { x: number; y: number }[]; xMax: number; unit: string; height?: number; xLabel?: (x: number) => string; goal?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, padL = 40, padR = 28, padT = 12, padB = 24;
  const ys = points.map((p) => p.y).concat(goal !== undefined ? [goal] : []);
  const rawMin = ys.length ? Math.min(...ys) : 0, rawMax = ys.length ? Math.max(...ys) : 1;
  const pad = (rawMax - rawMin) * 0.15 || Math.max(1, rawMax * 0.1);
  const min = Math.max(0, rawMin - pad), max = rawMax + pad;
  const sx = (x: number) => padL + ((x - 1) / Math.max(1, xMax - 1)) * (W - padL - padR);
  const sy = (y: number) => padT + (1 - (y - min) / (max - min || 1)) * (H - padT - padB);
  const ticks = [min, (min + max) / 2, max];
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.abs(v) >= 100 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString());
  const hp = hover !== null ? points[hover] : null;
  const gid = useId();

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    points.forEach((p, i) => { const d = Math.abs(sx(p.x) - x); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  }

  if (!points.length) return <div className="grid place-items-center text-sm text-ink-4" style={{ height }}>No entries yet. Log one below.</div>;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.y)}`).join(' ');
  const area = `${path} L${sx(points[points.length - 1].x)},${H - padB} L${sx(points[0].x)},${H - padB} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`Line chart, ${points.length} entries`}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--color-sage)" stopOpacity="0.22" /><stop offset="1" stopColor="var(--color-sage)" stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t, i) => <g key={i}><line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke="var(--color-line)" strokeDasharray={i === 0 ? undefined : '2 4'} /><text x={padL - 8} y={sy(t) + 3} textAnchor="end" className="fill-ink-4 font-mono text-[10px]">{fmt(t)}</text></g>)}
        {[1, Math.ceil(xMax / 2), xMax].map((x, i) => <text key={x} x={sx(x)} y={H - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} className="fill-ink-4 font-mono text-[10px]">{xLabel(x)}</text>)}
        {goal !== undefined && <g><line x1={padL} x2={W - padR} y1={sy(goal)} y2={sy(goal)} stroke="var(--color-pen)" strokeDasharray="5 4" /><text x={W - padR} y={sy(goal) - 5} textAnchor="end" className="fill-pen font-mono text-[10px]">target {fmt(goal)}</text></g>}
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} fill="none" stroke="var(--color-sage-deep)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.length <= 31 && points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={hover === i ? 5 : 3} fill="var(--color-sage-deep)" stroke="var(--color-card)" strokeWidth={2} />)}
        {hp && <line x1={sx(hp.x)} x2={sx(hp.x)} y1={padT} y2={H - padB} stroke="var(--color-ink-3)" strokeWidth={1} />}
      </svg>
      {hp && (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-line bg-card px-2.5 py-1.5 text-xs shadow-md" style={{ left: `${(sx(hp.x) / W) * 100}%` }}>
          <span className="label-mono text-ink-4">{xLabel(hp.x)}</span> <span className="font-medium tnum">{fmt(hp.y)} {unit}</span>
        </div>
      )}
    </div>
  );
}

/* ── Day bars: one bar per day, height = share done ── */
export function DayBars({ values, labels, height = 96, highlight, onPick }: {
  values: (number | null)[]; labels: string[]; height?: number; highlight?: number; onPick?: (i: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const show = hover ?? highlight ?? null;
  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }} onPointerLeave={() => setHover(null)}>
        {values.map((v, i) => (
          <button key={i} type="button" onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => onPick?.(i)}
            aria-label={`${labels[i]}: ${v === null ? 'not yet' : `${Math.round(v * 100)}%`}`}
            className="group relative flex h-full flex-1 items-end justify-center">
            <span className={cn('block w-full max-w-[18px] rounded-t-[4px] transition-[height,background] duration-500',
              v === null ? 'border border-dashed border-line-2 bg-transparent' : '')}
              style={{ height: v === null ? 6 : `${Math.max(4, v * 100)}%`, background: v === null ? undefined : i === show ? 'var(--color-ink)' : heatColor(Math.max(v, 0.01)) }} />
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-line pt-2">
        <span className="label-mono text-ink-4">{show !== null ? labels[show] : 'Hover a day'}</span>
        <span className="font-mono text-[11px] text-ink-2 tnum">{show !== null ? (values[show] === null ? '—' : `${Math.round((values[show] ?? 0) * 100)}% of habits`) : ''}</span>
      </div>
    </div>
  );
}

/* ── Calendar heat grid (one month) ────────────────── */
export function CalendarHeat({ cells, headers, value, mood, selected, onPick, render, today }: {
  cells: (number | null)[]; headers: string[];
  value: (d: number) => number | null;
  mood?: (d: number) => number | null;
  selected?: number; today?: number;
  onPick?: (d: number) => void;
  render?: (d: number) => ReactNode;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {headers.map((h) => <span key={h} className="pb-1 text-center font-mono text-[10px] tracking-[0.12em] text-ink-4 uppercase">{h.slice(0, 2)}</span>)}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const v = value(d);
          const mv = mood?.(d) ?? null;
          return (
            <button key={i} type="button" onClick={() => onPick?.(d)}
              aria-label={`Day ${d}${v === null ? '' : `, ${Math.round(v * 100)}% of habits`}`}
              aria-pressed={selected === d}
              className={cn('relative flex aspect-square min-h-9 flex-col items-start justify-between overflow-hidden rounded-[5px] border p-1 text-left transition-transform hover:-translate-y-px',
                v === null ? 'border-dashed border-line-2' : 'border-transparent',
                selected === d && 'ring-2 ring-ink ring-offset-1 ring-offset-card')}
              style={{ background: heatColor(v) }}>
              <span className={cn('font-mono text-[10px] leading-none', v !== null && v > 0.6 ? 'text-paper' : 'text-ink-3', today === d && 'rounded-sm bg-ink px-1 py-0.5 text-paper')}>{d}</span>
              {mv ? <span className="absolute right-1 bottom-1 size-2 rounded-full ring-2 ring-card" style={{ background: moodColor(mv) }} /> : null}
              {render?.(d)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Year heatmap (GitHub-style, weeks as columns) ─── */
export function YearHeat({ year, value, w0 = 1 }: { year: number; value: (m: number, d: number) => number | null; w0?: 0 | 1 }) {
  const [hover, setHover] = useState<{ m: number; d: number; v: number | null } | null>(null);
  const weeks = useMemo(() => {
    const out: ({ m: number; d: number } | null)[][] = [];
    const start = new Date(year, 0, 1);
    const lead = (start.getDay() - w0 + 7) % 7;
    let col: ({ m: number; d: number } | null)[] = Array.from({ length: lead }, () => null);
    for (let dt = new Date(start); dt.getFullYear() === year; dt.setDate(dt.getDate() + 1)) {
      col.push({ m: dt.getMonth() + 1, d: dt.getDate() });
      if (col.length === 7) { out.push(col); col = []; }
    }
    if (col.length) { while (col.length < 7) col.push(null); out.push(col); }
    return out;
  }, [year, w0]);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full flex-col gap-1">
          <div className="flex gap-[3px] pl-0">
            {weeks.map((w, i) => {
              const starts = w.find((c) => c?.d === 1);
              return <span key={i} className="w-[11px] shrink-0 overflow-visible font-mono text-[9px] whitespace-nowrap text-ink-4">{starts ? MON[starts.m - 1] : ''}</span>;
            })}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((w, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {w.map((c, j) => {
                  if (!c) return <span key={j} className="size-[11px]" />;
                  const v = value(c.m, c.d);
                  return <span key={j} onPointerEnter={() => setHover({ ...c, v })}
                    className={cn('size-[11px] rounded-[2px]', v === null && 'border border-line')}
                    style={{ background: v === null ? 'transparent' : heatColor(v) }} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-ink-3">
          {hover ? `${hover.d} ${MON[hover.m - 1]} · ${hover.v === null ? 'no page' : `${Math.round(hover.v * 100)}% of habits`}` : 'Hover a square'}
        </span>
        <HeatLegend />
      </div>
    </div>
  );
}

export function HeatLegend({ mood = false }: { mood?: boolean }) {
  const steps = mood ? MOOD_STEPS : SAGE_STEPS;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-4">
      {mood ? 'Rough' : 'Less'}
      {steps.map((c, i) => <span key={i} className="size-[11px] rounded-[2px]" style={{ background: c }} />)}
      {mood ? 'Great' : 'More'}
    </span>
  );
}

/* ── Weekday pattern: 7 small bars ─────────────────── */
export function WeekdayBars({ values, headers }: { values: number[]; headers: string[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1" title={`${headers[i]}: ${Math.round(v * 100)}%`}>
          <div className="flex h-10 w-4 items-end"><span className="block w-full rounded-t-[3px]" style={{ height: `${Math.max(6, v * 100)}%`, background: v === max && v > 0 ? 'var(--color-sage-deep)' : 'var(--color-heat-2)' }} /></div>
          <span className="font-mono text-[9px] text-ink-4">{headers[i].slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Segmented progress for goals ──────────────────── */
export function Meter({ pct, pace, className }: { pct: number; pace?: number; className?: string }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn('relative h-2 w-full rounded-full bg-paper-3', className)}>
      <div className="h-full rounded-full bg-sage-deep transition-[width] duration-700 ease-out" style={{ width: `${p}%` }} />
      {pace !== undefined && pace > 0 && pace < 100 && (
        <span className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 rounded bg-pen" style={{ left: `${pace}%` }} title="Where even pace would be today" />
      )}
    </div>
  );
}
