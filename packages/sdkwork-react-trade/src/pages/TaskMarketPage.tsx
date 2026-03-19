import React, { useMemo, useState } from 'react';
import {
  Award,
  Banknote,
  Briefcase,
  DollarSign,
  FileText,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { ROUTES, useRouter } from '@sdkwork/react-core';
import { TradeLayout } from '../components/Layout/TradeLayout';
import { TaskCard } from '../components/Task/TaskCard';
import type { AvailableTask, TradePageRequest } from '../entities';
import { tradeBusinessService } from '../services';
import { formatTradeCurrency, useTradeI18n } from '../useTradeI18n';

type TaskMarketTab = 'market' | 'orders' | 'published' | 'wallet';
type SortBy = 'latest' | 'budget' | 'difficulty';
type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

const TaskMarketPage: React.FC = () => {
  const { navigate } = useRouter();
  const { t, difficultyLabel, taskTypeLabel } = useTradeI18n();
  const [activeTab, setActiveTab] = useState<TaskMarketTab>('market');
  const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<TaskDifficulty | ''>('');
  const [keyword, setKeyword] = useState('');
  const pageSize = 9;
  const [filters, setFilters] = useState<TradePageRequest>({ page: 1, pageSize });

  React.useEffect(() => {
    void loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    setLoading(true);

    try {
      const result = await tradeBusinessService.taskService.getAvailableTasks(filters);
      setTasks(result.items);
      setTotal(result.total);
      setPage(result.currentPage);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (task: AvailableTask) => {
    try {
      await tradeBusinessService.taskService.acceptTask({ taskUuid: task.uuid });
      alert(t('market.actions.accept_success'));
      setSelectedTask(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to accept task:', error);
      alert(t('market.actions.accept_failed'));
    }
  };

  const handleApplyFilters = () => {
    setFilters({
      page: 1,
      pageSize,
      type: selectedType || undefined,
      difficulty: selectedDifficulty || undefined,
      keyword: keyword || undefined,
      sortBy: sortBy === 'latest' ? undefined : sortBy,
      sortOrder: sortBy === 'budget' ? 'desc' : 'asc',
    });
  };

  const handlePageChange = (nextPage: number) => {
    setFilters((prev) => ({ ...prev, page: nextPage }));
  };

  const totalPages = Math.ceil(total / pageSize);
  const stats = useMemo(() => ({
    totalTasks: total,
    totalBudget: tasks.reduce((sum, task) => sum + task.budget, 0),
    activeUsers: 128,
    completedToday: 24,
  }), [tasks, total]);

  const tabs = [
    { id: 'market', label: t('market.pages.task_market.tabs.market'), icon: Zap },
    { id: 'orders', label: t('market.pages.task_market.tabs.orders'), icon: FileText },
    { id: 'published', label: t('market.pages.task_market.tabs.published'), icon: Briefcase },
    { id: 'wallet', label: t('market.pages.task_market.tabs.wallet'), icon: DollarSign },
  ] as const;

  const typeOptions = [
    { value: '', label: t('market.task.list.all_types') },
    { value: 'TEXT_TO_VIDEO', label: taskTypeLabel('TEXT_TO_VIDEO' as never) },
    { value: 'IMAGE_TO_VIDEO', label: taskTypeLabel('IMAGE_TO_VIDEO' as never) },
    { value: 'VIDEO_EXTEND', label: taskTypeLabel('VIDEO_EXTEND' as never) },
    { value: 'VIDEO_RESTORE', label: taskTypeLabel('VIDEO_RESTORE' as never) },
  ];

  const difficultyOptions = [
    { value: '', label: t('market.task.difficulty.all') },
    { value: 'EASY', label: difficultyLabel('EASY') },
    { value: 'MEDIUM', label: difficultyLabel('MEDIUM') },
    { value: 'HARD', label: difficultyLabel('HARD') },
    { value: 'EXPERT', label: difficultyLabel('EXPERT') },
  ];

  return (
    <TradeLayout>
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-900/30 via-cyan-900/20 to-[#0a0a0f] border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
              <Briefcase size={16} className="text-blue-400" />
              <span className="text-xs text-gray-300">{t('market.pages.task_market.badge')}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                {t('market.pages.task_market.title')}
              </span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('market.pages.task_market.subtitle')}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder={t('market.task.list.search_placeholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleApplyFilters()}
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
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

            {activeTab === 'market' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(event) => setSelectedDifficulty(event.target.value as TaskDifficulty | '')}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortBy)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="latest">{t('market.task.list.sort_latest')}</option>
                  <option value="budget">{t('market.task.list.sort_budget')}</option>
                  <option value="difficulty">{t('market.task.list.sort_difficulty')}</option>
                </select>
                <button
                  onClick={handleApplyFilters}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
                >
                  <Filter size={14} /> {t('market.common.filters')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'market' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Zap}
                iconClassName="text-blue-400"
                iconWrapperClassName="bg-blue-500/20"
                value={stats.totalTasks.toString()}
                label={t('market.task.list.available')}
              />
              <StatCard
                icon={Banknote}
                iconClassName="text-green-400"
                iconWrapperClassName="bg-green-500/20"
                value={formatTradeCurrency(stats.totalBudget)}
                label={t('market.task.list.total_budget')}
              />
              <StatCard
                icon={Users}
                iconClassName="text-purple-400"
                iconWrapperClassName="bg-purple-500/20"
                value={stats.activeUsers.toString()}
                label={t('market.task.list.active_users')}
              />
              <StatCard
                icon={TrendingUp}
                iconClassName="text-yellow-400"
                iconWrapperClassName="bg-yellow-500/20"
                value={stats.completedToday.toString()}
                label={t('market.pages.task_market.stats_completed_today')}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">{t('market.common.loading')}</span>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Briefcase size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{t('market.task.list.empty_title')}</h3>
                  <p className="text-sm text-gray-500">{t('market.task.list.empty_description')}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tasks.map((task) => (
                    <TaskCard key={task.uuid} task={task} onAccept={handleAcceptTask} onViewDetail={setSelectedTask} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 bg-[#1e1e20] border border-white/10 rounded-lg text-sm text-gray-400 disabled:opacity-50"
                    >
                      {t('market.common.previous')}
                    </button>
                    <span className="text-sm text-gray-500 px-4">{page} / {totalPages}</span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-[#1e1e20] border border-white/10 rounded-lg text-sm text-gray-400 disabled:opacity-50"
                    >
                      {t('market.common.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-base font-semibold text-white mb-2">{t('market.pages.task_market.order_title')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('market.pages.task_market.order_description')}</p>
              <button
                onClick={() => navigate(ROUTES.MY_TASKS)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
              >
                {t('market.pages.my_tasks.tabs.orders')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'published' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-base font-semibold text-white mb-2">{t('market.pages.task_market.publish_title')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('market.pages.task_market.publish_description')}</p>
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                {t('market.pages.task_market.publish_action')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="max-w-2xl mx-auto py-8">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-8 mb-6">
              <div className="text-sm text-gray-400 mb-2">{t('market.wallet.total_balance')}</div>
              <div className="text-4xl font-bold text-white mb-4">{formatTradeCurrency(100000)}</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e1e20] rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{t('market.wallet.available_balance')}</div>
                  <div className="text-lg font-semibold text-white">{formatTradeCurrency(100000)}</div>
                </div>
                <div className="bg-[#1e1e20] rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{t('market.wallet.frozen_balance')}</div>
                  <div className="text-lg font-semibold text-white">{formatTradeCurrency(0)}</div>
                </div>
              </div>
            </div>
            <div className="bg-[#141416] border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{t('market.wallet.points')}</div>
                  <div className="text-xs text-gray-500">{t('market.common.points_rule')}</div>
                </div>
                <div className="text-2xl font-bold text-purple-400">10,000</div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg">
                  {t('market.wallet.redeem_points')}
                </button>
                <button className="flex-1 px-4 py-2 bg-[#1e1e20] hover:bg-white/10 text-white text-sm font-medium rounded-lg">
                  {t('market.wallet.earn_points')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e20] hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium">
                <DollarSign size={16} /> {t('market.wallet.top_up')}
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e20] hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium">
                <FileText size={16} /> {t('market.wallet.transaction_history')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-gradient-to-r from-blue-900/30 via-cyan-900/30 to-teal-900/30 rounded-2xl p-8 border border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award size={24} className="text-blue-400" />
                <h2 className="text-xl font-bold text-white">{t('market.pages.task_market.publish_title')}</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
                {t('market.pages.task_market.publish_description')}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                  <Sparkles size={16} />
                  {t('market.pages.task_market.publish_action')}
                </button>
                <button
                  onClick={() => navigate(ROUTES.PORTAL_SKILLS)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors"
                >
                  {t('market.pages.task_market.learn_more')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                  aria-label={t('market.common.close')}
                >
                  <span className="text-gray-400 text-xl">×</span>
                </button>
              </div>
              <TaskCard task={selectedTask} onAccept={handleAcceptTask} />
            </div>
          </div>
        </div>
      )}
    </TradeLayout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  iconClassName: string;
  iconWrapperClassName: string;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  value,
  label,
}) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconWrapperClassName}`}>
        <Icon size={20} className={iconClassName} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  </div>
);

export { TaskMarketPage };
