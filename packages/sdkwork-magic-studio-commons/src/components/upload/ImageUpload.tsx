
import React from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { BaseUpload } from './BaseUpload';
import { BaseUploadProps } from './types';
import { useRenderableAssetUrl } from '../../hooks/useAssetUrl';

export const ImageUpload: React.FC<BaseUploadProps> = (props) => {
    const { url: resolvedSrc, loading: isResolving } = useRenderableAssetUrl(props.value, {
        resolver: props.assetUrlResolver,
    });

    return (
        <BaseUpload 
            {...props}
            accept="image/*"
            defaultIcon={<ImageIcon size={24} />}
            resolvedUrl={resolvedSrc}
            isResolving={isResolving}
            renderPreview={(url, isLoading) => {
                // If loading, let BaseUpload show the spinner
                if (isLoading) return null;

                if (!url) {
                    return (
                        <div className="flex flex-col items-center text-red-400">
                             <AlertCircle size={20} className="mb-1" />
                             <span className="text-[10px]">Load Failed</span>
                        </div>
                    );
                }
                return (
                    <img 
                        src={url} 
                        alt="Preview" 
                        className={`w-full h-full object-${props.fit || 'contain'}`} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                );
            }}
        />
    );
};
