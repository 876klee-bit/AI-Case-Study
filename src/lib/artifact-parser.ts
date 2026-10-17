import type { ArtifactType } from '@/types';
import { normalizeArtifactType } from './artifact-meta';

export interface ParsedArtifact {
  type: ArtifactType;
  title: string;
  code: string;
  /** True once the closing </artifact> tag has arrived. */
  complete: boolean;
}

export interface ParsedMessage {
  /** Prose before the artifact (or the whole message if there is none). */
  before: string;
  artifact: ParsedArtifact | null;
  /** Prose after the closing tag. */
  after: string;
}

const OPEN_RE = /<artifact\b([^>]*)>/i;
const CLOSE = '</artifact>';

function readAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = attrs.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? m[3] ?? '').trim();
}

/** Strip a leading/trailing markdown fence the model sometimes wraps around code. */
function stripFence(code: string, complete: boolean): string {
  let out = code.replace(/^\s*\n/, '');
  const fence = out.match(/^\s*```[\w.+-]*\s*\n/);
  if (fence) {
    out = out.slice(fence[0].length);
    if (complete) out = out.replace(/\n?```\s*$/, '');
  }
  return complete ? out.replace(/\s+$/, '') + '\n' : out;
}

/**
 * Parse a (possibly partial) assistant message. Safe to call on every streamed chunk:
 * a partially streamed opening tag is hidden from the prose until it completes.
 */
export function parseArtifactMessage(raw: string): ParsedMessage {
  const open = raw.match(OPEN_RE);
  if (!open || open.index === undefined) {
    // Hide a half-written "<artif..." at the very end while streaming.
    const partial = raw.match(/<a(?:r(?:t(?:i(?:f(?:a(?:c(?:t[^>]*)?)?)?)?)?)?)?$/i);
    const before = partial && partial.index !== undefined ? raw.slice(0, partial.index) : raw;
    return { before, artifact: null, after: '' };
  }

  const before = raw.slice(0, open.index);
  const attrs = open[1] ?? '';
  const bodyStart = open.index + open[0].length;
  const closeIdx = raw.indexOf(CLOSE, bodyStart);
  const complete = closeIdx !== -1;

  let body = complete ? raw.slice(bodyStart, closeIdx) : raw.slice(bodyStart);
  if (!complete) {
    // Don't show a half-written closing tag as code.
    const partialClose = body.match(/<\/?a?r?t?i?f?a?c?t?$/i);
    if (partialClose && partialClose.index !== undefined && partialClose[0].length > 0) {
      body = body.slice(0, partialClose.index);
    }
  }

  return {
    before,
    artifact: {
      type: normalizeArtifactType(readAttr(attrs, 'type')),
      title: readAttr(attrs, 'title') || 'Untitled',
      code: stripFence(body, complete),
      complete,
    },
    after: complete ? raw.slice(closeIdx + CLOSE.length) : '',
  };
}

/** The visible prose of a message with the artifact body removed. */
export function messageProse(raw: string): string {
  const { before, artifact, after } = parseArtifactMessage(raw);
  if (!artifact) return before;
  return `${before.trim()}\n\n${after.trim()}`.trim();
}
