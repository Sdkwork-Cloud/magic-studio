
import React from 'react';
import { useVideoStore } from '../store/videoStore';
import { VideoGenerationItem } from './VideoGenerationItem';
import { Film } from 'lucide-react';

export const VideoHistory: React.FC = () => {
    const { history, deleteTask, setConfig } = useVideoStore();
    const sortedHistory = [...history].reverse(); // Newest first

    if (history.length === 0) {
         return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-[#09090b] select-none">
                <div className="w-24 h-24 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
                    <Film size={40} className="opacity-20" />
                </div>
                <h3 className="text-lg font-medium text-gray-400">No Videos Yet</h3>
                <p className="text-sm opacity-60 mt-1">Start generating videos to see them here.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#09090b] overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-20">
                {sortedHistory.map(task => (
                    <VideoGenerationItem 
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onReuse={(t) => setConfig(t.config)}
                    />
                ))}
            </div>
        </div>
    );
};
