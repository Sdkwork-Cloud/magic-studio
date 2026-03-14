import { createServiceAdapterController } from '@sdkwork/react-commons';
import { skillsService, type SkillsService } from './skillsService';

export type SkillsBusinessAdapter = SkillsService;

const controller = createServiceAdapterController<SkillsBusinessAdapter>(
  skillsService
);

export const skillsBusinessService: SkillsBusinessAdapter = controller.service;
export const setSkillsBusinessAdapter = controller.setAdapter;
export const getSkillsBusinessAdapter = controller.getAdapter;
export const resetSkillsBusinessAdapter = controller.resetAdapter;
