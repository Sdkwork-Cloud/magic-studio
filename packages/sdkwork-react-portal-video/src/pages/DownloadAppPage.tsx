
import React from 'react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useRouter, ROUTES } from '@sdkwork/react-core';
import { 
    Monitor, Smartphone, Apple, 
    Download, Check, ExternalLink,
    AppWindow, QrCode, Globe
} from 'lucide-react';

// Custom Linux Icon since lucide-react doesn't have one
const LinuxIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c-1.7 0-3 1.2-3 2.6 0 .4.1.8.3 1.1-.6.4-1.1.9-1.5 1.5-.6 1-.8 2.1-.6 3.2-.4.3-.7.7-.9 1.2-.3.7-.4 1.5-.3 2.2 0 .5.2 1 .5 1.4.3.4.7.7 1.2.9-.1.5-.2 1-.2 1.5 0 1.5.5 3 1.4 4.2.9 1.2 2.2 2 3.6 2.3 1.5.3 3 .1 4.3-.6 1.3-.7 2.3-1.8 2.9-3.2.6-1.3.7-2.8.3-4.2.4-.2.8-.5 1.1-.9.3-.4.5-.9.5-1.4.1-.7 0-1.5-.3-2.2-.2-.5-.5-.9-.9-1.2.2-1.1 0-2.2-.6-3.2-.4-.6-.9-1.1-1.5-1.5.2-.3.3-.7.3-1.1 0-1.4-1.3-2.6-3-2.6z"/>
        <path d="M9 18c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
        <path d="M15 18c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
    </svg>
);

// Custom Windows Icon
const WindowsIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
    </svg>
);
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalHeader } from '../components/PortalHeader';

interface DownloadOption {
    id: string;
    platform: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    version: string;
    size: string;
    requirements?: string;
    downloadUrl: string;
    isPrimary?: boolean;
    isComingSoon?: boolean;
}

interface MobileOption {
    id: string;
    platform: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    qrCode?: string;
    downloadUrl?: string;
    isComingSoon?: boolean;
}

const PC_DOWNLOADS: DownloadOption[] = [
    {
        id: 'windows',
        platform: 'Windows',
        icon: <WindowsIcon size={32} />,
        title: 'Windows 版',
        description: '适用于 Windows 10/11 64位系统',
        version: 'v2.0.0',
        size: '156 MB',
        requirements: 'Windows 10 或更高版本',
        downloadUrl: '/downloads/MagicStudio-Windows-x64.exe',
        isPrimary: true,
    },
    {
        id: 'macos',
        platform: 'macOS',
        icon: <Apple size={32} />,
        title: 'macOS 版',
        description: '适用于 macOS 12.0 及以上版本',
        version: 'v2.0.0',
        size: '178 MB',
        requirements: 'macOS Monterey 12.0+',
        downloadUrl: '/downloads/MagicStudio-macOS-arm64.dmg',
    },
    {
        id: 'linux',
        platform: 'Linux',
        icon: <LinuxIcon size={32} />,
        title: 'Linux 版',
        description: '适用于 Ubuntu 20.04+ / Debian 11+',
        version: 'v2.0.0',
        size: '162 MB',
        requirements: 'Ubuntu 20.04+ / Debian 11+',
        downloadUrl: '/downloads/MagicStudio-Linux-x64.AppImage',
    },
];

const MOBILE_DOWNLOADS: MobileOption[] = [
    {
        id: 'ios',
        platform: 'iOS',
        icon: <Apple size={28} />,
        title: 'iOS 版',
        description: '适用于 iPhone 和 iPad',
        qrCode: '/qr/ios-app-store.png',
        downloadUrl: 'https://apps.apple.com/app/magic-studio',
    },
    {
        id: 'android',
        platform: 'Android',
        icon: <Smartphone size={28} />,
        title: 'Android 版',
        description: '适用于 Android 8.0+ 设备',
        qrCode: '/qr/android-apk.png',
        downloadUrl: '/downloads/MagicStudio-Android.apk',
    },
    {
        id: 'h5',
        platform: 'H5',
        icon: <Globe size={28} />,
        title: 'H5 网页版',
        description: '无需下载，浏览器直接使用',
        qrCode: '/qr/h5-webapp.png',
        downloadUrl: 'https://h5.magicstudio.com',
    },
    {
        id: 'miniprogram',
        platform: 'MiniProgram',
        icon: <AppWindow size={28} />,
        title: '微信小程序',
        description: '微信扫一扫快速体验',
        qrCode: '/qr/wechat-miniprogram.png',
    },
];

