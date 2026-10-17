'use client';

import { getBrowserSupabase } from '@/lib/supabase/client';
import { normalizeArtifactType } from '@/lib/artifact-meta';
import type { Artifact, ArtifactVersion, Chat, Message, Project, StoredFile } from '@/types';
import type {
  DbArtifactRow,
  DbArtifactVersionRow,
  DbChatRow,
  DbFileRow,
  DbMessageRow,
  DbProjectRow,
} from '@/types/database';

/*
 * Local stores are the source of truth for the UI. When a user is signed in, every change is
 * mirrored to Supabase in the background; failures are logged, never thrown at the UI.
 */

let signedInUserId: string | null = null;

export function setSyncUser(userId: string | null) {
  signedInUserId = userId;
}

export function isSyncEnabled(): boolean {
  return !!signedInUserId && !!getBrowserSupabase();
}

function client() {
  if (!signedInUserId) return null;
  return getBrowserSupabase();
}

function report(scope: string, error: unknown) {
  if (error) console.warn(`[sync] ${scope}:`, error);
}

/* ---------- mappers ---------- */

export const fromDb = {
  chat: (r: DbChatRow): Chat => ({
    id: r.id,
    title: r.title,
    projectId: r.project_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  message: (r: DbMessageRow): Message => ({
    id: r.id,
    chatId: r.chat_id,
    role: r.role,
    content: r.content,
    artifactId: r.artifact_id,
    artifactVersion: r.artifact_version,
    createdAt: r.created_at,
  }),
  artifact: (r: DbArtifactRow): Artifact => ({
    id: r.id,
    chatId: r.chat_id,
    projectId: r.project_id,
    title: r.title,
    type: normalizeArtifactType(r.type),
    currentVersion: r.current_version,
    draft: r.draft,
    isPublic: r.is_public,
    isFavorite: r.is_favorite,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  version: (r: DbArtifactVersionRow): ArtifactVersion => ({
    id: r.id,
    artifactId: r.artifact_id,
    version: r.version,
    code: r.code,
    prompt: r.prompt,
    createdAt: r.created_at,
  }),
  project: (r: DbProjectRow): Project => ({
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  file: (r: DbFileRow): StoredFile => ({
    id: r.id,
    name: r.name,
    size: r.size,
    mimeType: r.mime_type,
    bucket: r.bucket,
    path: r.path,
    createdAt: r.created_at,
  }),
};

/* ---------- writes ---------- */

export async function syncProject(p: Project) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('projects').upsert({
    id: p.id,
    name: p.name,
    description: p.description,
    created_at: p.createdAt,
  });
  report('project', error);
}

export async function removeProject(id: string) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('projects').delete().eq('id', id);
  report('delete project', error);
}

export async function syncChat(c: Chat) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('chats').upsert({
    id: c.id,
    title: c.title,
    project_id: c.projectId,
    created_at: c.createdAt,
  });
  report('chat', error);
}

export async function removeChat(id: string) {
  const sb = client();
  if (!sb) return;
  // Artifacts keep chat_id via "on delete set null"; delete them too so the chat goes away cleanly.
  await sb.from('artifacts').delete().eq('chat_id', id);
  const { error } = await sb.from('chats').delete().eq('id', id);
  report('delete chat', error);
}

export async function syncMessage(m: Message) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('messages').upsert({
    id: m.id,
    chat_id: m.chatId,
    role: m.role,
    content: m.content,
    artifact_id: m.artifactId ?? null,
    artifact_version: m.artifactVersion ?? null,
    created_at: m.createdAt,
  });
  report('message', error);
}

export async function syncArtifact(a: Artifact) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('artifacts').upsert({
    id: a.id,
    chat_id: a.chatId,
    project_id: a.projectId,
    title: a.title,
    type: a.type,
    current_version: a.currentVersion,
    draft: a.draft,
    is_public: a.isPublic,
    is_favorite: a.isFavorite,
    created_at: a.createdAt,
  });
  report('artifact', error);
}

export async function removeArtifact(id: string) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('artifacts').delete().eq('id', id);
  report('delete artifact', error);
}

/** Versions are insert-only; a duplicate (artifact_id, version) is ignored. */
export async function syncVersion(v: ArtifactVersion) {
  const sb = client();
  if (!sb) return;
  const { error } = await sb.from('artifact_versions').upsert(
    {
      id: v.id,
      artifact_id: v.artifactId,
      version: v.version,
      code: v.code,
      prompt: v.prompt,
      created_at: v.createdAt,
    },
    { onConflict: 'artifact_id,version', ignoreDuplicates: true },
  );
  report('version', error);
}

/** Push an artifact and all of its versions (used before publishing). */
export async function syncArtifactFull(a: Artifact, versions: ArtifactVersion[]) {
  await syncArtifact(a);
  for (const v of versions) await syncVersion(v);
}

/* ---------- reads ---------- */

export interface RemoteSnapshot {
  projects: Project[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  artifacts: Artifact[];
  versions: Record<string, ArtifactVersion[]>;
  files: StoredFile[];
}

export async function loadRemote(): Promise<RemoteSnapshot | null> {
  const sb = client();
  if (!sb) return null;
  const [projects, chats, messages, artifacts, versions, files] = await Promise.all([
    sb.from('projects').select('*').order('updated_at', { ascending: false }),
    sb.from('chats').select('*').order('updated_at', { ascending: false }).limit(200),
    sb.from('messages').select('*').order('created_at', { ascending: true }).limit(5000),
    sb.from('artifacts').select('*').eq('user_id', signedInUserId!).order('updated_at', { ascending: false }),
    sb.from('artifact_versions').select('*').eq('user_id', signedInUserId!).order('version', { ascending: true }),
    sb.from('files').select('*').order('created_at', { ascending: false }),
  ]);
  [projects, chats, messages, artifacts, versions, files].forEach((r, i) => report(`load ${i}`, r.error));

  const msgMap: Record<string, Message[]> = {};
  ((messages.data ?? []) as DbMessageRow[]).forEach((r) => {
    (msgMap[r.chat_id] ??= []).push(fromDb.message(r));
  });
  const versionMap: Record<string, ArtifactVersion[]> = {};
  ((versions.data ?? []) as DbArtifactVersionRow[]).forEach((r) => {
    (versionMap[r.artifact_id] ??= []).push(fromDb.version(r));
  });

  return {
    projects: ((projects.data ?? []) as DbProjectRow[]).map(fromDb.project),
    chats: ((chats.data ?? []) as DbChatRow[]).map(fromDb.chat),
    messages: msgMap,
    artifacts: ((artifacts.data ?? []) as DbArtifactRow[]).map(fromDb.artifact),
    versions: versionMap,
    files: ((files.data ?? []) as DbFileRow[]).map(fromDb.file),
  };
}
