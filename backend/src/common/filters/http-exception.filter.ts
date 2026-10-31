import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;

    // El detalle por campo de la validación también llega al cliente.
    const errors =
      typeof exceptionResponse === 'object' && 'errors' in exceptionResponse
        ? (exceptionResponse as { errors?: unknown }).errors
        : undefined;

    const errorResponse = {
      statusCode: status,
      message: message,
      ...(errors !== undefined ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
