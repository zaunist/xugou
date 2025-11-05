export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class Logger {
  private context: string;
  private static globalLevel: LogLevel =
    (globalThis as any).process?.env?.NODE_ENV === 'production'
      ? LogLevel.INFO
      : LogLevel.DEBUG;

  constructor(context?: string) {
    this.context = context || 'Backend';
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context?.padEnd(15) || '';
    const message = entry.message;
    const data = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';

    return `[${timestamp}] ${level} ${context} ${message}${data}`;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level < Logger.globalLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.context,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }
}

// Create a default logger instance
export const logger = new Logger();

// Export a factory function for context-specific loggers
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

export default Logger;
