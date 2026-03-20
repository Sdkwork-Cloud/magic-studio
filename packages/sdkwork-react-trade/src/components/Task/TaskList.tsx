import React, { useEffect, useState } from 'react';
import { Briefcase, ChevronDown, Clock, DollarSign, Filter, Search, Zap } from 'lucide-react';
import { Button, Card, cn } from '@sdkwork/react-commons';
import type { AvailableTask, TradePageRequest } from '../../entities';
import { tradeBusinessService } from '../../services';
import { formatTradeCurrency, useTradeI18n } from '../../useTradeI18n';
import { TaskCard } from './TaskCard';

type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
type TaskSortBy = 'latest' | 'budget' | 'difficulty';

interface TaskListProps {
  onTaskAccept?: (task: AvailableTask) => void;
  onTaskViewDetail?: (task: AvailableTask) => void;
  className?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  options: FilterOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  onTaskAccept,
  onTaskViewDetail,
  className = '',
}) => {
  const { t, difficultyLabel, taskTypeLabel } = useTradeI18n();
  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TaskSortBy>('latest');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<TaskDifficulty | ''>('');
  const [keyword, setKeyword] = useState('');
  const pageSize = 9;

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
  });

  useEffect(() => {
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

  const handleApplyFilters = () => {
    setFilters({
      page: 1,
      pageSize,
      type: selectedType || undefined,
      difficulty: selectedDifficulty || undefined,
      status: undefined,
      keyword: keyword || undefined,
      sortBy: sortBy === 'budget' ? 'budget' : sortBy === 'difficulty' ? 'difficulty' : undefined,
      sortOrder: sortBy === 'budget' ? 'desc' : 'asc',
    });
  };

  const handlePageChange = (nextPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  const totalPages = Math.ceil(total / pageSize);
  const totalBudget = tasks.reduce((sum, task) => sum + task.budget, 0);
  const acceptedTasks = tasks.filter((task) => task.status === 'ACCEPTED').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length;

  const typeOptions: FilterOption[] = [
    { value: '', label: t('market.task.list.all_types', 'All Types') },
    { value: 'TEXT_TO_VIDEO', label: taskTypeLabel('TEXT_TO_VIDEO' as never) },
    { value: 'IMAGE_TO_VIDEO', label: taskTypeLabel('IMAGE_TO_VIDEO' as never) },
    { value: 'VIDEO_EXTEND', label: taskTypeLabel('VIDEO_EXTEND' as never) },
    { value: 'VIDEO_RESTORE', label: taskTypeLabel('VIDEO_RESTORE' as never) },
    { value: 'VIDEO_SUPER_RESOLUTION', label: taskTypeLabel('VIDEO_SUPER_RESOLUTION' as never) },
    { value: 'AVATAR_VIDEO', label: taskTypeLabel('AVATAR_VIDEO' as never) },
    { value: 'LIP_SYNC', label: taskTypeLabel('LIP_SYNC' as never) },
  ];

  const difficultyOptions: FilterOption[] = [
    { value: '', label: t('market.task.difficulty.all', 'All Difficulty') },
    { value: 'EASY', label: difficultyLabel('EASY') },
    { value: 'MEDIUM', label: difficultyLabel('MEDIUM') },
    { value: 'HARD', label: difficultyLabel('HARD') },
    { value: 'EXPERT', label: difficultyLabel('EXPERT') },
  ];

  const sortOptions: FilterOption[] = [
    { value: 'latest', label: t('market.task.list.sort_latest', 'Latest') },
    { value: 'budget', label: t('market.task.list.sort_budget', 'Highest Budget') },
    { value: 'difficulty', label: t('market.task.list.sort_difficulty', 'Highest Difficulty') },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="border-white/10 bg-[#1e1e20] p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              className="w-full rounded-lg border border-white/10 bg-background py-2 pl-10 pr-4 text-white outline-none transition-colors hover:border-white/20 focus:border-blue-500/50"
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleApplyFilters()}
              placeholder={t('market.task.list.search_placeholder', 'Search tasks...')}
              type="text"
              value={keyword}
            />
          </div>

          <FilterSelect
            onChange={setSelectedType}
            options={typeOptions}
            placeholder={t('market.task.list.all_types', 'All Types')}
            value={selectedType}
          />
          <FilterSelect
            onChange={(value) => setSelectedDifficulty(value as TaskDifficulty | '')}
            options={difficultyOptions}
            placeholder={t('market.task.difficulty.all', 'All Difficulty')}
            value={selectedDifficulty}
          />
          <FilterSelect
            onChange={(value) => setSortBy(value as TaskSortBy)}
            options={sortOptions}
            placeholder={t('market.task.list.sort_latest', 'Latest')}
            value={sortBy}
          />

          <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-500" onClick={handleApplyFilters} type="button">
            <Filter size={14} />
            {t('market.common.filters', 'Filters')}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          bgColor="bg-blue-500/10"
          color="text-blue-400"
          icon={Zap}
          label={t('market.task.list.available', 'Available Tasks')}
          value={total.toString()}
        />
        <StatCard
          bgColor="bg-green-500/10"
          color="text-green-400"
          icon={DollarSign}
          label={t('market.task.list.total_budget', 'Total Budget')}
          value={formatTradeCurrency(totalBudget)}
        />
        <StatCard
          bgColor="bg-purple-500/10"
          color="text-purple-400"
          icon={Briefcase}
          label={t('market.task.accepted', 'Accepted')}
          value={acceptedTasks.toString()}
        />
        <StatCard
          bgColor="bg-yellow-500/10"
          color="text-yellow-400"
          icon={Clock}
          label={t('market.task.list.in_progress', 'In Progress')}
          value={inProgressTasks.toString()}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">{t('market.common.loading', 'Loading...')}</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-500">{t('market.task.list.empty_title', 'No available tasks')}</div>
            <div className="text-xs text-gray-600">
              {t('market.task.list.empty_description', 'Try again later for new opportunities.')}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.uuid} onAccept={onTaskAccept} onViewDetail={onTaskViewDetail} task={task} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            className="border-white/10 bg-[#2a2a2d] text-xs text-gray-400 hover:bg-white/10 hover:text-white"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            type="button"
            variant="secondary"
          >
            {t('market.common.previous', 'Previous')}
          </Button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            className="border-white/10 bg-[#2a2a2d] text-xs text-gray-400 hover:bg-white/10 hover:text-white"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            type="button"
            variant="secondary"
          >
            {t('market.common.next', 'Next')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const FilterSelect: React.FC<FilterSelectProps> = ({ value, options, placeholder, onChange }) => {
  return (
    <div className="relative">
      <select
        aria-label={placeholder}
        className="w-full min-w-[180px] appearance-none rounded-lg border border-white/10 bg-background px-3 py-2 pr-8 text-sm text-white outline-none transition-colors hover:border-white/20 focus:border-blue-500/50"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || '__empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}) => (
  <Card className="border-white/10 bg-[#1e1e20] p-4">
    <div className="mb-2 flex items-center gap-2">
      <div className={cn('rounded-lg p-1.5', bgColor)}>
        <Icon className={color} size={14} />
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <div className="text-lg font-bold text-white">{value}</div>
  </Card>
);
