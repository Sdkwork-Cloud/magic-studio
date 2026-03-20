import React, { useEffect, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Button, cn } from '@sdkwork/react-commons';
import type { Order, OrderStatus, OrderType, TradePageRequest } from '../../entities';
import { tradeBusinessService } from '../../services';
import { useTradeI18n } from '../../useTradeI18n';
import { OrderCard } from './OrderCard';

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
  const { t, orderStatusLabel, orderTypeLabel } = useTradeI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const pageSize = 10;

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
    status: initialStatus,
    type: initialType,
  });

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

  const handlePageChange = (nextPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  const totalPages = Math.ceil(total / pageSize);

  const statusOptions: FilterOption[] = [
    { value: '', label: t('market.order.filters.all_statuses', 'All Statuses') },
    { value: 'PENDING_PAYMENT', label: orderStatusLabel('PENDING_PAYMENT' as OrderStatus) },
    { value: 'PAID', label: orderStatusLabel('PAID' as OrderStatus) },
    { value: 'IN_PROGRESS', label: orderStatusLabel('IN_PROGRESS' as OrderStatus) },
    { value: 'COMPLETED', label: orderStatusLabel('COMPLETED' as OrderStatus) },
    { value: 'CANCELLED', label: orderStatusLabel('CANCELLED' as OrderStatus) },
  ];

  const typeOptions: FilterOption[] = [
    { value: '', label: t('market.order.filters.all_types', 'All Types') },
    { value: 'VIDEO_GENERATION', label: orderTypeLabel('VIDEO_GENERATION' as OrderType) },
    { value: 'IMAGE_GENERATION', label: orderTypeLabel('IMAGE_GENERATION' as OrderType) },
    { value: 'AUDIO_GENERATION', label: orderTypeLabel('AUDIO_GENERATION' as OrderType) },
    { value: 'MUSIC_GENERATION', label: orderTypeLabel('MUSIC_GENERATION' as OrderType) },
    { value: 'VIDEO_EDITING', label: orderTypeLabel('VIDEO_EDITING' as OrderType) },
    { value: 'CUSTOM_SERVICE', label: orderTypeLabel('CUSTOM_SERVICE' as OrderType) },
    { value: 'SUBSCRIPTION', label: orderTypeLabel('SUBSCRIPTION' as OrderType) },
    { value: 'CREDIT_TOPUP', label: orderTypeLabel('CREDIT_TOPUP' as OrderType) },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {showFilters ? (
        <div className="rounded-xl border border-white/10 bg-[#1e1e20] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={16} />
              <span className="text-sm font-medium text-white">
                {t('market.order.filters.title', 'Order Filters')}
              </span>
            </div>
            <Button
              className="h-auto gap-1 px-0 text-xs text-gray-400 hover:text-white"
              onClick={() => setShowFilterPanel((value) => !value)}
              type="button"
              variant="ghost"
            >
              {showFilterPanel ? t('market.common.hide', 'Hide') : t('market.common.show', 'Show')}
              <ChevronDown className={cn('transition-transform', showFilterPanel && 'rotate-180')} size={12} />
            </Button>
          </div>

          {showFilterPanel ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">{t('market.order.filters.status', 'Status')}</label>
                <FilterSelect
                  onChange={handleStatusChange}
                  options={statusOptions}
                  placeholder={t('market.order.filters.status', 'Status')}
                  value={filters.status || ''}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">{t('market.order.type', 'Order Type')}</label>
                <FilterSelect
                  onChange={handleTypeChange}
                  options={typeOptions}
                  placeholder={t('market.order.type', 'Order Type')}
                  value={filters.type || ''}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FilterSelect
                onChange={handleStatusChange}
                options={statusOptions}
                placeholder={t('market.order.filters.status', 'Status')}
                value={filters.status || ''}
              />
              <FilterSelect
                onChange={handleTypeChange}
                options={typeOptions}
                placeholder={t('market.order.type', 'Order Type')}
                value={filters.type || ''}
              />
            </div>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">{t('market.common.loading', 'Loading...')}</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-500">{t('market.order.empty.title', 'No orders yet')}</div>
            <div className="text-xs text-gray-600">
              {t('market.order.empty.description', 'Try adjusting filters or create a new order.')}
            </div>
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
        className="min-w-[140px] appearance-none rounded-lg border border-white/10 bg-background px-3 py-2 pr-8 text-xs text-white outline-none transition-colors hover:border-white/20 focus:border-blue-500/50"
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
