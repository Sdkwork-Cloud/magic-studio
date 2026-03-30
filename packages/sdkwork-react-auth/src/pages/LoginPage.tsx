import React, { useState } from 'react';
import { ROUTES, platform, useRouter } from '@sdkwork/react-core';
import { WindowControls } from '@sdkwork/react-commons';
import { useTranslation } from '@sdkwork/react-i18n';
import { Sparkles, Smartphone, ScanLine, ShieldCheck } from 'lucide-react';
import { LoginForm, RegisterForm, ForgotPasswordForm, QrCodeLogin } from '../index';

type AuthView = 'login' | 'register' | 'forgot';

interface LoginPageProps {
    onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const { t } = useTranslation();
    const { navigate } = useRouter();
    const [view, setView] = useState<AuthView>('login');
    const isDesktopRuntime = platform.getPlatform() === 'desktop';

    const handleLoginSuccess = () => {
        if (onLoginSuccess) {
            onLoginSuccess();
            return;
        }
        navigate(ROUTES.HOME);
    };

    return (
        <div className={`relative w-full h-full min-h-screen overflow-hidden bg-[#050505] text-white flex items-center justify-center p-4 ${isDesktopRuntime ? 'pt-16' : ''}`}>
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            {isDesktopRuntime && (
                <div className="absolute inset-x-0 top-0 z-20 flex h-12 items-center pl-5">
                    <div className="flex items-center gap-3 rounded-full border border-white/8 bg-black/30 px-4 py-2 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-950/40">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80">
                                {t('auth.page.brand_name')}
                            </span>
                            <span className="text-[10px] text-gray-400">Desktop Edition</span>
                        </div>
                    </div>

                    <div className="h-full flex-1" data-tauri-drag-region />

                    <div className="h-full">
                        <WindowControls />
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full max-w-[1060px] mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-[46%] bg-gradient-to-br from-[#11131d] via-[#0d1220] to-[#0a0a0a] p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-white/5">
                            <div className="max-w-sm mx-auto">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-950/40">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight">{t('auth.page.brand_name')}</span>
                                </div>

                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-4">
                                    <ScanLine className="w-3.5 h-3.5" />
                                    <span>{t('auth.page.scan_wechat')}</span>
                                </div>

                                <h2 className="text-2xl font-bold leading-tight mb-2">{t('auth.page.scan_title')}</h2>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                    {t('auth.page.scan_description')}
                                </p>

                                <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 md:p-5">
                                    <QrCodeLogin onLoginSuccess={handleLoginSuccess} size="lg" />
                                </div>

                                <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <Smartphone size={13} className="text-gray-300" />
                                        <span>{t('auth.page.mobile_first')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck size={13} className="text-gray-300" />
                                        <span>{t('auth.page.secure_login')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-8 lg:p-10">
                            {view === 'login' && (
                                <>
                                    <h3 className="text-xl font-semibold mb-6">{t('auth.sign_in')}</h3>
                                    <LoginForm
                                        onForgotPassword={() => setView('forgot')}
                                        onSuccess={handleLoginSuccess}
                                        hideWechatTab
                                    />
                                    <div className="mt-6 text-center">
                                        <span className="text-gray-400 text-sm">{t('auth.no_account')}</span>
                                        <button
                                            onClick={() => setView('register')}
                                            className="ml-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                                        >
                                            {t('auth.sign_up')}
                                        </button>
                                    </div>
                                </>
                            )}

                            {view === 'register' && (
                                <>
                                    <h3 className="text-xl font-semibold mb-6">{t('auth.create_account')}</h3>
                                    <RegisterForm onSuccess={handleLoginSuccess} />
                                    <div className="mt-6 text-center">
                                        <span className="text-gray-400 text-sm">{t('auth.have_account')}</span>
                                        <button
                                            onClick={() => setView('login')}
                                            className="ml-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                                        >
                                            {t('auth.sign_in')}
                                        </button>
                                    </div>
                                </>
                            )}

                            {view === 'forgot' && (
                                <>
                                    <h3 className="text-xl font-semibold mb-6">{t('auth.reset_password')}</h3>
                                    <ForgotPasswordForm />
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => setView('login')}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                        >
                                            {t('auth.back_to_login')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
