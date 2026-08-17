import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | object = 'Internal server error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || exceptionResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      method: request.method,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}
