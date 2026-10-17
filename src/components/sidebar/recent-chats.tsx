'use client';

import { useMemo, useState } from 'react';
import { FolderInput, MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { removeChat, syncChat } from '@/services/supabase-sync';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useProjectStore } from '@/store/useProjectStore';
import type { Chat } from '@/types';

function groupLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return 'Today';
  if (t >= startOfToday - 86_400_000) return 'Yesterday';
  if (t >= startOfToday - 7 * 86_400_000) return 'Previous 7 days';
  if (t >= startOfToday - 30 * 86_400_000) return 'Previous 30 days';
  return 'Older';
}

function ChatRow({ chat, active }: { chat: Chat; active: boolean }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const streaming = useChatStore((s) => s.streamingChatId === chat.id);
  const projects = useProjectStore((s) => s.projects);

  const open = () => {
    useChatStore.getState().setActiveChat(chat.id);
    useLayoutStore.getState().setView('chat');
    useLayoutStore.getState().setViewingVersion(null);
  };

  const commitRename = () => {
    setEditing(false);
    const clean = title.trim();
    if (!clean || clean === chat.title) return setTitle(chat.title);
    useChatStore.getState().renameChat(chat.id, clean);
    const updated = useChatStore.getState().chats.find((c) => c.id === chat.id);
    if (updated) void syncChat(updated);
  };

  const remove = () => {
    useArtifactStore.getState().deleteForChat(chat.id);
    useChatStore.getState().deleteChat(chat.id);
    void removeChat(chat.id);
  };

  const move = (projectId: string | null) => {
    useChatStore.getState().moveChat(chat.id, projectId);
    const updated = useChatStore.getState().chats.find((c) => c.id === chat.id);
    if (updated) void syncChat(updated);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename();
          if (e.key === 'Escape') {
            setTitle(chat.title);
            setEditing(false);
          }
        }}
        className="h-8 text-sm"
      />
    );
  }

  return (
    <div
      className={cn(
        'group relative flex h-8 items-center rounded-lg text-sm transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground',
      )}
    >
      <button onClick={open} onDoubleClick={() => setEditing(true)} className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left">
        {streaming && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand" />}
        <span className="truncate">{chat.title}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md opacity-0 transition hover:bg-background focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          aria-label="Chat options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Rename
          </DropdownMenuItem>
          {projects.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Move to project</DropdownMenuLabel>
              {chat.projectId && (
                <DropdownMenuItem onSelect={() => move(null)}>
                  <FolderInput /> No project
                </DropdownMenuItem>
              )}
              {projects
                .filter((p) => p.id !== chat.projectId)
                .slice(0, 6)
                .map((p) => (
                  <DropdownMenuItem key={p.id} onSelect={() => move(p.id)}>
                    <FolderInput /> <span className="truncate">{p.name}</span>
                  </DropdownMenuItem>
                ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={remove}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RecentChats() {
  const chats = useChatStore((s) => s.chats);
  const messages = useChatStore((s) => s.messages);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const view = useLayoutStore((s) => s.view);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const groups = useMemo(() => {
    const visible = chats.filter(
      (c) =>
        (messages[c.id]?.length ?? 0) > 0 && (activeProjectId ? c.projectId === activeProjectId : true),
    );
    const map = new Map<string, Chat[]>();
    visible.forEach((c) => {
      const label = groupLabel(c.updatedAt);
      map.set(label, [...(map.get(label) ?? []), c]);
    });
    return [...map.entries()];
  }, [chats, messages, activeProjectId]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-xs text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Your chats will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([label, list]) => (
        <section key={label}>
          <h3 className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{label}</h3>
          <div className="flex flex-col gap-0.5">
            {list.map((c) => (
              <ChatRow key={c.id} chat={c} active={view === 'chat' && c.id === activeChatId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
