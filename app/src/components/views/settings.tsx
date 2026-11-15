'use client';

import { useRef, useState } from 'react';
import { useLife } from '@/lib/store';
import { downloadJson, isLifeData } from '@/lib/storage';
import { Button, PageHead, Panel, PanelHead } from '@/components/ui/kit';
import { LabeledInput } from '@/components/ui/fields';
import { useCapture } from '@/components/shell/quick-capture';
import { ThemeSwitch } from '@/components/ui/theme';

export function SettingsView() {
  const { data, actions } = useLife();
  const { toast } = useCapture();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  if (!data) return null;
  const lines = data.months.reduce((s, m) => s + Object.values(m.highlights).filter((x) => x.trim()).length, 0);

  return (
    <div className="rise">
      <PageHead title="Settings" caption="Everything stays in this browser on this device. Back it up now and then." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHead label="You" />
          <div className="flex flex-col gap-4 px-5 py-5">
            <LabeledInput label="What should it call you?" value={data.settings.name} onChange={(name) => actions.updateSettings({ name })} placeholder="Dev" />
            <label className="flex flex-col gap-1.5">
              <span className="label-mono text-ink-4">Weeks start on</span>
              <select value={data.settings.weekStartsOn} onChange={(e) => actions.updateSettings({ weekStartsOn: Number(e.target.value) as 0 | 1 })} className="h-[42px] rounded-[var(--radius)] border border-line bg-card px-3 text-sm">
                <option value={1}>Monday</option><option value={0}>Sunday</option>
              </select>
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="label-mono text-ink-4">Look</span>
              <ThemeSwitch className="self-start" />
              <span className="text-xs text-ink-4">Paper for daytime, Night for after dark. Auto follows your device.</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHead label="Backup" right={`${data.months.length} months · ${lines} lines`} />
          <div className="flex flex-col gap-3 px-5 py-5">
            <p className="text-sm text-ink-2">A plain JSON file with everything in it. Importing one replaces what’s here.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { downloadJson(data); toast('Backup downloaded'); }}>Download backup</Button>
              <Button variant="outline" onClick={() => file.current?.click()}>Import backup</Button>
            </div>
            <input ref={file} type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (!f) return;
              try {
                const parsed = JSON.parse(await f.text());
                if (!isLifeData(parsed)) { setMessage('That isn’t a Max Workspace backup.'); return; }
                if (!window.confirm('Replace everything on this device with this backup?')) return;
                actions.importData(parsed); setMessage(''); toast('Backup imported');
              } catch { setMessage('Couldn’t read that file.'); }
            }} />
            {message && <p className="text-sm text-pen">{message}</p>}
          </div>
        </Panel>
        <Panel>
          <PanelHead label="Privacy" />
          <div className="px-5 py-5 text-sm text-ink-2">
            <p>No account. No feed. No analytics. Nothing leaves this browser.</p>
            <p className="mt-2 text-ink-3">Clearing your browser data clears this too — that’s what the backup is for.</p>
          </div>
        </Panel>
        <Panel>
          <PanelHead label="Example and reset" />
          <div className="flex flex-col items-start gap-3 px-5 py-5 text-sm text-ink-2">
            <p>Load three filled-in months to see what the app looks like in use. It replaces those months if you already have them.</p>
            <Button variant="outline" onClick={() => { if (window.confirm('Load example data over this month and the two before it?')) { actions.loadExample(); toast('Example months loaded'); } }}>Load example months</Button>
            <button type="button" onClick={() => { if (window.confirm('Delete every month, line and capture on this device? This can’t be undone.')) actions.resetAll(); }} className="mt-2 text-sm text-pen hover:underline">Delete everything</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
