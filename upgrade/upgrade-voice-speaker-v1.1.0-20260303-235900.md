# Voice Speaker SDK Upgrade Requirement (v1.1.0)

- Business module: `voice-speaker`
- Version: `v1.1.0`
- Date: `2026-03-03 23:59:00`
- Related OpenAPI: `/upgrade/upgrade-voice-speaker-v1.1.0-20260303-235900-openapi.yaml`

## 1. Background

Magic Studio has integrated voice speaker with SDK-first strategy:

1. Voice market list: SDK-first (`audio.getVoiceList`, `voiceSpeakers.listSpeakers`, `voiceSpeaker.listSpeakers`) with local fallback.
2. Voice generation: SDK-first (`audio.textToSpeech` + task polling) with local fallback.
3. Clone voice creation: SDK task submission (`voiceSpeaker.cloneSpeaker`) with local persistence fallback.

Current SDK capabilities can run baseline flow, but cannot fully support deterministic product-level clone workflow and metadata management.

## 2. Current gaps

1. Clone input only supports `sampleAudioUrl`.
- Problem: frontend commonly manages private workspace assets and only has `assetId`.
- Impact: frontend must expose temporary URL logic outside SDK contract.

2. Task result shape is not deterministic for clone workflow.
- Problem: current status response does not guarantee structured fields like `speakerId`, `previewAudioUrl`, and completion payload.
- Impact: frontend cannot reliably map clone-task -> speaker entity.

3. Missing dedicated market-voice query endpoint for consistent UX metadata.
- Problem: existing list endpoints have heterogeneous payload structures.
- Impact: frontend requires multi-endpoint merge logic and custom mapping.

4. Missing preview metadata update endpoint.
- Problem: product needs `previewText` and optional `previewAudioUrl` to support voice preview UX.
- Impact: frontend can only keep preview metadata local.

## 3. Required upgrade APIs

1. `POST /app/v3/api/generation/voice-speaker/clone-from-asset`
- Submit clone task directly by workspace `assetId`.

2. `GET /app/v3/api/generation/voice-speaker/tasks/{taskId}/result`
- Return deterministic task result payload with speaker linkage and preview audio.

3. `PATCH /app/v3/api/voice-speakers/{speakerId}/preview`
- Update `previewText` and `previewAudioUrl`.

4. `GET /app/v3/api/voice-speakers/market`
- Return unified market voice list with normalized metadata.

## 4. Acceptance criteria

1. SDK TypeScript generation includes methods for all 4 new operations.
2. All 4 operations have stable `operationId` and explicit request/response schemas.
3. Clone task result response always includes:
- `taskId`
- `status`
- `speakerId` when success
- `previewAudioUrl` when success
- `errorCode/errorMessage` when failed
4. Market list response contains normalized fields required by UI:
- `voiceId`
- `name`
- `gender`
- `language`
- `style`
- `previewAudioUrl`
- `provider`
- `avatarUrl`

## 5. Non-goals

1. No direct manual edits to generated SDK source.
2. No breaking change to existing endpoints; new capabilities are additive.
