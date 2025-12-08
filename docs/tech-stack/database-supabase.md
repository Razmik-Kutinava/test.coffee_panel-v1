# Database: Supabase

## Overview

Supabase - open-source альтернатива Firebase, предоставляющая managed PostgreSQL базу данных с connection pooling и дополнительными сервисами.

## Quick Reference

```bash
# Применить миграции через Supabase CLI
supabase db push

# Открыть Supabase Dashboard
# https://app.supabase.com
```

## Connection Strings

### DATABASE_URL (Pooler)

Используется для обычных запросов через Prisma.

```env
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Характеристики:**
- Порт: **6543** (pooler)
- Параметр: `?pgbouncer=true`
- Использование: Prisma queries

### DIRECT_URL (Direct Connection)

Используется для миграций и DDL операций.

```env
DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Характеристики:**
- Порт: **5432** (direct)
- Параметр: `?sslmode=require`
- Использование: `prisma db push`, миграции

## Настройка в Prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Supabase Dashboard

### Доступ

1. Открыть https://app.supabase.com
2. Выбрать проект
3. Перейти в **Database** → **Tables**

### Просмотр данных

- **Table Editor** - визуальный редактор таблиц
- **SQL Editor** - выполнение SQL запросов
- **Database** → **Connection Pooling** - настройки пула

## Supabase CLI

### Установка

```bash
npm install -g supabase
```

### Команды

```bash
# Логин
supabase login

# Инициализация проекта
supabase init

# Применить миграции
supabase db push

# Создать миграцию
supabase migration new migration_name
```

## Connection Pooling

Supabase предоставляет два типа подключений:

### 1. Session Mode (порт 5432)
- Прямое подключение
- Подходит для миграций
- Используется в `DIRECT_URL`

### 2. Transaction Mode (порт 6543)
- Connection pooling
- Подходит для запросов
- Используется в `DATABASE_URL`

## SSL

Supabase требует SSL соединение.

```env
DIRECT_URL="...?sslmode=require"
```

## Common Issues

### Ошибка: "P1001: Can't reach database server"

**Причина:** Неправильный хост или порт

**Решение:**
- Проверить `DIRECT_URL` (порт 5432)
- Проверить `DATABASE_URL` (порт 6543)
- Убедиться, что используется правильный регион

### Ошибка: "P1000: Authentication failed"

**Причина:** Неправильный пароль или проект

**Решение:**
- Проверить пароль в `.env`
- Убедиться, что используется правильный `PROJECT` ID

### Ошибка: "Connection timeout"

**Причина:** Проблемы с сетью или firewall

**Решение:**
- Проверить интернет соединение
- Проверить firewall настройки
- Попробовать другой регион

## Best Practices

### 1. Использовать правильные URL

```env
# ✅ ПРАВИЛЬНО
DATABASE_URL="...:6543/...?pgbouncer=true"
DIRECT_URL="...:5432/...?sslmode=require"

# ❌ НЕПРАВИЛЬНО
DATABASE_URL="...:5432/..."  # Не использовать direct для queries
DIRECT_URL="...:6543/..."    # Не использовать pooler для миграций
```

### 2. Хранить секреты безопасно

```env
# ✅ ПРАВИЛЬНО - в .env (не коммитить!)
DATABASE_URL="..."

# ❌ НЕПРАВИЛЬНО - в коде
const url = "postgresql://...";
```

### 3. Использовать переменные окружения

```typescript
// ✅ ПРАВИЛЬНО
const url = process.env.DATABASE_URL;

// ❌ НЕПРАВИЛЬНО
const url = "hardcoded-url";
```

## Related Docs

- [Database Prisma](./database-prisma.md)
- [Environment Setup](./environment-setup.md)
- [ARM64 Compatibility](./arm64-compatibility.md)

