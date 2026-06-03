// Character entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  CharacterArchetype,
  CharacterGender,

  // Main Entities
  CharacterConfig,
  Character,
  CharacterTask,
  CharacterAvatarInputResourceRef,

  // Supporting Types
  CharacterStyle,
  CharacterMessage,
  CharacterConversation,
} from '@sdkwork/magic-studio-types/character';

export {
  createCharacterAvatarInputResourceRef,
  createCharacter,
  hasCharacterAvatarInputResourceReference,
  resolveCharacterAvatarInputResourceKey,
  resolveCharacterAvatarInputResourcePath,
  resolveCharacterAvatarInputResourceReference,
  resolveCharacterAvatarInputResourceUrl,
  resolveCharacterResourcePath,
  resolveCharacterResourceUrl,
} from '@sdkwork/magic-studio-types/character';
