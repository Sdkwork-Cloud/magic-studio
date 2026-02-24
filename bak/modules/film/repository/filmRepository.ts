import type {
  FilmProject,
} from '../entities/film.entity';

/**
 * Film Repository
 * Responsible for raw data access and persistence.
 * No complex business logic allowed here.
 * All operations go through Platform API.
 */
import { platform } from '../../../platform';

const STORAGE_KEY = 'film_projects';
const CURRENT_PROJECT_KEY = 'film_current_project';

export const filmRepository = {
  // ============================================================================
  // Project Persistence
  // ============================================================================
  
  /**
   * Save project to storage
   */
  saveProject: async (project: FilmProject): Promise<void> => {
    const projects = await filmRepository.getAllProjects();
    const index = projects.findIndex(p => p.uuid === project.uuid);
    
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    await platform.setStorage(STORAGE_KEY, JSON.stringify(projects));
    await platform.setStorage(CURRENT_PROJECT_KEY, project.uuid);
  },
  
  /**
   * Get all projects
   */
  getAllProjects: async (): Promise<FilmProject[]> => {
    const data = await platform.getStorage(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  /**
   * Get project by UUID
   */
  getProject: async (uuid: string): Promise<FilmProject | null> => {
    const projects = await filmRepository.getAllProjects();
    return projects.find(p => p.uuid === uuid) || null;
  },
  
  /**
   * Get current project
   */
  getCurrentProject: async (): Promise<FilmProject | null> => {
    const currentUuid = await platform.getStorage(CURRENT_PROJECT_KEY);
    if (!currentUuid) return null;
    return filmRepository.getProject(currentUuid);
  },
  
  /**
   * Delete project
   */
  deleteProject: async (uuid: string): Promise<void> => {
    const projects = await filmRepository.getAllProjects();
    const filtered = projects.filter(p => p.uuid !== uuid);
    await platform.setStorage(STORAGE_KEY, JSON.stringify(filtered));
  },
  
  // ============================================================================
  // Export Operations
  // ============================================================================
  
  /**
   * Export project as JSON
   */
  exportProject: async (project: FilmProject): Promise<string> => {
    return JSON.stringify(project, null, 2);
  },
  
  /**
   * Import project from JSON
   */
  importProject: async (json: string): Promise<FilmProject> => {
    return JSON.parse(json);
  },
  
  /**
   * Save file to disk
   */
  saveFile: async (data: string, filename: string): Promise<string | null> => {
    return await platform.saveFile(data, filename);
  },
  
  /**
   * Select file for import
   */
  selectFile: async (): Promise<string[]> => {
    return await platform.selectFile({ multiple: false, extensions: ['json'] });
  },
  
  /**
   * Read file content
   */
  readFile: async (path: string): Promise<string> => {
    return await platform.readFile(path);
  },
};
