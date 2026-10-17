'use client';

import { useEffect, useRef, useState } from 'react';
import { buildPreviewDocument, PREVIEW_SANDBOX } from '@/lib/preview-builder';
import { cn } from '@/lib/utils';
import type { ArtifactType } from '@/types';

interface Props {
  type: ArtifactType;
  code: string;
  title: string;
  /** Change to force a full reload. */
  reloadKey?: number;
  /** Debounce rebuilds while typing in the editor. */
  debounceMs?: number;
  className?: string;
  onError?: (message: string | null) => void;
  onCsvChange?: (csv: string) => void;
}

/**
 * Sandboxed preview. `sandbox` deliberately omits allow-same-origin, so the document gets an
 * opaque origin and generated code can't touch our cookies, storage or DOM.
 */
export function PreviewFrame({ type, code, title, reloadKey = 0, debounceMs = 0, className, onError, onCsvChange }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [debounced, setDebounced] = useState(code);
  const handlers = useRef({ onError, onCsvChange });
  handlers.current = { onError, onCsvChange };
  // CSV edits made inside the grid shouldn't rebuild the grid under the cursor.
  const lastCsvFromFrame = useRef<string | null>(null);

  useEffect(() => {
    if (!debounceMs) return setDebounced(code);
    const t = setTimeout(() => setDebounced(code), debounceMs);
    return () => clearTimeout(t);
  }, [code, debounceMs]);

  const [stableDoc, setStableDoc] = useState(() => buildPreviewDocument(type, code));

  useEffect(() => {
    if (type === 'spreadsheet' && debounced === lastCsvFromFrame.current) return;
    setStableDoc(buildPreviewDocument(type, debounced));
  }, [type, debounced]);

  useEffect(() => {
    handlers.current.onError?.(null);
  }, [stableDoc, reloadKey]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { source?: string; type?: string; message?: string; csv?: string };
      if (data?.source !== 'workspace-preview') return;
      if (data.type === 'error' && data.message) handlers.current.onError?.(data.message);
      if (data.type === 'csv' && typeof data.csv === 'string') {
        lastCsvFromFrame.current = data.csv;
        handlers.current.onCsvChange?.(data.csv);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      key={reloadKey}
      ref={iframeRef}
      title={`${title} preview`}
      srcDoc={stableDoc}
      sandbox={PREVIEW_SANDBOX}
      referrerPolicy="no-referrer"
      className={cn('h-full w-full border-0 bg-white', className)}
    />
  );
}
