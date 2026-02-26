
;
import { storageConfig, APP_ROOT_DIR, DIR_NAMES } from '@sdkwork/react-fs';
import { vfs } from '@sdkwork/react-fs';
import { platform } from '@sdkwork/react-core';
import { StudioWorkspace, StudioProject, ProjectType, pathUtils, generateUUID, ImageMediaResource, MediaResourceType, ServiceResult, Result, IBaseService, Page, PageRequest, logger } from '@sdkwork/react-commons';

/**
 * Workspace Service
 * Manages Workspaces and Projects on the file system.
 * Implements IBaseService for standard data access patterns.
 */
class WorkspaceService implements IBaseService<StudioWorkspace> {
  
  async initialize(): Promise<void> {
      const docRoot = await platform.getPath('documents');
      const workspacesRoot = pathUtils.join(docRoot, APP_ROOT_DIR, DIR_NAMES.WORKSPACES);
      try { await vfs.createDir(workspacesRoot); } catch {}
  }

  // --- IBaseService Implementation ---

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<StudioWorkspace>>> {
      try {
          const docRoot = await platform.getPath('documents');
          const workspacesRoot = pathUtils.join(docRoot, APP_ROOT_DIR, DIR_NAMES.WORKSPACES);
          try { await vfs.createDir(workspacesRoot); } catch {}

          const entries = await vfs.readDir(workspacesRoot);
          let workspaces: StudioWorkspace[] = [];

          for (const entry of entries) {
              if (entry.isDirectory) {
                  const configPath = pathUtils.join(entry.path, 'workspace.json');
                  try {
                      const content = await vfs.readFile(configPath);
                      const wsData = JSON.parse(content);
                      
                      // Load Projects Metadata
                      const projectsDir = pathUtils.join(entry.path, 'projects');
                      const projects: StudioProject[] = [];
                      try {
                          const projEntries = await vfs.readDir(projectsDir);
                          for (const projEntry of projEntries) {
                              if (projEntry.isDirectory) {
                                  const projConfigPath = pathUtils.join(projEntry.path, 'project.json');
                                  try {
                                      const projContent = await vfs.readFile(projConfigPath);
                                      const projData = JSON.parse(projContent);
                                      projects.push({ ...projData, path: projEntry.path });
                                  } catch (e) {
                                      logger.warn('[WorkspaceService] Failed to load project config', projConfigPath, e);
                                  }
                              }
                          }
                      } catch (e) {
                          logger.warn('[WorkspaceService] Failed to read projects directory', projectsDir, e);
                      }

                      workspaces.push({ ...wsData, projects, path: entry.path });
                  } catch (e) {
                      logger.warn('[WorkspaceService] Failed to load workspace', entry.path, e);
                  }
              }
          }

          // Search Filter
          if (pageRequest?.keyword) {
              const lower = pageRequest.keyword.toLowerCase();
              workspaces = workspaces.filter(w => w.name.toLowerCase().includes(lower));
          }

          // Sort (Default: CreatedAt Desc)
          workspaces.sort((a, b) => b.createdAt - a.createdAt);

          // Pagination
          const totalElements = workspaces.length;
          const size = pageRequest?.size || 1000;
          const page = pageRequest?.page || 0;
          const start = page * size;
          const pagedContent = workspaces.slice(start, start + size);

          // Auto-create default if empty
          if (workspaces.length === 0) {
               await this.createWorkspace("Default Workspace", "My first workspace");
               // Recursion safe since createWorkspace updates FS
               return this.findAll(pageRequest); 
          }

          return Result.success({
              content: pagedContent,
              pageable: { pageNumber: page, pageSize: size, offset: start, paged: true, unpaged: false, sort: { sorted: true, unsorted: false, empty: false } },
              last: start + size >= totalElements,
              totalPages: Math.ceil(totalElements / size),
              totalElements,
              size,
              number: page,
              first: page === 0,
              numberOfElements: pagedContent.length,
              empty: pagedContent.length === 0,
              sort: { sorted: true, unsorted: false, empty: false }
          });

      } catch (e: any) {
          return Result.error(e.message);
      }
  }

  async findById(id: string): Promise<ServiceResult<StudioWorkspace | null>> {
      const all = await this.findAll();
      const ws = all.data?.content.find(w => w.uuid === id || w.id === id) || null;
      return Result.success(ws);
  }

  async existsById(id: string): Promise<boolean> {
      const res = await this.findById(id);
      return !!res.data;
  }

