import { createServiceAdapterController } from '@sdkwork/react-commons';
import { canvasActionService, type CanvasActionServiceApi } from './canvasActionService';
import { canvasExportService } from './canvasExportService';
import { canvasHistoryService, type CanvasHistoryServiceApi } from './canvasHistoryService';
import {
  buildMoveCommitUpdates,
  type ConnectionPreviewPath,
  computeConnectionPreviewPaths,
  computeGroupPreviewBounds,
  computeMoveDeltaWithSnap,
  type MoveDeltaComputationInput,
  type MoveDeltaComputationResult,
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

export interface CanvasInteractionServiceApi {
  initializeMoveSession: typeof initializeMoveSession;
  computeMoveDeltaWithSnap: (input: MoveDeltaComputationInput) => MoveDeltaComputationResult;
  buildMoveCommitUpdates: typeof buildMoveCommitUpdates;
  hasMoveCommitChanges: typeof hasMoveCommitChanges;
  computeGroupPreviewBounds: typeof computeGroupPreviewBounds;
  computeConnectionPreviewPaths: (
    affectedConnections: Parameters<typeof computeConnectionPreviewPaths>[0],
    worldDx: number,
    worldDy: number
  ) => ConnectionPreviewPath[];
}

const canvasInteractionService: CanvasInteractionServiceApi = {
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
  canvasHistoryService: CanvasHistoryServiceApi;
  canvasActionService: CanvasActionServiceApi;
  canvasExportService: typeof canvasExportService;
  canvasToCutConverter: typeof canvasToCutConverter;
  NodeFactory: typeof NodeFactory;
  canvasInteractionService: CanvasInteractionServiceApi;
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
