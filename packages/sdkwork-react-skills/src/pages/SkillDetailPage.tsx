import React, { useState } from 'react';
import {
    ArrowLeft, Star, Users, Download, Share2, Heart,
    CheckCircle, ExternalLink, Package, Calendar, HardDrive,
    Shield, Zap, ChevronRight, Video, Music, Mic, Code,
    FileText, Terminal, Layers, MessageSquare, TrendingUp,
    Award, AlertCircle, Bot, Brain, Puzzle,
    ImageIcon, Palette
} from 'lucide-react';
import { useRouter, ROUTES } from '@sdkwork/react-core';
import { PortalHeader, PortalSidebar } from '@sdkwork/react-portal-video';
import { AGENT_SKILLS } from '../data/skills';

interface SkillDetailPageProps {
    skillId?: string;
    onBack?: () => void;
}

const SkillDetailPage: React.FC<SkillDetailPageProps> = ({ skillId: propSkillId, onBack }) => {
    const { navigate, currentPath } = useRouter();
    const [isInstalling, setIsInstalling] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const getIdFromPath = () => {
        const parts = currentPath.split('/');
        return parts[parts.length - 1];
    };

    const id = propSkillId || getIdFromPath();
    const skill = AGENT_SKILLS.find(s => s.id === id);

    if (!skill) {
        return (
            <div className="flex h-full bg-[#0a0a0a]">
                <PortalSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <PortalHeader />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <AlertCircle size={48} className="mx-auto text-gray-600 mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">技能不存在</h2>
                            <p className="text-gray-400 mb-6">该技能可能已被移除或移动</p>
                            <button
                                onClick={() => onBack ? onBack() : navigate(ROUTES.PORTAL_SKILLS)}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                返回技能市�?                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const Icon = skill.icon;

    const handleInstall = () => {
        setIsInstalling(true);
        setTimeout(() => {
            setIsInstalling(false);
            setIsInstalled(true);
        }, 2000);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: skill.name,
                text: skill.description,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('链接已复制到剪贴�?);
        }
    };

    const getCapabilityIcon = (capability: string) => {
        if (capability.includes('剪辑') || capability.includes('视频')) return Video;
        if (capability.includes('音乐') || capability.includes('混音')) return Music;
        if (capability.includes('语音') || capability.includes('配音')) return Mic;
        if (capability.includes('代码') || capability.includes('生成')) return Code;
        if (capability.includes('文档') || capability.includes('翻译')) return FileText;
        if (capability.includes('自动�?) || capability.includes('工作�?)) return Terminal;
        if (capability.includes('3D') || capability.includes('模型')) return Layers;
        if (capability.includes('提示�?) || capability.includes('对话')) return MessageSquare;
        if (capability.includes('分析') || capability.includes('数据')) return TrendingUp;
        if (capability.includes('图片') || capability.includes('风格')) return ImageIcon;
        if (capability.includes('艺术') || capability.includes('转换')) return Palette;
        if (capability.includes('机器�?) || capability.includes('客服')) return Bot;
        if (capability.includes('思维') || capability.includes('笔记')) return Brain;
        if (capability.includes('拼图')) return Puzzle;
        return Zap;
    };

    return (
        <div className="flex h-full bg-[#0a0a0a]">
            <PortalSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <PortalHeader />
                
                <div className="flex-1 overflow-y-auto">
                    <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
                        <div className="max-w-6xl mx-auto px-6">
                            <div className="flex items-center justify-between h-14">
                                <button
                                    onClick={() => onBack ? onBack() : navigate(ROUTES.PORTAL_SKILLS)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    <span className="text-sm">返回市场</span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleShare}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        title="分享"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsBookmarked(!isBookmarked)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            isBookmarked
                                                ? 'text-red-500 bg-red-500/10'
                                                : 'text-gray-400 hover:text-red-400 hover:bg-white/5'
                                        }`}
                                        title="收藏"
                                    >
                                        <Heart size={16} className={isBookmarked ? 'fill-red-500' : ''} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto px-6 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-6 border border-white/5">
                                    <div className="flex items-start gap-5">
                                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                                            <Icon size={40} className="text-emerald-400" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h1 className="text-2xl font-bold text-white mb-1">{skill.name}</h1>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-400">{skill.author.name}</span>
                                                        {skill.author.verified && (
                                                            <CheckCircle size={14} className="text-emerald-400" />
                                                        )}
                                                    </div>
                                                </div>
                                                {skill.featured && (
                                                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                                        <Award size={12} />
                                                        精�?                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-6 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Star size={18} className="fill-yellow-500 text-yellow-500" />
                                                    <span className="text-lg font-semibold text-white">{skill.rating}</span>
                                                    <span className="text-sm text-gray-500">/ 5.0</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        {(skill.users / 1000).toFixed(0)}k 用户
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Download size={14} />
                                                        {(skill.downloads / 1000).toFixed(0)}k 下载
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <button
                                            onClick={handleInstall}
                                            disabled={isInstalling || isInstalled}
                                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                                                isInstalled
                                                    ? 'bg-green-600 text-white cursor-default'
                                                    : isInstalling
                                                    ? 'bg-emerald-600/50 text-white cursor-wait'
                                                    : skill.premium
                                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white'
                                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                                            }`}
                                        >
                                            {isInstalled ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircle size={16} />
                                                    已安�?                                                </span>
                                            ) : isInstalling ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    安装�?..
                                                </span>
                                            ) : skill.premium ? (
                                                '获取专业�?
                                            ) : (
                                                '免费安装'
                                            )}
                                        </button>
                                        {skill.premium && (
                                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-colors">
                                                试用
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-6 border border-white/5">
                                    <h2 className="text-lg font-semibold text-white mb-4">技能介�?/h2>
                                    <p className="text-gray-400 leading-relaxed">{skill.description}</p>
                                </div>

                                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-6 border border-white/5">
                                    <h2 className="text-lg font-semibold text-white mb-4">功能特�?/h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        {skill.capabilities.map((capability: string, index: number) => {
                                            const CapIcon = getCapabilityIcon(capability);
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                        <CapIcon size={16} className="text-emerald-400" />
                                                    </div>
                                                    <span className="text-sm text-gray-300">{capability}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {skill.changelog && skill.changelog.length > 0 && (
                                    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-6 border border-white/5">
                                        <h2 className="text-lg font-semibold text-white mb-4">更新日志</h2>
                                        <div className="space-y-4">
                                            {skill.changelog.map((log, index) => (
                                                <div key={index} className="flex items-start gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="text-sm font-medium text-white">v{log.version}</span>
                                                            <span className="text-xs text-gray-500">{log.date}</span>
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {log.changes.map((change: string, idx: number) => (
                                                                <li key={idx} className="text-sm text-gray-400 flex items-center gap-2">
                                                                    <ChevronRight size={12} className="text-gray-600" />
                                                                    {change}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-5 border border-white/5">
                                    <h3 className="text-sm font-semibold text-white mb-4">技能信�?/h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <Package size={14} />
                                                版本
                                            </span>
                                            <span className="text-gray-300">{skill.version}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <Calendar size={14} />
                                                更新时间
                                            </span>
                                            <span className="text-gray-300">{skill.updatedAt}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <HardDrive size={14} />
                                                大小
                                            </span>
                                            <span className="text-gray-300">{skill.size}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <Shield size={14} />
                                                权限
                                            </span>
                                            <span className="text-gray-300">{skill.permissions?.length || 0} �?/span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <ExternalLink size={14} />
                                                平台
                                            </span>
                                            <span className="text-gray-300">{skill.compatibility.join(', ')}</span>
                                        </div>
                                    </div>
                                </div>

                                {skill.permissions && skill.permissions.length > 0 && (
                                    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-5 border border-white/5">
                                        <h3 className="text-sm font-semibold text-white mb-3">所需权限</h3>
                                        <div className="space-y-2">
                                            {skill.permissions.map((permission: string, index: number) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Shield size={12} className="text-gray-600" />
                                                    {permission}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-5 border border-white/5">
                                    <h3 className="text-sm font-semibold text-white mb-3">标签</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skill.tags.map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-white/5 text-gray-400 text-xs rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-2xl p-5 border border-white/5">
                                    <h3 className="text-sm font-semibold text-white mb-3">开发�?/h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                                            {skill.author.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">{skill.author.name}</span>
                                                {skill.author.verified && (
                                                    <CheckCircle size={12} className="text-emerald-400" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">已发布多个优质技�?/p>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium rounded-lg transition-colors">
                                        查看更多作品
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillDetailPage;
