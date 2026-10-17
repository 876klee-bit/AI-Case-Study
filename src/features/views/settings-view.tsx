'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeSegmented } from '@/components/layout/theme-toggle';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/misc';
import { isMac } from '@/lib/utils';
import { uploadAvatar } from '@/services/uploads';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useProjectStore } from '@/store/useProjectStore';
import { ViewShell } from './view-shell';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function useMode() {
  const [mode, setMode] = useState<{ mode: string; model: string | null } | null>(null);
  useEffect(() => {
    fetch('/api/chat')
      .then((r) => r.json())
      .then(setMode)
      .catch(() => setMode(null));
  }, []);
  return mode;
}

export function SettingsView({ isDesktop }: { isDesktop: boolean }) {
  const { user, configured, signOut, refresh } = useAuth();
  const mode = useMode();
  const [confirmClear, setConfirmClear] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const mod = isMac() ? '⌘' : 'Ctrl';

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      projects: useProjectStore.getState().projects,
      chats: useChatStore.getState().chats,
      messages: useChatStore.getState().messages,
      artifacts: useArtifactStore.getState().artifacts,
      versions: useArtifactStore.getState().versions,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLocal = () => {
    useChatStore.getState().reset();
    useArtifactStore.getState().reset();
    useProjectStore.getState().reset();
    useLayoutStore.getState().closePanel();
    setConfirmClear(false);
    toast.success(user ? 'Local data cleared. Your account data will reload.' : 'Local data cleared');
    if (user) void refresh();
  };

  const changeAvatar = async (file: File | undefined) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      await uploadAvatar(file, user.id);
      await refresh();
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ViewShell title="Settings" isDesktop={isDesktop}>
      <Section title="Appearance" description="Follow your system or pick a theme.">
        <ThemeSegmented />
      </Section>

      <Section title="Account" description={configured ? 'Sync chats and artifacts and share links.' : 'Supabase is not configured.'}>
        {user ? (
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => avatarInput.current?.click()} className="relative rounded-full" aria-label="Change avatar">
              <Avatar className="h-12 w-12">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{(user.name ?? user.email ?? '?')[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {uploading && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </span>
              )}
            </button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => void changeAvatar(e.target.files?.[0])} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user.name ?? user.email}</p>
              {user.name && <p className="truncate text-sm text-muted-foreground">{user.email}</p>}
            </div>
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut /> Sign out
            </Button>
          </div>
        ) : configured ? (
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Everything is saved in this browser. Add <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
            and <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable accounts.
          </p>
        )}
      </Section>

      <Section title="Model" description="Set on the server with environment variables.">
        {mode ? (
          mode.mode === 'anthropic' ? (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="success">Connected</Badge>
              <span className="font-mono text-xs">{mode.model}</span>
            </div>
          ) : (
            <div className="space-y-1.5 text-sm">
              <Badge variant="accent">Demo mode</Badge>
              <p className="text-muted-foreground">
                Add <code className="rounded bg-muted px-1 font-mono text-xs">ANTHROPIC_API_KEY</code> (and optionally{' '}
                <code className="rounded bg-muted px-1 font-mono text-xs">ANTHROPIC_MODEL</code>) to <code className="rounded bg-muted px-1 font-mono text-xs">.env.local</code> for real generation.
              </p>
            </div>
          )
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </Section>

      <Section title="Shortcuts">
        <dl className="grid max-w-md grid-cols-[1fr_auto] gap-y-2.5 text-sm">
          {[
            ['Send message', ['Enter']],
            ['New line', ['Shift', 'Enter']],
            ['New chat', [mod, 'Shift', 'O']],
            ['Toggle artifact panel', [mod, '.']],
            ['Save draft as version', [mod, 'S']],
          ].map(([label, keys]) => (
            <div key={label as string} className="contents">
              <dt className="text-muted-foreground">{label as string}</dt>
              <dd className="flex gap-1">
                {(keys as string[]).map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Data" description="Your local copy of chats, artifacts and versions.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download /> Export JSON
          </Button>
          <Button variant="outline" onClick={() => setConfirmClear(true)} className="text-destructive hover:text-destructive">
            <Trash2 /> Clear local data
          </Button>
        </div>
      </Section>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear local data?</DialogTitle>
            <DialogDescription>
              {user
                ? 'This clears the copy in this browser. Data synced to your account is kept and will reload.'
                : 'This permanently deletes every chat, artifact and version stored in this browser.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearLocal}>
              Clear data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ViewShell>
  );
}
