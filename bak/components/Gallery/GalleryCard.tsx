
import React, { useRef, useState, useEffect } from 'react';
import { Play, Heart, Image as ImageIcon, Clapperboard, Eye } from 'lucide-react';
import { GalleryItem } from '../../types/gallery';

interface GalleryCardProps {
    item: GalleryItem;
    onClick: (item: GalleryItem) => void;
    className?: string;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ item, onClick, className = '' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-play video preview on hover
    useEffect(() => {
        if (item.type === 'video' && item.videoUrl && videoRef.current) {
            if (isHovered) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isHovered, item.type, item.videoUrl]);

    // Aspect Ratio styles
    const getAspectClass = (ratio: string) => {
        switch(ratio) {
            case '16:9': return 'aspect-video';
            case '9:16': return 'aspect-[9/16]';
            case '1:1': return 'aspect-square';
            case '4:3': return 'aspect-[4/3]';
            case '3:4': return 'aspect-[3/4]';
            case '21:9': return 'aspect-[21/9]';
            default: return 'aspect-video';
        }
    };

    const getTypeIcon = () => {
        switch(item.type) {
            case 'video': return <Play size={10} fill="currentColor" />;
            case 'image': return <ImageIcon size={10} />;
            case 'short': return <Clapperboard size={10} />;
        }
    };

    return (
        <div 
            onClick={() => onClick(item)}
            className={`group relative rounded-xl overflow-hidden bg-[#121212] cursor-pointer border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 break-inside-avoid mb-4 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Media Layer */}
            <div className={`w-full ${getAspectClass(item.aspectRatio)} relative overflow-hidden bg-[#1a1a1a]`}>
                <img 
                    src={item.url} 
                    alt={item.title} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isHovered && item.videoUrl ? 'opacity-0' : 'opacity-100'}`}
                    loading="lazy"
                />
                
                {item.type === 'video' && item.videoUrl && (
                    <video
                        ref={videoRef}
                        src={item.videoUrl}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        muted
                        loop
                        playsInline
                    />
                )}
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 opacity-40 group-hover:opacity-80 transition-opacity" />

                {/* Top Right Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                    <div className="p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white/90 border border-white/10 shadow-sm">
                        {getTypeIcon()}
                    </div>
                    {item.badges?.map((badge, i) => (
                        <div key={i} className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full shadow-lg backdrop-blur-sm text-white ${badge.color || 'bg-blue-600/90'}`}>
                            {badge.text}
                        </div>
                    ))}
                </div>

                {/* Center Play Icon (Hover) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                     <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/30 hover:bg-white hover:text-black transition-colors shadow-2xl">
                         {item.type === 'image' ? <Eye size={18} /> : <Play size={18} fill="currentColor" className="ml-1" />}
                     </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-1 drop-shadow-md pr-12">{item.title}</h3>
                    
                    <div className="flex items-center justify-between">
                        {/* Author */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden ring-1 ring-white/20 ${item.author.color || 'bg-gray-700'}`}>
                                {item.author.avatar ? (
                                    <img src={item.author.avatar} className="w-full h-full object-cover" alt={item.author.name} />
                                ) : (
                                    item.author.initial || item.author.name[0]
                                )}
                            </div>
                            <span className="text-[10px] text-gray-300 font-medium truncate drop-shadow-sm hover:text-white transition-colors">{item.author.name}</span>
                        </div>

                        {/* Likes */}
                        <div className="flex items-center gap-1 text-[10px] text-white/90 font-medium bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
                            <Heart size={10} className={item.stats.isLiked ? "fill-red-500 text-red-500" : "text-white"} />
                            {item.stats.likes}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
