import { filmBusinessService } from './filmBusinessService';
import type { FilmBusinessAdapter } from './filmBusinessService';
import type { FilmProjectService } from './filmProjectService';

export * from './filmBusinessService';
export { filmPreferencesService } from './filmPreferencesService';
export const filmService: FilmBusinessAdapter['filmService'] = filmBusinessService.filmService;
export const filmProjectService: FilmProjectService = filmBusinessService.filmProjectService;
