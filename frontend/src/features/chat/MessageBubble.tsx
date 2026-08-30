import { Bot } from 'lucide-react';
import type { Message, Source } from '@/types/api';
import { MarkdownText } from '@/components/MarkdownText';
import { SourcePill } from '@/components/SourcePill';

export interface ChatMessage extends Message {
  sources?: Source[];
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        {/* `whitespace-pre-wrap` keeps the line breaks typed with shift+enter. */}
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-lime-300 px-4 py-3 text-sm font-medium leading-6 text-black">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 justify-start">
      <div className="min-w-0 max-w-[92%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-surface-2 px-4 py-4 sm:px-5">
        <div className="mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-600">
          <Bot size={13} className="text-lime-300" /> RepoQA
        </div>

        <MarkdownText content={message.content} />

        {message.sources?.length ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
            {message.sources.map((source, index) => (
              <SourcePill
                key={`${source.filePath}-${source.startLine}-${source.endLine}-${index}`}
                source={source}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
