import type { FilmProject } from '@sdkwork/magic-studio-types/film';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import {
  type IBaseService,
  Result,
  type ServiceResult,
} from '@sdkwork/magic-studio-types/service';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import {
  getFilmServerClient,
  isNotFoundError,
  normalizeFilmProjectRecord,
  normalizeText,
} from './filmServerSupport';

const DEFAULT_SORT = {
  sorted: false,
  unsorted: true,
  empty: true,
} as const;

const normalizeFilmProjectInput = (
  value: Partial<FilmProject> | undefined | null,
): FilmProject => {
  const { projectGraph: _ignoredProjectGraph, ...project } = {
    ...(value || {}),
  } as FilmProject;
  const projectKey = normalizeText(project.uuid) || normalizeText(project.id) || '';

  return {
    ...project,
    id: normalizeText(project.id) || projectKey,
    uuid: normalizeText(project.uuid) || projectKey,
    type: 'FILM_PROJECT',
    name: normalizeText(project.name) || 'Untitled Film Project',
    description: typeof project.description === 'string' ? project.description : '',
    status: normalizeText(project.status) || 'DRAFT',
  } as FilmProject;
};

function toLegacyPage(
  items: FilmProject[],
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  },
): Page<FilmProject> {
  const size = Math.max(1, meta?.pageSize ?? items.length ?? 1);
  const totalElements = Math.max(items.length, meta?.total ?? items.length);
  const number = Math.max(0, (meta?.page ?? 1) - 1);
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  return {
    content: items,
    pageable: {
      pageNumber: number,
      pageSize: size,
      offset: number * size,
      paged: true,
      unpaged: false,
      sort: DEFAULT_SORT,
    },
    last: number >= totalPages - 1,
    totalElements,
    totalPages,
    size,
    number,
    sort: DEFAULT_SORT,
    first: number === 0,
    numberOfElements: items.length,
    empty: items.length === 0,
  };
}

export class FilmProjectService implements IBaseService<FilmProject> {
  async save(entity: Partial<FilmProject>): Promise<ServiceResult<FilmProject>> {
    try {
      const serverClient = getFilmServerClient();
      const normalizedProject = normalizeFilmProjectInput(entity);
      const projectKey = (() => {
        try {
          return resolveEntityKey(normalizedProject);
        } catch {
          return normalizeText(normalizedProject.uuid) || normalizeText(normalizedProject.id);
        }
      })();

      let response;
      if (projectKey) {
        try {
          response = await serverClient.updateFilmProject(projectKey, {
            project: normalizedProject,
          });
        } catch (error) {
          if (!isNotFoundError(error)) {
            throw error;
          }
          response = await serverClient.createFilmProject({
            project: normalizedProject,
          });
        }
      } else {
        response = await serverClient.createFilmProject({
          project: normalizedProject,
        });
      }
      const project = normalizeFilmProjectRecord(response.data);

      if (!project) {
        return Result.error('Film project save returned empty data');
      }

      return Result.success(project);
    } catch (error) {
      return Result.error(error instanceof Error ? error.message : 'Failed to save film project');
    }
  }

  async saveAll(entities: Partial<FilmProject>[]): Promise<ServiceResult<FilmProject[]>> {
    const results: FilmProject[] = [];
    for (const entity of entities) {
      const result = await this.save(entity);
      if (!result.success || !result.data) {
        return Result.error(result.message || 'Failed to save film projects');
      }

      results.push(result.data);
    }

    return Result.success(results);
  }

  async findById(id: string): Promise<ServiceResult<FilmProject | null>> {
    try {
      const response = await getFilmServerClient().readFilmProject(id);
      return Result.success(normalizeFilmProjectRecord(response.data));
    } catch (error) {
      if (isNotFoundError(error)) {
        return Result.success(null);
      }

      return Result.error(error instanceof Error ? error.message : 'Failed to load film project');
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return !!result.data;
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<FilmProject>>> {
    try {
      const response = await getFilmServerClient().listFilmProjects({
        page: Math.max(1, (pageRequest?.page ?? 0) + 1),
        size: Math.max(1, pageRequest?.size ?? 20),
        keyword: pageRequest?.keyword,
        sort: pageRequest?.sort,
      });
      const items = (response.items || [])
        .map(normalizeFilmProjectRecord)
        .filter((item): item is FilmProject => item !== null);

      return Result.success(
        toLegacyPage(items, {
          page: response.meta?.page,
          pageSize: response.meta?.pageSize,
          total: response.meta?.total,
        }),
      );
    } catch (error) {
      return Result.error(error instanceof Error ? error.message : 'Failed to list film projects');
    }
  }

  async findAllById(ids: string[]): Promise<ServiceResult<FilmProject[]>> {
    const items: FilmProject[] = [];
    for (const id of ids) {
      const result = await this.findById(id);
      if (result.data) {
        items.push(result.data);
      }
    }

    return Result.success(items);
  }

  async count(): Promise<number> {
    try {
      const response = await getFilmServerClient().listFilmProjects({
        page: 1,
        size: 1,
      });
      return response.meta?.total ?? response.items?.length ?? 0;
    } catch {
      return 0;
    }
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    try {
      await getFilmServerClient().deleteFilmProject(id);
      return Result.success(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error.message : 'Failed to delete film project');
    }
  }

  async delete(entity: FilmProject): Promise<ServiceResult<void>> {
    return this.deleteById(entity.uuid || entity.id || '');
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
}

export const filmProjectService: FilmProjectService = new FilmProjectService();
