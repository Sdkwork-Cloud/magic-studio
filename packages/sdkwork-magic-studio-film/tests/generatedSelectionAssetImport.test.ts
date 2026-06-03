import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
  resolveAssetUrlByAssetIdFirst,
} = vi.hoisted(() => ({
  importAssetBySdk: vi.fn(),
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
  resolveAssetUrlByAssetIdFirst: vi.fn(),
}));

const {
  assetCenterInitialize,
  assetCenterFindById,
  assetCenterRegisterExistingAsset,
  assetCenterBindReference,
  readWorkspaceScope,
} = vi.hoisted(() => ({
  assetCenterInitialize: vi.fn(),
  assetCenterFindById: vi.fn(),
  assetCenterRegisterExistingAsset: vi.fn(),
  assetCenterBindReference: vi.fn(),
  readWorkspaceScope: vi.fn(),
}));

const { tryExtractInlineData } = vi.hoisted(() => ({
  tryExtractInlineData: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst,
  readWorkspaceScope,
  assetCenterService: {
    initialize: assetCenterInitialize,
    findById: assetCenterFindById,
    registerExistingAsset: assetCenterRegisterExistingAsset,
    bindReference: assetCenterBindReference,
  },
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  inlineDataService: {
    tryExtractInlineData,
  },
  resolveGenerationOutcomePrimaryUrl: (outcome: any) =>
    outcome?.primaryArtifact?.resource?.url || outcome?.delivery?.url || null,
}));

import {
  importFilmAssetFromFile,
  importFilmAssetFromUrl,
  resolveFilmGeneratedOutcomeAsset,
  resolveFilmGeneratedSelectionAsset,
  resolveChosenAsset,
} from '../src/utils/filmModalAssetImport';

