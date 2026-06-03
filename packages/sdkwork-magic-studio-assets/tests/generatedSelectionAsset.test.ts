import { describe, expect, it } from 'vitest';

import { toAssetFromGeneratedSelection } from '../src/components/generate/generatedSelectionAsset';

describe('toAssetFromGeneratedSelection', () => {
  it('uses canonical asset identity when a generated selection already belongs to the asset center', () => {
    expect(
      toAssetFromGeneratedSelection({
        key: 'selection-1',
        type: 'image',
        taskKey: 'task-uuid-1',
        taskId: 'task-1',
        taskUuid: 'task-uuid-1',
        resultIndex: 0,
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-db-1',
        primaryResourceUuid: 'resource-uuid-1',
        resourceViewId: 'resource-view-1',
        resourceViewUuid: 'resource-view-uuid-1',
        url: 'https://tmp.example.com/generated-image.png',
        resource: {
          uuid: 'resource-uuid-1',
          url: 'https://cdn.example.com/generated-image.png',
        },
        createdAt: 1,
      })
    ).toMatchObject({
      id: 'asset-1',
      uuid: 'asset-uuid-1',
      name: 'AI Generated Image',
      type: 'image',
      path: 'https://cdn.example.com/generated-image.png',
      origin: 'ai',
      metadata: {
        sourceTaskKey: 'task-uuid-1',
        sourceTaskId: 'task-1',
        sourceTaskUuid: 'task-uuid-1',
        selectionKey: 'selection-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceUuid: 'resource-uuid-1',
        resourceViewUuid: 'resource-view-uuid-1',
      },
    });
  });

  it('keeps resource identities explicit in metadata and uses the selection key as transient asset id when no asset id exists yet', () => {
    expect(
      toAssetFromGeneratedSelection({
        key: 'selection-2',
        type: 'image',
        taskKey: 'task-uuid-2',
        taskId: 'task-2',
        taskUuid: 'task-uuid-2',
        resultIndex: 0,
        uuid: 'artifact-uuid-2',
        primaryResourceId: 'resource-db-2',
        primaryResourceUuid: 'resource-uuid-2',
        resourceViewId: 'resource-view-2',
        resourceViewUuid: 'resource-view-uuid-2',
        url: 'https://tmp.example.com/generated-image.png',
        resource: {
          uuid: 'resource-uuid-2',
          url: 'https://cdn.example.com/generated-image.png',
        },
        createdAt: 1,
      })
    ).toMatchObject({
      id: 'selection-2',
      uuid: 'resource-view-uuid-2',
      path: 'https://cdn.example.com/generated-image.png',
      metadata: {
        primaryResourceId: 'resource-db-2',
        primaryResourceUuid: 'resource-uuid-2',
        resourceViewId: 'resource-view-2',
        resourceViewUuid: 'resource-view-uuid-2',
      },
    });
  });

  it('extracts canonical identity from nested resource metadata when top-level ids are absent', () => {
    expect(
      toAssetFromGeneratedSelection({
        key: 'selection-nested-3',
        type: 'image',
        taskKey: 'task-uuid-3',
        taskId: 'task-3',
        taskUuid: 'task-uuid-3',
        resultIndex: 0,
        uuid: 'artifact-uuid-3',
        url: 'https://tmp.example.com/legacy-generated-image.png',
        resource: {
          url: 'https://cdn.example.com/generated-image-resource.png',
          metadata: {
            assetId: 'asset-nested-3',
            assetUuid: 'asset-uuid-nested-3',
            primaryResourceId: 'resource-db-nested-3',
            primaryResourceUuid: 'resource-uuid-nested-3',
            resourceViewId: 'resource-view-nested-3',
            resourceViewUuid: 'resource-view-uuid-nested-3',
          },
        },
        createdAt: 1,
      } as any)
    ).toMatchObject({
      id: 'asset-nested-3',
      uuid: 'asset-uuid-nested-3',
      path: 'https://cdn.example.com/generated-image-resource.png',
      metadata: {
        assetId: 'asset-nested-3',
        assetUuid: 'asset-uuid-nested-3',
        primaryResourceId: 'resource-db-nested-3',
        primaryResourceUuid: 'resource-uuid-nested-3',
        resourceViewId: 'resource-view-nested-3',
        resourceViewUuid: 'resource-view-uuid-nested-3',
      },
    });
  });

  it('preserves canonical resource paths while keeping delivery urls renderable', () => {
    expect(
      toAssetFromGeneratedSelection({
        key: 'selection-path-4',
        type: 'image',
        taskKey: 'task-uuid-4',
        taskId: 'task-4',
        taskUuid: 'task-uuid-4',
        resultIndex: 0,
        assetId: 'asset-path-4',
        assetUuid: 'asset-uuid-path-4',
        resourceViewUuid: 'resource-view-uuid-path-4',
        url: 'https://tmp.example.com/legacy-generated-image.png',
        resource: {
          assetId: 'asset-path-4',
          path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/image-4.png',
          url: 'https://cdn.example.com/generated-image-4.png',
        },
        createdAt: 1,
      })
    ).toMatchObject({
      id: 'asset-path-4',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/image-4.png',
      metadata: {
        assetId: 'asset-path-4',
        assetUuid: 'asset-uuid-path-4',
      },
    });
  });
});
