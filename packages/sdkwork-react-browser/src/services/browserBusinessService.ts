import { createServiceAdapterController } from '@sdkwork/react-commons';
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

const controller = createServiceAdapterController<BrowserBusinessAdapter>(localBrowserAdapter);

export const browserBusinessService: BrowserBusinessAdapter = controller.service;
export const setBrowserBusinessAdapter = (adapter: BrowserBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getBrowserBusinessAdapter = (): BrowserBusinessAdapter => {
  return controller.getAdapter();
};

export const resetBrowserBusinessAdapter = (): void => {
  controller.resetAdapter();
};
