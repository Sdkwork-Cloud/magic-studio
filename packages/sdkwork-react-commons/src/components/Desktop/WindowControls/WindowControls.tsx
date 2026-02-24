

import React from 'react';
import { Minus, Square, X } from 'lucide-react';

// Platform API will be injected at runtime
const getPlatformAPI = () => {
  if (typeof window !== 'undefined' && (window as any).__sdkworkPlatform) {
    return (window as any).__sdkworkPlatform;
  }
  return {
    minimizeWindow: () => {},
    maximizeWindow: () => {},
    closeWindow: () => {}
  };
};

export const WindowControls: React.FC = () => {
  const platform = getPlatformAPI();
  const handleMinimize = () => platform.minimizeWindow();
  const handleMaximize = () => platform.maximizeWindow();
  const handleClose = () => platform.closeWindow();

  return (
    <div className="flex items-center h-full z-50 window-controls">
      <button
        onClick={handleMinimize}
        className="h-full w-[46px] flex items-center justify-center text-gray-400 hover:bg-[#2d2d2d] hover:text-white transition-colors focus:outline-none"
        title="Minimize"
      >
        <Minus size={14} />
      </button>

      <button
        onClick={handleMaximize}
        className="h-full w-[46px] flex items-center justify-center text-gray-400 hover:bg-[#2d2d2d] hover:text-white transition-colors focus:outline-none"
        title="Maximize"
      >
        <Square size={12} />
      </button>

      <button
        onClick={handleClose}
        className="h-full w-[46px] flex items-center justify-center text-gray-400 hover:bg-[#ff5f57] hover:text-white transition-colors focus:outline-none"
        title="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
};
