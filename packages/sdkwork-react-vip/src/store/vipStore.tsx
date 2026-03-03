
import { PlanTier, Subscription } from '../entities'
import { vipBusinessService } from '../services'
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VipStoreContextType {
  currentSubscription: Subscription | null;
  subscribe: (planId: PlanTier, billingCycle?: 'month' | 'year' | 'onetime') => Promise<void>;
  isProcessing: boolean;
}

const VipStoreContext = createContext<VipStoreContextType | undefined>(undefined);

export const VipStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>({
      planId: PlanTier.FREE,
      status: 'active',
      expiresAt: 0
    });
  const [isProcessing, setIsProcessing] = useState(false);

  const subscribe = async (planId: PlanTier, billingCycle: 'month' | 'year' | 'onetime' = 'month') => {
    setIsProcessing(true);
    try {
      const sub = await vipBusinessService.subscribe(planId, billingCycle);
      setCurrentSubscription(sub);
    } catch (e) {
      console.error('Subscription failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VipStoreContext.Provider value={{ currentSubscription, subscribe, isProcessing }}>
      {children}
    </VipStoreContext.Provider>
  );
};

export const useVipStore = () => {
  const context = useContext(VipStoreContext);
  if (!context) throw new Error('useVipStore must be used within a VipStoreProvider');
  return context;
};

