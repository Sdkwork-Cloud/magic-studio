import { resolveEntityKey, type EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';

export const resolveFilmAssetKey = (asset: EntityIdentityLike): string =>
  resolveEntityKey(asset);
