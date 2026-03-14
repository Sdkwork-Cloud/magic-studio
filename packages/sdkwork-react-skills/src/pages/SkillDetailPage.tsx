import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Bot,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Code,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Heart,
  ImageIcon,
  Layers,
  MessageSquare,
  Mic,
  Music,
  Palette,
  Package,
  Puzzle,
  Share2,
  Shield,
  Star,
  Terminal,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { platform, ROUTES, useRouter } from '@sdkwork/react-core';
import { PortalHeader, PortalSidebar } from '@sdkwork/react-portal-video';
import { type AgentSkill } from '../constants';
import { skillsBusinessService } from '../services';

interface SkillDetailPageProps {
  skillId?: string;
  onBack?: () => void;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function resolveCapabilityIcon(capability: string): LucideIcon {
  const normalized = normalizeText(capability);
  if (normalized.includes('video') || normalized.includes('short')) {
    return Video;
  }
  if (normalized.includes('music') || normalized.includes('song')) {
    return Music;
  }
  if (normalized.includes('audio') || normalized.includes('voice') || normalized.includes('speech')) {
    return Mic;
  }
  if (normalized.includes('code') || normalized.includes('dev')) {
    return Code;
  }
  if (normalized.includes('document') || normalized.includes('text') || normalized.includes('write')) {
    return FileText;
  }
  if (normalized.includes('terminal') || normalized.includes('cli')) {
    return Terminal;
  }
  if (normalized.includes('3d') || normalized.includes('model')) {
    return Layers;
  }
  if (normalized.includes('chat') || normalized.includes('assistant')) {
    return MessageSquare;
  }
  if (normalized.includes('analytics') || normalized.includes('analysis')) {
    return TrendingUp;
  }
  if (normalized.includes('image') || normalized.includes('picture')) {
    return ImageIcon;
  }
  if (normalized.includes('style') || normalized.includes('color') || normalized.includes('art')) {
    return Palette;
  }
  if (normalized.includes('bot')) {
    return Bot;
  }
  if (normalized.includes('mind')) {
    return Brain;
  }
  if (normalized.includes('collage')) {
    return Puzzle;
  }
  return Zap;
}

const SkillDetailPage: React.FC<SkillDetailPageProps> = ({
  skillId: propSkillId,
  onBack,
}) => {
  const { navigate, currentPath } = useRouter();
  const [skill, setSkill] = useState<AgentSkill | null>(null);
  const [isLoadingSkill, setIsLoadingSkill] = useState<boolean>(true);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string>('');

  const currentSkillId = useMemo(() => {
    if (propSkillId) {
      return propSkillId;
    }
    const parts = currentPath.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }, [propSkillId, currentPath]);

  useEffect(() => {
    if (!currentSkillId) {
      setIsLoadingSkill(false);
      setSkill(null);
      setLoadError('Skill id is missing.');
      return;
    }

    let active = true;
    const loadSkillDetail = async (): Promise<void> => {
      setIsLoadingSkill(true);
      setLoadError('');
      setActionError('');
      setActionMessage('');

      try {
        const detail = await skillsBusinessService.getSkill(currentSkillId);
        if (!active) {
          return;
        }
        if (!detail) {
          setSkill(null);
          setLoadError('Skill not found.');
          setIsInstalled(false);
          return;
        }

        setSkill(detail);

        try {
          const mine = await skillsBusinessService.listMySkills();
          if (!active) {
            return;
          }
          const installed = mine.some((item) => item.id === detail.id);
          setIsInstalled(installed);
        } catch {
          if (active) {
            setIsInstalled(false);
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }
        setSkill(null);
        setIsInstalled(false);
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load skill detail.',
        );
      } finally {
        if (active) {
          setIsLoadingSkill(false);
        }
      }
    };

    void loadSkillDetail();
    return () => {
      active = false;
    };
  }, [currentSkillId]);

  const goBack = (): void => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(ROUTES.PORTAL_SKILLS);
  };

  const handleInstall = async (): Promise<void> => {
    if (!skill || isInstalling || isInstalled) {
      return;
    }

    setIsInstalling(true);
    setActionError('');
    setActionMessage('');

    try {
      await skillsBusinessService.enableSkill(skill.id);
      setIsInstalled(true);
      setActionMessage('Skill enabled successfully.');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to enable this skill.',
      );
    } finally {
      setIsInstalling(false);
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!skill) {
      return;
    }

