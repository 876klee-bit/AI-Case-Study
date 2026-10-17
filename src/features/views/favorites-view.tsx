'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { EmptyState } from '@/components/ui/misc';
import { useArtifactStore } from '@/store/useArtifactStore';
import { ArtifactGrid } from './artifact-grid';
import { ViewShell } from './view-shell';

export function FavoritesView({ isDesktop }: { isDesktop: boolean }) {
  const artifacts = useArtifactStore((s) => s.artifacts);
  const favorites = useMemo(
    () => Object.values(artifacts).filter((a) => a.isFavorite).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [artifacts],
  );

  return (
    <ViewShell title="Favorites" description="Artifacts you've starred." isDesktop={isDesktop}>
      {favorites.length ? (
        <ArtifactGrid artifacts={favorites} />
      ) : (
        <EmptyState icon={Star} title="No favorites yet" description="Star an artifact from its panel or the Artifacts page to pin it here." />
      )}
    </ViewShell>
  );
}
