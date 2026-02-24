
import React from 'react';
import { Plus } from 'lucide-react';

interface SceneInsertionZoneProps {
    index: number;
    onInsert: (index: number) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export const SceneInsertionZone: React.FC<SceneInsertionZoneProps> = ({ index, onInsert, isFirst, isLast }) => {
    return (
        <div 
            className={`
                group flex items-center justify-center h-4 hover:h-12 -my-2 z-10 relative transition-all duration-200 cursor-pointer
                ${isFirst ? 'mb-2 h-8 hover:h-16' : ''} 
                ${isLast ? 'mt-2 h-16 hover:h-20' : ''}
            `}
            onClick={() => onInsert(index)}
        >
            {/* Visual Line */}
            <div className={`
                w-full h-[2px] bg-blue-500/0 group-hover:bg-blue-500/50 transition-colors absolute
                ${isFirst || isLast ? 'hidden' : 'block'}
            `} />
            
            {/* Dashed placeholder box for start/end */}
            {(isFirst || isLast) && (
                <div className="w-full h-full border-2 border-dashed border-transparent group-hover:border-blue-500/20 rounded-lg absolute transition-colors" />
            )}

            {/* Floating Action Button */}
            <div className="absolute opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-blue-600 text-white rounded-full py-1.5 px-4 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200 hover:bg-blue-500">
                <Plus size={14} strokeWidth={3} />
                <span className="text-xs font-bold uppercase tracking-wider">
                    {isFirst ? 'Insert Scene Before' : isLast ? 'Append Scene' : 'Insert Scene'}
                </span>
            </div>
        </div>
    );
};