const FEATURES = [
    'AI 视频生成与编辑',
    '智能剧本创作',
    '多平台素材管理',
    '云端项目同步',
    '团队协作功能',
    '专业级渲染导出',
];

export const DownloadAppPage: React.FC = () => {
    const { t } = useTranslation();
    // Use useRouter safely - it returns default values if not wrapped in RouterProvider
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});

    const handleDownload = (url: string) => {
        if (url.startsWith('http')) {
            window.open(url, '_blank');
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = url.split('/').pop() || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
            <PortalSidebar />

            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <PortalHeader />
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20" />
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                        
                        <div className="relative z-10 max-w-6xl mx-auto px-8 py-16">
                            <div className="text-center mb-12">
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                    {t('download.title', '下载 Magic Studio')}
                                </h1>
                                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                                    {t('download.subtitle', '选择适合您设备的版本，开启 AI 创作之旅')}
                                </p>
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap justify-center gap-4 mb-12">
                                {FEATURES.map((feature, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
                                    >
                                        <Check size={14} className="text-green-400" />
                                        <span className="text-sm text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PC Downloads */}
                    <div className="max-w-6xl mx-auto px-8 py-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Monitor size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {t('download.pc_title', '桌面端下载')}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {t('download.pc_subtitle', '功能完整，体验最佳')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PC_DOWNLOADS.map((option) => (
                                <div 
                                    key={option.id}
                                    className={`
                                        relative p-6 rounded-xl border transition-all duration-300
                                        ${option.isPrimary 
                                            ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-500/50' 
                                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                                        }
                                    `}
                                >
                                    {option.isPrimary && (
                                        <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                            {t('download.recommended', '推荐')}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                            {option.icon}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">{option.version}</div>
                                            <div className="text-xs text-gray-600">{option.size}</div>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1">{option.title}</h3>
                                    <p className="text-sm text-gray-400 mb-4">{option.description}</p>
                                    
                                    {option.requirements && (
                                        <p className="text-xs text-gray-600 mb-4">
                                            {t('download.requirements', '系统要求')}: {option.requirements}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => handleDownload(option.downloadUrl)}
                                        className={`
                                            w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200
                                            ${option.isPrimary
                                                ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                            }
                                        `}
                                    >
                                        <Download size={18} />
                                        {t('download.download_now', '立即下载')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Downloads */}
                    <div className="max-w-6xl mx-auto px-8 py-12 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Smartphone size={20} className="text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {t('download.mobile_title', '移动端下载')}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {t('download.mobile_subtitle', '随时随地，创意无限')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {MOBILE_DOWNLOADS.map((option) => (
                                <div 
                                    key={option.id}
                                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                            {option.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{option.title}</h3>
                                            <p className="text-xs text-gray-500">{option.description}</p>
                                        </div>
                                    </div>

                                    {option.qrCode && (
                                        <div className="aspect-square bg-white rounded-lg p-3 mb-4 flex items-center justify-center">
                                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                <QrCode size={48} />
                                            </div>
                                        </div>
                                    )}

                                    {option.isComingSoon ? (
                                        <div className="w-full py-2 text-center text-sm text-gray-500 border border-dashed border-gray-700 rounded-lg">
                                            {t('download.coming_soon', '即将上线')}
                                        </div>
                                    ) : option.downloadUrl ? (
                                        <button
                                            onClick={() => handleDownload(option.downloadUrl!)}
                                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
                                        >
                                            {option.downloadUrl.startsWith('http') ? (
                                                <><ExternalLink size={14} /> {t('download.visit', '访问')}</>
                                            ) : (
                                                <><Download size={14} /> {t('download.download', '下载')}</>
                                            )}
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Web Version */}
                    <div className="max-w-6xl mx-auto px-8 py-12 border-t border-white/5">
                        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <Globe size={32} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {t('download.web_title', '网页版')}
                                        </h3>
                                        <p className="text-gray-400">
                                            {t('download.web_desc', '无需安装，浏览器即可使用全部功能')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(ROUTES.PORTAL)}
                                    className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center gap-2"
                                >
                                    <ExternalLink size={18} />
                                    {t('download.open_web', '打开网页版')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="max-w-6xl mx-auto px-8 py-12 border-t border-white/5">
                        <div className="text-center text-sm text-gray-500">
                            <p className="mb-2">
                                {t('download.version_note', '所有版本均支持云端同步，数据互通')}
                            </p>
                            <p>
                                {t('download.support', '遇到问题？')}{' '}
                                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                                    {t('download.contact_support', '联系客服')}
                                </a>
                                {' '}·{' '}
                                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                                    {t('download.view_changelog', '查看更新日志')}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadAppPage;
