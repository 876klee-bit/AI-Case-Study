'use client';

import { useState } from 'react';
import { Check, Copy, Download, Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { isMac } from '@/lib/utils';

interface Props {
  fileName: string;
  code: string;
  streaming: boolean;
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function EditorToolbar({ fileName, code, streaming, dirty, onSave, onDiscard }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-3">
      <span className="truncate font-mono text-xs text-muted-foreground">{fileName}</span>
      {streaming ? (
        <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-brand">
          <Loader2 className="h-3 w-3 animate-spin" /> Streaming
        </span>
      ) : dirty ? (
        <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Draft
        </span>
      ) : null}
      <div className="ml-auto flex items-center gap-0.5">
        {dirty && !streaming && (
          <>
            <Hint label="Discard draft">
              <Button variant="ghost" size="icon-sm" onClick={onDiscard} aria-label="Discard draft">
                <RotateCcw />
              </Button>
            </Hint>
            <Hint label="Save as version" shortcut={isMac() ? '⌘S' : 'Ctrl+S'}>
              <Button size="sm" onClick={onSave} className="ml-1">
                <Save className="!size-3.5" /> Save as version
              </Button>
            </Hint>
          </>
        )}
        <Hint label={copied ? 'Copied' : 'Copy code'}>
          <Button variant="ghost" size="icon-sm" onClick={copy} disabled={!code} aria-label="Copy code">
            {copied ? <Check /> : <Copy />}
          </Button>
        </Hint>
        <Hint label="Download">
          <Button variant="ghost" size="icon-sm" onClick={download} disabled={!code || streaming} aria-label="Download file">
            <Download />
          </Button>
        </Hint>
      </div>
    </div>
  );
}
