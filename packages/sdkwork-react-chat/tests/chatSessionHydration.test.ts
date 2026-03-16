import { describe, expect, it, vi } from 'vitest';

import type { ChatMessage, ChatSession } from '../src/entities';
import { hydrateActiveChatSession } from '../src/store/chatSessionHydration';

const createSession = (id: string, title: string): ChatSession => ({
  id,
  uuid: id,
  title,
  modelId: 'gpt-4o',
  isArchived: false,
  pinned: false,
  messageCount: 0,
  createdAt: 1,
  updatedAt: 1,
});

const createMessage = (id: string, content: string): ChatMessage => ({
  id,
  role: 'user',
  content,
  timestamp: 1,
  status: 'completed',
});

describe('hydrateActiveChatSession', () => {
  it('hydrates a session from the provided metadata list instead of relying on store state', async () => {
    const sessions = [createSession('session-1', 'First'), createSession('session-2', 'Second')];
    const loadTranscript = vi.fn(async () => ({
      success: true as const,
      data: {
        sessionId: 'session-1',
        messages: [createMessage('msg-1', 'hello')],
      },
    }));

    const hydrated = await hydrateActiveChatSession('session-1', sessions, loadTranscript);

    expect(loadTranscript).toHaveBeenCalledWith('session-1');
    expect(hydrated).toMatchObject({
      id: 'session-1',
      title: 'First',
      messages: [{ id: 'msg-1', content: 'hello' }],
    });
  });

  it('falls back to an empty transcript when transcript loading fails', async () => {
    const sessions = [createSession('session-1', 'First')];
    const loadTranscript = vi.fn(async () => ({
      success: false as const,
      message: 'boom',
    }));

    const hydrated = await hydrateActiveChatSession('session-1', sessions, loadTranscript);

    expect(hydrated).toMatchObject({
      id: 'session-1',
      title: 'First',
      messages: [],
    });
  });
});
