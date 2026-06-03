import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  persistChooseAssetProjectReference: vi.fn(async () => undefined),
}));

vi.mock('../src/components/chooseAssetProjectReference', () => ({
  persistChooseAssetProjectReference: mocks.persistChooseAssetProjectReference,
}));

import { persistChooseAssetModalSelectionProjectReferences } from '../src/components/chooseAssetModalProjectReference';

describe('ChooseAssetModal selection project reference persistence', () => {
  beforeEach(() => {
    mocks.persistChooseAssetProjectReference.mockReset();
    mocks.persistChooseAssetProjectReference.mockResolvedValue(undefined);
  });

  it('persists a project-level reference for every confirmed modal asset selection', async () => {
    await persistChooseAssetModalSelectionProjectReferences({
      assets: [
        {
          id: 'asset-db-1',
          name: 'voice-1.wav',
          type: 'audio',
          path: 'assets://uploads/voice-1.wav',
        } as any,
        {
          id: 'asset-db-2',
          name: 'voice-2.wav',
          type: 'audio',
          path: 'assets://uploads/voice-2.wav',
        } as any,
      ],
      domain: 'voice-speaker',
      projectReference: {
        slot: 'voice-lab-reference-audio',
        metadata: {
          source: 'voice-lab-modal',
        },
      },
    });

    expect(mocks.persistChooseAssetProjectReference).toHaveBeenCalledTimes(2);
    expect(mocks.persistChooseAssetProjectReference).toHaveBeenNthCalledWith(1, {
      uploaded: expect.objectContaining({
        id: 'asset-db-1',
        path: 'assets://uploads/voice-1.wav',
      }),
      resolvedUrl: 'assets://uploads/voice-1.wav',
      fallbackType: 'audio',
      domain: 'voice-speaker',
      projectReference: {
        slot: 'voice-lab-reference-audio',
        metadata: {
          source: 'voice-lab-modal',
        },
      },
    });
    expect(mocks.persistChooseAssetProjectReference).toHaveBeenNthCalledWith(2, {
      uploaded: expect.objectContaining({
        id: 'asset-db-2',
        path: 'assets://uploads/voice-2.wav',
      }),
      resolvedUrl: 'assets://uploads/voice-2.wav',
      fallbackType: 'audio',
      domain: 'voice-speaker',
      projectReference: {
        slot: 'voice-lab-reference-audio',
        metadata: {
          source: 'voice-lab-modal',
        },
      },
    });
  });

  it('skips persistence when projectReference is missing', async () => {
    await persistChooseAssetModalSelectionProjectReferences({
      assets: [
        {
          id: 'asset-db-1',
          name: 'voice-1.wav',
          type: 'audio',
          path: 'assets://uploads/voice-1.wav',
        } as any,
      ],
      domain: 'voice-speaker',
    });

    expect(mocks.persistChooseAssetProjectReference).not.toHaveBeenCalled();
  });
});
