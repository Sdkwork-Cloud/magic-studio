import { LocalStorageService } from '@sdkwork/react-core';
import { FilmProject } from '@sdkwork/react-commons';

const STORAGE_KEY_FILM_PROJECTS = 'magic_studio_film_projects_v1';
const LEGACY_STORAGE_KEYS_FILM_PROJECTS = ['open_studio_film_projects_v1'] as const;

export class FilmProjectService extends LocalStorageService<FilmProject> {
    constructor() {
        super(STORAGE_KEY_FILM_PROJECTS, LEGACY_STORAGE_KEYS_FILM_PROJECTS);
    }
}

export const filmProjectService: FilmProjectService = new FilmProjectService();
