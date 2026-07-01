// MagicCut entity types
// Re-export from the focused magiccut types subpath to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  CutTrackType,
  CutLayerType,
  EasingType,
  BlendMode,
  EffectType,
  ParameterType,
  CutEditorActionType,

  // Main Entities
  CutProjectSettings,
  CutProject,
  CutTimelineRef,
  CutMediaResourceRef,
  CutTemplate,
  TemplateMetadata,
  TimelineMarker,
  CutTimeline,
  CutTrackRef,
  CutTrack,
  CutClipRef,
  CutClip,
  CutLayerRef,
  CutLayer,
  CutEditorAction,

  // Supporting Types
  AudioEffectConfig,
  ColorGradeSettings,
  CutClipTransform,
  KeyframePoint,
  KeyframeMap,
  ParameterValue,
  EffectParameterSchema,
  EffectDefinition,
  EffectKeyframe,
  EffectInstance,
  TransitionInstance,
} from '@sdkwork/magic-studio-types/magiccut';
