import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveProject: vi.fn(),
  listProjects: vi.fn(),
  getProject: vi.fn(),
  deleteProject: vi.fn(),
  getAppSdkClientWithSession: vi.fn(() => ({
    filmProject: {
      saveProject: mocks.saveProject,
      listProjects: mocks.listProjects,
      getProject: mocks.getProject,
      deleteProject: mocks.deleteProject,
    },
  })),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  getAppSdkClientWithSession: mocks.getAppSdkClientWithSession,
}));

import { filmProjectService } from './filmProjectService';

afterEach(() => {
  vi.restoreAllMocks();
  mocks.saveProject.mockReset();
  mocks.listProjects.mockReset();
  mocks.getProject.mockReset();
  mocks.deleteProject.mockReset();
  mocks.getAppSdkClientWithSession.mockClear();
});

describe('filmProjectService', () => {
  it('routes save through client.filmProject.saveProject', async () => {
    mocks.saveProject.mockResolvedValue({
      code: '2000',
      data: {
        projectId: '701',
        projectUuid: 'film-project-uuid-1',
        name: 'Hero Journey',
        status: 'DRAFT',
        project: {
          id: 'film-project-uuid-1',
          uuid: 'film-project-uuid-1',
          type: 'FILM_PROJECT',
          name: 'Hero Journey',
          status: 'DRAFT',
          input: { id: 'input-1', uuid: 'input-1', type: 'FILM_USER_INPUT', text: '', language: 'zh', createdAt: 1, updatedAt: 1 },
          script: { id: 'script-1', uuid: 'script-1', type: 'FILM_SCRIPT', title: 'Hero Journey', genres: [], styles: [], content: '', standardized: false, version: '1.0.0', createdAt: 1, updatedAt: 1 },
          characters: [],
          props: [],
          locations: [],
          scenes: [],
          shots: [],
          media: [],
          settings: { id: 'settings-1', uuid: 'settings-1', aspect: '16:9', createdAt: 1, updatedAt: 1 },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    });

    const result = await filmProjectService.save({
      id: 'film-project-uuid-1',
      uuid: 'film-project-uuid-1',
      type: 'FILM_PROJECT',
      name: 'Hero Journey',
      status: 'DRAFT',
      input: { id: 'input-1', uuid: 'input-1', type: 'FILM_USER_INPUT', text: '', language: 'zh', createdAt: 1, updatedAt: 1 },
      script: { id: 'script-1', uuid: 'script-1', type: 'FILM_SCRIPT', title: 'Hero Journey', genres: [], styles: [], content: '', standardized: false, version: '1.0.0', createdAt: 1, updatedAt: 1 },
      characters: [],
      props: [],
      locations: [],
      scenes: [],
      shots: [],
      media: [],
      settings: { id: 'settings-1', uuid: 'settings-1', aspect: '16:9', createdAt: 1, updatedAt: 1 },
      createdAt: 1,
      updatedAt: 1,
    });

    expect(mocks.saveProject).toHaveBeenCalledWith({
      project: expect.objectContaining({
        uuid: 'film-project-uuid-1',
        name: 'Hero Journey',
      }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.uuid).toBe('film-project-uuid-1');
  });

  it('routes findAll through client.filmProject.listProjects', async () => {
    mocks.listProjects.mockResolvedValue({
      code: '2000',
      data: {
        content: [
          {
            projectId: '702',
            projectUuid: 'film-project-uuid-2',
            name: 'Neon Alley',
            status: 'SCRIPT_READY',
            project: {
              id: 'film-project-uuid-2',
              uuid: 'film-project-uuid-2',
              type: 'FILM_PROJECT',
              name: 'Neon Alley',
              status: 'SCRIPT_READY',
              input: { id: 'input-2', uuid: 'input-2', type: 'FILM_USER_INPUT', text: '', language: 'zh', createdAt: 1, updatedAt: 1 },
              script: { id: 'script-2', uuid: 'script-2', type: 'FILM_SCRIPT', title: 'Neon Alley', genres: [], styles: [], content: '', standardized: false, version: '1.0.0', createdAt: 1, updatedAt: 1 },
              characters: [],
              props: [],
              locations: [],
              scenes: [],
              shots: [],
              media: [],
              settings: { id: 'settings-2', uuid: 'settings-2', aspect: '16:9', createdAt: 1, updatedAt: 1 },
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        number: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        empty: false,
      },
    });

    const result = await filmProjectService.findAll({ page: 0, size: 20 });

    expect(mocks.listProjects).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(result.success).toBe(true);
    expect(result.data?.content[0]?.name).toBe('Neon Alley');
  });

  it('routes findById through client.filmProject.getProject', async () => {
    mocks.getProject.mockResolvedValue({
      code: '2000',
      data: {
        projectId: '703',
        projectUuid: 'film-project-uuid-3',
        name: 'Quiet Harbor',
        status: 'DRAFT',
        project: {
          id: 'film-project-uuid-3',
          uuid: 'film-project-uuid-3',
          type: 'FILM_PROJECT',
          name: 'Quiet Harbor',
          status: 'DRAFT',
          input: { id: 'input-3', uuid: 'input-3', type: 'FILM_USER_INPUT', text: '', language: 'zh', createdAt: 1, updatedAt: 1 },
          script: { id: 'script-3', uuid: 'script-3', type: 'FILM_SCRIPT', title: 'Quiet Harbor', genres: [], styles: [], content: '', standardized: false, version: '1.0.0', createdAt: 1, updatedAt: 1 },
          characters: [],
          props: [],
          locations: [],
          scenes: [],
          shots: [],
          media: [],
          settings: { id: 'settings-3', uuid: 'settings-3', aspect: '16:9', createdAt: 1, updatedAt: 1 },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    });

    const result = await filmProjectService.findById('film-project-uuid-3');

    expect(mocks.getProject).toHaveBeenCalledWith('film-project-uuid-3');
    expect(result.success).toBe(true);
    expect(result.data?.uuid).toBe('film-project-uuid-3');
  });

  it('routes deleteById through client.filmProject.deleteProject', async () => {
    mocks.deleteProject.mockResolvedValue({
      code: '2000',
    });

    const result = await filmProjectService.deleteById('film-project-uuid-4');

    expect(mocks.deleteProject).toHaveBeenCalledWith('film-project-uuid-4');
    expect(result.success).toBe(true);
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./filmProjectService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('ships a film-project contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./filmProjectService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
