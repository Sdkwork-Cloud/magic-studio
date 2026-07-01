/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGeneratedImageResult } from '../entities';

const mocks = vi.hoisted(() => {
  const editOutcome = {
    recipe: {
      id: null,
      uuid: 'recipe-uuid-edit-1',
      product: 'image',
      mode: 'remove',
      prompt: 'remove prompt',
      negativePrompt: 'blur',
      inputRefs: [],
      parameters: {},
    },
    execution: {
      id: null,
      uuid: 'execution-uuid-edit-1',
      provider: 'app-image',
      providerModel: 'gemini-2.5-flash-image',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'artifact-set-uuid-edit-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/edited-image.png',
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
      artifactUuid: 'artifact-uuid-edit-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'artifact-uuid-edit-1',
      type: 'image',
      resource: {
        id: null,
        uuid: 'resource-uuid-edit-1',
        url: 'https://example.com/edited-image.png',
      },
    },
  };
  const upscaleOutcome = {
    recipe: {
      id: null,
      uuid: 'recipe-uuid-upscale-1',
      product: 'image',
      mode: 'upscale',
      prompt: 'upscale prompt',
      negativePrompt: undefined,
      inputRefs: [],
      parameters: {},
    },
    execution: {
      id: null,
      uuid: 'execution-uuid-upscale-1',
      provider: 'app-image',
      providerModel: 'upscaler-pro',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'artifact-set-uuid-upscale-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/upscaled-image.png',
      mimeType: 'image/png',
      width: 2048,
      height: 2048,
      artifactUuid: 'artifact-uuid-upscale-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'artifact-uuid-upscale-1',
      type: 'image',
      resource: {
        id: null,
        uuid: 'resource-uuid-upscale-1',
        url: 'https://example.com/upscaled-image.png',
      },
    },
  };

  return {
    editorProps: null as Record<string, unknown> | null,
    editImage: vi.fn(async () => editOutcome),
    upscaleImage: vi.fn(async () => upscaleOutcome),
    persistImageGenerationResult: vi.fn(async ({ outcome }: { outcome: unknown }) =>
      outcome === editOutcome
        ? createGeneratedImageResult({
            uuid: 'persisted-edit-image-uuid-1',
            assetId: 'persisted-edit-asset-1',
            assetUuid: 'persisted-edit-asset-uuid-1',
            resource: {
              id: null,
              uuid: 'persisted-edit-image-uuid-1',
              assetId: 'persisted-edit-asset-1',
              assetUuid: 'persisted-edit-asset-uuid-1',
              url: 'https://storage.example.com/persisted-edit-image.png',
              width: 1024,
              height: 1024,
              name: 'persisted-edit-image.png',
            },
            prompt: 'remove prompt',
            negativePrompt: 'blur',
            width: 1024,
            height: 1024,
          })
        : createGeneratedImageResult({
            uuid: 'persisted-upscale-image-uuid-1',
            assetId: 'persisted-upscale-asset-1',
            assetUuid: 'persisted-upscale-asset-uuid-1',
            resource: {
              id: null,
              uuid: 'persisted-upscale-image-uuid-1',
              assetId: 'persisted-upscale-asset-1',
              assetUuid: 'persisted-upscale-asset-uuid-1',
              url: 'https://storage.example.com/persisted-upscale-image.png',
              width: 2048,
              height: 2048,
              name: 'persisted-upscale-image.png',
            },
            width: 2048,
            height: 2048,
          })
    ),
    onClose: vi.fn(),
    onSave: vi.fn(),
  };
});

