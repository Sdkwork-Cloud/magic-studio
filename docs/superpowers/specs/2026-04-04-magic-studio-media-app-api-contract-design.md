# Magic Studio Media App API Contract Design

**Scope**

- include: `image`, `audio`, `video`, `character`, `film`, `upload`, `assets`, `asset-center`
- exclude: `notes`, `drive`, `voice-speaker`

**Design Goals**

- every response model has top-level `id` and `uuid`
- client logic uses `uuid` first and falls back to non-empty `id`
- AI-generated outputs are asset-backed resources, not raw URL-only payloads
- all generated image, audio, video, character, and film outputs land in unified `asset-center`
- frontend remote business uses `useAppSdkClient -> @sdkwork/app-sdk -> spring-ai-plus-app-api`

## Global Models

```json
{
  "BaseIdentity": {
    "id": "string|null",
    "uuid": "string"
  },
  "MediaIdentityRef": {
    "assetId": "string|null",
    "assetUuid": "string|null",
    "primaryResourceId": "string|null",
    "primaryResourceUuid": "string|null",
    "resourceViewId": "string|null",
    "resourceViewUuid": "string|null"
  },
  "GeneratedMediaResource": {
    "id": "string|null",
    "uuid": "string",
    "type": "image|audio|video|character",
    "assetId": "string|null",
    "assetUuid": "string|null",
    "primaryResourceId": "string|null",
    "primaryResourceUuid": "string|null",
    "resourceViewId": "string|null",
    "resourceViewUuid": "string|null",
    "name": "string|null",
    "mimeType": "string|null",
    "width": "number|null",
    "height": "number|null",
    "duration": "number|null",
    "delivery": {
      "url": "string",
      "thumbnailUrl": "string|null",
      "storageMode": "remote-url|tauri-fs|browser-vfs|hybrid"
    },
    "generation": {
      "taskId": "string",
      "taskUuid": "string",
      "product": "image|audio|video|character",
      "mode": "string",
      "prompt": "string|null",
      "negativePrompt": "string|null",
      "provider": "string|null",
      "providerModel": "string|null",
      "parameters": "object|null"
    },
    "metadata": "object|null"
  },
  "GenerationTaskResponse": {
    "id": "string",
    "uuid": "string",
    "taskId": "string",
    "requestId": "string|null",
    "idempotencyKey": "string|null",
    "type": "IMAGE|AUDIO|VIDEO|CHARACTER|FILM",
    "status": "PENDING|PROCESSING|SUCCESS|FAILED|CANCELLED",
    "progress": "number",
    "bizScene": "string|null",
    "bizId": "string|null",
    "conversationId": "string|null",
    "messageId": "string|null",
    "input": {
      "prompt": "string|null",
      "negativePrompt": "string|null",
      "model": "string|null",
      "parameters": "object|null",
      "inputRefs": "MediaIdentityRef[]|null"
    },
    "output": {
      "outputAssets": "GeneratedMediaResource[]",
      "primaryOutput": "GeneratedMediaResource|null"
    },
    "error": {
      "code": "string|null",
      "message": "string|null"
    },
    "createdAt": "string",
    "updatedAt": "string",
    "startedAt": "string|null",
    "completedAt": "string|null"
  },
  "UploadFileResponse": {
    "id": "string",
    "uuid": "string",
    "fileId": "string",
    "fileName": "string",
    "fileSize": "number",
    "fileType": "string|null",
    "extension": "string|null",
    "path": "string|null",
    "objectKey": "string|null",
    "accessUrl": "string|null",
    "assetType": "string|null",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "AssetResponse": {
    "id": "string",
    "uuid": "string",
    "assetId": "string",
    "assetName": "string",
    "assetType": "image|video|audio|music|voice|character|file",
    "status": "draft|imported|generated|processing|ready|archived|deleted",
    "primaryUrl": "string|null",
    "thumbnailUrl": "string|null",
    "coverImage": "GeneratedMediaResource|null",
    "assets": "GeneratedMediaResource[]",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "UnifiedDigitalAsset": {
    "id": "string|null",
    "uuid": "string",
    "assetId": "string",
    "key": "string",
    "title": "string",
    "description": "string|null",
    "primaryType": "image|video|audio|music|voice|text|character|file",
    "scope": {
      "workspaceId": "string",
      "projectId": "string|null",
      "collectionId": "string|null",
      "domain": "asset-center|image-studio|audio-studio|video-studio|character|film|magiccut"
    },
    "status": "draft|imported|generated|processing|ready|archived|deleted",
    "payload": {
      "assets": "GeneratedMediaResource[]"
    },
    "references": "object[]|null",
    "metadata": "object|null",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

## Shared Infrastructure APIs

```json
[
  {
    "route": "POST /app/v3/api/upload/file",
    "sdkMethod": "upload.uploadFile",
    "changeType": "MODIFY",
    "input": {
      "transport": "multipart/form-data",
      "fields": {
        "file": "binary",
        "type": "string",
        "folderId": "string|null",
        "path": "string|null"
      }
    },
    "output": "UploadFileResponse"
  },
  {
    "route": "POST /app/v3/api/upload/files",
    "sdkMethod": "upload.uploadFiles",
    "changeType": "MODIFY",
    "input": {
      "transport": "multipart/form-data",
      "fields": {
        "files": "binary[]",
        "type": "string",
        "path": "string|null"
      }
    },
    "output": {
      "files": "UploadFileResponse[]"
    }
  },
  {
    "route": "POST /app/v3/api/upload/chunk/merge",
    "sdkMethod": "upload.mergeChunks",
    "changeType": "MODIFY",
    "input": {
      "uploadId": "string"
    },
    "output": "UploadFileResponse"
  },
  {
    "route": "GET /app/v3/api/assets",
    "sdkMethod": "asset.listAssets",
    "changeType": "MODIFY",
    "input": {
      "page": "number",
      "size": "number",
      "keyword": "string|null",
      "type": "string|null",
      "folderId": "string|null"
    },
    "output": {
      "content": "AssetResponse[]",
      "page": "number",
      "size": "number",
      "totalElements": "number"
    }
  },
  {
    "route": "GET /app/v3/api/assets/{assetKey}",
    "sdkMethod": "asset.getAssetDetail",
    "changeType": "MODIFY",
    "input": {
      "assetKey": "uuid first, fallback id"
    },
    "output": "AssetResponse"
  },
  {
    "route": "DELETE /app/v3/api/assets/batch",
    "sdkMethod": "asset.batchDeleteAssets",
    "changeType": "MODIFY",
    "input": {
      "assetKeys": "string[]"
    },
    "output": {
      "success": "boolean"
    }
  },
  {
    "route": "POST /app/v3/api/asset-center/assets",
    "sdkMethod": "assetCenter.saveAsset",
    "changeType": "ADD",
    "input": "UnifiedDigitalAsset",
    "output": "UnifiedDigitalAsset"
  },
  {
    "route": "POST /app/v3/api/asset-center/assets/batch",
    "sdkMethod": "assetCenter.saveAssets",
    "changeType": "ADD",
    "input": {
      "assets": "UnifiedDigitalAsset[]"
    },
    "output": {
      "saved": "UnifiedDigitalAsset[]"
    }
  },
  {
    "route": "GET /app/v3/api/asset-center/assets/page",
    "sdkMethod": "assetCenter.queryAssets",
    "changeType": "ADD",
    "input": {
      "page": "number",
      "size": "number",
      "sort": "string[]|null",
      "keyword": "string|null",
      "types": "string[]|null",
      "origins": "string[]|null",
      "tags": "string[]|null",
      "status": "string[]|null",
      "scope": "object|null",
      "reference": "object|null",
      "includeDeleted": "boolean|null"
    },
    "output": {
      "content": "UnifiedDigitalAsset[]",
      "page": "number",
      "size": "number",
      "totalElements": "number",
      "totalPages": "number",
      "first": "boolean",
      "last": "boolean"
    }
  },
  {
    "route": "GET /app/v3/api/asset-center/assets/{assetKey}",
    "sdkMethod": "assetCenter.getAsset",
    "changeType": "ADD",
    "input": {
      "assetKey": "uuid first, fallback id"
    },
    "output": "UnifiedDigitalAsset"
  },
  {
    "route": "DELETE /app/v3/api/asset-center/assets/{assetKey}",
    "sdkMethod": "assetCenter.deleteAsset",
    "changeType": "ADD",
    "input": {
      "assetKey": "uuid first, fallback id"
    },
    "output": {
      "success": "boolean"
    }
  },
  {
    "route": "GET /app/v3/api/asset-center/assets/stats",
    "sdkMethod": "assetCenter.getStats",
    "changeType": "ADD",
    "input": {
      "scope": "object|null"
    },
    "output": {
      "totalAssets": "number",
      "totalReady": "number",
      "totalProcessing": "number",
      "totalArchived": "number",
      "totalDeleted": "number",
      "totalFavorites": "number",
      "byType": "object",
      "byDomain": "object"
    }
  }
]
```

## Image APIs

```json
[
  {
    "route": "POST /app/v3/api/generation/image",
    "sdkMethod": "generation.createGenerationImage",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "prompt": "string",
      "negativePrompt": "string|null",
      "model": "string|null",
      "aspectRatio": "string|null",
      "width": "number|null",
      "height": "number|null",
      "size": "string|null",
      "style": "string|null",
      "quality": "string|null",
      "steps": "number|null",
      "seed": "number|null",
      "referenceAssets": "MediaIdentityRef[]|null",
      "maskAssets": "MediaIdentityRef[]|null",
      "bizScene": "string|null",
      "bizId": "string|null",
      "conversationId": "string|null",
      "messageId": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  },
  {
    "route": "POST /app/v3/api/generation/image/variations",
    "sdkMethod": "generation.createVariation",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "referenceAssets": "MediaIdentityRef[]",
      "model": "string|null",
      "n": "number|null",
      "width": "number|null",
      "height": "number|null",
      "format": "string|null",
      "bizScene": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  },
  {
    "route": "POST /app/v3/api/generation/image/edits",
    "sdkMethod": "generation.editImage",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "prompt": "string",
      "negativePrompt": "string|null",
      "referenceAssets": "MediaIdentityRef[]",
      "maskAssets": "MediaIdentityRef[]|null",
      "model": "string|null",
      "strength": "number|null",
      "format": "string|null",
      "bizScene": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  },
  {
    "route": "POST /app/v3/api/generation/image/upscale",
    "sdkMethod": "generation.upscaleImage",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "referenceAssets": "MediaIdentityRef[]",
      "model": "string|null",
      "scale": "number|null",
      "targetWidth": "number|null",
      "targetHeight": "number|null",
      "format": "string|null",
      "bizScene": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  }
]
```

## Audio APIs

```json
[
  {
    "route": "POST /app/v3/api/generation/audio/tts",
    "sdkMethod": "generation.textToSpeech",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "text": "string",
      "prompt": "string|null",
      "negativePrompt": "string|null",
      "voice": "string|null",
      "model": "string|null",
      "language": "string|null",
      "speed": "number|null",
      "pitch": "number|null",
      "volume": "number|null",
      "format": "string|null",
      "emotion": "string|null",
      "referenceAssets": "MediaIdentityRef[]|null",
      "bizScene": "string|null",
      "bizId": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  }
]
```

## Video APIs

```json
[
  {
    "route": "POST /app/v3/api/generation/video",
    "sdkMethod": "generation.createGenerationVideo",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "generationType": "text|image|video|avatar|lip-sync|start_end|smart_reference|subject_ref|smart_multi|multi-image",
      "prompt": "string",
      "negativePrompt": "string|null",
      "model": "string|null",
      "duration": "string|null",
      "resolution": "string|null",
      "aspectRatio": "string|null",
      "assets": [
        {
          "role": "source_image|source_video|driver_audio|start_frame|end_frame|subject_reference|reference_1|reference_2|reference_3|reference_4|keyframe_1|keyframe_2|keyframe_3|keyframe_4",
          "type": "image|video|audio",
          "value": "string|null",
          "ref": "MediaIdentityRef|null"
        }
      ],
      "videoStyle": {
        "id": "string|null",
        "name": "string|null",
        "prompt": "string|null"
      },
      "options": "object|null",
      "bizScene": "string|null",
      "bizId": "string|null",
      "conversationId": "string|null",
      "messageId": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  }
]
```

## Character APIs

```json
[
  {
    "route": "POST /app/v3/api/generation/character",
    "sdkMethod": "generation.createGenerationCharacter",
    "changeType": "MODIFY",
    "input": {
      "clientRequestUuid": "string",
      "idempotencyKey": "string",
      "name": "string|null",
      "prompt": "string|null",
      "description": "string",
      "style": "string|null",
      "appearance": "string|null",
      "pose": "string|null",
      "expression": "string|null",
      "gender": "string|null",
      "age": "string|null",
      "clothing": "string|null",
      "width": "number|null",
      "height": "number|null",
      "format": "string|null",
      "model": "string|null",
      "referenceAssets": "MediaIdentityRef[]|null",
      "bizScene": "string|null",
      "bizId": "string|null",
      "extraParams": "object|null"
    },
    "output": "GenerationTaskResponse"
  },
  {
    "route": "POST /app/v3/api/generation/character/batch",
    "sdkMethod": "generation.batchCreate",
    "changeType": "MODIFY",
    "input": {
      "clientBatchUuid": "string",
      "idempotencyKey": "string",
      "model": "string|null",
      "bizScene": "string|null",
      "characters": "object[]"
    },
    "output": {
      "tasks": "GenerationTaskResponse[]"
    }
  },
  {
    "route": "GET /app/v3/api/generation/character/list",
    "sdkMethod": "generation.listCharacters",
    "changeType": "MODIFY",
    "input": {
      "page": "number",
      "size": "number",
      "keyword": "string|null"
    },
    "output": {
      "content": [
        {
          "id": "string",
          "uuid": "string",
          "characterId": "string",
          "name": "string",
          "description": "string|null",
          "avatar": "GeneratedMediaResource|null",
          "status": "string|null",
          "createdAt": "string",
          "updatedAt": "string"
        }
      ],
      "page": "number",
      "size": "number",
      "totalElements": "number"
    }
  },
  {
    "route": "GET /app/v3/api/generation/character/{characterKey}",
    "sdkMethod": "generation.getCharacterDetail",
    "changeType": "MODIFY",
    "input": {
      "characterKey": "uuid first, fallback id"
    },
    "output": {
      "id": "string",
      "uuid": "string",
      "characterId": "string",
      "name": "string",
      "description": "string|null",
      "avatar": "GeneratedMediaResource|null",
      "status": "string|null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
]
```

## Film APIs

```json
[
  {
    "route": "POST /app/v3/api/film/projects",
    "sdkMethod": "film.createProject",
    "changeType": "ADD",
    "input": {
      "id": "string|null",
      "uuid": "string",
      "title": "string",
      "summary": "string|null",
      "script": "string|null",
      "status": "draft|processing|ready|archived",
      "scope": {
        "workspaceId": "string",
        "projectId": "string|null"
      },
      "characters": "object[]|null",
      "locations": "object[]|null",
      "props": "object[]|null",
      "scenes": "object[]|null",
      "shots": "object[]|null",
      "assets": "MediaIdentityRef[]|null",
      "graph": "object|null",
      "metadata": "object|null"
    },
    "output": {
      "id": "string|null",
      "uuid": "string",
      "title": "string",
      "summary": "string|null",
      "script": "string|null",
      "status": "draft|processing|ready|archived",
      "graph": "object|null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  },
  {
    "route": "GET /app/v3/api/film/projects",
    "sdkMethod": "film.listProjects",
    "changeType": "ADD",
    "input": {
      "page": "number",
      "size": "number",
      "workspaceId": "string",
      "projectId": "string|null",
      "keyword": "string|null"
    },
    "output": {
      "content": "object[]",
      "page": "number",
      "size": "number",
      "totalElements": "number"
    }
  },
  {
    "route": "GET /app/v3/api/film/projects/{projectKey}",
    "sdkMethod": "film.getProject",
    "changeType": "ADD",
    "input": {
      "projectKey": "uuid first, fallback id"
    },
    "output": {
      "id": "string|null",
      "uuid": "string",
      "title": "string",
      "summary": "string|null",
      "script": "string|null",
      "status": "draft|processing|ready|archived",
      "graph": "object|null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  },
  {
    "route": "PUT /app/v3/api/film/projects/{projectKey}",
    "sdkMethod": "film.updateProject",
    "changeType": "ADD",
    "input": {
      "projectKey": "uuid first, fallback id",
      "payload": "film project aggregate payload"
    },
    "output": {
      "id": "string|null",
      "uuid": "string",
      "title": "string",
      "summary": "string|null",
      "script": "string|null",
      "status": "draft|processing|ready|archived",
      "graph": "object|null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  },
  {
    "route": "DELETE /app/v3/api/film/projects/{projectKey}",
    "sdkMethod": "film.deleteProject",
    "changeType": "ADD",
    "input": {
      "projectKey": "uuid first, fallback id"
    },
    "output": {
      "success": "boolean"
    }
  },
  {
    "route": "POST /app/v3/api/film/projects/{projectKey}/script-analysis",
    "sdkMethod": "film.analyzeScript",
    "changeType": "ADD",
    "input": {
      "requestUuid": "string",
      "projectUuid": "string",
      "script": "string",
      "analysisDepth": "basic|standard|deep",
      "extractSections": [
        "characters",
        "locations",
        "props",
        "scenes",
        "shots"
      ]
    },
    "output": {
      "id": "string|null",
      "uuid": "string",
      "projectUuid": "string",
      "characters": "object[]",
      "locations": "object[]",
      "props": "object[]",
      "scenes": "object[]",
      "shots": "object[]",
      "createdAt": "string",
      "updatedAt": "string"
    }
  },
  {
    "route": "GET /app/v3/api/film/projects/{projectKey}/graph",
    "sdkMethod": "film.getProjectGraph",
    "changeType": "ADD",
    "input": {
      "projectKey": "uuid first, fallback id"
    },
    "output": {
      "project": "object",
      "graph": "object"
    }
  },
  {
    "route": "PUT /app/v3/api/film/projects/{projectKey}/graph",
    "sdkMethod": "film.updateProjectGraph",
    "changeType": "ADD",
    "input": {
      "projectKey": "uuid first, fallback id",
      "project": "object",
      "graph": "object"
    },
    "output": {
      "project": "object",
      "graph": "object"
    }
  }
]
```

## Active Execution Order

```json
[
  "POST /app/v3/api/upload/file",
  "POST /app/v3/api/upload/files",
  "POST /app/v3/api/upload/chunk/merge",
  "GET /app/v3/api/assets",
  "GET /app/v3/api/assets/{assetKey}",
  "DELETE /app/v3/api/assets/batch",
  "POST /app/v3/api/generation/video",
  "POST /app/v3/api/generation/image",
  "POST /app/v3/api/generation/audio/tts",
  "POST /app/v3/api/generation/character",
  "POST /app/v3/api/asset-center/assets",
  "GET /app/v3/api/asset-center/assets/page",
  "POST /app/v3/api/film/projects",
  "POST /app/v3/api/film/projects/{projectKey}/script-analysis"
]
```

## Current Implementation Gate

```json
{
  "status": "ready_for_incremental_implementation",
  "rule": "before implementing each API, echo the exact input and output contract for that API in the working response, then modify code",
  "nextApi": "POST /app/v3/api/upload/file"
}
```
