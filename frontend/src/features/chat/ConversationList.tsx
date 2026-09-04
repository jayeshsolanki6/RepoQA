import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import type { Conversation } from '@/types/api';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNew: () => void;
  onDelete: (conversation: Conversation) => void;
  creating?: boolean;
  deletingId?: string | null;
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

  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(dayDelta > 300 ? { year: 'numeric' } : {}),
  });

  return `${formattedDate}, ${time}`;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  creating = false,
  deletingId = null,
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
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface/50 text-slate-400 transition hover:border-lime-300/30 hover:bg-lime-300/[0.08] hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="New conversation"
          title="New conversation"
        >
          {creating ? <Spinner size="sm" /> : <Plus size={15} />}
        </button>
      </div>

      <div className="flex max-h-32 gap-1 overflow-x-auto p-2 md:max-h-none md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
        <button
          type="button"
          onClick={onNew}
          disabled={disabled || creating}
          className={`group flex min-w-[140px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 md:min-w-0 ${
            activeId === null
              ? 'border-lime-300/25 bg-lime-300/[0.07] text-white shadow-[0_0_15px_rgba(190,242,100,0.05)]'
              : 'border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-slate-200'
          }`}
        >
          <Plus
            size={13}
            className={`shrink-0 transition-colors ${
              activeId === null
                ? 'text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.4)]'
                : 'text-slate-500 group-hover:text-slate-400'
            }`}
          />
          <span className="truncate text-xs font-medium">New chat</span>
        </button>

        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-5 text-slate-600">
            No past conversations yet.
          </p>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.id === activeId;
            const started = formatStarted(conversation.createdAt);
            const deleting = deletingId === conversation.id;

            return (
              <div
                key={conversation.id}
                className={`group flex min-w-[165px] items-center gap-1 rounded-lg border py-1 pl-1 pr-1.5 transition-all duration-150 md:min-w-0 ${
                  active
                    ? 'border-lime-300/25 bg-lime-300/[0.07] shadow-[0_0_15px_rgba(190,242,100,0.05)]'
                    : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation)}
                  disabled={(disabled && !active) || deleting}
                  aria-current={active ? 'true' : undefined}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active ? 'font-medium text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare
                    size={13}
                    className={`shrink-0 transition-colors ${
                      active
                        ? 'text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.4)]'
                        : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                  <span className="min-w-0 truncate text-xs">{started || 'Conversation'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation)}
                  disabled={disabled || deleting}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-400/20 bg-red-400/[0.04] text-red-400 transition hover:border-red-400/40 hover:bg-red-400/[0.09] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 ${
                    active ? 'md:opacity-100' : ''
                  }`}
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  {deleting ? <Spinner size="sm" /> : <Trash2 size={13} />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
