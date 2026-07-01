// Canvas entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  CanvasElementType,
  CanvasExportMode,

  // Main Entities
  CanvasNodeData,
  CanvasMediaResource,
  CanvasElement,
  Viewport,
  CanvasBoard,
  CanvasSettings,
  CanvasProject,

  // Supporting Types
  SnapLine,
  ConnectionDraft,
  DraftLine,
  DropMenuState,
  MarqueeState,
  ContextMenuState,
} from '@sdkwork/magic-studio-types/canvas';

export {
  resolveCanvasMediaResourceKey,
  resolveCanvasMediaResourceUrl,
  resolveOptionalCanvasMediaResourceUrl,
} from '@sdkwork/magic-studio-types/canvas';
