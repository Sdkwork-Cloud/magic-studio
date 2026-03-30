import { useRouter, ROUTES } from '@sdkwork/react-core';
import { Button } from '@sdkwork/react-commons';
import { appAuthService } from '../services';
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Smartphone, Key, User, QrCode, RefreshCw, Check } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useTranslation } from '@sdkwork/react-i18n';
import { useAuthStore } from '../store/authStore';
import { AUTH_LOGIN_QR_CODE } from '../constants/authVisuals';

interface LoginFormProps {
    onForgotPassword: () => void;
    onSuccess?: () => void;
    hideWechatTab?: boolean;
}

type LoginMethod = 'account' | 'phone' | 'wechat';

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, onSuccess, hideWechatTab = false }) => {
    const { t } = useTranslation();
    const { loginWithEmail, loginWithPhone } = useAuthStore();
    const { navigate } = useRouter();
    
    const [method, setMethod] = useState<LoginMethod>('account');
    const [isLoading, setIsLoading] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    const [timer, setTimer] = useState(0);
    
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendCode = async () => {
        if (!phone || phone.length < 11) {
            setErrors({ phone: t('auth.phone_invalid') });
            return;
        }
        setErrors({});
        try {
            await appAuthService.sendVerifyCode({
                target: phone,
                verifyType: 'PHONE',
                scene: 'LOGIN',
            });
            setTimer(60);
        } catch (error) {
            const message = error instanceof Error && error.message ? error.message : t('auth.error.send_code_failed');
            setErrors({ code: message });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        if (method === 'account') {
            if (!email) { setErrors({ email: t('auth.invalid_email') }); return; }
            if (!password) { setErrors({ password: t('auth.password_short') }); return; }
        }
        if (method === 'phone') {
            if (!phone) { setErrors({ phone: t('auth.phone_invalid') }); return; }
            if (!code) { setErrors({ code: t('auth.code_required') }); return; }
        }

        setIsLoading(true);
        try {
            if (method === 'account') {
                await loginWithEmail(email, password);
            } else if (method === 'phone') {
                await loginWithPhone(phone, code);
            }
            
            if (onSuccess) {
                onSuccess();
            } else {
                navigate(ROUTES.HOME);
            }
        } catch (error) {
            const message = error instanceof Error && error.message ? error.message : t('auth.error.login_failed');
            setErrors({ form: message });
        } finally {
            setIsLoading(false);
        }
    };

    const allTabs = [
        { id: 'account', label: t('auth.tab_account'), icon: User },
        { id: 'phone', label: t('auth.tab_phone'), icon: Smartphone },
        { id: 'wechat', label: t('auth.tab_wechat'), icon: QrCode },
    ];
    
    const tabs = hideWechatTab ? allTabs.filter(t => t.id !== 'wechat') : allTabs;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMethod(tab.id as LoginMethod)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
                            ${method === tab.id 
                                ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/5' 
                                : 'text-gray-500 hover:text-gray-300'
                            }
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {method === 'wechat' && !hideWechatTab ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 h-[300px]">
                    <div className="relative group cursor-pointer">
                        <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-2xl">
                             <img src={AUTH_LOGIN_QR_CODE} className="w-full h-full object-contain" alt={t('auth.page.qr_alt')} />
                        </div>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                             <RefreshCw size={24} />
                             <span className="text-xs font-bold">{t('auth.page.refresh_hint')}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-white">{t('auth.scan_wechat')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('auth.scan_tip')}</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 min-h-[280px]">
                    {method === 'account' && (
                        <>
                            <AuthInput 
                                label={t('auth.email_label')}
                                placeholder={t('auth.email_placeholder')}
                                icon={<Mail size={16} />}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                error={errors.email}
                            />
                            <div className="space-y-1.5">
                                <AuthInput 
                                    label={t('auth.password_label')}
                                    placeholder={t('auth.password_placeholder')}
                                    type="password"
                                    icon={<Lock size={16} />}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    error={errors.password}
                                />
                            </div>
                        </>
                    )}

                    {method === 'phone' && (
                        <>
                            <AuthInput 
                                label={t('auth.phone_label')}
                                placeholder={t('auth.phone_placeholder')}
                                icon={<Smartphone size={16} />}
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                error={errors.phone}
                            />
                            <AuthInput 
                                label={t('auth.code_label')}
                                placeholder={t('auth.code_placeholder')}
                                icon={<Key size={16} />}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                error={errors.code}
                                rightElement={
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
                                }
                            />
                        </>
                    )}
                    
                    <div className="flex items-center justify-between">
                         <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setRememberMe(!rememberMe)}
                         >
                            <div className={`
                                w-4 h-4 rounded border flex items-center justify-center transition-all duration-200
                                ${rememberMe 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-[#333] bg-[#18181b] group-hover:border-gray-500'
                                }
                            `}>
                                <Check size={10} strokeWidth={4} className={rememberMe ? 'opacity-100' : 'opacity-0'} />
                            </div>
                            <span className="text-xs text-gray-500 group-hover:text-gray-400 select-none">
                                {t('auth.remember_me')}
                            </span>
                         </div>
                         
                         {method === 'account' && (
                            <button 
                                type="button" 
                                onClick={onForgotPassword}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {t('auth.forgot_password')}
                            </button>
                         )}
                    </div>

                    {errors.form && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                            <Lock size={14} />
                            {errors.form}
                        </div>
                    )}

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 shadow-lg shadow-blue-900/20"
                        >
                            {isLoading ? t('auth.signing_in') : t('auth.sign_in')}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

