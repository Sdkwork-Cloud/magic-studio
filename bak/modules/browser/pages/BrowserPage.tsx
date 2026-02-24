
import React from 'react';
import { BrowserStoreProvider } from '../store/browserStore';
import { BrowserTabs } from '../components/BrowserTabs';
import { AddressBar } from '../components/AddressBar';
import { BrowserViewport } from '../components/BrowserViewport';

const BrowserContent: React.FC = () => {
    return (
        <div className="flex flex-col w-full h-full bg-[#1e1e1e] overflow-hidden">
            <BrowserTabs />
            <AddressBar />
            <BrowserViewport />
        </div>
    );
};

const BrowserPage: React.FC = () => {
  return (
      <BrowserStoreProvider>
          <BrowserContent />
      </BrowserStoreProvider>
  );
};

export default BrowserPage;
