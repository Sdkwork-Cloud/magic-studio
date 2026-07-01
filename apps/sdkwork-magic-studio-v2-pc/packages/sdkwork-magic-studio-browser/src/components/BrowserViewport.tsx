
import React, { useRef, useEffect } from 'react';
import { Globe, AlertTriangle } from 'lucide-react';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { useBrowserStore } from '../store/browserStore';

export const BrowserViewport: React.FC = () => {
    const runtime = getPlatformRuntime();
    const { activeTab, updateTab, addToHistory, createTab } = useBrowserStore();
    
    // Debug: Track createTab calls
    const createTabDebug = (url: string) => {
        console.log('[BrowserViewport] createTab called with:', url);
        return createTab(url);
    };
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const browserInstanceRef = useRef<any>(null);
    const useEmbeddedBrowser = runtime.browser.supported();
    
    // --- Web / Iframe Logic ---
    const handleLoad = () => {
        if (!activeTab || !iframeRef.current) return;
        
        updateTab(activeTab.id, { isLoading: false });
        
        try {
            const title = iframeRef.current.contentDocument?.title || activeTab.url;
            updateTab(activeTab.id, { title });
            addToHistory(activeTab.url, title);
        } catch {
            addToHistory(activeTab.url, activeTab.url);
        }
    };

    // --- Desktop / Professional Browser Logic ---
    useEffect(() => {
        if (!useEmbeddedBrowser || !containerRef.current) return;
        if (!activeTab || activeTab.url === 'about:blank') {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
            browserInstanceRef.current = null;
            return;
        }

        let isMounted = true;
        const tabId = activeTab.id;
        
        const initBrowser = async () => {
            if (!isMounted || !containerRef.current) return;
            
            console.log('[BrowserViewport] Initializing professional browser for:', { tabId, url: activeTab.url });
            
            // Destroy previous browser instance
            if (cleanupRef.current) {
                try {
                    await cleanupRef.current();
                } catch (e) {
                    console.warn('[BrowserViewport] Error during cleanup:', e);
                }
                cleanupRef.current = null;
                browserInstanceRef.current = null;
            }

            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted || !containerRef.current) return;

            try {
                // Create professional browser with callbacks
                const browser = await runtime.browser.create(containerRef.current, {
                    url: activeTab.url,
                    onTitleChange: (title) => {
                        if (isMounted) {
                            updateTab(tabId, { title });
                        }
                    },
                    onUrlChange: (url) => {
                        if (isMounted && url !== activeTab.url) {
                            updateTab(tabId, { url });
                        }
                    },
                    onLoadingChange: (isLoading) => {
                        if (isMounted) {
                            updateTab(tabId, { isLoading });
                        }
                    },
                    onLinkClick: (url, target, features) => {
                        console.log('[BrowserViewport] onLinkClick called with:', { url, target, features });
                        if (isMounted && url) {
                            console.log('[BrowserViewport] Creating new tab for URL:', url);
                            // Create new tab with the URL
                            createTabDebug(url);
                        } else {
                            console.warn('[BrowserViewport] Cannot create new tab:', { isMounted, hasUrl: !!url });
                        }
                        return 'new-tab';
                    },
                    onContextMenu: (data) => {
                        console.log('[BrowserViewport] Context menu:', data);
                        // TODO: Implement context menu
                    }
                });
                
                if (!isMounted) {
                    // Component unmounted during creation, destroy browser
                    await browser.destroy();
                    return;
                }
                
                browserInstanceRef.current = browser;
                cleanupRef.current = async () => {
                    try {
                        await browser.destroy();
                        console.log('[BrowserViewport] Browser destroyed');
                    } catch (e) {
                        console.warn('[BrowserViewport] Error destroying browser:', e);
                    }
                };
                
                console.log('[BrowserViewport] Professional browser created successfully for tab:', tabId);
                updateTab(tabId, { isLoading: false });
                
            } catch (e) {
                console.error("[BrowserViewport] Failed to create browser:", e);
                if (isMounted) {
                    updateTab(tabId, { isLoading: false });
                }
            }
        };

        initBrowser();

        return () => {
            isMounted = false;
            
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
                browserInstanceRef.current = null;
            }
        };
    }, [activeTab?.id, activeTab?.url, createTab, runtime, updateTab, useEmbeddedBrowser]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, []);

    if (!activeTab) {
        return (
            <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center">
                <span className="text-gray-600 text-sm">No active tab</span>
            </div>
        );
    }

    if (activeTab.url === 'about:blank') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] text-gray-500">
                <Globe size={64} className="opacity-10 mb-4" />
                <h2 className="text-xl font-medium text-gray-400">MagicStudio Browser</h2>
                <p className="text-sm text-gray-600 mt-2">Enter a URL to start browsing</p>
            </div>
        );
    }

    // Desktop mode with professional browser
    if (useEmbeddedBrowser) {
        return (
            <div 
                ref={containerRef} 
                className="flex-1 w-full h-full bg-white relative"
                style={{ minHeight: '400px', minWidth: '600px' }}
            >
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    // Web mode: use iframe
    return (
        <div className="flex-1 relative bg-white w-full h-full overflow-hidden">
            {activeTab.isLoading && (
                <div className="absolute top-0 left-0 h-[2px] bg-blue-500 z-20 animate-progress w-full origin-left" />
            )}
            
            <iframe
                ref={iframeRef}
                key={activeTab.id} 
                src={activeTab.url}
                className="w-full h-full border-none bg-white block"
                style={{ display: 'block', width: '100%', height: '100%' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-downloads"
                onLoad={handleLoad}
                onError={() => updateTab(activeTab.id, { isLoading: false })}
            />
            
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-white text-xs p-2 rounded flex items-center gap-2 max-w-xs">
                <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0" />
                <span>Some sites may block embedding. Use "Open in System Browser" if content is blank.</span>
            </div>
        </div>
    );
};
