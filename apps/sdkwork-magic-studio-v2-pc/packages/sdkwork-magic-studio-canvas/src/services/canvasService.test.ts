import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./canvasHistoryService', () => ({
  canvasHistoryService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    existsById: vi.fn(),
    save: vi.fn(),
    saveAll: vi.fn(),
    deleteById: vi.fn(),
    delete: vi.fn(),
    deleteAll: vi.fn(),
    findAllById: vi.fn(),
    count: vi.fn(),
  },
}));

import { canvasService } from './canvasService';

describe('CanvasService.generateElementsFromPrompt', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('assigns stable local identities to generated elements and resources', async () => {
    vi.useFakeTimers();

    const promise = canvasService.generateElementsFromPrompt('brainstorm notes', 0);
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    for (const element of result.data || []) {
      expect(element.id).toBeNull();
      expect(element.uuid).toBeTruthy();
      if (element.resource) {
        expect(element.resource.id).toBeNull();
        expect(element.resource.uuid).toBeTruthy();
      }
    }
  });
});
