import type { Metadata, Viewport } from 'next';
import { Caveat, Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { THEME_SCRIPT } from '@/components/ui/theme';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-fraunces' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });
const caveat = Caveat({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'Max Workspace',
  description: 'The companion to your Max Workspace notebook. Check in on today, see the month take shape, and keep the record. Stored on your device.',
};
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e8' },
    { media: '(prefers-color-scheme: dark)', color: '#141311' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(fraunces.variable, inter.variable, plexMono.variable, caveat.variable)}>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}
