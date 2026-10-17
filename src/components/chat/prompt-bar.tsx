'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, FileText, Loader2, Mic, MicOff, Paperclip, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { useChatStream, type PromptAttachment } from '@/hooks/use-chat-stream';
import { useSpeechInput } from '@/hooks/use-speech-input';
import { cn } from '@/lib/utils';
import { isTextFile, storeFile } from '@/services/uploads';
import { useChatStore } from '@/store/useChatStore';

const MAX_HEIGHT = 220;

export function PromptBar({ placeholder, autoFocus }: { placeholder?: string; autoFocus?: boolean }) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const baseText = useRef('');
  const { send, stop, isStreaming } = useChatStream();
  const { user } = useAuth();

  const speech = useSpeechInput((transcript) => {
    setValue(baseText.current ? `${baseText.current} ${transcript}` : transcript);
  });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (speech.error) toast.error(speech.error);
  }, [speech.error]);

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isStreaming && !uploading;

  const submit = () => {
    if (!canSend) return;
    if (speech.listening) speech.stop();
    void send(value, attachments);
    setValue('');
    setAttachments([]);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!isTextFile(file)) {
          toast.error(`${file.name}: only text and code files can be attached to a prompt.`);
          continue;
        }
        const stored = await storeFile(file, user?.id ?? null);
        useChatStore.getState().addFile(stored);
        setAttachments((prev) => [...prev, { name: file.name, text: stored.text ?? '' }]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleMic = () => {
    if (!speech.listening) baseText.current = value.trim();
    speech.toggle();
  };

  return (
    <div
      className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-6 sm:pb-5"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFiles(e.dataTransfer.files);
      }}
    >
      <div
        className={cn(
          'rounded-2xl border border-border bg-surface shadow-float transition focus-within:border-foreground/25',
          speech.listening && 'border-brand/60',
        )}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {attachments.map((a, i) => (
              <span key={`${a.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background py-1 pl-2 pr-1 text-xs">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-[180px] truncate">{a.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          id="prompt-input"
          ref={textareaRef}
          value={value}
          autoFocus={autoFocus}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={speech.listening ? 'Listening…' : placeholder ?? 'Ask for an app, dashboard, site, doc, sheet or deck…'}
          className="block max-h-[220px] w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground scrollbar-thin"
          aria-label="Message"
        />

        <div className="flex items-center gap-1 px-2 pb-2">
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => void onFiles(e.target.files)} />
          <Hint label="Attach text or code files">
            <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach files">
              {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
            </Button>
          </Hint>
          {speech.supported && (
            <Hint label={speech.listening ? 'Stop dictation' : 'Dictate'}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMic}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? 'Stop dictation' : 'Dictate'}
                className={cn(speech.listening && 'bg-brand/15 text-brand hover:bg-brand/20 hover:text-brand')}
              >
                {speech.listening ? <MicOff /> : <Mic />}
              </Button>
            </Hint>
          )}
          <span className="ml-auto hidden pr-2 text-[11px] text-muted-foreground sm:block">
            <kbd className="font-sans">Enter</kbd> to send · <kbd className="font-sans">Shift+Enter</kbd> for a new line
          </span>
          {isStreaming ? (
            <Hint label="Stop generating">
              <Button size="icon" onClick={stop} aria-label="Stop generating" className="rounded-xl">
                <Square className="fill-current !size-3" />
              </Button>
            </Hint>
          ) : (
            <Button size="icon" onClick={submit} disabled={!canSend} aria-label="Send" className="ml-auto rounded-xl sm:ml-0">
              <ArrowUp />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