describe('resolveFilmGeneratedSelectionAsset', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-film-1',
      projectId: 'film-project-1',
    });
  });

  it('prefers an existing asset-center id instead of re-importing the generated url', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-film.png');

    await expect(
      resolveFilmGeneratedSelectionAsset(
        {
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          url: 'https://tmp.example.com/generated-film.png',
        },
        'film_character_portrait.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'asset-1',
      uuid: 'asset-uuid-1',
      assetUuid: 'asset-uuid-1',
      resource: {
        id: null,
        uuid: 'asset-uuid-1',
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        type: 'image',
        url: 'https://cdn.example.com/final-film.png',
      },
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('derives a stable client uuid when a generated selection only exposes persisted asset id', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-selection-only-id.png');

    await expect(
      resolveFilmGeneratedSelectionAsset(
        {
          assetId: 'asset-selection-only-id-1',
          url: 'https://tmp.example.com/generated-selection-only-id.png',
        },
        'film_selection_only_id.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'asset-selection-only-id-1',
      uuid: 'client-asset:asset-selection-only-id-1',
      resource: {
        id: null,
        uuid: 'client-asset:asset-selection-only-id-1',
        assetId: 'asset-selection-only-id-1',
        type: 'image',
        url: 'https://cdn.example.com/final-selection-only-id.png',
      },
    });
  });

  it('reuses nested canonical identity from resource metadata instead of re-importing generated selections', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-selection-nested-metadata.png');
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-reimported-asset-1',
      uuid: 'film-reimported-asset-uuid-1',
      path: 'https://storage.example.com/reimported-film.png',
      metadata: {
        assetUuid: 'film-reimported-asset-uuid-1',
      },
    });

    await expect(
      resolveFilmGeneratedSelectionAsset(
        {
          resource: {
            url: 'https://tmp.example.com/generated-selection-nested-metadata.png',
            metadata: {
              assetId: 'asset-selection-nested-metadata-1',
              assetUuid: 'asset-selection-nested-metadata-uuid-1',
            },
          },
        } as any,
        'film_selection_nested_metadata.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'asset-selection-nested-metadata-1',
      uuid: 'asset-selection-nested-metadata-uuid-1',
      assetUuid: 'asset-selection-nested-metadata-uuid-1',
      resource: {
        id: null,
        uuid: 'asset-selection-nested-metadata-uuid-1',
        assetId: 'asset-selection-nested-metadata-1',
        assetUuid: 'asset-selection-nested-metadata-uuid-1',
        type: 'image',
        url: 'https://cdn.example.com/final-selection-nested-metadata.png',
      },
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('imports url-only generated selections into the film domain when no canonical asset exists yet', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-asset-1',
      uuid: 'film-asset-uuid-1',
      path: 'https://storage.example.com/generated-film.png',
      metadata: {
        assetUuid: 'film-asset-uuid-1',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      resolveFilmGeneratedSelectionAsset(
        {
          url: 'https://tmp.example.com/generated-film.png',
        },
        'film_character_portrait.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'film-asset-1',
      uuid: 'film-asset-uuid-1',
      assetUuid: 'film-asset-uuid-1',
      resource: {
        id: null,
        uuid: 'film-asset-uuid-1',
        assetId: 'film-asset-1',
        assetUuid: 'film-asset-uuid-1',
        type: 'image',
        url: 'https://storage.example.com/generated-film.png',
      },
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://tmp.example.com/generated-film.png',
      'image',
      {
        name: 'film_character_portrait.png',
        domain: 'film',
      }
    );
  });

  it('prefers canonical resource urls over flat result urls when importing generated selections', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-asset-2',
      uuid: 'film-asset-uuid-2',
      path: 'https://storage.example.com/generated-film.png',
      metadata: {
        assetUuid: 'film-asset-uuid-2',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      resolveFilmGeneratedSelectionAsset(
        {
          url: 'https://tmp.example.com/legacy-generated-film.png',
          resource: {
            url: 'https://cdn.example.com/generated-film.png',
          },
        },
        'film_character_portrait.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'film-asset-2',
      uuid: 'film-asset-uuid-2',
      assetUuid: 'film-asset-uuid-2',
      resource: {
        id: null,
        uuid: 'film-asset-uuid-2',
        assetId: 'film-asset-2',
        assetUuid: 'film-asset-uuid-2',
        type: 'image',
        url: 'https://storage.example.com/generated-film.png',
      },
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://cdn.example.com/generated-film.png',
      'image',
      {
        name: 'film_character_portrait.png',
        domain: 'film',
      }
    );
  });

  it('accepts generated selections that only expose nested canonical resource delivery', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-asset-3',
      uuid: 'film-asset-uuid-3',
      path: 'https://storage.example.com/generated-film-3.png',
      metadata: {
        assetUuid: 'film-asset-uuid-3',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      resolveFilmGeneratedSelectionAsset(
        {
          resource: {
            url: 'https://cdn.example.com/generated-film-3.png',
          },
        },
        'film_character_portrait.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'film-asset-3',
      uuid: 'film-asset-uuid-3',
      assetUuid: 'film-asset-uuid-3',
      resource: {
        id: null,
        uuid: 'film-asset-uuid-3',
        assetId: 'film-asset-3',
        assetUuid: 'film-asset-uuid-3',
        type: 'image',
        url: 'https://storage.example.com/generated-film-3.png',
      },
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://cdn.example.com/generated-film-3.png',
      'image',
      {
        name: 'film_character_portrait.png',
        domain: 'film',
      }
    );
  });
});

describe('importFilmAssetFromUrl', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-film-1',
      projectId: 'film-project-1',
    });
  });

  it('preserves uploaded client uuid without inventing assetUuid when upload response does not expose one', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-asset-raw-3',
      uuid: 'resource-view-uuid-3',
      path: 'https://storage.example.com/generated-film-3.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      importFilmAssetFromUrl(
        'https://tmp.example.com/generated-film-3.png',
        'film_character_portrait.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'film-asset-raw-3',
      uuid: 'resource-view-uuid-3',
      resource: {
        id: null,
        uuid: 'resource-view-uuid-3',
        assetId: 'film-asset-raw-3',
        type: 'image',
        url: 'https://storage.example.com/generated-film-3.png',
      },
    });
  });

  it('binds a project-level persisted reference after url imports land on an existing film asset', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-asset-ref-1',
      uuid: 'resource-view-uuid-ref-1',
      name: 'film_character_portrait.png',
      type: 'image',
      path: 'https://storage.example.com/generated-film-ref.png',
      metadata: {},
      size: 2048,
      createdAt: '2026-04-07T09:00:00.000Z',
      updatedAt: '2026-04-07T09:00:00.000Z',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-film-ref.png');
    assetCenterFindById.mockResolvedValue({
      assetId: 'film-asset-ref-1',
      references: [],
    });

    await importFilmAssetFromUrl(
      'https://tmp.example.com/generated-film-ref.png',
      'film_character_portrait.png',
      'image',
      {
        origin: 'ai',
        source: 'film-character-modal-ai',
        slot: 'portrait',
      }
    );

    expect(assetCenterInitialize).toHaveBeenCalledTimes(1);
    expect(assetCenterRegisterExistingAsset).not.toHaveBeenCalled();
    expect(assetCenterBindReference).toHaveBeenCalledWith('film-asset-ref-1', {
      domain: 'film',
      entityType: 'project',
      entityId: 'film-project-1',
      relation: 'reference',
      slot: 'media-resource',
      metadata: {
        origin: 'ai',
        source: 'film-character-modal-ai',
        slot: 'portrait',
      },
    });
  });
});

