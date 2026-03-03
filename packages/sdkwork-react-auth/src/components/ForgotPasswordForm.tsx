import { Button } from '@sdkwork/react-commons';
import { authBusinessService } from '../services';
import React, { useEffect, useState } from 'react';
import { Mail, CheckCircle2, Lock, Smartphone, Key } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useTranslation } from '@sdkwork/react-i18n';

interface ForgotPasswordFormProps {
    onBack?: () => void;
}

type ResetChannel = 'EMAIL' | 'SMS';

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const [channel, setChannel] = useState<ResetChannel>('EMAIL');
    const [account, setAccount] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => setTimer((current) => current - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const validateRequestInput = (): boolean => {
        if (channel === 'EMAIL' && !account.includes('@')) {
            setErrors({ account: t('auth.invalid_email') });
            return false;
        }

        if (channel === 'SMS' && (!account || account.length < 11)) {
            setErrors({ account: t('auth.phone_invalid') });
            return false;
        }

        return true;
    };

    const handleSendResetRequest = async () => {
        if (!validateRequestInput()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        const result = await authBusinessService.requestPasswordReset(account, channel);
        setIsLoading(false);

        if (!result.success) {
            setErrors({ form: result.message || 'Failed to send reset request' });
            return;
        }

        if (channel === 'EMAIL') {
            setIsSent(true);
            return;
        }

        setTimer(60);
    };

    const handleSubmitReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (channel === 'EMAIL') {
            await handleSendResetRequest();
            return;
        }

        const nextErrors: Record<string, string> = {};
        if (!code) {
            nextErrors.code = t('auth.code_required');
        }
        if (newPassword.length < 6) {
            nextErrors.newPassword = t('auth.password_short');
        }
        if (newPassword !== confirmPassword) {
            nextErrors.confirmPassword = t('auth.passwords_mismatch');
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        const result = await authBusinessService.resetPassword(account, code, newPassword);
        setIsLoading(false);

        if (!result.success) {
            setErrors({ form: result.message || 'Failed to reset password' });
            return;
        }

        setIsSent(true);
    };

    if (isSent) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle2 size={32} />
                </div>
                <div>
                    {channel === 'EMAIL' ? (
                        <>
                            <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                            <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                We have sent a password reset link to <span className="text-white font-medium">{account}</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-white mb-2">Password reset successful</h3>
                            <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                Your password has been updated. Please return to login with your new password.
                            </p>
                        </>
                    )}
                </div>
                <Button onClick={onBack} variant="secondary" className="w-full">
                    {t('auth.back_login')}
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmitReset} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pt-4">
            <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-white mb-1">{t('auth.forgot_title')}</h3>
                <p className="text-xs text-gray-500">{t('auth.forgot_desc')}</p>
            </div>

            <div className="flex bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
                <button
                    type="button"
                    onClick={() => {
                        setChannel('EMAIL');
                        setErrors({});
                    }}
                    className={`
                        flex-1 py-2 rounded-lg text-xs font-bold transition-all
                        ${channel === 'EMAIL'
                            ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/5'
                            : 'text-gray-500 hover:text-gray-300'
                        }
                    `}
                >
                    Email
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setChannel('SMS');
                        setErrors({});
                    }}
                    className={`
                        flex-1 py-2 rounded-lg text-xs font-bold transition-all
                        ${channel === 'SMS'
                            ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/5'
                            : 'text-gray-500 hover:text-gray-300'
                        }
                    `}
                >
                    SMS
                </button>
            </div>

            <AuthInput
                label={channel === 'EMAIL' ? t('auth.email_label') : t('auth.phone_label')}
                placeholder={channel === 'EMAIL' ? 'you@example.com' : t('auth.phone_placeholder')}
                icon={channel === 'EMAIL' ? <Mail size={16} /> : <Smartphone size={16} />}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                error={errors.account}
            />

            {channel === 'EMAIL' ? (
                <Button
                    type="button"
                    onClick={handleSendResetRequest}
                    disabled={isLoading}
                    className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-500 border-0"
                >
                    {isLoading ? 'Sending...' : t('auth.send_link')}
                </Button>
            ) : (
                <>
                    <AuthInput
                        label={t('auth.code_label')}
                        placeholder={t('auth.code_placeholder')}
                        icon={<Key size={16} />}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        error={errors.code}
                        rightElement={(
                            <button
                                type="button"
                                onClick={handleSendResetRequest}
                                disabled={timer > 0 || isLoading || !account}
                                className={`
                                    text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                                    ${timer > 0
                                        ? 'bg-[#27272a] text-gray-500'
                                        : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                                    }
                                `}
                            >
                                {timer > 0 ? t('auth.resend', { s: timer.toString() }) : t('auth.get_code')}
                            </button>
                        )}
                    />

                    <AuthInput
                        label={t('auth.password_label')}
                        placeholder="Min 6 characters"
                        type="password"
                        icon={<Lock size={16} />}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        error={errors.newPassword}
                    />

                    <AuthInput
                        label={t('auth.confirm_password')}
                        placeholder="Repeat password"
                        type="password"
                        icon={<CheckCircle2 size={16} />}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={errors.confirmPassword}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-500 border-0"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </>
            )}

            {errors.form && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded text-center border border-red-500/20">{errors.form}</div>
            )}

            <button
                type="button"
                onClick={onBack}
                className="w-full text-xs text-gray-500 hover:text-white transition-colors"
            >
                {t('auth.back_login')}
            </button>
        </form>
    );
};
