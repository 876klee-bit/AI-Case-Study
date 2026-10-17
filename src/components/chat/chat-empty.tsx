'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/auth-provider';
import { useChatStream } from '@/hooks/use-chat-stream';
import { ARTIFACT_META } from '@/lib/artifact-meta';
import type { ArtifactType } from '@/types';

const SUGGESTIONS: { type: ArtifactType; prompt: string }[] = [
  { type: 'react', prompt: 'Build a task manager' },
  { type: 'dashboard', prompt: 'Make a sales dashboard' },
  { type: 'website', prompt: 'Create a landing page for a coffee roaster' },
  { type: 'document', prompt: 'Write a product requirements doc' },
  { type: 'spreadsheet', prompt: 'Make a monthly P&L spreadsheet' },
  { type: 'presentation', prompt: 'Create a pitch deck' },
];

function greeting(name: string | null) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name.split(' ')[0]}` : part;
}

export function ChatEmpty({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { send } = useChatStream();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-3xl"
      >
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight sm:text-4xl">{greeting(user?.name ?? null)}</h1>
        <p className="mb-8 text-center text-muted-foreground">What should we make?</p>
        {children}
        <div className="mt-2 flex flex-wrap justify-center gap-2 px-3 sm:px-6">
          {SUGGESTIONS.map(({ type, prompt }) => {
            const Icon = ARTIFACT_META[type].icon;
            return (
              <button
                key={prompt}
                onClick={() => void send(prompt)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-muted-foreground shadow-subtle transition hover:border-foreground/20 hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {prompt}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
