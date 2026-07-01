import {
  Bot,
  Brain,
  Code,
  FileText,
  Globe,
  ImageIcon,
  Layers,
  Mic,
  Music,
  Puzzle,
  TrendingUp,
  Users,
  Video,
  Workflow,
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
  { id: 'all', label: 'All', icon: Globe, description: 'All skills' },
  { id: 'video', label: 'Video', icon: Video, description: 'Video generation, editing, and processing' },
  { id: 'image', label: 'Image', icon: ImageIcon, description: 'Image generation, editing, and style transfer' },
  { id: 'music', label: 'Music', icon: Music, description: 'Music generation and soundtrack tooling' },
  { id: 'audio', label: 'Audio', icon: Mic, description: 'Speech, dubbing, and audio post-processing' },
  { id: 'character', label: 'Character', icon: Users, description: 'AI character and avatar workflows' },
  { id: 'productivity', label: 'Productivity', icon: FileText, description: 'Documents, translation, and office helpers' },
  { id: 'development', label: 'Development', icon: Code, description: 'Code generation, debugging, and testing' },
  { id: 'automation', label: 'Automation', icon: Workflow, description: 'Workflow orchestration and task automation' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, description: 'Data analysis and visualization' },
  { id: '3d', label: '3D', icon: Layers, description: '3D modeling and rendering workflows' },
  { id: 'chatbot', label: 'Chatbot', icon: Bot, description: 'Conversational assistants and service bots' },
  { id: 'mindmap', label: 'Mind Map', icon: Brain, description: 'Mind mapping and note organization' },
  { id: 'collage', label: 'Collage', icon: Puzzle, description: 'Image composition and collage layouts' },
];

export const SKILL_TAGS = [
  { id: 'ai', label: 'AI', color: 'indigo' },
  { id: 'video', label: 'Video', color: 'pink' },
  { id: 'image', label: 'Image', color: 'purple' },
  { id: 'music', label: 'Music', color: 'yellow' },
  { id: 'audio', label: 'Audio', color: 'green' },
  { id: 'code', label: 'Code', color: 'blue' },
  { id: 'automation', label: 'Automation', color: 'orange' },
  { id: 'prompt', label: 'Prompt', color: 'cyan' },
  { id: 'editing', label: 'Editing', color: 'red' },
  { id: 'generation', label: 'Generation', color: 'violet' },
  { id: 'analysis', label: 'Analysis', color: 'teal' },
  { id: 'translation', label: 'Translation', color: 'emerald' },
];
