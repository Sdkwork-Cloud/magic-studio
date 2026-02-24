
export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  icon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  icon?: string;
  folder?: string;
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  path?: string; // VFS Path
  totalBytes?: number;
  receivedBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'canceled';
  startTime: number;
  endTime?: number;
  error?: string;
}
