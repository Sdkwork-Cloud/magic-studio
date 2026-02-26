
import React from 'react';
import { useSettingsStore } from '@sdkwork/react-settings';
import { PortalPage } from '@sdkwork/react-portal-video';

const HomePage: React.FC = () => {
  const { isLoading } = useSettingsStore();

  if (isLoading) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#050505] text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return <PortalPage />;
};

export default HomePage;
