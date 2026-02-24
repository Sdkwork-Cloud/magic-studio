
import { VideoAspectRatio, VideoDuration, VideoResolution, VideoGenerationMode } from './entities/video.entity';
import { ModelProvider } from '../../components/ModelSelector/types';
import { Zap, Globe, Layers, Film, Box, Monitor, Sparkles, ArrowRightLeft, ScanFace, Grid3x3 } from 'lucide-react';
import React from 'react';
import { StyleOption } from '../../components/CreationChatInput/StyleSelector';

export const STORAGE_KEY_VIDEO_HISTORY = 'open_studio_video_history_v1';

// Unified Style List (Exact Copy from Image Constants for Consistency)
export const VIDEO_STYLES: StyleOption[] = [
    // --- 1. Realism & Film ---
    { 
        id: 'cinematic', label: '影视质感 (Cinematic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop' },
            video: { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
            sheet: { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '好莱坞大片质感，强调动态范围、景深与电影布光。',
        usage: ['剧情片', '商业广告', '史诗'],
        prompt: 'cinematic lighting, depth of field, movie still, color graded, 8k, highly detailed, atmospheric, anamorphic lens, film grain',
        prompt_zh: '电影质感光效，景深，电影剧照，专业调色，8k分辨率，高细节，氛围感，变形宽银幕镜头，胶片颗粒',
        previewColor: '#10b981'
    },
    { 
        id: 'high_sat_real', label: '高饱和写实 (High Saturation)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '色彩鲜艳浓郁的写实风格，适合展现充满活力的现代生活或自然风光。',
        usage: ['旅游', '美食', '时尚'],
        prompt: 'vibrant colors, high saturation, hyperrealistic, sharp focus, vivid, bright lighting, commercial photography, colorful, energetic',
        prompt_zh: '鲜艳色彩，高饱和度，超写实，对焦清晰，生动，明亮光照，商业摄影，色彩丰富，充满活力',
        previewColor: '#facc15'
    },
    { 
        id: 'aesthetic_real', label: '唯美写实 (Aesthetic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=800&auto=format&fit=crop' }
        },
        description: '柔光、梦幻、干净的写实画面，追求极致的视觉美感与氛围。',
        usage: ['MV', '写真', '情感剧'],
        prompt: 'soft lighting, dreamy atmosphere, ethereal, aesthetic composition, clean, gentle colors, soft focus, instagram style, elegant',
        prompt_zh: '柔和光线，梦幻氛围，空灵，唯美构图，干净，温柔色彩，柔焦，INS风，优雅',
        previewColor: '#f472b6'
    },
    { 
        id: 'retro_dv', label: '复古DV质感 (Retro DV)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1515536765-9b2a740fa475?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop' }
        },
        description: '模拟90年代手持DV录像机的低保真、噪点与色偏效果，充满怀旧生活气息。',
        usage: ['Vlog', '回忆录', '独立电影'],
        prompt: '1990s dv footage, camcorder style, vhs glitch, low resolution, noise, datamosh, handheld camera feel, home video aesthetic, timestamp',
        prompt_zh: '90年代DV录像，摄像机风格，VHS故障，低分辨率，噪点，数据损坏效果，手持镜头感，家庭录像美学，时间戳',
        previewColor: '#fb923c'
    },
    { 
        id: 'bw_film', label: '黑白电影 (B&W Film)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '经典黑白摄影，高对比度，强调光影结构与叙事张力。',
        usage: ['艺术片', '侦探', '历史'],
        prompt: 'black and white photography, film grain, high contrast, noir style, dramatic lighting, monochrome, classic cinema',
        prompt_zh: '黑白摄影，胶片颗粒，高对比度，黑色电影风格，戏剧性布光，单色，经典电影',
        previewColor: '#18181b'
    },
    { 
        id: 'wkw_style', label: '王家卫电影 (WKW Style)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1493606371202-6275828f90f3?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' }
        },
        description: '抽帧、重影、浓郁的色彩与暧昧的氛围，展现都市男女的情感纠葛。',
        usage: ['爱情', '文艺片', '情绪短片'],
        prompt: 'wong kar-wai style, neon lights, motion blur, step printing, melancholic atmosphere, vivid reds and greens, cinematic, hong kong 90s',
        prompt_zh: '王家卫风格，霓虹灯，动态模糊，抽帧效果，忧郁氛围，鲜艳的红绿色调，电影感，90年代香港',
        previewColor: '#9f1239'
    },
    { 
        id: 'iwai_style', label: '岩井俊二电影 (Iwai Style)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1509967419530-321618802007?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' }
        },
        description: '逆光、过曝、青春残酷物语，日系清新的胶片质感。',
        usage: ['青春校园', '治愈', '日系写真'],
        prompt: 'shunji iwai style, overexposed, soft focus, natural light, youthful, ethereal, pale colors, japanese film grain, airy',
        prompt_zh: '岩井俊二风格，过曝，柔焦，自然光，青春感，空灵，淡雅色彩，日系胶片颗粒，通透',
        previewColor: '#bae6fd'
    },
    { 
        id: 'japanese_anime', label: '日漫二次元 (Anime)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1560932669-5e3252f28b84?q=80&w=800&auto=format&fit=crop' }
        },
        description: '典型的新海诚或京都动画风格，色彩明快，线条细腻。',
        usage: ['青春', '幻想', '热血'],
        prompt: 'anime style, makoto shinkai, vibrant sky, detailed background, cel shaded, 2d, high production value, colorful, emotional',
        prompt_zh: '日本动画风格，新海诚，绚丽天空，精细背景，赛璐璐渲染，2D，高制作水准，色彩丰富，情感细腻',
        previewColor: '#60a5fa'
    },
    { 
        id: 'chinese_comic', label: '国风漫剧 (CN Comic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1614726365723-49cfa356c496?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop' }
        },
        description: '结合中国传统元素与现代漫画技法，色彩典雅，造型飘逸。',
        usage: ['仙侠', '古言', '玄幻'],
        prompt: 'chinese manhua style, delicate lines, ancient fantasy, ethereal, flowy robes, watercolor textures mixed with digital, elegance',
        prompt_zh: '国漫风格，细腻线条，古风玄幻，飘逸，流动长袍，水墨质感结合数码绘画，优雅',
        previewColor: '#fcd34d'
    },
    { 
        id: 'korean_manhwa', label: '韩漫二次元 (Manhwa)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1534030347209-7147fd5939d8?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1620065096574-d021c251478a?q=80&w=800&auto=format&fit=crop' }
        },
        description: '韩式条漫风格，色彩高饱和，人物修长美型，都市感强。',
        usage: ['都市恋爱', '职场', '复仇'],
        prompt: 'manhwa style, webtoon, clean lines, high contrast, vibrant colors, beautiful characters, fashion focus, sharp details, vertical scrolling aesthetic',
        prompt_zh: '韩漫风格，条漫，线条干净，高对比度，鲜艳色彩，美型角色，时尚感，细节锐利，竖屏美学',
        previewColor: '#f472b6'
    },
    { 
        id: 'cel_shaded', label: '华丽三渲二 (Cel Shaded)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1612151855475-877969f4a6cc?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1633469924738-52101af516f3?q=80&w=800&auto=format&fit=crop' }
        },
        description: '类似《原神》或《崩坏》的游戏CG质感，3D建模配合2D渲染风格。',
        usage: ['游戏', '动作', '科幻'],
        prompt: 'cel shaded, 3d rendered as 2d, genshin impact style, sharp shadows, vibrant anime colors, clean geometry, dynamic lighting, game cg',
        prompt_zh: '三渲二，卡通渲染，原神风格，锐利阴影，鲜艳动漫色彩，几何感强，动态光照，游戏CG',
        previewColor: '#818cf8'
    },
    { 
        id: 'ghibli', label: '吉卜力 (Ghibli)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1585644198335-d28075791986?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop' },
            sheet: { url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop' }
        },
        description: '宫崎骏手绘风格，色彩温暖自然，充满童话与治愈感。',
        usage: ['儿童', '治愈', '奇幻'],
        prompt: 'studio ghibli style, hayao miyazaki, hand painted background, lush nature, fluffy clouds, nostalgic, warm colors, detailed environments',
        prompt_zh: '吉卜力风格，宫崎骏，手绘背景，繁茂自然，蓬松云朵，怀旧，暖色调，环境细节丰富',
        previewColor: '#34d399'
    },
    { 
        id: 'custom', label: '自定义 (Custom)', 
        assets: {}, 
        isCustom: true, 
        description: '不使用预设风格，完全根据提示词进行生成。', 
        usage: ['任意场景'],
        prompt: '',
        prompt_zh: '',
        previewColor: '#333'
    },
];

