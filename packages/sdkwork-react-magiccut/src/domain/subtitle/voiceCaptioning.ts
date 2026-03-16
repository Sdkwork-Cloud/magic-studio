export interface VoiceCaptionCue {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VoiceCaptioningInput {
  text: string;
  duration: number;
  maxCharsPerCue?: number;
  minCueDuration?: number;
}

export interface TrackPlacement {
  id: string;
  trackType: string;
}

export interface VoiceCaptionTrackPlacement {
  trackId: string | null;
  insertIndex: number;
  shouldCreateTrack: boolean;
}

const SENTENCE_PATTERN = /[^.!?。！？]+[.!?。！？]?/g;

function normalizeScript(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitSentences(text: string): string[] {
  const matches = text.match(SENTENCE_PATTERN);
  if (!matches) return text ? [text] : [];

  return matches
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitOversizedSentence(text: string, maxCharsPerCue: number): string[] {
  if (text.length <= maxCharsPerCue) return [text];

  const words = text.split(' ').filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    const normalized = current.trim();
    if (normalized) chunks.push(normalized);
    current = '';
  };

  words.forEach((word) => {
    if (word.length > maxCharsPerCue) {
      pushCurrent();
      for (let index = 0; index < word.length; index += maxCharsPerCue) {
        chunks.push(word.slice(index, index + maxCharsPerCue));
      }
      return;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerCue) {
      pushCurrent();
      current = word;
      return;
    }

    current = candidate;
  });

  pushCurrent();

  return chunks;
}

function buildSegments(text: string, maxCharsPerCue: number): string[] {
  return splitSentences(text)
    .flatMap((sentence) => splitOversizedSentence(sentence, maxCharsPerCue))
    .filter(Boolean);
}

export function buildVoiceCaptionCues(input: VoiceCaptioningInput): VoiceCaptionCue[] {
  const normalizedText = normalizeScript(input.text);
  const duration = Number.isFinite(input.duration) ? input.duration : 0;

  if (!normalizedText || duration <= 0) {
    return [];
  }

  const maxCharsPerCue = Math.max(12, Math.floor(input.maxCharsPerCue ?? 42));
  const minCueDuration = Math.max(0, input.minCueDuration ?? 0.9);
  const segments = buildSegments(normalizedText, maxCharsPerCue);

  if (segments.length === 0) {
    return [];
  }

  const effectiveMinDuration = Math.min(minCueDuration, duration / segments.length);
  const reservedDuration = effectiveMinDuration * segments.length;
  const remainingDuration = Math.max(0, duration - reservedDuration);
  const weights = segments.map((segment) => Math.max(1, segment.replace(/\s+/g, '').length));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  let cursor = 0;

  return segments.map((segment, index) => {
    const proportionalDuration = totalWeight > 0 ? remainingDuration * (weights[index] / totalWeight) : 0;
    const nextEnd =
      index === segments.length - 1
        ? duration
        : Number((cursor + effectiveMinDuration + proportionalDuration).toFixed(3));

    const cue: VoiceCaptionCue = {
      index: index + 1,
      startTime: Number(cursor.toFixed(3)),
      endTime: Number(nextEnd.toFixed(3)),
      text: segment,
    };

    cursor = nextEnd;
    return cue;
  });
}

export function resolveVoiceCaptionTrackPlacement(
  tracks: TrackPlacement[],
  sourceTrackId: string
): VoiceCaptionTrackPlacement {
  const subtitleIndex = tracks.findIndex((track) => track.trackType === 'subtitle');
  if (subtitleIndex >= 0) {
    return {
      trackId: tracks[subtitleIndex]?.id || null,
      insertIndex: subtitleIndex,
      shouldCreateTrack: false,
    };
  }

  const sourceIndex = tracks.findIndex((track) => track.id === sourceTrackId);

  return {
    trackId: null,
    insertIndex: sourceIndex >= 0 ? sourceIndex + 1 : tracks.length,
    shouldCreateTrack: true,
  };
}
