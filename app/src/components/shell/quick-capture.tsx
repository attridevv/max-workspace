'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CAPTURE_TYPES, type CaptureType } from '@/lib/types';
import { useLife } from '@/lib/store';
import { cn } from '@/lib/utils';

export function QuickCaptureButton({ label = 'Quick capture' }: { label?: string }) {
  const { actions } = useLife();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<CaptureType>('Highlight');

  // Escape closes, and the page behind stays put
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ⌘K / Ctrl+K toggles capture (the hint on the button is real)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function save() {
    if (!text.trim()) return;
    actions.addCapture(text.trim(), type);
    setText('');
    setOpen(false);
  }

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/25 p-5 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="capture-title"
              className="w-full max-w-[560px] rounded-[var(--radius)] border border-line bg-card p-5 shadow-2xl"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="capture-title" className="font-display text-xl font-[500]">
                  Catch it before it disappears.
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close quick capture"
                  className="rounded-full px-2 text-lg leading-none text-ink-4 hover:text-ink"
                >
                  ×
                </button>
              </div>
              <p className="mt-1 text-sm text-ink-3">Thirty seconds now. Tonight it goes onto the page.</p>
              <textarea
                autoFocus
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    save();
                  }
                }}
                placeholder="The sunrise. The idea in the shower. The thing you keep meaning to write down."
                className="mt-5 w-full resize-none rounded-[var(--radius)] border border-line bg-paper px-4 py-3 font-display italic placeholder:font-sans placeholder:text-sm placeholder:not-italic placeholder:text-ink-4 focus:border-sage focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {CAPTURE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={type === t}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-[0.8125rem]',
                      type === t ? 'border-ink bg-ink text-paper' : 'border-line text-ink-3 hover:border-sage'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="label-mono text-ink-4">
                  {type === 'Highlight' ? 'Goes to today’s page' : 'Kept in your captures'}
                </span>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={save}
                  className="rounded-full bg-ink px-5 py-2 text-sm text-paper hover:bg-sage-deep disabled:opacity-40"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-sage-deep"
      >
        ＋ {label}
        <span className="hidden rounded border border-paper/25 px-1.5 py-0.5 font-mono text-[10px] opacity-70 sm:inline">
          ⌘K
        </span>
      </button>
      {dialog}
    </>
  );
}
