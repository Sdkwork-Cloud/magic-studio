/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveAssetUrl: vi.fn(),
  duplicateSelected: vi.fn(),
  bringToFront: vi.fn(),
  sendToBack: vi.fn(),
  deleteElement: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  assetService: {
    resolveAssetUrl: mocks.resolveAssetUrl,
  },
}));

vi.mock('../store/canvasStore', () => ({
  useCanvasStore: {
    getState: () => ({
      duplicateSelected: mocks.duplicateSelected,
      bringToFront: mocks.bringToFront,
      sendToBack: mocks.sendToBack,
      deleteElement: mocks.deleteElement,
    }),
  },
}));

import { canvasActionService } from './canvasActionService';

describe('canvasActionService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('downloads image resources by resolving the canonical canvas resource locator', async () => {
    mocks.resolveAssetUrl.mockResolvedValue('https://cdn.example.com/canvas-download.png');

    const element = {
      id: null,
      uuid: 'canvas-element-uuid-1',
      type: 'image',
      x: 0,
      y: 0,
      width: 320,
      height: 180,
      resource: {
        id: null,
        uuid: 'canvas-resource-uuid-1',
        type: 'image',
        url: '',
        path: 'assets://workspace/path-only-image.png',
      },
    } as const;

    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        const elementNode = originalCreateElement(tagName, options);
        if (tagName === 'a') {
          Object.defineProperty(elementNode, 'click', {
            configurable: true,
            value: click,
          });
        }
        return elementNode;
      }) as typeof document.createElement);

    const downloadAction = canvasActionService
      .getActions(element as any)
      .find((action) => action.id === 'download');

    expect(downloadAction).toBeTruthy();

    await downloadAction?.execute({ element: element as any });

    expect(mocks.resolveAssetUrl).toHaveBeenCalledWith({
      id: undefined,
      path: 'assets://workspace/path-only-image.png',
      url: '',
    });

    const anchor = createElementSpy.mock.results
      .map((result) => result.value)
      .find((value) => value instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;

    expect(anchor?.href).toBe('https://cdn.example.com/canvas-download.png');
    expect(anchor?.download).toBe('canvas-export-canvas-element-uuid-1.png');
    expect(click).toHaveBeenCalledTimes(1);
  });
});
