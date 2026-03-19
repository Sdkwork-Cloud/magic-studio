import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';

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
