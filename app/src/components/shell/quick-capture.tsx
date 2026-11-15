'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CAPTURE_TYPES, type CaptureType } from '@/lib/types';
import { useLife } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kit';

const WHERE: Record<CaptureType, string> = {
  Highlight: 'Goes on today’s page',
  Goal: 'Added to this month’s goals',
  Idea: 'Waits in your inbox',
  Lesson: 'Waits in your inbox',
  Memory: 'Waits in your inbox',
  Observation: 'Waits in your inbox',
};
const DONE: Record<CaptureType, string> = {
  Highlight: 'Written on today’s page',
  Goal: 'Added to this month’s goals',
  Idea: 'Saved to your inbox',
  Lesson: 'Saved to your inbox',
  Memory: 'Saved to your inbox',
  Observation: 'Saved to your inbox',
};

interface CaptureCtx { open: (type?: CaptureType) => void; toast: (msg: string) => void; }
const Ctx = createContext<CaptureCtx | null>(null);
export function useCapture() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCapture must be used inside <CaptureProvider>');
  return c;
}

/** One capture dialog for the whole app. Anything can open it; ⌘K / Ctrl+K toggles it. */
export function CaptureProvider({ children }: { children: ReactNode }) {
  const { actions } = useLife();
  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<CaptureType>('Highlight');
  const [toastMsg, setToastMsg] = useState<{ id: number; msg: string } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  const open = useCallback((t?: CaptureType) => { if (t) setType(t); setOpen(true); }, []);
  const toast = useCallback((msg: string) => setToastMsg({ id: Date.now(), msg }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((v) => !v); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const f = window.setTimeout(() => area.current?.focus(), 20);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; window.clearTimeout(f); };
  }, [isOpen]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2700);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  function save() {
    const value = text.trim();
    if (!value) return;
    actions.capture(value, type);
    setText('');
    setOpen(false);
    toast(DONE[type]);
  }

  const value = useMemo(() => ({ open, toast }), [open, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-scrim p-3 backdrop-blur-[2px] sm:items-center sm:p-5"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="capture-title"
            className="rise tape w-full max-w-[580px] rounded-[14px] border border-line bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="capture-title" className="font-display text-[1.35rem] font-[480]">Write it down before it’s gone.</h2>
                <p className="mt-0.5 text-sm text-ink-3">Pick what it is. It lands in the right place.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mt-1 -mr-1 grid size-9 place-items-center rounded-full text-xl text-ink-4 hover:bg-paper-2 hover:text-ink">×</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Capture type">
              {CAPTURE_TYPES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
                  className={cn('rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors', type === t ? 'border-ink bg-ink text-paper' : 'border-line text-ink-3 hover:border-ink-4')}>
                  {t}
                </button>
              ))}
            </div>
            <textarea ref={area} rows={3} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
              placeholder={type === 'Goal' ? 'Run 100 km this month' : type === 'Highlight' ? 'The best thing about today, in one line' : 'Whatever it is — get it out of your head'}
              className="hand mt-4 w-full resize-none rounded-[10px] border border-line bg-paper px-4 py-3 text-[1.45rem] leading-snug placeholder:font-sans placeholder:text-[0.9375rem] placeholder:text-ink-4 focus:border-sage focus:outline-none" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[0.8125rem] text-ink-3">→ {WHERE[type]}</span>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-ink-4 sm:inline"><Kbd>Enter</Kbd> to save</span>
                <button type="button" disabled={!text.trim()} onClick={save} className="h-10 rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-sage-deep disabled:opacity-40">Capture</button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {toastMsg && createPortal(
        <div key={toastMsg.id} role="status" className="toast fixed bottom-24 left-1/2 z-[110] flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-paper shadow-lg lg:bottom-8">
          <span className="text-heat-1">✓</span> {toastMsg.msg}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}

export function QuickCaptureButton({ className }: { className?: string }) {
  const { open } = useCapture();
  return (
    <button type="button" onClick={() => open()} className={cn('inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper hover:bg-sage-deep', className)}>
      <span className="text-base leading-none">＋</span> Capture
      <span className="hidden rounded border border-paper/25 px-1.5 py-0.5 font-mono text-[10px] opacity-70 sm:inline">⌘K</span>
    </button>
  );
}
