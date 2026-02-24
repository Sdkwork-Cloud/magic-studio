
import React from 'react';
import { Music, AlertCircle } from 'lucide-react';
import { BaseUpload } from './BaseUpload';
import { BaseUploadProps } from './types';
import { useAssetUrl } from '../../hooks/useAssetUrl';

export const AudioUpload: React.FC<BaseUploadProps> = (props) => {
    const { url: resolvedSrc, loading: isResolving } = useAssetUrl(props.value);

    return (
        <BaseUpload 
            {...props}
            accept="audio/*"
            defaultIcon={<Music size={24} />}
            resolvedUrl={resolvedSrc}
            isResolving={isResolving}
            renderPreview={(url, isLoading) => {
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#18181b] p-4 text-center">
                        <Music size={32} className="text-gray-500 mb-2" />
                        <span className="text-[10px] text-gray-400 break-all line-clamp-2 px-2">
                            {props.value?.split('/').pop()}
                        </span>
                        {url && <audio src={url} className="hidden" />} 
                    </div>
                );
            }}
        />
    );
};
