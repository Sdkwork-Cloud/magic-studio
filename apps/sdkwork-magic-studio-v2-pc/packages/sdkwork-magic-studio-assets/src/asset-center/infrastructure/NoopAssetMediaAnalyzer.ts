import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';
import type { AssetMediaAnalysisResult, AssetMediaAnalyzerPort } from '../ports/AssetMediaAnalyzerPort';

export class NoopAssetMediaAnalyzer implements AssetMediaAnalyzerPort {
  async analyze(_url: string, _type: AssetContentKey): Promise<AssetMediaAnalysisResult> {
    return { metadata: {} };
  }
}
