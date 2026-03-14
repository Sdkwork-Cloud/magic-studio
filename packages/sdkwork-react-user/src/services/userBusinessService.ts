import { socialContactService } from './socialContactService';
import { userCenterService } from './userCenterService';

export const userBusinessService = {
    ...userCenterService,
    ...socialContactService,
};

export type UserBusinessAdapter = typeof userBusinessService;
