'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, GitCompareArrows, History, RotateCcw } from 'lucide-react';
import { DiffViewer } from '@/components/editor/diff-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { Hint } from '@/components/ui/tooltip';
import { monacoLanguage } from '@/lib/artifact-meta';
import { cn, formatRelative } from '@/lib/utils';
import { restoreArtifactVersion } from '@/features/artifact-flow/actions';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import type { Artifact, ArtifactVersion } from '@/types';

const NO_VERSIONS: ArtifactVersion[] = [];

function lineDelta(a: string, b: string) {
  const before = a.split('\n');
  const after = b.split('\n');
  const setA = new Set(before);
  const setB = new Set(after);
  return {
    added: after.filter((l) => !setA.has(l)).length,
    removed: before.filter((l) => !setB.has(l)).length,
  };
}

export function VersionsTab({ artifact }: { artifact: Artifact }) {
  const versions = useArtifactStore((s) => s.versions[artifact.id] ?? NO_VERSIONS);
  const latest = versions.at(-1);
  const [selected, setSelected] = useState<number | null>(latest?.version ?? null);
  const [compareAgainst, setCompareAgainst] = useState<'previous' | 'latest'>('previous');
  const setViewingVersion = useLayoutStore((s) => s.setViewingVersion);
  const setPanelTab = useLayoutStore((s) => s.setPanelTab);

  // Follow new versions as they arrive.
  const latestNumber = latest?.version ?? null;
  useEffect(() => setSelected(latestNumber), [latestNumber]);

  const current = versions.find((v) => v.version === selected) ?? latest;
  const base = useMemo(() => {
    if (!current) return null;
    if (compareAgainst === 'latest') return latest && latest.version !== current.version ? latest : null;
    return versions.filter((v) => v.version < current.version).at(-1) ?? null;
  }, [current, latest, versions, compareAgainst]);

  if (!latest || !current) {
    return <EmptyState icon={History} title="No versions yet" description="Versions appear here each time the artifact is saved." />;
  }

  const restore = (v: ArtifactVersion) => {
    const created = restoreArtifactVersion(artifact.id, v.version);
    if (created) setSelected(created.version);
  };

  const preview = (v: ArtifactVersion) => {
    setViewingVersion(v.version === latest.version ? null : v.version);
    setPanelTab('preview');
  };

  const original = compareAgainst === 'latest' ? current.code : base?.code ?? '';
  const modified = compareAgainst === 'latest' ? base?.code ?? current.code : current.code;

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <ol className="max-h-[40%] shrink-0 overflow-y-auto border-b border-border p-2 scrollbar-thin lg:max-h-none lg:w-64 lg:border-b-0 lg:border-r">
        {[...versions].reverse().map((v, i, arr) => {
          const prev = arr[i + 1];
          const delta = prev ? lineDelta(prev.code, v.code) : null;
          const active = v.version === current.version;
          return (
            <li key={v.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected(v.version)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(v.version)}
                className={cn(
                  'group mb-0.5 cursor-pointer rounded-lg px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'bg-accent' : 'hover:bg-accent/60',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">v{v.version}</span>
                  {v.version === latest.version && <Badge variant="accent">Latest</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">{formatRelative(v.createdAt)}</span>
                </div>
                {v.prompt && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{v.prompt}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  {delta ? (
                    <span className="font-mono text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400">+{delta.added}</span>{' '}
                      <span className="text-rose-600 dark:text-rose-400">−{delta.removed}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Initial</span>
                  )}
                  <div className="ml-auto flex gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <Hint label="Preview">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          preview(v);
                        }}
                        aria-label={`Preview v${v.version}`}
                      >
                        <Eye />
                      </Button>
                    </Hint>
                    {v.version !== latest.version && (
                      <Hint label="Restore as new version">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            restore(v);
                          }}
                          aria-label={`Restore v${v.version}`}
                        >
                          <RotateCcw />
                        </Button>
                      </Hint>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3 text-xs">
          <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {base
              ? compareAgainst === 'latest'
                ? `v${current.version} → v${base.version}`
                : `v${base.version} → v${current.version}`
              : `v${current.version}`}
          </span>
          <div className="ml-auto flex rounded-lg bg-muted p-0.5">
            {(['previous', 'latest'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCompareAgainst(mode)}
                className={cn(
                  'rounded-md px-2 py-1 capitalize transition',
                  compareAgainst === mode ? 'bg-surface font-medium shadow-subtle' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                vs {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          {base ? (
            <DiffViewer original={original} modified={modified} language={monacoLanguage(artifact.type, current.code)} />
          ) : (
            <EmptyState
              icon={GitCompareArrows}
              title={compareAgainst === 'latest' ? 'This is the latest version' : 'First version'}
              description="Pick another version to see what changed."
            />
          )}
        </div>
      </div>
    </div>
  );
}
