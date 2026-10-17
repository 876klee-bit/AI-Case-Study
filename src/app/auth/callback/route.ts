import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

/** Exchanges the OAuth / magic-link code for a session cookie, then redirects. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const base =
    process.env.NODE_ENV !== 'development' && forwardedHost ? `https://${forwardedHost}` : url.origin;

  const supabase = await getServerSupabase();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${next}`);
    return NextResponse.redirect(`${base}/login?error=${encodeURIComponent(error.message)}`);
  }

  const description = url.searchParams.get('error_description');
  return NextResponse.redirect(`${base}/login?error=${encodeURIComponent(description ?? 'missing-code')}`);
}
