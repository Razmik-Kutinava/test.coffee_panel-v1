# DevOps Engineer

## Роль

Настройка CI/CD, деплой, мониторинг, управление инфраструктурой.

## Ответственность

- Настройка CI/CD
- Деплой приложений
- Мониторинг
- Управление environment variables
- Настройка Supabase

## Deployment

### Vercel

1. Подключить репозиторий
2. Настроить environment variables
3. Настроить build settings

### Environment Variables

```env
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
NODE_ENV=production
```

## CI/CD

### GitHub Actions

```yaml
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

## Monitoring

### Health Checks

```typescript
@Get('health')
check() {
  return { status: 'ok' };
}
```

### Logging

- Настроить централизованное логирование
- Мониторинг ошибок (Sentry)
- Метрики производительности

## Related Docs

- [Deployment](../workflows/deployment.md)
- [Environment Setup](../tech-stack/environment-setup.md)

