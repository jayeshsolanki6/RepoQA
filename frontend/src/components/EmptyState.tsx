import { FolderGit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="grid min-h-[240px] place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-line bg-white/[0.03] text-slate-600">
          <FolderGit2 size={24} />
        </span>
        <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </Card>
  );
}
