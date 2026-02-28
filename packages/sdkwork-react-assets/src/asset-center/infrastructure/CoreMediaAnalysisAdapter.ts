import { mediaAnalysisService } from '@sdkwork/react-core';
import type { AssetContentKey } from '@sdkwork/react-types';
import type { AssetMediaAnalysisResult, AssetMediaAnalyzerPort } from '../ports/AssetMediaAnalyzerPort';

export class CoreMediaAnalysisAdapter implements AssetMediaAnalyzerPort {
  async analyze(url: string, type: AssetContentKey): Promise<AssetMediaAnalysisResult> {
    try {
      const result = await mediaAnalysisService.analyze(url, type as any);
      return {
        metadata: result.metadata || {},
        thumbnailBlob: result.thumbnailBlob
      };
    } catch {
      return { metadata: {} };
    }
  }
}
