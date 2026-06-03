import type {
  MagicStudioGenerationArtifact,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type VideoReferenceAsset = MagicStudioVideoGenerationRequest['assets'][number];

const validVideoReferenceAsset = {
  role: 'reference_1',
  type: 'image',
  value: 'https://example.com/reference-1.png',
  assetUuid: 'video-reference-asset-uuid-1',
  primaryResourceUuid: 'video-reference-resource-uuid-1',
} satisfies VideoReferenceAsset;

const validVideoArtifact = {
  id: 'artifact-video-asset-1',
  uuid: 'artifact-video-asset-uuid-1',
  type: 'video',
  role: 'primary',
  assetUuid: 'video-output-asset-uuid-1',
  primaryResourceUuid: 'video-output-resource-uuid-1',
  url: 'https://example.com/generated-video.mp4',
  posterUrl: 'https://example.com/generated-video.jpg',
  mimeType: 'video/mp4',
  name: 'generated-video.mp4',
  width: 1280,
  height: 720,
  duration: 5,
  metadata: {
    generationType: 'smart_reference',
  },
} satisfies MagicStudioGenerationArtifact;

void validVideoReferenceAsset;
void validVideoArtifact;
