import { isArtifactType } from '@/lib/artifact-meta';
import { requireUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** GET /api/artifacts — list the signed-in user's artifacts, newest first. */
export async function GET(req: Request) {
  const { error, supabase, user } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const chatId = url.searchParams.get('chat_id');

  let query = supabase.from('artifacts').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(limit);
  if (chatId) query = query.eq('chat_id', chatId);
  const { data, error: dbError } = await query;
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
  return Response.json({ artifacts: data });
}

/** POST /api/artifacts — create an artifact with its first version. */
export async function POST(req: Request) {
  const { error, supabase } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || !isArtifactType(body.type) || typeof body.code !== 'string') {
    return Response.json({ error: 'Expected { title, type, code, prompt?, chat_id?, project_id? }.' }, { status: 400 });
  }

  const { data: artifact, error: insertError } = await supabase
    .from('artifacts')
    .insert({
      title: body.title.slice(0, 200),
      type: body.type,
      chat_id: body.chat_id ?? null,
      project_id: body.project_id ?? null,
    })
    .select()
    .single();
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  const { data: version, error: versionError } = await supabase
    .from('artifact_versions')
    .insert({ artifact_id: artifact.id, version: 1, code: body.code, prompt: body.prompt ?? null })
    .select()
    .single();
  if (versionError) return Response.json({ error: versionError.message }, { status: 500 });

  return Response.json({ artifact: { ...artifact, current_version: 1 }, version }, { status: 201 });
}
