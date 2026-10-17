'use client';

import { FolderKanban, Files, LayoutTemplate, Settings, Shapes, Star } from 'lucide-react';
import { Hint } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';
import type { View } from '@/types';

const ITEMS: { view: View; label: string; icon: typeof Shapes }[] = [
  { view: 'projects', label: 'Projects', icon: FolderKanban },
  { view: 'artifacts', label: 'Artifacts', icon: Shapes },
  { view: 'files', label: 'Files', icon: Files },
  { view: 'templates', label: 'Templates', icon: LayoutTemplate },
  { view: 'favorites', label: 'Favorites', icon: Star },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function Navigation({ collapsed }: { collapsed?: boolean }) {
  const view = useLayoutStore((s) => s.view);
  const setView = useLayoutStore((s) => s.setView);

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Workspace">
      {ITEMS.map(({ view: v, label, icon: Icon }) => {
        const active = view === v;
        const button = (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm transition-colors',
              collapsed && 'w-8 justify-center px-0',
              active
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', active && 'text-foreground')} />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        );
        return collapsed ? (
          <Hint key={v} label={label} side="right">
            {button}
          </Hint>
        ) : (
          button
        );
      })}
    </nav>
  );
}
