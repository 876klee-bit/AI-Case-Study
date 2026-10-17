'use client';

import { useEffect, useRef } from 'react';
import Editor, { loader, type OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { DARK_THEME, EDITOR_OPTIONS, LIGHT_THEME, setupMonaco } from './themes';

// Load the same Monaco build as the installed monaco-editor package.
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });

export function EditorLoading() {
  return (
    <div className="grid h-full place-items-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

interface Props {
  value: string;
  language: string;
  /** Model path; a .tsx extension enables JSX parsing. */
  path: string;
  readOnly?: boolean;
  /** Follow the end of the document (used while code streams in). */
  followTail?: boolean;
  onChange?: (value: string) => void;
  onSave?: () => void;
}

export function MonacoEditor({ value, language, path, readOnly, followTail, onChange, onSave }: Props) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current?.());
  };

  useEffect(() => {
    if (!followTail) return;
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (editor && model) editor.revealLine(model.getLineCount());
  }, [value, followTail]);

  return (
    <Editor
      value={value}
      language={language}
      path={path}
      theme={resolvedTheme === 'dark' ? DARK_THEME : LIGHT_THEME}
      beforeMount={setupMonaco}
      onMount={onMount}
      onChange={(v) => onChange?.(v ?? '')}
      loading={<EditorLoading />}
      options={{ ...EDITOR_OPTIONS, readOnly, domReadOnly: readOnly }}
    />
  );
}
