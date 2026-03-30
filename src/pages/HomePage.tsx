
import React, { Suspense, lazy } from 'react';
import { useTranslation } from '@sdkwork/react-i18n';

const PortalPage = lazy(() => import('@sdkwork/react-portal-video/pages/PortalPage'));

const LoadingFallback = () => {
    const { t } = useTranslation();

    return (
        <div className="app-loading-screen w-full h-full flex items-center justify-center gap-3">
            <div className="app-loading-spinner w-6 h-6 rounded-full animate-spin" />
            <span className="text-xs font-medium">{t('appShell.loading')}</span>
        </div>
    );
};

const HomePage: React.FC = () => {
  return (
      <Suspense fallback={<LoadingFallback />}>
          <PortalPage />
      </Suspense>
  );
};

export default HomePage;
