import React, { useEffect, useState } from 'react';
import { BookOpen, RefreshCcw, Search, Star } from 'lucide-react';
import {
  promptLibraryService,
  type PromptLibraryRecord,
  type PromptRecordBizType,
  type PromptRecordType,
  type ScopedSdkInstance,
} from '@sdkwork/react-core';
import { Dialog, DialogContent, Input } from '@sdkwork/react-commons/ui';

type PromptLibrarySource = 'all' | 'popular' | 'favorites';

interface PromptPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (record: PromptLibraryRecord) => void;
  promptBizType?: PromptRecordBizType;
  promptType?: PromptRecordType;
  promptInstance?: ScopedSdkInstance;
}

function resolvePromptLoader(source: PromptLibrarySource) {
  if (source === 'popular') {
    return promptLibraryService.listPopularPrompts;
  }
  if (source === 'favorites') {
    return promptLibraryService.listMostFavoritedPrompts;
  }
  return promptLibraryService.listPrompts;
}

function formatMeta(record: PromptLibraryRecord): string {
  const parts: string[] = [];
  if (record.bizType && record.bizType !== 'DEFAULT') {
    parts.push(record.bizType);
  }
  if (record.model) {
    parts.push(record.model);
  }
  if (record.usageCount > 0) {
    parts.push(`${record.usageCount} uses`);
  }
  return parts.join(' · ');
}

export const PromptPickerDialog: React.FC<PromptPickerDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  promptBizType,
  promptType,
  promptInstance,
}) => {
  const [source, setSource] = useState<PromptLibrarySource>('all');
  const [keyword, setKeyword] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [records, setRecords] = useState<PromptLibraryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const loader = resolvePromptLoader(source);
        const result = await loader({
          size: 20,
          keyword: keyword || undefined,
          bizType: promptBizType,
          type: promptType,
          instance: promptInstance,
        });
        if (!active) {
          return;
        }
        setRecords(result.items);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Failed to load prompt library.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [keyword, open, promptBizType, promptInstance, promptType, reloadToken, source]);

  const handleFavoriteToggle = async (record: PromptLibraryRecord) => {
    try {
      if (record.isFavorite) {
        await promptLibraryService.unfavoritePrompt(record.id, promptInstance);
      } else {
        await promptLibraryService.favoritePrompt(record.id, promptInstance);
      }
      setRecords((current) =>
        current.map((item) =>
          item.id === record.id
            ? {
                ...item,
                isFavorite: !item.isFavorite,
                favoriteCount: Math.max(0, item.favoriteCount + (item.isFavorite ? -1 : 1)),
              }
            : item
        )
      );
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : 'Failed to update favorite state.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative w-full max-w-3xl rounded-2xl border border-[#2a2a30] bg-[#121214] p-0 shadow-2xl">
        <div className="border-b border-[#27272a] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Prompt Library</h2>
              <p className="text-xs text-gray-400">Choose reusable prompts from the official prompt library.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {([
              ['all', 'All'],
              ['popular', 'Popular'],
              ['favorites', 'Top Favorites'],
            ] as Array<[PromptLibrarySource, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSource(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  source === value
                    ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                    : 'border-[#2f2f35] bg-[#1a1a1d] text-gray-400 hover:border-[#3a3a42] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReloadToken((current) => current + 1)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#2f2f35] bg-[#1a1a1d] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-[#3a3a42] hover:text-white"
            >
              <RefreshCcw size={12} />
              Refresh
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search prompts..."
              className="pl-9"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-xl border border-[#2a2a30] bg-[#18181b] px-4 py-8 text-center text-sm text-gray-400">
                Loading prompts...
              </div>
            ) : null}

            {!loading && records.length === 0 ? (
              <div className="rounded-xl border border-[#2a2a30] bg-[#18181b] px-4 py-8 text-center text-sm text-gray-400">
                No prompts found for the current filter.
              </div>
            ) : null}

            {!loading &&
              records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-[#2a2a30] bg-[#18181b] px-4 py-3 transition-colors hover:border-[#3a3a42]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">{record.title}</h3>
                        {record.isPublic ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            Public
                          </span>
                        ) : null}
                      </div>
                      {record.description ? (
                        <p className="mt-1 text-xs text-gray-400">{record.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleFavoriteToggle(record)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        record.isFavorite
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-[#2f2f35] bg-[#1a1a1d] text-gray-500 hover:text-white'
                      }`}
                      title={record.isFavorite ? 'Unfavorite prompt' : 'Favorite prompt'}
                    >
                      <Star size={14} className={record.isFavorite ? 'fill-current' : ''} />
                    </button>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-200">{record.content}</p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-500">{formatMeta(record)}</span>
                    <button
                      type="button"
                      onClick={() => onSelect(record)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
                    >
                      Use Prompt
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
