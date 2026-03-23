import type { CanvasElement } from '../entities';

export const DEFAULT_GROUP_PADDING = 20;

const buildElementMap = (elements: CanvasElement[]): Map<string, CanvasElement> => {
  const elementMap = new Map<string, CanvasElement>();
  elements.forEach((element) => {
    elementMap.set(element.id, element);
  });
  return elementMap;
};

const getGroupDepth = (elementMap: Map<string, CanvasElement>, groupId: string): number => {
  let depth = 0;
  let currentParentId = elementMap.get(groupId)?.groupId;
  const visited = new Set<string>();

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);
    depth += 1;
    currentParentId = elementMap.get(currentParentId)?.groupId;
  }

  return depth;
};

export const collectAncestorGroupIds = (
  elements: CanvasElement[],
  elementIds: Iterable<string>
): string[] => {
  const elementMap = buildElementMap(elements);
  const ancestors: string[] = [];
  const seen = new Set<string>();

  Array.from(elementIds).forEach((elementId) => {
    let parentId = elementMap.get(elementId)?.groupId;
    const visited = new Set<string>();

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      if (!seen.has(parentId)) {
        seen.add(parentId);
        ancestors.push(parentId);
      }
      parentId = elementMap.get(parentId)?.groupId;
    }
  });

  return ancestors;
};

export const fitGroupsToChildren = (
  elements: CanvasElement[],
  groupIds: Iterable<string>,
  padding = DEFAULT_GROUP_PADDING
): boolean => {
  const elementMap = buildElementMap(elements);
  const orderedGroupIds = Array.from(new Set(groupIds)).sort(
    (left, right) => getGroupDepth(elementMap, right) - getGroupDepth(elementMap, left)
  );

  let hasChanges = false;

  orderedGroupIds.forEach((groupId) => {
    const group = elementMap.get(groupId);
    if (!group || group.type !== 'group' || !group.groupChildren || group.groupChildren.length === 0) {
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasChild = false;

    group.groupChildren.forEach((childId) => {
      const child = elementMap.get(childId);
      if (!child) {
        return;
      }

      hasChild = true;
      minX = Math.min(minX, child.x);
      minY = Math.min(minY, child.y);
      maxX = Math.max(maxX, child.x + child.width);
      maxY = Math.max(maxY, child.y + child.height);
    });

    if (!hasChild) {
      return;
    }

    const nextX = minX - padding;
    const nextY = minY - padding;
    const nextWidth = maxX - minX + padding * 2;
    const nextHeight = maxY - minY + padding * 2;

    if (
      group.x !== nextX ||
      group.y !== nextY ||
      group.width !== nextWidth ||
      group.height !== nextHeight
    ) {
      group.x = nextX;
      group.y = nextY;
      group.width = nextWidth;
      group.height = nextHeight;
      hasChanges = true;
    }
  });

  return hasChanges;
};
