import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Artifact, ArtifactType, ArtifactVersion } from '@/types';
import { nowIso, uid } from '@/lib/utils';
import { safeStorage } from './storage';

interface CreateArtifactInput {
  chatId: string | null;
  projectId: string | null;
  title: string;
  type: ArtifactType;
}

interface ArtifactState {
  artifacts: Record<string, Artifact>;
  versions: Record<string, ArtifactVersion[]>;
  /** Code streaming in for an artifact, keyed by artifact id. Not persisted. */
  streaming: Record<string, string>;

  createArtifact: (input: CreateArtifactInput) => Artifact;
  updateArtifact: (id: string, patch: Partial<Artifact>) => void;
  setStreaming: (id: string, code: string | null) => void;
  /** Append an immutable version. Returns it. */
  commitVersion: (id: string, code: string, prompt: string | null) => ArtifactVersion;
  setDraft: (id: string, draft: string | null) => void;
  /** Restore never rewrites history: it appends a copy as the newest version. */
  restoreVersion: (id: string, version: number) => ArtifactVersion | null;
  toggleFavorite: (id: string) => void;
  deleteArtifact: (id: string) => void;
  deleteForChat: (chatId: string) => void;
  mergeRemote: (artifacts: Artifact[], versions: Record<string, ArtifactVersion[]>) => void;
  reset: () => void;
}

export const useArtifactStore = create<ArtifactState>()(
  persist(
    (set, get) => ({
      artifacts: {},
      versions: {},
      streaming: {},

      createArtifact: ({ chatId, projectId, title, type }) => {
        const now = nowIso();
        const artifact: Artifact = {
          id: uid(),
          chatId,
          projectId,
          title,
          type,
          currentVersion: 0,
          draft: null,
          isPublic: false,
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          artifacts: { ...s.artifacts, [artifact.id]: artifact },
          versions: { ...s.versions, [artifact.id]: [] },
        }));
        return artifact;
      },

      updateArtifact: (id, patch) =>
        set((s) => {
          const current = s.artifacts[id];
          if (!current) return s;
          return { artifacts: { ...s.artifacts, [id]: { ...current, ...patch, updatedAt: nowIso() } } };
        }),

      setStreaming: (id, code) =>
        set((s) => {
          const streaming = { ...s.streaming };
          if (code === null) delete streaming[id];
          else streaming[id] = code;
          return { streaming };
        }),

      commitVersion: (id, code, prompt) => {
        const list = get().versions[id] ?? [];
        const next = (list.at(-1)?.version ?? 0) + 1;
        const version: ArtifactVersion = { id: uid(), artifactId: id, version: next, code, prompt, createdAt: nowIso() };
        set((s) => {
          const artifact = s.artifacts[id];
          return {
            versions: { ...s.versions, [id]: [...(s.versions[id] ?? []), version] },
            artifacts: artifact
              ? { ...s.artifacts, [id]: { ...artifact, currentVersion: next, draft: null, updatedAt: version.createdAt } }
              : s.artifacts,
          };
        });
        return version;
      },

      setDraft: (id, draft) =>
        set((s) => {
          const artifact = s.artifacts[id];
          if (!artifact) return s;
          const latest = s.versions[id]?.at(-1)?.code ?? '';
          return {
            artifacts: { ...s.artifacts, [id]: { ...artifact, draft: draft === latest ? null : draft } },
          };
        }),

      restoreVersion: (id, version) => {
        const source = get().versions[id]?.find((v) => v.version === version);
        if (!source) return null;
        return get().commitVersion(id, source.code, `Restored from v${version}`);
      },

      toggleFavorite: (id) =>
        set((s) => {
          const a = s.artifacts[id];
          if (!a) return s;
          return { artifacts: { ...s.artifacts, [id]: { ...a, isFavorite: !a.isFavorite } } };
        }),

      deleteArtifact: (id) =>
        set((s) => {
          const artifacts = { ...s.artifacts };
          const versions = { ...s.versions };
          delete artifacts[id];
          delete versions[id];
          return { artifacts, versions };
        }),

      deleteForChat: (chatId) =>
        set((s) => {
          const artifacts = { ...s.artifacts };
          const versions = { ...s.versions };
          Object.values(artifacts).forEach((a) => {
            if (a.chatId === chatId) {
              delete artifacts[a.id];
              delete versions[a.id];
            }
          });
          return { artifacts, versions };
        }),

      mergeRemote: (artifacts, versions) =>
        set((s) => {
          const merged = { ...s.artifacts };
          artifacts.forEach((a) => {
            const local = merged[a.id];
            // Keep an unsaved local draft if the remote one is empty.
            merged[a.id] = local && local.draft && !a.draft ? { ...a, draft: local.draft } : a;
          });
          const mergedVersions = { ...s.versions };
          Object.entries(versions).forEach(([artifactId, list]) => {
            const byVersion = new Map((mergedVersions[artifactId] ?? []).map((v) => [v.version, v]));
            list.forEach((v) => byVersion.set(v.version, v));
            mergedVersions[artifactId] = [...byVersion.values()].sort((a, b) => a.version - b.version);
          });
          return { artifacts: merged, versions: mergedVersions };
        }),

      reset: () => set({ artifacts: {}, versions: {}, streaming: {} }),
    }),
    {
      name: 'workspace-artifacts',
      storage: safeStorage,
      version: 1,
      partialize: (s) => ({ artifacts: s.artifacts, versions: s.versions }),
    },
  ),
);

/* ---------- selectors ---------- */

export function selectChatArtifact(state: ArtifactState, chatId: string | null): Artifact | null {
  if (!chatId) return null;
  let found: Artifact | null = null;
  for (const a of Object.values(state.artifacts)) {
    if (a.chatId === chatId && (!found || a.createdAt > found.createdAt)) found = a;
  }
  return found;
}

export function latestVersion(state: ArtifactState, id: string): ArtifactVersion | null {
  return state.versions[id]?.at(-1) ?? null;
}

/** What the editor and preview should show: streaming code, then draft, then latest version. */
export function workingCode(state: ArtifactState, id: string): string {
  if (id in state.streaming) return state.streaming[id];
  const artifact = state.artifacts[id];
  if (artifact?.draft != null) return artifact.draft;
  return latestVersion(state, id)?.code ?? '';
}
