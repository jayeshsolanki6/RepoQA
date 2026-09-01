import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ExternalLink, FileCode2, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/Spinner';
import { ErrorState } from '@/components/ErrorState';
import { repositoryApi } from '@/features/repository/repository.api';
import { chatApi } from './chat.api';
import { ConversationList } from './ConversationList';
import { MessageBubble, type ChatMessage } from './MessageBubble';
import { getApiError } from '@/lib/axios';
import { DeleteModal } from '@/components/DeleteModal';
import type { Conversation, Repository } from '@/types/api';

const MAX_COMPOSER_HEIGHT = 160;

/*
 * Deliberately repository-agnostic. Earlier prompts named auth and refresh
 * tokens, which only made sense for this project's own backend and read as
 * broken suggestions on any other repository.
 */
const SUGGESTIONS = [
  'What does this repository do?',
  'Walk me through the project structure',
  'Where does execution start?',
];

export function ChatPage() {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [repository, setRepository] = useState<Repository | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteConversation, setConfirmDeleteConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState('');

  /**
   * Mirrors `activeConversation` synchronously. Async handlers compare against
   * this before touching `messages`, so an answer can never land in a thread the
   * user has since switched away from.
   */
  const activeIdRef = useRef<string | null>(null);
  /** De-duplicates the lazy "create a conversation on first send" request. */
  const pendingCreateRef = useRef<Promise<Conversation> | null>(null);

  const setActive = useCallback((conversation: Conversation | null) => {
    activeIdRef.current = conversation?.id ?? null;
    setActiveConversation(conversation);
  }, []);

  const appendIfActive = useCallback((conversationId: string, message: ChatMessage) => {
    if (activeIdRef.current !== conversationId) return;
    setMessages((previous) => [...previous, message]);
  }, []);

  const selectConversation = async (conversation: Conversation) => {
    if (sending || conversation.id === activeIdRef.current) return;

    setActive(conversation);
    setMessages([]);
    setMessagesLoading(true);

    try {
      const data = await chatApi.getMessages(conversation.id);
      // A slower earlier request must not overwrite a newer selection.
      if (activeIdRef.current !== conversation.id) return;
      setMessages(data);
    } catch (err) {
      if (activeIdRef.current === conversation.id) {
        toast.error(getApiError(err, 'Could not load conversation'));
      }
    } finally {
      if (activeIdRef.current === conversation.id) setMessagesLoading(false);
    }
  };

  const startNewConversation = async () => {
    if (!repositoryId || creating || sending) return;
    try {
      setCreating(true);
      const conversation = await chatApi.createConversation(repositoryId);
      setConversations((previous) => [conversation, ...previous]);
      setActive(conversation);
      setMessages([]);
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(getApiError(err, 'Could not create conversation'));
    } finally {
      setCreating(false);
    }
  };

  /**
   * Conversations are created on the first message rather than on mount. That
   * removes the empty-thread spam StrictMode's double effect used to produce,
   * and keeps the sidebar free of conversations the user never wrote in.
   */
  const ensureConversation = async () => {
    if (activeConversation) return activeConversation;
    if (!repositoryId) return null;

    if (!pendingCreateRef.current) {
      pendingCreateRef.current = chatApi.createConversation(repositoryId);
    }

    try {
      const conversation = await pendingCreateRef.current;
      setConversations((previous) =>
        previous.some((item) => item.id === conversation.id) ? previous : [conversation, ...previous],
      );
      if (!activeIdRef.current) setActive(conversation);
      return conversation;
    } finally {
      pendingCreateRef.current = null;
    }
  };

  useEffect(() => {
    if (!repositoryId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [repo, chats] = await Promise.all([
          repositoryApi.getOne(repositoryId),
          chatApi.getConversations(repositoryId),
        ]);
        if (cancelled) return;

        setRepository(repo);
        setConversations(chats);

        const first = chats[0];
        if (!first) return;

        setActive(first);
        setMessagesLoading(true);
        try {
          const data = await chatApi.getMessages(first.id);
          if (cancelled) return;
          setMessages(data);
        } catch (err) {
          if (!cancelled) toast.error(getApiError(err, 'Could not load conversation'));
        } finally {
          if (!cancelled) setMessagesLoading(false);
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err, 'Could not load this repository.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [repositoryId, setActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  // Grow the composer with its content instead of trapping long questions in a
  // single-line box.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [question]);

  const sendQuestion = async () => {
    const text = question.trim();
    if (!repositoryId || !text || sending) return;

    setSending(true);
    setQuestion('');

    let conversation: Conversation | null;
    try {
      conversation = await ensureConversation();
    } catch (err) {
      toast.error(getApiError(err, 'Could not start a conversation'));
      setQuestion(text);
      setSending(false);
      return;
    }

    if (!conversation) {
      setQuestion(text);
      setSending(false);
      return;
    }

    const conversationId = conversation.id;
    const temporaryId = `pending-${Date.now()}`;

    appendIfActive(conversationId, {
      id: temporaryId,
      conversationId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    });

    try {
      const result = await chatApi.ask(repositoryId, conversationId, text);
      appendIfActive(conversationId, {
        id: `answer-${Date.now()}`,
        conversationId,
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(getApiError(err, 'Could not generate an answer'));
      if (activeIdRef.current === conversationId) {
        setMessages((previous) => previous.filter((message) => message.id !== temporaryId));
        setQuestion((current) => current || text);
      }
    } finally {
      setSending(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await sendQuestion();
  };

  const requestDeleteConversation = (conversation: Conversation) => {
    if (deletingId || sending) return;
    setConfirmDeleteConversation(conversation);
  };

  const cancelDeleteConversation = () => {
    if (deletingId) return; // don't allow cancel mid-delete
    setConfirmDeleteConversation(null);
  };

  const confirmDeleteConversationHandler = async () => {
    if (!confirmDeleteConversation) return;
    const target = confirmDeleteConversation;

    try {
      setDeletingId(target.id);
      await chatApi.deleteConversation(target.id);

      const remaining = conversations.filter((item) => item.id !== target.id);
      setConversations(remaining);

      // If the deleted thread was open, fall back to the next conversation
      // (the list is newest-first) or the empty state when none remain.
      if (activeIdRef.current === target.id) {
        const next = remaining[0];
        if (next) {
          await selectConversation(next);
        } else {
          setActive(null);
          setMessages([]);
        }
      }

      toast.success('Conversation deleted');
      setConfirmDeleteConversation(null);
    } catch (err) {
      toast.error(getApiError(err, 'Could not delete conversation'));
    } finally {
      setDeletingId(null);
    }
  };

  if (!repositoryId) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-10">
        <ErrorState message="Missing repository id." />
      </main>
    );
  }

  if (loading) {
    return (
      <div className="grid h-[calc(100dvh-4rem)] place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !repository) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-10">
        <ErrorState
          message={error || 'Repository not found'}
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1400px] flex-col overflow-hidden px-3 pb-3 sm:px-5">
      {/* Delete conversation confirmation modal */}
      {confirmDeleteConversation && (
        <DeleteModal
          title="Delete conversation?"
          message={
            <>
              This permanently deletes this conversation along with all of its messages.
              <span className="mt-1 block text-slate-500">This action cannot be undone.</span>
            </>
          }
          confirmLabel="Delete conversation"
          loading={Boolean(deletingId)}
          onConfirm={() => void confirmDeleteConversationHandler()}
          onCancel={cancelDeleteConversation}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface md:flex-row">
        <ConversationList
          conversations={conversations}
          activeId={activeConversation?.id ?? null}
          onSelect={(conversation) => void selectConversation(conversation)}
          onNew={() => void startNewConversation()}
          onDelete={requestDeleteConversation}
          creating={creating}
          deletingId={deletingId}
          disabled={sending}
        />

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Back to repositories"
                title="Back to repositories"
              >
                <ArrowLeft size={15} />
              </button>
              <div className="min-w-0">
                <p className="code-font text-[9px] uppercase tracking-[0.18em] text-slate-600">
                  repository chat
                </p>
                <h1 className="mt-1 truncate text-sm font-semibold text-white">
                  {repository.owner}/{repository.name}
                </h1>
              </div>
            </div>
            <a
              href={repository.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:border-lime-300/25 hover:text-lime-300"
            >
              GitHub <ExternalLink size={12} />
            </a>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7">
            {messagesLoading ? (
              <div className="grid min-h-full place-items-center">
                <Spinner size="md" />
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center text-center">
                <div>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-lime-300/10 bg-lime-300/[0.05] text-lime-300">
                    <FileCode2 size={20} />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Ask the codebase anything.
                  </h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    Architecture, authentication, data flow, functions, modules, or implementation
                    details.
                  </p>
                  <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((prompt) => (
                      <button
                        type="button"
                        key={prompt}
                        onClick={() => {
                          setQuestion(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="rounded-xl border border-line bg-white/[0.025] px-3 py-2 text-xs text-slate-500 transition hover:border-lime-300/25 hover:text-white"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {sending && (
                  /* Matches MessageBubble's assistant geometry so the bubble
                     doesn't jump when the real answer replaces it. */
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-white/[0.08] bg-surface-2 px-4 py-4 sm:px-5">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <Spinner size="sm" /> Searching the repository...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.07] px-4 py-3 sm:px-6">
            <form
              onSubmit={submit}
              className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line bg-surface-2 p-2 transition-colors focus-within:border-accent/35"
            >
              <Textarea
                ref={textareaRef}
                rows={1}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendQuestion();
                  }
                }}
                placeholder="Ask about this repository..."
                disabled={sending}
                className="max-h-40 overflow-y-auto border-0 bg-transparent py-2.5 focus:border-0 focus:ring-0"
              />
              <button
                type="submit"
                disabled={!question.trim() || sending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-black transition-colors hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send question"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center code-font text-[9px] uppercase tracking-[0.15em] text-slate-700">
              enter to send &middot; shift + enter for a new line
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
