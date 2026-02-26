import React, { useState, useEffect } from 'react';
import { Search, Filter, Zap, Briefcase, Clock, DollarSign } from 'lucide-react';
import type { AvailableTask, TradePageRequest } from '../../entities';
import { taskService } from '../../services/taskService';
import { TaskCard } from './TaskCard';
import { cn } from '@sdkwork/react-commons';

interface TaskListProps {
  onTaskAccept?: (task: AvailableTask) => void;
  onTaskViewDetail?: (task: AvailableTask) => void;
  className?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  onTaskAccept,
  onTaskViewDetail,
  className = '',
}) => {
  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
  });

  const [sortBy, setSortBy] = useState<'latest' | 'budget' | 'difficulty'>('latest');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await taskService.getAvailableTasks(filters);
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
      status: undefined,
      keyword: keyword || undefined,
      sortBy: sortBy === 'budget' ? 'budget' : sortBy === 'difficulty' ? 'difficulty' : undefined,
      sortOrder: sortBy === 'budget' ? 'desc' : 'asc',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeOptions: { value: string; label: string }[] = [
    { value: '', label: '全部类型' },
    { value: 'TEXT_TO_VIDEO', label: '文生视频' },
    { value: 'IMAGE_TO_VIDEO', label: '图生视频' },
    { value: 'VIDEO_EXTEND', label: '视频扩展' },
    { value: 'VIDEO_RESTORE', label: '视频修复' },
    { value: 'VIDEO_SUPER_RESOLUTION', label: '视频超分' },
    { value: 'AVATAR_VIDEO', label: '数字人视�? },
    { value: 'LIP_SYNC', label: '口型同步' },
  ];

  const difficultyOptions: { value: string; label: string }[] = [
    { value: '', label: '全部难度' },
    { value: 'EASY', label: '简�? },
    { value: 'MEDIUM', label: '中等' },
    { value: 'HARD', label: '困难' },
    { value: 'EXPERT', label: '专家' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search & Filters */}
      <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="搜索任务..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full bg-[#2a2a2d] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
          >
            {difficultyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
          >
            <option value="latest">最新发�?/option>
            <option value="budget">最高预�?/option>
            <option value="difficulty">最高难�?/option>
          </select>

          {/* Apply Button */}
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Filter size={14} />
            筛�?          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="可接任务"
          value={total.toString()}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="总预算池"
          value="¥12,580"
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={Briefcase}
          label="已接任务"
          value="24"
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          icon={Clock}
          label="进行�?
          value="3"
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
        />
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">加载�?..</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">暂无可接任务</div>
            <div className="text-xs text-gray-600">请稍后再来查看新任务</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.uuid}
              task={task}
              onAccept={onTaskAccept}
              onViewDetail={onTaskViewDetail}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 bg-[#2a2a2d] border border-white/10 rounded-lg text-xs text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 hover:text-white transition-colors"
          >
            上一�?          </button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-[#2a2a2d] border border-white/10 rounded-lg text-xs text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 hover:text-white transition-colors"
          >
            下一�?          </button>
        </div>
      )}
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
  <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={cn('p-1.5 rounded-lg', bgColor)}>
        <Icon size={14} className={color} />
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <div className="text-lg font-bold text-white">{value}</div>
  </div>
);
