
import React, { Suspense, lazy } from 'react';
import { useSettingsStore } from '@sdkwork/react-settings';

const PortalPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.PortalPage })));

const LoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#050505] text-gray-500 gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Loading...</span>
    </div>
);

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
