import type {
  MagicStudioApiEnvelope,
  MagicStudioCreationCapabilities,
  MagicStudioCreationCapabilitiesQuery,
} from '@sdkwork/magic-studio-server';

const validCreationCapabilitiesQuery = {
  target: 'video',
} satisfies MagicStudioCreationCapabilitiesQuery;

const validCreationCapabilitiesData = {
  target: 'video',
  channels: [
    {
      channel: 'VOLCENGINE',
      name: 'Volcengine',
      models: [
        {
          model: 'film-master',
          name: 'Film Master',
        },
      ],
    },
  ],
  styleOptions: [
    {
      id: 'cinematic',
      label: 'Cinematic',
      prompt: 'cinematic prompt',
    },
  ],
} satisfies MagicStudioCreationCapabilities;

const validCreationCapabilitiesResponse = {
  requestId: 'req-creation-capabilities-1',
  timestamp: '2026-04-22T00:00:00.000Z',
  data: validCreationCapabilitiesData,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioCreationCapabilities>;

void validCreationCapabilitiesQuery;
void validCreationCapabilitiesData;
void validCreationCapabilitiesResponse;
