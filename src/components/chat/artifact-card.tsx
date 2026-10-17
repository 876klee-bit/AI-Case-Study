'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { ARTIFACT_META } from '@/lib/artifact-meta';
import { cn } from '@/lib/utils';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import type { ArtifactType } from '@/types';

interface Props {
  artifactId: string | null | undefined;
  /** Fallbacks from the parsed message while the artifact record is being created. */
  title: string;
  type: ArtifactType;
  version: number | null | undefined;
  streaming: boolean;
}

export function ArtifactCard({ artifactId, title, type, version, streaming }: Props) {
  const artifact = useArtifactStore((s) => (artifactId ? s.artifacts[artifactId] : undefined));
  const lineCount = useArtifactStore((s) => (artifactId && s.streaming[artifactId] ? s.streaming[artifactId].split('\n').length : 0));
  const latest = artifact?.currentVersion ?? 0;
  const meta = ARTIFACT_META[artifact?.type ?? type];
  const Icon = meta.icon;

  const open = () => {
    const layout = useLayoutStore.getState();
    layout.setViewingVersion(version && version !== latest ? version : null);
    layout.openPanel(streaming ? 'code' : 'preview');
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={open}
      className={cn(
        'group my-3 flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left shadow-subtle transition hover:border-foreground/20 hover:shadow-float',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background',
          streaming && 'text-brand',
        )}
      >
        {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{artifact?.title ?? title}</span>
        <span className="block text-xs text-muted-foreground">
          {streaming
            ? `Writing ${meta.label.toLowerCase()}${lineCount ? ` · ${lineCount} lines` : '…'}`
            : `${meta.label}${version ? ` · v${version}` : ''}${version && version !== latest && latest ? ' (older)' : ''}`}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
    </motion.button>
  );
}
