import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT ?? 3001;

  // Глобальный обработчик ошибок (должен быть первым!)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Глобальный интерцептор для сериализации BigInt в строки
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  // Middleware для логирования всех входящих запросов
  app.use((req, res, next) => {
    const logger = new Logger('Request');
    logger.log(`${req.method} ${req.path} - URL: ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
    next();
  });

  // Глобальная валидация DTO (с исключением для multipart/form-data)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет свойства, которых нет в DTO
      forbidNonWhitelisted: true, // Выбрасывает ошибку, если есть лишние свойства
      transform: true, // Автоматически преобразует типы
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
    }),
  );

  // Разрешаем CORS для фронтенда
  // В production разрешаем все origins (или конкретный Vercel URL)
  const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : process.env.NODE_ENV === 'production'
    ? '*' // Разрешаем все в production
    : 'http://localhost:3000';
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
    ],
    // Разрешаем загрузку файлов - не указываем Content-Type в allowedHeaders для multipart/form-data
    exposedHeaders: ['Content-Disposition', 'Content-Type'],
    maxAge: 3600, // Кеширование preflight запросов на 1 час
  });

  const logger = new Logger('Bootstrap');

  try {
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📡 API endpoints available at: http://localhost:${port}/`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${port} is already in use.`);
      logger.error(`💡 Trying to free port ${port}...`);

      // Попытка автоматически освободить порт (только на Windows)
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
          const lines = result.trim().split('\n');
          const pids = new Set<string>();

          for (const line of lines) {
            const match = line.trim().split(/\s+/).pop();
            if (match && !isNaN(Number(match))) {
              pids.add(match);
            }
          }

          for (const pid of pids) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              logger.log(`✅ Stopped process PID ${pid}`);
            } catch (e) {
              // Игнорируем ошибки
            }
          }

          // Ждем освобождения порта и пробуем снова
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await app.listen(port);
          logger.log(`🚀 Application is running on: http://localhost:${port}`);
          return;
        } catch (autoFreeError) {
          // Если автоматическое освобождение не удалось
        }
      }

      logger.error(`❌ Could not free port ${port}. Please stop the application using this port manually.`);
      logger.error(`   On Windows: netstat -ano | findstr :${port}`);
      logger.error(`   Then: taskkill /F /PID <PID>`);
      process.exit(1);
    }
    throw error;
  }
}
bootstrap();
