'use client';

import { LogoMark } from '@/components/sidebar/logo';
import { useHydrated, useIsDesktop } from '@/hooks/use-media-query';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { DesktopLayout } from './desktop-layout';
import { MobileLayout } from './mobile-layout';

/**
 * Root of the app. Chats, artifacts and layout live in persisted client stores,
 * so the shell renders after hydration to avoid server/client mismatches.
 */
export function WorkspaceShell() {
  const hydrated = useHydrated();
  const isDesktop = useIsDesktop();
  useShortcuts();

  if (!hydrated) {
    return (
      <div className="grid h-dvh place-items-center bg-background">
        <LogoMark size={32} className="animate-pulse" />
      </div>
    );
  }

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
