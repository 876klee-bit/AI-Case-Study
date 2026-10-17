'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as 'light' | 'dark' | undefined) ?? 'system'}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-border bg-popover text-popover-foreground shadow-float text-sm',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
