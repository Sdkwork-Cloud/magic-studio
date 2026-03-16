import type { AnyMediaResource } from '@sdkwork/react-commons';

import type { CutTrack, CutTrackType } from '../../entities/magicCut.entity';
import { ResourceTraitsFactory } from './ResourceTraitsFactory';
import { TrackFactory } from '../../services/TrackFactory';

export type ImportedDropTarget =
  | {
      kind: 'existing-track';
      groupId: string;
      trackId: string;
      trackType: CutTrackType;
    }
  | {
      kind: 'new-track';
      groupId: string;
      trackType: CutTrackType;
      insertIndex: number;
    };

export interface ImportedDropPlan {
  resourceId: string;
  start: number;
  duration: number;
  target: ImportedDropTarget;
}

export function resolveImportedDropSequence({
  resources,
  tracks,
  baseTime,
  basePlacement,
}: {
  resources: AnyMediaResource[];
  tracks: Pick<CutTrack, 'id' | 'trackType'>[];
  baseTime: number;
  basePlacement: {
    trackId: string | null;
    insertIndex: number | null;
  };
}): ImportedDropPlan[] {
  const plans: ImportedDropPlan[] = [];
  const nextStartByGroup = new Map<string, number>();
  const groupsByTrackType = new Map<CutTrackType, ImportedDropTarget>();

  const initialTrack = basePlacement.trackId
    ? tracks.find((track) => track.id === basePlacement.trackId) || null
    : null;
  const initialTrackIndex = initialTrack ? tracks.findIndex((track) => track.id === initialTrack.id) : -1;
  let nextInsertIndex =
    typeof basePlacement.insertIndex === 'number'
      ? basePlacement.insertIndex
      : initialTrackIndex >= 0
        ? initialTrackIndex + 1
        : tracks.length;

  if (initialTrack) {
    const existingTarget: ImportedDropTarget = {
      kind: 'existing-track',
      groupId: `existing:${initialTrack.id}`,
      trackId: initialTrack.id,
      trackType: initialTrack.trackType,
    };
    groupsByTrackType.set(initialTrack.trackType, existingTarget);
  }

  for (const resource of resources) {
    const traits = ResourceTraitsFactory.getTraits(resource.type);
    const duration = traits.getDefaultDuration(resource);
    const trackType = TrackFactory.inferTrackType(resource.type);

    let target = groupsByTrackType.get(trackType);
    if (!target) {
      target = {
        kind: 'new-track',
        groupId: `new:${trackType}:${nextInsertIndex}`,
        trackType,
        insertIndex: nextInsertIndex,
      };
      groupsByTrackType.set(trackType, target);
      nextInsertIndex += 1;
    }

    const start = nextStartByGroup.get(target.groupId) ?? baseTime;
    nextStartByGroup.set(target.groupId, start + duration);

    plans.push({
      resourceId: resource.id,
      start,
      duration,
      target,
    });
  }

  return plans;
}
