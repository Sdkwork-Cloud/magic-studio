
import React from 'react';
import { RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { AUTH_LOGIN_QR_CODE } from '../constants/authVisuals';

export const WechatQrPanel: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-gradient-to-br from-[#1a1a1c] to-[#0f0f10] relative overflow-hidden select-none">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-blue-500 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-purple-500 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
                         <Smartphone size={18} className="text-green-500" />
                         {t('auth.scan_wechat')}
                    </h3>
                    <p className="text-xs text-gray-500">{t('auth.scan_tip')}</p>
                </div>

                {/* QR Code Container */}
                <div className="group relative">
                    <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-2xl border-4 border-white/5 relative overflow-hidden">
                         <img 
                            src={AUTH_LOGIN_QR_CODE}
                            className="w-full h-full object-contain" 
                            alt={t('auth.page.wechat_qr_alt')} 
                        />
                        
                        {/* Hover Overlay for Refresh */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white cursor-pointer rounded-xl">
                            <RefreshCw size={24} />
                            <span className="text-xs font-medium">{t('auth.page.refresh_hint')}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-600 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <ShieldCheck size={12} className="text-gray-500" />
                    <span>{t('auth.page.security_badge')}</span>
                </div>
            </div>
        </div>
    );
};
