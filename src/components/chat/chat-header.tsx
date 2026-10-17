'use client';

import { useEffect, useState } from 'react';
import { Menu, PanelRight, PanelRightClose, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { isMac } from '@/lib/utils';
import { syncChat } from '@/services/supabase-sync';
import { selectChatArtifact, useArtifactStore } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';

let cachedMode: { mode: string; model: string | null } | null = null;

function useChatMode() {
  const [mode, setMode] = useState(cachedMode);
  useEffect(() => {
    if (cachedMode) return;
    fetch('/api/chat')
      .then((r) => r.json())
      .then((data) => {
        cachedMode = data;
        setMode(data);
      })
      .catch(() => {});
  }, []);
  return mode;
}

export function ChatHeader({ isDesktop }: { isDesktop: boolean }) {
  const chat = useChatStore((s) => s.chats.find((c) => c.id === s.activeChatId));
  const hasArtifact = useArtifactStore((s) => !!selectChatArtifact(s, chat?.id ?? null));
  const panelOpen = useLayoutStore((s) => s.panelOpen);
  const togglePanel = useLayoutStore((s) => s.togglePanel);
  const setMobileNavOpen = useLayoutStore((s) => s.setMobileNavOpen);
  const mode = useChatMode();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');

  const commit = () => {
    setEditing(false);
    if (!chat) return;
    const clean = title.trim();
    if (clean && clean !== chat.title) {
      useChatStore.getState().renameChat(chat.id, clean);
      const updated = useChatStore.getState().chats.find((c) => c.id === chat.id);
      if (updated) void syncChat(updated);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
      {!isDesktop && (
        <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
      )}
      <div className="min-w-0 flex-1">
        {chat && chat.title !== 'New chat' ? (
          editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-full max-w-md rounded-md bg-transparent px-1.5 py-1 text-sm font-medium outline-none ring-1 ring-ring"
            />
          ) : (
            <button
              onClick={() => {
                setTitle(chat.title);
                setEditing(true);
              }}
              className="max-w-full truncate rounded-md px-1.5 py-1 text-sm font-medium transition hover:bg-accent"
              title="Rename chat"
            >
              {chat.title}
            </button>
          )
        ) : null}
      </div>
      {mode?.mode === 'demo' && (
        <Hint label="Add ANTHROPIC_API_KEY for real generation">
          <Badge variant="accent" className="hidden sm:inline-flex">
            <Sparkles /> Demo mode
          </Badge>
        </Hint>
      )}
      <ThemeToggle />
      {hasArtifact && (
        <Hint label={panelOpen ? 'Hide artifact' : 'Show artifact'} shortcut={`${isMac() ? '⌘' : 'Ctrl+'}.`}>
          <Button variant="ghost" size="icon" onClick={togglePanel} aria-label="Toggle artifact panel">
            {panelOpen ? <PanelRightClose /> : <PanelRight />}
          </Button>
        </Hint>
      )}
    </header>
  );
}
