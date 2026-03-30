import React from 'react';
import { useTranslation } from '@sdkwork/react-i18n';
import {
  AppWindow,
  Apple,
  Check,
  Download,
  ExternalLink,
  Globe,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { ROUTES, createOfflineQrCode, useRouter } from '@sdkwork/react-core';
import { PortalHeader } from '../components/PortalHeader';
import { PortalSidebar } from '../components/PortalSidebar';

const LinuxIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2c-1.7 0-3 1.2-3 2.6 0 .4.1.8.3 1.1-.6.4-1.1.9-1.5 1.5-.6 1-.8 2.1-.6 3.2-.4.3-.7.7-.9 1.2-.3.7-.4 1.5-.3 2.2 0 .5.2 1 .5 1.4.3.4.7.7 1.2.9-.1.5-.2 1-.2 1.5 0 1.5.5 3 1.4 4.2.9 1.2 2.2 2 3.6 2.3 1.5.3 3 .1 4.3-.6 1.3-.7 2.3-1.8 2.9-3.2.6-1.3.7-2.8.3-4.2.4-.2.8-.5 1.1-.9.3-.4.5-.9.5-1.4.1-.7 0-1.5-.3-2.2-.2-.5-.5-.9-.9-1.2.2-1.1 0-2.2-.6-3.2-.4-.6-.9-1.1-1.5-1.5.2-.3.3-.7.3-1.1 0-1.4-1.3-2.6-3-2.6z" />
    <path d="M9 18c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
    <path d="M15 18c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
  </svg>
);

const WindowsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
  </svg>
);

interface DesktopOption {
  id: 'windows' | 'macos' | 'linux';
  icon: React.ReactNode;
  version: string;
  size: string;
  artifactName: string;
  downloadUrl?: string;
  deliveryNote: string;
  isPrimary?: boolean;
}

interface MobileOption {
  id: 'ios' | 'android' | 'h5' | 'miniprogram';
  icon: React.ReactNode;
  qrCode?: string;
  downloadUrl?: string;
  statusNote?: string;
  isComingSoon?: boolean;
}

const DESKTOP_OPTIONS: DesktopOption[] = [
  {
    id: 'windows',
    icon: <WindowsIcon size={32} />,
    version: 'v2.0.0',
    size: '156 MB',
    artifactName: 'MagicStudio-Windows-x64.exe',
    deliveryNote: 'Bundled with desktop release distribution',
    isPrimary: true,
  },
  {
    id: 'macos',
    icon: <Apple size={32} />,
    version: 'v2.0.0',
    size: '178 MB',
    artifactName: 'MagicStudio-macOS-arm64.dmg',
    deliveryNote: 'Bundled with desktop release distribution',
  },
  {
    id: 'linux',
    icon: <LinuxIcon size={32} />,
    version: 'v2.0.0',
    size: '162 MB',
    artifactName: 'MagicStudio-Linux-x64.AppImage',
    deliveryNote: 'Bundled with desktop release distribution',
  },
];

const MOBILE_OPTIONS: MobileOption[] = [
  {
    id: 'ios',
    icon: <Apple size={28} />,
    qrCode: createOfflineQrCode({ label: 'App Store', accent: '#60a5fa' }),
    downloadUrl: 'https://apps.apple.com/app/magic-studio',
  },
  {
    id: 'android',
    icon: <Smartphone size={28} />,
    qrCode: createOfflineQrCode({ label: 'Android APK', accent: '#22c55e' }),
    statusNote: 'APK distributed through the release channel',
  },
  {
    id: 'h5',
    icon: <Globe size={28} />,
    qrCode: createOfflineQrCode({ label: 'Web App', accent: '#8b5cf6' }),
    downloadUrl: 'https://h5.magicstudio.com',
  },
  {
    id: 'miniprogram',
    icon: <AppWindow size={28} />,
    qrCode: createOfflineQrCode({ label: 'Mini Program', accent: '#10b981' }),
    isComingSoon: true,
  },
];

const FEATURE_IDS = [
  'ai_generation',
  'multi_platform_sync',
  'local_project_sync',
  'offline_installer',
  'browser_access',
  'updates',
] as const;

