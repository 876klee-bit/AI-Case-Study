'use server';

import { getServerSupabase } from '@/lib/supabase/server';

export interface PublishResult {
  ok: boolean;
  message?: string;
}

/**
 * Publish an artifact so /a/<id> resolves for anyone. The artifact must already be
 * synced to Supabase; RLS ensures only the owner can flip the flag.
 */
export async function setArtifactPublic(id: string, isPublic: boolean): Promise<PublishResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in to share artifacts.' };

  const { data, error } = await supabase
    .from('artifacts')
    .update({ is_public: isPublic })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: 'Artifact not found. Try again in a moment.' };
  return { ok: true };
}

export async function renameArtifact(id: string, title: string): Promise<PublishResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
  const { error } = await supabase.from('artifacts').update({ title: title.slice(0, 200) }).eq('id', id);
  return error ? { ok: false, message: error.message } : { ok: true };
}
