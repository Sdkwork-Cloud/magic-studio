import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Sparkles, X } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { PlanTier, type BillingCycle, type VipPlan } from '../entities';
import { vipBusinessService } from '../services/vipBusinessService';
import { resolveVipPricingOption } from '../services/vipServerMapper';
import { useVipStore } from '../store';
import { PaymentModal } from './PaymentModal';

interface PricingModalProps {
  onClose: () => void;
}

interface SelectedPlan {
  planId: PlanTier;
  planName: string;
  price: number;
  currency: string;
  billingCycle: string;
  purchaseCycle: BillingCycle;
}

const TAB_CONFIG: Array<{
  id: BillingCycle;
  labelKey: 'yearly' | 'monthly' | 'single';
  discountKey?: 'yearly' | 'monthly';
}> = [
  { id: 'year', labelKey: 'yearly', discountKey: 'yearly' },
  { id: 'month', labelKey: 'monthly', discountKey: 'monthly' },
  { id: 'onetime', labelKey: 'single' },
];

const BADGE_MAP: Partial<Record<PlanTier, 'basic' | 'standard' | 'premium'>> = {
  basic: 'basic',
  standard: 'standard',
  premium: 'premium',
};

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const { t, locale } = useTranslation();
  const { currentSubscription } = useVipStore();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BillingCycle>('year');
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'CNY',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  useEffect(() => {
    let disposed = false;

    const loadPlans = async () => {
      setIsLoading(true);
      try {
        const remotePlans = await vipBusinessService.getPlans();
        if (!disposed) {
          setPlans(remotePlans);
        }
      } catch (error) {
        console.error('Failed to load VIP plans for pricing modal', error);
        if (!disposed) {
          setPlans([]);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      disposed = true;
    };
  }, []);

  const availableTabs = useMemo(() => {
    const cycleSet = new Set<BillingCycle>();
    plans
      .filter((plan) => plan.id !== PlanTier.FREE)
      .forEach((plan) => {
        (plan.pricingOptions || []).forEach((option) => cycleSet.add(option.cycle));
      });

    const resolved = TAB_CONFIG.filter((tab) => cycleSet.has(tab.id));
    return resolved.length > 0 ? resolved : TAB_CONFIG.filter((tab) => tab.id !== 'onetime');
  }, [plans]);

  useEffect(() => {
    if (availableTabs.length === 0) {
      return;
    }

    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [activeTab, availableTabs]);

  const isCurrentPlan = (planId: PlanTier): boolean =>
    currentSubscription?.planId === planId && currentSubscription?.status === 'active';

  const resolvePricing = (plan: VipPlan) => resolveVipPricingOption(plan, activeTab);

  const resolveBillingLabel = (plan: VipPlan): string => {
    const pricing = resolvePricing(plan);
    if (pricing.durationDays <= 0) {
      return t('vip.modal.onetime_label', 'one-time');
    }
    if (activeTab === 'year') {
      return t('vip.modal.yearly_label', 'per year');
    }
    if (activeTab === 'month') {
      return t('vip.modal.monthly_label', 'per month');
    }
    return t('vip.modal.onetime_label', 'one-time');
  };

  const resolveActionLabel = (plan: VipPlan): string => {
    if (isCurrentPlan(plan.id)) {
      return t('vip.modal.current_plan', 'Current Plan');
    }
    if (plan.id === PlanTier.FREE) {
      return t('vip.modal.free_forever', 'Free forever');
    }
    if (activeTab === 'year') {
      return t('vip.modal.subscribe_yearly', 'Subscribe Yearly');
    }
    if (activeTab === 'month') {
      return t('vip.modal.subscribe_monthly', 'Subscribe Monthly');
    }
    return t('vip.modal.buy_once', 'Buy Once');
  };

  const openPayment = (plan: VipPlan) => {
    if (plan.id === PlanTier.FREE || isCurrentPlan(plan.id)) {
      return;
    }

    const pricing = resolvePricing(plan);
    setSelectedPlan({
      planId: plan.id,
      planName: plan.name,
      price: pricing.price,
      currency: plan.currency,
      billingCycle: resolveBillingLabel(plan),
      purchaseCycle: pricing.cycle,
    });
    setShowPaymentModal(true);
  };

  const closePayment = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <div
          className="relative max-h-[90vh] w-full max-w-[1180px] overflow-hidden rounded-2xl border border-[#222] bg-[#0a0a0a]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg bg-[#1a1a1a] p-2 text-gray-400 transition-colors hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">
                {t('vip.modal.title', 'Membership Plans')}
              </h2>
              <p className="mb-2 text-gray-400">
                {t(
                  'vip.modal.subtitle',
                  'Choose the plan that fits your current workload',
                )}
              </p>
              <p className="text-sm text-gray-500">
                {t(
                  'vip.modal.desc',
                  'Unlock faster generation, more credits, and premium model access.',
                )}
              </p>
            </div>

            <div className="mb-8 flex items-center justify-center">
              <div className="inline-flex rounded-xl bg-[#151517] p-1">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#2a2a2d] text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {t(`vip.modal.tabs.${tab.labelKey}`, tab.labelKey)}
                    {tab.discountKey ? (
                      <span className="ml-2 text-xs text-emerald-400">
                        {t(
                          `vip.modal.discounts.${tab.discountKey}`,
                          tab.discountKey,
                        )}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {(plans.length > 0 ? plans : []).map((plan) => {
                const pricing = resolvePricing(plan);
                const currentPlan = isCurrentPlan(plan.id);
                const badgeKey = BADGE_MAP[plan.id];
                const cardAccent =
                  plan.id === PlanTier.STANDARD
                    ? 'border-[#ff2449]/50'
                    : plan.id === PlanTier.PREMIUM
                      ? 'border-[#ff8a45]/50'
                      : 'border-[#222]';

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border bg-[#111] p-5 ${
                      currentPlan ? 'ring-1 ring-blue-500/40' : ''
                    } ${cardAccent}`}
                  >
                    {badgeKey ? (
                      <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                        {t(`vip.modal.badges.${badgeKey}`, badgeKey)}
                      </div>
                    ) : null}

                    <div className="mb-4">
                      <div className="mb-1 text-lg font-semibold text-white">
                        {plan.name}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {pricing.price === 0
                            ? t('vip.modal.free_forever', 'Free forever')
                            : currencyFormatter.format(pricing.price)}
                        </span>
                        {pricing.price > 0 ? (
                          <span className="text-sm text-gray-500">
                            {resolveBillingLabel(plan)}
                          </span>
                        ) : null}
                      </div>
                      {pricing.originalPrice ? (
                        <div className="mt-1 text-sm text-gray-500 line-through">
                          {currencyFormatter.format(pricing.originalPrice)}
                        </div>
                      ) : null}
                    </div>

                    {pricing.points > 0 ? (
                      <div className="mb-4 rounded-xl bg-[#1a1a1a] p-3">
                        <div className="mb-1 flex items-center gap-2 text-sm text-white">
                          <Sparkles size={14} className="text-yellow-500" />
                          {t('vip.modal.points_included', {
                            points: pricing.points.toLocaleString(),
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('vip.modal.estimated_usage', {
                            images: String(Math.max(1, Math.floor(pricing.points * 4))),
                            videos: String(Math.max(1, Math.floor(pricing.points / 10))),
                          })}
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => openPayment(plan)}
                      disabled={plan.id === PlanTier.FREE || currentPlan}
                      className={`mb-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        plan.id === PlanTier.FREE || currentPlan
                          ? 'cursor-default bg-[#2a2a2a] text-gray-400'
                          : plan.id === PlanTier.STANDARD || plan.id === PlanTier.PREMIUM
                            ? 'bg-[#ff2449] text-white hover:bg-[#e02040]'
                            : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {resolveActionLabel(plan)}
                    </button>

                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature.id}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <Check size={14} className="mt-0.5 text-emerald-400" />
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {!isLoading && plans.length === 0 ? (
              <div className="mt-6 rounded-xl border border-[#222] bg-[#111] px-4 py-3 text-sm text-gray-400">
                {t(
                  'vip.modal.empty',
                  'VIP plans are temporarily unavailable. Please retry from the canonical server runtime.',
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedPlan ? (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={closePayment}
          planId={selectedPlan.planId}
          planName={selectedPlan.planName}
          price={selectedPlan.price}
          currency={selectedPlan.currency}
          billingCycle={selectedPlan.billingCycle}
          purchaseCycle={selectedPlan.purchaseCycle}
        />
      ) : null}
    </>,
    document.body,
  );
};
