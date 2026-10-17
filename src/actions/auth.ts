'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { siteUrl } from '@/lib/supabase/config';
import { getServerSupabase } from '@/lib/supabase/server';

export interface AuthResult {
  ok: boolean;
  message: string;
}

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return siteUrl(host ? `${proto}://${host}` : undefined);
}

function safeNext(next: string | null | undefined) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export async function signInWithEmail(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const email = String(formData.get('email') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Enter a valid email address.' };
  const next = safeNext(String(formData.get('next') ?? '/'));

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Check ${email} for a sign-in link.` };
}

export async function signInWithGitHub(formData: FormData) {
  const supabase = await getServerSupabase();
  if (!supabase) redirect('/login?error=not-configured');

  const next = safeNext(String(formData.get('next') ?? '/'));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? 'oauth')}`);
  redirect(data.url);
}

export async function signOut() {
  const supabase = await getServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect('/');
}
