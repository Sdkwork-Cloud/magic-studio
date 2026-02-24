
import React from 'react';
import { Flame, Play, Eye } from 'lucide-react';

const MOCK_FEED = [
    { id: 1, title: 'Cyberpunk City', user: 'NeonDrifter', views: '2.2K', img: 'https://images.unsplash.com/photo-1545459720-aac3e5c2e924?q=80&w=400', badge: '最新' },
    { id: 2, title: 'Deep Space', user: 'AstroBoy', views: '1.8K', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400' },
    { id: 3, title: 'Portrait Study', user: 'ArtAI', views: '455', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400', badge: '热门' },
    { id: 4, title: 'Abstract Flow', user: 'MotionMaster', views: '12K', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400' },
    { id: 5, title: 'Nature Loop', user: 'EcoGen', views: '639', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400', badge: '最新' },
];

export const ViralFeed: React.FC = () => {
    return (
        <div>
             <div className="flex items-center gap-2 mb-4 px-1">
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded w-fit">
                     病毒性的 (Viral)
                 </h3>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {MOCK_FEED.map(item => (
                     <div key={item.id} className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border border-[#27272a] hover:border-gray-500 transition-all">
                         <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title} />
                         
                         {/* Gradient Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                         
                         {/* Badge */}
                         {item.badge && (
                             <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                 {item.badge}
                             </div>
                         )}

                         {/* Views */}
                         <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                             <Flame size={10} className="text-orange-500 fill-orange-500" />
                             {item.views}
                         </div>
                         
                         {/* Play Button */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                             <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                                 <Play size={16} fill="currentColor" />
                             </div>
                         </div>

                         {/* Footer Info */}
                         <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                             <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{item.title}</h4>
                             <div className="flex items-center gap-1.5">
                                 <div className="w-4 h-4 rounded-full bg-gray-700 overflow-hidden">
                                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user}`} alt="avatar" />
                                 </div>
                                 <span className="text-[10px] text-gray-400">{item.user}</span>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};
