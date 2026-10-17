import { requireUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/artifacts/:id/versions — all versions, oldest first. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error, supabase } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const { data, error: dbError } = await supabase
    .from('artifact_versions')
    .select('*')
    .eq('artifact_id', id)
    .order('version', { ascending: true });
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
  return Response.json({ versions: data });
}

/**
 * POST /api/artifacts/:id/versions — append a version. Versions are immutable;
 * pass { restore_from: n } to append a copy of version n instead of new code.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { error, supabase } = await requireUser();
  if (error) return Response.json({ error: error.message }, { status: error.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid body.' }, { status: 400 });

  const { data: artifact } = await supabase.from('artifacts').select('id,current_version').eq('id', id).maybeSingle();
  if (!artifact) return Response.json({ error: 'Not found.' }, { status: 404 });

  let code: string | null = typeof body.code === 'string' ? body.code : null;
  let prompt: string | null = typeof body.prompt === 'string' ? body.prompt : null;

  if (typeof body.restore_from === 'number') {
    const { data: source } = await supabase
      .from('artifact_versions')
      .select('code')
      .eq('artifact_id', id)
      .eq('version', body.restore_from)
      .maybeSingle();
    if (!source) return Response.json({ error: `Version ${body.restore_from} not found.` }, { status: 404 });
    code = source.code;
    prompt = `Restored from v${body.restore_from}`;
  }
  if (code === null) return Response.json({ error: 'Expected { code, prompt? } or { restore_from }.' }, { status: 400 });

  const { data: version, error: dbError } = await supabase
    .from('artifact_versions')
    .insert({ artifact_id: id, version: artifact.current_version + 1, code, prompt })
    .select()
    .single();
  if (dbError) {
    const status = dbError.code === '23505' ? 409 : 500;
    return Response.json({ error: status === 409 ? 'Version conflict, retry.' : dbError.message }, { status });
  }
  return Response.json({ version }, { status: 201 });
}
