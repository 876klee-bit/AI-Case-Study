'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowDown, Check, Copy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useChatStream } from '@/hooks/use-chat-stream';
import { messageProse, parseArtifactMessage } from '@/lib/artifact-parser';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types';
import { ArtifactCard } from './artifact-card';
import { Markdown } from './markdown';
import { TypingIndicator } from './typing-indicator';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Hint label={copied ? 'Copied' : 'Copy'}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Copy message"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </Hint>
  );
}

/** User attachments are inlined as fenced blocks; show them as compact chips instead. */
function splitAttachments(content: string) {
  const parts = content.split(/\n\nAttached file `([^`]+)`:\n\n```\n[\s\S]*?\n```/g);
  const text = parts.filter((_, i) => i % 2 === 0).join('').trim();
  const files = parts.filter((_, i) => i % 2 === 1);
  return { text, files };
}

const UserMessage = memo(function UserMessage({ message }: { message: Message }) {
  const { text, files } = splitAttachments(message.content);
  return (
    <div className="group flex flex-col items-end">
      {files.length > 0 && (
        <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
          {files.map((f) => (
            <span key={f} className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
      )}
      {text && (
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-[15px] leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
});

const AssistantMessage = memo(function AssistantMessage({
  message,
  isLast,
  onRetry,
}: {
  message: Message;
  isLast: boolean;
  onRetry: () => void;
}) {
  const { before, artifact, after } = parseArtifactMessage(message.content);
  const streamingArtifact = !!message.pending && !!artifact && !artifact.complete;
  const empty = !before.trim() && !artifact && !after.trim();

  return (
    <div className="group">
      {message.pending && empty && <TypingIndicator />}
      {before.trim() && <Markdown>{before}</Markdown>}
      {artifact && (
        <ArtifactCard
          artifactId={message.artifactId}
          title={artifact.title}
          type={artifact.type}
          version={message.artifactVersion}
          streaming={streamingArtifact}
        />
      )}
      {after.trim() && <Markdown>{after}</Markdown>}
      {message.error && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{message.error}</span>
          {isLast && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <RotateCcw /> Retry
            </Button>
          )}
        </div>
      )}
      {!message.pending && !empty && (
        <div className="mt-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <CopyButton text={messageProse(message.content)} />
        </div>
      )}
    </div>
  );
});

export function MessageList({ messages }: { messages: Message[] }) {
  const { send, isStreaming } = useChatStream();
  const last = messages.at(-1);
  const { ref, atBottom, scrollToBottom } = useAutoScroll<HTMLDivElement>([messages.length, last?.content.length]);

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser || isStreaming) return;
    // Drop the failed exchange, then resend the same prompt.
    const store = useChatStore.getState();
    if (last && last.role === 'assistant') store.removeMessage(last.chatId, last.id);
    store.removeMessage(lastUser.chatId, lastUser.id);
    void send(lastUser.content);
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={ref} className="h-full overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-8 pt-6 sm:px-6">
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {m.role === 'user' ? (
                <UserMessage message={m} />
              ) : (
                <AssistantMessage message={m} isLast={i === messages.length - 1} onRetry={retry} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <button
        onClick={() => scrollToBottom()}
        aria-label="Jump to latest"
        className={cn(
          'absolute bottom-3 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-border bg-surface shadow-float transition',
          atBottom ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100',
        )}
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );
}
