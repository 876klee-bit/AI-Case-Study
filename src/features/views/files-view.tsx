'use client';

import { useRef, useState } from 'react';
import { Download, File as FileIcon, FileText, Files, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { Hint } from '@/components/ui/tooltip';
import { formatBytes, formatRelative } from '@/lib/utils';
import { deleteStoredFile, fileUrl, storeFile } from '@/services/uploads';
import { useChatStore } from '@/store/useChatStore';
import type { StoredFile } from '@/types';
import { ViewShell } from './view-shell';

export function FilesView({ isDesktop }: { isDesktop: boolean }) {
  const files = useChatStore((s) => s.files);
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        const stored = await storeFile(file, user?.id ?? null);
        useChatStore.getState().addFile(stored);
      }
      toast.success(list.length === 1 ? 'File uploaded' : `${list.length} files uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const download = async (f: StoredFile) => {
    const remote = await fileUrl(f);
    if (remote) return void window.open(remote, '_blank', 'noopener');
    if (f.text != null) {
      const url = URL.createObjectURL(new Blob([f.text], { type: f.mimeType ?? 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = f.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    toast.error('This file is only a record in local mode. Sign in to keep file contents.');
  };

  const remove = async (f: StoredFile) => {
    useChatStore.getState().removeFile(f.id);
    await deleteStoredFile(f).catch(() => toast.error('Could not delete the stored copy.'));
  };

  return (
    <ViewShell
      title="Files"
      description={user ? 'Stored privately in your account.' : 'Text files are kept in this browser. Sign in to store files in Supabase.'}
      isDesktop={isDesktop}
      actions={
        <>
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => void upload(e.target.files)} />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload
          </Button>
        </>
      }
    >
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
      >
        {files.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No files yet"
            description="Drop files here, or attach text and code files to a prompt with the paperclip."
            className="rounded-2xl border border-dashed border-border"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle">
            {files.map((f, i) => {
              const Icon = f.text != null ? FileText : FileIcon;
              return (
                <div key={f.id} className={`group flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-border' : ''}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(f.size)} · {formatRelative(f.createdAt)} · {f.bucket ? 'Cloud' : 'Local'}
                    </p>
                  </div>
                  <Hint label="Download">
                    <Button variant="ghost" size="icon" onClick={() => void download(f)} aria-label={`Download ${f.name}`}>
                      <Download />
                    </Button>
                  </Hint>
                  <Hint label="Delete">
                    <Button variant="ghost" size="icon" onClick={() => void remove(f)} aria-label={`Delete ${f.name}`}>
                      <Trash2 />
                    </Button>
                  </Hint>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ViewShell>
  );
}
