import React, { useState, useMemo } from 'react';
import {
    Search, Star, Users, TrendingUp, Sparkles,
    ArrowRight, Plus, Download, Award, CheckCircle, Heart,
    Github, Globe, Shield, Layers, Package, ExternalLink
} from 'lucide-react';
import { useRouter, ROUTES } from 'sdkwork-react-core';
import { PortalHeader, PortalSidebar } from 'sdkwork-react-portal-video';
import { SKILL_CATEGORIES } from '../constants';
import { AGENT_SKILLS } from '../data/skills';

interface SkillsPageProps {
    onSkillSelect?: (skillId: string) => void;
}

const SkillsPage: React.FC<SkillsPageProps> = ({ onSkillSelect }) => {
    const { navigate } = useRouter();
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeTab, setActiveTab] = useState('featured');
    const [searchQuery, setSearchQuery] = useState('');
    const [bookmarkedSkills, setBookmarkedSkills] = useState<Set<string>>(new Set());

    // 处理技能点击
    const handleSkillClick = (skillId: string) => {
        if (onSkillSelect) {
            onSkillSelect(skillId);
        } else {
            navigate(`${ROUTES.PORTAL_SKILLS}/${skillId}`);
        }
    };

    // 过滤技能
    const filteredSkills = useMemo(() => {
        let skills = [...AGENT_SKILLS];

        // 标签页过滤
        if (activeTab === 'featured') {
            skills = skills.filter(s => s.featured);
        } else if (activeTab === 'trending') {
            skills = skills.sort((a, b) => b.users - a.users);
        } else if (activeTab === 'new') {
            skills = skills.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else if (activeTab === 'premium') {
            skills = skills.filter(s => s.premium);
        } else if (activeTab === 'free') {
            skills = skills.filter(s => !s.premium);
        } else if (activeTab === 'opensource') {
            // 开源技能 - 免费且作者认证的
            skills = skills.filter(s => !s.premium && s.author.verified);
        }

        // 分类过滤
        if (activeCategory !== 'all') {
            skills = skills.filter(s => s.category === activeCategory);
        }

        // 搜索过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            skills = skills.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.tags.some((t: string) => t.toLowerCase().includes(query)) ||
                s.capabilities.some((c: string) => c.toLowerCase().includes(query))
            );
        }

        return skills;
    }, [activeTab, activeCategory, searchQuery]);

    // 切换书签
    const toggleBookmark = (skillId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setBookmarkedSkills(prev => {
            const next = new Set(prev);
            if (next.has(skillId)) {
                next.delete(skillId);
            } else {
                next.add(skillId);
            }
            return next;
        });
    };

    // 获取分类信息
    const getCategoryInfo = (categoryId: string) => {
        return SKILL_CATEGORIES.find(c => c.id === categoryId) || SKILL_CATEGORIES[0];
    };

    return (
        <div className="flex h-full bg-[#0a0a0a]">
            <PortalSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <PortalHeader />
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-b from-emerald-900/30 via-teal-900/20 to-[#0a0a0f] border-b border-white/5">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-12">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
                            <Package size={16} className="text-emerald-400" />
                            <span className="text-xs text-gray-300">Open Source Agent Skills Marketplace</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">技能市场</span> - 发现开源 AI 技能
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            探索 {AGENT_SKILLS.length}+ 个遵循开源标准的 Agent Skills，扩展你的 AI 助手能力边界
                        </p>
                    </div>

                    {/* 搜索栏 */}
                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="搜索技能名称、功能、标签或作者..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 导航栏 */}
            <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between py-4">
                        {/* 主标签 - 技能市场分类 */}
                        <div className="flex items-center gap-1">
                            {[
                                { id: 'featured', label: '精选推荐', icon: Award },
                                { id: 'trending', label: '热门流行', icon: TrendingUp },
                                { id: 'opensource', label: '开源免费', icon: Github },
                                { id: 'new', label: '最新上架', icon: Sparkles },
                                { id: 'premium', label: '专业版', icon: Star },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 分类选择 */}
                        <div className="flex items-center gap-2">
                            <select
                                value={activeCategory}
                                onChange={(e) => setActiveCategory(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50"
                            >
                                {SKILL_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 市场统计信息 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Package size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{AGENT_SKILLS.length}</div>
                                <div className="text-xs text-gray-400">总技能数</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Github size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {AGENT_SKILLS.filter(s => !s.premium && s.author.verified).length}
                                </div>
                                <div className="text-xs text-gray-400">开源技能</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Users size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {(AGENT_SKILLS.reduce((sum, s) => sum + s.users, 0) / 1000).toFixed(0)}k
                                </div>
                                <div className="text-xs text-gray-400">总用户</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <Award size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {AGENT_SKILLS.filter(s => s.author.verified).length}
                                </div>
                                <div className="text-xs text-gray-400">认证作者</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-400">
                        显示 <span className="text-white font-medium">{filteredSkills.length}</span> 个技能
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Shield size={12} />
                        <span>所有技能均遵循开源 Agent Skills 标准</span>
                    </div>
                </div>

                {/* 技能网格 */}
                {filteredSkills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredSkills.map((skill) => {
                            const Icon = skill.icon;
                            const isBookmarked = bookmarkedSkills.has(skill.id);
                            const categoryInfo = getCategoryInfo(skill.category);

                            return (
                                <div
                                    key={skill.id}
                                    onClick={() => handleSkillClick(skill.id)}
                                    className="group relative bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl overflow-hidden border border-white/5 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10"
                                >
                                    {/* 精选标识 */}
                                    {skill.featured && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                                                <Award size={10} />
                                                精选
                                            </span>
                                        </div>
                                    )}

                                    {/* 开源标识 */}
                                    {!skill.premium && skill.author.verified && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                                                <Github size={10} />
                                                开源
                                            </span>
                                        </div>
                                    )}

                                    {/* 书签按钮 */}
                                    <button
                                        onClick={(e) => toggleBookmark(skill.id, e)}
                                        className={`absolute top-3 right-3 p-2 rounded-lg transition-all z-10 ${
                                            isBookmarked
                                                ? 'bg-red-600 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100'
                                        }`}
                                    >
                                        <Heart size={14} className={isBookmarked ? 'fill-white' : ''} />
                                    </button>

                                    {/* 内容 */}
                                    <div className="p-5">
                                        {/* 图标和标题 */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                                                <Icon size={20} className="text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                                                    {skill.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500">{skill.author.name}</span>
                                                    {skill.author.verified && (
                                                        <CheckCircle size={10} className="text-emerald-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 描述 */}
                                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                                            {skill.description}
                                        </p>

                                        {/* 分类和能力标签 */}
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] rounded flex items-center gap-1">
                                                {categoryInfo && <categoryInfo.icon size={10} />}
                                                {categoryInfo?.label || skill.category}
                                            </span>
                                            {skill.premium && (
                                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-medium rounded">
                                                    Pro
                                                </span>
                                            )}
                                            {!skill.premium && (
                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-medium rounded">
                                                    Free
                                                </span>
                                            )}
                                            {skill.capabilities.slice(0, 2).map((cap: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 bg-white/5 text-gray-500 text-[10px] rounded">
                                                    {cap}
                                                </span>
                                            ))}
                                        </div>

                                        {/* 统计数据 */}
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Users size={11} />
                                                    {(skill.users / 1000).toFixed(0)}k
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star size={11} className="fill-yellow-500 text-yellow-500" />
                                                    {skill.rating}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Download size={11} />
                                                    {(skill.downloads / 1000).toFixed(0)}k
                                                </span>
                                            </div>
                                            <ArrowRight size={14} className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <Search size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">未找到匹配的技能</h3>
                        <p className="text-gray-400 text-sm mb-6">尝试调整搜索条件或浏览其他分类</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            清除筛选
                        </button>
                    </div>
                )}
            </div>

            {/* 页脚 CTA - 技能市场 */}
            <div className="border-t border-white/5 mt-16">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="bg-gradient-to-r from-emerald-900/30 via-teal-900/30 to-cyan-900/30 rounded-2xl p-8 border border-white/10">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Layers size={24} className="text-emerald-400" />
                                <h2 className="text-xl font-bold text-white">贡献你的开源技能</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
                                遵循开源 Agent Skills 标准，将你的 AI 技能发布到市场，与全球开发者分享创新成果
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                                    <Plus size={16} />
                                    创建技能
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
                                    <Github size={16} />
                                    查看标准
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
                                    <Globe size={16} />
                                    <ExternalLink size={14} />
                                    开源社区
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                </div>
            </div>
        </div>
    );
};

export default SkillsPage;
