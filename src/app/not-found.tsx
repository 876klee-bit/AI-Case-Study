import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface shadow-subtle">
        <Compass className="h-5 w-5 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">Nothing here</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This page doesn&apos;t exist, or the artifact you&apos;re looking for hasn&apos;t been shared.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Workspace</Link>
      </Button>
    </main>
  );
}
