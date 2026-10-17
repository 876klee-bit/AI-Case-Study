'use client';

import { useState } from 'react';
import { Code2, Eye, History, Link2, Link2Off, MoreHorizontal, Pencil, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Hint } from '@/components/ui/tooltip';
import { deleteArtifact, renameArtifact, toggleArtifactFavorite } from '@/features/artifact-flow/actions';
import { publishAndCopyLink, unpublish } from '@/features/artifact-flow/share';
import { ARTIFACT_META } from '@/lib/artifact-meta';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';
import type { Artifact, PanelTab } from '@/types';

const TABS: { id: PanelTab; label: string; icon: typeof Eye }[] = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'versions', label: 'Versions', icon: History },
];

export function ArtifactTabs({ artifact, versionCount, onClose }: { artifact: Artifact; versionCount: number; onClose: () => void }) {
  const tab = useLayoutStore((s) => s.panelTab);
  const setTab = useLayoutStore((s) => s.setPanelTab);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(artifact.title);
  const [sharing, setSharing] = useState(false);
  const Icon = ARTIFACT_META[artifact.type].icon;

  const commit = () => {
    setEditing(false);
    if (title.trim() && title !== artifact.title) renameArtifact(artifact.id, title);
    else setTitle(artifact.title);
  };

  const share = async () => {
    setSharing(true);
    await publishAndCopyLink(artifact.id);
    setSharing(false);
  };

  return (
    <div className="shrink-0 border-b border-border bg-surface">
      <div className="flex h-12 items-center gap-2 pl-4 pr-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setTitle(artifact.title);
                setEditing(false);
              }
            }}
            className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm font-medium outline-none ring-1 ring-ring"
          />
        ) : (
          <button
            onClick={() => {
              setTitle(artifact.title);
              setEditing(true);
            }}
            className="min-w-0 truncate rounded-md px-1.5 py-1 text-sm font-medium transition hover:bg-accent"
            title="Rename"
          >
            {artifact.title}
          </button>
        )}
        {!editing && versionCount > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">v{artifact.currentVersion}</span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Hint label={artifact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Button variant="ghost" size="icon" onClick={() => toggleArtifactFavorite(artifact.id)} aria-label="Toggle favorite">
              <Star className={cn(artifact.isFavorite && 'fill-amber-400 text-amber-400')} />
            </Button>
          </Hint>
          <Button variant="outline" size="sm" onClick={share} disabled={sharing || versionCount === 0} className="mx-1">
            <Link2 className="!size-3.5" />
            {artifact.isPublic ? 'Copy link' : 'Share'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onSelect={() => {
                  setTitle(artifact.title);
                  setEditing(true);
                }}
              >
                <Pencil /> Rename
              </DropdownMenuItem>
              {artifact.isPublic && (
                <DropdownMenuItem onSelect={() => void unpublish(artifact.id)}>
                  <Link2Off /> Disable link
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onSelect={() => {
                  onClose();
                  deleteArtifact(artifact.id);
                }}
              >
                <Trash2 /> Delete artifact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Hint label="Close">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
              <X />
            </Button>
          </Hint>
        </div>
      </div>

      <div className="flex gap-1 px-3" role="tablist">
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'relative flex h-9 items-center gap-1.5 px-2.5 text-sm transition-colors',
              tab === id ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <TabIcon className="h-3.5 w-3.5" />
            {label}
            {id === 'versions' && versionCount > 0 && (
              <span className="rounded bg-muted px-1 text-[10px] tabular-nums text-muted-foreground">{versionCount}</span>
            )}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>
    </div>
  );
}
