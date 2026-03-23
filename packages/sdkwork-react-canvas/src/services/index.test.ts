import { describe, expect, it, vi } from 'vitest';

const directNodeFactory = {
  create: vi.fn()
};

const proxiedNodeFactory = vi.fn();

vi.mock('./nodeFactory', () => ({
  NodeFactory: directNodeFactory
}));

vi.mock('./canvasBusinessService', () => ({
  canvasBusinessService: {
    canvasService: {},
    canvasHistoryService: {},
    canvasActionService: {},
    canvasExportService: {},
    canvasToCutConverter: {},
    NodeFactory: proxiedNodeFactory,
    canvasInteractionService: {
      initializeMoveSession: vi.fn(),
      computeMoveDeltaWithSnap: vi.fn(),
      buildMoveCommitUpdates: vi.fn(),
      hasMoveCommitChanges: vi.fn(),
      computeGroupPreviewBounds: vi.fn(),
      computeConnectionPreviewPaths: vi.fn()
    },
    canvasHierarchyService: {
      collectSelectionWithHierarchyAndConnectors: vi.fn(),
      collectSelectedGroupRoots: vi.fn(),
      detachChildrenFromGroups: vi.fn(),
      detectGroupCycles: vi.fn()
    }
  }
}));

describe('services index exports', () => {
  it('re-exports the concrete NodeFactory instead of the proxied business adapter value', async () => {
    const services = await import('./index');

    expect(services.NodeFactory).toBe(directNodeFactory);
    expect(services.NodeFactory).not.toBe(proxiedNodeFactory);
    expect(typeof services.NodeFactory.create).toBe('function');
  });
});