vi.mock('@sdkwork/magic-studio-commons', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('./ImageCanvasEditor', () => ({
  ImageCanvasEditor: (props: Record<string, unknown>) => {
    mocks.editorProps = props;
    return <div data-testid="image-canvas-editor" />;
  },
}));

vi.mock('../services', () => ({
  imageBusinessService: {
    imageService: {
      editImage: mocks.editImage,
      upscaleImage: mocks.upscaleImage,
    },
  },
  persistImageGenerationResult: mocks.persistImageGenerationResult,
}));

import { ImageCanvasEditorModal } from './ImageCanvasEditorModal';

describe('ImageCanvasEditorModal', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  const sourceImage = createGeneratedImageResult({
    uuid: 'source-image-uuid-1',
    assetId: 'source-asset-1',
    assetUuid: 'source-asset-uuid-1',
    resource: {
      id: null,
      uuid: 'source-image-uuid-1',
      assetId: 'source-asset-1',
      assetUuid: 'source-asset-uuid-1',
      url: 'https://storage.example.com/source-image.png',
      width: 1024,
      height: 1024,
      name: 'source-image.png',
    },
    prompt: 'cinematic portrait',
    negativePrompt: 'blur',
    width: 1024,
    height: 1024,
  });

  beforeEach(() => {
    mocks.editorProps = null;
    mocks.editImage.mockClear();
    mocks.upscaleImage.mockClear();
    mocks.persistImageGenerationResult.mockClear();
    mocks.onClose.mockClear();
    mocks.onSave.mockClear();

    container = document.createElement('div');
    document.body.appendChild(container);
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    root = null;
    container?.remove();
    container = null;
    document.body.innerHTML = '';
  });

  it('routes remove actions through image business edit service and persists the returned result', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <ImageCanvasEditorModal
          isOpen
          image={sourceImage}
          onClose={mocks.onClose}
          onSave={mocks.onSave}
        />
      );
    });

    const onAIEdit = mocks.editorProps?.onAIEdit as ((request: unknown) => Promise<unknown>) | undefined;
    expect(onAIEdit).toBeTruthy();

    let result: unknown;
    await act(async () => {
      result = await onAIEdit?.({
        source: sourceImage,
        mode: 'remove',
        mask: 'data:image/png;base64,AAAA',
      });
    });

    expect(mocks.editImage).toHaveBeenCalledWith({
      source: sourceImage,
      mode: 'remove',
      mask: 'data:image/png;base64,AAAA',
    });
    expect(mocks.upscaleImage).not.toHaveBeenCalled();
    expect(mocks.persistImageGenerationResult).toHaveBeenCalledWith({
      outcome: expect.objectContaining({
        delivery: expect.objectContaining({
          url: 'https://example.com/edited-image.png',
        }),
      }),
      name: expect.stringMatching(/^image-edit-remove-/),
    });
    expect(result).toMatchObject({
      uuid: 'persisted-edit-image-uuid-1',
      assetId: 'persisted-edit-asset-1',
      assetUuid: 'persisted-edit-asset-uuid-1',
    });
  });

  it('routes upscale actions through image business upscale service', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <ImageCanvasEditorModal
          isOpen
          image={sourceImage}
          onClose={mocks.onClose}
          onSave={mocks.onSave}
        />
      );
    });

    const onAIEdit = mocks.editorProps?.onAIEdit as ((request: unknown) => Promise<unknown>) | undefined;
    expect(onAIEdit).toBeTruthy();

    let result: unknown;
    await act(async () => {
      result = await onAIEdit?.({
        source: sourceImage,
        mode: 'upscale',
        mask: null,
      });
    });

    expect(mocks.upscaleImage).toHaveBeenCalledWith({
      source: sourceImage,
      mode: 'upscale',
      prompt: undefined,
    });
    expect(mocks.editImage).not.toHaveBeenCalled();
    expect(mocks.persistImageGenerationResult).toHaveBeenCalledWith({
      outcome: expect.objectContaining({
        delivery: expect.objectContaining({
          url: 'https://example.com/upscaled-image.png',
        }),
      }),
      name: expect.stringMatching(/^image-edit-upscale-/),
    });
    expect(result).toMatchObject({
      uuid: 'persisted-upscale-image-uuid-1',
      assetId: 'persisted-upscale-asset-1',
      assetUuid: 'persisted-upscale-asset-uuid-1',
    });
  });
});
