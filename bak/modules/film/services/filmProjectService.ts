
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { FilmProject } from '../entities/film.entity';

const STORAGE_KEY_FILM_PROJECTS = 'open_studio_film_projects_v1';

class FilmProjectService extends LocalStorageService<FilmProject> {
    constructor() {
        super(STORAGE_KEY_FILM_PROJECTS);
    }
}

export const filmProjectService = new FilmProjectService();
