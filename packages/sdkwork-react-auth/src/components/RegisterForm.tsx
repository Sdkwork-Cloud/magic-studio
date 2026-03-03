import { useRouter, ROUTES } from '@sdkwork/react-core';
import { Button } from '@sdkwork/react-commons';
import { authBusinessService } from '../services';
import React, { useEffect, useState } from 'react';
import { Mail, Lock, CheckCircle2, Check, Smartphone, Key } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useTranslation } from '@sdkwork/react-i18n';
import { useAuthStore } from '../store/authStore';

interface RegisterFormProps {
    onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const { loginWithEmail } = useAuthStore();
    const { navigate } = useRouter();

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => setTimer((current) => current - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendCode = async () => {
        if (!phone || phone.length < 11) {
            setErrors((prev) => ({ ...prev, phone: t('auth.phone_invalid') }));
            return;
        }

        const result = await authBusinessService.sendSmsCode(phone, 'register');
        if (result.success) {
            setErrors((prev) => ({ ...prev, phone: '', code: '' }));
            setTimer(60);
            return;
        }

        setErrors((prev) => ({ ...prev, code: result.message || 'Failed to send code' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!email.includes('@')) {
            newErrors.email = t('auth.invalid_email');
        }
        if (!phone || phone.length < 11) {
            newErrors.phone = t('auth.phone_invalid');
        }
        if (!code) {
            newErrors.code = t('auth.code_required');
        }
        if (password.length < 6) {
            newErrors.password = t('auth.password_short');
        }
        if (password !== confirmPass) {
            newErrors.confirm = t('auth.passwords_mismatch');
        }
        if (!acceptedTerms) {
            newErrors.terms = t('auth.agree_required');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            const verifyResult = await authBusinessService.verifySmsCode(phone, code, 'register');
            if (!verifyResult.success) {
                setErrors({ code: verifyResult.message || 'Verification failed' });
                return;
            }
            if (!verifyResult.data) {
                setErrors({ code: 'Invalid verification code' });
                return;
            }

            const username = email.split('@')[0];
            const registerResult = await authBusinessService.register(username, password, email, phone);
            if (!registerResult.success) {
                setErrors({ form: registerResult.message || 'Registration failed' });
                return;
            }

            await loginWithEmail(email, password);
            if (onSuccess) {
                onSuccess();
            } else {
                navigate(ROUTES.HOME);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            setErrors({ form: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{t('auth.create_account_title')}</h3>
                <p className="text-xs text-gray-500">{t('auth.create_account_desc')}</p>
            </div>

            <AuthInput
                label={t('auth.email_label')}
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
            />

            <AuthInput
                label={t('auth.phone_label')}
                placeholder={t('auth.phone_placeholder')}
                icon={<Smartphone size={16} />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
            />

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
                        onClick={handleSendCode}
                        disabled={timer > 0 || !phone}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
            />

            <AuthInput
                label={t('auth.confirm_password')}
                placeholder="Repeat password"
                type="password"
                icon={<CheckCircle2 size={16} />}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                error={errors.confirm}
            />

            <div className="flex items-start gap-2 pt-1">
                <div
                    className="relative flex items-center h-4 mt-0.5 cursor-pointer group"
                    onClick={() => {
                        setAcceptedTerms(!acceptedTerms);
                        setErrors((prev) => ({ ...prev, terms: '' }));
                    }}
                >
                    <div
                        className={`
                            w-4 h-4 rounded border flex items-center justify-center transition-all duration-200
                            ${acceptedTerms
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : `bg-[#18181b] ${errors.terms ? 'border-red-500' : 'border-[#333] group-hover:border-gray-500'}`
                            }
                        `}
                    >
                        <Check size={10} strokeWidth={4} className={acceptedTerms ? 'opacity-100' : 'opacity-0'} />
                    </div>
                </div>
                <div className="text-xs text-gray-500 leading-relaxed select-none">
                    {t('auth.agree_prefix')}
                    <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline mx-1" onClick={(e) => e.preventDefault()}>{t('auth.terms_service')}</a>
                    {t('auth.and')}
                    <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline mx-1" onClick={(e) => e.preventDefault()}>{t('auth.privacy_policy')}</a>
                    {errors.terms && <p className="text-red-500 mt-1">{errors.terms}</p>}
                </div>
            </div>

            {errors.form && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded text-center border border-red-500/20">{errors.form}</div>
            )}

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 shadow-lg shadow-blue-900/20"
            >
                {isLoading ? 'Creating...' : t('auth.register_now')}
            </Button>
        </form>
    );
};
