import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Eraser,
  Layers,
  Mic,
  Move,
  Play,
  Scissors,
  Search,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react';
import { Button } from '@sdkwork/react-commons';
import { Input } from '@sdkwork/react-commons/ui';
import { useTranslation } from '@sdkwork/react-i18n';
import { ROUTES, createOfflineArtwork, useRouter } from '@sdkwork/react-core';
import { PortalHeader } from '../components/PortalHeader';
import { PortalSidebar } from '../components/PortalSidebar';

type ToolCategoryId = 'all' | 'video' | 'image' | 'audio';
type ToolBadgeId = 'newest' | 'hot' | 'beta';

interface ToolDefinition {
  id: string;
  localeKey: string;
  category: Exclude<ToolCategoryId, 'all'>;
  image: string;
  badge?: ToolBadgeId;
  icon: LucideIcon;
  route: string;
}

interface LocalizedTool extends ToolDefinition {
  title: string;
  description: string;
  categoryLabel: string;
  badgeLabel?: string;
}

const createToolArtwork = (
  title: string,
  accent: string,
  badge?: string,
): string =>
  createOfflineArtwork({
    title,
    subtitle: 'Bundled AI workflow preview',
    eyebrow: 'Magic Studio Tools',
    badge,
    accent,
    width: 640,
    height: 360,
  });

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'video-extender',
    localeKey: 'video_extender',
    category: 'video',
    image: createToolArtwork('Video Extender', '#5b8cff', 'New'),
    badge: 'newest',
    icon: Layers,
    route: ROUTES.VIDEO,
  },
  {
    id: 'lip-sync',
    localeKey: 'lip_sync',
    category: 'video',
    image: createToolArtwork('Lip Sync', '#14b8a6'),
    icon: Mic,
    route: ROUTES.VIDEO,
  },
  {
    id: 'img-to-video',
    localeKey: 'img_to_video',
    category: 'video',
    image: createToolArtwork('Image To Video', '#f97316', 'Hot'),
    badge: 'hot',
    icon: Video,
    route: ROUTES.VIDEO,
  },
  {
    id: 'video-upscale',
    localeKey: 'video_upscale',
    category: 'video',
    image: createToolArtwork('Video Upscale', '#a855f7'),
    icon: Wand2,
    route: ROUTES.VIDEO,
  },
  {
    id: 'video-enhance',
    localeKey: 'video_enhance',
    category: 'video',
    image: createToolArtwork('Video Enhance', '#06b6d4'),
    icon: Sparkles,
    route: ROUTES.VIDEO,
  },
  {
    id: 'face-swap',
    localeKey: 'face_swap',
    category: 'video',
    image: createToolArtwork('Face Swap', '#ec4899', 'Beta'),
    badge: 'beta',
    icon: Video,
    route: ROUTES.VIDEO,
  },
  {
    id: 'baby-generator',
    localeKey: 'baby_generator',
    category: 'video',
    image: createToolArtwork('Baby Generator', '#f59e0b'),
    icon: Mic,
    route: ROUTES.VIDEO,
  },
  {
    id: 'pet-generator',
    localeKey: 'pet_generator',
    category: 'video',
    image: createToolArtwork('Pet Generator', '#22c55e'),
    icon: Mic,
    route: ROUTES.VIDEO,
  },
  {
    id: 'denoise',
    localeKey: 'denoise',
    category: 'video',
    image: createToolArtwork('Denoise', '#64748b'),
    icon: Eraser,
    route: ROUTES.VIDEO,
  },
  {
    id: 'dance-gen',
    localeKey: 'dance_gen',
    category: 'video',
    image: createToolArtwork('Dance Gen', '#e11d48'),
    icon: Move,
    route: ROUTES.VIDEO,
  },
  {
    id: 'subtitle-remove',
    localeKey: 'subtitle_remove',
    category: 'video',
    image: createToolArtwork('Subtitle Remove', '#0ea5e9'),
    icon: Scissors,
    route: ROUTES.VIDEO,
  },
  {
    id: 'anime-video',
    localeKey: 'anime_video',
    category: 'video',
    image: createToolArtwork('Anime Video', '#8b5cf6'),
    icon: Wand2,
    route: ROUTES.VIDEO,
  },
  {
    id: 'face-enhance',
    localeKey: 'face_enhance',
    category: 'image',
    image: createToolArtwork('Face Enhance', '#38bdf8', 'New'),
    badge: 'newest',
    icon: Sparkles,
    route: ROUTES.IMAGE,
  },
  {
    id: 'img-remove-obj',
    localeKey: 'img_remove_obj',
    category: 'image',
    image: createToolArtwork('Image Remove Object', '#fb7185'),
    icon: Eraser,
    route: ROUTES.IMAGE,
  },
  {
    id: 'bg-remove',
    localeKey: 'bg_remove',
    category: 'image',
    image: createToolArtwork('Background Remove', '#10b981'),
    icon: Scissors,
    route: ROUTES.IMAGE,
  },
];

