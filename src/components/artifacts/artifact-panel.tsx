'use client';

import { Shapes } from 'lucide-react';
import { EmptyState } from '@/components/ui/misc';
import { selectChatArtifact, useArtifactStore, workingCode } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ArtifactTabs } from './artifact-tabs';
import { CodeTab } from './code-tab';
import { PreviewTab } from './preview-tab';
import { VersionsTab } from './versions-tab';

export function ArtifactPanel() {
  const chatId = useChatStore((s) => s.activeChatId);
  const artifact = useArtifactStore((s) => selectChatArtifact(s, chatId));
  const code = useArtifactStore((s) => (artifact ? workingCode(s, artifact.id) : ''));
  const streaming = useArtifactStore((s) => (artifact ? artifact.id in s.streaming : false));
  const versionCount = useArtifactStore((s) => (artifact ? s.versions[artifact.id]?.length ?? 0 : 0));
  // While a new version streams, keep previewing the last saved one instead of half-written code.
  const lastSaved = useArtifactStore((s) => (artifact ? s.versions[artifact.id]?.at(-1)?.code ?? '' : ''));
  const tab = useLayoutStore((s) => s.panelTab);
  const closePanel = useLayoutStore((s) => s.closePanel);

  if (!artifact) {
    return (
      <div className="flex h-full flex-col bg-surface">
        <EmptyState
          icon={Shapes}
          title="No artifact in this chat"
          description="Ask for an app, dashboard, website, document, spreadsheet or presentation and it will appear here."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <ArtifactTabs artifact={artifact} versionCount={versionCount} onClose={closePanel} />
      <div className="min-h-0 flex-1">
        {tab === 'preview' &&
          (streaming && versionCount === 0 ? (
            <StreamingPlaceholder />
          ) : (
            <PreviewTab artifact={artifact} code={streaming ? lastSaved : code} streaming={streaming} />
          ))}
        {tab === 'code' && <CodeTab artifact={artifact} code={code} streaming={streaming} />}
        {tab === 'versions' && <VersionsTab artifact={artifact} />}
      </div>
    </div>
  );
}

function StreamingPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-shimmer rounded-full bg-brand" />
      </div>
      Building the preview…
    </div>
  );
}
