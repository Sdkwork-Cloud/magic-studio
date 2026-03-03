import { createServiceAdapterController } from '@sdkwork/react-commons';
import { filmProjectService } from './filmProjectService';
import { filmService } from './filmService';

export interface FilmBusinessAdapter {
  filmService: typeof filmService;
  filmProjectService: typeof filmProjectService;
}

const localFilmAdapter: FilmBusinessAdapter = {
  filmService,
  filmProjectService
};

const controller = createServiceAdapterController<FilmBusinessAdapter>(localFilmAdapter);

export const filmBusinessService: FilmBusinessAdapter = controller.service;
export const setFilmBusinessAdapter = controller.setAdapter;
export const getFilmBusinessAdapter = controller.getAdapter;
export const resetFilmBusinessAdapter = controller.resetAdapter;
