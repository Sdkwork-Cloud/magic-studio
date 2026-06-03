/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  imageUploadOnChange: null as ((file: {
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
    ImageUpload: ({ onChange }: any) => {
      mocks.imageUploadOnChange = onChange;
      return <button type="button" data-testid="image-upload">upload-image</button>;
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
  SettingSelect: ({ value, onChange, label, options }: any) => (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map((option: { label: string; value: string }) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

describe('UploadCharacterGenerationModal identity handling', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    mocks.imageUploadOnChange = null;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('emits canonical character import payloads while preserving image resource identity', async () => {
    const { UploadCharacterGenerationModal } = await import('../src/components/generate/upload/UploadCharacterGenerationModal');
    const onImport = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <UploadCharacterGenerationModal
          onImport={onImport}
          onClose={onClose}
        />
      );
    });

    expect(mocks.imageUploadOnChange).toBeTypeOf('function');

    await act(async () => {
      mocks.imageUploadOnChange?.({
        data: new Uint8Array([1, 2, 3]),
        name: 'imported-character.png',
        url: 'https://example.com/imported-character.png',
        path: 'D:/imports/imported-character.png',
      });
    });

    const importButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('studio.common.import') &&
      button.textContent?.includes('Character')
    );
    expect(importButton).toBeTruthy();

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        id: null,
        uuid: expect.any(String),
        type: 'character',
        resource: expect.objectContaining({
          id: null,
          uuid: expect.any(String),
          type: 'image',
          url: 'https://example.com/imported-character.png',
          name: 'imported-character.png',
          metadata: {
            sourcePath: 'D:/imports/imported-character.png',
          },
        }),
      })
    );
  });
});