describe('resolveFilmGeneratedOutcomeAsset', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    resolveAssetUrlByAssetIdFirst.mockReset();
    tryExtractInlineData.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-film-1',
      projectId: 'film-project-1',
    });
  });

  it('derives a stable client uuid when a generation outcome only exposes persisted asset id', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/outcome-film.png');

    const result = await resolveFilmGeneratedOutcomeAsset(
      {
        delivery: {
          assetId: 'asset-outcome-1',
          url: 'https://tmp.example.com/generated-film.png',
        },
      } as any,
      'film_outcome.png',
      'image',
      {
        origin: 'ai',
      }
    );

    expect(result).toMatchObject({
      id: null,
      assetId: 'asset-outcome-1',
      uuid: 'client-asset:asset-outcome-1',
      resource: {
        id: null,
        uuid: 'client-asset:asset-outcome-1',
        assetId: 'asset-outcome-1',
        type: 'image',
        url: 'https://cdn.example.com/outcome-film.png',
      },
    });
    expect(result.assetUuid).toBeUndefined();

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('imports the generation delivery url into film when no canonical asset id exists yet', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'film-outcome-asset-1',
      uuid: 'film-outcome-asset-uuid-1',
      path: 'https://storage.example.com/generated-film-outcome.png',
      metadata: {
        assetUuid: 'film-outcome-asset-uuid-1',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      resolveFilmGeneratedOutcomeAsset(
        {
          delivery: {
            url: 'https://tmp.example.com/generated-film-outcome.png',
          },
          primaryArtifact: {
            resource: {
              url: 'https://tmp.example.com/generated-film-outcome.png',
            },
          },
        } as any,
        'film_outcome.png',
        'image',
        {
          origin: 'ai',
        }
      )
    ).resolves.toEqual({
      id: null,
      assetId: 'film-outcome-asset-1',
      uuid: 'film-outcome-asset-uuid-1',
      assetUuid: 'film-outcome-asset-uuid-1',
      resource: {
        id: null,
        uuid: 'film-outcome-asset-uuid-1',
        assetId: 'film-outcome-asset-1',
        assetUuid: 'film-outcome-asset-uuid-1',
        type: 'image',
        url: 'https://storage.example.com/generated-film-outcome.png',
      },
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://tmp.example.com/generated-film-outcome.png',
      'image',
      {
        name: 'film_outcome.png',
        domain: 'film',
      }
    );
  });
});

