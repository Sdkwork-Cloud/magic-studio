import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-commons';
import { resolveEntityKey } from '@sdkwork/magic-studio-types';

import {
  applyFavoriteStateFromCatalog,
  beginFavoriteMutation,
  buildFavoriteRegistrationInput,
  clearFavoriteOverride,
  isCurrentFavoriteMutation,
  resolveNextFavoriteState,
  syncFavoriteInAssetCollection,
} from '../src/domain/assets/favoriteToggle';

describe('resolveNextFavoriteState', () => {
  it('toggles a missing or false favorite state to true', () => {
    expect(resolveNextFavoriteState(undefined)).toBe(true);
    expect(resolveNextFavoriteState(false)).toBe(true);
  });

  it('toggles a true favorite state back to false', () => {
    expect(resolveNextFavoriteState(true)).toBe(false);
  });

  it('builds a local asset-center registration payload for remote catalog resources', () => {
    expect(
      buildFavoriteRegistrationInput(
        {
          id: 'effect-1',
          uuid: 'effect-1',
          name: 'Cinematic Glow',
          type: MediaResourceType.EFFECT,
          path: 'https://cdn.example.com/effects/glow.effect',
          url: 'https://cdn.example.com/effects/glow.effect',
          size: 2048,
          origin: 'stock',
          metadata: {
            family: 'stylize',
          },
          createdAt: '2026-03-19T00:00:00.000Z',
          updatedAt: '2026-03-19T00:00:00.000Z',
        } as any,
        {
          workspaceId: 'workspace-1',
          projectId: 'project-1',
          domain: 'magiccut',
        }
      )
    ).toMatchObject({
      assetId: 'effect-1',
      type: 'effect',
      name: 'Cinematic Glow',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/effects/glow.effect',
        url: 'https://cdn.example.com/effects/glow.effect',
      },
      metadata: {
        family: 'stylize',
        origin: 'stock',
      },
      status: 'ready',
      size: 2048,
      scope: {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'magiccut',
      },
    });
  });

  it('syncs persisted favorite state back into the current asset collection', () => {
    const unchanged = {
      id: 'video-1',
      isFavorite: false,
      name: 'Hero Clip',
    };
    const target = {
      id: 'video-2',
      isFavorite: false,
      name: 'B-roll Clip',
    };

    expect(
      syncFavoriteInAssetCollection([unchanged, target], 'video-2', true)
    ).toEqual([
      unchanged,
      {
        id: 'video-2',
        isFavorite: true,
        name: 'B-roll Clip',
      },
    ]);
  });

  it('syncs favorite state by uuid when a runtime asset has no persisted id yet', () => {
    const runtimeAsset = {
      id: null,
      uuid: 'video-runtime-uuid',
      isFavorite: false,
      name: 'Runtime Clip',
    };

    expect(
      syncFavoriteInAssetCollection(
        [runtimeAsset],
        resolveEntityKey(runtimeAsset as any),
        true
      )
    ).toEqual([
      {
        id: null,
        uuid: 'video-runtime-uuid',
        isFavorite: true,
        name: 'Runtime Clip',
      },
    ]);
  });

  it('overlays locally persisted favorite state onto remote catalog assets by id', () => {
    expect(
      applyFavoriteStateFromCatalog(
        [
          {
            id: 'effect-1',
            isFavorite: false,
            name: 'Glow',
          },
          {
            id: 'effect-2',
            isFavorite: false,
            name: 'Film Burn',
          },
        ],
        [
          {
            id: 'effect-2',
            isFavorite: true,
          },
        ]
      )
    ).toEqual([
      {
        id: 'effect-1',
        isFavorite: false,
        name: 'Glow',
      },
      {
        id: 'effect-2',
        isFavorite: true,
        name: 'Film Burn',
      },
    ]);
  });

  it('overlays persisted favorite state by uuid when catalog items do not have a local id yet', () => {
    expect(
      applyFavoriteStateFromCatalog(
        [
          {
            id: null,
            uuid: 'effect-runtime-uuid-1',
            isFavorite: false,
            name: 'Glow',
          },
        ],
        [
          {
            id: 'effect-db-1',
            uuid: 'effect-runtime-uuid-1',
            isFavorite: true,
          },
        ]
      )
    ).toEqual([
      {
        id: null,
        uuid: 'effect-runtime-uuid-1',
        isFavorite: true,
        name: 'Glow',
      },
    ]);
  });

  it('preserves runtime uuid metadata when registering a favorite for an unpersisted asset', () => {
    const registration = buildFavoriteRegistrationInput(
      {
        id: null,
        uuid: 'effect-runtime-uuid-1',
        name: 'Runtime Glow',
        type: MediaResourceType.EFFECT,
        path: 'assets://workspace-1/magiccut/runtime-glow.effect',
        url: 'assets://workspace-1/magiccut/runtime-glow.effect',
        size: 256,
        origin: 'upload',
        metadata: {
          category: 'stylize',
        },
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      } as any,
      {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'magiccut',
      }
    );

    expect(registration.assetId).toBeUndefined();
    expect(registration.metadata).toMatchObject({
      category: 'stylize',
      origin: 'upload',
      assetUuid: 'effect-runtime-uuid-1',
      resourceViewUuid: 'effect-runtime-uuid-1',
    });
  });

  it('prefers canonical asset paths over delivery urls when building favorite registration locators', () => {
    const registration = buildFavoriteRegistrationInput(
      {
        id: 'video-asset-1',
        uuid: 'video-asset-uuid-1',
        name: 'Hero Clip',
        type: MediaResourceType.VIDEO,
        path: 'assets://workspace-1/project-1/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
        size: 1024,
        origin: 'upload',
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      } as any,
      {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'magiccut',
      }
    );

    expect(registration.locator).toMatchObject({
      protocol: 'assets',
      uri: 'assets://workspace-1/project-1/hero.mp4',
      path: 'assets://workspace-1/project-1/hero.mp4',
      url: 'https://cdn.example.com/hero.mp4',
    });
  });

  it('clears optimistic overrides once canonical state has been updated', () => {
    expect(
      clearFavoriteOverride(
        {
          'video-1': true,
          'video-2': false,
        },
        'video-1'
      )
    ).toEqual({
      'video-2': false,
    });
  });

  it('treats only the latest favorite mutation for an asset as current', () => {
    const first = beginFavoriteMutation({}, 'video-1');
    const second = beginFavoriteMutation(first.activeMutations, 'video-1');

    expect(first.requestId).toBe(1);
    expect(second.requestId).toBe(2);
    expect(isCurrentFavoriteMutation(second.activeMutations, 'video-1', first.requestId)).toBe(false);
    expect(isCurrentFavoriteMutation(second.activeMutations, 'video-1', second.requestId)).toBe(true);
  });
});
