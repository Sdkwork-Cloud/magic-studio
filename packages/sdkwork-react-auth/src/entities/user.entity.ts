
import { BaseEntity } from 'sdkwork-react-commons';

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  isVip?: boolean;
  lastLoginAt?: number;
}
