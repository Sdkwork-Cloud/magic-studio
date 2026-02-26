
/**
 * MagicCut Logger
 * Re-exports the universal logger with MagicCut-specific prefix
 */

import { createLogger } from '@sdkwork/react-commons';

// Create a MagicCut-specific logger instance
export const logger = createLogger('[MagicCut]');

// Re-export types and class from universal logger
export { Logger, createLogger, type LogLevel, type LoggerConfig } from '@sdkwork/react-commons';

