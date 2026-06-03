import type { Asset, AssetType } from '../entities/asset.entity';
import type { AssetBusinessDomain } from '@sdkwork/magic-studio-types/asset-center';
import type { ChooseAssetProjectReference } from './chooseAssetProjectReference';

export interface ChooseAssetModalContentProps {
  onClose: () => void;
  onConfirm: (assets: Asset[]) => void;
  accepts?: AssetType[];
  multiple?: boolean;
  title?: string;
  extractedImages?: string[];
  initialTab?: 'library' | 'document';
  domain?: AssetBusinessDomain;
  projectReference?: ChooseAssetProjectReference;
}

export interface ChooseAssetModalProps extends ChooseAssetModalContentProps {
  isOpen: boolean;
}
