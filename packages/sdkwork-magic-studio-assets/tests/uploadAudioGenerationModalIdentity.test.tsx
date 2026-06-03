/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  audioUploadOnChange: null as ((file: {
    data: Uint8Array;
    name: string;
    url: string;
    path?: string;
  }) => void) | null,
}));

vi.mock('@sdkwork/magic-studio-commons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-commons')>();
  return {
    ...actual,
    Button: ({ children, onClick, disabled, ...rest }: any) => (
      <button type="button" onClick={onClick} disabled={disabled} {...rest}>
        {children}
      </button>
    ),
    AudioUpload: ({ onChange }: any) => {
      mocks.audioUploadOnChange = onChange;
      return <button type="button" data-testid="audio-upload">upload-audio</button>;
    },
  };
});

vi.mock('@sdkwork/magic-studio-settings', () => ({
  SettingInput: ({ value, onChange, label }: any) => (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  ),
}));

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../src/components/generate/promptCapabilityProps', () => ({
  createPromptTextInputCapabilityProps: () => ({}),
}));

vi.mock('../src/components/generate/PromptTextInput', () => ({
  PromptTextInput: ({ value, onChange }: any) => (
    <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  ),
}));

describe('UploadAudioGenerationModal identity handling', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    mocks.audioUploadOnChange = null;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('emits canonical audio import payloads for uploaded speech results', async () => {
    const { UploadAudioGenerationModal } = await import('../src/components/generate/upload/UploadAudioGenerationModal');
    const onImport = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <UploadAudioGenerationModal
          onImport={onImport}
          onClose={onClose}
        />
      );
    });

    expect(mocks.audioUploadOnChange).toBeTypeOf('function');

    await act(async () => {
      mocks.audioUploadOnChange?.({
        data: new Uint8Array([1, 2, 3]),
        name: 'imported-speech.wav',
        url: 'https://example.com/imported-speech.wav',
        path: 'D:/imports/imported-speech.wav',
      });
    });

    const importButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('studio.common.import') &&
      button.textContent?.includes('Audio')
    );
    expect(importButton).toBeTruthy();

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        id: null,
        uuid: expect.any(String),
        type: 'audio',
        resource: expect.objectContaining({
          id: null,
          uuid: expect.any(String),
          type: 'audio',
          url: 'https://example.com/imported-speech.wav',
          name: 'imported-speech.wav',
          metadata: {
            sourcePath: 'D:/imports/imported-speech.wav',
          },
        }),
      })
    );
  });
});
