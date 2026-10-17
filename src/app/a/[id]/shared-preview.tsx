'use client';

import { PreviewFrame } from '@/components/artifacts/preview-frame';
import type { ArtifactType } from '@/types';

export function SharedPreview({ type, code, title }: { type: ArtifactType; code: string; title: string }) {
  return (
    <div className="min-h-0 flex-1 bg-white">
      <PreviewFrame type={type} code={code} title={title} />
    </div>
  );
}
