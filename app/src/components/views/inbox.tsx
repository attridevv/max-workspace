'use client';

import { useState } from 'react';
import { useLife, type FileTarget } from '@/lib/store';
import { relativeTime } from '@/lib/dates';
import { CAPTURE_TYPES, type CaptureType } from '@/lib/types';
import { Button, EmptyState, PageHead, Panel, Pill, Tag } from '@/components/ui/kit';
import { useCapture } from '@/components/shell/quick-capture';

const FILED: Record<FileTarget, string> = { highlight: 'Added to today’s line', goal: 'Added to this month’s goals', reflection: 'Kept as a reflection' };

export function InboxView() {
  const { data, actions } = useLife();
  const { open, toast } = useCapture();
  const [filter, setFilter] = useState<CaptureType | 'All'>('All');
  if (!data) return null;
  const caps = data.captures.filter((c) => filter === 'All' || c.type === filter);
  const types = CAPTURE_TYPES.filter((t) => data.captures.some((c) => c.type === t));

  function file(id: string, to: FileTarget) { actions.fileCapture(id, to); toast(FILED[to]); }

  return (
    <div className="rise">
      <PageHead kicker="Today" title="Inbox"
        caption="Ideas, lessons and memories you caught on the go. Move each one somewhere, or let it go."
        right={<Button onClick={() => open('Idea')}>＋ Capture</Button>} />

      {types.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          <Pill active={filter === 'All'} onClick={() => setFilter('All')}>All · {data.captures.length}</Pill>
          {types.map((t) => <Pill key={t} active={filter === t} onClick={() => setFilter(t)}>{t} · {data.captures.filter((c) => c.type === t).length}</Pill>)}
        </div>
      )}

      {caps.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {caps.map((c, i) => (
            <Panel key={c.id} className="rise flex flex-col" >
              <div className="flex items-center justify-between gap-3 px-5 pt-4" style={{ animationDelay: `${i * 30}ms` }}>
                <Tag>{c.type}</Tag>
                <span className="font-mono text-[10px] text-ink-4">{relativeTime(c.createdAt)}</span>
              </div>
              <p className="hand flex-1 px-5 pt-2 pb-4 text-[1.5rem] leading-snug text-ink">{c.text}</p>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-3">
                <span className="mr-1 text-xs text-ink-4">Move to</span>
                <Button size="sm" variant="outline" onClick={() => file(c.id, 'highlight')}>Today’s line</Button>
                <Button size="sm" variant="outline" onClick={() => file(c.id, 'goal')}>Goals</Button>
                <Button size="sm" variant="outline" onClick={() => file(c.id, 'reflection')}>Reflections</Button>
                <button type="button" onClick={() => { actions.removeCapture(c.id); toast('Let go'); }} className="ml-auto text-xs text-ink-4 hover:text-pen">let go</button>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel dotted>
          <EmptyState hint="Press ⌘K anywhere (or the + button on your phone) to catch a thought. Highlights and goals file themselves; the rest wait here."
            action={<Button variant="outline" onClick={() => open('Idea')}>Capture something</Button>}>
            Inbox empty. Head clear.
          </EmptyState>
        </Panel>
      )}
    </div>
  );
}
