# Environment Setup

## Overview

Настройка переменных окружения для работы проекта с Supabase и NestJS.

## Quick Reference

```bash
# Создать .env файл
cp .env.example .env

# Проверить переменные
cat .env
```

## .env файл

### Структура

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase API
SUPABASE_URL="https://PROJECT.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# NestJS
PORT=3001
NODE_ENV=development
JWT_SECRET="your-secret-key-here"
FRONTEND_URL="http://localhost:3000"
```

### Описание переменных

#### DATABASE_URL
- **Назначение:** Connection pooler для Prisma queries
- **Порт:** 6543
- **Параметры:** `?pgbouncer=true`
- **Использование:** Обычные запросы к БД

#### DIRECT_URL
- **Назначение:** Прямое подключение для миграций
- **Порт:** 5432
- **Параметры:** `?sslmode=require`
- **Использование:** `prisma db push`, DDL операции

#### SUPABASE_URL
- **Назначение:** URL Supabase проекта
- **Формат:** `https://PROJECT.supabase.co`
- **Где найти:** Supabase Dashboard → Settings → API

#### SUPABASE_ANON_KEY
- **Назначение:** Публичный ключ для клиентских запросов
- **Где найти:** Supabase Dashboard → Settings → API → anon public

#### SUPABASE_SERVICE_ROLE_KEY
- **Назначение:** Привилегированный ключ для серверных операций
- **⚠️ ВАЖНО:** Не использовать на клиенте!
- **Где найти:** Supabase Dashboard → Settings → API → service_role secret

#### PORT
- **Назначение:** Порт для NestJS приложения
- **По умолчанию:** 3001

#### NODE_ENV
- **Назначение:** Окружение (development/production)
- **Значения:** `development`, `production`, `test`

#### JWT_SECRET
- **Назначение:** Секретный ключ для JWT токенов
- **⚠️ ВАЖНО:** Использовать сильный случайный ключ

#### FRONTEND_URL
- **Назначение:** URL фронтенд приложения
- **Использование:** CORS настройки

## Получение значений из Supabase

### 1. DATABASE_URL и DIRECT_URL

1. Открыть Supabase Dashboard
2. Перейти в **Settings** → **Database**
3. Найти **Connection string**
4. Выбрать **Connection pooling** (для DATABASE_URL)
5. Выбрать **Direct connection** (для DIRECT_URL)

**Формат:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. SUPABASE_URL и Keys

1. Открыть Supabase Dashboard
2. Перейти в **Settings** → **API**
3. Скопировать:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## Настройка в Prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Безопасность

### ✅ DO

- Хранить `.env` в `.gitignore`
- Использовать разные ключи для dev/prod
- Регулярно ротировать секреты
- Использовать переменные окружения в production

### ❌ DON'T

- Коммитить `.env` в git
- Использовать `SUPABASE_SERVICE_ROLE_KEY` на клиенте
- Хардкодить секреты в коде
- Делиться секретами публично

## .gitignore

```gitignore
# Environment
.env
.env.local
.env.*.local
```

## Проверка настроек

### Тест подключения к БД

```bash
cd backend
npx prisma db push
```

**Если успешно:** ✅ База данных подключена

**Если ошибка:** Проверить `DIRECT_URL` в `.env`

### Тест Prisma Client

```bash
npx prisma generate
```

**Если успешно:** ✅ Prisma Client сгенерирован

## Common Issues

### Ошибка: "P1000: Authentication failed"

**Причина:** Неправильный пароль в `DIRECT_URL`

**Решение:**
1. Проверить пароль в Supabase Dashboard
2. Обновить `DIRECT_URL` в `.env`
3. Убедиться, что используется правильный `PROJECT` ID

### Ошибка: "P1001: Can't reach database server"

**Причина:** Неправильный хост или порт

**Решение:**
- Проверить регион в URL (например, `aws-1-ap-south-1`)
- Проверить порт (6543 для DATABASE_URL, 5432 для DIRECT_URL)

### Ошибка: "Environment variable not found"

**Причина:** Переменная не определена в `.env`

**Решение:**
1. Проверить наличие `.env` файла
2. Проверить имя переменной
3. Перезапустить приложение

## Related Docs

- [Database Supabase](./database-supabase.md)
- [ARM64 Compatibility](./arm64-compatibility.md)
- [Backend NestJS](./backend-nestjs.md)

