'use client';

import { useMemo, useState } from 'react';
import { Search, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/misc';
import { startNewChat } from '@/hooks/use-shortcuts';
import { ARTIFACT_META, ARTIFACT_TYPES } from '@/lib/artifact-meta';
import { cn } from '@/lib/utils';
import { useArtifactStore } from '@/store/useArtifactStore';
import type { ArtifactType } from '@/types';
import { ArtifactGrid } from './artifact-grid';
import { ViewShell } from './view-shell';

export function ArtifactsView({ isDesktop }: { isDesktop: boolean }) {
  const artifacts = useArtifactStore((s) => s.artifacts);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ArtifactType | 'all'>('all');

  const all = useMemo(
    () => Object.values(artifacts).filter((a) => a.currentVersion > 0).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [artifacts],
  );
  const presentTypes = useMemo(() => ARTIFACT_TYPES.filter((t) => all.some((a) => a.type === t)), [all]);
  const list = all.filter(
    (a) => (type === 'all' || a.type === type) && a.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <ViewShell title="Artifacts" description="Everything you've made, newest first." isDesktop={isDesktop}>
      {all.length === 0 ? (
        <EmptyState
          icon={Shapes}
          title="No artifacts yet"
          description="Ask for an app, dashboard, site, document, sheet or deck and it will be saved here."
          action={<Button onClick={startNewChat}>Start a chat</Button>}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artifacts" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...presentTypes] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition',
                    type === t
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'all' ? 'All' : ARTIFACT_META[t].label}
                </button>
              ))}
            </div>
          </div>
          {list.length ? (
            <ArtifactGrid artifacts={list} />
          ) : (
            <EmptyState icon={Search} title="No matches" description="Try a different search or filter." />
          )}
        </>
      )}
    </ViewShell>
  );
}
