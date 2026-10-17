# Workspace

An AI workspace with a chat on the left and a live artifact panel on the right. Ask for an app,
dashboard, website, document, spreadsheet or presentation and it streams into a sandboxed preview
with a Monaco code editor and full version history.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion,
Zustand, Monaco Editor and Supabase.

## Folder structure

```
supabase/
  migrations/0001_workspace_schema.sql   tables, RLS, triggers, storage buckets
src/
  app/
    layout.tsx, page.tsx, globals.css, not-found.tsx
    login/                               magic link + GitHub sign-in
    auth/callback/route.ts               OAuth / magic-link code exchange
    a/[id]/                              public share page for published artifacts
    api/chat/route.ts                    streaming chat (Anthropic, or demo stream)
    api/artifacts/...                    REST: list, create, read, update, delete, versions
  components/
    layout/      workspace shell, resizable desktop layout, mobile layout, theme toggle
    sidebar/     logo, navigation, recent chats, user card
    chat/        header, message list, markdown, artifact card, typing indicator, prompt bar
    artifacts/   panel, tabs, preview (iframe + toolbar), code tab, versions + diff
    editor/      Monaco wrapper, toolbar, diff viewer, themes
    providers/   theme, auth, tooltip, toasts
    ui/          shadcn/ui primitives
  features/      artifact flow + views for Projects, Artifacts, Files, Templates, Favorites, Settings
  store/         useChatStore, useArtifactStore, useProjectStore, useLayoutStore
  hooks/         chat streaming, auto-scroll, speech input, shortcuts, media queries
  lib/           artifact parser and metadata, preview builder, AI prompt + demo templates, Supabase clients
  services/      chat streaming client, Supabase sync and uploads
  actions/       server actions for auth, chats and artifacts
  types/         shared types
  middleware.ts  Supabase session refresh and optional auth gate
```

## How the artifact flow works

1. **Generate.** The model replies with `<artifact type="…" title="…">…</artifact>`. As soon as the
   opening tag streams in, `features/artifact-flow` creates the artifact (or reuses the chat’s
   existing one) and the panel opens on the Code tab, showing code as it arrives.
2. **Save.** When the closing tag arrives the artifact is persisted locally and, if signed in, to Supabase.
3. **Version.** An immutable version is appended with the prompt that produced it.
4. **Preview.** The panel switches to the Preview tab.

Preview runtimes, all inside a sandboxed iframe with an opaque origin:

| Artifact type | Runtime |
| --- | --- |
| React app, Next.js app | Babel-transpiled TSX, React 18 UMD, Tailwind CDN, lucide-react, shims for `next/link`, `next/image`, `next/navigation` |
| HTML app | Document as written (Tailwind CDN added to fragments) |
| Website, Dashboard | HTML or React, detected from the code |
| Document | Markdown |
| Spreadsheet | CSV rendered as an editable grid |
| Presentation | Markdown slides split on `---`, arrow-key navigation |

Edits in the Code tab auto-save as a draft (the preview updates live). **Save as version** or
⌘S commits the draft. **Restore** never rewrites history; it appends a copy as the newest version.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no keys set, everything still works: data lives in `localStorage` and the chat route streams
built-in demo artifacts (try “Build a task manager”). Add `ANTHROPIC_API_KEY` for real generation.

Shortcuts: Enter sends, Shift+Enter adds a line, ⌘⇧O starts a new chat, ⌘. toggles the artifact panel.

## Set up Supabase

1. Create a project at supabase.com and copy the URL and anon key into `.env.local`.
2. Apply the schema, either with the CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   or by pasting `supabase/migrations/0001_workspace_schema.sql` into the SQL editor.
3. In Authentication → URL configuration, set the site URL and add
   `http://localhost:3000/auth/callback` plus your production `/auth/callback` to redirect URLs.
4. Optional: enable the GitHub provider under Authentication → Providers.
5. Optional: generate typed clients with `npm run db:types`.

The migration creates three storage buckets: `chat-attachments` (private), `artifact-assets`
(public) and `avatars` (public). Objects live under `<user_id>/…`, and RLS limits writes to the owner.

## Deploy to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optional), `NEXT_PUBLIC_SITE_URL` (your production URL),
   and `REQUIRE_AUTH=true` if signed-out visitors should be sent to `/login`.
3. Deploy. The chat route runs on the Node.js runtime with `maxDuration = 300` for long generations;
   on plans with shorter limits, lower it in `src/app/api/chat/route.ts`.
4. Add the production callback URL to Supabase Auth redirect URLs.

### Self-hosting

```bash
npm run build
npm start
```

Any Node 20+ host works. Put it behind a proxy that does not buffer responses so streaming stays
smooth (the chat route sends `X-Accel-Buffering: no` for nginx).

## Security notes

- Previews run in `sandbox="allow-scripts …"` without `allow-same-origin`, so generated code cannot
  read cookies, storage or the parent page.
- Shared links (`/a/<id>`) only resolve once the owner publishes the artifact via **Copy link**,
  which sets `is_public` under RLS.
- The service role key is never used; every query runs as the signed-in user.