export const DownloadAppPage: React.FC = () => {
  const { t } = useTranslation();
  const routerContext = useRouter();
  const navigate = routerContext?.navigate || (() => {});

  const handleDownload = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#050505] font-sans text-gray-200">
      <PortalSidebar />

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <PortalHeader />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

            <div className="relative z-10 mx-auto max-w-6xl px-8 py-16">
              <div className="mb-12 text-center">
                <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                  {t('download.title')}
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-gray-400">
                  {t('download.subtitle')}
                </p>
              </div>

              <div className="mb-12 flex flex-wrap justify-center gap-4">
                {FEATURE_IDS.map((featureId) => (
                  <div
                    key={featureId}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    <Check size={14} className="text-green-400" />
                    <span className="text-sm text-gray-300">
                      {t(`download.features.${featureId}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-8 py-12">
            <SectionHeader
              icon={<Monitor size={20} className="text-blue-400" />}
              title={t('download.pc_title')}
              subtitle={t('download.pc_subtitle')}
              iconBackground="bg-blue-500/20"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {DESKTOP_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`relative rounded-xl border p-6 transition-all duration-300 ${
                    option.isPrimary
                      ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:border-indigo-500/50'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  {option.isPrimary ? (
                    <div className="absolute -top-3 left-6 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
                      {t('download.recommended')}
                    </div>
                  ) : null}

                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-white">
                      {option.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{option.version}</div>
                      <div className="text-xs text-gray-600">{option.size}</div>
                    </div>
                  </div>

                  <h3 className="mb-1 text-lg font-bold text-white">
                    {t(`download.desktop.${option.id}.title`)}
                  </h3>
                  <p className="mb-4 text-sm text-gray-400">
                    {t(`download.desktop.${option.id}.description`)}
                  </p>

                  <p className="mb-4 text-xs text-gray-600">
                    {t('download.requirements')}:{' '}
                    {t(`download.desktop.${option.id}.requirements`)}
                  </p>

                  <div className="space-y-3">
                    {option.downloadUrl ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(option.downloadUrl!)}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all duration-200 ${
                          option.isPrimary
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <Download size={18} />
                        {t('download.download_now')}
                      </button>
                    ) : (
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300">
                        <Check size={16} className="text-emerald-400" />
                        {t('download.desktop_release_bundle', 'Included in release package')}
                      </div>
                    )}

                    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-400">
                      <div>{t('download.artifact_name', 'Artifact')}: {option.artifactName}</div>
                      <div>{t('download.delivery_note', 'Delivery')}: {option.deliveryNote}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-6xl border-t border-white/5 px-8 py-12">
            <SectionHeader
              icon={<Smartphone size={20} className="text-green-400" />}
              title={t('download.mobile_title', 'Mobile Download')}
              subtitle={t('download.mobile_subtitle', 'Create anywhere, anytime')}
              iconBackground="bg-green-500/20"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {MOBILE_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {t(`download.mobile.${option.id}.title`)}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {t(`download.mobile.${option.id}.description`)}
                      </p>
                    </div>
                  </div>

                  {option.qrCode ? (
                    <div className="mb-4 aspect-square rounded-lg bg-white p-3">
                      <img src={option.qrCode} alt={`${option.id}-qr`} className="h-full w-full rounded object-cover" />
                    </div>
                  ) : null}

                  {option.isComingSoon ? (
                    <div className="w-full rounded-lg border border-dashed border-gray-700 py-2 text-center text-sm text-gray-500">
                      {t('download.coming_soon', 'Coming Soon')}
                    </div>
                  ) : option.downloadUrl ? (
                    (() => {
                      const downloadUrl = option.downloadUrl;
                      return (
                        <button
                          type="button"
                          onClick={() => handleDownload(downloadUrl)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20"
                        >
                          {downloadUrl.startsWith('http') ? (
                            <>
                              <ExternalLink size={14} />
                              {t('download.visit', 'Visit')}
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              {t('download.download', 'Download')}
                            </>
                          )}
                        </button>
                      );
                    })()
                  ) : option.statusNote ? (
                    <div className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center text-xs text-gray-400">
                      {option.statusNote}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-6xl border-t border-white/5 px-8 py-12">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-8">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    <Globe size={32} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-bold text-white">
                      {t('download.web_title', 'Web Version')}
                    </h3>
                    <p className="text-gray-400">
                      {t(
                        'download.web_desc',
                        'No installation required. Open the browser version and start instantly.',
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.PORTAL)}
                  className="flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-bold text-black transition-all duration-200 hover:bg-gray-100"
                >
                  <ExternalLink size={18} />
                  {t('download.open_web', 'Open Web Version')}
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl border-t border-white/5 px-8 py-12">
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">
                {t(
                  'download.version_note',
                  'All versions support cloud sync and shared project data.',
                )}
              </p>
              <p>
                {t('download.support', 'Need help?')}{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                  {t('download.contact_support', 'Contact Support')}
                </a>{' '}
                ·{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                  {t('download.view_changelog', 'View Changelog')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBackground: string;
}> = ({ icon, title, subtitle, iconBackground }) => (
  <div className="mb-8 flex items-center gap-3">
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBackground}`}>
      {icon}
    </div>
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  </div>
);

export default DownloadAppPage;
