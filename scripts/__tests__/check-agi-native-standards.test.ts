import { describe, expect, it } from 'vitest';

import {
  STANDARD_RULES,
  evaluateContentRule,
  evaluateStandards,
} from '../check-agi-native-standards.mjs';

describe('check-agi-native-standards', () => {
  it('passes when all required patterns are present and forbidden patterns are absent', () => {
    const violations = evaluateContentRule({
      rule: {
        id: 'film-project-graph',
        description: 'film project graph normalization exists',
        file: 'packages/sdkwork-magic-studio-film/src/services/filmService.ts',
        required: ['buildFilmProjectGraph', 'normalizeFilmProject'],
        forbidden: ['return rawUrl;'],
      },
      content: `
        export const buildFilmProjectGraph = () => {};
        export const normalizeFilmProject = () => {};
      `,
    });

    expect(violations).toEqual([]);
  });

  it('reports missing required patterns and forbidden regressions', () => {
    const violations = evaluateContentRule({
      rule: {
        id: 'magiccut-project-state',
        description: 'magiccut runtime project graph preservation exists',
        file: 'packages/sdkwork-magic-studio-magiccut/src/store/projectState.ts',
        required: ['normalizeMagicCutProjectState', 'projectGraph'],
        forbidden: ['normalizeRawUrlProject'],
      },
      content: `
        export const normalizeMagicCutProjectState = () => {};
        const legacy = normalizeRawUrlProject();
      `,
    });

    expect(violations).toEqual([
      expect.stringContaining('missing required pattern "projectGraph"'),
      expect.stringContaining('contains forbidden pattern "normalizeRawUrlProject"'),
    ]);
  });

  it('evaluates a standards suite against an in-memory file set', () => {
    const result = evaluateStandards({
      readFile: (file) => {
        if (file === 'packages/sdkwork-magic-studio-types/src/base.types.ts') {
          return `
            export interface ClientEntityIdentity { uuid: string; }
            export const resolveEntityKey = () => {};
            export const entityKeysEqual = () => {};
          `;
        }
        return `
          export interface FilmProject { projectGraph?: ProjectGraphDocument; }
        `;
      },
      rules: [
        {
          id: 'identity',
          description: 'uuid-first identity exists',
          file: 'packages/sdkwork-magic-studio-types/src/base.types.ts',
          required: ['uuid: string', 'resolveEntityKey', 'entityKeysEqual'],
        },
        {
          id: 'film-project-graph',
          description: 'film root project exposes projectGraph',
          file: 'packages/sdkwork-magic-studio-types/src/film.types.ts',
          required: ['projectGraph?: ProjectGraphDocument'],
        },
      ],
    });

    expect(result.violations).toEqual([]);
    expect(result.checkedRules).toHaveLength(2);
  });

  it('tracks canvas and cover modal asset-first governance rules', () => {
    const ruleIds = STANDARD_RULES.map((rule) => rule.id);

    expect(ruleIds).toContain('asset-cover-modal-generated-outcome-persistence');
    expect(ruleIds).toContain('ai-image-modal-selection-persistence');
    expect(ruleIds).toContain('canvas-generated-outcome-resource-helper');
      expect(ruleIds).toContain('canvas-node-generated-outcome-persistence');
      expect(ruleIds).toContain('voice-service-canonical-generation-outcomes');
      expect(ruleIds).toContain('voice-store-generated-outcome-persistence');
      expect(ruleIds).toContain('voice-generated-result-persisted-provenance');
      expect(ruleIds).toContain('shared-voice-contract');
    expect(ruleIds).toContain('voicespeaker-entity-shared-reexport');
    expect(ruleIds).toContain('voice-store-uuid-first-task-matching');
    expect(ruleIds).toContain('voice-selector-uuid-first-selection');
    expect(ruleIds).toContain('voice-service-uuid-first-speaker-lookup');
    expect(ruleIds).toContain('audio-store-uuid-first-task-matching');
    expect(ruleIds).toContain('image-store-uuid-first-task-matching');
    expect(ruleIds).toContain('music-store-uuid-first-task-matching');
    expect(ruleIds).toContain('sfx-store-uuid-first-task-matching');
    expect(ruleIds).toContain('video-store-uuid-first-task-matching');
    expect(ruleIds).toContain('audio-history-service-favorite-persistence');
    expect(ruleIds).toContain('image-history-service-uuid-first-favorite');
    expect(ruleIds).toContain('sfx-history-service-uuid-first-favorite');
    expect(ruleIds).toContain('generation-history-delete-uses-task-key');
    expect(ruleIds).toContain('image-gallery-uuid-first-preview');
    expect(ruleIds).toContain('image-gallery-local-entity-import');
    expect(ruleIds).toContain('video-item-local-entity-import');
    expect(ruleIds).toContain('video-page-local-entity-import');
    expect(ruleIds).toContain('video-page-imported-result-stable-identity');
    expect(ruleIds).toContain('audio-page-imported-result-stable-identity');
    expect(ruleIds).toContain('image-upscale-result-stable-identity');
    expect(ruleIds).toContain('music-item-local-entity-import');
    expect(ruleIds).toContain('generation-history-magic-studio-types-identity-boundary');
    expect(ruleIds).toContain('generated-selection-asset-magic-studio-types-uuid');
    expect(ruleIds).toContain('generation-result-selection-task-key');
    expect(ruleIds).toContain('generated-selection-asset-task-key-metadata');
    expect(ruleIds).toContain('canvas-node-factory-stable-resource-identity');
    expect(ruleIds).toContain('canvas-converter-stable-local-identity');
    expect(ruleIds).toContain('canvas-export-import-stable-board-identity');
    expect(ruleIds).toContain('film-store-new-scene-stable-identity');
    expect(ruleIds).toContain('magiccut-detached-audio-stable-identity');
    expect(ruleIds).toContain('magiccut-template-copy-stable-identity');
    expect(ruleIds).toContain('workspace-cover-image-stable-identity');
    expect(ruleIds).toContain('notifications-fallback-stable-identity');
    expect(ruleIds).toContain('core-notification-stable-identity');
    expect(ruleIds).toContain('magiccut-store-stable-local-identity');
    expect(ruleIds).toContain('magiccut-template-entity-key-remap');
    expect(ruleIds).toContain('magiccut-caption-resource-stable-identity');
    expect(ruleIds).toContain('magiccut-player-preview-layer-stable-identity');
    expect(ruleIds).toContain('film-service-stable-local-identity');
    expect(ruleIds).toContain('canvas-service-generated-element-stable-identity');
    expect(ruleIds).toContain('canvas-store-stable-clone-identity');
    expect(ruleIds).toContain('notifications-save-local-stable-identity');
    expect(ruleIds).toContain('local-storage-stable-generated-identity');
    expect(ruleIds).toContain('browser-history-stable-identity');
    expect(ruleIds).toContain('browser-bookmark-stable-identity');
    expect(ruleIds).toContain('drive-metadata-stable-identity');
    expect(ruleIds).toContain('editor-file-entry-stable-identity');
    expect(ruleIds).toContain('prompt-types-uuid-contract');
    expect(ruleIds).toContain('prompt-service-result-stable-identity');
    expect(ruleIds).toContain('prompt-store-uuid-first-identity');
    expect(ruleIds).toContain('upload-import-data-uuid-contract');
    expect(ruleIds).toContain('upload-generation-modal-shared-import-contract');
    expect(ruleIds).toContain('image-page-import-mapper');
    expect(ruleIds).toContain('video-page-import-mapper');
    expect(ruleIds).toContain('audio-page-import-mapper');
    expect(ruleIds).toContain('chat-types-uuid-contract');
    expect(ruleIds).toContain('chat-service-stable-identity-helpers');
    expect(ruleIds).toContain('chat-hydration-uuid-first-lookup');
    expect(ruleIds).toContain('chat-store-uuid-first-session-key');
    expect(ruleIds).toContain('chat-sidebar-uuid-first-selection');
    expect(ruleIds).toContain('embedded-chat-pane-uuid-first-selection');
    expect(ruleIds).toContain('chat-page-uuid-first-message-key');
    expect(ruleIds).toContain('chat-message-list-uuid-first-message-key');
    expect(ruleIds).toContain('chatppt-types-uuid-contract');
    expect(ruleIds).toContain('chatppt-service-stable-nested-identity');
    expect(ruleIds).toContain('chatppt-store-uuid-first-presentation-key');
    expect(ruleIds).toContain('chatppt-explorer-uuid-first-selection');
    expect(ruleIds).toContain('chatppt-preview-uuid-first-render-keys');
    expect(ruleIds).toContain('image-generated-result-builder-contract');
    expect(ruleIds).toContain('generation-preview-image-editor-asset-contract');
    expect(ruleIds).toContain('image-canvas-editor-asset-contract');
    expect(ruleIds).toContain('image-canvas-editor-modal-asset-contract');
    expect(ruleIds).toContain('image-grid-editor-asset-contract');
    expect(ruleIds).toContain('image-grid-editor-modal-asset-contract');
    expect(ruleIds).toContain('image-store-upscale-asset-contract');
    expect(ruleIds).toContain('local-storage-null-id-preservation');
    expect(ruleIds).toContain('image-task-client-identity-contract');
    expect(ruleIds).toContain('image-import-task-null-id');
    expect(ruleIds).toContain('image-store-null-id-task-creation');
    expect(ruleIds).toContain('generation-selection-nullable-task-id');
    expect(ruleIds).toContain('audio-import-task-null-id');
    expect(ruleIds).toContain('video-import-task-null-id');
    expect(ruleIds).toContain('audio-store-null-id-task-creation');
    expect(ruleIds).toContain('video-store-null-id-task-creation');
    expect(ruleIds).toContain('video-store-null-id-upsert');
    expect(ruleIds).toContain('music-store-null-id-task-creation');
    expect(ruleIds).toContain('sfx-store-null-id-task-creation');
    expect(ruleIds).toContain('voice-store-null-id-task-creation');
    expect(ruleIds).toContain('voice-service-null-id-task-factory');
    expect(ruleIds).toContain('voice-task-primary-result-contract');
    expect(ruleIds).toContain('video-history-null-id-preservation');
    expect(ruleIds).toContain('music-history-null-id-preservation');
    expect(ruleIds).toContain('magiccut-drag-overlay-asset-first-preview-source');
    expect(ruleIds).toContain('magiccut-ref-uuid-first-lookup-helper');
    expect(ruleIds).toContain('magiccut-nested-client-identity-builders');
    expect(ruleIds).toContain('magiccut-default-project-stable-local-identity');
    expect(ruleIds).toContain('magiccut-template-uuid-first-ref-lookups');
    expect(ruleIds).toContain('magiccut-detach-audio-uuid-first-state-lookups');
    expect(ruleIds).toContain('magiccut-audio-effect-null-id-config');
    expect(ruleIds).toContain('magiccut-store-local-marker-keyframe-builders');
    expect(ruleIds).toContain('magiccut-keyframe-editor-uuid-first-selection');
    expect(ruleIds).toContain('magiccut-store-state-identity-helper');
    expect(ruleIds).toContain('magiccut-store-uuid-first-state-access');
    expect(ruleIds).toContain('magiccut-linked-selection-uuid-first-canonicalization');
  });
});
