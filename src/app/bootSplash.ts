const BOOT_SPLASH_ID = 'boot-splash';
const BOOT_SPLASH_TRANSITION_MS = 240;

const getBootSplashElement = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.getElementById(BOOT_SPLASH_ID) as HTMLElement | null;
};

const fadeAndRemoveBootSplash = (): void => {
  const splash = getBootSplashElement();
  if (!splash || splash.dataset.state === 'ready') {
    return;
  }

  const removeSplash = () => {
    splash.remove();
  };

  const timeoutId = window.setTimeout(removeSplash, BOOT_SPLASH_TRANSITION_MS + 80);
  splash.addEventListener(
    'transitionend',
    () => {
      window.clearTimeout(timeoutId);
      removeSplash();
    },
    { once: true },
  );

  splash.dataset.state = 'ready';
};

export const dismissBootSplashAfterPaint = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!getBootSplashElement()) {
    return;
  }

  const scheduleFrame =
    typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 16);

  scheduleFrame(() => {
    scheduleFrame(() => {
      fadeAndRemoveBootSplash();
    });
  });
};
