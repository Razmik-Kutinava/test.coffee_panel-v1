# Database: Prisma

## Overview

Prisma - современный ORM для TypeScript и Node.js. Обеспечивает type-safe доступ к базе данных через автогенерируемые типы.

## Quick Reference

```bash
# Генерация Prisma Client
npx prisma generate

# Применение изменений схемы
npx prisma db push

# Открыть Prisma Studio
npx prisma studio
```

## Schema Syntax

### Базовая модель

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Типы полей

- `String` - текст
- `Int` - целое число
- `Float` - число с плавающей точкой
- `Boolean` - true/false
- `DateTime` - дата и время
- `String?` - опциональное поле (nullable)

### Декораторы

- `@id` - первичный ключ
- `@default(autoincrement())` - автоинкремент
- `@default(now())` - текущая дата/время
- `@updatedAt` - автоматическое обновление
- `@unique` - уникальное значение
- `@map("column_name")` - маппинг на имя колонки

## Связи между таблицами

### One-to-Many

```prisma
model User {
  id     Int      @id @default(autoincrement())
  email  String   @unique
  posts  Post[]
}

model Post {
  id     Int   @id @default(autoincrement())
  title  String
  userId Int
  user   User  @relation(fields: [userId], references: [id])
}
```

### Many-to-Many

```prisma
model Post {
  id       Int      @id @default(autoincrement())
  title    String
  tags     Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

### One-to-One

```prisma
model User {
  id      Int       @id @default(autoincrement())
  email   String    @unique
  profile Profile?
}

model Profile {
  id     Int   @id @default(autoincrement())
  bio    String?
  userId Int   @unique
  user   User  @relation(fields: [userId], references: [id])
}
```

## Queries

### Create

```typescript
// Один объект
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John',
  },
});

// Несколько объектов
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com' },
    { email: 'user2@example.com' },
  ],
});
```

### Read

```typescript
// Найти все
const users = await prisma.user.findMany();

// Найти один
const user = await prisma.user.findUnique({
  where: { id: 1 },
});

// Найти первый
const user = await prisma.user.findFirst({
  where: { email: 'user@example.com' },
});

// С фильтрацией
const users = await prisma.user.findMany({
  where: {
    email: { contains: '@gmail.com' },
    name: { not: null },
  },
});

// С сортировкой
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
});

// С пагинацией
const users = await prisma.user.findMany({
  skip: 0,
  take: 10,
});

// С включением связей
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true,
  },
});
```

### Update

```typescript
// Обновить один
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane' },
});

// Обновить несколько
const result = await prisma.user.updateMany({
  where: { email: { contains: '@gmail.com' } },
  data: { isActive: true },
});

// Upsert (создать или обновить)
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated' },
  create: { email: 'user@example.com', name: 'New' },
});
```

### Delete

```typescript
// Удалить один
const user = await prisma.user.delete({
  where: { id: 1 },
});

// Удалить несколько
const result = await prisma.user.deleteMany({
  where: { isActive: false },
});
```

## Фильтры

### Операторы сравнения

```typescript
where: {
  age: { gt: 18 },        // больше
  age: { gte: 18 },       // больше или равно
  age: { lt: 65 },        // меньше
  age: { lte: 65 },       // меньше или равно
  age: { equals: 25 },    // равно
  age: { not: 25 },       // не равно
}
```

### Строковые операторы

```typescript
where: {
  email: { contains: '@gmail.com' },
  email: { startsWith: 'user' },
  email: { endsWith: '.com' },
  email: { equals: 'user@example.com', mode: 'insensitive' },
}
```

### Логические операторы

```typescript
where: {
  AND: [
    { age: { gte: 18 } },
    { isActive: true },
  ],
  OR: [
    { email: { contains: '@gmail.com' } },
    { email: { contains: '@yahoo.com' } },
  ],
  NOT: { isDeleted: true },
}
```

## Транзакции

```typescript
const result = await prisma.$transaction([
  prisma.user.create({
    data: { email: 'user@example.com' },
  }),
  prisma.post.create({
    data: { title: 'Post', userId: 1 },
  }),
]);
```

## PrismaService

В проекте используется кастомный `PrismaService` с lazy initialization.

```typescript
// ✅ ПРАВИЛЬНО
constructor(private prisma: PrismaService) {}

async findAll() {
  return this.prisma.product.findMany();
}

// ❌ НЕПРАВИЛЬНО
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

## Common Issues

### Ошибка: "Table does not exist"

**Причина:** Не выполнен `npx prisma db push`

**Решение:**
```bash
npx prisma db push
```

### Ошибка: "Property 'entity' does not exist"

**Причина:** Не выполнен `npx prisma generate`

**Решение:**
```bash
npx prisma generate
```

### Ошибка: "P1000: Authentication failed"

**Причина:** Неправильный `DIRECT_URL` в `.env`

**Решение:** Проверить `.env` файл, порт должен быть 5432

## Related Docs

- [Database Supabase](./database-supabase.md)
- [ARM64 Compatibility](./arm64-compatibility.md)
- [Workflow: Add New Entity](../workflows/add-new-entity.md)

