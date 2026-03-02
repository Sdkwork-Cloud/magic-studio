import React, { useEffect } from 'react';
import type { Asset } from '../entities';
import { X, File as FileIcon, Film, Image as ImageIcon, Volume2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useAssetUrl } from '../hooks/useAssetUrl';
import { resolveAssetUrlByAssetIdFirst } from '../asset-center';

export interface AssetPreviewModalProps {
  asset: Asset;
  onClose: () => void;
}

export const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({ asset, onClose }) => {
  const { t } = useTranslation();
  const { url, loading } = useAssetUrl(asset, { resolver: resolveAssetUrlByAssetIdFirst });
  const previewUrl = url || asset.path;
  const hasRenderableUrl = !!previewUrl && !previewUrl.startsWith('assets://');
  const isImage = asset.type === 'image' || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(asset.path);
  const isVideo = asset.type === 'video' || /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(asset.path);
  const isAudio = ['audio', 'music', 'voice', 'sfx'].includes(asset.type);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-[#1a1a1a]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#333] p-6">
          <h2 className="text-xl font-bold text-white">{asset.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="flex min-h-[320px] items-center justify-center p-6 sm:min-h-[400px] sm:p-8">
          {loading && (
            <p className="text-gray-400">{t('common.status.loading', 'Loading...')}</p>
          )}
          {!loading && isImage && hasRenderableUrl && (
            <img src={previewUrl} alt={asset.name} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          )}
          {!loading && isVideo && hasRenderableUrl && (
            <video src={previewUrl} className="max-h-[70vh] max-w-full rounded-lg" controls />
          )}
          {!loading && isAudio && hasRenderableUrl && (
            <div className="flex w-full max-w-xl flex-col items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#333] bg-[#252526]">
                <Volume2 size={30} className="text-emerald-400" />
              </div>
              <audio src={previewUrl} controls className="w-full" />
            </div>
          )}
          {!loading && !hasRenderableUrl && (
            <div className="text-sm text-gray-400">
              {t('assetCenter.preview.unavailable', 'Preview URL unavailable')}
            </div>
          )}
          {!loading && hasRenderableUrl && !isImage && !isVideo && !isAudio && (
            <div className="w-full max-w-xl rounded-xl border border-[#333] bg-[#111] p-6">
              <div className="flex items-center gap-3 text-gray-200">
                {asset.type === 'video'
                  ? <Film size={20} />
                  : asset.type === 'image'
                    ? <ImageIcon size={20} />
                    : <FileIcon size={20} />}
                <span className="font-medium">{asset.name}</span>
              </div>
              <div className="mt-3 break-all text-xs text-gray-400">{previewUrl}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

