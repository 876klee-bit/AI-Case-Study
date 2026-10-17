import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat, Message, StoredFile } from '@/types';
import { nowIso, uid } from '@/lib/utils';
import { safeStorage } from './storage';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  files: StoredFile[];
  /** Id of the chat currently streaming a reply, if any. Not persisted. */
  streamingChatId: string | null;

  newChat: (projectId?: string | null) => string;
  setActiveChat: (id: string | null) => void;
  renameChat: (id: string, title: string) => void;
  moveChat: (id: string, projectId: string | null) => void;
  deleteChat: (id: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (chatId: string, id: string, patch: Partial<Message>) => void;
  removeMessage: (chatId: string, id: string) => void;
  touchChat: (id: string) => void;
  setStreaming: (chatId: string | null) => void;
  addFile: (file: StoredFile) => void;
  removeFile: (id: string) => void;
  /** Merge chats and messages loaded from Supabase. Remote wins on conflicts. */
  mergeRemote: (chats: Chat[], messages: Record<string, Message[]>, files: StoredFile[]) => void;
  reset: () => void;
}

const sortChats = (chats: Chat[]) => [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: {},
      activeChatId: null,
      files: [],
      streamingChatId: null,

      newChat: (projectId = null) => {
        const id = uid();
        const now = nowIso();
        const chat: Chat = { id, title: 'New chat', projectId, createdAt: now, updatedAt: now };
        set((s) => ({ chats: [chat, ...s.chats], messages: { ...s.messages, [id]: [] }, activeChatId: id }));
        return id;
      },

      setActiveChat: (id) => set({ activeChatId: id }),

      renameChat: (id, title) =>
        set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, title, updatedAt: nowIso() } : c)) })),

      moveChat: (id, projectId) =>
        set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, projectId } : c)) })),

      deleteChat: (id) =>
        set((s) => {
          const messages = { ...s.messages };
          delete messages[id];
          return {
            chats: s.chats.filter((c) => c.id !== id),
            messages,
            activeChatId: s.activeChatId === id ? null : s.activeChatId,
          };
        }),

      addMessage: (message) =>
        set((s) => ({
          messages: { ...s.messages, [message.chatId]: [...(s.messages[message.chatId] ?? []), message] },
        })),

      updateMessage: (chatId, id, patch) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
          },
        })),

      removeMessage: (chatId, id) =>
        set((s) => ({
          messages: { ...s.messages, [chatId]: (s.messages[chatId] ?? []).filter((m) => m.id !== id) },
        })),

      touchChat: (id) =>
        set((s) => ({ chats: sortChats(s.chats.map((c) => (c.id === id ? { ...c, updatedAt: nowIso() } : c))) })),

      setStreaming: (chatId) => set({ streamingChatId: chatId }),

      addFile: (file) => set((s) => ({ files: [file, ...s.files.filter((f) => f.id !== file.id)] })),
      removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),

      mergeRemote: (chats, messages, files) => {
        const local = get();
        const byId = new Map(local.chats.map((c) => [c.id, c]));
        chats.forEach((c) => byId.set(c.id, c));
        const mergedMessages = { ...local.messages };
        Object.entries(messages).forEach(([chatId, list]) => {
          const existing = new Map((mergedMessages[chatId] ?? []).map((m) => [m.id, m]));
          list.forEach((m) => existing.set(m.id, m));
          mergedMessages[chatId] = [...existing.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
        const fileIds = new Set(files.map((f) => f.id));
        set({
          chats: sortChats([...byId.values()]),
          messages: mergedMessages,
          files: [...files, ...local.files.filter((f) => !fileIds.has(f.id))],
        });
      },

      reset: () => set({ chats: [], messages: {}, activeChatId: null, files: [], streamingChatId: null }),
    }),
    {
      name: 'workspace-chats',
      storage: safeStorage,
      version: 1,
      partialize: (s) => ({
        chats: s.chats,
        // Never persist a half-streamed message as pending.
        messages: Object.fromEntries(
          Object.entries(s.messages).map(([k, v]) => [k, v.map((m) => (m.pending ? { ...m, pending: false } : m))]),
        ),
        activeChatId: s.activeChatId,
        files: s.files,
      }),
    },
  ),
);
