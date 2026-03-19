import React, { useEffect, useState } from 'react';
import { Briefcase, Clock, DollarSign, Filter, Search, Zap } from 'lucide-react';
import type { AvailableTask, TradePageRequest } from '../../entities';
import { tradeBusinessService } from '../../services';
import { TaskCard } from './TaskCard';
import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@sdkwork/react-commons';

type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<TaskDifficulty | ''>('');
  const [keyword, setKeyword] = useState('');

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

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeOptions: FilterOption[] = [
    { value: '', label: '鍏ㄩ儴绫诲瀷' },
    { value: 'TEXT_TO_VIDEO', label: '鏂囩敓瑙嗛' },
    { value: 'IMAGE_TO_VIDEO', label: '鍥剧敓瑙嗛' },
    { value: 'VIDEO_EXTEND', label: '瑙嗛鎵╁睍' },
    { value: 'VIDEO_RESTORE', label: '瑙嗛淇' },
    { value: 'VIDEO_SUPER_RESOLUTION', label: '瑙嗛瓒呭垎' },
    { value: 'AVATAR_VIDEO', label: '瑙掕壊瑙嗛' },
    { value: 'LIP_SYNC', label: '鍞囧瀷鍚屾' },
  ];

  const difficultyOptions: FilterOption[] = [
    { value: '', label: '鍏ㄩ儴闅惧害' },
    { value: 'EASY', label: '绠€鍗�' },
    { value: 'MEDIUM', label: '涓瓑' },
    { value: 'HARD', label: '鍥伴毦' },
    { value: 'EXPERT', label: '涓撳' },
  ];

  const sortOptions: FilterOption[] = [
    { value: 'latest', label: '鏈€鏂板彂甯�' },
    { value: 'budget', label: '鏈€楂樻姤閰�' },
    { value: 'difficulty', label: '鏈€楂橀毦搴�' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="border-white/10 bg-[#1e1e20] p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <Input
              className="border-white/10 bg-background pl-10 pr-4 text-white placeholder:text-gray-500"
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="鎼滅储浠诲姟..."
              type="text"
              value={keyword}
            />
          </div>

          <FilterSelect onChange={setSelectedType} options={typeOptions} placeholder="Type" value={selectedType} />
          <FilterSelect onChange={(value) => setSelectedDifficulty(value as TaskDifficulty | '')} options={difficultyOptions} placeholder="Difficulty" value={selectedDifficulty} />
          <FilterSelect onChange={(value) => setSortBy(value as typeof sortBy)} options={sortOptions} placeholder="Sort" value={sortBy} />

          <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-500" onClick={handleApplyFilters} type="button">
            <Filter size={14} />
            绛涢€�
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard bgColor="bg-blue-500/10" color="text-blue-400" icon={Zap} label="鍙帴浠诲姟" value={total.toString()} />
        <StatCard bgColor="bg-green-500/10" color="text-green-400" icon={DollarSign} label="鎬婚绠�" value="楼12,580" />
        <StatCard bgColor="bg-purple-500/10" color="text-purple-400" icon={Briefcase} label="宸叉帴浠诲姟" value="24" />
        <StatCard bgColor="bg-yellow-500/10" color="text-yellow-400" icon={Clock} label="杩涜涓�" value="3" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">鍔犺浇涓�..</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-500">鏆傛棤鍙帴浠诲姟</div>
            <div className="text-xs text-gray-600">璇风◢鍚庡啀鏉ョ湅鐪嬫柊浠诲姟</div>
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
          <Button className="border-white/10 bg-[#2a2a2d] text-xs text-gray-400 hover:bg-white/10 hover:text-white" disabled={page === 1} onClick={() => handlePageChange(page - 1)} type="button" variant="outline">
            涓婁竴椤�
          </Button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <Button className="border-white/10 bg-[#2a2a2d] text-xs text-gray-400 hover:bg-white/10 hover:text-white" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)} type="button" variant="outline">
            涓嬩竴椤�
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const FilterSelect: React.FC<FilterSelectProps> = ({ value, options, placeholder, onChange }) => {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="w-full min-w-[180px] border-white/10 bg-background text-sm text-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#1e1e20] text-white">
        {options.map((option) => (
          <SelectItem key={option.value || '__empty'} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
