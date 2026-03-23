import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  createProjectMock,
  getAppSdkClientWithSessionMock,
  uploadViaPresignedUrlMock,
} = vi.hoisted(() => {
  const createProject = vi.fn();
  return {
    createProjectMock: createProject,
    getAppSdkClientWithSessionMock: vi.fn(() => ({
      workspaces: {
        createProject,
      },
    })),
    uploadViaPresignedUrlMock: vi.fn(),
  };
});

vi.mock('@sdkwork/react-core', () => ({
  platform: {
    getPath: vi.fn(),
  },
  getAppSdkClientWithSession: getAppSdkClientWithSessionMock,
  uploadViaPresignedUrl: uploadViaPresignedUrlMock,
}));

vi.mock('@sdkwork/react-fs', () => ({
  APP_ROOT_DIR: 'magic-studio',
  DIR_NAMES: {
    WORKSPACES: 'workspaces',
  },
  vfs: {
    createDir: vi.fn(),
  },
}));

import { WorkspaceService } from '../workspaceService';

describe('WorkspaceService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uploads project cover images via presigned url before creating the project', async () => {
    uploadViaPresignedUrlMock.mockResolvedValue({
      registerResult: {
        code: '2000',
        data: {
          accessUrl: 'https://cdn.example.com/workspaces/project-cover.png',
          objectKey: 'workspaces/projects/project-cover.png',
        },
      },
    });
    createProjectMock.mockResolvedValue({
      code: '2000',
      data: {
        projectId: 'project-1',
        workspaceId: 'workspace-1',
        projectName: 'Demo Project',
        projectDescription: 'demo description',
        projectType: 'APP',
        projectIcon: 'https://cdn.example.com/workspaces/project-cover.png',
      },
    });

    const service = new WorkspaceService();
    const result = await service.createProject(
      'workspace-1',
      'Demo Project',
      'APP',
      'demo description',
      {
        data: new Uint8Array([1, 2, 3]),
        name: 'project-cover.png',
      }
    );

    expect(uploadViaPresignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        file: expect.any(Blob),
        fileName: 'project-cover.png',
        type: 'IMAGE',
      })
    );
    expect(createProjectMock).toHaveBeenCalledWith(
      'workspace-1',
      expect.objectContaining({
        projectIcon: 'https://cdn.example.com/workspaces/project-cover.png',
      })
    );
    expect(result.success).toBe(true);
    expect(result.data?.coverImage?.url).toBe('https://cdn.example.com/workspaces/project-cover.png');
  });
});
