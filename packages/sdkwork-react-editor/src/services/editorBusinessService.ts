import { createServiceAdapterController } from '@sdkwork/react-commons';
import { editorService } from './editorService';
import { editorSessionService } from './editorSessionService';
import { projectService } from './projectService';

export interface EditorBusinessAdapter {
  editorService: typeof editorService;
  editorSessionService: typeof editorSessionService;
  projectService: typeof projectService;
}

const localEditorAdapter: EditorBusinessAdapter = {
  editorService,
  editorSessionService,
  projectService
};

const controller = createServiceAdapterController<EditorBusinessAdapter>(localEditorAdapter);

export const editorBusinessService: EditorBusinessAdapter = controller.service;
export const setEditorBusinessAdapter = controller.setAdapter;
export const getEditorBusinessAdapter = controller.getAdapter;
export const resetEditorBusinessAdapter = controller.resetAdapter;
