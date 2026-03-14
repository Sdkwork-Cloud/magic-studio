import { browserService } from './browserService';
import { browserHistoryService } from './browserHistoryService';
import { browserBookmarkService } from './browserBookmarkService';
import { browserDownloadService } from './browserDownloadService';

export interface BrowserBusinessAdapter {
  browserService: typeof browserService;
  browserHistoryService: typeof browserHistoryService;
  browserBookmarkService: typeof browserBookmarkService;
  browserDownloadService: typeof browserDownloadService;
}

const localBrowserAdapter: BrowserBusinessAdapter = {
  browserService,
  browserHistoryService,
  browserBookmarkService,
  browserDownloadService
};

export const browserBusinessService: BrowserBusinessAdapter = localBrowserAdapter;
