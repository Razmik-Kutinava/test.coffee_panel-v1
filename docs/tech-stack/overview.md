# Tech Stack Overview

## Overview

Проект использует современный стек для создания масштабируемого backend API с типизированной работой с базой данных.

## Архитектура

```
┌─────────────────┐
│   SolidJS       │  Frontend (планируется)
│   (TypeScript)  │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   NestJS 10     │  Backend Framework
│   (TypeScript)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Prisma 5      │  ORM Layer
│   (TypeScript)  │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│   Supabase      │  PostgreSQL Database
│   PostgreSQL    │
└─────────────────┘
```

## Компоненты

### Backend: NestJS 10
- **Версия:** 11.0.1
- **Роль:** REST API framework
- **Особенности:**
  - Модульная архитектура
  - Dependency Injection
  - Decorators для валидации
  - TypeScript strict mode

**Документация:** [backend-nestjs.md](./backend-nestjs.md)

### Database: Prisma 5
- **Версия:** 5.22.0 (критично!)
- **Роль:** Type-safe ORM
- **Особенности:**
  - Schema-first подход
  - Автогенерация типов
  - Миграции через `db push`
  - Lazy initialization для ARM64

**Документация:** [database-prisma.md](./database-prisma.md)

### Database Host: Supabase
- **Роль:** PostgreSQL hosting
- **Особенности:**
  - Connection pooling (порт 6543)
  - Direct connection (порт 5432)
  - SSL required
  - Supabase CLI

**Документация:** [database-supabase.md](./database-supabase.md)

### Frontend: SolidJS (планируется)
- **Роль:** Reactive UI framework
- **Особенности:**
  - Fine-grained reactivity
  - TypeScript support
  - Small bundle size

**Документация:** [frontend-solidjs.md](./frontend-solidjs.md)

## Технологический стек

| Компонент | Технология | Версия | Статус |
|-----------|-----------|--------|--------|
| Backend Framework | NestJS | 11.0.1 | ✅ Активно |
| ORM | Prisma | 5.22.0 | ✅ Активно |
| Database | PostgreSQL | (Supabase) | ✅ Активно |
| Language | TypeScript | 5.9.3 | ✅ Активно |
| Validation | class-validator | 0.14.3 | ✅ Активно |
| Frontend | SolidJS | - | 🔄 Планируется |
| Deployment | Vercel | - | 🔄 Планируется |

## Почему этот стек?

### NestJS
- ✅ Модульная архитектура
- ✅ TypeScript из коробки
- ✅ Готовые паттерны (DI, Guards, Interceptors)
- ✅ Отличная документация

### Prisma 5 (не 7!)
- ✅ Type-safe queries
- ✅ Автогенерация типов
- ✅ Миграции через `db push` (проще для Supabase)
- ⚠️ Prisma 7 имеет проблемы с ARM64 Windows

### Supabase
- ✅ Managed PostgreSQL
- ✅ Connection pooling
- ✅ Supabase CLI
- ✅ Бесплатный tier

### SolidJS
- ✅ Лучшая производительность чем React
- ✅ Меньший bundle size
- ✅ Fine-grained reactivity
- ✅ TypeScript support

## Связь компонентов

### 1. Schema → Types
```prisma
// schema.prisma
model User {
  id Int @id
}
```
↓
```typescript
// Автогенерируется в node_modules/.prisma/client
export type User = { id: number }
```

### 2. Types → DTO
```typescript
// DTO создается вручную на основе типов
export class CreateUserDto {
  @IsString()
  email: string;
}
```

### 3. DTO → Service
```typescript
// Service использует PrismaService
async create(dto: CreateUserDto) {
  return this.prisma.user.create({ data: dto });
}
```

### 4. Service → Controller
```typescript
// Controller вызывает Service
@Post()
create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

## Quick Reference

### Установка зависимостей
```bash
cd backend
npm install
```

### Запуск проекта
```bash
npm run start:dev
```

### Генерация Prisma Client
```bash
npx prisma generate
```

### Применение изменений схемы
```bash
npx prisma db push
```

## Related Docs

- [Backend NestJS](./backend-nestjs.md)
- [Database Prisma](./database-prisma.md)
- [Database Supabase](./database-supabase.md)
- [Frontend SolidJS](./frontend-solidjs.md)
- [ARM64 Compatibility](./arm64-compatibility.md)

