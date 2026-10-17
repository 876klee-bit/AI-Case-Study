'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useProjectStore } from '@/store/useProjectStore';

export function startNewChat() {
  const projectId = useProjectStore.getState().activeProjectId;
  const { chats, messages, setActiveChat, newChat } = useChatStore.getState();
  // Reuse an empty chat instead of piling up blank ones.
  const empty = chats.find((c) => c.projectId === projectId && (messages[c.id]?.length ?? 0) === 0);
  if (empty) setActiveChat(empty.id);
  else newChat(projectId);
  useLayoutStore.getState().setView('chat');
  requestAnimationFrame(() => document.getElementById('prompt-input')?.focus());
}

/** Global shortcuts: ⌘⇧O new chat, ⌘. toggle artifact panel. (⌘S lives in the code tab.) */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        startNewChat();
      } else if (e.key === '.') {
        e.preventDefault();
        useLayoutStore.getState().togglePanel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
