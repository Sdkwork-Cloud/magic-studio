
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BrowserTab, HistoryItem, Bookmark, DownloadItem } from '../entities/browser.entity';
import { browserService } from '../services/browserService';
import { browserHistoryService } from '../services/browserHistoryService';
import { browserBookmarkService } from '../services/browserBookmarkService';
import { browserDownloadService } from '../services/browserDownloadService';

interface BrowserStoreContextType {
  tabs: BrowserTab[];
  activeTabId: string | null;
  activeTab: BrowserTab | null;
  history: HistoryItem[];
  bookmarks: Bookmark[];
  downloads: DownloadItem[];
  
  createTab: (url?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<BrowserTab>) => void;
  
  addToHistory: (url: string, title: string) => void;
  toggleBookmark: (url: string, title: string) => void;
  
  startDownload: (url: string) => void;
  clearDownloads: () => void;
  
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  navigate: (url: string) => void;
}

const BrowserStoreContext = createContext<BrowserStoreContextType | undefined>(undefined);

export const BrowserStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const init = async () => {
      const hResult = await browserHistoryService.findAll({ page: 0, size: 100 });
      const bResult = await browserBookmarkService.findAll({ page: 0, size: 1000 });
      
      if (hResult.success) setHistory(hResult.data?.content || []);
      if (bResult.success) setBookmarks(bResult.data?.content || []);
      
      createTab();
    };
    init();
  }, []);
  
  useEffect(() => {
      return browserDownloadService.subscribe((items) => {
          setDownloads(items);
      });
  }, []);

  const createTab = useCallback((url: string = 'about:blank') => {
    const newTab: BrowserTab = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      title: url === 'about:blank' ? 'New Tab' : url,
      isLoading: url !== 'about:blank',
      canGoBack: false,
      canGoForward: false
    };
    setTabs(prev => {
      const newTabs = [...prev, newTab];
      setActiveTabId(newTab.id);
      return newTabs;
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const remaining = prev.filter(t => t.id !== id);
      if (remaining.length === 0) {
        const resetTab = { 
           id: Math.random().toString(36).substring(2, 9),
           url: 'about:blank',
           title: 'New Tab',
           isLoading: false,
           canGoBack: false,
           canGoForward: false
        };
        setActiveTabId(resetTab.id);
        return [resetTab];
      }
      
      if (activeTabId === id) {
        const currentIndex = prev.findIndex(t => t.id === id);
        const nextTab = remaining[Math.min(currentIndex, remaining.length - 1)];
        if (nextTab) setActiveTabId(nextTab.id);
      }
      return remaining;
    });
  }, [activeTabId]);

  const updateTab = useCallback((id: string, updates: Partial<BrowserTab>) => {
      setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const addToHistory = useCallback(async (url: string, title: string) => {
      if (url === 'about:blank') return;
      await browserHistoryService.addHistoryItem(url, title);
      const hResult = await browserHistoryService.findAll({ page: 0, size: 100 });
      if (hResult.success) setHistory(hResult.data?.content || []);
  }, []);

  const toggleBookmark = useCallback(async (url: string, title: string) => {
      await browserBookmarkService.toggleBookmark(url, title);
      const bResult = await browserBookmarkService.findAll({ page: 0, size: 1000 });
      if (bResult.success) setBookmarks(bResult.data?.content || []);
  }, []);

  const navigate = useCallback((url: string) => {
      if (activeTabId) {
          const finalUrl = browserService.normalizeUrl(url);
          updateTab(activeTabId, { url: finalUrl, isLoading: true });
      }
  }, [activeTabId, updateTab]);

  const startDownload = useCallback((url: string) => {
      browserDownloadService.startDownload(url);
  }, []);
  
  const clearDownloads = useCallback(() => {
      browserDownloadService.clearCompleted();
  }, []);

  const goBack = useCallback(() => {}, []);
  const goForward = useCallback(() => {}, []);
  const reload = useCallback(() => {
     if (activeTabId) updateTab(activeTabId, { isLoading: true });
     setTimeout(() => { if (activeTabId) updateTab(activeTabId, { isLoading: false }) }, 500); 
  }, [activeTabId, updateTab]);

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  return (
    <BrowserStoreContext.Provider value={{
        tabs, activeTabId, activeTab, history, bookmarks, downloads,
        createTab, closeTab, setActiveTab: setActiveTabId, updateTab,
        addToHistory, toggleBookmark, startDownload, clearDownloads,
        goBack, goForward, reload, navigate
    }}>
      {children}
    </BrowserStoreContext.Provider>
  );
};

export const useBrowserStore = () => {
  const context = useContext(BrowserStoreContext);
  if (!context) throw new Error('useBrowserStore must be used within a BrowserStoreProvider');
  return context;
};
