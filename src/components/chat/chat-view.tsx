'use client';

import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types';
import { ChatEmpty } from './chat-empty';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { PromptBar } from './prompt-bar';

const NO_MESSAGES: Message[] = [];

export function ChatView({ isDesktop }: { isDesktop: boolean }) {
  const messages = useChatStore((s) => (s.activeChatId ? s.messages[s.activeChatId] ?? NO_MESSAGES : NO_MESSAGES));

  return (
    <div className="flex h-full min-w-0 flex-col bg-background">
      <ChatHeader isDesktop={isDesktop} />
      {messages.length === 0 ? (
        <ChatEmpty>
          <PromptBar autoFocus={isDesktop} />
        </ChatEmpty>
      ) : (
        <>
          <MessageList messages={messages} />
          <PromptBar placeholder="Reply, or ask for a change…" />
        </>
      )}
    </div>
  );
}
