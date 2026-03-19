
import React, { useEffect, useState } from 'react';
import { Copy, Minus, Square, X } from 'lucide-react';
import { windowControlService } from '../../../services/windowControlService';

export const WindowControls: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(() => windowControlService.isAvailable());
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const available = windowControlService.isAvailable();
    setIsAvailable(available);

    if (!available) {
      setIsMaximized(false);
      return;
    }

    const syncWindowState = async (): Promise<void> => {
      setIsMaximized(await windowControlService.isMaximized());
    };

    void syncWindowState();

    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = (): void => {
      void syncWindowState();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAvailable) {
    return null;
  }

  const handleMinimize = async (): Promise<void> => {
    await windowControlService.minimize();
  };

  const handleMaximize = async (): Promise<void> => {
    const nextIsMaximized = await windowControlService.maximize();
    setIsMaximized(nextIsMaximized);
  };

  const handleClose = async (): Promise<void> => {
    await windowControlService.close();
  };

  const frameButtonClassName =
    'group/window-control flex h-10 w-12 items-center justify-center text-[#6b7280] transition-all duration-150 hover:bg-black/5 hover:text-[#111827] active:bg-black/10 dark:text-[#9ca3af] dark:hover:bg-white/8 dark:hover:text-white dark:active:bg-white/12';

  const closeButtonClassName =
    'group/window-control flex h-10 w-12 items-center justify-center text-[#6b7280] transition-all duration-150 hover:bg-[#e81123] hover:text-white active:bg-[#c50f1f] dark:text-[#9ca3af]';

  const MaximizeIcon = isMaximized ? Copy : Square;
  const maximizeTitle = isMaximized ? 'Restore' : 'Maximize';

  return (
    <div className="window-controls flex h-full items-center border-l border-black/5 bg-white/75 backdrop-blur-xl dark:border-white/5 dark:bg-[#050505]/70">
      <button
        onClick={() => void handleMinimize()}
        className={frameButtonClassName}
        aria-label="Minimize"
        title="Minimize"
      >
        <Minus size={14} className="transition-transform duration-150 group-hover/window-control:scale-105" />
      </button>

      <button
        onClick={() => void handleMaximize()}
        className={frameButtonClassName}
        aria-label={maximizeTitle}
        title={maximizeTitle}
      >
        <MaximizeIcon size={isMaximized ? 13 : 12} className="transition-transform duration-150 group-hover/window-control:scale-105" />
      </button>

      <button
        onClick={() => void handleClose()}
        className={closeButtonClassName}
        aria-label="Close"
        title="Close"
      >
        <X size={14} className="transition-transform duration-150 group-hover/window-control:scale-105" />
      </button>
    </div>
  );
};
