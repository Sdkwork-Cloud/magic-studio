import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationProps: null as Record<string, unknown> | null,
  setConfig: vi.fn(),
  navigate: vi.fn(),
  deleteTask: vi.fn(),
  generate: vi.fn(),
  config: {
    prompt: '',
    duration: 5,
    model: 'tango',
    mediaType: 'audio',
  } as Record<string, unknown>,
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  GenerationChatWindow: (props: Record<string, unknown>) => {
    mocks.generationProps = props;
    return null;
  },
}));

vi.mock('../index', () => ({
  SfxStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useSfxStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    generate: mocks.generate,
    isGenerating: false,
    config: mocks.config,
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    SFX: '/sfx',
  },
}));

import SfxChatPage from './SfxChatPage';

describe('SfxChatPage upload entry', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
    mocks.config = {
      prompt: '',
      duration: 5,
      model: 'tango',
      mediaType: 'audio',
    };
  });

  it('does not expose upload action when sfx chat has no reference asset workflow', () => {
    renderToStaticMarkup(<SfxChatPage />);

    expect(mocks.generationProps).toBeTruthy();
    expect(mocks.generationProps?.onUpload).toBeUndefined();
  });
});
