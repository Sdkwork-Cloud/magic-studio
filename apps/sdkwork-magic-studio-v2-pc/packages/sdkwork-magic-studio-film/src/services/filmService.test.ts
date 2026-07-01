import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { filmProjectService } from './filmProjectService';

const mocks = vi.hoisted(() => ({
  generateImage: vi.fn(),
  generateVideo: vi.fn(),
  buildUnifiedVideoGenerationRequest: vi.fn(),
  createVideoInputResourceRef: vi.fn(),
  analyzeScript: vi.fn(),
  extractCharacters: vi.fn(),
  extractProps: vi.fn(),
  getAppSdkClientWithSession: vi.fn(() => ({
    filmAnalysis: {
      analyzeScript: mocks.analyzeScript,
      extractCharacters: mocks.extractCharacters,
      extractProps: mocks.extractProps,
    },
  })),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  getAppSdkClientWithSession: mocks.getAppSdkClientWithSession,
}));

vi.mock('@sdkwork/magic-studio-image/services', () => ({
  imageService: {
    generateImage: mocks.generateImage,
  },
}));

vi.mock('@sdkwork/magic-studio-video/services', () => ({
  videoService: {
    generateVideo: mocks.generateVideo,
  },
  buildUnifiedVideoGenerationRequest: mocks.buildUnifiedVideoGenerationRequest,
}));

vi.mock('@sdkwork/magic-studio-video/entities', () => ({
  createVideoInputResourceRef: mocks.createVideoInputResourceRef,
}));

vi.mock('./filmProjectService', () => ({
  filmProjectService: {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    deleteById: vi.fn(),
  },
}));

import { buildFilmProjectGraph, filmService, normalizeFilmProject } from './filmService';

afterEach(() => {
  vi.restoreAllMocks();
  mocks.generateImage.mockReset();
  mocks.generateVideo.mockReset();
  mocks.buildUnifiedVideoGenerationRequest.mockReset();
  mocks.createVideoInputResourceRef.mockReset();
  mocks.analyzeScript.mockReset();
  mocks.extractCharacters.mockReset();
  mocks.extractProps.mockReset();
  mocks.getAppSdkClientWithSession.mockClear();
});

