import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server client bound to the request cookies. Every query runs as the signed-in user,
 * so row level security applies. Returns null when Supabase isn't configured.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware
          // refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** Resolve the signed-in user for an API route, or a ready-made error response. */
export async function requireUser() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return { error: { status: 501, message: 'Supabase is not configured.' } as const, supabase: null, user: null };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { status: 401, message: 'Sign in required.' } as const, supabase, user: null };
  return { error: null, supabase, user };
}
