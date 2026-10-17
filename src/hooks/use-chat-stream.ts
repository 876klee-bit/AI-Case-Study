'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { createArtifactFlow } from '@/features/artifact-flow';
import { messageProse } from '@/lib/artifact-parser';
import { nowIso, titleFromPrompt, uid } from '@/lib/utils';
import { streamChat } from '@/services/chat-client';
import { syncChat, syncMessage } from '@/services/supabase-sync';
import { selectChatArtifact, useArtifactStore, workingCode } from '@/store/useArtifactStore';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useProjectStore } from '@/store/useProjectStore';
import type { ChatRequestMessage, Message } from '@/types';

export interface PromptAttachment {
  name: string;
  text: string;
}

// One stream at a time across the whole app, so the header and prompt bar share it.
let controller: AbortController | null = null;

function toHistory(messages: Message[]): ChatRequestMessage[] {
  return messages
    .filter((m) => !m.pending && m.content.trim())
    .map((m) => {
      if (m.role === 'user') return { role: 'user' as const, content: m.content };
      // Keep assistant turns short: the current artifact is sent separately in full.
      const prose = messageProse(m.content);
      const note = m.artifactId ? `\n\n[Updated the artifact${m.artifactVersion ? ` to v${m.artifactVersion}` : ''}.]` : '';
      return { role: 'assistant' as const, content: (prose || 'Done.') + note };
    });
}

export function useChatStream() {
  const streamingChatId = useChatStore((s) => s.streamingChatId);

  const send = useCallback(async (prompt: string, attachments: PromptAttachment[] = []) => {
    const text = prompt.trim();
    if ((!text && attachments.length === 0) || controller) return;

    const chatStore = useChatStore.getState();
    const projectId = useProjectStore.getState().activeProjectId;
    let chatId = chatStore.activeChatId;
    if (!chatId || !chatStore.chats.some((c) => c.id === chatId)) chatId = chatStore.newChat(projectId);
    useLayoutStore.getState().setView('chat');

    const chat = useChatStore.getState().chats.find((c) => c.id === chatId)!;
    if (chat.title === 'New chat') useChatStore.getState().renameChat(chatId, titleFromPrompt(text || attachments[0].name));

    const content = attachments.length
      ? `${text}\n\n${attachments.map((a) => `Attached file \`${a.name}\`:\n\n\`\`\`\n${a.text}\n\`\`\``).join('\n\n')}`
      : text;

    const userMessage: Message = { id: uid(), chatId, role: 'user', content, createdAt: nowIso() };
    const assistantId = uid();
    const assistantMessage: Message = {
      id: assistantId,
      chatId,
      role: 'assistant',
      content: '',
      createdAt: nowIso(),
      pending: true,
    };

    const history = toHistory([...(useChatStore.getState().messages[chatId] ?? []), userMessage]);
    const artifactState = useArtifactStore.getState();
    const existing = selectChatArtifact(artifactState, chatId);
    const artifactContext = existing
      ? { type: existing.type, title: existing.title, code: workingCode(artifactState, existing.id) }
      : null;

    useChatStore.getState().addMessage(userMessage);
    useChatStore.getState().addMessage(assistantMessage);
    useChatStore.getState().touchChat(chatId);
    useChatStore.getState().setStreaming(chatId);

    const latestChat = useChatStore.getState().chats.find((c) => c.id === chatId)!;
    void syncChat(latestChat).then(() => syncMessage(userMessage));

    const flow = createArtifactFlow({ chatId, projectId: latestChat.projectId, messageId: assistantId, prompt: text });
    controller = new AbortController();
    let raw = '';

    try {
      await streamChat({
        body: { messages: history, artifact: artifactContext },
        signal: controller.signal,
        onChunk: (chunk) => {
          raw += chunk;
          useChatStore.getState().updateMessage(chatId!, assistantId, { content: raw });
          flow.update(raw);
        },
      });
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (!aborted) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        useChatStore.getState().updateMessage(chatId, assistantId, { error: message });
        toast.error(message);
      }
    } finally {
      flow.finish(raw);
      controller = null;
      useChatStore.getState().updateMessage(chatId, assistantId, { pending: false, content: raw });
      useChatStore.getState().setStreaming(null);
      useChatStore.getState().touchChat(chatId);
      const final = useChatStore.getState().messages[chatId]?.find((m) => m.id === assistantId);
      if (final && (final.content || final.artifactId)) void syncMessage(final);
    }
  }, []);

  const stop = useCallback(() => {
    controller?.abort();
  }, []);

  return { send, stop, isStreaming: streamingChatId !== null, streamingChatId };
}
