
import React from 'react';
import { Check, X as XIcon, Crown, Sparkles } from 'lucide-react';
import { VIP_PLANS } from '../constants';
import { useVipStore } from '../../../store/vipStore';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/Button/Button';
import { PlanTier } from '../entities/vip.entity';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { useTranslation } from '../../../i18n';

const PricingPage: React.FC = () => {
  const { t } = useTranslation();
  const { subscribe, isProcessing, currentSubscription } = useVipStore();
  const { user } = useAuthStore();
  const { navigate } = useRouter();

  const handleSubscribe = async (planId: PlanTier) => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    await subscribe(planId);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-black text-gray-300 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0f172a] to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={12} />
            {t('vip.hero.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            {t('vip.hero.title')}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('vip.hero.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VIP_PLANS.map((plan) => {
            const isCurrent = currentSubscription?.planId === plan.id;
            const isPro = plan.id === PlanTier.STANDARD;

            return (
              <div 
                key={plan.id}
                className={`
                  relative flex flex-col p-8 rounded-2xl border transition-all duration-300
                  ${isPro 
                    ? 'bg-[#161618] border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-105 z-10' 
                    : 'bg-[#111113] border-[#333] hover:border-[#444]'
                  }
                `}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-extrabold text-white">{plan.currency}{plan.price}</span>
                    <span className="text-gray-500">/{plan.billingCycle}</span>
                  </div>
                  <p className="text-sm text-gray-400 h-10">{plan.description}</p>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check size={18} className="text-green-400 mt-0.5 shrink-0" />
                      ) : (
                        <XIcon size={18} className="text-gray-700 mt-0.5 shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  variant={isPro ? 'primary' : 'secondary'}
                  className={`w-full py-3 ${isPro ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-0' : ''}`}
                  disabled={isCurrent || isProcessing}
                >
                  {isProcessing && plan.id === PlanTier.STANDARD ? t('common.status.processing') : 
                   isCurrent ? t('vip.plans.free.button') : 
                   plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                </Button>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
                Secure payment powered by Stripe. Cancel anytime. 
                <br />
                Need a custom enterprise plan? <a href="#" className="text-blue-400 hover:underline">Contact Open Studio Sales</a>.
            </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
