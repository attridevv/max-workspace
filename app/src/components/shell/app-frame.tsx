'use client';

import type { ReactNode } from 'react';
import { useLife } from '@/lib/store';
import { Onboarding } from '@/components/onboarding/onboarding';
import { CaptureProvider } from './quick-capture';
import { Header } from './header';
import { MobileNav, Rail } from './rail';

export function AppFrame({ children }: { children: ReactNode }) {
  const { data, hydrated } = useLife();
  if (!hydrated) {
    return <div className="grid min-h-dvh place-items-center"><p className="hand text-2xl text-ink-3">opening the notebook…</p></div>;
  }
  if (!data || data.months.length === 0) return <Onboarding />;
  return (
    <CaptureProvider>
      <div className="grain flex min-h-dvh">
        <Rail />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pt-7 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">{children}</main>
        </div>
      </div>
      <MobileNav />
    </CaptureProvider>
  );
}
