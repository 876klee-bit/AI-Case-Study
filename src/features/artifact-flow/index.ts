'use client';

import { parseArtifactMessage } from '@/lib/artifact-parser';
import { selectChatArtifact, useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { syncArtifact, syncVersion } from '@/services/supabase-sync';
import type { ArtifactType } from '@/types';

interface FlowOptions {
  chatId: string;
  projectId: string | null;
  messageId: string;
  prompt: string;
}

/**
 * Drives one assistant reply through the artifact lifecycle:
 *   generate (open tag → create or reuse, Code tab) → save → version → preview.
 * Call `update(raw)` with the full reply text on every chunk, and `finish(raw)` once at the end.
 */
export function createArtifactFlow({ chatId, projectId, messageId, prompt }: FlowOptions) {
  let artifactId: string | null = null;
  let committed = false;

  const artifacts = () => useArtifactStore.getState();
  const layout = () => useLayoutStore.getState();
  const chats = () => useChatStore.getState();

  function start(type: ArtifactType, title: string) {
    const store = artifacts();
    const existing = selectChatArtifact(store, chatId);
    if (existing) {
      artifactId = existing.id;
      if (existing.title !== title || existing.type !== type) store.updateArtifact(existing.id, { title, type });
    } else {
      artifactId = store.createArtifact({ chatId, projectId, title, type }).id;
    }
    // Drop any stale draft: the new generation supersedes it.
    store.setDraft(artifactId, null);
    layout().setViewingVersion(null);
    layout().setCompareVersion(null);
    layout().openPanel('code');
    chats().updateMessage(chatId, messageId, { artifactId });
  }

  function commit(code: string) {
    if (!artifactId || committed) return;
    committed = true;
    const store = artifacts();
    store.setStreaming(artifactId, null);
    const version = store.commitVersion(artifactId, code, prompt);
    chats().updateMessage(chatId, messageId, { artifactVersion: version.version });
    layout().setPanelTab('preview');

    // Persist remotely: artifact row first (versions reference it), then the version.
    const artifact = artifacts().artifacts[artifactId];
    if (artifact) void syncArtifact(artifact).then(() => syncVersion(version));
  }

  return {
    get artifactId() {
      return artifactId;
    },

    update(raw: string) {
      const { artifact } = parseArtifactMessage(raw);
      if (!artifact) return;
      if (!artifactId) start(artifact.type, artifact.title);
      if (committed || !artifactId) return;
      if (artifact.complete) commit(artifact.code);
      else artifacts().setStreaming(artifactId, artifact.code);
    },

    /** End of stream (or abort). Keeps whatever arrived so nothing is lost. */
    finish(raw: string) {
      if (!artifactId || committed) return;
      const { artifact } = parseArtifactMessage(raw);
      const code = artifact?.code ?? artifacts().streaming[artifactId] ?? '';
      if (code.trim()) commit(code);
      else artifacts().setStreaming(artifactId, null);
    },
  };
}