export const VIDEO_GENERATION_MODES: { 
    id: VideoGenerationMode; 
    label: string; 
    description?: string; 
    icon: any; 
    badge?: string;
    badgeColor?: string;
}[] = [
    { 
        id: 'smart_reference', 
        label: '全能参考', 
        description: 'Intelligent Reference',
        icon: Sparkles, 
        badge: 'New',
        badgeColor: 'bg-blue-500'
    },
    { 
        id: 'start_end', 
        label: '首尾帧', 
        description: 'Start & End Frame',
        icon: ArrowRightLeft 
    },
    { 
        id: 'smart_multi', 
        label: '智能多帧', 
        description: 'Multi-Frame Control',
        icon: Layers 
    },
    { 
        id: 'subject_ref', 
        label: '主体参考', 
        description: 'Subject Consistency',
        icon: ScanFace 
    },
];

export const VIDEO_PROVIDERS: ModelProvider[] = [
    {
        id: 'sdkwork',
        name: 'Sdkwork AI',
        icon: React.createElement(Zap, { size: 14 }),
        color: 'text-yellow-400',
        models: [
            { id: 'sdkwork-2.5', name: 'Sdkwork 2.5', description: 'High fidelity video generation', badge: '最新', badgeColor: 'bg-green-500', maxAssetsCount: 5 },
            { id: 'sdkwork-turbo', name: 'Sdkwork Turbo', description: 'Fast generation for iteration', badge: 'Fast', badgeColor: 'bg-blue-500', maxAssetsCount: 3 },
        ]
    },
    {
        id: 'google',
        name: 'Google',
        icon: React.createElement(Globe, { size: 14 }),
        color: 'text-blue-500',
        models: [
            { id: 'veo-3.1', name: 'Veo 3.1', description: 'State-of-the-art video generation', badge: '音频', badgeColor: 'bg-blue-600', maxAssetsCount: 2 },
            { id: 'veo-3.1-fast', name: 'Veo 3.1 Fast', description: 'Optimized for speed', badge: '30+ 额度', badgeColor: 'bg-gray-600', maxAssetsCount: 1 },
        ]
    },
    {
        id: 'kling',
        name: 'Kling AI',
        icon: React.createElement(Layers, { size: 14 }),
        color: 'text-cyan-400',
        models: [
            { id: 'kling-1.5', name: 'Kling 1.5', description: 'High quality 1080p output', badge: '最新', badgeColor: 'bg-green-500', maxAssetsCount: 3 },
            { id: 'kling-pro', name: 'Kling Pro', description: 'Professional grade generation', maxAssetsCount: 5 },
        ]
    },
    {
        id: 'runway',
        name: 'Runway',
        icon: React.createElement(Film, { size: 14 }),
        color: 'text-pink-500',
        models: [
            { id: 'gen-3-alpha', name: 'Gen-3 Alpha', description: 'Fidelity, consistency and motion', badge: 'Pro', badgeColor: 'bg-orange-500', maxAssetsCount: 1 },
            { id: 'gen-2', name: 'Gen-2', description: 'Standard video generation', maxAssetsCount: 1 },
        ]
    },
    {
        id: 'luma',
        name: 'Luma',
        icon: React.createElement(Box, { size: 14 }),
        color: 'text-white',
        models: [
            { id: 'dream-machine', name: 'Dream Machine', description: 'High quality video from text', maxAssetsCount: 2 },
            { id: 'photon', name: 'Photon', description: 'Fast previews', maxAssetsCount: 1 },
        ]
    },
    {
        id: 'minimax',
        name: 'Hailuo AI',
        icon: React.createElement(Monitor, { size: 14 }),
        color: 'text-indigo-400',
        models: [
            { id: 'hailuo-02', name: 'Hailuo-02', description: 'Video generation by MiniMax', badge: 'HOT', badgeColor: 'bg-red-600', maxAssetsCount: 1 },
        ]
    }
];

