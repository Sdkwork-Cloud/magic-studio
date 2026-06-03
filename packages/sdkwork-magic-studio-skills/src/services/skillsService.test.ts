import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
  list: vi.fn(),
  detail: vi.fn(),
  listMine: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  getAppSdkClientWithSession: vi.fn(() => ({
    skill: {
      listCategories: mocks.listCategories,
      list: mocks.list,
      detail: mocks.detail,
      listMine: mocks.listMine,
      enable: mocks.enable,
      disable: mocks.disable,
    },
  })),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  getAppSdkClientWithSession: mocks.getAppSdkClientWithSession,
}));

import { clearSkillsServiceCache, skillsService } from './skillsService';

describe('skillsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSkillsServiceCache();

    mocks.listCategories.mockResolvedValue({
      code: '2000',
      data: [
        {
          id: 12,
          code: 'video',
          name: 'Video',
        },
      ],
    });
    mocks.list.mockResolvedValue({
      code: '2000',
      data: {
        content: [
          {
            id: 'skill-video-1',
            name: 'Video Styler',
            description: 'Cinematic video skill',
            categoryId: 12,
            provider: 'SDKWork',
            runtime: 'web,desktop',
            installCount: 42,
            tags: ['video', 'style'],
            featured: true,
            version: '1.2.3',
          },
        ],
        totalElements: 1,
      },
    });
    mocks.detail.mockResolvedValue({
      code: '2000',
      data: {
        id: 'skill-video-1',
        name: 'Video Styler',
        description: 'Cinematic video skill',
        categoryId: 12,
        provider: 'SDKWork',
        runtime: 'web',
        tags: ['video'],
        version: '1.2.3',
      },
    });
    mocks.listMine.mockResolvedValue({
      code: '2000',
      data: [
        {
          id: 'skill-mine-1',
          name: 'My Skill',
          description: 'Installed skill',
          categoryId: 12,
          provider: 'SDKWork',
          runtime: 'web',
          tags: ['video'],
          version: '1.0.0',
        },
      ],
    });
    mocks.enable.mockResolvedValue({
      code: '2000',
      data: {
        enabled: true,
      },
    });
    mocks.disable.mockResolvedValue({
      code: '2000',
      data: true,
    });
  });

  it('loads skill categories through client.skill.listCategories', async () => {
    const categories = await skillsService.listCategories();

    expect(categories.find((item) => item.id === 'video')).toMatchObject({
      id: 'video',
      backendId: 12,
      label: 'Video',
    });
  });

  it('fails closed when skill categories cannot be loaded', async () => {
    mocks.listCategories.mockRejectedValueOnce(new Error('category service unavailable'));

    await expect(skillsService.listCategories()).rejects.toThrow('category service unavailable');
  });

  it('loads skills through client.skill.list with normalized query params', async () => {
    await skillsService.listCategories();

    const result = await skillsService.listSkills({
      tab: 'featured',
      category: 'video',
      keyword: 'clip',
      page: 1,
      size: 20,
    });

    expect(mocks.list).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      pageNum: 1,
      pageSize: 20,
      sortBy: 'recommended',
      keyword: 'clip',
      categoryId: 12,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 'skill-video-1',
      name: 'Video Styler',
      category: 'video',
      featured: true,
      compatibility: ['web', 'desktop'],
    });
  });

  it('loads a skill detail through client.skill.detail', async () => {
    await skillsService.listCategories();

    const skill = await skillsService.getSkill('skill-video-1');

    expect(mocks.detail).toHaveBeenCalledWith('skill-video-1');
    expect(skill).toMatchObject({
      id: 'skill-video-1',
      name: 'Video Styler',
      category: 'video',
    });
  });

  it('loads installed skills through client.skill.listMine', async () => {
    await skillsService.listCategories();

    const skills = await skillsService.listMySkills();

    expect(mocks.listMine).toHaveBeenCalledTimes(1);
    expect(skills[0]).toMatchObject({
      id: 'skill-mine-1',
      name: 'My Skill',
      category: 'video',
    });
  });

  it('routes enable and disable through client.skill methods', async () => {
    await skillsService.enableSkill('skill-video-1');
    await skillsService.disableSkill('skill-video-1');

    expect(mocks.enable).toHaveBeenCalledWith('skill-video-1');
    expect(mocks.disable).toHaveBeenCalledWith('skill-video-1');
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./skillsService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('keeps the contract guard on the shared app sdk boundary', async () => {
    const source = await readFile(
      new URL('./skillsService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(source.includes("from '@sdkwork/magic-studio-core/sdk'")).toBe(true);
  });

  it('does not include generated app sdk source folders in package typecheck config', async () => {
    const source = await readFile(
      new URL('../../tsconfig.json', import.meta.url),
      'utf8',
    );

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(source.includes('sdkwork-sdk-common-typescript')).toBe(false);
  });

  it('ships a skills service contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./skillsService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated skills contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
