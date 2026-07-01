import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioServerClient,
  MagicStudioVoiceListQuery,
  MagicStudioVoicePreviewRequest,
  MagicStudioVoiceSpeaker,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeMarketVoiceQuery = NonNullable<
  Parameters<MagicStudioServerClient['listMarketVoices']>[0]
>;
type RuntimeMarketVoiceList = Awaited<
  ReturnType<MagicStudioServerClient['listMarketVoices']>
>;
type RuntimeWorkspaceVoiceQuery = NonNullable<
  Parameters<MagicStudioServerClient['listWorkspaceVoices']>[0]
>;
type RuntimeWorkspaceVoiceList = Awaited<
  ReturnType<MagicStudioServerClient['listWorkspaceVoices']>
>;
type RuntimeCustomVoiceQuery = NonNullable<
  Parameters<MagicStudioServerClient['listCustomVoices']>[0]
>;
type RuntimeCustomVoiceList = Awaited<
  ReturnType<MagicStudioServerClient['listCustomVoices']>
>;
type RuntimeReadVoiceEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readVoiceSpeaker']>
>;
type RuntimePreviewRequest =
  Parameters<MagicStudioServerClient['updateVoicePreview']>[1];
type RuntimePreviewEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateVoicePreview']>
>;

const runtimeMarketVoiceQueryMatchesServerType: AssertAssignable<
  RuntimeMarketVoiceQuery,
  MagicStudioVoiceListQuery
> = true;
const runtimeMarketVoiceListMatchesServerType: AssertAssignable<
  RuntimeMarketVoiceList,
  MagicStudioApiListEnvelope<MagicStudioVoiceSpeaker>
> = true;
const runtimeWorkspaceVoiceQueryMatchesServerType: AssertAssignable<
  RuntimeWorkspaceVoiceQuery,
  MagicStudioVoiceListQuery
> = true;
const runtimeWorkspaceVoiceListMatchesServerType: AssertAssignable<
  RuntimeWorkspaceVoiceList,
  MagicStudioApiListEnvelope<MagicStudioVoiceSpeaker>
> = true;
const runtimeCustomVoiceQueryMatchesServerType: AssertAssignable<
  RuntimeCustomVoiceQuery,
  MagicStudioVoiceListQuery
> = true;
const runtimeCustomVoiceListMatchesServerType: AssertAssignable<
  RuntimeCustomVoiceList,
  MagicStudioApiListEnvelope<MagicStudioVoiceSpeaker>
> = true;
const runtimeReadVoiceEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadVoiceEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>
> = true;
const runtimePreviewRequestMatchesServerType: AssertAssignable<
  RuntimePreviewRequest,
  MagicStudioVoicePreviewRequest
> = true;
const runtimePreviewEnvelopeMatchesServerType: AssertAssignable<
  RuntimePreviewEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>
> = true;

const validVoiceSpeaker = {
  id: 'speaker-kore',
  uuid: 'speaker-kore',
  source: 'market',
  name: 'Kore',
  gender: 'female',
  style: 'narration',
  language: 'en-US',
  provider: 'minimax',
  providerVoiceId: 'kore',
  previewUrl: 'https://cdn.example.com/kore.wav',
  previewText: 'Hello from the clone preview',
  avatarUrl: 'https://cdn.example.com/kore.png',
  description: 'Warm narrator voice',
  tags: ['warm', 'narration'],
  referenceAudio: null,
  config: {
    speed: 1,
    pitch: 1,
  },
  isFavorite: false,
  metadata: {
    origin: 'market',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies MagicStudioVoiceSpeaker;

const validVoiceQuery = {
  page: 1,
  size: 20,
  keyword: 'kore',
  source: 'market',
  language: 'en-US',
  gender: 'female',
  style: 'narration',
  provider: 'minimax',
} satisfies RuntimeMarketVoiceQuery;

const validVoiceListResponse = {
  requestId: 'request-voice-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validVoiceSpeaker],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeMarketVoiceList;

const validVoiceResponse = {
  requestId: 'request-voice',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validVoiceSpeaker,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeReadVoiceEnvelope;

const validPreviewRequest = {
  previewText: 'Hello from the clone preview',
  previewAudioUrl: 'https://cdn.example.com/kore-preview.wav',
} satisfies RuntimePreviewRequest;

void runtimeMarketVoiceQueryMatchesServerType;
void runtimeMarketVoiceListMatchesServerType;
void runtimeWorkspaceVoiceQueryMatchesServerType;
void runtimeWorkspaceVoiceListMatchesServerType;
void runtimeCustomVoiceQueryMatchesServerType;
void runtimeCustomVoiceListMatchesServerType;
void runtimeReadVoiceEnvelopeMatchesServerType;
void runtimePreviewRequestMatchesServerType;
void runtimePreviewEnvelopeMatchesServerType;
void validVoiceQuery;
void validVoiceListResponse;
void validVoiceResponse;
void validPreviewRequest;
