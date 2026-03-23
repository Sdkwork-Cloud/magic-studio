import { describe, expect, it } from 'vitest';
import {
  collectAncestorGroupIds,
  fitGroupsToChildren
} from './canvasGroupGeometry';
import type { CanvasElement } from '../entities';

const makeElement = (overrides: Partial<CanvasElement> & Pick<CanvasElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height'>): CanvasElement =>
  ({
    color: '#000',
    data: {},
    selected: false,
    ...overrides
  }) as CanvasElement;

describe('canvas group geometry helpers', () => {
  it('collects all ancestor groups for changed elements', () => {
    const elements = [
      makeElement({ id: 'root', type: 'group', x: 0, y: 0, width: 300, height: 300, groupChildren: ['child-group'] }),
      makeElement({ id: 'child-group', type: 'group', x: 20, y: 20, width: 200, height: 200, groupId: 'root', groupChildren: ['leaf'] }),
      makeElement({ id: 'leaf', type: 'note', x: 40, y: 50, width: 80, height: 90, groupId: 'child-group' })
    ];

    expect(collectAncestorGroupIds(elements, ['leaf'])).toEqual(['child-group', 'root']);
  });

  it('re-fits nested groups from inner to outer bounds', () => {
    const elements = [
      makeElement({ id: 'root', type: 'group', x: 0, y: 0, width: 50, height: 50, groupChildren: ['child-group'] }),
      makeElement({ id: 'child-group', type: 'group', x: 0, y: 0, width: 50, height: 50, groupId: 'root', groupChildren: ['leaf'] }),
      makeElement({ id: 'leaf', type: 'note', x: 100, y: 120, width: 80, height: 40, groupId: 'child-group' })
    ];

    const changed = fitGroupsToChildren(elements, ['child-group', 'root'], 20);

    expect(changed).toBe(true);
    expect(elements.find((element) => element.id === 'child-group')).toMatchObject({
      x: 80,
      y: 100,
      width: 120,
      height: 80
    });
    expect(elements.find((element) => element.id === 'root')).toMatchObject({
      x: 60,
      y: 80,
      width: 160,
      height: 120
    });
  });

  it('ignores unrelated groups when refitting specific ancestors', () => {
    const elements = [
      makeElement({ id: 'root', type: 'group', x: 0, y: 0, width: 50, height: 50, groupChildren: ['leaf'] }),
      makeElement({ id: 'leaf', type: 'note', x: 20, y: 30, width: 40, height: 50, groupId: 'root' }),
      makeElement({ id: 'other-group', type: 'group', x: 300, y: 300, width: 90, height: 90, groupChildren: ['other-leaf'] }),
      makeElement({ id: 'other-leaf', type: 'note', x: 330, y: 320, width: 20, height: 20, groupId: 'other-group' })
    ];

    fitGroupsToChildren(elements, ['root'], 20);

    expect(elements.find((element) => element.id === 'root')).toMatchObject({
      x: 0,
      y: 10,
      width: 80,
      height: 90
    });
    expect(elements.find((element) => element.id === 'other-group')).toMatchObject({
      x: 300,
      y: 300,
      width: 90,
      height: 90
    });
  });
});
