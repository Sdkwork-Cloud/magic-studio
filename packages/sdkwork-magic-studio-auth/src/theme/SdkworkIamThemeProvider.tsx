import React, { PropsWithChildren, useEffect, useState } from 'react';
import { SdkworkThemeProvider } from '@sdkwork/ui-pc-react/theme';

type IamColorMode = 'dark' | 'light';

function resolveIamColorMode(): IamColorMode {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

export interface SdkworkIamThemeProviderProps extends PropsWithChildren {
  className?: string;
}

export function SdkworkIamThemeProvider({
  children,
  className,
}: SdkworkIamThemeProviderProps) {
  const [colorMode, setColorMode] = useState<IamColorMode>(() => resolveIamColorMode());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncColorMode = () => {
      setColorMode(resolveIamColorMode());
    };

    const observer = new MutationObserver(syncColorMode);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    mediaQuery.addEventListener?.('change', syncColorMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener?.('change', syncColorMode);
    };
  }, []);

  // Shared identity views should follow the host application color mode while keeping
  // the SDKWORK claw preset untouched so host auth/user pages stay visually aligned.
  return (
    <SdkworkThemeProvider
      className={['magic-iam-theme', className].filter(Boolean).join(' ')}
      key={colorMode}
      defaultTheme={colorMode}
    >
      {children as never}
    </SdkworkThemeProvider>
  );
}