const CATEGORY_IDS: ToolCategoryId[] = ['all', 'video', 'image', 'audio'];

const AIToolsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ToolCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const routerContext = useRouter();
  const navigate = routerContext?.navigate || (() => {});

  const localizedTools = useMemo<LocalizedTool[]>(
    () =>
      TOOL_DEFINITIONS.map((tool) => ({
        ...tool,
        title: t(`portalVideo.tools.${tool.localeKey}.title`, tool.id),
        description: t(`portalVideo.tools.${tool.localeKey}.description`, tool.id),
        categoryLabel: t(
          `portalVideo.tools.categories.${tool.category}`,
          tool.category,
        ),
        badgeLabel: tool.badge
          ? t(`portalVideo.badges.${tool.badge}`, tool.badge)
          : undefined,
      })),
    [t],
  );

  const filteredTools = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return localizedTools.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        tool.title.toLowerCase().includes(normalizedQuery) ||
        tool.description.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, localizedTools, searchQuery]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#050505] font-sans text-gray-200">
      <PortalSidebar />

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <PortalHeader />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="mb-1 text-2xl font-bold text-white">
                  {t('portalVideo.page.ai_tools_title')}
                </h1>
                <p className="text-sm text-gray-500">
                  {t('portalVideo.page.ai_tools_subtitle')}
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-[#27272a] bg-[#18181b] p-1.5">
                {CATEGORY_IDS.map((categoryId) => (
                  <Button
                    key={categoryId}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCategory(categoryId)}
                    className={`px-4 py-1.5 text-xs font-bold transition-all ${
                      activeCategory === categoryId
                        ? 'rounded-lg bg-white text-black shadow-sm'
                        : 'rounded-lg text-gray-500 hover:bg-[#27272a] hover:text-white'
                    }`}
                  >
                    {t(
                      `portalVideo.tools.categories.${categoryId}`,
                      categoryId,
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative max-w-lg flex-1">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder={t('portalVideo.page.search_placeholder')}
                  className="w-full rounded-xl border border-[#27272a] bg-[#18181b] py-3 pl-11 pr-4 text-sm text-gray-200 transition-colors placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="text-xs text-gray-500">
                {t('portalVideo.page.results_count', {
                  count: String(filteredTools.length),
                })}
              </div>
            </div>

            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    ctaLabel={t('portalVideo.page.try_now')}
                    onClick={() => navigate(tool.route)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#27272a] bg-[#111113] text-center">
                <Sparkles size={36} className="mb-4 text-gray-600" />
                <h2 className="mb-2 text-lg font-semibold text-white">
                  {t('portalVideo.page.empty_title')}
                </h2>
                <p className="max-w-md text-sm text-gray-500">
                  {t('portalVideo.page.empty_description')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolCard: React.FC<{
  tool: LocalizedTool;
  ctaLabel: string;
  onClick: () => void;
}> = ({ tool, ctaLabel, onClick }) => {
  const badgeClassname =
    tool.badge === 'newest'
      ? 'bg-pink-600'
      : tool.badge === 'hot'
        ? 'bg-orange-600'
        : 'bg-blue-600';

  return (
    <Button
      type="button"
      variant="ghost"
      className="group relative block overflow-hidden rounded-xl border border-[#27272a] bg-[#18181b] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#444] hover:shadow-2xl hover:shadow-black/50"
      onClick={onClick}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#111]">
        <img
          src={tool.image}
          alt={tool.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent opacity-80" />

        {tool.badgeLabel ? (
          <div
            className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm ${badgeClassname}`}
          >
            {tool.badgeLabel}
          </div>
        ) : null}

        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-lg backdrop-blur-md">
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>

      <div className="relative p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-blue-400">
            {tool.title}
          </h3>
        </div>

        <p className="h-9 line-clamp-2 text-xs leading-relaxed text-gray-500">
          {tool.description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[#27272a] pt-3">
          <div className="flex items-center gap-1.5 rounded bg-[#222] px-2 py-1 text-[10px] font-medium text-gray-400">
            <tool.icon size={10} />
            {tool.categoryLabel}
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
            {ctaLabel} <Sparkles size={10} />
          </span>
        </div>
      </div>
    </Button>
  );
};

export default AIToolsPage;
