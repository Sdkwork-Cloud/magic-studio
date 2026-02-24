
import { useRouter } from 'sdkwork-react-core'
import React, { useState } from 'react';
import { useTranslation } from 'sdkwork-react-i18n';
import { Sparkles, Terminal, Globe, Github } from 'lucide-react';
import { LoginForm, RegisterForm, ForgotPasswordForm, WechatQrPanel } from '../index';

type AuthView = 'login' | 'register' | 'forgot';

interface LoginPageProps {
    onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#050505] text-white flex items-center justify-center p-4">
        
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        </div>

        {/* Main Card - Expanded Width for Split Layout */}
        <div className="relative z-10 w-full max-w-[900px] mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row">
                    
                    {/* Left Side - Branding */}
                    <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-[#111] to-[#0a0a0a] p-8 flex-col justify-between border-r border-white/5">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold tracking-tight">Open Studio</span>
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-4 leading-tight">
                                {t('auth.welcome_back')}
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                {t('auth.description')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Terminal className="w-4 h-4" />
                                <span>AI-Powered Development</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Globe className="w-4 h-4" />
                                <span>Cloud Sync</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Github className="w-4 h-4" />
                                <span>Git Integration</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 p-6 md:p-8">
                        {view === 'login' && (
                            <>
                                <h3 className="text-xl font-semibold mb-6">{t('auth.sign_in')}</h3>
                                <LoginForm 
                                    onForgotPassword={() => setView('forgot')}
                                    onSuccess={onLoginSuccess}
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
                                <RegisterForm onSuccess={onLoginSuccess} />
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
