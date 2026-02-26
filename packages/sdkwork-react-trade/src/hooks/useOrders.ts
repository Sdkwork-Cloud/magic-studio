import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, OrderType, TradePageRequest } from '../entities';
import { orderService } from '../services/orderService';

interface UseOrdersOptions {
  initialStatus?: OrderStatus;
  initialType?: OrderType;
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  filters: TradePageRequest;
  setFilters: React.Dispatch<React.SetStateAction<TradePageRequest>>;
  setPage: (page: number) => void;
  refresh: () => void;
  createOrder: typeof orderService.createOrder;
  cancelOrder: typeof orderService.cancelOrder;
  getOrderStatistics: typeof orderService.getOrderStatistics;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const {
    initialStatus,
    initialType,
    pageSize = 10,
    autoLoad = true,
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
    status: initialStatus,
    type: initialType,
  });

  const totalPages = Math.ceil(total / pageSize);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orderService.getMyOrderList(filters);
      setOrders(result.items);
      setTotal(result.total);
      setPageState(result.currentPage);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoLoad) {
      loadOrders();
    }
  }, [autoLoad, loadOrders]);

  const setPage = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return {
    orders,
    loading,
    total,
    page,
    totalPages,
    filters,
    setFilters,
    setPage,
    refresh: loadOrders,
    createOrder: orderService.createOrder,
    cancelOrder: orderService.cancelOrder,
    getOrderStatistics: orderService.getOrderStatistics,
  };
}
