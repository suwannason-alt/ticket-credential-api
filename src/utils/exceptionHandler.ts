import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SaveAppLog } from '../utils/logger';

@Catch()
export class ExceptionHandle implements ExceptionFilter {
  private logger: SaveAppLog;

  constructor(logger?: SaveAppLog) {
    this.logger = logger ?? new SaveAppLog('ExceptionHandle');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorPayload: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        errorPayload = res as Record<string, any>;
        message = errorPayload.message ?? message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      errorPayload = { name: exception.name };
    }

    this.logger.error(
      String(message),
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionHandle',
      {
        method: request.method,
        path: request.url,
        query: request.query,
        body: request.body,
        ...errorPayload,
      },
    );

    const body = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(typeof errorPayload === 'object' ? errorPayload : {}),
    };

    response.status(status).json(body);
  }
}
