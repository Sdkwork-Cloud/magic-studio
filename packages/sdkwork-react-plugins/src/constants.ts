import { Zap, Palette, Video, Music, Wand2, Sparkles, Box } from 'lucide-react';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  version: string;
  downloads: number;
  rating: number;
  author: string;
  verified: boolean;
  installed: boolean;
  price: string;
  badges: string[];
  updateAvailable: boolean;
}

export interface PluginCategory {
  id: string;
  label: string;
  icon: any;
}

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  { id: 'all', label: '全部', icon: Zap },
  { id: 'trending', label: '热门', icon: Sparkles },
  { id: 'ai', label: 'AI 工具', icon: Wand2 },
  { id: 'effects', label: '特效', icon: Video },
  { id: 'productivity', label: '效率', icon: Zap },
  { id: 'assets', label: '素材', icon: Music },
  { id: 'templates', label: '模板', icon: Box },
];

export const DEFAULT_PLUGINS: Plugin[] = [
  {
    id: 'p1',
    name: '批量处理助手',
    description: '一键批量处理多个媒体文件，提升工作效率',
    icon: Zap,
    category: 'productivity',
    version: '2.1.0',
    downloads: 45200,
    rating: 4.9,
    author: 'AI Studio',
    verified: true,
    installed: true,
    price: '免费',
    badges: ['热门', '官方'],
    updateAvailable: true
  },
  {
    id: 'p2',
    name: '高级滤镜',
    description: '50+ 专业级滤镜效果，让作品更具艺术感',
    icon: Palette,
    category: 'effects',
    version: '1.5.2',
    downloads: 32800,
    rating: 4.8,
    author: 'FilterMaster',
    verified: true,
    installed: false,
    price: '¥29',
    badges: ['精选'],
    updateAvailable: false
  },
  {
    id: 'p3',
    name: '视频转场特效',
    description: '丰富的视频转场动画效果库',
    icon: Video,
    category: 'effects',
    version: '3.0.1',
    downloads: 28500,
    rating: 4.7,
    author: 'VideoFX',
    verified: true,
    installed: true,
    price: '免费',
    badges: ['实用'],
    updateAvailable: false
  },
  {
    id: 'p4',
    name: 'AI 智能抠图',
    description: '一键精准抠图，支持复杂边缘处理',
    icon: Wand2,
    category: 'ai',
    version: '1.8.0',
    downloads: 52100,
    rating: 4.9,
    author: 'AI Tools',
    verified: true,
    installed: false,
    price: '¥19',
    badges: ['AI', '热门'],
    updateAvailable: true
  },
];
