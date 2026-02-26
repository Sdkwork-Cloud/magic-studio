
import { CutProject } from '../entities/magicCut.entity'
import { LocalStorageService } from '@sdkwork/react-core';

const STORAGE_KEY_MAGIC_CUT_PROJECTS = 'open_studio_magic_cut_projects_v1';

/**
 * Magic Cut Project Service
 * Handles persistence for video editing projects.
 * Independent of the Film (pre-production) module.
 */
class MagicCutProjectService extends LocalStorageService<CutProject> {
    constructor() {
        super(STORAGE_KEY_MAGIC_CUT_PROJECTS);
    }
}

export const magicCutProjectService = new MagicCutProjectService();