describe('filmService', () => {
  it('builds a canonical film project graph with scene, shot and asset provenance bindings', () => {
    const baseProject = filmService.createProject('Hero Journey', 'A cinematic test project');
    const sceneUuid = 'scene-1-uuid';
    const shotUuid = 'shot-1-uuid';

    const project = normalizeFilmProject({
      ...baseProject,
      scenes: [
        {
          id: 'scene-1-id',
          uuid: sceneUuid,
          type: 'FILM_SCENE',
          sceneNumber: 1,
          index: 0,
          summary: 'Hero enters the station.',
          locationUuid: 'location-1',
          characterUuids: ['character-1'],
          moodTags: ['tense'],
          visualPrompt: 'cinematic station arrival',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      shots: [
        {
          id: 'shot-1-id',
          uuid: shotUuid,
          type: 'FILM_SHOT',
          shotNumber: 1,
          index: 0,
          sceneUuid,
          locationUuid: 'location-1',
          description: 'Wide establishing shot of the station.',
          dialogue: {
            items: [],
          },
          duration: 4,
          generation: {
            status: 'SUCCESS',
            prompt: 'Hero walking into a neon station, cinematic lighting',
            product: 'video',
            modelId: 'kling-v2',
            assets: [
              {
                id: 'resource-view-1',
                uuid: 'resource-view-1',
                type: 'video',
                assetId: 'asset-1',
                fileId: 'primary-resource-1',
                scene: 'REFERENCE',
                url: 'https://cdn.example.com/shot-1.mp4',
                createdAt: 1,
                updatedAt: 1,
              },
            ],
          },
          assets: [
            {
              id: 'resource-view-1',
              uuid: 'resource-view-1',
              type: 'video',
              assetId: 'asset-1',
              fileId: 'primary-resource-1',
              scene: 'REFERENCE',
              url: 'https://cdn.example.com/shot-1.mp4',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
          characterIds: ['character-1'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    const graph = buildFilmProjectGraph(project);
    const graphScene = graph.scenes[sceneUuid];
    const graphShot = graph.shots[shotUuid];

    expect(graph.project).toMatchObject({
      uuid: project.uuid,
      domain: 'film',
      name: 'Hero Journey',
      description: 'A cinematic test project',
    });
    expect(graph.sequences[graph.project.sequenceUuids[0]]).toMatchObject({
      projectUuid: project.uuid,
      sceneUuids: [sceneUuid],
      shotUuids: [shotUuid],
    });
    expect(graphScene).toMatchObject({
      uuid: sceneUuid,
      summary: 'Hero enters the station.',
      shotUuids: [shotUuid],
      metadata: expect.objectContaining({
        locationUuid: 'location-1',
      }),
    });
    expect(graphShot).toMatchObject({
      uuid: shotUuid,
      sceneUuid,
      title: 'Shot 1',
      prompt: 'Hero walking into a neon station, cinematic lighting',
      product: 'video',
      source: {
        assetId: 'asset-1',
        primaryResourceId: 'primary-resource-1',
        resourceViewId: 'resource-view-1',
        primaryType: 'video',
        scopeDomain: 'film',
      },
      metadata: expect.objectContaining({
        modelId: 'kling-v2',
        duration: 4,
      }),
    });
    expect(graph.surfaceBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: 'film-project',
          surfaceEntityUuid: project.uuid,
          graphEntityType: 'project',
          graphEntityUuid: project.uuid,
        }),
        expect.objectContaining({
          surface: 'film-scene',
          surfaceEntityUuid: sceneUuid,
          graphEntityType: 'scene',
          graphEntityUuid: sceneUuid,
        }),
        expect.objectContaining({
          surface: 'film-shot',
          surfaceEntityUuid: shotUuid,
          graphEntityType: 'shot',
          graphEntityUuid: shotUuid,
        }),
      ])
    );
  });

  it('does not fabricate primary resource ids from resource view ids when film assets only carry delivery views', () => {
    const baseProject = filmService.createProject('View Only Film');
    const sceneUuid = 'scene-view-only-uuid';
    const shotUuid = 'shot-view-only-uuid';

    const project = normalizeFilmProject({
      ...baseProject,
      scenes: [
        {
          id: 'scene-view-only-id',
          uuid: sceneUuid,
          type: 'FILM_SCENE',
          sceneNumber: 1,
          index: 0,
          summary: 'View only scene.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      shots: [
        {
          id: 'shot-view-only-id',
          uuid: shotUuid,
          type: 'FILM_SHOT',
          shotNumber: 1,
          index: 0,
          sceneUuid,
          description: 'Shot bound to a view-only film asset.',
          dialogue: {
            items: [],
          },
          duration: 4,
          generation: {
            status: 'SUCCESS',
            prompt: 'View only film prompt',
            assets: [
              {
                id: 'resource-view-only-1',
                uuid: 'resource-view-only-uuid-1',
                type: 'image',
                assetId: 'asset-view-only-1',
                fileId: undefined,
                scene: 'REFERENCE',
                url: 'https://cdn.example.com/view-only.png',
                createdAt: 1,
                updatedAt: 1,
              },
            ],
          },
          assets: [
            {
              id: 'resource-view-only-1',
              uuid: 'resource-view-only-uuid-1',
              type: 'image',
              assetId: 'asset-view-only-1',
              fileId: undefined,
              scene: 'REFERENCE',
              url: 'https://cdn.example.com/view-only.png',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    const graph = buildFilmProjectGraph(project);

    expect(graph.shots[shotUuid]).toMatchObject({
      source: {
        assetId: 'asset-view-only-1',
        primaryResourceId: null,
        resourceViewId: 'resource-view-only-1',
        primaryType: 'image',
        scopeDomain: 'film',
      },
    });
  });

  it('does not backfill film graph assetIds from resource-view ids when asset ids are unknown', () => {
    const baseProject = filmService.createProject('Graph Asset Identity');
    const sceneUuid = 'scene-asset-meta-uuid';
    const shotUuid = 'shot-asset-meta-uuid';

    const project = normalizeFilmProject({
      ...baseProject,
      scenes: [
        {
          id: 'scene-asset-meta-id',
          uuid: sceneUuid,
          type: 'FILM_SCENE',
          sceneNumber: 1,
          index: 0,
          summary: 'Graph asset identity scene.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      shots: [
        {
          id: 'shot-asset-meta-id',
          uuid: shotUuid,
          type: 'FILM_SHOT',
          shotNumber: 1,
          index: 0,
          sceneUuid,
          description: 'Shot with view-only identity.',
          dialogue: {
            items: [],
          },
          duration: 4,
          assets: [
            {
              id: 'resource-view-only-2',
              uuid: 'resource-view-only-uuid-2',
              type: 'image',
              assetId: undefined,
              fileId: 'primary-resource-2',
              scene: 'REFERENCE',
              url: 'https://cdn.example.com/view-only-2.png',
              createdAt: 1,
              updatedAt: 1,
            },
          ],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    const graph = buildFilmProjectGraph(project);

    expect(graph.shots[shotUuid]?.source).toMatchObject({
      assetId: null,
      primaryResourceId: 'primary-resource-2',
      resourceViewId: 'resource-view-only-2',
    });
    expect(graph.shots[shotUuid]?.metadata).toMatchObject({
      assetIds: [],
    });
  });

  it('normalizes film projects before persistence so projectGraph stays fresh', async () => {
    const project = normalizeFilmProject({
      ...filmService.createProject('Save Test'),
      scenes: [
        {
          id: 'scene-save-id',
          uuid: 'scene-save-uuid',
          type: 'FILM_SCENE',
          sceneNumber: 1,
          summary: 'Persistence check scene.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      shots: [
        {
          id: 'shot-save-id',
          uuid: 'shot-save-uuid',
          type: 'FILM_SHOT',
          shotNumber: 1,
          sceneUuid: 'scene-save-uuid',
          description: 'Persistence check shot.',
          dialogue: {
            items: [],
          },
          duration: 3,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      projectGraph: undefined,
    });

    await filmService.saveProject({
      ...project,
      projectGraph: undefined,
    });

    expect(vi.mocked(filmProjectService.save)).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: project.uuid,
        projectGraph: expect.objectContaining({
          project: expect.objectContaining({
            uuid: project.uuid,
            domain: 'film',
          }),
          shots: expect.objectContaining({
            'shot-save-uuid': expect.objectContaining({
              sceneUuid: 'scene-save-uuid',
            }),
          }),
        }),
      })
    );
  });

  it('routes film script analysis through client.filmAnalysis.analyzeScript', async () => {
    mocks.analyzeScript.mockResolvedValue({
      code: '2000',
      data: {
        characters: [
          {
            name: 'Lin',
            characterType: 'HUMAN',
            description: 'A determined detective',
            age: '30s',
            gender: 'FEMALE',
          },
        ],
        locations: [
          {
            name: 'Shanghai alley',
            indoor: false,
            timeOfDay: 'NIGHT',
            visualDescription: 'Wet neon reflections',
          },
        ],
        props: [
          {
            name: 'Silver lighter',
            description: 'An engraved lighter',
          },
        ],
        scenes: [
          {
            index: 1,
            locationName: 'Shanghai alley',
            summary: 'Lin confronts the informant.',
            moodTags: ['tense', 'neon'],
            characterNames: ['Lin'],
            visualPrompt: 'Rain-soaked alley with teal and amber practical lights',
          },
        ],
      },
    });

    const result = await filmService.analyzeScript('INT. SHANGHAI ALLEY - NIGHT');

    expect(mocks.getAppSdkClientWithSession).toHaveBeenCalledTimes(1);
    expect(mocks.analyzeScript).toHaveBeenCalledWith({
      content: 'INT. SHANGHAI ALLEY - NIGHT',
      language: 'zh-CN',
    });
    expect(result.characters[0]).toMatchObject({
      name: 'Lin',
      characterType: 'HUMAN',
      description: 'A determined detective',
    });
    expect(result.locations[0]).toMatchObject({
      name: 'Shanghai alley',
      indoor: false,
      timeOfDay: 'NIGHT',
    });
    expect(result.props[0]).toMatchObject({
      name: 'Silver lighter',
    });
    expect(result.scenes[0]).toMatchObject({
      index: 1,
      summary: 'Lin confronts the informant.',
      moodTags: ['tense', 'neon'],
    });
    expect(result.shots).toEqual([]);
  });

  it('routes character extraction through client.filmAnalysis.extractCharacters', async () => {
    mocks.extractCharacters.mockResolvedValue({
      code: '2000',
      data: {
        characters: [
          {
            name: 'Mika',
            role: 'PROTAGONIST',
            gender: 'FEMALE',
            age: '20s',
            description: 'Short silver hair and sharp gaze',
            traits: ['decisive', 'guarded'],
          },
        ],
      },
    });

    const result = await filmService.extractCharacters('MIKA studies the control panel.');

    expect(mocks.extractCharacters).toHaveBeenCalledWith({
      content: 'MIKA studies the control panel.',
      language: 'zh-CN',
    });
    expect(result[0]).toMatchObject({
      name: 'Mika',
      description: 'Short silver hair and sharp gaze',
      personality: {
        traits: ['decisive', 'guarded'],
      },
      appearance: {
        gender: 'FEMALE',
        ageGroup: '20s',
      },
    });
  });

  it('routes prop extraction through client.filmAnalysis.extractProps', async () => {
    mocks.extractProps.mockResolvedValue({
      code: '2000',
      data: {
        props: [
          {
            name: 'Prototype keycard',
            role: 'PLOT_DEVICE',
            description: 'A matte black access card with red LEDs',
          },
        ],
      },
    });

    const result = await filmService.extractProps('The prototype keycard unlocks the vault.');

    expect(mocks.extractProps).toHaveBeenCalledWith({
      content: 'The prototype keycard unlocks the vault.',
      language: 'zh-CN',
    });
    expect(result[0]).toMatchObject({
      name: 'Prototype keycard',
      description: 'A matte black access card with red LEDs',
    });
  });

  it('throws the backend message when client.filmAnalysis.analyzeScript returns a failure code', async () => {
    mocks.analyzeScript.mockResolvedValue({
      code: '5000',
      msg: 'film analysis failed',
    });

    await expect(filmService.analyzeScript('broken screenplay')).rejects.toThrow('film analysis failed');
  });

  it('routes film image generation through imageService.generateImage', async () => {
    const expectedOutcome = {
      recipe: {
        prompt: 'cinematic neon alley',
        mode: 'text-to-image',
      },
      execution: {
        provider: 'app-image',
        providerModel: 'gemini-3-flash-image',
      },
      delivery: {
        url: 'https://cdn.example.com/film-image.png',
      },
      primaryArtifact: {
        resource: {
          url: 'https://cdn.example.com/film-image.png',
        },
      },
    };
    mocks.generateImage.mockResolvedValue(expectedOutcome);

    const actualOutcome = await filmService.generateImage('cinematic neon alley', '16:9');

    expect(mocks.generateImage).toHaveBeenCalledWith({
      prompt: 'cinematic neon alley',
      aspectRatio: '16:9',
      model: 'gemini-3-flash-image',
    });
    expect(actualOutcome).toBe(expectedOutcome);
  });

  it('routes film video generation through videoService.generateVideo', async () => {
    const builtRequest = {
      generationType: 'text',
      prompt: 'a drone shot over mountains',
      assets: [],
    };
    const expectedOutcome = {
      recipe: {
        prompt: 'a drone shot over mountains',
        mode: 'text-to-video',
      },
      execution: {
        provider: 'app-video',
        providerModel: 'sdkwork-2.5',
      },
      delivery: {
        url: 'https://cdn.example.com/film-video.mp4',
      },
      primaryArtifact: {
        resource: {
          url: 'https://cdn.example.com/film-video.mp4',
        },
      },
    };
    mocks.buildUnifiedVideoGenerationRequest.mockReturnValue(builtRequest);
    mocks.generateVideo.mockResolvedValue(expectedOutcome);

    const actualOutcome = await filmService.generateVideo('a drone shot over mountains');

    expect(mocks.buildUnifiedVideoGenerationRequest).toHaveBeenCalledWith({
      mode: 'text',
      prompt: 'a drone shot over mountains',
      negativePrompt: '',
      model: 'sdkwork-2.5',
      styleId: 'none',
      aspectRatio: '16:9',
      resolution: '720p',
      duration: '5s',
      fps: 24,
      image: undefined,
    });
    expect(mocks.generateVideo).toHaveBeenCalledWith(builtRequest);
    expect(actualOutcome).toBe(expectedOutcome);
  });

  it('wraps the optional film image reference with createVideoInputResourceRef before generating video', async () => {
    const imageRef = {
      type: 'image',
      url: 'https://cdn.example.com/film-reference.png',
      name: 'Film Reference',
    };
    const builtRequest = {
      generationType: 'smart_reference',
      prompt: 'a cinematic close-up with matching composition',
      assets: [{ role: 'reference_1', type: 'image', value: 'film-reference' }],
    };
    const outcome = {
      delivery: {
        url: 'https://cdn.example.com/film-image-to-video.mp4',
      },
    };
    mocks.createVideoInputResourceRef.mockReturnValue(imageRef);
    mocks.buildUnifiedVideoGenerationRequest.mockReturnValue(builtRequest);
    mocks.generateVideo.mockResolvedValue(outcome);

    await filmService.generateVideo(
      'a cinematic close-up with matching composition',
      'https://cdn.example.com/film-reference.png'
    );

    expect(mocks.createVideoInputResourceRef).toHaveBeenCalledWith({
      type: 'image',
      url: 'https://cdn.example.com/film-reference.png',
      name: 'Film Reference',
      mimeType: 'image/png',
      resource: {
        url: 'https://cdn.example.com/film-reference.png',
        name: 'Film Reference',
        type: 'IMAGE',
        mimeType: 'image/png',
      },
    });
    expect(mocks.buildUnifiedVideoGenerationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'smart_reference',
        image: imageRef,
      })
    );
    expect(mocks.generateVideo).toHaveBeenCalledWith(builtRequest);
  });

  it('creates local film entities with stable identities', () => {
    const project = filmService.createProject('Identity Test');
    const character = filmService.createEmptyCharacter();
    const prop = filmService.createEmptyProp();
    const location = filmService.createEmptyLocation();
    const shot = filmService.createEmptyShot('scene-1', 0, 'location-1');

    expect(project.input.id).toBe(project.input.uuid);
    expect(project.script.id).toBe(project.script.uuid);
    expect(project.settings.id).toBe(project.settings.uuid);
    expect(character.id).toBe(character.uuid);
    expect(prop.id).toBe(prop.uuid);
    expect(location.id).toBe(location.uuid);
    expect(shot.id).toBe(shot.uuid);
  });

  it('does not import generated SDK types directly from retired generic app SDK', async () => {
    const source = await readFile(
      new URL('./filmService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`from '@sdkwork/${'app'}-sdk'`)).toBe(false);
  });

  it('ships a film-service contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./filmService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated film contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
