import { describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-magiccut', () => ({
  textRenderer: {
    measure: vi.fn(() => ({ width: 320, height: 120 })),
  },
}));

import { NodeFactory } from './nodeFactory';

describe('NodeFactory', () => {
  it('assigns stable local identities to new canvas nodes and their resources', () => {
    const imageNode = NodeFactory.create({
      type: 'image',
      x: 24,
      y: 48,
    });
    const textNode = NodeFactory.create({
      type: 'text',
      x: 96,
      y: 128,
      content: 'Storyboard title',
    });

    expect(imageNode.id).toBeNull();
    expect(imageNode.uuid).toBeTruthy();
    expect(imageNode.resource?.id).toBeNull();
    expect(imageNode.resource?.uuid).toBeTruthy();
    expect(textNode.id).toBeNull();
    expect(textNode.uuid).toBeTruthy();
    expect(textNode.resource?.id).toBeNull();
    expect(textNode.resource?.uuid).toBeTruthy();
  });
});
