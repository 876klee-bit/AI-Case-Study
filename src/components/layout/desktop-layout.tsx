'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ArtifactPanel } from '@/components/artifacts/artifact-panel';
import { ChatView } from '@/components/chat/chat-view';
import { Sidebar } from '@/components/sidebar/sidebar';
import { selectChatArtifact, useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { SecondaryView } from './main-content';

function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-px bg-border transition-colors data-[resize-handle-state=drag]:bg-brand data-[resize-handle-state=hover]:bg-foreground/30">
      <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
    </PanelResizeHandle>
  );
}

export function DesktopLayout() {
  const view = useLayoutStore((s) => s.view);
  const panelOpen = useLayoutStore((s) => s.panelOpen);
  const chatId = useChatStore((s) => s.activeChatId);
  const hasArtifact = useArtifactStore((s) => !!selectChatArtifact(s, chatId));
  const showPanel = view === 'chat' && panelOpen && hasArtifact;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1">
        {view === 'chat' ? (
          <PanelGroup direction="horizontal" autoSaveId="workspace-split">
            <Panel id="chat" order={1} minSize={28} defaultSize={showPanel ? 42 : 100}>
              <ChatView isDesktop />
            </Panel>
            {showPanel && (
              <>
                <ResizeHandle />
                <Panel id="artifact" order={2} minSize={32} defaultSize={58}>
                  <ArtifactPanel />
                </Panel>
              </>
            )}
          </PanelGroup>
        ) : (
          <SecondaryView isDesktop />
        )}
      </main>
    </div>
  );
}
