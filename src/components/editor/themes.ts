import type { Monaco } from '@monaco-editor/react';

export const LIGHT_THEME = 'workspace-light';
export const DARK_THEME = 'workspace-dark';

let defined = false;

/** Register editor themes and TS/JSX settings once per page. */
export function setupMonaco(monaco: Monaco) {
  if (defined) return;
  defined = true;

  monaco.editor.defineTheme(LIGHT_THEME, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8a817c', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a8459e' },
      { token: 'string', foreground: '2f7d4f' },
      { token: 'number', foreground: 'b5600d' },
      { token: 'type', foreground: '2f63b5' },
      { token: 'tag', foreground: 'b5413c' },
      { token: 'attribute.name', foreground: '9a5b13' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1c1917',
      'editor.lineHighlightBackground': '#f7f5f2',
      'editorLineNumber.foreground': '#c3bdb7',
      'editorLineNumber.activeForeground': '#57534e',
      'editor.selectionBackground': '#f59e0b33',
      'editorCursor.foreground': '#d97706',
      'editorIndentGuide.background1': '#efece8',
      'editorGutter.background': '#ffffff',
      'diffEditor.insertedTextBackground': '#10b98122',
      'diffEditor.removedTextBackground': '#ef444422',
    },
  });

  monaco.editor.defineTheme(DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '847b75', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'e39bd8' },
      { token: 'string', foreground: '8fd19e' },
      { token: 'number', foreground: 'f3b26b' },
      { token: 'type', foreground: '8ab4f8' },
      { token: 'tag', foreground: 'f28b82' },
      { token: 'attribute.name', foreground: 'f3c98b' },
    ],
    colors: {
      'editor.background': '#1a1816',
      'editor.foreground': '#ece9e4',
      'editor.lineHighlightBackground': '#23201d',
      'editorLineNumber.foreground': '#4d4743',
      'editorLineNumber.activeForeground': '#a8a29e',
      'editor.selectionBackground': '#f59e0b40',
      'editorCursor.foreground': '#f59e0b',
      'editorIndentGuide.background1': '#2a2623',
      'editorGutter.background': '#1a1816',
      'diffEditor.insertedTextBackground': '#10b98126',
      'diffEditor.removedTextBackground': '#ef444426',
    },
  });

  // Generated code imports React and lucide-react, whose types aren't loaded here.
  // Keep syntax errors, skip semantic ones so the editor isn't a wall of red.
  const ts = monaco.languages.typescript;
  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    jsx: ts.JsxEmit.Preserve,
    allowNonTsExtensions: true,
    allowJs: true,
    esModuleInterop: true,
  };
  ts.typescriptDefaults.setCompilerOptions(compilerOptions);
  ts.javascriptDefaults.setCompilerOptions(compilerOptions);
  ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
}

export const EDITOR_OPTIONS = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: 'line' as const,
  tabSize: 2,
  wordWrap: 'on' as const,
  automaticLayout: true,
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  guides: { indentation: true },
  fixedOverflowWidgets: true,
};
