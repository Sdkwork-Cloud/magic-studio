import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmbeddedChatPane } from './EmbeddedChatPane';

const mockUseChatStore = vi.fn();

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../store/chatStore', () => ({
  useChatStore: () => mockUseChatStore(),
}));

vi.mock('./MessageList', () => ({
  MessageList: () => React.createElement('div', { 'data-testid': 'message-list' }, 'MessageList'),
}));

vi.mock('./ChatInput', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'chat-input' }, 'ChatInput'),
}));

describe('EmbeddedChatPane', () => {
  beforeEach(() => {
    mockUseChatStore.mockReturnValue({
      currentSession: {
        id: 'session-1',
        title: 'Session 1',
        messages: [],
      },
      sendMessage: vi.fn(),
      createSession: vi.fn(),
      sessions: [],
      selectSession: vi.fn(),
      deleteSession: vi.fn(),
      activeSessionId: 'session-1',
      isGenerating: false,
    });
  });

  it('renders the embedded shell with aligned header and floating history panel styles', () => {
    const html = renderToStaticMarkup(
      <EmbeddedChatPane
        getContext={() => ''}
      />
    );

    expect(html).toContain('app-header-glass');
    expect(html).toContain('app-floating-panel');
    expect(html).toContain('app-surface-subtle');
  });
});
