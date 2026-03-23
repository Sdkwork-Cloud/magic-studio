import { APP_ROOT_DIR, DIR_NAMES } from '@sdkwork/react-fs';
import { vfs } from '@sdkwork/react-fs';
import { platform, getAppSdkClientWithSession, uploadViaPresignedUrl } from '@sdkwork/react-core';
import {
  StudioWorkspace,
  StudioProject,
  ProjectType,
  pathUtils,
  generateUUID,
  ImageMediaResource,
  MediaResourceType,
  ServiceResult,
  Result,
  IBaseService,
  Page,
  PageRequest
} from '@sdkwork/react-commons';

interface ApiEnvelope<T> {
  data?: T;
  code?: string | number;
  msg?: string;
  message?: string;
}

interface SdkWorkspaceVO {
  id?: string | number;
  workspaceId?: string | number;
  workspaceName?: string;
  workspaceDescription?: string;
  workspaceIcon?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  createTime?: string;
  updateTime?: string;
}

interface SdkProjectVO {
  id?: string | number;
  projectId?: string | number;
  projectName?: string;
  projectDescription?: string;
  projectType?: string;
  projectIcon?: string;
  coverImageUrl?: string;
  workspaceId?: string | number;
  createdAt?: string | number;
  updatedAt?: string | number;
  createTime?: string;
  updateTime?: string;
}

