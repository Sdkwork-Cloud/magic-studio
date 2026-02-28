import type { AssetContentKey } from '@sdkwork/react-types';

export interface AssetMediaAnalysisResult {
  metadata: Record<string, unknown>;
  thumbnailBlob?: Blob;
}

export interface AssetMediaAnalyzerPort {
  analyze(url: string, type: AssetContentKey): Promise<AssetMediaAnalysisResult>;
}
