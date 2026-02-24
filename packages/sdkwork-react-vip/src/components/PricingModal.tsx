
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Check } from 'lucide-react';
import { VipPlan } from '../entities/vip.entity';
import { VIP_PLANS } from '../constants';

interface PricingModalProps {
    onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-[900px] max-h-[80vh] bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-4 right-4">
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#1a1a1a] rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 mb-4">
                            <Crown size={28} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
                        <p className="text-gray-400">Unlock all features and get unlimited access</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        {VIP_PLANS.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`relative p-6 rounded-xl border ${plan.isPopular ? 'border-indigo-500 bg-[#1a1a2e]' : 'border-[#222] bg-[#111]'}`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-white">{plan.currency === 'CNY' ? '¥' : '$'}{plan.price}</span>
                                    <span className="text-gray-400 text-sm">/{plan.billingCycle}</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.filter(f => f.included).slice(0, 5).map((feature) => (
                                        <li key={feature.id} className="flex items-center gap-2 text-sm text-gray-300">
                                            <Check size={14} className="text-green-500" />
                                            {feature.text}
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-2 rounded-lg font-medium transition-colors ${plan.isPopular ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-[#222] hover:bg-[#333] text-white'}`}>
                                    {plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
