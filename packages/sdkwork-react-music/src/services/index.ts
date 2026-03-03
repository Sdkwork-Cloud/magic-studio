import { musicBusinessService } from './musicBusinessService';

export * from './musicBusinessService';
export const musicService = musicBusinessService.musicService;
export const musicHistoryService = musicBusinessService.musicHistoryService;