describe('importFilmAssetFromFile', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-film-1',
      projectId: 'film-project-1',
    });
  });

  it('keeps uploaded client uuid separate from assetUuid for local file imports when no canonical asset uuid exists', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'film-upload-asset-4',
      uuid: 'resource-view-uuid-4',
      path: 'https://storage.example.com/generated-film-4.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    const file = new File([new Uint8Array([1, 2, 3])], 'film-frame.png', {
      type: 'image/png',
    });

    await expect(
      importFilmAssetFromFile(file, 'image', {
        origin: 'upload',
      })
    ).resolves.toEqual({
      id: null,
      assetId: 'film-upload-asset-4',
      uuid: 'resource-view-uuid-4',
      resource: {
        id: null,
        uuid: 'resource-view-uuid-4',
        assetId: 'film-upload-asset-4',
        type: 'image',
        url: 'https://storage.example.com/generated-film-4.png',
      },
    });
  });

  it('registers a project-level persisted reference when local file imports are not yet indexed in asset center', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'film-upload-asset-ref-2',
      uuid: 'resource-view-uuid-ref-2',
      name: 'film-frame.png',
      type: 'image',
      path: 'https://storage.example.com/generated-film-file-ref.png',
      metadata: {},
      size: 3,
      createdAt: '2026-04-07T09:05:00.000Z',
      updatedAt: '2026-04-07T09:05:00.000Z',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-film-file-ref.png');
    assetCenterFindById.mockResolvedValue(null);

    const file = new File([new Uint8Array([1, 2, 3])], 'film-frame.png', {
      type: 'image/png',
    });

    await importFilmAssetFromFile(file, 'image', {
      origin: 'upload',
      source: 'film-home-upload',
    });

    expect(assetCenterInitialize).toHaveBeenCalledTimes(1);
    expect(assetCenterRegisterExistingAsset).toHaveBeenCalledWith({
      scope: {
        workspaceId: 'workspace-film-1',
        projectId: 'film-project-1',
        domain: 'film',
      },
      type: 'image',
      name: 'film-frame.png',
      assetId: 'film-upload-asset-ref-2',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/generated-film-file-ref.png',
        url: 'https://cdn.example.com/generated-film-file-ref.png',
      },
      metadata: {
        origin: 'upload',
        source: 'film-home-upload',
      },
      references: [
        {
          domain: 'film',
          entityType: 'project',
          entityId: 'film-project-1',
          relation: 'reference',
          slot: 'media-resource',
          metadata: {
            origin: 'upload',
            source: 'film-home-upload',
          },
        },
      ],
      status: 'imported',
      size: 3,
      createdAt: '2026-04-07T09:05:00.000Z',
      updatedAt: '2026-04-07T09:05:00.000Z',
    });
    expect(assetCenterBindReference).not.toHaveBeenCalled();
  });
});

describe('resolveChosenAsset', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    resolveAssetUrlByAssetIdFirst.mockReset();
    tryExtractInlineData.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-film-1',
      projectId: 'film-project-1',
    });
  });

  it('preserves client uuid separately and does not invent assetUuid from a resource uuid', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValue('https://cdn.example.com/chosen-film.png');

    await expect(
      resolveChosenAsset({
        id: 'asset-db-9',
        uuid: 'resource-view-uuid-9',
        name: 'Chosen Film Asset',
        type: 'image',
        path: 'https://storage.example.com/chosen-film.png',
        metadata: {
          assetId: 'asset-db-9',
          resourceViewUuid: 'resource-view-uuid-9',
        },
      } as any)
    ).resolves.toMatchObject({
      id: null,
      assetId: 'asset-db-9',
      uuid: 'resource-view-uuid-9',
      resource: {
        id: null,
        uuid: 'resource-view-uuid-9',
        assetId: 'asset-db-9',
        type: 'image',
        url: 'https://cdn.example.com/chosen-film.png',
      },
    });
  });
});
