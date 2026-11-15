import { cn } from '@/lib/utils';

/** The Max Workspace mark: an M with today's dot in it, under a bookmark ribbon. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={cn('shrink-0 rounded-[24%] ring-1 ring-line', className)}>
      <rect width="64" height="64" rx="15" fill="#211e19" />
      <path d="M27 0h10v16.5l-5-3.8-5 3.8z" fill="#d5aa5e" />
      <path d="M14.5 48V22l17.5 19 17.5-19v26" fill="none" stroke="#f5f1e8" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="41" r="6.6" fill="#8fae7a" stroke="#211e19" strokeWidth="2.6" />
    </svg>
  );
}
