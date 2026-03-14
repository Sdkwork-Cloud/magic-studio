import { LocalStorageService } from '@sdkwork/react-core';
import { FilmProject } from '@sdkwork/react-commons';

const STORAGE_KEY_FILM_PROJECTS = 'open_studio_film_projects_v1';

export class FilmProjectService extends LocalStorageService<FilmProject> {
    constructor() {
        super(STORAGE_KEY_FILM_PROJECTS);
    }
}

export const filmProjectService: FilmProjectService = new FilmProjectService();
