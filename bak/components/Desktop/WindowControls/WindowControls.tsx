
import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { platform } from '../../../platform';

const WindowControls: React.FC = () => {
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
        className="h-full w-[46px] flex items-center justify-center text-gray-400 hover:bg-[#c42b1c] hover:text-white transition-colors focus:outline-none"
        title="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default WindowControls;
