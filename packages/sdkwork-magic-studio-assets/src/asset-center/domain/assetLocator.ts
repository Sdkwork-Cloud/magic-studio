import {
  DESKTOP_ASSET_PROTOCOL,
  FILE_ASSET_PROTOCOL,
  isAbsoluteFilePath,
  isCanonicalMagicStudioAssetReference,
  isDesktopAssetLocator,
  isExplicitLocalAssetLocator,
  isFileAssetLocator,
  isLocalFileAssetReference,
  isLocalFilePath,
  isMagicStudioAssetPath,
  isRelativeFilePath,
  isRenderableAssetUrl,
  stripExplicitLocalAssetLocatorProtocol,
} from '@sdkwork/magic-studio-core/storage';

export {
  DESKTOP_ASSET_PROTOCOL,
  FILE_ASSET_PROTOCOL,
  isAbsoluteFilePath,
  isCanonicalMagicStudioAssetReference,
  isDesktopAssetLocator,
  isExplicitLocalAssetLocator,
  isFileAssetLocator,
  isLocalFileAssetReference,
  isLocalFilePath,
  isMagicStudioAssetPath,
  isRelativeFilePath,
  isRenderableAssetUrl,
  stripExplicitLocalAssetLocatorProtocol,
};

export const isManagedAssetLocator = isMagicStudioAssetPath;
