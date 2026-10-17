export type ArtifactType =
  | 'react'
  | 'nextjs'
  | 'html'
  | 'website'
  | 'dashboard'
  | 'document'
  | 'spreadsheet'
  | 'presentation';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  chatId: string;
  role: Role;
  content: string;
  createdAt: string;
  artifactId?: string | null;
  artifactVersion?: number | null;
  /** True while the assistant reply is still streaming. */
  pending?: boolean;
  error?: string | null;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Artifact {
  id: string;
  chatId: string | null;
  projectId: string | null;
  title: string;
  type: ArtifactType;
  currentVersion: number;
  /** Unsaved edits from the Code tab. Null when the draft matches the latest version. */
  draft: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  version: number;
  code: string;
  prompt: string | null;
  createdAt: string;
}

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
  bucket: string | null;
  path: string | null;
  createdAt: string;
  /** Text content for local-only text attachments. */
  text?: string | null;
}

export type PanelTab = 'preview' | 'code' | 'versions';

export type View = 'chat' | 'projects' | 'artifacts' | 'files' | 'templates' | 'favorites' | 'settings';

export interface ChatRequestMessage {
  role: Role;
  content: string;
}

export interface ChatRequestBody {
  messages: ChatRequestMessage[];
  artifact?: { type: ArtifactType; title: string; code: string } | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}
