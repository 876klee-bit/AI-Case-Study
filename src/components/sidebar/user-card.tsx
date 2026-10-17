'use client';

import Link from 'next/link';
import { ChevronsUpDown, LogIn, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/store/useLayoutStore';

function initials(name: string | null, email: string | null) {
  const source = name || email || '?';
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export function UserCard({ collapsed }: { collapsed?: boolean }) {
  const { user, configured, signOut, loading } = useAuth();
  const setView = useLayoutStore((s) => s.setView);

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          'flex items-center gap-2.5 rounded-xl p-2 text-sm transition-colors hover:bg-accent',
          collapsed && 'justify-center',
          loading && 'pointer-events-none opacity-60',
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dashed border-border text-muted-foreground">
          <LogIn className="h-4 w-4" />
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{configured ? 'Sign in' : 'Local mode'}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {configured ? 'Sync and share artifacts' : 'Saved in this browser'}
            </span>
          </span>
        )}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl p-2 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent',
          collapsed && 'justify-center',
        )}
      >
        <Avatar>
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{user.name ?? user.email}</span>
              {user.name && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setView('settings')}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
