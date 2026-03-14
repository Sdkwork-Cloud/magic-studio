import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle,
  Download,
  Github,
  Heart,
  Layers,
  Loader2,
  Package,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { ROUTES, useRouter } from '@sdkwork/react-core';
import { PortalHeader, PortalSidebar } from '@sdkwork/react-portal-video';
import { SKILL_CATEGORIES, type AgentSkill } from '../constants';
import {
  skillsBusinessService,
  type SkillCategoryOption,
  type SkillMarketTab,
} from '../services';

interface SkillsPageProps {
  onSkillSelect?: (skillId: string) => void;
}

interface SkillTabOption {
  id: SkillMarketTab;
  label: string;
  icon: LucideIcon;
}

const SKILL_TABS: SkillTabOption[] = [
  { id: 'featured', label: 'Featured', icon: Award },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'opensource', label: 'Open Source', icon: Github },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'premium', label: 'Premium', icon: Star },
  { id: 'free', label: 'Free', icon: Shield },
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function sortByNewest(skills: AgentSkill[]): AgentSkill[] {
  return [...skills].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

function sortByTrending(skills: AgentSkill[]): AgentSkill[] {
  return [...skills].sort((left, right) => right.users - left.users);
}

function applyLocalFilters(
  skills: AgentSkill[],
  activeTab: SkillMarketTab,
  activeCategory: string,
  keyword: string,
): AgentSkill[] {
  let items = [...skills];

  if (activeCategory !== 'all') {
    items = items.filter((skill) => skill.category === activeCategory);
  }

  if (keyword) {
    items = items.filter((skill) => {
      const searchable = [
        skill.name,
        skill.description,
        ...skill.tags,
        ...skill.capabilities,
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(keyword);
    });
  }

  if (activeTab === 'featured') {
    return items.filter((skill) => skill.featured);
  }
  if (activeTab === 'premium') {
    return items.filter((skill) => skill.premium);
  }
  if (activeTab === 'free') {
    return items.filter((skill) => !skill.premium);
  }
  if (activeTab === 'opensource') {
    return items.filter((skill) => !skill.premium && skill.author.verified);
  }
  if (activeTab === 'trending') {
    return sortByTrending(items);
  }
  if (activeTab === 'new') {
    return sortByNewest(items);
  }
  return items;
}

const SkillsPage: React.FC<SkillsPageProps> = ({ onSkillSelect }) => {
  const { navigate } = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<SkillMarketTab>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [effectiveKeyword, setEffectiveKeyword] = useState<string>('');
  const [bookmarkedSkills, setBookmarkedSkills] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<SkillCategoryOption[]>(
    SKILL_CATEGORIES.map((category) => ({ ...category })),
  );
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEffectiveKeyword(normalizeText(searchQuery));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    const loadCategories = async (): Promise<void> => {
      try {
        const result = await skillsBusinessService.listCategories();
        if (!active) {
          return;
        }
        if (result.length > 0) {
          setCategories(result);
        }
      } catch (error) {
        if (active) {
          console.warn('[SkillsPage] Failed to load categories:', error);
        }
      }
    };

    void loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSkills = async (): Promise<void> => {
      setIsLoading(true);
      setLoadError('');
      try {
        const result = await skillsBusinessService.listSkills({
          tab: activeTab,
          category: activeCategory,
          keyword: effectiveKeyword,
          page: 1,
          size: 120,
        });
        if (!active) {
          return;
        }
        setSkills(result.items);
        setTotal(result.total);
      } catch (error) {
        if (!active) {
          return;
        }
        setSkills([]);
        setTotal(0);
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load skills.',
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSkills();
    return () => {
      active = false;
    };
  }, [activeTab, activeCategory, effectiveKeyword]);

  const filteredSkills = useMemo(
    () => applyLocalFilters(skills, activeTab, activeCategory, effectiveKeyword),
    [skills, activeTab, activeCategory, effectiveKeyword],
  );

  const openSourceCount = useMemo(
    () => skills.filter((skill) => !skill.premium && skill.author.verified).length,
    [skills],
  );

  const totalUsers = useMemo(
    () => skills.reduce((sum, skill) => sum + skill.users, 0),
    [skills],
  );

  const verifiedCount = useMemo(
    () => skills.filter((skill) => skill.author.verified).length,
    [skills],
  );

  const handleSkillClick = (skillId: string): void => {
    if (onSkillSelect) {
      onSkillSelect(skillId);
      return;
    }
    navigate(`${ROUTES.PORTAL_SKILLS}/${skillId}`);
  };

  const toggleBookmark = (skillId: string, event: React.MouseEvent): void => {
    event.stopPropagation();
    setBookmarkedSkills((previous) => {
      const next = new Set(previous);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const getCategoryInfo = (categoryId: string): SkillCategoryOption => {
    return (
      categories.find((category) => category.id === categoryId) ||
      categories[0] ||
      ({ ...SKILL_CATEGORIES[0] } as SkillCategoryOption)
    );
  };

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      <PortalSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <PortalHeader />

        <div className="flex-1 overflow-y-auto">
          <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-emerald-900/30 via-teal-900/20 to-[#0a0a0f]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 py-12">
              <div className="mb-10 text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                  <Package size={16} className="text-emerald-400" />
                  <span className="text-xs text-gray-300">Agent Skills Marketplace</span>
                </div>
                <h1 className="mb-3 text-4xl font-bold text-white">
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Build Faster With Reusable Skills
                  </span>
                </h1>
                <p className="mx-auto max-w-2xl text-gray-400">
                  Browse curated and community-contributed skills. Data is loaded directly
                  from SDK APIs and reflects your current environment.
                </p>
              </div>

              <div className="mx-auto max-w-2xl">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name, tags, or capabilities"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-6 text-white placeholder-gray-500 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6">
              <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex flex-wrap items-center gap-1">
                  {SKILL_TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 focus:border-emerald-500/50 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Package size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{total || skills.length}</div>
                    <div className="text-xs text-gray-400">Available</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                    <Github size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{openSourceCount}</div>
                    <div className="text-xs text-gray-400">Open Source</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                    <Users size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.max(0, Math.round(totalUsers / 1000))}k</div>
                    <div className="text-xs text-gray-400">Installs</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                    <Award size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{verifiedCount}</div>
                    <div className="text-xs text-gray-400">Verified Authors</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing <span className="font-medium text-white">{filteredSkills.length}</span> skills
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={12} />
                <span>Service layer calls SDK only</span>
              </div>
            </div>

            {loadError ? (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{loadError}</span>
                </div>
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Loader2 size={18} className="animate-spin text-emerald-400" />
                  Loading skills...
                </div>
              </div>
            ) : filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.map((skill) => {
                  const Icon = skill.icon;
                  const isBookmarked = bookmarkedSkills.has(skill.id);
                  const categoryInfo = getCategoryInfo(skill.category);

                  return (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillClick(skill.id)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                      {skill.featured ? (
                        <div className="absolute left-3 top-3 z-10">
                          <span className="flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 px-2 py-1 text-[10px] font-bold text-white">
                            <Award size={10} />
                            Featured
                          </span>
                        </div>
                      ) : null}

                      <button
                        onClick={(event) => toggleBookmark(skill.id, event)}
                        className={`absolute right-3 top-3 z-10 rounded-lg p-2 transition-all ${
                          isBookmarked
                            ? 'bg-red-600 text-white'
                            : 'bg-white/5 text-gray-400 opacity-0 hover:bg-white/10 hover:text-red-400 group-hover:opacity-100'
                        }`}
                      >
                        <Heart size={14} className={isBookmarked ? 'fill-white' : ''} />
                      </button>

                      <div className="p-5">
                        <div className="mb-3 flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 transition-transform group-hover:scale-105">
                            <Icon size={20} className="text-emerald-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-emerald-300">
                              {skill.name}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-gray-500">{skill.author.name}</span>
                              {skill.author.verified ? (
                                <CheckCircle size={10} className="text-emerald-400" />
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <p className="mb-3 line-clamp-2 text-xs text-gray-400">{skill.description}</p>

                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                            <categoryInfo.icon size={10} />
                            {categoryInfo.label}
                          </span>
                          {skill.premium ? (
                            <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                              Pro
                            </span>
                          ) : (
                            <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                              Free
                            </span>
                          )}
                          {skill.capabilities.slice(0, 2).map((capability, index) => (
                            <span
                              key={`${skill.id}-capability-${index}`}
                              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-500"
                            >
                              {capability}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users size={11} />
                              {Math.max(0, Math.round(skill.users / 1000))}k
                            </span>
                            <span className="flex items-center gap-1">
                              <Star size={11} className="fill-yellow-500 text-yellow-500" />
                              {skill.rating.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download size={11} />
                              {Math.max(0, Math.round(skill.downloads / 1000))}k
                            </span>
                          </div>
                          <ArrowRight size={14} className="text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                  <Search size={32} className="text-gray-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">No skills found</h3>
                <p className="mb-6 text-sm text-gray-400">
                  The API returned no skills for the current filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    setActiveTab('featured');
                  }}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  Reset Filters
                </button>
              </div>
            )}

            <div className="mt-16 border-t border-white/5">
              <div className="mx-auto max-w-7xl px-0 py-12">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-900/30 via-teal-900/30 to-cyan-900/30 p-8">
                  <div className="text-center">
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <Layers size={24} className="text-emerald-400" />
                      <h2 className="text-xl font-bold text-white">Build your own skill</h2>
                    </div>
                    <p className="mx-auto mb-6 max-w-2xl text-sm text-gray-400">
                      Publish your capability through backend skill APIs, then consume it
                      through the generated SDK to keep architecture consistent.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <button className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200">
                        Submit Skill
                      </button>
                      <button className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
                        Documentation
                      </button>
                    </div>
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
