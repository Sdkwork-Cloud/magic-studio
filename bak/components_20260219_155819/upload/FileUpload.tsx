
import React from 'react';
import { File, AlertCircle } from 'lucide-react';
import { BaseUpload } from './BaseUpload';
import { BaseUploadProps } from './types';
import { useAssetUrl } from '../../hooks/useAssetUrl';

export const FileUpload: React.FC<BaseUploadProps> = (props) => {
    const { url: resolvedSrc, loading: isResolving } = useAssetUrl(props.value);

    return (
        <BaseUpload 
            {...props}
            accept="*/*"
            defaultIcon={<File size={24} />}
            resolvedUrl={resolvedSrc}
            isResolving={isResolving}
            renderPreview={(url, isLoading) => {
                if (isLoading) return null;

                // File doesn't really need a URL preview, just metadata display
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#18181b] p-4 text-center">
                        <File size={32} className="text-gray-500 mb-2" />
                        <span className="text-[10px] text-gray-400 break-all line-clamp-2 px-2">
                            {props.value?.split('/').pop()}
                        </span>
                    </div>
                );
            }}
        />
    );
};
