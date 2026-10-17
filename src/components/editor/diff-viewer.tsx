'use client';

import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { EditorLoading } from './monaco-editor';
import { DARK_THEME, EDITOR_OPTIONS, LIGHT_THEME, setupMonaco } from './themes';

interface Props {
  original: string;
  modified: string;
  language: string;
}

/** Read-only side-by-side diff (inline on narrow screens). */
export function DiffViewer({ original, modified, language }: Props) {
  const { resolvedTheme } = useTheme();
  const isDesktop = useIsDesktop();
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme={resolvedTheme === 'dark' ? DARK_THEME : LIGHT_THEME}
      beforeMount={setupMonaco}
      loading={<EditorLoading />}
      options={{
        ...EDITOR_OPTIONS,
        readOnly: true,
        originalEditable: false,
        renderSideBySide: isDesktop,
        renderOverviewRuler: false,
        diffWordWrap: 'on',
      }}
    />
  );
}
