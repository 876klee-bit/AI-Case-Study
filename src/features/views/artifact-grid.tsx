'use client';

import { motion } from 'framer-motion';
import { Globe2, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteArtifact, toggleArtifactFavorite } from '@/features/artifact-flow/actions';
import { ARTIFACT_META } from '@/lib/artifact-meta';
import { cn, formatRelative } from '@/lib/utils';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useArtifactStore } from '@/store/useArtifactStore';
import type { Artifact } from '@/types';

/** Open an artifact in its chat with the panel on Preview. */
export function openArtifact(artifact: Artifact) {
  const chats = useChatStore.getState();
  let chatId = artifact.chatId;
  if (!chatId || !chats.chats.some((c) => c.id === chatId)) {
    chatId = chats.newChat(artifact.projectId);
    chats.renameChat(chatId, artifact.title);
    useArtifactStore.getState().updateArtifact(artifact.id, { chatId });
  } else {
    chats.setActiveChat(chatId);
  }
  const layout = useLayoutStore.getState();
  layout.setView('chat');
  layout.setViewingVersion(null);
  layout.openPanel('preview');
}

function ArtifactCardTile({ artifact }: { artifact: Artifact }) {
  const meta = ARTIFACT_META[artifact.type];
  const Icon = meta.icon;
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <button
        onClick={() => openArtifact(artifact)}
        className="flex w-full flex-col rounded-2xl border border-border bg-surface p-4 text-left shadow-subtle transition hover:border-foreground/20 hover:shadow-float"
      >
        <div className="mb-8 flex items-start justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <span className="truncate text-sm font-medium">{artifact.title}</span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {meta.label} · v{artifact.currentVersion} · {formatRelative(artifact.updatedAt)}
          {artifact.isPublic && <Globe2 className="h-3 w-3" aria-label="Shared" />}
        </span>
      </button>
      <div className="absolute right-3 top-3 flex items-center gap-0.5">
        <button
          onClick={() => toggleArtifactFavorite(artifact.id)}
          aria-label={artifact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'grid h-7 w-7 place-items-center rounded-md transition hover:bg-accent',
            artifact.isFavorite ? 'text-amber-400' : 'text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100',
          )}
        >
          <Star className={cn('h-4 w-4', artifact.isFavorite && 'fill-current')} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-accent focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem destructive onSelect={() => deleteArtifact(artifact.id)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export function ArtifactGrid({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {artifacts.map((a) => (
        <ArtifactCardTile key={a.id} artifact={a} />
      ))}
    </div>
  );
}
