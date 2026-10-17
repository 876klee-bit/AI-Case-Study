import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { chunkForStreaming, demoReply } from '@/lib/ai/demo-templates';
import { sleep } from '@/lib/utils';
import type { ChatRequestBody } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Long generations (full apps) can take a while. Lower this on plans with shorter limits.
export const maxDuration = 300;

const MAX_MESSAGES = 40;
const MAX_BODY_CHARS = 400_000;

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
};

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

function validate(body: unknown): ChatRequestBody | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as ChatRequestBody;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return null;
  const ok = b.messages.every(
    (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
  );
  if (!ok) return null;
  return {
    messages: b.messages.slice(-MAX_MESSAGES),
    artifact:
      b.artifact && typeof b.artifact.code === 'string'
        ? { type: b.artifact.type, title: String(b.artifact.title ?? ''), code: b.artifact.code }
        : null,
  };
}

/** Anthropic requires alternating turns starting with the user; merge any repeats. */
function normalizeTurns(messages: ChatRequestBody['messages']) {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of messages) {
    if (!m.content.trim()) continue;
    const last = out.at(-1);
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else out.push({ role: m.role, content: m.content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

function demoStream(body: ChatRequestBody, signal: AbortSignal) {
  const lastUser = [...body.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const chunks = chunkForStreaming(demoReply(lastUser, !!body.artifact));
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      await sleep(350);
      for (const chunk of chunks) {
        if (signal.aborted) break;
        controller.enqueue(encoder.encode(chunk));
        await sleep(12);
      }
      controller.close();
    },
  });
}

function anthropicStream(body: ChatRequestBody, apiKey: string, signal: AbortSignal) {
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream(
          {
            model,
            max_tokens: 16000,
            system: buildSystemPrompt(body),
            messages: normalizeTurns(body.messages),
          },
          { signal },
        );
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        if (signal.aborted) {
          controller.close();
          return;
        }
        const message = err instanceof Error ? err.message : 'The model request failed.';
        console.error('[api/chat]', err);
        controller.enqueue(encoder.encode(`\n\n> **Error:** ${message}`));
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) return jsonError(413, 'Request is too large.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError(400, 'Invalid JSON.');
  }
  const body = validate(parsed);
  if (!body) return jsonError(400, 'Expected { messages: [{ role, content }] }.');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const stream = apiKey ? anthropicStream(body, apiKey, req.signal) : demoStream(body, req.signal);

  return new Response(stream, {
    headers: { ...STREAM_HEADERS, 'X-Workspace-Mode': apiKey ? 'anthropic' : 'demo' },
  });
}

/** Lets the UI show whether real generation is configured. */
export async function GET() {
  return Response.json({
    mode: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'demo',
    model: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5' : null,
  });
}
