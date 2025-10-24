import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class SaveAppLog implements LoggerService {
  private classname: string;
  private enableDebug = process.env.LOG_DEBUG_ENABLED === 'true';
  private enableLog = process.env.LOG_LOG_ENABLED === 'true';
  private enableWarn = process.env.LOG_WARN_ENABLED === 'true';
  private enableError = process.env.LOG_ERROR_ENABLED === 'true';

  constructor(classname: string) {
    this.classname = classname;
  }

  private formatLog(
    level: string,
    message: string,
    context?: string,
    additional?: Record<string, any>,
  ): string {
    const logObject = {
      level: level,
      appname: process.env.APPNAME,
      servicename: process.env.SERVICE,
      context: `${this.classname}.${context}`,
      message: message,
      additional: additional,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(logObject);
  }

  log(message: string, context?: string, additional?: Record<string, any>) {
    if (!this.enableLog) return;
    console.log(this.formatLog('info', message, context, additional));
  }

  debug(...rest: unknown[]): void {
    if (!this.enableDebug) return;
    console.debug(...rest);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, any>,
  ): void {
    if (!this.enableError) return;
    console.error(
      this.formatLog('error', message, context, { trace, ...meta }),
    );
  }

  warn(message: string, context?: string, meta?: Record<string, any>): void {
    if (!this.enableWarn) return;
    console.warn(this.formatLog('warn', message, context, meta));
  }
}
