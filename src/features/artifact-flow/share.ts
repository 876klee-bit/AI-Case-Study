'use client';

import { toast } from 'sonner';
import { setArtifactPublic } from '@/actions/artifacts';
import { isSupabaseConfigured, siteUrl } from '@/lib/supabase/config';
import { isSyncEnabled, syncArtifactFull } from '@/services/supabase-sync';
import { useArtifactStore } from '@/store/useArtifactStore';

export function shareUrl(id: string) {
  return `${siteUrl(typeof window !== 'undefined' ? window.location.origin : undefined)}/a/${id}`;
}

/**
 * "Copy link": push the artifact and its versions, set is_public under RLS,
 * then copy /a/<id>. Requires Supabase and a signed-in user.
 */
export async function publishAndCopyLink(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    toast.error('Sharing needs Supabase', { description: 'Add your Supabase URL and anon key to .env.local.' });
    return false;
  }
  if (!isSyncEnabled()) {
    toast.error('Sign in to share', {
      action: { label: 'Sign in', onClick: () => (window.location.href = '/login') },
    });
    return false;
  }

  const state = useArtifactStore.getState();
  const artifact = state.artifacts[id];
  const versions = state.versions[id] ?? [];
  if (!artifact || versions.length === 0) {
    toast.error('Save a version before sharing.');
    return false;
  }

  const pending = toast.loading('Publishing…');
  try {
    await syncArtifactFull(artifact, versions);
    const result = await setArtifactPublic(id, true);
    if (!result.ok) throw new Error(result.message);
    useArtifactStore.getState().updateArtifact(id, { isPublic: true });
    const url = shareUrl(id);
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Link copied', { id: pending, description: url });
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not publish.', { id: pending });
    return false;
  }
}

export async function unpublish(id: string): Promise<void> {
  const result = await setArtifactPublic(id, false);
  if (!result.ok) {
    toast.error(result.message ?? 'Could not unpublish.');
    return;
  }
  useArtifactStore.getState().updateArtifact(id, { isPublic: false });
  toast.success('Link disabled');
}
