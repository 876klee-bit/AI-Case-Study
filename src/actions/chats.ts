'use server';

import { getServerSupabase } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function renameChatAction(id: string, title: string): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
  const clean = title.trim().slice(0, 120) || 'Untitled chat';
  const { error } = await supabase.from('chats').update({ title: clean }).eq('id', id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteChatAction(id: string): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
  await supabase.from('artifacts').delete().eq('chat_id', id);
  const { error } = await supabase.from('chats').delete().eq('id', id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function moveChatAction(id: string, projectId: string | null): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
  const { error } = await supabase.from('chats').update({ project_id: projectId }).eq('id', id);
  return error ? { ok: false, message: error.message } : { ok: true };
}
