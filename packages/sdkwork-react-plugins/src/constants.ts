import { Zap, Palette, Video, Music, Wand2, Sparkles, Box, Mic } from 'lucide-react';

export type PluginBadgeId =
  | 'hot'
  | 'official'
  | 'featured'
  | 'practical'
  | 'asset'
  | 'ai';

export interface Plugin {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: any;
  category: string;
  version: string;
  downloads: number;
  rating: number;
  author: string;
  verified: boolean;
  installed: boolean;
  priceCny?: number;
  badges: PluginBadgeId[];
  updateAvailable: boolean;
}

export interface PluginCategory {
  id: string;
  labelKey: string;
  icon: any;
}

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  { id: 'all', labelKey: 'plugins.categories.all', icon: Zap },
  { id: 'trending', labelKey: 'plugins.categories.trending', icon: Sparkles },
  { id: 'ai', labelKey: 'plugins.categories.ai', icon: Wand2 },
  { id: 'effects', labelKey: 'plugins.categories.effects', icon: Video },
  { id: 'productivity', labelKey: 'plugins.categories.productivity', icon: Zap },
  { id: 'assets', labelKey: 'plugins.categories.assets', icon: Music },
  { id: 'templates', labelKey: 'plugins.categories.templates', icon: Box },
];

export const DEFAULT_PLUGINS: Plugin[] = [
  {
    id: 'batch_assistant',
    nameKey: 'plugins.items.batch_assistant.name',
    descriptionKey: 'plugins.items.batch_assistant.description',
    icon: Zap,
    category: 'productivity',
    version: '2.1.0',
    downloads: 45200,
    rating: 4.9,
    author: 'AI Studio',
    verified: true,
    installed: true,
    badges: ['hot', 'official'],
    updateAvailable: true,
  },
  {
    id: 'premium_filters',
    nameKey: 'plugins.items.premium_filters.name',
    descriptionKey: 'plugins.items.premium_filters.description',
    icon: Palette,
    category: 'effects',
    version: '1.5.2',
    downloads: 32800,
    rating: 4.8,
    author: 'FilterMaster',
    verified: true,
    installed: false,
    priceCny: 29,
    badges: ['featured'],
    updateAvailable: false,
  },
  {
    id: 'transition_fx',
    nameKey: 'plugins.items.transition_fx.name',
    descriptionKey: 'plugins.items.transition_fx.description',
    icon: Video,
    category: 'effects',
    version: '3.0.1',
    downloads: 28500,
    rating: 4.7,
    author: 'VideoFX',
    verified: true,
    installed: true,
    badges: ['practical'],
    updateAvailable: false,
  },
  {
    id: 'smart_cutout',
    nameKey: 'plugins.items.smart_cutout.name',
    descriptionKey: 'plugins.items.smart_cutout.description',
    icon: Wand2,
    category: 'ai',
    version: '1.8.0',
    downloads: 52100,
    rating: 4.9,
    author: 'AI Tools',
    verified: true,
    installed: false,
    priceCny: 19,
    badges: ['ai', 'hot'],
    updateAvailable: true,
  },
  {
    id: 'sound_pack',
    nameKey: 'plugins.items.sound_pack.name',
    descriptionKey: 'plugins.items.sound_pack.description',
    icon: Music,
    category: 'assets',
    version: '2.3.0',
    downloads: 19600,
    rating: 4.6,
    author: 'SoundLab',
    verified: false,
    installed: false,
    priceCny: 39,
    badges: ['asset'],
    updateAvailable: false,
  },
  {
    id: 'voice_booster',
    nameKey: 'plugins.items.voice_booster.name',
    descriptionKey: 'plugins.items.voice_booster.description',
    icon: Mic,
    category: 'ai',
    version: '1.2.5',
    downloads: 15800,
    rating: 4.8,
    author: 'AudioAI',
    verified: true,
    installed: true,
    badges: ['ai', 'practical'],
    updateAvailable: false,
  },
];
