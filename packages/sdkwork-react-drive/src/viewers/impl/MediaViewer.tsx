import React from 'react';
import { FileViewerProps } from '../types';
import { Music } from 'lucide-react';

export const MediaViewer: React.FC<FileViewerProps> = ({ item, url }) => {
  const isVideo = item.mimeType?.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(item.name);

  if (isVideo) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-8">
        <video
          src={url}
          controls
          className="max-w-full max-h-full rounded-lg shadow-2xl outline-none"
          autoPlay={false}
        >
          Your browser does not support the video tag.
        </video>
        <div className="mt-4 text-gray-400 text-sm font-medium">{item.name}</div>
      </div>
    );
  }

  // Audio
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1e1e1e] to-[#000]">
      <div className="w-64 h-64 bg-[#252526] rounded-3xl shadow-2xl flex items-center justify-center mb-8 border border-[#333] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-50" />
        <Music
          size={80}
          className="text-gray-500 group-hover:text-white transition-colors duration-500 relative z-10"
        />

        {/* Visualizer bars simulation */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 flex items-end justify-center gap-1 opacity-30">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-white rounded-t-sm animate-pulse"
              style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500">Audio Preview</p>
      </div>

      <audio src={url} controls className="w-full max-w-md" />
    </div>
  );
};
