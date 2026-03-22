type LogContext = Record<string, unknown>;

export class Logger {
  info(message: string, context?: LogContext): void {
    if (context) {
      console.info(message, context);
    } else {
      console.info(message);
    }
  }

  error(message: string, context?: LogContext): void {
    if (context) {
      console.error(message, context);
    } else {
      console.error(message);
    }
  }
}
