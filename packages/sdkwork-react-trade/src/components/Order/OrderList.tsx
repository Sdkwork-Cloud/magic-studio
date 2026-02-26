import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import type { Order, OrderStatus, OrderType, TradePageRequest } from '../../entities';
import { orderService } from '../../services/orderService';
import { OrderCard } from './OrderCard';
import { cn } from '@sdkwork/react-commons';

interface OrderListProps {
  onOrderClick?: (order: Order) => void;
  onPay?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  className?: string;
  showFilters?: boolean;
  initialStatus?: OrderStatus;
  initialType?: OrderType;
}

export const OrderList: React.FC<OrderListProps> = ({
  onOrderClick,
  onPay,
  onCancel,
  className = '',
  showFilters = true,
  initialStatus,
  initialType,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
    status: initialStatus,
    type: initialType,
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await orderService.getMyOrderList(filters);
      setOrders(result.items);
      setTotal(result.total);
      setPage(result.currentPage);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  const handleTypeChange = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      type: type || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const totalPages = Math.ceil(total / pageSize);

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: '全部状�? },
    { value: 'PENDING_PAYMENT', label: '待支�? },
    { value: 'PAID', label: '已支�? },
    { value: 'IN_PROGRESS', label: '进行�? },
    { value: 'COMPLETED', label: '已完�? },
    { value: 'CANCELLED', label: '已取�? },
  ];

  const typeOptions: { value: string; label: string }[] = [
    { value: '', label: '全部类型' },
    { value: 'VIDEO_GENERATION', label: '视频生成' },
    { value: 'IMAGE_GENERATION', label: '图片生成' },
    { value: 'AUDIO_GENERATION', label: '音频生成' },
    { value: 'MUSIC_GENERATION', label: '音乐生成' },
    { value: 'VIDEO_EDITING', label: '视频编辑' },
    { value: 'CUSTOM_SERVICE', label: '定制服务' },
    { value: 'SUBSCRIPTION', label: '订阅' },
    { value: 'CREDIT_TOPUP', label: '充�? },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-white">筛�?/span>
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              {showFilterPanel ? '收起' : '展开'}
              <ChevronDown
                size={12}
                className={cn('transition-transform', showFilterPanel && 'rotate-180')}
              />
            </button>
          </div>

          {showFilterPanel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">订单状�?/label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">订单类型</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!showFilterPanel && (
            <div className="flex items-center gap-2">
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.type || ''}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="bg-[#2a2a2d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Order List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">加载�?..</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">暂无订单</div>
            <div className="text-xs text-gray-600">快去创建你的第一笔订单吧</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.uuid}
              order={order}
              onClick={onOrderClick}
              onPay={onPay}
              onCancel={onCancel}
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
