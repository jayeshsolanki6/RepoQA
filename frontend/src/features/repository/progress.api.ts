import type { ProgressEvent } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProgressHandlers {
  onEvent: (event: ProgressEvent) => void;
  onError?: (error: Error) => void;
}

function parseEvents(buffer: string): { events: ProgressEvent[]; rest: string } {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? '';
  const events: ProgressEvent[] = [];

  for (const block of parts) {
    let data = '';
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data) continue;
    try {
      events.push(JSON.parse(data) as ProgressEvent);
    } catch {
      // Ignore malformed event blocks.
    }
  }

  return { events, rest };
}

/**
 * Subscribes to the indexing progress stream.
 *
 * Authentication is cookie-based: the SSE middleware reads the refreshToken
 * cookie, so `credentials: 'include'` is what authorises this request. An
 * Authorization header would be ignored, which is why none is sent.
 */
export async function streamProgress(
  repositoryId: string,
  handlers: ProgressHandlers,
  signal: AbortSignal,
) {
  const response = await fetch(`${API_URL}/repositories/${repositoryId}/progress`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'text/event-stream' },
    signal,
  });

  if (!response.ok) {
    void response.body?.cancel().catch(() => {});
    throw new Error(
      response.status === 401
        ? 'Your session expired. Reload the page to continue.'
        : `Progress stream failed (${response.status})`,
    );
  }
  if (!response.body) throw new Error('The server did not return a progress stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parsed = parseEvents(buffer);
      buffer = parsed.rest;

      for (const event of parsed.events) {
        handlers.onEvent(event);
        // The backend keeps the connection open after a terminal event.
        if (event.step === 'completed' || event.step === 'failed') return;
      }
    }
  } catch (error) {
    if (!signal.aborted) {
      handlers.onError?.(error instanceof Error ? error : new Error('SSE connection failed'));
    }
  } finally {
    /*
     * `releaseLock()` leaves the response body undrained, so the socket stays
     * open after a terminal event or unmount. Cancelling closes it.
     */
    try {
      await reader.cancel();
    } catch {
      // Already closed or aborted.
    }
  }
}
