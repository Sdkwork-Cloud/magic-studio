import type { MagicStudioMagicCutProjectListQuery } from '@sdkwork/magic-studio-host-types';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { CutProject } from '@sdkwork/magic-studio-types/magiccut';
import type {
  Page,
  PageRequest,
  Sort,
} from '@sdkwork/magic-studio-types/pagination';
import { Result, type ServiceResult } from '@sdkwork/magic-studio-types/service';

import {
  getMagicCutServerClient,
  isNotFoundError,
  normalizeMagicCutProject,
  normalizeText,
} from './magicCutServerSupport';

const DEFAULT_SORT: Sort = {
  sorted: true,
  unsorted: false,
  empty: false,
};

function toMagicCutProjectListQuery(
  pageRequest?: PageRequest,
): MagicStudioMagicCutProjectListQuery | undefined {
  if (!pageRequest) {
    return undefined;
  }

  return {
    page: (pageRequest.page ?? 0) + 1,
    size: pageRequest.size ?? 20,
    keyword: normalizeText(pageRequest.keyword),
    sort: pageRequest.sort,
  };
}

function toMagicCutProjectPage(
  projects: CutProject[],
  meta: { page?: number; pageSize?: number; total?: number } | undefined,
  pageRequest?: PageRequest,
): Page<CutProject> {
  const requestedPage = pageRequest?.page ?? 0;
  const requestedSize = pageRequest?.size ?? 20;
  const pageNumber = Math.max(0, (meta?.page ?? requestedPage + 1) - 1);
  const size = meta?.pageSize ?? requestedSize;
  const totalElements = meta?.total ?? projects.length;
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;

  return {
    content: projects,
    pageable: {
      pageNumber,
      pageSize: size,
      offset: pageNumber * size,
      paged: true,
      unpaged: false,
      sort: DEFAULT_SORT,
    },
    last: pageNumber >= Math.max(0, totalPages - 1),
    totalPages,
    totalElements,
    size,
    number: pageNumber,
    sort: DEFAULT_SORT,
    first: pageNumber === 0,
    numberOfElements: projects.length,
    empty: projects.length === 0,
  };
}

function normalizeProjectPayload(entity: Partial<CutProject>): CutProject {
  const normalized = normalizeMagicCutProject(entity);
  if (!normalized) {
    throw new Error('MagicCut project payload is missing a stable entity key');
  }
  return normalized;
}

export class MagicCutProjectService {
  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<CutProject>>> {
    try {
      const client = getMagicCutServerClient();
      const response = await client.listMagicCutProjects(
        toMagicCutProjectListQuery(pageRequest),
      );
      const projects = response.items
        .map((item) => normalizeMagicCutProject(item))
        .filter((item): item is CutProject => item !== null);

      return Result.success(toMagicCutProjectPage(projects, response.meta, pageRequest));
    } catch (error) {
      return Result.error(
        error instanceof Error ? error.message : 'Failed to list MagicCut projects',
      );
    }
  }

  async findById(id: string): Promise<ServiceResult<CutProject | null>> {
    try {
      const client = getMagicCutServerClient();
      const response = await client.readMagicCutProject(id);
      return Result.success(normalizeMagicCutProject(response.data));
    } catch (error) {
      if (isNotFoundError(error)) {
        return Result.success(null);
      }
      return Result.error(
        error instanceof Error ? error.message : 'Failed to read MagicCut project',
      );
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return !!result.data;
  }

  async findAllById(ids: string[]): Promise<ServiceResult<CutProject[]>> {
    const results: CutProject[] = [];
    for (const id of ids) {
      const response = await this.findById(id);
      if (response.data) {
        results.push(response.data);
      }
    }
    return Result.success(results);
  }

  async count(): Promise<number> {
    const response = await this.findAll({ page: 0, size: 1, sort: ['updatedAt,desc'] });
    return response.data?.totalElements ?? 0;
  }

  async save(entity: Partial<CutProject>): Promise<ServiceResult<CutProject>> {
    try {
      const client = getMagicCutServerClient();
      const project = normalizeProjectPayload(entity);

      let response;
      try {
        const projectKey = resolveEntityKey(project);
        response = await client.updateMagicCutProject(projectKey, { project });
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }
        response = await client.createMagicCutProject({ project });
      }

      const normalized = normalizeMagicCutProject(response.data);
      if (!normalized) {
        return Result.error('MagicCut project save returned an invalid project payload');
      }
      return Result.success(normalized);
    } catch (error) {
      return Result.error(
        error instanceof Error ? error.message : 'Failed to save MagicCut project',
      );
    }
  }

  async duplicateById(
    id: string,
    name?: string,
  ): Promise<ServiceResult<CutProject>> {
    try {
      const client = getMagicCutServerClient();
      const response = await client.duplicateMagicCutProject(id, { name });
      const normalized = normalizeMagicCutProject(response.data);

      if (!normalized) {
        return Result.error('MagicCut project duplicate returned an invalid project payload');
      }

      return Result.success(normalized);
    } catch (error) {
      return Result.error(
        error instanceof Error ? error.message : 'Failed to duplicate MagicCut project',
      );
    }
  }

  async saveAll(entities: Partial<CutProject>[]): Promise<ServiceResult<CutProject[]>> {
    const projects: CutProject[] = [];
    for (const entity of entities) {
      const response = await this.save(entity);
      if (!response.success || !response.data) {
        return Result.error(response.message || 'Failed to save MagicCut projects');
      }
      projects.push(response.data);
    }
    return Result.success(projects);
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    try {
      const client = getMagicCutServerClient();
      await client.deleteMagicCutProject(id);
      return Result.success(undefined);
    } catch (error) {
      return Result.error(
        error instanceof Error ? error.message : 'Failed to delete MagicCut project',
      );
    }
  }

  async delete(entity: CutProject): Promise<ServiceResult<void>> {
    const key = (() => {
      try {
        return resolveEntityKey(entity);
      } catch {
        return normalizeText(entity.uuid) || normalizeText(entity.id) || '';
      }
    })();
    return this.deleteById(key);
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      const result = await this.deleteById(id);
      if (!result.success) {
        return result;
      }
    }
    return Result.success(undefined);
  }

  async setAll(entities: CutProject[]): Promise<ServiceResult<void>> {
    const serverProjectsResponse = await this.findAll({ page: 0, size: 500 });
    const serverProjects = serverProjectsResponse.data?.content ?? [];

    const incomingKeys = new Set(
      entities
        .map((entity) => {
          try {
            return resolveEntityKey(entity);
          } catch {
            return normalizeText(entity.uuid) || normalizeText(entity.id) || null;
          }
        })
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    );

    for (const entity of entities) {
      const result = await this.save(entity);
      if (!result.success) {
        return Result.error(result.message || 'Failed to persist MagicCut project set');
      }
    }

    for (const existing of serverProjects) {
      if (!incomingKeys.has(resolveEntityKey(existing))) {
        const result = await this.delete(existing);
        if (!result.success) {
          return result;
        }
      }
    }

    return Result.success(undefined);
  }

  async clear(): Promise<ServiceResult<void>> {
    const response = await this.findAll({ page: 0, size: 500 });
    const projects = response.data?.content ?? [];
    for (const project of projects) {
      const result = await this.delete(project);
      if (!result.success) {
        return result;
      }
    }
    return Result.success(undefined);
  }
}

export const magicCutProjectService = new MagicCutProjectService();
