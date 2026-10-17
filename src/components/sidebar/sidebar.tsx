'use client';

import { FolderKanban, PanelLeftClose, PanelLeftOpen, SquarePen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { startNewChat } from '@/hooks/use-shortcuts';
import { cn, isMac } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Logo, LogoMark } from './logo';
import { Navigation } from './navigation';
import { RecentChats } from './recent-chats';
import { UserCard } from './user-card';

function ActiveProjectChip() {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === s.activeProjectId));
  const clear = useProjectStore((s) => s.setActiveProject);
  if (!project) return null;
  return (
    <div className="mx-2 mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-subtle">
      <FolderKanban className="h-3.5 w-3.5 text-brand" />
      <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
      <button onClick={() => clear(null)} className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Leave project">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed) && !mobile;
  const toggle = useLayoutStore((s) => s.toggleSidebar);
  const mod = isMac() ? '⌘' : 'Ctrl+';

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col bg-sidebar transition-[width] duration-200',
        !mobile && 'border-r border-border',
        collapsed ? 'w-[56px]' : mobile ? 'w-full' : 'w-[260px]',
      )}
    >
      <div className={cn('flex h-14 items-center px-3', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? (
          <Hint label="Expand sidebar" side="right">
            <button onClick={toggle} className="group relative grid h-8 w-8 place-items-center" aria-label="Expand sidebar">
              <LogoMark size={24} className="transition group-hover:opacity-0" />
              <PanelLeftOpen className="absolute h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </button>
          </Hint>
        ) : (
          <>
            <Logo />
            {!mobile && (
              <Hint label="Collapse sidebar" side="right">
                <Button variant="ghost" size="icon" onClick={toggle} aria-label="Collapse sidebar">
                  <PanelLeftClose />
                </Button>
              </Hint>
            )}
          </>
        )}
      </div>

      <div className={cn('px-2 pb-3', collapsed && 'flex flex-col items-center')}>
        <Hint label="New chat" shortcut={`${mod}⇧O`} side="right">
          <Button
            onClick={startNewChat}
            variant="outline"
            className={cn('w-full justify-start bg-surface', collapsed && 'h-8 w-8 justify-center p-0')}
          >
            <SquarePen />
            {!collapsed && 'New chat'}
          </Button>
        </Hint>
      </div>

      <div className={cn('px-2', collapsed && 'flex flex-col items-center')}>
        <Navigation collapsed={collapsed} />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {!collapsed && (
          <>
            <ActiveProjectChip />
            <RecentChats />
          </>
        )}
      </div>

      <div className={cn('border-t border-border p-2', collapsed && 'flex justify-center')}>
        <UserCard collapsed={collapsed} />
      </div>
    </aside>
  );
}
