
import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Send, CheckCircle2, Image as ImageIcon, 
    Loader2, Plus, Trash2, ChevronUp, User, 
    Check, Sparkles, ArrowUp, ArrowDown, ExternalLink
} from 'lucide-react';
import { MediaAccountConfig, useSettingsStore } from 'sdkwork-react-settings';
import { useTranslation } from 'sdkwork-react-i18n';
import { useAuthStore } from 'sdkwork-react-auth';
import { UniversalNoteEditor } from './NoteEditor';
import { ChooseAsset } from 'sdkwork-react-assets';
import { Note, ArticlePayload, PublishTarget, Button, generateUUID } from 'sdkwork-react-commons';
import { publishingService } from '../services/publishingService';

interface PublishModalProps {
    note: Note; // This must be the full note with content
    onClose: () => void;
}

// Internal State for the UI
interface ArticleDraft extends ArticlePayload {
    uiId: string;
}

export const PublishModal: React.FC<PublishModalProps> = ({ note, onClose }) => {
    const { t } = useTranslation();
    const { settings } = useSettingsStore();
    const { user } = useAuthStore();
    
    // --- State: Articles ---
    const [articles, setArticles] = useState<ArticleDraft[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // --- State: Execution & UI ---
    const accounts = Object.values(settings.media || {}) as MediaAccountConfig[];
    const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
    const [isPublishing, setIsPublishing] = useState(false);
    const [results, setResults] = useState<PublishTarget[]>([]);
    
    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const accountSelectorRef = useRef<HTMLDivElement>(null);

    // Helper: Parse images from HTML content
    const extractImagesFromContent = (htmlContent: string): string[] => {
        if (!htmlContent) return [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const images = Array.from(doc.querySelectorAll('img')).map(img => img.src).filter(src => !!src);
        return images;
    };

    const extractPlainText = (htmlContent: string): string => {
        if (!htmlContent) return "";
        const tmp = document.createElement('div');
        tmp.innerHTML = htmlContent;
        return tmp.textContent || tmp.innerText || "";
    };

    // Initialize with current note
    useEffect(() => {
        // Extract first image from content as default cover if not set in metadata
        let defaultCover = note.metadata?.coverImage;
        if (!defaultCover && note.content) {
            const imgMatch = note.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) defaultCover = imgMatch[1];
        }

        setArticles([{
            uiId: generateUUID(),
            id: note.id,
            title: note.title,
            content: note.content || '', // Handle potentially empty content if somehow passed summary
            digest: note.metadata?.readingTime ? `${note.metadata.readingTime} min read` : '',
            coverImage: defaultCover,
            author: user?.username || 'Open Studio',
            tags: note.tags,
            originalUrl: ''
        }]);

        if (accounts.length > 0) {
             const enabled = accounts.filter(a => a.enabled).map(a => a.id);
             if (enabled.length > 0) setSelectedAccountIds(new Set([enabled[0]]));
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (accountSelectorRef.current && !accountSelectorRef.current.contains(e.target as Node)) {
                setShowAccountSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, []);

    const activeArticle = articles[activeIndex];

    const updateActiveArticle = (updates: Partial<ArticleDraft>) => {
        setArticles(prev => {
            const next = [...prev];
            next[activeIndex] = { ...next[activeIndex], ...updates };
            return next;
        });
    };

    const addNewArticle = () => {
        const newArticle: ArticleDraft = {
            uiId: generateUUID(),
            title: 'New Article',
            content: '<p>Start writing...</p>',
            author: user?.username || 'Open Studio',
            digest: '',
            coverImage: '',
            originalUrl: ''
        };
        setArticles([...articles, newArticle]);
        setActiveIndex(articles.length);
    };

    const removeArticle = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (articles.length === 1) return;
        const newArticles = articles.filter((_, i) => i !== index);
        setArticles(newArticles);
        if (activeIndex >= newArticles.length) {
            setActiveIndex(newArticles.length - 1);
        } else if (activeIndex === index) {
            setActiveIndex(Math.max(0, index - 1));
        }
    };

    const moveArticle = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
        e.stopPropagation();
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === articles.length - 1) return;
        
        const newArticles = [...articles];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        [newArticles[index], newArticles[targetIndex]] = [newArticles[targetIndex], newArticles[index]];
        
        setArticles(newArticles);
        if (activeIndex === index) setActiveIndex(targetIndex);
        else if (activeIndex === targetIndex) setActiveIndex(index);
    };

    const handleExtractDigest = () => {
        if (!activeArticle) return;
        const temp = document.createElement('div');
        temp.innerHTML = activeArticle.content;
        const text = temp.textContent || temp.innerText || '';
        const digest = text.slice(0, 120).trim() + (text.length > 120 ? '...' : '');
        updateActiveArticle({ digest });
    };

    const toggleAccount = (id: string) => {
        const next = new Set(selectedAccountIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedAccountIds(next);
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        const payload: ArticlePayload[] = articles.map(({ uiId, ...rest }) => rest);
        const initialResults: PublishTarget[] = accounts
            .filter(acc => selectedAccountIds.has(acc.id))
            .map(acc => ({ accountId: acc.id, platform: acc.platform, name: acc.name, status: 'publishing' }));
        setResults(initialResults);

        const promises = accounts
            .filter(acc => selectedAccountIds.has(acc.id))
            .map(async (acc) => {
                const result = await publishingService.publishToAccount(acc, payload);
                setResults(prev => prev.map(r => r.accountId === acc.id ? { ...r, status: result.success ? 'published' : 'failed', resultUrl: result.url, error: result.message } : r));
            });

        await Promise.all(promises);
        setIsPublishing(false);
    };

    const hasFinished = results.length > 0 && results.every(r => r.status !== 'publishing');

    if (!activeArticle) return null;
    const contentImages = extractImagesFromContent(activeArticle.content);
    const plainTextContent = extractPlainText(activeArticle.content);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-[1600px] h-[95vh] bg-[#121214] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none h-14 bg-[#18181b] border-b border-[#27272a] flex justify-between items-center px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-600/20 text-green-500 flex items-center justify-center border border-green-600/30">
                            <Send size={16} />
                        </div>
                        <div>
                             <h3 className="text-white font-semibold text-sm">Mass Publish</h3>
                             <div className="text-[10px] text-gray-500">WeChat Official Account Style</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#27272a] rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT SIDEBAR */}
                    <div className="w-[320px] flex-none border-r border-[#27272a] bg-[#18181b] flex flex-col">
                        <div className="flex-none p-4 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                             <span>Article List</span>
                             <span className="bg-[#27272a] px-1.5 py-0.5 rounded text-gray-400">{articles.length}</span>
                        </div>
                        
                        <div className="p-4 pt-2 flex-1 overflow-y-auto space-y-3">
                             <div className="bg-[#121214] border border-[#27272a] rounded-lg overflow-hidden">
                                {articles.map((article, index) => {
                                     const isFirst = index === 0;
                                     const isActive = index === activeIndex;
                                     return (
                                         <div 
                                            key={article.uiId}
                                            onClick={() => setActiveIndex(index)}
                                            className={`relative cursor-pointer transition-all group select-none border-b border-[#27272a] last:border-0 ${isActive ? 'ring-2 ring-green-500 z-10' : 'hover:bg-[#1e1e20]'}`}
                                         >
                                             {isFirst ? (
                                                 <div className="p-4 relative">
                                                     <div className="aspect-[16/9] w-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
                                                         {article.coverImage ? <img src={article.coverImage} className="w-full h-full object-cover" /> : <div className="text-gray-600 flex flex-col items-center gap-2"><ImageIcon size={32} /><span className="text-xs">No Cover</span></div>}
                                                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                             <div className="text-white font-medium text-sm line-clamp-2">{article.title || 'Untitled Article'}</div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             ) : (
                                                 <div className="flex p-3 gap-3 h-24">
                                                     <div className="flex-1 font-medium text-sm text-gray-300 line-clamp-3 leading-relaxed">{article.title || 'Untitled'}</div>
                                                     <div className="w-16 h-16 bg-[#0a0a0a] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                         {article.coverImage ? <img src={article.coverImage} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-600" />}
                                                     </div>
                                                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-1 rounded z-20">
                                                         <button onClick={(e) => moveArticle(e, index, 'up')} className="p-1 hover:text-blue-400 text-gray-300"><ArrowUp size={12}/></button>
                                                         <button onClick={(e) => removeArticle(e, index)} className="p-1 hover:text-red-400 text-gray-300"><Trash2 size={12}/></button>
                                                         <button onClick={(e) => moveArticle(e, index, 'down')} className="p-1 hover:text-blue-400 text-gray-300"><ArrowDown size={12}/></button>
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })}
                             </div>
                             <button onClick={addNewArticle} className="w-full py-3 border-2 border-dashed border-[#27272a] hover:border-[#444] rounded-lg flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-green-900/5 transition-all gap-2">
                                 <Plus size={16} />
                                 <span className="text-xs font-bold uppercase tracking-wide">Add Article</span>
                             </button>
                         </div>
                    </div>

                    {/* CENTER: Editor */}
                    <div className="flex-1 bg-[#121214] flex flex-col min-w-0 relative">
                        <UniversalNoteEditor
                            key={activeArticle.uiId} 
                            initialContent={activeArticle.content}
                            initialTitle={activeArticle.title}
                            noteType="article"
                            config={{ mode: 'embed', showToolbar: true, showMetadata: false, showPublishButton: false, showChatToggle: false, placeholder: "Type your article content here..." }}
                            onChange={(html) => updateActiveArticle({ content: html })}
                            onTitleChange={(title) => updateActiveArticle({ title })}
                            className="h-full bg-[#121214]"
                        />
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="w-[320px] flex-none border-l border-[#27272a] bg-[#18181b] flex flex-col overflow-y-auto">
                        <div className="flex-none p-4 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#27272a] mb-4">Publish Settings</div>
                        <div className="px-6 py-4 space-y-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cover Image</label>
                                <ChooseAsset 
                                    value={activeArticle.coverImage || null}
                                    onChange={(asset) => updateActiveArticle({ coverImage: asset ? (asset.path || asset.id) : undefined })}
                                    accepts={['image']}
                                    label="Select Cover"
                                    aspectRatio="aspect-[16/9]"
                                    extractedImages={contentImages}
                                    contextText={plainTextContent}
                                />
                                <p className="text-[10px] text-gray-500">Recommended 900x500 (16:9)</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Digest</label>
                                    <button onClick={handleExtractDigest} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><Sparkles size={10} /> Auto-Generate</button>
                                </div>
                                <textarea 
                                    value={activeArticle.digest || ''}
                                    onChange={(e) => updateActiveArticle({ digest: e.target.value })}
                                    className="w-full h-24 bg-[#121214] border border-[#27272a] rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter a short summary..."
                                />
                                <div className="text-right text-[10px] text-gray-500">{(activeArticle.digest || '').length}/120</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Author</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="text" value={activeArticle.author || ''} onChange={(e) => updateActiveArticle({ author: e.target.value })} className="w-full bg-[#121214] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" placeholder="Author Name" />
                                </div>
                            </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Original Link</label>
                                <div className="relative">
                                    <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="text" value={activeArticle.originalUrl || ''} onChange={(e) => updateActiveArticle({ originalUrl: e.target.value })} className="w-full bg-[#121214] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" placeholder="https://..." />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none h-16 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between px-6 z-30">
                    <div className="relative" ref={accountSelectorRef}>
                        <button onClick={() => !isPublishing && setShowAccountSelector(!showAccountSelector)} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors border ${showAccountSelector ? 'bg-[#27272a] border-[#444] text-white' : 'bg-transparent border-transparent hover:bg-[#27272a] text-gray-300'}`}>
                            <div className="flex -space-x-2">
                                {selectedAccountIds.size > 0 ? Array.from(selectedAccountIds).slice(0, 3).map(id => (<div key={id} className="w-6 h-6 rounded-full bg-blue-600 border-2 border-[#18181b] flex items-center justify-center text-[10px] text-white font-bold">{accounts.find(a => a.id === id)?.name[0] || '?'}</div>)) : <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-[#18181b]" />}
                            </div>
                            <div className="flex flex-col items-start"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Publishing to</span><span className="text-sm font-medium">{selectedAccountIds.size === 0 ? 'Select Accounts' : `${selectedAccountIds.size} Accounts Selected`}</span></div>
                            <ChevronUp size={16} className={`transition-transform ${showAccountSelector ? 'rotate-180' : ''}`} />
                        </button>
                        {showAccountSelector && (
                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#1e1e20] border border-[#333] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-2">Connected Accounts</div>
                                <div className="max-h-[200px] overflow-y-auto space-y-1">
                                    {accounts.map(acc => {
                                        const isSelected = selectedAccountIds.has(acc.id);
                                        return (<button key={acc.id} onClick={() => toggleAccount(acc.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isSelected ? 'bg-blue-600/20 text-blue-300' : 'text-gray-300 hover:bg-[#27272a]'}`}><div className="flex items-center gap-3 overflow-hidden"><div className={`w-2 h-2 rounded-full ${acc.enabled ? 'bg-green-500' : 'bg-gray-500'}`} /><span className="truncate">{acc.name}</span></div>{isSelected && <Check size={14} className="text-blue-500" />}</button>);
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 px-8 text-center">
                         {isPublishing && <span className="text-sm text-blue-400 animate-pulse flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Publishing {articles.length} articles...</span>}
                         {hasFinished && <span className="text-sm text-green-400 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Publishing Complete</span>}
                    </div>
                    <div className="flex gap-3">
                         {hasFinished ? <Button onClick={onClose} variant="secondary" className="px-8 bg-[#27272a] border-[#333] text-white hover:bg-[#333]">Close</Button> : <Button onClick={handlePublish} disabled={selectedAccountIds.size === 0 || isPublishing} className="px-6 py-2.5 h-auto bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-900/20 border-0 rounded-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"><Send size={16} /> {isPublishing ? 'Publishing...' : 'Send'}</Button>}
                    </div>
                </div>
            </div>
        </div>
    );
};