    const shareUrl = window.location.href;
    setActionError('');
    setActionMessage('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: skill.name,
          text: skill.description,
          url: shareUrl,
        });
        setActionMessage('Share completed.');
        return;
      }

      await platform.copy(shareUrl);
      setActionMessage('Link copied to clipboard.');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to share skill.',
      );
    }
  };

  if (isLoadingSkill) {
    return (
      <div className="flex h-full bg-[#0a0a0a]">
        <PortalSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalHeader />
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-emerald-400" />
              Loading skill detail...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="flex h-full bg-[#0a0a0a]">
        <PortalSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalHeader />
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-600" />
              <h2 className="mb-2 text-xl font-semibold text-white">Skill not found</h2>
              <p className="mb-6 text-sm text-gray-400">
                {loadError || 'The selected skill is unavailable.'}
              </p>
              <button
                onClick={goBack}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Back to Skills
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = skill.icon;

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      <PortalSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <PortalHeader />

        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-6">
              <div className="flex h-14 items-center justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm">Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => setIsBookmarked((value) => !value)}
                    className={`rounded-lg p-2 transition-colors ${
                      isBookmarked
                        ? 'bg-red-500/10 text-red-500'
                        : 'text-gray-400 hover:bg-white/5 hover:text-red-400'
                    }`}
                    title="Bookmark"
                  >
                    <Heart size={16} className={isBookmarked ? 'fill-red-500' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-8">
            {loadError ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{loadError}</span>
                </div>
              </div>
            ) : null}

            {actionError ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              </div>
            ) : null}

            {actionMessage ? (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6">
                  <div className="flex items-start gap-5">
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                      <Icon size={40} className="text-emerald-400" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <h1 className="mb-1 text-2xl font-bold text-white">{skill.name}</h1>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{skill.author.name}</span>
                            {skill.author.verified ? (
                              <CheckCircle size={14} className="text-emerald-400" />
                            ) : null}
                          </div>
                        </div>

                        {skill.featured ? (
                          <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-xs font-bold text-white">
                            <Award size={12} />
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Star size={18} className="fill-yellow-500 text-yellow-500" />
                          <span className="text-lg font-semibold text-white">{skill.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">/ 5.0</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {Math.max(0, Math.round(skill.users / 1000))}k installs
                          </span>
                          <span className="flex items-center gap-1">
                            <Download size={14} />
                            {Math.max(0, Math.round(skill.downloads / 1000))}k downloads
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <button
                      onClick={() => {
                        void handleInstall();
                      }}
                      disabled={isInstalling || isInstalled}
                      className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                        isInstalled
                          ? 'cursor-default bg-green-600 text-white'
                          : isInstalling
                            ? 'cursor-wait bg-emerald-600/50 text-white'
                            : skill.premium
                              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-500'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500'
                      }`}
                    >
                      {isInstalled ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          Enabled
                        </span>
                      ) : isInstalling ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Enabling...
                        </span>
                      ) : skill.premium ? (
                        'Unlock Pro'
                      ) : (
                        'Enable Skill'
                      )}
                    </button>

                    {skill.premium ? (
                      <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
                        Upgrade Plan
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Description</h2>
                  <p className="leading-relaxed text-gray-400">{skill.description}</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">Capabilities</h2>
                  {skill.capabilities.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {skill.capabilities.map((capability, index) => {
                        const CapabilityIcon = resolveCapabilityIcon(capability);
                        return (
                          <div
                            key={`${skill.id}-capability-${index}`}
                            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                              <CapabilityIcon size={16} className="text-emerald-400" />
                            </div>
                            <span className="text-sm text-gray-300">{capability}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No capabilities declared.</p>
                  )}
                </div>

                {skill.changelog && skill.changelog.length > 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">Changelog</h2>
                    <div className="space-y-4">
                      {skill.changelog.map((entry, index) => (
                        <div key={`${skill.id}-changelog-${index}`} className="flex items-start gap-4">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-3">
                              <span className="text-sm font-medium text-white">v{entry.version}</span>
                              <span className="text-xs text-gray-500">{entry.date}</span>
                            </div>
                            <ul className="space-y-1">
                              {entry.changes.map((change, changeIndex) => (
                                <li
                                  key={`${skill.id}-change-${index}-${changeIndex}`}
                                  className="flex items-center gap-2 text-sm text-gray-400"
                                >
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
                ) : null}
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
                  <h3 className="mb-4 text-sm font-semibold text-white">Skill Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Package size={14} />
                        Version
                      </span>
                      <span className="text-gray-300">{skill.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} />
                        Updated
                      </span>
                      <span className="text-gray-300">{skill.updatedAt}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <HardDrive size={14} />
                        Size
                      </span>
                      <span className="text-gray-300">{skill.size || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Shield size={14} />
                        Permissions
                      </span>
                      <span className="text-gray-300">{skill.permissions?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <ExternalLink size={14} />
                        Compatibility
                      </span>
                      <span className="text-right text-gray-300">
                        {skill.compatibility.length > 0
                          ? skill.compatibility.join(', ')
                          : 'web'}
                      </span>
                    </div>
                  </div>
                </div>

                {skill.permissions && skill.permissions.length > 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
                    <h3 className="mb-3 text-sm font-semibold text-white">Requested Permissions</h3>
                    <div className="space-y-2">
                      {skill.permissions.map((permission, index) => (
                        <div
                          key={`${skill.id}-permission-${index}`}
                          className="flex items-center gap-2 text-xs text-gray-400"
                        >
                          <Shield size={12} className="text-gray-600" />
                          {permission}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {skill.tags.length > 0 ? (
                      skill.tags.map((tag, index) => (
                        <span
                          key={`${skill.id}-tag-${index}`}
                          className="cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No tags</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Author</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 font-semibold text-white">
                      {skill.author.name[0]?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{skill.author.name}</span>
                        {skill.author.verified ? (
                          <CheckCircle size={12} className="text-emerald-400" />
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500">Skill publisher</p>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
                    View Publisher
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
