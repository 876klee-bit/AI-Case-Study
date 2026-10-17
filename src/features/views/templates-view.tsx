'use client';

import { ArrowRight } from 'lucide-react';
import { useChatStream } from '@/hooks/use-chat-stream';
import { startNewChat } from '@/hooks/use-shortcuts';
import { ARTIFACT_META } from '@/lib/artifact-meta';
import type { ArtifactType } from '@/types';
import { ViewShell } from './view-shell';

interface Template {
  title: string;
  description: string;
  type: ArtifactType;
  prompt: string;
}

export const TEMPLATES: Template[] = [
  {
    title: 'Task manager',
    description: 'Tasks with priorities, filters and progress.',
    type: 'react',
    prompt: 'Build a task manager with priorities, filters (all/active/done), a progress bar and delete on hover.',
  },
  {
    title: 'Sales dashboard',
    description: 'KPIs, a revenue chart, channels and recent orders.',
    type: 'dashboard',
    prompt: 'Make a sales dashboard with KPI cards, an interactive monthly revenue chart, traffic by channel and a recent orders table.',
  },
  {
    title: 'Landing page',
    description: 'Hero, product grid, how it works and footer.',
    type: 'website',
    prompt: 'Create a landing page for a small-batch coffee roaster with a hero, product grid, how-it-works section and footer.',
  },
  {
    title: 'Multi-page site',
    description: 'A Next.js page with client-side navigation.',
    type: 'nextjs',
    prompt: 'Build a Next.js portfolio site for a product designer with Home, Work and Contact pages using next/link navigation.',
  },
  {
    title: 'Interactive tool',
    description: 'A standalone HTML calculator.',
    type: 'html',
    prompt: 'Make a standalone HTML mortgage calculator with sliders for price, down payment, rate and term, and an amortization summary.',
  },
  {
    title: 'Product requirements',
    description: 'Goals, user stories, requirements and open questions.',
    type: 'document',
    prompt: 'Write a product requirements document for shared team workspaces: summary, goals, non-goals, user stories table, requirements and open questions.',
  },
  {
    title: 'Monthly P&L',
    description: 'Revenue, expenses, profit and margin by month.',
    type: 'spreadsheet',
    prompt: 'Make a monthly P&L spreadsheet with revenue, expenses, profit and margin for each month of the year.',
  },
  {
    title: 'Pitch deck',
    description: 'Problem, solution, how it works, results, next steps.',
    type: 'presentation',
    prompt: 'Create a six-slide pitch deck for an AI workspace product: title, problem, solution, how it works, pilot results, next steps.',
  },
];

export function TemplatesView({ isDesktop }: { isDesktop: boolean }) {
  const { send, isStreaming } = useChatStream();

  const use = (t: Template) => {
    if (isStreaming) return;
    startNewChat();
    void send(t.prompt);
  };

  return (
    <ViewShell title="Templates" description="Start from a proven prompt. You can refine anything afterwards." isDesktop={isDesktop}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t) => {
          const meta = ARTIFACT_META[t.type];
          const Icon = meta.icon;
          return (
            <button
              key={t.title}
              onClick={() => use(t)}
              disabled={isStreaming}
              className="group flex flex-col rounded-2xl border border-border bg-surface p-4 text-left shadow-subtle transition hover:border-foreground/20 hover:shadow-float disabled:opacity-60"
            >
              <span className="mb-6 flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] text-muted-foreground">{meta.label}</span>
              </span>
              <span className="font-medium">{t.title}</span>
              <span className="mt-1 flex-1 text-sm text-muted-foreground">{t.description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition group-hover:text-foreground">
                Use template <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </ViewShell>
  );
}
