import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-magiccut', () => ({
  textRenderer: {
    measure: vi.fn(() => ({ width: 320, height: 120 })),
  },
}));

vi.mock('../services/canvasBusinessService', async () => {
  const hierarchy = await import('../services/canvasHierarchyService');

  return {
    canvasBusinessService: {
      canvasService: {
        save: vi.fn(),
        findById: vi.fn(),
        deleteById: vi.fn(),
      },
      canvasHierarchyService: hierarchy,
    },
  };
});

describe('canvasStore identity', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('tracks selection, cloning, and connectors by uuid-first keys for local elements', async () => {
    const { useCanvasStore } = await import('./canvasStore');
    const { NodeFactory } = await import('../services/nodeFactory');

    const imageNode = NodeFactory.create({
      type: 'image',
      x: 20,
      y: 40,
    });
    const textNode = NodeFactory.create({
      type: 'text',
      x: 200,
      y: 40,
      content: 'Storyboard',
    });

    useCanvasStore.getState().addElement(imageNode);
    useCanvasStore.getState().addElement(textNode);

    expect(useCanvasStore.getState().selectedIds.has(textNode.uuid)).toBe(true);

    useCanvasStore.getState().selectElement(imageNode.uuid, false);
    useCanvasStore.getState().duplicateSelected();

    const elementsAfterDuplicate = useCanvasStore.getState().elements;
    const duplicatedImageNode = elementsAfterDuplicate.find(
      (element) => element.type === 'image' && element.uuid !== imageNode.uuid
    );

    expect(duplicatedImageNode).toBeTruthy();
    expect(duplicatedImageNode?.id).toBeNull();
    expect(duplicatedImageNode?.uuid).toBeTruthy();
    expect(useCanvasStore.getState().selectedIds.has(String(duplicatedImageNode?.uuid))).toBe(true);

    useCanvasStore.getState().addConnection(imageNode.uuid, textNode.uuid);

    const connector = useCanvasStore
      .getState()
      .elements.find((element) => element.type === 'connector');

    expect(connector).toBeTruthy();
    expect(connector?.id).toBeNull();
    expect(connector?.uuid).toBeTruthy();
    expect(connector?.data?.connection).toEqual({
      from: imageNode.uuid,
      to: textNode.uuid,
    });
  });
});
