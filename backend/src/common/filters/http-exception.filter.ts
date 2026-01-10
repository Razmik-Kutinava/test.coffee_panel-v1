import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Проверяем, является ли это ошибкой Prisma
    const isPrismaError = exception instanceof Error && 
      (exception.message.includes('Prisma') || 
       exception.message.includes('query_engine') ||
       exception.message.includes('not a valid Win32 application') ||
       exception.name === 'PrismaClientInitializationError');

    let message: any;
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      // Если это ошибка валидации, форматируем сообщение более понятно
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const validationMessage = (response as any).message;
        if (Array.isArray(validationMessage)) {
          // Это массив ошибок валидации
          message = {
            error: 'Validation failed',
            details: validationMessage,
            message: validationMessage.map((m: any) => 
              typeof m === 'string' ? m : m.toString()
            ).join(', '),
          };
        } else {
          message = response;
        }
      } else {
        message = response;
      }
    } else if (exception instanceof Error) {
      if (isPrismaError) {
        // Специальная обработка для ошибок Prisma
        message = {
          error: 'Prisma Database Connection Error',
          details: exception.message.includes('not a valid Win32 application') 
            ? 'Prisma engine несовместим с вашей системой (Windows ARM64). Установите Node.js x64 версию или используйте Docker/WSL.'
            : exception.message,
          solution: exception.message.includes('not a valid Win32 application')
            ? {
                option1: 'Установите Node.js x64 версию с https://nodejs.org/',
                option2: 'Используйте Docker: docker-compose up',
                option3: 'Используйте WSL (Windows Subsystem for Linux)',
              }
            : 'Проверьте настройки DATABASE_URL в .env файле',
        };
      } else {
        message = exception.message;
      }
    } else {
      message = 'Internal server error';
    }

    // Логируем полную ошибку для отладки
    this.logger.error(
      `❌ ${request.method} ${request.url} - Status: ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // В development режиме возвращаем детальную информацию об ошибке
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: isDevelopment && exception instanceof Error && !isPrismaError
        ? {
            error: exception.message,
            stack: exception.stack,
            name: exception.name,
          }
        : message,
    });
  }
}

