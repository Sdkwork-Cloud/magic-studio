
import { VideoTask } from '@sdkwork/react-commons'
import { PromptText } from '@sdkwork/react-assets'
import React from 'react';
;
import { 
    Download, Trash2, Copy, Repeat2, Film, AlertCircle 
} from 'lucide-react';
import { platform } from '@sdkwork/react-core';
;

interface VideoGenerationItemProps {
    task: VideoTask;
    onDelete: (id: string) => void;
    onReuse: (task: VideoTask) => void;
}

export const VideoGenerationItem: React.FC<VideoGenerationItemProps> = ({ task, onDelete, onReuse }) => {
    const videoUrl = task.results?.[0]?.url;

    const handleDownload = () => {
        if (videoUrl) {
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = `video-${task.id}.mp4`;
            a.click();
        }
    };

    return (
        <div className="group relative bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-all duration-300 hover:shadow-xl">
             {/* Header */}
             <div className="p-4 border-b border-[#222]">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="flex items-center gap-1.5 text-pink-400 bg-[#252526] px-1.5 py-0.5 rounded border border-[#333]">
                                <Film size={10} />
                                <span className="text-[10px] font-bold uppercase">Video</span>
                             </div>
                             <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(task.createdAt).toLocaleString()}
                             </span>
                             <span className="text-[10px] text-gray-600 border border-[#333] px-1.5 py-0.5 rounded uppercase font-medium bg-[#111]">
                                {task.config.aspectRatio} ï¿?{task.config.resolution}
                             </span>
                        </div>
                        <PromptText text={task.config.prompt} className="mt-1" />
                    </div>
                </div>
             </div>

             {/* Content */}
             <div className="p-4 bg-[#141414]">
                 {task.status === 'pending' ? (
                     <div className="w-full aspect-video bg-[#111] rounded-lg border border-[#27272a] border-dashed flex flex-col items-center justify-center text-pink-400 gap-3">
                        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium animate-pulse">Generating video... (this may take a few minutes)</span>
                    </div>
                 ) : task.status === 'failed' ? (
                    <div className="w-full h-32 bg-red-900/10 border border-red-900/30 rounded-lg flex flex-col items-center justify-center text-red-400 gap-2">
                         <AlertCircle size={24} />
                         <span className="text-xs">{task.error || 'Video generation failed'}</span>
                    </div>
                 ) : videoUrl && (
                     <div className="w-full flex justify-center bg-black rounded-lg overflow-hidden border border-[#27272a]">
                         <video 
                            src={videoUrl} 
                            controls 
                            className="max-h-[500px] w-full object-contain"
                            style={{ aspectRatio: task.config.aspectRatio === '16:9' ? '16/9' : '9/16' }}
                         />
                     </div>
                 )}
             </div>

             {/* Footer */}
             <div className="px-4 py-2 flex items-center justify-between gap-2 bg-[#18181b] border-t border-[#27272a]">
                <button 
                    onClick={() => onReuse(task)}
                    className="text-xs text-gray-500 hover:text-pink-400 flex items-center gap-1 transition-colors"
                >
                    <Repeat2 size={12} /> Regenerate
                </button>

                <div className="flex items-center gap-2">
                    {task.status === 'completed' && (
                        <button 
                            onClick={handleDownload}
                            className="p-2 text-gray-500 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download size={14} />
                        </button>
                    )}
                    <div className="w-[1px] h-3 bg-[#333]" />
                    <button 
                        onClick={() => platform.copy(task.config.prompt)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors"
                        title="Copy Prompt"
                    >
                        <Copy size={14} />
                    </button>
                    <button 
                        onClick={() => onDelete(task.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#2d2d2d] rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
             </div>
        </div>
    );
};
