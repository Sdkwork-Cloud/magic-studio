const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'common.copy': 'Copy',
  'common.delete': 'Delete',
  'common.deselectAll': 'Deselect All',
  'common.paste': 'Paste',
  'common.redo': 'Redo',
  'common.selectAll': 'Select All',
  'common.undo': 'Undo',
  'export.formatBadges.bestQuality': 'Best quality',
  'export.formatBadges.compatibility': 'Compatibility',
  'export.formatBadges.unavailable': 'Unavailable',
  'export.formatBadges.recommendedHere': 'Recommended here',
  'export.formatBadges.master': 'Master',
  'export.formatDescriptions.mp4WebCodecs': 'Canonical server MP4 render is available.',
  'export.formatDescriptions.mp4MediaRecorder': 'Canonical server MP4 render is available.',
  'export.formatDescriptions.mp4Unavailable': 'MP4 render is not available in the canonical server pipeline.',
  'export.formatDescriptions.webmMediaRecorder': 'Canonical server WebM render is available.',
  'export.formatDescriptions.webmUnavailable': 'WebM render is not available in the canonical server pipeline.',
  'export.formatDescriptions.audioOnly': 'Canonical server WAV audio mixdown with host-owned artifact generation.',
  'export.runtime.noContainer': 'No canonical server render container is currently available.',
  'export.runtime.mp4WebCodecsAndWebmMediaRecorder': 'Canonical server MP4 and WebM render are available.',
  'export.runtime.mp4WebCodecsOnly': 'Canonical server MP4 render is available.',
  'export.runtime.mp4AndWebmMediaRecorder': 'Canonical server MP4 and WebM render are available.',
  'export.runtime.mp4MediaRecorderOnly': 'Canonical server MP4 render is available.',
  'export.runtime.webmMediaRecorderOnly': 'Canonical server WebM render is available.',
  'export.runtime.noSupportedFormat': 'No supported canonical server render format is currently available.',
  'export.runtime.smartHdrUnsupported': 'Smart HDR render is not supported in the canonical server pipeline.',
  'export.validation.enableVideoOrAudio': 'Enable video or audio before exporting.',
  'export.validation.audioOnlyWav': 'Audio-only export currently supports WAV only.',
  'export.validation.wavAudioOnly': 'WAV export is only available for audio-only mixdowns.',
  'export.validation.movUnavailable': 'MOV render is not available in the canonical server pipeline.',
  'resources.actions.addToFavorites': 'Add to favorites',
  'resources.actions.removeFromFavorites': 'Remove from favorites',
  'resources.defaults.effectCategory': 'Filter',
  'shortcuts.clearInOut': 'Clear In/Out',
  'shortcuts.delete': 'Delete Selected',
  'shortcuts.jumpEnd': 'Jump to End',
  'shortcuts.jumpStart': 'Jump to Start',
  'shortcuts.nudgeLeft': 'Nudge Left',
  'shortcuts.nudgeLeftBig': 'Nudge Left 10 Frames',
  'shortcuts.nudgeRight': 'Nudge Right',
  'shortcuts.nudgeRightBig': 'Nudge Right 10 Frames',
  'shortcuts.pasteInsert': 'Paste Insert',
  'shortcuts.pausePlayback': 'Pause',
  'shortcuts.playBackward': 'Play Backward',
  'shortcuts.playForward': 'Play Forward',
  'shortcuts.playPause': 'Play/Pause',
  'shortcuts.rippleDelete': 'Ripple Delete Selected',
  'shortcuts.setInPoint': 'Set In Point',
  'shortcuts.setOutPoint': 'Set Out Point',
  'shortcuts.stepBackward': 'Step Backward',
  'shortcuts.stepForward': 'Step Forward',
  'shortcuts.toggleLinkedSelection': 'Toggle Linked Selection',
  'shortcuts.toggleSkimming': 'Toggle Skimming',
  'shortcuts.toggleSnapping': 'Toggle Snapping',
  'shortcuts.toolRazor': 'Razor Tool',
  'shortcuts.toolRipple': 'Ripple Edit Tool',
  'shortcuts.toolRoll': 'Roll Edit Tool',
  'shortcuts.toolSelect': 'Selection Tool',
  'shortcuts.toolSlide': 'Slide Tool',
  'shortcuts.toolSlip': 'Slip Tool',
  'shortcuts.toolTrim': 'Trim Tool',
  'shortcuts.trimEndToPlayhead': 'Trim End to Playhead',
  'shortcuts.trimStartToPlayhead': 'Trim Start to Playhead',
  'shortcuts.zoomFit': 'Fit Timeline to View',
  'timeline.aiTrack': 'AI Track',
  'timeline.audioTrack': 'Audio Track',
  'timeline.effectTrack': 'Effect Track',
  'timeline.mainTrack': 'Main',
  'timeline.splitClip': 'Split Clip',
  'timeline.subtitleTrack': 'Subtitle Track',
  'timeline.textTrack': 'Text Track',
  'timeline.track': 'Track',
  'timeline.videoTrack': 'Video Track',
  'timeline.zoomIn': 'Zoom In',
  'timeline.zoomOut': 'Zoom Out',
};

export type MagicCutDomainTranslate = (
  key: string,
  options?: Record<string, unknown>
) => string;

const normalizeMagicCutTranslationKey = (key: string): string =>
  key.startsWith('magicCut.') ? key.slice('magicCut.'.length) : key;

const interpolateTranslation = (
  value: string,
  options?: Record<string, unknown>
): string => {
  if (!options) {
    return value;
  }

  return Object.entries(options).reduce(
    (result, [paramKey, paramValue]) =>
      result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
    value
  );
};

export function defaultMagicCutDomainTranslate(
  key: string,
  options?: Record<string, unknown>
): string {
  const normalizedKey = normalizeMagicCutTranslationKey(key);
  return interpolateTranslation(
    DEFAULT_TRANSLATIONS[normalizedKey] ?? key,
    options
  );
}

export function resolveMagicCutTranslatedText(
  key: string,
  translated: string,
  options?: Record<string, unknown>
): string {
  const normalizedKey = normalizeMagicCutTranslationKey(key);
  if (translated === key || translated === normalizedKey || translated === `magicCut.${normalizedKey}`) {
    return defaultMagicCutDomainTranslate(normalizedKey, options);
  }

  return translated;
}

export function resolveMagicCutDomainTranslate(
  translate?: MagicCutDomainTranslate
): MagicCutDomainTranslate {
  return translate ?? defaultMagicCutDomainTranslate;
}
