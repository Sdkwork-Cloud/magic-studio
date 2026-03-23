# Magic Studio Creation Capabilities Design

**Date:** 2026-03-20

**Goal:** Provide a frontend-oriented creation capability API for Magic Studio creation chatinput so the UI can fetch channel lists, model lists, model capability metadata, video resolution/duration options, and short drama style options through SDK services.

## Context

- The creation chatinput UI in `@sdkwork/react-assets` persists `target`, `model`, `styleId`, `resolution`, and `duration`.
- Existing backend `/app/v3/api/models/**` APIs are generic directory endpoints and do not provide the aggregate response shape needed by the creation entry flow.
- Existing style management endpoints under `/app/v3/api/generation/style/**` already expose style data, but frontend needs a lightweight creation-oriented style option list embedded in the same capability response.

## Requirements

- Return the left sidebar channel list for creation targets.
- Return model lists per channel.
- Return capability data per model.
- For video-capable models, return supported resolution and duration option lists.
- For short drama / film creation, return style option lists matching the frontend `StyleOption` contract.
- Keep frontend access compliant with `prompt/execute.md`: service layer -> SDK client -> backend API.

## API Design

- Add a dedicated aggregate endpoint under `/app/v3/api/models/creation/capabilities`.
- Accept a `target` query parameter matching frontend portal targets such as `video`, `image`, `music`, `speech`, and `short_drama`.
- Response includes:
  - `target`
  - `channels[]`
  - each `channel.models[]`
  - each `model.capabilities`
  - top-level `styleOptions[]` when `target=short_drama`
- Model capabilities are primarily derived from `PlusAiModelInfo.productSupportInfo`, with defensive fallbacks from existing model fields such as multimodal and reasoning support.

## Mapping Strategy

- Map `PlusAiModelInfo.channel` to frontend sidebar channels.
- Map `PlusAiModelInfo.productSupportInfo` scene-specific sections using:
  - direct target key, for example `video` or `short_drama`
  - fallback keys such as `creation`, `film`, `default`
- Parse option arrays defensively so missing config does not break the response.
- Treat `short_drama` style options as a creation scene based on public `VIDEO` styles, with optional film/short-drama tags in `configParams` when present.

## Frontend Integration

- Add a new service in `@sdkwork/react-assets` to fetch creation capabilities from `@sdkwork/app-sdk`.
- Export normalized frontend types aligned with the creation chatinput.
- Replace hardcoded or local-only capability defaults with SDK-backed loading paths where creation entry points consume them.

## Verification

- Backend controller unit tests for target-specific capability aggregation.
- OpenAPI docs contract test to ensure the new path is published.
- SDK generation or SDK source refresh so `client.model` exposes the new operation.
- Frontend typecheck and service audit verification.
