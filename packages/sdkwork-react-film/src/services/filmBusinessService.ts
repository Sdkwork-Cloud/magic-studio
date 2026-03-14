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
export const setFilmBusinessAdapter = (adapter: FilmBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getFilmBusinessAdapter = (): FilmBusinessAdapter => {
  return controller.getAdapter();
};

export const resetFilmBusinessAdapter = (): void => {
  controller.resetAdapter();
};
