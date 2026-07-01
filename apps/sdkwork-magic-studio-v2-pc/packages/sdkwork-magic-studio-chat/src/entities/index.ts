// Chat entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  ChatRole,
  MessageStatus,
  ChatMode,

  // Main Entities
  ChatMessage,
  ChatSession,
  ChatTranscript,
  ChatConfig,

  // Supporting Types
  ChatAgent,
  ChatAttachment,
} from '@sdkwork/magic-studio-types/chat';
