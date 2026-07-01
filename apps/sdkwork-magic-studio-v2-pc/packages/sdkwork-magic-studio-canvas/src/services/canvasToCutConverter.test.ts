import { describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-magiccut', () => ({
  TIMELINE_CONSTANTS: {
    TRACK_HEIGHT_VIDEO: 72,
    TRACK_HEIGHT_AUDIO: 56,
  },
}));

import { CanvasToCutConverter } from './canvasToCutConverter';
import type { CanvasBoard } from '../entities';

describe('CanvasToCutConverter', () => {
  it('projects canvas boards into a canonical project graph with asset provenance', () => {
    const converter = new CanvasToCutConverter();

    const board: CanvasBoard = {
      id: 'board-1',
      uuid: 'client-entity:board-1',
      type: 'CANVAS_BOARD',
      title: 'Storyboard Board',
      elements: [
        {
          id: 'element-1',
          uuid: 'client-entity:element-1',
          type: 'image',
          x: 120,
          y: 80,
          width: 512,
          height: 288,
          resource: {
            id: 'resource-view-1',
            uuid: 'client-entity:resource-view-1',
            type: 'image',
            name: 'hero.png',
            url: 'https://cdn.example.com/hero.png',
            path: 'assets://workspace-1/canvas/hero.png',
            metadata: {
              assetId: 'asset-hero-1',
              primaryResourceId: 'primary-resource-1',
              primaryType: 'image',
              storageMode: 'hybrid',
              scopeDomain: 'canvas',
              sourceRecipeUuid: 'recipe-1',
              sourceExecutionUuid: 'execution-1',
              sourceArtifactUuid: 'artifact-1',
            },
          },
          data: {
            prompt: 'Hero close-up at golden hour',
          },
        },
      ],
      createdAt: 0,
      updatedAt: 0,
    };

    const project = converter.convert(board);
    const graph = (project as typeof project & { projectGraph?: any }).projectGraph;
    const normalizedTracks = Object.values(
      (project as typeof project & { normalizedState: { tracks: Record<string, any> } }).normalizedState
        .tracks
    ) as Array<Record<string, any>>;
    const normalizedClips = Object.values(
      (project as typeof project & { normalizedState: { clips: Record<string, any> } }).normalizedState
        .clips
    ) as Array<Record<string, any>>;

    expect(graph).toBeTruthy();
    expect(graph.project.uuid).toBe(project.uuid);
    expect(project.id).toBeNull();

    const sequences = Object.values(graph.sequences) as Array<Record<string, any>>;
    const scenes = Object.values(graph.scenes) as Array<Record<string, any>>;
    const shots = Object.values(graph.shots) as Array<Record<string, any>>;
    const clips = Object.values(graph.clips) as Array<Record<string, any>>;

    expect(sequences).toHaveLength(1);
    expect(scenes).toHaveLength(1);
    expect(shots).toHaveLength(1);
    expect(clips).toHaveLength(1);

    expect(shots[0]).toMatchObject({
      sequenceUuid: sequences[0].uuid,
      sceneUuid: scenes[0].uuid,
      prompt: 'Hero close-up at golden hour',
    });

    expect(clips[0]).toMatchObject({
      sequenceUuid: sequences[0].uuid,
      sceneUuid: scenes[0].uuid,
      shotUuid: shots[0].uuid,
      source: {
        assetId: 'asset-hero-1',
        primaryResourceId: 'primary-resource-1',
        resourceViewId: 'resource-view-1',
        primaryType: 'image',
        storageMode: 'hybrid',
        scopeDomain: 'canvas',
        sourceRecipeUuid: 'recipe-1',
        sourceExecutionUuid: 'execution-1',
        sourceArtifactUuid: 'artifact-1',
      },
    });

    expect(graph.surfaceBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: 'canvas-board',
          surfaceEntityUuid: 'client-entity:board-1',
          graphEntityType: 'sequence',
          graphEntityUuid: sequences[0].uuid,
        }),
        expect.objectContaining({
          surface: 'canvas-element',
          surfaceEntityUuid: 'client-entity:element-1',
          graphEntityType: 'shot',
          graphEntityUuid: shots[0].uuid,
        }),
        expect.objectContaining({
          surface: 'magiccut-clip',
          surfaceEntityUuid: clips[0].uuid,
          graphEntityType: 'clip',
          graphEntityUuid: clips[0].uuid,
        }),
      ])
    );

    expect(normalizedTracks[0]?.id).toBeNull();
    expect(normalizedTracks[0]?.uuid).toBeTruthy();
    expect(normalizedClips[0]?.id).toBeNull();
    expect(normalizedClips[0]?.uuid).toBeTruthy();
  });

  it('normalizes path-only canvas resources into canonical cut resources without losing the locator', () => {
    const converter = new CanvasToCutConverter();

    const board: CanvasBoard = {
      id: 'board-2',
      uuid: 'client-entity:board-2',
      type: 'CANVAS_BOARD',
      title: 'Path Only Board',
      elements: [
        {
          id: 'element-2',
          uuid: 'client-entity:element-2',
          type: 'image',
          x: 0,
          y: 0,
          width: 320,
          height: 180,
          resource: {
            id: null,
            uuid: 'client-entity:resource-view-2',
            type: 'image',
            name: 'path-only-image',
            url: '',
            path: 'assets://workspace/path-only-image.png',
          },
        },
      ],
      createdAt: 0,
      updatedAt: 0,
    };

    const project = converter.convert(board);
    const normalizedResources = Object.values(
      (project as typeof project & { normalizedState: { resources: Record<string, any> } }).normalizedState
        .resources
    ) as Array<Record<string, any>>;

    expect(normalizedResources).toHaveLength(1);
    expect(normalizedResources[0]).toMatchObject({
      path: 'assets://workspace/path-only-image.png',
      url: 'assets://workspace/path-only-image.png',
    });
  });
});
