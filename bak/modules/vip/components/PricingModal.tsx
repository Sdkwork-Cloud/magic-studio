
import React, { useState } from 'react';
import { X, Check, Crown, Zap, Sparkles, Gem } from 'lucide-react';
import { VIP_PLANS } from '../constants';
import { useVipStore } from '../../../store/vipStore';
import { Button } from '../../../components/Button/Button';
import { PlanTier } from '../entities/vip.entity';
import { useTranslation } from '../../../i18n';

interface PricingModalProps {
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { subscribe, isProcessing, currentSubscription } = useVipStore();
  const [billingCycle, setBillingCycle] = useState<'year' | 'month' | 'onetime'>('month');

  const handleSubscribe = async (planId: PlanTier) => {
    await subscribe(planId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[1200px] h-[85vh] bg-[#09090b] rounded-3xl border border-[#27272a] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex-none pt-8 pb-6 px-8 text-center relative bg-gradient-to-b from-[#18181b] to-[#09090b]">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#27272a] rounded-full"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center">
             <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {t('vip.modal.offer_title')} <span className="text-cyan-400">{t('vip.modal.offer_subtitle')}</span>
                </span>
             </div>
             <p className="text-gray-400 text-sm mb-6">
                {t('vip.modal.desc')}
             </p>

             {/* Tabs Switcher */}
             <div className="bg-[#18181b] p-1 rounded-lg inline-flex items-center border border-[#27272a]">
                <TabButton 
                   active={billingCycle === 'year'} 
                   onClick={() => setBillingCycle('year')} 
                   label={t('vip.modal.billing.year')} 
                   badge={t('vip.modal.badge_save', { percent: '50' })} 
                />
                <TabButton 
                   active={billingCycle === 'month'} 
                   onClick={() => setBillingCycle('month')} 
                   label={t('vip.modal.billing.month')} 
                   badge={t('vip.modal.badge_save', { percent: '40' })} 
                />
                <TabButton 
                   active={billingCycle === 'onetime'} 
                   onClick={() => setBillingCycle('onetime')} 
                   label={t('vip.modal.billing.onetime')} 
                />
             </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full items-stretch">
              {VIP_PLANS.map((plan) => {
                const isPremium = plan.id === PlanTier.PREMIUM;
                const isStandard = plan.id === PlanTier.STANDARD;
                const isBasic = plan.id === PlanTier.BASIC;
                
                // Card Styling Logic
                let cardBg = "bg-[#18181b]";
                let borderColor = "border-[#27272a]";
                let buttonVariant: "primary" | "secondary" = "secondary";
                let highlightEffect = false;

                if (isPremium) {
                   cardBg = "bg-[#18181b]"; 
                   borderColor = "border-orange-500/50";
                   buttonVariant = "primary"; // We'll override style manually
                } else if (isStandard) {
                   cardBg = "bg-[#18181b]";
                   borderColor = "border-cyan-500/50";
                   buttonVariant = "primary";
                } else if (isBasic) {
                   borderColor = "border-blue-500/30";
                }

                return (
                  <div 
                    key={plan.id}
                    className={`
                      relative flex flex-col rounded-2xl border ${borderColor} ${cardBg} p-5
                      transition-transform duration-200 hover:scale-[1.01]
                    `}
                  >
                    {/* Tags */}
                    {plan.tags && (
                      <div className="absolute -top-3 left-4 flex gap-2">
                        {plan.tags.map((tag, i) => (
                           <span 
                             key={i} 
                             className={`
                               px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-[4px]
                               ${tag.color === 'cyan' ? 'bg-cyan-500 text-black' : ''}
                               ${tag.color === 'orange' ? 'bg-orange-500 text-black' : ''}
                               ${tag.color === 'blue' ? 'bg-blue-600 text-white' : ''}
                             `}
                           >
                             {tag.text}
                           </span>
                        ))}
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="mb-6">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {isPremium && <Crown size={18} className="text-orange-400" />}
                          {isStandard && <Zap size={18} className="text-cyan-400" />}
                          {isBasic && <Sparkles size={18} className="text-blue-400" />}
                          {plan.name}
                       </h3>
                       
                       <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-white">{plan.currency}{plan.price}</span>
                          <span className="text-sm text-gray-500 font-medium">/{plan.billingCycle}</span>
                       </div>
                       
                       {plan.originalPrice && (
                         <div className="text-xs text-gray-600 line-through mt-1">
                            {t('vip.modal.badge_save', { percent: Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100).toString() })}: {plan.currency}{plan.originalPrice}
                         </div>
                       )}

                       {/* Points Highlight */}
                       {plan.points > 0 ? (
                           <div className="mt-4 py-3 px-3 bg-[#27272a]/50 rounded-lg flex items-center gap-2 border border-[#333]">
                               <Gem size={16} className="text-white" />
                               <div className="flex flex-col">
                                   <span className="text-sm font-bold text-white">{t('vip.modal.points_monthly', { points: plan.points.toLocaleString() })}</span>
                                   <span className="text-[10px] text-gray-500">{t('vip.modal.auto_refill')}</span>
                               </div>
                           </div>
                       ) : (
                           <div className="mt-4 py-3 px-3 h-[66px] flex items-center text-sm text-gray-500">
                               {t('vip.modal.free_limits')}
                           </div>
                       )}
                    </div>

                    {/* Features List */}
                    <div className="flex-1 space-y-3 mb-6">
                       {plan.features.map((feature) => (
                         <div key={feature.id} className="flex items-start gap-2.5">
                            <Check size={14} className="text-gray-400 mt-1 shrink-0" />
                            <span className="text-xs text-gray-300 leading-relaxed">
                              {feature.text}
                              {feature.id.includes('GPT-4') && isStandard && <span className="ml-1 text-[10px] text-cyan-400 border border-cyan-500/30 px-1 rounded">HOT</span>}
                            </span>
                         </div>
                       ))}
                    </div>

                    {/* CTA Button */}
                    <Button 
                       onClick={() => handleSubscribe(plan.id)}
                       disabled={isProcessing}
                       className={`
                          w-full py-3 text-sm font-bold rounded-xl transition-all
                          ${isPremium ? 'bg-cyan-400 hover:bg-cyan-300 text-black border-0' : ''}
                          ${isStandard ? 'bg-white hover:bg-gray-100 text-black border-0' : ''}
                          ${isBasic ? 'bg-[#27272a] hover:bg-[#3f3f46] text-white border border-[#3f3f46]' : ''}
                          ${plan.id === PlanTier.FREE ? 'bg-transparent border border-[#333] text-gray-500 hover:text-white' : ''}
                       `}
                    >
                       {plan.buttonText}
                    </Button>
                    
                    {plan.description && (
                        <p className="text-[10px] text-center text-gray-600 mt-3 h-4">
                            {plan.description}
                        </p>
                    )}
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; badge?: string }> = ({ active, onClick, label, badge }) => (
    <button 
        onClick={onClick}
        className={`
            relative px-5 py-2 text-xs font-medium rounded-md transition-all
            ${active ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}
        `}
    >
        {label}
        {badge && (
            <span className={`
                absolute -top-2 -right-2 px-1.5 py-0.5 text-[8px] bg-[#3f3f46] text-gray-200 rounded border border-[#52525b]
                ${active ? 'text-cyan-400 border-cyan-900/50' : ''}
            `}>
                {badge}
            </span>
        )}
    </button>
);

export default PricingModal;
