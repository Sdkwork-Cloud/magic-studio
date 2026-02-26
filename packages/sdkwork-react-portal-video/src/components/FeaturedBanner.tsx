
import { useRouter, ROUTES } from '@sdkwork/react-core'
import React from 'react';
import { ArrowRight } from 'lucide-react';
;
;

export const FeaturedBanner: React.FC = () => {
    // Use useRouter safely - it returns default values if not wrapped in RouterProvider
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {/* Card 1: OpenStudio (Video Generation) */}
            <BannerCard 
                title="OPEN STUDIO"
                subtitle="AI Video Gen"
                description="Create cinematic videos with text prompts"
                image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
                badge="CORE"
                badgeColor="bg-blue-600"
                onClick={() => navigate(ROUTES.VIDEO)}
            />
            
            {/* Card 2: Magic Cut (Editor) */}
            <BannerCard 
                title="MAGIC CUT"
                subtitle="Smart Editor"
                description="AI-native non-linear video editing"
                image="https://images.unsplash.com/photo-1574717436423-a75aa92f3523?q=80&w=1200&auto=format&fit=crop"
                tag="Beta"
                tagColor="bg-gradient-to-r from-red-500 to-pink-500"
                onClick={() => navigate(ROUTES.MAGIC_CUT)}
            />
            
            {/* Card 3: OpenChat (Agent) */}
            <BannerCard 
                title="OPEN CHAT"
                subtitle="AI Agent"
                description="Your open source intelligent companion"
                image="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop"
                badge="NEW"
                badgeColor="bg-emerald-500"
                onClick={() => navigate(ROUTES.CHAT)}
            />
        </div>
    );
};

const BannerCard: React.FC<{ 
    title: string; 
    subtitle: string; 
    description: string; 
    image: string; 
    badge?: string; 
    badgeColor?: string; 
    tag?: string; 
    tagColor?: string;
    onClick?: () => void;
}> = ({ title, subtitle, description, image, badge, badgeColor, tag, tagColor, onClick }) => (
    <div 
        onClick={onClick}
        className="group relative aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(0,0,0,0.4)]"
    >
        {/* Background Image with Zoom */}
        <div className="absolute inset-0 bg-black">
             <img src={image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-60" alt={title} />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                {/* Subtitle Row */}
                <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">{subtitle}</span>
                    {tag && <span className={`px-2 py-0.5 text-[9px] font-bold text-white rounded-full shadow-lg ${tagColor}`}>{tag}</span>}
                </div>

                {/* Title */}
                <h3 className="text-3xl font-black text-white italic tracking-wide mb-3 uppercase leading-[0.9] drop-shadow-xl">
                    {title}
                </h3>
                
                {/* Description & Action */}
                <div className="flex items-center justify-between mt-4">
                     <p className="text-sm font-medium text-gray-300 max-w-[70%] line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                         {description}
                     </p>
                     <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 delay-300 translate-x-4 group-hover:translate-x-0">
                         <ArrowRight size={18} strokeWidth={2.5} />
                     </button>
                </div>
            </div>
        </div>

        {/* Top Badge */}
        {badge && (
             <div className={`absolute top-4 left-4 ${badgeColor || 'bg-blue-600'} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider backdrop-blur-md border border-white/20`}>
                 {badge}
             </div>
        )}
    </div>
);
