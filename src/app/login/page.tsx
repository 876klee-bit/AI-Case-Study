import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/sidebar/logo';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const requireAuth = process.env.REQUIRE_AUTH === 'true';

  return (
    <main className="relative flex min-h-full items-center justify-center bg-sidebar px-4 py-16">
      {!requireAuth && (
        <Link
          href="/"
          className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      )}
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-xl font-semibold tracking-tight">Sign in to Workspace</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sync chats and artifacts across devices and share links.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-float">
          {isSupabaseConfigured ? (
            <LoginForm next={next ?? '/'} initialError={error ?? null} />
          ) : (
            <div className="space-y-3 text-sm">
              <p className="font-medium">Supabase isn&apos;t configured yet.</p>
              <p className="text-muted-foreground">
                Add <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
                <code className="rounded bg-muted px-1 font-mono text-xs">.env.local</code> to enable sign-in. Until then,
                everything is saved in this browser.
              </p>
              <Link href="/" className="inline-block font-medium underline underline-offset-4">
                Continue without an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
