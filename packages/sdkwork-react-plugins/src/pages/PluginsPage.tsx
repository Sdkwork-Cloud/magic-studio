import React, { useMemo, useState } from 'react';
import {
  Puzzle,
  Download,
  Star,
  Search,
  Check,
  RefreshCw,
  Trash2,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { PortalHeader } from '@sdkwork/react-portal-video';
import {
  DEFAULT_PLUGINS,
  PLUGIN_CATEGORIES,
  type Plugin,
  type PluginBadgeId,
} from '../constants';

const BADGE_CLASSNAMES: Record<PluginBadgeId, string> = {
  hot: 'bg-red-500/20 text-red-400',
  official: 'bg-green-500/20 text-green-400',
  featured: 'bg-blue-500/20 text-blue-400',
  practical: 'bg-orange-500/20 text-orange-400',
  asset: 'bg-cyan-500/20 text-cyan-400',
  ai: 'bg-purple-500/20 text-purple-400',
};

const PluginsPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [plugins, setPlugins] = useState<Plugin[]>(DEFAULT_PLUGINS);
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);

  const resolvePluginName = (plugin: Plugin): string => t(plugin.nameKey, plugin.id);
  const resolvePluginDescription = (plugin: Plugin): string =>
    t(plugin.descriptionKey, plugin.id);
  const resolveBadgeLabel = (badge: PluginBadgeId): string =>
    t(`plugins.badges.${badge}`, badge);
  const resolvePriceLabel = (plugin: Plugin): string =>
    plugin.priceCny
      ? new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'CNY',
          maximumFractionDigits: 0,
        }).format(plugin.priceCny)
      : t('plugins.prices.free', 'Free');

  const filteredPlugins = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return plugins.filter((plugin) => {
      const matchesCategory =
        activeCategory === 'all' ||
        activeCategory === 'trending' ||
        plugin.category === activeCategory;
      const matchesInstalled = !showInstalledOnly || plugin.installed;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        resolvePluginName(plugin).toLowerCase().includes(normalizedSearch) ||
        resolvePluginDescription(plugin).toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesInstalled && matchesSearch;
    });
  }, [activeCategory, plugins, searchQuery, showInstalledOnly, t]);

  const handleInstall = (pluginId: string): void => {
    setPlugins((previous) =>
      previous.map((plugin) =>
        plugin.id === pluginId
          ? { ...plugin, installed: !plugin.installed }
          : plugin,
      ),
    );
  };

  const handleUpdate = (pluginId: string): void => {
    setPlugins((previous) =>
      previous.map((plugin) =>
        plugin.id === pluginId
          ? {
              ...plugin,
              updateAvailable: false,
              version: incrementVersion(plugin.version),
            }
          : plugin,
      ),
    );
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  };

  const installedCount = plugins.filter((plugin) => plugin.installed).length;
  const updateCount = plugins.filter((plugin) => plugin.updateAvailable).length;

  return (
    <div className="min-h-screen bg-[#020202]">
      <PortalHeader />

      <div className="relative h-40 overflow-hidden bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-4xl font-bold text-white">
              {t('plugins.page.title', 'Plugin Hub')}
            </h1>
            <p className="text-sm text-gray-400">
              {t(
                'plugins.page.subtitle',
                'Extend your AI creation workflow with focused add-ons.',
              )}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#020202] to-transparent" />
      </div>

      <div className="sticky top-0 z-40 border-b border-white/5 bg-[#020202]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              {PLUGIN_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'border-white/10 bg-[#1a1a1c] text-white'
                        : 'border-transparent text-gray-400 hover:bg-[#1a1a1c]/50 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {t(category.labelKey, category.id)}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder={t('plugins.page.search_placeholder', 'Search plugins...')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-64 rounded-lg border border-white/10 bg-[#1a1a1c] py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs">
            <button
              onClick={() => setShowInstalledOnly((value) => !value)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all ${
                showInstalledOnly
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a1c] text-gray-400 hover:text-white'
              }`}
            >
              <Check size={12} />
              {t('plugins.page.installed_only', 'Installed')} ({installedCount})
            </button>
            {updateCount > 0 ? (
              <span className="flex items-center gap-1 text-orange-400">
                <RefreshCw size={12} />
                {t('plugins.page.updates_available', {
                  count: String(updateCount),
                })}
              </span>
            ) : null}
            <span className="ml-auto text-gray-500">
              {t('plugins.page.total_plugins', {
                count: String(filteredPlugins.length),
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {filteredPlugins.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlugins.map((plugin) => {
              const Icon = plugin.icon;
              return (
                <div
                  key={plugin.id}
                  className="group relative rounded-xl border border-white/5 bg-[#1a1a1c] p-4 transition-all hover:border-white/10"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        plugin.category === 'ai'
                          ? 'bg-purple-500/20 text-purple-400'
                          : plugin.category === 'effects'
                            ? 'bg-pink-500/20 text-pink-400'
                            : plugin.category === 'productivity'
                              ? 'bg-blue-500/20 text-blue-400'
                              : plugin.category === 'assets'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-white">
                          {resolvePluginName(plugin)}
                        </h3>
                        {plugin.verified ? (
                          <Check size={12} className="text-blue-500" />
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span>v{plugin.version}</span>
                        {plugin.updateAvailable ? (
                          <span className="flex items-center gap-1 text-orange-400">
                            <RefreshCw size={10} />
                            {t('plugins.actions.update_ready', 'Update ready')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <p className="mb-3 line-clamp-2 text-xs text-gray-400">
                    {resolvePluginDescription(plugin)}
                  </p>

                  <div className="mb-3 flex flex-wrap gap-1">
                    {plugin.badges.map((badge) => (
                      <span
                        key={`${plugin.id}-${badge}`}
                        className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                          BADGE_CLASSNAMES[badge]
                        }`}
                      >
                        {resolveBadgeLabel(badge)}
                      </span>
                    ))}
                  </div>

                  <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Download size={12} />
                      {(plugin.downloads / 1000).toFixed(0)}k
                    </span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star size={12} className="fill-yellow-500" />
                      {plugin.rating}
                    </span>
                    <span className="text-gray-400">{resolvePriceLabel(plugin)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plugin.installed ? (
                      <>
                        {plugin.updateAvailable ? (
                          <button
                            onClick={() => handleUpdate(plugin.id)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-700"
                          >
                            <RefreshCw size={12} />
                            {t('plugins.actions.update', 'Update')}
                          </button>
                        ) : (
                          <button className="flex-1 cursor-default rounded-lg bg-[#2a2a2d] px-3 py-2 text-xs font-medium text-gray-400">
                            {t('plugins.actions.installed', 'Installed')}
                          </button>
                        )}
                        <button
                          onClick={() => handleInstall(plugin.id)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#2a2a2d] hover:text-white">
                          <Settings size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInstall(plugin.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <Download size={12} />
                        {t('plugins.actions.install', 'Install')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Puzzle size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-sm text-gray-400">
              {t(
                'plugins.page.empty',
                'No plugins match the current filters.',
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PluginsPage;
