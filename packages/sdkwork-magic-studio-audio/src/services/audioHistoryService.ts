import { createCanonicalCreationHistoryStore } from '@sdkwork/magic-studio-generation-history';

import { audioCreationHistoryMapper } from './audioCreationHistoryMapper';

export const audioHistoryService = createCanonicalCreationHistoryStore({
  feature: 'MagicStudioAudioHistoryService',
  mapper: audioCreationHistoryMapper,
});
