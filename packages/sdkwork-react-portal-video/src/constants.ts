
import { StyleOption } from '@sdkwork/react-commons'
import { Clapperboard, Video, Image as ImageIcon, ArrowRightLeft, Layers, Bot, Music, ScanFace, Sparkles, Type } from 'lucide-react';

export const PORTAL_MODES = [
    { id: 'short_drama', label: 'AI 短剧', icon: Clapperboard, color: 'text-orange-500', desc: '一键生成连贯故事短片' },
    { id: 'video', label: 'AI 视频', icon: Video, color: 'text-pink-400', desc: '生成高品质视频片段' },
    { id: 'image', label: 'AI 图片', icon: ImageIcon, color: 'text-blue-400', desc: '生成艺术图像与素材' },
    { id: 'human', label: '数字人', icon: Bot, color: 'text-green-400', desc: 'AI 数字人播报' },
    { id: 'music', label: 'AI 音乐', icon: Music, color: 'text-indigo-400', desc: '生成背景音乐与音效' },
];

export const GEN_MODES = [
    { id: 'smart_reference', label: '全能参考', icon: Sparkles, desc: 'Intelligent Reference', validTabs: ['video'] },
    { id: 'start_end', label: '首尾帧', icon: ArrowRightLeft, desc: 'Start & End Frame', validTabs: ['video'] },
    { id: 'smart_multi', label: '智能多帧', icon: Layers, desc: 'Multi-Frame Control', validTabs: ['video'] },
    { id: 'subject_ref', label: '主体参考', icon: ScanFace, desc: 'Subject Consistency', validTabs: ['video'] },
    
    { id: 'text', label: '文生内容', icon: Type, desc: '使用提示词生成', validTabs: ['image', 'short_drama'] },
    { id: 'ref_multi', label: '参考生成', icon: Layers, desc: '上传风格参考图', validTabs: ['image', 'short_drama'] },
];

export const FILM_STYLES: StyleOption[] = [
    { 
        id: 'cinematic', label: '影视质感 (Cinematic)', 
        assets: {
            scene: { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=800&auto=format&fit=crop' },
            portrait: { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop' },
            video: { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
            sheet: { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop' }
        },
        description: '好莱坞大片质感，强调动态范围、景深与电影布光',
        usage: ['剧情', '商业广告', '史诗'],
        prompt: 'cinematic lighting, depth of field, movie still, color graded, 8k, highly detailed, atmospheric, anamorphic lens, film grain',
        prompt_zh: '电影质感光效，景深，电影剧照，专业调色，8k分辨率，高细节，氛围感，变形宽银幕镜头，胶片颗粒'
    },
    { 
        id: 'custom', label: '自定义 (Custom)', 
        assets: {}, 
        isCustom: true, 
        description: '不使用预设风格，完全根据提示词进行生成', 
        usage: ['任意场景'],
        prompt: '',
        prompt_zh: ''
    },
];
