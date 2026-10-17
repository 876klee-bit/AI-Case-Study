// Placeholder. Run `npm run db:types` against your Supabase project to replace this file
// with generated types, then pass `Database` to the Supabase client factories in src/lib/supabase.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface DbArtifactRow {
  id: string;
  user_id: string;
  chat_id: string | null;
  project_id: string | null;
  title: string;
  type: string;
  current_version: number;
  draft: string | null;
  is_public: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbArtifactVersionRow {
  id: string;
  artifact_id: string;
  user_id: string;
  version: number;
  code: string;
  prompt: string | null;
  created_at: string;
}

export interface DbChatRow {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessageRow {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  artifact_id: string | null;
  artifact_version: number | null;
  created_at: string;
}

export interface DbProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFileRow {
  id: string;
  user_id: string;
  bucket: string;
  path: string;
  name: string;
  size: number;
  mime_type: string | null;
  created_at: string;
}
