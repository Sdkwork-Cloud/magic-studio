import { CanvasElement, SnapLine, Viewport } from '../entities';
import { calculateSnap } from '../utils/snapping';
import { getSmartPath } from '../utils/smartPath';

export interface MoveElementStartPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    groupId?: string;
}

export interface AffectedConnection {
    id: string;
    source: CanvasElement;
    target: CanvasElement;
    sourceMoving: boolean;
    targetMoving: boolean;
}

export interface MoveSessionInitializationResult {
    initialPositions: Map<string, MoveElementStartPosition>;
    parentGroups: Set<string>;
    affectedConnections: AffectedConnection[];
}

interface RectQuery {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PointDelta {
    x: number;
    y: number;
}

interface MoveDeltaComputationInput {
    pointerDelta: PointDelta;
    viewport: Viewport;
    viewportSize: { width: number; height: number };
    selectedCount: number;
    initialPositions: Map<string, MoveElementStartPosition>;
    queryElementsInRect: (rect: RectQuery) => CanvasElement[];
}

export interface MoveDeltaComputationResult {
    worldDx: number;
    worldDy: number;
    snapLines: SnapLine[];
}

interface GroupBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ConnectionPreviewPath {
    id: string;
    path: string;
}

export const initializeMoveSession = (
    elements: CanvasElement[],
    selectedIds: Set<string>
): MoveSessionInitializationResult => {
    const nodesToMove = new Set<string>();
    const parentGroups = new Set<string>();
    const initialPositions = new Map<string, MoveElementStartPosition>();
    const affectedConnections: AffectedConnection[] = [];

    const elementById = new Map<string, CanvasElement>();
    elements.forEach((element) => {
        elementById.set(element.id, element);
    });

    const collectNodesRecursively = (ids: Set<string>): void => {
        ids.forEach((id) => {
            if (nodesToMove.has(id)) return;
            nodesToMove.add(id);
            const element = elementById.get(id);
            if (!element) return;
            if (element.groupId) {
                parentGroups.add(element.groupId);
            }
            if (element.type === 'group' && element.groupChildren) {
                collectNodesRecursively(new Set(element.groupChildren));
            }
        });
    };

    collectNodesRecursively(selectedIds);

    nodesToMove.forEach((id) => {
        if (parentGroups.has(id)) {
            parentGroups.delete(id);
        }
    });

    elements.forEach((element) => {
        if (nodesToMove.has(element.id)) {
            initialPositions.set(element.id, {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                groupId: element.groupId
            });
        }
    });

    elements.forEach((element) => {
        if (element.type !== 'connector') return;
        const from = element.data?.connection?.from;
        const to = element.data?.connection?.to;
        if (!from || !to) return;
        if (!nodesToMove.has(from) && !nodesToMove.has(to)) return;
        const source = elementById.get(from);
        const target = elementById.get(to);
        if (!source || !target) return;
        affectedConnections.push({
            id: element.id,
            source,
            target,
            sourceMoving: nodesToMove.has(from),
            targetMoving: nodesToMove.has(to)
        });
    });

    return {
        initialPositions,
        parentGroups,
        affectedConnections
    };
};

const toSnapLines = (
    rawLines: Array<{ type: 'horizontal' | 'vertical'; position: number; start: number; end: number }>
): SnapLine[] => {
    return rawLines.map((line, index) => ({
        id: `${line.type}-${Math.round(line.position)}-${index}`,
        ...line
    }));
};

export const computeMoveDeltaWithSnap = (
    input: MoveDeltaComputationInput
): MoveDeltaComputationResult => {
    const { pointerDelta, viewport, viewportSize, selectedCount, initialPositions, queryElementsInRect } = input;
    let worldDx = pointerDelta.x / viewport.zoom;
    let worldDy = pointerDelta.y / viewport.zoom;

    if (selectedCount !== 1 || initialPositions.size === 0) {
        return { worldDx, worldDy, snapLines: [] };
    }

    const leadId = initialPositions.keys().next().value as string | undefined;
    if (!leadId) {
        return { worldDx, worldDy, snapLines: [] };
    }

    const startPos = initialPositions.get(leadId);
    if (!startPos) {
        return { worldDx, worldDy, snapLines: [] };
    }

    const proposedX = startPos.x + worldDx;
    const proposedY = startPos.y + worldDy;
    const visibleRect: RectQuery = {
        x: -viewport.x / viewport.zoom,
        y: -viewport.y / viewport.zoom,
        width: viewportSize.width / viewport.zoom,
        height: viewportSize.height / viewport.zoom
    };

    const movingIds = new Set(initialPositions.keys());
    const rawCandidates = queryElementsInRect(visibleRect);
    const snapCandidates = rawCandidates.filter((element) => {
        return !movingIds.has(element.id) && element.type !== 'connector';
    });

    const snapResult = calculateSnap(
        { x: proposedX, y: proposedY, width: startPos.width, height: startPos.height, id: leadId },
        snapCandidates
    );

    worldDx = snapResult.x - startPos.x;
    worldDy = snapResult.y - startPos.y;

    return {
        worldDx,
        worldDy,
        snapLines: toSnapLines(snapResult.lines)
    };
};

export const buildMoveCommitUpdates = (
    initialPositions: Map<string, MoveElementStartPosition>,
    worldDx: number,
    worldDy: number
): { id: string; x: number; y: number }[] => {
    const updates: { id: string; x: number; y: number }[] = [];
    initialPositions.forEach((startPos, id) => {
        updates.push({
            id,
            x: Math.round(startPos.x + worldDx),
            y: Math.round(startPos.y + worldDy)
        });
    });
    return updates;
};

export const hasMoveCommitChanges = (
    initialPositions: Map<string, MoveElementStartPosition>,
    updates: Array<{ id: string; x: number; y: number }>
): boolean => {
    return updates.some((update) => {
        const initial = initialPositions.get(update.id);
        if (!initial) return true;
        return initial.x !== update.x || initial.y !== update.y;
    });
};

export const computeGroupPreviewBounds = (
    elements: CanvasElement[],
    parentGroupIds: Set<string>,
    initialPositions: Map<string, MoveElementStartPosition>,
    worldDx: number,
    worldDy: number,
    padding = 20
): Map<string, GroupBounds> => {
    const boundsByGroup = new Map<string, GroupBounds>();
    if (parentGroupIds.size === 0) return boundsByGroup;

    const elementById = new Map<string, CanvasElement>();
    elements.forEach((element) => {
        elementById.set(element.id, element);
    });

    parentGroupIds.forEach((groupId) => {
        const group = elementById.get(groupId);
        if (!group || !group.groupChildren || group.groupChildren.length === 0) return;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        group.groupChildren.forEach((childId) => {
            const movingChild = initialPositions.get(childId);
            if (movingChild) {
                minX = Math.min(minX, movingChild.x + worldDx);
                minY = Math.min(minY, movingChild.y + worldDy);
                maxX = Math.max(maxX, movingChild.x + worldDx + movingChild.width);
                maxY = Math.max(maxY, movingChild.y + worldDy + movingChild.height);
                return;
            }

            const staticChild = elementById.get(childId);
            if (!staticChild) return;
            minX = Math.min(minX, staticChild.x);
            minY = Math.min(minY, staticChild.y);
            maxX = Math.max(maxX, staticChild.x + staticChild.width);
            maxY = Math.max(maxY, staticChild.y + staticChild.height);
        });

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return;
        }

        boundsByGroup.set(groupId, {
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + (padding * 2),
            height: (maxY - minY) + (padding * 2)
        });
    });

    return boundsByGroup;
};

export const computeConnectionPreviewPaths = (
    affectedConnections: AffectedConnection[],
    worldDx: number,
    worldDy: number
): ConnectionPreviewPath[] => {
    return affectedConnections.map((connection) => {
        const sourceX = connection.source.x + (connection.sourceMoving ? worldDx : 0);
        const sourceY = connection.source.y + (connection.sourceMoving ? worldDy : 0);
        const targetX = connection.target.x + (connection.targetMoving ? worldDx : 0);
        const targetY = connection.target.y + (connection.targetMoving ? worldDy : 0);
        return {
            id: connection.id,
            path: getSmartPath(
                sourceX,
                sourceY,
                connection.source.width,
                connection.source.height,
                targetX,
                targetY,
                connection.target.width,
                connection.target.height
            )
        };
    });
};
