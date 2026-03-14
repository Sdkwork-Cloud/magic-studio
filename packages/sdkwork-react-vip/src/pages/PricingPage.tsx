import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Gem, Sparkles, Star, TimerReset } from 'lucide-react';
import { PlanTier, type Subscription, type VipPlan } from '../entities';
import { vipBusinessService } from '../services/vipBusinessService';

type BillingCycle = 'month' | 'year' | 'onetime';

function formatCurrency(value: number, currency: string): string {
  const prefix = currency === 'CNY' ? 'CNY ' : `${currency} `;
  return `${prefix}${value.toFixed(2)}`;
}

function formatExpireTime(expiresAt: number): string {
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return 'Never';
  }
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }
  return parsed.toLocaleDateString();
}

function getCycleLabel(cycle: BillingCycle): string {
  if (cycle === 'year') {
    return 'Yearly';
  }
  if (cycle === 'onetime') {
    return 'One-time';
  }
  return 'Monthly';
}

function getPlanTagTone(plan: VipPlan): string {
  if (plan.id === PlanTier.PREMIUM) {
    return 'border-amber-400/50 bg-amber-500/10 text-amber-200';
  }
  if (plan.id === PlanTier.STANDARD) {
    return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200';
  }
  if (plan.id === PlanTier.BASIC) {
    return 'border-indigo-400/40 bg-indigo-500/10 text-indigo-200';
  }
  return 'border-zinc-400/30 bg-zinc-500/10 text-zinc-200';
}

function getTierTitle(planId: PlanTier): string {
  if (planId === PlanTier.PREMIUM) {
    return 'Premium';
  }
  if (planId === PlanTier.STANDARD) {
    return 'Standard';
  }
  if (planId === PlanTier.BASIC) {
    return 'Basic';
  }
  return 'Free';
}

const CYCLE_OPTIONS: Array<{ id: BillingCycle; label: string }> = [
  { id: 'month', label: 'Monthly' },
  { id: 'year', label: 'Yearly' },
  { id: 'onetime', label: 'One-time' },
];

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('month');
  const [subscribingPlanId, setSubscribingPlanId] = useState<PlanTier | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [message, setMessage] = useState<string>('');

  const loadPlans = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const remotePlans = await vipBusinessService.getPlans();
      setPlans(remotePlans);
      setMessage('');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to load VIP plans';
      setMessage(text);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleSubscribe = useCallback(
    async (planId: PlanTier) => {
      setSubscribingPlanId(planId);
      try {
        const nextSubscription = await vipBusinessService.subscribe(planId, selectedCycle);
        setSubscription(nextSubscription);
        setMessage(
          `Subscription updated: ${getTierTitle(nextSubscription.planId)} (${nextSubscription.status})`,
        );
      } catch (error) {
        const text = error instanceof Error ? error.message : 'Failed to purchase VIP plan';
        setMessage(text);
      } finally {
        setSubscribingPlanId(null);
      }
    },
    [selectedCycle],
  );

  const sortedPlans = useMemo(() => {
    return [...plans].sort((left, right) => {
      const rank = (tier: PlanTier): number => {
        if (tier === PlanTier.FREE) return 0;
        if (tier === PlanTier.BASIC) return 1;
        if (tier === PlanTier.STANDARD) return 2;
        return 3;
      };
      return rank(left.id) - rank(right.id);
    });
  }, [plans]);

  return (
    <div className="min-h-screen bg-[#06080f] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-24">
        <section
          className="rounded-3xl border p-7"
          style={{
            borderColor: 'rgba(99,102,241,0.36)',
            background:
              'radial-gradient(circle at 14% 18%, rgba(129,140,248,0.22) 0%, rgba(15,23,42,0.95) 44%), linear-gradient(140deg, rgba(3,7,18,0.95), rgba(32,22,65,0.92), rgba(11,36,66,0.95))',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                <Crown className="h-3.5 w-3.5" />
                Magic Studio VIP
              </div>
              <h1 className="mt-4 text-3xl font-bold md:text-4xl">Membership Center</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
                Upgrade generation speed, quota, and advanced model access across your workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-indigo-100/70">Current Subscription</div>
              <div className="mt-1 text-lg font-semibold">
                {subscription ? getTierTitle(subscription.planId) : 'Not Subscribed'}
              </div>
              <div className="mt-1 text-xs text-indigo-100/80">
                {subscription
                  ? `${subscription.status} | Expire ${formatExpireTime(subscription.expiresAt)}`
                  : 'Choose a plan to activate premium features'}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {CYCLE_OPTIONS.map((cycle) => (
              <button
                key={cycle.id}
                type="button"
                onClick={() => setSelectedCycle(cycle.id)}
                className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                  selectedCycle === cycle.id
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:bg-white/[0.08] hover:text-gray-200'
                }`}
              >
                {cycle.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadPlans(true)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`vip-loading-${index}`}
                className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sortedPlans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border p-5"
                style={{
                  borderColor: plan.isPopular ? 'rgba(244,114,182,0.4)' : 'rgba(148,163,184,0.2)',
                  background: plan.isPopular
                    ? 'linear-gradient(140deg, rgba(76,29,149,0.45), rgba(29,78,216,0.28))'
                    : 'linear-gradient(140deg, rgba(15,23,42,0.86), rgba(15,23,42,0.66))',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    {plan.isPopular ? (
                      <Sparkles className="h-4 w-4 text-pink-300" />
                    ) : (
                      <Gem className="h-4 w-4 text-cyan-300" />
                    )}
                    {plan.name}
                  </div>
                  {plan.isPopular ? (
                    <span className="rounded-full border border-pink-300/40 px-2 py-0.5 text-[10px] font-semibold text-pink-200">
                      POPULAR
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-semibold">{formatCurrency(plan.price, plan.currency)}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-300">
                      <TimerReset className="h-3.5 w-3.5" />
                      {plan.billingCycle}
                    </div>
                  </div>
                  {plan.originalPrice ? (
                    <div className="text-xs text-gray-500 line-through">
                      {formatCurrency(plan.originalPrice, plan.currency)}
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 min-h-[42px] text-xs leading-relaxed text-gray-300">
                  {plan.description || 'Priority queues, higher quota, and richer model options.'}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(plan.tags || []).slice(0, 2).map((tag) => (
                    <span
                      key={`${plan.id}-${tag.text}`}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${getPlanTagTone(plan)}`}
                    >
                      {tag.text}
                    </span>
                  ))}
                  {plan.points > 0 ? (
                    <span className="rounded-full border border-amber-300/35 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                      +{plan.points} points
                    </span>
                  ) : null}
                </div>

                <ul className="mt-3 space-y-1.5">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature.id} className="flex items-start gap-2 text-xs text-gray-300">
                      <Star className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => void handleSubscribe(plan.id)}
                  disabled={subscribingPlanId !== null || plan.id === PlanTier.FREE}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {plan.id === PlanTier.FREE
                    ? 'Current Plan'
                    : subscribingPlanId === plan.id
                      ? 'Processing...'
                      : `Subscribe (${getCycleLabel(selectedCycle)})`}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { PricingPage };
