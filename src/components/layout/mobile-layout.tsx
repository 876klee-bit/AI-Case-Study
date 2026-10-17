'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Shapes } from 'lucide-react';
import { ArtifactPanel } from '@/components/artifacts/artifact-panel';
import { Sidebar } from '@/components/sidebar/sidebar';
import { Dialog, DialogTitle, SheetContent } from '@/components/ui/dialog';
import { ARTIFACT_META } from '@/lib/artifact-meta';
import { selectChatArtifact, useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SecondaryView } from './main-content';

/** Below 1024px: drawer navigation, chat full screen, artifact as a full-screen sheet. */
export function MobileLayout() {
  const view = useLayoutStore((s) => s.view);
  const navOpen = useLayoutStore((s) => s.mobileNavOpen);
  const setNavOpen = useLayoutStore((s) => s.setMobileNavOpen);
  const panelOpen = useLayoutStore((s) => s.panelOpen);
  const openPanel = useLayoutStore((s) => s.openPanel);
  const chatId = useChatStore((s) => s.activeChatId);
  const artifact = useArtifactStore((s) => selectChatArtifact(s, chatId));
  const streaming = useArtifactStore((s) => (artifact ? artifact.id in s.streaming : false));
  const showPanel = view === 'chat' && panelOpen && !!artifact;
  const Icon = artifact ? ARTIFACT_META[artifact.type].icon : Shapes;

  return (
    <div className="relative h-dvh overflow-hidden">
      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent aria-describedby={undefined}>
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <Sidebar mobile />
        </SheetContent>
      </Dialog>

      <SecondaryView isDesktop={false} />

      {view === 'chat' && artifact && !panelOpen && (
        <button
          onClick={() => openPanel()}
          className="absolute bottom-28 right-4 z-10 flex items-center gap-2 rounded-full border border-border bg-surface py-2 pl-3 pr-4 text-sm font-medium shadow-float"
        >
          <Icon className={streaming ? 'h-4 w-4 animate-pulse text-brand' : 'h-4 w-4'} />
          <span className="max-w-[160px] truncate">{artifact.title}</span>
        </button>
      )}

      <AnimatePresence>
        {showPanel && (
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute inset-0 z-20 pt-[env(safe-area-inset-top)]"
          >
            <ArtifactPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
