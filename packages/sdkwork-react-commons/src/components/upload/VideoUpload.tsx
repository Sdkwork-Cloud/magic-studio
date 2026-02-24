
import React from 'react';
import { Film, AlertCircle } from 'lucide-react';
import { BaseUpload } from './BaseUpload';
import { BaseUploadProps } from './types';
import { useAssetUrl } from '../../hooks/useAssetUrl';

export const VideoUpload: React.FC<BaseUploadProps> = (props) => {
    const { url: resolvedSrc, loading: isResolving } = useAssetUrl(props.value);

    return (
        <BaseUpload 
            {...props}
            accept="video/*"
            defaultIcon={<Film size={24} />}
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
                    <video 
                        src={url} 
                        className={`w-full h-full object-${props.fit || 'contain'} bg-black`} 
                        controls={false}
                        muted 
                        loop 
                        onMouseOver={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                        onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                    />
                );
            }}
        />
    );
};
