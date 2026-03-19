import type { CutTrack } from '../../entities';

type SoloTrackIdsLike = ReadonlySet<string> | readonly string[] | null | undefined;

type AudioTrackLike = Pick<CutTrack, 'id' | 'trackType' | 'muted'>;

const AUDIO_BEARING_TRACK_TYPES = new Set<CutTrack['trackType']>(['audio', 'video']);

function normalizeSoloTrackIds(soloTrackIds: SoloTrackIdsLike): ReadonlySet<string> {
  if (!soloTrackIds) return new Set<string>();
  return new Set(soloTrackIds);
}

export function isAudioBearingTrack(track: Pick<CutTrack, 'trackType'>): boolean {
  return AUDIO_BEARING_TRACK_TYPES.has(track.trackType);
}

export function resolveAudibleTrackIds(
  tracks: Iterable<AudioTrackLike>,
  soloTrackIds: SoloTrackIdsLike,
): Set<string> {
  const audioBearingTracks = Array.from(tracks).filter(isAudioBearingTrack);
  const requestedSoloTrackIds = normalizeSoloTrackIds(soloTrackIds);
  const activeSoloTrackIds = new Set(
    audioBearingTracks
      .filter((track) => requestedSoloTrackIds.has(track.id))
      .map((track) => track.id),
  );
  const hasActiveSoloTracks = activeSoloTrackIds.size > 0;

  return new Set(
    audioBearingTracks
      .filter((track) => !track.muted)
      .filter((track) => !hasActiveSoloTracks || activeSoloTrackIds.has(track.id))
      .map((track) => track.id),
  );
}
