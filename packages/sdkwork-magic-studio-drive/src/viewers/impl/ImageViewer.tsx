
import React from 'react';
import { FileViewerProps } from '../types';

export const ImageViewer: React.FC<FileViewerProps> = ({ item, url }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#000000] overflow-hidden p-4">
            <img 
                src={url} 
                alt={item.name} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
            />
        </div>
    );
};