  async save(entity: Partial<StudioWorkspace>): Promise<ServiceResult<StudioWorkspace>> {
      // For Workspace, 'save' typically means update metadata since create is specialized
      if (!entity.uuid) return Result.error("UUID required for update");
      
      const docRoot = await platform.getPath('documents');
      const paths = storageConfig.workspace(entity.uuid);
      const configPath = pathUtils.join(docRoot, paths.configFile);
      
      try {
          const content = await vfs.readFile(configPath);
          const current = JSON.parse(content);
          const updated = { ...current, ...entity, updatedAt: Date.now() };
          await vfs.writeFile(configPath, JSON.stringify(updated, null, 2));
          return Result.success(updated);
      } catch (e: any) {
          return Result.error(e.message);
      }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveAll(_entities: Partial<StudioWorkspace>[]): Promise<ServiceResult<StudioWorkspace[]>> {
      throw new Error("Batch save not supported");
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
      return this.deleteWorkspace(id);
  }

  async delete(entity: StudioWorkspace): Promise<ServiceResult<void>> {
      return this.deleteWorkspace(entity.uuid);
  }
  
  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
      for(const id of ids) await this.deleteById(id);
      return Result.success(undefined);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<StudioWorkspace[]>> {
       const all = await this.findAll();
       const found = all.data?.content.filter(w => ids.includes(w.uuid)) || [];
       return Result.success(found);
  }

  async count(): Promise<number> {
      const all = await this.findAll();
      return all.data?.totalElements || 0;
  }

  // --- Specific Business Logic ---

  async createWorkspace(name: string, description?: string, icon?: string): Promise<ServiceResult<StudioWorkspace>> {
    const uuid = generateUUID();
    const docRoot = await platform.getPath('documents');
    const paths = storageConfig.workspace(uuid);
    const fullRoot = pathUtils.join(docRoot, paths.root);
    const projectsDir = pathUtils.join(docRoot, paths.projectsDir);

    try {
        await vfs.createDir(fullRoot);
        await vfs.createDir(projectsDir); 
        
        const wsData: StudioWorkspace = { 
            id: uuid, 
            uuid, 
            name, 
            description: description || '', 
            icon, 
            projects: [],
            path: fullRoot,
            createdAt: Date.now(), 
            updatedAt: Date.now() 
        };
        await vfs.writeFile(pathUtils.join(docRoot, paths.configFile), JSON.stringify(wsData, null, 2));
        
        return Result.success(wsData);
    } catch (e: any) {
        return Result.error(e.message);
    }
  }

  async createProject(
    workspaceId: string, 
    name: string, 
    type: ProjectType, 
    description: string,
    coverImage?: { data: Uint8Array, name: string }
  ): Promise<ServiceResult<StudioProject>> {
    const uuid = generateUUID();
    const docRoot = await platform.getPath('documents');
    const paths = storageConfig.project(workspaceId, uuid);
    const projectRoot = pathUtils.join(docRoot, paths.root);
    const projectsDir = pathUtils.dirname(projectRoot);

    try {
        try { await vfs.createDir(projectsDir); } catch {}

        await vfs.createDir(projectRoot);
        const assetsPath = pathUtils.join(docRoot, paths.assets);
        await vfs.createDir(assetsPath);
        await vfs.createDir(pathUtils.join(docRoot, paths.exports));
        await vfs.createDir(pathUtils.join(docRoot, paths.cache));

        let coverResource: ImageMediaResource | undefined;
        
        if (coverImage) {
            const ext = pathUtils.extname(coverImage.name) || '.png';
            const coverFileName = `cover${ext}`;
            const coverPath = pathUtils.join(assetsPath, coverFileName);
            
            await vfs.writeFileBinary(coverPath, coverImage.data);
            
            coverResource = {
                id: generateUUID(),
                uuid: generateUUID(),
                type: MediaResourceType.IMAGE,
                name: coverFileName,
                localFile: { path: coverPath },
                url: '', 
                origin: 'upload',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                size: coverImage.data.length,
                extension: ext.replace('.', '')
            };
        }

        const projectData: StudioProject = { 
            id: uuid, 
            uuid, 
            name, 
            type, 
            description, 
            workspaceId, 
            coverImage: coverResource,
            createdAt: Date.now(), 
            updatedAt: Date.now() 
        };
        await vfs.writeFile(pathUtils.join(docRoot, paths.file), JSON.stringify(projectData, null, 2));
        
        return Result.success({ ...projectData, path: projectRoot });

    } catch (e: any) {
        return Result.error(e.message);
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<ServiceResult<void>> {
      try {
          const docRoot = await platform.getPath('documents');
          const paths = storageConfig.workspace(workspaceId);
          const fullPath = pathUtils.join(docRoot, paths.root);
          await vfs.delete(fullPath);
          return Result.success(undefined);
      } catch(e: any) {
          return Result.error(e.message);
      }
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<ServiceResult<void>> {
      try {
          const docRoot = await platform.getPath('documents');
          const paths = storageConfig.project(workspaceId, projectId);
          const fullPath = pathUtils.join(docRoot, paths.root);
          await vfs.delete(fullPath);
          return Result.success(undefined);
      } catch(e: any) {
          return Result.error(e.message);
      }
  }

  async saveProject(workspaceId: string, projectData: { name: string; type: ProjectType; description: string; coverImage?: { data: Uint8Array; name: string } }): Promise<ServiceResult<StudioProject>> {
      // Delegate to the main save method logic by constructing a minimal entity
      // This is a simplified implementation - in a real scenario you'd have full project creation logic
      const uuid = generateUUID();
      const paths = storageConfig.project(workspaceId, uuid);
      const docRoot = await platform.getPath('documents');
      const projectRoot = pathUtils.join(docRoot, paths.root);
      const configPath = pathUtils.join(docRoot, paths.file);
      
      await vfs.createDir(projectRoot);
      
      const project: StudioProject = {
          id: uuid,
          uuid,
          name: projectData.name,
          type: projectData.type,
          description: projectData.description,
          workspaceId,
          createdAt: Date.now(),
          updatedAt: Date.now()
      };
      
      await vfs.writeFile(configPath, JSON.stringify(project, null, 2));
      return Result.success(project);
  }

  // Deprecated alias for compatibility, mapped to save()
  async updateWorkspace(uuid: string, name: string): Promise<ServiceResult<void>> {
      const res = await this.save({ uuid, name });
      return res.success ? Result.success(undefined) : Result.error(res.message || "Update failed");
  }
}

export const workspaceService = new WorkspaceService();

// Temporary alias for legacy component consumption
export const getWorkspaces = workspaceService.findAll.bind(workspaceService);
