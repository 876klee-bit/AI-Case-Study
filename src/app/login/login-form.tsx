'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2, Github, Loader2, Mail } from 'lucide-react';
import { signInWithEmail, signInWithGitHub, type AuthResult } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function SubmitButton({ children, variant }: { children: React.ReactNode; variant?: 'default' | 'outline' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const [state, action] = useActionState<AuthResult | null, FormData>(signInWithEmail, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" />
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  const error = state && !state.ok ? state.message : initialError;

  return (
    <div className="space-y-4">
      <form action={signInWithGitHub}>
        <input type="hidden" name="next" value={next} />
        <SubmitButton variant="outline">
          <Github /> Continue with GitHub
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
        <SubmitButton>
          <Mail /> Send magic link
        </SubmitButton>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error === 'not-configured' ? 'Supabase is not configured.' : error}
        </p>
      )}
    </div>
  );
}
