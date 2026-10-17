'use client';

import { useState } from 'react';
import { AlertTriangle, History, Monitor, RotateCw, Smartphone, Tablet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { restoreArtifactVersion } from '@/features/artifact-flow/actions';
import { cn } from '@/lib/utils';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import type { Artifact } from '@/types';
import { PreviewFrame } from './preview-frame';

type Device = 'desktop' | 'tablet' | 'mobile';
const WIDTHS: Record<Device, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };
const DEVICES: { id: Device; icon: typeof Monitor; label: string }[] = [
  { id: 'desktop', icon: Monitor, label: 'Desktop' },
  { id: 'tablet', icon: Tablet, label: 'Tablet' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile' },
];

interface Props {
  artifact: Artifact;
  code: string;
  streaming: boolean;
}

export function PreviewTab({ artifact, code, streaming }: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const viewingVersion = useLayoutStore((s) => s.viewingVersion);
  const setViewingVersion = useLayoutStore((s) => s.setViewingVersion);
  const setPanelTab = useLayoutStore((s) => s.setPanelTab);
  const versionCode = useArtifactStore((s) =>
    viewingVersion ? s.versions[artifact.id]?.find((v) => v.version === viewingVersion)?.code : undefined,
  );

  const showingOld = viewingVersion !== null && versionCode !== undefined;
  const shownCode = showingOld ? versionCode : code;
  const editable = !showingOld && !streaming && artifact.type === 'spreadsheet';

  const restore = () => {
    if (!viewingVersion) return;
    restoreArtifactVersion(artifact.id, viewingVersion);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-3">
        <div className="flex items-center rounded-lg bg-muted p-0.5">
          {DEVICES.map(({ id, icon: Icon, label }) => (
            <Hint key={id} label={label}>
              <button
                onClick={() => setDevice(id)}
                aria-label={label}
                aria-pressed={device === id}
                className={cn(
                  'grid h-6 w-7 place-items-center rounded-md text-muted-foreground transition',
                  device === id ? 'bg-surface text-foreground shadow-subtle' : 'hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            </Hint>
          ))}
        </div>
        {showingOld ? (
          <div className="ml-2 flex min-w-0 items-center gap-1.5 text-xs">
            <History className="h-3.5 w-3.5 shrink-0 text-brand" />
            <span className="truncate text-muted-foreground">Viewing v{viewingVersion}</span>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={restore}>
              Restore
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setViewingVersion(null)}>
              Latest
            </Button>
          </div>
        ) : (
          artifact.draft !== null && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Unsaved draft
            </span>
          )
        )}
        <div className="ml-auto">
          <Hint label="Reload preview">
            <Button variant="ghost" size="icon-sm" onClick={() => setReloadKey((k) => k + 1)} aria-label="Reload preview">
              <RotateCw />
            </Button>
          </Hint>
        </div>
      </div>

      <div className={cn('relative min-h-0 flex-1', device !== 'desktop' && 'bg-muted/60 p-4')}>
        <div
          className={cn(
            'mx-auto h-full overflow-hidden bg-white transition-[width] duration-300',
            device !== 'desktop' && 'rounded-xl border border-border shadow-float',
          )}
          style={{ width: WIDTHS[device], maxWidth: '100%' }}
        >
          {shownCode.trim() ? (
            <PreviewFrame
              type={artifact.type}
              code={shownCode}
              title={artifact.title}
              reloadKey={reloadKey}
              debounceMs={350}
              onError={setError}
              onCsvChange={editable ? (csv) => useArtifactStore.getState().setDraft(artifact.id, csv) : undefined}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-stone-500">Nothing to preview yet.</div>
          )}
        </div>

        {error && (
          <div className="absolute inset-x-3 bottom-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-surface p-3 text-sm shadow-float">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">The preview hit an error</p>
              <p className="mt-0.5 line-clamp-3 font-mono text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPanelTab('code')}>
              Open code
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setError(null)} aria-label="Dismiss">
              <X />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
