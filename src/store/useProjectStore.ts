import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/types';
import { nowIso, uid } from '@/lib/utils';
import { safeStorage } from './storage';

interface ProjectState {
  projects: Project[];
  /** New chats are created inside this project. Null means no project. */
  activeProjectId: string | null;
  createProject: (name: string, description?: string | null) => Project;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'description'>>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  mergeRemote: (projects: Project[]) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name, description = null) => {
        const now = nowIso();
        const project: Project = { id: uid(), name, description, createdAt: now, updatedAt: now };
        set((s) => ({ projects: [project, ...s.projects] }));
        return project;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p)),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),

      mergeRemote: (projects) =>
        set((s) => {
          const byId = new Map(s.projects.map((p) => [p.id, p]));
          projects.forEach((p) => byId.set(p.id, p));
          return { projects: [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
        }),

      reset: () => set({ projects: [], activeProjectId: null }),
    }),
    { name: 'workspace-projects', storage: safeStorage, version: 1 },
  ),
);
