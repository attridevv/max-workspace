'use client';

import type { ReactNode } from 'react';
import { useLife } from '@/lib/store';
import { Rail, MobileNav } from './rail';
import { Header } from './header';
import { Onboarding } from '@/components/onboarding/onboarding';

export function AppFrame({ children }: { children: ReactNode }) {
  const { data, hydrated } = useLife();
  if (!hydrated) return <div className="flex min-h-dvh items-center justify-center"><p className="annot text-lg">opening the workspace…</p></div>;
  if (!data || data.months.length === 0) return <Onboarding />;
  return <div className="flex min-h-dvh"><Rail /><div className="flex min-w-0 flex-1 flex-col"><Header /><MobileNav /><main className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-8 lg:px-8 lg:py-10">{children}</main><footer className="border-t border-line px-5 py-4 lg:px-8"><div className="mx-auto flex max-w-[1120px] flex-wrap items-baseline justify-between gap-2"><span className="label-mono text-ink-4">Paper first · screen second</span><span className="annot text-xs">Close the app. Open the notebook.</span></div></footer></div></div>;
}
