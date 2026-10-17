'use client';

import { useMemo, useState } from 'react';
import { FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/misc';
import { Textarea } from '@/components/ui/textarea';
import { startNewChat } from '@/hooks/use-shortcuts';
import { cn, formatRelative } from '@/lib/utils';
import { removeProject, syncChat, syncProject } from '@/services/supabase-sync';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useProjectStore } from '@/store/useProjectStore';
import type { Project } from '@/types';
import { ViewShell } from './view-shell';

function ProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const store = useProjectStore.getState();
    if (project) {
      store.updateProject(project.id, { name: clean, description: description.trim() || null });
      const updated = useProjectStore.getState().projects.find((p) => p.id === project.id);
      if (updated) void syncProject(updated);
    } else {
      const created = store.createProject(clean, description.trim() || null);
      void syncProject(created);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={save} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
            <DialogDescription>Projects group related chats and artifacts.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 launch" maxLength={80} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" maxLength={400} />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {project ? 'Save' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsView({ isDesktop }: { isDesktop: boolean }) {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const chats = useChatStore((s) => s.chats);
  const messages = useChatStore((s) => s.messages);
  const artifacts = useArtifactStore((s) => s.artifacts);
  const [dialog, setDialog] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });

  const stats = useMemo(() => {
    const map: Record<string, { chats: number; artifacts: number }> = {};
    projects.forEach((p) => (map[p.id] = { chats: 0, artifacts: 0 }));
    chats.forEach((c) => {
      if (c.projectId && map[c.projectId] && (messages[c.id]?.length ?? 0) > 0) map[c.projectId].chats++;
    });
    Object.values(artifacts).forEach((a) => {
      const projectId = a.projectId ?? chats.find((c) => c.id === a.chatId)?.projectId;
      if (projectId && map[projectId]) map[projectId].artifacts++;
    });
    return map;
  }, [projects, chats, messages, artifacts]);

  const open = (p: Project) => {
    useProjectStore.getState().setActiveProject(p.id);
    startNewChat();
  };

  const remove = (p: Project) => {
    useChatStore
      .getState()
      .chats.filter((c) => c.projectId === p.id)
      .forEach((c) => {
        useChatStore.getState().moveChat(c.id, null);
        void syncChat({ ...c, projectId: null });
      });
    useProjectStore.getState().deleteProject(p.id);
    void removeProject(p.id);
  };

  return (
    <ViewShell
      title="Projects"
      description="Group chats and artifacts. New chats go into the active project."
      isDesktop={isDesktop}
      actions={
        <Button onClick={() => setDialog({ open: true, project: null })}>
          <Plus /> New project
        </Button>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to keep related chats and artifacts together."
          action={
            <Button variant="outline" onClick={() => setDialog({ open: true, project: null })}>
              <Plus /> New project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="group relative">
              <button
                onClick={() => open(p)}
                className={cn(
                  'flex h-full w-full flex-col rounded-2xl border bg-surface p-4 text-left shadow-subtle transition hover:border-foreground/20 hover:shadow-float',
                  p.id === activeProjectId ? 'border-brand/60' : 'border-border',
                )}
              >
                <FolderKanban className="mb-6 h-5 w-5 text-brand" />
                <span className="truncate pr-8 font-medium">{p.name}</span>
                {p.description && <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</span>}
                <span className="mt-auto pt-4 text-xs text-muted-foreground">
                  {stats[p.id]?.chats ?? 0} chats · {stats[p.id]?.artifacts ?? 0} artifacts · {formatRelative(p.updatedAt)}
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Project options"
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-accent focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setDialog({ open: true, project: p })}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => remove(p)}>
                    <Trash2 /> Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
      {dialog.open && (
        <ProjectDialog
          key={dialog.project?.id ?? 'new'}
          open={dialog.open}
          project={dialog.project}
          onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        />
      )}
    </ViewShell>
  );
}
