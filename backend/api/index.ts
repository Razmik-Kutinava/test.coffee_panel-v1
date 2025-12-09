import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';

const server: Express = express();

let app: INestApplication | null = null;

async function bootstrap(): Promise<express.Express> {
  if (!app) {
    // Устанавливаем env переменную для определения serverless
    process.env.VERCEL = '1';
    
    app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    
    // Global filters and pipes
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS for frontend (allow all origins for Vercel)
    app.enableCors({
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    await app.init();
    console.log('✅ NestJS app initialized for Vercel');
  }
  return server;
}

// Vercel serverless handler
export default async function handler(req: Request, res: Response) {
  const expressServer = await bootstrap();
  return expressServer(req, res);
}

