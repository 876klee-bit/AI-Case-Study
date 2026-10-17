'use client';

import { ChatView } from '@/components/chat/chat-view';
import { ArtifactsView } from '@/features/views/artifacts-view';
import { FavoritesView } from '@/features/views/favorites-view';
import { FilesView } from '@/features/views/files-view';
import { ProjectsView } from '@/features/views/projects-view';
import { SettingsView } from '@/features/views/settings-view';
import { TemplatesView } from '@/features/views/templates-view';
import { useLayoutStore } from '@/store/useLayoutStore';

/** The non-chat views. The chat view is rendered by the layouts so it can sit beside the panel. */
export function SecondaryView({ isDesktop }: { isDesktop: boolean }) {
  const view = useLayoutStore((s) => s.view);
  switch (view) {
    case 'projects':
      return <ProjectsView isDesktop={isDesktop} />;
    case 'artifacts':
      return <ArtifactsView isDesktop={isDesktop} />;
    case 'files':
      return <FilesView isDesktop={isDesktop} />;
    case 'templates':
      return <TemplatesView isDesktop={isDesktop} />;
    case 'favorites':
      return <FavoritesView isDesktop={isDesktop} />;
    case 'settings':
      return <SettingsView isDesktop={isDesktop} />;
    default:
      return <ChatView isDesktop={isDesktop} />;
  }
}
