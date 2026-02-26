// Base type definitions
// This is the foundation for all entities in the SDKWork React application

// ============================================================================
// Base Entity Type - This is the foundation for all entities
// ============================================================================

export interface BaseEntity {
  /**
   * Database ID - only available after saving to database
   * This is assigned by the database (auto-increment or sequence)
   */
  id: string;

  /**
   * UUID - Universally Unique Identifier
   * Can be assigned by both client and server
   * Immutable once created, used for cross-system identification
   */
  uuid: string;

  /**
   * Creation timestamp in ISO 8601 format (yyyy-MM-dd HH:mm:ss)
   */
  createdAt: string;

  /**
   * Last update timestamp in ISO 8601 format (yyyy-MM-dd HH:mm:ss)
   */
  updatedAt: string;

  /**
   * Soft delete timestamp in ISO 8601 format (yyyy-MM-dd HH:mm:ss)
   * Only present if the entity has been soft deleted
   */
  deletedAt?: string;
}

// ============================================================================
// Note: All other types have been moved to dedicated files:
// - common.types.ts - Common types (ServiceResult, Page, User, etc.)
// - media.types.ts - MediaResource types
// - infrastructure.types.ts - Infrastructure types (FileSystem, Rendering, etc.)
// - film.types.ts - Film types
// - video.types.ts - Video types
// - audio.types.ts - Audio types
// - music.types.ts - Music types
// - sfx.types.ts - SFX types
// - image.types.ts - Image types
// - canvas.types.ts - Canvas types
// - magiccut.types.ts - MagicCut types
// - assets.types.ts - Assets types
// - character.types.ts - Character types
// - chat.types.ts - Chat types
// - chatppt.types.ts - ChatPPT types
// - notes.types.ts - Notes types
//
// Please import from the specific file or from the package root:
//   import { SomeType } from '@sdkwork/react-types';
// ============================================================================
