export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
    level: LogLevel;
    prefix: string;
    enabled: boolean;
    showTimestamp?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

export class Logger {
    private config: LoggerConfig;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            level: 'debug',
            prefix: '[App]',
            enabled: true,
            showTimestamp: false,
            ...config
        };
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = this.config.showTimestamp ? `[${new Date().toISOString()}] ` : '';
        return `${timestamp}${this.config.prefix} [${level.toUpperCase()}] ${message}`;
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message), ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message), ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message), ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message), ...args);
        }
    }

    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    setPrefix(prefix: string): void {
        this.config.prefix = prefix;
    }

    enable(): void {
        this.config.enabled = true;
    }

    disable(): void {
        this.config.enabled = false;
    }

    child(prefix: string): Logger {
        return new Logger({
            ...this.config,
            prefix: `${this.config.prefix}${prefix}`
        });
    }
}

export const logger = new Logger();

export const createLogger = (prefix: string, config?: Partial<LoggerConfig>): Logger => {
    return new Logger({
        prefix,
        ...config
    });
};

export default Logger;