interface SdkProjectPage {
  content?: SdkProjectVO[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

interface SdkWorkspaceCreateForm {
  workspaceName?: string;
  workspaceDescription?: string;
  workspaceIcon?: string;
}

interface SdkWorkspaceUpdateForm {
  workspaceId?: string;
  workspaceName?: string;
  workspaceDescription?: string;
  workspaceIcon?: string;
}

interface SdkProjectCreateForm {
  workspaceId?: string;
  projectName?: string;
  projectDescription?: string;
  projectType?: string;
  projectIcon?: string;
}

interface SdkWorkspacesApiLike {
  listWorkspaces?: () => Promise<unknown>;
  getWorkspaceDetail?: (workspaceId: string | number) => Promise<unknown>;
  createWorkspace?: (body: SdkWorkspaceCreateForm) => Promise<unknown>;
  updateWorkspace?: (workspaceId: string | number, body: SdkWorkspaceUpdateForm) => Promise<unknown>;
  deleteWorkspace?: (workspaceId: string | number) => Promise<unknown>;
  listProjects?: (workspaceId: string | number, params?: Record<string, unknown>) => Promise<unknown>;
  createProject?: (workspaceId: string | number, body: SdkProjectCreateForm) => Promise<unknown>;
  deleteProject?: (workspaceId: string | number, projectId: string | number) => Promise<unknown>;
}

interface SdkClientLike {
  workspaces?: SdkWorkspacesApiLike;
}

export class WorkspaceService implements IBaseService<StudioWorkspace> {
  private readonly PROJECT_TYPE_SET: ReadonlySet<ProjectType> = new Set<ProjectType>([
    'APP',
    'VIDEO',
    'AUDIO',
    'FILM',
    'CANVAS',
    'NOTES',
    'CUT'
  ]);

  private toTimestamp(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = new Date(value).getTime();
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return Date.now();
  }

  private toIdString(value: unknown, fallback = ''): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return fallback;
  }

  private toProjectType(value: unknown): ProjectType {
    const normalized = typeof value === 'string' ? value.toUpperCase() : '';
    if (this.PROJECT_TYPE_SET.has(normalized as ProjectType)) {
      return normalized as ProjectType;
    }
    return 'APP';
  }

  private unwrapApiData<T>(payload: unknown): T | undefined {
    if (!payload || typeof payload !== 'object') {
      return payload as T | undefined;
    }
    if ('data' in (payload as ApiEnvelope<T>)) {
      const envelope = payload as ApiEnvelope<T>;
      if (envelope.data !== undefined) {
        return envelope.data;
      }
    }
    return payload as T;
  }

  private buildPage<T>(items: T[], pageRequest?: PageRequest): Page<T> {
    const totalElements = items.length;
    const size = pageRequest?.size || 1000;
    const page = pageRequest?.page || 0;
    const start = page * size;
    const content = items.slice(start, start + size);

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        offset: start,
        paged: true,
        unpaged: false,
        sort: { sorted: true, unsorted: false, empty: false }
      },
      last: start + size >= totalElements,
      totalPages: Math.ceil(totalElements / size),
      totalElements,
      size,
      number: page,
      first: page === 0,
      numberOfElements: content.length,
      empty: content.length === 0,
      sort: { sorted: true, unsorted: false, empty: false }
    };
  }

  private getSdkClient(): SdkClientLike {
    return getAppSdkClientWithSession() as unknown as SdkClientLike;
  }

  private buildCoverImageResource(iconUrl?: string): ImageMediaResource | undefined {
    if (!iconUrl || iconUrl.trim().length === 0) {
      return undefined;
    }

    const pureUrl = iconUrl.split('?')[0];
    const fileName = pureUrl.split('/').pop() || 'cover.png';
    const extension = pathUtils.extname(fileName).replace('.', '') || 'png';

    return {
      id: generateUUID(),
      uuid: generateUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: MediaResourceType.IMAGE,
      name: fileName,
      url: iconUrl,
      origin: 'system',
      extension
    };
  }

  private mapWorkspaceVo(vo: SdkWorkspaceVO, projects: StudioProject[] = []): StudioWorkspace {
    const workspaceId = this.toIdString(vo.workspaceId ?? vo.id, generateUUID());

    return {
      id: workspaceId,
      uuid: workspaceId,
      name: vo.workspaceName || 'Workspace',
      description: vo.workspaceDescription || '',
      icon: vo.workspaceIcon,
      projects,
      createdAt: this.toTimestamp(vo.createdAt ?? vo.createTime),
      updatedAt: this.toTimestamp(vo.updatedAt ?? vo.updateTime)
    };
  }

  private mapProjectVo(vo: SdkProjectVO, workspaceIdFromContext?: string): StudioProject {
    const projectId = this.toIdString(vo.projectId ?? vo.id, generateUUID());
    const workspaceId = this.toIdString(vo.workspaceId, workspaceIdFromContext || '');
    const coverImageUrl = String(vo.coverImageUrl || vo.projectIcon || '').trim();

    return {
      id: projectId,
      uuid: projectId,
      name: vo.projectName || 'Project',
      description: vo.projectDescription || '',
      type: this.toProjectType(vo.projectType),
      workspaceId,
      coverImage: this.buildCoverImageResource(coverImageUrl),
      createdAt: this.toTimestamp(vo.createdAt ?? vo.createTime),
      updatedAt: this.toTimestamp(vo.updatedAt ?? vo.updateTime)
    };
  }

  private resolveUploadedFileReference(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const candidates = [
      record.accessUrl,
      record.previewUrl,
      record.url,
      record.path,
      record.objectKey
    ];

    for (const candidate of candidates) {
      const normalized = String(candidate || '').trim();
      if (normalized) {
        return normalized;
      }
    }

    return undefined;
  }

  private async uploadProjectCoverImage(
    sdkClient: SdkClientLike,
    coverImage: { data: Uint8Array; name: string }
  ): Promise<string> {
    const uploadBytes = new Uint8Array(coverImage.data.byteLength);
    uploadBytes.set(coverImage.data);

    const uploadResult = await uploadViaPresignedUrl(sdkClient as Parameters<typeof uploadViaPresignedUrl>[0], {
      file: new Blob([uploadBytes]),
      fileName: coverImage.name,
      type: 'IMAGE',
      path: 'workspaces/projects'
    });

    const registeredData = this.unwrapApiData<Record<string, unknown>>(uploadResult.registerResult);
    const uploadedReference =
      this.resolveUploadedFileReference(registeredData) ||
      this.resolveUploadedFileReference(uploadResult.registerResult) ||
      String(uploadResult.objectKey || '').trim();

    if (!uploadedReference) {
      throw new Error('Project cover upload completed without a usable file reference.');
    }

    return uploadedReference;
  }

  private async loadProjectsForWorkspaceFromSdk(
    workspaceId: string,
    sdkClient: SdkClientLike
  ): Promise<StudioProject[]> {
    const workspaceApi = sdkClient.workspaces;
    if (!workspaceApi || typeof workspaceApi.listProjects !== 'function') {
      return [];
    }

    const response = await workspaceApi.listProjects(workspaceId, {
        page: 0,
        size: 200,
        sort: ['updatedAt,DESC']
      });
    const pageData = this.unwrapApiData<SdkProjectPage>(response);
    const content = Array.isArray(pageData?.content) ? pageData.content : [];
    return content.map((item) => this.mapProjectVo(item, workspaceId));
  }

  private async findAllFromSdk(pageRequest?: PageRequest): Promise<ServiceResult<Page<StudioWorkspace>>> {
    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;

    if (!workspaceApi || typeof workspaceApi.listWorkspaces !== 'function') {
      return Result.error('SDK workspace API is unavailable');
    }

    const response = await workspaceApi.listWorkspaces();
    const list = this.unwrapApiData<SdkWorkspaceVO[]>(response);
    const rawWorkspaces = Array.isArray(list) ? list : [];

    const mapped = await Promise.all(
      rawWorkspaces.map(async (item) => {
        const workspaceId = this.toIdString(item.workspaceId ?? item.id, '');
        const projects = workspaceId ? await this.loadProjectsForWorkspaceFromSdk(workspaceId, sdkClient) : [];
        return this.mapWorkspaceVo(item, projects);
      })
    );

    let workspaces = mapped;

    if (pageRequest?.keyword) {
      const keyword = pageRequest.keyword.toLowerCase();
      workspaces = workspaces.filter((workspace) => workspace.name.toLowerCase().includes(keyword));
    }

    workspaces.sort((left, right) => {
      const leftTime = this.toTimestamp(left.createdAt);
      const rightTime = this.toTimestamp(right.createdAt);
      return rightTime - leftTime;
    });

    return Result.success(this.buildPage(workspaces, pageRequest));
  }

  private async findWorkspaceByIdFromSdk(id: string): Promise<ServiceResult<StudioWorkspace | null>> {
    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;

    if (!workspaceApi) {
      return Result.error('SDK workspace API is unavailable');
    }

    if (typeof workspaceApi.getWorkspaceDetail === 'function') {
      const detailResponse = await workspaceApi.getWorkspaceDetail(id);
      const workspaceVo = this.unwrapApiData<SdkWorkspaceVO>(detailResponse);
      if (!workspaceVo) {
        return Result.success(null);
      }
      const workspaceId = this.toIdString(workspaceVo.workspaceId ?? workspaceVo.id, id);
      const projects = await this.loadProjectsForWorkspaceFromSdk(workspaceId, sdkClient);
      return Result.success(this.mapWorkspaceVo(workspaceVo, projects));
    }

    const listResult = await this.findAllFromSdk({ page: 0, size: 200 });
    if (!listResult.success || !listResult.data) {
      return Result.error(listResult.message || 'Failed to query workspace list from SDK');
    }

    const found = listResult.data.content.find((workspace) => workspace.uuid === id || workspace.id === id) || null;
    return Result.success(found);
  }

  private async saveWorkspaceToSdk(entity: Partial<StudioWorkspace>): Promise<ServiceResult<StudioWorkspace>> {
    if (!entity.uuid) {
      return Result.error('UUID required for update');
    }

    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;
    if (!workspaceApi || typeof workspaceApi.updateWorkspace !== 'function') {
      return Result.error('SDK workspace update API is unavailable');
    }

    const response = await workspaceApi.updateWorkspace(entity.uuid, {
      workspaceId: entity.uuid,
      workspaceName: entity.name,
      workspaceDescription: entity.description,
      workspaceIcon: entity.icon
    });

    const updatedVo = this.unwrapApiData<SdkWorkspaceVO>(response);
    if (!updatedVo) {
      return Result.error('SDK returned empty workspace update result');
    }

    const workspaceId = this.toIdString(updatedVo.workspaceId ?? updatedVo.id, entity.uuid);
    const projects = await this.loadProjectsForWorkspaceFromSdk(workspaceId, sdkClient);
    return Result.success(this.mapWorkspaceVo(updatedVo, projects));
  }

  private async createWorkspaceToSdk(name: string, description?: string, icon?: string): Promise<ServiceResult<StudioWorkspace>> {
    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;
    if (!workspaceApi || typeof workspaceApi.createWorkspace !== 'function') {
      return Result.error('SDK workspace create API is unavailable');
    }

    const response = await workspaceApi.createWorkspace({
      workspaceName: name,
      workspaceDescription: description,
      workspaceIcon: icon
    });

    const workspaceVo = this.unwrapApiData<SdkWorkspaceVO>(response);
    if (!workspaceVo) {
      return Result.error('SDK returned empty workspace create result');
    }

    const workspaceId = this.toIdString(workspaceVo.workspaceId ?? workspaceVo.id, '');
    const projects = workspaceId ? await this.loadProjectsForWorkspaceFromSdk(workspaceId, sdkClient) : [];
    return Result.success(this.mapWorkspaceVo(workspaceVo, projects));
  }

  private async createProjectToSdk(
    workspaceId: string,
    name: string,
    type: ProjectType,
    description: string,
    coverImage?: { data: Uint8Array; name: string }
  ): Promise<ServiceResult<StudioProject>> {
    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;

    const uploadedProjectIcon = coverImage
      ? await this.uploadProjectCoverImage(sdkClient, coverImage)
      : undefined;

    if (workspaceApi && typeof workspaceApi.createProject === 'function') {
      const response = await workspaceApi.createProject(workspaceId, {
        workspaceId,
        projectName: name,
        projectDescription: description,
        projectType: type,
        projectIcon: uploadedProjectIcon
      });
      const projectVo = this.unwrapApiData<SdkProjectVO>(response);
      if (!projectVo) {
        return Result.error('SDK returned empty project create result');
      }

      const normalizedProjectVo = {
        ...projectVo,
        projectIcon: projectVo.projectIcon || uploadedProjectIcon,
        coverImageUrl: projectVo.coverImageUrl || uploadedProjectIcon
      };

      return Result.success(this.mapProjectVo(normalizedProjectVo, workspaceId));
    }

    return Result.error('SDK project create API is unavailable');
  }

  private async deleteWorkspaceFromSdk(workspaceId: string): Promise<ServiceResult<void>> {
    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;
    if (!workspaceApi || typeof workspaceApi.deleteWorkspace !== 'function') {
      return Result.error('SDK workspace delete API is unavailable');
    }

    await workspaceApi.deleteWorkspace(workspaceId);
    return Result.success(undefined);
  }

  private async deleteProjectFromSdk(workspaceId: string, projectId: string): Promise<ServiceResult<void>> {
    const sdkClient = this.getSdkClient();
    const workspaceApi = sdkClient?.workspaces;

    if (workspaceApi && typeof workspaceApi.deleteProject === 'function') {
      await workspaceApi.deleteProject(workspaceId, projectId);
      return Result.success(undefined);
    }

    return Result.error('SDK project delete API is unavailable');
  }

  async initialize(): Promise<void> {
    const docRoot = await platform.getPath('documents');
    const workspacesRoot = pathUtils.join(docRoot, APP_ROOT_DIR, DIR_NAMES.WORKSPACES);
    try {
      await vfs.createDir(workspacesRoot);
    } catch {
      // Keep running if directory already exists.
    }
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<StudioWorkspace>>> {
    try {
      return await this.findAllFromSdk(pageRequest);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to query workspace list from SDK';
      return Result.error(message);
    }
  }

  async findById(id: string): Promise<ServiceResult<StudioWorkspace | null>> {
    try {
      return await this.findWorkspaceByIdFromSdk(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load workspace detail from SDK';
      return Result.error(message);
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return !!result.data;
  }

  async save(entity: Partial<StudioWorkspace>): Promise<ServiceResult<StudioWorkspace>> {
    try {
      return await this.saveWorkspaceToSdk(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update workspace through SDK';
      return Result.error(message);
    }
  }

  async saveAll(_entities: Partial<StudioWorkspace>[]): Promise<ServiceResult<StudioWorkspace[]>> {
    throw new Error('Batch save not supported');
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    return this.deleteWorkspace(id);
  }

  async delete(entity: StudioWorkspace): Promise<ServiceResult<void>> {
    return this.deleteWorkspace(entity.uuid);
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      await this.deleteById(id);
    }
    return Result.success(undefined);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<StudioWorkspace[]>> {
    const all = await this.findAll();
    const found = all.data?.content.filter((workspace) => ids.includes(workspace.uuid)) || [];
    return Result.success(found);
  }

  async count(): Promise<number> {
    const all = await this.findAll();
    return all.data?.totalElements || 0;
  }

  async createWorkspace(name: string, description?: string, icon?: string): Promise<ServiceResult<StudioWorkspace>> {
    try {
      return await this.createWorkspaceToSdk(name, description, icon);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create workspace through SDK';
      return Result.error(message);
    }
  }

  async createProject(
    workspaceId: string,
    name: string,
    type: ProjectType,
    description: string,
    coverImage?: { data: Uint8Array; name: string }
  ): Promise<ServiceResult<StudioProject>> {
    try {
      return await this.createProjectToSdk(workspaceId, name, type, description, coverImage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project through SDK';
      return Result.error(message);
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<ServiceResult<void>> {
    try {
      return await this.deleteWorkspaceFromSdk(workspaceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete workspace through SDK';
      return Result.error(message);
    }
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<ServiceResult<void>> {
    try {
      return await this.deleteProjectFromSdk(workspaceId, projectId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project through SDK';
      return Result.error(message);
    }
  }

  async saveProject(
    workspaceId: string,
    projectData: { name: string; type: ProjectType; description: string; coverImage?: { data: Uint8Array; name: string } }
  ): Promise<ServiceResult<StudioProject>> {
    return this.createProject(
      workspaceId,
      projectData.name,
      projectData.type,
      projectData.description,
      projectData.coverImage
    );
  }

  async updateWorkspace(uuid: string, name: string): Promise<ServiceResult<void>> {
    const result = await this.save({ uuid, name });
    if (!result.success) {
      return Result.error(result.message || 'Update failed');
    }
    return Result.success(undefined);
  }
}

export const workspaceService: WorkspaceService = new WorkspaceService();

export const getWorkspaces = workspaceService.findAll.bind(workspaceService);
