
import {
  PlanTier,
  type BillingCycle,
  type Subscription,
  type VipPurchasePaymentMethod,
} from '../entities';
import { vipBusinessService } from '../services';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface VipStoreContextType {
  currentSubscription: Subscription | null;
  refreshStatus: () => Promise<void>;
  subscribe: (
    planId: PlanTier,
    billingCycle?: BillingCycle,
    paymentMethod?: VipPurchasePaymentMethod,
  ) => Promise<void>;
  isProcessing: boolean;
}

const VipStoreContext = createContext<VipStoreContextType | undefined>(undefined);

export const VipStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await vipBusinessService.getStatus();
      setCurrentSubscription(status);
    } catch (error) {
      console.error('Failed to refresh VIP status', error);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const subscribe = useCallback(
    async (
      planId: PlanTier,
      billingCycle: BillingCycle = 'month',
      paymentMethod: VipPurchasePaymentMethod = 'balance',
    ) => {
      setIsProcessing(true);
      try {
        const sub = await vipBusinessService.subscribe(planId, billingCycle, paymentMethod);
        setCurrentSubscription(sub);
      } catch (error) {
        console.error('Subscription failed', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return (
    <VipStoreContext.Provider
      value={{ currentSubscription, refreshStatus, subscribe, isProcessing }}
    >
      {children}
    </VipStoreContext.Provider>
  );
};

export const useVipStore = () => {
  const context = useContext(VipStoreContext);
  if (!context) throw new Error('useVipStore must be used within a VipStoreProvider');
  return context;
};

