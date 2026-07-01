import { describe, expect, it } from 'vitest';

import {
  createChatMessage,
  createEmptyChatTranscript,
  normalizeChatTranscript,
} from './chatIdentity';

describe('chatIdentity', () => {
  it('creates chat messages with uuid-first local identity', () => {
    const message = createChatMessage('user', 'hello world');

    expect(message).toMatchObject({
      id: null,
      uuid: expect.any(String),
      role: 'user',
      content: 'hello world',
      status: 'completed',
    });
  });

  it('normalizes transcripts to the provided session key and derives message uuid from persisted ids', () => {
    const transcript = normalizeChatTranscript('session-uuid-1', {
      sessionId: 'session-db-1',
      messages: [
        {
          id: 'message-db-1',
          role: 'user',
          content: 'keep the transcript stable',
          timestamp: 1,
          status: 'completed',
        },
      ],
    });

    expect(transcript).toMatchObject({
      id: null,
      uuid: 'session-uuid-1',
      sessionId: 'session-uuid-1',
    });
    expect(transcript.messages[0]).toMatchObject({
      id: 'message-db-1',
      uuid: 'client-entity:message-db-1',
      content: 'keep the transcript stable',
    });
  });

  it('creates empty transcripts with stable session identity', () => {
    const transcript = createEmptyChatTranscript('session-uuid-2');

    expect(transcript).toEqual({
      id: null,
      uuid: 'session-uuid-2',
      sessionId: 'session-uuid-2',
      messages: [],
    });
  });
});
