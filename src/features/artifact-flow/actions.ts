'use client';

import { toast } from 'sonner';
import { removeArtifact, syncArtifact, syncVersion } from '@/services/supabase-sync';
import { useArtifactStore } from '@/store/useArtifactStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import type { ArtifactVersion } from '@/types';

function persist(artifactId: string, version: ArtifactVersion) {
  const artifact = useArtifactStore.getState().artifacts[artifactId];
  if (artifact) void syncArtifact(artifact).then(() => syncVersion(version));
}

/** Commit the Code tab draft as a new immutable version (⌘S / Save as version). */
export function saveDraftAsVersion(artifactId: string): ArtifactVersion | null {
  const store = useArtifactStore.getState();
  const artifact = store.artifacts[artifactId];
  if (!artifact || artifact.draft === null) return null;
  const version = store.commitVersion(artifactId, artifact.draft, 'Manual edit');
  persist(artifactId, version);
  toast.success(`Saved v${version.version}`);
  return version;
}

/** Restore never rewrites history: it appends a copy of `version` as the newest version. */
export function restoreArtifactVersion(artifactId: string, version: number): ArtifactVersion | null {
  const created = useArtifactStore.getState().restoreVersion(artifactId, version);
  if (!created) return null;
  persist(artifactId, created);
  useLayoutStore.getState().setViewingVersion(null);
  toast.success(`Restored v${version} as v${created.version}`);
  return created;
}

export function renameArtifact(artifactId: string, title: string) {
  const clean = title.trim();
  if (!clean) return;
  useArtifactStore.getState().updateArtifact(artifactId, { title: clean });
  const artifact = useArtifactStore.getState().artifacts[artifactId];
  if (artifact) void syncArtifact(artifact);
}

export function toggleArtifactFavorite(artifactId: string) {
  useArtifactStore.getState().toggleFavorite(artifactId);
  const artifact = useArtifactStore.getState().artifacts[artifactId];
  if (artifact) void syncArtifact(artifact);
}

export function deleteArtifact(artifactId: string) {
  useArtifactStore.getState().deleteArtifact(artifactId);
  void removeArtifact(artifactId);
}
