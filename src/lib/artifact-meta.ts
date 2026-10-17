import {
  AppWindow,
  Code2,
  FileText,
  Globe,
  LayoutDashboard,
  Presentation,
  Sheet,
  Triangle,
  type LucideIcon,
} from 'lucide-react';
import type { ArtifactType } from '@/types';

export interface ArtifactMeta {
  label: string;
  icon: LucideIcon;
  /** Monaco language id. */
  language: string;
  extension: string;
  mime: string;
}

export const ARTIFACT_TYPES: ArtifactType[] = [
  'react',
  'nextjs',
  'html',
  'website',
  'dashboard',
  'document',
  'spreadsheet',
  'presentation',
];

export const ARTIFACT_META: Record<ArtifactType, ArtifactMeta> = {
  react: { label: 'React app', icon: Code2, language: 'typescript', extension: 'tsx', mime: 'text/plain' },
  nextjs: { label: 'Next.js app', icon: Triangle, language: 'typescript', extension: 'tsx', mime: 'text/plain' },
  html: { label: 'HTML app', icon: AppWindow, language: 'html', extension: 'html', mime: 'text/html' },
  website: { label: 'Website', icon: Globe, language: 'html', extension: 'html', mime: 'text/html' },
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, language: 'typescript', extension: 'tsx', mime: 'text/plain' },
  document: { label: 'Document', icon: FileText, language: 'markdown', extension: 'md', mime: 'text/markdown' },
  spreadsheet: { label: 'Spreadsheet', icon: Sheet, language: 'plaintext', extension: 'csv', mime: 'text/csv' },
  presentation: { label: 'Presentation', icon: Presentation, language: 'markdown', extension: 'md', mime: 'text/markdown' },
};

export function isArtifactType(value: string | null | undefined): value is ArtifactType {
  return !!value && (ARTIFACT_TYPES as string[]).includes(value);
}

export function normalizeArtifactType(value: string | null | undefined): ArtifactType {
  const v = (value ?? '').toLowerCase().trim();
  if (isArtifactType(v)) return v;
  if (v === 'next' || v === 'next.js') return 'nextjs';
  if (v === 'app' || v === 'tsx' || v === 'jsx') return 'react';
  if (v === 'site' || v === 'landing' || v === 'webpage') return 'website';
  if (v === 'markdown' || v === 'doc' || v === 'md') return 'document';
  if (v === 'csv' || v === 'sheet' || v === 'table') return 'spreadsheet';
  if (v === 'slides' || v === 'deck') return 'presentation';
  return 'react';
}

/** Website and dashboard artifacts may be written as HTML or React. */
export function looksLikeHtml(code: string): boolean {
  const trimmed = code.trimStart();
  if (/\bexport\s+default\b/.test(code) || /^\s*import\s/m.test(code)) return false;
  return trimmed.startsWith('<');
}

/** Which runtime the preview uses for a given artifact. */
export function previewRuntime(type: ArtifactType, code: string): 'react' | 'html' | 'markdown' | 'csv' | 'slides' {
  switch (type) {
    case 'react':
    case 'nextjs':
      return 'react';
    case 'html':
      return 'html';
    case 'website':
    case 'dashboard':
      return looksLikeHtml(code) ? 'html' : 'react';
    case 'document':
      return 'markdown';
    case 'spreadsheet':
      return 'csv';
    case 'presentation':
      return 'slides';
  }
}

export function monacoLanguage(type: ArtifactType, code: string): string {
  if (type === 'website' || type === 'dashboard') return looksLikeHtml(code) ? 'html' : 'typescript';
  return ARTIFACT_META[type].language;
}

export function fileNameFor(title: string, type: ArtifactType, code: string): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'artifact';
  const ext = type === 'website' || type === 'dashboard' ? (looksLikeHtml(code) ? 'html' : 'tsx') : ARTIFACT_META[type].extension;
  return `${slug}.${ext}`;
}
