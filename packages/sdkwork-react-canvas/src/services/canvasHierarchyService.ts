import { CanvasElement } from '../entities';

export const collectSelectionWithHierarchyAndConnectors = (
    elements: CanvasElement[],
    selectedIds: Set<string>
): CanvasElement[] => {
    if (selectedIds.size === 0) return [];

    const elementMap = new Map<string, CanvasElement>();
    elements.forEach((element) => {
        elementMap.set(element.id, element);
    });

    const includeIds = new Set<string>();
    const queue: string[] = [];

    selectedIds.forEach((id) => {
        const element = elementMap.get(id);
        if (!element) return;
        includeIds.add(id);
        if (element.type === 'group') {
            queue.push(id);
        }
    });

    const visitedGroups = new Set<string>();
    while (queue.length > 0) {
        const groupId = queue.shift();
        if (!groupId || visitedGroups.has(groupId)) continue;
        visitedGroups.add(groupId);
        const group = elementMap.get(groupId);
        if (!group || group.type !== 'group' || !group.groupChildren) continue;

        group.groupChildren.forEach((childId) => {
            const child = elementMap.get(childId);
            if (!child) return;
            if (!includeIds.has(childId)) {
                includeIds.add(childId);
            }
            if (child.type === 'group' && !visitedGroups.has(childId)) {
                queue.push(childId);
            }
        });
    }

    elements.forEach((element) => {
        if (element.type !== 'connector') return;
        const from = element.data?.connection?.from;
        const to = element.data?.connection?.to;
        if (!from || !to) return;
        if (includeIds.has(from) && includeIds.has(to)) {
            includeIds.add(element.id);
        }
    });

    return elements.filter((element) => includeIds.has(element.id));
};

export const collectSelectedGroupRoots = (state: {
    elements: CanvasElement[];
    selectedIds: Set<string>;
}): string[] => {
    if (state.selectedIds.size === 0) return [];
    const elementMap = new Map<string, CanvasElement>();
    state.elements.forEach((element) => {
        elementMap.set(element.id, element);
    });

    const candidates = Array.from(state.selectedIds).filter((id) => {
        const element = elementMap.get(id);
        return !!element && element.type !== 'connector';
    });
    const selectedSet = new Set(candidates);
    const roots: string[] = [];

    candidates.forEach((id) => {
        let parentId = elementMap.get(id)?.groupId;
        const visited = new Set<string>();
        let hasSelectedAncestor = false;
        while (parentId && !visited.has(parentId)) {
            visited.add(parentId);
            if (selectedSet.has(parentId)) {
                hasSelectedAncestor = true;
                break;
            }
            parentId = elementMap.get(parentId)?.groupId;
        }
        if (!hasSelectedAncestor) {
            roots.push(id);
        }
    });

    return roots;
};

export const detachChildrenFromGroups = (draft: CanvasElement[], childIds: Set<string>): void => {
    draft.forEach((element) => {
        if (element.type !== 'group' || !element.groupChildren || element.groupChildren.length === 0) return;
        element.groupChildren = element.groupChildren.filter((childId) => !childIds.has(childId));
    });
};

export const detectGroupCycles = (elements: CanvasElement[]): string[] => {
    const groupById = new Map<string, CanvasElement>();
    elements.forEach((element) => {
        if (element.type === 'group') {
            groupById.set(element.id, element);
        }
    });

    const cycles: string[] = [];
    const cycleKeys = new Set<string>();
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfsGroup = (groupId: string, path: string[]): void => {
        if (visiting.has(groupId)) {
            const cycleStart = path.indexOf(groupId);
            const cyclePath = cycleStart >= 0 ? [...path.slice(cycleStart), groupId] : [...path, groupId];
            const cycleKey = cyclePath.join('->');
            if (!cycleKeys.has(cycleKey)) {
                cycleKeys.add(cycleKey);
                cycles.push(cyclePath.join(' -> '));
            }
            return;
        }
        if (visited.has(groupId)) return;

        visiting.add(groupId);
        const nextPath = [...path, groupId];
        const group = groupById.get(groupId);
        if (group?.groupChildren) {
            group.groupChildren.forEach((childId) => {
                if (groupById.has(childId)) {
                    dfsGroup(childId, nextPath);
                }
            });
        }
        visiting.delete(groupId);
        visited.add(groupId);
    };

    groupById.forEach((_group, groupId) => {
        dfsGroup(groupId, []);
    });

    return cycles;
};
