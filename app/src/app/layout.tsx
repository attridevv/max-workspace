import type{Metadata}from'next';import{Fraunces,IBM_Plex_Mono,Inter}from'next/font/google';import{cn}from'@/lib/utils';import'./globals.css';
const fraunces=Fraunces({subsets:['latin'],style:['normal','italic'],axes:['opsz'],variable:'--font-fraunces'});
const inter=Inter({subsets:['latin'],variable:'--font-inter'});
const plexMono=IBM_Plex_Mono({subsets:['latin'],weight:['400','500'],variable:'--font-plex-mono'});
export const metadata:Metadata={title:'Max Workspace — companion',description:'The digital companion to your Max Workspace notebook. Set up the month, review the one you finished, and keep the record. Local-first, private by default.'};
export default function RootLayout({children}:LayoutProps<'/'>){return<html lang="en" className={cn(fraunces.variable,inter.variable,plexMono.variable)}><body className="min-h-dvh bg-paper text-ink">{children}</body></html>}
