-- Workspace schema: profiles, projects, chats, messages, artifacts, versions, files.
-- Every table is owned by a user and protected by row level security.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chat_id uuid references public.chats (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  type text not null check (type in (
    'react', 'nextjs', 'html', 'website', 'dashboard', 'document', 'spreadsheet', 'presentation'
  )),
  current_version integer not null default 0,
  draft text,
  is_public boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version integer not null check (version > 0),
  code text not null,
  prompt text,
  created_at timestamptz not null default now(),
  unique (artifact_id, version)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  artifact_id uuid references public.artifacts (id) on delete set null,
  artifact_version integer,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bucket text not null,
  path text not null,
  name text not null,
  size bigint not null default 0,
  mime_type text,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists chats_user_updated_idx on public.chats (user_id, updated_at desc);
create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at);
create index if not exists artifacts_user_updated_idx on public.artifacts (user_id, updated_at desc);
create index if not exists artifacts_chat_idx on public.artifacts (chat_id);
create index if not exists artifact_versions_artifact_idx on public.artifact_versions (artifact_id, version desc);
create index if not exists files_user_created_idx on public.files (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists chats_updated_at on public.chats;
create trigger chats_updated_at before update on public.chats
  for each row execute function public.set_updated_at();

drop trigger if exists artifacts_updated_at on public.artifacts;
create trigger artifacts_updated_at before update on public.artifacts
  for each row execute function public.set_updated_at();

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Versions are immutable: no updates, ever. Restoring appends a new version.
create or replace function public.prevent_version_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'artifact versions are immutable; insert a new version instead';
end;
$$;

drop trigger if exists artifact_versions_immutable on public.artifact_versions;
create trigger artifact_versions_immutable before update on public.artifact_versions
  for each row execute function public.prevent_version_update();

-- Keep artifacts.current_version pointing at the newest version.
create or replace function public.bump_artifact_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.artifacts
     set current_version = greatest(current_version, new.version),
         draft = null
   where id = new.artifact_id
     and user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists artifact_versions_bump on public.artifact_versions;
create trigger artifact_versions_bump after insert on public.artifact_versions
  for each row execute function public.bump_artifact_version();

-- Touch the chat when a message arrives so recent chats sort correctly.
create or replace function public.touch_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat after insert on public.messages
  for each row execute function public.touch_chat();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.artifacts enable row level security;
alter table public.artifact_versions enable row level security;
alter table public.files enable row level security;

drop policy if exists "profiles: owner read" on public.profiles;
create policy "profiles: owner read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "projects: owner all" on public.projects;
create policy "projects: owner all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chats: owner all" on public.chats;
create policy "chats: owner all" on public.chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages: owner all" on public.messages;
create policy "messages: owner all" on public.messages
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid())
  );

drop policy if exists "artifacts: owner all" on public.artifacts;
create policy "artifacts: owner all" on public.artifacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "artifacts: public read" on public.artifacts;
create policy "artifacts: public read" on public.artifacts
  for select using (is_public);

drop policy if exists "versions: owner read" on public.artifact_versions;
create policy "versions: owner read" on public.artifact_versions
  for select using (auth.uid() = user_id);
drop policy if exists "versions: owner insert" on public.artifact_versions;
create policy "versions: owner insert" on public.artifact_versions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.artifacts a where a.id = artifact_id and a.user_id = auth.uid())
  );
drop policy if exists "versions: owner delete" on public.artifact_versions;
create policy "versions: owner delete" on public.artifact_versions
  for delete using (auth.uid() = user_id);
drop policy if exists "versions: public read" on public.artifact_versions;
create policy "versions: public read" on public.artifact_versions
  for select using (
    exists (select 1 from public.artifacts a where a.id = artifact_id and a.is_public)
  );

drop policy if exists "files: owner all" on public.files;
create policy "files: owner all" on public.files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets: objects live under <user_id>/...
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('chat-attachments', 'chat-attachments', false),
  ('artifact-assets', 'artifact-assets', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "storage: owner read private" on storage.objects;
create policy "storage: owner read private" on storage.objects
  for select using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage: public read" on storage.objects;
create policy "storage: public read" on storage.objects
  for select using (bucket_id in ('artifact-assets', 'avatars'));

drop policy if exists "storage: owner insert" on storage.objects;
create policy "storage: owner insert" on storage.objects
  for insert with check (
    bucket_id in ('chat-attachments', 'artifact-assets', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage: owner update" on storage.objects;
create policy "storage: owner update" on storage.objects
  for update using (
    bucket_id in ('chat-attachments', 'artifact-assets', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage: owner delete" on storage.objects;
create policy "storage: owner delete" on storage.objects
  for delete using (
    bucket_id in ('chat-attachments', 'artifact-assets', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
