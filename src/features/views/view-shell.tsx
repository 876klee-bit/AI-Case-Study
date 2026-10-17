'use client';

import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/store/useLayoutStore';

export function ViewShell({
  title,
  description,
  actions,
  isDesktop,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  isDesktop: boolean;
  children: ReactNode;
}) {
  const setMobileNavOpen = useLayoutStore((s) => s.setMobileNavOpen);
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
        {!isDesktop && (
          <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
        )}
        <div className="flex-1" />
        <ThemeToggle />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-2 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
