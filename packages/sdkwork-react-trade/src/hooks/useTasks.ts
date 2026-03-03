import { useState, useEffect, useCallback } from 'react';
import type { AvailableTask, TradePageRequest } from '../entities';
import { tradeBusinessService } from '../services';

interface UseTasksOptions {
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseTasksReturn {
  tasks: AvailableTask[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  filters: TradePageRequest;
  setFilters: React.Dispatch<React.SetStateAction<TradePageRequest>>;
  setPage: (page: number) => void;
  refresh: () => void;
  acceptTask: typeof tradeBusinessService.taskService.acceptTask;
  getAvailableTasks: typeof tradeBusinessService.taskService.getAvailableTasks;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const {
    pageSize = 9,
    autoLoad = true,
  } = options;

  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tradeBusinessService.taskService.getAvailableTasks(filters);
      setTasks(result.items);
      setTotal(result.total);
      setPageState(result.currentPage);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoLoad) {
      loadTasks();
    }
  }, [autoLoad, loadTasks]);

  const setPage = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return {
    tasks,
    loading,
    total,
    page,
    totalPages,
    filters,
    setFilters,
    setPage,
    refresh: loadTasks,
    acceptTask: tradeBusinessService.taskService.acceptTask,
    getAvailableTasks: tradeBusinessService.taskService.getAvailableTasks,
  };
}

