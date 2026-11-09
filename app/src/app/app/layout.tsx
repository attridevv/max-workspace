import { LifeProvider } from '@/lib/store';
import { AppFrame } from '@/components/shell/app-frame';
export default function AppLayout({ children }: LayoutProps<'/app'>) { return <LifeProvider><AppFrame>{children}</AppFrame></LifeProvider>; }
