/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  videoUploadOnChange: null as ((file: {
    data: Uint8Array;
    name: string;
    url: string;
    path?: string;
  }) => void) | null,
  imageUploadOnChange: null as ((file: {
    data: Uint8Array;
    name: string;
    url: string;
    path?: string;
  }) => void) | null,
  fetchCreationCapabilities: vi.fn(),
  flattenCreationModels: vi.fn(),
  findCreationModel: vi.fn(),
  resolveCreationEntryCapabilityOptions: vi.fn(),
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
    VideoUpload: ({ onChange }: any) => {
      mocks.videoUploadOnChange = onChange;
      return <button type="button" data-testid="video-upload">upload-video</button>;
    },
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

vi.mock('../src/components/generate/upload/PreviewModal', () => ({
  PreviewModal: () => null,
}));

vi.mock('../src/services/creationCapabilityService', () => ({
  fetchCreationCapabilities: mocks.fetchCreationCapabilities,
  flattenCreationModels: mocks.flattenCreationModels,
  findCreationModel: mocks.findCreationModel,
  resolveCreationEntryCapabilityOptions: mocks.resolveCreationEntryCapabilityOptions,
}));

describe('UploadVideoGenerationModal capability fallback', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    mocks.videoUploadOnChange = null;
    mocks.imageUploadOnChange = null;
    mocks.fetchCreationCapabilities.mockResolvedValue({
      target: 'video',
      channels: [
        {
          channel: 'MOCK',
          models: [
            {
              model: 'video-capable-model',
              name: 'Video Capable Model',
              capabilities: {},
            },
          ],
        },
      ],
      styleOptions: [],
    });
    mocks.flattenCreationModels.mockReturnValue([
      {
        model: 'video-capable-model',
        name: 'Video Capable Model',
      },
    ]);
    mocks.findCreationModel.mockImplementation((_snapshot, model: string) =>
      model
        ? {
            model,
            name: 'Video Capable Model',
          }
        : undefined
    );
    mocks.resolveCreationEntryCapabilityOptions.mockReturnValue({
      aspectRatioOptions: [{ label: '4:3', value: '4:3' }],
      durationOptions: [{ label: '8s', value: '8s' }],
      resolutionOptions: [{ label: '720p', value: '720p' }],
    });
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('uses capability-derived fallback values for rendering and emitted import data', async () => {
    const { UploadVideoGenerationModal } = await import(
      '../src/components/generate/upload/UploadVideoGenerationModal'
    );
    const onImport = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <UploadVideoGenerationModal
          onImport={onImport}
          onClose={onClose}
        />
      );
      await Promise.resolve();
    });

    expect(mocks.videoUploadOnChange).toBeTypeOf('function');

    await act(async () => {
      mocks.videoUploadOnChange?.({
        data: new Uint8Array([1, 2, 3]),
        name: 'imported-video.mp4',
        url: 'https://example.com/imported-video.mp4',
        path: 'D:/imports/imported-video.mp4',
      });
    });

    const selects = Array.from(document.body.querySelectorAll('select')) as HTMLSelectElement[];
    expect(selects.map((select) => select.value)).toEqual([
      'video-capable-model',
      '4:3',
      '8',
      '720p',
    ]);

    const importButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('studio.common.import') &&
      button.textContent?.includes('Video')
    );
    expect(importButton).toBeTruthy();

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'video',
        model: 'video-capable-model',
        aspectRatio: '4:3',
        duration: 8,
        resolution: '720p',
        resource: expect.objectContaining({
          type: 'video',
          url: 'https://example.com/imported-video.mp4',
        }),
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
