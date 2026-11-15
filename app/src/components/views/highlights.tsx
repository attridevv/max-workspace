'use client';

import { useState } from 'react';
import { useLife } from '@/lib/store';
import { dayOfWeek, isFuture, monthGrid, monthLabel, todayParts, weekdayHeaders, weekdayShort } from '@/lib/dates';
import { documentedDays, elapsedDays } from '@/lib/stats';
import type { MonthDoc } from '@/lib/types';
import { PageHead, Panel, PanelHead } from '@/components/ui/kit';
import { HeatLegend, moodColor } from '@/components/ui/charts';
import { cn } from '@/lib/utils';
import { MonthTabs, useMonthPicker } from './shared';

export function HighlightsView() {
  const { data } = useLife();
  const { months, month, setId } = useMonthPicker();
  const [focus, setFocus] = useState<number | null>(null);
  if (!month || !data) return <PageHead title="Highlights" caption="Open a month first." />;
  const elapsed = elapsedDays(month);
  const written = documentedDays(month);
  const w0 = data.settings.weekStartsOn;
  const days = Array.from({ length: elapsed }, (_, i) => elapsed - i);

  function jump(d: number) {
    setFocus(d);
    document.getElementById(`day-${d}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="rise">
      <PageHead kicker={monthLabel(month.year, month.month)} title="Highlights" caption={`One line a day. ${written} of ${elapsed || 0} days written so far.`} />
      <MonthTabs months={months} id={month.id} setId={setId} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
        <Panel className="lg:sticky lg:top-20">
          <PanelHead label="Mood × lines" right={<HeatLegend mood />} />
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {weekdayHeaders(w0).map((h) => <span key={h} className="text-center font-mono text-[10px] text-ink-4 uppercase">{h.slice(0, 2)}</span>)}
              {monthGrid(month.year, month.month, w0).map((d, i) => {
                if (d === null) return <span key={i} />;
                const mood = month.moods?.[String(d)];
                const has = !!month.highlights[String(d)];
                const future = d > elapsed;
                return (
                  <button key={i} type="button" disabled={future} onClick={() => jump(d)} aria-label={`Day ${d}`}
                    className={cn('relative grid aspect-square place-items-center rounded-[5px] border font-mono text-[10px] disabled:opacity-40',
                      mood ? 'border-transparent' : 'border-line', focus === d && 'ring-2 ring-ink')}
                    style={{ background: mood ? moodColor(mood) : undefined }}>
                    <span className={cn(mood && mood >= 4 ? 'text-paper' : 'text-ink-3')}>{d}</span>
                    {has && <span className="absolute bottom-1 h-[2px] w-3 rounded bg-ink/70" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-4">Colour = how the day felt. Underline = a line was written. Tap to jump.</p>
          </div>
        </Panel>

        <Panel className="margin-line">
          <PanelHead label="The month, one line at a time" className="bg-card" />
          {days.length ? (
            <ul>
              {days.map((d) => <LineRow key={`${month.id}-${d}-${month.highlights[String(d)] ?? ''}`} month={month} day={d} focused={focus === d} />)}
            </ul>
          ) : <p className="hand px-12 py-10 text-[1.4rem] text-ink-3">This month hasn’t started yet.</p>}
        </Panel>
      </div>
    </div>
  );
}

function LineRow({ month, day, focused }: { month: MonthDoc; day: number; focused: boolean }) {
  const { actions } = useLife();
  const saved = month.highlights[String(day)] ?? '';
  const [value, setValue] = useState(saved);
  const t = todayParts();
  const isToday = month.year === t.year && month.month === t.month && day === t.day;
  const mood = month.moods?.[String(day)];
  const commit = () => { if (value.trim() !== saved.trim()) actions.setHighlight(month.id, day, value); };
  if (isFuture(month.year, month.month, day)) return null;
  return (
    <li id={`day-${day}`} className={cn('group relative flex min-h-[64px] items-start gap-3 py-[14px] pr-5 pl-3 transition-colors', focused && 'bg-tape/25')}>
      <span className="w-9 shrink-0 pt-1 text-right">
        <span className="block font-mono text-[11px] leading-none text-ink-2 tnum">{day}</span>
        <span className="block font-mono text-[9px] text-ink-4 uppercase">{weekdayShort(dayOfWeek(month.year, month.month, day)).slice(0, 2)}</span>
      </span>
      <textarea rows={1} value={value} onChange={(e) => setValue(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
        placeholder={isToday ? 'Today — what’s the line?' : 'nothing written'}
        aria-label={`Line for day ${day}`}
        className={cn('hand min-h-[34px] flex-1 resize-none bg-transparent pl-2 text-[1.5rem] leading-[32px] focus:outline-none', !value && 'placeholder:text-[1.25rem] placeholder:text-ink-4/70')} />
      {mood && <span className="mt-3 size-2.5 shrink-0 rounded-full" style={{ background: moodColor(mood) }} title="mood" />}
    </li>
  );
}
