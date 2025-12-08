# Workflow: Deployment

## Overview

Процесс деплоя приложения на production окружение.

## Quick Reference

```bash
# Сборка
npm run build

# Запуск production
npm run start:prod
```

## Pre-deployment Checklist

- [ ] Все тесты проходят
- [ ] Линтер не выдает ошибок
- [ ] Environment variables настроены
- [ ] Database migrations применены
- [ ] Prisma Client сгенерирован
- [ ] CORS настроен правильно
- [ ] Security проверки пройдены

## Environment Variables

### Production .env

```env
# Supabase
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NestJS
NODE_ENV=production
PORT=3001
JWT_SECRET="strong-secret-key"
FRONTEND_URL="https://yourdomain.com"
```

### Безопасность

- ✅ Использовать секреты из environment
- ✅ Не коммитить `.env` в git
- ✅ Использовать разные ключи для dev/prod
- ✅ Ротировать секреты регулярно

## Build Process

### 1. Установка зависимостей

```bash
npm ci  # Использует package-lock.json
```

### 2. Генерация Prisma Client

```bash
npx prisma generate
```

### 3. Применение миграций

```bash
npx prisma db push
# Или через Supabase CLI
supabase db push
```

### 4. Сборка

```bash
npm run build
```

### 5. Запуск

```bash
npm run start:prod
```

## Vercel Deployment

### Настройка

1. Подключить репозиторий к Vercel
2. Настроить environment variables
3. Настроить build command

### Build Settings

```
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

### Environment Variables

Добавить в Vercel Dashboard:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- И другие необходимые переменные

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Копировать package files
COPY package*.json ./
COPY prisma ./prisma/

# Установить зависимости
RUN npm ci

# Генерировать Prisma Client
RUN npx prisma generate

# Копировать исходный код
COPY . .

# Сборка
RUN npm run build

# Запуск
CMD ["npm", "run", "start:prod"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
```

## Health Checks

### Endpoint

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Использование

```bash
curl https://api.yourdomain.com/health
```

## Monitoring

### Логирование

```typescript
// main.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ...
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
```

### Error Tracking

Рассмотреть использование:
- Sentry
- LogRocket
- Datadog

## Rollback Strategy

### Если что-то пошло не так

1. Откатить deployment в Vercel/Docker
2. Проверить логи
3. Исправить проблему
4. Повторить deployment

## Best Practices

### 1. Использовать CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm test
```

### 2. Тестировать перед деплоем

```bash
# Локально
npm test
npm run build

# Затем деплой
```

### 3. Мониторить после деплоя

- Проверить health endpoint
- Проверить логи
- Проверить метрики

## Related Docs

- [Environment Setup](../tech-stack/environment-setup.md)
- [Testing Strategy](./testing-strategy.md)

