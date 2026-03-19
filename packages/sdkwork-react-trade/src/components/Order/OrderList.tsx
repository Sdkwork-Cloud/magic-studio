import React, { useEffect, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import type { Order, OrderStatus, OrderType, TradePageRequest } from '../../entities';
import { tradeBusinessService } from '../../services';
import { OrderCard } from './OrderCard';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@sdkwork/react-commons';

interface OrderListProps {
  onOrderClick?: (order: Order) => void;
  onPay?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  className?: string;
  showFilters?: boolean;
  initialStatus?: OrderStatus;
  initialType?: OrderType;
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
    void loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await tradeBusinessService.orderService.getMyOrderList(filters);
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

  const statusOptions: FilterOption[] = [
    { value: '', label: '鍏ㄩ儴鐘舵€�' },
    { value: 'PENDING_PAYMENT', label: '寰呮敮浠�' },
    { value: 'PAID', label: '宸叉敮浠�' },
    { value: 'IN_PROGRESS', label: '杩涜涓�' },
    { value: 'COMPLETED', label: '宸插畬鎴�' },
    { value: 'CANCELLED', label: '宸插彇娑�' },
  ];

  const typeOptions: FilterOption[] = [
    { value: '', label: '鍏ㄩ儴绫诲瀷' },
    { value: 'VIDEO_GENERATION', label: '瑙嗛鐢熸垚' },
    { value: 'IMAGE_GENERATION', label: '鍥剧墖鐢熸垚' },
    { value: 'AUDIO_GENERATION', label: '闊抽鐢熸垚' },
    { value: 'MUSIC_GENERATION', label: '闊充箰鐢熸垚' },
    { value: 'VIDEO_EDITING', label: '瑙嗛缂栬緫' },
    { value: 'CUSTOM_SERVICE', label: '瀹氬埗鏈嶅姟' },
    { value: 'SUBSCRIPTION', label: '璁㈤槄' },
    { value: 'CREDIT_TOPUP', label: '鍏呭€�' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {showFilters ? (
        <div className="rounded-xl border border-white/10 bg-[#1e1e20] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={16} />
              <span className="text-sm font-medium text-white">绛涢€�</span>
            </div>
            <Button
              className="h-auto gap-1 px-0 text-xs text-gray-400 hover:text-white"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              type="button"
              variant="ghost"
            >
              {showFilterPanel ? '鏀惰捣' : '灞曞紑'}
              <ChevronDown className={cn('transition-transform', showFilterPanel && 'rotate-180')} size={12} />
            </Button>
          </div>

          {showFilterPanel ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">璁㈠崟鐘舵€�</label>
                <FilterSelect onChange={handleStatusChange} options={statusOptions} placeholder="Status" value={filters.status || ''} />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">璁㈠崟绫诲瀷</label>
                <FilterSelect onChange={handleTypeChange} options={typeOptions} placeholder="Type" value={filters.type || ''} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FilterSelect onChange={handleStatusChange} options={statusOptions} placeholder="Status" value={filters.status || ''} />
              <FilterSelect onChange={handleTypeChange} options={typeOptions} placeholder="Type" value={filters.type || ''} />
            </div>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">鍔犺浇涓�..</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-500">鏆傛棤璁㈠崟</div>
            <div className="text-xs text-gray-600">蹇幓鍒涘缓浣犵殑绗竴绗旇鍗曞惂</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.uuid} onCancel={onCancel} onClick={onOrderClick} onPay={onPay} order={order} />
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
      <SelectTrigger className="border-white/10 bg-background text-xs text-white">
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
