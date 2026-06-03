import { describe, expect, it } from 'vitest';

import type { ChatSession } from '../entities';
import {
  findChatSessionByKey,
  removeChatSessionByKey,
  replaceChatSessionByKey,
} from './chatSessionIdentity';
import * as chatSessionIdentity from './chatSessionIdentity';

const createSession = (id: string, uuid: string, title: string): ChatSession => ({
  id,
  uuid,
  title,
  modelId: 'gpt-4o',
  isArchived: false,
  pinned: false,
  messageCount: 0,
  createdAt: 1,
  updatedAt: 1,
});

describe('chatSessionIdentity', () => {
  it('finds sessions by uuid first with id fallback', () => {
    const sessions = [
      createSession('session-db-1', 'session-uuid-1', 'First'),
      createSession('session-db-2', 'session-uuid-2', 'Second'),
    ];

    expect(findChatSessionByKey(sessions, 'session-uuid-1')?.title).toBe('First');
    expect(findChatSessionByKey(sessions, 'session-db-2')?.title).toBe('Second');
  });

  it('replaces sessions by uuid key', () => {
    const sessions = [
      createSession('session-db-1', 'session-uuid-1', 'First'),
      createSession('session-db-2', 'session-uuid-2', 'Second'),
    ];

    const next = replaceChatSessionByKey(
      sessions,
      'session-uuid-2',
      createSession('session-db-2', 'session-uuid-2', 'Second Updated')
    );

    expect(next[1]?.title).toBe('Second Updated');
  });

  it('removes sessions by uuid key', () => {
    const sessions = [
      createSession('session-db-1', 'session-uuid-1', 'First'),
      createSession('session-db-2', 'session-uuid-2', 'Second'),
    ];

    expect(removeChatSessionByKey(sessions, 'session-uuid-1')).toEqual([
      expect.objectContaining({ uuid: 'session-uuid-2' }),
    ]);
  });

  it('reuses the active hydrated session when a stable session key already exists', async () => {
    const resolveChatSessionSendTarget = (
      chatSessionIdentity as {
        resolveChatSessionSendTarget?: (options: {
          activeSessionKey: string | null;
          activeSession: { id: string; uuid: string; messages: unknown[] } | null;
          isGenerating: boolean;
          createSession: (modelId?: string) => Promise<string>;
          getSessionByKey: (sessionKey: string) => { id: string; uuid: string; messages: unknown[] } | null;
          modelId?: string;
        }) => Promise<{ sessionKey: string; session: { id: string; uuid: string; messages: unknown[] } } | null>;
      }
    ).resolveChatSessionSendTarget;

    expect(resolveChatSessionSendTarget).toBeTypeOf('function');
    if (!resolveChatSessionSendTarget) {
      return;
    }

    const createSession = async () => 'unexpected-session-key';
    const activeSession = { id: 'session-db-1', uuid: 'session-uuid-1', messages: [] };

    const target = await resolveChatSessionSendTarget({
      activeSessionKey: 'session-uuid-1',
      activeSession,
      isGenerating: false,
      createSession,
      getSessionByKey: () => activeSession,
      modelId: 'gpt-4o',
    });

    expect(target).toEqual({
      sessionKey: 'session-uuid-1',
      session: activeSession,
    });
  });

  it('creates and resolves a fresh session target when no active session exists', async () => {
    const resolveChatSessionSendTarget = (
      chatSessionIdentity as {
        resolveChatSessionSendTarget?: (options: {
          activeSessionKey: string | null;
          activeSession: { id: string; uuid: string; messages: unknown[] } | null;
          isGenerating: boolean;
          createSession: (modelId?: string) => Promise<string>;
          getSessionByKey: (sessionKey: string) => { id: string; uuid: string; messages: unknown[] } | null;
          modelId?: string;
        }) => Promise<{ sessionKey: string; session: { id: string; uuid: string; messages: unknown[] } } | null>;
      }
    ).resolveChatSessionSendTarget;

    expect(resolveChatSessionSendTarget).toBeTypeOf('function');
    if (!resolveChatSessionSendTarget) {
      return;
    }

    const createdSession = { id: 'session-db-2', uuid: 'session-uuid-2', messages: [] };

    const target = await resolveChatSessionSendTarget({
      activeSessionKey: null,
      activeSession: null,
      isGenerating: false,
      createSession: async (modelId?: string) => {
        expect(modelId).toBe('gpt-4.1');
        return 'session-uuid-2';
      },
      getSessionByKey: (sessionKey) =>
        sessionKey === 'session-uuid-2' ? createdSession : null,
      modelId: 'gpt-4.1',
    });

    expect(target).toEqual({
      sessionKey: 'session-uuid-2',
      session: createdSession,
    });
  });

  it('does not create or resolve a send target while a response is already generating', async () => {
    const resolveChatSessionSendTarget = (
      chatSessionIdentity as {
        resolveChatSessionSendTarget?: (options: {
          activeSessionKey: string | null;
          activeSession: { id: string; uuid: string; messages: unknown[] } | null;
          isGenerating: boolean;
          createSession: (modelId?: string) => Promise<string>;
          getSessionByKey: (sessionKey: string) => { id: string; uuid: string; messages: unknown[] } | null;
          modelId?: string;
        }) => Promise<{ sessionKey: string; session: { id: string; uuid: string; messages: unknown[] } } | null>;
      }
    ).resolveChatSessionSendTarget;

    expect(resolveChatSessionSendTarget).toBeTypeOf('function');
    if (!resolveChatSessionSendTarget) {
      return;
    }

    const createSession = async () => {
      throw new Error('createSession should not be called while generating');
    };

    const target = await resolveChatSessionSendTarget({
      activeSessionKey: null,
      activeSession: null,
      isGenerating: true,
      createSession,
      getSessionByKey: () => null,
      modelId: 'gpt-4o',
    });

    expect(target).toBeNull();
  });
});
