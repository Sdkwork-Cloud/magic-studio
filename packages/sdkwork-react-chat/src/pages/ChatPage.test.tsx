import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChatPage from './ChatPage';

const mockUseRouter = vi.fn();
const mockUseChatStore = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  useRouter: () => mockUseRouter(),
}));

vi.mock('@sdkwork/react-commons', () => ({
  Button: ({
    children,
    className,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) =>
    React.createElement('button', { className, ...props }, children),
}));

vi.mock('../components/ChatInput', () => ({
  ChatInput: () => React.createElement('div', { 'data-testid': 'chat-input' }, 'ChatInput'),
}));

vi.mock('../components/ChatSidebar', () => ({
  ChatSidebar: () => React.createElement('div', { 'data-testid': 'chat-sidebar' }, 'ChatSidebar'),
}));

vi.mock('../components/MessageBubble', () => ({
  MessageBubble: ({ message }: { message: { content: string } }) =>
    React.createElement('div', null, message.content),
}));

vi.mock('../store/chatStore', () => ({
  useChatStore: () => mockUseChatStore(),
}));

describe('ChatPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
    });

    mockUseChatStore.mockReturnValue({
      currentSession: null,
      isGenerating: false,
      sendMessage: vi.fn(),
    });
  });

  it('renders the chat shell with shared floating and status primitives', () => {
    const html = renderToStaticMarkup(<ChatPage />);

    expect(html).toContain('app-floating-panel');
    expect(html).toContain('app-header-action');
    expect(html).toContain('app-status-pill');
  });
});
