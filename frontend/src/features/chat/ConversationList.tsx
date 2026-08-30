import { MessageSquare, Plus } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import type { Conversation } from '@/types/api';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNew: () => void;
  creating?: boolean;
  disabled?: boolean;
}

/*
 * The backend stores no conversation title, so the timestamp is the only real
 * identifier available. Relative day + time reads like a product; a bare
 * "Aug 29, 02:15 PM" on every row does not.
 */
const formatStarted = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const startOfDay = (input: Date) =>
    new Date(input.getFullYear(), input.getMonth(), input.getDate()).getTime();

  const dayDelta = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (dayDelta === 0) return `Today, ${time}`;
  if (dayDelta === 1) return `Yesterday, ${time}`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(dayDelta > 300 ? { year: 'numeric' } : {}),
  });
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  creating = false,
  disabled = false,
}: Props) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.07] bg-ink md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
        <div className="min-w-0">
          <p className="code-font text-[9px] uppercase tracking-[0.18em] text-slate-600">
            conversations
          </p>
          <p className="mt-0.5 text-sm font-medium text-white">
            {conversations.length === 1 ? '1 chat' : `${conversations.length} chats`}
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          disabled={disabled || creating}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-slate-500 transition hover:border-lime-300/25 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="New conversation"
          title="New conversation"
        >
          {creating ? <Spinner size="sm" /> : <Plus size={15} />}
        </button>
      </div>

      <div className="flex max-h-32 gap-1 overflow-x-auto p-2 md:max-h-none md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-5 text-slate-600">
            No conversations yet. Ask a question to start one.
          </p>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.id === activeId;
            const started = formatStarted(conversation.createdAt);

            return (
              <button
                type="button"
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                disabled={disabled && !active}
                aria-current={active ? 'true' : undefined}
                className={`flex min-w-[165px] items-center gap-2 rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 md:min-w-0 ${
                  active
                    ? 'border-line bg-white/[0.045] text-white'
                    : 'border-transparent text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
                }`}
              >
                <MessageSquare
                  size={13}
                  className={`shrink-0 ${active ? 'text-lime-300' : 'text-slate-700'}`}
                />
                <span className="min-w-0 truncate text-xs">{started || 'Conversation'}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
