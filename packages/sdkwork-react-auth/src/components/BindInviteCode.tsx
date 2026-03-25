import React, { useState } from 'react';
import { Gift, Check, Loader2, Sparkles, X, Users, Coins, Crown } from 'lucide-react';
import { Button } from '@sdkwork/react-commons';
import { useTranslation } from '@sdkwork/react-i18n';
import { InviteCodeInput } from './InviteCodeInput';

interface BindInviteCodeProps {
    onBind?: (code: string, data: unknown) => void;
    onClose?: () => void;
    className?: string;
}

interface BindReward {
    type: 'points' | 'vip_days' | 'coupon';
    value: string;
    icon: React.ReactNode;
}

export const BindInviteCode: React.FC<BindInviteCodeProps> = ({
    onBind,
    onClose,
    className = '',
}) => {
    const { t } = useTranslation();
    const [inviteCode, setInviteCode] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [inviteData, setInviteData] = useState<unknown>(null);
    const [isBinding, setIsBinding] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleValidate = (valid: boolean, data?: unknown) => {
        setIsValid(valid);
        setInviteData(data ?? null);
        setError('');
    };

    const handleBind = async () => {
        if (!isValid || !inviteCode) return;

        setIsBinding(true);
        setError('');

        try {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            setIsSuccess(true);
            onBind?.(inviteCode, inviteData);
        } catch (e) {
            const message = e instanceof Error ? e.message : t('auth.bindInvite.errors.bindFailed');
            setError(message);
        } finally {
            setIsBinding(false);
        }
    };

    const rewards: BindReward[] = [
        {
            type: 'points',
            value: t('auth.bindInvite.rewards.points'),
            icon: <Coins size={18} className="text-yellow-500" />,
        },
        {
            type: 'vip_days',
            value: t('auth.bindInvite.rewards.vipDays'),
            icon: <Crown size={18} className="text-purple-500" />,
        },
    ];

    if (isSuccess) {
        return (
            <div className={`p-6 text-center ${className}`}>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={40} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('auth.bindInvite.success.title')}</h3>
                <p className="text-gray-400 text-sm mb-6">{t('auth.bindInvite.success.description')}</p>

                <div className="flex justify-center gap-3 mb-6">
                    {rewards.map((reward, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]"
                        >
                            {reward.icon}
                            <span className="text-white font-medium text-sm">{reward.value}</span>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={onClose}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0"
                >
                    {t('auth.bindInvite.actions.done')}
                </Button>
            </div>
        );
    }

    return (
        <div className={`p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        <Gift size={20} className="text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t('auth.bindInvite.title')}</h3>
                        <p className="text-gray-500 text-xs">{t('auth.bindInvite.description')}</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-500" />
                    {t('auth.bindInvite.rewards.title')}
                </p>
                <div className="flex gap-3">
                    {rewards.map((reward, index) => (
                        <div
                            key={index}
                            className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-[#111]/50"
                        >
                            {reward.icon}
                            <span className="text-white font-medium text-sm">{reward.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <InviteCodeInput
                    value={inviteCode}
                    onChange={setInviteCode}
                    onValidate={handleValidate}
                    error={error}
                />
            </div>

            <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users size={14} className="text-blue-400" />
                    <span>{t('auth.bindInvite.tips.sharedReward')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Check size={14} className="text-green-400" />
                    <span>{t('auth.bindInvite.tips.singleUse')}</span>
                </div>
            </div>

            <Button
                onClick={handleBind}
                disabled={!isValid || isBinding}
                className="w-full h-12 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isBinding ? (
                    <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {t('auth.bindInvite.actions.binding')}
                    </span>
                ) : (
                    t('auth.bindInvite.actions.bindNow')
                )}
            </Button>
        </div>
    );
};

interface BindInviteCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBind?: (code: string, data: unknown) => void;
}

export const BindInviteCodeModal: React.FC<BindInviteCodeModalProps> = ({
    isOpen,
    onClose,
    onBind,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-[420px] bg-[#0d0d0d] rounded-2xl border border-[#333] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <BindInviteCode onBind={onBind} onClose={onClose} />
            </div>
        </div>
    );
};
