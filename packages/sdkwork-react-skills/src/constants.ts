import {
    Video, Users, ImageIcon, Music, Mic,
    FileText, Code, TrendingUp, Layers, Globe,
    Workflow, Bot, Brain, Puzzle
} from 'lucide-react';

export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    icon: any;
    category: string;
    author: {
        name: string;
        verified: boolean;
    };
    rating: number;
    users: number;
    downloads: number;
    tags: string[];
    featured: boolean;
    premium: boolean;
    capabilities: string[];
    compatibility: string[];
    updatedAt: string;
    version: string;
    size?: string;
    permissions?: string[];
    changelog?: Array<{
        version: string;
        date: string;
        changes: string[];
    }>;
}

export interface SkillCategory {
    id: string;
    label: string;
    icon: any;
    description: string;
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    { id: 'all', label: '全部', icon: Globe, description: '所有技能' },
    { id: 'video', label: '视频', icon: Video, description: '视频生成、编辑、处理' },
    { id: 'image', label: '图片', icon: ImageIcon, description: '图片生成、编辑、风格转换' },
    { id: 'music', label: '音乐', icon: Music, description: '音乐生成、音频处理' },
    { id: 'audio', label: '音频', icon: Mic, description: '语音合成、配音、音效' },
    { id: 'character', label: '数字人', icon: Users, description: '数字人、虚拟角色' },
    { id: 'productivity', label: '生产力', icon: FileText, description: '文档、翻译、办公' },
    { id: 'development', label: '开发', icon: Code, description: '代码生成、调试、测试' },
    { id: 'automation', label: '自动化', icon: Workflow, description: '工作流、任务自动化' },
    { id: 'analytics', label: '分析', icon: TrendingUp, description: '数据分析、可视化' },
    { id: '3d', label: '3D', icon: Layers, description: '3D 建模、渲染' },
    { id: 'chatbot', label: '机器人', icon: Bot, description: '聊天机器人、客服' },
    { id: 'mindmap', label: '思维导图', icon: Brain, description: '思维导图、笔记' },
    { id: 'collage', label: '拼图', icon: Puzzle, description: '图片拼接、collage' },
];

export const SKILL_TAGS = [
    { id: 'ai', label: 'AI', color: 'indigo' },
    { id: 'video', label: '视频', color: 'pink' },
    { id: 'image', label: '图片', color: 'purple' },
    { id: 'music', label: '音乐', color: 'yellow' },
    { id: 'audio', label: '音频', color: 'green' },
    { id: 'code', label: '代码', color: 'blue' },
    { id: 'automation', label: '自动化', color: 'orange' },
    { id: 'prompt', label: '提示词', color: 'cyan' },
    { id: 'editing', label: '编辑', color: 'red' },
    { id: 'generation', label: '生成', color: 'violet' },
    { id: 'analysis', label: '分析', color: 'teal' },
    { id: 'translation', label: '翻译', color: 'emerald' },
];

export { AGENT_SKILLS } from './data/skills';
