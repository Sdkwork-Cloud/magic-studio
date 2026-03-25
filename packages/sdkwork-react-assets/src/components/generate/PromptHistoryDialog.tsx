import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import {
  promptLibraryService,
  type PromptHistoryRecord,
  type ScopedSdkInstance,
} from '@sdkwork/react-core';
import { Dialog, DialogContent, Input } from '@sdkwork/react-commons/ui';
import { useTranslation } from '@sdkwork/react-i18n';
import { resolvePromptHistoryContent } from './promptPickerUtils';

interface PromptHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (record: PromptHistoryRecord) => void;
  promptInstance?: ScopedSdkInstance;
}

function formatHistoryMeta(record: PromptHistoryRecord, t: (key: string, options?: Record<string, any>) => string): string {
  const parts: string[] = [];
  if (record.model) {
    parts.push(record.model);
  }
  if (record.createdAt) {
    parts.push(record.createdAt);
  }
  if (record.success === false) {
    parts.push(t('assetCenter.promptHistory.failed'));
  }
  return parts.join(' · ');
}

export const PromptHistoryDialog: React.FC<PromptHistoryDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  promptInstance,
}) => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [records, setRecords] = useState<PromptHistoryRecord[]>([]);
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
        const result = await promptLibraryService.listPromptHistory({
          size: 20,
          keyword: keyword || undefined,
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
        setError(loadError instanceof Error ? loadError.message : t('assetCenter.promptHistory.failedToLoad'));
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
  }, [keyword, open, promptInstance, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative w-full max-w-3xl rounded-2xl border border-[#2a2a30] bg-[#121214] p-0 shadow-2xl">
        <div className="border-b border-[#27272a] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2 text-orange-300">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('assetCenter.promptHistory.title')}</h2>
              <p className="text-xs text-gray-400">{t('assetCenter.promptHistory.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t('assetCenter.promptHistory.searchPlaceholder')}
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
                {t('assetCenter.promptHistory.loading')}
              </div>
            ) : null}

            {!loading && records.length === 0 ? (
              <div className="rounded-xl border border-[#2a2a30] bg-[#18181b] px-4 py-8 text-center text-sm text-gray-400">
                {t('assetCenter.promptHistory.empty')}
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
                      <h3 className="truncate text-sm font-semibold text-white">{record.title}</h3>
                      <span className="text-[11px] text-gray-500">{formatHistoryMeta(record, t)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect(record)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
                    >
                      {t('assetCenter.promptHistory.reuse')}
                    </button>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-200">
                    {resolvePromptHistoryContent(record)}
                  </p>

                  {record.promptContent && record.usedContent && record.usedContent !== record.promptContent ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {t('assetCenter.promptHistory.basePrompt', { content: record.promptContent })}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
