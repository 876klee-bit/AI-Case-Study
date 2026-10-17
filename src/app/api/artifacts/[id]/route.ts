import { requireUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/artifacts/:id — the artifact plus its latest version. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error, supabase } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const { data: artifact, error: dbError } = await supabase.from('artifacts').select('*').eq('id', id).maybeSingle();
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
  if (!artifact) return Response.json({ error: 'Not found.' }, { status: 404 });

  const { data: latest } = await supabase
    .from('artifact_versions')
    .select('*')
    .eq('artifact_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  return Response.json({ artifact, latest });
}

/** PATCH /api/artifacts/:id — update title, draft, favorite or public flag. */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const { error, supabase } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid body.' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string') patch.title = body.title.slice(0, 200);
  if (typeof body.draft === 'string' || body.draft === null) patch.draft = body.draft;
  if (typeof body.is_public === 'boolean') patch.is_public = body.is_public;
  if (typeof body.is_favorite === 'boolean') patch.is_favorite = body.is_favorite;
  if (Object.keys(patch).length === 0) return Response.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error: dbError } = await supabase.from('artifacts').update(patch).eq('id', id).select().maybeSingle();
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
  if (!data) return Response.json({ error: 'Not found.' }, { status: 404 });
  return Response.json({ artifact: data });
}

/** DELETE /api/artifacts/:id — delete the artifact and (by cascade) its versions. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error, supabase } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const { error: dbError } = await supabase.from('artifacts').delete().eq('id', id);
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
