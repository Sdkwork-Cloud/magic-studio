
/**
 * Environment Configuration Manager
 * 
 * Supports multiple environment files:
 * - .env.development - Development environment
 * - .env.staging - Staging environment
 * - .env.production - Production environment
 * - .env.local - Local overrides (gitignored)
 * - .env.example - Template for new developers
 */

// Environment type definition
export type AppEnv = 'development' | 'staging' | 'production';

// Feature flags interface
export interface FeatureFlags {
  analytics: boolean;
  notifications: boolean;
  websocket: boolean;
  cache: boolean;
}

// API Configuration interface
export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  imBaseUrl: string;
  timeout: number;
}

// Complete environment configuration interface
export interface EnvConfig {
  // Application
  appEnv: AppEnv;
  isDev: boolean;
  isStaging: boolean;
  isProduction: boolean;
  
  // API Configuration
  api: ApiConfig;
  
  // Authentication
  accessToken: string;
  
  // Debug Settings
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Feature Flags
  features: FeatureFlags;
  
  // Platform
  platform: 'web' | 'tauri' | 'electron' | 'mobile';
  isTauri: boolean;
}

// Get environment variables with type safety
function getEnvVar(key: string, defaultValue?: string): string {
  const value = (import.meta as any).env?.[key] ?? defaultValue;
  if (value === undefined) {
    console.warn(`[Env] Missing environment variable: ${key}`);
  }
  return value ?? '';
}

function getEnvVarBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, String(defaultValue));
  return value === 'true' || value === '1';
}

function getEnvVarNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key, String(defaultValue));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Detect if running in Tauri
function detectTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// Detect platform
function detectPlatform(): EnvConfig['platform'] {
  if (detectTauri()) return 'tauri';
  return (getEnvVar('VITE_PLATFORM', 'web') as EnvConfig['platform']);
}

// Get current environment
function detectEnv(): AppEnv {
  const env = getEnvVar('VITE_APP_ENV', 'development');
  if (env === 'production' || env === 'staging') return env;
  return 'development';
}

// Build environment configuration
function buildEnvConfig(): EnvConfig {
  const appEnv = detectEnv();
  const isDev = appEnv === 'development';
  const isStaging = appEnv === 'staging';
  const isProduction = appEnv === 'production';
  
  return {
    // Application
    appEnv,
    isDev,
    isStaging,
    isProduction,
    
    // API Configuration
    api: {
      baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8080'),
      wsUrl: getEnvVar('VITE_WS_URL', 'ws://localhost:8080/ws'),
      imBaseUrl: getEnvVar('VITE_IM_API_BASE_URL', 'http://localhost:8081'),
      timeout: getEnvVarNumber('VITE_TIMEOUT', 30000),
    },
    
    // Authentication
    accessToken: getEnvVar('VITE_ACCESS_TOKEN', ''),
    
    // Debug Settings
    debug: getEnvVarBoolean('VITE_DEBUG', isDev),
    logLevel: (getEnvVar('VITE_LOG_LEVEL', isDev ? 'debug' : 'warn') as EnvConfig['logLevel']),
    
    // Feature Flags
    features: {
      analytics: getEnvVarBoolean('VITE_FEATURE_ANALYTICS', isProduction),
      notifications: getEnvVarBoolean('VITE_FEATURE_NOTIFICATIONS', true),
      websocket: getEnvVarBoolean('VITE_FEATURE_WEBSOCKET', true),
      cache: getEnvVarBoolean('VITE_FEATURE_CACHE', isProduction || isStaging),
    },
    
    // Platform
    platform: detectPlatform(),
    isTauri: detectTauri(),
  };
}

// Export singleton environment configuration
export const ENV = buildEnvConfig();

// Export environment-specific utilities
export const EnvUtils = {
  /**
   * Check if current environment matches target
   */
  is(env: AppEnv): boolean {
    return ENV.appEnv === env;
  },
  
  /**
   * Check if any feature is enabled
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return ENV.features[feature];
  },
  
  /**
   * Get API URL with optional path
   */
  getApiUrl(path: string = ''): string {
    const base = ENV.api.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${base}/${cleanPath}` : base;
  },

  /**
   * Get IM API URL with optional path
   */
  getImApiUrl(path: string = ''): string {
    const base = ENV.api.imBaseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${base}/${cleanPath}` : base;
  },
  
  /**
   * Log message only in development
   */
  devLog(...args: any[]): void {
    if (ENV.isDev && ENV.debug) {
      console.log('[Dev]', ...args);
    }
  },
  
  /**
   * Get full WebSocket URL with optional path
   */
  getWsUrl(path: string = ''): string {
    const base = ENV.api.wsUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${base}/${cleanPath}` : base;
  },

  /**
   * Get SDK initialization configuration
   */
  getSdkConfig(): { baseUrl: string; accessToken: string; timeout: number } {
    return {
      baseUrl: ENV.api.baseUrl,
      accessToken: ENV.accessToken,
      timeout: ENV.api.timeout,
    };
  },
};

// Default export for convenience
export default ENV;
