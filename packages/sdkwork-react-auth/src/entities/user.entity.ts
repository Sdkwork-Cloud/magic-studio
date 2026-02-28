
import { BaseEntity } from '@sdkwork/react-commons';

export interface User extends BaseEntity {
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  isVip?: boolean;
  lastLoginAt?: number;
}
