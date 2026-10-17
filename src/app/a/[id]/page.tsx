import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ARTIFACT_META, normalizeArtifactType } from '@/lib/artifact-meta';
import { getServerSupabase } from '@/lib/supabase/server';
import { Logo } from '@/components/sidebar/logo';
import { SharedPreview } from './shared-preview';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public artifacts only: RLS returns nothing unless is_public is true (or you own it). */
async function loadShared(id: string) {
  if (!UUID_RE.test(id)) return null;
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id,title,type,is_public,current_version,updated_at')
    .eq('id', id)
    .eq('is_public', true)
    .maybeSingle();
  if (!artifact) return null;
  const { data: version } = await supabase
    .from('artifact_versions')
    .select('code,version')
    .eq('artifact_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!version) return null;
  return { artifact, version };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const shared = await loadShared(id);
  return shared ? { title: shared.artifact.title } : { title: 'Not found' };
}

export default async function SharedArtifactPage({ params }: Props) {
  const { id } = await params;
  const shared = await loadShared(id);
  if (!shared) notFound();

  const type = normalizeArtifactType(shared.artifact.type);
  const Icon = ARTIFACT_META[type].icon;

  return (
    <div className="flex h-dvh flex-col bg-sidebar">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
        <Link href="/" aria-label="Workspace home">
          <Logo size="sm" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h1 className="truncate text-sm font-medium">{shared.artifact.title}</h1>
        <span className="text-xs text-muted-foreground">v{shared.version.version}</span>
        <Link
          href="/"
          className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Make your own
        </Link>
      </header>
      <SharedPreview type={type} code={shared.version.code} title={shared.artifact.title} />
    </div>
  );
}
