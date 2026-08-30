import { FileCode2 } from 'lucide-react';
import type { Source } from '@/types/api';

export function SourcePill({ source }: { source: Source }) {
  const label = `${source.filePath}:${source.startLine}-${source.endLine}`;

  return (
    <span
      title={label}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-lime-300/10 bg-lime-300/[0.04] px-2.5 py-1.5 text-[11px] text-lime-200"
    >
      <FileCode2 size={12} className="shrink-0" />
      {/* Deep paths used to push the bubble wider than the chat column. */}
      <span className="code-font truncate">{label}</span>
    </span>
  );
}
