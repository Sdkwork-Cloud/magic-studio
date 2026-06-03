import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import {
  createCutProject,
  createCutTimeline,
  createCutTimelineRef,
  createCutTrack,
  createCutTrackRef,
} from '@sdkwork/magic-studio-types/magiccut';

import type { CutProject, CutTrack } from '../entities';
import { TIMELINE_CONSTANTS } from '../constants';
import { i18nService } from '@sdkwork/magic-studio-i18n';
import { buildMagicCutPersistedProject } from './projectGraph';

export function createDefaultMagicCutProject(): CutProject {
  const timelineKey = generateUUID();
  const projectUuid = generateUUID();
  const defaultMainTrackUuid = generateUUID();
  const now = Date.now();

  const mainTrack: CutTrack = createCutTrack({
    id: null,
    uuid: defaultMainTrackUuid,
    trackType: 'video',
    name: 'Main Track',
    order: 0,
    isMain: true,
    clips: [],
    height: TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO,
    visible: true,
    locked: false,
    muted: false,
    volume: 1.0,
    createdAt: now,
    updatedAt: now,
  });

  const timeline = createCutTimeline({
    id: null,
    uuid: timelineKey,
    name: i18nService.t('magicCut.timeline.sequenceDefault', { index: '1' }),
    fps: 30,
    duration: 60,
    tracks: [createCutTrackRef(mainTrack)],
    createdAt: now,
    updatedAt: now,
  });

  const baseProject = createCutProject({
    id: null,
    uuid: projectUuid,
    name: 'Untitled Project',
    version: 1,
    timelines: [createCutTimelineRef(timeline)],
    mediaResources: [],
    settings: { resolution: '1920x1080', fps: 30, aspectRatio: '16:9' },
    createdAt: now,
    updatedAt: now,
    normalizedState: {
      assets: {},
      resourceViews: {},
      resources: {},
      timelines: {
        [timeline.uuid]: timeline,
      },
      tracks: { [mainTrack.uuid]: mainTrack },
      clips: {},
      layers: {},
    },
  });

  return buildMagicCutPersistedProject(
    baseProject,
    baseProject.normalizedState as Parameters<typeof buildMagicCutPersistedProject>[1]
  );
}
