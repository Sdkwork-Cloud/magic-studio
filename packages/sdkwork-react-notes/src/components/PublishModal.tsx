import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { MediaAccountConfig, useSettingsStore } from '@sdkwork/react-settings';
import { useTranslation } from '@sdkwork/react-i18n';
import { useAuthStore } from '@sdkwork/react-auth';
import { UniversalNoteEditor } from './NoteEditor';
import { ChooseAsset } from '@sdkwork/react-assets';
import {
  ArticlePayload,
  Button,
  Note,
  PublishTarget,
  cn,
  generateUUID,
} from '@sdkwork/react-commons';
import {
  Dialog,
  DialogContent,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from '@sdkwork/react-commons/ui';
import { publishingService } from '../services';

interface PublishModalProps {
  note: Note;
  onClose: () => void;
}

interface ArticleDraft extends ArticlePayload {
  uiId: string;
}

export const PublishModal: React.FC<PublishModalProps> = ({ note, onClose }) => {
  const { t: _t } = useTranslation();
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();

  const defaultAuthor = (() => {
    if (!user) {
      return 'MagicStudio';
    }

    const usernameCandidate = 'username' in user ? user.username : undefined;
    if (typeof usernameCandidate === 'string' && usernameCandidate.trim()) {
      return usernameCandidate;
    }

    const nameCandidate = 'name' in user ? user.name : undefined;
    if (typeof nameCandidate === 'string' && nameCandidate.trim()) {
      return nameCandidate;
    }

    return 'MagicStudio';
  })();

  const [articles, setArticles] = useState<ArticleDraft[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const accounts = Object.values(settings.media || {}) as MediaAccountConfig[];
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [results, setResults] = useState<PublishTarget[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const extractImagesFromContent = (htmlContent: string): string[] => {
    if (!htmlContent) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    return Array.from(doc.querySelectorAll('img'))
      .map((img) => img.src)
      .filter(Boolean);
  };

  const extractPlainText = (htmlContent: string): string => {
    if (!htmlContent) {
      return '';
    }

    const tmp = document.createElement('div');
    tmp.innerHTML = htmlContent;
    return tmp.textContent || tmp.innerText || '';
  };

  useEffect(() => {
    let defaultCover = note.metadata?.coverImage;
    if (!defaultCover && note.content) {
      const imgMatch = note.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        defaultCover = imgMatch[1];
      }
    }

    setArticles([
      {
        uiId: generateUUID(),
        id: note.id,
        title: note.title,
        content: note.content || '',
        digest: note.metadata?.readingTime ? `${note.metadata.readingTime} min read` : '',
        coverImage: defaultCover,
        author: defaultAuthor,
        tags: note.tags,
        originalUrl: '',
      },
    ]);

    if (accounts.length > 0) {
      const enabled = accounts.filter((account) => account.enabled).map((account) => account.id);
      if (enabled.length > 0) {
        setSelectedAccountIds(new Set([enabled[0]]));
      }
    }
  }, []);

  const activeArticle = articles[activeIndex];

  const updateActiveArticle = (updates: Partial<ArticleDraft>) => {
    setArticles((prev) => {
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
      author: defaultAuthor,
      digest: '',
      coverImage: '',
      originalUrl: '',
    };

    setArticles([...articles, newArticle]);
    setActiveIndex(articles.length);
  };

  const removeArticle = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (articles.length === 1) {
      return;
    }

    const newArticles = articles.filter((_, articleIndex) => articleIndex !== index);
    setArticles(newArticles);

    if (activeIndex >= newArticles.length) {
      setActiveIndex(newArticles.length - 1);
    } else if (activeIndex === index) {
      setActiveIndex(Math.max(0, index - 1));
    }
  };

  const moveArticle = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) {
      return;
    }

    if (direction === 'down' && index === articles.length - 1) {
      return;
    }

    const newArticles = [...articles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newArticles[index], newArticles[targetIndex]] = [newArticles[targetIndex], newArticles[index]];

    setArticles(newArticles);
    if (activeIndex === index) {
      setActiveIndex(targetIndex);
    } else if (activeIndex === targetIndex) {
      setActiveIndex(index);
    }
  };

  const handleExtractDigest = () => {
    if (!activeArticle) {
      return;
    }

    const temp = document.createElement('div');
    temp.innerHTML = activeArticle.content;
    const text = temp.textContent || temp.innerText || '';
    const digest = text.slice(0, 120).trim() + (text.length > 120 ? '...' : '');
    updateActiveArticle({ digest });
  };

  const toggleAccount = (id: string) => {
    const next = new Set(selectedAccountIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAccountIds(next);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const payload: ArticlePayload[] = articles.map(({ uiId, ...rest }) => rest);
    const initialResults: PublishTarget[] = accounts
      .filter((acc) => selectedAccountIds.has(acc.id))
      .map((acc) => ({ accountId: acc.id, platform: acc.platform, name: acc.name, status: 'publishing' }));
    setResults(initialResults);

    const promises = accounts
      .filter((acc) => selectedAccountIds.has(acc.id))
      .map(async (acc) => {
        const result = await publishingService.publishToAccount(acc, payload);
        setResults((prev) =>
          prev.map((item) =>
            item.accountId === acc.id
              ? { ...item, status: result.success ? 'published' : 'failed', resultUrl: result.url, error: result.message }
              : item,
          ),
        );
      });

    await Promise.all(promises);
    setIsPublishing(false);
  };

  const hasFinished = results.length > 0 && results.every((result) => result.status !== 'publishing');

  if (!activeArticle) {
    return null;
  }

  const contentImages = extractImagesFromContent(activeArticle.content);
  const plainTextContent = extractPlainText(activeArticle.content);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="flex h-[95vh] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl border-[#333] bg-[#121214] p-0 shadow-2xl"
        onInteractOutside={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <div className="flex h-14 flex-none items-center justify-between border-b border-[#27272a] bg-[#18181b] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-600/30 bg-green-600/20 text-green-500">
              <Send size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Mass Publish</h3>
              <div className="text-[10px] text-gray-500">WeChat Official Account Style</div>
            </div>
          </div>
          <Button className="h-9 w-9 p-0 text-gray-400 hover:bg-[#27272a] hover:text-white" onClick={onClose} size="sm" type="button" variant="ghost">
            <X size={18} />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-[320px] flex-none flex-col border-r border-[#27272a] bg-[#18181b]">
            <div className="flex flex-none items-center justify-between p-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <span>Article List</span>
              <span className="rounded bg-[#27272a] px-1.5 py-0.5 text-gray-400">{articles.length}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 pt-2">
              <div className="overflow-hidden rounded-lg border border-[#27272a] bg-[#121214]">
                {articles.map((article, index) => {
                  const isFirst = index === 0;
                  const isActive = index === activeIndex;

                  return (
                    <div
                      className={cn(
                        'group relative cursor-pointer select-none border-b border-[#27272a] transition-all last:border-0',
                        isActive ? 'z-10 ring-2 ring-green-500' : 'hover:bg-[#1e1e20]',
                      )}
                      key={article.uiId}
                      onClick={() => setActiveIndex(index)}
                    >
                      {isFirst ? (
                        <div className="relative p-4">
                          <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-[#0a0a0a]">
                            {article.coverImage ? (
                              <img className="h-full w-full object-cover" src={article.coverImage} />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-gray-600">
                                <ImageIcon size={32} />
                                <span className="text-xs">No Cover</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <div className="line-clamp-2 text-sm font-medium text-white">{article.title || 'Untitled Article'}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-24 gap-3 p-3">
                          <div className="flex-1 text-sm font-medium leading-relaxed text-gray-300 line-clamp-3">{article.title || 'Untitled'}</div>
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden bg-[#0a0a0a]">
                            {article.coverImage ? <img className="h-full w-full object-cover" src={article.coverImage} /> : <ImageIcon className="text-gray-600" size={16} />}
                          </div>
                          <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 rounded bg-black/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button className="h-7 w-7 p-0 text-gray-300 hover:text-blue-400" onClick={(e) => moveArticle(e, index, 'up')} size="sm" type="button" variant="ghost">
                              <ArrowUp size={12} />
                            </Button>
                            <Button className="h-7 w-7 p-0 text-gray-300 hover:text-red-400" onClick={(e) => removeArticle(e, index)} size="sm" type="button" variant="ghost">
                              <Trash2 size={12} />
                            </Button>
                            <Button className="h-7 w-7 p-0 text-gray-300 hover:text-blue-400" onClick={(e) => moveArticle(e, index, 'down')} size="sm" type="button" variant="ghost">
                              <ArrowDown size={12} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button className="h-auto w-full gap-2 rounded-lg border-2 border-dashed border-[#27272a] bg-transparent py-3 text-gray-500 hover:border-[#444] hover:bg-green-900/5 hover:text-green-500" onClick={addNewArticle} type="button" variant="ghost">
                <Plus size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">Add Article</span>
              </Button>
            </div>
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col bg-[#121214]">
            <UniversalNoteEditor
              className="h-full bg-[#121214]"
              config={{ mode: 'embed', showToolbar: true, showMetadata: false, showPublishButton: false, showChatToggle: false, placeholder: 'Type your article content here...' }}
              initialContent={activeArticle.content}
              initialTitle={activeArticle.title}
              key={activeArticle.uiId}
              noteType="article"
              onChange={(html) => updateActiveArticle({ content: html })}
              onTitleChange={(title) => updateActiveArticle({ title })}
            />
          </div>

          <div className="flex w-[320px] flex-none flex-col overflow-y-auto border-l border-[#27272a] bg-[#18181b]">
            <div className="mb-4 flex-none border-b border-[#27272a] p-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Publish Settings</div>
            <div className="space-y-8 px-6 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Cover Image</label>
                <ChooseAsset
                  accepts={['image']}
                  aspectRatio="aspect-[16/9]"
                  contextText={plainTextContent}
                  domain="notes"
                  extractedImages={contentImages}
                  label="Select Cover"
                  onChange={(asset) => updateActiveArticle({ coverImage: asset ? (asset.path || asset.id) : undefined })}
                  value={activeArticle.coverImage || null}
                />
                <p className="text-[10px] text-gray-500">Recommended 900x500 (16:9)</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Digest</label>
                  <Button className="h-auto gap-1 px-0 text-[10px] text-blue-400 hover:text-blue-300" onClick={handleExtractDigest} type="button" variant="ghost">
                    <Sparkles size={10} /> Auto-Generate
                  </Button>
                </div>
                <Textarea
                  className="h-24 border-[#27272a] bg-background text-gray-200 placeholder:text-gray-600"
                  onChange={(e) => updateActiveArticle({ digest: e.target.value })}
                  placeholder="Enter a short summary..."
                  value={activeArticle.digest || ''}
                />
                <div className="text-right text-[10px] text-gray-500">{(activeArticle.digest || '').length}/120</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Author</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <Input
                    className="border-[#27272a] bg-background pl-9 text-gray-200"
                    onChange={(e) => updateActiveArticle({ author: e.target.value })}
                    placeholder="Author Name"
                    type="text"
                    value={activeArticle.author || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Original Link</label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <Input
                    className="border-[#27272a] bg-background pl-9 text-gray-200"
                    onChange={(e) => updateActiveArticle({ originalUrl: e.target.value })}
                    placeholder="https://..."
                    type="text"
                    value={activeArticle.originalUrl || ''}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="z-30 flex h-16 flex-none items-center justify-between border-t border-[#27272a] bg-[#18181b] px-6">
          <Popover onOpenChange={setShowAccountSelector} open={showAccountSelector}>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  'h-auto gap-3 rounded-lg px-4 py-2 text-gray-300',
                  showAccountSelector ? 'border-[#444] bg-[#27272a] text-white' : 'border-transparent bg-transparent hover:bg-[#27272a]',
                )}
                disabled={isPublishing}
                type="button"
                variant="ghost"
              >
                <div className="flex -space-x-2">
                  {selectedAccountIds.size > 0 ? Array.from(selectedAccountIds).slice(0, 3).map((id) => (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#18181b] bg-blue-600 text-[10px] font-bold text-white" key={id}>
                      {accounts.find((account) => account.id === id)?.name[0] || '?'}
                    </div>
                  )) : <div className="h-6 w-6 rounded-full border-2 border-[#18181b] bg-gray-600" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Publishing to</span>
                  <span className="text-sm font-medium">{selectedAccountIds.size === 0 ? 'Select Accounts' : `${selectedAccountIds.size} Accounts Selected`}</span>
                </div>
                <ChevronUp className={cn('transition-transform', showAccountSelector && 'rotate-180')} size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 border-[#333] bg-[#1e1e20] p-2" side="top">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Connected Accounts</div>
              <div className="max-h-[200px] space-y-1 overflow-y-auto">
                {accounts.map((acc) => {
                  const isSelected = selectedAccountIds.has(acc.id);

                  return (
                    <Button
                      className={cn(
                        'h-auto w-full justify-between rounded-lg px-3 py-2 text-sm',
                        isSelected ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/25' : 'text-gray-300 hover:bg-[#27272a]',
                      )}
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      type="button"
                      variant="ghost"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn('h-2 w-2 rounded-full', acc.enabled ? 'bg-green-500' : 'bg-gray-500')} />
                        <span className="truncate">{acc.name}</span>
                      </div>
                      {isSelected ? <Check className="text-blue-500" size={14} /> : null}
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1 px-8 text-center">
            {isPublishing ? <span className="flex items-center justify-center gap-2 text-sm text-blue-400 animate-pulse"><Loader2 className="animate-spin" size={16} /> Publishing {articles.length} articles...</span> : null}
            {hasFinished ? <span className="flex items-center justify-center gap-2 text-sm text-green-400"><CheckCircle2 size={16} /> Publishing Complete</span> : null}
          </div>

          <div className="flex gap-3">
            {hasFinished ? (
              <Button className="bg-[#27272a] px-8 text-white hover:bg-[#333]" onClick={onClose} type="button" variant="secondary">
                Close
              </Button>
            ) : (
              <Button className="h-auto gap-2 rounded-lg border-0 bg-green-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:scale-105 hover:bg-green-500 active:scale-95 disabled:scale-100" disabled={selectedAccountIds.size === 0 || isPublishing} onClick={handlePublish} type="button">
                <Send size={16} /> {isPublishing ? 'Publishing...' : 'Send'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
