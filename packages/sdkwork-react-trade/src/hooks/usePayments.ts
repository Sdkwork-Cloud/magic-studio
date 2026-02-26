import { useState, useEffect, useCallback } from 'react';
import type { Payment, PaymentStatus, TradePageRequest } from '../entities';
import { paymentService } from '../services/paymentService';

interface UsePaymentsOptions {
  initialStatus?: PaymentStatus;
  pageSize?: number;
  autoLoad?: boolean;
}

interface UsePaymentsReturn {
  payments: Payment[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  filters: TradePageRequest;
  setFilters: React.Dispatch<React.SetStateAction<TradePageRequest>>;
  setPage: (page: number) => void;
  refresh: () => void;
  initiatePayment: typeof paymentService.initiatePayment;
  getWallet: typeof paymentService.getWallet;
}

export function usePayments(options: UsePaymentsOptions = {}): UsePaymentsReturn {
  const {
    initialStatus,
    pageSize = 10,
    autoLoad = true,
  } = options;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);

  const [filters, setFilters] = useState<TradePageRequest>({
    page: 1,
    pageSize,
    status: initialStatus,
  });

  const totalPages = Math.ceil(total / pageSize);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await paymentService.getMyPaymentList(filters);
      setPayments(result.items);
      setTotal(result.total);
      setPageState(result.currentPage);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoLoad) {
      loadPayments();
    }
  }, [autoLoad, loadPayments]);

  const setPage = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return {
    payments,
    loading,
    total,
    page,
    totalPages,
    filters,
    setFilters,
    setPage,
    refresh: loadPayments,
    initiatePayment: paymentService.initiatePayment,
    getWallet: paymentService.getWallet,
  };
}
