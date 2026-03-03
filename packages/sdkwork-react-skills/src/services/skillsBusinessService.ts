import { createServiceAdapterController } from '@sdkwork/react-commons';

export interface SkillsBusinessAdapter {}

const localSkillsAdapter: SkillsBusinessAdapter = {};

const controller = createServiceAdapterController<SkillsBusinessAdapter>(
  localSkillsAdapter
);

export const skillsBusinessService: SkillsBusinessAdapter = controller.service;
export const setSkillsBusinessAdapter = controller.setAdapter;
export const getSkillsBusinessAdapter = controller.getAdapter;
export const resetSkillsBusinessAdapter = controller.resetAdapter;
