
import React, { Suspense, lazy } from 'react';
import { useSettingsStore } from '@sdkwork/magic-studio-settings';
import { useTranslation } from '@sdkwork/magic-studio-i18n';

const PortalPage = lazy(() => import('@sdkwork/magic-studio-portal-video').then(m => ({ default: m.PortalPage })));

const LoadingFallback = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#050505] text-gray-500 gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">{t('appShell.loading')}</span>
        </div>
    );
};

const HomePage: React.FC = () => {
  const { isLoading } = useSettingsStore();

  if (isLoading) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#050505] text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
      <Suspense fallback={<LoadingFallback />}>
          <PortalPage />
      </Suspense>
  );
};

export default HomePage;
