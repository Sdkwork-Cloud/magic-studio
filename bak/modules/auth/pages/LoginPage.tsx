
import React, { useState } from 'react';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { useTranslation } from '../../../i18n';
import { Sparkles, Terminal, Globe, Github } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { WechatQrPanel } from '../components/WechatQrPanel';

type AuthView = 'login' | 'register' | 'forgot';

const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
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
            
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-1">
                <div className="flex flex-col md:flex-row bg-[#0a0a0a]/50 rounded-[20px] overflow-hidden min-h-[500px]">
                    
                    {/* LEFT COLUMN: QR Code (Visible on Desktop) */}
                    <div className="hidden md:flex md:w-[40%] border-r border-white/5 relative">
                        <WechatQrPanel />
                    </div>

                    {/* RIGHT COLUMN: Form */}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-center relative">
                        
                        {/* Mobile Logo Header */}
                        <div className="text-center mb-8 select-none">
                             <div className="inline-flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#1e1e20] to-[#0a0a0a] border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                                    <Terminal size={20} className="text-blue-500" />
                                </div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">Magic Studio</h1>
                             </div>
                             <p className="text-xs text-gray-500 font-medium">{t('auth.subtitle')}</p>
                        </div>

                        {/* View Switcher */}
                        {view === 'login' && (
                            // Hide WeChat tab in form if screen is wide enough to show side panel (desktop)
                            // Mobile users see all tabs
                            <div className="block">
                                <div className="hidden md:block">
                                    <LoginForm onForgotPassword={() => setView('forgot')} hideWechatTab={true} />
                                </div>
                                <div className="md:hidden">
                                    <LoginForm onForgotPassword={() => setView('forgot')} hideWechatTab={false} />
                                </div>
                            </div>
                        )}
                        {view === 'register' && <RegisterForm />}
                        {view === 'forgot' && <ForgotPasswordForm onBack={() => setView('login')} />}

                        {/* Footer Links (Only on Login/Register) */}
                        {view !== 'forgot' && (
                            <div className="mt-auto pt-8 text-center">
                                {view === 'login' ? (
                                    <p className="text-xs text-gray-500">
                                        {t('auth.no_account')} <button onClick={() => setView('register')} className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">{t('auth.sign_up')}</button>
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        {t('auth.has_account')} <button onClick={() => setView('login')} className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">{t('auth.sign_in')}</button>
                                    </p>
                                )}

                                {/* Social Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-[#27272a]" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase">
                                        <span className="bg-[#0e0e10] px-2 text-gray-600 font-bold tracking-wider">{t('auth.or_continue')}</span>
                                    </div>
                                </div>

                                {/* Social Icons */}
                                <div className="flex justify-center gap-4">
                                    <SocialBtn icon={<Github size={18} />} label="GitHub" />
                                    <SocialBtn icon={<Globe size={18} />} label="Google" />
                                    <button 
                                        onClick={() => navigate(ROUTES.HOME)}
                                        className="px-4 py-2 bg-[#18181b] hover:bg-[#252526] border border-[#27272a] rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        {t('auth.continue_guest')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Footer Legal */}
            <div className="mt-8 text-center text-[10px] text-gray-600">
                <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
                <span className="mx-2">•</span>
                <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            </div>
        </div>
    </div>
  );
};

const SocialBtn: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <button 
        className="w-10 h-10 rounded-xl bg-[#18181b] hover:bg-[#252526] border border-[#27272a] flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-105"
        title={`Sign in with ${label}`}
    >
        {icon}
    </button>
);

export default LoginPage;