export const VIDEO_MODELS = VIDEO_PROVIDERS.flatMap(p => 
    p.models.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        provider: p.name,
        region: 'US',
        badge: m.badge,
        maxAssetsCount: m.maxAssetsCount,
        capabilities: { maxDuration: 10, resolutions: ['720p'] as any, ratios: ['16:9'] as any }
    }))
);

export const VIDEO_ASPECT_RATIOS: { id: VideoAspectRatio; label: string; icon: string }[] = [
    { id: '16:9', label: 'Landscape', icon: '▭' },
    { id: '9:16', label: 'Portrait', icon: '▯' },
    { id: '21:9', label: 'Cinematic', icon: '▬' },
    { id: '4:3', label: 'Classic TV', icon: '□' },
    { id: '3:4', label: 'Vertical TV', icon: '▯' },
    { id: '1:1', label: 'Square', icon: '◻' },
];

export const VIDEO_DURATIONS: { id: VideoDuration; label: string; value: number }[] = [
    { id: '5s', label: 'Short (5s)', value: 5 },
    { id: '10s', label: 'Standard (10s)', value: 10 },
    { id: '60s', label: 'Long (60s)', value: 60 },
];

export const VIDEO_RESOLUTIONS: { id: VideoResolution; label: string }[] = [
    { id: '720p', label: 'HD (720p)' },
    { id: '1080p', label: 'FHD (1080p)' },
    { id: '4k', label: 'UHD (4K)' },
];
