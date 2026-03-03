import { createServiceAdapterController } from '@sdkwork/react-commons';
import { canvasActionService } from './canvasActionService';
import { canvasExportService } from './canvasExportService';
import { canvasHistoryService } from './canvasHistoryService';
import {
  buildMoveCommitUpdates,
  computeConnectionPreviewPaths,
  computeGroupPreviewBounds,
  computeMoveDeltaWithSnap,
  hasMoveCommitChanges,
  initializeMoveSession
} from './canvasInteractionService';
import {
  collectSelectedGroupRoots,
  collectSelectionWithHierarchyAndConnectors,
  detachChildrenFromGroups,
  detectGroupCycles
} from './canvasHierarchyService';
import { canvasService } from './canvasService';
import { canvasToCutConverter } from './canvasToCutConverter';
import { NodeFactory } from './nodeFactory';

const canvasInteractionService = {
  initializeMoveSession,
  computeMoveDeltaWithSnap,
  buildMoveCommitUpdates,
  hasMoveCommitChanges,
  computeGroupPreviewBounds,
  computeConnectionPreviewPaths
};

const canvasHierarchyService = {
  collectSelectionWithHierarchyAndConnectors,
  collectSelectedGroupRoots,
  detachChildrenFromGroups,
  detectGroupCycles
};

export interface CanvasBusinessAdapter {
  canvasService: typeof canvasService;
  canvasHistoryService: typeof canvasHistoryService;
  canvasActionService: typeof canvasActionService;
  canvasExportService: typeof canvasExportService;
  canvasToCutConverter: typeof canvasToCutConverter;
  NodeFactory: typeof NodeFactory;
  canvasInteractionService: typeof canvasInteractionService;
  canvasHierarchyService: typeof canvasHierarchyService;
}

const localCanvasAdapter: CanvasBusinessAdapter = {
  canvasService,
  canvasHistoryService,
  canvasActionService,
  canvasExportService,
  canvasToCutConverter,
  NodeFactory,
  canvasInteractionService,
  canvasHierarchyService
};

const controller = createServiceAdapterController<CanvasBusinessAdapter>(localCanvasAdapter);

export const canvasBusinessService: CanvasBusinessAdapter = controller.service;
export const setCanvasBusinessAdapter = controller.setAdapter;
export const getCanvasBusinessAdapter = controller.getAdapter;
export const resetCanvasBusinessAdapter = controller.resetAdapter;
