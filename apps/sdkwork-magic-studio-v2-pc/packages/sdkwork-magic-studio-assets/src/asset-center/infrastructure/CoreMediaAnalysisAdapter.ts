import { mediaAnalysisService } from '@sdkwork/magic-studio-core/services';
import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';
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
