
import { useRouter, ROUTES } from 'sdkwork-react-core'
import { Button } from 'sdkwork-react-commons'
import { authService } from '../services/authService'
import React, { useState } from 'react';
import { Mail, Lock, CheckCircle2, Check } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useTranslation } from 'sdkwork-react-i18n';
import { useAuthStore } from '../store/authStore';

interface RegisterFormProps {
    onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const { login } = useAuthStore();
    const { navigate } = useRouter();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        
        if (!email.includes('@')) newErrors.email = t('auth.invalid_email');
        if (password.length < 6) newErrors.password = t('auth.password_short');
        if (password !== confirmPass) newErrors.confirm = t('auth.passwords_mismatch');
        if (!acceptedTerms) newErrors.terms = t('auth.agree_required');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            await authService.register(email, password);
            // Auto login after register
            await login('email', { email, password });
            if (onSuccess) {
                onSuccess();
            } else {
                navigate(ROUTES.HOME);
            }
        } catch (e: any) {
            setErrors({ form: e.message || 'Registration failed' });
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
                onChange={e => setEmail(e.target.value)}
                error={errors.email}
            />
            
            <AuthInput 
                label={t('auth.password_label')}
                placeholder="Min 6 characters"
                type="password"
                icon={<Lock size={16} />}
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={errors.password}
            />

            <AuthInput 
                label={t('auth.confirm_password')}
                placeholder="Repeat password"
                type="password"
                icon={<CheckCircle2 size={16} />}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                error={errors.confirm}
            />

            {/* Protocol / Terms Agreement */}
            <div className="flex items-start gap-2 pt-1">
                <div 
                    className="relative flex items-center h-4 mt-0.5 cursor-pointer group"
                    onClick={() => { setAcceptedTerms(!acceptedTerms); setErrors(prev => ({...prev, terms: ''})); }}
                >
                    <div className={`
                        w-4 h-4 rounded border flex items-center justify-center transition-all duration-200
                        ${acceptedTerms 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : `bg-[#18181b] ${errors.terms ? 'border-red-500' : 'border-[#333] group-hover:border-gray-500'}`
                        }
                    `}>
                        <Check size={10} strokeWidth={4} className={acceptedTerms ? 'opacity-100' : 'opacity-0'} />
                    </div>
                </div>
                <div className="text-xs text-gray-500 leading-relaxed select-none">
                    {t('auth.agree_prefix')} 
                    <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline mx-1" onClick={e => e.preventDefault()}>{t('auth.terms_service')}</a> 
                    {t('auth.and')} 
                    <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline mx-1" onClick={e => e.preventDefault()}>{t('auth.privacy_policy')}</a>
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
