// MagicCut entity types
// Re-export from sdkwork-react-types to maintain backward compatibility

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
} from '@sdkwork/react-types';
