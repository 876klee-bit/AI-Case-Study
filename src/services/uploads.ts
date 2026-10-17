'use client';

import { getBrowserSupabase } from '@/lib/supabase/client';
import { uid, nowIso } from '@/lib/utils';
import type { StoredFile } from '@/types';
import type { DbFileRow } from '@/types/database';
import { fromDb } from './supabase-sync';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_ATTACHMENT_CHARS = 60_000;

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|ya?ml|xml|html?|css|js|jsx|ts|tsx|py|rb|go|rs|java|c|cpp|h|sql|sh|toml|ini|env)$/i;

export function isTextFile(file: File): boolean {
  return file.type.startsWith('text/') || file.type === 'application/json' || TEXT_EXT.test(file.name);
}

/** Read a text file for inclusion in a prompt. */
export async function readTextFile(file: File): Promise<string> {
  const text = await file.text();
  return text.length > MAX_TEXT_ATTACHMENT_CHARS ? `${text.slice(0, MAX_TEXT_ATTACHMENT_CHARS)}\n…(truncated)` : text;
}

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_').slice(-120);
}

/**
 * Store a file. Signed in: uploads to the private chat-attachments bucket under <user_id>/
 * and records it in the files table. Signed out: keeps text content locally.
 */
export async function storeFile(file: File, userId: string | null): Promise<StoredFile> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
  const text = isTextFile(file) ? await readTextFile(file) : null;
  const sb = getBrowserSupabase();

  if (!sb || !userId) {
    return {
      id: uid(),
      name: file.name,
      size: file.size,
      mimeType: file.type || null,
      bucket: null,
      path: null,
      createdAt: nowIso(),
      text,
    };
  }

  const path = `${userId}/${uid()}-${safeName(file.name)}`;
  const { error: uploadError } = await sb.storage
    .from('chat-attachments')
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await sb
    .from('files')
    .insert({ bucket: 'chat-attachments', path, name: file.name, size: file.size, mime_type: file.type || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ...fromDb.file(data as DbFileRow), text };
}

export async function fileUrl(f: StoredFile): Promise<string | null> {
  const sb = getBrowserSupabase();
  if (!sb || !f.bucket || !f.path) return null;
  if (f.bucket === 'chat-attachments') {
    const { data } = await sb.storage.from(f.bucket).createSignedUrl(f.path, 60 * 10);
    return data?.signedUrl ?? null;
  }
  return sb.storage.from(f.bucket).getPublicUrl(f.path).data.publicUrl;
}

export async function deleteStoredFile(f: StoredFile): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb || !f.bucket || !f.path) return;
  await sb.storage.from(f.bucket).remove([f.path]);
  await sb.from('files').delete().eq('id', f.id);
}

/** Upload a new avatar to the public avatars bucket and return its URL. */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const sb = getBrowserSupabase();
  if (!sb) throw new Error('Supabase is not configured.');
  const path = `${userId}/avatar-${Date.now()}-${safeName(file.name)}`;
  const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  await sb.from('profiles').update({ avatar_url: url }).eq('id', userId);
  await sb.auth.updateUser({ data: { avatar_url: url } });
  return url;
}
