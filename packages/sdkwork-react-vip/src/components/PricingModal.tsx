import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Check, Sparkles } from 'lucide-react';
import { VipPlan } from '../entities/vip.entity';
import { VIP_PLANS } from '../constants';
import { PaymentModal } from './PaymentModal';

interface PricingModalProps {
    onClose: () => void;
}

type TabType = 'yearly' | 'monthly' | 'single';

interface TabInfo {
    id: TabType;
    label: string;
    discount?: string;
}

interface SelectedPlan {
    planId: string;
    planName: string;
    price: number;
    currency: string;
    billingCycle: string;
}

const TABS: TabInfo[] = [
    { id: 'yearly', label: '连续包年', discount: '5折' },
    { id: 'monthly', label: '连续包月', discount: '6折' },
    { id: 'single', label: '单月购买' },
];

// 不同 tab 对应的价格配置
const PRICING_CONFIG: Record<TabType, Record<string, { price: number; originalPrice?: number; points: number; billingText: string }>> = {
    yearly: {
        free: { price: 0, points: 0, billingText: '永久' },
        basic: { price: 329, originalPrice: 659, points: 1080, billingText: '首年5折¥329 · 次年续费金额¥659 · 包年可随时取消' },
        standard: { price: 949, originalPrice: 1899, points: 4000, billingText: '首年5折¥949 · 次年续费金额¥1,899 · 包年可随时取消' },
        premium: { price: 2599, originalPrice: 5199, points: 15000, billingText: '首年5折¥2,599 · 次年续费金额¥5,199 · 包年可随时取消' },
    },
    monthly: {
        free: { price: 0, points: 0, billingText: '永久' },
        basic: { price: 39, originalPrice: 49, points: 1080, billingText: '每月' },
        standard: { price: 99, originalPrice: 129, points: 4000, billingText: '每月' },
        premium: { price: 299, originalPrice: 399, points: 15000, billingText: '每月' },
    },
    single: {
        free: { price: 0, points: 0, billingText: '永久' },
        basic: { price: 49, points: 1080, billingText: '单月' },
        standard: { price: 129, points: 4000, billingText: '单月' },
        premium: { price: 399, points: 15000, billingText: '单月' },
    },
};

