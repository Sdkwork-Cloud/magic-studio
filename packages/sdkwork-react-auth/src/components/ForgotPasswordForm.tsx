
import { Button } from '@sdkwork/react-commons'
import { authService } from '../services/authService'
import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useTranslation } from '@sdkwork/react-i18n';

interface ForgotPasswordFormProps {
    onBack?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setError(t('auth.invalid_email'));
            return;
        }
        setIsLoading(true);
        try {
            await authService.resetPassword(email);
            setIsSent(true);
        } catch (e) {
            setError('Failed to send link');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle2 size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        We've sent a password reset link to <span className="text-white font-medium">{email}</span>
                    </p>
                </div>
                <Button onClick={onBack} variant="secondary" className="w-full">
                    {t('auth.back_login')}
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pt-4">
            <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-white mb-1">{t('auth.forgot_title')}</h3>
                <p className="text-xs text-gray-500">{t('auth.forgot_desc')}</p>
            </div>

            <AuthInput 
                label={t('auth.email_label')}
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={error}
            />

            <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-500 border-0"
            >
                {isLoading ? 'Sending...' : t('auth.send_link')}
            </Button>
            
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
