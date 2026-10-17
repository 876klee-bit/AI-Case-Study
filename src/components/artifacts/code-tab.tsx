'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { EditorToolbar } from '@/components/editor/editor-toolbar';
import { MonacoEditor } from '@/components/editor/monaco-editor';
import { fileNameFor, monacoLanguage } from '@/lib/artifact-meta';
import { saveDraftAsVersion } from '@/features/artifact-flow/actions';
import { useArtifactStore } from '@/store/useArtifactStore';
import type { Artifact } from '@/types';

export function CodeTab({ artifact, code, streaming }: { artifact: Artifact; code: string; streaming: boolean }) {
  const fileName = fileNameFor(artifact.title, artifact.type, code);
  const language = monacoLanguage(artifact.type, code);
  const dirty = artifact.draft !== null;
  const ext = fileName.split('.').pop();

  const onChange = useCallback(
    (value: string) => {
      if (streaming) return;
      useArtifactStore.getState().setDraft(artifact.id, value);
    },
    [artifact.id, streaming],
  );

  const onSave = useCallback(() => saveDraftAsVersion(artifact.id), [artifact.id]);

  const onDiscard = useCallback(() => {
    useArtifactStore.getState().setDraft(artifact.id, null);
    toast('Draft discarded');
  }, [artifact.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorToolbar
        fileName={fileName}
        code={code}
        streaming={streaming}
        dirty={dirty}
        onSave={onSave}
        onDiscard={onDiscard}
      />
      <div className="min-h-0 flex-1">
        <MonacoEditor
          value={code}
          language={language}
          path={`file:///${artifact.id}.${ext}`}
          readOnly={streaming}
          followTail={streaming}
          onChange={onChange}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