// 每个方案的特性列表
const PLAN_FEATURES: Record<string, string[]> = {
    free: [
        '每天赠送积分',
    ],
    basic: [
        '每天赠送积分',
        '生图生视频无限次加速',
        '生成作品去除品牌水印',
        '视频对口型',
        '视频更高清',
        '视频更流畅（可补帧到最高 60 FPS）',
        '图片4.0 2k模型 2026.10.20前会员免费用',
        '视频3.5 pro 模型 会员享8折',
        '视频Seedance2.0/fast 模型 会员享8折',
        '图片5.0 Lite 2k模型 免费用1年',
        '图片4.6 2k模型 免费用1年',
    ],
    standard: [
        '每天赠送积分',
        '生图生视频无限次加速',
        '生成作品去除品牌水印',
        '视频对口型',
        '视频更高清',
        '视频更流畅（可补帧到最高 60 FPS）',
        '图片4.0 2k模型 2026.10.20前会员免费用',
        '视频3.5 pro 模型 会员享6折',
        '视频Seedance2.0/fast 模型 会员享6.5折',
        '图片5.0 Lite 2k模型 免费用1年',
        '图片4.6 2k模型 免费用1年',
    ],
    premium: [
        '每天赠送积分',
        '生图生视频无限次加速（最快）',
        '生成作品去除品牌水印',
        '视频对口型',
        '视频更高清',
        '视频更流畅（可补帧到最高 60 FPS）',
        '图片4.0 4K模型 2026.11.06前高级会员免费用',
        '图片4.0 2k模型 2026.10.20前会员免费用',
        '视频3.5 pro 模型 会员享8折',
        '视频Seedance2.0/fast 模型 会员享4折',
        '图片5.0 Lite 4k模型 免费用1年',
        '图片4.6 4k模型 免费用1年',
    ],
};

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('yearly');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

    const getPlanPricing = (planId: string) => {
        return PRICING_CONFIG[activeTab][planId] || { price: 0, points: 0, billingText: '' };
    };

    const getButtonText = (planId: string) => {
        if (planId === 'free') return '当前计划';
        const pricing = getPlanPricing(planId);
        if (activeTab === 'yearly') {
            return `¥${pricing.price} 首年5折`;
        }
        return `¥${pricing.price} ${activeTab === 'monthly' ? '连续包月' : '立即购买'}`;
    };

    const getTagText = (planId: string) => {
        if (planId === 'standard') return '限时特惠';
        if (planId === 'premium') return '最划算';
        if (planId === 'basic') return '节省50%';
        return null;
    };

    const handlePlanClick = (plan: VipPlan) => {
        if (plan.id === 'free') return;
        
        const pricing = getPlanPricing(plan.id);
        setSelectedPlan({
            planId: plan.id,
            planName: plan.name,
            price: pricing.price,
            currency: plan.currency,
            billingCycle: activeTab === 'yearly' ? '年' : activeTab === 'monthly' ? '月' : '月',
        });
        setShowPaymentModal(true);
    };

    const handlePaymentClose = () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
    };

    return createPortal(
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={onClose}>
                <div className="relative w-[1200px] max-h-[90vh] bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#1a1a1a] rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">订阅计划</h2>
                            <p className="text-gray-400">会员兑换</p>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex bg-[#1a1a1a] rounded-lg p-1">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-[#2a2a2a] text-white'
                                                : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.discount && (
                                            <span className="ml-1 text-xs text-gray-500">{tab.discount}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto flex items-center text-gray-400 text-sm">
                                <span>积分详情</span>
                                <span className="ml-1">›</span>
                            </div>
                        </div>
                        
                        {/* Pricing Cards - 4 columns */}
                        <div className="grid grid-cols-4 gap-4">
                            {VIP_PLANS.map((plan) => {
                                const pricing = getPlanPricing(plan.id);
                                const tagText = getTagText(plan.id);
                                const features = PLAN_FEATURES[plan.id] || [];
                                const isPopular = plan.id === 'standard' || plan.id === 'premium';
                                
                                return (
                                    <div 
                                        key={plan.id}
                                        className={`relative p-5 rounded-xl border ${
                                            isPopular 
                                                ? 'border-[#ff2449] bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]' 
                                                : 'border-[#222] bg-[#111]'
                                        }`}
                                    >
                                        {/* Tag */}
                                        {tagText && (
                                            <div className={`absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium rounded-full ${
                                                plan.id === 'standard' 
                                                    ? 'bg-[#ff2449] text-white' 
                                                    : plan.id === 'premium'
                                                    ? 'bg-[#ff6b35] text-white'
                                                    : 'bg-[#333] text-gray-300'
                                            }`}>
                                                {tagText}
                                            </div>
                                        )}
                                        
                                        {/* Plan Header */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                {plan.id === 'free' && <span className="text-gray-400">✦</span>}
                                                <h3 className="text-base font-medium text-white">{plan.name}</h3>
                                                {plan.id === 'basic' && (
                                                    <span className="text-xs text-gray-500">节省50%</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Price */}
                                        <div className="mb-2">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-gray-400 text-sm">¥</span>
                                                <span className="text-4xl font-bold text-white">{pricing.price}</span>
                                                {pricing.originalPrice && (
                                                    <span className="text-gray-500 text-sm line-through ml-2">
                                                        ¥{pricing.originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                            {plan.id !== 'free' && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    每年 ¥{pricing.originalPrice || pricing.price}
                                                </div>
                                            )}
                                            {plan.id === 'free' && (
                                                <div className="text-xs text-gray-500 mt-1">永久</div>
                                            )}
                                        </div>
                                        
                                        {/* Billing Info */}
                                        {plan.id !== 'free' && (
                                            <div className="text-xs text-gray-500 mb-4 leading-relaxed">
                                                {pricing.billingText}
                                            </div>
                                        )}
                                        
                                        {/* CTA Button */}
                                        <button 
                                            onClick={() => handlePlanClick(plan)}
                                            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors mb-4 ${
                                                plan.id === 'free'
                                                    ? 'bg-[#2a2a2a] text-gray-400 cursor-default'
                                                    : isPopular
                                                    ? 'bg-[#ff2449] hover:bg-[#e02040] text-white'
                                                    : 'bg-white hover:bg-gray-100 text-black'
                                            }`}
                                            disabled={plan.id === 'free'}
                                        >
                                            {getButtonText(plan.id)}
                                        </button>
                                        
                                        {/* Points Info */}
                                        {plan.id !== 'free' && (
                                            <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
                                                <div className="flex items-center gap-1 text-white text-sm mb-1">
                                                    <Sparkles size={14} className="text-yellow-500" />
                                                    <span>+ {pricing.points.toLocaleString()} 积分每月</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    最多生成{Math.floor(pricing.points * 4)}张图片{Math.floor(pricing.points / 10)}个视频
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Features List */}
                                        <ul className="space-y-2">
                                            {features.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-2 text-xs text-gray-400">
                                                    <Check size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {selectedPlan && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={handlePaymentClose}
                    planName={selectedPlan.planName}
                    price={selectedPlan.price}
                    currency={selectedPlan.currency}
                    billingCycle={selectedPlan.billingCycle}
                />
            )}
        </>,
        document.body
    );
};
